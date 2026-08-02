# WikiTip 도메인·광고 진단 (2026-08-03 07:3x KST)

사장님 지시: 「구글 검색에서 문제없이 잘 되는지 확인하고 애드센스 광고가 잘 붙는지도 봐.
콘텐츠를 업로드하기 전에는 뭔가 문제가 있어서 광고 수입이 거의 없었는데 방치했었다.
문제를 해결해서 광고가 제대로 되게 해라 — 위키팁」

**말로 넘기지 않고 전부 재서 확인했다.**

---

## 결론 — 광고가 안 붙은 게 아니라 **사이트에 접속이 안 됐다**

```
2023.wiki-tip.com   → NXDOMAIN  (DNS 에 존재하지 않음)
korea.wiki-tip.com  → NXDOMAIN  (DNS 에 존재하지 않음)
wiki-tip.com        → 가비아 파킹 403
```

가비아 DNS 패널에는 이 둘이 **티스토리로 연결된 CNAME 으로 등록돼 있다.**
그런데 **실제 DNS 에는 없다.** 패널과 실물이 다르다.

```
패널에 적힌 것                          실제 조회 결과
CNAME  2023   host.tistory.io.          NXDOMAIN
CNAME  korea  host.tistory.io.          NXDOMAIN
A      @      211.47.74.75              104.21.87.243 / 172.67.171.132 (Cloudflare)
A      www    211.47.74.75              (같음)
TXT    @      google-site-verification  ✅ 이것만 일치
```

**접속이 안 되는 사이트에는 광고가 붙을 수 없고 구글이 색인할 수도 없다.**
「광고 수입이 거의 없었다」는 광고 설정 문제가 아니라 이것이다.

## 왜 이런 상태인가

```
등록처      가비아
네임서버    ines.ns.cloudflare.com · tosana.ns.cloudflare.com
Cloudflare  parkintaek2@gmail.com 계정에 **존이 0개** — 우리 것이 아니다
```

가비아 DNS 패널이 자기 Cloudflare 백엔드로 레코드를 **전부 밀어 넣지 못한 상태**로 보인다.
TXT 하나만 반영돼 있고 나머지는 아니다.

## 인텔리티비는 사정이 다르다 — 콘텐츠가 없다

```
intellitv.net       200 · 티스토리 (제목 「인텔리겐치아」)
사이트맵 글 수      **1건** (나머지는 /category /tag 같은 목록 주소)
애드센스 코드       0건
ads.txt             404
```

**글이 사실상 한 편이다.** 광고 수입이 없는 것이 당연하다.
색인·광고 설정을 아무리 고쳐도 **읽을 것이 없으면 수익이 안 난다.**

## ads.txt — 우리 도메인 전부 없다

```
klifemap.ai 404 · seoulmarkets.com 404 · 100yearmap.com 404 · intellitv.net 404
```

애드센스에서 「수익 손실 위험 — ads.txt 파일이 없습니다」가 뜨는 원인이고,
광고주 입찰이 제한된다. **광고를 붙일 도메인에는 반드시 둔다.**
(단 klifemap.ai 는 애드센스를 안 쓴다 — 사장님 확인. 인텔리티비·위키팁만 쓴다)

## 그 밖에 확인한 것

```
100yearmap.com   <meta name="robots" content="noindex">  ← 검색에 안 뜬다
                 「준비 중」이라 의도한 것이지만, 검색이 유일한 유통 경로다
seoulmarkets.com robots 200 · sitemap 200 · noindex 없음 ✅
klifemap.ai      robots 200 · sitemap 200 · noindex 없음 ✅ · 광고 코드 0건(정상)
```

## 할 일 — 순서대로

```
① wiki-tip.com DNS 를 실제로 먹게 만든다   ← 여기가 막혀 있다
   가비아 패널 수정이 반영되는지 시험한다. 안 되면 네임서버를 우리가 제어하는 곳으로
   ⚠ TXT 의 google-site-verification 은 보존한다. 지우면 서치콘솔 인증이 깨진다
   ⚠ MX 없음 — 메일은 안 죽는다
② 티스토리 두 블로그를 살릴지 정한다
   살아 있던 콘텐츠가 있으면 그것이 곧 검색 자산이다. 버리지 않는다
③ ads.txt 배치
④ 콘텐츠 — 인텔리티비 1건은 수익이 날 수 없는 양이다
```

**⚠ e스포츠 지면에는 광고를 붙이지 않는다.** Riot 승인 전 광고는 약관 위반이고
`Base.astro` 의 `noAds` 로 코드에서 막아 뒀다.

---

# 넣어야 할 DNS 값 (2026-08-03 07:5x KST)

가비아 DNS 패널이 **자동화에 계속 멎어서**(모달이 열리다 응답 정지, 확인 창 발생)
제가 끝내지 못했다. **DNS 를 반쯤 쓰다 끊으면 도메인이 죽으므로 밀어붙이지 않았다.**

`dns.gabia.com` → wiki-tip.com **설정** → **레코드 수정**

## 고칠 것 둘

```
A   @    211.47.74.75  →  34.8.247.175      TTL 1800
A   www  211.47.74.75  →  34.8.247.175      TTL 1800
```

`34.8.247.175` 는 **seoulmarkets.com·100yearmap.com 이 이미 쓰는 Cloudtype IP** 다.
같은 인스턴스에 얹으므로 **메모리 추가 0원**이다(100yearmap 과 같은 방식).

## 추가할 것 하나

```
TXT  @   cloudtype-space=@parkintaek2      TTL 3600
```

Cloudtype 이 도메인 소유를 확인하는 값이다. 없으면 인증서가 안 나온다.

## ⚠ 절대 지우면 안 되는 것

```
TXT  @   "google-site-verification=Qiy_fWAes5ppU38kN5WfOiCcV8S_jwDP-Wlj6sqzU8M"
```

**구글 서치콘솔 인증이다.** 지우면 검색 등록이 깨진다. TXT 는 여러 개 공존한다.

## 지워도 되는 것 (사장님 확인 — 「티스토리 블로그 없애도 돼」)

```
CNAME  2023   host.tistory.io.
CNAME  korea  host.tistory.io.
```
어차피 **실제 DNS 에 없어서 접속이 안 되던 것들**이다.

## 넣은 뒤 확인 — 패널 화면 말고 이걸로 본다

```bash
nslookup -type=A   wiki-tip.com 8.8.8.8     # 34.8.247.175 가 나와야 한다
nslookup -type=TXT wiki-tip.com 8.8.8.8     # cloudtype + google 둘 다 나와야 한다
```

**⚠ 여기가 이 건의 핵심이다.** 패널에 저장돼도 실제 DNS 에 안 나올 수 있다 —
지금 티스토리 CNAME 두 개가 정확히 그 상태다. **반드시 위 명령으로 확인한다.**

반영되면(보통 30분 이내) 남은 것은 제가 한다.
```
① Cloudtype 에 wiki-tip.com 라우트 추가
② server.mjs Host 분기에 wiki-tip.com 추가 — 100yearmap 과 같은 방식
③ /esports 를 WikiTip 으로 이전 · riot.txt 도 함께 옮겨 재인증
④ Riot 신청서 Product URL 을 wiki-tip.com/esports 로 변경
⑤ ads.txt 배치
```
