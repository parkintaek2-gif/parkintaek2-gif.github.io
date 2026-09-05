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
  /* ⭐ [2026-09-03 실측] 열쇠 없이 되는 것 가운데 «가장 센 것»이다 —
     구글 트렌드는 지금 한국이 무엇을 검색하는지를 «검색량과 함께» 준다.
     커뮤니티 댓글 수는 그 방 사람들의 수지만, 이것은 나라 전체의 수다. */
  { 곳: '구글트렌드 KR', 갈래: '검색', 꼴: 'trends',
    주소: 'https://trends.google.com/trending/rss?geo=KR', 바탕: '' },
  /* ⚠ collect-news-desk 는 «한국어 신문»을 본다. 우리 손님은 영어권이라
     영문 기사가 언제 나갔는지를 알아야 「12시간 안」을 잴 수 있다. 그래서 따로 둔다. */
  { 곳: '구글뉴스 kpop(영문)', 갈래: '뉴스', 꼴: 'gnews',
    주소: 'https://news.google.com/rss/search?q=kpop&hl=en-US&gl=US&ceid=US:en', 바탕: '' },
  { 곳: '구글뉴스 korean drama(영문)', 갈래: '뉴스', 꼴: 'gnews',
    주소: 'https://news.google.com/rss/search?q=%22korean+drama%22&hl=en-US&gl=US&ceid=US:en', 바탕: '' },
  { 곳: '구글뉴스 korea economy(영문)', 갈래: '뉴스', 꼴: 'gnews',
    주소: 'https://news.google.com/rss/search?q=%22korean+economy%22+OR+kospi&hl=en-US&gl=US&ceid=US:en', 바탕: '' },
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
    /* 🔴 [2026-09-04] 트렌드에서 «노무라 증권»·«유증 절차»가 안 걸렸다. 갈래 낱말이라 더한다 —
       ⛔ 「에코프로비엠」·「알테오젠」 같은 고유명사는 더하지 않는다. 매일 바뀌어 못 쫓는다.
       🔴 그리고 「공모」를 넣었다가 뺐다 — 「항«공모»함」이 6번으로 갔다.
         한국어는 낱말이 «글자 안에» 박힌다. 짧은 낱말을 목록에 넣으면 이런 일이 난다.
         ⚠ 목록에 새 낱말을 넣으면 «오늘 자료에 대 보고» 무엇이 걸리는지 눈으로 본다. */
    '증권', '상장', '시가총액',
    'stock', 'kospi', 'kosdaq', 'economy', 'exports', 'semiconductor', 'inflation', 'interest rate'],
  '3번': ['대학', '수능', '입시', '취업', '학교', '학원', '전공', '졸업', '연금', '출산',
    '육아', '결혼', '노후', '정년', '공무원', '학점', '등록금',
    'university', 'college', 'tuition', 'wage', 'birth rate', 'marriage', 'pension', 'employment'],
};

/**
 * 🔴 [2026-09-04 20:5x · 5번이 재서 고침] **구글트렌드 20건이 «전부» 갈래없음이었다.**
 *   ─────────────────────────────────────────────────────────────────────────
 *   저녁 배분을 만들다 알았다. 검색량 2000+ 인 것들이 이렇게 새고 있었다 —
 * ```
 *   들쥐            2000+   넷플릭스 韓 추적 스릴러          ← 5번 몫인데 안 갔다
 *   김혜수          2000+   배우 미담                      ← 5번 몫인데 안 갔다
 *   티빙            2000+   침해사고 1인당 300만원 보상       ← 5번 몫인데 안 갔다
 *   에코프로비엠     500+   유증절차 개시 8천900억          ← 6번 몫인데 안 갔다
 *   알테오젠         100+   노바티스와 4.4조원 계약          ← 6번 몫인데 안 갔다
 * ```
 *   까닭 — 트렌드의 «제목»은 검색어 한 낱말이다(「들쥐」·「김혜수」). 우리 낱말 목록에
 *   그 고유명사가 있을 수가 없다. **그런데 트렌드는 «까닭» 칸에 기사 제목을 달고 온다.**
 *   그 기사 제목에는 「넷플릭스」·「배우」·「유증」이 들어 있다.
 *
 *   ⛔ 낱말 목록에 「들쥐」·「김혜수」를 손으로 더하는 것은 오늘도 내일도 새는 방식이다.
 *     고유명사는 매일 바뀐다. 목록으로 쫓아갈 수 없다.
 *   ✅ 그래서 **가를 때 「까닭」도 함께 본다.** 제목이 한 낱말이어도 까닭에 축이 드러난다.
 *   ⚠ 까닭을 먼저 보지 않는다 — 제목이 이기게 둔다. 까닭은 «거드는 것»이다.
 *     그러지 않으면 기사 제목에 우연히 든 낱말이 검색어의 갈래를 덮는다.
 */
