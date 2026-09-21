#!/usr/bin/env node
/**
 * build-korea-disclosures-feed.mjs — **쌓아만 두고 아무 데도 안 쓰던 한국 중대공시를 지면으로 낸다.**
 *
 *   node scripts/build-korea-disclosures-feed.mjs
 *   node scripts/build-korea-disclosures-feed.mjs --자가시험
 *
 * ── 🔴 왜 (2026-09-22 · 5번) ────────────────────────────────────────────
 * 사장님 지시 — **「모은 자료는 반드시 지면이나 콘텐트로 낸다」.**
 * `archive/raw/dart-breaking` 에 **862건**(2026-08-25~09-21, 19갈래)이 쌓여 있는데
 * 그것을 쓰는 손님 지면이 **한 장도 없었다.** 쌓기만 한 자료는 자료가 아니다.
 *
 * 그리고 이것은 새 나라 차례표의 **둘째 칸**이다(CLAUDE.md 「주력과 서비스」) —
 * ① 재무제표 ② **공시(중대사건)** ③ 컨센서스·지수. 한국은 ①이 이미 서 있다.
 *
 * ── 왜 «전량»이 아니라 «중대사건»인가 ──────────────────────────────────
 * 공시 전량을 서비스하면 제한이 붙지만, 미국 Form 8-K 식으로 **중대사건만 골라**
 * 그 사실만 내면 그 제한이 걸리지 않는다(사장님이 정하신 설계).
 * 수집기가 이미 19갈래로 골라 두었다 — 여기서는 «영문으로 옮겨 내보내기»만 한다.
 *
 * ⛔ 손님 화면에 한국어를 내지 않는다. 회사 한글명과 공시 원제목은 «담지 않는다» —
 *   갈래 이름만 영문으로 낸다. 원문을 보고 싶은 사람은 DART 링크로 간다.
 * ⛔ 영문명을 못 찾은 회사를 지어내지 않는다 — 종목코드를 그대로 쓰고 그 사실을 센다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 곳간 = path.join(뿌리, 'archive', 'raw', 'dart-breaking');
const 한국탭 = path.join(뿌리, 'src', 'data', 'korea-financials-tape.json');
const 나갈곳 = path.join(뿌리, 'src', 'data', 'korea-disclosures-feed.json');

/**
 * 갈래 → 영문 이름·설명.
 *
 * ⚠ 이름을 짐작해서 짓지 않았다 — `scripts/collect-dart-breaking.mjs` 57~75줄의
 *   **원문 정규식이 무엇을 잡는지** 보고 옮겼다. 그것이 정본이다.
 * ⛔ 「좋다/나쁘다」를 이름에 넣지 않는다. 사건의 이름만 적는다(강령 — 우리는 나침반이다).
 */
export const 갈래 = {
  'delisting-risk': { en: 'Delisting risk', 뜻: 'Delisting review, watch-list designation, trading halt, or market-value shortfall' },
  'earnings-swing': { en: 'Large earnings change', 뜻: 'Disclosure of a material change in revenue or profit structure' },
  'supply-contract': { en: 'Single supply contract', 뜻: 'A single sales or supply contract large enough to require disclosure' },
  'cancellation': { en: 'Share cancellation', 뜻: 'Decision to cancel treasury or other shares' },
  'ceo-change': { en: 'CEO change', 뜻: 'Appointment, dismissal or replacement of the representative director' },
  'control-change': { en: 'Controlling shareholder change', 뜻: 'A transaction that changes, or pledges shares of, the largest shareholder' },
  'buyback': { en: 'Treasury share buyback', 뜻: 'Decision to acquire the company’s own shares' },
  'rights-issue': { en: 'Paid-in capital increase', 뜻: 'Decision to issue new shares for cash' },
  'director-change': { en: 'Outside director change', 뜻: 'Appointment, dismissal or early departure of an outside director' },
  'bonus-issue': { en: 'Bonus share issue', 뜻: 'Decision to issue new shares without payment' },
  'acquisition': { en: 'Stake acquisition', 뜻: 'Decision to acquire shares or equity securities of another company' },
  'convertible-bond': { en: 'Convertible bond issue', 뜻: 'Decision to issue convertible bonds' },
  'rumor-response': { en: 'Response to a report or rumour', 뜻: 'The company answering a press report or market rumour' },
  'debt-guarantee': { en: 'Debt guarantee', 뜻: 'Decision to guarantee another party’s debt' },
  'proxy-solicitation': { en: 'Proxy solicitation', 뜻: 'Reference documents for soliciting the exercise of voting rights' },
  'material-event': { en: 'Material management matter', 뜻: 'A management matter the company judges relevant to an investment decision' },
  'related-party-financing': { en: 'Related-party financing', 뜻: 'Borrowing from, lending to, or subscribing for shares of a related party' },
  'cb-repricing': { en: 'Conversion price reset', 뜻: 'Adjustment of the conversion price of an outstanding convertible bond' },
  'major-report': { en: 'Material report', 뜻: 'A report on material matters that does not fall into the categories above' },
};

