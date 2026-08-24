/**
 * collect-100y-nursery-fill.mjs — **어린이집 정원 대비 현원**, 시·도별 20해(2006~2025)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 콘텐츠기획서(2026-08-22, 3번_0100세x5분야_콘텐츠기획서)가 「전국 어린이집 대기아동 수」를
 * 최강 신호(자동완성 10/10줄)로 적어 두고 「KOSIS 표를 짧게 찾아봤지만 못 찾았다」고 남겼다.
 *
 * 🔴 **오늘 다시 찾아보니 «대기아동»(줄 서서 기다리는 아이 수) 표 자체는 여전히 없다.**
 *   KOSIS·data.go.kr 어디에도 전국 단위로 관리되는 대기자 명부 통계는 없었다(어린이집은
 *   지자체별로 「아이사랑」 시스템이 따로 관리하지 접수 대기자 수를 전국 통계로 안 낸다).
 *
 * ⭐ 대신 **«정원 대비 현원»**(DT_15407_NN004, 같은 기관·같은 org)을 찾았고, 이것으로
 *   자동완성을 다시 재니 신호가 있었다 — 「어린이집 정원」10줄(그 중 «정원 현원»·
 *   «정원 충족률»이 그대로 들어 있다), 「어린이집 현원」2줄. **대기아동 자체는 못 재지만,
 *   같은 궁금증(자리가 있나 없나)에 더 가깝게 답할 수 있는 표를 실측으로 찾은 것이다.**
 *
 * ⛔ **제목에 「대기아동」을 쓰지 않는다.** 이 표는 «자리(정원)를 채운 비율»이지 대기자
 *   수가 아니다. 채움률이 낮다고 대기가 없다는 뜻도, 채움률이 높다고 대기가 있다는 뜻도
 *   아니다(국공립·인기 시설 쏠림은 이 표로 못 본다 — 전체를 한 덩어리로 합친 값이다).
 *   그래서 제목·본문 모두 **"정원 대비 현원"·"채움률"**로만 적는다.
 *
 * 쓰는 법  node scripts/collect-100y-nursery-fill.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ORG = '112';
export const TBL = 'DT_15407_NN004';
export const 해수 = 20; // 표에 2006~2025 가 다 있다

/** ⛔ 빈칸을 0 으로 만들지 않는다. 「없다」와 「못 받았다」는 다르다 */
export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-' || s === 'X') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 채움률 = 현원 / 정원 × 100. 정원이 0·못잼이면 못잼(null) — 나누기 금지 */
export function 채움률(현원, 정원) {
  if (현원 == null || 정원 == null || 정원 === 0) return null;
  return Math.round((현원 / 정원) * 1000) / 10;
}

/** 시·도 줄만 남긴다 — 전국은 따로 뺀다 */
export function 시도만(줄들) {
  return 줄들.filter((r) => r.시도 !== '전국');
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 빈칸을 0 으로 만들지 않는다', 수로('-') === null && 수로('') === null && 수로(undefined) === null);
  본다('② 쉼표 든 수를 읽는다', 수로('1,234') === 1234);
  본다('③ 채움률 계산이 맞다', 채움률(70, 100) === 70);
  본다('④ 정원 0·못잼이면 못잼(null), 나누기 안 한다', 채움률(10, 0) === null && 채움률(10, null) === null);
  본다('⑤ 전국을 시·도에서 뺀다', 시도만([{ 시도: '전국' }, { 시도: '서울특별시' }]).length === 1);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-100y-nursery-fill.mjs';
if (내가직접불렸나) {
  const KEY = fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/KOSIS_API_KEY\s*=\s*(.+)/)[1].trim();
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=' + KEY
    + `&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&orgId=${ORG}&tblId=${TBL}&prdSe=Y&newEstPrdCnt=${해수}`;
  const 날 = await (await fetch(u)).json();
  if (!Array.isArray(날)) { console.log('🔴 못 받았다 —', JSON.stringify(날).slice(0, 200)); process.exit(1); }

  const 해들 = [...new Set(날.map((x) => x.PRD_DE))].sort();
  const 최신 = 해들[해들.length - 1];
  const 지역들 = [...new Set(날.map((x) => x.C1_NM))];

  const 해별 = {};
  for (const 해 of 해들) {
    const 이해줄 = 날.filter((x) => x.PRD_DE === 해);
    const 시도줄 = 지역들.map((시도) => {
      const 정원 = 수로(이해줄.find((x) => x.C1_NM === 시도 && x.ITM_NM === '정원')?.DT);
      const 현원 = 수로(이해줄.find((x) => x.C1_NM === 시도 && x.ITM_NM === '현원')?.DT);
      return { 시도, 정원, 현원, 채움률: 채움률(현원, 정원) };
    });
    const 전국 = 시도줄.find((r) => r.시도 === '전국');
    해별[해] = { 전국, 시도: 시도만(시도줄).sort((a, b) => (a.채움률 ?? 0) - (b.채움률 ?? 0)) };
  }

  const 이번 = 해별[최신];
  const 처음 = 해별[해들[0]];

  const 낸다 = {
    무엇: '어린이집 정원 대비 현원(채움률) — 시·도별',
    만든날: new Date().toISOString().slice(0, 10),
    출처: { 기관: '보건복지부', 표: '전국 어린이집 정현원 현황', 창구: '국가데이터처 KOSIS', orgId: ORG, tblId: TBL },
    단위: '명(정원·현원) · %(채움률)',
    정의: '정원은 그 어린이집이 받을 수 있는 최대 인원, 현원은 실제로 다니고 있는 인원입니다. 채움률(=현원÷정원×100)이 낮을수록 자리가 남습니다.',
    '⛔ 「대기아동」이 아닙니다': [
      '이 표는 대기자 명부가 아니라 «자리를 얼마나 채웠는가»입니다. 전국·지자체 단위로 관리되는 대기아동 수 통계 자체를 찾지 못했습니다(2026-08-24 재탐색, KOSIS·data.go.kr 모두 없음).',
      '전체를 한 덩어리로 합친 값이라 국공립·인기 시설 쏠림은 못 봅니다 — 채움률이 낮은 시·도에도 특정 시설은 대기가 있을 수 있습니다.',
      '정원 자체가 매년 바뀝니다(문을 닫거나 새로 여는 시설이 있어서) — 채움률 하락이 «아이가 줄어서»인지 «정원이 늘어서»인지 이 표만으로는 못 가릅니다.',
    ],
    해들, 최신, 해별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/nursery-fill.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)} — ${최신}년 전국 정원 ${이번.전국.정원.toLocaleString()} · 현원 ${이번.전국.현원.toLocaleString()} · 채움률 ${이번.전국.채움률}%`);
  console.log(`   ${해들[0]}년 채움률 ${처음.전국.채움률}% → ${최신}년 ${이번.전국.채움률}%`);
  console.log(`   해: ${해들.join(' · ')}`);
}
