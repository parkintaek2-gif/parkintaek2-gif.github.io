/**
 * collect-100y-golf.mjs — 나이대별 골프 참여율(최근 1년간 참여 경험)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 자동완성 실측(2026-08-25) — 「골프 인구」 10줄(골프 인구·골프 인구 감소·골프 인구
 * 통계·골프 인구 추이·골프 인구 증가·파크 골프 인구·한국 골프 인구·미국 골프 인구·
 * 일본 골프 인구·전세계 골프 인구) — 오늘 잰 것 중 가장 강한 신호. 신호가 확인된
 * 뒤에야 표를 찾았다(짐작으로 먼저 안 만든다).
 *
 * ── 표 함정 — /hiking 낼 때 이미 겪은 것과 같다 ─────────────────
 * `objL1=ALL`로 통째로 받으면 «성별×나이 교차»(예: 005001005 = 남자+50대) 줄과
 * «나이만»(004005 = 50대) 줄이 **같은 이름("50대")으로 섞여 나온다.** 나이만 있는
 * 6자리 코드(`004\d{3}$`)만 골랐다 — collect-100y-hiking.mjs 와 같은 방식.
 *
 * 쓰는 법  node scripts/collect-100y-golf.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '113';
export const TBL = 'DT_113_STBL_1029668';
export const 종목 = '골프';
export const 해수 = 5;

const 나이코드 = { '004001': '10대', '004002': '20대', '004003': '30대', '004004': '40대', '004005': '50대', '004006': '60대', '004007': '70세이상' };

/** ⛔ 「전체」·「나이만」 코드만 남긴다. 성별×나이 교차(9자리)는 뺀다 */
export function 나이만인가(C1) {
  const 조각 = C1.split('.')[1] ?? '';
  return 조각 === '001' || Object.keys(나이코드).includes(조각);
}

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 「전체」 코드를 남긴다', 나이만인가('131021315501.001'));
  본다('② 나이만(6자리) 코드를 남긴다', 나이만인가('131021315501.004004'));
  본다('③ 성별×나이 교차(9자리, 남자)는 뺀다', !나이만인가('131021315501.005001004'));
  본다('④ 성별×나이 교차(9자리, 여자)는 뺀다', !나이만인가('131021315501.005002004'));
  본다('⑤ 지역유형·소득 코드는 뺀다', !나이만인가('131021315501.002001') && !나이만인가('131021315501.006001'));
  본다('⑥ 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('⑦ 쉼표 든 수를 읽는다', 수로('1,234') === 1234);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-golf.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
    + `&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=Y&newEstPrdCnt=${해수}`;
  const 날 = await (await fetch(u)).json();
  if (!Array.isArray(날)) { console.log('🔴 못 받았다 —', JSON.stringify(날).slice(0, 200)); process.exit(1); }

  const 골프줄 = 날.filter((x) => x.ITM_NM === 종목 && 나이만인가(x.C1));
  const 해들 = [...new Set(골프줄.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];

  const 해별 = {};
  for (const 해 of 해들) {
    const 이해줄 = 골프줄.filter((x) => x.PRD_DE === 해);
    const 전국 = 수로(이해줄.find((x) => x.C1.endsWith('.001'))?.DT);
    const 나이별 = Object.entries(나이코드).map(([코드, 이름]) => ({
      칸: 이름,
      참여율: 수로(이해줄.find((x) => x.C1.endsWith('.' + 코드))?.DT),
    }));
    해별[해] = { 전국, 나이별 };
  }

  const 이번 = 해별[최신];
  const 최고 = 이번.나이별.reduce((a, b) => (b.참여율 != null && (a.참여율 == null || b.참여율 > a.참여율) ? b : a));

  const 낸다 = {
    무엇: '나이대별 골프 참여율 — 최근 1년간 참여 경험(복수응답)',
    만든날: new Date().toISOString().slice(0, 10),
    출처: { 기관: '문화체육관광부', 표: '최근 1년간 참여 경험이 있는 체육활동(복수응답, 상위 10개 종목)', 창구: '국가데이터처 KOSIS', orgId: ORG, tblId: TBL },
    단위: '%',
    정의: '최근 1년 동안 골프를 해 본 적이 있다고 답한 사람의 비율입니다(복수응답 — 다른 운동도 같이 했을 수 있습니다). 매일·매주 하는 사람만이 아닙니다.',
    '⚠ 이 자료가 못 가르는 것': [
      '표본조사입니다. 나이대별 표본 크기가 달라 작은 칸일수록 오차가 큽니다.',
      '「참여 경험」이라 강도·빈도(라운드 한 번과 매주 나가는 사람을 못 가릅니다)를 못 잽니다.',
      '성별×나이를 교차한 값은 이 표에도 있지만(예: 남자 50대만) 이 지면은 나이만 봅니다 — 성별로 가르지 않았습니다.',
      '2025년 한 해만 있습니다 — 그 전 해(2022~2024)는 항목 이름이 「골프(그라운드 파크 포함)」로 달라 재는 범위가 다를 수 있어 한 줄로 잇지 않았습니다.',
    ],
    해들, 최신, 해별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/golf.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${최신}년 전국 ${이번.전국}% · 가장 높은 나이대 ${최고.칸}(${최고.참여율}%)`);
  console.log(`   해: ${해들.join(' · ')}`);
}
