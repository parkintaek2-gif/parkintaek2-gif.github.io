#!/usr/bin/env node
/**
 * check-지면에-빈자리가-나가나.mjs — **숫자가 들어갈 자리가 비어 나가는 것을 잡는다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 새 지면에 `{수.안겹침}` 이라고 적었는데 자료의 열쇠는 `넷플릭스에없음` 이었다.
 * Astro 는 없는 열쇠를 **조용히 빈 글자로** 그린다. 그래서 화면에 이렇게 나갔다 —
 *
 * ```
 * The other  appear in neither cast list we hold.      ← 숫자가 통째로 없다
 * ```
 *
 * ⚠ 빌드는 통과했다. 자가시험도 통과했다. **그려서 눈으로 봤기에 잡혔다.**
 *   그런데 지면이 144장이라 날마다 눈으로 다 볼 수는 없다 — 그래서 자로 둔다.
 *
 * 무엇을 잡나 — 지은 HTML 에서
 *   ① `<b></b>` 처럼 **속이 빈 강조**  (숫자를 넣으려던 자리다)
 *   ② `undefined` · `NaN` · `[object Object]` 가 화면 글에 섞인 것
 *   ③ 「The other  appear」처럼 **빈 강조 둘레에 공백이 두 칸**
 *
 * ⛔ 이 자는 «판정하지 않는다». 의심스러운 자리를 사람에게 보여 줄 뿐이다 —
 *   일부러 빈 `<b>` 를 쓰는 자리가 있을 수 있다.
 * ⛔ 주석은 걷고 본다. `public/` 은 주석도 브라우저로 가지만 사람이 읽는 글은 아니다.
 *
 * 쓰는 법
 *   node scripts/check-지면에-빈자리가-나가나.mjs            dist 전부
 *   node scripts/check-지면에-빈자리가-나가나.mjs <파일>...
 *   node scripts/check-지면에-빈자리가-나가나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 화면에 안 나가는 것을 걷는다 — 주석·script·style */
