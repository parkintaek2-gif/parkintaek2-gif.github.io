// build-income-distribution.mjs — 소득분배지표(재분배 효과)를 KOSIS에서 «우리가 직접» 뽑는다.
//
// ## 왜 (남이 안 쓴 축)
//   대부분은 지니계수 «하나»만 인용한다. 우리는 «시장소득 vs 처분가능소득»을 나란히 뽑아,
//   세금·이전이 불평등을 얼마나 줄이나(재분배 효과)를 시계열로 보여준다.
//
// ## err21 을 어떻게 풀었나 (2026-09-01, 2번 브라우저 협조 + 6번 탐침)
//   표 DT_1HDALF05 는 차원이 뒤집혀 있었다:
//     · 소득유형 = itmId  (T001 시장소득 · T002 처분가능소득)   ← objL1 아님
//     · 분배지표 = objL2/C2 (10 지니 · 20 5분위배율 · 90 상대빈곤율)  ← 필수
//   objL2 를 빼면 err20(필수 누락), 소득유형을 objL1 에 넣으면 err21. 위 매핑으로 정확히 뽑힌다.
//
// ## 출처·약관
//   국가데이터처 KOSIS(orgId=101) 「소득분배지표」(DT_1HDALF05). 연간. 활용약관 제8조 상업이용 가능·제7조 출처표시.
//   ⛔ 시세 아님(FSC 제4유형 무관). ⛔ 키는 프로그램적으로만 읽고 출력 안 함.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const 지표 = { '10': '지니계수', '20': '5분위배율', '90': '상대빈곤율' };
const 소득 = { T001: '시장소득', T002: '처분가능소득' };

const 받기 = async (itmId, objL2) => {
  const u = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=101&tblId=DT_1HDALF05&itmId=${itmId}&objL1=ALL&objL2=${objL2}&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=20`;
  const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
  const j = JSON.parse(await r.text());
  if (j?.err) throw new Error(`DT_1HDALF05 itm=${itmId} objL2=${objL2} — err ${j.err} ${j.errMsg}`);
  const 연 = {};
  for (const x of j) if (x.DT != null && x.DT !== '') 연[x.PRD_DE] = Number(x.DT);
  return 연;
};

const 결과 = { 표: 'DT_1HDALF05', 출처: '국가데이터처 KOSIS 소득분배지표(orgId=101)', 주기: '연간', 뽑은날: '2026-09-01', 지표: {} };
for (const [코드, 이름] of Object.entries(지표)) {
  결과.지표[이름] = {};
  for (const [itm, sName] of Object.entries(소득)) 결과.지표[이름][sName] = await 받기(itm, 코드);
}

// 검산: 처분가능 < 시장(재분배가 불평등을 «줄인다»)이어야 한다. 아니면 라벨이 뒤집힌 것.
const g = 결과.지표['지니계수'], 최근 = Object.keys(g['시장소득']).sort().at(-1);
const 시 = g['시장소득'][최근], 처 = g['처분가능소득'][최근];
if (!(처 < 시)) throw new Error(`검산 실패 — 처분가능(${처})이 시장(${시})보다 크다. 라벨 확인 필요`);

const 낼곳 = path.join(ROOT, 'src', 'data', 'income-distribution.json');
fs.writeFileSync(낼곳, JSON.stringify(결과, null, 2));
console.log(`소득분배지표 — ${최근}년 지니 시장 ${시} → 처분가능 ${처} (재분배가 ${(시-처).toFixed(3)} 낮춤). 저장: ${낼곳}`);
