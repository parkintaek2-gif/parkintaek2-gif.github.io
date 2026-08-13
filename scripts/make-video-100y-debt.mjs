#!/usr/bin/env node
/**
 * `@100yearmap` 오늘 영상 — **빚이 있는 집은 몇 집인가** (14초 쇼츠 · 20대~60대).
 *
 *   node scripts/make-video-100y-debt.mjs --자가시험
 *   node scripts/make-video-100y-debt.mjs --out 빚있는집.mp4
 *
 * ## 🔴 왜 이 거리인가
 *
 *   ① 사장님 지시(8/14) — 「카드·카드뉴스·숏동영상은 **하루에 하나씩 만들어 배포까지 완료**」
 *   ② 8/13 에 **지면에서 고친 바로 그 결**이다. 「부채 가운데값」이 두 배로 부풀려 읽히던 것을
 *      「**빚이 있는 집만** 놓고 잰 한가운데」로 고쳤다. 그 사실 자체가 영상거리다
 *   ③ 나이 폭 — 앞선 셋이 10대·30대·40후반~60대였다. 이건 **20대부터 60대까지** 한 화면에 놓는다
 *
 * ## 🔴 이 영상이 말하는 것 — **가운데값보다 «몇 집이냐」가 먼저다**
 *
 *   29세 이하 빚 한가운데는 7,000만원이다. 그런데 **빚이 있는 집이 절반뿐**이다.
 *   나머지 절반은 0원인데 그 집들은 이 셈에 없다. 그래서 「스물아홉에 빚 7천」으로 읽으면 틀린다.
 *   ⛔ 「빚을 줄여라」·「위험하다」고 말하지 않는다. 우리가 정할 자격이 없다.
 *
 * ⛔ 화면의 수는 전부 `age-axis.json` 에서 온다. 손으로 안 박는다.
 * ⭐ 재는 자(본문만·숫자캐기·다짐줄지우기)는 `scripts/lib/재기-공통.mjs` 에서 가져온다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { 숫자캐기, 다짐줄지우기 } from './lib/재기-공통.mjs';

const 여기 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

export const 초당 = 30;
export const 폭 = 1080, 높 = 1920;
export const 총초 = 14;

const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/age-axis.json'), 'utf8'));

/** ⛔ 서로 겹치지 않는 다섯 띠만 쓴다(39세 이하·65세 이상은 다른 띠와 겹친다 — 8/13 에 쟀다) */
export const 띠들 = ['29세 이하', '30~39세', '40~49세', '50~59세', '60세 이상'];

export const 줄들 = 띠들.map((띠) => ({
  띠,
  띠말: 띠,
  빚있는집: Math.round(자료.살림[띠].부채_가진집비율),
  빚중앙: Math.round(자료.살림[띠].부채_보유가구중앙),
}));
export const 제일적은곳 = 줄들.reduce((a, b) => (b.빚있는집 < a.빚있는집 ? b : a));
export const 첫띠 = 줄들[0];

