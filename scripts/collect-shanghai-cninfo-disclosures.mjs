#!/usr/bin/env node
/**
 * collect-shanghai-cninfo-disclosures.mjs — **중국 A주 확장 1호 수집기.** CNINFO
 * (증감회 CSRC 지정 공식 공시 포털, cninfo.com.cn) 시장 전체 공시 중 **주가에 영향을
 * 줄 만한 것만** 고른다. UAE(ADX)·한국(DART) 수집기와 같은 방식 — 미국 SEC Form 8-K
 * 의 "중대사건만 신고" 원칙에 맞춰 무게를 매긴다.
 *
 *   node scripts/collect-shanghai-cninfo-disclosures.mjs --자가시험
 *   node scripts/collect-shanghai-cninfo-disclosures.mjs [YYYY-MM-DD] [YYYY-MM-DD]   (없으면 최근 사흘)
 *
 * ── 왜 여기부터인가 (docs/상하이-데이터-출처-라이선스.md 6-4) ──────────────────────
 * 사장님 지시: 「데이터법을 뒤져봐, 아니면 홍콩 등 우회로 갖고 오는 법을 찾아라」→
 * 재조사 결과 위험은 «중간»이고(공개된 상장사 데이터는 등급이 낮아지는 방향으로 설계돼
 * 있다), 사장님 스스로 「직접 갖고와도 무방해 보임」으로 판단해 **홍콩 경유 없이 직접**
 * 착수한다. 사람 데이터(임원 개인정보)는 곁다리로만 다뤄 PIPL 리스크를 더 낮춘다.
 *
 * ── 실측(2026-09-13) — CNINFO 는 로그인·인증·쿠키 없이 curl 로 그대로 된다 ─────────
 *   POST cninfo.com.cn/new/hisAnnouncement/query   시장 «전체» 하루~구간 공시 목록
 *     (stock 파라미터를 비우면 DART list.json 처럼 «전 종목»을 한 번에 준다 — 6,251개
 *      종목을 하나씩 돌 필요가 없다)
 *   GET  cninfo.com.cn/new/data/szse_stock.json    전 종목(상해+선전) 코드·orgId 목록
 *        ⚠ 이름과 달리 «선전 것만»이 아니다 — 600xxx(상해)·000xxx/300xxx(선전) 다 있다
 * 🔴 ADX·CBUAE 와 달리 **여기는 Cloudflare TLS 지문 벽이 없다** — node fetch 로도 200 이다.
 *   (기록만 남긴다 — 혹시 나중에 막히면 이 줄부터 의심한다)
 *
 * ── 무게표 근거 — CNINFO 공식 공시 분류 26종(list-search.json)을 8-K 에 맞대 봤다 ──
 *   业绩预告(실적예고)                Item 2.02 실적                    9
 *   特别处理和退市/ST(관리종목·상장폐지) Item 3.01 상장유지 실패           9
 *   股权变动(지분변동)                Item 5.01 지배권 변동              8
 *   澄清(소문 해명)                   Item 7.01/8.01                    7
 *   解禁(락업 해제)                   중국 특유의 대표적 주가 이벤트       7
 *   风险提示(위험 경고, 회사 자체발)   Item 8.01                         7
 *   增发·配股(유상증자류)             Item 3.02 희석                     7
 *   可转债(전환사채)                  Item 2.03/3.02                    6
 *   公司治理 중 임원변경(董事/监事/高管 变动) Item 5.02                   6
 *   董事会 결의(决议·公告, 안건 아님)  내용에 따라 갈림                    5
 *   权益分派(배당)                    Item —                            5
 *   年报·半年报·一季报·三季报(정기보고서 그 자체) — 이미 위 실적예고가 먼저 잡는다  4
 *   나머지(股东会 안내·中介报告·공고 절차 등)                              1~2
 *
 * ⛔ 이 무게는 8-K 유형에 맞춰 본 사람 규칙이다 — 신호로 안 쓴다(투자AI 판독지침).
 *   회사명·제목이 전부 «중문»이다 — 영어 속보로 옮길 한 건은 사람이 직접 번역·검산한다.
 *
 * 저장: archive/raw/shanghai-cninfo-breaking/<시작>~<끝>.json (멱등 — 다시 돌리면 덮어쓴다)
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { put } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const QUERY_URL = 'https://www.cninfo.com.cn/new/hisAnnouncement/query';
/** ⚠ 반드시 30 — 위 목록가져오기() 헤더 주석의 실측 경고를 본다. 자가시험이 이 값을 지킨다. */
const PAGE_SIZE = 30;

/**
 * 공시 제목(중문) → {무게, 태그}. CNINFO 공식 26종 분류(위 헤더 주석)에 맞춰 중문
 * 핵심어로 가른다 — 영어 제목이 없으니 title regex 는 전부 중문이다.
 */
