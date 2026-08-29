#!/usr/bin/env node
/**
 * make-seoulmarkets-video-sound.mjs — **무성 영상에 «소리»를 붙인다.** (하루 1편)
 *
 * ── 왜 (2026-08-29 사장님 지시) ─────────────────────────────────────
 * 「무성 콘텐트 다신 만들지 말 것」·「무음 영상 하루에 1개씩 수정해서 올려. 기존 무음영상
 * 삭제하지 말고」. 5번(make-kcw-sound)이 KCW에 한 것을 SeoulMarkets 에도 똑같이 —
 * 규칙을 메모가 아니라 «도구»로 지킨다. 소리 = ①내레이션(신경망 목소리) ②배경음악(직접 합성).
 * ⛔ 남의 음원 안 씀(kcw-music 로 우리가 만든다). ⛔ 화면 카드에 없는 수를 목소리로 말하지 않는다.
 * ⛔ 무음 원본은 «지우지 않는다» — archive/video-silent/ 에 백업하고 라이브에 소리판을 올린다.
 *
 * 쓰는 법  node scripts/make-seoulmarkets-video-sound.mjs <slug> [--목소리 en-US-AndrewNeural]
 *          node scripts/make-seoulmarkets-video-sound.mjs --자가시험
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { 음악표본, wav바이트 } from './lib/kcw-music.mjs';
const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');
const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

/** ffmpeg stderr 의 "Duration: HH:MM:SS.ss" 를 초로. 못 읽으면 null(0으로 안 채운다). */
export function 길이초읽기(stderr) {
  const m = String(stderr).match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}
/** 말이 화면을 넘치나. 시작지연 0.4초 + 말길이 > 영상길이면 넘침. */
export function 넘치나(말초, 영상초, 지연 = 0.4) {
  if (!Number.isFinite(말초) || !Number.isFinite(영상초)) return true;
  return 지연 + 말초 > 영상초;
}
/** volumedetect 의 mean_volume dB. 못 읽으면 null. */
export function 평균dB읽기(stderr) {
  const m = String(stderr).match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
  return m ? parseFloat(m[1]) : null;
}

