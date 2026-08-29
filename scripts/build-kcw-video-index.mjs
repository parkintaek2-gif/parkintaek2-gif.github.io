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
/**
 * 🔴🔴 [2026-08-29] **하위 폴더 지면을 «못 보고» 있었다.**
 * 예전 판은 파일 «이름»만 보고 주소를 지었다. 그래서 wikitip/school/index.astro 처럼
 * 한 겹 안에 있는 지면에 영상을 걸면 갤러리가 「어디서 왔는지 모른다」로 세웠다.
 * ⛔ 지우지는 않으니 조용히 틀린다 — 손님은 영상만 보고 «그 이야기가 있는 지면»으로
 *    못 걸어간다. 사장님 상시 지시(「관련 콘텐트를 빠짐없이 붙여 다음 것을 보게 하라」)가
 *    바로 여기서 끊긴다.
 * ✅ 이제 wikitip 아래 상대 경로를 그대로 주소로 만든다.
 */
export function 지면주소(파일이름) {
  const 길 = String(파일이름 ?? '').split('\\').join('/');
  const 뒤 = 길.includes('src/pages/wikitip/') ? 길.split('src/pages/wikitip/')[1] : 길;
  const 없앤것 = 뒤.replace(/\.astro$/, '');
  const 조각 = 없앤것.split('/').filter(Boolean);
  if (조각[조각.length - 1] === 'index') 조각.pop();
  return 조각.length ? `/${조각.join('/')}` : '/';
}

