#!/usr/bin/env node
/**
 * make-video-100y-university-founding-gap.mjs — 백년지도 쇼츠. 15초 · 1080×1920 · 한국어.
 *   「국공립대와 사립대, 정원 채우기는 다를까요」(`/university-founding-gap`)
 *
 * 🔴 사장님(8/29) — 「무성 콘텐트 다신 만들지 말 것」. business-age 편
 *   (make-video-100y-business-age.mjs) 패턴을 그대로 가져온다 — 캐릭터(kcw-character.mjs)
 *   +실제 내레이션(make-voice-100y.mjs, Windows SAPI Heami)+오디오 믹스(mix-voice-kcw.mjs).
 *
 * ⛔ 화면·대사에 없는 수를 말하지 않는다 — 전부 university-founding-gap.json에서 온다.
 * ⛔ 판정하지 않는다 — 「정원미달이 나쁘다」라고 말하지 않는다.
 * ⛔ 이것은 정책 시행 «전» 기준선이다 — caveat을 화면에 남긴다.
 *
 * 쓰는 법
 *   node scripts/make-voice-100y.mjs --out archive/video/voice/university-founding-gap \
 *     --줄 "..." --줄 "..." --줄 "..."   ← 이미 냄
 *   node scripts/make-video-100y-university-founding-gap.mjs --out public/100y/video/정원채우기격차.mp4
 *   node scripts/make-video-100y-university-founding-gap.mjs --selftest
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
export const 총초 = 15;
export const 주소 = '100yearmap.com/university-founding-gap';

export const 목소리방 = 'archive/video/voice/university-founding-gap';
export const 목소리때들 = [0.6, 4.0, 10.9];

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/university-founding-gap.json'), 'utf8'));
export const 국공립 = d.국공립;
export const 사립 = d.사립;

function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
const 자리비율 = (몫) => (몫 / Math.max(국공립.정원미달.몫, 사립.정원미달.몫)) * 58;

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.0, 0.7));
  const 띠 = 술술(끼(초, 1.4, 1.9));
  const 표나옴 = 술술(끼(초, 1.6, 2.2));
  const 대조 = 술술(끼(초, 4.0, 4.7));
  const 맺음 = 술술(끼(초, 10.9, 11.6));
  const 끝 = 술술(끼(초, 13.6, 14.2));

  const 물러남 = 술술(끼(초, 1.8, 2.8));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[0.6, 3.91], [4.0, 10.65], [10.9, 14.0]],
    가리킴: [[0.6, 3.2]],
    풀림: 13.6,
  });

  const 자람 = 술술(끼(초, 2.2, 3.2));
  const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);

  const 줄 = (이름, 항목, 켬) => `<div class="줄${켬ㅋ(초) ? ' 켬' : ''}">
      <span class="이름">${이름}</span>
      <span class="한칸"><span class="막대" style="width:${ㄴ(자리비율(항목.정원미달.몫) * 자람)}%"></span>
        <span class="값" style="opacity:${보임}">${항목.정원미달.몫}%</span></span>
      <span class="딸림" style="opacity:${보임}">${항목.정원미달.곳수}곳 / ${항목.정원미달.전체}곳</span>
    </div>`;
  const 켬ㅋ = (t) => t > 3.9;

  const 표줄들 = 줄('국공립대', 국공립, true) + 줄('사립대', 사립, true);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;overflow:hidden;
         font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0;padding:100px 84px}

    .누{position:absolute;left:${자리(232, 690)}px;top:${자리(430, 1360)}px;
        width:${자리(616, 300)}px;height:${자리(806, 392)}px;color:#e8b34f}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:56px;font-size:26px;font-weight:800;letter-spacing:.08em;
        color:#9b7f3a;opacity:${ㄴ(띠)}}
    .머리{font-size:56px;font-weight:800;line-height:1.24;letter-spacing:-2px;
          opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font-size:28px;color:#9aa2b1;opacity:${ㄴ(머리)}}

    .소제{margin-top:44px;font-size:26px;font-weight:800;color:#8b93a3;opacity:${ㄴ(표나옴)}}
    .표{margin-top:18px;opacity:${ㄴ(표나옴)}}
    .줄{margin-bottom:36px}
    .이름{display:block;font-size:30px;font-weight:800;color:#c3c8d4;margin-bottom:10px}
    .한칸{position:relative;height:44px;display:flex;align-items:center}
    .막대{position:absolute;left:0;height:44px;border-radius:10px;background:#4a5468}
    .줄.켬 .막대{background:#e8b34f}
    .값{position:relative;margin-left:14px;font-size:32px;font-weight:800}
    .딸림{display:block;margin-top:8px;font-size:22px;color:#8b93a3}

    .대조{margin-top:20px;padding:24px 28px;border-left:6px solid #e8b34f;
          background:#1b1f29;border-radius:10px;font-size:26px;line-height:1.5;
          color:#c3c8d4;opacity:${ㄴ(대조 * (1 - 끝))}}
    .대조 b{color:#e9e9ee}

    .맺음{margin-top:26px;font-size:32px;font-weight:800;line-height:1.4;
          opacity:${ㄴ(맺음 * (1 - 끝))}}

    .막{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#12151c;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:38px;font-weight:900;color:#e9e9ee;line-height:1.3}
    .마무리 span{display:block;margin-top:14px;font-size:28px;font-weight:800;color:#e8b34f}
    .마무리 i{display:block;margin-top:8px;font-style:normal;font-size:22px;color:#8b93a3}
  </style>
  <div class="판">
    <div class="띠">100YEARMAP.COM</div>
    <div class="머리">국공립대와 사립대<br>정원 채우기는 다를까요</div>
    <div class="곁">${d.공시연도}년 공시 · 대학알리미 재학생충원율</div>
    <div class="소제">정원보다 재학생이 적은 곳(정원미달) 몫</div>
    <div class="표">${표줄들}</div>
    <div class="대조">
      국공립대 <b>${국공립.정원미달.몫}%</b>(${국공립.정원미달.곳수}/${국공립.정원미달.전체}곳) ·
      사립대 <b>${사립.정원미달.몫}%</b>(${사립.정원미달.곳수}/${사립.정원미달.전체}곳)입니다
    </div>
    <div class="맺음">이것은 정책 시행 전<br>${d.공시연도}년 한 시점의 기준선입니다.</div>

    <div class="막"></div>
    <div class="마무리">
      <b>이것은 통계이지<br>당신이 아닙니다.</b>
      <span>${주소}</span>
      <i>한국대학교육협의회 대학정보공시(대학알리미) · ${d.공시연도}년</i>
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
    const xs = [0.5, 1.5, 2.5, 4, 5.5, 7, 9, 11, 13].map(칸HTML);
    return new Set(xs).size === xs.length;
  })(), true);

  재본다(`⭐ 국공립 정원미달 몫이 화면에 있다 — ${국공립.정원미달.몫}%`, 글자만(칸HTML(3)), (s) => s.includes(`${국공립.정원미달.몫}%`));
  재본다(`⭐ 사립 정원미달 몫이 화면에 있다 — ${사립.정원미달.몫}%`, 글자만(칸HTML(3)), (s) => s.includes(`${사립.정원미달.몫}%`));
  재본다(`⭐ 국공립 곳수 분수가 있다 — ${국공립.정원미달.곳수}/${국공립.정원미달.전체}`, 글자만(칸HTML(3)),
    (s) => s.includes(`${국공립.정원미달.곳수}곳`) && s.includes(`${국공립.정원미달.전체}곳`));
  재본다('⭐ 맺음 문구가 있다', 글자만(칸HTML(11)), (s) => s.includes('기준선입니다'));
  재본다('⛔ 판정하는 말을 안 쓴다', [1, 4, 8, 11, 14].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/(해야 한다|늦었다|조심하십시오|주의하십시오|예방하십시오|등수|순위|랭킹|몇 위|꼴찌|최악)/.test(s));
  재본다('⭐ 이것은 통계이지 당신이 아니다 — 끝에 있다', 글자만(칸HTML(14.5)), (s) => s.includes('통계이지') && s.includes('당신이 아닙니다'));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(14.5)), (s) => s.includes(주소));
  재본다('출처·공시연도를 적는다', 글자만(칸HTML(14.5)), (s) => s.includes('대학알리미') && s.includes(String(d.공시연도)));

  재본다('⛔ 목소리때들이 셋(대본 세 줄)이다', 목소리때들.length, 3);
  재본다('⛔ 목소리때들이 시간순으로 늘어난다', 목소리때들.every((t, i) => i === 0 || t > 목소리때들[i - 1]), true);
  재본다('⛔ 입이 움직이는 시작이 목소리 시작과 같다', (() => {
    const m = 칸HTML.toString().match(/말함:\s*(\[\[[\s\S]*?\]\])/);
    const 말함 = JSON.parse(m[1]);
    return 말함.map((w) => w[0]).every((시작, i) => Math.abs(시작 - 목소리때들[i]) < 0.01);
  })(), true);

  const 댈수 = new Set([
    국공립.정원미달.몫, 국공립.정원미달.곳수, 국공립.정원미달.전체,
    사립.정원미달.몫, 사립.정원미달.곳수, 사립.정원미달.전체,
    d.공시연도,
  ].filter((v) => v != null).map(String));
  const 온글 = [0, 1, 2.5, 3, 4, 5.5, 7, 9, 11, 13.5].map(칸HTML).join(' ');
  const 수볼글 = 글자만(온글)
    .replace(new RegExp(주소.replace('.', '\\.'), 'g'), ' ')
    .replace(/100YEARMAP\.COM/g, ' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s));
  재본다(`화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`, 못댄것.length, 0);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const oi = process.argv.indexOf('--out');
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, 'public/100y/video/정원채우기격차.mp4');
  const 임시 = path.join(path.dirname(낼길), '_칸100yfoundgap');
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
