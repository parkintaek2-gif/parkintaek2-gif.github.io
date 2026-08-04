#!/usr/bin/env node
/**
 * **동적 순위 표그래프** — 보고 싶은 기준을 고르면 그 순위가 다시 선다.
 *
 *   npm run report:ranking            → archive/report/ranking-{연도}.html
 *
 * ── 사장님 지시(2026-08-04) ────────────────────────────────────
 *   「**동적 표그래프**를 만들어. 상 많이 받은 곳, 근속연수 등 직종은, 기업은…」
 *   「**내가 보고 싶은 순위를 선택하면 순위가 쭉 뜨는 내림차순/오름차순** 등」
 *   「**임직원 평균 급여 순위**도 되겠네. 다트에 다 공개되니」
 *
 * ── 왜 「표그래프」인가 ────────────────────────────────────────
 * 표만 있으면 숫자를 **읽어야** 하고, 그래프만 있으면 정확한 값을 **잃는다.**
 * 칸 안에 막대를 깔면 둘 다 된다 — 눈은 길이를 보고, 필요하면 숫자를 읽는다.
 * 순위표는 **크기 비교**가 목적이라 이 형태가 맞다.
 *
 * ── ⚠ 라이브러리를 안 쓴다 ────────────────────────────────────
 * 정렬·필터·막대 전부 손으로 짠다. 표 하나에 200KB 를 부르지 않는다.
 * 그리고 우리 지면은 자기완결이어야 한다 — 외부 스크립트를 못 부른다.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 보여줄 기준들. **여기에 한 줄 넣으면 화면에 축이 하나 는다.**
 * 나중에 「상 받은 횟수」·「임원 평균 재직기간」이 들어와도 같은 자리에 붙는다.
 *   키    데이터의 필드명
 *   방향  기본 정렬 (desc = 큰 게 위)
 *   꼴    화면 표기
 *   좋음  높을수록 좋은가 — ⚠ 단정하지 않는 축은 null 로 둔다
 */
export const 축 = [
  { 키: '근속',   이름: '평균 근속연수',   단위: '년',  방향: 'desc', 좋음: null,
    설명: '회사가 신고한 전 직원 평균. 남·여 가중평균이다' },
  { 키: '근속남', 이름: '근속 · 남',       단위: '년',  방향: 'desc', 좋음: null },
  { 키: '근속여', 이름: '근속 · 여',       단위: '년',  방향: 'desc', 좋음: null },
  { 키: '근속격차', 이름: '근속 격차(남−여)', 단위: '년', 방향: 'desc', 좋음: null,
    설명: '양수면 남성이 더 오래 다닌다. 음수면 반대다' },
  { 키: '급여',   이름: '1인평균급여',     단위: '원',  방향: 'desc', 좋음: null,
    설명: '남·여 인원 가중평균. 성과급 반영 방식은 회사마다 다르다' },
  { 키: '급여남', 이름: '1인평균급여 · 남', 단위: '원', 방향: 'desc', 좋음: null },
  { 키: '급여여', 이름: '1인평균급여 · 여', 단위: '원', 방향: 'desc', 좋음: null },
  { 키: '급여비', 이름: '여성 급여 / 남성', 단위: '%', 방향: 'asc', 좋음: null,
    설명: '100%면 같다. 낮을수록 여성 평균이 낮다' },
  { 키: '인원',   이름: '직원 수',         단위: '명',  방향: 'desc', 좋음: null },
  { 키: '여성비', 이름: '여성 비율',       단위: '%',   방향: 'desc', 좋음: null },
  /* ── 아래는 곁자료가 붙어야 값이 찬다. 없으면 「—」로 나온다 ── */
  { 키: '대표재직', 이름: '대표이사 재직',  단위: '년',  방향: 'desc', 좋음: null,
    설명: '한 회사에 대표가 여럿이면 **가장 오래 있은 사람** 기준이다. 오너와 전문경영인은 뜻이 다르다' },
  { 키: '임원수', 이름: '등기·미등기 임원 수', 단위: '명', 방향: 'desc', 좋음: null },
  { 키: '업력',   이름: '업력',           단위: '년',  방향: 'desc', 좋음: null,
    설명: '설립일부터 오늘까지. 상장일이 아니다' },
];

