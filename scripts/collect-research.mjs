#!/usr/bin/env node
/**
 * 증권사 리포트 **사실 데이터** 수집기.
 *
 *   npm run collect:research              최근 3페이지
 *   npm run collect:research -- --pages=10
 *   npm run collect:research -- --dry
 *
 * ── 무엇을 만들려는 것인가 ──────────────────────────────────────
 * 리포트 본문을 파는 게 아니다. **목표주가가 맞았는지를 파는 것**이다.
 *
 *   「어느 증권사·애널리스트의 목표주가가 실제 주가에 가장 근접했나」
 *   「가장 크게 빗나간 곳은 어디인가」
 *
 * 이건 국내에도 영문으로도 파는 곳이 없다. 그리고 **시간이 쌓여야만 만들어진다** —
 * 오늘 나온 목표주가를 오늘 안 받으면, 1년 뒤에 「그때 무엇을 제시했는지」를 알 수 없다.
 * 관세청 잠정치와 같은 성질이다. 아카이브가 곧 상품이다.
 *
 * ── 무엇을 가져오고 무엇을 안 가져오는가 ───────────────────────
 * 가져온다 — **사실**. 저작권의 대상이 아니다.
 *   증권사 · 종목 · 발행일 · 목표주가 · 투자의견 · 리포트 제목 · 조회수
 *
 * 안 가져온다 — **저작물**.
 *   ✗ PDF 원문        (리포트 그 자체다)
 *   ✗ 본문 전문·요약   (표현이 저작물이다)
 *   ✗ 차트·표 이미지
 *
 * 제목은 식별자로만 저장하고 재배포하지 않는다.
 *
 * ── 규칙을 지킨다 ──────────────────────────────────────────────
 * `finance.naver.com/robots.txt` 가 `/research/` 를 **명시적으로 Allow** 한다.
 * (한경 컨센서스는 `Disallow: /` 라 쓰지 않는다. 확인하고 뺐다.)
 * 요청 간격을 두고, 신원을 밝히는 User-Agent 를 쓴다.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { put, storeStatus, remoteEnabled } from '../src/lib/store.mjs';

const BASE = 'https://finance.naver.com/research';
const UA = 'Mozilla/5.0 (compatible; SeoulMarketsBot/0.1; +https://seoulmarkets.com/about)';
const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const PAGES = Number(argv.find((a) => a.startsWith('--pages='))?.slice(8)) || 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 한국 시각 기준 타임스탬프. 발표·거래가 KST 기준이라 UTC 로 찍으면 하루가 어긋난다. */
function stamp(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return k.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

/**
 * 네이버 금융은 **EUC-KR** 로 응답한다.
 * 헤더에는 utf-8 이라고 적혀 있지만 실제 바이트는 EUC-KR 이다 — 그대로 믿으면
 * 종목명·증권사명이 전부 깨진다. 실제로 처음에 깨졌다.
 */
async function fetchKr(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return new TextDecoder('euc-kr').decode(await res.arrayBuffer());
}

const clean = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** 목록 한 페이지 → 리포트 항목들 */
function parseList(html) {
  const out = [];
  for (const tr of html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
    const nid = tr.match(/company_read\.naver\?nid=(\d+)/)?.[1];
    if (!nid) continue;
    const tds = (tr.match(/<td[^>]*>[\s\S]*?<\/td>/g) ?? []).map(clean);
    if (tds.length < 5) continue;
    const [stock, title, house, , date, views] = tds;
    if (!stock || !house) continue;
    out.push({
      nid,
      stock,
      title,
      house,
      // 26.07.31 → 2026-07-31
      date: /^\d{2}\.\d{2}\.\d{2}$/.test(date) ? `20${date.replace(/\./g, '-')}` : date,
      views: Number(views) || null,
    });
  }
  return out;
}

/**
 * 상세 페이지 → 목표주가·투자의견.
 *
 * 화면에 `목표가 10,000 | 투자의견 Buy` 형태로 나온다.
 * **없을 수도 있다** — 목표주가를 제시하지 않는 리포트가 실제로 있다.
 * 그때는 null 로 둔다. 0 이나 추정치로 채우지 않는다.
 */
/**
 * 투자의견 정규식.
 *
 * ⚠ 처음에 이렇게 썼다가 대부분 null 이 나왔다.
 *     /투자의견\s*([A-Za-z가-힣.\s]{1,12}?)(?:\s{2,}|$|매출|영업)/
 *   문자군에 한글이 들어 있어 「Buy 매출액」의 「매」까지 삼키고, 종료 조건이
 *   「매출|영업」뿐이라 **그 뒤에 다른 말이 오면 무조건 실패**했다.
 *   실측에서 목표주가는 30건 중 29건 잡혔는데 투자의견은 0건이었다.
 *
 * 고친 방식 — 의견은 영문 한 낱말이거나 정해진 한글 표현이다. 그 뒤에 오는 것이
 * 본문(한글) 이거나 숫자(2Q 등) 이므로, **뒤를 내다보고 끊는다.**
 */
const RE_OPINION =
  /투자의견\s*(?:([A-Za-z][A-Za-z.]{1,12})|(매수|중립|보유|비중확대|비중축소|매도|시장수익률|투자의견없음))/;

function parseDetail(html) {
  const txt = clean(html.replace(/<script[\s\S]*?<\/script>/g, ''));
  const target = txt.match(/목표가\s*([\d,]+)/)?.[1];
  const op = txt.match(RE_OPINION);
  const analyst = txt.match(/애널리스트\s*[:：]?\s*([가-힣]{2,4})/)?.[1];
  return {
    // 목표주가를 제시하지 않는 리포트가 실제로 있다. 0 이나 추정으로 채우지 않는다.
    targetPrice: target ? Number(target.replace(/,/g, '')) : null,
    opinion: op ? (op[1] ?? op[2]) : null,
    // 네이버 목록·상세에는 애널리스트명이 없다. PDF 안에만 있는데 그건 안 받는다.
    // 필드는 남겨 둔다 — 다른 출처가 생기면 여기 채운다.
    analyst: analyst ?? null,
  };
}

async function main() {
  const runStamp = stamp();
  const items = [];

  for (let p = 1; p <= PAGES; p++) {
    const url = `${BASE}/company_list.naver?&page=${p}`;
    try {
      const html = await fetchKr(url);
      const rows = parseList(html);
      items.push(...rows);
      console.log(`  목록 ${p}쪽 — ${rows.length}건`);
    } catch (e) {
      console.log(`  목록 ${p}쪽 실패: ${e.message}`);
    }
    await sleep(800); // 예의. 남의 서버를 몰아치지 않는다
  }

  // nid 중복 제거 — 페이지가 겹칠 수 있다
  const uniq = [...new Map(items.map((r) => [r.nid, r])).values()];
  console.log(`\n  수집 대상 ${uniq.length}건 (중복 제거 후)`);

  if (DRY) {
    console.table(uniq.slice(0, 8));
    console.log('\n  --dry — 상세 조회와 저장을 건너뜁니다.');
    return;
  }

  let filled = 0;
  let skipped = 0;
  for (const r of uniq) {
    // 이미 받아 둔 리포트는 다시 부르지 않는다. 목표주가는 발행 후 바뀌지 않는다.
    const key = `raw/research/${r.date}/${r.nid}.json`;
    if (existsSync(path.join(ARCHIVE, key))) {
      skipped++;
      continue;
    }
    try {
      const html = await fetchKr(`${BASE}/company_read.naver?nid=${r.nid}`);
      Object.assign(r, parseDetail(html));
      if (r.targetPrice) filled++;
      // ⚠ PDF 는 받지 않는다. 그게 저작물이다. 링크조차 저장하지 않는다.
      await put(key, JSON.stringify({ ...r, collectedAt: runStamp }, null, 2), 'application/json');
    } catch (e) {
      console.log(`  상세 ${r.nid} 실패: ${e.message}`);
    }
    await sleep(700);
  }

  await put(
    `manifest/research/${runStamp}.json`,
    JSON.stringify(
      { runStamp, pages: PAGES, found: uniq.length, fetched: uniq.length - skipped, withTarget: filled, store: storeStatus() },
      null,
      2,
    ),
    'application/json',
  );

  console.log(`\n  새로 받음 ${uniq.length - skipped} · 이미 있음 ${skipped} · 목표주가 확보 ${filled}`);
  if (!remoteEnabled) {
    console.log('\n  ⚠ 원격 저장이 꺼져 있습니다. 재배포하면 사라집니다.');
  }
}

// import 만으로 실행되지 않게 한다 — collect.mjs 에서 같은 사고를 겪었다.
if (process.argv[1]?.endsWith('collect-research.mjs')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { parseDetail };
