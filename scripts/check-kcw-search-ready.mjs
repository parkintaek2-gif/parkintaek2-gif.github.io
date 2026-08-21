#!/usr/bin/env node
/**
 * check-kcw-search-ready.mjs — **109편 중 「검색에 들 준비가 된 편」이 몇 편인가.**
 *
 * 2번 지시(8/21 23:2x): 「제목·설명·canonical·sitemap 등재 — **넷 다 있는 편만** 셈에 넣는다」
 * 까닭: 밖에서 온 사람이 전 유닛 합쳐 하루 27명이다. 편 수를 늘리는 것보다
 *       이미 있는 편이 **밖에서 찾아지게** 만드는 쪽이 값이 싸다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **라이브를 잰다.** `dist/` 를 재면 「빌드했다」를 「나갔다」로 읽는다 —
 *    오늘 이 자리에서 네 번 그 구멍에 빠졌다.
 * ⛔ **못 받은 것을 「없다」로 세지 않는다.** 응답이 200 이 아니면 「못 쟀다」다.
 * ⛔ 넷 중 하나라도 없으면 **준비된 편이 아니다.** 셋만 있는 편을 반쪽으로 세지 않는다.
 * ⛔ 빠진 것은 **종류별로** 센다. 「몇 편이 안 됐다」만으로는 무엇을 고칠지 모른다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-search-ready.mjs            라이브를 잰다
 *   node scripts/check-kcw-search-ready.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방 = path.join(뿌리, 'content', 'kculturewire');
export const 사이트 = 'https://www.kculturewire.com';
export const 사이트맵 = `${사이트}/sitemap.xml`;

/** 앞말에서 draft 인가. ⛔ draft 는 셈에서 뺀다 — 아직 낸 것이 아니다 */
export function 초안인가(글) {
  return /^draft:\s*true\s*$/m.test(글);
}

