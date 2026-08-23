/**
 * 기사 `kpop-members-outdraw-their-groups` 가 인용한 수를 **원자료에 대고** 맞춘다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 8월 7일에 자료 하나를 고쳤더니 그 수를 **인용한 세 곳**이 조용히 틀렸다.
 * 고침은 원인을 고치는 데서 끝나지 않는다. 그 수를 베낀 곳까지 쓸고,
 * **다시 안 생기게 검사를 남기는 것**까지가 한 벌이다.
 *
 * 이 기사는 손으로 센 수가 열 개가 넘는다. 자료가 다시 모이면 전부 움직인다.
 * 그때 기사가 틀린 것을 **사람이 알아채기를 기대하지 않는다.**
 *
 * ⛔ 검사를 통과시키려고 기사의 수를 고치지 않는다. 어긋나면 **왜 어긋났는지**를 먼저 본다.
 *    지면보다 재는 자를 먼저 의심한다 — 오늘 세 번 다 자가 틀렸다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'archive/raw/star-pageviews';
const 기사 = 'content/kculturewire/kpop-members-outdraw-their-groups.md';
/*
 * 🔴 2026-08-23 — 이 자가 **던져서** npm test 를 통째로 세우고 있었다.
 *   곳간(archive/)은 git 에 없다. 그래서 자료를 아직 안 받은 기계에서는 이 파일이 없고,
 *   그때 이 자가 던지면 **뒤의 검사 백여 개가 한 개도 안 돈다.**
 * ⛔ 「못 쟀다」와 「깨졌다」는 다른 말이다. 자료가 없는 것은 기사가 틀린 것이 아니다.
 *   없으면 그렇게 적고 **0으로 나간다** — 그래야 나머지 검사가 제 일을 한다.
 * ⚠ 이것이 「통과」로 읽히면 안 된다. 그래서 경고 표를 붙여 찍는다.
 */
const 없는것 = [];
const 최신 = (re) => {
  let f = null;
  try { f = fs.readdirSync(D).filter((x) => re.test(x)).sort().pop() ?? null; } catch { f = null; }
  if (!f) { 없는것.push(String(re)); return null; }
  return JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
};
const k = 최신(/^kpop-\d+\.json$/);
const m = 최신(/^kpop-members-\d+\.json$/);
const dd0 = 최신(/^kpop-debut-\d+\.json$/);
if (없는것.length) {
  console.log(`⚠ 못 쟀다 — ${D} 에 ${없는것.join(", ")} 가 없다. 곳간은 git 에 없으니 먼저 받는다.`);
  console.log('   ⛔ 이것은 「통과」가 아니다. 재 보지 못했다는 뜻이다.');
  process.exit(0);
}
const dd = dd0.연도;
/** 겹침·잰수는 **지면 자료**에 있다. 원자료에는 없다 — 빌드가 만든 값이다. */
const 지면 = JSON.parse(fs.readFileSync('src/data/wikitip-kpop.json', 'utf8'));
const 본문 = fs.readFileSync(기사, 'utf8');

const 조회 = new Map(k.사람.map((p) => [p.이름, p]));
const 줄 = [];
for (const g of m.그룹) {
  const G = 조회.get(g.그룹); if (!G) continue;
  const 잡힌 = g.멤버.filter((n) => 조회.has(n));
  줄.push({ 팀: g.그룹, 해: dd[g.그룹] ?? null, 그룹조회: G.합, 적힌: g.멤버.length,
    잡힌: 잡힌.length, 멤버합: 잡힌.reduce((a, n) => a + 조회.get(n).합, 0) });
}
const 견줌 = 줄.filter((r) => r.잡힌 > 0);
const 완전 = 줄.filter((r) => r.적힌 >= 3 && r.잡힌 === r.적힌);
const S = (a, f) => a.reduce((x, r) => x + f(r), 0);

/** 천 단위 쉼표·유형 빼기표(−)를 **먼저 고르게** 만든다.
    오늘 이것 때문에 멀쩡한 값을 세 번 「틀렸다」고 했다. */
const 있나 = (v) => {
  const s = String(v);
  const 후보 = [s, Number(s).toLocaleString('en-US')];
  return 후보.some((c) => 본문.includes(c));
};

