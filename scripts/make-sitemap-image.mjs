#!/usr/bin/env node
/**
 * 사이트맵을 **한 장짜리 그림**으로 만든다 — 사장님 지시(2026-08-08 08:3x).
 *
 *   *「모든 사이트의 사이트맵 업무보고때 줘」* → *「사이트맵은 이미지로 줘」* → *「한장짜리」*
 *
 * ## ⛔ 사이트맵을 **살아 있는 것에서** 읽는다
 *
 *   저장소의 목록이나 내 기억에서 그리지 않는다. `sitemap.xml` 을 실제로 받아 센다.
 *   ⚠ 서울마켓은 **사이트맵 색인**이라 자식 7개를 펴야 한다.
 *     색인만 세면 「7장」이 되는데, 오늘 실제로 한 번 그렇게 읽었다.
 *   ⚠ 한글 주소는 퍼센트 인코딩으로 온다. 갈래를 가를 때 풀어서 본다.
 *
 * ## ⚠ 사이트맵에 **없는 것**도 그린다
 *
 *   팔 지면(`/report/…`)은 noindex 라 사이트맵에 없다. 안 그리면
 *   「우리가 파는 물건이 아예 없는 것」처럼 보인다. **없는 까닭과 함께** 따로 그린다.
 *
 * 쓰는 법
 *   node scripts/make-sitemap-image.mjs --out 사이트맵.png
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

/**
 * ⚠ **값은 여기 한 곳에만 적는다.** 사장님 지시(08-08) — *「가격정책도 사이트별로 같이 보고해」*
 *   보고서마다 손으로 옮겨 적으면 한 곳만 고쳐지고 조용히 어긋난다.
 *   ⛔ 정해지지 않은 것은 **「미정」이라고 적는다.** 제안값을 정해진 값처럼 적지 않는다.
 */
const 사이트 = [
  {
    이름: '백년지도', 주소: 'https://100yearmap.com', 한마디: '대학 다음까지', 빛: '#c9a84c',
    네이버: 0,
    값: [
      { 무엇: '지역 한 벌 (구 단위 · 10곳 이상)', 얼마: '9,900원', 상태: '정함', 곁: '114개 구 · 검색에 안 엶(noindex)' },
      { 무엇: '학교 한 곳', 얼마: '무료', 상태: '정함', 곁: '이게 지역 한 벌의 광고다' },
      { 무엇: '지역 한 벌 (9곳 이하)', 얼마: '무료', 상태: '정함', 곁: '144개 구 · 적어서 무료라고 밝힌다' },
      { 무엇: '시 지면 (수원시 등)', 얼마: '무료', 상태: '정함', 곁: '구로 보내는 목차' },
      { 무엇: '그 밖 4,619장', 얼마: '무료', 상태: '정함', 곁: '학과·대학·고교 낱장' },
    ],
    말: '값이 정해졌고 **무료 144곳은 검색에 열었습니다**(오늘 라이브 확인). 파는 114곳은 그대로 닫아 둡니다 — 사는 사람만 봅니다.',
  },
  {
    이름: 'SeoulMarkets', 주소: 'https://seoulmarkets.com', 한마디: '한국 시장 데이터', 빛: '#5aa7d6',
    네이버: 0,
    값: [
      { 무엇: 'B2B 인력 패널', 얼마: '미정', 상태: '사장님 손', 곁: '제안 $299 한 갈래 / $999 전 갈래' },
      { 무엇: '/v1 API', 얼마: 'RapidAPI 유료 공개', 상태: '열림', 곁: '' },
      { 무엇: '기사 34편 · 지표 지면', 얼마: '무료', 상태: '정함', 곁: '유입용' },
    ],
    말: '만드는 것은 끝났고 **신청 폼까지 이어져 있습니다**(POST /v1/subscribe 200). 값만 정해지면 그날 붙입니다.',
  },
  {
    이름: 'K Culture Wire', 주소: 'https://www.kculturewire.com', 한마디: 'K콘텐츠 산업 지표', 빛: '#c77dbb',
    네이버: 0,
    값: [
      { 무엇: '드라마·배우 판정 한 벌', 얼마: '미정', 상태: '사장님 손', 곁: '제안 $49 한 번 / $19 달마다' },
      { 무엇: '넷플릭스 없는 한 벌', 얼마: '미정', 상태: '사장님 손', 곁: '조건 확인 전이라 따로 냄' },
      { 무엇: '기사 36편 · 지표 지면', 얼마: '무료', 상태: '정함', 곁: '유입용' },
    ],
    말: '405줄 중 **202줄은 「비었다」고 밝히고** 팝니다. 비슷한 것을 파는 곳이 없어 견줄 값이 없습니다.',
  },
  {
    이름: 'KLifeMap', 주소: 'https://klifemap.ai', 한마디: '명리·심리 코칭', 빛: '#7bc47f',
    네이버: 1,
    값: [
      { 무엇: '진로코칭', 얼마: '39,000원', 상태: '정함', 곁: '' },
      { 무엇: '자녀코칭', 얼마: '39,000원', 상태: '정함', 곁: '부모코칭이 여기 녹았다' },
      { 무엇: '관계코칭', 얼마: '79,000원', 상태: '정함', 곁: '부부·연인·이별 셋이 하나로' },
      { 무엇: '성향코칭', 얼마: '29,000원', 상태: '값만 있음', 곁: '⛔ 아직 살 지면이 없다' },
      { 무엇: '인생설계코칭', 얼마: '49,000원', 상태: '값만 있음', 곁: '⛔ 아직 살 지면이 없다' },
      { 무엇: '입구 심리검사 종합', 얼마: '19,000원', 상태: '정함', 곁: '백년지도에서 넘어오는 자리' },
      { 무엇: '구독', 얼마: '월 6,900 / 6개월 149,000', 상태: '정함', 곁: '' },
    ],
    말: '33종 → **다섯 갈래**로 줄였습니다. 값 범위 19,000~79,000. ⛔ 두 종은 값이 있는데 살 곳이 아직 없습니다.',
  },
];

