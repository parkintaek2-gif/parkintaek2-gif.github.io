#!/usr/bin/env node
/**
 * build-wikitip-title-demand.mjs — **첫 화면이 어느 작품 지면을 걸지 정하는 자료를 만든다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만들었나 — 2026-09-02]
 *   `check-wikitip-data.mjs` 가 「`wikitip-title-demand.json` — 만드는 스크립트도,
 *   지키는 검사도 없다. 고쳐도 안 따라온다」로 울고 있었다. **그 말이 맞았다.**
 *   그 자료는 2026-08-24 에 한 번 만들어진 뒤 손으로 굳어 있었고,
 *   `src/pages/wikitip/index.astro` 가 그것을 읽어 첫 화면에 작품 24편을 건다.
 *
 *   ⛔ 그래서 **실제로 죽은 링크가 자라고 있었다.**
 *     작품 지면은 `src/pages/wikitip/title/[slug].astro` 의 `getStaticPaths` 가
 *     `hasPage === true` 인 것만 낸다(546장). 그런데 굳은 수요 자료에는
 *     **hasPage 가 false 로 바뀐 13편**이 남아 있었다 —
 *     breathless(250곳) · dangerous-liaisons(165) · taxi-driver(141) · the-guest(137) ·
 *     kingdom(121) · snowpiercer(60) · one-more-time(58) · first-love(47) · champion(42) ·
 *     only-you(17) · once-again(12) · blood(6) · start-up(4).
 *     라이브가 아직 200 인 것은 **지금 서 있는 빌드가 그 자료 변화보다 앞선 것**뿐이고,
 *     다음 배포에서 그 13개는 404 가 된다.
 *
 * [어디서 만드나 — 두 번째 계산 줄을 만들지 않는다]
 *   `wikitip-title-pages.json` 에 필요한 칸이 **이미 다 있다**
 *   (slug · title · type · places · markets · weeks · peak).
 *   그것은 `build-wikitip-title-pages.mjs` 가 넷플릭스 원자료
 *   (`archive/raw/netflix-top10/countries.ndjson`, 501,040줄)에서 센 것이다.
 *   ⭐ 같은 수를 두 군데서 세면 반드시 어긋난다. **한 번 센 것을 파생시킨다.**
 *
 * [고르는 규칙 — 지면이 나는 것만]
 *   `index.astro` 80줄이 이미 그렇게 적어 두었다 —
 *   「수요 자료는 지면이 나는 것만 담는다」. 그 계약을 코드로 지킨다.
 *
 * [쓰는 법]
 *   node scripts/build-wikitip-title-demand.mjs             다시 만든다
 *   node scripts/build-wikitip-title-demand.mjs --확인       바뀌는지만 본다(안 쓴다)
 *   node scripts/build-wikitip-title-demand.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 읽을곳 = path.join(뿌리, 'src', 'data', 'wikitip-title-pages.json');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-title-demand.json');

/**
 * 첫 화면이 걸 작품 목록을 만든다.
 *
 * ⛔ `hasPage` 가 참인 것만 담는다 — 지면이 없는 곳으로 링크를 걸면 404 다.
 * ⛔ 자리 수(`places`)가 0 이거나 주소(`slug`)가 없으면 담지 않는다 — 화면이 걸 수 없다.
 */
export function 고른다(작품들) {
  return (작품들 ?? [])
    .filter((t) => t && t.hasPage === true && t.slug && Number.isFinite(t.places) && t.places > 0)
    .map((t) => ({
      slug: t.slug,
      title: t.title,
      type: t.type,
      places: t.places,
      markets: t.markets,
      weeks: t.weeks,
      peak: t.peak,
    }))
    /* 큰 것부터. 같으면 주소로 갈라 **돌릴 때마다 순서가 달라지지 않게** 한다 */
    .sort((가, 나) => 나.places - 가.places || String(가.slug).localeCompare(String(나.slug)));
}

/**
 * 자료 한 벌을 만든다.
 * ⭐ 무엇을 센 것이고 무엇이 «아닌지»를 적은 글칸은 **앞 판에서 그대로 물려받는다** —
 *    그 글은 사람이 쓴 것이고, 다시 쓰면 뜻이 조용히 바뀐다.
 */
export function 만든다(작품자료, 앞판 = null, 지금 = new Date()) {
  const titles = 고른다(작품자료?.titles);
  return {
    generated: 지금.toISOString(),
    whatThisIs: 앞판?.whatThisIs
      ?? "The Korean titles that took the most Netflix weekly top 10 places, counted from Netflix's own country files. Used to decide which title pages the front page links to.",
    whatThisIsNot: 앞판?.whatThisIsNot
      ?? 'This is not a ranking of quality and not a viewing figure. A chart place shows a title was on Netflix in that country that week; it says nothing about how many people watched it.',
    ...(앞판?.whyNotWikipedia ? { whyNotWikipedia: 앞판.whyNotWikipedia } : {}),
    /* ⭐ 어디서 왔는지를 자료 안에 적는다 — 다음 사람이 두 번 파지 않게 */
    derivedFrom: 'wikitip-title-pages.json (built by build-wikitip-title-pages.mjs from archive/raw/netflix-top10)',
    onlyTitlesWithPages: true,
    basis: 'chartPlaces',
    measured: titles.length,
    titles,
  };
}

