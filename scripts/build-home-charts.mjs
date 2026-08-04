#!/usr/bin/env node
/**
 * 첫 화면 그래픽 데이터 — **정적으로, 가볍게**.
 *
 *   npm run build:homecharts     → src/data/home-charts.json
 *
 * ── 사장님 지시(2026-08-04) ────────────────────────────────────
 *   「홈페이지 앞에 여러 그래픽들을 좀 실어주고, **정적으로** —
 *    뭐라는 병초를 하면 너무 무거우니까」
 *
 * 그래서 이렇게 한다.
 *   · **차트 라이브러리를 안 쓴다.** 200KB 를 부르지 않는다
 *   · 서버에서 **SVG 좌표까지 계산**해 둔다. 브라우저는 그리기만 한다
 *   · 자바스크립트 **0줄**. JS 가 꺼져 있어도 그래프가 보인다
 *   · 점을 **주 단위로 솎는다** — 1,616일을 다 그리면 SVG 가 무거워지고
 *     화면에서 구분도 안 된다. 사람이 읽을 수 있는 밀도가 있다
 *
 * ── ⚠ 지수 키는 계열+이름이다 ─────────────────────────────────
 * 「IT 서비스」가 코스피·코스닥 양쪽에 있다. 이름만으로 고르면 엉뚱한 걸 그린다.
 *
 * ── ⚠ 산출지수를 빼고 고른다 ──────────────────────────────────
 * K-샤프지수 같은 것은 거래량·시총이 0 이다. 「거래 안 되는 지수」라 첫 화면에 쓸 것이 아니다.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const IN_DIR = path.resolve('archive/raw/indices');
const OUT = path.resolve('src/data/home-charts.json');

/** 첫 화면에 세울 것. **적게 고른다** — 많이 얹으면 아무것도 안 보인다 */
const 고를것 = [
  { 이름: '코스피', 계열: 'KOSPI시리즈', 라벨: 'KOSPI' },
  { 이름: '전기전자', 계열: 'KOSPI시리즈', 라벨: 'Electronics' },
  { 이름: 'KRX 은행', 계열: 'KRX시리즈', 라벨: 'Banks' },
];

/** 점을 솎는다. 마지막 점은 **반드시 남긴다** — 최신값이 빠지면 그래프가 거짓말이 된다 */
export function 솎기(배열, 최대 = 130) {
  if (배열.length <= 최대) return 배열;
  const 간격 = Math.ceil(배열.length / 최대);
  const out = 배열.filter((_, i) => i % 간격 === 0);
  if (out[out.length - 1] !== 배열[배열.length - 1]) out.push(배열[배열.length - 1]);
  return out;
}

/**
 * 값 배열을 SVG polyline 좌표로 바꾼다.
 * ⚠ **0 을 바닥으로 잡지 않는다.** 지수는 0 근처에 안 가므로 0 기준이면 선이 납작해진다.
 *   최소~최대를 쓰되, 그 사실을 화면에 적는다(축이 0 에서 시작하지 않는다고).
 */
