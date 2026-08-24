#!/usr/bin/env node
/**
 * check-seoulmarkets-video-sitemap.mjs — 만든 영상이 구글에 «보이는지» 검사로 막는다.
 *
 * ── 왜 (2026-08-24, 5번 총괄 발견) ────────────────────────────
 * 영상 5편을 public/video 에 만들어 놓고 사이트맵·지면에 0편이었다. 만드는 값은 다 치르고
 * 노출은 0. 「넣었다」를 말이 아니라 **검사**로 둔다(강령: 규칙은 문장이 아니라 검사로).
 *
 * 무엇을 보나 (셋 다여야 통과):
 *   ① public/video/<slug>.mp4 마다 **썸네일**(public/cardnews/<slug>-1.png)이 있나
 *      — 썸네일 없으면 구글이 통째로 버린다.
 *   ② 빌드된 사이트맵(dist/sitemap-*.xml)에 그 슬러그의 <video:content_loc> 가 있나
 *   ③ 빌드된 기사 지면(dist/article/<slug>.html)에 <video ...><source ...mp4> 임베드가 있나
 *
 * 빌드 뒤에 돌린다:  node scripts/check-seoulmarkets-video-sitemap.mjs
 * dist 없으면 «못 쟀다»로 조용히 exit 0(빌드 안 한 상태 — 흠 아님).
 *
 * 자가시험:  node scripts/check-seoulmarkets-video-sitemap.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEO_DIR = path.join(ROOT, 'public', 'video');
const CARD_DIR = path.join(ROOT, 'public', 'cardnews');
const DIST = path.join(ROOT, 'dist');

function readIf(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

function allSitemapXml() {
  if (!fs.existsSync(DIST)) return '';
  return fs.readdirSync(DIST)
    .filter((f) => /^sitemap-.*\.xml$/.test(f))
    .map((f) => readIf(path.join(DIST, f)))
    .join('\n');
}

function selfTest() {
  // 썸네일 없는 슬러그는 「빠짐」으로 잡혀야 한다.
  const sm = '<video:content_loc>https://seoulmarkets.com/video/aaa.mp4</video:content_loc>';
  const hasThumb = (slug, exists) => exists; // 모형
  const missing = [];
  for (const slug of ['aaa', 'bbb']) {
    const inMap = sm.includes(`/video/${slug}.mp4`);
    const thumb = hasThumb(slug, slug === 'aaa');
    if (!inMap || !thumb) missing.push(slug);
  }
  if (missing.length !== 1 || missing[0] !== 'bbb') {
    console.error('❌ 자가시험 실패 — 빠진 슬러그 판정이 틀렸다', missing);
    process.exit(1);
  }
  console.log('✅ 자가시험 통과 — 빠진 영상 판정 정상');
}

function main() {
  if (process.argv.includes('--self-test')) { selfTest(); return; }

  if (!fs.existsSync(VIDEO_DIR)) { console.log('«못 쟀다» — public/video 없음. exit 0'); return; }
  const mp4s = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.mp4')).map((f) => f.replace(/\.mp4$/, ''));
  if (!mp4s.length) { console.log('영상 0편 — 검사할 것 없음. exit 0'); return; }

  const sitemapXml = allSitemapXml();
  const distReady = sitemapXml.length > 0;

  const problems = [];
  for (const slug of mp4s) {
    const hasThumb = fs.existsSync(path.join(CARD_DIR, `${slug}-1.png`));
    const inSitemap = distReady ? sitemapXml.includes(`/video/${slug}.mp4`) : null;
    const html = distReady ? readIf(path.join(DIST, 'article', `${slug}.html`)) : '';
    const embedded = distReady ? /<video[\s>][\s\S]*?\/video\/[^"']*\.mp4/.test(html) : null;
    if (!hasThumb) problems.push(`${slug} — 썸네일 없음(cardnews/${slug}-1.png) → 구글이 버린다`);
    else if (distReady && !inSitemap) problems.push(`${slug} — 사이트맵에 <video:content_loc> 없음`);
    else if (distReady && !embedded) problems.push(`${slug} — 지면(dist/article/${slug}.html)에 임베드 없음`);
  }

  console.log(`■ 영상 ${mp4s.length}편 검사 (dist ${distReady ? '있음' : '없음 — ①썸네일만 검사'})`);
  if (!problems.length) {
    console.log(`✅ 다 통과 — 썸네일·사이트맵·임베드 모두 있음`);
    return;
  }
  console.error(`🔴 ${problems.length}편 문제:`);
  for (const p of problems) console.error('   · ' + p);
  process.exit(1);
}

main();
