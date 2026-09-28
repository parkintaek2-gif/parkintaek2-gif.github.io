#!/usr/bin/env node
/**
 * check-영문지면에-우리말.mjs — **영문 사이트의 지면이 «그대로 찍는» 칸에 우리말이 있나.**
 *
 * ── 🔴 왜 (2026-09-28 · 5번) ─────────────────────────────────────────
 * `/data/segment-reporting` 을 내고 라이브 화면을 떠서 봤더니, Source 칸에
 * **「DART 사업보고서 원문 (금융감독원 전자공시시스템) · 시가총액은 KRX 일별시세」**가
 * 한국어 그대로 찍혀 있었다. 내가 자료를 만드는 자에 우리말로 적었고,
 * 지면이 그 값을 그대로 냈다.
 *
 * ⛔ 사장님 지시 — **화면에 한국어를 안 낸다.** 우리 손님은 영어권이다.
 *   (「네가 할 일은 영어뉴스+데이터가공이다. k팝 등에 관심이 많은 해외대상이다」)
 *
 * ── ⚠ 무엇을 보고 무엇을 안 보나 ────────────────────────────────────
 * `src/data` 아래 JSON 은 213개 파일에 우리말이 들어 있다. 그런데 대부분은
 * `_왜`·`밑감`·`무엇을세나` 같은 **우리끼리 적은 메모**다. 그건 화면에 안 나간다.
 *
 * ⇒ **지면이 그대로 찍을 만한 칸 이름**만 본다. 그 목록이 아래 `내는칸` 이다.
 *   ⛔ 「한글이 있으면 전부 빨강」으로 만들지 않는다. 그러면 213개가 울고 아무도 안 본다.
 *     자가 너무 많이 울면 그 자는 꺼진다.
 * ⛔ 백년지도(100yearmap)는 «한국어 사이트»다. 한글이 정상이라 뺀다.
 *
 * 쓰는 법
 *   node scripts/check-영문지면에-우리말.mjs
 *   node scripts/check-영문지면에-우리말.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 지면이 손님에게 «그대로» 내보이는 칸 이름들 */
export const 내는칸 = new Set([
  'source', 'sources', 'note', 'notes', 'caption', 'label', 'title', 'name',
  'description', 'summary', 'headline', 'dek', 'footnote', 'credit', 'unit',
  '출처', '설명', '이름', '제목', '주석', '단위',
]);

/** 우리끼리 적는 메모 칸 — 화면에 안 나간다. 보지 않는다 */
export const 메모칸 = new Set(['_왜', '왜', '밑감', '무엇을세나', '정의', '메모', '_메모', '한계', '방식']);

export const 한글 = /[가-힣]/;

