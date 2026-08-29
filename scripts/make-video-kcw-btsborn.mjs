#!/usr/bin/env node
/**
 * make-video-kcw-btsborn.mjs — **K Culture Wire 쇼츠.** 14초 · 1080×1920 · 영어.
 *   「Which BTS member is from Busan?」 (`/bts-hometowns`)
 *
 * ── 왜 이 편인가 (2026-08-29) ────────────────────────────────────
 * 사장님 지시 — 「**인기 검색어는 스타 이름·작품명·노래제목이다**」·
 * 「영상은 텍스트 콘텐트 중에서 괜찮은 걸로 절반 정도의 양으로 해」.
 * 오늘 낸 `/bts-hometowns` 에서 나온 수다. ⛔ 새 수를 만들지 않는다.
 * 🔴 잰 수요 — BTS 고향을 물어본 질의가 열일곱, 노출 30회, 자리 3~11위.
 *
 * ── ⭐ 이야기 한 줄 ──────────────────────────────────────────────
 * **부산 둘(Jimin·Jungkook) · 대구 둘(Suga·V) · 광주 하나 · 고양 하나 · 과천 하나.**
 * 🔴 그런데 우리가 아는 것은 «태어난 곳»이지 «고향»이 아니다.
 *
 * ── ⛔ 이 편이 흐리면 안 되는 것 ────────────────────────────────
 * **P19 는 태어난 곳이다. 병원이 있는 도시가 적히는 일이 흔하다.**
 * 손님은 「from」이라고 묻는데 우리는 「born in」으로만 답할 수 있다 —
 * 그 «차이»를 화면에 적는 것이 우리 일이다. 물음말을 되돌려 주면서 틀린 확신을 주지 않는다.
 * ⛔ 화면에 「hometown」이라고 쓰지 않는다. 검사로 못박는다.
 * ⛔ 나이·생일을 화면에 안 쓴다 — 아이돌 그룹에는 미성년자가 섞인다.
 * ⛔ 화면에 한국어를 안 쓴다.
 * 🔴 **소리 없는 판을 내지 않는다** — 이 자는 그림만 만들고 공개 폴더에 못 쓴다.
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-btsborn.mjs --selftest
 *   node scripts/make-video-kcw-btsborn.mjs --그림 9.0
 *   node scripts/make-video-kcw-btsborn.mjs --out archive/silent-source/btsborn.mp4
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { 캐릭터SVG, 사이, 술술 } from './kcw-character.mjs';

const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');

export const 초당 = 30;
export const 폭 = 1080;
export const 높 = 1920;
export const 총초 = 14;

const d = JSON.parse(fs.readFileSync('src/data/kcw-bts-hometowns.json', 'utf8'));

/** 이름 여럿을 사람이 읽는 말로. ⛔ 빈 줄이면 null — 「없음」이라 안 쓴다 */
export function 이름줄(다) {
  const v = (다 ?? []).filter(Boolean);
  if (!v.length) return null;
  if (v.length === 1) return v[0];
  if (v.length === 2) return `${v[0]} and ${v[1]}`;
  return `${v.slice(0, -1).join(', ')} and ${v[v.length - 1]}`;
}

/** 도시 하나를 이름으로 찾는다. ⛔ 없으면 null — 지어내지 않는다 */
export function 도시찾기(이름, 자료 = d) {
  return (자료.byCity ?? []).find((c) => c.place === 이름) ?? null;
}

/** 사람이 둘 이상인 도시가 먼저 — 물음이 그렇게 오기 때문이다 */
export function 도시줄세우기(자료 = d) {
  return [...(자료.byCity ?? [])].sort((a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0)
    || String(a.place).localeCompare(String(b.place)));
}

export const 도시들 = 도시줄세우기();
export const 부산 = 도시찾기('Busan');
export const 대구 = 도시찾기('Daegu');
export const 찾은수 = d.found;

if (!부산 || !대구 || !Number.isFinite(찾은수) || 도시들.length < 3) {
  throw new Error('⛔ 자료에서 도시를 못 읽었다 — 지어내지 않고 멈춘다');
}
/* ⛔ 일곱 명이 다 안 잡혔으면 「일곱 명」이라고 말하지 않는다 */
if (찾은수 !== (d.members ?? []).length) {
  console.warn(`⚠ 일곱 중 ${찾은수}명만 잡혔다 — 화면에 그 수를 그대로 쓴다`);
}

export function 끼(초, ㄱ, ㄴ) { return 사이(초, ㄱ, ㄴ); }
const ㄴ = (v) => Math.round(v * 100) / 100;

