#!/usr/bin/env node
/**
 * build-kcw-headlines.mjs — **지면 주소 → 그 지면의 머리글**을 한 자리에 모은다.
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-25 저녁, 사장님이 범위를 넓혀 주셨다 —
 *   「영상만 얘기하는 게 아니고, **텍스트, 카드, 카드뉴스** 등 다양한 유형의 콘텐트를
 *    **SEO와 적절한 검색어 선택**, 해시태그 등을 생각하며 만들라는 뜻」
 *
 * 그 말씀으로 카드 그림의 대체글(alt)을 재 보니 —
 * ```
 *   기사 지면의 카드 948장   머리글이 들어 있다        ✅
 *   자료 지면의 카드 105장   「Card 1 of 5」            ⛔ 검색에 아무것도 안 걸린다
 * ```
 * 구글 이미지가 읽는 것이 바로 그 alt 다. **「Card 1 of 5」로는 어떤 말로도 안 뜬다.**
 * ⚠ 그림이라 검색과 무관하다고 여겨 오래 빠뜨린 자리다.
 *
 * ── 왜 «지어진 지면»에서 읽나 ─────────────────────────────────
 * 머리글은 `.astro` 안에서 자료를 읽어 만들어진다(수가 박혀 있다). 원본 글자만 봐서는
 * `${…}` 자리를 모른다. 지어진 지면에는 **진짜 수가 들어 있다.**
 * ⛔ 그래서 이 자는 **빌드 뒤에** 돌린다. 빌드 전에 돌리면 지면을 못 찾아 «못 찾았다»고 적는다.
 * ⛔ 못 찾은 것을 빈 글로 채우지 않는다 — 부르는 쪽이 그것을 알고 다르게 굴어야 한다.
 *
 * 쓰는 법  node scripts/build-kcw-headlines.mjs --자가시험
 *          node scripts/build-kcw-headlines.mjs        (npm run build 뒤에)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 태그와 실체참조를 걷어 낸 알맹이 글자. ⛔ `&mdash;` 가 글자로 나가면 안 된다 */
export function 글만(html) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 지면 하나에서 `<h1>` 을 뽑는다. ⛔ 없으면 null — 파일 이름을 머리글인 척 쓰지 않는다 */
export function 머리글뽑기(html) {
  const m = String(html ?? '').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  const t = 글만(m[1]);
  return t || null;
}

/** 대체글로 쓸 수 있게 다듬는다. ⚠ 너무 길면 읽는 기계도 사람도 못 쓴다 */
export function 대체글(머리, 몇째, 모두, 꼴 = '') {
  const 앞 = String(머리 ?? '').trim();
  if (!앞) return null;
  const 짧게 = 앞.length > 110 ? `${앞.slice(0, 107).trim()}…` : 앞;
  const 꼬리 = 꼴 ? `${꼴} card ${몇째} of ${모두}` : `card ${몇째} of ${모두}`;
  return `${짧게} — ${꼬리}`;
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (무엇, 참) => { if (!참) { console.error('❌ ' + 무엇); 실패++; } else console.log('✅ ' + 무엇); };

  검('머리글을 뽑는다', 머리글뽑기('<h1>Hello there</h1>') === 'Hello there');
  검('속 태그를 걷어 낸다', 머리글뽑기('<h1>A <b>bold</b> thing</h1>') === 'A bold thing');
  검('⛔ h1 이 없으면 null', 머리글뽑기('<h2>x</h2>') === null);
  검('⛔ 빈 h1 도 null', 머리글뽑기('<h1>  </h1>') === null);
  /* 🔴 오늘 아침 겪은 것 — 실체참조가 «글자 그대로» 나가면 화면이 깨진 것처럼 보인다 */
  검('&mdash; 를 글자로 안 남긴다', !머리글뽑기('<h1>a &mdash; b</h1>').includes('&mdash'));
  검('숫자 실체참조를 푼다', 머리글뽑기('<h1>actors&#39; day</h1>') === "actors' day");
  검('여러 줄 h1 을 한 줄로', 머리글뽑기('<h1>\n  a\n  b\n</h1>') === 'a b');

  검('대체글이 머리글로 시작한다', 대체글('X counted', 1, 5).startsWith('X counted'));
  검('대체글에 몇째인지 남는다', 대체글('X', 2, 5).includes('card 2 of 5'));
  검('꼴을 주면 들어간다', 대체글('X', 1, 5, 'tall').includes('tall card 1 of 5'));
  /* ⛔ 「Card 1 of 5」 로 되돌아가지 않게 못박는다 — 이 자가 생긴 까닭이다 */
  검('⛔ 머리글 없이 「card n of m」만 내지 않는다', 대체글('', 1, 5) === null && 대체글(null, 1, 5) === null);
  검('아주 긴 머리글은 자른다', 대체글('가'.repeat(300), 1, 5).length < 140);
  검('짧은 머리글은 안 자른다', !대체글('Short one', 1, 5).includes('…'));

  검('글만 — 빈 값도 안 터진다', 글만(null) === '' && 글만(undefined) === '');

  console.log(실패 ? `\n❌ ${실패}개 실패` : '\n✅ 전부 지나갔다');
  process.exit(실패 ? 1 : 0);
}

