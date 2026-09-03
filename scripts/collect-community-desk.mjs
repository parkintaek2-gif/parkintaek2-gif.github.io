#!/usr/bin/env node
/**
 * collect-community-desk.mjs — **커뮤니티·SNS 의 «지금 뜨는 것»을 받아 유닛별로 갈라 낸다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만드나 — 사장님 지시 2026-09-03]
 *   > 「**이슈 좇기 = 뉴스, 커뮤니티, sns의 이슈 좇기**」
 *   > 「Reddit만 하지 말고, x, threads 등 sns, 디시인사이드 등 커뮤니티도 포함」
 *   > 「디시인사이드만 보지 말고, **커뮤니티 인기 사이트를 찾아서 3군데 정도** 봐」
 *
 *   우리가 받아 오던 것은 **뉴스 4곳뿐**이었다(collect-news-desk.mjs).
 *   커뮤니티·SNS 를 받는 자는 «하나도 없었다». 셋 중 하나만 좇고 있었다는 뜻이다.
 *
 * [어디를 보나 — 짐작이 아니라 robots.txt 를 재서 골랐다 (2026-09-03 실측)]
 *   ```
 *   에펨코리아 /best   User-agent: * 가 Disallow: / 뒤에 «Allow: /best» 를 둔다 → ✅ 열려 있다
 *   루리웹    /best   robots 에 AI 차단 낱말 0줄 · /best 는 금지 목록에 없다   → ✅
 *   인벤      웹진    robots 에 AI 차단 낱말 0줄 · 막힌 것은 특정 게임 방뿐    → ✅
 *   Reddit    .rss    robots 에 AI 차단 낱말 0줄 · 공개 피드                   → ✅ (영어권 손님 몫)
 *   ```
 *   🔴 **디시인사이드는 뺐다.** 처음엔 「User-agent: * → Allow: /」만 보고 넣으려 했는데,
 *      그 «위»에 AI 크롤러를 이름으로 막는 절이 있었다 —
 *      `ClaudeBot` · `anthropic-ai` · `Claude-Web` · `GPTBot` · `PerplexityBot` 이 다 적혀 있다.
 *      에펨코리아는 반대로 `Claude-User` · `Claude-SearchBot` 을 «허용» 목록에 올려 갈라 놓았다.
 *      한쪽은 우리를 이름으로 막았고 한쪽은 이름으로 열었다. **그 차이를 존중한다.**
 *
 * [무엇을 받나 — 사실만 받는다]
 *   ✅ 제목 · 올라온 시각 · 댓글 수 · 주소 · 방 이름
 *   ⛔ 본문 · 댓글 내용 · 이미지 · **글쓴이 이름** — 받지도 저장하지도 않는다.
 *      우리는 「무엇이 뜨고 있나」를 세는 것이지 남의 글을 옮기는 것이 아니다.
 *   ⛔ 남의 제목을 그대로 우리 지면에 싣지 않는다. 이 파일은 «우리가 무엇을 쓸지» 고르는 재료다.
 *
 * [어떻게 밝히나]
 *   ⛔ 사람 브라우저인 척하지 않는다. 우리 이름과 우리 주소를 UA 에 적는다.
 *      (뉴스 수집기는 매경이 403 을 줘서 사람 UA 를 쓰지만, 여기는 그럴 까닭이 없다 —
 *       재 보니 우리 이름으로도 네 곳 다 200 이 나온다.)
 *   ⛔ 한 곳을 몰아치지 않는다. 요청 사이에 2초를 둔다.
 *
 * [쓰는 법]
 *   node scripts/collect-community-desk.mjs            받아서 유닛별로 갈라 낸다
 *   node scripts/collect-community-desk.mjs --적는다    archive/raw/community-desk/ 에 남긴다
 *   node scripts/collect-community-desk.mjs --시험      자가시험만 (그물 안 탄다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 엔티티풀기, 수뽑기 } from './collect-news-desk.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');

/* 우리 이름으로 나간다. 막히면 막힌 대로 적는다 — 속여서 받지 않는다. */
const UA = 'KCultureWireIssueRadar/1.0 (+https://www.kculturewire.com; issue radar, titles only)';

