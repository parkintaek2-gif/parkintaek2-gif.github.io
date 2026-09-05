/**
 * make-video-100y-common-illness.mjs — 숏영상 「나이 들면 무슨 병으로 병원에 갈까요」 14초 · 1080×1920
 *
 * 자료 — src/data/100yearmap/medical-cost-top-diseases.json (HIRA 다빈도질병 통계)
 *
 * ⛔⛔ 이 영상이 가장 조심할 것 — **20~70대 잇몸병을 「가장 위험한 병」으로 안 읽히게 한다.**
 *   흔한 이유이지 위험한 병이 아니다. 화면에 그 말을 그대로 넣는다.
 * ⛔ 순위·등수 낱말을 쓰지 않는다 — 병 이름의 차례로만 보여 준다.
 * ⚠ videos.json 에 줄을 넣어야 /video 지면에 실린다.
 *
 * 쓰는 법  node scripts/make-video-100y-common-illness.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = fileURLToPath(new URL('..', import.meta.url));
const 폭 = 1080, 높 = 1920, 초당 = 30, 길이 = 14;
export const 주소 = '100yearmap.com/common-illness';

const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/medical-cost-top-diseases.json'), 'utf8'));
export const 나이대별 = 자료.나이대별;
export const 칸 = (이름) => 나이대별.find((r) => r.칸 === 이름);
export const 스물 = 칸('20~29세');
export const 여든 = 칸('80세이상');
/** ⛔ 이 영상이 쓰면 안 되는 말 */
export const 훈수말 = ['가야 한다', '챙겨야', '늦었다', '고쳐야', '해야 한다'];
export const 금지말 = ['등수', '순위', '랭킹', '몇 위', '꼴찌', '최악'];

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);
  const 머리 = 술술(끼(0.0, 0.7));
  const 표나옴 = 술술(끼(1.4, 1.9));
  const 짚음 = 술술(끼(8.4, 9.1));
  const 맺음 = 술술(끼(11.4, 12.1));

  const 줄들 = 나이대별.map((r, i) => {
    const 시작 = 1.8 + i * 0.28;
    const 자람 = 술술(끼(시작, 시작 + 0.7));
    const 여든인가 = r.칸 === '80세이상';
    const 켬 = 초 > 7.6 && 여든인가 ? ' 켬' : '';
    return `<div class="줄${켬}" style="opacity:${자람.toFixed(2)}">
      <span class="이름">${r.칸}</span>
      <span class="병">${r.상위[0].이름}</span>
    </div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:130px 84px}
  .머리{font-size:66px;font-weight:800;line-height:1.28;letter-spacing:-2px;
        opacity:${머리.toFixed(3)};transform:translateY(${((1 - 머리) * 26).toFixed(1)}px)}
  .곁{margin-top:20px;font-size:32px;color:#9aa2b1;opacity:${머리.toFixed(3)}}
  .표{margin-top:56px;opacity:${표나옴.toFixed(3)}}
  .줄{display:flex;align-items:baseline;margin-bottom:24px}
  .이름{width:190px;font-size:32px;color:#9aa2b1}
  .병{font-size:36px;font-weight:700;color:#c3c8d4}
  .줄.켬 .병{color:#e8b34f;font-weight:800}
  .줄.켬 .이름{color:#e8b34f}
  .짚음{margin-top:56px;padding:28px 32px;border-left:6px solid #e8b34f;
        background:#1b1f29;border-radius:10px;font-size:32px;line-height:1.6;
        color:#c3c8d4;opacity:${짚음.toFixed(3)}}
  .짚음 b{color:#e9e9ee}
  .맺음{margin-top:44px;font-size:38px;font-weight:800;line-height:1.45;
        opacity:${맺음.toFixed(3)}}
  .바닥{position:absolute;left:84px;bottom:100px;font-size:30px;color:#8b93a3}
  .집{color:#e8b34f;font-weight:700}
  </style></head><body><div class="판">
    <div class="머리">나이 들면 무슨 병으로<br>병원에 갈까요</div>
    <div class="곁">${자료.최신}년 · HIRA 외래(양방) 다빈도질병</div>
    <div class="표">${줄들}</div>
    <div class="짚음">
      20~70대 내내 <b>${스물.상위[0].이름}</b>인데,<br>
      80세부터 <b>${여든.상위[0].이름}</b>이 앞섭니다
    </div>
    <div class="맺음">흔한 이유이지 위험한 병이 아닙니다.</div>
    <div class="바닥">건강보험심사평가원 · <span class="집">${주소}</span></div>
  </div></body></html>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 칸들 = [0, 2, 5, 8, 11, 13.9].map(칸HTML);
  const 온글 = 칸들.join('\n')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/style="[^"]*"/g, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 열네 초다', 길이 === 14 && 초당 === 30);
  본다('② 세로다 — 1080×1920', 폭 === 1080 && 높 === 1920);
  본다('③ 나이 칸 아홉이 다 있다', 나이대별.length === 9);
  본다('④ 20대와 80세이상의 1위 병 이름이 화면에 있다',
    온글.includes(스물.상위[0].이름) && 온글.includes(여든.상위[0].이름));
  본다('⑤ ⛔ 「흔하다≠위험하다」 문구가 있다', 온글.includes('흔한 이유이지 위험한 병이 아닙니다'));
  const 걸린훈수 = 훈수말.filter((w) => 온글.includes(w));
  본다(`⑥ ⛔ 훈수를 두지 않는다${걸린훈수.length ? ` — ${걸린훈수.join(' · ')}` : ''}`, 걸린훈수.length === 0);
  const 걸린금지 = 금지말.filter((w) => 온글.includes(w));
  본다(`⑦ ⛔ 줄을 세우지 않는다${걸린금지.length ? ` — ${걸린금지.join(' · ')}` : ''}`, 걸린금지.length === 0);
  본다('⑧ 🔴 데려갈 주소가 박혀 있다', 칸들.every((h) => h.includes(주소)));
  본다('⑨ 나이 칸 이름이 전부 자료에서 온다', 나이대별.every((r) => 온글.includes(r.칸)));

  console.log(`\n20대 1위 ${스물.상위[0].이름} · 80세이상 1위 ${여든.상위[0].이름} · ${자료.최신}년`);
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-common-illness.mjs';
if (내가직접불렸나) {
  const 인자 = process.argv.slice(2);
  const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '나이대별가장흔한병.mp4';
  const 낼곳 = path.join(여기, 'public/100y/video');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(여기, 'out', '_칸-common-illness');
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
