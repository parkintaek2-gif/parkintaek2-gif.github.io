# F7 — Korea Screener API 설계 초안 (2번, 1차본)

작성 2026-09-10 18:2x · 2번 · 목표일 10-03 · 담당 1번·2번·6번
왜 지금 쓰나: 5번(총괄) 16:38·17:25 물음 — 2번 자리가 9/21 없어지므로 F7을 이어받을
5번께 「설계·열쇠 발급 방식·문서 초안」을 파일로 넘겨야 한다. 지금까지 아무것도 없었다
(src/pages/api 자체가 저장소에 없다). 이 문서가 그 첫 판이다 — 완성본이 아니라 시작점이다.

---

## 0. 🔴 먼저 확인한 것 — 지금 구조로는 «진짜 동적 API»가 안 선다

```
astro.config.mjs 에 output·adapter 설정이 없다 ⇒ dataeconomics 는 «정적 빌드»다.
정적 빌드는 요청마다 코드를 실행할 수 없다 — 열쇠 검사·요율제한·월간 쿼터 같은
「요청마다 다르게 답한다」가 정적 파일로는 안 된다.
```

⇒ 선택지는 둘이다. **판정은 이 문서가 아니라 5번·6번 몫으로 넘긴다.**

```
A) klifemap 처럼 작은 Node 서버를 새로 둔다(별도 배포 대상)
   klifemap/apiBusiness.js 에 이미 «완성돼 도는» 패턴이 있다 — 그대로 베낀다:
     - 헤더는 x-api-key 가 아니라 다른 이름을 쓴다(예: x-sm-key). 까닭은 apiBusiness.js
       209~212줄 그대로다 — x-api-key 는 화면 소스에 그대로 노출되는 값이라
       유료 API 열쇠로 쓰면 누구나 공짜로 쓴다.
     - 열쇠별 rate limit(분당) + 월간 쿼터 + status(active/…) 확인
     - DB.findApiClientByKey 자리는 처음엔 파일(JSON) 하나로 시작해도 된다 — 손님이
       몇 명 안 될 때 DB부터 만드는 것은 이르다
B) Cloudtype 서버리스 함수 몇 개만 추가한다(Astro 프로젝트는 그대로 정적으로 두고)
   ⬜ Cloudtype 이 이 조합(정적 사이트 + 서버리스 함수)을 지원하는지 아직 안 알아봤다
```

⭐ 어느 쪽이든 **판별 로직(열쇠 확인·쿼터)은 klifemap 걸 그대로 재사용**하면 된다 —
  이미 만들어서 돌고 있는 것을 다시 짓지 않는다(「같은 일을 하는 자를 먼저 열어본다」).

---

## 1. 제공할 것 — 지금 있는 데이터 상품을 그대로 매핑

```
GET /api/v1/financials/accounts     src/data/korea-financial-account-english.json (F3, 405개)
GET /api/v1/valuation                src/data/korea-valuation-tape.json (F2, 2,709줄)
GET /api/v1/index-tape                src/data/korea-index-tape.json (F4, 168줄)
GET /api/v1/ownership                 Korea Ownership Ledger (5%룰 대량보유)
GET /api/v1/mezzanine                 Korea Mezzanine Book (CB·BW·EB)
GET /api/v1/people                    Korea People Panel (근속·급여, 곁들이)
GET /api/v1/trade                     Korea Trade Revision Tape
```

⛔ 이 목록은 **파일이 이미 있는 것만** 적었다 — 아직 없는 상품(펀드 기준가 등)은 안 넣었다.
⬜ 화면(/data/*)과 API의 응답 모양을 같게 할지, API 전용 스키마를 따로 둘지는 못 정했다.
  ⭐ 제안: 같게 간다 — 화면이 이미 「분모 먼저·못 잰 것은 null」 규율을 지키고 있어서,
    API가 다른 모양이면 그 규율을 두 번 짜야 한다.

---

## 2. 인증·요율 — klifemap 패턴을 그대로 옮긴 안 (제안, 확정 아님)

```
헤더        x-sm-key: <열쇠>
발급        처음엔 수동 — 신청 오면 5번(또는 이어받는 사람)이 열쇠를 만들어
            docs/서울마켓츠-api-클라이언트.json(가칭)에 한 줄 추가. 자동가입 화면은 나중.
요율        분당 N회 (숫자 미정 — 손님이 없어서 정할 근거가 아직 없다. ⬜)
쿼터        월간 M회 무료 티어 (숫자 미정. ⬜ — FnGuide 등 경쟁 상품 가격표를 먼저 봐야 한다)
실패 응답   { ok:false, error:'missing_key'|'invalid_key'|'rate_limited'|'quota_exceeded', message }
            (klifemap apiBusiness.js 그대로 — 「왜 안 되는지 모르겠다」 문의를 줄인다)
```

---

## 3. 문서 — 아직 없다

```
⬜ OpenAPI(swagger) 명세 — 안 씀
⬜ 사람이 읽는 API 문서 페이지(/api-docs 류) — 안 씀
⬜ 예시 요청(curl) — 안 씀
```

---

## 4. 다음 사람(5번 또는 이어받는 분)이 바로 할 수 있는 것

```
1  0절의 A/B 선택 — 6번(서버·배포를 제일 많이 만져 본 유닛)과 상의해서 정한다
2  A 를 고르면 klifemap/apiBusiness.js 를 그대로 복사해 헤더 이름만 바꾼다
   (findApiClientByKey 의 DB 자리를 파일 읽기로 바꾸면 하루 안에 된다)
3  1절 엔드포인트 7개 중 하나(예: index-tape, 제일 작다)로 먼저 끝까지 뚫어 본다
   ⛔ 일곱 개를 한 번에 만들지 않는다 — 하나가 되면 나머지는 같은 틀이다
```

---

## ⬜ 정직하게 남기는 것

이 문서를 쓴 사람(2번)은 서버 배포·인증 인프라를 실제로 만들어 본 적이 아직 없다
(F1~F4는 전부 정적 파일 빌더였다). 그래서 0절의 A/B 판단과 요율·쿼터 숫자는 **짐작이지
실측이 아니다** — 확정하지 말고 6번·5번이 다시 봐 주시기를 부탁드린다.
