#!/usr/bin/env node
/**
 * 증권사 **자사 사이트 직접** 수집기.
 *
 *   npm run collect:broker                  전 증권사 최근 1페이지
 *   npm run collect:broker -- --dry         저장하지 않고 파싱 결과만 본다
 *   npm run collect:broker -- --only=mirae  한 곳만
 *   npm run collect:broker -- --pages=3
 *
 * ── 왜 따로 만드나 ─────────────────────────────────────────────
 * `collect-research.mjs` 는 네이버 금융 경로다. 66,093건이 거기서 왔다.
 * 그 경로에는 **없는 것이 하나 있다 — 애널리스트 이름.**
 * 네이버 화면에 안 나오기 때문이다. 정규식으로 짜내 보려다 0.3% 만 채우고
 * 그나마 「애널리스트 대상으로」 같은 문장 조각이 섞여 전부 버렸다.
 *
 * **증권사 자기 사이트에는 작성자가 그냥 적혀 있다.**
 * 그게 이 수집기의 존재 이유다. 「누가 맞혔나」는 이름이 있어야 성립한다.
 *
 * 사장님 지시(2026-08-03): 「최신 애널 리포트는 직접 받든지 갖고 와.
 * 우린 인터넷신문으로 등록하니까」 · 「매일 증권사 사이트 다 방문해서 수집한다」
 *
 * ── 🔴 무엇을 가져오고 무엇을 안 가져오는가 ───────────────────
 *
 * ⚠ **미래에셋증권 리서치 목록 페이지에 이런 문구가 있다.** 그대로 옮긴다.
 *
 *   「본 리서치 보고서의 지적재산권은 당사에 있으므로, 당사와 협약 또는 허락없이
 *    무단 복제 및 배포할 수 없습니다. 당사의 리서치 보고서를 다운로드 또는
 *    **자동 대량 수집**하여 무단 전재 및 **상업적 재배포**하는 행위는 저작권법에 의한
 *    저작권 침해에 해당되어 처벌 받을 수 있습니다.」
 *
 * robots.txt 보다 강한, **명시적 고지**다. 못 본 척하지 않는다.
 * 그래서 이 수집기는 고지가 금지하는 대상 — **보고서** — 을 아예 건드리지 않는다.
 *
 *   가져온다 (사실. 저작권의 대상이 아니다)
 *     발행일 · 증권사 · 종목명 · 종목코드 · 투자의견 · 목표주가 · **애널리스트**
 *
 *   안 가져온다 (저작물)
 *     ✗ PDF 원문        ← 「리포트 그 자체」다
 *     ✗ 본문·요약 전문   ← 상세 페이지에 전문이 있지만 **저장하지 않는다**
 *     ✗ 차트·표 이미지
 *
 * 상세 페이지는 **목표주가 한 숫자를 읽으려고만** 연다. 읽은 뒤 본문은 버린다.
 * 제목은 식별자로만 남기고 재배포하지 않는다.
 *
 * 요청 간격을 넉넉히 두고, 신원을 밝히는 User-Agent 를 쓴다.
 * 이건 예의가 아니라 우리가 인터넷신문이기 때문이다.
 *
 * ── ⚠ 24곳 중 지금 되는 곳은 2곳이다 ──────────────────────────
 * 홈페이지가 전부 JS 껍데기(2~7KB)라 링크를 못 딴다. 사이트맵도 대부분 없다.
 * **한양 하나로 22곳을 단정하지 않는다**는 원칙대로, 확인된 곳만 넣었다.
 * 나머지는 브라우저로 리서치 주소를 확인한 뒤 하나씩 추가한다.
 * 표를 늘리는 것이 이 파일을 고치는 유일한 방법이다.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { put, storeStatus } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (compatible; SeoulMarketsBot/0.1; +https://seoulmarkets.com/about)';
const ARCHIVE = path.resolve(process.env.ARCHIVE_DIR ?? 'archive');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const PAGES = Number(argv.find((a) => a.startsWith('--pages='))?.slice(8)) || 1;
const ONLY = argv.find((a) => a.startsWith('--only='))?.slice(7) ?? null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 한국시간. 이 PC 는 이미 KST 라 `new Date()` 를 그대로 쓴다 — 9시간을 더하면 틀린다. */
function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}
const today = () => stamp().slice(0, 10);

