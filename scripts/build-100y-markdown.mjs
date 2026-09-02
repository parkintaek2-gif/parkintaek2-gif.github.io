#!/usr/bin/env node
/**
 * build-100y-markdown.mjs — 100yearmap 지면마다 «AI가 읽기 쉬운 마크다운 판»을 낸다.
 *
 * ── 왜 만드나 (2026-09-02) ──────────────────────────────
 * 5번→전체 GEO 지시(사장님 지시 경유): 「지면마다 마크다운 판(/<주소>.md) — AI가 읽기 쉬운
 * 옷. canonical로 중복 색인 막는다」. 이 회사 전체에 아직 아무 유닛도 .md 판을 안 냈다
 * (탐색 확인, 2026-09-02) — 100yearmap이 먼저 낸다.
 *
 * ⛔ 우리 지면은 우리가 직접 쓴 고정 틀이다(HundredYear.astro — h1·p.sub·div.answer·h2·
 *   div.tablewrap>table·p.note). 그래서 «범용 HTML 파서»가 아니라 우리 틀에 맞춘 정규식
 *   변환을 쓴다 — 남이 쓴 임의 HTML을 파싱하는 게 아니라 우리가 통제하는 마크업이다.
 * ⛔ 새 npm 의존성(turndown 등)을 안 쓴다 — 여러 세션이 같이 쓰는 저장소에서 package.json
 *   변경은 충돌 위험이 크다. 손으로 만든 변환기 하나로 충분하다.
 * ⛔ `<nav>`(메뉴)·`<footer>`는 안 낸다 — `</nav>` 뒤 `<footer` 앞까지만 `<slot />` 내용이다
 *   (HundredYear.astro 구조 그대로, 실측 확인).
 * ⛔ 사이트맵에는 안 넣는다 — 검색엔진 중복색인 위험, .md는 llms.txt로만 안내한다.
 *
 * 쓰는 법
 *   node scripts/build-100y-markdown.mjs --selftest
 *   node scripts/build-100y-markdown.mjs        (build-once.mjs 뒤에 실행 — dist/100y 필요)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(뿌리, 'dist/100y');

/** HTML 태그 안 엔티티를 사람이 읽는 글자로 되돌린다 */
function 엔티티풀기(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** 인라인 태그(strong·a·br 등)를 마크다운으로 바꾸고 남은 태그를 지운다 */
export function 인라인변환(html) {
  let s = html;
  s = s.replace(/<br\s*\/?>/gi, '  \n');
  s = s.replace(/<strong>(.*?)<\/strong>/gis, '**$1**');
  s = s.replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/gis, (_, href, text) => `[${text.trim()}](${href})`);
  s = s.replace(/<[^>]+>/g, '');
  return 엔티티풀기(s).trim();
}

/** <table>...</table> 하나를 마크다운 표로 바꾼다 */
export function 표변환(tableHtml) {
  const 줄들 = [...tableHtml.matchAll(/<tr>(.*?)<\/tr>/gis)].map((m) => m[1]);
  if (!줄들.length) return '';
  const 칸뽑기 = (줄) => [...줄.matchAll(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis)].map((m) => 인라인변환(m[1]));
  const 표 = 줄들.map(칸뽑기);
  if (!표.length || !표[0].length) return '';
  const 줄만들기 = (칸들) => `| ${칸들.join(' | ')} |`;
  const 구분선 = `| ${표[0].map(() => '---').join(' | ')} |`;
  return [줄만들기(표[0]), 구분선, ...표.slice(1).map(줄만들기)].join('\n');
}

/** `<slot />` 내용(우리 틀 고정 마크업)을 마크다운 본문으로 바꾼다 */
export function 본문변환(slotHtml) {
  const 토막들 = [];
  let 남은것 = slotHtml;

  /* 표부터 뽑아 자리표시자로 바꾼다 — 표 안의 <p> 등을 본문 처리기가 건드리지 않게 */
  const 표들 = [];
  남은것 = 남은것.replace(/<table>(.*?)<\/table>/gis, (m) => {
    표들.push(표변환(m));
    return `<p>표${표들.length - 1}</p>`;
  });

  const 블록패턴 = /<h1[^>]*>(.*?)<\/h1>|<h2[^>]*>(.*?)<\/h2>|<h3[^>]*>(.*?)<\/h3>|<p[^>]*>(.*?)<\/p>|<li[^>]*>(.*?)<\/li>/gis;
  let m;
  while ((m = 블록패턴.exec(남은것))) {
    if (m[1] != null) 토막들.push(`# ${인라인변환(m[1])}`);
    else if (m[2] != null) 토막들.push(`## ${인라인변환(m[2])}`);
    else if (m[3] != null) 토막들.push(`### ${인라인변환(m[3])}`);
    else if (m[5] != null) 토막들.push(`- ${인라인변환(m[5])}`);
    else if (m[4] != null) {
      const 속 = m[4];
      const 표자리 = 속.match(/표(\d+)/);
      if (표자리) 토막들.push(표들[Number(표자리[1])]);
      else 토막들.push(인라인변환(속));
    }
  }
  return 토막들.filter(Boolean).join('\n\n');
}

