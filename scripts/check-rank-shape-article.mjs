#!/usr/bin/env node
/**
 * 56편째(**차트 한가운데**)가 자료와 맞나.
 *
 * ⛔ 오늘 새벽에만 `includes(값)` 이 헐거워서 **다섯 번** 놓쳤다(영상 자 · 51 · 52 · 53 · 55).
 *    줄로 좁히고 칸으로 갈라도 **같은 줄에 같은 수가 두 번** 나오면 또 뚫린다.
 * ⭐ 그래서 여기서는 **칸 자리(몇 번째 칸인가)로** 본다. 값이 맞아도 **자리가 틀리면 운다.**
 *    표 두 개가 줄머리 이름이 같으므로 **칸 수로** 어느 표인지 가른다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/middle-of-the-chart.md';
const 자료길 = 'src/data/wikitip-rank-shape.json';
const 지면길 = 'src/pages/wikitip/rank-shape.astro';

export function 본문만(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n').replace(/−/g, '-'); // ⛔ 빼기표(−)를 하이픈으로 눌러 둔다
  const 조각 = 눌린.split(/^---$/m);
  return (조각.length >= 3 ? 조각.slice(2).join('---') : 눌린).replace(/[*_]/g, '');
}

export function 받을꼴(v) {
  const 꼴 = new Set([String(v)]);
  const n = Number(v);
  if (Number.isFinite(n)) {
    꼴.add(String(n));
    꼴.add(n.toLocaleString('en-US'));
    if (Number.isInteger(n)) 꼴.add(n.toFixed(1));
    if (n > 0) 꼴.add(`+${n}`);
  }
  return [...꼴];
}

export function 있나(글, v) { return 받을꼴(v).some((s) => 글.includes(s)); }

/** 표 한 줄을 칸으로 가른다 */
export function 칸들(줄) {
  return 줄.split('|').map((c) => c.trim()).filter((c) => c !== '');
}

