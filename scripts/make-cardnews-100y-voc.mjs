#!/usr/bin/env node
/**
 * make-cardnews-100y-voc.mjs — **개봉날(8/15) 카드뉴스** 「길은 갈라지지 않았습니다」 6장.
 *
 *   node scripts/make-cardnews-100y-voc.mjs --자가시험
 *   node scripts/make-cardnews-100y-voc.mjs
 *
 * ## 🔴 왜 이 거리인가
 *
 *   사장님 지시(8/14) — 「카드·카드뉴스·숏동영상은 **하루에 하나씩 만들어 배포까지 완료**」
 *   같은 날 지은 8/15 영상(`make-video-100y-voc.mjs`)과 **같은 수, 다른 매체**다.
 *   영상은 넘겨 보는 사람에게, 카드뉴스는 **저장하고 다시 보는 사람**에게 간다.
 *
 *   ⭐ 개봉날 거리다. 「직업계고 = 취업, 일반고 = 대학」이 사람들 머릿속의 갈래인데
 *     **직업계고 졸업자의 절반이 대학에 간다.** 우리가 무엇을 뒤집는 곳인지가 한 벌에 담긴다.
 *
 * ## ⛔ 조심한 것 — 영상과 같다
 *
 *   ⚠ **진학률과 취업률을 더하면 안 된다.** 분모가 다르다(49.2 + 55.2 = 104.4).
 *     ⭐ 그래서 **한 장에 둘을 같이 올리지 않는다.** 취업률을 쓰는 장에서는 분모를 그 자리에 적는다.
 *   ⚠ 예술계열 28명은 **최소분모 30**을 못 넘어 뺀다. 뺐다는 것을 카드에 적는다.
 *   ⛔ 「그러니 대학에 가라」·「가지 마라」를 쓰지 않는다. 등수·순위를 쓰지 않는다.
 *
 * ⛔ 화면의 수는 전부 `voc-series-outcomes.json` 에서 온다. 손으로 안 박는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 숫자캐기, 다짐줄지우기 } from './lib/재기-공통.mjs';

/* ⚠ new URL(...).pathname 은 한글 폴더를 %EC.. 로 바꾼다. fileURLToPath 를 쓴다 */
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 자료방 = path.join(ROOT, 'src', 'data', '100yearmap');
const 낼방 = path.join(ROOT, 'public', '100y', 'cardnews');

const W = 1080, H = 1350, M = 92;
const 색 = { 바탕: '#12151c', 글: '#e9e9ee', 금: '#c9a84c', 금연한: '#e0c877', 흐림: '#7d7d8a', 선: '#2a2f3a' };
const 명조 = 'Batang, 바탕, serif';
const 고딕 = "'Malgun Gothic', '맑은 고딕', system-ui, sans-serif";
const 막는다 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** ⛔ 최소분모. 이걸 못 넘는 계열은 카드에 안 올린다 */
export const 최소분모 = 30;
export const 갈곳 = '100yearmap.com/work';

const 자료 = JSON.parse(fs.readFileSync(path.join(자료방, 'voc-series-outcomes.json'), 'utf8'));
export const 총계 = 자료.통계.총계;
export const 쓸계열 = 자료.자료
  .filter((r) => r.졸업자 >= 최소분모 && typeof r.진학률 === 'number')
  .sort((a, b) => b.졸업자 - a.졸업자);
export const 뺀계열 = 자료.자료.filter((r) => r.졸업자 < 최소분모 || typeof r.진학률 !== 'number');

export function 줄나눔(글, 폭) {
  const 낱말 = String(글).split(' ');
  const 줄 = [];
  let 이번 = '';
  for (const w of 낱말) {
    if (!이번) { 이번 = w; continue; }
    if ((이번 + ' ' + w).length <= 폭) 이번 += ' ' + w;
    else { 줄.push(이번); 이번 = w; }
  }
  if (이번) 줄.push(이번);
  return 줄;
}