/** 갈래 이름을 사람 말로 */
const 사람말 = {
  school: '고등학교', major: '학과', 'college-major': '대학 학과', university: '대학',
  region: '지역', age: '나이', article: '기사', articles: '기사 목록', content: '콘텐츠',
  data: '자료', about: '소개', work: '바로 일터로', after: '대학 이후',
  'how-long': '얼마나', size: '규모', research: '연구',
};

const 받기 = async (u) => {
  const r = await fetch(u, { redirect: 'follow' });
  return { 코드: r.status, 글: await r.text() };
};
const 풀기 = (u) => { try { return decodeURIComponent(u); } catch { return u; } };

async function 걷기(뿌리) {
  const 첫 = await 받기(`${뿌리}/sitemap.xml`);
  if (첫.코드 !== 200) return { 오류: `sitemap.xml ${첫.코드}`, 주소들: [], 자식: [] };
  const 색인 = /<sitemapindex/i.test(첫.글);
  /* ⚠ 이름을 `주소` 로 두면 사이트의 `주소`(도메인)를 가린다.
   *   `{...s, ...r}` 로 펼치는 순간 도메인이 배열로 덮여 `.replace` 가 없다며 터졌다.
   *   deploy.mjs 의 `뿌리`/`dist뿌리` 와 같은 꼴이다 — 오늘 두 번째다. */
  const 주소들 = [];
  const 자식 = [];
  if (색인) {
    for (const m of 첫.글.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const c = m[1].trim();
      const r = await 받기(c);
      const us = [...r.글.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1].trim());
      자식.push({ 이름: c.replace(뿌리, ''), 장: us.length });
      주소들.push(...us);
    }
  } else {
    주소들.push(...[...첫.글.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1].trim()));
  }
  return { 주소들, 자식, 색인 };
}

/** 첫 조각으로 묶는다. 낱장 하나뿐인 갈래는 「낱장」으로 모은다 */
export function 갈래로(주소들, 뿌리) {
  const 셈 = new Map();
  for (const u of 주소들) {
    const 길 = 풀기(u).replace(뿌리, '').replace(/^\/|\/$/g, '');
    const 첫 = 길 === '' ? '(첫 화면)' : 길.split('/')[0].replace(/\.html?$/i, '');
    셈.set(첫, (셈.get(첫) ?? 0) + 1);
  }
  const 큰것 = [...셈].filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]);
  /* ⚠ 낱장을 수로만 뭉치면 **사이트맵이 안 보인다.** KLifeMap 은 89장 중 25장이 낱장이라
   *   「콘텐츠 64 · 그 밖 25」 두 줄로 끝났다 — 사장님이 보시려던 것이 그 25장이다.
   *   묶을 것이 적은 사이트는 **이름을 편다.** */
  const 낱장이름 = [...셈].filter(([, v]) => v === 1).map(([k]) => k);
  return { 큰것, 낱장: 낱장이름.length, 낱장이름 };
}

