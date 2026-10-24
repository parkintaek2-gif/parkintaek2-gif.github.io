#!/usr/bin/env node
/**
 * make-video-seoulmarkets-entertainment.mjs — **SeoulMarkets 쇼츠.** 19.5초 · 1080×1920 · 영어.
 *   「코스피 −19% 인 10월에 오락·문화 지수 +6.9%」 (`/article/korea-entertainment-stocks-rose-october-2026-while-kospi-fell-19`)
 *
 * ── 왜 (2026-10-25 · 1번) ─────────────────────────────────────────
 * 사장님 8/28 「달랑 카드, 그래픽 등 스틸이미지 사용하지마 · 캐릭터를」 — make-video-seoulmarkets-vkospi.mjs 꼴 그대로,
 * 캐릭터(kcw-character.mjs)가 나오고 네 막대가 0 에서 자기 변화율까지 자란다(위로 +, 아래로 −).
 *
 * ── ⛔ 지키는 것 ───────────────────────────────────────────────────
 * ⛔ 수를 손으로 안 박는다 — src/data/sm-entertainment-oct.json (기사와 같은 수).
 * ⛔ 「사라」「팔라」를 안 쓴다. 끝에 Not investment advice.
 * ⛔ 어느 회사가 올렸는지 말하지 않는다 — 지수 파일에 종목 이름이 없다.
 * ⛔ 목소리는 Piper(en_US-hfc_male-medium, MIT, 로컬).
 *
 * 쓰는 법
 *   node scripts/make-video-seoulmarkets-entertainment.mjs --목소리
 *   node scripts/make-video-seoulmarkets-entertainment.mjs
 *   node scripts/make-video-seoulmarkets-entertainment.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { 캐릭터SVG, 사이, 술술 } from './kcw-character.mjs';
import { 섞기필터, 넘치나 } from './mix-voice-kcw.mjs';
import { 목소리 as KCW목소리, 파이퍼방, 소리길이 } from './make-voice-kcw.mjs';

const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
const 여기 = fileURLToPath(new URL('..', import.meta.url));

export const 초당 = 30;
export const 폭 = 1080;
export const 높 = 1920;
export const 총초 = 19.5;
export const 주소 = 'seoulmarkets.com';
const 슬러그 = 'korea-entertainment-stocks-rose-october-2026-while-kospi-fell-19';

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/sm-entertainment-oct.json'), 'utf8'));
const 퍼 = (v) => `${v > 0 ? 'up' : 'down'} ${Math.abs(v)} percent`;
export const 대사 = [
  `In October, Korea's KOSPI fell ${Math.abs(d.코스피.변화)} percent.`,
  `One sector index rose. Entertainment and culture was ${퍼(d.코스피오락.변화)}. On KOSDAQ, ${퍼(d.코스닥오락.변화)}.`,
  `It is still ${Math.abs(d.코스피오락.연초대비)} percent below where it began the year.`,
];
export const 목소리방 = 'archive/video/voice/sm-entertainment';
export const 목소리때들 = [0.6, 5.0, 13.6];

const ㄴ = (v) => Math.round(v * 100) / 100;
export const 막대들 = [
  { 이름: 'KOSPI', v: d.코스피.변화 },
  { 이름: `KOSPI entertainment (${d.코스피오락.종목수})`, v: d.코스피오락.변화 },
  { 이름: 'KOSDAQ', v: d.코스닥.변화 },
  { 이름: `KOSDAQ entertainment (${d.코스닥오락.종목수})`, v: d.코스닥오락.변화 },
];

export function 칸HTML(초, 말함) {
  const 머리 = 술술(사이(초, 0.0, 0.7));
  const 자람 = 막대들.map((_, i) => 술술(사이(초, [1.6, 5.6, 9.2, 10.6][i], [3.4, 7.4, 10.6, 12.0][i])));
  const 연초 = 술술(사이(초, 13.8, 14.6));
  const 끝 = 술술(사이(초, 18.0, 18.6));
  const 물러남 = 술술(사이(초, 1.2, 2.2));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);
  const 캐 = 캐릭터SVG(초, { 들어옴: 0.1, 그리는초: 1.0, 말함, 가리킴: [[5.0, 7.2]], 풀림: 18.0 });
  const 척 = 18; /* 1% = 18px — −19.07% 가 343px */
  const 줄 = 막대들.map((m, i) => {
    const 길이 = ㄴ(Math.abs(m.v) * 척 * 자람[i]);
    const 값 = (m.v * 자람[i]).toFixed(2);
    const 위 = m.v > 0;
    return `<div class="기둥" style="opacity:${ㄴ(Math.min(1, 자람[i] * 3) * (1 - 끝))}">
      <div class="위칸">${위 ? `<em class="초">+${값}%</em><b class="초막" style="height:${길이}px"></b>` : ''}</div>
      <div class="밑칸">${위 ? '' : `<b class="빨막" style="height:${길이}px"></b><em class="빨">${값}%</em>`}</div>
      <i>${m.이름}</i></div>`;
  }).join('');
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0d1420;color:#e8edf5;overflow:hidden;font-family:system-ui,'Segoe UI',sans-serif}
    .판{position:absolute;inset:0;padding:100px 84px}
    .누{position:absolute;left:${자리(232, 700)}px;top:${자리(430, 1370)}px;width:${자리(616, 290)}px;height:${자리(806, 380)}px;color:#6fb0f0}
    .누 svg{width:100%;height:100%}
    .띠{position:absolute;left:84px;top:56px;font-weight:700;font-size:24px;letter-spacing:.3em;color:#6fb0f0;opacity:${ㄴ(머리)}}
    .머리{font-size:56px;font-weight:700;line-height:1.18;opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font-size:26px;color:#93a0b4;opacity:${ㄴ(머리)}}
    .판막{position:relative;margin-top:30px;display:flex;gap:26px;height:720px;align-items:flex-start}
    .기둥{flex:1;display:flex;flex-direction:column;align-items:center}
    .위칸{height:230px;flex:none;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;width:100%;border-bottom:3px solid #3a465a}
    .밑칸{height:400px;flex:none;display:flex;flex-direction:column;align-items:center;width:100%}
    .초막,.빨막{display:block;width:120px;border-radius:4px}.초막{background:#5fc48a}.빨막{background:#e07a6a}
    .기둥 em{font-style:normal;font-weight:800;font-size:34px;margin:8px 0}.초{color:#5fc48a}.빨{color:#e07a6a}
    .기둥 i{font-style:normal;font-size:22px;color:#c4ccd9;text-align:center;margin-top:6px;line-height:1.25}
    .연초{margin-top:20px;padding:22px 26px;border-left:6px solid #6fb0f0;background:#141d2c;border-radius:10px;font-size:29px;line-height:1.5;opacity:${ㄴ(연초 * (1 - 끝))}}
    .가림{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#0d1420;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:42px;font-weight:800;line-height:1.25}
    .마무리 span{display:block;margin-top:14px;font-size:28px;font-weight:700;color:#6fb0f0}
    .마무리 i{display:block;margin-top:8px;font-size:22px;font-style:normal;color:#7f8a9c}
  </style>
  <div class="판">
    <div class="띠">SEOUL MARKETS</div>
    <div class="머리">The KOSPI fell.<br>Entertainment rose.</div>
    <div class="곁">Sector index closes, ${d.시작} → ${d.끝} 2026</div>
    <div class="판막">${줄}</div>
    <div class="연초">Year to date, entertainment is still <b>${d.코스피오락.연초대비}%</b> (KOSPI) and <b>${d.코스닥오락.연초대비}%</b> (KOSDAQ).</div>
    <div class="가림"></div>
    <div class="마무리"><b>Measured, not repeated.</b><span>${주소}</span><i>Korea Exchange index data via data.go.kr · Not investment advice</i></div>
    <div class="누">${캐}</div>
  </div>`;
}

function 말구간() {
  return 목소리때들.map((때, i) => {
    const 길 = path.join(여기, 목소리방, `${String(i).padStart(2, '0')}.wav`);
    const 초 = fs.existsSync(길) ? 소리길이(길) : 4;
    return [때, ㄴ(때 + 초)];
  });
}

const 내가돌려졌다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--목소리')) {
  const 방 = path.join(여기, 목소리방);
  fs.mkdirSync(방, { recursive: true });
  const 모델 = path.join(path.dirname(파이퍼방), `${KCW목소리.남.piper}.onnx`);
  대사.forEach((글, i) => {
    const 낼 = path.join(방, `${String(i).padStart(2, '0')}.wav`);
    const r = spawnSync(path.join(파이퍼방, 'piper.exe'), ['--model', 모델, '--output_file', 낼], { input: 글, encoding: 'utf8' });
    if (!fs.existsSync(낼)) { console.error('⛔ Piper 가 소리를 안 냈다', r.stderr?.slice(-300)); process.exit(1); }
    console.log(`✅ ${path.basename(낼)} ${소리길이(낼)?.toFixed(2)}초 — ${글}`);
  });
  process.exit(0);
}

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 말함 = 말구간();
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (이름, 참) => { if (참) 통과 += 1; else { 실패 += 1; console.log(`  ⛔ ${이름}`); } };
  재본다('⭐ 캐릭터가 첫 1초에 그려지고 있다', /stroke-dashoffset/.test(칸HTML(0.5, 말함)));
  재본다('⛔ 슬라이드쇼가 아니다', (() => { const xs = [0.5, 1.5, 2.5, 4, 5.5, 7, 9, 11, 13, 15].map((t) => 칸HTML(t, 말함)); return new Set(xs).size === xs.length; })());
  재본다('⛔ 화면에 한국어가 없다', !/[가-힣]/.test(글자만(칸HTML(14, 말함))));
  재본다('⭐ 다 자란 막대 값이 기사 값이다', [d.코스피.변화, d.코스피오락.변화, d.코스닥.변화, d.코스닥오락.변화].every((v) => 글자만(칸HTML(15, 말함)).includes(`${v > 0 ? '+' : ''}${v.toFixed(2)}%`)));
  재본다('⭐ 자료 속 변화율이 시작·끝 값과 맞다', [d.코스피, d.코스피오락, d.코스닥, d.코스닥오락].every((x) => Math.abs(((x.끝 / x.시작 - 1) * 100) - x.변화) < 0.006));
  재본다('⭐ 끝에 투자 권유 아님', 글자만(칸HTML(19.3, 말함)).includes('Not investment advice'));
  재본다('⛔ 사라·팔라를 안 쓴다', !/\b(buy|sell)\b/i.test(대사.join(' ')));
  재본다('⛔ 목소리가 화면 안에 끝난다', 말함.every(([, 끝]) => 끝 < 총초 - 0.8));
  재본다('⛔ 목소리 줄끼리 안 겹친다', 말함.every((w, i) => i === 0 || w[0] > 말함[i - 1][1]));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다) {
  const 낼길 = path.join(여기, 'public', 'video', `${슬러그}.mp4`);
  if (fs.existsSync(낼길)) { console.error(`⛔ 이미 있다 — 덮어쓰지 않는다: ${낼길}`); process.exit(1); }
  const 말함 = 말구간();
  const 임시 = path.join(여기, 'archive', '_칸smentertainment');
  fs.mkdirSync(임시, { recursive: true });
  const { default: puppeteer } = await import('file:///C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js');
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--font-render-hinting=none'] });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  const 칸수 = Math.round(총초 * 초당);
  for (let n = 0; n < 칸수; n += 1) {
    await p.setContent(칸HTML(n / 초당, 말함), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(임시, `${String(n).padStart(4, '0')}.png`) });
    if (n % 90 === 0) console.log(`  ${n}/${칸수}`);
  }
  await b.close();
  const 줄들 = 목소리때들.map((때, i) => {
    const 길 = path.join(여기, 목소리방, `${String(i).padStart(2, '0')}.wav`);
    if (!fs.existsSync(길)) { console.error('⛔ 목소리가 없다 — --목소리 로 먼저 낸다'); process.exit(1); }
    return { 길, 때, 초: 소리길이(길) };
  });
  const 넘은것 = 넘치나(줄들, 총초);
  if (넘은것.length) { console.error('⛔ 목소리가 영상보다 길다:', 넘은것); process.exit(1); }
  const ff = require('ffmpeg-static');
  const 인자 = ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png')];
  for (const 줄 of 줄들) 인자.push('-i', 줄.길);
  인자.push('-filter_complex', 섞기필터(줄들, 총초), '-map', '0:v', '-map', '[말끝]',
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', 낼길);
  execFileSync(ff, 인자, { stdio: 'ignore' });
  console.log(`✅ ${낼길}`);
  fs.rmSync(임시, { recursive: true, force: true });
}
