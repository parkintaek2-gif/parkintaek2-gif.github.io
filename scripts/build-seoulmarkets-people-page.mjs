#!/usr/bin/env node
/**
 * build-seoulmarkets-people-page.mjs — **Korea People Panel 무료 지면 자료.** (P5 4/4)
 *
 *   node scripts/build-seoulmarkets-people-page.mjs --자가시험
 *   node scripts/build-seoulmarkets-people-page.mjs
 *
 * ── ⭐ 깔때기는 «상품 파일»에서 센다 (P5 규칙 · 2026-09-09) ──────────
 * 원자료(DART)로 다시 가지 않는다. **파는 CSV 를 그대로 읽어 센다.**
 *   public/data/korea-people-panel-<날짜>.csv
 * 까닭 — 무료 지면 수와 파는 파일 수가 «어긋날 수 없게» 만든다. 갈라지면 손님이
 * 둘 중 하나를 못 믿고, 그러면 둘 다 못 믿는다. 우리가 파는 것은 신뢰다.
 *
 * ── 🔴 이 지면이 지키는 것 — 여기가 회사에서 가장 위험한 자료다 ────────
 * 이 파일에는 «성별 급여 비율»과 «성별 근속 비율»이 있다. 그것을 어떻게 적느냐로
 * 우리가 나침반이 되거나, 사람을 밀어붙이는 쪽이 된다.
 *
 * ⛔ **차별의 증거로 쓰지 않는다.** 공시에는 «비율»만 있고 «까닭»이 없다.
 *   직군 구성·연차 구성·근무형태가 다 섞인 한 칸이다. 우리는 잰 것만 적는다
 * ⛔ **회사를 점수 매기거나 순위로 세우지 않는다.** 「좋은 회사」·「나쁜 회사」를 안 쓴다
 * ⛔ **평균을 규범으로 만들지 않는다.** 분포를 낸다 (강령 ②)
 * 🔴 **「해당 없음」과 「못 쟀다」를 가른다.** pay_ratio_withheld_reason 이 그 칸이다 —
 *   공시가 급여를 «성별로 나눠 적지 않아도 되는» 경우가 있다. 그것을 0 으로 세면 거짓이다
 * ⛔ 지면에 한국어를 내지 않는다
 * ⛔ 「생산성」이라 쓰지 않는다 — 시가총액은 미래 베팅이지 사람이 만든 값이 아니다(강령)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* 🔴 [2026-09-12] 6번이 P4 전량 파일을 public/data 에서 src/data/full 로 옮겼다
 * (밸류에이션과 같은 "전량 무료 노출" 실수를 되풀이하지 않으려고 — 표본만 공개 폴더에 남긴다).
 * 이 자는 전량을 읽어 «셈»을 내야 하므로 옮겨 간 자리를 따라간다. */
const 자료방 = path.join(뿌리, 'src/data/full');
const 낼길 = path.join(뿌리, 'src/data/seoulmarkets-people.json');

/**
 * CSV 를 인용까지 알고 읽는다.
 * 🔴 순진한 `split('\n')` 은 칸 안 줄바꿈에서 무너진다. 회사 이름에 쉼표도 들어온다
 *   («SAMSUNG CO,.LTD» 를 실제로 만났다). 그래서 split(',') 도 쓰지 않는다.
 */
export function 파싱(s) {
  const 줄 = []; let 칸 = []; let 값 = ''; let 인용 = false;
  const 글 = String(s ?? '');
  for (let i = 0; i < 글.length; i += 1) {
    const c = 글[i];
    if (인용) {
      if (c === '"') { if (글[i + 1] === '"') { 값 += '"'; i += 1; } else 인용 = false; } else 값 += c;
    } else if (c === '"') 인용 = true;
    else if (c === ',') { 칸.push(값); 값 = ''; }
    else if (c === '\n') { 칸.push(값); 값 = ''; 줄.push(칸); 칸 = []; }
    else if (c !== '\r') 값 += c;
  }
  if (값 !== '' || 칸.length) { 칸.push(값); 줄.push(칸); }
  // ⛔ 칸 «수»로 거르지 않는다. 「모든 칸이 빈 줄」만 버린다 (한 칸짜리 진짜 줄을 살린다)
  return 줄.filter((r) => r.some((v) => String(v).trim() !== ''));
}

