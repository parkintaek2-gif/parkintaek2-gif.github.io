#!/usr/bin/env node
/**
 * **네 나라가 각각 누구를 제일 많이 찾아보나 — 이름으로.** (`/who-is-first`)
 *
 * 🔴 사장님 지시(8/16) — 「스타의 이름과 소속 그룹명을 제목과 본문에 반드시 넣는다.
 *   사람들은 스타의 이름을 검색한다. 「가수 1,701팀」 같은 수는 아무도 안 찾는다」
 *   ⭐ 그래서 이 지면은 **수가 아니라 이름이 주인공**이다. 표의 첫 칸이 이름이다.
 *
 * ── ⛔ 이 지면이 지키는 것 ────────────────────────────────────
 * ⛔ **네 나라를 한 줄로 합치지 않는다.** 합치면 1등이 하나가 되고 요점이 죽는다 —
 *    베트남·태국·말레이시아는 BTS 인데 **인도네시아는 Babymonster** 다.
 * ⛔ **이름이 안 풀린 것(Q번호)을 이름인 척 싣지 않는다.** 빼고, 몇 개를 뺐는지 적는다.
 *    실제로 `Q27655344` 가 베트남어판 여섯째에 앉아 있었다.
 * ⛔ **읽힘을 인기로 팔지 않는다.** 문서를 연 사람 수다.
 * ⛔ **나라끼리 크기를 견주지 않는다.** 백만분율이라 판 크기는 나눴지만,
 *    「말레이시아가 한국을 덜 좋아한다」로 읽으면 안 된다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-who-is-first.mjs
 *   node scripts/build-wikitip-who-is-first.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 근거, 백만분율 as 백만분율자 } from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-musicians.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-who-is-first.json');

export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
export const 판이름 = { id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay' };
export const 몇줄 = 10;

/**
 * ⛔⛔ 위키데이터에서 이름이 안 풀리면 `Q27655344` 같은 것이 그대로 온다.
 *   그것이 베트남어판 여섯째에 앉아 있었다. **이름인 척 실으면 그 줄은 거짓말이다.**
 * ⚠ 「Queen」처럼 Q 로 시작하는 진짜 이름은 통과해야 한다 — 숫자만인 것을 잡는다.
 */
export function 이름인가(이름) {
  return typeof 이름 === 'string' && 이름.trim().length > 0 && !/^Q\d+$/.test(이름.trim());
}

export function 판으뜸(사람들, 판, n = 몇줄) {
  return 사람들
    .filter((x) => typeof x.perMillion?.[판] === 'number' && x.perMillion[판] > 0)
    .filter((x) => 이름인가(x.name))
    .sort((a, b) => b.perMillion[판] - a.perMillion[판])
    .slice(0, n)
    .map((x, i) => ({
      rank: i + 1,
      name: x.name,
      isGroup: !!x.isGroup,
      perMillion: x.perMillion[판],
    }));
}

/** ⭐ 네 판 모두의 위 n 줄에 든 이름 — 「어디서나 찾는 이름」이다 */
export function 넷다에든이름(으뜸들) {
  const 셋 = 판들.map((p) => new Set((으뜸들[p] ?? []).map((x) => x.name)));
  if (셋.some((s) => !s.size)) return [];
  return [...셋[0]].filter((n) => 셋.every((s) => s.has(n)));
}

/** ⭐ 한 판에서만 위 n 줄에 든 이름 — 「그 나라만 찾는 이름」이다 */
export function 한판만(으뜸들) {
  const 셈 = new Map();
  for (const p of 판들) for (const x of 으뜸들[p] ?? []) 셈.set(x.name, (셈.get(x.name) ?? 0) + 1);
  return 판들.map((p) => ({
    edition: p,
    country: 나라이름[p],
    only: (으뜸들[p] ?? []).filter((x) => 셈.get(x.name) === 1).map((x) => x.name),
  }));
}

