#!/usr/bin/env node
/**
 * `@100yearmap` 오늘 영상 — **월급은 언제 꼭대기인가** (14초 쇼츠 · 50대).
 *
 *   node scripts/make-video-100y-age55.mjs --자가시험
 *   node scripts/make-video-100y-age55.mjs --out 쉰다섯.mp4
 *
 * ## 🔴 왜 이걸 만드나 — **0세에서 100세까지가 우리 대상이다**
 *
 *   사장님: *「왜 자꾸 대입에 머물러있니? 0세에서 100세까지 그걸 다 컨텐츠를 …」*
 *   ```
 *   8/08 영상   종로구 100년 넘은 고등학교   → 10대·학부모
 *   8/09 영상   서른둘의 초혼·월급·근속       → 30대
 *   오늘 영상    월급이 언제 꼭대기인가        → ⭐ **40대 후반~60대**
 *   ```
 *   ⛔ 영상 셋이 다 젊은 쪽이면 습관이 그대로 이긴다.
 *
 * ## ⛔ 수를 손으로 안 박는다 — **화면의 수는 전부 지면에 있는 수다**
 *
 *   2번 규칙 — *「영상에 나오는 숫자마다 그 수가 있는 지면 주소를 적으십시오.
 *   못 대는 숫자는 영상에서 빼십시오」*. 자가시험이 화면 글자에서 **수를 도로 캐내어**
 *   근거에 없으면 거기서 선다.
 *   ⚠ 오늘 카드뉴스 자에서 **주소 안의 숫자(100yearmap 의 100)** 가 걸렸다. 여기서는 먼저 지운다.
 *
 * ## ⚠ 말에서 지키는 것
 *
 *   ```
 *   ⛔ 「내리막」·「끝났다」·「늦었다」   우리가 정할 자격이 없다. 자가시험이 막는다
 *   ⛔ 「평균 월급」만 크게              이건 **다섯 살 묶음의 값**이다. 묶음을 화면에 적는다
 *   ⚠ 근속이 같이 늘어난다              월급만 보면 뜻이 반쪽이다. 같이 보여 준다
 *   ⛔ 등수·순위                        집 규칙이다
 *   ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const 여기 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

export const 초당 = 30;
export const 폭 = 1080, 높 = 1920;
export const 총초 = 14;

/* ── 수는 자료에서 온다. ⛔ 손으로 안 적는다 ─────────────────────── */
const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/age-axis.json'), 'utf8'));

/** 보여 줄 다섯 살 묶음 — 오르막 하나, 꼭대기, 내려오는 둘 */
export const 띠들 = ['25 ~ 29', '35 ~ 39', '45 ~ 49', '55 ~ 59', '60세 ~'];
const 만원 = (천원) => Math.round(천원 / 10);

export const 줄들 = 띠들.map((띠) => ({
  띠,
  띠말: 띠 === '60세 ~' ? '60세부터' : `${띠.replace(/\s/g, '')}세`,
  월급: 만원(자료.임금[띠].월급여천원),
  근속: 자료.임금[띠].근속년,
  사람: 자료.임금[띠].사람,
}));

export const 꼭대기 = 줄들.reduce((a, b) => (b.월급 > a.월급 ? b : a));
export const 마지막 = 줄들[줄들.length - 1];
export const 전체 = 만원(자료.임금['전체'].월급여천원);

const 집 = 'https://100yearmap.com';
/** 🔴 화면에 뜨는 수마다 **그 수가 있는 지면** */
export const 근거 = [
  ...줄들.flatMap((r) => [
    { 수: r.월급, 뜻: `${r.띠말} 월급여(만원)`, 지면: `${집}/age` },
    { 수: r.근속, 뜻: `${r.띠말} 평균 근속(년)`, 지면: `${집}/age` },
    ...String(r.띠).match(/\d+/g).map((n) => ({ 수: Number(n), 뜻: `띠 이름의 나이 ${n}`, 지면: `${집}/age` })),
  ]),
  { 수: 전체, 뜻: '전체 월급여(만원)', 지면: `${집}/age` },
  { 수: 2025, 뜻: '자료 해', 지면: `${집}/age` },
];

/* ── 움직임 ──────────────────────────────────────────────────── */
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

/** 막대 길이 — 제일 큰 값을 폭의 **62%** 까지만 편다(값 글자가 화면 밖으로 나가지 않게) */
export const 자리 = (월급) => (월급 / 꼭대기.월급) * 62;

/* ⭐ 8/14 — 여기서 따로 짓지 않는다. **재기-공통** 에서 가져온다.
   같은 흠(주소·<style> 속 수, 우리 다짐을 위반으로 읽기)을 오늘만 아홉 번 냈다 */
export { 숫자캐기, 다짐줄지우기, 본문만 } from './lib/재기-공통.mjs';
import { 숫자캐기, 다짐줄지우기 } from './lib/재기-공통.mjs';

