// build-smb-bsi-region.mjs — 소상공인 «지역별» 전망 BSI를 KOSIS에서 직접 뽑는다(최신월).
//
// ## 축 (남이 안 쓴)
//   전국 헤드라인 하나가 아니라, 17개 시·도 전망 BSI를 나란히. 어느 지역도 100(중립)을 못 넘는지,
//   대도시와 지방이 어떻게 갈리는지. 100 초과=호전, 미만=악화.
//   ⚠ 국가 최신 헤드라인(예: 9월 전망 95.1)은 KOSIS보다 한 달 앞선 «막 나온» 값 — 지역별은 아직 그 달 미반영.
//   국가 202608 전망 71.0 + 전월비 24.1 = 95.1 로 정합(95.1은 다음 달치).
//
// 출처: 중소벤처기업부/소상공인시장진흥공단 소상공인시장 경기동향(BSI), KOSIS orgId=142, tblId=DT_S0001N_005(소상공인 지역별), itmId s1=전망, 월간.
// ⛔ 시세 아님(FSC 무관). ⛔ 키 출력 안 함.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
  `&orgId=142&tblId=DT_S0001N_005&itmId=s1&objL1=ALL&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=1`;
const j = JSON.parse(await (await fetch(u, { signal: AbortSignal.timeout(30000) })).text());
if (j?.err) throw new Error(`DT_S0001N_005 — err ${j.err} ${j.errMsg}`);
const rows = j.filter((x) => x.DT != null && x.DT !== '').map((x) => ({ 지역: x.C1_NM, 전망: Number(x.DT) }));
rows.sort((a, b) => b.전망 - a.전망);
const 월 = j[0]?.PRD_DE;
const 넘음 = rows.filter((r) => r.전망 >= 100).length;

// 검산: BSI는 상식 범위(0~200), 지역 17개 안팎.
if (rows.length < 15 || rows.some((r) => r.전망 < 0 || r.전망 > 200)) throw new Error('검산 실패 — 지역수/값 범위 이상');

const 결과 = {
  표: 'DT_S0001N_005 · 소상공인 지역별 전망 BSI',
  출처: '중소벤처기업부/소상공인시장진흥공단 소상공인시장 경기동향(BSI), KOSIS orgId=142',
  단위: 'BSI(100 초과=호전, 미만=악화)', 지표: '전망(다음 달 기대)', 최신월: 월, 뽑은날: '2026-09-01',
  '100넘은지역': `${넘음}/${rows.length}`, 최고: rows[0], 최저: rows.at(-1),
  지역별: Object.fromEntries(rows.map((r) => [r.지역, r.전망])),
};
fs.writeFileSync(path.join(ROOT, 'src', 'data', 'smb-bsi-region.json'), JSON.stringify(결과, null, 2));
console.log(`소상공인 지역별 전망 BSI — ${월}: ${rows.length}개 시·도, 100넘음 ${넘음}/${rows.length}`);
console.log(`  최고 ${rows[0].지역} ${rows[0].전망} · 최저 ${rows.at(-1).지역} ${rows.at(-1).전망}`);
