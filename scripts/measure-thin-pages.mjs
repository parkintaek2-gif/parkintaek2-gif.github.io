#!/usr/bin/env node
/**
 * **작품 지면 530장 중 몇 장이 얇은가** — 색인이 안 되는 까닭을 자료로 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   2번 지시로 `site:kculturewire.com` 을 셌더니 **744장 중 80장**이었다.
 *   갈래로 갈라 보니 기사 41/67 · 그 밖 27/46 인데 **작품 지면은 12/530**이다.
 *   ⭐ 그러면 「색인이 작다」가 아니라 **「작품 지면이 안 들어간다」**가 참말이다.
 *   ⛔ 「구글이 게으르다」로 넘기지 않는다. **우리 지면이 얇은 것인지 먼저 잰다.**
 *
 * ── 무엇을 얇다고 하나 ────────────────────────────────────────
 *   ⛔ 바이트로 재지 않는다. 머리·꼬리·표 뼈대가 장마다 같아서 **빈 지면도 무겁다.**
 *   ⭐ **그 지면에만 있는 글자**를 잰다 — 장마다 다른 부분만.
 *   ⛔ 문턱을 손으로 고르지 않는다. **기사 지면의 가장 얇은 것**을 문턱으로 삼는다.
 *      기사는 41/67 이 색인됐으니 그 정도면 구글이 받아들인다는 뜻이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 지음방 = 'dist/wikitip';

/** 화면에 보이는 글자만. ⛔ 붙은 낱말이 생기지 않게 빈칸으로 바꾼다 */
export function 본문(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 여러 지면에 **공통으로 있는 조각**을 뺀다. 남는 것이 그 지면만의 글이다.
 * ⛔ 「가장 긴 공통 부분」을 찾지 않는다 — 느리고, 틀리면 조용히 틀린다.
 *   낱말 다발(5낱말)로 잘라 **절반 넘는 지면에 나오는 다발**을 뼈대로 본다.
 */
export function 뼈대낱말(글들, 다발 = 5) {
  const 셈 = new Map();
  for (const g of 글들) {
    const w = g.split(' ');
    const 본것 = new Set();
    for (let i = 0; i + 다발 <= w.length; i += 1) 본것.add(w.slice(i, i + 다발).join(' '));
    for (const k of 본것) 셈.set(k, (셈.get(k) ?? 0) + 1);
  }
  const 절반 = 글들.length / 2;
  return new Set([...셈].filter(([, n]) => n > 절반).map(([k]) => k));
}

/** 뼈대를 뺀 낱말 수 */
export function 저만의낱말(글, 뼈대, 다발 = 5) {
  const w = 글.split(' ');
  const 남 = [];
  for (let i = 0; i < w.length; i += 1) {
    const k = w.slice(i, i + 다발).join(' ');
    if (i + 다발 <= w.length && 뼈대.has(k)) { i += 다발 - 1; continue; }
    남.push(w[i]);
  }
  return 남.length;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('본문 — 표를 뗀다', 본문('<p>가 <b>나</b></p>'), '가 나');
  /* ⛔ 표를 그냥 지우면 낱말이 붙는다 */
  재본다('본문 — 낱말이 안 붙는다', 본문('<td>a</td><td>b</td>'), 'a b');
  재본다('본문 — script 를 통째로 뺀다', 본문('<script>x=1</script>가'), '가');
  const 글들 = [
    'the same head here one two three tail same words end',
    'the same head here four five six tail same words end',
    'the same head here seven eight nine tail same words end',
  ];
  const 뼈 = 뼈대낱말(글들, 3);
  재본다('뼈대를 찾는다', 뼈.has('the same head'), true);
  /* ⛔ 장마다 다른 부분은 뼈대가 아니다 */
  재본다('다른 부분은 뼈대가 아니다', 뼈.has('one two three'), false);
  const 남 = 저만의낱말(글들[0], 뼈, 3);
  재본다('저만의 낱말이 전체보다 적다', 남 < 글들[0].split(' ').length, true);
  재본다('저만의 낱말이 0 은 아니다', 남 > 0, true);
  console.log(`얇은 지면 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 읽는다 = (방) => {
    const p = `${지음방}/${방}`;
    if (!fs.existsSync(p)) return [];
    return fs.readdirSync(p).filter((f) => f.endsWith('.html'))
      .map((f) => ({ slug: f.replace(/\.html$/, ''), 글: 본문(fs.readFileSync(`${p}/${f}`, 'utf8')) }));
  };
  const 작품 = 읽는다('title');
  const 기사 = 읽는다('article');
  const 시장 = 읽는다('market');
  if (!작품.length || !기사.length) {
    console.log('⬜ dist 가 비었다 — 다른 창이 빌드 중일 수 있다. `node scripts/build-once.mjs` 뒤에 다시 부른다.');
    process.exit(1);
  }

  const 잰다 = (들) => {
    const 뼈 = 뼈대낱말(들.map((x) => x.글));
    return 들.map((x) => ({ slug: x.slug, 저만의: 저만의낱말(x.글, 뼈) }))
      .sort((a, b) => a.저만의 - b.저만의);
  };
  const 작품잰것 = 잰다(작품);
  const 기사잰것 = 잰다(기사);
  const 시장잰것 = 시장.length ? 잰다(시장) : [];

  /* ⛔ 문턱을 손으로 안 고른다 — **기사 중 가장 얇은 것**이 문턱이다 */
  const 문턱 = 기사잰것[0].저만의;
  const 얇은것 = 작품잰것.filter((x) => x.저만의 < 문턱);
  const 가운데 = (들) => (들.length ? 들[Math.floor(들.length / 2)].저만의 : null);

  console.log(`문턱 — 기사 중 가장 얇은 것: **${문턱}낱말** (${기사잰것[0].slug})`);
  console.log(`   ⭐ 기사는 41/67 이 색인됐다. 그 정도면 구글이 받는다는 뜻이라 이것을 문턱으로 쓴다\n`);
  const 줄 = (이름, 들) => {
    if (!들.length) { console.log(`${이름.padEnd(10)} 없다`); return; }
    const 얇 = 들.filter((x) => x.저만의 < 문턱).length;
    console.log(`${이름.padEnd(10)} ${String(들.length).padStart(4)}장 · 가운데 ${String(가운데(들)).padStart(5)}낱말 · 가장 얇은 것 ${String(들[0].저만의).padStart(4)} · 문턱 아래 ${String(얇).padStart(4)}장 (${(100 * 얇 / 들.length).toFixed(1)}%)`);
  };
  줄('기사', 기사잰것);
  줄('작품 지면', 작품잰것);
  줄('시장 지면', 시장잰것);

  console.log(`\n가장 얇은 작품 지면 열 장 — 이것들이 구글이 안 가져간 쪽이다`);
  for (const x of 작품잰것.slice(0, 10)) console.log(`  ${String(x.저만의).padStart(4)}낱말  /title/${x.slug}`);
  console.log(`\n작품 지면 ${작품잰것.length}장 중 문턱 아래가 ${얇은것.length}장이다.`);
  console.log('⚠ 이것이 「구글이 안 가져간 까닭」을 **증명하지는 않는다.** 얇다는 것만 잰 것이다.');
}
