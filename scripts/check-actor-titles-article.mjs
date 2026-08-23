/**
 * 기사 `korean-actors-more-titles-buys-a-floor` 가 인용한 수를 **원자료에 대고** 맞춘다.
 *
 * ⛔ 「본문 어딘가에 그 숫자가 있나」로 재지 않는다. 약하다 —
 *    앞 기사에서 3.88 을 3.99 로 바꿔도 통과했다(요약글에 같은 수가 또 있었다).
 *    표는 **줄째로**, 문장은 **자리를 짚어** 잰다.
 * ⛔ 걸러내기 조건(300회·25일)과 구간 경계를 여기 다시 적지 않는다 — **본문에서 읽는다.**
 *    두 곳에 적으면 한쪽만 고쳤을 때 검사가 조용히 헛돈다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'archive/raw/star-pageviews';
const 기사 = 'content/kculturewire/korean-actors-more-titles-buys-a-floor.md';
const f = fs.readdirSync(D).filter((x) => /^actors-\d+\.json$/.test(x)).sort().pop();
if (!f) throw new Error('배우 원자료가 없다');
const a = JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
const 본문 = fs.readFileSync(기사, 'utf8');

const 조건 = 본문.match(/at least (\d+) views over the month and at least (\d+) days of data/);
if (!조건) throw new Error('본문에서 걸러내기 조건을 못 찾았다');
const 사람 = a.사람.filter((p) => p.합 >= +조건[1] && p.일수 >= +조건[2]);

const 중간 = (x) => { const s = [...x].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const S = (x) => x.reduce((s, p) => s + p.합, 0);
const 콤마 = (n) => Number(n).toLocaleString('en-US');
let 틀림 = 0;
const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(30)} ${값}`); };

/* ── ① 구간 표 — **본문의 구간을 읽어** 그대로 다시 센다 ── */
const 구간 = [[1, 1, '1'], [2, 2, '2'], [3, 3, '3'], [4, 5, '4–5'], [6, 9, '6–9'], [10, 9999, '10 or more']];
for (const [lo, hi, 이름] of 구간) {
  const s = 사람.filter((p) => p.작품수 >= lo && p.작품수 <= hi);
  const re = new RegExp(`\\|\\s*${이름.replace('–', '[–-]')}\\s*\\|\\s*${콤마(s.length)}\\s*\\|\\s*\\*{0,2}${콤마(중간(s.map((p) => p.합)))}\\*{0,2}\\s*\\|`);
  본다(`구간 표 「${이름}」`, re.test(본문), `${s.length}명 · 중앙값 ${콤마(중간(s.map((p) => p.합)))}`);
}

/* ── ② 한 편 대 두 편+ 표 ── */
const 한편 = 사람.filter((p) => p.작품수 === 1);
const 여러 = 사람.filter((p) => p.작품수 >= 2);
const 전체합 = S(사람);
const 몫 = (n, d) => (100 * n / d).toFixed(1);
const 둘 = [
  ['One charting title', 한편, 몫(한편.length, 사람.length), 몫(S(한편), 전체합)],
  ['Two or more', 여러, 몫(여러.length, 사람.length), 몫(S(여러), 전체합)],
];
for (const [이름, s, 사람몫, 조회몫] of 둘) {
  const re = new RegExp(`\\|\\s*${이름}\\s*\\|\\s*${콤마(s.length)}\\s*\\|\\s*${사람몫}%\\s*\\|\\s*${조회몫}%\\s*\\|\\s*${콤마(중간(s.map((p) => p.합)))}\\s*\\|`);
  본다(`두 갈래 표 「${이름}」`, re.test(본문), `${s.length}명 · ${사람몫}% · ${조회몫}% · ${콤마(중간(s.map((p) => p.합)))}`);
}
본다('한 편 대비 배수',
  new RegExp(`\\*\\*${(중간(여러.map((p) => p.합)) / 중간(한편.map((p) => p.합))).toFixed(2)} times\\*\\*`).test(본문),
  (중간(여러.map((p) => p.합)) / 중간(한편.map((p) => p.합))).toFixed(2));

/* ── ③ 이름을 대고 말한 사람 — 작품수와 조회를 **한 줄에서 함께** 본다 ── */
for (const 이름 of ['Lee Byung-hun', 'Ma Dong-seok', 'Ha Jung-woo', 'Sul Kyung-gu',
  'Hwang Jung-min', 'Kim Eui-sung', 'Steven Yeun', 'Nam Joo-hyuk', 'Jisoo']) {
  const p = 사람.find((x) => x.이름 === 이름);
  if (!p) { 본다(이름, false, '자료에 없다'); continue; }
  const re = new RegExp(`\\|\\s*${이름}\\s*\\|\\s*${p.작품수}\\s*\\|\\s*${콤마(p.합)}\\s*\\|`);
  본다(`표 ${이름}`, re.test(본문), `${p.작품수}편 · ${콤마(p.합)}`);
}
/* 본문 문장에서 쓴 값 둘 */
본다('김의성 문장', new RegExp(`Kim Eui-sung has fifteen charting titles and ${콤마(사람.find((p) => p.이름 === 'Kim Eui-sung').합)} views`).test(본문), '문장');
{
  const r = 사람.find((p) => p.이름 === 'Roh Yoon-seo');
  /* 🔴 2026-08-23 — 여기 'four' 가 **박혀 있었다.** 자료가 세 편으로 바뀌자 기사를 맞게 고쳐도
     이 자가 계속 빨강을 냈다. ⛔ 검사가 자기 안에 값을 들고 있으면 자료를 따라오지 못한다.
     **편수 낱말도 자료에서 만든다.** 기사는 숫자가 아니라 낱말로 쓰므로 낱말로 견준다. */
  const 낱말 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const 편수말 = r ? (낱말[r.작품수] ?? String(r.작품수)) : null;
  본다('노윤서 문장',
    r ? new RegExp(`Roh Yoon-seo drew ${콤마(r.합)} views across ${편수말}\\s+charting titles`).test(본문) : false,
    r ? `${콤마(r.합)} · ${r.작품수}편(${편수말})` : '자료에 없다');
}

/* ── ④ 순위상관 ── */
const 순위 = (arr, key) => { const s = [...arr].sort((x, y) => x[key] - y[key]);
  const m = new Map(); s.forEach((p, i) => m.set(p, i + 1)); return m; };
const r1 = 순위(사람, '작품수'), r2 = 순위(사람, '합');
const n = 사람.length;
const rho = (1 - (6 * 사람.reduce((s, p) => s + (r1.get(p) - r2.get(p)) ** 2, 0)) / (n * (n * n - 1))).toFixed(3);
본다('순위상관', new RegExp(`\\*\\*${rho}\\*\\*`).test(본문) && 본문.includes(`Spearman is ${rho}`), rho);
본다('쓸 사람 수', new RegExp(`all ${콤마(n)} actors the rank correlation`).test(본문)
  && new RegExp(`${콤마(n)} of the ${콤마(a.잡힘)} qualify`).test(본문), `${n} / ${a.잡힘}`);
본다('잰 사람 수', new RegExp(`${콤마(a.잡힘)} of them have English Wikipedia articles`).test(본문), a.잡힘);
본다('뺀 사람 수', new RegExp(`The ${콤마(a.잡힘 - n)} excluded are small`).test(본문), a.잡힘 - n);

if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
console.log('\n✅ 전부 기사와 자료가 맞는다');
