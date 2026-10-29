/**
 * 잰다-케이리뷰-날마다-몇건.mjs — **그날 케이리뷰가 몇 건, 어느 분류로 나갔나.**
 *
 * ── 🔴🔴 사장님 지시 (2026-10-29, 원문) ───────────────────────────────
 * 「**하루에 한 건씩 카테고리별로 작성해…모두 7개/일**」
 * 「**배구 개막 후에는 8건/일, 배구 개막 전에는 7건/일**」
 * 「**쇼 리뷰는 한 건도 없잖아…**」
 *
 * ⛔ 「썼다」를 세지 않는다. **그날 발행일(pubDate)로 나간 글**을 센다 —
 *   쌓아 두고 하루에 몰아 내면 그것은 「날마다 한 건」이 아니다.
 * ⛔ 수만 세고 끝내지 않는다. **어느 칸이 비었는지**를 짚는다.
 *   10-29 에 K-POP·쇼·골프가 0건이었고, 사장님이 쇼를 짚으시고서야 알았다.
 *
 * 쓰는 법
 *   node scripts/잰다-케이리뷰-날마다-몇건.mjs
 *   node scripts/잰다-케이리뷰-날마다-몇건.mjs --날=2026-10-28
 *   node scripts/잰다-케이리뷰-날마다-몇건.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = fileURLToPath(new URL('..', import.meta.url));

/** 프로배구 V-리그 2026-27 개막 — KOVO 가 2026-08-18 에 낸 일정 */
export const 배구개막날 = '2026-10-31';

/** 날마다 한 건을 맡는 칸. ⛔ 골프는 뺀다 — 까닭은 docs/케이리뷰-날마다-몇건.md 에 */
export const 날마다쓰는칸 = ['kpop', 'drama', 'show', 'baseball', 'football', 'basketball', 'esports'];
export const 배구칸 = 'sports';

export const 칸이름 = {
  kpop: 'K-POP', drama: '드라마·영화', show: '쇼', baseball: '야구', football: '축구',
  golf: '골프', basketball: '농구', esports: 'e스포츠', sports: '스포츠종합(배구)',
};

/** 그날 내야 하는 칸들 — 배구가 개막했으면 스포츠종합이 더해진다 */
export function 그날낼칸(날) {
  const 것 = [...날마다쓰는칸];
  if (String(날) >= 배구개막날) 것.push(배구칸);
  return 것;
}

