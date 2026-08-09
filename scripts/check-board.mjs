#!/usr/bin/env node
// 체크판 자 — ☑ 를 자가 다시 잰다. 그리고 업무보고에 붙일 표를 찍는다.
//
// 사장님 지시(2026-08-09):
//   「열에 체크해야 하는 항목을, 행에 유닛명으로 해서 표를 만들 것.
//    체크박스를 만들어 **제대로 확인하는 절차**를 두도록」
//   「체크리스트를 **업무보고에서 확인할 수 있게** 할 것」
//
// ⛔ 이 자는 「했다」를 안 믿는다. **라이브에 물어본다.**
// ⛔ 못 잰 것은 「?」 다. 0 이 아니다.
//
// 쓰기:  node scripts/check-board.mjs            → 업무보고에 붙일 마크다운
//        node scripts/check-board.mjs --자가시험

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 자리들 = [
  { 자리: '1번 KLifeMap',     주소: 'https://klifemap.ai',           한글: '케이라이프맵' },
  { 자리: '3번 백년지도',      주소: 'https://100yearmap.com',        한글: '백년지도' },
  { 자리: '5번 KCW',          주소: 'https://www.kculturewire.com',  한글: '케이컬쳐' },
  { 자리: '6번 SeoulMarkets', 주소: 'https://seoulmarkets.com',      한글: '서울마켓' },
];

export const 표시 = { 됨: '☑', 안됨: '☐', 벽: '▨', 못잼: '?' };

/** 낱말이 지면에 몇 번 나오나. ⛔ 0 과 못 잼을 가른다. */
export function 낱말세기(글, 낱말) {
  if (글 == null) return null;                     // 못 쟀다
  if (!낱말) return 0;
  return String(글).split(낱말).length - 1;
}

/** title 이 브랜드 한 낱말인가. ⛔ 한 낱말이면 무엇을 파는지가 없다. */
export function 제목에설명있나(글) {
  if (글 == null) return null;
  const m = /<title>([^<]*)<\/title>/i.exec(String(글));
  if (!m) return false;
  const 제목 = m[1].trim();
  // 구분자(— · | –)가 있거나, 낱말이 셋 이상이면 설명이 붙은 것으로 본다
  if (/[—·|–\-]/.test(제목)) return true;
  return 제목.split(/\s+/).filter(Boolean).length >= 3;
}

export function 제목뽑기(글) {
  if (글 == null) return null;
  const m = /<title>([^<]*)<\/title>/i.exec(String(글));
  return m ? m[1].trim() : '';
}

export const 있나 = (글, 무늬) => (글 == null ? null : 무늬.test(String(글)));

/** 참/거짓/null 을 체크 글자로. ⛔ null 은 「?」 — 0 으로 만들지 않는다. */
export function 글자(값) {
  if (값 === null || 값 === undefined) return 표시.못잼;
  return 값 ? 표시.됨 : 표시.안됨;
}

/** 한 자리의 잰 값을 한 줄로. */
export function 줄만들기(잰것) {
  const { 자리, 라이브, 한글수, 제목설명, 매니페스트, 터치아이콘, adstxt, 사이트맵수 } = 잰것;
  const 한글칸 = 한글수 === null ? 표시.못잼
    : 한글수 === 0 ? `${표시.안됨} **0곳**`
    : `${표시.됨} ${한글수}곳`;
  return `| ${자리} | ${글자(라이브)} | ${한글칸} | ${글자(제목설명)} | ${글자(매니페스트)} | `
    + `${글자(터치아이콘)} | ${글자(adstxt)} | ${사이트맵수 ?? 표시.못잼} |`;
}

export function 표그리기(잰것들, 오늘) {
  const 줄 = [];
  줄.push(`### 사이트 — 자가 다시 잰 것 (${오늘})`);
  줄.push('');
  줄.push('| 유닛 | 라이브 | 한글 이름 | title 설명 | manifest | 홈화면 아이콘 | ads.txt | 사이트맵 |');
  줄.push('|---|:---:|:---:|:---:|:---:|:---:|:---:|---:|');
  for (const 잰것 of 잰것들) 줄.push(줄만들기(잰것));
  줄.push('');
  const 흠 = 잰것들.flatMap((r) => 흠찾기(r));
  if (흠.length) {
    줄.push('```');
    for (const h of 흠) 줄.push(h);
    줄.push('```');
  } else {
    줄.push('✅ 이 표에서 손볼 곳 없음');
  }
  줄.push('⛔ 「?」는 0 이 아니다. 못 잰 것이다.');
  return 줄.join('\n');
}

export function 흠찾기(잰것) {
  const 흠 = [];
  if (잰것.라이브 === false) 흠.push(`🔴 ${잰것.자리} — 라이브가 안 선다`);
  if (잰것.한글수 === 0) 흠.push(`🔴 ${잰것.자리} — 지면에 한글 이름이 **0곳**. 한국 손님이 못 찾는다`);
  if (잰것.제목설명 === false) 흠.push(`🔴 ${잰것.자리} — title 에 **무엇을 파는지가 없다**: 「${잰것.제목}」`);
  if (잰것.매니페스트 === false) 흠.push(`⚠ ${잰것.자리} — manifest 없음. 홈화면이 회색 글자 타일이 된다`);
  if (잰것.터치아이콘 === false) 흠.push(`⚠ ${잰것.자리} — apple-touch-icon 없음`);
  return 흠;
}

