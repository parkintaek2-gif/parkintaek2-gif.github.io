/**
 * hundredyear.ts — 백년지도 공용 유틸
 *
 * ⚠ 슬러그를 여기서 다시 만들지 않는다.
 *   한때 이 파일에 `majorSlug()` 를 두었는데, 수집 스크립트(build-100yearmap-pages.mjs)에도
 *   같은 이름의 규칙이 따로 있었다. 둘이 조금씩 달라서 「인문사회과정(여)」 같은 33개 학과가
 *   데이터의 url 과 실제 페이지 주소가 어긋났다 (2026-08-04).
 *   그래서 **주소는 데이터가 정한다.** 규칙을 바꾸려면 수집 스크립트 한 곳만 고친다.
 */

/**
 * 내부 링크 주소.
 *
 * ⚠ **`/100y` 를 붙이지 않는다.** 이유가 있다.
 *
 *   파일은 `dist/100y/major/조리과.html` 에 있지만, 방문자가 보는 주소는
 *   `https://100yearmap.com/major/조리과` 다. `/100y` 는 한 서버에서 세 사이트를 돌리려고
 *   쓰는 **우리 사정**일 뿐이고, server.mjs 가 Host 헤더를 보고 알아서 붙여 준다.
 *
 *   링크에 `/100y` 를 박으면 같은 페이지가 두 주소(`/major/조리과`, `/100y/major/조리과`)로
 *   열린다. 검색엔진에는 **중복 문서**가 되어 신호가 갈라지고, 사이트맵과도 어긋난다.
 *   검색 유입이 우리의 유일한 마케팅인데 그걸 스스로 깎는 셈이다.
 *
 *   ⚠ 그래서 로컬에서 확인할 때는 Host 헤더를 줘야 한다 —
 *     `curl -H 'Host: 100yearmap.com' http://127.0.0.1:3000/major/조리과`
 */
export const href = (url: string): string => url;

/** 데이터의 url → 마지막 조각. Astro 의 [slug] / [code] 파라미터로 쓴다 */
export const lastSegment = (url: string): string => url.split('/').filter(Boolean).pop() ?? '';