/** 한 자료에서 «내보이는 칸»에 우리말이 든 자리를 찾는다 */
export function 찾기(자료, 칸들 = 내는칸, 뺄칸 = 메모칸) {
  const 것 = [];
  (function 판다(o, 길, 마지막칸) {
    if (typeof o === 'string') {
      if (칸들.has(마지막칸) && !뺄칸.has(마지막칸) && 한글.test(o)) 것.push({ 길, 값: o.slice(0, 70) });
      return;
    }
    if (Array.isArray(o)) { o.forEach((x, i) => 판다(x, `${길}[${i}]`, 마지막칸)); return; }
    if (o && typeof o === 'object') {
      for (const k of Object.keys(o)) {
        if (뺄칸.has(k)) continue;              /* 메모 가지는 통째로 건너뛴다 */
        판다(o[k], `${길}.${k}`, k);
      }
    }
  })(자료, '', '');
  return 것;
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참, 덧 = '') => 것.push({ 이름, 참: !!참, 덧 });

  본다('🔴 source 칸의 우리말을 잡는다',
    찾기({ source: 'DART 사업보고서 원문' }).length === 1);
  본다('🔴 출처 칸의 우리말도 잡는다', 찾기({ 출처: '금융감독원' }).length === 1);
  본다('⛔ 영문 source 는 안 잡는다', 찾기({ source: 'DART annual reports' }).length === 0);
  본다('⛔ 우리끼리 적는 메모(_왜)는 안 잡는다 — 화면에 안 나간다',
    찾기({ _왜: '사장님 지시로 만들었다' }).length === 0);
  본다('⛔ 밑감·무엇을세나도 안 잡는다',
    찾기({ 밑감: 'archive/raw/…', 무엇을세나: '몇 곳인가' }).length === 0);
  본다('배열 안도 본다',
    찾기({ rows: [{ note: '한글 주석' }] }).length === 1);
  본다('⛔ 빈 것에 안 터진다', 찾기(null).length === 0 && 찾기(undefined).length === 0);
  본다('여러 자리를 다 모은다',
    찾기({ source: '가나', rows: [{ note: '다라' }, { note: 'ok' }] }).length === 2);

  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ check-영문지면에-우리말 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}${x.덧 ? `  (${x.덧})` : ''}`);
  return 빨강.length === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  const 밑 = path.join(뿌리, 'src', 'data');
  const 걸린것 = [];
  (function 훑기(p) {
    for (const f of fs.readdirSync(p)) {
      const q = path.join(p, f);
      if (fs.statSync(q).isDirectory()) {
        if (/100yearmap/.test(f)) continue;          /* 한국어 사이트 */
        훑기(q);
        continue;
      }
      if (!f.endsWith('.json') || /100yearmap/.test(f)) continue;
      let j;
      try { j = JSON.parse(fs.readFileSync(q, 'utf8')); } catch (e) { continue; }
      const 자리 = 찾기(j);
      if (자리.length) 걸린것.push({ 길: path.relative(뿌리, q), 자리 });
    }
  })(밑);

  /**
   * ⭐ **기준선을 둔다.** 처음 훑으니 59개 파일이 걸렸다.
   *   59개가 한꺼번에 울면 그 자는 아무도 안 보고, 안 보는 자는 꺼진 자와 같다.
   *   ⇒ 지금 아는 것은 «숙제»로 적어 두고, **새로 느는 것만 빨강**으로 잡는다.
   *   ⛔ 기준선을 「괜찮다」로 읽지 않는다. 줄여 가야 할 빚이다.
   */
  const 기준선길 = path.join(뿌리, 'docs', '고정업무-마커', '영문지면-우리말-기준선.json');
  let 기준선 = null;
  try { 기준선 = JSON.parse(fs.readFileSync(기준선길, 'utf8')); } catch (e) {}

  const 지금목록 = 걸린것.map((x) => x.길.replace(/\\/g, '/')).sort();

  if (!기준선) {
    fs.mkdirSync(path.dirname(기준선길), { recursive: true });
    fs.writeFileSync(기준선길, JSON.stringify({
      _왜: '영문 사이트의 지면이 내보이는 칸에 우리말이 든 파일 목록. 새로 느는 것만 빨강으로 잡으려고 둔다.',
      _언제: new Date().toLocaleString('ko-KR'),
      _숙제: '이 목록은 줄여 가야 할 빚이다. 「괜찮다」로 읽지 않는다.',
      파일: 지금목록,
    }, null, 2));
    console.log(`⬜ 기준선을 처음 적었다 — ${지금목록.length}개 (${path.relative(뿌리, 기준선길)})`);
    console.log('   이 목록은 줄여 가야 할 빚이다. 다음부터는 «새로 는 것»만 빨강으로 잡는다.');
    process.exit(0);
  }

  const 옛 = new Set(기준선.파일 ?? []);
  const 새것 = 지금목록.filter((f) => !옛.has(f));
  const 없어진것 = [...옛].filter((f) => !지금목록.includes(f));

  if (없어진것.length) console.log(`✅ 고쳐진 것 ${없어진것.length}개 — ${없어진것.slice(0, 5).join(' · ')}`);

  if (!새것.length) {
    console.log(`✅ 새로 는 것이 없다 (남은 빚 ${지금목록.length}개 — ${path.relative(뿌리, 기준선길)})`);
    process.exit(0);
  }

  console.log(`🔴 영문 지면이 내보이는 칸에 우리말이 «새로» 들어왔다 — ${새것.length}개`);
  for (const f of 새것) {
    const x = 걸린것.find((y) => y.길.replace(/\\/g, '/') === f);
    console.log(`   ${f}`);
    for (const 자 of (x?.자리 ?? []).slice(0, 3)) console.log(`      ${자.길}  ${자.값}`);
  }
  console.log('\n⛔ 사장님 지시 — 화면에 한국어를 안 낸다. 우리 손님은 영어권이다.');
  console.log('⚠ 회사 «한글 이름»처럼 고유명사라 바꿀 수 없는 것은 영문명을 따로 두고 그것을 낸다.');
  process.exit(1);
}
