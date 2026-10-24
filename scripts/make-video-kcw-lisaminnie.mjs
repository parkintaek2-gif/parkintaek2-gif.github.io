#!/usr/bin/env node
/**
 * make-video-kcw-lisaminnie.mjs — **K Culture Wire 쇼츠.** 19.5초 · 1080×1920 · 영어.
 *   「리사와 민니가 같은 날 EP — 태국어 위키백과에선 민니가 리사를 넘었다」
 *   (`/article/lisa-press-play-minnie-same-day-thai-wikipedia-minnie-outread-lisa`)
 *
 * ── 왜 (2026-10-25 · 1번) ─────────────────────────────────
 * 사장님 8/28 「달랑 카드, 그래픽 등 스틸이미지 사용하지마 · 캐릭터를」 — make-video-kcw-btsspanish.mjs 꼴 그대로,
 * 캐릭터가 나오고 태국어 두 막대가 평소 → 그날로 자라며 자리가 뒤집힌다. 영어 쌍이 뒤에 붙는다.
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────
 * ⛔ 수를 손으로 안 박는다 — src/data/kcw-lisaminnie.json (기사와 같은 수).
 * ⛔ 화면에 한국어를 안 쓴다. ⛔ 「인기」로 읽지 않는다 — 열람이지 스트리밍이 아니라고 화면·대사에 둘 다.
 * ⛔ 목소리는 Piper(en_US-hfc_male-medium, MIT, 로컬).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-lisaminnie.mjs --목소리
 *   node scripts/make-video-kcw-lisaminnie.mjs
 *   node scripts/make-video-kcw-lisaminnie.mjs --selftest
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
export const 총초 = 20.5;
export const 주소 = 'kculturewire.com';

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/kcw-lisaminnie.json'), 'utf8'));
const 수 = (n) => Number(n).toLocaleString('en-US');
export const 대사 = [
  `Lisa and Minnie, K-pop's two Thai stars, released EPs on ${d.날}.`,
  `On Thai Wikipedia, Lisa usually leads. That day, Minnie had ${d.태국어.민니.그날} reads. Lisa had ${d.태국어.리사.그날}.`,
  `In English, Lisa had ${수(d.영어.리사.그날)}. Those are reads, not streams.`,
];
export const 목소리방 = 'archive/video/voice/kcw-lisaminnie';
export const 목소리때들 = [0.6, 6.1, 13.6];

const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초, 말함) {
  const 머리 = 술술(사이(초, 0.0, 0.7));
  const 평소 = 술술(사이(초, 6.3, 7.7));
  const 그날 = 술술(사이(초, 9.4, 11.0));
  const 영어 = 술술(사이(초, 13.8, 15.2));
  const 끝 = 술술(사이(초, 19.4, 20.0));
  const 물러남 = 술술(사이(초, 1.2, 2.2));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);
  const 캐 = 캐릭터SVG(초, { 들어옴: 0.1, 그리는초: 1.0, 말함, 가리킴: [[6.1, 8.5]], 풀림: 19.4 });
  const 태최대 = Math.max(d.태국어.리사.평소, d.태국어.리사.그날, d.태국어.민니.평소, d.태국어.민니.그날);
  const 폭 = (v, 최대) => ㄴ((v / 최대) * 720);
  /* 평소 값에서 그날 값으로 자란다(줄어든다) */
  const 지금 = (x) => x.평소 + (x.그날 - x.평소) * 그날;
  const 리사 = 지금(d.태국어.리사);
  const 민니 = 지금(d.태국어.민니);
  const 영최대 = d.영어.리사.그날;
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1080px;height:1920px;background:#13111f;color:#ecebf3;overflow:hidden;font-family:Georgia,'Times New Roman',serif}
    .판{position:absolute;inset:0;padding:100px 84px}
    .누{position:absolute;left:${자리(232, 700)}px;top:${자리(430, 1370)}px;width:${자리(616, 290)}px;height:${자리(806, 380)}px;color:#b9a2ff}
    .누 svg{width:100%;height:100%}
    .띠{position:absolute;left:84px;top:56px;font:600 24px system-ui,sans-serif;letter-spacing:.2em;color:#b9a2ff;opacity:${ㄴ(머리)}}
    .머리{font-size:56px;line-height:1.18;opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font:400 26px system-ui,sans-serif;color:#9c99b0;opacity:${ㄴ(머리)}}
    .칸{margin-top:46px;font:400 28px system-ui,sans-serif}
    .줄{margin-top:16px}.줄 i{display:block;font-style:normal;color:#c9c6d8;margin-bottom:6px}
    .막{height:34px;border-radius:5px}
    .리{background:#f28fb8}.민{background:#f0b35a}
    .제목{font:600 24px system-ui,sans-serif;letter-spacing:.08em;color:#9c99b0}
    .가림{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#13111f;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:44px;line-height:1.25}
    .마무리 span{display:block;margin-top:14px;font:600 28px system-ui,sans-serif;color:#b9a2ff}
    .마무리 i{display:block;margin-top:8px;font:400 22px system-ui,sans-serif;font-style:normal;color:#8a879c}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE</div>
    <div class="머리">Lisa and Minnie,<br>same release day</div>
    <div class="곁">${d.날} 2026 · Wikipedia reads, user traffic</div>
    <div class="칸" style="opacity:${ㄴ(평소 * (1 - 끝))}">
      <div class="제목">THAI WIKIPEDIA · ${그날 < 0.5 ? 'A USUAL DAY' : d.날.toUpperCase()}</div>
      <div class="줄"><i>Lisa ${수(Math.round(리사))}</i><div class="막 리" style="width:${폭(리사, 태최대) * 평소}px"></div></div>
      <div class="줄"><i>Minnie ${수(Math.round(민니))}</i><div class="막 민" style="width:${폭(민니, 태최대) * 평소}px"></div></div>
    </div>
    <div class="칸" style="opacity:${ㄴ(영어 * (1 - 끝))}">
      <div class="제목">ENGLISH WIKIPEDIA · ${d.날.toUpperCase()}</div>
      <div class="줄"><i>Lisa ${수(d.영어.리사.그날)}</i><div class="막 리" style="width:${폭(d.영어.리사.그날, 영최대) * 영어}px"></div></div>
      <div class="줄"><i>Minnie ${수(d.영어.민니.그날)}</i><div class="막 민" style="width:${폭(d.영어.민니.그날, 영최대) * 영어}px"></div></div>
      <div class="줄"><i>Reads, not streams.</i></div>
    </div>
    <div class="가림"></div>
    <div class="마무리"><b>Counted, not judged.</b><span>${주소}</span><i>Wikimedia Pageviews · usual day = median of 1–18 Oct 2026</i></div>
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
  재본다('⛔ 슬라이드쇼가 아니다 — 열 시각이 다 다른 그림', (() => { const xs = [0.5, 1.5, 2.5, 4, 5.5, 7, 9, 11, 13, 15].map((t) => 칸HTML(t, 말함)); return new Set(xs).size === xs.length; })());
  재본다('⛔ 화면에 한국어가 없다', !/[가-힣]/.test(글자만(칸HTML(12, 말함))));
  재본다('⭐ 태국어 그날 수가 화면에 있다', 글자만(칸HTML(12, 말함)).includes('Minnie ' + 수(d.태국어.민니.그날)) && 글자만(칸HTML(12, 말함)).includes('Lisa ' + 수(d.태국어.리사.그날)));
  재본다('⭐ 대사 속 수가 자료와 같다', 대사[1].includes(String(d.태국어.민니.그날)) && 대사[1].includes(String(d.태국어.리사.그날)) && 대사[2].includes(수(d.영어.리사.그날)));
  재본다('⭐ 「열람이지 스트리밍이 아니다」를 화면·대사 둘 다에', 글자만(칸HTML(16, 말함)).includes('not streams') && 대사[2].includes('not streams'));
  재본다('⭐ 끝에 주소', 글자만(칸HTML(20.3, 말함)).includes(주소));
  재본다('⛔ 목소리가 화면 안에 끝난다', 말함.every(([, 끝]) => 끝 < 총초 - 0.8));
  재본다('⛔ 목소리 줄끼리 안 겹친다', 말함.every((w, i) => i === 0 || w[0] > 말함[i - 1][1]));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다) {
  const oi = process.argv.indexOf('--out');
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, 'public/wikitip/video/lisa-press-play-minnie-same-day-thai-wikipedia-minnie-outread-lisa-voiced.mp4');
  if (fs.existsSync(낼길)) { console.error(`⛔ 이미 있다 — 덮어쓰지 않는다: ${낼길}`); process.exit(1); }
  const 말함 = 말구간();
  const 임시 = path.join(여기, 'archive', '_칸kcwlisaminnie');
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
    if (!fs.existsSync(길)) { console.error(`⛔ 목소리가 없다 — --목소리 로 먼저 낸다`); process.exit(1); }
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
