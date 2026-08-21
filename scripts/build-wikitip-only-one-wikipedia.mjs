#!/usr/bin/env node
/**
 * **네 판 중 한 판만 갖고 있는 스타는 누구인가.** (`/only-one-wikipedia`)
 *
 * ⭐⭐ 사장님 지시(8/16) — 제목·본문에 **스타 이름과 소속 그룹명**을 넣는다.
 *    그래서 이 자는 수만 세지 않고 **이름을 골라 낸다**(판마다 많이 읽힌 순).
 *
 * ── 찾은 것 ────────────────────────────────────────────────────
 * ```
 *   한 판에만 문서가 있는 사람       음악 828/1,701   배우 421/1,023
 *   그 한 판이 인도네시아어판인 비율   음악 746/828    배우 409/421
 * ```
 * ⛔ 「인도네시아어판이 크니까」로 설명되지 않는다 — 베트남어판이 문서 1,304,001 로
 *   인도네시아어판 790,784 보다 크다. 크기로 설명이 안 되는 것까지만 말하고 멈춘다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **두 자로 재고 서로 대 본다.** `seaEditionsWithArticle`(문서 있는 판 수)과
 *   `perMillion` 에 수가 있는 판 수 — 둘이 어긋나면 짓지 않는다. 한 자로만 재면 늘 맞는다.
 * ⛔ **「없는 문서」를 0 으로 안 센다.** 문서가 없으면 그 판에서 그 사람을 안 센다.
 * ⛔ **한 판만 있는 것을 「인기 없다」로 안 읽는다.** 문서가 있고 없고는 편집자가 정한다.
 * ⛔ 광고 자리를 만들지 않는다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-only-one-wikipedia.mjs
 *   node scripts/build-wikitip-only-one-wikipedia.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 근거, 백만분율 as 백만분율자 } from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 음악길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-musicians.json');
export const 배우길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-actors.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-only-one-wikipedia.json');

export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 판이름 = { id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay' };
export const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };

/** ⚠ 판 크기는 우리가 이미 쟀다(`/written-down-first`). 크기 반론을 죽이는 데 쓴다 */
export const 판크기 = {
  id: { articles: 790784, activeEditors: 4690 },
  vi: { articles: 1304001, activeEditors: 4726 },
  th: { articles: 186434, activeEditors: 2963 },
  ms: { articles: 440840, activeEditors: 2018 },
};

/** 수가 있는 판 목록. ⛔ 없는 판을 0 으로 안 센다 */
export function 있는판(사람, 볼판 = 판들) {
  return 볼판.filter((p) => typeof 사람?.perMillion?.[p] === 'number');
}

/**
 * ⛔⛔ **두 자가 같은 답을 내나.** 문서 수 칸과 백만분율 칸을 맞대 본다.
 *   ⭐ 8/16 에 한 자로만 재어 「문제 없음」을 낸 적이 있다 — 그래서 이 시험이 있다.
 */
export function 두자가맞나(사람들) {
  const 어긋남 = 사람들.filter((x) => typeof x.seaEditionsWithArticle === 'number'
    && x.seaEditionsWithArticle !== 있는판(x).length);
  return { agree: 어긋남.length === 0, disagreeing: 어긋남.length };
}

/** 한 판에만 있는 사람들을 그 판별로 모은다 */
export function 한판만(사람들) {
  const 방 = Object.fromEntries(판들.map((p) => [p, []]));
  let 셈 = 0;
  for (const x of 사람들) {
    const 판 = 있는판(x);
    if (판.length !== 1) continue;
    셈 += 1;
    방[판[0]].push({ name: x.name, perMillion: x.perMillion[판[0]], isGroup: x.isGroup ?? null });
  }
  for (const p of 판들) 방[p].sort((a, b) => b.perMillion - a.perMillion);
  return { total: 셈, byEdition: 방 };
}

