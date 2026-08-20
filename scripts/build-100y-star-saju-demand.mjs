/**
 * build-100y-star-saju-demand.mjs — 「(스타 이름) 사주」가 자동완성에 실재하는가를 «잰다»
 *
 * 🔴 왜 자료로 남기나 — 2번 지시(8/20): *「제목에 넣은 스타 이름이 자동완성에 실재하는가 —
 *   **몇 명 중 몇 명**으로 적는다」*. 그 수를 지면에 **손으로 박으면** 다음 사람이 다시 못 잰다.
 *   ⇒ 잰 날·잰 곳·이름별 결과까지 통째로 파일에 남긴다. 지면은 이 파일에서 읽는다.
 *
 * ⚠ 자동완성은 **때에 따라 바뀐다.** 그래서 「잰때」를 반드시 함께 적고,
 *   지면에도 「언제 잰 것인지」를 내보낸다. 「지금도 그렇다」고 쓰지 않는다.
 * ⚠ 읽기만 한다 — 공개된 자동완성 끝점을 조회할 뿐, 로그인·계정 만들기·캡차가 없다.
 * ⚠ 한글 인자를 셸(curl)로 시험하지 않는다. Node 로 한다(우리 규칙).
 *
 * 쓰는 법  node scripts/build-100y-star-saju-demand.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 낼곳 = path.join(ROOT, 'src/data/100yearmap/star-saju-demand.json');

/** ⛔ 이름을 고르는 데 내 취향을 넣지 않는다 — 사람 열, 그룹 다섯으로 갈라 둔다 */
export const 사람이름 = ['아이유', '정국', '카리나', '임영웅', '차은우', '장원영', '제니', '손흥민', '유재석', '김연아'];
export const 그룹이름 = ['뉴진스', '아이브', '블랙핑크', '방탄소년단', '트와이스'];

async function 자동완성(말) {
  const u = 'https://ac.search.naver.com/nx/ac?q=' + encodeURIComponent(말) +
    '&con=0&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100';
  const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) return null;
  const j = await r.json();
  return [...new Set((j.items || []).flat()
    .map((x) => (Array.isArray(x) ? x[0] : x)).filter((s) => typeof s === 'string'))];
}

const 잰것 = [];
for (const 이름 of [...사람이름, ...그룹이름]) {
  const 목록 = await 자동완성(`${이름} 사주`);
  if (목록 === null) { 잰것.push({ 이름, 잼: false }); console.log('⬜', 이름, '못 쟀다'); continue; }
  const 실재 = 목록.filter((s) => s.includes(이름) && s.includes('사주'));
  잰것.push({
    이름, 잼: true, 그룹인가: 그룹이름.includes(이름),
    실재: 실재.length > 0, 몇줄: 실재.length, 보기: 실재.slice(0, 3),
  });
  console.log(실재.length ? '✅' : '🔴', 이름.padEnd(6), 실재.slice(0, 2).join(' · ') || '없다');
}

const 잰수 = 잰것.filter((r) => r.잼);
const 뜬수 = 잰수.filter((r) => r.실재);
const 대장 = {
  무엇: '「(스타 이름) 사주」가 자동완성에 실재하는지 잰 것',
  잰곳: '네이버 자동완성(ac.search.naver.com) — 공개된 끝점',
  잰때: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  '⚠': [
    '자동완성은 때에 따라 바뀐다. 이 수는 «잰 그때»의 수다.',
    '이것은 «몇 사람이 검색했나»가 아니다. «그 말이 자동완성에 떠 있나»다.',
    '검색량이 아니므로 «인기»로 옮겨 적지 않는다.',
  ],
  잰명수: 잰수.length,
  실재명수: 뜬수.length,
  못잰명수: 잰것.length - 잰수.length,
  이름들: 잰것,
};
fs.mkdirSync(path.dirname(낼곳), { recursive: true });
fs.writeFileSync(낼곳, JSON.stringify(대장, null, 1), 'utf8');
console.log(`\n✅ ${path.relative(ROOT, 낼곳)} — ${잰수.length}명 중 ${뜬수.length}명 실재`);
