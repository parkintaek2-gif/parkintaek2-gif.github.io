#!/usr/bin/env node
/**
 * collect-100y-tutoring-region.mjs — **지역에 따라 사교육비가 얼마나 다른가**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * `docs/새데이터-KOSIS-후보.md` 후보였던 「지역별 사교육 참여율」(DT_1PE202)을 다시
 * 열어 보니 **이름이 거짓이었다** — 이 표는 참여율이 아니라 **「지역별 학생 1인당
 * 월평균 사교육비」**다. C1="대상분포(%)"행은 참여율이 아니라 **표본의 지역별
 * 인구비중**이었다(대도시 38.3%+대도시이외 61.7%=100%, 서울+광역시=대도시 등
 * 위계 확인함). 참여율은 안 쓰고, 진짜 있는 것(사교육비 지역차)으로 지면을 짓는다.
 *
 * ── 표 ─────────────────────────────────────────────────────────
 *   101/DT_1PE202  「지역별 학생 1인당 월평균 사교육비」— 초중고사교육비조사의
 *   지역 갈래다. `/tutoring`(학교급별, 이미 만든 지면)과 **같은 조사**의 다른 축이라
 *   자를 두 벌로 안 쓴다.
 *
 * ⛔⛔ C1 축과 ITM 축이 뒤집혀 있다 — **지역이 ITM_NM에 있다**(C1_NM은 "사교육비"
 *   같은 항목 이름이다). 짐작으로 짜지 않고 실제로 받아서 자리를 확인했다.
 * ⛔ 2015년엔 "평균"(전체) 행이 원자료에 없다 — 0으로 채우지 않고 못 쟀다로 적는다.
 *
 * 쓰는 법  node scripts/collect-100y-tutoring-region.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기, objL단계찾기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const TBL = 'DT_1PE202';
export const 지역칸들 = ['서  울', '광역시', '중소도시', '읍면지역'];
export const 지역표시 = { '서  울': '서울', '광역시': '광역시', '중소도시': '중소도시', '읍면지역': '읍면지역' };

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('② 지역칸이 넷이다', 지역칸들.length === 4);
  본다('③ 소수 한 자리로 자른다', 수로('66.33812') === 66.3);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-tutoring-region.mjs';
if (내가직접불렸나) {
  const 키 = 키읽기();
  const { 단계 } = await objL단계찾기(키, ORG, TBL);
  if (단계 == null) throw new Error(`${ORG}/${TBL} — objL 1~5단계 다 실패. 표를 의심해야 한다`);

  const objs = Array.from({ length: 단계 }, (_, i) => `&objL${i + 1}=ALL`).join('');
  const j = await (await fetch(
    `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
    `&itmId=ALL${objs}&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=Y&newEstPrdCnt=20`
  )).json();
  if (!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0, 200));

  const 해들 = [...new Set(j.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];
  const 값 = (해, C1, ITM) => 수로(j.find(
    (x) => x.PRD_DE === 해 && x.C1_NM === C1 && x.ITM_NM === ITM)?.DT);

  const 최신지역별 = 지역칸들.map((칸) => ({
    칸: 지역표시[칸],
    사교육비: 값(최신, '사교육비', 칸),
    인구비중: 값(최신, '대상분포(%)', 칸),
  }));
  const 평균 = 값(최신, '사교육비', '평  균');

  const 흐름 = 해들.map((해) => ({
    해,
    평균: 값(해, '사교육비', '평  균'),
    서울: 값(해, '사교육비', '서  울'),
    읍면지역: 값(해, '사교육비', '읍면지역'),
  }));
  const 흐름있는것 = 흐름.filter((r) => r.평균 != null && r.서울 != null && r.읍면지역 != null);
  const 못낸해 = 흐름.filter((r) => r.평균 == null || r.서울 == null || r.읍면지역 == null).map((r) => r.해);

  const 최고 = 최신지역별.reduce((a, b) => (b.사교육비 > a.사교육비 ? b : a));
  const 최저 = 최신지역별.reduce((a, b) => (b.사교육비 < a.사교육비 ? b : a));

  const 자가대조 = {
    '인구비중이 100%인가(서울+광역시+중소도시+읍면지역)': Math.round(최신지역별.reduce((s, r) => s + r.인구비중, 0)) === 100,
  };

  const 자료 = {
    무엇: '지역별 학생 1인당 월평균 사교육비 — 초중고사교육비조사',
    만든날: new Date().toLocaleString('sv-SE').slice(0, 10),
    최신: 최신,
    해수: 해들.length,
    흐름해수: 흐름있는것.length,
    못낸해,
    출처: {
      기관: '국가데이터처',
      표: '초중고사교육비조사 「지역별 학생 1인당 월평균 사교육비」 — /tutoring(학교급별)과 같은 조사',
      창구: 'KOSIS',
      orgId: ORG,
      tblId: TBL,
    },
    '⛔ 표 이름이 거짓이다': '이 표는 "지역별 사교육 참여율"로 불릴 뻔했지만 실제로는 참여율이 아니라 «사교육비 금액»입니다. 「대상분포(%)」행은 참여율이 아니라 표본의 지역별 인구비중입니다.',
    최신지역별,
    전체평균: 평균,
    최고칸: 최고,
    최저칸: 최저,
    흐름,
    자가대조,
  };

  fs.writeFileSync(
    path.join(뿌리, 'src', 'data', '100yearmap', 'tutoring-region.json'),
    JSON.stringify(자료, null, 1) + '\n',
    'utf8',
  );
  console.log(`✅ ${최신}년 — ${최고.칸} ${최고.사교육비}만원 · ${최저.칸} ${최저.사교육비}만원 · 못낸해 ${못낸해.length}개(${못낸해.join(',')}) · 자가대조 ${자가대조['인구비중이 100%인가(서울+광역시+중소도시+읍면지역)']}`);
}
