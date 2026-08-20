/**
 * make-video-100y-star-saju.mjs — 숏영상 「아이유 사주를 검색하면」 14초 · 1080×1920
 *
 * 🔴 2번 지시(8/20) 한 벌의 셋째 문이다. 지면 /saju 와 카드 여섯 장은 이미 났다.
 *   자료는 이미 손에 있는 star-saju-demand.json · star-birth.json 이다. 새로 캐지 않는다.
 *
 * ⭐ 이 영상은 «스타의 사주를 풀어 주는 것»이 아니다. **정반대다** —
 *   여덟 글자 중 두 글자는 누구도 못 센다는 것을 보이는 것이다.
 *   태어난 시각이 어느 자료에도 없기 때문이다.
 *
 * ⛔ 지켜야 할 말 —
 *   · 실존 인물의 사주를 **단정하지 않는다.** 사람 이름을 화면에 세우지 않는다
 *   · 운세·풀이·등수를 쓰지 않는다. 안 하는 것을 늘어놓지도 않는다(낱말이 화면에 남는다)
 *   · 화면의 수는 전부 자료에서 온다
 *
 * 쓰는 법  node scripts/make-video-100y-star-saju.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = fileURLToPath(new URL('..', import.meta.url));
const 폭 = 1080, 높 = 1920, 초당 = 30, 길이 = 14;
const 집 = 'https://100yearmap.com';
const 수요 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/star-saju-demand.json'), 'utf8'));
const 생일 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/star-birth.json'), 'utf8'));

export const 잰명수 = 수요.잰명수;
export const 실재명수 = 수요.실재명수;
export const 사람수 = 생일.사람들.length;
export const 글자수 = 8;
export const 못세는글자 = 2;

/** 네 기둥 — ⛔ 「된다/안 된다」를 짐작으로 나누지 않는다. 지면의 표와 같은 뜻이다 */
export const 기둥들 = [
  { 이름: '년주', 말: '절기에서 바뀝니다', 켬: false },
  { 이름: '월주', 말: '절기에서 바뀝니다', 켬: false },
  { 이름: '일주', 말: '날짜만 있으면 섭니다', 켬: false },
  { 이름: '시주', 말: '태어난 시각이 있어야 섭니다', 켬: true },
];