/**
 * 증권사 사이트는 EUC-KR 이 아직도 흔하다. 헤더가 utf-8 이라고 적혀 있어도
 * 실제 바이트는 EUC-KR 인 경우가 있다(네이버 금융에서 이미 겪었다).
 * 그래서 **선언을 믿지 않고 바이트를 본다** — 한글이 안 나오면 다른 인코딩으로 다시 푼다.
 */
async function fetchHtml(url, charsetHint) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(20000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const 후보 = charsetHint ? [charsetHint, 'utf-8', 'euc-kr'] : ['utf-8', 'euc-kr'];
  let 최선 = '';
  let 최다 = -1;
  for (const enc of 후보) {
    let t;
    try { t = new TextDecoder(enc).decode(buf); } catch { continue; }
    // 깨진 인코딩은 U+FFFD 가 쏟아진다. 한글이 가장 많이 나온 해석을 고른다.
    const 한글 = (t.match(/[가-힣]/g) ?? []).length - (t.match(/�/g) ?? []).length * 2;
    if (한글 > 최다) { 최다 = 한글; 최선 = t; }
  }
  return 최선;
}

const 태그제거 = (s) =>
  s.replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 목표주가를 한 줄에서 읽는다.
 *
 * 증권사마다 쓰는 말이 다르다 — 목표주가 · 목표가 · 적정주가 · 적정가치 · TP.
 * 단위도 다르다 — 「15만원」 「150,000원」 「15.0만원」.
 * ⚠ **찾은 척하지 않는다.** 못 읽으면 null 이다. 0 이나 추정치를 넣지 않는다.
 */
export function parseTargetPrice(text) {
  if (!text) return null;

  const 라벨 = '(?:목표\\s*주?가|적정\\s*주?가|적정가치|목표가|TP)\\s*(?:를|을|는|은)?\\s*(?:기존\\s*)?';
  const 금액 = '([0-9][0-9,.]*)\\s*(만원|원)';

  const 값으로 = (n, 단위) => {
    const x = Number(String(n).replace(/,/g, ''));
    if (!Number.isFinite(x) || x <= 0) return null;
    const v = 단위 === '만원' ? Math.round(x * 10000) : Math.round(x);
    // 한국 주식에서 1만원 미만 목표주가는 있지만 100원 미만은 파싱 사고다.
    return v >= 100 && v <= 100_000_000 ? v : null;
  };

  /*
   * ⚠ 순서를 반드시 이 순서로 본다. 뒤집으면 **옛 목표가를 집는다.**
   *
   *   「목표주가를 245,000원에서 280,000원으로 상향」
   *
   *   위 문장에서 단순 규칙은 245,000 을 집는다 — 그건 **바뀌기 전 값**이다.
   *   HD현대 건에서 실제로 280,000 이 맞았는데, 앞 문단에 새 값이 먼저 나와서
   *   **우연히** 맞은 것이었다. 문장이 하나뿐이었으면 틀렸다.
   *   그래서 「A에서 B로」 꼴을 먼저 잡고 **B** 를 쓴다.
   */
  const 변경 = text.match(new RegExp(라벨 + 금액 + '\\s*에서\\s*' + 금액 + '\\s*(?:으?로)', 'i'));
  if (변경) return 값으로(변경[3], 변경[4]);

  const m = text.match(new RegExp(라벨 + 금액, 'i'));
  return m ? 값으로(m[1], m[2]) : null;
}

