#!/usr/bin/env node
/**
 * collect-saudi-tadawul-companies.mjs — **사우디(Tadawul) 상장사 목록.**
 *
 * 🔴🔴 [2026-09-15 · 1번] **⛔ 이 경로는 못 쓴다 — 확인했다. `--적는다`가 막혀 있다.**
 *
 * saudiexchange.sa 의 실제 이용약관(legal_notice)을 찾아 확인했다(WebSearch, 2026-09-15):
 * 「You must not reproduce or store any part of the website or its content in any other
 *  website or include it in any public or private electronic retrieval system or service
 *  without the prior written consent of Tadawul.」— **정확히 이 자가 하려던 일(스크레이핑해
 *  우리 저장소에 담기)을 명시적으로 금지한다.**
 *
 * 이건 `docs/UAE-데이터-출처-라이선스.md` 1-1절의 ADX 판정과 **글자까지 닮았다** —
 * 「ADX 웹사이트 자체에는 지연 시세가 공개돼 있으나… 재배포·조직적 수집(scraping)·파생물
 *  제작을 명시적으로 금지한다… 이 경로는 쓸 수 없다」. UAE 가 그때 푼 방법은 **거래소가
 *  아니라 «규제기관»의 오픈데이터**(CMA·CBUAE)로 갈아탄 것이었다. 사우디도 같은 길이
 *  있어 보인다 — **Saudi Open Data Platform**(`open.data.gov.sa`, SDAIA 운영, 2025-06 기준
 *  289개 기관·11,439개 데이터셋)과 사우디 CMA(`cma.gov.sa`, UAE CMA 와 다른 기관 — 이름만
 *  같다)의 오픈데이터 정책을 다음 사람이 먼저 확인한다. **exchange 웹사이트를 다시 긁지
 *  않는다.**
 *
 * ⇒ 아래 코드(표 파싱 로직·자가시험)는 «크롬으로 이 지면을 읽을 수 있다»는 기술적 증거로
 *   남기지만, `--적는다`는 이 판정이 뒤집히기 전까지 **일부러 막아 둔다** — 문장이 아니라
 *   검사로 지킨다(강령 「규칙은 문장이 아니라 검사로 둔다」).
 *
 * ── (참고로 남긴다) 어디서 표를 봤나 — 다음에 규제기관 경로가 막히면 다시 볼 자리 ──────
 * https://www.saudiexchange.sa/wps/portal/saudiexchange/ourmarkets/main-market-watch/…
 * 표 두 번째(index 1)에 부문 헤더+회사 행 296행, «회사 행»만 걸러 272개사(부문 22개) —
 * `noOfSymbolsListedMain: 272` 과 일치해 «전부 받힌다»는 것 자체는 기술적으로 확인했다.
 * plain curl·fetch 는 403(UA·Accept-Language 를 갖춰도 막힘) — 크롬 원격 디버그(9222)로만
 * 200 이 온다. **기술적으로 «받을 수 있다»와 «받아도 되는가»는 다른 질문이고, 이 파일은
 * 뒷질문에서 막혔다.**
 *
 *   node scripts/collect-saudi-tadawul-companies.mjs --자가시험
 *   node scripts/collect-saudi-tadawul-companies.mjs                 (받아서 세기만 — 라이선스 확인용, 안 적는다)
 *   node scripts/collect-saudi-tadawul-companies.mjs --적는다        (⛔ 막혀 있다 — 아래 참고)
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { put } from '../src/lib/store.mjs';

/** 크롬 원격 디버그 주소 — CLAUDE.md 「9222 로 붙는다」 절과 같다. */
export const 크롬주소 = 'http://127.0.0.1:9222';
export const 목록지면 = 'https://www.saudiexchange.sa/wps/portal/saudiexchange/ourmarkets/main-market-watch/'
  + '!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8ziTR3NDIw8LAz8LVxcnA0C3bwtPLwM_I0MzMz1C7IdFQFj30mM/';