export function 읽기(파일) {
  const 표 = [];
  for (const l of readFileSync(파일, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { 표.push(JSON.parse(l)); } catch { /* 깨진 줄은 버린다 */ }
  }
  return 표;
}

/**
 * 곁들 자료를 corp 로 붙인다 — 업종·지역·임원.
 * ⚠ **없으면 없는 대로 간다.** 곁자료가 아직 안 모였다고 순위표가 죽으면 안 된다.
 *   사장님 지시(「업종별·그룹별로도 가공하라」)를 받자마자 수집을 걸었는데,
 *   수집이 도는 동안에도 기존 축은 계속 보여야 한다.
 */
export function 곁붙이기(행들, 회사표, 임원표) {
  const 회사 = new Map((회사표 ?? []).map((r) => [r.corp, r]));
  /* 임원은 회사당 여러 명이다 — **대표이사만** 골라 최장 재직을 회사 값으로 삼는다 */
  const 대표 = new Map();
  for (const e of 임원표 ?? []) {
    if (!e.대표 || e.재직개월 == null) continue;
    const 이전 = 대표.get(e.corp);
    if (!이전 || e.재직개월 > 이전.재직개월) 대표.set(e.corp, e);
  }
  const 임원수 = new Map();
  for (const e of 임원표 ?? []) 임원수.set(e.corp, (임원수.get(e.corp) ?? 0) + 1);

  return 행들.map((r) => {
    const c = 회사.get(r.corp);
    const d = 대표.get(r.corp);
    return {
      ...r,
      업종: c?.업종 ?? null,
      업종명: c?.업종명 ?? null,
      시도: c?.시도 ?? null,
      /* 업력 — ⚠ 「현재」는 한국시간 오늘이다. toISOString 을 쓰면 새벽에 어긋난다 */
      업력: c?.설립 && /^\d{8}$/.test(c.설립)
        ? +((new Date().getFullYear() - +c.설립.slice(0, 4))
          + (new Date().getMonth() + 1 - +c.설립.slice(4, 6)) / 12).toFixed(1)
        : null,
      대표재직: d ? +(d.재직개월 / 12).toFixed(1) : null,
      대표오너: d?.오너 ?? null,
      임원수: 임원수.get(r.corp) ?? null,
    };
  });
}

/**
 * ── ⚠ 신고 단위가 회사마다 다르다 ─────────────────────────────
 * DART 는 이 칸을 **자유 입력**으로 받는다. 그래서 이런 게 섞여 들어온다.
 *
 *   티엘아이        근속 「54」   ← 개월을 년 칸에 적었다 (실제 4.5년)
 *   팸텍            급여 453억    ← 1인평균 칸에 총액을 적었다
 *   오가닉티코스메틱  급여 24,400  ← **천원 단위**로 적었다 (실제 2,440만원)
 *
 * 실측 분포로 확인했다 — 근속 99%가 19.1년, 급여 99%가 2.24억이다.
 * 그 밖은 자릿수가 통째로 다르다.
 *
 * ⚠ **자동으로 고치지 않는다.** 24,400 에 1000 을 곱하는 건 추측이다.
 *   회사가 정말 그렇게 신고했는지, 단위를 틀린 건지 우리는 모른다.
 *   **거르고, 거른 사실을 화면에 밝힌다.** 몰래 고치는 것이 제일 나쁘다.
 *
 * 순위표에서 1위가 쓰레기면 **표 전체를 못 믿게 된다.** 그래서 기본은 제외다.
 */
export const 한계 = {
  근속: [0.1, 35],          // 사람의 근속이다. 35년 넘으면 단위를 의심한다
  급여: [1e7, 1e9],         // 1,000만원 ~ 10억. 지주사 고임금까지 품는 폭이다
};

export function 이상점검(r) {
  const 걸림 = [];
  for (const k of ['근속', '근속남', '근속여']) {
    const v = r[k];
    if (v != null && (v < 한계.근속[0] || v > 한계.근속[1])) { 걸림.push('근속'); break; }
  }
  for (const k of ['급여', '급여남', '급여여']) {
    const v = r[k];
    if (v != null && (v < 한계.급여[0] || v > 한계.급여[1])) { 걸림.push('급여'); break; }
  }
  return 걸림.length ? 걸림 : null;
}

/** 파생 지표를 계산한다. ⚠ **0 과 없음을 구분한다** — 없는 걸 0 으로 만들면 순위가 통째로 틀린다 */
export function 가공(표) {
  return 표.map((r) => {
    const 남 = r.남 ?? null, 여 = r.여 ?? null, 인원 = r.인원 ?? null;
    const 급여 = (r.급여남 != null && r.급여여 != null && 남 && 여)
      ? Math.round(((r.급여남 * 남) + (r.급여여 * 여)) / (남 + 여))
      : (r.급여남 ?? r.급여여 ?? null);
    return {
      /* ⚠ `corp` 를 반드시 남긴다. 이게 곁자료(업종·임원)를 붙이는 **유일한 열쇠**다.
       *   처음에 빠뜨려서 35,004행을 읽고도 0건이 붙었다. 종목코드는 없는 회사가 있어 못 쓴다 */
      corp: r.corp,
      이름: r.이름, 영문: r.영문 ?? '', 종목: r.종목, 인원, 남, 여,
      근속: r.근속 ?? null, 근속남: r.근속남 ?? null, 근속여: r.근속여 ?? null,
      근속격차: (r.근속남 != null && r.근속여 != null) ? +(r.근속남 - r.근속여).toFixed(2) : null,
      급여, 급여남: r.급여남 ?? null, 급여여: r.급여여 ?? null,
      급여비: (r.급여남 && r.급여여) ? +((r.급여여 / r.급여남) * 100).toFixed(1) : null,
      여성비: (인원 && 여 != null) ? +((여 / 인원) * 100).toFixed(1) : null,
    };
  }).map((r) => ({ ...r, 이상: 이상점검(r) }));
}

export function 만들기(행들, 연도) {
  const 자료 = JSON.stringify(행들);
  const 축JSON = JSON.stringify(축);

  return `<title>상장사 순위 — 근속·급여 (${연도}) · SeoulMarkets</title>
<style>
:root{
  --bg:#fff; --fg:#14171c; --dim:#5b6470; --faint:#8b949e; --line:#e3e7ec;
  --card:#f7f9fb; --bar:#cfe0f7; --bar-s:#2f6fd0; --neg:#fbd5c4; --neg-s:#c2410c;
  --hd:#fff; --hover:#f2f6fb; --focus:#2f6fd0;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#0f1216; --fg:#e8ecf1; --dim:#95a0ad; --faint:#6b7684; --line:#242a32;
  --card:#161b21; --bar:#1e3a5f; --bar-s:#5b9bf5; --neg:#4a2415; --neg-s:#fb923c;
  --hd:#0f1216; --hover:#171d25; --focus:#5b9bf5; }}
:root[data-theme="light"]{--bg:#fff;--fg:#14171c;--dim:#5b6470;--faint:#8b949e;--line:#e3e7ec;
  --card:#f7f9fb;--bar:#cfe0f7;--bar-s:#2f6fd0;--neg:#fbd5c4;--neg-s:#c2410c;--hd:#fff;--hover:#f2f6fb;--focus:#2f6fd0;}
:root[data-theme="dark"]{--bg:#0f1216;--fg:#e8ecf1;--dim:#95a0ad;--faint:#6b7684;--line:#242a32;
  --card:#161b21;--bar:#1e3a5f;--bar-s:#5b9bf5;--neg:#4a2415;--neg-s:#fb923c;--hd:#0f1216;--hover:#171d25;--focus:#5b9bf5;}

*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);margin:0;
 font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif;
 -webkit-text-size-adjust:100%;}
.wrap{max-width:1180px;margin:0 auto;padding:2.25rem 1rem 5rem}
h1{font-size:clamp(1.5rem,4.5vw,2.2rem);letter-spacing:-.025em;margin:0 0 .35rem;line-height:1.2}
.sub{color:var(--dim);font-size:.92rem;margin:0 0 1.5rem}
.lede{font-size:1.02rem;border-left:3px solid var(--bar-s);padding-left:.95rem;margin:0 0 1.75rem;color:var(--fg)}
p,li{overflow-wrap:break-word}

/* ── 조작부 — 여기가 이 지면의 본체다. 눈에 먼저 들어와야 한다 ── */
.ctl{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1rem;
 display:grid;gap:.85rem;grid-template-columns:repeat(auto-fit,minmax(min(14rem,100%),1fr));margin:0 0 1.25rem}
.ctl label{display:block;font-size:.76rem;color:var(--dim);letter-spacing:.05em;
 text-transform:uppercase;font-weight:600;margin:0 0 .3rem}
.ctl select,.ctl input{width:100%;padding:.55rem .65rem;font-size:.95rem;font-family:inherit;
 background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:8px}
.ctl select:focus,.ctl input:focus{outline:2px solid var(--focus);outline-offset:1px;border-color:var(--focus)}
.hint{color:var(--faint);font-size:.78rem;margin:.3rem 0 0;line-height:1.4}

.meta{display:flex;flex-wrap:wrap;gap:.4rem 1.1rem;color:var(--dim);font-size:.86rem;margin:0 0 .6rem}
.meta b{color:var(--fg);font-variant-numeric:tabular-nums}

/* ── 표그래프 ─────────────────────────────────────────────── */
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px;background:var(--bg)}
table{border-collapse:separate;border-spacing:0;width:100%;min-width:660px;font-size:.9rem}
thead th{position:sticky;top:0;z-index:2;background:var(--hd);border-bottom:1px solid var(--line);
 padding:.6rem .7rem;text-align:right;white-space:nowrap;font-size:.76rem;color:var(--dim);
 font-weight:600;letter-spacing:.03em;cursor:pointer;user-select:none}
thead th:first-child,thead th:nth-child(2){text-align:left}
thead th:hover{color:var(--fg);background:var(--hover)}
thead th[aria-sort]{color:var(--bar-s)}
thead th .ar{font-size:.7rem;margin-left:.2rem;opacity:.5}
thead th[aria-sort] .ar{opacity:1}
tbody td{padding:.5rem .7rem;border-bottom:1px solid var(--line);text-align:right;
 font-variant-numeric:tabular-nums;white-space:nowrap}
tbody tr:hover{background:var(--hover)}
tbody tr:last-child td{border-bottom:0}
td.rk{color:var(--faint);width:3rem;text-align:right}
td.nm{text-align:left;white-space:normal;min-width:11rem}
td.nm b{font-weight:600;display:block;line-height:1.3}
td.nm span{color:var(--faint);font-size:.75rem;display:block;line-height:1.3}

/* 주 기준 칸 — 막대를 칸 배경에 깐다. 숫자는 그 위에 뜬다 */
td.key{position:relative;font-weight:600;min-width:9rem;overflow:hidden}
td.key .fill{position:absolute;inset:0 auto 0 0;background:var(--bar);z-index:0;border-radius:0 3px 3px 0}
td.key .fill.n{background:var(--neg)}
td.key .v{position:relative;z-index:1;padding-left:.2rem}
td.key .v.n{color:var(--neg-s)}
td.dim{color:var(--dim);font-weight:400}
.none{color:var(--faint)}
.warn{color:var(--neg-s);font-size:.8em;cursor:help}

.empty{padding:2.5rem 1rem;text-align:center;color:var(--dim)}
.more{display:block;width:100%;margin:.8rem 0 0;padding:.7rem;font:inherit;font-size:.9rem;
 background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:10px;cursor:pointer}
.more:hover{background:var(--hover);border-color:var(--bar-s)}
.more[hidden]{display:none}

.note{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--neg-s);
 border-radius:10px;padding:1rem 1.1rem;margin:2rem 0 0;font-size:.9rem;line-height:1.7}
.note b{display:block;margin:0 0 .35rem}
footer{margin-top:3rem;padding-top:1.1rem;border-top:1px solid var(--line);color:var(--dim);font-size:.83rem}

@media (max-width:560px){ .wrap{padding:1.5rem .7rem 4rem} .ctl{padding:.8rem} }
@media print{
  :root{--bg:#fff;--fg:#000;--dim:#444;--line:#bbb;--card:#fff;--bar:#e5e5e5;--hover:#fff}
  .ctl,.more{display:none} .tw{overflow:visible;border:0} table{min-width:0;font-size:9pt}
  thead th{position:static} tbody tr{break-inside:avoid}
}
</style>

<div class="wrap">
<h1>상장사 순위 — 근속·급여</h1>
<p class="sub">${연도}년 사업보고서 「직원 등의 현황」 · 회사가 금융감독원에 직접 신고한 값</p>

<p class="lede">「이 회사 가면 몇 년이나 다니나」, 「얼마나 받나」는 지금까지 <b>감으로만</b> 오갔다.
숫자는 이미 <b>법정 공시항목</b>으로 신고돼 있었다. 추정치가 아니라 원본이다.</p>

<div class="ctl">
  <div>
    <label for="m">순위 기준</label>
    <select id="m"></select>
    <p class="hint" id="mh"></p>
  </div>
  <div>
    <label for="d">정렬</label>
    <select id="d">
      <option value="desc">내림차순 — 큰 것부터</option>
      <option value="asc">오름차순 — 작은 것부터</option>
    </select>
    <p class="hint">표 머리를 눌러도 바뀐다. 같은 칸을 다시 누르면 뒤집힌다.</p>
  </div>
  <div>
    <label for="n">최소 직원 수</label>
    <select id="n">
      <option value="100" selected>100명 이상</option>
      <option value="300">300명 이상</option>
      <option value="1000">1,000명 이상</option>
      <option value="30">30명 이상</option>
      <option value="0">전부 (표본 작은 곳 포함)</option>
    </select>
    <p class="hint">직원 3명 회사의 「평균 근속 20년」은 창업자 둘이라는 뜻이다.</p>
  </div>
  <div>
    <label for="q">회사 찾기</label>
    <input id="q" type="search" placeholder="이름·종목코드·영문" autocomplete="off">
    <p class="hint" id="qh">비우면 전체 순위.</p>
  </div>
  <div>
    <label for="ind">업종</label>
    <select id="ind"><option value="">전체 업종</option></select>
    <p class="hint">한국표준산업분류 중분류. <b>DART 신고 코드를 앞 2자리로 묶었다</b> —
      회사마다 2~5자리로 제각각 신고해서 그대로는 갈라진다.</p>
  </div>
  <div>
    <label for="reg">지역</label>
    <select id="reg"><option value="">전국</option></select>
    <p class="hint">본사 주소 기준. 공장·연구소 위치가 아니다.</p>
  </div>
  <div>
    <label for="o">단위 오기입 의심</label>
    <select id="o">
      <option value="1" selected>제외 — 권장</option>
      <option value="0">포함해서 보기</option>
    </select>
    <p class="hint">회사가 개월을 년 칸에, 천원을 원 칸에 적은 것이 섞여 있다.
      <b id="ocnt">—</b>개사. <b>고치지 않고 걸러만 뒀다.</b></p>
  </div>
</div>

<p class="meta"><span>대상 <b id="cnt">—</b>개사</span><span>평균 <b id="avg">—</b></span>
 <span>1위 <b id="top">—</b></span><span>중간값 <b id="med">—</b></span></p>

<div class="tw"><table>
  <thead><tr id="hd"></tr></thead>
  <tbody id="tb"></tbody>
</table></div>
<button class="more" id="more" hidden>더 보기</button>
<div class="empty" id="empty" hidden>조건에 맞는 회사가 없다. 최소 직원 수를 낮추거나 검색어를 지운다.</div>

<div class="note">
  <b>⚠ 이 표를 읽을 때</b>
  · <b>근속연수는 이직률이 아니다.</b> 빠르게 채용한 회사는 평균이 내려간다.
    잘 다녀서 긴 것과 안 뽑아서 긴 것이 같은 숫자로 보인다.<br>
  · 1인평균급여는 회사 신고값이다. 성과급·스톡옵션 반영 방식이 회사마다 다르다.<br>
  · 지주회사·투자회사는 직원이 적고 급여가 높게 잡힌다. 사업회사와 나란히 놓고 보면 안 된다.<br>
  · 값이 없는 회사는 「—」다. <b>0 으로 세지 않았다.</b><br>
  · <b>투자 자문이 아니다.</b>
</div>

<footer>출처 — 금융감독원 전자공시(DART) 사업보고서 「직원 등의 현황」 · 기준 ${연도}년 · 집계 SeoulMarkets<br>
SeoulMarkets · seoulmarkets.com</footer>
</div>

<script>
const 자료 = ${자료};
const 축 = ${축JSON};
const $ = (id) => document.getElementById(id);
let 기준 = '근속', 방향 = 'desc', 보임 = 50;

/* 숫자 표기. ⚠ 억 단위로 접는 건 **급여만** 이다. 근속연수를 억으로 접으면 안 된다 */
function 꼴(v, 단위){
  if (v == null) return '<span class="none">—</span>';
  if (단위 === '원') return (v/1e8).toFixed(2) + '억';
  if (단위 === '%') return v.toFixed(1) + '%';
  if (단위 === '명') return v.toLocaleString();
  return v.toFixed(1);
}

function 고른것(){
  const 최소 = +$('n').value;
  const 이상빼기 = $('o').value === '1';
  const 업종 = $('ind').value;
  const 지역 = $('reg').value;
  const q = $('q').value.trim().toLowerCase();
  return 자료.filter((r) => {
    if (r[기준] == null) return false;                  /* 값 없는 곳은 순위에 못 넣는다 */
    if (이상빼기 && r.이상) return false;               /* 단위 오기입 의심 — 기본 제외 */
    if (최소 && (r.인원 ?? 0) < 최소) return false;
    if (업종 && r.업종 !== 업종) return false;
    if (지역 && r.시도 !== 지역) return false;
    if (!q) return true;
    return (r.이름||'').toLowerCase().includes(q)
        || (r.영문||'').toLowerCase().includes(q)
        || (r.종목||'').includes(q);
  }).sort((a,b) => 방향==='desc' ? b[기준]-a[기준] : a[기준]-b[기준]);
}

function 머리(){
  const 칸 = [['','rk'],['회사','nm'],...축.map(a=>[a.이름,a.키])];
  $('hd').innerHTML = 칸.map(([이름,키]) => {
    if (!이름) return '<th></th>';
    if (키==='nm') return '<th>회사</th>';
    const 현재 = 키===기준;
    const 화살 = 현재 ? (방향==='desc'?'▼':'▲') : '↕';
    return \`<th data-k="\${키}"\${현재?\` aria-sort="\${방향==='desc'?'descending':'ascending'}"\`:''}>\${이름}<span class="ar">\${화살}</span></th>\`;
  }).join('');
  $('hd').querySelectorAll('th[data-k]').forEach((th) => {
    th.onclick = () => {
      const k = th.dataset.k;
      if (k === 기준) 방향 = 방향==='desc' ? 'asc' : 'desc';
      else { 기준 = k; 방향 = (축.find(a=>a.키===k)||{}).방향 || 'desc'; }
      $('m').value = 기준; $('d').value = 방향; 보임 = 50; 그리기();
    };
  });
}

function 그리기(){
  머리();
  const 축정보 = 축.find(a => a.키 === 기준) || 축[0];
  $('mh').textContent = 축정보.설명 || '';
  const 행 = 고른것();
  $('empty').hidden = 행.length > 0;

  /* 막대 길이의 기준. **음수가 있는 축은 절대값 최대**로 잡아야 좌우가 안 뒤집힌다 */
  const 값들 = 행.map(r => r[기준]);
  const 최대 = Math.max(...값들.map(Math.abs), 0) || 1;
  const 합 = 값들.reduce((s,v)=>s+v,0);
  const 정렬값 = [...값들].sort((a,b)=>a-b);
  $('cnt').textContent = 행.length.toLocaleString();
  $('ocnt').textContent = 자료.filter(r=>r.이상).length.toLocaleString();
  $('avg').textContent = 행.length ? 꼴(+(합/행.length).toFixed(2), 축정보.단위).replace(/<[^>]+>/g,'') : '—';
  $('med').textContent = 행.length ? 꼴(정렬값[Math.floor(정렬값.length/2)], 축정보.단위).replace(/<[^>]+>/g,'') : '—';
  $('top').textContent = 행.length ? (행[0].이름 + ' ' + 꼴(행[0][기준], 축정보.단위).replace(/<[^>]+>/g,'')) : '—';

  const 곁 = 축.filter(a => a.키 !== 기준);
  $('tb').innerHTML = 행.slice(0, 보임).map((r,i) => {
    const v = r[기준], 음 = v < 0;
    const w = (Math.abs(v)/최대*100).toFixed(1);
    return \`<tr>
      <td class="rk">\${i+1}</td>
      <td class="nm"><b>\${거르기(r.이름)}\${r.이상 ? \` <span class="warn" title="신고 단위 오기입 의심 — \${r.이상.join(', ')}">⚠</span>\` : ''}</b><span>\${거르기(r.영문)} · \${거르기(r.종목)}</span></td>
      <td class="key"><span class="fill\${음?' n':''}" style="width:\${w}%"></span><span class="v\${음?' n':''}">\${꼴(v,축정보.단위)}</span></td>
      \${곁.map(a => \`<td class="dim">\${꼴(r[a.키], a.단위)}</td>\`).join('')}
    </tr>\`;
  }).join('');
  $('more').hidden = 보임 >= 행.length;
  $('more').textContent = '더 보기 — ' + (행.length - 보임).toLocaleString() + '개 남음';
}

/* ⚠ 회사명에 &·< 가 들어간다(SK C&C 꼴). 안 거르면 표가 깨진다 */
function 거르기(s){
  return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

$('m').innerHTML = 축.map(a => \`<option value="\${a.키}">\${a.이름}\${a.단위&&a.단위!=='원'?' ('+a.단위+')':''}</option>\`).join('');
$('m').value = 기준;
$('m').onchange = () => { 기준 = $('m').value; 방향 = (축.find(a=>a.키===기준)||{}).방향||'desc'; $('d').value=방향; 보임=50; 그리기(); };
$('d').onchange = () => { 방향 = $('d').value; 보임=50; 그리기(); };
$('n').onchange = () => { 보임=50; 그리기(); };
$('o').onchange = () => { 보임=50; 그리기(); };

/* 업종·지역 선택지는 **자료에 실제로 있는 것만** 넣는다. 고를 수 없는 칸을 만들지 않는다 */
function 목록채우기(id, 키, 이름키){
  const 셈 = new Map();
  for (const r of 자료){
    const v = r[키];
    if (!v) continue;
    const nm = 이름키 ? (r[이름키] ?? v) : v;
    const cur = 셈.get(v) ?? { 이름: nm, n: 0 };
    cur.n++; 셈.set(v, cur);
  }
  if (!셈.size) { $(id).closest('div').style.display = 'none'; return; }   /* 자료가 아직 없으면 칸을 숨긴다 */
  const 첫 = $(id).options[0].outerHTML;
  $(id).innerHTML = 첫 + [...셈].sort((a,b)=>b[1].n-a[1].n)
    .map(([v,o]) => '<option value="'+v+'">'+거르기(o.이름)+' ('+o.n+')</option>').join('');
}
목록채우기('ind','업종','업종명');
목록채우기('reg','시도');
$('ind').onchange = () => { 보임=50; 그리기(); };
$('reg').onchange = () => { 보임=50; 그리기(); };
let 타이머; $('q').oninput = () => { clearTimeout(타이머); 타이머=setTimeout(()=>{보임=50;그리기();},150); };
$('more').onclick = () => { 보임 += 100; 그리기(); };
그리기();
</script>`;
}

function main() {
  const i = process.argv.indexOf('--year');
  const 연도 = i > -1 ? process.argv[i + 1] : '2025';
  const 원천 = path.resolve(`archive/raw/dart-employment/employment-${연도}.ndjson`);
  if (!existsSync(원천)) { console.error(`✕ ${원천} 이 없다. npm run collect:tenure 를 먼저.`); process.exit(1); }
  /* 곁자료 — 없으면 없는 대로 간다. 수집이 도는 중에도 순위표는 살아 있어야 한다 */
  const 회사파일 = path.resolve('archive/raw/dart-company/company.ndjson');
  const 임원파일 = path.resolve(`archive/raw/dart-executives/executives-${연도}.ndjson`);
  const 회사표 = existsSync(회사파일) ? 읽기(회사파일) : [];
  const 임원표 = existsSync(임원파일) ? 읽기(임원파일) : [];
  console.log(`곁자료 — 기업정보 ${회사표.length.toLocaleString()} · 임원 ${임원표.length.toLocaleString()}`);

  const 행 = 곁붙이기(가공(읽기(원천)), 회사표, 임원표);
  mkdirSync(path.resolve('archive/report'), { recursive: true });
  const 산출 = path.resolve(`archive/report/ranking-${연도}.html`);
  writeFileSync(산출, 만들기(행, 연도));
  const 크기 = (readFileSync(산출).length / 1024).toFixed(0);
  console.log(`회사 ${행.length.toLocaleString()} · 축 ${축.length}개 · ${크기}KB`);
  console.log(`✅ ${산출}`);
}

/* ⚠ argv[1] 이 없을 때(node -e 로 불러들일 때)를 막는다 — 시험이 여기서 죽었다 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
