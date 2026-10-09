#!/usr/bin/env node
/**
 * 찾는다-배포표식.mjs — **이번 배포가 실제로 바꾼 낱말을 스스로 찾는다.** (5번 2026-10-09)
 *
 * ── 🔴🔴 왜 만드나 ─────────────────────────────────────────────────────────
 * `deploy.mjs` 는 `--표식 <주소> <낱말>` 을 받으면 배포 뒤 ✅/❌ 를 낸다.
 * 그런데 `배포-한줄로.mjs` 가 그것을 **한 번도 안 줬다.** 그래서 내 배포는 늘
 * 「⬜ 판정 모름」으로 끝났고, 1번이 매시 소통마다 그것을 적어 올렸다(10-09 두 번).
 *   ⛔ 「모름」은 실패가 아니다. 그러나 **매번 모르면 그 검사는 없는 것과 같다.**
 *   ⛔ 「다음부터 표식을 같이 주십시오」는 **사람이 기억해서 지키는 구조**다. 그래서 안 지켜졌다.
 * ⭐ 그러니 사람에게 묻지 않고 **스스로 찾는다** — 라이브와 갓 지은 dist 를 견줘
 *   「라이브에는 없고 dist 에는 있는 낱말」을 집는다. 그것이 곧 이번에 바뀐 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────────
 * ⛔ 못 찾으면 **아무것도 내지 않는다.** 아무 낱말이나 지어내면 ❌ 가 나서 거짓 빨강이 된다.
 * ⛔ 숫자만으로 된 낱말은 안 쓴다 — 지면마다 흔해서 딴 데서 걸린다.
 * ⚠ 라이브가 캐시를 물고 있으면 「바뀌었는데 없다」로 보일 수 있다. 그래서 **여러 지면**을 본다.
 *
 * 쓰는 법
 *   node scripts/찾는다-배포표식.mjs --자가시험
 *   node scripts/찾는다-배포표식.mjs             찾으면 "<주소> <낱말>" 한 줄, 못 찾으면 빈 줄
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
export const 밑주소 = 'https://seoulmarkets.com';

/**
 * 글에서 «낱말»을 거둔다. 태그와 글자가 아닌 것은 버린다.
 * ⛔ 숫자만으로 된 것은 안 거둔다 — 흔해서 딴 지면에서도 걸린다.
 */
