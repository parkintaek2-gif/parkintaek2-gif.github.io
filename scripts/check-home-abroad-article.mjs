#!/usr/bin/env node
/**
 * 51편째 기사(**집 차트가 문이 아니다**)가 자료와 맞나.
 *
 * ── 🔴 왜 이 자가 필요했나 ────────────────────────────────────
 * 2026-08-09 04:2x — 기사 초안에 **자리 수 넷을 재지 않고 적었다.**
 * ```
 * Oasis 328 → 실제 239 · Dangerous Liaisons 262 → 165
 * Young Lady and Gentleman 200 → 351 · Outlaw 173 → 80
 * ```
 * 내지 전에 눈으로 맞대 보다 잡았다. ⛔ **눈이 잡은 것은 다음에 또 새어 나간다.**
 * 그래서 기사에 적힌 수를 **전부** 자료와 맞대는 자를 세운다.
 *
 * ⛔ 앞말(frontmatter)이 아니라 **본문**을 본다 — 손님이 읽는 자리에 있어야 지켜진다.
 *   (2026-08-08 에 앞말에만 있는 문장을 자가 통과시킨 적이 있다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/home-chart-is-not-a-gate.md';
const 자료길 = 'src/data/wikitip-home-abroad.json';
const 지면길 = 'src/pages/wikitip/home-abroad.astro';

/** 앞말을 떼고 **본문만** 준다. 굵게·기울임 표시도 뗀다 */
export function 본문만(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n');
  const 조각 = 눌린.split(/^---$/m);
  return (조각.length >= 3 ? 조각.slice(2).join('---') : 눌린).replace(/[*_]/g, '');
}

/** 1.20 ≡ 1.2 ≡ 19 ≡ 19.0 — 자릿수가 달라도 같은 수로 본다 */
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

/** 본문에 그 수가 있나. 자릿수 꼴을 다 받아 준다 */
export function 있나(본문, v) {
  return 받을꼴(v).some((s) => 본문.includes(s));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('본문은 남긴다', 본문만('---\na: 1\n---\n본문 12').includes('12'));
  자가('굵게 표시를 뗀다', 본문만('---\na: 1\n---\n**56.5%**').includes('56.5'));
  자가('자릿수 꼴 — 39 과 39.0', 있나('reached 39.0%', 39));
  자가('자릿수 꼴 — 8 과 8.0', 있나('films 8.0%', 8));
  자가('없는 수는 없다고 한다', !있나('본문 12', 777));
  console.log(`집·밖 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 본 = 본문만(fs.readFileSync(기사길, 'utf8'));

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(46)} ${값}`); };

  본다('작품 수', 있나(본, d.titles), d.titles);
  본다('집에 걸린 편수', 있나(본, d.chartedAtHome), d.chartedAtHome);
  본다('집에 안 걸린 편수', 있나(본, d.neverChartedAtHome), d.neverChartedAtHome);
  본다('집 없이 20개국 간 편수', 있나(본, d.travelledWithoutHomeCount), d.travelledWithoutHomeCount);

  /* 🔴 2026-08-09 04:3x — 처음엔 `있나(본, 값)` 만 썼다. **깨뜨려 보니 안 울었다** —
     띠 표의 56.5 를 59.5 로 바꿔도, 같은 수가 기울기 문장(11.4 → 25.5 → 56.5 → 63.2)에
     그대로 남아 있어서 「본문 어딘가에 있다」가 참이었다.
     ⛔ 새벽에 영상 자에서 겪은 것과 같은 병이다. **줄과 값을 묶어** 본다. */
  const 표줄 = (라벨) => 본.split('\n').filter((l) => l.trim().startsWith(`| ${라벨} |`));
  for (const b of d.bands) {
    const 줄들 = 표줄(b.band);
    본다(`띠 ${b.band} — 표에 줄이 있나`, 줄들.length >= 2, `${줄들.length}줄 (본표 + 형식표)`);
    const 한줄 = 줄들.join(' ');
    본다(`띠 ${b.band} — 그 줄에 편수`, 받을꼴(b.titles).some((s) => 한줄.includes(s)), b.titles);
    본다(`띠 ${b.band} — 그 줄에 10개국+`, 받을꼴(b.reachedTenPc).some((s) => 한줄.includes(s)), `${b.reachedTenPc}%`);
    본다(`띠 ${b.band} — 그 줄에 영화`, 받을꼴(b.film.reachedTenPc).some((s) => 한줄.includes(s)), `${b.film.reachedTenPc}%`);
    본다(`띠 ${b.band} — 그 줄에 시리즈`, 받을꼴(b.series.reachedTenPc).some((s) => 한줄.includes(s)), `${b.series.reachedTenPc}%`);
  }

  /* 🔴 여기가 이 자를 세운 까닭이다 — 표에 실은 다섯 편의 **나라 수와 자리 수**를 다 맞댄다 */
  for (const t of d.travelledWithoutHome.slice(0, 5)) {
    본다(`${t.title} — 나라 수`, 있나(본, t.countries), t.countries);
    본다(`${t.title} — 자리 수`, 있나(본, t.places), t.places);
  }

  /* ⛔ 「문턱」이라 쓰면 안 된다. 우리가 잰 것은 기울기다 */
  본다('「문턱」이라 안 썼나', !/\bthreshold\b/i.test(본.split('## It is a slope')[1] ?? 본)
    || /was wrong|not a door|only records/i.test(본), '⛔ 기울기다. 문턱이라 부르지 않는다');
  본다('기울기를 네 수로 보였나',
    d.bands.every((b) => 있나(본, b.reachedTenPc)), '11.4 · 25.5 · 56.5 · 63.2');
  본다('견주면 안 되는 까닭을 적었나', /by definition|only by virtue|already decided/i.test(본),
    '집에 안 걸린 무리는 정의상 밖에 걸린 것');
  본다('시기 반론을 적었나', 있나(본, d.bands[2].medianFirstWeek), d.bands[2].medianFirstWeek);
  본다('취향이 아니라고 적었나', /rank list|not.*good|nothing else/i.test(본), 'top10 은 순위표다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/home-abroad'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/home-abroad"/m.test(fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
