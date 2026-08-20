/**
 * make-video-100y-univ-average.mjs — 숏영상 「전국 평균이 두 개입니다」 14초 · 1080×1920
 *
 * 🔴 8/19 예약분(하루 밀려 낸다). 자료는 이미 손에 있는 pages-university.json.
 * ⭐ 이 영상은 «수를 자랑하는 것»이 아니라 **오독을 막는 것**이다 —
 *   전문대 학생이 72.1% 와 견주면서 옆 지면의 62.8% 를 같은 「전국 평균」으로 읽으면
 *   **없는 격차가 보인다.** 지면과 카드가 이미 이 말을 한다. 영상이 셋째 문이다.
 *
 * ⛔ 지켜야 할 말 —
 *   · 등수·순위를 쓰지 않는다. 「어느 쪽이 낫다」를 쓰지 않는다
 *   · 무리 이름은 **자료에서 잰 것**만 — 「4년제」로 넘겨짚지 않는다
 *
 * 쓰는 법  node scripts/make-video-100y-univ-average.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = fileURLToPath(new URL('..', import.meta.url));
const 폭 = 1080, 높 = 1920, 초당 = 30, 길이 = 14;
const 집 = 'https://100yearmap.com';
const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/pages-university.json'), 'utf8'));

/** 구분마다 그 지표의 전국평균을 자료에서 캔다 — ⛔ 손으로 안 박는다 */
export function 평균캐기(지표) {
  const 낸다 = {};
  for (const x of 자료) if (x[지표] && x[지표].전국평균 != null) 낸다[x.구분] = x[지표].전국평균;
  return 낸다;
}
/** 구분에 든 «종류»를 세어 무리 이름을 만든다. ⛔ 넘겨짚지 않는다 */
export const 종류모음 = (구분) =>
  [...new Set(자료.filter((x) => x.구분 === 구분).map((x) => x.종류))].join('·');

export const 취 = 평균캐기('취업률');
export const 교원 = 평균캐기('전임교원확보율');
export const 탈락 = 평균캐기('중도탈락률');
export const 대학무리 = 종류모음('대학');
export const 전문무리 = 종류모음('전문대학');
export const 벌어짐 = Math.round(Math.abs(교원['대학'] - 교원['전문대학']) * 10) / 10;
export const 공시연도 = [...new Set(자료.map((x) => x.공시연도).filter(Boolean))].sort().pop();
export const 곳수 = 자료.length;

