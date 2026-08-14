#!/usr/bin/env node
/**
 * **무엇이 조회를 만드나** — 동남아 조회수를 달 단위로 쪼갠다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   12개월 합은 「얼마나 읽히나」만 답한다. **언제 읽히나**를 못 답한다.
 *   ⭐ 우리가 물을 것은 「인기」가 아니라 **무엇이 조회를 만드나**다.
 *      경기가 있던 달에 뛰는가, 아니면 늘 고르게 읽히는가.
 *
 * ── ⛔ 이 수집기가 지키는 것 ───────────────────────────────────
 * ⛔ 뛰었다고 「경기 때문」이라 안 쓴다. 우리가 잰 것은 **달의 모양**뿐이다.
 *    까닭은 따로 대야 하고, 못 대면 「못 댔다」고 적는다.
 * ⛔ 못 잰 달을 0 으로 세지 않는다. 8/13 에 이 실수를 이미 한 번 했다.
 * ⚠ 몇 명만 잰다 — 926명 × 12달 × 4판은 남의 서버에 무리다. 위에서 20명.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 원자료 = 'archive/raw/wikipedia/sea-athletes.json';
const 결과 = 'archive/raw/wikipedia/sea-athletes-monthly.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 판들 = ['id', 'vi', 'th', 'ms'];
const 몇명 = 20;

/**
 * 🔴 **고른가, 한 달에 몰렸나.** 이것이 이 자료의 물음이다.
 *   가장 큰 달이 한 해 전체의 몇 %인가 — 12달이 완전히 고르면 8.3%.
 *   ⛔ 못 잰 달이 있으면 아예 안 낸다(null). 0 으로 세면 「고르다」가 거짓으로 커진다.
 */
export function 몰림(달값들) {
  if (!달값들?.length) return null;
  if (달값들.some((v) => v === null || v === undefined)) return null;
  const 합 = 달값들.reduce((a, b) => a + b, 0);
  if (!합) return null;
  return { peakSharePc: +((100 * Math.max(...달값들)) / 합).toFixed(1), total: 합, months: 달값들.length };
}

/** 고른 것의 기준선 — 12달이면 8.3%. 이보다 훨씬 크면 한 달에 몰린 것 */
export function 고른값(달수) { return +(100 / 달수).toFixed(1); }

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('몰림 — 완전히 고르면 기준선과 같다',
    몰림([1, 1, 1, 1]).peakSharePc, 25);
  재본다('몰림 — 한 달에 다 몰리면 100',
    몰림([0, 0, 8, 0]).peakSharePc, 100);
  재본다('🔴 몰림 — 못 잰 달이 있으면 아예 안 낸다', 몰림([1, undefined, 1]), null);
  재본다('🔴 몰림 — null 도 마찬가지', 몰림([1, null, 1]), null);
  재본다('몰림 — 다 0 이면 못 낸다', 몰림([0, 0, 0]), null);
  재본다('몰림 — 빈 것은 null', 몰림([]), null);
  재본다('고른값 — 12달이면 8.3', 고른값(12), 8.3);
  재본다('고른값 — 4달이면 25', 고른값(4), 25);
  재본다('몰림이 달 수를 같이 낸다', 몰림([1, 1]).months, 2);
  console.log(`달별 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

function 받기(길) {
  return new Promise((resolve) => {
    const req = https.request({ host: 'wikimedia.org', path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => { let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ code: res.statusCode, body: b })); });
    req.on('error', (e) => resolve({ code: 0, body: e.message }));
    req.setTimeout(45000, () => { req.destroy(); resolve({ code: 0, body: 'timeout' }); });
    req.end();
  });
}

async function 달별(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/20250801/20260731`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기(길);
    if (r.code === 404) return null;
    if (r.code === 200) {
      try {
        return JSON.parse(r.body).items.map((x) => ({ month: x.timestamp.slice(0, 6), views: x.views }));
      } catch { /* 다시 묻는다 */ }
    }
    await new Promise((s) => { setTimeout(s, 900 * (2 ** 번)); });
  }
  return undefined;
}

if (내가실행됐다) {
  const d = JSON.parse(fs.readFileSync(원자료, 'utf8'));
  const 뽑을 = d.people.slice(0, 몇명);
  console.log(`위에서 ${뽑을.length}명 × ${판들.length}판 × 12달\n`);

  const 줄들 = [];
  for (const x of 뽑을) {
    const byEdition = {};
    for (const p of 판들) {
      byEdition[p] = x.titles[p] ? await 달별(p, x.titles[p]) : null;
    }
    /* 동남아 넷을 합쳐 한 줄로 — 달마다 더한다. ⛔ 못 잰 판이 있으면 그 판을 뺀다 */
    const 달모음 = new Map();
    let 못잰판 = 0;
    for (const p of 판들) {
      const v = byEdition[p];
      if (v === undefined) { 못잰판 += 1; continue; }
      if (v === null) continue;
      for (const m of v) 달모음.set(m.month, (달모음.get(m.month) ?? 0) + m.views);
    }
    const 달차례 = [...달모음.keys()].sort();
    const 값들 = 달차례.map((m) => 달모음.get(m));
    줄들.push({
      name: x.name, sports: x.sports, role: x.role ?? 'player',
      months: 달차례, seaViews: 값들,
      peak: 달차례[값들.indexOf(Math.max(...값들))] ?? null,
      spread: 못잰판 ? null : 몰림(값들),
      editionsNotMeasured: 못잰판,
      byEdition,
    });
    process.stdout.write(`   ${줄들.length}/${뽑을.length} ${x.name}\n`);
  }

  const out = {
    generated: 지금(),
    source: 'Wikimedia Pageviews API, monthly, human traffic only',
    window: '2025-08 through 2026-07',
    unit: 'Reads of that person\'s article, summed across the Indonesian, Vietnamese, Thai and '
      + 'Malay Wikipedias, one row per month.',
    evenMonthSharePc: 고른값(12),
    people: 줄들,
    cannotAnswer: 'A month with more reads is a month with more reads. This does not say what '
      + 'caused it. Where we name a cause we name the source for it separately.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`\n⭐ ${결과}`);
  console.log(`고르면 한 달이 ${고른값(12)}% — 그보다 크면 한 달에 몰린 것\n`);
  console.log('이름'.padEnd(24) + '가장 큰 달   그 달의 몫   12달 합');
  for (const x of 줄들.sort((a, b) => (b.spread?.peakSharePc ?? 0) - (a.spread?.peakSharePc ?? 0))) {
    console.log(`${x.name.padEnd(24)}${(x.peak ?? '—').padEnd(11)}`
      + `${String(x.spread?.peakSharePc ?? '못 쟀다').padStart(8)}%`
      + `${String(x.spread?.total ?? '—').padStart(11)}  [${x.sports.join(',')}]`);
  }
}
