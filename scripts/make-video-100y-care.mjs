/**
 * make-video-100y-care.mjs — 숏영상 「몇 살부터 돌봄이 필요해질까요」 14초 · 1080×1920
 *
 * 🔴 2번 지시(8/21 15시): 「/care 카드뉴스 한 벌 + **숏영상 하나**.
 *   「85세 이상은 43%」를 앞세운다. 지면은 13:1x 에 나갔는데 **데려올 길이 아직 없다**.
 *   카드는 내는 것이 아니라 **데려오는 것**이다」
 *   ⭐ 셋이 다 있어야 밖에서 데려온다 — 지면은 검색으로, 카드는 저장으로, 영상은 넘겨 보다가.
 *
 * 자료 — src/data/100yearmap/care.json (국민건강보험공단 노인장기요양보험통계 · KOSIS)
 *
 * ⛔⛔ 이 영상이 가장 조심할 것 — **「판정」과 「인정」을 섞으면 13만 6천 명이 부풀어 오른다.**
 *   표의 「계」에는 등급외(신청했지만 인정 안 된 사람)가 들어 있다.
 *   ⇒ 화면에 **뺄셈을 그대로 보인다.** 14초짜리라도 이건 뺄 수 없다.
 * ⛔ 「몇 살이면 이렇게 된다」로 안 쓴다 — 마지막에 **안 받은 쪽(57%)**을 센다.
 * ⛔ 줄을 세우지 않는다. 시·도를 늘어놓지 않는다.
 * ⚠ videos.json 에 줄을 넣어야 /video 지면에 실린다. 안 넣으면 파일만 있고 아무도 못 본다.
 *
 * 쓰는 법  node scripts/make-video-100y-care.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 여기 = fileURLToPath(new URL('..', import.meta.url));
const 폭 = 1080, 높 = 1920, 초당 = 30, 길이 = 14;
export const 주소 = '100yearmap.com/care';

const 자료 = JSON.parse(fs.readFileSync(path.join(여기, 'src/data/100yearmap/care.json'), 'utf8'));
/** ⛔ 짐작으로 고르지 않는다 — 칸 이름으로 찾는다 */
export const 칸 = (이름) => 자료.나이별.find((r) => r.칸 === 이름);
export const 몫있는칸 = 자료.나이별.filter((r) => r.몫 != null);
export const 맨끝 = 칸('85세이상');
export const 전체 = 자료.전체;
/** 안 받은 쪽 — ⛔ 「몇 살이면 이렇게 된다」로 안 쓰기 위해 반드시 센다 */
export const 안받은몫 = Math.round((100 - 맨끝.몫) * 10) / 10;
/** ⛔ 이 영상이 쓰면 안 되는 말 */
export const 훈수말 = ['해야 한다', '늦었다', '미리 준비하십시오', '대비하십시오', '보내야'];
export const 금지말 = ['등수', '순위', '랭킹', '몇 위', '꼴찌', '최악'];

export const 술술 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);
export function 사이(초, 부터, 까지) {
  if (까지 <= 부터) return 초 >= 까지 ? 1 : 0;
  return Math.max(0, Math.min(1, (초 - 부터) / (까지 - 부터)));
}
/** 막대 길이 — 맨 큰 칸(43%)을 화면 폭의 62%로 잡는다 */
export const 자리 = (몫) => (몫 / 맨끝.몫) * 62;

