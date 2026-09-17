# 6번 세션 인수인계 (SeoulMarkets) — **2026-09-17 21시 갱신판**

> 갱신 **2026-09-17 21:0x KST** · 6번 → **2번**
> 사장님 지시(2026-09-17 20:41): 「역할 맞바꿈 — 2번=에스마켓」
> 5번 지시(20:48): 「6번→2번 인계 문서를 «지금 상태»로 갱신 — 8/5 이후 바뀐 것만, 마감 ASAP」
>
> ⚠ **이 문서는 8/5 원본을 갈아엎은 것이다.** 원본(8/5)에 있던 「오픈 전 10일」 시기의
> 내용(회원가입·결제 없음, 기사 15편, 재무제표 미수집 등)은 **전부 낡았다.** 아래가
> 지금(9/17 21시) 실제 상태다. 원본은 git 이력에 남아 있으니 필요하면 그때 것을 본다.
>
> 🔴 **먼저 `CLAUDE.md`(이 저장소 루트)를 처음부터 끝까지 읽는다.** 사고 이력·ctype 함정·
>   도메인 사고·klifemap 격리·업무시간·강령이 전부 거기 있다. **이 문서는 SeoulMarkets 고유
>   현재 상태만** 담는다 — 같은 규칙을 두 곳에 적지 않는다.

---

## Ⅰ. 지금 무엇을 파는가 — **8/5 와 완전히 다르다**

**8/5엔 무료 발행 매체였다. 지금은 값을 받는 사이트다** (사장님 지시 2026-09-1x).

```
무료   기사 139편 · /rankings(축 20개, 순위 20장+허브) · /data 지면 24장(신용등급·
       외국인보유·스크리너·컨센서스 등) · 지수 20종 · UAE/걸프 스크리너
유료   학술 $79(1회) · 데이터셋 1벌 $990/년 · 전부 $2,990/년 — PayPal 실결제(live)
회원   이메일·구글·게스트체크아웃 로그인. 비회원 구매도 된다(로그인 없이 바로 결제)
```

⚠ **8/5 문서의 「유료결제·회원가입 없음」은 틀렸다.** CLAUDE.md 「결제 없음·회원가입
없음 두 줄을 걷어냈다」절을 반드시 읽는다 — 되살리면 사장님 결정을 뒤집는 것이다.

---

## Ⅱ. 🔴 가장 중요한 사실 — **이 배포 하나가 사이트 셋을 같이 낸다**

`@parkintaek2/seoulmarkets:main` 스테이지의 `web` 앱 **하나**가 `server.mjs` 의 호스트별
라우팅으로 **SeoulMarkets·K Culture Wire·100yearmap 셋 다** 서비스한다.

```
seoulmarkets.com · www.seoulmarkets.com       → 금융(이 저장소가 다루는 것)
kculturewire.com · www.kculturewire.com       → 1번 몫(K컬처) — 같은 배포, 다른 콘텐츠
100yearmap.com · www.100yearmap.com           → 3번 몫(교육) → 5번 인수
```

⛔ **`ctype remove` 는 이 여섯 도메인 연결을 통째로 가져간다** (2026-09-14·09-17 두 번
실측 — 사이트 셋이 최대 1시간 내려갔다). 지우기 전에 반드시 `ctype routes` 로 여섯이
다 붙어 있는지 적어 둔다. 자세한 사고 이력은 `CLAUDE.md` 「같은 Cloudtype 계정에
KLifeMap」 절 아래에 있다.

✅ 배포 전후 습관화할 것 — **매번**:
```bash
ctype routes -t @parkintaek2/seoulmarkets:main   # apply 전에 한 번, 후에 한 번
```

---

## Ⅲ. 8/5 이후 새로 생긴 것 — **이번 인계의 핵심**

### 3-1. 결제·회원 (완전히 새 시스템)

```
PayPal Orders v2 (live) — /api/pay/order · /api/pay/capture
결제 뒤 확인 메일 — Gmail 서비스 계정(GOOGLE_SERVICE_ACCOUNT_JSON)으로 발송
회원 로그인 — 이메일·구글. 네이버 로그인은 **막혀 있다**(이 서버에서 네이버에 자체가
             안 닿는다 — www.naver.com 도 실패). 문을 내린 상태(정상)
다시 보기   /recover — 주문번호로 조회. 안 산 번호는 402
```
⚠ **매시 55분 결제 점검이 반드시 도는 채로 넘긴다** — 아래 Ⅴ절.

### 3-2. 재무제표 — 8/5엔 「가장 큰 구멍」이었다. 지금은 **2,709개사 확보**

