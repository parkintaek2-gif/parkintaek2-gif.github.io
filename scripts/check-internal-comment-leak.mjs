#!/usr/bin/env node
/**
 * check-internal-comment-leak.mjs — **손님이 받는 <script>·<style>·<!-- --> 안에
 * 우리끼리 하는 말이 실려 나가는지** 잡는다.
 *
 * ── 왜 만들었나 (2026-09-18 · 6번) ──────────────────────────────────
 * 5번이 klifemap 에서 같은 병을 잡고 전 유닛에 재 보라 했다 —
 *   curl https://klifemap.ai/saju | grep 사장님   →  3건
 * SeoulMarkets 를 재 보니 `src/pages/data/index.astro` 의 결제창 인라인 스크립트에
 * 「사장님: 「...」」 인용과 [날짜 · 유닛번호] 결정 이력 주석이 그대로 있었다 —
 * 손님이 view-source 를 열거나 AI 크롤러가 읽으면 그대로 보인다.
 *
 * ⭐ `check-seoulmarkets-korean-leak.mjs` 는 이 결함을 못 잡는다 — 그 자는 **손님이
 *   읽는 본문**(태그를 벗긴 보이는 글)만 본다. `<script>`·`<style>` 은 애초에 그 자의
 *   관심사가 아니다(태그째 걷어 낸다). 그 자의 규칙을 넓히지 않는다 — 관심사가 다르면
 *   자도 다르게 둔다(그 파일 자신의 원칙).
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────
 * `src/**‍/*.astro`(wikitip·100y 제외 — 그쪽은 그쪽 검사가 있다)의 `<script>`·`<style>`
 * 태그, 그리고 **문자 그대로 `<!-- -->`**(2026-09-18 실측 — `{/* *‍/}` 와 달리 이것은
 * Astro 가 안 걷어 낸다. `screener.astro` 의 한 덩어리가 이 길로 실제로 새고 있었다)
 * «안»에서만, 다음 무늬를 찾는다 —
 *   ① 사장님 · 보스
 *   ② [숫자]번  (유닛 번호 — 「6번」·「[2026-09-16 · 6번]」 등)
 *   ③ [YYYY-MM-DD  (날짜가 낀 결정 이력 주석의 시작 꼴)
 *   ④ 🔴 ⛔ ⭐  (이 저장소가 내부 문서에 쓰는 강조 기호)
 *
 * ⛔ 코드(변수명·문자열 리터럴 중 손님에게 실제로 보여줄 것)는 이 자의 관심사가 아니다.
 *   «주석 안»에서만 찾는다 — 주석이 아닌 자리의 한글은 다른 문제(번역 여부)다.
 *
 * 쓰는 법
 *   node scripts/check-internal-comment-leak.mjs --자가시험
 *   node scripts/check-internal-comment-leak.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const 무늬들 = [
  { 이름: '사장님/보스 언급', 식: /사장님|보스 도와줘요/ },
  { 이름: '유닛 번호', 식: /\[?[0-9]번(\]|[\s,·:.→〉]|$)/ },
  { 이름: '날짜 낀 결정 이력', 식: /\[20\d\d-\d\d-\d\d/ },
  { 이름: '강조 기호(내부 문서용)', 식: /[\u{1F534}⛔⭐]/u },
];

/** 문자열에서 <script>...</script>, <style>...</style> 내용만 뽑는다(self-closing 은 제외 — 몸이 없다)
 * ⚠ 먼저 `{/* ... *‍/}` (Astro 템플릿 주석 — 컴파일 때 사라진다)를 지운다. 안 지우면 그 안의
 *   글이 «<style>» 같은 말을 그대로 담고 있을 때 그것을 진짜 여는 태그로 잘못 읽는다
 *   (실측 2026-09-18 — src/pages/data/index.astro 의 한 줄이 이 사고를 냈다). */
