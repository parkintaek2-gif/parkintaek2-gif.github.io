/**
 * 기사 `korean-netflix-titles-one-body` 를 **원자료에 대고** 맞춘다.
 *
 * ⛔ 표에 적힌 수를 그냥 믿지 않는다. **덩어리 계산을 여기서 다시 한다.**
 *    다시 세지 않으면 「내가 한 번 센 것」을 검사하는 것이지 자료를 검사하는 게 아니다.
 * ⛔ 「본문 어딘가에 그 숫자가 있나」로 재지 않는다. 표는 **줄째로**, 문장은 자리를 짚어 잰다.
 */
import fs from 'node:fs';
import path from 'node:path';

const N = 'archive/raw/netflix-top10';
const t = JSON.parse(fs.readFileSync(path.join(N, 'korean-titles-keyed.json'), 'utf8'));
const c = JSON.parse(fs.readFileSync(path.join(N, 'korean-cast-joined.json'), 'utf8'));
const 원문 = fs.readFileSync('content/kculturewire/korean-netflix-titles-one-body.md', 'utf8');
/**
 * ⛔ 문장 검사는 **한 줄로 편 본문**에 댄다.
 *   기사는 80자에서 줄이 바뀌고, 그러면 「sitting alone」이 두 줄로 갈려
 *   멀쩡한 문장을 「없다」고 짚는다. 오늘 그것 때문에 두 번 헛걸렸다.
 *   ⚠ 표는 줄 단위라 **원문**에 대야 한다. 둘을 따로 쓴다.
 */