export const 우물들 = [
  { 곳: '에펨코리아', 갈래: '커뮤니티', 꼴: 'fmkorea',
    주소: 'https://www.fmkorea.com/best', 바탕: 'https://www.fmkorea.com' },
  { 곳: '루리웹', 갈래: '커뮤니티', 꼴: 'ruliweb',
    주소: 'https://bbs.ruliweb.com/best', 바탕: 'https://bbs.ruliweb.com' },
  { 곳: '인벤', 갈래: '커뮤니티', 꼴: 'inven',
    주소: 'https://www.inven.co.kr/board/webzine/2097', 바탕: 'https://www.inven.co.kr' },
  /* 영어권 손님 몫 — 우리 독자는 영어권이다(사장님 2026-08-05) */
  { 곳: 'Reddit r/kpop', 갈래: 'SNS', 꼴: 'rss', 주소: 'https://www.reddit.com/r/kpop/.rss', 바탕: '' },
  { 곳: 'Reddit r/KDRAMA', 갈래: 'SNS', 꼴: 'rss', 주소: 'https://www.reddit.com/r/KDRAMA/.rss', 바탕: '' },
  { 곳: 'Reddit r/koreanvariety', 갈래: 'SNS', 꼴: 'rss', 주소: 'https://www.reddit.com/r/koreanvariety/.rss', 바탕: '' },
  { 곳: 'Reddit r/korea', 갈래: 'SNS', 꼴: 'rss', 주소: 'https://www.reddit.com/r/korea/.rss', 바탕: '' },
];

/* ── 유닛 가르기 ────────────────────────────────────────────────────────────
 * 커뮤니티 인기글은 갈래가 섞여 있다. 그래서 «제목의 낱말»로 가른다.
 * ⚠ 이것은 판정이 아니라 «먼저 볼 것»을 고르는 체다. 어느 칸에도 안 걸리면 «갈래없음»이다.
 *   0 으로 채우지 않는다 — 안 걸린 것은 안 걸렸다고 센다.
 */
export const 유닛낱말 = {
  '5번': ['케이팝', '아이돌', '걸그룹', '보이그룹', '드라마', '배우', '가수', '영화', '예능',
    '앨범', '컴백', '데뷔', '넷플릭스', '뮤비', '뮤직', '무대', '콘서트', '팬덤', '연예',
    'kpop', 'k-pop', 'idol', 'drama', 'netflix', 'comeback', 'album', 'mv', 'variety', 'actor'],
  '6번': ['주식', '증시', '코스피', '코스닥', '환율', '금리', '부동산', '집값', '연봉', '물가',
    '경제', '투자', '삼성전자', '반도체', '세금', '대출', '은행', '비트코인', '실적',
    'stock', 'kospi', 'kosdaq', 'economy', 'exports', 'semiconductor', 'inflation', 'interest rate'],
  '3번': ['대학', '수능', '입시', '취업', '학교', '학원', '전공', '졸업', '연금', '출산',
    '육아', '결혼', '노후', '정년', '공무원', '학점', '등록금',
    'university', 'college', 'tuition', 'wage', 'birth rate', 'marriage', 'pension', 'employment'],
};

export function 유닛가르기(제목) {
  const t = String(제목 ?? '').toLowerCase();
  const 걸린 = [];
  for (const [유닛, 말들] of Object.entries(유닛낱말)) {
    const 맞은 = 말들.filter((w) => t.includes(w.toLowerCase()));
    if (맞은.length) 걸린.push({ 유닛, 맞은 });
  }
  if (!걸린.length) return { 유닛: '갈래없음', 맞은: [] };
  걸린.sort((a, b) => b.맞은.length - a.맞은.length);
  return { 유닛: 걸린[0].유닛, 맞은: 걸린[0].맞은 };
}