/** ⛔ 「큰 판이라서」가 설명이 되나. 안 되면 안 된다고만 말한다 */
export function 크기로설명되나(한판, 크기 = 판크기) {
  const 제일많이 = 판들.reduce((a, b) => (한판.byEdition[b].length > 한판.byEdition[a].length ? b : a));
  const 제일큰 = 판들.reduce((a, b) => (크기[b].articles > 크기[a].articles ? b : a));
  return {
    keepsMost: 제일많이,
    largest: 제일큰,
    explainedBySize: 제일많이 === 제일큰,
    sizes: 크기,
    weDoNotSayWhat: 'A bigger encyclopaedia would be expected to hold more of everything. It is '
      + 'not the biggest of the four that keeps these names, so we can rule that explanation out. '
      + 'We did not measure what replaces it and we are not going to guess.',
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };

  재본다('수가 있는 판만 센다', 있는판({ perMillion: { id: 1, vi: null, th: 0, ms: undefined } }), ['id', 'th']);
  재본다('⛔⛔ 0 은 「있는 것」이다 — 없는 것과 다르다', 있는판({ perMillion: { id: 0 } }).length, 1);
  재본다('⛔ 칸이 통째로 없으면 0개', 있는판({}), []);

  /* ⛔⛔ 두 자가 어긋나면 잡아야 한다 */
  재본다('⭐ 두 자가 맞으면 통과',
    두자가맞나([{ seaEditionsWithArticle: 1, perMillion: { id: 5 } }]).agree, true);
  재본다('⛔⛔ 두 자가 어긋나면 잡는다',
    두자가맞나([{ seaEditionsWithArticle: 3, perMillion: { id: 5 } }]).agree, false);

  const 한 = 한판만([
    { name: 'A', perMillion: { id: 9 } },
    { name: 'B', perMillion: { id: 3 } },
    { name: 'C', perMillion: { vi: 4 } },
    { name: 'D', perMillion: { id: 1, vi: 2 } },
  ]);
  재본다('한 판에만 있는 사람만 센다', 한.total, 3);
  재본다('⭐ 판마다 많이 읽힌 순으로 세운다', 한.byEdition.id.map((x) => x.name), ['A', 'B']);
  재본다('두 판에 있는 사람은 안 든다', 한.byEdition.vi.map((x) => x.name), ['C']);

  /* ⛔ 크기 반론 — 제일 많이 가진 판이 제일 큰 판이 아니면 설명이 안 된다 */
  const 크 = 크기로설명되나(한);
  재본다('⭐ 제일 많이 가진 판을 찾는다', 크.keepsMost, 'id');
  재본다('⭐ 제일 큰 판은 베트남어판이다', 크.largest, 'vi');
  재본다('⛔⛔ 크기로 설명되지 않는다', 크.explainedBySize, false);
  재본다('⛔ 「무엇이 대신인지는 모른다」를 적는다', /not going to guess/.test(크.weDoNotSayWhat), true);

  재본다('⭐ 원본 둘이 있다', fs.existsSync(음악길) && fs.existsSync(배우길), true);

  console.log(`한 판만 가진 이를 세는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 음 = JSON.parse(fs.readFileSync(음악길, 'utf8'));
  const 배 = JSON.parse(fs.readFileSync(배우길, 'utf8'));

  /* ⛔⛔ 두 자가 어긋나면 짓지 않는다 */
  for (const [이름, src] of [['music acts', 음], ['actors', 배]]) {
    const 맞나 = 두자가맞나(src.people);
    if (!맞나.agree) {
      console.error(`⛔ ${이름}: 두 자가 ${맞나.disagreeing}명에서 어긋난다 — 짓지 않는다`);
      process.exit(1);
    }
  }

  const 무리 = [
    { key: 'music', label: 'Music acts', people: 음.people, panel: 음.panel },
    { key: 'actors', label: 'Actors', people: 배.people, panel: 배.panel },
  ].map((g) => {
    const 한 = 한판만(g.people);
    const { people, ...나머지 } = g;
    return {
      ...나머지,
      measured: people.length,
      onlyOne: 한.total,
      onlyOnePc: +((100 * 한.total) / people.length).toFixed(1),
      byEdition: Object.fromEntries(판들.map((p) => [p, {
        count: 한.byEdition[p].length,
        sharePc: +((100 * 한.byEdition[p].length) / 한.total).toFixed(1),
        /* ⭐ 이름을 낸다 — 사장님 지시. 수만 내면 아무도 안 찾는다 */
        names: 한.byEdition[p].slice(0, 8),
      }])),
      size: 크기로설명되나(한),
    };
  });

  const 자료 = {
    generated: 음.generated?.slice(0, 10) ?? null,
    source: 음.source,
    window: 음.window,
    editions: 판들,
    editionNames: 판이름,
    countryNames: 나라이름,
    question: 'Some Korean stars have an article on only one of the four Southeast Asian '
      + 'Wikipedias. Which one keeps them, and who are they?',
    twoRulersAgree: 'Two different fields were used to count how many editions hold an article '
      + 'about a person — the edition count recorded with each person, and the number of editions '
      + 'that returned a reading figure. They agree for every one of the '
      + `${(음.people.length + 배.people.length).toLocaleString('en-US')} people here. A check `
      + 'that reuses the field being checked would agree with itself, so we used both.',
    groups: 무리,
    ...근거([백만분율자], {
      방법: 'A person counts for an edition only if that edition has an article about them. '
        + 'A missing article is left missing rather than counted as zero, and the names shown for '
        + 'each edition are the most-read ones there.',
      한계: 'Whether an article exists is a decision made by editors, not a measure of interest. '
        + 'A star held by one edition alone may be well known in the other three and simply '
        + 'unwritten there, and this page cannot tell those two apart. The panel is the cast and '
        + 'the acts behind Korean titles that reached a Netflix country chart, so anyone outside '
        + 'that is absent entirely.',
    }),
    cannotSay: [
      'Not popularity. An article existing is an editing decision. Someone unwritten in Thai may '
        + 'still be well known in Thailand.',
      'Not why. We can rule out edition size — the biggest of the four is not the one that keeps '
        + 'these names — and we did not measure what replaces it.',
      'Not everyone. The panel is built from Korean titles that reached a Netflix country chart.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  for (const g of 무리) {
    console.log(`\n${g.label} — 한 판에만 있는 이 ${g.onlyOne}/${g.measured} (${g.onlyOnePc}%)`);
    for (const p of 판들) {
      const e = g.byEdition[p];
      console.log(`   ${판이름[p].padEnd(11)} ${String(e.count).padStart(4)} (${e.sharePc}%)  `
        + e.names.slice(0, 3).map((x) => `${x.name} ${x.perMillion}`).join(' · '));
    }
    console.log(`   ⛔ 크기로 설명되나: ${g.size.explainedBySize}`
      + ` (제일 많이 가진 판 ${g.size.keepsMost} · 제일 큰 판 ${g.size.largest})`);
  }
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
