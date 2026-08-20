/**
 * collect-100y-keep-working.mjs — **그만두고도 계속 일하고 싶은가, 왜인가** (55~79세)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * /longest-job 이 「가장 오래 다닌 직장을 평균 53세에 그만둔다」를 냈다. 바로 다음 물음이 이것이다.
 * 그리고 /ages 가 스스로 「70대 뒤가 얇습니다」라고 적어 두었다 —
 * ⛔ **새 물음을 벌이기 전에 내가 적어 둔 얇은 자리부터 채운다.**
 *
 * ⛔ 2번이 준 규칙대로 **기간부터 물었다** — 2005~2026, 스물두 번 조사.
 *
 * ── ⚠ 이 지면이 가장 조심할 자리 — **분모가 둘이다** ────────────
 * ```
 *   「일하고 싶다」의 분모   = 55~79세 사람 전체
 *   「왜 일하고 싶나」의 분모 = 일하고 싶다고 답한 사람  ← 다르다!
 * ```
 * ⛔ 두 분모를 섞어 「전체의 53%가 생활비 때문에 일한다」로 쓰면 **거짓**이다.
 *   맞게 쓰면 「일하고 싶다고 답한 사람 가운데 53%가 생활비를 들었다」다.
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · **바람이지 사실이 아니다.** 「일하고 싶다」이지 「일한다」가 아니다
 * · 55~79세를 한 칸으로 묶었다. 이 표는 나이별로 안 가른다
 * · 몇 살까지 일하고 싶은지는 이 표에 없다
 *
 * 쓰는 법  node scripts/collect-100y-keep-working.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const TBL = 'DT_1DE8044S';
export const 기간꼴 = 'M';
export const 계말 = '계';
export const 전체칸 = '55~79세인구';
export const 원함칸 = '장래근로 원함';
export const 안원함칸 = '장래근로 원하지 않음';
/** 까닭 칸은 앞에 「-」가 붙어 있다. ⛔ 그대로 화면에 내보내지 않는다 */
export const 까닭칸 = ['-일하는 즐거움', '-생활비에 보탬', '-사회가 필요로 함', '-건강유지', '-무료해서', '-기타'];
export const 까닭말 = (s) => String(s).replace(/^-/, '');

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export const 한자리 = (v) => (v == null ? null : Math.round(v * 10) / 10);
/** ⛔ 분모를 반드시 함께 받는다. 분모 없이 몫을 내지 않는다 */
export function 몫(부분, 분모) {
  if (부분 == null || !분모) return null;
  return Math.round((부분 / 분모) * 1000) / 10;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 까닭 앞의 「-」를 걷는다', 까닭말('-생활비에 보탬') === '생활비에 보탬');
  본다('③ 분모가 없으면 몫을 안 낸다', 몫(5, 0) === null && 몫(null, 10) === null);
  본다('④ 몫은 한 자리까지', 몫(1, 3) === 33.3);
  본다('⑤ 까닭이 여섯 칸이다', 까닭칸.length === 6);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-keep-working.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const 날 = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y`
    + `&orgId=${ORG}&tblId=${TBL}&prdSe=${기간꼴}&newEstPrdCnt=30`)).json();
  if (!Array.isArray(날)) { console.log('🔴 못 받았다 —', JSON.stringify(날).slice(0, 200)); process.exit(1); }

  const 때들 = [...new Set(날.map((x) => x.PRD_DE))].sort();
  const 최신 = 때들[때들.length - 1];
  const 값 = (때, 성, 항) => 수로(날.find((x) => x.PRD_DE === 때 && x.C1_NM === 성 && x.ITM_NM === 항)?.DT);

  const 전체 = 값(최신, 계말, 전체칸);
  const 원함 = 값(최신, 계말, 원함칸);
  const 안원함 = 값(최신, 계말, 안원함칸);

  const 까닭 = 까닭칸.map((c) => {
    const v = 값(최신, 계말, c);
    return { 까닭: 까닭말(c), 천명: 한자리(v), 몫: 몫(v, 원함) };
  }).filter((r) => r.천명 != null).sort((a, b) => b.천명 - a.천명);

  /* 🔴 자가 대조 둘 — 분모가 둘이라 각각 맞춰 본다 */
  const 까닭합 = 까닭.reduce((s, r) => s + r.천명, 0);
  const 대조 = {
    '까닭 합 = 원함': { 합: 한자리(까닭합), 원함: 한자리(원함), 맞나: Math.abs(까닭합 - 원함) < 0.15 },
    '원함 + 안원함 = 전체': { 합: 한자리(원함 + 안원함), 전체: 한자리(전체), 맞나: Math.abs(원함 + 안원함 - 전체) < 0.15 },
    뜻: '분모가 둘이라 각각 맞춰야 한다 — 하나만 맞추면 다른 쪽에서 어긋난 채로 나간다',
  };

  const 흐름 = 때들.map((때) => {
    const 전 = 값(때, 계말, 전체칸), 원 = 값(때, 계말, 원함칸);
    return { 때, 해: 때.slice(0, 4), 원함몫: 몫(원, 전) };
  }).filter((r) => r.원함몫 != null);

  const 낸다 = {
    무엇: '55~79세가 앞으로도 일하고 싶은가, 왜인가',
    만든날: new Date().toISOString().slice(0, 10),
    최신, 조사수: 때들.length,
    단위: '천명',
    출처: { 기관: '국가데이터처', 표: '경제활동인구조사 고령층 부가조사 — 장래 근로 희망의사 및 희망사유', 창구: 'KOSIS', orgId: ORG, tblId: TBL },
    '⛔ 분모가 둘이다': '「일하고 싶다」의 분모는 55~79세 사람 전체이고, 「왜 일하고 싶나」의 분모는 일하고 싶다고 답한 사람입니다. 섞으면 거짓이 됩니다.',
    '⚠ 이 자료가 못 가르는 것': [
      '바람이지 사실이 아닙니다 — 「일하고 싶다」이지 「일한다」가 아닙니다.',
      '55~79세를 한 칸으로 묶었습니다. 이 표는 나이별로 가르지 않습니다.',
      '몇 살까지 일하고 싶은지는 이 표에 없습니다.',
      '까닭은 한 사람이 하나만 고른 것입니다 — 여럿을 고를 수 있었다면 합이 달라집니다.',
    ],
    전체: 한자리(전체), 원함: 한자리(원함), 안원함: 한자리(안원함),
    원함몫: 몫(원함, 전체),
    까닭, 자가대조: 대조, 흐름,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/keep-working.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${때들[0]}~${최신} (${때들.length}번 조사)`);
  console.log(`   55~79세 ${한자리(전체)}천명 중 ${한자리(원함)}천명(${낸다.원함몫}%)이 앞으로도 일하고 싶다`);
  console.log(`   까닭 맨 위: ${까닭[0].까닭} ${까닭[0].몫}% (분모는 «원하는 사람»)`);
  console.log(`   자가 대조: 까닭합 ${대조['까닭 합 = 원함'].맞나 ? '맞다' : '🔴 안 맞다'} · 원함+안원함 ${대조['원함 + 안원함 = 전체'].맞나 ? '맞다' : '🔴 안 맞다'}`);
}
