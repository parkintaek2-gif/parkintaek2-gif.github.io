#!/usr/bin/env node
/**
 * 곰곰이 — **백년지도 길잡이 캐릭터.** 이 파일이 정본이다.
 *
 * 🔴 사장님(2026-08-08 17:0x): **「캐릭터 크게. 더 귀엽게. 산업재산권에 등록할만한 수준으로」**
 *
 * ── 등록을 염두에 둔 설계 ────────────────────────────────────────
 * 디자인권은 **「한 색으로 칠해도 알아보는 실루엣」**이 있어야 힘이 있다.
 * 그래서 남이 흉내 내기 어려운 세 가지를 넣었다 — 이 셋이 곰곰이의 신원이다.
 *
 *   ① **지도 핀 귀**      귀가 동그라미가 아니라 **지도 핀(물방울)** 이다
 *   ② **나침반 머리깃**   정수리에 N 바늘이 붙어 있고 **늘 북쪽을 본다**
 *   ③ **등고선 배**       배에 **등고선 세 줄**이 있다
 *
 * ⛔ 이 셋을 빼지 마십시오. 빼면 그냥 노란 곰이고, 그건 등록이 안 됩니다.
 *
 * ── 비율 (이것도 등록 서류에 들어간다) ─────────────────────────
 *   머리 : 몸 = 2.2 : 1        큰 머리가 귀여움의 8할이다
 *   눈 사이 = 눈 지름 × 1.9    멀수록 어리게 보인다
 *   눈 높이 = 얼굴 아래 1/3    위에 두면 어른 얼굴이 된다
 *
 * ── 색 ──────────────────────────────────────────────────────
 *   금빛 #F0C85A · 진금 #D9A93C · 크림 #FBEEC6 · 먹 #3A2A10 · 볼 #F2A0A0
 *
 * 쓰는 법
 *   import { 곰곰이 } from './gomgomi.mjs'
 *   node scripts/gomgomi.mjs --시트 <png>     등록용 표정 시트를 뽑는다
 *   node scripts/gomgomi.mjs --selftest
 */

/* 아래 「내가 실행됐나」를 재는 데만 쓴다. 그림 만드는 데는 바깥 것이 하나도 안 든다 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 색 = {
  금빛: '#F0C85A', 진금: '#D9A93C', 크림: '#FBEEC6',
  먹: '#3A2A10', 볼: '#F2A0A0', 흰: '#FFFFFF',
};

/** 낼 수 있는 표정 — 늘리면 여기부터 늘린다 */
export const 기분들 = ['멀뚱', '놀람', '셈', '가리킴', '인사', '기쁨'];

/**
 * 곰곰이 한 마리.
 * @param {number} 초  움직임의 기준. 같은 초면 같은 그림이다
 * @param {{크기?:number, 기분?:string, 통통?:boolean}} 짓
 * @returns {string} `<svg>` 한 덩이. viewBox 는 -150 -190 300 380
 */