export const 금지말 = ['등수', '순위', '1등', '상위', '꼴찌', '4년제', '더 낫', '좋은 학교'];

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);
  const 머리 = 술술(끼(0.0, 0.6));
  const 표나옴 = 술술(끼(1.6, 2.1));
  const 뒷말 = 술술(끼(7.4, 8.1));
  const 수나옴 = 술술(끼(8.2, 9.0));
  const 맺음 = 술술(끼(11.2, 12.0));

  const 줄 = (이름, 값, i, 켬) => {
    const 시작 = 1.9 + i * 0.5;
    const 자람 = 술술(끼(시작, 시작 + 0.9));
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    return `<div class="줄${켬 ? ' 켬' : ''}">
      <span class="이름">${이름}</span>
      <span class="한칸"><span class="막대" style="width:${(값 * 0.62 * 자람).toFixed(2)}%"></span>
        <span class="값" style="opacity:${보임}">${값}%</span></span>
    </div>`;
  };

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:150px 84px}
  .물음{font-size:66px;font-weight:800;line-height:1.3;opacity:${머리.toFixed(2)};
        transform:translateY(${(20 * (1 - 머리)).toFixed(1)}px)}
  .갈래{margin-top:64px;font-size:32px;color:#9a9aa6;letter-spacing:1px;opacity:${표나옴.toFixed(2)}}
  .표{margin-top:22px;opacity:${표나옴.toFixed(2)}}
  .줄{display:flex;align-items:center;gap:20px;margin-bottom:38px}
  .이름{width:330px;font-size:34px;font-weight:700;color:#b9b9c4}
  .줄.켬 .이름{color:#c9a84c}
  .줄.켬 .막대{background:#c9a84c}
  .한칸{flex:1;display:flex;align-items:center;gap:16px}
  .막대{height:22px;background:#4a4f63;border-radius:11px}
  .값{font-size:36px;font-weight:700;white-space:nowrap}
  .뒷말{margin-top:52px;font-size:46px;font-weight:700;line-height:1.35;opacity:${뒷말.toFixed(2)}}
  .큰수{margin-top:20px;font-size:140px;font-weight:800;letter-spacing:-5px;color:#c9a84c;
        opacity:${수나옴.toFixed(2)};transform:scale(${(0.9 + 0.1 * 수나옴).toFixed(3)});transform-origin:left center}
  .단위{font-size:58px}
  .맺음{margin-top:46px;font-size:46px;font-weight:800;line-height:1.35;opacity:${맺음.toFixed(2)}}
  .주소{margin-top:20px;font-size:34px;color:#c9a84c;opacity:${맺음.toFixed(2)}}
  .바닥{position:absolute;left:84px;bottom:104px;font-size:25px;color:#7d7d8a;line-height:1.5}
  </style></head><body><div class="판">
    <div class="물음">「전국 평균」은<br>하나가 아닙니다</div>
    <div class="갈래">취업률의 전국 평균</div>
    <div class="표">
      ${줄(대학무리, 취['대학'], 0, false)}
      ${줄(전문무리, 취['전문대학'], 1, true)}
    </div>
    <div class="뒷말">전임교원확보율은<br>두 무리가</div>
    <div class="큰수">${벌어짐}<span class="단위">%p</span></div>
    <div class="맺음">벌어집니다.<br>어느 평균인지 보고 읽으세요</div>
    <div class="주소">100yearmap.com</div>
  </div>
  <div class="바닥">${공시연도}년 대학정보공시 · ${곳수}곳 · 학제가 달라 따로 냅니다<br>
    같은 구분끼리만 견줍니다 · ${집}/university</div>
  </body></html>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 온글 = Array.from({ length: 길이 * 2 }, (_, i) => 칸HTML(i / 2)).join('\n')
    .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  const 걸린 = 금지말.filter((w) => 온글.includes(w));
  본다(`① ⛔ 등수·「4년제」·「더 낫다」를 안 쓴다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('② 두 무리 이름이 자료에서 온 것이다',
    온글.includes(대학무리) && 온글.includes(전문무리) && 대학무리.includes('교육대학'));
  본다('③ 두 평균이 다 뜬다', 온글.includes(`${취['대학']}%`) && 온글.includes(`${취['전문대학']}%`));
  본다('④ 「학제가 달라 따로 낸다」를 밝힌다', 온글.includes('학제가 달라 따로 냅니다'));
  본다('⑤ 데려올 주소가 /university 다', 온글.includes(`${집}/university`));
  본다('⑥ 공시연도와 곳수가 있다', 온글.includes(String(공시연도)) && 온글.includes(String(곳수)));

  const 댈수 = new Set([
    ...Object.values(취), ...Object.values(교원), ...Object.values(탈락),
    벌어짐, 곳수, Number(공시연도),
  ].filter((v) => v != null).map(String));
  const 못댄것 = [...온글.replace(/100yearmap\.com\S*/g, ' ').matchAll(/\d[\d,]*\.?\d*/g)]
    .map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s));
  본다(`⑦ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n${대학무리} ${취['대학']}% · ${전문무리} ${취['전문대학']}% · 전임교원 ${벌어짐}%p 차이`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 화면 글만 얻어 갈 수 있게 감싼다(8/16 규칙).
   ⚠ import.meta.url 로 견주면 윈도에서 조용히 안 돈다. 파일 이름으로 견딘다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-univ-average.mjs';
if (내가직접불렸나) {
  const 낼곳 = path.join(여기, 'public/100y/video');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(여기, 'out', '_칸-univavg');
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

  const ff = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json')('ffmpeg-static');
  execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(칸방, '%04d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20',
    path.join(낼곳, '전국평균두개.mp4')], { stdio: 'inherit' });
  const 크기 = fs.statSync(path.join(낼곳, '전국평균두개.mp4')).size;
  console.log(`\n✅ 전국평균두개.mp4 · ${(크기 / 1024 / 1024).toFixed(2)}MB · ${길이}초`);
  console.log('🔴 ⛔ videos.json 에 줄을 넣어야 /video 지면에 실린다');
}
