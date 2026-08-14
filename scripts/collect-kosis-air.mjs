/**
 * collect-kosis-air.mjs — **국제선 지역별 여객·운항·화물**, 60달치.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님 지시: 「항공 운항횟수나 승객 통계 등이 의미가 있을 수 있겠다」
 *   ⛔ TourAPI 가 막혔다고 접었던 물음이다. KOSIS(한국공항공사)에 있었다.
 *
 * ── ⚠ 이 자료가 **못 가르는 것** — 이것이 제일 중요하다 ─────────
 * 지역 칸이 아홉이다: 합계 · 일본 · 중국 · 아시아 · 미주 · 유럽 · 중동 · 아프리카 · 대양주
 * 🔴 **일본과 중국만 따로 있고, 나머지 아시아는 전부 한 칸이다.**
 *   우리가 재는 인도네시아·베트남·태국·말레이시아는 그 한 칸 안에서 서로 안 갈린다.
 *   ⛔ 그러니 이 자료로 「베트남에서 몇 명 왔나」를 말하면 **거짓**이다. 그 말을 자료에 박는다.
 *
 * ⛔ 못 받은 달을 0 으로 세지 않는다. 값이 없으면 null 로 둔다.
 * ⚠ 화면에 「출처: 국가데이터처 KOSIS, 국제선 지역별 통계(한국공항공사)」를 박는다.
 * ⚠ 창이 2021-07 부터다 — **코로나 바닥부터**다. 그 앞이 없으니 「회복률」을 못 낸다.
 *
 * 쓰는 법
 *   node scripts/collect-kosis-air.mjs
 *   node scripts/collect-kosis-air.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '381';
export const TBL = 'DT_920005_B005';
export const 달수 = 60;

/** ⛔ 합계는 지역이 아니다. 지역과 같은 칸에 놓으면 두 번 센다 */
export const 합계말 = '합계';

/** 값을 수로. ⛔ 빈칸을 0 으로 만들지 않는다 */
export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** `202606` → `2026-06`. ⚠ 자료가 달을 붙여 쓴다 */
export function 달꼴(prd) {
  const s = String(prd ?? '');
  return /^\d{6}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
}

/**
 * 지역 × 달 로 여객만 뽑는다(도착+출발 = 「계」).
 * ⚠ `C2_NM` 이 계/도착/출발이다. 「계」만 쓴다 — 도착과 출발을 더하면 두 번 센다.
 */
export function 여객뽑기(줄들) {
  const 방 = new Map();
  for (const r of 줄들) {
    if (r.ITM_NM !== '여객' || r.C2_NM !== '계') continue;
    const 달 = 달꼴(r.PRD_DE);
    if (!방.has(r.C1_NM)) 방.set(r.C1_NM, {});
    방.get(r.C1_NM)[달] = 수로(r.DT);
  }
  return 방;
}

