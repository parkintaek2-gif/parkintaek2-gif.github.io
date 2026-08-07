#!/usr/bin/env node
/**
 * 사이트맵을 **마디-이음 그림**으로 그린다 — 사장님이 보내 주신 꼴 그대로.
 *
 *   *「사이트맵은 이렇게 줘」* (2026-08-08 · KLifeMap 전체 사이트맵 그림 두 장)
 *
 * 짜임 — 사장님 그림에서 그대로 가져왔다
 *   ① 맨 위 가운데에 **첫 화면** 마디 하나
 *   ② 아래로 **묶음 상자**들. 상자마다 제목(핵심 서비스 · 코칭 · 구독·결제 …)
 *   ③ 상자 안에 **지면 마디** — 주소 + 한 줄 설명
 *   ④ 첫 화면에서 각 마디로 **이음선**
 *   ⑤ 사람이 안 보는 것(관리자·SEO 인프라)은 따로, 색을 달리
 *
 * ## ⛔ 지면이 수천 장인 곳은 낱장을 안 그린다
 *
 *   백년지도는 4,619장이다. 다 그리면 아무것도 안 보인다.
 *   **갈래 마디 하나에 수를 적는다** — `/school/{코드} · 고등학교 2,445장`.
 *   ⚠ 「다 그린 척」 하지 않는다. 상자 제목에 몇 장을 묶은 것인지 적는다.
 *
 * ## ⛔ 살아 있는 사이트맵에서 읽는다
 *
 *   저장소 목록이나 기억으로 그리지 않는다. `sitemap.xml` 을 받아서 센다.
 *   ⚠ 서울마켓은 사이트맵 색인이라 자식을 편다.
 *
 * 쓰는 법
 *   node scripts/make-sitemap-graph.mjs --out 폴더 --날짜 2026-08-08
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

/* ─────────────────────────────────────────────────────────
   사이트마다 **묶는 법**. 순서대로 첫 번째로 맞는 묶음에 들어간다.
   ⚠ 아무 데도 안 맞으면 「그 밖」으로 간다 — 조용히 버리지 않는다.
   ───────────────────────────────────────────────────────── */
const 짜임 = {
  '백년지도': {
    빛: '#c9a84c', 한마디: '대학 다음까지 — 고교·학과·대학을 한자리에',
    묶음: [
      { 제목: '🔵 파는 것', 색: '#7bc47f', 골라: (p) => p.startsWith('/report') },
      { 제목: '고교 (검색으로 들어오는 큰 문)', 골라: (p) => p.startsWith('/school') },
      { 제목: '학과 · 대학', 골라: (p) => /^\/(major|college-major|university)/.test(p) },
      { 제목: '축으로 보기', 골라: (p) => /^\/(region|age|size|how-long|after|work|research)/.test(p) },
      { 제목: '자료 · 소개', 골라: (p) => /^\/(data|about)/.test(p) || p === '/' },
    ],
  },
  'SeoulMarkets': {
    빛: '#5aa7d6', 한마디: '한국 시장 데이터 — 기사와 API',
    묶음: [
      { 제목: '🔵 파는 것', 색: '#7bc47f', 골라: (p) => /^\/(data|api|newsletter)/.test(p) },
      { 제목: '기사', 골라: (p) => p.startsWith('/article') },
      { 제목: '지표 지면', 골라: (p) => /^\/(equities|fx|rates|commodities|funds|macro|rankings)/.test(p) },
      { 제목: '회사 · 소개', 골라: (p) => /^\/(about)/.test(p) || p === '/' },
    ],
  },
  'K Culture Wire': {
    빛: '#c77dbb', 한마디: 'K콘텐츠 산업 지표 — 기사와 자료 한 벌',
    묶음: [
      { 제목: '🔵 파는 것', 색: '#7bc47f', 골라: (p) => /^\/(data|subscribe)/.test(p) },
      { 제목: '기사', 골라: (p) => /^\/articles?($|\/)/.test(p) },
      { 제목: '지표 지면', 골라: (p) => /^\/(titles|watched|actors|workforce|exports|tv-exports|webtoon|industry|staying-power|ladder-gap|ladder-churn|reach|screen-split|kpop-attention|esports)/.test(p) },
      { 제목: '회사 · 고객지원', 골라: (p) => /^\/(about|contact|corrections)/.test(p) || p === '/' },
    ],
  },
  'KLifeMap': {
    빛: '#7bc47f', 한마디: '명리·심리 코칭 — 리포트가 상품이다',
    묶음: [
      { 제목: '🔵 핵심 서비스', 색: '#7bc47f', 골라: (p) => /^\/(saju|mingli-gunghap|mingli-taekil|mingli-sungmyung)\.html/.test(p) },
      { 제목: '🔵 코칭 · 인텔리전스', 색: '#7bc47f', 골라: (p) => /^\/(coaching|intelligence|ai-coach|ai-intelligence|ai-report|psychometrics)\.html/.test(p) },
      { 제목: '🔵 구독 · 결제', 색: '#7bc47f', 골라: (p) => /^\/(pricing)\.html/.test(p) },
      { 제목: '무료로 여는 것', 골라: (p) => /^\/(daily|mansecalendar|ilzin|today|jeongbon-framework)/.test(p) },
      { 제목: '콘텐츠 (유입)', 골라: (p) => p.startsWith('/content') },
      { 제목: '회사 · 고객지원', 골라: (p) => /^\/(about|reviews|api|events|inquiry|refund|terms|privacy)\.html/.test(p) || p === '/' || p === '/index.html' },
    ],
  },
};

