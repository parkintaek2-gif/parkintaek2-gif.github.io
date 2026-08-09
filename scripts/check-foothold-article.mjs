#!/usr/bin/env node
/**
 * 61편째(**두 번째는 쉽다**)가 자료와 맞나.
 *
 * ⛔ 이 자를 만든 까닭 — 오늘 이 기사를 쓰면서 **뒤집힌 다섯 나라 수를 손으로 지어냈다.**
 *    다섯 줄이 전부 틀렸고, 그중 미국은 실제로 **0%** 인데 1.8% 라고 적었다.
 *    ⭐ 그러니 이 자의 요점은 「표를 자료에서 옮겼나」다.
 * ⛔ 표는 **칸 자리**로 본다. 산문의 수는 **경계**로 본다(「436」 안의 43 에 안 뚫린다).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/the-second-time-is-easier.md';
const 자료길 = 'src/data/wikitip-foothold.json';
const 지면길 = 'src/pages/wikitip/foothold.astro';

/** ⛔ CRLF 를 먼저 누른다. 오늘 check-stale-numbers 가 이것 때문에 헛울었다 */
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
  자가('자리로 본다', 칸자리('| US | 0% | 2.4% |', 1, 0));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| US | 0% | 2.4% |', 1, 2.4));
  /* 🔴 오늘 나를 물린 자리 — 0% 를 「없다」로 넘기지 않는다 */
  자가('0% 를 읽는다', 칸자리('| US | 0% | 2.4% |', 1, 0));
  자가('자릿점 붙은 칸도 읽는다', 칸자리('| A | 16,025 |', 1, 16025));
  자가('436 안의 43 을 43 으로 안 읽는다', !낱수있나('436 series', 43));
  자가('낱낱의 수는 읽는다', 낱수있나('33.4% of countries', 33.4));
  console.log(`발판 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  if (!fs.existsSync(자료길)) { console.log(`⬜ 자료가 없다 — ${자료길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const w = d.withinTitle;
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(44)} ${값}`); };

  /* ── 회사 크기 띠 표. 칸 넷 ── */
  for (const b of d.byFirmSize) {
    const 줄들 = 표줄(본, b.band, 4);
    본다(`띠 ${b.band} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`띠 ${b.band} — 곳 수(2째)`, 칸자리(줄들[0], 1, b.firms), b.firms);
    본다(`띠 ${b.band} — 발판(3째)`, 칸자리(줄들[0], 2, b.withFootholdPc), `${b.withFootholdPc}%`);
    본다(`띠 ${b.band} — 없음(4째)`, 칸자리(줄들[0], 3, b.withoutFootholdPc), `${b.withoutFootholdPc}%`);
  }

  /* ── 🔴 뒤집힌 나라 표. 오늘 내가 다섯 줄을 다 지어낸 자리다 ── */
  const 뒤집힌 = d.byMarket.filter((m) => m.withFootholdPc <= m.withoutFootholdPc);
  본다('뒤집힌 나라 수를 적었나', 낱수있나(본, 뒤집힌.length), `${뒤집힌.length}곳`);
  for (const m of 뒤집힌) {
    const 줄들 = 표줄(본, m.iso2, 3);
    본다(`뒤집힘 ${m.iso2} — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`뒤집힘 ${m.iso2} — 발판(2째)`, 칸자리(줄들[0], 1, m.withFootholdPc), `${m.withFootholdPc}%`);
    본다(`뒤집힘 ${m.iso2} — 없음(3째)`, 칸자리(줄들[0], 2, m.withoutFootholdPc), `${m.withoutFootholdPc}%`);
  }

  /* ── 작품 안 표. 칸 넷 ── */
  {
    const ㄱ = 표줄(본, 'Countries where its company had already charted', 4);
    const ㄴ = 표줄(본, 'Countries where it had not', 4);
    본다('작품 안 — 발판 줄', ㄱ.length === 1, `줄 ${ㄱ.length}개`);
    본다('작품 안 — 없음 줄', ㄴ.length === 1, `줄 ${ㄴ.length}개`);
    if (ㄱ.length === 1) {
      본다('작품 안 — 오름', 칸자리(ㄱ[0], 1, w.withFoothold), w.withFoothold);
      본다('작품 안 — 기회', 칸자리(ㄱ[0], 2, w.withFootholdChances), w.withFootholdChances);
      본다('작품 안 — 몫', 칸자리(ㄱ[0], 3, w.withFootholdPc), `${w.withFootholdPc}%`);
    }
    if (ㄴ.length === 1) {
      본다('작품 안 — 없음 오름', 칸자리(ㄴ[0], 1, w.withoutFoothold), w.withoutFoothold);
      본다('작품 안 — 없음 기회', 칸자리(ㄴ[0], 2, w.withoutFootholdChances), w.withoutFootholdChances);
      본다('작품 안 — 없음 몫', 칸자리(ㄴ[0], 3, w.withoutFootholdPc), `${w.withoutFootholdPc}%`);
    }
  }

  /* ── 산문 ── */
  본다('견준 회사 수', 낱수있나(본, d.firmsCompared), d.firmsCompared);
  본다('뺀 회사 수', 낱수있나(본, d.firmsDroppedSingleWork), d.firmsDroppedSingleWork);
  본다('나라 수', 낱수있나(본, d.marketCount), d.marketCount);
  본다('주 수', 낱수있나(본, d.weeksSpanned), d.weeksSpanned);
  본다('읽은 줄', 낱수있나(본, d.rowsRead), d.rowsRead.toLocaleString('en-US'));
  본다('작품 안 짝 수', 낱수있나(본, w.titles), w.titles);
  본다('작품 안 차이(%p)', 낱수있나(본, w.liftPoints), `${w.liftPoints}%p`);
  본다('작품 안 배수', 낱수있나(본, w.liftTimes), `${w.liftTimes}배`);
  본다('날것 배수', 낱수있나(본, d.liftTimes), `${d.liftTimes}배`);
  본다('잰 나라 수', 낱수있나(본, d.marketsMeasured), d.marketsMeasured);
  본다('같은 방향 나라 수', 낱수있나(본, d.marketsMeasured - 뒤집힌.length), d.marketsMeasured - 뒤집힌.length);

  /* ⛔ 지켜야 할 말 */
  본다('회사끼리 안 견준다고 적었나',
    /never (?:made )?between two companies/i.test(민본)
      || /is ever made between two companies/i.test(민본), '회사 크기를 죽였다');
  본다('때를 죽였다고 적었나',
    /later series/i.test(민본) && /inside that single series/i.test(민본), '작품 안에서 견줬다');
  본다('나라를 죽였다고 적었나', /same Vietnam/i.test(민본), '나라 안에서 견줬다');
  본다('뒤집힌 곳을 안 숨겼나', /Five do not/i.test(민본), '다섯 곳을 냈다');
  본다('줄세우지 않는다고 적었나', /Alphabetical, not ranked/i.test(민본), '순위표 아님');
  본다('왜인지는 못 답한다고 적었나',
    /cannot tell you why/i.test(민본) && /symptom rather than a cause/i.test(민본), '까닭은 없다');
  본다('뺀 회사를 밝혔나', /absent from every figure/i.test(민본), '59곳은 어디에도 없다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/foothold'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/foothold"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
