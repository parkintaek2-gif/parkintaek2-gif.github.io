#!/usr/bin/env node
/**
 * find-todays-spike-deep.mjs — **우리 명단을 하나씩 물어 오늘 튄 이름을 찾는다.**
 *
 * ── 왜 «또» 만드나 — 앞 자가 못 보는 것이 있다 ──────────────────
 * `find-todays-spike.mjs` 는 판마다 «그날 가장 많이 열린 문서 1,000개»를 받아 맞춘다.
 * 빠르지만 큰 구멍이 있다 —
 *
 * ```
 * 인도네시아판 1,000위 = 하루 128회
 * 한국 배우·그룹 대부분은 그 판에서 하루 수십 회다 → **애초에 목록에 못 든다**
 * ```
 *
 * 🔴 그래서 앞 자는 「오늘 튄 것이 없다」를 자주 낸다. **없는 게 아니라 못 본 것이다.**
 * ⭐ 이 자는 반대로 간다 — 우리가 아는 이름을 **하나씩 물어본다.** 순위와 무관하게 보인다.
 *
 * ⚠ 느리다(이름마다 한 번씩 묻는다). 그래서 **읽힘이 많은 이름부터** 정해진 수만 본다.
 *   하루 여섯 번 내야 하므로 한 번에 몇 분을 넘기면 안 된다.
 *
 * ── ⛔ 이 자가 «말하지 않는» 것 ─────────────────────────────────
 * ⛔ **왜 튀었는지는 모른다.** 사람이 확인하고 정한다.
 * ⛔ 읽힘은 시청도 인기도 아니다. 문서가 열린 횟수다.
 * ⚠ 작은 수는 배수가 쉽게 튄다 — 바닥을 두고, 바닥과 실제 수를 같이 낸다.
 *   「30회가 10회였다」는 3배지만 이야깃거리가 아니다. 그 판단을 숨기지 않고 수로 보인다.
 *
 * ── 🔴 [2026-09-01] **막힌 까닭은 «속도»가 아니라 «양»이었다** ──
 * 오늘 돌렸더니 **561건 중 533건이 429(막힘)** 였다. 그래서 속도를 재 봤다.
 * ```
 * 묶음4·250ms 쉼    40건 → 429 «0건»
 * 묶음1·안 쉼       40건 → 429 «0건»
 * 묶음4·250ms 쉼   600건 → 429 «533건»
 * ```
 * ⇒ 어떤 속도로 던져도 40건은 통과하고 600건은 막힌다. **위키미디어는 창마다 «횟수»를
 *   센다.** 사이에 쉬는 것으로는 안 풀린다. ⛔ 재시도를 늘리는 것은 임시방편이다.
 *
 * ⭐ 그래서 오늘 `find-kcw-top-movers.mjs` 를 세웠다 — 판마다 «그날의 1,000개»를
 *   **한 번에** 받는다. 판 5 × 날 2 = **10번**. 안 막힌다.
 *   ⇒ **날마다 도는 것은 그 자다.** 이 자는 그 자가 못 보는 «아래쪽»을 볼 때만 쓴다.
 * ⚠ 아래 `묻는수한도` 를 넘기려면 `--한도넘김` 을 일부러 줘야 한다. 실수로 600건을
 *   던지면 그날 치를 통째로 못 재고 화면에는 「튄 것 0개」로 뜬다 — 가장 나쁜 꼴이다.
 *
 * 쓰는 법  node scripts/find-todays-spike-deep.mjs [--판=vi,id,th,ms,en] [--이름수=120] [--바닥=80]
 *          node scripts/find-todays-spike-deep.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 날쪼개기, 하루전, 튄배수 } from './find-todays-spike.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 이름 → 위키미디어가 아는 문서 제목 꼴 */
export function 문서꼴(이름) {
  return encodeURIComponent(String(이름 ?? '').trim().replace(/\s+/g, '_'));
}

export function 낱주소(판, 이름, 처음, 끝) {
  const a = 날쪼개기(처음); const b = 날쪼개기(끝);
  return `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${판}.wikipedia`
    + `/all-access/user/${문서꼴(이름)}/daily/${a.y}${a.m}${a.d}/${b.y}${b.m}${b.d}`;
}

/**
 * 날짜별 수에서 «오늘»과 «앞이레 하루 평균»을 가른다.
 * ⛔ 하루치가 모자라면 못 잰 것으로 둔다 — 이틀로 「평균」을 만들지 않는다.
 */
