/**
 * 「한국 작품」이라고 적힌 **모든 명단**에 이름만 같은 외국 작품이 없는지 본다.
 *
 * ── 왜 만드나 (2026-08-07 20:3x, 2번 지시) ──────────────────────
 * 오늘 아침에 /watched 가 14% 틀린 것을 고치며 판정 규칙을
 * `scripts/lib/korean-netflix-titles.mjs` 한 곳에 모았다.
 * **그런데 그날 만든 새 수집기가 그 규칙을 안 썼다.** The Perfect Couple(미국) ·
 * Hunger(태국) · Teach You a Lesson(중국) · Friends(미국 시트콤) 가 다시 들어왔다.
 *
 * 규칙을 한 곳에 두는 것만으로는 부족하다. **다음에 만들 스크립트가 또 안 부를 수 있다.**
 * 그래서 「부르든 안 부르든 결과물을 검사한다」로 막는다.
 *
 * ── 무엇을 보나 ────────────────────────────────────────────────
 * ① 손으로 확인해 뺀 목록(NOT_KOREAN)에 있는 제목이 명단에 남아 있나
 * ② 넷플릭스 **영어 차트로 확인된** 제목이 남아 있나
 *    (넷플릭스는 작품의 주 언어로 차트를 가른다. 한국 작품이 영어 차트에 오르는 일은 사실상 없다)
 *
 * ── ⛔ 이 검사가 못 하는 것 ─────────────────────────────────────
 * 글로벌 Top10 에 한 번도 안 뜬 제목은 **언어 딱지가 없다.** 그런 제목은 ②로 못 거른다.
 * 그것을 「깨끗하다」로 읽지 않도록 **딱지 없는 제목 수를 같이 찍는다.**
 * 없는 확인을 있다고 하지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-korean-title-rosters.mjs
 *   node scripts/check-korean-title-rosters.mjs --selftest   검사가 실제로 잡는지 먼저 증명
 */
import fs from 'node:fs';
import path from 'node:path';
import { NOT_KOREAN } from './lib/korean-netflix-titles.mjs';

const DIR = 'archive/raw/netflix-top10';

/** 넷플릭스 글로벌 표가 붙인 언어 딱지. 우리가 정한 것이 아니다. */
function 언어딱지() {
  const tsv = fs.readdirSync(DIR).filter((f) => /^global-.*\.tsv$/.test(f)).sort().pop();
  if (!tsv) throw new Error('글로벌 TSV 가 없다 — 언어 딱지를 만들 수 없다');
  const 줄 = fs.readFileSync(path.join(DIR, tsv), 'utf8').trim().split(/\r?\n/);
  const 머리 = 줄[0].split('\t');
  const iT = 머리.indexOf('show_title'); const iC = 머리.indexOf('category');
  if (iT < 0 || iC < 0) throw new Error('글로벌 TSV 에 show_title/category 칸이 없다');
  const m = new Map();
  for (const l of 줄.slice(1)) {
    const c = l.split('\t');
    const v = /Non-English/i.test(c[iC]) ? 'ne' : 'en';
    const 전 = m.get(c[iT]);
    /* 양쪽 차트에 다 나오면 **이름만 같은 두 작품**이다. 'both' 는 못 가른 것이지 영어가 아니다. */
    m.set(c[iT], 전 && 전 !== v ? 'both' : v);
  }
  return m;
}

/**
 * 명단 파일 → 그 안에 든 **작품 제목들**. 파일마다 모양이 다르므로 여기서 편다.
 *
 * ⚠ `걸러진` 을 반드시 가른다.
 *   `korean-titles.json` 은 **후보 목록**이다 — 이름이 같은 것을 일부러 다 담아 두고,
 *   거르는 일은 `koreanTitleFilter()` 를 부르는 쪽에서 한다. 그걸 「오염」이라 하면
 *   멀쩡한 자료를 틀렸다고 짚는 것이다. 대신 **얼마나 걸러지는지**를 눈에 보이게 찍는다.
 *   ⛔ 후보와 결과를 안 가르고 한 잣대로 재면, 오늘 열두 번 걸린 그 자리다.
 */
const 명단들 = [
  { 파일: 'korean-titles.json', 걸러진: false, 제목: (j) => j.제목 ?? [] },
  { 파일: 'korean-titles-keyed.json', 걸러진: true, 제목: (j) => Object.values(j.작품 ?? {}).map((v) => v.넷플릭스제목 ?? v.이름) },
  { 파일: 'korean-cast-joined.json', 걸러진: true, 제목: (j) => [...new Set(Object.values(j.배우 ?? {}).flatMap((v) => v.작품이름 ?? []))] },
];

