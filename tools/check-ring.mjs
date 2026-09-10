#!/usr/bin/env node
/**
 * check-ring.mjs — **유닛끼리 돌아가며 서로 점검한다. 1시간에 한 번. «눈으로», 일일이.**
 *
 * 🔴🔴 사장님 지시 (2026-09-10 23시경, 원문)
 * ─────────────────────────────────────────────────────────────────────────────
 * > 「[klifemap.ai/content 화면 사진] 를 읽고, 메뉴를 하나씩 눌러보니 다 스크린샷처럼
 * >  콘텐츠가 없다는 오류메시지가 뜬다. 매우 심각한 오류인데, **왜 비상라이트가 안켜줬지?**
 * >  수정 지시하고 비상라이트 작동 점검해」
 *
 * > 「**내가 이걸 체크안했으면 그냥 방치되는거 아니었나? 최소한 1시간에 한번씩은 각 유닛이
 * >  멀쩡한 지 순환하며 체크하게 해라**(케이라이프맵이 백년지도 체크 > 백년지도가 케이컬쳐와이어
 * >  체크 > 케이컬쳐와이어가 서울마켓츠 체크 > 서울마켓츠가 케이라이프맵 체크)」
 *
 * > 「**다 눈으로 직접 재라고 해야 함. 일일이**」
 *
 * ── ⭐ 왜 «서로» 점검인가 ────────────────────────────────────────────────────
 * 자기 것을 자기가 점검하면 두 가지가 조용히 빠진다.
 *   ① 그 유닛이 쉬거나 세션이 죽으면 «점검도 함께 죽는다» — 아무도 그 사실을 모른다
 *   ② 만든 사람은 자기가 예상한 자리만 본다. 남의 사이트에 서면 「손님 화면이 비었나」처럼
 *      만든 사람이 잘 안 보는 것부터 눈에 들어온다
 * ⭐ 회사 강령의 「리스크관리AI가 ①②와 독립이어야 통제다」와 같은 구조다 —
 *   **같은 것이 사고 같은 것이 「괜찮다」고 하면 통제가 아니다.**
 *
 * ── ⛔ 이 자가 «하지 않는» 것 ───────────────────────────────────────────────
 * ```
 * ⛔ 주소에 200 이 오는지 세지 않는다 — 오늘 사고가 바로 그 자리였다.
 *   서버는 200 을 내고 있었고 자동 검사는 초록이었는데 화면에는 「없습니다」가 떠 있었다
 * ⛔ 표본 몇 개로 전량을 가리키지 않는다 — 사장님 말씀이 「일일이」다.
 *   메뉴·갈래·나라말 단추를 «하나씩» 누른다
 * ⛔ 못 잰 것을 0 으로 채우지 않는다 — 못 띄웠으면 「못 쟀다」로 적는다
 * ```
 *
 * 쓰는 법
 *   node tools/check-ring.mjs --자가시험
 *   node tools/check-ring.mjs --내가 5번          # 내가 볼 «다음 유닛»을 점검한다
 *   node tools/check-ring.mjs --전부              # 고리 넷을 다 돈다 (총괄이 쓴다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 🔴 고리 — 사장님이 직접 정하신 순서다. ⛔ 바꾸지 않는다.
 *   KLifeMap → 백년지도 → K Culture Wire → SeoulMarkets → KLifeMap
 */
export const 고리 = [
  { 보는이: '1번', 보는곳: 'KLifeMap', 주인: '1번' },       /* 자리 표시용 — 실제 대상은 아래 다음 */
];

