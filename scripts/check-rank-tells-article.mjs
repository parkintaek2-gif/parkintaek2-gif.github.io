#!/usr/bin/env node
/**
 * 64편째(**자리가 못 말하는 것**)가 자료와 맞나.
 *
 * ⛔ 이 자의 요점 — **우리에게 불리한 수를 지우지 않았나.**
 *   이 기사는 우리가 파는 물건(순위)이 시청을 절반쯤밖에 못 말한다고 적는다.
 *   그 줄이 빠지거나 무뎌지면 자가 선다.
 * ⛔ 표는 칸 자리로, 산문의 수는 경계로 본다. CRLF 를 먼저 누른다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/what-a-position-does-not-say.md';
const 자료길 = 'src/data/wikitip-rank-tells.json';
const 지면길 = 'src/pages/wikitip/rank-tells.astro';

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
    return new RegExp(`(?<![0-9.,])${뭉갠}(?![0-9.,]?[0-9])`).test(글);
  });
}

export function 칸들(줄) {
  return 줄.split('|').map((c) => c.trim()).filter((c) => c !== '');
}

/** ⚠ `×` 와 `m`(백만) 꼬리를 뗀다 — 이 기사 표에만 있는 단위다 */
export function 칸값(칸) {
  return 칸.replace(/\s*\(.*$/, '').replace(/[%×xm]$/i, '').replace(/,/g, '').trim();
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
  /* ⚠ 이 기사 표에만 있는 두 단위 */
  자가('× 꼬리를 뗀다', 칸자리('| A | 5.94× |', 1, 5.94));
  자가('m(백만) 꼬리를 뗀다', 칸자리('| A | 42.4m |', 1, 42.4));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| A | 5.94× | 2.19× |', 1, 2.19));
  자가('0 을 읽는다', 칸자리('| A | 493,600 | 0 |', 2, 0));
  /* ⛔ 45.8 안의 45 에 안 뚫린다 */
  자가('45.8 을 45 로 안 읽는다', !낱수있나('narrowed by 45.8%', 45));
  자가('낱낱의 수는 읽는다', 낱수있나('narrowed by 45.8%', 45.8));
  console.log(`자리 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  if (!fs.existsSync(자료길)) { console.log(`⬜ 자료가 없다 — ${자료길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');
  const 몫 = (c) => d.narrowing.find((x) => x.chart === c).narrowedPc;
  const 한국차트 = d.byChart.find((c) => c.chart === 'TV (Non-English)');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(42)} ${값}`); };

  /* ── 줄 수 표. 칸 셋 ── */
  {
    const ㄱ = 표줄(본, 'Per-country weekly lists', 3);
    const ㄴ = 표줄(본, 'Global weekly lists', 3);
    본다('나라 줄 — 수', ㄱ.length === 1 && 칸자리(ㄱ[0], 1, d.countryRowsRead), d.countryRowsRead.toLocaleString('en-US'));
    /* 🔴 이 칸이 이 기사의 심장이다 — 0 이다 */
    본다('나라 줄 — 시청 칸 0', ㄱ.length === 1 && 칸자리(ㄱ[0], 2, d.countryRowsWithViewing), d.countryRowsWithViewing);
    본다('세계 줄 — 수', ㄴ.length === 1 && 칸자리(ㄴ[0], 1, d.globalRowsRead), d.globalRowsRead.toLocaleString('en-US'));
    본다('세계 줄 — 시청 칸', ㄴ.length === 1 && 칸자리(ㄴ[0], 2, d.globalRowsWithViewing), d.globalRowsWithViewing.toLocaleString('en-US'));
  }

  /* ── 좁힘 표. 칸 넷 ── */
  for (const c of d.byChart) {
    const 줄들 = 표줄(본, c.chart, 4).filter((l) => 칸들(l)[1].includes('×'));
    본다(`좁힘 ${c.chart} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`좁힘 ${c.chart} — 모를 때`, 칸자리(줄들[0], 1, c.allSpread), `${c.allSpread}×`);
    본다(`좁힘 ${c.chart} — 알 때`, 칸자리(줄들[0], 2, c.withinRankSpread), `${c.withinRankSpread}×`);
    본다(`좁힘 ${c.chart} — 몫`, 칸자리(줄들[0], 3, 몫(c.chart)), `${몫(c.chart)}%`);
  }

  /* ── 1위/10위 표. 칸 넷 ── */
  for (const c of d.byChart) {
    const 줄들 = 표줄(본, c.chart, 4).filter((l) => 칸들(l)[1].endsWith('m'));
    본다(`위아래 ${c.chart} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`위아래 ${c.chart} — 배수`, 칸자리(줄들[0], 3, c.topOverTenth), `${c.topOverTenth}×`);
  }

  /* ── 산문 ── */
  본다('주 수', 낱수있나(본, d.weeksSpanned), d.weeksSpanned);
  본다('한국 차트 남은 흩어짐', 낱수있나(본, 한국차트.withinRankSpread), `${한국차트.withinRankSpread}×`);
  본다('한국 차트 좁힘 몫', 낱수있나(본, 몫('TV (Non-English)')), `${몫('TV (Non-English)')}%`);

  /* 🔴 이 자를 만든 까닭 — 불리한 말을 지우지 않았나 */
  본다('시청 칸이 0 이라고 적었나',
    /Zero is not a sample problem/i.test(민본), '0줄');
  본다('우리 차트가 제일 못 말한다고 적었나',
    /The last row is ours/i.test(민본) && /least of the four/i.test(민본), 'TV (Non-English)');
  본다('불리한 것을 우리가 먼저 낸다고 적었나',
    /publishing our own weak spot/i.test(민본), '숨기지 않는다');
  본다('순위가 쓸모없다고는 안 했나',
    /A rank is not nothing/i.test(민본) && /never inverts/i.test(민본), '깎되 뭉개지 않는다');
  본다('나라로 못 옮긴다고 적었나',
    /cannot be measured from anything Netflix releases/i.test(민본), '세계≠나라');
  본다('자리 몫이라 적어 온 까닭을 밝혔나',
    /statement about places/i.test(민본), '7.7% 는 자리다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/rank-tells'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/rank-tells"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
