# RapidAPI 등록 — **붙여 넣기만 하시면 됩니다**

> 사장님 결정(2026-08-03 KST): 「RapidAPI: 유료화/등록 해」

**제가 못 하는 것은 두 가지뿐입니다 — 계정 만들기와 결제 정보 입력.**
그 둘은 제가 하지 않는 일이라 사장님이 하셔야 합니다. **나머지는 다 만들어 놨습니다.**

---

## 0. 먼저 — 코드는 이미 준비됐습니다

RapidAPI 에 올려도 **구매자가 seoulmarkets.com 을 직접 부르면 그만**입니다.
그러면 아무도 돈을 안 냅니다. 그걸 막는 장치를 오늘 넣었습니다.

```
✅ X-RapidAPI-Proxy-Secret 확인      RapidAPI 를 거친 요청만 pro 가 된다
✅ 무료 한도 1회 200건 · 분당 60회    유료(1,000건)와 값이 갈리는 지점
✅ 시행일 2026-08-17                 오늘은 헤더로 알려만 주고 막지 않는다
✅ /v1/meta 에 공지 게시              시행 전에 먼저 알린다는 약속을 지킨다
```

⚠ **비밀값은 저장소에 없습니다.** 공개 저장소라 넣으면 안 됩니다.
RapidAPI 가 발급한 값을 **Cloudtype 환경변수 `RAPIDAPI_PROXY_SECRET`** 에 넣습니다(3단계).
**넣기 전까지는 아무도 pro 가 되지 않습니다** — 기본이 닫힘입니다.

---

## 1. 계정 (사장님)

```
https://rapidapi.com/  →  Sign Up
Provider Dashboard  →  Add New API
```

「Import from OpenAPI」를 고르고 아래 주소를 넣으면 **엔드포인트·파라미터·응답이 자동으로 들어갑니다.**

```
https://seoulmarkets.com/v1/openapi.json
```

손으로 입력할 것이 없습니다. 그러라고 명세를 만들어 뒀습니다.

---

## 2. 리스팅 문안 — 그대로 붙여 넣으시면 됩니다

### API Name
```
SeoulMarkets — Korean Broker Ratings & Trade Data
```

### Short description (한 줄)
```
Twenty years of Korean brokerage target prices and investment ratings, normalised to English. 66,000+ records. Nothing else serves this series outside Korean.
```

### Long description
```
Korean brokerages publish tens of thousands of company reports a year — in Korean,
under firm names that change every few years, using twenty-two different spellings
of eight actual rating levels. This API is that record, cleaned up and in English.

WHAT YOU GET
  • Every target price and investment rating we have collected, Dec 2007 to today
  • 66,000+ records across 44 research houses and 2,780+ listed companies
  • Three normalisations included with every record:
      brokerEntity  — stable id per legal entity, so renames don't split a firm's history
      ratingNormalised — 22 source spellings folded into 8 levels, stance and score
      subjectEn — the company's own English spelling (SK hynix, NCSOFT, AMOREPACIFIC)
  • Reference dictionaries: HS codes, partner countries, Korean research institutions

WHAT MAKES IT UNUSUAL
  One number shows what the data is for: of 55,000+ rated reports,
  94.1% are positive and 0.16% negative — 89 negative calls in twenty years.
  That is a count, not an opinion.

HONEST LIMITS — read these before you build
  • Coverage is uneven by house. Several large desks are under-represented because
    our aggregation source does not carry their institutional research. Per-house
    counts are exposed so you can see exactly where the gaps are.
  • The archive is sparse before 2014.
  • targetPrice is null for ~4,000 records issued by credit-rating and IR bodies,
    which never publish one. brokerType tells you which is which.
  • Analyst names are not available from this source and return null. We do not
    fill a gap with a value we do not have.

WHAT WE DO NOT DO
  We collect facts, not documents. Report text, tables, charts and PDFs are never
  retrieved, so nothing copyrighted is redistributed. If you need the reports
  themselves, we cannot sell them and will say so rather than take the order.

Every response carries as_of and source. Field names are a contract: within v1 we
add fields, never remove or rename them.
```

### Category
```
Finance
```

### Tags
```
korea, stocks, equity-research, analyst-ratings, target-price, korean-market,
emerging-markets, financial-data, kospi, kosdaq
```

---

