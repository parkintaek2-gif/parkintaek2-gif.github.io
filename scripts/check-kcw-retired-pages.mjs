#!/usr/bin/env node
/**
 * check-kcw-retired-pages.mjs — **한 번 알린 주소가 사라졌나.** (보는 검사 · `--낸다` 로 지면도 낸다)
 *
 * ── 🔴 왜 만들었나 (2026-08-23) ──────────────────────────────
 * 오늘 자료를 새로 지으며 나는 실적보고에 「작품 지면 528→560장(**없어진 주소 0**)」이라고
 * 적었다. 그런데 IndexNow 대장과 사이트맵을 맞대 보니 **두 곳이 사라져 있었다** —
 *   · /title/the-uninvited     Uninvited 를 한국 작품이 아니라고 가려내며(이탈리아·필리핀·미국)
 *                              작품 지면에서 빠졌다. 가려낸 것은 옳다. 주소가 죽은 것은 별개다
 *   · /firm/lotte-entertainment  회사 지면 여덟 곳은 「카탈로그가 가장 온전히 보이는 곳」으로
 *                              고르는데, 새 자료에서 climax-studio 가 들어오고 이 곳이 밀렸다
 * ⛔ 「없어진 주소 0」이라고 적은 자는 **작품 지면만** 셌다. 회사 지면과 대장은 안 봤다.
 *   ⭐ 그래서 자를 바꾼다 — **우리가 검색엔진에 알린 주소 전부**를 기준으로 센다.
 *      알린 주소가 곧 「밖에서 우리를 찾아올 수 있는 주소」다. 그것이 죽으면 손님이 404 를 본다.
 *
 * ⛔ 사라진 주소를 되살리지 않는다. Uninvited 는 우리 주제가 아니라고 재서 뺀 것이다 —
 *   되살리면 우리가 잰 것을 우리가 뒤집는 셈이다.
 * ⭐ 대신 **그 자리에 「이 주소는 접었다」를 적어 둔다.** 까닭과 갈 곳을 같이 적는다.
 *   빈 404 는 손님을 내보내지만, 까닭이 적힌 지면은 다음 걸음을 준다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-retired-pages.mjs           센다 (빌드 뒤에 돌린다)
 *   node scripts/check-kcw-retired-pages.mjs --낸다    접은 자리에 지면을 낸다
 *   node scripts/check-kcw-retired-pages.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장길 = path.join(뿌리, 'archive', 'indexnow-kcw.json');
export const 사이트맵길 = path.join(뿌리, 'dist', 'wikitip', 'sitemap.xml');
/**
 * ⭐ **`public/wikitip/` 에 낸다.** `dist/` 는 빌드마다 다시 지어지니 거기에만 쓰면
 *   다음 빌드에서 사라진다 — 방 지면(`public/wikitip/room/`)도 같은 자리를 쓴다.
 *   그리고 지금 살아 있는 `dist/` 에도 같은 것을 놓아 이번 배포부터 뜨게 한다.
 */
export const 원본방 = path.join(뿌리, 'public', 'wikitip');
export const 낸방 = path.join(뿌리, 'dist', 'wikitip');

/**
 * 접은 까닭 — **아는 것만 적는다.** 모르면 모른다고 나간다.
 * ⛔ 여기에 없는 주소에 그럴듯한 까닭을 지어 붙이지 않는다.
 */
export const 접은까닭 = new Map([
  ['/title/the-uninvited',
    ['We removed this title, not this film.',
      'Uninvited charted on Netflix, but when we checked its country of origin against Wikidata it '
      + 'came back Italy, the Philippines and the United States, with no Korean production credit. '
      + 'K Culture Wire counts Korean titles, so it left our catalogue and this address with it. '
      + 'The measurement stands; only the address stopped being ours to keep.']],
  ['/firm/lotte-entertainment',
    ['This company sheet was not removed for cause.',
      'We publish sheets for the companies whose catalogue we can see most completely, and the set '
      + 'is recomputed every time new chart weeks arrive. In the 2026-08-23 rebuild another company '
      + 'became more completely visible than this one and took the last slot. Nothing here was found '
      + 'to be wrong, and the sheet may return when the data moves again.']],
]);

/** 갈 곳 — 접힌 주소가 어느 목록에 속했나 */
export function 갈곳(길) {
  if (길.startsWith('/title/')) return ['/titles', 'every Korean title we hold chart data for'];
  if (길.startsWith('/firm/')) return ['/firms', 'the company sheets we publish'];
  if (길.startsWith('/article/')) return ['/articles', 'everything we have published'];
  return ['/', 'the front page'];
}

export function 사이트맵길들(글) {
  return new Set([...글.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/^https?:\/\/[^/]+/, '')));
}

export function 대장길들(대장) {
  return Object.keys(대장?.pinged ?? {});
}

/** ⭐ 알렸는데 이제 안 싣는 주소. **이것이 손님이 보는 404 다** */
export function 접힌것(대장, 사이트맵글) {
  const 사는것 = 사이트맵길들(사이트맵글);
  return 대장길들(대장).filter((p) => !사는것.has(p)).sort();
}

