/**
 * make-video-100y-qual.mjs — 숏영상 「자격증은 얼마나 걸릴까요」 14초 · 1080×1920
 *
 * 🔴 왜 — 사장님(2026-08-15) 「목요일 7시까진 **콘텐트만**」 · 「**추측으로 말하기 금지**」.
 *   ⭐ 이 영상은 **밖에서 데려오는 것**이다. 마지막에 주소가 없으면 만들지 않는다.
 *
 * 자료 — src/data/100yearmap/qual-duration.json (build-100y-qual-duration.mjs 가 만든다)
 *   출처: 공공데이터포털 15039800 · 2023년 기준 · **이용허락범위 제한 없음** · 2026-08-15 수집
 *
 * ⛔ 이 영상이 지켜야 하는 말 —
 *   · 등수·순위·「제일 어렵다」를 쓰지 않는다. 등급은 **층**이다
 *   · 「절반은 한 번에 붙는다」로 쓰지 않는다 — 이 수는 **딴 사람들 중**의 비율이다
 *   · 기능장(종목 28)은 «걸린 날»을 안 낸다 — 우리 최소분모 30 미만
 *   · 「3회 이상」이 뭉쳐 있으니 «세 번»이 아니라 **«세 번 넘게»**
 *
 * ⚠ videos.json 에 줄을 넣어야 /video 지면에 실린다. 안 넣으면 파일만 있고 아무도 못 본다
 *   (8/14 에 그렇게 한 번 놓쳤다)
 *
 * 쓰는 법  node scripts/make-video-100y-qual.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = fileURLToPath(new URL('..', import.meta.url));
const 폭 = 1080, 높 = 1920, 초당 = 30, 길이 = 14;
const 집 = 'https://100yearmap.com';

const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/qual-duration.json'), 'utf8'));
/** ⛔ 종목 30 미만은 «걸린 날»을 못 낸다 — 자료가 스스로 말해 준다 */
export const 낼등급 = 자료.등급.filter((g) => g.날을_낼_수_있나);
export const 못낼등급 = 자료.등급.filter((g) => !g.날을_낼_수_있나);
const 제일긴곳 = [...낼등급].sort((a, b) => b.가운데값일 - a.가운데값일)[0];

/** 사람 수로 무게를 준 «한 번에» 비율 — 화면에 쓰는 하나의 수 */
export function 한번에전체(등급들 = 자료.등급) {
  const 분모 = 등급들.reduce((a, g) => a + g.응시분모, 0);
  const 하나 = 등급들.reduce((a, g) => a + (g.한번에 / 100) * g.응시분모, 0);
  return 분모 ? Number(((하나 / 분모) * 100).toFixed(1)) : null;
}
const 한번에 = 한번에전체();

