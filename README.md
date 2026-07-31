# Seoul Markets

한국 금융시장 전반(증시·외환·채권·커머디티·거시) 데이터를 영문으로 발행하는 데이터저널리즘 사이트.
Astro 정적 사이트 — 클라이언트 JS 0바이트, 외부 폰트·CDN 없음, DB 없음, 관리자 화면 없음.

## 기사 발행 / 비공개

마크다운 파일을 넣으면 발행, 지우면 비공개. 그게 전부다.

```
content/articles/{slug}.md    ← 여기에 넣는다. 파일명이 곧 URL 이다.
```

`draft: true` 로 두면 사이트·RSS·사이트맵 어디에도 안 나온다.

## frontmatter

정의는 `src/content.config.ts`. **필드가 빠지면 빌드가 실패한다** — 출처 없는 기사를 막는 장치다.

```yaml
---
title: "제목"                    # 필수, 120자 이내
dek: "부제 한 줄"                 # 필수, 240자 이내
category: equities              # 필수 — equities | fx | rates | commodities | macro
pubDate: 2026-07-30             # 필수
dataAsOf: 2026-07-29T15:30:00+09:00   # 필수 — 데이터 기준시각 (T+1 이라 발행일과 다르다)
author: Markets Desk
tickers: ["005930"]
tags: ["foreign flows"]
sources:                        # 필수, 최소 1건
  - org: "Financial Services Commission (Republic of Korea)"
    api: "Stock Price Information Open API"
    url: "https://www.data.go.kr/data/15094808/openapi.do"
crossChecks: ["교차검증한 항목"]
excluded: ["확인 못 해 뺀 수치"]
updatedDate: 2026-07-31         # 선택
image: /og/foo.png              # 선택 — 없으면 기본 OG 카드
draft: false
---
```

본문은 6단 구조를 h2 로 쓴다 — 리드(제목 없음) / What the data shows / The mechanism /
Where this breaks / The evidence / The verdict.
h2 가 3개 이상이면 가운데에 광고 슬롯이 자동으로 끼워진다.

기사 하단의 **Data & Verification Notes** 와 투자자문 아님 고지는 frontmatter 에서
자동 생성된다. 기자가 빠뜨릴 수 없다.

## 명령어

```bash
npm run dev        # 로컬 개발서버 (광고 자리를 점선 박스로 보여준다)
npm run build      # dist/ 로 정적 빌드
npm run preview    # 빌드 결과 미리보기
npm run og         # 기본 OG 카드(1200×630 PNG) 재생성
npm run indexnow   # 빌드 후 Bing·Naver·Yandex 에 새 URL 통보
```

## 설정을 바꾸는 곳

`src/consts.ts` 한 파일이다 — 도메인, 사이트명, 발행 주체 정보, 카테고리, 광고 ID, 고지 문구.

## 문서

- `docs/작업지시서.md` — 원 요구사항
- `docs/데이터-출처-라이선스.md` — **쓸 수 있는 데이터와 못 쓰는 데이터.** 기사 쓰기 전 필독
- `docs/배포-가이드.md` — 도메인·Cloudflare Pages 연결
- `docs/검색등록-콘텐츠유통.md` — 검색엔진 등록 절차와 유통 채널

## 남은 일 (배포 전)

- `src/consts.ts` 의 `PUBLISHER` PLACEHOLDER → 실제 사업자 정보
- `content/articles/sample-*.md` 4건 삭제
