/**
 * collect-100y-nursery-none.mjs — **어린이집이 하나도 없는 지역**, 시·도별 3개 해
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 🔴 사장님 8/9 「왜 자꾸 대입에 머물러있니? 영 세에서 백 세까지 그걸 다 컨텐츠를,
 *   DB를 갖고 오라고, 데이터를 가공하라고」 · 8/21 「대입에 몰입하지마, 한 점에 불과해」
 *
 * 8/21 00:14 에 라이브 사이트맵을 열어 재 보니 4,773장 중 **대입이 아닌 것이 24장(0.5%)**이었다.
 * 8/15 에 99.1% 였던 것이 99.5% 로 더 나빠졌다. 경고를 받고도 대입 위에 더 얹고 있었다.
 *
 * ⛔ 되새김 문서가 못박아 둔 것 — 「«우리가 만들 수 있는 것»에서 새것을 찾지 않는다.
 *   그게 오늘까지 한 방식이고 천장이 나왔다」. 그래서 있는 자료를 늘리지 않고
 *   **0~5세 자리의 자료를 새로 가져온다.**
 *
 * ── ⚠ 이 자료가 못 가르는 것 — 이것이 제일 중요하다 ─────────────
 * · 단위가 「개소」이고 뜻은 **어린이집이 한 곳도 없는 «지역»의 수**다. 아이 수가 아니다
 * · ⛔ **분모가 이 표에 없다.** 그 시·도에 읍면동이 몇인지 여기서는 못 센다.
 *   그러니 「몇 %가 없다」를 이 자료만으로 쓰면 **거짓**이다. 곳수로만 적는다
 * · 지역이 넓다고 아이가 멀리 간다는 뜻도 아니다 — 그 지역에 아이가 없을 수도 있다.
 *   ⇒ 「이곳 아이들이 못 간다」가 아니라 **「이 지역에는 어린이집이 없다」**까지만 쓴다
 *
 * 쓰는 법  node scripts/collect-100y-nursery-none.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '112';
export const TBL = 'DT_15407_NN011';
export const 해수 = 20;   // 🔴 표에 2009~2025 가 다 있는데 처음엔 세 해만 받았다(8/21 02:1x). 있는 것을 다 받는다
export const 전국말 = '전국';   // ⛔ 전국은 시·도가 아니다. 같은 칸에 놓으면 두 번 센다

/** ⛔ 빈칸을 0 으로 만들지 않는다. 「없다」와 「못 받았다」는 다르다 */
export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 시·도 줄만 남긴다 — 전국은 따로 뺀다 */
export function 시도만(줄들) {
  return 줄들.filter((r) => r.시도 !== 전국말);
}

/** 합이 맞나 — 시·도를 더하면 전국이 되어야 한다. 안 맞으면 그대로 적는다(고치지 않는다) */
export function 대조(줄들, 전국값) {
  const 합 = 시도만(줄들).reduce((s, r) => s + (r.곳 ?? 0), 0);
  return { 시도합: 합, 전국: 전국값, 맞나: 합 === 전국값, 차이: 전국값 == null ? null : 합 - 전국값 };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null && 수로(undefined) === null);
  본다('② 쉼표 든 수를 읽는다', 수로('1,234') === 1234);
  본다('③ 전국을 시·도에서 뺀다',
    시도만([{ 시도: '전국', 곳: 9 }, { 시도: '서울특별시', 곳: 3 }]).length === 1);
  const d = 대조([{ 시도: '전국', 곳: 10 }, { 시도: '서울특별시', 곳: 3 }, { 시도: '부산광역시', 곳: 7 }], 10);
  본다('④ 시·도 합과 전국을 견준다', d.시도합 === 10 && d.맞나 === true);
  const d2 = 대조([{ 시도: '서울특별시', 곳: 3 }], 10);
  본다('⑤ 안 맞으면 안 맞다고 낸다 — 고치지 않는다', d2.맞나 === false && d2.차이 === -7);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-nursery-none.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
    + `&itmId=Y&objL1=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=Y&newEstPrdCnt=${해수}`;
  const 날 = await (await fetch(u)).json();
  if (!Array.isArray(날)) { console.log('🔴 못 받았다 —', JSON.stringify(날).slice(0, 200)); process.exit(1); }

  const 해들 = [...new Set(날.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];
  const 해별 = {};
  for (const 해 of 해들) {
    const 줄 = 날.filter((x) => x.PRD_DE === 해).map((x) => ({ 시도: x.C1_NM, 곳: 수로(x.DT) }));
    const 전국 = 줄.find((r) => r.시도 === 전국말)?.곳 ?? null;
    해별[해] = { 전국, 시도: 시도만(줄).sort((a, b) => (b.곳 ?? 0) - (a.곳 ?? 0)), 대조: 대조(줄, 전국) };
  }

  const 낸다 = {
    무엇: '어린이집이 한 곳도 없는 지역의 수 — 시·도별',
    만든날: new Date().toISOString().slice(0, 10),
    출처: { 기관: '보건복지부', 표: '어린이집 미설치 지역', 창구: '국가데이터처 KOSIS', orgId: ORG, tblId: TBL },
    단위: 날[0].UNIT_NM,
    정의: '어린이집이 한 곳도 설치되어 있지 않은 지역의 «수»입니다. 아이의 수가 아닙니다.',
    '⛔ 단위를 모른다': 'KOSIS 가 여기서 말하는 «지역»이 읍·면·동인지 무엇인지 표에 밝혀 놓지 않았습니다. 저희도 모릅니다 — 그래서 다른 표의 지역 수와 견주지 않습니다.',
    '⚠ 이 자료가 못 가르는 것': [
      '분모가 이 표에 없습니다 — 그 시·도에 지역이 모두 몇인지 여기서는 못 셉니다. 그래서 「몇 %가 없다」를 쓰지 않습니다.',
      '지역이 없다고 그곳 아이가 멀리 다닌다는 뜻이 아닙니다. 그 지역에 아이가 없을 수도 있습니다.',
      '어린이집만입니다. 유치원은 따로 모아 /kindergarten 에 두었습니다 — 다만 그 표는 «시설»의 수라 이 «지역»의 수와 더할 수 없습니다.',
    ],
    해들, 최신, 해별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/nursery-none.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  const m = 해별[최신];
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${최신}년 전국 ${m.전국}곳 · 시·도 ${m.시도.length}칸`);
  console.log(`   대조: 시·도 합 ${m.대조.시도합} vs 전국 ${m.대조.전국} — ${m.대조.맞나 ? '맞다' : '🔴 안 맞다(차이 ' + m.대조.차이 + ')'}`);
  console.log(`   해: ${해들.join(' · ')}`);
}
