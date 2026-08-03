#!/usr/bin/env node
/**
 * 증권사 리포트 **사실 데이터** 수집기.
 *
 *   npm run collect:research              최근 3페이지
 *   npm run collect:research -- --pages=10
 *   npm run collect:research -- --dry
 *   npm run collect:research -- --fill              이미 받아 둔 목록의 상세를 채운다(백필 2단계)
 *   npm run collect:research -- --fill --limit=500  그만큼만 받고 멈춘다
 *   npm run collect:research -- --fill --oldest     오래된 날짜부터 (기본은 최신부터)
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
 * ── 🔴 규칙 — **내가 앞서 적은 것이 틀렸다** (2026-08-03 KST 정정) ──
 *
 * 여기에 이렇게 적혀 있었다:
 *   「finance.naver.com/robots.txt 가 /research/ 를 명시적으로 Allow 한다」
 *
 * **틀렸다.** 실측한 robots.txt 는 이렇다.
 *
 *   User-agent: *          ← 우리다
 *   Disallow: /            ← 전부 금지
 *
 *   User-agent: yeti       ← 네이버 자사 크롤러
 *   Disallow: /
 *   Allow: /sise/
 *   Allow: /research/      ← 이 Allow 는 **yeti 그룹 소속**이다
 *
 * Allow 줄만 보고 **그것이 어느 User-agent 그룹에 속하는지를 안 봤다.**
 * RFC 9309 상 그룹은 User-agent 줄로 나뉜다. `*` 에게 적용되는 규칙은
 * `Disallow: /` 하나뿐이다. 우리 UA 는 yeti 가 아니므로 `*` 에 걸린다.
 *
 * ── 사장님 판단 (2026-08-03 KST) — 이대로 간다 ──────────────────
 *
 * 위 사실을 보고드렸고, 이렇게 정하셨다.
 *
 *   「증권사에서 못 갖고 오면 네이버 갖고 와서 그냥 써. **사실**을 갖고 온다며.
 *     스타일·구성 다르고 **네이버의 가공정보만 안 쓰면 됨**」
 *
 * 그래서 순서와 경계가 이렇게 정해졌다.
 *
 *   순서   ① 증권사 자사 사이트에서 직접  → 안 되는 곳만 ② 네이버
 *   경계   증권사가 공표한 **사실**은 가져온다
 *          날짜 · 증권사 · 종목 · 목표주가 · 투자의견 · 애널리스트
 *
 *          **네이버가 만든 것은 안 가져온다**
 *          ✗ 조회수        네이버 화면에서 생긴 지표다. 증권사가 만든 게 아니다
 *          ✗ 네이버 정렬·순위
 *          ✗ PDF 주소       stock.pstatic.net 은 네이버 호스팅 경로다
 *                          (「PDF 가 있었나」만 hasPdf 로 남긴다 — 그건 사실이다)
 *          ✗ 리포트 본문·표·차트   원래부터 안 받는다
 *
 * **표현이 아니라 사실을 가져오고, 우리 구성으로 다시 짠다.** 이것이 기준이다.
 * (사장님은 경제지 인터넷총괄에디터 20년. 이 판단은 내 추정보다 정확하다)
 *
 * ⚠ 다만 정리 전까지 **유료 판매 개시·마켓플레이스 등록은 하지 않는다.**
 *   되돌리기 어렵고, 사는 쪽 법무가 반드시 본다.
 *   상세는 `docs/데이터-출처-라이선스.md` 「네이버 금융 경로」 절.
 *
 * (한경 컨센서스·FnGuide 도 `Disallow: /` 다. 확인하고 뺐다 — 이건 맞았다.)
 * 요청 간격을 두고, 신원을 밝히는 User-Agent 를 쓴다.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { put, storeStatus, remoteEnabled } from '../src/lib/store.mjs';

const BASE = 'https://finance.naver.com/research';
const UA = 'Mozilla/5.0 (compatible; SeoulMarketsBot/0.1; +https://seoulmarkets.com/about)';
const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const PAGES = Number(argv.find((a) => a.startsWith('--pages='))?.slice(8)) || 3;
/** 시작 쪽. 과거 소급(백필)에 쓴다. `--from=800 --pages=100` = 800~899쪽 */
const FROM = Number(argv.find((a) => a.startsWith('--from='))?.slice(7)) || 1;
/** 목록만 받고 상세는 건너뛴다. 백필 1단계에 쓴다(상세는 9만 번 호출이라 나눠서 한다). */
const LIST_ONLY = argv.includes('--list-only');
/**
 * 백필 2단계. **목록 페이지를 다시 부르지 않고** 이미 저장된 목록을 읽어
 * 상세가 없는 것만 채운다. 목록 3,017쪽은 이미 받아 뒀다(66,071건) —
 * 그걸 또 부르면 남의 서버를 3천 번 헛되이 두드린다.
 */
