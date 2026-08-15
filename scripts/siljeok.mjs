#!/usr/bin/env node
/**
 * siljeok.mjs — **하루 실적을 모아 한 장으로 만든다.**
 *
 * 🔴 사장님(2026-08-15 22:3x): 「**실적은 매일 보고해.
 *    콘텐트 제목 / 배포 / 방문자 수 / 결제 등 로그**」
 *
 * ⛔ 왜 자로 만드는가 — 말로 정한 주기는 오늘 하루에만 두 번 빠졌습니다.
 *    13:00 진도율은 일곱 자리 중 하나만, 16:00 은 둘만 냈습니다.
 *    ⭐ 그래서 **빠진 자리가 화면에 남게** 합니다. 안 낸 것이 안 보이면 안 낸 줄도 모릅니다.
 *
 * ⭐ 이 자의 핵심 — **못 잰 칸을 빈칸으로 두지 않는다.**
 *    「⚠ 못 쟀다」라고 **적습니다.** 오늘 사장님께 배운 것입니다 —
 *    없는 것을 있다고 적는 것보다, 없다고 적는 것이 백 배 낫습니다.
 *
 * ⛔ 방문자 수·결제는 **2번이 못 잽니다**(관리자 화면이 401 로 막힙니다).
 *    1번만 잴 수 있습니다. 그래서 1번이 안 대면 **그 칸은 ⚠ 로 남습니다.**
 *    감추지 않습니다. 사장님이 그 자리에서 누가 안 냈는지 보시게 합니다.
 *
 * 자리들이 올리는 꼴 — `docs/세션간-메모.md` 에
 *   [실적] N번 2026-08-15
 *   · 콘텐트  <제목> | <채널> | <주소>
 *   · 방문자  303        ← 1번만
 *   · 결제    시도 35 · 완료 0 · 매출 0원   ← 1번만
 *
 * 쓰는 법
 *   node scripts/siljeok.mjs              오늘 것을 모은다
 *   node scripts/siljeok.mjs --날 8-14     그날 것
 *   node scripts/siljeok.mjs --selftest
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const 자리들 = [1, 3, 4, 5, 6, 7, 8];

/** ⛔ toISOString 을 안 쓴다 — 한국시간이다 */
export function 오늘(때 = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${때.getFullYear()}-${p(때.getMonth() + 1)}-${p(때.getDate())}`;
}

/** 실적 머리줄을 읽는다 — 「[실적] 6번 2026-08-15」 */
export function 머리읽기(줄) {
  const m = /^\[실적\]\s*([1-8])번\s+(\d{4}-\d{2}-\d{2})/.exec((줄 || '').trim());
  return m ? { 자리: Number(m[1]), 날: m[2] } : null;
}

/**
 * 콘텐트 한 줄 — 제목 | 채널 | 주소
 * ⭐ **주소가 없으면 낸 것으로 안 셉니다.** 「썼다」와 「나갔다」는 다릅니다.
 *    사장님이 오늘 그것을 여러 번 짚으셨습니다.
 */
export function 콘텐트읽기(줄) {
  const m = /^[·\-*\s]*콘텐트\s+(.+)$/.exec((줄 || '').trim());
  if (!m) return null;
  const 칸 = m[1].split('|').map((s) => s.trim());
  const [제목, 채널, 주소] = [칸[0] || '', 칸[1] || '', 칸[2] || ''];
  const 나갔나 = /^https?:\/\//.test(주소);
  return { 제목, 채널, 주소, 나갔나 };
}

export function 방문자읽기(줄) {
  const m = /^[·\-*\s]*방문자\s+([\d,]+)/.exec((줄 || '').trim());
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

/** 결제 — 시도·완료·매출을 따로 센다. ⭐ 오늘 35명이 왔는데 주문이 0이었다 */
export function 결제읽기(줄) {
  const m = /^[·\-*\s]*결제\s+시도\s*([\d,]+).*?완료\s*([\d,]+).*?매출\s*([\d,]+)/.exec((줄 || '').trim());
  if (!m) return null;
  const n = (s) => Number(s.replace(/,/g, ''));
  return { 시도: n(m[1]), 완료: n(m[2]), 매출: n(m[3]) };
}

/**
 * 🔴 **결제가 새는 자리를 잡는다.**
 *    시도는 있는데 완료가 0 이면 그것은 「아직 안 팔린 것」이 아니라 **고장**입니다.
 *    8/15 에 35명이 결제 지면까지 왔는데 주문이 0건이었습니다 — pending 조차 0.
 */
export function 결제샜나(결제) {
  if (!결제) return { 샜나: false, 말: '' };
  if (결제.시도 > 0 && 결제.완료 === 0) {
    return { 샜나: true, 말: `🔴 시도 ${결제.시도}명인데 **완료 0** — 파는 길이 막혔을 수 있습니다` };
  }
  return { 샜나: false, 말: '' };
}

/** 안 낸 자리를 찾는다 — ⭐ 빠진 것이 보여야 채워진다 */
export function 안낸자리(모인것, 볼자리 = 자리들) {
  return 볼자리.filter((n) => !모인것[n]);
}

/** 메모 글에서 그날 실적을 긁는다 */
export function 모으기(글, 날) {
  const 모인것 = {};
  let 지금자리 = null;
  for (const 줄 of (글 || '').split('\n')) {
    const 머리 = 머리읽기(줄);
    if (머리) {
      지금자리 = 머리.날 === 날 ? 머리.자리 : null;
      if (지금자리) 모인것[지금자리] = { 콘텐트: [], 방문자: null, 결제: null };
      continue;
    }
    if (!지금자리) continue;
    const c = 콘텐트읽기(줄);
    if (c) { 모인것[지금자리].콘텐트.push(c); continue; }
    const v = 방문자읽기(줄);
    if (v != null) { 모인것[지금자리].방문자 = v; continue; }
    const p = 결제읽기(줄);
    if (p) { 모인것[지금자리].결제 = p; continue; }
    if (/^\s*$/.test(줄) || /^#/.test(줄)) 지금자리 = null; // 절이 끝났다
  }
  return 모인것;
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [오늘(new Date(2026, 7, 15)), '2026-08-15', '한국시간으로 날을 적는다'],
    [머리읽기('[실적] 6번 2026-08-15'), { 자리: 6, 날: '2026-08-15' }, '머리줄을 읽는다'],
    [머리읽기('[보고] 6번 03:00 낸것 2'), null, '⛔ [보고] 는 실적이 아니다'],
    [콘텐트읽기('· 콘텐트 관세청 수입 1위 | 우리 지면 | https://a.kr/x'),
      { 제목: '관세청 수입 1위', 채널: '우리 지면', 주소: 'https://a.kr/x', 나갔나: true },
      '제목·채널·주소를 가른다'],
    [콘텐트읽기('· 콘텐트 어떤 글 | 인스타 | 아직').나갔나, false,
      '⭐ 주소가 없으면 **나간 것이 아니다** — 「썼다」와 「나갔다」는 다르다'],
    [콘텐트읽기('· 방문자 303'), null, '콘텐트 줄이 아니면 안 읽는다'],
    [방문자읽기('· 방문자 303'), 303, '방문자를 읽는다'],
    [방문자읽기('· 방문자 1,204'), 1204, '쉼표가 있어도 읽는다'],
    [방문자읽기('· 방문자 많음'), null, '⛔ 「많음」은 숫자가 아니다'],
    [결제읽기('· 결제 시도 35 · 완료 0 · 매출 0원'), { 시도: 35, 완료: 0, 매출: 0 }, '결제 셋을 가른다'],
    [결제샜나({ 시도: 35, 완료: 0, 매출: 0 }).샜나, true,
      '🔴 시도가 있는데 완료가 0 이면 고장이다 — 8/15 에 실제로 그랬다'],
    [결제샜나({ 시도: 35, 완료: 2, 매출: 96000 }).샜나, false, '완료가 있으면 통과'],
    [결제샜나({ 시도: 0, 완료: 0, 매출: 0 }).샜나, false, '아무도 안 왔으면 고장이 아니다'],
    [결제샜나(null).샜나, false, '안 낸 것은 고장으로 안 친다 — 안 낸 것으로 친다'],
    [안낸자리({ 1: {}, 3: {} }, [1, 3, 6]), [6], '⭐ 안 낸 자리가 보이게 한다'],
    [안낸자리({}, [1, 3]), [1, 3], '아무도 안 내면 다 보인다'],
    [Object.keys(모으기('[실적] 6번 2026-08-15\n· 콘텐트 가 | 나 | https://a.kr', '2026-08-15')).length,
      1, '그날 것만 모은다'],
    [Object.keys(모으기('[실적] 6번 2026-08-14\n· 콘텐트 가 | 나 | https://a.kr', '2026-08-15')).length,
      0, '⛔ 딴 날 것은 안 센다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) {
      console.error(`❌ ${이름}  — 잰 것 ${JSON.stringify(잰것)}`);
      틀림++;
    }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 실적 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

const 나를직접불렀나 = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (나를직접불렀나) {

const i = process.argv.indexOf('--날');
const 날 = i > 0 ? process.argv[i + 1] : 오늘();

const 볼곳 = [
  'C:/Users/USER/Documents/GitHub/klifemap/docs/세션간-메모.md',
  'docs/세션간-메모.md',
];
let 글 = '';
for (const 곳 of 볼곳) { try { 글 += fs.readFileSync(곳, 'utf8'); } catch { /* 없으면 넘어간다 */ } }

const 모인것 = 모으기(글, 날);
const 콘텐트 = [];
let 방문자 = null, 결제 = null;
for (const 자리 of Object.keys(모인것)) {
  for (const c of 모인것[자리].콘텐트) 콘텐트.push({ ...c, 자리 });
  if (모인것[자리].방문자 != null) 방문자 = 모인것[자리].방문자;
  if (모인것[자리].결제) 결제 = 모인것[자리].결제;
}
const 나간것 = 콘텐트.filter((c) => c.나갔나);

console.log(`\n# [일일 실적] ${날}\n`);

console.log(`## 콘텐트 — **나간 것 ${나간것.length}편** (쓰기만 한 것 ${콘텐트.length - 나간것.length}편)`);
if (!콘텐트.length) console.log('  🔴 **한 편도 안 올라왔습니다.**');
for (const c of 콘텐트) {
  console.log(`  ${c.나갔나 ? '✅' : '⚠'} ${c.자리}번  ${c.제목}  —  ${c.채널}`);
  console.log(`       ${c.나갔나 ? c.주소 : '⛔ 주소 없음 — 나간 것으로 안 셉니다'}`);
}

console.log('\n## 방문자');
console.log(방문자 != null ? `  ● ${방문자.toLocaleString()}명` : '  ⚠ **못 쟀습니다** — 1번만 잴 수 있습니다(2번은 401)');

console.log('\n## 결제');
if (결제) {
  console.log(`  ● 시도 ${결제.시도}  ·  완료 ${결제.완료}  ·  매출 ${결제.매출.toLocaleString()}원`);
  const s = 결제샜나(결제);
  if (s.샜나) console.log(`  ${s.말}`);
} else {
  console.log('  ⚠ **못 쟀습니다** — 1번만 잴 수 있습니다');
}

const 빠진 = 안낸자리(모인것);
console.log(`\n## 안 낸 자리 — ${빠진.length}곳`);
console.log(빠진.length ? `  🔴 ${빠진.map((n) => `${n}번`).join(' · ')}` : '  ✅ 다 냈습니다');

console.log('\n⭐ 올리는 꼴 —  `[실적] N번 YYYY-MM-DD` 밑에');
console.log('     · 콘텐트 <제목> | <채널> | <주소>');
console.log('     · 방문자 303                      (1번만)');
console.log('     · 결제 시도 35 · 완료 0 · 매출 0원   (1번만)');
console.log('⛔ 주소 없는 콘텐트는 **안 나간 것**입니다.');

process.exit(빠진.length ? 2 : 0);

}
