#!/usr/bin/env node
/**
 * build-kcw-demon-hunters-year.mjs — **「넷플릭스 톱10에 1년」이 무엇을 뜻하나.**
 * ────────────────────────────────────────────────────────────────────────────
 * [🔴 왜 재나 — 이슈에 «반응»하는 것이다 (2026-09-03)]
 *   사장님: 「공격형(이슈에 반응, 이슈를 만드는) … 콘텐트 생산 … **이게 제일 중요해**」
 *
 *   오늘 커뮤니티·SNS 우물 445건에서 압도적 1위가 KPop Demon Hunters 였다.
 *   그 가운데 이런 제목들이 반복된다 —
 *   ```
 *   'KPop Demon Hunters' Has Spent One Year On Netflix's Top 10 List
 *   'KPop Demon Hunters' Still Going On Netflix Film Charts A Year On
 *   Did KPop Demon Hunters Dethrone Encanto to Become the Biggest Streaming Film of All Time?
 *   ```
 *   ⛔ 어느 기사도 **「어디서」**를 말하지 않는다. 「톱10에 1년」은 «나라별» 표에서 나온 말인데
 *      나라 이름이 빠져 있다. 우리는 그 나라별 표 원본을 갖고 있다.
 *
 *   ⭐ 그리고 오늘 우리가 «먼저» 재 둔 것이 있다 — `build-kcw-weeks-counter.mjs` 로
 *      넷플릭스의 `누적주` 칸이 «연속»이 아니라 «누적»임을 확인했다.
 *      그래서 「1년 연속」이라는 말이 성립하는지도 우리는 갈라 볼 수 있다.
 *
 * [무엇을 재나]
 *   1. 몇 나라에서 몇 주를 탔나 — 나라별로
 *   2. 그 주들이 «이어졌나» — 틈이 있으면 몇 번, 가장 긴 이어진 토막은 몇 주인가
 *   3. 한국 자신은 몇 주인가 — 「한국 작품인데 한국에서」를 우리는 늘 따로 본다
 *   4. 자료가 덮는 창 — 첫 주·끝 주. ⛔ 창 밖은 「없다」가 아니라 «못 쟀다»다
 *
 * [⛔ 지키는 것]
 *   · 러시아는 뺀다 — 다른 자들과 같은 규칙이다
 *   · 「1년」을 우리가 52주로 «해석»하지 않는다. 잰 수를 그대로 적고, 몇 주인지 말한다
 *   · 자료 끝 주(2026-08-23) 뒤는 못 쟀다. 「지금도 차트에 있다」고 우리가 말하지 않는다
 *   · 제목 맞추기는 넓게 잡지 않는다 — `demon hunters` 가 든 제목을 «다 적어» 두고 눈으로 본다
 *
 * 쓰는 법
 *   node scripts/build-kcw-demon-hunters-year.mjs --자가시험
 *   node scripts/build-kcw-demon-hunters-year.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 나라파일 = path.join(뿌리, 'archive/raw/netflix-top10/countries.ndjson');
const 낼곳 = path.join(뿌리, 'src/data/kcw-demon-hunters-year.json');

/** 주 문자열(YYYY-MM-DD)을 일수로 — 이어진 주인지 보려면 뺄 수 있어야 한다 */
export function 주를일수로(주) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(주 ?? ''));
  if (!m) return null;
  return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
}

/**
 * 주 목록을 «이어진 토막»으로 가른다.
 * ⚠ 넷플릭스 주는 7일 간격이다. 8일 이상 벌어지면 틈이다.
 * ⛔ 정렬을 가정하지 않는다 — 넣는 쪽이 어떤 순서로 주든 같은 답이 나와야 한다.
 */
export function 이어진토막(주들) {
  const 일 = [...new Set(주들.map(주를일수로).filter((x) => x !== null))].sort((a, b) => a - b);
  if (!일.length) return { 토막: [], 가장긴: 0, 틈: 0, 주수: 0 };
  const 토막 = [];
  let 시작 = 일[0]; let 앞 = 일[0]; let 길이 = 1;
  for (let i = 1; i < 일.length; i += 1) {
    if (일[i] - 앞 === 7) { 길이 += 1; 앞 = 일[i]; continue; }
    토막.push(길이); 시작 = 일[i]; 앞 = 일[i]; 길이 = 1;
  }
  토막.push(길이);
  void 시작;
  return {
    토막,
    가장긴: Math.max(...토막),
    틈: 토막.length - 1,
    주수: 일.length,
  };
}

