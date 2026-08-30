#!/usr/bin/env node
/**
 * check-kcw-narration-fits.mjs — **대본이 «진짜 목소리»로 화면 안에 들어가나.**
 *
 * ── 🔴 왜 만드나 (2026-08-30 · 5번) ──────────────────────────
 * 무음 영상에 소리를 입히는 것은 **하루 한 편**이다(사장님 「무성 콘텐트 버전 업은 하루에 1개」).
 * 그러니 그날 고른 편의 대본이 길면 **그날 몫이 통째로 빈다.** 다시 고를 여유가 없다.
 *
 * 🔴 오늘 재 보니 내일 몫인 `tworulers` 가 **어림으로도 13.5초**였다 — 아무도 재 보지 않았다.
 *   ⚠ 그런데 어림은 «목소리 속도를 모른다». 8/29 에 같은 33낱말을
 *     Andrew 는 13.13초, Ryan 은 15.34초에 읽었다. 어림을 믿었다 세 편이 잘린 채 나갔다.
 * ⇒ 그래서 이 자는 **말을 실제로 만들어서 잰다.** 어림은 참고로만 같이 적는다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **공개 폴더에 아무것도 안 놓는다.** 소리는 archive/sound/_잰것/ 에만 만든다.
 * ⛔ 「못 쟀다」와 「넘친다」를 «갈라» 적는다. 영상 파일이 없어 못 잰 것을 통과로 안 친다.
 * ⛔ 화면 길이를 14초로 «짐작하지» 않는다 — 영상 파일에서 잰다.
 * ⚠ 말을 만들려면 인터넷이 있어야 한다. 못 만들면 그 편은 «못 쟀다»로 적고 멈추지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-narration-fits.mjs --자가시험
 *   node scripts/check-kcw-narration-fits.mjs                 # 소리 없는 편만
 *   node scripts/check-kcw-narration-fits.mjs --모두           # 이미 소리 붙은 편까지
 *   node scripts/check-kcw-narration-fits.mjs --편 tworulers
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 말길이초, 소리길이초, 목소리후보 } from './make-kcw-sound.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 영상방 = path.join(뿌리, 'public/wikitip/video');
const 대본길 = path.join(뿌리, 'src/data/kcw-narration.json');

/** 소리를 붙일 때 앞에 두는 빈 자리 — make-kcw-sound 와 «같은» 값이어야 한다 */
export const 시작지연 = 0.4;

/** 읽을 것 한 줄로. ⛔ make-kcw-sound 와 같은 방식이어야 잰 값이 뜻이 있다 */
export function 읽을것(대본) {
  return [대본?.내레이션, 대본?.설명].filter(Boolean).join(' ');
}

/** 들어가나 — ⛔ 못 잰 것은 true/false 가 아니라 null 이다 */
export function 들어가나(말초, 화면초, 지연 = 시작지연) {
  if (!Number.isFinite(말초) || 말초 <= 0) return null;
  if (!Number.isFinite(화면초) || 화면초 <= 0) return null;
  return 지연 + 말초 <= 화면초;
}

