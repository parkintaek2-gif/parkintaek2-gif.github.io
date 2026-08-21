#!/usr/bin/env node
/**
 * collect-100y-promotion.mjs — **승진에 만족하는 사람이 몇 %일까, 직급이 오를수록 성별 차가 벌어지나**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님(2026-08-07, docs/백년지도-남들은-어떻게.md 「열두 고민」) — 「승진은?」
 * /pets · /travel 다음, 「열두 고민」의 마지막 자리.
 *
 * ⚠ 계획 문서가 적어 둔 표(417/DT_417002N_006, 한국행정연구원 「승진 인식」)를 받아 보니
 *   **공무원만 대상**이었다(중앙행정기관·1~4급 같은 갈래뿐 — 민간 회사원이 없다).
 *   승진은 회사원 쪽 검색이 훨씬 크다고 보고, 대신 한국여성정책연구원의
 *   **여성관리자패널조사** — 「직장 만족도(격년) - 승진」(338/DT_KWMP_2020045)을 썼다.
 *   ⛔ 이 표도 «전 국민»이 아니다 — **여성 관리자가 있는 사업체(대개 100인 이상)** 패널이다.
 *   작은 회사·자영업은 이 표에 없다. 그대로 밝힌다.
 *
 * ── 표 하나, 세 해(2020·2022·2024, 격년) · 직급별 · 성별 ──────────
 *   전체·직급(과장급 이하~임원급)·성별(여성/남성)로 「승진 만족도」 5점 척도 + 평균
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · 공무원이 아니라 민간 기업 조사이지만, **여성 관리자가 있는 사업체 패널**이다 —
 *   전 국민 표본이 아니다. 100인 미만 소규모 사업장 비중이 낮다
 * · 격년 조사다(2020·2022·2024) — 해마다의 움직임은 못 본다
 * · 「만족도」는 자기 응답이다 — 실제 승진 속도·승진 여부를 재는 표가 아니다
 *
 * 쓰는 법  node scripts/collect-100y-promotion.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '338';
export const TBL = 'DT_KWMP_2020045';
export const 척도 = ['매우 불만족한다', '불만족하는 편이다', '보통이다', '만족하는 편이다', '매우 만족한다'];

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export const 한자리 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/**
 * ⭐ 맨 위 직급(마지막 칸)에서 성별 차이(남−여)가 다른 직급보다 뚜렷이 큰가 — 이 지면의 답 한 줄
 * ⛔ 처음엔 「직급이 오를수록 계속 벌어진다」로 잡으려 했는데 실제 값이 단조증가가 아니었다
 *   (차장급에서는 여성이 오히려 높았다). 사실과 안 맞는 이야기를 지어내지 않는다 — 최고 직급만 본다.
 */
