#!/usr/bin/env node
/**
 * make-video-kcw-spike.mjs — **오늘 튄 이름 한 편을 영상으로.** 14초 · 1080×1920 · 영어.
 *
 * ── 왜 «하나로 돌려 쓰는» 자인가 ────────────────────────────────
 * 사장님 지시(2026-08-29):
 *   「오늘 이순간 이슈되는 걸 찾아서 콘텐트로 만들어서 배포해.. **하루에 6번 정도 하도록**...
 *     동남아 시간으로 9시~19시 사이에 콘텐트 배포.. **영상에 캐릭터를 활용하던, 애니메이션
 *     캐릭터를 활용하던 자체 영상으로 서비스해. 달랑 카드, 그래픽 등 스틸이미지 쓰지마**」
 *
 * 🔴 하루 여섯 번이다. 편마다 새 자를 짓던 방식(앞의 스물넷)으로는 **못 지킨다.**
 *   그래서 이 자는 «소재를 받아» 만든다. 한 편에 드는 손이 명령 한 줄이어야 한다.
 * ⛔ 스틸 이미지를 안 낸다 — 캐릭터가 그려지며 들어오고, 끝에 풀려 자료의 선이 된다.
 *
 * ── ⛔ 이 편이 지키는 것 ────────────────────────────────────────
 * ⛔ **수를 이 자가 만들지 않는다.** 부르는 쪽이 «잰 것»을 넘긴다. 없으면 안 만든다.
 * ⛔ **왜 튀었는지 말하지 않는다.** 위키백과는 까닭을 안 적는다 — 우리도 모른다.
 *   ⭐ 그런데 그것이 이 편의 이야기다. 「움직인 것은 보이고, 까닭은 안 보인다」
 * ⛔ **나이를 이야기로 삼지 않는다.** 아이돌 그룹에는 미성년자가 섞여 있다 —
 *   나이로 사람을 모아 놓는 지면을 우리가 안 내기로 한 것과 같은 까닭이다.
 * ⛔ 판정하는 말을 안 쓴다 — 「인기」·「대세」·「역주행」은 우리 말이 아니다.
 * ⭐ 첫 화면이 **이름**으로 시작한다 — 사장님: 「인기검색어는 스타 이름·작품명」
 *
 * 쓰는 법
 *   node scripts/make-video-kcw-spike.mjs --이름="Hearts2Hearts" --갈래=group \
 *     --판=vi --오늘=349 --앞=174 --잰날=2026-08-28 --주소=/group/hearts2hearts \
 *     --덧="8 members, every birthday recorded" --out public/wikitip/video/spike.mp4
 *   node scripts/make-video-kcw-spike.mjs --selftest
 *   node scripts/make-video-kcw-spike.mjs --그림 6.5   (그 시각 한 칸을 PNG 로)
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

/** 판 코드 → 손님이 읽을 이름. ⛔ 모르는 코드는 지어내지 않는다 — null 이다 */
export const 판이름표 = {
  vi: 'Vietnamese', id: 'Indonesian', th: 'Thai', ms: 'Malay', en: 'English',
};

export function 판말(코드) {
  return 판이름표[String(코드 ?? '').trim().toLowerCase()] ?? null;
}

const ㄴ = (v) => Math.round(v * 100) / 100;
const 셈 = (n) => Number(n).toLocaleString('en-US');

/**
 * 배수를 손님이 읽는 말로. ⛔ 「폭증」·「역주행」으로 부풀리지 않는다 — 잰 것만 적는다.
 * ⛔ 앞이레가 0 이면 못 잰다(null). 0 으로 나누지 않는다.
 */
export function 배수말(오늘, 앞) {
  const a = Number(오늘); const b = Number(앞);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0 || a < 0) return null;
  return `${(a / b).toFixed(1)}×`;
}

/**
 * 소재를 받아 «온전한지» 본다.
 * ⛔ 하나라도 없으면 만들지 않는다. 빈 자리를 그럴듯한 말로 채우지 않는다.
 */
export function 소재검사(소재) {
  const 빠진 = [];
  for (const k of ['이름', '판', '오늘', '앞', '잰날', '주소']) {
    const v = 소재?.[k];
    if (v === undefined || v === null || String(v).trim() === '') 빠진.push(k);
  }
  if (Number(소재?.앞) <= 0) 빠진.push('앞(0보다 커야 한다)');
  if (!판말(소재?.판)) 빠진.push(`판(${소재?.판} — 아는 판이 아니다)`);
  return 빠진;
}

