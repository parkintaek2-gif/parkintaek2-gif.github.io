/**
 * 조인 패널에서 낸 기사 네 편을 **원자료에 대고** 맞춘다.
 *   ① film-and-series-share-people-but-less-than-chance
 *   ② the-busiest-are-film-people
 *   ③ two-hops-from-squid-game
 *   ④ what-recorded-cast-actually-means
 *
 * ⛔ 셈을 여기서 **다시 한다.** 표에 적힌 수를 믿으면 「내가 한 번 센 것」을 검사하는 것이다.
 * ⛔ 문장은 **한 줄로 편 본문**에, 표는 원문 줄에 댄다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'archive/raw/netflix-top10';
const t = JSON.parse(fs.readFileSync(path.join(D, 'korean-titles-keyed.json'), 'utf8'));
const c = JSON.parse(fs.readFileSync(path.join(D, 'korean-cast-joined.json'), 'utf8'));
const 읽기 = (s) => {
  const 원 = fs.readFileSync(`content/kculturewire/${s}.md`, 'utf8');
  return { 한줄: 원.replace(/\s+/g, ' '), 원 };
};
let 틀림 = 0;
const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(36)} ${값}`); };
const 중간 = (x) => { const s = [...x].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const 몫 = (a, b) => (100 * a / b).toFixed(1);
const 콤마 = (n) => Number(n).toLocaleString('en-US');

const 갈래 = (q) => t.작품[q]?.갈래;
const 사람 = Object.entries(c.배우).map(([q, v]) => ({
  q, 이름: v.이름, n: v.작품.length, 작품: v.작품,
  f: v.작품.filter((w) => 갈래(w) === 'film').length,
  s: v.작품.filter((w) => 갈래(w) === 'series').length,
}));
const 작품출연 = new Map();
for (const p of 사람) for (const q of p.작품) 작품출연.set(q, (작품출연.get(q) ?? 0) + 1);

/* ── ① 갈래를 넘나드나 ── */
{
  const { 한줄, 원 } = 읽기('film-and-series-share-people-but-less-than-chance');
  const 둘 = 사람.filter((p) => p.n >= 2);
  const 양 = 둘.filter((p) => p.f > 0 && p.s > 0).length;
  const 시만 = 둘.filter((p) => p.f === 0).length;
  const 영만 = 둘.filter((p) => p.s === 0).length;
  본다('① 두 편 이상', new RegExp(`\\*\\*${둘.length} actors with two or more charting Korean titles\\*\\*`).test(한줄), 둘.length);
  본다('① 양쪽 수·몫', new RegExp(`${양} have appeared in both`).test(한줄)
    && new RegExp(`That is \\*\\*${몫(양, 둘.length)}%\\*\\*`).test(한줄), `${양} · ${몫(양, 둘.length)}%`);
  /* 무작위 기대값도 **다시 계산한다** */
  const 작품수 = 작품출연.size;
  const 영화몫 = [...작품출연.keys()].filter((q) => 갈래(q) === 'film').length / 작품수;
  const 기대 = 둘.reduce((s, p) => s + (1 - 영화몫 ** p.n - (1 - 영화몫) ** p.n), 0);
  본다('① 무작위 기대 몫', new RegExp(`\\*\\*${몫(기대, 둘.length)}%\\.\\*\\*`).test(한줄), `${몫(기대, 둘.length)}%`);
  본다('① 무작위 기대 사람수', new RegExp(`${Math.round(기대)} of the ${둘.length} would have worked in both`).test(한줄), Math.round(기대));
  /* ⚠ 굵은 글씨 자리를 짐작하지 않는다. 「about」이 굵기 밖에 있을 수도 있다. */
  본다('① 못 넘은 사람수', new RegExp(`about \\*\\*${Math.round(기대) - 양} people\\*\\*`).test(한줄), Math.round(기대) - 양);
  본다('① 영화몫 주석', new RegExp(`film's share of the ${작품수} titles \\(${몫([...작품출연.keys()].filter((q) => 갈래(q) === 'film').length, 작품수)}%\\)`).test(한줄),
    `${몫([...작품출연.keys()].filter((q) => 갈래(q) === 'film').length, 작품수)}%`);
  for (const [이름, n, pc] of [['Both film and series', 양, 몫(양, 둘.length)],
    ['Series only', 시만, 몫(시만, 둘.length)], ['Film only', 영만, 몫(영만, 둘.length)]]) {
    본다(`① 표 「${이름}」`, new RegExp(`\\|\\s*${이름}\\s*\\|\\s*${n}\\s*\\|\\s*${pc}%\\s*\\|`).test(원), `${n} · ${pc}%`);
  }
  const 다섯 = 사람.filter((p) => p.n >= 5);
  본다('① 다섯 편 이상', new RegExp(`the ${다섯.length} people with \\*\\*five or more\\*\\* titles, ${다섯.filter((p) => p.f > 0 && p.s > 0).length} have done both`).test(한줄)
    && new RegExp(`${다섯.filter((p) => p.s === 0).length} are film-only and ${다섯.filter((p) => p.f === 0).length} series-only`).test(한줄),
  `${다섯.length} · 양쪽 ${다섯.filter((p) => p.f > 0 && p.s > 0).length}`);
}

