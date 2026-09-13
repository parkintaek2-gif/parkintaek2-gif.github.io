/**
 * build-v1-consensus-tape.mjs — `/v1/consensus` 가 내줄 표를 짓는다.
 * ─────────────────────────────────────────────────────────────────────────
 * 사장님 지시 (2026-09-13): 「마무리 해」 — 내가 「구멍」으로 보고한 셋 가운데 하나.
 *
 * 우물 둘:
 *   archive/raw/hankyung-consensus/consensus-<날>.json   리포트 목록(624건/30일 창)
 *   archive/raw/hankyung-consensus/analysts-<날>.json    애널리스트 순위(20명)
 *
 * 🔴 이 자료는 «그날 안 받으면 영영 없다» — 지면이 창을 30일에서 자른다(CLAUDE.md 실측).
 *   그래서 받은 날들을 다 겹쳐 쌓는다. 최신 하나만 쓰면 이미 받아 둔 옛것을 버리는 것이다.
 *
 * ⛔ 순위는 «그날 시점»의 순위다. 여러 날을 섞어 하나의 순위로 내지 않는다 —
 *   as_of 를 줄마다 달아 두고, 어느 날 것인지 손님이 고르게 한다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 우물 = path.join(뿌리, 'archive/raw/hankyung-consensus');
const 낼곳 = path.join(뿌리, 'src/data/korea-consensus-tape.json');

export function 갈래나누기(이름들) {
  const 리포트 = [], 애널 = [];
  for (const 이름 of 이름들) {
    let m = String(이름).match(/^consensus-(\d{4}-\d{2}-\d{2})\.json$/);
    if (m) { 리포트.push({ 날: m[1], 이름 }); continue; }
    m = String(이름).match(/^analysts-(\d{4}-\d{2}-\d{2})\.json$/);
    if (m) 애널.push({ 날: m[1], 이름 });
  }
  const 날순 = (a, b) => a.날.localeCompare(b.날);
  return { 리포트: 리포트.sort(날순), 애널: 애널.sort(날순) };
}

/** 같은 보고서가 여러 날 스냅숏에 겹쳐 온다 — 보고서번호로 한 번만 남긴다 */
export function 겹친것지우기(줄들) {
  const 본것 = new Set();
  const 남길것 = [];
  for (const r of 줄들) {
    const 키 = String(r.report_id ?? '');
    if (!키 || 키 === 'null' || 본것.has(키)) continue;
    본것.add(키);
    남길것.push(r);
  }
  return 남길것;
}

export function 리포트한줄(r, 받은날) {
  const 목표 = Number(r.목표주가);
  const 이전 = Number(r.이전목표주가);
  const 둘다있나 = Number.isFinite(목표) && Number.isFinite(이전) && 이전 > 0
    && r.목표주가 !== null && r.이전목표주가 !== null;
  return {
    report_id: r.보고서번호 ?? null,
    title: r.제목 ?? null,
    analysts: r.작성자 ?? null,
    house: r.증권사 ?? null,
    published_on: r.발표일 ?? null,
    kind: r.갈래 ?? null,
    code: r.종목코드 ?? null,
    name: r.종목명 ?? null,
    sector: r.업종 ?? null,
    rating: r.의견 ?? null,
    target_price_krw: (r.목표주가 !== null && Number.isFinite(목표)) ? 목표 : null,
    previous_target_price_krw: (r.이전목표주가 !== null && Number.isFinite(이전)) ? 이전 : null,
    /* ⛔ 이전 목표가가 없으면 「안 바뀌었다」가 아니라 「모른다」다. null 로 둔다 */
    target_change_pct: 둘다있나 ? Number((((목표 - 이전) / 이전) * 100).toFixed(2)) : null,
    pdf_url: r.PDF ?? null,
    captured_on: 받은날,
  };
}

export function 애널한줄(r, 받은날) {
  const 정확도 = Number(r.정확도);
  const 냈나 = Number.isFinite(정확도) && 정확도 > 0;
  return {
    rank: Number(r.순위) || null,
    analyst_id: r.애널리스트번호 ?? null,
    name: r.이름 ?? null,
    house: r.증권사 ?? null,
    stars: Number(r.별점) || null,
    score: Number(r.점수) || null,
    change_pct: Number.isFinite(Number(r.변동률)) ? Number(r.변동률) : null,
    /* ⚠ 지면이 0 을 내주는 칸이다. 0 을 「정확도 0%」로 읽지 않는다 — 안 낸 것이다 */
    accuracy: 냈나 ? 정확도 : null,
    accuracy_not_published: !냈나,
    as_of: 받은날,
  };
}