const 집 = 'https://100yearmap.com';
/** 🔴 화면에 뜨는 수마다 **그 수가 있는 지면** */
export const 근거 = [
  ...줄들.flatMap((r) => [
    { 수: r.빚있는집, 뜻: `${r.띠말} 100집 중 빚이 있는 집`, 지면: `${집}/life/50대` },
    { 수: r.빚중앙, 뜻: `${r.띠말} 빚 한가운데(빚 있는 집만)`, 지면: `${집}/life/50대` },
    ...String(r.띠).match(/\d+/g).map((n) => ({ 수: Number(n), 뜻: `띠 이름의 나이 ${n}`, 지면: `${집}/life/50대` })),
  ]),
  { 수: 100, 뜻: '100집 가운데 — 세는 단위', 지면: `${집}/life/50대` },
  { 수: 2025, 뜻: '자료 해', 지면: `${집}/life/50대` },
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

const 금지말 = ['빚을 줄이', '위험하다', '해야 한다', '늦었다', '등수', '순위', '1등', '상위', '꼴찌', '평균 빚'];

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);

  /* ① 0.0–2.4 — 첫 화면에 「50집」. 제일 센 수가 먼저 */
  const 큰수등장 = 툭(끼(0.0, 0.5));
  const 큰수값 = Math.round(첫띠.빚있는집 * 술술(끼(0.1, 1.0)));
  const 밑말 = 술술(끼(0.8, 1.4));

  /* ② 1.8–7.0 — 다섯 띠가 자란다 */
  const 표나옴 = 술술(끼(1.8, 2.3));
  const 칸들 = 줄들.map((r, i) => {
    const 시작 = 2.05 + i * 0.32;
    const 자람 = 술술(끼(시작, 시작 + 0.8));
    const 켬 = 초 > 7.2 && r.띠 === 제일적은곳.띠 ? ' 켬' : '';
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    return `<div class="줄${켬}">
      <span class="이름">${r.띠말}</span>
      <span class="한칸"><span class="막대" style="width:${(자리(r.빚있는집) * 자람).toFixed(2)}%"></span><span class="값" style="opacity:${보임}">${r.빚있는집}집</span></span>
      <span class="곁" style="opacity:${보임}">빚 한가운데 ${r.빚중앙.toLocaleString()}만원</span>
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
  .표{margin-top:80px;opacity:${표나옴.toFixed(2)}}
  .줄{display:flex;align-items:center;gap:20px;margin-bottom:38px}
  .줄.켬 .막대{background:#c9a84c}
  .줄.켬 .이름{color:#c9a84c}
  .이름{width:200px;font-size:40px;font-weight:700;color:#b9b9c4}
  .한칸{flex:1;display:flex;align-items:center;gap:16px}
  .막대{height:26px;background:#5b6480;border-radius:13px;display:inline-block}
  .값{font-size:40px;font-weight:700;white-space:nowrap}
  .곁{width:300px;font-size:28px;color:#9a9aa6;white-space:nowrap}
  .맺음{position:absolute;left:84px;bottom:140px;font-size:40px;line-height:1.5;
        opacity:${맺음.toFixed(2)};transform:translateY(${(16 * (1 - 맺음)).toFixed(1)}px)}
  .주소{color:#c9a84c;font-size:38px}
  .꼬리{position:absolute;left:84px;bottom:62px;font-size:26px;color:#7d7d8a}
  </style></head><body><div class="판">
    <div class="큰수">${큰수값}<span class="단위">집</span></div>
    <div class="물음">스물아홉 이하, 100집 가운데<br/>빚이 있는 집입니다.</div>
    <div class="표">${칸들}</div>
    <div class="맺음">「빚 한가운데」는 <b>빚이 있는 집만</b> 놓고 잰 값입니다<br/><span class="주소">100yearmap.com/life/50대</span></div>
    <div class="꼬리">2025년 · 가계금융복지조사 · 등수를 매기지 않습니다</div>
  </div></body></html>`;
}

/* ── 자가시험 ────────────────────────────────────────────── */
function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 조건) => 결과.push({ 이름, 됐나: !!조건 });

  본다('① 겹치지 않는 다섯 띠만 쓴다',
    줄들.length === 5 && !띠들.includes('39세 이하') && !띠들.includes('65세 이상'));
  본다('② 값을 다 읽었다', 줄들.every((r) => r.빚있는집 > 0 && r.빚중앙 > 0));
  본다('③ 제일 적은 곳이 60세 이상이다', 제일적은곳.띠 === '60세 이상');
  본다('④ 막대가 62%를 안 넘는다', 줄들.every((r) => 자리(r.빚있는집) <= 62.0001));
  본다('⑤ 술술·툭이 0~1 을 지킨다', 술술(0) === 0 && 술술(1) === 1 && 툭(0) === 0 && 툭(1) === 1);

  const 근거수 = new Set(근거.map((g) => g.수));
  const 못댄것 = [];
  for (let f = 9 * 초당; f < 총초 * 초당; f += 5) {
    for (const n of 숫자캐기(칸HTML(f / 초당))) if (!근거수.has(n)) 못댄것.push(n);
  }
  본다(`⑥ 다 자란 뒤 화면의 수가 전부 근거에 있다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 5).join(' · ')}` : ''}`,
    못댄것.length === 0);

  /* ⚠ 금지말은 «다짐 줄을 지운 글»로, 주소는 «원래 글»로 본다.
     8/14 에 다짐줄지우기 가 같은 줄의 주소까지 지워 헛경보가 났다 */
  const 민글 = 칸HTML(12).replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ');
  const 걸린말 = 금지말.filter((w) => 다짐줄지우기(민글).includes(w));
  본다(`⑦ 금지말이 없다${걸린말.length ? ` — ${걸린말.join(' · ')}` : ''}`, 걸린말.length === 0);
  본다('⑧ 데려올 주소가 있다', 민글.includes('100yearmap.com/life'));
  본다('⑨ 「빚 있는 집만」이라고 못 박는다', 민글.includes('빚이 있는 집만'));
  본다('⑩ 첫 0.5초에 큰 수가 보인다', 숫자캐기(칸HTML(0.5)).length > 0);

  for (const r of 결과) console.log((r.됐나 ? '  ✅ ' : '  ❌ ') + r.이름);
  const 진 = 결과.filter((r) => !r.됐나).length;
  console.log(`자가시험 ${결과.length - 진}/${결과.length}`);
  return 진 === 0;
}

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('⛔ 자가시험이 막았다. 영상을 만들지 않는다'); process.exit(1); }

const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '빚있는집.mp4';
const 낼곳 = path.join(여기, 'public/100y/video');
fs.mkdirSync(낼곳, { recursive: true });
const 칸방 = path.join(여기, 'out', '_칸-debt');
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
console.log('⭐ public/100y/video/ 에 냈다 — **빌드하면 그대로 배포된다**(out/ 은 안 실린다)');
