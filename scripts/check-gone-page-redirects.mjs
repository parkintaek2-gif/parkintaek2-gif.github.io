#!/usr/bin/env node
/**
 * check-gone-page-redirects.mjs — **사라진 지면이 살아 있는 이웃으로 가고 있나.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만드나 — 2026-09-03 실측 · 5번]
 *   사장님: 「낮은 방문자의 더 큰 원인은 … **검색엔진이 아직 우리를 실어주지 않는
 *   초기 단계 문제**입니다」(4번 진단) 「모든 세션들과 함께 해결방법을 찾으라」
 *
 *   그래서 KCW 의 노출 큰 지면 60장을 하나씩 눌러 봤다. **다섯 장이 404 였다.**
 *   ```
 *   /esports                                    노출 166
 *   /article/korea-challenger-win-rate          노출 151
 *   /article/korea-ladder-games-played          노출 104
 *   /ladder-gap                                 노출  28
 *   /article/the-top-tier-is-where-players-stay 노출  21
 *   ──────────────────────────────────────────── 합 470  (전체 5,010의 9.4%)
 *   ```
 *   ⭐ **검색엔진은 우리를 실어 주고 있었다.** 우리가 그 자리를 비워 둔 것이다.
 *      그러니 이 다섯 건에 대해서는 4번의 진단이 맞지 않는다 — 안 실어 준 것이 아니다.
 *
 * [왜 검사로 두나]
 *   되돌림 표는 `server.mjs` 안의 «한 덩이 글자»다. 누가 그 줄을 지우거나
 *   보낼 곳 지면이 없어지면 **아무 소리 없이** 470건이 다시 404 로 샌다.
 *   ⛔ 조용히 새는 것이 제일 나쁘다. 그래서 자로 둔다.
 *
 * [두 가지를 본다]
 *   1. 표에 든 옛 주소가 301 을 내나 (200 이나 404 면 흠)
 *   2. **보낼 곳이 실제로 200 인가** — 보낼 곳이 죽으면 되돌림이 404 로 이어진다.
 *      ⛔ 그게 제일 나쁜 꼴이다. 손님은 두 번 헛걸음한다
 *
 * [쓰는 법]
 *   node scripts/check-gone-page-redirects.mjs            라이브에 물어본다
 *   node scripts/check-gone-page-redirects.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 서버길 = path.join(뿌리, 'server.mjs');

/**
 * ⚠ [2026-09-03 6번] 처음엔 `바탕`이 kculturewire 하나로 고정돼 있었다 — 이 표가
 * KCW 항목만 있었을 때는 맞았지만, SeoulMarkets(접두사 없음) 항목을 더하면서
 * 그 항목들이 «잘못된 도메인»(kculturewire)에 물어봐지는 조용한 결함이 됐다.
 * 표 안의 접두사로 사이트를 가려 «자기 도메인»에 묻는다. server.mjs 의
 * SITE_PREFIX 와 같은 지도를 여기도 둔다 — 한쪽만 늘면 다른 쪽이 거짓말한다.
 */
const 접두사별도메인 = [
  { 접두사: '/wikitip', 바탕: 'https://www.kculturewire.com' },
  { 접두사: '/100y', 바탕: 'https://100yearmap.com' },
  { 접두사: '', 바탕: 'https://seoulmarkets.com' }, // 접두사 없음 — 반드시 맨 뒤(가장 안 걸리는 것으로)
];
export function 도메인고르기(내부길) {
  const p = String(내부길 ?? '');
  const 맞는것 = 접두사별도메인.find((x) => x.접두사 && p.startsWith(x.접두사));
  return (맞는것 ?? 접두사별도메인[접두사별도메인.length - 1]).바탕;
}

/**
 * server.mjs 에서 되돌림 표를 «읽어 온다».
 * ⛔ 이 자에 표를 다시 적지 않는다 — 두 곳에 적으면 한쪽만 고쳐지고 자가 거짓말을 한다.
 *    우리 강령이 「하나를 고치면 인용한 곳까지 따라간다」인데, 애초에 한 곳만 두는 것이 낫다.
 */
export function 표읽기(글) {
  const m = String(글 ?? '').match(/const 사라진지면 = \{([\s\S]*?)\};/);
  if (!m) return null;
  const 표 = {};
  for (const 줄 of m[1].split('\n')) {
    const g = 줄.match(/'([^']+)':\s*'([^']+)'/);
    if (g) 표[g[1]] = g[2];
  }
  return Object.keys(표).length ? 표 : null;
}

/** 접두사를 떼어 «손님이 보는 주소»로 만든다. 접두사를 안 주면 표에서 맞는 것을 스스로 찾는다. */
export function 손님주소(내부길, 접두사) {
  const p = String(내부길 ?? '');
  const 쓸접두사 = 접두사 ?? (접두사별도메인.find((x) => x.접두사 && p.startsWith(x.접두사))?.접두사 ?? '');
  return 쓸접두사 && p.startsWith(쓸접두사) ? (p.slice(쓸접두사.length) || '/') : p;
}