/** 라이브 HTML 에서 네 칸을 뽑는다. ⛔ 없으면 null — 빈 문자열과 안 섞는다 */
export function 네칸(html) {
  const 뽑 = (re) => { const m = re.exec(html); return m ? m[1].trim() : null; };
  const 제목 = 뽑(/<title[^>]*>([^<]+)<\/title>/i);
  const 설명 = 뽑(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    ?? 뽑(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonical = 뽑(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
    ?? 뽑(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  return {
    title: 제목 && 제목.length > 0 ? 제목 : null,
    description: 설명 && 설명.length > 0 ? 설명 : null,
    canonical: canonical && canonical.length > 0 ? canonical : null,
  };
}

/** canonical 이 그 기사 자신을 가리키나. 남을 가리키면 검색이 그쪽으로 넘긴다 */
export function 제것을가리키나(canonical, 주소) {
  if (!canonical) return null;
  return canonical.replace(/\/$/, '') === 주소.replace(/\/$/, '');
}

/** 넷 다 갖췄나 — ⛔ 셋은 준비된 것이 아니다 */
export function 준비됐나(칸) {
  return Boolean(칸.title && 칸.description && 칸.canonicalSelf === true && 칸.inSitemap === true);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };

  const h = '<title>A</title><meta name="description" content="B">'
    + '<link rel="canonical" href="https://www.kculturewire.com/article/x">';
  재본다('네 칸을 뽑는다', 네칸(h),
    { title: 'A', description: 'B', canonical: 'https://www.kculturewire.com/article/x' });
  재본다('⛔ 빈 설명은 null', 네칸('<meta name="description" content="">').description, null);
  재본다('⛔ 없는 칸은 null', 네칸('<p>x</p>'), { title: null, description: null, canonical: null });
  재본다('순서가 바뀐 meta 도 잡는다',
    네칸('<meta content="C" name="description">').description, 'C');

  재본다('제 것을 가리킨다', 제것을가리키나('https://a.com/x/', 'https://a.com/x'), true);
  재본다('⛔ 남을 가리키면 false', 제것을가리키나('https://a.com/y', 'https://a.com/x'), false);
  재본다('⛔ 없으면 null', 제것을가리키나(null, 'https://a.com/x'), null);

  재본다('⛔⛔ 셋만 있으면 준비된 것이 아니다',
    준비됐나({ title: 'a', description: 'b', canonicalSelf: true, inSitemap: false }), false);
  재본다('넷 다 있으면 준비됐다',
    준비됐나({ title: 'a', description: 'b', canonicalSelf: true, inSitemap: true }), true);
  재본다('⛔ canonical 이 남을 가리키면 준비 안 됨',
    준비됐나({ title: 'a', description: 'b', canonicalSelf: false, inSitemap: true }), false);

  재본다('초안을 알아본다', 초안인가('---\ndraft: true\n---'), true);
  재본다('초안이 아닌 것', 초안인가('---\ntitle: x\n---'), false);
  재본다('⭐ 기사방이 있다', fs.existsSync(기사방), true);

  console.log(`검색 준비 재는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 편들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md'))
    .filter((f) => !초안인가(fs.readFileSync(path.join(기사방, f), 'utf8')))
    .map((f) => f.replace(/\.md$/, ''));
  console.log(`기사 ${편들.length}편 (초안 뺀 것) · 라이브를 잰다…`);

  /* ① 사이트맵을 한 번만 받는다 */
  const sm = await fetch(사이트맵, { headers: { 'User-Agent': 'KCultureWire-selfcheck/1.0' } });
  if (!sm.ok) { console.error(`⛔ 사이트맵을 못 받았다 ${sm.status} — 못 쟀다`); process.exit(1); }
  const 사맵글 = await sm.text();
  const 사맵주소 = new Set([...사맵글.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
  console.log(`사이트맵 <loc> ${사맵주소.size}개`);

  const 줄 = [];
  for (const s of 편들) {
    const 주소 = `${사이트}/article/${s}`;
    let 칸 = { title: null, description: null, canonical: null };
    let 못받음 = null;
    try {
      const r = await fetch(주소, { headers: { 'User-Agent': 'KCultureWire-selfcheck/1.0' } });
      if (!r.ok) 못받음 = r.status; else 칸 = 네칸(await r.text());
    } catch (e) { 못받음 = String(e.message).slice(0, 40); }
    const 한줄 = {
      slug: s,
      httpFailed: 못받음,
      title: 칸.title,
      description: 칸.description,
      canonical: 칸.canonical,
      canonicalSelf: 제것을가리키나(칸.canonical, 주소),
      inSitemap: 사맵주소.has(주소),
    };
    한줄.ready = 못받음 ? false : 준비됐나(한줄);
    줄.push(한줄);
    if (줄.length % 25 === 0) console.log(`  ${줄.length}/${편들.length}`);
  }

  const 준비 = 줄.filter((x) => x.ready);
  const 못쟀다 = 줄.filter((x) => x.httpFailed);
  const 빠진것 = {
    title: 줄.filter((x) => !x.httpFailed && !x.title).length,
    description: 줄.filter((x) => !x.httpFailed && !x.description).length,
    canonicalMissing: 줄.filter((x) => !x.httpFailed && !x.canonical).length,
    canonicalPointsElsewhere: 줄.filter((x) => !x.httpFailed && x.canonicalSelf === false).length,
    notInSitemap: 줄.filter((x) => !x.httpFailed && !x.inSitemap).length,
  };

  console.log(`\n⭐ **넷 다 갖춘 편 ${준비.length} / ${편들.length}**`);
  console.log(`⚠ 못 쟀다(라이브에서 200 이 아님) ${못쟀다.length}편`
    + (못쟀다.length ? ` — ${못쟀다.slice(0, 6).map((x) => `${x.slug}(${x.httpFailed})`).join(', ')}` : ''));
  console.log('\n빠진 것 — 종류별');
  for (const [k, v] of Object.entries(빠진것)) console.log(`   ${String(v).padStart(4)}  ${k}`);

  const 안된것 = 줄.filter((x) => !x.ready && !x.httpFailed);
  if (안된것.length) {
    console.log(`\n준비 안 된 편 ${안된것.length}편 — 앞 12편`);
    for (const x of 안된것.slice(0, 12)) {
      const 빠짐 = [!x.title && 'title', !x.description && 'description',
        x.canonicalSelf !== true && 'canonical', !x.inSitemap && 'sitemap'].filter(Boolean);
      console.log(`   ${x.slug}  ← ${빠짐.join(' · ')}`);
    }
  }
}