export function 갈라보기(날들, 적어도 = 5) {
  const 다 = (날들 ?? []).filter((r) => Number.isFinite(r?.views));
  if (다.length < 적어도 + 1) return null;
  const 오늘 = 다[다.length - 1].views;
  const 앞 = 다.slice(0, -1);
  const 평균 = 앞.reduce((s, r) => s + r.views, 0) / 앞.length;
  return { 오늘, 평균, 날수: 앞.length, 날: 다[다.length - 1].timestamp };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 셈 = 0;
  const 본다 = (말, 참) => { 셈 += 1; console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };

  본다('① 이름을 문서 꼴로 바꾼다', 문서꼴('Lee You-mi') === 'Lee_You-mi');
  본다('② 여백을 밑줄로', 문서꼴('  Squid  Game ') === 'Squid_Game');
  본다('③ 특수문자를 감싼다', 문서꼴('Hearts2Hearts') === 'Hearts2Hearts');
  본다('④ 주소를 만든다',
    낱주소('vi', 'Squid Game', Date.UTC(2026, 7, 20), Date.UTC(2026, 7, 28))
    === 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/vi.wikipedia'
      + '/all-access/user/Squid_Game/daily/20260820/20260828');

  const 날 = (v, t) => ({ views: v, timestamp: t });
  본다('⑤ 오늘과 앞이레를 가른다', (() => {
    const r = 갈라보기([날(10, 'a'), 날(10, 'b'), 날(10, 'c'), 날(10, 'd'), 날(10, 'e'), 날(30, 'f')]);
    return r.오늘 === 30 && r.평균 === 10 && r.날수 === 5;
  })());
  본다('⑥ 🔴 하루치가 모자라면 못 잰다 — 이틀로 평균을 만들지 않는다',
    갈라보기([날(10, 'a'), 날(30, 'b')]) === null);
  본다('⑦ 빈 것도 못 잰다', 갈라보기([]) === null && 갈라보기(null) === null);
  본다('⑧ 수가 아닌 줄은 버린다', (() => {
    const r = 갈라보기([날(10, 'a'),날(10, 'b'), 날(10, 'c'), 날(10, 'd'), 날(10, 'e'), { views: null }, 날(30, 'f')]);
    return r && r.오늘 === 30;
  })());
  본다('⑨ 잰 날을 같이 낸다', 갈라보기([날(1, 'a'), 날(1, 'b'), 날(1, 'c'), 날(1, 'd'), 날(1, 'e'), 날(2, '2026082900')]).날 === '2026082900');
  본다('⑩ 배수 자를 그대로 쓴다 — 자를 두 개 만들지 않는다', 튄배수(30, 10, 5) === 3);

  console.log(`\n${process.exitCode ? '❌' : '✅'} find-todays-spike-deep 자가시험 (${셈})`);
  process.exit();
}

/* ── 몸 ───────────────────────────────────────────────── */
const 인자 = (이름, 기본) => {
  const a = process.argv.find((x) => x.startsWith(`--${이름}=`));
  return a ? a.split('=')[1] : 기본;
};
const 판들 = String(인자('판', 'vi,id,th,ms,en')).split(',').map((s) => s.trim()).filter(Boolean);
const 이름수 = Number(인자('이름수', 120));
/* ⚠ 바닥 — 이 아래 수로는 배수를 안 낸다. 「30회가 10회였다」는 이야깃거리가 아니다 */
const 바닥 = Number(인자('바닥', 80));

/** 읽힘이 많은 이름부터 — 하루 여섯 번 내려면 빨라야 한다 */
function 볼이름들() {
  const 것 = [];
  try {
    const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-people.json'), 'utf8'));
    for (const p of (j.people ?? [])) {
      if (!p.name) continue;
      것.push({
        이름: p.wikiPage || p.name, 보일이름: p.name, 갈래: '사람',
        주소: `/person/${p.slug}`, 읽힘: Number(p.reads30d) || 0,
      });
    }
  } catch { /* ⬜ */ }
  try {
    const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-groups.json'), 'utf8'));
    for (const g of (j.groups ?? [])) {
      if (!g.name) continue;
      것.push({ 이름: g.name, 보일이름: g.name, 갈래: '그룹', 주소: `/group/${g.slug}`, 읽힘: 0 });
    }
  } catch { /* ⬜ */ }
  것.sort((a, b) => b.읽힘 - a.읽힘);
  return 것.slice(0, 이름수);
}

