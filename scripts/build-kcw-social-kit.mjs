#!/usr/bin/env node
/**
 * **밖으로 내보낼 것을 한 벌로 묶는다** (`archive/social/`)
 *
 * 🔴 사장님(8/13): 「이건 **외부유입용** 콘텐트 역할도 하고, 우리를 알리는 거니까」
 * 🔴 8/14 에 세어 보니 카드뉴스 20장·숏영상 3편이 사이트엔 걸렸는데
 *   **SNS 에는 한 장도 안 나갔다.** 계정 로그인은 내가 못 한다.
 *   ⭐ 그러면 **올릴 것을 미리 묶어 두는 것**까지가 내 몫이다.
 *      사장님이 계정을 정하시는 즉시 복사해 붙이면 끝나게.
 *
 * ── ⛔ 이 글이 지키는 것 ─────────────────────────────────────
 * ⛔ 사람 말투로 홍보하지 않는다. **숫자가 말하게 한다.**
 *    「대박」·「놀랍다」·「필독」을 쓰지 않는다.
 * ⛔ 화면에 없는 수를 쓰지 않는다. 전부 자료에서 읽는다.
 * ⛔ 주소가 없는 글을 만들지 않는다 — 데려올 데가 없으면 만든 값이 0이다.
 * ⚠ X 는 280자다. 넘으면 **잘려서** 주소가 사라진다. 그래서 길이를 잰다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-social-kit.mjs
 *   node scripts/build-kcw-social-kit.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 지금 } from './_kst.mjs';

const 낼방 = 'archive/social';
const 주소 = 'https://www.kculturewire.com';

/** X 한 글의 길이. ⚠ 주소는 몇 자든 23자로 세어진다 */
export const X한도 = 280;
export const 주소길이 = 23;

export function X길이(글) {
  return 글.replace(/https?:\/\/\S+/g, 'x'.repeat(주소길이)).length;
}

/** ⛔ 사람 말투로 홍보하지 않는다 — 이 말들이 들면 막는다 */
export const 금지말 = [
  'amazing', 'incredible', 'must-read', 'you won\'t believe', 'shocking',
  'mind-blowing', 'game-changing', 'insane', 'crazy', 'wow',
];

export function 금지말들었나(글) {
  const 낮 = 글.toLowerCase();
  return 금지말.filter((w) => 낮.includes(w));
}

