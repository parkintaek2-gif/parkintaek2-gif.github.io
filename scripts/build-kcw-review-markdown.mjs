#!/usr/bin/env node
/**
 * build-kcw-review-markdown.mjs — **한국어 K-Review 마다 「AI가 읽기 쉬운 평문 판」을 낸다.**
 *
 * ── 🔴🔴 사장님 (2026-10-28, 원문) ───────────────────────────────────
 *   「**케이컬쳐와이어도 철저하게 검색색인, seo, geo 맞춤으로 운용해**」
 *
 * ── 무엇이 비어 있었나 ────────────────────────────────────────────────
 *   영문 기사는 `/article/<주소>.md` 로 평문 판이 이미 나가고 있고, llms.txt 도
 *   「아래 기사는 모두 .md 판이 있다」고 적어 두었다.
 *   **한국어 리뷰만 없었다** — 라이브에서 재 보니 `/ko/review/<주소>.md` 가 404 였다.
 *   AI 답변엔진은 메뉴·꾸밈이 없는 평문을 훨씬 잘 읽고 그대로 인용한다.
 *   ⚠ 바깥 채널 가운데 답변엔진이 가장 컸다(2026-08-29 · 90일 23명).
 *
 * ── 왜 원본을 그대로 쓰나 ─────────────────────────────────────────────
 *   `content/kcw-reviews/*.md` 가 **원본이 이미 마크다운**이다. 지어진 HTML 을 되돌리면
 *   강조·표·링크를 잃는다. 6번이 SeoulMarkets 에서 세운 그 방식을 그대로 쓴다.
 *   ⭐ 다만 리뷰는 머리말에 **기사 본문에 없는 것**이 들어 있다 —
 *     네티즌 반응(주소 포함) · 사진 제공처 · 출처 · 다음 일정.
 *     손님 화면은 그것을 그려 주지만 평문 판이 안 실으면 AI 는 그 사실을 잃는다.
 *     ⇒ 그 넷을 평문 끝에 **사실 그대로** 붙인다.
 *
 * ⛔ draft 는 안 낸다 — 공개 안 된 것이다.
 * ⛔ 사이트맵에는 안 넣는다 — llms.txt 로만 안내한다(3번·6번과 같은 원칙).
 * ⛔ 판정·요약을 덧붙이지 않는다. 원본에 없는 문장을 여기서 짓지 않는다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-review-markdown.mjs --자가시험
 *   node scripts/build-kcw-review-markdown.mjs      (빌드 뒤에 — dist/wikitip 이 있어야 한다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 글폴더 = path.join(뿌리, 'content/kcw-reviews');
const 낼곳 = path.join(뿌리, 'dist/wikitip/ko/review');

/**
 * 머리말을 얕게 읽는다.
 * ⚠ 깊은 YAML 파서를 들이지 않는다(공유 저장소 — 3번·6번과 같은 이유).
 *   한 줄짜리 값과, `- ` 로 시작하는 목록, 그리고 목록 안의 `키: 값` 까지만 읽는다.
 */