export function 유닛가르기(제목, 까닭 = '') {
  /**
   * 🔴 [2026-09-04 21:0x] **처음엔 제목과 까닭을 «한 덩이»로 합쳐 놓고**
   *   주석에는 「제목이 이긴다」고 적었다. **자가시험이 그 어긋남을 잡았다** —
   *   까닭에 금융 낱말이 여섯 개 들면, 제목의 K컬처 낱말 셋을 이겨 버린다.
   *   ⛔ 주석이 말하는 것과 코드가 하는 것이 다르면, 코드가 이긴다. 그래서 코드를 고쳤다.
   *   ✅ **제목으로 먼저 가른다. 제목에 «하나도» 안 걸릴 때만 까닭을 본다.**
   *     트렌드의 검색어는 고유명사 한 낱말이라 어차피 제목으로는 안 걸린다 —
   *     그때만 까닭이 일한다. 그것이 원래 노린 것이다.
   */
  const 재기 = (글) => {
    const t = String(글 ?? '').toLowerCase();
    const 걸린 = [];
    for (const [유닛, 말들] of Object.entries(유닛낱말)) {
      const 맞은 = 말들.filter((w) => t.includes(w.toLowerCase()));
      if (맞은.length) 걸린.push({ 유닛, 맞은 });
    }
    if (!걸린.length) return null;
    걸린.sort((a, b) => b.맞은.length - a.맞은.length);
    return { 유닛: 걸린[0].유닛, 맞은: 걸린[0].맞은 };
  };
  const 제목으로 = 재기(제목);
  if (제목으로) return 제목으로;
  const 까닭으로 = 재기(까닭);
  /* ⚠ 까닭으로 가른 것은 «그렇게 가른 까닭»을 남긴다 — 나중에 왜 이 유닛인지 알아야 한다 */
  if (까닭으로) return { ...까닭으로, 까닭으로가름: true };
  return { 유닛: '갈래없음', 맞은: [] };
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

/**
 * 구글 트렌드 RSS — 지금 한국이 검색하는 것. **검색량이 함께 온다.**
 * ⭐ 이것이 이 자에서 유일하게 «나라 전체»를 재는 칸이다.
 *    커뮤니티 댓글 수는 그 방 사람들의 수이고, 이것은 검색한 사람의 수다.
 * ⚠ 「1000+」처럼 «어림»으로 온다. 그대로 적고 우리가 정확한 수인 척하지 않는다.
 */
export function trends읽기(xml) {
  const 나온다 = [];
  for (const m of String(xml ?? '').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const 덩이 = m[1];
    const 제목 = 엔티티풀기((덩이.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    if (!제목) continue;
    const 검색량 = 엔티티풀기((덩이.match(/<ht:approx_traffic>([^<]*)</) || [])[1] || '');
    const 언제 = 엔티티풀기((덩이.match(/<pubDate>([^<]*)</) || [])[1] || '');
    /* 그 낱말로 뜬 «기사» 제목도 같이 온다 — 무엇 때문에 떴는지가 여기 있다 */
    const 까닭 = 엔티티풀기((덩이.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/) || [])[1] || '');
    나온다.push({ 제목, 길: 'https://trends.google.com/trending?geo=KR', 댓글: 0, 언제,
      방: 검색량 ? '검색 ' + 검색량 : '', 검색량, 까닭 });
  }
  return 나온다;
}

/** 구글 뉴스 RSS — 보통 RSS 다. 제목 끝에 「 - 매체이름」이 붙는다 */
export function gnews읽기(xml) {
  const 나온다 = [];
  for (const m of String(xml ?? '').matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const 덩이 = m[1];
    const 통제목 = 엔티티풀기((덩이.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    if (!통제목) continue;
    /* 「제목 - 매체」에서 매체를 갈라 낸다. 어느 매체가 언제 냈는지가 «12시간 창»의 시작점이다 */
    const 쪼갠 = 통제목.split(' - ');
    const 매체 = 쪼갠.length > 1 ? 쪼갠[쪼갠.length - 1] : '';
    const 제목 = 쪼갠.length > 1 ? 쪼갠.slice(0, -1).join(' - ') : 통제목;
    const 언제 = 엔티티풀기((덩이.match(/<pubDate>([^<]*)</) || [])[1] || '');
    const 길 = 엔티티풀기((덩이.match(/<link>([^<]*)</) || [])[1] || '');
    나온다.push({ 제목, 길, 댓글: 0, 언제, 방: 매체 });
  }
  return 나온다;
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

/**
 * 우물마다 «몰아치지 않는 사이»가 다르다 — 짐작이 아니라 겪은 대로 적는다.
 * 🔴 2026-09-03: 에펨코리아가 처음엔 200 이었는데 짧은 사이에 여러 번 받자 **430** 을 냈다.
 *    커뮤니티는 우리 같은 자를 반기지 않는다. 사이를 넓히는 것이 예의이자 우리가 계속 받는 길이다.
 * 🔴 같은 날: Reddit 은 IP 로 조여서 7초로도 넷 중 셋이 429 였다. 20초로 늘렸다.
 * ⚠ 구글 쪽(트렌드·뉴스)은 공개 RSS 라 조인 적이 없다. 그래도 2초는 둔다.
 */
/**
 * 🔴 [2026-09-03 19:2x] **하루 두 번 도는데 두 번째가 첫 번째를 «덮고» 있었다.**
 *
 *   이 자는 하루 두 번(8시·20시) 돈다. 그런데 낼 때 `<날>.json` 을 그냥 `writeFileSync` 했다.
 *   ⛔ 그러면 저녁 실행이 아침에 받은 것을 **통째로 지운다.**
 *      커뮤니티 제목은 몇 시간이면 목록에서 밀려 내려간다 — **아침 것은 되찾을 수 없다.**
 *      오늘 12:41 에 445건을 받아 두었고, 20:12 실행이 그것을 지울 참이었다.
 *
 *   ⚠ 이것을 내가 오늘 «만들었다». 아카이빙은 우리가 🔴 로 못박은 유일한 소급 불가 항목인데,
 *      그 항목을 받는 자를 지으면서 «덮어쓰기»로 지었다.
 *
 * ✅ 그래서 같은 날 파일이 있으면 **합친다.** 열쇠는 주소(`길`)다.
 * ⭐ 그리고 항목마다 «처음 본 때»를 남긴다 — 나중에 덮여도 그 값은 안 바뀐다.
 */
/**
 * 🔴 [2026-09-05 · 5번] **6시간 창을 «못 재는» 상태였다.**
 *
 *   사장님이 오늘 이슈 반응 기한을 12시간 → **6시간**으로 줄이셨다. 그런데 재 보니
 *   오늘 담은 536건 가운데 **130건(24%)은 난 때를 아예 못 읽는다**(인벤 67 · 루리웹 63).
 *   그리고 우리가 «처음 본 때»조차 `2026. 9. 5. 오전 8:14:34` 라는 **우리말 꼴**로 적혀
 *   있어 `new Date()` 가 못 읽는다. ⇒ 그 24%는 창이 열렸는지 판정 자체가 안 된다.
 *
 * ⛔ 「난 때가 없으니 창 밖」으로 치면 «못 잰 것»을 «아닌 것»으로 바꾸는 것이다.
 *   그것은 강령 「못 잰 것은 못 쟀다고 적는다」에 정면으로 걸린다.
 * ✅ 그래서 우리가 «처음 본 때»를 기계가 읽는 꼴로 함께 남긴다. 난 때가 없어도
 *   「우리가 이 글을 처음 본 뒤 몇 시간이 지났나」는 잴 수 있다 — 창의 «바닥값»이 생긴다.
 * ⚠ 사람이 읽는 `처음본때` 는 그대로 둔다. 옛 파일이 깨지지 않아야 한다.
 */
export function 기계때(우리말때) {
  const s = String(우리말때 ?? '');
  const m = s.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  let 시 = Number(m[5]);
  if (m[4] === '오후' && 시 !== 12) 시 += 12;
  if (m[4] === '오전' && 시 === 12) 시 = 0;
  /* 이 기계는 KST 다. 그대로 만들면 KST 로 선다 */
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 시, Number(m[6]), Number(m[7]));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function 합치기(옛것, 새것, 이번때) {
  /*
   * 🔴 [주소만으로는 안 된다 — 진짜 자료로 재서 알았다]
   *   자가시험은 다 통과했는데 오늘 받은 445건을 넣어 보니 **439건으로 줄었다.**
   *   까닭: 구글 트렌드 열 건이 **주소가 하나뿐**이다
   *   (`trends.google.com/trending?geo=KR` — 낱말별 주소를 안 준다).
   *   ⛔ 주소로만 가르면 검색어 열 개가 «한 개»로 뭉개진다. 아홉을 잃는다.
   * ✅ 그래서 주소 «와» 제목을 함께 열쇠로 쓴다.
   * ⭐ 자가시험이 초록인데 진짜 자료에서 깨졌다 — **진짜 자료로 재기 전에는 됐다고 하지 않는다.**
   */
  const 열쇠 = (x) => String(x?.길 ?? '') + '|' + String(x?.제목 ?? '')
    || (String(x?.곳 ?? '') + '|' + String(x?.제목 ?? ''));
  const 모음 = new Map();
  /* 옛것을 먼저 넣는다 — 처음 본 때를 지키려면 옛 값이 이겨야 한다 */
  for (const x of Array.isArray(옛것) ? 옛것 : []) 모음.set(열쇠(x), x);
  let 새로든것 = 0;
  for (const x of Array.isArray(새것) ? 새것 : []) {
    const k = 열쇠(x);
    const 옛 = 모음.get(k);
    if (옛) {
      /* 이미 본 것 — 처음 본 때는 «그대로 두고», 댓글수처럼 자라는 값만 새로 받는다 */
      /* ⚠ 옛 항목에는 «기계 꼴»이 없다(2026-09-05 이전 파일). 그럴 때 «지금»으로 채우면
         처음 본 때가 통째로 거짓이 된다 — 옛 항목의 우리말 때에서 되살린다. */
      모음.set(k, {
        ...옛, ...x, 처음본때: 옛.처음본때 ?? 이번때, 다시본때: 이번때,
        처음본때기계: 옛.처음본때기계 ?? 기계때(옛.처음본때) ?? 기계때(이번때),
        다시본때기계: 기계때(이번때),
      });
      continue;
    }
    모음.set(k, { ...x, 처음본때: 이번때, 처음본때기계: 기계때(이번때) });
    새로든것 += 1;
  }
  return { 담은것: [...모음.values()], 새로든것, 이어받은것: 모음.size - 새로든것 };
}

export function 잠깐길이(우물) {
  if (우물.갈래 === 'SNS') return 20000;
  if (우물.갈래 === '커뮤니티') return 8000;
  return 2000;
}

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
  if (꼴 === 'trends') return trends읽기;
  if (꼴 === 'gnews') return gnews읽기;
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
  /* 🔴 [2026-09-04] 구글트렌드 20건이 전부 갈래없음이던 결함 — 여기서 굳힌다 */
  본다('⭐ 트렌드: 검색어 한 낱말이어도 까닭으로 가른다 (들쥐 건)',
    유닛가르기('들쥐', "넷플릭스 또 일냈다…'1132만 흥행→시청률 18.8% 배우' 뭉친 韓 추적 스릴러").유닛 === '5번');
  본다('⭐ 트렌드: 종목도 까닭으로 가른다 (에코프로비엠 건)',
    유닛가르기('에코프로비엠', '에코프로비엠 유증절차 개시…1차 발행가액 기준 8천900억 · 증시').유닛 === '6번');
  본다('⛔ 까닭이 제목을 «덮지» 않는다 — 제목이 이긴다',
    유닛가르기('아이돌 컴백 무대', '코스피 증시 주식 환율 금리 경제').유닛 === '5번');
  본다('까닭이 없어도 예전처럼 돈다', 유닛가르기('코스피 환율').유닛 === '6번');
  본다('⛔ 둘 다 안 걸리면 갈래없음이다', 유닛가르기('체포', '2호선 밀착남 잠복 경찰이 체포').유닛 === '갈래없음');
  본다('⭐ 까닭으로 가른 것은 그 사실을 남긴다',
    유닛가르기('들쥐', '넷플릭스 韓 추적 스릴러').까닭으로가름 === true);
  본다('제목으로 가른 것에는 그 표가 «없다»',
    유닛가르기('아이돌 컴백').까닭으로가름 === undefined);
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

  const tr = '<item><title>손예진</title><ht:approx_traffic>5000+</ht:approx_traffic>'
    + '<pubDate>Wed, 03 Sep 2026 03:00:00 GMT</pubDate>'
    + '<ht:news_item_title>배우 손예진, 새 드라마 확정</ht:news_item_title></item>';
  const t = trends읽기(tr);
  본다('트렌드: 한 건을 읽는다', t.length === 1 && t[0].제목 === '손예진');
  본다('트렌드: 검색량을 그대로 적는다 — 정확한 수인 척하지 않는다', t[0] && t[0].검색량 === '5000+');
  본다('트렌드: 무엇 때문에 떴는지(기사 제목)도 담는다', t[0] && t[0].까닭.includes('손예진'));

  const gn = '<item><title>NewJeans announce comeback - Billboard</title>'
    + '<link>https://news.google.com/x</link><pubDate>Wed, 03 Sep 2026 01:00:00 GMT</pubDate></item>';
  const g = gnews읽기(gn);
  본다('구글뉴스: 제목에서 매체 이름을 갈라 낸다',
    g[0] && g[0].제목 === 'NewJeans announce comeback' && g[0].방 === 'Billboard');
  본다('구글뉴스: 낸 시각을 읽는다 — 12시간 창의 시작점이다',
    g[0] && g[0].언제.includes('03 Sep 2026'));
  본다('구글뉴스: 붙임표가 제목 안에 있어도 마지막 것만 매체로 본다', (() => {
    const x = gnews읽기('<item><title>K-pop and K-drama - what is next - Reuters</title><link>u</link></item>');
    return x[0].제목 === 'K-pop and K-drama - what is next' && x[0].방 === 'Reuters';
  })());
  /* 🔴 실측으로 정한 것 — 여기에 못 박아 둔다 */
  본다('X·Threads 는 우물에 없다 — 열쇠 없이 안 된다(실측 401·400)',
    !우물들.some((u) => /twitter|threads|nitter/i.test(u.주소)));
  본다('구글 트렌드가 우물에 있다 — 열쇠 없이 나라 전체를 재는 유일한 칸',
    우물들.some((u) => u.꼴 === 'trends'));

  본다('수뽑기를 뉴스 수집기에서 가져다 쓴다', 수뽑기('조회수 1,234명 돌파').쓸만한가 === true);
  본다('꼴에 맞는 읽개를 고른다',
    읽기고르기('fmkorea') === fmkorea읽기 && 읽기고르기('rss') === atom읽기);
  본다('우물이 열한 곳이다', 우물들.length === 11);
  본다('디시인사이드는 없다 — robots 가 우리를 이름으로 막았다',
    !우물들.some((u) => u.곳.includes('디시')));
  /**
   * 🔴 [2026-09-04 17:4x · 5번이 재서 잠금] **막힌 우물을 이름으로 잠근다.**
   *
   * 2번이 「커뮤니티 실시간 응답」 재료를 재 보고(446건 중 유닛 축에 걸린 것 **1건**)
   * 우물을 유닛 축에 맞게 늘리자고 제안했다. 그래서 후보 넷의 `robots.txt` 를 **직접 받아 봤다.**
   *
   * ```
   * orbi.kr           User-agent: ClaudeBot            Disallow: /     ⛔
   * gall.dcinside.com ClaudeBot · anthropic-ai · Claude-Web  Disallow: /  ⛔ (9/3 에 이미 뺐다)
   * pann.nate.com     User-agent: *                    Disallow: /     ⛔ (검색봇 흰명단만)
   * www.clien.net     robots.txt 자체가 HTTP 403                        ⛔
   * theqoo.net        robots.txt 없음(404) · 이용약관 있음              ⬜ 아직 못 봤다
   * ```
   *
   * ⚠ **덫이 하나 있다.** orbi 와 dcinside 는 `User-agent: *` 에는 `Allow: /` 를 준다.
   *   그러니 이름 없는 수집기로 가면 «규칙상» 통한다.
   * ⛔ **그렇게 하지 않는다.** 그 사이트들은 ClaudeBot·anthropic-ai·Claude-Web 을
   *   **이름으로 적어** 막았다. 우리가 무엇인지 알고 막은 것이다. 이름을 감추고 들어가는 것은
   *   차단 회피이고, 우리는 데이터를 파는 회사다 — 그 한 번이 사업을 끝낼 수 있다.
   * ⛔ **규칙을 못 읽는 곳(clien 403)도 안 쓴다.** 「규칙이 없다」와 「규칙을 못 봤다」는 다르다.
   * ⬜ theqoo 는 robots 가 없을 뿐 «허락»은 아니다. 이용약관을 읽기 전에는 안 붙인다.
   */
  const 막힌곳 = ['오르비', 'orbi', '디시', 'dcinside', '네이트판', 'nate', '클리앙', 'clien'];
  본다('⭐ 우리를 막은 우물이 하나도 안 들어와 있다',
    !우물들.some((u) => 막힌곳.some((x) => `${u.곳}${u.주소}`.toLowerCase().includes(x.toLowerCase()))));
  본다('⬜ theqoo 는 이용약관을 읽기 전에는 안 붙인다',
    !우물들.some((u) => /theqoo|더쿠/i.test(`${u.곳}${u.주소}`)));
  /* 🔴 [2026-09-03] 하루 두 번 도는데 두 번째가 첫 번째를 덮고 있었다. 이 넷이 막는다 */
  본다('⭐ 합치면 아침 것을 안 잃는다', (() => {
    const r = 합치기([{ 길: 'a', 제목: '아침' }], [{ 길: 'b', 제목: '저녁' }], '저녁때');
    return r.담은것.length === 2 && r.새로든것 === 1 && r.이어받은것 === 1;
  })());
  본다('같은 주소는 두 번 안 센다', (() => {
    const r = 합치기([{ 길: 'a', 제목: '아침' }], [{ 길: 'a', 제목: '아침' }], '저녁때');
    return r.담은것.length === 1 && r.새로든것 === 0;
  })());
  /* 🔴 [2026-09-05] 6시간 창을 못 재던 자리 — 우리말 때는 new Date() 가 못 읽는다 */
  본다('우리말 때를 기계 꼴로 바꾼다',
    !Number.isNaN(new Date(기계때('2026. 9. 5. 오전 8:14:34')).getTime()));
  본다('오후 2시를 14시로 읽는다',
    new Date(기계때('2026. 9. 5. 오후 2:30:00')).getHours() === 14);
  본다('오전 12시는 0시 · 오후 12시는 12시',
    new Date(기계때('2026. 9. 5. 오전 12:05:00')).getHours() === 0
      && new Date(기계때('2026. 9. 5. 오후 12:05:00')).getHours() === 12);
  본다('⛔ 못 읽으면 null 이다 — 0 이나 «지금»으로 채우지 않는다',
    기계때('아무 글자') === null && 기계때(null) === null);
  본다('⭐ 옛 항목에 기계 꼴이 없으면 «옛 우리말 때»에서 되살린다 — 지금으로 덮지 않는다', (() => {
    const r = 합치기([{ 길: 'a', 처음본때: '2026. 9. 5. 오전 8:14:34' }], [{ 길: 'a' }],
      '2026. 9. 5. 오후 8:00:00');
    return new Date(r.담은것[0].처음본때기계).getHours() === 8;
  })());
  본다('⭐ 다시 본 것의 «처음 본 때»는 안 바뀐다', (() => {
    const r = 합치기([{ 길: 'a', 처음본때: '아침때' }], [{ 길: 'a' }], '저녁때');
    return r.담은것[0].처음본때 === '아침때' && r.담은것[0].다시본때 === '저녁때';
  })());
  본다('옛것이 없으면(첫 실행) 그대로 다 넣는다', (() => {
    const r = 합치기(null, [{ 길: 'a' }, { 길: 'b' }], '지금');
    return r.담은것.length === 2 && r.새로든것 === 2 && r.담은것[0].처음본때 === '지금';
  })());
  /* 🔴 진짜 자료에서 깨진 그 꼴 — 주소가 같고 제목이 다른 열 건(구글 트렌드) */
  본다('⭐ 주소가 같고 제목이 다르면 «따로» 센다 (구글 트렌드가 그 꼴이다)', (() => {
    const 같은주소 = 'https://trends.google.com/trending?geo=KR';
    const r = 합치기(null, [{ 길: 같은주소, 제목: '가' }, { 길: 같은주소, 제목: '나' },
      { 길: 같은주소, 제목: '다' }], '지금');
    return r.담은것.length === 3;
  })());
  본다('주소도 제목도 같으면 한 번만 센다', (() => {
    const r = 합치기([{ 길: 'a', 제목: '같다' }], [{ 길: 'a', 제목: '같다' }], '지금');
    return r.담은것.length === 1;
  })());

  본다('주소가 없으면 곳+제목으로 가른다', (() => {
    const r = 합치기([{ 곳: '인벤', 제목: '가' }], [{ 곳: '인벤', 제목: '나' }], '지금');
    return r.담은것.length === 2;
  })());

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
      await 잠깐(잠깐길이(u));
      continue;
    }
    const 글들 = 읽기고르기(u.꼴)(r.글, u.바탕);
    for (const g of 글들) {
      /* ⭐ 까닭(트렌드는 기사 제목이 붙어 온다)도 함께 본다 — 위 주석을 읽는다 */
      const 갈림 = 유닛가르기(g.제목, g.까닭);
      담은것.push({ ...g, 곳: u.곳, 갈래: u.갈래, 유닛: 갈림.유닛, 맞은낱말: 갈림.맞은,
        수: 수뽑기(g.제목).수 });
    }
    console.log(`  ${글들.length ? '✅' : '⬜'} ${u.곳} — ${글들.length}건`);
    await 잠깐(잠깐길이(u));
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
  /* ⛔ 댓글을 «주지 않는» 우물(구글 트렌드·뉴스·레딧 RSS)을 평균에 섞으면 안 된다.
     섞으면 평균이 0 쪽으로 끌려가고, 그러면 「평균보다 뜨겁다」가 아무 뜻이 없어진다.
     🔴 2026-09-03 에 실제로 그렇게 냈다 — 우물을 넷 늘리자 「뜨거운 것」이 4건에서 2건으로
        «줄었다». 커뮤니티가 식은 것이 아니라 내 자가 망가진 것이었다.
     ✅ 그래서 «댓글을 주는 우물»만으로 평균을 낸다. 갈래가 다른 것은 갈래 안에서 견준다. */
  const 댓글주는우물 = new Set(우물들.filter((u) => u.갈래 === '커뮤니티').map((u) => u.곳));
  const 댓글값 = 담은것.filter((d) => 댓글주는우물.has(d.곳)).map((d) => d.댓글 || 0).filter((n) => n > 0);
  const 평균댓글 = 댓글값.length ? Math.round(댓글값.reduce((a, b) => a + b, 0) / 댓글값.length) : null;
  const 뜨거운것 = 평균댓글 === null ? []
    : 우리축.filter((d) => 댓글주는우물.has(d.곳) && (d.댓글 || 0) > 평균댓글);
  const 수있는것 = 우리축.filter((d) => d.수.length > 0);
  console.log(`⭐ 우리 세 축에 걸린 것 — ${우리축.length}건 / 받은 ${담은것.length}건`);
  if (평균댓글 === null) {
    console.log('⬜ 댓글 수를 주는 우물이 없었다 — 뜨거움을 «못 쟀다». 0 으로 채우지 않는다.');
  } else {
    console.log(`⭐ 커뮤니티에서 댓글이 평균(${평균댓글}개)보다 많은 것 — ${뜨거운것.length}건. 이것이 지면 후보의 첫 줄이다.`);
    const 검색 = 담은것.filter((d) => d.검색량);
    if (검색.length) console.log(`⭐ 지금 한국이 검색하는 것 — ${검색.length}건 (나라 전체를 재는 유일한 칸)`);
  }
  console.log(`⬜ 제목에 «수»가 든 것 — ${수있는것.length}건 (한국 기사용 자라 커뮤니티엔 잘 안 걸린다)`);

  if (적나) {
    const 방 = path.join(뿌리, 'archive', 'raw', 'community-desk');
    fs.mkdirSync(방, { recursive: true });
    const d = 잰때;
    const 날 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const 길 = path.join(방, `${날}.json`);

    /* 🔴 같은 날 파일이 있으면 «덮지 않고 합친다» — 위 합치기() 머리글에 까닭을 적었다 */
    let 옛파일 = null;
    try { 옛파일 = JSON.parse(fs.readFileSync(길, 'utf8')); } catch { 옛파일 = null; }
    const 이번때 = 잰때.toLocaleString('ko-KR');
    const 합친것 = 합치기(옛파일?.담은것, 담은것, 이번때);

    /* 돈 때를 «목록»으로 쌓는다. 몇 번 돌았는지가 아카이빙 증거다 */
    const 돈때들 = [...(옛파일?.돈때들 ?? (옛파일?.잰때 ? [옛파일.잰때] : [])), 이번때];

    fs.writeFileSync(길, JSON.stringify({
      잰때: 이번때,                 /* 마지막으로 돈 때 */
      돈때들,                       /* ⭐ 오늘 몇 번 돌았나 — 8시·20시 둘 다 돌았는지 이걸로 본다 */
      우물: 우물들.map((u) => ({ 곳: u.곳, 갈래: u.갈래, 주소: u.주소 })),
      못받은곳,
      담은것: 합친것.담은것,
      담지않은것: '본문 · 댓글 내용 · 이미지 · 글쓴이 이름',
    }, null, 2), 'utf8');

    if (옛파일) {
      console.log(`\n📁 «합쳐» 적었다 — archive/raw/community-desk/${날}.json`);
      console.log(`   이어받은 것 ${합친것.이어받은것}건 + 새로 든 것 ${합친것.새로든것}건 = ${합친것.담은것.length}건`);
      console.log(`   ⭐ 오늘 ${돈때들.length}번 돌았다. ⛔ 아침에 받은 것을 덮지 않았다.`);
    } else {
      console.log(`\n📁 적었다 — archive/raw/community-desk/${날}.json (${합친것.담은것.length}건)`);
    }
  } else {
    console.log('\n⬜ 안 적었다. 남기려면 --적는다 를 붙인다.');
  }
}

if (process.argv[1] && process.argv[1].endsWith('collect-community-desk.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
