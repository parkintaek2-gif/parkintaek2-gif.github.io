#!/usr/bin/env node
/**
 * check-kcw-title-cutoff.mjs — **제목의 «낚싯바늘»이 구글이 자르는 자리 안에 있나.**
 *
 * ── 🔴 왜 (2026-08-31 사장님 지시 · 2026-09-01 5번이 잼) ──────
 * 사장님: 「기사 제목은 20자 이내로」 → 2번 판정(영문): 「**≤60자 또는 8단어**,
 * 기존 것은 두고 새 기사부터」
 *
 * 그런데 사장님은 같은 주에 이렇게도 이르셨다 —
 * > 「**좋네,, 스타 이름이 이렇게 제목에 나와야해**」
 * > 「제목에 **스타이름과** 데이터에서 사람들이 **클릭을 할 수밖에 없는 내용**을 반영해」
 *
 * ⚠ 사장님이 칭찬하신 그 제목은 **108자**였다. 규칙과 부딪히는 것처럼 보인다.
 *
 * ── ⭐ 부딪히지 않는다. 진짜 물음은 「길이」가 아니다 ─────────
 * 구글은 검색 결과에서 제목을 **약 60자에서 자른다.** 108자짜리 제목은
 * **뒤 48자를 손님이 아예 못 본다.**
 * ⇒ 그러니 물어야 할 것은 「제목이 60자를 넘나」가 아니라
 *   **「사장님이 넣으라 하신 «이름»과 «수»가 잘리는 자리 «앞»에 있나」**다.
 *
 * ```
 * ⛔ 「60자 넘음」          길이만 재는 것. 무엇을 고칠지 안 알려 준다
 * ✅ 「이름이 72자째에 있다」 잘려서 «안 보인다». 앞으로 옮기라고 알려 준다
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 「몇 자」만 세고 끝내지 않는다. **잘린 뒤에 무엇이 남는지**를 보여 준다.
 * ⛔ 노출 수를 못 읽으면 0으로 안 채운다 — 「못 쟀다」로 적는다.
 * ⛔ 이 자는 제목을 «고치지 않는다». 어디를 고칠지 세어서 보여 준다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-title-cutoff.mjs --자가시험
 *   node scripts/check-kcw-title-cutoff.mjs            (노출 많은 차례로)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 구글이 검색 결과에서 제목을 자르는 자리.
 * ⚠ 구글은 «글자 수»가 아니라 **픽셀 너비**(약 580px)로 자른다. 글자 수는 어림이다.
 *   그래서 이 자는 「60자」를 **판정선이 아니라 «경고선»**으로 쓴다. 못 재는 것을
 *   재는 척하지 않는다 — 실제 잘림은 글꼴과 화면에 따라 다르다.
 */
export const 자르는자리 = 60;

/** 2번 판정 — 낱말 수 규칙 */
export const 낱말한도 = 8;

/** 제목에서 «수»를 찾는다. 사장님이 「클릭할 수밖에 없는 내용」이라 하신 것이 이것이다 */
export function 수있는곳(제목) {
  const s = String(제목 ?? '');
  if (!s) return -1;
  /* 3.3x · 67 · 1,023 · 8.5% — 쉼표·소수점·배수·백분율을 한 덩이로 본다 */
  const m = s.match(/\d[\d,.]*\s*(?:x|%|배)?/);
  return m ? m.index : -1;
}

