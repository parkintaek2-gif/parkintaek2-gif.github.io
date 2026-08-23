#!/usr/bin/env node
/**
 * 53편째(**줄어든 게 아니라 옮겨 갔다**)가 자료와 맞나.
 *
 * ⛔ 표에 실은 시장은 **줄과 값을 묶어** 본다. 「본문 어딘가에 그 수가 있다」로는 못 잡는다 —
 *    2026-08-09 새벽에 51·52편째 자에서 깨뜨려 보고 두 번 겪었다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/it-moved-it-did-not-shrink.md';
const 자료길 = 'src/data/wikitip-where-it-moved.json';
const 지면길 = 'src/pages/wikitip/where-it-moved.astro';

export function 본문만(원문) {
  const 눌린 = 원문.replace(/\r\n/g, '\n');
  const 조각 = 눌린.split(/^---$/m);
  return (조각.length >= 3 ? 조각.slice(2).join('---') : 눌린).replace(/[*_]/g, '');
}

export function 받을꼴(v) {
  const 꼴 = new Set([String(v)]);
  const n = Number(v);
  if (Number.isFinite(n)) {
    꼴.add(String(n));
    if (Number.isInteger(n)) 꼴.add(n.toFixed(1));
    else 꼴.add(n.toFixed(2));
    /* 포인트 값은 부호를 빼고도 찾는다 — 표에 −21.4 로 적히기도 −21.4p 로 적히기도 한다 */
    꼴.add(String(Math.abs(n)));
  }
  return [...꼴];
}

export function 있나(글, v) { return 받을꼴(v).some((s) => 글.includes(s)); }

/** 마크다운 표에서 그 시장이 든 줄만 뽑는다 */
export function 시장줄(본문, 이름) {
  return 본문.split('\n').filter((l) => l.trim().startsWith(`| ${이름} |`));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('굵게를 뗀다', 본문만('---\na: 1\n---\n**−21.4p**').includes('21.4'));
  자가('부호를 빼고도 찾는다', 있나('fell 21.4p', -21.4));
  자가('없는 수는 없다', !있나('본문 12', 777));
  자가('시장 줄을 집는다', 시장줄('| Japan | 32.6% |\n| Other | 1 |', 'Japan').length === 1);
  자가('없는 시장은 빈 줄', 시장줄('| A | 1 |', 'Zed').length === 0);
  console.log(`옮겨 감 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 본 = 본문만(fs.readFileSync(기사길, 'utf8'));
  /* 🔴 산문은 **공백을 눌러서** 본다. 마크다운은 문장을 줄바꿈으로 끊는데,
     그러면 「not the same number\nof people」이 정규식에 안 걸린다.
     ⛔ 2026-08-08 에 영상 자 깨뜨리기가 같은 자리에서 안 울었다. 표는 줄로 보고 산문은 눌러서 본다. */
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(48)} ${값}`); };

  본다('견준 두 해', 있나(본, d.beforeYear) && 있나(본, d.afterYear), `${d.beforeYear} · ${d.afterYear}`);
  본다('주 수', 있나(본, d.beforeWeeks), `${d.beforeWeeks}주`);
  본다('시장 수', 있나(본, d.markets), d.markets);
  본다('아시아 열 평균', 있나(본, d.asianTen.meanChangePp), `${d.asianTen.meanChangePp}p`);
  /* 🔴 2026-08-23 — 이 자가 「하나도 안 올랐다」를 **박아 놓고** 있었다. 자료가 바뀌어 한 곳이
     올랐는데(안방인 한국이다) 자는 여전히 0을 요구했다. 기사를 사실대로 고치니 자가 울었다.
   ⛔ 자가 **옛 결론을 지키는 쪽**이 되면 안 된다. 잰 수를 그대로 요구하게 바꾼다.
   ⚠ 0이면 「Not one」을 요구한다 — 그때는 그 말이 사실이다. 0이 아니면 그 수를 적었나만 본다. */
  /* ⚠ 「Not one」을 글 아무 데서나 찾으면 안 된다. 기사에 「That is not one franchise ending」
     처럼 딴 뜻으로 쓰인 자리가 있다. **아시아 시장을 두고 한 말**만 본다. */
  본다('아시아 열에서 오른 곳',
    d.asianTen.roseCount === 0
      ? /Not one Asian market/i.test(본)
      : 있나(본, d.asianTen.roseCount) && !/Not one Asian market/i.test(본)
        && (!d.asianTen.homeMarket || 본.includes(d.asianTen.homeMarket.name) || /Korea itself/i.test(본)),
    `${d.asianTen.roseCount}곳`);
  본다('밖 평균', 있나(본, d.elsewhere.meanChangePp), `+${d.elsewhere.meanChangePp}p`);
  본다('밖에서 오른 곳', 있나(본, d.elsewhere.roseCount), d.elsewhere.roseCount);
  본다('밖 시장 수', 있나(본, d.elsewhere.markets), d.elsewhere.markets);

  /* 표에 실은 시장 — 몫·자리·작품 수를 **그 줄에서** 본다 */
  const 실은것 = [...d.topRisers, ...d.topFallers.slice(0, 6)];
  for (const x of 실은것) {
    const 줄 = 시장줄(본, x.name).join(' ');
    본다(`${x.name} — 표 줄`, 줄.length > 0, x.name);
    if (!줄) continue;
    본다(`${x.name} — ${d.beforeYear} 몫`, 받을꼴(x.beforePc).some((s) => 줄.includes(s)), `${x.beforePc}%`);
    본다(`${x.name} — ${d.afterYear} 몫`, 받을꼴(x.afterPc).some((s) => 줄.includes(s)), `${x.afterPc}%`);
    본다(`${x.name} — 자리 수`, 줄.includes(String(x.beforePlaces)) && 줄.includes(String(x.afterPlaces)),
      `${x.beforePlaces} → ${x.afterPlaces}`);
    본다(`${x.name} — 작품 수`, 줄.includes(String(x.beforeTitles)) && 줄.includes(String(x.afterTitles)),
      `${x.beforeTitles} → ${x.afterTitles}`);
  }

  /* ⛔ 지켜야 할 말 */
  본다('몫만으로 못 가른다고 적었나', /cannot separate|ratio can fall two ways|pushed them out/i.test(민본),
    '한국 것이 줄어서인지 남의 것이 늘어서인지');
  본다('반쪽 해를 뺐다고 적었나', /whole years|partial/i.test(민본), '2021·2026 은 반쪽이다');
  본다('작은 바닥 반론을 세웠나', /small bases|easier than holding/i.test(민본), '4% → 10% 가 쉽다는 반론');
  본다('까닭을 안 지어냈나', /does not say:? why|cannot separate|record what held/i.test(민본), '왜인지는 안 적는다');
  본다('사람 수가 아니라고 적었나', /not the same number of people/i.test(민본), '자리 하나는 사람 수가 아니다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/where-it-moved'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/where-it-moved"/m.test(fs.readFileSync(기사길, 'utf8').replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