```
src/data/korea-valuation-tape.json   2,709개사 · 시총·PER·PBR·ROE·재무 6종 정본
                                      build-korea-valuation-tape.mjs 가 낸다
```
8/5 문서가 말한 「우리는 사람만 있다」는 더 이상 사실이 아니다. 재무가 핵심 상품이다.

### 3-3. 🔴 우리가 매기는 신용등급 — `/data/company-credit` (사장님 2026-09-15 지시)

```
방법론    src/lib/smarkets-grade.mjs — SM1(강함)~SM9(약함) · NR(못 잼)
          여섯 축(이자보상배율·차입금/자산·부채/자본·유동비율·ROA·알트만Z), 공개 가중치
등급 받은 곳   2,415 / 2,709 개사 (89.1%). 부족(4축 미만)이면 NR — 낮은 등급 아님
⛔ 축을 더하거나 가중치를 바꾸려면 **판(version, 지금 2026-09-15)을 올리고** 지면에
   무엇을 왜 바꿨는지 적는다. 조용히 바꾸면 어제 등급과 오늘 등급이 다른 자가 낸 것이 된다
```
오늘(9/17) 이 자료로 기사 한 편을 냈다 — `korea-power-utility-weak-balance-sheet-grade`
(한국전력 SM8). **회사·명단 하나를 다룰 땐 「이것은 신용평가사 등급이 아니다」를
반드시 본문에 명시한다** — 안 하면 오해를 산다(정치적으로 민감한 회사일수록 더 그렇다).

### 3-4. UAE·걸프 데이터 — `/data/screener`(Asia & Gulf 겸용)·`/data/company-credit` 겸용

```
src/data/uae-financials-tape.json    398행(자본 선 곳 260) — ADX·DFM 상장사 재무
scripts/collect-uae-adx-marketwatch.mjs   시가총액·시세 — **매일 1회 필수**
   🔴 [2026-09-16] 예전엔 시총 0/76 이었다 — «-delayed» 옆문(scrollingTicker)만 불렀던
     탓이다. marketwatch 엔드포인트로 128/128 나온다. 계산으로 메꾸지 않는다(검산 오차 큼)
scripts/collect-uae-adx-disclosures.mjs   공시 8종 — **지배권변경·CEO변경 태그가 아직
     없다.** 한국(collect-dart-breaking.mjs)엔 있다. 새 나라 열 때 반드시 넣는다(CLAUDE.md
     「주력과 서비스」절 참조 — 사람 축은 서비스일 뿐, 공시(사건)가 상품이다)
scripts/collect-uae-cbuae-eibor.mjs       금리곡선 — 매일
```

### 3-5. 「누가 한국 증권을 들고 있나」 — `/data/foreign-holdings` (IMF PIP, 2026-09-17 신설)

```
scripts/collect-imf-pip-mirror.mjs   거울(mirror) 방식 — 리포터국들이 COUNTERPART_
     COUNTRY=KOR 로 신고한 자산을 합산(한국은 부채를 직접 안 걷는다, CPIS 구조상)
75개국 · 2024 합계 $636.2B(하한선 — 중국 등 미보고국 제외, 0 아님)
⚠ 처음엔 리포터=KOR·자산(A) 로 받아 방향이 반대였다(「한국이 해외에 든 것」) — 정정함.
  오전 자산(A) 데이터(collect-imf-pip.mjs, KOR·JPN·IND·CHN·SAU)는 다른 쓸모가 있어 남김
오늘(9/17) 후속 기사 — `korea-foreign-securities-holdings-fell-2024`
     (73개국 공통표본 YoY −12.7%, 미국 최대 감소)
```

### 3-6. `/rankings` — 재무 축 신설 + 독립 지면 셋 (사장님 지시, 2026-09-17 완료)

```
축 다섬 추가: 시총 · PBR · ROE · 이자보상배율 · 차입금/자본 (기존 15축은 대부분 «사람» 축
   이었다 — CLAUDE.md 「주력과 서비스」 위반이라 5번이 잡았다)
독립 지면 셋: /rankings/market-cap · /rankings/pbr · /rankings/interest-cover
   컴포넌트 src/components/AxisRankingPage.astro (props: axisId·path·h1·intro·faq·
   trust·fmt) — 새 축 지면을 뗄 땐 이것을 재사용한다, 복붙하지 않는다
데이터 산출처: scripts/build-rankings-json.mjs → src/data/rankings.json (유일한 산출처.
   값을 다른 곳에서 다시 계산하지 않는다)
```