/**
 * **.astro 의 머리글(맨 위 울타리 사이)을 걷는다 — 거기는 브라우저로 가지 않는다.**
 *
 * 🔴🔴 [2026-10-11 15:0x · 5번] **같은 파일에서 같은 사고를 두 번째 겪었다.**
 *   위 2026-09-18 기록은 Astro 템플릿 주석 꼴이었고, 오늘은 **머리글 주석** 꼴이다.
 *   이 자가 「주석을 머리글로 옮기라」고 «스스로 안내해 놓고», 옮긴 글에 스크립트 여는 태그가
 *   한 글자라도 들어 있으면 그 자리를 진짜 블록 시작으로 읽어 **파일 끝까지 전부** 샌 것으로 셌다.
 * ```
 *   내가 머리글에 그 태그를 적자   14건 → 121건
 *   그 글자만 풀어 쓰자            13건
 * ```
 *   ⇒ 안내한 대로 따른 사람이 되레 더 크게 울린다. 그것은 안내가 아니라 덫이다.
 *
 * ⛔ 머리글은 **맨 위에 있는 것 하나만** 걷는다. 본문에 나오는 가로줄은 머리글이 아니다 —
 *   그것까지 걷으면 이 자가 눈을 감는다.
 * ⚠ 머리글 안의 «코드»가 문자열로 스크립트를 내보낼 수는 있지만, 그때 가는 것은 그 문자열이지
 *   주석이 아니다. 이 자가 찾는 것은 주석 무늬라 걷어도 놓치지 않는다.
 */
export function 머리글걷기(글) {
  const s = String(글 ?? '');
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(s);
  return m ? s.slice(m[0].length) : s;
}

export function 스크립트스타일내용(글) {
  const s = 머리글걷기(글).replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const 나옴 = [];
  for (const m of s.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi)) 나옴.push(m[2]);
  for (const m of s.matchAll(/<!--([\s\S]*?)-->/g)) 나옴.push(m[1]);
  return 나옴;
}

/** 한 덩어리 글에서 무늬가 걸리면 {이름, 몇째줄, 앞뒤} 를 낸다 */
export function 걸린것들(내용) {
  const 나옴 = [];
  const 줄들 = 내용.split(/\r?\n/);
  줄들.forEach((줄, i) => {
    for (const { 이름, 식 } of 무늬들) {
      if (식.test(줄)) 나옴.push({ 이름, 줄번호: i + 1, 글: 줄.trim().slice(0, 90) });
    }
  });
  return 나옴;
}

/** 남의 몫 — 폴더 이름만으로는 못 거른다. WikiTip·HundredYear 는 레이아웃이
 * src/layouts/ 에 «파일 하나»로 있어 폴더 제외로는 안 걸린다. 파일 이름으로 뺀다. */
const 남의파일 = new Set(['WikiTip.astro', 'HundredYear.astro']);

/** 검사 대상 .astro 파일 — wikitip·100y·남의 레이아웃·node_modules 는 그쪽 검사가 있어 뺀다 */
export function 대상파일들(뿌리 = path.join(ROOT, 'src')) {
  const 나옴 = [];
  const 걷기 = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'wikitip' || ent.name === '100y' || ent.name === 'node_modules') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { 걷기(full); continue; }
      if (남의파일.has(ent.name)) continue;
      if (ent.name.endsWith('.astro')) 나옴.push(full);
    }
  };
  걷기(뿌리);
  return 나옴;
}