/** 사이트마다 «눈으로 볼 자리»를 적는다. ⚠ 첫 화면만 보지 않는다 — 목록·글·판정까지 본다 */
export const 사이트들 = [
  {
    키: 'klifemap', 이름: 'KLifeMap', 주인: '1번', 밑: 'https://klifemap.ai',
    볼곳: [
      { 이름: '첫 화면', 길: '/', 있어야: ['KLifeMap'] },
      { 이름: '콘텐츠 목록', 길: '/content', 카드고르기: '.post-card', 적어도: 3, 메뉴고르기: '.filter-bar a' },
      { 이름: '글 지면', 길: '/content/ilju-im-in', 본문고르기: 'article', 적어도글자: 300 },
      { 이름: '사주 화면', 길: '/saju.html', 있어야: ['사주'] },
    ],
  },
  {
    키: '100yearmap', 이름: '백년지도', 주인: '3번', 밑: 'https://100yearmap.com',
    볼곳: [
      { 이름: '첫 화면', 길: '/', 메뉴고르기: 'nav a, header a' },
      { 이름: '나이 축', 길: '/age' },
    ],
  },
  {
    키: 'kculturewire', 이름: 'K Culture Wire', 주인: '5번', 밑: 'https://www.kculturewire.com',
    견줄것들: ['Stars', 'Titles', 'Industry', 'Tradition'],
    볼곳: [
      { 이름: '첫 화면', 길: '/', 메뉴고르기: 'nav a, header a' },
      { 이름: '기사 목록', 길: '/articles' },
    ],
  },
  {
    /* 🔴 [2026-09-10 23:0x] 여기 「/articles」로 적어 두었다가 404 를 「6번이 깨뜨렸다」로 낼 뻔했다.
     * 서울마켓츠에는 /articles 가 «없다» — 목록이 다섯 갈래(/equities·/fx·/rates·/commodities·/macro)다.
     * ⛔ 주소를 짐작해 넣고 404 를 남의 흠으로 적지 않는다. 첫 화면의 메뉴를 «눌러» 찾는다.
     *   (오늘 증권사 아카이브에서 같은 잘못을 한 번 더 했다 — 폴더를 짐작으로 읽고 6번을 잡았다) */
    키: 'seoulmarkets', 이름: 'SeoulMarkets', 주인: '6번', 밑: 'https://seoulmarkets.com',
    /* ⭐ «견줄 것» — 같은 결의 기사 목록 다섯 갈래만 서로 견준다.
     * ⛔ 첫 화면·ABOUT·API·DATA·VIDEO 를 같이 세지 않는다 — 결이 달라 「얇다」가 뜻을 잃는다.
     *   (2026-09-10 23:4x 에 그렇게 재서 일곱을 집었다. 그 가운데 셋은 잘못이었다) */
    견줄것들: ['EQUITIES', 'FX', 'RATES', 'COMMODITIES', 'FUNDS', 'MACRO'],
    볼곳: [
      { 이름: '첫 화면', 길: '/', 메뉴고르기: 'nav a, header a' },
      { 이름: '증시 목록', 길: '/equities' },
    ],
  },
];

/**
 * ⭐ 같은 사이트 안에서 «갈래끼리 두께»가 크게 갈렸나 — [2026-09-10 23:3x · 5번]
 *
 * 왜 재나 — 오늘 서울마켓츠를 눈으로 보고 알았다. 열세 자리 전부 200·전부 초록인데
 * 보이는 글자가 EQUITIES 24,333자 대 FUNDS 2,431자였다. 기사는 61개 대 3개다.
 * ⇒ 손님이 증시로 들어와 FX 를 누르면 «빈 방»을 본다. 방문은 늘어도 체류가 안 는다.
 *
 * ⛔ 빨간불로 내지 않는다 — 깨진 것이 아니라 «사람이 봐야 하는 수»다.
 *   빨간불을 남발하면 진짜 빨간불이 안 보인다(오늘 거짓경보 27건으로 겪었다).
 * ⛔ 자리가 셋 미만이면 재지 않는다(null) — 둘을 비교해 「갈렸다」고 하는 것은 셈이 아니다.
 * ⛔ 못 잰 자리(보이는 글자 null)는 «세지 않는다». 0 으로 채우면 늘 「갈렸다」가 된다.
 */
export const 얇음배수 = 4;   /* 가운뎃값의 1/4 미만이면 «얇다»로 본다 */

/** 이름에서 화살표 표시를 떼고 견줄것들과 맞대 본다 — 「  ↳ FX」 는 「FX」다 */
export function 이름벗기기(이름) {
  return String(이름 ?? "").replace(/^[\s↳·]+/, "").trim();
}

