# SeoulMarkets Data API — Korean trade data, at product level, in English

*One-page proposal · August 2026 · K Life Design Co., Ltd.*

---

## The gap

Korea publishes its monthly trade balance **the day after the month ends**, and provisional
figures **three times a month** — on the 1st, 11th and 21st at 09:00 KST. Almost no country
reports that fast. UN Comtrade runs up to a month behind, and considerably further for many
reporters.

This is why **Bloomberg counts Korean trade among its twelve key global economic indicators**.
Korea imports raw materials, processes them and re-exports; a shift in world demand registers
here before it registers almost anywhere else.

**The headline number is reported everywhere. The product-level detail is reported nowhere.**

The Korean Customs Service publishes exports and imports by HS code and partner country, and
publishes them under an unrestricted-use licence. But the feed returns XML, product and country
names are in Korean, and no English classification is attached. Using it requires a Korean-reading
engineer, which is why no vendor sells it.

---

## What we provide

| | |
|---|---|
| **Coverage** | Exports and imports by HS code (2/4/6/10-digit) × partner country; 10-day provisional releases; monthly finals |
| **Normalisation** | HS codes resolved to WCO standard English names, not machine translation. Country codes to ISO 3166-1 names |
| **Latency** | Collected on the release schedule — 1st, 11th, 21st at 09:00 KST |
| **Format** | JSON over REST. No XML. Stable field names |
| **Revisions** | Provisional figures are kept alongside their revisions, not overwritten |
| **Provenance** | Every response names its source agency and dataset |

```
GET /v1/hs/8542
{
  "code": "8542",
  "chapterName": "Electrical machinery and equipment and parts thereof",
  "headingName": "Electronic integrated circuits",
  "source": { "agency": "World Customs Organization", "system": "Harmonized System" }
}
```

---

## What this answers that the headline number cannot

- Semiconductor exports **to the United States** versus **to China**, separately, ten days into the month
- Whether a fall in the export total is broad or concentrated in one product line
- Battery and battery-material flows (HS 8507, 2836) as a read on EV demand
- Petrochemical and steel volumes as a read on Chinese industrial activity
- Cosmetics and processed-food exports by destination — the consumer side of the Korean wave

---

## What we will not claim

We would rather lose a sale than lose a client in month two.

- **We do not guess.** An HS code outside our dictionary returns `null` for its description, with a
  note saying so. A data product that fabricates plausible labels is worse than one with gaps,
  because you cannot tell which is which.
- **We do not redistribute exchange or licensed vendor feeds**, and we do not scrape. Everything we
  serve comes from government releases that permit redistribution.
- **We do not sell real-time market prices.** Those carry accuracy liability we are not structured
  to underwrite. Our product is research-grade, not execution-grade, and it is priced accordingly.
- **The trade endpoints are not live yet.** Classification endpoints are; the series open when
  collection begins. The status of every dataset is published at `/v1/meta` — you can verify this
  claim before you talk to us.

---

## Why us

The API and a working newsroom run on the same pipeline. Every figure in a
[SeoulMarkets](https://seoulmarkets.com) article comes from these endpoints, which is why both stay
honest: a broken pipeline shows up as a wrong headline before it shows up as a wrong invoice.

We are a Korean-registered company reading Korean primary sources directly. There is no translation
layer between us and the agency.

---

## Commercial

| Tier | For | Terms |
|---|---|---|
| **Free** | Evaluation, academic, classification lookups | No key required for classification; generous call allowance on series |
| **Business** | Funds, research desks, fintech | Annual, by call volume and history depth |
| **Institutional** | Full archive, custom aggregations, warehouse delivery | Contract. Bulk export, Snowflake / S3 delivery, SLA on release-time collection |

Academic and non-commercial research access is free. We would rather be cited than paid by a
university.

---

**Contact** — sibcheongan@gmail.com
**Live now** — https://seoulmarkets.com/api
**Publisher** — K Life Design Co., Ltd., Sejong, Republic of Korea · Business registration 456-87-03384
