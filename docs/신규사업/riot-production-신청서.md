# Riot Production Key 신청서 — 제출 준비본

작성 2026-08-02 23:3x KST · **아직 제출하지 않았다.**

제출은 `developer.riotgames.com` 에 사장님 계정으로 로그인해 「REGISTER PRODUCT」 를
눌러야 한다. **계정으로 하는 대외 신청이라 내가 임의로 누르지 않았다.**
내용은 아래대로 다 써 뒀으니, 로그인만 하시면 붙여넣기만 하면 된다.
(원하시면 브라우저를 열어 제가 입력까지 하겠다.)

---

## 왜 필요한가 — 세 가지가 걸려 있다

```
1. 키 만료      Personal Key 는 24시간마다 죽는다. 매일 손으로 갈아 끼워야 한다
                → 수집이 하루 빠지면 그 하루는 영영 못 채운다(사다리는 소급이 안 된다)
2. 광고         승인 전에 광고를 붙이면 약관 위반이다. WikiTip 수익 모델이 여기 걸린다
3. 호출 한도    Personal 은 20req/1s · 100req/2min. 지역이 늘면 바로 부족하다
```

**1번이 가장 급하다.** 광고는 나중 일이지만 만료는 매일이다.

---

## 신청서에 넣을 내용

### Product Name
```
SeoulMarkets Esports Data — Regional Ladder Analytics
```

### Product Description (영문 제출)

```
A free, ad-supported editorial site that publishes aggregate statistics about
League of Legends ranked ladders across regions, written for Southeast Asian and
English-speaking readers.

We do not republish raw API responses. We collect the Challenger and Grandmaster
ladders daily via LEAGUE-V4 and publish derived distributions — LP percentiles,
games played, win-rate spread and how these differ between the Korean, Southeast
Asian, Vietnamese, Japanese, North American and European servers.

The editorial question we are answering is "why is Korea strong?", framed as a
measurable comparison of ladder populations rather than opinion. To our knowledge
no publication tracks this as a daily time series, which is the point — the ladder
cannot be reconstructed retroactively, so the archive itself is the product.

We deliberately do not store player identifiers. puuid and summonerId are dropped
at collection time; only distributions are retained. We hold no personal data and
therefore have nothing to delete on request.

Static reference data (champion names, patch versions) comes from Data Dragon and
is used for localisation into English, Vietnamese and Indonesian.

All content is free to read. Revenue, if any, is display advertising. There is no
paywall, no subscription and no resale of Riot data.
```

**왜 이렇게 쓰는가** — Riot 이 보는 것은 두 가지다.
① **무료 이용 층이 있는가** (있다. 전부 무료다)
② **변형된(transformative) 콘텐츠인가** (원본 응답을 되팔지 않고 분포로 가공한다)
그리고 **개인정보를 안 담는다는 문장**을 먼저 쓴다 — 심사에서 가장 자주 걸리는 자리다.

### Product URL
```
https://wiki-tip.com        ← ⚠ 확인 필요. 아직 e스포츠 지면이 없다
```

⚠ **여기가 유일한 약점이다.** 신청 시점에 **보여 줄 지면이 있어야** 심사가 통과한다.
그래서 순서는 이렇다.

```
① 랭크 사다리를 며칠 쌓는다        ← 지금 돌고 있다 (매일 22:00)
② 그 데이터로 지면을 하나 만든다    ← 비상업이라 승인 전에 해도 된다
③ 그 URL 로 Production 신청한다
```

**②까지 하고 신청하는 것이 통과율이 높다.** 빈 사이트로 신청하면 반려된다.

### Application Type
```
WEB — public website
```

### Company / Individual
```
개인 사업자. 법인 아님. (About 페이지의 사업자 정보와 일치시킬 것)
```

---

## 제출 전 점검표

- [ ] 랭크 사다리 데이터가 최소 3~7일 쌓였는가
- [ ] WikiTip 에 e스포츠 지면이 하나라도 발행돼 있는가
- [ ] 그 지면에 **출처 표기**가 있는가 — "Data via Riot Games API"
- [ ] 그 지면에 **Riot 비공식 고지**가 있는가
      "isn't endorsed by Riot Games and doesn't reflect the views or opinions of
       Riot Games or anyone officially involved in producing or managing
       Riot Games properties."  ← Riot 이 문구를 지정한다. 그대로 쓴다
- [ ] 광고는 **아직 붙이지 않았는가** (승인 전 광고는 위반)
- [ ] 개인정보를 저장하지 않는다는 것이 코드에서도 사실인가
      → `scripts/collect-riot-ladder.mjs` 의 `분포()` 가 puuid 를 버린다. 사실이다

---

## 승인이 나면 바뀌는 것

```
키          만료 없음 — 매일 갈아 끼우지 않아도 된다
한도        지역 확대 가능 (지금 6곳 → 전 지역)
광고        붙일 수 있다
spectator   실시간 픽·밴이 열릴 가능성 (Personal 로는 403이었다. 확인 필요)
```

**esports(프로 경기)는 승인이 나도 안 열린다.** 개발자 API 의 범위가 아니다.
그건 별도의 미디어 파트너십 문제이고, 지금 우리 체급의 일이 아니다.
