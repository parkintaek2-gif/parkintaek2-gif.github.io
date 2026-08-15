#!/usr/bin/env node
/**
 * make-video-kcw-fame.mjs — **K Culture Wire 쇼츠 2편.** 14초 · 1080×1920 · 영어.
 *   「동남아에서 손흥민보다 많이 읽히는 한국 이름은 하나뿐이다」
 *
 * 🔴 사장님(2026-08-08): 「슬라이드쇼잖아. 이걸 누가 보냐」
 *   → 첫 0.4초에 제일 센 숫자, 매 프레임이 다름, 14초. `make-video-kcw.mjs` 뼈대를 따른다.
 * 🔴 사장님(2026-08-13): 「케이컬쳐 핵심이 케이팝인데」
 *   → 그래서 이 편의 주인공은 **BTS** 다. 축구 선수를 넘은 유일한 이름이라는 것이 뼈다.
 *
 * ⛔ **수를 손으로 안 박는다.** `src/data/wikitip-fame-compare.json` 에서 읽는다.
 * ⛔ **줄세우지 않는다.** 여섯 무리를 나란히 놓고 「순위표가 아니다」를 화면에 적는다.
 * ⛔ **못 대는 수를 넣지 않는다.** 여기 나오는 모든 수는 /fame-compare 에 있다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-fame.mjs --out <mp4>
 *   node scripts/make-video-kcw-fame.mjs --selftest
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

/* ── 수는 자료에서 온다 ────────────────────────────────────────── */
const d = JSON.parse(fs.readFileSync('src/data/wikitip-fame-compare.json', 'utf8'));
const 무리 = (k) => d.groups.find((g) => g.group === k);

export const 으뜸이름 = d.topActorName;          /* BTS */
export const 으뜸값 = d.topActorTotal;           /* 380.76 */
export const 선수이름 = d.topAthleteName;        /* Son Heung-min */
export const 선수값 = d.topAthleteTotal;         /* 342.3 */
export const 연예수 = d.entertainersCounted;     /* 2511 */
export const 넘은수 = d.actorsAboveTopAthlete;   /* 1 */
export const 브랜드이름 = d.topBrandName;         /* BMW */
export const 브랜드값 = d.topBrandTotal;          /* 66.76 */

/** 화면에 낼 다섯 — ⛔ 순위가 아니라 **무리마다 모양이 다르다**를 보이려는 것이다 */
export const 보일것 = [
  { name: 'BTS', v: 으뜸값, kind: 'Group', 켬: true },
  { name: 선수이름, v: 선수값, kind: 'Athlete', 켬: true },
  { name: 무리('actors').top, v: 무리('actors').topTotal, kind: 'Actor' },
  { name: 무리('musicians').top, v: 무리('musicians').topTotal, kind: 'Solo' },
  { name: 브랜드이름, v: 브랜드값, kind: 'Brand', 켬: true },
];

