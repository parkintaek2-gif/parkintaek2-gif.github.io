#!/usr/bin/env node
/**
 * collect-kcw-solo-vs-group.mjs — **솔로로 나오면 독자가 사람을 따라가나, 그룹에 남나.**
 *
 * ── 왜 만드나 (2026-09-05) ──────────────────────────────────
 * 오늘 MBC 쇼! 음악중심에 «같은 날» 솔로 컴백 무대가 둘 올랐다(r/kpop) —
 *   Taemin (SHINee) — Float   ·   TEN (NCT/WayV) — Outwest
 * 둘 다 «그룹 멤버의 솔로»다. 그러면 자연히 묻게 된다 —
 *   **영어권 독자는 그 사람을 읽나, 아니면 여전히 그룹을 읽나.**
 *
 * ⭐ 우리 축(영문 위키백과 열람수)은 그것을 사람 대 그룹으로 곧장 잰다.
 *   ⛔ 「누가 더 인기 있나」가 아니다. 「읽는 사람이 어느 문서를 여나」다.
 *
 * ── ⛔ 이 자가 안 하는 것 ─────────────────────────────
 * ⛔ 솔로 활동의 «성패»를 말하지 않는다. 우리는 문서 열람만 잰다
 * ⛔ 오늘 컴백의 효과를 말하지 않는다 — 오늘치 열람수는 아직 채워지지도 않았다
 * ⛔ 애매한 문서(동음이의)를 사람으로 세지 않는다. 설명을 보고 걸러 낸다
 *
 * 쓰는 법
 *   node scripts/collect-kcw-solo-vs-group.mjs --자가시험
 *   node scripts/collect-kcw-solo-vs-group.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-solo-vs-group.json');

/**
 * 잴 짝 — **그룹 멤버로 솔로 활동을 하는 사람**과 그 그룹.
 * ⚠ 이름은 위키백과 문서 이름이지 무대 이름이 아니다. 아래 `사람문서인가()` 가 확인한다.
 */
export const 짝들 = [
  { person: 'Taemin', group: 'Shinee', label: 'Taemin', groupLabel: 'SHINee' },
  { person: 'Ten (singer)', group: 'NCT (group)', label: 'TEN', groupLabel: 'NCT' },
  { person: 'Jimin', group: 'BTS', label: 'Jimin', groupLabel: 'BTS' },
  { person: 'Rosé (singer)', group: 'Blackpink', label: 'Rosé', groupLabel: 'Blackpink' },
  { person: 'Sunmi', group: 'Wonder Girls', label: 'Sunmi', groupLabel: 'Wonder Girls' },
  { person: 'Hwasa', group: 'Mamamoo', label: 'Hwasa', groupLabel: 'Mamamoo' },
  { person: 'Jihyo', group: 'Twice', label: 'Jihyo', groupLabel: 'Twice' },
  { person: 'Baekhyun', group: 'Exo', label: 'Baekhyun', groupLabel: 'EXO' },
];

/**
 * 그 문서가 «사람»인가. ⛔ 동음이의 문서를 사람으로 세지 않는다.
 * 🔴 실제로 걸렸다 — `Kai (singer)` 가 「Topics referred to by the same term」으로 넘어갔다.
 *   그 문서의 열람수를 사람 것으로 읽었으면 수가 통째로 틀렸을 것이다.
 */
export function 사람문서인가(요약) {
  const 설명 = String(요약?.description ?? '').toLowerCase();
  if (!설명) return { 맞다: false, 까닭: '설명이 비었다' };
  if (/topics referred to|may refer to|disambiguation/.test(설명)) {
    return { 맞다: false, 까닭: `동음이의 문서다 — 「${요약.description}」` };
  }
  if (!/(singer|rapper|actor|actress|dancer|songwriter|entertainer|musician)/.test(설명)) {
    return { 맞다: false, 까닭: `사람 문서가 아니다 — 「${요약.description}」` };
  }
  return { 맞다: true, 까닭: 요약.description };
}

/** 그 문서가 «그룹»인가 */
export function 그룹문서인가(요약) {
  const 설명 = String(요약?.description ?? '').toLowerCase();
  if (!설명) return { 맞다: false, 까닭: '설명이 비었다' };
  if (/topics referred to|may refer to|disambiguation/.test(설명)) {
    return { 맞다: false, 까닭: `동음이의 문서다 — 「${요약.description}」` };
  }
  if (!/(band|group|duo|trio)/.test(설명)) return { 맞다: false, 까닭: `그룹 문서가 아니다 — 「${요약.description}」` };
  return { 맞다: true, 까닭: 요약.description };
}

