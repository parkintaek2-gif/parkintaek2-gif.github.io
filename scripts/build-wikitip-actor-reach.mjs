#!/usr/bin/env node
/**
 * **작품이 멀리 가면 배우도 더 찾아보나.** (54편째 기사와 `/actor-reach` 의 표)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 우리가 파는 것은 **조인**이다. 넷플릭스 나라별 차트와 영문 위키백과 조회수를
 * 배우 이름으로 이었다. 「내 작품이 스무 나라에 걸리면 나를 더 찾아보나」는
 * 캐스팅하는 쪽에도 파는 쪽에도 값이 있는 물음이다.
 *
 * ── 🔴 날것은 3.09배다. 그런데 그 대부분이 크기다 ──────────────
 * 작품이 많은 배우가 조회도 많다. 그래서 **작품 수를 맞추고** 본다.
 * 그러고도 남는 것이 있으면 **언제 마지막으로 차트에 있었나**로 한 번 더 맞춘다 —
 * 넓게 간 작품이 최신작이면 지금 조회가 높은 것은 거리가 아니라 시기다.
 * ⭐ 실제로 5편 이상 띠의 3.74배는 **거의 전부 시기**였다(최근 4.06배 · 그 전 1.11배).
 *
 * ── ⛔ 조심하는 것 ────────────────────────────────────────────
 * · 칸이 얇으면(양쪽 12명 미만) **안 낸다.** 열두 명 중앙값으로 배수를 말하지 않는다.
 * · 「인기」라 안 쓴다. 조회는 좋은 일로도 나쁜 일로도 는다.
 * · 국제 공동제작의 외국 배우는 P27 로 걸러진다 — 국적이 안 적힌 한국 배우도 같이 빠진다.
 *
 * 결과 → src/data/wikitip-actor-reach.json
 * 쓰는 법: node scripts/build-wikitip-actor-reach.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';
import { 지금 } from './_kst.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 출연 = 'archive/raw/netflix-top10/korean-cast-joined.json';
const 조회방 = 'archive/raw/star-pageviews';
const 낼곳 = 'src/data/wikitip-actor-reach.json';

/** 「멀리 갔다」의 문턱. 20개국은 다른 지면과 같은 자를 쓴다 */
export const 멀리 = 20;
/** 한 칸이 이보다 얇으면 배수를 안 낸다 */
export const 최소칸 = 12;
/** 「최근」의 경계 — 마지막 차트 주가 이 뒤면 최근이다 */
export const 최근경계 = '2025-08-01';
export const 띠 = [
  { lo: 1, hi: 1, label: '1' },
  { lo: 2, hi: 2, label: '2' },
  { lo: 3, hi: 4, label: '3–4' },
  { lo: 5, hi: Infinity, label: '5 or more' },
];

