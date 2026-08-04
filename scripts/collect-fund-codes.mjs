#!/usr/bin/env node
/**
 * **펀드 표준코드** 수집 — 그날 코드가 붙은 펀드.
 *
 *   npm run collect:funds
 *   npm run collect:funds -- --date 20260803
 *   npm run collect:funds -- --from 20200101 --to 20260803
 *
 * ── ⚠ 이건 **명단 스냅숏이 아니다. 「등록 피드」다** ──────────────
 * 실측으로 갈랐다 (지어내지 않았다).
 *
 *   20260803   299건
 *   20250801    25건
 *   두 날의 `srtnCd` 겹침 **0 / 25**
 *
 * 스냅숏이면 대부분 겹쳐야 한다. **하나도 안 겹친다** — 그날 표준코드가 붙은
 * 펀드만 온다는 뜻이다. 그래서 **하루라도 빠뜨리면 그 펀드는 영영 안 들어온다.**
 * 가격처럼 「나중에 다시 받으면 되는」 자료가 아니다.
 *
 * ── 그래서 무엇을 쓸 수 있나 ─────────────────────────────────────
 * 가격·수익률·설정액이 **없다.** 있는 것은 이름·유형·설정일뿐이다.
 * 그러면 못 쓰는 자료인가 — 아니다. **「언제 무엇을 팔기 시작했는가」**가 남는다.
 *
 *   fndNm    펀드 이름     → 주제를 읽는다 (반도체·AI·중국·2차전지…)
 *   fndTp    펀드 유형     → 주식형 · 재간접 · 파생상품 …
 *   setpDt   설정일        → ⚠ `basDt` 와 다르다. 2023년 설정 펀드가 2026년에 등록되기도 한다
 *   basDt    코드 부여일
 *
 * ⭐ 우리는 지수 1,616일치를 갖고 있다. **주제별 펀드 출시 시점과 그 주제 지수의
 *   고점을 맞대면** 「운용사가 언제 팔기 시작했나」를 잴 수 있다.
 *   ⚠ 아직 **재 보지 않았다.** 재기 전에 좋다/나쁘다를 말하지 않는다.
 *
 * ── 실측한 오퍼레이션 ────────────────────────────────────────────
 *   getStandardCodeInfo   ✅  299건/일
 *   getFundPriceInfo · getSecurityFundInfo · getFundBasicInfo ·
 *   getFundProductInfo · getFundSettlementInfo  → 전부 코드 12 「없거나 폐기됨」
 *   ⚠ 12 는 **미승인이 아니라 없는 이름**이다. 403 이라야 미승인이다
 *
 * ── ⚠ 지키는 것 ───────────────────────────────────────────────
 * · **T+1**. 기본이 어제다        · 시각은 **KST**. `toISOString()` 안 쓴다
 * · `DATAGO_KEY` 는 **이미 URL 인코딩돼 있다.** 다시 걸면 403
 * · 하루가 끝나면 **즉시 쓴다.** 끝에 모아서 쓰면 중간에 죽을 때 전부 날린다
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const URL_ = 'https://apis.data.go.kr/1160100/service/GetFundProductInfoService/getStandardCodeInfo';
const OUT_DIR = path.resolve('archive/raw/funds');
const 쪽크기 = 1000;
const 간격ms = 220;

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

/**
 * 펀드 이름에서 **주제**를 읽는다.
 *
 * ⚠ 이름 짓기가 자유로워 완벽할 수 없다. 그래서 **못 가른 것은 null 로 남긴다.**
 *   억지로 어딘가에 넣으면 나중에 「반도체 펀드 N개」가 거짓말이 된다.
 * ⚠ 순서가 중요하다 — 「중국반도체」는 **지역이 먼저**다. 위에서 걸리면 끝난다.
 */
export function 주제(이름) {
  const s = (이름 ?? '').replace(/\s+/g, '');
  if (!s) return null;
  /* 지역이 붙은 것은 지역으로 본다. 「미국반도체」는 미국 이야기다 */
  if (/중국|차이나|China|본토|CSI|항셍/i.test(s)) return '중국';
  if (/미국|US|나스닥|S&P|다우/i.test(s)) return '미국';
  if (/일본|재팬|Japan|니케이/i.test(s)) return '일본';
  if (/인도|India|베트남|Vietnam|신흥|이머징/i.test(s)) return '기타신흥';
  if (/글로벌|해외|선진|Global|World/i.test(s)) return '글로벌';
  /* 지역이 없으면 주제로 본다 */
  if (/반도체|메모리|파운드리/.test(s)) return '반도체';
  if (/AI|인공지능|로봇/i.test(s)) return 'AI·로봇';
  if (/2차전지|이차전지|배터리|전기차/.test(s)) return '2차전지';
  if (/바이오|헬스케어|제약/.test(s)) return '바이오';
  if (/ESG|친환경|탄소|그린/i.test(s)) return 'ESG';
  if (/배당|인컴|고배당/.test(s)) return '배당·인컴';
  if (/채권|국공채|회사채|크레딧/.test(s)) return '채권';
  if (/단기금융|MMF|머니마켓/i.test(s)) return '단기금융';
  return null;   /* ⚠ 억지로 넣지 않는다 */
}

