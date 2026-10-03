#!/usr/bin/env node
/**
 * md-to-docx.mjs — **사장님께 드리는 보고서를 «워드»로 만든다.**
 *
 * 🔴🔴 사장님 지시 (2026-10-03 밤, 원문)
 *   「**표가 다 깨진다. 슬라이드나 워드로 보내**」
 *
 *   그날 22시 전 유닛 점검 보고를 **PDF 로** 드렸더니 표가 깨져 보이셨다.
 *   우리 저장소에는 2026-09-05 지시(「.md 파일 표 다 깨져. 엑셀로 보내던지 pdf로 보내던지」)로
 *   만든 `md-to-pdf.mjs` 가 있었고 나는 그것을 그대로 따랐다.
 *   ⇒ **나중 지시가 앞선 것을 덮는다.** 표가 든 보고서는 이제 워드로 낸다.
 *
 * ⭐ 판별법 — 그 글에 표가 들어 있으면 PDF·마크다운으로 보내지 않는다.
 *
 * 쓰는 법
 *   node scripts/md-to-docx.mjs <보고.md> [--out 경로.docx]
 *   node scripts/md-to-docx.mjs --자가시험
 *
 * ⛔ 웹폰트를 안 쓴다. 윈도우에 늘 있는 **맑은 고딕**으로 짠다.
 * ⛔ `\n` 으로 줄을 바꾸지 않는다 — 워드는 문단(Paragraph)을 따로 둬야 한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

export const 글꼴 = '맑은 고딕';
/** 본문 폭(DXA). A4 세로에서 좌우 여백 1인치를 뺀 값 */
export const 본문폭 = 9360;

/* ───────────────────────── 마크다운 읽기 ───────────────────────── */

export const 표줄인가 = (l) => /^\s*\|.*\|\s*$/.test(String(l ?? ''));
export const 가름줄인가 = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(String(l ?? '')) && String(l).includes('-');
export const 칸나누기 = (l) => String(l).trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

/**
 * 한 줄 안의 꾸밈(**굵게** · `코드`)을 토막으로 가른다.
 *
 * ⚠ 굵게를 «두 줄에 걸쳐» 쓴 글은 여기서 별표가 글자로 샌다.
 *   그것은 이 자의 흠이 아니라 **글의 흠**이다 — 글 쪽에서 한 줄로 고친다.
 *   (2026-10-03 에 전 유닛 점검 보고가 실제로 그랬다)
 */