/** 시장 코드 — DART 의 cls 한 글자 */
export const 시장 = { Y: 'KOSPI', K: 'KOSDAQ', N: 'KONEX', E: 'Other' };

/** 접수번호로 DART 원문 주소를 만든다 — 손님이 우리 말을 검산할 수 있어야 한다 */
export function 원문주소(rcept) {
  const n = String(rcept || '').replace(/\D/g, '');
  return /^\d{14}$/.test(n) ? `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${n}` : null;
}

/** `20260921` → `2026-09-21`. ⛔ 못 읽으면 지어내지 않는다 */
export function 날꼴(여덟) {
  const s = String(여덟 || '');
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : null;
}

/** 한 건을 손님 줄로. 영문명이 없으면 종목코드를 이름 자리에 둔다 */
export function 한줄(r, 날, 영문명 = new Map()) {
  if (!r?.code || !갈래[r.태그]) return null;
  const en = 영문명.get(String(r.code)) || null;
  return {
    d: 날,
    t: String(r.code),
    n: en || String(r.code),          /* ⛔ 한글 회사명을 손님 칸에 담지 않는다 */
    named: Boolean(en),               /* 영문명을 못 찾은 줄을 «세기» 위해 남긴다 */
    m: 시장[r.cls] || 'Other',
    e: r.태그,
    w: Number(r.무게) || 0,
    amended: Boolean(r.정정),
    url: 원문주소(r.rcept),
  };
}

/** 같은 접수번호가 두 날 파일에 겹쳐 들어온다 — 한 번만 센다 */
export function 겹침빼기(줄들) {
  const 본것 = new Set();
  const 것 = [];
  for (const r of 줄들 || []) {
    const 열쇠 = `${r.t}|${r.url || ''}|${r.e}`;
    if (본것.has(열쇠)) continue;
    본것.add(열쇠);
    것.push(r);
  }
  return 것;
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);
  const 보기 = { corp: '서희건설', cls: 'K', code: '035890', report: '단일판매ㆍ공급계약체결   ', rcept: '20260921900063', 태그: 'supply-contract', 무게: 8, 정정: false };

  검('날짜를 줄표 꼴로 바꾼다', 날꼴('20260921') === '2026-09-21');
  검('⛔ 여덟 자리가 아니면 null', 날꼴('2026921') === null);
  검('원문 주소를 만든다', 원문주소('20260921900063').endsWith('rcpNo=20260921900063'));
  검('⛔ 접수번호가 이상하면 주소를 안 만든다', 원문주소('abc') === null);

  const a = 한줄(보기, '2026-09-21', new Map([['035890', 'SEOHEE CONSTRUCTION']]));
  검('한 줄로 옮긴다', a.t === '035890' && a.e === 'supply-contract');
  검('코스닥을 KOSDAQ 으로 적는다', a.m === 'KOSDAQ');
  검('영문명을 이어 붙인다', a.n === 'SEOHEE CONSTRUCTION' && a.named === true);
  검('⛔ 손님 줄에 한글 회사명이 없다', !/[가-힣]/.test(JSON.stringify(a)));
  검('⛔ 공시 원제목(한글)을 담지 않는다', !JSON.stringify(a).includes('단일판매'));

  const b = 한줄(보기, '2026-09-21', new Map());
  검('영문명이 없으면 종목코드를 쓴다', b.n === '035890' && b.named === false);
  검('⛔ 영문명을 지어내지 않는다', b.n !== 'Seohee Construction');

  검('모르는 갈래는 줄을 안 만든다', 한줄({ ...보기, 태그: '없는갈래' }, '2026-09-21') === null);
  검('종목코드가 없으면 줄을 안 만든다', 한줄({ ...보기, code: '' }, '2026-09-21') === null);

  검('같은 공시를 두 번 세지 않는다', 겹침빼기([a, { ...a }]).length === 1);
  검('다른 공시는 둘 다 남는다', 겹침빼기([a, { ...a, e: 'buyback' }]).length === 2);

  검('갈래가 열아홉이다', Object.keys(갈래).length === 19);
  검('⛔ 갈래 이름·설명에 한국어가 없다', !/[가-힣]/.test(Object.values(갈래).map((v) => v.en + v.뜻).join('')));
  검('지배권 변경 갈래가 있다 — 사장님이 못박으신 둘 가운데 하나',
    Boolean(갈래['control-change']));
  검('대표이사 변경 갈래가 있다 — 나머지 하나', Boolean(갈래['ceo-change']));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 짓는다 ──────────────────────────────────────────────── */
