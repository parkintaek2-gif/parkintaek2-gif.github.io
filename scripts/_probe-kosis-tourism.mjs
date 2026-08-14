/**
 * **KOSIS 에 관광·항공 통계가 있나 재 본 자국.** ⛔ 「TourAPI 가 막혔으니 못 한다」로 끝내지 않았다.
 *
 * 사장님 지시: 「한국 관광객들의 국적별 통계, 항공 운항횟수나 승객 통계 등이 의미가 있을 수 있겠다」
 *   TourAPI 는 활용신청이 안 붙어 막혀 있다. 그래서 저는 「막혔다」고 적어 두었다.
 *   ⛔ **문이 하나뿐이라고 누가 정했나.** KOSIS 열쇠는 살아 있었고, 거기 다 있었다.
 *
 * ── 찾은 것 (2026-08-15 실측) ─────────────────────────────────
 * ```
 * DT_920005_B005  org 381  국제선 지역별 통계 (한국공항공사)  ← 운항·여객·화물
 * DT_920005_B004  org 381  국내선 노선별 통계
 * DT_113005_FILE2025       주요관광지점입장객통계 (문체부)   ⚠ (파일) 표시 — API 아닐 수 있다
 * DT_113_STBL_*            외래관광객 지출·만족도 (문체부)
 * ```
 * ⭐ H2_16「주요관광지점입장객통계」가 값이 제일 크다 — 우리 자료는 **읽힘**인데
 *   그것은 **실제로 간 사람 수**다. 둘을 나란히 놓으면 「읽는 곳과 가는 곳이 같은가」를 물을 수 있다.
 *
 * ── 길을 찾으며 세 번 틀렸다. 그 자국을 남긴다 ────────────────
 * ⛔ `statisticsList.do` 에 `searchNm` 을 줘도 **무시하고 주제 30개**를 준다. 검색이 아니다.
 *    검색은 `statisticsSearch.do` 다.
 * ⛔ 조사 아래(`parentListId=H2_16`)에는 표가 없다 —「데이터가 존재하지 않습니다」.
 * ⛔ `orgId` 를 표 이름(920005)에서 짐작했는데 **틀렸다.** 검색 결과의 `ORG_ID`(381)를 쓴다.
 * ⛔ `objL1` 만 주면 「필수요청변수값 누락(objL)」이 난다. `objL2` 까지 줘야 한다.
 *
 * 쓰는 법
 *   node scripts/_probe-kosis-tourism.mjs 찾을낱말
 *   node scripts/_probe-kosis-tourism.mjs --받기 381 DT_920005_B005
 */
import fs from 'node:fs';

const KEY = (fs.readFileSync('.env', 'utf8').match(/^KOSIS_API_KEY=(.+)$/m) ?? [])[1]?.trim();
if (!KEY) { console.error('⛔ .env 에 KOSIS_API_KEY 가 없다'); process.exit(1); }

/** ⭐ 표를 찾는다. ⛔ statisticsList.do 가 아니라 **statisticsSearch.do** 다 */
export async function 표찾기(낱말) {
  const u = `https://kosis.kr/openapi/statisticsSearch.do?method=getList&apiKey=${KEY}`
    + `&searchNm=${encodeURIComponent(낱말)}&format=json&jsonVD=Y`;
  const t = await (await fetch(u)).text();
  try {
    const j = JSON.parse(t);
    return Array.isArray(j) ? j : { 탈: JSON.stringify(j).slice(0, 160) };
  } catch { return { 탈: t.slice(0, 160) }; }
}

/** ⚠ objL2 까지 줘야 한다. objL1 만 주면 누락으로 선다 */
export async function 자료받기(orgId, tblId, 몇해 = 2) {
  const u = 'https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList'
    + `&apiKey=${KEY}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y`
    + `&prdSe=Y&newEstPrdCnt=${몇해}&orgId=${orgId}&tblId=${tblId}`;
  const t = await (await fetch(u)).text();
  try {
    const j = JSON.parse(t);
    return Array.isArray(j) ? j : { 탈: JSON.stringify(j).slice(0, 160) };
  } catch { return { 탈: t.slice(0, 160) }; }
}

const 인자 = process.argv.slice(2);
if (인자[0] === '--받기') {
  const r = await 자료받기(인자[1], 인자[2]);
  if (r.탈) { console.error(`🔴 ${r.탈}`); process.exit(1); }
  console.log(`✅ ${인자[2]} — ${r.length}줄`);
  for (const x of r.slice(0, 10)) {
    console.log(`   ${[x.PRD_DE, x.C1_NM, x.C2_NM, x.ITM_NM, x.DT, x.UNIT_NM].filter(Boolean).join(' | ')}`);
  }
} else {
  for (const 낱 of (인자.length ? 인자 : ['국제선 지역별', '주요관광지점입장객'])) {
    const r = await 표찾기(낱);
    if (r.탈) { console.log(`🔴 ${낱} — ${r.탈}`); continue; }
    console.log(`\n━━ 「${낱}」 ${r.length}건`);
    for (const x of r.slice(0, 6)) {
      console.log(`   org ${String(x.ORG_ID).padEnd(6)} ${String(x.TBL_ID).padEnd(20)} `
        + `${String(x.TBL_NM).slice(0, 40)}  [${x.ORG_NM ?? ''}]`);
    }
    await new Promise((s) => setTimeout(s, 400));
  }
}
