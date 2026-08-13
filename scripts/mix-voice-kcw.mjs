#!/usr/bin/env node
/**
 * mix-voice-kcw.mjs — **숏영상에 목소리를 얹는다.**
 *
 * 🔴 사장님(2026-08-13) — 「숏영상에 목소리를 넣도록. 젊고 멋진 남성과 여성의 목소리로」
 *
 * ⛔ 목소리가 **영상 길이를 넘으면 잘린다.** 얹기 전에 재고, 넘으면 멈춘다.
 * ⛔ 소리 없는 판을 덮어쓰지 않는다 — 소리 없는 것도 쓸 데가 있다(자동재생 없는 자리).
 *
 * 쓰는 법
 *   node scripts/mix-voice-kcw.mjs --video <mp4> --voice <방> --out <mp4>
 *   node scripts/mix-voice-kcw.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

/**
 * 줄마다 `때` 초에 넣는다. ffmpeg 의 `adelay` 는 **밀리초**를 받는다.
 * ⚠ 채널마다 값을 줘야 한다(`|`) — 하나만 주면 한쪽 귀에서만 들린다. 그렇게 한 번 틀렸다.
 */
export function 섞기필터(줄들, 총초 = 14) {
  const 지연 = 줄들.map((줄, i) => {
    const ms = Math.round(줄.때 * 1000);
    return `[${i + 1}:a]adelay=${ms}|${ms},volume=1.6[v${i}]`;
  });
  const 입력 = 줄들.map((_, i) => `[v${i}]`).join('');
  return `${지연.join(';')};${입력}amix=inputs=${줄들.length}:normalize=0:duration=longest[말];`
    + `[말]atrim=0:${총초},asetpts=N/SR/TB[말끝]`;
}

/** ⛔ 목소리가 영상을 넘으면 잘린다 */
export function 넘치나(줄들, 총초 = 14) {
  return 줄들.filter((줄) => 줄.때 + (줄.초 ?? 0) > 총초)
    .map((줄) => `${줄.때}초 + ${줄.초}초 = ${(줄.때 + 줄.초).toFixed(1)}초`);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 셋 = [{ 때: 0.5, 초: 2 }, { 때: 4, 초: 1 }];
  재본다('섞기필터 — 줄마다 지연이 있다', 섞기필터(셋), (s) => s.includes('adelay=500|500') && s.includes('adelay=4000|4000'));
  재본다('⚠ 두 채널에 다 준다 — 한쪽 귀만 들리면 안 된다', 섞기필터(셋), (s) => !/adelay=\d+[,\]]/.test(s));
  재본다('섞기필터 — 입력 수가 맞다', 섞기필터(셋), (s) => s.includes('amix=inputs=2'));
  재본다('섞기필터 — 영상 길이에서 자른다', 섞기필터(셋, 14), (s) => s.includes('atrim=0:14'));
  재본다('넘치나 — 안 넘으면 빈 목록', 넘치나(셋), []);
  재본다('넘치나 — 넘으면 잡는다', 넘치나([{ 때: 13, 초: 3 }]), (x) => x.length === 1);
  console.log(`섞는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 값 = (깃발, 기본) => {
    const i = process.argv.indexOf(깃발);
    return i >= 0 ? process.argv[i + 1] : 기본;
  };
  const 영상 = 값('--video', 'archive/video/kcw-02-fame-compare.mp4');
  const 소리방 = 값('--voice', 'archive/video/voice');
  const 낼길 = 값('--out', 'archive/video/kcw-02-fame-compare-voiced.mp4');

  for (const p of [영상, path.join(소리방, 'script.json')]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const 대본 = JSON.parse(fs.readFileSync(path.join(소리방, 'script.json'), 'utf8'));
  const 줄들 = 대본.lines;

  const 넘은것 = 넘치나(줄들);
  if (넘은것.length) {
    console.error('⛔ 목소리가 영상보다 길다 — 얹으면 잘린다:');
    for (const t of 넘은것) console.error(`   · ${t}`);
    process.exit(1);
  }

  const ff = require('ffmpeg-static');
  const 인자 = ['-y', '-i', 영상];
  for (const 줄 of 줄들) 인자.push('-i', 줄.길);
  인자.push(
    '-filter_complex', 섞기필터(줄들),
    '-map', '0:v', '-map', '[말끝]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart', '-shortest', 낼길,
  );
  execFileSync(ff, 인자, { stdio: 'ignore' });

  const 크기 = (fs.statSync(낼길).size / 1024).toFixed(0);
  console.log(`✅ ${낼길}  ${크기}KB · ${줄들.length}줄`);
  console.log(`   ${대본.engine ?? '?'} · ${대본.license ?? '라이선스 안 적힘'}`);
  console.log(`   남 ${대본.voices?.남?.piper ?? '?'} · 여 ${대본.voices?.여?.piper ?? '?'}`);
}
