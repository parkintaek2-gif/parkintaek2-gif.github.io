#!/usr/bin/env node
/**
 * 구글 색인을 **표본으로** 재기 위한 주소 뽑기 — 세 자리(3·5·6번)가 같이 쓴다.
 *
 * 2번 요청(2026-08-09): 「어떻게 쟀는지 **한 줄**로 남기십시오 — 3번·6번이 그대로 따라 할 수 있게」
 *
 * ⛔ 구글 색인 수는 **명령으로 못 잰다.** Search Console 화면에서만 보인다.
 *    ⚠ site: 검색은 봇 차단에 걸리고, Indexing API 는 채용공고·생중계에만 열려 있다.
 *    ⭐ 그래서 이 자가 하는 일은 **「무엇을 손으로 재야 하는지」를 골라 주는 것**이다.
 *
 * ⛔ 61장을 다 손으로 재지 않는다. **날짜별로 골고루** 뽑는다 —
 *    오늘 잰 것이 이렇다: 8/6 기사는 **색인됨**, 8/8 기사는 **발견됨·색인 안 됨**.
 *    ⭐ 갈리는 것은 지면의 좋고 나쁨이 아니라 **나이**다. 새것만 재면 「구글이 우리를 모른다」로
 *      잘못 적게 되고, 옛것만 재면 「다 들어갔다」로 잘못 적게 된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 자리마다 어디에 글이 있고 어느 주소로 나가나 */
export const 자리들 = {
  5: { 이름: 'K Culture Wire', 방: 'content/kculturewire', 앞: 'https://www.kculturewire.com/article/' },
  6: { 이름: 'SeoulMarkets', 방: 'content/articles', 앞: 'https://seoulmarkets.com/article/' },
  /*
   * ⚠ 3번(백년지도)은 여기 없다. 마크다운 기사 방이 없고 지면이 자료에서 바로 나온다 —
   *    dist/100y 를 걸어 봤더니 .md 로 만드는 글이 아니었다.
   *    ⛔ 방 이름을 짐작해 넣지 않았다. 3번이 자기 방을 알려 주면 한 줄 넣으면 된다.
   *    ⭐ 그 사이에도 3번은 아래 「재는 법 한 줄」과 「세 상태」를 그대로 쓸 수 있다.
   */
};
/**
 * 날짜별로 골고루 n개를 뽑는다.
 * ⛔ 앞에서 n개를 자르지 않는다 — 그러면 한 날짜만 뽑혀 나이 차이를 못 본다.
 */
export function 골고루(글들, n) {
  const 날짜별 = new Map();
  for (const g of 글들) {
    if (!날짜별.has(g.날짜)) 날짜별.set(g.날짜, []);
    날짜별.get(g.날짜).push(g);
  }
  const 통 = [...날짜별.keys()].sort().map((d) => 날짜별.get(d));
  const 뽑음 = [];
  let i = 0;
  /* 날짜 통을 돌아가며 하나씩 집는다 */
  while (뽑음.length < n && 통.some((t) => t.length > i)) {
    for (const t of 통) {
      if (뽑음.length >= n) break;
      if (t.length > i) 뽑음.push(t[i]);
    }
    i += 1;
  }
  return 뽑음;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const ㄱ = (날짜, s) => ({ 날짜, slug: s });
  /* 🔴 이 줄이 이 자의 요점이다 — 앞에서 자르면 8/6 만 나온다 */
  재본다('날짜 통을 돌아가며 뽑는다',
     골고루([ㄱ('8/6', 'a'), ㄱ('8/6', 'b'), ㄱ('8/8', 'c'), ㄱ('8/9', 'd')], 3).map((x) => x.slug),
    ['a', 'c', 'd']);
  재본다('한 날짜뿐이면 그 날짜에서 뽑는다',
     골고루([ㄱ('8/6', 'a'), ㄱ('8/6', 'b')], 2).map((x) => x.slug), ['a', 'b']);
  재본다('있는 것보다 많이 달라 해도 있는 만큼만',
     골고루([ㄱ('8/6', 'a')], 5).length, 1);
  재본다('0개를 달라 하면 0개', 골고루([ㄱ('8/6', 'a')], 0).length, 0);
  console.log(`표본 뽑기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 나 = process.argv.find((a) => /^--me=/.test(a))?.split('=')[1] || '5';
  const n = Number(process.argv.find((a) => /^--n=/.test(a))?.split('=')[1] || 5);
  const 자리 = 자리들[나];
  if (!자리) {
    console.log(`⛔ 모르는 자리다: ${나}. 아는 것 — ${Object.keys(자리들).join(' · ')}`);
    process.exit(1);
  }
  if (!fs.existsSync(자리.방)) {
    console.log(`⛔ 글 방이 없다 — ${자리.방}`);
    console.log('   ⚠ 자리마다 방 이름이 다르면 이 파일 위쪽 「자리들」에 한 줄 고쳐 넣는다.');
    process.exit(1);
  }
  const 글들 = fs.readdirSync(자리.방).filter((f) => f.endsWith('.md')).map((f) => {
    const s = fs.readFileSync(`${자리.방}/${f}`, 'utf8').replace(/\r\n/g, '\n');
    const m = s.match(/^(?:pubDate|date|publishDate):\s*['"]?(\d{4}-\d{2}-\d{2})/m);
    return { slug: f.replace(/\.md$/, ''), 날짜: m ? m[1] : '?' };
  }).filter((x) => x.날짜 !== '?');
  if (!글들.length) { console.log(`⛔ 날짜가 붙은 글이 없다 — ${자리.방}`); process.exit(1); }

  const 뽑음 = 골고루(글들, n);
  console.log(`\n# ${나}번 ${자리.이름} — 구글에 물어볼 주소 ${뽑음.length}개 (글 ${글들.length}편에서 날짜별로)\n`);
  console.log('## 재는 법 — 한 줄');
  console.log('```');
  console.log('search.google.com/search-console  →  맨 위 검색칸에 주소 붙여넣고 Enter  →  20~40초 기다린다');
  console.log('```');
  console.log('\n## 화면이 셋 중 하나를 말한다 — ⛔ 셋을 뭉뚱그리지 않는다');
  console.log('```');
  console.log('「URL이 Google에 등록되어 있음」            → 색인됨.  대장에 **1**');
  console.log('「발견됨 - 현재 색인이 생성되지 않음」        → 구글이 알지만 아직 안 넣었다. 대장에 **0**');
  console.log('「Google에는 아직 알려지지 않은 URL입니다」   → 🔴 구글이 모른다. 대장에 **0** 이고 이건 기다려도 안 된다');
  console.log('                                            → 이때만 「색인 생성 요청」을 누른다(하루 10건쯤)');
  console.log('```');
  console.log('\n## 붙여넣을 주소');
  for (const g of 뽑음) console.log(`${g.날짜}  ${자리.앞}${g.slug}`);
  console.log('\n⚠ 잰 뒤 대장(docs/콘텐트-대장.tsv)의 구글 칸에 **색인된 수 / 잰 수** 로 적는다.');
  console.log('⛔ 안 재고 「0」으로 적지 않는다. 안 쟀으면 「?」다.');
  console.log('⭐ 오늘 5번이 잰 것 — 사흘 된 기사는 색인됨, 하루 된 기사는 「발견됨·색인 안 됨」.');
  console.log('   갈리는 것은 지면이 좋고 나쁨이 아니라 **나이**다. 그래서 날짜별로 뽑는다.');
}
