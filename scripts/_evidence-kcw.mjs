/**
 * **근거 칸에 쓸 표준 문구** — 사장님 지시(2026-08-15)를 자로 바꾼 것의 두 번째 조각.
 *
 * ```
 *   스스로 발전해야 한다. 판단 장치는 추측이 아니라
 *   <데이터, 검증된 과학기술, 학술적 근거> 임을 명심해라.
 * ```
 *
 * ── 왜 공유하나 ────────────────────────────────────────────────
 * 내 자료 76개 중 통계를 쓰는 것이 37개이고, 그중 33개가 방법을 안 밝히고 있었다.
 * 하나씩 손으로 쓰면 오래 걸리고, **더 나쁘게는 자료마다 말이 달라진다.**
 *
 * ⭐ 「중앙값은 왜 평균이 아닌가」·「jackknife 는 무엇을 못 하나」는 **어디서나 같은 사실**이다.
 *   그것은 여기 한 번 적고 가져다 쓴다.
 * ⛔ 그러나 **자료 고유의 한계는 여기 없다.** 그건 빌더가 제 것을 덧붙인다 —
 *   붙여넣기 문구만 있는 근거 칸은 찬 것이 아니라 **찬 척하는 것**이다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **한계 없는 방법 문구를 만들지 않는다.** 학술적 근거를 쓴다는 것은 권위를 빌리는 것이
 *    아니라 **한계를 물려받는 것**이다. 그래서 짝(`방법`·`한계`)으로만 낸다.
 * ⛔ **출처를 여기 두지 않는다.** ① 잰 데이터는 자료마다 다르다. 짐작할 수 없다.
 * ⛔ 값(상수)만 내보낸다 — 이 자는 아무것도 실행하지 않는다.
 */

/**
 * ⭐ 중앙값을 쓰는 까닭과 그 한계.
 * ⚠ 「평균보다 낫다」가 아니다. **이 물음에서 평균이 하는 일이 잘못됐다**는 것이다.
 */
export const 중앙값 = {
  방법: 'We report the median rather than the mean. A handful of very large values would pull '
    + 'a mean away from where most of the sample actually sits, and in reads-per-title data '
    + 'those large values are the norm, not an error.',
  한계: 'A median tells you where the middle sits and nothing about the shape around it, so it '
    + 'should be read next to the range or the full distribution, not alone.',
};

/**
 * ⭐⭐ 하나 빼기(jackknife)의 방법과 **한쪽으로만 쓸 수 있다는 것**.
 * 🔴 8/15 — 이 자의 학명을 찾고서야 알았다. 그전에는 못 잡은 것을 「안정」으로 싣고 있었다.
 */
export const 하나빼기 = {
  방법: 'Stability of a median is checked with a jackknife — remove one observation, recompute, '
    + 'repeat for each (Quenouille 1949, Tukey 1958).',
  한계: 'The jackknife understates how much a median varies, because removing one observation '
    + 'barely moves a median, and it is not consistent for the median (Miller 1974). A swing it '
    + 'finds is therefore real; a swing it misses is not evidence of stability. Establishing '
    + 'stability would need a delete-d jackknife or a bootstrap (Efron 1979), which we have '
    + 'not built.',
};

/**
 * ⭐ 백만분율 — 판마다 크기가 달라 날수를 그대로 견줄 수 없다.
 * ⚠ 이것이 우리 자료 대부분의 바탕이라, 한계도 대부분에 걸린다.
 */
export const 백만분율 = {
  방법: 'Reads are expressed per million reads of that Wikipedia in that month, so that a large '
    + 'edition and a small one can be compared without the larger one winning by size alone.',
  한계: 'Dividing by an edition\'s own total means a month when that edition was unusually busy '
    + 'lowers every article in it. The ratio measures share of attention inside an edition, not '
    + 'how many people read something.',
};

/**
 * ⭐⭐ 상관 — **가장 오해받는 자다.** 그래서 한계를 가장 길게 적는다.
 *
 * 🔴 8/15 — `staying-power` 가 상관계수 셋(0.733 · −0.753 · −0.473)을 내면서
 *   **그 방법이 왜 옳은지도, 무엇을 못 하는지도 안 적고** 있었다.
 * ⚠ 로그를 씌운 것도 방법의 일부다 — 안 밝히면 독자가 원래 값의 상관으로 읽는다.
 */
export const 상관 = {
  방법: 'Correlations are Pearson coefficients. Where hours are involved they are taken on the '
    + 'logarithm of hours, because viewing hours span several orders of magnitude and a handful '
    + 'of enormous titles would otherwise decide the coefficient on their own.',
  한계: 'A correlation is not a cause, and it only detects the straight-line part of a '
    + 'relationship — two things can move together tightly in a curve and still score near '
    + 'zero. Taking logs changes what is being correlated: it is the ranking-like structure of '
    + 'hours, not hours themselves. A coefficient from a chosen sample also inherits that '
    + 'choice; ours are titles that reached a chart, which is not a sample of titles.',
};

/** ⭐ 대조군 — 91편에서 배운 것. 대조가 없으면 「한국이 특별하다」를 말할 수 없다 */
export const 대조군 = {
  방법: 'The Korean figure is read against a control drawn the same way, because a movement that '
    + 'appears in the control as well is not a fact about Korea.',
  한계: 'A control rules an explanation out; it does not identify the one that replaces it. We '
    + 'say what the control removes and stop there.',
};

/**
 * ⭐ 짝을 이어 붙인다. 자료 고유의 것을 **반드시** 덧붙이게 되어 있다.
 * ⛔ `고유` 없이 부르면 던진다 — 붙여넣기만 있는 근거 칸을 막는다.
 */
export function 근거(조각들, 고유) {
  if (!Array.isArray(조각들) || !조각들.length) throw new Error('근거 조각이 없다');
  if (!고유 || typeof 고유.한계 !== 'string' || 고유.한계.length < 30) {
    throw new Error('⛔ 이 자료 고유의 한계를 적어야 한다 — 표준 문구만으로는 근거 칸이 안 찬다');
  }
  return {
    method: [...조각들.map((x) => x.방법), 고유.방법].filter(Boolean).join(' '),
    limitation: [...조각들.map((x) => x.한계), 고유.한계].filter(Boolean).join(' '),
  };
}
