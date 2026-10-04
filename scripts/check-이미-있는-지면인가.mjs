/**
 * check-이미-있는-지면인가.mjs — **지면을 내기 전에 「이미 있나」를 한 줄로 묻는다.**
 *
 * ── 왜 ────────────────────────────────────────────────────────
 * 🔴 [2026-10-05 02:5x · 5번] 「특목고」·「자사고」가 자동완성 10줄을 꽉 채우는 것을
 *   재고 `/100y/school-type` 을 새로 지었는데, **`school-type-gap` 이 이미 같은
 *   이야기를 하고 있었다** — 제목에 「특목고」·「자사고」가 다 들어 있었다.
 *   더 나쁜 것은, 내가 바로 전날 전 유닛에 **「지면을 내기 전에 저장소를 긁어라」**
 *   라고 알려 놓고 정작 내가 안 긁었다는 점이다.
 *   ⇒ 사람이 기억해서 지키는 구조를 만들지 않는다. 자로 만든다.
 *
 * ── 이 자가 묻는 것 둘 ────────────────────────────────────────
 * ```
 * ① 그 말을 제목에 둔 지면이 이미 있나        있으면 ⛔ 새로 만들지 않는다
 * ② 우리가 「채택하지 않는다」고 밝혀 둔 말인가  그렇다면 ⛔ 지면을 내지 않는다
 * ```
 * ②는 2026-10-04 에 삼재 지면을 냈다가 내린 자리다 — 우리 지면 다섯 곳이 이미
 * 손님께 「삼재를 채택하지 않는다」고 밝혀 두고 있었다. 지면을 내면 엔진이
 * 스스로를 부정한다.
 *
 * ⛔ 이 자는 «막지» 않는다. 사람에게 보여 주고 사람이 판단한다 —
 *   같은 말을 다른 각도에서 다루는 지면은 있을 수 있다.
 * ⛔ 못 찾은 것을 「없다」로 읽지 않는다. 뒤진 곳을 함께 적는다.
 *
 * 쓰는 법  node scripts/check-이미-있는-지면인가.mjs 특목고 자사고
 *          node scripts/check-이미-있는-지면인가.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 뒤질 곳. ⛔ 한 곳만 보면 다른 저장소의 지면을 놓친다 */
export const 뒤질곳 = [
  { 이름: 'SeoulMarkets·백년지도·KCW 소스', 밑: path.join(뿌리, 'src/pages') },
  { 이름: 'KLifeMap 지면', 밑: path.resolve(뿌리, '..', 'klifemap', 'public') },
];

/** 「우리가 안 한다」고 적어 둔 꼴 */
export const 거절꼴 = /채택하지\s*않|인정하지\s*않|판정에\s*넣지\s*않|다루지\s*않/;

/** 그 밑의 글 파일을 모은다. ⛔ node_modules·dist 는 안 본다 */
export function 글파일들(밑, 깊이 = 0) {
  if (깊이 > 6 || !fs.existsSync(밑)) return [];
  const 것 = [];
  let 목록 = [];
  try { 목록 = fs.readdirSync(밑, { withFileTypes: true }); } catch { return []; }
  for (const e of 목록) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const 길 = path.join(밑, e.name);
    if (e.isDirectory()) 것.push(...글파일들(길, 깊이 + 1));
    else if (/\.(astro|html|md|ts)$/.test(e.name)) 것.push(길);
  }
  return 것;
}

/**
 * 그 파일의 제목들. ⛔ 못 읽으면 빈 배열.
 *
 * 🔴 [2026-10-05] 처음에 `<title>` 과 `const TITLE` 두 꼴만 읽었더니
 *   **school-type-gap 을 놓쳤다** — 그 지면은 레이아웃에 `title={...}` 로 넘긴다.
 *   자가 한 꼴을 못 읽으면 「없다」가 나오고, 그러면 중복을 또 만든다.
 *   ⇒ 실물로 재 보고서야 드러났다. 자가시험만으로는 안 보였다.
 * ⚠ 제목이 여럿 나올 수 있다 — 다 모아 돌려준다. 하나만 보면 또 놓친다.
 */
