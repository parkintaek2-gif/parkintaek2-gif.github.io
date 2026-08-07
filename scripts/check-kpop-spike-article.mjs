/**
 * 기사 `kpop-attention-level-or-event` 가 인용한 수를 **원자료에 대고** 맞춘다.
 *
 * ⛔ 「본문 어딘가에 그 숫자가 있나」로 재지 않는다. 약하다 —
 *    앞 기사에서 3.88 을 3.99 로 바꿔도 통과했다(요약글에 같은 수가 또 있었다).
 *    표는 **줄째로**, 문장은 **자리를 짚어** 잰다.
 * ⛔ 검사를 통과시키려고 기사 수를 고치지 않는다. 어긋나면 자를 먼저 의심한다.
 *
 * ⚠ 이 기사의 셈은 「300회 이상 · 25일 이상」이라는 **걸러내기 위에** 서 있다.
 *    그 조건을 여기 다시 적으면 두 곳이 어긋날 수 있으므로, 조건 자체도 본문에서 읽어 맞춘다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'archive/raw/star-pageviews';
const 최신 = (re) => {
  const f = fs.readdirSync(D).filter((x) => re.test(x)).sort().pop();
  if (!f) throw new Error(`${re} 에 맞는 파일이 없다`);
  return JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
};
const k = 최신(/^kpop-\d+\.json$/);
const m = 최신(/^kpop-members-\d+\.json$/);
const 본문 = fs.readFileSync('content/kculturewire/kpop-attention-level-or-event.md', 'utf8');

/* 걸러내기 조건을 **본문에서 읽는다.** 기사가 조건을 고치면 검사도 따라간다. */
const 조건 = 본문.match(/at least (\d+) views in the month and at least (\d+) days of data/);
if (!조건) throw new Error('본문에서 걸러내기 조건을 못 찾았다 — 검사가 무엇을 재는지 알 수 없다');
const [최소합, 최소일] = [Number(조건[1]), Number(조건[2])];

const 쓸것 = k.사람.filter((p) => p.합 >= 최소합 && p.일수 >= 최소일)
  .map((p) => ({ ...p, 몫: (100 * p.최고조회) / p.합 }));
