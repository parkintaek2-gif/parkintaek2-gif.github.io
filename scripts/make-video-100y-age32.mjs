#!/usr/bin/env node
/**
 * `@100yearmap` 오늘 영상 — **서른둘, 사람들은 결혼했을까요 아직일까요** (14초 쇼츠).
 *
 *   node scripts/make-video-100y-age32.mjs --자가시험
 *   node scripts/make-video-100y-age32.mjs --out 서른둘.mp4
 *
 * ## 🔴 왜 이걸 만드나 — **사장님 0시 지시다**
 *
 *   *「왜 자꾸 대입에 머물러있니? 0세에서 100세까지 그걸 다 컨텐츠를 …
 *   B2B 판매보다 B2C 판매가 많을 것이고 그걸 염두에 두고」*
 *
 *   ```
 *   어제 영상   종로구 100년 넘은 고등학교      → 10대·학부모
 *   오늘 영상   서른둘의 초혼·월급·근속          → ⭐ **30대**
 *   ```
 *   ⛔ 지면 4,864장이 대입이다. 영상까지 대입이면 습관이 그대로 이긴다.
 *
 * ## ⛔ 수를 손으로 안 박는다 — **화면의 수는 전부 라이브 지면에 있는 수다**
 *
 *   2번 규칙 — *「영상에 나오는 숫자마다 그 수가 있는 지면 주소를 적으십시오.
 *   못 대는 숫자는 영상에서 빼십시오」*.
 *   그래서 이 자는 `근거` 표를 들고 있고, **자가시험이 화면 글자에서 수를 도로 캐내어**
 *   근거에 없으면 **거기서 선다**. (오늘 카드뉴스 자에서 먼저 한 방식이다.)
 *
 * ## ⚠ 말에서 지키는 것 — 이 지면은 특히 조심한다
 *
 *   ```
 *   ⛔ 「해야 한다」·「늦었다」·「이르다」  우리가 정할 자격이 없다. 자가시험이 막는다
 *   ⛔ 「평균 결혼 나이」                  평균이 아니라 **누적**이다. 뜻이 다르다
 *   ⚠ 초혼만 센 수다                     재혼은 빠져 있다. 화면에 적는다
 *   ⚠ 나이는 한 살, 월급은 다섯 살 묶음    묶인 값은 어느 띠에서 왔는지 그 자리에 적는다
 *   ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { 곰곰이 } from './gomgomi.mjs';
import { 임금값, 혼인누적, 임금꼭대기 } from '../src/lib/age-page.ts';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
const 여기 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

export const 초당 = 30;
export const 폭 = 1080, 높 = 1920;
export const 총초 = 14;

/* ── 수는 지면이 쓰는 그 자에서 가져온다. ⛔ 손으로 안 적는다 ────────── */
const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/age-axis.json'), 'utf8'));

export const 나이 = 32;
/** ⚠ 지면이 실제로 낸 나이만 근거로 댈 수 있다. `age/[age].astro` 의 낼나이와 같다 */
export const 낼나이 = [25, 32, 40, 55, 68];
export const 사다리 = [25, 32, 40].map((n) => ({ 나이: n, ...혼인누적(자료, n) }));
export const 일 = 임금값(자료, 나이);
export const 누적 = 혼인누적(자료, 나이);
export const 꼭대기 = 임금꼭대기(자료);
export const 총건 = 자료.혼인.총건;
export const 최다남편 = 자료.혼인.최다.남편;