const 몫 = process.argv.indexOf('--out');
const 낼곳 = 몫 >= 0 ? process.argv[몫 + 1] : 'sitemap.png';

const 모은것 = [];
for (const s of 사이트) {
  const r = await 걷기(s.주소);
  모은것.push({ ...s, ...r, ...갈래로(r.주소들, s.주소) });
}
const 합계 = 모은것.reduce((a, b) => a + b.주소들.length, 0);

/* 팔 지면은 noindex 라 사이트맵에 없다 — 따로 잰다 */
const 팔지면 = [];
for (const u of ['https://100yearmap.com/report/7010057', 'https://100yearmap.com/report/area/서울특별시-강동구']) {
  try { const r = await fetch(u, { method: 'HEAD' }); 팔지면.push({ u, 코드: r.status }); }
  catch { 팔지면.push({ u, 코드: 0 }); }
}

const 오늘 = process.argv.includes('--날짜') ? process.argv[process.argv.indexOf('--날짜') + 1] : '';

const 칸 = 모은것.map((s) => {
  const 줄 = s.큰것.slice(0, 8).map(([k, v]) =>
    `<div class="row"><span class="nm">${사람말[k] ?? k}</span><span class="dot"></span><span class="n">${v.toLocaleString('ko-KR')}</span></div>`).join('');
  const 자식줄 = s.자식.length
    ? `<div class="kids">사이트맵 ${s.자식.length}개로 나뉘어 있습니다<br>${s.자식.map((c) => `${c.이름.replace(/^\/sitemap-|\.xml$/g, '')} ${c.장}`).join(' · ')}</div>`
    : '';
  return `
  <div class="card" style="--c:${s.빛}">
    <div class="head">
      <div class="site">${s.이름}</div>
      <div class="sub">${s.한마디}</div>
      <div class="url">${s.주소.replace('https://', '')}</div>
    </div>
    <div class="total"><b>${s.주소들.length.toLocaleString('ko-KR')}</b><span>장</span></div>
    <div class="rows">${줄}${s.낱장 ? `<div class="row etc"><span class="nm">그 밖 낱장</span><span class="dot"></span><span class="n">${s.낱장}</span></div>` : ''}</div>
    ${자식줄}
  </div>`;
}).join('');

const html = `<!doctype html><meta charset="utf-8">
<style>
  @page { size: 1600px 1000px; margin: 0 }
  * { margin:0; padding:0; box-sizing:border-box }
  body { width:1600px; height:1000px; background:#0b0d12; color:#e9e9ee;
         font-family:'Noto Sans KR','Malgun Gothic',sans-serif; padding:46px 52px; }
  h1 { font-size:38px; font-weight:900; letter-spacing:-.5px }
  h1 b { color:#c9a84c }
  .when { color:#9aa0ac; font-size:17px; margin-top:8px }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:22px; margin-top:30px }
  .card { background:#141821; border:1px solid #262b36; border-top:4px solid var(--c);
          border-radius:10px; padding:22px 20px; display:flex; flex-direction:column }
  .site { font-size:25px; font-weight:900; color:var(--c) }
  .sub { font-size:14px; color:#9aa0ac; margin-top:3px }
  .url { font-size:12.5px; color:#6f7684; margin-top:6px }
  .total { margin:16px 0 12px; border-top:1px solid #262b36; padding-top:14px }
  .total b { font-size:44px; font-weight:900; font-family:'Noto Serif KR',serif }
  .total span { font-size:16px; color:#9aa0ac; margin-left:6px }
  .rows { flex:1 }
  .row { display:flex; align-items:baseline; font-size:16px; margin:9px 0 }
  .nm { color:#cfd4dd }
  .dot { flex:1; border-bottom:1px dotted #39404e; margin:0 8px 4px }
  .n { font-weight:700; font-variant-numeric:tabular-nums }
  .etc .nm, .etc .n { color:#8e95a1 }
  .kids { margin-top:12px; padding-top:11px; border-top:1px dashed #2c323e;
          font-size:12px; color:#8e95a1; line-height:1.6 }
  .foot { margin-top:26px; display:flex; gap:20px; align-items:stretch }
  .note { flex:1; background:#141821; border:1px solid #262b36; border-left:4px solid #a07830;
          border-radius:9px; padding:16px 20px; font-size:15px; line-height:1.65 }
  .note b { color:#c9a84c }
  .note .t { font-weight:900; margin-bottom:5px; font-size:16px }
  .sum { background:#141821; border:1px solid #262b36; border-radius:9px;
         padding:16px 30px; text-align:center; display:flex; flex-direction:column; justify-content:center }
  .sum b { font-size:46px; font-weight:900; color:#c9a84c; font-family:'Noto Serif KR',serif }
  .sum span { font-size:14px; color:#9aa0ac; margin-top:2px }
</style>
<h1>사이트맵 — 네 사이트 <b>${합계.toLocaleString('ko-KR')}장</b></h1>
<div class="when">${오늘} 실측 · 검색엔진에 내놓은 주소를 sitemap.xml 에서 그대로 셌습니다</div>
<div class="grid">${칸}</div>
<div class="foot">
  <div class="note">
    <div class="t">⚠ 사이트맵에 <b>일부러 안 넣은 것</b>이 있습니다</div>
    파는 리포트 2장(<b>학교 한 곳</b> · <b>지역 한 벌</b>)은 값이 정해지기 전이라 검색에 안 열었습니다.
    둘 다 지금 열립니다(${팔지면.map((x) => x.코드).join(' · ')}).
    <b>값을 여는 날 검색에도 같이 엽니다</b> — 무료로 열어도 검색에 없으면 광고가 안 됩니다.
  </div>
  <div class="note" style="border-left-color:#b04a4a">
    <div class="t">🔴 네이버에 <b>한 곳 빼고 없습니다</b></div>
    사이트맵에는 ${합계.toLocaleString('ko-KR')}장이 다 있는데 <b>네이버 색인은 KLifeMap 1건뿐</b>입니다.
    서치어드바이저에 사이트를 안 내밀어서입니다 — <b>사장님 손 10분</b>이면 됩니다.
  </div>
  <div class="sum"><b>${합계.toLocaleString('ko-KR')}</b><span>주소 합계</span></div>
</div>`;

