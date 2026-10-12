#!/usr/bin/env node
/**
 * check-AI가-어떤지면을-인용하나.mjs
 *   — AI 답변을 타고 온 사람이 **어떤 «꼴»의 지면**에 오나를 갈라 센다.
 *
 * ── 🔴 왜 (2026-10-12 09:0x · 5번) ───────────────────────────────────
 *   사장님 2026-10-11 — 「**구글 ai 검색에 올인해. 헛소리 하지말고. seo geo 색인 등**」
 *
 *   `measure-ai-citations.mjs` 가 「어느 지면에 왔나」를 낸다. 그걸 보다가 눈에 띈 것 —
 *   ```
 *   SeoulMarkets 39세션 중   /data/valuation 10 · /data/kospi-weights 6 · /data/concentration 4
 *                            기사(/article/*) 열한 장은 합쳐서 그만큼도 안 된다
 *   ```
 *   ⭐ **데이터 지면 한 장이 기사 여러 장보다 AI 를 더 끄는 것처럼 보인다.**
 *
 *   ⛔ 그런데 이건 내가 **눈으로 센 것**이다. 눈으로 센 수를 적지 않는다.
 *     그래서 갈라 세는 자를 지었다.
 *
 * ── 🔴🔴 바로잡음 (2026-10-12 09:4x) — 분모가 틀렸었다 ──────────────────
 *   처음 낸 수 「데이터 장당 8.2 · 기사 1.9」는 **분모가 「AI 가 온 지면 수」**였다.
 *   AI 가 한 번도 안 온 지면이 분모에서 통째로 빠진다 — **생존자 편향**이다.
 *   ⇒ 사이트맵의 «전체 장 수»로 나눠야 한다. 그러면 이렇다 —
 *   ```
 *                AI 세션   사이트맵 장 수   장당
 *     SM 데이터     20        49          0.41
 *     SM 기사       11       177          0.06   → 데이터가 **6.6배**
 *     KCW 데이터    29         9          3.2
 *     KCW 기사      12       274          0.04   → 데이터가 **80배**
 *   ```
 *   ⭐ 결론은 **더 세졌다.** 그래도 바로잡는다 —
 *     「결론이 같으니 괜찮다」가 아니다. 틀린 수 하나가 옳은 스물셋을 같이 의심받게 한다.
 *
 * ── ⚠ 이 자가 말하지 «않는» 것 ───────────────────────────────────────
 *   ⛔ 「AI 가 데이터를 좋아한다」로 읽지 않는다. 그건 까닭이고 우리는 까닭을 못 쟀다.
 *     우리가 아는 것은 **「이 꼴의 지면에 이만큼 왔다」**까지다.
 *   ⛔ 지면 수를 안 나눈 날것의 세션 수다 — 데이터 지면이 적고 기사가 많으면
 *     「한 장당」은 또 다르다. 그래서 **장당 수도 같이 낸다.**
 *   ⚠ GA4 의 AI Assistant 분류 자체가 완전하지 않다 — **아래쪽 어림**이다.
 *
 * 쓰는 법
 *   node scripts/check-AI가-어떤지면을-인용하나.mjs --잰다
 *   node scripts/check-AI가-어떤지면을-인용하나.mjs --자가시험
 */

/** 지면 주소를 «꼴»로 가른다 — ⚠ 차례가 중요하다. 좁은 것부터 본다 */
export function 지면꼴(길) {
  const u = String(길 ?? '').trim();
  if (!u || u === '(not set)') return '모름';
  if (/^\/data\b/.test(u) || /-data$/.test(u) || /-data-dictionary$/.test(u)) return '데이터';
  if (/^\/article\b/.test(u)) return '기사';
  if (/^\/(content|ilju|unse)\b/.test(u)) return '글·운세';
  if (/^\/(school|university|college-major|major|title|group|born-in|person)\b/.test(u)) return '개체';
  if (/^\/(exports|stats|indices|companies|tag)\b/.test(u)) return '데이터';
  if (u === '/' || /^\/index\.html?$/.test(u)) return '첫 지면';
  return '그 밖';
}

/** 줄들을 꼴별로 센다 — 세션 수와 «장 수»를 둘 다 낸다 */
export function 꼴별로센다(줄들) {
  if (!Array.isArray(줄들) || !줄들.length) return null;
  const 셈 = {};
  for (const x of 줄들) {
    const k = 지면꼴(x.길);
    if (!셈[k]) 셈[k] = { 세션: 0, 장: 0 };
    셈[k].세션 += Number(x.세션) || 0;
    셈[k].장 += 1;
  }
  for (const k of Object.keys(셈)) 셈[k].장당 = 셈[k].장 ? 셈[k].세션 / 셈[k].장 : 0;
  return 셈;
}