const 집 = 'https://100yearmap.com';
/** 🔴 화면에 뜨는 수마다 **그 수가 있는 지면**. 자가시험이 이 표로 화면을 검사한다 */
export const 근거 = [
  ...사다리.flatMap((r) => [
    { 수: r.나이, 뜻: `나이 ${r.나이} (지면이 있는 나이)`, 지면: `${집}/age/${r.나이}` },
    { 수: r.남편, 뜻: `${r.나이}세까지 초혼한 남자(%)`, 지면: `${집}/age/${r.나이}` },
    { 수: r.아내, 뜻: `${r.나이}세까지 초혼한 여자(%)`, 지면: `${집}/age/${r.나이}` },
  ]),
  { 수: Number(일.월급.replace(/[^0-9]/g, '')), 뜻: '30~34세 월급여(붙여 읽은 수)', 지면: `${집}/age/32` },
  { 수: 368, 뜻: '30~34세 월급여 만원 자리', 지면: `${집}/age/32` },
  { 수: 9, 뜻: '30~34세 월급여 천원 자리', 지면: `${집}/age/32` },
  { 수: 일.근속, 뜻: '30~34세 평균 근속(년)', 지면: `${집}/age/32` },
  { 수: 30, 뜻: '띠 시작 나이', 지면: `${집}/age/32` },
  { 수: 34, 뜻: '띠 끝 나이', 지면: `${집}/age/32` },
  { 수: 총건, 뜻: '초혼 건수(2025)', 지면: `${집}/age/32` },
  { 수: Number(String(최다남편).replace(/[^0-9]/g, '')), 뜻: '남편 나이로 가장 많은 나이', 지면: `${집}/age/32` },
  { 수: 2025, 뜻: '자료 해', 지면: `${집}/age/32` },
  { 수: 100, 뜻: '집 이름(100yearmap.com)', 지면: 집 },
];

/* ── 움직임 (make-video-100y-jongno 와 같은 것) ───────────────────── */
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

/**
 * 막대 길이 — 0~100% 를 폭의 **62%** 까지만 편다.
 * ⚠ 종로 영상에서 100%로 폈다가 **값 글자가 화면 밖으로 나갔다.** 같은 실수를 두 번 안 한다.
 */
