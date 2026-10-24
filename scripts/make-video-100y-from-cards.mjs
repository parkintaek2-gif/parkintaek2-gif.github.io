#!/usr/bin/env node
/**
 * make-video-100y-from-cards.mjs — 백년지도 카드뉴스(1080×1350) 다섯 장 → 세로 숏영상(1080×1920) + 한국어 목소리
 *
 * ── 왜 (2026-10-24 · 1번) ─────────────────────────────────────────────
 *   백년지도 영상은 주제마다 그림을 새로 그리는 자(make-video-100y-<주제>.mjs)만 있어서, 카드는 냈는데
 *   영상 몫이 0 이 됐다. KCW 의 make-kcw-short-from-cards.mjs 처럼 «이미 눈으로 본 카드»로 굽는다.
 *   목소리는 make-voice-100y.mjs (Windows SAPI Heami, 로컬) 를 그대로 쓴다.
 *
 * ── ⛔ 지키는 것 ───────────────────────────────────────────────────────
 * ⛔ 대본을 지어내지 않는다 — 부르는 사람이 --줄 로 준 문장만 읽는다. 화면 카드에 없는 수를 넣지 않는다.
 * ⛔ 소리 없이 내지 않는다 — 음량을 재서 −60 dB 보다 작으면 지우고 멈춘다.
 * ⛔ 카드가 다섯 장 다 없으면 안 굽는다. 목소리가 짧아도 화면은 안 자른다(apad).
 * ⛔ 이미 있는 파일을 덮어쓰지 않는다.
 *
 * 쓰는 법
 *   node scripts/make-video-100y-from-cards.mjs --카드 온라인학교 --낼 온라인학교 --줄 "문장1" --줄 "문장2"
 *     → public/100y/cardnews/온라인학교-1..5.png 를 읽어 public/100y/video/온라인학교.mp4 로 낸다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import { PS스크립트, 초읽기 } from './make-voice-100y.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(path.join(ROOT, 'package.json'));
const ffmpeg = require('ffmpeg-static');

const 값 = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const 줄들 = process.argv.flatMap((a, i) => (a === '--줄' ? [process.argv[i + 1]] : [])).filter(Boolean);
const 카드 = 값('--카드');
const 낼 = 값('--낼') ?? 카드;
const 장초 = Number(값('--장초') ?? 3.6);
if (!카드 || !줄들.length) { console.error('⛔ --카드 <이름> 과 --줄 "문장" 을 준다'); process.exit(1); }

const 카드길들 = [1, 2, 3, 4, 5].map((n) => path.join(ROOT, 'public', '100y', 'cardnews', `${카드}-${n}.png`));
const 없는 = 카드길들.filter((p) => !fs.existsSync(p));
if (없는.length) { console.error(`⛔ 카드가 다섯 장 다 없다 — 없는 것: ${없는.map((p) => path.basename(p)).join(', ')}`); process.exit(1); }
const 낼길 = path.join(ROOT, 'public', '100y', 'video', `${낼}.mp4`);
if (fs.existsSync(낼길)) { console.error(`⛔ 이미 있다 — 덮어쓰지 않는다: ${낼길}`); process.exit(1); }

const 임시 = path.join(ROOT, 'archive', '_tmp-100y-short', 낼);
fs.mkdirSync(임시, { recursive: true });

/* ① 목소리 — 줄마다 wav, 이어 붙인다 */
const ps1 = path.join(임시, 'voice.ps1');
fs.writeFileSync(ps1, '﻿' + PS스크립트(줄들, 임시), 'utf8');
execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1], { stdio: ['ignore', 'pipe', 'pipe'] });
const 목소리들 = 줄들.map((_, i) => path.join(임시, `${String(i).padStart(2, '0')}.wav`));
if (목소리들.some((p) => !fs.existsSync(p))) { console.error('🔴 목소리 파일이 안 나왔다 — 멈춘다'); process.exit(1); }
const 목소리목록 = path.join(임시, 'voice.txt');
fs.writeFileSync(목소리목록, 목소리들.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'), 'utf8');
const 합친목소리 = path.join(임시, 'voice.wav');
execFileSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', 목소리목록, '-c', 'copy', 합친목소리], { stdio: ['ignore', 'pipe', 'pipe'] });
const 말초 = 초읽기(합친목소리);
const 화면초 = 장초 * 5;
if (말초 > 화면초 - 0.5) { console.error(`🔴 말 ${말초.toFixed(2)}초가 화면 ${화면초}초를 넘는다 — 대본을 줄인다(화면을 늘리지 않는다)`); process.exit(1); }

/* ② 카드 → 9:16 영상 */
const 그림목록 = path.join(임시, 'cards.txt');
fs.writeFileSync(그림목록, 카드길들.map((p) => `file '${p.replace(/\\/g, '/')}'\nduration ${장초}`).join('\n') + `\nfile '${카드길들[4].replace(/\\/g, '/')}'`, 'utf8');
fs.mkdirSync(path.dirname(낼길), { recursive: true });
execFileSync(ffmpeg, [
  '-y', '-f', 'concat', '-safe', '0', '-i', 그림목록, '-i', 합친목소리,
  '-vf', 'scale=1080:1350,pad=1080:1920:0:285:color=0x11141c,fps=30',
  '-af', 'adelay=400|400,apad',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
  '-t', String(화면초), 낼길,
], { stdio: ['ignore', 'pipe', 'pipe'] });

/* ③ 재서 확인 — 무음이면 지운다 */
const 잼 = spawnSync(ffmpeg, ['-i', 낼길, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
const m = String(잼.stderr).match(/mean_volume:\s*(-?[\d.]+) dB/);
const dB = m ? Number(m[1]) : null;
if (dB == null || dB < -60) { fs.unlinkSync(낼길); console.error(`🔴 무음(${dB} dB) — 지우고 멈춘다`); process.exit(1); }
console.log(`✅ ${path.relative(ROOT, 낼길)} — 화면 ${화면초}초 · 말 ${말초.toFixed(2)}초 · 평균 ${dB} dB`);