/** 첫 달 대비 몇 배. ⛔ 둘 중 하나라도 없거나 0 이면 null — 나누지 않는다 */
export function 몇배(첫, 끝) {
  if (첫 === null || 끝 === null || !첫) return null;
  return +(끝 / 첫).toFixed(1);
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('빈칸을 0 으로 안 만든다', 수로('') === null && 수로('-') === null);
  참('쉼표를 지운다', 수로('1,234') === 1234);
  참('0 은 0 이다', 수로('0') === 0);
  참('달꼴을 바꾼다', 달꼴('202606') === '2026-06');
  참('이상한 달은 그대로', 달꼴('x') === 'x');
  const 방 = 여객뽑기([
    { ITM_NM: '여객', C2_NM: '계', C1_NM: '아시아', PRD_DE: '202606', DT: '100' },
    { ITM_NM: '여객', C2_NM: '도착', C1_NM: '아시아', PRD_DE: '202606', DT: '50' },
    { ITM_NM: '운항', C2_NM: '계', C1_NM: '아시아', PRD_DE: '202606', DT: '9' },
  ]);
  참('여객·계만 뽑는다', 방.get('아시아')['2026-06'] === 100);
  참('도착·출발을 안 더한다', Object.keys(방.get('아시아')).length === 1);
  참('운항을 안 섞는다', 방.size === 1);
  참('몇 배를 센다', 몇배(10, 30) === 3);
  참('첫 달이 0 이면 안 나눈다', 몇배(0, 30) === null);
  참('못 잰 것이면 안 나눈다', 몇배(null, 30) === null && 몇배(10, null) === null);
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const KEY = (fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!KEY) { console.error('⛔ .env 에 KOSIS_API_KEY 가 없다'); process.exit(1); }

const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList'
  + `&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y`
  + `&prdSe=M&newEstPrdCnt=${달수}&orgId=${ORG}&tblId=${TBL}`;
const 원 = await (await fetch(u)).json();
if (!Array.isArray(원)) { console.error(`🔴 ${JSON.stringify(원).slice(0, 160)}`); process.exit(1); }

const 방 = 여객뽑기(원);
const 달들 = [...new Set(원.map((r) => 달꼴(r.PRD_DE)))].sort();
const 지역들 = [...방.keys()].filter((k) => k !== 합계말);

const 나감 = {
  generated: new Date().toISOString().slice(0, 10),
  source: '국가데이터처 KOSIS, 국제선 지역별 통계 (한국공항공사)',
  sourceEn: 'KOSIS, international air routes by region, Korea Airports Corporation',
  orgId: ORG,
  tblId: TBL,
  months: 달들,
  firstMonth: 달들[0],
  lastMonth: 달들.at(-1),
  regions: 지역들,
  /**
   * 🔴 **이 자료가 못 가르는 것.** 기사에 그대로 옮긴다.
   *   일본과 중국만 따로 있고 나머지 아시아가 한 칸이다. 우리가 재는 네 나라는
   *   그 한 칸 안에서 서로 안 갈린다. 「베트남에서 몇 명」은 이 자료로 못 말한다.
   */
  cannotSplit: 'The table separates Japan and China and puts every other Asian country into one '
    + 'row. Indonesia, Vietnam, Thailand and Malaysia — the four editions we read — are inside '
    + 'that single row and cannot be told apart. Nothing here can say how many people flew in '
    + 'from any one of them.',
  /** ⚠ 창이 코로나 바닥부터다. 「회복률」을 못 낸다 */
  windowCaveat: `The series starts ${달들[0]}, which is the floor of the pandemic, not a normal `
    + 'year. Growth from that point is a return, not a rise, and this data cannot say how much of '
    + 'the pre-2020 level has come back.',
  passengers: Object.fromEntries([...방.entries()].map(([k, v]) => [k, v])),
  growth: Object.fromEntries(지역들.map((r) => [r,
    몇배(방.get(r)[달들[0]] ?? null, 방.get(r)[달들.at(-1)] ?? null)])),
  latest: Object.fromEntries([...방.keys()].map((r) => [r, 방.get(r)[달들.at(-1)] ?? null])),
};

const 길 = path.join(뿌리, 'archive/raw/kosis/air.json');
fs.mkdirSync(path.dirname(길), { recursive: true });
fs.writeFileSync(길, `${JSON.stringify(나감, null, 2)}\n`);
console.log(`✅ ${path.relative(뿌리, 길)}`);
console.log(`   ${달들.length}달 (${달들[0]} ~ ${달들.at(-1)}) · 지역 ${지역들.length}`);
const 차례 = 지역들.map((r) => [r, 나감.latest[r]]).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
for (const [r, v] of 차례) {
  console.log(`   ${r.padEnd(8)} ${String(v === null ? '—' : v.toLocaleString('en-US')).padStart(11)}`
    + `  ${달들[0]} 대비 ${나감.growth[r] === null ? '—' : `${나감.growth[r]}배`}`);
}
console.log('\n⚠ 이 자료는 동남아 네 나라를 「아시아」 한 칸에 묶는다. 나라별로 못 말한다.');
