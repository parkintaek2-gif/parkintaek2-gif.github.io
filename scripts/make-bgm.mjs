#!/usr/bin/env node
/**
 * make-bgm.mjs — **숏영상에 깔 배경음악을 만든다.**
 *
 * 🔴 사장님(2026-08-09 02:2x) — *「숓영상에 목소리를 넣자. 배경음악은 네가 만들어」*
 *
 * ⭐ 왜 직접 만드나
 *   ① **저작권이 우리 것이다.** 받아 쓴 음악은 유튜브가 언제든 수익을 가져간다.
 *      3번이 오늘 올린 영상의 저작권 검사가 「문제 없음」이었던 것은 소리가 없었기 때문이다.
 *   ② 네 채널이 **같은 소리**를 낸다. 채널마다 결만 다르고 뿌리가 같으면 그게 브랜드다.
 *   ③ ⛔ **목소리 아래로 들어가야 한다.** 그래서 처음부터 작게 만든다(말이 주인공).
 *
 * 쓰는 법
 *   node scripts/make-bgm.mjs --결 백년지도 --초 14 --낼곳 out/bgm.m4a
 *   node scripts/make-bgm.mjs --자가시험
 *
 * ⚠ 깃발이 `--자가시험` 이다. `--selftest` 로 하면 **가져다 쓰는 쪽 검사를 가로챈다**
 *   (8/9 에 곰곰이가 그래서 세 자리를 속였다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

export const 소리결 = 48000;

/* ──────────────────────────────────────────────────────────────
 * 음
 * ────────────────────────────────────────────────────────────── */

/** 반음 수를 진동수로. 0 = 가온 도(261.63Hz) */
export const 음높이 = (반음) => 261.625565 * Math.pow(2, 반음 / 12);

/** 채널마다 다른 결. ⭐ 뿌리(5음계)는 같고 **자리와 빠르기만** 다르다 */
export const 결 = {
  백년지도: {
    이름: '따뜻하고 앞으로 나아가는',
    빠르기: 84,
    자리: [0, -5, -3, -7],          // C · G(아래) · A♭? → 아래 표대로 도-솔-라-파 자리
    화음: [[0, 4, 7], [-5, 0, 4], [-3, 0, 4], [-7, -3, 0]],
    구슬: [0, 2, 4, 7, 9, 12],       // 도레미솔라 — 5음계라 어긋난 소리가 안 난다
    맑기: 2600,
  },
  케이컬쳐와이어: {
    이름: '밝고 통통 튀는',
    빠르기: 100,
    화음: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],
    구슬: [0, 2, 4, 7, 9, 12, 14, 16],
    맑기: 3400,
  },
  서울마켓츠: {
    이름: '차분하고 또렷한',
    빠르기: 76,
    화음: [[0, 3, 7], [-5, -2, 0], [-4, 0, 3], [-7, -4, 0]],
    구슬: [0, 3, 5, 7, 10, 12],
    맑기: 2200,
  },
  케이라이프맵: {
    이름: '잔잔하고 깊은',
    빠르기: 68,
    화음: [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-9, -5, -2]],
    구슬: [0, 3, 7, 10, 12, 15],
    맑기: 1900,
  },
};

/* ──────────────────────────────────────────────────────────────
 * 소리 만들기 — 밖에서 받아 오는 것이 하나도 없다
 * ────────────────────────────────────────────────────────────── */

/** 앞은 부드럽게 들어오고 뒤는 부드럽게 빠진다. ⛔ 안 하면 「딱」 소리가 난다 */
export function 감쌈(i, 길이, 들이 = 0.2, 빠짐 = 0.5) {
  const 들칸 = Math.max(1, Math.floor(들이 * 소리결));
  const 뺄칸 = Math.max(1, Math.floor(빠짐 * 소리결));
  if (i < 들칸) return i / 들칸;
  if (i > 길이 - 뺄칸) return Math.max(0, (길이 - i) / 뺄칸);
  return 1;
}