const FILL = argv.includes('--fill');
/** --fill 에서 이번 실행에 받을 최대 건수. 끊어서 돌릴 때 쓴다. */
const LIMIT = Number(argv.find((a) => a.startsWith('--limit='))?.slice(8)) || Infinity;
/** --fill 순서. 기본은 최신 날짜부터 — 오늘 쓸 수 있는 데이터가 먼저 쌓인다. */
const OLDEST_FIRST = argv.includes('--oldest');

/*
 * ── 소급 가능 범위 (2026-08-01 실측) ──────────────────────────
 *     1쪽  2026-07-31
 *   800쪽  2024-01-24
 *  1500쪽  2019-05-10
 *  3000쪽  2007-12-14   ← 여기가 끝. 이후 쪽은 같은 11건만 반복
 *
 * **약 9만 건, 18년치 목표주가 이력이 남아 있다.**
 * 지수 사업이 요구하는 3~5년 백테스트를 훨씬 넘는다.
 * 이건 관세청 잠정치와 성질이 다르다 — 저쪽은 오늘 안 받으면 영영 없지만,
 * 이쪽은 **지금 한 번 받아 두면 18년이 통째로 들어온다.** 우선순위가 그만큼 높다.
 *
 * ⚠ 다만 남의 서버를 9만 번 두드리는 일이다. 한 번에 몰아치지 않고 나눠서 받는다.
 *   `--list-only` 로 목록을 먼저 확보하고(3천 요청), 상세는 날짜별로 나눠 받는다.
 */

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

/**
 * 목록 한 페이지 → 리포트 항목들.
 *
 * ⚠ **종목코드는 여기서만 얻을 수 있다.** 2026-08-02 에 확인했다.
 *   상세 페이지에도 `code=` 가 나오지만 그건 **인기종목 사이드바**다.
 *   금호타이어 리포트(nid=94927)의 상세에 005930·000660·035420 이 찍힌다.
 *   상세에서 코드를 긁으면 **전 기사가 삼성전자로 잘못 붙는다.**
 *
 * 코드가 왜 필요한가 — 이름으로는 시세와 못 잇는다. **회사가 이름을 바꾸기 때문**이다.
 * 아프리카TV→SOOP, 하이투자증권→iM증권 이 실제로 이 데이터 안에 있다.
 * 이름으로 이으면 개명 시점에서 이력이 끊긴다. 코드는 안 바뀐다.
 */
