#!/usr/bin/env node
/**
 * check-형제지면이-너무-닮았나.mjs — **틀만 같고 알맹이가 적으면 구글이 안 넣는다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 사장님: 「seo, geo, 색인 **대체 내가 그렇게 강조했는데**」
 *         「**유입량을 지금의 천배, 만배로**」
 *
 * 구글에 직접 물으니 KLifeMap 지면은 「**발견됨 - 현재 색인이 생성되지 않음**」이고
 * 「한 번도 수집 안 왔다」였다. 사이트맵도 hreflang 도 canonical 도 다 맞는데.
 * 그래서 **형제 지면끼리 얼마나 닮았는지**를 재 봤다 —
 *
 * ```
 *                          읽을 글    형제끼리 닮은 몫   구글
 * KLifeMap star 사주        2,617자        59.9%        **0장**
 * KCW born-on               4,159자        41.5%        366장 중 142장 · 1쪽
 * ```
 *
 * ⛔ **같은 틀에 이름만 바뀐 지면**으로 구글이 본 것이다. 틀이 글의 절반을 넘으면
 *   그 지면은 「새 글」이 아니라 「같은 글의 복사본」이 된다.
 * ⭐ 같은 꼴인데 KCW 쪽은 떴다 — 글이 길고(4,159자) 덜 닮았기(41.5%) 때문이다.
 *
 * ── 어떻게 재나 ────────────────────────────────────────────────────────
 * 글을 다섯 글자 덩이로 쪼개 **겹치는 몫**을 센다. 짧은 쪽을 분모로 삼는다 —
 * 한쪽이 길다고 닮은 몫이 낮아지면 안 되기 때문이다.
 *
 * ⛔ 이 자는 «판정하지 않는다». 못 잰 것을 0 으로 적지 않는다.
 * ⛔ 「닮았으니 지워라」가 아니다 — **그 사람·그 날만의 사실을 더 넣어라**는 뜻이다.
 *
 * 쓰는 법
 *   node scripts/check-형제지면이-너무-닮았나.mjs
 *   node scripts/check-형제지면이-너무-닮았나.mjs <주소1> <주소2>
 *   node scripts/check-형제지면이-너무-닮았나.mjs --자가시험
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** 🔴 이 선을 넘으면 구글이 「같은 글」로 본다. KCW 41.5% 는 떴고 KLifeMap 59.9% 는 안 떴다 */
export const 닮음선 = 0.50;
/** 읽을 글이 이보다 짧으면 틀이 글을 덮는다 */
export const 짧은선 = 3000;

/** 재 볼 짝 — 같은 틀에서 나온 형제 둘씩 */
export const 재볼짝 = [
  { 이름: 'KLifeMap 스타 사주(ko)', 둘: ['https://klifemap.ai/content/star-q56505060-saju',
                                      'https://klifemap.ai/content/star-q55694544-saju'] },
  { 이름: 'KLifeMap 스타 사주(en)', 둘: ['https://klifemap.ai/content/star-q56505060-saju-en',
                                      'https://klifemap.ai/content/star-q55694544-saju-en'] },
  { 이름: 'KCW 생일(born-on)', 둘: ['https://www.kculturewire.com/born-on/02-08',
                                   'https://www.kculturewire.com/born-on/09-20'] },
  { 이름: 'KCW 그룹', 둘: ['https://www.kculturewire.com/group/illit',
                          'https://www.kculturewire.com/group/izna'] },
  { 이름: '백년지도 학교', 둘: ['https://100yearmap.com/school/7011540',
                             'https://100yearmap.com/school/7530660'] },
];

