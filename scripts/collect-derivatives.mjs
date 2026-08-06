#!/usr/bin/env node
/**
 * **파생상품시세** 수집 — 통화선물(fx) · 지수선물(equities) · 국채선물(rates).
 *
 *   npm run collect:derivatives                       어제치 (기본)
 *   npm run collect:derivatives -- --date 20260803
 *   npm run collect:derivatives -- --from 20260701 --to 20260803
 *   npm run collect:derivatives -- --all              전체 이력 (이어받기 됨)
 *
 * ── ⚠ 이 API 를 찾는 데 몇 주가 걸렸다. 원인은 URL 한 조각이었다 ────
 * `watch-approvals.mjs` 에 적혀 있던 주소는 이랬다.
 *   ✕ apis.data.go.kr/1160100/GetDerivativeProductInfoService/getStockFuturesPriceInfo
 *   ✅ apis.data.go.kr/1160100/「service」/GetDerivativeProductInfoService/getStockFuturesPriceInfo
 * 「slash service slash」 가 빠져 있었다. 그래서 400 이 났고 나는 그걸 **「미승인」으로 읽었다.**
 * 같은 1160100 계열인데 어떤 건 「slash service slash」 가 있고 어떤 건 없다. **확인하고 쓴다.**
 *
 * ── ⭐ 왜 이게 fx 축인가 ───────────────────────────────────────
 * `CLAUDE.md`: 「선물·옵션은 별도 카테고리가 아니라 **기초자산이 속한 시장**에 넣는다
 *   (코스피200선물→equities, 달러선물→fx, 국채선물→rates)」
 * 이 한 오퍼레이션에 **미국달러·유로·엔·위안 선물이 다 들어 있다.**
 * 한국은행 ECOS 나 수출입은행 키가 없어도 **fx 축이 열린다.**
 *
 * ── 무엇이 오나 ────────────────────────────────────────────────
 *   basDt   기준일        prdCtg  상품분류(「파생 선물 미국달러」 꼴)
 *   itmsNm  종목명        srtnCd/isinCd 코드
 *   clpr    종가          mkp/hipr/lopr 시·고·저
 *   sptPrc  **기초자산가격**    stmPrc  **이론가**
 *   trqu    거래량        trPrc   거래대금      opnint  **미결제약정**
 *
 * ⚠ `clpr` 이 **0 으로 오는 종목이 대부분**이다(3,566건 중 거래된 건 663건).
 *   0 은 「가격이 0」이 아니라 **「그날 거래가 없었다」**다. 값으로 쓰면 전부 망가진다.
 *   그래서 0 은 `null` 로 바꿔 넣는다 — 뒤에서 셀 때 「없음」과 「0원」을 구분해야 한다.
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · **T+1**. 기본이 어제다
 * · 시각은 **KST**. `toISOString()` 을 쓰지 않는다
 * · `DATAGO_KEY` 는 **이미 URL 인코딩돼 있다.** 다시 인코딩하면 403
 * · `--all` 은 **50쪽마다 디스크에 떨군다.** 「끝나고 저장」으로 짰다가
 *   채권 백필을 94% 에서 통째로 날린 적이 있다. 되풀이하지 않는다
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { put, storeStatus, remoteEnabled } from '../src/lib/store.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getStockFuturesPriceInfo';
const OUT_DIR = path.resolve('archive/raw/derivatives');
const 진행파일 = path.join(OUT_DIR, '.backfill-progress.json');
const 쪽크기 = 1000;
const 간격ms = 250;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DATAGO_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DATAGO_KEY ?? '';
}

/** ⚠ 이 PC 는 이미 KST 다 */
export function 날짜문자(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
export function 어제() { const d = new Date(); d.setDate(d.getDate() - 1); return 날짜문자(d); }

export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
/** ⚠ 가격 0 은 「거래 없음」이다. 0 원이 아니다 */
const 가격 = (v) => { const n = 수(v); return n === 0 ? null : n; };

/**
 * 상품분류에서 **기초자산 축**을 뽑는다.
 * `prdCtg` 는 「파생 선물 미국달러」·「파생 플렉스선물 삼성전자」 꼴이다.
 *
 * ⚠ 축을 못 가리면 `null` 로 둔다. **억지로 equities 에 넣지 않는다** —
 *   기초자산을 모르면서 시장을 정하면 그 뒤 집계가 전부 조용히 틀어진다.
 */
export function 축가리기(prdCtg, itmsNm) {
  const t = `${prdCtg ?? ''} ${itmsNm ?? ''}`;

  /* ⚠ **지수를 먼저 걸러낸다.** 안 그러면 「유로스톡스50」이 「유로」에 걸려 fx 로 간다.
   *   실제로 그렇게 넣었다가 잡았다 — 유럽 주가지수를 통화 축에 넣은 것이다.
   *   이런 오분류는 에러가 안 나고 **집계에서 조용히 틀린다.** 순서가 곧 규칙이다. */
  if (/스톡스|STOXX|니케이|Nikkei|항셍|S&P|나스닥/i.test(t)) return 'equities';

  /*
   * 통화는 **종목명 앞머리**로 가린다.
   *
   * ⚠ 여기서 두 번 틀렸다. 되풀이하지 말 것.
   *   ① `\b` 를 썼다 → **한글 뒤에서는 안 먹는다.** JS 의 `\b` 는 [A-Za-z0-9_] 기준이라
   *      「미국달러」 다음이 공백이어도 경계로 안 친다. 그래서 전부 빠져나갔다
   *   ② `선물 미국달러$` 로 끝을 고정했다 → 실제 값은 **「파생 선물 미국달러 (주간)」** 이다.
   *      뒤에 「(주간)」이 붙어 앵커가 안 맞았다
   *   결과: 진짜 달러선물이 equities 로, 거래가 0인 플렉스만 fx 로 갔다. **정확히 반대**였다.
   *   → 낱말 뒤를 `(\s|\(|$)` 로 본다. 한글 경계는 직접 적어야 한다.
   */
  const 통화 = '(미국달러|유로|엔|위안)';
  if (new RegExp(`^${통화}(\\s|$)`).test((itmsNm ?? '').trim())) return 'fx';
  if (new RegExp(`선물\\s*${통화}(\\s|\\(|$)`).test(prdCtg ?? '')) return 'fx';

  if (/국채|국고|금리|CD|KOFR/.test(t)) return 'rates';
  if (/금\s|은\s|돈육|원유/.test(t)) return 'commodities';
  if (/코스피|코스닥|KRX|섹터|배당|변동성/.test(t)) return 'equities';
  if (/파생\s*(플렉스)?선물/.test(prdCtg ?? '')) return 'equities';  /* 개별주식선물 */
  return null;
}

export function 정리(x) {
  return {
    일자: x.basDt,
    분류: (x.prdCtg ?? '').trim() || null,
    축: 축가리기(x.prdCtg, x.itmsNm),
    코드: (x.srtnCd ?? '').trim() || null,
    isin: (x.isinCd ?? '').trim() || null,
    이름: (x.itmsNm ?? '').replace(/\s+/g, ' ').trim(),
    종가: 가격(x.clpr), 전일비: 수(x.vs),
    시가: 가격(x.mkp), 고가: 가격(x.hipr), 저가: 가격(x.lopr),
    기초자산가: 가격(x.sptPrc), 이론가: 가격(x.stmPrc),
    거래량: 수(x.trqu), 거래대금: 수(x.trPrc), 미결제약정: 수(x.opnint),
  };
}

async function 한쪽(키, 쪽, 일자) {
  const q = 일자 ? `&basDt=${일자}` : '';
  const u = `${BASE}?serviceKey=${키}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json${q}`;
  const r = await fetch(u, { signal: AbortSignal.timeout(45000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 110)}`); }
  const h = j.response?.header ?? j.OpenAPI_ServiceResponse?.cmmMsgHeader;
  const 코드 = h?.resultCode ?? h?.returnReasonCode;
  /* ⚠ 400 은 미승인이 아니라 **내 URL 이 틀린 것**이다. 메시지를 그대로 올린다 */
  if (코드 && 코드 !== '00') throw new Error(`${코드} ${h.resultMsg ?? h.returnAuthMsg ?? ''}`);
  const b = j.response?.body;
  return { 항목: b?.items?.item ? [].concat(b.items.item) : [], 총: Number(b?.totalCount ?? 0) };
}

/** 날짜별로 갈라 파일에 붙인다. 이미 있는 줄은 건너뛴다(멱등).
    store.put 은 로컬(archive/)과 R2 양쪽에 쓴다 — 예전엔 로컬에만 쌓였다. 기존 병합은
    로컬 파일에서 읽는다(put 이 로컬도 쓰므로 다음 호출에서 그대로 이어진다). */
async function 떨구기(날별) {
  for (const [일자, rows] of Object.entries(날별)) {
    const f = path.join(OUT_DIR, `${일자}.ndjson`);
    const 기존 = existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean) : [];
    const 본 = new Set(기존);
    const 새 = rows.map((r) => JSON.stringify(r)).filter((s) => !본.has(s));
    if (새.length) {
      const res = await put(`raw/derivatives/${일자}.ndjson`, [...기존, ...새].join('\n') + '\n', 'application/x-ndjson');
      if (res.remoteError) console.warn(`  ⚠ ${일자} R2 실패: ${String(res.remoteError).slice(0, 80)} (로컬엔 있다)`);
    }
  }
}

async function 하루(키, 일자) {
  const 날별 = {};
  let 받음 = 0;
  for (let 쪽 = 1; ; 쪽++) {
    const { 항목, 총 } = await 한쪽(키, 쪽, 일자);
    for (const x of 항목) { const r = 정리(x); (날별[r.일자] ??= []).push(r); }
    받음 += 항목.length;
    if (받음 >= 총 || !항목.length) break;
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  await 떨구기(날별);
  return 받음;
}

/** 전체 이력. **50쪽마다 저장하고 진행쪽을 남긴다** — 끊겨도 이어받는다 */
async function 전체(키) {
  let 시작 = 1;
  if (existsSync(진행파일)) { try { 시작 = JSON.parse(readFileSync(진행파일, 'utf8')).다음쪽 ?? 1; } catch {} }
  console.log(`전체 이력 — ${시작}쪽부터`);
  let 날별 = {}, 누적 = (시작 - 1) * 쪽크기;
  for (let 쪽 = 시작; ; 쪽++) {
    let 결과;
    try { 결과 = await 한쪽(키, 쪽, null); }
    catch (e) { console.error(`  ${쪽}쪽 실패 ${String(e.message).slice(0, 60)} — 다시`); await new Promise((x) => setTimeout(x, 2500)); 쪽--; continue; }
    for (const x of 결과.항목) { const r = 정리(x); (날별[r.일자] ??= []).push(r); }
    누적 += 결과.항목.length;
    if (쪽 % 50 === 0) {
      await 떨구기(날별); 날별 = {};
      writeFileSync(진행파일, JSON.stringify({ 다음쪽: 쪽 + 1 }));
      console.log(`  ${쪽}쪽 · ${누적.toLocaleString()}/${결과.총.toLocaleString()} — 떨궜다`);
    }
    if (누적 >= 결과.총 || !결과.항목.length) {
      await 떨구기(날별);
      writeFileSync(진행파일, JSON.stringify({ 다음쪽: 쪽 + 1, 완료: true }));
      break;
    }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  return 누적;
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DATAGO_KEY 가 없다.'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  if (!remoteEnabled) console.warn('⚠ R2 미설정(ARCHIVE_S3_*): 로컬에만 저장된다. 운영·백업이면 .env 를 확인하라.');
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };

  if (process.argv.includes('--all')) {
    const n = await 전체(키);
    const f = readdirSync(OUT_DIR).filter((x) => x.endsWith('.ndjson')).sort();
    console.log(`\n완료 ${n.toLocaleString()}건 · ${f.length}일 · ${f[0]?.slice(0, 8)} ~ ${f[f.length - 1]?.slice(0, 8)}`);
    return;
  }

  let 날들 = [];
  const 하루치 = arg('--date'), 부터 = arg('--from'), 까지 = arg('--to');
  if (하루치) 날들 = [하루치];
  else if (부터 && 까지) {
    const d = new Date(+부터.slice(0, 4), +부터.slice(4, 6) - 1, +부터.slice(6, 8));
    const e = new Date(+까지.slice(0, 4), +까지.slice(4, 6) - 1, +까지.slice(6, 8));
    for (; d <= e; d.setDate(d.getDate() + 1)) 날들.push(날짜문자(d));
  } else 날들 = [어제()];   /* ⚠ T+1 */

  let 합 = 0;
  for (const 일자 of 날들) {
    try {
      const n = await 하루(키, 일자);
      if (!n) { console.log(`  ${일자}  0건 (휴장일일 수 있다)`); continue; }
      console.log(`✅ ${일자}  ${n.toLocaleString()}건`);
      합 += n;
    } catch (e) { console.error(`✕ ${일자}  ${String(e.message).slice(0, 90)}`); }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n합계 ${합.toLocaleString()}건 · ${OUT_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