function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  const 본보기 = "const 사라진지면 = {\n  '/wikitip/esports': '/esports-nations',\n  '/wikitip/ladder-gap': '/esports-nations',\n};";
  const t = 표읽기(본보기);
  본다('표를 읽는다', t && Object.keys(t).length === 2);
  본다('보낼 곳을 읽는다', t && t['/wikitip/esports'] === '/esports-nations');
  /* ⛔ 표가 없어진 것을 「빈 표」로 읽으면 자가 조용히 통과한다 */
  본다('표가 없으면 null 이다 (빈 표가 아니다)', 표읽기('const 다른것 = {};') === null);
  본다('빈 표도 null 이다', 표읽기('const 사라진지면 = {\n};') === null);

  본다('접두사를 뗀다', 손님주소('/wikitip/esports') === '/esports');
  본다('접두사만 있으면 홈이다', 손님주소('/wikitip') === '/');
  본다('접두사가 없으면 그대로 둔다', 손님주소('/esports') === '/esports');

  /* 🔴 실제 파일에서도 읽히나 — 자가 «지금 이 저장소»에서 도는지 본다 */
  const 진짜 = fs.existsSync(서버길) ? 표읽기(fs.readFileSync(서버길, 'utf8')) : null;
  본다('server.mjs 에서 실제로 표를 읽는다', 진짜 !== null && Object.keys(진짜).length >= 5);
  /* ⚠ 2026-09-03 6번 — 예전엔 「모든 값이 /esports로 시작한다」였다. SeoulMarkets
   * 항목(비-esports)을 더하면서 그 가정이 깨졌다 — 표가 KCW 전용이 아니게 됐으니
   * 자가시험도 「내부 경로 모양이 맞나」로 넓힌다(값은 항상 절대경로 /로 시작). */
  본다('그 표의 보낼 곳이 다 내부경로(/로 시작)다',
    진짜 !== null && Object.values(진짜).every((v) => v.startsWith('/')));
  본다('도메인고르기가 접두사로 사이트를 가른다',
    도메인고르기('/wikitip/x') === 'https://www.kculturewire.com' &&
    도메인고르기('/100y/x') === 'https://100yearmap.com' &&
    도메인고르기('/article/x') === 'https://seoulmarkets.com');

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

async function 코드(u) {
  try {
    const r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    return { 코드: r.status, 어디로: r.headers.get('location') };
  } catch (e) { return { 못쟀다: String(e.message).slice(0, 50) }; }
}

async function main() {
  const 인자 = process.argv.slice(2);
  console.log('# 사라진 지면이 살아 있는 이웃으로 가고 있나\n');
  const 흠 = 자가시험();
  if (인자.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 재지 않는다.'); process.exit(1); }

  const 표 = 표읽기(fs.readFileSync(서버길, 'utf8'));
  if (!표) {
    console.log('\n🔴 **server.mjs 에 되돌림 표가 없다.**');
    console.log('   28일에 노출 470건이 우리 404 로 새고 있었고, 그것을 막던 표다.');
    console.log('   ⛔ 지웠다면 까닭을 남기고 이 자도 함께 고친다. 조용히 사라지면 안 된다.');
    process.exit(1);
  }

  console.log(`\n표에 든 옛 주소 ${Object.keys(표).length}개 — 각자 자기 도메인에 물어본다\n`);
  let 나쁨 = 0;
  const 보낼곳들 = new Map(); // 보낼곳 → 도메인 (되돌림 Location 은 절대경로라, 시킨 쪽과 같은 사이트로 문는다)

  for (const [내부, 보낼곳] of Object.entries(표)) {
    const 바탕 = 도메인고르기(내부);
    보낼곳들.set(보낼곳, 바탕);
    const 옛 = 손님주소(내부);
    const r = await 코드(바탕 + 옛);
    if (r.못쟀다) { console.log(`  ⬜ 못 쟀다 — ${바탕}${옛} (${r.못쟀다})`); 나쁨 += 1; continue; }
    if (r.코드 !== 301) {
      console.log(`  🔴 ${바탕}${옛} — 301 이 아니라 ${r.코드} 다`);
      나쁨 += 1; continue;
    }
    const 맞나 = String(r.어디로 || '').endsWith(보낼곳);
    console.log(`  ${맞나 ? '✅' : '🔴'} ${바탕}${옛}  →  ${r.어디로}${맞나 ? '' : `  (표는 ${보낼곳} 라고 한다)`}`);
    if (!맞나) 나쁨 += 1;
  }

  console.log('\n보낼 곳이 실제로 사나 — 여기가 죽으면 손님이 두 번 헛걸음한다');
  for (const [p, 바탕] of 보낼곳들) {
    const r = await 코드(바탕 + p);
    const 산다 = r.코드 === 200;
    console.log(`  ${산다 ? '✅' : '🔴'} ${바탕}${p} — ${r.못쟀다 ? '못 쟀다' : r.코드}`);
    if (!산다) 나쁨 += 1;
  }

  if (!나쁨) {
    console.log('\n✅ 다 맞다 — 옛 주소가 301 로 가고, 보낼 곳이 다 살아 있다');
    process.exit(0);
  }
  console.log(`\n🔴 흠 ${나쁨}건`);
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-gone-page-redirects.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
