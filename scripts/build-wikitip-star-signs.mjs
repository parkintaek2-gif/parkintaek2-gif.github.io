#!/usr/bin/env node
/**
 * **띠별로 스타의 이름을 늘어놓는다.** (`/star-signs`)
 *
 * ⭐⭐ 사장님 지시(8/16·8/20) — 스타의 **이름**을 제목과 본문에. 사람들은 이름을 검색한다.
 *
 * ── 🔴 이 지면이 절대 안 하는 것 ─────────────────────────────
 * ⛔ **점을 치지 않는다.** 「이 띠라서 떴다」를 쓰지 않는다 —
 *    우리가 이미 재서 발행했다: 배우 1,047명의 띠 분포는 **카이제곱 7.77(문턱 19.68)**,
 *    **우연과 구분되지 않는다.** 여기서 말을 바꾸면 우리가 파는 신뢰가 깎인다.
 * ⛔ **개별 풀이를 안 한다.** 사주 원국은 태어난 **시**가 있어야 하는데 공개 프로필에 없다.
 * ⭐ 우리가 하는 것은 하나다 — **누가 같은 띠인지 이름으로 보여 주는 것.**
 *    그건 사실이고, 팬이 찾는 것이고, 우리 수와 어긋나지 않는다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-star-signs.mjs
 *   node scripts/build-wikitip-star-signs.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 사람길 = path.join(뿌리, 'archive', 'raw', 'wikidata', 'korean-people.json');
export const 배우길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-actors.json');
export const 음악길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-musicians.json');
export const 띠길 = path.join(뿌리, 'src', 'data', 'wikitip-zodiac.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-star-signs.json');

export const 띠순서 = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

/** 한 띠에 이름을 몇 개까지 보일까 */
export const 보일이름 = 12;

/**
 * ⛔ **읽힘을 모르는 사람을 0 으로 안 센다.** 이름은 싣되 수 자리는 비운다.
 *   0 으로 채우면 「아무도 안 본 사람」이 되는데 그건 「우리가 못 이었다」와 다른 말이다.
 */
export function 읽힘붙이기(사람, 읽힘표) {
  const r = 읽힘표.get(사람.name);
  return {
    name: 사람.name,
    born: 사람.born ?? null,
    sign: 사람.zodiac ?? null,
    perMillion: typeof r?.seaPerMillionTotal === 'number' ? r.seaPerMillionTotal : null,
    isGroup: r?.isGroup ?? false,
  };
}

/** 한 띠의 이름들 — 많이 읽힌 순. ⛔ 읽힘을 모르는 사람은 **뒤로** 보내되 버리지 않는다 */
export function 띠하나(사람들, 띠, 몇 = 보일이름) {
  const 이것 = 사람들.filter((p) => p.sign === 띠);
  const 잰것 = 이것.filter((p) => p.perMillion != null)
    .sort((a, b) => b.perMillion - a.perMillion);
  return {
    sign: 띠,
    people: 이것.length,
    withReads: 잰것.length,
    withoutReads: 이것.length - 잰것.length,
    top: 잰것.slice(0, 몇),
  };
}

