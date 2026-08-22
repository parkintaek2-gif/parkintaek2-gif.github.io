#!/usr/bin/env node
/**
 * **한국 연예인 한 사람은 몇 개 언어판에 있나.** (`/how-many-languages`)
 *
 * ⭐⭐ 사장님 지시(8/16) — 스타 이름을 앞에. 이 자료는 **이름이 곧 결과**다.
 * ⭐ 안 쓰던 축이다 — 이 원자료를 다른 자리가 생일(사주)로만 썼다. `sitelinks` 는 아무도 안 셌다.
 *
 * ── 물음 ───────────────────────────────────────────────────────
 * 위키피디아 판이 300개가 넘는다. 한국 연예인은 그중 **몇 곳에** 문서가 있나.
 * 🔴 가운데값이 **1** 이다. 9,249명 중 절반이 한 판 또는 그보다 적다.
 * ⭐ 그리고 맨 위가 뜻밖이다 — **Psy 97개**로 BTS·BLACKPINK 멤버 전원보다 많다.
 *
 * ── 🔴 뻔한 반론을 먼저 죽였다 ─────────────────────────────────
 * 「Psy 는 오래됐으니 편집자가 적어 넣을 시간이 많았다」 — 112편에서 겪은 그 함정이다.
 * ⛔ 태어난 열 해로 갈라 재니 **반대**였다 —
 *     1940s~1960s   20개 이상이 0.8~1.8%
 *     1990s         7.4%            ← 제일 높다
 *   나이가 많을수록 판이 많은 것이 아니다. Psy 는 **더 얇은 또래 안의 예외**다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **판 수를 인기로 읽지 않는다.** 백과사전 문서가 몇 곳에 있나일 뿐이다.
 * ⛔ **명단에 연예인이 아닌 사람이 섞여 있다고 적는다.** 위키데이터 직업으로 고른 명단이라
 *    시인·감독이 들어와 있다. 조용히 빼지 않고 **이름으로** 밝힌다.
 * ⛔ **0개인 사람을 「없는 사람」으로 세지 않는다.** 위키데이터 항목은 있고 문서만 없는 것이다.
 * ⛔ 수를 손으로 안 박는다. ⛔ 광고 자리를 만들지 않는다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-how-many-languages.mjs
 *   node scripts/build-wikitip-how-many-languages.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 근거, 중앙값 as 중앙값자 } from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikidata', 'korean-entertainers-birth.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-how-many-languages.json');

/** ⚠ 문턱은 우리가 정한 것이다. 하나씩 세는 것이 아니라 「몇 곳 이상」을 본다 */
export const 문턱들 = [1, 2, 3, 5, 10, 20, 50];

/** ⛔ 연예인이 아닌 사람이 섞여 있다. 조용히 빼지 않고 **이름으로 밝힌다** */
export const 섞인사람 = {
  'Yun Hyon-seok': 'a poet and activist, not an entertainer',
  'Kim Ki-duk': 'a film director',
};

export function 중앙값(값들) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

/** 태어난 해. ⛔ 못 읽으면 null — 0 으로 안 만든다 */
export function 태어난해(사람) {
  const m = /^(\d{4})/.exec(String(사람?.born ?? ''));
  return m ? Number(m[1]) : null;
}

/** ⭐ 문턱마다 몇 명이 넘나. 「가운데가 1」만으로는 꼬리가 안 보인다 */
export function 문턱셈(값들, 문턱 = 문턱들) {
  const v = 값들.filter((x) => typeof x === 'number');
  return 문턱.map((t) => ({
    atLeast: t,
    people: v.filter((x) => x >= t).length,
    sharePc: +((100 * v.filter((x) => x >= t).length) / v.length).toFixed(1),
  }));
}

/**
 * 🔴 뻔한 반론을 재는 자 — 「오래된 사람일수록 판이 많다」인가.
 * ⛔ 서른 명이 안 되는 열 해는 안 쓴다. 비율만 크게 보인다.
 */