/* ── 사이트별 한 장 ── 사장님 지시: 「사이트별로」 · 「가격정책도 사이트별로 같이」 */
const 값칸 = (s) => s.값.map((v) => {
  const 빛 = v.상태 === '정함' || v.상태 === '열림' ? '#7bc47f'
    : v.상태 === '사장님 손' ? '#d3a24a' : '#c77dbb';
  return `<tr>
    <td class="what">${v.무엇}</td>
    <td class="how"><b>${v.얼마}</b></td>
    <td class="st"><span style="color:${빛}">●</span> ${v.상태}</td>
    <td class="side">${v.곁 ?? ''}</td>
  </tr>`;
}).join('');

const 사이트장 = (s) => `<!doctype html><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box }
  body { width:1600px; height:1000px; background:#0b0d12; color:#e9e9ee;
         font-family:'Noto Sans KR','Malgun Gothic',sans-serif; padding:44px 52px }
  .top { display:flex; align-items:flex-end; gap:22px; border-bottom:3px solid ${s.빛}; padding-bottom:18px }
  h1 { font-size:44px; font-weight:900; color:${s.빛}; letter-spacing:-1px }
  .tag { font-size:18px; color:#9aa0ac; padding-bottom:7px }
  .u { margin-left:auto; font-size:16px; color:#6f7684; padding-bottom:8px }
  .big { display:flex; gap:20px; margin-top:24px }
  .kpi { background:#141821; border:1px solid #262b36; border-radius:10px; padding:18px 26px; min-width:180px }
  .kpi b { font-size:40px; font-weight:900; font-family:'Noto Serif KR',serif; display:block }
  .kpi span { font-size:14px; color:#9aa0ac }
  .kpi.warn { border-left:4px solid #b04a4a } .kpi.warn b { color:#e08a8a }
  .kpi.ok { border-left:4px solid #7bc47f }
  .cols { display:flex; gap:22px; margin-top:24px }
  .box { background:#141821; border:1px solid #262b36; border-radius:10px; padding:20px 24px }
  .box h2 { font-size:20px; font-weight:900; margin-bottom:14px; color:#e9e9ee }
  .map { width:430px }
  .row { display:flex; align-items:baseline; font-size:17px; margin:11px 0 }
  .nm { color:#cfd4dd } .dot { flex:1; border-bottom:1px dotted #39404e; margin:0 9px 4px }
  .n { font-weight:700; font-variant-numeric:tabular-nums }
  .price { flex:1 }
  table { width:100%; border-collapse:collapse; font-size:16.5px }
  td { padding:9px 6px; border-bottom:1px solid #1d222c; vertical-align:top }
  .what { color:#cfd4dd } .how { white-space:nowrap; width:190px } .how b { color:${s.빛}; font-size:18px }
  .st { white-space:nowrap; width:120px; color:#9aa0ac; font-size:15px }
  .side { color:#8e95a1; font-size:14.5px }
  .say { margin-top:20px; background:#141821; border:1px solid #262b36; border-left:4px solid ${s.빛};
         border-radius:9px; padding:16px 22px; font-size:16.5px; line-height:1.7 }
  .say b { color:${s.빛} }
  .ones { margin-top:14px; padding-top:12px; border-top:1px dashed #2c323e }
  .onehead { font-size:13px; color:#8e95a1; margin-bottom:8px }
  .ones span { display:inline-block; background:#1b202a; border:1px solid #262b36; border-radius:5px;
               padding:3px 8px; margin:0 5px 6px 0; font-size:13.5px; color:#cfd4dd }
  .kids { margin-top:14px; padding-top:12px; border-top:1px dashed #2c323e; font-size:13.5px; color:#8e95a1; line-height:1.7 }
</style>
<div class="top"><h1>${s.이름}</h1><div class="tag">${s.한마디}</div><div class="u">${s.주소.replace('https://', '')} · ${오늘}</div></div>
<div class="big">
  <div class="kpi"><b>${s.주소들.length.toLocaleString('ko-KR')}</b><span>사이트맵에 실린 주소</span></div>
  <div class="kpi ${s.네이버 ? 'ok' : 'warn'}"><b>${s.네이버}</b><span>네이버 검색 색인</span></div>
  <div class="kpi ${s.값.some((v) => v.상태 === '사장님 손') ? 'warn' : 'ok'}"><b>${s.값.filter((v) => v.상태 === '정함' || v.상태 === '열림').length}/${s.값.length}</b><span>값이 정해진 상품</span></div>
</div>
<div class="cols">
  <div class="box map"><h2>사이트맵</h2>
    ${s.큰것.map(([k, v]) => `<div class="row"><span class="nm">${사람말[k] ?? k}</span><span class="dot"></span><span class="n">${v.toLocaleString('ko-KR')}</span></div>`).join('')}
    ${s.낱장이름.length ? `<div class="ones"><div class="onehead">낱장 ${s.낱장이름.length}장</div>${s.낱장이름.map((n) => `<span>${사람말[n] ?? n}</span>`).join('')}</div>` : ''}
    ${s.자식.length ? `<div class="kids">사이트맵 ${s.자식.length}개로 나뉘어 있습니다<br>${s.자식.map((c) => `${c.이름.replace(/^\/sitemap-|\.xml$/g, '')} ${c.장}`).join(' · ')}</div>` : ''}
  </div>
  <div class="box price"><h2>가격정책</h2><table>${값칸(s)}</table></div>
</div>
<div class="say">${s.말.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</div>`;