/* ── 움직임 ── */
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

  /* ① 0.0–2.4  「1」이 박힌다 — 손흥민을 넘은 이름이 몇이나 되나 */
  const 큰수등장 = 툭(끼(0.0, 0.5));
  const 큰수값 = 넘은수 <= 3 ? 넘은수 : Math.round(넘은수 * 술술(끼(0.15, 0.9)));
  const 밑말 = 술술(끼(0.8, 1.4));

  /* ② 1.8–7.0  막대 다섯이 자란다 */
  const 표나옴 = 술술(끼(1.8, 2.3));
  const 최대 = Math.max(...보일것.map((r) => r.v));
  const 막대들 = 보일것.map((r, i) => {
    const 시작 = 2.1 + i * 0.28;
    const 자람 = 술술(끼(시작, 시작 + 0.6));
    /* ⚠ 이름 칸을 뺀 나머지가 대략 58% 다. 그보다 크면 오른쪽이 잘린다 */
    const 길이 = (r.v / 최대) * 58 * 자람;
    const 켜짐 = 초 > 5.2 && r.켬 ? 1 : 0;
    return `<div class="줄${켜짐 ? ' 켬' : ''}">
      <span class="이름">${r.name}<em>${r.kind}</em></span>
      <span class="막대" style="width:${길이.toFixed(2)}%"></span>
      <span class="값" style="opacity:${Math.max(0, 자람 * 2 - 1).toFixed(2)}">${(r.v * 자람).toFixed(0)}</span>
    </div>`;
  }).join('');

  /* ③ 5.4–8.0  브랜드를 짚는다 — 사장님 ②③ 물음의 답이다 */
  const 짚기 = 술술(끼(5.4, 6.0));

  /* ④ 8.2–11.0  못 하는 말 */
  const 없는것 = 끼(8.2, 8.6);
  const 없는줄 = [
    'Not a ranking — six groups, different shapes',
    'Not popularity — this counts look-ups',
    'Not the Philippines — that edition is too small to measure',
  ].map((s, i) => {
    const o = 술술(끼(8.6 + i * 0.3, 9.2 + i * 0.3));
    return `<li style="opacity:${o.toFixed(2)};transform:translateX(${((1 - o) * 26).toFixed(1)}px)">${s}</li>`;
  }).join('');

  /* ⑤ 11.4–14  끝 */
  const 끝 = 술술(끼(11.4, 12.0));
  const 끝맥 = 1 + 0.012 * Math.sin((초 - 11.4) * 3.1);

  /**
   * 🔴 사장님(8/13): 「이건 **외부유입용** 콘텐트 역할도 하고, 우리를 알리는 거니까」
   *   → 그러면 주소가 **끝에만 있으면 안 된다.** 끊고 나가는 사람이 대부분인데
   *     그 사람들은 우리를 못 찾는다. 1.6초부터 위에 작게 띄워 **내내 붙여 둔다.**
   */
  const 머리띠 = 술술(끼(1.6, 2.2)) * (1 - 끝);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0e0c14;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}
    /* 🔴 외부유입용이다 — 주소를 끝에만 두면 끊고 나간 사람이 우리를 못 찾는다 */
    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#8f7ab5;opacity:${머리띠.toFixed(2)}}
    .큰수{position:absolute;left:84px;top:190px;opacity:${큰수등장.toFixed(2)};
          transform:scale(${(0.86 + 0.14 * 큰수등장).toFixed(3)});transform-origin:left top}
    .큰수 b{display:block;font-size:300px;font-weight:900;color:#e9e6dd;line-height:.86;
            letter-spacing:-.04em}
    .큰수 .밑{margin-top:22px;font-size:46px;font-weight:700;color:#c9a6ff;line-height:1.24;
              opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 18).toFixed(1)}px)}
    .큰수 .잔{margin-top:14px;font-size:29px;color:#a49bb8;opacity:${밑말.toFixed(2)}}

    .표{position:absolute;left:84px;right:84px;top:760px;opacity:${표나옴.toFixed(2)}}
    .줄{display:flex;align-items:center;gap:16px;margin-bottom:22px;height:62px}
    .줄 .이름{width:300px;flex:none;font-size:33px;font-weight:700;color:#8f88a0;line-height:1.05}
    .줄 .이름 em{display:block;font-style:normal;font-size:22px;font-weight:600;color:#6a6478;margin-top:3px}
    .줄 .막대{height:34px;border-radius:6px;background:#3a3350;transition:none}
    .줄 .값{font-size:34px;font-weight:800;color:#8f88a0}
    .줄.켬 .이름{color:#e9e6dd}
    .줄.켬 .막대{background:linear-gradient(90deg,#7c5cc4,#c9a6ff)}
    .줄.켬 .값{color:#c9a6ff}

    .짚{position:absolute;left:84px;right:84px;top:1300px;opacity:${짚기.toFixed(2)};
        transform:translateY(${((1 - 짚기) * 16).toFixed(1)}px)}
    .짚 em{font-style:normal;font-size:38px;font-weight:700;color:#e9e6dd;line-height:1.34}

    .없{position:absolute;left:84px;right:84px;top:1500px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:38px;font-weight:800;color:#c9a6ff;margin-bottom:16px}
    .없 li{list-style:none;font-size:31px;line-height:1.42;color:#cdc6dc;margin-bottom:9px}

    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:22px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(14,12,20,.94), rgba(14,12,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:50px;font-weight:800;color:#e9e6dd}
    .끝 .ㅅ{font-size:56px;font-weight:900;color:#c9a6ff;letter-spacing:-.02em;text-align:center;line-height:1.2}
    .끝 .ㄱ{font-size:30px;color:#a49bb8;text-align:center;line-height:1.4}
  </style>
  <div class="판">
    <div class="띠">K CULTURE WIRE · kculturewire.com</div>
    <div class="큰수">
      <b>${큰수값}</b>
      <div class="밑">Korean act reads more than<br>${선수이름} in Southeast Asia</div>
      <div class="잔">Of ${연예수.toLocaleString('en-US')} entertainers measured · 12 months</div>
    </div>

    <div class="표">${막대들}</div>
    <div class="짚"><em>The biggest luxury or car brand, ${브랜드이름}, reaches ${브랜드값.toFixed(0)}.<br>Readers follow the person, not the label.</em></div>

    <div class="없">
      <h3>What this is not</h3>
      <ul>${없는줄}</ul>
    </div>
  </div>
  <div class="끝">
    <div class="ㅈ">See all six groups</div>
    <div class="ㅅ">kculturewire.com<br>/fame-compare</div>
    <div class="ㄱ">Wikipedia reads, four Southeast Asian editions<br>Every figure has a table behind it</div>
  </div>`;
}

/* ── 검사 ── */
/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 글자만 = (s) => s.replace(/<[^>]+>/g, ' ');
  재본다('사이 — 앞/뒤/가운데', [사이(0, 1, 2), 사이(3, 1, 2), 사이(1.5, 1, 2)],
    (x) => x[0] === 0 && x[1] === 1 && x[2] === 0.5);
  재본다('술술 0/1', [술술(0), 술술(1)], (x) => x[0] === 0 && x[1] === 1);
  재본다('첫 프레임에 이미 숫자가 있다', 글자만(칸HTML(0.5)), (s) => /\d/.test(s));
  재본다('⛔ 슬라이드쇼가 아니다 — 프레임이 다 다르다',
    [1.0, 2.2, 3.0, 5.0, 7.0, 9.0, 12.0].map((t) => 칸HTML(t)),
    (xs) => new Set(xs).size === xs.length);
  재본다('마지막도 움직인다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  /* 🔴 화면의 수가 **자료의 수와 같아야** 한다. 손으로 박으면 여기서 걸린다.
     ⚠ 「아무 수나 걸리는」 검사를 안 만든다 — 이름과 붙여서 본다 */
  재본다('BTS 값이 자료에서 왔다', 칸HTML(7),
    (s) => s.includes(`>BTS<`) && s.includes(String(Math.round(으뜸값))));
  재본다('선수 값이 자료에서 왔다', 칸HTML(7),
    (s) => s.includes(선수이름) && s.includes(String(Math.round(선수값))));
  재본다('브랜드 값이 자료에서 왔다', 글자만(칸HTML(7)),
    (s) => s.includes(브랜드이름) && s.includes(String(Math.round(브랜드값))));
  재본다('연예인 수가 자료에서 왔다', 글자만(칸HTML(1.5)),
    (s) => s.includes(연예수.toLocaleString('en-US')));
  재본다('⛔ 줄세우기가 아니라고 화면에 적혀 있다', 글자만(칸HTML(10)), (s) => s.includes('Not a ranking'));
  재본다('⛔ 인기가 아니라고 적혀 있다', 글자만(칸HTML(10)), (s) => s.includes('Not popularity'));
  재본다('⛔ 필리핀을 못 잰다고 적혀 있다', 글자만(칸HTML(10)), (s) => s.includes('Philippines'));
  재본다('끝에 주소가 있다', 글자만(칸HTML(13)), (s) => s.includes('kculturewire.com'));
  /* 🔴 사장님(8/13) — 외부유입용이다. 주소가 **끝에만** 있으면 끊고 나간 사람이 못 찾는다 */
  /* ⚠ 글자가 HTML 에 있는 것과 **보이는 것**은 다르다. opacity 를 본다 */
  const 띠투명도 = (t) => {
    const m = 칸HTML(t).match(/\.띠\{[^}]*opacity:([0-9.]+)/);
    return m ? Number(m[1]) : null;
  };
  재본다('⭐ 주소가 가운데에도 **보인다** — 끊고 나가는 사람이 대부분이다',
    [3, 6, 9, 11].map((t) => 띠투명도(t)), (xs) => xs.every((v) => v > 0.9));
  재본다('⭐ 첫 화면엔 안 보인다 — 숫자가 먼저다', 띠투명도(0.6), 0);
  재본다('끝 화면에선 띠를 끈다 — 큰 주소가 이미 있다', 띠투명도(13), 0);
  재본다('끝에 무엇으로 쟀는지 있다', 글자만(칸HTML(13)), (s) => s.includes('Wikipedia reads'));
  재본다('막대 수가 보일것 수와 같다', (칸HTML(6).match(/class="줄/g) ?? []).length, 보일것.length);
  재본다('⛔ 보일것에 빈 이름이 없다', 보일것.every((r) => r.name && r.v > 0), true);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 뽑기 ──
 * 🔴 8/13 — 목소리 자가 이 파일을 `import` 했더니 **영상이 실제로 뽑혔다.**
 *   가져다 쓰는 쪽은 `칸HTML` 만 필요하다. 직접 부른 것이 아니면 여기서 멈춘다.
 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (!내가실행됐다) {
  /* 가져다 쓰는 쪽이다 — 아무것도 뽑지 않는다 */
} else {
const i = process.argv.indexOf('--out');
const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-fame.mp4';
const 임시 = path.join(path.dirname(낼길), '_칸kcwfame');
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
  if (n % 60 === 0) console.log(`  ${n}/${칸수}`);
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