/** 여섯 장을 짠다. ⛔ 한 장에 진학률과 취업률을 같이 올리지 않는다 */
export function 짜기() {
  const 다섯 = 쓸계열.slice(0, 5);
  const 제일높은 = 다섯.reduce((a, b) => (b.진학률 > a.진학률 ? b : a));
  const 제일낮은 = 다섯.reduce((a, b) => (b.진학률 < a.진학률 ? b : a));

  return [
    {
      꼴: '표지',
      큰수: `${Math.round(총계.진학률)}명`,
      줄들: ['직업계고를 나온 100명 가운데', '대학에 간 사람입니다.'],
    },
    {
      머리: '「직업계고는 취업, 일반고는 대학」',
      줄들: [
        '그렇게 갈라 놓고 이야기합니다.',
        '',
        `그런데 ${자료.통계.기준연도}년 직업계고 졸업자`,
        `${총계.졸업자.toLocaleString()}명 가운데`,
        `${총계.진학자.toLocaleString()}명이 대학에 갔습니다.`,
        '',
        '절반입니다.',
      ],
    },
    {
      머리: '계열별로 보면',
      줄들: 다섯.map((r) => `${r.계열}  ${r.진학률}%   (졸업 ${r.졸업자.toLocaleString()}명)`),
    },
    {
      머리: '가장 높은 곳과 가장 낮은 곳',
      줄들: [
        `${제일높은.계열}계열 ${제일높은.진학률}%`,
        `${제일낮은.계열}계열 ${제일낮은.진학률}%`,
        '',
        '⛔ 이것은 등수가 아닙니다.',
        '계열마다 다르다는 것만 적습니다.',
        '어느 쪽이 낫다고 말하지 않습니다.',
      ],
    },
    {
      머리: '⚠ 두 비율을 더하지 마십시오',
      줄들: [
        '진학률 = 진학자 ÷ 졸업자',
        '',
        '취업률 = 취업자 ÷ 취업대상자',
        '취업대상자에서는 진학한 사람이 빠집니다.',
        '',
        '분모가 달라서 더하면 100을 넘습니다.',
        '그래서 이 카드에는 진학률만 놓았습니다.',
      ],
    },
    {
      꼴: '마무리',
      머리: '길은 갈라지지 않았습니다',
      줄들: [
        '대학은 100년 중 한 점일 뿐입니다.',
        '그 뒤에 무슨 일이 있었는지를 봅니다.',
        '',
        `⚠ 졸업자가 ${최소분모}명이 안 되는 계열 ${뺀계열.length}갈래는`,
        '   뺐습니다. 적은 수로는 말할 수 없습니다.',
        '',
        갈곳,
      ],
    },
  ];
}

/* 🔴 2026-08-16 — 바닥 한 줄이 **여기에 박혀** 있었다(「직업계고 졸업자 취업통계」).
   다른 카드가 이 자를 가져다 쓰면 **남의 출처가 그대로 찍힌다.** 자격 카드에서 실제로 그렇게 나왔다.
   ⇒ 바닥을 밖에서 넣을 수 있게 연다. 안 넣으면 예전 그대로다 — 개봉 카드는 바뀌지 않는다 */
export const 기본바닥 = `${자료.통계.기준연도}년 · 직업계고 졸업자 취업통계 · 등수를 매기지 않습니다`;

/* 🔴 2026-08-16 — 바닥에 이어 **데려올 주소**도 박혀 있었다(`100yearmap.com/work`).
   대학 지면을 가리키는 카드를 만들면서야 보였다 — 주소가 틀리면 그 카드는 **손님을 엉뚱한 곳에
   데려간다.** 「주소 없는 카드는 안 만든다」와 같은 무게의 흠이다.
   ⇒ 갈곳도 밖에서 넣게 연다. 안 넣으면 예전 그대로다(개봉 카드·자격 카드는 안 바뀐다) */
const 틀 = (속, 쪽, 총, 바닥 = 기본바닥, 갈곳쓸 = 갈곳) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${색.바탕}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${색.금}"/>
  <text x="${M}" y="118" font-family="${명조}" font-size="34" font-weight="bold" fill="${색.금}" letter-spacing="4">백년지도</text>
  <text x="${W - M}" y="118" text-anchor="end" font-family="${고딕}" font-size="28" fill="${색.흐림}">${쪽} / ${총}</text>
  ${속}
  <!-- 🔴 2026-08-14 — 한 줄에 출처와 주소를 나란히 뒀더니 **겹쳤다.** 실물을 열어 보고 잡았다.
       자가시험은 조용했다 — 글자는 다 «있었고», 겹친 것은 그림이라 세는 자로는 안 보인다.
       ⭐ 두 줄로 내린다. 출처가 위, 데려올 주소가 아래다 -->
  <text x="${M}" y="${H - 96}" font-family="${고딕}" font-size="24" fill="${색.흐림}">${막는다(바닥)}</text>
  <text x="${M}" y="${H - 56}" font-family="${고딕}" font-size="26" fill="${색.금}">${막는다(갈곳쓸)}</text>
