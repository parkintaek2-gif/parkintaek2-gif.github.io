#!/usr/bin/env node
/**
 * build-selfsaju-lecture-deck.mjs — **셀프사주 2권을 «강의용 PPT»로 짓는다.**
 *
 *   node scripts/build-selfsaju-lecture-deck.mjs --자가시험
 *   node scripts/build-selfsaju-lecture-deck.mjs --뼈대     무엇이 몇 장이 되나만 본다
 *   node scripts/build-selfsaju-lecture-deck.mjs --짓는다   .pptx 를 낸다
 *
 * ── 🔴 왜 (2026-09-22 · 5번) ────────────────────────────────────────────
 *   사장님: 「**ppt로 만들기로 했다, 강의용으로**」
 *   사장님: 「셀프사주 1권 교재와 강의(파일명 중 **이마트** 포함) ppt를 원드라이브에서 찾아서
 *            **거기 스타일에 맞춰서** 만들어. **두 개를 만들어야** 하는 거야」
 *
 *   ⇒ 만들 것은 둘이다. 이 자는 그중 «강의 PPT» 를 맡는다.
 *     교재(docx)는 `../klifemap/tools/build-selfsaju-vol2.mjs` 가 1권 서식을 물려받아 짓는다.
 *
 * ── ⭐ 「스타일에 맞춘다」를 어떻게 지키나 — 눈으로 맞추지 않는다 ────────
 *   pptx 는 zip 이다. 이마트 꾸러미에서 **서식 부품을 통째로 물려받는다** —
 *   theme · slideMaster · slideLayout 11개 · presProps · viewProps · tableStyles.
 *   슬라이드만 새로 넣는다. 글꼴·색·머리글 장식이 어긋날 «여지»가 없다.
 *
 *   실측한 이마트 문법 (2026-09-22)
 *     244장 · 그림 139개(108.5MB) · 레이아웃 쓰임 — 빈화면 199 · 제목및내용 43 · 제목만 2
 *     글꼴 맑은 고딕 · 제목 60pt · 본문 18pt
 *     ⇒ 글 슬라이드는 **layout2(제목 및 내용)**, 장 여는 장은 **layout3(구역 머리글)**,
 *       표지는 **layout1(제목 슬라이드)** 이 제자리다.
 *   ⛔ 원본의 그림 108MB 는 가져오지 않는다 — 1권 강의 사진이다. 2권 것이 아니다.
 *
 * ── ⛔ 지키는 것 ──────────────────────────────────────────────────────
 *   ⛔ 사장님 원본을 고치지 않는다. 읽기만 하고 새 파일로 낸다.
 *   ⛔ 원고에 없는 말을 슬라이드에서 지어내지 않는다. 옮기고 자를 뿐이다.
 *   ⛔ 원전 인용은 한 글자도 바꾸지 않는다.
 *   ⛔ 넘치면 글을 줄이지 않는다 — 장을 넘긴다(조용히 줄이면 빠진 줄 모른다).
 *   ⛔ 판정 엔진을 건드리지 않는다. 이 자는 원고를 슬라이드로 옮길 뿐이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 집목록, 집에서꺼내기, 글로꺼내기, 집만들기, 엑스엠엘 } from './lib/pptx-꾸러미.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원고방 = path.resolve(뿌리, '..', 'klifemap', 'docs', '교재');
export const 낼방 = path.join(뿌리, 'archive', 'out', '셀프사주2-강의');

/** 스타일을 물려받을 원본 — 사장님 원드라이브. ⛔ 읽기만 한다 */
export const 스타일원본 = [
  'C:/Users/User/OneDrive/문서/셀프사주 1권-이마트 세종.pptx',
  'C:/Users/User/OneDrive/문서/0. 명리학 강의 및 교재/셀프사주 1권-이마트 세종.pptx',
];

/**
 * 한 장에 넣을 «본문 줄» 최대 — 넘치면 장을 넘긴다.
 * 🔴 [2026-09-22 · 사장님] 「**설명은 짧게. 원래 ppt는 그림 1-2개로만 슬라이드 구성해야 함**」
 *   6 줄이면 강의 화면이 «대본»이 된다. 3 줄로 줄였다 — 나머지 말씀은 입으로 하신다.
 */
export const 한장줄수 = 3;
/** 한 줄이 이보다 길면 강의 화면에서 두 줄로 흐른다 */
export const 한줄글자 = 28;

/** 한 절에서 슬라이드에 올릴 «산문» 토막 수 — 나머지 설명은 교재에 있다 */
export const 절산문최대 = 2;

/* ── 원고를 토막으로 가른다 ─────────────────────────────────────── */

/** 한문이 절반 넘게 든 줄인가 — 원전 «원문»과 «우리말 옮김»을 가른다 */
export function 한문줄인가(줄) {
  const s = String(줄 ?? '').replace(/[\s，。、：；？！「」『』（）()·…—]/g, '');
  if (!s) return false;
  return (s.match(/[\u4e00-\u9fff]/g) || []).length / s.length >= 0.5;
}

/**
 * **출전은 «조그맣게, 한글 이름으로»** — 사장님 지시 (2026-09-22):
 *   「자평진전을 인용하면 조그맣게 -자평진전 이라고 명기해...너무 커 지금은」
 *
 * 글자 크기는 이미 12pt(본문 18pt)로 작았지만, 책이름이 『子平真詮評註』처럼
 * 한문 다섯 자라 화면에서 여전히 크게 읽혔다. 한글 세 글자로 줄인다.
 * ⛔ 편명은 남긴다 — 그것이 있어야 뒤에 읽는 사람이 원전과 대조할 수 있다.
 */
export const 책이름줄임 = [
  [/[『「]?子平真詮評註[』」]?|[『「]?子平真詮[』」]?|자평진전평주/g, '자평진전'],
  [/[『「]?滴天髓闡微[』」]?|[『「]?滴天髓[』」]?|적천수천미/g, '적천수'],
  [/[『「]?窮通寶鑑[』」]?|난강망/g, '궁통보감'],
  [/궁통보감\s*\(\s*궁통보감\s*\)/g, '궁통보감'],
];
export function 출전줄임(s) {
  let t = String(s ?? '').trim().replace(/^[—–-]\s*/, '');
  for (const [옛, 새] of 책이름줄임) t = t.replace(옛, 새);
  return t.replace(/\s{2,}/g, ' ').trim();
}

/* ══════════════════════════════════════════════════════════════════
 * 독음 — 사장님 지시 (2026-09-22):
 *   「**한글 주석을 위에 쓰고, 한자 원문을 아래에 쓰되, 독음을 달아...**」
 *
 * 교재(build-selfsaju-vol2.mjs)와 «같은 규칙»을 슬라이드에도 건다.
 * 강의에서 수강생이 한문을 소리내어 따라 읽을 수 있어야 한다.
 * ⛔ 표에 없는 글자는 소리를 지어내지 않는다 — 그 글자를 그대로 둔다.
 * ══════════════════════════════════════════════════════════════════ */
export const 독음표길 = path.resolve(뿌리, '..', 'klifemap', 'content', 'hanja-hangul-readings.json');
let _독음 = null;
export function 독음표() {
  if (_독음) return _독음;
  try { _독음 = JSON.parse(fs.readFileSync(독음표길, 'utf8')).독음 || {}; }
  catch { _독음 = {}; }
  return _독음;
}
export function 독음달기(글) {
  const 표 = 독음표();
  let 낸다 = '';
  let 구첫자 = true;
  for (const c of String(글 ?? '')) {
    if (!/[一-鿿]/.test(c)) {
      낸다 += c;
      if (/\s/.test(c)) continue;
      구첫자 = /[，。、：；？！「」『』（）()·…—,.?!]/.test(c);
      continue;
    }
    const r = 표[c];
    if (!r) { 낸다 += c; 구첫자 = false; continue; }
    const 갈래 = String(r).split(',').map((x) => x.trim()).filter(Boolean);
    낸다 += 구첫자 ? 갈래[0] : 갈래[갈래.length - 1];   /* 두음법칙 — 구 첫 글자면 앞것 */
    구첫자 = false;
  }
  return 낸다;
}