## 3. 가격 (Pricing Plans)

**⚠ 이 값은 시장 검증 전 가설입니다.** `docs/사업전략-데이터제공업.md` 의 티어와 맞췄습니다.
**RapidAPI 는 가격을 나중에 올릴 수 있습니다.** 처음엔 낮게 잡고 쓰는 사람을 모읍니다 —
데이터 상품에서 첫 고객 수가 곧 영업 자료입니다.

| Plan | 월 요금 | 월 호출 | 초과 | 무엇이 다른가 |
|---|---|---|---|---|
| **Basic** | **$0** | 500 | 차단 | 1회 200건. 붙여 보고 판단하기에 충분 |
| **Pro** | **$29** | 20,000 | $0.002/call | **1회 1,000건.** 전체 아카이브를 67번에 받는다 |
| **Ultra** | **$99** | 150,000 | $0.001/call | 백테스트·일일 동기화 규모 |
| **Mega** | **$399** | 1,000,000 | $0.0005/call | 재판매·다중 서비스 |

> **Basic 이 왜 500 호출인가** — 우리 사이트에서 직접 부르면 여전히 무료입니다.
> RapidAPI 무료 플랜은 「구매 전 시험」 용도이고, 진짜 무료 이용은 seoulmarkets.com 쪽입니다.
> 이 점을 리스팅 설명에도 적어 둡니다. **숨기면 나중에 나쁜 평이 됩니다.**

### 각 플랜의 Rate limit (RapidAPI 화면에서 설정)
```
Basic   10 requests / minute
Pro     120 requests / minute
Ultra   600 requests / minute
Mega    1200 requests / minute
```

---

## 4. 비밀값 넣기 (등록 뒤 **반드시**)

RapidAPI 가 API 마다 **Proxy Secret** 을 발급합니다.
`Provider Dashboard → 우리 API → Settings → Security` 에 있습니다.

그 값을 Cloudtype 에 넣습니다.

```bash
ctype stage secret RAPIDAPI_PROXY_SECRET '<발급받은 값>' -t @parkintaek2/seoulmarkets:main
```

그리고 `.cloudtype/app.yaml` 의 `options.env` 에 **이름만** 추가합니다(값은 절대 넣지 않습니다).

```yaml
- name: RAPIDAPI_PROXY_SECRET
  secret: RAPIDAPI_PROXY_SECRET
```

⚠ **이걸 안 넣으면 유료 플랜을 사도 무료와 똑같이 200건만 나갑니다.**
   구매자가 곧바로 환불을 요구할 자리입니다. **등록 당일에 반드시 합니다.**

### 넣은 뒤 확인
```bash
curl -s -D- -o/dev/null "https://seoulmarkets.com/v1/research?limit=1000" \
  -H "X-RapidAPI-Proxy-Secret: <값>" | grep -i "x-tier"
# X-Tier: pro  가 나와야 한다. free 면 값이 안 붙은 것이다
```

---

## 5. 올린 뒤 — 제가 할 일

```
⬜ 첫 구독자가 붙으면 사용 패턴을 본다 (어느 엔드포인트를 얼마나 부르나)
⬜ 그 데이터가 다음 가격 결정의 근거다. 지금 가격은 가설이다
⬜ 리뷰가 달리면 답한다. 데이터 상품은 리뷰 하나가 오래 남는다
⬜ AWS Data Exchange · Snowflake Marketplace 도 같은 명세로 올린다
```

---

## 6. ⚠ 알고 올리는 위험 — 숨기지 않습니다

```
리서치 데이터의 수집 경로(네이버 금융)는 robots.txt 상 User-agent:* 가 Disallow:/ 다.
사장님 판단으로 「사실만 가져오고 가공정보는 안 쓴다」로 정리했고 코드도 그렇게 고쳤다.
다만 사는 쪽 법무는 출처를 본다. 증권사 직접 수령이 성사되면 이 위험이 사라진다.
  → docs/데이터-출처-라이선스.md 「네이버 금융 경로」
  → docs/리서치-직접수령-아웃리치.md
```

**분류 사전(HS·국가)과 무역 데이터는 이 위험이 전혀 없습니다** — 정부가 무제한 이용으로 공개한 것입니다.
문제가 생기면 리서치만 내리고 나머지는 계속 팔 수 있게 엔드포인트가 갈려 있습니다.
