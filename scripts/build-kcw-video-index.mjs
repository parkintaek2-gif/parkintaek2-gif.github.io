#!/usr/bin/env node
/**
 * build-kcw-video-index.mjs — **영상 갤러리가 「무엇에 대한 영상인지」를 말하게 한다.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-25 저녁, 사장님 지시로 카드·카드뉴스까지 재다가 **내 `/video` 지면이 깨져
 * 있는 것을 찾았다.** 오늘 낮에 그 지면을 만들고 첫 화면에 문까지 냈는데 —
 * ```
 *   화면에 뜨는 글자    actors · brands · control · counting …   ← 파일 이름이다
 *   「그 표로 가기」 링크  21편 중 «0편»
 * ```
 * 까닭은 내가 **카드뉴스 자료에 `title` 과 `page` 가 있을 것이라 «짐작»했기** 때문이다.
 * 열어 보니 그 자료는 `{set, sq[], v[]}` 뿐이었다. 그래서 매번 `?? v.set` 으로 떨어졌다.
 * ⛔ 조용히 떨어지는 기본값은 «깨진 것»을 «괜찮은 것»처럼 보이게 한다. 빌드도 안 멈췄다.
 * ⭐ 자료 이름을 짐작하지 않는다 — 파일을 열어 보고 쓴다. 오늘 아침에도 같은 흠으로
 *   `잴말뽑기` 가 0을 냈었다. 하루에 두 번 같은 자리다.
 *
 * ── 어디서 «진짜» 짝을 얻나 ───────────────────────────────────
 * 영상을 지면에 거는 것은 `<KcwShorts set="..." says="..."/>` 한 곳뿐이다.
 * 그러니 **지면 원본이 곧 짝 자료**다. 여기서 긁으면 딴 데서 관리할 것이 없고,
 * 지면이 영상을 떼면 짝도 저절로 사라진다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 짝을 못 찾은 영상을 **버리지 않는다.** 갤러리에는 서되 「어느 지면에서 왔는지 모른다」로 선다.
 * ⛔ `says` 를 지어내지 않는다. 지면에 실제로 적힌 글만 옮긴다.
 * ⛔ 한 지면에 영상이 둘일 수 있다(`/places` 가 그렇다). 덮어쓰지 않는다.
 *
 * 쓰는 법  node scripts/build-kcw-video-index.mjs --자가시험
 *          node scripts/build-kcw-video-index.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 지면 원본 한 장에서 `<KcwShorts …/>` 를 모두 뽑는다.
 * ⚠ `says` 는 백틱 템플릿으로 여러 줄에 걸쳐 적혀 있다 — 한 줄로 접어서 돌려준다.
 */
export function 영상꺼내기(원본글) {
  const 나온것 = [];
  const 덩이 = /<KcwShorts\b([\s\S]*?)\/>/g;
  let m;
  while ((m = 덩이.exec(String(원본글 ?? ''))) !== null) {
    const 속 = m[1];
    const set = (속.match(/\bset=["']([^"']+)["']/) || [])[1];
    if (!set) continue;
    /* says 는 `set={`…`}` 꼴이다. 백틱 안을 통째로 집는다 */
    const 말 = (속.match(/\bsays=\{`([\s\S]*?)`\}/) || [])[1]
      ?? (속.match(/\bsays=["']([^"']*)["']/) || [])[1]
      ?? null;
    const heading = (속.match(/\bheading=["']([^"']+)["']/) || [])[1] ?? null;
    나온것.push({ set, says: 말 ? 글접기(말) : null, heading });
  }
  return 나온것;
}

/**
 * 여러 줄에 걸친 템플릿 글을 한 줄로. `${…}` 가 섞여 있으면 그 조각은 «버린다» —
 * ⛔ 값을 모르면서 `${수}` 를 글자 그대로 화면에 내보내지 않는다.
 */
