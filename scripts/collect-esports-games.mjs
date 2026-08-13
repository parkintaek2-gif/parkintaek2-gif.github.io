#!/usr/bin/env node
/**
 * **「이스포츠」가 아니라 「그 게임」일지 모른다** — 종목을 갈라 다시 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   78편에서 「이스포츠 선수가 한 달에 몰린다」고 썼다. 79편에서 나라를 갈라 봤다.
 *   ⚠ 그런데 **종목을 안 갈랐다.** 내가 잰 사람들이 전부 리그오브레전드 선수였다면
 *      그것은 「이스포츠의 성질」이 아니라 **「그 대회의 성질」**이다. 두 말은 아주 다르다.
 *   ⭐ 발로란트·오버워치·스타크래프트 선수도 같은 달에 서면 종목을 넘는 성질이고,
 *      각자 자기 대회 달에 서면 우리가 잰 것은 **월즈**이지 이스포츠가 아니다.
 *
 * ── ⛔ 이 수집기가 지키는 것 ───────────────────────────────────
 * ⛔ 게임을 줄세우지 않는다. **어느 달에 서나**만 본다.
 * ⛔ 셋이 안 되는 게임은 봉우리를 말하지 않는다.
 * ⛔ 해 중간에 생긴 문서는 안 센다.
 * ⚠ 종목이 여럿 적힌 사람은 **첫 종목으로 센다.** 두 번 세면 몫이 100 을 넘는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const 결과 = 'archive/raw/wikipedia/esports-games.json';
const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';
const 판들 = ['id', 'vi', 'th', 'ms'];
const 최소조회 = 250;
const 최소사람 = 3;

/**
 * 게임 이름을 짧게 — 화면에 그대로 나간다.
 *
 * 🔴 처음에 **P641(종목)** 을 봤다가 헛일을 했다 — 1,266명 중 **1,263명이 그냥 「esports」**였다.
 *   실물에 물어보니 게임은 **P2416(경기 종목)** 에 있었다(스타2 481 · LoL 418 · 카트라이더 43).
 * ⛔ 「esports」는 게임 이름이 아니다. 그것을 게임으로 세면 갈래가 하나가 되어 **아무것도 못 가른다.**
 * ⛔ Q번호만 있고 이름이 없는 것(`Q840409` 같은)도 안 쓴다 — 화면에 Q번호를 낼 수 없다.
 */
export function 게임이름(라벨) {
  if (!라벨) return null;
  if (/^Q\d+$/.test(라벨)) return null;                 /* 이름이 안 붙은 것 */
  if (/^(esports?|electronic sports)$/i.test(라벨)) return null;   /* 🔴 이게 게임인 줄 알았다 */
  const 표 = [
    [/league of legends/i, 'League of Legends'],
    [/valorant/i, 'Valorant'],
    [/overwatch/i, 'Overwatch'],
    [/starcraft.*ii|starcraft 2/i, 'StarCraft II'],
    [/starcraft/i, 'StarCraft'],
    [/counter-?strike/i, 'Counter-Strike'],
    [/dota/i, 'Dota 2'],
    [/pubg|playerunknown/i, 'PUBG'],
    [/tekken/i, 'Tekken'],
    [/street fighter/i, 'Street Fighter'],
    [/hearthstone/i, 'Hearthstone'],
    [/fifa|ea sports fc/i, 'EA FC'],
    [/kartrider|crazyracing/i, 'KartRider'],
    [/warcraft iii/i, 'Warcraft III'],
    [/heroes of the storm/i, 'Heroes of the Storm'],
    [/teamfight tactics/i, 'Teamfight Tactics'],
  ];
  for (const [재, 이름] of 표) if (재.test(라벨)) return 이름;
  return 라벨.length > 28 ? null : 라벨;      /* ⛔ 긴 것은 게임 이름이 아니다 */
}

export function 봉우리(달값, 그해전에읽혔나) {
  const 값 = Object.values(달값);
  if (!값.length) return null;
  const 합 = 값.reduce((a, b) => a + b, 0);
  if (합 < 최소조회) return null;
  const 큰 = Math.max(...값);
  return {
    peakMonth: Object.keys(달값).find((k) => 달값[k] === 큰),
    peakSharePc: +((100 * 큰) / 합).toFixed(1),
    total: 합,
    partialYear: !그해전에읽혔나,
  };
}

/** 한 게임의 선수들이 같은 달에 서나 */
export function 모임(봉우리들, 최소 = 최소사람) {
  const 쓸것 = 봉우리들.filter((b) => b && !b.partialYear);
  if (쓸것.length < 최소) return { people: 쓸것.length, tooFew: true, month: null, sharing: null, allSame: null };
  const 셈 = new Map();
  for (const b of 쓸것) 셈.set(b.peakMonth, (셈.get(b.peakMonth) ?? 0) + 1);
  const [달, 몇] = [...셈].sort((a, b) => b[1] - a[1])[0];
  return {
    people: 쓸것.length,
    tooFew: false,
    month: 달,
    sharing: 몇,
    sharingPc: +((100 * 몇) / 쓸것.length).toFixed(1),
    allSame: 몇 === 쓸것.length,
    medianPeakSharePc: [...쓸것].sort((a, b) => a.peakSharePc - b.peakSharePc)[쓸것.length >> 1].peakSharePc,
  };
}

