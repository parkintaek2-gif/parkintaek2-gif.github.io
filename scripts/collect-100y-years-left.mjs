/**
 * collect-100y-years-left.mjs — **지금 몇 살이면 앞으로 몇 해가 남았나** (완전생명표, 1세별)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 🔴 우리 이름이 **백년지도**다. 사장님 「0세~100세다. 키즈부터」·「대입은 한 점에 불과해」.
 *   이 표는 **0세부터 100세까지 한 살씩** 있다. 우리 이름값에 가장 맞는 자료다.
 *   그런데 오늘까지 우리 지면에 한 줄도 없었다.
 *
 * ⛔ 2번이 준 규칙대로 **기간부터 물었다** — 1970~2024, 쉰다섯 해가 있다.
 *   그래서 「지금」만 내지 않고 **1970년과 나란히** 놓는다. 그것이 이 자료의 힘이다.
 *
 * ── ⚠ 이 자료가 못 가르는 것 — 이것이 제일 중요하다 ─────────────
 * · 기대여명은 **한 사람의 남은 해가 아니다.** 그 나이 사람들 «전체»의 평균이다
 *   ⛔ 「당신은 몇 살까지 삽니다」로 옮겨 적으면 거짓이다
 * · 지금의 사망률이 앞으로도 그대로라고 놓고 센 값이다. 앞날의 예측이 아니다
 * · 「100세이상」은 한 칸으로 묶여 있다. 101세와 110세를 이 표는 안 가른다
 * · 병이 있는지, 어디 사는지, 무슨 일을 하는지는 이 표에 없다
 *
 * 쓰는 법  node scripts/collect-100y-years-left.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const TBL = 'DT_1B42';
export const 항목 = { 전체: 'T6', 남자: 'T16', 여자: 'T26' };
/** ⛔ 「계」는 나이가 아니다. 나이 칸과 같은 자리에 놓으면 한 줄이 늘어난다 */
export const 계말 = '계';

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export const 한자리 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/** 「0세」 → 0 · 「100세이상」 → 100. ⛔ 못 읽으면 null 을 낸다(0 으로 만들지 않는다) */
export function 나이수(이름) {
  const m = String(이름).match(/^(\d+)세/);
  return m ? Number(m[1]) : null;
}

/** 그 나이에 몇 살까지 사는 셈인가 = 나이 + 남은 해. ⛔ 둘 다 있을 때만 */
export function 몇살까지(나이, 남은) {
  if (나이 == null || 남은 == null) return null;
  return 한자리(나이 + 남은);
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 나이를 읽는다', 나이수('0세') === 0 && 나이수('65세') === 65 && 나이수('100세이상') === 100);
  본다('③ 「계」는 나이가 아니다', 나이수(계말) === null);
  본다('④ 몇 살까지는 둘 다 있을 때만', 몇살까지(65, 21.7) === 86.7 && 몇살까지(65, null) === null);
  본다('⑤ 한 자리까지', 한자리(83.66) === 83.7);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-years-left.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const 받기 = async (cnt) => {
    const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
      + `&itmId=${Object.values(항목).join('+')}&objL1=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=Y&newEstPrdCnt=${cnt}`;
    const j = await (await fetch(u)).json();
    if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 150));
    return j;
  };
  /* 🔴 쉰다섯 해를 다 받아 두고, 지면에는 지금과 첫 해를 나란히 놓는다.
     ⛔ 「지금」만 받으면 이 자료가 무엇을 보여 주는지 절반을 버리는 것이다 */
  const 날 = await 받기(60);
  const 해들 = [...new Set(날.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1], 첫해 = 해들[0];

  const 한해 = (해) => {
    const 줄 = 날.filter((x) => x.PRD_DE === 해 && x.C1_NM !== 계말);
    const 나이별 = [];
    for (const 이름 of [...new Set(줄.map((x) => x.C1_NM))]) {
      const n = 나이수(이름);
      if (n == null) continue;
      const 값 = (itm) => 한자리(수로(줄.find((x) => x.C1_NM === 이름 && x.ITM_ID === itm)?.DT));
      나이별.push({ 나이: n, 이름, 전체: 값(항목.전체), 남자: 값(항목.남자), 여자: 값(항목.여자) });
    }
    나이별.sort((a, b) => a.나이 - b.나이);
    return 나이별;
  };

  const 이번 = 한해(최신);
  const 옛 = 한해(첫해);
  const 옛맵 = new Map(옛.map((r) => [r.나이, r.전체]));
  const 견줌 = 이번.map((r) => ({ ...r, 옛전체: 옛맵.get(r.나이) ?? null,
    늘어난: r.전체 != null && 옛맵.get(r.나이) != null ? 한자리(r.전체 - 옛맵.get(r.나이)) : null }));

  /* 🔴 자가 대조 — 나이가 한 살 늘면 «몇 살까지»는 줄지 않아야 한다(생명표의 성질).
     어긋나면 내가 줄을 잘못 붙인 것이다. 값을 고치지 않고 «어긋났다»고 낸다 */
  const 어긋난곳 = [];
  for (let i = 1; i < 이번.length; i++) {
    const 앞 = 몇살까지(이번[i - 1].나이, 이번[i - 1].전체);
    const 뒤 = 몇살까지(이번[i].나이, 이번[i].전체);
    if (앞 != null && 뒤 != null && 뒤 + 0.05 < 앞) 어긋난곳.push({ 나이: 이번[i].나이, 앞, 뒤 });
  }

  const 낸다 = {
    무엇: '지금 몇 살이면 앞으로 몇 해가 남았나 — 기대여명(1세별)',
    만든날: new Date().toISOString().slice(0, 10),
    최신, 첫해, 해수: 해들.length,
    단위: '년',
    출처: { 기관: '국가데이터처', 표: '완전생명표(1세별)', 창구: 'KOSIS', orgId: ORG, tblId: TBL },
    '⚠ 이 자료가 못 가르는 것': [
      '기대여명은 한 사람의 남은 해가 아닙니다. 그 나이 사람들 전체의 평균입니다 — 「당신은 몇 살까지 삽니다」가 아닙니다.',
      '지금의 사망률이 앞으로도 그대로라고 놓고 센 값입니다. 앞날의 예측이 아닙니다.',
      '「100세이상」은 한 칸으로 묶여 있습니다. 101세와 110세를 이 표는 가르지 않습니다.',
      '병이 있는지, 어디 사는지, 무슨 일을 하는지는 이 표에 없습니다.',
    ],
    나이별: 견줌,
    자가대조: {
      뜻: '나이가 한 살 늘면 「몇 살까지」는 줄지 않아야 한다 — 생명표의 성질이다',
      어긋난칸: 어긋난곳.length, 어긋난곳: 어긋난곳.slice(0, 5),
    },
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/years-left.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  const 영 = 견줌.find((r) => r.나이 === 0);
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${첫해}~${최신} (${해들.length}해) · 나이 ${견줌.length}칸`);
  console.log(`   0세 ${영.전체}년 (${첫해} ${영.옛전체}년 → ${영.늘어난 > 0 ? '+' : ''}${영.늘어난}년)`);
  console.log(`   자가 대조: 어긋난 칸 ${어긋난곳.length} — ${어긋난곳.length ? '🔴 봐야 한다' : '맞다'}`);
}