export function 지면(길) {
  const [제목, 몸] = 접은까닭.get(길)
    ?? ['This address was retired.',
      'It was published once and announced to search engines, and it is not in our current '
      + 'sitemap. We have not recorded why, so we are not guessing here — what we can say is '
      + 'that the address is no longer one of ours to serve.'];
  const [곳, 뭐] = 갈곳(길);
  return [
    '<title>Retired address — K Culture Wire</title>',
    '<meta name="robots" content="noindex, follow">',
    `<link rel="canonical" href="https://www.kculturewire.com${곳}">`,
    '<style>',
    '  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --accent:#b4472a; }',
    '  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){',
    '    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --accent:#e8825f; } }',
    '  :root[data-theme="dark"]{ --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216;',
    '    --accent:#e8825f; }',
    '  body{margin:0;background:var(--bg);color:var(--ink);',
    '    font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}',
    '  .wrap{max-width:640px;margin:0 auto;padding:48px 20px 80px}',
    '  h1{font-size:clamp(24px,4vw,32px);line-height:1.2;margin:0 0 14px;letter-spacing:-.02em}',
    '  p{color:var(--ink-2);max-width:60ch;margin:0 0 16px}',
    '  code{font-size:14px;color:var(--ink)}',
    '  a{color:var(--accent)}',
    '  footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);',
    '    color:var(--ink-2);font-size:13px}',
    '</style>',
    '<div class="wrap">',
    `  <h1>${제목}</h1>`,
    `  <p>You asked for <code>${길}</code>. ${몸}</p>`,
    `  <p>What we do still hold is <a href="${곳}">${뭐}</a>.</p>`,
    '  <footer>K Culture Wire &middot; <a href="/">kculturewire.com</a></footer>',
    '</div>',
    '',
  ].join('\n');
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (n, v) => { if (v) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}`); } };

  const 맵 = '<url><loc>https://www.kculturewire.com/titles</loc></url>'
    + '<url><loc>https://www.kculturewire.com/title/alive</loc></url>';
  const 대 = { pinged: { '/titles': '2026-08-01', '/title/alive': '2026-08-01', '/title/gone': '2026-08-01' } };
  참('알렸는데 사이트맵에 없는 것만 집는다',
    JSON.stringify(접힌것(대, 맵)) === JSON.stringify(['/title/gone']));
  참('살아 있는 것은 안 집는다', !접힌것(대, 맵).includes('/title/alive'));
  참('대장이 비면 접힌 것도 없다', 접힌것({ pinged: {} }, 맵).length === 0);
  /* ⛔ 대장이 아예 없어도 죽지 않는다 — 「못 쟀다」와 「깨졌다」는 다른 말이다 */
  참('대장이 null 이어도 안 죽는다', 접힌것(null, 맵).length === 0);

  참('작품 주소는 /titles 로 보낸다', 갈곳('/title/x')[0] === '/titles');
  참('회사 주소는 /firms 로 보낸다', 갈곳('/firm/x')[0] === '/firms');
  참('모르는 주소는 첫 지면으로 보낸다', 갈곳('/nowhere')[0] === '/');

  const h = 지면('/title/the-uninvited');
  참('까닭을 아는 주소는 그 까닭을 싣는다', h.includes('Italy, the Philippines'));
  참('색인에서 빼라고 적는다', h.includes('noindex'));
  참('정본 주소를 목록으로 건다', h.includes('canonical" href="https://www.kculturewire.com/titles'));
  /* 🔴 까닭을 모르면 **지어내지 않는다**. 이 자가 지키는 것이 그것이다 */
  const g = 지면('/title/no-such-thing');
  참('까닭을 모르면 모른다고 적는다', g.includes('We have not recorded why'));
  참('까닭을 모를 때 그럴듯한 말을 안 붙인다', !g.includes('Italy'));

  console.log(`접힌 주소를 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(사이트맵길)) {
    console.log('⚠ dist 사이트맵이 없다 — 먼저 `npx astro build`. **못 쟀다**고 적는다.');
    process.exit(0);
  }
  if (!fs.existsSync(대장길)) {
    console.log('⚠ IndexNow 대장이 없다 — 알린 주소를 모른다. **못 쟀다.**');
    process.exit(0);
  }
  const 대장 = JSON.parse(fs.readFileSync(대장길, 'utf8'));
  const 맵글 = fs.readFileSync(사이트맵길, 'utf8');
  const 접힘 = 접힌것(대장, 맵글);

  console.log('한 번 알린 주소가 사라졌나 — 손님이 보는 404 를 센다\n');
  console.log(`   알린 주소 ${대장길들(대장).length}개 · 지금 싣는 주소 ${사이트맵길들(맵글).size}개`);
  console.log(`   접힌 주소 ${접힘.length}개\n`);
  for (const p of 접힘) {
    console.log(`   · ${p}${접은까닭.has(p) ? '' : '   ⚠ 까닭을 안 적어 뒀다'}`);
  }

  if (process.argv.includes('--낸다')) {
    let 냈다 = 0;
    for (const p of 접힘) {
      const 꼬리 = `${p.replace(/^\//, '')}.html`;
      const 글 = 지면(p);
      /* ⛔ 살아 있는 지면을 덮지 않는다 — 접힌 것만 여기 온다지만 자를 못 믿을 자리다 */
      const 낸것 = path.join(낸방, 꼬리);
      if (fs.existsSync(낸것)) { console.log(`   ⛔ dist 에 이미 있다, 안 덮는다: ${p}`); continue; }
      for (const 방 of [원본방, 낸방]) {
        const 길 = path.join(방, 꼬리);
        fs.mkdirSync(path.dirname(길), { recursive: true });
        fs.writeFileSync(길, 글);
      }
      냈다 += 1;
    }
    console.log(`\n✅ 접힌 자리에 지면 ${냈다}장을 냈다 — public/wikitip 과 dist/wikitip 둘 다`);
    console.log('⚠ 사이트맵에는 넣지 않는다 — 접은 주소를 다시 「싣는 지면」으로 세면 안 된다.');
  } else if (접힘.length) {
    console.log('\n   자리에 까닭을 적어 내려면 — node scripts/check-kcw-retired-pages.mjs --낸다');
  }
  console.log('\n⚠ 이 자는 세기만 한다. 되살릴지는 자료로 정한다 — 주소를 살리려고 자료를 바꾸지 않는다.');
}