export function 가운데(수들) {
  if (!수들.length) return null;
  const s = [...수들].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** 배수. 어느 쪽이든 얇으면 **null** — 지어내지 않는다 */
export function 배수(넓, 좁) {
  if (넓.length < 최소칸 || 좁.length < 최소칸) return null;
  const a = 가운데(넓.map((x) => x.views));
  const b = 가운데(좁.map((x) => x.views));
  if (!b) return null;
  return +(a / b).toFixed(2);
}

export function 칸(무리) {
  const 좁 = 무리.filter((x) => x.maxCountries < 멀리);
  const 넓 = 무리.filter((x) => x.maxCountries >= 멀리);
  return {
    narrowActors: 좁.length,
    wideActors: 넓.length,
    narrowMedian: 가운데(좁.map((x) => x.views)),
    wideMedian: 가운데(넓.map((x) => x.views)),
    times: 배수(넓, 좁),
    /** ⛔ 얇으면 배수를 안 낸다. 왜 없는지 지면이 말할 수 있게 까닭을 적는다 */
    thin: 좁.length < 최소칸 || 넓.length < 최소칸,
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 만들기 = (n, v, c) => Array.from({ length: n }, () => ({ views: v, maxCountries: c }));
  재본다('가운데값', 가운데([3, 1, 2]), 2);
  재본다('빈 것은 null', 가운데([]), null);
  재본다('배수', 배수(만들기(12, 200, 30), 만들기(12, 100, 5)), 2);
  재본다('얇으면 배수를 안 낸다', 배수(만들기(11, 200, 30), 만들기(12, 100, 5)), null);
  재본다('양쪽 다 얇아도 null', 배수(만들기(3, 200, 30), 만들기(3, 100, 5)), null);
  const c = 칸([...만들기(12, 100, 5), ...만들기(12, 300, 30)]);
  재본다('칸이 양쪽을 센다', [c.narrowActors, c.wideActors], [12, 12]);
  재본다('칸이 배수를 낸다', c.times, 3);
  재본다('얇은 칸은 thin 이 참', 칸(만들기(3, 100, 5)).thin, true);
  재본다('문턱은 다른 지면과 같은 20', 멀리, 20);
  재본다('띠에 빈틈이 없다', 띠.every((b, i) => i === 0 || 띠[i - 1].hi + 1 === b.lo), true);
  console.log(실패 ? `⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  const ko = koreanTitleFilter();
  const 나라 = new Map(); const 마지막 = new Map();
  let 창첫 = '9999-99-99'; let 창끝 = '0000-00-00';
  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    if (r.주 < 창첫) 창첫 = r.주;
    if (r.주 > 창끝) 창끝 = r.주;
    if (!ko.keepTitle(r.제목)) continue;
    if (!나라.has(r.제목)) 나라.set(r.제목, new Set());
    나라.get(r.제목).add(r.iso2);
    if (!마지막.has(r.제목) || r.주 > 마지막.get(r.제목)) 마지막.set(r.제목, r.주);
  }

  const cast = JSON.parse(fs.readFileSync(출연, 'utf8'));
  const 파일 = fs.readdirSync(조회방).filter((x) => /^actors-\d+\.json$/.test(x)).sort().pop();
  if (!파일) throw new Error(`${조회방} 에 actors-*.json 이 없다`);
  const 조회원 = JSON.parse(fs.readFileSync(`${조회방}/${파일}`, 'utf8'));
  const 조회 = new Map(조회원.사람.map((p) => [p.이름, p]));

  const 배우 = [];
  for (const a of Object.values(cast.배우)) {
    const v = 조회.get(a.이름);
    if (!v) continue;
    const ns = a.작품이름.map((t) => (나라.get(t) ? 나라.get(t).size : 0));
    if (!ns.length) continue;
    const 마지막주 = a.작품이름.map((t) => 마지막.get(t) ?? '0000-00-00').sort().pop();
    배우.push({
      name: a.이름,
      views: v.합,
      titles: a.작품이름.length,
      maxCountries: Math.max(...ns),
      lastChartWeek: 마지막주,
      recent: 마지막주 >= 최근경계,
    });
  }

  const 띠줄 = 띠.map((b) => {
    const g = 배우.filter((x) => x.titles >= b.lo && x.titles <= b.hi);
    return {
      band: b.label,
      actors: g.length,
      ...칸(g),
      recent: 칸(g.filter((x) => x.recent)),
      older: 칸(g.filter((x) => !x.recent)),
    };
  });

  const 전체 = 칸(배우);

  /* ── 스스로 본다 ── */
  const 띠합 = 띠줄.reduce((s, b) => s + b.actors, 0);
  if (띠합 !== 배우.length) throw new Error(`띠 합 ${띠합} 이 배우 수 ${배우.length} 와 다르다`);
  for (const b of 띠줄) {
    if (b.narrowActors + b.wideActors !== b.actors) throw new Error(`${b.band}: 좁+넓 이 띠 인원과 다르다`);
    if (b.recent.narrowActors + b.older.narrowActors !== b.narrowActors) throw new Error(`${b.band}: 최근/그전 좁 합이 안 맞는다`);
    if (b.recent.wideActors + b.older.wideActors !== b.wideActors) throw new Error(`${b.band}: 최근/그전 넓 합이 안 맞는다`);
  }
  /* ⛔ 기사 요지 — 날것이 맞춘 것보다 커야 한다. 아니면 「크기 탓」이라는 말을 못 쓴다 */
  const 맞춘것들 = 띠줄.map((b) => b.times).filter((v) => v != null);
  if (!(전체.times > Math.min(...맞춘것들))) throw new Error(`날것 ${전체.times} 이 맞춘 것의 최솟값보다 크지 않다`);

  const out = {
    generated: 지금(),
    source: 'Netflix Top 10 (Tudum) weekly country lists joined to English Wikipedia page views (Wikimedia Pageviews API, human traffic) through Wikidata cast lists (P161) filtered to Korean citizenship (P27)',
    question: 'If an actor’s title reached twenty countries, do more people look the actor up?',
    unit: 'Views are one actor’s English Wikipedia page views over 30 days. Reach is the largest number of countries any of that actor’s charting titles reached.',
    /** ⛔ 지면이 이 문장을 그대로 싣는다 */
    /*
     * 🔴 2026-08-10 — 여기서 `cast.주의`(**한국어 내부 메모**)를 그대로 손님 화면에 보냈다.
     *   8/9 에 자료 파일을 손으로 고쳐 막았는데, 오늘 다시 지으니 **되살아났다.**
     *   ⛔ 자료를 손으로 고치면 그때뿐이다. **자를 고쳐야 다시 안 샌다.**
     *   ⚠ 5번 손님은 영어권이다. 화면에 한국어가 있으면 거기서 끝난다.
     */
    castCaveat: 'Foreign actors in international co-productions are excluded by country of '
      + 'citizenship, which also drops Korean actors whose citizenship is not recorded in Wikidata.',
    viewPeriod: 조회원.기간,
    viewDays: 조회원.일수,
    weekFrom: 창첫,
    weekTo: 창끝,
    wideThreshold: 멀리,
    minCell: 최소칸,
    recentSince: 최근경계,
    actors: 배우.length,
    castTitles: cast.출연진이붙은작품,
    castTitlesTotal: cast.작품수,
    overall: 전체,
    bands: 띠줄,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));
  console.log(`배우 ${out.actors}명 · 날것 ${전체.times}배 (좁 ${전체.narrowMedian} · 넓 ${전체.wideMedian})`);
  for (const b of 띠줄) {
    console.log(`  작품 ${b.band.padEnd(10)} ${String(b.actors).padStart(3)}명 · 맞춘 뒤 ${b.times ?? '못 냄'}배`
      + ` · 최근 ${b.recent.times ?? '못 냄'}배 · 그 전 ${b.older.times ?? '못 냄'}배`);
  }
  console.log(`→ ${낼곳}`);
}
