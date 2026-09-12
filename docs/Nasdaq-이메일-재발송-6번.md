# Nasdaq Data Link — 이메일 재발송용 (2026-09-12 · 5번 상의 반영판)

> 사장님 지시: 「완전히 상품이 달라졌으니 나스닥에 이메일 다시 보내라」 → 「5번과 상의후 보내」
> 5번 회신(13:42, 세션간-메모.md 217693줄) 반영 — ① Broker Price-Target Accuracy 뺌(출처 미해결)
> ② RapidAPI 리스팅 이름 먼저 바꾼 뒤 링크 ③ `send-mail.mjs` 로 6번이 직접 admin@ 에서 보낸다

## 남은 순서

```
1. RapidAPI 리스팅 이름 변경 — 진행 중(브라우저)
2. 받는 주소 — 5번이 data.nasdaq.com/sell-data 에서 확인 중. 그때까지 발송 안 함
3. 주소 확정되면 아래 본문으로 send-mail.mjs --보낸다
```

## 데이터셋 6종(Broker Price-Target Accuracy 뺌) — 전부 오늘 라이브에서 다시 잰 수

```
1. Korea Financial Statements Tape   — 2,570 / 2,709 (94.9%), FY2025, CFS/OFS 분리
2. Korea Valuation Tape              — 2,709곳, PER 1,588 · PBR 2,556 · ROE 2,562
3. Korea Ownership Ledger            — 5%룰 신고 21,774건 + 임원/주요주주 기록
4. Korea People Panel                — 2,924곳, 성별 근속·급여, 시가총액 조인
5. Korea Mezzanine Book              — CB/BW/EB 5,084건, 조건·리픽싱·사모구분
6. Korea Index Tape                  — KRX 168지수, 영문명·구성종목수·기준일
```

## 본문 — 이대로 복사(주소만 채우면 됨)

```
Subject: SeoulMarkets — Korean market data feed, submission update (product scope has expanded)

Hello,

I'm writing to update an earlier data-partnership inquiry from SeoulMarkets
(operated by Beomjin Academy, Sejong, Republic of Korea). Since our last
message, the scope of what we can offer has grown substantially, and I'd
like to submit the current lineup rather than the single dataset we
originally proposed.

SeoulMarkets builds English-language datasets from Korean public filings
(DART, the Financial Supervisory Service; the Korean public data portal;
KRX). Everything below is live today, rebuilt on a schedule, and already
served through our own REST API.

What's live now (6 datasets):

1. Korea Financial Statements Tape
   Annual filings for 2,570 of 2,709 listed Korean companies (94.9%),
   consolidated and separate reported separately, FY2025.

2. Korea Valuation Tape
   PER, PBR, ROE and debt-to-equity for all 2,709 listed companies —
   1,588 with a computed PER, 2,556 with PBR, 2,562 with ROE. Every row
   carries the price date and fiscal year it was computed from.

3. Korea Ownership Ledger
   21,774 substantial-shareholding (5%-rule) filings, plus a companion
   officer/major-shareholder ownership file, English company names,
   filing-level granularity.

4. Korea People Panel
   Workforce data for 2,924 listed companies — headcount, tenure and
   annual pay per person, split by gender, joined to market cap. A column
   no other vendor we've found publishes for Korea.

5. Korea Mezzanine Book
   5,084 convertible bond, bond-with-warrant and exchangeable bond
   issuances, with strike terms, refix floors and placement type.

6. Korea Index Tape
   All 168 KRX indices — English names, constituent counts, base dates.

All six are delivered as versioned CSV/Parquet snapshots and through a
live REST API, already listed on RapidAPI:
https://rapidapi.com/parkintaek2/api/seoulmarkets-korea-market-data
(BASIC $0 / PRO $29 / ULTRA $99 / MEGA $399 per month).

We'd like to bring this catalog onto Nasdaq Data Link. Could you point us
to the current submission process, or let us know if a call would be more
useful given the larger scope?

Best,
Park In-taek
Beomjin Academy (SeoulMarkets)
159 Chunghyeon-ro, Jochiwon-eup, Sejong, Republic of Korea
admin@klifedesign.net
```

⚠ 위 RapidAPI 링크는 이름을 바꾼 «뒤» 주소로 다시 확인해서 넣는다 — 바꾸는 방식에 따라
슬러그(URL 끝부분)가 그대로일 수도, 바뀔 수도 있다. 보내기 직전에 한 번 더 클릭해서 200 인지 본다.

## 어떻게 보내나 — 이미 있는 도구로 6번이 직접

```bash
MAIL_FROM=admin@klifedesign.net node scripts/send-mail.mjs \
  --받는곳=<나스닥 창구 주소> \
  --제목="SeoulMarkets — Korean market data feed, submission update" \
  --글=docs/Nasdaq-이메일-본문-2026-09-12.txt \
  --보낸다
```

⛔ `--보내는곳=` 인자는 이 스크립트에서 «받아만 주고 실제로는 안 쓴다»(코드로 확인함,
617번째 줄 근처 편지만들기 호출에 안 실림) — `MAIL_FROM` 환경변수로 보내는 주소를 바꿔야
실제로 admin@ 에서 나간다. 이 자체가 작은 결함이라 따로 적어 둔다(급하지 않아 오늘은 안 고침).

## 검증 방법 — 이 이메일이 나가기 전 재확인할 수 있는 자리

```
/data/financials · /data/valuation · /data/ownership ·
/data/people · /data/mezzanine · /data/indices
```

— 6번(SeoulMarkets)