let 틀림 = 0;
const 볼것 = [
  ['그룹 수', 지면.groups.n],
  ['멤버 적힌 팀', m.멤버적힌그룹],
  ['견줄 수 있는 팀', 견줌.length],
  ['덮개 완전한 팀', 완전.length],
  ['덮개완전 멤버조회합', S(완전, (r) => r.멤버합)],
  ['덮개완전 그룹조회합', S(완전, (r) => r.그룹조회)],
  ['덮개완전 비율', +(S(완전, (r) => r.멤버합) / S(완전, (r) => r.그룹조회)).toFixed(2)],
  ['덮개완전 멤버승', 완전.filter((r) => r.멤버합 > r.그룹조회).length],
  ['전체 비율', +(S(견줌, (r) => r.멤버합) / S(견줌, (r) => r.그룹조회)).toFixed(2)],
  ['잰 사람 수', 지면.measured],
  ['배우 겹침', 지면.actorOverlap.n],
  ['배우 겹침 조회 몫', 지면.actorOverlap.viewsPc],
  ['연도 적힌 팀', Object.keys(dd).length],
];
/* 기사가 이름을 대고 말한 팀들.
   ⛔ **기사가 실제로 말한 값만** 본다. 안 쓴 값을 내놓으라고 하면 자가 틀린 것이다.
      처음에 그렇게 만들어 다섯 개가 헛되이 걸렸다.
   ⛔ 2·1 같은 작은 수는 `본문에 있나`로 못 잰다 — 아무 문장에나 있다.
      그래서 **그 팀 이름이 나오는 문장 안에서** 영어 낱말로 찾는다. */
const 낱말 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve'];
const 문장들 = 본문.split(/(?<=[.。])\s+/);
const 그팀문장 = (이름) => 문장들.filter((s) => s.includes(이름.replace(/ \(.*\)$/, '')));

const 이름검사 = [
  ['Fromis 9', ['그룹조회', '적힌']],
  ['Babymonster', ['그룹조회', '적힌']],
  ['Meovv', ['그룹조회', '적힌']],
  ['KiiiKiii', ['그룹조회', '적힌']],
  ['The Boyz (South Korean band)', ['그룹조회', '적힌']],
  ["Girls' Generation", ['그룹조회', '멤버합', '잡힌']],
  ['Apink', ['그룹조회', '멤버합', '잡힌']],
  ['BTS', ['그룹조회', '멤버합', '잡힌', '비율']],
  ['NewJeans', ['비율']],
];
for (const [이름, 볼값들] of 이름검사) {
  const r = 줄.find((x) => x.팀 === 이름);
  if (!r) { 볼것.push([`${이름} — 자료에 없다`, '???']); continue; }
  const 문장 = 그팀문장(이름).join(' ');
  for (const 무엇 of 볼값들) {
    if (무엇 === '그룹조회' || 무엇 === '멤버합') {
      볼것.push([`${이름} ${무엇}`, r[무엇]]);
    } else if (무엇 === '비율') {
      볼것.push([`${이름} 비율`, +(r.멤버합 / r.그룹조회).toFixed(2)]);
    } else {
      /* 적힌·잡힌 은 낱말로 쓰여 있다. 그 팀 문장 안에 있어야 한다. */
      const n = r[무엇];
      const ok = 문장.includes(낱말[n] ?? String(n)) || 문장.includes(String(n));
      console.log(`${ok ? '  ' : '❌'} ${`${이름} ${무엇}(낱말)`.padEnd(34)} ${n} → "${낱말[n] ?? n}"`);
      if (!ok) 틀림++;
    }
  }
}

