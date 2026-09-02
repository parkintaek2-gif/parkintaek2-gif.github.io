#!/usr/bin/env node
/**
 * collect-100y-divorce-age.mjs — 「이혼, 몇 살에 하는가」와 「몇 년차에 하는가」를 받는다.
 *
 * ── 왜 이 표를 쓰나 (2026-09-02) ──────────────────────────────
 * /marriage-age(결혼 나이)의 짝이다. 101/DT_1B85011(시도/평균 이혼 연령)로 1990~2025년
 * 전국 평균 이혼 연령 추세를, 101/DT_1B85006(시도/혼인지속기간별 이혼)으로 몇 년차에
 * 이혼하는지 분포를 낸다. 둘 다 인구동향조사(신고 기반 행정통계, 표본조사 아님) — 1962년
 * 통계법 제정 이래 이어진 국가승인통계다.
 *
 * ⛔⛔ statisticsExplData 원문 경고: 「이혼 건수를 혼인 건수와 대비하여 이혼율로 사용하지
 *   않도록 주의」 — 같은 해 이혼/혼인을 나눠 "이혼율 OO%"라고 쓰지 않는다(이혼한 부부가
 *   그 해에 결혼한 부부가 아니므로 분모·분자가 다른 집단이다). 이 자는 그 계산을 안 한다.
 * ⛔ 시도별 표는 「남편 주소지」 기준이다(전국 합계는 이 문제가 없어 전국만 쓴다).
 *
 * 자가시험: node scripts/collect-100y-divorce-age.mjs --selftest
 * 실행:     node scripts/collect-100y-divorce-age.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기 } from './lib/kosis-probe.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼길 = path.join(뿌리, 'src/data/100yearmap/divorce-age.json');

export const 지속기간밴드 = ['0∼4년', '5∼9년', '10∼14년', '15∼19년', '20년이상'];

/** 나이 추세 rows(ITM_NM=남편/아내, PRD_DE=연도, C1_NM=전국)에서 연도별 표를 뽑는다 */
export function 나이추세뽑기(rows) {
  const 전국 = (rows ?? []).filter((r) => r.C1_NM === '전국');
  const 연도들 = [...new Set(전국.map((r) => r.PRD_DE))].sort();
  return 연도들.map((해) => ({
    해,
    남편: 전국.find((r) => r.PRD_DE === 해 && r.ITM_NM === '남편')?.DT ?? null,
    아내: 전국.find((r) => r.PRD_DE === 해 && r.ITM_NM === '아내')?.DT ?? null,
  })).map((r) => ({ ...r, 남편: r.남편 != null ? Number(r.남편) : null, 아내: r.아내 != null ? Number(r.아내) : null }));
}

/** 지속기간 rows(C1_NM=전국·C2_NM=밴드이름, 최신연도)에서 밴드별 건수·비율을 뽑는다 */
export function 지속기간뽑기(rows) {
  const 전국 = (rows ?? []).filter((r) => r.C1_NM === '전국');
  const 전체 = Number(전국.find((r) => r.C2_NM === '계')?.DT ?? NaN);
  const 밴드 = {};
  for (const b of 지속기간밴드) {
    const 건수 = Number(전국.find((r) => r.C2_NM === b)?.DT ?? NaN);
    밴드[b] = {
      건수: Number.isFinite(건수) ? 건수 : null,
      비율: Number.isFinite(건수) && Number.isFinite(전체) && 전체 > 0 ? Math.round((건수 / 전체) * 1000) / 10 : null,
    };
  }
  return { 전체, 밴드 };
}

