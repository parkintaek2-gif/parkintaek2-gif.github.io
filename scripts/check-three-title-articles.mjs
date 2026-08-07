/**
 * 8월 7일 밤에 낸 기사 세 편의 수치를 **원자료에 대고** 맞춘다.
 *   ① korean-series-travel-films-do-not   영화 대 시리즈
 *   ② half-our-panel-cannot-be-verified   확인 못 한 몫
 *   ③ who-appears-in-nothing-else          이 작품뿐인 사람
 *
 * ⛔ 「본문 어딘가에 그 숫자가 있나」로 재지 않는다. 표는 **줄째로**, 문장은 자리를 짚어 잰다.
 * ⛔ 문장 검사는 **한 줄로 편 본문**에 댄다. 기사는 80자에서 줄이 바뀐다.
 * ⛔ 셈을 여기서 **다시 한다.** 안 다시 세면 「내가 한 번 센 것」을 검사하는 것이다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'archive/raw/netflix-top10';
const t = JSON.parse(fs.readFileSync(path.join(D, 'korean-titles-keyed.json'), 'utf8'));
const c = JSON.parse(fs.readFileSync(path.join(D, 'korean-cast-joined.json'), 'utf8'));
const 지면 = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));

const 읽기 = (s) => {
  const 원 = fs.readFileSync(`content/kculturewire/${s}.md`, 'utf8');
  return { 한줄: 원.replace(/\s+/g, ' '), 원 };
};
let 틀림 = 0;
const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(38)} ${값}`); };
const 중간 = (x) => { const s = [...x].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const 몫 = (a, b) => (100 * a / b).toFixed(1);

/* ── 넷플릭스 표에서 언어 딱지와 도달을 다시 센다 ── */
const 딱지 = new Map(); const 표 = new Map();
for (const f of ['global.ndjson', 'countries.ndjson']) {
  for (const 줄 of fs.readFileSync(path.join(D, f), 'utf8').split('\n')) {
    if (!줄.trim()) continue; let j; try { j = JSON.parse(줄); } catch { continue; }
    if (f.startsWith('global')) {
      const v = /Non-English/i.test(j.구분 || '') ? 'ne' : 'en';
      const 전 = 딱지.get(j.제목); 딱지.set(j.제목, 전 && 전 !== v ? 'both' : v);
    }
    if (!표.has(j.제목)) 표.set(j.제목, { 주: new Set(), 나라: new Set() });
    표.get(j.제목).주.add(j.주); if (j.iso2) 표.get(j.제목).나라.add(j.iso2);
  }
}
const 작품줄 = Object.entries(t.작품).map(([q, v]) => {
  const s = 표.get(v.넷플릭스제목) ?? { 주: new Set(), 나라: new Set() };
  return { q, 갈래: v.갈래, 딱지: 딱지.get(v.넷플릭스제목) ?? null, 주: s.주.size, 나라: s.나라.size };
});

/* ── ① 영화 대 시리즈 ── */
{
  const { 한줄, 원 } = 읽기('korean-series-travel-films-do-not');
  const 확인 = 작품줄.filter((r) => r.딱지 === 'ne');
  const F = 확인.filter((r) => r.갈래 === 'film'); const S = 확인.filter((r) => r.갈래 === 'series');
  본다('① 확인된 작품 수', new RegExp(`\\*\\*${확인.length} Korean titles carry it\\.\\*\\*`).test(한줄), 확인.length);
  const 표줄 = [
    ['Titles', F.length, S.length],
    ['Median weeks on a chart', 중간(F.map((r) => r.주)), 중간(S.map((r) => r.주))],
    ['Median countries reached', 중간(F.map((r) => r.나라)), `\\*\\*${중간(S.map((r) => r.나라))}\\*\\*`],
    ['Reached 25 countries or more', `${몫(F.filter((r) => r.나라 >= 25).length, F.length)}%`, `\\*\\*${몫(S.filter((r) => r.나라 >= 25).length, S.length)}%\\*\\*`],
    ['Lasted 10 weeks or more', `${몫(F.filter((r) => r.주 >= 10).length, F.length)}%`, `${몫(S.filter((r) => r.주 >= 10).length, S.length)}%`],
  ];
  for (const [이름, f, s] of 표줄) {
    const re = new RegExp(`\\|\\s*${이름}\\s*\\|\\s*${f}\\s*\\|\\s*${s}\\s*\\|`);
    본다(`① 표 「${이름}」`, re.test(원), `${f} / ${String(s).replace(/\\\*/g, '')}`);
  }
  const 뺀 = 작품줄.length - 확인.length;
  본다('① 뺀 작품 수', new RegExp(`The ${뺀} Korean titles that never reached`).test(한줄)
    && new RegExp(`the 674 excluded titles`).test(한줄) === (뺀 === 674), 뺀);
  본다('① 중앙 3배 문장', new RegExp(`three times as many markets`).test(한줄)
    && 중간(S.map((r) => r.나라)) >= 3 * 중간(F.map((r) => r.나라)), `${중간(S.map((r) => r.나라))} vs ${중간(F.map((r) => r.나라))}`);
}

