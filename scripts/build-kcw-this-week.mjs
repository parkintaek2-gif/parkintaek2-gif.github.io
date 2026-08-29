#!/usr/bin/env node
/**
 * build-kcw-this-week.mjs — **「이번 주 넷플릭스에 한국 작품 뭐가 올라 있나」에 답하는 자리.**
 *   내는 것: `src/data/kcw-this-week.json` → `/netflix-korea-this-week`
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 사장님 지시 — 「**텍스트가 6번**이야」·「오늘 이순간 이슈되는 걸 찾아서」
 *
 * 우리는 주 지면을 **268장** 갖고 있다. 그런데 «늘 최신을 가리키는 입구»가 없었다.
 * 손님은 「이번 주」를 묻는데, 우리는 「2026-08-16」이라는 날짜를 알아야만 찾아올 수 있었다.
 * ⭐ 날짜를 아는 사람은 이미 우리 손님이다. **모르는 사람을 받는 문**이 없었다.
 *
 * ⭐ 그리고 이 지면은 «다시 오게» 만든다 — 주마다 내용이 바뀌는 유일한 자리다.
 *   사장님이 「방문자·체류시간에 올인」이라 하셨고, 재방문은 그 둘을 한꺼번에 올린다.
 *
 * ── 무엇을 더 내나 — 남이 안 세는 것 ─────────────────────────
 * 「이번 주 목록」은 넷플릭스도 낸다. 우리가 더 낼 수 있는 것은 **지난주와의 차이**다.
 * ```
 *   들어온 것   지난주엔 없다가 이번 주에 오른 작품
 *   나간 것     지난주엔 있었는데 이번 주엔 없는 작품
 *   버틴 것     둘 다 있는 작품 — 나라 수가 늘었나 줄었나
 * ```
 * ⛔ 「인기가 올랐다」로 쓰지 않는다. **나라 수가 늘었다**고만 쓴다. 우리는 시청자를 못 센다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **두 차트를 안 뭉갠다.** 넷플릭스는 영화·시리즈 목록을 따로 내고, 이름이 같은 «다른 작품»이
 *   양쪽에 앉는다. 어느 쪽이 우리 작품인지는 build-wikitip-title-pages 가 정해 둔 `type` 을 따른다.
 *   ⚠ 여기서 다시 정하지 않는다 — 두 자가 각자 정하면 반드시 갈라진다.
 * ⛔ 러시아는 뺀다. 넷플릭스가 나갔다 — 다른 지면과 같게 한다.
 * ⛔ 못 잰 칸을 0 으로 안 채운다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-this-week.mjs --자가시험
 *   node scripts/build-kcw-this-week.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 나라판 = path.join(뿌리, 'archive/raw/netflix-top10/countries.ndjson');
const 제목길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/kcw-this-week.json');

/** 얼마나 거슬러 볼까 — 흐름을 보여 줄 만큼만 */
export const 볼주수 = 8;

/**
 * 두 주를 견줘 들어온 것·나간 것·버틴 것을 가른다.
 * ⛔ 「인기」를 말하지 않는다. 나라 수가 늘었나 줄었나만 말한다.
 */
export function 주차이(이번, 지난) {
  const A = new Map((이번 ?? []).map((t) => [t.slug ?? t.title, t]));
  const B = new Map((지난 ?? []).map((t) => [t.slug ?? t.title, t]));
  const 들어온 = [...A.values()].filter((t) => !B.has(t.slug ?? t.title));
  const 나간 = [...B.values()].filter((t) => !A.has(t.slug ?? t.title));
  const 버틴 = [...A.values()].filter((t) => B.has(t.slug ?? t.title)).map((t) => {
    const 옛 = B.get(t.slug ?? t.title);
    return { ...t, 지난나라: 옛.countries, 나라변화: t.countries - 옛.countries };
  });
  return { 들어온, 나간, 버틴 };
}

