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
  재본다('벌이 넷', 벌들.length, 4);
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
    generated: new Date().toISOString(),
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
  console.log('\n🖐 계정과 올릴 곳만 사장님이 정해 주시면 그대로 나갑니다.');
}
