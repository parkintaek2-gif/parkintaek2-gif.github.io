#!/usr/bin/env node
/**
 * check-제목에-수가-있나.mjs — **검색 결과에 뜨는 제목에 «수»가 들어 있나.**
 *
 * 🔴 왜 — 2026-10-03 실측. 백년지도가 28일 동안 노출 807 · 평균 6위인데 클릭이 **0** 이었다.
 *    가장 많이 뜬 지면(/university, 노출 46)의 제목이 「대학 찾기」 넉 자뿐이었다.
 *    옆의 두 지면은 제목에 수가 들어 있었다 —
 *      「결혼 적령기, 평균 초혼 연령·30대 미혼 비율 67.4% …」
 *      「40대 평균 지출 … 소비지출 384.7만원 …」
 *    ⇒ 우리 방식은 «수로 말하는 것»이다. 그런데 제목에서 그 수를 빼면
 *      검색 결과에서 우리 지면은 옆의 백과사전과 구별되지 않는다.
 *
 * ⛔ 수를 지어내서 넣으라는 말이 아니다. **그 지면이 이미 쥔 수**를 제목에 올리라는 말이다.
 * ⛔ 수가 없는 지면도 있다(안내·목록). 그런 곳까지 억지로 넣지 않는다 — 이 도구는 «알린다».
 *
 * 쓰는 법
 *   node scripts/check-제목에-수가-있나.mjs --자가시험
 *   node scripts/check-제목에-수가-있나.mjs dist/100y        (빌드한 것을 잰다)
 */
import fs from 'node:fs';
import path from 'node:path';

/** 제목에 「수」가 들어 있나 — 연도만 있는 것은 수로 치지 않는다 */
export function 수가있나(제목) {
  const t = String(제목 ?? '');
  /* 사이트 이름 꼬리(「 — 백년지도」)는 떼고 본다 */
  const 몸 = t.replace(/\s*[—|·]\s*(백년지도|SMarkets|KLifeMap[^|]*|K Culture Wire)\s*$/u, '');
  const 수들 = 몸.match(/\d[\d,.]*/g) || [];
  /* 「2026년」처럼 연도 하나뿐이면 그것은 «무엇을 쟀는지»를 말해 주지 않는다 */
  const 연도만 = 수들.every((n) => /^(19|20)\d{2}$/.test(n.replace(/[,.]/g, '')));
  if (!수들.length) return false;
  return !연도만;
}

/** HTML 에서 <title> 을 꺼낸다 */
export function 제목뽑기(글) {
  const m = String(글 ?? '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

/* ── 자가시험 ────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 짝 = [];
  const 본다 = (이름, 실제, 바람) => 짝.push([이름, JSON.stringify(실제) === JSON.stringify(바람), 실제, 바람]);

  본다('수가 없으면 거짓', 수가있나('대학 찾기 — 백년지도'), false);
  본다('수가 있으면 참', 수가있나('전국 대학 377곳 취업률·중도탈락률 — 대학 찾기 — 백년지도'), true);
  본다('소수점도 수로 본다', 수가있나('소비지출 384.7만원 — 백년지도'), true);
  본다('쉼표 붙은 수도 본다', 수가있나('상장사 2,431곳 — 백년지도'), true);
  본다('⛔ 연도만 있으면 수로 안 친다', 수가있나('2026년 대학 찾기 — 백년지도'), false);
  본다('연도와 수가 같이 있으면 참', 수가있나('2026년 대학 377곳 — 백년지도'), true);
  본다('빈 제목은 거짓', 수가있나(''), false);
  본다('제목을 뽑는다', 제목뽑기('<html><title>가 나</title></html>'), '가 나');
  본다('제목이 없으면 null', 제목뽑기('<html></html>'), null);

  let 깨짐 = 0;
  for (const [이름, 맞나, 실제, 바람] of 짝) {
    console.log((맞나 ? '✅' : '🔴') + ' ' + 이름 + (맞나 ? '' : ` — 나온 값 ${JSON.stringify(실제)} / 바란 값 ${JSON.stringify(바람)}`));
    if (!맞나) 깨짐 += 1;
  }
  console.log(`\n자가시험 ${짝.length}개 · 깨진 것 ${깨짐}개`);
  process.exit(깨짐 ? 1 : 0);
}

/* ── 실제로 재기 ─────────────────────────────────────────── */
const 폴더들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!폴더들.length) {
  console.log('쓰는 법: node scripts/check-제목에-수가-있나.mjs <빌드폴더>  ·  --자가시험');
  process.exit(1);
}

let 센것 = 0; const 없는것 = [];
function 훑기(뿌리) {
  const 쌓임 = [뿌리];
  while (쌓임.length) {
    const 여기 = 쌓임.pop();
    let 목록;
    try { 목록 = fs.readdirSync(여기, { withFileTypes: true }); } catch { continue; }
    for (const 것 of 목록) {
      const 길 = path.join(여기, 것.name);
      if (것.isDirectory()) { 쌓임.push(길); continue; }
      if (!/\.html?$/i.test(것.name)) continue;
      let 글; try { 글 = fs.readFileSync(길, 'utf8'); } catch { continue; }
      const 제목 = 제목뽑기(글);
      if (!제목) continue;
      센것 += 1;
      if (!수가있나(제목)) 없는것.push({ 길, 제목 });
    }
  }
}
for (const f of 폴더들) 훑기(f);

없는것.sort((a, b) => a.제목.length - b.제목.length);
console.log('■ 제목에 수가 없는 지면 — 짧은 것부터 (고치면 가장 크게 바뀌는 자리)\n');
for (const x of 없는것.slice(0, 40)) {
  console.log('  ' + String(x.제목.length).padStart(3) + '자  ' + x.제목.slice(0, 80));
  console.log('        ' + x.길.replace(/^.*?dist[\\/]/, 'dist/'));
}
const 비율 = 센것 ? (없는것.length / 센것) * 100 : 0;
console.log(`\n■ 지면 ${센것}장 · 제목에 수가 없는 것 ${없는것.length}장 (${비율.toFixed(0)}%)`);
if (!없는것.length) console.log('✅ 모든 제목이 수를 들고 있다');