/**
 * 제목이 이 작품인가.
 *
 * 🔴 [첫판이 «딴 작품»을 물고 왔다] `/demon\s*hunters/i` 로 잡았더니
 *   **`Holy Night: Demon Hunters` 5줄**이 같이 들어왔다. 그것은 2025년 «다른» 한국 영화다.
 *   ⛔ 그대로 두면 「KPop Demon Hunters 가 탄 나라·주」에 남의 작품 줄이 섞인다.
 *   ⭐ 잡힌 것은 맞은 제목을 «다 찍어 눈으로 보게» 해 두었기 때문이다.
 *      ⛔ 걸러 낸 수만 내고 무엇이 걸렸는지 안 보이면 이런 것을 영영 못 본다.
 *
 * ✅ 그래서 «앞에서» 맞춘다 — 제목이 KPop/K-Pop 으로 시작하고 Demon Hunters 로 이어지는 것만.
 *   시즌·판본이 붙는 것(`KPop Demon Hunters: …`)은 살린다.
 */
export function 이작품인가(제목) {
  const t = String(제목 ?? '').trim();
  /* K-Pop · KPop · K Pop 다 받는다. 앞에 딴 말이 붙은 것은 받지 않는다 */
  return /^k[-\s]?pop\s*demon\s*hunters\b/i.test(t);
}

function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  본다('주를 일수로 바꾼다', 주를일수로('2025-06-22') !== null);
  본다('꼴이 아니면 null — 0 으로 치지 않는다', 주를일수로('아무거나') === null);
  본다('한 주 차이는 7일이다', 주를일수로('2025-06-29') - 주를일수로('2025-06-22') === 7);

  const a = 이어진토막(['2025-06-22', '2025-06-29', '2025-07-06']);
  본다('이어진 셋은 한 토막', a.토막.length === 1 && a.가장긴 === 3 && a.틈 === 0);

  const b = 이어진토막(['2025-06-22', '2025-07-06']);
  본다('한 주 빠지면 두 토막', b.토막.length === 2 && b.가장긴 === 1 && b.틈 === 1);

  /* ⛔ 정렬을 가정하지 않는다 */
  const c = 이어진토막(['2025-07-06', '2025-06-22', '2025-06-29']);
  본다('⭐ 순서를 섞어 넣어도 같은 답', c.가장긴 === 3 && c.틈 === 0);

  /* ⛔ 같은 주가 두 번 들어와도 두 번 세지 않는다 (나라별로 구분·순위가 여러 줄일 수 있다) */
  const d = 이어진토막(['2025-06-22', '2025-06-22', '2025-06-29']);
  본다('⭐ 같은 주가 겹쳐 들어와도 한 번만 센다', d.주수 === 2 && d.가장긴 === 2);

  본다('빈 것은 0 — 「없다」로 낸다', 이어진토막([]).주수 === 0);

  본다('제목을 알아본다', 이작품인가('KPop Demon Hunters') === true);
  본다('띄어쓰기가 없어도 알아본다', 이작품인가('KPop DemonHunters') === true);
  본다('딴 작품은 아니라고 한다', 이작품인가('Squid Game') === false);
  /* 🔴 첫판이 실제로 물고 온 것 — 2025년 «다른» 한국 영화다 */
  본다('⭐ Holy Night: Demon Hunters 를 «남의 작품»으로 가른다',
    이작품인가('Holy Night: Demon Hunters') === false);
  본다('K-Pop 으로 적힌 것도 받는다', 이작품인가('K-Pop Demon Hunters') === true);
  본다('뒤에 판본이 붙은 것은 살린다', 이작품인가('KPop Demon Hunters: Sing Along') === true);
  본다('앞에 딴 말이 붙으면 안 받는다', 이작품인가('The Making of KPop Demon Hunters') === false);

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

