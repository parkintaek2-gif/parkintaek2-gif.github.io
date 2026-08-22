#!/usr/bin/env node
/**
 * collect-100y-lifelong.mjs — **나이대별 평생학습 참여율 — 성인은 몇 %가 계속 배우나**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님(2026-08-22) — 「0~100세 × 다섯 분야」 기획서 1단계 로드맵 3번째, 교육(성인) 첫 지면.
 *
 * ── 표 ────────────────────────────────────────────────────────
 *   DT_33409N_001  org 334(한국교육개발원)  「학습영역별 평생학습 참여율」
 *   나이칸은 25~29세(20대)~70~79세(70대) — 25세 미만은 이 조사 대상이 아니다(성인 대상 조사)
 *
 * ── ⭐ 실측으로 찾은 것 ──────────────────────────────────────────
 * 나이 들수록 «계속» 낮아진다 — 20대 43.4%에서 70대 26.4%까지 한 번도 안 꺾이고
 * 내려간다. 다른 지면(운동·동호회·1인가구)과 달리 이번엔 예상과 어긋나지 않았다.
 * 유형별로도 «비형식교육»(직업훈련·평생교육원 등)이 거의 전부이고, «형식교육»(학위과정)은
 * 모든 나이대에서 1% 안팎으로 작다 — 70대는 표본이 없어(X) 아예 못 쟀다.
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · 25세 미만은 이 조사 대상이 아니다(성인 평생학습 실태조사) — 10대·대학생 나이는 없다
 * · 표본조사다. 70대 «형식교육»처럼 표본이 아예 없어 값 자체가 없는 칸(X)이 있다
 * · "참여했다"는 자기응답이다 — 얼마나 배웠는지(강도·성과)는 이 표가 못 가른다
 *
 * 쓰는 법  node scripts/collect-100y-lifelong.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '334';
export const TBL = 'DT_33409N_001';
export const 나이칸들 = ['20대', '30대', '40대', '50대', '60대', '70대'];
/** ⚠ KOSIS 원 칸 이름 그대로 — 20대는 사실 25~29세만이다(20~24세는 조사 대상 밖) */
export const 원칸이름 = {
  '20대': '25~29세(20대)', '30대': '30~39세(30대)', '40대': '40~49세(40대)',
  '50대': '50~59세(50대)', '60대': '60~69세(60대)', '70대': '70~79세(70대)',
};

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** ⭐ 나이 들수록 한 번도 안 꺾이고 내려가는가 — 지난 지면들과 달리 이번엔 어떤지 정직히 본다 */
export function 계속내려가나(칸들, 키) {
  const 값들 = 칸들.map((r) => r[키]).filter((v) => v != null);
  if (값들.length < 2) return null;
  const 내림 = 값들.every((v, i) => i === 0 || v <= 값들[i - 1]);
  return { 내림, 최고칸: 칸들[0].칸, 최고값: 값들[0], 최저칸: 칸들.at(-1).칸, 최저값: 값들.at(-1) };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② X 표시(표본 없음)도 못 잰 것으로 둔다', 수로('X') === null);
  본다('③ 소수를 읽는다', 수로('43.4') === 43.4);
  본다('④ 여섯 칸이다', 나이칸들.length === 6);
  본다('⑤ 계속 내려가면 참', 계속내려가나(
    [{ 칸: '20대', v: 40 }, { 칸: '30대', v: 35 }, { 칸: '40대', v: 30 }], 'v').내림 === true);
  본다('⑥ 중간에 오르면 거짓', 계속내려가나(
    [{ 칸: '20대', v: 40 }, { 칸: '30대', v: 45 }, { 칸: '40대', v: 30 }], 'v').내림 === false);
  본다('⑦ 값이 하나뿐이면 못 잰다(null)', 계속내려가나([{ 칸: '20대', v: 40 }], 'v') === null);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-lifelong.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const j = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&itmId=ALL&objL1=ALL&objL2=ALL&prdSe=Y&newEstPrdCnt=2`)).json();
  if (!Array.isArray(j)) throw new Error(`${TBL}: ${JSON.stringify(j).slice(0, 200)}`);

  const 최신 = [...new Set(j.map((x) => x.PRD_DE))].sort().at(-1);
  const 값 = (c1, 칸) => 수로(j.find((x) => x.PRD_DE === 최신 && x.C1_NM === c1 && x.C2_NM === 원칸이름[칸])?.DT);

  const 나이별 = 나이칸들.map((칸) => ({
    칸,
    참여율: 값('전체 참여율', 칸),
    형식교육: 값('형식교육', 칸),
    비형식교육: 값('비형식교육', 칸),
    직업관련: 값('직업관련 목적', 칸),
  }));

  /* 🔴 자가대조 — 형식교육+비형식교육은 정확히 전체와 같지 않을 수 있다(중복참여 가능한 조사설계).
     대신 «전체 참여율»이 «비형식교육»보다 항상 크거나 같은지만 정직히 확인한다(비형식이 전체를 못 넘어서야 한다) */
  const 어긋난것 = 나이별.filter((r) => r.참여율 != null && r.비형식교육 != null && r.비형식교육 > r.참여율 + 0.1);
  const 자가대조 = {
    '비형식교육 참여율 ≤ 전체 참여율': { 어긋난칸수: 어긋난것.length, 맞나: 어긋난것.length === 0 },
    뜻: '비형식교육은 전체 참여율의 부분집합이어야 한다(전체를 넘어설 수 없다)',
  };

  const 흐름 = 계속내려가나(나이별, '참여율');
  const 못잰형식교육 = 나이별.filter((r) => r.형식교육 == null).map((r) => r.칸);

  const 낸다 = {
    무엇: '나이대별 평생학습 참여율 — 성인은 몇 %가 계속 배우나',
    만든날: new Date().toISOString().slice(0, 10),
    최신,
    출처: {
      기관: '한국교육개발원', 표: '학습영역별 평생학습 참여율',
      창구: 'KOSIS', orgId: ORG, tblId: TBL,
    },
    나이별,
    '⭐ 나이 들수록 계속 낮아지나': 흐름,
    '⚠ 이 자료가 못 가르는 것': [
      '25세 미만은 조사 대상이 아닙니다(성인 평생학습 실태조사) — 10대·대학생 나이대는 없습니다.',
      `표본조사입니다. 특히 ${못잰형식교육.join('·')}의 "형식교육"은 표본이 없어(X) 못 쟀습니다.`,
      '"참여했다"는 자기응답입니다. 얼마나 깊이 배웠는지는 이 표가 못 가릅니다.',
    ],
    자가대조,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/lifelong.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   ${최신}년 · 평생학습 참여율: ${나이별.map((r) => `${r.칸} ${r.참여율}%`).join(' · ')}`);
  console.log(`   나이 들수록 계속 낮아지나: ${흐름.내림 ? '그렇다(한 번도 안 꺾임)' : '아니다(중간에 오른다)'}`);
  console.log(`   자가대조: 어긋난 칸 ${자가대조['비형식교육 참여율 ≤ 전체 참여율'].어긋난칸수}개`);
}
