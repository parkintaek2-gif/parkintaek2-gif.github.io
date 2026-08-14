/**
 * collect-kosis-visitors.mjs — **시·군·구별 관광지 입장객**(내국인·외국인 갈라서).
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 86편이 「무엇이 읽히나」를 쟀고, 화면에 **`readingIsNotVisiting`** 을 적어 두었다 —
 * 「읽는 것은 가는 것이 아니다」. 그 말을 **말로만** 적어 두었다.
 * ⭐ 이 자료가 그 말을 **수로 재게** 해 준다. 같은 서울 자치구를 두 자로 잰다.
 *
 * 사장님 지시: 「한국 관광객들의 국적별 통계 … 가 의미가 있을 수 있겠다」
 *   ⛔ TourAPI 가 막혔다고 접었던 물음이다. KOSIS 에 있었다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **못 받은 것을 0 으로 세지 않는다.** 값이 없으면 null 로 두고 세는 데서 뺀다.
 * ⛔ 「총계」·「특별시」 같은 **합계 줄을 자치구와 섞지 않는다.** 섞으면 서울이 자기 구를 이긴다.
 * ⚠ 이것은 **유료** 관광지 입장객이다. 무료로 가는 곳(거리·상권)은 여기 안 들어온다.
 *   강남처럼 유료 관광지가 적은 구는 낮게 나온다 — 그것은 인기가 아니라 **자의 눈**이다.
 * ⚠ 화면에 「출처: 국가데이터처 KOSIS, 유료 주요관광지점 입장객 수, 기준 <연도>」를 박는다.
 *
 * 쓰는 법
 *   node scripts/collect-kosis-visitors.mjs
 *   node scripts/collect-kosis-visitors.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '110';
export const TBL = 'DT_110001_A037';

/** ⛔ 합계 줄. 자치구와 같은 칸에 놓으면 안 된다 */
export const 합계말 = ['총계', '합계', '계', '전국', '소계'];
/** 광역 단위 — 자치구의 **부모**다. 함께 세면 두 번 센다 */
export const 광역끝 = ['특별시', '광역시', '특별자치시', '도', '특별자치도'];

export function 갈래(이름) {
  const s = String(이름 ?? '').trim();
  if (합계말.includes(s)) return '합계';
  if (광역끝.some((k) => s.endsWith(k))) return '광역';
  return '시군구';
}

/** 값을 수로. ⛔ 빈칸·「-」를 0 으로 만들지 않는다 */
export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * 한 지역의 네 칸(관광지수·입장객·내국인·외국인)을 한 줄로 모은다.
 * ⚠ KOSIS 는 칸마다 줄이 따로다. `C2_NM` 이 그 칸 이름이다.
 */
export function 줄모으기(줄들) {
  const 방 = new Map();
  for (const r of 줄들) {
    const 이름 = r.C1_NM;
    const 해 = r.PRD_DE;
    const 열쇠 = `${해}|${이름}`;
    if (!방.has(열쇠)) 방.set(열쇠, { year: 해, name: 이름, kind: 갈래(이름), sites: null, visitors: null, domestic: null, foreign: null });
    const 것 = 방.get(열쇠);
    const v = 수로(r.DT);
    if (r.C2_NM === '집계관광지수') 것.sites = v;
    else if (r.C2_NM === '유료관광지 입장객') 것.visitors = v;
    else if (r.C2_NM === '내국인') 것.domestic = v;
    else if (r.C2_NM === '외국인') 것.foreign = v;
  }
  return [...방.values()];
}