export function 자가시험() {
  let 흠 = 0;
  let 잰수 = 0;
  const 본다 = (이름, 참) => {
    잰수 += 1;
    if (참) console.log(`  ✅ ${이름}`);
    else { console.log(`  🔴 ${이름}`); 흠 += 1; }
  };

  const 보기 = [
    { slug: 'a', title: 'A', type: 'TV', places: 10, markets: 3, weeks: 2, peak: 1, hasPage: true },
    { slug: 'b', title: 'B', type: 'Films', places: 50, markets: 9, weeks: 5, peak: 2, hasPage: true },
    /* ⛔ 이것이 이 자를 만든 까닭이다 — 지면이 없는데 첫 화면이 걸고 있었다 */
    { slug: 'c', title: 'C', type: 'TV', places: 999, markets: 40, weeks: 30, peak: 1, hasPage: false },
    { slug: 'd', title: 'D', type: 'TV', places: 0, markets: 0, weeks: 0, peak: null, hasPage: true },
    { slug: '', title: 'E', type: 'TV', places: 7, markets: 1, weeks: 1, peak: 3, hasPage: true },
  ];

  본다('🔴 지면이 없는 작품은 안 담는다 — 404 가 된다',
    !고른다(보기).some((t) => t.slug === 'c'));
  본다('자리 수가 0 이면 안 담는다', !고른다(보기).some((t) => t.slug === 'd'));
  본다('주소가 없으면 안 담는다', 고른다(보기).every((t) => t.slug));
  본다('큰 것부터 온다', 고른다(보기).map((t) => t.slug).join() === 'b,a');
  본다('빈 것을 줘도 안 터진다', 고른다(undefined).length === 0 && 고른다(null).length === 0);

  /* ⛔ 같은 자리 수일 때 순서가 흔들리면 돌릴 때마다 첫 화면이 바뀐다 */
  const 같은수 = [
    { slug: 'z', title: 'Z', places: 5, hasPage: true },
    { slug: 'y', title: 'Y', places: 5, hasPage: true },
  ];
  본다('자리 수가 같으면 주소로 갈라 흔들리지 않는다',
    고른다(같은수).map((t) => t.slug).join() === 'y,z' && 고른다([...같은수].reverse()).map((t) => t.slug).join() === 'y,z');

  본다('화면이 읽는 칸이 다 있다',
    고른다(보기).every((t) => ['slug', 'title', 'type', 'places', 'markets', 'weeks', 'peak']
      .every((k) => k in t)));

  const 한벌 = 만든다({ titles: 보기 }, { whatThisIs: '앞판 글', whyNotWikipedia: '까닭' });
  본다('사람이 쓴 글칸을 물려받는다', 한벌.whatThisIs === '앞판 글' && 한벌.whyNotWikipedia === '까닭');
  본다('앞판이 없어도 글칸이 빈칸이 아니다', (만든다({ titles: 보기 }).whatThisIs || '').length > 20);
  본다('센 수를 손으로 적지 않는다', 한벌.measured === 한벌.titles.length);
  본다('어디서 왔는지를 자료에 적는다', /wikitip-title-pages\.json/.test(한벌.derivedFrom));

  /* ⭐ 진짜 자료로도 한 번 재 본다 — 보기만 맞고 실물이 틀리는 일이 있다 */
  if (fs.existsSync(읽을곳)) {
    const 실물 = JSON.parse(fs.readFileSync(읽을곳, 'utf8'));
    const 낸다 = 고른다(실물.titles);
    본다(`실물에서도 하나 이상 골라진다 (${낸다.length}편)`, 낸다.length > 100);
    본다('골라진 것은 모두 hasPage 다',
      낸다.every((t) => 실물.titles.find((x) => x.slug === t.slug)?.hasPage === true));
  } else {
    console.log('  ⬜ 실물 자료가 없어 **못 쟀다**');
  }

  console.log(흠 ? `\n🔴 자가시험 ${흠}개 흠` : `\n✅ 자가시험 ${잰수}가지 다 지났다`);
  return 흠;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

  const 작품자료 = JSON.parse(fs.readFileSync(읽을곳, 'utf8'));
  const 앞판 = fs.existsSync(낼곳) ? JSON.parse(fs.readFileSync(낼곳, 'utf8')) : null;
  const 새것 = 만든다(작품자료, 앞판);

  /* 무엇이 바뀌는지 «수로» 낸다 — 「고쳤다」가 아니라 「559 → 546」으로 말한다 */
  const 앞주소 = new Set((앞판?.titles ?? []).map((t) => t.slug));
  const 새주소 = new Set(새것.titles.map((t) => t.slug));
  const 빠짐 = [...앞주소].filter((s) => !새주소.has(s));
  const 들어옴 = [...새주소].filter((s) => !앞주소.has(s));

  console.log(`작품 자료 ${작품자료.titles.length}편 → 지면이 나는 것 ${새것.titles.length}편`);
  console.log(`앞판 ${앞판?.titles?.length ?? 0}편 · 빠짐 ${빠짐.length} · 들어옴 ${들어옴.length}`);
  if (빠짐.length) console.log(`  빠짐   ${빠짐.slice(0, 20).join(' · ')}${빠짐.length > 20 ? ' …' : ''}`);
  if (들어옴.length) console.log(`  들어옴 ${들어옴.slice(0, 20).join(' · ')}${들어옴.length > 20 ? ' …' : ''}`);

  if (process.argv.includes('--확인')) { console.log('\n⬜ --확인 이라 쓰지 않았다'); process.exit(0); }

  fs.writeFileSync(낼곳, JSON.stringify(새것, null, 2), 'utf8');
  console.log(`\n✅ ${path.relative(뿌리, 낼곳)} 를 다시 만들었다`);
}
