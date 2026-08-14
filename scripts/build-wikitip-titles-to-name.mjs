#!/usr/bin/env node
/**
 * **작품이 늘면 이름이 읽히나** (`/titles-to-name`) — 87편째.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   76편에서 「데뷔 나이가 도달을 사나」를 재다 못 읽었다. 까닭은 그때 적었다 —
 *   배우 절반이 차트 작품 한 편뿐이라 **그 사람의 값이 그 작품의 값**이었다.
 *   ⭐ 그런데 자를 바꾸면 읽힌다. 「도달」 대신 **그 사람 이름이 읽힌 횟수**를 쓰면
 *      작품 수와 한 방향으로 간다. 76편이 못 읽은 것이 아니라 **자가 안 맞았던 것**이다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ **인과로 안 쓴다.** 작품이 이름을 끌었는지, 이름이 작품을 끌었는지 이 자로는 못 가른다.
 *    그 말을 표 바로 아래 같은 크기로 적는다.
 * ⛔ 열다섯 명이 안 되는 칸은 가운데값을 안 낸다.
 * ⚠ 76편을 지우지 않는다. **76편이 옳았고, 여기서 자를 바꿨다**고 적는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 배우길 = 'archive/raw/wikipedia/sea-actors.json';
const 결과 = 'src/data/wikitip-titles-to-name.json';
const 최소칸 = 15;

export const 띠 = [
  { lo: 1, hi: 2, label: '1 title' },
  { lo: 2, hi: 3, label: '2 titles' },
  { lo: 3, hi: 5, label: '3–4 titles' },
  { lo: 5, hi: 9999, label: '5 or more' },
];

export function 가운데(수들) {
  const s = [...수들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  return s.length ? s[s.length >> 1] : null;
}

/** 🔴 한 방향으로 가나 — 안 가면 「샀다」고 쓸 수 없다 */
export function 한방향인가(값들) {
  const v = 값들.filter((x) => typeof x === 'number');
  if (v.length < 2) return null;
  const 늘 = v.every((x, i) => i === 0 || x >= v[i - 1]);
  const 줄 = v.every((x, i) => i === 0 || x <= v[i - 1]);
  return 늘 || 줄;
}

export function 띠짓기(사람들) {
  return 띠.map((b) => {
    const g = 사람들.filter((x) => typeof x.chartingTitles === 'number'
      && x.chartingTitles >= b.lo && x.chartingTitles < b.hi);
    const 값 = g.map((x) => x.seaPerMillionTotal).filter((v) => typeof v === 'number');
    const 맨위 = g.length ? g.reduce((p, c) => ((c.seaPerMillionTotal ?? 0) > (p.seaPerMillionTotal ?? 0) ? c : p)) : null;
    return {
      band: b.label,
      actors: g.length,
      medianRead: g.length >= 최소칸 ? 가운데(값) : null,
      topName: 맨위?.name ?? null,
      topRead: 맨위?.seaPerMillionTotal ?? null,
    };
  });
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };
  재본다('띠가 넷', 띠.length, 4);
  재본다('띠가 안 겹친다', 띠.every((b, i) => i === 0 || b.lo === 띠[i - 1].hi), true);
  재본다('한방향 — 늘기만 하면 참', 한방향인가([1, 2, 4, 11]), true);
  재본다('한방향 — 오르내리면 거짓', 한방향인가([1, 4, 2, 11]), false);
  재본다('한방향 — 값이 하나면 판단 안 한다', 한방향인가([3]), null);
  재본다('⛔ 열다섯이 안 되는 칸은 가운데값을 안 낸다',
    띠짓기([{ chartingTitles: 1, seaPerMillionTotal: 5 }])[0].medianRead, null);
  재본다('⛔ 그래도 사람 수는 남긴다',
    띠짓기([{ chartingTitles: 1, seaPerMillionTotal: 5 }])[0].actors, 1);
  재본다('가운데 — 빈 것은 null(0 이 아니다)', 가운데([]), null);
  console.log(`작품→이름 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(배우길)) { console.error(`⛔ 없다 — ${배우길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(배우길, 'utf8'));
  const 사람 = d.people.filter((x) => typeof x.chartingTitles === 'number' && x.chartingTitles > 0);
  const 표 = 띠짓기(사람);
  const 값들 = 표.map((r) => r.medianRead);
  const 한방향 = 한방향인가(값들);
  const 첫 = 값들.find((v) => typeof v === 'number');
  const 끝 = [...값들].reverse().find((v) => typeof v === 'number');

  const out = {
    generated: new Date().toISOString(),
    source: 'Wikidata cast lists for Korean titles that reached a Netflix country chart, joined to '
      + 'Wikimedia pageviews in four Southeast Asian editions',
    window: d.window,
    unit: 'Reads per million reads of the whole language edition, summed across Indonesia, Vietnam, '
      + 'Thailand and Malaysia, 12 months. One row is one actor.',
    question: 'Does having more charting titles mean an actor\'s own name is looked up more?',
    actorsCounted: 사람.length,
    bands: 표,
    minimumBand: 최소칸,
    /** 🔴 참이어야 「작품 수가 무엇을 산다」고 쓸 수 있다 */
    monotonic: 한방향,
    lowestBandMedian: 첫,
    highestBandMedian: 끝,
    multiple: 첫 && 끝 ? +(끝 / 첫).toFixed(1) : null,
    finding: 한방향
      ? `The median actor with five or more charting titles is looked up ${첫 && 끝 ? +(끝 / 첫).toFixed(1) : '?'} `
        + `times as often as the median actor with one. The four bands run ${값들.join(', ')} and do `
        + 'not turn back.'
      : 'The bands do not run in one direction, so we do not report title count as buying anything.',
    /** ⚠ 76편을 지우지 않는다 */
    whatChangedSince76: 'We measured this once before with a different instrument and could not read '
      + 'it. That piece asked how far an actor\'s titles travelled, and for half the panel that '
      + 'figure was a fact about one title rather than about the person. This asks a narrower '
      + 'question — how often the person\'s own article is opened — and that one moves.',
    cannotAnswer: 'This cannot say which way the arrow points. An actor with five charting titles is '
      + 'looked up more, but casting follows attention as readily as attention follows casting, and '
      + 'nothing here separates the two. It is also a floor: readers in these four countries use the '
      + 'English Wikipedia too, and that cannot be split by country.',
    panelCaveat: d.panelCaveat,
  };
  fs.writeFileSync(결과, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`⭐ ${결과}\n`);
  console.log('작품 수      배우   가운데 읽힘   맨 위');
  for (const r of 표) {
    console.log(`${r.band.padEnd(12)}${String(r.actors).padStart(5)}`
      + `${String(r.medianRead ?? '—').padStart(13)}   ${r.topName} ${r.topRead}`);
  }
  console.log(`\n${한방향 ? '🔴' : '⚠'} ${out.finding}`);
}
