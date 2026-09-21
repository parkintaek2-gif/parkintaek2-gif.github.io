#!/usr/bin/env node
/**
 * make-video-100y-usedcar-brand.mjs — 백년지도 쇼츠. 17초 · 1080×1920 · 한국어.
 *   「중고차 브랜드평판 1위, 업종 수명은 3.54년」(`/ranking-usedcar-brand`)
 *
 * 🔴 사장님(8/29) — 「무성 콘텐트 다신 만들지 말 것」. csat-applicant-mix 편 패턴을
 *   그대로 가져온다 — 캐릭터(kcw-character.mjs)+실제 내레이션(make-voice-100y.mjs,
 *   Windows SAPI Heami)+오디오 믹스(mix-voice-kcw.mjs).
 *
 * ⛔ 화면·대사에 없는 수를 말하지 않는다 — 전부 ranking-usedcar-brand-2026.json 등
 *   src/data/100yearmap/ranking-*-brand-2026.json 에서 온다.
 * ⛔ 판정하지 않는다 — 브랜드평판(화제성)과 업종 생존은 다른 자료라고만 말한다.
 *
 * 쓰는 법
 *   node scripts/make-voice-100y.mjs --out archive/video/voice/usedcar-brand \
 *     --줄 "..." --줄 "..." --줄 "..."   ← 이미 냄
 *   node scripts/make-video-100y-usedcar-brand.mjs --out public/100y/video/중고차브랜드평판.mp4
 *   node scripts/make-video-100y-usedcar-brand.mjs --selftest
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
export const 주소 = '100yearmap.com/ranking-usedcar-brand';

export const 목소리방 = 'archive/video/voice/usedcar-brand';
export const 목소리때들 = [0.6, 4.2, 9.0];

const 읽기 = (f) => JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap', f), 'utf8'));
const 중고차 = 읽기('ranking-usedcar-brand-2026.json');
const 화장품 = 읽기('ranking-cosmetics-brand-2026.json');
const 보험대리점 = 읽기('ranking-insurance-agency-brand-2026.json');

export const 일위 = 중고차.top5[0];
export const 실측 = 중고차.실측대조;

function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.0, 0.7));
  const 띠 = 술술(끼(초, 1.4, 1.9));
  const 큰수나옴 = 술술(끼(초, 1.6, 2.4));
  const 대조 = 술술(끼(초, 4.2, 4.9));
  const 지역줄 = 술술(끼(초, 9.0, 9.7));
  const 맺음 = 술술(끼(초, 13.0, 13.7));
  const 끝 = 술술(끼(초, 14.6, 15.2));

  const 물러남 = 술술(끼(초, 1.8, 2.8));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[0.6, 3.29], [4.2, 8.67], [9.0, 14.26]],
    가리킴: [[0.6, 3.29]],
    풀림: 14.6,
  });

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
    .머리{font-size:52px;font-weight:800;line-height:1.24;letter-spacing:-2px;
          opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font-size:26px;color:#9aa2b1;opacity:${ㄴ(머리)}}

    .큰수줄{margin-top:52px;opacity:${ㄴ(큰수나옴)}}
    .큰수{font-size:88px;font-weight:900;color:#e8b34f;letter-spacing:-2px}
    .큰수딸림{margin-top:6px;font-size:26px;color:#c3c8d4}

    .대조{margin-top:36px;padding:24px 28px;border-left:6px solid #e8b34f;
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
    .마무리 span{display:block;margin-top:14px;font-size:28px;font-weight:800;color:#e8b34f}
    .마무리 i{display:block;margin-top:8px;font-style:normal;font-size:22px;color:#8b93a3}
  </style>
  <div class="판">
    <div class="띠">100YEARMAP.COM</div>
    <div class="머리">중고차 브랜드평판 1위는<br>${일위.브랜드}입니다</div>
    <div class="곁">한국기업평판연구소 2026년 9월 · ${중고차.순위출처.분석기간}</div>

    <div class="큰수줄">
      <div class="큰수">${실측.수명중앙값_년}년</div>
      <div class="큰수딸림">중고 자동차 판매업 사업장 수명 중앙값 · 이것은 화제성과 다른 자료입니다</div>
    </div>

    <div class="대조">
      국민연금 가입 사업장 <b>${실측.닫은곳}곳</b> 기준입니다. <b>${실측.일년내_퍼센트}%</b>만 1년 안에,
      <b>${실측.삼년내_퍼센트}%</b>가 3년 안에 문을 닫았습니다.
    </div>

    <div class="지역줄">
      같은 시리즈에서 화장품전문점은 <b>${화장품.실측대조.수명중앙값_년}년</b>,
      독립보험대리점은 <b>${보험대리점.실측대조.수명중앙값_년}년</b>입니다.
      중고차 판매업은 그 사이입니다.
    </div>

    <div class="맺음">브랜드가 화제인 것과<br>업종이 오래 가는 것은 다릅니다.</div>

    <div class="막"></div>
    <div class="마무리">
      <b>이것은 통계이지<br>당신이 아닙니다.</b>
      <span>${주소}</span>
      <i>한국기업평판연구소 · 국민연금공단 · 2026년 9월</i>
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

  재본다(`⭐ 브랜드평판 1위 이름이 있다`, 글자만(칸HTML(1)), (s) => s.includes(일위.브랜드));
  재본다(`⭐ 수명 중앙값이 화면에 있다 — ${실측.수명중앙값_년}년`, 글자만(칸HTML(3)), (s) => s.includes(`${실측.수명중앙값_년}년`));
  재본다(`⭐ 1년내·3년내 폐업 비율이 있다`, 글자만(칸HTML(5)),
    (s) => s.includes(`${실측.일년내_퍼센트}%`) && s.includes(`${실측.삼년내_퍼센트}%`));
  재본다(`⭐ 닫은 사업장 수가 있다`, 글자만(칸HTML(5)), (s) => s.includes(`${실측.닫은곳}곳`));
  재본다(`⭐ 화장품·보험대리점 비교값이 있다`, 글자만(칸HTML(10)),
    (s) => s.includes(`${화장품.실측대조.수명중앙값_년}년`) && s.includes(`${보험대리점.실측대조.수명중앙값_년}년`));
  재본다('⭐ 맺음 문구가 있다', 글자만(칸HTML(13.5)), (s) => s.includes('업종이 오래 가는 것은 다릅니다'));
  재본다('⛔ 판정하는 말을 안 쓴다', [1, 4, 8, 11, 14].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/(해야 한다|늦었다|조심하십시오|주의하십시오|등수|순위|랭킹|몇 위|꼴찌|최악|낫습니다|불리하다|유리하다)/.test(s));
  재본다('⭐ 이것은 통계이지 당신이 아니다 — 끝에 있다', 글자만(칸HTML(16)), (s) => s.includes('통계이지') && s.includes('당신이 아닙니다'));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(16)), (s) => s.includes(주소));
  재본다('출처를 적는다', 글자만(칸HTML(16)), (s) => s.includes('한국기업평판연구소') && s.includes('국민연금공단'));

  재본다('⛔ 목소리때들이 셋(대본 세 줄)이다', 목소리때들.length, 3);
  재본다('⛔ 목소리때들이 시간순으로 늘어난다', 목소리때들.every((t, i) => i === 0 || t > 목소리때들[i - 1]), true);
  재본다('⛔ 입이 움직이는 시작이 목소리 시작과 같다', (() => {
    const m = 칸HTML.toString().match(/말함:\s*(\[\[[\s\S]*?\]\])/);
    const 말함 = JSON.parse(m[1]);
    return 말함.map((w) => w[0]).every((시작, i) => Math.abs(시작 - 목소리때들[i]) < 0.01);
  })(), true);

  const 댈수 = new Set([
    실측.수명중앙값_년, 실측.일년내_퍼센트, 실측.삼년내_퍼센트, 실측.닫은곳,
    화장품.실측대조.수명중앙값_년, 보험대리점.실측대조.수명중앙값_년,
    2026, 9, 1, 3, '08', '14', '09',
  ].filter((v) => v != null).map(String));
  const 온글 = [0, 1, 2.5, 3, 4, 5.5, 7, 9, 11, 13.5, 16].map(칸HTML).join(' ');
  const 수볼글 = 글자만(온글)
    .replace(new RegExp(주소.replace('.', '\\.'), 'g'), ' ')
    .replace(/100YEARMAP\.COM/g, ' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0])
    .filter((s) => !댈수.has(s) && !댈수.has(s.replace(/,/g, '')));
  재본다(`화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`, 못댄것.length, 0);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const oi = process.argv.indexOf('--out');
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, 'public/100y/video/중고차브랜드평판.mp4');
  const 임시 = path.join(path.dirname(낼길), '_칸100yusedcar');
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