/* ── 우물별 읽기 ──────────────────────────────────────────────────────────── */

/** 에펨코리아 /best — `<h3 class="title">` 안에 `<a href>` 와 `<span class="ellipsis-target">` */
export function fmkorea읽기(html, 바탕 = 'https://www.fmkorea.com') {
  const 나온다 = [];
  for (const m of String(html ?? '').matchAll(/<h3 class="title"[^>]*>([\s\S]{0,900}?)<\/h3>([\s\S]{0,400}?)<\/li>/g)) {
    const 덩이 = m[1];
    const 뒤 = m[2] || '';
    const 제목 = 엔티티풀기((덩이.match(/<span class="ellipsis-target"[^>]*>([\s\S]*?)<\/span>/) || [])[1] || '');
    if (!제목 || 제목.length < 4) continue;
    const 길 = 엔티티풀기((덩이.match(/href="([^"]+)"/) || [])[1] || '');
    const 댓글 = Number((덩이.match(/<span class="comment_count">\[(\d+)\]/) || [])[1] || 0);
    const 언제 = 엔티티풀기((뒤.match(/<span class="regdate">([\s\S]*?)</) || [])[1] || '');
    const 방 = 엔티티풀기((뒤.match(/<span class="category">[\s\S]*?>([^<]{1,20})<\/a>/) || [])[1] || '');
    나온다.push({ 제목, 길: 길 ? (길.startsWith('http') ? 길 : 바탕 + 길) : '', 댓글, 언제, 방 });
  }
  return 나온다;
}

/** 루리웹 /best — `<a class="subject_link ...">` 안에 `<strong class="text_over">제목</strong>` */
export function ruliweb읽기(html, 바탕 = 'https://bbs.ruliweb.com') {
  const 나온다 = [];
  for (const m of String(html ?? '').matchAll(/<a class="subject_link[^"]*"\s+href="([^"]+)"[\s\S]{0,900}?<(?:strong|span) class="text_over">([\s\S]*?)<\/(?:strong|span)>([\s\S]{0,200}?)<\/a>/g)) {
    const 제목 = 엔티티풀기(m[2]);
    if (!제목 || 제목.length < 4) continue;
    const 댓글 = Number((String(m[3]).match(/\((\d+)\)/) || [])[1] || 0);
    const 길 = m[1].startsWith('http') ? m[1] : 바탕 + m[1];
    const 방 = (m[1].match(/[?&]m=([a-z]+)/) || [])[1] || '';
    나온다.push({ 제목, 길, 댓글, 언제: '', 방 });
  }
  return 나온다;
}

/** 인벤 웹진 — 지면의 링크 제목을 뽑는다. 구조가 바뀌면 0건이 나오고, 0건은 0건이라 적는다.
 *  ⚠ 뒤 300자는 «내다보기»(?=)로 읽는다. 그냥 읽으면 다음 링크까지 먹어 절반이 사라진다. */
export function inven읽기(html, 바탕 = 'https://www.inven.co.kr') {
  const 본 = new Map();
  for (const m of String(html ?? '').matchAll(/<a class="subject-link" href="([^"]+)">([\s\S]{0,700}?)<\/a>(?=([\s\S]{0,300}))/g)) {
    const 덩이 = m[2];
    const 방조각 = (덩이.match(/<span class="category">[^<]*<\/span>/) || [])[0] || '';
    /* 제목이 <b> 안에 있을 때도 있고 «맨 글자»일 때도 있다 — 실측 53건 중 50건이 맨 글자였다.
       그래서 방 이름 조각만 떼고 나머지 글자를 다 제목으로 본다. */
    const 제목 = 엔티티풀기(방조각 ? 덩이.split(방조각).join('') : 덩이);
    if (제목.length < 4) continue;
    const 방 = 엔티티풀기((덩이.match(/<span class="category">\[?([^<\]]*)/) || [])[1] || '');
    const 댓글 = Number((String(m[3]).match(/class="con-comment">\[(\d+)\]/) || [])[1] || 0);
    const 길 = m[1].startsWith('http') ? m[1] : 바탕 + m[1];
    if (!본.has(제목)) 본.set(제목, { 제목, 길, 댓글, 언제: '', 방 });
  }
  return [...본.values()];
}

/** Reddit .rss — Atom 이다(`<entry>`), RSS 가 아니다 */
export function atom읽기(xml) {
  const 나온다 = [];
  for (const m of String(xml ?? '').matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const 덩이 = m[1];
    const 제목 = 엔티티풀기((덩이.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '');
    if (!제목) continue;
    const 길 = ((덩이.match(/<link[^>]*href="([^"]+)"/) || [])[1] || '');
    const 언제 = ((덩이.match(/<updated>([\s\S]*?)<\/updated>/) || [])[1] || '');
    나온다.push({ 제목, 길, 댓글: 0, 언제, 방: '' });
  }
  return 나온다;
}

/* ── 그물 ──────────────────────────────────────────────────────────────── */
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 받는다(url) {
  try {
    const r = await fetch(url, {
      redirect: 'follow', signal: AbortSignal.timeout(25000),
      headers: { 'User-Agent': UA, Accept: 'text/html,application/atom+xml,application/xml,*/*' },
    });
    if (!r.ok) return { 코드: r.status };
    const 글 = await r.text();
    return { 코드: r.status, 글 };
  } catch (e) { return { 못쟀다: String(e.message).slice(0, 60) }; }
}

export function 읽기고르기(꼴) {
  if (꼴 === 'fmkorea') return fmkorea읽기;
  if (꼴 === 'ruliweb') return ruliweb읽기;
  if (꼴 === 'inven') return inven읽기;
  return atom읽기;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────
 * ⛔ 「그물을 탔더니 몇 건 나왔다」는 시험이 아니다 — 남의 지면이 바뀌면 같이 바뀐다.
 *    여기서는 «우리 코드»가 정해진 글자를 정해진 대로 읽는지만 본다.
 */
function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  /* 실제로 받아 온 글자를 줄여 만든 본보기다 */
  const fm = '<li><h3 class="title" data-title-ellipsis="true">\t<a href="/index.php?mid=best2&amp;document_srl=1029">'
    + '<span class="ellipsis-target">본인이 잘생긴 얼굴이었다는 백종원쌤 jpg.</span>&nbsp;'
    + '<span class="comment_count">[369]</span></a></h3><div><span class="category">'
    + '<a href="/humor">유머</a> /</span><span class="regdate">\t2 시간 전\t</span></div></li>';
  const f = fmkorea읽기(fm);
  본다('에펨: 한 건을 읽는다', f.length === 1);
  본다('에펨: 제목에서 댓글수 조각을 빼낸다', f[0] && f[0].제목 === '본인이 잘생긴 얼굴이었다는 백종원쌤 jpg.');
  본다('에펨: 댓글 수를 센다', f[0] && f[0].댓글 === 369);
  본다('에펨: 상대주소에 바탕을 붙인다', f[0] && f[0].길.startsWith('https://www.fmkorea.com/index.php'));
  본다('에펨: 방 이름을 읽는다', f[0] && f[0].방 === '유머');
  본다('에펨: 올라온 시각을 읽는다', f[0] && f[0].언제 === '2 시간 전');

  const ru = '<td class="subject">\n<a class="subject_link deco flex center" href="/best/board/300143/read/765?m=humor">\n'
    + '<span style="x">1</span>\n<strong class="text_over">진짜 엔진오일 안가는 사람들은 이유가 뭐임?</strong>\n'
    + '<span class="num_reply flex_item_1"> (100)</span>\n</a></td>'
    + '<td class="writer text_over screen_out">\n좌파적인 극우</td>';
  const r = ruliweb읽기(ru);
  본다('루웹: 한 건을 읽는다', r.length === 1);
  본다('루웹: 제목을 읽는다', r[0] && r[0].제목 === '진짜 엔진오일 안가는 사람들은 이유가 뭐임?');
  본다('루웹: 댓글 수를 센다', r[0] && r[0].댓글 === 100);
  본다('루웹: 방 이름을 읽는다', r[0] && r[0].방 === 'humor');
  /* 🔴 이것이 이 자에서 제일 중요한 시험이다 — 글쓴이가 지면에 «있는데도» 안 담는지 본다 */
  본다('루웹: 글쓴이를 담지 않는다',
    r[0] && !JSON.stringify(r[0]).includes('좌파적인'));
  본다('루웹: 담는 칸은 다섯 개뿐이다',
    r[0] && Object.keys(r[0]).sort().join(',') === '길,댓글,방,언제,제목');

  const at = '<feed><entry><title>NewJeans announce comeback</title>'
    + '<link href="https://www.reddit.com/r/kpop/comments/aa/"/><updated>2026-09-03T01:00:00+00:00</updated></entry>'
    + '<entry><title>&#49345;&#54408;</title><link href="u"/></entry></feed>';
  const a = atom읽기(at);
  본다('레딧: entry 두 건을 읽는다', a.length === 2);
  본다('레딧: 제목과 주소를 읽는다', a[0] && a[0].제목 === 'NewJeans announce comeback' && a[0].길.includes('/r/kpop/'));
  본다('레딧: 숫자 실체참조를 푼다', a[1] && a[1].제목 === '상품');
  본다('레딧: 시각을 읽는다', a[0] && a[0].언제.startsWith('2026-09-03'));

  본다('가르기: K컬처 낱말이면 5번', 유닛가르기('아이돌 컴백 무대 봤는데').유닛 === '5번');
  본다('가르기: 금융 낱말이면 6번', 유닛가르기('코스피 오늘 환율 어떻게 되냐').유닛 === '6번');
  본다('가르기: 교육 낱말이면 3번', 유닛가르기('수능 끝나고 대학 어디 감').유닛 === '3번');
  본다('가르기: 영어 제목도 가른다', 유닛가르기('NewJeans comeback album').유닛 === '5번');
  /* ⛔ 0 으로 채우지 않는다 — 안 걸린 것은 «갈래없음»으로 센다 */
  본다('가르기: 안 걸리면 갈래없음', 유닛가르기('오늘 점심 뭐 먹지').유닛 === '갈래없음');
  본다('가르기: 더 많이 맞은 쪽을 고른다',
    유닛가르기('아이돌 드라마 앨범 컴백 그리고 주식').유닛 === '5번');

  /* 🔴 실제로 걸린 오판 — 이 줄이 있어야 다시 안 걸린다 */
  본다('가르기: K팝 기사의 「won」을 금융으로 보내지 않는다',
    유닛가르기('RIIZE have donated 100 million won to Samsung Seoul Hospital').유닛 !== '6번');
  본다('가르기: 「won」이 이겼다는 뜻일 때도 금융이 아니다',
    유닛가르기('This group won the daesang').유닛 !== '6번');

  /* 루리웹은 제목을 strong 으로도 span 으로도 쓴다 — 실측 32건 중 strong 은 4건뿐이었다 */
  const ru2 = '<a class="subject_link deco flex center" href="/best/board/300143/read/76?m=humor_only&t=now">' +
    '<span class="text_over">오늘 무슨 일 있었냐</span><span class="num_reply flex_item_1"> (3)</span></a>';
  const r2 = ruliweb읽기(ru2);
  본다('루웹: span 꼴 제목도 읽는다', r2.length === 1 && r2[0].제목 === '오늘 무슨 일 있었냐');
  본다('루웹: span 꼴에서도 댓글을 센다', r2[0] && r2[0].댓글 === 3);

  const iv = '<a class="subject-link" href="https://www.inven.co.kr/board/webzine/2097/272928">' +
    '<span class="category">[기타]</span><b>개편된 오픈 이슈 갤러리 규정 안내</b></a>' +
    '<span class="con-comment">[159]</span></div>';
  const i2 = inven읽기(iv);
  본다('인벤: 한 건을 읽는다', i2.length === 1);
  본다('인벤: 제목을 읽는다', i2[0] && i2[0].제목 === '개편된 오픈 이슈 갤러리 규정 안내');
  본다('인벤: 방 이름을 읽는다', i2[0] && i2[0].방 === '기타');
  본다('인벤: 댓글 수를 센다', i2[0] && i2[0].댓글 === 159);

  /* 🔴 인벤에서 실제로 걸린 것 — 닫는 태그를 요구하면 53개 중 3개만 걸렸다 */
  const iv2 = '<a class="subject-link" href="/board/webzine/2097/1"><span class="category">[뉴스]</span><b>첫 번째 글</b></a>'
    + '<a class="subject-link" href="/board/webzine/2097/2"><span class="category">[뉴스]</span><b>두 번째 글</b></a>';
  본다('인벤: 닫는 태그가 없어도 여러 건을 읽는다', inven읽기(iv2).length === 2);

  const iv3 = '<a class="subject-link" href="/board/webzine/2097/3"><span class="category">[유머]</span>'
    + 'K-민간요법을 체험한 일본인 와이프.</a>';
  본다('인벤: <b> 없는 맨 글자 제목도 읽는다',
    inven읽기(iv3)[0] && inven읽기(iv3)[0].제목 === 'K-민간요법을 체험한 일본인 와이프.');
  본다('인벤: 그때도 방 이름은 따로 읽는다', inven읽기(iv3)[0] && inven읽기(iv3)[0].방 === '유머');

  본다('수뽑기를 뉴스 수집기에서 가져다 쓴다', 수뽑기('조회수 1,234명 돌파').쓸만한가 === true);
  본다('꼴에 맞는 읽개를 고른다',
    읽기고르기('fmkorea') === fmkorea읽기 && 읽기고르기('rss') === atom읽기);
  본다('우물이 일곱 곳이다', 우물들.length === 7);
  본다('디시인사이드는 없다 — robots 가 우리를 이름으로 막았다',
    !우물들.some((u) => u.곳.includes('디시')));
  본다('우리 이름으로 나간다 — 사람 브라우저인 척하지 않는다',
    UA.includes('KCultureWire') && !UA.includes('Mozilla'));

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

/* ── 본체 ─────────────────────────────────────────────────────────────── */
async function main() {
  const 인자 = process.argv.slice(2);
  const 시험만 = 인자.includes('--시험');
  const 적나 = 인자.includes('--적는다');

  console.log('# 커뮤니티·SNS 이슈 레이더\n');
  const 흠 = 자가시험();
  if (시험만) { process.exit(흠 ? 1 : 0); }
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 그물을 타지 않는다.'); process.exit(1); }

  const 잰때 = new Date();
  console.log(`\n잰 때 — ${잰때.toLocaleString('ko-KR')} KST\n`);

  const 담은것 = [];
  const 못받은곳 = [];
  for (const u of 우물들) {
    const r = await 받는다(u.주소);
    if (!r.글) {
      못받은곳.push({ 곳: u.곳, 까닭: r.못쟀다 ? `못 쟀다(${r.못쟀다})` : `코드 ${r.코드}` });
      await 잠깐(u.갈래 === 'SNS' ? 20000 : 2000);
      continue;
    }
    const 글들 = 읽기고르기(u.꼴)(r.글, u.바탕);
    for (const g of 글들) {
      const 갈림 = 유닛가르기(g.제목);
      담은것.push({ ...g, 곳: u.곳, 갈래: u.갈래, 유닛: 갈림.유닛, 맞은낱말: 갈림.맞은,
        수: 수뽑기(g.제목).수 });
    }
    console.log(`  ${글들.length ? '✅' : '⬜'} ${u.곳} — ${글들.length}건`);
    await 잠깐(u.갈래 === 'SNS' ? 20000 : 2000);
  }

  for (const m of 못받은곳) console.log(`  🔴 ${m.곳} — ${m.까닭}`);

  /* ── 유닛별로 갈라 낸다 ── */
  console.log('\n## 유닛별\n');
  const 순서 = ['5번', '6번', '3번', '갈래없음'];
  for (const 유닛 of 순서) {
    const 것들 = 담은것.filter((d) => d.유닛 === 유닛);
    console.log(`### ${유닛} — ${것들.length}건`);
    if (유닛 === '갈래없음') { console.log('  (우리 세 축 어디에도 안 걸린 것 — 0 으로 채우지 않고 센다)\n'); continue; }
    const 앞선 = 것들.slice().sort((a, b) => (b.댓글 || 0) - (a.댓글 || 0)).slice(0, 8);
    for (const d of 앞선) {
      const 수표 = d.수.length ? ` 〔수: ${d.수.join(' ')}〕` : '';
      console.log(`  · [${d.곳}] ${d.제목}${수표}  (댓글 ${d.댓글}${d.언제 ? ' · ' + d.언제 : ''})`);
    }
    console.log('');
  }

  /* ⚠ 커뮤니티의 «뜨거움»은 제목의 수가 아니라 **댓글 수**로 잰다.
     처음엔 뉴스 수집기의 수뽑기를 그대로 썼는데 84건 중 0건이 걸렸다 —
     그 자는 「12.3%」·「1,234명」 같은 한국 기사 제목을 재는 자이지 커뮤니티 글제목을 재는 자가 아니다.
     ⛔ 안 맞는 자로 0 을 내고 「0건이다」라고 적는 것이 제일 나쁘다. 자를 바꾼다. */
  const 우리축 = 담은것.filter((d) => d.유닛 !== '갈래없음');
  const 댓글값 = 담은것.map((d) => d.댓글 || 0).filter((n) => n > 0);
  const 평균댓글 = 댓글값.length ? Math.round(댓글값.reduce((a, b) => a + b, 0) / 댓글값.length) : null;
  const 뜨거운것 = 평균댓글 === null ? [] : 우리축.filter((d) => (d.댓글 || 0) > 평균댓글);
  const 수있는것 = 우리축.filter((d) => d.수.length > 0);
  console.log(`⭐ 우리 세 축에 걸린 것 — ${우리축.length}건 / 받은 ${담은것.length}건`);
  if (평균댓글 === null) {
    console.log('⬜ 댓글 수를 주는 우물이 없었다 — 뜨거움을 «못 쟀다». 0 으로 채우지 않는다.');
  } else {
    console.log(`⭐ 그중 댓글이 평균(${평균댓글}개)보다 많은 것 — ${뜨거운것.length}건. 이것이 지면 후보의 첫 줄이다.`);
  }
  console.log(`⬜ 제목에 «수»가 든 것 — ${수있는것.length}건 (한국 기사용 자라 커뮤니티엔 잘 안 걸린다)`);

  if (적나) {
    const 방 = path.join(뿌리, 'archive', 'raw', 'community-desk');
    fs.mkdirSync(방, { recursive: true });
    const d = 잰때;
    const 날 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const 길 = path.join(방, `${날}.json`);
    fs.writeFileSync(길, JSON.stringify({
      잰때: 잰때.toLocaleString('ko-KR'),
      우물: 우물들.map((u) => ({ 곳: u.곳, 갈래: u.갈래, 주소: u.주소 })),
      못받은곳,
      담은것,
      담지않은것: '본문 · 댓글 내용 · 이미지 · 글쓴이 이름',
    }, null, 2), 'utf8');
    console.log(`\n📁 적었다 — archive/raw/community-desk/${날}.json (${담은것.length}건)`);
  } else {
    console.log('\n⬜ 안 적었다. 남기려면 --적는다 를 붙인다.');
  }
}

if (process.argv[1] && process.argv[1].endsWith('collect-community-desk.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