/**
 * 제목에서 «이름»이 시작하는 곳.
 *
 * 🔴 [2026-09-01] 처음에는 **대문자로 짐작**했다 — `[A-Z][a-z]+([- ][A-Z][a-z]+)+`.
 *   자가시험이 두 가지를 바로 잡아냈다.
 *   ① 「**Yesterday** Song Kang was read more」 → 문장 첫 낱말이 이름에 «붙어» 0을 냈다
 *   ② 「**Southeast Asian** encyclopaedias」 → 지역 이름을 스타 이름으로 셌다
 *   ⛔ 대문자는 이름의 «표시»이지 이름이 아니다. 짐작으로 자를 만들면 자가 거짓말한다.
 *
 * ⭐ 그래서 짐작을 버리고 **기사가 이미 적어 둔 칸을 읽는다** — 앞말의 `tags`.
 *   거기 `["song-kang", "my-demon", …]` 처럼 스타·작품이 슬러그로 적혀 있다.
 *   ⛔ 태그가 없으면 **`null` 을 낸다.** -1(없다)이 아니다 — 「못 쟀다」와 「없다」는 다른 말이다.
 *
 * @param {string} 제목
 * @param {string[]|null} 이름들 앞말 tags 의 슬러그. 없으면 null
 * @returns {number|null} 자리 · 없으면 -1 · 못 재면 null
 */
export function 이름있는곳(제목, 이름들) {
  const s = String(제목 ?? '');
  if (!s) return -1;
  if (!Array.isArray(이름들) || 이름들.length === 0) return null;   /* ⛔ 못 쟀다 */
  /**
   * 🔴 [2026-09-01 두 번째 고침] 처음엔 앞말 `tags` 만 봤다. 그런데 태그를 열어 보니
   *   `["wikipedia", "southeast asia", "method"]` 처럼 **갈래말뿐이고 스타 이름이 0개**였다.
   *   그래서 「Go Youn-jung, Lee Chae-min and Moon Ga-young」 같은 제목이
   *   **「이름도 수도 없다」로 잘못 찍혔다.** 제목에 이름이 뻔히 있는데도.
   *   ⇒ 부르는 쪽에서 `wikitip-people.json` 의 «진짜 이름 634개»를 함께 넘긴다.
   *   ⭐ 이 잘못이 더 큰 것을 알려 줬다 — **우리 태그에 스타 이름이 없다.**
   *     손님은 이름으로 검색하는데 우리 태그는 「method」라고 적혀 있다.
   */
  let 이른곳 = -1;
  for (const 태 of 이름들) {
    const 말 = String(태 ?? '').trim();
    /**
     * 🔴 [2026-09-01 세 번째 고침] 두 가지를 놓치고 있었다.
     *  ① `말.length < 3` 으로 걸렀더니 **IU · RM · V** 가 통째로 빠졌다.
     *     한국 연예인에게 두 글자 이름은 «드문 것이 아니라 흔하다».
     *  ② 태그의 하이픈을 «전부» 공백으로 바꿨더니 `cha-eun-woo` → `cha eun woo` 가 되어
     *     제목의 **`Cha Eun-woo`**(안쪽 하이픈이 남아 있다)와 안 맞았다.
     *  ⇒ 그래서 「IU is a Rooster, Cha Eun-woo an Ox」가 **「이름도 수도 없다」로** 찍혔다.
     *     제목에 이름이 둘이나 있는데도.
     * ⭐ 이제 하이픈과 공백을 «같은 것»으로 보고 찾는다.
     */
    if (말.length < 2) continue;
    const 쪽 = 말.split(/[-\s]+/).filter(Boolean).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!쪽.length) continue;
    const m = s.match(new RegExp(`\\b${쪽.join('[- ]')}\\b`, 'i'));
    if (m && (이른곳 < 0 || m.index < 이른곳)) 이른곳 = m.index;
  }
  return 이른곳;
}

/** 잘린 뒤에 손님이 «보는» 부분 */
export function 보이는부분(제목, 자리 = 자르는자리) {
  const s = String(제목 ?? '');
  if (s.length <= 자리) return s;
  return `${s.slice(0, 자리 - 1)}…`;
}

/**
 * 이 제목을 어떻게 볼 것인가.
 * ⛔ 「통과/실패」 두 갈래로 안 나눈다 — 무엇이 문제인지가 갈래마다 다르다.
 */
