#!/usr/bin/env node
/**
 * mix-short.mjs — **숏영상에 목소리와 배경음악을 얹는다.**
 *
 * 🔴 사장님(2026-08-09 02:2x~02:3x)
 *   *「숓영상에 목소리를 넣자. 배경음악은 네가 만들어」*
 *   *「목소리는 캐릭터니 어린이가 하자」*
 *
 * ⭐ 이 한 줄이면 끝나게 만들었다. 각 자리가 **대본만** 쓰면 된다.
 *   node scripts/mix-short.mjs --영상 종로.mp4 --결 백년지도 \
 *     --대본 "종로구에 백 년 넘은 고등학교가 여덟 곳 있어요" --낼곳 out/종로-소리.mp4
 *
 * ⛔ 지켜지는 것 세 가지 — 손으로 안 해도 이 자가 지킨다
 *   ① **말이 주인공이다.** 배경음악은 말이 나오는 동안 저절로 낮아진다(더킹)
 *   ② **대본이 길면 만들기 전에 막는다.** 잘린 말이 나가는 것보다 낫다
 *   ③ **소리가 안 깨진다.** 마지막에 리미터를 건다
 *
 * ⚠ 깃발이 `--자가시험` 이다(`--selftest` 아님).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { 곡만들기, 높이맞추기, 웨이브, 결 } from './make-bgm.mjs';
import { 목소리만들기, 길이검사, 잰길이, 캐릭터 } from './make-voice.mjs';

export const ff = () => {
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  return require('ffmpeg-static');
};

/** 말이 시작하기 전 숨 돌릴 참. ⛔ 0으로 두면 영상이 시작하자마자 말이 튀어나온다 */
export const 앞참 = 0.55;

/**
 * 섞는 얼개.
 *   [1] 목소리 — 앞참만큼 늦추고, 스테레오로 편다
 *   [2] 배경음악 — 목소리를 옆줄로 받아 **말할 때 저절로 낮아진다**
 *   마지막에 리미터 — ⛔ 깨지면 안 된다
 */
export function 섞는얼개(앞참초 = 앞참) {
  const 밀리 = Math.round(앞참초 * 1000);
  return [
    `[1:a]aformat=channel_layouts=stereo,adelay=${밀리}|${밀리},apad[말]`,
    '[말]asplit=2[말쓸것][말재는것]',
    '[2:a][말재는것]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[깔개]',
    // ⛔ amix 는 넣은 수만큼 소리를 **나눈다.** 그대로 두면 −19dB 짜리가 나가서
    //    유튜브에서 혼자 작게 들린다. 그래서 유튜브 기준(−14 LUFS)으로 다시 올린다
    '[깔개][말쓸것]amix=inputs=2:duration=first:dropout_transition=0'
    + ',loudnorm=I=-14:TP=-1.0:LRA=11,alimiter=limit=0.95[소리]',
  ].join(';');
}

