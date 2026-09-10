#!/usr/bin/env node
/**
 * make-kcw-short-from-cards.mjs — **이미 만든 9:16 카드로 숏영상을 굽는다.**
 *
 *   node scripts/make-kcw-short-from-cards.mjs --자가시험
 *   node scripts/make-kcw-short-from-cards.mjs --기사=<slug> --낸다
 *   node scripts/make-kcw-short-from-cards.mjs --기사=<slug> --낸다 --장초=3.4
 *
 * ── 🔴 왜 만드나 (2026-09-10) ────────────────────────────────────────────
 *
 * 오늘 몫이 텍스트 2/6 · 카드 1/1 · **영상 0/1** 이었다. KCW 영상 53편은 있는데
 * 그것을 «새로 굽는 자»가 이 저장소에 없었다 — 소리를 입히는 자(make-kcw-sound)와
 * 목록·스키마를 짓는 자만 있었다. 그래서 영상 몫이 매일 0 이 될 구조였다.
 *
 * ⭐ 새 그림을 그리지 않는다. **이미 눈으로 확인한 카드**를 쓴다 —
 *   `make-kcw-cardnews.mjs` 가 낸 9:16 다섯 장. 그 자는
 *   ⛔ 문안을 지어내지 않고(기사 앞말에서만) ⛔ 모든 장에 주소를 박고
 *   ⛔ 한계 카드를 뺄 수 없게 되어 있다. 그 규율을 영상이 그대로 물려받는다.
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────────────
 * ```
 * ⛔ 카드가 다섯 장 다 없으면 «만들지 않는다». 넉 장으로 굽지 않는다 —
 *   빠지는 장이 한계 카드일 수 있고, 그러면 수만 예쁘게 실려 나간다
 * ⛔ 소리 없이 내지 않는다 — 사장님 「무성 콘텐트 다신 만들지 말 것」.
 *   그래서 이 자는 «무음판을 만들고 끝나지 않는다». 대본이 없으면 아예 안 굽는다
 * ⛔ 대본을 지어내지 않는다 — src/data/kcw-narration.json 에 사람이 적은 것만 읽는다
 * ⛔ 「만들었다」로 끝내지 않는다. 음량을 재서 −60 dB 보다 커야 «됐다»다
 * ⛔ 이미 있는 파일을 덮어쓰지 않는다 — 덮으면 어제 것이 조용히 사라진다
 * ```
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ffmpeg경로 from 'ffmpeg-static';

const ROOT = process.cwd();
export const 카드방 = 'public/wikitip/cardnews';
export const 영상방 = 'public/wikitip/video';
export const 대본길 = 'src/data/kcw-narration.json';

/** 한 장을 몇 초 보일까 — 다섯 장 × 3.4초 ≈ 17초. 쇼츠에 맞는 길이다 */
export const 기본장초 = 3.4;
/** 소리가 «난다」고 볼 선. 무음판이 −91 dB, 우리 소리판이 −23 dB 였다 */
export const 소리선 = -60;

/* ── 재는 함수들 ───────────────────────────────────────────────────── */

/** 9:16 카드 다섯 장의 길. ⛔ 다섯 장이 다 없으면 null */
export function 카드길들(slug, 있나 = null) {
  const 봐 = 있나 ?? ((p) => fs.existsSync(path.join(ROOT, p)));
  const 것 = [];
  for (let i = 1; i <= 5; i += 1) {
    const p = `${카드방}/${slug}-v-${i}.png`;
    if (!봐(p)) return null;                 /* ⛔ 넉 장으로 굽지 않는다 */
    것.push(p);
  }
  return 것;
}

/** 대본을 읽는다. ⛔ 없으면 null — 지어내지 않는다 */
export function 대본읽기(slug, 글 = null) {
  let j;
  try { j = JSON.parse(글 ?? fs.readFileSync(path.join(ROOT, 대본길), 'utf8')); } catch { return null; }
  const 방 = j?.대본;
  if (!방 || typeof 방 !== 'object') return null;
  const 그것 = 방[slug];
  if (!그것) return null;
  const 내레이션 = String(그것.내레이션 ?? '').trim();
  if (!내레이션) return null;
  return { 제목: String(그것.제목 ?? '').trim() || null, 내레이션, 설명: 그것.설명 ?? null };
}

