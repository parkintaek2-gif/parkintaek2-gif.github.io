# SeoulMarkets

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

## 기사 안 차트

이미지 파일을 쓰지 않는다. **마크다운 안에 인라인 SVG를 직접 넣는다.**
외부 요청 0개, 자바스크립트 0바이트, 다크모드 자동 대응, 확대해도 안 깨진다.

```html
<figure class="chart">
<p class="chart__title">차트가 말하려는 한 문장</p>
<p class="chart__sub">단위와 기간</p>
<ul class="chart__legend">   <!-- 계열이 2개 이상이면 필수 -->
  <li><span class="chart__key" style="background:var(--c1)"></span>계열 이름</li>
</ul>
<svg viewBox="0 0 640 220" role="img" aria-label="차트가 보여주는 내용을 문장으로">
  ...
</svg>
<figcaption>출처와 기준시각</figcaption>
</figure>
```

색은 반드시 아래 변수만 쓴다. 이 사이트의 실제 배경색에 대해 명도대역·채도·
색각이상 분리·명암비를 검증해서 고른 값이다. **임의로 다른 색을 넣지 말 것.**

| 변수 | 용도 |
|---|---|
| `--c1` | 계열 1 (파랑) · 발산형 양(+)극 |
| `--c2` | 계열 2 (주황) |
| `--c-neg` | 발산형 음(−)극 (빨강) |
| `--c-mute` | 강조 차트에서 뒤로 물리는 회색 |
| `--c-grid` / `--c-axis` | 격자선 / 축 (`class="grid"`, `class="axis"`) |

지켜야 할 것 몇 가지 —

- **축을 두 개 쓰지 않는다.** 단위가 다른 두 지표는 공통 기준(=100)으로 지수화해서
  한 축에 올린다. (외환 기사 차트가 그 예다)
- 계열이 2개 이상이면 범례를 넣는다. 색만으로 구분시키지 않는다.
- 값 라벨은 **선별해서만** — 끝점, 극값, 이야기의 주인공에만. 모든 점에 숫자를 붙이지 않는다.
- 축·눈금·라벨 글자에는 계열 색을 입히지 않는다(`class="v"` 또는 기본 회색을 쓴다).
- `aria-label`에 차트가 보여주는 바를 문장으로 적는다. 스크린리더에는 이게 전부다.

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
