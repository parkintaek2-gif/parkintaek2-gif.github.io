# 6번 — DART 실명 순위 시리즈, 다음 후보 (2026-09-01 23시 조사)

이미 낸 것: 자사주매입(tsstkAqDecsn, `korea-celltrion-biggest-buyback-no-cancellation`) · 유상증자(piicDecsn, `korea-samsung-biologics-rights-issue-dilution`).

## 다음 후보 — 전환사채(convertible-bond, `cvbdIsDecsn`)

✅ **API 확인 완료.** `cvbdIsDecsn.json?corp_code=...`로 실명·금액·전환가·희석률까지 구조화로 나온다(예: KG모빌리티 사모전환사채 1,081.4억원, 전환가 2,760원, 전환 시 지분 **16.22% 희석**(`cvisstk_tisstk_vs` 필드 — DART가 이미 계산해 준다, 우리가 따로 계산 안 해도 됨)).

이번 주(8/25~9/1) 원본(정정 아닌) 전환사채 필자 6곳 확보: 씨피시스템·KG에코솔루션·KG모빌리티·아이티센씨티에스·신화프리텍·성호전자.

**각도 후보** — ① 사모(비공개, 소수 투자자) vs 공모 발행 비중 ② 표면금리 0%인데 왜 발행하나(전환권 자체가 가치라 이자를 거의 안 줌 — 자사주매입/유증과 다른 결의 이야기) ③ 전환가가 현재가보다 낮게 잡힌 경우(즉시 희석 압력) vs 높게 잡힌 경우.

**다음 세션이 할 일** — `make-cvbd-dilution-chart.mjs`를 buyback/rights-issue 스크립트 패턴 그대로 만들어(영문사명은 DART `corp_name_eng`) 6곳(또는 주간 누적) 실명 순위+그래프로 낸다. 목적 다른 것(리픽싱 금지 발행 등) 있으면 buyback 기사의 "다른목적" 방식대로 표시하되 빼지 않는다.