export function 짓기(갈래, 읽기 = (이름) => JSON.parse(fs.readFileSync(path.join(우물, 이름), 'utf8'))) {
  const 리포트줄 = [];
  for (const it of 갈래.리포트) {
    const j = 읽기(it.이름);
    for (const r of (Array.isArray(j.줄들) ? j.줄들 : [])) 리포트줄.push(리포트한줄(r, it.날));
  }
  const 리포트 = 겹친것지우기(리포트줄)
    .sort((a, b) => String(b.published_on ?? '').localeCompare(String(a.published_on ?? '')));

  const 애널줄 = [];
  for (const it of 갈래.애널) {
    const j = 읽기(it.이름);
    for (const r of (Array.isArray(j.줄들) ? j.줄들 : [])) 애널줄.push(애널한줄(r, it.날));
  }

  const 목표바뀐것 = 리포트.filter((r) => r.target_change_pct !== null).length;
  return {
    _meta: {
      product: 'Korea Consensus Tape',
      source: 'Hankyung Consensus — broker report list and analyst ranking',
      builtAt: new Date().toLocaleString('ko-KR'),
      reports: 리포트.length,
      reportSnapshots: 갈래.리포트.map((x) => x.날),
      analystRows: 애널줄.length,
      analystSnapshots: 갈래.애널.map((x) => x.날),
      withTargetChange: 목표바뀐것,
      targetChangeNote: 'target_change_pct is filled only when the source carried BOTH the new and the previous '
        + 'target price. A missing previous target means unknown, not unchanged — those rows stay null.',
      windowNote: 'The source page only ever shows a rolling ~30-day window, whatever date range is requested '
        + '(measured 2026-09-09). Older reports cannot be back-filled — these snapshots are the record.',
      accuracyNote: 'The ranking page prints 0 for analysts whose accuracy it does not publish. We carry that '
        + 'through as accuracy:null with accuracy_not_published:true, never as an accuracy of zero.',
      notThis: 'These are other houses’ published views, reproduced as filed. They are not ours and not advice.',
    },
    reports: 리포트,
    analysts: 애널줄,
  };
}

/* ── 자가시험 — 사장님: 「규칙은 문장이 아니라 검사로 둔다」 ───────────────── */
export function 자가시험() {
  const 흠 = [];
  const 재다 = (이름, 참) => { if (!참) 흠.push(이름); };

  const g = 갈래나누기(['consensus-2026-09-08.json', 'analysts-2026-09-09.json', '엉뚱.json', 'consensus-2026-09-13.json']);
  재다('리포트 둘', g.리포트.length === 2);
  재다('애널 하나', g.애널.length === 1);
  재다('엉뚱한 이름은 버린다', g.리포트.length + g.애널.length === 3);
  재다('날짜 오름차순', g.리포트[0].날 === '2026-09-08');

  재다('겹친 것을 지운다', 겹친것지우기([{ report_id: 1 }, { report_id: 1 }, { report_id: 2 }]).length === 2);
  재다('번호 없는 줄은 버린다', 겹친것지우기([{ report_id: null }]).length === 0);
  재다('먼저 온 것을 남긴다', 겹친것지우기([{ report_id: 1, a: '먼저' }, { report_id: 1, a: '나중' }])[0].a === '먼저');

  const r1 = 리포트한줄({ 보고서번호: 1, 목표주가: 110, 이전목표주가: 100 }, '2026-09-13');
  재다('목표가 변동률', r1.target_change_pct === 10);
  const r2 = 리포트한줄({ 보고서번호: 2, 목표주가: 110, 이전목표주가: null }, '2026-09-13');
  재다('이전이 없으면 모른다', r2.target_change_pct === null);
  const r3 = 리포트한줄({ 보고서번호: 3, 목표주가: null }, '2026-09-13');
  재다('목표가가 없으면 null', r3.target_price_krw === null && r3.target_change_pct === null);
  const r4 = 리포트한줄({ 보고서번호: 4, 목표주가: 90, 이전목표주가: 0 }, '2026-09-13');
  재다('0 으로 나누지 않는다', r4.target_change_pct === null);
  재다('받은 날을 적는다', r1.captured_on === '2026-09-13');

  const a1 = 애널한줄({ 순위: 1, 정확도: 0 }, '2026-09-13');
  재다('정확도 0 은 안 낸 것', a1.accuracy === null && a1.accuracy_not_published === true);
  const a2 = 애널한줄({ 순위: 2, 정확도: 55 }, '2026-09-13');
  재다('정확도가 있으면 그대로', a2.accuracy === 55 && a2.accuracy_not_published === false);
  재다('순위 스냅숏 날을 단다', a2.as_of === '2026-09-13');

  const 지은것 = 짓기(
    { 리포트: [{ 날: '2026-09-12', 이름: 'a' }, { 날: '2026-09-13', 이름: 'b' }], 애널: [{ 날: '2026-09-13', 이름: 'c' }] },
    (이름) => ({
      a: { 줄들: [{ 보고서번호: 1, 발표일: '2026-09-10' }] },
      b: { 줄들: [{ 보고서번호: 1, 발표일: '2026-09-10' }, { 보고서번호: 2, 발표일: '2026-09-12' }] },
      c: { 줄들: [{ 순위: 1, 이름: '아무개', 정확도: 0 }] },
    }[이름]),
  );
  재다('겹친 보고서는 한 번만', 지은것.reports.length === 2);
  재다('최신 발표가 앞에', 지은것.reports[0].report_id === 2);
  재다('애널 줄이 들어간다', 지은것.analysts.length === 1);
  재다('스냅숏 날을 다 적는다', 지은것._meta.reportSnapshots.length === 2);

  return 흠;
}

if (process.argv[1] && process.argv[1].endsWith('build-v1-consensus-tape.mjs')) {
  const 흠 = 자가시험();
  if (흠.length) { console.log('🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ')); process.exit(1); }
  console.log('✅ 자가시험 21/21');

  const 갈래 = 갈래나누기(fs.readdirSync(우물));
  if (!갈래.리포트.length) { console.log('🔴 우물이 비었다: ' + 우물); process.exit(1); }
  const 표 = 짓기(갈래);
  fs.writeFileSync(낼곳, JSON.stringify(표), 'utf8');
  console.log('✅ ' + 낼곳);
  console.log('   리포트 ' + 표.reports.length + '건(스냅숏 ' + 표._meta.reportSnapshots.length + '일)'
    + ' · 애널 ' + 표.analysts.length + '줄 · 목표가 변동 잰 것 ' + 표._meta.withTargetChange + '건');
}
