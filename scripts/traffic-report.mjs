#!/usr/bin/env node
/**
 * 유입 보고 — R2 에 쌓인 집계를 읽어 **사람이 읽는 표**로 만든다.
 *
 *   npm run traffic              오늘·어제
 *   npm run traffic -- --days 7
 *
 * ── 왜 이게 같이 있어야 하나 ──────────────────────────────────
 * 3번이 회람에서 짚었다 — **「쓰이지 않는 도구는 없는 도구다」**
 * (`npm run inbox` 를 만들어 두고 한 번도 안 썼다).
 * 측정만 넣고 **읽는 길을 안 만들면** 같은 일이 된다. 그래서 같이 만든다.
 *
 * ⚠ 서버는 10분마다 R2 로 합친다. 방금 것은 아직 안 올라와 있을 수 있다.
 *   **지금 이 순간**이 궁금하면 `/admin/traffic` 을 본다(인증 필요).
 */

import { get, remoteEnabled } from '../src/lib/store.mjs';
import { 일별키 } from '../src/lib/traffic.mjs';
import { pathToFileURL } from 'node:url';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };

/** ⚠ 이 PC 는 이미 KST 다 */
const 날짜문자 = (d) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

async function main() {
  const 일수 = Number(arg('--days', 2));
  const 행 = [];
  const 본날 = [];
  for (let i = 0; i < 일수; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const 날 = 날짜문자(d);
    let 몸;
    try { 몸 = await get(일별키(날)); } catch { continue; }
    if (!몸) continue;
    본날.push(날);
    let j;
    try { j = JSON.parse(String(몸)); } catch { continue; }
    for (const [k, n] of Object.entries(j.집계 ?? {})) {
      const [host, 경로, 유입, 봇] = k.split('\t');
      행.push({ 날, host, 경로, 유입, 봇: 봇 === '1', 수: n });
    }
  }

  if (!행.length) {
    console.log(`쌓인 것이 없다. (R2 ${remoteEnabled ? '설정됨' : '미설정'})`);
    console.log('서버가 10분마다 올린다. 배포 직후면 아직 없는 게 정상이다.');
    console.log('지금 이 순간이 궁금하면 /admin/traffic (인증 필요).');
    return;
  }

  const 사람 = 행.filter((x) => !x.봇);
  const 봇 = 행.filter((x) => x.봇);
  const 합 = (a) => a.reduce((s, x) => s + x.수, 0);
  console.log(`날 ${본날.join(' · ')}`);
  console.log(`사람 ${합(사람).toLocaleString()} · 봇 ${합(봇).toLocaleString()}\n`);

  const 묶기 = (a, f) => {
    const m = new Map();
    for (const x of a) m.set(f(x), (m.get(f(x)) ?? 0) + x.수);
    return [...m].sort((p, q) => q[1] - p[1]);
  };
  const 표 = (제목, 목록, n = 12) => {
    console.log(`■ ${제목}`);
    if (!목록.length) { console.log('   (없음)'); return; }
    for (const [k, v] of 목록.slice(0, n)) console.log(`   ${String(v).padStart(6)}  ${k}`);
    console.log('');
  };

  표('사이트별 (사람)', 묶기(사람, (x) => x.host));
  표('유입 경로 (사람)', 묶기(사람, (x) => x.유입));
  표('많이 읽힌 지면 (사람)', 묶기(사람, (x) => `${x.host}${x.경로}`), 15);

  /* ⭐ 우리 마케팅은 「검색」과 「사이트 간 유입」 둘뿐이다. 그 둘을 따로 본다 */
  const 전체 = 합(사람) || 1;
  const 검색 = 합(사람.filter((x) => /google|naver|daum|bing|duckduckgo|yahoo/i.test(x.유입)));
  const 내부 = 합(사람.filter((x) => String(x.유입).startsWith('우리:')));
  const 직접 = 합(사람.filter((x) => x.유입 === '(직접)' || x.유입 === '(내부)'));
  console.log('■ ⭐ 우리 마케팅 두 축');
  console.log(`   검색 유입       ${String(검색).padStart(6)}  (${(검색 / 전체 * 100).toFixed(1)}%)`);
  console.log(`   사이트 간 유입   ${String(내부).padStart(6)}  (${(내부 / 전체 * 100).toFixed(1)}%)`);
  console.log(`   직접·내부       ${String(직접).padStart(6)}  (${(직접 / 전체 * 100).toFixed(1)}%)`);

  /* 기사별로 무엇이 데려오는가 — 「기사가 무엇을 가리키는지」를 정하려면 이게 필요하다 */
  const 기사 = 사람.filter((x) => x.경로.startsWith('/article/'));
  if (기사.length) 표('\n기사별 (사람)', 묶기(기사, (x) => x.경로.replace('/article/', '')), 15);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
