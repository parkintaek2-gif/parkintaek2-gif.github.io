/**
 * make-video-100y-breakfast.mjs — 숏영상 「아침을 거르는 건 몇 살일까요」 14초 · 1080×1920
 *
 * 🔴 2번 16시 지시 — 「다음 나이 문 하나. 지면 + 카드 + 숏영상을 **한 덩어리로**」.
 *   ⭐ 셋이 다 있어야 밖에서 데려온다 — 지면은 검색으로, 카드는 저장으로, 영상은 넘겨 보다가.
 *
 * 자료 — src/data/100yearmap/breakfast.json (질병관리청 국민건강영양조사 · KOSIS)
 *
 * ⛔⛔ 이 영상이 가장 조심할 것 — **10대만 떼면 거짓이 된다.**
 *   10~18세 35.5% 인데 19~29세가 62.1% 다. 맨 위 칸은 20대다.
 *   ⇒ 막대를 **여덟 칸 다** 그린다. 맨 위 칸을 금색으로 켜는데 그게 20대다.
 * ⛔ 「먹어야 한다」로 안 쓴다. 재촉하지 않는다.
 * ⛔ 「거른다」의 뜻(전날 하루)을 화면에 넣는다.
 * ⚠ videos.json 에 줄을 넣어야 /video 지면에 실린다.
 *
 * 쓰는 법  node scripts/make-video-100y-breakfast.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = fileURLToPath(new URL('..', import.meta.url));
const 폭 = 1080, 높 = 1920, 초당 = 30, 길이 = 14;
export const 주소 = '100yearmap.com/breakfast';

const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/breakfast.json'), 'utf8'));
export const 칸 = (이름) => 자료.나이별.find((r) => r.칸 === 이름);
export const 그릴칸 = 자료.나이별.filter((r) => r.몫 != null);
export const 열대 = 자료.열대;
export const 맨위 = 자료.가장많이거르는칸;
export const 흐름첫 = 자료.흐름첫, 흐름끝 = 자료.흐름끝;
export const 오른것 = Math.round((흐름끝['10~18세'] - 흐름첫['10~18세']) * 10) / 10;
/** ⛔ 이 영상이 쓰면 안 되는 말 */
export const 훈수말 = ['먹어야 한다', '챙겨야', '늦었다', '고쳐야', '해야 한다'];
export const 금지말 = ['등수', '순위', '랭킹', '몇 위', '꼴찌', '최악'];

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}
/** 막대 길이 — 맨 큰 칸을 화면 폭의 62%로 잡는다 */
export const 자리 = (몫) => (몫 / 맨위.몫) * 62;

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);
  const 머리 = 술술(끼(0.0, 0.7));
  const 표나옴 = 술술(끼(1.4, 1.9));
  const 짚음 = 술술(끼(7.6, 8.3));
  const 맺음 = 술술(끼(10.8, 11.5));

  const 줄들 = 그릴칸.map((r, i) => {
    const 시작 = 1.8 + i * 0.26;
    const 자람 = 술술(끼(시작, 시작 + 0.85));
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    const 켬 = 초 > 6.2 && r.칸 === 맨위.칸 ? ' 켬' : '';
    const 열 = 초 > 6.2 && r.칸 === 열대.칸 ? ' 열대' : '';
    return `<div class="줄${켬}${열}">
      <span class="이름">${r.칸}</span>
      <span class="한칸"><span class="막대" style="width:${(자리(r.몫) * 자람).toFixed(2)}%"></span>
        <span class="값" style="opacity:${보임}">${r.몫}%</span></span>
    </div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:140px 84px}
  .머리{font-size:74px;font-weight:800;line-height:1.24;letter-spacing:-2px;
        opacity:${머리.toFixed(3)};transform:translateY(${((1 - 머리) * 26).toFixed(1)}px)}
  .곁{margin-top:20px;font-size:34px;color:#9aa2b1;opacity:${머리.toFixed(3)}}
  .표{margin-top:72px;opacity:${표나옴.toFixed(3)}}
  .줄{display:flex;align-items:center;margin-bottom:26px}
  .이름{width:230px;font-size:36px;color:#c3c8d4}
  .한칸{flex:1;position:relative;height:48px;display:flex;align-items:center}
  .막대{position:absolute;left:0;height:48px;border-radius:7px;background:#4a5468}
  .줄.켬 .막대{background:#e8b34f}
  .줄.켬 .이름{color:#e8b34f;font-weight:800}
  .줄.열대 .막대{background:#7f8aa3}
  .줄.열대 .이름{color:#e9e9ee;font-weight:800}
  .값{position:relative;margin-left:16px;font-size:36px;font-weight:800}
  .짚음{margin-top:52px;padding:28px 32px;border-left:6px solid #e8b34f;
        background:#1b1f29;border-radius:10px;font-size:34px;line-height:1.6;
        color:#c3c8d4;opacity:${짚음.toFixed(3)}}
  .짚음 b{color:#e9e9ee}
  .맺음{margin-top:48px;font-size:40px;font-weight:800;line-height:1.45;
        opacity:${맺음.toFixed(3)}}
  .바닥{position:absolute;left:84px;bottom:110px;font-size:32px;color:#8b93a3}
  .집{color:#e8b34f;font-weight:700}
  </style></head><body><div class="판">
    <div class="머리">아침을 거르는 건<br>몇 살일까요</div>
    <div class="곁">${자료.최신}년 · 조사 전날 아침을 거른 사람</div>
    <div class="표">${줄들}</div>
    <div class="짚음">
      ⛔ 맨 위 칸은 10대가 아닙니다 —<br>
      10~18세 ${열대.몫}%, <b>${맨위.칸} ${맨위.몫}%</b>
    </div>
    <div class="맺음">${흐름첫.해}년 ${흐름첫['10~18세']}% → ${흐름끝.해}년 ${흐름끝['10~18세']}%.<br>먹어야 한다고 쓰지 않습니다.</div>
    <div class="바닥">질병관리청 · <span class="집">${주소}</span></div>
  </div></body></html>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 칸들 = [0, 2, 5, 8, 11, 13.9].map(칸HTML);
  /* ⛔ <style> 을 먼저 걷어낸다 — 안 걷으면 CSS 의 1080·140 이 「화면의 수」로 잡힌다 */
  const 온글 = 칸들.join('\n')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/style="[^"]*"/g, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 열네 초다', 길이 === 14 && 초당 === 30);
  본다('② 세로다 — 1080×1920', 폭 === 1080 && 높 === 1920);
  본다(`③ ⛔ 나이칸을 여덟 다 그린다 — 하나만 떼지 않는다`, 그릴칸.length === 8);
  본다(`④ ⛔ 맨 위 칸이 10대가 아니라고 화면에 박았다 — ${맨위.칸} ${맨위.몫}%`,
    온글.includes('맨 위 칸은 10대가 아닙니다') && 온글.includes(`${맨위.칸} ${맨위.몫}%`));
  본다('⑤ ⛔ 「거른다」의 뜻이 화면에 있다', 온글.includes('조사 전날 아침을 거른 사람'));
  본다('⑥ ⛔ 흐름을 함께 보인다', 온글.includes(`${흐름첫.해}년 ${흐름첫['10~18세']}%`));
  const 걸린훈수 = 훈수말.filter((w) => 온글.includes(w))
    .filter((w) => !(w === '먹어야 한다' && 온글.includes('먹어야 한다고 쓰지 않습니다')));
  본다(`⑦ ⛔ 훈수를 두지 않는다${걸린훈수.length ? ` — ${걸린훈수.join(' · ')}` : ''}`, 걸린훈수.length === 0);
  const 걸린금지 = 금지말.filter((w) => 온글.includes(w));
  본다(`⑧ ⛔ 줄을 세우지 않는다${걸린금지.length ? ` — ${걸린금지.join(' · ')}` : ''}`, 걸린금지.length === 0);
  본다('⑨ 🔴 데려갈 주소가 박혀 있다', 칸들.every((h) => h.includes(주소)));
  본다('⑩ 막대가 처음엔 0 이고 끝엔 다 자란다',
    /width:0\.00%/.test(칸HTML(0)) && 칸HTML(13.9).includes(`width:${자리(맨위.몫).toFixed(2)}%`));

  const 댈수 = new Set([
    ...자료.나이별.flatMap((r) => [r.몫, ...(r.칸.match(/\d+/g) || []).map(Number)]),
    열대.몫, 맨위.몫, 오른것, 흐름첫['10~18세'], 흐름끝['10~18세'],
    Number(흐름첫.해), Number(흐름끝.해), Number(자료.최신),
  ].filter((v) => v != null).map(String));
  const 수볼글 = 온글.replace(/100yearmap\.com\S*/g, ' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s));
  본다(`⑪ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n10~18세 ${열대.몫}% · 맨 위 ${맨위.칸} ${맨위.몫}% · ${자료.최신}년`);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-breakfast.mjs';
if (내가직접불렸나) {
  const 인자 = process.argv.slice(2);
  const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '아침을거르는나이.mp4';
  const 낼곳 = path.join(여기, 'public/100y/video');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(여기, 'out', '_칸-breakfast');
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