export function 두께갈림(잰것들, { 배수 = 얇음배수, 견줄것들 = null } = {}) {
  if (!Array.isArray(잰것들)) return null;
  /* 🔴 «견줄 것»을 안 적어 두면 재지 않는다 — 결이 다른 지면을 짐작으로 견주지 않는다.
     첫 화면은 원래 가장 두껍고 ABOUT 은 짧은 것이 맞다. 그것을 같이 세면 「얇다」가 뜻을 잃는다. */
  if (!Array.isArray(견줄것들) || 견줄것들.length < 3) return null;
  const 볼이름 = new Set(견줄것들.map((n) => 이름벗기기(n)));
  const 수들 = 잰것들
    .filter((x) => x && x.상태 !== '못쟀다' && Number.isFinite(x.보이는글자))
    .map((x) => ({ 이름: 이름벗기기(x.이름 || x.길), 글자: x.보이는글자 }))
    .filter((x) => 볼이름.has(x.이름));
  if (수들.length < 3) return null;
  const 정렬 = [...수들].sort((a, b) => a.글자 - b.글자);
  const 가장두꺼운 = 정렬[정렬.length - 1];
  if (!가장두꺼운.글자) return null;            /* 다 0 이면 잴 수 없다 — 못 쟀다로 둔다 */
  /* 🔴 [23:4x 고침] 처음에 «가운뎃값» 기준으로 짰다가 내 자가시험이 막았다.
     서울마켓츠 실측 [24333,17073,3423,3648,3770,2431] 의 가운뎃값은 3,709자다 —
     **얇은 쪽이 다수여서 가운뎃값이 얇은 쪽에 있다.** 그러면 그 얇음이 «정상»이 된다.
     ⇒ 회사 강령의 「평균이 아니라 분포」와 같은 병이다. 평균이 규범이 되면 안 된다.
     ✅ 손님은 «가장 두꺼운 곳»으로 들어와 다른 칸을 누른다. 그러니 기준은 가장 두꺼운 곳이다. */
  const 선 = 가장두꺼운.글자 / 배수;
  const 얇은것 = 수들.filter((x) => x.글자 < 선);
  /* 가운뎃값도 함께 준다 — 보는 사람이 분포를 알 수 있게 한다(규범으로 쓰지는 않는다) */
  const 가운데 = 정렬.length % 2
    ? 정렬[(정렬.length - 1) / 2].글자
    : Math.round((정렬[정렬.length / 2 - 1].글자 + 정렬[정렬.length / 2].글자) / 2);
  return { 가운데, 선: Math.round(선), 얇은것, 가장두꺼운, 가장얇은: 정렬[0] };
}

/** 🔴 누가 누구를 보나 — 고리 순서. ⛔ 자기 사이트를 자기가 보지 않는다 */
/**
 * 번호를 「N번」 꼴로 고른다 — `5` 와 `5번` 을 같게 받는다.
 * 🔴 2026-09-11 01:5x 에 내가 `--내가 5` 로 두 번 쳤고 두 번 다 「번호가 아니다」로 튕겼다.
 *   그 말은 «5번이 고리에 없다»는 뜻으로 읽힌다 — 1시간마다 도는 검사에서 그렇게 읽히면
 *   그 자리 세션이 「내 몫이 아니구나」로 넘긴다. ⛔ 사람이 꼴을 외워 지키게 두지 않는다.
 */
export function 번호고르기(값) {
  const s = String(값 ?? '').trim();
  if (!s) return '';
  return /^[0-9]+$/.test(s) ? s + '번' : s;
}

export function 볼곳정하기(내번호, 것들 = 사이트들) {
  const 순서 = ['klifemap', '100yearmap', 'kculturewire', 'seoulmarkets'];
  const 내자리 = 순서.findIndex((k) => 것들.find((s) => s.키 === k)?.주인 === 번호고르기(내번호));
  if (내자리 < 0) return null;                       /* 지킬 사이트가 없는 자리 — 못 쟀다가 아니라 «해당 없음» */
  const 다음키 = 순서[(내자리 + 1) % 순서.length];
  return 것들.find((s) => s.키 === 다음키) || null;
}