### 3-7. OECD CLI — **자료만 있고 지면이 없다** (열린 항목)

```
archive/raw/oecd-cli/         scripts/collect-oecd-cli.mjs 로 오늘 수집만 끝냄
⬜ 아직 기사도 지면도 없다. 다음에 손댈 사람 몫으로 남겨 둔다.
```

---

## Ⅳ. 🔴 매일 도는 수집기 — **소급 안 되는 것에 🔴**

`node scripts/check-archive-freshness.mjs` 가 기계로 잰다. 세션이 깨어날 때마다 이것부터
돌려서 빨간불이 있으면 그 자리에서 해당 수집기를 돌린다. **예약(cron)이 대신 돌려주지
않는다** — 이 저장소의 cron 은 전부 「깨어나서 확인하라」는 알림이지, 수집기 자체를
부르는 OS 크론이 아니다. 세션이 죽어 있으면 그날치는 아무도 안 받는다.

| 무엇 | 명령 | 소급 | 참는 선 |
|---|---|---|---:|
| 🔴 **증권사 직접수집(18:40)** | `collect-broker-direct.mjs` | **안 됨** — 그 시각 리스트가 다음 페이지로 밀린다 | 1일 |
| 주식시세 | `collect:stocks` | 됨(날짜 인자) | 3거래일 |
| 채권시세 | `collect:bonds` | 됨 | 3거래일 |
| 파생상품시세 | `collect:derivatives` | 됨 | — |
| 지수시세 | `collect:indices` | 됨 | — |
| 증권상품시세 | `collect:products` | 됨 | — |
| 일반상품(금·석유) | `collect:commodities` | 됨 | — |
| 펀드기본정보 | `collect:funds` | 됨 | — |
| 🔴 **한경컨센서스(목표주가·잠정치)** | `collect-seoulmarkets-hankyung-consensus.mjs` | **안 됨** — 창이 30일이라 한 달 지나면 그날치는 영영 없다 | 1거래일 |
| 🔴 **애널리스트 순위** | `collect-seoulmarkets-hankyung-analysts.mjs` | **안 됨** — 「오늘 시점 최근 1개월」만 준다, 매일 스냅숏 쌓아야 이력이 남는다 | — |
| UAE ADX 시가총액·시세 | `collect-uae-adx-marketwatch.mjs` | **안 됨**(그날 값은 그날만) | — |
| UAE 공시 | `collect-uae-adx-disclosures.mjs` | 대체로 됨 | — |
| 일본 국채 금리곡선 | `collect-jgb-yields.mjs` | 됨 | — |
| DART 회사목록 | `collect-dart.mjs --corpcode` | 주 1회로 충분(소급 개념 아님) | — |

⚠ **채권에서 18일, 일반상품에서 49거래일치가 조용히 빠진 적이 있다** (수집기는 붙었는데
한 번도 안 돌린 채 방치). **감시(check-archive-freshness)에 올라 있어야 「도는 것」이다.**
자를 만든 것과 도는 것은 다르다.

---

## Ⅴ. 🔴 넘겨야 할 상시 의무 — **세션이 죽으면 다 같이 죽는다**

### 5-1. 이 세션(6번)이 들고 있는 예약(cron) — **세션 메모리에만 있다, 그대로 안 넘어간다**

```
매시 55분     SeoulMarkets 결제 점검 — 「매출0」이면 그 자리에서 진단·고침·배포
매일 09:02    아침 업무보고
매일 21:02    저녁 업무보고
2시간마다(:23)  자동 이어가기 — 인계-현재상태·세션간-메모 꼬리 확인
08:37·17:37   API 승인 확인
```
✅ **2번 세션에서 CronCreate 로 위 다섯을 다시 건다.** 넘겨받은 즉시 거는 것이 먼저다 —
안 걸면 다음 정각에 아무도 결제를 점검하지 않는다.

### 5-2. 매시 정각 — 5번과의 소통 (사장님 지시 2026-09-15)

```
node scripts/매시소통-자물쇠.mjs --적는다 --누구 2번 --한말 "..."
```
「이번 시간에 소통 없음」이면 **배포가 잠긴다.** 정각을 피해서 적는다(정각은 이 소통 자리).

### 5-3. 손님길 세 징검다리 — SeoulMarkets·KLifeMap 30분 교대

```
node scripts/손님길-자물쇠.mjs --잰다 --사이트 seoulmarkets --누구 2번
```
차례표(:30 마다, 07:30~20:30 업무시간대)를 어기지 않는다 — 정각과 겹치지 않게 설계됐다.

### 5-4. 결제 점검이 «매출 0」을 보이면