/**
 * 표에서 한 줄(td/th 배열의 innerText)을 읽어 회사 한 곳으로 만든다. 부문 헤더 줄(칸이
 * 하나뿐인 줄)은 호출부가 `currentSector` 로 들고 있다가 넘겨준다 — 이 함수는 «회사 줄인가»
 * 와 «파싱」만 한다.
 *
 * ⛔ 첫 칸(회사명+코드가 줄바꿈으로 붙어 온다)의 «둘째 줄»이 3~5자리 숫자일 때만 회사 줄로
 *   본다 — 안 그러면 부문 헤더나 합계 줄을 회사로 잘못 센다.
 */
export function 회사줄인가(첫칸) {
  const 줄들 = String(첫칸 ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
  return 줄들.length >= 2 && /^\d{3,5}$/.test(줄들[1]);
}

export function 회사줄파싱(첫칸, 부문) {
  const 줄들 = String(첫칸 ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (!회사줄인가(첫칸)) return null;
  return { symbol: 줄들[1], nameEn: 줄들[0], sector: 부문 ?? null };
}

/** 표 전체(각 tr 의 「첫 칸 텍스트」 배열)를 회사 배열로 접는다. 부문 헤더 줄로 부문을 갱신한다. */
export function 표접기(줄들) {
  const 결과 = [];
  let 부문 = null;
  for (const 첫칸 of (줄들 ?? [])) {
    const 줄내용 = String(첫칸 ?? '').trim();
    if (줄내용 && !줄내용.includes('\n') && !/^\d/.test(줄내용)) { 부문 = 줄내용; continue; }
    const 행 = 회사줄파싱(첫칸, 부문);
    if (행) 결과.push(행);
  }
  return 결과;
}

/** 중복 종목코드가 있나(있으면 못 쟀다로 다룬다 — 조용히 하나를 버리지 않는다) */
export function 중복코드(회사들) {
  const 본것 = new Set(); const 중복 = new Set();
  for (const c of (회사들 ?? [])) {
    if (본것.has(c.symbol)) 중복.add(c.symbol);
    본것.add(c.symbol);
  }
  return [...중복];
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('회사줄인가: 이름+코드 두 줄이면 회사 줄', 회사줄인가('SAUDI ARAMCO\n2222'));
  재다('⛔ 회사줄인가: 코드 자리가 숫자가 아니면 회사 줄이 아니다', !회사줄인가('Energy\n'));
  재다('⛔ 회사줄인가: 한 줄뿐이면(부문 헤더) 회사 줄이 아니다', !회사줄인가('Energy'));
  재다('⛔ 회사줄인가: 코드가 6자리 이상이면 회사 줄로 안 본다(오탐 방지)', !회사줄인가('X\n1234567'));

  재다('회사줄파싱: 부문을 같이 넣는다', (() => {
    const r = 회사줄파싱('SAUDI ARAMCO\n2222', 'Energy');
    return r.symbol === '2222' && r.nameEn === 'SAUDI ARAMCO' && r.sector === 'Energy';
  })());
  재다('⛔ 회사줄파싱: 회사 줄이 아니면 null', 회사줄파싱('Energy', null) === null);

  재다('표접기: 부문 헤더 뒤 회사들이 그 부문으로 묶인다', (() => {
    const r = 표접기(['Energy', 'SAUDI ARAMCO\n2222', 'SARCO\n2030', 'Materials', 'MAADEN\n1211']);
    return r.length === 3 && r[0].sector === 'Energy' && r[2].sector === 'Materials';
  })());
  재다('⛔ 표접기: 빈 줄·잡줄은 건너뛴다', 표접기(['', null, 'Energy']).length === 0);
  재다('⛔ 표접기: 부문 헤더 없이 시작해도 죽지 않는다(부문 null)', 표접기(['SAUDI ARAMCO\n2222'])[0].sector === null);

  재다('중복코드: 없으면 빈 배열', 중복코드([{ symbol: '2222' }, { symbol: '2030' }]).length === 0);
  재다('🔴 중복코드: 같은 코드 두 번이면 잡는다', (() => {
    const r = 중복코드([{ symbol: '2222' }, { symbol: '2222' }]);
    return r.length === 1 && r[0] === '2222';
  })());

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 (여기서부터는 네트워크 — 자가시험이 안 건드리는 자리) ──────────────── */
if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }
console.log('');

async function 받기() {
  const { createRequire } = await import('node:module');
  const require = createRequire(pathToFileURL(path.resolve('..', 'klifemap', 'package.json')));
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 크롬주소, defaultViewport: null });
  const page = await b.newPage();
  try {
    await page.goto(목록지면, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 4000));
    const 첫칸들 = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const 표 = tables[1]; // 실측(2026-09-15): 두 번째 표가 부문별 296행짜리 «전 종목» 표다
      if (!표) return [];
      return Array.from(표.querySelectorAll('tr')).map((tr) => {
        const td = tr.querySelector('td,th');
        return td ? td.innerText : '';
      });
    });
    return 첫칸들;
  } finally {
    await page.close();
    b.disconnect();
  }
}