/* ── ② 바쁜 사람은 영화 쪽인가 ── */
{
  const { 한줄, 원 } = 읽기('the-busiest-are-film-people');
  const 영자리 = 사람.reduce((s, p) => s + p.f, 0);
  const 시자리 = 사람.reduce((s, p) => s + p.s, 0);
  본다('② 전체 자리', new RegExp(`\\*\\*${콤마(시자리)} series slots\\s*against ${콤마(영자리)} film slots\\*\\*`).test(한줄), `영 ${영자리} · 시 ${시자리}`);
  본다('② 작품 수', new RegExp(`across ${작품출연.size} titles`).test(한줄), 작품출연.size);
  const 바쁜 = 사람.filter((p) => p.n >= 10);
  본다('② 열 편 이상 수', new RegExp(`the (thirty|${바쁜.length}) people who appear in ten or more`, 'i').test(한줄), 바쁜.length);
  본다('② 바쁜 사람 자리',
    new RegExp(`\\*\\*${바쁜.reduce((s, p) => s + p.f, 0)} film\\. ${바쁜.reduce((s, p) => s + p.s, 0)} series\\.\\*\\*`).test(한줄),
    `영 ${바쁜.reduce((s, p) => s + p.f, 0)} · 시 ${바쁜.reduce((s, p) => s + p.s, 0)}`);
  for (const 이름 of ['Hwang Jung-min', 'Ma Dong-seok', 'Sul Kyung-gu', 'Lee Byung-hun',
    'Ha Jung-woo', 'Kim Eui-sung', 'Kim Hae-suk', 'Jin Seon-kyu']) {
    const p = 사람.find((x) => x.이름 === 이름);
    본다(`② 표 ${이름}`, !!p && new RegExp(`\\|\\s*${이름}\\s*\\|\\s*${p.n}\\s*\\|\\s*${p.f}\\s*\\|\\s*${p.s}\\s*\\|`).test(원),
      p ? `${p.n}편 (영 ${p.f} · 시 ${p.s})` : '자료에 없다');
  }
  const 시중앙 = 중간([...작품출연].filter(([q]) => 갈래(q) === 'series').map(([, n]) => n));
  본다('② 시리즈 중앙 출연', new RegExp(`records the median series here with ${시중앙 === 5 ? 'five' : 시중앙}`).test(한줄), 시중앙);
}

