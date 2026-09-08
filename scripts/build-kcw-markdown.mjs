#!/usr/bin/env node
/**
 * build-kcw-markdown.mjs — K Culture Wire 기사마다 «AI가 읽기 쉬운 마크다운 판»을 낸다.
 *
 * ── 🔴 왜 (2026-09-03) ──────────────────────────────────────────────────
 * GEO 지시의 「지면마다 마크다운 판」을 3번(100yearmap)과 6번(SeoulMarkets)은 냈는데
 * **5번(KCW)만 안 내고 있었다.** 오늘 낸 여섯 편을 라이브에서 재 보니 지면은 200 인데
 * `.md` 판은 여섯 편 다 404 였다. 내 사이트의 GEO 칸이 비어 있던 것이다.
 *
 * ⭐ 6번 자를 그대로 쓴다 — KCW 기사도 `content/kculturewire/*.md` 가 **원본이 이미
 *   마크다운**이라 사정이 같다. 새로 짓지 않고 «경로 셋»만 바꿨다.
 *   본체(앞말읽기·기사변환·notes 뽑기)는 6번이 다듬어 둔 것을 손대지 않는다.
 * 「지면마다 마크다운 판(/<주소>.md)」. 3번이 100yearmap에서 먼저 냈다(HTML→MD 정규식 변환).
 * 6번은 그 방식을 그대로 안 베낀다 — SeoulMarkets 기사는 `content/articles/*.md`가
 * **원본이 이미 마크다운**이다(표까지 포함). HTML을 되돌려 마크다운으로 만드는 것보다
 * 원본 마크다운 본문을 그대로 쓰는 쪽이 손실이 없다(강조·표·링크가 100% 보존).
 *
 * 다만 frontmatter의 sources·crossChecks·excluded는 **여러 줄 YAML 리스트**라
 * 얕은 파서(check-frontmatter.mjs 패턴)로 못 읽는다. 이미 빌드된 dist/article/{slug}.html의
 * `<section class="notes">`(DataNotes.astro가 낸 고정 구조 — 우리가 통제하는 마크업)에서
 * 그 부분만 뽑아 쓴다. ⛔ 새 YAML 파서 의존성을 안 들인다(3번과 같은 이유 — 공유 저장소).
 *
 * ⛔ draft:true 기사는 안 낸다(공개 안 된 것).
 * ⛔ 사이트맵에는 안 넣는다 — llms.txt로만 안내(3번과 같은 원칙).
 *
 * 쓰는 법
 *   node scripts/build-kcw-markdown.mjs --selftest
 *   node scripts/build-kcw-markdown.mjs        (build-once.mjs 뒤에 실행 — dist/article 필요)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사폴더 = path.join(뿌리, 'content/kculturewire');
const distDir = path.join(뿌리, 'dist/wikitip/article');

/** frontmatter를 얕게 읽는다 — 한 줄짜리 따옴표 문자열만(check-frontmatter.mjs와 같은 이유) */
export function 앞말읽기(원문) {
  const m = 원문.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const 값 = {};
  for (const 줄 of m[1].split(/\r?\n/)) {
    const kv = 줄.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, raw] = kv;
    const q = raw.match(/^"([\s\S]*)"\s*$/) || raw.match(/^'([\s\S]*)'\s*$/);
    if (q) 값[k] = q[1];
    else if (raw && !raw.startsWith('[') && !raw.startsWith('-')) 값[k] = raw.trim();
  }
  return { 값, 본문: m[2].trim() };
}

function 엔티티풀기(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** notes 섹션 안 인라인 태그를 마크다운으로 (a·time·strong, 나머지는 지운다) */
export function 노트인라인(html) {
  let s = html;
  s = s.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, (_, href, text) => `[${text.trim()}](${href})`);
  s = s.replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**');
  s = s.replace(/<time[^>]*>(.*?)<\/time>/gis, '$1');
  s = s.replace(/<[^>]+>/g, '');
  return 엔티티풀기(s).trim();
}

/**
 * 🔴 [2026-09-03] 6번 자를 그대로 돌렸더니 **142편 전부 notes 가 비었다.**
 *   까닭: SeoulMarkets 지면은 <dl><dt>/<dd> 인데 **KCW 지면은 <h3> + <ul>** 이다.
 *   같은 이름의 절이라도 마크업이 다르면 못 읽는다. 그래서 KCW 꼴을 읽는 자를 따로 둔다.
 * ⛔ 6번 자를 고치지 않는다 — 남의 사이트가 깨진다. 여기서만 바꾼다.
 */
