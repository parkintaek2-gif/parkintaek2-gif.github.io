# dataeconomics — 영문 데이터저널리즘 사이트

이 파일은 Claude Code가 세션 시작 시 자동으로 읽습니다.

## 무엇을 만드는가

한국 금융시장 전반의 데이터를 **영문으로 가공해 발행**하는 데이터저널리즘 사이트.
카테고리 5개 — 증시(equities) · 외환(fx) · 채권·금리(rates) · 커머디티(commodities) · 거시(macro).
선물·옵션은 별도 카테고리가 아니라 기초자산이 속한 시장에 넣는다.
가상자산은 재배포 근거를 확보하지 못해 **다루지 않는다**(About에 이유를 명시해뒀다).
기사는 별도 스킬이 생성하고, 이 사이트는 **발행·아카이빙·검색노출**만 한다.

**전체 요구사항은 `docs/작업지시서.md`에 있습니다. 먼저 읽으십시오.**

## 이 프로젝트가 아닌 것

- 유료 결제·구독·페이월 **없음**
- 회원가입·로그인 **없음**
- 관리자 화면 **없음** — 마크다운 파일을 넣으면 발행, 지우면 비공개
- 투자자문·매매신호 **없음**

> 사장님의 다른 프로젝트(KLifeMap)는 회원·결제·SQLite가 있는 무거운 구조다.
> **그 구조를 여기로 가져오지 말 것.** 여기는 무료 발행 매체이지 SaaS가 아니다.

## 기술 선택 (2026-08-01 확정)

- **Astro** — 정적 사이트 생성기. (Next.js는 이 용도에 과하다. 하루 여러 건 발행이라
  빌드 속도가 중요하고, 서버 기능이 필요 없다)
- 콘텐츠: `/content/articles/{slug}.md` — frontmatter(YAML)에 메타데이터
- 배포: **Cloudflare Pages** (GitHub 저장소를 보고 자동 빌드)
- 상시 서버·DB **없음**

## ⚠ 코드를 짜기 전에 확인해야 할 것

### 1. 데이터 출처 라이선스 — 가장 큰 위험

한국 증시 데이터를 영문으로 가공해 **광고 수익을 내는 것**은 데이터 재배포에 해당할 수 있다.
KRX·연합인포맥스 등은 상업적 재배포에 유료 라이선스를 요구하는 경우가 있다.

**어느 데이터를 무슨 근거로 쓸 수 있는지 먼저 확정한다.** 나중에 문제되면 사이트가 멈춘다.
확인 결과를 `docs/데이터-출처-라이선스.md`에 적는다.

### 2. 금융 콘텐츠는 구글이 YMYL로 본다

돈·건강 주제는 신뢰도 심사가 엄격하다. **발행 주체(법인명·주소·연락처)와 저자 정보가
명확하지 않으면 검색에 올라오지 않는다.** About 페이지에 사업자 정보를 반드시 넣는다.

### 3. 투자자문 아님 고지

지시서의 「AI-assisted」 고지에 더해, **"이것은 투자 자문이 아니다"**를 모든 기사 하단과
About에 고정 노출한다. 미국 독자를 겨냥하므로 더 중요하다.

## 작업 순서

`docs/작업지시서.md`의 「작업 순서」를 따른다. 다만 위 세 가지를 먼저 정리한 뒤 시작한다.

## 배포가 어떻게 되는지 (2026-08-02 실측으로 정정)

```
내 컴퓨터에서 코드 수정
   ↓  git push origin main && git push site main
GitHub 저장소
   ↓  ⚠ 자동으로 뜨지 않는다
ctype apply -f .cloudtype/app.yaml -t @parkintaek2/seoulmarkets:main
   ↓  (Cloudtype 이 저장소를 clone → npm ci → npm run build → npm start)
https://seoulmarkets.com  (약 2분 뒤 반영)
```

**푸시만 하면 배포되지 않는다.** 2026-08-02 에 실측했다 — 푸시 뒤 6분 동안 새 기사가
계속 404 였고, Cloudtype 의 UPDATED 는 8시간 전 그대로였다. `ctype apply` 를 돌리자
2분 만에 200 이 됐다. **기사를 올렸으면 apply 까지 해야 발행이 끝난 것이다.**

`-t` 를 빼먹지 말 것 — 같은 계정에 klifemap 이 있다(맨 아래 항목 참조).

