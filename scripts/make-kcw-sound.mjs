#!/usr/bin/env node
/**
 * make-kcw-sound.mjs — **무성 영상에 «소리»를 붙인다.**
 *
 * ── 왜 (2026-08-29) ───────────────────────────────────────────
 * 사장님 지시 넷이 한꺼번에 왔다. 원문 그대로 —
 * ```
 * ① 「영상은 퀄러티 있게해야지...음성도 있어야지....자연스러운 목소리와 음성, 또는
 *    배경음악을 너희들이 직접 만들어서 사용하고+추가 설명 목소리」
 * ② 「무성 콘텐트 다신 만들지 말 것」
 * ③ 「무성 콘텐트 삭제하지 말고 소리만 입혀서 추가로 배포해 영상 제목만 바꿔서」
 * ④ 「무성 콘텐트 버전 업은 하루에 1개」
 * ```
 * 우리 숏영상 스물다섯 편은 **전부 무성**이었다. 이 자가 그것을 끝낸다.
 *
 * ── 한 편에 들어가는 소리 셋 ──────────────────────────────────
 * ```
 *   ① 내레이션    화면이 말하는 것을 «읽는» 목소리          (신경망 음성)
 *   ② 배경음악    우리가 표본을 계산해 만든 것              (scripts/lib/kcw-music.mjs)
 *   ③ 설명 한 줄  끝에 얹는 «추가 설명» 목소리 — 사장님이 따로 못박으신 것
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **남의 음원을 안 쓴다.** 배경음악은 우리가 계산해서 만든다. 소리 하나가 채널을 위태롭게 한다.
 * ⛔ **원본 영상을 안 건드린다.** 새 파일로 낸다 — 사장님 ③ 「삭제하지 말고」.
 * ⛔ **말소리를 음악이 이기지 않는다.** 음악은 배경이다.
 * ⛔ **길이를 안 늘인다.** 소리가 화면보다 길면 잘린다 — 그러면 문장이 끊긴다.
 *   ⚠ 그래서 말이 길면 «말을 줄이는» 것이 답이지 화면을 늘이는 것이 아니다. 자가 그것을 잰다.
 *
 * 쓰는 법
 *   node scripts/make-kcw-sound.mjs --자가시험
 *   node scripts/make-kcw-sound.mjs --set spike-hearts2hearts --목소리 en-US-AndrewNeural
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { 음악표본, wav바이트 } from './lib/kcw-music.mjs';
import ffmpeg경로 from 'ffmpeg-static';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 영상방 = path.join(뿌리, 'public/wikitip/video');

/** 우리 채널 목소리 후보. ⚠ 고르는 것은 사람이 «들어 보고» 한다 — 자가 정하지 않는다 */
export const 목소리후보 = [
  { 이름: 'en-US-AndrewNeural', 성격: 'Warm, Confident, Authentic, Honest' },
  { 이름: 'en-US-ChristopherNeural', 성격: 'Reliable, Authority' },
  { 이름: 'en-GB-RyanNeural', 성격: 'Friendly, Positive (British)' },
  { 이름: 'en-US-JennyNeural', 성격: 'Friendly, Considerate, Comfort' },
];

/**
 * 말이 화면 안에 들어가나. ⛔ 넘치면 «화면을 늘이지» 않고 «말을 줄인다».
 * 사람이 1초에 읽는 낱말 수는 대략 2.6개다(느린 내레이션 기준).
 */
export const 초당낱말 = 2.6;
/**
 * ⚠ [2026-08-29] 낱말만 세면 «수»에서 틀린다 — 「349」는 한 낱말인데 말로는
 *   「three hundred forty-nine」이라 네 낱말어치 시간이 든다. 그래서 숫자는 무겁게 센다.
 * ⛔ 그래도 이건 어림이다. 정확한 길이는 «만들어진 소리»를 재야 안다.
 */