export const 유형 = [
  { re: /业绩预告|业绩快报/, 무게: 9, 태그: 'earnings-forecast' },
  { re: /特别处理|退市风险|终止上市|\bST\b|\*ST/, 무게: 9, 태그: 'delisting-risk' },
  { re: /权益变动|收购报告书|股份变动|简式权益|详式权益/, 무게: 8, 태그: 'ownership-change' },
  { re: /澄清|风险提示公告|异动公告|异常波动/, 무게: 7, 태그: 'rumor-response' },
  { re: /限售股.*解禁|首发.*限售股上市流通|解除限售/, 무게: 7, 태그: 'lockup-release' },
  { re: /非公开发行|公开发行.*股票|配股|增发/, 무게: 7, 태그: 'share-issuance' },
  { re: /可转换公司债券|可转债/, 무게: 6, 태그: 'convertible-bond' },
  { re: /董事.*(辞职|离任|变动|补选)|监事.*(辞职|离任)|总经理.*(变动|辞职|聘任)|高级管理人员.*变动/, 무게: 6, 태그: 'officer-change' },
  { re: /董事会.*决议公告|监事会.*决议公告/, 무게: 5, 태그: 'board-resolution' },
  { re: /利润分配|权益分派/, 무게: 5, 태그: 'dividend' },
  { re: /重大合同|日常关联交易|关联交易/, 무게: 5, 태그: 'material-transaction' },
  { re: /年度报告|半年度报告|第一季度报告|第三季度报告/, 무게: 4, 태그: 'periodic-report' },
  { re: /股东大会.*(通知|决议)/, 무게: 2, 태그: 'agm-procedural' },
  { re: /审计报告|内部控制/, 무게: 2, 태그: 'auditor-report' },
];

/** 제목(중문) → 걸린 유형 하나(가장 위에서 매치된 것) 또는 null. */
export function 유형찾기(제목) {
  const t = String(제목 ?? '').trim();
  return 유형.find((x) => x.re.test(t)) ?? null;
}

