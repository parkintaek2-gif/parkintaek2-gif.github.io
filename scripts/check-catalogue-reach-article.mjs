#!/usr/bin/env node
/**
 * 57편째(**스무 번째 작품도 더 멀리 안 간다**)가 자료와 맞나.
 *
 * ⛔ 값은 **칸 자리**로 본다(56편째에서 배운 것). 같은 줄에 같은 수가 두 번 있어도 안 뚫린다.
 * ⛔ 산문의 수는 **그 문단 안에서만** 찾는다 — 10.8 이 표에도 등급 문단에도 나온다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사길 = 'content/kculturewire/the-twentieth-title-travels-no-further.md';
const 자료길 = 'src/data/wikitip-catalogue-reach.json';
const 지면길 = 'src/pages/wikitip/catalogue-reach.astro';

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

export function 있나(글, v) { return 받을꼴(v).some((s) => 글.includes(s)); }

/**
 * **낱낱의 수로** 있나 — 앞뒤에 숫자가 붙어 있으면 아니다.
 *
 * 🔴 2026-08-09 08:3x — 이 자를 깨뜨려 보다가 잡았다. 한 편짜리 절의 「3」을 「4」로 바꿔도
 *   안 울었다. 같은 절의 **「39」 안에 3 이 들어 있어서**다.
 * ⛔ 표는 56편째에서 칸으로 막았는데 **산문은 안 막았다.** 같은 병을 여섯 번째 만난다.
 *   이제 산문의 수는 전부 이 함수로 본다.
 */
