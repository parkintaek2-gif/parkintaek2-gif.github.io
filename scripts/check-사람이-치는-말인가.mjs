#!/usr/bin/env node
/**
 * check-사람이-치는-말인가.mjs — **노출은 있는데 클릭이 0인 까닭**을 센다
 *
 * ── 🔴 왜 이 자가 필요한가 (2026-10-10 10:2x · 5번) ──────────────────────
 *
 * 28일 검색 성적을 받아 자리별로 갈랐더니 09-30 과 **그림이 뒤집혀 있었다.**
 * ```
 *   09-30   「60~79위라 첫 쪽에 못 온다」가 까닭이었다. 클릭 4회
 *   10-10   1~10위에 검색어 **51개** · 노출 114회 — 그런데 **클릭 0**
 * ```
 * ⛔ 첫 쪽에 떠 있는데 아무도 안 누른다. 그러면 자리를 더 밀어도 소용없다.
 *
 * 눈으로 보니 꼴이 이상했다 —
 * ```
 *   takachiho koheki co.,ltd. forecast and analysis * * * * *
 *   "scinex corporation" 買収 or 取得 -site:crunchbase.com -site:pitchbook
 *   evaluate the respiratory pharmaceuticals company kyorin on all c…
 *   how much money has kawaden.co.jp raised
 * ```
 * **사람이 검색창에 치는 말이 아니다.** 별표가 붙고, 제외 연산자가 달리고,
 * 문장형 지시이고, 도메인을 그대로 적는다 — AI 에이전트·스크래퍼의 질의 꼴이다.
 *
 * ⛔ 그런데 그것은 **내 짐작**이다. 짐작으로 사업 판단을 올리지 않는다. 그래서 센다.
 *
 * ⚠ 이 자가 못 하는 것 — **확실히 가를 수는 없다.** 사람도 연산자를 쓴다.
 *   그래서 「기계다」가 아니라 **「사람이 치기 어려운 꼴이다」**로 적는다.
 *   ⭐ 못 재는 것은 못 잰다고 적는다 — 이 자가 내는 것은 «의심»이지 판정이 아니다.
 *
 * 돌리기:  node scripts/check-사람이-치는-말인가.mjs
 *          node scripts/check-사람이-치는-말인가.mjs --파일 src/data/gsc-...json
 *          node scripts/check-사람이-치는-말인가.mjs --시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 「사람이 치기 어려운 꼴」을 가르는 잣대들.
 * ⚠ 하나하나는 약하다. 그래서 **몇 가지에 걸리는지**를 함께 센다.
 *   ⛔ 한 가지만 걸렸다고 「기계」로 적지 않는다.
 */
export const 잣대 = [
  { 이름: '별표 꼬리', 설명: '`* * * *` — 잘린 서식 자리표',
    잰다: (q) => /(\*\s*){2,}$/.test(q.trim()) },
  { 이름: '제외 연산자', 설명: '`-site:` — 검색 연산자를 손으로 다는 사람은 드물다',
    잰다: (q) => /-site:/i.test(q) },
  { 이름: '문장형 지시', 설명: '`evaluate …` `compare …` — 검색어가 아니라 «시킴»이다',
    잰다: (q) => /^(evaluate|analyse|analyze|compare|summar|assess|list all|describe|explain)\b/i.test(q.trim()) },
  { 이름: '문장형 물음', 설명: '`how much money has … raised` — 말로 된 물음',
    잰다: (q) => /^(how|what|who|when|where|which|why)\b.{18,}/i.test(q.trim()) },
  { 이름: '도메인을 적음', 설명: '`kawaden.co.jp` — 사람은 회사 이름을 치지 주소를 안 친다',
    잰다: (q) => /\b[a-z0-9-]+\.(co\.jp|com|co\.kr|net|org)\b/i.test(q) && !/^https?:/i.test(q) },
  { 이름: '매우 긺', 설명: '60자 넘음 — 검색창에 이만큼 치는 사람은 적다',
    잰다: (q) => q.trim().length > 60 },
  { 이름: '분석 용어 묶음', 설명: '`bullish and bearish analyst opinions` 같은 정형 문구',
    잰다: (q) => /(bullish and bearish|analyst opinions|forecast and analysis|yoy growth revenue|last known annual revenue)/i.test(q) },
];