export function 글접기(글) {
  return String(글 ?? '')
    /* ⚠ `a ` + `b` 처럼 «이어붙인» 템플릿이 있다. 이음매를 안 지우면 화면에 백틱이 그대로 나간다 */
    .replace(/`\s*\+\s*`/g, '')
    .replace(/\$\{[^}]*\}/g, '…')
    .replace(/\\`/g, '`')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 지면 파일 이름에서 손님 주소로. `src/pages/wikitip/one-out.astro` → `/one-out` */
export function 지면주소(파일이름) {
  const b = path.basename(String(파일이름 ?? ''), '.astro');
  return b === 'index' ? '/' : `/${b}`;
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (무엇, 참) => { if (!참) { console.error('❌ ' + 무엇); 실패++; } else console.log('✅ ' + 무엇); };

  검('한 장에서 하나를 뽑는다',
    영상꺼내기('<KcwShorts set="a" says={`hello`} />').length === 1);
  검('set 을 읽는다', 영상꺼내기('<KcwShorts set="a" says={`x`} />')[0].set === 'a');
  검('says 를 읽는다', 영상꺼내기('<KcwShorts set="a" says={`x y`} />')[0].says === 'x y');
  /* 🔴 실제로 겪은 것 — `/places` 에 영상이 둘이다. 하나만 잡으면 한 편이 사라진다 */
  검('한 지면에 둘이 있으면 둘 다 뽑는다',
    영상꺼내기('<KcwShorts set="a" says={`x`} />\n<KcwShorts set="b" says={`y`} />').length === 2);
  검('여러 줄 says 를 한 줄로 접는다',
    영상꺼내기('<KcwShorts set="a"\n  says={`one\n  two`} />')[0].says === 'one two');
  검('⛔ ${…} 를 글자 그대로 안 내보낸다',
    !영상꺼내기('<KcwShorts set="a" says={`n is ${수}`} />')[0].says.includes('${'));
  검('heading 을 읽는다',
    영상꺼내기('<KcwShorts set="a" says={`x`} heading="Ten seconds" />')[0].heading === 'Ten seconds');
  검('KcwShorts 가 없으면 빈 배열', 영상꺼내기('<p>hi</p>').length === 0);
  검('빈 값도 터지지 않는다', 영상꺼내기(null).length === 0 && 영상꺼내기(undefined).length === 0);
  검('says 가 없으면 null 이다 — 빈 문자열로 안 채운다',
    영상꺼내기('<KcwShorts set="a" />')[0].says === null);

  검('지면 주소를 만든다', 지면주소('src/pages/wikitip/one-out.astro') === '/one-out');
  검('index 는 뿌리다', 지면주소('index.astro') === '/');

  검('글접기 — 앞뒤 공백을 턴다', 글접기('  a  b  ') === 'a b');
  검('글접기 — 빈 값은 빈 글', 글접기(null) === '' && 글접기(undefined) === '');

  console.log(실패 ? `\n❌ ${실패}개 실패` : '\n✅ 전부 지나갔다');
  process.exit(실패 ? 1 : 0);
}

/* ── 실제로 짓는다 ─────────────────────────────────────────── */
const 지면방 = path.join(뿌리, 'src/pages/wikitip');
const 영상자료길 = path.join(뿌리, 'src/data/wikitip-video.json');
const 낼곳 = path.join(뿌리, 'src/data/wikitip-video-index.json');

if (!fs.existsSync(영상자료길)) {
  console.error(`⛔ ${영상자료길} 이 없다. 빈 갤러리를 내지 않는다`);
  process.exit(1);
}
const 영상자료 = JSON.parse(fs.readFileSync(영상자료길, 'utf8'));

/**
 * 지어진 지면에서 «실제로 화면에 뜬 글»을 읽는다.
 *
 * 🔴 원본에서 긁은 `says` 에는 `${수}` 자리가 있어 「… and …」 처럼 **빈 말**이 된다.
 *   지면은 그 자리를 «진짜 수»로 채워서 낸다. 그러니 지어진 것이 있으면 그쪽이 옳다.
 * ⛔ 지어진 것이 없다고 멈추지 않는다 — 원본 것으로 떨어지고, **어느 쪽을 썼는지 적는다**.
 * ⚠ 그래서 이 자는 «빌드 뒤에» 돌려야 제 값을 한다. 빌드 전에 돌리면 원본 글이 담긴다.
 */
function 지어진글(page, set) {
  const f = path.join(뿌리, 'dist/wikitip', String(page).replace(/^\//, '') + '.html');
  if (!fs.existsSync(f)) return null;
  const h = fs.readFileSync(f, 'utf8');
  const 자리 = h.indexOf(`/video/${set}.mp4`);
  if (자리 < 0) return null;
  const 뒤 = h.slice(자리, 자리 + 4000);
  /* ⚠ Astro 가 `data-astro-cid-…` 를 붙인다. 여는 태그를 딱 맞춰 찾으면 하나도 못 찾는다 */
  const m = 뒤.match(/<p class="note"[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return null;
  const 글 = m[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ').trim()
    .replace(/\s*Free to repost with the address on it\.?\s*$/i, '').trim();
  return 글 || null;
}

const 짝 = new Map();
for (const f of fs.readdirSync(지면방)) {
  if (!f.endsWith('.astro')) continue;
  const 글 = fs.readFileSync(path.join(지면방, f), 'utf8');
  if (!글.includes('KcwShorts')) continue;
  for (const v of 영상꺼내기(글)) {
    /* ⛔ 덮어쓰지 않는다 — 같은 벌이 두 지면에 걸려 있으면 둘 다 적는다 */
    if (!짝.has(v.set)) 짝.set(v.set, []);
    짝.get(v.set).push({ page: 지면주소(f), says: v.says, heading: v.heading });
  }
}

const 셈 = { 영상: 0, 짝찾음: 0, 짝못찾음: 0, 두지면에걸린것: 0 };
const 줄 = [];
for (const v of 영상자료.videos ?? []) {
  셈.영상++;
  const 곳 = 짝.get(v.set) ?? [];
  if (곳.length > 1) 셈.두지면에걸린것++;
  if (곳.length) 셈.짝찾음++; else 셈.짝못찾음++;
  const 지은것 = 곳[0]?.page ? 지어진글(곳[0].page, v.set) : null;
  if (지은것) 셈.지면에서읽음 = (셈.지면에서읽음 ?? 0) + 1;
  else if (곳[0]?.says) 셈.원본에서읽음 = (셈.원본에서읽음 ?? 0) + 1;
  줄.push({
    set: v.set,
    src: v.src ?? null,
    thumb: v.thumb ?? null,
    seconds: v.seconds ?? null,
    /** ⛔ 못 찾았으면 «못 찾았다»고 둔다. 파일 이름을 제목인 척 쓰지 않는다 */
    page: 곳[0]?.page ?? null,
    says: 지은것 ?? 곳[0]?.says ?? null,
    /** 어느 쪽에서 읽었나. ⛔ 「어디서 온 글인지 모르는 것」을 화면에 안 내보내려고 적는다 */
    saysFrom: 지은것 ? 'built page' : (곳[0]?.says ? 'page source' : null),
    alsoOn: 곳.slice(1).map((x) => x.page),
  });
}

fs.writeFileSync(낼곳, JSON.stringify({
  generated: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
  whatThisIs: 'Every short film we publish, paired with the page it was built from. The pairing is '
    + 'read from the pages themselves, so it cannot drift out of date.',
  whatThisIsNot: 'It is not a description written for the video. The sentence beside each film is the '
    + 'one printed next to it on its own page.',
  counts: 셈,
  videos: 줄,
}, null, 2));

console.log(`■ 영상 ${셈.영상}편 — 지면과 짝지은 것 ${셈.짝찾음} · 못 지은 것 ${셈.짝못찾음}`);
if (셈.두지면에걸린것) console.log(`  ⚠ 두 지면에 걸린 영상 ${셈.두지면에걸린것}편 — 둘 다 적었다`);
if (셈.짝못찾음) {
  console.log('  ⛔ 짝을 못 찾은 것은 갤러리에 «어디서 왔는지 모른다»로 선다. 지우지 않는다');
  for (const x of 줄.filter((y) => !y.page)) console.log(`     ${x.set}`);
}
console.log(`  냈다 — ${path.relative(뿌리, 낼곳)}`);
