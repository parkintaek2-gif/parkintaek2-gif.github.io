#!/usr/bin/env node
/**
 * make-voice.mjs — **숏영상에 넣을 캐릭터 목소리를 만든다. 어린이 목소리다.**
 *
 * 🔴 사장님(2026-08-09 02:2x) — *「숓영상에 목소리를 넣자」*
 * 🔴 사장님(2026-08-09 02:3x) — *「목소리는 캐릭터니 어린이가 하자」*
 *
 * ⛔ 이 기계에 있는 한국어 목소리는 **Heami(어른 여자) 하나뿐**이다.
 * ⭐ 그래서 **음높이를 올려 어린이로 만든다.** 빠르기는 그대로 둔다 —
 *   음높이만 올리면 어린이가 되고, 빠르기까지 빨라지면 만화 다람쥐가 된다.
 *
 * ⛔ **네 채널이 같은 목소리를 쓴다.** 캐릭터는 하나다. 자리마다 다르게 만들지 마라.
 *
 * 쓰는 법
 *   node scripts/make-voice.mjs --대본 "종로구에 백 년 넘은 고등학교가 여덟 곳 있어요" --낼곳 out/voice.wav
 *   node scripts/make-voice.mjs --대본파일 out/script.txt --낼곳 out/voice.wav
 *   node scripts/make-voice.mjs --자가시험
 *
 * ⚠ 깃발이 `--자가시험` 이다(`--selftest` 아님) — 가져다 쓰는 쪽 검사를 가로채지 않으려고.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';

/**
 * 캐릭터 하나. ⛔ 채널마다 바꾸지 않는다.
 * ⚠ 이름은 2번이 정했다. 사장님이 다른 이름을 주시면 그것으로 바꾼다.
 */
export const 캐릭터 = {
  이름: '토리',
  바탕목소리: 'Microsoft Heami Desktop',
  올림: 1.28,      // 음높이 배수. 1.0 = 어른 그대로 / 1.28 = 초등 저학년쯤
  말빠르기: 0,     // SAPI 빠르기 −10~10. 0 = 보통. ⛔ 올리면 알아듣기 힘들다
  소리결: 48000,
};

/* ──────────────────────────────────────────────────────────────
 * 대본
 * ────────────────────────────────────────────────────────────── */

/**
 * 한국어를 **1초에 몇 자** 읽나. Heami 보통 빠르기에서 재 보면 6.2자쯤이다.
 * ⚠ 어림이다. 정확한 것은 만들고 나서 파일 길이로 잰다.
 */
export const 초당글자 = 6.2;