function 자가시험() {
  let ok = true;
  const 재다 = (이름, 참) => { if (!참) { ok = false; console.error('✕', 이름); } };

  const 예시 = `<script>\n/* 🔴 [2026-09-16 · 6번] 사장님 결정 — 뭔가 */\nvar x = 1;\n</script>`;
  const 걸린 = 걸린것들(스크립트스타일내용(예시)[0]);
  재다('사장님 언급을 잡는다', 걸린.some((c) => c.이름 === '사장님/보스 언급'));
  재다('유닛 번호를 잡는다', 걸린.some((c) => c.이름 === '유닛 번호'));
  재다('날짜 낀 결정 이력을 잡는다', 걸린.some((c) => c.이름 === '날짜 낀 결정 이력'));

  const 깨끗 = `<script>\nvar 카드들 = [];\n/* 손님은 $m 으로 친다 */\n</script>`;
  재다('평범한 기술 주석은 안 잡는다', 걸린것들(스크립트스타일내용(깨끗)[0]).length === 0);

  const 안전 = `<p>사장님도 읽는 페이지지만 script 밖이다</p>`;
  재다('<script>·<style>·<!-- --> 밖의 한글은 안 본다', 스크립트스타일내용(안전).length === 0);

  const 진짜주석 = `<!-- 🔴 [2026-09-15 · 6번] 사장님 지시로 고침 -->`;
  const 진짜주석걸린 = 걸린것들(스크립트스타일내용(진짜주석)[0] ?? '');
  재다('문자 그대로 <!-- --> 도 잡는다(Astro 가 안 걷어 낸다)', 진짜주석걸린.some((c) => c.이름 === '사장님/보스 언급'));

  const 자기닫힘 = `<script type="application/ld+json" set:html={x} />`;
  재다('self-closing 스크립트는 몸이 없어 건너뛴다', 스크립트스타일내용(자기닫힘).length === 0);

  const 헷갈리는것 = `<style>a{color:red}</style>\n{/* Astro 의 <style> 은 스코프된다 */}\n<style>b{color:blue}</style>`;
  const 뽑힌것 = 스크립트스타일내용(헷갈리는것);
  재다('{/* <style> 언급 */} 을 진짜 태그로 안 읽는다', 뽑힌것.length === 2 && 뽑힌것[0].includes('color:red') && 뽑힌것[1].includes('color:blue'));

  /* 🔴🔴 [2026-10-11 15:0x · 5번] **같은 사고를 두 번째 겪었다 — 이번엔 머리글 꼴이다.**
     이 자가 「주석을 머리글로 옮기라」고 안내해 놓고, 옮긴 글에 스크립트 여는 태그가
     한 글자라도 들어 있으면 파일 끝까지 전부 샌 것으로 셌다(실측 14건 → 121건). */
  const 머리글에태그 = `---\n/**\n * 아래 인라인 <script> 의 catch 안에 🔴 [2026-10-11 · 5번] 이런 말이 있었다\n */\nconst a = 1;\n---\n<p>ok</p>`;
  재다('🔴🔴 머리글 주석 속 스크립트 태그를 «진짜 블록 시작»으로 안 읽는다',
    스크립트스타일내용(머리글에태그).length === 0);
  재다('🔴 머리글 안의 내부 표식도 안 센다 — 거기는 브라우저로 가지 않는다',
    걸린것들(스크립트스타일내용(머리글에태그).join('\n')).length === 0);

  /* ⛔⛔ 넓힌 뒤에는 «눈을 감지 않았나»부터 본다 */
  const 머리글있고진짜샌다 = `---\nconst a = 1;\n---\n<script>\n/* 🔴 [2026-09-16 · 6번] 사장님 결정 */\nvar x = 1;\n</script>`;
  재다('⛔⛔ 머리글을 걷어도 «진짜» 스크립트는 그대로 잡는다 — 눈을 감지 않는다',
    걸린것들(스크립트스타일내용(머리글있고진짜샌다).join('\n')).length > 0);
  재다('⛔ 머리글은 «맨 위 하나»만 걷는다 — 본문 가로줄을 머리글로 읽지 않는다',
    머리글걷기('<p>a</p>\n---\n<p>b</p>').includes('<p>a</p>'));
  재다('⛔ 머리글이 없는 글은 그대로 둔다', 머리글걷기('<p>ok</p>') === '<p>ok</p>');
  재다('⛔ 빈 것·null 에 안 터진다', 머리글걷기('') === '' && 머리글걷기(null) === '');

  console.log(ok ? '✅ 자가시험 통과' : '⛔ 자가시험 실패');
  return ok;
}

function 본일() {
  const 파일들 = 대상파일들();
  let 걸린수 = 0;
  console.log(`■ 내부 대화 노출 검사 — .astro ${파일들.length}개의 <script>·<style> 확인`);
  for (const f of 파일들) {
    const 글 = fs.readFileSync(f, 'utf8');
    for (const 덩어리 of 스크립트스타일내용(글)) {
      const 걸린 = 걸린것들(덩어리);
      if (!걸린.length) continue;
      걸린수 += 걸린.length;
      console.log(`  🔴 ${path.relative(ROOT, f)}`);
      for (const c of 걸린) console.log(`     [${c.이름}] 줄 ${c.줄번호}: ${c.글}`);
    }
  }
  if (!걸린수) { console.log('✅ 걸린 곳 없다.'); process.exit(0); }
  console.log(`⛔ ${걸린수}건 — 손님 화면(view-source)에 우리끼리 하는 말이 실려 나간다.`);
  console.log('   고치는 법: 그 주석을 지우거나, 필요하면 frontmatter(--- 안)로 옮긴다.');
  process.exit(1);
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else if (process.argv[1] && process.argv[1].endsWith('check-internal-comment-leak.mjs')) 본일();