/**
 * ffmpeg 의 concat 대본.
 *
 * ⛔ 마지막 장을 «한 번 더» 적는다 — concat demuxer 는 마지막 항목의 duration 을 무시해서,
 *   안 적으면 끝 장이 한 칸 만에 지나간다.
 * 🔴 [2026-09-10 실측] 상대경로를 적었다가 죽었다. concat 목록 안의 길은 «목록 파일이 있는
 *   폴더»를 기준으로 풀린다 — 내가 저장소 뿌리 기준으로 적었더니 ffmpeg 이
 *   `archive/_tmp-short/public/wikitip/cardnews/…` 를 찾았다.
 *   ⇒ 절대경로로 적는다. 짐작하지 말고 «누구 기준인가»를 확인해야 하는 자리다.
 */
export function 이어붙일대본(길들, 장초 = 기본장초, 뿌리 = ROOT) {
  if (!Array.isArray(길들) || !길들.length) return null;
  const 절대 = (p) => (path.isAbsolute(p) ? p : path.join(뿌리, p)).split(path.sep).join('/');
  const 줄 = [];
  for (const p of 길들) {
    줄.push(`file '${절대(p)}'`);
    줄.push(`duration ${장초}`);
  }
  줄.push(`file '${절대(길들[길들.length - 1])}'`);
  return `${줄.join('\n')}\n`;
}

/** ffmpeg 이 찍은 글에서 평균 음량을 뽑는다. ⛔ 못 읽으면 null (0 이 아니다) */
export function 음량읽기(글) {
  const m = String(글 ?? '').match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
  return m ? Number(m[1]) : null;
}

/** 소리가 «나나» — ⛔ 「트랙이 있나」가 아니다 */
export function 소리나나(음량, 선 = 소리선) {
  if (!Number.isFinite(음량)) return { 난다: false, 까닭: '음량을 못 쟀다' };
  if (음량 <= 선) return { 난다: false, 까닭: `${음량} dB — 무음이다 (선 ${선} dB)` };
  return { 난다: true, 까닭: null };
}