export const 자리 = (백분율) => (백분율 / 100) * 62;

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.6  「52.5%」가 박히고 밑에 물음이 밀려 들어온다 */
  const 큰수등장 = 툭(끼(0.0, 0.55));
  const 큰수값 = (누적.남편 * 술술(끼(0.15, 1.0))).toFixed(1);
  const 밑말 = 술술(끼(0.85, 1.5));

  /* ② 1.9–6.6  세 나이가 오래된 순이 아니라 **나이 순**으로 자란다 */
  const 표나옴 = 술술(끼(1.9, 2.4));
  const 줄들 = 사다리.map((r, i) => {
    const 시작 = 2.15 + i * 0.35;
    const 자람 = 술술(끼(시작, 시작 + 0.8));
    const 켜짐 = 초 > 6.9 && r.나이 === 나이 ? 1 : 0;
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    return `<div class="줄${켜짐 ? ' 켬' : ''}">
      <span class="이름">${r.나이}세</span>
      <span class="짝">
        <span class="한칸"><span class="막대 남" style="width:${(자리(r.남편) * 자람).toFixed(2)}%"></span><span class="값" style="opacity:${보임}">남 ${r.남편}%</span></span>
        <span class="한칸"><span class="막대 여" style="width:${(자리(r.아내) * 자람).toFixed(2)}%"></span><span class="값" style="opacity:${보임}">여 ${r.아내}%</span></span>
      </span>
    </div>`;
  }).join('');

  /* ③ 6.9–8.4  서른둘을 짚고, 같은 나이띠의 일을 붙인다 */
  const 짚음 = 술술(끼(6.9, 7.5));

  /* ④ 8.4–11.2  없는 것 */
  const 없는것 = 끼(8.4, 8.8);
  const 없는줄 = [
    '초혼만 센 수입니다. 재혼은 빠져 있습니다',
    '평균이 아니라 그 나이까지 쌓인 몫입니다',
    '월급은 30~34세로 묶인 값입니다',
  ].map((t, i) => `<li style="opacity:${술술(끼(8.7 + i * 0.28, 9.1 + i * 0.28)).toFixed(2)};
      transform:translateX(${(1 - 술술(끼(8.7 + i * 0.28, 9.15 + i * 0.28))) * 40}px)">${t}</li>`).join('');

  /* ⑤ 11.4–14  끝 */
  const 끝 = 술술(끼(11.4, 11.9));
  const 끝맥 = 1 + Math.sin(초 * 5) * 0.012 * 끝;
  const 밝기 = 6 + 초 * 0.5;

  const 놓기 = (x, y, 속) => `<div class="곰" style="left:${x}px;top:${y}px">${속}</div>`;
  const 곰 = (() => {
    if (초 < 1.8) {
      const 뜸 = 툭(끼(0.25, 0.8));
      return 놓기(852, 360 + (1 - 뜸) * 140, 곰곰이(초, { 크기: 1.05 * 뜸, 기분: '놀람' }));
    }
    /* ⚠ 표 밖(아래)에 둔다. 종로 영상에서 곰곰이가 이름 넷을 가렸다 */
    if (초 < 6.8) return 놓기(880, 1430, 곰곰이(초, { 크기: 0.8, 기분: '셈' }));
    if (초 < 8.2) return 놓기(160, 1430, 곰곰이(초, { 크기: 0.85, 기분: '가리킴' }));
    if (초 < 11.3) return 놓기(872, 1690, 곰곰이(초, { 크기: 0.85, 기분: '멀뚱' }));
    return '';
  })();
  const 끝곰 = 초 >= 11.3 ? 곰곰이(초, { 크기: 1.6 * 술술(끼(11.4, 12.0)), 기분: '인사' }) : '';

  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;overflow:hidden;position:relative;
         background:radial-gradient(120% 80% at 50% 12%, hsl(42 38% ${밝기 + 5}%), hsl(220 22% ${밝기}%) 70%);
         font-family:'Pretendard','Noto Sans KR','Malgun Gothic',sans-serif;color:#f3f1ea}
    .판{position:absolute;inset:0;padding:130px 84px}
    .큰수{position:absolute;left:84px;right:84px;top:180px;text-align:center;
          transform:scale(${(0.72 + 0.28 * 큰수등장).toFixed(3)});opacity:${큰수등장.toFixed(2)}}
    .큰수 b{font-size:210px;font-weight:900;letter-spacing:-.05em;line-height:.9;
            color:#f0c85a;text-shadow:0 10px 60px rgba(240,200,90,.28);display:block}
    .큰수 .단위{font-size:96px;font-weight:800;color:#f0c85a;opacity:.85}
    .큰수 .밑{margin-top:26px;font-size:46px;white-space:nowrap;font-weight:700;color:#e9e6dd;
             opacity:${밑말.toFixed(2)};transform:translateY(${((1 - 밑말) * 26).toFixed(1)}px)}
    .큰수 .잔{margin-top:12px;font-size:32px;color:#9aa3b2;opacity:${밑말.toFixed(2)}}
    .표{position:absolute;left:84px;right:84px;top:660px;opacity:${표나옴.toFixed(2)};
        transform:translateY(${((1 - 표나옴) * 40).toFixed(1)}px)}
    .줄{display:flex;align-items:center;gap:24px;margin-bottom:34px}
    .이름{width:120px;font-size:38px;font-weight:800;color:#98a1b0;text-align:right;white-space:nowrap}
    .짝{flex:1;display:flex;flex-direction:column;gap:14px}
    .한칸{display:flex;align-items:center;gap:16px;height:40px}
    .막대{height:26px;border-radius:13px;flex:0 0 auto}
    .막대.남{background:linear-gradient(90deg,#3f5c8a,#6d8fc4)}
    .막대.여{background:linear-gradient(90deg,#7a5b8c,#b18ac4)}
    .줄.켬 .막대.남{background:linear-gradient(90deg,#c9973a,#f0c85a)}
    .줄.켬 .막대.여{background:linear-gradient(90deg,#d8a94e,#f7dc94)}
    .줄.켬 .이름{color:#f0c85a}
    .값{font-size:30px;color:#c9cfd9;font-variant-numeric:tabular-nums;white-space:nowrap}
    .짚{position:absolute;left:84px;right:84px;top:1180px;text-align:center;opacity:${짚음.toFixed(2)}}
    .짚 .ㅁ{font-size:40px;font-weight:800;color:#f0c85a}
    .짚 .ㅇ{margin-top:14px;font-size:32px;color:#c9cfd9}
    .없{position:absolute;left:84px;right:84px;top:1500px;opacity:${없는것.toFixed(2)}}
    .없 h3{font-size:40px;font-weight:800;color:#f0c85a;margin-bottom:18px}
    .없 li{list-style:none;font-size:32px;line-height:1.5;color:#cdd4de;margin-bottom:8px}
    .곰{position:absolute;pointer-events:none;transform:translate(-50%,-50%);
         filter:drop-shadow(0 16px 36px rgba(0,0,0,.42))}
    .곰 svg{display:block}
    .끝 svg{filter:drop-shadow(0 18px 42px rgba(0,0,0,.5));margin-bottom:6px}
    .끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:26px;opacity:${끝.toFixed(2)};
        background:radial-gradient(70% 50% at 50% 45%, rgba(12,14,20,.94), rgba(12,14,20,.99));
        transform:scale(${끝맥.toFixed(4)})}
    .끝 .ㅈ{font-size:56px;font-weight:800;color:#e9e6dd}
    .끝 .ㅅ{font-size:70px;font-weight:900;color:#f0c85a;letter-spacing:-.02em}
    .끝 .ㄱ{font-size:30px;color:#9aa3b2;text-align:center;line-height:1.5}
  </style>
  <div class="판">
    <div class="큰수">
      <b>${큰수값}<span class="단위">%</span></b>
      <div class="밑">서른둘에 사람들은, 결혼했을까요 아직일까요</div>
      <div class="잔">서른둘까지 초혼을 한 남자입니다. 여자는 ${누적.아내}%</div>
    </div>
    <div class="표">${줄들}</div>
    <div class="짚">
      <div class="ㅁ">서른둘 — 남자 ${누적.남편}% · 여자 ${누적.아내}%</div>
      <div class="ㅇ">같은 띠(${일.띠말})의 월급여 ${일.월급} · 근속 ${일.근속}년</div>
    </div>
    <div class="없">
      <h3>여기에 없는 것</h3>
      <ul>${없는줄}</ul>
    </div>
    ${곰}
  </div>
  <div class="끝">
    ${끝곰}
    <div class="ㅈ">서른둘의 다른 숫자도</div>
    <div class="ㅅ">100yearmap.com</div>
    <div class="ㄱ">초혼 ${총건.toLocaleString()}건 · 국가데이터처 초혼부부의 연령별 혼인 ${2025}<br>임금 — 고용노동부<br>백년지도 · 대학 다음까지</div>
  </div>`;
}

/* ── 검사 — 🔴 **화면 글자와 근거 표를 맞대 본다** ─────────────────── */
/**
 * ⛔ 깃발이 `--selftest` 가 아니라 **`--자가시험`** 이다.
 *   `gomgomi.mjs` 가 import 되는 순간 자기 `--selftest` 를 돌고 `process.exit` 한다.
 *   내가 같은 깃발을 쓰면 **내 시험이 한 번도 안 돌고** 초록만 보게 된다(종로 영상에서 겪었다).
 */
export const 숫자캐기 = (글) => (String(글).match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((s) => Number(s.replace(/,/g, '')));
/** 화면 글자만 남긴다 — 태그·스타일 안의 수(좌표·색·초)는 화면에 안 보인다 */
export const 보이는글 = (h) =>
  String(h).replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ');

if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)?.slice(0, 200)}`); }
  };
  const 중간 = 칸HTML(7.6);
  const 끝판 = 칸HTML(13.0);
  const 없판 = 칸HTML(10.0);

  재본다('① 자료가 비어 있지 않다', [누적?.남편, 일?.월급], (a) => a[0] > 0 && !!a[1]);
  재본다('② 큰 수가 화면에 그대로 뜬다', 중간, (h) => h.includes(`<b>${누적.남편.toFixed(1)}<span class="단위">%</span>`));
  재본다('③ 세 나이 줄이 다 있다', (중간.match(/class="줄/g) ?? []).length, 사다리.length);
  재본다('④ 사다리가 나이 순이다', 사다리.map((r) => r.나이), (a) => a.every((v, i) => i === 0 || a[i - 1] < v));
  재본다('⑤ 누적이 나이 따라 커진다', 사다리.map((r) => r.남편), (a) => a.every((v, i) => i === 0 || a[i - 1] < v));
  재본다('⑥ 지면이 있는 나이만 쓴다', 사다리.map((r) => r.나이), (a) => a.every((n) => 낼나이.includes(n)));
  재본다('⑦ 월급·근속이 화면에 있다', 중간, (h) => h.includes(일.월급) && h.includes(`근속 ${일.근속}년`));
  재본다('⑧ 묶인 띠를 그 자리에 적는다', 중간, (h) => h.includes(일.띠말));

  /* 🔴 이 시험이 이 자의 전부다 — 화면의 수가 근거에 다 있나 */
  const 근거수 = new Set(근거.map((g) => g.수));
  const 못댄것 = [];
  for (const 판 of [칸HTML(0.4), 칸HTML(2.0), 중간, 없판, 끝판]) {
    for (const n of 숫자캐기(보이는글(판))) if (!근거수.has(n)) 못댄것.push(n);
  }
  재본다(`⑨ 🔴 화면의 수가 전부 근거에 있다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length, 0);
  재본다('⑩ 근거마다 지면 주소가 있다', 근거, (a) => a.every((g) => /^https:\/\/100yearmap\.com/.test(g.지면)));

  /* ⛔ 안 쓰기로 한 말 */
  const 온글 = 보이는글(중간 + 없판 + 끝판);
  재본다('⑪ ⛔ 「해야 한다」가 없다', 온글, (h) => !/해야 한다|해야합니다|하셔야/.test(h));
  재본다('⑫ ⛔ 「늦었다·이르다」가 없다', 온글, (h) => !/늦었|이릅|이르다|서둘/.test(h));
  재본다('⑬ ⛔ 「평균 결혼 나이」로 안 쓴다', 온글, (h) => !/평균 결혼|평균결혼|결혼 적령/.test(h));
  재본다('⑭ ⛔ 「몇 위·상위」가 없다', 온글, (h) => !/몇 위|순위|상위|등수/.test(h));
  재본다('⑮ ⚠ 재혼이 빠진 것을 화면에 적는다', 없판, (h) => h.includes('재혼은 빠져'));
  재본다('⑯ 출처가 끝 화면에 있다', 끝판, (h) => h.includes('국가데이터처') && h.includes('고용노동부'));
  재본다('⑰ 멈춘 화면이 아니다', [칸HTML(13.0), 칸HTML(13.1)], (x) => x[0] !== x[1]);
  재본다('⑱ 첫 0.4초에 수가 이미 있다', 칸HTML(0.4), (h) => /class="큰수"/.test(h));

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  console.log(`   서른둘 — 초혼 누적 남 ${누적.남편}% · 여 ${누적.아내}% · ${일.띠말} 월급여 ${일.월급} · 근속 ${일.근속}년`);
  console.log(`   근거 ${근거.length}줄 · 모두 ${집}/age/… 에 있다`);
  process.exit(실패 ? 1 : 0);
}

/* ── 뽑기 ── */
const i = process.argv.indexOf('--out');
const 낼길 = i >= 0 ? process.argv[i + 1] : '서른둘.mp4';
const 임시 = path.join(path.dirname(낼길), '_칸age32');
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
