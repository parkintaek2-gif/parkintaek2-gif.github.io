// build-smb-bsi.mjs — 소상공인 경기전반 BSI, «체감(실적) vs 전망(기대)»을 KOSIS에서 직접 뽑는다.
//
// ## 남이 안 쓴 축
//   대부분 「9월 전망 95.1, 올해 최고」만 보도한다. 우리는 체감(s0)과 전망(s1)을 나란히 뽑아,
//   전망이 체감을 얼마나·얼마나 오래 웃도는지(기대와 실현의 격차)를 시계열로 보여준다.
//   BSI 100 미만 = 악화 우위. 전망조차 100을 거의 못 넘는다.
//
// ## 출처: 중소벤처기업부/소상공인시장진흥공단 「소상공인시장 경기동향(BSI) 조사」
//   KOSIS orgId=142, tblId=DT_S0001N_001(소상공인 부문별 실적 및 전망), 월간, 2014~.
//   itmId s0=체감 · s1=전망, C1=00 경기전반. ⛔ 시세 아님(FSC 무관). ⛔ 키 출력 안 함.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const 받기 = async (itmId) => {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=142&tblId=DT_S0001N_001&itmId=${itmId}&objL1=00&format=json&jsonVD=Y&prdSe=M&newEstPrdCnt=150`;
  const j = JSON.parse(await (await fetch(u, { signal: AbortSignal.timeout(30000) })).text());
  if (j?.err) throw new Error(`DT_S0001N_001 ${itmId} — err ${j.err} ${j.errMsg}`);
  const m = {};
  for (const x of j) if (x.DT != null && x.DT !== '') m[x.PRD_DE] = Number(x.DT);
  return m;
};

const 체감 = await 받기('s0'), 전망 = await 받기('s1');
// 같은 달의 체감 vs 그 달 «직전에 낸 전망»을 견주는 대신, 여기선 동월 체감/전망을 나란히(공표 구조 그대로).
const 달들 = Object.keys(체감).filter((d) => 전망[d] != null).sort();
const 최근 = 달들.slice(-36);
let 전망합 = 0, 체감합 = 0, n = 0, 전망100넘은달 = 0, 체감100넘은달 = 0;
for (const d of 최근) { 전망합 += 전망[d]; 체감합 += 체감[d]; n++; if (전망[d] >= 100) 전망100넘은달++; if (체감[d] >= 100) 체감100넘은달++; }

const 결과 = {
  표: 'DT_S0001N_001 · 소상공인 부문별 실적 및 전망(경기전반)',
  출처: '중소벤처기업부/소상공인시장진흥공단 소상공인시장 경기동향(BSI) 조사, KOSIS orgId=142',
  주기: '월간', 단위: 'BSI(100 초과=호전, 미만=악화)', 뽑은날: '2026-09-01',
  최신월: 달들.at(-1), 체감: 체감, 전망: 전망,
  요약_최근36개월: {
    평균_전망: +(전망합 / n).toFixed(1), 평균_체감: +(체감합 / n).toFixed(1),
    평균_격차_전망빼기체감: +((전망합 - 체감합) / n).toFixed(1),
    전망_100넘은달: `${전망100넘은달}/${n}`, 체감_100넘은달: `${체감100넘은달}/${n}`,
  },
};
// 검산: 전망은 거의 항상 체감보다 높다(기대 > 실현). 아니면 라벨 뒤집힘.
const 높은달 = 최근.filter((d) => 전망[d] > 체감[d]).length;
if (높은달 < 최근.length * 0.8) throw new Error(`검산 실패 — 전망>체감이 ${높은달}/${최근.length}뿐. 라벨 확인`);

fs.writeFileSync(path.join(ROOT, 'src', 'data', 'smb-bsi.json'), JSON.stringify(결과, null, 2));
const r = 결과.요약_최근36개월;
console.log(`소상공인 경기전반 BSI — 최신 ${결과.최신월} 체감 ${체감[달들.at(-1)]}·전망 ${전망[달들.at(-1)]}`);
console.log(`  최근36개월: 평균 전망 ${r.평균_전망} vs 체감 ${r.평균_체감} (격차 ${r.평균_격차_전망빼기체감}) · 전망 100넘은달 ${r.전망_100넘은달} · 체감 100넘은달 ${r.체감_100넘은달}`);