/** 갈래마다 사람 말 한 줄 */
const 설명 = {
  '/school': '고등학교 낱장', '/major': '학과 낱장', '/college-major': '대학 학과',
  '/university': '대학 낱장', '/region': '지역으로', '/age': '나이로', '/size': '규모로',
  '/how-long': '얼마나 다니나', '/after': '대학 이후', '/work': '바로 일터로', '/research': '연구',
  '/article': '기사', '/articles': '기사 목록', '/content': '콘텐츠 글',
  '/report': '학교 한 곳', '/report/area': '지역 한 벌',
  '/data': '자료 내려받기', '/about': '소개', '/': '첫 화면', '/index.html': '첫 화면',
  '/contact': '문의', '/corrections': '정정', '/subscribe': '구독 신청', '/newsletter': '뉴스레터',
  '/api': 'API 안내', '/rankings': '순위', '/equities': '주식', '/fx': '환율', '/rates': '금리',
  '/commodities': '원자재', '/funds': '펀드', '/macro': '거시', '/esports': 'e스포츠',
  '/titles': '작품', '/watched': '시청', '/actors': '배우', '/workforce': '인력',
  '/exports': '수출', '/tv-exports': 'TV 수출', '/webtoon': '웹툰', '/industry': '산업',
  '/staying-power': '지속력', '/ladder-gap': '사다리 격차', '/ladder-churn': '사다리 이동',
  '/reach': '도달', '/screen-split': '스크린 분할', '/kpop-attention': 'K팝 관심도',
  '/saju.html': '사주 AI 종합', '/mingli-gunghap.html': '궁합', '/mingli-taekil.html': '택일',
  '/mingli-sungmyung.html': '성명학', '/coaching.html': '코칭 허브', '/pricing.html': '요금 안내',
  '/psychometrics.html': 'Big Five·RIASEC', '/intelligence.html': '인텔리전스 허브',
  '/ai-coach.html': 'AI 코칭 대화', '/ai-intelligence.html': 'AI 활용 설명', '/ai-report.html': '전체 목록',
  '/daily.html': '오늘의 운세', '/mansecalendar.html': '만세력', '/ilzin.html': '일진',
  '/today': '오늘의 운세(자동)', '/jeongbon-framework.html': '정본 프레임워크',
  '/reviews.html': '후기', '/events.html': '이벤트', '/inquiry.html': '문의',
  '/refund.html': '환불', '/terms.html': '이용약관', '/privacy.html': '개인정보',
  '/about.html': '회사 소개', '/api.html': 'API 안내',
};

