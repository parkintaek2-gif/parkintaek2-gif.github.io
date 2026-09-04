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

/**
 * 표지의 «큰 수» 기준선에서 라벨 기준선까지, 큰 수 글자크기에 대한 비율.
 *
 * 🔴 [2026-09-04] 왜 이 상수가 생겼나 — 카드를 열어 보니 라벨이 큰 수에 물려 있었다.
 *   **Georgia 는 옛꼴 숫자를 쓴다.** 3·4·5·7·9 가 기준선 아래로 대략 0.22em 내려간다.
 *   그런데 라벨을 기준선 +6px(간격 46px)에 두어, 216px 짜리 수의 내림 47px 이
 *   그 간격을 통째로 먹었다.
 *
 * ⚠ 고정 px 로 두면 수 크기를 바꿀 때 또 겹친다. 그래서 «비율»로 둔다.
 * ⚠ 0.36 = 내림 0.22 + 라벨 대문자 높이 0.10 + 여유 0.04. 아래 자가시험이 이 셈을 지킨다.
 * ⛔ 이 값을 0.28 밑으로 내리지 마십시오 — 옛꼴 숫자 내림에 다시 물립니다.
 */
export const 라벨간격비 = 0.36;

/** Georgia 옛꼴 숫자가 기준선 아래로 내려가는 깊이 (글자크기에 대한 비율) */
export const 옛꼴숫자내림 = 0.22;

export const 색 = {
  바탕: '#141021', 글: '#f4f1fa', 수: '#c4a7ff', 흐림: '#9d94b5', 줄: '#2c2440',
};

/** 글자를 안전하게. ⛔ `&` 하나가 SVG 를 깨뜨린다 */
/**
 * 카드 바닥의 주소를 «쪽번호와 안 겹치게» 자른다.
 *
 * 🔴 [2026-09-04] 눈으로 보고 찾았다 — `july-is-the-thinnest-month-for-k-pop-birthdays`
 *   카드에서 주소 끝이 쪽번호(「2 / 5」)와 «겹쳐» 둘 다 안 읽혔다.
 *   주소는 왼쪽 붙임, 쪽번호는 오른쪽 붙임이라 긴 슬러그가 그대로 밀고 들어간다.
 * ⛔ 폰트 크기를 줄여 숨기지 않는다 — 주소는 카드가 홀로 돌아다닐 때의 «유일한 출처»다.
 * ✅ 대신 «슬러그 뒤»를 자르고 … 를 붙인다. 어느 지면인지는 앞부분으로 안다.
 *
 * @param 주소 kculturewire.com/article/<slug>
 * @param 쓸폭 주소가 쓸 수 있는 가로 픽셀
 * @param 글자폭 한 글자의 어림 폭 (Helvetica 소문자 어림 — 글자크기의 0.52)
 */
export function 주소줄이기(주소, 쓸폭, 글자폭) {
  const s = String(주소 ?? '');
  if (!(쓸폭 > 0) || !(글자폭 > 0)) return s;
  const 들어갈글자 = Math.floor(쓸폭 / 글자폭);
  if (s.length <= 들어갈글자) return s;
  if (들어갈글자 <= 1) return '…';
  return `${s.slice(0, 들어갈글자 - 1)}…`;
}

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
/**
 * 🔴 [2026-09-04] **한 줄보다 긴 낱말 하나가 화면 밖으로 나갔다.** 카드를 열어 보고 알았다 —
 *   닫는 카드의 「kculturewire.com/article/a-weekly-top-ten-is-not-ten-titles」 가
 *   오른쪽 끝에서 «잘려» 있었다. 433장 전부가 그랬다.
 *
 *   까닭: 아래 `줄나누기` 는 «빈칸»에서만 줄을 나눈다. 주소에는 빈칸이 없어 나눌 자리가 없었다.
 *   ⛔ 카드는 우리 지면을 떠나 혼자 돌아다닌다. **잘린 주소는 눌러도 오지 못하는 주소다.**
 *   ✅ 그래서 한 줄을 넘는 낱말은 강제로 자른다. 주소는 `/` `-` `.` 에서 자르면 읽히므로
 *      그 자리를 먼저 찾고, 너무 앞이면 글자 수로 자른다.
 */
