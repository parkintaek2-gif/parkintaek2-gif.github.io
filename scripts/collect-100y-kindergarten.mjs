/**
 * collect-100y-kindergarten.mjs — **유치원 수와 원아수**, 행정구역별(시·군·구까지)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * /nursery 지면이 스스로 「유치원은 이 표에 없습니다」라고 한계를 적어 두었다.
 * 적어 둔 한계를 닫는 것이 다음 일이다. ⛔ 새 물음을 벌이기 전에 내가 적은 것부터 닫는다.
 *
 * 🔴 사장님 8/21 「대입에 몰입하지마, 한 점에 불과해」 · 8/9 「영 세에서 백 세까지」.
 *   이 자료는 **0~5세** 자리다. 그리고 시·군·구까지 있어 **「우리 동네」로 답할 수 있다.**
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · 유치원과 어린이집은 **다른 것**이다. 유치원은 학교(교육부), 어린이집은 보육시설(복지부)이다
 *   ⛔ 두 수를 더하지 않는다. 「우리 동네 아이 갈 곳 = 유치원 + 어린이집」이라고 쓰지 않는다
 * · /nursery 의 634 는 **«지역»의 수**이고 여기 8,140 은 **«시설»의 수**다.
 *   세는 대상이 달라 견줄 수 없다. 그 말을 자료에 박는다
 * · 원아수를 유치원 수로 나눈 값은 **「한 유치원에 몇 명」**이지 반 크기가 아니다
 *
 * 쓰는 법  node scripts/collect-100y-kindergarten.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const 표들 = { 곳: 'DT_1YL21201', 원아: 'DT_1YL21211' };
export const 전국말 = '전국';

/** ⛔ 빈칸을 0 으로 만들지 않는다 */
export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 시·도인가 — 열일곱 개의 이름으로 가른다. ⛔ 이름 길이로 짐작하지 않는다 */
export const 시도이름 = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'];
export const 시도인가 = (이름) => 시도이름.includes(이름);

/** 한 유치원에 아이가 몇인가 — ⛔ 반 크기가 아니다. 둘 다 있을 때만 낸다 */
export function 한곳당(원아, 곳) {
  if (원아 == null || !곳) return null;
  return Math.round((원아 / 곳) * 10) / 10;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 쉼표 든 수를 읽는다', 수로('8,140') === 8140);
  본다('③ 시·도 열일곱을 안다', 시도이름.length === 17 && 시도인가('경기도') && !시도인가('종로구'));
  본다('④ 전국은 시·도가 아니다', !시도인가(전국말));
  본다('⑤ 한 곳당은 둘 다 있을 때만 낸다', 한곳당(100, 4) === 25 && 한곳당(null, 4) === null && 한곳당(100, 0) === null);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-kindergarten.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const 받기 = async (tbl) => {
    const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
      + `&itmId=T10&objL1=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${tbl}&prdSe=Y&newEstPrdCnt=1`;
    const j = await (await fetch(u)).json();
    if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 150));
    return j;
  };
  const 곳날 = await 받기(표들.곳);
  const 원아날 = await 받기(표들.원아);
  const 해 = 곳날[0].PRD_DE;
  if (원아날[0].PRD_DE !== 해) console.log('⚠ 두 표의 해가 다르다 —', 해, 'vs', 원아날[0].PRD_DE);

  const 원아맵 = new Map(원아날.map((x) => [x.C1_NM, 수로(x.DT)]));
  const 모두 = 곳날.map((x) => ({
    이름: x.C1_NM, 곳: 수로(x.DT), 원아: 원아맵.get(x.C1_NM) ?? null,
  })).map((r) => ({ ...r, 한곳당: 한곳당(r.원아, r.곳) }));

  const 전국 = 모두.find((r) => r.이름 === 전국말) ?? null;
  const 시도 = 모두.filter((r) => 시도인가(r.이름));
  const 동네 = 모두.filter((r) => r.이름 !== 전국말 && !시도인가(r.이름));

  const 낸다 = {
    무엇: '유치원 수와 원아수 — 행정구역별',
    만든날: new Date().toISOString().slice(0, 10),
    해,
    출처: { 기관: '한국교육개발원', 표: '유치원 수 · 유치원 원아수(시도/시/군/구)', 창구: '국가데이터처 KOSIS', orgId: ORG, tblId: `${표들.곳} · ${표들.원아}` },
    '⚠ 이 자료가 못 가르는 것': [
      '유치원과 어린이집은 다른 것입니다 — 유치원은 학교, 어린이집은 보육시설입니다. 두 수를 더하지 않습니다.',
      '/nursery 의 634 는 «지역»의 수이고 여기 수는 «시설»의 수입니다. 세는 대상이 달라 견줄 수 없습니다.',
      '「한 유치원에 몇 명」은 반 크기가 아닙니다. 그 지역 원아를 그 지역 유치원 수로 나눈 값입니다.',
      '사립·공립을 가르지 않았습니다. 이 표에 그 칸이 없습니다.',
    ],
    전국, 시도, 동네수: 동네.length, 동네,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/kindergarten.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  const 합 = 시도.reduce((s, r) => s + (r.곳 ?? 0), 0);
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${해}년 · 전국 ${전국.곳}곳 · 원아 ${전국.원아?.toLocaleString()}명`);
  console.log(`   시·도 ${시도.length}칸(합 ${합}) · 시·군·구 ${동네.length}칸`);
  console.log(`   대조: 시·도 합 ${합} vs 전국 ${전국.곳} — ${합 === 전국.곳 ? '맞다' : '🔴 안 맞다(차이 ' + (합 - 전국.곳) + ')'}`);
}
