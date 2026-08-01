#!/usr/bin/env node
/**
 * 리포트 ↔ 종목코드 대응표를 만든다.
 *
 * ── 왜 따로 받는가 ──────────────────────────────────────────
 * 목록 파서가 종목**명**만 담고 종목**코드**를 버렸다. 명만으로는 시세와 붙일 수 없다.
 * 같은 이름의 다른 회사가 있고, 무엇보다 **회사가 이름을 바꾼다** —
 * 아프리카TV→SOOP, 하이투자증권→iM증권처럼. 이름으로 이으면 그 지점에서 끊긴다.
 * 코드는 안 바뀐다.
 *
 * ── 왜 상세를 다시 안 받고 목록을 다시 받는가 ────────────────
 * 상세는 66,071건이고 목록은 3,017쪽이다. **같은 정보를 22분의 1 요청으로 얻는다.**
 * 상세 JSON 에는 원본 HTML 을 남기지 않아서 로컬만으로는 복구가 안 된다.
 *
 * ── 왜 collect-research.mjs 에 넣지 않았는가 ──────────────────
 * 그 파일은 지금 몇 시간짜리 백필(--fill)이 돌고 있다. 도는 스크립트를 고치면
 * 다음 청크부터 다른 코드가 실행된다. 끝난 뒤 합치는 것이 맞다.
 *
 * 사용법
 *   node scripts/collect-research-codes.mjs
 *   node scripts/collect-research-codes.mjs --pages=50      그만큼만
 *   node scripts/collect-research-codes.mjs --dry           받지 않고 한 쪽만 확인
 *
 * 결과: archive/meta/research-codes.json
 *   { nid: code }  ·  { code: 최근 종목명 }
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const BASE = 'https://finance.naver.com/research';
const UA = 'SeoulMarketsBot/1.0 (+https://seoulmarkets.com)';
const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');
const OUT = path.join(ARCHIVE, 'meta/research-codes.json');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const MAX_PAGES = Number(argv.find((a) => a.startsWith('--pages='))?.slice(8)) || Infinity;

/**
 * 요청 간격. 같은 시각에 백필도 돌고 있으므로 기본 수집기(700ms)보다 느슨하게 둔다.
 * 두 작업이 겹쳐도 초당 2건을 넘지 않는다.
 */
const GAP = 1200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchKr(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return new TextDecoder('euc-kr').decode(await res.arrayBuffer());
}

/** 목록 한 쪽 → [{nid, code, name}] */
function parseCodes(html) {
  const out = [];
  for (const tr of html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
    const nid = tr.match(/company_read\.naver\?nid=(\d+)/)?.[1];
    if (!nid) continue;
    // 종목 링크는 `.../item/main.naver?code=005930">삼성전자` 형태다.
    const m = tr.match(/code=(\d{6})[^>]*>([^<]+)/);
    // 코드가 없는 행이 있을 수 있다(상장폐지 등). 이름만이라도 남긴다 — 버리지 않는다.
    out.push({ nid, code: m?.[1] ?? null, name: m?.[2]?.trim() ?? null });
  }
  return out;
}

async function main() {
  mkdirSync(path.dirname(OUT), { recursive: true });

  // 중단돼도 이어서 돌 수 있게, 이미 받은 것은 읽어서 시작한다.
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { nidToCode: {}, codeToName: {} };
  const nidToCode = prev.nidToCode ?? {};
  const codeToName = prev.codeToName ?? {};

  let page = 1;
  let added = 0;
  let noCode = 0;

  for (; page <= MAX_PAGES; page++) {
    let rows;
    try {
      rows = parseCodes(await fetchKr(`${BASE}/company_list.naver?page=${page}`));
    } catch (e) {
      console.log(`  ${page}쪽 실패: ${e.message} — 5초 뒤 한 번 더`);
      await sleep(5000);
      try {
        rows = parseCodes(await fetchKr(`${BASE}/company_list.naver?page=${page}`));
      } catch (e2) {
        // 두 번 실패하면 그 쪽은 건너뛴다. 다시 돌리면 채워진다 —
        // 이미 받은 nid 는 그대로 있고 없는 것만 새로 들어온다.
        console.log(`  ${page}쪽 건너뜀: ${e2.message}`);
        continue;
      }
    }

    // 빈 쪽이 나오면 끝이다.
    if (!rows.length) {
      console.log(`  ${page}쪽에 행이 없습니다. 마지막입니다.`);
      break;
    }

    for (const r of rows) {
      if (!r.code) {
        noCode++;
        continue;
      }
      if (!(r.nid in nidToCode)) added++;
      nidToCode[r.nid] = r.code;
      // 이름은 최신 쪽(=최근)부터 훑으므로 먼저 본 것이 최신 사명이다. 덮지 않는다.
      if (r.name && !(r.code in codeToName)) codeToName[r.code] = r.name;
    }

    if (DRY) {
      console.log(`  --dry: ${page}쪽 ${rows.length}행 · 코드 ${rows.filter((r) => r.code).length}`);
      console.log('  ' + JSON.stringify(rows.slice(0, 3)));
      return;
    }

    if (page % 50 === 0) {
      writeFileSync(OUT, JSON.stringify({ nidToCode, codeToName }, null, 0));
      console.log(
        `  ${page}쪽 · 누적 ${Object.keys(nidToCode).length.toLocaleString()}건 · 종목 ${Object.keys(codeToName).length.toLocaleString()}개 · 코드없음 ${noCode}`,
      );
    }
    await sleep(GAP);
  }

  writeFileSync(OUT, JSON.stringify({ nidToCode, codeToName }, null, 0));
  console.log(
    `\n  ${page - 1}쪽까지 · 대응 ${Object.keys(nidToCode).length.toLocaleString()}건(신규 ${added.toLocaleString()})` +
      ` · 종목 ${Object.keys(codeToName).length.toLocaleString()}개 · 코드없음 ${noCode}`,
  );
  console.log(`  → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