</svg>`;

export function 그리기(장, 쪽, 총, 바닥 = 기본바닥, 갈곳쓸 = 갈곳) {
  let s = '';
  if (장.꼴 === '표지') {
    s += `<text x="${M}" y="470" font-family="${명조}" font-size="180" font-weight="bold" fill="${색.글}" letter-spacing="-4">${막는다(장.큰수)}</text>`;
    s += `<line x1="${M}" y1="540" x2="${W - M}" y2="540" stroke="${색.선}" stroke-width="1"/>`;
    s += 장.줄들.map((l, i) => `<text x="${M}" y="${630 + i * 74}" font-family="${고딕}" font-size="56" font-weight="bold" fill="${색.글}">${막는다(l)}</text>`).join('\n  ');
  } else {
    const 색머리 = 장.꼴 === '마무리' ? 색.금연한 : 색.금;
    const 머리줄 = 줄나눔(장.머리 ?? '', 20);
    s += 머리줄.map((l, i) => `<text x="${M}" y="${250 + i * 56}" font-family="${고딕}" font-size="42" font-weight="bold" fill="${색머리}">${막는다(l)}</text>`).join('\n  ');
    const 시작 = 250 + 머리줄.length * 56 + 70;
    s += '\n  ' + 장.줄들.map((l, i) => (l === '' ? '' : `<text x="${M}" y="${시작 + i * 62}" font-family="${고딕}" font-size="42" fill="${색.글}">${막는다(l)}</text>`)).filter(Boolean).join('\n  ');
  }
  return 틀(s, 쪽, 총, 바닥, 갈곳쓸);
}

/* ── 자가시험 ────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 조건) => 결과.push({ 이름, 됐나: !!조건 });
  const 장들 = 짜기();
  const 온글 = 장들.map((장, i) => 그리기(장, i + 1, 장들.length)).join('\n');
  const 민글 = 온글.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 여섯 장이다', 장들.length === 6);
  본다('② 표지에 큰 수가 있다', 장들[0].꼴 === '표지' && /\d/.test(장들[0].큰수));
  본다('③ 🔴 최소분모 30을 못 넘는 계열은 안 올린다 — 예술(28명)',
    쓸계열.every((r) => r.졸업자 >= 최소분모) && 뺀계열.some((r) => r.계열 === '예술'));
  본다('④ 🔴 뺀 갈래가 몇인지 카드에 적는다', 민글.includes(`계열 ${뺀계열.length}갈래`));

  /* 🔴 이 한 벌의 핵심 조심 — 분모가 다른 두 비율을 **한 장에** 올리지 않는다 */
  const 취업률쓴장 = 장들.filter((장) =>
    JSON.stringify(장).includes(String(총계.취업률)));
  본다('⑤ 🔴 취업률 숫자를 아예 안 올린다 — 더하면 104%가 된다', 취업률쓴장.length === 0);
  본다('⑥ 그 까닭을 카드에 적는다', 민글.includes('분모가 달라서 더하면 100을 넘습니다'));

  /* 🔴 여기 처음에 `|| true` 를 붙여 **늘 통과하는 시험**을 써 놨었다.
     그건 시험이 아니라 초록 불이다. 우리 다짐 줄만 지우고 진짜로 본다 */
  const 등수뺀글 = 민글
    .replace(/등수를 매기지 않습니다/g, ' ')
    .replace(/이것은 등수가 아닙니다/g, ' ');
  /* ⚠ 낱말 목록만으로는 「전국 1위입니다」를 못 잡았다 — 일부러 넣어 보고 알았다.
     **숫자 뒤에 붙는 「위」**를 따로 본다 */
  const 등수말 = ['등수', '순위', '랭킹', '몇 위', '상위권', '하위권']
    .filter((w) => 등수뺀글.includes(w))
    /* ⚠ `\b` 를 쓰면 안 된다. 한글은 \w 가 아니라 **한글 사이에 경계가 안 생긴다** —
       「1위입니다」가 `\d\s*위\b` 로 안 잡혔다. 일부러 넣어 보고 알았다 */
    .concat(/\d\s*위|\d\s*등(?!학)/.test(등수뺀글) ? ['N위·N등'] : []);
  본다(`⑦ ⛔ 등수·순위를 쓰지 않는다${등수말.length ? ` — ${등수말.join(' · ')}` : ''}`, 등수말.length === 0);
  const 금지말 = ['가야 한다', '가지 마', '해야 한다', '늦었다', '1등', '상위', '꼴찌', '유리하다', '불리하다'];
  const 걸린말 = 금지말.filter((w) => 다짐줄지우기(민글).includes(w));
  본다(`⑧ 금지말이 없다${걸린말.length ? ` — ${걸린말.join(' · ')}` : ''}`, 걸린말.length === 0);

  본다('⑨ 🔴 모든 장에 데려올 주소가 있다',
    장들.every((장, i) => 그리기(장, i + 1, 장들.length).includes(갈곳)));

  /* 화면의 수가 전부 자료에서 온 것인가 */
  const 근거 = new Set([
    총계.진학률, Math.round(총계.진학률), 총계.졸업자, 총계.진학자,
    100, 최소분모, 뺀계열.length, 장들.length, Number(자료.통계.기준연도), 2025,
    ...쓸계열.flatMap((r) => [r.진학률, r.졸업자]),
    ...Array.from({ length: 6 }, (_, i) => i + 1),
  ]);
  const 못댄것 = 숫자캐기(민글).filter((n) => !근거.has(n));
  본다(`⑩ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  본다('⑪ 「길은 갈라지지 않았습니다」로 맺는다', 민글.includes('길은 갈라지지 않았습니다'));
  본다('⑫ 절반이라고 말한다', 민글.includes('절반입니다'));
  /* 🔴 실물을 열어 보고 넣은 시험 — 출처와 주소를 한 줄에 뒀더니 **겹쳤다.**
     글자는 다 있어서 세는 자로는 안 보였다. 이제 **y 가 다른지**로 본다 */
  /* ⚠ 이 줄을 셸 문자열로 넣었다가 `\d` 의 역슬래시가 먹혀 `d` 가 됐다.
     ⛔ 정규식이 든 코드를 셸로 쓰지 않는다. Write/Edit 로 쓴다 */
  const 바닥 = [...그리기(장들[0], 1, 6).matchAll(new RegExp('<text x="' + M + '" y="(\\d+)"', 'g'))]
    .map((m) => Number(m[1]));
  const 아래둘 = 바닥.filter((y) => y > H - 140).sort((a, b) => a - b);
  본다('⑬ 🔴 바닥의 출처와 주소가 서로 다른 줄에 있다 — 겹치지 않는다',
    아래둘.length === 2 && 아래둘[1] - 아래둘[0] >= 30);

  for (const r of 결과) console.log((r.됐나 ? '  ✅ ' : '  ❌ ') + r.이름);
  const 진 = 결과.filter((r) => !r.됐나).length;
  console.log(`자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다 && process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

if (내가실행됐다) {
  if (!자가시험()) { console.log('⛔ 자가시험이 막았다. 카드를 만들지 않는다'); process.exit(1); }
  /* ⚠ sharp 는 **이 저장소** 것을 쓴다. klifemap 쪽에서 찾다가 「Cannot find module」로 섰다 */
  const sharp = (await import('sharp')).default;
  fs.mkdirSync(낼방, { recursive: true });
  const 장들 = 짜기();
  for (let i = 0; i < 장들.length; i++) {
    const png = await sharp(Buffer.from(그리기(장들[i], i + 1, 장들.length))).png().toBuffer();
    fs.writeFileSync(path.join(낼방, `개봉-길은갈라지지않았습니다-${i + 1}.png`), png);
  }
  console.log(`\n✅ 개봉날 카드뉴스 1벌 · ${장들.length}장 → public/100y/cardnews/`);
}
