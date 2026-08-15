#!/usr/bin/env node
/**
 * `@100yearmap` 8/15 영상 — **직업계고를 나오면 바로 일터로 갈까요** (14초 쇼츠).
 *
 *   node scripts/make-video-100y-voc.mjs --자가시험
 *   node scripts/make-video-100y-voc.mjs --out 직업계고진학.mp4
 *
 * ## 🔴 왜 이 거리인가
 *
 *   ① 사장님 지시(8/14) — 「카드·카드뉴스·숏동영상은 **하루에 하나씩 만들어 배포까지 완료**」
 *   ② **개봉날 영상**이다. 우리가 무엇을 뒤집는 곳인지 한 번에 보이는 수여야 한다.
 *   ③ 「직업계고 = 취업, 일반고 = 대학」이 사람들 머릿속의 갈래다.
 *      그런데 **직업계고 졸업자 100명 중 49명이 대학에 간다.** 절반이다.
 *      ⭐ 「대학은 100년 중 한 점」이라는 우리 말과 정확히 같은 자리를 짚는다 —
 *        길은 갈라지지 않았고, 우리가 갈라져 있다고 믿었을 뿐이다.
 *
 * ## ⛔ 조심한 것
 *
 *   ⚠ **진학률과 취업률을 더하면 안 된다.** 분모가 다르다 —
 *     진학률 = 진학자 ÷ 졸업자.  취업률 = 취업자 ÷ (졸업자 − 진학자 − 입대자 − 제외인정자).
 *     그래서 49.2 + 55.2 = 104.4 가 나온다. 화면에 둘을 나란히 놓지 않는다.
 *     ⭐ **진학률 하나만** 놓고 간다.
 *   ⚠ 예술계열은 졸업자 28명이다. **최소분모 30을 못 넘는다.** 화면에서 뺀다.
 *   ⛔ 「그러니 대학에 가라」·「가지 마라」를 쓰지 않는다. 우리가 정할 자격이 없다.
 *
 * ⛔ 화면의 수는 전부 `voc-series-outcomes.json` 에서 온다. 손으로 안 박는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { 숫자캐기, 다짐줄지우기 } from './lib/재기-공통.mjs';

/* ⚠ new URL(...).pathname 은 한글 폴더를 %EC.. 로 바꾼다 */
const 여기 = fileURLToPath(new URL('..', import.meta.url));

export const 초당 = 30;
export const 폭 = 1080, 높 = 1920;
export const 총초 = 14;
/** ⛔ 최소분모. 30을 못 넘는 계열은 화면에 안 올린다 — 예술계열 28명이 여기 걸린다 */
export const 최소분모 = 30;

const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/voc-series-outcomes.json'), 'utf8'));

export const 총계 = 자료.통계.총계;
/** 화면에 올릴 계열 — 졸업자가 많은 순으로 다섯. ⛔ 등수가 아니라 **큰 갈래부터** 보이려는 것이다 */
export const 줄들 = 자료.자료
  .filter((r) => r.졸업자 >= 최소분모 && typeof r.진학률 === 'number')
  .sort((a, b) => b.졸업자 - a.졸업자)
  .slice(0, 5)
  .map((r) => ({ 계열: r.계열, 진학률: r.진학률, 졸업자: r.졸업자 }));

export const 제일높은곳 = 줄들.reduce((a, b) => (b.진학률 > a.진학률 ? b : a));
/** ⛔ 최소분모에 걸려 뺀 것 — 몇 갈래를 왜 뺐는지 우리가 안다 */
export const 뺀것 = 자료.자료.filter((r) => r.졸업자 < 최소분모 || typeof r.진학률 !== 'number');

const 집 = 'https://100yearmap.com';
/** 🔴 화면에 뜨는 수마다 **그 수가 있는 지면** */
export const 근거 = [
  { 수: 총계.진학률, 뜻: '직업계고 졸업자 진학률', 지면: `${집}/work` },
  { 수: Math.round(총계.진학률), 뜻: '진학률 반올림(큰 수 자리)', 지면: `${집}/work` },
  { 수: 총계.졸업자, 뜻: '직업계고 졸업자', 지면: `${집}/work` },
  ...줄들.flatMap((r) => [
    { 수: r.진학률, 뜻: `${r.계열}계열 진학률`, 지면: `${집}/work` },
    { 수: Math.round(r.진학률), 뜻: `${r.계열}계열 진학률 반올림`, 지면: `${집}/work` },
    { 수: r.졸업자, 뜻: `${r.계열}계열 졸업자`, 지면: `${집}/work` },
  ]),
  { 수: 100, 뜻: '100명 가운데 — 세는 단위', 지면: `${집}/work` },
  { 수: 2025, 뜻: '자료 해', 지면: `${집}/work` },
];

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
/** 막대 — 100% 를 폭의 62% 까지만. ⚠ 종로 영상에서 100%로 폈다가 값 글자가 화면 밖으로 나갔다 */
export const 자리 = (백분율) => (백분율 / 100) * 62;

