#!/usr/bin/env node
/**
 * make-video-100y-csat-applicant-mix.mjs — 백년지도 쇼츠. 16초 · 1080×1920 · 한국어.
 *   「수능 N수생, 23년 만에 가장 많습니다」(`/csat-applicant-mix`)
 *
 * 🔴 사장님(8/29) — 「무성 콘텐트 다신 만들지 말 것」. university-founding-gap 편
 *   패턴을 그대로 가져온다 — 캐릭터(kcw-character.mjs)+실제 내레이션(make-voice-100y.mjs,
 *   Windows SAPI Heami)+오디오 믹스(mix-voice-kcw.mjs).
 *
 * ⛔ 화면·대사에 없는 수를 말하지 않는다 — 전부 csat-applicant-mix.json에서 온다.
 * ⛔ 판정하지 않는다.
 * ⛔ 「일곱 시도 전부」라고 말하지 않는다 — 재학생·졸업생 전년대비가 둘 다 있는 곳은
 *   다섯(경남·충북·대구·경북·전남광주)뿐이다(충남은 졸업생 전년대비 없음, 세종은 둘 다 없음).
 *   그래서 화면·대사 모두 「확인된 다섯 개 시도」라고만 말한다.
 *
 * 쓰는 법
 *   node scripts/make-voice-100y.mjs --out archive/video/voice/csat-applicant-mix \
 *     --줄 "..." --줄 "..." --줄 "..."   ← 이미 냄
 *   node scripts/make-video-100y-csat-applicant-mix.mjs --out public/100y/video/수능N수생.mp4
 *   node scripts/make-video-100y-csat-applicant-mix.mjs --selftest
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
export const 총초 = 16;
export const 주소 = '100yearmap.com/csat-applicant-mix';

export const 목소리방 = 'archive/video/voice/csat-applicant-mix';
export const 목소리때들 = [0.6, 4.2, 8.2];

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/csat-applicant-mix.json'), 'utf8'));
export const 전국26 = d.전국_2026학년도;
export const 전국27 = d.전국_2027학년도;
export const 확인된지역수 = 5;

function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.0, 0.7));
  const 띠 = 술술(끼(초, 1.4, 1.9));
  const 큰수나옴 = 술술(끼(초, 1.6, 2.4));
  const 대조 = 술술(끼(초, 4.2, 4.9));
  const 지역줄 = 술술(끼(초, 8.2, 8.9));
  const 맺음 = 술술(끼(초, 12.2, 12.9));
  const 끝 = 술술(끼(초, 13.6, 14.2));

  const 물러남 = 술술(끼(초, 1.8, 2.8));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[0.6, 3.94], [4.2, 7.9], [8.2, 12.02]],
    가리킴: [[0.6, 3.2]],
    풀림: 13.6,
  });

  const 재학생몫 = (v) => ㄴ(v);
  const 재비 = 전국27.재학생.비율;
  const 졸비 = 전국27.졸업생.비율;
  const 기비 = 전국27.기타.비율;

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
    .머리{font-size:54px;font-weight:800;line-height:1.24;letter-spacing:-2px;
          opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:14px;font-size:26px;color:#9aa2b1;opacity:${ㄴ(머리)}}

    .큰수줄{margin-top:52px;opacity:${ㄴ(큰수나옴)}}
    .큰수{font-size:96px;font-weight:900;color:#e8b34f;letter-spacing:-2px}
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
    <div class="머리">수능 N수생, 23년 만에<br>가장 많습니다</div>
    <div class="곁">2027학년도(2026년 11월 시행) · 한국교육과정평가원</div>

    <div class="큰수줄">
      <div class="큰수">${전국27.N수생합계.인원.toLocaleString()}명</div>
      <div class="큰수딸림">N수생(졸업생+검정고시 등) · 2004학년도(198,025명) 이후 최대</div>
    </div>

    <div class="대조">
      전국 재학생 <b>${재비}%</b> · 졸업생(N수생) <b>${졸비}%</b> · 기타 ${기비}%입니다.
      2026학년도엔 재학생 <b>${전국26.재학생.비율}%</b> · 졸업생 <b>${전국26.졸업생.비율}%</b>였습니다.
    </div>

    <div class="지역줄">
      확인된 <b>${확인된지역수}개 시도</b>(경남·충북·대구·경북·전남광주)에서
      모두 <b>재학생은 줄고 졸업생은 늘었습니다.</b> 충남·세종은 자격별 전년대비를
      교육청이 안 밝혀 못 쟀습니다.
    </div>

    <div class="맺음">지역마다 정도는 다르지만<br>방향은 같습니다.</div>

    <div class="막"></div>
    <div class="마무리">
      <b>이것은 통계이지<br>당신이 아닙니다.</b>
      <span>${주소}</span>
      <i>한국교육과정평가원·각 시도교육청 보도자료 · 2027학년도</i>
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

  재본다(`⭐ N수생 큰 수가 화면에 있다 — ${전국27.N수생합계.인원.toLocaleString()}`, 글자만(칸HTML(3)),
    (s) => s.includes(`${전국27.N수생합계.인원.toLocaleString()}명`));
  재본다('⭐ 「23년 만에」 문구가 있다', 글자만(칸HTML(3)), (s) => s.includes('23년') || s.includes('2004학년도'));
  재본다(`⭐ 전국 재학생·졸업생 비율이 화면에 있다`, 글자만(칸HTML(5)),
    (s) => s.includes(`${전국27.재학생.비율}%`) && s.includes(`${전국27.졸업생.비율}%`));
  재본다(`⭐ 2026학년도 비교값도 있다`, 글자만(칸HTML(5)),
    (s) => s.includes(`${전국26.재학생.비율}%`) && s.includes(`${전국26.졸업생.비율}%`));
  재본다(`⭐ 확인된 지역 수(${확인된지역수})가 화면에 있다`, 글자만(칸HTML(9)), (s) => s.includes(`${확인된지역수}개 시도`));
  재본다('⛔ 「일곱 시도 전부」라고 과장하지 않는다', [3, 5, 9, 12].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/일곱\s*(개)?\s*시도\s*(전부|모두)/.test(s));
  재본다('⭐ 못 쟀다(충남·세종) 캐비앗이 있다', 글자만(칸HTML(9)), (s) => s.includes('충남') && s.includes('세종') && s.includes('못 쟀'));
  재본다('⭐ 맺음 문구가 있다', 글자만(칸HTML(12.5)), (s) => s.includes('방향은 같습니다'));
  재본다('⛔ 판정하는 말을 안 쓴다', [1, 4, 8, 11, 14].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/(해야 한다|늦었다|조심하십시오|주의하십시오|예방하십시오|등수|순위|랭킹|몇 위|꼴찌|최악)/.test(s));
  재본다('⭐ 이것은 통계이지 당신이 아니다 — 끝에 있다', 글자만(칸HTML(15.5)), (s) => s.includes('통계이지') && s.includes('당신이 아닙니다'));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(15.5)), (s) => s.includes(주소));
  재본다('출처를 적는다', 글자만(칸HTML(15.5)), (s) => s.includes('한국교육과정평가원'));

  재본다('⛔ 목소리때들이 셋(대본 세 줄)이다', 목소리때들.length, 3);
  재본다('⛔ 목소리때들이 시간순으로 늘어난다', 목소리때들.every((t, i) => i === 0 || t > 목소리때들[i - 1]), true);
  재본다('⛔ 입이 움직이는 시작이 목소리 시작과 같다', (() => {
    const m = 칸HTML.toString().match(/말함:\s*(\[\[[\s\S]*?\]\])/);
    const 말함 = JSON.parse(m[1]);
    return 말함.map((w) => w[0]).every((시작, i) => Math.abs(시작 - 목소리때들[i]) < 0.01);
  })(), true);

  const 댈수 = new Set([
    전국27.N수생합계.인원.toLocaleString(), '198,025',
    전국27.재학생.비율, 전국27.졸업생.비율, 전국27.기타.비율,
    전국26.재학생.비율, 전국26.졸업생.비율,
    확인된지역수, '2004', '2026', '2027', '23', '11',
  ].filter((v) => v != null).map(String));
  const 온글 = [0, 1, 2.5, 3, 4, 5.5, 7, 9, 11, 13.5, 15.5].map(칸HTML).join(' ');
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
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, 'public/100y/video/수능N수생.mp4');
  const 임시 = path.join(path.dirname(낼길), '_칸100ycsat');
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
