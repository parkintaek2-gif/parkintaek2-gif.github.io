/**
 * build-v1-indices-tape.mjs — `/v1/indices` 가 내줄 «이력»을 짓는다.
 * ─────────────────────────────────────────────────────────────────────────
 * 사장님 지시 (2026-09-13): 「마무리 해」 — 내가 「구멍」으로 보고한 셋 가운데 하나.
 *
 * 🔴 왜 `/v1/index-tape` 와 따로 두나 — **같은 것을 두 번 내지 않기 위해서다.**
 *   index-tape 는 «가장 최근 하루»의 168개 지수 스냅숏이다(스냅숏 20260910).
 *   indices 는 «날짜가 있는 이력»이다 — 아카이브에 쌓인 날들을 다 이어 붙인 시계열.
 *   손님이 「어제 대비」가 아니라 「이 달 흐름」을 물을 때 필요한 것이 이쪽이다.
 *   ⛔ 이 구분이 흐려지면 두 갈래가 서로 베낀 표가 된다. 지을 때부터 갈라 둔다.
 *
 * 우물: archive/raw/indices/<YYYYMMDD>.ndjson — 한 줄에 지수 하나.
 *
 * ⛔ 연최저(연최저)가 0 으로 오는 줄이 많다 — 지면이 «안 잰 것»을 0 으로 내주는 자리다.
 *   index-tape 빌더가 이미 그것을 null 로 내렸다. 여기도 같게 한다.
 *   **하나를 고치면 인용한 곳까지 따라간다**(강령 ⑤) 가 여기에 걸린다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 우물 = path.join(뿌리, 'archive/raw/indices');
const 낼곳 = path.join(뿌리, 'src/data/korea-indices-history.json');

/**
 * 🔴 우리 손님은 영어권이다 — 원자료에는 한글 이름밖에 없다.
 *   index-tape 가 이미 168개 지수의 한글↔영문 짝을 갖고 있으므로 그것을 그대로 쓴다.
 *   ⛔ 여기서 영문 이름을 «새로 지어내지» 않는다. 두 갈래가 같은 지수를 다르게 부르면
 *     손님이 둘을 다른 지수로 읽는다(강령 ⑤ — 하나를 고치면 인용한 곳까지 따라간다).
 * ⚠ 짝이 없는 이름은 name_en:null 로 둔다. 음차로 채우지 않는다.
 */
export function 영문이름표(index표) {
  const 이름 = new Map();
  const 계열 = new Map();
  for (const r of (Array.isArray(index표?.rows) ? index표.rows : [])) {
    if (r.name && r.nameEn && !이름.has(r.name)) 이름.set(r.name, r.nameEn);
    if (r.family && r.familyEn && !계열.has(r.family)) 계열.set(r.family, r.familyEn);
  }
  return { 이름, 계열 };
}