/** 겹치지 않게 모은다 */
function 골라모음(값들) {
  return [...new Set(값들.filter(Boolean))].sort();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  /* 🔴 이 한 줄이 이 자를 만든 까닭이다 — Q번호가 여섯째에 앉아 있었다 */
  참('⛔⛔ Q번호는 이름이 아니다', 이름인가('Q27655344') === false);
  참('⛔ 앞뒤 빈칸이 있어도 잡는다', 이름인가('  Q123  ') === false);
  참('⭐ 진짜 이름은 통과', 이름인가('Babymonster') === true);
  참('⛔ 빈 것도 이름이 아니다', 이름인가('') === false && 이름인가(null) === false);
  참('⚠ Q 로 시작하는 진짜 이름은 살린다', 이름인가('Queen') === true);

  const 사람 = [
    { name: 'A', perMillion: { id: 5, vi: 1 } },
    { name: 'Q999', perMillion: { id: 99, vi: 99 } },
    { name: 'B', perMillion: { id: 3, vi: 9 } },
    { name: 'C', perMillion: { id: 0, vi: 4 } },
  ];
  const 으뜸 = 판으뜸(사람, 'id', 3);
  참('⛔⛔ Q번호를 표에서 뺀다', 으뜸.every((x) => x.name !== 'Q999'));
  참('많이 읽힌 차례다', 으뜸.map((x) => x.name).join() === 'A,B');
  참('⛔ 0 은 안 싣는다 — 못 읽힌 것과 문서 없는 것을 안 섞는다', 으뜸.length === 2);
  참('등수를 붙인다', 으뜸[0].rank === 1 && 으뜸[1].rank === 2);

  const 모음 = {
    id: [{ name: 'A' }, { name: 'B' }],
    vi: [{ name: 'A' }, { name: 'C' }],
    th: [{ name: 'A' }],
    ms: [{ name: 'A' }],
  };
  참('⭐ 넷 다에 든 이름을 센다', 넷다에든이름(모음).join() === 'A');
  참('⛔ 한 판이 비면 「넷 다」가 없다', 넷다에든이름({ ...모음, ms: [] }).length === 0);
  const 만 = 한판만(모음);
  참('⭐ 그 나라만 찾는 이름을 가른다', 만[0].only.join() === 'B' && 만[1].only.join() === 'C');
  참('⛔ 넷 다에 든 이름은 「그 나라만」이 아니다', 만.every((x) => !x.only.includes('A')));

  참('⭐ 원본이 있다', fs.existsSync(원본길));

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

  const 으뜸들 = Object.fromEntries(판들.map((p) => [p, 판으뜸(사람, p)]));
  /* ⛔ 뺀 것을 세어 둔다. 「몇 개를 뺐다」를 못 말하면 조용한 제외가 된다 */
  const 안풀린 = 골라모음(사람.filter((x) => !이름인가(x.name)).map((x) => x.name));

  const 자료 = {
    generatedAt: 원.generated?.slice(0, 10) ?? null,
    source: 원.source ?? 'Wikidata (CC0) for article links; Wikimedia Pageviews API for reads',
    window: 원.window,
    panel: 원.panel ?? null,
    editions: 판들,
    countryNames: 나라이름,
    editionNames: 판이름,
    actsMeasured: 사람.length,
    rowsPerEdition: 몇줄,
    question: 'Indonesia, Vietnam, Thailand and Malaysia each keep their own Korean reading list. '
      + 'Who is first on each one?',
    topByEdition: 으뜸들,
    firstByEdition: Object.fromEntries(판들.map((p) => [p, 으뜸들[p][0] ?? null])),
    inAllFour: 넷다에든이름(으뜸들),
    onlyInOne: 한판만(으뜸들),
    unresolvedNames: {
      count: 안풀린.length,
      examples: 안풀린.slice(0, 5),
      note: 'Some Wikidata items carry no label we could read, so the name arrives as a Q number. '
        + 'One of them sat sixth on the Vietnamese list. We drop them rather than print a Q number '
        + 'as if it were a person, and we say how many we dropped.',
    },
    ...근거([백만분율자], {
      방법: 'Each edition is ranked on its own and never pooled, because pooling produces a single '
        + 'winner and hides that the four lists disagree.',
      한계: 'This counts people opening an encyclopaedia article, which is not liking an act, '
        + 'buying a ticket, or streaming a song. It cannot see an act with no article in that '
        + 'language: absence here means no article or no reads, and we do not separate those two. '
        + 'The ranking covers one twelve-month window, so a comeback inside that window can lift '
        + 'an act above one that was steadier all year.',
    }),
    cannotSay: [
      'Not popularity. An article is opened by fans, by people who just heard a name, and by '
        + 'people checking a fact. We cannot tell them apart.',
      'Not a contest between countries. Reads are per million reads of that edition, so the four '
        + 'columns share a scale, but a smaller Wikipedia has a smaller and differently shaped '
        + 'readership.',
      'Not why. We can show that the name at the top in Indonesia is not the one the other three '
        + 'share, and we did not measure what put it there.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`가수·그룹 ${자료.actsMeasured}팀 · 창 ${자료.window}\n`);
  for (const p of 판들) {
    console.log(`${나라이름[p].padEnd(10)} `
      + 으뜸들[p].slice(0, 5).map((x) => `${x.name} ${x.perMillion}`).join(' · '));
  }
  console.log(`\n⭐ 넷 다에 든 이름 ${자료.inAllFour.length}개: ${자료.inAllFour.join(' · ') || '없다'}`);
  console.log(`⛔ 이름이 안 풀려 뺀 것 ${자료.unresolvedNames.count}개`);
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