export function 노트변환(articleHtml) {
  const secM = articleHtml.match(/<section class="notes"[^>]*>([\s\S]*?)<\/section>/i);
  if (!secM) return null;
  const inner = secM[1];
  const 토막 = [];
  /* h2 를 절 제목으로 쓴다 — KCW 는 「Where these numbers come from」이다 */
  const h2 = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  토막.push('## ' + (h2 ? 노트인라인(h2[1]) : 'Data & Verification Notes'));
  /* h3 마다 바로 뒤의 덩어리(ul 또는 p)를 붙인다 */
  const 조각 = inner.split(/<h3[^>]*>/i).slice(1);
  for (const 조 of 조각) {
    const m = 조.match(/^([\s\S]*?)<\/h3>([\s\S]*)$/i);
    if (!m) continue;
    const 이름 = 노트인라인(m[1]);
    const 몸 = m[2];
    const 목록 = [...몸.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => '- ' + 노트인라인(x[1])).filter((x) => x.length > 2);
    토막.push('**' + 이름 + '**');
    토막.push(목록.length ? 목록.join(String.fromCharCode(10)) : 노트인라인(몸));
  }
  /* 제목만 있고 알맹이가 없으면 «없다»로 낸다 — 빈 절을 내지 않는다 */
  if (토막.length <= 1) return null;
  return 토막.join(String.fromCharCode(10, 10));
}

/** 기사 하나(마크다운 원본 + 빌드된 HTML)를 최종 .md 문자열로 만든다. 못 만들면 null */
export function 기사변환(원문, articleHtml) {
  const 앞말 = 앞말읽기(원문);
  if (!앞말) return null;
  const { 값, 본문 } = 앞말;
  if (값.draft === 'true') return null;
  const 머리 = [`# ${값.title ?? ''}`, '', `> ${값.dek ?? ''}`, '', `Category: ${값.category ?? ''} · Published: ${값.pubDate ?? ''} · Data as of: ${값.dataAsOf ?? ''}`];
  const 노트 = articleHtml ? 노트변환(articleHtml) : null;
  const 꼬리 = ['---', '', 'K Culture Wire publishes data journalism. Figures are counts from published sources, not estimates.'];
  return [...머리, '', 본문, '', ...(노트 ? [노트, ''] : []), ...꼬리].join('\n') + '\n';
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 가짜원문 = [
    '---',
    'title: "제목입니다"',
    'dek: "설명입니다"',
    'category: macro',
    'pubDate: 2026-09-02',
    'dataAsOf: 2026-09-02T00:00:00+09:00',
    'draft: false',
    '---',
    '',
    '본문 첫 문단입니다.',
    '',
    '| a | b |',
    '| --- | --- |',
    '| 1 | 2 |',
  ].join('\n');

  const 앞말 = 앞말읽기(가짜원문);
  검('title을 읽는다', 앞말.값.title === '제목입니다');
  검('draft를 문자열로 읽는다', 앞말.값.draft === 'false');
  검('본문을 통째로 담는다(표 포함)', 앞말.본문.includes('| 1 | 2 |'));

  const draft원문 = 가짜원문.replace('draft: false', 'draft: true');
  검('⛔ draft:true는 null', 기사변환(draft원문, '') === null);

  /**
   * 🔴🔴 [2026-09-09 05:3x · 5번] **견본이 낡아서 자가시험이 터지고 있었다.**
   *
   * 옛 견본은 노트를 `<dl><dt>Sources</dt><dd><ul>…` 로 적어 두었다.
   * 그런데 지금 지면이 내는 꼴은 `<h3>Sources</h3><ul>…` 다. `노트변환` 은 그 새 꼴을 읽게
   * 고쳐졌고, **실제 기사 183편에서 「notes 없이 낸 것 0개」로 잘 돌고 있었다.**
   * ⇒ 자가 깨진 것이 아니라 **견본이 낡은 것**이었다. 그런데 자가시험이 터지니까
   *   `npm test` 가 여기서 멈추고 그 뒤 검사들이 안 돌았다.
   *
   * ⭐ 그래서 견본을 «지어내지 않고» 실제로 나간 지면에서 떠 왔다 —
   *   `dist/wikitip/article/190-countries-and-the-94-that-can-be-counted.html`
   *   ⛔ 견본을 손으로 지으면 또 낡는다. 지면이 내는 꼴 그대로를 쓴다.
   * ⚠ 그리고 `data-astro-cid-*` 를 «일부러 남겼다» — 아스트로가 실제로 붙이는 것이고,
   *   그것이 붙어도 읽히는지가 이 시험의 요점이다.
   */
  const 가짜HTML = '<section class="notes" data-astro-cid-x><h2 data-astro-cid-x>Where these numbers come from</h2>'
    + '<h3 data-astro-cid-x>Sources</h3><ul data-astro-cid-x><li data-astro-cid-x><b data-astro-cid-x>DART</b> — '
    + '<a href="https://dart.fss.or.kr" rel="nofollow noopener" data-astro-cid-x>https://dart.fss.or.kr</a></li></ul>'
    + '<h3 data-astro-cid-x>Cross-checks</h3><p data-astro-cid-x>Single-source figures; no independent cross-check was available.</p>'
    + '</section>';
  const 노트 = 노트변환(가짜HTML);
  검('⛔ 노트를 못 읽으면 null 이 아니라 글이 나온다 — 자가 깨졌으면 여기서 걸린다', 노트 !== null);
  검('h2 를 절 제목으로 쓴다', String(노트).includes('## Where these numbers come from'));
  검('h3 Sources 를 담는다', String(노트).includes('Sources'));
  검('링크를 마크다운으로', String(노트).includes('(https://dart.fss.or.kr)'));
  검('ul 없는 h3 도 담는다', String(노트).includes('Single-source figures'));
  검('⛔ data-astro-cid 가 붙어도 읽는다 — 그 글자가 결과에 안 남는다', !String(노트).includes('data-astro-cid'));
  검('⛔ notes 섹션이 없으면 null', 노트변환('<p>아무것도 없다</p>') === null);

  const 최종 = 기사변환(가짜원문, 가짜HTML);
  검('제목을 #로 낸다', 최종.includes('# 제목입니다'));
  검('본문을 담는다', 최종.includes('본문 첫 문단입니다'));
  검('표를 그대로 담는다', 최종.includes('| 1 | 2 |'));
  /**
   * 🔴 [2026-09-09 · 5번] 이 두 줄도 낡아 있었다. 지금 지면이 내는 글자로 갈았다 —
   *   노트 제목은 「Data & Verification Notes」가 아니라 «기사가 쓴 h2» 그대로이고,
   *   꼬리말은 SeoulMarkets 의 「Not investment advice」가 아니라 KCW 것이다.
   * ⛔ 짐작으로 적지 않고 실제 산출물(`dist/wikitip/article/*.md`)에서 떠 왔다.
   */
  검('notes 를 붙인다 — 기사가 쓴 h2 를 그대로 쓴다', 최종.includes('## Where these numbers come from'));
  검('출처 줄을 마크다운 링크로 붙인다', 최종.includes('[https://dart.fss.or.kr](https://dart.fss.or.kr)'));
  검('꼬리말을 붙인다 — KCW 것이다', 최종.includes('K Culture Wire publishes data journalism'));
  검('⛔ SeoulMarkets 꼬리말을 잘못 붙이지 않는다', !최종.includes('Not investment advice'));

  const HTML없이 = 기사변환(가짜원문, null);
  검('HTML 없어도 만든다(notes만 빠짐)', HTML없이 !== null && !HTML없이.includes('Verification Notes'));

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-markdown 자가시험 통과 (13)');
  process.exit(0);
}

