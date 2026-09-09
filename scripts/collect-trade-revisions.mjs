#!/usr/bin/env node
/**
 * collect-trade-revisions.mjs — **한국 무역속보가 얼마나 고쳐지는가**를 쌓는다.
 *
 *   node scripts/collect-trade-revisions.mjs             스냅숏 받고 대장 갱신
 *   node scripts/collect-trade-revisions.mjs --자가시험    자가시험만
 *   node scripts/collect-trade-revisions.mjs --안받는다     받지 않고 있는 스냅숏만 대 본다
 *
 * ── 🔴 왜 만드나 ─────────────────────────────────────────────────────────
 *
 * 사장님(2026-09-09): 「관세청 데이터가 6번이 아주 좋은 데이터라고 하였으니
 *   이 데이터를 활용하는 방법을 6번에게 들어봐」
 * 6번의 답 셋 가운데 셋째 —
 *   「**잠정치→확정치 개정폭 자체를 상품화.** 관세청 10일 잠정치가 확정치로 얼마나
 *    바뀌는지는 아무도 안 세는 것으로 보입니다. 컨센서스테이프(목표주가 개정이력)와
 *    같은 발상 — 「한국 무역속보가 얼마나 못 미더운가」를 재는 자료」
 *
 * ⭐ 셋 중 이것이 제일 세다 — «남이 안 세는 것»이고, 사장님이 정하신 주력
 *   (영어판 FnGuide)의 «거시» 칸에 그대로 들어간다.
 *
 * ── 🔴 오늘부터 쌓지 않으면 영영 못 만든다 ────────────────────────────────
 *
 * KOSIS 는 표를 «제자리에서» 고친다. 그래서 지금까지 우리가 받아 온 방식은
 * `archive/raw/kosis/DT_1R11006_FRM101.json` 한 파일을 **덮어쓰는** 것이었다 —
 * 어제 값이 무엇이었는지 아무 데도 안 남는다.
 *   ⇒ 한경컨센서스 30일 창과 똑같은 병이다. 소급이 «안 된다».
 *   ⇒ 그래서 날짜 붙은 스냅숏으로 바꾼다: archive/raw/trade-snapshots/<날>.json
 *
 * ⚠ [2026-09-09 재서 물린 것] 원자료에 `LST_CHN_DE`(마지막으로 바뀐 날) 칸이 있어서
 *   처음엔 「개정 시점은 스냅숏 한 벌로도 잴 수 있다」고 적었다. **과한 말이었다.**
 *   재 보니 5,260줄에 값이 «두 가지»뿐이다 — 2026-02-19(2,195줄) · 2026-08-18(3,065줄).
 *   ⇒ 이 칸은 «줄마다»가 아니라 «표 덩어리» 단위다. 어느 수가 언제 고쳐졌는지는 말해 주지 않는다.
 *   ⇒ **개정은 스냅숏으로만 잴 수 있다.** 그래서 매일 쌓는 것이 더 중요해졌다.
 *   ⛔ 칸이 있다고 그 칸이 내가 바라는 뜻인 줄 알지 않는다. 값을 세 보고 나서 말한다.
 *
 * ── 라이선스 ─────────────────────────────────────────────────────────────
 * KOSIS 통계정보 활용약관 제8조 상업활용 가능 · 제7조 출처표시.
 *   화면에 「출처: 국가데이터처 KOSIS · 관세청 국가별 수출입액(DT_1R11006_FRM101)」를 박는다.
 *   ⛔ raw 를 그대로 제3자에 유료 제공하는 것만 금지(제5조). 우리가 «가공해» 파는 것은 된다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 스냅방 = 'archive/raw/trade-snapshots';
export const 대장길 = 'src/data/trade-revisions.json';
const 표 = { org: '360', id: 'DT_1R11006_FRM101', prdSe: 'M' };

/**
 * 스냅숏에서 «줄들»을 꺼낸다.
 *
 * 🔴 [2026-09-09] 이 함수가 없어서 첫 실행이 죽었다 — 자가시험 35가지가 다 지났는데도.
 *   까닭: 옛 스냅숏은 KOSIS 응답을 그대로 둔 «배열»이 아니라 수집기가 감싼
 *   `{ 표, 출처, 기간, rows: [...] }` 객체였다.
 *   ⇒ **순수함수 시험만으로는 실제 실행 경로가 안 밟힌다.** 앞서 같은 무늬로 한 번 죽었다.
 *     그래서 껍데기 벗기는 일도 «함수로 빼고 시험을 붙인다».
 */