export function 앞말읽기(원문) {
  const m = String(원문).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { 앞말: {}, 본문: String(원문) };
  const 앞말 = {};
  let 지금목록 = null;   // 「- 」로 이어지는 목록
  let 지금칸 = null;     // 그 목록의 마지막 칸, 또는 속이 있는 열쇠
  /* 🔴 값이 빈 열쇠가 «목록»인지 «속이 있는 것»인지는 다음 줄을 봐야 안다.
     `image:` 는 속이 있는 것이고 `반응:` 은 목록이다. 미리 목록으로 정하면
     image 의 속이 통째로 날아간다 — 자가시험이 그것을 잡았다. */
  let 기다리는열쇠 = null;
  for (const 줄 of m[1].split(/\r?\n/)) {
    if (!줄.trim() || /^\s*#/.test(줄)) continue;
    const 목록 = 줄.match(/^\s*-\s*(.*)$/);
    if (목록) {
      if (기다리는열쇠) { 지금목록 = []; 앞말[기다리는열쇠] = 지금목록; 기다리는열쇠 = null; }
      if (!지금목록) continue;
      지금칸 = {};
      지금목록.push(지금칸);
      const 짝0 = 목록[1].match(/^([^:]+):\s*(.*)$/);
      if (짝0) 지금칸[짝0[1].trim()] = 벗기기(짝0[2]);
      else if (목록[1].trim()) 지금칸.값 = 벗기기(목록[1]);
      continue;
    }
    const 짝 = 줄.match(/^(\s*)([^:\-][^:]*):\s*(.*)$/);
    if (!짝) continue;
    const [, 빈칸, 키0, 값] = 짝;
    const 키 = 키0.trim();
    if (빈칸.length > 0) {
      if (기다리는열쇠) { 지금칸 = {}; 앞말[기다리는열쇠] = 지금칸; 지금목록 = null; 기다리는열쇠 = null; }
      if (지금칸) 지금칸[키] = 벗기기(값);
      continue;
    }
    지금목록 = null; 지금칸 = null;
    if (값.trim() === '') { 기다리는열쇠 = 키; continue; }
    기다리는열쇠 = null;
    앞말[키] = 벗기기(값);
  }
  return { 앞말, 본문: m[2] };
}

function 벗기기(값) {
  const s = String(값 ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/** 리뷰 한 장을 평문 판으로 바꾼다. draft 면 null */
export function 리뷰변환(원문, 주소) {
  const { 앞말, 본문 } = 앞말읽기(원문);
  if (String(앞말.draft) === 'true') return null;
  if (!앞말.title) return null;

  const 줄 = [];
  줄.push(`# ${앞말.title}`);
  줄.push('');
  if (앞말.dek) { 줄.push(앞말.dek); 줄.push(''); }

  const 머리 = [];
  if (앞말.pubDate) 머리.push(`날짜: ${String(앞말.pubDate).slice(0, 10)}`);
  if (앞말.category) 머리.push(`분류: ${앞말.category}`);
  머리.push(`원문: https://www.kculturewire.com/ko/review/${주소}`);
  줄.push(머리.join(' · '));
  줄.push('');
  줄.push('---');
  줄.push('');
  줄.push(String(본문).trim());

  /* ⛔ 빈 절 제목을 내지 않는다 — 「## 출처」만 덩그러니 나간 판이 있었다(2026-10-28 실측).
     읽는 쪽은 그것을 「출처가 없다」가 아니라 「빠뜨렸다」로 읽는다. */
  const 절 = (제목, 줄들) => {
    const 쓸것 = 줄들.filter(Boolean);
    if (!쓸것.length) return;
    줄.push('');
    줄.push(`## ${제목}`);
    줄.push('');
    줄.push(...쓸것);
  };

  /* ⚠ 열쇠 이름은 `src/content.config.ts` 가 정한 것을 그대로 쓴다 —
     반응은 `내용·출처·주소`, 출처는 `org·api·url` 이다.
     처음에 내가 «짐작한» 이름(말·이름)으로 적었더니 반응과 출처가 통째로 비었다. */
  const 반응 = Array.isArray(앞말['반응']) ? 앞말['반응'] : [];
  절('네티즌 반응 (원문 그대로)', 반응.map((r) => {
    const 말 = r['내용'] || r['말'] || r.값 || '';
    if (!말) return '';
    const 누가 = r['출처'] || r['곳'] || '';
    const 어디 = r['주소'] || '';
    return `- "${말}"${누가 ? ` — ${누가}` : ''}${어디 ? ` (${어디})` : ''}`;
  }));

  const 사진 = 앞말.image && typeof 앞말.image === 'object' ? 앞말.image : null;
  절('사진', [
    사진 && (사진['제공처'] || 사진['출처주소'])
      ? `제공: ${사진['제공처'] || '밝히지 않음'}${사진['출처주소'] ? ` · ${사진['출처주소']}` : ''}`
      : '',
    사진 && 사진['캡션'] ? `설명: ${사진['캡션']}` : '',
  ]);

  const 출처 = Array.isArray(앞말.sources) ? 앞말.sources : [];
  절('출처', 출처.map((s) => {
    const 이름 = s.org || s['이름'] || s.값 || '';
    const 무엇 = s.api || '';
    const 주소2 = s.url || s['주소'] || '';
    if (!이름 && !주소2) return '';
    return `- ${이름}${무엇 ? ` — ${무엇}` : ''}${주소2 ? ` (${주소2})` : ''}`;
  }));

  const 다음 = 앞말['다음일정'];
  절('다음 일정', [
    typeof 다음 === 'string' ? 다음 : '',
    다음 && typeof 다음 === 'object'
      ? [다음['명칭'], 다음['일시'], 다음['주체']].filter(Boolean).join(' · ')
      : '',
  ]);

  줄.push('');
  줄.push('---');
  줄.push('');
  줄.push('출처를 밝히고 이 페이지로 연결해 주시면 인용하셔도 됩니다. '
    + 'K Culture Wire · https://www.kculturewire.com/ko');
  줄.push('');
  return 줄.join('\n');
}

if (process.argv.includes('--자가시험')) {
  let 총 = 0; let 흠 = 0;
  const 본다 = (이름, 참인가) => {
    총 += 1;
    if (참인가) console.log('  ✅ ' + 이름);
    else { 흠 += 1; console.log('  ❌ ' + 이름); }
  };
  const 보기 = [
    '---',
    'title: "서울 SK 4연승"',
    'dek: "27일 잠실 96대87."',
    'pubDate: 2026-10-27',
    'category: basketball',
    'image:',
    '  src: /wikitip/review/a.jpg',
    '  제공처: KBL',
    '  출처주소: https://kbl.or.kr/a',
    '반응:',
    '  - 말: "3쿼터가 다했다"',
    '    곳: 네이버 스포츠',
    '    주소: https://example.com/1',
    'sources:',
    '  - 이름: KBL 기록',
    '    주소: https://kbl.or.kr/b',
    '다음일정: "30일 창원 LG전"',
    '---',
    '',
    '본문 첫 줄입니다.',
  ].join('\n');
  const md = 리뷰변환(보기, 'kbl-sk');
  본다('제목이 큰 제목으로 들어간다', md.startsWith('# 서울 SK 4연승'));
  본다('원문 주소를 적는다', md.includes('https://www.kculturewire.com/ko/review/kbl-sk'));
  본다('본문이 그대로 들어간다', md.includes('본문 첫 줄입니다.'));
  본다('네티즌 반응과 주소가 들어간다', md.includes('3쿼터가 다했다') && md.includes('https://example.com/1'));
  본다('사진 제공처가 들어간다', md.includes('제공: KBL'));
  본다('출처가 들어간다', md.includes('KBL 기록'));
  본다('다음 일정이 들어간다', md.includes('30일 창원 LG전'));
  본다('draft 는 안 낸다', 리뷰변환('---\ntitle: "ㄱ"\ndraft: true\n---\n본문', 'x') === null);
  본다('제목이 없으면 안 낸다', 리뷰변환('---\ndek: "ㄱ"\n---\n본문', 'x') === null);
  본다('지어낸 문장을 안 넣는다 — 본문에 없는 말이 없다',
    !/요약하면|정리하면|결론적으로/.test(md));

  /* 🔴 [2026-10-28] **위 보기는 내가 지어낸 열쇠 이름을 쓰고 있었다.**
     그래서 10/10 통과인데도 실제 글에서는 반응과 출처가 통째로 비었다.
     ⛔ 「내 자가 아는 범위에서 못 찾았다」를 「없다」로 읽지 않는다.
     ⇒ `src/content.config.ts` 가 실제로 쓰는 이름으로 한 번 더 잰다. */
  const 진짜 = [
    '---',
    'title: "ㄱ"',
    'sources:',
    '  - org: "한국농구연맹(KBL)"',
    '    api: "경기 기록"',
    '    url: "https://www.kbl.or.kr/"',
    '반응:',
    '  - 내용: "3쿼터가 다했다"',
    '    출처: "디시인사이드"',
    '    주소: "https://gall.dcinside.com/1"',
    '다음일정:',
    '  명칭: "고양 소노 대 서울 삼성"',
    '  일시: 2026-10-30T19:00:00+09:00',
    '---',
    '',
    '본문.',
  ].join('\n');
  const md2 = 리뷰변환(진짜, 'x');
  본다('진짜 열쇠 — 출처(org·api·url)가 들어간다',
    md2.includes('한국농구연맹(KBL)') && md2.includes('https://www.kbl.or.kr/'));
  본다('진짜 열쇠 — 반응(내용·출처·주소)이 들어간다',
    md2.includes('3쿼터가 다했다') && md2.includes('https://gall.dcinside.com/1'));
  본다('진짜 열쇠 — 다음 일정(명칭·일시)이 들어간다',
    md2.includes('고양 소노 대 서울 삼성'));
  본다('빈 절 제목을 안 낸다',
    !/## 출처\s*\n\s*\n\s*(##|---)/.test(리뷰변환('---\ntitle: "ㄱ"\n---\n본문.', 'x')));
  console.log(`\n  ${총 - 흠}/${총} 통과`);
  process.exit(흠 ? 1 : 0);
}

if (!fs.existsSync(낼곳)) {
  console.error('⛔ dist/wikitip/ko/review 가 없다 — 먼저 빌드를 돌린다.');
  process.exit(1);
}

const 파일들 = fs.readdirSync(글폴더).filter((f) => f.endsWith('.md'));
let 냄 = 0; let 건너뜀 = 0;
for (const 파일 of 파일들) {
  const 주소 = 파일.replace(/\.md$/, '');
  const md = 리뷰변환(fs.readFileSync(path.join(글폴더, 파일), 'utf8'), 주소);
  if (!md) { 건너뜀 += 1; continue; }
  fs.writeFileSync(path.join(낼곳, `${주소}.md`), md);
  냄 += 1;
}
console.log(`✅ 평문 판 ${냄}장 냈다 · 안 낸 것(draft 등) ${건너뜀}장 — dist/wikitip/ko/review/*.md`);