export function 선그리기(값들, 폭 = 640, 높이 = 120, 여백 = 4) {
  const 최소 = Math.min(...값들), 최대 = Math.max(...값들);
  const 폭당 = 값들.length > 1 ? (폭 - 여백 * 2) / (값들.length - 1) : 0;
  const 범위 = 최대 - 최소 || 1;
  return 값들.map((v, i) => {
    const x = 여백 + i * 폭당;
    const y = 여백 + (높이 - 여백 * 2) * (1 - (v - 최소) / 범위);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function main() {
  if (!existsSync(IN_DIR)) { console.error(`✕ ${IN_DIR} 가 없다. npm run collect:indices 를 먼저.`); process.exit(1); }
  const 파일 = readdirSync(IN_DIR).filter((f) => f.endsWith('.ndjson')).sort();
  /* 최근 2년만 그린다 — 6년을 한 줄에 그리면 최근 움직임이 안 보인다 */
  const 자름 = 파일.filter((f) => f >= '20240801');
  const 모음 = new Map();
  for (const f of 자름) {
    for (const l of readFileSync(path.join(IN_DIR, f), 'utf8').split('\n')) {
      if (!l.trim()) continue;
      const r = JSON.parse(l);
      if (r.산출지수 || !r.종가) continue;
      const k = `${r.계열}|${r.이름}`;
      if (!모음.has(k)) 모음.set(k, []);
      모음.get(k).push(r);
    }
  }

  const 시리즈 = [];
  for (const g of 고를것) {
    const s = (모음.get(`${g.계열}|${g.이름}`) ?? []).sort((a, b) => a.일자.localeCompare(b.일자));
    if (s.length < 20) { console.warn(`⚠ ${g.라벨} 자료가 ${s.length}건뿐이라 건너뛴다`); continue; }
    const 솎은 = 솎기(s);
    const 값 = 솎은.map((r) => r.종가);
    const 처음 = s[0], 끝 = s[s.length - 1];
    const 최대 = s.reduce((a, b) => (b.종가 > a.종가 ? b : a));
    시리즈.push({
      label: g.라벨,
      points: 선그리기(값),
      first: 처음.종가, last: 끝.종가,
      firstDate: 처음.일자, lastDate: 끝.일자,
      change: +((끝.종가 / 처음.종가 - 1) * 100).toFixed(1),
      peak: 최대.종가, peakDate: 최대.일자,
      fromPeak: +((끝.종가 / 최대.종가 - 1) * 100).toFixed(1),
      low: Math.min(...값), high: Math.max(...값),
      n: s.length,
    });
  }

  /* 업종 낙폭 막대 — 고점(6/22) 대비 지금. 있는 날만 쓴다 */
  const 고점일 = '20260622';
  const 마지막 = 자름[자름.length - 1].slice(0, 8);
  const 읽 = (d) => {
    const f = path.join(IN_DIR, `${d}.ndjson`);
    if (!existsSync(f)) return [];
    return readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  };
  const A = new Map(읽(고점일).map((r) => [`${r.계열}|${r.이름}`, r]));
  const 막대 = [];
  for (const r of 읽(마지막)) {
    if (r.산출지수 || !r.종가) continue;
    const a = A.get(`${r.계열}|${r.이름}`);
    if (!a?.종가) continue;
    막대.push({ 이름: r.이름, 계열: r.계열, 변화: +((r.종가 / a.종가 - 1) * 100).toFixed(1) });
  }
  막대.sort((a, b) => a.변화 - b.변화);

  const 영문 = {
    '전기전자': 'Electronics', 'KRX 반도체': 'Semiconductors', 'KRX 정보기술': 'Information technology',
    'KRX 은행': 'Banks', '제약': 'Pharmaceuticals', '음식료·담배': 'Food and tobacco',
    'KRX 필수소비재': 'Consumer staples', 'KRX 유틸리티': 'Utilities', '운송·창고': 'Transport',
    '코스피': 'KOSPI', '코스닥': 'KOSDAQ', 'KRX 300 필수소비재': 'Consumer staples (KRX 300)',
  };
  /* ⚠ 같은 영문 이름이 두 번 나오면 안 된다 — 「전기전자(KOSPI)」와 「KRX 정보기술」이
   *   둘 다 Electronics 로 번역돼 막대가 겹쳤다. **영문 이름 기준으로 한 번만** 남긴다. */
  const 본것 = new Set();
  const 후보 = 막대.filter((x) => {
    const en = 영문[x.이름];
    if (!en || 본것.has(en)) return false;
    본것.add(en); return true;
  });
  const 고른막대 = [...후보.slice(0, 4), ...후보.slice(-4)]
    .map((x) => ({ label: 영문[x.이름], value: x.변화 }));

  const 산출 = {
    generated: new Date().toLocaleString('sv-SE').replace('T', ' '),   /* ⚠ 이 PC 는 이미 KST */
    from: 자름[0].slice(0, 8), to: 마지막,
    peakDate: 고점일,
    series: 시리즈,
    sectors: 고른막대,
    sectorCount: 막대.length,
    sectorUp: 막대.filter((x) => x.변화 > 0).length,
    sectorMedian: 막대.length ? 막대[Math.floor(막대.length / 2)].변화 : null,
  };
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(산출));
  console.log(`시리즈 ${시리즈.length} · 업종막대 ${고른막대.length} · 비교지수 ${막대.length}개 (오른 것 ${산출.sectorUp})`);
  console.log(`  ${(readFileSync(OUT).length / 1024).toFixed(1)}KB  →  ${OUT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