/** 화면에 나가는 글만 — script·style·표는 걷는다 */
export function 글만(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 다섯 글자 덩이 — 두 글자씩 건너뛰며 만든다(너무 잘게 쪼개면 아무 글이나 닮는다) */
export function 덩이들(글) {
  const s = String(글 ?? '');
  const t = new Set();
  for (let i = 0; i + 5 <= s.length; i += 2) t.add(s.slice(i, i + 5));
  return t;
}

/**
 * 둘이 얼마나 닮았나. 짧은 쪽을 분모로 삼는다.
 * ⛔ 둘 중 하나라도 빈 글이면 null — 0 이 아니다
 */
export function 닮은몫(가, 나) {
  const A = 덩이들(가); const B = 덩이들(나);
  if (!A.size || !B.size) return null;
  let 겹 = 0;
  for (const x of A) if (B.has(x)) 겹 += 1;
  return 겹 / Math.min(A.size, B.size);
}

/** 막아야 하나 — 너무 닮았거나 너무 짧으면 */
export function 막나({ 닮음, 글자 }, 선 = 닮음선, 짧 = 짧은선) {
  if (typeof 닮음 !== 'number' || !Number.isFinite(닮음)) return null;
  if (typeof 글자 !== 'number' || !Number.isFinite(글자)) return null;
  return 닮음 > 선 || 글자 < 짧;
}

function 받기(u) {
  try { return execFileSync('curl', ['-sS', '--max-time', '20', '-A',
    'Mozilla/5.0 (compatible; klifedesign-check)', u], { encoding: 'utf8' }); }
  catch { return null; }
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const T = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  T('🔴 표를 걷고 글만 남긴다', 글만('<p>가나다</p><script>x</script>') === '가나다');
  T('⛔ 주석도 걷는다', 글만('<!-- 숨은글 -->보이는글') === '보이는글');
  T('⛔ 빈 것에도 안 터진다', 글만('') === '' && 글만(null) === '');

  T('덩이를 만든다', 덩이들('가나다라마바사').size > 0);
  T('⛔ 다섯 글자보다 짧으면 덩이가 없다', 덩이들('가나').size === 0);

  const 같은글 = '가나다라마바사아자차카타파하';
  T('🔴 똑같으면 1 에 가깝다', 닮은몫(같은글, 같은글) === 1);
  T('🔴 전혀 다르면 0 에 가깝다', 닮은몫('가나다라마바사아자차', 'ABCDEFGHIJ') === 0);
  T('⛔ 빈 글이면 null — 0 이 아니다',
    닮은몫('', '가나다라마') === null && 닮은몫(null, null) === null);
  T('짧은 쪽을 분모로 삼는다 — 한쪽이 길다고 낮아지지 않는다',
    닮은몫('가나다라마바사', '가나다라마바사' + 'X'.repeat(200)) > 0.9);

  T('🔴 너무 닮으면 막는다', 막나({ 닮음: 0.6, 글자: 5000 }) === true);
  T('🔴 너무 짧아도 막는다', 막나({ 닮음: 0.2, 글자: 1000 }) === true);
  T('둘 다 괜찮으면 안 막는다', 막나({ 닮음: 0.41, 글자: 4159 }) === false);
  T('⛔ 선 위에 딱 걸치면 안 막는다', 막나({ 닮음: 0.50, 글자: 3000 }) === false);
  T('⛔ 못 잰 것은 null — 막지 않는다',
    막나({ 닮음: null, 글자: 5000 }) === null && 막나({ 닮음: 0.2, 글자: null }) === null);

  T('재 볼 짝에 네 사이트가 섞여 있다', 재볼짝.length >= 4);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 형제 지면이 너무 닮았나 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/** 짝 하나를 잰다. ⛔ 못 받으면 null */
export function 짝재기(u1, u2) {
  const a = 받기(u1); const b = 받기(u2);
  if (!a || !b) return null;
  const A = 글만(a); const B = 글만(b);
  const m = 닮은몫(A, B);
  if (m === null) return null;
  return { 닮음: m, 글자: Math.min(A.length, B.length) };
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--selftest') || 인자.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }

  const 준주소 = 인자.filter((a) => a.startsWith('http'));
  const 볼것 = 준주소.length >= 2
    ? [{ 이름: '준 짝', 둘: [준주소[0], 준주소[1]] }]
    : 재볼짝;

  console.log('■ 형제 지면이 너무 닮았나');
  console.log(`   선 — 닮은 몫 ${(닮음선 * 100).toFixed(0)}% 넘거나 읽을 글 ${짧은선}자 미만이면 막는다`);
  console.log('   ⭐ 실측 — KCW born-on 41.5%·4,159자는 1쪽에 떴고,');
  console.log('      KLifeMap star 59.9%·2,617자는 「발견됨-색인 안함」이었다.\n');

  const 막힌것 = []; const 못잰것 = [];
  for (const { 이름, 둘 } of 볼것) {
    const 잰것 = 짝재기(둘[0], 둘[1]);
    if (잰것 === null) { 못잰것.push(이름); console.log(`  ⬜ ${이름.padEnd(24)} 못 쟀다`); continue; }
    const 막 = 막나(잰것);
    console.log(`  ${막 ? '🔴' : '✅'} ${이름.padEnd(24)} 닮은 몫 ${(잰것.닮음 * 100).toFixed(1)}% · 읽을 글 ${잰것.글자}자`);
    if (막) 막힌것.push(`${이름} — 닮은 몫 ${(잰것.닮음 * 100).toFixed(1)}% · ${잰것.글자}자`);
  }

  if (못잰것.length) {
    console.log(`\n  ⚠ 못 잰 것 ${못잰것.length}개 — ${못잰것.join(' · ')}`);
    console.log('     ⛔ 못 잰 것으로는 막지 않는다');
  }

  if (막힌것.length) {
    console.log('\n🔴 **구글이 「같은 글의 복사본」으로 볼 자리다.**');
    for (const x of 막힌것) console.log(`   · ${x}`);
    console.log('\n   ⭐ 고치는 길 — 지우는 것이 아니라 «그 사람·그 날만의 사실»을 더 넣는 것이다.');
    console.log('     틀이 글의 절반을 넘으면 그 지면은 새 글이 아니다.');
    process.exit(1);
  }
  console.log('\n✅ 너무 닮은 틀 없다');
}