export function 정리(x) {
  return {
    코드부여일: x.basDt,
    코드: (x.srtnCd ?? '').trim() || null,
    표준코드: (x.asoStdCd ?? '').trim() || null,
    이름: (x.fndNm ?? '').replace(/\s+/g, ' ').trim(),
    분류: (x.ctg ?? '').trim() || null,
    /** ⚠ 코드부여일과 다르다. 2023년 설정 펀드가 2026년에 코드를 받기도 한다 */
    설정일: (x.setpDt ?? '').trim() || null,
    유형: (x.fndTp ?? '').trim() || null,
    상품분류코드: (x.prdClsfCd ?? '').trim() || null,
    주제: 주제(x.fndNm),
  };
}

async function 하루(키, 일자) {
  const 모음 = [];
  for (let 쪽 = 1; ; 쪽++) {
    const u = `${URL_}?serviceKey=${키}&numOfRows=${쪽크기}&pageNo=${쪽}&resultType=json&basDt=${일자}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(35000) });
    const t = await r.text();
    let j;
    try { j = JSON.parse(t); } catch { throw new Error(`JSON 아님: ${t.slice(0, 90)}`); }
    const h = j.response?.header ?? j.OpenAPI_ServiceResponse?.cmmMsgHeader;
    const 코드 = h?.resultCode ?? h?.returnReasonCode;
    if (코드 && 코드 !== '00') throw new Error(`${코드} ${h.resultMsg ?? h.returnAuthMsg ?? ''}`);
    const b = j.response?.body;
    const 항목 = b?.items?.item ? [].concat(b.items.item) : [];
    모음.push(...항목.map(정리));
    if (모음.length >= Number(b?.totalCount ?? 0) || !항목.length) break;
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  if (모음.length) {
    writeFileSync(path.join(OUT_DIR, `${일자}.ndjson`), 모음.map((r) => JSON.stringify(r)).join('\n') + '\n');
  }
  return 모음;
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DATAGO_KEY 가 없다.'); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };

  let 날들 = [];
  const 하루치 = arg('--date'), 부터 = arg('--from'), 까지 = arg('--to');
  if (하루치) 날들 = [하루치];
  else if (부터 && 까지) {
    const d = new Date(+부터.slice(0, 4), +부터.slice(4, 6) - 1, +부터.slice(6, 8));
    const e = new Date(+까지.slice(0, 4), +까지.slice(4, 6) - 1, +까지.slice(6, 8));
    for (; d <= e; d.setDate(d.getDate() + 1)) 날들.push(날짜문자(d));
  } else 날들 = [어제()];   /* ⚠ T+1 */

  const 건너뜀 = 날들.filter((d) => existsSync(path.join(OUT_DIR, `${d}.ndjson`))).length;
  날들 = 날들.filter((d) => !existsSync(path.join(OUT_DIR, `${d}.ndjson`)));
  if (건너뜀) console.log(`이미 있는 ${건너뜀}일은 건너뛴다`);

  let 합 = 0, 빈날 = 0, 실패 = 0;
  const 짧다 = 날들.length < 40;
  for (const [i, 일자] of 날들.entries()) {
    try {
      const r = await 하루(키, 일자);
      if (!r.length) { 빈날++; if (짧다) console.log(`  ${일자}  0건`); continue; }
      합 += r.length;
      if (짧다) {
        const 읽힘 = r.filter((x) => x.주제).length;
        console.log(`✅ ${일자}  ${r.length}건 · 주제 읽힌 것 ${읽힘} (${(읽힘 / r.length * 100).toFixed(0)}%)`);
      } else if ((i + 1) % 100 === 0) {
        console.log(`  ${일자}  누적 ${합.toLocaleString()}건 (${i + 1}/${날들.length})`);
      }
    } catch (e) { 실패++; console.error(`✕ ${일자}  ${String(e.message).slice(0, 90)}`); }
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n합계 ${합.toLocaleString()}건 · 빈 날 ${빈날} · 실패 ${실패} · ${OUT_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