if (내가진입점 && !process.argv.includes('--자가시험')) {
  const 영문명 = new Map();
  try {
    const 탭 = JSON.parse(fs.readFileSync(한국탭, 'utf8'));
    for (const r of 탭.rows || 탭) if (r.code && r.name_en) 영문명.set(String(r.code), r.name_en);
  } catch { console.log('⚠ 한국 재무 탭을 못 읽었다 — 영문명 없이 짓는다'); }

  const 파일들 = fs.existsSync(곳간) ? fs.readdirSync(곳간).filter((f) => /^\d{8}\.json$/.test(f)).sort() : [];
  if (!파일들.length) { console.error('🔴 곳간이 비었다 — archive/raw/dart-breaking'); process.exit(1); }

  let 줄들 = [];
  /* 🔴 [2026-09-22] **뺀 줄을 세어 함께 낸다.** 원자료 862건 가운데 46건은 종목코드가 없다
     (비상장 제출인·자회사 몫). 줄로 세울 수 없어 빼지만, «몇 건을 뺐는지»를 안 적으면
     지면이 862 를 816 으로 조용히 줄여 말하는 것이 된다 — 강령 ③ 「못 잰 것은 못 쟀다고 적는다」. */
  let 원자료건수 = 0;
  let 코드없어뺀줄 = 0;
  for (const f of 파일들) {
    const j = JSON.parse(fs.readFileSync(path.join(곳간, f), 'utf8'));
    const 날 = 날꼴(j.날짜 ?? f.slice(0, 8));
    for (const r of j.후보 || []) {
      원자료건수++;
      const 줄 = 한줄(r, 날, 영문명);
      if (줄) 줄들.push(줄);
      else if (!r?.code) 코드없어뺀줄++;
    }
  }
  줄들 = 겹침빼기(줄들).sort((a, b) => (b.d || '').localeCompare(a.d || '') || b.w - a.w);

  /* 🔴 관문 — 손님 화면에 나가는 파일에 한국어가 «한 글자라도» 있으면 멈춘다 */
  if (/[가-힣]/.test(JSON.stringify(줄들))) {
    console.error('🔴 손님 파일에 한국어가 있다 — 안 낸다'); process.exit(1);
  }

  const 갈래별 = {};
  for (const r of 줄들) 갈래별[r.e] = (갈래별[r.e] || 0) + 1;
  const 이름없음 = 줄들.filter((r) => !r.named).length;

  const 낼것 = {
    무엇: 'Material disclosures filed by listed Korean companies, selected the way a US Form 8-K is: only events that move a decision.',
    출처: 'Financial Supervisory Service DART (dart.fss.or.kr)',
    만든날: 날꼴(파일들[파일들.length - 1].slice(0, 8)),
    처음날: 날꼴(파일들[0].slice(0, 8)),
    건수: 줄들.length,
    원자료건수,
    코드없어뺀줄,
    갈래: Object.fromEntries(Object.entries(갈래).map(([k, v]) => [k, { ...v, n: 갈래별[k] || 0 }])),
    영문명없는줄: 이름없음,
    rows: 줄들,
  };
  fs.writeFileSync(나갈곳, JSON.stringify(낼것), 'utf8');
  console.log(`■ 한국 중대공시 — ${줄들.length}건 · ${낼것.처음날} ~ ${낼것.만든날} · 갈래 ${Object.keys(갈래별).length}`);
  console.log(`   원자료 ${원자료건수}건 → 줄 ${줄들.length}건 · 종목코드가 없어 뺀 것 ${코드없어뺀줄}건(비상장 제출인·자회사 몫)`);
  console.log(`   영문명을 못 찾은 줄 ${이름없음}건 — ⛔ 지어내지 않고 종목코드를 그대로 뒀다`);
  console.log(`   → ${path.relative(뿌리, 나갈곳)}`);
}
