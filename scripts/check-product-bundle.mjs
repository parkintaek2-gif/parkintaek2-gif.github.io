/**
 * 파는 한 벌이 **소개 글에 적은 대로 되어 있나** 검사한다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08. 2번 지시: 「값을 매기기 전에 이게 먼저 끝나야 합니다. 사는 쪽이 기업이면
 * 『이 명단이 무엇으로 걸러졌나』를 묻습니다. 한 벌 소개 글에 **거른 자가 둘이라는 것**을 적으십시오」
 *
 * 적는 것은 쉽다. **적어 놓고 표에 그 열이 없는 것**이 무섭다.
 * 소개 글은 사람이 쓰고 표는 기계가 낸다 — 둘은 조용히 갈라진다.
 * 여기서 보는 것은 딱 하나다. **README 가 약속한 것이 CSV 에 실제로 있나.**
 *
 * ⛔ 값이 맞는지는 안 본다(그건 지면 검사 몫이다). **약속과 물건이 같은가**만 본다.
 *
 * 쓰는 법: node scripts/check-product-bundle.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'docs/상품안/본보기-한벌';

/** CSV 머리줄을 읽는다. 따옴표 없는 단순 머리줄만 쓴다 — 우리가 내는 표가 그렇다. */
export function 머리(글) {
  return 글.split('\n')[0].split(',').map((s) => s.trim());
}

/** README 가 백틱으로 약속한 열·파일 이름을 전부 뽑는다. */
export function 약속(readme) {
  return [...new Set([...readme.matchAll(/`([a-z0-9_.\-]+)`/g)].map((m) => m[1]))];
}

if (process.argv[1] && process.argv[1].endsWith('check-product-bundle.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('머리줄을 가른다', JSON.stringify(머리('a,b,c\n1,2,3')) === '["a","b","c"]');
  자가('백틱 이름을 뽑는다', JSON.stringify(약속('see `review_queue` and `columns.csv`')) === '["review_queue","columns.csv"]');
  자가('같은 이름을 두 번 안 센다', 약속('`a` and `a`').length === 1);
  자가('본문 말은 안 뽑는다', 약속('two rulers, not one').length === 0);
  console.log(`한 벌 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 넘음 = [];
  if (!fs.existsSync(OUT)) { console.error(`⛔ ${OUT} 이 없다 — node scripts/build-product-bundle.mjs 를 먼저 돌린다`); process.exit(1); }
  const readme = fs.readFileSync(path.join(OUT, 'README.md'), 'utf8');
  const 파일들 = fs.readdirSync(OUT);
  const 열지도 = new Map();
  for (const f of 파일들.filter((x) => x.endsWith('.csv'))) {
    열지도.set(f, 머리(fs.readFileSync(path.join(OUT, f), 'utf8')));
  }
  const 모든열 = new Set([...열지도.values()].flat());

  /* ① README 가 백틱으로 부른 것이 실제로 있나 — 파일이거나, 열이거나, **표 안의 값**이거나.
     ⚠ 처음엔 「열이 아니면 틀렸다」고 봤다가 `shared`·`one-country-only` 에서 헛울었다.
       그건 열 이름이 아니라 **칸에 든 값**이다. 소개 글은 값도 부른다. 잣대를 넓혔다. */
  const 모든값 = new Set();
  for (const f of 열지도.keys()) {
    for (const l of fs.readFileSync(path.join(OUT, f), 'utf8').split('\n').slice(1)) {
      for (const c of l.split(',')) 모든값.add(c.replace(/^"|"$/g, '').trim());
    }
  }
  for (const 이름 of 약속(readme)) {
    if (이름.endsWith('.csv') || 이름.endsWith('.md')) {
      if (!파일들.includes(이름)) 넘음.push(`README 가 «${이름}» 를 부르는데 한 벌에 그 파일이 없다`);
    } else if (!모든열.has(이름) && !모든값.has(이름)) {
      넘음.push(`README 가 «${이름}» 를 부르는데 어느 표에도 그런 열도 값도 없다`);
    }
  }

  /* ② 거른 자가 둘이라는 약속 — 이름 자와 한국 차트 자가 **둘 다** 표에 있어야 한다 */
  const 패널 = 열지도.get('korean-title-panel.csv');
  if (!패널) {
    넘음.push('작품 패널이 한 벌에 없다');
  } else {
    for (const [열, 무엇] of [['attribution', '이름으로 가른 자'], ['korea_chart_weeks', '한국 차트로 가른 자'],
      ['review_queue', '손으로 볼 차례'], ['top_country', '어느 나라에 몰렸나']]) {
      if (!패널.includes(열)) 넘음.push(`패널에 «${열}»(${무엇})가 없다. 소개 글이 자가 둘이라고 적는다`);
    }
  }
  if (!/two rulers, not one/i.test(readme)) 넘음.push('README 가 「자가 둘」이라고 말하지 않는다 (2번 지시 2026-08-08)');
  if (!/Nothing has been removed on/i.test(readme)) {
    넘음.push('README 가 「두 번째 자로 아무것도 안 뺐다」고 말하지 않는다. 안 적으면 사는 쪽이 걸러진 명단으로 읽는다');
  }

  /* ③ 사전이 모든 표의 모든 열을 덮나 — 새 열을 넣고 뜻을 안 적는 것을 막는다 */
  const 사전 = fs.existsSync(path.join(OUT, 'columns.csv'))
    ? fs.readFileSync(path.join(OUT, 'columns.csv'), 'utf8').split('\n').slice(1)
      .map((l) => l.split(',').slice(0, 2).map((s) => s.replace(/^"|"$/g, '')))
    : null;
  if (!사전) 넘음.push('columns.csv 가 없다');
  else {
    const 적힌 = new Set(사전.map(([f, c]) => `${f}·${c}`));
    for (const [f, 열들] of 열지도) {
      if (f === 'columns.csv') continue;
      for (const c of 열들) if (!적힌.has(`${f}·${c}`)) 넘음.push(`${f} 의 «${c}» 열이 columns.csv 에 없다`);
    }
  }

  /* ④ 값은 아직 안 적혀 있어야 한다 — 사장님 판단 전이다 */
  if (/\bUSD|\$[0-9]|₩[0-9]|원\/월|price:/i.test(readme)) {
    넘음.push('README 에 값이 적혀 있다. 값은 사장님 판단이고 아직 안 나왔다');
  }

  if (넘음.length) {
    console.log(`\n⛔ 한 벌 검사 — ${넘음.length}건`);
    for (const s of 넘음) console.log(`   · ${s}`);
    process.exit(1);
  }
  console.log(`✅ 한 벌 검사 — 파일 ${파일들.length}개 · 표 ${열지도.size}개 · 열 ${모든열.size}가지가 다 사전에 있다`);
  console.log('   거른 자 둘(이름 · 한국 차트)이 소개 글과 표에 **둘 다** 있다 · 값은 안 적혀 있다');
}
