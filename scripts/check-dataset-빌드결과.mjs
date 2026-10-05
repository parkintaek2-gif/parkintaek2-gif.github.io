#!/usr/bin/env node
/**
 * check-dataset-빌드결과.mjs — **빌드 결과물(dist)의 Dataset 에 빠진 칸이 있나.**
 *
 * ── 🔴 왜 «dist» 를 보나 (2026-10-05 23:1x · 5번) ─────────────────────
 *   사장님이 넘겨 주신 구글 메일 — 「데이터세트 구조화된 데이터 문제가 감지됨」.
 *
 *   저장소를 보는 자(`check-dataset-구조화자료.mjs`)로 232파일을 찾아 세 레이아웃에
 *   채우기를 걸었다. 그런데 **dist 를 재 보니 269개가 그대로였다** —
 *   kcw 주간 지면은 레이아웃을 안 거치고 `build-kcw-week-pages.mjs` 가
 *   HTML 을 직접 찍기 때문이다.
 *   ⛔ 「레이아웃에 걸었으니 다 됐다」로 셀 뻔했다.
 *   ⭐ **손님과 구글이 받는 것은 dist 다.** 저장소가 아니라 그것을 재야 끝이다.
 *
 * ── 구글이 Dataset 에서 보는 칸 ──────────────────────────────────────
 *   꼭 있어야  name · description      (없으면 「잘못됨」)
 *   권하는 것  license · url · creator  (없으면 「항목 표시 개선」)
 *
 * 쓰는 법
 *   node scripts/check-dataset-빌드결과.mjs
 *   node scripts/check-dataset-빌드결과.mjs --자가시험
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 낸곳 = path.join(뿌리, 'dist');

export const 꼭있어야할칸 = ['name', 'description'];
export const 권하는칸 = ['license', 'url', 'creator'];

/** 그 덩이가 Dataset 인가 */
export function 데이터세트인가(것) {
  if (!것 || typeof 것 !== 'object') return false;
  const t = 것['@type'];
  return t === 'Dataset' || (Array.isArray(t) && t.includes('Dataset'));
}

/** 구조화 자료 덩이에서 Dataset 만 모은다 — @graph·배열·깊이 든 것 다 */
export function 데이터세트모으기(자료, 모은것 = []) {
  if (Array.isArray(자료)) { for (const x of 자료) 데이터세트모으기(x, 모은것); return 모은것; }
  if (!자료 || typeof 자료 !== 'object') return 모은것;
  if (데이터세트인가(자료)) 모은것.push(자료);
  for (const k of Object.keys(자료)) {
    const v = 자료[k];
    if (v && typeof v === 'object') 데이터세트모으기(v, 모은것);
  }
  return 모은것;
}

/** 한 지면 글에서 ld+json 을 뽑아 Dataset 을 센다 */
export function 지면에서세기(글) {
  const 것 = { 덩이: 0, 빠짐: {} };
  const 조각들 = String(글 ?? '').match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!조각들) return 것;
  for (const s of 조각들) {
    const 속 = s.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/i, '');
    let j;
    try { j = JSON.parse(속); } catch { continue; }   /* ⛔ 못 읽으면 건너뛴다. 0 으로 치지 않는다 */
    for (const d of 데이터세트모으기(j)) {
      것.덩이 += 1;
      for (const 칸 of [...꼭있어야할칸, ...권하는칸]) {
        if (!d[칸]) 것.빠짐[칸] = (것.빠짐[칸] ?? 0) + 1;
      }
    }
  }
  return 것;
}

/** 2026-10-05 23:1x 에 고친 뒤의 수. 늘면 막는다 */
export const 못박은_빠진덩이 = 0;