export function 제목보기(제목, 이름들) {
  const s = String(제목 ?? '');
  if (!s) return null;
  const 자 = s.length;
  const 낱 = s.trim().split(/\s+/).length;
  const 수자리 = 수있는곳(s);
  const 이름자리 = 이름있는곳(s, 이름들);          /* null 이면 «못 쟀다» */
  const 잘리나 = 자 > 자르는자리;

  /* 잘리는 자리 «뒤»로 밀려난 것 — 손님이 못 본다 */
  const 수가잘림 = 수자리 >= 0 && 수자리 >= 자르는자리;
  const 이름이잘림 = 이름자리 !== null && 이름자리 >= 0 && 이름자리 >= 자르는자리;
  const 이름못쟀다 = 이름자리 === null;

  let 탈;
  if (수가잘림 && 이름이잘림) 탈 = '이름·수가 둘 다 잘린다';
  else if (이름이잘림) 탈 = '이름이 잘린다';
  else if (수가잘림) 탈 = '수가 잘린다';
  else if (수자리 < 0 && 이름자리 === -1) 탈 = '이름도 수도 없다';
  else if (수자리 < 0 && 이름못쟀다) 탈 = '수가 없다(이름은 못 쟀다)';
  else if (잘리나) 탈 = '길지만 바늘은 보인다';
  else 탈 = null;

  return {
    자, 낱, 잘리나, 수자리, 이름자리, 이름못쟀다, 탈,
    /**
     * 🔴 [2026-09-01] 2번 판정은 「≤60자 **또는** 8단어」다 — 둘 중 **하나만** 맞으면 된다.
     *   나는 `자>60 || 낱>8` 로 적었다. 그건 **둘 다 맞아야** 통과라는 뜻이라
     *   제목을 다 줄인 뒤에도 「117편이 규칙을 넘는다」고 나왔다.
     *   ⛔ 「또는」을 「그리고」로 읽으면 자가 끝나지 않는 숙제를 만든다.
     */
    보임: 보이는부분(s), 규칙넘음: 자 > 자르는자리 && 낱 > 낱말한도,
  };
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  const 강 = ['song-kang'];

  검('수를 찾는다', 수있는곳('Song Kang is looked up 3.3x more today') === 23);
  검('쉼표 든 수도 찾는다', 수있는곳('all 1,023 Korean actors') === 4);
  검('백분율도 수다', 수있는곳('esports takes 60.6% of the reads') === 14);
  검('⛔ 수가 없으면 -1', 수있는곳('The ones that ran and ran') === -1);
  검('⛔ 빈 값은 -1', 수있는곳('') === -1 && 수있는곳(null) === -1);

  /**
   * 🔴 이 셋이 「대문자로 짐작하기」를 버린 까닭이다.
   *   옛 자는 ①에서 0 을 냈다(문장 첫 낱말이 이름에 붙었다).
   */
  검('① 태그로 이름을 찾는다', 이름있는곳('Yesterday Song Kang was read more', 강) === 10);
  검('대소문자를 안 가린다', 이름있는곳('we read song kang today', 강) === 8);
  검('⛔ 제목에 그 이름이 없으면 -1', 이름있는곳('Korea has the lowest rate', 강) === -1);
  /* ② 지역 이름을 스타로 세던 잘못 — 태그에 없으면 이름이 아니다 */
  검('② 태그에 없는 대문자말은 이름이 아니다',
    이름있는곳('Southeast Asian encyclopaedias', ['song-kang']) === -1);
  검('⛔ 태그가 없으면 «못 쟀다»(null) — -1 이 아니다',
    이름있는곳('Yesterday Song Kang', null) === null && 이름있는곳('x', []) === null);
  검('여럿이면 가장 앞선 것', 이름있는곳('My Demon and Song Kang', ['song-kang', 'my-demon']) === 0);
  /* 🔴 이 셋을 놓쳐서 이름 둘 든 제목이 「이름도 수도 없다」로 찍혔다 */
  검('두 글자 이름(IU)도 잡는다', 이름있는곳('IU is a Rooster', ['iu']) === 0);
  검('안쪽 하이픈이 남은 이름을 잡는다', 이름있는곳('IU is a Rooster, Cha Eun-woo an Ox', ['cha-eun-woo']) === 17);
  검('⛔ 낱말 한가운데는 안 잡는다', 이름있는곳('a serious matter', ['iu']) === -1);

  검('안 자르면 그대로', 보이는부분('short one') === 'short one');
  검('자르면 … 를 붙인다', 보이는부분('x'.repeat(70)).length === 60);

  /* 🔴 이 자의 값어치가 여기 있다 — 「길다」와 「바늘이 잘린다」를 가른다 */
  const 긴데좋은것 = 제목보기('Song Kang is looked up 3.3x more today — and all three shows hit number one', 강);
  검('길어도 바늘이 앞에 있으면 「길지만 보인다」', 긴데좋은것.탈 === '길지만 바늘은 보인다');
  const 바늘이뒤 = 제목보기('We looked at what the four Southeast Asian encyclopaedias tell us about Song Kang at 60.6%', 강);
  검('바늘이 뒤로 밀리면 잡는다', 바늘이뒤.탈 === '이름·수가 둘 다 잘린다');
  검('짧고 바늘 있으면 탈 없음', 제목보기('Song Kang read 3.3x more today', 강).탈 === null);
  검('이름도 수도 없으면 잡는다', 제목보기('the ones that ran and ran', 강).탈 === '이름도 수도 없다');
  검('⛔ 태그가 없으면 이름을 「없다」로 안 친다',
    제목보기('the ones that ran and ran', null).탈 === '수가 없다(이름은 못 쟀다)');
  검('⛔ 빈 값은 null', 제목보기('', 강) === null && 제목보기(null, 강) === null);

  검('낱말 수를 센다', 제목보기('a b c', 강).낱 === 3);
  /* 🔴 「또는」이다 — 둘 중 하나만 맞으면 통과. 둘 다 어겨야 「넘음」이다 */
  검('61자라도 8단어 이내면 통과', 제목보기(`${'x'.repeat(55)} a b c`, 강).규칙넘음 === false);
  검('9단어라도 60자 이내면 통과', 제목보기('a b c d e f g h i', 강).규칙넘음 === false);
  검('둘 다 어기면 넘음', 제목보기(`${'xxxxx '.repeat(11)}end`, 강).규칙넘음 === true);

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ check-kcw-title-cutoff 자가시험 통과 (${센것})`);
  process.exit(0);
}

if (내가실행됐다) {
  const 방 = path.join(뿌리, 'content/kculturewire');
  const 글들 = fs.readdirSync(방).filter((f) => f.endsWith('.md'));

  /* 노출 — ⛔ 못 읽으면 0 으로 안 채운다. null 로 두고 「못 쟀다」로 적는다 */
  let 노출 = null;
  try {
    const g = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/kcw-gsc-pages.json'), 'utf8'));
    노출 = new Map();
    /**
     * 🔴 [2026-09-01] 처음엔 `r.keys[0]` 만 봤다. 그런데 `--적는다` 로 «적어 둔» 파일은
     *   `r.key`(홑겹)로 적힌다 — 구글이 바로 주는 것은 `keys[]`(겹)다. **두 꼴이 있다.**
     *   ⛔ 그때 이 자는 아무 말 없이 전부 「노출 못 쟀다」로 냈고, 노출 차례로 세우는
     *     이 자의 값어치가 통째로 죽었다. **자를 먼저 의심해서 잡았다.**
     */
    for (const r of g.rows ?? []) {
      const 주소 = String(r.key ?? r.keys?.[0] ?? '');
      const m = 주소.match(/\/article\/([a-z0-9-]+)/);
      if (m) 노출.set(m[1], { 노출: r.impressions, 클릭: r.clicks, 순위: r.position });
    }
    /* ⛔ 파일은 읽혔는데 한 줄도 못 맞췄으면 «맞는 척» 하지 않는다 */
    if (노출.size === 0) 노출 = null;
  } catch { 노출 = null; }

  /**
   * ⭐ 진짜 사람 이름 634개. ⛔ 태그만 믿지 않는다 — 태그에는 스타 이름이 거의 없다.
   *   못 읽으면 null 로 두고 「못 쟀다」로 적는다. 빈 배열로 채우지 않는다.
   */
  let 사람이름 = null;
  try {
    const p = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-people.json'), 'utf8'));
    사람이름 = (p.people ?? []).map((x) => x.name).filter(Boolean);
    if (사람이름.length === 0) 사람이름 = null;
  } catch { 사람이름 = null; }

  const 것들 = [];
  for (const f of 글들) {
    const s = fs.readFileSync(path.join(방, f), 'utf8');
    const m = s.match(/^title:\s*"([\s\S]*?)"\s*$/m);
    if (!m) continue;
    /* ⭐ 이름은 짐작하지 않고 앞말 `tags` 칸에서 읽는다 */
    const tm = s.match(/^tags:\s*\[([^\]]*)\]/m);
    const 태그 = tm ? tm[1].split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : null;
    /* 태그 + 진짜 사람 이름을 «합쳐» 본다. 둘 중 하나만 봐도 놓친다 */
    const 볼이름 = (태그 || 사람이름) ? [...(태그 ?? []), ...(사람이름 ?? [])] : null;
    const 슬 = f.replace(/\.md$/, '');
    /**
     * 🔴 [2026-09-01] 여기 «같은 하이픈 잘못»이 하나 더 남아 있었다.
     *   `t.replace(/-/g,' ')` 로 「son-heung-min」을 「son heung min」으로 만들어
     *   진짜 이름 「Son Heung-min」(안쪽 하이픈이 있다)과 비교했다 — 영영 안 맞는다.
     *   그래서 태그를 «이미 넣어 둔» 기사까지 「태그에 이름이 없다」로 셌다(75편).
     * ⭐ 한 곳을 고쳤다고 끝난 게 아니었다. **같은 결함이 인용을 타고 옮겨 다닌다** —
     *   고칠 때 그 이름으로 저장소를 훑는 것이 우리 규칙인 까닭이다.
     * ⇒ 이제 양쪽을 «같은 꼴»(슬러그)로 만들어 견준다.
     */
    const 슬로 = (x) => String(x ?? '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const 태그에이름 = 사람이름 && (태그 ?? []).some((t) => 사람이름.some((n) => 슬로(n) === 슬로(t)));
    것들.push({ 슬, 제목: m[1], ...제목보기(m[1], 볼이름), 태그에이름, 잰것: 노출?.get(슬) ?? null });
  }

  const 탈난것 = 것들.filter((x) => x.탈);
  /* 노출이 큰 차례 — ⛔ 못 잰 것은 뒤로 보내되 «없는 것»으로 안 친다 */
  탈난것.sort((a, b) => (b.잰것?.노출 ?? -1) - (a.잰것?.노출 ?? -1));

  console.log(`■ 제목이 구글에서 «잘리는» 자리 — 기사 ${것들.length}편 · 경고선 ${자르는자리}자`);
  console.log(`\n⚠ 구글은 글자 수가 아니라 «픽셀 너비»로 자른다. ${자르는자리}자는 어림이다 — 판정선이 아니라 경고선이다.`);

  const 갈래 = {};
  for (const x of 것들) 갈래[x.탈 ?? '탈 없음'] = (갈래[x.탈 ?? '탈 없음'] ?? 0) + 1;
  console.log('\n갈래별');
  for (const [k, v] of Object.entries(갈래).sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(4)}편  ${k}`);

  const 규칙넘 = 것들.filter((x) => x.규칙넘음).length;
  console.log(`\n2번 판정(≤${자르는자리}자 또는 ≤${낱말한도}단어)을 넘는 것 ${규칙넘}편`);

  if (노출 === null) {
    console.log('\n⬜ **노출은 못 쟀다** — src/data/kcw-gsc-pages.json 을 못 읽었다. 「0」이 아니라 「모른다」다.');
  }
  if (사람이름 === null) {
    console.log('⬜ **사람 이름을 못 쟀다** — wikitip-people.json 을 못 읽었다.');
  } else {
    /**
     * 🔴 곁가지로 드러난 것 — 제목에는 스타 이름이 있는데 **태그에는 없다.**
     *   사장님: 「인기 검색어는 스타 이름·작품명·노래제목이다」
     *   태그가 「wikipedia · method」뿐이면 손님이 치는 말과 우리 표가 안 만난다.
     */
    /**
     * 🔴 [2026-09-01] 여기서 한동안 「태그에 이름이 없는 것 64편」이라는 **거짓 수**를 냈다.
     *   두 군데가 틀렸다.
     *   ① 이름을 찾을 때 «태그 자체»를 이름 목록에 섞어 넣었다. 그러니 `places`·`netflix`
     *      같은 갈래말이 제목에 걸리면 「스타 이름이 있다」로 셌다.
     *      ⛔ 태그를 감사하면서 태그를 근거로 삼았다 — **돌아가는 논증**이다.
     *   ② 「이미 태그에 있나」를 볼 때 `wikitip-people.json`(넷플릭스 배우 634명)으로만
     *      견줬다. Faker·안성기·BTS 는 그 파일에 없다. 그래서 태그를 «넣어 둔» 기사까지
     *      「없다」로 셌다.
     *
     * ⭐ 그래서 수를 «내리지 않는다». 우리 규칙이다 — **못 잰 것은 못 쟀다고 적는다.**
     *   가진 자료로 정직하게 말할 수 있는 것은 아래 한 줄뿐이다.
     */
    const 이름있는제목 = 것들.filter((x) => x.이름자리 !== null && x.이름자리 >= 0);
    console.log('\n⬜ **「태그에 스타 이름이 있나」는 못 잰다** — 숨기지 않고 적는다.');
    console.log(`   우리가 쥔 이름 목록은 «넷플릭스에 오른 배우 ${사람이름.length}명»뿐이다.`);
    console.log('   가수·운동선수·그룹(Faker · BTS · 안성기)은 그 목록에 없어서 있는지 없는지 모른다.');
    console.log(`   ⛔ 태그를 근거로 태그를 감사할 수 없다 — 돌아가는 논증이다. (이름 걸린 제목 ${이름있는제목.length}편은 «참고»다)`);
    console.log('   ✅ 잴 수 있는 것: `add-kcw-name-tags.mjs` — 그 634명에 한해 제목에 있는데 태그에 없는 것.');
  }

  console.log(`\n■ 먼저 고칠 것 — 노출이 큰 차례 (탈난 것 ${탈난것.length}편 중 위 15편)`);
  for (const x of 탈난것.slice(0, 15)) {
    const 재 = x.잰것 ? `노출 ${String(x.잰것.노출).padStart(4)} · 순위 ${x.잰것.순위.toFixed(1)}` : '노출 못 쟀다';
    console.log(`\n   ${재}  ·  ${x.자}자 ${x.낱}단어  🔴 ${x.탈}`);
    console.log(`      ${x.슬}`);
    console.log(`      손님이 보는 것 → 「${x.보임}」`);
  }
  console.log('\n⛔ 이 자는 제목을 고치지 않는다. 「손님이 보는 것」 줄을 읽고 «이름과 수»를 앞으로 당긴다.');
}
