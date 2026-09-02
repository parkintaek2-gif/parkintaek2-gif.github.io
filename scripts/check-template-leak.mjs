#!/usr/bin/env node
/**
 * check-template-leak.mjs — **템플릿 조각이 손님 «글자»로 새는 것을 잡는다.**
 * ────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-09-02] 사장님이 휴대폰 화면으로 잡아 주셨다.
 *   > 「아랫부분에 **우리가 주고 받은 대화가 노출**. 삭제해. 이런 걸 다른데서도 봐서 삭제한 적 있어.
 *   >  한번 쭉 살펴보면 찾을 수 있는 오류인가?」
 *
 *   궁합 감정서(klifemap `public/mingli-gunghap.html`) 아래에 이것이 **글자로** 찍혀 있었다 —
 *   ```
 *   ${/* [2026-09-01 사장님] 「궁합도 인쇄/pdf 버튼이 제일 아래에 있음」 … *​/ ''}
 *   ```
 *   ⛔ `${/* … *​/ ''}` 는 **템플릿 문자열(백틱) 안에서만** 주석이 된다.
 *      HTML 본문에 두면 치환할 것이 없어 **그대로 손님에게 보인다.**
 *   ⇒ 우리 내부 대화(사장님 지시 원문)가 유료 감정서 지면에 노출됐다.
 *
 * [사장님 물음에 대한 답 — «찾을 수 있는 오류»다]
 *   ⛔ 다만 `${` 를 그냥 세면 안 된다. klifemap 지면은 정적 HTML 안에 `<script>` 를 두고
 *      그 안에서 템플릿 문자열을 쓴다 — `saju.html` 한 장에만 `${` 가 1,312개다. 전부 정상이다.
 *   ⭐ 그래서 **`<script>`·`<style>`·HTML 주석을 걷어 낸 «남은 글»**에서만 찾는다.
 *      그 자리에 `${` 가 있으면 그것은 손님 눈에 보이는 것이다.
 *
 * [쓰는 법]
 *   node scripts/check-template-leak.mjs              저장소의 지면을 훑는다(두 저장소)
 *   node scripts/check-template-leak.mjs --라이브       라이브를 받아 훑는다
 *   node scripts/check-template-leak.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 손님 눈에 보이는 글만 남긴다 — `<script>`·`<style>`·HTML 주석을 걷어 낸다.
 * ⚠ 태그는 남겨 둔다(속성 안의 `${` 도 새는 것이다).
 */
