#!/usr/bin/env node
/**
 * **도착하나, 번지나.** (52편째 기사와 `/arrival` 의 표)
 *
 * ── 무엇을 묻나 ─────────────────────────────────────────────────
 * 널리 다닌 한국 작품은 **한 나라에서 시작해 번지는가**, 아니면 **여러 나라에 한꺼번에 뜨는가.**
 * 배급하는 쪽에는 이 답이 곧 일정이다 — 번지는 물건이면 첫 시장을 고르는 일이 중요하고,
 * 한꺼번에 뜨는 물건이면 첫 주에 모든 시장이 준비돼 있어야 한다.
 *
 * ── 🔴 처음 물음이 틀렸다 (2026-08-09 04:2x) ───────────────────
 * 처음엔 「관문 시장이 어디인가」를 물었다. 그런데 첫 주에 걸린 나라 수 **중앙값이 14** 였다.
 * ⛔ 관문이 없다. 물음이 틀렸던 것이다. **그래서 물음을 바꿔 적는다** — 관문을 찾지 않고
 *    「첫 주가 전체의 몇 %인가」를 잰다.
 *
 * ── ⛔ 이 자료가 조심하는 것 ──────────────────────────────────
 * · **차트에 뜬 것**을 잰다. 넷플릭스가 언제 어디에 **공개**했는지는 우리가 모른다.
 *   같은 날 전 세계에 올려도 어떤 곳에서는 top10 에 못 들 수 있다. 그 둘을 안 섞는다.
 * · 「퍼졌다」를 **입소문**이라 부르지 않는다. 우리가 본 것은 나라 수가 늘었다는 것뿐이다.
 * · 20개국 미만은 이 셈에서 뺀다 — 세 나라에서 두 나라가 첫 주면 67% 라 뜻이 없다.
 *
 * 결과 → src/data/wikitip-arrival.json
 * 쓰는 법: node scripts/build-wikitip-arrival.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼곳 = 'src/data/wikitip-arrival.json';
/** 이 아래는 안 센다. 적은 나라에서는 비율이 뜻을 잃는다 */
export const 최소나라 = 20;

/** 첫 주가 전체의 몇 %인가 */
export function 첫주몫(첫주나라, 총나라) {
  if (!총나라) return null;
  return +((100 * 첫주나라) / 총나라).toFixed(1);
}

/** 몫으로 나눈 띠. ⛔ 「좋다·나쁘다」가 아니라 **꼴**이다 */
export const 띠 = [
  { lo: 0, hi: 25, label: 'under 25%', shape: 'spread' },
  { lo: 25, hi: 50, label: '25–49%', shape: 'mixed' },
  { lo: 50, hi: 75, label: '50–74%', shape: 'mostly at once' },
  { lo: 75, hi: 100.01, label: '75% or more', shape: 'landed' },
];