/** 한 음을 그린다. 살짝 어긋난 셋을 겹쳐야 얇지 않다 */
export function 깔개(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const 어긋 = [1, 1.0013, 0.9987];                 // 미세하게 어긋내면 두꺼워진다
  for (let k = 0; k < 어긋.length; k += 1) {
    const w = (2 * Math.PI * 진동수 * 어긋[k]) / 소리결;
    for (let i = 0; i < 칸수; i += 1) {
      const t = w * i;
      소리[i] += (Math.sin(t) + 0.28 * Math.sin(2 * t) + 0.1 * Math.sin(3 * t)) / 어긋.length;
    }
  }
  for (let i = 0; i < 칸수; i += 1) 소리[i] *= 세기 * 감쌈(i, 칸수, 0.35, 0.9);
  return 소리;
}

/** 구슬 소리 — 톡 치고 사그라든다 */
export function 구슬(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const w = (2 * Math.PI * 진동수) / 소리결;
  for (let i = 0; i < 칸수; i += 1) {
    const 사그 = Math.exp(-i / (소리결 * 0.28));
    소리[i] = (Math.sin(w * i) + 0.35 * Math.sin(2.01 * w * i) * 사그) * 사그 * 세기;
  }
  return 소리;
}

/** 높은 소리를 깎는다 — 안 깎으면 말 위에서 귀에 거슬린다 */
export function 맑기깎기(소리, 자름) {
  const rc = 1 / (2 * Math.PI * 자름);
  const a = (1 / 소리결) / (rc + 1 / 소리결);
  const 나온것 = new Float64Array(소리.length);
  let 앞 = 0;
  for (let i = 0; i < 소리.length; i += 1) { 앞 += a * (소리[i] - 앞); 나온것[i] = 앞; }
  return 나온것;
}

/** 방에서 울리는 느낌 — 여러 번 늦게 겹쳐 준다 */
export function 울림(소리, 세기 = 0.26) {
  const 늦 = [0.031, 0.057, 0.089, 0.131].map((s) => Math.floor(s * 소리결));
  const 나온것 = Float64Array.from(소리);
  for (let k = 0; k < 늦.length; k += 1) {
    const d = 늦[k];
    const g = 세기 * Math.pow(0.62, k);
    for (let i = d; i < 소리.length; i += 1)나온것[i] += 나온것[i - d] * g;
  }
  return 나온것;
}

/**
 * 한 곡을 만든다.
 * ⛔ **크게 만들지 않는다.** 목소리가 주인공이다 — 이 소리는 그 아래에 깔린다.
 */
export function 곡만들기(결이름, 초, { 셈 = 0 } = {}) {
  const g = 결[결이름];
  if (!g) throw new Error(`⛔ 모르는 결: ${결이름} (있는 것: ${Object.keys(결).join(', ')})`);
  const 칸수 = Math.max(1, Math.floor(초 * 소리결));
  const 왼 = new Float64Array(칸수);
  const 오 = new Float64Array(칸수);

  const 한마디 = (60 / g.빠르기) * 4;              // 네 박이 한 마디
  const 마디수 = Math.ceil(초 / 한마디);

  for (let m = 0; m < 마디수; m += 1) {
    const 시작 = Math.floor(m * 한마디 * 소리결);
    const 화 = g.화음[m % g.화음.length];

    // 깔개 — 마디 내내 깔린다
    for (const 반음 of 화) {
      const 길 = Math.min(Math.floor(한마디 * 1.15 * 소리결), 칸수 - 시작);
      if (길 <= 0) continue;
      const 소리 = 맑기깎기(깔개(길, 음높이(반음 - 12), 0.16), g.맑기);
      for (let i = 0; i < 길; i += 1) { 왼[시작 + i] += 소리[i] * 0.92; 오[시작 + i] += 소리[i]; }
    }

    // 구슬 — 여덟 번 흩뿌린다. ⛔ 아무 음이나 안 쓴다. 5음계 안에서만 고른다
    for (let b = 0; b < 8; b += 1) {
      const 자리 = 시작 + Math.floor((b / 8) * 한마디 * 소리결);
      if (자리 >= 칸수) break;
      const 뽑기 = (m * 8 + b + 셈 * 3) % g.구슬.length;
      const 반음 = g.구슬[(뽑기 * 3 + m) % g.구슬.length];
      if (b % 2 === 1 && (m + b) % 3 === 0) continue;   // 쉬는 자리 — 꽉 차면 답답하다
      const 길 = Math.min(Math.floor(0.7 * 소리결), 칸수 - 자리);
      if (길 <= 0) continue;
      const 소리 = 구슬(길, 음높이(반음 + 12), 0.085);
      const 쪽 = b % 2 === 0 ? 0.75 : 1;               // 좌우로 살짝 벌린다
      for (let i = 0; i < 길; i += 1) { 왼[자리 + i] += 소리[i] * 쪽; 오[자리 + i] += 소리[i] * (1.75 - 쪽); }
    }
  }

  const 왼울 = 울림(왼);
  const 오울 = 울림(오);

  // 맨 앞뒤를 부드럽게 — ⛔ 안 하면 영상 시작에 「툭」 소리가 난다
  for (let i = 0; i < 칸수; i += 1) {
    const e = 감쌈(i, 칸수, 0.6, 1.2);
    왼울[i] *= e; 오울[i] *= e;
  }
  return { 왼: 왼울, 오: 오울 };
}

