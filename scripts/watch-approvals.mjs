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
 *   경로가 틀리면 404 가 아니라 401/403 이 와서 「미승인」으로 오독된다.
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
    url: 'https://apis.data.go.kr/1160100/service/GetBondSecuritiesInfoService/getBondBasiInfo' },
  { id: '15094802', 이름: '파생상품시세정보', 축: '선물·옵션',
    url: 'https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getFutresPriceInfo' },
  { id: '15094805', 이름: '일반상품시세정보', 축: 'Commodities',
    url: 'https://apis.data.go.kr/1160100/service/GetGeneralProductInfoService/getOilPriceInfo' },
  { id: '15043423', 이름: '주식발행정보', 축: 'Equities',
    url: 'https://apis.data.go.kr/1160100/service/GetStocIssuInfoService/getItemBasiInfo' },
  { id: '15094792', 이름: '펀드상품기본정보', 축: 'Funds',
    url: 'https://apis.data.go.kr/1160100/service/GetFundInfoService/getFundBasiInfo' },
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
      ?? `HTTP ${r.status}`;
    return { 상태: '대기', 사유 };
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

  if (JSON출력) { console.log(JSON.stringify(결과, null, 2)); return; }

  console.log(`API 승인 확인 — ${결과.at} KST\n`);
  const 승인 = 결과.공공데이터.filter((x) => x.상태 === '승인');
  for (const r of 결과.공공데이터) {
    const 표 = r.상태 === '승인' ? '✅' : r.상태 === '대기' ? '⬜' : '⚠';
    console.log(
      `  ${표} ${(r.이름 ?? '').padEnd(16)} ${(r.축 ?? '').padEnd(12)} ${r.상태}` +
        (r.총건수 ? ` · ${Number(r.총건수).toLocaleString()}건` : '') +
        (r.사유 ? ` · ${r.사유}` : ''),
    );
  }
  console.log(`\n  DART  ${결과.DART.상태}${결과.DART.사유 ? ' · ' + 결과.DART.사유 : ''}`);
  console.log(`\n  공공데이터 승인 ${승인.length}/${결과.공공데이터.length}`);

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