`check-seoulmarkets-payment.mjs` 는 **주문 생성까지만** 한다(capture 는 안 부른다 — 돈이
오가는 자리라서다). 매출 0 을 보면:
1. Cloudtype 콘솔에서 `GOOGLE_SERVICE_ACCOUNT_JSON`·`PAYPAL_*` 시크릿이 실제로 있는지
   `ctype stage secret` 로 확인한다(콘솔 UI 와 CLI 저장소가 다를 수 있다는 미확인 가설이
   있다 — 09-17 사고 메모 참조)
2. `PAYPAL_MODE` 를 절대 건드리지 않는다(live 사고 방지)
3. 배포 직후라면 롤백보다 원인(대개 누락된 secret) 을 먼저 본다

---

## Ⅵ. 저장소 경계 — 8/5 와 큰 틀은 같다, 늘어난 것만 추가

### 6-1. 당신(2번) 것 — SeoulMarkets 전부

```
content/articles/**                     src/pages/*.astro (wikitip·100y 밖)
src/pages/data/**                       src/pages/rankings/**
src/components/{AxisRankingPage,ProductRail,BuyBar}.astro 등 SeoulMarkets 전용 컴포넌트
scripts/collect-{stock,bond,fund,derivative,index,product,commodity,broker,
    tenure,executive,company,issuance,kdi,uae-*,imf-*,jgb-*,dart-*}*.mjs
scripts/{build-rankings-json,build-korea-valuation-tape,build-foreign-holdings-page,
    check-seoulmarkets-payment,손님길-자물쇠}.mjs
src/lib/{issuance,traffic,store,kdi,subscribe,smarkets-grade,gmail-send}.mjs
archive/raw/{stocks,bonds,indices,derivatives,products,commodities,broker,
    dart-*,funds,uae-*,imf-pip*,oecd-cli,research*}/  (전부 .gitignore — 커밋 안 됨)
src/data/*.json  (빌드가 읽는 «작은 자료» — 커밋됨. archive/ 원본을 여기로 줄여 낸다)
docs/데이터-출처-라이선스.md · docs/투자AI-설계.md
```

### 6-2. 🔴 공용 — 고치기 전에 메모로 알린다

```
server.mjs (세 사이트 라우팅) · package.json(scripts) · src/consts.ts ·
docs/세션간-메모.md(붙이기만) · .cloudtype/app.yaml (시크릿 참조 — 지우면 배포가 죽는다)
```

### 6-3. 남의 것

```
1번(KCW)     src/pages/wikitip/** · src/layouts/WikiTip.astro · scripts/collect-{riot,
             netflix,star,kcw-*}* · archive/raw/{riot-ladder,netflix-top10,star-pageviews,
             wikitip,kcw-*}/
5번(100y)    src/pages/100y/** · src/layouts/HundredYear.astro · scripts/*100y* ·
             archive/raw/{alimi,kess,neis,univ,100y-*}/  (3번에서 5번으로 인계 완료)
```

---

## Ⅶ. 배포

```bash
git pull --rebase origin main      # 공유 작업트리 — 다른 세션 WIP 파일은 stash -u 로 비켜 둔다
git push origin main && git push site main
ctype apply -f .cloudtype/app.yaml -t @parkintaek2/seoulmarkets:main   # 반드시 이 폴더에서
ctype routes -t @parkintaek2/seoulmarkets:main    # 여섯 도메인 확인 (apply 전후 둘 다)
npm run indexnow                                    # 발행 뒤 검색엔진에 알린다
```
배포 반영은 **눈으로** 확인한다(curl 200 + 브라우저 렌더). `npm run build` 를 로컬에서
먼저 돌려 `npm test` 전체가 초록인지 보고 올린다.

---

## Ⅷ. 지금 열려 있는 것 (인계 시점 기준)

```
⬜ OECD CLI — 자료만 있고 지면 없음 (Ⅲ-7)
⬜ 이직률 조인 — 열쇠(사업자번호)가 6자리로 잘려 있어 정확도 확보 못함, 9월 말 재판단 보류 중
⬜ 증자 희석 기사 — 같은 회사 내 비교로 다시 재야 함(회사 구성 차이와 못 갈랐다)
⬜ 순방문자 — 27.7명/일(9/17 GA4 7일평균), 목표(유닛당 1,000명/일)의 3%. 콘텐츠는
   찼지만 유입이 핵심 과제
```

**막히면 5번에게 먼저 묻는다.** 사장님 손이 필요한 항목은 `docs/사장님-손.md` 를 먼저
본다 — 답이 이미 있을 수 있다.