const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

async function 찍기(내용, 낼길) {
  const 임시 = 낼길.replace(/\.png$/, '.tmp.html');
  fs.writeFileSync(임시, 내용, 'utf8');
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
  await p.goto('file:///' + 임시.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await p.screenshot({ path: 낼길, fullPage: false });
  await p.close();
  fs.unlinkSync(임시);
  return fs.statSync(낼길).size;
}

const 낸것 = [];
낸것.push([낼곳, await 찍기(html, 낼곳)]);
const 폴더 = path.dirname(낼곳);
const 파일이름 = { '백년지도': '사이트맵-1-백년지도', 'SeoulMarkets': '사이트맵-2-서울마켓', 'K Culture Wire': '사이트맵-3-케이컬쳐와이어', 'KLifeMap': '사이트맵-4-케이라이프맵' };
for (const s of 모은것) {
  const 길 = path.join(폴더, `${파일이름[s.이름] ?? s.이름}.png`);
  낸것.push([길, await 찍기(사이트장(s), 길)]);
}
await b.close();

for (const [f, n] of 낸것) console.log(`✅ ${path.basename(f)}  (${(n / 1024).toFixed(0)} KB)`);
for (const s of 모은것) console.log(`   ${s.이름.padEnd(16)} ${String(s.주소들.length).padStart(5)}장 · 갈래 ${s.큰것.length} · 값 ${s.값.length}줄`);
console.log(`   합계 ${합계}장 · 그림 ${낸것.length}장`);