/** dist/100y/{slug}.html 하나를 읽어 마크다운 문자열을 만든다. 못 만들면 null */
export function 지면에서뽑기(html) {
  const titleM = html.match(/<title>(.*?)<\/title>/is);
  const descM = html.match(/<meta name="description" content="([^"]*)"/i);
  const navEnd = html.indexOf('</nav>');
  const footerStart = html.indexOf('<footer');
  if (navEnd === -1 || footerStart === -1 || footerStart <= navEnd) return null;
  const slot = html.slice(navEnd + '</nav>'.length, footerStart);
  const 본문 = 본문변환(slot);
  if (!본문) return null;

  const 제목 = titleM ? 엔티티풀기(titleM[1]) : '';
  const 설명 = descM ? 엔티티풀기(descM[1]) : '';
  const 머리 = [`> ${설명}`, '', `출처: 국가데이터처 KOSIS 등 실측 — 이 지면은 «통계»이지 개인 판정이 아닙니다.`].join('\n');
  return `${본문}\n\n---\n\n${머리}\n`;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('인라인 굵게를 바꾼다', 인라인변환('<strong>52.8%</strong>') === '**52.8%**');
  검('링크를 바꾼다', 인라인변환('<a href="/tutoring">학원</a>') === '[학원](/tutoring)');
  검('남은 태그를 지운다', 인라인변환('<span class="x">글자</span>') === '글자');
  검('엔티티를 되돌린다', 인라인변환('A&amp;B') === 'A&B');

  const 표 = 표변환('<table><tr><th>학력</th><th>참여율</th></tr><tr><td>고졸</td><td>65%</td></tr></table>');
  검('표 머리를 만든다', 표.includes('| 학력 | 참여율 |'));
  검('표 구분선을 만든다', 표.includes('| --- | --- |'));
  검('표 몸을 만든다', 표.includes('| 고졸 | 65% |'));

  const 본문 = 본문변환('<h1>제목입니다</h1><p class="sub">설명입니다</p><h2>소제목</h2><table><tr><th>a</th></tr><tr><td>1</td></tr></table>');
  검('h1을 #로', 본문.includes('# 제목입니다'));
  검('h2를 ##로', 본문.includes('## 소제목'));
  검('p를 문단으로', 본문.includes('설명입니다'));
  검('표가 본문 순서에 낀다', 본문.includes('| a |'));

  const 가짜HTML =
    '<html><head><title>테스트 지면</title><meta name="description" content="설명 문구"></head>' +
    '<body><nav>메뉴</nav><h1>제목</h1><p class="sub">본문 한 줄</p><footer>바닥글</footer></body></html>';
  const 결과 = 지면에서뽑기(가짜HTML);
  검('제목을 안 담는다(본문에 없음)', !결과.includes('메뉴'));
  검('바닥글을 안 담는다', !결과.includes('바닥글'));
  검('본문은 담는다', 결과.includes('본문 한 줄'));
  검('설명을 인용줄로 낸다', 결과.includes('> 설명 문구'));

  검('⛔ nav/footer 경계가 없으면 null', 지면에서뽑기('<html>속엔용</html>') === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-100y-markdown 자가시험 통과 (16)');
  process.exit(0);
}

/* ── 실제로 낸다 ── */
if (!fs.existsSync(distDir)) {
  console.error('⛔ dist/100y 가 없다 — 먼저 node scripts/build-once.mjs 를 돌린다.');
  process.exit(1);
}

const 대상들 = fs.readdirSync(distDir).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
let 냄 = 0;
let 건너뜀 = 0;
for (const 파일 of 대상들) {
  const html = fs.readFileSync(path.join(distDir, 파일), 'utf8');
  const md = 지면에서뽑기(html);
  if (!md) { 건너뜀++; continue; }
  const md길 = path.join(distDir, 파일.replace(/\.html$/, '.md'));
  fs.writeFileSync(md길, md);
  냄++;
}
console.log(`✅ 마크다운 판 ${냄}개 냄 · 못 낸(nav/footer 경계 없음) ${건너뜀}개 — dist/100y/*.md`);
