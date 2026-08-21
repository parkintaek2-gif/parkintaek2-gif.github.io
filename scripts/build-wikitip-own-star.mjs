#!/usr/bin/env node
/**
 * **나라마다 «자기 스타»가 따로 있다.** (`/own-star`)
 *
 * ⭐⭐ 사장님 지시(8/16) — 제목과 본문에 **스타 이름과 소속 그룹명**을 넣는다.
 *    손님은 「JAY B」와 「GOT7」을 친다. 「가수 1,701명」은 아무도 안 친다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **네 판 다 문서가 있는 사람만** 견준다. 없는 문서를 0 으로 메우면
 *    그 나라가 「관심 없다」가 되는데, 그건 「우리가 못 본다」와 다른 말이다.
 * ⛔ **얇은 사람을 안 쓴다.** 합이 작으면 한 판의 몇 백 조회가 80% 를 만든다.
 * ⛔ **고른 것이 25% 다.** 네 판이 똑같으면 25% — 그 자를 화면에 같이 둔다.
 * ⛔ **같은 사람이 두 줄로 오는 것을 막는다.** 위키데이터에 별칭 항목이 따로 있다
 *    (Gong Myung / Gong Myoung · Jinyoung / Park Jin-young). 겹치기를 없앤다.
 * ⛔ **「그 나라가 더 좋아한다」로 안 쓴다.** 우리가 잰 것은 읽힘의 **쏠림**이다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-own-star.mjs
 *   node scripts/build-wikitip-own-star.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 음악길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-musicians.json');
export const 배우길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-actors.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-own-star.json');

export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
export const 판이름 = { id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay' };

/** ⚠ 얇은 사람을 자르는 문턱. 우리가 정한 값이라고 자료에 적는다 */
export const 합문턱 = 20;
/** 네 판이 똑같으면 이 값이다. 화면에 같이 둔다 */
export const 고른값 = 25;

/**
 * 한 사람의 쏠림. ⛔ 네 판 중 하나라도 문서가 없으면 **null** —
 *   0 으로 메우면 그 나라가 「관심 없다」가 된다.
 */
export function 쏠림(사람, 문턱 = 합문턱) {
  const v = 판들.map((k) => 사람?.perMillion?.[k]);
  if (v.some((x) => typeof x !== 'number')) return null;
  const 합 = v.reduce((a, b) => a + b, 0);
  if (!(합 >= 문턱)) return null;
  let 큰 = 0;
  for (let i = 1; i < v.length; i += 1) if (v[i] > v[큰]) 큰 = i;
  return {
    q: 사람.q,
    name: 사람.name,
    isGroup: !!사람.isGroup,
    total: +합.toFixed(2),
    topEdition: 판들[큰],
    topCountry: 나라이름[판들[큰]],
    topSharePc: +((100 * v[큰]) / 합).toFixed(1),
    perMillion: Object.fromEntries(판들.map((k, i) => [k, v[i]])),
  };
}

/**
 * ⛔ 같은 사람이 두 줄로 오는 것을 막는다.
 *   같은 항목이면 하나. 항목이 달라도 **네 판 수가 똑같으면** 같은 사람의 별칭 항목이다.
 */
