#!/usr/bin/env node
/**
 * check-data지면-색인됐나.mjs — **`/data/` 갈래가 왜 투명한지 구글에게 직접 묻는다**
 *
 * ── 🔴 왜 이 자가 필요한가 (2026-10-10 11:5x · 5번) ──────────────────────
 *
 * 28일 page 차원을 갈래별로 갈랐더니 `/data/` 만 유별나게 낮았다.
 * ```
 *   /article   178장 중 56장이 떴다 (31.5%)
 *   /japan   3,736장 중 607장      (16.2%)
 *   /company 2,521장 중 324장      (12.9%)
 *   /data       49장 중   2장      ( 4.1%)   ← 유별나다
 *   /taiwan  1,090장 중   3장      ( 0.3%)
 * ```
 * 🔴 **나이 탓이 아니었다.** 만든 날로 갈라 보니 **2026-08-08 에 낸 지면도 두 달째 0장**이다.
 *
 * ⚠ 여기까지 오면서 내가 두 번 짐작하고 두 번 틀렸다 —
 *   ① 「`/data/` 는 새 지면이라 그렇다」 → 만든 날로 가르니 8월 것도 0이었다
 *   ② 「주소가 `broker-candour`·`mezzanine` 이라 아무도 안 친다」
 *      → **제목을 전수로 보니 좋았다.** 「What share of KOSPI is each company?」 같은 것들이다.
 *        주소 이름을 보고 제목을 짐작한 것이다.
 * ⛔ 세 번째 짐작을 하지 않는다. **구글에게 묻는다.**
 *
 * ── 이 자가 묻는 것 ──────────────────────────────────────────────────
 * Search Console 의 URL 검사 API 는 지면마다 이렇게 답해 준다 —
 *   · 색인됐나(coverageState)        「URL is on Google」 / 「Crawled - currently not indexed」 …
 *   · 마지막으로 수집해 간 날         한 번도 안 왔으면 비어 있다
 *   · 구글이 고른 «대표 주소»         우리 것과 다르면 그 지면은 통째로 다른 주소로 묶인 것이다
 *
 * ⚠ 이 API 는 **하루 호출 수가 적다.** 그래서 한 번에 다 묻지 않고 `--몇개` 로 끊는다.
 *   ⛔ 「전수로 못 재면 안 잰다」가 아니다. 표본으로 재고 **표본이라고 적는다.**
 *
 * 돌리기:  node scripts/check-data지면-색인됐나.mjs            앞 8장
 *          node scripts/check-data지면-색인됐나.mjs --몇개 20
 *          node scripts/check-data지면-색인됐나.mjs --갈래 article   견줄 짝
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 토큰받기, 사이트들 } from './fetch-gsc.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = process.argv.slice(2);
const 집기 = (이름, 기본) => {
  const i = 인자.indexOf(이름);
  return i >= 0 && 인자[i + 1] && !인자[i + 1].startsWith('--') ? 인자[i + 1] : 기본;
};
const 갈래 = 집기('--갈래', 'data');
const 몇개 = Number(집기('--몇개', '8'));

const 지면방 = path.join(뿌리, 'dist', 갈래);
if (!fs.existsSync(지면방)) {
  console.log(`⚠ ${path.relative(뿌리, 지면방)} 이 없다 — 먼저 빌드해야 잴 수 있다(못 쟀다)`);
  process.exit(0);
}

/* 뜬 적이 «없는» 지면을 먼저 묻는다 — 궁금한 것이 그쪽이다 */
let 뜬주소 = new Set();
try {
  const 방 = path.join(뿌리, 'src', 'data');
  const 것 = fs.readdirSync(방).filter((n) => /^gsc-seoulmarkets-page-.*\.json$/.test(n)).sort().at(-1);
  if (것) {
    const a = JSON.parse(fs.readFileSync(path.join(방, 것), 'utf8')).rows ?? [];
    뜬주소 = new Set(a.map((r) => String(r.key).replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '')));
  }
} catch { /* 없으면 그냥 차례대로 묻는다 */ }

const 모두 = fs.readdirSync(지면방)
  .filter((n) => n.endsWith('.html') && n !== 'index.html')
  .map((n) => `/${갈래}/${n.replace(/\.html$/, '')}`);
const 안뜬것 = 모두.filter((u) => !뜬주소.has(u));
const 볼것 = (안뜬것.length ? 안뜬것 : 모두).slice(0, 몇개);

console.log(`■ /${갈래}/ 색인 상태를 구글에 직접 묻는다`);
console.log(`   지면 ${모두.length}장 · 28일에 한 번도 안 뜬 것 ${안뜬것.length}장`);
console.log(`   ⚠ URL 검사 API 는 하루 호출 수가 적다 — **${볼것.length}장만 묻는다(표본이다)**\n`);

const { 토큰 } = await 토큰받기();
const 속성 = 사이트들.seoulmarkets.속성;
const 셈 = {};

for (const 길 of 볼것) {
  const 주소 = `https://seoulmarkets.com${길}`;
  let j = null;
  try {
    const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: 주소, siteUrl: 속성, languageCode: 'ko' }),
    });
    if (!r.ok) { console.log(`■ ${길}\n   ⚠ 못 물었다 HTTP ${r.status} — **못 쟀다**`); continue; }
    j = await r.json();
  } catch (e) { console.log(`■ ${길}\n   ⚠ 못 물었다 — ${String(e.message).slice(0, 40)}`); continue; }

  const i = j.inspectionResult?.indexStatusResult ?? {};
  const 상태 = i.coverageState ?? '(모름)';
  셈[상태] = (셈[상태] ?? 0) + 1;
  const 왔나 = i.lastCrawlTime ? i.lastCrawlTime.slice(0, 10) : '🔴 한 번도 안 왔다';
  console.log(`■ ${길}`);
  console.log(`   ${i.verdict === 'PASS' ? '✅' : '🔴'} ${상태} · 마지막 수집 ${왔나}`);
  if (i.robotsTxtState && i.robotsTxtState !== 'ALLOWED') console.log(`   🔴 로봇 ${i.robotsTxtState}`);
  if (i.pageFetchState && i.pageFetchState !== 'SUCCESSFUL') console.log(`   🔴 수집 ${i.pageFetchState}`);
  if (i.googleCanonical && i.googleCanonical !== 주소) {
    console.log(`   🔴 구글이 고른 대표 주소가 «다르다» — ${i.googleCanonical.replace('https://seoulmarkets.com', '')}`);
  }
  if (i.referringUrls?.length) console.log(`   들어오는 링크 ${i.referringUrls.length}개`);
}

console.log('\n■ 표본 ' + Object.values(셈).reduce((a, b) => a + b, 0) + '장의 상태');
for (const [k, v] of Object.entries(셈).sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(3)}장  ${k}`);

console.log('\n⚠ 표본이다 — 사이트 전체가 이렇다고 읽지 않는다.');
console.log('⭐ 다만 「색인은 됐는데 순위가 없다」와 「애초에 색인이 안 됐다」는');
console.log('   **고치는 길이 완전히 다르다.** 그것을 가르려고 묻는 것이다.');
