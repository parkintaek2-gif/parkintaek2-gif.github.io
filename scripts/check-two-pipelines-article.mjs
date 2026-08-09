#!/usr/bin/env node
/**
 * 58편째(**방송을 안 거친 시리즈가 열 배 멀리 간다**)가 자료와 맞나.
 *
 * ⛔ 오늘 배운 둘을 그대로 쓴다 —
 *   ① 표는 **칸 자리**로 본다(값이 맞아도 자리가 틀리면 운다)
 *   ② 산문의 수는 **경계**로 본다(「39」 안의 3 에 안 뚫린다)
 * ⛔ 그리고 오늘 한 번 더 배운 것 — **이름 목록은 자료와 글자까지 같아야 한다.**
 *   내가 열다섯 중 열한 개만 적었다가 잡혔다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/the-broadcast-run-that-never-happened.md';
const 자료길 = 'src/data/wikitip-two-pipelines.json';
const 지면길 = 'src/pages/wikitip/two-pipelines.astro';

export function 본문만(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n').replace(/−/g, '-');
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
  }
  return [...꼴];
}

/** 낱낱의 수로 있나 — 앞뒤에 숫자가 붙어 있으면 그 수의 조각이다 */
export function 낱수있나(글, v) {
  return 받을꼴(v).some((s) => {
    const 뭉갠 = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?<![0-9.])${뭉갠}(?!\\.?[0-9])`).test(글);
  });
}

export function 칸들(줄) {
  return 줄.split('|').map((c) => c.trim()).filter((c) => c !== '');
}

export function 칸값(칸) {
  return 칸.replace(/\s*\(.*$/, '').replace(/[%p]$/, '').trim();
}

export function 표줄(본문, 이름, 칸수) {
  return 본문.split('\n')
    .filter((l) => l.trim().startsWith(`| ${이름} |`))
    .filter((l) => 칸들(l).length === 칸수);
}

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
  자가('자리로 본다', 칸자리('| Series | 238 | 49 |', 1, 238));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| Series | 238 | 49 |', 1, 49));
  자가('표를 칸 수로 가른다', 표줄('| A | 1 |\n| A | 1 | 2 |', 'A', 2).length === 1);
  자가('39 안의 3 을 3 으로 안 읽는다', !낱수있나('reached 39 markets', 3));
  자가('낱낱의 수는 읽는다', 낱수있나('reached 3 markets', 3));
  자가('문장 끝 마침표 뒤의 수를 읽는다', 낱수있나('it holds 9,668.', 9668));
  자가('자릿점 꼴도 읽는다', 낱수있나('holds 14,847 chart places', 14847));
  console.log(`두 갈래 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');
  const A = d.aired; const N = d.notAired;

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(44)} ${값}`); };

  /* ── 표. 칸 셋: 이름 · 방송 탄 쪽 · 안 탄 쪽 ── */
  const 줄검사 = (이름, a, n) => {
    const 줄들 = 표줄(본, 이름, 3);
    본다(`${이름} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) return;
    본다(`${이름} — 방송 탄 쪽(2째 칸)`, 칸자리(줄들[0], 1, a), a);
    본다(`${이름} — 안 탄 쪽(3째 칸)`, 칸자리(줄들[0], 2, n), n);
  };
  줄검사('Series', A.titles, N.titles);
  줄검사('Markets reached, median', A.medianMarkets, N.medianMarkets);
  줄검사('Chart places held, median', A.medianPlaces, N.medianPlaces);
  줄검사('Charted in exactly one market', A.oneMarketOnly, N.oneMarketOnly);
  줄검사('Reached 20 markets or more', A.reached20, N.reached20);

  /* ── 산문 ── */
  본다('방송 쪽 자리 수', 낱수있나(본, A.places), A.places.toLocaleString('en-US'));
  본다('방송 쪽 자리 몫', 낱수있나(본, A.placeSharePc), `${A.placeSharePc}%`);
  본다('안 탄 쪽 자리 수', 낱수있나(본, N.places), N.places.toLocaleString('en-US'));
  본다('시장 수', 낱수있나(본, d.marketCount), d.marketCount);
  본다('덮는 몫', 낱수있나(본, d.seriesCoveragePc), `${d.seriesCoveragePc}%`);
  본다('회사 붙은 시리즈', 낱수있나(본, d.seriesWithFirms), d.seriesWithFirms);
  본다('시리즈 전체', 낱수있나(본, d.seriesTotal), d.seriesTotal);
  본다('빠진 시리즈 수(앞말)', 원.includes(String(d.seriesTotal - d.seriesWithFirms)), d.seriesTotal - d.seriesWithFirms);
  본다('영화 — 방송 탄 쪽', 낱수있나(본, d.films.aired.medianMarkets), d.films.aired.medianMarkets);
  본다('영화 — 안 탄 쪽', 낱수있나(본, d.films.notAired.medianMarkets), d.films.notAired.medianMarkets);

  /* ⛔ 이름 목록은 **자료와 글자까지 같아야** 한다 */
  const 빠진이름 = N.biggestExamples.filter((x) => !본.includes(x));
  본다('60곳 넘는 이름을 다 적었나', 빠진이름.length === 0,
    빠진이름.length ? `🔴 빠짐 ${빠진이름.length}: ${빠진이름.join(' · ')}` : `${N.biggestExamples.length}개 다 있다`);

  /* ⛔ 지켜야 할 말 */
  본다('대리 표지라고 적었나', /That\s+is a proxy/i.test(민본) && /only the broadcaster field is/i.test(민본), '확인한 것이 아니다');
  본다('방송 쪽이 지는 게 아니라고 적었나',
    /is not the losing one/i.test(민본) && /larger share of the chart/i.test(민본), '자리는 방송 쪽이 더 많다');
  본다('영화가 반대라고 적었나', /the direction reverses/i.test(민본) && /not a fact about streaming/i.test(민본), '시리즈에만 있다');
  본다('까닭을 못 답한다고 적었나',
    /It cannot tell you \*{0,2}why/i.test(민본) && /this data does not hold/i.test(민본), '왜인지는 없다');
  본다('덮는 몫의 한계를 적었나', /absent from this comparison rather than/i.test(민본), '빠진 것은 어느 쪽도 아니다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/two-pipelines'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/two-pipelines"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