export function 칸HTML(초) {
  const 끼 = (a, b) => 사이(초, a, b);
  const 머리 = 술술(끼(0.0, 0.7));
  const 표나옴 = 술술(끼(1.5, 2.0));
  const 뺄셈 = 술술(끼(7.4, 8.1));
  const 맺음 = 술술(끼(10.6, 11.3));

  const 줄들 = 몫있는칸.map((r, i) => {
    const 시작 = 1.9 + i * 0.36;
    const 자람 = 술술(끼(시작, 시작 + 0.9));
    const 보임 = Math.max(0, 자람 * 2 - 1).toFixed(2);
    const 켬 = 초 > 5.9 && r.칸 === 맨끝.칸 ? ' 켬' : '';
    return `<div class="줄${켬}">
      <span class="이름">${r.칸}</span>
      <span class="한칸"><span class="막대" style="width:${(자리(r.몫) * 자람).toFixed(2)}%"></span>
        <span class="값" style="opacity:${보임}">${r.몫}%</span></span>
    </div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${폭}px;height:${높}px;background:#12151c;color:#e9e9ee;
       font-family:'Malgun Gothic','맑은 고딕',system-ui,sans-serif;overflow:hidden}
  .판{padding:150px 84px}
  .머리{font-size:74px;font-weight:800;line-height:1.24;letter-spacing:-2px;
        opacity:${머리.toFixed(3)};transform:translateY(${((1 - 머리) * 26).toFixed(1)}px)}
  .곁{margin-top:22px;font-size:36px;color:#9aa2b1;opacity:${머리.toFixed(3)}}
  .표{margin-top:86px;opacity:${표나옴.toFixed(3)}}
  .줄{display:flex;align-items:center;margin-bottom:34px}
  .이름{width:250px;font-size:40px;color:#c3c8d4}
  .한칸{flex:1;position:relative;height:56px;display:flex;align-items:center}
  .막대{position:absolute;left:0;height:56px;border-radius:8px;background:#4a5468}
  .줄.켬 .막대{background:#e8b34f}
  .줄.켬 .이름{color:#e8b34f;font-weight:800}
  .값{position:relative;margin-left:18px;font-size:40px;font-weight:800;
      transform:translateX(calc(var(--w,0px)))}
  .뺄셈{margin-top:70px;padding:30px 34px;border-left:6px solid #e8b34f;
        background:#1b1f29;border-radius:10px;font-size:36px;line-height:1.6;
        color:#c3c8d4;opacity:${뺄셈.toFixed(3)}}
  .뺄셈 b{color:#e9e9ee}
  .맺음{margin-top:64px;font-size:44px;font-weight:800;line-height:1.45;
        opacity:${맺음.toFixed(3)}}
  .바닥{position:absolute;left:84px;bottom:120px;font-size:34px;color:#8b93a3}
  .집{color:#e8b34f;font-weight:700}
  </style></head><body><div class="판">
    <div class="머리">몇 살부터<br>돌봄이 필요해질까요</div>
    <div class="곁">${자료.최신}년 · 장기요양 인정을 받은 사람</div>
    <div class="표">${줄들}</div>
    <div class="뺄셈">
      ⛔ 표의 「계」에는 등급외가 들어 있습니다<br>
      판정 ${전체.판정.toLocaleString()}명 − 등급외 ${전체.등급외.toLocaleString()}명
      = <b>인정 ${전체.인정.toLocaleString()}명</b>
    </div>
    <div class="맺음">${맨끝.칸}에서도<br>${안받은몫}%는 인정을 받지 않았습니다.</div>
    <div class="바닥">국민건강보험공단 · <span class="집">${주소}</span></div>
  </div></body></html>`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const 칸들 = [0, 2, 5, 8, 11, 13.9].map(칸HTML);
  /* ⛔ <style> 을 먼저 걷어낸다. 안 걷으면 CSS 의 1080·150 같은 수가 「화면의 수」로 잡혀
     ⑩ 이 헛경보를 낸다 — 8/13 에 「셈은 맞고 뜻이 틀렸다」로 겪은 자리다 */
  const 온글 = 칸들.join('\n')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/style="[^"]*"/g, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다('① 열네 초다', 길이 === 14 && 초당 === 30);
  본다('② 세로다 — 1080×1920', 폭 === 1080 && 높 === 1920);
  본다(`③ 🔴 2번이 앞세우라 한 수가 화면에 있다 — ${맨끝.몫}%`, 온글.includes(`${맨끝.몫}%`));
  본다('④ ⛔ 「판정 − 등급외 = 인정」 뺄셈이 화면에 있다',
    온글.includes(전체.판정.toLocaleString()) && 온글.includes(전체.등급외.toLocaleString())
    && 온글.includes(전체.인정.toLocaleString()));
  본다(`⑤ ⛔ 안 받은 쪽도 센다 — ${안받은몫}%`, 온글.includes(`${안받은몫}%는 인정을 받지 않았습니다`));
  const 걸린훈수 = 훈수말.filter((w) => 온글.includes(w));
  본다(`⑥ ⛔ 훈수를 두지 않는다${걸린훈수.length ? ` — ${걸린훈수.join(' · ')}` : ''}`, 걸린훈수.length === 0);
  const 걸린금지 = 금지말.filter((w) => 온글.includes(w));
  본다(`⑦ ⛔ 줄을 세우지 않는다${걸린금지.length ? ` — ${걸린금지.join(' · ')}` : ''}`, 걸린금지.length === 0);
  본다('⑧ 🔴 데려갈 주소가 박혀 있다', 칸들.every((h) => h.includes(주소)));
  본다('⑨ 막대가 처음엔 0 이고 끝엔 다 자란다',
    /width:0\.00%/.test(칸HTML(0)) && 칸HTML(13.9).includes(`width:${자리(맨끝.몫).toFixed(2)}%`));

  /* ⑩ 화면의 수가 전부 자료에서 오나 — ⚠ 주소의 100 을 먼저 뺀다 */
  const 댈수 = new Set([
    ...몫있는칸.flatMap((r) => [r.몫, ...(r.칸.match(/\d+/g) || []).map(Number)]),
    전체.판정, 전체.등급외, 전체.인정, 안받은몫, Number(자료.최신), 맨끝.몫,
  ].filter((v) => v != null).map(String));
  const 수볼글 = 온글.replace(/100yearmap\.com\S*/g, ' ');
  const 못댄것 = [...수볼글.matchAll(/\d[\d,]*\.?\d*/g)].map((m) => m[0].replace(/,/g, ''))
    .filter((s) => !댈수.has(s));
  본다(`⑩ 화면의 수가 전부 자료에서 온다${못댄것.length ? ` — 못 댄 것: ${[...new Set(못댄것)].slice(0, 6).join(' · ')}` : ''}`,
    못댄것.length === 0);

  console.log(`\n${맨끝.칸} ${맨끝.몫}% · 인정 ${전체.인정.toLocaleString()}명 · ${자료.최신}년`);
  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 — 남이 불러 화면 글만 얻어 갈 수 있게 감싼다(8/16 규칙).
   ⚠ import.meta.url 로 견주면 윈도에서 조용히 안 돈다. 파일 이름으로 견딘다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'make-video-100y-care.mjs';
if (내가직접불렸나) {
  const 인자 = process.argv.slice(2);
  const 낼이름 = 인자.includes('--out') ? 인자[인자.indexOf('--out') + 1] : '몇살부터돌봄.mp4';
  const 낼곳 = path.join(여기, 'public/100y/video');
  fs.mkdirSync(낼곳, { recursive: true });
  const 칸방 = path.join(여기, 'out', '_칸-care');
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
