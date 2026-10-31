#!/usr/bin/env node
/**
 * make-video-kcw-t1threeone.mjs — **K Culture Wire 쇼츠.** 1080×1920 · 영어 · 목소리 있음.
 *   「T1 이 MKOI 를 2-0 으로 꺾고 3-1 로 8강 — 지난 두 해 3-1 로 간 여섯 팀 중 우승 하나」
 *   (`/article/t1-beat-movistar-koi-2-0-reach-worlds-2026-quarter-finals-at-3-1`)
 *
 * ── 왜 (2026-10-31 · 1번) ─────────────────────────────────
 * make-video-kcw-t1twoone.mjs 꼴 그대로 — 캐릭터가 나오고, 두 판 합계 킬·타워 막대가 자라고,
 * 2024·2025 에 8강에 간 16팀이 스위스 전적(3-0·3-1·3-2)별 줄로 하나씩 켜진다
 * (4강 이상 = 밝게, 8강에서 끝 = 어둡게). 슬라이드쇼가 아니다.
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────
 * ⛔ 수를 손으로 안 박는다 — src/data/kcw-t1threeone.json (기사와 같은 수).
 * ⛔ 화면에 한국어를 안 쓴다. ⛔ 예측으로 읽지 않는다 — 「not a forecast」를 화면·대사 둘 다에.
 * ⛔ 16팀은 작은 무리다 — 「too few」를 화면에 둔다(기사와 같게).
 * ⛔ 목소리는 Piper(en_US-hfc_male-medium, MIT, 로컬).
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-t1threeone.mjs --목소리
 *   node scripts/make-video-kcw-t1threeone.mjs --selftest
 *   node scripts/make-video-kcw-t1threeone.mjs
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
export const 총초 = 22.5;
export const 주소 = 'kculturewire.com';
export const 낼이름 = 't1-beat-movistar-koi-2-0-reach-worlds-2026-quarter-finals-at-3-1-voiced';

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/kcw-t1threeone.json'), 'utf8'));
const g = d.경기;
const 줄들 = d.끝자리;
const 셋하나 = 줄들.find((x) => x.전적 === '3-1').팀;
const 모두 = 줄들.flatMap((x) => x.팀);
const 우승수 = 셋하나.filter((t) => t.우승).length;
const 수말 = (n) => ({ 1: 'one', 5: 'five', 6: 'six', 16: 'sixteen', 19: 'nineteen', 42: 'forty-two' })[n] ?? String(n);
export const 대사 = [
  'T1 are into the Worlds twenty twenty-six quarter-finals at three and one, after sweeping Movistar KOI two games to nil.',
  `${수말(g.티원킬)[0].toUpperCase()}${수말(g.티원킬).slice(1)} kills to ${수말(g.상대킬)} over the two games, and ${수말(g.티원타워)} towers to ${수말(g.상대타워)}.`,
  `In the last two years, ${수말(셋하나.length)} teams qualified at three and one, and ${수말(우승수)} won the title. Teams at three and two went further. A count, not a forecast.`,
];
export const 목소리방 = 'archive/video/voice/kcw-t1threeone';
export const 목소리때들 = [0.5, 7.5, 12.2];

const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초, 말함) {
  const 머리 = 술술(사이(초, 0.0, 0.7));
  const 막칸 = 술술(사이(초, 7.4, 8.2));
  const 킬 = 술술(사이(초, 7.8, 9.2));
  const 탑 = 술술(사이(초, 9.6, 11.0));
  const 격자 = 술술(사이(초, 12.0, 13.0));
  const 켬 = (i) => 술술(사이(초, 13.2 + i * 0.45, 13.6 + i * 0.45));
  const 끝 = 술술(사이(초, 21.0, 21.6));
  const 물러남 = 술술(사이(초, 1.2, 2.2));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);
  const 캐 = 캐릭터SVG(초, { 들어옴: 0.1, 그리는초: 1.0, 말함, 가리킴: [[7.5, 10.0], [12.4, 18.4]], 풀림: 21.0 });
  const 최대 = Math.max(g.티원킬, g.상대킬);
  const 너비 = (v, m) => ㄴ((v / m) * 640);
  const 줄 = (이름, v, m, 자람, 색) => `<div class="줄"><i>${이름} ${Math.round(v * 자람)}</i><div class="막 ${색}" style="width:${너비(v, m) * 자람}px"></div></div>`;
  /* 16칸이 차례로 켜진다 — 4강 이상 = 밝게, 8강에서 끝 = 어둡게 */
  const 앞수 = (k) => 줄들.slice(0, k).reduce((a, x) => a + x.팀.length, 0);
  const 칸들 = (k) => 줄들[k].팀.map((t, i) => {
    const 불 = 켬((앞수(k) + i) * 0.6);
    const 색 = t.넷 ? `rgba(143,211,242,${ㄴ(불)})` : `rgba(107,104,128,${ㄴ(불 * 0.6)})`;
    const 말 = t.우승 ? 'won title' : t.넷 ? 'semis+' : 'QF out';
    /* 밝은 칸 위의 흰 글씨가 안 읽혔다(10/31 눈으로 봄) — 밝은 칸은 어두운 글씨 */
    return `<div class="칸칸" style="background:${색};color:${t.넷 && 불 > 0.5 ? '#13111f' : '#ecebf3'}">${t.팀}<b>${불 > 0.5 ? `${t.해} · ${말}` : `${t.해}`}</b></div>`;
  }).join('');
  const 셈 = (k) => 줄들[k].팀.filter((t, i) => t.넷 && 켬((앞수(k) + i) * 0.6) > 0.5).length;
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
    .티{background:#8fd3f2}.상{background:#6b6880}
    .제목{font:600 24px system-ui,sans-serif;letter-spacing:.08em;color:#9c99b0;margin-top:14px}
    .사{display:flex;gap:10px;margin-top:10px}
    .칸칸{width:140px;height:84px;border:2px solid #4a4660;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 26px system-ui,sans-serif;color:#ecebf3}
    .칸칸 b{font-size:15px;font-weight:500}
    .풀이{margin-top:10px;font:400 22px system-ui,sans-serif;color:#9c99b0}
    .가림{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#13111f;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:44px;line-height:1.25}
    .마무리 span{display:block;margin-top:14px;font:600 28px system-ui,sans-serif;color:#b9a2ff}
    .마무리 i{display:block;margin-top:8px;font:400 22px system-ui,sans-serif;font-style:normal;color:#8a879c}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE</div>
    <div class="머리">T1 reach the<br>Worlds 2026 quarter-finals</div>
    <div class="곁">3-1 · swept Movistar KOI 2-0 · 29 October 2026 KST · Riot official stats</div>
    <div class="칸" style="opacity:${ㄴ(막칸 * (1 - 격자) * (1 - 끝))}">
      <div class="제목">KILLS · TWO GAMES</div>
      ${줄('T1', g.티원킬, 최대, 킬, '티')}${줄('Movistar KOI', g.상대킬, 최대, 킬, '상')}
      <div class="제목">TOWERS · TWO GAMES</div>
      ${줄('T1', g.티원타워, 최대, 탑, '티')}${줄('Movistar KOI', g.상대타워, 최대, 탑, '상')}
    </div>
    <div class="칸 격" style="opacity:${ㄴ(격자 * (1 - 끝))}">
      ${줄들.map((x, k) => `<div class="제목">QUALIFIED AT ${x.전적} · 2024-25 · semis or further ${셈(k)}</div><div class="사">${칸들(k)}</div>`).join('')}
      <div class="풀이">Sixteen teams is too few for a pattern. A count, not a forecast.</div>
    </div>
    <div class="가림"></div>
    <div class="마무리"><b>${우승수} of ${셋하나.length} at 3-1 won the title. Counted, not predicted.</b><span>${주소}</span><i>Riot Games official schedule and live stats · 2024, 2025, 2026</i></div>
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
  재본다('⛔ 화면에 한국어가 없다', !/[가-힣]/.test(글자만(칸HTML(10, 말함))) && !/[가-힣]/.test(글자만(칸HTML(19, 말함))));
  재본다('⭐ 킬 수가 화면에 있다', 글자만(칸HTML(10.6, 말함)).includes(`T1 ${g.티원킬}`) && 글자만(칸HTML(10.6, 말함)).includes(`Movistar KOI ${g.상대킬}`));
  재본다('⭐ 대사 속 수가 자료와 같다', 대사[1].toLowerCase().startsWith(수말(g.티원킬)) && 대사[1].includes(수말(g.상대킬)) && 대사[2].includes(수말(셋하나.length)) && 대사[2].includes(수말(우승수)));
  재본다('⭐ 16팀 · 3-1 여섯 중 우승 하나 · 4강 이상 2·2·4 — 자료가 기사와 같다', 모두.length === 16 && 셋하나.length === 6 && 우승수 === 1 && 줄들.map((x) => x.팀.filter((t) => t.넷).length).join() === '2,2,4');
  재본다('⭐ 「예측이 아니다」·「너무 적다」를 화면에, 「예측이 아니다」를 대사에', 글자만(칸HTML(19, 말함)).includes('not a forecast') && 대사[2].includes('not a forecast') && 글자만(칸HTML(19, 말함)).includes('too few'));
  재본다('⭐ 다 켜지면 4강 이상 셈이 2·2·4', ['3-0 · 2024-25 · semis or further 2', '3-1 · 2024-25 · semis or further 2', '3-2 · 2024-25 · semis or further 4'].every((x) => 글자만(칸HTML(19, 말함)).includes(x)));
  재본다('⭐ 우승 칸', 글자만(칸HTML(19, 말함)).includes('won title'));
  재본다('⭐ 끝에 주소', 글자만(칸HTML(22.3, 말함)).includes(주소));
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
  const 임시 = path.join(여기, 'archive', '_칸kcwt1threeone');
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
