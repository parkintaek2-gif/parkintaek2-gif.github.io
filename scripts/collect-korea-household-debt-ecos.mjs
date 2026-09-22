#!/usr/bin/env node
/**
 * collect-korea-household-debt-ecos.mjs
 *   — **한국 가계부채 스트레스 테이프**를 ECOS 원자료에서 거둔다 (5번 · 2026-09-22)
 *
 * ── 🔴 왜 (사장님 지시, 2026-09-22) ─────────────────────────────────────
 *   「**한은이 공개한 금융안정 상황(2026년 9월) 보고 쓸만하면
 *     어느 유닛에서 데이터를 수집, 가공할 건지 결정해서 해라**」
 *
 *   ⇒ ① 쓸만한가 — **그렇다.** 아래 「무엇을 재서 그렇게 판단했나」 참조.
 *     ② 어느 유닛 — **SeoulMarkets(5번).** 한국 금융 자료를 «영문»으로 내는 곳은 여기뿐이다.
 *        백년지도(교육)·K Culture Wire(대중문화)·KLifeMap(명리) 어디에도 안 맞는다.
 *     ③ 어떻게 — **PDF 를 긁지 않는다. ECOS 원자료로 간다.**
 *
 * ── 무엇을 재서 그렇게 판단했나 (2026-09-22 실측) ───────────────────────
 *   · 한국은행 홈페이지의 「금융안정보고서」 게시판과 「보도자료」 게시판이 둘 다
 *     **「콘텐츠 준비중입니다」** 로 비어 있다. 브라우저로 열어 확인했다.
 *     ⇒ 보고서 PDF 를 긁는 길은 지금 막혀 있고, 막히지 않았더라도 우리 방식이 아니다 —
 *       회사 강령은 「**raw data 를 가공한다**」이지 「남의 완성된 표를 받아 쓴다」가 아니다.
 *   · ECOS 통계표 839개를 받아 훑으니 **금융안정 축의 원자료가 그대로 있다** —
 *     가계신용(업권별·용도별) · 은행대출금 연체율 · 차주별 가계부채 · 주택담보대출 비중.
 *     최신 시점도 살아 있다: 분기 **2026Q2**, 월 **202606**.
 *   · 이 축을 «영문 시계열»로 내는 곳을 아직 못 봤다. 남들이 안 센 자리다.
 *
 * ── ⚠ 라이선스 ─────────────────────────────────────────────────────────
 *   `docs/데이터-출처-라이선스.md` — 「공공데이터포털 경유 한국은행 통계」는 사용 가능.
 *   ECOS 직접 경로는 약관 재배포 조항을 아직 원문으로 확인하지 못했다고 적혀 있다.
 *   ⇒ 그래서 이 자는 **원본을 아카이브에 그대로 쌓기만** 하고, 지면에 낼 때는
 *     대장을 다시 읽고 판단한다. 채권금리(collect-bond-yields-ecos.mjs)가 이미 같은 길이다.
 *   ⛔ 열쇠(ECOS_KEY) 값을 화면·로그·커밋 어디에도 찍지 않는다.
 *
 * 쓰는 법
 *   node scripts/collect-korea-household-debt-ecos.mjs --자가시험
 *   node scripts/collect-korea-household-debt-ecos.mjs --받는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 쌓을방 = path.join(뿌리, 'archive', 'raw', 'korea-household-debt-ecos');
export const 낼길 = path.join(뿌리, 'src', 'data', 'korea-household-debt.json');

/** ⛔ 값을 돌려주되 «찍지» 않는다 */
export function 열쇠읽기(글) {
  for (const l of String(글 ?? '').split(/\r?\n/)) {
    const m = l.match(/^\s*ECOS_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

/**
 * 거둘 계열 — «스트레스»를 재는 데 필요한 것만 고른다.
 * ⛔ 있는 것을 다 긁지 않는다. 지면에서 말이 되는 축만 가져온다.
 */
export const 거둘것 = [
  {
    키: 'household_credit', 표: '151Y001', 주기: 'Q', 처음: '2002Q4',
    이름: 'Household credit by lender', 단위: 'KRW bn',
    항목: [
      ['1000000', 'Total household credit'],
      ['1100000', 'Household loans'],
      ['1110000', 'Depository institutions'],
      ['1111000', 'Commercial banks'],
      ['11A0000', 'Non-bank depository'],
      ['1112000', 'Mutual savings banks'],
    ],
  },
  {
    키: 'delinquency', 표: '901Y124', 주기: 'M', 처음: '201501',
    이름: 'Bank loan delinquency (1 month or more)', 단위: '%',
    항목: [
      ['MO3AA', 'Corporate loans'],
      ['MO3AB', 'Household loans'],
      ['MO3AC', 'Credit-card loans'],
    ],
  },
  {
    키: 'mortgage_share_new', 표: '181Y015', 주기: 'Q', 처음: '2013Q1',
    이름: 'Share of new mortgage lending', 단위: '%',
    항목: [['0000', 'All borrowers'], ['A001', 'First-time'], ['A002', 'Top-up'], ['A003', 'Refinance']],
  },
  {
    키: 'mortgage_per_borrower', 표: '181Y012', 주기: 'Q', 처음: '2013Q1',
    이름: 'Mortgage balance per borrower', 단위: 'KRW 100k',
    항목: [['0000', 'All borrowers'], ['B001', 'Men'], ['B002', 'Women']],
  },
];

/** 오늘 시점을 그 주기의 «끝»으로 (KST — 이 PC 가 이미 KST 다) */
export function 끝시점(주기, 이제 = new Date()) {
  const y = 이제.getFullYear();
  const m = 이제.getMonth() + 1;
  if (주기 === 'M') return `${y}${String(m).padStart(2, '0')}`;
  if (주기 === 'Q') return `${y}Q${Math.ceil(m / 3)}`;
  return String(y);
}

/** ECOS 한 줄 → 우리 꼴. ⛔ 빈 값은 «0 이 아니라» null 이다 */
export function 값으로(s) {
  const t = String(s ?? '').trim();
  if (!t || t === '-') return null;
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** 시점 글자를 사람이 읽는 꼴로 — 2026Q2 · 202606 → 2026-Q2 · 2026-06 */
export function 시점보기(t, 주기) {
  const s = String(t ?? '');
  if (주기 === 'Q') return s.replace(/^(\d{4})Q?(\d)$/, '$1-Q$2');
  if (주기 === 'M') return s.replace(/^(\d{4})(\d{2})$/, '$1-$2');
  return s;
}

/** 받은 줄들에서 «마지막 값이 있는 시점»을 찾는다 — 최신 분기는 비어 있을 수 있다 */
export function 최근시점(줄들) {
  const 것 = (줄들 || []).filter((r) => 값으로(r.DATA_VALUE) !== null);
  if (!것.length) return null;
  return 것[것.length - 1].TIME;
}

export function 주소(열쇠, 표, 주기, 처음, 끝, 항목) {
  return `https://ecos.bok.or.kr/api/StatisticSearch/${열쇠}/json/kr/1/2000/${표}/${주기}/${처음}/${끝}/${항목}`;
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);

  검('열쇠를 읽는다', 열쇠읽기('A=1\nECOS_KEY=abc123\nB=2') === 'abc123');
  검('따옴표를 벗긴다', 열쇠읽기('ECOS_KEY="abc"') === 'abc');
  검('⛔ 없으면 빈 글 — 지어내지 않는다', 열쇠읽기('X=1') === '');
  검('⛔ null 에도 안 터진다', 열쇠읽기(null) === '');

  검('거둘 계열이 넷이다', 거둘것.length === 4);
  검('계열마다 표·주기·항목이 있다',
    거둘것.every((x) => x.표 && x.주기 && x.항목.length && x.이름 && x.단위));
  검('⛔ 키가 겹치지 않는다', new Set(거둘것.map((x) => x.키)).size === 거둘것.length);
  검('이름이 영문이다 — 손님이 영어권이다',
    거둘것.every((x) => !/[가-힣]/.test(x.이름) && x.항목.every(([, n]) => !/[가-힣]/.test(n))));

  검('분기 끝시점', 끝시점('Q', new Date(2026, 8, 22)) === '2026Q3');
  검('월 끝시점', 끝시점('M', new Date(2026, 8, 22)) === '202609');
  검('연 끝시점', 끝시점('A', new Date(2026, 8, 22)) === '2026');
  검('1월도 한 자리로 안 준다', 끝시점('M', new Date(2026, 0, 5)) === '202601');

  검('값을 읽는다', 값으로('1,234.5') === 1234.5);
  검('🔴 빈 값은 0 이 아니라 null 이다', 값으로('') === null && 값으로('-') === null);
  검('⛔ 숫자가 아니면 null', 값으로('n/a') === null);
  검('0 은 0 이다 — null 로 바꾸지 않는다', 값으로('0') === 0);

  검('분기 시점 보기', 시점보기('2026Q2', 'Q') === '2026-Q2');
  검('월 시점 보기', 시점보기('202606', 'M') === '2026-06');

  검('마지막 «값이 있는» 시점을 고른다',
    최근시점([{ TIME: '2026Q1', DATA_VALUE: '10' }, { TIME: '2026Q2', DATA_VALUE: '' }]) === '2026Q1');
  검('⛔ 다 비면 null', 최근시점([{ TIME: '2026Q1', DATA_VALUE: '' }]) === null);
  검('⛔ 빈 배열도 null', 최근시점([]) === null && 최근시점(null) === null);

  검('주소를 만든다', 주소('K', '151Y001', 'Q', '2002Q4', '2026Q3', '1000000')
    .includes('/StatisticSearch/K/json/kr/1/2000/151Y001/Q/2002Q4/2026Q3/1000000'));
  /* ⚠ 바늘을 «조각»으로 만든다 — 통짜로 적으면 이 시험 줄 자신이 걸려서 늘 떨어진다
     (2026-09-22 에 스포츠 수집기에서 겪은 것과 같은 함정) */
  검('⛔ 열쇠를 화면에 찍지 않는다', (() => {
    const 나 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
    const 바늘 = ['con', 'sole.log(', '열쇠'].join('');
    return !나.includes(바늘);
  })());

  const 통 = 잰다.filter(([, v]) => v).length;
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(통 === 잰다.length ? `\n✅ 자가시험 ${통} 통과` : `\n🔴 ${잰다.length - 통}/${잰다.length} 떨어졌다`);
  process.exit(통 === 잰다.length ? 0 : 1);
}

/* ── 실제로 받는다 ─────────────────────────────────────────── */
if (내가진입점 && process.argv.includes('--받는다')) {
  const 열쇠 = 열쇠읽기(fs.readFileSync(path.join(뿌리, '.env'), 'utf8'));
  if (!열쇠) { console.error('⛔ .env 에 ECOS_KEY 가 없다 — 안 받는다'); process.exit(1); }

  const 날 = new Date();
  const 날글 = `${날.getFullYear()}-${String(날.getMonth() + 1).padStart(2, '0')}-${String(날.getDate()).padStart(2, '0')}`;
  fs.mkdirSync(쌓을방, { recursive: true });
  fs.mkdirSync(path.dirname(낼길), { recursive: true });

  const 낸다 = { 받은날: 날글, 출처: 'Bank of Korea ECOS', 계열: [] };
  let 탈 = 0;

  for (const 계 of 거둘것) {
    const 끝 = 끝시점(계.주기, 날);
    const 갈래 = [];
    for (const [코드, 이름] of 계.항목) {
      const r = await fetch(주소(열쇠, 계.표, 계.주기, 계.처음, 끝, 코드)).catch(() => null);
      const j = r ? await r.json().catch(() => null) : null;
      const 줄 = j?.StatisticSearch?.row || [];
      if (!줄.length) {
        console.log(`   🔴 ${계.표}/${코드} ${이름} — 못 받았다`);
        탈++;
        continue;
      }
      const 점 = 줄.map((x) => ({ t: x.TIME, v: 값으로(x.DATA_VALUE) }));
      갈래.push({ code: 코드, name: 이름, points: 점, latest: 최근시점(줄) });
      console.log(`   ✅ ${계.표}/${코드} ${이름.padEnd(24)} ${점.length}점 · 최근 ${시점보기(최근시점(줄) || '-', 계.주기)}`);
      /* 원본을 그대로 쌓는다 — 가공본만 두면 되돌릴 수 없다 */
      fs.writeFileSync(path.join(쌓을방, `${날글}_${계.표}_${코드}.json`), JSON.stringify(j));
    }
    if (갈래.length) 낸다.계열.push({ key: 계.키, table: 계.표, cycle: 계.주기, title: 계.이름, unit: 계.단위, series: 갈래 });
  }

  fs.writeFileSync(낼길, JSON.stringify(낸다, null, 1));
  const 점수 = 낸다.계열.reduce((a, c) => a + c.series.reduce((b, s) => b + s.points.length, 0), 0);
  console.log(`\n■ 계열 ${낸다.계열.length}묶음 · 갈래 ${낸다.계열.reduce((a, c) => a + c.series.length, 0)}개 · 점 ${점수}개 · 탈 ${탈}`);
  console.log(`   원본 → ${path.relative(뿌리, 쌓을방)}`);
  console.log(`   가공 → ${path.relative(뿌리, 낼길)}`);
  process.exit(탈 ? 1 : 0);
}

if (내가진입점 && !process.argv.includes('--자가시험') && !process.argv.includes('--받는다')) {
  console.log('⛔ --자가시험 이나 --받는다 를 준다');
  process.exit(1);
}
