/**
 * **파는 값 — 한 곳에서만 온다.** (2번 결정 2026-08-08 15:5x)
 *
 * > 사장님(15:5x): 「kcw 가격은 너희들이 합리적인 가격으로 결정해서 진행해」
 *
 * ⛔ 지면마다 손으로 적지 않는다. 적으면 값을 바꿀 때 **한쪽만 고쳐진다.**
 *    오늘 아침에 `/data` 와 `/subscribe` 가 한 벌 크기를 각자 세다가 서로 다른 수를 말했다.
 *    같은 병을 값에서 되풀이하지 않는다.
 *
 * ⛔ 값을 혼자 바꾸지 않는다. 2번에게 근거와 함께 말하고 바꾼다 —
 *    지면과 사장님 보고가 어긋나면 사장님이 두 숫자를 보시게 된다.
 */

/** 한 번 사는 값. 드라마·배우 판정 한 벌 */
export const ONE_OFF_USD = 39;
/** 달마다. 갱신과 새로 나오는 표가 들어온다 */
export const MONTHLY_USD = 19;

/**
 * 여는 달 — **정가를 세워 놓고 그달만 연다.**
 * ⛔ 「$39 → 무료!」 식으로 시작하지 않는다. 할인으로 열면 **정가가 영영 안 선다.**
 */
export const FREE_FROM = '2026-08-15';
export const FREE_UNTIL = '2026-09-14';

/**
 * ⛔ 넷플릭스 없는 한 벌은 **값이 없다.** 재배포 조건이 대장에 ⬜ 미확인이라
 *    무엇을 파는지가 아직 안 정해졌다. 지어내지 않는다.
 */
export const NETFLIX_FREE_PRICED = false;

/** 왜 이 값인가 — 지면이 그대로 읽어 쓴다. 근거 없는 값은 안 판다. */
export const WHY = [
  'Half of what we sell is marked empty, and we say so on the page before you buy. A price that ignores that would be a price for a table we do not have.',
  'Nothing comparable is sold, so we cannot read the market. When we cannot read it we start low and raise it, rather than start high and discount.',
];

/** 사람이 읽는 꼴. 지면·검사가 **같은 함수**를 쓴다 — 두 자리가 다르게 적으면 안 된다 */
export const usd = (n: number) => `$${n}`;

/**
 * 🔴 **2026-08-08 17:5x — 라이브에 하루 이른 날짜가 나가고 있었다.**
 *
 * ```
 * 내 화면(KST)   15 August to 14 September   ← 맞다
 * 라이브(UTC)    14 August to 13 September   ← 손님이 본 것
 * ```
 *
 * 까닭 — 앞판은 이렇게 썼다:
 *   `new Date('2026-08-15T00:00:00+09:00').toLocaleDateString('en-GB', …)`
 * `toLocaleDateString` 은 `timeZone` 을 안 주면 **그 기계의 시간대**로 그린다.
 * 내 기계는 KST 라 15일로 보였고, 내보내는 기계는 UTC 라 **같은 순간이 14일**이었다.
 * ⛔ 내 화면에서 맞는 것은 맞다는 뜻이 아니다. 8/15 는 우리 출시일이고,
 *    하루 이른 날짜는 「무료가 언제 시작하나」를 손님에게 틀리게 말한 것이다.
 *
 * ⛔ 그래서 **Date 를 아예 안 쓴다.** 값은 이미 '2026-08-15' 라는 글자다.
 *    글자에서 글자를 만들면 시간대가 끼어들 자리가 없다.
 *    (`timeZone: 'Asia/Seoul'` 을 주는 고침도 되지만, 다음 사람이 그 한 칸을 지우면 조용히 되살아난다)
 */
const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
export const 날짜꼴 = (s: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`날짜가 YYYY-MM-DD 가 아니다: ${s} — 지어내지 않고 선다`);
  const 달 = 달이름[+m[2] - 1];
  if (!달) throw new Error(`달이 ${m[2]} 이다: ${s}`);
  return `${+m[3]} ${달}`;
};
export const 여는달 = (): string => `${날짜꼴(FREE_FROM)} to ${날짜꼴(FREE_UNTIL)}`;