export function 낱수있나(글, v) {
  return 받을꼴(v).some((s) => {
    const 뭉갠 = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    /*
     * 앞  — 숫자나 소수점이 붙어 있으면 그 수의 조각이다(10.8 안의 8)
     * 뒤  — 숫자가 붙거나 **소수점 뒤에 숫자**가 오면 조각이다(39 안의 3 · 11.1 안의 11)
     * ⛔ 문장 끝 마침표는 조각이 아니다. 처음엔 「.」를 통째로 막아 「reached 87.」을
     *   **못 읽었다** — 성한 문장 셋을 잡았다.
     */
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

/**
 * `##` 절 하나를 떼어 낸다.
 *
 * ⛔ 산문의 수를 글 전체에서 찾으면 **다른 절의 같은 수**에 걸린다.
 *   10.8 은 표에도 있고 등급 문단에도 있다 — 자리를 좁히지 않으면 자가 거짓을 답한다.
 */
export function 절(본문, 머리조각) {
  const 줄 = 본문.split('\n');
  const i = 줄.findIndex((l) => l.startsWith('## ') && l.includes(머리조각));
  if (i < 0) return '';
  const j = 줄.findIndex((l, k) => k > i && l.startsWith('## '));
  return 줄.slice(i, j < 0 ? undefined : j).join('\n');
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('앞말을 뗀다', !본문만('---\ntitle: "9999"\n---\n본문 12').includes('9999'));
  자가('빼기표를 하이픈으로', 본문만('---\na: 1\n---\nr = −0.101').includes('-0.101'));
  자가('자리로 본다', 칸자리('| 2 titles | 28 | 10.8 |', 1, 28));
  자가('값이 있어도 자리가 다르면 아니다', !칸자리('| 2 titles | 28 | 10.8 |', 1, 10.8));
  자가('표를 칸 수로 가른다', 표줄('| A | 1 |\n| A | 1 | 2 |', 'A', 2).length === 1);
  자가('절을 떼어 낸다', 절('## 가\n하나\n## 나\n둘', '나').includes('둘'));
  자가('뗀 절에 남의 절이 안 섞인다', !절('## 가\n하나\n## 나\n둘', '나').includes('하나'));
  자가('없는 절은 빈 글', 절('## 가\n하나', '없다') === '');
  /* 🔴 이 다섯 줄이 08:3x 에 이 자를 깨뜨려 보다 나온 것이다 */
  자가('39 안의 3 을 3 으로 안 읽는다', !낱수있나('Thirty-nine of them and 39 more', 3));
  자가('낱낱의 수는 읽는다', 낱수있나('median title reached 3 markets', 3));
  자가('문장 끝 마침표 뒤의 수를 읽는다', 낱수있나('One of them reached 87.', 87));
  자가('10.8 안의 8 을 8 로 안 읽는다', !낱수있나('at 10.8 markets', 8));
  자가('11.1 안의 11 을 11 로 안 읽는다', !낱수있나('grade B is at 11.1.', 11));
  console.log(`카탈로그 도달 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(기사길)) { console.log(`⬜ 기사가 없다 — ${기사길}`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 원 = fs.readFileSync(기사길, 'utf8');
  const 본 = 본문만(원);
  const 민본 = 본.replace(/\s+/g, ' ');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림 += 1; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(46)} ${값}`); };

  /* ── 상관 표. 칸 둘 ── */
  const 총줄 = 표줄(본, 'Total markets the catalogue reached', 2);
  본다('총 도달 줄', 총줄.length === 1, `줄 ${총줄.length}개`);
  if (총줄.length) 본다('총 도달 상관(2째 칸)', 칸자리(총줄[0], 1, d.rTotal), d.rTotal);
  const 편줄 = 표줄(본, 'Markets per title', 2);
  본다('편당 줄', 편줄.length === 1, `줄 ${편줄.length}개`);
  if (편줄.length) 본다('편당 상관(2째 칸)', 칸자리(편줄[0], 1, d.rPerTitle), d.rPerTitle);

  /* ── 띠 표. 칸 다섯 ── */
  for (const b of d.bands) {
    const 줄들 = 표줄(본, b.label, 5);
    본다(`${b.label} — 띠 줄`, 줄들.length === 1, `칸 5개 줄 ${줄들.length}개`);
    if (줄들.length !== 1) continue;
    const l = 줄들[0];
    본다(`${b.label} — 회사수(2째 칸)`, 칸자리(l, 1, b.firms), b.firms);
    본다(`${b.label} — 편당 가운데값(3째)`, 칸자리(l, 2, b.perTitleMedian), b.perTitleMedian);
    본다(`${b.label} — 편당 평균(4째)`, 칸자리(l, 3, b.perTitleMean), b.perTitleMean);
    본다(`${b.label} — 총 도달 가운데값(5째)`, 칸자리(l, 4, b.totalMarketsMedian), b.totalMarketsMedian);
  }

  /* ── 산문의 수 — 절로 좁혀서 본다 ── */
  본다('회사 수', 낱수있나(본, d.firmsWithCharting), d.firmsWithCharting);
  본다('두 편 이상 회사 수', 낱수있나(본, d.multiTitleFirms), d.multiTitleFirms);

  const 한편절 = 절(본, 'one-title companies');
  const h = d.singleTitleFirms;
  본다('한 편짜리 — 회사 수', 낱수있나(한편절, h.firms), h.firms);
  본다('한 편짜리 — 가운데값', 낱수있나(한편절, h.perTitleMedian), h.perTitleMedian);
  본다('한 편짜리 — 한 곳뿐인 회사', /Thirty-nine/i.test(한편절) || 낱수있나(한편절, h.reachedOneMarketOnly), h.reachedOneMarketOnly);
  본다('한 편짜리 — 가장 멀리 간 한 편', 낱수있나(한편절, h.biggest), h.biggest);

  const 등급절 = 절(본, 'grades');
  const [A, B] = d.grades;
  본다('등급 — A 작품 가운데값', 낱수있나(등급절, A.titlesMedian), A.titlesMedian);
  본다('등급 — B 작품 가운데값', 낱수있나(등급절, B.titlesMedian), B.titlesMedian);
  본다('등급 — A 시장 가운데값', 낱수있나(등급절, A.marketsMedian), A.marketsMedian);
  본다('등급 — B 시장 가운데값', 낱수있나(등급절, B.marketsMedian), B.marketsMedian);
  본다('등급 — A 편당', 낱수있나(등급절, A.perTitleMedian), A.perTitleMedian);
  본다('등급 — B 편당', 낱수있나(등급절, B.perTitleMedian), B.perTitleMedian);

  본다('덮는 몫', 낱수있나(본, d.firmCoveragePc), `${d.firmCoveragePc}%`);
  본다('회사 붙은 작품 수', 낱수있나(본, d.titlesWithFirm), d.titlesWithFirm);
  본다('물은 작품 수', 낱수있나(본, d.titlesAsked), d.titlesAsked);

  /* ⛔ 지켜야 할 말 — 하나라도 빠지면 기사가 자료보다 세게 말한 것이다 */
  본다('1→2 뜀을 값으로 안 읽는다고 적었나',
    /We are not going to/i.test(민본) && /which companies got to have one/i.test(민본),
    '고른 탓과 못 가른다');
  본다('가운데값과 평균이 왜 어긋나는지 적었나',
    /thinning tail|fewer surprises/i.test(민본), '작은 무리의 튀는 값이 평균을 끈다');
  본다('도달은 사람 수가 아니라고 적었나',
    /counts countries, not people/i.test(민본) && /both count as 40/i.test(민본), '한 주와 한 해가 같게 센다');
  본다('까닭은 못 답한다고 적었나', /does any of this explain/i.test(민본) && /we did not measure/i.test(민본), '왜 멀리 가는지는 없다');
  본다('덮는 몫의 한계를 적었나', /absent from this table, not\s+small/i.test(민본), '빠진 회사는 작은 회사가 아니다');
  본다('우리 등급이 품질이 아니라고 적었나', /how much of a company is visible/i.test(민본), '등급은 보이는 정도다');

  본다('표 지면이 있나', fs.existsSync(지면길), 지면길);
  본다('기사가 표로 가는 길을 가졌나', 본.includes('/catalogue-reach'), 'markdown 링크');
  본다('앞말의 pages 에 걸었나',
    /^pages:[\s\S]*?- "\/catalogue-reach"/m.test(원.replace(/\r\n/g, '\n')),
    '지면이 이 기사를 스스로 건다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 기사가 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