/* ── 실제로 짓는다 ─────────────────────────────────────────── */
/**
 * 🔴 2026-08-25 — **오늘 이 흠으로 세 번 넘어졌다.** 세 번째가 여기다.
 *
 *   ① 아침 `check-name-placement.mjs`   부르기만 했는데 보고문이 통째로 돌았다
 *   ② 저녁 `stamp-site-entrance.mjs`    `import` 만 했는데 21편을 굽기 시작했다
 *   ③ 그리고 이 자                       `KcwCardnews.astro` 가 `대체글` 하나를 빌리자
 *                                        **빌드 한가운데서 이 아래가 돌아 빌드를 죽였다**
 *
 * ⛔ 두 번 겪고 전 유닛에 알리기까지 하고서 **새로 만든 자에 또 안 넣었다.**
 *   고친 것은 그 파일이지 «내 버릇»이 아니었다.
 * ⭐ 그래서 이제 `check-import-safety.mjs` 가 저장소 전체에서 이것을 찾는다 —
 *   **말로 하는 규칙은 잊힌다. 겪은 것은 검사로 굳힌다.**
 */
const 내가불렸나 = path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);

const 지면방 = path.join(뿌리, 'dist/wikitip');
const 낼곳 = path.join(뿌리, 'src/data/wikitip-headlines.json');

if (!내가불렸나) {
  /* import 된 것이다 — 함수만 빌려 간다. 아무것도 안 한다 */
} else if (!fs.existsSync(지면방)) {
  console.error(`⛔ ${지면방} 이 없다. **빌드를 먼저 한다** — 지어진 지면에서 읽는 자다`);
  process.exit(1);
} else {
  짓는다();
}

function 짓는다() {

const 머리 = {};
const 셈 = { 본지면: 0, 머리글있음: 0, 머리글없음: 0 };
const 없는것 = [];

/* ⚠ 자료 지면(한 장짜리)만 본다. `/article`·`/title` 같은 묶음은 각자 자기 머리글을 이미 쓴다 */
for (const f of fs.readdirSync(지면방)) {
  if (!f.endsWith('.html')) continue;
  셈.본지면++;
  const 주소 = '/' + f.replace(/\.html$/, '');
  const h = 머리글뽑기(fs.readFileSync(path.join(지면방, f), 'utf8'));
  if (h) { 머리[주소] = h; 셈.머리글있음++; }
  else { 셈.머리글없음++; 없는것.push(주소); }
}

fs.writeFileSync(낼곳, JSON.stringify({
  generated: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  whatThisIs: 'The first heading of every single-page section of the site, read from the built pages '
    + 'so the numbers inside it are the real ones.',
  whatThisIsNot: 'Not a list of every page. Pages built from a template (articles, titles, people) '
    + 'already carry their own heading and are not repeated here.',
  counts: 셈,
  missing: 없는것,
  headlines: 머리,
}, null, 2));

console.log(`■ 지면 ${셈.본지면}장 — 머리글 있음 ${셈.머리글있음} · 없음 ${셈.머리글없음}`);
if (셈.머리글없음) console.log(`  ⛔ 머리글 없는 지면은 «없다»고 적었다: ${없는것.slice(0, 6).join(' · ')}`);
console.log(`  냈다 — ${path.relative(뿌리, 낼곳)}`);
}