async function 받기(주소) {
  try {
    const r = await fetch(주소, { redirect: 'follow' });
    return { 코드: r.status, 글: await r.text() };
  } catch {
    return { 코드: null, 글: null };            // ⛔ 못 잰 것이다. 0 이 아니다
  }
}

export async function 한자리재기(자리표) {
  const 첫화면 = await 받기(자리표.주소 + '/');
  const ads = await 받기(자리표.주소 + '/ads.txt');
  const 사이트맵 = await 받기(자리표.주소 + '/sitemap.xml');
  const 글 = 첫화면.글;
  return {
    자리: 자리표.자리,
    라이브: 첫화면.코드 === null ? null : 첫화면.코드 === 200,
    한글수: 낱말세기(글, 자리표.한글),
    제목설명: 제목에설명있나(글),
    제목: 제목뽑기(글),
    매니페스트: 있나(글, /rel="manifest"/i),
    터치아이콘: 있나(글, /rel="apple-touch-icon"/i),
    adstxt: ads.코드 === null ? null : ads.코드 === 200,
    사이트맵수: 사이트맵.글 == null ? null : (사이트맵.글.match(/<loc>/g) || []).length,
  };
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 자가 = (이름, 참인가) => { if (참인가) 통과++; else { 실패++; console.error(`  ✗ ${이름}`); } };

  자가('못 잰 글은 null', 낱말세기(null, '백년지도') === null);
  자가('없으면 0', 낱말세기('<p>hello</p>', '백년지도') === 0);
  자가('세 번 나오면 3', 낱말세기('백년지도 a 백년지도 b 백년지도', '백년지도') === 3);
  자가('⛔ 못 잼과 0 을 가른다', 낱말세기(null, 'x') !== 0);

  자가('한 낱말 제목은 설명 없음', 제목에설명있나('<title>SeoulMarkets</title>') === false);
  자가('구분자가 있으면 설명 있음', 제목에설명있나('<title>대학 다음까지 보는 진로 지도 — 백년지도</title>') === true);
  자가('막대기도 구분자다', 제목에설명있나('<title>Korean pop culture, in numbers | K Culture Wire</title>') === true);
  자가('낱말 셋이면 설명 있음', 제목에설명있나('<title>Korea Wage Panel Data</title>') === true);
  자가('title 이 없으면 false', 제목에설명있나('<html></html>') === false);
  자가('못 잰 글은 null', 제목에설명있나(null) === null);

  자가('참은 ☑', 글자(true) === '☑');
  자가('거짓은 ☐', 글자(false) === '☐');
  자가('null 은 ?', 글자(null) === '?');
  자가('⛔ null 을 ☐ 로 만들지 않는다', 글자(null) !== '☐');

  const 성한것 = { 자리: 'X', 라이브: true, 한글수: 3, 제목설명: true, 제목: 'a — b',
                  매니페스트: true, 터치아이콘: true, adstxt: true, 사이트맵수: 10 };
  자가('성하면 흠이 없다', 흠찾기(성한것).length === 0);
  자가('성한 줄에 ☑ 가 있다', 줄만들기(성한것).includes('☑'));

  const 한글0 = { ...성한것, 한글수: 0 };
  자가('한글 0곳을 빨강으로 잡는다', 흠찾기(한글0).some((h) => h.includes('0곳')));
  자가('한글 0곳은 줄에 「0곳」으로 찍힌다', 줄만들기(한글0).includes('**0곳**'));

  const 제목한낱말 = { ...성한것, 제목설명: false, 제목: 'SeoulMarkets' };
  자가('한 낱말 title 을 빨강으로 잡고 제목을 보여 준다',
       흠찾기(제목한낱말).some((h) => h.includes('SeoulMarkets')));

  const 못잼 = { 자리: 'Y', 라이브: null, 한글수: null, 제목설명: null, 제목: null,
                매니페스트: null, 터치아이콘: null, adstxt: null, 사이트맵수: null };
  자가('⛔ 못 잰 자리는 흠으로 안 센다', 흠찾기(못잼).length === 0);
  자가('못 잰 줄은 ? 로 찍힌다', 줄만들기(못잼).includes('?'));

  const 표 = 표그리기([성한것], '2026-08-09');
  자가('표에 날짜가 있다', 표.includes('2026-08-09'));
  자가('흠이 없으면 그렇게 말한다', 표.includes('손볼 곳 없음'));
  자가('흠이 있으면 적는다', 표그리기([한글0], '2026-08-09').includes('0곳'));

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const 오늘 = new Date().toLocaleDateString('sv-SE');   // ⛔ toISOString 안 쓴다
  const 잰것들 = [];
  for (const 자리표 of 자리들) 잰것들.push(await 한자리재기(자리표));
  console.log(표그리기(잰것들, 오늘));
  const 빨강 = 잰것들.flatMap(흠찾기).filter((h) => h.startsWith('🔴')).length;
  process.exit(빨강 > 0 ? 1 : 0);
}
