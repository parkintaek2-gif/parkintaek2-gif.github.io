#!/usr/bin/env node
/**
 * 네이버에-우리가-있나.mjs — **네이버 검색에 우리 지면이 걸리는지 로그인 없이 잰다.**
 *
 * ── 🔴 왜 (2026-10-05 21:1x · 5번) ───────────────────────────────────
 *   28일 바깥 유입 553명을 사이트별로 가르니 이랬다 —
 *   ```
 *   100yearmap.com   네이버 모바일 135명 + 네이버 33명 = 168명
 *   klifemap.ai      네이버 모바일 8명 + 네이버 4명 = 12명
 *   ```
 *   ⭐ **같은 회사, 같은 한국어 사이트인데 열네 배 차이가 난다.**
 *     100yearmap 이 받는 것은 `school/…` 같은 **개체 지면**이다.
 *
 *   🔴 그런데 KLifeMap 에도 개체 지면이 **이미 61장 있었다** — `/ilju/` 60갑자다.
 *     제목도 「갑자일주 — 甲子 뜻과 지장간·십성」으로 손님이 치는 말이고
 *     지면도 17KB 로 얇지 않다. **그런데 유입이 0이다.**
 *
 *   ⇒ 그러니 「개체 지면을 만들면 된다」로는 모자란다. **네이버가 오고 있나**를
 *     먼저 재야 한다. 안 오고 있다면 띠 12장을 더 내도 같은 자리에 선다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────
 *   네이버가 막으면 「없다」가 아니라 **「못 쟀다」**로 적는다.
 *   ⚠ 검색 결과가 0인 것과 검색을 못 한 것은 다르다. 섞으면 잘못된 처방이 나온다.
 *
 * 쓰는 법
 *   node scripts/네이버에-우리가-있나.mjs
 *   node scripts/네이버에-우리가-있나.mjs --자가시험
 */

const 볼것 = [
  { 말: '갑자일주', 집: 'klifemap.ai', 왜: '일주 지면 61장이 이 말을 겨눈다' },
  { 말: '오늘의 운세', 집: 'klifemap.ai', 왜: '사장님 최우선 키워드 (월 518만)' },
  { 말: '오늘 띠별 운세', 집: 'klifemap.ai', 왜: '사장님 최우선 키워드 (월 5.3만)' },
  { 말: '만세력', 집: 'klifemap.ai', 왜: '지금 유일하게 도는 지면' },
  { 말: '토정비결', 집: 'klifemap.ai', 왜: '사장님이 만들라 하신 것' },
  { 말: '고령자 통계', 집: '100yearmap.com', 왜: '네이버가 168명을 보내는 사이트 — 견줌' },
];

/** 검색 결과 글에서 그 집이 보이나.
 *  ⛔ 못 받아 왔으면 false 가 아니라 null 이다. */
export function 보이나(글, 집) {
  if (글 === null || 글 === undefined) return null;
  if (typeof 글 !== 'string' || 글.length < 500) return null;   /* 너무 짧으면 막힌 것이다 */
  return 글.includes(집);
}

export function 판정(결과들) {
  const 잰것 = 결과들.filter((r) => r.보임 !== null);
  if (!잰것.length) return { 빛: '⬜', 말: '하나도 못 쟀다 — 네이버가 막았다' };
  const 걸린수 = 잰것.filter((r) => r.보임).length;
  if (걸린수 === 0) {
    return { 빛: '🔴', 말: `잰 ${잰것.length}개 말 모두 네이버에 우리가 없다` };
  }
  return { 빛: '✅', 말: `${잰것.length}개 중 ${걸린수}개에 우리가 걸린다` };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 깨짐 = 0;
  const 본다 = (말, 참) => { console.log((참 ? '  ✅ ' : '  🔴 ') + 말); if (!참) 깨짐++; };

  const 긴글 = 'x'.repeat(600);
  본다('1. 못 받아 오면 null 이다 — false 로 적지 않는다', 보이나(null, 'a') === null);
  본다('2. undefined 도 null 이다', 보이나(undefined, 'a') === null);
  본다('3. 글이 아니면 null 이다', 보이나(123, 'a') === null);
  본다('4. 너무 짧은 답은 null 이다 — 막힌 것이다', 보이나('짧다', 'a') === null);
  본다('5. 긴 글에 집이 있으면 true', 보이나(긴글 + 'klifemap.ai', 'klifemap.ai') === true);
  본다('6. 긴 글에 집이 없으면 false', 보이나(긴글, 'klifemap.ai') === false);
  본다('7. 다 못 쟀으면 ⬜ 다',
    판정([{ 보임: null }, { 보임: null }]).빛 === '⬜');
  본다('8. 잰 것이 다 없으면 🔴 다',
    판정([{ 보임: false }, { 보임: false }]).빛 === '🔴');
  본다('9. 하나라도 걸리면 ✅ 다',
    판정([{ 보임: false }, { 보임: true }]).빛 === '✅');
  본다('10. 못 잰 것을 「없다」로 세지 않는다',
    판정([{ 보임: null }, { 보임: true }]).말.includes('1개 중 1개'));
  본다('11. 볼 것이 여섯이고 견줌 사이트가 끼어 있다',
    볼것.length === 6 && 볼것.some((v) => v.집 === '100yearmap.com'));
  본다('12. 볼 것마다 «왜» 보는지 적혀 있다', 볼것.every((v) => v.왜 && v.왜.length > 4));

  console.log(`\n  깨짐 ${깨짐}`);
  process.exit(깨짐 ? 1 : 0);
}

/* ── 실제로 잰다 ───────────────────────────────────────────────────── */
const 머리 = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/129.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

async function 검색한다(말) {
  const u = 'https://search.naver.com/search.naver?where=web&query=' + encodeURIComponent(말);
  try {
    const r = await fetch(u, { headers: 머리, redirect: 'follow' });
    if (!r.ok) return null;
    return await r.text();
  } catch (e) { return null; }
}

console.log('■ 네이버 검색에 우리가 걸리나 — 로그인 없이 잰 것');
console.log('   ⚠ 막히면 「없다」가 아니라 「못 쟀다」로 적는다\n');

const 결과들 = [];
for (const v of 볼것) {
  const 글 = await 검색한다(v.말);
  const 보임 = 보이나(글, v.집);
  결과들.push({ ...v, 보임 });
  const 빛 = 보임 === null ? '⬜ 못 쟀다' : (보임 ? '✅ 걸린다 ' : '🔴 안 걸린다');
  console.log(`   ${빛}   「${v.말}」 → ${v.집}`);
  console.log(`              ${v.왜}`);
  await new Promise((r) => setTimeout(r, 1200));   /* 너무 빨리 묻지 않는다 */
}

const 판 = 판정(결과들);
console.log(`\n   ${판.빛} ${판.말}`);

const 못잰수 = 결과들.filter((r) => r.보임 === null).length;
if (못잰수) {
  console.log(`   ⬜ ${못잰수}개는 못 쟀다 — 네이버가 글을 안 줬다. 브라우저로 다시 봐야 한다`);
}

console.log('\n⭐ 100yearmap 은 걸리는데 klifemap 이 안 걸리면, 지면을 더 내는 것이');
console.log('   아니라 «네이버가 오게 하는 것»이 먼저다 — 서치어드바이저 등록을 본다');