const 끝 = 하루전(Date.now(), 1);      /* ⚠ 하루치는 하루 늦게 확정된다 */
const 처음 = 하루전(Date.now(), 9);

/**
 * 🔴🔴 [2026-08-29] **첫판에 300건 중 288건을 「못 물어봤다」로 냈다.**
 *   문서가 없어서가 아니었다 — 위키미디어가 **429(너무 빠름)** 를 돌려준 것이다.
 *   여덟 개씩 쉬지 않고 던졌다.
 *
 * ⛔ 자가 「없다」와 「막혔다」를 못 가르면, 오늘 이슈가 있어도 없다고 말한다.
 *   ⭐ 다행히 이 자는 «못 물어본 수»를 따로 세고 있었다. 그래서 288 이 보였고 까닭을 찾았다.
 *     0 으로 채웠으면 「오늘은 조용하다」로 넘어갔을 것이다.
 * ✅ 그래서 ① 천천히 묻고 ② 429 면 쉬었다 한 번 더 묻고 ③ 그래도 안 되면 «막혔다»고 센다.
 * ⚠ 남의 서버다. 빨리 받으려고 몰아치는 것은 우리가 할 일이 아니다.
 */
export const 쉼 = (ms) => new Promise((r) => { setTimeout(r, ms); });

export const 막힌수 = { 값: 0 };

async function 물어보기(판, 이름, 다시 = 1) {
  try {
    const r = await fetch(낱주소(판, 이름, 처음, 끝), {
      headers: { 'user-agent': 'KCultureWire/1.0 (kculturewire.com; contact via site)' },
    });
    if (r.status === 429) {
      if (다시 > 0) { await 쉼(1500); return 물어보기(판, 이름, 다시 - 1); }
      막힌수.값 += 1;
      return null;
    }
    if (!r.ok) return null;          /* 404 = 그 판에 문서가 없다. 막힌 것과 다르다 */
    const j = await r.json();
    return 갈라보기(j?.items ?? []);
  } catch { return null; }
}

/**
 * 🔴 [2026-09-01] **묻는 수를 스스로 막는다.**
 * 위키미디어는 창마다 «횟수»를 센다 — 600건을 던지면 533건이 막히고, 화면에는
 * 「튄 것 0개」로 뜬다. **못 잰 것이 없는 것처럼 보이는 것**이 가장 나쁘다.
 * ⛔ 넘기려면 `--한도넘김` 을 일부러 준다. 실수로는 못 넘긴다.
 */
export const 묻는수한도 = 50;   /* 2026-09-01 실측 — 40건은 통과, 200건은 156건이 막혔다 */

/**
 * 🔴 막히기 시작하면 «그 자리에서 멈춘다».
 * ⛔ 끝까지 던지면 200건을 다 태우고도 화면에는 「튄 것 0개」로 뜬다.
 *   그것이 가장 나쁜 꼴이다 — **못 잰 것이 없는 것처럼 보인다.**
 * ⚠ 남의 서버다. 막았다는데 계속 두드리는 것은 우리가 할 일이 아니다.
 */
export const 멈출막힘수 = 10;

const 이름들 = 볼이름들();
{
  const 물을수 = 이름들.length * 판들.length;
  if (물을수 > 묻는수한도 && !process.argv.includes('--한도넘김')) {
    console.error(`⛔ **${물을수}번을 물으려 한다 — 한도 ${묻는수한도}번을 넘는다.**`);
    console.error('   2026-09-01 실측: 600번을 던졌더니 533번이 429 로 막혔고, 화면에는');
    console.error('   「튄 것 0개」로 떴다. 없는 것이 아니라 못 물어본 것이었다.');
    console.error('');
    console.error('   ⭐ 날마다 도는 자는 이것이 아니다 —');
    console.error('        node scripts/find-kcw-top-movers.mjs      (10번만 묻는다. 안 막힌다)');
    console.error(`   ⭐ 그래도 깊이 보려면 이름을 줄인다 — --이름수=${Math.floor(묻는수한도 / 판들.length)}`);
    console.error('   ⛔ 정말 넘기려면 --한도넘김 을 준다. 그날 치를 통째로 못 잴 수 있다.');
    process.exit(1);
  }
}
console.log('\n■ 오늘 튀어 오른 한국 이름 — 우리 명단을 하나씩 물어본다\n');
console.log(`  이름 ${이름들.length}개 × 판 ${판들.join('·')} · 바닥 ${바닥}회`
  + ` · ${날쪼개기(처음).m}/${날쪼개기(처음).d}~${날쪼개기(끝).m}/${날쪼개기(끝).d} (UTC)`);