export function 제목들(글) {
  const t = String(글 ?? '');
  const 것 = [];
  const 담기 = (x) => { const v = String(x ?? '').trim(); if (v.length >= 4) 것.push(v); };
  for (const m of t.matchAll(/<title>([^<]*)<\/title>/g)) 담기(m[1]);
  for (const m of t.matchAll(/(?:const\s+(?:TITLE|title|제목긴것)\s*=\s*[`'"])([^`'"]{4,})/g)) 담기(m[1]);
  /* 🔴 레이아웃에 넘기는 꼴 — 템플릿 리터럴과 따옴표 둘 다 */
  for (const m of t.matchAll(/\btitle=\{`([^`]{4,})`\}/g)) 담기(m[1]);
  for (const m of t.matchAll(/\btitle="([^"]{4,})"/g)) 담기(m[1]);
  return 것;
}

/** 첫 제목 하나. ⛔ 못 읽으면 null */
export function 제목(글) {
  const 것 = 제목들(글);
  return 것.length ? 것[0] : null;
}

/**
 * 그 말로 저장소를 뒤진다.
 * @returns {{말:string, 제목에:Array, 본문에:number, 거절:Array, 뒤진파일:number}}
 */
export function 뒤진다(말, 곳들 = 뒤질곳) {
  const 찾는말 = String(말 ?? '').trim();
  const 결과 = { 말: 찾는말, 제목에: [], 본문에: 0, 거절: [], 뒤진파일: 0 };
  if (!찾는말) return 결과;
  /* 🔴🔴 [2026-10-05 05:1x · 5번] **대소문자를 가리고 있었다.**
     「kospi」로 물으니 「만들어도 된다」가 나왔다. 그런데 바로 전날
     `src/pages/kospi-vs-kosdaq.astro` 를 냈고 그 제목이 「KOSPI vs KOSDAQ …」이다.
     ⇒ 영어 지면을 내는 SeoulMarkets·K Culture Wire 에서 **이 자가 쓸모가 없었다.**
       영어 제목은 거의 다 대문자로 적히는데 손님이 치는 말은 소문자다.
     ⛔ 한국어에는 대소문자가 없어 이 흠이 한 번도 안 드러났다 — 영어로 재서야 나왔다.
     ⚠ 「다국어는 기본」인데 자가 한국어에서만 돌고 있었던 셈이다. */
  const 낮춘말 = 찾는말.toLowerCase();

  for (const 곳 of 곳들) {
    for (const 길 of 글파일들(곳.밑)) {
      let 글 = '';
      try { 글 = fs.readFileSync(길, 'utf8'); } catch { continue; }
      결과.뒤진파일 += 1;
      const 낮춘글 = 글.toLowerCase();
      if (!낮춘글.includes(낮춘말)) continue;
      결과.본문에 += 1;
      for (const t of 제목들(글)) {
        if (t.toLowerCase().includes(낮춘말)) {
          결과.제목에.push({ 곳: 곳.이름, 길: path.relative(뿌리, 길), 제목: t });
          break;                           /* 한 파일은 한 번만 센다 */
        }
      }
      /* 「채택하지 않는다」가 그 말과 «같은 줄»에 있나 */
      for (const 줄 of 글.split('\n')) {
        if (줄.toLowerCase().includes(낮춘말) && 거절꼴.test(줄)) {
          결과.거절.push({ 길: path.relative(뿌리, 길), 줄: 줄.trim().slice(0, 120) });
          break;
        }
      }
    }
  }
  return 결과;
}

/** 사람에게 줄 판정. ⛔ 「막는다」가 아니라 「보라」다 */
export function 판정(r) {
  if (!r || !r.뒤진파일) return { 어떻게: '못 쟀다', 왜: '뒤진 파일이 0개다 — 경로를 확인한다' };
  if (r.거절.length) return { 어떻게: '내지 않는다', 왜: `우리가 「채택하지 않는다」고 밝혀 둔 말이다(${r.거절.length}곳)` };
  if (r.제목에.length) return { 어떻게: '새로 만들지 않는다', 왜: `그 말을 제목에 둔 지면이 이미 ${r.제목에.length}장 있다 — 그 지면을 키운다` };
  if (r.본문에) return { 어떻게: '만들어도 된다', 왜: `본문에 ${r.본문에}곳 나오지만 제목에 둔 지면은 없다` };
  return { 어떻게: '만들어도 된다', 왜: '저장소 어디에도 그 말이 없다' };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 진 = [];
  const 본다 = (이름, 참) => { if (참) 통 += 1; else 진.push(이름); };

  /* ⚠ 네 글자 미만은 걸러진다 — 잡음을 줄이려고 그렇게 두었다 */
  본다('제목을 html 에서 읽는다', 제목('<title>가나다라</title>') === '가나다라');
  본다('⛔ 세 글자는 너무 짧아 안 읽는다', 제목('<title>가나다</title>') === null);
  본다('제목을 astro 앞말에서 읽는다', 제목("const TITLE = '특목고 진학률';") === '특목고 진학률');
  본다('⛔ 없으면 null', 제목('아무것도 없다') === null && 제목(null) === null);
  /* 🔴 [2026-10-05] 이 꼴을 못 읽어 school-type-gap 을 놓쳤다 — 중복을 만들 뻔했다 */
  본다('🔴 레이아웃에 넘기는 title={백틱} 도 읽는다',
    제목들('<HundredYear' + String.fromCharCode(10) + '  title={`특목고 진학률 71.2%`}').some((t) => t.includes('특목고')));
  본다('title="…" 도 읽는다', 제목들('<Base title="대학 취업률 순위">').some((t) => t.includes('취업률')));
  본다('제목이 여럿이면 다 모은다',
    제목들('<title>가나다라</title> const TITLE = \'마바사아\';').length === 2);

  본다('거절꼴을 잡는다', 거절꼴.test('삼재는 채택하지 않으며'));
  본다('거절꼴을 잡는다 — 인정하지 않', 거절꼴.test('원진살을 인정하지 않습니다'));
  본다('⛔ 보통 문장은 안 잡는다', !거절꼴.test('삼재는 띠로 정해집니다'));

  /* 🔴 판정이 네 갈래로 갈리는지 */
  본다('거절이 있으면 내지 않는다',
    판정({ 뒤진파일: 9, 거절: [{}], 제목에: [], 본문에: 1 }).어떻게 === '내지 않는다');
  본다('제목에 있으면 새로 안 만든다',
    판정({ 뒤진파일: 9, 거절: [], 제목에: [{}], 본문에: 1 }).어떻게 === '새로 만들지 않는다');
  본다('본문에만 있으면 만들어도 된다',
    판정({ 뒤진파일: 9, 거절: [], 제목에: [], 본문에: 3 }).어떻게 === '만들어도 된다');
  본다('아무 데도 없으면 만들어도 된다',
    판정({ 뒤진파일: 9, 거절: [], 제목에: [], 본문에: 0 }).어떻게 === '만들어도 된다');
  /* ⛔ 못 쟀을 때를 「없다」로 읽지 않는다 */
  본다('🔴 뒤진 파일이 0 이면 «못 쟀다»', 판정({ 뒤진파일: 0 }).어떻게 === '못 쟀다');
  본다('⛔ null 도 못 쟀다', 판정(null).어떻게 === '못 쟀다');

  본다('빈 말은 빈손', 뒤진다('').본문에 === 0);
  본다('뒤질 곳이 둘이다 — 저장소가 둘이라서', 뒤질곳.length === 2);

  /* 🔴🔴 [2026-10-05] 대소문자를 가려서 영어 지면을 통째로 못 찾고 있었다.
     가짜 폴더를 하나 만들어 «실제로 뒤지게» 해서 잰다 — 눈속임 시험을 두지 않는다. */
  const 가짜 = path.join(os.tmpdir(), `중복자-시험-${process.pid}`);
  try {
    fs.mkdirSync(가짜, { recursive: true });
    fs.writeFileSync(path.join(가짜, 'a.astro'),
      'const TITLE = `KOSPI vs KOSDAQ — filers, counted`;\n', 'utf8');
    const 곳 = [{ 이름: '시험', 밑: 가짜 }];
    본다('🔴 소문자 「kospi」로 대문자 제목 「KOSPI」를 찾는다',
      뒤진다('kospi', 곳).제목에.length === 1);
    본다('🔴 대문자로 물어도 찾는다', 뒤진다('KOSPI', 곳).제목에.length === 1);
    본다('🔴 섞어 물어도 찾는다', 뒤진다('KoSpI', 곳).제목에.length === 1);
    본다('⛔ 없는 말은 그래도 안 찾는다', 뒤진다('nikkei', 곳).제목에.length === 0);
    본다('⛔ 본문 셈도 대소문자를 안 가린다', 뒤진다('kosdaq', 곳).본문에 === 1);
  } finally {
    try { fs.rmSync(가짜, { recursive: true, force: true }); } catch { /* 지우다 실패해도 시험은 끝났다 */ }
  }

  console.log(진.length ? `🔴 ${진.length} 떨어졌다 —\n  ${진.join('\n  ')}` : `✅ 자가시험 ${통} 통과`);
  process.exit(진.length ? 1 : 0);
}

if (내가실행됐다) {
  const 말들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!말들.length) {
    console.log('⛔ 쓰는 법: node scripts/check-이미-있는-지면인가.mjs <말> [말...]');
    process.exit(1);
  }
  let 막힌것 = 0;
  for (const 말 of 말들) {
    const r = 뒤진다(말);
    const v = 판정(r);
    const 표 = v.어떻게 === '만들어도 된다' ? '✅' : v.어떻게 === '못 쟀다' ? '⬜' : '🔴';
    console.log(`\n${표} 「${말}」 — ${v.어떻게}`);
    console.log(`   ${v.왜}  (뒤진 파일 ${r.뒤진파일}개)`);
    for (const x of r.제목에.slice(0, 3)) console.log(`   · 제목에 있다 — ${x.길}\n     「${x.제목.slice(0, 70)}」`);
    for (const x of r.거절.slice(0, 2)) console.log(`   ⛔ ${x.길}\n     ${x.줄}`);
    if (v.어떻게 !== '만들어도 된다') 막힌것 += 1;
  }
  console.log('\n⚠ 이 자는 막지 않는다 — 보여 줄 뿐이다. 같은 말을 «다른 각도»로 다루는 지면은 있을 수 있다.');
  console.log('   다만 🔴 가 떴는데도 새로 만들려면, 왜 중복이 아닌지를 커밋 글에 적는다.');
  process.exit(0);
}
