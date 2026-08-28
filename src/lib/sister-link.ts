/**
 * sister-link.ts — **자매 사이트로 보내는 링크에 딱지를 단다.** (5번, 2026-08-28)
 *
 * ── 🔴 왜 이것이 생겼나 ────────────────────────────────────────
 * 사장님이 정하신 마케팅은 «둘»이다 —
 *   ① 콘텐트를 통한 **검색 유입**
 *   ② **우리가 운영하는 다른 사이트를 통한 유입**
 *
 * 오늘(2026-08-28) 7일치 유입원을 갈라 보니 ②가 **어느 사이트에도 한 줄도 없었다.**
 * ```
 * 3번 100yearmap   X 13 · 구글 13 · 네이버 4 · perplexity 1
 * 5번 KCW          구글 12 · X 2 · facebook 1
 * 6번 SeoulMarkets X 3 · 구글 1
 * ```
 * 처음에는 「아무도 우리끼리 안 걷는다」로 읽었다. **틀린 읽기였다.**
 *
 * ⛔ **자가 그렇게 만든 것이었다.** `Analytics.astro` 가 네 도메인을 `linker.domains`
 *   로 이어 놓았다. 크로스도메인으로 이으면 사이트 간 이동이 «같은 세션»으로 붙고
 *   **referral 로 안 잡힌다.** 즉 우리는 이 축을 **한 번도 못 재고 있었다.**
 *   ⚠ 그렇다고 linker 를 끄면 안 된다 — 끄면 세션이 갈라져 다른 수가 다 망가진다.
 *
 * ⭐ 그래서 «딱지»로 센다. 3번이 이미 그렇게 하고 있었다 —
 *   `klifemap.ai/ilzin.html?from=100y&at=home`. 받는 쪽 `landingPage` 에 그대로 남아
 *   **누가 보냈는지**를 셀 수 있다. 그 방법을 전 유닛이 같이 쓴다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **주소를 지면에 손으로 적지 않는다.** 손으로 적으면 딱지를 빠뜨린다 —
 *   오늘 라이브를 세니 내 지면의 자사 링크 중 딱지가 붙은 것이 «0개»였다.
 * ⛔ 물음표가 이미 있는 주소에 `?` 를 또 붙이지 않는다.
 * ⛔ 남의 도메인에는 딱지를 안 단다 — 우리 딱지는 우리 사이트에서만 뜻이 있다.
 */

/** 우리 네 사이트. ⚠ `Analytics.astro` 의 `잇는곳` 과 같은 목록이어야 한다 */
export const 자매도메인 = [
  '100yearmap.com',
  'seoulmarkets.com',
  'kculturewire.com',
  'klifemap.ai',
];

/** 이 사이트가 보낼 때 쓰는 이름. ⛔ 유닛마다 다르다 */
export const 나는 = 'kcw';

/** 우리 사이트인가 — `www.` 가 붙어도 같은 곳으로 본다 */
export function 자매인가(주소: string): boolean {
  let h: string;
  try { h = new URL(주소).hostname.toLowerCase(); } catch { return false; }
  const 벗 = h.replace(/^www\./, '');
  return 자매도메인.includes(벗);
}

/**
 * 자매 사이트 주소에 딱지를 단다.
 *
 * @param 주소  보낼 곳
 * @param 자리  이 링크가 «어느 자리»에 있었나 (footer · article · born-on …)
 *
 * ⚠ 이미 `from=` 이 붙어 있으면 그대로 둔다 — 손으로 정해 붙인 것을 덮지 않는다.
 * ⛔ 남의 도메인이면 아무것도 안 붙이고 그대로 돌려준다.
 */
export function 자매링크(주소: string, 자리: string, 보낸이: string = 나는): string {
  if (!자매인가(주소)) return 주소;
  let u: URL;
  try { u = new URL(주소); } catch { return 주소; }
  if (u.searchParams.has('from')) return 주소;
  u.searchParams.set('from', 보낸이);
  if (자리) u.searchParams.set('at', 자리);
  return u.toString();
}

/* ── 자가시험 ─────────────────────────────────────────────── */
/* eslint-disable no-console */
if (typeof process !== 'undefined' && process.argv?.includes('--자가시험')) {
  let 통 = 0; const 실: string[] = [];
  const 검 = (이름: string, 참: boolean) => { if (참) 통 += 1; else 실.push(이름); };

  검('우리 사이트를 알아본다', 자매인가('https://100yearmap.com/') === true);
  검('www 가 붙어도 우리다', 자매인가('https://www.kculturewire.com/x') === true);
  검('남의 도메인은 아니다', 자매인가('https://www.netflix.com/') === false);
  검('주소가 아니면 아니다', 자매인가('그냥 글자') === false);

  검('딱지를 단다', 자매링크('https://seoulmarkets.com/', 'footer')
    === 'https://seoulmarkets.com/?from=kcw&at=footer');
  /* ⛔ 물음표가 이미 있어도 안 깨진다 — 손으로 이어 붙이면 여기서 깨진다 */
  검('물음표가 이미 있어도 안 깨진다',
    자매링크('https://klifemap.ai/saju.html?lang=en', 'born-on')
    === 'https://klifemap.ai/saju.html?lang=en&from=kcw&at=born-on');
  /* ⚠ 3번이 손으로 붙여 둔 딱지를 덮지 않는다 */
  검('이미 from 이 있으면 그대로 둔다',
    자매링크('https://klifemap.ai/ilzin.html?from=100y&at=home', 'footer')
    === 'https://klifemap.ai/ilzin.html?from=100y&at=home');
  검('남의 도메인은 안 건드린다',
    자매링크('https://www.netflix.com/tudum', 'footer') === 'https://www.netflix.com/tudum');
  검('자리를 안 주면 from 만 단다',
    자매링크('https://seoulmarkets.com/', '') === 'https://seoulmarkets.com/?from=kcw');
  검('보낸이를 바꿀 수 있다',
    자매링크('https://klifemap.ai/', 'x', '100y').includes('from=100y'));
  /* ⚠ 목록이 Analytics 의 linker 와 어긋나면 딱지가 붙는 곳과 세션이 이어지는 곳이 달라진다 */
  검('네 사이트가 다 있다', 자매도메인.length === 4);

  if (실.length) { console.error(`❌ ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 자매 링크 딱지 — 자가시험 ${통}개 통과`);
  process.exit(0);
}