/** 낼 이름 — ⛔ 이미 있으면 null 을 준다. 덮어쓰지 않는다 */
export function 낼이름(slug, 있나 = null) {
  const 봐 = 있나 ?? ((p) => fs.existsSync(path.join(ROOT, p)));
  const p = `${영상방}/${slug}-voiced.mp4`;
  return 봐(p) ? null : p;
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('카드길들: 다섯 장을 찾는다', (() => {
    const r = 카드길들('x', () => true);
    return Array.isArray(r) && r.length === 5 && r[0].endsWith('x-v-1.png');
  })());
  재다('🔴 카드길들: 한 장이라도 없으면 null — 넉 장으로 굽지 않는다', (() => {
    const r = 카드길들('x', (p) => !p.endsWith('-v-3.png'));
    return r === null;
  })());
  재다('⛔ 카드길들: 하나도 없으면 null', 카드길들('x', () => false) === null);

  const 대본글 = JSON.stringify({ 대본: { good: { 제목: 'T', 내레이션: 'N words here' }, empty: { 내레이션: '  ' } } });
  재다('대본읽기: 적힌 것을 읽는다', (() => {
    const r = 대본읽기('good', 대본글);
    return r.내레이션 === 'N words here' && r.제목 === 'T';
  })());
  재다('🔴 대본읽기: 없는 것은 null — 지어내지 않는다', 대본읽기('nope', 대본글) === null);
  재다('🔴 대본읽기: 내레이션이 비었으면 null', 대본읽기('empty', 대본글) === null);
  재다('⛔ 대본읽기: 파일이 깨졌으면 null', 대본읽기('good', '{{{') === null);

  재다('이어붙일대본: 장마다 duration 이 붙는다', (() => {
    const s = 이어붙일대본(['a.png', 'b.png'], 3, '/R');
    return /duration 3/.test(s) && s.split('\n').filter((l) => l.startsWith('file')).length === 3;
  })());
  재다('🔴 이어붙일대본: 마지막 장을 «한 번 더» 적는다 — 안 적으면 끝 장이 한 칸 만에 지나간다', (() => {
    const s = 이어붙일대본(['a.png', 'b.png'], 3, '/R').trim().split('\n');
    return /b\.png'$/.test(s[s.length - 1]);
  })());
  재다('🔴 이어붙일대본: 길을 «절대경로»로 적는다 — 상대경로는 목록 파일 기준으로 풀려 죽는다',
    /file '\/R\/a\.png'/.test(이어붙일대본(['a.png'], 3, '/R')));
  재다('⛔ 이어붙일대본: 빈 것은 null', 이어붙일대본([]) === null && 이어붙일대본(null) === null);

  재다('음량읽기: mean_volume 을 뽑는다', 음량읽기('[Parsed] mean_volume: -23.4 dB') === -23.4);
  재다('음량읽기: 무음판도 뽑는다', 음량읽기('mean_volume: -91.0 dB') === -91);
  재다('🔴 음량읽기: 못 읽으면 null — 0 이 아니다', 음량읽기('아무 글') === null && 음량읽기(null) === null);

  재다('소리나나: −23 dB 는 난다', 소리나나(-23).난다 === true);
  재다('🔴 소리나나: −91 dB 는 «안 난다» — 트랙이 있어도 무음이다', (() => {
    const r = 소리나나(-91);
    return r.난다 === false && /무음/.test(r.까닭);
  })());
  재다('⛔ 소리나나: 못 쟀으면 안 난다로 본다', 소리나나(null).난다 === false);
  재다('소리나나: 선 위에 딱 걸치면 안 난다 (-60)', 소리나나(-60).난다 === false);

  재다('낼이름: 없으면 이름을 준다', 낼이름('x', () => false) === 'public/wikitip/video/x-voiced.mp4');
  재다('🔴 낼이름: 이미 있으면 null — 덮으면 어제 것이 조용히 사라진다',
    낼이름('x', () => true) === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 굽지 않는다.'); process.exit(1); }
console.log('');

const 인자 = (이름, 기본 = null) => {
  const 짝 = process.argv.find((a) => a.startsWith(`--${이름}=`));
  return 짝 ? 짝.slice(이름.length + 3) : 기본;
};
const slug = 인자('기사');
const 장초 = Number(인자('장초', String(기본장초))) || 기본장초;
const 낸다 = process.argv.includes('--낸다');

if (!slug) { console.log('쓰는 법: node scripts/make-kcw-short-from-cards.mjs --기사=<slug> --낸다'); process.exit(1); }

const 길들 = 카드길들(slug);
if (!길들) {
  console.log(`🔴 9:16 카드 다섯 장이 다 없다 — ${카드방}/${slug}-v-1..5.png`);
  console.log('   먼저: node scripts/make-kcw-cardnews.mjs --낸다 --기사=' + slug);
  process.exit(1);
}
const 대본 = 대본읽기(slug);
if (!대본) {
  console.log(`🔴 대본이 없다 — ${대본길} 의 「대본」 칸에 «${slug}» 를 적어야 한다.`);
  console.log('   ⛔ 이 자는 대본을 지어내지 않는다. 그리고 무음판을 만들고 끝내지도 않는다.');
  process.exit(1);
}
const 낼 = 낼이름(slug);
if (!낼) { console.log(`⏭ 이미 있다 — ${영상방}/${slug}-voiced.mp4 (덮어쓰지 않는다)`); process.exit(0); }

console.log(`■ ${slug}`);
console.log(`   카드 5장 · 장마다 ${장초}초 ≈ ${(장초 * 5).toFixed(1)}초`);
console.log(`   대본 ${대본.내레이션.length}자`);
if (!낸다) { console.log('\n⭐ 아직 안 구웠다. --낸다 를 붙인다.'); process.exit(0); }

const 임시 = path.join(ROOT, 'archive', '_tmp-short');
fs.mkdirSync(임시, { recursive: true });
const 목록길 = path.join(임시, `${slug}.txt`);
fs.writeFileSync(목록길, 이어붙일대본(길들, 장초), 'utf8');

/*
 * 소리 — make-kcw-sound.mjs 와 «같은 길»로 만든다.
 * 🔴 [2026-09-10] 처음에 `edge-tts` 라는 «명령»을 부르려 했는데 이 저장소는 그것을 안 쓴다.
 *   열어 보니 make-kcw-sound.mjs 는 `msedge-tts` «노드 모듈»을 쓴다(230줄).
 *   ⛔ 남이 이미 쓰는 길이 있는데 새 길을 만들지 않는다. 목소리 이름도 그 자와 같게 둔다.
 */
/* ⚠ msedge-tts 의 toFile 은 «폴더»를 받아 그 안에 audio.mp3 를 쓴다 — 파일 이름이 아니다.
 *   폴더를 안 만들어 두면 ENOENT 로 죽는다. 실측으로 알았다(2026-09-10).
 *   ⛔ 오래 도는 자는 «쓸 자리를 먼저» 만든다 — 오늘 sea-brands 에서도 같은 것에 걸렸다. */
const 소리앞 = path.join(임시, slug);
fs.mkdirSync(소리앞, { recursive: true });
const 목소리 = 'en-US-AndrewNeural';
let 소리길;
try {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(목소리, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioFilePath } = await tts.toFile(소리앞, 대본.내레이션);
  소리길 = audioFilePath;
} catch (e) {
  console.log(`🔴 소리를 못 만들었다 — ${String(e.message).split('\n')[0]}`);
  console.log('   ⛔ 무음판을 내지 않는다(사장님 「무성 콘텐트 다신 만들지 말 것」). 여기서 멈춘다.');
  process.exit(1);
}
if (!소리길 || !fs.existsSync(소리길)) {
  console.log('🔴 소리 파일이 안 나왔다 — 무음판을 내지 않고 멈춘다.');
  process.exit(1);
}

const 낼길 = path.join(ROOT, 낼);
execFileSync(ffmpeg경로, [
  '-y', '-f', 'concat', '-safe', '0', '-i', 목록길,
  '-i', 소리길,
  '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k',
  '-shortest', 낼길,
], { stdio: ['ignore', 'pipe', 'pipe'] });

/* ⛔ 「만들었다」로 끝내지 않는다 — 음량을 «재서» 확인한다 */
let 잰글 = '';
try {
  execFileSync(ffmpeg경로, ['-i', 낼길, '-af', 'volumedetect', '-f', 'null', '-'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
} catch (e) { 잰글 = String(e.stderr ?? ''); }
if (!잰글) {
  try {
    잰글 = execFileSync(ffmpeg경로, ['-i', 낼길, '-af', 'volumedetect', '-f', 'null', '-'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { 잰글 = String(e.stderr ?? e.stdout ?? ''); }
}
const 음량 = 음량읽기(잰글);
const 판정 = 소리나나(음량);
const 크기 = fs.statSync(낼길).size;

console.log('');
console.log(`📁 구웠다 — ${낼} (${(크기 / 1024 / 1024).toFixed(2)}MB)`);
console.log(`   음량 ${음량 === null ? '⬜ 못 쟀다' : `${음량} dB`} — ${판정.난다 ? '✅ 소리가 난다' : `🔴 ${판정.까닭}`}`);
if (!판정.난다) {
  console.log('   ⛔ 무음이면 내지 않는다. 파일을 지우고 멈춘다.');
  fs.unlinkSync(낼길);
  process.exit(1);
}
console.log('');
console.log('다음: node scripts/build-kcw-video-schema.mjs → build-kcw-video-index.mjs → check-kcw-video-lists.mjs');