/** wikitip 아래 .astro 를 «하위 폴더까지» 모은다 — 뿌리로부터의 상대 경로로 준다 */
export function 지면들모으기(방, 위 = '') {
  const 나온것 = [];
  for (const 이름 of fs.readdirSync(방, { withFileTypes: true })) {
    const 상대 = 위 ? `${위}/${이름.name}` : 이름.name;
    if (이름.isDirectory()) 나온것.push(...지면들모으기(path.join(방, 이름.name), 상대));
    else if (이름.name.endsWith('.astro')) 나온것.push(상대);
  }
  return 나온것;
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
  /* ⛔⛔ [2026-08-29] 하위 폴더 지면을 못 보던 결함 — 수로 못박는다 */
  검('⭐ 하위 폴더 지면의 주소를 살린다',
    지면주소('src/pages/wikitip/school/index.astro') === '/school');
  검('⭐ 하위 폴더의 낱장도 살린다',
    지면주소('src/pages/wikitip/school/[school].astro') === '/school/[school]');
  검('⭐ 상대 경로로 줘도 된다', 지면주소('school/index.astro') === '/school');
  검('⭐ 윈도우 역슬래시도 읽는다',
    지면주소(['src', 'pages', 'wikitip', 'school', 'index.astro'].join('\\')) === '/school');
  검('⭐ 훑기가 하위 폴더까지 모은다', (() => {
    const 다 = 지면들모으기(path.join(뿌리, 'src/pages/wikitip'));
    return 다.some((x) => x.includes('/')) && 다.every((x) => x.endsWith('.astro'));
  })());

  /**
   * ⛔⛔ [2026-08-29] 영상 파일이 «있는지»를 아무도 안 재고 있었다. 목록·지면·갤러리는
   * 다 제대로 나갔는데 영상만 404 였다 — 파일을 6번 자리(public/video/)에 두었기 때문이다.
   * 배포 표식(글자)이 떠서 「나갔다」로 판정까지 났다. 글자는 떴고 영상은 없었다.
   */
  검('⭐ 없는 파일을 잡는다', (() => {
    const 없 = 없는파일찾기([{ set: 'x', src: '/video/없다.mp4', thumb: null }], () => false);
    return 없.length === 1 && 없[0].includes('없다.mp4');
  })());
  검('⭐ 있는 파일은 안 잡는다', (() => {
    const 없 = 없는파일찾기([{ set: 'x', src: '/video/x.mp4' }], () => true);
    return 없.length === 0;
  })());
  검('⭐ src 와 thumb 를 둘 다 본다', (() => {
    const 없 = 없는파일찾기([{ set: 'x', src: '/video/a.mp4', thumb: '/video/thumb/a.jpg' }], () => false);
    return 없.length === 2;
  })());
  검('⭐ /video/x 를 public/wikitip/video/x 로도 찾아본다 — KCW 는 그리로 다시 쓴다',
    파일자리('/video/a.mp4').some((x) => x.split('\\').join('/').includes('public/wikitip/video/a.mp4')));
  검('⭐⭐ 지금 목록의 영상 파일이 «전부 실제로 있다»', (() => {
    const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-video.json'), 'utf8'));
    const 없 = 없는파일찾기(자료.videos);
    if (없.length) console.error('    없는 것:', 없.join(' / '));
    return 없.length === 0;
  })());

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

/**
 * 🔴🔴 [2026-08-29] **영상 파일이 «있는지»를 아무도 안 재고 있었다.**
 *
 * 새 영상을 넣으면서 파일을 `public/video/` 에 두었다. 그런데 K Culture Wire 의 영상
 * 자리는 `public/wikitip/video/` 이고, `public/video/` 는 **6번(SeoulMarkets) 자리**다.
 * 목록·지면·갤러리는 다 제대로 나갔는데 **영상만 404** 였다 — 손님에게는 깨진 자리가 보인다.
 *
 * ⛔ 배포 표식(글자)이 떠서 「나갔다」로 판정됐다. 글자는 떴고 영상은 없었다.
 *    「닿는 것과 걷는 것은 다르다」를 또 겪었다.
 * ✅ 그래서 목록을 지을 때 **파일이 실제로 있는지 재고, 없으면 짓지 않는다.**
 *    ⚠ 빈 갤러리를 내지 않는 것과 같은 결이다 — 없는 것을 있다고 적지 않는다.
 */
export function 파일자리(주소) {
  /* 지면에서는 `/video/x.mp4` 로 부르지만 실제 파일은 `public/wikitip/video/x.mp4` 다.
     ⚠ KCW 도메인이 `/video/` 를 `/wikitip/video/` 로 다시 쓴다 — 둘 다 200 이다. */
  const 뒤 = String(주소 ?? '').replace(/^\/+/, '');
  const 후보 = 뒤.startsWith('wikitip/') ? [뒤] : [`wikitip/${뒤}`, 뒤];
  return 후보.map((x) => path.join(뿌리, 'public', x));
}

export function 없는파일찾기(영상들, 있나 = (p) => fs.existsSync(p)) {
  const 없는것 = [];
  for (const v of 영상들 ?? []) {
    for (const [무엇, 주소] of [['src', v.src], ['thumb', v.thumb]]) {
      if (!주소) continue;
      if (!파일자리(주소).some((p) => 있나(p))) 없는것.push(`${v.set} ${무엇} ${주소}`);
    }
  }
  return 없는것;
}

const 짝 = new Map();
const 담기 = (set, 것) => {
  /* ⛔ 덮어쓰지 않는다 — 같은 벌이 두 지면에 걸려 있으면 둘 다 적는다 */
  if (!짝.has(set)) 짝.set(set, []);
  짝.get(set).push(것);
};
for (const f of 지면들모으기(지면방)) {
  const 글 = fs.readFileSync(path.join(지면방, f), 'utf8');
  if (!글.includes('KcwShorts')) continue;
  for (const v of 영상꺼내기(글)) 담기(v.set, { page: 지면주소(f), says: v.says, heading: v.heading });
}

/*
 * 🔴🔴 [2026-08-29] **글자로 박힌 것만 읽고 있었다.**
 *   그룹 지면(/group/<slug>)은 263개를 «한 틀»로 찍는다. 거기에 오늘 튄 이름의 영상을
 *   글자로 박으면 263개 전부에 그 영상이 붙는다 — 그래서 자료로 골라 싣게 만들었다.
 *   그랬더니 이 자가 그 영상을 **못 보게 됐다**: set 이 `set={이그룹영상.set}` 이라 글자가 아니다.
 *   ⛔ 그 결과 영상은 지면에 «떠 있는데» 갤러리 목록에는 «없는» 상태가 된다.
 * ✅ 그러니 자료로 붙인 것도 같이 읽는다. 붙이는 길이 둘이면 읽는 길도 둘이어야 한다.
 * ⚠ 붙이는 길을 새로 만들면 여기도 같이 늘려야 한다. 안 늘리면 조용히 빠진다.
 */
const 그룹영상길 = path.join(뿌리, 'src/data/kcw-group-video.json');
if (fs.existsSync(그룹영상길)) {
  const 그룹영상 = JSON.parse(fs.readFileSync(그룹영상길, 'utf8')).영상 ?? {};
  for (const [slug, v] of Object.entries(그룹영상)) {
    if (!v?.set) continue;
    담기(v.set, { page: `/group/${slug}`, says: v.says ?? null, heading: v.heading ?? null });
  }
}

/* 🔴 짓기 전에 «파일이 있는지» 먼저 잰다. 없으면 짓지 않는다 — 없는 것을 있다고 적지 않는다 */
const 없는것 = 없는파일찾기(영상자료.videos);
if (없는것.length) {
  console.error(`⛔ 영상 파일 ${없는것.length}개가 «없다». 목록을 짓지 않는다 —`);
  없는것.forEach((s) => console.error(`   · ${s}`));
  console.error('\n⚠ K Culture Wire 의 영상 자리는 public/wikitip/video/ 다.');
  console.error('   public/video/ 는 6번(SeoulMarkets) 자리다 — 거기 두면 KCW 에서 404 가 난다.');
  process.exit(1);
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