/** 대본이 몇 초짜리인지 어림잡는다. ⛔ 공백·문장부호는 안 센다 */
export function 말길이(대본) {
  const 글자 = String(대본 ?? '').replace(/[\s.,!?·…"'()\[\]]/g, '').length;
  return 글자 / 초당글자;
}

/**
 * ⛔ **대본이 영상보다 길면 말이 잘린다.** 만들기 전에 잡는다.
 * ⭐ 영상 길이의 82% 를 넘지 않게 한다 — 앞뒤에 숨 쉴 자리가 있어야 한다.
 */
export function 길이검사(대본, 영상초) {
  const 초 = 말길이(대본);
  const 한도 = 영상초 * 0.82;
  return {
    됨: 초 <= 한도,
    말초: Math.round(초 * 10) / 10,
    한도: Math.round(한도 * 10) / 10,
    까닭: 초 <= 한도 ? '' : `대본이 ${Math.round(초 * 10) / 10}초짜리다. ${영상초}초 영상엔 ${Math.round(한도 * 10) / 10}초까지만 들어간다`,
  };
}

/**
 * SAPI 가 잘못 읽는 것을 고쳐 준다.
 * ⛔ 어린이 목소리인데 「1885」를 「천팔백팔십오」로 안 읽고 뭉개면 못 알아듣는다.
 */
export function 읽기좋게(대본) {
  return String(대본 ?? '')
    .replace(/\s*·\s*/g, ', ')       // 가운뎃점은 SAPI 가 그냥 삼킨다
    .replace(/\s*…\s*/g, ', ')
    .replace(/([0-9])\s*년/g, '$1년') // 「1885 년」처럼 벌어지면 따로 읽는다
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ──────────────────────────────────────────────────────────────
 * 음높이 올리기
 * ────────────────────────────────────────────────────────────── */

/**
 * ffmpeg 로 **음높이만** 올린다.
 *   asetrate 로 빨리 돌려 음을 올리고 → atempo 로 다시 늦춰 빠르기를 되돌린다
 * ⚠ atempo 는 0.5~2.0 만 받는다. 올림이 2 를 넘으면 나눠서 걸어야 한다.
 */
export function 소리필터(올림 = 캐릭터.올림, 결 = 캐릭터.소리결) {
  if (!(올림 > 0)) throw new Error('⛔ 올림은 0보다 커야 한다');
  const 되돌림 = [];
  let 남 = 1 / 올림;
  while (남 < 0.5) { 되돌림.push(0.5); 남 /= 0.5; }
  while (남 > 2) { 되돌림.push(2); 남 /= 2; }
  되돌림.push(Number(남.toFixed(6)));
  return [
    `aresample=${결}`,
    `asetrate=${Math.round(결 * 올림)}`,
    `aresample=${결}`,
    ...되돌림.map((t) => `atempo=${t}`),
    'highpass=f=110',                 // 올리면 낮은 웅웅거림이 남는다. 깎는다
    'acompressor=threshold=-18dB:ratio=3:attack=8:release=140',  // 크기를 고르게
    'alimiter=limit=0.95',            // ⛔ 깨지면 안 된다
  ].join(',');
}

/* ──────────────────────────────────────────────────────────────
 * 만들기
 * ────────────────────────────────────────────────────────────── */

export const ff = () => {
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  return require('ffmpeg-static');
};

/**
 * ⛔ 대본을 명령줄로 넘기지 않는다 — 한글이 깨진다.
 *   파일에 UTF-8 로 적고 PowerShell 이 그 파일을 읽게 한다.
 */
export function 파워셸글(대본길, 낼길, 목소리 = 캐릭터.바탕목소리, 빠르기 = 캐릭터.말빠르기) {
  return [
    'Add-Type -AssemblyName System.Speech',
    `$t = [System.IO.File]::ReadAllText('${대본길.replace(/'/g, "''")}', [System.Text.Encoding]::UTF8)`,
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    `$s.SelectVoice('${목소리.replace(/'/g, "''")}')`,
    `$s.Rate = ${Math.round(빠르기)}`,
    `$s.SetOutputToWaveFile('${낼길.replace(/'/g, "''")}')`,
    '$s.Speak($t)',
    '$s.Dispose()',
  ].join('; ');
}

/** 목소리 파일을 만든다. 돌려주는 것은 만들어진 길 */
export function 목소리만들기(대본, 낼곳, { 올림 = 캐릭터.올림 } = {}) {
  const 글 = 읽기좋게(대본);
  if (!글) throw new Error('⛔ 대본이 비었다');
  const 임시방 = fs.mkdtempSync(path.join(os.tmpdir(), 'tori-'));
  const 대본길 = path.join(임시방, 'script.txt');
  const 날것 = path.join(임시방, 'raw.wav');
  fs.writeFileSync(대본길, 글, 'utf8');

  execFileSync('powershell', ['-NoProfile', '-Command', 파워셸글(대본길, 날것)], { stdio: 'pipe' });
  if (!fs.existsSync(날것) || fs.statSync(날것).size < 1000) {
    throw new Error('⛔ 목소리가 안 만들어졌다 — Heami 목소리가 깔려 있는지 보라');
  }

  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  execFileSync(ff(), ['-y', '-i', 날것, '-af', 소리필터(올림), '-ar', String(캐릭터.소리결), '-ac', '1', 낼곳], { stdio: 'pipe' });
  fs.rmSync(임시방, { recursive: true, force: true });
  return 낼곳;
}

/**
 * 만들어진 소리가 몇 초인지 — ⛔ 어림이 아니라 파일에서 잰다.
 *
 * ⛔ 8/9 에 여기서 한 번 속았다: `execFileSync` 는 **stdout 만** 돌려주는데
 *   ffmpeg 는 길이를 **stderr 로** 뱉는다. 늘 `null` 이 나왔고,
 *   「만들고 보니 길더라」를 잡는 검사가 **한 번도 안 돌았다.**
 * ⭐ 그래서 stderr 를 직접 읽는다.
 */
export function 잰길이(길) {
  const 나온것 = spawnSync(ff(), ['-i', 길, '-f', 'null', '-'], { encoding: 'utf8' });
  const 글 = String(나온것.stderr ?? '') + String(나온것.stdout ?? '');
  const m = /time=(\d+):(\d+):(\d+\.\d+)/g;
  let 마지막 = null, x;
  while ((x = m.exec(글))) 마지막 = x;
  if (!마지막) return null;
  return Number(마지막[1]) * 3600 + Number(마지막[2]) * 60 + Number(마지막[3]);
}

/* ──────────────────────────────────────────────────────────────
 * 검사
 * ────────────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 140)}`); }
  };

  재본다('캐릭터는 하나다', 캐릭터.이름, '토리');
  재본다('어른보다 음높이를 올린다', 캐릭터.올림 > 1, true);
  재본다('말빠르기는 안 올린다 — 알아들어야 한다', 캐릭터.말빠르기 <= 0, true);

  /* 대본 길이 — ⛔ 여기서 안 잡으면 영상에서 말이 잘린다 */
  재본다('빈 대본은 0초', 말길이(''), 0);
  재본다('공백·문장부호는 안 센다', 말길이('가나다') === 말길이('가, 나. 다!'), true);
  재본다('62자면 10초쯤', Math.round(말길이('가'.repeat(62))), 10);
  재본다('14초 영상에 40자는 들어간다', 길이검사('가'.repeat(40), 14).됨, true);
  재본다('14초 영상에 120자는 안 들어간다', 길이검사('가'.repeat(120), 14).됨, false);
  재본다('안 들어가면 까닭을 말한다', 길이검사('가'.repeat(120), 14).까닭.includes('초까지만'), true);
  재본다('한도는 영상의 82%', 길이검사('가', 100).한도, 82);

  /* 읽기좋게 */
  재본다('가운뎃점을 쉼표로', 읽기좋게('가 · 나'), '가, 나');
  재본다('말줄임표를 쉼표로', 읽기좋게('가 … 나'), '가, 나');
  재본다('빈칸이 겹치면 하나로', 읽기좋게('가   나'), '가 나');
  재본다('앞뒤 빈칸을 뗀다', 읽기좋게('  가 나  '), '가 나');

  /* 소리필터 — ⛔ atempo 범위를 넘으면 ffmpeg 가 죽는다 */
  const f = 소리필터();
  재본다('음을 올린다', f.includes(`asetrate=${Math.round(48000 * 1.28)}`), true);
  재본다('빠르기를 되돌린다', /atempo=/.test(f), true);
  재본다('atempo 가 전부 0.5~2 안', (() => {
    const t = [...f.matchAll(/atempo=([\d.]+)/g)].map((m) => Number(m[1]));
    return t.length > 0 && t.every((v) => v >= 0.5 && v <= 2);
  })(), true);
  재본다('되돌린 빠르기를 곱하면 1/올림', (() => {
    const t = [...f.matchAll(/atempo=([\d.]+)/g)].map((m) => Number(m[1]));
    return Math.abs(t.reduce((a, b) => a * b, 1) - 1 / 1.28) < 1e-4;
  })(), true);
  재본다('많이 올려도 atempo 가 범위 안', (() => {
    const t = [...소리필터(3.5).matchAll(/atempo=([\d.]+)/g)].map((m) => Number(m[1]));
    return t.every((v) => v >= 0.5 && v <= 2) && Math.abs(t.reduce((a, b) => a * b, 1) - 1 / 3.5) < 1e-4;
  })(), true);
  재본다('깨지지 않게 막는다', f.includes('alimiter'), true);
  재본다('올림이 0이면 죽는다', (() => { try { 소리필터(0); return false; } catch { return true; } })(), true);

  /* 파워셸 글 — ⛔ 따옴표가 새면 남의 명령이 섞인다 */
  재본다('대본을 파일에서 읽는다', 파워셸글('a.txt', 'b.wav').includes('ReadAllText'), true);
  재본다('UTF-8 로 읽는다', 파워셸글('a.txt', 'b.wav').includes('Encoding]::UTF8'), true);
  재본다('따옴표를 막는다', 파워셸글("a'b.txt", 'b.wav').includes("a''b.txt"), true);
  재본다('Heami 를 고른다', 파워셸글('a.txt', 'b.wav').includes('Heami'), true);
  재본다('빈 대본이면 죽는다', (() => { try { 목소리만들기('  ', 'x.wav'); return false; } catch { return true; } })(), true);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 자가시험 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const argv = process.argv.slice(2);
  const 받기 = (이름, 기본) => { const i = argv.indexOf(이름); return i >= 0 ? argv[i + 1] : 기본; };
  const 대본파일 = 받기('--대본파일', '');
  const 대본 = 대본파일 ? fs.readFileSync(대본파일, 'utf8') : 받기('--대본', '');
  const 낼곳 = 받기('--낼곳', 'out/voice.wav');
  const 영상초 = Number(받기('--영상초', '0'));

  if (!대본.trim()) { console.error('⛔ --대본 "…" 또는 --대본파일 <길> 이 있어야 한다'); process.exit(2); }

  if (영상초 > 0) {
    const 잼 = 길이검사(대본, 영상초);
    if (!잼.됨) { console.error(`⛔ ${잼.까닭}\n   ⭐ 대본을 줄이거나 영상을 늘려라`); process.exit(1); }
    console.log(`· 대본 어림 ${잼.말초}초 / 한도 ${잼.한도}초 — 들어간다`);
  }

  목소리만들기(대본, 낼곳);
  const 진짜 = 잰길이(낼곳);
  console.log(`✅ ${낼곳}  ·  ${캐릭터.이름}(어린이) · ${진짜 ? 진짜.toFixed(1) + '초' : '길이 못 쟀다'}`);
  if (영상초 > 0 && 진짜 && 진짜 > 영상초) {
    console.error(`⛔ 만들고 보니 ${진짜.toFixed(1)}초다 — ${영상초}초 영상에 안 들어간다. 대본을 줄여라`);
    process.exit(1);
  }
}
