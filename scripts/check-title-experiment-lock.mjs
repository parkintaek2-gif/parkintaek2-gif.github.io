#!/usr/bin/env node
/**
 * check-title-experiment-lock.mjs — **실험이 도는 지면의 제목을 또 건드렸나**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-09-02 02:2x · 내가 내 규칙을 어겼다]
 *   `src/data/kcw-title-experiments.json` 의 첫 줄은 이렇게 적혀 있다 —
 *     「⛔ 다시 잴 날 전에 같은 지면 제목을 또 건드리면 두 변화가 섞여 아무것도 못 잰다」
 *   그런데 나는 그 줄을 읽지 않고 `/netflix-top10-data` 의 제목을 바꿨다.
 *   그 지면은 8/26 실험 묶음에 들어 있었고 다시잴날이 2026-09-24 였다.
 *   ⇒ 여덟 장 묶음 실험에서 **그 한 장은 값을 못 쓰게 됐다.**
 *
 * ⭐ 배운 것 — **규칙을 「문장」으로 두었더니 그 문장을 쓴 사람이 지나쳤다.**
 *   우리 강령 넷째 줄이 그것이다: 「규칙은 문장이 아니라 검사로 둔다.
 *   말로 하는 규칙은 잊힌다. 사람이 기억해서 지키는 구조를 만들지 않는다.」
 *   그래서 이 자를 만들었다. 이제 잠긴 지면을 건드리면 **배포 관문이 말해 준다.**
 *
 * [무엇을 재나]
 *   ① 실험 기록에서 «아직 잠긴» 지면을 뽑는다(다시잴날이 오늘보다 뒤)
 *   ② `git diff` 로 이번에 바뀐 원본 파일을 뽑는다
 *   ③ 바뀐 파일이 잠긴 지면을 만드는 자리인지 본다
 *   ⚠ 지면 주소 → 원본 파일은 «하나로 딱» 정해지지 않는다(`[...id].astro` 같은 것이 있다).
 *      그래서 이 자는 **막지 않고 말해 준다.** 잘못 잡아 배포를 멈추면 사람이 검사를 끈다.
 *
 * 쓰기:  node scripts/check-title-experiment-lock.mjs
 *        node scripts/check-title-experiment-lock.mjs --체크리스트
 *        node scripts/check-title-experiment-lock.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기록자리 = path.join(뿌리, 'src', 'data', 'kcw-title-experiments.json');

function 한국날짜(때 = new Date()) {
  return 때.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10);
}

/** 아직 잠긴 실험만. ⛔ 「없다」와 「못 읽었다」를 가른다. */
export function 잠긴것(오늘 = 한국날짜()) {
  let d;
  try { d = JSON.parse(fs.readFileSync(기록자리, 'utf8')); } catch (e) { return { 못읽음: String(e.message).slice(0, 60) }; }
  /**
   * 🔴 [2026-09-08] 여기서 **자가시험 하나가 이미 깨져 있었다.**
   *   기록에 `다시잴날: "해당 없음"` 인 항목이 있다(9/07 에 「안 건드렸다」는 «메모»로 넣은 것).
   *   글자끼리 견주면 한글이 숫자보다 «뒤»여서 `"해당 없음" > "2099-12-31"` 이 참이다.
   *   ⇒ 그 항목이 **영원히 잠긴 것**으로 세어졌다. 그래서 「지난 것은 안 센다」 시험이 깨졌다.
   *   ⛔ 메모를 지워서 시험을 통과시키지 않는다 — 기록은 남긴다. 견주는 법을 고친다.
   * ✅ 날짜 «앞 열 글자»만 뽑아서 견준다. 뽑히지 않으면 잠긴 것이 아니다.
   *   ⚠ 뒤에 설명이 붙은 것도 있다 — `"2026-09-24 (원래 실험 그대로)"`. 그것은 잠긴다.
   */
  const 날짜만 = (v) => { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v ?? '')); return m ? m[1] : null; };
  const 목록 = (d.실험 ?? []).filter((x) => { const t = 날짜만(x && x.다시잴날); return !!t && t > 오늘; });
  return { 목록 };
}

/** 이번에 바뀐 원본 파일들(커밋 안 된 것 + 방금 커밋한 것). */
function 바뀐파일() {
  const 모은다 = (args) => {
    try { return execFileSync('git', args, { cwd: 뿌리 }).toString().split('\n').filter(Boolean); }
    catch (e) { return []; }
  };
  return [...new Set([
    ...모은다(['diff', '--name-only']),
    ...모은다(['diff', '--cached', '--name-only']),
    ...모은다(['diff', '--name-only', 'HEAD~1', 'HEAD']),
  ])];
}

