/**
 * collect-100y-parental-leave.mjs — 부모 나이대별 육아휴직 사용률(2015~2024)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 자동완성 실측(2026-08-25) — 「육아휴직 사용률」 10줄(공시·계산·남성/여성/한국/OECD/
 * 대기업/기업별 육아휴직 사용률 등) — 오늘 잰 것 중 등산 다음으로 강한 신호.
 *
 * ── 표 (통계청, org 101 · DT_CC2024D002) ─────────────────────
 * 「출생아 부모의 육아휴직 사용률」 — 그 해 태어난 아이의 부모 중 육아휴직을 쓴 비율.
 * C1 = 부모 나이대(계·30세 미만·30~34세·35~39세·40세 이상), C2 = 부/모/계.
 * 2015~2024년 10년치가 다 있다 — hiking·workout처럼 매해 이름이 같아 그대로 잇는다.
 *
 * ⚠ 「사용률」의 분모 — «그 해에 아이를 낳은 부모» 중 «육아휴직을 쓴 사람» 비율이다.
 *   전체 부모(육아휴직 대상이 안 되는 사람 포함)의 비율이 아니다. 통계청 정의를 그대로 옮긴다.
 *
 * 쓰는 법  node scripts/collect-100y-parental-leave.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '101';
export const TBL = 'DT_CC2024D002';
export const 해수 = 10;

const 나이순서 = ['30세 미만', '30~34세', '35~39세', '40세 이상'];

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
  본다('① 나이순서가 넷이다', 나이순서.length === 4);
  본다('② 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null);
  본다('③ 쉼표 든 수를 읽는다', 수로('1,234') === 1234);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-parental-leave.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
    + `&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=Y&newEstPrdCnt=${해수}`;
  const 날 = await (await fetch(u)).json();
  if (!Array.isArray(날)) { console.log('🔴 못 받았다 —', JSON.stringify(날).slice(0, 200)); process.exit(1); }

  const 해들 = [...new Set(날.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];

  const 값찾기 = (해, 나이, 부모) => 수로(날.find((x) => x.PRD_DE === 해 && x.C1_NM === 나이 && x.C2_NM === 부모)?.DT);

  const 해별 = {};
  for (const 해 of 해들) {
    const 계 = 값찾기(해, '계', '계');
    const 부 = 값찾기(해, '계', '부');
    const 모 = 값찾기(해, '계', '모');
    const 나이별 = 나이순서.map((나이) => ({ 칸: 나이, 계: 값찾기(해, 나이, '계'), 부: 값찾기(해, 나이, '부'), 모: 값찾기(해, 나이, '모') }));
    해별[해] = { 계, 부, 모, 나이별 };
  }

  const 이번 = 해별[최신];
  const 처음 = 해별[해들[0]];
  const 최고 = 이번.나이별.reduce((a, b) => (b.계 != null && (a.계 == null || b.계 > a.계) ? b : a));

  const 낸다 = {
    무엇: '부모 나이대별 육아휴직 사용률',
    만든날: new Date().toISOString().slice(0, 10),
    출처: { 기관: '통계청', 표: '출생아 부모의 육아휴직 사용률', 창구: '국가데이터처 KOSIS', orgId: ORG, tblId: TBL },
    단위: '%',
    정의: '그 해에 아이가 태어난 부모 가운데 육아휴직을 쓴 사람의 비율입니다. 육아휴직을 쓸 수 없는 처지(자영업·미가입 등)인 부모까지 합친 전체 부모의 비율이 아닙니다.',
    '⚠ 이 자료가 못 가르는 것': [
      '분모가 「그 해 출생아의 부모」입니다 — 고용보험에 가입 안 된 부모(자영업 등)는 애초에 이 표의 모집단에서 빠질 수 있어, 실제 체감보다 비율이 높게 보일 수 있습니다.',
      '몇 개월을 썼는지(하루만 쓴 사람과 1년 다 쓴 사람)는 이 표로 못 가릅니다 — 「썼는지 안 썼는지」만 잽니다.',
      '부·모 나이가 다른 부부는 부·모 각각 자기 나이대에 잡힙니다 — 부부를 한 쌍으로 묶은 값이 아닙니다.',
    ],
    해들, 최신, 해별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/parental-leave.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${최신}년 전체 ${이번.계}%(부 ${이번.부}%·모 ${이번.모}%) · 가장 높은 나이대 ${최고.칸}(${최고.계}%)`);
  console.log(`   ${해들[0]}년 ${처음.계}% → ${최신}년 ${이번.계}%`);
  console.log(`   해: ${해들.join(' · ')}`);
}