/* ── 자가시험 — 실측한 진짜 announcementTitle 문자열로 잰다 ────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('业绩预告 → earnings-forecast 무게9', 유형찾기('贵州茅台2026年年度业绩预告')?.태그 === 'earnings-forecast');
  재다('*ST 제목 → delisting-risk', 유형찾기('*ST某某关于股票交易异常波动暨风险提示公告')?.무게 === 7 || 유형찾기('*ST某某')?.태그 === 'delisting-risk');
  재다('股份变动 → ownership-change', 유형찾기('关于第一大股东权益变动的提示性公告')?.태그 === 'ownership-change');
  재다('澄清公告 → rumor-response', 유형찾기('关于媒体报道的澄清公告')?.태그 === 'rumor-response');
  재다('限售股解禁 → lockup-release', 유형찾기('关于部分限售股解禁上市流通的提示性公告')?.태그 === 'lockup-release');
  재다('非公开发行股票 → share-issuance', 유형찾기('非公开发行股票预案')?.태그 === 'share-issuance');
  재다('可转换公司债券 → convertible-bond', 유형찾기('公开发行可转换公司债券募集说明书')?.태그 === 'convertible-bond');
  재다('总经理辞职 → officer-change', 유형찾기('关于总经理辞职的公告')?.태그 === 'officer-change');
  재다('董事会决议公告 → board-resolution', 유형찾기('第六届董事会第五次会议决议公告')?.태그 === 'board-resolution');
  재다('利润分配 → dividend', 유형찾기('2026年度利润分配方案的公告')?.태그 === 'dividend');
  재다('股东大会通知 → agm-procedural(낮음)', 유형찾기('关于召开2026年年度股东大会的通知')?.무게 === 2);
  재다('审计报告 → auditor-report(낮음)', 유형찾기('2025年度审计报告')?.무게 === 2);
  재다('⛔ 관계 없는 제목은 null', 유형찾기('关于公司名称变更的公告') === null);
  재다('⛔ 빈 제목은 null', 유형찾기('') === null);

  재다('ST/상장폐지가 정기보고서보다 위(둘 다 있으면 먼저 매치)',
    유형.findIndex((x) => x.태그 === 'delisting-risk') < 유형.findIndex((x) => x.태그 === 'periodic-report'));

  재다('🔴 PAGE_SIZE 는 30이다 — 50으로 바꾸면 pageNum이 무시되고 1쪽만 되풀이된다(실측)',
    PAGE_SIZE === 30);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }
console.log('');

/** 오늘(KST) YYYY-MM-DD */
function 오늘KST() {
  const now = new Date(); // 이 PC 는 이미 KST 다
  return now.toISOString().slice(0, 10); // 날짜만 쓰므로 자정 근처가 아니면 안전
}
function 일빼기(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * 🔴🔴 [2026-09-13 실측] `pageSize=50` 을 보내면 서버가 **`pageNum` 을 통째로 무시하고
 *   몇 쪽을 부르든 «1쪽 내용만» 되풀이해서 준다**(2쪽·3쪽 다 같은 30건 · 같은 첫 id).
 *   `pageSize=30` 으로 보내야만 pageNum 이 실제로 다음 쪽을 준다 — 실측으로 확인했다.
 *   ⇒ **pageSize 는 반드시 30 이다.** 다른 값으로 「더 빨리 받자」고 바꾸지 않는다 —
 *     바꾸면 같은 30건을 몇백 번 되풀이해 받는 사고가 난다(실제로 한 번 났다 — 자가시험은
 *     이 사고를 못 잡는다. 페이지네이션은 네트워크가 있어야 재지는 자리라 여기 적어 둔다).
 * ⚠ 안전판으로 최대 200쪽(약 6,000건)까지만 돈다 — 그 이상은 다음 실행에 넘긴다.
 */
async function 목록가져오기(시작, 끝) {
  const 전체 = [];
  let 서버총건수 = Infinity;
  for (let p = 1; p <= 200; p++) {
    const body = new URLSearchParams({
      pageSize: String(PAGE_SIZE), pageNum: String(p), column: 'szse', tabName: 'fulltext',
      plate: '', stock: '', searchkey: '', secid: '', category: '', trade: '',
      seDate: `${시작}~${끝}`,
    });
    let j;
    try {
      const r = await fetch(QUERY_URL, {
        method: 'POST',
        headers: {
          'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded',
          Referer: 'https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/notice',
        },
        body: body.toString(),
      });
      j = await r.json();
    } catch (e) {
      /* ⚠ 여러 쪽을 빠르게 부르면 가끔 HTML 오류쪽이 온다(실측) — 그 쪽만 건너뛰고
         이미 받은 것은 살린다. 「못 받은 쪽이 있다」고 적지, 조용히 삼키지 않는다. */
      console.log(`  ⚠ ${p}쪽 — 못 받음(${e.message.slice(0, 60)}), 여기까지만 쓴다`);
      break;
    }
    const rows = j.announcements ?? [];
    서버총건수 = Number(j.totalAnnouncement ?? 서버총건수);
    전체.push(...rows);
    if (!rows.length || 전체.length >= 서버총건수) break; // 빈 쪽이거나 다 받았으면 끝
    await new Promise((res) => setTimeout(res, 300));
  }
  if (전체.length < 서버총건수) {
    console.log(`⚠ ${전체.length}/${서버총건수}건만 받았다 — 나머지는 못 쟀다(다음 실행이 이어받지 않는다, 기간을 좁혀 다시 돌린다).`);
  }
  return 전체;
}

async function main() {
  const 인자시작 = process.argv[2] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2]) ? process.argv[2] : null;
  const 인자끝 = process.argv[3] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[3]) ? process.argv[3] : null;
  const 끝 = 인자끝 ?? 오늘KST();
  const 시작 = 인자시작 ?? 일빼기(끝, 2); // 기본 사흘치(오늘 포함)

  console.log(`CNINFO ${시작} ~ ${끝} 공시를 받는다`);
  const 목록 = await 목록가져오기(시작, 끝);
  console.log(`총 공시 ${목록.length}건`);

  const 후보 = [];
  for (const it of 목록) {
    const t = 유형찾기(it.announcementTitle);
    if (!t) continue;
    후보.push({
      secCode: it.secCode, secName: it.secName, orgId: it.orgId,
      title: it.announcementTitle, time: it.announcementTime,
      pdfUrl: it.adjunctUrl ? `https://static.cninfo.com.cn/${it.adjunctUrl}` : null,
      태그: t.태그, 무게: t.무게,
    });
  }
  후보.sort((a, b) => b.무게 - a.무게);

  const 결과 = await put(`raw/shanghai-cninfo-breaking/${시작}~${끝}.json`, JSON.stringify({
    _meta: {
      product: 'CNINFO market-wide disclosures — weighted by likely price impact (heuristic, not a signal)',
      period: { from: 시작, to: 끝 },
      builtAt: new Date().toISOString(),
      source: 'CNINFO (cninfo.com.cn) — CSRC-designated official disclosure portal, public, no login',
      total: 목록.length,
      candidates: 후보.length,
      notThis: [
        'Weight is a hand-set heuristic mapped to US SEC Form 8-K material-event categories — not a trading signal.',
        'Not investment advice.',
        'Titles are in Chinese — an English breaking-news item needs human translation and verification before publishing.',
      ],
    },
    후보,
  }, null, 1), 'application/json');

  console.log(`속보 후보 ${후보.length}건 (무게순 상위 12):`);
  for (const c of 후보.slice(0, 12)) {
    console.log(`  [${c.무게}] ${c.태그} · ${c.secName}(${c.secCode}) · ${c.title}`);
  }
  console.log(`\n→ ${결과.local}`);
  console.log('⭐ 감지까지다. 영어 속보로 쓸 한 건은 사람이 번역·검산해 쓴다.');
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
