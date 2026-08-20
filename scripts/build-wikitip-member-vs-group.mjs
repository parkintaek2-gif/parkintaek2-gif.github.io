#!/usr/bin/env node
/**
 * **멤버의 이름과 그룹의 이름을 한 줄에 놓는다.** (`/member-vs-group`)
 *
 * ⭐⭐ 사장님 지시(8/16) — 「스타의 이름과 **소속 아이돌 그룹명**을 반드시 넣는다.
 *    사람들은 이름을 검색한다. 「가수 1,446명」 같은 수는 아무도 안 찾는다.」
 *    ⛔ 그런데 우리 자료에는 **소속 칸이 없었다.** 위키데이터 P463(소속)으로 받아 붙인다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **멤버가 그룹을 이겼다/졌다로 팔지 않는다.** 두 수를 나란히 놓기만 한다.
 * ⛔ **못 받은 소속을 「무소속」으로 안 센다.** 「못 쟀다」로 남긴다.
 * ⛔ 그룹 문서가 없는 판은 그 나라를 통째로 뺀다 — 0 으로 메우지 않는다.
 * ⛔ 수를 손으로 안 박는다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-member-vs-group.mjs
 *   node scripts/build-wikitip-member-vs-group.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-musicians.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-member-vs-group.json');
export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 판이름 = { id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay' };
export const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };

/** 위에서 몇 명까지 소속을 받아 볼까. ⚠ 적게 받는 것은 돈 때문이지 뜻이 있어서가 아니다 */
export const 볼사람 = 60;

/** ⛔ 「못 받았다」와 「무소속」은 다르다. 셋으로 가른다 */
export function 소속가르기(사람들, 소속표) {
  const 붙음 = []; const 무소속 = []; const 못쟀다 = [];
  for (const p of 사람들) {
    if (!소속표.has(p.q)) 못쟀다.push(p);
    else if (!소속표.get(p.q).length) 무소속.push(p);
    else 붙음.push(p);
  }
  return { 붙음, 무소속, 못쟀다 };
}

/** 멤버와 그룹을 견줄 수 있나 — **둘 다 문서가 있는 판**만 견준다 */
export function 견줄판(멤버, 그룹) {
  return 판들.filter((p) => typeof 멤버?.perMillion?.[p] === 'number'
    && typeof 그룹?.perMillion?.[p] === 'number');
}

/** 그 판에서 멤버가 그룹보다 많이 읽혔나. ⛔ 「이겼다」로 안 쓴다 — 자료 칸 이름만 그렇다 */
export function 나란히(멤버, 그룹) {
  const 판 = 견줄판(멤버, 그룹);
  if (!판.length) return null;
  return {
    member: 멤버.name,
    group: 그룹.name,
    editions: 판,
    rows: 판.map((p) => ({
      edition: p,
      country: 나라이름[p],
      member: 멤버.perMillion[p],
      group: 그룹.perMillion[p],
      memberHigher: 멤버.perMillion[p] > 그룹.perMillion[p],
    })),
    memberHigherIn: 판.filter((p) => 멤버.perMillion[p] > 그룹.perMillion[p]).length,
  };
}