export function 곰곰이(초 = 0, 짓 = {}) {
  const { 크기 = 1, 기분 = '멀뚱', 통통 = true } = 짓;
  if (!기분들.includes(기분)) throw new Error(`모르는 기분: ${기분} — ${기분들.join('·')} 중에서 고르십시오`);

  /* 숨 — 멈추면 인형이 된다 */
  const 숨 = 통통 ? 1 + Math.sin(초 * 4.2) * 0.045 : 1;
  const 눌림 = 통통 ? 1 - (숨 - 1) * 0.85 : 1;
  /* 4.6초에 한 번 깜빡 */
  const 깜 = 통통 && (초 % 4.6) > 4.44 ? 0.07 : 1;
  /* 나침반 바늘은 몸이 기울어도 늘 북쪽 */
  const 몸기울기 = 통통 ? Math.sin(초 * 2.1) * 3.2 : 0;

  const 놀람 = 기분 === '놀람';
  const 눈r = 놀람 ? 30 : 25;
  const 눈사이 = 눈r * 1.9;

  const 입 = {
    놀람: `<ellipse cx="0" cy="62" rx="17" ry="23" fill="${색.먹}"/>
           <ellipse cx="0" cy="70" rx="10" ry="12" fill="#8a4a3a"/>`,
    셈: `<rect x="-19" y="55" width="38" height="10" rx="5" fill="${색.먹}"/>`,
    기쁨: `<path d="M -26 50 Q 0 84 26 50 Z" fill="${색.먹}"/>
           <path d="M -15 66 Q 0 78 15 66 Z" fill="#e8737a"/>`,
  }[기분] ?? `<path d="M -24 52 Q 0 76 24 52" stroke="${색.먹}" stroke-width="10" fill="none" stroke-linecap="round"/>`;

  const 팔각 = 기분 === '인사' ? -46 + Math.sin(초 * 8.5) * 30
    : 기분 === '가리킴' ? -62 : 14;
  const 반짝 = 깜 > 0.5 ? 1 : 0;

  return `<svg class="곰곰이" viewBox="-150 -190 300 380" width="${(300 * 크기).toFixed(0)}"
    style="overflow:visible">
  <g transform="scale(${숨.toFixed(3)},${눌림.toFixed(3)}) rotate(${몸기울기.toFixed(2)})">

    <ellipse cx="0" cy="168" rx="86" ry="15" fill="rgba(0,0,0,.22)"/>

    <!-- ② 나침반 머리깃 — 늘 북쪽을 본다 -->
    <g transform="rotate(${(-몸기울기).toFixed(2)})">
      <line x1="0" y1="-118" x2="0" y2="-166" stroke="${색.진금}" stroke-width="7" stroke-linecap="round"/>
      <path d="M 0 -186 L 13 -158 L 0 -164 L -13 -158 Z" fill="#D9534F"/>
      <path d="M 0 -152 L 9 -160 L 0 -164 L -9 -160 Z" fill="${색.크림}"/>
    </g>

    <!-- ① 지도 핀 귀 — 동그라미가 아니다 -->
    <g fill="${색.금빛}" stroke="${색.진금}" stroke-width="4">
      <path d="M -78 -96 C -104 -96 -118 -72 -108 -50 C -101 -34 -86 -22 -78 -14
               C -70 -22 -55 -34 -48 -50 C -38 -72 -52 -96 -78 -96 Z"/>
      <path d="M 78 -96 C 104 -96 118 -72 108 -50 C 101 -34 86 -22 78 -14
               C 70 -22 55 -34 48 -50 C 38 -72 52 -96 78 -96 Z"/>
    </g>
    <circle cx="-78" cy="-62" r="13" fill="${색.크림}"/>
    <circle cx="78" cy="-62" r="13" fill="${색.크림}"/>

    <!-- 몸 (머리보다 훨씬 작다 — 2.2 : 1) -->
    <ellipse cx="0" cy="132" rx="62" ry="46" fill="${색.금빛}"/>
    <ellipse cx="0" cy="140" rx="42" ry="32" fill="${색.크림}"/>
    <!-- ③ 등고선 배 -->
    <g stroke="${색.진금}" stroke-width="3.2" fill="none" opacity=".75">
      <path d="M -28 138 Q 0 126 28 138"/>
      <path d="M -20 148 Q 0 139 20 148"/>
      <path d="M -11 157 Q 0 151 11 157"/>
    </g>
    <ellipse cx="-34" cy="176" rx="19" ry="12" fill="${색.진금}"/>
    <ellipse cx="34" cy="176" rx="19" ry="12" fill="${색.진금}"/>

    <!-- 팔 -->
    <g transform="translate(-62 118) rotate(${(-팔각).toFixed(1)})">
      <rect x="-16" y="-15" width="52" height="30" rx="15" fill="${색.금빛}"/></g>
    <g transform="translate(62 118) rotate(${팔각.toFixed(1)})">
      <rect x="-36" y="-15" width="52" height="30" rx="15" fill="${색.금빛}"/></g>

    <!-- 머리 — 완전한 원이 아니라 아래가 넓은 초승달꼴. 이게 실루엣을 만든다 -->
    <path d="M 0 -108 C 62 -108 106 -64 106 -6 C 106 56 62 96 0 96
             C -62 96 -106 56 -106 -6 C -106 -64 -62 -108 0 -108 Z" fill="${색.금빛}"/>
    <path d="M 0 -108 C 62 -108 106 -64 106 -6 C 106 10 104 24 100 36
             C 88 -34 50 -72 0 -72 C -50 -72 -88 -34 -100 36
             C -104 24 -106 10 -106 -6 C -106 -64 -62 -108 0 -108 Z" fill="#F6D77E"/>

    <!-- 주둥이 -->
    <ellipse cx="0" cy="46" rx="60" ry="46" fill="${색.크림}"/>
    <ellipse cx="0" cy="20" rx="13" ry="9" fill="${색.먹}"/>

    <!-- 눈 — 크고, 하이라이트 둘 -->
    <g transform="translate(${-눈사이} -14)">
      <ellipse rx="${눈r}" ry="${(눈r * 깜).toFixed(1)}" fill="${색.먹}"/>
      <circle cx="9" cy="-10" r="8.5" fill="${색.흰}" opacity="${반짝}"/>
      <circle cx="-7" cy="8" r="4" fill="${색.흰}" opacity="${(반짝 * 0.7).toFixed(2)}"/>
    </g>
    <g transform="translate(${눈사이} -14)">
      <ellipse rx="${눈r}" ry="${(눈r * 깜).toFixed(1)}" fill="${색.먹}"/>
      <circle cx="9" cy="-10" r="8.5" fill="${색.흰}" opacity="${반짝}"/>
      <circle cx="-7" cy="8" r="4" fill="${색.흰}" opacity="${(반짝 * 0.7).toFixed(2)}"/>
    </g>

    <ellipse cx="-72" cy="30" rx="19" ry="12" fill="${색.볼}" opacity=".62"/>
    <ellipse cx="72" cy="30" rx="19" ry="12" fill="${색.볼}" opacity=".62"/>
    ${입}
  </g>
</svg>`;
}