/** 굵게·기울임 표시를 벗긴다 — 슬라이드는 서식으로 말한다 */
export function 표시벗기기(s) {
  return String(s ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\*+|\*+$/g, '')
    .trim();
}

/**
 * 긴 줄을 «낱말 자리»에서 접는다.
 *
 * 🔴 [2026-09-22] 처음 뽑은 판에서 긴 줄이 화면 오른쪽으로 «잘려» 나갔다.
 *   자리표에 맡기면 접힐 줄 알았는데 안 접혔다. ⇒ 우리가 접는다. 눈으로 확인한 자리다.
 * ⛔ 글자를 버리지 않는다 — 접을 뿐이다.
 */
export function 줄접기(글, 폭 = 한줄글자) {
  const t = 표시벗기기(글);
  if (!t) return [];
  if (t.length <= 폭) return [t];
  const 것 = [];
  let 이번 = '';
  for (const 조각 of t.split(/(\s+)/)) {
    if (!조각) continue;
    if ((이번 + 조각).trim().length > 폭 && 이번.trim()) { 것.push(이번.trim()); 이번 = /^\s+$/.test(조각) ? '' : 조각; continue; }
    이번 += 조각;
    /* 낱말 하나가 폭보다 길면(한문 인용 등) 그 자리에서 끊는다 */
    while (이번.trim().length > 폭) { 것.push(이번.trim().slice(0, 폭)); 이번 = 이번.trim().slice(폭); }
  }
  if (이번.trim()) 것.push(이번.trim());
  return 것;
}

/** 이 줄이 화면에서 몇 줄로 흐르나 */
export function 흐르는줄수(s) {
  return Math.max(1, 줄접기(s).length);
}

/** 우리끼리 쓰는 표시 이모지를 벗긴다 — 강의 화면에 내보내지 않는다 */
export function 표시이모지벗기기(s) {
  return String(s ?? '').replace(/^[⭐🔴⛔⚠✅⬜🟡♻📮]+\s*/, '').trim();
}

/**
 * 원고(markdown) → 토막들. 종류 — 장제목 · 절제목 · 원문 · 옮김 · 글 · 짚을것
 * ⛔ 파일 앞머리 메모(--- 위의 > 줄)는 우리끼리 하는 말이라 슬라이드에 안 싣는다.
 */