/** 남는 여백. ⛔ 못 재면 null */
export function 여백(말초, 화면초, 지연 = 시작지연) {
  if (들어가나(말초, 화면초, 지연) === null) return null;
  return 화면초 - (지연 + 말초);
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('내레이션과 설명을 한 줄로 잇는다', 읽을것({ 내레이션: 'a b', 설명: 'c' }) === 'a b c');
  검('설명이 없어도 된다', 읽을것({ 내레이션: 'a b' }) === 'a b');
  검('⛔ 빈 대본은 빈 글', 읽을것(null) === '' && 읽을것({}) === '');

  검('여유롭게 들어가면 true', 들어가나(11, 14) === true);
  검('⚠ 지연을 더해 넘으면 false — 13.7 + 0.4 는 14 를 넘는다', 들어가나(13.7, 14) === false);
  검('딱 맞으면 들어간다', 들어가나(13.6, 14) === true);
  검('⛔ 말을 못 쟀으면 null — false 가 아니다', 들어가나(null, 14) === null);
  검('⛔ 화면을 못 쟀으면 null', 들어가나(11, null) === null);
  검('⛔ 0초짜리도 못 잰 것으로 본다', 들어가나(11, 0) === null && 들어가나(0, 14) === null);

  검('여백을 낸다', Math.abs(여백(11, 14) - 2.6) < 1e-9);
  검('⛔ 못 재면 여백도 null', 여백(null, 14) === null);
  검('넘치면 여백이 음수다', 여백(13.9, 14) < 0);

  검('목소리 후보가 있다', Array.isArray(목소리후보) && 목소리후보.length > 0);
  검('어림 함수가 산다', 말길이초('one two three four five six') > 0);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 대본이 화면에 들어가나 — 자가시험 14 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const 인자 = (이름, 기본 = null) => {
    const i = process.argv.indexOf(`--${이름}`);
    return i >= 0 ? process.argv[i + 1] : 기본;
  };
  const 목소리 = 인자('목소리', 목소리후보[0].이름);
  const 한편 = 인자('편');
  const 모두 = process.argv.includes('--모두');

  if (!fs.existsSync(대본길)) { console.error(`⛔ 대본이 없다 — ${대본길}`); process.exit(1); }
  const 대본들 = JSON.parse(fs.readFileSync(대본길, 'utf8')).대본 ?? {};

  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const 잰방 = path.join(뿌리, 'archive/sound/_잰것');
  fs.mkdirSync(잰방, { recursive: true });

  const 편들 = (한편 ? [한편] : Object.keys(대본들)).filter((s) => {
    if (한편) return true;
    if (모두) return true;
    /* 이미 소리를 붙여 낸 편은 다시 안 잰다 — 그건 이미 화면에 맞춰 나갔다 */
    return !fs.existsSync(path.join(영상방, `${s}-voiced.mp4`));
  });

  console.log(`■ 대본 ${Object.keys(대본들).length}편 중 ${편들.length}편을 «진짜 목소리»로 잰다`);
  console.log(`  목소리 ${목소리} · 시작 지연 ${시작지연}초\n`);

  const 넘친것 = []; const 못잰것 = []; const 아슬 = [];
  for (const s of 편들) {
    const 대본 = 대본들[s];
    if (!대본) { 못잰것.push({ s, 왜: '대본이 없다' }); continue; }
    const 영상길 = path.join(영상방, `${s}.mp4`);
    if (!fs.existsSync(영상길)) { 못잰것.push({ s, 왜: '무음 영상 파일이 없다' }); continue; }
    const 화면 = Number(process.env.KCW_화면초) || (await import('./make-kcw-sound.mjs')).영상길이초(영상길);
    if (!화면) { 못잰것.push({ s, 왜: '화면 길이를 못 쟀다' }); continue; }

    const 글 = 읽을것(대본);
    let 말초 = null;
    try {
      /* ⚠ msedge-tts 는 방이 «미리» 있어야 한다 — 없으면 다 만들고 나서 unlink 로 죽는다 */
      fs.mkdirSync(path.join(잰방, s), { recursive: true });
      const tts = new MsEdgeTTS();
      await tts.setMetadata(목소리, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioFilePath } = await tts.toFile(path.join(잰방, s), 글);
      말초 = 소리길이초(audioFilePath);
    } catch (e) { 못잰것.push({ s, 왜: `말을 못 만들었다 — ${String(e.message).slice(0, 60)}` }); continue; }
    if (말초 == null) { 못잰것.push({ s, 왜: '만든 소리의 길이를 못 쟀다' }); continue; }

    const 남 = 여백(말초, 화면);
    const 어림 = 말길이초(글);
    const 표 = 남 < 0 ? '🔴' : (남 < 0.8 ? '⚠' : '✅');
    if (남 < 0) 넘친것.push({ s, 말초, 화면, 남 }); else if (남 < 0.8) 아슬.push(s);
    console.log(`${표} ${s.padEnd(18)} 말 ${말초.toFixed(2)}초 · 화면 ${화면.toFixed(2)}초`
      + ` · 여백 ${남.toFixed(2)}초   (어림 ${어림.toFixed(1)})`);
  }

  if (못잰것.length) {
    console.log(`\n⬜ **못 쟀다 ${못잰것.length}편** — 통과로 «안» 친다`);
    for (const x of 못잰것) console.log(`     ${x.s.padEnd(18)} ${x.왜}`);
  }
  if (아슬.length) console.log(`\n⚠ 여백이 0.8초 아래인 편 ${아슬.length}: ${아슬.join(', ')}`);
  if (넘친것.length) {
    console.log(`\n🔴 **넘치는 대본 ${넘친것.length}편** — 그날이 통째로 빈다`);
    console.log('   ⛔ 화면을 늘이지 않는다. ① 말을 줄이거나 ② 더 빠른 목소리로 바꾼다');
    for (const x of 넘친것) {
      console.log(`     ${x.s.padEnd(18)} ${Math.abs(x.남).toFixed(2)}초 모자란다`);
    }
    process.exit(1);
  }
  console.log('\n✅ 잰 대본이 모두 화면 안에 들어간다.');
}
