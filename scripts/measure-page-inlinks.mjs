#!/usr/bin/env node
/**
 * **그 지면으로 가는 길이 몇 개인가** — 색인이 안 되는 까닭을 얇기 말고 다른 쪽에서 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   744장 중 80장이 색인됐고, 안 들어간 것은 자로 찍어 낸 623장이다.
 *   ⛔ 처음엔 **얇아서**라고 생각했다. 그런데 재 보니 아니었다 —
 *      색인된 12장 중 **5장이 시장 한 곳짜리**(전체 비중은 25.7%)다.
 *      `one-on-one` 은 1시장·1자리·1주 인데 들어갔다. **얇기로는 설명이 안 된다.**
 *   ⭐ 그러면 남은 큰 후보는 **길**이다. 구글은 링크를 타고 온다.
 *      사이트맵에만 있고 어느 지면에서도 안 걸린 지면은 **고아**다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **지은 것(dist)에서 잰다.** 소스에서 세면 실제로 나간 링크와 다를 수 있다.
 * ⛔ 자기 자신으로 가는 링크는 안 센다. 그러면 모든 지면이 최소 1이 된다.
 * ⚠ 이것도 **구글의 까닭을 보는 것이 아니다.** 우리 쪽 길을 세는 것이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 지음방 = 'dist/wikitip';

/** 그 글 안의 우리 쪽 링크. ⛔ 밖으로 나가는 것과 닻(#)은 뺀다 */
export function 링크들(html) {
  const 나온것 = [];
  for (const m of String(html).matchAll(/href\s*=\s*["']([^"']+)["']/g)) {
    const h = m[1].trim();
    if (!h.startsWith('/')) continue;          /* 밖 · 닻 · mailto */
    나온것.push(h.split('#')[0].split('?')[0].replace(/\/$/, '') || '/');
  }
  return 나온것;
}

/** dist 안의 html 을 주소로 바꾼다. `title/x.html` → `/title/x` */
export function 주소(파일) {
  const p = String(파일).replace(/\\/g, '/').replace(/\.html$/, '');
  return p === 'index' ? '/' : `/${p.replace(/\/index$/, '')}`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('링크를 뽑는다', 링크들('<a href="/titles">x</a>'), ['/titles']);
  /* ⛔ 밖으로 나가는 것은 안 센다 */
  재본다('밖은 안 센다', 링크들('<a href="https://netflix.com">x</a>'), []);
  재본다('닻과 물음표를 뗀다', 링크들('<a href="/a?b=1#c">x</a>'), ['/a']);
  재본다('꼬리 빗금을 뗀다', 링크들('<a href="/a/">x</a>'), ['/a']);
  재본다('작은따옴표도 읽는다', 링크들("<a href='/z'>x</a>"), ['/z']);
  재본다('주소 — index', 주소('index.html'), '/');
  재본다('주소 — 아래 방', 주소('title/stepmom.html'), '/title/stepmom');
  console.log(`길 세기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(지음방)) {
    console.log('⬜ dist 가 없다 — `node scripts/build-once.mjs` 뒤에 다시 부른다.');
    process.exit(1);
  }
  /* dist 를 훑는다 */
  const 파일들 = [];
  const 걷는다 = (방, 앞= '') => {
    for (const e of fs.readdirSync(`${지음방}/${방}`, { withFileTypes: true })) {
      const 안 = 앞 ? `${앞}/${e.name}` : e.name;
      if (e.isDirectory()) 걷는다(`${방}/${e.name}`, 안);
      else if (e.name.endsWith('.html')) 파일들.push(안);
    }
  };
  걷는다('.');
  if (!파일들.length) {
    console.log('⬜ dist 가 비었다 — 다른 창이 빌드 중일 수 있다. 다시 짓고 부른다.');
    process.exit(1);
  }

  const 들어오는길 = new Map(파일들.map((f) => [주소(f), 0]));
  for (const f of 파일들) {
    const 나 = 주소(f);
    const 본것 = new Set(링크들(fs.readFileSync(`${지음방}/${f}`, 'utf8')));
    for (const h of 본것) {
      if (h === 나) continue;                       /* ⛔ 자기 자신은 안 센다 */
      if (들어오는길.has(h)) 들어오는길.set(h, 들어오는길.get(h) + 1);
    }
  }

  const 갈래 = (p) => (p.startsWith('/article/') ? '기사'
    : p.startsWith('/title/') ? '작품 지면'
      : p.startsWith('/market/') ? '시장 지면'
        : p.startsWith('/firm/') ? '회사 지면' : '그 밖의 지면');
  const 통 = new Map();
  for (const [p, n] of 들어오는길) {
    const g = 갈래(p);
    if (!통.has(g)) 통.set(g, []);
    통.get(g).push(n);
  }
  const 가운데 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

  /* 🔴 길이 0 인 지면은 **고아**다. 사이트맵에만 있으면 구글은 그것을 가장 약한 신호로 본다 */
  const 고아 = [...들어오는길].filter(([, n]) => n === 0).map(([p]) => p);
  if (고아.length) {
    const sm = fs.existsSync(`${지음방}/sitemap.xml`) ? fs.readFileSync(`${지음방}/sitemap.xml`, 'utf8') : '';
    console.log(`🔴 어느 지면에서도 안 걸리는 고아 ${고아.length}장`);
    for (const p of 고아) {
      console.log(`   ${p}   (사이트맵에 ${sm.includes(`kculturewire.com${p}<`) ? '있다 — 구글은 여기서만 안다' : '없다 — 아무 데서도 안 보인다'})`);
    }
    console.log('');
  }

  console.log(`지은 지면 ${파일들.length}장 — **들어오는 길** 수\n`);
  console.log('갈래          장수   가운데   길 0인 것   길 1인 것');
  for (const [g, a] of [...통].sort((x, y) => y[1].length - x[1].length)) {
    const 영 = a.filter((n) => n === 0).length;
    const 하나 = a.filter((n) => n === 1).length;
    console.log(`${g.padEnd(12)} ${String(a.length).padStart(4)} ${String(가운데(a)).padStart(7)} ${String(영).padStart(9)} ${String(하나).padStart(10)}`);
  }

  /* 색인된 작품 지면과 안 된 것을 맞대 본다 */
  const 색인 = ['stepmom', 'seoul-vibe', 'project-y', 'bad-guys', 'the-way-back', 'one-on-one',
    'the-crowned-clown', 'the-killing-vote', 'the-devil-s-plan', 'can-this-love-be-translated',
    'the-world-of-the-married', 'the-secret-life-of-my-secretary'];
  const 작품 = [...들어오는길].filter(([p]) => p.startsWith('/title/'));
  const 안 = 작품.filter(([p]) => 색인.includes(p.slice(7))).map(([, n]) => n);
  const 밖 = 작품.filter(([p]) => !색인.includes(p.slice(7))).map(([, n]) => n);
  if (안.length) {
    console.log(`\n작품 지면 — 구글이 가져간 것과 아닌 것`);
    console.log(`  색인된 ${안.length}장   길 가운데 ${가운데(안)} · 최소 ${Math.min(...안)} · 최대 ${Math.max(...안)}`);
    console.log(`  안 된 ${밖.length}장   길 가운데 ${가운데(밖)} · 최소 ${Math.min(...밖)} · 최대 ${Math.max(...밖)}`);
    console.log('  ⚠ 12장은 적다. 여기서 「이것이 까닭이다」로 넘어가지 않는다.');
  }
}