/**
 * 🔴 [2026-09-03 · 6번이 잡아 줬다] **이 자가 헛경보를 «열한 장씩» 내고 있었다.**
 *
 *   두 사이트가 손님 앞에서 «같은 경로»를 쓴다.
 *   ```
 *   seoulmarkets.com/article/<슬러그>     ← src/pages/article/[...id].astro
 *   kculturewire.com/article/<슬러그>     ← src/pages/wikitip/article/[...id].astro
 *   ```
 *   실험 기록에는 **손님이 보는 주소**(`/article/…`)가 적혀 있어서, 6번이 SeoulMarkets
 *   기사 템플릿을 고칠 때마다 **잠긴 KCW 기사 열한 장이 전부 「건드렸다」로 잡혔다.**
 *
 *   ⛔ 6번은 그것을 두 번 손으로 확인하고 「알려진 어림 결함」이라 부르며 넘겼다.
 *      **그것이 이 결함의 진짜 값이다** — 다음에 그 열한 장 가운데 «진짜»가 하나 섞이면
 *      같은 손짓으로 넘어간다. 우리 강령이 「잘못 잡는 자는 꺼진다」인 까닭이다.
 *
 *   ✅ 고치는 법은 짐작이 아니라 **자료를 보는 것**이다 — 그 슬러그의 마크다운이
 *      어느 갈래에 있나. `content/kculturewire/` 면 KCW, `content/articles/` 면 SeoulMarkets.
 *   ⚠ 어느 쪽에도 없으면 **「못 쟀다」**로 두고 그대로 잡는다(안전한 쪽). 0 으로 치지 않는다.
 */
/**
 * 실험 기록의 「지면」 칸에서 **주소만** 뽑는다.
 *
 * 🔴 [2026-09-08 · 5번] 이 자가 없어서 **돌고 있는 A/B 하나가 무방비였다.**
 *   기록에 이렇게 적힌 항목이 있다 —
 *     「🧪 /title/* — 546장 가운데 «수를 쓸 수 있는 396장»을 슬러그로 반 갈랐다 (A/B)」
 *   앞에 이모지가 붙어 있어서 앞머리 슬래시 지우기가 아무 일도 안 했고,
 *   토막 가르기의 첫 토막이 「🧪 」가 되어 **어느 파일과도 안 맞았다.**
 *   ⇒ /title/* 의 제목을 누가 고쳐도 이 자가 말해 주지 않았다. 9/28 까지 도는 실험이다.
 *
 * ⚠ 재서 확인했다 — 같은 기록의 「/market/* (93장 전부 — …)」는 «잡혔다».
 *   폴더+묶음 갈래가 첫 토막 market 으로 걸렸기 때문이다.
 *   새는 것은 «앞에 딴 글자가 붙은» 항목뿐이었다.
 *
 * ⛔ 못 뽑으면 null 이다. 부르는 쪽이 그때 «안 잡는다» — 짐작해서 잡지 않는다.
 */
export function 길뽑기(글) {
  const s = String(글 ?? '');
  /* 주소로 보이는 첫 토막. 대괄호와 별표도 주소의 일부다 */
  const m = s.match(/\/[A-Za-z0-9_\-.]+(?:\/[A-Za-z0-9_\-.*\[\]]+)*/);
  if (!m) return null;
  return m[0].replace(/\/$/, '');
}