/** 벌 하나가 온전한가 — ⛔ 주소 없는 글은 만들지 않는다 */
export function 벌검사(벌) {
  const 탈 = [];
  if (!벌.x) 탈.push('X 글이 없다');
  else {
    if (!벌.x.includes(주소)) 탈.push('X 글에 주소가 없다');
    if (X길이(벌.x) > X한도) 탈.push(`X 글이 ${X길이(벌.x)}자 — ${X한도}자를 넘는다`);
    const 나쁜말 = 금지말들었나(벌.x);
    if (나쁜말.length) 탈.push(`홍보 말투: ${나쁜말.join(', ')}`);
  }
  if (!벌.images?.length) 탈.push('붙일 그림이 없다');
  if (!벌.page) 탈.push('데려갈 지면이 없다');
  return 탈;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/** 벌 짓기 — 수는 전부 자료에서 읽는다 */
export function 벌들짓기(읽기 = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))) {
  const fame = 읽기('src/data/wikitip-fame-compare.json');
  const places = 읽기('src/data/wikitip-places.json');
  const spread = 읽기('src/data/wikitip-spread.json');
  const my = 읽기('src/data/wikitip-malaysia.json');
  const inst = 읽기('src/data/wikitip-titles-to-name.json');
  const br = 읽기('src/data/wikitip-brand-kinds.json');
  const cn = 읽기('src/data/wikitip-read-vs-visited.json');
  const se = 읽기('src/data/wikitip-look-vs-fly.json');
  const wf = 읽기('src/data/wikitip-what-fell.json');
  const wv = 읽기('src/data/wikitip-wave-floor.json');
  /** ⛔ 부호를 손으로 안 박는다. 자료가 양수면 +, 음수면 − 다 */
  const 몫 = (v) => `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
  const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const 달말 = (mm) => 달이름[Number(mm) - 1] ?? mm;
  const 장 = (벌) => Array.from({ length: 5 }, (_, i) => `public/wikitip/cardnews/${벌}/${String(i + 1).padStart(2, '0')}.png`);

  return [
    {
      key: 'fame',
      page: `${주소}/fame-compare`,
      images: 장('fame'),
      x: `${fame.topActorName} ${fame.topActorTotal}. ${fame.topAthleteName} ${fame.topAthleteTotal}.\n\n`
        + `Reads of their Wikipedia articles across Indonesia, Vietnam, Thailand and Malaysia, `
        + `scaled by the size of each edition. Of ${fame.entertainersCounted.toLocaleString('en-US')} `
        + `entertainers measured, ${fame.actorsAboveTopAthlete} clears the athlete.\n\n`
        + `${주소}/fame-compare`,
      alt: 'Five cards comparing how often Korean groups, actors, athletes and brands are looked up '
        + 'in four Southeast Asian Wikipedias.',
    },
    {
      key: 'places',
      page: `${주소}/places`,
      images: 장('places'),
      x: `${places.topCompany.name} ${places.topCompany.total}. ${places.topCity.name} ${places.topCity.total}.\n\n`
        + `${places.citiesBelowTopCompany} of ${places.citiesCounted} Korean cities and districts `
        + `sit below that one company.\n\nThis counts look-ups, not visits, and it cannot see a `
        + `single restaurant.\n\n${주소}/places`,
      alt: 'Five cards on which parts of Korea are looked up in four Southeast Asian Wikipedias.',
    },
    {
      key: 'malaysia',
      page: `${주소}/malaysia`,
      images: 장('malaysia'),
      x: `Malaysia's share of four-country reading about Korea:\n\n`
        + `people ${my.peopleShareRangePc[0]}–${my.peopleShareRangePc[1]}%\n`
        + `brands ${my.brandSharePc}%\n\n`
        + `Four groups land in a narrow band. One lands well outside it. We publish the gap and `
        + `leave the reason open.\n\n${주소}/malaysia`,
      alt: 'Five cards showing Malaysia reading Korean brands more readily than Korean people.',
    },
    {
      key: 'manager',
      page: `${주소}/sea-athletes`,
      images: 장('manager'),
      x: `A Korean footballer's readership spreads across Southeast Asia. A Korean manager's sits `
        + `in the country that hired him.\n\nMedian concentration in one country: `
        + `${spread.groups.find((g) => g.group === 'footballers')?.medianTopSharePc}% for players, `
        + `${spread.groups.find((g) => g.group === 'managers')?.medianTopSharePc}% for managers.\n\n`
        + `${주소}/sea-athletes`,
      alt: 'Five cards on Korean footballers and managers read across four Southeast Asian Wikipedias.',
    },
    {
      key: 'instrument',
      page: `${주소}/titles-to-name`,
      images: 장('instrument'),
      x: `Yesterday this came out flat. Today it reads.\n\n`
        + `Median reads of a Korean actor's own Wikipedia article, by how many of their titles `
        + `reached a Netflix chart: ${inst.bands.map((b) => b.medianRead).filter(Boolean).join(', ')}. `
        + `${inst.multiple}× between the ends.\n\nWe changed the ruler, not the panel.\n\n`
        + `${주소}/titles-to-name`,
      alt: 'Five cards showing median Wikipedia reads for Korean actors grouped by how many of '
        + 'their titles reached a Netflix chart.',
    },
    {
      /**
       * 88편. ⛔ 「어느 나라가 관심이 많다」로 읽히면 거짓이다 — 두 수를 나란히만 놓는다.
       * ⛔ 한국 차 배수를 안 쓴다. 기사도 안 냈다. 나가는 글이 기사보다 앞서면 안 된다.
       */
      key: 'brands',
      page: `${주소}/brand-kinds`,
      images: 장('brands'),
      x: `${br.countryNames[br.positionSwing.제일]} reads more about German cars than its three `
        + `neighbours, and less about luxury houses than any of them.\n\n`
        + `${br.kinds.find((k) => k.key === 'car').판별[br.positionSwing.제일]} against `
        + `${br.kinds.find((k) => k.key === 'luxury').판별[br.positionSwing.제일]}, `
        + `per million reads of that Wikipedia.\n\nRank 22 brands together and this disappears.\n\n`
        + `${주소}/brand-kinds`,
      alt: 'Five cards comparing how much four Southeast Asian Wikipedias are read about luxury '
        + 'houses, German car makers and jewellers.',
    },
    {
      /**
       * 89편. ⛔ 「강남이 인기 없다」로 읽히면 거짓이다 — 유료 관광지 자다.
       * ⛔ 원본의 0 을 그럴듯한 수로 안 고쳤다는 말을 나가는 글에도 넣는다.
       */
      key: 'counting',
      page: `${주소}/read-vs-visited`,
      images: 장('counting'),
      /* ⚠ 287자로 넘쳐 검사가 막았다. 뜻을 안 깎고 군말을 줄였다 — 주소는 23자로 센다 */
      x: `Seoul has ${cn.seoulDistrictsAll} districts. Korea's public admissions table can be `
        + `asked about ${cn.districtsCompared}.\n\n`
        + `In ${cn.districtsWithNoCountedSite} it counts no tourist site at all — including Jung, `
        + `which holds Myeongdong. In ${cn.districtsWithForeignZero} more it records zero foreign `
        + `visitors.\n\nWe marked those rows instead of guessing.\n\n`
        + `${주소}/read-vs-visited`,
      alt: 'Five cards on what Korea\'s public tourist-admissions table can and cannot see about '
        + 'Seoul\'s districts.',
    },
    {
      /**
       * 90편. ⛔ 「12월에 알아보고 1월에 간다」로 읽히면 거짓이다.
       *   기사가 본문에서 그것을 부정했으니 나가는 글도 **바닥을 앞에 세운다.**
       */
      key: 'season',
      page: `${주소}/look-vs-fly`,
      images: 장('season'),
      x: `Southeast Asia looks up a Korean trip most in ${달말(se.lookPeak.peak)}. Planes on the `
        + `Asia routes fill most in ${달말(se.flyPeak.peak)}.\n\n`
        + `The steadier signal is the other end: both fall to their lowest in `
        + `${달말(se.lookPeak.trough)}.\n\nWe are not calling that a cause.\n\n`
        + `${주소}/look-vs-fly`,
      alt: 'Five cards comparing the months Southeast Asia reads about Korean travel with the '
        + 'months flights on the Asia routes are busiest.',
    },
    {
      /**
       * 91편. ⛔ **첫 줄에 「−30%」만 두지 않는다.**
       *   타임라인에서 첫 줄만 읽고 지나가는 사람이 대부분이다. 그 사람에게
       *   우리가 안 쓰기로 한 헤드라인이 그대로 가면, 카드 다섯 장을 만든 뜻이 없다.
       *   ⭐ 그래서 첫 줄이 **두 수를 같이** 든다.
       */
      key: 'control',
      page: `${주소}/what-actually-fell`,
      images: 장('control'),
      x: `Korean travel articles in four Southeast Asian Wikipedias: ${몫(wf.axes.trip.korea)} `
        + `in a year.\nJapanese and Taiwanese culture articles, same editions, same months: `
        + `${몫(wf.axes.culture.control)}.\n\n`
        + `Air passengers on the Asia routes moved ${몫(wf.flights.asia.change)}.\n\n`
        + `It was travel, not Korea.\n\n${주소}/what-actually-fell`,
      alt: 'Five cards showing that Korean travel articles fell across four Southeast Asian '
        + 'Wikipedias while Japanese and Taiwanese culture articles did not, and that air '
        + 'passengers on the Asia routes barely moved over the same months.',
    },
    {
      /**
       * 92편. ⛔ **첫 줄에 「35배」를 두지 않는다.**
       *   오징어게임은 표에서 **뺀** 편이다 — 뒤바닥에 시즌 3 이 들어앉아 있었다.
       *   타임라인에서 첫 줄만 읽는 사람에게 그 수가 가면, 우리가 못 쓴다고 한 수를
       *   가장 크게 내보내는 셈이 된다.
       * ⛔ 평균(+0.8%)도 쓰지 않는다. 기사가 고른 쪽을 나가는 글도 고른다.
       */
      key: 'wave',
      page: `${주소}/wave-and-floor`,
      images: 장('wave'),
      x: `A Korean title lands, four Southeast Asian Wikipedias fill with it, and then they empty.\n\n`
        + `Across the ${wv.answer.measured} titles we could measure on both sides of their peak: `
        + `median wave ${wv.answer.peakOverFloorMedian}×, median floor afterwards `
        + `${몫(wv.answer.floorChangeMedianPc)}.\n\n`
        + `${wv.answer.floorsThatRose} of ${wv.answer.measured} ended higher.\n\n`
        + `${주소}/wave-and-floor`,
      alt: 'Five cards showing five Korean titles measured in four Southeast Asian Wikipedias '
        + 'before and after the month each one peaked, and the fifteen titles that could not be '
        + 'measured at all.',
    },
  ];
}

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 180)}`); }
  };
  재본다('X 길이 — 주소는 23자로 센다', X길이(`a ${주소}/x`), 2 + 주소길이);
  재본다('⛔ 홍보 말투를 잡는다', 금지말들었나('This is amazing'), ['amazing']);
  재본다('⛔ 깨끗한 글은 안 걸린다', 금지말들었나('BTS 380.76. Son Heung-min 342.3.'), []);
  재본다('벌검사 — 주소 없으면 잡는다', 벌검사({ x: 'hi', images: ['a'], page: 'p' }),
    (x) => x.includes('X 글에 주소가 없다'));
  재본다('벌검사 — 그림 없으면 잡는다', 벌검사({ x: `x ${주소}`, page: 'p' }),
    (x) => x.includes('붙일 그림이 없다'));
  재본다('벌검사 — 너무 길면 잡는다',
    벌검사({ x: `${'a'.repeat(300)} ${주소}`, images: ['a'], page: 'p' }),
    (x) => x.some((s) => s.includes('넘는다')));
  const 벌들 = 벌들짓기();
  /**
   * 🔴 2026-08-14 — 여기 「5」가 손으로 박혀 있어서, 여섯째 벌을 넣자 검사가 **실패**했다.
   *   ⛔ 늘어나는 것을 막는 검사는 검사가 아니라 자물쇠다.
   *   ⭐ 물어야 할 것은 「몇 벌인가」가 아니라 **「만든 카드뉴스마다 나갈 글이 있나」**다.
   *     카드뉴스는 있는데 글이 없으면 그 카드는 어디에도 안 나간다 — 그것이 진짜 흠이다.
   */
  const 카드뉴스벌 = fs.readdirSync('public/wikitip/cardnews', { withFileTypes: true })
    .filter((e) => e.isDirectory()).map((e) => e.name).sort();
  재본다('카드뉴스 벌마다 나갈 글이 있다', 카드뉴스벌.filter((v) => !벌들.some((b) => b.key === v)), []);
  재본다('나갈 글마다 카드뉴스가 있다', 벌들.filter((b) => !카드뉴스벌.includes(b.key)).map((b) => b.key), []);
  for (const 벌 of 벌들) 재본다(`벌 ${벌.key} 가 온전하다`, 벌검사(벌), []);
  재본다('벌마다 그림이 다섯', 벌들.every((b) => b.images.length === 5), true);
  재본다('⛔ 그림 파일이 실제로 있다',
    벌들.flatMap((b) => b.images).filter((p) => !fs.existsSync(p)), []);
  재본다('벌마다 대체글이 있다 — 눈이 안 보이는 사람도 읽는다',
    벌들.every((b) => (b.alt ?? '').length > 30), true);
  console.log(`밖에 낼 것 묶는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  fs.mkdirSync(낼방, { recursive: true });
  const 벌들 = 벌들짓기();
  const 탈난것 = [];
  for (const 벌 of 벌들) {
    const 탈 = 벌검사(벌);
    if (탈.length) 탈난것.push(`${벌.key}: ${탈.join(' · ')}`);
  }
  if (탈난것.length) {
    console.error('⛔ 온전하지 않은 벌이 있다 — 안 낸다:');
    for (const t of 탈난것) console.error(`   · ${t}`);
    process.exit(1);
  }

  fs.writeFileSync(path.join(낼방, 'kit.json'), `${JSON.stringify({
    generated: 지금(),
    note: 'Ready to post. Account and destination are the owner\'s call; everything else is here.',
    rules: [
      'Numbers speak. No promotional voice.',
      'Every post carries the page URL — a post with no way back is worth nothing.',
      'Alt text on every image.',
      'X posts are measured with URLs counted as 23 characters.',
    ],
    sets: 벌들,
  }, null, 2)}\n`);

  /* 사람이 바로 복사해 붙일 수 있게 글만 따로 */
  const 글 = 벌들.map((b) => `── ${b.key} ─────────────────────────────\n`
    + `그림 ${b.images.length}장: ${b.images[0]} … ${b.images[b.images.length - 1]}\n`
    + `대체글: ${b.alt}\n\n${b.x}\n\n(${X길이(b.x)}자 / ${X한도})\n`).join('\n');
  fs.writeFileSync(path.join(낼방, 'posts.txt'), 글);

  console.log(`⭐ ${낼방}/kit.json · posts.txt — 벌 ${벌들.length}\n`);
  for (const b of 벌들) {
    console.log(`   ${b.key.padEnd(10)} 그림 ${b.images.length}장 · X ${X길이(b.x)}자 · → ${b.page}`);
  }
  /**
   * 🔴 8/15 — 여기 「사장님이 정해 주시면」이라고 적혀 있었다. **사장님께서 그것을 금하셨다** —
   *   「내 손을 빌리지마」·「실무적인 데는 내가 없다고 생각해라」.
   * ⭐ 계정과 올릴 곳은 **2번의 판단 몫**으로 옮겼다. 자가 사장님을 부르지 않는다.
   */
  console.log('\n⏳ 계정과 올릴 곳이 정해지면 그대로 나갑니다 — 2번 판단 몫입니다.');
}