export function 한명단검사(제목들, 딱지) {
  const 손 = [...new Set(제목들.filter((t) => NOT_KOREAN.has(t)))];
  const 영어 = [...new Set(제목들.filter((t) => 딱지.get(t) === 'en'))];
  const 딱지없음 = [...new Set(제목들.filter((t) => !딱지.has(t)))];
  const 겹침 = [...new Set(제목들.filter((t) => 딱지.get(t) === 'both'))];
  return { 손, 영어, 딱지없음, 겹침 };
}

function 자가시험() {
  const 딱지 = new Map([['A', 'ne'], ['B', 'en'], ['C', 'both']]);
  const 예 = [
    { 말: '깨끗한 명단 — 통과해야 한다', 제목: ['A'], 기대: 0 },
    { 말: '영어 차트 제목 — 걸려야 한다', 제목: ['A', 'B'], 기대: 1 },
    { 말: '손 목록 제목 — 걸려야 한다', 제목: ['A', [...NOT_KOREAN.keys()][0]], 기대: 1 },
    { 말: '둘 다 — 두 건이어야 한다', 제목: ['B', [...NOT_KOREAN.keys()][0]], 기대: 2 },
    { 말: 'both 는 못 가른 것이지 걸린 것이 아니다', 제목: ['A', 'C'], 기대: 0 },
    { 말: '딱지 없는 것도 걸린 것이 아니다', 제목: ['A', 'Z'], 기대: 0 },
  ];
  let 실패 = 0;
  for (const e of 예) {
    const r = 한명단검사(e.제목, 딱지);
    const n = r.손.length + r.영어.length;
    if (n !== e.기대) { console.log(`  ⛔ 자가시험 실패 — ${e.말}: ${e.기대} 기대, ${n} 나옴`); 실패++; }
  }
  console.log(`한국 작품 명단 검사 — 자가시험 ${예.length}건 중 ${예.length - 실패}건 통과`);
  return 실패;
}

if (자가시험() > 0) process.exit(1);
if (process.argv.includes('--selftest')) process.exit(0);

const 딱지 = 언어딱지();
let 걸림 = 0;
for (const { 파일, 제목, 걸러진 } of 명단들) {
  const p = path.join(DIR, 파일);
  if (!fs.existsSync(p)) { console.log(`  · ${파일} — 없다(건너뜀)`); continue; }
  const ts = 제목(JSON.parse(fs.readFileSync(p, 'utf8'))).filter(Boolean);
  const r = 한명단검사(ts, 딱지);
  const 나쁨 = r.손.length + r.영어.length;
  if (걸러진) 걸림 += 나쁨;
  const 표 = 걸러진 ? (나쁨 ? '❌' : '  ') : '  ';
  console.log(`${표} ${파일.padEnd(26)}${걸러진 ? '[거른 결과]' : '[후보 목록]'} 제목 ${String(ts.length).padStart(4)}개`
    + ` · 손 목록 ${r.손.length} · 영어 차트 ${r.영어.length}`
    + ` · (못 가름: 이름 겹침 ${r.겹침.length} · 딱지 없음 ${r.딱지없음.length})`);
  if (!걸러진) {
    console.log(`     ↑ 후보 목록이라 걸린 것이 아니다. **규칙이 여기서 ${나쁨}개를 걸러 낸다**는 뜻이다.`);
  } else {
    if (r.손.length) console.log(`     손 목록: ${r.손.join(' · ')}`);
    if (r.영어.length) console.log(`     영어 차트: ${r.영어.slice(0, 12).join(' · ')}${r.영어.length > 12 ? ` … +${r.영어.length - 12}` : ''}`);
  }
}

if (걸림) {
  console.error(`\n❌ ${걸림}건. 이름만 같은 외국 작품이 한국 작품 명단에 있다.`);
  console.error('   ⛔ 명단에서 손으로 지우지 않는다. **그 명단을 만든 스크립트가**');
  console.error('      scripts/lib/korean-netflix-titles.mjs 의 규칙을 부르게 고친다.');
  process.exit(1);
}
console.log('\n✅ 한국 작품 명단에 이름만 같은 외국 작품이 없다');
