#!/usr/bin/env node
/**
 * check-kcw-three-clicks.mjs — **첫 화면에서 세 번 눌러 109편 전부에 닿는가.**
 *
 * 2번 지시(8/21 22:5x): 「세 클릭 안에 못 닿는 편이 **몇 편인지** 세어 적는다. 0 이면 끝이다」
 * 까닭: 기사가 109편인데 손님이 그 109편을 **찾을 길**이 없으면 편 수를 늘려도 숫자가 안 움직인다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **라이브를 걷는다.** `dist/` 를 걸으면 「빌드했다」를 「손님이 닿는다」로 읽는다.
 * ⛔ **못 받은 지면을 「링크 없음」으로 세지 않는다.** 200 이 아니면 그 지면은 「못 쟀다」다.
 * ⛔ **깊이는 첫 화면(/)에서만 센다.** 사이트맵은 로봇의 길이고 손님의 길이 아니다.
 * ⛔ 같은 주소를 두 번 걷지 않는다. 이미 얕은 깊이로 닿았으면 그 값을 지킨다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-three-clicks.mjs
 *   node scripts/check-kcw-three-clicks.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방 = path.join(뿌리, 'content', 'kculturewire');
export const 사이트 = 'https://www.kculturewire.com';
export const 클릭한도 = 3;

/** 그 지면의 HTML 에서 **우리 사이트 안쪽** 링크만 뽑는다 */
export function 안쪽링크(html, 여기 = 사이트) {
  const 나온것 = new Set();
  for (const m of html.matchAll(/href=["']([^"'#?]+)/g)) {
    let h = m[1];
    if (h.startsWith(여기)) h = h.slice(여기.length) || '/';
    if (!h.startsWith('/')) continue;              /* 밖으로 나가는 링크는 안 센다 */
    if (/\.(png|jpe?g|svg|mp4|xml|txt|json|css|js|ico|webp)$/i.test(h)) continue;
    나온것.add(h.replace(/\/$/, '') || '/');
  }
  return [...나온것];
}

/** 초안인가 — ⛔ 초안은 셈에서 뺀다 */
export function 초안인가(글) { return /^draft:\s*true\s*$/m.test(글); }

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };

  재본다('안쪽 링크를 뽑는다', 안쪽링크('<a href="/articles">x</a><a href="/about">y</a>'),
    ['/articles', '/about']);
  재본다('⛔ 밖으로 나가는 링크는 안 센다',
    안쪽링크('<a href="https://google.com/x">g</a><a href="/a">a</a>'), ['/a']);
  재본다('제 사이트 절대주소는 안쪽으로 센다',
    안쪽링크(`<a href="${사이트}/b">b</a>`), ['/b']);
  재본다('⛔ 그림·영상·xml 은 안 센다',
    안쪽링크('<a href="/a.png">p</a><a href="/s.xml">s</a><a href="/c">c</a>'), ['/c']);
  재본다('닻(#)과 물음표를 떼고 센다',
    안쪽링크('<a href="/a#top">t</a><a href="/a?x=1">q</a>'), ['/a']);
  재본다('끝 빗금을 떼어 같은 것으로 센다', 안쪽링크('<a href="/a/">a</a>'), ['/a']);
  재본다('뿌리는 「/」로 남는다', 안쪽링크(`<a href="${사이트}/">home</a>`), ['/']);
  재본다('같은 주소를 두 번 안 센다', 안쪽링크('<a href="/a">1</a><a href="/a">2</a>'), ['/a']);
  재본다('초안을 알아본다', 초안인가('---\ndraft: true\n---'), true);
  재본다('⭐ 기사방이 있다', fs.existsSync(기사방), true);

  console.log(`세 클릭 재는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 편들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md'))
    .filter((f) => !초안인가(fs.readFileSync(path.join(기사방, f), 'utf8')))
    .map((f) => `/article/${f.replace(/\.md$/, '')}`);
  console.log(`기사 ${편들.length}편 · 첫 화면(/)에서 ${클릭한도} 번까지 눌러 본다 — 라이브를 걷는다…`);

  const 깊이 = new Map([['/', 0]]);
  const 못받음 = new Map();
  let 이번층 = ['/'];

  for (let d = 0; d < 클릭한도; d += 1) {
    const 다음층 = [];
    for (const 길 of 이번층) {
      let html = null;
      try {
        const r = await fetch(사이트 + (길 === '/' ? '/' : 길),
          { headers: { 'User-Agent': 'KCultureWire-selfcheck/1.0' } });
        /* ⛔ 200 이 아니면 「링크 없음」이 아니라 「못 쟀다」다 */
        if (!r.ok) { 못받음.set(길, r.status); continue; }
        html = await r.text();
      } catch (e) { 못받음.set(길, String(e.message).slice(0, 30)); continue; }
      for (const h of 안쪽링크(html)) {
        if (깊이.has(h)) continue;
        깊이.set(h, d + 1);
        다음층.push(h);
      }
    }
    이번층 = 다음층;
    console.log(`  ${d + 1}클릭까지 — 닿은 주소 ${깊이.size}개 (이번에 새로 ${다음층.length}개)`);
  }

  const 닿음 = 편들.filter((p) => 깊이.has(p));
  const 못닿음 = 편들.filter((p) => !깊이.has(p));
  const 층별 = {};
  for (const p of 닿음) { const d = 깊이.get(p); 층별[d] = (층별[d] ?? 0) + 1; }

  console.log(`\n⭐ **세 클릭 안에 닿는 편 ${닿음.length} / ${편들.length}**`);
  console.log(`⛔ **못 닿는 편 ${못닿음.length}편**`);
  console.log('\n클릭 수별');
  for (const d of Object.keys(층별).sort()) console.log(`   ${d}클릭  ${층별[d]}편`);
  if (못받음.size) {
    console.log(`\n⚠ 못 쟀다(200 아님) ${못받음.size}개 — ${[...못받음].slice(0, 6).map(([k, v]) => `${k}(${v})`).join(', ')}`);
  }
  if (못닿음.length) {
    console.log(`\n못 닿는 편 — 앞 20편`);
    for (const p of 못닿음.slice(0, 20)) console.log(`   ${p}`);
  }
}
