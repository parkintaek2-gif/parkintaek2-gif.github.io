/**
 * make-video-100y-elementary.mjs — 숏영상 「우리 학교는 몇 살일까요」 14초 · 1080×1920
 *
 * 🔴 왜 — 사장님 「왜 자꾸 대입에 머물러있니」.
 *   8/16 새벽에 /elementary 지면과 카드를 냈다. 영상만 없었다 —
 *   ⭐ 셋이 다 있어야 밖에서 데려온다. 지면은 검색으로, 카드는 저장으로, 영상은 넘겨 보다가.
 *
 * 자료 — src/data/100yearmap/elementary.json (NEIS 교육정보 개방 포털 · 공식 OpenAPI)
 *
 * ⛔ 자료가 스스로 못박은 「안 쓰는 말」을 그대로 지킨다 —
 *   명문 · 전통 · 순위 · 몇 위 · 좋은 학교 · 나쁜 학교. **부정문으로도 안 쓴다.**
 * ⚠ 설립일은 NEIS 값이라 개교기념일과 다를 수 있다 — 낱낱 학교에 「몇 년째」를 안 붙인다.
 * ⚠ videos.json 에 줄을 넣어야 /video 지면에 실린다. 안 넣으면 파일만 있고 아무도 못 본다.
 *
 * 쓰는 법  node scripts/make-video-100y-elementary.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = fileURLToPath(new URL('..', import.meta.url));
const 폭 = 1080, 높 = 1920, 초당 = 30, 길이 = 14;
const 집 = 'https://100yearmap.com';

const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/elementary.json'), 'utf8'));
export const 올해 = 자료.올해;
export const 맨오래 = 자료.가장오래된[0];
export const 백년몫 = Number(((자료.백년넘은곳수 / 자료.낸곳) * 100).toFixed(1));
export const 먼저다섯 = 자료.가장오래된.slice(0, 5);

/** 자료가 스스로 적어 둔 금지어를 그대로 가져온다 — ⛔ 내가 목록을 새로 지어내지 않는다 */
export const 금지말 = String(자료['⛔ 안 쓰는 말']).split('·').map((s) => s.trim()).filter(Boolean);
/** 이 영상이 쓰면 안 되는 훈수 */
export const 훈수말 = ['보내야', '가야 한다', '해야 한다', '늦었다', '고르십시오'];

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}
/** 막대 — 가장 오래된 곳을 폭의 62%까지만. 나이가 아니라 «지나온 해»로 길이를 잡는다 */
export const 자리 = (설립연) => ((올해 - 설립연) / (올해 - 맨오래.설립연)) * 62;

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);
  const 머리 = 술술(끼(0.0, 0.6));
  const 표나옴 = 술술(끼(1.6, 2.1));
  const 뒷말 = 술술(끼(8.2, 8.9));
  const 수나옴 = 술술(끼(9.0, 9.8));
  const 맺음 = 술술(끼(11.6, 12.4));

  const 줄들 = 먼저다섯.map((r, i) => {
    const 시작 = 1.9 + i * 0.34;
    const 자람 = 술술(끼(시작, 시작 + 0.85));
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    const 켬 = 초 > 6.4 && r.설립연 === 맨오래.설립연 ? ' 켬' : '';
    return `<div class="줄${켬}">
      <span class="이름">${r.설립연}년</span>
      <span class="한칸"><span class="막대" style="width:${(자리(r.설립연) * 자람).toFixed(2)}%"></span>
        <span class="값" style="opacity:${보임}">${r.title}</span></span>
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
  .줄{display:flex;align-items:center;gap:22px;margin-bottom:40px}
  .이름{width:180px;font-size:42px;font-weight:700;color:#b9b9c4}
  .줄.켬 .이름{color:#c9a84c}
  .줄.켬 .막대{background:#c9a84c}
  .한칸{flex:1;display:flex;align-items:center;gap:18px}
  .막대{height:24px;background:#4a4f63;border-radius:12px}
  .값{font-size:34px;font-weight:700;white-space:nowrap}
  .뒷말{margin-top:56px;font-size:50px;font-weight:700;line-height:1.35;opacity:${뒷말.toFixed(2)}}
  .큰수{margin-top:26px;font-size:150px;font-weight:800;letter-spacing:-5px;color:#c9a84c;
        opacity:${수나옴.toFixed(2)};transform:scale(${(0.9 + 0.1 * 수나옴).toFixed(3)});transform-origin:left center}
  .단위{font-size:60px}
  .맺음{margin-top:52px;font-size:52px;font-weight:800;opacity:${맺음.toFixed(2)}}
  .주소{margin-top:22px;font-size:36px;color:#c9a84c;opacity:${맺음.toFixed(2)}}
  .바닥{position:absolute;left:84px;bottom:104px;font-size:26px;color:#7d7d8a;line-height:1.5}
  </style></head><body><div class="판">
    <div class="물음">우리 학교는<br>몇 살일까요</div>
    <div class="갈래">먼저 문을 연 곳</div>
    <div class="표">${줄들}</div>
    <div class="뒷말">백 년이 넘은<br>초등학교가</div>
    <div class="큰수">${자료.백년넘은곳수.toLocaleString()}<span class="단위">곳</span></div>
    <div class="맺음">문 연 날만 적습니다</div>
    <div class="주소">100yearmap.com</div>
  </div>
  <div class="바닥">전국 ${자료.낸곳.toLocaleString()}곳 중 ${백년몫}% · NEIS 교육정보 개방 포털<br>
    등수를 매기지 않습니다 · ${집}/elementary</div>
  </body></html>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 온글 = Array.from({ length: 길이 * 2 }, (_, i) => 칸HTML(i / 2)).join('\n')
    .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  const 걸린 = 금지말.filter((w) => 온글.includes(w));
  본다(`① ⛔ 자료가 금한 말을 안 쓴다(${금지말.length}개)${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);
  본다('② ⛔ 훈수를 두지 않는다', !훈수말.some((w) => 온글.includes(w)));
  본다('③ 먼저 문을 연 다섯 곳이 다 뜬다', 먼저다섯.every((r) => 온글.includes(r.title)));
  본다('④ 백 년 넘은 곳 수가 뜬다', 온글.includes(자료.백년넘은곳수.toLocaleString()));
  본다('⑤ 분모(전국 몇 곳)를 함께 낸다', 온글.includes(자료.낸곳.toLocaleString()));
  본다('⑥ 출처가 있다', 온글.includes('NEIS'));
  본다('⑦ 데려올 주소가 /elementary 다', 온글.includes(`${집}/elementary`));
  본다('⑧ 🔴 낱낱 학교에 「몇 년째」를 안 붙인다', !/\d+해째|\d+년째/.test(온글));

  // ⑨ 화면의 수가 전부 자료에서 오나 — ⚠ 주소의 100 을 먼저 뺀다
  const 댈수 = new Set([
    ...자료.가장오래된.map((r) => r.설립연),
    자료.낸곳, 자료.전체, 자료.백년넘은곳수, 백년몫, 올해,
  ].filter((v) => v != null).map(String));
  const 수볼글 = 온글.replace(/100yearmap\.com\S*/g, ' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s));
  본다(`⑨ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n맨 먼저 ${맨오래.title} ${맨오래.설립연}년 · 백 년 넘은 곳 ${자료.백년넘은곳수.toLocaleString()} / ${자료.낸곳.toLocaleString()} = ${백년몫}%`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 화면 글만 얻어 갈 수 있게 감싼다(8/16 규칙).
   ⚠ import.meta.url 로 견주면 윈도에서 조용히 안 돈다. 파일 이름으로 견딘다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-elementary.mjs';
if (내가직접불렸나) {
  const 인자 = process.argv.slice(2);
  const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '우리학교는몇살.mp4';
  const 낼곳 = path.join(여기, 'public/100y/video');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(여기, 'out', '_칸-elementary');
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
}