/**
 * ⛔ **사이트맵에 없지만 살아 있는 지면**. 안 그리면 「파는 물건이 아예 없는 것」처럼 보인다.
 *   noindex 라 sitemap.xml 에서는 안 나온다 — 값을 여는 날 검색에도 같이 연다.
 */
const 숨은것 = {
  '백년지도': {
    제목: '🔵 파는 것 (아직 검색에 안 염)', 색: '#7bc47f',
    것: [
      { 길: '/report/{학교코드}', 수: 1, 설명: '학교 한 곳 · 무료 예정' },
      { 길: '/report/area/{지역}', 수: 1, 설명: '지역 한 벌 · 9,900원' },
    ],
  },
};

const 사이트 = [
  { 이름: '백년지도', 주소: 'https://100yearmap.com' },
  { 이름: 'SeoulMarkets', 주소: 'https://seoulmarkets.com' },
  { 이름: 'K Culture Wire', 주소: 'https://www.kculturewire.com' },
  { 이름: 'KLifeMap', 주소: 'https://klifemap.ai' },
];

const 받기 = async (u) => { const r = await fetch(u, { redirect: 'follow' }); return { 코드: r.status, 글: await r.text() }; };
const 풀기 = (u) => { try { return decodeURIComponent(u); } catch { return u; } };

async function 사이트맵(뿌리) {
  const 첫 = await 받기(`${뿌리}/sitemap.xml`);
  if (첫.코드 !== 200) return [];
  const 모두 = [];
  if (/<sitemapindex/i.test(첫.글)) {
    for (const m of 첫.글.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const r = await 받기(m[1].trim());
      모두.push(...[...r.글.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1].trim()));
    }
  } else {
    모두.push(...[...첫.글.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1].trim()));
  }
  return 모두.map((u) => 풀기(u).replace(뿌리, '') || '/');
}

/**
 * 길들을 **마디**로 만든다.
 * 낱장이 여럿인 갈래는 **하나로 묶고 수를 적는다** — 4,619장을 다 그릴 수 없다.
 */
export function 마디만들기(길들) {
  const 갈래 = new Map();
  for (const p of 길들) {
    const 조각 = p.split('/').filter(Boolean);
    let 열쇠;
    if (조각.length === 0) 열쇠 = '/';
    else if (조각.length === 1) 열쇠 = `/${조각[0]}`;
    else 열쇠 = `/${조각[0]}${조각[0] === 'report' && 조각[1] === 'area' ? '/area' : ''}`;
    if (!갈래.has(열쇠)) 갈래.set(열쇠, []);
    갈래.get(열쇠).push(p);
  }
  const 마디 = [];
  for (const [열쇠, 것들] of 갈래) {
    if (것들.length === 1) 마디.push({ 길: 것들[0], 수: 1, 설명: 설명[것들[0]] ?? 설명[열쇠] ?? '' });
    else 마디.push({ 길: `${열쇠}/…`, 수: 것들.length, 설명: 설명[열쇠] ?? '' });
  }
  return 마디.sort((a, b) => b.수 - a.수);
}

/** 마디를 묶음에 넣는다. 아무 데도 안 맞으면 「그 밖」 — 조용히 버리지 않는다 */
export function 묶기(마디들, 규칙) {
  const 통 = 규칙.map((r) => ({ ...r, 것: [] }));
  const 그밖 = [];
  for (const n of 마디들) {
    const 길 = n.길.replace(/\/…$/, '');
    const i = 통.findIndex((b) => b.골라(길) || b.골라(n.길));
    if (i >= 0) 통[i].것.push(n); else 그밖.push(n);
  }
  const 결과 = 통.filter((b) => b.것.length);
  if (그밖.length) 결과.push({ 제목: '그 밖', 것: 그밖 });
  return 결과;
}