/**
 * 🔴 2026-08-15 — **이 자료 자체가 못 잰 것을 0 으로 적어 놓았다.**
 *   송파구는 입장객 7,706,775 명인데 외국인 **0** 이다. 롯데월드가 있는 구다.
 *   그 밖에도 입장객 백만이 넘는데 외국인 0 인 곳이 열여섯이다.
 *   ⛔ 그대로 쓰면 「송파에는 외국인이 안 간다」는 **거짓**을 낸다.
 *     8/13 에 손흥민을 바닥에 깐 것과 같은 사고다 — 그때는 내 코드였고 이번엔 원본이다.
 *   ⭐ 원본을 고치지 않는다. **의심스러운 0 에 표를 달고 세는 데서 뺀다.**
 *
 * ⚠ 문턱을 왜 여기 두나 — 입장객이 이만큼인데 외국인이 **딱 0** 으로 떨어질 수는 없다.
 *   작은 관광지 하나뿐인 곳은 진짜 0 일 수 있어 낮게 잡지 않는다.
 */
export const 의심문턱 = 100000;

export function 의심스러운영인가(줄) {
  return 줄.foreign === 0 && 줄.visitors !== null && 줄.visitors >= 의심문턱;
}

/** 집계 대상 관광지가 아예 없는 곳. ⛔ 「아무도 안 온다」가 아니다 */
export function 잰곳이없나(줄) {
  return !줄.visitors && !줄.sites;
}