/** ⭐ 이 자료의 물음 — 게임들이 **서로 다른 달**에 서나 */
export function 게임마다다른가(무리들) {
  const 쓸것 = 무리들.filter((g) => g.group && !g.group.tooFew);
  if (쓸것.length < 2) return { games: 쓸것.length, canTell: false, months: [], allSameMonth: null };
  const 달들 = [...new Set(쓸것.map((g) => g.group.month))];
  return {
    games: 쓸것.length,
    canTell: true,
    months: 달들,
    /** 참이면 「이스포츠의 성질」, 거짓이면 **「그 대회의 성질」** */
    allSameMonth: 달들.length === 1,
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('게임이름 — LoL', 게임이름('League of Legends'), 'League of Legends');
  재본다('게임이름 — 대소문자 무관', 게임이름('league of legends esports'), 'League of Legends');
  재본다('게임이름 — 스타2 를 스타1 과 안 섞는다', 게임이름('StarCraft II'), 'StarCraft II');
  재본다('⛔ 게임이름 — 긴 것은 게임이 아니다',
    게임이름('electronic sports competition held annually somewhere'), null);
  재본다('게임이름 — 없으면 null', 게임이름(null), null);
  /* 🔴 P641 을 보다가 여기서 헛일을 했다 — 1,263명이 「esports」였다 */
  재본다('🔴 게임이름 — 「esports」는 게임이 아니다', 게임이름('esports'), null);
  재본다('🔴 게임이름 — Q번호만 있는 것은 안 쓴다', 게임이름('Q840409'), null);
  재본다('게임이름 — 카트라이더', 게임이름('Crazyracing Kartrider'), 'KartRider');
  const 셋 = [{ peakMonth: '11', peakSharePc: 40 }, { peakMonth: '11', peakSharePc: 30 },
    { peakMonth: '11', peakSharePc: 50 }];
  재본다('모임 — 전원 같으면 참', 모임(셋).allSame, true);
  재본다('모임 — 가운데값', 모임(셋).medianPeakSharePc, 40);
  재본다('⛔ 모임 — 셋 미만은 말하지 않는다', 모임(셋.slice(0, 2)).tooFew, true);
  재본다('⛔ 모임 — 해 중간 문서는 뺀다',
    모임([...셋, { peakMonth: '01', peakSharePc: 99, partialYear: true }]).people, 3);
  재본다('🔴 게임마다다른가 — 달이 다르면 「그 대회의 성질」이다',
    게임마다다른가([{ group: { month: '11', tooFew: false } }, { group: { month: '08', tooFew: false } }]).allSameMonth,
    false);
  재본다('게임마다다른가 — 같으면 종목을 넘는 성질',
    게임마다다른가([{ group: { month: '11', tooFew: false } }, { group: { month: '11', tooFew: false } }]).allSameMonth,
    true);
  재본다('⛔ 게임마다다른가 — 게임이 하나뿐이면 못 가른다',
    게임마다다른가([{ group: { month: '11', tooFew: false } }]).canTell, false);
  console.log(`게임별 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

function 받기(host, 길) {
  return new Promise((resolve) => {
    const req = https.request({ host, path: 길, headers: { 'User-Agent': UA, Accept: 'application/json' } },
      (res) => { let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ code: res.statusCode, body: b })); });
    req.on('error', (e) => resolve({ code: 0, body: e.message }));
    req.setTimeout(90000, () => { req.destroy(); resolve({ code: 0, body: e?.message ?? 'timeout' }); });
    req.end();
  });
}

async function 스파클(q) {
  for (let 번 = 0; 번 < 3; 번 += 1) {
    const r = await 받기('query.wikidata.org', `/sparql?format=json&query=${encodeURIComponent(q)}`);
    if (r.code === 200) { try { return JSON.parse(r.body).results.bindings; } catch { /* 다시 */ } }
    await new Promise((s) => { setTimeout(s, 3000 * (번 + 1)); });
  }
  return null;
}

async function 달별(판, 제목) {
  const 길 = `/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia/all-access/user/`
    + `${encodeURIComponent(제목.replace(/ /g, '_'))}/monthly/20240101/20251231`;
  for (let 번 = 0; 번 < 4; 번 += 1) {
    const r = await 받기('wikimedia.org', 길);
    if (r.code === 404) return null;
    if (r.code === 200) {
      try { return JSON.parse(r.body).items.map((x) => ({ m: x.timestamp.slice(0, 6), v: x.views })); }
      catch { /* 다시 */ }
    }
    await new Promise((s) => { setTimeout(s, 900 * (2 ** 번)); });
  }
  return undefined;
}

if (내가실행됐다) {
  /* 한국 이스포츠 선수 + 그가 하는 게임(P641 종목) + 동남아 판 문서 */
  const 고리 = 판들.map((p) => `
    OPTIONAL { ?a_${p} schema:about ?p ; schema:isPartOf <https://${p}.wikipedia.org/> . }`).join('');
  const 줄 = await 스파클(`SELECT ?p ?pLabel ?gLabel ${판들.map((p) => `?a_${p}`).join(' ')} WHERE {
    ?p wdt:P31 wd:Q5 ; wdt:P27 wd:Q884 ; wdt:P106 wd:Q4379701 .
    OPTIONAL { ?p wdt:P2416 ?g . }
    ${고리}
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`);
  if (!줄) { console.error('⛔ SPARQL 못 받았다'); process.exit(1); }

  const 사람 = new Map();
  for (const r of 줄) {
    const q = r.p.value.split('/').pop();
    if (!사람.has(q)) 사람.set(q, { q, name: r.pLabel?.value ?? q, games: [], titles: {} });
    const g = 게임이름(r.gLabel?.value);
    if (g && !사람.get(q).games.includes(g)) 사람.get(q).games.push(g);
    for (const p of 판들) {
      const u = r[`a_${p}`]?.value;
      if (u) 사람.get(q).titles[p] = decodeURIComponent(u.split('/wiki/')[1] ?? '');
    }
  }

  const 잴것 = [...사람.values()].filter((x) => x.games.length && 판들.some((p) => x.titles[p]));
  console.log(`한국 이스포츠 선수 ${사람.size}명 · 게임과 동남아 문서 둘 다 있는 ${잴것.length}명\n`);

  const 사람줄 = [];
  for (const x of 잴것) {
    const 달모음 = new Map();
    let 못잼 = false;
    for (const p of 판들) {
      if (!x.titles[p]) continue;
      const v = await 달별(p, x.titles[p]);
      if (v === undefined) { 못잼 = true; continue; }
      if (v === null) continue;
      for (const it of v) 달모음.set(it.m, (달모음.get(it.m) ?? 0) + it.v);
    }
    const 첫달 = [...달모음.keys()].sort()[0] ?? null;
    const 달값 = {};
    for (let mm = 1; mm <= 12; mm += 1) {
      const 열쇠 = `2025${String(mm).padStart(2, '0')}`;
      if (달모음.has(열쇠)) 달값[String(mm).padStart(2, '0')] = 달모음.get(열쇠);
    }
    사람줄.push({
      name: x.name,
      game: x.games[0],                       /* ⚠ 여럿이면 첫 종목 — 두 번 안 센다 */
      peak2025: 못잼 ? null : 봉우리(달값, 첫달 !== null && 첫달 < '202501'),
    });
    if (사람줄.length % 10 === 0) process.stdout.write(`   ${사람줄.length}/${잴것.length}\n`);
  }

  const 게임들 = [...new Set(사람줄.map((s) => s.game))].filter(Boolean);
  const 무리 = 게임들.map((g) => ({
    game: g,
    withArticle: 사람줄.filter((s) => s.game === g).length,
    group: 모임(사람줄.filter((s) => s.game === g).map((s) => s.peak2025)),
  })).sort((a, b) => (b.group.people ?? 0) - (a.group.people ?? 0));

  const 가름 = 게임마다다른가(무리);

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikidata for Korean esports players and the game each competes in; Wikimedia Pageviews '
      + 'API, four Southeast Asian editions summed, calendar year 2025',
    unit: 'People. One row is one player, counted under their first listed game.',
    minReadsPerYear: 최소조회,
    minPeopleForAGroup: 최소사람,
    question: 'We called the pattern an esports pattern. It may only ever have been a League of '
      + 'Legends pattern. Splitting by game is the only way to tell.',
    games: 무리,
    verdict: 가름,
    whatItWouldMean: 'If every game peaks in the same month, the pattern crosses titles and belongs '
      + 'to esports. If each game peaks in its own month, what we measured was a tournament '
      + 'calendar, and calling it an esports pattern was too wide.',
    cannotAnswer: 'Wikidata lists a game for some players and not others, and a player who competed '
      + 'in two is counted under the first. This is a floor on how many play each game.',
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`\n⭐ ${결과}\n`);
  console.log('게임'.padEnd(20) + '문서있음  무리  같은 달에 선 사람');
  for (const g of 무리) {
    console.log(`${g.game.padEnd(20)}${String(g.withArticle).padStart(6)}`
      + `${String(g.group.people).padStart(6)}  `
      + (g.group.tooFew ? `⛔ ${최소사람}명 미만 — 안 말한다`
        : `${g.group.sharing}/${g.group.people} (${g.group.sharingPc}%) ${g.group.month}월`
          + `${g.group.allSame ? ' ⭐전원' : ''} · 가운데 몰림 ${g.group.medianPeakSharePc}%`));
  }
  console.log(`\n무리를 이룬 게임 ${가름.games} — `
    + (가름.canTell
      ? (가름.allSameMonth ? '⭐ 모두 같은 달 — 종목을 넘는 성질이다'
        : `🔴 달이 다르다(${가름.months.join('·')}) — **그 대회의 성질**이다`)
      : '⛔ 게임이 하나뿐이라 못 가른다'));
}
