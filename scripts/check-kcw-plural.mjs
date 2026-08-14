#!/usr/bin/env node
/**
 * **하나인데 복수형으로 썼나** — 사장님 지시(2026-08-14) 검수에서 나온 것.
 *
 * 🔴 8/14 에 폰으로 `/section/tradition` 을 넘기다 **「1 articles.」**를 봤다.
 *   영문 매체가 영어를 틀린 것이다. 사장님이 보시면 바로 걸리는 자리다.
 *   ⭐ 이 결함은 **수가 1이 될 때만** 난다. 그래서 여느 때는 안 보이고,
 *      새 갈래·새 표가 생겨 칸이 하나일 때 조용히 나간다.
 *
 * ⛔ 소스가 아니라 **빌드된 화면**을 본다. 「{n} articles」는 소스에서 멀쩡해 보인다.
 * ⚠ 늘리는 수는 막는다. 기준선은 0 이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 방 = 'dist/wikitip';

/**
 * ⚠ 「1 people」처럼 원래 복수인 것과, 「1 in three」처럼 뒤에 딴 말이 오는 것을 가른다.
 *   ⛔ 헛경보가 나면 아무도 이 자를 안 본다.
 */
export const 셀수있는말 = [
  'articles', 'pieces', 'titles', 'countries', 'markets', 'actors', 'people', 'weeks',
  'places', 'firms', 'days', 'months', 'years', 'groups', 'brands', 'athletes',
  'managers', 'seasons', 'rows', 'sources', 'pages', 'entries', 'names', 'items',
];

/**
 * 「1 articles」를 잡는다. ⛔ 1,047 같은 것은 아니다.
 * ⚠ 8/14 — 처음에 「one」도 넣었다가 **헛경보 둘**이 났다.
 *   「each one names its sources」·「the one people skip」 — 둘 다 앞을 받는 대명사다.
 *   영어에서 `one` 은 대명사로 너무 흔하다. **숫자 1만** 본다.
 */
export function 하나인데복수(글자) {
  const 자 = new RegExp(`(^|[\\s>(])1\\s+(${셀수있는말.join('|')})\\b`, 'g');
  return [...글자.matchAll(자)].map((m) => `1 ${m[2]}`);
}

export function 보이는글자(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('🔴 8/14 에 나간 그것을 잡는다', 하나인데복수('1 articles.'), ['1 articles']);
  재본다('🔴 「1 markets」도 잡는다', 하나인데복수('It reached 1 markets in all.'), ['1 markets']);
  재본다('⛔ 「1 article」은 맞다', 하나인데복수('1 article.'), []);
  재본다('⛔ 큰 수는 아니다', 하나인데복수('1,047 articles · 21 titles'), []);
  재본다('⛔ 「11 articles」는 아니다 — 앞자리를 봐야 한다', 하나인데복수('11 articles'), []);
  재본다('⛔ 「1 in three」는 아니다', 하나인데복수('1 in three Koreans'), []);
  /* ⚠ 8/14 헛경보 둘 — 영어에서 `one` 은 앞을 받는 대명사로 너무 흔하다 */
  재본다('⛔ 「each one names its sources」는 흠이 아니다',
    하나인데복수('these are four pieces; each one names its sources'), []);
  재본다('⛔ 「the one people skip」은 흠이 아니다',
    하나인데복수('the third is the one people skip'), []);
  재본다('여럿이면 다 잡는다',
    하나인데복수('1 articles and 1 titles').sort(), ['1 articles', '1 titles']);
  재본다('보이는글자 — 코드 안은 뺀다',
    보이는글자('<script>var n="1 articles"</script><p>ok</p>').trim(), 'ok');
  console.log(`복수형 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(방)) { console.error(`⛔ ${방} 이 없다 — npm run build 먼저`); process.exit(1); }
  const 파일들 = [];
  const 담기 = (곳) => {
    for (const 것 of fs.readdirSync(곳, { withFileTypes: true })) {
      const 길 = path.join(곳, 것.name);
      if (것.isDirectory()) 담기(길);
      else if (것.name.endsWith('.html')) 파일들.push(길);
    }
  };
  담기(방);

  const 걸린것 = [];
  for (const f of 파일들) {
    const 찾은 = 하나인데복수(보이는글자(fs.readFileSync(f, 'utf8')));
    if (찾은.length) 걸린것.push({ 길: f, 찾은: [...new Set(찾은)] });
  }

  console.log(`복수형 검사 — 화면 ${파일들.length}장 · 걸린 화면 ${걸린것.length}장`);
  for (const x of 걸린것.slice(0, 30)) {
    const 주소 = x.길.replace(/\\/g, '/').replace('dist/wikitip', '').replace(/\.html$/, '') || '/';
    console.log(`   🔴 ${주소}  「${x.찾은.join('」 「')}」`);
  }
  if (걸린것.length) {
    console.error('\n⛔ **하나인데 복수형이다.** 영문 매체가 영어를 틀리면 나머지 수도 안 믿는다.');
    process.exit(1);
  }
  console.log('✅ 복수형 어긋남 없음');
}
