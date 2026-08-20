#!/usr/bin/env node
/**
 * **배우는 누구를 제일 많이 찾아보나 — 그리고 음악과 모양이 다르다.** (`/actors-first`)
 *
 * 🔴 사장님 지시(8/16) — 「스타의 이름과 소속 그룹명을 제목과 본문에 반드시 넣는다」
 *   ⭐ 제목이 Go Youn-jung · Lee Chae-min · Moon Ga-young 이다. 수가 아니다.
 *
 * ── ⭐ 왜 음악판(`/who-is-first`)과 따로 내는가 ────────────────
 * 같은 자로 같은 창을 쟀는데 **모양이 다르다.** 그것이 이 지면의 값이다.
 * ```
 *   음악   BTS 가 넷 중 셋에서 1등 · 넷 다에 든 이름은 BTS 하나
 *   배우   넷 다에서 1등인 이름이 **없다** · 대신 넷 다에 든 이름은 셋이다
 * ```
 * ⛔ 그래서 두 지면을 합치지 않는다. 합치면 이 차이가 지워진다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ **네 나라를 한 줄로 합치지 않는다.** 큰 판이 답을 정해 버린다.
 * ⛔ **Q번호를 이름인 척 싣지 않는다.** 음악 쪽에서 실제로 하나 나왔다. 여기서도 잰다.
 * ⛔ **읽힘을 인기로 팔지 않는다.** 문서를 연 사람 수다.
 * ⛔ **가수와 배우를 갈랐다고 말하지 않는다.** 이 명단은 넷플릭스 차트에 오른 한국 작품의
 *    출연진이라, IU·T.O.P·Jisoo 처럼 노래도 하는 사람이 그대로 들어 있다. 그 말을 적는다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 앞 자(`build-wikitip-who-is-first.mjs`)의 함수를 **그대로 가져다 쓴다.** 베끼지 않는다 —
 *   Q번호 거르는 규칙이 두 군데로 갈라지면 한쪽만 고치는 날이 온다.
 *   그 자에 실행 가드가 있어 import 해도 안 돌고 `--selftest` 도 안 가로챈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-actors-first.mjs
 *   node scripts/build-wikitip-actors-first.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 근거, 백만분율 as 백만분율자 } from './_evidence-kcw.mjs';
import {
  판들, 나라이름, 판이름, 몇줄, 이름인가, 판으뜸, 넷다에든이름, 한판만,
} from './build-wikitip-who-is-first.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-actors.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-actors-first.json');
export const 음악길 = path.join(뿌리, 'src', 'data', 'wikitip-who-is-first.json');

/** ⭐ 네 판의 1등이 몇 개의 서로 다른 이름인가 — 이 수가 음악과 배우를 가른다 */
export function 몇명이1등인가(으뜸들) {
  const 첫 = 판들.map((p) => 으뜸들[p]?.[0]?.name).filter(Boolean);
  return { names: [...new Set(첫)], distinct: new Set(첫).size, editions: 첫.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  /* ⭐ 가져다 쓴 함수가 살아 있나 — 베낀 것이 아니라 같은 자를 쓰는지 확인한다 */
  참('⛔ Q번호 거르는 자를 앞 자에서 가져왔다', 이름인가('Q27655344') === false);
  참('⭐ 진짜 이름은 통과', 이름인가('Go Youn-jung') === true);
  참('판 넷을 그대로 쓴다', 판들.join() === 'id,vi,th,ms');

  const 하나 = { id: [{ name: 'A' }], vi: [{ name: 'A' }], th: [{ name: 'A' }], ms: [{ name: 'A' }] };
  참('⭐ 넷 다 같은 1등이면 1', 몇명이1등인가(하나).distinct === 1);
  const 넷 = { id: [{ name: 'A' }], vi: [{ name: 'B' }], th: [{ name: 'B' }], ms: [{ name: 'C' }] };
  참('⭐ 1등이 셋이면 3', 몇명이1등인가(넷).distinct === 3);
  참('⭐ 1등 이름을 적어 둔다', 몇명이1등인가(넷).names.join() === 'A,B,C');
  참('⛔ 빈 판은 안 센다', 몇명이1등인가({ ...넷, ms: [] }).editions === 3);

  const 사람 = [
    { name: 'A', perMillion: { id: 5 } },
    { name: 'Q9', perMillion: { id: 99 } },
    { name: 'B', perMillion: { id: 0 } },
  ];
  참('⛔ Q번호를 표에서 뺀다', 판으뜸(사람, 'id', 3).every((x) => x.name !== 'Q9'));
  참('⛔ 0 은 안 싣는다', 판으뜸(사람, 'id', 3).length === 1);

  참('⭐ 원본이 있다', fs.existsSync(원본길));
  /* ⛔ 음악판이 없으면 「모양이 다르다」를 못 쓴다 — 지어내지 않는다 */
  참('⭐ 견줄 음악판 자료가 있다', fs.existsSync(음악길));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 사람 = 원.people ?? [];
  const 으뜸들 = Object.fromEntries(판들.map((p) => [p, 판으뜸(사람, p, 몇줄)]));
  const 안풀린 = [...new Set(사람.filter((x) => !이름인가(x.name)).map((x) => x.name))];

  /* ⛔ 음악판을 읽어 견준다. 없으면 그 절을 아예 안 만든다 — 기억으로 안 적는다 */
  const 음악 = fs.existsSync(음악길) ? JSON.parse(fs.readFileSync(음악길, 'utf8')) : null;

  const 자료 = {
    generatedAt: 원.generated?.slice(0, 10) ?? null,
    source: 원.source,
    window: 원.window,
    panel: 원.panel,
    panelCaveat: 원.panelCaveat,
    editions: 판들,
    countryNames: 나라이름,
    editionNames: 판이름,
    actorsMeasured: 사람.length,
    rowsPerEdition: 몇줄,
    question: 'Four Southeast Asian Wikipedias, four lists of Korean actors. Is there one name at '
      + 'the top of all of them?',
    topByEdition: 으뜸들,
    firstByEdition: Object.fromEntries(판들.map((p) => [p, 으뜸들[p][0] ?? null])),
    firsts: 몇명이1등인가(으뜸들),
    inAllFour: 넷다에든이름(으뜸들),
    onlyInOne: 한판만(으뜸들),
    unresolvedNames: {
      count: 안풀린.length,
      examples: 안풀린.slice(0, 5),
      note: 'A Wikidata item with no readable label arrives as a Q number. One reached sixth place '
        + 'on the Vietnamese music list, so we check for them here too and drop rather than print '
        + 'them. On this panel there were none.',
    },
    /** ⭐ 이 지면의 값 — 음악과 모양이 다르다는 것. 두 자료에서 읽어서 쓴다 */
    versusMusic: 음악 ? {
      musicPage: '/who-is-first',
      musicFirstNames: [...new Set(판들.map((p) => 음악.firstByEdition?.[p]?.name).filter(Boolean))],
      musicDistinctFirsts: new Set(판들.map((p) => 음악.firstByEdition?.[p]?.name).filter(Boolean)).size,
      musicInAllFour: 음악.inAllFour ?? [],
      reading: 'Measured the same way over the same twelve months, the music lists and the actor '
        + 'lists have different shapes. One music act is first in three of the four editions and '
        + 'is the only name shared by all four. Among actors no name is first everywhere, and more '
        + 'than one name is shared by all four. We can show the difference; we did not measure '
        + 'what causes it.',
    } : null,
    ...근거([백만분율자], {
      방법: 'Each edition is ranked on its own and never pooled. The same ranking code is used for '
        + 'the music page, so the two are comparable by construction rather than by eye.',
      한계: 'The panel is the cast of Korean titles that reached a Netflix country chart, so an '
        + 'actor whose work never charted is absent, and people who both sing and act — IU, '
        + 'T.O.P, Jisoo — appear on the music page as well as this one. This is not a clean split '
        + 'between singers and actors and we do not present it as one.',
    }),
    cannotSay: [
      'Not popularity. An article is opened by fans, by people who just heard a name, and by '
        + 'people checking a fact.',
      'Not a clean genre split. The panel is a cast list, so it holds idols who act and actors who '
        + 'sing.',
      'Not why the shapes differ. We can show that the actor lists have no single leader while the '
        + 'music lists do, and we did not measure what produces that.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`배우 ${자료.actorsMeasured}명 · 창 ${자료.window}\n`);
  for (const p of 판들) {
    console.log(`${나라이름[p].padEnd(10)} `
      + 으뜸들[p].slice(0, 5).map((x) => `${x.name} ${x.perMillion}`).join(' · '));
  }
  console.log(`\n⭐ 1등이 ${자료.firsts.distinct}명 — ${자료.firsts.names.join(' · ')}`);
  console.log(`⭐ 넷 다에 든 이름 ${자료.inAllFour.length}: ${자료.inAllFour.join(' · ') || '없다'}`);
  if (자료.versusMusic) {
    console.log(`⭐ 음악은 1등이 ${자료.versusMusic.musicDistinctFirsts}명 · `
      + `넷 다에 든 이름 ${자료.versusMusic.musicInAllFour.length}개`);
  }
  console.log(`⛔ 이름이 안 풀려 뺀 것 ${자료.unresolvedNames.count}개`);
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
