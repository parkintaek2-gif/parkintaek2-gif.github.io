# Riot Production Key 신청 — **제출 완료**

제출 2026-08-03 00:5x KST · **App ID 866800 · Status: Pending Review**
수정 2026-08-03 07:1x KST · **제품명·설명을 WikiTip 으로 정정** (아래 「정정」 참조)

```
신청 화면    https://developer.riotgames.com/app/866800/info
제품명       WikiTip — Korean Culture, Explained in Data   ← 07:1x 정정
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

## 제출한 설명문 (1,459자) — ⚠ 07:1x 에 교체됐다. 아래 「정정」이 최신이다

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

---

# ⚠ 정정 (2026-08-03 07:1x KST) — 브랜드를 잘못 썼다

사장님 지적: **「wiki-tip.com 이 K컬처잖아. 서울마켓츠는 경제/금융이고… 가서 수정해」**

## 무엇이 잘못됐나

wiki-tip.com 이 가비아 파킹이라 못 띄운다는 이유로 **금융 매체에 게임 지면을 얹고
그 이름으로 신청했다.** 그건 편의였지 판단이 아니었다.

| | 냈던 것 | 고친 것 |
|---|---|---|
| 제품명 | `SeoulMarkets — Korea, Explained in Data` | `WikiTip — Korean Culture, Explained in Data` |
| 설명 첫 문단 | 「무역통계와 66,071건의 증권사 리포트」 — **게임 신청서에 금융 아카이브** | 동남아 대상 K컬처 매체 |
| 독자 | 「동남아 독자를 위해 현지화」 — 금융 매체 설명과 모순 | 발행처가 K컬처 매체라 모순 해소 |
| 도메인 불일치 | 설명에 없었다 | **왜 금융 도메인에서 서비스되는지 명시** |

**도메인 불일치를 안 적은 것이 가장 위험했다.** 심사자가 금융 사이트에서 LoL 데이터를
보면 그것만으로 반려 사유다. 숨기지 않고 「wiki-tip.com 이 아직 연결되지 않아 자매지
인프라에서 서비스 중이며 DNS 가 되면 옮긴다」로 적었다.

정책 문단 넷(랭킹 도구 아님·개인정보 미보관·전부 무료·문서화된 엔드포인트만)은
그대로 유지했다. 1,481자.

## ⚠ 광고 — 코드로 막았다

사장님: 「위키팁은 이미 구글 애드센스를 붙이고 있어」

**신청서에 「승인 전에는 광고를 켜지 않는다」고 적었으므로, 그 문장이 거짓이 되면
브랜드 오류보다 훨씬 나쁘다.** 확인한 사실은 이렇다.

```
저장소       AdSlot·Base 에 배선은 있으나 ADS.client 가 빈 문자열
라이브 검사   /esports · seoulmarkets.com → adsbygoogle 문자열 0건
wiki-tip.com  가비아 403. 우리 사이트가 아직 안 떠 있다
→ 지금은 신청서 문장이 사실이다
```

**위험은 앞으로다.** 나중에 누군가 `ADS.client` 를 채우면 같은 레이아웃을 쓰는
e스포츠 지면에도 광고가 붙고, **아무도 의도하지 않은 채로 위반이 된다.**
벌은 API 접근 영구 박탈이다. 그래서 문서가 아니라 코드로 막았다.

```
Base.astro   noAds prop — 스크립트와 push 둘 다 막는다
             (슬롯만 빼면 Auto Ads 가 스크립트만 보고 광고를 꽂을 수 있다)
esports.astro   noAds 적용
wikitip 저장소   같은 가드를 미리 넣어 뒀다. 지면이 그리로 옮겨 가기 때문
```

**증명했다** — 시험용 광고 ID 를 넣고 빌드했더니
`index.html` 1건 · `equities.html` 1건 · **`esports.html` 0건**. 그 뒤 ID 를 되돌렸다.

⚠ **광고를 전체에서 멈출 필요는 없다.** Riot 이 관여하는 것은 e스포츠 지면뿐이고,
전체를 멈추면 매출만 잃는다.

## ⛔ 막힌 것 — 가비아가 아니라 Cloudflare 였다

```
wiki-tip.com  네임서버 → ines.ns.cloudflare.com · tosana.ns.cloudflare.com
seoulmarkets.com · 100yearmap.com → launch1/2.spaceship.net
```

**가비아는 등록처일 뿐 DNS 는 Cloudflare 에서 관리된다.** 가비아에 로그인해도 안 된다.

DNS 를 바꾸기 전에 확인해 둔 것:
```
현재      가비아 파킹 403 (Cloudflare IP 경유). 끊어질 서비스가 없다
MX        없음 — 메일이 안 죽는다
TXT       google-site-verification=Qiy_fWAes5ppU38kN5WfOiCcV8S_jwDP-Wlj6sqzU8M
          ⚠ 이건 지우면 안 된다. 서치콘솔 인증이 깨진다
```

Cloudflare 대시보드가 열리면 남은 것은 이 순서다.
```
① CNAME @ → ms8nmh0n689e433f.sel3.cloudtype.app · TXT cloudtype-space=@parkintaek2
   ⚠ 프록시(주황 구름)는 꺼야 한다. 켜 두면 Cloudtype 인증서 발급이 막힌다
② Cloudtype 에 wiki-tip.com 라우트 추가
③ server.mjs Host 분기에 wiki-tip.com 추가 (100yearmap 과 같은 방식, 메모리 0원)
④ /esports 를 WikiTip 으로 이전 · riot.txt 도 같이 옮겨 재인증
⑤ Riot 신청서 Product URL 을 wiki-tip.com/esports 로 변경
```