/* ── 그리기 ── */
const 몫 = (이름) => { const i = process.argv.indexOf(이름); return i >= 0 ? process.argv[i + 1] : null; };
const 낼폴더 = 몫('--out') ?? '.';
const 날짜 = 몫('--날짜') ?? '';

const 마디폭 = 176, 마디높 = 54, 마디틈 = 14, 줄틈 = 16, 한줄최대 = 4;
const 상자안 = 18, 상자제목 = 30, 상자틈 = 26, 위여백 = 132;

function 그림(이름, 묶음들, 총장) {
  const 짜 = 짜임[이름];
  let x = 40;
  const 상자들 = [];
  for (const b of 묶음들) {
    const 칸 = Math.min(한줄최대, b.것.length);
    const 줄수 = Math.ceil(b.것.length / 칸);
    /* ⚠ 상자가 제목보다 좁으면 **제목이 옆 상자를 덮는다.** 「고교 (검색으로…) 2,4」로 잘려 나왔다.
     *   제목 글자 수로 최소 너비를 잡는다 — 한글은 대략 15px, 장수 꼬리는 60px 본다. */
    const 제목너비 = b.제목.replace(/[^\S]/g, '').length * 15 + 92;
    const 너비 = Math.max(칸 * 마디폭 + (칸 - 1) * 마디틈 + 상자안 * 2, 제목너비);
    const 높이 = 상자제목 + 줄수 * 마디높 + (줄수 - 1) * 줄틈 + 상자안 * 2;
    const 마디들 = b.것.map((n, i) => ({
      ...n,
      x: x + 상자안 + (i % 칸) * (마디폭 + 마디틈),
      y: 위여백 + 상자제목 + 상자안 + Math.floor(i / 칸) * (마디높 + 줄틈),
    }));
    상자들.push({ ...b, x, y: 위여백, 너비, 높이, 마디들 });
    x += 너비 + 상자틈;
  }
  const 폭 = Math.max(1400, x + 40);
  const 높 = 위여백 + Math.max(...상자들.map((b) => b.높이)) + 90;
  const 뿌리x = 폭 / 2, 뿌리y = 64;

  const 선 = 상자들.flatMap((b) => b.마디들.map((n) => {
    const 끝x = n.x + 마디폭 / 2, 끝y = n.y;
    return `<path d="M ${뿌리x} ${뿌리y + 18} C ${뿌리x} ${(뿌리y + 끝y) / 2}, ${끝x} ${(뿌리y + 끝y) / 2}, ${끝x} ${끝y}" fill="none" stroke="#3a4150" stroke-width="1"/>`;
  })).join('');

  const 칸들 = 상자들.map((b) => `
    <div class="box" style="left:${b.x}px;top:${b.y}px;width:${b.너비}px;height:${b.높이}px;${b.색 ? `--bc:${b.색}` : ''}">
      <div class="btitle" ${b.색 ? `style="color:${b.색}"` : ''}>${b.제목}<span>${b.것.reduce((a, c) => a + c.수, 0).toLocaleString('ko-KR')}장</span></div>
    </div>`).join('')
    + 상자들.flatMap((b) => b.마디들.map((n) => `
    <div class="node${n.수 > 1 ? ' many' : ''}" style="left:${n.x}px;top:${n.y}px">
      <div class="p">${n.길}</div>
      <div class="d">${n.설명 || ''}${n.수 > 1 ? `<b>${n.수.toLocaleString('ko-KR')}장</b>` : ''}</div>
    </div>`)).join('');

  return `<!doctype html><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#0b0d12;color:#e9e9ee;
       font-family:'Noto Sans KR','Malgun Gothic',sans-serif;position:relative;overflow:hidden}
  h1{position:absolute;top:18px;left:0;width:100%;text-align:center;font-size:21px;font-weight:900}
  h1 b{color:${짜.빛}} h1 span{color:#8e95a1;font-weight:400;font-size:16px}
  svg{position:absolute;inset:0;width:100%;height:100%}
  .box{position:absolute;border:1px solid var(--bc,#2c323e);border-radius:9px;background:rgba(20,24,33,.55)}
  .btitle{position:absolute;top:-11px;left:16px;background:#0b0d12;padding:0 9px;
          font-size:14.5px;font-weight:700;color:#cfd4dd;white-space:nowrap}
  .btitle span{color:#6f7684;font-weight:400;margin-left:8px;font-size:13px}
  .node{position:absolute;width:${마디폭}px;height:${마디높}px;background:#1b202a;border:1px solid #2c323e;
        border-radius:6px;padding:7px 10px;display:flex;flex-direction:column;justify-content:center}
  .node.many{background:#20262f;border-color:#3a4150}
  .p{font-size:12.5px;color:#e9e9ee;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .d{font-size:11.5px;color:#8e95a1;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .d b{color:${짜.빛};font-weight:700;margin-left:5px}
  .root{position:absolute;left:${뿌리x - 84}px;top:${뿌리y - 18}px;width:168px;height:38px;
        background:${짜.빛};color:#0b0d12;border-radius:7px;display:flex;align-items:center;
        justify-content:center;font-weight:900;font-size:14px}
  .foot{position:absolute;bottom:20px;left:40px;font-size:13px;color:#6f7684}
</style>
<h1><b>${이름}</b> — 전체 사이트맵 <span>${날짜} 실측 · 사이트맵에 실린 ${총장.toLocaleString('ko-KR')}장</span></h1>
<svg>${선}</svg>
<div class="root">첫 화면</div>
${칸들}
<div class="foot">⚠ 낱장이 여럿인 갈래는 마디 하나로 묶고 장수를 적었습니다. 4,619장을 다 그리면 아무것도 안 보입니다.</div>`;
}

