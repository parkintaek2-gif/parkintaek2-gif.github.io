#!/usr/bin/env node
/**
 * make-voice-100y.mjs — 백년지도 숏영상 목소리. 한국어.
 *
 * 🔴 사장님(2026-08-29) — 「무성 콘텐트 다신 만들지 말 것」. 영상 생성기에서 빈 소리
 *   (anullsrc)를 빼라는 전사 지시. 100yearmap은 한국어 사이트라 K Culture Wire의
 *   영어 Piper 목소리(make-voice-kcw.mjs)를 그대로 못 쓴다 — 새로 만든다.
 *
 * ── 왜 Piper가 아니라 Windows SAPI(Heami)인가 ──────────────────────
 *   Piper 공식 한국어 목소리(ko_KR-kss-medium)를 licence부터 확인했다 — **CC BY-NC-SA
 *   4.0(비상업 전용)**이다. 「라이선스가 회색인 우회로는 안 쓴다. 우리는 상업 매체다」
 *   (make-voice-kcw.mjs의 원칙 그대로 적용) — 그래서 못 쓴다.
 *   이 기계에 이미 Windows 한국어 음성(Microsoft Heami Desktop)이 깔려 있다 — OS가
 *   제공하는 표준 API(System.Speech)로 로컬에서 돈다. 클라우드로 안 나가고, 열쇠도
 *   필요 없다. Zira(영어)가 이미 있던 것과 같은 자리다.
 *
 * ── ⛔ 대본이 지키는 것 ──────────────────────────────────────
 * ⛔ 화면에 없는 수를 말하지 않는다.
 * ⚠ 속도는 Rate=3(Windows SAPI 기준, -10~10)으로 고정한다 — 0(기본)은 너무 느려
 *   14초 영상에 문장 셋을 못 담는다. 직접 들어 보고 골랐다(자연스러움 vs 속도).
 *
 * 쓰는 법
 *   node scripts/make-voice-100y.mjs --out <dir> --줄 "문장1" --줄 "문장2" ...
 *     → <dir>/00.wav, 01.wav ... 로 낸다. 각 줄의 실제 길이(초)를 stdout에 찍는다
 *   node scripts/make-voice-100y.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

export const 목소리 = 'Microsoft Heami Desktop';
export const 속도 = 3;

/** ⛔ 따옴표·백틱이 PowerShell 문자열을 깨는 것을 막는다 */
export function PS안전(글) {
  return String(글).replace(/'/g, "''");
}

/** 여러 줄을 한 PowerShell 스크립트로 묶어 한 번에 낸다(SAPI 초기화를 줄마다 안 한다) */
export function PS스크립트(줄들, 낼방) {
  const 명령들 = 줄들.map((글, i) => {
    const 파일 = path.join(낼방, `${String(i).padStart(2, '0')}.wav`).replace(/\\/g, '\\\\');
    return `$s.SetOutputToWaveFile('${파일}'); $s.Speak('${PS안전(글)}');`;
  }).join('\n');
  return [
    'Add-Type -AssemblyName System.Speech',
    '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    `$s.SelectVoice('${목소리}')`,
    `$s.Rate = ${속도}`,
    명령들,
    '$s.Dispose()',
  ].join('\n');
}

export function 초읽기(wav파일) {
  const ffmpeg = require('ffmpeg-static');
  try {
    execFileSync(ffmpeg, ['-i', wav파일], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const m = e.stderr.toString().match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    if (!m) throw new Error(`⛔ 길이를 못 읽었다 — ${wav파일}`);
    return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
  }
  throw new Error('ffmpeg가 -i 만으로 실패하지 않았다 — 예상 밖');
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('PS안전 — 홑따옴표를 이중으로', PS안전("이건 '따옴표'다"), "이건 ''따옴표''다");
  재본다('PS스크립트 — 목소리를 고른다', PS스크립트(['가'], 'C:\\x'), (s) => s.includes(`SelectVoice('${목소리}')`));
  재본다('PS스크립트 — 줄마다 파일 번호가 다르다', PS스크립트(['가', '나'], 'C:\\x'),
    (s) => s.includes('00.wav') && s.includes('01.wav'));
  재본다('PS스크립트 — 속도를 지정한다', PS스크립트(['가'], 'C:\\x'), (s) => s.includes(`$s.Rate = ${속도}`));
  console.log(`목소리 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--자가시험')) {
  const 줄들 = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === '--줄') 줄들.push(process.argv[i + 1]);
  }
  const oi = process.argv.indexOf('--out');
  const 낼방 = oi >= 0 ? process.argv[oi + 1] : null;
  if (!낼방 || !줄들.length) {
    console.error('⛔ --out <dir> --줄 "문장" 이 필요하다');
    process.exit(1);
  }
  fs.mkdirSync(낼방, { recursive: true });
  const ps = PS스크립트(줄들, path.resolve(낼방));
  const ps파일 = path.join(낼방, '_말하기.ps1');
  /* ⛔ BOM 없이 쓰면 Windows PowerShell 5.1이 한글을 잘못 읽어 SAPI가 글자를
     하나씩 풀어 읽는다(9초짜리가 나온 원인). BOM을 붙여야 UTF-8로 확실히 읽힌다 */
  fs.writeFileSync(ps파일, `﻿${ps}`, 'utf8');
  execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps파일], { stdio: 'inherit' });
  fs.rmSync(ps파일);
  줄들.forEach((글, i) => {
    const 파일 = path.join(낼방, `${String(i).padStart(2, '0')}.wav`);
    const 초 = 초읽기(파일);
    console.log(`✅ ${String(i).padStart(2, '0')}.wav  ${초.toFixed(2)}초  "${글}"`);
  });
}
