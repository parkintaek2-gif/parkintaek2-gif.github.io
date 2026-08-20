/**
 * collect-100y-healthy-years.mjs — **남은 해 가운데 건강한 해는 몇 해인가**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * /years-left 가 「몇 해가 남았나」를 냈다. 그 지면이 답하지 않은 것이 하나 남는다 —
 * **남은 해가 다 건강한 해는 아니다.** 백년지도가 「백 년을 그린다」면 그 결까지 그려야 한다.
 *
 * ⭐ 그리고 이 표를 열자마자 나온 것이 이 지면의 알맹이다 —
 *   **건강수명은 재는 법에 따라 여덟 해가 다르다.**
 *   0세 기준 유병기간 제외 65.5년 · 주관적 건강평가 73.8년. 같은 해, 같은 나라, 같은 표다.
 *   ⛔ 그러니 「우리나라 건강수명은 ○○년」이라고 한 수로 말하면 그건 절반만 말한 것이다.
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · 두 잣대가 다른 것을 잰다 — 하나는 «아팠던 기간을 뺀 해», 하나는 «스스로 건강하다고 답한 해»다
 * · 기대여명(완전생명표)과는 **다른 표**다. 같은 해끼리만 견준다
 * · 두 해마다 조사한다(2년 주기). 매년 값이 아니다
 * · 나이 칸이 다섯 해씩 띄엄띄엄이다(0·1·5·10…). 그 사이 나이는 이 표에 없다
 *
 * ⚠ 이 표는 `prdSe=F` 로 열린다. Y·2Y 로는 「데이터가 존재하지 않습니다」가 나온다(8/21 실측).
 *
 * 쓰는 법  node scripts/collect-100y-healthy-years.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const TBL = 'DT_1B46';
export const 기간꼴 = 'F';
export const 잣대 = { 유병: '유병기간 제외 기대여명 (년)', 주관: '주관적 건강평가 기대여명 (년)' };
export const 전체말 = '남녀전체';
/** ⛔ 「계」는 나이가 아니다 */
export const 계말 = '계';

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export const 한자리 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/** 두 잣대가 얼마나 벌어지나 — ⛔ 둘 다 있을 때만 낸다 */
export function 벌어짐(a, b) {
  if (a == null || b == null) return null;
  return 한자리(Math.abs(a - b));
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 한 자리까지', 한자리(65.47) === 65.5);
  본다('③ 벌어짐은 둘 다 있을 때만', 벌어짐(65.5, 73.8) === 8.3 && 벌어짐(null, 73.8) === null);
  본다('④ 두 잣대 이름이 서로 다르다', 잣대.유병 !== 잣대.주관);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-healthy-years.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
    + `&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=${기간꼴}&newEstPrdCnt=20`;
  const 날 = await (await fetch(u)).json();
  if (!Array.isArray(날)) { console.log('🔴 못 받았다 —', JSON.stringify(날).slice(0, 200)); process.exit(1); }

  const 해들 = [...new Set(날.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];
  const 나이칸 = [...new Set(날.filter((x) => x.C2_NM !== 계말).map((x) => x.C2_NM))]
    .filter((n) => /^\d+$/.test(n)).sort((a, b) => Number(a) - Number(b));

  const 값 = (해, 성, 나이, 잣) => 한자리(수로(
    날.find((x) => x.PRD_DE === 해 && x.C1_NM === 성 && x.C2_NM === 나이 && x.ITM_NM === 잣)?.DT));

  const 나이별 = 나이칸.map((n) => {
    const 유 = 값(최신, 전체말, n, 잣대.유병);
    const 주 = 값(최신, 전체말, n, 잣대.주관);
    return {
      나이: Number(n), 유병제외: 유, 주관건강: 주, 벌어짐: 벌어짐(유, 주),
      남자유병: 값(최신, '남자', n, 잣대.유병), 여자유병: 값(최신, '여자', n, 잣대.유병),
    };
  });

  /* 🔴 자가 대조 — 나이가 들면 «남은 건강한 해»는 줄어야 한다. 어긋나면 줄을 잘못 붙인 것이다 */
  const 어긋난곳 = [];
  for (let i = 1; i < 나이별.length; i++) {
    const 앞 = 나이별[i - 1].유병제외, 뒤 = 나이별[i].유병제외;
    if (앞 != null && 뒤 != null && 뒤 > 앞) 어긋난곳.push({ 나이: 나이별[i].나이, 앞, 뒤 });
  }

  const 영 = 나이별.find((r) => r.나이 === 0);
  const 낸다 = {
    무엇: '남은 해 가운데 건강한 해는 몇 해인가 — 건강수준별 기대여명',
    만든날: new Date().toISOString().slice(0, 10),
    최신, 해들, 단위: '년',
    출처: { 기관: '국가데이터처', 표: '건강수준별 기대여명', 창구: 'KOSIS', orgId: ORG, tblId: TBL },
    잣대,
    '⭐ 이 지면의 알맹이': `같은 해 같은 표인데 잣대가 다르면 ${영?.벌어짐}년이 벌어집니다 — 「우리나라 건강수명은 ○○년」이라고 한 수로 말하면 절반만 말한 것입니다.`,
    '⚠ 이 자료가 못 가르는 것': [
      '두 잣대가 서로 다른 것을 잽니다 — 하나는 아팠던 기간을 뺀 해이고, 하나는 스스로 건강하다고 답한 해입니다.',
      '기대여명(완전생명표)과는 다른 표입니다. 같은 해끼리만 견줍니다.',
      '두 해마다 조사합니다. 매년 값이 아닙니다.',
      '나이 칸이 띄엄띄엄입니다(0·1·5·10…). 그 사이 나이는 이 표에 없습니다.',
      '건강수명이 왜 그렇게 나오는지, 무엇을 하면 늘어나는지는 이 표가 말하지 않습니다.',
    ],
    나이별,
    자가대조: {
      뜻: '나이가 들면 「남은 건강한 해」는 줄어야 한다',
      어긋난칸: 어긋난곳.length, 어긋난곳: 어긋난곳.slice(0, 5),
    },
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/healthy-years.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  const 예순다섯 = 나이별.find((r) => r.나이 === 65);
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${해들[0]}~${최신} (${해들.length}번 조사) · 나이 ${나이별.length}칸`);
  console.log(`   0세: 유병제외 ${영.유병제외}년 · 주관 ${영.주관건강}년 — ${영.벌어짐}년 벌어진다`);
  console.log(`   65세: 유병제외 ${예순다섯?.유병제외}년 · 주관 ${예순다섯?.주관건강}년`);
  console.log(`   자가 대조: 어긋난 칸 ${어긋난곳.length} — ${어긋난곳.length ? '🔴 봐야 한다' : '맞다'}`);
}