function main() {
  const 인자 = process.argv.slice(2);
  console.log('# 「넷플릭스 톱10에 1년」이 무엇을 뜻하나\n');
  const 흠 = 자가시험();
  if (인자.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 재지 않는다.'); process.exit(1); }

  if (!fs.existsSync(나라파일)) {
    console.log('\n⬜ **못 쟀다** — archive/raw/netflix-top10/countries.ndjson 이 없다.');
    process.exit(1);
  }

  const 나라별 = new Map(); /* 국가 → { 주들, 최고순위, iso2 } */
  const 맞은제목 = new Map();
  const 온주 = new Set();
  let 줄수 = 0; let 러시아뺀줄 = 0;

  for (const line of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    줄수 += 1;
    온주.add(j.주);
    if (!이작품인가(j.제목)) continue;
    /* ⛔ 러시아는 뺀다 — 다른 자들과 같은 규칙 */
    if (j.국가 === 'Russia' || j.iso2 === 'RU') { 러시아뺀줄 += 1; continue; }
    맞은제목.set(j.제목, (맞은제목.get(j.제목) ?? 0) + 1);
    const k = j.국가;
    if (!나라별.has(k)) 나라별.set(k, { 국가: k, iso2: j.iso2, 주들: [], 최고순위: null });
    const r = 나라별.get(k);
    r.주들.push(j.주);
    const 순 = Number(j.순위);
    if (Number.isFinite(순) && (r.최고순위 === null || 순 < r.최고순위)) r.최고순위 = 순;
  }

  const 자료주 = [...온주].filter(Boolean).sort();
  const 표 = [...나라별.values()].map((r) => {
    const t = 이어진토막(r.주들);
    return {
      국가: r.국가, iso2: r.iso2, 주수: t.주수,
      가장긴이어진: t.가장긴, 틈: t.틈, 최고순위: r.최고순위,
    };
  }).sort((a, b) => b.주수 - a.주수 || a.국가.localeCompare(b.국가));

  const 이작품주 = 이어진토막([].concat(...[...나라별.values()].map((r) => r.주들)));
  const 최다 = 표[0];
  const 한국 = 표.find((x) => x.국가 === 'South Korea' || x.iso2 === 'KR') ?? null;
  const 미국 = 표.find((x) => x.국가 === 'United States' || x.iso2 === 'US') ?? null;
  const 오십주이상 = 표.filter((x) => x.주수 >= 50).length;
  const 틈있는나라 = 표.filter((x) => x.틈 > 0).length;

  const 때 = new Date();
  const 두자 = (n) => String(n).padStart(2, '0');
  const 잰때 = `${때.getFullYear()}-${두자(때.getMonth() + 1)}-${두자(때.getDate())} `
    + `${두자(때.getHours())}:${두자(때.getMinutes())} KST`;

  const 낼것 = {
    잰때,
    whatThisIs: 'How many weeks KPop Demon Hunters actually sat in each country\'s Netflix Top 10, '
      + 'counted from the raw weekly country tables, and whether those weeks ran unbroken.',
    whatThisIsNot: 'Not a view count and not a ranking of popularity. A title can chart in a small '
      + 'country for many weeks and be watched by far fewer people than in one week in a large one. '
      + 'We do not add the weeks across countries and call it a total.',
    출처: 'Netflix Top 10 weekly country tables (archive/raw/netflix-top10/countries.ndjson)',
    자료창: { 첫주: 자료주[0] ?? null, 끝주: 자료주[자료주.length - 1] ?? null, 주수: 자료주.length },
    못잰것: [
      `자료 끝 주는 ${자료주[자료주.length - 1] ?? '?'} 다. 그 뒤에도 차트에 있는지 우리는 «못 쟀다».`,
      '러시아는 빼고 셌다 — 다른 자들과 같은 규칙이다.',
      '시청수·시청시간으로 사람 수를 세지 않았다. 이 표는 «주 수»만 센다.',
    ],
    러시아뺀줄,
    읽은줄: 줄수,
    맞은제목: [...맞은제목.entries()].map(([제목, 줄]) => ({ 제목, 줄 })).sort((a, b) => b.줄 - a.줄),
    셈: {
      나라수: 표.length,
      서로다른주: 이작품주.주수,
      가장오래탄나라: 최다 ? 최다.국가 : null,
      가장오래탄주수: 최다 ? 최다.주수 : 0,
      한국주수: 한국 ? 한국.주수 : null,
      미국주수: 미국 ? 미국.주수 : null,
      오십주이상나라: 오십주이상,
      틈있는나라: 틈있는나라,
      틈없는나라: 표.length - 틈있는나라,
    },
    나라표: 표,
  };

  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2));

  console.log(`\n읽은 줄 ${줄수.toLocaleString()} · 이 작품 나라 ${표.length} · 서로 다른 주 ${이작품주.주수}`);
  console.log(`자료 창 ${낼것.자료창.첫주} ~ ${낼것.자료창.끝주} (${낼것.자료창.주수}주)`);
  console.log(`\n■ 맞은 제목 (넓게 잡지 않았는지 «눈으로» 본다)`);
  for (const x of 낼것.맞은제목) console.log(`     ${x.줄}줄  ${x.제목}`);
  console.log(`\n■ 가장 오래 탄 나라 열 곳`);
  for (const x of 표.slice(0, 10)) {
    console.log(`     ${String(x.주수).padStart(2)}주  (가장 긴 이어진 토막 ${String(x.가장긴이어진).padStart(2)}주 · 틈 ${x.틈})  최고 ${x.최고순위}위  ${x.국가}`);
  }
  console.log(`\n■ 한국 ${한국 ? 한국.주수 + '주 (최고 ' + 한국.최고순위 + '위)' : '⬜ 표에 없다'}`
    + `  ·  미국 ${미국 ? 미국.주수 + '주 (최고 ' + 미국.최고순위 + '위)' : '⬜ 표에 없다'}`);
  console.log(`■ 50주 넘게 탄 나라 ${오십주이상}곳 · 한 번도 안 끊긴 나라 ${낼것.셈.틈없는나라}곳 · 끊긴 나라 ${틈있는나라}곳`);
  console.log(`\n  냈다 — ${path.relative(뿌리, 낼곳)}`);
  if (러시아뺀줄) console.log(`  ⚠ 러시아 ${러시아뺀줄}줄은 규칙대로 뺐다`);
}

if (process.argv[1] && process.argv[1].endsWith('build-kcw-demon-hunters-year.mjs')) main();