/** 칸 하나를 값으로 눌러 본다 — 꼬리의 `%`·`p` 와 괄호 딸림을 뗀다 */
export function 칸값(칸) {
  return 칸.replace(/\s*\(.*$/, '').replace(/[%p]$/, '').trim();
}

/** 그 이름이 줄머리이고 칸이 정확히 몇 개인 줄만 — 표 두 개를 이걸로 가른다 */
export function 표줄(본문, 이름, 칸수) {
  return 본문.split('\n')
    .filter((l) => l.trim().startsWith(`| ${이름} |`))
    .filter((l) => 칸들(l).length === 칸수);
}

/** ⭐ **자리로** 본다 — n번째 칸이 그 값인가 */
export function 칸자리(줄, n, v) {
  const c = 칸들(줄);
  if (n >= c.length) return false;
  return 받을꼴(v).includes(칸값(c[n]));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('빼기표를 하이픈으로', 본문만('---\na: 1\n---\n−2.1p').includes('-2.1p'));
  자가('칸 꼬리 %를 뗀다', 칸값('35.3%') === '35.3');
  자가('칸 꼬리 p를 뗀다', 칸값('+8.6p') === '+8.6');
  자가('괄호 딸림을 뗀다', 칸값('0.6% (all places: 2.8%)') === '0.6');
  자가('자리로 본다 — 맞는 자리', 칸자리('| A | 24 | 5.6 |', 1, 24));
  /* ⛔ 이게 이 자의 요점이다 — 값은 줄 안에 있지만 **자리가 다르면** 안 된다 */
  자가('자리로 본다 — 값은 있으나 자리가 다르면 아니다', !칸자리('| A | 24 | 5.6 |', 1, 5.6));
  자가('없는 자리는 아니다', !칸자리('| A | 24 |', 9, 24));
  자가('표를 칸 수로 가른다', 표줄('| A | 1 | 2 |\n| A | 1 | 2 | 3 |', 'A', 3).length === 1);
  자가('+ 꼴을 받는다', 칸자리('| A | +0.1p |', 1, 0.1));
  console.log(`차트 자리 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(48)} ${값}`); };

  /* ── 첫째 표 — 순위 모양. 칸 일곱: 이름·곳수·#1·#5·#10·전체·차이 ── */
  for (const b of d.bands) {
    const 줄들 = 표줄(본, b.label, 7);
    본다(`${b.label} — 모양 표 줄`, 줄들.length === 1, `칸 7개 줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    const l = 줄들[0];
    본다(`${b.label} — 곳수(2째 칸)`, 칸자리(l, 1, b.markets), b.markets);
    본다(`${b.label} — #1(3째 칸)`, 칸자리(l, 2, b.byRank[0].pc), b.byRank[0].pc);
    본다(`${b.label} — #5(4째 칸)`, 칸자리(l, 3, b.byRank[4].pc), b.byRank[4].pc);
    본다(`${b.label} — #10(5째 칸)`, 칸자리(l, 4, b.byRank[9].pc), b.byRank[9].pc);
    본다(`${b.label} — 전체 몫(6째 칸)`, 칸자리(l, 5, b.overallPc), b.overallPc);
    본다(`${b.label} — 차이(7째 칸)`, 칸자리(l, 6, b.gapPp), `${b.gapPp}p`);
  }

  /* ── 둘째 표 — 한 작품이 끌었나. 칸 넷: 이름·편수·가장 큰 몫·셋 뺀 뒤 ── */
  for (const b of d.bands) {
    const t = b.rank1Titles;
    const 줄들 = 표줄(본, b.label, 4);
    본다(`${b.label} — 쏠림 표 줄`, 줄들.length === 1, `칸 4개 줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    const l = 줄들[0];
    본다(`${b.label} — 서로 다른 편수(2째 칸)`, 칸자리(l, 1, t.distinctTitles), t.distinctTitles);
    본다(`${b.label} — 가장 큰 것의 몫(3째 칸)`, 칸자리(l, 2, t.biggestSharePc), `${t.biggestSharePc}%`);
    본다(`${b.label} — 셋 뺀 1위 몫(4째 칸)`, 칸자리(l, 3, t.rank1PcWithoutTopThree), `${t.rank1PcWithoutTopThree}%`);
    본다(`${b.label} — 견줄 전체 몫을 같은 칸에`, 칸들(l)[3].includes(`${b.overallPc}%`), `(all: ${b.overallPc}%)`);
  }

  /* ── 산문 안의 수 ── */
  const 중1 = d.bands[1]; const 위 = d.bands[3]; const 아래 = d.bands[0];
  본다('자리 총수', 있나(본, d.slotsTotal), d.slotsTotal.toLocaleString('en-US'));
  본다('시장 수', 있나(본, d.markets), d.markets);
  본다('전체 몫', 있나(본, d.overallPc), `${d.overallPc}%`);
  /* ⛔ 합쳐 놓으면 안 보인다는 것을 **기사가 먼저** 말해야 한다. 안 말하면 띠가 요술처럼 보인다 */
  본다('세계 전체 1위 몫', 있나(본, d.rank1Pc), `${d.rank1Pc}%`);
  본다('세계 전체 — 낮은 곳 수', 민본.includes(`${d.marketsBelowAtOne} of ${d.markets}`), `${d.marketsBelowAtOne} of ${d.markets}`);
  본다('합치면 안 보인다고 적었나', /coin toss|flat line/i.test(민본), '전체 수는 평평하다');
  본다('가운데 띠 — 낮은 곳 수', 민본.includes(`${중1.belowAtOne} of ${중1.markets}`), `${중1.belowAtOne} of ${중1.markets}`);
  본다('맨 위 띠 — 낮은 곳이 없다', /none of the ten/i.test(민본) && 위.belowAtOne === 0, '0/10');
  본다('갈래 — 가운데 띠 영화', 있나(본, 중1.films.gapPp), `${중1.films.gapPp}p`);
  본다('갈래 — 가운데 띠 시리즈', 있나(본, 중1.tv.gapPp), `${중1.tv.gapPp}p`);
  본다('갈래 — 맨 위 띠 영화', 있나(본, 위.films.gapPp), `${위.films.gapPp}p`);
  본다('갈래 — 맨 위 띠 시리즈', 있나(본, 위.tv.gapPp), `${위.tv.gapPp}p`);
  본다('맨 위 띠 — 곳당 서로 다른 편수', 있나(본, 위.rank1Titles.distinctPerMarketMean), 위.rank1Titles.distinctPerMarketMean);
  본다('가장 큰 작품 이름', 본.includes(아래.rank1Titles.biggestTitle), 아래.rank1Titles.biggestTitle);

  /* ⛔ 지켜야 할 말 — 하나라도 빠지면 기사가 자료보다 세게 말한 것이다 */
  본다('한 작품이 끈 것을 스스로 인정했나',
    /was not a Korean chart reaching number one/i.test(민본) && /It was one title/i.test(민본),
    '+0.1p 는 차트가 아니라 한 작품이었다');
  본다('순위는 결과지 까닭이 아니라고 적었나',
    /A position is an outcome/i.test(민본) && /never the reason/i.test(민본),
    '왜 그 자리인지는 못 답한다');
  본다('까닭을 지어내지 않겠다고 적었나', /this data does not contain/i.test(민본), '없는 것을 말하지 않는다');
  본다('띠가 지도가 아니라고 적었나', /not regions|not a map/i.test(민본), '몫으로 갈랐지 지역으로 안 갈랐다');
  본다('맨 위 띠가 원래 컸다는 것을 적었나', /already a quarter of the chart/i.test(민본), '깎여 나간 자리가 아니다');
  본다('갈래를 갈랐다고 적었나',
    /separate top tens/i.test(민본) && /same direction/i.test(민본),
    '영화와 시리즈를 갈라도 같은 방향');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/rank-shape'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/rank-shape"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