export function 지면의사이트(지면) {
  /* 🔴 [2026-09-08] 여기도 같은 병이다 — 앞에 이모지가 붙으면 첫 토막이 어긋난다 */
  const 길2 = 길뽑기(지면);
  if (!길2) return null;
  const 조각 = 길2.replace(/^\//, '').split('/').filter(Boolean);
  if (조각[0] !== 'article' || !조각[1]) return null; /* 기사 지면만 갈린다 */
  const 슬러그 = 조각[1].replace(/\.html$/, '');
  const 있나 = (p) => fs.existsSync(path.join(뿌리, p, 슬러그 + '.md'));
  if (있나('content/kculturewire')) return 'kcw';
  if (있나('content/articles')) return 'seoulmarkets';
  return null; /* ⬜ 못 쟀다 — 지워진 기사일 수 있다 */
}

/** 그 사이트의 기사 템플릿 자리인가 */
export function 기사템플릿의사이트(파일) {
  if (파일.includes('src/pages/wikitip/article/')) return 'kcw';
  if (파일.includes('src/pages/article/')) return 'seoulmarkets';
  return null;
}

/**
 * 「지면」 칸에 적힌 주소를 **하나도 빠뜨리지 않고** 뽑는다.
 *
 * 🔴 [2026-09-08 · 5번 · 두 번째 구멍] `길뽑기` 는 **첫 주소 하나만** 준다.
 *   그런데 기록에는 «한 줄에 서른한 갈래»를 묶은 항목이 있다 —
 *     「/title · /firm · /actors-in-their · /star-sign · /year · /hometowns · /school ·
 *      /born-in · /group · /about · … (한 쓸이로 묶은 31갈래)」 다시잴날 2026-09-25
 *   그래서 이 자는 **`/title` 만 지키고 나머지 서른 갈래를 무방비로 두고 있었다.**
 *
 * ⚠ 어떻게 알았나 — 오늘 내가 `/born-in` 을 「안 잠김」으로 읽고 제목을 고치려 했다.
 *   실험 기록을 «눈으로» 열어 보니 그 줄에 `/born-in` 이 또렷이 있었다.
 *   ⛔ 자가 「안 잠김」이라 해서 안 잠긴 것이 아니었다. 하마터면 9/25 측정을 깨뜨렸다.
 *
 * ⭐ 앞서 같은 날 고친 것(이모지가 앞에 붙어 첫 토막이 어긋난 것)과 **같은 갈래의 병**이다.
 *   그때는 「첫 주소를 못 찾는 것」을 고쳤고, 이번은 「첫 주소 «만» 찾는 것」이다.
 */
export function 길들뽑기(글) {
  const s = String(글 ?? '');
  const 것들 = [...s.matchAll(/\/[A-Za-z0-9_\-.]+(?:\/[A-Za-z0-9_\-.*\[\]]+)*/g)].map((m) => m[0].replace(/\/$/, ''));
  /* 겹치는 것은 하나로. ⚠ 순서는 적힌 순서를 지킨다 — 사람이 읽을 때 헷갈리지 않게 */
  return [...new Set(것들)];
}

/**
 * 지면 주소가 이 파일에서 만들어질 «수 있나». ⚠ 어림이다 — 막지 않고 말해 준다.
 * ⭐ 「지면」 칸에 주소가 여럿이면 **하나라도 닿으면 닿은 것**이다(위 `길들뽑기` 참조).
 */
export function 닿나(지면, 파일) {
  if (!파일.startsWith('src/')) return false;
  const 길들 = 길들뽑기(지면);
  if (길들.length > 1) return 길들.some((하나) => 한길이닿나(하나, 지면, 파일));
  return 한길이닿나(길들[0] ?? null, 지면, 파일);
}

/** 주소 «하나»에 대해 판정한다. 원래 `닿나` 의 몸통이다 */
function 한길이닿나(주어진길, 지면, 파일) {
  if (!파일.startsWith('src/')) return false;
  /* 🔴 [2026-09-02 첫판이 여기서 거짓 양성을 냈다] 실험 «기록 파일»을 고치면
     그 안에 'title' 이 들어 있어 `/title` 지면을 건드린 것으로 잡혔다.
     ⇒ 기록 파일 자체는 언제나 뺀다. 그러지 않으면 기록을 적을 때마다 빨간불이고,
        늘 빨간 검사는 사람이 안 본다 — 그러면 정작 어긴 날에도 안 본다. */
  if (파일.endsWith('kcw-title-experiments.json')) return false;
  /* 🔴 [2026-09-08] 「지면」 칸에 이모지·설명이 붙은 항목이 있다. 주소만 뽑아서 본다.
     그러지 않으면 첫 토막이 이모지가 되어 어느 파일과도 안 맞는다 — 무방비가 된다. */
  const 길 = 주어진길 ?? 길뽑기(지면);
  if (!길) return false;
  const 조각 = 길.replace(/^\//, '').replace(/\/\*$/, '').split('/').filter(Boolean);
  if (!조각.length) return false;
  /* 정확히 그 이름의 지면 파일인가 */
  if (파일.includes('/' + 조각.join('/') + '.astro')) return true;
  /* 묶음 지면(`[...id].astro` · `[month].astro`)이면 그 폴더가 걸리면 걸린 것으로 본다.
     🔴 다만 «기사» 묶음은 두 사이트가 같은 경로를 쓴다 — 사이트를 가려야 한다(위 머리글). */
  if (파일.includes('/' + 조각[0] + '/') && /\[.+\]\.astro$/.test(파일)) {
    /* ⚠ «그 주소»의 사이트를 본다 — 여러 주소가 적힌 줄에서 지면 전체를 넘기면
       첫 주소의 사이트로 판정해 엉뚱한 결론이 난다 */
    const 지면쪽 = 지면의사이트(길);
    const 파일쪽 = 기사템플릿의사이트(파일);
    /* 둘 다 가려졌고 «서로 다르면» 남의 사이트다 — 잡지 않는다 */
    if (지면쪽 && 파일쪽 && 지면쪽 !== 파일쪽) return false;
    return true;
  }
  /* 그 지면이 읽는 자료 파일도 제목을 바꿀 수 있다.
     ⚠ 낱말이 «파일 이름의 한 토막»으로 들어 있을 때만 본다 — 그냥 포함으로 보면
        'title' 이 'kcw-title-experiments' 를 잡는 식으로 헛것을 잡는다. */
  if (파일.startsWith('src/data/')) {
    /*
     * ⚠ 지면 이름이 토막 둘일 수 있다(`star-signs`). 그래서 «이어진 토막»으로 본다 —
     *   자가시험이 `kcw-star-signs.json` 을 못 잡아서 알았다(토막 하나로만 봤다).
     *
     * 🔴 [2026-09-03 두 번째 헛경보] 그때는 **어디서든** 맞으면 잡았다. 그래서 내가
     *   `kcw-demon-hunters-year.json` 을 새로 내자 잠긴 지면 **`/year` 가 걸렸다.**
     *   그 지면이 정말 읽는 자료는 `wikitip-years.json` 이다 — 아무 상관이 없다.
     *   ⛔ 「이름 안에 그 낱말이 있다」는 너무 헐렁하다. 자료 파일이 늘 때마다 헛경보가 는다.
     *
     * ✅ **자리를 본다** — 사이트 접두를 뗀 «맨 앞»에서 맞아야 한다.
     *   자료 이름은 `<사이트>-<주제>…` 꼴로 짓기 때문이다.
     * ⚠ 홑·겹 낱말은 봐 준다 — `/year` ↔ `wikitip-years.json` 이 실제로 그 짝이다.
     *   그래서 「맨 앞에서 맞는다 + 끝의 s 는 눈감아 준다」가 이 자의 규칙이다.
     */
    const 이름 = path.basename(파일).replace(/\.json$/, '');
    const 접두 = ['wikitip', 'kcw', '100yearmap', 'seoulmarkets', 'klifemap', 'korea'];
    let 이름토막 = 이름.split(/[-_.]/);
    if (접두.includes(이름토막[0])) 이름토막 = 이름토막.slice(1);
    const 찾을토막 = 조각[0].split('-');
    /** 홑·겹만 봐 준다. 딴 변형은 봐 주지 않는다 */
    const 같나 = (a, b) => a === b || a === b + 's' || a + 's' === b;
    if (찾을토막.length <= 이름토막.length
      && 찾을토막.every((t, k) => 같나(이름토막[k], t))) return true;
  }
  return false;
}

export function 본다() {
  const 오늘 = 한국날짜();
  const j = 잠긴것(오늘);
  if (j.못읽음) return { 빛: '⬜', 줄: [`실험 기록을 못 읽었다 — ${j.못읽음} (0 으로 치지 않는다)`], 걸린수: 0 };
  const 파일들 = 바뀐파일();
  if (!파일들.length) return { 빛: '⬜', 줄: ['바뀐 원본이 없다 — 잴 것이 없다'], 걸린수: 0 };
  const 걸린것 = [];
  for (const 실험 of j.목록) {
    /**
     * 🔴 [2026-09-05 · 5번] **오늘 «바꾸면서 등록한» 것을 이 자가 위반으로 잡았다.**
     *   제목을 고치고 같은 커밋에 명부를 적는 것이 우리 규율인데, 그러면
     *   「실험 중인 지면을 건드렸다」가 반드시 뜬다 — 바꾼 행위와 등록한 행위가 같은 것이다.
     * ⚠ 오탐이 잦으면 사람이 이 검사를 끈다. 그 순간 «진짜» 위반이 지나간다.
     *   (이 파일 스스로 아래에 적어 두었다 — 「잘못 잡아 배포를 멈추면 사람이 검사를 끈다」)
     * ✅ 그래서 «바꾼날이 오늘인» 항목만 건너뛴다. 내일 같은 지면을 또 건드리면
     *   바꾼날이 어제가 되어 «그때는 옳게» 걸린다. 자물쇠를 푼 것이 아니다.
     */
    if (실험.바꾼날 && 실험.바꾼날 === 오늘) continue;
    for (const 지면 of String(실험.지면).split(/[·,]/).map((s) => s.trim()).filter(Boolean)) {
      const 맞은파일 = 파일들.filter((f) => 닿나(지면, f));
      if (맞은파일.length) 걸린것.push({ 지면, 다시잴날: 실험.다시잴날, 파일: 맞은파일 });
    }
  }
  if (!걸린것.length) {
    return { 빛: '✅', 줄: [`잠긴 지면 ${j.목록.length}건 중 이번에 건드린 것 없다`], 걸린수: 0 };
  }
  const 줄 = ['🔴 **실험이 도는 지면을 건드렸다.** 두 변화가 섞이면 아무것도 못 잰다.'];
  for (const x of 걸린것) {
    줄.push(`   · ${x.지면}  (다시잴날 ${x.다시잴날})  ← ${x.파일.join(' · ')}`);
  }
  줄.push('   ⭐ 둘 중 하나를 «골라 적으십시오» — 조용히 지나가지 마십시오.');
  줄.push('      ① 되돌린다 — 실험을 지킨다');
  줄.push('      ② 그대로 낸다 — 그 지면의 옛 실험 값을 «못 쓴다»고 기록에 적고 창을 새로 센다');
  줄.push('   ⚠ 이 자는 어림이다(지면 주소 → 원본 파일이 하나로 딱 정해지지 않는다).');
  줄.push('      그래서 막지 않고 말해 준다. 잘못 잡아 배포를 멈추면 사람이 검사를 끈다.');
  return { 빛: '🔴', 줄, 걸린수: 걸린것.length };
}

function 자가시험() {
  let 흠 = 0;
  const 봐 = (참, 말) => { if (!참) { 흠++; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };
  const j = 잠긴것();
  봐(!j.못읽음, '실험 기록을 읽는다');
  봐(Array.isArray(j.목록), '잠긴 것을 목록으로 낸다');
  /* ⭐ 이 검사의 심장 — 「잠긴 것」을 «날짜»로 가르는가. 다 잠긴 것으로 보면 늘 빨간불이다 */
  const 옛것 = 잠긴것('2099-12-31');
  봐(옛것.목록.length === 0, '다시잴날이 지난 것은 잠긴 것으로 세지 않는다');
  /* 🔴 [2026-09-05] 오늘 «바꾸면서 등록한» 것을 위반으로 잡던 자리.
     명부에 바꾼날이 오늘인 항목이 있으면, 그것은 «지금 하고 있는 그 변경»이다.
     ⚠ 오탐이 잦으면 사람이 검사를 끈다 — 그 순간 진짜 위반이 지나간다. */
  const 오늘날 = 한국날짜();
  const 오늘것 = (잠긴것(오늘날).목록 ?? []).filter((x) => x.바꾼날 === 오늘날);
  봐(오늘것.every((x) => x.바꾼날 === 오늘날),
    `오늘 등록한 실험 ${오늘것.length}건을 «오늘 것»으로 가려낸다`);
  봐(!(본다().줄 ?? []).some((s) => 오늘것.some((x) => s.includes(String(x.지면)))),
    '⛔ 오늘 바꾸면서 등록한 지면을 위반으로 잡지 않는다');
  /* 닿나() 가 실제로 갈라내나 */
  봐(닿나('/netflix-top10-data', 'src/pages/wikitip/netflix-top10-data.astro'), '지면 파일을 알아본다');
  봐(!닿나('/netflix-top10-data', 'src/pages/wikitip/about.astro'), '엉뚱한 파일은 안 잡는다');
  봐(!닿나('/netflix-top10-data', 'scripts/deploy.mjs'), 'src/ 밖은 안 잡는다');
  봐(닿나('/born-on/*', 'src/pages/wikitip/born-on/[day].astro'), '묶음 지면(대괄호)을 알아본다');
  /* 🔴 첫판이 여기서 거짓 양성을 냈다 — 기록 파일을 고치면 늘 빨간불이 됐다 */
  봐(!닿나('/title', 'src/data/kcw-title-experiments.json'), '실험 기록 파일 자체는 안 잡는다');
  봐(!닿나('/title', 'src/data/kcw-demand-gaps.json'), '이름에 그 낱말이 없는 자료는 안 잡는다');
  봐(닿나('/star-signs', 'src/data/kcw-star-signs.json'), '이름 토막이 맞는 자료는 잡는다');
  /* 🔴 [2026-09-03 두 번째 헛경보] 새 자료 파일이 늘자 «끝의 낱말»만 맞아 잡혔다 */
  봐(!닿나('/year', 'src/data/kcw-demon-hunters-year.json'),
    '🔴 이름 «끝»에 그 낱말이 있어도 잡지 «않는다» (/year vs demon-hunters-year)');
  봐(닿나('/year', 'src/data/wikitip-years.json'),
    '⭐ 그러면서 /year 의 «진짜» 자료(wikitip-years)는 여전히 잡는다 — 홑·겹을 봐 준다');
  봐(닿나('/weeks-counter', 'src/data/kcw-weeks-counter.json'),
    '토막 둘짜리 이름도 맨 앞에서 맞으면 잡는다');
  봐(!닿나('/counter', 'src/data/kcw-weeks-counter.json'),
    '맨 앞이 아니면 안 잡는다 (/counter vs weeks-counter)');
  /**
   * 🔴 [2026-09-08 · 두 번째 구멍] **한 줄에 주소가 여럿인 항목은 첫 주소만 지켜졌다.**
   *   기록에 서른한 갈래를 한 줄에 묶은 항목이 있고 다시잴날이 2026-09-25 다.
   *   오늘 내가 그 줄의 `/born-in` 을 「안 잠김」으로 읽고 제목을 고치려 했다.
   */
  const 서른한갈래 = '/title · /firm · /actors-in-their · /star-sign · /year · /hometowns · /school · /born-in · /group · /about  (한 쓸이로 묶은 31갈래)';
  봐(길들뽑기(서른한갈래).length === 10, `한 줄의 주소를 다 뽑는다 (뽑힌 수 ${길들뽑기(서른한갈래).length})`);
  봐(닿나(서른한갈래, 'src/pages/wikitip/born-in.astro'),
    '🔴 여러 갈래를 묶은 줄에서 «가운데» 갈래(/born-in)도 잡는다');
  봐(닿나(서른한갈래, 'src/pages/wikitip/school.astro'),
    '⭐ 같은 줄의 /school 도 잡는다 — 첫 주소만 보던 때는 놓쳤다');
  봐(닿나(서른한갈래, 'src/pages/wikitip/title.astro'),
    '첫 갈래(/title)는 그대로 잡는다 — 고치면서 잃지 않았다');
  봐(!닿나(서른한갈래, 'src/pages/wikitip/generations.astro'),
    '⛔ 그 줄에 없는 갈래는 잡지 않는다 — 다 잡는 자가 되면 안 된다');
  봐(길들뽑기('수가 없다').length === 0, '주소가 없으면 빈 목록 — 짐작하지 않는다');
  봐(길들뽑기('/a /a /b').length === 2, '같은 주소가 두 번이면 하나로 센다');

  /* 🔴 [2026-09-03] 6번이 잡아 준 헛경보 — 두 사이트가 /article/ 을 같이 쓴다 */
  봐(지면의사이트('/article/bts-is-not-a-seoul-band') === 'kcw',
    '⭐ 슬러그를 보고 KCW 기사임을 가려낸다');
  봐(기사템플릿의사이트('src/pages/article/[...id].astro') === 'seoulmarkets',
    'SeoulMarkets 기사 템플릿을 가려낸다');
  봐(기사템플릿의사이트('src/pages/wikitip/article/[...id].astro') === 'kcw',
    'KCW 기사 템플릿을 가려낸다');
  봐(!닿나('/article/bts-is-not-a-seoul-band', 'src/pages/article/[...id].astro'),
    '🔴 KCW 기사를 SeoulMarkets 템플릿으로 잡지 «않는다» (6번이 겪은 그 헛경보)');
  봐(닿나('/article/bts-is-not-a-seoul-band', 'src/pages/wikitip/article/[...id].astro'),
    '⭐ 그러면서 «제 사이트» 템플릿은 여전히 잡는다 (못 잡는 자가 되면 안 된다)');
  /* ⬜ 어느 쪽에도 없는 슬러그는 「못 쟀다」로 두고 그대로 잡는다 — 안전한 쪽 */
  봐(지면의사이트('/article/이런-기사는-없다') === null,
    '어느 갈래에도 없으면 null 을 낸다 — 「없다」가 아니라 「못 쟀다」');
  봐(닿나('/article/이런-기사는-없다', 'src/pages/article/[...id].astro'),
    '⬜ 못 가려낸 것은 그대로 잡는다 (0 으로 치지 않는다)');
  봐(!닿나('/article/x', 'src/pages/wikitip/person/[name].astro'),
    '기사 아닌 묶음은 폴더가 다르면 안 잡는다');

  /* 🔴 [2026-09-08] **돌고 있던 A/B 하나가 무방비였다.** 기록의 「지면」 칸 앞에
     이모지가 붙어 있어서 이 자가 그 항목을 아예 못 봤다. 겪은 것을 검사로 굳힌다. */
  봐(길뽑기('🧪 /title/* — 546장 가운데 396장을 슬러그로 반 갈랐다 (A/B)') === '/title/*',
    '이모지가 앞에 붙어도 주소를 뽑는다');
  봐(길뽑기('/market/* (93장 전부 — 만드는 자리 한 곳)') === '/market/*',
    '괄호 설명이 뒤에 붙어도 주소만 뽑는다');
  봐(길뽑기('수가 없다') === null, '주소가 없으면 null — 짐작하지 않는다');
  /* 🔴 [2026-09-08] 「다시잴날: 해당 없음」이 한글이라 숫자보다 뒤로 정렬돼
     영원히 잠긴 것으로 세어졌다. 날짜 앞 열 글자만 보고 견주게 고쳤다. */
  봐((잠긴것('2099-12-31').목록 ?? []).length === 0,
    '🔴 날짜 꼴이 아닌 「해당 없음」을 잠긴 것으로 세지 않는다');
  봐((잠긴것('2026-09-01').목록 ?? []).length > 0,
    '⭐ 그러면서 «진짜 잠긴 것»은 여전히 센다 (못 잡는 자가 되면 안 된다)');
  봐(닿나('🧪 /title/* — 546장 …', 'src/pages/wikitip/title/[...slug].astro'),
    '🔴 이모지 붙은 /title/* 항목이 이제 잡힌다 (9/28 까지 도는 실험이다)');
  봐(!닿나('수가 없다', 'src/pages/wikitip/title/[...slug].astro'),
    '주소를 못 뽑으면 안 잡는다');
  const r = 본다();
  봐(['✅', '🔴', '⬜'].includes(r.빛), '빛을 하나 낸다');
  console.log(흠 ? `\n🔴 흠 ${흠}개` : '\n✅ 흠 없다');
  process.exit(흠 ? 1 : 0);
}

/**
 * 🔴 [2026-09-03] **이 파일은 «불러올» 수 없었다.**
 *   아래가 맨몸으로 돌아서, 다른 자가 `import` 하면 그 자리에서 보고를 찍고
 *   `process.exit(0)` 로 프로세스를 죽였다. 그래서 판정 함수를 밖에서 «재 볼» 수가 없었다.
 *   ⛔ 재 볼 수 없는 판정은 헛경보를 내도 아무도 증명하지 못한다 —
 *      실제로 6번의 헛경보 11장이 그렇게 「알려진 어림 결함」으로 굳어 있었다.
 *   ✅ 저장소의 다른 검사들과 같은 문지기를 둔다. 직접 돌릴 때 하는 일은 그대로다.
 */
function main() {
  const 줄들 = process.argv.slice(2);
  if (줄들.includes('--자가시험')) 자가시험();
  else {
    const r = 본다();
    if (줄들.includes('--체크리스트')) console.log(`${r.빛} 제목 실험 잠금 — ${r.줄[0].replace(/\*\*/g, '')}`);
    else {
      console.log('# 실험이 도는 지면의 제목을 또 건드렸나\n');
      for (const 줄 of r.줄) console.log(줄);
    }
    /* ⚠ 걸려도 1 을 내지 않는다 — 막는 자가 아니라 «말해 주는» 자다 */
    process.exit(0);
  }
}

if (process.argv[1] && process.argv[1].endsWith('check-title-experiment-lock.mjs')) main();
