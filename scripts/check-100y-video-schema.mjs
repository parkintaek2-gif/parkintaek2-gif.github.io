#!/usr/bin/env node
/**
 * check-100y-video-schema.mjs — **구조화 자료가 또 깨지면 여기서 잡는다**
 *
 * 🔴 왜 만들었나 — 사장님이 8/21 에 Search Console 편지를 넘겨 주셨다.
 *   `100yearmap.com` 동영상 구조화 자료 문제 3개(썸네일 없음 · datetime 아님 · 시간대 없음).
 *   ⛔ **고친 것만으로는 다시 안 깨진다는 보장이 없다.** 영상이 한 개 늘 때마다 되돌아온다.
 *   ⇒ 손님이 실제로 받는 **결과물(dist)** 에서 JSON-LD 를 꺼내 세어 본다.
 *      「있나」가 아니라 **「몇 개가 맞나」**를 센다.
 *
 * ⛔ 소스를 안 본다. 결과물을 본다 — 소스가 맞아도 빌드가 빠뜨릴 수 있다.
 *
 * 쓰는 법
 *   node scripts/check-100y-video-schema.mjs
 *   node scripts/check-100y-video-schema.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 결과물 = path.join(뿌리, 'dist/100y/video.html');

/** datetime 인가 — 날짜만 있으면 안 되고, 시간대가 있어야 한다 */
export function 제대로된datetime(s) {
  if (typeof s !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(s);
}
/** ⛔ 0시가 박힌 값은 검사를 통과하려고 지어낸 것일 확률이 크다 */
export function 지어낸시각인가(s) {
  return typeof s === 'string' && /T00:00:00([+Z-]|$)/.test(s);
}
/** 그림 주소를 한 개든 여러 개든 배열로 받아 낸다 */
export function 그림들(v) {
  const t = v.thumbnailUrl;
  if (!t) return [];
  return Array.isArray(t) ? t.filter(Boolean) : [t];
}

/** 한 영상을 본다 — 무엇이 왜 틀렸는지까지 낸다 */
export function 본다한개(v) {
  const 흠 = [];
  const 그림 = 그림들(v);
  if (그림.length === 0) 흠.push('🔴 심각 — thumbnailUrl 이 없다');
  if (!v.uploadDate) 흠.push('🔴 uploadDate 가 없다');
  else if (!제대로된datetime(v.uploadDate)) 흠.push(`🔴 uploadDate 가 datetime 이 아니거나 시간대가 없다 — 「${v.uploadDate}」`);
  else if (지어낸시각인가(v.uploadDate)) 흠.push(`⚠ uploadDate 가 0시다 — 지어낸 값인지 보라 「${v.uploadDate}」`);
  if (!v.name) 흠.push('🔴 name 이 없다');
  if (!v.description) 흠.push('🔴 description 이 없다');
  return { 이름: v.name ?? '(이름 없음)', 그림, 흠 };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 날짜만 있으면 잡는다', !제대로된datetime('2026-08-20'));
  본다('② 시간대가 없으면 잡는다', !제대로된datetime('2026-08-20T19:59:04'));
  본다('③ 시간대가 붙으면 통과', 제대로된datetime('2026-08-20T19:59:04+09:00'));
  본다('④ 그림이 하나여도 배열이어도 센다',
    그림들({ thumbnailUrl: 'a' }).length === 1 && 그림들({ thumbnailUrl: ['a', 'b'] }).length === 2);
  본다('⑤ 그림이 없으면 0', 그림들({}).length === 0);
  const 나쁜 = 본다한개({ name: 'x', description: 'y', uploadDate: '2026-08-20' });
  본다('⑥ 옛 꼴(썸네일 없음 + 날짜만)을 흠 둘로 잡는다', 나쁜.흠.length === 2);
  const 좋은 = 본다한개({ name: 'x', description: 'y', uploadDate: '2026-08-20T19:59:04+09:00', thumbnailUrl: ['t'] });
  본다('⑦ 고친 꼴은 흠 0', 좋은.흠.length === 0);
  본다('⑧ ⛔ 0시를 박은 값은 통과시키지 않고 눈에 띄게 한다',
    본다한개({ name: 'x', description: 'y', uploadDate: '2026-08-20T00:00:00+09:00', thumbnailUrl: ['t'] }).흠.length === 1);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'check-100y-video-schema.mjs';
if (내가직접불렸나) {
  if (!fs.existsSync(결과물)) {
    console.log(`🔴 ${path.relative(뿌리, 결과물)} 이 없다 — 먼저 node scripts/build-once.mjs`);
    process.exit(1);
  }
  const 글 = fs.readFileSync(결과물, 'utf8');
  const 덩어리 = [...글.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]);

  const 영상 = [];
  const 걷는다 = (x) => {
    if (Array.isArray(x)) { x.forEach(걷는다); return; }
    if (!x || typeof x !== 'object') return;
    if (x['@type'] === 'VideoObject') 영상.push(x);
    for (const k of Object.keys(x)) 걷는다(x[k]);
  };
  for (const d of 덩어리) { try { 걷는다(JSON.parse(d)); } catch { /* 남의 덩어리일 수 있다 */ } }

  console.log(`결과물에서 찾은 VideoObject — ${영상.length}개\n`);
  let 맞은것 = 0;
  const 없는그림 = [];
  for (const v of 영상) {
    const r = 본다한개(v);
    if (r.흠.length === 0) {
      맞은것++;
      /* 🔴 주소만 있고 파일이 없으면 그것도 깨진 것이다 — 파일까지 본다 */
      for (const g of r.그림) {
        const 상대 = g.replace(/^https?:\/\/[^/]+/, '');
        if (!fs.existsSync(path.join(뿌리, 'dist/100y', 상대.replace(/^\/100y/, '').replace(/^\//, ''))
          .replace(/\\/g, '/'))
          && !fs.existsSync(path.join(뿌리, 'dist', 상대.replace(/^\//, '')))) 없는그림.push(`${r.이름} → ${상대}`);
      }
      console.log(`  ✅ ${r.이름}`);
      console.log(`     ${v.uploadDate} · ${v.duration ?? '(길이 없음)'} · 그림 ${r.그림.length}개`);
    } else {
      console.log(`  🔴 ${r.이름}`);
      for (const h of r.흠) console.log(`     ${h}`);
    }
  }

  console.log(`\n⇒ ${영상.length} 중 ${맞은것} 이 세 칸을 다 채웠다 (썸네일 · datetime · 시간대)`);
  if (없는그림.length) {
    console.log('🔴 주소는 있는데 파일이 없는 그림:');
    for (const g of 없는그림) console.log('  ', g);
  }
  if (영상.length === 0) { console.log('🔴 VideoObject 를 하나도 못 찾았다'); process.exitCode = 1; }
  else if (맞은것 !== 영상.length || 없는그림.length) process.exitCode = 1;
  else console.log('⛔ 지어낸 값 0개 — git 에 들어간 실제 시각과 영상에서 뽑은 실제 그림이다');
}