export function 날파일들(이름들) {
  return 이름들
    .map((이름) => {
      const m = String(이름).match(/^(\d{8})\.ndjson$/);
      return m ? { 날: m[1], 이름 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.날.localeCompare(b.날));
}

/** 「20260910」 → 「2026-09-10」. ⛔ toISOString() 을 쓰지 않는다 — 새벽에 하루가 어긋난다 */
export function 날글(s) {
  const t = String(s ?? '');
  return /^\d{8}$/.test(t) ? t.slice(0, 4) + '-' + t.slice(4, 6) + '-' + t.slice(6, 8) : null;
}

export function 수(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * ⚠ 연최저가 0 인데 «연최저일이 있는» 줄은 안 잰 것이다.
 *   0 이 진짜 최저값인 지수는 없다 — 지수는 기준 100·1000 에서 출발한다.
 */
export function 연최저읽기(줄) {
  const v = 수(줄.연최저);
  if (v === null || v === 0) return { yearLow: null, yearLowDate: null, yearLowNotMeasured: true };
  return { yearLow: v, yearLowDate: 날글(줄.연최저일) ?? 줄.연최저일 ?? null, yearLowNotMeasured: false };
}

export function 한줄(줄, 날, 영문 = { 이름: new Map(), 계열: new Map() }) {
  const 저 = 연최저읽기(줄);
  return {
    date: 날글(날),
    name: 줄.이름 ?? null,
    name_en: 영문.이름.get(줄.이름) ?? null,
    family: 줄.계열 ?? null,
    family_en: 영문.계열.get(줄.계열) ?? null,
    constituent_count: 수(줄.구성종목수),
    is_computed_index: 줄.산출지수 === true,
    close: 수(줄.종가),
    change: 수(줄.전일비),
    change_pct: 수(줄.등락률),
    open: 수(줄.시가),
    high: 수(줄.고가),
    low: 수(줄.저가),
    volume: 수(줄.거래량),
    trading_value_krw: 수(줄.거래대금),
    market_cap_krw: 수(줄.시가총액),
    year_high: 수(줄.연최고),
    year_high_date: 날글(줄.연최고일) ?? 줄.연최고일 ?? null,
    year_low: 저.yearLow,
    year_low_date: 저.yearLowDate,
    year_low_not_measured: 저.yearLowNotMeasured,
  };
}

export function 한파일읽기(글) {
  const 줄들 = [];
  for (const 줄 of String(글).split(/\r?\n/)) {
    const t = 줄.trim();
    if (!t) continue;
    try { 줄들.push(JSON.parse(t)); } catch { /* 깨진 줄은 버린다 — 통째로 실패시키지 않는다 */ }
  }
  return 줄들;
}

export function 짓기(파일들, 읽기 = (이름) => fs.readFileSync(path.join(우물, 이름), 'utf8'), 영문 = { 이름: new Map(), 계열: new Map() }) {
  const 줄들 = [];
  const 날별 = [];
  let 깨진줄 = 0;
  for (const it of 파일들) {
    const 글 = 읽기(it.이름);
    const 날것 = 한파일읽기(글);
    const 잰줄 = String(글).split(/\r?\n/).filter((x) => x.trim()).length;
    깨진줄 += 잰줄 - 날것.length;
    const 낸것 = 날것.map((r) => 한줄(r, it.날, 영문));
    줄들.push(...낸것);
    날별.push({ date: 날글(it.날), indices: 낸것.length });
  }
  줄들.sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.name).localeCompare(String(b.name)));

  const 이름들 = [...new Set(줄들.map((r) => r.name).filter(Boolean))].sort();
  const 영문붙은것 = 이름들.filter((n) => 영문.이름.has(n)).length;
  return {
    _meta: {
      product: 'Korea Index History',
      source: 'Korea public data portal — daily index series (archive/raw/indices)',
      builtAt: new Date().toLocaleString('ko-KR'),
      rows: 줄들.length,
      days: 날별.length,
      firstDate: 날별.length ? 날별[0].date : null,
      lastDate: 날별.length ? 날별[날별.length - 1].date : null,
      distinctIndices: 이름들.length,
      withNameEn: 영문붙은것,
      nameEnNote: 'English names come from the same mapping /v1/index-tape uses, never invented here. '
        + 'An index with no mapping carries name_en:null rather than a transliteration.',
      dayBreakdown: 날별,
      droppedUnparsableLines: 깨진줄,
      notIndexTape: 'This endpoint is the dated history. /v1/index-tape is a single most-recent snapshot with '
        + 'English names and base-date fields. They are built from the same well but answer different questions.',
      yearLowNote: 'The source prints 0 for a year-low it has not measured. A zero is impossible for an index, '
        + 'so those rows carry year_low:null with year_low_not_measured:true — never a low of zero.',
      notThis: 'These are published index levels, reproduced as filed. Not a forecast and not advice.',
    },
    indexNames: 이름들,
    rows: 줄들,
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 흠 = [];
  const 재다 = (이름, 참) => { if (!참) 흠.push(이름); };

  재다('날짜 파일만 고른다', 날파일들(['20260910.ndjson', '메모.txt', '2026.ndjson']).length === 1);
  재다('오름차순', 날파일들(['20260911.ndjson', '20260910.ndjson'])[0].날 === '20260910');

  재다('날짜를 글로', 날글('20260910') === '2026-09-10');
  재다('꼴이 아니면 null', 날글('2026-09-10') === null);
  재다('빈 것도 null', 날글(null) === null);

  재다('0 은 0', 수(0) === 0);
  재다('빈 글자는 null', 수('') === null);
  재다('글자는 null', 수('없음') === null);

  const 저1 = 연최저읽기({ 연최저: 0, 연최저일: '20260601' });
  재다('연최저 0 은 못 잰 것', 저1.yearLow === null && 저1.yearLowNotMeasured === true);
  const 저2 = 연최저읽기({ 연최저: 900.5, 연최저일: '20260601' });
  재다('값이 있으면 그대로', 저2.yearLow === 900.5 && 저2.yearLowNotMeasured === false);
  재다('연최저일도 글로 바뀐다', 저2.yearLowDate === '2026-06-01');

  const 영문 = 영문이름표({ rows: [{ name: 'IT 서비스', nameEn: 'IT Services', family: 'KOSPI시리즈', familyEn: 'KOSPI Series' }] });
  재다('영문 이름표를 만든다', 영문.이름.get('IT 서비스') === 'IT Services');
  재다('계열도 영문이 붙는다', 영문.계열.get('KOSPI시리즈') === 'KOSPI Series');
  재다('짝이 없으면 안 만든다', 영문이름표({ rows: [{ name: '가', nameEn: null }] }).이름.size === 0);

  const r = 한줄({ 이름: 'IT 서비스', 계열: 'KOSPI시리즈', 종가: 1173.82, 연최저: 0 }, '20260910', 영문);
  재다('날짜가 붙는다', r.date === '2026-09-10');
  재다('종가가 온다', r.close === 1173.82);
  재다('연최저는 null', r.year_low === null);
  재다('영문 이름이 붙는다', r.name_en === 'IT Services' && r.family_en === 'KOSPI Series');
  const r2 = 한줄({ 이름: '모르는지수', 종가: 1 }, '20260910', 영문);
  재다('짝이 없으면 null 이지 음차가 아니다', r2.name_en === null);

  재다('빈 줄은 버린다', 한파일읽기('{"이름":"가"}\n\n{"이름":"나"}\n').length === 2);
  재다('깨진 줄은 버리고 나머지는 산다', 한파일읽기('{"이름":"가"}\n{깨짐\n{"이름":"나"}').length === 2);

  const 지은것 = 짓기(
    [{ 날: '20260909', 이름: 'a' }, { 날: '20260910', 이름: 'b' }],
    (이름) => ({
      a: '{"이름":"KOSPI","종가":3000,"연최저":0}\n{"이름":"KOSDAQ","종가":900,"연최저":800}',
      b: '{"이름":"KOSPI","종가":3010,"연최저":0}\n{깨짐',
    }[이름]),
  );
  재다('줄 셋', 지은것.rows.length === 3);
  재다('최신 날이 앞에', 지은것.rows[0].date === '2026-09-10');
  재다('날 수 둘', 지은것._meta.days === 2);
  재다('처음·끝 날', 지은것._meta.firstDate === '2026-09-09' && 지은것._meta.lastDate === '2026-09-10');
  재다('이름 두 가지', 지은것._meta.distinctIndices === 2);
  재다('깨진 줄을 센다', 지은것._meta.droppedUnparsableLines === 1);
  재다('연최저 0 은 아무 줄에도 안 남는다', 지은것.rows.every((x) => x.year_low !== 0));

  return 흠;
}

if (process.argv[1] && process.argv[1].endsWith('build-v1-indices-tape.mjs')) {
  const 흠 = 자가시험();
  if (흠.length) { console.log('🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ')); process.exit(1); }
  console.log('✅ 자가시험 ' + (28 - 흠.length) + '/28');

  const 파일들 = 날파일들(fs.readdirSync(우물));
  if (!파일들.length) { console.log('🔴 우물이 비었다: ' + 우물); process.exit(1); }
  /* index-tape 의 한글↔영문 짝을 그대로 빌려 온다 — 새로 짓지 않는다 */
  const 영문 = 영문이름표(JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/korea-index-tape.json'), 'utf8')));
  const 표 = 짓기(파일들, undefined, 영문);
  fs.writeFileSync(낼곳, JSON.stringify(표), 'utf8');
  console.log('✅ ' + 낼곳);
  console.log('   줄 ' + 표._meta.rows + ' · 날 ' + 표._meta.days + '일('
    + 표._meta.firstDate + ' ~ ' + 표._meta.lastDate + ') · 지수 ' + 표._meta.distinctIndices + '가지(영문 ' + 표._meta.withNameEn + ')');
}
