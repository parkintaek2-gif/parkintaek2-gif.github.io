# SeoulMarkets도 노출이 우리 404로 샜다 — 그런데 검사자가 KCW만 쟀다

발견 2026-09-03 17:2x KST · 6번(SeoulMarkets)

> 5번 [[2026-09-03_노출이-우리-404로-샌다]]: 「전 유닛께 — 지금 바로 이것을 재 보십시오. 10분입니다」
> 사장님: 「새롭게 확인된 것들은 문서로 작성해서 다 공유하라」

---

## 1부. 결론

**5번의 방법을 SeoulMarkets에 그대로 재서 실제로 2건을 찾았다. 그런데 5번이 만든
검사자(`check-gone-page-redirects.mjs`)는 KCW 도메인에만 하드코딩돼 있어, 내가 표에
넣은 항목을 검증하지 못하는 상태였다 — 고쳤다.**

```
🔴 seoulmarkets.com/article/korea-us-surplus-doubled               노출 3 · 404
🔴 seoulmarkets.com/article/korea-trade-surplus-tripled-five-partners 노출 2 · 404
```

둘 다 [[6번-무역데이터-스케일브레이크]] 결함(무역 절대달러 통계의 측정 파손)으로 `draft: true`
전환된 지면이다. 지운 것 자체는 맞지만, 구글은 옛 주소를 아직 기억하고 있었다 — KCW의
Riot 다섯 장과 정확히 같은 꼴.

---

## 2부. 어떻게 쟀나

```bash
MSYS_NO_PATHCONV=1 node scripts/search-console-report.mjs sc-domain:seoulmarkets.com --days 28 "--축=page" "--행수=1000"
# 노출 있는 지면 80장 전부를 curl -L로 하나씩 눌러 봄 (302/301은 -L로 따라가 최종코드 확인)
```
80장 중 2장이 최종 200이 아니었다(둘 다 404). 나머지 78장은 정상.

---

## 3부. 어떻게 고쳤나

`server.mjs`의 `사라진지면` 표(5번이 KCW용으로 이미 만들어 둔 것)에 SeoulMarkets 항목을
추가했다 — 뜻이 가장 가까운, 스케일브레이크 없는 살아있는 재작성본으로 301.

```
korea-us-surplus-doubled                → /article/korea-trade-surplus-four-partners-customs
korea-trade-surplus-tripled-five-partners → /article/korea-trade-surplus-four-partners-customs
```
배포 후 라이브에서 둘 다 301 확인, 보낼 곳 200 확인.

---

## 4부. 🔴 검사자 자체가 SeoulMarkets를 못 재는 결함이 있었다 — 고쳤다

`check-gone-page-redirects.mjs`는 라이브 검증 시 도메인을 이렇게 하드코딩하고 있었다:
```js
const 바탕 = 'https://www.kculturewire.com';  // 표 전체를 이 한 도메인에만 물어봄
```
KCW 항목만 있던 시절엔 맞았지만, SeoulMarkets(접두사 없음) 항목을 더하면 그 항목들이
**엉뚱한 도메인**(kculturewire.com)에 물어봐지는 조용한 결함이 된다 — 검사가 "통과"를
찍어도 실제로는 아무것도 검증 안 한 것과 같다.

```
고침   표의 각 키를 접두사(/wikitip·/100y·없음)로 갈라 각자 도메인에 묻는다
       접두사별도메인 = [/wikitip→kculturewire, /100y→100yearmap, ''→seoulmarkets]
       도메인고르기(내부길) 함수 신설, 손님주소()도 접두사 자동판별로 고침
자가시험   8가지 → 10가지("보낼 곳이 다 내부경로다" + "도메인고르기가 접두사로 가른다")
```
5번이 18:3x에 이 자를 직접 재현·검증해 「걸린 11장 중 10장이 KCW 소속임을 «자료로»(짐작 아님)
가려내는 문지기」까지 한 겹 더 얹었다(내 것과 별개로, 배포관문 쪽의 다른 어림 결함).

---

## 5부. 잰 것과 판단을 갈라 적는다

```
실측    노출 있는 SeoulMarkets 80장 중 2장이 404
실측    되돌림 배포 후 두 장 다 301, 보낼 곳 200
실측    check-gone-page-redirects.mjs가 모든 항목을 kculturewire.com에만 물어보고 있었다(코드 확인)

내 판단  보낼 곳을 「korea-trade-surplus-four-partners-customs」로 잡은 것 — 뜻이 가깝다고 본
        것은 내 판단이다. 자가 재 준 것이 아니다
⛔ 안 말한 것  이 2건이 실제 방문으로 바뀌는지는 아직 못 쟀다(다음 28일 창에서 재야 함)
```

---

## 6부. ⬜ 못 잰 것

- 노출 «있는» 80장만 봤다. 노출 0인 나머지 지면 중에 죽은 링크가 더 있을 수 있다(사이트맵에는
  없지만 구글이 기억하는 주소는 노출 리포트에 안 잡힐 수도 있음 — 이 방법의 한계)
- 301 이후 실제 클릭·방문 전환은 다음 28일 재측정이 필요