/** 영상이 몇 초인지 — ⛔ ffmpeg 는 stderr 로 말한다 */
export function 영상길이(길) {
  const r = spawnSync(ff(), ['-i', 길, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(String(r.stderr ?? ''));
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/** 소리가 실제로 들어 있나 — ⛔ 「만들었다」와 「소리가 난다」는 다르다 */
export function 소리있나(길) {
  const r = spawnSync(ff(), ['-i', 길, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /max_volume:\s*(-?[\d.]+) dB/.exec(String(r.stderr ?? ''));
  if (!m) return { 난다: false, 최대dB: null };
  const dB = Number(m[1]);
  return { 난다: dB > -60, 최대dB: dB };
}

/** 배경음악을 영상 길이에 맞춰 만든다 */
export function 깔개만들기(결이름, 초, 낼곳) {
  const { 왼, 오 } = 곡만들기(결이름, 초);
  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  fs.writeFileSync(낼곳, 웨이브(왼, 오, 높이맞추기(왼, 오)));
  return 낼곳;
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
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };

  const 얼개 = 섞는얼개();
  재본다('목소리를 앞참만큼 늦춘다', 얼개.includes('adelay=550|550'), true);
  재본다('말할 때 깔개가 낮아진다 — 더킹', 얼개.includes('sidechaincompress'), true);
  재본다('⛔ 목소리를 옆줄로 쓴다', 얼개.includes('asplit'), true);
  재본다('둘을 섞는다', 얼개.includes('amix=inputs=2'), true);
  재본다('깨지지 않게 막는다', 얼개.includes('alimiter'), true);
  재본다('⛔ 유튜브 크기(−14 LUFS)로 맞춘다', 얼개.includes('loudnorm=I=-14'), true);
  재본다('크기 맞춘 뒤에 리미터가 온다', 얼개.indexOf('loudnorm') < 얼개.indexOf('alimiter'), true);
  재본다('영상 길이에 맞춘다 — duration=first', 얼개.includes('duration=first'), true);
  재본다('앞참을 바꾸면 늦춤도 바뀐다', 섞는얼개(1.2).includes('adelay=1200|1200'), true);
  재본다('앞참이 0이면 안 늦춘다', 섞는얼개(0).includes('adelay=0|0'), true);

  /* ⛔ 얼개에 쓰는 이름이 모두 짝이 맞나 — 하나만 어긋나도 ffmpeg 가 죽는다.
   *   ⭐ 줄마다 **앞에 붙은 이름은 받는 것**, **뒤에 붙은 이름은 내놓는 것**이다 */
  const 이름읽기 = (줄) => {
    const 글 = 줄.trim();
    const 앞 = /^((?:\[[^\]]+\])+)/.exec(글);
    const 뒤 = /((?:\[[^\]]+\])+)$/.exec(글);
    const 뽑기 = (m) => (m ? [...m[1].matchAll(/\[([^\]]+)\]/g)].map((x) => x[1]) : []);
    return { 받는것: 뽑기(앞), 내놓는것: 뽑기(뒤) };
  };
  재본다('받는 이름이 모두 앞에서 만들어진다', (() => {
    const 생김 = new Set();
    for (const 줄 of 얼개.split(';')) {
      const { 받는것, 내놓는것 } = 이름읽기(줄);
      for (const n of 받는것) {
        if (/^\d+:[av]$/.test(n)) continue;      // ffmpeg 로 들어온 파일
        if (!생김.has(n)) return false;
      }
      내놓는것.forEach((n) => 생김.add(n));
    }
    return true;
  })(), true);
  재본다('⛔ 만든 이름을 두 번 쓰지 않는다', (() => {
    const 쓴횟수 = new Map();
    for (const 줄 of 얼개.split(';')) {
      for (const n of 이름읽기(줄).받는것) 쓴횟수.set(n, (쓴횟수.get(n) ?? 0) + 1);
    }
    return [...쓴횟수.values()].every((v) => v === 1);
  })(), true);
  재본다('⛔ 안 쓰이고 버려지는 이름이 없다', (() => {
    const 쓴것 = new Set();
    const 만든것 = new Set();
    for (const 줄 of 얼개.split(';')) {
      const { 받는것, 내놓는것 } = 이름읽기(줄);
      받는것.forEach((n) => 쓴것.add(n));
      내놓는것.forEach((n) => 만든것.add(n));
    }
    return [...만든것].every((n) => 쓴것.has(n) || n === '소리');   // 소리는 -map 이 가져간다
  })(), true);
  재본다('마지막 이름이 소리다', 얼개.trim().endsWith('[소리]'), true);

  /* 대본 길이 — 여기서 막아야 잘린 말이 안 나간다 */
  재본다('14초에 긴 대본은 막힌다', 길이검사('가'.repeat(150), 14).됨, false);
  재본다('14초에 짧은 대본은 통과', 길이검사('가'.repeat(40), 14).됨, true);

  재본다('결이 넷 다 있다', Object.keys(결).length, 4);
  재본다('캐릭터는 어린이 하나', 캐릭터.올림 > 1 && 캐릭터.이름.length > 0, true);

  /* 진짜로 소리를 만들어 본다 — ⛔ 얼개만 맞고 소리가 안 나면 헛것이다 */
  const 방 = fs.mkdtempSync(path.join(os.tmpdir(), 'mix-'));
  const 깔 = 깔개만들기('백년지도', 2, path.join(방, 'bgm.wav'));
  재본다('깔개 파일이 생긴다', fs.existsSync(깔), true);
  재본다('깔개에서 소리가 난다', 소리있나(깔).난다, true);
  재본다('⛔ 깔개는 말보다 작다 — −12dB 아래', 소리있나(깔).최대dB < -12, true);
  fs.rmSync(방, { recursive: true, force: true });

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 자가시험 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const argv = process.argv.slice(2);
  const 받기 = (이름, 기본) => { const i = argv.indexOf(이름); return i >= 0 ? argv[i + 1] : 기본; };
  const 영상 = 받기('--영상', '');
  const 결이름 = 받기('--결', '백년지도');
  const 대본파일 = 받기('--대본파일', '');
  const 대본 = 대본파일 ? fs.readFileSync(대본파일, 'utf8') : 받기('--대본', '');
  const 낼곳 = 받기('--낼곳', 'out/short-소리.mp4');

  if (!영상 || !fs.existsSync(영상)) { console.error('⛔ --영상 <mp4> 가 있어야 한다'); process.exit(2); }
  if (!대본.trim()) { console.error('⛔ --대본 "…" 또는 --대본파일 <길> 이 있어야 한다'); process.exit(2); }
  if (!결[결이름]) { console.error(`⛔ 모르는 결: ${결이름}\n   있는 것: ${Object.keys(결).join(' · ')}`); process.exit(2); }

  const 초 = 영상길이(영상);
  if (!초) { console.error('⛔ 영상 길이를 못 쟀다'); process.exit(1); }

  // ① 대본이 들어가나 — ⛔ 만들기 전에 막는다
  const 잼 = 길이검사(대본, 초);
  if (!잼.됨) { console.error(`⛔ ${잼.까닭}\n   ⭐ 대본을 줄여라`); process.exit(1); }
  console.log(`· 영상 ${초.toFixed(1)}초 · 대본 어림 ${잼.말초}초 (한도 ${잼.한도}초)`);

  const 방 = fs.mkdtempSync(path.join(os.tmpdir(), 'mix-'));
  const 말길 = path.join(방, 'voice.wav');
  const 깔길 = path.join(방, 'bgm.wav');

  목소리만들기(대본, 말길);
  const 말초 = 잰길이(말길);
  console.log(`· 목소리 ${캐릭터.이름}(어린이) ${말초 ? 말초.toFixed(1) : '?'}초`);
  if (말초 && 말초 + 앞참 > 초) {
    console.error(`⛔ 만들고 보니 말이 ${(말초 + 앞참).toFixed(1)}초다 — ${초.toFixed(1)}초 영상에 안 들어간다. 대본을 줄여라`);
    fs.rmSync(방, { recursive: true, force: true });
    process.exit(1);
  }

  깔개만들기(결이름, 초, 깔길);
  console.log(`· 배경음악 ${결이름}(${결[결이름].이름}) ${초.toFixed(1)}초`);

  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  const r = spawnSync(ff(), [
    '-y', '-i', 영상, '-i', 말길, '-i', 깔길,
    '-filter_complex', 섞는얼개(),
    '-map', '0:v', '-map', '[소리]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', 낼곳,
  ], { encoding: 'utf8' });
  fs.rmSync(방, { recursive: true, force: true });

  if (r.status !== 0) { console.error('⛔ 섞다가 죽었다\n' + String(r.stderr).split('\n').slice(-12).join('\n')); process.exit(1); }

  // ② 정말 소리가 나나 — ⛔ 「만들었다」로 안 끝낸다
  const 소리 = 소리있나(낼곳);
  if (!소리.난다) { console.error('⛔ 만들어졌는데 소리가 안 난다'); process.exit(1); }
  // ⛔ 「소리가 난다」로 안 끝낸다. **들릴 만큼 나야** 한다 —
  //    8/9 첫 판이 −19.5dB 로 나왔다. 유튜브에서 우리 영상만 혼자 작게 들렸을 것이다
  if (소리.최대dB < -9) {
    console.error(`⛔ 소리가 너무 작다 (최대 ${소리.최대dB}dB). 유튜브에서 우리 것만 작게 들린다`);
    process.exit(1);
  }
  const 끝초 = 영상길이(낼곳);
  console.log(`✅ ${낼곳}  ·  ${끝초 ? 끝초.toFixed(1) + '초' : '?'} · 소리 최대 ${소리.최대dB}dB · ${(fs.statSync(낼곳).size / 1024 / 1024).toFixed(1)}MB`);
  console.log('⚠ 올리기 전에 **한 번 들어 보라.** 자는 「소리가 난다」까지만 본다 — 말이 예쁜지는 귀가 본다');
}
