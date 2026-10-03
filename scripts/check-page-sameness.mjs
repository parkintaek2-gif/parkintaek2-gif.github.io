#!/usr/bin/env node
/**
 * check-page-sameness.mjs — **같은 틀로 찍은 지면들이 서로 얼마나 «겹치나».**
 *
 * 🔴🔴 [2026-10-04 03:1x] 왜 만들었나
 *
 *   KCW 표본 8장 중 5장이 「Crawled - currently not indexed」였다 —
 *   구글이 **보고도 안 넣은 것**이다. 본문은 3,500~5,200자로 얇지 않았다.
 *   남은 까닭은 **겹침**이다. 같은 틀로 수백 장을 찍으면 구글이
 *   「거의 같은 지면」으로 보고 하나만 넣는다.
 *
 *   KCW 사이트맵 2,985장의 속 —
 *     /person 634 · /title 546 · /born-on 366 · /week 269 · /article 266
 *   앞 넷은 전부 **틀 하나에 값만 바꿔 끼운 것**이다.
 *
 * ⛔ 「겹친다」를 눈대중으로 말하지 않는다. 두 지면의 **낱말 겹침**을 센다.
 * ⚠ 틀이 같은 것 자체는 흠이 아니다 — 흠은 «그 지면에만 있는 것»이 적은 것이다.
 *   그래서 겹침과 함께 **고유한 낱말 수**를 같이 낸다.
 *
 * 쓰는 법
 *   node scripts/check-page-sameness.mjs <주소1> <주소2> [...]
 *   node scripts/check-page-sameness.mjs --틀 https://www.kculturewire.com/born-on/12-07,.../12-08
 *   node scripts/check-page-sameness.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 구글이 「거의 같다」고 볼 만한 선 — 넘으면 빨간불 */
export const 겹침문턱 = 80;