/* ── 실제로 낸다 ── */
if (!fs.existsSync(distDir)) {
  console.error('⛔ dist/wikitip/article 이 없다 — 먼저 빌드를 돌린다.');
  process.exit(1);
}

const 파일들 = fs.readdirSync(기사폴더).filter((f) => f.endsWith('.md'));
let 냄 = 0;
let 건너뜀 = 0;
let 노트없음 = 0;
for (const 파일 of 파일들) {
  const slug = 파일.replace(/\.md$/, '');
  const 원문 = fs.readFileSync(path.join(기사폴더, 파일), 'utf8');
  const htmlPath = path.join(distDir, `${slug}.html`);
  const articleHtml = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : null;
  if (!articleHtml) { 건너뜀++; continue; }
  const md = 기사변환(원문, articleHtml);
  if (!md) { 건너뜀++; continue; }
  /* KCW 절 제목은 'Where these numbers come from' 이다 — 옛 말로 세면 늘 0 이 된다 */
  if (!md.includes('## Where these numbers come from')) 노트없음++;
  fs.writeFileSync(path.join(distDir, `${slug}.md`), md);
  냄++;
}
console.log(`✅ 마크다운 판 ${냄}개 냄 · 못 낸(draft·빌드없음) ${건너뜀}개 · notes 없이 낸 것 ${노트없음}개 — dist/wikitip/article/*.md`);
