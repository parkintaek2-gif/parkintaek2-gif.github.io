/**
 * K Culture Wire → KLifeMap 으로 넘어가는 **입구 한 곳** (영어 손님용).
 *
 * 사장님 지시(2026-08-07, 2번이 전달) — *「유입은 한 방향이다. 우리 지면이 끌어서
 * KLifeMap 고객이 되게 한다」* · 2번 확인(2026-08-2x) — *「KCW 에 이미 KLifeMap
 * 이름이 있는데 «링크»가 없습니다」*
 *
 * ## 🔴 2026-08-26 에 재서 확인한 것 — 정말로 링크가 «0개» 였다
 *
 * ```
 * https://www.kculturewire.com/person/iu   글자 'klifemap.ai'  1곳
 *                                          <a href> 로 «걸린» 것   0개   ← 애널리틱스 안 문자열이었다
 * ```
 * ⚠ **글자가 있다고 링크가 있는 것이 아니다.** grep 으로 세면 있는 것처럼 보인다.
 *   `<a[^>]*klifemap\.ai` 로 재야 「누를 수 있는가」가 나온다.
 *
 * ## 🔴 그리고 도착지를 «크롬으로» 재야 했다 — curl 로 재니 반대로 나왔다
 *
 * ```
 * curl  saju.html?lang=en   한글 77낱말 / 영어 8낱말   → 「한국어 지면이다」  ⛔ 틀린 판정
 * 크롬  saju.html?lang=en   영문 2,112자 / 한글 126자(6%)  → ✅ 영어로 열린다
 * ```
 * 까닭 — `i18n.js` 가 `</body>` 직전(7188번째 줄)에 실려 **번역이 늦게 돈다.**
 * curl 은 번역 «전» 껍데기를 본다. ⭐ 도착지가 손님 말로 열리는지는 **브라우저로** 잰다.
 *
 * ## ⚠ 3번(백년지도)의 `klifemap.ts` 를 그대로 못 쓴다
 *
 * 그쪽 문구는 한국어이고 도착지도 학부모용(`/child-career.html`)이다.
 * KCW 손님은 영어를 읽고, 우리 지면의 맥락은 **생년월일 · 일주(day pillar)** 다.
 * 그래서 자리는 따로 두되 **규칙 셋은 그대로 가져온다** —
 *
 *   ① 주소를 지면에 흩지 않는다(여기 한 곳)
 *   ② 배너가 아니라 **그 지면에서 이어지는 다음 물음**으로 적는다 (2번 지시)
 *   ③ 다른 사이트로 넘어간다는 것을 **밝힌다**
 */

export type 입구 = {
  /** 링크를 걸 수 있는 상태인가. false 면 링크를 걸지 않는다 */
  준비됨: boolean;
  /** 도착지 */
  주소: string;
  /** 링크에 보일 글자 — 광고 문구가 아니라 «물음»이다 */
  물음: string;
  /** 왜 그리로 가는지 — 한 줄 */
  까닭: string;
};

/** 누르면 다른 사이트로 간다는 밝힘. 지면마다 다시 쓰지 않는다. */
export const 다른사이트밝힘 = 'KLifeMap.AI — a separate site we also run';

/**
 * 생년월일이 있는 지면에서 이어지는 물음.
 *
 * ✅ **2026-08-26 11:3x 에 크롬으로 재고 걸었다** —
 *   `https://klifemap.ai/saju.html?lang=en`
 *   · 200 · 영문 94% · **로그인 벽 없음** · 결제 강요 없음
 *   ⚠ 한글이 126자 남아 있다(「추천하신…」). 4번께 넘겼다. 링크를 막을 정도는 아니다.
 */
export const KLIFEMAP_사주: 입구 = {
  준비됨: true,
  주소: 'https://klifemap.ai/saju.html?lang=en',
  물음: 'What does a birth date say in the Korean four-pillars system?',
  까닭: 'Free chart — no sign-up, no payment.',
};

/**
 * 만세력(달력) — 날짜 자체를 다루는 지면에서.
 *
 * ✅ 2026-08-26 에 쟀다 — 200 · 로그인 벽 없음.
 * ⚠ 영문 비율은 사주 지면만큼 재지 못했다. 「못 쟀다」로 적어 둔다.
 */
export const KLIFEMAP_만세력: 입구 = {
  준비됨: true,
  주소: 'https://klifemap.ai/mansecalendar.html?lang=en',
  물음: 'Look up any date in the Korean lunar-solar calendar',
  까닭: 'The calendar the four-pillars system is read from.',
};