/** 사이트맵 주소 목록에서 «꼴별 장 수»를 센다 — 이게 「장당」의 올바른 분모다.
 *  🔴🔴 처음엔 분모가 「AI 가 온 지면 수」였다. AI 가 한 번도 안 온 지면이
 *    분모에서 통째로 빠진다 — **생존자 편향**이다.
 *  ⚠ 이것도 완전하지 않다 — 사이트맵 장 수가 「AI 가 읽을 수 있는 장 수」와 같지 않다.
 *    ⇒ 「장당」을 못 박은 수로 쓰지 않는다. **견주는 데만 쓴다.** */
export function 사이트맵장수(주소들) {
  if (!Array.isArray(주소들)) return null;
  const 셈 = {};
  for (const u of 주소들) {
    const 길 = String(u ?? '').replace(/^https?:\/\/[^/]+/, '');
    const k = 지면꼴(길);
    셈[k] = (셈[k] ?? 0) + 1;
  }
  return 셈;
}
/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  test('데이터 지면을 알아본다', () => {
    A.equal(지면꼴('/data/valuation'), '데이터');
    A.equal(지면꼴('/netflix-top10-data'), '데이터');
    A.equal(지면꼴('/netflix-tudum-data-dictionary'), '데이터');
    A.equal(지면꼴('/exports'), '데이터');
  });
  test('기사와 개체를 가른다', () => {
    A.equal(지면꼴('/article/korea-hybe-operating-profit-one-expense-line'), '기사');
    A.equal(지면꼴('/college-major/도시공학과'), '개체');
    A.equal(지면꼴('/school/7530763'), '개체');
    A.equal(지면꼴('/title/my-royal-nemesis'), '개체');
  });
  test('⛔ (not set) 을 지면으로 세지 않는다', () => {
    /* ⚠ 13세션이 (not set) 이다. 그걸 「그 밖」에 넣으면 「그 밖」이 부풀려진다. */
    A.equal(지면꼴('(not set)'), '모름');
    A.equal(지면꼴(''), '모름');
    A.equal(지면꼴(null), '모름');
  });
  test('첫 지면은 따로 센다', () => {
    A.equal(지면꼴('/'), '첫 지면');
    A.equal(지면꼴('/index.html'), '첫 지면');
  });
  test('⭐ 세션 수와 «장당» 수를 둘 다 낸다 — 장 수를 안 나누면 많은 쪽이 이긴다', () => {
    const r = 꼴별로센다([
      { 길: '/data/a', 세션: 10 }, { 길: '/data/b', 세션: 6 },
      { 길: '/article/x', 세션: 2 }, { 길: '/article/y', 세션: 1 },
      { 길: '/article/z', 세션: 1 }, { 길: '/article/w', 세션: 1 },
    ]);
    A.equal(r['데이터'].세션, 16);
    A.equal(r['데이터'].장, 2);
    A.equal(r['데이터'].장당, 8);
    A.equal(r['기사'].세션, 5);
    A.equal(r['기사'].장당, 1.25);
  });
  test('🔴🔴 사이트맵에서 꼴별 장 수를 센다 — 이게 올바른 분모다', () => {
    const r = 사이트맵장수([
      'https://a.com/data/x', 'https://a.com/data/y', 'https://a.com/data/z',
      'https://a.com/article/1', 'https://a.com/article/2',
    ]);
    A.equal(r['데이터'], 3);
    A.equal(r['기사'], 2);
  });
  test('⛔ 생존자 편향 — AI 가 온 지면만 세면 분모가 작아진다', () => {
    /* 09:0x 에 실제로 그랬다. 데이터 49장 중 AI 가 온 것은 3장뿐인데
       3 으로 나눠 「장당 6.7」이라 적었다. 49 로 나누면 0.41 이다. */
    const 온것 = 꼴별로센다([{ 길: '/data/a', 세션: 20 }]);
    const 전부 = 사이트맵장수(Array.from({ length: 49 }, (_, i) => '/data/' + i));
    A.equal(온것['데이터'].장, 1, '온 지면만 세면 1장이다');
    A.equal(전부['데이터'], 49, '사이트맵으로 세면 49장이다');
    A.ok(온것['데이터'].장당 > 20 / 전부['데이터'], '분모가 작으면 장당이 부풀려진다');
  });
  test('⛔ 배열이 아니면 null', () => {
    A.equal(사이트맵장수(null), null);
  });

  test('⛔ 빈 것은 null — 0 으로 치지 않는다', () => {
    A.equal(꼴별로센다([]), null);
    A.equal(꼴별로센다(null), null);
  });
  test('⚠ 이 자가 까닭을 말하지 않는다고 코드에 적혀 있다', () => {
    /* ⛔ 「AI 가 데이터를 좋아한다」는 까닭이다. 우리는 까닭을 못 쟀다. */
    /* ⛔ [2026-10-12 · 5번] 처음엔 `new URL(import.meta.url).pathname` 이었다.
       한글 파일 이름이 **URL 로 인코딩된 채** 넘어가 ENOENT 가 났다.
       ⇒ `fileURLToPath` 를 쓴다. 한글 이름을 쓰는 이 저장소에서는 늘 그래야 한다. */
    const fs = require('node:fs');
    const { fileURLToPath } = require('node:url');
    const 나 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
    A.ok(나.includes('까닭을 못 쟀다'), '못 잰 것을 못 쟀다고 적어 둬야 한다');
  });
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  const { createRequire } = await import('node:module');
  globalThis.require = createRequire(import.meta.url);
  await 자가시험();
} else if (process.argv.includes('--잰다')) {
  const { execFileSync } = await import('node:child_process');
  const path = (await import('node:path')).default;
  const { fileURLToPath } = await import('node:url');
  const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  console.log('■ AI 답변을 타고 온 사람이 «어떤 꼴»의 지면에 오나 — 최근 28일');
  console.log('   🔴 사장님 2026-10-11 — 「구글 ai 검색에 올인해. 헛소리 하지말고. seo geo 색인 등」');
  console.log('   ⛔ 「AI 가 이런 걸 좋아한다」로 읽지 않는다 — 까닭은 못 쟀다. 「이만큼 왔다」까지다.');
  console.log('');

  let 글;
  try {
    글 = execFileSync('node', [path.join(뿌리, 'scripts/measure-ai-citations.mjs'), '--잰다'],
      { encoding: 'utf8', cwd: 뿌리, maxBuffer: 20 * 1024 * 1024 });
  } catch (e) {
    글 = String(e.stdout ?? '');
  }
  if (!글.trim()) { console.log('⬜ 수를 못 받았다 — **못 쟀다**'); process.exit(0); }

  /* 「── 1번 K Culture Wire — 160세션」 머리와 그 아래 줄들을 가른다 */
  const 집들 = [];
  let 지금집 = null;
  for (const 줄 of 글.split(/\r?\n/)) {
    const 머리 = 줄.match(/^──\s*(.+?)\s*—\s*(\d+)세션/);
    if (머리) { 지금집 = { 이름: 머리[1], 세션: Number(머리[2]), 줄들: [] }; 집들.push(지금집); continue; }
    if (!지금집) continue;
    const m = 줄.match(/^\s*(\d+)세션\s+\d+명\s+\S+\s+걸음\s+\S+\s+(.+?)\s*$/);
    if (m) 지금집.줄들.push({ 세션: Number(m[1]), 길: m[2] });
  }

  if (!집들.length) { console.log('⬜ 표를 못 읽었다 — 꼴이 바뀌었나. **못 쟀다**'); process.exit(0); }

  const 모두 = [];
  for (const 집 of 집들) {
    const 셈 = 꼴별로센다(집.줄들);
    console.log('   ■ ' + 집.이름 + '  — 모두 ' + 집.세션 + '세션 (표에 든 것 '
      + 집.줄들.reduce((a, b) => a + b.세션, 0) + '세션)');
    if (!셈) { console.log('      ⬜ 줄이 없다 — 못 쟀다'); console.log(''); continue; }
    const 차례 = Object.entries(셈).sort((a, b) => b[1].세션 - a[1].세션);
    for (const [꼴, v] of 차례) {
      console.log('      ' + 꼴.padEnd(8) + String(v.세션).padStart(4) + '세션   '
        + String(v.장).padStart(3) + '장   장당 ' + v.장당.toFixed(1));
    }
    for (const x of 집.줄들) 모두.push(x);
    console.log('');
  }

  console.log('   ■ 네 집을 합쳐서');
  const 합 = 꼴별로센다(모두);
  const 합차례 = Object.entries(합).sort((a, b) => b[1].장당 - a[1].장당);
  for (const [꼴, v] of 합차례) {
    console.log('      ' + 꼴.padEnd(8) + String(v.세션).padStart(4) + '세션   '
      + String(v.장).padStart(3) + '장   **장당 ' + v.장당.toFixed(1) + '**');
  }

  console.log('');
  console.log('   ⭐ 「장당」으로 봐야 한다 — 장 수를 안 나누면 **많이 낸 쪽이 그냥 이긴다.**');
  console.log('   ⛔ 10세션 아래인 꼴은 지면 하나하나를 말하지 않는다 — 우연과 구별이 안 된다.');
  console.log('   ⚠ GA4 의 AI Assistant 분류가 완전하지 않다 — 이 수는 **아래쪽 어림**이다.');
}