export const 금지말 = ['등수', '순위', '1등', '상위', '꼴찌', '제일 어렵', '가야 한다', '해야 한다', '늦었다'];
/** ⛔ 이 말이 나오면 거짓이 된다 — 「딴 사람들 중」이 빠진 문장 */
export const 거짓말 = ['절반은 한 번에 붙', '절반이 한 번에 붙'];

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}
/** 막대 — 가장 긴 것을 폭의 62%까지만 (값 글자가 화면 밖으로 나가지 않게) */
export const 자리 = (일) => (일 / 제일긴곳.가운데값일) * 62;

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);
  const 머리 = 술술(끼(0.0, 0.6));
  const 표나옴 = 술술(끼(1.6, 2.1));
  const 뒷말 = 술술(끼(8.2, 8.9));
  const 수나옴 = 술술(끼(9.0, 9.8));
  const 맺음 = 술술(끼(11.6, 12.4));

  const 줄들 = 낼등급.map((g, i) => {
    const 시작 = 1.9 + i * 0.34;
    const 자람 = 술술(끼(시작, 시작 + 0.85));
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    const 켬 = 초 > 6.4 && g.등급 === 제일긴곳.등급 ? ' 켬' : '';
    return `<div class="줄${켬}">
      <span class="이름">${g.등급}</span>
      <span class="한칸"><span class="막대" style="width:${(자리(g.가운데값일) * 자람).toFixed(2)}%"></span>
        <span class="값" style="opacity:${보임}">${g.가운데값일.toLocaleString()}일</span></span>
    </div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:150px 84px}
  .물음{font-size:70px;font-weight:800;line-height:1.3;opacity:${머리.toFixed(2)};
        transform:translateY(${(20 * (1 - 머리)).toFixed(1)}px)}
  .갈래{margin-top:70px;font-size:34px;color:#9a9aa6;letter-spacing:1px;opacity:${표나옴.toFixed(2)}}
  .표{margin-top:24px;opacity:${표나옴.toFixed(2)}}
  .줄{display:flex;align-items:center;gap:22px;margin-bottom:44px}
  .이름{width:210px;font-size:44px;font-weight:700;color:#b9b9c4}
  .줄.켬 .이름{color:#c9a84c}
  .줄.켬 .막대{background:#c9a84c}
  .한칸{flex:1;display:flex;align-items:center;gap:18px}
  .막대{height:26px;background:#4a4f63;border-radius:13px}
  .값{font-size:40px;font-weight:700;white-space:nowrap}
  .뒷말{margin-top:64px;font-size:50px;font-weight:700;line-height:1.35;opacity:${뒷말.toFixed(2)}}
  .큰수{margin-top:26px;font-size:150px;font-weight:800;letter-spacing:-5px;color:#c9a84c;
        opacity:${수나옴.toFixed(2)};transform:scale(${(0.9 + 0.1 * 수나옴).toFixed(3)});transform-origin:left center}
  .단위{font-size:66px}
  .맺음{margin-top:60px;font-size:56px;font-weight:800;opacity:${맺음.toFixed(2)}}
  .주소{margin-top:22px;font-size:36px;color:#c9a84c;opacity:${맺음.toFixed(2)}}
  .바닥{position:absolute;left:84px;bottom:104px;font-size:26px;color:#7d7d8a;line-height:1.5}
  </style></head><body><div class="판">
    <div class="물음">자격증,<br>따는 데 얼마나<br>걸릴까요</div>
    <div class="갈래">등급별로 보면</div>
    <div class="표">${줄들}</div>
    <div class="뒷말">그런데 필기를 한 번에<br>붙은 사람은</div>
    <div class="큰수">${한번에}<span class="단위">%</span></div>
    <div class="맺음">안 되는 게 보통입니다</div>
    <div class="주소">100yearmap.com</div>
  </div>
  <div class="바닥">가운데값 · ${자료.출처.기준연도}년 · ${자료.출처.이름}<br>
    자격을 «딴 사람들» 기준입니다 · ${집}/work</div>
  </body></html>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 온글 = Array.from({ length: 길이 * 2 }, (_, i) => 칸HTML(i / 2)).join('\n')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 등수·순위 말이 없다', !금지말.some((w) => 온글.includes(w)));
  본다('② 「절반은 한 번에 붙는다」를 안 쓴다', !거짓말.some((w) => 온글.includes(w)));
  본다('③ 기능장(종목 30 미만)의 «걸린 날»이 화면에 없다',
    못낼등급.every((g) => !온글.includes(`${g.등급} ${g.가운데값일.toLocaleString()}일`)));
  본다('④ 「딴 사람들」이라고 밝힌다', 온글.includes('딴 사람들'));
  본다('⑤ 출처와 해가 있다', 온글.includes(자료.출처.이름) && 온글.includes(자료.출처.기준연도));
  본다('⑥ 주소가 있다', 온글.includes('100yearmap.com'));
  본다('⑦ 「세 번」을 단정하지 않는다(3회 이상은 뭉쳐 있다)', !/세 번 만에/.test(온글));
  본다('⑧ 낼 등급이 둘 이상이다', 낼등급.length >= 2);
  본다('⑨ 한번에 비율이 0~100 이다', 한번에 > 0 && 한번에 < 100);
  console.log(`\n낼 등급 ${낼등급.length} · 못 낼 등급 ${못낼등급.map((g) => g.등급).join(',') || '없음'} · 한번에 ${한번에}%`);
  process.exit();
}

/* ── 그리기 ─────────────────────────────────────────── */
const 인자 = process.argv.slice(2);
const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '자격걸린날.mp4';
const 낼곳 = path.join(여기, 'public/100y/video');
fs.mkdirSync(낼곳, { recursive: true });
const 칸방 = path.join(여기, 'out', '_칸-qual');
fs.rmSync(칸방, { recursive: true, force: true });
fs.mkdirSync(칸방, { recursive: true });

const { default: puppeteer } = await import(
  'file:///C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js'
);
const 브라우저 = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new', args: ['--no-sandbox', '--font-render-hinting=none'],
});
const 쪽 = await 브라우저.newPage();
await 쪽.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });

const 전체칸 = 길이 * 초당;
for (let n = 0; n < 전체칸; n++) {
  await 쪽.setContent(칸HTML(n / 초당), { waitUntil: 'load' });
  await 쪽.screenshot({ path: path.join(칸방, `${String(n).padStart(4, '0')}.png`) });
  if (n % 60 === 0) console.log(`   … ${n}/${전체칸}`);
}
await 브라우저.close();   // ⛔ puppeteer 만 닫는다. 사장님 크롬 창은 건드리지 않는다

const 갖다 = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
const ff = 갖다('ffmpeg-static');
execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(칸방, '%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20',
  path.join(낼곳, 낼이름)], { stdio: 'inherit' });

const 크기 = fs.statSync(path.join(낼곳, 낼이름)).size;
console.log(`\n✅ ${낼이름} · ${(크기 / 1024 / 1024).toFixed(2)}MB · ${길이}초`);
console.log('🔴 ⛔ videos.json 에 줄을 넣어야 /video 지면에 실린다');