export function 낱말거두기(글) {
  const t = String(글 ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
  const 낸다 = new Set();
  for (const m of t.matchAll(/[A-Za-z가-힣][A-Za-z가-힣0-9()._-]{3,39}/g)) 낸다.add(m[0]);
  /* 🔴 [2026-10-09] 대만 지면은 제목에 «(1323)» 만 새로 붙었다. 위 무늬는 글자로 시작해야
     해서 그것을 못 집었다 — 「못 찾았다」가 떴다. 괄호에 싸인 수는 종목코드라 또렷하다.
     ⛔ 맨 수(1323)는 안 집는다 — 딴 지면에도 흔하다. 괄호째 집어야 또렷하다. */
  for (const m of t.matchAll(/\(\d{3,6}\)/g)) 낸다.add(m[0]);
  return 낸다;
}

/**
 * dist 에만 있고 라이브에는 없는 낱말 하나.
 * @returns {string|null} 못 찾으면 null — ⛔ 지어내지 않는다
 */
export function 새낱말찾기(dist글, 라이브글) {
  if (typeof dist글 !== 'string' || typeof 라이브글 !== 'string') return null;
  const 라 = 낱말거두기(라이브글);
  /* 긴 낱말이 더 또렷하다 — 길이가 긴 것부터 본다 */
  const 후보 = [...낱말거두기(dist글)].filter((w) => !라.has(w));
  후보.sort((a, b) => b.length - a.length);
  return 후보[0] ?? null;
}

/** dist 에서 그 주소에 맞는 파일 길 — 두 꼴을 다 본다 */
export function dist길후보(길) {
  const b = String(길 ?? '').replace(/^\//, '').replace(/\/$/, '');
  if (!b) return [path.join(뿌리, 'dist', 'index.html')];
  return [
    path.join(뿌리, 'dist', `${b}.html`),
    path.join(뿌리, 'dist', b, 'index.html'),
  ];
}

/* ── 자가시험 ───────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 것 = []; const 다 = (이름, 참) => 것.push({ 이름, 참: !!참 });

  다('태그를 걷고 낱말만 거둔다', 낱말거두기('<p>hello world</p>').has('hello'));
  다('스크립트 속은 안 거둔다', !낱말거두기('<script>secretword</script>').has('secretword'));
  다('짧은 것은 안 거둔다', !낱말거두기('<p>ab</p>').has('ab'));
  다('⛔ 숫자만으로 된 것은 안 거둔다', !낱말거두기('<p>12345</p>').has('12345'));
  다('한글도 거둔다', 낱말거두기('<p>진학률입니다</p>').has('진학률입니다'));

  다('🔴 dist 에만 있는 낱말을 집는다',
    새낱말찾기('<p>alpha earningsresults</p>', '<p>alpha</p>') === 'earningsresults');
  다('긴 것부터 집는다',
    새낱말찾기('<p>zzzz longernewword</p>', '<p></p>') === 'longernewword');
  다('⛔ 같은 글이면 null — 지어내지 않는다', 새낱말찾기('<p>same</p>', '<p>same</p>') === null);
  다('⛔ 글이 아니면 null', 새낱말찾기(null, '<p>x</p>') === null);
  다('⛔ 라이브를 못 받았으면 null', 새낱말찾기('<p>x</p>', null) === null);

  /* 🔴 [2026-10-09] 대만 지면은 제목에 «(1323)» 만 붙었다. 처음 무늬로는 못 집어
     「못 찾았다」가 떴다 — 그 자리를 시험으로 굳힌다 */
  다('🔴 괄호에 싸인 종목코드를 집는다',
    새낱말찾기('<title>YONYU (1323) x</title>', '<title>YONYU x</title>') === '(1323)');
  다('⛔ 맨 수는 안 집는다 — 딴 지면에도 흔하다', !낱말거두기('<p>1323</p>').has('1323'));

  다('dist 길 두 꼴을 다 본다', dist길후보('/taiwan/company/yonyu').length === 2);
  다('뿌리는 index.html', dist길후보('/')[0].endsWith('index.html'));

  const 진 = 것.filter((x) => !x.참);
  console.error(`배포표식 찾기 — 자체 점검 ${것.length - 진.length}/${것.length}`);
  for (const x of 진) console.error('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

/* 🔴🔴 [2026-10-09 · 5번] **가져오면 도는 자였다 — 오늘 벌써 두 번째다.**
   아침에 `check-indexnow-보냈나.mjs` 에서 똑같은 흠을 내고 고쳤는데, 몇 시간 뒤
   이 파일을 지으면서 **또 같은 꼴로 지었다.** 그 자리에서 잡았다.
   ⛔ 내보낼 것이 있는 자는 **직접 불렸을 때만** 돈다. 예외 없다.
   ⚠ 고친 자리를 기억해서 다음에 안 틀리는 구조가 아니다 — 그래서 여기 크게 적어 둔다. */
/** 볼 지면 — 갈래마다 하나씩. ⛔ 한 장만 보면 그 장이 안 바뀐 날 못 찾는다 */
export const 볼지면 = [
  '/', '/companies', '/japan/companies', '/data', '/article',
  '/taiwan/company/yonyu', '/japan/company/komatsu-matere', '/rankings',
];

const { pathToFileURL } = await import('node:url');
const 직접불렸나 = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!직접불렸나) {
  /* 가져다 쓰는 쪽이다 — 아무것도 찍지 않고 여기서 멈춘다 */
} else {

/* ── 실제로 찾는다 ─────────────────────────────────────────────────────── */

async function 라이브받기(길) {
  try {
    const r = await fetch(밑주소 + 길, {
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

let 찾음 = null;
for (const 길 of 볼지면) {
  const p = dist길후보(길).find((x) => fs.existsSync(x));
  if (!p) continue;
  const dist글 = fs.readFileSync(p, 'utf8');
  const 라이브글 = await 라이브받기(길);
  if (라이브글 == null) continue;      /* ⬜ 못 받았으면 건너뛴다 — 「안 바뀌었다」가 아니다 */
  const w = 새낱말찾기(dist글, 라이브글);
  if (w) { 찾음 = { 길, 낱말: w }; break; }
}

if (!찾음) {
  console.error('⬜ 바뀐 낱말을 못 찾았다 — 표식 없이 배포한다(판정은 「모름」이 된다)');
  console.error('   ⛔ 아무 낱말이나 지어내지 않는다. 거짓 ❌ 를 내는 것보다 「모름」이 낫다');
  process.exit(0);
}
/* 부르는 쪽이 그대로 쓸 수 있게 한 줄로 낸다 */
console.log(`${밑주소}${찾음.길} ${찾음.낱말}`);
console.error(`⭐ 표식을 찾았다 — ${찾음.길} 에 새로 생긴 낱말 「${찾음.낱말}」`);
}