export function 낱말무게(낱말) {
  const w = String(낱말 ?? '');
  if (!/[0-9]/.test(w)) return 1;
  const 자릿수 = (w.match(/[0-9]/g) || []).length;
  return Math.max(1, Math.min(6, Math.ceil(자릿수 * 1.2)));
}
export function 말길이초(글, 초당 = 초당낱말) {
  const 낱말들 = String(글 ?? '').trim().split(/\s+/).filter(Boolean);
  const 무게 = 낱말들.reduce((n, w) => n + 낱말무게(w), 0);
  return 무게 / 초당;
}
export function 넘치나(글, 화면초, 여유 = 0.6) {
  if (!Number.isFinite(화면초) || 화면초 <= 0) return null;   /* ⛔ 못 쟀다 */
  return 말길이초(글) > (화면초 - 여유);
}

/**
 * 🔴🔴 [2026-08-29] **낱말로 어림한 길이를 믿었다가 세 목소리가 잘린 채로 리뷰에 나갔다.**
 *   같은 대본(33낱말)을 네 목소리가 읽은 «실제» 길이 —
 * ```
 *   Andrew       13.13초   ✅ 14초 화면에 들어간다
 *   Christopher  15.34초   🔴 넘는다
 *   Ryan         15.34초   🔴 넘는다
 *   Jenny        14.81초   🔴 넘는다
 * ```
 *   내 어림은 12.7초였다. **어림은 목소리마다 다른 속도를 모른다.**
 * ⛔ 그래서 어림으로 «통과»시키지 않는다. 소리를 만든 뒤 «그 파일을 재서» 판정한다.
 *   ⚠ 어림은 그대로 둔다 — 소리를 만들기 «전»에 미리 걸러 주는 값이 있다.
 *     다만 어림이 통과했다고 끝이 아니다. 실물이 마지막 판관이다.
 */
export function 소리길이초(길, 돌리기 = execFileSync) {
  return 영상길이초(길, 돌리기);   /* ffmpeg 은 소리 파일도 같은 꼴로 알려 준다 */
}

/** 영상 길이를 «재서» 얻는다. ⛔ 14초라고 짐작하지 않는다 */
export function 영상길이초(길, 돌리기 = execFileSync) {
  try {
    const 답 = 돌리기(ffmpeg경로, ['-i', 길], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = String(답).match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (!m) return null;
    return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
  } catch (e) {
    const m = String(e?.stderr ?? '').match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : null;
  }
}

/**
 * 소리를 붙인 편의 «새 제목». 사장님 ③ 「영상 제목만 바꿔서」.
 * ⛔ 낚시로 바꾸지 않는다 — 같은 수를 말하는 다른 제목이어야 한다.
 */
export function 소리판제목(옛제목) {
  const s = String(옛제목 ?? '').trim();
  if (!s) return null;
  return `${s} — read aloud`;
}

/*
 * 🔴 [2026-08-30] 이 자는 **들여오기만 해도 본체가 돌았다.** `--set` 이 없다고 즉시 죽는다.
 *   그래서 남이 `말길이초`·`넘치나` 를 가져다 쓸 수 없었다 — 대본 열세 편의 길이를
 *   재려다 걸렸다. **길이를 재는 자가 «재게 해 주지 않는» 꼴이다.**
 * ⛔ 형제 자들(make-video-kcw-*.mjs)은 이미 이 빗장을 걸고 있다. 여기만 빠져 있었다.
 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('낱말을 세어 초를 낸다', Math.abs(말길이초('one two three four five six') - 6 / 2.6) < 1e-9);
  검('⛔ 빈 글은 0초', 말길이초('') === 0 && 말길이초(undefined) === 0);
  검('여러 빈칸도 낱말 하나로 안 센다', 말길이초('a   b') === 2 / 2.6);
  검('⚠ 숫자는 무겁게 센다 — 349 는 한 낱말이 아니다', 낱말무게('349') === 4);
  검('숫자 없는 낱말은 하나', 낱말무게('word') === 1);
  검('⛔ 아무리 큰 수도 여섯을 안 넘는다', 낱말무게('1234567890') === 6);

  검('짧은 말은 안 넘친다', 넘치나('one two three', 14) === false);
  검('긴 말은 넘친다', 넘치나(new Array(80).fill('word').join(' '), 14) === true);
  검('⛔ 화면 길이를 못 쟀으면 null — false 가 아니다',
    넘치나('one two', null) === null && 넘치나('one two', 0) === null);

  검('제목에 꼬리를 붙인다', 소리판제목('A title') === 'A title — read aloud');
  검('⛔ 빈 제목은 null', 소리판제목('') === null && 소리판제목(undefined) === null);

  /* 음악 자체 — 소리가 «실제로 나는가»를 잰다 */
  const 표 = 음악표본(2, '시험', 8000);
  검('표본 길이가 맞는다', 표.length === 16000);
  검('⛔ 무음이 아니다 — 소리가 난다', 표.some((v) => Math.abs(v) > 0.02));
  검('⛔ 찢어지지 않는다 — 다 -1~1 안', 표.every((v) => v >= -1 && v <= 1));
  검('같은 씨앗은 같은 소리', (() => {
    const a = 음악표본(1, 'x', 8000); const b = 음악표본(1, 'x', 8000);
    return a.every((v, i) => v === b[i]);
  })());
  검('다른 씨앗은 다른 소리', (() => {
    const a = 음악표본(1, 'x', 8000); const b = 음악표본(1, 'y', 8000);
    return a.some((v, i) => v !== b[i]);
  })());
  검('시작이 여리다 — 「딱」 하고 안 튄다', Math.abs(표[0]) < 0.05);

  const w = wav바이트(음악표본(1, 'x', 8000), 8000);
  검('WAV 머리가 RIFF/WAVE', w.slice(0, 4).toString() === 'RIFF' && w.slice(8, 12).toString() === 'WAVE');
  검('WAV 몸 길이가 표본×2', w.readUInt32LE(40) === 8000 * 2);
  검('WAV 전체가 44 + 몸', w.length === 44 + 8000 * 2);

  검('⛔ 어림이 통과해도 실물이 넘칠 수 있다 — 그래서 실물을 잰다',
    /* 33낱말 어림 12.7초가 통과하지만 실제 Ryan 은 15.34초였다. 이 사실을 코드가 안다 */
    말길이초(new Array(33).fill('word').join(' ')) < 14 && 소리길이초('없는파일') === null);
  검('목소리 후보를 손으로 고르게 남겨 뒀다', 목소리후보.length >= 3
    && 목소리후보.every((v) => v.이름 && v.성격));

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ make-kcw-sound 자가시험 통과 (21)');
  process.exit(0);
}

