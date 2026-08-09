# Nasdaq Data Link 제출안 — 데이터셋 하나 (사장님 71722 · 2026 첫 결제 창구)

> 계정 로그인만 열리면 **이걸 그대로 붙여** 등록 신청한다. 개인 등록 가능(사업자 불필요 ●).

## 올릴 데이터셋 (하나) — Korean Broker Target-Price Accuracy
```
왜 이걸 먼저   Nasdaq 손님은 글로벌 퀀트다. 「어느 증권사 목표가가 맞았나」는 바로 쓰는 알파 신호 ·
              한국 증권사 적중률을 점수 매긴 데는 우리뿐(해자). target-price-accuracy 지면이 이미 라이브 ●.
데이터셋 이름   KRX Broker Price-Target Accuracy (2020– )
한 줄 설명     Every Korean broker report's 12-month price target scored against the actual close,
              with hit rate by house and by year. Multi-year, first-party archive.
필드          house · year · reports · targets scored · hit rate · median target upside · realized return
갱신          분기 (리서치 아카이브에서 재산출)
출처·라이선스   우리 리서치 아카이브 + KRX 종가. data.go.kr 제한없음 파생 → 재배포 가능 ●
```

## 값 — ⑤ 종량제 의도, Nasdaq 모델에 맞춤
```
우리 ⑤        종량제(호출당·용량당·조회 건당) — 재구매율>100% 목표.
⚠ 정직        Nasdaq Data Link 는 보통 「상품별 월 구독 + API 무제한 호출」 꼴이라 **순수 종량제가 아니다.**
              순수 호출당 과금은 Snowflake·AWS·자체 API 가 맞다.
제출 시        Nasdaq 에는 월 구독가로 올리되(그 폼에서 정함), 종량제는 자체 API 로 따로 연다.
              → Nasdaq = 「창구·첫 결제」 열기용, 종량제 본체는 다음 단계 자체 API.
제안 월값      (사장님 확정 대기 — ⑤ 값 미정과 같은 게이트) · 하한 후보만 표시, 지어내지 않음.
```

## 밟다 막힌 자리 (71722 ① 화면으로 · ② 누구 몫 · ③ ● 목록)
```
① 어디까지    data.nasdaq.com/sell-data 진입 페이지까지. 그다음 실제 신청 양식은 JS로 그려져 안 읽힘.
② 막힌 자리 둘
   1차 = 🔴 브라우저 익스텐션 「not connected」 (우리 몫 — Chrome 재시작 필요). 지난 사이클부터 끊김.
   2차 = 브라우저 살아도 Nasdaq publisher 계정·신청 제출 = 계정 로그인 (사장님/2번 손).
③ 사장님 손이면 무엇을 (● 로 확실한 것만)
   ● Nasdaq Data Link 계정 로그인(또는 sell-data 신청 접근). 개인 가능이라 사업자 불필요(●).
   ○ 구체 양식 필드·수수료 수치 = 못 봤다(브라우저/SPA 벽). 계정 열리면 그 자리에서 ● 로 센다.
```

## 우리 몫 — 지금 다 됐다 (계정만 열면 즉시)
```
✅ 데이터셋 정함(위) · 설명·필드·갱신·라이선스 준비 · 지면 라이브(신뢰 근거)
⬜ 사장님/2번: Nasdaq 계정 로그인 + (브라우저 살리기) → 그 화면에서 내가 필드 채우고 막힌 자리 ● 로 보고
```
— 6번(SeoulMarkets)