/* ── 뽑기 ── */
const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

const 파일 = { '백년지도': '사이트맵그림-1-백년지도', 'SeoulMarkets': '사이트맵그림-2-서울마켓', 'K Culture Wire': '사이트맵그림-3-케이컬쳐와이어', 'KLifeMap': '사이트맵그림-4-케이라이프맵' };
for (const s of 사이트) {
  const 길들 = await 사이트맵(s.주소);
  const 묶음들 = 묶기(마디만들기(길들), 짜임[s.이름].묶음);
  /* 사이트맵에 없지만 살아 있는 것을 맨 앞에 붙인다 — 안 그리면 파는 물건이 없어 보인다 */
  if (숨은것[s.이름]) 묶음들.unshift(숨은것[s.이름]);
  const html = 그림(s.이름, 묶음들, 길들.length);
  const 낼길 = path.join(낼폴더, `${파일[s.이름]}.png`);
  const 임시 = 낼길.replace(/\.png$/, '.tmp.html');
  fs.writeFileSync(임시, html, 'utf8');
  const p = await b.newPage();
  await p.goto('file:///' + 임시.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  const 크기 = await p.evaluate(() => ({ w: document.body.offsetWidth, h: document.body.offsetHeight }));
  await p.setViewport({ width: 크기.w, height: 크기.h, deviceScaleFactor: 2 });
  await p.screenshot({ path: 낼길 });
  await p.close();
  fs.unlinkSync(임시);
  console.log(`✅ ${path.basename(낼길)}  ${크기.w}×${크기.h}  ${길들.length}장 · 묶음 ${묶음들.length}개 · 마디 ${묶음들.reduce((a, x) => a + x.것.length, 0)}`);
}
await b.close();