const 큰 = [...쓸것].sort((x, y) => y.합 - x.합);
const 중간 = (x) => { const s = [...x].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const 몫중간 = (x) => 중간(x.map((p) => p.몫)).toFixed(1);
const 콤마 = (n) => Number(n).toLocaleString('en-US');
const 날꾸밈 = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;

let 틀림 = 0;
const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(32)} ${값}`); };

/* ── ① 문장 속 값 ── */
const 자리 = [
  /* ⚠ 굵은 글씨를 **있지도 않은 곳에** 요구하지 않는다. 쉼표도 빼먹지 않는다.
     오늘 이 두 가지로 멀쩡한 값을 여섯 번 「틀렸다」고 했다. */
  ['쓸 이름 수', new RegExp(`for ${콤마(쓸것.length)} Korean music acts`)],
  ['거른 수', new RegExp(`${콤마(쓸것.length)} of the ${콤마(k.measured ?? k.잡힘)} acts qualify`)],
  ['빠진 수', new RegExp(`${k.사람.length - 쓸것.length} of the ${콤마(k.사람.length)} acts fall below`)],
  ['고른 달 밑값', new RegExp(`\\*\\*${(100 / k.일수).toFixed(2)}%\\*\\*`)],
  ['전체 중앙값', new RegExp(`median act sits at \\*\\*${몫중간(쓸것)}%\\*\\*`)],
  ['BTS 합', new RegExp(`BTS drew ${콤마(쓸것.find((p) => p.이름 === 'BTS').합)} views`)],
  ['BTS 최고조회', new RegExp(`\\*\\*${콤마(쓸것.find((p) => p.이름 === 'BTS').최고조회)} of them`)],
  ['Blackpink 합', new RegExp(`Blackpink drew ${콤마(쓸것.find((p) => p.이름 === 'Blackpink').합)} views`)],
  ['창 첫날 최고 수', new RegExp(`${쓸것.filter((p) => p.최고일 === k.기간.split('~')[0]).length} acts have their peak on ${날꾸밈(k.기간.split('~')[0])}`)],
];
{
  const d = 쓸것.find((p) => p.이름 === 'BTS').최고일;
  const 그날 = 쓸것.filter((p) => p.최고일 === d).length;
  const 고르면 = Math.round(쓸것.length / k.일수);
  자리.push(['BTS 날 전체 수', new RegExp(`\\*\\*${그날} acts across the whole panel peaked on ${날꾸밈(d)}\\*\\*`)]);
  자리.push(['고른 하루 개수', new RegExp(`against ${고르면} on an average day`)]);
  자리.push(['창 첫날 고른값', new RegExp(`twice the even rate of ${고르면}`)]);
}
for (const [무엇, re] of 자리) 본다(무엇, re.test(본문), re.source);

/* ── ② 중앙값 표 — 줄째로 ── */
const 표 = [
  ['Perfectly even month', (100 / k.일수).toFixed(1)],
  [`All ${콤마(쓸것.length)} acts`, 몫중간(쓸것)],
  ['Smallest half by total views', 몫중간(큰.slice(Math.floor(큰.length / 2)))],
  ['100 largest', 몫중간(큰.slice(0, 100))],
  ['50 largest', 몫중간(큰.slice(0, 50))],
  ['20 largest', 몫중간(큰.slice(0, 20))],
  ['10 largest', 몫중간(큰.slice(0, 10))],
];
for (const [이름, 값] of 표) {
  const re = new RegExp(`\\|\\s*${이름.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|\\s*\\*{0,2}${값}%\\*{0,2}\\s*\\|`);
  본다(`표 「${이름}」`, re.test(본문), `${값}%`);
}
본다('상위 20 중 10%↑ 수',
  new RegExp(`${큰.slice(0, 20).filter((p) => p.몫 >= 10).length} of the 20 largest names put at least a tenth`).test(본문),
  `${큰.slice(0, 20).filter((p) => p.몫 >= 10).length}개`);

/* ── ③ 사람별 표 두 개 — 줄째로. 이름·날짜·몫 셋을 한 줄에서 함께 본다 ── */
const 사람표 = (그룹, 짧게) => {
  const g = m.그룹.find((x) => x.그룹 === 그룹);
  if (!g) { 본다(`${그룹} 멤버명단`, false, '자료에 없다'); return; }
  const 줄들 = [쓸것.find((p) => p.이름 === 그룹),
    ...g.멤버.map((n) => 쓸것.find((p) => p.이름 === n)).filter(Boolean)];
  for (const p of 줄들) {
    const 표기 = p.이름 === 그룹 ? 짧게 : (짧게 === 'BTS' || true) ? p.이름.replace(/ \(.*\)$/, '') : p.이름;
    const re = new RegExp(`\\|\\s*${표기.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^|]*\\|\\s*${날꾸밈(p.최고일)}\\s*\\|\\s*${p.몫.toFixed(1)}%\\s*\\|`);
    본다(`표 ${표기}`, re.test(본문), `${날꾸밈(p.최고일)} · ${p.몫.toFixed(1)}%`);
  }
  /* ⛔ 「여섯 명 다 같은 날」은 **문장**이다. 문장이 맞는지도 자료로 잰다. */
  if (그룹 === 'BTS') {
    const 잰멤버 = g.멤버.map((n) => 쓸것.find((p) => p.이름 === n)).filter(Boolean);
    const 같은날 = 잰멤버.filter((p) => p.최고일 === 쓸것.find((x) => x.이름 === 'BTS').최고일).length;
    /* ⚠ 기사는 수를 **낱말로** 쓴다(seven). 숫자로 찾으면 자가 헛돈다. */
    const 낱말 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve'];
    const re = new RegExp(`${낱말[같은날]} of BTS's (${g.멤버.length}|${낱말[g.멤버.length]}) members`, 'i');
    본다('BTS 멤버 몇 명이 같은 날', re.test(본문) && 같은날 === 잰멤버.length,
      `잰 ${잰멤버.length}명 중 ${같은날}명 · 명단 ${g.멤버.length}명 — ${re.source}`);
  }
};
사람표('BTS', 'BTS (group)');
사람표('Blackpink', 'Blackpink (group)');

if (틀림) {
  console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`);
  process.exit(1);
}
console.log('\n✅ 전부 기사와 자료가 맞는다');
