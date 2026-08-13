#!/usr/bin/env node
/**
 * **선수와 감독을 가른다.** — 사장님은 「프로스포츠선수」를 물으셨다.
 *
 * 🔴 첫 표에 신태용·박항서·김상식·김판곤이 위에 섰다. 넷 다 **감독**이다.
 *   섞으면 사장님 물음에 다른 답을 드리는 것이 된다. 그렇다고 버리지도 않는다 —
 *   ⭐ **인도네시아·말레이시아에서 제일 많이 읽히는 한국인이 선수가 아니라 감독**이라는 것 자체가
 *      이 자료의 발견이기 때문이다. 갈라서 **둘 다** 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const 자료길 = 'archive/raw/wikipedia/sea-athletes.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';

/**
 * 🔴 처음에 「겸직이면 선수」로 했더니 **감독이 0명**이 됐다.
 *   신태용·박항서·김상식은 현역 시절이 있어 Wikidata 에 선수·감독이 **둘 다** 적혀 있다.
 *   그래서 셋째 갈래를 만든다 — `both`.
 * ⚠ Wikidata 직업은 **지금 무엇인지를 말하지 않는다.** 「선수였고 지금 감독」과
 *   「감독이면서 선수」를 못 가른다. 그 말을 자료와 지면에 적는다. 억지로 하나로 안 민다.
 */
export const 감독말 = ['coach', 'manager'];

export function 무엇인가(직업들) {
  const 낮 = (직업들 ?? []).map((s) => s.toLowerCase());
  const 선수 = 낮.some((s) => s.includes('player') || s.includes('gamer')
    || s.includes('golfer') || s.includes('athlete') || s.includes('fighter'));
  const 감독 = 낮.some((s) => 감독말.some((w) => s.includes(w)));
  if (선수 && 감독) return 'both';
  if (선수) return 'player';
  if (감독) return 'coach';
  return 'other';
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('선수', 무엇인가(['association football player']), 'player');
  재본다('감독', 무엇인가(['association football coach']), 'coach');
  /* 🔴 여기서 틀렸다 — 「겸직이면 선수」로 했더니 감독이 0명이 됐다 */
  재본다('선수 겸 감독은 셋째 갈래다 — 안 민다',
    무엇인가(['association football coach', 'association football player']), 'both');
  재본다('감독만 적힌 사람은 감독', 무엇인가(['association football manager']), 'coach');
  재본다('프로게이머는 선수', 무엇인가(['professional gamer']), 'player');
  재본다('골퍼는 선수', 무엇인가(['golfer']), 'player');
  재본다('빈 것은 other', 무엇인가([]), 'other');
  재본다('모르는 것은 other', 무엇인가(['television presenter']), 'other');
  재본다('큰 글자도 본다', 무엇인가(['Association Football Coach']), 'coach');
  console.log(`역할 가르는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

function 받기(host, 길) {
  return new Promise((resolve) => {
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => { let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ code: res.statusCode, body: b })); });
    req.on('error', (e) => resolve({ code: 0, body: e.message }));
    req.setTimeout(90000, () => { req.destroy(); resolve({ code: 0, body: 'timeout' }); });
    req.end();
  });
}

if (내가실행됐다) {
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 다 = [...d.people, ...(d.couldNotMeasure ?? [])];
  const 직업 = new Map();

  for (let i = 0; i < 다.length; i += 120) {
    const 덩이 = 다.slice(i, i + 120);
    const q = `SELECT ?p (GROUP_CONCAT(DISTINCT ?occL; separator="|") AS ?occs) WHERE {
      VALUES ?p { ${덩이.map((x) => `wd:${x.q}`).join(' ')} }
      ?p wdt:P106 ?occ . ?occ rdfs:label ?occL . FILTER(lang(?occL)="en")
    } GROUP BY ?p`;
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(q)}`);
    if (r.code !== 200) { console.error(`⛔ SPARQL ${r.code}`); process.exit(1); }
    for (const 줄 of JSON.parse(r.body).results.bindings) {
      직업.set(줄.p.value.split('/').pop(), 줄.occs.value.split('|'));
    }
    process.stdout.write(`   ${Math.min(i + 120, 다.length)}/${다.length}\n`);
  }

  const 셈 = { player: 0, coach: 0, both: 0, other: 0 };
  for (const x of 다) {
    x.occupations = 직업.get(x.q) ?? [];
    x.role = 무엇인가(x.occupations);
    셈[x.role] += 1;
  }
  d.roleCounts = 셈;
  fs.writeFileSync(자료길, `${JSON.stringify(d, null, 2)}\n`);
  console.log(`\n⭐ 선수만 ${셈.player}명 · 감독만 ${셈.coach}명 · 선수겸감독 ${셈.both}명 · 그 밖 ${셈.other}명`);
}
