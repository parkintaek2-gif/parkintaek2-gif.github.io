/**
 * 요청 경로를 **파일을 찾을 수 있는 문자열**로 편다. 못 펴면 null.
 *
 * ── 왜 별도 파일인가 ──────────────────────────────────────────────
 * `server.mjs` 는 최상위에서 `server.listen()` 을 부른다. 거기서 함수를 가져오면
 * **시험을 돌릴 때마다 서버가 뜬다.** 그렇다고 listen 을 조건부로 바꾸면
 * **배포 때 서버가 안 뜰 위험**을 지는데, 그건 시험 하나 때문에 질 위험이 아니다.
 * 그래서 로직만 여기로 뺐다. `server.mjs` 는 이걸 가져다 쓴다.
 *
 * ⚠ 로직을 시험 파일에 **복사해 두지 않는다.** 복사본은 언젠가 한쪽만 고쳐져 어긋난다.
 */

/** latin1 상위 영역. 원시 UTF-8 바이트가 문자로 읽히면 여기에 걸린다 */
const 상위바이트 = new RegExp('[' + String.fromCharCode(0x80) + '-' + String.fromCharCode(0xff) + ']');
/** U+FFFD. UTF-8 로 못 읽었다는 표시 */
const 대체문자 = String.fromCharCode(0xfffd);

export function 경로펴기(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null; // 해석 불가 → 404. **던지지 않는다** (프로세스가 죽는다)
  }

  /* ⚠ 2026-08-04 — 한글 주소가 404 였다. 3번(백년지도)이 원인을 잡아 알려 줬다.
   *
   *   /major/조리과                          404  ⛔
   *   /major/%EC%A1%B0%EB%A6%AC%EA%B3%BC    200  ✅   ← 같은 주소인데 갈렸다
   *
   * Node 는 `req.url` 을 **바이트 그대로(latin1)** 준다. 클라이언트가 한글을
   * 인코딩 없이 **원시 UTF-8 바이트**로 보내면 「조리과」 9바이트가 깨진 문자 9개로 들어온다.
   * 거기엔 `%` 가 없으니 `decodeURIComponent` 는 **아무 일도 하지 않는다.**
   * 브라우저는 알아서 인코딩하지만 **curl · 일부 크롤러 · 손으로 쓴 링크**는 그냥 보낸다.
   * 백년지도는 한글 주소가 3,450장이라 색인에 그대로 걸린다.
   *
   * ⚠ 조건 둘을 **반드시 함께** 본다. `%` 가 있던 경로는 이미 제대로 된 문자열이라
   *   거기에 latin1 재해석을 하면 **멀쩡한 것이 깨진다.**
   * ⚠ 그리고 재해석 결과가 **올바른 UTF-8 일 때만** 받아들인다. 진짜 latin1 문자
   *   (é 같은 것)를 받으면 U+FFFD 가 생기는데, 그때는 원래 값을 그대로 둔다.
   */
  if (!pathname.includes('%') && 상위바이트.test(decoded)) {
    const 다시 = Buffer.from(decoded, 'latin1').toString('utf8');
    if (!다시.includes(대체문자)) decoded = 다시;
  }

  return decoded;
}
