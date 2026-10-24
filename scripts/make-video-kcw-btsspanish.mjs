#!/usr/bin/env node
/**
 * make-video-kcw-btsspanish.mjs — **K Culture Wire 쇼츠.** 19.5초 · 1080×1920 · 영어.
 *   「BTS 남미 공연 — 스페인어 위키백과가 영어를 처음 넘었다」 (`/article/bts-latin-america-tour-spanish-wikipedia-overtakes-english`)
 *
 * ── 왜 이 편인가 (2026-10-24 · 1번) ─────────────────────────────────
 * 오늘 낸 KCW 기사의 수다. 오전에 카드 다섯 장을 이은 판을 구웠다가 사장님 8/28 지시
 * 「달랑 카드, 그래픽 등 스틸이미지 사용하지마 · 캐릭터를」에 어긋나 배포 전에 거뒀다.
 * 그래서 캐릭터(kcw-character.mjs)가 나오고 글·막대가 움직이는 판으로 새로 짓는다.
 *
 * ── ⛔ 이 편이 지키는 것 ─────────────────────────────────────────
 * ⛔ 수를 손으로 안 박는다 — src/data/kcw-btsspanish.json 에서 읽는다(기사와 같은 수).
 * ⛔ 화면에 한국어를 안 쓴다.
 * ⛔ 「인기」로 읽지 않는다 — 열람이지 표·관객이 아니라고 화면·대사에 둘 다 남긴다.
 * ⛔ 목소리는 Piper(en_US-hfc_male-medium, MIT, 로컬) — make-voice-kcw.mjs 가 정한 KCW 목소리.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-btsspanish.mjs --목소리   ← 먼저 목소리 세 줄을 낸다
 *   node scripts/make-video-kcw-btsspanish.mjs --out public/wikitip/video/bts-latin-america-tour-spanish-wikipedia-overtakes-english-voiced.mp4
 *   node scripts/make-video-kcw-btsspanish.mjs --selftest
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
export const 주소 = 'kculturewire.com';

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/kcw-btsspanish.json'), 'utf8'));
const 수 = (n) => Number(n).toLocaleString('en-US');
const 팔구비 = d.팔구월.영어 / d.팔구월.스페인어;
export const 대사 = [
  `In August and September, Spanish Wikipedia read BTS about once for every ${Math.round(팔구비)} reads in English.`,
  `Then the tour reached Latin America. On ${d.넘은날.length} days in October, Spanish read it more.`,
  `On 22 October, ${d.가장큰날.배} times as much. That is reading, not ticket sales.`,
];
export const 목소리방 = 'archive/video/voice/kcw-btsspanish';
export const 목소리때들 = [0.6, 7.1, 12.4];

const ㄴ = (v) => Math.round(v * 100) / 100;
const 큰날 = d.넘은날.find((x) => x.날 === d.가장큰날.날);

export function 칸HTML(초, 말함) {
  const 머리 = 술술(사이(초, 0.0, 0.7));
  const 막대1 = 술술(사이(초, 1.6, 2.8));
  const 넘음 = 술술(사이(초, 7.2, 8.0));
  const 막대2 = 술술(사이(초, 8.2, 9.6));
  const 큰수 = 술술(사이(초, 12.6, 13.3));
  const 끝 = 술술(사이(초, 18.4, 19.0));
  const 물러남 = 술술(사이(초, 1.2, 2.2));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);
  const 캐 = 캐릭터SVG(초, { 들어옴: 0.1, 그리는초: 1.0, 말함, 가리킴: [[0.6, 2.4]], 풀림: 18.4 });
  const 폭1 = (v, 최대) => ㄴ((v / 최대) * 760);
  const 최대1 = d.팔구월.영어;
  const 최대2 = Math.max(큰날.스페인어, 큰날.영어);
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#13111f;color:#ecebf3;overflow:hidden;font-family:Georgia,'Times New Roman',serif}
    .판{position:absolute;inset:0;padding:100px 84px}
    .누{position:absolute;left:${자리(232, 700)}px;top:${자리(430, 1370)}px;width:${자리(616, 290)}px;height:${자리(806, 380)}px;color:#b9a2ff}
    .누 svg{width:100%;height:100%}
    .띠{position:absolute;left:84px;top:56px;font:600 24px system-ui,sans-serif;letter-spacing:.2em;color:#b9a2ff;opacity:${ㄴ(머리)}}
    .머리{font-size:56px;line-height:1.18;opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font:400 26px system-ui,sans-serif;color:#9c99b0;opacity:${ㄴ(머리)}}
    .칸{margin-top:46px;font:400 28px system-ui,sans-serif}
    .줄{margin-top:16px}.줄 i{display:block;font-style:normal;color:#c9c6d8;margin-bottom:6px}
    .막{height:30px;border-radius:5px}
    .에{background:#7c6bd6}.스{background:#f0b35a}
    .제목{font:600 24px system-ui,sans-serif;letter-spacing:.08em;color:#9c99b0;margin-top:40px}
    .큰수{margin-top:40px;font-size:150px;color:#f0b35a;opacity:${ㄴ(큰수 * (1 - 끝))}}
    .큰딸{font:400 28px system-ui,sans-serif;color:#c9c6d8;opacity:${ㄴ(큰수 * (1 - 끝))}}
    .가림{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#13111f;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:44px;line-height:1.25}
    .마무리 span{display:block;margin-top:14px;font:600 28px system-ui,sans-serif;color:#b9a2ff}
    .마무리 i{display:block;margin-top:8px;font:400 22px system-ui,sans-serif;font-style:normal;color:#8a879c}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE</div>
    <div class="머리">BTS on Wikipedia:<br>Spanish vs English</div>
    <div class="곁">Reads of the BTS article, user traffic</div>
    <div class="칸" style="opacity:${ㄴ(막대1 * (1 - 끝))}">
      <div class="제목">AUGUST–SEPTEMBER</div>
      <div class="줄"><i>English ${수(d.팔구월.영어)}</i><div class="막 에" style="width:${폭1(d.팔구월.영어, 최대1) * 막대1}px"></div></div>
      <div class="줄"><i>Spanish ${수(d.팔구월.스페인어)}</i><div class="막 스" style="width:${폭1(d.팔구월.스페인어, 최대1) * 막대1}px"></div></div>
    </div>
    <div class="칸" style="opacity:${ㄴ(넘음 * (1 - 끝))}">
      <div class="제목">22 OCTOBER, AFTER THE FIRST BUENOS AIRES SHOW</div>
      <div class="줄"><i>Spanish ${수(큰날.스페인어)}</i><div class="막 스" style="width:${폭1(큰날.스페인어, 최대2) * 막대2}px"></div></div>
      <div class="줄"><i>English ${수(큰날.영어)}</i><div class="막 에" style="width:${폭1(큰날.영어, 최대2) * 막대2}px"></div></div>
    </div>
    <div class="큰수">${d.가장큰날.배}×</div>
    <div class="큰딸">Spanish over English · ${d.넘은날.length} days in October. Reading, not ticket sales.</div>
    <div class="가림"></div>
    <div class="마무리"><b>Counted, not judged.</b><span>${주소}</span><i>Wikimedia Pageviews · 1 Mar–22 Oct 2026</i></div>
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
  재본다('⭐ 배수가 화면에 있다', 글자만(칸HTML(13, 말함)).includes(`${d.가장큰날.배}×`));
  재본다('⭐ 대사 속 배수·날 수가 자료와 같다', 대사[2].includes(String(d.가장큰날.배)) && 대사[1].includes(String(d.넘은날.length)));
  재본다('⭐ 「열람이지 표가 아니다」를 화면·대사 둘 다에', 글자만(칸HTML(13, 말함)).includes('not ticket sales') && 대사[2].includes('not ticket sales'));
  재본다('⭐ 끝에 주소', 글자만(칸HTML(19.3, 말함)).includes(주소));
  재본다('⛔ 목소리가 화면 안에 끝난다', 말함.every(([, 끝]) => 끝 < 총초 - 0.8));
  재본다('⛔ 목소리 줄끼리 안 겹친다', 말함.every((w, i) => i === 0 || w[0] > 말함[i - 1][1]));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다) {
  const oi = process.argv.indexOf('--out');
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, 'public/wikitip/video/bts-latin-america-tour-spanish-wikipedia-overtakes-english-voiced.mp4');
  if (fs.existsSync(낼길)) { console.error(`⛔ 이미 있다 — 덮어쓰지 않는다: ${낼길}`); process.exit(1); }
  const 말함 = 말구간();
  const 임시 = path.join(여기, 'archive', '_칸kcwbtsspanish');
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
