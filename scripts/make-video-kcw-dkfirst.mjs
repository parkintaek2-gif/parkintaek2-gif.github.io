#!/usr/bin/env node
/**
 * make-video-kcw-dkfirst.mjs — **K Culture Wire 쇼츠.** 1080×1920 · 영어 · 목소리 있음.
 *   「디플러스 기아가 롤드컵 2026 8강 첫 진출 — 지난 두 해 첫 진출 팀은 우승 못 했다」
 *   (`/article/dplus-kia-first-into-worlds-2026-quarter-finals-first-in-has-not-won`)
 *
 * ── 왜 (2026-10-26 · 1번) ─────────────────────────────────
 * make-video-kcw-lisaminnie.mjs 꼴 그대로 — 캐릭터가 나오고, 두 판의 킬 막대가 자라고,
 * 2024·2025 «진출 순서» 사다리에서 우승팀 칸이 켜진다. 슬라이드쇼가 아니다.
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────
 * ⛔ 수를 손으로 안 박는다 — src/data/kcw-dkfirst.json (기사와 같은 수).
 * ⛔ 화면에 한국어를 안 쓴다. ⛔ 예측으로 읽지 않는다 — 「count, not a forecast」를 화면·대사 둘 다에.
 * ⛔ 목소리는 Piper(en_US-hfc_male-medium, MIT, 로컬).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-dkfirst.mjs --목소리
 *   node scripts/make-video-kcw-dkfirst.mjs --selftest
 *   node scripts/make-video-kcw-dkfirst.mjs
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
export const 총초 = 23.5;
export const 주소 = 'kculturewire.com';
export const 낼이름 = 'dplus-kia-first-into-worlds-2026-quarter-finals-first-in-has-not-won-voiced';

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/kcw-dkfirst.json'), 'utf8'));
const [g1, g2] = d.경기;
const [y24, y25] = d.지난해;
const 서수 = (n) => ({ 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth' })[n];
export const 대사 = [
  'Dplus Kia are the first team into the Worlds twenty twenty-six quarter-finals, with three wins and no losses.',
  `They beat Movistar KOI two-nil. ${g1.디플킬} kills to ${g1.상대킬}, then ${g2.디플킬} to ${g2.상대킬}.`,
  `The last two teams in first did not win. T1 did, qualifying ${서수(y24.우승순서)} in ${y24.해}, and ${서수(y25.우승순서)} in ${y25.해}. A count, not a forecast.`,
];
export const 목소리방 = 'archive/video/voice/kcw-dkfirst';
export const 목소리때들 = [0.6, 6.9, 12.4];

const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초, 말함) {
  const 머리 = 술술(사이(초, 0.0, 0.7));
  const 킬칸 = 술술(사이(초, 7.0, 8.2));
  const 킬1 = 술술(사이(초, 8.0, 9.4));
  const 킬2 = 술술(사이(초, 9.8, 11.2));
  const 사다리 = 술술(사이(초, 12.4, 13.6));
  const 불24 = 술술(사이(초, 15.6, 16.4));
  const 불25 = 술술(사이(초, 17.4, 18.2));
  const 끝 = 술술(사이(초, 22.0, 22.6));
  const 물러남 = 술술(사이(초, 1.2, 2.2));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);
  const 캐 = 캐릭터SVG(초, { 들어옴: 0.1, 그리는초: 1.0, 말함, 가리킴: [[7.0, 9.0], [15.6, 18.2]], 풀림: 22.0 });
  const 최대 = Math.max(g1.디플킬, g2.디플킬);
  const 폭 = (v) => ㄴ((v / 최대) * 640);
  const 줄 = (이름, v, 자람, 색) => `<div class="줄"><i>${이름} ${Math.round(v * 자람)}</i><div class="막 ${색}" style="width:${폭(v) * 자람}px"></div></div>`;
  const 칸들 = (y, 불) => Array.from({ length: y.전체 }, (_, i) => {
    const n = i + 1;
    const 켬 = n === y.우승순서 ? 불 : 0;
    const 첫 = n === 1;
    return `<div class="칸칸${첫 ? ' 첫' : ''}" style="background:rgba(240,179,90,${ㄴ(켬)})">${n}${켬 > 0.5 ? '<b>T1</b>' : ''}</div>`;
  }).join('');
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1080px;height:1920px;background:#13111f;color:#ecebf3;overflow:hidden;font-family:Georgia,'Times New Roman',serif}
    .판{position:absolute;inset:0;padding:100px 84px}
    .누{position:absolute;left:${자리(232, 700)}px;top:${자리(430, 1370)}px;width:${자리(616, 290)}px;height:${자리(806, 380)}px;color:#b9a2ff}
    .누 svg{width:100%;height:100%}
    .띠{position:absolute;left:84px;top:56px;font:600 24px system-ui,sans-serif;letter-spacing:.2em;color:#b9a2ff;opacity:${ㄴ(머리)}}
    .머리{font-size:56px;line-height:1.18;opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font:400 26px system-ui,sans-serif;color:#9c99b0;opacity:${ㄴ(머리)}}
    .칸{margin-top:40px;font:400 28px system-ui,sans-serif}
    .줄{margin-top:12px}.줄 i{display:block;font-style:normal;color:#c9c6d8;margin-bottom:6px}
    .막{height:30px;border-radius:5px}
    .디{background:#8fd3f2}.상{background:#6b6880}
    .제목{font:600 24px system-ui,sans-serif;letter-spacing:.08em;color:#9c99b0;margin-top:14px}
    .사{display:flex;gap:10px;margin-top:10px}
    .칸칸{width:66px;height:66px;border:2px solid #4a4660;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 24px system-ui,sans-serif;color:#ecebf3}
    .칸칸.첫{border-color:#8fd3f2}
    .칸칸 b{font-size:16px}
    .풀이{margin-top:10px;font:400 22px system-ui,sans-serif;color:#9c99b0}
    .가림{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#13111f;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:44px;line-height:1.25}
    .마무리 span{display:block;margin-top:14px;font:600 28px system-ui,sans-serif;color:#b9a2ff}
    .마무리 i{display:block;margin-top:8px;font:400 22px system-ui,sans-serif;font-style:normal;color:#8a879c}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE</div>
    <div class="머리">Dplus Kia, first into<br>the Worlds 2026 quarters</div>
    <div class="곁">Swiss Stage 3-0 · 26 October 2026 KST · Riot official stats</div>
    <div class="칸" style="opacity:${ㄴ(킬칸 * (1 - 사다리 * 0.65) * (1 - 끝))}">
      <div class="제목">KILLS · GAME 1</div>
      ${줄('Dplus Kia', g1.디플킬, 킬1, '디')}${줄('Movistar KOI', g1.상대킬, 킬1, '상')}
      <div class="제목">KILLS · GAME 2</div>
      ${줄('Dplus Kia', g2.디플킬, 킬2, '디')}${줄('Movistar KOI', g2.상대킬, 킬2, '상')}
    </div>
    <div class="칸" style="opacity:${ㄴ(사다리 * (1 - 끝))}">
      <div class="제목">ORDER OF QUALIFYING · ${y24.해}</div><div class="사">${칸들(y24, 불24)}</div>
      <div class="제목">ORDER OF QUALIFYING · ${y25.해}</div><div class="사">${칸들(y25, 불25)}</div>
      <div class="풀이">First in: ${y24.첫진출} (out: ${y24.첫진출끝}), ${y25.첫진출} (lost the ${y25.첫진출끝.toLowerCase()})</div>
      <div class="풀이">A count, not a forecast.</div>
    </div>
    <div class="가림"></div>
    <div class="마무리"><b>Counted, not predicted.</b><span>${주소}</span><i>Riot Games official schedule and live stats · 2024, 2025, 2026</i></div>
    <div class="누">${캐}</div>
  </div>`;
}

function 말구간() {
  return 목소리때들.map((때, i) => {
    const 길 = path.join(여기, 목소리방, `${String(i).padStart(2, '0')}.wav`);
    const 초 = fs.existsSync(길) ? 소리길이(길) : 4.5;
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
  재본다('⛔ 슬라이드쇼가 아니다 — 열 시각이 다 다른 그림', (() => { const xs = [0.5, 1.5, 2.5, 4, 7.5, 8.7, 10.5, 13, 15.4, 17].map((t) => 칸HTML(t, 말함)); return new Set(xs).size === xs.length; })());
  재본다('⛔ 화면에 한국어가 없다', !/[가-힣]/.test(글자만(칸HTML(12, 말함))) && !/[가-힣]/.test(글자만(칸HTML(18, 말함))));
  재본다('⭐ 킬 수가 화면에 있다', 글자만(칸HTML(12, 말함)).includes(`Dplus Kia ${g1.디플킬}`) && 글자만(칸HTML(12, 말함)).includes(`Movistar KOI ${g2.상대킬}`));
  재본다('⭐ 대사 속 수가 자료와 같다', 대사[1].includes(String(g1.디플킬)) && 대사[1].includes(String(g2.상대킬)) && 대사[2].includes(서수(y25.우승순서)));
  재본다('⭐ 「예측이 아니다」를 화면·대사 둘 다에', 글자만(칸HTML(18, 말함)).includes('not a forecast') && 대사[2].includes('not a forecast'));
  재본다('⭐ 우승팀 칸이 켜진다', 글자만(칸HTML(18, 말함)).includes('T1'));
  재본다('⭐ 끝에 주소', 글자만(칸HTML(23.3, 말함)).includes(주소));
  재본다('⛔ 목소리가 화면 안에 끝난다', 말함.every(([, 끝]) => 끝 < 총초 - 0.8));
  재본다('⛔ 목소리 줄끼리 안 겹친다', 말함.every((w, i) => i === 0 || w[0] > 말함[i - 1][1]));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  console.log('  말구간', JSON.stringify(말함));
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다) {
  const oi = process.argv.indexOf('--out');
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, `public/wikitip/video/${낼이름}.mp4`);
  if (fs.existsSync(낼길)) { console.error(`⛔ 이미 있다 — 덮어쓰지 않는다: ${낼길}`); process.exit(1); }
  const 말함 = 말구간();
  const 임시 = path.join(여기, 'archive', '_칸kcwdkfirst');
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