const 후보 = [];
let 못잰것 = 0;

let 멈췄나 = false;
for (const 판 of 판들) {
  if (멈췄나) break;
  let 이판 = 0;
  /* ⚠ 한 번에 몰아 던지지 않는다 — 위키미디어에 무례하고, 막히면 통째로 못 잰다 */
  /* ⚠ 넷씩, 사이에 쉰다. 여덟씩 쉬지 않고 던졌다가 429 로 288건을 잃었다 */
  for (let i = 0; i < 이름들.length; i += 4) {
    const 묶음 = 이름들.slice(i, i + 4);
    const 답 = await Promise.all(묶음.map((n) => 물어보기(판, n.이름)));
    await 쉼(250);
    for (let k = 0; k < 묶음.length; k += 1) {
      const r = 답[k];
      if (!r) { 못잰것 += 1; continue; }
      const 배 = 튄배수(r.오늘, r.평균, 바닥);
      if (배 === null || 배 < 1.8) continue;
      후보.push({ ...묶음[k], 판, 오늘: r.오늘, 평균: Math.round(r.평균), 배, 날: r.날 });
      이판 += 1;
    }
    /**
     * 🔴 [2026-09-01] **막히기 시작하면 그 자리에서 멈춘다.**
     *   전에는 끝까지 던져 200건을 다 태우고도 화면에 「튄 것 0개」로 냈다.
     *   ⛔ 못 잰 것이 없는 것처럼 보이는 것 — 그것이 가장 나쁜 꼴이다.
     */
    if (막힌수.값 >= 멈출막힘수) {
      console.log(`  🔴 ${판} — **${막힌수.값}건이 막혀 여기서 멈춘다.** 남은 판은 «안 쟀다»`);
      멈췄나 = true;
      break;
    }
  }
  if (!멈췄나) console.log(`  ✅ ${판} — 튄 것 ${이판}개`);
}
if (멈췄나) {
  console.log('\n⬜ **끝까지 못 쟀다.** 위키미디어가 창마다 «횟수»를 센다 — 할당량이 찼다.');
  console.log('   ⛔ 아래 「튄 것」을 «오늘 전부»로 읽으면 안 된다. 본 데까지만이다.');
  console.log('   ⭐ 날마다 도는 자는 이것이 아니다 — node scripts/find-kcw-top-movers.mjs (10번만 묻는다)');
}

후보.sort((a, b) => b.배 - a.배);

console.log(`\n  ${후보.length ? '⭐' : '⬜'} 후보 ${후보.length}개`
  + (못잰것 ? ` · ⬜ 못 물어본 것 ${못잰것}건` : '')
  + (막힌수.값 ? ` · 🔴 그중 «막힌» 것 ${막힌수.값}건 — 문서가 없는 것이 아니라 429 다` : ''));
console.log('');

for (const c of 후보.slice(0, 15)) {
  console.log(`  ${c.배.toFixed(1)}배  ${c.보일이름}  (${c.갈래}·${c.판})`
    + `  어제 ${c.오늘.toLocaleString('en-US')} ← 앞이레 하루 ${c.평균.toLocaleString('en-US')}`
    + `  ${c.주소}`);
}

if (!후보.length) {
  console.log('  ⬜ 오늘은 바닥을 넘겨 튄 이름이 없다.');
  console.log('     ⛔ 「없으니 아무거나 만든다」로 가지 않는다 — 없으면 없다고 적고 다른 축을 본다.');
}

console.log('\n## ⛔ 이 표가 «말하지 않는» 것');
console.log('   · **왜 튀었는지는 모른다.** 위키백과는 까닭을 안 적는다 — 사람이 확인하고 정한다');
console.log('   · 읽힘은 시청도 인기도 아니다. 문서가 열린 횟수다');
console.log(`   · ⚠ 바닥 ${바닥}회를 넘긴 것만 냈다. 그 아래는 배수가 쉽게 튀어 이야깃거리가 아니다`);

process.exitCode = 후보.length ? 0 : 2;