/** 큰 것부터. 같으면 이름 순 — 답이 매번 같아야 한다 */
export function 줄세우기(것들) {
  return [...(것들 ?? [])].sort((a, b) => (b.countries - a.countries)
    || (a.peak - b.peak)
    || String(a.title).localeCompare(String(b.title)));
}

/** 며칠 전 자료인가. ⛔ 「이번 주」라고 적으면서 두 주 묵은 것을 내놓지 않는다 */
export function 며칠전(주, 오늘) {
  const a = Date.parse(`${주}T00:00:00Z`);
  const b = Date.parse(`${오늘}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 이번 = [
    { slug: 'a', title: 'A', countries: 10, peak: 1 },
    { slug: 'b', title: 'B', countries: 3, peak: 4 },
    { slug: 'c', title: 'C', countries: 5, peak: 2 },
  ];
  const 지난 = [
    { slug: 'a', title: 'A', countries: 6, peak: 2 },
    { slug: 'd', title: 'D', countries: 9, peak: 1 },
  ];
  const d = 주차이(이번, 지난);
  검('들어온 것을 찾는다', d.들어온.map((t) => t.slug).sort().join() === 'b,c');
  검('나간 것을 찾는다', d.나간.map((t) => t.slug).join() === 'd');
  검('버틴 것을 찾는다', d.버틴.map((t) => t.slug).join() === 'a');
  검('버틴 것의 나라 변화를 적는다', d.버틴[0].나라변화 === 4 && d.버틴[0].지난나라 === 6);
  검('⛔ 빈 것도 안 터진다',
    주차이(undefined, undefined).들어온.length === 0 && 주차이([], []).나간.length === 0);
  검('지난주가 아예 없으면 다 「들어온 것」', 주차이(이번, []).들어온.length === 3);

  const s = 줄세우기(이번);
  검('나라 많은 것이 앞', s[0].slug === 'a' && s[1].slug === 'c');
  검('같은 나라 수면 순위가 앞선 것이 앞', 줄세우기([
    { title: 'X', countries: 2, peak: 5 }, { title: 'Y', countries: 2, peak: 1 },
  ])[0].title === 'Y');
  검('나라·순위가 같으면 이름 순 — 답이 매번 같다', 줄세우기([
    { title: 'Z', countries: 1, peak: 1 }, { title: 'Y', countries: 1, peak: 1 },
  ])[0].title === 'Y');
  검('⛔ 빈 것도 안 터진다', 줄세우기(undefined).length === 0);

  검('며칠 전인지 센다', 며칠전('2026-08-16', '2026-08-29') === 13);
  검('같은 날은 0', 며칠전('2026-08-16', '2026-08-16') === 0);
  검('⛔ 못 읽으면 null — 0 이 아니다',
    며칠전('없는날', '2026-08-29') === null && 며칠전(undefined, undefined) === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((x) => `   · ${x}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-this-week 자가시험 통과 (13)');
  process.exit(0);
}

/* ── 실제로 짓는다 ── */
const 제목자료 = JSON.parse(fs.readFileSync(제목길, 'utf8'));
/* ⛔ 어느 차트가 이 작품의 것인가 — 여기서 다시 정하지 않고 그 자가 정해 둔 것을 따른다 */
const 제목차트 = new Map(제목자료.titles.map((t) => [t.title, t.type]));
const 제목주소 = new Map(제목자료.titles.filter((t) => t.hasPage).map((t) => [t.title, t.slug]));
const ko = koreanTitleFilter();

/** 주 → 제목 → { 나라: Set, 최고순위 } */
const 주별 = new Map();
const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
for await (const 줄 of rl) {
  if (!줄.trim()) continue;
  let r; try { r = JSON.parse(줄); } catch { continue; }
  if (r.iso2 === 'RU') continue;                      /* 넷플릭스가 나갔다 */
  if (!ko.keepTitle(r.제목)) continue;
  const 내차트 = 제목차트.get(r.제목);
  if (내차트 && r.구분 !== 내차트) continue;            /* ⛔ 이름이 같은 다른 작품이다 */
  if (!주별.has(r.주)) 주별.set(r.주, new Map());
  const 표 = 주별.get(r.주);
  if (!표.has(r.제목)) 표.set(r.제목, { title: r.제목, 나라: new Set(), peak: 99 });
  const t = 표.get(r.제목);
  t.나라.add(r.iso2);
  if (r.순위 < t.peak) t.peak = r.순위;
}

const 주들 = [...주별.keys()].sort();
if (!주들.length) throw new Error('주가 하나도 안 잡혔다 — 자를 먼저 의심한다');
const 이번주 = 주들[주들.length - 1];
const 지난주 = 주들[주들.length - 2] ?? null;

const 정리 = (주) => (주 == null ? [] : 줄세우기([...(주별.get(주)?.values() ?? [])].map((t) => ({
  title: t.title,
  slug: 제목주소.get(t.title) ?? null,      /* ⛔ 지면이 없으면 링크를 안 건다 */
  countries: t.나라.size,
  peak: t.peak,
  type: 제목차트.get(t.title) ?? null,
}))));

const 이번 = 정리(이번주);
const 지난 = 정리(지난주);
const 차이 = 주차이(이번, 지난);

/* 지난 여덟 주의 흐름 — 「이번 주가 많은 편인가」를 손님이 스스로 보게 한다 */
const 흐름 = 주들.slice(-볼주수).map((w) => {
  const 것 = [...(주별.get(w)?.values() ?? [])];
  const 나라 = new Set();
  것.forEach((t) => t.나라.forEach((c) => 나라.add(c)));
  return { week: w, titles: 것.length, countries: 나라.size };
});

const 오늘 = new Date().toISOString().slice(0, 10);
const 낼것 = {
  generated: new Date().toISOString(),
  source: 제목자료.source,
  unit: 제목자료.unit,
  cannotAnswer: 제목자료.cannotAnswer,
  week: 이번주,
  previousWeek: 지난주,
  /** ⚠ 「이번 주」라 적으면서 몇 주 묵은 것을 내지 않도록, 며칠 된 자료인지 지면이 적는다 */
  daysOld: 며칠전(이번주, 오늘),
  marketCount: 제목자료.marketCount,
  titles: 이번,
  entered: 줄세우기(차이.들어온),
  left: 줄세우기(차이.나간),
  held: 줄세우기(차이.버틴),
  trend: 흐름,
};

/* ── 스스로 본다 ── */
if (!낼것.titles.length) throw new Error('이번 주 작품이 0편이다 — 자를 의심한다');
for (const t of 낼것.titles) {
  if (t.countries > 제목자료.marketCount) throw new Error(`${t.title}: 나라 수가 넘는다`);
  if (t.peak < 1 || t.peak > 10) throw new Error(`${t.title}: 최고 순위가 ${t.peak} 다`);
}
if (낼것.entered.length + 낼것.held.length !== 낼것.titles.length) {
  throw new Error('들어온 것 + 버틴 것이 이번 주 전체와 안 맞는다');
}

fs.writeFileSync(낼길, `${JSON.stringify(낼것, null, 1)}\n`);

console.log(`■ 이번 주 — ${이번주} (자료가 ${낼것.daysOld}일 됐다)`);
console.log(`   한국 작품 ${이번.length}편 · 나라 ${new Set(이번.flatMap(() => [])).size || 흐름[흐름.length - 1].countries}곳`);
console.log(`   들어온 것 ${낼것.entered.length}편 · 나간 것 ${낼것.left.length}편 · 버틴 것 ${낼것.held.length}편`);
console.log(`   가장 넓은 것 — ${이번[0].title} (${이번[0].countries}나라, 최고 ${이번[0].peak}위)`);
console.log(`   → ${낼길}`);
