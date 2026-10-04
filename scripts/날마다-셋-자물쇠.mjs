#!/usr/bin/env node
/**
 * 날마다-셋-자물쇠.mjs — **오늘 셋을 안 했으면 배포를 막는다.**
 *
 * ── 🔴🔴 사장님 지시 (2026-10-04 밤, 원문) ────────────────────────────
 * 「**방문자 증대, 결제 관련 세 개의 징검다리, 보안 셋은
 *   매일 잊지 말고 반드시 빠짐없이 일을 하라.**」
 * 「**이제까지 개판을 친 걸 다시는 반복하지마라.**」
 *
 * ⛔ 「오늘은 바빠서」가 까닭이 되지 않는다. **빠짐없이**라고 못 박으셨다.
 * ⛔ 기억에 맡기면 거른다 — 2026-08-22 에 만든 키워드 자가 9월 7일 뒤로
 *   한 번도 안 돌았다. 그래서 자물쇠로 둔다.
 *
 * ── 무엇을 보나 ────────────────────────────────────────────────────────
 *   ① 방문자 증대      오늘 재서 대장에 줄을 남겼나
 *   ② 결제 세 징검다리  오늘 check-세징검다리 를 돌렸나
 *   ③ 보안 셋          오늘 보안 점검을 돌렸나
 *
 * ⭐ 「돌렸나」를 어떻게 아나 — **대장에 줄이 있나**로 안다.
 *   줄이 없으면 안 한 것이다. 「했는데 안 적었다」는 안 한 것과 같다.
 *
 * ⛔ 이 자는 일을 «대신 해 주지 않는다». 안 한 것을 알려 줄 뿐이다.
 *
 * 쓰는 법
 *   node scripts/날마다-셋-자물쇠.mjs                오늘 셋을 했나
 *   node scripts/날마다-셋-자물쇠.mjs --적는다 방문자  했다고 대장에 적는다
 *   node scripts/날마다-셋-자물쇠.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장 = path.join(뿌리, 'docs/날마다셋-대장.tsv');

/** 날마다 빠짐없이 — 사장님이 이름을 붙여 주신 셋 */
export const 셋 = [
  { 열쇠: '방문자', 이름: '방문자 증대', 어떻게: 'node scripts/유닛별-방문자.mjs 로 재고 수를 적는다' },
  { 열쇠: '결제', 이름: '결제 세 징검다리', 어떻게: 'node scripts/check-세징검다리.mjs' },
  /* 🔴 [2026-10-05] 여기가 check-보안-셋.mjs 를 가리키고 있었는데 «그런 자가 없다».
     자물쇠가 없는 자를 가리키면 사람이 그 줄을 읽고 돌렸다가 MODULE_NOT_FOUND 를 본다.
     실제로 도는 것은 check-네사이트-보안-라이브.mjs 다. */
  { 열쇠: '보안', 이름: '보안 셋', 어떻게: 'node scripts/check-네사이트-보안-라이브.mjs' },
];

/** ⛔ toISOString 금지 — 이 PC 는 이미 KST 다 */
export function 오늘(때 = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${때.getFullYear()}-${p(때.getMonth() + 1)}-${p(때.getDate())}`;
}

/** 대장을 읽는다. ⛔ 없으면 빈 것이지 흠이 아니다 */
export function 대장읽기(글) {
  return String(글 ?? '').split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => { const [날, 열쇠, 한말] = l.split('\t'); return { 날, 열쇠, 한말: 한말 ?? '' }; })
    .filter((x) => x.날 && x.열쇠);
}

/** 오늘 안 한 것. ⛔ 못 읽으면 null — 「다 했다」로 읽지 않는다 */
export function 오늘안한것(줄들, 그날 = 오늘()) {
  if (!Array.isArray(줄들)) return null;
  const 한것 = new Set(줄들.filter((x) => x.날 === 그날).map((x) => x.열쇠));
  return 셋.filter((s) => !한것.has(s.열쇠));
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const T = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  T('⛔ toISOString 을 안 쓴다', 오늘(new Date(2026, 9, 4)) === '2026-10-04');
  T('셋이 사장님이 부르신 그대로다',
    셋.map((s) => s.열쇠).join() === '방문자,결제,보안');

  const 줄 = 대장읽기('2026-10-04\t방문자\t재서 적었다\n# 주석\n\n2026-10-03\t결제\t돌렸다');
  T('🔴 대장을 읽는다', 줄.length === 2);
  T('⛔ 주석과 빈 줄은 건너뛴다', !줄.some((x) => String(x.날).startsWith('#')));
  T('⛔ 빈 글에도 안 터진다', 대장읽기('').length === 0 && 대장읽기(null).length === 0);

  T('🔴 오늘 안 한 것을 집는다',
    오늘안한것(줄, '2026-10-04').map((s) => s.열쇠).join() === '결제,보안');
  T('🔴 다 했으면 비어 있다',
    오늘안한것(대장읽기('2026-10-04\t방문자\ta\n2026-10-04\t결제\tb\n2026-10-04\t보안\tc'), '2026-10-04').length === 0);
  T('⛔ 어제 한 것은 오늘 한 것이 아니다',
    오늘안한것(줄, '2026-10-05').length === 3);
  T('⛔ 못 읽으면 null — 「다 했다」로 읽지 않는다', 오늘안한것(null) === null);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 날마다 셋 자물쇠 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--selftest') || 인자.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }

  const 적을자리 = 인자.indexOf('--적는다');
  if (적을자리 >= 0) {
    const 열쇠 = 인자[적을자리 + 1];
    if (!셋.some((s) => s.열쇠 === 열쇠)) {
      console.log(`⛔ 아는 열쇠가 아니다 — ${셋.map((s) => s.열쇠).join(' · ')} 중 하나를 준다`);
      process.exit(1);
    }
    const 한말 = 인자.slice(적을자리 + 2).filter((a) => !a.startsWith('--')).join(' ') || '돌렸다';
    if (!fs.existsSync(대장)) fs.writeFileSync(대장, '# 날마다 셋 대장 — 날\t열쇠\t한 말\n', 'utf8');
    fs.appendFileSync(대장, `${오늘()}\t${열쇠}\t${한말}\n`, 'utf8');
    console.log(`✔ 적었다 — ${오늘()} · ${열쇠} · ${한말}`);
    console.log('   ⭐ 커밋·푸시까지 해야 남는다');
    process.exit(0);
  }

  let 글 = '';
  try { 글 = fs.readFileSync(대장, 'utf8'); } catch { 글 = ''; }
  const 안한것 = 오늘안한것(대장읽기(글));

  console.log(`■ 날마다 셋 — ${오늘()}`);
  console.log('   ⛔ 사장님: 「매일 잊지 말고 반드시 빠짐없이 일을 하라」\n');

  for (const s of 셋) {
    const 했다 = !안한것.some((x) => x.열쇠 === s.열쇠);
    console.log(`  ${했다 ? '✅' : '🔴'} ${s.이름}`);
    if (!했다) console.log(`       ${s.어떻게}`);
    if (!했다) console.log(`       끝나면 — node scripts/날마다-셋-자물쇠.mjs --적는다 ${s.열쇠} "무엇을 했다"`);
  }

  if (안한것.length) {
    console.log(`\n🔴🔴 **오늘 ${안한것.length}개를 안 했다 — 배포하지 않는다.**`);
    console.log('   ⛔ 「했는데 안 적었다」는 안 한 것과 같다. 줄이 없으면 증거가 없다.');
    process.exit(1);
  }
  console.log('\n✅ 오늘 셋을 다 했다');
}