export function 판정(빠짐, 못박은수 = 못박은_빠진덩이) {
  const 합 = Object.values(빠짐 ?? {}).reduce((a, b) => a + b, 0);
  if (합 > 못박은수) {
    const 글 = Object.entries(빠짐).map(([k, v]) => `${k} ${v}`).join(' · ');
    return { 빛: '🔴', 말: `Dataset 에 빠진 칸 ${합}개 — ${글} (못 박은 수 ${못박은수})` };
  }
  return { 빛: '✅', 말: `빌드 결과물의 Dataset 에 빠진 칸이 없다` };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 본다 = (말, 참) => { if (참) { 통과++; console.log(`  ✅ ${말}`); } else { 깨짐++; console.log(`  🔴 ${말}`); } };

  console.log('\n■ Dataset 빌드 결과 — 자가시험\n');

  const 싸기 = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

  본다('한 덩이를 센다', 지면에서세기(싸기({ '@type': 'Dataset', name: 'a' })).덩이 === 1);
  본다('🔴 빠진 칸을 센다',
    지면에서세기(싸기({ '@type': 'Dataset', name: 'a' })).빠짐.license === 1);
  본다('다 있으면 안 센다',
    Object.keys(지면에서세기(싸기({ '@type': 'Dataset', name: 'a', description: 'b', license: 'c', url: 'd', creator: {} })).빠짐).length === 0);
  본다('🔴 @graph 안쪽도 센다 — 우리 지면 대부분이 이 꼴이다',
    지면에서세기(싸기({ '@graph': [{ '@type': 'Dataset', name: 'a' }, { '@type': 'FAQPage' }] })).덩이 === 1);
  본다('⛔ FAQPage 는 안 센다',
    지면에서세기(싸기({ '@type': 'FAQPage' })).덩이 === 0);
  본다('⛔ 못 읽는 자료는 건너뛴다 — 0 으로 치지 않는다',
    지면에서세기('<script type="application/ld+json">{깨진</script>').덩이 === 0);
  본다('ld+json 이 없으면 0', 지면에서세기('<html></html>').덩이 === 0);
  본다('@type 이 배열이어도 알아본다',
    데이터세트인가({ '@type': ['Dataset', 'CreativeWork'] }) === true);
  본다('덩이가 둘이면 둘로 센다',
    지면에서세기(싸기({ '@type': 'Dataset', name: 'a' }) + 싸기({ '@type': 'Dataset', name: 'b' })).덩이 === 2);
  본다('🔴 빠진 것이 있으면 막는다', 판정({ license: 1 }).빛 === '🔴');
  본다('없으면 통과', 판정({}).빛 === '✅');
  본다('⛔ 빈 글에도 안 터진다', 지면에서세기(null).덩이 === 0);

  console.log(`\n  통과 ${통과} · 깨짐 ${깨짐}\n`);
  return 깨짐 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────── */
const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
}

/** dist 를 훑어 센다. 되돌리는 것은 `{ 덩이, 빠짐, 지면수, 잴수있나 }` */
export function 빌드결과잰다(곳 = 낸곳) {
  if (!fs.existsSync(곳)) return { 덩이: 0, 빠짐: {}, 지면수: 0, 잴수있나: false };
  const 파일들 = [];
  const 훑기 = (d) => {
    for (const x of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, x.name);
      if (x.isDirectory()) { 훑기(p); continue; }
      if (x.name.endsWith('.html')) 파일들.push(p);
    }
  };
  훑기(곳);

  let 덩이 = 0; let 지면수 = 0;
  const 빠짐 = {};
  for (const f of 파일들) {
    let 글 = '';
    try { 글 = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const r = 지면에서세기(글);
    if (!r.덩이) continue;
    덩이 += r.덩이; 지면수 += 1;
    for (const [k, v] of Object.entries(r.빠짐)) 빠짐[k] = (빠짐[k] ?? 0) + v;
  }
  return { 덩이, 빠짐, 지면수, 잴수있나: true };
}

if (내가실행됐다) {
  console.log('■ 빌드 결과물(dist)의 Dataset 에 빠진 칸이 있나');
  console.log('   사장님이 넘겨 주신 구글 메일 — 「데이터세트 구조화된 데이터 문제가 감지됨」');
  console.log('   ⭐ 손님과 구글이 받는 것은 dist 다. 저장소가 아니라 그것을 재야 끝이다\n');

  const r = 빌드결과잰다();
  if (!r.잴수있나) {
    console.log('⚠ dist 가 없다 — 못 쟀다. 먼저 node scripts/build-once.mjs');
    process.exit(0);                        /* ⛔ 못 잰 것으로 막지 않는다 */
  }
  console.log(`   Dataset 덩이 ${r.덩이}개 · 담은 지면 ${r.지면수}장`);
  const 글 = Object.entries(r.빠짐).map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`   빠진 칸 — ${글 || '없다'}`);

  const 판 = 판정(r.빠짐);
  console.log(`\n${판.빛} ${판.말}`);
  process.exit(판.빛 === '🔴' ? 1 : 0);
}