export function 칸HTML(초) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 답 = 술술(끼(초, 5.0, 6.0));
  const 표 = 술술(끼(초, 7.6, 8.6));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1,
    그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.4]],
    가리킴: [[4.6, 7.2]],
    풀림: 11.4,
  });

  const 줄들 = 도시들.map((c) => `<tr><td class="ㄹ">${c.place}</td>`
    + `<td class="ㅁ">${이름줄(c.members) ?? '&mdash;'}</td></tr>`).join('');

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0b1014;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}

    .누{position:absolute;left:${자리(232, 690)}px;top:${자리(470, 1392)}px;
        width:${자리(616, 330)}px;height:${자리(806, 430)}px;color:#5fb3c4}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#3d7d8c;opacity:${ㄴ(띠)}}
    .큰{position:absolute;left:84px;right:84px;top:170px;opacity:${ㄴ(머리)};
        transform:scale(${ㄴ(0.88 + 0.12 * 머리)});transform-origin:left top}
    .큰 b{display:block;font-size:64px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
          color:#e7edf0}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:40px;font-weight:900;
           color:#5fb3c4;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 답보다 «먼저» 뜬다 — 「born in」과 「from」은 다른 말이다 */
    .한{position:absolute;left:84px;right:84px;top:520px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d8c;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d8c;margin-bottom:12px}
    .한 p{font-size:31px;color:#b9c6cc;line-height:1.34}
    .한 b{color:#e7edf0}

    /* 🔴 [2026-08-29] 처음에 74px 로 두 이름을 겹쳐 놨더니 «세 줄로 넘쳐» 아래 표를 덮었다.
       자가시험 30개가 다 통과했다 — 검사는 글이 «있나»만 보지 «넘치나»는 못 본다.
       ⭐ 그려서 눈으로 보고 찾았다. 오늘 두 번째다. */
    .답{position:absolute;left:84px;right:400px;top:860px;opacity:${ㄴ(답 * (1 - 끝))}}
    .답 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:16px}
    .답 .줄{display:flex;align-items:baseline;gap:18px;margin-bottom:10px}
    .답 .곳{font-size:34px;font-weight:900;color:#5d707a;width:150px;flex:none}
    .답 .누구{font-size:46px;font-weight:900;color:#5fb3c4;line-height:1.1}

    .표{position:absolute;left:84px;right:400px;top:1160px;opacity:${ㄴ(표 * (1 - 끝))}}
    .표 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d707a;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    td{padding:10px 0;border-top:1px solid #1b2830;vertical-align:baseline}
    .ㄹ{font-size:25px;font-weight:900;color:#5fb3c4;width:210px}
    .ㅁ{font-size:25px;font-weight:700;color:#b9c6cc}

    .끝{position:absolute;left:84px;right:84px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e7edf0;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#5fb3c4}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d707a}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>Which BTS member is from Busan?</b>
      <em>${이름줄(부산.members)}</em>
    </div>

    <div class="한">
      <h3>BEFORE THE ANSWER</h3>
      <p>Wikidata records a <b>place of birth</b>, and that is not the same thing as where
        somebody is from. A hospital city is often recorded instead of the town a person
        grew up in.</p>
    </div>

    <div class="답">
      <h3>THE TWO CITIES WITH MORE THAN ONE</h3>
      <div class="줄"><span class="곳">BUSAN</span>
        <span class="누구">${이름줄(부산.members)}</span></div>
      <div class="줄"><span class="곳">DAEGU</span>
        <span class="누구">${이름줄(대구.members)}</span></div>
    </div>

    <div class="표">
      <h3>ALL ${찾은수} &middot; CITY OF BIRTH</h3>
      <table><tbody>${줄들}</tbody></table>
    </div>

    <div class="끝">
      <b>Born in, not from.<br>We keep the two apart.</b>
      <span>kculturewire.com/bts-hometowns</span>
      <i>Wikidata place of birth (P19) &middot; measured ${d.generated}</i>
    </div>

    <div class="누">${캐}</div>
  </div>`;
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (이름, 값, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(값) : JSON.stringify(값) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.log(`  X ${이름}  ->  ${JSON.stringify(값)}`); }
  };
  const 투명도 = (t, 이름) => {
    const m = 칸HTML(t).match(new RegExp(`\\.${이름}\\{[^}]*opacity:([0-9.]+)`));
    return m ? Number(m[1]) : null;
  };

  /* ── 자 ── */
  재본다('이름 둘을 and 로 잇는다', 이름줄(['A', 'B']), 'A and B');
  재본다('하나면 그대로', 이름줄(['A']), 'A');
  재본다('셋이면 쉼표와 and', 이름줄(['A', 'B', 'C']), 'A, B and C');
  재본다('⛔ 빈 줄은 null 이지 「없음」이 아니다', 이름줄([]), null);
  재본다('⛔ 빈 것도 안 터진다', 이름줄(undefined), null);
  재본다('도시를 이름으로 찾는다', 도시찾기('Busan') !== null, true);
  재본다('⛔ 없는 도시는 null', 도시찾기('Atlantis'), null);
  재본다('사람이 둘인 도시가 앞에 온다', 도시들[0].members.length >= 도시들[도시들.length - 1].members.length, true);

  /* ── 자료 ── */
  재본다('부산에 둘이다', 부산.members.length, 2);
  재본다('대구에 둘이다', 대구.members.length, 2);
  재본다('⛔ 도시 줄에 사람이 없는 칸이 없다', 도시들.every((c) => (c.members ?? []).length > 0), true);
  재본다('찾은 사람 수와 도시 속 사람 수가 맞는다',
    도시들.reduce((n, c) => n + c.members.length, 0), 찾은수);

  /* ── 캐릭터 ── */
  재본다('⭐ 캐릭터가 첫 1초에 이미 그려진다', /stroke-dashoffset/.test(칸HTML(0.5)), true);
  재본다('⭐ 캐릭터가 표보다 먼저 나온다', 투명도(0.5, '표'), 0);
  재본다('⭐ 캐릭터에 얼굴이 있다', /class="we"/.test(칸HTML(2.5)), true);
  재본다('⭐ 끝에 캐릭터가 풀려 선이 된다', (() => {
    const 관 = 칸HTML(12.6);
    return /class="ww"/.test(관) && !/class="we"/.test(관);
  })(), true);
  const 캐크기 = (t) => Number(칸HTML(t).match(/\.누\{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
  재본다('⭐⭐ 첫 화면에서 캐릭터가 크다', 캐크기(0.8) > 폭 * 0.5, true);

  /* ── 움직임과 차례 ── */
  재본다('⛔ 칸마다 다르다 — 슬라이드쇼가 아니다',
    (() => { const xs = [1, 2.5, 3.5, 5, 7, 9, 12].map(칸HTML); return new Set(xs).size === xs.length; })(), true);
  재본다('⛔ 마지막도 움직인다', 칸HTML(13.0) !== 칸HTML(13.1), true);
  재본다('⛔⛔ 한계가 답보다 먼저 뜬다', 투명도(3.6, '답'), 0);
  재본다('3.6초에 한계는 다 떴다', 투명도(3.6, '한'), 1);

  /* ── 글 ── */
  재본다('⭐ 첫 화면에 Busan 과 답이 같이 나온다', 글자만(칸HTML(1.5)),
    (s) => /Busan/.test(s) && 부산.members.every((m) => s.includes(m)));
  재본다('⭐ 대구도 이름으로 나온다', 글자만(칸HTML(9)),
    (s) => /Daegu/.test(s) && 대구.members.every((m) => s.includes(m)));
  /* ⚠ 우리 «지면 주소»에 hometowns 가 들어 있다 — 손님이 검색하는 말이라 주소로 쓴 것이고,
     본문에서 「태어난 곳」을 「고향」이라 부르는 것과 다르다. 주소를 뺀 나머지만 본다.
     ⛔ 검사를 지우지 않는다 — 지우면 본문에 hometown 이 들어와도 아무 자도 안 걸린다. */
  재본다('⛔⛔ 본문에서 「born in」을 「hometown」이라 부르지 않는다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (s) => !/hometown/i.test(s));
  재본다('⛔ 「태어난 곳은 고향이 아니다」를 답보다 먼저 적는다', 글자만(칸HTML(4)),
    (s) => /place of birth/i.test(s) && /not the same thing/i.test(s));
  재본다('⛔ 나이·생일을 화면에 안 쓴다',
    [1.5, 4, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/\b(age|aged|born in (19|20)\d\d|birthday)\b/i.test(s));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13)),
    (s) => s.includes('kculturewire.com/bts-hometowns'));
  재본다('출처와 잰 날을 적는다', 글자만(칸HTML(13)),
    (s) => /Wikidata/.test(s) && s.includes(String(d.generated)));
  재본다('표에 도시가 다 있다', (칸HTML(9).match(/class="ㄹ/g) ?? []).length, 도시들.length);
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9, 13].map((t) => 글자만(칸HTML(t))).join(''),
    (s) => !/[가-힣]/.test(s));

  console.log(실패 ? `\nX ${실패}개 틀렸다 (통과 ${통과})` : `OK 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가돌려졌다 && process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--그림');
  const 때 = Number(process.argv[i + 1] ?? 9);
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  await p.setContent(칸HTML(때), { waitUntil: 'load' });
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/btsborn-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'archive/silent-source/btsborn.mp4';
  if (낼길.includes('public/')) {
    console.error('🔴 공개 폴더에 바로 내지 않는다 — 이 자는 «소리 없는» 그림만 만든다.');
    console.error('   사장님 「무성 콘텐트 다신 만들지 말 것」. make-kcw-sound.mjs 를 거쳐야 콘텐트가 된다.');
    process.exit(1);
  }
  const 임시 = path.join(path.dirname(낼길), '_칸kcwbtsborn');
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.mkdirSync(임시, { recursive: true });

  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });

  const 칸수 = Math.round(총초 * 초당);
  for (let n = 0; n < 칸수; n += 1) {
    await p.setContent(칸HTML(n / 초당), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(임시, `${String(n).padStart(4, '0')}.png`) });
    if (n % 90 === 0) console.log(`  ${n}/${칸수}`);
  }
  await b.close();

  /* ⛔ anullsrc 를 «안» 붙인다 — 무음 트랙 결함의 뿌리였다 */
  const ff = require('ffmpeg-static');
  execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png'),
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-an', '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
  console.log('🔴 이것은 «아직 콘텐트가 아니다» — 소리가 없다:');
  console.log('   node scripts/make-kcw-sound.mjs --set btsborn --원본 <이 파일> --목소리 en-US-AndrewNeural');
}