/* ── ③ 오징어 게임에서 몇 다리 ── */
{
  const { 한줄, 원 } = 읽기('two-hops-from-squid-game');
  const 이웃 = new Map([...작품출연.keys()].map((q) => [q, new Set()]));
  for (const p of 사람) for (let i = 0; i < p.작품.length; i++) for (let j = i + 1; j < p.작품.length; j++) {
    이웃.get(p.작품[i]).add(p.작품[j]); 이웃.get(p.작품[j]).add(p.작품[i]);
  }
  const 시작 = Object.entries(t.작품).find(([, v]) => v.이름 === 'Squid Game')?.[0];
  const 거리 = new Map([[시작, 0]]); const 큐 = [시작];
  while (큐.length) { const x = 큐.shift(); for (const y of 이웃.get(x) ?? []) if (!거리.has(y)) { 거리.set(y, 거리.get(x) + 1); 큐.push(y); } }
  const 셈 = {}; for (const d of 거리.values()) 셈[d] = (셈[d] ?? 0) + 1;
  for (const d of [0, 1, 2, 3, 4]) {
    const 표기 = d === 0 ? '0 \\(itself\\)' : String(d);
    본다(`③ 표 ${d}다리`, new RegExp(`\\|\\s*${표기}\\s*\\|\\s*${셈[d] ?? 0}\\s*\\|`).test(원), 셈[d] ?? 0);
  }
  const 못닿음 = 작품출연.size - 거리.size;
  본다('③ 못 닿는 작품', new RegExp(`\\|\\s*never reached\\s*\\|\\s*${못닿음}\\s*\\|`).test(원)
    && new RegExp(`(Seventeen|${못닿음}) titles share no credited actor`, 'i').test(한줄), 못닿음);
  const 두다리 = (셈[0] ?? 0) + (셈[1] ?? 0) + (셈[2] ?? 0);
  const 세다리 = 두다리 + (셈[3] ?? 0);
  /* ⚠ 마침표가 굵기 **안**에 있을 수도 있다. 자가 그 한 글자로 헛돌지 않게 한다. */
  본다('③ 두 다리 안', new RegExp(`\\*\\*${두다리} of the ${작품출연.size} titles — ${몫(두다리, 작품출연.size)}% — are within two hops\\.?\\*\\*`).test(한줄),
    `${두다리}/${작품출연.size} · ${몫(두다리, 작품출연.size)}%`);
  본다('③ 세 다리 안', new RegExp(`you have ${세다리}, or ${몫(세다리, 작품출연.size)}%`).test(한줄), `${세다리} · ${몫(세다리, 작품출연.size)}%`);
  본다('③ 없는 작품', new RegExp(`\\*\\*${t.맞춘작품수 - 작품출연.size} Korean titles have no cast recorded`).test(한줄), t.맞춘작품수 - 작품출연.size);
}

/* ── ④ 조인이 무엇 위에 서 있나 ── */
{
  const { 한줄, 원 } = 읽기('what-recorded-cast-actually-means');
  const 영 = [...작품출연].filter(([q]) => 갈래(q) === 'film');
  const 시 = [...작품출연].filter(([q]) => 갈래(q) === 'series');
  본다('④ 표 Films', new RegExp(`\\|\\s*Films\\s*\\|\\s*${영.length}\\s*\\|\\s*${중간(영.map(([, n]) => n))}\\s*\\|`).test(원), `${영.length} · ${중간(영.map(([, n]) => n))}`);
  본다('④ 표 Series', new RegExp(`\\|\\s*Series\\s*\\|\\s*${시.length}\\s*\\|\\s*${중간(시.map(([, n]) => n))}\\s*\\|`).test(원), `${시.length} · ${중간(시.map(([, n]) => n))}`);
  본다('④ 한 명뿐인 작품', new RegExp(`(Seventy-five|${[...작품출연.values()].filter((n) => n === 1).length}) titles have exactly one person`, 'i').test(한줄),
    [...작품출연.values()].filter((n) => n === 1).length);
  본다('④ 없는 작품', new RegExp(`${t.맞춘작품수 - 작품출연.size} of the ${t.맞춘작품수} Korean titles we matched carry no cast statement`).test(한줄),
    t.맞춘작품수 - 작품출연.size);
  const 자리 = 사람.reduce((s, p) => s + p.n, 0);
  본다('④ 자리·사람·작품', new RegExp(`\\*\\*${콤마(자리)} casting slots\\*\\*, ${콤마(사람.length)} people, ${작품출연.size} titles`).test(한줄),
    `${자리} · ${사람.length} · ${작품출연.size}`);
  본다('④ 한 편뿐 몫', new RegExp(`"${몫(사람.filter((p) => p.n === 1).length, 사람.length)}% of people appear in exactly one title" is a ceiling`).test(한줄),
    `${몫(사람.filter((p) => p.n === 1).length, 사람.length)}%`);
  본다('④ Q번호 조인 몫', new RegExp(`On Q-numbers it reaches\\s*${작품출연.size} of ${t.맞춘작품수}`).test(한줄), `${작품출연.size}/${t.맞춘작품수}`);
}

if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
console.log('\n✅ 네 편 전부 기사와 자료가 맞는다');