/** 한 자리를 «눈으로» 잰다 — 화면을 띄우고, 무엇이 보이나를 센다 */
export async function 한자리재기(page, 밑, 볼곳) {
  let http = null;
  try {
    const r = await page.goto(밑 + 볼곳.길, { waitUntil: 'networkidle2', timeout: 45000 });
    http = r ? r.status() : null;
  } catch (e) {
    return { ...볼곳, 상태: '못쟀다', 까닭: '화면을 못 띄웠다 — ' + e.message, http: null };
  }
  await new Promise((s) => setTimeout(s, 600));
  const 잰것 = await page.evaluate((고르기) => {
    const 글 = document.body ? document.body.innerText : '';
    const 카드 = 고르기.카드 ? document.querySelectorAll(고르기.카드).length : null;
    const 본문 = 고르기.본문 ? (document.querySelector(고르기.본문) || { innerText: '' }).innerText.length : null;
    const 메뉴 = 고르기.메뉴 ? [...document.querySelectorAll(고르기.메뉴)].map((a) => ({ 글: a.innerText.trim(), 길: a.getAttribute('href') })) : [];
    return { 보이는글자: 글.replace(/\s+/g, ' ').trim().length, 첫글: 글.replace(/\s+/g, ' ').trim().slice(0, 120), 카드, 본문, 메뉴 };
  }, { 카드: 볼곳.카드고르기 || null, 본문: 볼곳.본문고르기 || null, 메뉴: 볼곳.메뉴고르기 || null });

  const 빈안내 = /아직 발행된 콘텐츠가 없습니다|No English articles yet|No articles yet|콘텐츠가 없습니다|Nothing here yet/.test(잰것.첫글)
    || /아직 발행된 콘텐츠가 없습니다/.test(잰것.첫글);
  const 흠 = [];
  if (http !== 200) 흠.push('HTTP ' + http);
  if (빈안내) 흠.push('🔴 지면이 «비었다»고 말한다');
  if (잰것.보이는글자 < 200) 흠.push('보이는 글자가 ' + 잰것.보이는글자 + '자다 — 빈 화면이다');
  if (볼곳.적어도 != null && (잰것.카드 == null || 잰것.카드 < 볼곳.적어도)) 흠.push(`카드가 ${잰것.카드}장이다 (적어도 ${볼곳.적어도}장)`);
  if (볼곳.적어도글자 != null && (잰것.본문 == null || 잰것.본문 < 볼곳.적어도글자)) 흠.push(`본문이 ${잰것.본문}자다 (적어도 ${볼곳.적어도글자}자)`);
  for (const 말 of 볼곳.있어야 || []) if (!잰것.첫글.includes(말)) 흠.push(`「${말}」이 화면에 없다`);

  return { ...볼곳, http, ...잰것, 상태: 흠.length ? '깨짐' : '괜찮다', 흠 };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통 = 0; const 막 = [];
  const 검 = (n, ok) => { if (ok) 통++; else 막.push(n); };

  검('사이트가 넷이다', 사이트들.length === 4);
  검('사이트마다 주인이 적혀 있다', 사이트들.every((s) => /^[1-8]번$/.test(s.주인)));
  검('사이트마다 «볼 자리»가 둘 이상이다 — 첫 화면만 보지 않는다',
    사이트들.every((s) => (s.볼곳 || []).length >= 2));

  /* 🔴 고리 — 사장님이 정하신 순서 그대로여야 한다 */
  검('🔴 KLifeMap(1번)이 백년지도를 본다', 볼곳정하기('1번')?.키 === '100yearmap');
  검('🔴 백년지도(3번)가 K Culture Wire 를 본다', 볼곳정하기('3번')?.키 === 'kculturewire');
  검('🔴 K Culture Wire(5번)가 SeoulMarkets 를 본다', 볼곳정하기('5번')?.키 === 'seoulmarkets');
  검('🔴 SeoulMarkets(6번)가 KLifeMap 을 본다 — 고리가 닫힌다', 볼곳정하기('6번')?.키 === 'klifemap');
  검('⛔ 자기 사이트를 자기가 보지 않는다',
    ['1번', '3번', '5번', '6번'].every((n) => 볼곳정하기(n)?.주인 !== n));
  검('⛔ 지킬 사이트가 없는 자리는 null — 지어내지 않는다', 볼곳정하기('2번') === null);
  검('⛔ 번호가 아니면 null', 볼곳정하기(null) === null);
  /* 🔴 01:5x 에 내가 걸린 것 — 「번」을 안 붙이면 튕겼다. 이제 둘 다 받는다 */
  검('🔴 「5」와 「5번」이 같은 곳을 가리킨다 — 사람이 꼴을 외우게 두지 않는다',
    볼곳정하기(5)?.키 === 'seoulmarkets' && 볼곳정하기('5')?.키 === 볼곳정하기('5번')?.키);
  검('⛔ 그래도 없는 번호는 여전히 null — 관대함이 지어냄이 되지 않는다',
    볼곳정하기(2) === null && 볼곳정하기('9') === null);
  검('⛔ 번호고르기는 빈 값을 「번」으로 만들지 않는다', 번호고르기('') === '' && 번호고르기(null) === '');
  검('고리가 넷을 다 덮는다',
    new Set(['1번', '3번', '5번', '6번'].map((n) => 볼곳정하기(n).키)).size === 4);

  /* ⭐ 두께갈림 — 오늘 내 «눈»이 잡은 것을 자가 잡게 한다 (23:3x) */
  const 잼 = (a) => a.map((n, i) => ({ 이름: "칸" + i, 보이는글자: n }));
  const 칸이름 = (n) => Array.from({ length: n }, (_, i) => "칸" + i);
  const 재보기2 = (a) => 두께갈림(잼(a), { 견줄것들: 칸이름(a.length) });
  /* 🔴 서울마켓츠 실측값이다(2026-09-10 23:35). 내 «눈»이 「넷이 빈 방」이라고 봤고,
     가장 두꺼운 곳(24,333자)의 1/4 인 6,083자 미만이 바로 그 넷이다 —
     FX 3,423 · RATES 3,648 · COMMODITIES 3,770 · FUNDS 2,431 */
  검('🔴 갈래끼리 두께가 갈리면 얇은 넷을 집어 준다 (서울마켓츠 실측)',
    재보기2([24333, 17073, 3423, 3648, 3770, 2431]).얇은것.length === 4);
  검('선은 가장 두꺼운 곳의 1/4 이다',
    재보기2([24333, 17073, 3423, 3648, 3770, 2431]).선 === Math.round(24333 / 4));
  검('⛔ 가운뎃값을 규범으로 쓰지 않는다 — 얇은 쪽이 다수여도 잡아낸다',
    재보기2([24333, 3423, 3648, 3770, 2431]).얇은것.length === 4);
  검('가운뎃값도 함께 준다 — 분포를 보이기 위해서다(규범으로 쓰지는 않는다)',
    재보기2([1000, 2000, 3000]).가운데 === 2000);
  검('가장 두꺼운 것과 얇은 것을 함께 준다',
    재보기2([100, 5000, 900]).가장두꺼운.글자 === 5000 && 재보기2([100, 5000, 900]).가장얇은.글자 === 100);
  검('고르면 얇은 것이 없다', 재보기2([1000, 1100, 1200, 900]).얇은것.length === 0);
  검('⛔ 자리가 셋 미만이면 재지 않는다 — 둘을 비교해 「갈렸다」고 하지 않는다',
    재보기2([100, 5000]) === null);
  검('⛔ 배열이 아니면 null', 두께갈림(null) === null);
  검('🔴 견줄것들을 안 적어 두면 재지 않는다 — 결이 다른 지면을 짐작으로 견주지 않는다',
    두께갈림(잼([50324, 3423, 3648, 6301])) === null);
  검('이름의 화살표 표시를 떼고 맞댄다 — 「  ↳ FX」 는 「FX」다', 이름벗기기('  ↳ FX') === 'FX');
  검('🔴 첫 화면·ABOUT 을 견줄것들에서 빼면 그 셋이 안 잡힌다',
    두께갈림([{ 이름: "  ↳ SeoulMarkets", 보이는글자: 50324 }, { 이름: "  ↳ EQUITIES", 보이는글자: 24333 },
      { 이름: "  ↳ FX", 보이는글자: 3423 }, { 이름: "  ↳ ABOUT", 보이는글자: 6301 },
      { 이름: "  ↳ MACRO", 보이는글자: 17073 }],
      { 견줄것들: ["EQUITIES", "FX", "MACRO"] }).얇은것.length === 1);
  검('견줄것들이 셋 미만이면 재지 않는다',
    두께갈림(잼([1000, 2000, 3000]), { 견줄것들: ["칸0", "칸1"] }) === null);
  검('⛔ 못 잰 자리는 세지 않는다 — 0 으로 채우면 늘 「갈렸다」가 된다',
    두께갈림([{ 이름: "a", 보이는글자: 1000 }, { 이름: "b", 보이는글자: 1100 },
      { 이름: "c", 상태: "못쟀다", 보이는글자: null }, { 이름: "d", 보이는글자: 1200 }],
      { 견줄것들: ["a", "b", "c", "d"] }).얇은것.length === 0);
  검('⛔ 다 0 이면 못 쟀다로 둔다', 재보기2([0, 0, 0]) === null);

  /* 🔴 거짓경보 시험 — 카드가 없는 사이트를 「깨졌다」고 하지 않는다 (23:0x 에 27건 헛울렸다) */
  검('⛔ 카드 규칙이 없는 자리는 카드로 판정하지 않는다',
    (() => {
      const 볼곳 = { 이름: '첫 화면', 길: '/', 메뉴고르기: 'nav a' };
      return 볼곳.카드고르기 == null && 볼곳.적어도 == null;
    })());

  /* 판정 — 200 이어도 비면 깨진 것이다 */
  const 가짜쪽 = (잰것) => ({
    goto: async () => ({ status: () => 200 }),
    evaluate: async () => 잰것,
  });
  const 재보기 = async (볼곳, 잰것) => 한자리재기(가짜쪽(잰것), 'https://x', 볼곳);
  const 결과들 = [];
  결과들.push(['🔴 200 이어도 카드가 0장이면 깨진 것이다',
    재보기({ 이름: 'x', 길: '/content', 카드고르기: '.post-card', 적어도: 3 },
      { 보이는글자: 900, 첫글: '콘텐츠 자기이해와 좋은 판단', 카드: 0, 본문: null, 메뉴: [] })
      .then((r) => r.상태 === '깨짐')]);
  결과들.push(['🔴 「아직 발행된 콘텐츠가 없습니다」가 보이면 깨진 것이다',
    재보기({ 이름: 'x', 길: '/content' },
      { 보이는글자: 900, 첫글: '콘텐츠 아직 발행된 콘텐츠가 없습니다.', 카드: null, 본문: null, 메뉴: [] })
      .then((r) => r.상태 === '깨짐')]);
  결과들.push(['카드가 넉넉하면 괜찮다',
    재보기({ 이름: 'x', 길: '/content', 카드고르기: '.post-card', 적어도: 3 },
      { 보이는글자: 2000, 첫글: '콘텐츠 목록입니다 ' + 'ㄱ'.repeat(200), 카드: 20, 본문: null, 메뉴: [] })
      .then((r) => r.상태 === '괜찮다')]);
  결과들.push(['🔴 보이는 글자가 200자 미만이면 빈 화면으로 본다',
    재보기({ 이름: 'x', 길: '/' }, { 보이는글자: 40, 첫글: '짧다', 카드: null, 본문: null, 메뉴: [] })
      .then((r) => r.상태 === '깨짐')]);
  결과들.push(['🔴 카드고르기가 없으면 카드 0장이어도 괜찮다 — 카드 없는 사이트가 정상이다',
    재보기({ 이름: 'x', 길: '/fx' },
      { 보이는글자: 5000, 첫글: 'ㄱ'.repeat(300), 카드: null, 본문: null, 메뉴: [] })
      .then((r) => r.상태 === '괜찮다')]);
  결과들.push(['🔴 본문이 짧으면 글 지면이 깨진 것이다',
    재보기({ 이름: 'x', 길: '/content/a', 본문고르기: 'article', 적어도글자: 300 },
      { 보이는글자: 1200, 첫글: 'ㄱ'.repeat(400), 카드: null, 본문: 50, 메뉴: [] })
      .then((r) => r.상태 === '깨짐')]);

  return Promise.all(결과들.map(([n, p]) => p.then((ok) => 검(n, ok)))).then(() => {
    console.log('자가시험 — check-ring.mjs\n');
    막.forEach((m) => console.log('  MAK ' + m));
    console.log(`\n통과 ${통} · 막힘 ${막.length}`);
    return 막.length === 0;
  });
}

