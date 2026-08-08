#!/usr/bin/env node
/**
 * 54편째(**작품이 멀리 가면 배우도 더 찾아보나**)가 자료와 맞나.
 *
 * ⛔ 오늘 새벽에 세 번 배운 것을 처음부터 넣는다 —
 *    **값은 줄로 좁혀 보고**(같은 수가 다른 문장에 있으면 안 운다),
 *    **산문은 공백을 눌러 본다**(마크다운이 문장을 줄바꿈으로 끊는다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/reach-and-the-actor.md';
const 자료길 = 'src/data/wikitip-actor-reach.json';
const 지면길 = 'src/pages/wikitip/actor-reach.astro';

export function 본문만(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n');
  const 조각 = 눌린.split(/^---$/m);
  return (조각.length >= 3 ? 조각.slice(2).join('---') : 눌린).replace(/[*_]/g, '');
}

/** 1.2 ≡ 1.20 · 3 ≡ 3.0 · 1,542 ≡ 1542 */
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

/** 마크다운 표에서 그 띠가 든 줄. 띠 이름이 줄머리에 오는 것만 센다 */
export function 띠줄(본문, 이름) {
  return 본문.split('\n').filter((l) => l.trim().startsWith(`| ${이름} |`));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('쉼표 꼴을 받는다', 있나('median 1,542 lookups', 1542));
  자가('소수 꼴을 받는다', 있나('at 1.20x', 1.2));
  자가('없는 수는 없다', !있나('본문 12', 777));
  자가('띠 줄을 집는다', 띠줄('| 1 | 375 |\n| 2 | 204 |', '1').length === 1);
  자가('없는 띠는 빈 줄', 띠줄('| 1 | 375 |', '9').length === 0);
  console.log(`배우·거리 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 본 = 본문만(fs.readFileSync(기사길, 'utf8'));
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(46)} ${값}`); };

  본다('배우 수', 있나(본, d.actors), d.actors);
  본다('멀리의 문턱', 있나(본, d.wideThreshold), `${d.wideThreshold}개국`);
  본다('최근 경계', 본.includes(d.recentSince), d.recentSince);
  본다('얇은 칸 문턱', 있나(본, d.minCell), `${d.minCell}명`);
  본다('출연진 안 붙은 작품 수',
    있나(본, d.castTitlesTotal - d.castTitles), `${d.castTitlesTotal - d.castTitles}편`);

  /* 날것 — 세 값이 **한 줄에** 있어야 한다 */
  const 날것줄 = 띠줄(본, 'All of them').join(' ');
  본다('날것 줄이 있나', 날것줄.length > 0, 'All of them');
  본다('날것 — 배수', 받을꼴(d.overall.times).some((s) => 날것줄.includes(s)), `${d.overall.times}×`);
  본다('날것 — 좁 중앙값', 받을꼴(d.overall.narrowMedian).some((s) => 날것줄.includes(s)), d.overall.narrowMedian);
  본다('날것 — 넓 중앙값', 받을꼴(d.overall.wideMedian).some((s) => 날것줄.includes(s)), d.overall.wideMedian);

  for (const b of d.bands) {
    const 줄들 = 띠줄(본, b.band);
    본다(`띠 ${b.band} — 두 표에 다 있나`, 줄들.length >= 2, `${줄들.length}줄`);
    const 한줄 = 줄들.join(' ');
    본다(`띠 ${b.band} — 인원`, 받을꼴(b.actors).some((s) => 한줄.includes(s)), b.actors);
    if (b.times != null) 본다(`띠 ${b.band} — 맞춘 배수`, 받을꼴(b.times).some((s) => 한줄.includes(s)), `${b.times}×`);
    if (b.recent.times != null) 본다(`띠 ${b.band} — 최근 배수`, 받을꼴(b.recent.times).some((s) => 한줄.includes(s)), `${b.recent.times}×`);
    if (b.older.times != null) 본다(`띠 ${b.band} — 그 전 배수`, 받을꼴(b.older.times).some((s) => 한줄.includes(s)), `${b.older.times}×`);
  }

  /* ⛔ 지켜야 할 말 — 산문은 눌러서 본다 */
  본다('날것이 크기 탓이라고 적었나', /whatever those titles did|partly just a count of work|bookkeeping/i.test(민본),
    '작품이 많으면 조회도 많다');
  본다('시기 반론을 세웠나', /disproportionately recent|recency/i.test(민본), '넓게 간 것이 최신작이다');
  본다('시기가 큰 수를 가져갔다고 적었나', /takes the biggest number away|not about how far/i.test(민본),
    '5편+ 의 3.74 는 시기였다');
  본다('얇은 칸을 못 낸다고 적었나', /too thin to say|not a finding; it is what noise/i.test(민본),
    '열두 명 미만은 배수를 안 낸다');
  본다('거꾸로 간 칸을 감추지 않았나', 있나(본, d.bands[1].recent.times), `${d.bands[1].recent.times}×`);
  본다('방향을 안 세웠다고 적었나', /Direction is not established|cannot be/i.test(민본), '인과를 안 말한다');
  본다('좋아함이 아니라고 적었나', /never the reason|not that these actors are liked/i.test(민본), '조회는 좋아함이 아니다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/actor-reach'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/actor-reach"/m.test(fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