/** 갈래를 손님 말로. ⛔ 모르면 빈 글자 — 「스타」류로 부풀리지 않는다 */
export function 갈래말(갈래) {
  const g = String(갈래 ?? '').trim().toLowerCase();
  if (g === 'group' || g === '그룹') return 'group';
  if (g === 'person' || g === '사람') return 'name';
  if (g === 'title' || g === '작품') return 'title';
  return '';
}

export function 끼(초, ㄱ, ㄴ2) { return 사이(초, ㄱ, ㄴ2); }

/* ── 소재 — 명령줄에서 받는다 ───────────────────────────── */
const 인자 = (이름, 기본 = null) => {
  const a = process.argv.find((x) => x.startsWith(`--${이름}=`));
  return a ? a.slice(`--${이름}=`.length) : 기본;
};

export const 소재 = {
  이름: 인자('이름'),
  갈래: 인자('갈래', ''),
  판: 인자('판'),
  오늘: Number(인자('오늘', NaN)),
  앞: Number(인자('앞', NaN)),
  잰날: 인자('잰날'),
  주소: 인자('주소'),
  덧: 인자('덧', ''),
};

/* 자가시험은 소재 없이 돈다 — 시험용 소재를 쓴다 */
export const 시험소재 = {
  이름: 'Hearts2Hearts', 갈래: 'group', 판: 'vi', 오늘: 349, 앞: 174,
  잰날: '2026-08-28', 주소: '/group/hearts2hearts', 덧: '8 members, every birthday recorded',
};