/* ── 실제로 만든다 ── ⛔ «직접 실행됐을 때만». 들여오기는 함수만 가져간다 ── */
if (내가실행됐다) {
const 인자 = (이름, 기본 = null) => {
  const i = process.argv.indexOf(`--${이름}`);
  return i >= 0 ? process.argv[i + 1] : 기본;
};
const set = 인자('set');
if (!set) { console.error('⛔ --set <영상이름> 을 준다'); process.exit(1); }

/*
 * 🔴 [2026-08-29] `--원본` 을 더한다 — **소리 없는 판이 공개 폴더에 «잠깐도» 서지 않게.**
 *   사장님 「무성 콘텐트 다신 만들지 말 것」. 그전에는 소리를 입히려면 무음판을
 *   public/wikitip/video/ 에 먼저 놓아야 했다. 도중에 멈추면 그대로 남는다.
 * ⚠ 안 주면 예전처럼 공개 폴더에서 찾는다 — 이미 나가 있는 무음판에 소리를 입히는
 *   길(사장님 「삭제하지 말고 소리만 입혀서 추가로 배포해」)이 그대로 살아 있어야 한다.
 */
const 원본인자 = 인자('원본');
const 영상길 = 원본인자 ? path.resolve(뿌리, 원본인자) : path.join(영상방, `${set}.mp4`);
if (!fs.existsSync(영상길)) { console.error(`⛔ 없다 — ${영상길}`); process.exit(1); }

const 초 = 영상길이초(영상길);
if (!초) { console.error('⛔ 영상 길이를 못 쟀다. 짐작으로 안 만든다'); process.exit(1); }
console.log(`■ ${set} · 화면 ${초.toFixed(2)}초`);

/* 대본 — 지면이 말하는 것을 그대로 읽는다. ⛔ 새로 지어내지 않는다 */
const 대본길 = path.join(뿌리, 'src/data/kcw-narration.json');
if (!fs.existsSync(대본길)) {
  console.error(`⛔ 대본이 없다 — ${대본길}`);
  console.error('   ⚠ 대본을 이 자가 «지어내지» 않는다. 지면 글에서 가져와 그 파일에 적는다.');
  process.exit(1);
}
const 대본 = JSON.parse(fs.readFileSync(대본길, 'utf8')).대본?.[set];
if (!대본) { console.error(`⛔ ${set} 의 대본이 없다 — src/data/kcw-narration.json`); process.exit(1); }

const 목소리 = 인자('목소리', 목소리후보[0].이름);
const 낼방 = path.join(뿌리, 'archive/sound', set);
fs.mkdirSync(낼방, { recursive: true });

/* ① 배경음악 — 우리가 만든다 */
fs.writeFileSync(path.join(낼방, 'music.wav'), wav바이트(음악표본(초, set)));
console.log('  ✔ 배경음악 — 우리가 표본을 계산해 만들었다 (남의 음원 아님)');

/* ② 내레이션 + ③ 설명 한 줄 */
const 읽을것 = [대본.내레이션, 대본.설명].filter(Boolean).join(' ');
const 넘침 = 넘치나(읽을것, 초);
console.log(`  ${넘침 ? '🔴' : '✔'} 말 ${말길이초(읽을것).toFixed(1)}초 / 화면 ${초.toFixed(1)}초`
  + (넘침 ? ' — ⛔ 넘친다. 화면을 늘이지 말고 «말을 줄여야» 한다' : ''));
if (넘침) process.exit(1);

const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
const tts = new MsEdgeTTS();
await tts.setMetadata(목소리, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
const { audioFilePath } = await tts.toFile(낼방, 읽을것);

/*
 * 🔴 어림이 아니라 «만든 소리»를 잰다. 목소리마다 읽는 속도가 다르다 —
 *   같은 33낱말을 Andrew 는 13.13초, Ryan 은 15.34초에 읽는다.
 * ⛔ 넘치면 만들지 않는다. 넘친 채로 붙이면 문장이 «잘린 채» 나간다.
 *   ⚠ 답은 화면을 늘이는 것이 아니라 ① 말을 줄이거나 ② 빠른 목소리로 바꾸는 것이다.
 */
const 실제말 = 소리길이초(audioFilePath);
const 시작지연 = 0.4;
if (실제말 == null) {
  console.error('⛔ 만든 소리의 길이를 못 쟀다. 짐작으로 안 붙인다');
  process.exit(1);
}
const 실제끝 = 시작지연 + 실제말;
if (실제끝 > 초) {
  console.error(`  🔴 ${목소리} — 말이 ${실제말.toFixed(2)}초라 ${실제끝.toFixed(2)}초에 끝난다.`
    + ` 화면은 ${초.toFixed(2)}초다. **넘친다.**`);
  console.error('     ⛔ 화면을 늘이지 않는다. ① 대본을 줄이거나 ② 더 빠른 목소리로 바꾼다.');
  console.error(`     ⚠ 어림은 ${말길이초(읽을것).toFixed(1)}초로 통과시켰다 — 어림은 목소리 속도를 모른다.`);
  process.exit(1);
}
console.log(`  ✔ 내레이션 — ${목소리} · 말 ${실제말.toFixed(2)}초 → ${실제끝.toFixed(2)}초에 끝난다`
  + ` (여백 ${(초 - 실제끝).toFixed(2)}초)`);

/* ④ 섞어서 화면에 붙인다. ⛔ 원본은 안 건드린다 */
const ff = ffmpeg경로;
const 낼길 = path.join(영상방, `${set}-voiced.mp4`);
execFileSync(ff, [
  '-y', '-i', 영상길, '-i', audioFilePath, '-i', path.join(낼방, 'music.wav'),
  '-filter_complex',
  /* 말소리를 조금 키우고, 음악은 «말 밑»으로 내린다. shortest 로 화면 길이에 맞춘다 */
  /*
   * 🔴 [2026-08-29] 처음에 -shortest 만 걸었더니 **화면이 14.00초에서 13.53초로 잘렸다.**
   *   말이 끝나는 데서 영상이 끝나 버린 것이다 — 끝에 크게 넣은 «우리 사이트 입구»가 날아간다.
   *   ⛔ 소리에 화면을 맞추면 안 된다. 화면에 소리를 맞춘다.
   * ✅ apad 로 소리 뒤를 «조용히 늘여» 두고, -shortest 가 화면 길이에서 끊게 한다.
   * ⚠ 44100 으로 맞춘다 — 안 맞추면 목소리(24k)에 끌려가 배경음악이 뭉개진다.
   */
  '[1:a]volume=1.35,adelay=400|400,aresample=44100[v];[2:a]volume=0.30,aresample=44100[m];[v][m]amix=inputs=2:duration=longest:dropout_transition=0,apad[a]',
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-shortest', 낼길,
], { stdio: ['ignore', 'ignore', 'pipe'] });

console.log(`  ✔ 붙였다 — ${낼길}`);

/* 🔴🔴 [2026-09-04 · 5번이 겪고 못박음] **여기서 끝내면 다음 사람이 사이트를 깨뜨린다.**
   ─────────────────────────────────────────────────────────────────────────────
   이 자는 `-voiced.mp4` 만 만들고 «썸네일»을 안 만들었다. 그래서 그 편을 지면에
   `<KcwShorts set="…-voiced">` 로 걸면 빌드가 이렇게 죽는다 —
     Error: 숏영상 tworulers-voiced 의 미리보기가 없다 — 썸네일도 카드뉴스도 없다
   ⚠ 세 사이트가 «한 빌드»다. **소리 한 편 입힌 것이 6번·3번 배포까지 세운다.**

   ⛔ 「썸네일은 나중에 만들면 된다」가 아니다 — 만든 사람은 잊고, 다음 사람은 까닭을 모른다.
   ✅ 그래서 여기서 «곧바로» 뽑는다. 못 뽑으면 소리를 입힌 것도 **실패로 낸다.** */
try {
  const 썸방 = path.join(영상방, 'thumb');
  const 썸길 = path.join(썸방, `${set}-voiced.jpg`);
  if (!fs.existsSync(썸방)) fs.mkdirSync(썸방, { recursive: true });
  /* 2초 지점 — build-kcw-video-schema.mjs 가 쓰는 것과 «같은 자리·같은 크기»로 맞춘다.
     ⚠ 다르게 뽑으면 그 자가 다시 돌 때 그림이 바뀌어 diff 가 지저분해진다. */
  execFileSync(ff, ['-y', '-ss', '2', '-i', 낼길, '-frames:v', '1',
    '-vf', 'scale=405:720', '-q:v', '3', 썸길], { stdio: 'ignore' });
  if (!fs.existsSync(썸길) || fs.statSync(썸길).size <= 1000) throw new Error('썸네일이 너무 작다');
  console.log(`  ✔ 미리보기 — ${썸길} (${(fs.statSync(썸길).size / 1024).toFixed(0)}KB)`);
} catch (e) {
  console.error('\n🔴 소리는 붙였는데 **미리보기를 못 뽑았다.**');
  console.error('   ⛔ 이대로 지면에 걸면 «사이트 전체 빌드»가 깨진다 — 세 사이트가 한 빌드다.');
  console.error(`   까닭: ${e && e.message ? e.message : e}`);
  console.error('   ✅ 손으로 뽑으려면: node scripts/build-kcw-video-schema.mjs');
  process.exit(1);
}

console.log(`\n⭐ 새 제목(사장님 ③ 「제목만 바꿔서」): ${소리판제목(대본.제목) ?? '(옛 제목을 모른다)'}`);
console.log('⛔ 원본 무성판은 «그대로 둔다». 지우지 않는다.');
console.log('\n⚠ 아직 «손님이 볼 자리»가 없다. 세 곳 다 이름을 올려야 끝난다 —');
console.log(`   1. 지면에  <KcwShorts set="${set}-voiced" …>`);
console.log(`   2. src/pages/wikitip/sitemap.xml.ts 의 videoSets 에  set: '${set}-voiced'`);
console.log('   3. node scripts/build-kcw-video-index.mjs   (⚠ 빌드를 «먼저» 해야 지면을 읽는다)');
console.log('   그다음 확인: node scripts/check-kcw-video-lists.mjs  → 「셋이 다 맞는다」');
}