/** 태어난 해로 띠를 낸다. ⚠ 음력 설 앞뒤가 갈리는 1·2월은 원 자료가 이미 뺐다 */
export function 해로띠(해) {
  if (!Number.isInteger(해)) return null;
  return 띠순서[((해 - 1900) % 12 + 12) % 12];
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  재본다('1900은 쥐', 해로띠(1900), 'Rat');
  재본다('1988은 용', 해로띠(1988), 'Dragon');
  재본다('1997은 소', 해로띠(1997), 'Ox');
  재본다('⛔ 해가 아니면 null', 해로띠('x'), null);

  const 표 = new Map([['A', { seaPerMillionTotal: 10, isGroup: false }]]);
  재본다('읽힘을 붙인다', 읽힘붙이기({ name: 'A', zodiac: 'Rat', born: '1996-01-01' }, 표).perMillion, 10);
  재본다('⛔⛔ 못 이은 사람은 0 이 아니라 null',
    읽힘붙이기({ name: 'B', zodiac: 'Rat' }, 표).perMillion, null);

  const 사람들 = [
    { name: 'A', sign: 'Rat', perMillion: 10 },
    { name: 'B', sign: 'Rat', perMillion: null },
    { name: 'C', sign: 'Rat', perMillion: 40 },
    { name: 'D', sign: 'Ox', perMillion: 5 },
  ];
  const r = 띠하나(사람들, 'Rat');
  재본다('많이 읽힌 순으로 놓는다', r.top.map((x) => x.name), ['C', 'A']);
  재본다('⛔ 못 잰 사람을 세어 둔다', [r.people, r.withReads, r.withoutReads], [3, 2, 1]);
  재본다('⛔ 몇 개만 보인다', 띠하나(사람들, 'Rat', 1).top.length, 1);

  /**
   * 🔴 이 지면이 절대 하면 안 되는 말이 **손님에게 나가는 글자**에 있나.
   * ⚠ 처음엔 소스 전체를 훑었더니 **이 검사가 쓴 낱말 목록에 이 검사가 걸렸다.**
   *   (8/16 에 영상 금칙어 검사가 「Not cause」를 잡은 것과 같은 꼴이다)
   *   ⭐ 그래서 시험 칸을 빼고, **밖으로 나가는 문장만** 본다.
   */
  const 나 = fs.readFileSync(path.join(뿌리, 'scripts', 'build-wikitip-star-signs.mjs'), 'utf8');
  const 나갈글 = 나.replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/if \(내가실행됐다 && process\.argv\.includes\('--selftest'\)\)[\s\S]*?\n}\n/, ' ');
  재본다('⛔⛔ 점치는 말을 손님에게 안 낸다',
    나갈글, (s) => !/lucky|fortune|destined|predicts\b/i.test(s));
  재본다('⛔ 그 검사가 시험 칸을 빼고 본다', 나갈글, (s) => !s.includes('재본다('));

  재본다('⭐ 원본이 있다', [fs.existsSync(사람길), fs.existsSync(배우길), fs.existsSync(음악길)],
    (v) => v.every(Boolean));
  console.log(`띠별 이름 늘어놓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(사람길, 'utf8'));
  const 띠자료 = JSON.parse(fs.readFileSync(띠길, 'utf8'));
  const 읽힘표 = new Map();
  for (const f of [배우길, 음악길]) {
    for (const p of JSON.parse(fs.readFileSync(f, 'utf8')).people ?? []) {
      const 이 = 읽힘표.get(p.name);
      if (!이 || (p.seaPerMillionTotal ?? 0) > (이.seaPerMillionTotal ?? 0)) 읽힘표.set(p.name, p);
    }
  }

  const 사람들 = 원.사람.filter((p) => p.zodiac).map((p) => 읽힘붙이기(p, 읽힘표));
  const 띠들 = 띠순서.map((z) => 띠하나(사람들, z));

  const 자료 = {
    generated: 원.갱신?.slice(0, 10) ?? null,
    source: 'Wikidata (CC0) for names and dates of birth; Wikimedia Pageviews API for reads',
    window: '2025-08 through 2026-07, 12 months, human traffic only',
    question: 'Which Korean stars share your Chinese zodiac sign?',
    peopleWithSign: 사람들.length,
    withReads: 사람들.filter((p) => p.perMillion != null).length,
    /**
     * 🔴🔴 이 지면의 뼈대. 우리가 이미 재서 낸 수를 **여기 그대로 들고 온다.**
     *   이름을 늘어놓되, 그 이름이 「그래서 성공했다」로 읽히지 않게 못을 박는다.
     */
    notAPrediction: {
      chiSquare: 띠자료.chiSquare,
      threshold: 띠자료.chiSquareThreshold,
      indistinguishableFromChance: 띠자료.indistinguishableFromChance,
      says: 'We counted how 1,047 Korean actors who reached a Netflix chart are spread across the '
        + `twelve signs. The spread is indistinguishable from chance (chi-square ${띠자료.chiSquare} `
        + `against a threshold of ${띠자료.chiSquareThreshold}). Being born in one year rather than `
        + 'another does not pick out who reaches a chart, and this page does not say otherwise.',
      whyNoReading: 띠자료.whyNoIndividualReading,
    },
    signs: 띠들,
    method: 'Dates of birth come from Wikidata. Reads are that person\'s own Wikipedia article '
      + 'across the Indonesian, Vietnamese, Thai and Malay editions, expressed per million reads of '
      + 'each edition and summed. Within a sign we order by reads, so the names a reader is most '
      + 'likely to recognise come first.',
    limitation: 'A sign is assigned from the birth year alone. The lunar new year falls in January '
      + 'or February, so anyone born in those months can belong to the previous sign; the source '
      + 'data excludes them rather than guessing. A person whose article we could not match to a '
      + 'read count keeps their name on this page with an empty figure — we do not write zero, '
      + 'because not matched and not read are different things.',
    cannotSay: [
      'Not a prediction. The distribution across signs is indistinguishable from chance.',
      'Not a saju reading. A full chart needs the hour of birth, which public profiles do not carry.',
      'Not popularity. Reads count people opening an encyclopaedia article.',
    ],
  };
  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`띠 있는 사람 ${자료.peopleWithSign} · 읽힘까지 이은 사람 ${자료.withReads}\n`);
  for (const s of 띠들) {
    console.log(`${s.sign.padEnd(8)} ${String(s.people).padStart(4)}명 (읽힘 ${s.withReads})  `
      + s.top.slice(0, 4).map((x) => `${x.name} ${x.perMillion}`).join(' · '));
  }
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
