#!/usr/bin/env node
/**
 * 근속·급여 **그래픽 리포트**를 만든다.
 *
 *   npm run report:tenure          → archive/report/tenure-{연도}.html
 *
 * ── 왜 손으로 SVG 를 그리나 ────────────────────────────────────
 * 차트 라이브러리를 안 쓴다. 이유가 셋이다.
 *   1. 우리 지면은 **자기완결**이어야 한다 — 외부 스크립트를 못 부른다
 *   2. 라이브러리 기본 스타일은 늘 **우리 그릇과 따로 논다**
 *   3. 사장님 필수지시 —「그릇이 내용물을 결정한다」. 남의 기본값을 쓰는 건 그 반대다
 *
 * ── 그래픽 설계 원칙 ──────────────────────────────────────────
 * · **가로 막대**로 간다. 회사명이 길어서 세로 막대는 이름이 눕는다. 누우면 못 읽는다
 * · 남/여를 **한 막대에 겹쳐** 놓는다. 두 개로 나누면 격차가 안 보인다.
 *   격차 자체가 이 데이터의 뉴스라서 격차가 **한눈에** 들어와야 한다
 * · 축 눈금을 최소로. 순위표는 **크기 비교**지 정밀 측정이 아니다
 * · 다크모드·인쇄·모바일 전부 대응. 셋 다 실제로 열어 본다
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 연도기본 = '2025';

export function 읽기(파일) {
  const 표 = [];
  for (const l of readFileSync(파일, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { 표.push(JSON.parse(l)); } catch { /* 깨진 줄은 버린다 */ }
  }
  return 표;
}

/**
 * ⚠ 표본이 너무 작은 회사를 빼야 한다.
 *   직원 3명짜리 회사의 「평균 근속 20년」은 창업자 둘이라는 뜻이지 근속이 좋은 게 아니다.
 *   순위표에 그런 게 1등으로 올라오면 표 전체를 못 믿게 된다.
 */
export const 최소인원 = 100;

export function 거르기(표) {
  return 표.filter((r) => r.근속 != null && r.인원 != null && r.인원 >= 최소인원);
}

const 이스케이프 = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const 억 = (v) => (v == null ? '—' : `${(v / 1e8).toFixed(2)}억`);

/**
 * 가로 막대 하나. 남/여를 겹쳐 그린다.
 * ⚠ 폭을 px 로 고정하지 않고 **viewBox + 100% 폭**으로 간다.
 *   px 로 박으면 좁은 화면에서 가로로 밀린다 — 이 사이트에서 이미 한 번 크게 데였다.
 */
function 막대들(행들, 최대, 색) {
  const 줄높이 = 34, 좌 = 210, 우 = 40, 폭 = 1000;
  const 그릴폭 = 폭 - 좌 - 우;
  const 높이 = 행들.length * 줄높이 + 8;
  const 몸통 = 행들.map((r, i) => {
    const y = i * 줄높이 + 4;
    const w = Math.max(2, (r.근속 / 최대) * 그릴폭);
    const wm = r.근속남 != null ? Math.max(1, (r.근속남 / 최대) * 그릴폭) : null;
    const wf = r.근속여 != null ? Math.max(1, (r.근속여 / 최대) * 그릴폭) : null;
    return `
    <g class="row">
      <text x="${좌 - 10}" y="${y + 17}" class="lbl" text-anchor="end">${이스케이프(r.이름)}</text>
      <rect x="${좌}" y="${y + 5}" width="${w.toFixed(1)}" height="16" rx="3" class="${색}"/>
      ${wm != null ? `<line x1="${(좌 + wm).toFixed(1)}" y1="${y + 1}" x2="${(좌 + wm).toFixed(1)}" y2="${y + 25}" class="tick-m"/>` : ''}
      ${wf != null ? `<line x1="${(좌 + wf).toFixed(1)}" y1="${y + 1}" x2="${(좌 + wf).toFixed(1)}" y2="${y + 25}" class="tick-f"/>` : ''}
      <text x="${(좌 + w + 8).toFixed(1)}" y="${y + 17}" class="val">${r.근속.toFixed(1)}</text>
    </g>`;
  }).join('');
  /* 눈금은 5년 간격 세로선만. 숫자를 많이 쓰면 막대를 가린다 */
  const 눈금 = [];
  for (let v = 5; v <= 최대; v += 5) {
    const x = 좌 + (v / 최대) * 그릴폭;
    눈금.push(`<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${높이}" class="grid"/><text x="${x.toFixed(1)}" y="${높이 + 14}" class="ax" text-anchor="middle">${v}년</text>`);
  }
  return `<svg viewBox="0 0 ${폭} ${높이 + 22}" width="100%" role="img" aria-label="평균 근속연수 순위">${눈금.join('')}${몸통}</svg>`;
}

