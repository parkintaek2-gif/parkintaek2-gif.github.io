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

/** 한 장에 넣을 «본문 줄» 최대 — 넘치면 장을 넘긴다 */
export const 한장줄수 = 6;
/** 한 줄이 이보다 길면 강의 화면에서 두 줄로 흐른다 */
export const 한줄글자 = 34;

/* ── 원고를 토막으로 가른다 ─────────────────────────────────────── */

/** 한문이 절반 넘게 든 줄인가 — 원전 «원문»과 «우리말 옮김»을 가른다 */
export function 한문줄인가(줄) {
  const s = String(줄 ?? '').replace(/[\s，。、：；？！「」『』（）()·…—]/g, '');
  if (!s) return false;
  return (s.match(/[\u4e00-\u9fff]/g) || []).length / s.length >= 0.5;
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
    if (/^\|/.test(t)) continue;                       /* 표는 슬라이드에서 따로 짠다 — 지금은 안 싣는다 */
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
  const 비우기 = () => {
    if (!담을것.length) return;
    장들.push({ 종류: '내용', 제목: 지금절 || '', 줄들: 담을것 });
    담을것 = []; 센줄 = 0;
  };
  for (let i = 0; i < (토막들 || []).length; i++) {
    const 토 = 토막들[i];
    if (토.종류 === '장제목') { 비우기(); 장들.push({ 종류: '장여는장', 제목: 표시벗기기(토.값) }); 지금절 = null; continue; }
    if (토.종류 === '절제목') { 비우기(); 지금절 = 표시벗기기(토.값); continue; }
    if (토.종류 === '원문') {
      비우기();
      const 옮김 = [];
      let j = i + 1;
      while (j < 토막들.length && 토막들[j].종류 === '옮김') { 옮김.push(표시벗기기(토막들[j].값)); j++; }
      장들.push({
        종류: '원전', 제목: 지금절 || '', 원문: 표시벗기기(토.값), 옮김,
        출전: 토.출전 || (토막들[j - 1] && 토막들[j - 1].출전) || null,
      });
      i = j - 1;
      continue;
    }
    const 꼴 = 토.종류 === '짚을것' ? '짚을것' : (토.종류 === '옮김' ? '인용' : '글');
    const 값 = 표시이모지벗기기(표시벗기기(토.값));
    const n = 흐르는줄수(값);
    if (센줄 + n > 한장줄수) 비우기();
    담을것.push({ 꼴, 글: 값 });
    센줄 += n;
  }
  비우기();
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
  } else if (장.종류 === '원전') {
    /* 원문은 한문이라 한 줄에 덜 들어간다 — 좁게 접는다 */
    const 문단 = [
      ...줄접기(장.원문, 26).map((t) => 문단XML(t, { 크기: 2000 })),
      ...장.옮김.flatMap((t) => 줄접기(t, 32).map((x) => 문단XML(x, { 크기: 1800, 기울임: true }))),
      ...(장.출전 ? [문단XML(장.출전, { 크기: 1200, 색: '6B7280' })] : []),
    ].join('');
    몸 = 자리XML(2, '제목 1', '<p:ph type="title"/>', 문단XML(장.제목 || '원전', { 크기: 2800, 굵게: true }))
      + 자리XML(3, '내용 개체 틀 2', '<p:ph idx="1"/>', 문단);
  } else {
    const 문단 = 장.줄들.flatMap((r) => 줄접기(r.글).map((t, i) => 문단XML(t, {
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
  검('둘째 절이 새 장으로 간다', 장.some((s) => s.종류 === '내용' && s.제목 === '2. 다음 자리'));
  검('⛔ 한 장에 여섯 줄을 안 넘는다',
    장.filter((s) => s.종류 === '내용').every((s) => s.줄들.reduce((a, r) => a + 흐르는줄수(r.글), 0) <= 한장줄수));
  검('⛔ 빈 원고에도 안 터진다', 슬라이드나누기(원고가르기('')).length === 0);

  const 긴것 = 슬라이드나누기(원고가르기('# 장\n\n---\n\n## 절\n\n'
    + Array.from({ length: 9 }, (_, i) => `${i + 1}번째 줄이다.`).join('\n\n'))).filter((s) => s.종류 === '내용');
  검('넘치면 장을 넘긴다', 긴것.length >= 2);
  검('⛔ 넘겨도 줄을 안 버린다', 긴것.reduce((a, s) => a + s.줄들.length, 0) === 9);

  검('장 번호를 파일 이름에서 읽는다', 장번호('2권-원고-11-억부론-희신기신구신.md') === 11);
  검('못 읽으면 맨 뒤로', 장번호('딴것.md') === 999);
  검('원고방이 klifemap 쪽이다', /klifemap/.test(원고방));

  /* 슬라이드 XML */
  const x = 슬라이드XML(장.find((s) => s.종류 === '원전'));
  검('슬라이드 XML 이 p:sld 로 시작한다', /<p:sld /.test(x));
  검('원문이 XML 에 그대로 들어간다', x.includes('書雲'));
  검('자리표를 쓴다 — 좌표를 우리가 안 정한다', /<p:ph type="title"\/>/.test(x) && /<p:ph idx="1"\/>/.test(x));
  검('⛔ 좌표(a:off)를 슬라이드에 안 박는다', !/<a:off x="\d{5,}"/.test(x));
  검('XML 글자를 벗긴다', 문단XML('a & b < c').includes('a &amp; b &lt; c'));
  검('⛔ & 를 두 번 안 바꾼다', 엑스엠엘('&lt;') === '&amp;lt;');
  검('짚을것은 굵게', /b="1"/.test(슬라이드XML(장.find((s) => s.종류 === '내용' && s.줄들.some((r) => r.꼴 === '짚을것')))));
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
    부품.push({
      이름: `ppt/slides/_rels/slide${n}.xml.rels`,
      몸: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout${L}.xml"/>`
        + '</Relationships>',
    });
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