export function 낱말자르기(낱말, 한줄글자) {
  const w = String(낱말 ?? '');
  if (!(한줄글자 > 0) || w.length <= 한줄글자) return [w];
  const 조각 = [];
  let 남은 = w;
  while (남은.length > 한줄글자) {
    const 창 = 남은.slice(0, 한줄글자);
    /* 끊는 «글자를 남기고» 자른다 — 주소는 / 가 붙어 있어야 읽힌다 */
    const 자리 = Math.max(창.lastIndexOf('/'), 창.lastIndexOf('-'), 창.lastIndexOf('.'));
    const 끊을데 = 자리 >= Math.floor(한줄글자 * 0.4) ? 자리 + 1 : 한줄글자;
    조각.push(남은.slice(0, 끊을데));
    남은 = 남은.slice(끊을데);
  }
  if (남은) 조각.push(남은);
  return 조각;
}

export function 줄나누기(글, 한줄글자) {
  const 낱말 = String(글 ?? '').trim().split(/\s+/).filter(Boolean)
    .flatMap((w) => 낱말자르기(w, 한줄글자));
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

/**
 * 🔴 [2026-09-04] **옛 판이 남긴 카드가 지면에 그대로 남아 있었다.**
 *
 *   카드를 열어 보려다 알았다 — `a-weekly-top-ten-is-not-ten-titles-sq-5.png` 를 열었는데
 *   주소가 오른쪽으로 잘려 있었다. 고치고 다시 구웠는데 **그림이 안 바뀌었다.**
 *   까닭은 이 기사가 지금 **4장**을 내기 때문이다. 5장째는 «다시 구워지지 않는 고아»였다.
 *
 *   ⛔ 그 고아는 바닥에 **「5 / 5」**라고 적혀 있다. 넷뿐인데 다섯 중 다섯이라고 말한다.
 *     카드는 우리 지면을 떠나 혼자 돌아다니므로, 틀린 쪽번호는 그대로 남의 화면에 간다.
 *   ⛔ 그리고 **덮어쓰는 자는 지우지 않는다.** 장 수가 줄면 옛 파일이 조용히 살아남는다.
 *     조용히 남는 것이 제일 나쁘다 — 고쳤다고 믿고 지나가게 된다.
 *
 *   ✅ 그래서 굽고 나서 «이번 장 수를 넘는 번호»를 지운다.
 *   ⚠ 다른 기사 것을 지우지 않도록 딱지는 `<slug>-<규격>-<번호>.png` 를 **온전히** 맞춘다 —
 *     `foo` 를 치우면서 `foo-bar` 것을 지우면 그것이 더 큰 사고다. 아래 자가시험이 그 경계를 본다.
 */
export function 고아찾기(파일들, slug, 이번장수) {
  const 규이름 = 규격.map((r) => r.이름);
  const 고아 = [];
  for (const f of 파일들) {
    const m = String(f).match(/^(.*)-([a-z]+)-([0-9]+)\.png$/);
    if (!m) continue;
    if (m[1] !== slug) continue;
    if (!규이름.includes(m[2])) continue;
    if (Number(m[3]) > 이번장수) 고아.push(f);
  }
  return 고아;
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
    const 수기준선 = Math.round(가운데 - 줄.length * 줄높이 * 0.5 - 40);
    조각.push(`<text x="${여백}" y="${수기준선}"`
      + ` font-family="Georgia,serif" font-size="${큰크기}" font-weight="700"`
      + ` fill="${색.글}" letter-spacing="-4">${막는다(장.큰)}</text>`);
    if (장.작은) {
      /**
       * 🔴 [2026-09-04] **여기서 라벨이 큰 수에 «물려» 있었다.** 카드를 열어 보고 알았다 —
       *   「58.4%」 아래로 라벨이 지나가 글자가 겹쳤다.
       *
       *   까닭: **Georgia 는 옛꼴 숫자(old-style figures)를 쓴다.** 3·4·5·7·9 가
       *   기준선 «아래로» 내려간다. 216px(폭 0.20) 에서 그 내림이 대략 0.22em ≈ 47px 다.
       *   그런데 라벨을 기준선 +6px 에 두어(간격 46px) 내림이 그 간격을 통째로 먹었다.
       *
       *   ⛔ 사장님이 이 세션에서 «가장 먼저» 잡으신 것이 겹침이다. 심사·공유 카드에서
       *     글자가 물리면 그것 자체가 「대충 만들었다」로 읽힌다.
       *   ✅ 그래서 라벨을 «수 글자크기에 비례해» 내린다 — 수가 커지면 내림도 커지므로
       *     고정 px 로 두면 크기를 바꿀 때 또 겹친다. 아래 자가시험이 이 비례를 지킨다.
       */
      const 내림여유 = Math.round(큰크기 * 라벨간격비);
      조각.push(`<text x="${여백}" y="${수기준선 + 내림여유}"`
        + ` font-family="Helvetica,Arial,sans-serif" font-size="${Math.round(폭 * 0.030)}"`
        + ` fill="${색.수}">${막는다(장.작은)}</text>`);
    }
    /* 제목도 라벨만큼 함께 내린다 — 라벨만 내리면 이번엔 라벨이 제목을 문다 */
    y = 가운데 - Math.round((줄.length * 줄높이) / 2) + Math.round(폭 * 0.10)
      + (장.작은 ? Math.round(큰크기 * (라벨간격비 - 0.03)) : 0);
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
  /* 🔴 쪽번호가 오른쪽에 붙으므로 주소가 쓸 폭을 «빼고» 잰다 — 안 그러면 둘이 겹친다 */
  const 바닥글자 = Math.round(폭 * 0.026);
  const 쪽글 = `${번호} / ${총}`;
  const 쪽번호폭 = 쪽글.length * 바닥글자 * 0.52;
  const 주소쓸폭 = 폭 - 여백 * 2 - 쪽번호폭 - 바닥글자;
  조각.push(`<text x="${여백}" y="${높이 - 여백 - 12}" font-family="Helvetica,Arial,sans-serif"`
    + ` font-size="${바닥글자}" fill="${색.수}">`
    + `${막는다(주소줄이기(주소, 주소쓸폭, 바닥글자 * 0.52))}</text>`);
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

  /* 🔴 433장이 잘려 있던 결함 — 자가시험으로 굳힌다 */
  {
    const 주소 = 'kculturewire.com/article/a-weekly-top-ten-is-not-ten-titles';
    const 줄 = 줄나누기(주소, 30);
    참('긴 주소가 여러 줄로 나뉜다', 줄.length >= 2);
    참('어느 줄도 한 줄 폭을 안 넘는다', 줄.every((l) => l.length <= 30));
    참('자른 것을 이으면 원래 주소다', 줄.join('') === 주소);
    참('끊는 글자를 안 버린다', 줄.some((l) => /[/.-]$/.test(l)));
    참('짧은 낱말은 안 건드린다', 낱말자르기('short', 30).join('|') === 'short');
    참('끊을 자리가 너무 앞이면 글자 수로 자른다',
      낱말자르기(`a-${'b'.repeat(40)}`, 20)[0] === `a-${'b'.repeat(18)}`);
    참('한줄글자가 0 이면 그대로 돌려준다', 낱말자르기('abcdef', 0).join('|') === 'abcdef');
  }

  /* 🔴 「5 / 5」라고 적힌 고아가 넷뿐인 기사에 남아 있던 결함 */
  {
    const 방 = ['foo-sq-1.png', 'foo-sq-4.png', 'foo-sq-5.png', 'foo-v-5.png',
      'foo-bar-sq-5.png', 'foo-sq-5.txt', 'foo-zz-5.png'];
    const 고아 = 고아찾기(방, 'foo', 4);
    참('넘는 번호를 고아로 본다', 고아.includes('foo-sq-5.png') && 고아.includes('foo-v-5.png'));
    참('안 넘는 번호는 안 건드린다',
      !고아.includes('foo-sq-1.png') && !고아.includes('foo-sq-4.png'));
    참('⭐ 이름이 겹치는 «다른» 기사 것을 안 지운다', !고아.includes('foo-bar-sq-5.png'));
    참('png 아닌 것을 안 지운다', !고아.includes('foo-sq-5.txt'));
    참('모르는 규격은 안 지운다', !고아.includes('foo-zz-5.png'));
    참('고아가 없으면 빈 목록', 고아찾기(['foo-sq-1.png'], 'foo', 4).length === 0);
    참('빈 방에서 지어내지 않는다', 고아찾기([], 'foo', 4).length === 0);
  }

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

  /* 🔴 [2026-09-04] 겹침 — 사장님이 이 세션에서 «가장 먼저» 잡으신 자리다.
     카드를 열어 보니 라벨이 큰 수에 물려 있었다. 눈으로 본 것을 «수로» 굳힌다. */
  참('라벨 간격이 옛꼴 숫자 내림보다 크다', 라벨간격비 > 옛꼴숫자내림);
  참('라벨 대문자 높이까지 넣어도 안 물린다',
    라벨간격비 - 옛꼴숫자내림 > 0.10);
  참('간격비를 0.28 밑으로 못 내린다(옛꼴 내림에 물린다)', 라벨간격비 >= 0.28);
  {
    /* 그린 SVG 에서 «실제 y 값»을 읽어 견준다 — 상수만 시험하면 배선이 틀려도 통과한다 */
    const 장 = { 꼴: '표지', 큰: '58.4%', 작은: 'of one arts school crossed 10 languages', 글: 'T T T' };
    const svg = 그리기(장, 1, 5, { 폭: 1080, 높이: 1080 }, 'kculturewire.com/article/x');
    const 수y = Number((svg.match(/font-size="216"[^>]*/) ? svg.match(/y="(\d+)"[^>]*font-family="Georgia,serif" font-size="216"/) : [])?.[1]
      ?? (svg.match(/y="(\d+)"\s+font-family="Georgia,serif" font-size="216"/) || [])[1]);
    const 라벨y = Number((svg.match(/y="(\d+)"\s+font-family="Helvetica,Arial,sans-serif" font-size="32"/) || [])[1]);
    참('SVG 에서 큰 수 y 를 읽었다', Number.isFinite(수y));
    참('SVG 에서 라벨 y 를 읽었다', Number.isFinite(라벨y));
    참('라벨이 큰 수보다 아래에 있다', 라벨y > 수y);
    참('라벨이 옛꼴 숫자 내림(216x0.22=47) 보다 더 아래에 있다',
      라벨y - 수y > Math.round(216 * 옛꼴숫자내림), (라벨y - 수y) + 'px > 47px');
    /* 제목도 라벨 아래여야 한다 — 라벨만 내리면 이번엔 라벨이 제목을 문다 */
    const 제목ys = [...svg.matchAll(/y="(\d+)"[^>]*font-size="56"/g)].map((m) => Number(m[1]));
    참('제목 줄을 찾았다', 제목ys.length > 0, 제목ys.join(','));
    참('제목 첫 줄이 라벨보다 아래에 있다', 제목ys.length ? Math.min(...제목ys) > 라벨y : false,
      (제목ys.length ? Math.min(...제목ys) : '?') + ' > ' + 라벨y);
  }

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

  /* 🔴 [2026-09-04] 긴 슬러그가 쪽번호와 «겹쳐» 둘 다 안 읽혔다. 눈으로 보고 찾은 결함이다 */
  참('짧은 주소는 그대로 둔다', 주소줄이기('kculturewire.com/article/x', 900, 14) === 'kculturewire.com/article/x');
  참('🔴 긴 주소는 잘라 … 를 붙인다', (() => {
    const 긴 = 'kculturewire.com/article/july-is-the-thinnest-month-for-k-pop-birthdays';
    const r = 주소줄이기(긴, 700, 14);
    return r.length < 긴.length && r.endsWith('…');
  })());
  참('자른 뒤에도 «어느 지면인지» 앞부분이 남는다',
    주소줄이기('kculturewire.com/article/july-is-the-thinnest-month', 500, 14).startsWith('kculturewire.com/article/'));
  참('폭이 0 이면 손대지 않는다 (잘못 잘라 지우지 않는다)',
    주소줄이기('kculturewire.com/article/x', 0, 14) === 'kculturewire.com/article/x');
  참('폭이 아주 좁으면 … 하나만', 주소줄이기('abcdef', 10, 14) === '…');
  참('⭐ 긴 슬러그 카드에서 주소와 쪽번호가 «안 겹친다»', (() => {
    const 긴주소 = 'kculturewire.com/article/july-is-the-thinnest-month-for-k-pop-birthdays';
    const svg = 그리기(장[0], 2, 5, 규격[0], 긴주소);
    const 바닥글자 = Math.round(1080 * 0.026);
    const 여백 = Math.round(1080 * 0.09);
    const 쪽번호폭 = '2 / 5'.length * 바닥글자 * 0.52;
    const 쓸폭 = 1080 - 여백 * 2 - 쪽번호폭 - 바닥글자;
    const m = svg.match(/fill="[^"]*">(kculturewire[^<]*)</);
    return !!m && m[1].length * 바닥글자 * 0.52 <= 쓸폭;
  })());
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

  let 낸것 = 0; let 건너 = 0; let 치운것 = 0; const 까닭 = new Map();
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
        /**
         * 🔴 사장님 지시(2026-09-04): **「사진이 너무 저장공간을 차지하지 않게 해」**
         *
         * 카드뉴스 방이 **82MB**(1,384장 · 평균 60.8KB) 였다. 카드는 «단색 도형과 글자»뿐이라
         * 24비트로 담을 까닭이 없다. 재 봤다 — 한 장 64.6KB → **13.7KB (21.3%)**.
         * ⭐ 색 수를 16·32·64·128 로 바꿔도 **크기가 똑같았다.** 카드가 실제로 쓰는 색이
         *   그보다 적다는 뜻이다. 그래서 «질이 가장 나은» 128 로 둔다 — 공짜다.
         * ⚠ 줄이고 나서 **눈으로 봤다.** 글자 테두리가 원본과 구별되지 않았다.
         * ⛔ 이 옵션을 지우지 마십시오 — 지우면 방이 네 배로 돌아갑니다.
         */
        await sharp(Buffer.from(svg))
          .png({ palette: true, colours: 128, compressionLevel: 9, effort: 10 })
          .toFile(path.join(낼방, 이름));
      }
    }
    /* 🔴 [2026-09-04] 고아 카드를 치운다 — 아래 「고아찾기」 주석을 읽는다 */
    for (const 이름 of 고아찾기(fs.readdirSync(낼방), slug, 장.length)) {
      fs.rmSync(path.join(낼방, 이름));
      치운것 += 1;
    }
    낸것 += 1;
    if (하나) console.log(`✅ ${slug} — ${장.length}장 × 규격 ${규격.length}벌 = ${장.length * 규격.length}개`);
  }

  console.log(`\n카드뉴스 — 낸 기사 ${낸것}편 · 건너뛴 것 ${건너}편 · 치운 고아 ${치운것}장 → public/wikitip/cardnews`);
  if (까닭.size) {
    console.log('건너뛴 까닭마다 — ⛔ 억지로 채우지 않는다. 안 만든 것도 결과다');
    for (const [k, v] of [...까닭].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}편  ${k}`);
  }
  console.log('⚠ 한 장을 실제로 열어 글자가 읽히는지 보고 커밋한다.');
}

if (직접불렸나 && !process.argv.includes('--낸다') && !process.argv.includes('--selftest')) {
  console.log('⛔ --낸다 나 --selftest 을 준다');
}
