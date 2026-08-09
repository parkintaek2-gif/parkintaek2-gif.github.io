/**
 * deploy-quiz.mjs — 배포 퀴즈 자동 채점 (사장님 지시 2026-08-09)
 *
 * 콘텐츠 한 편이 「만들었다」로 끝나지 않게, 형식·채널을 다 채웠는지 센다.
 * 통과 못 하면 그날 일은 「새 기사」가 아니라 「그 구멍 채우기」다.
 *
 * 자동으로 재는 것: Q1(있나) Q4(og) Q5(숏츠자산) Q6(카드뉴스) Q7(포스트문안) Q9(상품CTA)
 * 사람 손: Q2 라이브·Q3 Search Console·Q8 유튜브/스레드/인스타(계정=사장님)
 *
 * 실행: node scripts/deploy-quiz.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slugs = fs.readdirSync(path.join(ROOT, 'content/articles'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));

// Q9 상품 CTA — [...id].astro 매핑 순서 그대로
const 상품매핑 = (id) =>
  /leader|biggest-companies|market-cap-leaders|pay-more/.test(id) ? 'leaders'
  : /candour|vanish|sell-rating|stopped-saying|buy-rating|rating/.test(id) ? 'candour'
  : /attention|coverage|unwritten|piles-up|ignored/.test(id) ? 'attention'
  : /research|broker|price-target|aim-high|hit-less/.test(id) ? 'target'
  : /board|officer|governance|director|owner-led/.test(id) ? 'board'
  : /pension|wage|churn|separation|workers-concentrate|bigger-firms|small-firms|oldest-workplace|pension-map/.test(id) ? 'wage'
  : /tenure|gender|headcount|workforce|market-cap-per-worker|pay-holding|how-long-industries/.test(id) ? 'sector'
  : null;

// 형식 자산이 어디 있나 — 있으면 통과
const has = (p) => fs.existsSync(path.join(ROOT, p));
// 숏츠/포스트 문안은 소셜 소재 문서에 슬러그가 언급되면 「있다」로 본다(느슨한 근사)
const 소셜문서 = ['docs/소셜-소재-6번.md']
  .map((p) => (has(p) ? fs.readFileSync(path.join(ROOT, p), 'utf8') : ''))
  .join('\n');

const cardNewsDir = 'public/cardnews'; // 아직 없음 → 카드뉴스 0

const rows = slugs.map((s) => ({
  slug: s,
  Q1: true, // 파일이 있으니 만든 것
  Q4_og: has(`public/og/${s}.png`),
  Q5_shorts: 소셜문서.includes(s),
  Q6_cardnews: has(`${cardNewsDir}/${s}-1.png`),
  Q7_post: 소셜문서.includes(s),
  Q9_cta: 상품매핑(s) != null,
}));

const n = rows.length;
const cnt = (k) => rows.filter((r) => r[k]).length;
const pct = (x) => `${(x / n * 100).toFixed(0)}%`;

console.log(`배포 퀴즈 — 콘텐츠 ${n}편\n`);
console.log('자동 채점 (형식·채널 구멍):');
console.log(`  Q1 만들었나        ${cnt('Q1')}/${n}  ${pct(cnt('Q1'))}`);
console.log(`  Q4 og 카드         ${cnt('Q4_og')}/${n}  ${pct(cnt('Q4_og'))}`);
console.log(`  Q5 숏츠 자산       ${cnt('Q5_shorts')}/${n}  ${pct(cnt('Q5_shorts'))}`);
console.log(`  Q6 카드뉴스        ${cnt('Q6_cardnews')}/${n}  ${pct(cnt('Q6_cardnews'))}   ⬅ 생성기 없음`);
console.log(`  Q7 포스트 문안     ${cnt('Q7_post')}/${n}  ${pct(cnt('Q7_post'))}`);
console.log(`  Q9 상품 CTA        ${cnt('Q9_cta')}/${n}  ${pct(cnt('Q9_cta'))}`);
console.log('\n사람 손(사장님 계정) — 자동으로 못 잼:');
console.log('  Q2 라이브 200      배포 후 curl (2번 배포)');
console.log('  Q3 Search Console  사장님 계정 제출');
console.log('  Q8 유튜브/스레드/인스타  전부 0 — 계정 열면 올라감');

// 전 형식·전 채널 다 통과한 편 = 진짜 통과
const 완전통과 = rows.filter((r) => r.Q1 && r.Q4_og && r.Q5_shorts && r.Q6_cardnews && r.Q7_post && r.Q9_cta).length;
console.log(`\n🔴 다섯 형식+CTA 전부 통과한 콘텐츠: ${완전통과}/${n} (${pct(완전통과)})`);
console.log('⛔ 그날 관문: 위가 100%가 아니면, 새 기사보다 형식·채널 채우기가 먼저.');

// 오늘 낸 것 중 구멍이 제일 큰 형식
const 구멍 = [['Q6 카드뉴스', cnt('Q6_cardnews')], ['Q5 숏츠', cnt('Q5_shorts')], ['Q7 포스트', cnt('Q7_post')]]
  .sort((a, b) => a[1] - b[1]);
console.log(`\n제일 큰 구멍: ${구멍[0][0]} (${구멍[0][1]}/${n}) → 여기부터 채운다.`);