/** ⛔ 평균이 아니라 중간값 */
export function 중간값(수들) {
  const s = [...수들].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/**
 * 사람이 그룹의 몇 곱절로 읽히나.
 * ⛔ 「몫」으로 내지 않는다 — 한 사람을 읽은 사람이 그룹도 읽었을 수 있어 둘을 더할 수 없다.
 *   더할 수 없는 둘로 백분율을 만들면 그 백분율은 아무 뜻이 없다.
 */
export function 곱절(사람, 그룹) {
  if (!Number.isFinite(사람) || !Number.isFinite(그룹) || 그룹 === 0) return null;
  return Math.round((사람 / 그룹) * 100) / 100;
}

export function 여덟자리(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function 요약받기(title) {
  const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')),
    { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  return r.ok ? r.json() : null;
}

async function 열람받기(title, 처음, 끝) {
  const u = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/'
    + encodeURIComponent(title.replace(/ /g, '_')) + `/daily/${처음}/${끝}`;
  const r = await fetch(u, { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.items ?? []).map((x) => ({ date: String(x.timestamp).slice(0, 8), views: x.views }));
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('가수는 사람이다', 사람문서인가({ description: 'South Korean singer (born 1995)' }).맞다, true);
  같나('배우도 사람이다', 사람문서인가({ description: 'South Korean actor' }).맞다, true);
  /* 🔴 실제로 걸린 것 — Kai (singer) 가 동음이의로 넘어갔다 */
  같나('⛔ 동음이의는 사람이 아니다',
    사람문서인가({ description: 'Topics referred to by the same term' }).맞다, false);
  같나('⛔ 그룹은 사람이 아니다', 사람문서인가({ description: 'South Korean boy band' }).맞다, false);
  같나('⛔ 설명이 없으면 안 맞다로 둔다', 사람문서인가({}).맞다, false);

  같나('보이밴드는 그룹이다', 그룹문서인가({ description: 'South Korean boy band' }).맞다, true);
  같나('걸그룹도 그룹이다', 그룹문서인가({ description: 'South Korean girl group' }).맞다, true);
  같나('⛔ 사람은 그룹이 아니다', 그룹문서인가({ description: 'South Korean singer' }).맞다, false);
  같나('⛔ 동음이의는 그룹이 아니다',
    그룹문서인가({ description: 'may refer to several things' }).맞다, false);

  같나('중간값 홀수', 중간값([5, 1, 3]), 3);
  같나('중간값 짝수', 중간값([1, 3]), 2);
  같나('중간값 빈 것은 null', 중간값([]), null);

  같나('곱절을 두 자리로 낸다', 곱절(300, 200), 1.5);
  같나('그룹이 0 이면 null 이다', 곱절(300, 0), null);
  같나('한쪽이 없으면 null 이다', 곱절(null, 200), null);
  같나('1 보다 작으면 그대로 낸다', 곱절(50, 200), 0.25);

  같나('여덟자리', 여덟자리(new Date('2026-09-05T02:00:00')), '20260905');

  같나('짝마다 사람과 그룹이 다 있다', 짝들.every((p) => p.person && p.group), true);
  같나('짝마다 화면 이름이 있다', 짝들.every((p) => p.label && p.groupLabel), true);
  같나('오늘 컴백한 둘이 목록에 있다',
    ['Taemin', 'TEN'].every((l) => 짝들.some((p) => p.label === l)), true);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 솔로 대 그룹 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 받는다 ───────────────────────────────────────────── */
if (내가실행됐다) {
  const 오늘 = new Date();
  const 끝 = 여덟자리(오늘);
  const 처음 = 여덟자리(new Date(오늘.getTime() - 120 * 86400e3));

  const 줄들 = []; const 못잰것 = [];
  for (const 짝 of 짝들) {
    const 사람요약 = await 요약받기(짝.person);
    const 그룹요약 = await 요약받기(짝.group);
    if (!사람요약) { 못잰것.push(`${짝.label} — no English Wikipedia article`); continue; }
    if (!그룹요약) { 못잰것.push(`${짝.groupLabel} — no English Wikipedia article`); continue; }
    const a = 사람문서인가(사람요약); const b = 그룹문서인가(그룹요약);
    if (!a.맞다) { 못잰것.push(`${짝.label} — ${a.까닭}`); continue; }
    if (!b.맞다) { 못잰것.push(`${짝.groupLabel} — ${b.까닭}`); continue; }

    const 사람줄 = await 열람받기(사람요약.title, 처음, 끝);
    const 그룹줄 = await 열람받기(그룹요약.title, 처음, 끝);
    if (!사람줄.length || !그룹줄.length) { 못잰것.push(`${짝.label} — no pageview rows`); continue; }

    /* 마지막 30일. ⛔ 오늘·어제는 아직 안 찬 날일 수 있어 있는 날만 센다 */
    const 사람30 = 중간값(사람줄.slice(-30).map((x) => x.views));
    const 그룹30 = 중간값(그룹줄.slice(-30).map((x) => x.views));
    줄들.push({
      person: 사람요약.title, personLabel: 짝.label, personDesc: 사람요약.description,
      group: 그룹요약.title, groupLabel: 짝.groupLabel, groupDesc: 그룹요약.description,
      personReads: 사람30, groupReads: 그룹30,
      times: 곱절(사람30, 그룹30),
      lastDate: 사람줄[사람줄.length - 1]?.date ?? null,
    });
    console.log(`✅ ${짝.label.padEnd(10)} ${사람30} vs ${짝.groupLabel.padEnd(14)} ${그룹30}  →  ${곱절(사람30, 그룹30)}x`);
  }

  줄들.sort((a, b) => (b.times ?? 0) - (a.times ?? 0));
  const 사람이앞선것 = 줄들.filter((r) => (r.times ?? 0) > 1);

  const 낼것 = {
    measuredAt: 오늘.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    source: 'Wikimedia Pageviews API — en.wikipedia, all-access, user agents only (bots excluded)',
    measures: 'Median daily English Wikipedia reads over the last 30 days, for a soloist and for the '
      + 'group they belong to, side by side',
    aheadOfTheirGroup: 사람이앞선것.length,
    behindTheirGroup: 줄들.length - 사람이앞선것.length,
    notMeasured: [
      'Whether a solo release did well. This counts encyclopedia reads, not sales, streams or charts',
      'Today\'s reading. Wikimedia fills its counts in about a day late',
      'A share of one audience. A reader can open both pages, so the two counts cannot be added or '
      + 'turned into percentages of a whole',
    ],
    unmeasured: 못잰것,
    rows: 줄들,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
  console.log(`\n📁 적었다 — ${path.relative(뿌리, 낼곳)}`);
  console.log(`   사람이 그룹보다 많이 읽히는 짝 ${사람이앞선것.length} / ${줄들.length}`);
  for (const s of 못잰것) console.log(`   ⬜ ${s}`);
}
