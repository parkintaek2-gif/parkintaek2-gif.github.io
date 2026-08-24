#!/usr/bin/env node
/**
 * make-kcw-cardnews.mjs — **K Culture Wire 기사에서 카드뉴스를 뽑는다.** (5번, 2026-08-24)
 *
 * ── 왜 이 자가 생겼나 ────────────────────────────────────────
 * 사장님이 물으셨다(2026-08-24): 「숏영상, 카드, 카드뉴스도 만들어서 외부 플랫폼에
 * 노출하고 있지?」 재 보니 **내 기사의 카드뉴스는 0개**였다. 3·6번은 51묶음을 냈는데
 * 나는 채널 문안 117편을 만들어 `docs/소셜-문안-5번` 에 쌓아만 두었다.
 * 🔴 **올리지 않은 것은 노출이 아니다.** 만들지도 않은 것은 더하다.
 *
 * ── ⛔ 이 자가 지키는 것 — 여기가 이 자의 전부다 ────────────
 * ⛔ **문안을 지어내지 않는다.** 카드에 쓰는 글자는 **기사 앞말에서만** 온다 —
 *   `title` · `dek` · `crossChecks`. 본문에서 문장을 긁어 오지 않는다.
 *   본문을 긁으면 맥락이 떨어진 문장이 카드로 떠돌고, 그것이 우리가 제일 안 하는 짓이다.
 * ⛔ **주소 없는 카드는 안 만든다.** 모든 장에 `kculturewire.com/article/<slug>` 를 박는다.
 *   카드는 우리 지면을 떠나 혼자 돌아다닌다. 주소가 없으면 유입이 0이고 출처도 없다.
 * ⛔ **한계 카드를 뺄 수 없다.** 마지막에서 두 번째 장은 `crossChecks` 에서 온 한계다.
 *   숫자만 예쁘게 실어 보내는 것은 우리 강령을 어긴다 — 수는 한계를 데리고 다녀야 한다.
 *   그래서 `crossChecks` 가 없는 기사는 **카드를 안 만든다.** 억지로 채우지 않는다.
 * ⛔ **영어로 쓴다.** 손님이 해외다. 한글은 작품 제목에만 허용된다.
 * ⛔ 숫자를 이 자가 계산하지 않는다. `wikitip-og-cards.json` 에 **사람이 골라 적고
 *   기사 본문에 실제로 있는지 확인된** figure 만 쓴다. 없으면 표지에 수를 안 넣는다.
 *
 * ── 규격 ────────────────────────────────────────────────────
 * 1:1  1080×1080  인스타·페이스북·X
 * 9:16 1080×1920  쇼츠·릴스·틱톡
 * ⚠ 어느 채널을 먼저 열지 사장님 판단 대기 중이라 **두 벌 다** 만들어 둔다.
 *
 * 쓰는 법
 *   node scripts/make-kcw-cardnews.mjs --selftest
 *   node scripts/make-kcw-cardnews.mjs --낸다 --기사=most-korean-titles-never-leave-home
 *   node scripts/make-kcw-cardnews.mjs --낸다 --전부
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { 앞말, 앞말값, 한글몫, 한국어문턱 } from './kcw-deploy-quiz.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 기사방 = path.join(ROOT, 'content', 'kculturewire');
const 낼방 = path.join(ROOT, 'public', 'wikitip', 'cardnews');
const 고른것 = path.join(ROOT, 'src', 'data', 'wikitip-og-cards.json');

const 직접불렸나 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/* ── 판단하는 함수들. 여기만 자가시험한다 ────────────────────── */

export const 규격 = [
  { 이름: 'sq', 폭: 1080, 높이: 1080 },
  { 이름: 'v', 폭: 1080, 높이: 1920 },
];

export const 색 = {
  바탕: '#141021', 글: '#f4f1fa', 수: '#c4a7ff', 흐림: '#9d94b5', 줄: '#2c2440',
};