export function 줄들뽑기(것) {
  if (Array.isArray(것)) return 것;
  if (!것 || typeof 것 !== 'object') return [];
  if (Array.isArray(것.rows)) return 것.rows;
  /* 이름이 다를 수 있으니 «줄처럼 생긴» 배열을 고른다 — 가장 긴 것이 아니라 «줄 꼴»로 판정 */
  for (const v of Object.values(것)) {
    if (Array.isArray(v) && v.length && v[0] && typeof v[0] === 'object'
        && ('DT' in v[0]) && ('PRD_DE' in v[0])) return v;
  }
  return [];
}

/* ── 줄을 열쇠로 ─────────────────────────────────────────────────────── */
/**
 * 한 줄의 열쇠 — (나라, 기간, 항목). 이름이 아니라 «코드»로 만든다.
 * ⛔ 이름으로 만들면 안 된다 — KOSIS 가 나라 이름 표기를 고치면 같은 나라가 둘로 갈린다.
 */
export function 열쇠(줄) {
  if (!줄 || typeof 줄 !== 'object') return null;
  const c = String(줄.C1 ?? '').trim();
  const p = String(줄.PRD_DE ?? '').trim();
  const i = String(줄.ITM_ID ?? '').trim();
  if (!c || !p || !i) return null;
  return `${c}|${p}|${i}`;
}

