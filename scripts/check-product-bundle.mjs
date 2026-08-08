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

  /* ── ④ 라이선스가 안 끝났으면 **파일을 열지 못하게 막는다** ──
     2026-08-08. 라이선스 대장에서 Netflix Tudum 재배포 조건이 ⬜ 미확인이다.
     지금은 한 벌이 `docs/` 안에만 있어 손님이 못 받는다 — 그래서 안전하다.
     ⛔ 위험한 것은 **다음 사람이 그 사정을 모르고 파일을 웹으로 여는 것**이다.
        「라이선스는 받기 전에 본다」를 사람 기억에 맡기지 않고 여기서 막는다.
     ⚠ 확인이 끝나 대장이 🟢 가 되면 이 규칙은 저절로 풀린다 — 대장을 읽어서 판단한다. */
  {
    const 대장길 = 'docs/데이터-라이선스-대장.md';
    const 대장 = fs.existsSync(대장길) ? fs.readFileSync(대장길, 'utf8') : '';
    const 넷플릭스줄 = 대장.split('\n').find((l) => /^\|\s*Netflix Top10/.test(l)) ?? '';
    const 안끝남 = !넷플릭스줄 || /⬜|🔴/.test(넷플릭스줄);
    /* 웹으로 나가는 자리 — public/ 과 라우트. 여기에 한 벌 CSV 이름이 있으면 열린 것이다. */
    const 웹자리 = ['public', 'src/pages/wikitip'];
    const 넷플릭스표 = ['korean-title-panel.csv', 'cast-title-join.csv'];
    if (안끝남) {
      for (const d of 웹자리) {
        if (!fs.existsSync(d)) continue;
        const 안 = fs.readdirSync(d, { recursive: true }).map(String);
        for (const 표 of 넷플릭스표) {
          if (안.some((f) => f.includes(표) || f.includes(표.replace('.csv', '.csv.ts')))) {
            넘음.push(`⛔ ${d} 에 «${표}» 가 있다 — 대장의 Netflix 재배포 조건이 아직 안 끝났다(${넷플릭스줄.trim().slice(0, 60)})`);
          }
        }
      }
      /* 지면이 「내려받으라」고 말하고 있지도 않아야 한다 */
      const 데이터지면 = 'src/pages/wikitip/data.astro';
      if (fs.existsSync(데이터지면)) {
        const g = fs.readFileSync(데이터지면, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
        if (/download the files|Download the bundle|href="[^"]*\.csv"/i.test(g)) {
          넘음.push('⛔ /data 가 파일을 내려받게 한다 — 대장의 Netflix 조건이 아직 안 끝났다');
        }
        if (!/still being confirmed|not offering the files/i.test(g)) {
          넘음.push('/data 가 「파일은 아직 안 연다」는 까닭을 말하지 않는다. 안 적으면 손님이 그냥 없는 줄 안다');
        }
      }
    }
  }

  /* ── ⑤ **넷플릭스 없는 한 벌**이 정말 없는가 ──
     2026-08-08. 라이선스 확인을 기다리느라 팔 수 있는 것까지 묶어 두지 않으려고 두 번째 벌을 냈다.
     ⛔ 그 벌의 값은 「넷플릭스가 하나도 안 들었다」는 약속뿐이다. **약속이 깨지면 물건이 없다.**
     ⚠ 만들면서 내가 한 번 걸렸다 — K팝 표의 `also_on_screen_actor_roster` 열이
        넷플릭스가 고른 명단에서 나온다. 파일만 보고 **열은 안 봤다.** 그래서 열 이름도 본다. */
  {
    const OUT2 = 'docs/상품안/본보기-한벌-넷플릭스없이';
    if (fs.existsSync(OUT2)) {
      const 금칙열 = ['korea_chart_weeks', 'review_queue', 'attribution', 'countries_reached',
        'weeks_on_chart', 'peak_rank', 'also_on_screen_actor_roster', 'title'];
      const 금칙파일 = ['korean-title-panel.csv', 'cast-title-join.csv', 'provenance.csv'];
      const 안 = fs.readdirSync(OUT2);
      for (const f of 금칙파일) {
        if (안.includes(f)) 넘음.push(`⛔ 넷플릭스 없는 벌에 «${f}» 가 있다 — 그 벌의 약속이 깨진다`);
      }
      for (const f of 안.filter((x) => x.endsWith('.csv') && x !== 'columns.csv' && x !== 'corrections.csv')) {
        const 열들 = 머리(fs.readFileSync(path.join(OUT2, f), 'utf8'));
        for (const c of 열들) {
          if (금칙열.includes(c)) 넘음.push(`⛔ 넷플릭스 없는 벌 ${f} 에 «${c}» 열이 있다 — 그 값은 넷플릭스가 고른 명단에서 온다`);
        }
      }
      const r2 = 안.includes('README.md') ? fs.readFileSync(path.join(OUT2, 'README.md'), 'utf8') : '';
      if (!/no chart licence question|not derived from Netflix/i.test(r2)) {
        넘음.push('넷플릭스 없는 벌의 README 가 「왜 따로 있나」를 말하지 않는다');
      }
      if (/\$[0-9]|₩[0-9]/.test(r2)) 넘음.push('넷플릭스 없는 벌 README 에 값이 적혀 있다');
    }
  }

  /*
   * ⑥ 값. **2026-08-08 16:0x 에 정해졌다**(2번 15:5x · 사장님이 우리에게 맡기셨다).
   *    그전까지 이 자리는 「값이 적혀 있으면 선다」였다. 지시가 바뀌었으니 자도 뒤집는다 —
   *    ⛔ README 에 값을 적으려면 **소스와 같은 값**이어야 한다. 손으로 적어 어긋나면 선다.
   *    ⛔ 넷플릭스 없는 한 벌에는 여전히 값이 없다. 거기 값이 적히면 선다.
   * ⚠ 소스를 여기서 읽는다. 자에 값을 손으로 박으면 **자와 지면이 어긋날 자리를 하나 더 만드는 것**이다.
   */
  {
    const 소스 = fs.readFileSync('src/data/wikitip-price.ts', 'utf8');
    const 옳은값 = [...소스.matchAll(/^export const (?:ONE_OFF_USD|MONTHLY_USD) = (\d+);/gm)]
      .map((m) => `$${m[1]}`);
    if (옳은값.length !== 2) 넘음.push('src/data/wikitip-price.ts 에서 값을 못 읽었다 — 자가 무엇과 맞출지 모른다');
    const 적힌값 = [...new Set(readme.match(/\$\d+/g) ?? [])];
    const 틀린값 = 적힌값.filter((v) => !옳은값.includes(v));
    if (틀린값.length) {
      넘음.push(`README 의 값 ${틀린값.join(', ')} 이 소스(${옳은값.join(' · ')})와 다르다`);
    }
  }

  if (넘음.length) {
    console.log(`\n⛔ 한 벌 검사 — ${넘음.length}건`);
    for (const s of 넘음) console.log(`   · ${s}`);
    process.exit(1);
  }
  console.log(`✅ 한 벌 검사 — 파일 ${파일들.length}개 · 표 ${열지도.size}개 · 열 ${모든열.size}가지가 다 사전에 있다`);
  console.log('   거른 자 둘(이름 · 한국 차트)이 소개 글과 표에 **둘 다** 있다 · 값은 안 적혀 있다');
}