for (const [무엇, 값] of 볼것) {
  const ok = 있나(값);
  if (!ok) 틀림++;
  console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(34)} ${값}`);
}

/* ⛔ **순위는 따로 잰다.** 「넷 빼고 전부보다 많다」고 썼다가 실제로는 열넷째였다.
   숫자를 인용한 것이 아니라 **지어낸 문장**이라 숫자 대조로는 절대 안 걸린다. */
{
  const 서열 = k.사람.filter((p) => p.갈래 === 'group').sort((a, b) => b.합 - a.합);
  const 등수 = 서열.findIndex((p) => p.이름 === 'Babymonster') + 1;
  const 낱말등수 = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
    'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth'][등수];
  const ok = 낱말등수 ? 본문.includes(낱말등수) : 본문.includes(String(등수));
  if (!ok) 틀림++;
  console.log(`${ok ? '  ' : '❌'} ${'Babymonster 그룹 등수'.padEnd(34)} ${등수} → "${낱말등수}"`);
}

/* ⚠ 「본문에 그 숫자가 있다」는 약한 검사다. 다른 문장의 숫자와 우연히 같을 수 있다.
   그래서 **비율 셋**은 표에서 직접 뽑아 다시 잰다. */
const 구간 = [[1990, 2009], [2010, 2014], [2015, 2019], [2020, 2022], [2023, 2026]];
for (const [a, b] of 구간) {
  const s = 완전.filter((r) => r.해 >= a && r.해 <= b);
  if (!s.length) continue;
  const 비 = (S(s, (r) => r.멤버합) / S(s, (r) => r.그룹조회)).toFixed(2);
  const 표줄 = new RegExp(`\\|\\s*${a}[–-]${b}\\s*\\|\\s*${s.length}\\s*\\|\\s*${비}\\s*\\|`);
  const ok = 표줄.test(본문);
  if (!ok) 틀림++;
  console.log(`${ok ? '  ' : '❌'} 덮개완전 표 ${a}–${b} 줄`.padEnd(37) + ` ${s.length}팀 ${비}`);
}

/* ⛔ 위 검사는 **약하다.** 「본문 어딘가에 그 숫자가 있나」라서, 같은 수가 요약글에도
   있으면 본문을 틀리게 고쳐도 통과한다. 실제로 3.88 을 3.99 로 바꿔 봤더니 통과했다.
   그래서 **핵심 문장은 자리를 짚어** 다시 잰다. 이쪽이 진짜 검사다. */
const 핵심 = [
  ['머리 비율', new RegExp(`— ${(S(완전, (r) => r.멤버합) / S(완전, (r) => r.그룹조회)).toFixed(2)} to one\\.`)],
  ['머리 멤버합', new RegExp(`${S(완전, (r) => r.멤버합).toLocaleString('en-US')} times in thirty days`)],
  ['머리 그룹합', new RegExp(`against ${S(완전, (r) => r.그룹조회).toLocaleString('en-US')} for the groups`)],
  ['머리 멤버승', new RegExp(`In ${완전.filter((r) => r.멤버합 > r.그룹조회).length} of those ${완전.length} groups`)],
  ['덮개완전 팀수', new RegExp(`Across\\s+the ${완전.length} groups where Wikidata records`)],
  ['전체 비율', new RegExp(`${(S(견줌, (r) => r.멤버합) / S(견줌, (r) => r.그룹조회)).toFixed(2)} to one\\s+if you include`)],
  ['멤버승 몫', new RegExp(`In ${Math.round((100 * 완전.filter((r) => r.멤버합 > r.그룹조회).length) / 완전.length)}% of the clean cases`)],
  ['멤버 적힌 팀', new RegExp(`membership for ${m.멤버적힌그룹} of them`)],
  ['그룹 수', new RegExp(`all ${지면.groups.n} groups in the panel`)],
  ['견줄 수 있는 팀', new RegExp(`all ${견줌.length} comparable groups`)],
];
for (const [무엇, re] of 핵심) {
  const ok = re.test(본문);
  if (!ok) 틀림++;
  console.log(`${ok ? '  ' : '❌'} [자리] ${String(무엇).padEnd(28)} ${re.source}`);
}

const 잰것 = 볼것.length + 구간.length + 핵심.length + 이름검사.reduce(
  (a, [, v]) => a + v.filter((x) => x === '적힌' || x === '잡힌').length, 0) + 1;
if (틀림) {
  console.error(`\n❌ ${잰것}개 중 ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`);
  process.exit(1);
}
console.log(`\n✅ ${잰것}개 전부 기사와 자료가 맞는다`);