/** 값 — 빈칸을 0 으로 만들지 않는다. 이 저장소의 대표 함정이다 */
export function 값(줄) {
  const v = 줄?.DT;
  if (v === null || v === undefined || v === '' || v === '-') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** 줄들을 열쇠→{값, 이름, 기간, 항목, 바뀐날} 로 */
export function 지도만들기(줄들) {
  const m = new Map();
  for (const r of 줄들 ?? []) {
    const k = 열쇠(r);
    if (!k) continue;
    m.set(k, {
      값: 값(r),
      나라: String(r.C1_NM_ENG ?? r.C1_NM ?? '').trim(),
      기간: String(r.PRD_DE ?? '').trim(),
      항목: String(r.ITM_NM_ENG ?? r.ITM_NM ?? '').trim(),
      바뀐날: String(r.LST_CHN_DE ?? '').trim() || null,
    });
  }
  return m;
}

/* ── 두 스냅숏을 댄다 ────────────────────────────────────────────────── */
/**
 * 앞 스냅숏과 뒤 스냅숏을 대어 «고쳐진 것»을 낸다.
 *
 * ⛔ 「없어진 것」과 「0 이 된 것」을 가른다. 창이 굴러가서 빠진 달은 «개정»이 아니다.
 * ⛔ 새로 들어온 달도 개정이 아니다 — 처음 나온 수다.
 * @returns {{고쳐짐:object[], 새로들어옴:number, 빠짐:number, 그대로:number, 못잰것:number}}
 */
export function 대보기(앞줄들, 뒤줄들) {
  const 앞 = 지도만들기(앞줄들);
  const 뒤 = 지도만들기(뒤줄들);
  const 고쳐짐 = [];
  let 새로들어옴 = 0; let 그대로 = 0; let 못잰것 = 0;
  for (const [k, b] of 뒤) {
    const a = 앞.get(k);
    if (!a) { 새로들어옴 += 1; continue; }          /* 처음 나온 수 — 개정이 아니다 */
    if (a.값 === null || b.값 === null) { 못잰것 += 1; continue; }
    if (a.값 === b.값) { 그대로 += 1; continue; }
    const 차 = b.값 - a.값;
    고쳐짐.push({
      열쇠: k,
      나라: b.나라,
      기간: b.기간,
      항목: b.항목,
      앞값: a.값,
      뒤값: b.값,
      차,
      /* 비율은 앞값이 0 이면 못 낸다 — 무한대를 지어내지 않는다 */
      비율퍼센트: a.값 === 0 ? null : Number(((차 / a.값) * 100).toFixed(3)),
      바뀐날: b.바뀐날,
    });
  }
  let 빠짐 = 0;
  for (const k of 앞.keys()) if (!뒤.has(k)) 빠짐 += 1;
  return { 고쳐짐, 새로들어옴, 빠짐, 그대로, 못잰것 };
}

/** 개정을 «기간별»로 접는다 — 어느 달이 많이 고쳐지나 */
export function 기간별로접기(고쳐짐) {
  const m = new Map();
  for (const r of 고쳐짐 ?? []) {
    if (!m.has(r.기간)) m.set(r.기간, { 기간: r.기간, 건수: 0, 절대비율합: 0, 가장큰: null });
    const e = m.get(r.기간);
    e.건수 += 1;
    if (r.비율퍼센트 !== null) e.절대비율합 += Math.abs(r.비율퍼센트);
    if (!e.가장큰 || Math.abs(r.차) > Math.abs(e.가장큰.차)) e.가장큰 = r;
  }
  return [...m.values()]
    .map((e) => ({ ...e, 평균절대비율: e.건수 ? Number((e.절대비율합 / e.건수).toFixed(3)) : null }))
    .sort((a, b) => String(a.기간).localeCompare(String(b.기간)));
}

/**
 * 스냅숏 «한 벌»로도 잴 수 있는 것 — LST_CHN_DE 분포.
 * ⭐ 이 칸이 원자료에 있어서, 스냅숏이 하나뿐인 오늘도 「언제 고쳐졌나」는 낼 수 있다.
 */
export function 바뀐날분포(줄들) {
  const m = new Map();
  let 없음 = 0;
  for (const r of 줄들 ?? []) {
    const d = String(r?.LST_CHN_DE ?? '').trim();
    if (!d) { 없음 += 1; continue; }
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return {
    날별: [...m.entries()].map(([날, 수]) => ({ 날, 수 })).sort((a, b) => a.날.localeCompare(b.날)),
    날없음: 없음,
  };
}

/** 파일 이름에서 날짜 — 이름이 규칙을 말한다 */
export function 스냅날(이름) {
  const m = String(이름 ?? '').match(/^(\d{4}-\d{2}-\d{2})\.json$/);
  return m ? m[1] : null;
}

export function 스냅목록(방, 폴더읽기 = fs.readdirSync) {
  let 것;
  try { 것 = 폴더읽기(방); } catch { return []; }
  return 것.map(스냅날).filter(Boolean).sort();
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const 줄 = (c, p, i, dt, 날 = '2026-02-19') => ({
    C1: c, PRD_DE: p, ITM_ID: i, DT: dt, LST_CHN_DE: 날,
    C1_NM_ENG: 'X', ITM_NM_ENG: 'The amount of export',
  });

  재다('줄들뽑기: 배열은 그대로', 줄들뽑기([1, 2]).length === 2);
  재다('🔴 줄들뽑기: 수집기가 감싼 { rows } 를 벗긴다 — 이걸 안 해서 첫 실행이 죽었다',
    줄들뽑기({ 표: 'x', rows: [{ DT: '1', PRD_DE: 'p' }] }).length === 1);
  재다('줄들뽑기: 이름이 달라도 «줄 꼴»로 찾는다',
    줄들뽑기({ 아무거나: [{ DT: '1', PRD_DE: 'p' }] }).length === 1);
  재다('⛔ 줄들뽑기: 줄 꼴이 아닌 배열은 «고르지 않는다» (긴 것을 집지 않는다)',
    줄들뽑기({ 통계설명: [{ 뜻: 'a' }, { 뜻: 'b' }, { 뜻: 'c' }] }).length === 0);
  재다('줄들뽑기: null 도 안 죽는다', 줄들뽑기(null).length === 0);
  재다('줄들뽑기: 글자도 안 죽는다', 줄들뽑기('x').length === 0);

  재다('열쇠: 셋을 잇는다', 열쇠(줄('a', '202508', 'i1', '1')) === 'a|202508|i1');
  재다('⛔ 열쇠: 나라 «이름»을 안 쓴다 — 표기가 바뀌면 같은 나라가 둘로 갈린다',
    열쇠({ ...줄('a', '202508', 'i1', '1'), C1_NM_ENG: '다른이름' }) === 'a|202508|i1');
  재다('열쇠: 칸이 비면 null', 열쇠(줄('', '202508', 'i1', '1')) === null);
  재다('열쇠: null 도 안 죽는다', 열쇠(null) === null);

  재다('값: 수를 읽는다', 값(줄('a', 'p', 'i', '123')) === 123);
  재다('⛔ 값: 빈칸을 0 으로 만들지 않는다', 값(줄('a', 'p', 'i', '')) === null);
  재다('⛔ 값: 「-」도 null 이다', 값(줄('a', 'p', 'i', '-')) === null);
  재다('⛔ 값: 글자는 null 이다', 값(줄('a', 'p', 'i', '없음')) === null);
  재다('값: 0 은 0 이다 (null 이 아니다)', 값(줄('a', 'p', 'i', '0')) === 0);

  const 앞 = [줄('a', '202508', 'i1', '100'), 줄('b', '202508', 'i1', '200'), 줄('c', '202507', 'i1', '50')];
  const 뒤 = [줄('a', '202508', 'i1', '110'), 줄('b', '202508', 'i1', '200'), 줄('d', '202509', 'i1', '9')];
  const r = 대보기(앞, 뒤);
  재다('대보기: 고쳐진 것 하나', r.고쳐짐.length === 1 && r.고쳐짐[0].차 === 10);
  재다('대보기: 비율을 낸다', r.고쳐짐[0].비율퍼센트 === 10);
  재다('대보기: 그대로인 것을 센다', r.그대로 === 1);
  재다('⛔ 대보기: 새로 들어온 달은 «개정이 아니다»', r.새로들어옴 === 1);
  재다('⛔ 대보기: 창이 굴러가 빠진 달도 «개정이 아니다»', r.빠짐 === 1);
  재다('⛔ 대보기: 한쪽이 null 이면 개정으로 세지 않고 «못 잰 것»으로 센다', (() => {
    const x = 대보기([줄('a', 'p', 'i', '100')], [줄('a', 'p', 'i', '')]);
    return x.고쳐짐.length === 0 && x.못잰것 === 1;
  })());
  재다('⛔ 대보기: 앞값이 0 이면 비율을 «지어내지 않는다» (무한대 금지)', (() => {
    const x = 대보기([줄('a', 'p', 'i', '0')], [줄('a', 'p', 'i', '5')]);
    return x.고쳐짐[0].비율퍼센트 === null && x.고쳐짐[0].차 === 5;
  })());
  재다('대보기: 빈 것도 안 죽는다', 대보기([], []).고쳐짐.length === 0);
  재다('대보기: null 도 안 죽는다', 대보기(null, null).고쳐짐.length === 0);
  재다('대보기: 내린 것도 잡는다 (음수)', (() => {
    const x = 대보기([줄('a', 'p', 'i', '100')], [줄('a', 'p', 'i', '90')]);
    return x.고쳐짐[0].차 === -10 && x.고쳐짐[0].비율퍼센트 === -10;
  })());

  const 접힘 = 기간별로접기([
    { 기간: '202508', 차: 10, 비율퍼센트: 10 },
    { 기간: '202508', 차: -30, 비율퍼센트: -5 },
    { 기간: '202507', 차: 1, 비율퍼센트: 1 },
  ]);
  재다('기간별: 달 수', 접힘.length === 2);
  재다('기간별: 오래된 달이 먼저', 접힘[0].기간 === '202507');
  재다('기간별: 건수를 센다', 접힘.find((x) => x.기간 === '202508').건수 === 2);
  재다('기간별: 평균은 «절대값»으로 낸다 — 오르내림이 서로 지워지지 않게',
    접힘.find((x) => x.기간 === '202508').평균절대비율 === 7.5);
  재다('기간별: 가장 큰 것은 «차의 절대값»으로 고른다',
    접힘.find((x) => x.기간 === '202508').가장큰.차 === -30);
  재다('기간별: 빈 것도 안 죽는다', 기간별로접기([]).length === 0);
  재다('기간별: null 도 안 죽는다', 기간별로접기(null).length === 0);

  const 분포 = 바뀐날분포([줄('a', 'p', 'i', '1', '2026-02-19'), 줄('b', 'p', 'i', '1', '2026-02-19'),
    줄('c', 'p', 'i', '1', '2026-08-01'), { DT: '1' }]);
  재다('바뀐날: 날별로 센다', 분포.날별.find((x) => x.날 === '2026-02-19').수 === 2);
  재다('바뀐날: 오래된 날이 먼저', 분포.날별[0].날 === '2026-02-19');
  재다('⛔ 바뀐날: 날이 없는 줄을 «따로» 센다 (0 으로 섞지 않는다)', 분포.날없음 === 1);
  재다('바뀐날: null 도 안 죽는다', 바뀐날분포(null).날별.length === 0);

  재다('스냅날: 이름에서 날을 읽는다', 스냅날('2026-09-09.json') === '2026-09-09');
  재다('⛔ 스냅날: 다른 이름은 null (섞이지 않게)', 스냅날('DT_1R11006.json') === null);
  재다('스냅날: null 도 안 죽는다', 스냅날(null) === null);
  재다('스냅목록: 날짜만 골라 차례로', (() => {
    const l = 스냅목록('x', () => ['2026-09-09.json', '아무거나.txt', '2026-09-07.json']);
    return l.length === 2 && l[0] === '2026-09-07';
  })());
  재다('스냅목록: 폴더가 없으면 빈 배열', 스냅목록('없는곳', () => { throw new Error('없다'); }).length === 0);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`\n■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

if (!자가시험()) process.exit(1);
if (process.argv.includes('--자가시험')) process.exit(0);

const 방 = path.join(뿌리, 스냅방);
fs.mkdirSync(방, { recursive: true });

const 오늘 = (() => {
  const d = new Date();      /* ⚠ 이 PC 가 이미 KST 다 — toISOString 을 쓰지 않는다 */
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

/* 1. 오늘 스냅숏 — 받는다 */
if (!process.argv.includes('--안받는다')) {
  /* .env 의 KOSIS_API_KEY — collect-kosis-seoulmarkets.mjs 가 쓰는 것과 같은 이름이다.
   * ⛔ 열쇠 값을 찍지 않는다. 있나 없나만 본다. */
  let 키 = process.env.KOSIS_API_KEY || process.env.KOSIS_KEY || null;
  if (!키) {
    try {
      const e = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
      키 = (e.match(/^KOSIS_API_KEY=(.+)$/m) || [])[1]?.trim() || null;
    } catch { /* 없으면 못 받는다 */ }
  }
  if (!키) {
    console.log('\n⚠ KOSIS 열쇠가 없다(.env 의 KOSIS_API_KEY) — 오늘 스냅숏을 «못 받았다».');
    console.log('  ⛔ 「받았다」로 적지 않는다. 있는 스냅숏만 대 본다.');
  } else {
    const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do'
      + `?method=getList&apiKey=${키}&itmId=ALL&objL1=ALL&format=json&jsonVD=Y`
      + `&prdSe=${표.prdSe}&newEstPrdCnt=12&orgId=${표.org}&tblId=${표.id}`;
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      const j = JSON.parse(t);
      if (!Array.isArray(j)) throw new Error('배열이 아니다: ' + t.slice(0, 160));
      fs.writeFileSync(path.join(방, `${오늘}.json`), JSON.stringify(j), 'utf8');
      console.log(`\n✅ 오늘 스냅숏 — ${오늘}.json · ${j.length.toLocaleString()}줄`);
    } catch (e) {
      console.log(`\n🔴 오늘 스냅숏을 못 받았다 — ${e.message}`);
      console.log('  ⛔ 「받았다」로 적지 않는다. 다음 실행에서 다시 받는다.');
    }
  }
}

/* 2. 옛 판을 스냅숏으로 «옮겨 심는다» — 덮어써지던 파일이 한 벌 남아 있다 */
const 옛길 = path.join(뿌리, 'archive/raw/kosis/DT_1R11006_FRM101.json');
if (fs.existsSync(옛길)) {
  const st = fs.statSync(옛길);
  const d = st.mtime;
  const 옛날 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const 심을길 = path.join(방, `${옛날}.json`);
  if (!fs.existsSync(심을길)) {
    fs.copyFileSync(옛길, 심을길);
    console.log(`⭐ 옛 판을 스냅숏으로 옮겨 심었다 — ${옛날}.json (파일 시각으로 날을 정했다)`);
    console.log('   ⚠ 이 날은 «받은 날»이지 KOSIS 가 고친 날이 아니다. 줄의 LST_CHN_DE 가 그것을 말한다.');
  }
}

/* 3. 대장 */
const 날들 = 스냅목록(방);
console.log(`\n■ 스냅숏 ${날들.length}벌 — ${날들.join(' · ') || '(없다)'}`);

const 읽기 = (날) => 줄들뽑기(JSON.parse(fs.readFileSync(path.join(방, `${날}.json`), 'utf8')));

if (날들.length === 0) {
  console.log('\n🔴 스냅숏이 없다 — 대장을 만들지 않는다. 지어내지 않는다.');
  process.exit(1);
}

const 마지막 = 읽기(날들[날들.length - 1]);
const 분포 = 바뀐날분포(마지막);

let 대장 = {
  출처: {
    org: 'Korea Customs Service (via KOSIS, Statistics Korea)',
    dataset: 'Exports and imports by partner country — DT_1R11006_FRM101 (org 360)',
    licence: 'KOSIS terms art.8 commercial use permitted · art.7 attribution required',
    unit: 'thousand USD',
  },
  왜: 'Korea publishes 10-day provisional trade figures and revises them later. Nobody counts the revision. This ledger does.',
  잰때: new Date().toLocaleString('ko-KR', { hour12: false }),
  스냅숏: 날들,
  줄수: 마지막.length,
  바뀐날분포: 분포,
  개정: null,
  못잰까닭: null,
};

if (날들.length < 2) {
  대장.못잰까닭 = '스냅숏이 한 벌뿐이라 개정 «폭»을 못 잰다. 개정 «시점»은 바뀐날분포로 낸다.';
  console.log(`\n⚠ ${대장.못잰까닭}`);
} else {
  const 앞날 = 날들[날들.length - 2];
  const 뒤날 = 날들[날들.length - 1];
  const r = 대보기(읽기(앞날), 마지막);
  const 접힘 = 기간별로접기(r.고쳐짐);
  대장.개정 = {
    앞: 앞날, 뒤: 뒤날,
    고쳐진건수: r.고쳐짐.length,
    그대로: r.그대로,
    새로들어옴: r.새로들어옴,
    빠짐: r.빠짐,
    못잰것: r.못잰것,
    기간별: 접힘,
    가장큰것: [...r.고쳐짐].sort((a, b) => Math.abs(b.차) - Math.abs(a.차)).slice(0, 20),
  };
  console.log(`\n■ 개정 — ${앞날} → ${뒤날}`);
  console.log(`  고쳐짐 ${r.고쳐짐.length.toLocaleString()} · 그대로 ${r.그대로.toLocaleString()}`
    + ` · 새로들어옴 ${r.새로들어옴} · 빠짐 ${r.빠짐} · 못잰것 ${r.못잰것}`);
  for (const e of 접힘.slice(-6)) {
    console.log(`    ${e.기간}  ${String(e.건수).padStart(4)}건 · 평균 ±${e.평균절대비율}%`
      + (e.가장큰 ? `  가장 큰 것 ${e.가장큰.나라} ${e.가장큰.항목} ${e.가장큰.차.toLocaleString()}` : ''));
  }
}

fs.writeFileSync(path.join(뿌리, 대장길), JSON.stringify(대장, null, 2), 'utf8');
console.log(`\n✅ 냈다 — ${대장길}`);
console.log('⭐ 이 대장은 «쌓일수록» 값이 커진다. 하루 한 번 이 자를 돌린다.');
console.log('⛔ 이 자를 안 돌린 날의 값은 영영 없다 — KOSIS 는 표를 제자리에서 고친다.');