/* ── 검사 ──
 * 🔴 2026-08-09 02:3x — **이 문이 남의 검사를 막고 있었다.** (2번이 02:1x 에 짚어 주셨다)
 *
 *   `process.argv` 만 보면, **남이 gomgomi 를 가져다 쓸 때도** 이 블록이 돈다.
 *   그리고 아래 `process.exit` 에서 **프로세스가 죽는다** — 가져다 쓰는 쪽 검사는 한 줄도 못 돈다.
 *   ⛔ 그런데 화면에는 「✅ 검사 12개 통과」가 찍힌다. **안 돌고 통과한 것이다.**
 *
 *   실제로 잃은 것 —
 *     make-video-kcw.mjs   자기 검사 14개 · **한 번도 안 돎**
 *     make-video2.mjs      자기 검사 있음 · **한 번도 안 돎**
 *   ⚠ 둘 다 「12개 통과」와 비슷한 꼴로 찍혀서 눈에도 안 걸렸다.
 *
 * ⭐ 팀 규칙 그대로다 — **「없다·0 은 결과로 안 받고 자를 먼저 의심한다」**.
 *    여기선 **「통과」가 결과로 안 받아야 할 것**이었다.
 *
 * ⛔ 그래서 **내가 실행된 때만** 돈다. 가져다 쓰는 쪽은 자기 검사를 돌린다.
 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${String(실제).slice(0, 120)}`); }
  };
  재본다('svg 를 낸다', 곰곰이(0), (s) => s.startsWith('<svg') && s.endsWith('</svg>'));
  재본다('모르는 기분은 던진다', (() => { try { 곰곰이(0, { 기분: '엉뚱' }); return '안 던짐'; } catch { return '던짐'; } })(), '던짐');
  재본다('기분마다 그림이 다르다', 기분들.map((g) => 곰곰이(0, { 기분: g })), (xs) => new Set(xs).size === xs.length);
  재본다('초가 다르면 그림도 다르다', [곰곰이(0), 곰곰이(0.3)], (x) => x[0] !== x[1]);
  재본다('통통을 끄면 멈춘다', [곰곰이(0, { 통통: false }), 곰곰이(2, { 통통: false })], (x) => x[0] === x[1]);
  /* 🔴 신원 셋 — 이게 빠지면 등록할 게 없다 */
  재본다('① 지도 핀 귀가 있다', 곰곰이(0), (s) => /C -104 -96 -118 -72 -108 -50/.test(s));
  재본다('② 나침반 바늘이 있다', 곰곰이(0), (s) => s.includes('#D9534F'));
  재본다('③ 등고선 배가 세 줄이다', 곰곰이(0), (s) => (s.match(/Q 0 1\d\d? \d+ 1\d\d/g) ?? []).length >= 3);
  재본다('나침반은 몸이 기울어도 북쪽', 곰곰이(1.2), (s) => /rotate\(-?\d/.test(s));
  재본다('놀라면 눈이 커진다',
    [곰곰이(0, { 기분: '멀뚱', 통통: false }), 곰곰이(0, { 기분: '놀람', 통통: false })],
    (x) => x[1].includes('rx="30"') && x[0].includes('rx="25"'));
  재본다('색이 다섯 가지 다 있다', 곰곰이(0), (s) => Object.values(색).every((c) => s.includes(c) || c === '#FFFFFF'));
  재본다('크기를 키우면 width 가 커진다', 곰곰이(0, { 크기: 2 }), (s) => s.includes('width="600"'));
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 등록용 시트 ── */
const i = process.argv.indexOf('--시트');
if (i >= 0) {
  const { createRequire } = await import('node:module');
  const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
  const puppeteer = require('puppeteer-core');
  const 낼길 = process.argv[i + 1] ?? '곰곰이-시트.png';

  const 칸 = 기분들.map((g) => `<div class="칸">
      <div class="그림">${곰곰이(0.7, { 기분: g, 크기: 0.62, 통통: false })}</div>
      <div class="이름">${g}</div>
    </div>`).join('');

  const html = `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1600px;background:#fffdf6;font-family:'Pretendard','Malgun Gothic',sans-serif;
         color:#2b2a26;padding:64px 72px}
    h1{font-size:52px;font-weight:900;letter-spacing:-.03em}
    .부{font-size:23px;color:#7b756a;margin:10px 0 4px}
    .큰{display:flex;gap:56px;align-items:center;margin:36px 0 12px;
        border-top:3px solid #2b2a26;border-bottom:1px solid #ddd6c4;padding:34px 0}
    .큰 .설명 h2{font-size:30px;margin-bottom:14px}
    .큰 .설명 li{list-style:none;font-size:21px;line-height:1.85;color:#4a463d}
    .큰 .설명 b{color:#8a6b1e}
    .줄{display:flex;gap:14px;flex-wrap:wrap;margin-top:26px}
    .칸{width:236px;border:1px solid #e3dcc9;border-radius:14px;background:#fff;
        padding:18px 10px 12px;text-align:center}
    .그림{height:224px;display:flex;align-items:center;justify-content:center}
    .이름{font-size:20px;font-weight:800;color:#5c5648;margin-top:8px}
    .색{display:flex;gap:12px;margin-top:30px}
    .색 div{flex:1;border-radius:10px;padding:14px 12px;font-size:16px;font-weight:700;
            border:1px solid rgba(0,0,0,.12)}
    .끝{margin-top:30px;font-size:17px;color:#8b8577;line-height:1.7}
  </style>
  <h1>곰곰이 <span style="font-size:26px;color:#8a6b1e">GOMGOMI</span></h1>
  <div class="부">백년지도 길잡이 캐릭터 · 주식회사 케이라이프디자인 · 2026-08-08</div>

  <div class="큰">
    <div>${곰곰이(0.7, { 크기: 1.15, 통통: false })}</div>
    <div class="설명">
      <h2>남과 구별되는 세 가지</h2>
      <ul>
        <li>① <b>지도 핀 귀</b> — 귀가 동그라미가 아니라 지도 위의 핀(물방울)이다</li>
        <li>② <b>나침반 머리깃</b> — 정수리에 붉은 N 바늘이 있고, 몸이 기울어도 늘 북쪽을 가리킨다</li>
        <li>③ <b>등고선 배</b> — 배에 지도 등고선 세 줄이 있다</li>
      </ul>
      <h2 style="margin-top:22px">비율</h2>
      <ul>
        <li>머리 : 몸 = <b>2.2 : 1</b></li>
        <li>눈 사이 = 눈 지름 × <b>1.9</b></li>
        <li>눈 높이 = 얼굴 아래 <b>1/3</b></li>
      </ul>
    </div>
  </div>

  <div class="줄">${칸}</div>

  <div class="색">
    <div style="background:#F0C85A">금빛 #F0C85A</div>
    <div style="background:#D9A93C">진금 #D9A93C</div>
    <div style="background:#FBEEC6">크림 #FBEEC6</div>
    <div style="background:#3A2A10;color:#fff">먹 #3A2A10</div>
    <div style="background:#F2A0A0">볼 #F2A0A0</div>
    <div style="background:#D9534F;color:#fff">북침 #D9534F</div>
  </div>

  <div class="끝">
    전부 벡터(SVG)로 그렸습니다 — 아무리 키워도 뭉개지지 않습니다.
    정본은 <b>scripts/gomgomi.mjs</b> 한 곳이고, 카드뉴스·영상·지면이 모두 여기서 가져다 씁니다.
  </div>`;

  const b = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: 낼길, fullPage: true });
  await b.close();
  const fs = await import('node:fs');
  console.log(`✅ ${낼길}  (${(fs.statSync(낼길).size / 1024).toFixed(0)}KB)`);
}