export function 열해별(사람들, 최소 = 30, 넓게 = 20) {
  const 줄 = [];
  for (let y = 1940; y <= 2010; y += 10) {
    const g = 사람들.filter((x) => {
      const h = 태어난해(x);
      return h != null && h >= y && h < y + 10;
    });
    if (g.length < 최소) continue;
    const v = g.map((x) => x.sitelinks);
    줄.push({
      decade: `${y}s`,
      people: g.length,
      median: 중앙값(v),
      atLeastWidePc: +((100 * v.filter((x) => x >= 넓게).length) / g.length).toFixed(1),
    });
  }
  return 줄;
}

/** ⭐ 반론이 죽었나 — 옛 세대가 더 넓지 **않으면** 시간 탓이 아니다 */
export function 시간탓인가(줄) {
  /**
   * ⚠ 처음에 「줄이 셋 미만이면 null」로 막아 뒀다가 뺐다. 그 문턱은 근거가 없었다 —
   *   옛 세대와 새 세대가 **하나씩** 있으면 견줄 수 있고, 없으면 아래에서 이미 null 을 낸다.
   *   있는 조건을 두 번 걸면 멀쩡한 견줌을 버린다.
   */
  const 옛 = 줄.filter((r) => Number(r.decade.slice(0, 4)) < 1970);
  const 새 = 줄.filter((r) => Number(r.decade.slice(0, 4)) >= 1980);
  if (!옛.length || !새.length) return null;
  const 옛최대 = Math.max(...옛.map((r) => r.atLeastWidePc));
  const 새최대 = Math.max(...새.map((r) => r.atLeastWidePc));
  return {
    olderCohortsWidestPc: 옛최대,
    newerCohortsWidestPc: 새최대,
    /** true 면 「오래돼서 그렇다」가 설명이 안 된다 */
    ruledOut: 새최대 > 옛최대,
    reading: 새최대 > 옛최대
      ? 'The oldest cohorts are the narrowest, not the widest, so the spread is not an artefact of '
        + 'editors having had longer to write the articles.'
      : 'The oldest cohorts are the widest, so we cannot separate reach from recording time.',
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

  재본다('중앙값 홀수', 중앙값([3, 1, 2]), 2);
  재본다('중앙값 짝수는 평균', 중앙값([1, 2, 3, 4]), 2.5);
  재본다('⛔ 빈 것은 null', 중앙값([]), null);

  재본다('태어난 해를 읽는다', 태어난해({ born: '1977-12-31' }), 1977);
  재본다('⛔ 못 읽으면 null (0 이 아니다)', 태어난해({ born: '' }), null);
  재본다('⛔ 칸이 없어도 null', 태어난해({}), null);

  const ㄱ = 문턱셈([0, 1, 1, 5, 20], [1, 5, 20]);
  재본다('문턱마다 센다', ㄱ.map((x) => x.people), [4, 2, 1]);
  재본다('⛔ 0 인 사람도 분모에 남는다', ㄱ[0].sharePc, 80);

  /* ⛔ 서른 명이 안 되는 열 해는 안 쓴다 */
  const 얇은 = Array.from({ length: 10 }, () => ({ born: '1945-01-01', sitelinks: 50 }));
  재본다('⛔ 얇은 열 해를 안 쓴다', 열해별(얇은).length, 0);
  const 두툼 = [
    ...Array.from({ length: 40 }, () => ({ born: '1945-01-01', sitelinks: 1 })),
    ...Array.from({ length: 40 }, () => ({ born: '1995-01-01', sitelinks: 30 })),
  ];
  const 줄 = 열해별(두툼);
  재본다('두툼한 열 해는 쓴다', 줄.map((r) => r.decade), ['1940s', '1990s']);
  재본다('⭐⭐ 새 세대가 더 넓으면 「시간 탓」이 죽는다', 시간탓인가(줄).ruledOut, true);
  재본다('⛔ 옛 세대가 더 넓으면 못 가른다고 적는다',
    시간탓인가(열해별([
      ...Array.from({ length: 40 }, () => ({ born: '1945-01-01', sitelinks: 30 })),
      ...Array.from({ length: 40 }, () => ({ born: '1995-01-01', sitelinks: 1 })),
    ])).ruledOut, false);
  재본다('⛔ 열 해가 모자라면 null', 시간탓인가([]), null);

  재본다('⛔ 섞인 사람을 이름으로 밝힌다',
    Object.keys(섞인사람).length >= 2 && Object.values(섞인사람).every((v) => v.length > 5), true);
  재본다('⭐ 원본이 있다', fs.existsSync(원본길), true);

  console.log(`몇 개 언어판에 있나 재는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 사람 = (원.사람 ?? []).filter((x) => typeof x.sitelinks === 'number');
  const 값 = 사람.map((x) => x.sitelinks);
  const 위 = [...사람].sort((a, b) => b.sitelinks - a.sitelinks).slice(0, 20)
    .map((x) => ({
      name: x.name,
      born: String(x.born).slice(0, 4),
      editions: x.sitelinks,
      notAnEntertainer: 섞인사람[x.name] ?? null,
    }));
  const 열해 = 열해별(사람);

  const 자료 = {
    generated: String(원.잰때 ?? '').slice(0, 10),
    source: 'Wikidata — people with a Korean entertainment occupation, with date of birth and '
      + 'sitelink count (the number of Wikipedia language editions holding an article about them)',
    window: `read ${String(원.잰때 ?? '').slice(0, 10)}`,
    question: 'Wikipedia has more than 300 language editions. How many of them hold an article '
      + 'about a Korean entertainer?',
    peopleMeasured: 사람.length,
    median: 중앙값(값),
    max: Math.max(...값),
    zeroEditions: 값.filter((v) => v === 0).length,
    zeroMeans: 'A person with zero editions has a Wikidata item and no article anywhere. That is '
      + 'not a person who does not exist; it is a person no edition has written up yet.',
    thresholds: 문턱셈(값),
    thresholdsAreOurs: 'The thresholds are ours. We report "at least n editions" rather than a '
      + 'mean, because the distribution is almost entirely at the bottom.',
    top: 위,
    panelIsNotClean: 'The panel is selected on Wikidata occupations, so a few people who are not '
      + 'entertainers come with it. We name them rather than dropping them quietly: '
      + `${Object.entries(섞인사람).map(([n, w]) => `${n} is ${w}`).join('; ')}.`,
    byDecade: 열해,
    timeObjection: 시간탓인가(열해),
    ...근거([중앙값자], {
      방법: 'Every person is summarised by one number — how many Wikipedia language editions hold '
        + 'an article about them — and the panel is described by thresholds rather than an average, '
        + 'because half of it sits at one edition or fewer. The obvious objection, that older '
        + 'people have simply had longer to be written about, is tested by splitting the panel on '
        + 'birth decade.',
      한계: 'A sitelink count is encyclopaedia coverage, not popularity and not income: it says how '
        + 'many editions wrote an article, which depends on who edits those editions. The panel '
        + 'comes from Wikidata occupations and carries a few people who are not entertainers, '
        + 'named on this page. And a person with no article anywhere still has a Wikidata item, so '
        + 'a zero here is a gap in coverage rather than a fact about the person.',
    }),
    cannotSay: [
      'Not popularity. This counts articles, not listeners, viewers or ticket sales.',
      'Not which language. An edition count does not say which editions, only how many.',
      'Not a clean panel. Wikidata occupations bring a poet and a film director into a list of '
        + 'entertainers, and we name them rather than hiding the edit.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`사람 ${자료.peopleMeasured} · 가운데 ${자료.median} · 맨 위 ${자료.max}`
    + ` · 어느 판에도 없는 사람 ${자료.zeroEditions}`);
  for (const t of 자료.thresholds) {
    console.log(`   ${String(t.atLeast).padStart(3)}개 이상  ${String(t.people).padStart(5)}명  ${t.sharePc}%`);
  }
  console.log('\n맨 위 여덟');
  for (const x of 자료.top.slice(0, 8)) {
    console.log(`   ${String(x.editions).padStart(3)}  ${x.name} (${x.born})`
      + (x.notAnEntertainer ? `   ⚠ ${x.notAnEntertainer}` : ''));
  }
  console.log('\n열 해별 — 20개 이상 비율');
  for (const r of 자료.byDecade) {
    console.log(`   ${r.decade}  n=${String(r.people).padStart(5)}  가운데 ${String(r.median).padStart(3)}  ${r.atLeastWidePc}%`);
  }
  console.log(`⭐ 「오래돼서 그렇다」 죽었나: ${자료.timeObjection.ruledOut}`);
  console.log(`자료 → ${path.relative(뿌리, 낼길)}`);
}
