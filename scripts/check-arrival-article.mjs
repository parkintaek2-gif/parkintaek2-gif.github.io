#!/usr/bin/env node
/**
 * 52편째 기사(**도착하나, 번지나**)가 자료와 맞나.
 *
 * ⛔ 앞말이 아니라 **본문**을 본다 — 손님이 읽는 자리에 있어야 지켜진다.
 * ⛔ 표에 실은 편은 **줄과 값을 묶어** 본다. 「본문 어딘가에 그 수가 있다」로는 못 잡는다 —
 *    2026-08-09 04:3x 에 51편째 자에서 깨뜨려 보고 알았다(같은 수가 다른 문장에 남아 통과했다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/land-or-spread.md';
const 자료길 = 'src/data/wikitip-arrival.json';
const 지면길 = 'src/pages/wikitip/arrival.astro';

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
    if (Number.isInteger(n)) 꼴.add(n.toFixed(1));
    else 꼴.add(n.toFixed(2));
  }
  return [...꼴];
}

export function 있나(글, v) { return 받을꼴(v).some((s) => 글.includes(s)); }

/** 마크다운 표에서 그 제목이 든 줄만 뽑는다 */
export function 제목줄(본문, 제목) {
  return 본문.split('\n').filter((l) => l.includes(`| ${제목} |`));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('굵게 표시를 뗀다', 본문만('---\na: 1\n---\n**39.1%**').includes('39.1'));
  자가('자릿수 꼴 — 50 과 50.0', 있나('median 50.0%', 50));
  자가('없는 수는 없다', !있나('본문 12', 777));
  자가('제목 줄을 집는다', 제목줄('x\n| Ballerina | 89 | 1 |\n| Other | 3 |', 'Ballerina').length === 1);
  자가('없는 제목은 빈 줄', 제목줄('| A | 1 |', 'Zed').length === 0);
  console.log(`도착·번짐 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 본 = 본문만(fs.readFileSync(기사길, 'utf8'));

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(46)} ${값}`); };

  본다('대상 편수', 있나(본, d.titles), d.titles);
  본다('나라 문턱', 있나(본, d.minCountries), d.minCountries);
  본다('총 나라 중앙값', 있나(본, d.medianCountries), d.medianCountries);
  본다('첫 주 나라 중앙값', 있나(본, d.medianFirstWeekCountries), d.medianFirstWeekCountries);
  본다('첫 주 몫 중앙값', 있나(본, d.medianFirstWeekSharePc), `${d.medianFirstWeekSharePc}%`);

  for (const b of d.bands) {
    const 줄 = 제목줄(본, b.band).join(' ');
    본다(`띠 ${b.band} — 표에 줄이 있나`, 줄.length > 0, b.band);
    본다(`띠 ${b.band} — 그 줄에 편수`, 받을꼴(b.titles).some((s) => 줄.includes(s)), b.titles);
    본다(`띠 ${b.band} — 그 줄에 몫`, 받을꼴(b.sharePc).some((s) => 줄.includes(s)), `${b.sharePc}%`);
  }

  /* 표에 실은 편 — 나라 수와 첫 주 수를 **그 줄에서** 본다 */
  for (const t of [...d.slowest.slice(0, 5), ...d.fastest.slice(0, 5)]) {
    const 줄 = 제목줄(본, t.title).join(' ');
    본다(`${t.title} — 표 줄`, 줄.length > 0, t.title);
    본다(`${t.title} — 나라 수`, 받을꼴(t.countries).some((s) => 줄.includes(s)), t.countries);
    본다(`${t.title} — 첫 주 나라`, 받을꼴(t.firstWeekCountries).some((s) => 줄.includes(s)), t.firstWeekCountries);
  }

  /* 🔴 형식 값은 **문단을 집어서** 본다. 본문 전체에서 찾으면 띠 이름 「50–74%」의 50 에 걸려
     틀린 값을 넣어도 안 운다 — 깨뜨려 보고 알았다(2026-08-09 04:5x). */
  const 형식문단 = 본.split(/\n\s*\n/).filter((p) => /film/i.test(p) && /series/i.test(p) && /median/i.test(p)).join('\n');
  본다('형식 문단이 있나', 형식문단.length > 0, '영화·시리즈·중앙값이 한 문단에');
  본다('형식 갈래 — 영화 중앙값',
    받을꼴(d.byFormat.film.medianFirstWeekSharePc).some((s) => 형식문단.includes(s)),
    `${d.byFormat.film.medianFirstWeekSharePc}%`);
  본다('형식 갈래 — 시리즈 중앙값',
    받을꼴(d.byFormat.series.medianFirstWeekSharePc).some((s) => 형식문단.includes(s)),
    `${d.byFormat.series.medianFirstWeekSharePc}%`);
  본다('형식 편수를 그 문단에 적었나',
    받을꼴(d.byFormat.film.titles).some((s) => 형식문단.includes(s))
      && 받을꼴(d.byFormat.series.titles).some((s) => 형식문단.includes(s)),
    `${d.byFormat.film.titles} · ${d.byFormat.series.titles}`);

  /* ⛔ 지켜야 할 말들 — 없으면 기사가 우리 규칙을 어긴 것이다 */
  본다('공개와 차트를 갈랐나', /not the week it became available|release dates|made it available/i.test(본),
    '공개 시각은 우리가 모른다');
  본다('나라 수가 265주 내내 같았다고 적었나', 있나(본, 93) && 있나(본, d.weekCount),
    `93개국 · ${d.weekCount}주`);
  본다('「관문」을 못 찾았다고 적었나', /gateway/i.test(본), '관문은 없었다');
  본다('중앙값이 아무도 안 닮았다고 적었나', /describes neither|no title in this set behaves/i.test(본),
    '39.1% 는 아무 편도 안 닮았다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/arrival'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/arrival"/m.test(fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
