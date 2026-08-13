#!/usr/bin/env node
/**
 * **그 한 달은 해마다 오나** — 이스포츠 몰림을 여러 해에 걸쳐 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   78편에서 이스포츠 열한 명이 **전원 2025년 11월**에 몰렸다.
 *   ⚠ 그런데 한 해만 보고 「이스포츠는 원래 그렇다」고 하면 그것은 한 점으로 그은 선이다.
 *   ⭐ 그래서 **여러 해**를 본다. 해마다 같은 자리에 봉우리가 서면 그때 비로소 성질이다.
 *
 * ── ⛔ 이 수집기가 지키는 것 ───────────────────────────────────
 * ⛔ 못 잰 달을 0 으로 세지 않는다.
 * ⛔ 선수마다 **활동한 해가 다르다.** 데뷔 전 해의 0 을 「안 읽혔다」로 세면 몰림이 부풀려진다.
 *    → 그 해에 조회가 아예 없는 사람은 **그 해에서 뺀다.**
 * ⚠ 대회 날짜는 달력에서 받는다. 「때문」이라 쓰지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const 원자료 = 'archive/raw/wikipedia/sea-athletes.json';
const 결과 = 'archive/raw/wikipedia/worlds-years.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 판들 = ['id', 'vi', 'th', 'ms'];
const 해들 = [2021, 2022, 2023, 2024, 2025];
const 최소조회 = 300;      /* ⛔ 한 해 300 회가 안 되면 그 해는 안 본다 — 잡음이 봉우리가 된다 */

/**
 * 한 해 열두 달에서 가장 큰 달과 그 몫.
 *
 * 🔴 **8/13 에 여기서 거짓이 나왔다.** 2024년에 네 사람이 「12월 100%」로 찍혔는데,
 *   그것은 관심이 12월에 몰린 것이 아니라 **그 달에 문서가 생긴 것**이었다.
 *   ⛔ 「문서가 없던 달」과 「안 읽힌 달」을 섞으면 몰림이 통째로 부풀려진다.
 *   → 그 해가 **시작되기 전에도 읽힌 적이 있는지**를 같이 받아, 없으면 `partialYear` 로 표시하고
 *     만장일치 셈에서 뺀다. 버리지 않고 **왜 뺐는지 남긴다.**
 */
export function 해의봉우리(달값, 그해전에읽혔나 = true) {
  const 값 = Object.values(달값);
  if (!값.length) return null;
  if (값.some((v) => v === null || v === undefined)) return null;
  const 합 = 값.reduce((a, b) => a + b, 0);
  if (합 < 최소조회) return null;
  const 큰 = Math.max(...값);
  const 달 = Object.keys(달값).find((k) => 달값[k] === 큰);
  return {
    peakMonth: 달,
    peakSharePc: +((100 * 큰) / 합).toFixed(1),
    total: 합,
    monthsWithReads: 값.length,
    /** 🔴 참이면 이 해는 몰림을 못 읽는다 — 문서가 해 중간에 생겼다 */
    partialYear: !그해전에읽혔나,
  };
}

/**
 * 그 해에 몇 명이 같은 달에 섰나 — 이것이 물음이다.
 * ⛔ **해 중간에 생긴 문서는 안 센다.** 그 사람의 「봉우리」는 문서가 생긴 달이지 관심이 아니다.
 */
export function 만장일치인가(봉우리들) {
  const 있는것 = 봉우리들.filter((b) => b && !b.partialYear);
  if (!있는것.length) return null;
  const 셈 = new Map();
  for (const b of 있는것) 셈.set(b.peakMonth, (셈.get(b.peakMonth) ?? 0) + 1);
  const [달, 몇] = [...셈].sort((a, b) => b[1] - a[1])[0];
  return { month: 달, people: 있는것.length, sharing: 몇, allSame: 몇 === 있는것.length };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('해의봉우리 — 가장 큰 달', 해의봉우리({ '01': 100, 11: 900 }).peakMonth, '11');
  재본다('해의봉우리 — 몫', 해의봉우리({ '01': 100, 11: 900 }).peakSharePc, 90);
  재본다('🔴 해의봉우리 — 못 잰 달이 있으면 안 낸다', 해의봉우리({ '01': 100, 11: undefined }), null);
  재본다(`⛔ 해의봉우리 — 한 해 ${최소조회}회 미만은 안 본다`, 해의봉우리({ '01': 10 }), null);
  재본다('해의봉우리 — 빈 것은 null', 해의봉우리({}), null);
  재본다('만장일치인가 — 전원 같으면 참',
    만장일치인가([{ peakMonth: '11' }, { peakMonth: '11' }]).allSame, true);
  재본다('만장일치인가 — 하나라도 다르면 거짓',
    만장일치인가([{ peakMonth: '11' }, { peakMonth: '06' }]).allSame, false);
  재본다('만장일치인가 — 못 잰 사람(null)은 안 센다',
    만장일치인가([{ peakMonth: '11' }, null, { peakMonth: '11' }]).people, 2);
  재본다('만장일치인가 — 다 못 쟀으면 null', 만장일치인가([null, null]), null);
  /* 🔴 8/13 — 여기서 거짓이 나왔다. 2024년 「12월 100%」 넷은 문서가 그때 생긴 것이었다 */
  재본다('🔴 만장일치인가 — 해 중간에 생긴 문서는 안 센다',
    만장일치인가([{ peakMonth: '11' }, { peakMonth: '12', partialYear: true }]).people, 1);
  재본다('🔴 해의봉우리 — 그 전에 안 읽혔으면 partialYear',
    해의봉우리({ 12: 500 }, false).partialYear, true);
  재본다('해의봉우리 — 그 전에 읽혔으면 온전한 해',
    해의봉우리({ 12: 500 }, true).partialYear, false);
  재본다('해의봉우리 — 조회가 있던 달 수를 남긴다',
    해의봉우리({ 10: 200, 11: 400 }).monthsWithReads, 2);
  재본다('해 다섯', 해들.length, 5);
  console.log(`여러 해 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
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
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/20210101/20251231`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기(길);
    if (r.code === 404) return null;
    if (r.code === 200) {
      try { return JSON.parse(r.body).items.map((x) => ({ m: x.timestamp.slice(0, 6), v: x.views })); }
      catch { /* 다시 묻는다 */ }
    }
    await new Promise((s) => { setTimeout(s, 900 * (2 ** 번)); });
  }
  return undefined;
}