/** 질의 하나를 재서 걸린 잣대 이름들을 낸다 */
export function 재기(q) {
  return 잣대.filter((j) => { try { return j.잰다(String(q ?? '')); } catch { return false; } })
    .map((j) => j.이름);
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--시험')) {
  const 틀렸다 = [];
  const 본다 = (이름, 참) => { if (!참) 틀렸다.push(이름); };

  본다('별표 꼬리를 잡는다', 재기('takachiho koheki co.,ltd. forecast and analysis * * * * *').includes('별표 꼬리'));
  본다('제외 연산자를 잡는다', 재기('"scinex" 買収 -site:crunchbase.com').includes('제외 연산자'));
  본다('문장형 지시를 잡는다', 재기('evaluate the respiratory pharmaceuticals company kyorin').includes('문장형 지시'));
  본다('문장형 물음을 잡는다', 재기('how much money has kawaden.co.jp raised').includes('문장형 물음'));
  본다('도메인을 적은 것을 잡는다', 재기('number of employees at kawaden.co.jp').includes('도메인을 적음'));

  /* 🔴 여기가 핵심이다 — **보통 사람 검색어를 안 물어야** 쓸모가 있다.
     ⛔ 다 빨갛게 만드는 자는 「다 기계다」만 내고 아무것도 안 가른다. */
  본다('⛔ 사람이 치는 짧은 말은 «안» 잡는다 — kospi weights',
    재기('kospi index constituents weights').length === 0);
  본다('⛔ 사람이 치는 말을 안 잡는다 — samsung electronics share price',
    재기('samsung electronics share price').length === 0);
  본다('⛔ 사람이 치는 말을 안 잡는다 — korean companies',
    재기('biggest korean companies').length === 0);
  /* ⚠ 「what is kospi」는 짧다. 사람도 이렇게 친다 — 문장형 물음은 «길 때»만 잡는다 */
  본다('⛔ 짧은 물음은 안 잡는다 — what is kospi', 재기('what is kospi').length === 0);
  본다('빈 말에 안 터진다', 재기('').length === 0 && 재기(null).length === 0);

  console.log(틀렸다.length ? `🔴 자가시험 ${틀렸다.length}칸 틀림\n  - ${틀렸다.join('\n  - ')}`
    : '✅ 자가시험 10칸 다 지나감');
  process.exit(틀렸다.length ? 1 : 0);
}

/* ── 실제로 재기 ──────────────────────────────────────────────────────── */
/* 🔴 [2026-10-10] 이 가드가 없어서 **다른 자가 `재기` 를 끌어다 쓰자 본문이 통째로 다시 돌았다.**
   출력이 두 벌 나와 읽는 사람이 어느 것이 자기 것인지 몰랐다.
   ⛔ 자는 «부를 수 있어야» 자다. 곧장 돌 때만 본문을 돌린다. */
