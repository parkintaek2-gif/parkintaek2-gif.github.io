#!/usr/bin/env node
/**
 * 62편째(**반 칸**)가 자료와 맞나.
 *
 * ⛔ 이 자의 요점 — **작은 수를 크게 적지 않았나.** 차이는 0.5 칸이다.
 *    「잡아먹는다」로만 쓰고 크기를 안 적으면 자료가 못 받치는 말을 판 것이다.
 * ⛔ 표는 **칸 자리**로 본다. 산문의 수는 **경계**로 본다.
 * ⛔ CRLF 를 먼저 누른다(오늘 check-stale-numbers 가 이것으로 헛울었다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/half-a-place.md';
const 자료길 = 'src/data/wikitip-siblings.json';
const 지면길 = 'src/pages/wikitip/siblings.astro';

export function 본문만(원문) {
  const 눌린 = String(원문).replace(/\r\n/g, '\n').replace(/−/g, '-');
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
  자가('CRLF 앞말도 뗀다', !본문만('---\r\ntitle: "9999"\r\n---\r\n본문 12').includes('9999'));
  자가('자리로 본다', 칸자리('| Weeks 1–2 | 272 | 5.1 |', 1, 272));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| Weeks 1–2 | 272 | 5.1 |', 1, 5.1));
  자가('소수 칸을 읽는다', 칸자리('| A | 0.5 |', 1, 0.5));
  /* ⛔ 5.71 안의 5.7 에 안 뚫린다 */
  자가('5.71 안의 5.7 을 5.7 로 안 읽는다', !낱수있나('rank 5.71 here', 5.7));
  자가('낱낱의 수는 읽는다', 낱수있나('difference of 0.5 of one place', 0.5));
  자가('자릿점 붙은 칸도 읽는다', 칸자리('| A | 22,529 |', 1, 22529));
  console.log(`형제 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  if (!fs.existsSync(자료길)) { console.log(`⬜ 자료가 없다 — ${자료길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(44)} ${값}`); };

  /* ── 나이 띠 표. 칸 다섯 ── */
  for (const b of d.byAge) {
    const 줄들 = 표줄(본, b.band, 5);
    본다(`띠 ${b.band} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`띠 ${b.band} — 짝(2째)`, 칸자리(줄들[0], 1, b.pairs), b.pairs);
    본다(`띠 ${b.band} — 혼자(3째)`, 칸자리(줄들[0], 2, b.aloneRank), b.aloneRank);
    본다(`띠 ${b.band} — 함께(4째)`, 칸자리(줄들[0], 3, b.withSiblingRank), b.withSiblingRank);
    본다(`띠 ${b.band} — 차이(5째)`, 칸자리(줄들[0], 4, b.difference), b.difference);
  }

  /* ── 첫 표. 칸 둘 ── */
  {
    const ㄱ = 표줄(본, 'On the weeks it was there alone', 2);
    const ㄴ = 표줄(본, 'On the weeks a series from the same company was also there', 2);
    const ㄷ = 표줄(본, 'Difference', 2);
    본다('첫 표 — 혼자 줄', ㄱ.length === 1 && 칸자리(ㄱ[0], 1, d.aloneRank), d.aloneRank);
    본다('첫 표 — 함께 줄', ㄴ.length === 1 && 칸자리(ㄴ[0], 1, d.withSiblingRank), d.withSiblingRank);
    본다('첫 표 — 차이 줄', ㄷ.length === 1 && 칸자리(ㄷ[0], 1, d.difference), d.difference);
  }

  /* ── 버린 것 표. 칸 둘 ── */
  for (const [이름, v] of [
    ['Chart rows read', d.rowsRead],
    ['Korean series rows with a company attached', d.koreanRowsWithCompany],
    ['Of those, rows with a sibling on the same chart', d.weeksWithASibling],
    ['Weeks discarded — no comparable week to match against', d.weeksDroppedNoMatchingAge],
    ['Pairs that survived', d.pairs],
  ]) {
    const 줄들 = 표줄(본, 이름, 2);
    본다(`버림표 ${이름.slice(0, 30)}`, 줄들.length === 1 && 칸자리(줄들[0], 1, v), v.toLocaleString('en-US'));
  }

  /* ── 산문 ── */
  본다('작품×나라 수', 낱수있나(본, d.titleMarketCellsCompared), d.titleMarketCellsCompared);
  본다('짝 수', 낱수있나(본, d.pairs), d.pairs);

  /* 🔴 이 자를 만든 까닭 — 작은 수를 크게 팔지 않았나 */
  본다('차이가 작다고 적었나',
    /half of one (?:rank|place)/i.test(민본) && /small/i.test(민본), `${d.difference}칸`);
  본다('나이를 왜 고정하는지 적었나',
    /rank falls as its run goes on/i.test(민본) && /weeks-in-top-10/i.test(민본), '세월과 형제를 가른다');
  본다('틀렸던 설계를 적었나',
    /205 pairs/.test(민본) && /strange/i.test(민본), '딱 맞춘 나이는 대표성이 없었다');
  본다('버린 것이 더 많다고 적었나',
    /Far more was discarded than kept/i.test(민본), '22,529 대 803');
  본다('까닭을 못 답한다고 적었나',
    /cannot tell you whether/i.test(민본) && /never publishes what was not watched/i.test(민본), '왜인지는 없다');
  본다('순위는 작을수록 좋다고 적었나', /Rank 1 is the top|higher number is worse|sits lower/i.test(민본), '부호를 뒤집어 안 읽게');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/siblings'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/siblings"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