export function 본문글자(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 글을 낱말 꾸러미로. ⛔ 숫자만 다른 것을 「다르다」로 치지 않으려고 숫자는 한 가지로 묶는다 */
export function 낱말들(글) {
  return new Set(String(글 ?? '')
    .toLowerCase()
    .replace(/\d+/g, '#')
    .split(/[^0-9a-z가-힣#]+/)
    .filter((w) => w.length > 1));
}

/** 두 꾸러미가 얼마나 겹치나 (자카드, 0~100) */
export function 겹침비율(a, b) {
  const A = a instanceof Set ? a : 낱말들(a);
  const B = b instanceof Set ? b : 낱말들(b);
  if (!A.size && !B.size) return 0;
  let 같은것 = 0;
  for (const w of A) if (B.has(w)) 같은것 += 1;
  const 합 = A.size + B.size - 같은것;
  return 합 ? Math.round((같은것 / 합) * 100) : 0;
}

/** 그 지면에만 있는 낱말 — 다른 지면 어디에도 없는 것 */
export function 고유낱말(하나, 나머지들) {
  const A = 하나 instanceof Set ? 하나 : 낱말들(하나);
  const 밖 = new Set();
  for (const x of (나머지들 || [])) for (const w of (x instanceof Set ? x : 낱말들(x))) 밖.add(w);
  let n = 0;
  for (const w of A) if (!밖.has(w)) n += 1;
  return n;
}

export function 판정(겹침) {
  if (겹침 >= 겹침문턱) return { 빛: '🔴', 말: '거의 같다 — 구글이 하나만 넣는다' };
  if (겹침 >= 60) return { 빛: '⚠', 말: '많이 겹친다' };
  return { 빛: '✅', 말: '서로 다르다' };
}

const 내가진입점 = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (내가진입점 && process.argv.includes('--자가시험')) {
  let 탈 = 0;
  const 본다 = (이름, 참) => { console.log((참 ? '✅ ' : '🔴 ') + 이름); if (!참) 탈 += 1; };

  본다('태그·스크립트를 걷는다',
    본문글자('<p>가 나</p><script>몰래</script>') === '가 나');
  본다('⛔ 빈 것·null 에도 안 터진다', 본문글자(null) === '' && 낱말들(null).size === 0);
  본다('한 글자는 안 센다', !낱말들('가 나다').has('가'));
  본다('🔴 숫자만 다른 것을 «다르다»로 치지 않는다',
    겹침비율('태어난 날 1207 스타 목록', '태어난 날 1208 스타 목록') === 100);
  본다('아주 다르면 낮다', 겹침비율('사과 배 포도', '자동차 비행기 기차') === 0);
  본다('같으면 100', 겹침비율('가나 다라', '가나 다라') === 100);
  본다('⛔ 둘 다 비면 0 이다(1 이 아니다)', 겹침비율('', '') === 0);

  본다('🔴 거의 같으면 빨강', 판정(95).빛 === '🔴');
  본다('많이 겹치면 노랑', 판정(70).빛 === '⚠');
  본다('다르면 초록', 판정(20).빛 === '✅');

  본다('그 지면에만 있는 낱말을 센다',
    고유낱말('가나 다라 마바', ['가나 다라']) === 1);
  본다('⛔ 견줄 것이 없으면 전부 고유다',
    고유낱말('가나 다라', []) === 2);

  console.log(탈 ? `\n🔴 ${탈}개 떨어졌다` : '\n✅ 자가시험 통과');
  process.exit(탈 ? 1 : 0);
}

if (내가진입점) {
  const 틀자리 = process.argv.indexOf('--틀');
  const 주소들 = 틀자리 > 0
    ? String(process.argv[틀자리 + 1] || '').split(',').map((s) => s.trim()).filter(Boolean)
    : process.argv.slice(2).filter((s) => !s.startsWith('--'));
  if (주소들.length < 2) {
    console.log('사용법: node scripts/check-page-sameness.mjs <주소1> <주소2> [...]');
    process.exit(1);
  }

  const 받기 = (u) => fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    signal: AbortSignal.timeout(20000) }).then((r) => r.text()).catch(() => null);

  const 글들 = [];
  for (const u of 주소들) {
    const h = await 받기(u);
    if (h === null) { console.log(`🔴 못 받았다 — ${u}`); continue; }
    const t = 본문글자(h);
    글들.push({ 주소: u, 글자: t.length, 낱말: 낱말들(t) });
  }
  if (글들.length < 2) { console.log('🔴 견줄 것이 모자란다'); process.exit(1); }

  console.log(`■ 지면 ${글들.length}장을 서로 견준다\n`);
  let 가장높은 = 0;
  for (let i = 0; i < 글들.length; i += 1) {
    for (let j = i + 1; j < 글들.length; j += 1) {
      const v = 겹침비율(글들[i].낱말, 글들[j].낱말);
      가장높은 = Math.max(가장높은, v);
      const p = 판정(v);
      console.log(`  ${p.빛} ${String(v).padStart(3)}%  ${글들[i].주소.replace(/^https?:\/\/[^/]+/, '')}`
        + `  ↔  ${글들[j].주소.replace(/^https?:\/\/[^/]+/, '')}`);
    }
  }
  console.log('\n■ 그 지면에만 있는 낱말');
  for (const g of 글들) {
    const 남 = 글들.filter((x) => x !== g).map((x) => x.낱말);
    const n = 고유낱말(g.낱말, 남);
    console.log(`  ${String(n).padStart(4)}개  ${g.주소.replace(/^https?:\/\/[^/]+/, '').padEnd(34)}`
      + `(본문 ${g.글자}자 · 낱말 ${g.낱말.size}개)`);
  }
  const p = 판정(가장높은);
  console.log(`\n${p.빛} 가장 많이 겹친 짝 ${가장높은}% — ${p.말}`);
  console.log('⚠ 틀이 같은 것 자체는 흠이 아니다. 흠은 «그 지면에만 있는 것»이 적은 것이다.');
  process.exit(가장높은 >= 겹침문턱 ? 1 : 0);
}
