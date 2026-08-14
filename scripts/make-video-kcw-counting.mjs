#!/usr/bin/env node
/**
 * make-video-kcw-counting.mjs — **K Culture Wire 쇼츠 6편.** 14초 · 1080×1920 · 영어.
 *   「서울은 스물다섯 구인데 관광 집계는 다섯 구밖에 못 말한다」 (89편)
 *
 * 🔴 사장님(8/08): 「슬라이드쇼잖아. 이걸 누가 보냐」 → 첫 0.4초에 제일 센 대비, 매 프레임이 다름.
 * 🔴 사장님(8/13): 「이건 **외부유입용**이다」 → 주소를 1.6초부터 **내내** 붙인다.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-read-vs-visited.json` 에서 읽는다.
 * ⭐ 이 편은 결이 다르다 — **못 잰 것이 내용**이다. 그래서 「없는 것」이 덤이 아니라 중심이다.
 * ⛔ **「강남이 인기 없다」로 읽히면 거짓이다.** 화면에 유료 관광지 자라는 말을 넣는다.
 * ⛔ 원본의 0 을 고치지 않았다는 말을 화면에 넣는다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-counting.mjs --out <mp4>
 *   node scripts/make-video-kcw-counting.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

export const 초당 = 30;
export const 폭 = 1080;
export const 높 = 1920;
export const 총초 = 14;

const d = JSON.parse(fs.readFileSync('src/data/wikitip-read-vs-visited.json', 'utf8'));
export const 줄들 = d.rows;
export const 전체구 = d.seoulDistrictsAll;
export const 견줌 = d.districtsCompared;
export const 관광지없음 = d.districtsWithNoCountedSite;
export const 외국인0 = d.districtsWithForeignZero;
export const 종로 = 줄들.find((r) => r.nameEn.startsWith('Jongno'));
export const 노원 = 줄들.find((r) => r.nameEn.startsWith('Nowon'));

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export const 툭 = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = 1.70158 + 1;
  return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
};
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.2 — 25 와 5 가 나란히 박힌다. 이 대비가 영상의 전부다 */
  const 스물다섯 = 툭(끼(0.0, 0.5));
  const 다섯 = 툭(끼(0.5, 1.0));
  const 밑말 = 술술(끼(1.1, 1.7));

  /* ⭐ 주소는 1.6초부터 내내 — 외부유입용이다 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  /* ② 2.2–6.5 — 스물다섯 칸이 켜진다. 다섯만 밝다 */
  const 격자나옴 = 술술(끼(2.2, 2.7));
  const 칸들 = Array.from({ length: 전체구 }, (_, i) => {
    const 켤때 = 2.6 + i * 0.07;
    const 켜짐 = 술술(끼(켤때, 켤때 + 0.3));
    const 밝음 = i < 견줌 ? ' 밝' : '';
    return `<span class="칸${밝음}" style="opacity:${(0.18 + 0.82 * 켜짐).toFixed(2)}"></span>`;
  }).join('');

  /* ③ 5.0–8.0 — 종로 하나가 거의 다 가져간다 */
  const 종로등장 = 술술(끼(5.0, 5.6));

  /* ④ 8.2–11.0 — 못 센 것 */
  const 없는것 = 끼(8.2, 8.6);
  const 없는줄 = [
    `Jung, which holds Myeongdong — no counted site`,
    `Mapo, which holds Hongdae — no counted site`,
    `Songpa — admissions counted, foreign visitors recorded as zero`,
  ].map((s, i) => {
    const o = 술술(끼(8.6 + i * 0.3, 9.2 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${s}</li>`;
  }).join('');

  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0e0c14;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#8f7ab5;opacity:${머리띠.toFixed(2)}}
    .맞{position:absolute;left:84px;right:84px;top:184px;display:flex;align-items:flex-end;gap:40px}
    .맞 .쪽{flex:1}
    .맞 .왼{opacity:${스물다섯.toFixed(2)};transform:scale(${(0.86 + 0.14 * 스물다섯).toFixed(3)});transform-origin:left bottom}
    .맞 .오{opacity:${다섯.toFixed(2)};transform:scale(${(0.86 + 0.14 * 다섯).toFixed(3)});transform-origin:left bottom}
    .맞 b{display:block;font-size:172px;font-weight:900;color:#8f88a0;line-height:.9;letter-spacing:-.04em}
    .맞 .오 b{color:#e9e6dd}
    .맞 span{display:block;margin-top:12px;font-size:30px;font-weight:700;color:#8f88a0;line-height:1.2}
    .맞 .오 span{color:#c9a6ff}
    .밑{position:absolute;left:84px;right:84px;top:432px;font-size:42px;font-weight:700;
        color:#e9e6dd;line-height:1.26;opacity:${밑말.toFixed(2)};
        transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}

    .격자{position:absolute;left:84px;right:84px;top:600px;display:flex;flex-wrap:wrap;gap:14px;
          opacity:${격자나옴.toFixed(2)}}
    .칸{width:158px;height:74px;border-radius:8px;background:#2a2440;display:block}
    .칸.밝{background:linear-gradient(135deg,#c9a6ff,#7c5cc4)}
    .잔{position:absolute;left:84px;right:84px;top:1010px;font-size:27px;color:#a49bb8}

    .종{position:absolute;left:84px;right:84px;top:1120px;opacity:${종로등장.toFixed(2)};
        transform:translateY(${((1 - 종로등장) * 16).toFixed(1)}px)}
    .종 b{display:block;font-size:82px;font-weight:900;color:#c9a6ff;line-height:1;letter-spacing:-.02em}
    .종 em{display:block;font-style:normal;margin-top:12px;font-size:32px;font-weight:600;
           color:#e9e6dd;line-height:1.34}

    .없{position:absolute;left:84px;right:84px;top:1470px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:36px;font-weight:800;color:#c9a6ff;margin-bottom:14px}
    .없 li{list-style:none;font-size:28px;line-height:1.4;color:#cdc6dc;margin-bottom:8px}

    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:22px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(14,12,20,.94), rgba(14,12,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:46px;font-weight:800;color:#e9e6dd;text-align:center;line-height:1.3}
    .끝 .ㅅ{font-size:54px;font-weight:900;color:#c9a6ff;letter-spacing:-.02em;text-align:center;line-height:1.2}
    .끝 .ㄱ{font-size:29px;color:#a49bb8;text-align:center;line-height:1.4}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE &middot; kculturewire.com</div>
    <div class="맞">
      <div class="쪽 왼"><b>${전체구}</b><span>districts in Seoul</span></div>
      <div class="쪽 오"><b>${견줌}</b><span>the tourist count can speak for</span></div>
    </div>
    <div class="밑">Korea publishes admissions to paid tourist sites.<br>It can be asked about five parts of its capital.</div>

    <div class="격자">${칸들}</div>
    <div class="잔">Each block is one district. ${관광지없음} of them have no counted tourist site at all;
      ${외국인0} more count admissions and record foreign visitors as zero.</div>

    <div class="종">
      <b>${종로.foreignVisitors.toLocaleString('en-US')}</b>
      <em>foreign admissions in ${종로.nameEn.replace(' District', '')} &mdash; the palaces sell tickets.<br>
      ${노원.nameEn.replace(' District', '')}, read almost as often, records ${노원.foreignVisitors}.</em>
    </div>

    <div class="없">
      <h3>What is not counted</h3>
      <ul>${없는줄}</ul>
    </div>
  </div>
  <div class="끝">
    <div class="ㅈ">A zero we invent over<br>is worse than a zero<br>we mark and leave.</div>
    <div class="ㅅ">kculturewire.com<br>/read-vs-visited</div>
    <div class="ㄱ">KOSIS &middot; Wikidata &middot; Wikimedia Pageviews<br>Every figure has a table behind it</div>
  </div>`;
}

if (process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };
  const 글자만 = (s) => s.replace(/<style>[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  재본다('첫 프레임에 이미 숫자가 있다', 글자만(칸HTML(0.5)), (s) => /\d/.test(s));
  재본다('⛔ 슬라이드쇼가 아니다', [1, 2.5, 3.5, 5, 7, 9, 12].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('25 와 5 가 자료에서 왔다', 글자만(칸HTML(1.2)),
    (s) => s.includes(String(전체구)) && s.includes(String(견줌)));
  재본다('칸이 구 수만큼', (칸HTML(6).match(/class="칸[^"]*"/g) ?? []).length, 전체구);
  재본다('밝은 칸이 견준 구 수만큼', (칸HTML(6).match(/class="칸 밝"/g) ?? []).length, 견줌);
  재본다('종로 수가 자료에서 왔다', 글자만(칸HTML(6)),
    (s) => s.includes(종로.foreignVisitors.toLocaleString('en-US')));
  재본다('노원 수가 자료에서 왔다', 글자만(칸HTML(6)), (s) => s.includes(String(노원.foreignVisitors)));
  /* 🔴 못 센 것이 이 편의 중심이다 */
  재본다('⛔ 명동을 중구에 붙인다', 글자만(칸HTML(10)), (s) => /Jung, which holds Myeongdong/.test(s));
  재본다('⛔ 홍대를 마포에 붙인다', 글자만(칸HTML(10)), (s) => /Mapo, which holds Hongdae/.test(s));
  재본다('⛔ 0 을 안 고쳤다는 말이 있다', 글자만(칸HTML(13)), (s) => /A zero we invent over/.test(s));
  재본다('⛔ 유료 관광지라는 말이 있다', 글자만(칸HTML(4)), (s) => /paid tourist sites/.test(s));
  /* 🔴 외부유입용 — 주소가 가운데에도 보인다 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 보인다', [3, 6, 9, 11].map(띠투명도), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 숫자가 먼저다', 띠투명도(0.6), 0);
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com'));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-counting.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwcount');
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.mkdirSync(임시, { recursive: true });

  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
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

  const ff = require('ffmpeg-static');
  execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-c:a', 'aac', '-b:a', '64k', '-shortest',
    '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`✅ ${낼길}  ${총초}초 · ${폭}×${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
}
