# 사이트맵 나무 그림

> 사장님 지시 (2026-09-09): 「모든 유닛 사이트맵을 이미지 파일로 만들어서 사이트맵 폴더를 만들어
> 넣어놔줘. tree 모양으로 해서 한 눈에 알아보게...유료, 무료는 컬러를 다르게 해서 구분되게 하고」

잰때: 2026. 9. 13. 0시 32분 42초 KST

만든 자: `scripts/make-sitemap-tree.mjs` (SVG) · `scripts/make-sitemap-tree-png.mjs` (PNG)
⛔ 한 번 그리고 버리는 그림이 아니다. 지면이 늘면 다시 돌린다.

| 사이트 | 지면 | 갈래 | 값 붙은 갈래 | 그림 |
|---|---:|---:|---:|---|
| seoulmarkets.com | 349 | 22 | 3 | `seoulmarkets.svg` · `seoulmarkets.png` |
| www.kculturewire.com | 2,885 | 156 | 0 | `kculturewire.svg` · `kculturewire.png` |
| 100yearmap.com | 4,985 | 121 | 2 | `100yearmap.svg` · `100yearmap.png` |
| klifemap.ai | 535 | 35 | 13 | `klifemap.svg` · `klifemap.png` |

## 색

```
○ 무료 (초록)    손님이 값을 안 내고 보는 지면
● 유료 (빨강)    값을 내는 자리 자체 (pricing · checkout)
◐ 섞임 (주황)    한 갈래 안에 무료와 «잠긴 것»이 같이 있는 것
□ 못 쟀다 (회색)  재 보지 않았다. 「무료」로 칠하지 않는다
```

⚠ 색«만»으로 가르지 않았다 — 이름 앞에 표시(○●◐□)를 같이 붙였다. 색을 못 보는 손님과 인쇄 때문이다.

## 유료를 어떻게 갈랐나 — 짐작이 아니라 «코드를 훑어서»

```
dataeconomics  값글자 · 지역한벌값 · 사기전안내      사는 단추·값이 붙은 지면
               src/pages/data/index.astro           상품의 price 칸을 세서 섞임/유료를 가른다
klifemap       잠금 · lockedContent · premium_       문턱이 «걸린» 지면 → 섞임(무료+잠김)
               checkout · 결제창 · 구독하기            결제로 «이어지는» 지면 → 섞임
               pricing.html · checkout.html         값 내는 자리 자체 → 유료
```

⚠ 처음엔 손으로 표를 적었다가 klifemap 의 `saju.html` 문턱을 빠뜨렸다.
  그림 아래에 「코드에서 읽었다」고 적어 놓고 실제로는 짐작이었던 것이다 — 그래서 훑어 재게 고쳤다.

⚠ 100y·wikitip 은 저장소에서 경로 접두를 쓰지만 손님이 부르는 주소에는 없다.
  `server.mjs` 가 손님 호스트를 보고 갈아 끼운다 — 그림은 «손님이 부르는» 주소로 그렸다.