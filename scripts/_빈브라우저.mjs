/* 검사가 «남의 브라우저 상태»를 물려받지 않게 하는 자리. (5번 2026-10-11)
 *
 * 🔴 왜 있나 — 2026-10-11 에 겪은 것
 *   구글이 색인을 안 넣는 까닭을 찾느라 열한 장을 사장님 크롬(9222)에 붙어 그려 봤다.
 *   **열한 장 모두 중국어로 나왔다.** 지면이 깨진 줄 알았는데 아니었다 —
 *   사장님 크롬의 `localStorage.bj_lang` 이 `zh` 로 서 있었고, 그 값이 새 탭에도 따라왔다.
 *   빈 컨텍스트로 다시 재니 열한 장 다 한국어였다.
 *
 *   ⭐ 그러니 바탕 컨텍스트로 재는 검사는 **사장님이 무슨 말로 보고 계시냐에 따라 답이 바뀐다.**
 *      같은 저장소, 같은 명령인데 어제와 오늘 답이 다르다 — 그런 검사는 자가 아니다.
 *
 * 쓰는 법
 *   const { 컨텍스트, 닫기 } = await 빈컨텍스트(b);
 *   const p = await 컨텍스트.newPage();
 *   ... finally { await p.close(); await 닫기(); b.disconnect(); }
 *
 * ⛔ b.close() 를 부르지 않는다 — 사장님 창이 통째로 닫힌다. 언제나 disconnect() 다.
 */

/** 저장된 말 고름 — 늘어나면 여기에 더한다 */
export const 말을담는칸 = ['bj_lang', 'lang', 'i18nLang'];

/**
 * 빈 컨텍스트를 연다. 크롬 판이 낮아 못 만들면 바탕 컨텍스트를 쓰되
 * «말 고름을 지운다»고 알리고 돌려준다 — 조용히 더러운 자리를 쓰지 않는다.
 */
export async function 빈컨텍스트(b, { 격리 = true } = {}) {
  /* 🔴 **격리는 공짜가 아니다.** 2026-10-11 에 두 가지가 깨지는 것을 실측했다 —
   *
   *   ① 클립보드가 멈춘다 — navigator.clipboard 가 답을 안 주고
   *      Runtime.callFunctionOn 이 시간을 넘긴다. (check-만세력-공유가되나)
   *   ② 페이팔 결제창이 안 뜬다 — 격리된 자리는 제3자 쿠키·팝업을 막는다.
   *      (check-seoulmarkets-payment — 격리했더니 「매출 0」이라고 잘못 외쳤다)
   *
   *   ⭐ 둘 다 «손님의 조건»이 아니라 «크롬 격리창의 조건»이다.
   *      그런 자리를 재는 검사는 `격리: false` 로 불러 바탕 자리에 «말 고름만 지우고» 연다.
   *   ⛔ 그렇다고 그냥 바탕 자리를 쓰면 안 된다 — bj_lang 이 따라온다.
   *
   *   ⚠ 다만 ②는 «아직 안 끝난 물음»을 남긴다 —
   *      제3자 쿠키를 막아 둔 «진짜» 손님도 결제창이 안 뜨는가?
   *      크롬이 제3자 쿠키를 걷어 내는 중이라 언젠가 실제 매출 문제가 된다.
   *      docs/다시잴것-대장.tsv 에 적어 두었다. ⛔ 「검사가 깨졌다」로 덮고 넘어가지 않는다. */
  if (!격리) {
    return {
      컨텍스트: b.defaultBrowserContext(),
      격리됐나: false,
      까닭: '격리를 일부러 껐다 — 클립보드·결제창이 격리된 자리에서 막힌다',
      닫기: async () => { /* 바탕 자리는 내 것이 아니다 */ },
    };
  }
  try {
    const 컨텍스트 = await b.createBrowserContext();
    return { 컨텍스트, 격리됐나: true, 닫기: async () => { try { await 컨텍스트.close(); } catch { /* 이미 닫혔다 */ } } };
  } catch (e) {
    const 컨텍스트 = b.defaultBrowserContext();
    return {
      컨텍스트,
      격리됐나: false,
      까닭: String(e.message || e).slice(0, 80),
      닫기: async () => { /* 바탕 컨텍스트는 내 것이 아니다 — 닫지 않는다 */ },
    };
  }
}

/**
 * 탭 하나를 «아무것도 기억 못 하는 상태»로 연다.
 * 격리가 안 됐으면 저장된 말 고름을 지우고 연다 — 지우는 것은 goto «앞»이어야 한다.
 */
export async function 빈탭(컨텍스트묶음, { 격리됐나 } = {}) {
  const 컨텍스트 = 컨텍스트묶음.컨텍스트 || 컨텍스트묶음;
  const 격리 = 격리됐나 ?? 컨텍스트묶음.격리됐나 ?? false;
  const p = await 컨텍스트.newPage();
  if (!격리) {
    /* ⭐ goto 앞에 걸어야 한다 — 뒤에 지우면 이미 그 말로 그려진 뒤다 */
    await p.evaluateOnNewDocument((칸들) => {
      try { for (const k of 칸들) localStorage.removeItem(k); } catch { /* 무시 */ }
    }, 말을담는칸);
  }
  return p;
}

/** 지금 그려진 글이 무슨 말인가 — 글자 갈래로 센다 */
export function 무슨말인가(글) {
  const s = String(글 ?? '');
  const 한글 = (s.match(/[가-힯]/g) || []).length;
  const 가나 = (s.match(/[぀-ヿ]/g) || []).length;
  const 한자 = (s.match(/[一-鿿]/g) || []).length;
  const 라틴 = (s.match(/[A-Za-z]/g) || []).length;
  const 합 = 한글 + 가나 + 한자 + 라틴;
  if (!합) return { 으뜸: null, 몫: 0 };
  const 표 = [['한국어', 한글], ['일본어', 가나], ['중국어', 한자], ['영어', 라틴]];
  표.sort((a, c) => c[1] - a[1]);
  return { 으뜸: 표[0][0], 몫: Math.round((표[0][1] / 합) * 100), 한글, 가나, 한자, 라틴 };
}
