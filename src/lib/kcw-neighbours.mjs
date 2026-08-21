/**
 * K Culture Wire — 기사에서 기사로 나가는 세 문을 **한 자리에서** 고른다.
 *
 * ── 왜 이 파일이 생겼나 (2026-08-22 실측) ──────────────────────
 * 8/21 에 「관련기사 3개 · 링크 15개 전부 200」을 확인하고 끝냈는데,
 * 같은 자로 **누가 가리켜지나**를 세 보니 한쪽으로 쏠려 있었다.
 *
 *   가리켜지는 횟수  4·4·3·3 (최신 넷)   vs   2 (나머지)
 *   108편이 가리키는 **서로 다른 기사 — 21편뿐**
 *
 * 까닭은 둘째 겹(태그 겹침)이 「겹침 수 → 최신순」이라 최근에 낸 편들이 태그를 공유해
 * **서로를 물고** 있었던 것이다. 손님이 네 편 안에서 돌 수 있고, 로봇도 그 넷만 다시 본다.
 * ⛔ 링크가 「3개 있다」는 것과 「108편이 다 문이 된다」는 것은 다른 말이다.
 *    앞의 것만 재고 끝냈던 것이 8/21 의 흠이다.
 *
 * ── 그래서 무엇을 바꿨나 ───────────────────────────────────────
 * 세 문 중 **셋째 자리를 「덜 가리켜진 편」에게 준다.** 앞의 두 자리는 그대로 가까운 순이다.
 *   ① 같은 자료 지면을 쓴 기사              가장 가깝다
 *   ② 태그가 겹치는 기사 (겹침 수 → 최신순)  그다음
 *   ③ ①②의 후보 중 **지금까지 가장 덜 가리켜진 편**  ← 바꾼 자리
 *
 * ⛔ 손으로 고르는 것이 아니다. 세는 규칙이다 — 다음 기사를 내도 저절로 돈다.
 * ⛔ 순위·인기로 세우지 않는다. 「덜 가리켜진」은 우리 링크 수이지 사람의 관심이 아니다.
 * ⚠ 셋째 자리도 **이 기사의 후보 안에서만** 고른다. 아무 기사나 붙이면 이웃이 아니게 된다 —
 *   문을 고르게 내는 것과 엉뚱한 문을 내는 것은 다르다.
 *
 * ── 왜 별 파일인가 ────────────────────────────────────────────
 * 지면(`src/pages/wikitip/article/[...id].astro`)과 자(`scripts/check-kcw-article-doors.mjs`)가
 * **같은 규칙**을 봐야 한다. 규칙이 두 군데 적히면 한쪽만 고쳐지고 자는 옛 규칙을 잰다.
 */

/** 최신순 — 날짜가 같으면 id 로 갈라 **어느 기계에서나 같은 순서**가 되게 한다. */
export const 최신순 = (a, b) =>
  +new Date(b.pubDate) - +new Date(a.pubDate) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * 이웃 후보 — 가까운 순으로 늘어놓는다. 겹치는 것은 앞의 겹이 이긴다.
 * @param {object} 나 {id, pages, tags, category, pubDate}
 * @param {object[]} 모두 같은 모양의 기사들
 */
export const 후보들 = (나, 모두) => {
  const 남 = 모두.filter((e) => e.id !== 나.id);
  const 내지면 = 나.pages ?? [];
  const 내태그 = 나.tags ?? [];

  const 같은지면 = 남
    .filter((e) => (e.pages ?? []).some((p) => 내지면.includes(p)))
    .sort(최신순);

  const 태그겹침 = (e) => (e.tags ?? []).filter((t) => 내태그.includes(t)).length;
  const 같은태그 = 남
    .filter((e) => 태그겹침(e) > 0)
    .sort((a, b) => 태그겹침(b) - 태그겹침(a) || 최신순(a, b));

  const 같은갈래 = 남.filter((e) => e.category === 나.category).sort(최신순);

  const 본것 = new Set();
  const 줄 = [];
  for (const 겹 of [같은지면, 같은태그, 같은갈래]) {
    for (const e of 겹) {
      if (본것.has(e.id)) continue;
      본것.add(e.id);
      줄.push(e);
    }
  }
  return 줄;
};

/**
 * 모든 기사의 이웃을 **한 번에** 정한다. 셋째 자리는 여기서만 정할 수 있다 —
 * 「덜 가리켜진」은 다른 기사들이 누구를 가리켰는지를 알아야 나오는 수라서,
 * 지면 한 장만 보고는 못 정한다.
 *
 * @param {object[]} 기사들 {id, pages, tags, category, pubDate}
 * @param {{이웃수?: number}} [옵션]
 * @returns {Map<string, string[]>} 기사 id → 이웃 id 셋 (가까운 순, 셋째는 고르게 낸 문)
 */
export function 이웃표(기사들, { 이웃수 = 3 } = {}) {
  const 순서 = [...기사들].sort(최신순);
  const 후보 = new Map(순서.map((a) => [a.id, 후보들(a, 순서).map((e) => e.id)]));
  const 뽑힘 = new Map(순서.map((a) => [a.id, []]));
  const 들어오는수 = new Map(순서.map((a) => [a.id, 0]));

  /* 앞의 두 자리 — 가까운 순 그대로. 여기는 8/21 까지와 똑같다 */
  const 가까운자리 = Math.max(0, 이웃수 - 1);
  for (const a of 순서) {
    for (const id of 후보.get(a.id).slice(0, 가까운자리)) {
      뽑힘.get(a.id).push(id);
      들어오는수.set(id, 들어오는수.get(id) + 1);
    }
  }

  /*
   * 셋째 자리 — 후보 중 **지금까지 가장 덜 가리켜진 편**.
   * 동률이면 후보 순서(= 더 가까운 편)가 이긴다. 세면서 수를 바로 올려
   * 다음 기사가 같은 편을 또 고르지 않게 한다.
   */
  for (const a of 순서) {
    const 이미 = 뽑힘.get(a.id);
    if (이미.length >= 이웃수) continue;
    let 고른것 = null;
    for (const id of 후보.get(a.id)) {
      if (이미.includes(id)) continue;
      if (고른것 === null || 들어오는수.get(id) < 들어오는수.get(고른것)) 고른것 = id;
    }
    if (고른것 === null) continue; /* 후보가 둘뿐인 기사 — 없는 문을 만들지 않는다 */
    이미.push(고른것);
    들어오는수.set(고른것, 들어오는수.get(고른것) + 1);
  }

  return 뽑힘;
}

/**
 * 잰 것을 그대로 돌려준다 — 자(`check-kcw-article-doors.mjs`)와 보고가 같은 수를 쓰게.
 * ⛔ 「좋아졌다」는 말을 여기서 하지 않는다. 수만 낸다.
 */
export function 문열림(기사들, 옵션) {
  const 표 = 이웃표(기사들, 옵션);
  const 들어오는수 = new Map([...표.keys()].map((id) => [id, 0]));
  for (const 줄 of 표.values()) for (const id of 줄) 들어오는수.set(id, 들어오는수.get(id) + 1);
  const 수들 = [...들어오는수.values()];
  return {
    기사수: 표.size,
    이웃이셋: [...표.values()].filter((v) => v.length === 3).length,
    가리켜지는서로다른편: 수들.filter((n) => n > 0).length,
    안가리켜지는편: 수들.filter((n) => n === 0).length,
    최다: 수들.length ? Math.max(...수들) : 0,
    들어오는수,
  };
}