async function main() {
  console.log('사우디거래소(Tadawul) Main Market Watch — 크롬(9222)으로 받는다');
  let 첫칸들;
  try {
    첫칸들 = await 받기();
  } catch (e) {
    console.log(`🔴 못 받았다 — ${e.message}`);
    console.log('   (127.0.0.1:9222 로 실제 크롬이 붙어 있어야 한다 — CLAUDE.md 「9222 로 붙는다」 절 참고)');
    process.exit(1);
  }
  const 회사들 = 표접기(첫칸들);
  const 중복 = 중복코드(회사들);

  console.log(`■ ${회사들.length}개사 받음`);
  if (중복.length) console.log(`  🔴 중복 코드 ${중복.length}개 — ${중복.join(', ')} (못 쟀다로 남긴다)`);
  console.log(`  부문 수 — ${new Set(회사들.map((c) => c.sector)).size}`);
  console.log(회사들.slice(0, 5).map((c) => `  ${c.symbol}  ${c.nameEn}  (${c.sector})`).join('\n'));

  console.log('\n⛔⛔ 여기서 멈춘다 — saudiexchange.sa 이용약관이 재배포·조직적 수집·저장을');
  console.log('   명시적으로 금지한다(2026-09-15 확인, 파일 머리글 참고). --적는다 를 붙여도');
  console.log('   저장하지 않는다. 규제기관(사우디 CMA·open.data.gov.sa) 경로를 먼저 확인한다.');
  process.exit(1);

  // eslint-disable-next-line no-unreachable
  if (!process.argv.includes('--적는다')) {
    console.log('\n⭐ 아직 안 적었다. --적는다 를 붙인다.');
    return;
  }

  const 결과 = await put('raw/saudi-tadawul-companies/companies.json', JSON.stringify({
    _meta: {
      product: 'Saudi Exchange (Tadawul) — Main Market listed companies',
      builtAt: new Date().toISOString(),
      source: 'saudiexchange.sa Main Market Watch page (public, no login) — read via a real '
        + 'browser session because plain HTTP requests (curl, fetch) return 403 from this site '
        + '(bot detection); this is the one Saudi collector in this repo that departs from the '
        + 'UAE curl pattern for that reason.',
      count: 회사들.length,
      duplicateSymbols: 중복,
      licenceNote: 'Not yet finally confirmed by a human against the site terms — treated the '
        + 'same as UAE ADX/DFM (public quote page, no login, we compile/reshape rather than '
        + 'redistribute verbatim) pending that confirmation. See docs/데이터-출처-라이선스.md.',
      notThis: [
        'Not a complete profile — listing date and financials are not on this page (next step).',
        'Not investment advice.',
      ],
    },
    rows: 회사들,
  }, null, 1), 'application/json');
  console.log(`\n📁 적었다 — ${결과.local}`);
}

main();
