#!/usr/bin/env node
/**
 * make-video-seoulmarkets-post-results.mjs — **SeoulMarkets 쇼츠.** 20초 · 1080×1920 · 영어.
 *   「3분기 실적 뒤 증권사 보고서 138편 — 목표주가 19번 내리고 5번 올렸다. 새 목표 135개는 전부 주가 위」
 *   (`/article/korea-q3-results-broker-target-price-cuts-raises-after-earnings-october-2026`)
 *
 * ── 왜 (2026-10-31 · 1번) ─────────────────────────────────────────
 * make-video-seoulmarkets-earnings-weights.mjs 꼴 그대로 — 캐릭터(kcw-character.mjs)가 나오고,
 * 월~목 네 날마다 «내림»(호박색)·«올림»(파랑) 두 기둥이 그날 발표한 회사들에 대해 자란다.
 *
 * ── ⛔ 지키는 것 ───────────────────────────────────────────────────
 * ⛔ 수를 손으로 안 박는다 — src/data/sm-post-results-targets-oct.json (기사와 같은 수).
 * ⛔ 「사라」「팔라」를 안 쓴다. 끝에 Not investment advice.
 * ⛔ 「목표가 맞는다」고 쓰지 않는다 — 증권사가 낸 수를 센 것이다.
 * ⛔ 목소리는 Piper(en_US-hfc_male-medium, MIT, 로컬).
 *
 * 쓰는 법
 *   node scripts/make-video-seoulmarkets-post-results.mjs --목소리
 *   node scripts/make-video-seoulmarkets-post-results.mjs
 *   node scripts/make-video-seoulmarkets-post-results.mjs --selftest
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
const 슬러그 = 'korea-q3-results-broker-target-price-cuts-raises-after-earnings-october-2026';

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/sm-post-results-targets-oct.json'), 'utf8'));
const 웃돎 = Math.round((d.종가대비.중앙 - 1) * 100);
export const 대사 = [
  `${d.회사수} Korean companies reported third-quarter results this week. Brokers then wrote ${d.보고서수} reports on them.`,
  `Where we could compare, they cut ${d.합계.내림} target prices and raised ${d.합계.올림}. ${d.합계.그대로} stayed the same.`,
  `All ${d.목표있는보고서} new targets sit above the share price. The median is ${웃돎} percent higher.`,
];
export const 목소리방 = 'archive/video/voice/sm-post-results';
export const 목소리때들 = [0.4, 7.6, 13.2];

const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초, 말함) {
  const 머리 = 술술(사이(초, 0.0, 0.7));
  const 자람 = d.날별.map((_, i) => 술술(사이(초, 7.8 + i * 0.9, 9.0 + i * 0.9)));
  const 합 = 술술(사이(초, 11.4, 12.2));
  const 위 = 술술(사이(초, 13.4, 14.2));
  const 끝 = 술술(사이(초, 18.4, 19.0));
  const 물러남 = 술술(사이(초, 1.2, 2.2));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);
  const 캐 = 캐릭터SVG(초, { 들어옴: 0.1, 그리는초: 1.0, 말함, 가리킴: [[7.6, 10.4]], 풀림: 18.4 });
  const 척 = 42; /* 1건 = 42px — 10건이 420px */
  const 줄 = d.날별.map((x, i) => {
    const 내 = ㄴ(x.내림 * 척 * 자람[i]);
    const 올 = ㄴ(x.올림 * 척 * 자람[i]);
    const 다 = 자람[i] > 0.999;
    return `<div class="기둥" style="opacity:${ㄴ(Math.min(1, 자람[i] * 3) * (1 - 끝))}">
      <div class="위칸">
        <div class="한쌍"><div class="막대"><em class="호">${다 ? x.내림 : Math.round(x.내림 * 자람[i])}</em><b class="호막" style="height:${내}px"></b></div>
        <div class="막대"><em class="파">${다 ? x.올림 : Math.round(x.올림 * 자람[i])}</em><b class="파막" style="height:${올}px"></b></div></div>
      </div>
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
    .범례{margin-top:18px;font-size:26px;color:#c4ccd9;opacity:${ㄴ(머리)}}
    .범례 span{display:inline-block;width:22px;height:22px;border-radius:4px;vertical-align:-3px;margin:0 8px 0 0}
    .판막{position:relative;margin-top:22px;display:flex;gap:16px;height:640px;align-items:flex-start}
    .기둥{flex:1;display:flex;flex-direction:column;align-items:center}
    .위칸{height:540px;flex:none;display:flex;align-items:flex-end;justify-content:center;width:100%;border-bottom:3px solid #3a465a}
    .한쌍{display:flex;gap:10px;align-items:flex-end}
    .막대{display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
    .호막,.파막{display:block;width:76px;border-radius:4px 4px 0 0}.호막{background:#e0b04a}.파막{background:#6fb0f0}
    .막대 em{font-style:normal;font-weight:800;font-size:38px;margin:6px 0 4px}.호{color:#e0b04a}.파{color:#6fb0f0}
    .기둥 i{font-style:normal;font-size:26px;font-weight:700;color:#c4ccd9;text-align:center;margin-top:8px;line-height:1.3}
    .기둥 i small{font-size:18px;font-weight:400;color:#93a0b4}
    .합{margin-top:4px;padding:20px 26px;border-left:6px solid #e0b04a;background:#141d2c;border-radius:10px;font-size:30px;line-height:1.5;opacity:${ㄴ(합 * (1 - 끝))}}
    .위로{margin-top:16px;padding:20px 26px;border-left:6px solid #6fb0f0;background:#141d2c;border-radius:10px;font-size:30px;line-height:1.5;opacity:${ㄴ(위 * (1 - 끝))}}
    .가림{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#0d1420;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:70px;right:70px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:42px;font-weight:800;line-height:1.25}
    .마무리 span{display:block;margin-top:14px;font-size:28px;font-weight:700;color:#6fb0f0}
    .마무리 i{display:block;margin-top:8px;font-size:22px;font-style:normal;color:#7f8a9c}
  </style>
  <div class="판">
    <div class="띠">SEOUL MARKETS</div>
    <div class="머리">After Korea's Q3 results:<br>${d.합계.내림} target cuts, ${d.합계.올림} raises.</div>
    <div class="곁">${d.보고서수} broker reports on ${d.회사수} companies, dated after results day · 26–30 Oct 2026</div>
    <div class="범례"><span style="background:#e0b04a"></span>Cut vs same broker's last target &nbsp; <span style="background:#6fb0f0"></span>Raised</div>
    <div class="판막">${줄}</div>
    <div class="합"><b>${d.합계.그대로}</b> unchanged · <b>${d.합계.이전없음}</b> with no earlier target to compare. Cuts averaged <b>${d.내림평균.toFixed(1)}%</b>.</div>
    <div class="위로">All <b>${d.목표있는보고서}</b> new targets are above the 29 Oct close. Median: <b>${d.종가대비.중앙.toFixed(2)}×</b> the price.</div>
    <div class="가림"></div>
    <div class="마무리"><b>Counted, not forecast.</b><span>${주소}</span><i>Broker reports via Naver Finance · KRX close 29 Oct · Not investment advice</i></div>
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
  재본다('⛔ 슬라이드쇼가 아니다', (() => { const xs = [0.5, 1.5, 2.5, 4, 8.0, 8.8, 9.6, 10.6, 11.8, 13.8, 15].map((t) => 칸HTML(t, 말함)); return new Set(xs).size === xs.length; })());
  재본다('⛔ 화면에 한국어가 없다', !/[가-힣]/.test(글자만(칸HTML(15, 말함))));
  재본다('⭐ 날별 합이 합계와 맞다', d.날별.reduce((s, x) => s + x.내림, 0) === d.합계.내림
    && d.날별.reduce((s, x) => s + x.올림, 0) === d.합계.올림
    && d.날별.reduce((s, x) => s + x.그대로, 0) === d.합계.그대로
    && d.날별.reduce((s, x) => s + x.보고서, 0) === d.보고서수
    && d.날별.reduce((s, x) => s + x.회사, 0) === d.회사수);
  재본다('⭐ 갈래 합이 보고서 수다', d.합계.내림 + d.합계.올림 + d.합계.그대로 + d.합계.이전없음 + d.합계.목표없음 === d.보고서수);
  재본다('⭐ 견줄 수 있는 것 = 내림+올림+그대로', d.합계.내림 + d.합계.올림 + d.합계.그대로 === d.견줄수있는것);
  재본다('⭐ 다 자란 기둥 값이 자료 값이다', d.날별.every((x) => 글자만(칸HTML(15, 말함)).includes(`${x.보고서} reports`)));
  재본다('⭐ 끝에 투자 권유 아님', 글자만(칸HTML(19.8, 말함)).includes('Not investment advice'));
  재본다('⛔ 사라·팔라를 안 쓴다', !/\b(buy|sell)\b/i.test(대사.join(' ') + 글자만(칸HTML(15, 말함))));
  재본다('⛔ 목소리가 화면 안에 끝난다', 말함.every(([, 끝]) => 끝 < 총초 - 0.8));
  재본다('⛔ 목소리 줄끼리 안 겹친다', 말함.every((w, i) => i === 0 || w[0] > 말함[i - 1][1]));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다) {
  const 낼길 = path.join(여기, 'public', 'video', `${슬러그}.mp4`);
  if (fs.existsSync(낼길)) { console.error(`⛔ 이미 있다 — 덮어쓰지 않는다: ${낼길}`); process.exit(1); }
  const 말함 = 말구간();
  const 임시 = path.join(여기, 'archive', '_칸smpostresults');
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