export function 맨위직급이제일크나(직급별) {
  const 차들 = 직급별.map((r) => (r.남평균 != null && r.여평균 != null ? 한자리(r.남평균 - r.여평균) : null));
  if (차들.some((v) => v == null)) return null;
  const 맨위 = 차들[차들.length - 1];
  const 나머지 = 차들.slice(0, -1);
  return { 차들, 맨위, 나머지최대: Math.max(...나머지), 제일큰가: 맨위 > Math.max(...나머지) };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 소수를 읽는다', 수로('3.2') === 3.2);
  본다('③ 맨 위 칸 차이가 제일 크면 참', 맨위직급이제일크나([
    { 남평균: 3.0, 여평균: 2.8 }, { 남평균: 3.1, 여평균: 3.2 }, { 남평균: 3.9, 여평균: 3.3 },
  ]).제일큰가 === true);
  본다('④ 중간 칸이 더 크면 거짓', 맨위직급이제일크나([
    { 남평균: 3.0, 여평균: 2.5 }, { 남평균: 3.1, 여평균: 3.2 }, { 남평균: 3.4, 여평균: 3.3 },
  ]).제일큰가 === false);
  본다('⑤ 값이 없으면 못 잰다', 맨위직급이제일크나([{ 남평균: 3.0, 여평균: null }]) === null);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-promotion.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const j = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}`
    + `&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&itmId=ALL&objL1=ALL&objL2=ALL&prdSe=Y&newEstPrdCnt=10`)).json();
  if (!Array.isArray(j)) throw new Error(`${TBL}: ${JSON.stringify(j).slice(0, 150)}`);

  const 해들 = [...new Set(j.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];
  const 값 = (해, c1, c2, itm) => 수로(j.find((x) => x.PRD_DE === 해 && x.C1_NM === c1 && x.C2_NM === c2 && x.ITM_NM === itm)?.DT);

  const 흐름 = 해들.map((해) => ({
    해, 여평균: 값(해, '전체', '여성', '평균'), 남평균: 값(해, '전체', '남성', '평균'),
  })).filter((r) => r.여평균 != null);

  const 분포_여 = Object.fromEntries(척도.map((itm) => [itm, 값(최신, '전체', '여성', itm)]));
  const 분포_남 = Object.fromEntries(척도.map((itm) => [itm, 값(최신, '전체', '남성', itm)]));

  const 직급칸 = ['과장급(이하)', '차장급', '부장급', '임원급'];
  const 직급별 = 직급칸.map((칸) => ({
    칸, 여평균: 값(최신, 칸, '여성', '평균'), 남평균: 값(최신, 칸, '남성', '평균'),
  }));

  /* 🔴 자가 대조 — 5점 척도 응답 비율을 다 더하면 100이어야 한다(반올림 오차 0.5 안) */
  const 여합 = Object.values(분포_여).reduce((s, v) => s + (v ?? 0), 0);
  const 남합 = Object.values(분포_남).reduce((s, v) => s + (v ?? 0), 0);
  const 자가대조 = {
    '5점 척도 합 = 100(여성)': { 합: 한자리(여합), 맞나: Math.abs(여합 - 100) < 0.5 },
    '5점 척도 합 = 100(남성)': { 합: 한자리(남합), 맞나: Math.abs(남합 - 100) < 0.5 },
    뜻: '다섯 응답을 다 더하면 100이어야 한다. 반올림으로 0.5 안은 어긋난 것이 아니다',
  };

  const 맨위차 = 맨위직급이제일크나(직급별);
  const 최신흐름 = 흐름.find((r) => r.해 === 최신);

  const 낸다 = {
    무엇: '승진에 만족하는 사람이 몇 %일까, 직급이 오를수록 성별 차가 벌어지나',
    만든날: new Date().toISOString().slice(0, 10),
    최신, 해들, 해수: 해들.length,
    출처: {
      기관: '한국여성정책연구원',
      표: '여성관리자패널조사 「직장 만족도(격년) - 승진」',
      창구: 'KOSIS', orgId: ORG, tblId: TBL,
    },
    '⚠ 이 자료가 못 가르는 것': [
      '전 국민 표본이 아닙니다. 여성 관리자가 있는 사업체(대개 100인 이상) 패널입니다 — 소규모 사업장·자영업은 이 표에 없습니다.',
      '격년 조사입니다(2020·2022·2024). 해마다의 움직임은 못 봅니다.',
      '「만족도」는 자기 응답입니다. 실제 승진 속도나 승진 여부를 재는 표가 아닙니다.',
    ],
    흐름, 최신흐름, 분포_여, 분포_남, 직급별, 맨위차, 자가대조,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/promotion.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   ${해들[0]}~${최신} (${해들.length}번 조사) · ${최신}년 평균 여 ${최신흐름.여평균} · 남 ${최신흐름.남평균}`);
  console.log(`   직급별(여→남): ${직급별.map((r) => `${r.칸} ${r.여평균}→${r.남평균}`).join(' · ')}`);
  console.log(`   맨 위 직급(임원급) 차가 제일 큼: ${맨위차 ? (맨위차.제일큰가 ? '맞다' : '아니다') : '못 쟀다'} (맨위 ${맨위차?.맨위} vs 나머지 최대 ${맨위차?.나머지최대})`);
  console.log(`   자가대조: 여성 5점합 ${자가대조['5점 척도 합 = 100(여성)'].합} · 남성 5점합 ${자가대조['5점 척도 합 = 100(남성)'].합}`);
}