export function 화면글만(html) {
  return String(html ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

/** 속이 빈 강조. ⛔ 공백만 든 것도 빈 것이다 */
export function 빈강조찾기(html) {
  const 것 = [];
  const 글 = 화면글만(html);
  for (const 표 of [/<b>\s*<\/b>/g, /<strong>\s*<\/strong>/g, /<em>\s*<\/em>/g]) {
    for (const m of 글.matchAll(표)) {
      const 앞 = 글.slice(Math.max(0, m.index - 60), m.index).replace(/<[^>]*>/g, '').trim();
      const 뒤 = 글.slice(m.index + m[0].length, m.index + m[0].length + 60).replace(/<[^>]*>/g, '').trim();
      것.push({ 꼴: m[0], 둘레: `${앞} ⟦비었다⟧ ${뒤}`.slice(0, 110) });
    }
  }
  return 것;
}

/** 화면 글에 샌 프로그램 말 */
export function 샌말찾기(html) {
  const 글 = 화면글만(html).replace(/<[^>]*>/g, ' ');
  const 것 = [];
  /* 🔴 [2026-10-04] 처음에 null 도 넣었더니 **16장이 걸렸는데 전부 헛것**이었다 —
     「null model」·「non-null viewing fields」처럼 통계 용어로 쓴 자리다.
     ⛔ 헛것이 늘면 진짜가 묻힌다. null 은 뺀다. 빠뜨리는 쪽이 아니라 «가리는 쪽»이 더 나쁘다. */
  for (const 말 of ['undefined', 'NaN', '[object Object]']) {
    let i = 글.indexOf(말);
    while (i >= 0) {
      /* ⚠ 「nullable」 같은 보통 낱말에 안 걸리게 — 앞뒤가 글자면 건너뛴다 */
      const 앞글 = 글[i - 1] ?? ' ';
      const 뒤글 = 글[i + 말.length] ?? ' ';
      const 앞말 = 글.slice(Math.max(0, i - 24), i).toLowerCase();
      /* 🔴 [2026-10-04] 「negative or undefined」는 영어 문장이지 샌 값이 아니다.
         valuation 지면 둘이 그렇게 걸렸다. 앞에 이런 말이 오면 글로 쓴 것이다. */
      /* ⛔ 빗금 탈출이 셸을 거치며 벗겨진다 — 글자 찾기로 둔다 */
      const 글로쓴것 = ['or ', 'is ', 'be ', 'was ', 'are ', 'means ', 'value ', 'shows ']
        .some((w) => 앞말.endsWith(w));
      if (!글로쓴것 && !/[A-Za-z]/.test(앞글) && !/[A-Za-z]/.test(뒤글)) {
        것.push({ 말, 둘레: 글.slice(Math.max(0, i - 50), i + 60).replace(/\s+/g, ' ').trim() });
      }
      i = 글.indexOf(말, i + 1);
      if (것.length > 8) break;
    }
  }
  return 것;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  본다('🔴 빈 강조를 잡는다', 빈강조찾기('<p>The other <b></b> appear</p>').length === 1);
  본다('공백만 든 것도 빈 것이다', 빈강조찾기('<p><b>  </b></p>').length === 1);
  본다('strong·em 도 본다',
    빈강조찾기('<strong></strong><em></em>').length === 2);
  본다('⛔ 속이 찬 것은 안 잡는다', 빈강조찾기('<b>281</b>').length === 0);
  본다('⛔ 주석 안은 안 본다', 빈강조찾기('<!-- <b></b> -->').length === 0);
  본다('⛔ script 안도 안 본다', 빈강조찾기('<script><b></b></script>').length === 0);
  본다('둘레를 보여 준다', 빈강조찾기('<p>The other <b></b> appear</p>')[0].둘레.includes('비었다'));
  본다('⛔ 빈 글·null 에도 안 터진다',
    빈강조찾기('').length === 0 && 빈강조찾기(null).length === 0);

  본다('🔴 undefined 가 샌 것을 잡는다', 샌말찾기('<p>값 undefined 입니다</p>').length === 1);
  본다('NaN 도 잡는다', 샌말찾기('<p>NaN %</p>').length === 1);
  본다('⛔ 낱말 안에 든 것은 안 잡는다 — nullable 은 보통 말이다',
    샌말찾기('<p>nullable field</p>').length === 0);
  본다('⛔ 주석 안은 안 본다', 샌말찾기('<!-- undefined -->').length === 0);
  본다('⛔ 빈 글·null 에도 안 터진다',
    샌말찾기('').length === 0 && 샌말찾기(null).length === 0);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 지면에 빈자리가 나가나 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const 준것 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const 것들 = [];
  if (준것.length) 것들.push(...준것);
  else {
    const 밑 = path.join(뿌리, 'dist');
    if (!fs.existsSync(밑)) { console.log('⛔ dist 가 없다 — 먼저 node scripts/build-once.mjs'); process.exit(1); }
    const 훑기 = (d) => {
      for (const 이름 of fs.readdirSync(d)) {
        const p = path.join(d, 이름);
        if (fs.statSync(p).isDirectory()) 훑기(p);
        else if (이름.endsWith('.html')) 것들.push(p);
      }
    };
    훑기(밑);
  }

  let 걸린장 = 0; let 걸린수 = 0;
  for (const p of 것들) {
    const html = fs.readFileSync(p, 'utf8');
    const 빈것 = 빈강조찾기(html);
    const 샌것 = 샌말찾기(html);
    if (!빈것.length && !샌것.length) continue;
    걸린장 += 1; 걸린수 += 빈것.length + 샌것.length;
    console.log(`\n  ⚠ ${path.relative(뿌리, p)}`);
    for (const x of 빈것.slice(0, 3)) console.log(`     빈 강조 — ${x.둘레}`);
    for (const x of 샌것.slice(0, 3)) console.log(`     「${x.말}」이 샜다 — ${x.둘레}`);
  }
  console.log(`\n■ 지면 ${것들.length}장 · 걸린 장 ${걸린장}장 · 자리 ${걸린수}곳`);
  if (걸린수) {
    console.log('   ⛔ 이 자는 단정하지 않는다 — 열어 보고 사람이 정한다.');
    console.log('   ⭐ 보는 법 — 그 자리에 «숫자를 넣으려던 것»인가. 그러면 자료의 열쇠 이름이 틀렸다.');
  } else {
    console.log('   ✅ 숫자가 빠진 자리도, 샌 프로그램 말도 없다');
  }
}
