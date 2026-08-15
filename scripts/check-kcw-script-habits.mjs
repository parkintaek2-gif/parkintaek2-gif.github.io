/**
 * **내 자들이 같은 버릇으로 틀리는지 훑는다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 8/14~15 이틀 사이에 같은 모양의 흠을 **여섯 번** 냈다. 매번 손으로 찾았다.
 * ⛔ 손으로 훑으면 다음에 또 놓친다. 그리고 흠은 늘 **조용하다** —
 *   오류도 안 나고 파일도 멀쩡한데 나가는 것이 틀린다.
 *
 * ── 잡는 버릇 넷 ──────────────────────────────────────────────
 * ① UTC 날짜        `new Date().toISOString()` — 새벽에 지으면 하루 앞선다.
 *                   그 값이 사이트맵 lastmod 로 나간다. `_kst.mjs` 를 쓴다.
 * ② 임포트 부수효과  가드 없이 파일을 쓰거나 찍는 자 — 남이 함수 하나 가져다 쓰면 딸려 돈다.
 * ③ 굳은 수         자가시험에 `=== 5` 처럼 개수를 박아 둔 것 — 늘어나면 **옳은 변화를 막는다.**
 * ④ 못 잼을 0 으로   `?? 0` 로 빈 값을 메우는 자리 — 8/13 에 손흥민을 바닥에 깔았다.
 *
 * ⛔ 이 자는 **고치지 않는다.** 세어서 보여 줄 뿐이다. 재는 자와 하는 자를 가른다.
 * ⛔ 남의 자(100y · seoulmarkets)는 안 본다. 내 것만 본다.
 * ⚠ 빨강으로 세우지 않는다 — 옛 자에는 이미 굳은 것이 있다. **새로 생기는 것**을 보라고 센다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-script-habits.mjs
 *   node scripts/check-kcw-script-habits.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자방 = path.join(뿌리, 'scripts');

/**
 * ⛔ 내 자만. 이름으로 가른다 — 남의 것을 세면 남에게 일을 시키는 셈이다.
 *
 * ⚠ **KST 셈을 다루는 자 둘은 뺀다.** `_kst.mjs` 와 이 자는 견주려고 `new Date().toISOString()`
 *   이라는 **글자를 갖고 있을 뿐**이지 그것으로 날짜를 적지 않는다.
 *   ⛔ 어제 배운 그대로다 — **자기 몸을 글자로 뒤지면 자기에게 걸린다.**
 */
export const 뺄자 = ['_kst.mjs', 'check-kcw-script-habits.mjs'];

export function 내자인가(이름) {
  if (뺄자.includes(이름)) return false;
  return /^(build-wikitip-|collect-sea-|build-kcw-|check-kcw-|make-cardnews-kcw|make-voice-kcw|mix-voice-kcw|make-video-kcw-|collect-kosis-(visitors|air))/.test(이름);
}

/** ① UTC 로 날짜를 적나 */
export function UTC날짜쓰나(글) {
  return /new Date\(\)\.toISOString\(\)/.test(글);
}

/**
 * ② 부수효과가 있는데 가드가 없나.
 *
 * 🔴 8/15 — `make-og-articles.mjs` 를 빨강으로 냈는데 **열어 보니 가드가 있었다.**
 *   꼴이 달랐을 뿐이다:
 * ```
 *   if (process.argv[1] && process.argv[1].endsWith('make-og-articles.mjs')) { … }
 * ```
 *   ⛔ 내가 아는 두 꼴만 가드로 쳤다. 그건 검사가 아니라 **내 습관을 재는 자**다.
 *   ⭐ 거짓 양성은 그냥 흠이 아니다 — 오늘 나는 이 빨강 하나를 따라가느라 실물을 열었고,
 *     그래서 알았다. 다음 사람은 안 열고 믿을 것이다.
 *
 * ⚠ 그래서 **argv[1] 로 자기 이름을 맞춰 보는 꼴**도 가드로 친다.
 */