/** 투자의견을 우리 어휘로 정규화한다. 증권사 표기가 제각각이다. */
export function normalizeRating(s) {
  if (!s) return null;
  const t = s.trim().toUpperCase().replace(/\s+/g, '');
  if (/^(매수|BUY|STRONGBUY|적극매수)$/.test(t)) return 'BUY';
  if (/^(중립|HOLD|NEUTRAL|MARKETPERFORM)$/.test(t)) return 'HOLD';
  if (/^(매도|SELL|REDUCE|UNDERPERFORM|비중축소)$/.test(t)) return 'SELL';
  if (/^(N\.?R\.?|NOTRATED|의견없음)$/.test(t)) return 'NR';
  return null; // 모르면 모른다고 한다
}

/* ────────────────────────────────────────────────────────────
   증권사별 어댑터
   ⚠ 실제로 받아 보고 확인한 곳만 넣는다. 추측한 경로를 넣지 않는다.
   ──────────────────────────────────────────────────────────── */

const 증권사 = {
  /**
   * 미래에셋증권 — 2026-08-03 실측. 전체 2,596건.
   * 목록:  /bbs/board/message/list.do?categoryId=1521&pageIndex=N
   * 상세:  /bbs/board/message/view.do?messageId={id}&categoryId=1521
   * 목록 제목에 「S-Oil (010950/매수)」 꼴로 종목·코드·의견이 다 들어 있다.
   * 목표주가만 상세 첫 문단에 있다.
   */
  mirae: {
    ko: '미래에셋증권',
    origin: 'https://securities.miraeasset.com',
    list: (p) => `https://securities.miraeasset.com/bbs/board/message/list.do?categoryId=1521&pageIndex=${p}`,
    detail: (id) => `https://securities.miraeasset.com/bbs/board/message/view.do?messageId=${id}&categoryId=1521`,
    parseList(html) {
      /*
       * ⚠ 처음에 `view('id','no')` 로 split 해서 주변 텍스트를 읽었더니
       *   제목이 `" id="bbsTitle0"> S-Oil` 로 나왔다. **속성 한가운데를 잘랐기 때문**이다.
       *   표가 멀쩡한 <tr><td>4칸이니 행 단위로 읽는 게 맞다.
       *     작성일 · 제목(div.subject > b) · 첨부 · 작성자
       */
      const 행 = [];
      for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
        const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
        if (tds.length < 4) continue;                       // thead 등
        const id = tr[1].match(/view\('(\d+)'/)?.[1];
        if (!id) continue;
        const date = 태그제거(tds[0]).match(/20\d\d-\d{2}-\d{2}/)?.[0] ?? null;
        // 제목은 <b> 안에만 있다. 부제(<br/> 뒤)는 리포트 내용이라 안 가져간다.
        const 제목 = 태그제거(tds[1].match(/<b>([\s\S]*?)<\/b>/i)?.[1] ?? '');
        const 작성자 = 태그제거(tds[3]) || null;
        // 「종목명 (012345/매수)」 — 코드가 없으면 산업·전략 리포트다
        const 종목 = 제목.match(/^(.{1,40}?)\s*\((\d{6})\s*\/\s*([^)]{1,12})\)\s*$/);
        행.push({
          id,
          date,
          subject: 종목 ? 종목[1].trim() : null,
          code: 종목 ? 종목[2] : null,
          rating: 종목 ? normalizeRating(종목[3]) : null,
          analystRaw: 작성자,
        });
      }
      return 행.filter((r) => r.date);
    },
    parseDetail(html) {
      const b = 태그제거(html);
      // 작성자는 「작성자 이진호 작성일 2026-08-03」 꼴로 붙어 있다
      const analyst = b.match(/작성자\s+(.{2,20}?)\s+작성일/)?.[1]?.trim() ?? null;
      /*
       * ⚠ 앞부분 2,500자만 봤더니 목표주가를 못 찾았다. **머리말 메뉴가 그만큼 길다.**
       *   「작성일」 뒤부터가 기사 몸통이다. 거기서부터 3,000자만 본다.
       *   본문은 이 함수 안에서 끝난다 — 저장하지도 발행하지도 않는다.
       */
      const 시작 = b.indexOf('작성일');
      const 몸통 = 시작 >= 0 ? b.slice(시작, 시작 + 3000) : b.slice(0, 3000);
      const targetPrice = parseTargetPrice(몸통);
      return { analyst, targetPrice };
    },
  },

  /**
   * 한양증권 — 2026-08-03 실측.
   * 상세 페이지에 Analyst · 투자의견 · 목표주가 · 현재주가가 라벨과 함께 있다.
   */
  hanyang: {
    ko: '한양증권',
    origin: 'https://www.hygood.co.kr',
    list: (p) => `https://www.hygood.co.kr/board/researchAnalyzeCompany/list?page=${p}`,
    detail: (id) => `https://www.hygood.co.kr/board/researchAnalyzeCompany/detail/${id}?boardNo=17`,
    parseList(html) {
      const 행 = [];
      for (const m of html.matchAll(/researchAnalyzeCompany\/detail\/(\d+)[^>]*>([\s\S]{0,300}?)<\/a>/g)) {
        const t = 태그제거(m[2]);
        const 날짜 = t.match(/\[(\d{2})\/(\d{2})\]/);
        const 종목 = t.match(/([^[\]()]{1,40}?)\s*\((\d{6})\)/);
        행.push({
          id: m[1],
          // 목록은 [07/22] 꼴이라 연도가 없다. 상세에서 채운다.
          date: null,
          mmdd: 날짜 ? `${날짜[1]}-${날짜[2]}` : null,
          subject: 종목 ? 종목[1].trim() : null,
          code: 종목 ? 종목[2] : null,
          rating: null,
          analystRaw: null,
        });
      }
      return 행;
    },
    parseDetail(html) {
      const b = 태그제거(html);
      const analyst = b.match(/Analyst\s*[:：]?\s*([가-힣]{2,4})/)?.[1] ?? null;
      const rating = normalizeRating(b.match(/투자의견\s*[:：]?\s*([A-Za-z가-힣.]{1,12})/)?.[1]);
      const targetPrice = parseTargetPrice(b);
      /*
       * ⚠ 한양은 「작성일 2026년 07월 10일」 꼴이다. 숫자-구분자 형식만 찾다가
       *   전건 date=null 이 나왔다. **형식을 하나로 가정하지 않는다.**
       */
      const 년월일 = b.match(/작성일\s*(20\d\d)\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
      const 구분자 = b.match(/작성일\s*(20\d\d)[.\-/](\d{1,2})[.\-/](\d{1,2})/);
      const d = 년월일 ?? 구분자;
      const p2 = (n) => String(n).padStart(2, '0');
      return {
        analyst,
        rating,
        targetPrice,
        date: d ? `${d[1]}-${p2(d[2])}-${p2(d[3])}` : null,
      };
    },
  },
};

