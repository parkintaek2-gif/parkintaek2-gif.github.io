#!/usr/bin/env node
/**
 * API 승인 확인기 — **하루 두 번 직접 찔러 본다.**
 *
 *   npm run watch:approvals          한 번 확인
 *   npm run watch:approvals -- --json  결과를 JSON 으로
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────
 * 사장님 지시(2026-08-04):
 *   「DART 등 API 신청한 건 **승인 여부를 매일 네가 체크해서** 데이터 수집해.
 *    이메일 와도 바로 확인 못 할 수 있거든」
 *   「**하루에 두 번 직접 찔러보지**」
 *
 * ── ⭐ 핵심 발상 — 웹사이트를 보지 않는다 ──────────────────────
 * 공공데이터포털은 **계정당 인증키가 하나**다. 데이터셋마다 키를 주지 않는다.
 * 승인되면 **그 키로 해당 엔드포인트가 열린다.**
 *
 * 그러므로 **API 응답 자체가 가장 정확한 승인 신호다.**
 * 로그인 세션도, 브라우저도, 스크래핑도 필요 없다. 그냥 찔러 보면 된다.
 *
 *   승인 전  →  HTTP 403 · SERVICE_KEY_IS_NOT_REGISTERED_ERROR
 *   승인 후  →  HTTP 200 · resultCode 00 · NORMAL SERVICE
 *
 * ⚠ `DATAGO_KEY` 는 **이미 URL 인코딩된 값**이다.
 *   `encodeURIComponent` 를 한 번 더 걸면 403 이 온다 — 승인됐는데도 「미승인」으로
 *   읽힌다. 2026-08-04 에 실제로 그렇게 30분을 헤맸다. 그대로 붙인다.
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* .env 를 직접 읽는다 — 런타임 의존성 0개 원칙 */
if (existsSync('.env')) {
  for (const 줄 of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = 줄.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

/**
 * 확인 대상.
 * ⚠ 엔드포인트는 **포털 상세 페이지에 적힌 것**을 쓴다. 지어내지 않는다.
 *
 * ── ⭐ 2026-08-04 에 알아낸 판별법 ────────────────────────────
 * 두 응답을 **절대 섞으면 안 된다.** 몇 주치 보고가 이것 때문에 틀렸다.
 *
 *   400 「해당 오픈API 서비스가 없거나 폐기됨」 · NO_OPENAPI_SERVICE_ERROR
 *       → **경로가 틀렸다.** 승인 여부와 무관하다. 내 URL 을 고쳐야 한다
 *   403 (권한 없음)
 *       → **경로는 맞고 미신청이다.** 이때만 「대기」가 맞다
 *   resultCode 00 · NORMAL SERVICE
 *       → 승인
 *
 * 채권시세를 몇 주째 「대기」로 보고했는데 실은 승인돼 있었다 —
 * 오퍼레이션 이름을 내가 지어내서 400 이 났던 것이다.
 */
const 대상 = [
  { id: '15094775', 이름: 'KRX상장종목정보', 축: '기준정보',
    url: 'https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo' },
  { id: '15094808', 이름: '주식시세정보', 축: 'Equities',
    url: 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo' },
  { id: '15094807', 이름: '지수시세정보', 축: 'Equities',
    url: 'https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex' },
  { id: '15094806', 이름: '증권상품시세정보', 축: 'ETF·ETN·ELW',
    url: 'https://apis.data.go.kr/1160100/service/GetSecuritiesProductInfoService/getETFPriceInfo' },
  { id: '15094784', 이름: '채권시세정보', 축: 'Rates',
    url: 'https://apis.data.go.kr/1160100/service/GetBondSecuritiesInfoService/getBondPriceInfo' },
  { id: '15094802', 이름: '파생상품시세정보', 축: '선물·옵션',
    url: 'https://apis.data.go.kr/1160100/GetDerivativeProductInfoService/getStockFuturesPriceInfo' },
  { id: '15094805', 이름: '일반상품시세정보', 축: 'Commodities',
    url: 'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getOilPriceInfo' },
  { id: '15043423', 이름: '주식발행정보', 축: 'Equities',
    url: 'https://apis.data.go.kr/1160100/GetStocIssuInfoService_V3/getStocIssuInfo_V3' },
  { id: '15094792', 이름: '펀드상품기본정보', 축: 'Funds',
    url: 'https://apis.data.go.kr/1160100/service/GetFundProductInfoService/getStandardCodeInfo' },
  /*
   * ⭐ 국민연금 사업장 — **이직률의 유일한 원천**이다(신규취득자수·상실가입자수).
   *   ⚠ V1(`NpsBplcInfoInqireService`)은 **폐기됐다.** V2 를 쓴다.
   *     V1 → 400 「없거나 폐기됨」 · V2 → 403 (경로는 맞고 미신청)
   *   ⚠ 포털 표기상 **개발·운영 둘 다 자동승인**이다. 신청만 하면 즉시 열린다.
   */
  { id: '3046071', 이름: '국민연금사업장', 축: '이직률',
    url: 'https://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2' },
];

const UA = 'Mozilla/5.0 (compatible; SeoulMarketsBot/0.1; +https://seoulmarkets.com/about)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const 지금 = () => new Date().toLocaleString('ko-KR', { hour12: false }); // 이 PC 는 KST

async function 찔러보기(t, key) {
  /* ⚠ key 를 그대로 붙인다. 이미 인코딩돼 있다 */
  const u = `${t.url}?serviceKey=${key}&numOfRows=1&pageNo=1&resultType=json`;
  try {
    const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
    const txt = await r.text();
    if (r.status === 200 && /"resultCode"\s*:\s*"00"|NORMAL SERVICE/.test(txt)) {
      const 총 = txt.match(/"totalCount"\s*:\s*"?(\d+)/)?.[1] ?? null;
      return { 상태: '승인', 총건수: 총 };
    }
    const 사유 = txt.match(/"?errMsg"?\s*:\s*"?([A-Z_]+)/)?.[1]
      ?? txt.match(/<returnAuthMsg>([^<]+)</)?.[1]
      ?? txt.match(/<errMsg>([^<]+)</)?.[1]
      ?? `HTTP ${r.status}`;
    /*
     * ⭐ **「경로 틀림」과 「미승인」을 가른다.** 섞어서 몇 주치 보고가 틀렸다.
     *   400 / NO_OPENAPI_SERVICE_ERROR / 「없거나 폐기됨」 → **내 URL 이 틀린 것**이다.
     *     이걸 「대기」로 적으면 승인된 걸 미승인으로 보고하게 된다(채권시세가 그랬다)
     *   403 → 경로는 맞고 권한이 없다. 이때만 「대기」가 맞다
     */
    const 경로오류 = r.status === 400
      || /NO_OPENAPI_SERVICE_ERROR/.test(사유)
      || /없거나 폐기/.test(txt);
    return 경로오류
      ? { 상태: '경로오류', 사유: `${사유} — 내 URL 을 고쳐야 한다` }
      : { 상태: '대기', 사유 };
  } catch (e) {
    /* 네트워크 실패를 「미승인」으로 적지 않는다. 그건 다른 사실이다 */
    return { 상태: '확인불가', 사유: e.name };
  }
}

async function main() {
  const JSON출력 = process.argv.includes('--json');
  const key = process.env.DATAGO_KEY;
  const 결과 = { at: 지금(), 공공데이터: [], DART: null };

  if (!key) {
    결과.공공데이터 = [{ 상태: '확인불가', 사유: 'DATAGO_KEY 없음' }];
  } else {
    for (const t of 대상) {
      const r = await 찔러보기(t, key);
      결과.공공데이터.push({ ...t, ...r, url: undefined });
      await sleep(400); // 예의
    }
  }

  /* DART — 키가 없으면 확인할 방법이 없다. 「없다」와 「미승인」을 구분해 적는다 */
  결과.DART = process.env.DART_API_KEY
    ? await (async () => {
        try {
          const r = await fetch(
            `https://opendart.fss.or.kr/api/list.json?crtfc_key=${process.env.DART_API_KEY}&bgn_de=20260801&page_count=1`,
            { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) },
          );
          const j = await r.json();
          return j.status === '000' || j.status === '013'
            ? { 상태: '승인', 코드: j.status }
            : { 상태: '대기', 코드: j.status, 사유: j.message };
        } catch (e) { return { 상태: '확인불가', 사유: e.name }; }
      })()
    : { 상태: '키없음', 사유: '사장님이 opendart.fss.or.kr 에서 발급받아야 한다' };

  /*
   * KDI — **키 하나에 `cd` 값만 다르다.** 그래서 코드별로 따로 찔러야 한다.
   *
   * ⚠ 2026-08-04 에 A만 승인돼 있었다. 신청 URL 이 `openAPIApp?...&type=A` 였고,
   *   KDI 안내가 「① 신청 → ② 신청자 확인 → ③ 승인/**인증키 전송**」이라
   *   **신청마다 키가 따로 올 수 있다.** 그래서 코드별 키를 먼저 보고 없으면 공용 키를 쓴다.
   *     .env — `KDI_API_KEY`(공용) · `KDI_API_KEY_B` … `KDI_API_KEY_F`(코드별)
   *
   * ⚠ 응답이 **EUC-KR** 로 올 때가 있다. UTF-8 로 읽으면 깨져서 원인을 못 찾는다.
   */
  const KDI이름 = { A: '기본연구보고서', B: '현안자료', C: '경제전망', D: '경제동향', E: '학술지', F: '영상보고서' };
  결과.KDI = [];
  for (const cd of Object.keys(KDI이름)) {
    const 키 = process.env[`KDI_API_KEY_${cd}`] || process.env.KDI_API_KEY;
    if (!키) { 결과.KDI.push({ cd, 이름: KDI이름[cd], 상태: '키없음' }); continue; }
    try {
      const r = await fetch(
        `https://www.kdi.re.kr/KDIOpenAPI?type=json&apiKey=${encodeURIComponent(키)}&cd=${cd}`,
        { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(25000) },
      );
      const t = await r.text();
      let j = null;
      try { j = JSON.parse(t); } catch { /* null 이나 EUC-KR 오류쪽 */ }
      결과.KDI.push(j && j.ARCHIVE
        ? { cd, 이름: KDI이름[cd], 상태: '승인', 총건수: j.TOTAL_COUNT ?? null }
        : { cd, 이름: KDI이름[cd], 상태: '대기' });
    } catch (e) { 결과.KDI.push({ cd, 이름: KDI이름[cd], 상태: '확인불가', 사유: e.name }); }
    await sleep(500);
  }

  if (JSON출력) { console.log(JSON.stringify(결과, null, 2)); return; }

  console.log(`API 승인 확인 — ${결과.at} KST\n`);
  const 승인 = 결과.공공데이터.filter((x) => x.상태 === '승인');
  for (const r of 결과.공공데이터) {
    const 표 = r.상태 === '승인' ? '✅' : r.상태 === '대기' ? '⬜' : r.상태 === '경로오류' ? '🔧' : '⚠';
    console.log(
      `  ${표} ${(r.이름 ?? '').padEnd(16)} ${(r.축 ?? '').padEnd(12)} ${r.상태}` +
        (r.총건수 ? ` · ${Number(r.총건수).toLocaleString()}건` : '') +
        (r.사유 ? ` · ${r.사유}` : ''),
    );
  }
  console.log(`\n  DART  ${결과.DART.상태}${결과.DART.사유 ? ' · ' + 결과.DART.사유 : ''}`);

  const KDI승인 = 결과.KDI.filter((x) => x.상태 === '승인');
  console.log('\n  KDI');
  for (const k of 결과.KDI) {
    const 표 = k.상태 === '승인' ? '✅' : k.상태 === '대기' ? '⬜' : '⚠';
    console.log(`    ${표} cd=${k.cd} ${k.이름.padEnd(14)} ${k.상태}` +
      (k.총건수 ? ` · ${Number(k.총건수).toLocaleString()}건` : ''));
  }

  console.log(`\n  공공데이터 ${승인.length}/${결과.공공데이터.length} · KDI ${KDI승인.length}/${결과.KDI.length}`);
  /* ⭐ 새로 열린 게 있으면 눈에 띄게 — 사장님이 메일을 못 보셔도 여기서 드러난다 */
  if (KDI승인.length > 1) console.log(`  ⭐ KDI 코드가 늘었다 — 수집기를 돌린다: npm run collect:kdi`);

  /* 세션 브리핑이 읽는다. 사장님이 메일을 못 보셔도 여기서 드러난다 */
  const 로그 = path.resolve('archive/log');
  mkdirSync(로그, { recursive: true });
  appendFileSync(
    path.join(로그, 'api-approvals.log'),
    `${결과.at}  승인 ${승인.length}/${결과.공공데이터.length}` +
      (승인.length ? ` [${승인.map((x) => x.이름).join(',')}]` : '') +
      `  DART:${결과.DART.상태}\n`,
    'utf8',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