export async function 소속받기(큐들) {
  const 표 = new Map();
  for (let i = 0; i < 큐들.length; i += 50) {
    const 묶음 = 큐들.slice(i, i + 50);
    const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims'
      + `&ids=${묶음.join('|')}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'KCultureWire/1.0 (parkintaek2@gmail.com)' } });
    if (!r.ok) throw new Error(`위키데이터 ${r.status} — 다시 돌려라`);
    const j = await r.json();
    for (const [q, e] of Object.entries(j.entities ?? {})) {
      표.set(q, (e.claims?.P463 ?? [])
        .map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean));
    }
  }
  return 표;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  const 표 = new Map([['Q1', ['Q9']], ['Q2', []]]);
  const g = 소속가르기([{ q: 'Q1' }, { q: 'Q2' }, { q: 'Q3' }], 표);
  재본다('⛔⛔ 못 받은 것을 무소속으로 안 센다', [g.붙음.length, g.무소속.length, g.못쟀다.length], [1, 1, 1]);

  const 멤 = { name: 'V', perMillion: { id: 79.18, vi: 85.14, th: 53.35, ms: null } };
  const 그 = { name: 'BTS', perMillion: { id: 60, vi: 90, th: 53.35, ms: 10 } };
  재본다('⛔ 둘 다 있는 판만 견준다', 견줄판(멤, 그), ['id', 'vi', 'th']);
  const n = 나란히(멤, 그);
  재본다('판마다 두 수를 나란히 둔다', n.rows.length, 3);
  재본다('⭐ 같은 값이면 멤버가 위가 아니다', n.rows.find((r) => r.edition === 'th').memberHigher, false);
  재본다('멤버가 위인 판 수를 센다', n.memberHigherIn, 1);
  재본다('⛔ 견줄 판이 없으면 null', 나란히({ perMillion: {} }, { perMillion: {} }), null);
  재본다('⭐ 원본이 있다', fs.existsSync(원본길), true);
  console.log(`멤버와 그룹을 나란히 놓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 이름으로 = new Map(원.people.map((p) => [p.q, p]));
  const 솔로 = 원.people.filter((p) => !p.isGroup && typeof p.seaPerMillionTotal === 'number')
    .sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal).slice(0, 볼사람);

  console.log(`솔로 ${솔로.length}명의 소속을 받는다…`);
  const 소속표 = await 소속받기(솔로.map((p) => p.q));
  const { 붙음, 무소속, 못쟀다 } = 소속가르기(솔로, 소속표);

  /* 소속 Q번호가 우리 자료 안의 그룹이어야 견줄 수 있다 */
  const 짝 = [];
  /* ⚠ 위키데이터가 같은 소속을 두 번 적어 두기도 한다 — Mark Lee 가 네 줄로 나왔다. 겹치면 한 줄만 쓴다 */
  const 본짝 = new Set();
  for (const p of 붙음) {
    for (const gq of new Set(소속표.get(p.q))) {
      if (본짝.has(p.q + gq)) continue;
      본짝.add(p.q + gq);
      const g = 이름으로.get(gq);
      if (!g?.isGroup) continue;
      const n = 나란히(p, g);
      if (n) 짝.push({ ...n, memberTotal: p.seaPerMillionTotal, groupTotal: g.seaPerMillionTotal });
    }
  }
  짝.sort((a, b) => b.memberTotal - a.memberTotal);

  const 자료 = {
    generated: 원.generated?.slice(0, 10) ?? null,
    source: 원.source,
    window: 원.window,
    editions: 판들,
    editionNames: 판이름,
    countryNames: 나라이름,
    question: 'When a Southeast Asian reader looks up a K-pop act, do they open the member or '
      + 'the group?',
    soloLooked: 솔로.length,
    withGroup: 붙음.length,
    noGroup: 무소속.length,
    notMeasured: 못쟀다.length,
    notMeasuredMeans: 'A soloist whose membership we could not read is not counted as having no '
      + 'group. Not measured and no group are different things.',
    pairs: 짝,
    method: 'Membership comes from Wikidata\'s member-of property, read for the '
      + `${볼사람} most-read soloists. A member and their group are compared only on editions `
      + 'where both have an article, so a missing article is never read as zero.',
    limitation: 'We read membership for the most-read soloists only, which is a limit of cost and '
      + 'not of meaning; a member further down the list may behave differently. Reads count people '
      + 'opening an encyclopaedia article, which is not popularity and not sales. A member being '
      + 'read more than their group is not evidence that the member is better known — the two '
      + 'articles answer different questions for a reader.',
    cannotSay: [
      'Not a contest. We put the member and the group side by side; we do not say one beat the other.',
      'Not every soloist. Only the most-read ones had their membership read.',
      'Not popularity. This counts encyclopaedia article opens.',
    ],
  };
  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);
  console.log(`\n소속 붙음 ${붙음.length} · 무소속 ${무소속.length} · ⚠ 못 쟀다 ${못쟀다.length}`);
  console.log(`견줄 수 있는 짝 ${짝.length}`);
  for (const p of 짝.slice(0, 12)) {
    console.log(`   ${p.member.padEnd(16)} (${p.group.padEnd(14)})  멤버가 위인 판 ${p.memberHigherIn}/${p.editions.length}`
      + `   ${p.rows.map((r) => `${r.edition} ${r.member}:${r.group}`).join(' · ')}`);
  }
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
