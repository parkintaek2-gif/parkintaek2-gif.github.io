#!/usr/bin/env node
/**
 * make-video-seoulmarkets.mjs — 카드뉴스 → 세로 숏영상 (사장님 지시 2026-08-14)
 *
 *   *「숏동영상도 하루에 하나씩 만들어 배포까지」*
 *
 * ## 어떻게 만드나
 *   이미 만든 카드뉴스(public/cardnews/<slug>-N.png)를 **그대로 이어 붙인다.**
 *   영상 편집기를 쓰지 않는다 — 사람 손이 들어가면 매번 달라진다.
 *   ⭐ 카드뉴스와 같은 글자·색·말투가 저절로 유지된다.
 *
 * ## ⚠ 규격
 *   1080×1920(세로 9:16) · 30fps · 소리 없음(대부분 음소거로 본다).
 *   카드뉴스는 1080×1350 이라 위아래를 브랜드 바탕(#0d1420)으로 채운다.
 *   한 장당 4초. 5장이면 20초.
 *
 * ## ⛔ 지킴선
 *   · out/ 에 두지 않는다 — gitignore 라 배포에 안 실린다(3번이 겪음).
 *     public/video/ 에 둔다. 사이트로 나간다.
 *   · 겁주지 않는다 · 숫자는 카드뉴스(=라이브 검산분)에서 온 것만.
 *
 * 실행:  node scripts/make-video-seoulmarkets.mjs <slug>
 * 출력:  public/video/<slug>.mp4
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

const slug = process.argv[2];
if (!slug) { console.error('⛔ slug 를 준다: node scripts/make-video-seoulmarkets.mjs <slug>'); process.exit(1); }

const 바탕 = '#0d1420';
const 폭 = 1080, 높 = 1920, 초당장 = 4; // 한 장 4초

// 카드뉴스 슬라이드 모으기
const 카드방 = path.join(ROOT, 'public', 'cardnews');
const 장 = [];
for (let i = 1; i <= 12; i++) {
  const p = path.join(카드방, `${slug}-${i}.png`);
  if (fs.existsSync(p)) 장.push(p); else break;
}
if (!장.length) { console.error(`⛔ public/cardnews/${slug}-N.png 가 없다. 먼저 카드뉴스를 만든다.`); process.exit(1); }

// 9:16 으로 위아래 채워 임시 프레임 만들기
const 임시 = fs.mkdtempSync(path.join(os.tmpdir(), 'smk-video-'));
const 프레임 = [];
for (let i = 0; i < 장.length; i++) {
  const out = path.join(임시, `${String(i).padStart(3, '0')}.png`);
  const 속 = await sharp(장[i]).resize(폭, 높, { fit: 'contain', background: 바탕 }).png().toBuffer();
  await sharp(속).toFile(out);
  프레임.push(out);
}

// concat 목록 (마지막 장은 duration 뒤에 한 번 더 적어야 마지막 장이 유지된다)
const 목록 = [];
for (const f of 프레임) { 목록.push(`file '${f.replace(/\\/g, '/')}'`); 목록.push(`duration ${초당장}`); }
목록.push(`file '${프레임[프레임.length - 1].replace(/\\/g, '/')}'`);
const 목록길 = path.join(임시, 'list.txt');
fs.writeFileSync(목록길, 목록.join('\n'));

// 낼 자리 — public/video (배포에 실린다)
const 낼방 = path.join(ROOT, 'public', 'video');
fs.mkdirSync(낼방, { recursive: true });
const 낼길 = path.join(낼방, `${slug}.mp4`);

execFileSync(ffmpeg, [
  '-y', '-f', 'concat', '-safe', '0', '-i', 목록길,
  '-vf', `scale=${폭}:${높}:force_original_aspect_ratio=decrease,pad=${폭}:${높}:(ow-iw)/2:(oh-ih)/2:color=${바탕.replace('#', '0x')},format=yuv420p`,
  '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  낼길,
], { stdio: ['ignore', 'ignore', 'inherit'] });

// 임시 치우기
for (const f of 프레임) fs.rmSync(f, { force: true });
fs.rmSync(목록길, { force: true });
fs.rmSync(임시, { recursive: true, force: true });

const 초 = 장.length * 초당장;
console.log(`숏영상 1편 · ${장.length}장 · ${초}초 → ${path.relative(ROOT, 낼길)}`);
console.log('⚠ 한 번 열어 글이 읽히는지 보고 커밋한다. /video 지면에 링크해 배포한다.');