// ⚠ ffmpeg 는 정보를 stderr 로 낸다. 성공/실패 상관없이 stderr 를 읽어야 한다(spawnSync).
const 영상길이 = (파일) => 길이초읽기(spawnSync(ffmpeg, ['-i', 파일], { encoding: 'utf8' }).stderr || '');
const 평균dB = (파일) => 평균dB읽기(spawnSync(ffmpeg, ['-i', 파일, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '');

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 셈 = 0; const 본다 = (m, ok) => { 셈++; console.log(ok ? '✅' : '🔴', m); if (!ok) process.exitCode = 1; };
  본다('① Duration 파싱', 길이초읽기('  Duration: 00:00:23.97, start') === 23.97);
  본다('② Duration 없으면 null', 길이초읽기('no duration here') === null);
  본다('③ 말이 화면 넘으면 참', 넘치나(24, 20) === true);
  본다('④ 말이 화면 안이면 거짓', 넘치나(18, 23.97) === false);
  본다('⑤ 못 잰 값은 넘침으로(안전)', 넘치나(null, 20) === true);
  본다('⑥ mean_volume 파싱', 평균dB읽기('[Parsed_volumedetect] mean_volume: -21.3 dB') === -21.3);
  본다('⑦ 무음 dB 파싱', 평균dB읽기('mean_volume: -91.0 dB') === -91.0);
  본다('⑧ dB 없으면 null', 평균dB읽기('no volume') === null);
  console.log(`\n${process.exitCode ? '❌' : '✅'} make-seoulmarkets-video-sound 자가시험 (${셈})`);
  process.exit();
}

const slug = process.argv[2];
if (!slug || slug.startsWith('--')) { console.error('⛔ slug 를 준다: node scripts/make-seoulmarkets-video-sound.mjs <slug>'); process.exit(1); }
const 목소리 = (() => { const i = process.argv.indexOf('--목소리'); return i > 0 ? process.argv[i + 1] : 'en-US-AndrewNeural'; })();

// 원본(무음 바탕) — 기존 60편은 public/video 에, 새로 만든 바탕은 archive/video-silent 에 있다.
const 공개판 = path.join(뿌리, 'public', 'video', `${slug}.mp4`);
const 스테이징 = path.join(뿌리, 'archive', 'video-silent', `${slug}.mp4`);
const 원본 = fs.existsSync(공개판) ? 공개판 : 스테이징;
if (!fs.existsSync(원본)) { console.error(`⛔ 무음 바탕이 없다: ${공개판} 도 ${스테이징} 도 없음`); process.exit(1); }
const 낼길최종 = 공개판; // 소리판은 언제나 public/video 로 나간다

const 대본전체 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src', 'data', 'seoulmarkets-narration.json'), 'utf8'));
const 대본 = 대본전체.대본?.[slug];
if (!대본) { console.error(`⛔ seoulmarkets-narration.json 에 "${slug}" 대본이 없다. 먼저 대본을 쓴다(화면 카드에 맞게).`); process.exit(1); }

const 영상초 = 영상길이(원본);
if (영상초 == null) { console.error('⛔ 영상 길이를 못 쟀다 — 짐작으로 안 붙인다'); process.exit(1); }
console.log(`영상 ${slug} — ${영상초.toFixed(2)}초`);

const 임시 = fs.mkdtempSync(path.join(os.tmpdir(), 'smk-sound-'));
const 읽을것 = [대본.내레이션, 대본.설명].filter(Boolean).join(' ');

// ① 내레이션 (신경망 목소리)
const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
const tts = new MsEdgeTTS();
await tts.setMetadata(목소리, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
const { audioFilePath: 내레이션 } = await tts.toFile(임시, 읽을것);
const 말초 = 영상길이(내레이션);
if (넘치나(말초, 영상초)) {
  console.error(`🔴 말이 ${말초?.toFixed(2)}초 → 시작 0.4초 뒤 끝이 화면 ${영상초.toFixed(2)}초를 넘는다.`);
  console.error('   ⛔ 화면을 늘이지 않는다. 대본을 줄이거나 더 빠른 목소리로 바꾼다.');
  process.exit(1);
}
console.log(`  ✔ 내레이션 ${목소리} · 말 ${말초.toFixed(2)}초 (화면 ${영상초.toFixed(2)}초 안)`);

// ② 배경음악 (우리가 합성 — 남의 음원 아님)
const 음악 = path.join(임시, 'music.wav');
fs.writeFileSync(음악, wav바이트(음악표본(영상초, slug)));
console.log('  ✔ 배경음악 — 우리가 표본을 계산해 만들었다');

// ③ 무음 원본 백업 (⛔ 삭제 금지)
const 백업방 = path.join(뿌리, 'archive', 'video-silent');
fs.mkdirSync(백업방, { recursive: true });
const 백업 = path.join(백업방, `${slug}.mp4`);
if (!fs.existsSync(백업)) { fs.copyFileSync(원본, 백업); console.log(`  ✔ 무음 원본 백업 → archive/video-silent/${slug}.mp4 (지우지 않는다)`); }

// ④ mux — 목소리(앞) + 음악(배경) 을 영상에 붙인다
const 낼임시 = path.join(임시, 'out.mp4');
execFileSync(ffmpeg, [
  '-y', '-i', 원본, '-i', 내레이션, '-i', 음악,
  '-filter_complex',
  '[1:a]volume=1.35,adelay=400|400,aresample=44100[v];[2:a]volume=0.30,aresample=44100[m];[v][m]amix=inputs=2:duration=longest:dropout_transition=0,apad[a]',
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-shortest', 낼임시,
], { stdio: ['ignore', 'ignore', 'pipe'] });

// ⑤ 검산 — 소리가 실제로 붙었나(무음 아닌가)
const dB = 평균dB(낼임시);
if (dB == null) { console.error('⛔ 만든 판의 소리 크기를 못 쟀다 — 안 올린다'); process.exit(1); }
if (dB < -80) { console.error(`🔴 만든 판이 사실상 무음(${dB}dB) — 안 올린다`); process.exit(1); }
fs.mkdirSync(path.dirname(낼길최종), { recursive: true });
fs.copyFileSync(낼임시, 낼길최종);
console.log(`  ✔ 소리 붙였다 — 평균 ${dB.toFixed(1)}dB · public/video/${slug}.mp4 (라이브 경로)`);
console.log('완료. 배포하면 라이브에 소리판이 나간다. 무음 원본은 archive 에 남았다.');
