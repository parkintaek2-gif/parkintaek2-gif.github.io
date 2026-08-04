#!/usr/bin/env node
/**
 * 기사 「Tenure, female share and returns」의 숫자를 **다시 계산한다.**
 *
 *   node scripts/recheck-tenure-returns.mjs
 *
 * ── 왜 만드나 ────────────────────────────────────────────────────
 * 이 분석은 **저장된 스크립트 없이** 한 번 돌리고 기사만 남겼다.
 * 그래서 원자료가 바뀌었을 때 **다시 계산할 방법이 없었다.**
 * 「쓰이지 않는 도구는 없는 도구다」의 반대짝 —
 * **도구 없이 낸 숫자는 고칠 수도 없는 숫자다.** 그래서 이제 만든다.
 *
 * 2026-08-05 에 `합치기` 버그를 고쳤다(직원 수가 첫 부문만 세어졌다).
 * 여성비 = 여/인원 이므로 **이 기사도 영향권**이다.
 *
 * ⚠ 정의는 기사 methodology 를 그대로 옮긴다.
 *   · 2025-08-01 과 2026-08-03 **양쪽에 다 거래된** 회사만
 *   · 산업 통제는 상장사 **12곳 이상**인 산업만, 각 산업의 **중앙값** 대비
 *   · **스피어만** 순위상관 (극단 몇 개가 관계를 만들지 못하게)
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 시작일 = '20250801';
const 종료일 = '20260803';
const 최소산업 = 12;

/** 하루치 종가를 읽는다. 종목코드 → 종가 */
function 종가(날) {
  const p = path.resolve('archive/raw/stocks', `${날}.ndjson`);
  if (!existsSync(p)) throw new Error(`${날} 주가 파일이 없다`);
  const m = new Map();
  for (const l of readFileSync(p, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    let o; try { o = JSON.parse(l); } catch { continue; }
    /* ⚠ 열 이름을 짐작하지 않는다 — 실제 파일은 한글이다(`코드`·`종가`) */
    const 코드 = o.코드;
    const 값 = Number(String(o.종가 ?? '').replace(/,/g, ''));
    if (!코드 || !Number.isFinite(값) || 값 <= 0) continue;
    m.set(String(코드).replace(/^A/, '').padStart(6, '0'), 값);
  }
  return m;
}

/** 스피어만 순위상관. ⚠ 동점은 **평균 순위**를 준다 — 안 그러면 값이 부풀려진다 */
export function 스피어만(a, b) {
  const n = a.length;
  if (n < 3 || b.length !== n) return null;
  const 순위 = (v) => {
    const idx = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]);
    const r = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j++;
      const 평균 = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k][1]] = 평균;
      i = j + 1;
    }
    return r;
  };
  const ra = 순위(a), rb = 순위(b);
  const 평 = (v) => v.reduce((s, x) => s + x, 0) / n;
  const ma = 평(ra), mb = 평(rb);
  let 위 = 0, 아a = 0, 아b = 0;
  for (let i = 0; i < n; i++) { const x = ra[i] - ma, y = rb[i] - mb; 위 += x * y; 아a += x * x; 아b += y * y; }
  return 아a && 아b ? +(위 / Math.sqrt(아a * 아b)).toFixed(3) : null;
}

const 중앙 = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

function main() {
  const 인력 = readFileSync(path.resolve('archive/raw/dart-employment/employment-2025.ndjson'), 'utf8')
    .split('\n').filter((x) => x.trim()).map(JSON.parse);
  const 시작 = 종가(시작일), 끝 = 종가(종료일);
  console.log(`주가 ${시작일} ${시작.size.toLocaleString()}종목 · ${종료일} ${끝.size.toLocaleString()}종목`);

  /* 산업은 순위표 자료에서 가져온다 — 인력 파일에는 없다 */
  const R = JSON.parse(readFileSync(path.resolve('src/data/rankings.json'), 'utf8'));
  const ti = R.cols.indexOf('ticker'), ii = R.cols.indexOf('industry');
  const 산업 = new Map(R.rows.map((r) => [String(r[ti]).padStart(6, '0'), r[ii]]));

  const 표본 = [];
  for (const r of 인력) {
    const 코드 = String(r.종목 ?? '').padStart(6, '0');
    const a = 시작.get(코드), b = 끝.get(코드);
    if (!a || !b) continue;                       // 양쪽에 다 있어야 한다. 채워 넣지 않는다
    if (r.근속 == null || r.인원 == null || r.여 == null) continue;
    표본.push({
      코드, 이름: r.영문 ?? r.이름, 산업: 산업.get(코드) ?? null,
      근속: r.근속, 여성비: (r.여 / r.인원) * 100,
      수익률: (b / a - 1) * 100,
    });
  }
  console.log(`표본 ${표본.length.toLocaleString()}개사  (기사: 2,552)\n`);

  console.log('■ 전체 상관 (산업 통제 없음)');
  console.log(`   근속 ↔ 수익률   ${스피어만(표본.map((x) => x.근속), 표본.map((x) => x.수익률))}`);
  console.log(`   여성비 ↔ 수익률  ${스피어만(표본.map((x) => x.여성비), 표본.map((x) => x.수익률))}`);
  console.log(`   근속 ↔ 여성비   ${스피어만(표본.map((x) => x.근속), 표본.map((x) => x.여성비))}   (기사: −0.373)`);

  /* 5분위 표 — 기사의 첫 표 */
  const 분위 = [...표본].sort((a, b) => a.근속 - b.근속);
  const 크기 = Math.floor(분위.length / 5);
  console.log('\n■ 근속 5분위 (기사 첫 표)');
  console.log('   근속중앙   수익률중앙    여성비중앙   n');
  for (let i = 0; i < 5; i++) {
    const g = 분위.slice(i * 크기, i === 4 ? 분위.length : (i + 1) * 크기);
    console.log(`   ${중앙(g.map((x) => x.근속)).toFixed(1).padStart(6)}yr ` +
      `${중앙(g.map((x) => x.수익률)).toFixed(1).padStart(9)}% ` +
      `${중앙(g.map((x) => x.여성비)).toFixed(1).padStart(10)}% ${String(g.length).padStart(6)}`);
  }

  /* 산업 통제 — 각 회사를 **자기 산업 중앙값**과의 차이로 바꾼다 */
  const 산업별 = new Map();
  for (const x of 표본) { if (!x.산업) continue; (산업별.get(x.산업) ?? 산업별.set(x.산업, []).get(x.산업)).push(x); }
  const 쓸산업 = [...산업별].filter(([, v]) => v.length >= 최소산업);
  const 통제 = [];
  for (const [, v] of 쓸산업) {
    const m근 = 중앙(v.map((x) => x.근속)), m수 = 중앙(v.map((x) => x.수익률)), m여 = 중앙(v.map((x) => x.여성비));
    for (const x of v) 통제.push({ 근속: x.근속 - m근, 수익률: x.수익률 - m수, 여성비: x.여성비 - m여 });
  }
  console.log(`\n■ 산업 통제 후 — 산업 ${쓸산업.length}개 · ${통제.length.toLocaleString()}개사  (기사: 38개 · 2,451)`);
  console.log(`   근속 ↔ 수익률    ${스피어만(통제.map((x) => x.근속), 통제.map((x) => x.수익률))}   (기사: +0.127)`);
  console.log(`   여성비 ↔ 수익률   ${스피어만(통제.map((x) => x.여성비), 통제.map((x) => x.수익률))}   (기사: −0.061)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
