#!/usr/bin/env node
/**
 * check-나라입구가-회사를-다거나.mjs
 *   — **나라 입구 지면이 그 나라 회사 낱장을 «다» 거는가.**
 *
 * ── 🔴🔴 왜 (2026-10-06 18:03 · 5번) ───────────────────────────────────
 * 오늘 `check-홈에서-몇홉인가.mjs` 에 홉 «분포»를 붙이고 나서야 보였다 —
 *
 *   /company        3홉 2,521장      ← 한국 회사가 전부 3홉
 *   /japan/company  2홉 27 · 3홉 3,675장
 *   /taiwan/company 2홉 1,057장      ← 대만만 성했다
 *
 * 구글은 3홉 너머를 사실상 안 따라온다. 곧 **6,196장이 「있기는 한데 아무도 안 오는」
 * 재고**였다. 까닭은 하나뿐이다 — 나라 입구가 업종 갈래만 걸고 회사 낱장은 안 걸었다.
 * 대만 입구는 1,057장을 다 걸고 있었다. **한 사이트 안에서 꼴이 갈려 있었다.**
 *
 * ⛔ 이 병은 «조용하다». 지면은 다 있고, 사이트맵에도 다 있고, 자물쇠도 다 초록이었다.
 *   없는 것은 «링크»뿐인데 그것을 세는 자가 없었다.
 * ⇒ 세는 자를 둔다. 글로 적어 둔 규칙은 잊힌다.
 *
 * ⛔ 「사이트맵에 넣었다」를 「구글이 온다」로 세지 않는다.
 * ⛔ 못 읽은 지면을 「0장 걸었다」로 세지 않는다 — 셋째 칸(«못 쟀다»)에 둔다.
 *
 * 쓰기
 *   node scripts/check-나라입구가-회사를-다거나.mjs
 *   node scripts/check-나라입구가-회사를-다거나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 밑 = path.join(뿌리, 'dist');

/**
 * 나라마다 — 입구 지면과 회사 낱장이 쌓이는 곳.
 * ⚠ 입구는 두 꼴로 나올 수 있다(`x/index.html` · `x.html`). 둘 다 본다.
 */
export const 나라들 = [
  { 이름: 'korea', 입구: 'companies', 낱장방: 'company', 앞가지: '/company/' },
  { 이름: 'japan', 입구: 'japan/companies', 낱장방: 'japan/company', 앞가지: '/japan/company/' },
  { 이름: 'taiwan', 입구: 'taiwan/companies', 낱장방: 'taiwan/company', 앞가지: '/taiwan/company/' },
  { 이름: 'uae', 입구: 'uae/companies', 낱장방: 'uae/company', 앞가지: '/uae/company/' },
];

/** 입구가 될 수 있는 파일 꼴. ⛔ 한 꼴만 보고 「없다」로 적지 않는다 */
export function 입구후보(입구) {
  const b = String(입구 ?? '').replace(/^\/+/, '').replace(/\/+$/, '');
  if (!b) return ['index.html'];
  return [`${b}/index.html`, `${b}.html`];
}

/** 글에서 그 앞가지로 가는 낱장 주소를 모은다. ⛔ 같은 주소를 두 번 세지 않는다 */
export function 건낱장(글, 앞가지) {
  const s = String(글 ?? '');
  const p = String(앞가지 ?? '');
  if (!s || !p) return new Set();
  const 것 = new Set();
  for (const m of s.matchAll(/href\s*=\s*"([^"]+)"/g)) {
    const h = m[1].split('#')[0].split('?')[0];
    if (!h.startsWith(p)) continue;
    const 뒤 = h.slice(p.length).replace(/\/+$/, '');
    if (!뒤) continue;                       /* 앞가지 자신은 낱장이 아니다 */
    것.add(뒤);
  }
  return 것;
}

/**
 * 판정 — 세는 칸이 셋이다.
 * ⛔ 입구를 못 읽었으면 「0장 걸었다」가 아니라 «못 쟀다»다.
 * ⛔ 낱장 방이 없으면 그것도 못 쟀다다 — 「회사가 없다」가 아니다.
 */
