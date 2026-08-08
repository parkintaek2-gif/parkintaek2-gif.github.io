# SeoulMarkets 업종체계 (전사 표준) — v1

> 사장님 지시(2026-08-08): 「SeoulMarkets 업종체계가 완성되면 **우리는 모두 이 체계를 사용한다.**」
> 기업·상장사를 업종으로 가르는 모든 세션은 이 체계를 표준으로 쓴다. 정본 데이터: `src/data/seoulmarkets-sectors.json`.
> ⛔ GICS(S&P·MSCI 독점)의 데이터·상표는 쓰지 않는다. 11 대분류는 **국제 통용 개념**이고, 우리는 그 개념만 차용해 **공공 KSIC(통계청 표준산업분류)에서 우리가 유도**했다 — 비용 0·재배포 자유.

## 11 대분류
| 코드 | 대분류 | 뜻 |
|---|---|---|
| 1 | Energy | 정유·석유 |
| 2 | Materials | 화학·금속·비금속·펄프·고무플라스틱·목재 |
| 3 | Industrials | 기계·전기장비·건설·운송·조선·전문서비스·환경 |
| 4 | Consumer Discretionary | 자동차·의류·유통·외식·교육·여가 |
| 5 | Consumer Staples | 식품·음료·농수산 |
| 6 | Health Care | 제약·의료기기·바이오 R&D |
| 7 | Financials | 은행·증권·보험·금융지원 |
| 8 | Information Technology | 반도체·전자·통신장비·소프트웨어 |
| 9 | Communication Services | 게임·미디어·방송·통신·포털·출판 |
| 10 | Utilities | 전기·가스 |
| 11 | Real Estate | 부동산 |

## 어떻게 붙이나 (사용법)
1. 기업의 KSIC 2자리 division 영문 라벨(예: "Electronics and telecom equipment")을 키로,
2. `seoulmarkets-sectors.json` 의 `map[라벨].sector` 를 읽으면 11 대분류가 나온다.
3. 매핑에 없으면 `Unclassified`.

```js
const { map } = JSON.parse(fs.readFileSync('src/data/seoulmarkets-sectors.json', 'utf8'));
const sector = map[ksicLabel]?.sector ?? 'Unclassified';
```
참고 구현: `scripts/build-sector-panel.mjs`.

## ⚠ 정직하게 — 근사 매핑이다 (종목 단위로 갈라야 하는 곳)
KSIC division 과 11 대분류는 1:1 이 아니다. 아래는 division 하나에 두 대분류가 섞인다:
- **Publishing** → 게임 퍼블리셔(엔씨·넷마블)는 Communication Services, 도서출판과 혼재
- **Information services** → 포털(네이버·카카오)은 Communication Services, 데이터처리는 IT
- **Research and development** → 바이오텍(Health Care)과 비바이오 혼재
- **Medical and optical instruments** → 의료기기(Health Care)와 광학(IT) 혼재

→ 이 넷은 종목 단위 확인이 필요하다. 각 라벨의 `note` 를 볼 것.

## 버전
- **v1 (2026-08-08)** — KSIC 62라벨 → 11 대분류. 상장사 2,862개 중 시총 2,644개 매핑.
- 갱신 시 이 문서와 `seoulmarkets-sectors.json` 을 함께 올리고 버전을 올린다. 전 세션이 같은 버전을 쓴다.

## 전 세션 채택
사장님 지시로 **회사 표준**이다. 기업/업종을 다루는 세션(5번·3번 등)은 자체 업종 라벨을 이 11 대분류에 맞춰 붙인다. 문의는 6번(SeoulMarkets).
