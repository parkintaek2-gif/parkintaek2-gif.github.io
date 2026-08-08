#!/usr/bin/env node
/**
 * 55편째(**세 곳이 절반**)가 자료와 맞나.
 *
 * ⛔ 값은 **줄로 좁혀** 보고, 산문은 **공백을 눌러** 본다. 앞말이 아니라 **본문**을 본다.
 *    셋 다 2026-08-09 새벽에 자를 깨뜨려 보고 배운 것이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/three-companies-half-the-shelf.md';
const 자료길 = 'src/data/wikitip-who-makes-it.json';
const 지면길 = 'src/pages/wikitip/who-makes-it.astro';

export function 본문만(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n');
  const 조각 = 눌린.split(/^---$/m);
  return (조각.length >= 3 ? 조각.slice(2).join('---') : 눌린).replace(/[*_]/g, '');
}

export function 받을꼴(v) {
  const 꼴 = new Set([String(v)]);
  const n = Number(v);
  if (Number.isFinite(n)) {
    꼴.add(String(n));
    꼴.add(n.toLocaleString('en-US'));
    if (Number.isInteger(n)) 꼴.add(n.toFixed(1));
    else 꼴.add(n.toFixed(2));
  }
  return [...꼴];
}

export function 있나(글, v) { return 받을꼴(v).some((s) => 글.includes(s)); }

/** 표에서 그 이름이 줄머리에 오는 줄만 */
export function 표줄(본문, 이름) {
  return 본문.split('\n').filter((l) => l.trim().startsWith(`| ${이름} |`));
}

/**
 * 표 한 줄을 **칸으로 가른다.**
 *
 * 🔴 2026-08-09 06:3x — 줄 전체에서 수를 찾았더니 **한 자리 수가 안 걸렸다.**
 *   `| Production company | 99 | 151 (41.7%) | 5 |` 에서 5 를 7 로 바꿔도
 *   같은 줄의 「151」과 「41.7」에 5 가 들어 있어 `includes('5')` 가 참이었다.
 * ⛔ 오늘 이 꼴을 네 번째 만난다(영상 자 · 51 · 52 · 여기). **자리를 칸까지 좁힌다.**
 */
export function 칸들(줄) {
  return 줄.split('|').map((c) => c.trim()).filter(Boolean);
}

/** 그 줄의 **어느 한 칸이** 그 값인가. 칸 안의 괄호 딸림(151 (41.7%))도 받는다 */
export function 칸에있나(줄들, v) {
  const 후보 = 받을꼴(v);
  return 줄들.some((l) => 칸들(l).some((c) => 후보.includes(c) || 후보.some((s) => c.startsWith(`${s} (`))));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('굵게를 뗀다', 본문만('---\na: 1\n---\n**3**').includes('3'));
  자가('소수 꼴', 있나('at 41.7%', 41.7));
  자가('없는 수는 없다', !있나('본문 12', 777));
  자가('표 줄을 집는다', 표줄('| Any credit | 129 |\n| Other | 1 |', 'Any credit').length === 1);
  자가('없는 줄은 빈 배열', 표줄('| A | 1 |', 'Zed').length === 0);
  console.log(`누가 만드나 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 본 = 본문만(fs.readFileSync(기사길, 'utf8'));
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(46)} ${값}`); };

  for (const r of d.roles) {
    const 줄들 = 표줄(본, r.label);
    본다(`${r.label} — 표 줄`, 줄들.length > 0, r.label);
    if (!줄들.length) continue;
    본다(`${r.label} — 회사 수`, 칸에있나(줄들, r.firms), r.firms);
    본다(`${r.label} — 시리즈 수`, 칸에있나(줄들, r.series), r.series);
    본다(`${r.label} — 덮는 몫`, 줄들.join(' ').includes(`${r.seriesCoveragePc}%`), `${r.seriesCoveragePc}%`);
    본다(`${r.label} — 절반 회사 수`, 칸에있나(줄들, r.halfTakesFirms), r.halfTakesFirms);
  }

  for (const b of d.firmSizeBands) {
    const 줄들 = 표줄(본, b.band);
    본다(`크기 띠 ${b.band} — 줄`, 줄들.length > 0, b.band);
    if (줄들.length) 본다(`크기 띠 ${b.band} — 회사 수`, 칸에있나(줄들, b.firms), b.firms);
  }

  본다('시리즈 전체', 있나(본, d.seriesTotal), d.seriesTotal);
  본다('영화 전체', 있나(본, d.filmsTotal), d.filmsTotal);
  본다('영화에 회사 붙은 수', 있나(본, d.filmsWithFirm), d.filmsWithFirm);
  본다('영화 덮는 몫', 있나(본, d.filmCoveragePc), `${d.filmCoveragePc}%`);
  본다('시장 쪽 견줌 — 미국', 있나(본, d.marketHalfTakesUS), d.marketHalfTakesUS);
  본다('시장 쪽 견줌 — 베트남', 있나(본, d.marketHalfTakesVN), d.marketHalfTakesVN);

  /* ⛔ 지켜야 할 말 */
  본다('줄세우기가 아니라고 적었나', /alphabetical order|not a ranking|no size column/i.test(민본), '이름은 알파벳순');
  본다('방송사 반론을 세웠나', /airs everything it airs|close to a definition/i.test(민본), '방송사는 원래 덮는다');
  본다('제작사 바닥이 얇다고 적었나', /thinnest base|least complete/i.test(민본), '41.7% 위에 서 있다');
  본다('영화를 왜 뺐는지 적었나', /half-empty list|missing data/i.test(민본), '반쯤 빈 자료로는 못 잰다');
  본다('그룹을 안 합쳤다고 적었나', /ownership tree|corporate group/i.test(민본), '짐작으로 안 합친다');
  /* ⛔ 느슨하게 풀지 않는다 — **두 조각을 다** 요구한다.
     처음 정규식이 내 문장과 안 맞았다(「not that this is a census」). 자를 넓히되 뜻은 좁게 둔다 */
  본다('센서스가 아니라고 적었나',
    /census/i.test(민본) && /never reached a top 10|absent/i.test(민본),
    '차트에 오른 것만 있다 + 안 오른 곳은 없는 것');
  본다('단위가 다르다고 적었나', /without being comparable|counts titles while this counts/i.test(민본), '작품 대 회사');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/who-makes-it'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/who-makes-it"/m.test(fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