/* ──────────────────────────────────────────────────────────── */

async function 수집(key) {
  const a = 증권사[key];
  console.log(`\n── ${a.ko} ──`);
  const 기록 = [];
  let 실패 = 0;

  for (let p = 1; p <= PAGES; p++) {
    let 목록;
    try {
      목록 = a.parseList(await fetchHtml(a.list(p)));
    } catch (e) {
      console.log(`  목록 ${p}쪽 실패: ${e.message}`);
      break;
    }
    console.log(`  ${p}쪽 — ${목록.length}건`);
    if (!목록.length) break;

    for (const r of 목록) {
      // 종목 리포트가 아니면(코드 없음) 상세를 열지 않는다. 목표주가가 없는 글이다.
      if (!r.code) continue;
      try {
        const det = a.parseDetail(await fetchHtml(a.detail(r.id)));
        기록.push({
          broker: a.ko,
          id: r.id,                        // 저장 키가 된다. 재실행해도 덮어쓰기다
          date: det.date ?? r.date,
          subject: r.subject,
          code: r.code,
          rating: det.rating ?? r.rating,
          targetPrice: det.targetPrice ?? null,
          analyst: det.analyst ?? r.analystRaw ?? null,
          source: a.detail(r.id),          // 출처를 반드시 남긴다
          collectedAt: stamp(),
        });
      } catch (e) {
        실패++;
        console.log(`    ${r.id} 상세 실패: ${e.message}`);
      }
      await sleep(900); // 예의. 남의 서버를 몰아치지 않는다
    }
    await sleep(1200);
  }

  const 목표있음 = 기록.filter((r) => r.targetPrice).length;
  const 이름있음 = 기록.filter((r) => r.analyst).length;
  console.log(
    `  → ${기록.length}건 · 목표주가 ${목표있음} · 애널리스트 ${이름있음} · 실패 ${실패}`,
  );
  if (기록.length && 기록.length === 이름있음) console.log('    ✅ 애널리스트 전건 확보 — 네이버 경로로는 못 하던 것');
  return { 기록, 실패 };
}