/** 제일 큰 소리를 정해진 높이에 맞춘다. ⭐ 0.16 = 말 아래로 들어가는 높이 */
export function 높이맞추기(왼, 오, 목표 = 0.16) {
  let 꼭 = 0;
  for (let i = 0; i < 왼.length; i += 1) 꼭 = Math.max(꼭, Math.abs(왼[i]), Math.abs(오[i]));
  if (꼭 === 0) return 1;
  return 목표 / 꼭;
}

/* ──────────────────────────────────────────────────────────────
 * 파일로 굽기
 * ────────────────────────────────────────────────────────────── */

/** 16비트 스테레오 WAV 로 만든다 */
export function 웨이브(왼, 오, 곱 = 1) {
  const 칸수 = 왼.length;
  const 몸 = Buffer.alloc(칸수 * 4);
  for (let i = 0; i < 칸수; i += 1) {
    const l = Math.max(-1, Math.min(1, 왼[i] * 곱));
    const r = Math.max(-1, Math.min(1, 오[i] * 곱));
    몸.writeInt16LE(Math.round(l * 32767), i * 4);
    몸.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const 머리 = Buffer.alloc(44);
  머리.write('RIFF', 0); 머리.writeUInt32LE(36 + 몸.length, 4); 머리.write('WAVE', 8);
  머리.write('fmt ', 12); 머리.writeUInt32LE(16, 16); 머리.writeUInt16LE(1, 20);
  머리.writeUInt16LE(2, 22); 머리.writeUInt32LE(소리결, 24);
  머리.writeUInt32LE(소리결 * 4, 28); 머리.writeUInt16LE(4, 32); 머리.writeUInt16LE(16, 34);
  머리.write('data', 36); 머리.writeUInt32LE(몸.length, 40);
  return Buffer.concat([머리, 몸]);
}

export const ff = () => {
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  return require('ffmpeg-static');
};

/* ──────────────────────────────────────────────────────────────
 * 검사 — ⛔ 깃발이 `--자가시험` 이다 (가져다 쓰는 쪽을 안 가로채려고)
 * ────────────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 120)}`); }
  };

  재본다('가온 도가 261.63Hz', Math.round(음높이(0) * 100) / 100, 261.63);
  재본다('한 옥타브 위는 두 배', Math.round(음높이(12)), Math.round(음높이(0) * 2));
  재본다('결이 넷 있다', Object.keys(결).length, 4);
  재본다('결마다 화음과 구슬이 있다',
    Object.values(결).every((g) => g.화음?.length && g.구슬?.length && g.빠르기 > 0), true);

  재본다('감쌈은 처음과 끝이 0에 가깝다', 감쌈(0, 48000) < 0.01 && 감쌈(47999, 48000) < 0.05, true);
  재본다('감쌈은 가운데가 1', 감쌈(24000, 48000, 0.05, 0.05), 1);

  const 짧 = 곡만들기('백년지도', 2);
  재본다('길이가 초에 맞는다', 짧.왼.length, 2 * 소리결);
  재본다('좌우 길이가 같다', 짧.왼.length === 짧.오.length, true);
  재본다('소리가 실제로 난다', 짧.왼.some((v) => Math.abs(v) > 0.001), true);
  재본다('좌우가 다르다 — 넓게 들린다',
    짧.왼.some((v, i) => Math.abs(v - 짧.오[i]) > 1e-9), true);

  /* ⛔ 제일 중요한 것 — **말 아래로 들어가는 크기**여야 한다 */
  const 곱 = 높이맞추기(짧.왼, 짧.오);
  let 꼭 = 0;
  for (let i = 0; i < 짧.왼.length; i += 1) 꼭 = Math.max(꼭, Math.abs(짧.왼[i] * 곱), Math.abs(짧.오[i] * 곱));
  재본다('높이를 맞추면 0.16 이 된다', Math.round(꼭 * 1000) / 1000, 0.16);
  재본다('말보다 작다 — 0.2 를 안 넘는다', 꼭 < 0.2, true);

  /* ⛔ 영상 맨 앞뒤에서 「툭」 소리가 나면 안 된다 */
  재본다('맨 앞이 조용하다', Math.abs(짧.왼[0]) < 0.001, true);
  재본다('맨 뒤가 조용하다', Math.abs(짧.왼[짧.왼.length - 1]) < 0.001, true);

  /* ⛔ 소리가 깨지면(-1~1 을 넘으면) 지직거린다 */
  const 웨 = 웨이브(짧.왼, 짧.오, 곱);
  재본다('웨이브 머리가 RIFF/WAVE', 웨.slice(0, 4).toString() + 웨.slice(8, 12).toString(), 'RIFFWAVE');
  재본다('웨이브 길이가 맞는다', 웨.length, 44 + 2 * 소리결 * 4);
  재본다('48kHz 로 적혔다', 웨.readUInt32LE(24), 48000);
  재본다('두 갈래(스테레오)로 적혔다', 웨.readUInt16LE(22), 2);
  재본다('소리가 안 깨진다', (() => {
    for (let i = 44; i < 웨.length; i += 2) if (Math.abs(웨.readInt16LE(i)) >= 32767) return false;
    return true;
  })(), true);

  재본다('결마다 빠르기가 다르다',
    new Set(Object.values(결).map((g) => g.빠르기)).size, Object.keys(결).length);
  재본다('결이 다르면 소리도 다르다', (() => {
    const a = 곡만들기('백년지도', 2).왼;
    const b = 곡만들기('케이라이프맵', 2).왼;
    return a.some((v, i) => Math.abs(v - b[i]) > 1e-6);
  })(), true);
  재본다('같은 결은 몇 번을 만들어도 같다', (() => {
    const a = 곡만들기('백년지도', 1).왼;
    const b = 곡만들기('백년지도', 1).왼;
    return a.every((v, i) => v === b[i]);
  })(), true);
  재본다('모르는 결이면 죽는다', (() => {
    try { 곡만들기('없는결', 1); return false; } catch { return true; }
  })(), true);
  재본다('0초를 달라 해도 안 죽는다', typeof 곡만들기('백년지도', 0).왼.length, 'number');

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 자가시험 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const argv = process.argv.slice(2);
  const 받기 = (이름, 기본) => { const i = argv.indexOf(이름); return i >= 0 ? argv[i + 1] : 기본; };
  const 결이름 = 받기('--결', '백년지도');
  const 초 = Number(받기('--초', '14'));
  const 낼곳 = 받기('--낼곳', `out/bgm-${결이름}-${초}s.m4a`);

  if (!결[결이름]) {
    console.error(`⛔ 모르는 결: ${결이름}\n   있는 것: ${Object.keys(결).map((k) => `${k}(${결[k].이름})`).join(' · ')}`);
    process.exit(2);
  }

  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  const { 왼, 오 } = 곡만들기(결이름, 초);
  const 곱 = 높이맞추기(왼, 오);
  const 임시 = 낼곳.replace(/\.[^.]+$/, '') + '.wav';
  fs.writeFileSync(임시, 웨이브(왼, 오, 곱));

  if (/\.wav$/i.test(낼곳)) {
    console.log(`✅ ${낼곳}  ·  ${결이름}(${결[결이름].이름}) · ${초}초`);
  } else {
    execFileSync(ff(), ['-y', '-i', 임시, '-c:a', 'aac', '-b:a', '192k', 낼곳], { stdio: 'pipe' });
    fs.unlinkSync(임시);
    console.log(`✅ ${낼곳}  ·  ${결이름}(${결[결이름].이름}) · ${초}초 · ${(fs.statSync(낼곳).size / 1024).toFixed(0)}KB`);
  }
  console.log('⛔ 이 소리는 **말 아래로** 들어가게 만들어져 있다. 볼륨을 더 올리지 마라.');
}
