#!/usr/bin/env node
/**
 * 65편째(**한 주에 하나가 아니다**)가 자료와 맞나.
 *
 * ⛔ 이 자의 요점 — **우리 대표 수와 어긋나지 않았나.**
 *   이 기사는 7.7% 를 다시 읽는 글이라, 여기서 다른 수가 나가면 **같은 사이트가 두 말을 한다.**
 *   실제로 처음 셈에서 38,234 자리(7.8%)가 나왔고 대표 수는 37,750(7.7%)이었다.
 *   ⭐ 그래서 이 자는 두 자료 파일을 **맞대 본다.**
 * ⛔ 표는 칸 자리로, 산문의 수는 경계로 본다. CRLF 를 먼저 누른다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/not-one-a-week.md';
const 자료길 = 'src/data/wikitip-clumping.json';
const 대표길 = 'src/data/wikitip-world-share.json';
const 지면길 = 'src/pages/wikitip/clumping.astro';

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

export function 칸값(칸) {
  return 칸.replace(/\s*\(.*$/, '').replace(/[%×x]$/i, '').replace(/,/g, '').trim();
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
  자가('자리로 본다', 칸자리('| 0 | 59.1% | 45.1% |', 1, 59.1));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| 0 | 59.1% | 45.1% |', 1, 45.1));
  /* ⛔ 「0.0%」를 「없다」로 안 넘긴다 — 이 기사에서 그 칸이 요점이다 */
  자가('0.0% 를 읽는다', 칸자리('| 9 | 0.1% | 0.0% |', 2, 0));
  자가('자릿점 붙은 수를 읽는다', 낱수있나('37,750 places', 37750));
  /* ⛔ 59.1 안의 59 에 안 뚫린다 */
  자가('59.1 을 59 로 안 읽는다', !낱수있나('59.1% of country-weeks', 59));
  자가('낱낱의 수는 읽는다', 낱수있나('59.1% of country-weeks', 59.1));
  console.log(`몰림 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  if (!fs.existsSync(자료길)) { console.log(`⬜ 자료가 없다 — ${자료길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(42)} ${값}`); };

  /* ── 🔴 이 자를 만든 까닭 — 대표 수와 맞나 ── */
  if (fs.existsSync(대표길)) {
    const w = JSON.parse(fs.readFileSync(대표길, 'utf8'));
    본다('🔴 대표 수와 자리가 같나', d.koreanPlaces === w.koreanSlots,
      `${d.koreanPlaces.toLocaleString('en-US')} vs 대표 ${w.koreanSlots.toLocaleString('en-US')}`);
    본다('🔴 대표 수와 몫이 같나', d.worldSharePc === w.worldPc, `${d.worldSharePc}% vs 대표 ${w.worldPc}%`);
    본다('전체 자리도 같나', d.allPlaces === w.totalSlots,
      `${d.allPlaces.toLocaleString('en-US')} vs ${w.totalSlots.toLocaleString('en-US')}`);
  } else {
    본다('대표 수 파일이 있나', false, '⬜ 못 쟀다');
  }

  /* ── 있나 없나 표. 칸 둘 ── */
  {
    /* 🔴 2026-08-10 — 여기에 **7.7% 가 박혀 있었다.** 규칙이 바뀌어 7.6% 가 되자
       자물쇠가 기사를 못 찾아 섰다. 자가 낡으면 기사가 맞아도 선다.
       ⛔ 대표 수는 자료에서 읽는다. 자에 손으로 적지 않는다. */
    const ㄱ = 표줄(본, `If the same ${d.worldSharePc}% fell independently`, 2);
    const ㄴ = 표줄(본, 'Actually observed', 2);
    본다('고른 경우', ㄱ.length === 1 && 칸자리(ㄱ[0], 1, d.evenAnyPc), `${d.evenAnyPc}%`);
    본다('실제', ㄴ.length === 1 && 칸자리(ㄴ[0], 1, d.observedAnyPc), `${d.observedAnyPc}%`);
  }

  /* ── 분포 표. 칸 셋 ── */
  for (const x of d.distribution.filter((v) => v.cells > 0 && v.korean <= 9)) {
    const 줄들 = 표줄(본, String(x.korean), 3);
    본다(`분포 ${x.korean}칸 — 줄`, 줄들.length === 1, `줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    본다(`분포 ${x.korean}칸 — 실제`, 칸자리(줄들[0], 1, x.observedPc), `${x.observedPc}%`);
    본다(`분포 ${x.korean}칸 — 고르게`, 칸자리(줄들[0], 2, x.evenPc), `${x.evenPc}%`);
  }

  /* ── 산문 ── */
  본다('대표 몫', 낱수있나(본, d.worldSharePc), `${d.worldSharePc}%`);
  본다('한국 자리', 낱수있나(본, d.koreanPlaces), d.koreanPlaces.toLocaleString('en-US'));
  본다('칸 수', 낱수있나(본, d.cellsMeasured), d.cellsMeasured.toLocaleString('en-US'));
  본다('시장 수', 낱수있나(본, d.marketsMeasured), d.marketsMeasured);
  본다('몰린 시장 수', 낱수있나(본, d.marketsMoreClumpedThanEven), d.marketsMoreClumpedThanEven);
  본다('최소 주', 낱수있나(본, d.minimumWeeks), `${d.minimumWeeks}주`);
  {
    const 차 = +(d.evenAnyPc - d.observedAnyPc).toFixed(1);
    본다('두 수의 차이', 낱수있나(본, Math.round(차)) || 낱수있나(본, 차), `${차}%p`);
  }

  /* ⛔ 지켜야 할 말 */
  본다('대표 수가 안 틀렸다고 적었나',
    new RegExp(`Nothing about the ${String(d.worldSharePc).replace('.', '\\.')}% itself`, 'i')
      .test(민본) && /it is correct/i.test(민본), '수는 맞다');
  본다('대조군이 무엇인지 적었나',
    /what unclumped would look like/i.test(민본), '이항으로 견줬다');
  본다('한두 시장 탓이 아니라고 적었나',
    /They are not/i.test(민본) && /its own Korean share/i.test(민본), '93곳 중 80곳');
  본다('우리 셈의 한계를 적었나',
    /a floor rather than a precise counterfactual/i.test(민본), '연속된 주는 독립이 아니다');
  본다('까닭을 못 답한다고 적었나',
    /cannot say why the places arrive together/i.test(민본), '왜인지는 없다');
  본다('평균이 못 하는 일을 적었나',
    /a statement about a total/i.test(민본), '총계지 보통 주가 아니다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/clumping'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/clumping"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