/* ── ② 확인 못 한 몫 — 지면 자료와 같아야 한다 ── */
{
  const { 한줄 } = 읽기('half-our-panel-cannot-be-verified');
  본다('② 미확인/전체', new RegExp(`\\*\\*${지면.unlabelledTitles} of the ${지면.titleCount} titles`).test(한줄)
    || new RegExp(`${지면.unlabelledTitles} of ${지면.titleCount} — ${몫(지면.unlabelledTitles, 지면.titleCount)}%`).test(한줄),
  `${지면.unlabelledTitles}/${지면.titleCount}`);
  본다('② 몫', new RegExp(`${지면.unlabelledTitles} of ${지면.titleCount} — ${몫(지면.unlabelledTitles, 지면.titleCount)}%\\.`).test(한줄),
    `${몫(지면.unlabelledTitles, 지면.titleCount)}%`);
  본다('② 영어 차트로 뺀 수', new RegExp(`\\*\\*${지면.excludedEnglishChart} titles\\*\\* matched a Korean work`).test(한줄), 지면.excludedEnglishChart);
  /* 기사는 문장 첫머리 수를 낱말로 쓴다. 숫자와 낱말을 **둘 다** 받는다. */
  const 낱말 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  /* ⛔ 2026-08-08. 「손으로 뺀 수」에 판정 질의가 답해서 뺀 여덟 편이 섞여 들어왔다.
     기사 문장은 **읽어서 뺀 것**을 말한다. 그러니 읽은 것만 센다. */
  본다('② 읽어서 뺀 수',
    new RegExp(`\\*\\*(${지면.excludedByHandRead.length}|${낱말[지면.excludedByHandRead.length] ?? 'x'}) more\\*\\*`, 'i').test(한줄),
    지면.excludedByHandRead.length);
  본다('② 판정 질의로 뺀 수',
    new RegExp(`\\*\\*(${지면.excludedByAttribution.length}|${낱말[지면.excludedByAttribution.length] ?? 'x'}) more\\*\\*`, 'i').test(한줄)
    || new RegExp(`(${지면.excludedByAttribution.length}|${낱말[지면.excludedByAttribution.length] ?? 'x'}) came out because our own`, 'i').test(한줄),
    지면.excludedByAttribution.length);
  본다('② Friends 는 이 표에 없다', !지면.excludedByHand.includes('Friends') && 한줄.includes('It never charted in these six countries'), 지면.excludedByHand.join(' · '));
}

/* ── ③ 이 작품뿐인 사람 ── */
{
  const { 한줄, 원 } = 읽기('who-appears-in-nothing-else');
  const v = Object.values(c.배우);
  const 한편 = v.filter((x) => x.작품.length === 1).length;
  본다('③ 한 편뿐인 사람', new RegExp(`\\*\\*${한편} of ${Number(v.length).toLocaleString('en-US')} people — ${몫(한편, v.length)}% — appear in exactly one\\*\\*`).test(한줄),
    `${한편}/${v.length} · ${몫(한편, v.length)}%`);
  const 작품출연 = new Map();
  for (const x of v) for (const q of x.작품) { if (!작품출연.has(q)) 작품출연.set(q, []); 작품출연.get(q).push(x); }
  const 큰것 = [...작품출연].filter(([, a]) => a.length >= 5);
  본다('③ 5명 이상 작품 수', new RegExp(`the ${큰것.length} productions with at least five recorded`).test(한줄), 큰것.length);
  const 중앙몫 = (100 * 중간(큰것.map(([, a]) => a.filter((x) => x.작품.length === 1).length / a.length))).toFixed(1);
  본다('③ 중앙 몫', new RegExp(`\\*\\*${중앙몫}%\\*\\* of its\\s*cast appearing in nothing else`).test(한줄), `${중앙몫}%`);
  const 이름으로 = (nm) => Object.entries(t.작품).find(([, x]) => x.이름 === nm || x.넷플릭스제목 === nm)?.[0];
  for (const [nm, n] of [['Parasite', 11], ['Extraordinary Attorney Woo', 11], ['The Thieves', 11],
    ['Inside Men', 13], ['Bloodhounds', 12], ['Itaewon Class', 10]]) {
    const q = 이름으로(nm); const a = 작품출연.get(q) ?? [];
    const 하나 = a.filter((x) => x.작품.length === 1).length;
    본다(`③ 0% 표 ${nm}`, a.length === n && 하나 === 0 && new RegExp(`\\|\\s*${nm}\\s*\\|\\s*${n}\\s*\\|`).test(원), `${a.length}명 · 이 작품뿐 ${하나}`);
  }
  for (const [nm, n, h] of [['The Influencer', 9, 9], ['Welcome to Wedding Hell', 5, 4],
    ['Island', 5, 4], ['Resident Playbook', 10, 7], ['My ID is Gangnam Beauty', 27, 17]]) {
    const q = 이름으로(nm); const a = 작품출연.get(q) ?? [];
    const 하나 = a.filter((x) => x.작품.length === 1).length;
    const pc = Math.round(100 * 하나 / (a.length || 1));
    본다(`③ 100% 표 ${nm}`, a.length === n && 하나 === h
      && new RegExp(`\\|\\s*${nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\|\\s*${n}\\s*\\|\\s*${h} \\(${pc}%\\)\\s*\\|`).test(원),
    `${a.length}명 · ${하나}명(${pc}%)`);
  }
  본다('③ 문서 없는 사람', new RegExp(`${v.filter((x) => !x.문서).length} of the ${Number(v.length).toLocaleString('en-US')} people here have no article`).test(한줄), v.filter((x) => !x.문서).length);
  본다('③ 붙은 작품 / 열쇠 작품', new RegExp(`Q-numbers reach ${작품출연.size} of ${t.맞춘작품수}`).test(한줄), `${작품출연.size} / ${t.맞춘작품수}`);
  본다('③ 작품 수', new RegExp(`${t.맞춘작품수} Korean titles\\s*that reached a Netflix Top 10, not a career`).test(한줄), t.맞춘작품수);
}

if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
console.log('\n✅ 세 편 전부 기사와 자료가 맞는다');