export function 겹치기없애기(줄들) {
  const 본항목 = new Set();
  const 본값 = new Set();
  const 남김 = [];
  for (const r of 줄들) {
    const 값 = 판들.map((k) => r.perMillion[k]).join('|');
    if (본항목.has(r.q) || 본값.has(값)) continue;
    본항목.add(r.q);
    본값.add(값);
    남김.push(r);
  }
  return 남김;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  const 사람 = (v, q = 'Q1') => ({ q, name: 'x', perMillion: { id: v[0], vi: v[1], th: v[2], ms: v[3] } });

  재본다('네 판이 고르면 25%', 쏠림(사람([10, 10, 10, 10])).topSharePc, 25);
  재본다('쏠린 쪽을 집는다', 쏠림(사람([5, 5, 80, 10])).topEdition, 'th');
  재본다('나라 이름을 붙인다', 쏠림(사람([5, 5, 80, 10])).topCountry, 'Thailand');
  /* ⛔⛔ 이 두 줄이 이 자의 뼈대다 */
  재본다('⛔⛔ 한 판이 없으면 0 이 아니라 null', 쏠림(사람([5, 5, 80, null])), null);
  재본다('⛔ 판이 통째로 없어도 null', 쏠림({ q: 'Q1', perMillion: {} }), null);
  재본다('⛔ 합이 문턱 아래면 안 쓴다', 쏠림(사람([1, 1, 1, 1])), null);
  재본다('문턱에 닿으면 쓴다', 쏠림(사람([5, 5, 5, 5])).total, 20);

  /* ⛔ 별칭 항목이 두 줄로 오는 것을 막는다 */
  const 둘 = [쏠림(사람([5, 5, 80, 10], 'Q1')), 쏠림(사람([5, 5, 80, 10], 'Q2'))];
  재본다('⛔⛔ 같은 수를 가진 별칭은 한 줄만', 겹치기없애기(둘).length, 1);
  재본다('⛔ 같은 항목도 한 줄만', 겹치기없애기([둘[0], 둘[0]]).length, 1);
  재본다('다른 사람은 둘 다 남는다',
    겹치기없애기([쏠림(사람([5, 5, 80, 10], 'Q1')), 쏠림(사람([80, 5, 5, 10], 'Q2'))]).length, 2);

  재본다('⭐ 원본이 둘 다 있다', fs.existsSync(음악길) && fs.existsSync(배우길), true);
  console.log(`나라마다 자기 스타 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 음 = JSON.parse(fs.readFileSync(음악길, 'utf8'));
  const 배 = JSON.parse(fs.readFileSync(배우길, 'utf8'));
  const 모두 = [...음.people, ...배.people];
  const 줄 = 겹치기없애기(모두.map((p) => 쏠림(p)).filter(Boolean))
    .sort((a, b) => b.topSharePc - a.topSharePc);

  const 나라별 = Object.fromEntries(판들.map((k) => [k,
    줄.filter((r) => r.topEdition === k).slice(0, 6)]));
  const 고른것 = [...줄].sort((a, b) => a.topSharePc - b.topSharePc).slice(0, 6);
  const 셈 = Object.fromEntries(판들.map((k) => [k, 줄.filter((r) => r.topEdition === k).length]));

  const 자료 = {
    generated: 음.generated?.slice(0, 10) ?? null,
    source: 음.source,
    window: 음.window,
    editions: 판들,
    editionNames: 판이름,
    countryNames: 나라이름,
    question: 'Do the four Southeast Asian countries read about the same Korean stars, or does '
      + 'each one have its own?',
    measured: 줄.length,
    fromPanel: 모두.length,
    evenValue: 고른값,
    floor: 합문턱,
    floorIsOurs: `We only use stars whose four-edition total reaches ${합문턱} reads per million. `
      + 'Below that a few hundred views in one country can produce a share of 80 per cent, which '
      + 'would say more about the size of the number than about the country.',
    whyAllFour: 'A star is only used if all four editions have an article about them. Filling a '
      + 'missing article with a zero would turn "we cannot see it" into "that country is not '
      + 'interested", and those are different statements.',
    aliasNote: 'Wikidata carries some people twice under different spellings — Gong Myung and Gong '
      + 'Myoung, Jinyoung and Park Jin-young. Rows with identical figures across all four editions '
      + 'are treated as the same person and counted once.',
    countsByCountry: 셈,
    topByCountry: 나라별,
    mostEven: 고른것,
    method: 'For each star we add their reads per million across the Indonesian, Vietnamese, Thai '
      + 'and Malay Wikipedias, then report what share of that total sits in the single largest '
      + `edition. An even reader would score ${고른값} per cent.`,
    limitation: 'A high share says the reading is concentrated in one country; it does not say '
      + 'that country likes the star more, because the four editions serve different numbers of '
      + 'readers and different reading habits, and the per-million scaling only removes the first '
      + 'of those. Reads count people opening an encyclopaedia article, which is not fandom and '
      + 'not sales. And the floor and the four-edition rule are ours, so a different cut would '
      + 'move which names appear.',
    cannotSay: [
      'Not preference. We measured where the reading sits, not where the liking sits.',
      'Not every star. Only those with an article on all four editions and enough reads to be '
        + 'above our floor.',
      'Not why. A Thai concentration may be touring, a drama, a local partner, or something we '
        + 'have not measured.',
    ],
  };
  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`잰 사람 ${줄.length} / ${모두.length}`);
  for (const k of 판들) {
    console.log(`${나라이름[k].padEnd(10)} ${String(셈[k]).padStart(4)}명 · `
      + 나라별[k].slice(0, 4).map((r) => `${r.name} ${r.topSharePc}%`).join(' · '));
  }
  console.log(`가장 고른 사람: ${고른것.map((r) => `${r.name} ${r.topSharePc}%`).join(' · ')}`);
  console.log(`자료 → ${path.relative(뿌리, 낼길)}`);
}