/** 이 영상에서만 더 막는 말 (집 규칙은 재기-공통의 금지말이 본다) */
const 금지말 = ['내리막', '끝났다', '늦었다', '이르다', '해야 한다', '등수', '순위', '1등', '상위', '꼴찌'];

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.4  「468만원」이 박힌다 — 첫 0.4초에 제일 센 수 */
  const 큰수등장 = 툭(끼(0.0, 0.5));
  const 큰수값 = Math.round(꼭대기.월급 * 술술(끼(0.1, 1.0)));
  const 밑말 = 술술(끼(0.8, 1.4));

  /* ② 1.8–7.0  다섯 띠가 나이 순으로 자란다 */
  const 표나옴 = 술술(끼(1.8, 2.3));
  const 칸들 = 줄들.map((r, i) => {
    const 시작 = 2.05 + i * 0.32;
    const 자람 = 술술(끼(시작, 시작 + 0.8));
    const 켬 = 초 > 7.2 && r.띠 === 꼭대기.띠 ? ' 켬' : '';
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    return `<div class="줄${켬}">
      <span class="이름">${r.띠말}</span>
      <span class="한칸"><span class="막대" style="width:${(자리(r.월급) * 자람).toFixed(2)}%"></span><span class="값" style="opacity:${보임}">${r.월급}만원</span></span>
      <span class="근속" style="opacity:${보임}">근속 ${r.근속}년</span>
    </div>`;
  }).join('');

  /* ③ 9.4–  마무리 — 데려올 주소 */
  const 맺음 = 술술(끼(9.4, 10.2));

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:132px 84px}
  .큰수{font-size:190px;font-weight:800;letter-spacing:-6px;line-height:1;
        transform:scale(${(0.86 + 0.14 * 큰수등장).toFixed(3)});transform-origin:left center;opacity:${큰수등장.toFixed(2)}}
  .단위{font-size:74px;font-weight:700;margin-left:10px;color:#c9a84c}
  .물음{margin-top:34px;font-size:56px;font-weight:700;line-height:1.35;opacity:${밑말.toFixed(2)};
        transform:translateY(${(18 * (1 - 밑말)).toFixed(1)}px)}
  .표{margin-top:96px;opacity:${표나옴.toFixed(2)}}
  .줄{display:flex;align-items:center;gap:22px;margin-bottom:40px}
  .줄.켬 .막대{background:#c9a84c}
  .줄.켬 .이름{color:#c9a84c}
  .이름{width:210px;font-size:42px;font-weight:700;color:#b9b9c4}
  .한칸{flex:1;display:flex;align-items:center;gap:18px}
  .막대{height:26px;background:#5b6480;border-radius:13px;display:inline-block}
  .값{font-size:40px;font-weight:700;white-space:nowrap}
  .근속{width:190px;font-size:32px;color:#9a9aa6;white-space:nowrap}
  .맺음{position:absolute;left:84px;bottom:150px;font-size:44px;line-height:1.5;
        opacity:${맺음.toFixed(2)};transform:translateY(${(16 * (1 - 맺음)).toFixed(1)}px)}
  .주소{color:#c9a84c;font-size:40px}
  .꼬리{position:absolute;left:84px;bottom:66px;font-size:28px;color:#7d7d8a}
  </style></head><body><div class="판">
    <div class="큰수">${큰수값}<span class="단위">만원</span></div>
    <div class="물음">월급은 언제 가장 많을까요?<br/>그리고 그다음은요?</div>
    <div class="표">${칸들}</div>
    <div class="맺음">다섯 살 묶음 · 2025년<br/><span class="주소">100yearmap.com/age</span></div>
    <div class="꼬리">등수를 매기지 않습니다 · 사람 수는 공시된 값입니다</div>
  </div></body></html>`;
}

/* ── 자가시험 ────────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 조건) => 결과.push({ 이름, 됐나: !!조건 });

  본다('① 다섯 띠를 다 읽었다', 줄들.length === 5 && 줄들.every((r) => r.월급 > 0 && r.근속 > 0));
  본다('② 꼭대기가 45~49 다', 꼭대기.띠 === '45 ~ 49');
  본다('③ 꼭대기 뒤가 내려온다', 마지막.월급 < 꼭대기.월급);
  본다('④ 막대가 62%를 안 넘는다', 줄들.every((r) => 자리(r.월급) <= 62.0001));
  본다('⑤ 술술·툭이 0~1 을 지킨다', 술술(0) === 0 && 술술(1) === 1 && 툭(0) === 0 && 툭(1) === 1);
  본다('⑥ ⛔ 주소 안의 숫자는 안 센다',
    JSON.stringify(숫자캐기('100yearmap.com/age 468만원')) === JSON.stringify([468]));

  /** 🔴 이 시험이 이 자의 전부다 — 화면에 뜨는 수가 근거에 다 있나 */
  /* ⚠ **자라는 중의 수는 근거가 아니다.** 큰 수가 0 → 468 로 세어 올라가므로
     중간 칸에는 96·278·388… 이 뜬다. 손님이 «읽고 기억하는 수»는 **다 자란 뒤**의 것이다.
     그래서 움직임이 멈춘 뒤(9초부터)만 잰다. 처음에 모든 칸을 재다가 헛경보를 냈다. */
  const 근거수 = new Set(근거.map((g) => g.수));
  const 못댄것 = [];
  for (let f = 9 * 초당; f < 총초 * 초당; f += 5) {
    for (const n of 숫자캐기(칸HTML(f / 초당))) if (!근거수.has(n)) 못댄것.push(n);
  }
  본다(`⑦ 다 자란 뒤 화면의 수가 전부 근거에 있다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 5).join(' · ')}` : ''}`,
    못댄것.length === 0);
  본다('⑦-2 자라는 중에는 근거보다 큰 수가 안 나온다',
    숫자캐기(칸HTML(0.6)).every((n) => n <= Math.max(...근거수)));

  /* ⚠ 둘을 갈라 본다.
     금지말은 **다짐 줄을 지운 글**로 봐야 하고(안 그러면 우리 다짐이 위반으로 잡힌다),
     주소는 **원래 글**로 봐야 한다 — 다짐줄지우기 가 「등수를 매기지 않습니다」를 지우면서
     같은 줄에 있던 **주소까지 지웠다**(방금 ⑨ 가 그렇게 걸렸다). */
  const 민글 = 칸HTML(12).replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ');
  const 걸린말 = 금지말.filter((w) => 다짐줄지우기(민글).includes(w));
  본다(`⑧ 금지말이 없다${걸린말.length ? ` — ${걸린말.join(' · ')}` : ''}`, 걸린말.length === 0);
  본다('⑨ 데려올 주소가 있다', 민글.includes('100yearmap.com/age'));
  본다('⑩ 첫 0.5초에 큰 수가 이미 보인다', 숫자캐기(칸HTML(0.5)).length > 0);

  for (const r of 결과) console.log((r.됐나 ? '  ✅ ' : '  ❌ ') + r.이름);
  const 진 = 결과.filter((r) => !r.됐나).length;
  console.log(`자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

/* ── 내기 ────────────────────────────────────────────────────── */
/* 🔴 2026-08-16 — 여기부터가 «부르면 도는 몸»이다. 재려고 import 했다가
   이 자가 곧바로 렌더링을 시작해 영상을 다시 만들어 버렸다(puppeteer 가 떴다).
   ⇒ **내가 직접 불렸을 때만** 돈다. 남이 불러 화면 글만 얻어 갈 수 있게 한다.
   ⚠ `import.meta.url === file://…` 로 견주면 윈도에서 조용히 안 돈다. 파일 이름으로 견딘다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-age55.mjs';
if (내가직접불렸나) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  if (!자가시험()) {
    console.log('⛔ 자가시험이 막았다. 영상을 만들지 않는다');
    process.exit(1);
  }

  const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '월급꼭대기.mp4';
  const 낼곳 = path.join(여기, 'out');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(낼곳, '_칸-age55');
  fs.rmSync(칸방, { recursive: true, force: true });
  fs.mkdirSync(칸방, { recursive: true });

  const { default: puppeteer } = await import(
    'file:///C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
  );
  const 브라우저 = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const 쪽 = await 브라우저.newPage();
    await 쪽.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
    const 총칸 = 총초 * 초당;
    for (let f = 0; f < 총칸; f++) {
      await 쪽.setContent(칸HTML(f / 초당), { waitUntil: 'load' });
      await 쪽.screenshot({ path: path.join(칸방, String(f).padStart(4, '0') + '.png') });
      if (f % 60 === 0) console.log(`  … ${f}/${총칸}`);
    }
  } finally {
    await 브라우저.close();   // ⛔ 사장님 크롬 창은 안 건드린다. 내가 띄운 것만 닫는다
  }

  /* ⚠ 이 기계 PATH 에 ffmpeg 가 없다. 종로 영상 자와 같이 **ffmpeg-static** 을 쓴다
     (그냥 'ffmpeg' 로 부르면 spawnSync ENOENT 로 선다 — 8/13 에 겪었다) */
  const { createRequire } = await import('node:module');
  const 갖다 = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
  const ff = 갖다('ffmpeg-static');

  execFileSync(ff, [
    '-y', '-framerate', String(초당), '-i', path.join(칸방, '%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20',
    path.join(낼곳, 낼이름),
  ], { stdio: 'inherit' });

  fs.rmSync(칸방, { recursive: true, force: true });
  const 크기 = fs.statSync(path.join(낼곳, 낼이름)).size;
  console.log(`\n✅ ${낼이름} · ${(크기 / 1024 / 1024).toFixed(1)}MB · ${총초}초 · ${폭}×${높}`);
  console.log('⚠ 실제로 열어 보고 올린다. 근거는 위 표 그대로 쓴다');

}