export function 원고가르기(글) {
  const 줄들 = String(글 ?? '').replace(/\r/g, '').split('\n');
  const 것 = [];
  let 앞머리끝났나 = false;
  for (const 원줄 of 줄들) {
    const t = 원줄.trim();
    if (!t) continue;
    if (/^-{3,}$/.test(t)) { 앞머리끝났나 = true; continue; }
    if (/^#\s+/.test(t)) { 것.push({ 종류: '장제목', 값: t.replace(/^#\s+/, '').trim() }); continue; }
    if (!앞머리끝났나) continue;
    if (/^##+\s+/.test(t)) { 것.push({ 종류: '절제목', 값: t.replace(/^#+\s+/, '').trim() }); continue; }
    /* 🔴 [2026-09-22 · 사장님] 표를 «버리지» 않는다 — 강의에서 제일 잘 보이는 것이 표다.
       그동안 이 한 줄이 원고의 표를 통째로 지우고 있었다. 이제 진짜 표로 싣는다. */
    if (/^\|/.test(t)) {
      if (/^\s*\|?\s*:?-{2,}/.test(t)) continue;       /* |---|---| 가름줄은 버린다 */
      const 칸 = t.replace(/^\||\|$/g, '').split('|').map((x) => 표시벗기기(x.trim()));
      const 앞 = 것[것.length - 1];
      if (앞 && 앞.종류 === '표') 앞.행들.push(칸);
      else 것.push({ 종류: '표', 행들: [칸] });
      continue;
    }
    if (/^>/.test(t)) {
      const 속 = t.replace(/^>+\s?/, '').trim();
      if (!속) continue;
      const 앞 = 것[것.length - 1];
      if (/^—/.test(속) && 앞 && (앞.종류 === '원문' || 앞.종류 === '옮김')) { 앞.출전 = 속.replace(/^—\s*/, ''); continue; }
      것.push({ 종류: 한문줄인가(속) ? '원문' : '옮김', 값: 속 });
      continue;
    }
    if (/^[⭐🔴⛔⚠]/.test(t)) { 것.push({ 종류: '짚을것', 값: t }); continue; }
    if (/^[-*]\s+/.test(t)) { 것.push({ 종류: '글', 값: t.replace(/^[-*]\s+/, '').trim() }); continue; }
    것.push({ 종류: '글', 값: t });
  }
  return 것;
}

/**
 * 토막들 → 슬라이드들.
 * ⭐ 원전 한 토막(원문 + 그 옮김)은 «한 장을 통째로» 쓴다 — 강의에서 띄워 놓고 읽는 자리다.
 */
export function 슬라이드나누기(토막들) {
  const 장들 = [];
  let 지금절 = null;
  let 담을것 = [];
  let 센줄 = 0;
  let 절산문수 = 0;
  /* 슬라이드에서 뺀 설명 — 그 절의 «마지막 장» 노트에 붙인다. ⛔ 버리지 않는다 */
  let 남은설명 = [];
  const 노트붙이기 = () => {
    if (!남은설명.length) return;
    const 끝 = 장들[장들.length - 1];
    if (끝) { 끝.노트 = [...(끝.노트 || []), ...남은설명]; }
    남은설명 = [];
  };
  const 비우기 = () => {
    if (!담을것.length) { 노트붙이기(); return; }
    장들.push({ 종류: '내용', 제목: 지금절 || '', 줄들: 담을것 });
    담을것 = []; 센줄 = 0;
    노트붙이기();
  };
  for (let i = 0; i < (토막들 || []).length; i++) {
    const 토 = 토막들[i];
    if (토.종류 === '장제목') { 비우기(); 장들.push({ 종류: '장여는장', 제목: 표시벗기기(토.값) }); 지금절 = null; 절산문수 = 0; continue; }
    if (토.종류 === '절제목') { 비우기(); 지금절 = 표시벗기기(토.값); 절산문수 = 0; continue; }
    if (토.종류 === '원문') {
      비우기();
      /* 🔴 [2026-09-22] 원문이 «여러 줄»인 인용에서, 첫 줄만 한 장을 쓰고 옮김은 다음 장에
         붙어 «빈 상자»가 그려졌다. PDF 로 떠서 눈으로 보고 잡았다.
         ⇒ 잇달아 오는 원문 줄은 «한 인용»으로 묶는다. */
      const 원문들 = [표시벗기기(토.값)];
      let j = i + 1;
      while (j < 토막들.length && 토막들[j].종류 === '원문') { 원문들.push(표시벗기기(토막들[j].값)); j++; }
      const 옮김 = [];
      while (j < 토막들.length && 토막들[j].종류 === '옮김') { 옮김.push(표시벗기기(토막들[j].값)); j++; }
      장들.push({
        종류: '원전', 제목: 지금절 || '', 원문: 원문들.join(' '), 옮김,
        출전: 토.출전 || (토막들[j - 1] && 토막들[j - 1].출전) || null,
      });
      i = j - 1;
      continue;
    }
    /* 🔴 표는 «한 장을 통째로» 쓴다 — 강의에서 제일 잘 보이는 그림이다 */
    if (토.종류 === '표') {
      비우기();
      장들.push({ 종류: '표', 제목: 지금절 || '', 행들: 토.행들 });
      continue;
    }
    /* 🔴 ⭐🔴⛔⚠ 로 짚은 한 줄은 «강조 카드» 한 장으로 — 글 목록에 섞지 않는다 */
    if (토.종류 === '짚을것') {
      비우기();
      장들.push({ 종류: '강조', 제목: 지금절 || '', 글: 표시이모지벗기기(표시벗기기(토.값)) });
      continue;
    }
    /* 🔴 [2026-09-22 · 사장님] 「설명은 짧게」
     *   산문을 다 실으면 슬라이드가 «대본»이 된다. 3줄로 끊어 봤더니 557장이 나왔다 —
     *   잘게 쪼갠다고 강의가 되는 것이 아니다.
     *   ⇒ 한 절의 산문은 «앞 두 줄»만 올린다. 그것이 그 절의 요점이다.
     *     나머지 설명은 교재에 있고, 강의에서는 사장님이 입으로 하신다.
     *   ⛔ 원전·표·짚을것은 «다» 싣는다 — 그것이 보여 줄 것이다. */
    const 꼴 = 토.종류 === '옮김' ? '인용' : '글';
    const 값 = 표시이모지벗기기(표시벗기기(토.값));
    if (꼴 === '글' && 절산문수 >= 절산문최대) { 남은설명.push(값); continue; }
    if (꼴 === '글') 절산문수++;
    const n = 흐르는줄수(값);
    if (센줄 + n > 한장줄수) 비우기();
    담을것.push({ 꼴, 글: 값 });
    센줄 += n;
  }
  비우기();
  노트붙이기();
  return 장들;
}

/** 원고 파일 이름에서 장 차례를 읽는다 — 「2권-원고-11-…」의 11 */
export function 장번호(이름) {
  const m = String(이름 ?? '').match(/2권-원고-(\d+)/);
  return m ? Number(m[1]) : 999;
}

/* ── 슬라이드 XML ───────────────────────────────────────────── */
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
  + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
  + ' xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';

/** 글 한 줄 → <a:p> */
export function 문단XML(글, { 크기 = 1800, 굵게 = false, 색 = null, 점 = false, 기울임 = false, 이어짐 = false } = {}) {
  const 속성 = `sz="${크기}"${굵게 ? ' b="1"' : ''}${기울임 ? ' i="1"' : ''} dirty="0"`;
  const 칠 = 색 ? `<a:solidFill><a:srgbClr val="${색}"/></a:solidFill>` : '';
  /* ⭐ 접혀서 이어지는 줄은 점을 빼되 «첫 줄 글자 아래»로 맞춘다 — 왼쪽 끝으로 붙으면 목록이 흐트러진다 */
  const 머리 = 점 ? '<a:pPr marL="285750" indent="-285750"/>'
    : (이어짐 ? '<a:pPr marL="285750" indent="0"><a:buNone/></a:pPr>'
      : '<a:pPr marL="0" indent="0"><a:buNone/></a:pPr>');
  return `<a:p>${머리}<a:r><a:rPr lang="ko-KR" altLang="en-US" ${속성}>${칠}</a:rPr>`
    + `<a:t>${엑스엠엘(글)}</a:t></a:r></a:p>`;
}

/* ══════════════════════════════════════════════════════════════════
 * 보는 것들 — 표 · 카드 · 두 칸
 *
 * 🔴 사장님 지시 (2026-09-22, 원문)
 *   「**내가 만든 ppt는 이미지가 많잖아. 너가 만든 건 텍스트만 있고.
 *    너무 성의없고, 수강생이 집중할 수도 없고, 내가 가르치기에도 갑갑하다**」
 *   「**visual 요소 대폭 강화, 설명은 짧게. 원래 ppt는 그림 1-2개로만 슬라이드 구성해야 함**」
 *
 * ── 사장님 1권 강의 PPT 를 열어 재 보니 ──────────────────────────
 *   슬라이드 부품 1,177 · 그림 **139장**. 대부분이 명리 책 지면을 «찍은 사진»이다.
 *   한 장에 그림 하나가 크게 있고, 말씀은 입으로 하신다.
 *   내가 지은 것은 그림 **0장**이었다. 강의 자료가 아니라 «대본」이었다.
 *
 * ── 그래서 무엇을 그리나 ────────────────────────────────────────
 *   남의 책을 찍어 넣지 않는다(우리 상품에 쓰면 저작권이 걸린다).
 *   대신 **우리가 그린다** — 파워포인트 «도형과 표»로 그리면 사진보다 선명하고,
 *   사장님이 강의 중에 직접 고치실 수도 있다.
 *     표      원고의 표를 진짜 파워포인트 표로   ← 그동안 «통째로 버리고» 있었다
 *     카드    원전 한 토막을 색 상자에 크게
 *     두 칸   순용 ↔ 역용 처럼 맞대는 것
 * ══════════════════════════════════════════════════════════════════ */

/** 16:9 — 12192000 × 6858000 EMU. 본문이 앉는 자리 */
export const 판 = { 폭: 12192000, 높이: 6858000, 왼: 838200, 위: 1600200, 속폭: 10515600, 속높이: 4400000 };
export const 표스타일 = '{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}';

/** 도형·표 칸 안의 글 한 줄 */
function 칸글(글, { 크기 = 1600, 굵게 = false, 색 = null, 가운데 = false } = {}) {
  const 칠 = 색 ? `<a:solidFill><a:srgbClr val="${색}"/></a:solidFill>` : '';
  return `<a:p><a:pPr${가운데 ? ' algn="ctr"' : ''}/><a:r>`
    + `<a:rPr lang="ko-KR" altLang="en-US" sz="${크기}"${굵게 ? ' b="1"' : ''} dirty="0">${칠}</a:rPr>`
    + `<a:t>${엑스엠엘(글)}</a:t></a:r></a:p>`;
}

/**
 * 원고의 표 → **진짜 파워포인트 표**.
 * ⛔ 그동안 `if (/^\|/.test(t)) continue;` 로 표를 버리고 있었다 — 강의에서 제일 잘 보이는 것을 버린 셈이다.
 */
export function 표그림XML(행들, id = 10) {
  const 줄 = (행들 || []).filter((r) => r && r.length);
  if (!줄.length) return '';
  const 칸수 = Math.max(...줄.map((r) => r.length));
  const 칸폭 = Math.floor(판.속폭 / 칸수);
  const 그리드 = Array.from({ length: 칸수 }, () => `<a:gridCol w="${칸폭}"/>`).join('');
  const 높이 = Math.min(500000, Math.floor(판.속높이 / Math.max(줄.length, 1)));
  const 행 = 줄.map((칸들, i) => {
    const 머리 = i === 0;
    const 칸 = Array.from({ length: 칸수 }, (_, j) => {
      const 글 = 칸들[j] ?? '';
      const 속 = 칸글(글, { 크기: 머리 ? 1500 : 1400, 굵게: 머리, 색: 머리 ? 'FFFFFF' : null });
      const 바탕 = 머리 ? '<a:solidFill><a:srgbClr val="1F3864"/></a:solidFill>'
        : (i % 2 === 0 ? '<a:solidFill><a:srgbClr val="F2F4F8"/></a:solidFill>' : '');
      return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${속}</a:txBody>`
        + `<a:tcPr marL="68580" marR="68580" marT="34290" marB="34290" anchor="ctr">${바탕}</a:tcPr></a:tc>`;
    }).join('');
    return `<a:tr h="${높이}">${칸}</a:tr>`;
  }).join('');
  return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="표"/>`
    + '<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
    + `<p:xfrm><a:off x="${판.왼}" y="${판.위}"/><a:ext cx="${판.속폭}" cy="${높이 * 줄.length}"/></p:xfrm>`
    + '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl>'
    + `<a:tblPr firstRow="1" bandRow="1"><a:tableStyleId>${표스타일}</a:tableStyleId></a:tblPr>`
    + `<a:tblGrid>${그리드}</a:tblGrid>${행}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
}

/** 색 상자 하나 — 원전 카드·강조 카드에 쓴다 */
export function 상자XML(문단들, { id = 20, x, y, cx, cy, 채움 = 'F2F4F8', 선 = 'C7CEDB' } = {}) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="상자${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>`
    + `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>`
    + '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 6000"/></a:avLst></a:prstGeom>'
    + `<a:solidFill><a:srgbClr val="${채움}"/></a:solidFill>`
    + `<a:ln w="12700"><a:solidFill><a:srgbClr val="${선}"/></a:solidFill></a:ln></p:spPr>`
    + '<p:txBody><a:bodyPr lIns="182880" tIns="137160" rIns="182880" bIns="137160" anchor="ctr">'
    /* 🔴 [2026-09-22] 빈 카드에서 «문단이 하나도 없는» txBody 가 나와 파워포인트가
       「파일을 열 수 없습니다」로 거부했다. XML 은 멀쩡한데 «규격»이 아니었다 —
       a:txBody 에는 a:p 가 적어도 하나 있어야 한다. 갈라서 재 보고 잡은 자리다. */
    + `<a:normAutofit/></a:bodyPr><a:lstStyle/>${문단들 || '<a:p/>'}</p:txBody></p:sp>`;
}

/**
 * **발표자 노트 한 장.**
 * 슬라이드에서 뺀 설명이 여기로 간다 — 강의 중에 사장님만 보신다. 손님 화면에는 안 나온다.
 * ⛔ 버리지 않는다. 옛 규칙 「조용히 줄이면 빠진 줄 모른다」가 여기서 지켜진다.
 */
export function 노트장XML(줄들) {
  const 문단 = (줄들 || []).map((t) => 칸글(t, { 크기: 1200 })).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    + `<p:notes ${NS}><p:cSld><p:spTree>`
    + '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
    + '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    + '<p:sp><p:nvSpPr><p:cNvPr id="2" name="슬라이드 이미지 개체 틀 1"/>'
    + '<p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr>'
    + '<p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>'
    + '<p:sp><p:nvSpPr><p:cNvPr id="3" name="슬라이드 노트 개체 틀 2"/>'
    + '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
    + '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/>'
    + `<p:txBody><a:bodyPr/><a:lstStyle/>${문단 || '<a:p/>'}</p:txBody></p:sp>`
    + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>';
}

/** 자리표(placeholder) 하나 */
function 자리XML(id, 이름, ph, 문단들) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${엑스엠엘(이름)}"/>`
    + `<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr>${ph}</p:nvPr></p:nvSpPr>`
    + `<p:spPr/><p:txBody><a:bodyPr><a:normAutofit/></a:bodyPr><a:lstStyle/>${문단들}</p:txBody></p:sp>`;
}

/** 슬라이드 하나를 XML 로. ⛔ 원본 레이아웃의 자리표를 쓴다 — 좌표를 우리가 정하지 않는다 */
export function 슬라이드XML(장) {
  let 몸 = '';
  if (장.종류 === '장여는장') {
    몸 = 자리XML(2, '제목 1', '<p:ph type="title"/>', 문단XML(장.제목, { 크기: 4000, 굵게: true }));
  } else if (장.종류 === '표') {
    /* 🔴 표 한 장 — 제목 한 줄 + 표 하나. 「그림 1~2개로만」의 그 그림이다 */
    몸 = 자리XML(2, '제목 1', '<p:ph type="title"/>', 문단XML(장.제목 || '표', { 크기: 2800, 굵게: true }))
      + 표그림XML(장.행들, 10);
  } else if (장.종류 === '강조') {
    /* 짚을 것 한 줄 — 색 카드에 크게. 강의에서 「여기를 보십시오」 하는 자리다 */
    const 속 = 줄접기(장.글, 24).map((t, i) =>
      칸글(t, { 크기: i === 0 ? 2800 : 2400, 굵게: true, 색: '1F3864', 가운데: true })).join('');
    몸 = 자리XML(2, '제목 1', '<p:ph type="title"/>', 문단XML(장.제목 || '', { 크기: 2400, 굵게: true }))
      + 상자XML(속, { id: 20, x: 판.왼, y: 판.위 + 300000, cx: 판.속폭, cy: 2400000, 채움: 'FFF6E5', 선: 'E0B252' });
  } else if (장.종류 === '원전') {
    /* 🔴 원전은 «카드»로 — 한문 원문을 크게, 옮김은 그 아래 작게, 출전은 더 작게.
       그냥 글줄로 두면 강의 화면에서 다른 슬라이드와 구별이 안 된다 */
    /* 🔴 [2026-09-22 · 사장님] 「한글 주석을 위에, 한자 원문을 아래에, 독음을 달아」
       ⇒ 위 상자 = 우리말 뜻(크게) · 아래 상자 = 한문 원문 + 독음 + 출전.
       그전에는 한문이 위였다. 강의에서 한문을 먼저 만나면 거기서 막힌다. */
    const 뜻속 = 장.옮김.flatMap((t) => 줄접기(t, 26))
      .map((t) => 칸글(t, { 크기: 2000, 굵게: true, 색: '1F3864', 가운데: true })).join('');
    const 원문속 = 줄접기(장.원문, 28).map((t) =>
      칸글(t, { 크기: 1600, 색: '333333', 가운데: true })).join('');
    const 소리 = 독음달기(장.원문);
    const 소리속 = (소리 && 소리 !== 장.원문)
      ? 줄접기(소리, 34).map((t) => 칸글(t, { 크기: 1200, 색: '6B7280', 가운데: true })).join('') : '';
    const 출전속 = 장.출전 ? 칸글('— ' + 출전줄임(장.출전), { 크기: 1100, 색: '6B7280', 가운데: true }) : '';
    /* ⛔ 위 상자가 «비면»(옮김이 없으면) 그리지 않는다 — 빈 네모가 화면에 남는다 */
    /* 🔴 [2026-09-22] 상자 높이를 «고정»으로 두었더니 글이 카드 밖으로 넘쳤다 — 눈으로 잡았다.
       ⇒ 줄 수를 세어 높이를 나눈다. 두 상자가 본문 자리(판.속높이)를 넘지 않게 한다. */
    const 위있나 = !!뜻속;
    const 뜻줄 = 위있나 ? 장.옮김.flatMap((t) => 줄접기(t, 26)).length : 0;
    const 아래줄 = 줄접기(장.원문, 28).length
      + (소리속 ? 줄접기(소리, 34).length : 0) + (출전속 ? 1 : 0);
    const 틈 = 150000;
    const 쓸높이 = 판.속높이 - (위있나 ? 틈 : 0);
    const 몫 = 뜻줄 + 아래줄 || 1;
    const 최소 = 900000;
    let 위높이 = 위있나 ? Math.max(최소, Math.round(쓸높이 * (뜻줄 / 몫))) : 0;
    let 아래높이 = Math.max(최소, 쓸높이 - 위높이);
    if (위높이 + 아래높이 > 쓸높이) 위높이 = Math.max(최소, 쓸높이 - 아래높이);
    몸 = 자리XML(2, '제목 1', '<p:ph type="title"/>', 문단XML(장.제목 || '원전', { 크기: 2600, 굵게: true }))
      + (위있나
        ? 상자XML(뜻속, { id: 20, x: 판.왼, y: 판.위, cx: 판.속폭, cy: 위높이, 채움: 'EAF0FA', 선: '9DB4D8' })
        : '')
      + 상자XML(원문속 + 소리속 + 출전속, {
        id: 21, x: 판.왼, y: 위있나 ? 판.위 + 위높이 + 틈 : 판.위,
        cx: 판.속폭, cy: 아래높이, 채움: 'FFFFFF', 선: 'D8DEE8',
      });
  } else {
    /* ⚠ 표·강조 장에는 「줄들」이 없다 — 여기로 떨어져도 안 터지게 꼴을 맞춰 준다 */
    const 줄들 = 장.줄들
      || (장.종류 === '표' ? (장.행들 || []).map((r) => ({ 꼴: '글', 글: r.join(' · ') }))
        : 장.글 ? [{ 꼴: '짚을것', 글: 장.글 }]
          : [{ 꼴: '글', 글: [장.원문, ...(장.옮김 || [])].filter(Boolean).join(' ') }]);
    const 문단 = 줄들.flatMap((r) => 줄접기(r.글).map((t, i) => 문단XML(t, {
      크기: r.꼴 === '짚을것' ? 1900 : 1800,
      굵게: r.꼴 === '짚을것',
      기울임: r.꼴 === '인용',
      점: r.꼴 === '글' && i === 0,      /* 접힌 둘째 줄부터는 점을 안 찍는다 */
      이어짐: i > 0,                     /* 대신 첫 줄 글자 아래로 들여 쓴다 */
    }))).join('');
    몸 = 자리XML(2, '제목 1', '<p:ph type="title"/>', 문단XML(장.제목 || ' ', { 크기: 2800, 굵게: true }))
      + 자리XML(3, '내용 개체 틀 2', '<p:ph idx="1"/>', 문단);
  }
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    + `<p:sld ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`
    + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    + `${몸}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

/** 장 → 어떤 레이아웃에 얹나 (이마트 원본의 레이아웃 번호) */
export function 레이아웃번호(장) {
  if (장.종류 === '표지') return 1;      /* 제목 슬라이드 */
  if (장.종류 === '장여는장') return 3;   /* 구역 머리글 */
  return 2;                              /* 제목 및 내용 */
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);

  검('한문 줄을 가른다', 한문줄인가('書雲，得時俱為旺論，失時便作衰看'));
  검('우리말 줄은 한문이 아니다', !한문줄인가('옛 글에 때를 얻으면 왕하다고 했다'));
  검('한자가 섞인 우리말은 우리말이다', !한문줄인가('억부론(抑扶論)은 신강 신약에서 시작한다'));
  검('⛔ 빈 줄·null 에도 안 터진다', !한문줄인가('') && !한문줄인가(null));
  검('굵게를 벗긴다', 표시벗기기('**죽은 법(死法)**이라 부른다') === '죽은 법(死法)이라 부른다');
  검('⛔ null 에도 안 터진다 — 표시벗기기', 표시벗기기(null) === '');
  검('긴 줄은 두 줄로 센다', 흐르는줄수('가'.repeat(한줄글자 + 1)) === 2);
  검('짧은 줄은 한 줄', 흐르는줄수('짧다') === 1);
  /* 🔴 [2026-09-22] 긴 줄이 화면 밖으로 잘려 나갔다 — 우리가 접는다 */
  /* 폭 7 이면 「가나다 라마바」(7자)까지 들어간다 — 낱말을 «쪼개지 않고» 다음 줄로 넘긴다 */
  검('낱말 자리에서 접는다', 줄접기('가나다 라마바 사아자', 7).join('|') === '가나다 라마바|사아자');
  검('⛔ 낱말을 가운데서 자르지 않는다', 줄접기('가나다 라마바 사아자', 7).every((s) => !/^ | $/.test(s)));
  검('⛔ 접어도 글자를 안 버린다', (() => {
    const 원 = '격은 그 사주의 기운이 어떤 구조로 짜였는지 가리키는 이름이고, 성패는 그 구조가 제 노릇을 하느냐다';
    return 줄접기(원).join(' ').replace(/\s+/g, '') === 원.replace(/\s+/g, '');
  })());
  검('⛔ 접은 줄이 폭을 안 넘는다',
    줄접기('가나다라마바사아자차카타파하'.repeat(6)).every((s) => s.length <= 한줄글자));
  검('빈 줄이면 빈 목록', 줄접기('').length === 0 && 줄접기(null).length === 0);
  검('표시 이모지를 벗긴다', 표시이모지벗기기('⭐ 겨울에도 해는 뜬다') === '겨울에도 해는 뜬다');
  검('⛔ 가운데 이모지는 안 건드린다', 표시이모지벗기기('해는 ⭐ 뜬다') === '해는 ⭐ 뜬다');

  const 보기 = [
    '# 제11장. 억부론과 부억용신', '',
    '> ⛔ 이 파일은 «원고»다.', '', '---', '',
    '## 1. 먼저 못 박을 것', '',
    '억부론은 신강·신약에서 시작한다.',
    '| 표 | 줄 |',
    '',
    '> 書雲，得時俱為旺論，失時便作衰看，雖是至理，亦死法也。',
    '> — 『子平真詮評註』 論十幹得時不旺失時不弱', '',
    '> 「옛 글에 «때를 얻으면 다 왕하다»고 했다. **또한 죽은 법이다.**」', '',
    '⭐ 겨울에도 해는 뜬다.', '',
    '## 2. 다음 자리', '- 첫째 줄', '- 둘째 줄',
  ].join('\n');

  const 토 = 원고가르기(보기);
  검('장제목을 잡는다', 토[0].종류 === '장제목');
  검('⛔ 파일 앞머리 메모를 안 싣는다', !토.some((x) => /이 파일은/.test(x.값)));
  검('⛔ 표 줄은 안 싣는다', !토.some((x) => /^\|/.test(x.값)));
  검('원문·옮김을 가른다',
    토.some((x) => x.종류 === '원문' && /書雲/.test(x.값)) && 토.some((x) => x.종류 === '옮김' && /죽은 법/.test(x.값)));
  검('출전을 원문에 붙인다', 토.some((x) => x.종류 === '원문' && /子平真詮評註/.test(x.출전 || '')));
  검('짚을것을 잡는다', 토.some((x) => x.종류 === '짚을것'));

  const 장 = 슬라이드나누기(토);
  검('장 여는 장이 맨 앞', 장[0].종류 === '장여는장');
  검('원전은 제 장을 갖는다', 장.some((s) => s.종류 === '원전'));
  검('⭐ 원전 장에 우리말이 같이 실린다', 장.find((s) => s.종류 === '원전').옮김.some((t) => /죽은 법/.test(t)));
  검('원전 장에 출전이 실린다', /子平真詮評註/.test(장.find((s) => s.종류 === '원전').출전 || ''));

  /* 🔴 [2026-09-22 · 사장님] 「조그맣게 -자평진전 이라고 명기해...너무 커 지금은」 */
  검('책이름을 한글로 줄인다', 출전줄임('『子平真詮評註』 論行運') === '자평진전 論行運');
  검('앞의 줄표를 뗀다', 출전줄임('— 『子平真詮評註』 論相神緊要') === '자평진전 論相神緊要');
  검('적천수도 줄인다', 출전줄임('『滴天髓闡微』 論用神') === '적천수 論用神');
  검('궁통보감도 줄인다', 출전줄임('窮通寶鑑(난강망) 三春甲木') === '궁통보감 三春甲木');
  검('⛔ 편명은 남긴다 — 대조할 수 있어야 한다', 출전줄임('『子平真詮評註』 論財取運').includes('論財取運'));
  검('⛔ 빈 것에도 안 터진다', 출전줄임(null) === '' && 출전줄임(undefined) === '');
  검('둘째 절이 새 장으로 간다', 장.some((s) => s.종류 === '내용' && s.제목 === '2. 다음 자리'));
  검('⛔ 한 장에 여섯 줄을 안 넘는다',
    장.filter((s) => s.종류 === '내용').every((s) => s.줄들.reduce((a, r) => a + 흐르는줄수(r.글), 0) <= 한장줄수));
  검('⛔ 빈 원고에도 안 터진다', 슬라이드나누기(원고가르기('')).length === 0);

  /* 🔴 [2026-09-22] 사장님이 「설명은 짧게」라 하셔서 한 절의 산문을 두 토막만 «화면»에 올린다.
     ⛔ 그렇다고 버리지는 않는다 — 나머지는 «발표자 노트»로 간다. 옛 규칙
       「조용히 줄이면 빠진 줄 모른다」가 여기서 지켜진다. 아홉 줄을 넣어 세어 본다. */
  const 긴판 = 슬라이드나누기(원고가르기('# 장\n\n---\n\n## 절\n\n'
    + Array.from({ length: 9 }, (_, i) => `${i + 1}번째 줄이다.`).join('\n\n')));
  const 긴것 = 긴판.filter((s) => s.종류 === '내용');
  const 화면줄 = 긴것.reduce((a, s) => a + s.줄들.length, 0);
  const 노트줄 = 긴판.reduce((a, s) => a + (s.노트 ? s.노트.length : 0), 0);
  검('화면에는 두 토막만 올린다', 화면줄 === 절산문최대);
  검('🔴 나머지는 «노트»로 간다 — 한 줄도 안 버린다', 화면줄 + 노트줄 === 9);
  검('노트가 실제로 붙는다', 노트줄 === 7);
  검('노트 XML 이 p:notes 다', /<p:notes /.test(노트장XML(['가', '나'])));
  검('노트에 글이 들어간다', 노트장XML(['첫 줄']).includes('첫 줄'));
  검('⛔ 빈 노트에도 안 터진다', /<a:p\/>/.test(노트장XML([])));

  검('장 번호를 파일 이름에서 읽는다', 장번호('2권-원고-11-억부론-희신기신구신.md') === 11);
  검('못 읽으면 맨 뒤로', 장번호('딴것.md') === 999);
  검('원고방이 klifemap 쪽이다', /klifemap/.test(원고방));

  /* 슬라이드 XML */
  const x = 슬라이드XML(장.find((s) => s.종류 === '원전'));
  검('슬라이드 XML 이 p:sld 로 시작한다', /<p:sld /.test(x));
  검('원문이 XML 에 그대로 들어간다', x.includes('書雲'));
  검('제목은 자리표를 쓴다', /<p:ph type="title"\/>/.test(x));
  /* ⚠ [2026-09-22] 「좌표를 슬라이드에 안 박는다」를 걷었다 — 사장님이 «그림»을 넣으라 하셨고,
     도형·표는 좌표 없이 못 놓는다. 글 슬라이드는 그대로 자리표를 쓴다. */
  검('원전은 «카드»로 그린다 — 좌표가 든다', /<a:prstGeom prst="roundRect"/.test(x));
  검('글 슬라이드는 여전히 자리표를 쓴다', (() => {
    const g = 장.find((s) => s.종류 === '내용');
    return !g || /<p:ph idx="1"\/>/.test(슬라이드XML(g));
  })());
  검('XML 글자를 벗긴다', 문단XML('a & b < c').includes('a &amp; b &lt; c'));
  검('⛔ & 를 두 번 안 바꾼다', 엑스엠엘('&lt;') === '&amp;lt;');

  /* 🔴 [2026-09-22 · 사장님] 「visual 요소 대폭 강화, 설명은 짧게」 */
  {
    const 표원고 = 원고가르기('# 장\n\n---\n\n## 표 절\n\n| 낱말 | 뜻 |\n|---|---|\n| 상신 | 격을 세운다 |\n| 기신 | 격을 막는다 |\n');
    검('🔴 표를 «버리지» 않는다', 표원고.some((t) => t.종류 === '표'));
    검('가름줄은 버린다', 표원고.find((t) => t.종류 === '표').행들.length === 3);
    const 표장 = 슬라이드나누기(표원고).find((s) => s.종류 === '표');
    검('표가 «한 장»을 쓴다', !!표장);
    const 표x = 슬라이드XML(표장);
    검('🔴 진짜 파워포인트 표로 나온다', /<a:tbl>/.test(표x) && /graphicframe|graphicFrame/i.test(표x));
    검('표 칸에 글이 들어간다', 표x.includes('상신') && 표x.includes('격을 세운다'));
    검('머리 줄에 색이 든다', /1F3864/.test(표x));

    const 짚원고 = 원고가르기('# 장\n\n---\n\n## 절\n\n⭐ 이것이 핵심이다\n');
    const 짚장 = 슬라이드나누기(짚원고).find((s) => s.종류 === '강조');
    검('짚을 것은 «강조 카드» 한 장이다', !!짚장);
    검('강조 카드가 색 상자로 나온다', /roundRect/.test(슬라이드XML(짚장)) && /FFF6E5/.test(슬라이드XML(짚장)));
    검('⛔ 이모지는 화면에 안 낸다', !슬라이드XML(짚장).includes('⭐'));

    검('설명은 짧게 — 한 장 3줄', 한장줄수 === 3);
    검('한 줄도 짧게', 한줄글자 === 28);
    검('⛔ 빈 표에는 아무것도 안 그린다', 표그림XML([]) === '');
    /* 🔴 [2026-09-22] 파워포인트가 파일을 «못 열었다» — 빈 카드의 txBody 에 a:p 가 없었다.
       XML 은 멀쩡한데 규격이 아니었다. 가르고 재서 잡은 자리다. */
    검('🔴 빈 카드에도 문단이 하나는 있다', /<a:p\/>/.test(상자XML('', { x: 0, y: 0, cx: 100, cy: 100 })));
    /* 🔴 원문이 여러 줄이면 «한 인용»으로 묶는다 — 안 묶으면 옮김 상자가 빈 채로 그려졌다 */
    const 두줄원문 = 슬라이드나누기(원고가르기(
      '# 장\n\n---\n\n## 절\n\n> 何謂成？如官逢財印，\n> 又無刑衝破害，官格成也。\n> 「무엇을 성이라 하는가」\n> — 『子平真詮評註』 論用神\n'));
    const 원전장들 = 두줄원문.filter((s) => s.종류 === '원전');
    검('🔴 잇단 원문을 한 장으로 묶는다', 원전장들.length === 1);
    검('그 장에 옮김이 붙는다', 원전장들[0].옮김.length === 1);
    검('⛔ 옮김이 없으면 위 상자를 안 그린다',
      (슬라이드XML({ 종류: '원전', 제목: 'ㄱ', 원문: '天', 옮김: [], 출전: null })
        .match(/roundRect/g) || []).length === 1);

    /* 🔴 [2026-09-22 · 사장님] 「한글 주석을 위에, 한자 원문을 아래에, 독음을 달아」 */
    검('독음을 단다', 독음달기('何謂成') === '하위성');
    검('🔴 두음법칙 — 구 첫 글자는 앞것', 독음달기('論用神') === '논용신');
    검('🔴 구 안쪽은 뒷것', 독음달기('格局論') === '격국론');
    검('구두점을 그대로 둔다', 독음달기('官格成也。') === '관격성야。');
    검('⛔ 빈 것에도 안 터진다', 독음달기('') === '' && 독음달기(null) === '');
    {
      const x = 슬라이드XML({ 종류: '원전', 제목: 'ㄱ', 원문: '何謂成？', 옮김: ['무엇을 성이라 하는가?'], 출전: '『子平真詮評註』 論用神' });
      const 한글 = x.indexOf('무엇을 성이라');
      const 한자 = x.indexOf('何謂成');
      검('🔴 한글 뜻이 «위»에 온다', 한글 >= 0 && 한자 >= 0 && 한글 < 한자);
      검('🔴 슬라이드에도 독음이 붙는다', x.includes('하위성'));
      검('독음은 원문보다 작다', x.includes('sz="1200"') && x.includes('sz="1600"'));
      검('출전이 맨 뒤다', x.lastIndexOf('자평진전') > 한자);
    }
    /* 🔴 상자 높이를 고정으로 두었더니 글이 카드 밖으로 넘쳤다 — 줄 수에 맞춰 나눈다 */
    {
      const 긴뜻 = Array.from({ length: 8 }, (_, i) => `아주 긴 우리말 옮김 줄 ${i + 1} 입니다 그래서 여러 줄로 흐릅니다`);
      const x = 슬라이드XML({ 종류: '원전', 제목: 'ㄱ', 원문: '天', 옮김: 긴뜻, 출전: null });
      const 높이들 = [...x.matchAll(/<a:ext cx="\d+" cy="(\d+)"\/>/g)].map((m) => Number(m[1])).filter((n) => n > 0);
      검('🔴 두 상자가 본문 자리를 안 넘는다',
        높이들.length >= 2 && 높이들.reduce((a, b) => a + b, 0) <= 판.속높이);
      검('긴 뜻이면 위 상자가 더 크다', 높이들[0] > 높이들[1]);
      const y = 슬라이드XML({ 종류: '원전', 제목: 'ㄱ', 원문: '天地玄黃宇宙洪荒', 옮김: ['한 줄'], 출전: null });
      const h2 = [...y.matchAll(/<a:ext cx="\d+" cy="(\d+)"\/>/g)].map((m) => Number(m[1])).filter((n) => n > 0);
      검('짧은 뜻이면 아래 상자가 더 크다', h2[1] > h2[0]);
    }
  }
  검('장 여는 장은 layout3', 레이아웃번호({ 종류: '장여는장' }) === 3);
  검('내용 장은 layout2', 레이아웃번호({ 종류: '내용' }) === 2);
  검('표지는 layout1', 레이아웃번호({ 종류: '표지' }) === 1);

  /* zip 왕복 */
  const 꾸 = 집만들기([{ 이름: 'a.xml', 몸: '<x>가</x>' }, { 이름: 'b/c.txt', 몸: Buffer.from('나') }]);
  const 다시 = 집목록(꾸);
  검('zip 을 만들고 다시 읽는다', 다시.length === 2 && 다시[0].이름 === 'a.xml');
  검('zip 속을 그대로 꺼낸다', 집에서꺼내기(꾸, 다시[0]).toString('utf8') === '<x>가</x>');
  검('한글 이름·내용이 안 깨진다', 집에서꺼내기(꾸, 다시[1]).toString('utf8') === '나');
  검('⛔ 이름이 겹치면 나중 것 하나만 남는다',
    집목록(집만들기([{ 이름: 'a', 몸: '1' }, { 이름: 'a', 몸: '2' }])).length === 1);

  검('스타일 원본을 원드라이브에서 찾는다', 스타일원본.some((p) => /이마트/.test(p)));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 원고를 모은다 ──────────────────────────────────────────── */
function 원고모으기() {
  if (!fs.existsSync(원고방)) return [];
  return fs.readdirSync(원고방)
    .filter((f) => f.endsWith('.md'))
    .sort((a, b) => 장번호(a) - 장번호(b) || a.localeCompare(b))
    .map((f) => ({ 파일: f, 글: fs.readFileSync(path.join(원고방, f), 'utf8') }));
}

if (내가진입점 && process.argv.includes('--뼈대')) {
  const 것 = 원고모으기();
  if (!것.length) { console.error('🔴 원고를 못 찾았다 —', 원고방); process.exit(1); }
  let 모두 = 0;
  console.log('■ 셀프사주 2권 강의 슬라이드 — 무엇이 몇 장이 되나\n');
  for (const { 파일, 글 } of 것) {
    const 장 = 슬라이드나누기(원고가르기(글));
    모두 += 장.length;
    console.log(`  ${String(장번호(파일)).padStart(2)}장  ${String(장.length).padStart(3)}장  (원전 ${장.filter((s) => s.종류 === '원전').length})  ${파일}`);
  }
  console.log(`\n  모두 ${모두}장 + 표지 1장`);
  const 원 = 스타일원본.find((p) => fs.existsSync(p));
  console.log(`  스타일 원본 : ${원 || '🔴 못 찾았다'}`);
  process.exit(0);
}

/* ── 짓는다 ──────────────────────────────────────────────── */
if (내가진입점 && process.argv.includes('--짓는다')) {
  const 원본길 = 스타일원본.find((p) => fs.existsSync(p));
  if (!원본길) { console.error('🔴 스타일 원본(이마트 pptx)을 못 찾았다'); process.exit(1); }
  const 원고들 = 원고모으기();
  if (!원고들.length) { console.error('🔴 원고를 못 찾았다 —', 원고방); process.exit(1); }

  const 원버퍼 = fs.readFileSync(원본길);
  const 원목록 = 집목록(원버퍼);
  const 원꺼 = (이름) => 글로꺼내기(원버퍼, 원목록, 이름);

  /* ① 물려받을 서식 부품 — 슬라이드 본문·노트«슬라이드»·강의 사진은 «안» 가져온다
     🔴 [2026-09-22] 처음에 notesMaster·handoutMaster 를 빼고 냈더니 파워포인트가
       「파일이 손상되었습니다」로 안 열렸다. presentation.xml 의 notesMasterIdLst·
       handoutMasterIdLst 가 그 둘을 가리키는데 부품이 없었던 것이다.
       ⇒ **관계가 가리키는 부품은 반드시 같이 넣거나, 관계를 같이 지운다.** 둘 중 하나다. */
  const 물림 = 원목록.filter((e) =>
    /^ppt\/(theme\/|slideMasters\/|slideLayouts\/|notesMasters\/|handoutMasters\/|presProps\.xml$|viewProps\.xml$|tableStyles\.xml$)/.test(e.이름));
  /* 마스터·레이아웃이 쓰는 그림이 있으면 그것만 데려온다 */
  const 쓰는그림 = new Set();
  for (const e of 물림) {
    if (!/_rels\//.test(e.이름)) continue;
    const r = 원꺼(e.이름) || '';
    for (const m of r.matchAll(/Target="\.\.\/(media\/[^"]+)"/g)) 쓰는그림.add('ppt/' + m[1]);
  }
  const 그림들 = 원목록.filter((e) => 쓰는그림.has(e.이름));

  const 부품 = [];
  for (const e of [...물림, ...그림들]) {
    const 몸 = 집에서꺼내기(원버퍼, e);
    if (몸) 부품.push({ 이름: e.이름, 몸 });
  }

  /* ② 슬라이드를 짓는다 */
  const 장들 = [{ 종류: '표지' }];
  for (const { 글 } of 원고들) 장들.push(...슬라이드나누기(원고가르기(글)));

  const 표지XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    + `<p:sld ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`
    + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    + 자리XML(2, '제목 1', '<p:ph type="ctrTitle"/>', 문단XML('셀프사주 2권', { 크기: 5400, 굵게: true }))
    + 자리XML(3, '부제목 2', '<p:ph type="subTitle" idx="1"/>',
      문단XML('사주 보는 법(2) · 심화 — 강의용', { 크기: 2000 }) + 문단XML(new Date().toLocaleDateString('ko-KR'), { 크기: 1400 }))
    + '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';

  장들.forEach((장, i) => {
    const n = i + 1;
    const L = 레이아웃번호(장);
    부품.push({ 이름: `ppt/slides/slide${n}.xml`, 몸: 장.종류 === '표지' ? 표지XML : 슬라이드XML(장) });
    /* 🔴 슬라이드에서 뺀 설명은 «발표자 노트»로 내린다 — 버리지 않는다.
       사장님: 「설명은 짧게」 + 옛 규칙 「조용히 줄이면 빠진 줄 모른다」 — 둘 다 지키는 길이다. */
    const 노트 = (장.노트 || []).filter(Boolean);
    부품.push({
      이름: `ppt/slides/_rels/slide${n}.xml.rels`,
      몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout${L}.xml"/>`
        + (노트.length ? `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${n}.xml"/>` : '')
        + '</Relationships>',
    });
    if (노트.length) {
      부품.push({ 이름: `ppt/notesSlides/notesSlide${n}.xml`, 몸: 노트장XML(노트) });
      부품.push({
        이름: `ppt/notesSlides/_rels/notesSlide${n}.xml.rels`,
        몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
          + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
          + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>'
          + `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${n}.xml"/>`
          + '</Relationships>',
      });
    }
  });

  /* ③ presentation.xml — 슬라이드 목록만 새로 쓴다 */
  const 원프 = 원꺼('ppt/presentation.xml');
  const 원프rels = 원꺼('ppt/_rels/presentation.xml.rels');
  if (!원프 || !원프rels) { console.error('🔴 presentation.xml 을 못 읽었다'); process.exit(1); }

  /* 슬라이드가 아닌 관계는 살리되, **부품을 안 가져온 것은 관계도 지운다.**
     ⛔ changesInfo·revisionInfo·authors 는 1권 강의의 편집 이력이다 — 2권 것이 아니다.
       남겨 두면 가리키는 부품이 없어 꾸러미가 깨진다. */
  const 버릴관계 = /relationships\/slide"|notesSlide|changesInfo|revisionInfo|\/authors"/;
  const 남길관계 = [...원프rels.matchAll(/<Relationship [^>]*\/>/g)].map((m) => m[0])
    .filter((s) => !버릴관계.test(s));
  const 슬관계 = 장들.map((_, i) => {
    const id = `rIdS${i + 1}`;
    return { id, xml: `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>` };
  });
  부품.push({
    이름: 'ppt/_rels/presentation.xml.rels',
    몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + 슬관계.map((x) => x.xml).join('') + 남길관계.join('') + '</Relationships>',
  });
  const 새목록 = '<p:sldIdLst>' + 슬관계.map((x, i) => `<p:sldId id="${256 + i}" r:id="${x.id}"/>`).join('') + '</p:sldIdLst>';
  부품.push({
    이름: 'ppt/presentation.xml',
    몸: /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/.test(원프)
      ? 원프.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, 새목록)
      : 원프.replace('<p:sldSz', 새목록 + '<p:sldSz'),
  });

  /* ④ [Content_Types].xml — 우리 부품만 적는다 */
  const 확장 = new Set(['rels', 'xml']);
  for (const x of 부품) { const m = x.이름.match(/\.([a-z0-9]+)$/i); if (m) 확장.add(m[1].toLowerCase()); }
  const 기본꼴 = { rels: 'application/vnd.openxmlformats-package.relationships+xml', xml: 'application/xml', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', emf: 'image/x-emf', wmf: 'image/x-wmf', svg: 'image/svg+xml', bin: 'application/vnd.openxmlformats-officedocument.oleObject' };
  const 덮을것 = [];
  for (const x of 부품) {
    if (/^ppt\/slides\/slide\d+\.xml$/.test(x.이름)) 덮을것.push([x.이름, 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml']);
    else if (/^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(x.이름)) 덮을것.push([x.이름, 'application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml']);
    else if (/^ppt\/slideMasters\/slideMaster\d+\.xml$/.test(x.이름)) 덮을것.push([x.이름, 'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml']);
    else if (/^ppt\/theme\/theme\d+\.xml$/.test(x.이름)) 덮을것.push([x.이름, 'application/vnd.openxmlformats-officedocument.theme+xml']);
    else if (/^ppt\/notesMasters\/notesMaster\d+\.xml$/.test(x.이름)) 덮을것.push([x.이름, 'application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml']);
    /* ⛔ 노트 장을 여기 안 적으면 파워포인트가 「손상됐다」고 한다 — 부품만 넣어서는 안 된다 */
    else if (/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(x.이름)) 덮을것.push([x.이름, 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml']);
    else if (/^ppt\/handoutMasters\/handoutMaster\d+\.xml$/.test(x.이름)) 덮을것.push([x.이름, 'application/vnd.openxmlformats-officedocument.presentationml.handoutMaster+xml']);
  }
  덮을것.push(['/ppt/presentation.xml', 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml']);
  덮을것.push(['/ppt/presProps.xml', 'application/vnd.openxmlformats-officedocument.presentationml.presProps+xml']);
  덮을것.push(['/ppt/viewProps.xml', 'application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml']);
  덮을것.push(['/ppt/tableStyles.xml', 'application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml']);
  덮을것.push(['/docProps/core.xml', 'application/vnd.openxmlformats-package.core-properties+xml']);
  덮을것.push(['/docProps/app.xml', 'application/vnd.openxmlformats-officedocument.extended-properties+xml']);
  부품.push({
    이름: '[Content_Types].xml',
    몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + [...확장].filter((e) => 기본꼴[e]).map((e) => `<Default Extension="${e}" ContentType="${기본꼴[e]}"/>`).join('')
      + [...new Map(덮을것.map(([n, t]) => [n.startsWith('/') ? n : '/' + n, t])).entries()]
        .map(([n, t]) => `<Override PartName="${n}" ContentType="${t}"/>`).join('')
      + '</Types>',
  });

  /* ⑤ 뿌리 관계와 문서 속성 */
  부품.push({
    이름: '_rels/.rels',
    몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
      + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
      + '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
      + '</Relationships>',
  });
  const 이제 = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  부품.push({
    이름: 'docProps/core.xml',
    몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
      + '<dc:title>셀프사주 2권 — 강의용</dc:title><dc:creator>범진아카데미</dc:creator><cp:lastModifiedBy>범진아카데미</cp:lastModifiedBy>'
      + `<dcterms:created xsi:type="dcterms:W3CDTF">${이제}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${이제}</dcterms:modified>`
      + '</cp:coreProperties>',
  });
  부품.push({
    이름: 'docProps/app.xml',
    몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
      + `<Application>Microsoft Office PowerPoint</Application><Slides>${장들.length}</Slides></Properties>`,
  });

  fs.mkdirSync(낼방, { recursive: true });
  const 낼길 = path.join(낼방, `셀프사주2-강의용-${new Date().toLocaleDateString('sv-SE')}.pptx`);
  /* ⚠ [Content_Types].xml 이 꾸러미의 «첫 부품»이어야 한다 — OPC 규약이고 오피스가 까다롭다 */
  const 차례 = [...부품].sort((a, b) => (a.이름 === '[Content_Types].xml' ? -1 : b.이름 === '[Content_Types].xml' ? 1 : 0));
  fs.writeFileSync(낼길, 집만들기(차례));
  const 크기 = fs.statSync(낼길).size;

  console.log(`■ 셀프사주 2권 강의용 PPT — 슬라이드 ${장들.length}장 · ${(크기 / 1024).toFixed(0)} KB`);
  console.log(`   스타일 물려받은 곳 : ${원본길}`);
  console.log(`   물려받은 서식 부품 ${물림.length}개 · 마스터가 쓰는 그림 ${그림들.length}개`);
  console.log(`   원고 ${원고들.length}편 — ${원고들.map((x) => 장번호(x.파일) + '장').join(' · ')}`);
  console.log(`   → ${낼길}`);
}