const 곧장돈다 = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!곧장돈다) { /* 끌어다 쓰는 쪽에는 잣대와 재기()만 준다 */ }
else {
const 인자 = process.argv.slice(2);
let 파일 = 인자[인자.indexOf('--파일') + 1];
if (!파일 || 파일.startsWith('--')) {
  /* 가장 새 gsc-seoulmarkets 파일을 고른다. ⛔ 날짜를 박지 않는다 */
  const 방 = path.join(뿌리, 'src', 'data');
  const 것들 = fs.readdirSync(방).filter((n) => /^gsc-seoulmarkets-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort();
  if (!것들.length) { console.log('⚠ src/data 에 gsc-seoulmarkets-*.json 이 없다 — 못 쟀다'); process.exit(0); }
  파일 = path.join('src', 'data', 것들.at(-1));
}

const 읽은것 = JSON.parse(fs.readFileSync(path.join(뿌리, 파일), 'utf8'));
const 줄들 = 읽은것.rows ?? [];
if (!줄들.length) { console.log(`⚠ ${파일} 에 줄이 없다 — 못 쟀다`); process.exit(0); }

const 총노출 = 줄들.reduce((s, r) => s + (r.impressions ?? 0), 0);
const 총클릭 = 줄들.reduce((s, r) => s + (r.clicks ?? 0), 0);

const 잰것 = 줄들.map((r) => ({ ...r, 걸린것: 재기(r.key) }));
const 의심 = 잰것.filter((r) => r.걸린것.length > 0);
const 의심노출 = 의심.reduce((s, r) => s + (r.impressions ?? 0), 0);

console.log(`■ 사람이 치기 어려운 꼴인가 — ${파일}`);
console.log(`   검색어 ${줄들.length}개 · 노출 ${총노출} · 클릭 ${총클릭}\n`);

console.log(`   검색어 가운데 ${의심.length}개 (${Math.round((의심.length / 줄들.length) * 100)}%)`
  + ` · 노출 가운데 ${의심노출} (${Math.round((의심노출 / 총노출) * 100)}%) 가 걸렸다`);

console.log('\n   어느 잣대에 걸렸나 (한 말이 여럿에 걸릴 수 있다)');
for (const j of 잣대) {
  const n = 잰것.filter((r) => r.걸린것.includes(j.이름));
  if (!n.length) continue;
  console.log(`     ${j.이름.padEnd(8)} ${String(n.length).padStart(3)}개 · 노출 ${String(n.reduce((s, r) => s + r.impressions, 0)).padStart(3)}`
    + `   ${j.설명}`);
}

/* 🔴 가장 중요한 칸 — 첫 쪽에 떠 있는데 안 눌리는 것 */
const 첫쪽 = 잰것.filter((r) => (r.position ?? 999) <= 10);
const 첫쪽의심 = 첫쪽.filter((r) => r.걸린것.length > 0);
console.log(`\n   🔴 첫 쪽(1~10위) ${첫쪽.length}개 · 노출 ${첫쪽.reduce((s, r) => s + r.impressions, 0)}`
  + ` · 클릭 ${첫쪽.reduce((s, r) => s + r.clicks, 0)}`);
console.log(`      그 가운데 사람이 치기 어려운 꼴 ${첫쪽의심.length}개`
  + ` (${첫쪽.length ? Math.round((첫쪽의심.length / 첫쪽.length) * 100) : 0}%)`);

console.log('\n   걸린 말 몇 개 (노출 많은 차례)');
의심.sort((a, b) => b.impressions - a.impressions).slice(0, 8).forEach((r) => {
  console.log(`     ${String((r.position ?? 0).toFixed(1)).padStart(5)}위 노출${String(r.impressions).padStart(3)}`
    + `  ${r.key.slice(0, 50).padEnd(50)} [${r.걸린것.join('·')}]`);
});

/* 🔴🔴 [2026-10-10 · 내가 바로 여기서 성급했다] ────────────────────────────
   「첫 쪽 51개가 클릭 0」을 보고 **「제목이 안 끈다」로 갈 뻔했다.**
   그래서 실제로 지면을 눌러 봤다 — `/japan/company/komatsu-matere` 는
   제목이 `… (3580) earnings results — FY2026`, 설명에 매출 숫자, 본문에 실적이 있었다.
   **지면은 정확했다.** 문제는 다른 데 있었다 — **분모가 너무 작다.**
   첫 쪽 노출이 110회뿐이라 CTR 3% 를 잡아도 기대 클릭이 3회다. 실제 0회는
   「제목이 나쁘다」의 증거가 못 된다. 그냥 **수가 적은 것**이다.
   ⛔ 적은 수로 비율을 말하지 않는다. 이 자는 그 선을 소리 내어 긋는다. */
/* ⚠ 처음에 문턱을 «전체 노출 300» 으로 잡았더니 359 라서 경고가 «안 떴다».
   그런데 359 는 하루 13회다. 전혀 넉넉하지 않다 — **문턱을 잘못 잡은 것**이다.
   ⭐ 비율로 잡지 말고 **기대 클릭 수**로 잡는다. 클릭은 거의 첫 쪽에서 나므로
     첫 쪽 노출로 센다. 기대 클릭이 열 번에 못 미치면 0 이 나와도 이상하지 않다. */
const 첫쪽평균클릭률 = 0.03;          // 첫 쪽 평균 클릭률을 넉넉히 3% 로 본다
const 첫쪽노출 = 첫쪽.reduce((s, r) => s + (r.impressions ?? 0), 0);
const 기대클릭 = 첫쪽노출 * 첫쪽평균클릭률;
console.log('');
if (기대클릭 < 10) {
  console.log(`🔴 ⛔ **클릭률로 무엇을 판단하지 마십시오** — 수가 모자랍니다.`);
  console.log(`   28일 노출 ${총노출}회(하루 ${(총노출 / 28).toFixed(0)}회) · 그중 첫 쪽 ${첫쪽노출}회.`);
  console.log(`   첫 쪽 평균 클릭률을 3% 로 넉넉히 잡아도 **기대 클릭이 ${기대클릭.toFixed(1)}회**입니다.`);
  console.log('   그러니 「클릭 0」은 「제목이 나쁘다」의 증거가 못 됩니다. 그냥 수가 적은 것입니다.');
  console.log('   ⭐ 이 수에서 할 일은 «제목 고치기»가 아니라 **분모 키우기**입니다.');
}

console.log('\n⚠ 이 자가 «못» 하는 것 — 기계인지 사람인지 **확실히 가르지 못한다.**');
console.log('   사람도 연산자를 쓰고, 긴 말을 치기도 한다. 이것은 판정이 아니라 «의심»이다.');
console.log('⭐ 그래도 쓸모가 있는 까닭 — 클릭이 0 일 때 「자리를 더 밀자」로 갈지,');
console.log('   「애초에 사람이 아닐 수 있다」로 갈지가 **완전히 다른 일**이기 때문이다.');
}