export function 판정(건수, 낱장수) {
  if (건수 == null || 낱장수 == null) return { 결: '못잼', 빠진: null };
  if (낱장수 === 0) return { 결: '못잼', 빠진: null };
  const 빠진 = 낱장수 - 건수;
  if (빠진 <= 0) return { 결: '맑음', 빠진: 0 };
  return { 결: '흠', 빠진 };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  본다('입구는 두 꼴을 다 본다',
    입구후보('japan/companies').join(',') === 'japan/companies/index.html,japan/companies.html');
  본다('⛔ 앞뒤 빗금에 안 속는다', 입구후보('/companies/').join(',') === 'companies/index.html,companies.html');

  본다('낱장 주소를 모은다',
    건낱장('<a href="/company/samsung">x</a><a href="/company/lg">y</a>', '/company/').size === 2);
  본다('⛔ 같은 주소를 두 번 세지 않는다',
    건낱장('<a href="/company/a">1</a><a href="/company/a/">2</a>', '/company/').size === 1);
  본다('⛔ 물음표·우물정은 떼고 센다',
    건낱장('<a href="/company/a?x=1#y">1</a>', '/company/').has('a'));
  본다('⛔ 앞가지 자신은 낱장이 아니다',
    건낱장('<a href="/company/">목록</a>', '/company/').size === 0);
  본다('⛔ 남의 나라 낱장을 내 것으로 세지 않는다',
    건낱장('<a href="/japan/company/a">1</a>', '/company/').size === 0);
  본다('⛔ 빈 글이면 빈 것 — 안 터진다', 건낱장(null, '/company/').size === 0);

  본다('다 걸면 맑음', 판정(10, 10).결 === '맑음');
  본다('모자라면 흠이고 몇 장인지 센다', 판정(3, 10).결 === '흠' && 판정(3, 10).빠진 === 7);
  본다('⛔ 못 읽은 것은 「0장 걸었다」가 아니라 못잼', 판정(null, 10).결 === '못잼');
  본다('⛔ 낱장이 0장이면 「다 걸었다」가 아니라 못잼 — 빌드가 안 된 것이다',
    판정(0, 0).결 === '못잼');
  본다('⛔ 더 걸어도 흠이 아니다 — 접힌 것까지 걸 수 있다', 판정(12, 10).결 === '맑음');

  return 결과;
}

/* ── 실제로 잰다 ───────────────────────────────────────────── */
const 이파일이진입점 =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 나라 입구가 회사를 다 거나 — 자가시험');
    for (const r of 결과) {
      if (!r.참) 빨강++;
      console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
    }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  }

  if (!fs.existsSync(밑)) {
    console.log('⬜ dist 가 없다 — node scripts/build-once.mjs 를 먼저 돌린다');
    process.exit(0);
  }

  console.log('■ 나라 입구가 회사 낱장을 «다» 거나');
  console.log('   ⛔ 사이트맵에 있는 것은 셈에 안 든다 — 구글은 링크를 타고 온다\n');

  let 흠 = 0; let 못잼 = 0;
  for (const n of 나라들) {
    let 글 = null;
    for (const c of 입구후보(n.입구)) {
      try { 글 = fs.readFileSync(path.join(밑, c), 'utf8'); break; } catch (e) { /* 다음 꼴 */ }
    }
    let 낱장수 = null;
    try {
      낱장수 = fs.readdirSync(path.join(밑, n.낱장방), { withFileTypes: true })
        .filter((e) => e.isDirectory() || e.name.endsWith('.html')).length;
    } catch (e) { 낱장수 = null; }

    const 건것 = 글 == null ? null : 건낱장(글, n.앞가지).size;
    const 것 = 판정(건것, 낱장수);
    const 빛 = 것.결 === '맑음' ? '✅' : (것.결 === '못잼' ? '⬜' : '🔴');
    const 말 = 것.결 === '못잼'
      ? `못 쟀다 — ${글 == null ? '입구 지면을 못 읽었다' : '낱장 방이 비었다'}`
      : `입구가 ${건것}장 · 낱장 ${낱장수}장${것.빠진 ? `  🔴 ${것.빠진}장이 안 걸렸다` : ''}`;
    console.log(`   ${빛} ${n.이름.padEnd(8)} ${말}`);
    if (것.결 === '흠') 흠++;
    if (것.결 === '못잼') 못잼++;
  }

  console.log('');
  if (흠) {
    console.log(`   🔴 흠 ${흠}곳 — 입구에 회사 전체 목록을 더한다(3홉 → 2홉)`);
    console.log('   ⚠ 그 지면은 무거워진다. 대만은 399KB 로 돌고 있다 — 견딜 만한 값이다');
  } else {
    console.log('   ✅ 네 나라 다 입구에서 회사 낱장으로 바로 간다');
  }
  if (못잼) console.log(`   ⬜ 못 쟀다 ${못잼}곳 — 「다 걸었다」로 세지 않았다`);
  process.exit(흠 ? 1 : 0);
}