const 본문 = 원문.replace(/\s+/g, ' ');
const 줄본문 = 원문;
const 콤마 = (n) => Number(n).toLocaleString('en-US');
let 틀림 = 0;
const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(34)} ${값}`); };

/** 사람 몇을 뺀 뒤의 구조를 **처음부터** 다시 센다. */
function 구조(뺄 = new Set()) {
  const 사람작품 = new Map();
  for (const [q, v] of Object.entries(c.배우)) if (!뺄.has(q)) 사람작품.set(q, v.작품);
  const 작품 = new Set([...사람작품.values()].flat());
  const 이웃 = new Map([...작품].map((w) => [w, new Set()]));
  for (const ws of 사람작품.values()) {
    for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) {
      이웃.get(ws[i]).add(ws[j]); 이웃.get(ws[j]).add(ws[i]);
    }
  }
  const 본것 = new Set(); let 가장큰 = 0; let 덩어리수 = 0;
  for (const w of 작품) {
    if (본것.has(w)) continue;
    덩어리수++;
    const 큐 = [w]; let n = 0; 본것.add(w);
    while (큐.length) { const x = 큐.pop(); n++; for (const y of 이웃.get(x)) if (!본것.has(y)) { 본것.add(y); 큐.push(y); } }
    if (n > 가장큰) 가장큰 = n;
  }
  const 차수 = [...작품].map((w) => 이웃.get(w).size).sort((a, b) => a - b);
  return { 작품수: 작품.size, 가장큰, 덩어리수, 중앙: 차수[Math.floor(차수.length / 2)],
    고립: 차수.filter((d) => d === 0).length, 이웃 };
}

const 전부 = 구조();
const 자리수 = Object.values(c.배우).reduce((s, v) => s + v.작품.length, 0);

/* ── ① 머리 문장 ── */
본다('작품 수', new RegExp(`\\*\\*${전부.작품수} titles\\.`).test(본문), 전부.작품수);
본다('배우 수', new RegExp(`${콤마(c.배우수)} actors\\.`).test(본문), c.배우수);
본다('출연 자리', new RegExp(`${콤마(자리수)} casting slots\\.\\*\\*`).test(본문), 자리수);
본다('중앙 이웃', new RegExp(`connected to\\s+\\*\\*${전부.중앙}\\*\\* others`).test(본문), 전부.중앙);
본다('고립 작품', new RegExp(`Only ${전부.고립} titles — ${(100 * 전부.고립 / 전부.작품수).toFixed(1)}%`).test(본문),
  `${전부.고립}편 · ${(100 * 전부.고립 / 전부.작품수).toFixed(1)}%`);
본다('가장 큰 덩어리',
  new RegExp(`\\*\\*${전부.가장큰} of the ${전부.작품수} titles, ${(100 * 전부.가장큰 / 전부.작품수).toFixed(1)}%, form a single connected body`).test(본문),
  `${전부.가장큰}/${전부.작품수}`);
본다('덩어리 수', new RegExp(`${전부.덩어리수} separate groups`).test(본문)
  && new RegExp(`and ${전부.고립} titles sitting alone`).test(본문), `${전부.덩어리수}개 · 혼자 ${전부.고립}편`);

/* ── ② 빼기 표 — **줄째로**, 값은 다시 세서 ── */
const 순 = Object.entries(c.배우).sort((a, b) => b[1].작품.length - a[1].작품.length);
const 표 = [['none', 0], ['10 busiest', 10], ['20 busiest', 20],
  ['34 busiest \\(everyone with 10\\+ titles\\)', 34], ['50 busiest', 50], ['100 busiest', 100]];
for (const [이름, n] of 표) {
  const r = n ? 구조(new Set(순.slice(0, n).map(([q]) => q))) : 전부;
  const pc = (100 * r.가장큰 / r.작품수).toFixed(1);
  const re = new RegExp(`\\|\\s*${이름}\\s*\\|\\s*${r.작품수}\\s*\\|\\s*${r.가장큰} \\(\\*{0,2}${pc}%\\*{0,2}\\)\\s*\\|\\s*${r.중앙}\\s*\\|`);
  본다(`표 「${이름.replace(/\\/g, '')}」`, re.test(줄본문), `${r.작품수}편 · ${r.가장큰}(${pc}%) · 중앙 ${r.중앙}`);
}
/* 거울 시험 — 한가한 100명 */
{
  const r = 구조(new Set(순.slice(-100).map(([q]) => q)));
  본다('한가한 100명 뺀 값',
    new RegExp(`${r.가장큰} of ${r.작품수} titles, ${(100 * r.가장큰 / r.작품수).toFixed(1)}%`).test(본문),
    `${r.가장큰}/${r.작품수} · ${(100 * r.가장큰 / r.작품수).toFixed(1)}%`);
}

/* ── ③ 사람 쪽 ── */
const 편수 = Object.values(c.배우).map((v) => v.작품.length);
const 한편 = 편수.filter((n) => n === 1).length;
본다('한 편뿐인 사람',
  new RegExp(`${한편} of ${콤마(c.배우수)} — ${(100 * 한편 / c.배우수).toFixed(1)}%`).test(본문),
  `${한편} · ${(100 * 한편 / c.배우수).toFixed(1)}%`);
본다('다섯 편 이상', new RegExp(`Only ${편수.filter((n) => n >= 5).length} appear in\\s+five or more`).test(본문), 편수.filter((n) => n >= 5).length);
/* ⚠ 기사는 문장 첫머리 수를 **낱말로** 쓴다(Thirty-four). 숫자로만 찾으면 자가 헛돈다. */
const 낱말수 = (n) => {
  const 십 = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const 일 = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  if (n < 20 || n > 99) return String(n);
  return 일[n % 10] ? `${십[Math.floor(n / 10)]}-${일[n % 10]}` : 십[Math.floor(n / 10)];
};
{
  const n = 편수.filter((x) => x >= 10).length;
  본다('열 편 이상', new RegExp(`(${n}|${낱말수(n)}) actors appear in ten or more`, 'i').test(본문), `${n} · ${낱말수(n)}`);
}
for (const [이름, n] of [['Hwang Jung-min', 21], ['Ma Dong-seok', 18]]) {
  const v = Object.values(c.배우).find((x) => x.이름 === 이름);
  본다(`${이름} 편수`, v && v.작품.length === n && 본문.includes(`${이름} appears in ${n}`)
    || (v && v.작품.length === n && new RegExp(`${이름}[^.]{0,40}${n}`).test(본문)), v ? v.작품.length : '없다');
}

/* ── ④ 이어진 작품 표 ── */
const 이름으로 = (nm) => Object.entries(t.작품).find(([, v]) => v.이름 === nm || v.넷플릭스제목 === nm)?.[0];
for (const [nm, 링크, 출연] of [['12.12: The Day', 112, 28], ['Mr. Sunshine', 105, 32],
  ['Ashfall', 86, 12], ['Inside Men', 83, 13], ['Squid Game', 69, 16]]) {
  const q = 이름으로(nm);
  const 실링크 = q ? 전부.이웃.get(q)?.size : undefined;
  const 실출연 = q ? Object.values(c.배우).filter((v) => v.작품.includes(q)).length : undefined;
  const re = new RegExp(`\\|\\s*\\*?${nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*?\\s*\\|\\s*${실링크}( titles)?\\s*\\|\\s*${실출연}\\s*\\|`);
  본다(`표 ${nm}`, 실링크 === 링크 && 실출연 === 출연 && re.test(줄본문), `${실링크}편 · 출연 ${실출연}`);
}
본다('붙은 작품 / 열쇠 작품',
  new RegExp(`${t.맞춘작품수} Korean titles are matched to Wikidata items and only\\s+${전부.작품수} carry a P161`).test(본문)
  && new RegExp(`\\*\\*${t.맞춘작품수 - 전부.작품수} titles have no cast recorded at all\\*\\*`).test(본문),
  `${t.맞춘작품수} · ${전부.작품수} · 없는 것 ${t.맞춘작품수 - 전부.작품수}`);

if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
console.log('\n✅ 전부 기사와 자료가 맞는다');
