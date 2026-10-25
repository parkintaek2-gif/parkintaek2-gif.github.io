#!/usr/bin/env node
/**
 * make-video-seoulmarkets-earnings-week.mjs — **SeoulMarkets 쇼츠.** 20초 · 1080×1920 · 영어.
 *   「실적 주간 28개사 — 목표주가 11번 내리고 9번 올렸다, 8곳은 보고서가 없다」
 *   (`/article/korea-q3-earnings-week-october-26-30-2026-analyst-target-prices`)
 *
 * ── 왜 (2026-10-26 · 1번) ─────────────────────────────────────────
 * make-video-seoulmarkets-entertainment.mjs 꼴 그대로 — 캐릭터(kcw-character.mjs)가 나오고,
 * 월~금 다섯 기둥에서 «올림»은 위로(초록), «내림»은 아래로(빨강) 자란다.
 *
 * ── ⛔ 지키는 것 ───────────────────────────────────────────────────
 * ⛔ 수를 손으로 안 박는다 — src/data/sm-earnings-week-oct.json (기사와 같은 수).
 * ⛔ 「사라」「팔라」를 안 쓴다. 끝에 Not investment advice.
 * ⛔ 「보고서 없음」은 «이 목록에 없음»이다 — 화면에 in our list 를 적는다.
 * ⛔ 목소리는 Piper(en_US-hfc_male-medium, MIT, 로컬).
 *
 * 쓰는 법
 *   node scripts/make-video-seoulmarkets-earnings-week.mjs --목소리
 *   node scripts/make-video-seoulmarkets-earnings-week.mjs
 *   node scripts/make-video-seoulmarkets-earnings-week.mjs --selftest
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
export const 총초 = 20;
export const 주소 = 'seoulmarkets.com';
const 슬러그 = 'korea-q3-earnings-week-october-26-30-2026-analyst-target-prices';

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/sm-earnings-week-oct.json'), 'utf8'));
const 말수 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const 읽기 = (n) => 말수[n] ?? String(n);
export const 대사 = [
  `${d.회사수} Korean companies report third-quarter results this week.`,
  `In our broker list, analysts cut ${읽기(d.합계.내림)} of their targets and raised ${읽기(d.합계.올림)}. Friday, with Kia and Hyundai Mobis, took the most cuts.`,
  `And ${읽기(d.보고서없는회사)} of the ${d.회사수} drew no company report in the list at all.`,
];
export const 목소리방 = 'archive/video/voice/sm-earnings-week';
export const 목소리때들 = [0.6, 4.6, 13.2];

const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초, 말함) {
  const 머리 = 술술(사이(초, 0.0, 0.7));
  const 자람 = d.날별.map((_, i) => 술술(사이(초, 4.8 + i * 1.3, 6.2 + i * 1.3)));
  const 합 = 술술(사이(초, 11.6, 12.4));
  const 없음 = 술술(사이(초, 13.4, 14.2));
  const 끝 = 술술(사이(초, 18.4, 19.0));
  const 물러남 = 술술(사이(초, 1.2, 2.2));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);
  const 캐 = 캐릭터SVG(초, { 들어옴: 0.1, 그리는초: 1.0, 말함, 가리킴: [[4.6, 7.0]], 풀림: 18.4 });
  const 척 = 46; /* 보고서 1건 = 46px — 4건이 184px */
  const 줄 = d.날별.map((x, i) => {
    const 위 = ㄴ(x.올림 * 척 * 자람[i]);
    const 밑 = ㄴ(x.내림 * 척 * 자람[i]);
    return `<div class="기둥" style="opacity:${ㄴ(Math.min(1, 자람[i] * 3) * (1 - 끝))}">
      <div class="위칸"><em class="초">${x.올림 ? `+${Math.round(x.올림 * 자람[i])}` : '0'}</em><b class="초막" style="height:${위}px"></b></div>
      <div class="밑칸"><b class="빨막" style="height:${밑}px"></b><em class="빨">${x.내림 ? `−${Math.round(x.내림 * 자람[i])}` : '0'}</em></div>
      <i>${x.날}<br><small>${x.회사} cos · ${x.보고서} reports</small></i></div>`;
  }).join('');
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0d1420;color:#e8edf5;overflow:hidden;font-family:system-ui,'Segoe UI',sans-serif}
    .판{position:absolute;inset:0;padding:100px 70px}
    .누{position:absolute;left:${자리(232, 720)}px;top:${자리(430, 1380)}px;width:${자리(616, 280)}px;height:${자리(806, 370)}px;color:#6fb0f0}
    .누 svg{width:100%;height:100%}
    .띠{position:absolute;left:70px;top:56px;font-weight:700;font-size:24px;letter-spacing:.3em;color:#6fb0f0;opacity:${ㄴ(머리)}}
    .머리{font-size:54px;font-weight:700;line-height:1.18;opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font-size:26px;color:#93a0b4;opacity:${ㄴ(머리)}}
    .보기{margin-top:18px;font-size:24px;color:#c4ccd9;opacity:${ㄴ(머리)}}.보기 b{color:#5fc48a}.보기 s{text-decoration:none;font-weight:700;color:#e07a6a}
    .판막{position:relative;margin-top:24px;display:flex;gap:16px;height:640px;align-items:flex-start}
    .기둥{flex:1;display:flex;flex-direction:column;align-items:center}
    .위칸{height:250px;flex:none;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;width:100%;border-bottom:3px solid #3a465a}
    .밑칸{height:250px;flex:none;display:flex;flex-direction:column;align-items:center;width:100%}
    .초막,.빨막{display:block;width:110px;border-radius:4px}.초막{background:#5fc48a}.빨막{background:#e07a6a}
    .기둥 em{font-style:normal;font-weight:800;font-size:36px;margin:8px 0}.초{color:#5fc48a}.빨{color:#e07a6a}
    .기둥 i{font-style:normal;font-size:26px;font-weight:700;color:#c4ccd9;text-align:center;margin-top:8px;line-height:1.3}
    .기둥 small{font-size:18px;font-weight:400;color:#93a0b4}
    .합{margin-top:4px;padding:20px 26px;border-left:6px solid #6fb0f0;background:#141d2c;border-radius:10px;font-size:30px;line-height:1.5;opacity:${ㄴ(합 * (1 - 끝))}}
    .없음{margin-top:16px;padding:20px 26px;border-left:6px solid #e0b04a;background:#141d2c;border-radius:10px;font-size:30px;line-height:1.5;opacity:${ㄴ(없음 * (1 - 끝))}}
    .가림{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#0d1420;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:70px;right:70px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:42px;font-weight:800;line-height:1.25}
    .마무리 span{display:block;margin-top:14px;font-size:28px;font-weight:700;color:#6fb0f0}
    .마무리 i{display:block;margin-top:8px;font-size:22px;font-style:normal;color:#7f8a9c}
  </style>
  <div class="판">
    <div class="띠">SEOUL MARKETS</div>
    <div class="머리">${d.회사수} companies report<br>Q3 this week.</div>
    <div class="곁">Broker target prices in the month before, 26–30 October 2026</div>
    <div class="보기"><b>up = target raised</b> · <s>down = target cut</s></div>
    <div class="판막">${줄}</div>
    <div class="합"><b>${d.보고서수}</b> company reports: <b>${d.합계.내림}</b> cuts, <b>${d.합계.올림}</b> raises, ${d.합계.그대로} unchanged.</div>
    <div class="없음"><b>${d.보고서없는회사} of ${d.회사수}</b> companies: no company report in our list.</div>
    <div class="가림"></div>
    <div class="마무리"><b>Measured, not repeated.</b><span>${주소}</span><i>Hankyung Consensus list (12 publishers) · Not investment advice</i></div>
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
  재본다('⛔ 화면에 한국어가 없다', !/[가-힣]/.test(글자만(칸HTML(15, 말함))));
  재본다('⭐ 날별 합이 합계와 맞다', ['내림', '올림'].every((k) => d.날별.reduce((s, x) => s + x[k], 0) === d.합계[k])
    && d.날별.reduce((s, x) => s + x.보고서, 0) === d.보고서수 && d.날별.reduce((s, x) => s + x.회사, 0) === d.회사수);
  재본다('⭐ 합계 다섯 칸이 보고서 수와 맞다', Object.values(d.합계).reduce((s, v) => s + v, 0) === d.보고서수);
  재본다('⭐ 다 자란 기둥 값이 자료 값이다', d.날별.every((x) => 글자만(칸HTML(15, 말함)).includes(x.올림 ? `+${x.올림}` : '0') && 글자만(칸HTML(15, 말함)).includes(x.내림 ? `−${x.내림}` : '0')));
  재본다('⭐ 끝에 투자 권유 아님', 글자만(칸HTML(19.8, 말함)).includes('Not investment advice'));
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
  const 임시 = path.join(여기, 'archive', '_칸smearningsweek');
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