export const 금지말 = ['운세', '궁합', '등수', '순위', '대박', '타고난', '길하', '흉하', '재물운', '띠'];

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);
  const 머리 = 술술(끼(0.0, 0.6));
  const 잰말 = 술술(끼(1.4, 2.0));
  const 표나옴 = 술술(끼(3.2, 3.7));
  const 뒷말 = 술술(끼(7.6, 8.3));
  const 수나옴 = 술술(끼(8.4, 9.2));
  const 맺음 = 술술(끼(11.2, 12.0));

  const 줄 = (r, i) => {
    const 시작 = 3.5 + i * 0.55;
    const 뜸 = 술술(끼(시작, 시작 + 0.8));
    return `<div class="줄${r.켬 ? ' 켬' : ''}" style="opacity:${뜸.toFixed(2)};
      transform:translateX(${(24 * (1 - 뜸)).toFixed(1)}px)">
      <span class="기둥">${r.이름}</span><span class="말">${r.말}</span>
    </div>`;
  };

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:150px 84px}
  .물음{font-size:62px;font-weight:800;line-height:1.34;opacity:${머리.toFixed(2)};
        transform:translateY(${(20 * (1 - 머리)).toFixed(1)}px)}
  .잰말{margin-top:44px;font-size:38px;color:#9a9aa6;line-height:1.45;opacity:${잰말.toFixed(2)}}
  .잰말 b{color:#c9a84c}
  .표{margin-top:58px;opacity:${표나옴.toFixed(2)}}
  .줄{display:flex;align-items:baseline;gap:26px;margin-bottom:34px}
  .기둥{width:150px;font-size:40px;font-weight:700;color:#b9b9c4}
  .말{font-size:36px;color:#8f8f9c}
  .줄.켬 .기둥{color:#c9a84c}
  .줄.켬 .말{color:#e9e9ee;font-weight:700}
  .뒷말{margin-top:44px;font-size:44px;font-weight:700;line-height:1.35;opacity:${뒷말.toFixed(2)}}
  .큰수{margin-top:16px;font-size:132px;font-weight:800;letter-spacing:-4px;color:#c9a84c;
        opacity:${수나옴.toFixed(2)};transform:scale(${(0.9 + 0.1 * 수나옴).toFixed(3)});transform-origin:left center}
  .맺음{margin-top:40px;font-size:44px;font-weight:800;line-height:1.35;opacity:${맺음.toFixed(2)}}
  .주소{margin-top:18px;font-size:34px;color:#c9a84c;opacity:${맺음.toFixed(2)}}
  .바닥{position:absolute;left:84px;bottom:104px;font-size:25px;color:#7d7d8a;line-height:1.5}
  </style></head><body><div class="판">
    <div class="물음">「아이유 사주」를<br>검색하면</div>
    <div class="잰말">스타 ${잰명수}명의 이름 뒤에 「사주」를 붙여 재 보니<br>
      <b>${실재명수}명</b>은 그 말이 떠 있었습니다</div>
    <div class="표">${기둥들.map(줄).join('\n      ')}</div>
    <div class="뒷말">그런데 출생 시각을 적어 둔<br>자료가 없습니다. 그래서</div>
    <div class="큰수">${못세는글자}<span style="font-size:56px">글자</span></div>
    <div class="맺음">누가 세어도 비어 있습니다</div>
    <div class="주소">100yearmap.com/saju</div>
  </div>
  <div class="바닥">자동완성 실측 ${수요.잰때} · 공개 생년월일 ${사람수}명은 출처와 함께 지면에<br>
    이것은 달력이지 운명이 아닙니다 · ${집}/saju</div>
  </body></html>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 온글 = Array.from({ length: 길이 * 2 }, (_, i) => 칸HTML(i / 2)).join('\n')
    .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① ⭐ 제목에 「(스타 이름) 사주」가 든다', 온글.includes('아이유 사주'));
  const 걸린 = 금지말.filter((w) => 온글.includes(w));
  본다(`② ⛔ 운세·등수·「띠」를 쓰지 않는다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('③ ⛔ 사람 이름을 세워 사주를 단정하지 않는다 — 화면에 선 이름은 제목의 검색어뿐',
    생일.사람들.filter((r) => 온글.includes(r.이름)).length === 1);
  본다('④ 네 기둥이 다 뜬다', 기둥들.every((r) => 온글.includes(r.이름)));
  본다('⑤ ⭐ 「시각이 없다」가 까닭으로 적힌다', 온글.includes('출생 시각을 적어 둔'));
  본다('⑥ 데려갈 주소가 /saju 다', 온글.includes(`${집}/saju`));
  본다('⑦ 잰 때를 밝힌다', 온글.includes(수요.잰때));
  본다('⑧ 「이것은 달력이지 운명이 아닙니다」를 적는다', 온글.includes('달력이지 운명이 아닙니다'));

  const 댈수 = new Set([잰명수, 실재명수, 사람수, 못세는글자, 글자수, 길이].map(String));
  const 못댄것 = [...온글.replace(/100yearmap\.com\S*/g, ' ').replace(/\d{4}-\d\d-\d\d \d\d:\d\d UTC/g, ' ')
    .matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, '')).filter((s) => !댈수.has(s));
  본다(`⑨ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n자동완성 ${잰명수}명 중 ${실재명수}명 · ${글자수}글자 중 ${못세는글자}글자가 빈다`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 화면 글만 얻어 갈 수 있게 감싼다(8/16 규칙) */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-star-saju.mjs';
if (내가직접불렸나) {
  const 낼곳 = path.join(여기, 'public/100y/video');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(여기, 'out', '_칸-starsaju');
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
    path.join(낼곳, '스타사주.mp4')], { stdio: 'inherit' });
  const 크기 = fs.statSync(path.join(낼곳, '스타사주.mp4')).size;
  console.log(`\n✅ 스타사주.mp4 · ${(크기 / 1024 / 1024).toFixed(2)}MB · ${길이}초`);
  console.log('🔴 ⛔ videos.json 에 줄을 넣어야 /video 지면에 실린다');
}
