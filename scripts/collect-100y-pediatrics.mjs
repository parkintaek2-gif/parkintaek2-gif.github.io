/**
 * collect-100y-pediatrics.mjs — **소아청소년과 의원이 한 곳도 없는 시·군·구**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2번 지시(8/21 04:2x) — 「어린이집·유치원·방과후로 **맡길 데**를 다뤘습니다.
 *   그다음 부모가 막히는 자리가 **아플 때 갈 데**입니다. 밤에 애가 열나면 어디로 갑니까」
 * 사장님 「0세~100세다. 키즈부터」.
 *
 * ⛔ 받기 전에 그 조사의 표를 다 열어 봤다(2번이 준 규칙) —
 * ```
 *   DT_HIRA47  표시과목별 의원 — **시·도까지만**. 「한 곳도 없는 곳」을 못 센다
 *   DT_HIRA4B  시군구별 «종별» 요양기관 — 종별(의원·병원·종합병원)은 있는데 **표시과목이 없다**
 *   DT_HIRA4F  시군구별 설립구분별 — 과목이 없다
 *   ⭐ DT_HIRA4G  시군구별 **표시과목별** 의원 — 이것이 맞는 표다(285칸 × 29과목)
 * ```
 *
 * ── ⚠ 이 자료가 못 가르는 것 — 이것이 제일 중요하다 ─────────────
 * · **「의원」만이다.** 표시과목은 의원에 붙는 개념이라 병원·종합병원의 소아청소년과는 이 표에 없다.
 *   ⛔ 그러니 「소아과가 아예 없다」로 쓰면 **거짓**이다. 「소아청소년과 «의원»이 없다」까지다
 * · 「소아청소년과를 안 걸고 아이를 보는 의원」도 있다. 표시과목은 간판이지 진료의 전부가 아니다
 * · 시·군·구에 하나 있다고 가까운 것도 아니다. 이 표는 **거리를 모른다**
 *
 * ── ⚠ 이름이 겹친다 — 여기서 틀리기 쉽다 ──────────────────────
 * 중구가 여섯, 동구가 여섯, 서구가 다섯, 남구·북구가 넷, 강서구·고성군이 둘이다.
 * ⛔ 이름만 쓰면 화면이 거짓말을 한다. **코드로 가른다** —
 *   `.00`=전체 · `.11`=서울(두 자리는 시·도) · `.110001`=강남구(앞 두 자리가 그 시·도)
 *   차례를 짐작해 위에서부터 이어 붙이지 않는다. 셈으로 딱 떨어진다.
 *
 * 쓰는 법  node scripts/collect-100y-pediatrics.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '354';
export const TBL = 'DT_HIRA4G';
export const 기간꼴 = 'Q';
export const 과목 = '소아청소년과';
export const 전체말 = '전체';

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 코드 끝의 자릿수로 무엇인지 가른다. ⛔ 이름이나 차례로 짐작하지 않는다 */
export function 무엇인가(코드) {
  const 끝 = String(코드).split('.').pop();
  if (끝 === '00') return { 갈래: '전체' };
  if (끝.length === 2) return { 갈래: '시도', 시도코드: 끝 };
  if (끝.length === 6) return { 갈래: '시군구', 시도코드: 끝.slice(0, 2) };
  return { 갈래: '모름' };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 0 은 0 으로 읽는다 — 이 지면의 알맹이가 0 이다', 수로('0') === 0);
  본다('③ 전체를 가른다', 무엇인가('X.00').갈래 === '전체');
  본다('④ 두 자리는 시·도다', 무엇인가('X.11').갈래 === '시도' && 무엇인가('X.11').시도코드 === '11');
  본다('⑤ 여섯 자리는 시·군·구이고 앞 두 자리가 그 시·도다',
    무엇인가('X.110001').갈래 === '시군구' && 무엇인가('X.110001').시도코드 === '11');
  본다('⑥ 모르는 꼴은 「모름」으로 낸다 — 0 으로 만들지 않는다', 무엇인가('X.1234').갈래 === '모름');
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-pediatrics.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  /* 이름표(코드↔이름)를 먼저 받는다 — 값 줄에는 코드가 들어 있다 */
  const 이름표 = await (await fetch(
    `https://kosis.kr/openapi/statisticsData.do?method=getMeta&apiKey=${KEY}&orgId=${ORG}&tblId=${TBL}&type=ITM&format=json&jsonVD=Y`)).json();
  const 칸들 = 이름표.filter((x) => x.OBJ_NM === '시군구별');
  const 시도이름 = new Map();
  for (const x of 칸들) {
    const w = 무엇인가(x.ITM_ID);
    if (w.갈래 === '시도') 시도이름.set(w.시도코드, x.ITM_NM);
  }

  const 날 = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=${기간꼴}&newEstPrdCnt=1`)).json();
  if (!Array.isArray(날)) { console.log('🔴 못 받았다 —', JSON.stringify(날).slice(0, 200)); process.exit(1); }

  const 때 = 날[0].PRD_DE;
  const 소아 = 날.filter((x) => x.C2_NM === 과목);
  const 전체곳 = 수로(소아.find((x) => x.C1_NM === 전체말)?.DT);

  const 시도별 = [], 동네 = [];
  let 모름 = 0;
  for (const r of 소아) {
    const w = 무엇인가(r.C1);
    const 곳 = 수로(r.DT);
    if (w.갈래 === '시도') 시도별.push({ 시도: r.C1_NM, 곳 });
    else if (w.갈래 === '시군구') 동네.push({ 시도: 시도이름.get(w.시도코드) ?? '모름', 이름: r.C1_NM, 곳 });
    else if (w.갈래 === '모름') 모름++;
  }

  /* 🔴 자가 대조 — 시·도를 더하면 전체가 되어야 한다 */
  const 시도합 = 시도별.reduce((s, r) => s + (r.곳 ?? 0), 0);
  const 동네합 = 동네.reduce((s, r) => s + (r.곳 ?? 0), 0);

  const 없는곳 = 동네.filter((r) => r.곳 === 0).sort((a, b) => a.시도.localeCompare(b.시도) || a.이름.localeCompare(b.이름));
  const 없는시도 = {};
  for (const r of 없는곳) 없는시도[r.시도] = (없는시도[r.시도] ?? 0) + 1;

  const 낸다 = {
    무엇: '소아청소년과 «의원»이 한 곳도 없는 시·군·구',
    만든날: new Date().toISOString().slice(0, 10),
    때,
    출처: { 기관: '건강보험심사평가원', 표: '시군구별 표시과목별 의원 현황', 창구: '국가데이터처 KOSIS', orgId: ORG, tblId: TBL },
    '⚠ 이 자료가 못 가르는 것': [
      '「의원」만입니다. 표시과목은 의원에 붙는 개념이라 병원·종합병원의 소아청소년과는 이 표에 없습니다 — 「소아과가 아예 없다」는 뜻이 아닙니다.',
      '소아청소년과를 간판에 걸지 않고 아이를 보는 의원도 있습니다. 표시과목은 간판이지 진료의 전부가 아닙니다.',
      '시·군·구에 한 곳 있다고 가까운 것도 아닙니다. 이 표는 거리를 모릅니다.',
      '밤에 문을 여는지는 이 표에 없습니다.',
    ],
    '⚠ 이름이 겹친다': '중구가 여섯, 동구가 여섯, 서구가 다섯입니다. 이름만으로는 어디인지 알 수 없어 시·도를 함께 적었습니다 — 코드로 갈랐습니다.',
    전체곳, 시군구수: 동네.length, 없는곳수: 없는곳.length,
    없는곳, 없는시도, 시도별,
    자가대조: {
      시도합, 전체: 전체곳, 맞나: 시도합 === 전체곳,
      동네합, 동네맞나: 동네합 === 전체곳,
      모름칸: 모름,
      뜻: '시·도를 더한 값과 시·군·구를 더한 값이 각각 전체와 같아야 한다',
    },
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/pediatrics.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${때} · 전국 ${전체곳}곳`);
  console.log(`   시·군·구 ${동네.length}칸 중 **${없는곳.length}곳**에 소아청소년과 의원이 없다`);
  console.log(`   자가 대조: 시·도 합 ${시도합} · 시군구 합 ${동네합} vs 전체 ${전체곳} — ${시도합 === 전체곳 && 동네합 === 전체곳 ? '맞다' : '🔴 안 맞다'} (모름 칸 ${모름})`);
  console.log(`   몰린 곳: ${Object.entries(없는시도).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + v).join(' · ')}`);
}