/** 외국인 몫. ⛔ 못 잰 것은 null — 0 이 아니다 */
export function 외국인몫(줄) {
  if (줄.foreign === null || !줄.visitors) return null;
  if (의심스러운영인가(줄)) return null;      // 🔴 0 이라 적혔지만 못 잰 것이다
  return +((100 * 줄.foreign) / 줄.visitors).toFixed(2);
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('총계는 합계로 가른다', 갈래('총계') === '합계');
  참('특별시는 광역으로 가른다', 갈래('서울특별시') === '광역');
  참('도도 광역이다', 갈래('경기도') === '광역');
  참('자치구는 시군구다', 갈래('종로구') === '시군구');
  참('빈칸을 0 으로 안 만든다', 수로('') === null && 수로('-') === null);
  참('쉼표를 지운다', 수로('1,234') === 1234);
  참('0 은 0 이다', 수로('0') === 0);
  const 모은 = 줄모으기([
    { PRD_DE: '2023', C1_NM: '종로구', C2_NM: '유료관광지 입장객', DT: '100' },
    { PRD_DE: '2023', C1_NM: '종로구', C2_NM: '외국인', DT: '25' },
  ]);
  참('칸 넷이 한 줄로 모인다', 모은.length === 1 && 모은[0].visitors === 100 && 모은[0].foreign === 25);
  참('안 온 칸은 null 이다', 모은[0].domestic === null);
  참('외국인 몫을 센다', 외국인몫(모은[0]) === 25);
  참('입장객이 없으면 몫도 없다', 외국인몫({ foreign: 5, visitors: null }) === null);
  참('외국인을 못 쟀으면 몫도 없다', 외국인몫({ foreign: null, visitors: 100 }) === null);
  /* 🔴 8/15 — 원본이 못 잰 것을 0 으로 적어 두었다. 그대로 쓰면 거짓이 나간다 */
  참('큰 입장객에 외국인 0 은 의심한다', 의심스러운영인가({ foreign: 0, visitors: 7706775 }));
  참('그런 곳은 몫을 안 낸다', 외국인몫({ foreign: 0, visitors: 7706775 }) === null);
  참('작은 곳의 0 은 그대로 둔다', !의심스러운영인가({ foreign: 0, visitors: 500 }));
  참('작은 곳은 몫이 0 이다', 외국인몫({ foreign: 0, visitors: 500 }) === 0);
  참('잰 곳이 없는 것과 0 명은 다르다',
    잰곳이없나({ visitors: 0, sites: 0 }) && !잰곳이없나({ visitors: 100, sites: 1 }));
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const KEY = (fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!KEY) { console.error('⛔ .env 에 KOSIS_API_KEY 가 없다'); process.exit(1); }

const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList'
  + `&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y`
  + `&prdSe=Y&newEstPrdCnt=3&orgId=${ORG}&tblId=${TBL}`;
const 원 = await (await fetch(u)).json();
if (!Array.isArray(원)) { console.error(`🔴 ${JSON.stringify(원).slice(0, 160)}`); process.exit(1); }

const 줄들 = 줄모으기(원);
const 해들 = [...new Set(줄들.map((r) => r.year))].sort();
const 늦은해 = 해들.at(-1);
const 시군구 = 줄들.filter((r) => r.kind === '시군구' && r.year === 늦은해);
const 광역 = 줄들.filter((r) => r.kind === '광역' && r.year === 늦은해);

const 나감 = {
  generated: 오늘(),
  source: '국가데이터처 KOSIS, 유료 주요관광지점 입장객 수 (행정안전부)',
  sourceEn: 'KOSIS, paid tourist-site admissions, Ministry of the Interior and Safety',
  orgId: ORG,
  tblId: TBL,
  years: 해들,
  latestYear: 늦은해,
  /** ⚠ 이 자가 **못 보는 것**. 기사에 그대로 옮긴다 */
  cannotSee: 'These are paid tourist sites only. A district whose draw is a street, a market or a '
    + 'shopping area — Gangnam among them — records few admissions here, and that is the ruler '
    + 'talking, not the visitors. It also counts admissions, not people: one visitor entering three '
    + 'sites is three.',
  /**
   * 🔴 원본이 못 잰 것을 0 으로 적어 둔 자리. **화면에 그대로 적는다.**
   *   이것을 안 적으면 「송파에는 외국인이 안 간다」가 우리 이름으로 나간다.
   */
  zeroIsNotZero: 'The source records a foreign-visitor count of 0 for districts that plainly '
    + 'receive foreign visitors — Songpa, which holds Lotte World, is one of them with 7.7m '
    + 'admissions and 0 foreigners. We do not correct the source. We mark those rows and leave '
    + 'them out of any share we publish.',
  rows: 줄들,
  districts: 시군구.map((r) => ({
    ...r,
    foreignSharePc: 외국인몫(r),
    foreignZeroSuspect: 의심스러운영인가(r),
    nothingMeasuredHere: 잰곳이없나(r),
  })),
  provinces: 광역.map((r) => ({ ...r, foreignSharePc: 외국인몫(r), foreignZeroSuspect: 의심스러운영인가(r) })),
  districtsCounted: 시군구.length,
  districtsWithoutForeign: 시군구.filter((r) => r.foreign === null).length,
  districtsForeignZeroSuspect: 시군구.filter(의심스러운영인가).length,
  districtsNothingMeasured: 시군구.filter(잰곳이없나).length,
  /** ⭐ 실제로 몫을 낼 수 있는 구가 몇인가. 분모를 밝힌다 */
  districtsUsable: 시군구.filter((r) => 외국인몫(r) !== null).length,
};

const 길 = path.join(뿌리, 'archive/raw/kosis/visitors.json');
fs.mkdirSync(path.dirname(길), { recursive: true });
fs.writeFileSync(길, `${JSON.stringify(나감, null, 2)}\n`);
console.log(`✅ ${path.relative(뿌리, 길)}`);
console.log(`   해 ${해들.join(' · ')} · 늦은 해 ${늦은해}`);
console.log(`   시군구 ${시군구.length} · 광역 ${광역.length}`);
console.log(`   🔴 외국인 0 이라 적혔지만 못 잰 것 ${나감.districtsForeignZeroSuspect}곳`
  + ` · 잰 관광지가 아예 없는 곳 ${나감.districtsNothingMeasured}곳`);
console.log(`   ⭐ 몫을 낼 수 있는 구 **${나감.districtsUsable}/${시군구.length}**`);
const 위 = [...나감.districts].filter((r) => r.visitors !== null).sort((a, b) => b.visitors - a.visitors).slice(0, 6);
for (const r of 위) {
  console.log(`   ${r.name.padEnd(12)} 입장객 ${String(r.visitors).padStart(10)} · 외국인 ${String(r.foreign ?? '—').padStart(9)}`
    + `${r.foreignSharePc === null ? '' : ` (${r.foreignSharePc}%)`}`);
}