/** 글자를 안전하게. ⛔ `&` 하나가 SVG 를 깨뜨린다 */
export function 막는다(글) {
  return String(글 ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * 글을 폭에 맞춰 줄로 나눈다.
 * ⛔ 넘치면 **자르지 않고 줄을 늘린다.** 자르면 문장이 반토막 나서 뜻이 바뀐다.
 *   장 수가 늘어나는 것이 뜻이 바뀌는 것보다 낫다.
 */
export function 줄나누기(글, 한줄글자) {
  const 낱말 = String(글 ?? '').trim().split(/\s+/).filter(Boolean);
  if (!낱말.length) return [];
  const 줄 = []; let 이번 = '';
  for (const w of 낱말) {
    if (!이번) { 이번 = w; continue; }
    if (`${이번} ${w}`.length <= 한줄글자) 이번 = `${이번} ${w}`;
    else { 줄.push(이번); 이번 = w; }
  }
  if (이번) 줄.push(이번);
  return 줄;
}

/**
 * 기사 하나에서 **카드로 만들 재료**를 뽑는다.
 * ⛔ 재료가 모자라면 `null` 을 돌려준다 — 억지로 채우지 않는다. 안 만드는 것이 결과다.
 */
export function 재료뽑기(원문, slug, 고른figure) {
  const 머리 = 앞말(원문);
  if (!머리) return { 못만드는까닭: '앞말이 없다' };
  const title = 앞말값(원문, 'title');
  const dek = 앞말값(원문, 'dek');
  if (!title) return { 못만드는까닭: 'title 이 없다' };
  if (!dek) return { 못만드는까닭: 'dek 이 없다' };

  /* 한계는 crossChecks 첫 줄에서 온다. ⛔ 없으면 카드를 안 만든다 */
  const 한계 = 크로스첫줄(원문);
  if (!한계) return { 못만드는까닭: 'crossChecks 가 없다 — 한계 없는 카드는 안 만든다' };

  /* ⛔ 영문 매체다. 앞말에 한글이 많으면 안 만든다 */
  for (const [이름, 값] of [['title', title], ['dek', dek], ['한계', 한계]]) {
    if (한글몫(값) > 한국어문턱) return { 못만드는까닭: `${이름} 에 한글이 ${한국어문턱}% 넘는다` };
  }

  return {
    slug,
    title,
    dek,
    한계,
    figure: 고른figure?.figure ?? null,
    label: 고른figure?.label ?? null,
    주소: `kculturewire.com/article/${slug}`,
  };
}

/** `crossChecks:` 아래 첫 `- "…"` 을 꺼낸다. ⛔ 본문은 안 본다 */
export function 크로스첫줄(원문) {
  const 줄들 = String(원문 ?? '').split(/\r?\n/);
  let 안 = false;
  for (const l of 줄들) {
    if (/^crossChecks:\s*$/.test(l)) { 안 = true; continue; }
    if (안) {
      const m = l.match(/^\s+-\s+"(.*)"\s*$/);
      if (m) return m[1];
      if (/^\S/.test(l)) return null;   /* 다음 열쇠로 넘어갔다 */
    }
  }
  return null;
}

/**
 * 재료를 장으로 가른다. **장 수는 넷으로 고정하지 않는다** — 글이 길면 늘린다.
 * ⛔ 마지막에서 두 번째는 **항상 한계**다. 순서를 바꾸지 않는다.
 */
export function 장으로(재료) {
  const 장 = [];
  장.push({ 꼴: '표지', 큰: 재료.figure, 작은: 재료.label, 글: 재료.title });
  for (const 토막 of 토막내기(재료.dek, 190)) 장.push({ 꼴: '수', 글: 토막 });
  장.push({ 꼴: '한계', 글: 재료.한계 });
  장.push({ 꼴: '주소', 글: 재료.주소 });
  return 장;
}

/** 긴 글을 여러 장으로. ⛔ 자르지 않고 문장 경계에서 나눈다 */
export function 토막내기(글, 한장글자) {
  const 문장 = String(글 ?? '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const 토막 = []; let 이번 = '';
  for (const s of 문장) {
    if (!이번) { 이번 = s; continue; }
    if (`${이번} ${s}`.length <= 한장글자) 이번 = `${이번} ${s}`;
    else { 토막.push(이번); 이번 = s; }
  }
  if (이번) 토막.push(이번);
  return 토막;
}

/** 한 장을 SVG 로. 규격에 따라 자리를 다시 잡는다 */
export function 그리기(장, 번호, 총, 규, 주소) {
  const { 폭, 높이 } = 규;
  const 여백 = Math.round(폭 * 0.09);
  const 세로긴가 = 높이 > 폭 * 1.2;
  const 가운데 = Math.round(높이 * (세로긴가 ? 0.42 : 0.5));
  const 조각 = [];

  조각.push(`<rect width="${폭}" height="${높이}" fill="${색.바탕}"/>`);
  조각.push(`<rect width="${폭}" height="10" fill="${색.수}"/>`);
  /* 매체 이름 — 카드가 혼자 돌아다닐 때 누가 낸 것인지 */
  조각.push(`<text x="${여백}" y="${여백 + 34}" font-family="Georgia,serif" font-size="30"`
    + ` fill="${색.수}" letter-spacing="5">K CULTURE WIRE</text>`);

  const 글자크기 = 장.꼴 === '표지' ? Math.round(폭 * 0.052) : Math.round(폭 * 0.044);
  const 한줄 = Math.floor((폭 - 여백 * 2) / (글자크기 * 0.52));
  const 줄 = 줄나누기(장.글, 한줄);
  const 줄높이 = Math.round(글자크기 * 1.38);

  /* 🔴 figure 가 없는 기사가 47편이다. 그때 표지에 빈 자리가 남았다 —
     눈으로 열어 보고 알았다. 수가 없으면 제목이 그 자리를 쓴다. */
  let y = 가운데 - Math.round((줄.length * 줄높이) / 2);

  if (장.꼴 === '표지' && 장.큰) {
    const 큰크기 = Math.round(폭 * 0.20);
    조각.push(`<text x="${여백}" y="${가운데 - 줄.length * 줄높이 * 0.5 - 40}"`
      + ` font-family="Georgia,serif" font-size="${큰크기}" font-weight="700"`
      + ` fill="${색.글}" letter-spacing="-4">${막는다(장.큰)}</text>`);
    if (장.작은) {
      조각.push(`<text x="${여백}" y="${가운데 - 줄.length * 줄높이 * 0.5 + 6}"`
        + ` font-family="Helvetica,Arial,sans-serif" font-size="${Math.round(폭 * 0.030)}"`
        + ` fill="${색.수}">${막는다(장.작은)}</text>`);
    }
    y = 가운데 - Math.round((줄.length * 줄높이) / 2) + Math.round(폭 * 0.10);
  }

  if (장.꼴 === '한계') {
    조각.push(`<text x="${여백}" y="${y - Math.round(폭 * 0.085)}" font-family="Helvetica,Arial,sans-serif"`
      + ` font-size="${Math.round(폭 * 0.030)}" fill="${색.수}" letter-spacing="2">`
      /* ⛔ 「WHAT THIS DOES NOT SAY」 였는데 crossChecks 첫 줄은 「어떻게 셌나」인
         경우가 많다. 안 맞는 딱지를 붙이는 것이 딱지가 없는 것보다 나쁘다.
         내용을 보고 골라 붙이면 내가 판정하는 것이 되므로, crossChecks 가 실제로
         무엇인지로 이름을 정한다 — 96편 전부에 참인 이름이다. */
      + 'HOW WE COUNTED THIS</text>');
  }

  const 굵기 = 장.꼴 === '표지' ? '700' : '400';
  const 빛 = 장.꼴 === '한계' ? 색.흐림 : 색.글;
  for (const l of 줄) {
    조각.push(`<text x="${여백}" y="${y}" font-family="Georgia,serif" font-size="${글자크기}"`
      + ` font-weight="${굵기}" fill="${빛}">${막는다(l)}</text>`);
    y += 줄높이;
  }

  if (장.꼴 === '주소') {
    조각.push(`<text x="${여백}" y="${y + 40}" font-family="Helvetica,Arial,sans-serif"`
      + ` font-size="${Math.round(폭 * 0.026)}" fill="${색.흐림}">`
      + 'Every figure has a table behind it.</text>');
  }

  /* ⛔ 모든 장에 주소를 박는다 — 카드는 우리 지면을 떠나 혼자 돌아다닌다 */
  조각.push(`<line x1="${여백}" y1="${높이 - 여백 - 56}" x2="${폭 - 여백}"`
    + ` y2="${높이 - 여백 - 56}" stroke="${색.줄}" stroke-width="2"/>`);
  조각.push(`<text x="${여백}" y="${높이 - 여백 - 12}" font-family="Helvetica,Arial,sans-serif"`
    + ` font-size="${Math.round(폭 * 0.026)}" fill="${색.수}">${막는다(주소)}</text>`);
  조각.push(`<text x="${폭 - 여백}" y="${높이 - 여백 - 12}" text-anchor="end"`
    + ` font-family="Helvetica,Arial,sans-serif" font-size="${Math.round(폭 * 0.026)}"`
    + ` fill="${색.흐림}">${번호} / ${총}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${폭}" height="${높이}"`
    + ` viewBox="0 0 ${폭} ${높이}">${조각.join('')}</svg>`;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  참('& 를 막는다', 막는다('a & b') === 'a &amp; b');
  참('따옴표를 막는다', 막는다('a"b') === 'a&quot;b');
  참('빈 값도 안 죽는다', 막는다(null) === '');

  참('짧은 글은 한 줄', 줄나누기('short line', 40).length === 1);
  참('긴 글은 여러 줄', 줄나누기('a'.repeat(10) + ' ' + 'b'.repeat(10) + ' ' + 'c'.repeat(10), 15).length === 3);
  /* ⛔ 자르지 않는다 — 넣은 낱말이 다 나와야 한다 */
  참('낱말을 안 버린다', 줄나누기('one two three four five', 9).join(' ') === 'one two three four five');
  참('빈 글은 빈 목록', 줄나누기('', 40).length === 0);

  /* 🔴 이 자의 핵 — crossChecks 를 앞말에서만 꺼낸다 */
  const 글 = ['---', 'title: "T"', 'dek: "D"', 'crossChecks:',
    '  - "first limit here"', '  - "second"', '---', 'body: first limit here'].join('\n');
  참('crossChecks 첫 줄을 꺼낸다', 크로스첫줄(글) === 'first limit here');
  참('crossChecks 가 없으면 null',
    크로스첫줄('---\ntitle: "T"\ndek: "D"\n---\nbody') === null);
  참('다음 열쇠로 넘어가면 멈춘다',
    크로스첫줄('---\ncrossChecks:\nauthor: X\n  - "late"\n---') === null);

  /* ⛔ 한계 없는 기사는 카드를 안 만든다 */
  const 없는것 = 재료뽑기('---\ntitle: "T"\ndek: "D"\n---\nbody', 's', null);
  참('한계가 없으면 안 만든다', !!없는것.못만드는까닭);
  참('까닭을 적는다', /crossChecks/.test(없는것.못만드는까닭));
  참('title 이 없으면 안 만든다', !!재료뽑기('---\ndek: "D"\n---', 's', null).못만드는까닭);
  참('dek 이 없으면 안 만든다', !!재료뽑기('---\ntitle: "T"\n---', 's', null).못만드는까닭);

  const 재료 = 재료뽑기(글, 'my-slug', { figure: '28%', label: 'of titles' });
  참('재료가 나온다', 재료.title === 'T' && 재료.dek === 'D');
  참('주소를 만든다', 재료.주소 === 'kculturewire.com/article/my-slug');
  참('figure 를 받는다', 재료.figure === '28%');

  const 장 = 장으로(재료);
  참('표지가 첫 장', 장[0].꼴 === '표지');
  /* 🔴 순서를 바꾸지 않는다 — 한계는 항상 끝에서 둘째 */
  참('한계가 끝에서 둘째', 장[장.length - 2].꼴 === '한계');
  참('주소가 마지막', 장[장.length - 1].꼴 === '주소');
  참('한계 글이 crossChecks 에서 왔다', 장[장.length - 2].글 === 'first limit here');

  참('짧은 dek 은 한 장', 토막내기('One sentence only.', 190).length === 1);
  참('긴 dek 은 여러 장', 토막내기(`${'A'.repeat(180)}. ${'B'.repeat(180)}.`, 190).length === 2);
  참('문장을 안 버린다', 토막내기('A. B. C.', 190)[0] === 'A. B. C.');

  const svg = 그리기(장[0], 1, 장.length, 규격[0], 재료.주소);
  참('SVG 가 나온다', svg.startsWith('<svg') && svg.endsWith('</svg>'));
  참('모든 장에 주소가 있다', 장.every((z) => 그리기(z, 1, 4, 규격[0], 재료.주소).includes('kculturewire.com/article/my-slug')));
  참('매체 이름이 있다', svg.includes('K CULTURE WIRE'));
  참('세로 규격도 그린다', 그리기(장[0], 1, 4, 규격[1], 재료.주소).includes('width="1080" height="1920"'));
  /* 🔴 딱지 이름 — crossChecks 는 「어떻게 셌나」다. 「안 하는 말」이라 붙이면 거짓이 된다 */
  const 한계장 = 장[장.length - 2];
  const 한계그림 = 그리기(한계장, 4, 5, 규격[0], 재료.주소);
  참('딱지가 HOW WE COUNTED THIS 다', 한계그림.includes('HOW WE COUNTED THIS'));
  참('안 맞는 옛 딱지가 안 남았다', !한계그림.includes('DOES NOT SAY'));
  참('한계 글이 카드에 실린다', 한계그림.includes('first limit here'));

  참('규격이 둘이다', 규격.length === 2);

  console.log(`카드뉴스를 뽑는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/* ── 실제로 만든다 ────────────────────────────────────────── */
if (직접불렸나 && process.argv.includes('--낸다')) {
  const 하나 = process.argv.find((a) => a.startsWith('--기사='))?.split('=')[1] ?? null;
  const 전부 = process.argv.includes('--전부');
  if (!하나 && !전부) { console.log('⛔ --기사=<slug> 나 --전부 를 준다'); process.exit(1); }

  const 고른 = fs.existsSync(고른것)
    ? (JSON.parse(fs.readFileSync(고른것, 'utf8')).chosen ?? {}) : {};
  const 목록 = 하나 ? [`${하나}.md`]
    : fs.readdirSync(기사방).filter((f) => f.endsWith('.md'));

  fs.mkdirSync(낼방, { recursive: true });
  const sharp = createRequire(path.join(ROOT, 'package.json'))('sharp');

  let 낸것 = 0; let 건너 = 0; const 까닭 = new Map();
  for (const f of 목록) {
    const slug = f.replace(/\.md$/, '');
    const p = path.join(기사방, f);
    if (!fs.existsSync(p)) { console.log(`🔴 ${slug} — 기사가 없다`); 건너 += 1; continue; }
    const 재료 = 재료뽑기(fs.readFileSync(p, 'utf8'), slug, 고른[slug]);
    if (재료.못만드는까닭) {
      건너 += 1;
      까닭.set(재료.못만드는까닭, (까닭.get(재료.못만드는까닭) ?? 0) + 1);
      if (하나) console.log(`⛔ ${slug} — ${재료.못만드는까닭}`);
      continue;
    }
    const 장 = 장으로(재료);
    for (const 규 of 규격) {
      for (let i = 0; i < 장.length; i += 1) {
        const svg = 그리기(장[i], i + 1, 장.length, 규, 재료.주소);
        const 이름 = `${slug}-${규.이름}-${i + 1}.png`;
        /* eslint-disable no-await-in-loop */
        await sharp(Buffer.from(svg)).png().toFile(path.join(낼방, 이름));
      }
    }
    낸것 += 1;
    if (하나) console.log(`✅ ${slug} — ${장.length}장 × 규격 ${규격.length}벌 = ${장.length * 규격.length}개`);
  }

  console.log(`\n카드뉴스 — 낸 기사 ${낸것}편 · 건너뛴 것 ${건너}편 → public/wikitip/cardnews`);
  if (까닭.size) {
    console.log('건너뛴 까닭마다 — ⛔ 억지로 채우지 않는다. 안 만든 것도 결과다');
    for (const [k, v] of [...까닭].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}편  ${k}`);
  }
  console.log('⚠ 한 장을 실제로 열어 글자가 읽히는지 보고 커밋한다.');
}

if (직접불렸나 && !process.argv.includes('--낸다') && !process.argv.includes('--selftest')) {
  console.log('⛔ --낸다 나 --selftest 을 준다');
}