/** 가장 새 상품 파일 — ⛔ 이름을 손으로 적지 않는다. 날짜가 바뀌면 자가 따라간다 */
export function 최근상품(파일들) {
  const 것 = (파일들 ?? []).filter((f) => /^korea-people-panel-\d{4}-\d{2}-\d{2}\.csv$/.test(f)).sort();
  return 것.at(-1) ?? null;
}

/** 빈칸을 0 으로 세지 않는 수 읽기 — 🔴 `Number(null) === 0` 이 이 저장소의 대표 함정이다 */
export function 수(v) {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * 값이 없는 까닭을 가른다 — 「해당 없음」과 「못 쟀다」는 다른 것이다.
 * 🔴 메자닌 지면에서 EB 리픽싱으로 배운 것을 그대로 쓴다. 그때는 428행이 «해당 없음»이었다.
 *   여기서는 급여를 성별로 나눠 적지 않은 공시가 그 자리다.
 */
export function 값갈래(행들, 값자리, 까닭자리) {
  let 있음 = 0; let 해당없음 = 0; let 못쟀다 = 0;
  for (const r of (행들 ?? [])) {
    const v = String(r?.[값자리] ?? '').trim();
    const 까닭 = String(r?.[까닭자리] ?? '').trim();
    if (v !== '') 있음 += 1;
    else if (까닭 !== '') 해당없음 += 1;
    else 못쟀다 += 1;
  }
  return { has: 있음, notApplicable: 해당없음, notRecorded: 못쟀다 };
}

/**
 * 분포를 칸으로 나눈다 — ⛔ 평균 하나로 말하지 않는다 (강령 ②: 평균이 규범이 되면 압박이다).
 * 칸 경계는 «미만»으로 읽는다. 마지막 칸은 위가 열려 있다.
 */
export function 분포(값들, 경계들) {
  const 것 = (값들 ?? []).filter((v) => v !== null && Number.isFinite(v));
  const 칸 = 경계들.map((하, i) => ({
    from: 하, to: 경계들[i + 1] ?? null, count: 0,
  }));
  for (const v of 것) {
    let i = 0;
    for (let k = 경계들.length - 1; k >= 0; k -= 1) { if (v >= 경계들[k]) { i = k; break; } }
    // 첫 경계보다 작은 값도 첫 칸에 담는다 — 버리면 합이 안 맞는다
    칸[i].count += 1;
  }
  return { measured: 것.length, of: 값들?.length ?? 0, bands: 칸 };
}

/** 중간값 — ⛔ 평균이 아니다. 한 회사가 크다고 끌려가지 않는다 */
export function 중간값(값들) {
  const 것 = (값들 ?? []).filter((v) => v !== null && Number.isFinite(v)).sort((a, b) => a - b);
  if (!것.length) return null;
  const m = Math.floor(것.length / 2);
  return 것.length % 2 ? 것[m] : (것[m - 1] + 것[m]) / 2;
}

function 짓기() {
  const f = 최근상품(fs.readdirSync(자료방));
  if (!f) throw new Error('korea-people-panel CSV 가 없다 — build-seoulmarkets-people-panel.mjs 를 먼저 돌린다');
  const 글 = fs.readFileSync(path.join(자료방, f), 'utf8');
  const 순진한줄수 = 글.trim().split('\n').length - 1;
  const 표 = 파싱(글);
  const 머리 = 표[0]; const 몸 = 표.slice(1);
  const 자 = (이름) => 머리.indexOf(이름);

  const 시장 = {};
  for (const r of 몸) {
    const v = String(r[자('market')] ?? '').trim() || '(not recorded)';
    시장[v] = (시장[v] ?? 0) + 1;
  }

  const 해 = {};
  for (const r of 몸) {
    const v = String(r[자('fiscal_year')] ?? '').trim() || '(not recorded)';
    해[v] = (해[v] ?? 0) + 1;
  }

  const 사람수들 = 몸.map((r) => 수(r[자('headcount')]));
  /* 🔴 [2026-09-09 · 5번] `women_share` 는 «백분율이 아니라 비율»이다 —
   *   사전이 「women divided by headcount」라고 적어 놓았고, 삼성전자가 0.269 다.
   *   처음에 이것을 퍼센트로 읽어 「여성 비중 중간값 0.246%」라는 수를 냈다.
   *   사람이 0.246% 일 수 없다. **수를 냈으면 그 수가 말이 되는지 본다.**
   *   ⇒ 지면에는 퍼센트로 내므로 여기서 «한 번만» 100을 곱한다. 두 곳에서 곱하지 않는다. */
  const 여성비들 = 몸.map((r) => { const v = 수(r[자('women_share')]); return v === null ? null : v * 100; });
  const 근속비들 = 몸.map((r) => 수(r[자('tenure_ratio_women_to_men')]));
  const 급여비들 = 몸.map((r) => 수(r[자('pay_ratio_women_to_men')]));

  const 낸것 = {
    builtOn: new Date().toLocaleDateString('sv-SE'),
    /* ⭐ 파는 파일 이름을 그대로 적는다 — 무료 지면과 상품이 같은 수임을 증거로 남긴다 */
    builtFrom: f,
    source: 'Workforce figures that Korean listed companies file with the Financial Supervisory Service, joined to KRX daily closing prices. We collect the filings ourselves and publish them as our licensed file. This page counts the same file we sell, so the free figures and the paid figures cannot disagree.',
    rows: 몸.length,
    naiveLineCount: 순진한줄수,
    columns: 머리.length,
    companies: new Set(몸.map((r) => r[자('ticker')]).filter(Boolean)).size,
    byMarket: 시장,
    byFiscalYear: 해,
    headcount: {
      sum: 사람수들.reduce((a, b) => a + (b ?? 0), 0),
      measured: 사람수들.filter((v) => v !== null).length,
      median: 중간값(사람수들),
    },
    /* 여성 비중 — 분포로 낸다(퍼센트). ⛔ 평균 한 수로 「정상」을 만들지 않는다 */
    womenSharePct: 분포(여성비들, [0, 10, 20, 30, 40, 50, 60]),
    womenSharePctMedian: 중간값(여성비들),
    /* 근속·급여 비율 — 1.0 이 「같다」는 뜻이다. ⛔ 1.0 을 목표선으로 부르지 않는다 */
    tenureRatio: 분포(근속비들, [0, 0.6, 0.8, 1.0, 1.2]),
    tenureRatioMedian: 중간값(근속비들),
    payRatio: 분포(급여비들, [0, 0.6, 0.7, 0.8, 0.9, 1.0]),
    payRatioMedian: 중간값(급여비들),
    /* 🔴 여기가 이 지면의 핵심 규율 — 없는 값의 «까닭»을 가른다 */
    payRatioAvailability: 값갈래(몸, 자('pay_ratio_women_to_men'), 자('pay_ratio_withheld_reason')),
    /* 🔴 [2026-09-12] 이 45곳 구멍은 고쳤다 — «내부코드」가 아니라 KRX·공공데이터포털도 쓰는
     * 진짜 6자리 영숫자 코드였다(예: "0015S0" 페스카로). 종목코드 검사를 순수 숫자에서
     * 6자리 영숫자로 넓혀 잡았더니 45곳이 그대로 들어왔다(2,879→2,924). 명세서 1-2-b 갱신. */
    knownGap: {
      sourceUniverse: 2924,
      inThisFile: 몸.length,
      missing: 2924 - 몸.length,
      note: 'As of 2026-09-12 this gap is closed — the 45 companies were excluded by a ticker-format bug (alphanumeric codes like "0015S0" were rejected as invalid), not because they were unmatchable. We publish the count either way so a re-opened gap would show here rather than being rounded away.',
    },
    notThis: [
      'Not a claim about discrimination. The filings carry ratios, not reasons: job mix, seniority mix and contract type all sit inside a single number.',
      'Not a benchmark. No company is scored, ranked as good, or compared to a norm.',
      'Not total payroll. Pay columns are annual pay PER PERSON in Korean won.',
      'Not a complete market. A company appears only when its filing carries the figure.',
    ],
  };
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, JSON.stringify(낸것, null, 2) + '\n', 'utf8');
  return 낸것;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
function 자가시험() {
  let 흠 = 0;
  const 검 = (말, 참) => { if (!참) { 흠 += 1; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };

  // 파싱 — 인용과 칸 안 줄바꿈
  const 글 = 'a,b,c\n1,"SAMSUNG CO,.LTD",3\n4,"두\n줄",6\n\n7,8,9\n';
  const t = 파싱(글);
  검('줄 수를 인용까지 알고 센다 (빈 줄은 버린다)', t.length === 4);
  검('🔴 칸 안 쉼표를 칸 나눔으로 읽지 않는다', t[1][1] === 'SAMSUNG CO,.LTD');
  검('🔴 칸 안 줄바꿈을 새 줄로 읽지 않는다', t[2][1] === '두\n줄');
  검('⛔ 한 칸짜리 진짜 줄을 버리지 않는다', 파싱('x\n').length === 1);
  검('⛔ 빈 것도 견딘다', 파싱(null).length === 0 && 파싱('').length === 0);

  // 최근상품
  검('가장 새 날짜의 상품 파일을 고른다', 최근상품([
    'korea-people-panel-2026-09-01.csv', 'korea-people-panel-2026-09-09.csv', 'other.csv',
  ]) === 'korea-people-panel-2026-09-09.csv');
  검('⛔ 다른 상품 파일에 낚이지 않는다', 최근상품(['korea-mezzanine-book-2026-09-09.csv']) === null);
  검('⛔ 빈 목록이면 null', 최근상품([]) === null && 최근상품(null) === null);

  // 수 — Number(null) === 0 함정
  검('🔴 빈칸을 0 으로 읽지 않는다', 수('') === null && 수(null) === null && 수('  ') === null);
  검('0 은 0 으로 읽는다 (빈칸과 다르다)', 수('0') === 0);
  검('⛔ 글자는 null 이다', 수('n/a') === null);
  검('소수를 읽는다', 수('0.83') === 0.83);

  // 값갈래 — 「해당 없음」 vs 「못 쟀다」
  const 행 = [
    ['0.83', ''],           // 있음
    ['', 'not disclosed by gender'], // 해당 없음(까닭이 적혀 있다)
    ['', ''],               // 못 쟀다
    ['0.91', ''],
  ];
  const g = 값갈래(행, 0, 1);
  검('🔴 값이 있는 것을 센다', g.has === 2);
  검('🔴 까닭이 적힌 빈칸은 «해당 없음» 이다', g.notApplicable === 1);
  검('🔴 까닭도 없는 빈칸은 «못 쟀다» 다 — 둘을 합치지 않는다', g.notRecorded === 1);
  검('세 칸의 합이 줄 수와 같다', g.has + g.notApplicable + g.notRecorded === 행.length);
  검('⛔ 빈 것도 견딘다', 값갈래(null, 0, 1).has === 0);

  // 분포 — 평균 하나로 말하지 않는다
  const d = 분포([5, 15, 25, 35, 45, 55, 65, null], [0, 10, 20, 30, 40, 50, 60]);
  검('잰 것만 센다 (빈칸을 0 칸에 넣지 않는다)', d.measured === 7 && d.of === 8);
  검('칸마다 하나씩 들어간다', d.bands.every((b) => b.count === 1));
  검('마지막 칸은 위가 열려 있다', d.bands.at(-1).to === null);
  검('칸 합이 잰 것과 같다', d.bands.reduce((a, b) => a + b.count, 0) === d.measured);
  검('경계값은 위쪽 칸에 들어간다 (10 은 10~20 칸)',
    분포([10], [0, 10, 20]).bands[1].count === 1);
  검('⛔ 첫 경계보다 작은 값도 버리지 않는다 (합이 어긋나면 거짓이다)',
    분포([-5], [0, 10]).bands[0].count === 1);

  // 중간값 — 평균이 아니다
  검('중간값을 낸다 (홀수)', 중간값([3, 1, 2]) === 2);
  검('중간값을 낸다 (짝수는 가운데 둘의 가운데)', 중간값([1, 2, 3, 4]) === 2.5);
  검('🔴 큰 값 하나에 끌려가지 않는다 — 평균이면 2000 대가 된다',
    중간값([1, 2, 3, 10000]) === 2.5);
  검('⛔ 잰 것이 없으면 null (0 이 아니다)', 중간값([null, null]) === null && 중간값([]) === null);

  // 실제 파일로
  let 낸것 = null;
  try { 낸것 = 짓기(); } catch (e) { 검('실제 상품 파일로 지어진다 — ' + e.message, false); }
  if (낸것) {
    검('실제 상품 파일로 지어진다', 낸것.rows > 0);
    검('🔴 순진하게 센 줄 수를 «함께» 낸다 (지면에서 손으로 안 적게)',
      Number.isFinite(낸것.naiveLineCount));
    검('파는 파일 이름을 증거로 남긴다', /^korea-people-panel-\d{4}-\d{2}-\d{2}\.csv$/.test(낸것.builtFrom));
    검('칸이 22개다', 낸것.columns === 22);
    검('🔴 [2026-09-12] 45곳 구멍이 고쳐졌다 — 지금은 0이어야 한다(다시 빠지면 이 시험이 잡는다)',
      낸것.knownGap.missing === 0);
    검('🔴 급여비율의 «해당 없음»과 «못 쟀다»가 갈려 있다',
      낸것.payRatioAvailability.has + 낸것.payRatioAvailability.notApplicable
      + 낸것.payRatioAvailability.notRecorded === 낸것.rows);
    검('⛔ 평균이 아니라 중간값을 낸다', 낸것.payRatioMedian !== undefined);
    검('⛔ 「이것이 아니다」를 네 줄 적는다 (차별 주장으로 읽히지 않게)',
      낸것.notThis.length === 4 && 낸것.notThis.some((x) => /discrimination/i.test(x)));
    검('⛔ 낼 글에 한국어가 없다', !/[ㄱ-ㆎ가-힣]/.test(
      낸것.source + 낸것.notThis.join(' ') + 낸것.knownGap.note));
    검('⛔ 「생산성」이라는 말을 쓰지 않는다 (시가총액은 사람이 만든 값이 아니다)',
      !/productivit/i.test(낸것.source + 낸것.notThis.join(' ')));

    /* 🔴 단위 함정 검사 — 오늘 실제로 여기 걸렸다.
     *   women_share 는 비율(0.269)이라 그대로 퍼센트로 읽으면 「0.246%」가 나온다.
     *   ⛔ 「수가 나왔다」로 넘기지 않는다. 그 수가 «말이 되나»를 검사로 둔다. */
    검('🔴 여성 비중 중간값이 퍼센트로 말이 된다 (5~60%) — 비율을 퍼센트로 잘못 읽으면 여기 걸린다',
      낸것.womenSharePctMedian !== null && 낸것.womenSharePctMedian >= 5 && 낸것.womenSharePctMedian <= 60);
    검('여성 비중 분포 칸에 사람이 실제로 들어가 있다 (전부 첫 칸이면 단위가 틀렸다)',
      낸것.womenSharePct.bands.filter((b) => b.count > 0).length >= 3);
    검('근속비·급여비는 비율이라 1 근처다 (0.3~2.0)',
      낸것.tenureRatioMedian > 0.3 && 낸것.tenureRatioMedian < 2
      && 낸것.payRatioMedian > 0.3 && 낸것.payRatioMedian < 2);
    검('회사 수와 줄 수가 같다 (한 회사가 두 줄이면 여기 걸린다)', 낸것.companies === 낸것.rows);
  }

  console.log(`\nPeople Panel 무료 지면 — 자가시험 ${흠 ? '🔴 흠 ' + 흠 + '개' : '전부 통과'}`);
  return 흠;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
const 것 = 짓기();
console.log(`■ Korea People Panel 무료 지면 자료 — ${것.builtFrom}`);
console.log(`  줄 ${것.rows.toLocaleString()} (순진하게 세면 ${것.naiveLineCount.toLocaleString()}) · 칸 ${것.columns} · 회사 ${것.companies.toLocaleString()}`);
console.log(`  사람 합 ${것.headcount.sum.toLocaleString()} · 회사당 중간값 ${것.headcount.median?.toLocaleString() ?? '못 쟀다'}`);
console.log(`  여성 비중 중간값 ${것.womenSharePctMedian ?? '못 쟀다'}% · 근속비 중간값 ${것.tenureRatioMedian ?? '못 쟀다'} · 급여비 중간값 ${것.payRatioMedian ?? '못 쟀다'}`);
console.log(`  급여비: 있음 ${것.payRatioAvailability.has} · 해당없음 ${것.payRatioAvailability.notApplicable} · 못 쟀다 ${것.payRatioAvailability.notRecorded}`);
console.log(`  ⚠ 원자료 ${것.knownGap.sourceUniverse} 중 ${것.knownGap.missing}곳 빠짐 — 숨기지 않고 지면에 적는다`);
console.log(`✅ 썼다 — ${path.relative(뿌리, 낼길)}`);
