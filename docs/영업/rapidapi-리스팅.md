# RapidAPI 리스팅 — 붙여넣기용

작성 2026-08-01 · 계정 `parkintaek@gmail.com`
**대부분은 안 적어도 됩니다.** 아래 ①만 하면 엔드포인트·파라미터·예제가 자동으로 들어갑니다.

---

## ① 가장 먼저 — OpenAPI 명세 불러오기

```
Add New API  →  Import from OpenAPI / Swagger  →  URL 입력

https://seoulmarkets.com/v1/openapi.json
```

이것만으로 들어가는 것:

| 자동 입력 | 내용 |
|---|---|
| 엔드포인트 6개 | `/hs/{code}` · `/hs` · `/countries` · `/meta` · `/trade/flash` · `/trade/exports` |
| 파라미터·타입 | 코드 형식(2·4·6·10자리), 검색어 최소 길이 |
| 예제 값 | 8542(반도체) · 8507(배터리) · 8523(음반) |
| 응답 스키마 | 성공·오류 모두 |
| 태그 분류 | Classification · Trade · Meta |
| 설명 | 왜 이 데이터인지, 무엇을 안 하는지 |

**손으로 입력할 것은 아래 몇 칸뿐입니다.**

---

## ② 기본 정보

**API Name**
```
SeoulMarkets — Korea Trade & Market Data
```

**Category** — `Business` (없으면 `Finance` 또는 `Data`)

**Short description** (한 줄)
```
Korean customs, market and macro statistics, normalised to English. JSON, no XML, no Korean-only field names.
```

**Long description**
```
Korea publishes monthly trade figures the day after the month ends, and provisional figures
three times a month — on the 1st, 11th and 21st at 09:00 KST. Almost no country reports that
fast. Bloomberg counts Korean trade among its twelve key global economic indicators, because
Korea imports raw materials, processes them and re-exports, so a shift in world demand
registers here before almost anywhere else.

The headline number is reported everywhere. The product-level detail is reported nowhere.
The official Korean feed returns XML, product and country names are in Korean, and no English
classification is attached — using it requires a Korean-reading engineer. That is why no
vendor sells it.

This API is that missing layer.

WHAT IS LIVE NOW (free, no key)
  • Resolve any HS code (2/4/6/10 digits) to WCO standard English names
  • Search the classification in English — singular and plural both work
  • Partner country codes with English names

WHAT OPENS NEXT
  • Korea's 10-day provisional trade figures, by product
  • Exports and imports by HS code and partner country

WHAT WE WILL NOT DO
  • We do not guess. A code outside our dictionary returns null with resolved:false — never
    a plausible-sounding label. A data product that fabricates is worse than one with gaps,
    because you cannot tell which is which.
  • We do not return an empty array for a series we have not collected yet. It returns 503
    with a machine-readable reason, because "not collected" and "no trade occurred" are
    different answers.
  • Field names are part of the contract. Within v1 we add fields; we never remove or rename
    them. A breaking change ships as /v2.

The underlying statistics are published by Korean government agencies under an
unrestricted-use licence. We do not redistribute exchange feeds or licensed vendor data,
and we do not scrape.
```

---

## ③ 가격 (Plans)

**처음에는 무료 티어 하나만 엽니다.** 유료는 사용 실적을 보고 붙입니다 —
아무도 안 쓰는 API 에 가격표부터 붙이면 시도조차 안 합니다.

| 플랜 | 한도 | 가격 |
|---|---|---|
| **Basic** | 월 10,000 호출 | **$0** |

> 나중에 붙일 것 (지금은 만들지 않는다)
> Pro $29/월 100,000 · Ultra $199/월 1,000,000 · Mega 협의

---

## ④ 태그

```
korea, trade, customs, hs-code, economics, macro, exports, imports,
semiconductors, supply-chain, alternative-data
```

---

## ⑤ 등록 뒤 확인할 것

- [ ] `GET /hs/8542` 를 RapidAPI 콘솔에서 눌러 **200 과 실제 응답**이 나오는지
- [ ] 응답에 `resolved: true` 와 `label: "Electronic integrated circuits"` 가 있는지
- [ ] `GET /trade/flash` 가 **503** 과 `collection_not_started` 를 주는지
      (오류처럼 보이지만 **의도한 동작**이다. 리스팅 설명에 그렇게 적혀 있다)

---

## ⑥ 왜 지금 올리는가 — 팔 물건이 아직 적은데

**분류 엔드포인트만으로도 쓸모가 있다.** HS 코드를 영어로 푸는 것은 무역·물류·
전자상거래 하는 사람이 늘 필요로 하는 일이고, 무료다.

그리고 **지금 올려 두면 관세청 시계열이 열리는 날 이미 이용자가 있다.**
그날 처음 올리면 아무도 모른다. 마켓플레이스 검색 순위도 등록 기간이 쌓여야 오른다.

> 이건 아카이브와 같은 논리다 — **오늘 시작한 것과 반년 뒤 시작한 것은
> 반년 뒤에 반년만큼 차이가 난다.**

---

## ⑦ 나중에 — 다른 마켓플레이스

같은 `openapi.json` 하나로 아래도 된다. 지금은 하지 않는다(RapidAPI 실적을 먼저 본다).

| 마켓플레이스 | 걸림돌 |
|---|---|
| AWS Data Exchange | 유료 판매 시 **미국 은행계좌** 필요 |
| Snowflake Marketplace | 프로바이더 프로필 + trial 필수 |
| Databricks Marketplace | Delta Sharing 기반 |
