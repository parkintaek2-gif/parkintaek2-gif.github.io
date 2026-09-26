#!/usr/bin/env node
/**
 * auto-1600-report.mjs — **내가 16시 보고를 안 냈으면 «자가» 낸다.**
 *
 * ── 🔴 왜 만드나 (2026-09-26) ────────────────────────────────────────
 * 사장님: 「**2번이 업무보고를 하잖나. 너는 왜 4시에 보고를 안하지?**」
 *        「**아주 넋놓고 아무것도 안하고 있나**」 · 「**24시간 일해야지**」
 *
 * 그날 2번은 냈고 나는 안 냈다. 지시를 아침부터 연달아 받아 정기 업무가 통째로 밀렸다.
 *
 * ⭐ 더 나쁜 것은 — **자물쇠는 제대로 일했다.** 그날 「16시 업무보고 미발송」을 두 번 알렸다.
 *   그런데 `nag-1600-report.mjs` 는 그것을 «메모에 적어 둔다». 곧 저장소 커밋으로만 떴고,
 *   나는 다른 일을 하느라 커밋 목록을 안 봤다.
 *
 * ⛔ **알림이 내 눈앞에 오지 않으면 없는 것과 같다.**
 *   그러니 자를 하나 더 만들어 「더 크게 알리는」 것으로는 안 된다. 나는 또 못 본다.
 *   ⇒ **알리지 말고, 자가 대신 낸다.** 그것만이 사람 기억에 안 기대는 구조다.
 *
 * ── 무엇을 적나 — «사실만» ──────────────────────────────────────────
 * 오늘 커밋 · 오늘 보낸 메일 · 오늘 찍힌 고정업무 마커 · 주요 자료의 마지막 날짜.
 * ⛔ 판단·평가·계획을 «지어내지» 않는다. 그것은 사람이 쓰는 몫이다.
 *   자동 보고임을 제목과 첫 줄에 밝힌다 — 사장님이 무엇을 읽고 계신지 아셔야 한다.
 *
 * ⛔ 내가 이미 냈으면 **아무것도 안 한다.** 같은 날 두 번 보내지 않는다.
 *
 * 쓰는 법
 *   node scripts/auto-1600-report.mjs              냈나 보고, 안 냈으면 초안만 만든다
 *   node scripts/auto-1600-report.mjs --보낸다      안 냈으면 만들어서 실제로 보낸다
 *   node scripts/auto-1600-report.mjs --send        (영문 별칭 — 예약·.cmd 용)
 *   node scripts/auto-1600-report.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
const 보낸메일 = path.join(뿌리, 'docs', '보낸메일.tsv');
const 마커방 = path.join(뿌리, 'docs', '고정업무-마커');
const 받는곳 = 'parkintaek@naver.com';

/** 오늘 날짜 — ⛔ toISOString() 금지. 이 PC 가 이미 KST 다 */
export function 오늘날짜(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 내가 오늘 16시 업무보고를 냈나 — 보낸메일 대장에서 찾는다.
 * ⚠ «내 것»만 센다. 2번이 낸 것을 내 것으로 세면 영영 안 낸다.
 */
export function 내가냈나(줄들, 날 = 오늘날짜()) {
  for (const 줄 of 줄들 ?? []) {
    const t = String(줄);
    if (!t.startsWith(날)) continue;
    if (!/업무보고/.test(t)) continue;
    /* 제목 칸에 「5번」이 들어야 내 것이다 */
    const 칸 = t.split('\t');
    const 제목 = 칸[3] ?? t;
    if (/5번/.test(제목)) return true;
  }
  return false;
}

/** 자동 보고를 이미 보냈나 — 같은 날 두 번 보내지 않는다 */
export function 자동을이미보냈나(줄들, 날 = 오늘날짜()) {
  return (줄들 ?? []).some((줄) => String(줄).startsWith(날) && /자동 작성/.test(String(줄)));
}

/** 16시가 지났나 — 그 전에는 «안 낸 것»이 아니다 */
export function 낼때인가(이제 = new Date(), 선 = 16) {
  if (!(이제 instanceof Date) || Number.isNaN(이제.getTime())) return false;
  return 이제.getHours() >= 선;
}

/** 오늘 내 커밋만 추린다 — 제목에 「5번」이 든 것 */
export function 내커밋만(줄들) {
  return (줄들 ?? []).map((x) => String(x).trim()).filter((x) => x && /\[5번\]/.test(x));
}

/** 마커 이름에서 「무슨 일을 몇 시에 했나」를 뽑는다 */
export function 마커풀기(이름) {
  const m = String(이름 ?? '').match(/^(\d{4}-\d{2}-\d{2})-(\d{1,2})시-(.+)\.txt$/);
  return m ? { 날: m[1], 시: m[2], 일: m[3] } : null;
}

/** 오늘 찍힌 마커를 「일 → 시각들」로 모은다 */
export function 오늘마커(이름들, 날 = 오늘날짜()) {
  const 모음 = new Map();
  for (const n of 이름들 ?? []) {
    const p = 마커풀기(n);
    if (!p || p.날 !== 날) continue;
    if (!모음.has(p.일)) 모음.set(p.일, []);
    모음.get(p.일).push(p.시);
  }
  return 모음;
}

/** 보고 글월을 만든다 — 사실만 */
export function 보고글(재료) {
  const { 날, 커밋, 메일, 마커, 자료 } = 재료 ?? {};
  const 줄 = [];
  줄.push(`# [16시 업무보고] ${날} · 5번(총괄)`);
  줄.push('');
  줄.push('⚠ **이 보고는 자가 «자동으로» 썼습니다.** 제가 16시까지 보고를 못 내서,');
  줄.push('빠뜨리지 않으려고 걸어 둔 자가 오늘 한 일을 사실만 모아 냈습니다.');
  줄.push('판단과 계획은 들어 있지 않습니다 — 그것은 제가 따로 올립니다.');
  줄.push('');
  줄.push('---');
  줄.push('');
  줄.push('## Ⅰ. 오늘 한 일 (커밋)');
  줄.push('');
  if (커밋?.length) for (const c of 커밋) 줄.push(`- ${c}`);
  else 줄.push('- (오늘 제 이름으로 남은 커밋이 없습니다)');
  줄.push('');
  줄.push('## Ⅱ. 오늘 보낸 메일');
  줄.push('');
  if (메일?.length) {
    줄.push('| 시각 | 제목 |');
    줄.push('|---|---|');
    for (const m of 메일) 줄.push(`| ${m.시각} | ${m.제목} |`);
  } else 줄.push('- (오늘 보낸 메일이 없습니다)');
  줄.push('');
  줄.push('## Ⅲ. 오늘 돌아간 고정업무');
  줄.push('');
  if (마커?.size) {
    줄.push('| 하는 일 | 몇 번 | 시각 |');
    줄.push('|---|---:|---|');
    for (const [일, 시각들] of 마커) 줄.push(`| ${일} | ${시각들.length} | ${시각들.join('·')}시 |`);
  } else 줄.push('- (오늘 찍힌 마커가 없습니다)');
  줄.push('');
  줄.push('## Ⅳ. 자료가 언제까지 차 있나');
  줄.push('');
  if (자료?.length) {
    줄.push('| 자료 | 마지막 | 며칠 됐나 |');
    줄.push('|---|---|---:|');
    for (const d of 자료) 줄.push(`| ${d.이름} | ${d.마지막} | ${d.며칠} |`);
  } else 줄.push('- (잴 자료 폴더를 못 찾았습니다)');
  줄.push('');
  줄.push('---');
  줄.push('');
  줄.push('5번(총괄) · 자동 작성');
  return 줄.join('\n');
}

/* ── 재료 모으기 (부작용) ──────────────────────────────────────── */

function 커밋모으기(날) {
  try {
    const 글 = execFileSync('git', ['log', '--oneline', `--since=${날} 00:00`], { cwd: 뿌리, encoding: 'utf8' });
    return 내커밋만(글.split('\n'));
  } catch { return []; }
}

function 메일모으기(날) {
  try {
    const 줄들 = fs.readFileSync(보낸메일, 'utf8').split('\n');
    return 줄들.filter((x) => x.startsWith(날)).map((x) => {
      const c = x.split('\t');
      return { 시각: (c[0] ?? '').slice(11), 제목: (c[3] ?? '').slice(0, 70) };
    });
  } catch { return []; }
}

function 자료재기() {
  const 볼것 = ['japan-edinet-financials', 'japan-edinet-breaking', 'india-nse-credit-rating',
    'uae-adx-financials', 'newsdesk-korean-press', 'krx'];
  const 오늘 = new Date();
  const 것 = [];
  for (const 이름 of 볼것) {
    try {
      const 들 = fs.readdirSync(path.join(뿌리, 'archive', 'raw', 이름))
        .filter((n) => /\d{4}-?\d{2}-?\d{2}/.test(n)).sort();
      if (!들.length) { 것.push({ 이름, 마지막: '(없다)', 며칠: '—' }); continue; }
      const 끝 = 들[들.length - 1];
      const m = 끝.match(/(\d{4})-?(\d{2})-?(\d{2})/);
      let 며칠 = '—';
      if (m) {
        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        며칠 = String(Math.round((오늘 - d) / 86400000));
      }
      것.push({ 이름, 마지막: 끝.replace(/\.json.*$/, ''), 며칠 });
    } catch { 것.push({ 이름, 마지막: '(폴더 없다)', 며칠: '—' }); }
  }
  return 것;
}

function 자가시험() {
  let 통과 = 0; let 탈 = 0;
  const 검 = (이름, 참) => { if (참) { 통과++; console.log('✅', 이름); } else { 탈++; console.log('🔴', 이름); } };

  const 날 = '2026-09-26';
  const 내것 = `${날} 17:57\tu5@klifedesign.net\t${받는곳}\t[16시 업무보고] ${날} · 5번(총괄) — 늦어 죄송합니다\tid`;
  const 남의것 = `${날} 17:53\tu2@klifedesign.net\t${받는곳}\t[16시 업무보고] ${날} · 2번\tid`;
  const 딴메일 = `${날} 14:10\tu5@klifedesign.net\t${받는곳}\t[5번] 노트북 팝업 — 지우는 한 줄입니다\tid`;

  검('🔴 내가 낸 것을 알아본다', 내가냈나([내것], 날) === true);
  검('🔴 2번이 낸 것을 «내 것으로 세지 않는다» — 이러면 영영 안 낸다', 내가냈나([남의것], 날) === false);
  검('⛔ 딴 메일을 보고로 세지 않는다', 내가냈나([딴메일], 날) === false);
  검('⛔ 어제 낸 것을 오늘 것으로 세지 않는다', 내가냈나([내것], '2026-09-27') === false);
  검('⛔ 빈 것·null 에도 안 터진다', 내가냈나([], 날) === false && 내가냈나(null, 날) === false);

  const 자동것 = `${날} 16:30\tu5@klifedesign.net\t${받는곳}\t[16시 업무보고] ${날} · 5번 — 자동 작성\tid`;
  검('🔴 자동 보고를 두 번 보내지 않는다', 자동을이미보냈나([자동것], 날) === true);
  검('⛔ 사람이 쓴 것은 자동으로 세지 않는다', 자동을이미보냈나([내것], 날) === false);

  검('16시가 지나야 낸다', 낼때인가(new Date(2026, 8, 26, 16, 30)) === true);
  검('⛔ 15시에는 안 낸다 — 아직 안 낸 것이 아니다', 낼때인가(new Date(2026, 8, 26, 15, 59)) === false);
  검('밤에도 낸다 — 5번은 24시간이다', 낼때인가(new Date(2026, 8, 26, 23, 0)) === true);
  검('⛔ 시각을 못 재면 안 낸다', 낼때인가(null) === false && 낼때인가(new Date('x')) === false);

  검('내 커밋만 추린다',
    내커밋만(['abc [5번] 내 것', 'def 2번: 남의 것', 'ghi [5번] 또 내 것']).length === 2);
  검('⛔ 빈 것·null 에도 안 터진다', 내커밋만([]).length === 0 && 내커밋만(null).length === 0);

  검('마커 이름을 푼다', (() => {
    const p = 마커풀기('2026-09-26-16시-결제점검.txt');
    return p && p.날 === '2026-09-26' && p.시 === '16' && p.일 === '결제점검';
  })());
  검('⛔ 딴 파일 이름에는 null', 마커풀기('메모.md') === null && 마커풀기(null) === null);
  검('오늘 마커를 일별로 모은다', (() => {
    const m = 오늘마커(['2026-09-26-16시-결제점검.txt', '2026-09-26-22시-결제점검.txt',
      '2026-09-25-16시-결제점검.txt'], '2026-09-26');
    return m.get('결제점검')?.length === 2;
  })());
  검('⛔ 빈 것·null 에도 안 터진다', 오늘마커([]).size === 0 && 오늘마커(null).size === 0);

  const 글 = 보고글({ 날, 커밋: ['abc [5번] 한 일'], 메일: [{ 시각: '14:10', 제목: '팝업' }],
    마커: new Map([['결제점검', ['16', '22']]]), 자료: [{ 이름: 'krx', 마지막: '2026-09-25', 며칠: '1' }] });
  검('🔴 자동으로 썼다는 것을 밝힌다', 글.includes('자가 «자동으로» 썼습니다'));
  검('🔴 판단이 안 들었다고 밝힌다', 글.includes('판단과 계획은 들어 있지 않습니다'));
  검('네 칸이 다 선다',
    글.includes('Ⅰ. 오늘 한 일') && 글.includes('Ⅱ. 오늘 보낸 메일')
    && 글.includes('Ⅲ. 오늘 돌아간 고정업무') && 글.includes('Ⅳ. 자료가 언제까지'));
  검('재료가 글에 들어간다', 글.includes('[5번] 한 일') && 글.includes('팝업') && 글.includes('krx'));
  검('⛔ 재료가 비어도 글이 선다', (() => {
    const g = 보고글({ 날, 커밋: [], 메일: [], 마커: new Map(), 자료: [] });
    return g.includes('커밋이 없습니다') && g.includes('메일이 없습니다');
  })());
  검('⛔ null 에도 안 터진다', typeof 보고글(null) === 'string');

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통과} 통과`);
  process.exit(탈 ? 1 : 0);
}

const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--자가시험') || 인자.includes('--selftest')) 자가시험();

  const 날 = 오늘날짜();
  const 대장 = fs.existsSync(보낸메일) ? fs.readFileSync(보낸메일, 'utf8').split('\n') : [];

  if (!낼때인가()) { console.log('⬜ 아직 16시 전이다 — 안 낸 것이 아니다'); process.exit(0); }
  if (내가냈나(대장, 날)) { console.log('✅ 오늘 16시 보고를 «내가» 이미 냈다 — 아무것도 안 한다'); process.exit(0); }
  if (자동을이미보냈나(대장, 날)) { console.log('✅ 오늘 자동 보고가 이미 나갔다 — 두 번 보내지 않는다'); process.exit(0); }

  console.log(`🟡 오늘(${날}) 16시 보고가 «안 나갔다» — 자가 만든다`);
  const 재료 = {
    날,
    커밋: 커밋모으기(날),
    메일: 메일모으기(날),
    마커: 오늘마커(fs.existsSync(마커방) ? fs.readdirSync(마커방) : [], 날),
    자료: 자료재기(),
  };
  const 글 = 보고글(재료);
  const 임시md = path.join(뿌리, 'docs', '보고서', `${날}-16시업무보고-5번-자동.md`);
  fs.mkdirSync(path.dirname(임시md), { recursive: true });
  fs.writeFileSync(임시md, 글, 'utf8');
  console.log(`   커밋 ${재료.커밋.length} · 메일 ${재료.메일.length} · 마커 ${재료.마커.size}갈래`);

  const pdf = 임시md.replace(/\.md$/, '.pdf');
  try {
    execFileSync('node', [path.join(뿌리, 'scripts', 'md-to-pdf.mjs'), 임시md, '--out', pdf,
      '--제목', `16시 업무보고 · ${날} · 5번(총괄) · 자동 작성`], { cwd: 뿌리, encoding: 'utf8', stdio: 'pipe' });
    console.log(`   ✅ PDF — ${path.relative(뿌리, pdf)}`);
  } catch (e) { console.log(`   🔴 PDF 를 못 만들었다 — ${String(e?.message ?? e).slice(0, 100)}`); }

  if (!(인자.includes('--보낸다') || 인자.includes('--send'))) {
    console.log('\n⬜ 만들기만 했다. 보내려면 --보낸다 (영문 별칭 --send)');
    process.exit(0);
  }

  const 본문 = path.join(뿌리, 'docs', '보고서', `_자동보고메일-${날}.txt`);
  fs.writeFileSync(본문, [
    '사장님,', '',
    '5번이 16시까지 업무보고를 못 내서, 빠뜨리지 않으려고 걸어 둔 자가 대신 냅니다.',
    '오늘 한 일을 «사실만» 모은 것입니다 — 커밋 · 보낸 메일 · 고정업무 · 자료 날짜.',
    '판단과 계획은 들어 있지 않습니다. 그것은 5번이 따로 올립니다.', '',
    '붙인 PDF 를 보십시오.', '', '5번(총괄) · 자동 작성',
  ].join('\n'), 'utf8');
  try {
    execFileSync('node', [path.join(뿌리, 'scripts', 'send-mail.mjs'),
      `--받는곳=${받는곳}`, `--제목=[16시 업무보고] ${날} · 5번(총괄) — 자동 작성`,
      `--글=${본문}`, `--첨부=${pdf}`, '--보낸다'], { cwd: 뿌리, encoding: 'utf8', stdio: 'inherit' });
    console.log('\n✅ 자동 보고를 보냈다');
  } catch (e) {
    console.log(`\n🔴 못 보냈다 — ${String(e?.message ?? e).slice(0, 150)}`);
    process.exit(1);
  } finally { try { fs.rmSync(본문, { force: true }); } catch { /* 넘어간다 */ } }
}