/** 머리말에서 분류와 발행일을 집는다. ⛔ 못 읽으면 null — 0 으로 세지 않는다 */
export function 머리읽기(글) {
  const m = String(글 ?? '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const 머리 = m[1];
  const 분류 = (머리.match(/^category:\s*(\S+)/m) || [])[1] || null;
  const 날raw = (머리.match(/^pubDate:\s*(\S+)/m) || [])[1] || null;
  const 초안 = /^draft:\s*true\s*$/m.test(머리);
  if (!분류 || !날raw) return null;
  return { 분류, 날: String(날raw).slice(0, 10), 초안 };
}

/** 글 목록에서 그날 나간 것을 분류별로 센다 */
export function 그날센다(글들, 날) {
  const 센것 = {};
  for (const g of 글들) {
    const h = 머리읽기(g);
    if (!h || h.초안) continue;
    if (h.날 !== 날) continue;
    센것[h.분류] = (센것[h.분류] || 0) + 1;
  }
  return 센것;
}

/** 모자란 칸 · 넘친 칸을 가른다 */
export function 가린다(센것, 날) {
  const 낼칸 = 그날낼칸(날);
  const 빈칸 = 낼칸.filter((c) => !(센것[c] > 0));
  const 더낸칸 = Object.entries(센것).filter(([c, n]) => n > 1 && 낼칸.includes(c)).map(([c, n]) => `${c}×${n}`);
  const 밖의칸 = Object.keys(센것).filter((c) => !낼칸.includes(c));
  const 합 = Object.values(센것).reduce((a, b) => a + b, 0);
  return { 낼수: 낼칸.length, 합, 빈칸, 더낸칸, 밖의칸, 됐나: 빈칸.length === 0 };
}

const 값 = (이름) => {
  const m = process.argv.find((a) => a.startsWith(`--${이름}=`));
  return m ? m.slice(이름.length + 3) : null;
};
const 오늘KST = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

if (process.argv.includes('--자가시험')) {
  let 깨짐 = 0;
  const 본다 = (이름, 참) => { if (참) console.log('✅ ' + 이름); else { 깨짐 += 1; console.log('🔴 ' + 이름); } };

  본다('개막 전에는 일곱 칸', 그날낼칸('2026-10-30').length === 7);
  본다('개막 날부터 여덟 칸', 그날낼칸('2026-10-31').length === 8);
  본다('개막 뒤에도 여덟 칸', 그날낼칸('2026-12-01').length === 8);
  본다('⛔ 골프는 날마다 칸이 아니다', !그날낼칸('2026-12-01').includes('golf'));
  본다('배구는 스포츠종합 칸이다', 그날낼칸('2026-11-01').includes('sports'));

  const 글 = ['---\ncategory: show\npubDate: 2026-10-29T13:00:00+09:00\n---\n글',
    '---\ncategory: kpop\npubDate: 2026-10-28T13:00:00+09:00\n---\n글',
    '---\ncategory: show\npubDate: 2026-10-29T18:00:00+09:00\n---\n글',
    '---\ncategory: drama\npubDate: 2026-10-29T09:00:00+09:00\ndraft: true\n---\n글'];
  const 센것 = 그날센다(글, '2026-10-29');
  본다('그날 것만 센다', 센것.show === 2 && !센것.kpop);
  본다('⛔ 초안은 안 센다 — 낸 것이 아니다', !센것.drama);
  const r = 가린다(센것, '2026-10-29');
  본다('빈 칸을 짚는다', r.빈칸.includes('kpop') && r.빈칸.includes('baseball'));
  본다('두 건 낸 칸을 짚는다', r.더낸칸.includes('show×2'));
  본다('빈 칸이 있으면 못 됐다', r.됐나 === false);
  본다('⛔ 머리말을 못 읽으면 null — 0 으로 세지 않는다', 머리읽기('머리말 없는 글') === null);
  본다('날마다 칸에 쇼가 들어 있다 (사장님이 짚으신 칸)', 날마다쓰는칸.includes('show'));
  본다('드라마 칸 이름에 영화가 들어 있다', 칸이름.drama.includes('영화'));

  console.log(깨짐 ? `\n🔴 ${깨짐}가지가 깨졌다` : '\n✅ 자가시험 12 통과');
  process.exit(깨짐 ? 1 : 0);
}

const 날 = 값('날') || 오늘KST();
const 방 = path.join(뿌리, 'content', 'kcw-reviews');
if (!fs.existsSync(방)) { console.log('🔴 ' + 방 + ' 이 없다'); process.exit(1); }
const 글들 = fs.readdirSync(방).filter((f) => f.endsWith('.md'))
  .map((f) => fs.readFileSync(path.join(방, f), 'utf8'));
const 센것 = 그날센다(글들, 날);
const r = 가린다(센것, 날);

console.log(`■ ${날} 케이리뷰 — ${r.합}건 / 내야 할 ${r.낼수}건`);
console.log(`   (배구 개막 ${배구개막날} ${날 >= 배구개막날 ? '뒤라 여덟 칸' : '전이라 일곱 칸'})`);
for (const c of 그날낼칸(날)) {
  const n = 센것[c] || 0;
  console.log(`   ${n > 0 ? '✅' : '🔴'} ${칸이름[c].padEnd(16)} ${n}건`);
}
if (r.밖의칸.length) console.log('   ⬜ 날마다 칸 밖 — ' + r.밖의칸.map((c) => `${칸이름[c] || c} ${센것[c]}건`).join(' · '));
if (r.더낸칸.length) console.log('   ⚠ 한 칸에 두 건 넘게 — ' + r.더낸칸.join(' · '));

if (!r.됐나) {
  console.log(`\n🔴 빈 칸 ${r.빈칸.length}개 — ${r.빈칸.map((c) => 칸이름[c]).join(' · ')}`);
  console.log('   ⛔ 「오늘은 소재가 없었다」로 넘기지 않는다. 날마다 한 건이 사장님이 정하신 것이다.');
  process.exit(1);
}
console.log('\n✅ 칸이 다 찼다');