const 금지말 = ['가야 한다', '가지 마', '해야 한다', '늦었다', '등수', '순위', '1등', '상위', '꼴찌', '유리하다', '불리하다'];

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.4 — 첫 화면에 「49명」 */
  const 큰수등장 = 툭(끼(0.0, 0.5));
  const 큰수값 = Math.round(총계.진학률 * 술술(끼(0.1, 1.0)));
  const 밑말 = 술술(끼(0.8, 1.4));

  /* ② 1.8–7.0 — 다섯 계열이 자란다 */
  const 표나옴 = 술술(끼(1.8, 2.3));
  const 칸들 = 줄들.map((r, i) => {
    const 시작 = 2.05 + i * 0.32;
    const 자람 = 술술(끼(시작, 시작 + 0.8));
    const 켬 = 초 > 7.2 && r.계열 === 제일높은곳.계열 ? ' 켬' : '';
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    return `<div class="줄${켬}">
      <span class="이름">${r.계열}</span>
      <span class="한칸"><span class="막대" style="width:${(자리(r.진학률) * 자람).toFixed(2)}%"></span><span class="값" style="opacity:${보임}">${r.진학률}%</span></span>
      <span class="곁" style="opacity:${보임}">졸업 ${r.졸업자.toLocaleString()}명</span>
    </div>`;
  }).join('');

  /* ③ 9.2– 마무리 */
  const 맺음 = 술술(끼(9.2, 10.0));

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:132px 84px}
  .큰수{font-size:190px;font-weight:800;letter-spacing:-6px;line-height:1;
        transform:scale(${(0.86 + 0.14 * 큰수등장).toFixed(3)});transform-origin:left center;opacity:${큰수등장.toFixed(2)}}
  .단위{font-size:74px;font-weight:700;margin-left:10px;color:#c9a84c}
  .물음{margin-top:30px;font-size:52px;font-weight:700;line-height:1.35;opacity:${밑말.toFixed(2)};
        transform:translateY(${(18 * (1 - 밑말)).toFixed(1)}px)}
  .갈래{margin-top:74px;font-size:34px;color:#9a9aa6;letter-spacing:1px}
  .표{margin-top:22px;opacity:${표나옴.toFixed(2)}}
  .줄{display:flex;align-items:center;gap:20px;margin-bottom:38px}
  .줄.켬 .막대{background:#c9a84c}
  .줄.켬 .이름{color:#c9a84c}
  .이름{width:190px;font-size:40px;font-weight:700;color:#b9b9c4}
  .한칸{flex:1;display:flex;align-items:center;gap:16px}
  .막대{height:26px;background:#5b6480;border-radius:13px;display:inline-block}
  .값{font-size:40px;font-weight:700;white-space:nowrap}
  .곁{width:270px;font-size:28px;color:#9a9aa6;white-space:nowrap}
  .맺음{position:absolute;left:84px;bottom:140px;font-size:40px;line-height:1.5;
        opacity:${맺음.toFixed(2)};transform:translateY(${(16 * (1 - 맺음)).toFixed(1)}px)}
  .주소{color:#c9a84c;font-size:38px}
  .꼬리{position:absolute;left:84px;bottom:62px;font-size:26px;color:#7d7d8a}
  </style></head><body><div class="판">
    <div class="큰수">${큰수값}<span class="단위">명</span></div>
    <div class="물음">직업계고를 나온 100명 가운데<br/>대학에 간 사람입니다.</div>
    <!-- 🔴 이 한 줄이 꼭 있어야 한다. 없으면 「실업」이 **실업(失業)**으로 읽힌다.
         14초짜리라 손님이 되물을 틈이 없다. 계열 이름임을 화면이 먼저 말해 준다 -->
    <div class="갈래" style="opacity:${표나옴.toFixed(2)}">계열별로 보면</div>
    <div class="표">${칸들}</div>
    <div class="맺음">길은 갈라지지 않았습니다<br/><span class="주소">100yearmap.com/work</span></div>
    <div class="꼬리">2025년 · 직업계고 졸업자 취업통계 · 등수를 매기지 않습니다</div>
  </div></body></html>`;
}

/* ── 자가시험 ────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 조건) => 결과.push({ 이름, 됐나: !!조건 });

  본다('① 다섯 계열을 쓴다', 줄들.length === 5);
  본다('② 🔴 최소분모 30을 못 넘는 계열은 뺀다 — 예술(28명)',
    !줄들.some((r) => r.졸업자 < 최소분모) && 뺀것.some((r) => r.계열 === '예술'));
  본다('③ 값을 다 읽었다', 줄들.every((r) => r.진학률 > 0 && r.졸업자 > 0));
  본다('④ 막대가 62%를 안 넘는다', 줄들.every((r) => 자리(r.진학률) <= 62.0001));
  본다('⑤ 술술·툭이 0~1 을 지킨다', 술술(0) === 0 && 술술(1) === 1 && 툭(0) === 0 && 툭(1) === 1);

  /* 🔴 이 영상의 핵심 조심 — 두 비율은 분모가 달라 **더하면 안 된다** */
  const 온글 = 칸HTML(12);
  본다('⑥ 🔴 취업률을 같이 안 올린다 — 분모가 달라 더해지면 104%가 된다',
    !온글.includes(String(총계.취업률)) && !/취업률/.test(온글));

  const 근거수 = new Set(근거.map((g) => g.수));
  const 못댄것 = [];
  /* ⚠ **자라는 중의 수는 근거가 아니다.** 움직임이 멈춘 뒤(9초부터)만 잰다 */
  for (let f = 9 * 초당; f < 총초 * 초당; f += 5) {
    for (const n of 숫자캐기(칸HTML(f / 초당))) if (!근거수.has(n)) 못댄것.push(n);
  }
  본다(`⑦ 다 자란 뒤 화면의 수가 전부 근거에 있다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 5).join(' · ')}` : ''}`,
    못댄것.length === 0);

  /* ⚠ 금지말은 «다짐 줄을 지운 글»로, 주소는 «원래 글»로 본다 */
  const 민글 = 온글.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ');
  const 걸린말 = 금지말.filter((w) => 다짐줄지우기(민글).includes(w));
  본다(`⑧ 금지말이 없다${걸린말.length ? ` — ${걸린말.join(' · ')}` : ''}`, 걸린말.length === 0);
  본다('⑨ 데려올 주소가 있다', 민글.includes('100yearmap.com/work'));
  본다('⑩ 첫 0.5초에 큰 수가 보인다', 숫자캐기(칸HTML(0.5)).length > 0);
  본다('⑪ 「길은 갈라지지 않았습니다」로 맺는다', 민글.includes('길은 갈라지지 않았습니다'));
  /* 🔴 「실업」이 실업(失業)으로 읽히지 않게 — 계열 이름임을 화면이 먼저 말한다 */
  본다('⑫ 🔴 「계열별로 보면」이 표 위에 있다', 민글.includes('계열별로 보면'));

  for (const r of 결과) console.log((r.됐나 ? '  ✅ ' : '  ❌ ') + r.이름);
  const 진 = 결과.filter((r) => !r.됐나).length;
  console.log(`자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

/* 🔴 2026-08-16 — 여기부터가 «부르면 도는 몸»이다. 재려고 import 했다가
   이 자가 곧바로 렌더링을 시작해 영상을 다시 만들어 버렸다(puppeteer 가 떴다).
   ⇒ **내가 직접 불렸을 때만** 돈다. 남이 불러 화면 글만 얻어 갈 수 있게 한다.
   ⚠ `import.meta.url === file://…` 로 견주면 윈도에서 조용히 안 돈다. 파일 이름으로 견딘다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-voc.mjs';
if (내가직접불렸나) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  if (!자가시험()) { console.log('⛔ 자가시험이 막았다. 영상을 만들지 않는다'); process.exit(1); }

  const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '직업계고진학.mp4';
  const 낼곳 = path.join(여기, 'public/100y/video');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(여기, 'out', '_칸-voc');
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
    await 브라우저.close();   // ⛔ 사장님 크롬 창은 안 건드린다
  }

  const 갖다 = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
  const ff = 갖다('ffmpeg-static');
  execFileSync(ff, [
    '-y', '-framerate', String(초당), '-i', path.join(칸방, '%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20',
    path.join(낼곳, 낼이름),
  ], { stdio: 'inherit' });

  fs.rmSync(칸방, { recursive: true, force: true });
  const 크기 = fs.statSync(path.join(낼곳, 낼이름)).size;
  console.log(`\n✅ ${낼이름} · ${(크기 / 1024 / 1024).toFixed(1)}MB · ${총초}초 · ${폭}×${높}`);
  console.log('⭐ public/100y/video/ 에 냈다 — **빌드하면 그대로 배포된다**(out/ 은 안 실린다)');
  console.log('🔴 ⛔ videos.json 에 줄을 넣어야 지면에 실린다. 8/14 에 그걸 빼먹어 파일만 나갔다');

}