/* ── 돌리기 ───────────────────────────────────────────────── */
async function 돌리기(볼사이트들) {
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox'],
  });
  const 모은것 = [];
  try {
    const page = await b.newPage();
    /* ⭐ 손님이 쓰는 크기로 본다 — 사장님이 휴대폰으로 찾으셨다 */
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    for (const s of 볼사이트들) {
      console.log(`\n■ ${s.이름} (주인 ${s.주인}) — ${s.밑}`);
      for (const 볼곳 of s.볼곳) {
        const r = await 한자리재기(page, s.밑, 볼곳);
        모은것.push({ 사이트: s.이름, 주인: s.주인, ...r });
        const 표 = r.상태 === '괜찮다' ? '✅' : r.상태 === '못쟀다' ? '⬜' : '🔴';
        const 꼬리 = r.상태 === '못쟀다' ? r.까닭
          : `http ${r.http} · 보이는 글자 ${r.보이는글자}자`
            + (r.카드 != null ? ` · 카드 ${r.카드}장` : '')
            + (r.본문 != null ? ` · 본문 ${r.본문}자` : '')
            + (r.메뉴 && r.메뉴.length ? ` · 메뉴 ${r.메뉴.length}개` : '');
        console.log(`  ${표} ${String(r.이름).padEnd(14)} ${꼬리}`);
        if (r.흠 && r.흠.length) r.흠.forEach((h) => console.log(`       · ${h}`));
        /* 🔴 메뉴는 «하나씩» 누른다 — 사장님 「일일이」 */
        if (r.메뉴 && r.메뉴.length) {
          for (const 단 of r.메뉴) {
            if (!단.길 || !단.길.startsWith('/')) continue;
            /* 🔴 [2026-09-10 23:0x 고침] 여기서 «카드 규칙»을 물려주었더니 거짓경보 27건이 났다.
             * 백년지도·KCW·서울마켓츠에는 .post-card 가 «없다» — 카드 0장이 정상이다.
             * ⛔ 한 사이트의 무늬를 남의 사이트에 걸지 않는다.
             * ✅ 어디서나 통하는 두 가지로만 잰다 — ①보이는 글자가 있나 ②「비었다」고 말하나.
             *   카드 셈은 그 사이트에 카드가 «있다고 적어 둔 곳»에서만 쓴다.
             * ⭐ 두 시간 전에 내가 직접 적었다 — 「헛울리는 검사는 아무도 안 본다」. 그대로 걸렸다. */
            const 카드물려줄까 = Boolean(볼곳.카드고르기) && 단.길.startsWith(볼곳.길);
            /* ⚠ 메뉴 글이 여러 줄일 수 있다(백년지도 「백년지도 / 인생 네비」) — 첫 줄만 쓴다 */
            const 단이름 = String(단.글 || 단.길).split(String.fromCharCode(10))[0].trim().slice(0, 22);
            const rr = await 한자리재기(page, s.밑, { 이름: '  ↳ ' + 단이름, 길: 단.길,
              카드고르기: 카드물려줄까 ? 볼곳.카드고르기 : null, 적어도: 카드물려줄까 ? 1 : null });
            모은것.push({ 사이트: s.이름, 주인: s.주인, ...rr });
            const 표2 = rr.상태 === '괜찮다' ? '✅' : rr.상태 === '못쟀다' ? '⬜' : '🔴';
            console.log(`  ${표2} ${String(rr.이름).padEnd(20)} http ${rr.http} · 보이는 글자 ${rr.보이는글자}자`
              + (rr.카드 != null ? ` · 카드 ${rr.카드}장` : ''));
            if (rr.흠 && rr.흠.length) rr.흠.forEach((h) => console.log(`       · ${h}`));
          }
        }
      }
    }
  } finally { await b.close().catch(() => {}); }

  /* ⭐ 사이트마다 «갈래끼리 두께»를 본다 — 오늘 내 눈이 잡은 것을 자가 잡는다 */
  for (const s of 볼사이트들) {
    const 이사이트 = 모은것.filter((r) => r.사이트 === s.이름);
    const 갈림 = 두께갈림(이사이트, { 견줄것들: s.견줄것들 || null });
    if (갈림 && 갈림.얇은것.length) {
      console.log(`\n⬜ ${s.이름} — 갈래끼리 두께가 갈렸다 (선 ${갈림.선.toLocaleString("ko-KR")}자 = 가장 두꺼운 곳의 1/${얇음배수} · 가운뎃값 ${갈림.가운데.toLocaleString("ko-KR")}자)`);
      console.log(`   가장 두꺼운 곳 ${갈림.가장두꺼운.이름} ${갈림.가장두꺼운.글자.toLocaleString("ko-KR")}자`);
      갈림.얇은것.forEach((x) => console.log(`   · 얇다 — ${x.이름} ${x.글자.toLocaleString("ko-KR")}자`));
      console.log(`   ⛔ 깨진 것이 아니다. 다만 손님 눈에는 «빈 방»으로 보인다 — 주인 유닛(${s.주인})이 볼 일이다`);
    }
  }

  const 깨진 = 모은것.filter((r) => r.상태 === '깨짐');
  const 못쟌 = 모은것.filter((r) => r.상태 === '못쟀다');
  console.log(`\n■ 눌러 본 자리 ${모은것.length}개 · 🔴 깨짐 ${깨진.length} · ⬜ 못 쟀다 ${못쟌.length}`);
  if (깨진.length) {
    console.log('\n🔴 **주인 유닛에게 즉시 알린다** —');
    깨진.forEach((r) => console.log(`   · [${r.주인}] ${r.사이트} ${r.이름} — ${r.흠.join(' / ')}`));
  }
  /* 기록을 남긴다 — 「봤다」를 기억에 두지 않는다 */
  const 낼곳 = path.join(뿌리, 'docs', '고리점검');
  try {
    fs.mkdirSync(낼곳, { recursive: true });
    const d = new Date();
    const 이름 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}.json`;
    fs.writeFileSync(path.join(낼곳, 이름), JSON.stringify(모은것, null, 2), 'utf8');
    console.log('\n  기록 → docs/고리점검/' + 이름);
  } catch (e) { console.log('\n  ⬜ 기록을 못 남겼다 — ' + e.message); }
  return 깨진.length === 0;
}

const 나 = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(나)) {
  if (process.argv.includes('--자가시험')) {
    자가시험().then((ok) => process.exit(ok ? 0 : 1));
  } else if (process.argv.includes('--전부')) {
    돌리기(사이트들).then((ok) => process.exit(ok ? 0 : 1));
  } else {
    const i = process.argv.indexOf('--내가');
    const 나번호 = i >= 0 ? process.argv[i + 1] : null;
    const 볼것 = 볼곳정하기(나번호);
    if (!볼것) {
      console.log('⛔ --내가 <번호> 를 준다 (1번·3번·5번·6번). 또는 --전부');
      console.log('   고리: KLifeMap(1번) → 백년지도(3번) → K Culture Wire(5번) → SeoulMarkets(6번) → KLifeMap');
      process.exit(1);
    }
    console.log(`■ ${나번호} 가 볼 곳 — ${볼것.이름} (주인 ${볼것.주인})   ⭐ 사장님이 정하신 고리다`);
    돌리기([볼것]).then((ok) => process.exit(ok ? 0 : 1));
  }
}
