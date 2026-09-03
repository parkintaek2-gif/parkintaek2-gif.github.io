#!/usr/bin/env node
/**
 * make-video-100y-cardiac-arrest.mjs — 백년지도 쇼츠. 16초 · 1080×1920 · 한국어.
 *   「급성심장정지는 몇 살부터 늘어날까요」(`/cardiac-arrest`)
 *
 * 🔴 사장님(8/29) — 「무성 콘텐트 다신 만들지 말 것」. wealthgap 편(make-video-100y-wealthgap.mjs)
 *   패턴을 그대로 가져온다 — 캐릭터(kcw-character.mjs)+실제 내레이션(make-voice-100y.mjs,
 *   Windows SAPI Heami)+오디오 믹스(mix-voice-kcw.mjs). 새로 만들지 않는다.
 *
 * ⛔⛔ 「분율」과 「발생률」을 한 화면에서 섞지 않는다 — 대사도 마찬가지다. 30대 분율(3.5%)과
 *   발생률(20대보다 높다)을 같은 문장 안에서 다른 근거로 말한다.
 * ⛔ 화면·대사에 없는 수를 말하지 않는다 — 전부 cardiac-arrest.json에서 온다.
 * ⛔ 판정하지 않는다.
 * ⛔ 목소리 세 줄 합이 14초를 넘어(≈14.3초 최소) 16초로 늘렸다 — 억지로 욱여넣지 않는다.
 *
 * 쓰는 법
 *   node scripts/make-voice-100y.mjs --out archive/video/voice/cardiac-arrest \
 *     --줄 "..." --줄 "..." --줄 "..."   ← 먼저 목소리부터 낸다(이미 냄, 재사용)
 *   node scripts/make-video-100y-cardiac-arrest.mjs --out public/100y/video/급성심장정지나이대.mp4
 *   node scripts/make-video-100y-cardiac-arrest.mjs --selftest
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
export const 주소 = '100yearmap.com/cardiac-arrest';

/** 🔴 사장님(8/29) — 「무성 콘텐트 다신 만들지 말 것」. 세 줄 실제 길이(5.31·5.05·3.91초)에
 *  맞춰 시작 시각을 잡았다 — 14초로는 세 줄이 안 들어가 16초로 늘렸다. */
export const 목소리방 = 'archive/video/voice/cardiac-arrest';
export const 목소리때들 = [0.6, 6.06, 11.26];

const d = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/cardiac-arrest.json'), 'utf8'));
export const 나이칸들 = d.연령별;
export const 삼십대 = 나이칸들.find((r) => r.칸 === '30-39세');
export const 이십대 = 나이칸들.find((r) => r.칸 === '20-29세');
export const 사십대 = 나이칸들.find((r) => r.칸 === '40-49세');
export const 팔십대이상 = 나이칸들.find((r) => r.칸 === '80세 이상');
export const 삼사십대분율합 = Math.round((삼십대.분율 + 사십대.분율) * 10) / 10;