export function 만들기(표, 연도) {
  const 쓸것 = 거르기(표);
  const 정렬 = [...쓸것].sort((a, b) => b.근속 - a.근속);
  const 상위 = 정렬.slice(0, 30);
  const 하위 = 정렬.slice(-15).reverse();
  const 최대 = Math.ceil((상위[0]?.근속 ?? 20) / 5) * 5;

  /* 성별 격차 — 이게 이 데이터의 진짜 기사다 */
  const 격차있는 = 쓸것.filter((r) => r.근속남 != null && r.근속여 != null);
  const 격차 = 격차있는.map((r) => ({ ...r, 차: +(r.근속남 - r.근속여).toFixed(2) })).sort((a, b) => b.차 - a.차);
  const 평균차 = 격차있는.length
    ? +(격차있는.reduce((s, r) => s + (r.근속남 - r.근속여), 0) / 격차있는.length).toFixed(2) : null;
  const 여자가긴곳 = 격차.filter((r) => r.차 < 0).length;

  const 전체평균 = +(쓸것.reduce((s, r) => s + r.근속, 0) / (쓸것.length || 1)).toFixed(2);
  const 급여있는 = 쓸것.filter((r) => r.급여남 != null && r.급여여 != null);
  const 급여격차 = 급여있는.map((r) => ({ ...r, 비: r.급여여 / r.급여남 })).sort((a, b) => a.비 - b.비);

  const 표행 = (행들, 셈) => 행들.map((r, i) => `
    <tr><td class="rk">${i + 1}</td><td class="nm">${이스케이프(r.이름)}<span class="en">${이스케이프(r.영문 ?? '')}</span></td>
    <td class="n">${r.인원?.toLocaleString() ?? '—'}</td>
    <td class="n">${r.근속?.toFixed(1) ?? '—'}</td>
    <td class="n">${r.근속남?.toFixed(1) ?? '—'}</td>
    <td class="n">${r.근속여?.toFixed(1) ?? '—'}</td>
    <td class="n">${셈 ? 셈(r) : 억(r.급여남)}</td></tr>`).join('');

  return `<title>상장사 평균 근속연수 ${연도} — SeoulMarkets</title>
<style>
  :root{
    --bg:#fff; --fg:#14171c; --dim:#5b6470; --line:#e3e7ec; --card:#f7f9fb;
    --bar:#2f6fd0; --bar2:#c2410c; --m:#0f172a; --f:#be185d; --grid:#eef1f5;
  }
  @media (prefers-color-scheme:dark){
    :root{ --bg:#0f1216; --fg:#e8ecf1; --dim:#95a0ad; --line:#242a32; --card:#161b21;
           --bar:#5b9bf5; --bar2:#fb923c; --m:#cbd5e1; --f:#f9a8d4; --grid:#1d232b; }
  }
  :root[data-theme="light"]{ --bg:#fff; --fg:#14171c; --dim:#5b6470; --line:#e3e7ec; --card:#f7f9fb;
    --bar:#2f6fd0; --bar2:#c2410c; --m:#0f172a; --f:#be185d; --grid:#eef1f5; }
  :root[data-theme="dark"]{ --bg:#0f1216; --fg:#e8ecf1; --dim:#95a0ad; --line:#242a32; --card:#161b21;
    --bar:#5b9bf5; --bar2:#fb923c; --m:#cbd5e1; --f:#f9a8d4; --grid:#1d232b; }

  body{ background:var(--bg); color:var(--fg); margin:0;
        font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic","Apple SD Gothic Neo",sans-serif;
        -webkit-text-size-adjust:100%; }
  .wrap{ max-width:1060px; margin:0 auto; padding:2.5rem 1.25rem 5rem; }
  h1{ font-size:clamp(1.6rem,4.5vw,2.4rem); line-height:1.25; letter-spacing:-.02em; margin:0 0 .5rem; }
  h2{ font-size:clamp(1.15rem,3vw,1.5rem); margin:3.5rem 0 .4rem; letter-spacing:-.015em; }
  .sub{ color:var(--dim); margin:0 0 2rem; font-size:.94rem; }
  .lede{ font-size:1.06rem; border-left:3px solid var(--bar); padding-left:1rem; margin:1.5rem 0 0; }
  p{ overflow-wrap:break-word; }

  .kpi{ display:grid; grid-template-columns:repeat(auto-fit,minmax(min(11rem,100%),1fr));
        gap:.75rem; margin:2rem 0 0; }
  .kpi div{ background:var(--card); border:1px solid var(--line); border-radius:10px; padding:.9rem 1rem; }
  .kpi b{ display:block; font-size:clamp(1.5rem,4vw,2rem); line-height:1.1; letter-spacing:-.03em; }
  .kpi span{ color:var(--dim); font-size:.82rem; }

  figure{ margin:1.2rem 0 0; }
  figcaption{ color:var(--dim); font-size:.85rem; margin:.6rem 0 0; }
  .chart{ overflow-x:auto; }
  svg{ display:block; min-width:600px; }
  .lbl{ font-size:13px; fill:var(--fg); }
  .val{ font-size:12px; fill:var(--dim); }
  .ax{ font-size:11px; fill:var(--dim); }
  .grid{ stroke:var(--grid); stroke-width:1; }
  .b1{ fill:var(--bar); } .b2{ fill:var(--bar2); }
  .tick-m{ stroke:var(--m); stroke-width:2; } .tick-f{ stroke:var(--f); stroke-width:2; }
  .row:hover .lbl{ font-weight:700; }

  .key{ display:flex; flex-wrap:wrap; gap:1rem; color:var(--dim); font-size:.85rem; margin:.8rem 0 0; }
  .key i{ display:inline-block; width:14px; height:3px; vertical-align:middle; margin-right:.35rem; }

  .tblwrap{ overflow-x:auto; margin:1rem 0 0; }
  table{ border-collapse:collapse; width:100%; font-size:.9rem; min-width:560px; }
  th,td{ padding:.5rem .6rem; border-bottom:1px solid var(--line); text-align:left; overflow-wrap:break-word; }
  th{ color:var(--dim); font-weight:600; font-size:.8rem; text-transform:uppercase; letter-spacing:.04em; }
  td.n,th.n{ text-align:right; font-variant-numeric:tabular-nums; }
  td.rk{ color:var(--dim); font-variant-numeric:tabular-nums; width:2.5rem; }
  .nm{ font-weight:600; } .en{ display:block; font-weight:400; color:var(--dim); font-size:.78rem; }

  .note{ background:var(--card); border:1px solid var(--line); border-left:3px solid var(--bar2);
         border-radius:8px; padding:1rem 1.15rem; margin:2rem 0 0; font-size:.92rem; }
  .note b{ display:block; margin-bottom:.35rem; }
  footer{ margin-top:4rem; padding-top:1.25rem; border-top:1px solid var(--line);
          color:var(--dim); font-size:.84rem; }

  @media print{
    :root{ --bg:#fff; --fg:#000; --dim:#444; --line:#bbb; --card:#fff; --grid:#ddd; }
    .wrap{ max-width:none; padding:0; }
    svg{ min-width:0; } .chart,.tblwrap{ overflow:visible; }
    h2,figure,table{ break-inside:avoid; }
  }
</style>

<div class="wrap">
<h1>상장사 평균 근속연수</h1>
<p class="sub">${연도}년 사업보고서 · 회사가 금융감독원에 직접 신고한 값 · 직원 ${최소인원}명 이상 ${쓸것.length.toLocaleString()}개사</p>

<p class="lede">「이 회사 가면 몇 년이나 다니나」는 지금까지 <b>감으로만</b> 오갔다.
숫자는 이미 <b>법정 공시항목</b>으로 신고돼 있었다. 추정이 아니라 원본이다.</p>

<div class="kpi">
  <div><b>${전체평균}년</b><span>전체 평균 근속</span></div>
  <div><b>${평균차 ?? '—'}년</b><span>남−여 평균 격차</span></div>
  <div><b>${여자가긴곳}개사</b><span>여성 근속이 더 긴 곳</span></div>
  <div><b>${쓸것.length.toLocaleString()}</b><span>집계 대상 회사</span></div>
</div>

<h2>근속이 긴 회사 30</h2>
<figure>
  <div class="chart">${막대들(상위, 최대, 'b1')}</div>
  <div class="key"><span><i class="tick-m" style="background:var(--m)"></i>남성</span>
    <span><i class="tick-f" style="background:var(--f)"></i>여성</span>
    <span>막대 = 전체(인원 가중평균)</span></div>
  <figcaption>세로 눈금 두 개가 남·여 각각의 근속이다. <b>둘이 벌어진 폭이 곧 성별 격차</b>다.</figcaption>
</figure>
<div class="tblwrap"><table>
  <thead><tr><th>#</th><th>회사</th><th class="n">직원</th><th class="n">근속</th><th class="n">남</th><th class="n">여</th><th class="n">1인평균급여(남)</th></tr></thead>
  <tbody>${표행(상위.slice(0, 15))}</tbody>
</table></div>

<h2>근속이 짧은 회사 15</h2>
<figure><div class="chart">${막대들(하위, 최대, 'b2')}</div>
<figcaption>짧다고 나쁜 것이 아니다. <b>빠르게 커진 회사는 신입이 많아 평균이 내려간다.</b>
이 표는 이직률이 아니라 근속 평균이다. 둘은 다르다.</figcaption></figure>

<h2>성별 근속 격차가 큰 회사 15</h2>
<div class="tblwrap"><table>
  <thead><tr><th>#</th><th>회사</th><th class="n">직원</th><th class="n">근속</th><th class="n">남</th><th class="n">여</th><th class="n">격차</th></tr></thead>
  <tbody>${표행(격차.slice(0, 15), (r) => `${r.차 > 0 ? '+' : ''}${r.차.toFixed(1)}년`)}</tbody>
</table></div>

<h2>여성 1인평균급여가 남성 대비 낮은 회사 15</h2>
<div class="tblwrap"><table>
  <thead><tr><th>#</th><th>회사</th><th class="n">직원</th><th class="n">근속</th><th class="n">남</th><th class="n">여</th><th class="n">여/남 급여</th></tr></thead>
  <tbody>${표행(급여격차.slice(0, 15), (r) => `${(r.비 * 100).toFixed(0)}%`)}</tbody>
</table></div>

<div class="note">
  <b>⚠ 이 표를 읽을 때</b>
  · <b>근속연수는 이직률이 아니다.</b> 빠르게 채용한 회사는 평균이 내려간다.
    이직률을 보려면 입·퇴사자 수가 필요하고, 그건 국민연금 사업장 자료에 있다(신청 예정).<br>
  · 직원 ${최소인원}명 미만은 뺐다. 3명짜리 회사의 「평균 근속 20년」은 창업자 둘이라는 뜻이다.<br>
  · 1인평균급여는 회사 신고값이다. 성과급·스톡옵션 반영 방식이 회사마다 다르다.<br>
  · <b>투자 자문이 아니다.</b>
</div>

<footer>
  출처 — 금융감독원 전자공시(DART) 사업보고서 「직원 등의 현황」 · 기준 ${연도}년 · 집계 SeoulMarkets<br>
  SeoulMarkets · seoulmarkets.com
</footer>
</div>`;
}

function main() {
  const i = process.argv.indexOf('--year');
  const 연도 = i > -1 ? process.argv[i + 1] : 연도기본;
  const 원천 = path.resolve(`archive/raw/dart-employment/employment-${연도}.ndjson`);
  if (!existsSync(원천)) { console.error(`✕ ${원천} 이 없다. npm run collect:tenure 를 먼저.`); process.exit(1); }
  const 표 = 읽기(원천);
  const 쓸것 = 거르기(표);
  mkdirSync(path.resolve('archive/report'), { recursive: true });
  const 산출 = path.resolve(`archive/report/tenure-${연도}.html`);
  writeFileSync(산출, 만들기(표, 연도));
  console.log(`받은 회사 ${표.length.toLocaleString()} · 집계 대상(${최소인원}명 이상, 근속 있음) ${쓸것.length.toLocaleString()}`);
  console.log(`✅ ${산출}`);
}

/* ⚠ argv[1] 이 없을 때(node -e 로 불러들일 때)를 막는다 — 시험이 여기서 죽었다 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