export function 칸HTML(초, s = 소재) {
  const 머리 = 술술(끼(초, 0.9, 1.8));
  const 띠 = 술술(끼(초, 1.6, 2.1));
  const 한계 = 술술(끼(초, 2.6, 3.4));
  const 수 = 술술(끼(초, 5.0, 6.0));
  const 모름 = 술술(끼(초, 8.0, 8.9));
  const 끝 = 술술(끼(초, 11.6, 12.4));

  /* ⭐ 캐릭터가 크게 들어왔다 물러난다 — 첫 화면이 비면 3초에 넘어간다 */
  const 물러남 = 술술(끼(초, 1.7, 2.7));
  const 자리 = (큰, 작) => ㄴ(큰 + (작 - 큰) * 물러남);

  const 캐 = 캐릭터SVG(초, {
    들어옴: 0.1, 그리는초: 1.0,
    말함: [[1.9, 3.2], [5.2, 6.4]],
    가리킴: [[4.8, 7.2]],
    풀림: 11.4,
  });

  const 판 = 판말(s.판) ?? '';
  const 배 = 배수말(s.오늘, s.앞) ?? '';
  const 갈 = 갈래말(s.갈래);

  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0c1210;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    .판{position:absolute;inset:0}

    .누{position:absolute;left:${자리(232, 700)}px;top:${자리(470, 1400)}px;
        width:${자리(616, 320)}px;height:${자리(806, 418)}px;color:#5fc9a0}
    .누 svg{width:100%;height:100%}

    .띠{position:absolute;left:84px;top:96px;font-size:26px;font-weight:800;letter-spacing:.16em;
        color:#3d7d66;opacity:${ㄴ(띠)}}
    .큰{position:absolute;left:84px;right:84px;top:170px;opacity:${ㄴ(머리)};
        transform:scale(${ㄴ(0.88 + 0.12 * 머리)});transform-origin:left top}
    .큰 b{display:block;font-size:64px;font-weight:900;line-height:1.06;letter-spacing:-.03em;
          color:#e9f0ec}
    .큰 em{display:block;margin-top:18px;font-style:normal;font-size:36px;font-weight:900;
           color:#5fc9a0;letter-spacing:-.02em}

    /* ⛔⛔ 한계가 수보다 «먼저» 뜬다 */
    .한{position:absolute;left:84px;right:84px;top:540px;opacity:${ㄴ(한계)};
        transform:translateY(${ㄴ((1 - 한계) * 18)}px);
        border-left:6px solid #3d7d66;padding-left:28px}
    .한 h3{font-size:24px;font-weight:800;letter-spacing:.08em;color:#3d7d66;margin-bottom:12px}
    .한 p{font-size:31px;color:#bcc9c3;line-height:1.34}
    .한 b{color:#e9f0ec}

    .수{position:absolute;left:84px;right:400px;top:900px;opacity:${ㄴ(수 * (1 - 끝))}}
    .수 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d7a70;margin-bottom:16px}
    .수 .두{display:flex;align-items:baseline;gap:24px}
    .수 .a{font-size:78px;font-weight:900;color:#e9f0ec;line-height:1}
    .수 .화{font-size:40px;color:#5d7a70}
    .수 .b{font-size:78px;font-weight:900;color:#5fc9a0;line-height:1;
           transform:translateY(${ㄴ((1 - 수) * -26)}px)}
    .수 p{margin-top:16px;font-size:29px;color:#bcc9c3;line-height:1.35}
    .수 b{color:#e9f0ec}

    /* ⭐ 이 편의 핵 — 「움직인 것은 보이고, 까닭은 안 보인다」 */
    .모{position:absolute;left:84px;right:400px;top:1330px;opacity:${ㄴ(모름 * (1 - 끝))}}
    .모 h3{font-size:22px;font-weight:800;letter-spacing:.08em;color:#5d7a70;margin-bottom:12px}
    .모 p{font-size:30px;color:#bcc9c3;line-height:1.36}
    .모 b{color:#e9f0ec}

    .끝{position:absolute;left:84px;right:400px;top:1400px;opacity:${ㄴ(끝)};
        transform:scale(${ㄴ(0.96 + 0.04 * 끝)});transform-origin:left center}
    .끝 b{display:block;font-size:44px;font-weight:900;color:#e9f0ec;line-height:1.2}
    .끝 span{display:block;margin-top:16px;font-size:32px;font-weight:800;color:#5fc9a0}
    .끝 i{display:block;margin-top:10px;font-style:normal;font-size:23px;color:#5d7a70}
  </style>
  <div class="판">
    <div class="띠">KCULTUREWIRE.COM</div>

    <div class="큰">
      <b>${s.이름} was looked up ${배} more yesterday.</b>
      <em>On the ${판} Wikipedia${갈 ? ` \u00b7 a Korean ${갈}` : ''}</em>
    </div>

    <div class="한">
      <h3>BEFORE THE NUMBER</h3>
      <p>An encyclopaedia open is <b>not</b> a fan, a stream or a ticket. It counts people
        looking something up. Readers here also use the English edition, which cannot be split
        by country, so this is a <b>floor</b> on interest, not a measure of it.</p>
    </div>

    <div class="수">
      <h3>OPENS PER DAY \u00b7 WEEK BEFORE VS YESTERDAY</h3>
      <div class="두">
        <span class="a">${셈(s.앞)}</span>
        <span class="화">\u2192</span>
        <span class="b">${셈(s.오늘)}</span>
      </div>
      <p>Measured ${s.잰날}. The ${판} Wikipedia, daily opens by people.
        ${s.덧 ? `<b>${s.덧}.</b>` : ''}</p>
    </div>

    <div class="모">
      <h3>AND HERE IS WHAT WE DO NOT KNOW</h3>
      <p><b>Why.</b> Wikipedia records that a page was opened, never the reason.
        We can see attention move a day before anyone explains it \u2014 and we would rather
        show you the movement than invent the cause.</p>
    </div>

    <div class="끝">
      <b>We can see it move.<br>We cannot see why.</b>
      <span>kculturewire.com${s.주소}</span>
      <i>Wikimedia Pageviews, human traffic \u00b7 measured ${s.잰날}</i>
    </div>

    <div class="누">${캐}</div>
  </div>`;
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const S = 시험소재;
  const 글자만 = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
  const 재본다 = (이름, 값, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(값) : JSON.stringify(값) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.log(`  X ${이름}  ->  ${JSON.stringify(값)}`); }
  };
  const 투명도 = (t, 이름) => {
    const m = 칸HTML(t, S).match(new RegExp(`\\.${이름}\\{[^}]*opacity:([0-9.]+)`));
    return m ? Number(m[1]) : null;
  };

  /* ── 소재를 안 지어낸다 ── */
  재본다('⛔ 소재가 온전하면 빠진 것이 없다', 소재검사(S).length, 0);
  재본다('⛔ 이름이 없으면 만들지 않는다', 소재검사({ ...S, 이름: '' }).includes('이름'), true);
  재본다('⛔ 앞이레가 0 이면 만들지 않는다',
    소재검사({ ...S, 앞: 0 }).some((x) => x.startsWith('앞')), true);
  재본다('⛔ 모르는 판이면 만들지 않는다 — 판 이름을 지어내지 않는다',
    소재검사({ ...S, 판: 'zz' }).some((x) => x.startsWith('판')), true);
  재본다('판 코드를 손님 말로', [판말('vi'), 판말('ID'), 판말('zz')],
    ['Vietnamese', 'Indonesian', null]);

  재본다('배수를 적는다', 배수말(349, 174), '2.0×');
  재본다('⛔ 앞이 0 이면 배수를 못 낸다', 배수말(349, 0), null);
  재본다('⛔ 수가 아니면 못 낸다', 배수말('많이', 174), null);
  재본다('갈래를 손님 말로', [갈래말('group'), 갈래말('사람'), 갈래말('몰라')],
    ['group', 'name', '']);

  /* ── 캐릭터 ── */
  재본다('⭐ 캐릭터가 첫 1초에 이미 그려진다', /stroke-dashoffset/.test(칸HTML(0.5, S)), true);
  재본다('⭐ 캐릭터가 숫자보다 먼저 나온다', 투명도(0.5, '수'), 0);
  재본다('⭐ 캐릭터에 얼굴이 있다', /class="we"/.test(칸HTML(2.5, S)), true);
  재본다('⭐ 끝에 캐릭터가 풀려 선이 된다', (() => {
    const 관 = 칸HTML(12.6, S);
    return /class="ww"/.test(관) && !/class="we"/.test(관);
  })(), true);
  const 캐크기 = (t) => Number(칸HTML(t, S).match(/.누{[^}]*width:([0-9.]+)px/)?.[1] ?? 0);
  재본다('⭐⭐ 첫 화면에서 캐릭터가 크다', 캐크기(0.8) > 폭 * 0.5, true);
  재본다('⭐ 글이 뜨면 물러나 작아진다', 캐크기(3.5) < 캐크기(0.8) * 0.65, true);
  재본다('⛔ 슬라이드쇼가 아니다', (() => {
    const xs = [1, 2.5, 3.5, 5.5, 8.5, 12].map((t) => 칸HTML(t, S));
    return new Set(xs).size === xs.length;
  })(), true);

  /* 🔴 글자가 캐릭터에 안 가린다 — tworulers 에서 그려 보고 찾은 자리다 */
  const 오른끝 = (t, 이름) => 폭 - Number(칸HTML(t, S).match(new RegExp(`\\.${이름}\\{[^}]*right:([0-9.]+)px`))?.[1] ?? 0);
  const 캐왼끝 = (t) => Number(칸HTML(t, S).match(/\.누\{[^}]*left:([0-9.]+)px/)?.[1] ?? 폭);
  재본다('⭐⭐ 아래 글상자들이 캐릭터에 안 가린다',
    [8.5, 9.5, 11.4].every((t) => 오른끝(t, '모') <= 캐왼끝(t) && 오른끝(t, '수') <= 캐왼끝(t)), true);

  /* ── 이야기 ── */
  재본다('⭐ 첫 화면에 이름이 있다', 글자만(칸HTML(1.5, S)), (x) => x.includes(S.이름));
  재본다('⛔⛔ 한계가 수보다 먼저 뜬다', [투명도(3.6, '한'), 투명도(3.6, '수')],
    (v) => v[0] > 0.9 && v[1] < 0.05);
  재본다('⛔ 「열림은 팬이 아니다」를 적는다', 글자만(칸HTML(3.5, S)),
    (x) => /An encyclopaedia open is\s+not\s+a fan/.test(x.replace(/\s+/g, ' ')));
  재본다('⛔ 「바닥이지 측정이 아니다」를 적는다', 글자만(칸HTML(4, S)),
    (x) => /floor\s+on interest, not a measure/.test(x.replace(/\s+/g, ' ')));
  재본다('⭐ 두 수가 다 나온다', 글자만(칸HTML(7, S)),
    (x) => x.includes('174') && x.includes('349'));
  재본다('⭐ 잰 날을 적는다', 글자만(칸HTML(7, S)), (x) => x.includes(S.잰날));
  재본다('⭐⭐ 「왜인지는 모른다」가 나온다', 글자만(칸HTML(9.5, S)),
    (x) => /Why\.\s+Wikipedia records that a page was opened, never the reason/.test(x.replace(/\s+/g, ' ')));
  재본다('⭐ 끝에 「움직임은 보이고 까닭은 안 보인다」', 글자만(칸HTML(13, S)),
    (x) => /We can see it move/.test(x) && /cannot see why/.test(x));
  재본다('끝에 지면 주소가 있다', 글자만(칸HTML(13, S)), (x) => x.includes(`kculturewire.com${S.주소}`));

  /* ── ⛔ 우리가 안 하는 말 ── */
  재본다('XX 화면에 한국어가 한 자도 없다',
    [1.5, 3.5, 7, 9.5, 13].map((t) => 글자만(칸HTML(t, S))).join(''),
    (x) => !/[가-힣]/.test(x));
  재본다('⛔ 판정·과장하는 말을 안 쓴다',
    [1.5, 3.5, 7, 9.5, 13].map((t) => 글자만(칸HTML(t, S))).join('').replace(/kculturewire\.com\/\S+/g, ''),
    (x) => !/\b(viral|surge|surged|explode|skyrocket|hottest|trending|most popular|comeback|craze)\b/i.test(x));
  재본다('⛔⛔ 나이를 이야기로 삼지 않는다 — 미성년자가 섞여 있다',
    [1.5, 3.5, 7, 9.5, 13].map((t) => 글자만(칸HTML(t, S))).join(''),
    (x) => !/\bage[ds]?\b|\byears? old\b|\bborn in (19|20)\d\d\b|\bteen/i.test(x));

  console.log(실패 ? `\nX ${실패}개 틀렸다 (통과 ${통과})` : `OK 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 그림 한 칸 ─────────────────────────────────────────── */
if (내가돌려졌다 && process.argv.includes('--그림')) {
  const i = process.argv.indexOf('--그림');
  const 때 = Number(process.argv[i + 1] ?? 6);
  const 빠진 = 소재검사(소재);
  const S = 빠진.length ? 시험소재 : 소재;
  if (빠진.length) console.log(`⚠ 소재가 모자라 «시험 소재»로 그린다 — 빠진 것: ${빠진.join(', ')}`);
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });
  await p.setContent(칸HTML(때, S), { waitUntil: 'load' });
  const 낼길 = `C:/Users/User/AppData/Local/Temp/claude/spike-${String(때).replace('.', '_')}.png`;
  await p.screenshot({ path: 낼길 });
  await b.close();
  console.log(`OK ${낼길}`);
}

/* ── 영상 ───────────────────────────────────────────────── */
if (내가돌려졌다 && !process.argv.includes('--selftest') && !process.argv.includes('--그림')) {
  const 빠진 = 소재검사(소재);
  if (빠진.length) {
    console.error('⛔ 소재가 모자라 만들지 않는다. 빈 자리를 그럴듯한 말로 채우지 않는다.');
    console.error(`   빠진 것: ${빠진.join(', ')}`);
    console.error('\n   쓰는 법 — node scripts/make-video-kcw-spike.mjs \\');
    console.error('     --이름="Hearts2Hearts" --갈래=group --판=vi --오늘=349 --앞=174 \\');
    console.error('     --잰날=2026-08-28 --주소=/group/hearts2hearts --out <낼길>');
    process.exit(2);
  }

  const i = process.argv.indexOf('--out');
  const 낼길 = i >= 0 ? process.argv[i + 1] : 'kcw-shorts-spike.mp4';
  const 임시 = path.join(path.dirname(낼길), '_칸kcwspike');
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
    await p.setContent(칸HTML(n / 초당, 소재), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(임시, `${String(n).padStart(4, '0')}.png`) });
    if (n % 90 === 0) console.log(`  ${n}/${칸수}`);
  }
  await b.close();

  const ff = require('ffmpeg-static');
  execFileSync(ff, ['-y', '-framerate', String(초당), '-i', path.join(임시, '%04d.png'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.1', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-c:a', 'aac', '-b:a', '64k', '-shortest',
    '-movflags', '+faststart', 낼길], { stdio: 'ignore' });

  fs.rmSync(임시, { recursive: true, force: true });
  console.log(`OK ${낼길}  ${총초}초 · ${폭}x${높} · ${(fs.statSync(낼길).size / 1024).toFixed(0)}KB`);
}
