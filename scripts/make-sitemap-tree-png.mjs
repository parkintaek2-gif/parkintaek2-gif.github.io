#!/usr/bin/env node
/**
 * make-sitemap-tree-png.mjs — 나무 SVG 를 PNG 로도 낸다.
 *
 * 왜: 사장님이 「이미지 파일로」라고 하셨다. SVG 는 브라우저로 열리지만 PNG 는
 *   윈도우에서 두 번 눌러 바로 보인다. 둘 다 둔다.
 *
 * ⛔ b.close() 를 부르지 않는다 — 사장님이 쓰시던 창이 통째로 닫힌다. disconnect() 로 뗀다.
 * ⭐ 언제나 «새 탭»을 연다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
const 방 = path.join(뿌리, 'docs/사이트맵');

const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');

const 것들 = fs.readdirSync(방).filter((f) => f.endsWith('.svg'));
if (!것들.length) { console.log('🔴 SVG 가 없다 — 먼저 node scripts/make-sitemap-tree.mjs'); process.exit(1); }

const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await b.newPage();
try {
  for (const f of 것들) {
    const svg = fs.readFileSync(path.join(방, f), 'utf8');
    const w = Number(svg.match(/width="(\d+)"/)?.[1] ?? 1180);
    const h = Number(svg.match(/height="(\d+)"/)?.[1] ?? 800);
    await page.setViewport({ width: w, height: Math.min(h, 30000), deviceScaleFactor: 2 });
    await page.setContent(`<body style="margin:0;background:#fff">${svg}</body>`, { waitUntil: 'load' });
    const 낼길 = path.join(방, f.replace(/\.svg$/, '.png'));
    await page.screenshot({ path: 낼길, fullPage: true });
    const 크기 = (fs.statSync(낼길).size / 1024).toFixed(0);
    console.log(`  ✅ ${path.basename(낼길)} — ${w}×${h} · ${크기} KB`);
  }
} finally {
  await page.close();
  b.disconnect();          // ⛔ close() 가 아니다
}
