/**
 * build-100y-star-birth.mjs — 스타의 «공개된» 생년월일을 출처와 함께 모은다
 *
 * 🔴 왜 이렇게 캐나 — 2번 지시(8/20): *「생년월일이 공개된 것만 쓰고, 출처를 지면에
 *   적으십시오. 없으면 그 사람은 뺍니다」*. 그래서 **사람이 손으로 적지 않는다.**
 *   위키데이터에서 캐면 ① 누구의 것인지(Q번호) ② 어디에 적혀 있는지가 함께 남는다.
 *
 * ⛔ 이 자는 사주를 세우지 않는다. **생년월일만** 가져온다.
 * ⛔ 사람(P31=Q5)이 아닌 것은 뺀다 — 그룹(뉴진스·블랙핑크…)은 생일이 없다.
 * ⛔ P569 가 없으면 그 사람은 뺀다. 「아마 이 날일 것」을 쓰지 않는다.
 *
 * 쓰는 법  node scripts/build-100y-star-birth.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 일주 } from './lib/일주.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼곳 = path.join(ROOT, 'src/data/100yearmap/star-birth.json');

/** 오늘 자동완성으로 실재를 잰 사람들 — 「(이름) 사주」가 실제로 뜨는 이름만 넣는다 */
export const 찾을이름 = [
  '아이유', '정국', '카리나', '임영웅', '차은우',
  '장원영', '제니', '손흥민', '유재석', '김연아',
];

const 사람 = 'Q5', 대한민국 = 'Q884';

/* 🔴 8/20 — 처음 판은 «막힌 것»을 「생년월일이 없다」로 적었다. **자가 거짓말을 했다.**
   위키데이터가 빠른 조회를 막자 후보가 0으로 돌아왔는데, 그것을 「자료에 없다」로 옮겼다.
   ⇒ ① 사이를 두고 묻는다 ② 막히면 되묻는다 ③ 그래도 안 되면 「못 물었다」로 적는다.
   「없다」는 물어서 확인한 것만 말한다. */
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));
const 머리말 = { 'User-Agent': '100yearmap.com data collection (contact: parkintaek2@gmail.com)' };

async function 참을성있게(u, 몇번 = 4) {
  for (let i = 0; i < 몇번; i++) {
    try {
      const r = await fetch(u, { headers: 머리말 });
      if (r.ok) return await r.json();
      if (r.status !== 429 && r.status < 500) return null;   // 진짜로 없는 것
    } catch { /* 그물이 끊긴 것 — 되묻는다 */ }
    await 쉼(1200 * (i + 1));
  }
  return undefined;                                           // ⛔ 「없다」가 아니라 «못 물었다»
}

async function 위키데이터찾기(이름) {
  const j = await 참을성있게('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=ko&uselang=ko&limit=8&search=' + encodeURIComponent(이름));
  if (j === undefined) return undefined;                      // 못 물었다
  return j?.search || [];
}
async function 알맹이(qid) {
  const j = await 참을성있게(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  if (!j) return null;
  return j.entities?.[qid] || null;
}
const 값들 = (e, p) => (e.claims?.[p] || []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);

const 낸다 = [];
const 뺀다 = [];
for (const 이름 of 찾을이름) {
  const 후보 = await 위키데이터찾기(이름);
  if (후보 === undefined) {                                    // ⛔ 못 물었다 ≠ 없다
    뺀다.push({ 이름, 까닭: '못 물었다 — 위키데이터가 답하지 않았다', 후보수: null });
    console.log('⬜', 이름, '못 물었다');
    continue;
  }
  let 고름 = null;
  for (const c of 후보.slice(0, 6)) {
    await 쉼(250);                                             // 사이를 둔다 — 막히지 않게
    const e = await 알맹이(c.id);
    if (!e) continue;
    const 종류 = 값들(e, 'P31').map((v) => v.id);
    if (!종류.includes(사람)) continue;                       // ⛔ 사람이 아니면 뺀다
    if (!값들(e, 'P27').map((v) => v.id).includes(대한민국)) continue;
    const 생 = 값들(e, 'P569')[0];
    if (!생 || 생.precision < 11) continue;                    // ⛔ 「날」까지 없으면 뺀다
    고름 = {
      이름, qid: c.id,
      설명: c.description || '',
      생년월일: String(생.time).slice(1, 11),                  // +1993-05-16T00:00:00Z
      정밀도: 생.precision,                                    // 11 = 날까지
      출처: `위키데이터 ${c.id}`,
      출처주소: `https://www.wikidata.org/wiki/${c.id}`,
      후보수: 후보.length,
      /* ⛔ 이것은 «그 사람의 사주»가 아니라 «자료에 적힌 그 날의 일주»다 */
      그날의일주: 일주(String(생.time).slice(1, 11)),
    };
    break;
  }
  if (고름) 낸다.push(고름);
  else 뺀다.push({ 이름, 까닭: '물어봤으나 공개된 생년월일이 없었다', 후보수: 후보.length });
  console.log(고름 ? `✅ ${이름}  ${고름.생년월일}  ${고름.qid}  ${고름.설명}` : `⬜ ${이름}  뺀다`);
}

const 대장 = {
  무엇: '「(스타) 사주」 검색이 실재하는 사람들의 «공개된» 생년월일',
  잰때: new Date().toISOString().slice(0, 10),
  출처: '위키데이터(Wikidata) P569 출생일 — 항목마다 Q번호와 주소를 함께 적는다',
  '⚠': [
    '이것은 «자료에 이렇게 적혀 있다»이지, 그 사람의 사주가 «이렇다»가 아니다.',
    '태어난 시각(時)은 어느 자료에도 공개되어 있지 않다. 그래서 시주는 세울 수 없다.',
    '날짜만 있고 시각이 없으면 사주 여덟 글자 중 두 글자가 빈다.',
  ],
  물은수: 찾을이름.length,
  찾은수: 낸다.length,
  뺀수: 뺀다.length,
  /* ⛔ 「못 물었다」와 「없다」를 한 칸에 섞지 않는다 — 8/20 에 자가 섞어 놓고 거짓말을 했다 */
  못물은수: 뺀다.filter((r) => r.후보수 === null).length,
  뺀사람: 뺀다,
  사람들: 낸다,
};
fs.mkdirSync(path.dirname(낼곳), { recursive: true });
fs.writeFileSync(낼곳, JSON.stringify(대장, null, 1), 'utf8');
console.log(`\n✅ ${path.relative(ROOT, 낼곳)} — ${낸다.length}명 (뺀 사람 ${뺀다.length}명)`);