function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;
/** 막대 길이 — 맨 큰 칸(80세 이상)을 화면 폭 절반쯤으로 잡는다 */
const 자리비율 = (분율) => (분율 / 팔십대이상.분율) * 58;

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.0, 0.7));
  const 띠 = 술술(끼(초, 1.4, 1.9));
  const 표나옴 = 술술(끼(초, 1.5, 2.0));
  const 대조 = 술술(끼(초, 6.06, 6.8));
  const 맺음 = 술술(끼(초, 11.26, 12.0));
  const 끝 = 술술(끼(초, 15.0, 15.6));

  /* ⭐ 캐릭터가 크게 들어왔다가 오른쪽 아래로 물러난다 — wealthgap 편 그대로 */
  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[0.6, 5.91], [6.06, 11.11], [11.26, 15.17]],
    가리킴: [[6.06, 8.8]],
    풀림: 15.2,
  });

  const 줄들 = 나이칸들.map((r, i) => {
    const 시작 = 1.9 + i * 0.28;
    const 자람 = 술술(끼(초, 시작, 시작 + 0.75));
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    const 켬 = 초 > 5.9 && r.칸 === 삼십대.칸 ? ' 켬' : '';
    return `<div class="줄${켬}">
      <span class="이름">${r.칸}</span>
      <span class="한칸"><span class="막대" style="width:${ㄴ(자리비율(r.분율) * 자람)}%"></span>
        <span class="값" style="opacity:${보임}">${r.분율}%</span></span>
    </div>`;
  }).join('');

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
    .머리{font-size:60px;font-weight:800;line-height:1.24;letter-spacing:-2px;
          opacity:${ㄴ(머리)};transform:translateY(${ㄴ((1 - 머리) * 26)}px)}
    .곁{margin-top:16px;font-size:30px;color:#9aa2b1;opacity:${ㄴ(머리)}}

    .표{margin-top:44px;opacity:${ㄴ(표나옴)}}
    .줄{display:flex;align-items:center;margin-bottom:20px}
    .이름{width:190px;font-size:30px;color:#c3c8d4}
    .한칸{flex:1;position:relative;height:42px;display:flex;align-items:center}
    .막대{position:absolute;left:0;height:42px;border-radius:8px;background:#4a5468}
    .줄.켬 .막대{background:#e8b34f}
    .줄.켬 .이름{color:#e8b34f;font-weight:800}
    .값{position:relative;margin-left:14px;font-size:30px;font-weight:800}

    .대조{margin-top:36px;padding:26px 30px;border-left:6px solid #e8b34f;
          background:#1b1f29;border-radius:10px;font-size:28px;line-height:1.5;
          color:#c3c8d4;opacity:${ㄴ(대조 * (1 - 끝))}}
    .대조 b{color:#e9e9ee}

    .맺음{margin-top:40px;font-size:38px;font-weight:800;line-height:1.4;
          opacity:${ㄴ(맺음 * (1 - 끝))}}

    .막{position:absolute;left:0;right:0;top:1500px;bottom:0;background:#12151c;opacity:${ㄴ(끝)}}
    .마무리{position:absolute;left:84px;right:84px;top:1560px;opacity:${ㄴ(끝)}}
    .마무리 b{display:block;font-size:38px;font-weight:900;color:#e9e9ee;line-height:1.3}
    .마무리 span{display:block;margin-top:14px;font-size:28px;font-weight:800;color:#e8b34f}
    .마무리 i{display:block;margin-top:8px;font-style:normal;font-size:22px;color:#8b93a3}
  </style>
  <div class="판">
    <div class="띠">100YEARMAP.COM</div>
    <div class="머리">급성심장정지는<br>몇 살부터 늘어날까요</div>
    <div class="곁">${d.최신연도}년 · 119구급대 이송 환자 ${d.전체_건수.toLocaleString()}명</div>
    <div class="표">${줄들}</div>
    <div class="대조">
      ⛔ 「몫」과 「위험」은 다른 잣대입니다<br>
      30대 분율 <b>${삼십대.분율}%</b>(환자 중 몫) · 발생률 <b>${삼십대.발생률}명</b>은
      20대(<b>${이십대.발생률}명</b>)보다 이미 높습니다
    </div>
    <div class="맺음">30대+40대를 합치면<br><b>${삼사십대분율합}%</b>로 10%를 넘습니다.</div>

    <div class="막"></div>
    <div class="마무리">
      <b>이것은 통계이지<br>당신이 아닙니다.</b>
      <span>${주소}</span>
      <i>질병관리청·소방청 「급성심장정지조사」 · ${d.최신연도}년 · 받은 날 ${d.받은때}</i>
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
  const 투명도 = (t, 이름) => {
    const m = 칸HTML(t).match(new RegExp(`\\.${이름}\\{[^}]*opacity:([0-9.]+)`));
    return m ? Number(m[1]) : null;
  };

  재본다('⭐ 캐릭터가 첫 1초에 이미 그려지고 있다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 물러나 작아진다', (() => {
    const 크기 = (t) => Number(칸HTML(t).match(/\.누\{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
    return 크기(3.5) < 크기(0.8) * 0.6;
  })(), true);
  재본다('⛔ 슬라이드쇼가 아니다', (() => {
    const xs = [1, 3, 5, 7, 9, 12, 14].map(칸HTML);
    return new Set(xs).size === xs.length;
  })(), true);

  재본다(`⭐ 전체 건수가 화면에 있다 — ${d.전체_건수}`, 글자만(칸HTML(1)), (s) => s.replace(/,/g, '').includes(String(d.전체_건수)));
  재본다('⛔⛔ 분율·발생률을 다른 잣대라 밝힌다', 글자만(칸HTML(7)), (s) => s.includes('다른 잣대'));
  재본다('⭐ 30대 분율·발생률이 대조 문단에 있다', 투명도(7, '대조'),
    (v) => v > 0.9 && 글자만(칸HTML(7)).includes(`${삼십대.분율}%`) && 글자만(칸HTML(7)).includes(`${삼십대.발생률}명`));
  재본다('⭐ 20대 발생률과 비교한다', 글자만(칸HTML(7)), (s) => s.includes(`${이십대.발생률}명`));
  재본다(`⭐ 30+40대 합 문구가 있다 — ${삼사십대분율합}%`, 글자만(칸HTML(12)), (s) => s.includes(`${삼사십대분율합}%`) && s.includes('10%를 넘습니다'));
  재본다('⛔ 대조가 맺음보다 먼저 뜬다', [투명도(4, '대조'), 투명도(4, '맺음')], (v) => v[0] < 0.05 && v[1] < 0.05);
  재본다('⛔ 판정하는 말을 안 쓴다', [1, 7, 12, 15].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/(해야 한다|늦었다|조심하십시오|주의하십시오|예방하십시오|등수|순위|랭킹|몇 위|꼴찌|최악)/.test(s));
  재본다('⭐ 이것은 통계이지 당신이 아니다 — 끝에 있다', 글자만(칸HTML(15.5)), (s) => s.includes('통계이지') && s.includes('당신이 아닙니다'));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(15.5)), (s) => s.includes(주소));
  재본다('출처·받은 날을 적는다', 글자만(칸HTML(15.5)), (s) => s.includes('급성심장정지조사') && s.includes(d.받은때));

  재본다('⛔ 목소리때들이 셋(대본 세 줄)이다', 목소리때들.length, 3);
  재본다('⛔ 목소리때들이 시간순으로 늘어난다', 목소리때들.every((t, i) => i === 0 || t > 목소리때들[i - 1]), true);
  재본다('⛔ 입이 움직이는 시작이 목소리 시작과 같다', (() => {
    const m = 칸HTML.toString().match(/말함:\s*(\[\[[\s\S]*?\]\])/);
    const 말함 = JSON.parse(m[1]);
    return 말함.map((w) => w[0]).every((시작, i) => Math.abs(시작 - 목소리때들[i]) < 0.01);
  })(), true);

  const 나이경계 = 나이칸들.flatMap((r) => (r.칸.match(/\d+/g) ?? []));
  const 댈수 = new Set([
    ...나이칸들.map((r) => r.분율), 삼십대.발생률, 이십대.발생률, 삼사십대분율합,
    d.전체_건수, Number(d.최신연도), ...나이경계, 10,
  ].filter((v) => v != null).map(String).map((s) => s.replace(/,/g, '')));
  const 온글 = [0, 1, 3, 5, 7, 9, 12, 14, 15.5].map(칸HTML).join(' ');
  const 수볼글 = 글자만(온글)
    .replace(new RegExp(주소.replace('.', '\\.'), 'g'), ' ')
    .replace(/119|100YEARMAP\.COM/g, ' ')
    .replace(new RegExp(d.받은때.replace(/-/g, '\\-'), 'g'), ' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s));
  재본다(`화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`, 못댄것.length, 0);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--selftest')) {
  const oi = process.argv.indexOf('--out');
  const 낼길 = oi >= 0 ? process.argv[oi + 1] : path.join(여기, 'public/100y/video/급성심장정지나이대.mp4');
  const 임시 = path.join(path.dirname(낼길), '_칸100ycardiac');
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

  const 길이재기 = (길) => {
    try { execFileSync(ff, ['-i', 길], { stdio: 'pipe' }); } catch (e) {
      const m = String(e.stderr).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
    }
    return null;
  };
  const 낸길이 = 길이재기(낼길);
  if (낸길이 !== null && 총초 - 낸길이 > 0.2) {
    console.error(`\n🔴 얹으면서 짧아졌다 — 원본 ${총초}초 → 낸 것 ${낸길이}초`);
    process.exit(1);
  }

  const 썸방 = path.join(여기, 'public/100y/video/thumb');
  fs.mkdirSync(썸방, { recursive: true });
  execFileSync(ff, ['-y', '-ss', '8', '-i', 낼길, '-frames:v', '1', '-update', '1',
    path.join(썸방, 'cardiac-arrest.jpg')], { stdio: 'inherit' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`\n✅ ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
}
