# Riot Production Key 신청 — **제출 완료**

제출 2026-08-03 00:5x KST · **App ID 866800 · Status: Pending Review**

```
신청 화면    https://developer.riotgames.com/app/866800/info
제품명       SeoulMarkets — Korea, Explained in Data
Product URL  https://seoulmarkets.com/esports
게임         League of Legends · 토너먼트 주최 아님
도메인 인증   ✅ 「Verification code found and validated!」
            https://seoulmarkets.com/esports/riot.txt  ← public/esports/riot.txt
```

**⚠ `public/esports/riot.txt` 를 지우지 말 것.** 인증 토큰이고, 없어지면 심사가 막힌다.

---

## 왜 필요했나 — 셋이 걸려 있다

```
1. 키 만료    Personal Key 는 24시간마다 죽는다. 매일 손으로 갈아 끼워야 한다
              → 수집이 하루 빠지면 그 하루는 영영 못 채운다(사다리는 소급이 안 된다)
2. 광고       승인 전에 광고를 붙이면 약관 위반이다. WikiTip 수익 모델이 여기 걸린다
3. 호출 한도  Personal 은 20req/1s · 100req/2min. 지역이 늘면 바로 부족하다
```

**1번이 가장 급했다.** 광고는 나중 일이지만 만료는 매일이다.
승인이 날 때까지는 **매일 `developer.riotgames.com` 에서 REGENERATE 해
`.env` 의 `RIOT_API_KEY` 를 갈아야 한다.** 안 하면 그날 22:00 수집이 실패하고
`archive/log/riot-ladder.log` 에 「인증 실패」로 남는다.

---

## 제출 직전에 잡은 문제 셋 — 안 잡았으면 반려됐다

**다음에 다른 제품을 신청할 때 그대로 쓴다.**

### ① 설명문이 1,500자에서 잘려 있었다

`maxLength` 는 **타이핑만 막고 붙여넣기는 통과시킨다.** 4,000자 원고를 넣었더니
문장 중간에서 끊긴 채로 남아 있었다. 폼 안내문에 「완전하고 상세한 설명이 없는
신청서는 반려됩니다」라고 적혀 있으니 **그대로 냈으면 반려였다.**

→ 문단별 길이를 재서 1,459자로 다시 썼다(여유 41자).

### ② 제품 URL 이 비어 있었다

React 폼이라 **키보드 입력이 상태에 반영되지 않는다.** 화면에는 아무 표시도 없다.
네이티브 value setter + `input`/`change` 이벤트로 넣어야 들어간다.

```js
const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
el.dispatchEvent(new Event('input',  { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));
```

### ③ 숨은 질문 14개는 채울 필요가 없었다

`question_one` ~ `question_fourteen` 이 DOM 에 있어서 필수인 줄 알았다.
**전부 토너먼트 주최용**이고 「주최하지 않음」이면 숨겨지며 `required=false` 다.

> **제출 버튼을 누르기 전에 값을 직접 읽어서 확인할 것.**
> 화면만 보고 냈으면 ①②를 못 잡았다. 화면 캡처가 계속 시간초과였는데
> 그게 오히려 값을 직접 읽게 만들어서 문제를 찾았다.

---

## 정책을 읽고 확인한 것 — 우리 판단 셋이 정책과 일치했다

등록 전에 「일반 정책」·「토너먼트 정책」 두 모달을 다 읽었다.

```
「문서화되지 않은 엔드포인트에서 데이터를 스크래핑하는 것은 금지」
   → esports-api.lolesports.com 을 안 쓰기로 한 것. 썼으면 API 접근 영구 박탈 대상이었다
「앱 사용료를 부과하거나 독점 액세스를 제공하는 행위」 금지
   → 유료 구독을 안 하기로 한 것
「베팅, 도박 관련 모든 행위는 허용되지 않습니다. 예외는 없습니다」
   → 베팅 데이터를 안 하기로 한 것
「최근 경기력을 포함한 어떤 기준으로도 선수를 비난해서는 안 된다」
   → 선수 식별자를 아예 안 담는 구조
```

⚠ **우리와 가장 가까운 금지 항목은 「공식 실력 랭킹 시스템의 대안 제작 금지」**다
(MMR·ELO 계산기 불가). 우리는 공식 사다리를 집계할 뿐 대체 랭킹을 만들지 않지만,
**오해를 사면 그것으로 반려된다.** 그래서 설명문에 문단을 따로 넣었다 —

> This is not a ranking tool. We do not compute MMR, estimate hidden ratings,
> score players, or offer per-player lookup. Our unit of analysis is the region,
> never the player.

---

## 축을 바꾼 것 — 「LoL 분석 도구」가 아니라 「한국을 데이터로 설명하는 매체」

사장님 지적: **「우리는 한류를 데이터로 표현하는 거 아닌가」**

이 프레임이 맞고, **정책상으로도 유리하다.** Riot 이 경계하는 것은 자기 랭킹과
경쟁하는 도구인데, 우리는 경쟁 도구가 아니라 **편집물**이다.
그래서 첫 문단을 무역통계·리서치 아카이브와 나란히 놓고
**「LoL 은 우리의 세 번째 데이터셋」**으로 썼다.

---

## 제출한 설명문 (1,459자)

```
SeoulMarkets is an English data-journalism site about Korea. We publish Korean
trade statistics and a 66,071-record archive of Korean brokerage research. League
of Legends is our third dataset: Korean strength is constantly asserted, almost
never measured.

Daily we snapshot the Challenger and Grandmaster ladders in six regions (KR, SG2,
VN2, JP1, NA1, EUW1) via LEAGUE-V4, RANKED_SOLO_5x5, and derive aggregates: tier
size, LP percentiles, win rate, games played. Live prototype with real data:
https://seoulmarkets.com/esports, collecting since 2 Aug 2026.

This is not a ranking tool. We do not compute MMR, estimate hidden ratings, score
players, or offer per-player lookup. Our unit of analysis is the region, never the
player.

We store no player identifiers - puuid and summonerId are discarded at collection
time - so we hold no personal data. No match history, no comment on any player.

We also use Data Dragon for champion names and patch versions, to localise for
Southeast Asian readers. We scrape nothing and use only documented endpoints,
deliberately avoiding the undocumented lolesports ones.

All content is free: no paywall, subscription or registration. Any revenue would
be advertising, not enabled before approval. We do not resell Riot data, expose an
API over it, or touch betting.

A ladder cannot be reconstructed later, so a missed day is lost permanently. Our
24-hour development key makes unattended daily collection unreliable.
```

---

## 지금 지켜야 할 것 — 심사 중이다

```
✕ 광고를 붙이지 않는다              승인 전 광고는 약관 위반이다
✕ public/esports/riot.txt 를 지우지 않는다
✕ /esports 지면을 내리지 않는다      Product URL 이 죽으면 반려된다
✅ 사다리 수집은 계속한다            비상업이라 지금 해도 된다
```

`/esports` 지면에는 Riot 이 지정한 비공식 고지가 이미 들어가 있다.

> SeoulMarkets isn't endorsed by Riot Games and doesn't reflect the views or
> opinions of Riot Games or anyone officially involved in producing or managing
> Riot Games properties.

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

---

## 다음 확인

`https://developer.riotgames.com/app/866800/info` 에서 Status 를 본다.
`Pending Review` → `Approved` 로 바뀌면 광고를 붙일 수 있다.
문의는 그 화면의 **MESSAGES** 탭으로 한다.