배포가 반영됐는지는 눈으로 확인한다.
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://seoulmarkets.com/article/{slug}
```

발행 뒤에는 검색엔진에 알린다 — `npm run indexnow`.

사장님이 파일을 서버에 직접 올릴 일은 없다.

## 작업 스타일

- 한국어로 답변
- 사실과 의견을 구분할 것. 추측으로 단정하지 말 것
- 수정 지시를 주기보다 직접 파일을 고칠 것
- **묻지 말고 판단해서 배포까지 끝낼 것**
- 화면을 만들면 **렌더해서 눈으로 확인한 뒤** 완료라고 할 것

---

# ✅ 도메인 — seoulmarkets.com (2026-08-02 해결됨)

**끝났다. 사이트는 살아 있다.** 아래는 다음 세션이 같은 길을 또 헤매지 않도록 남긴다.

```
seoulmarkets.com → 34.8.247.175   (Cloudtype)
https://seoulmarkets.com/  → 200
http://  → https 로 301
```

## 결론 — GitHub Pages 가 아니라 Cloudtype 이 서비스한다

2026-08-01 자 메모는 「GitHub Pages 에 Custom domain 을 넣어야 한다」로 끝나 있었다.
**그 길로 가지 않았다.** DNS 를 Cloudtype 으로 돌려서 해결됐다.
GitHub Pages 의 Custom domain 칸은 지금도 비어 있고, **채울 필요가 없다.**

그래서 앞의 메모에 있던 아래 내용은 **모두 해당 없음**이다. 되살리지 말 것.
- A 레코드를 185.199.108/109.153 으로 넣는 것
- Settings → Pages → Custom domain 입력칸
- 「입력칸에 글자가 안 들어간다」던 문제

## 백업 경로는 그대로 살아 있다

GitHub Pages 에도 같은 사이트가 계속 올라간다 — https://parkintaek2-gif.github.io/ (200 확인).
Cloudtype 이 죽으면 **DNS 를 185.199.108.153·109.153 으로 되돌리고 저장소 설정에
Custom domain 을 넣으면** 복구된다. 그래서 푸시는 항상 양쪽에 한다.

```bash
git push origin main && git push site main
```

※ 참고 — 사장님의 도메인은 등록처가 갈린다.
  seoulmarkets.com·klifemap.ai 는 **Spaceship**, intellitv.net·wiki-tip.com 은 **가비아**다.

※ **DNS를 바꾸기 전에 지금 그 주소에서 무엇이 서비스되고 있는지 반드시 확인할 것.**
  살아 있는 사이트를 끊어 버리면 되돌리는 데 또 하루가 걸린다.

---

# ⚠ 같은 Cloudtype 계정에 KLifeMap 이 함께 있다 (2026-07-31)

`~/Documents/GitHub/klifemap` 의 **KLifeMap**(klifemap.ai)이
**같은 Cloudtype 계정 `@parkintaek2`** 를 쓴다. **klifemap.ai 는 사장님의 매출이 나는
서비스다. 죽이면 안 된다.**

| 프로젝트 | Cloudtype 스테이지 | 배포 이름 | 메모리 |
|---|---|---|---|
| SeoulMarkets (여기) | `@parkintaek2/seoulmarkets:main` | `web` | 0.5GB |
| KLifeMap | `@parkintaek2/klifemap:main` | `klifemap-app` | 0.5GB |

구독 총량 **1GB**. 계정 단위로 구독하고 두 프로젝트가 나눠 쓴다. 프로젝트별 결제가 없다.

## 반드시 지킬 것

**`ctype` 명령에는 예외 없이 `-t` 로 대상 스테이지를 명시한다.**

```bash
ctype apply -f .cloudtype/app.yaml -t @parkintaek2/seoulmarkets:main
ctype ls -t @parkintaek2/seoulmarkets:main
```

`ctype` 에는 "현재 스테이지"라는 전역 상태가 있고, `undeploy` 같은 명령 뒤에 **제멋대로 다른
프로젝트로 되돌아간다.** 실제로 2026-07-31 에 `-t` 없이 `ctype apply` 를 실행해
**klifemap 프로젝트에 `web` 이 잘못 생성됐다.** 즉시 제거했고 klifemap-app 은 무사했지만,
운이 나빴으면 남의 서비스를 메모리 부족으로 밀어낼 수 있었다.

## 배포가 안 뜰 때 — 원인은 대개 메모리다

- `Memory limit exceeded ... 0GB remained` → klifemap 이 다 쓰고 있다. 총량을 늘린다.
- `ready=1 / unavailable=1` 로 멈춤 → 롤링 업데이트에 두 배 메모리가 필요한데 여유가 없다.
  `undeploy` 후 다시 `apply` 한다. **이때 `-t` 를 빼먹지 말 것.**

## 프리티어 함정

`spot: true` 로 뜨면 **매일 1회 자동 중지된다.** 매체로는 못 쓴다.
`.cloudtype/app.yaml` 의 `resources.spot: false` 로 고정돼 있다. 지우지 말 것.

## 백업 경로

GitHub Pages 에 같은 사이트가 떠 있다 — https://parkintaek2-gif.github.io/
Cloudtype 이 죽으면 DNS 만 되돌려 복구한다. 그래서 푸시는 항상 양쪽에 한다.

```bash
git push origin main && git push site main
```
