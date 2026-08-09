#!/usr/bin/env node
/**
 * 60편째(**우리 대표 수의 얼마가 확인된 것인가**)가 자료와 맞나.
 *
 * ⛔ 이 기사는 **우리 자신에 관한 것**이라 더 조인다 —
 *   수가 틀리면 「우리는 정직하다」는 글이 그 자리에서 거짓이 된다.
 * ⛔ 표는 칸 자리로, 산문의 수는 경계로 본다(오늘 세운 두 규칙).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/how-much-of-our-own-number-is-checked.md';
const 자료길 = 'src/data/wikitip-world-share.json';
const 딱지길 = 'src/data/wikitip-reach.json';
const 지면길 = 'src/pages/wikitip/world-share.astro';

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
  return 칸.replace(/\s*\(.*$/, '').replace(/[%p]$/, '').replace(/,/g, '').trim();
}

export function 표줄(본문, 이름, 칸수) {
  return 본문.split('\n')
    .filter((l) => l.trim().startsWith(`| ${이름} |`))
    .filter((l) => 칸들(l).length === 칸수);
}

export function 칸자리(줄, n, v) {
  const c = 칸들(줄);
  if (n >= c.length) return false;
  return 받을꼴(v).map((s) => s.replace(/,/g, '')).includes(칸값(c[n]));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('자리로 본다', 칸자리('| A | 31,143 | 82.5% |', 1, 31143));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| A | 31,143 | 82.5% |', 1, 82.5));
  자가('표를 칸 수로 가른다', 표줄('| A | 1 |\n| A | 1 | 2 |', 'A', 2).length === 1);
  자가('16.1 안의 16 을 16 으로 안 읽는다', !낱수있나('rests on 16.1% of places', 16));
  자가('낱낱의 수는 읽는다', 낱수있나('rests on 16.1% of places', 16.1));
  console.log(`확인 갈래 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const c = d.confirmation;
  const r = JSON.parse(fs.readFileSync(딱지길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(46)} ${값}`); };

  /* ── 갈래 표. 칸 셋 ── */
  const 갈래 = [
    ["Carry Netflix's Non-English label — checked", c.labelledSlots, c.labelledPc],
    ['No label at all — kept because we could not check', c.unlabelledSlots, c.unlabelledPc],
    ['Label says both — the name is on an English chart too', c.bothSlots, c.bothPc],
  ];
  for (const [이름, n, pc] of 갈래) {
    const 줄들 = 표줄(본, 이름, 3);
    본다(`${이름.slice(0, 24)} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`${이름.slice(0, 24)} — 자리(2째)`, 칸자리(줄들[0], 1, n), n.toLocaleString('en-US'));
    본다(`${이름.slice(0, 24)} — 몫(3째)`, 칸자리(줄들[0], 2, pc), `${pc}%`);
  }
  /* ⛔ 셋을 더하면 전체여야 한다 — 기사가 그렇게 읽히므로 여기서도 본다 */
  본다('셋의 합이 전체와 같나',
    c.labelledSlots + c.unlabelledSlots + c.bothSlots === d.koreanSlots,
    `${c.labelledSlots}+${c.unlabelledSlots}+${c.bothSlots} = ${d.koreanSlots}`);

  /* ── 산문 ── */
  본다('대표 몫', 낱수있나(본, d.worldPc), `${d.worldPc}%`);
  본다('한국 자리', 낱수있나(본, d.koreanSlots), d.koreanSlots.toLocaleString('en-US'));
  본다('전체 자리', 낱수있나(본, d.totalSlots), d.totalSlots.toLocaleString('en-US'));
  본다('시장 수', 낱수있나(본, d.countryCount), d.countryCount);
  본다('딱지 없는 작품 수', 낱수있나(본, r.unlabelledTitles), r.unlabelledTitles);
  본다('열쇠 있는 몫', 낱수있나(본, c.keyedPc), `${c.keyedPc}%`);
  본다('열쇠 없는 자리', 낱수있나(본, c.unkeyedSlots), c.unkeyedSlots);
  본다('열쇠 없는 몫', 낱수있나(본, c.unkeyedPc), `${c.unkeyedPc}%`);

  /* ⛔ 지켜야 할 말 — 이 기사는 이것이 본체다 */
  본다('편수가 틀린 단위라고 적었나',
    /wrong unit/i.test(민본) && /sounds like a rounding error/i.test(민본), '197편은 작아 보인다');
  본다('안 뺐다고 적었나',
    /did not remove/i.test(민본) && /smaller without being truer/i.test(민본), '수를 예쁘게 안 만들었다');
  본다('두 자가 서로를 안 덮는다고 적었나',
    /Neither check is a superset/i.test(민본), '둘 다 낸다');
  본다('어디서 왔는지 밝혔나',
    /It came from another desk/i.test(민본) && /369 withdrawn workplaces/i.test(민본), '옆자리에서 배웠다');
  본다('침묵이 둘이라고 적었나', /two silences/i.test(민본), '버리는 쪽과 들이는 쪽');
  본다('7.7% 를 계속 낸다고 적었나', /did not stop publishing/i.test(민본), '수를 안 내리지 않는다');

  본다('걸린 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 지면으로 가는 길을 가졌나', 본.includes('/world-share'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/world-share"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