export function 보이는글만(html) {
  return String(html ?? '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

/** 새는 자리를 찾는다 — [줄번호, 앞뒤 글] 목록 */
export function 새는곳(html) {
  const 보임 = 보이는글만(html);
  const 나온다 = [];
  for (const m of 보임.matchAll(/\$\{/g)) {
    const 앞 = 보임.slice(0, m.index);
    const 줄 = 앞.split('\n').length;
    나온다.push({ 줄, 조각: 보임.slice(m.index, m.index + 90).replace(/\s+/g, ' ').trim() });
  }
  return 나온다;
}

/* ⚠ .astro 는 «빌드되기 전» 소스라 `${}` 가 정상이다 — 빌드 결과(dist)만 본다.
   ⛔ 소스를 보고 울면 사람이 검사를 끈다. 그것이 제일 나쁘다. */
const 볼곳 = [
  { 이름: 'klifemap 지면', 방: 'C:/Users/User/Documents/GitHub/klifemap/public', 꼴: /\.html$/i },
  { 이름: 'dataeconomics 빌드', 방: 'C:/Users/User/Documents/GitHub/dataeconomics/dist', 꼴: /\.html$/i, 깊게: true },
];

function 파일모으기(방, 꼴, 깊게, 담을것 = []) {
  let 것들;
  try { 것들 = fs.readdirSync(방, { withFileTypes: true }); } catch { return 담을것; }
  for (const it of 것들) {
    const 길 = path.join(방, it.name);
    if (it.isDirectory()) { if (깊게) 파일모으기(길, 꼴, 깊게, 담을것); continue; }
    if (꼴.test(it.name)) 담을것.push(길);
  }
  return 담을것;
}

function 자가시험() {
  let 흠 = 0;
  let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  /* ⭐ 실제로 새어 나갔던 그 글자를 그대로 시험으로 굳힌다 */
  const 실제로샌것 = `<div>본문</div>\n    \${/* [2026-09-01 사장님] 「궁합도 인쇄」 */ ''}\n<p>다음</p>`;
  본다('🔴 실제로 샌 그 꼴을 잡는다', 새는곳(실제로샌것).length === 1);

  본다('<script> 안의 것은 안 잡는다',
    새는곳('<script>const a = `${x}`; const b = `${y}`;</script>').length === 0);
  본다('<style> 안의 것은 안 잡는다', 새는곳('<style>a{content:"${x}"}</style>').length === 0);
  본다('HTML 주석 안의 것은 안 잡는다', 새는곳('<!-- ${/* 설명 */ \'\'} -->').length === 0);
  본다('본문의 것은 잡는다', 새는곳('<p>값은 ${값} 입니다</p>').length === 1);
  본다('속성 안의 것도 잡는다', 새는곳('<div data-x="${값}">가</div>').length === 1);
  본다('깨끗한 지면은 0 이다', 새는곳('<html><body><p>깨끗</p></body></html>').length === 0);
  본다('여러 개면 여러 개로 센다', 새는곳('<p>${a}</p><p>${b}</p>').length === 2);
  본다('줄 번호를 준다', 새는곳('가\n나\n<p>${x}</p>')[0].줄 === 3);
  /* ⛔ 스크립트가 여러 개일 때 한 덩이로 뭉쳐 지우지 않는지 — 사이의 본문이 살아 있어야 한다 */
  본다('스크립트 둘 사이의 본문을 본다',
    새는곳('<script>`${a}`</script><p>${새는것}</p><script>`${b}`</script>').length === 1);

  console.log(흠 ? `\n🔴 자가시험 ${흠}개 흠` : `\n✅ 자가시험 ${잰수}가지 다 지났다`);
  return 흠;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

  const 라이브 = process.argv.includes('--라이브');
  let 흠 = 0;
  let 본것 = 0;

  if (라이브) {
    const 집들 = ['https://klifemap.ai', 'https://www.kculturewire.com',
      'https://seoulmarkets.com', 'https://100yearmap.com'];
    for (const u of 집들) {
      let 길들 = [];
      try {
        const r = await fetch(`${u}/sitemap.xml`, { signal: AbortSignal.timeout(25000) });
        const t = await r.text();
        길들 = [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((x) => !x.endsWith('.xml'));
      } catch { console.log(`  ⬜ ${u} — 사이트맵을 못 받았다. **못 쟀다**`); continue; }
      console.log(`\n── ${u} — 지면 ${길들.length}장`);
      for (const p of 길들) {
        let h = '';
        try { h = await (await fetch(p, { signal: AbortSignal.timeout(15000) })).text(); }
        catch { console.log(`  ⬜ ${p} — 못 받았다`); continue; }
        본것 += 1;
        const 샌 = 새는곳(h);
        if (샌.length) {
          흠 += 샌.length;
          console.log(`  🔴 ${p} — ${샌.length}곳`);
          for (const x of 샌.slice(0, 3)) console.log(`       ${x.조각}`);
        }
      }
    }
  } else {
    for (const 곳 of 볼곳) {
      const 파일들 = 파일모으기(곳.방, 곳.꼴, 곳.깊게);
      if (!파일들.length) { console.log(`  ⬜ ${곳.이름} — 볼 파일이 없다(빌드 전일 수 있다). **못 쟀다**`); continue; }
      console.log(`\n── ${곳.이름} — ${파일들.length}장`);
      for (const f of 파일들) {
        본것 += 1;
        const 샌 = 새는곳(fs.readFileSync(f, 'utf8'));
        if (샌.length) {
          흠 += 샌.length;
          console.log(`  🔴 ${path.basename(f)} — ${샌.length}곳`);
          for (const x of 샌.slice(0, 3)) console.log(`       ${x.줄}줄: ${x.조각}`);
        }
      }
    }
  }

  console.log(`\n훑은 지면 ${본것}장 · 새는 곳 ${흠}곳`);
  if (흠) {
    console.error('\n⛔ 템플릿 조각이 손님 «글자»로 나갑니다. 즉시 고치십시오.');
    console.error('   HTML 본문의 주석은 `<!-- -->` 로 씁니다. `${/* … */ \'\'}` 는 백틱 «안»에서만 주석입니다.');
    process.exit(1);
  }
  console.log('✅ 새는 곳 없다.');
}