export function 가운데(수들) {
  if (!수들.length) return null;
  const s = [...수들].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function 영화인가(구분) { return /film/i.test(String(구분 ?? '')); }

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('첫 주 몫 — 절반', 첫주몫(10, 20), 50);
  재본다('첫 주 몫 — 전부', 첫주몫(43, 43), 100);
  재본다('총 0 이면 null', 첫주몫(0, 0), null);
  재본다('가운데값', 가운데([5, 1, 3]), 3);
  재본다('영화 가려내기', [영화인가('Films'), 영화인가('TV')], [true, false]);
  재본다('띠에 빈틈이 없다', 띠.every((b, i) => i === 0 || 띠[i - 1].hi === b.lo), true);
  재본다('마지막 띠가 100 을 담는다', 띠[띠.length - 1].hi > 100, true);
  /* ⛔ 문턱이 낮으면 비율이 뜻을 잃는다 — 그 자리를 자가 지킨다 */
  재본다('나라 문턱이 스물 이상이다', 최소나라 >= 20, true);
  console.log(실패 ? `⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  const ko = koreanTitleFilter();
  const 작품 = new Map();
  let 창첫 = '9999-99-99'; let 창끝 = '0000-00-00'; const 주들 = new Set();

  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    if (r.주 < 창첫) 창첫 = r.주;
    if (r.주 > 창끝) 창끝 = r.주;
    주들.add(r.주);
    if (!ko.keepTitle(r.제목)) continue;
    if (!작품.has(r.제목)) 작품.set(r.제목, { 첫주: new Map(), kind: r.구분, names: new Map() });
    const x = 작품.get(r.제목);
    if (!x.첫주.has(r.iso2) || r.주 < x.첫주.get(r.iso2)) x.첫주.set(r.iso2, r.주);
    x.names.set(r.iso2, r.국가);
  }

  const 전부 = [...작품].map(([title, x]) => {
    const 주목록 = [...x.첫주.values()].sort();
    const 시작 = 주목록[0];
    const 첫주나라 = [...x.첫주.values()].filter((w) => w === 시작).length;
    return {
      title,
      countries: x.첫주.size,
      firstWeekCountries: 첫주나라,
      firstWeekSharePc: 첫주몫(첫주나라, x.첫주.size),
      firstWeek: 시작,
      film: 영화인가(x.kind),
      /* 첫 주에 뜬 나라 이름 — 「어디서 시작했나」를 이름으로 보이려고 남긴다 */
      firstWeekNames: [...x.첫주].filter(([, w]) => w === 시작).map(([c]) => x.names.get(c) ?? c).sort(),
    };
  });
  const 널리 = 전부.filter((x) => x.countries >= 최소나라)
    .sort((a, b) => a.firstWeekSharePc - b.firstWeekSharePc || b.countries - a.countries);

  const 띠줄 = 띠.map((b) => {
    const g = 널리.filter((x) => x.firstWeekSharePc >= b.lo && x.firstWeekSharePc < b.hi);
    return {
      band: b.label,
      shape: b.shape,
      titles: g.length,
      sharePc: +((100 * g.length) / 널리.length).toFixed(1),
      medianCountries: 가운데(g.map((x) => x.countries)),
      medianFirstWeekCountries: 가운데(g.map((x) => x.firstWeekCountries)),
      films: g.filter((x) => x.film).length,
      series: g.filter((x) => !x.film).length,
    };
  });

  const 영화 = 널리.filter((x) => x.film);
  const 시리즈 = 널리.filter((x) => !x.film);

  /* ── 스스로 본다 ── */
  const 띠합 = 띠줄.reduce((s, b) => s + b.titles, 0);
  if (띠합 !== 널리.length) throw new Error(`띠 합 ${띠합} 이 대상 편수 ${널리.length} 와 다르다`);
  for (const x of 널리) {
    if (x.firstWeekCountries > x.countries) throw new Error(`${x.title}: 첫 주 나라가 전체보다 많다`);
    if (x.firstWeekNames.length !== x.firstWeekCountries) throw new Error(`${x.title}: 첫 주 이름 수가 안 맞는다`);
  }
  /* ⛔ 요지 — 「한 가지 꼴이 아니다」가 참이어야 한다. 한 띠에 몰리면 기사를 다시 쓴다 */
  const 제일큰띠 = Math.max(...띠줄.map((b) => b.sharePc));
  if (제일큰띠 > 60) throw new Error(`한 띠에 ${제일큰띠}% 가 몰렸다 — 「두 갈래」라는 요지가 안 선다`);

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists; Korean titles identified via Wikidata country of origin (P495 = Q884) and by Wikidata item number where we hold one',
    question: 'When a Korean title reaches many countries, does it start in one and spread, or appear in many at once?',
    unit: 'A title’s first week is the earliest week it appears on any country list. First-week share is how many of its eventual countries were already there in that week.',
    /** ⛔ 이 문장을 지면이 그대로 싣는다. 공개와 차트를 섞으면 안 된다 */
    notRelease: 'We observe when a title appears on a country’s top 10, not when Netflix made it available there. A title released everywhere on the same day can still take weeks to chart in some markets, and that is what this measures.',
    minCountries: 최소나라,
    weekFrom: 창첫,
    weekTo: 창끝,
    weekCount: 주들.size,
    titlesAll: 전부.length,
    titles: 널리.length,
    medianCountries: 가운데(널리.map((x) => x.countries)),
    medianFirstWeekCountries: 가운데(널리.map((x) => x.firstWeekCountries)),
    medianFirstWeekSharePc: 가운데(널리.map((x) => x.firstWeekSharePc)),
    bands: 띠줄,
    byFormat: {
      film: { titles: 영화.length, medianFirstWeekSharePc: 가운데(영화.map((x) => x.firstWeekSharePc)) },
      series: { titles: 시리즈.length, medianFirstWeekSharePc: 가운데(시리즈.map((x) => x.firstWeekSharePc)) },
    },
    slowest: 널리.slice(0, 8).map((x) => ({
      title: x.title, countries: x.countries, firstWeekCountries: x.firstWeekCountries,
      firstWeekSharePc: x.firstWeekSharePc, firstWeek: x.firstWeek, film: x.film,
      startedIn: x.firstWeekNames.slice(0, 3),
    })),
    fastest: [...널리].reverse().slice(0, 8).map((x) => ({
      title: x.title, countries: x.countries, firstWeekCountries: x.firstWeekCountries,
      firstWeekSharePc: x.firstWeekSharePc, firstWeek: x.firstWeek, film: x.film,
    })),
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));
  console.log(`${최소나라}개국 이상 간 작품 ${out.titles}편 / 전체 ${out.titlesAll}편`);
  console.log(`  총 나라 중앙값 ${out.medianCountries} · 첫 주 나라 중앙값 ${out.medianFirstWeekCountries} · 첫 주 몫 중앙값 ${out.medianFirstWeekSharePc}%`);
  for (const b of 띠줄) console.log(`  ${b.band.padEnd(12)} ${String(b.titles).padStart(3)}편 (${b.sharePc}%) · ${b.shape} · 영화 ${b.films} 시리즈 ${b.series}`);
  console.log(`  형식 — 영화 ${out.byFormat.film.medianFirstWeekSharePc}% · 시리즈 ${out.byFormat.series.medianFirstWeekSharePc}%`);
  console.log(`→ ${낼곳}`);
}