if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 나이표본 = [
    { C1_NM: '전국', PRD_DE: '1990', ITM_NM: '남편', DT: '36.75' },
    { C1_NM: '전국', PRD_DE: '1990', ITM_NM: '아내', DT: '32.69' },
    { C1_NM: '전국', PRD_DE: '2025', ITM_NM: '남편', DT: '51.02' },
    { C1_NM: '전국', PRD_DE: '2025', ITM_NM: '아내', DT: '47.71' },
    { C1_NM: '서울특별시', PRD_DE: '2025', ITM_NM: '남편', DT: '99' },
  ];
  const 추세 = 나이추세뽑기(나이표본);
  검('전국만 뽑는다(서울 제외)', 추세.length === 2);
  검('연도 오름차순', 추세[0].해 === '1990' && 추세[1].해 === '2025');
  검('숫자로 바꾼다', 추세[0].남편 === 36.75);
  검('⛔ 없는 칸은 null', 나이추세뽑기([{ C1_NM: '전국', PRD_DE: '2000', ITM_NM: '남편', DT: '40' }])[0].아내 === null);

  const 기간표본 = [
    { C1_NM: '전국', C2_NM: '계', DT: '88130' },
    { C1_NM: '전국', C2_NM: '0∼4년', DT: '14392' },
    { C1_NM: '전국', C2_NM: '5∼9년', DT: '15231' },
    { C1_NM: '전국', C2_NM: '10∼14년', DT: '14016' },
    { C1_NM: '전국', C2_NM: '15∼19년', DT: '12194' },
    { C1_NM: '전국', C2_NM: '20년이상', DT: '32297' },
  ];
  const 기간 = 지속기간뽑기(기간표본);
  검('전체 건수를 뽑는다', 기간.전체 === 88130);
  검('20년이상 비율을 낸다', 기간.밴드['20년이상'].비율 === 36.6);
  검('⭐ 20년이상이 최대 밴드다(황혼이혼)', 기간.밴드['20년이상'].건수 > 기간.밴드['0∼4년'].건수);
  검('⛔ 못 잰 밴드는 null', 지속기간뽑기([{ C1_NM: '전국', C2_NM: '계', DT: '100' }]).밴드['0∼4년'].건수 === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ collect-100y-divorce-age 자가시험 통과 (8)');
  process.exit(0);
}

const 키 = 키읽기();

const 나이url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=ALL&objL1=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1B85011&prdSe=Y&newEstPrdCnt=36`;
const 나이원 = await (await fetch(나이url)).json();
if (!Array.isArray(나이원)) { console.error(`⛔ 나이표 못 받음 — ${JSON.stringify(나이원).slice(0, 200)}`); process.exit(1); }
const 나이추세 = 나이추세뽑기(나이원);

const 기간url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}` +
  `&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&orgId=101&tblId=DT_1B85006&prdSe=Y&newEstPrdCnt=1`;
const 기간원 = await (await fetch(기간url)).json();
if (!Array.isArray(기간원)) { console.error(`⛔ 지속기간표 못 받음 — ${JSON.stringify(기간원).slice(0, 200)}`); process.exit(1); }
const 기간연도 = 기간원.find((r) => r.C1_NM === '전국')?.PRD_DE;
const 지속기간 = 지속기간뽑기(기간원);

if (지속기간.밴드['20년이상'].건수 <= 지속기간.밴드['0∼4년'].건수) {
  console.error('⛔ 자가대조 실패 — 알려진 사실(20년이상 밴드가 최대)과 어긋난다. 받은 값을 의심한다.');
  process.exit(1);
}

const 첫해 = 나이추세[0];
const 끝해 = 나이추세[나이추세.length - 1];

const 출력 = {
  출처: {
    이름: '국가데이터처 KOSIS · 「인구동향조사」(신고 기반 행정통계 — 표본조사 아님)',
    표: { 나이: '101/DT_1B85011 (시도/평균 이혼 연령)', 지속기간: '101/DT_1B85006 (시도/혼인지속기간(동거기간)별 이혼)' },
    주의: '이혼 건수를 혼인 건수와 대비해 「이혼율」로 쓰지 않는다(같은 해 이혼·혼인 당사자는 서로 다른 집단). 시도별 표는 남편 주소지 기준이라 전국 합계만 쓴다.',
    이용허락범위: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
  },
  받은때: '2026-09-02',
  나이추세: 나이추세,
  나이_첫해: 첫해,
  나이_최신해: 끝해,
  지속기간_기준연도: 기간연도,
  지속기간: 지속기간,
};

fs.writeFileSync(낼길, JSON.stringify(출력, null, 1));
console.log(`✅ 나이추세 ${나이추세.length}개년(${첫해.해}~${끝해.해}) · 지속기간 기준연도 ${기간연도} → ${path.relative(뿌리, 낼길)}`);