export function 토막내기(줄) {
  const s = String(줄 ?? '');
  const 토막 = [];
  /* ⛔ 코드를 «먼저» 가른다 — 코드칸 안의 별표를 굵게로 읽지 않기 위해서다 */
  const 조각 = s.split(/(`[^`]+`)/g);
  for (const 조 of 조각) {
    if (!조) continue;
    if (조.startsWith('`') && 조.endsWith('`') && 조.length > 1) {
      토막.push({ 글: 조.slice(1, -1), 코드: true });
      continue;
    }
    for (const 쪽 of 조.split(/(\*\*[^*]+\*\*)/g)) {
      if (!쪽) continue;
      if (쪽.startsWith('**') && 쪽.endsWith('**') && 쪽.length > 4) 토막.push({ 글: 쪽.slice(2, -2), 굵게: true });
      else 토막.push({ 글: 쪽 });
    }
  }
  return 토막.length ? 토막 : [{ 글: '' }];
}

/** 마크다운을 덩이 목록으로 읽는다 — {갈래, …} */
export function 덩이읽기(글) {
  const 줄들 = String(글 ?? '').replace(/\r/g, '').split('\n');
  const 덩이 = [];
  let i = 0;
  while (i < 줄들.length) {
    const l = 줄들[i];

    /* 코드 울타리 */
    if (/^\s*```/.test(l)) {
      const 속 = [];
      i += 1;
      while (i < 줄들.length && !/^\s*```/.test(줄들[i])) { 속.push(줄들[i]); i += 1; }
      i += 1;
      덩이.push({ 갈래: '코드', 줄: 속 });
      continue;
    }

    /* 표 — 머리줄 + 가름줄이 이어서 와야 표다 */
    if (표줄인가(l) && 가름줄인가(줄들[i + 1])) {
      const 머리 = 칸나누기(l);
      i += 2;
      const 몸 = [];
      while (i < 줄들.length && 표줄인가(줄들[i])) { 몸.push(칸나누기(줄들[i])); i += 1; }
      덩이.push({ 갈래: '표', 머리, 몸 });
      continue;
    }

    const 제 = l.match(/^(#{1,4})\s+(.*)$/);
    if (제) { 덩이.push({ 갈래: '제목', 깊이: 제[1].length, 글: 제[2] }); i += 1; continue; }

    if (/^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) {
      덩이.push({ 갈래: '목록', 글: l.replace(/^\s*(?:[-*]|\d+\.)\s+/, '') });
      i += 1;
      continue;
    }

    if (/^\s*>\s?/.test(l)) { 덩이.push({ 갈래: '인용', 글: l.replace(/^\s*>\s?/, '') }); i += 1; continue; }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l)) { 덩이.push({ 갈래: '가름' }); i += 1; continue; }
    if (!l.trim()) { 덩이.push({ 갈래: '빈줄' }); i += 1; continue; }

    덩이.push({ 갈래: '문단', 글: l });
    i += 1;
  }
  return 덩이;
}

/**
 * 표 칸의 폭을 글 길이에 비례해 나눈다.
 * ⛔ 퍼센트(WidthType.PERCENTAGE)를 쓰지 않는다 — 구글 독스에서 깨진다.
 * ⚠ 합이 «정확히» 본문폭이어야 한다. 모자라거나 넘치면 워드가 표를 제멋대로 늘인다.
 */
export function 칸폭나누기(머리, 몸, 폭 = 본문폭) {
  const n = 머리.length;
  if (!n) return [];
  /* ⚠ [2026-10-03] 길이를 «그대로» 비례시키니 아주 긴 칸 하나가 나머지를 굶겼다 —
     「klifemap 발행」이 석 줄로 끊겨 세로로 늘어졌다.
     ⇒ 길이에 상한을 둔다. 긴 칸은 어차피 줄바꿈으로 흡수된다. */
  const 길이상한 = 42;
  const 길이 = 머리.map((h, c) => {
    const 값 = [String(h ?? '').length, ...몸.map((r) => String(r[c] ?? '').length)];
    return Math.min(길이상한, Math.max(5, ...값));
  });
  const 합 = 길이.reduce((a, b) => a + b, 0);
  const 최소 = Math.floor(폭 * (n >= 7 ? 0.07 : 0.1));
  let 폭들 = 길이.map((x) => Math.max(최소, Math.round((x / 합) * 폭)));
  /* 반올림 때문에 생긴 차이를 가장 넓은 칸에서 더하고 뺀다 */
  const 차 = 폭 - 폭들.reduce((a, b) => a + b, 0);
  const 가장넓은 = 폭들.indexOf(Math.max(...폭들));
  폭들[가장넓은] += 차;
  return 폭들;
}

/* ───────────────────────── 워드로 짓기 ───────────────────────── */

function 글조각(D, 토막, { 굵게 = false, 크기 = 22, 색 = '1C2330' } = {}) {
  return 토막.map((t) => new D.TextRun({
    text: t.글,
    bold: Boolean(t.굵게 || 굵게),
    size: 크기,
    color: t.코드 ? '3A4A63' : 색,
    font: t.코드 ? 'Consolas' : 글꼴,
  }));
}

export function 문서만들기(글, { 제목 = '' } = {}) {
  const D = require('docx');
  const 덩이 = 덩이읽기(글);
  const 몸통 = [];

  if (제목) {
    몸통.push(new D.Paragraph({
      children: [new D.TextRun({ text: 제목, bold: true, size: 40, font: 글꼴, color: '1C2330' })],
      spacing: { after: 160 },
      border: { bottom: { style: D.BorderStyle.SINGLE, size: 14, color: '1C2330', space: 6 } },
    }));
  }

  for (const d of 덩이) {
    if (d.갈래 === '빈줄') continue;

    if (d.갈래 === '가름') {
      몸통.push(new D.Paragraph({
        children: [],
        border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: 'D3D9E2', space: 6 } },
        spacing: { before: 120, after: 120 },
      }));
      continue;
    }

    if (d.갈래 === '제목') {
      const 꼴 = [
        { 크기: 36, 색: '1C2330' },
        { 크기: 29, 색: '0F2F5F' },
        { 크기: 24, 색: '24406B' },
        { 크기: 22, 색: '3A4A63' },
      ][Math.min(d.깊이, 4) - 1];
      몸통.push(new D.Paragraph({
        children: 글조각(D, 토막내기(d.글), { 굵게: true, 크기: 꼴.크기, 색: 꼴.색 }),
        spacing: { before: d.깊이 <= 2 ? 300 : 200, after: 100 },
        keepNext: true,
      }));
      continue;
    }

    if (d.갈래 === '목록') {
      몸통.push(new D.Paragraph({
        children: 글조각(D, 토막내기(d.글)),
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
      }));
      continue;
    }

    if (d.갈래 === '인용') {
      몸통.push(new D.Paragraph({
        children: 글조각(D, 토막내기(d.글), { 색: '3A4A63' }),
        indent: { left: 360 },
        border: { left: { style: D.BorderStyle.SINGLE, size: 18, color: '6B7F9E', space: 8 } },
        spacing: { before: 60, after: 60 },
      }));
      continue;
    }

    if (d.갈래 === '코드') {
      /* ⛔ \n 으로 줄을 바꾸지 않는다 — 줄마다 문단을 따로 둔다 */
      for (const 줄 of (d.줄.length ? d.줄 : [''])) {
        몸통.push(new D.Paragraph({
          children: [new D.TextRun({ text: 줄 || ' ', size: 18, font: 'Consolas', color: '24406B' })],
          shading: { type: D.ShadingType.CLEAR, fill: 'F5F7FA' },
          spacing: { before: 0, after: 0 },
        }));
      }
      몸통.push(new D.Paragraph({ children: [], spacing: { after: 80 } }));
      continue;
    }

    if (d.갈래 === '표') {
      const 폭들 = 칸폭나누기(d.머리, d.몸);
      const 칸 = (글, c, { 머리 = false, 홀 = false } = {}) => new D.TableCell({
        width: { size: 폭들[c] ?? Math.floor(본문폭 / d.머리.length), type: D.WidthType.DXA },
        shading: { type: D.ShadingType.CLEAR, fill: 머리 ? '1C2330' : (홀 ? 'F5F7FA' : 'FFFFFF') },
        margins: { top: 60, bottom: 60, left: 90, right: 90 },
        children: [new D.Paragraph({
          children: 글조각(D, 토막내기(글), { 굵게: 머리, 크기: 19, 색: 머리 ? 'FFFFFF' : '1C2330' }),
          spacing: { before: 0, after: 0 },
        })],
      });
      몸통.push(new D.Table({
        width: { size: 본문폭, type: D.WidthType.DXA },
        columnWidths: 폭들,
        /* ⚠ cantSplit — 한 줄이 쪽을 넘어 «둘로 갈리면» 글자가 반씩 나뉘어 읽을 수 없다.
           실제로 「2번 KLifeMap · SeoulMarkets / 개발」이 앞뒤 쪽에 갈려 찍혔다. */
        rows: [
          new D.TableRow({
            tableHeader: true, cantSplit: true,
            children: d.머리.map((h, c) => 칸(h, c, { 머리: true })),
          }),
          ...d.몸.map((r, i) => new D.TableRow({
            cantSplit: true,
            children: d.머리.map((_, c) => 칸(r[c] ?? '', c, { 홀: i % 2 === 1 })),
          })),
        ],
      }));
      몸통.push(new D.Paragraph({ children: [], spacing: { after: 120 } }));
      continue;
    }

    몸통.push(new D.Paragraph({
      children: 글조각(D, 토막내기(d.글)),
      spacing: { before: 60, after: 60 },
    }));
  }

  return new D.Document({
    styles: { default: { document: { run: { font: 글꼴, size: 22 } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: 몸통.length ? 몸통 : [new D.Paragraph({ children: [new D.TextRun({ text: '', font: 글꼴 })] })],
    }],
  });
}

export async function 워드로만들기(md길, out길) {
  const D = require('docx');
  const 글 = fs.readFileSync(md길, 'utf8');
  /* 첫 「# 제목」은 표지 줄로 쓰고 본문에서는 뺀다 */
  const 첫제목 = 글.match(/^#\s+(.+)$/m);
  const 본문 = 첫제목 ? 글.replace(첫제목[0], '') : 글;
  const 문서 = 문서만들기(본문, { 제목: 첫제목 ? 첫제목[1] : '' });
  const 통 = await D.Packer.toBuffer(문서);
  fs.mkdirSync(path.dirname(out길), { recursive: true });
  fs.writeFileSync(out길, 통);
  return out길;
}

/* ───────────────────────── 자가시험 ───────────────────────── */

const 내가진입점 = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  let 탈 = 0;
  const 본다 = (이름, 참) => { console.log((참 ? '✅ ' : '🔴 ') + 이름); if (!참) 탈 += 1; };

  본다('표 머리줄을 알아본다', 표줄인가('| a | b |') && 가름줄인가('|---|---|'));
  본다('⛔ 가름줄이 아닌 표줄은 가름줄이 아니다', !가름줄인가('| a | b |'));
  본다('칸을 나눈다', 칸나누기('| 가 | 나 |').join(',') === '가,나');

  const t1 = 토막내기('앞 **굵게** 뒤');
  본다('굵게를 토막으로 가른다', t1.length === 3 && t1[1].굵게 === true && t1[1].글 === '굵게');
  const t2 = 토막내기('값은 `a**b` 다');
  본다('⛔ 코드칸 안의 별표를 굵게로 읽지 않는다',
    t2.some((x) => x.코드 && x.글 === 'a**b') && !t2.some((x) => x.굵게));
  본다('⛔ 빈 줄에도 안 터진다', 토막내기('').length === 1 && 토막내기(null)[0].글 === '');

  const 덩 = 덩이읽기(['# 머리', '', '| 유닛 | 수 |', '|---|---|', '| 1번 | **2** |', '',
    '- 목록 하나', '> 인용', '```', '코드줄', '```', '평범한 문단'].join('\n'));
  본다('제목을 읽는다', 덩[0].갈래 === '제목' && 덩[0].깊이 === 1);
  const 표 = 덩.find((d) => d.갈래 === '표');
  본다('표를 읽는다', 표 && 표.머리.join(',') === '유닛,수' && 표.몸.length === 1);
  본다('표 안의 굵게가 살아 있다', 표.몸[0][1] === '**2**');
  본다('목록·인용·코드·문단을 가른다',
    덩.some((d) => d.갈래 === '목록') && 덩.some((d) => d.갈래 === '인용')
    && 덩.some((d) => d.갈래 === '코드') && 덩.some((d) => d.갈래 === '문단'));
  const 코 = 덩.find((d) => d.갈래 === '코드');
  본다('코드 울타리 속을 줄 목록으로 갖는다', Array.isArray(코.줄) && 코.줄[0] === '코드줄');

  /* 🔴 칸폭 — 합이 «정확히» 본문폭이어야 한다. 아니면 워드가 표를 제멋대로 늘인다 */
  for (const [머리, 몸] of [
    [['가', '나'], [['짧다', '아주 아주 아주 긴 글이 들어간다']]],
    [['a', 'b', 'c', 'd', 'e'], [['1', '2', '3', '4', '5']]],
    [['하나'], [['둘']]],
  ]) {
    const w = 칸폭나누기(머리, 몸);
    본다(`칸폭 합이 본문폭과 같다 (${머리.length}칸)`, w.reduce((a, b) => a + b, 0) === 본문폭);
    본다(`칸폭이 다 양수다 (${머리.length}칸)`, w.every((x) => x > 0));
  }
  const w2 = 칸폭나누기(['짧다', '아주 아주 아주 긴 머리글'], [['a', 'b']]);
  본다('긴 칸이 더 넓다', w2[1] > w2[0]);
  본다('⛔ 칸이 없으면 빈 배열이다', 칸폭나누기([], []).length === 0);

  /* 실제로 워드 통을 하나 지어 본다 — 열리는 파일인지까지 */
  const 통로 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tmp', '_자가시험.docx');
  try {
    const D = require('docx');
    const 문서 = 문서만들기('# 제목\n\n| 가 | 나 |\n|---|---|\n| **1** | `코드` |\n\n문단입니다.', { 제목: '제목' });
    const 통 = await D.Packer.toBuffer(문서);
    fs.mkdirSync(path.dirname(통로), { recursive: true });
    fs.writeFileSync(통로, 통);
    const 머리 = fs.readFileSync(통로).subarray(0, 2).toString('latin1');
    본다('진짜 docx(zip) 를 짓는다', 머리 === 'PK' && fs.statSync(통로).size > 3000);
    fs.unlinkSync(통로);
  } catch (e) {
    본다('진짜 docx 를 짓는다 — ' + String(e.message).slice(0, 60), false);
  }

  console.log(탈 ? `\n🔴 ${탈}개 떨어졌다` : '\n✅ 자가시험 통과');
  process.exit(탈 ? 1 : 0);
}

if (내가진입점) {
  const 인자 = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  const md길 = 인자[0];
  if (!md길) {
    console.log('사용법: node scripts/md-to-docx.mjs <보고.md> [--out 경로.docx]');
    process.exit(1);
  }
  const out지정 = process.argv.find((x) => x.startsWith('--out='));
  const i = process.argv.indexOf('--out');
  const out길 = out지정 ? out지정.slice(6)
    : (i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : md길.replace(/\.md$/i, '.docx'));
  await 워드로만들기(md길, out길);
  const kb = Math.round(fs.statSync(out길).size / 1024);
  console.log(`✅ 워드로 냈다 — ${path.basename(out길)} (${kb}KB)`);
}