async function main() {
  const 대상 = ONLY ? [ONLY] : Object.keys(증권사);
  const 잘못 = 대상.filter((k) => !증권사[k]);
  if (잘못.length) {
    console.error(`모르는 증권사: ${잘못.join(', ')}\n아는 곳: ${Object.keys(증권사).join(', ')}`);
    process.exit(1);
  }

  console.log(`증권사 직접 수집 — ${대상.length}곳 · ${PAGES}쪽${DRY ? ' · DRY' : ''}`);
  console.log('⚠ 사실만 받는다. 본문·PDF 는 받지도 저장하지도 않는다.\n');

  const 전체 = [];
  for (const k of 대상) {
    const { 기록 } = await 수집(k);
    전체.push(...기록);
  }

  if (DRY) {
    console.log('\n=== DRY — 저장하지 않는다. 표본 5건 ===');
    console.log(JSON.stringify(전체.slice(0, 5), null, 1));
    return;
  }

  const 실행 = stamp();
  /*
   * ⚠ 저장 키에 시각을 넣지 않는다.
   *   처음에 `{증권사}-{종목코드}-{수집시각}` 으로 했더니 **매일 돌릴 때마다
   *   같은 리포트가 새 파일로 쌓였다.** 하루만 지나도 아카이브가 거짓말을 한다.
   *   증권사가 매긴 **리포트 고유번호**를 키로 쓰면 재실행이 덮어쓰기가 된다.
   *   (한 종목에 같은 날 리포트가 둘일 수도 있다 — 종목코드는 유일 키가 못 된다)
   */
  for (const r of 전체) {
    const 날 = r.date ?? today();
    await put(
      `raw/broker/${날}/${r.broker}-${r.id}.json`,
      JSON.stringify(r, null, 2),
      'application/json',
    );
  }
  await put(
    `manifest/broker/${실행}.json`,
    JSON.stringify(
      {
        실행,
        증권사: 대상,
        건수: 전체.length,
        목표주가: 전체.filter((r) => r.targetPrice).length,
        애널리스트: 전체.filter((r) => r.analyst).length,
        store: storeStatus(),
      },
      null,
      2,
    ),
    'application/json',
  );
  console.log(`\n저장 ${전체.length}건 → ${ARCHIVE}/raw/broker/`);
}

// 테스트에서 import 할 수 있게 직접 실행일 때만 돈다.
// ⚠ Windows 다. `file://` + 경로로 문자열을 만들면 슬래시 개수가 안 맞아
//   조건이 조용히 거짓이 되고 **아무 출력 없이 끝난다.** 실제로 그렇게 됐다.
//   pathToFileURL 을 쓴다.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
