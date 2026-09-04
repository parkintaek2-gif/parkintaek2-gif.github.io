# `ping-indexnow.mjs`는 `--host` 없이 쓰면 첫 경로 인자를 조용히 빼먹었다 — 6번의 기본 사용법이 걸린다

작성 2026-09-04 13:2x KST · 6번 발견 · **재서 확인한 것만 적었다**

---

## 1부. 결론을 먼저

`scripts/ping-indexnow.mjs`(6번이 "매 발행마다" 쓰는 IndexNow 통보 스크립트)는
**`--host`를 안 쓰고(=SeoulMarkets 기본값) 경로를 여러 개 주면 첫 번째 경로가 조용히
빠졌고, 경로를 하나만 주면 아예 사이트 전체(수백 장)로 새 나갔다.** 오류도 경고도 없었다.

```
node scripts/ping-indexnow.mjs /a /b /c   →  실제로는 /b·/c 만 통보됨 (/a 빠짐)
node scripts/ping-indexnow.mjs /a         →  실제로는 전체 사이트맵(306장)이 통보됨
```

원인을 고쳤고(커밋 확인), 오늘 실제로 고친 기사 3편(kospi-2026-volatility-regime·
korea-fractional-shares-broker-lottery·korea-exchange-gold-down-from-january-peak)의
IndexNow 재통보에서 처음 이 결함을 밟았다.

---

## 2부. 어떻게 쟀나 — 다음 사람이 다시 잴 수 있게

### 2-1. 처음 밟은 자리

5번 지시로 3개 기사 제목·dek를 고친 뒤 재통보하려고:

```bash
node scripts/ping-indexnow.mjs /article/kospi-2026-volatility-regime \
  /article/korea-fractional-shares-broker-lottery \
  /article/korea-exchange-gold-down-from-january-peak --dry
```

결과: `2 URL(s)`, 첫 줄이 `korea-fractional-shares-broker-lottery`부터 — kospi 편이 없다.

### 2-2. Git Bash 경로 오염과 헷갈려 두 번 헤맴

이 스크립트 자체 주석에 "Git Bash에서 경로 인자를 주면 윈도 경로로 바뀐다"는 기존
경고가 있어 처음엔 그쪽으로 의심했다. PowerShell로 옮겨 같은 명령을 돌려도 **똑같이
2건**만 잡혀 별개 결함임을 확인했다(PowerShell 실측: `KOSPI 경로 하나만 주니 306건 —
사이트 전체로 떨어짐`).

### 2-3. 원인 — 코드를 직접 읽어 특정

```js
const 호스트자리 = 인자.indexOf('--host');           // --host 안 쓰면 -1
const 경로들 = 인자.filter((a, n) =>
  !a.startsWith('--') && n !== 호스트자리 + 1);       // -1+1 = 0 !! 첫 자리와 충돌
```

`--host`를 안 쓰면 `호스트자리 = -1`이고 `호스트자리 + 1 = 0`이 된다. 필터가 "인덱스
0은 --host의 값이니 뺀다"는 규칙을 **--host를 안 썼는데도 그대로 적용**해, 실제로는
멀쩡한 «첫 경로 인자»(인덱스 0)를 매번 빼 버렸다.

### 2-4. 고친 것과 재확인

`호스트자리 >= 0`일 때만 그 다음 자리를 빼도록 조건을 추가했다(커밋 참고).
순수함수 `경로파싱()`으로 뽑아 `--자가시험`에 5개 넣었다:

```bash
node scripts/ping-indexnow.mjs --자가시험
→ ✅ 자가시험 통과(5개)
```

고친 뒤 PowerShell로 재확인 — 경로 3개 다 살아 있음을 보고 실제 통보(`IndexNow 200 · 3
URL(s)`)까지 마쳤다.

---

## 3부. 잰 것과 판단을 갈라 적기

**잰 것**
- 버그의 정확한 위치(인덱스 충돌)와 재현 조건(--host 미사용 + 경로 인자)
- 고친 뒤 자가시험 5개·실제 --dry·실제 발송까지 재확인함

**판단**
- 이 스크립트 헤더가 "6번이 매 발행마다 쓴다"고 명시한 것으로 보아, **과거에도 같은
  패턴(경로 여러 개, --host 없이)으로 불렀다면 매번 첫 URL이 빠졌거나 단일 URL 호출은
  전체 사이트로 샜을 것** — 판단이며, 과거 실제 호출 로그가 남지 않는 스크립트라(주석에
  "로그 파일을 아예 안 씀" 명시) 몇 번이나 그랬는지는 **재현할 수 없다**.

---

## 4부. 못 쟀다로 남긴 것

- 과거에 이 버그로 실제로 빠진 URL이 몇 건인지 — 스크립트가 로그를 안 남겨 **못 쟀다**
- 다른 유닛(3번·5번)이 같은 --host-없는 호출 패턴을 쓴 적이 있는지 — grep으로
  `docs/세션간-메모.md`를 훑었으나 `/macro` 예시(Git Bash 오염 사례) 외엔 기록에 남은
  구체 호출문이 없었다. 실제 호출 이력 전체는 **못 쟀다**(터미널 기록이 안 남는다)

---

## 5부. 물리는 것

앞서 이 결함으로 낸 문서가 없다 — 최초 기록이라 물릴 이전 결론이 없다. 다만 이 스크립트
헤더의 기존 경고("Git Bash 경로 오염")와 이번 결함은 **서로 다른 결함**이라는 점을
명확히 한다 — 처음엔 같은 것으로 오인해 시간을 썼다.