function parseList(html) {
  const out = [];
  for (const tr of html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
    const nid = tr.match(/company_read\.naver\?nid=(\d+)/)?.[1];
    if (!nid) continue;
    const tds = (tr.match(/<td[^>]*>[\s\S]*?<\/td>/g) ?? []).map(clean);
    if (tds.length < 5) continue;
    const [stock, title, house, , date] = tds;
    if (!stock || !house) continue;
    out.push({
      nid,
      // 상장폐지 등으로 링크가 없는 행이 있을 수 있다. 그때는 null 로 둔다 —
      // 이름으로 추정해 채우지 않는다.
      code: tr.match(/\/item\/main\.naver\?code=(\d{6})/)?.[1] ?? null,
      stock,
      title,
      house,
      // 26.07.31 → 2026-07-31
      date: /^\d{2}\.\d{2}\.\d{2}$/.test(date) ? `20${date.replace(/\./g, '-')}` : date,
      /*
       * ⚠ 2026-08-03 KST — **조회수를 안 받는다.**
       *   사장님 기준: 「사실은 가져오되 **네이버의 가공정보는 안 쓴다**」.
       *   조회수는 증권사가 공표한 사실이 아니라 **네이버 화면에서 생긴 지표**다.
       *   목표주가·투자의견은 증권사가 만든 사실이고, 조회수는 네이버가 만든 숫자다.
       *   경계가 여기다.
       *
       * ⚠ PDF 도 **주소 대신 있고 없고만** 남긴다.
       *   「PDF 가 있었나」는 사실이라 정보 가치가 있다(없는 리포트가 실제로 있다).
       *   그런데 `stock.pstatic.net/...` 은 **네이버가 호스팅하는 경로**이고
       *   그 끝에 있는 것은 저작물 그 자체다. 주소를 들고 있을 이유가 없다.
       */
      hasPdf: /href="https:\/\/stock\.pstatic\.net\/[^"]+\.pdf"/.test(tr),
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
  return {
    // 목표주가를 제시하지 않는 리포트가 실제로 있다. 0 이나 추정으로 채우지 않는다.
    targetPrice: target ? Number(target.replace(/,/g, '')) : null,
    opinion: op ? (op[1] ?? op[2]) : null,
    /*
     * 🔴 2026-08-03 KST — **애널리스트 추출을 지웠다. 쓰레기를 내보내고 있었다.**
     *
     * 원래 이랬다:  txt.match(/애널리스트\s*[:：]?\s*([가-힣]{2,4})/)
     * 바로 아래 주석에 「네이버에는 애널리스트명이 없다」고 내가 써 놓고
     * 정규식은 그대로 돌고 있었다. 그래서 본문의 **「애널리스트 대상으로」**,
     * **「애널리스트 간담회」** 같은 문장에서 뒷말을 이름으로 집어 왔다.
     *
     *   실측  66,071건 중 170건이 채워짐(0.3%)
     *         값: 대상으로 · 미팅 · 간담회 · 데이에 · 코멘트 · 의견
     *
     * **한 명도 사람 이름이 아니었다.** 그런데 이걸 `/v1/research` 가
     * `analyst` 로 내보내고 있었다. 빈 것보다 나쁘다 — 빈 것은 없다는 뜻이지만
     * 틀린 것은 **거짓말**이고, 데이터를 사는 쪽은 그걸로 우리를 판단한다.
     *
     * 애널리스트명은 **직접 수령(언론 배포)이 자리 잡으면** 그때 채운다.
     * 그전까지는 null 이 정직한 값이다.
     * (docs/리서치-직접수령-아웃리치.md)
     */
    analyst: null,
  };
}

/**
 * 백필 2단계 — 저장된 목록을 읽어 **상세가 없는 것만** 채운다.
 *
 * 기본 수집 경로(main)는 목록 페이지를 다시 부른 뒤 상세를 받는다. 백필에는 그게 맞지 않는다.
 * 66,071건의 목록은 이미 디스크에 있고, 그걸 얻으려고 목록 3,017쪽을 또 부르는 것은
 * 남의 서버를 헛되이 두드리는 일이다.
 *
 * **어디서 끊겨도 그대로 다시 돌리면 이어진다.** 진행 상태를 따로 적지 않는다 —
 * 「상세 파일이 있으면 건너뛴다」가 곧 진행 상태다. 상태 파일은 실제와 어긋나는 순간
 * 더 나쁘다.
 */
async function fill() {
  const listRoot = path.join(ARCHIVE, 'raw/research-list');
  if (!existsSync(listRoot)) {
    console.log('  목록 아카이브가 없습니다. 먼저 `--list-only` 로 목록을 받으십시오.');
    return;
  }

  const days = readdirSync(listRoot)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
  // 기본은 최신부터. 중간에 멈춰도 「오늘 쓸 수 있는」 구간이 먼저 채워진다.
  if (!OLDEST_FIRST) days.reverse();

  // 몇 시간짜리 작업이라 남은 건수를 먼저 센다. 진행률이 안 보이면 살았는지 죽었는지 모른다.
  let todo = 0;
  for (const d of days) {
    for (const f of readdirSync(path.join(listRoot, d))) {
      if (!existsSync(path.join(ARCHIVE, 'raw/research', d, f))) todo++;
    }
  }
  console.log(
    `  상세 미확보 ${todo.toLocaleString()}건 · 이번 실행 상한 ${LIMIT === Infinity ? '없음' : LIMIT.toLocaleString()}` +
      ` · 순서 ${OLDEST_FIRST ? '오래된 것부터' : '최신부터'}`,
  );
  if (DRY) return;

  const runStamp = stamp();
  let done = 0;
  let filled = 0;
  let noTarget = 0;
  let failed = 0;

  outer: for (const d of days) {
    for (const f of readdirSync(path.join(listRoot, d))) {
      const key = `raw/research/${d}/${f}`;
      if (existsSync(path.join(ARCHIVE, key))) continue;
      if (done >= LIMIT) break outer;

      const r = JSON.parse(readFileSync(path.join(listRoot, d, f), 'utf8'));
      try {
        const html = await fetchKr(`${BASE}/company_read.naver?nid=${r.nid}`);
        const det = parseDetail(html);
        // ⚠ PDF 는 받지 않는다. 그게 저작물이다.
        await put(key, JSON.stringify({ ...r, ...det, collectedAt: runStamp }, null, 2), 'application/json');
        if (det.targetPrice) filled++;
        // 목표주가를 제시하지 않는 리포트가 실제로 있다(화면에 「목표가 없음」).
        // null 로 저장하는 것이 맞다. 실패와 구분하려고 따로 센다.
        else noTarget++;
      } catch (e) {
        // 실패는 파일을 남기지 않는다 — 다음 실행에서 자동으로 다시 시도된다.
        failed++;
        console.log(`  상세 ${r.nid} 실패: ${e.message}`);
      }
      done++;
      if (done % 200 === 0) {
        console.log(
          `  ${done.toLocaleString()}/${todo.toLocaleString()} · 목표주가 ${filled.toLocaleString()}` +
            ` · 미제시 ${noTarget.toLocaleString()} · 실패 ${failed} · 현재 ${d}`,
        );
      }
      await sleep(700); // 예의. 남의 서버를 몰아치지 않는다
    }
  }

  await put(
    `manifest/research/${runStamp}-fill.json`,
    JSON.stringify(
      { runStamp, mode: 'fill', todo, fetched: done, withTarget: filled, noTarget, failed, store: storeStatus() },
      null,
      2,
    ),
    'application/json',
  );

  console.log(
    `\n  받음 ${done.toLocaleString()} · 목표주가 ${filled.toLocaleString()} · 미제시 ${noTarget.toLocaleString()} · 실패 ${failed}` +
      ` · 남음 ${(todo - done).toLocaleString()}`,
  );
  if (!remoteEnabled) console.log('\n  ⚠ 원격 저장이 꺼져 있습니다. 이 PC 에만 있습니다.');
}

async function main() {
  if (FILL) return fill();

  const runStamp = stamp();
  const items = [];

  /**
   * 목록 한 쪽을 **받는 즉시 저장**한다.
   *
   * ⚠ 처음엔 3,050쪽을 전부 모은 뒤 한꺼번에 저장하게 짰다. 30분을 돌려도
   *   디스크에 아무것도 없었고, **중간에 끊기면 통째로 날아가는 구조**였다.
   *   오래 도는 수집기에서 「끝나고 저장」은 그 자체가 결함이다.
   *   지금은 한 쪽씩 저장하므로 어디서 끊겨도 그때까지는 남는다.
   */
  async function saveList(rows) {
    let n = 0;
    for (const r of rows) {
      const key = `raw/research-list/${r.date}/${r.nid}.json`;
      if (existsSync(path.join(ARCHIVE, key))) continue;
      await put(key, JSON.stringify(r, null, 2), 'application/json');
      n++;
    }
    return n;
  }

  let saved = 0;
  let lastSig = '';
  for (let p = FROM; p < FROM + PAGES; p++) {
    const url = `${BASE}/company_list.naver?&page=${p}`;
    try {
      const html = await fetchKr(url);
      const rows = parseList(html);
      // 끝을 지나면 네이버가 **같은 마지막 쪽을 계속 돌려준다**(3000쪽 이후 동일 11건).
      // 그걸 모르고 돌리면 같은 데이터를 수천 번 받는다. 서명을 비교해 멈춘다.
      const sig = rows.map((r) => r.nid).join(',');
      if (sig && sig === lastSig) {
        console.log(`  ${p}쪽 — 앞쪽과 동일. 마지막에 도달했다고 보고 중단`);
        break;
      }
      lastSig = sig;
      items.push(...rows);
      // 받는 즉시 저장한다. 끊겨도 여기까지는 남는다.
      if (LIST_ONLY && !DRY) saved += await saveList(rows);
      if (p % 25 === 0 || p === FROM) {
        console.log(
          `  ${p}쪽 — ${rows.length}건 (${rows[0]?.date ?? '-'})` +
            (LIST_ONLY ? `  누적 저장 ${saved}` : ''),
        );
      }
    } catch (e) {
      console.log(`  목록 ${p}쪽 실패: ${e.message}`);
    }
    await sleep(600); // 예의. 남의 서버를 몰아치지 않는다
  }

  // nid 중복 제거 — 페이지가 겹칠 수 있다
  const uniq = [...new Map(items.map((r) => [r.nid, r])).values()];
  console.log(`\n  수집 대상 ${uniq.length}건 (중복 제거 후)`);

  if (DRY) {
    console.table(uniq.slice(0, 8));
    console.log('\n  --dry — 상세 조회와 저장을 건너뜁니다.');
    return;
  }

  // 백필 1단계는 저장이 이미 쪽 단위로 끝났다. 상세는 나중에 날짜별로 나눠 받는다.
  if (LIST_ONLY) {
    console.log(`\n  목록 저장 ${saved}건 (신규) / ${uniq.length}건 조회`);
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
