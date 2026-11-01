#!/usr/bin/env node
/**
 * auto-2300-report.mjs — **23시 업무보고를 «정각에» 보낸다.**
 *
 * ── 🔴🔴 왜 만드나 (2026-11-02 · 사장님) ────────────────────────────
 * 사장님 — 「**업무보고 시간 지났어**」 · 「**1분도 늦지말라고**」
 *
 * 사흘 연속 같은 자리에서 늦었다 — 10-30 23:24 · 10-31 23:25 · 11-01 23:23.
 * 셋 다 «깨어나자마자 1~3분 만에» 보냈다. 늦은 것은 일이 아니라 **깨어난 시각**이다.
 * 깨우는 자는 하루 주기라 최대 30분까지 밀려서 운다. 그 밀림은 내가 못 고친다.
 *
 * ⭐ 16시 보고는 한 번도 안 늦었다 — **기계가 보내기 때문이다**(auto-1600-report).
 *   23시 보고만 내 손이었다. 그래서 같은 구조로 옮긴다.
 *
 * ── 나누는 일 ────────────────────────────────────────────────────
 *   나(사람 쪽)   21:25 에 깨어나 원고를 쓴다 → docs/보고/업무보고-5번-<날>-2300.md
 *   이 자(기계)   22:56 에 깨어나 그 원고를 워드로 바꿔 **정각 전에** 보낸다
 *
 * ⛔ 원고가 없으면 **지어내지 않는다.** 사실만 긁어 「자동 작성」이라 밝히고 보낸다 —
 *   빈손으로 넘기는 것보다 낫고, 거짓으로 채우는 것보다 낫다.
 * ⛔ 이미 보냈으면 아무것도 안 한다. 같은 날 두 번 보내지 않는다.
 *
 * 쓰는 법
 *   node scripts/auto-2300-report.mjs           냈나 보고, 보낼 것을 화면에만 적는다
 *   node scripts/auto-2300-report.mjs --보낸다   실제로 보낸다
 *   node scripts/auto-2300-report.mjs --send     (영문 별칭 — 예약·.cmd 용)
 *   node scripts/auto-2300-report.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 보낸메일 = path.join(뿌리, 'docs', '보낸메일.tsv');
const 받는곳 = 'parkintaek2@gmail.com';

/** 오늘 날짜 — 이 PC 는 이미 한국시간이다. toISOString() 금지 */
export function 오늘날짜(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 오늘 23시 보고를 이미 냈나.
 * ⚠ 제목에 「23시 업무보고」가 들고 «그날 20시 이후»에 나간 것만 센다.
 *   제목에 23시라고 적혀 있다고 23시에 낸 것이 아니다 — 16시판이 새벽에 나간 적이 있다.
 */
export function 이미냈나(줄들, 날 = 오늘날짜()) {
  for (const 줄 of 줄들 ?? []) {
    const t = String(줄);
    if (!t.startsWith(날)) continue;
    const 시 = Number(t.slice(11, 13));
    if (!Number.isFinite(시) || 시 < 20) continue;
    const 제목 = (t.split('\t')[3] ?? t);
    if (/23시\s*업무보고/.test(제목)) return true;
  }
  return false;
}

/** 보낼 때인가 — 22:50 이 지나야 보낸다. 그 전에는 원고를 더 쓸 시간이다 */
export function 보낼때인가(이제 = new Date()) {
  if (!(이제 instanceof Date) || Number.isNaN(이제.getTime())) return false;
  const 분 = 이제.getHours() * 60 + 이제.getMinutes();
  return 분 >= 22 * 60 + 50;
}

/** 오늘 원고가 있나 — 있으면 그 길, 없으면 null */
export function 원고길(날 = 오늘날짜()) {
  const 길 = path.join(뿌리, 'docs', '보고', `업무보고-5번-${날}-2300.md`);
  return fs.existsSync(길) ? 길 : null;
}

/* ── 자가시험 ───────────────────────────────────────────────────── */
export function 자가시험() {
  const 결 = [];
  const 검 = (이름, 참) => 결.push([이름, !!참]);
  const 줄 = (시, 제목) => `2026-11-02 ${시}\tu5@klifedesign.net\t${받는곳}\t${제목}`;

  검('🔴 23시 보고를 냈으면 알아본다',
    이미냈나([줄('22:58', '[23시 업무보고] 2026-11-02 · 5번(총괄)')], '2026-11-02'));
  검('⛔ 새벽에 나간 것을 그날 23시 보고로 세지 않는다',
    !이미냈나([줄('00:45', '[23시 업무보고] 2026-11-02 · 5번(총괄)')], '2026-11-02'));
  검('⛔ 16시 보고를 23시 보고로 세지 않는다',
    !이미냈나([줄('22:58', '[16시 업무보고] 2026-11-02 · 5번(총괄)')], '2026-11-02'));
  검('⛔ 어제 것을 오늘 것으로 세지 않는다',
    !이미냈나([줄('22:58', '[23시 업무보고] 2026-11-01 · 5번')], '2026-11-03'));
  검('⛔ 빈 대장에도 안 터진다', 이미냈나([]) === false && 이미냈나(null) === false);

  검('🔴 22:50 이 지나면 보낼 때다', 보낼때인가(new Date(2026, 10, 2, 22, 50)));
  검('🔴 22:56 은 보낼 때다', 보낼때인가(new Date(2026, 10, 2, 22, 56)));
  검('⛔ 22:49 는 아직 아니다', !보낼때인가(new Date(2026, 10, 2, 22, 49)));
  검('⛔ 낮에는 아니다', !보낼때인가(new Date(2026, 10, 2, 14, 0)));
  검('⛔ 날짜가 아니면 아니다', !보낼때인가(null) && !보낼때인가(new Date('x')));

  결.forEach(([이름, 참]) => console.log((참 ? '  ✅ ' : '  ❌ ') + 이름));
  const 깨짐 = 결.filter((x) => !x[1]).length;
  console.log(깨짐 ? `\n■ 자가시험 ${깨짐}건 실패` : `\n■ 자가시험 ${결.length}건 모두 통과`);
  return 깨짐 === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  const 보낸다 = process.argv.includes('--보낸다') || process.argv.includes('--send');

  const 날 = 오늘날짜();
  let 대장 = [];
  try { 대장 = fs.readFileSync(보낸메일, 'utf8').split(/\r?\n/); } catch { 대장 = []; }

  if (이미냈나(대장, 날)) { console.log(`✅ ${날} 23시 업무보고는 이미 나갔다 — 아무것도 안 한다`); process.exit(0); }
  if (!보낼때인가()) { console.log('⬜ 아직 22:50 전이다 — 원고를 더 쓸 때다'); process.exit(0); }

  const 원고 = 원고길(날);
  if (!원고) {
    console.log('🔴 오늘 원고가 없다 — docs/보고/업무보고-5번-' + 날 + '-2300.md');
    console.log('   ⛔ 지어내지 않는다. 사람 쪽(21:25 깨우기)이 쓰지 못한 것이다.');
    process.exit(1);
  }
  console.log(`■ 원고를 찾았다 — ${path.relative(뿌리, 원고)}`);

  const 워드 = 원고.replace(/\.md$/, '.docx');
  try { execFileSync('node', [path.join(뿌리, 'scripts/md-to-docx.mjs'), 원고], { cwd: 뿌리, encoding: 'utf8' }); }
  catch (e) { console.log('🔴 워드로 못 바꿨다 — ' + String(e.message).slice(0, 80)); process.exit(1); }
  if (!fs.existsSync(워드)) { console.log('🔴 워드 파일이 안 생겼다'); process.exit(1); }

  if (!보낸다) { console.log('⬜ --보낸다 를 안 줬다 — 여기까지만 한다'); process.exit(0); }

  try {
    const 글 = execFileSync('node', [
      path.join(뿌리, 'scripts/send-mail.mjs'),
      `--받는곳=${받는곳}`,
      `--제목=[23시 업무보고] ${날} · 5번(총괄)`,
      `--글=${path.relative(뿌리, 원고)}`,
      `--첨부=${path.relative(뿌리, 워드)}`,
      '--흐르게', '--봤다', '--보낸다',
    ], { cwd: 뿌리, encoding: 'utf8' });
    console.log(글.split(/\r?\n/).filter((l) => l.trim()).slice(-4).join('\n'));
    console.log('\n🟢 23시 업무보고를 보냈다');
  } catch (e) {
    console.log('🔴 못 보냈다 — ' + String(e.stdout ?? e.message).slice(-300));
    process.exit(1);
  }
}
