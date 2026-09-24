#!/usr/bin/env node
/**
 * make-video-100y-social-trust.mjs — 백년지도 쇼츠. 17초 · 1080×1920 · 한국어.
 *   「우리 사회를 얼마나 믿나」(`/social-trust-by-age`) — 30대만 불신이 신뢰를 앞선다
 *
 * 🔴 사장님(8/29) — 「무성 콘텐트 다신 만들지 말 것」. usedcar-brand 편 패턴을
 *   그대로 가져온다 — 캐릭터(kcw-character.mjs)+실제 내레이션(make-voice-100y.mjs,
 *   Windows SAPI Heami)+오디오 믹스(mix-voice-kcw.mjs).
 *
 * ⛔ 화면·대사에 없는 수를 말하지 않는다 — 전부 social-trust-by-age.json 에서 온다.
 * ⛔ 「믿어야 한다」로 재촉하지 않는다. 등수·순위 말을 쓰지 않는다.
 *
 * 쓰는 법
 *   node scripts/make-voice-100y.mjs --out archive/video/voice/social-trust \
 *     --줄 "..." --줄 "..." --줄 "..."   ← 먼저 낸다
 *   node scripts/make-video-100y-social-trust.mjs --out public/100y/video/사회신뢰도.mp4
 *   node scripts/make-video-100y-social-trust.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { 캐릭터SVG, 사이, 술술 } from './kcw-character.mjs';
import { 섞기필터, 넘치나 } from './mix-voice-kcw.mjs';
import { 초읽기 } from './make-voice-100y.mjs';

const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
const 여기 = fileURLToPath(new URL('..', import.meta.url));

export const 초당 = 30;
export const 폭 = 1080;
export const 높 = 1920;
export const 총초 = 17;
export const 주소 = '100yearmap.com/social-trust-by-age';

export const 목소리방 = 'archive/video/voice/social-trust';
export const 목소리때들 = [0.6, 4.4, 9.6];

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap', f), 'utf8'));
const 자료 = 읽기('social-trust-by-age.json');

const 신뢰 = (r) => Math.round((r.매우 + r.약간) * 10) / 10;
const 불신 = (r) => Math.round((r.별로 + r.전혀) * 10) / 10;

export const 나이별 = 자료.나이띠별.map((r) => ({ 띠: r.띠, 신뢰: 신뢰(r), 불신: 불신(r) }));
export const 가장불신 = 나이별.reduce((a, b) => (b.불신 > a.불신 ? b : a));
export const 가장신뢰 = 나이별.reduce((a, b) => (b.신뢰 > a.신뢰 ? b : a));
export const 전국신뢰 = 신뢰(자료.전체);

function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.0, 0.7));
  const 띠 = 술술(끼(초, 0.9, 1.4));
  const 큰수나옴 = 술술(끼(초, 4.6, 5.3));
  const 대조 = 술술(끼(초, 5.3, 6.0));
  const 지역줄 = 술술(끼(초, 9.8, 10.5));
  const 맺음 = 술술(끼(초, 13.0, 13.7));
  const 끝 = 술술(끼(초, 14.6, 15.2));

  const 물러남 = 술술(끼(초, 1.8, 2.8));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[0.6, 4.13], [4.4, 9.41], [9.6, 14.69]],
    가리킴: [[0.6, 4.13]],
    풀림: 14.6,
  });

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;overflow:hidden;
         font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0;padding:100px 84px}

    .누{position:absolute;left:${자리(232, 690)}px;top:${자리(430, 1360)}px;
        width:${자리(616, 300)}px;height:${자리(806, 392)}px;color:#5f9ee8}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:56px;font-size:26px;font-weight:800;letter-spacing:.08em;
        color:#3a6a9b;opacity:${ㄴ(띠)}}
    .머리{font-size:52px;font-weight:800;line-height:1.24;letter-spacing:-2px;
          opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font-size:26px;color:#9aa2b1;opacity:${ㄴ(머리)}}

    .큰수줄{margin-top:52px;opacity:${ㄴ(큰수나옴)}}
    .큰수{font-size:88px;font-weight:900;color:#5f9ee8;letter-spacing:-2px}
    .큰수딸림{margin-top:6px;font-size:26px;color:#c3c8d4}

    .대조{margin-top:36px;padding:24px 28px;border-left:6px solid #5f9ee8;
          background:#1b1f29;border-radius:10px;font-size:26px;line-height:1.55;
          color:#c3c8d4;opacity:${ㄴ(대조 * (1 - 끝))}}
    .대조 b{color:#e9e9ee}

    .지역줄{margin-top:26px;padding:22px 26px;border-radius:10px;background:#1b1f29;
            font-size:25px;line-height:1.5;color:#c3c8d4;opacity:${ㄴ(지역줄 * (1 - 끝))}}
    .지역줄 b{color:#e9e9ee}

    .맺음{margin-top:26px;font-size:30px;font-weight:800;line-height:1.4;
          opacity:${ㄴ(맺음 * (1 - 끝))}}

    .막{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#12151c;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:38px;font-weight:900;color:#e9e9ee;line-height:1.3}
    .마무리 span{display:block;margin-top:14px;font-size:28px;font-weight:800;color:#5f9ee8}
    .마무리 i{display:block;margin-top:8px;font-style:normal;font-size:22px;color:#8b93a3}
  </style>
  <div class="판">
    <div class="띠">100YEARMAP.COM</div>
    <div class="머리">우리 사회를 믿을 수 있다는<br>응답은 ${전국신뢰}%입니다</div>
    <div class="곁">국가데이터처 KOSIS 사회조사 · 2025년, 나이띠별</div>

    <div class="큰수줄">
      <div class="큰수">${가장불신.불신}%</div>
      <div class="큰수딸림">${가장불신.띠}의 「믿을 수 없다」 응답 · 신뢰(${가장불신.신뢰}%)보다 큽니다</div>
    </div>

    <div class="대조">
      전체 나이띠 가운데 <b>${가장불신.띠}만</b> 「믿을 수 없다」가 「믿을 수 있다」보다 큽니다.
      다른 나이띠는 전부 신뢰가 불신보다 큽니다.
    </div>

    <div class="지역줄">
      가장 신뢰가 높은 나이띠는 <b>${가장신뢰.띠}</b>로 <b>${가장신뢰.신뢰}%</b>입니다.
      나이가 많다고 더 안 믿는 것은 아닙니다.
    </div>

    <div class="맺음">「우리 사회」 한 단어에 대한<br>2025년 한 해의 자기응답입니다.</div>

    <div class="막"></div>
    <div class="마무리">
      <b>이것은 통계이지<br>당신이 아닙니다.</b>
      <span>${주소}</span>
      <i>국가데이터처 KOSIS · 사회조사 DT_1SSSP040R · 2025년</i>
    </div>

    <div class="누">${캐}</div>
  </div>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (이름, 값, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(값) : JSON.stringify(값) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.log(`  ⛔ ${이름}  ->  ${JSON.stringify(값)}`); }
  };

  재본다('⭐ 캐릭터가 첫 1초에 이미 그려지고 있다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 물러나 작아진다', (() => {
    const 크기 = (t) => Number(칸HTML(t).match(/\.누\{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
    return 크기(3.5) < 크기(0.8) * 0.6;
  })(), true);
  재본다('⛔ 슬라이드쇼가 아니다', (() => {
    const xs = [0.5, 1.5, 2.5, 4, 5.5, 7, 9, 11, 13, 15].map(칸HTML);
    return new Set(xs).size === xs.length;
  })(), true);

  재본다('⭐ 전국 신뢰율이 화면에 있다', 글자만(칸HTML(1)), (s) => s.includes(`${전국신뢰}%`));
  재본다(`⭐ 가장 불신하는 나이띠의 불신율이 있다 — ${가장불신.불신}%`, 글자만(칸HTML(5.5)), (s) => s.includes(`${가장불신.불신}%`));
  재본다(`⭐ 그 나이띠 이름이 있다`, 글자만(칸HTML(6)), (s) => s.includes(가장불신.띠));
  재본다(`⭐ 가장 신뢰하는 나이띠와 값이 있다`, 글자만(칸HTML(10.2)),
    (s) => s.includes(가장신뢰.띠) && s.includes(`${가장신뢰.신뢰}%`));
  재본다('⭐ 맺음 문구가 있다', 글자만(칸HTML(13.3)), (s) => s.includes('2025년 한 해의 자기응답입니다'));
  재본다('⛔ 판정하는 말을 안 쓴다', [1, 4, 8, 11, 14].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/(해야 한다|늦었다|조심하십시오|주의하십시오|등수|순위|랭킹|몇 위|꼴찌|최악|낫습니다|불리하다|유리하다|믿어야|믿으세요)/.test(s));
  재본다('⭐ 이것은 통계이지 당신이 아니다 — 끝에 있다', 글자만(칸HTML(16)), (s) => s.includes('통계이지') && s.includes('당신이 아닙니다'));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(16)), (s) => s.includes(주소));
  재본다('출처를 적는다', 글자만(칸HTML(16)), (s) => s.includes('DT_1SSSP040R'));

  재본다('⛔ 목소리때들이 셋(대본 세 줄)이다', 목소리때들.length, 3);
  재본다('⛔ 목소리때들이 시간순으로 늘어난다', 목소리때들.every((t, i) => i === 0 || t > 목소리때들[i - 1]), true);
  재본다('⛔ 입이 움직이는 시작이 목소리 시작과 같다', (() => {
    const m = 칸HTML.toString().match(/말함:\s*(\[\[[\s\S]*?\]\])/);
    const 말함 = JSON.parse(m[1]);
    return 말함.map((w) => w[0]).every((시작, i) => Math.abs(시작 - 목소리때들[i]) < 0.01);
  })(), true);

  const 댈수 = new Set([
    전국신뢰, 가장불신.불신, 가장불신.신뢰, 가장신뢰.신뢰,
    2025, 2026,
    ...가장불신.띠.match(/\d+/g) || [], ...가장신뢰.띠.match(/\d+/g) || [],
  ].filter((v) => v != null).map(String));
  const 온글 = [0, 1, 2.5, 3, 5.5, 6, 8, 10.2, 13, 13.3, 16].map(칸HTML).join(' ');
  const 수볼글 = 글자만(온글)
    .replace(new RegExp(주소.replace('.', '\\.'), 'g'), ' ')
    .replace(/100YEARMAP\.COM/g, ' ')
    .replace(/DT_1SSSP040R/g, ' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0])
    .filter((s) => !댈수.has(s) && !댈수.has(s.replace(/,/g, '')));
  재본다(`화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`, 못댄것.length, 0);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const oi = process.argv.indexOf('--out');
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, 'public/100y/video/사회신뢰도.mp4');
  const 임시 = path.join(path.dirname(낼길), '_칸100ysocialtrust');
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.mkdirSync(임시, { recursive: true });

  const { default: puppeteer } = await import(
    'file:///C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
  );
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });

  const 칸수 = Math.round(총초 * 초당);
  for (let n = 0; n < 칸수; n += 1) {
    await p.setContent(칸HTML(n / 초당), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(임시, `${String(n).padStart(4, '0')}.png`) });
    if (n % 90 === 0) console.log(`  ${n}/${칸수}`);
  }
  await b.close();

  const 줄들 = 목소리때들.map((때, i) => {
    const 길 = path.join(여기, 목소리방, `${String(i).padStart(2, '0')}.wav`);
    if (!fs.existsSync(길)) { console.error(`⛔ 목소리가 없다 — ${길} (make-voice-100y.mjs로 먼저 낸다)`); process.exit(1); }
    return { 길, 때, 초: 초읽기(길) };
  });
  const 넘은것 = 넘치나(줄들, 총초);
  if (넘은것.length) {
    console.error('⛔ 목소리가 영상보다 길다 — 얹으면 잘린다:');
    for (const t of 넘은것) console.error(`   · ${t}`);
    process.exit(1);
  }

  const ff = require('ffmpeg-static');
  const 인자 = ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png')];
  for (const 줄 of 줄들) 인자.push('-i', 줄.길);
  인자.push(
    '-filter_complex', 섞기필터(줄들, 총초),
    '-map', '0:v', '-map', '[말끝]',
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-shortest',
    '-movflags', '+faststart', 낼길,
  );
  execFileSync(ff, 인자, { stdio: 'ignore' });

  console.log(`✅ ${낼길}`);
  fs.rmSync(임시, { recursive: true, force: true });
}