if (내가실행됐다) {
  const d = JSON.parse(fs.readFileSync(원자료, 'utf8'));
  const 이스포츠 = d.people.filter((x) => x.sports.includes('esports')).slice(0, 12);
  const 축구 = d.people.filter((x) => x.sports.includes('football') && x.role === 'player').slice(0, 10);
  const 뽑을 = [...이스포츠, ...축구];
  console.log(`이스포츠 ${이스포츠.length}명 · 축구 선수 ${축구.length}명 × ${판들.length}판 × 5해\n`);

  const 줄들 = [];
  for (const x of 뽑을) {
    const 달모음 = new Map();
    let 못잼 = false;
    for (const p of 판들) {
      if (!x.titles[p]) continue;
      const v = await 달별(p, x.titles[p]);
      if (v === undefined) { 못잼 = true; continue; }
      if (v === null) continue;
      for (const it of v) 달모음.set(it.m, (달모음.get(it.m) ?? 0) + it.v);
    }
    /* 🔴 그 해가 시작되기 전에도 읽힌 적이 있나 — 문서가 이미 있었다는 뜻이다 */
    const 읽힌달 = [...달모음.keys()].sort();
    const 첫달 = 읽힌달[0] ?? null;

    const 해별 = {};
    for (const y of 해들) {
      const 달값 = {};
      for (let mm = 1; mm <= 12; mm += 1) {
        const 열쇠 = `${y}${String(mm).padStart(2, '0')}`;
        if (달모음.has(열쇠)) 달값[String(mm).padStart(2, '0')] = 달모음.get(열쇠);
      }
      const 그해전에 = 첫달 !== null && 첫달 < `${y}01`;
      해별[y] = 못잼 ? null : 해의봉우리(달값, 그해전에);
    }
    줄들.push({ name: x.name, sports: x.sports, role: x.role, firstMonthWithReads: 첫달, byYear: 해별 });
    process.stdout.write(`   ${줄들.length}/${뽑을.length} ${x.name}\n`);
  }

  const 해요약 = 해들.map((y) => ({
    year: y,
    esports: 만장일치인가(줄들.filter((x) => x.sports.includes('esports')).map((x) => x.byYear[y])),
    football: 만장일치인가(줄들.filter((x) => x.sports.includes('football')).map((x) => x.byYear[y])),
  }));

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikimedia Pageviews API, monthly, human traffic only, four Southeast Asian editions summed',
    window: '2021 through 2025, calendar years',
    minReadsPerYear: 최소조회,
    people: 줄들,
    byYear: 해요약,
    cannotAnswer: 'A person with no reads in a year is left out of that year rather than counted '
      + 'as a flat one. Careers start and end inside this window.',
    /** 🔴 8/13 에 이 구멍이 자료를 거짓으로 만들었다. 자료가 스스로 말하게 남긴다 */
    whyPartialYearsAreExcluded: 'An article created midway through a year shows all of its reads '
      + 'in the months after it existed, which our measure would read as a spike. Four people '
      + 'showed exactly 100% in December 2024 for that reason. A year is only counted for someone '
      + 'whose article was already being read before that year began.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`\n⭐ ${결과}\n`);
  console.log('해     이스포츠                          축구 선수');
  for (const y of 해요약) {
    const e = y.esports; const f = y.football;
    console.log(`${y.year}   `
      + `${(e ? `${e.sharing}/${e.people}명이 ${e.month}월${e.allSame ? ' ⭐전원' : ''}` : '못 쟀다').padEnd(32)}`
      + `${f ? `${f.sharing}/${f.people}명이 ${f.month}월${f.allSame ? ' ⭐전원' : ''}` : '못 쟀다'}`);
  }
}