export function 가드없나(글) {
  const 부수 = /\bfs\.(writeFileSync|appendFileSync|mkdirSync)\s*\(/.test(글);
  if (!부수) return false;
  const 가드꼴 = [
    /내가실행됐다/,
    /import\.meta\.url === path\.resolve/,
    /process\.argv\[1\][\s\S]{0,80}\.endsWith\(/,
  ];
  return !가드꼴.some((r) => r.test(글));
}

/**
 * ③ 자가시험에 **자라는 것의 개수**가 굳어 있나.
 *
 * 🔴 처음엔 `.length === N` 을 다 잡았더니 37개가 나왔는데 **거의 다 거짓 양성**이었다.
 *   `구간들(['w1','w2']).length === 1` 은 논리 검사다 — 자라는 것이 아니다.
 *   `탈.length === 0` 도 「흠이 없나」지 개수 굳히기가 아니다.
 *   ⛔ 거짓이 많은 검사는 아무도 안 본다. 그러면 없는 것만 못하다.
 *
 * ⭐ 좁힌다 — **함수 호출 결과가 아닌 이름**의 길이를 **0 아닌 상수**와 견주는 것만.
 *   `벌들.length === 5` ← 잡는다(벌이 늘면 막힌다)
 *   `f(x).length === 1` ← 안 잡는다(그때그때 셈이다)
 *   `탈.length === 0`   ← 안 잡는다(비었나를 묻는다)
 */
export function 굳은수있나(글) {
  for (const 줄 of 글.split('\n')) {
    const m = 줄.match(/(?:^|[^)\w.])([A-Za-z가-힣_$][\w가-힣_$]*)\.length\s*(?:===\s*|,\s*)([1-9]\d*)\b/);
    if (m) return true;
  }
  return false;
}

/**
 * ④ **합계에 못 잰 값을 0 으로 더하나.**
 *
 * 🔴 처음엔 `?? 0` 을 다 잡았더니 36개가 나왔는데 **거의 다 정당했다.**
 *   `(map.get(k) ?? 0) + 1` 은 **세는 자리의 첫 값**이다 — 없던 것을 0 에서 시작하는 게 맞다.
 *   ⛔ 「굳은 개수」에서 배운 그대로다. 거짓이 많으면 아무도 안 본다.
 *
 * ⭐ 좁힌다 — **`reduce` 로 더하는 자리**의 `?? 0` 만 본다.
 *   그것이 8/13 에 손흥민을 바닥에 깐 자리다: 못 받은 조회수를 0 으로 **더했다**.
 * ⚠ 그래도 자리마다 정당할 수 있다(앞서 온전한 것만 골랐다면). 사람이 본다.
 */
export function 영으로메우나(글) {
  for (const 줄 of 글.split('\n')) {
    if (!/\?\?\s*0\b/.test(줄)) continue;
    /* 세는 자리 — Map/Set 의 첫 값은 0 이 맞다 */
    if (/\.get\([^)]*\)\s*\?\?\s*0/.test(줄)) continue;
    /**
     * 🔴 8/15 — `달별셈[v] = (달별셈[v] ?? 0) + 1` 을 빨강으로 냈다. 열어 보니
     *   **객체로 세는 자리**였다. Map 이냐 객체냐로 뜻이 달라지지 않는다.
     * ⭐ 「자기 자신에 담으면서 1 을 더하는 꼴」은 세는 자리다. 뺀다.
     */
    /* ⚠ JS 의 `\w` 는 **한글을 안 잡는다.** `달별셈[v]` 가 그래서 안 걸렸다 */
    if (/([\w가-힣$][\w가-힣$]*\[[^\]]+\])\s*=\s*\(\s*\1\s*\?\?\s*0\s*\)\s*\+\s*1\b/.test(줄)) continue;
    /**
     * 더하는 자리만 본다.
     * 🔴 처음엔 `reduce(` · `+ (` · `+=` 만 봤는데, `표[k] = (표[k] ?? 0) + 줄.조회수;` 를
     *   놓쳤다 — **그건 진짜 합계다.** 위에서 `+ 1` 세는 자리를 이미 뺐으므로,
     *   `?? 0` 뒤에 무엇을 더하는 꼴은 남김없이 본다.
     */
    if (/reduce\(|\+=/.test(줄)) return true;
    if (/\?\?\s*0\s*\)?\s*\+\s*[\w가-힣$([]/.test(줄)) return true;
  }
  return false;
}

/**
 * 🔴🔴🔴 **자가시험이 남의 `--selftest` 를 가로채나.**
 *
 * 8/15 — 92·93·95 빌더가 `build-wikitip-one-out.mjs` 를 import 했다. 그 빌더를
 * `--selftest` 로 돌리자 **import 된 자가 그 argv 를 제 것으로 알고** 제 자가시험을
 * 돌린 뒤 `process.exit` 했다. 부르는 쪽 자가시험은 **한 줄도 안 돌았는데**
 * 화면엔 「자가시험 30개 · ✅ 전부 통과」가 떴다.
 *
 * ⭐ 그래서 셋의 셈이 똑같이 30 이었다. 그게 유일한 표였고, 나는 그것을 **한참 뒤에** 봤다.
 * ⛔ 이 병은 조용하다 — 초록이 뜨기 때문이다. 그러니 검사로 둔다.
 *
 * ⚠ 「import 되는 자만」이 아니라 **전부** 본다. 오늘 안 불려도 내일 불린다.
 */
export function 셀프테스트가드없나(글) {
  if (!/process\.argv\.includes\('--selftest'\)/.test(글)) return false;   // 자가시험이 없는 자
  /**
   * ⭐ 어느 꼴이든 「내가 직접 실행됐나」를 같이 보면 된다.
   * ⚠ **순서를 따지지 않는다** — 가드가 앞에 있든 뒤에 있든 가드다.
   *   🔴 처음엔 앞에 오는 것만 봤고, 제 자가시험이 그것을 잡았다.
   */
  /* 🔴 처음엔 `import.meta.url === path.resolve` 로 찾았는데, 실제 글은
       `fileURLToPath(import.meta.url) === path.resolve` 라 **닫는 괄호에서 빗나갔다.**
       ⭐ 고친 자까지 빨강으로 나왔고, 그것을 보고 알았다. */
  const 가드표 = [
    'import\\.meta\\.url\\)? === path\\.resolve\\(process\\.argv\\[1\\]\\)',
    '내가실행됐다', '내가돌려졌다',
  ];
  return !가드표.some((표) => new RegExp(`${표}[\\s\\S]{0,140}--selftest`).test(글)
    || new RegExp(`--selftest[\\s\\S]{0,140}${표}`).test(글));
}

export const 버릇들 = [
  { key: 'utc', 이름: 'UTC 날짜', 잰다: UTC날짜쓰나, 왜: '새벽에 지으면 하루 앞선다 — _kst.mjs 를 쓴다' },
  { key: 'guard', 이름: '임포트 부수효과', 잰다: 가드없나, 왜: '남이 함수를 가져다 쓰면 파일 쓰기가 딸려 돈다' },
  { key: 'frozen', 이름: '굳은 개수', 잰다: 굳은수있나, 왜: '늘어나면 옳은 변화를 막는 자물쇠가 된다' },
  { key: 'zero', 이름: '빈 값을 0 으로', 잰다: 영으로메우나, 왜: '못 잰 것이 0 이 되면 바닥에 깔린다' },
  { key: 'selftest', 이름: '자가시험 가로채기', 잰다: 셀프테스트가드없나,
    왜: '🔴 import 되면 남의 --selftest 를 제 것으로 알고 돌고 exit 한다 — 남의 시험이 통째로 안 돈다' },
];

export function 훑기(파일들, 읽기) {
  const 표 = Object.fromEntries(버릇들.map((h) => [h.key, []]));
  for (const f of 파일들) {
    const 글 = 읽기(f);
    for (const h of 버릇들) if (h.잰다(글)) 표[h.key].push(f);
  }
  return 표;
}

/* 🔴 이 자부터 제 규칙을 지킨다 — 안 그러면 저를 고발한다 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  /* 🔴🔴 8/15 — 세 빌더의 자가시험이 하루 종일 한 줄도 안 돌았다 */
  참('⛔⛔ 가드 없는 자가시험을 잡는다',
    셀프테스트가드없나("if (process.argv.includes('--selftest')) {\n  const 잼 = [];\n}"));
  참('⭐ import.meta.url 로 막은 것은 통과',
    !셀프테스트가드없나("if (process.argv[1] && import.meta.url === path.resolve(process.argv[1])\n"
      + "  && process.argv.includes('--selftest')) {"));
  참('⭐ 이름 붙인 가드도 알아본다',
    !셀프테스트가드없나("const 내가실행됐다 = 1;\nif (내가실행됐다 && process.argv.includes('--selftest')) {")
    && !셀프테스트가드없나("const 내가돌려졌다 = 1;\nif (내가돌려졌다 && process.argv.includes('--selftest')) {"));
  참('⛔ 자가시험이 없는 자는 고발하지 않는다', !셀프테스트가드없나('export const x = 1;'));
  /* ⚠ 순서가 뒤바뀌어도 가드는 가드다 */
  참('⭐ 순서가 달라도 알아본다',
    !셀프테스트가드없나("if (process.argv.includes('--selftest') && 내가실행됐다) {"));

  참('내 자를 알아본다', 내자인가('build-wikitip-spread.mjs') && 내자인가('check-kcw-indexnow.mjs'));
  참('⛔ 남의 자는 안 본다', !내자인가('build-100y-map.mjs') && !내자인가('collect-kosis-seoulmarkets.mjs'));
  /* 🔴 자기 몸을 글자로 뒤지면 자기에게 걸린다 — KST 를 다루는 둘은 뺀다 */
  참('⛔ KST 를 다루는 자는 자기에게 안 걸린다',
    !내자인가('_kst.mjs') && !내자인가('check-kcw-script-habits.mjs'));
  참('UTC 날짜를 잡는다', UTC날짜쓰나('generated: new Date().toISOString(),'));
  참('KST 를 쓰면 안 잡는다', !UTC날짜쓰나('generated: 오늘(),'));
  참('가드 없는 쓰기를 잡는다', 가드없나('fs.writeFileSync(p, s);'));
  참('가드가 있으면 안 잡는다', 가드없나('const 내가실행됐다 = 1;\nfs.writeFileSync(p, s);') === false);
  참('안 쓰는 자는 안 잡는다', 가드없나('console.log(1)') === false);
  /* 🔴 8/15 — 가드 꼴이 달랐을 뿐인데 빨강을 냈다. 내 습관을 재는 자가 되면 안 된다 */
  참('⭐ argv[1] 로 자기 이름을 맞추는 꼴도 가드다',
    가드없나('if (process.argv[1] && process.argv[1].endsWith("a.mjs")) {\nfs.writeFileSync(p, s);\n}') === false);
  참('굳은 개수를 잡는다', 굳은수있나('재본다("벌이 다섯", 벌들.length, 5)'));
  참('길이 비교가 아니면 안 잡는다', !굳은수있나('재본다("값이 다섯", 벌.값, 5)'));
  /* 🔴 처음엔 37개가 나왔는데 거의 다 거짓이었다. 거짓이 많으면 아무도 안 본다 */
  참('⛔ 함수 호출 결과는 안 잡는다', !굳은수있나('재본다("한 구간", 구간들(["w1"]).length, 1)'));
  참('⛔ 「비었나」는 안 잡는다', !굳은수있나('return { ok: 탈.length === 0 };'));
  참('=== 꼴도 잡는다', 굳은수있나('참("띠가 다섯", 띠.length === 5)'));
  /* 🔴 8/13 손흥민 사고의 자리 — 못 받은 값을 0 으로 **더했다** */
  참('합계의 0 메움을 잡는다', 영으로메우나('const s = xs.reduce((a, r) => a + (r.v ?? 0), 0);'));
  참('⛔ 세는 자리의 첫 값은 안 잡는다', !영으로메우나('m.set(k, (m.get(k) ?? 0) + 1);'));
  /* 🔴 8/15 — 객체로 세는 자리를 빨강으로 냈다. Map 이냐 객체냐로 뜻이 달라지지 않는다 */
  참('⛔ 객체로 세는 자리도 안 잡는다', !영으로메우나('달별셈[v] = (달별셈[v] ?? 0) + 1;'));
  참('⛔ 1 이 아니라 값을 더하면 그건 합계다 — 잡는다',
    영으로메우나('표[k] = (표[k] ?? 0) + 줄.조회수;'));
  참('⛔ 더하지 않는 자리는 안 잡는다', !영으로메우나('const v = x ?? 0;'));
  참('다른 기본값은 안 잡는다', !영으로메우나('const s = xs.reduce((a, r) => a + (r.v ?? null), 0);'));
  /* ⚠ 0 메움을 좁힌 뒤 이 본보기가 안 걸렸다. **더하는 자리**로 바꿔야 맞다 */
  const 표 = 훑기(['a.mjs', 'b.mjs'],
    (f) => (f === 'a.mjs' ? 'new Date().toISOString()' : 'xs.reduce((a, r) => a + (r.v ?? 0), 0)'));
  참('훑으면 버릇별로 모인다', 표.utc.length === 1 && 표.zero.length === 1);
  참('안 걸린 버릇은 빈 목록', 표.guard.length === 0);
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 파일들 = fs.readdirSync(자방).filter((f) => f.endsWith('.mjs') && 내자인가(f));
  const 표 = 훑기(파일들, (f) => fs.readFileSync(path.join(자방, f), 'utf8'));

  console.log(`내 자 ${파일들.length}개를 훑는다 — 같은 버릇으로 틀리는 자리\n`);
  for (const h of 버릇들) {
    const 걸린것 = 표[h.key];
    console.log(`${걸린것.length ? '⚠' : '✅'} ${h.이름.padEnd(16)} ${String(걸린것.length).padStart(3)}개  ${h.왜}`);
    for (const f of 걸린것.slice(0, 5)) console.log(`      · ${f}`);
    if (걸린것.length > 5) console.log(`      … 그리고 ${걸린것.length - 5}개 더`);
  }
  /**
   * ⛔ **실패로 끝내지 않는다.** 옛 자에는 이미 굳은 것이 있고, 다 고치는 것이
   *   늘 옳은 일도 아니다(`?? 0` 은 자리에 따라 맞다). 이 자는 **눈**이지 문지기가 아니다.
   */
  console.log('\n⚠ 이 자는 세기만 한다. 고칠지는 사람이 자리마다 본다.');
}
