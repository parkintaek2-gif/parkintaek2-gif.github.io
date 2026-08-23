/**
 * 기사 `kpop-attention-top-is-actors` 가 인용한 수를 **원자료에 대고** 맞춘다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 이 기사는 표 하나에 스무 줄이 들어간다. 자료가 다시 모이면 전부 움직인다.
 * 그때 표가 틀린 것을 사람이 알아채기를 기대하지 않는다.
 *
 * ⛔ 「본문 어딘가에 그 숫자가 있나」로 재지 않는다. **약하다.**
 *    앞 기사에서 3.88 을 3.99 로 바꿔도 통과했다 — 요약글에 같은 수가 또 있었다.
 *    표는 **줄째로**, 문장은 **자리를 짚어** 잰다.
 * ⛔ 검사를 통과시키려고 기사 수를 고치지 않는다. 어긋나면 자를 먼저 의심한다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'archive/raw/star-pageviews';
/*
 * 🔴 2026-08-23 — 이 자가 **던져서** npm test 를 통째로 세우고 있었다.
 *   곳간(archive/)은 git 에 없다. 자료를 아직 안 받은 기계에서는 이 파일이 없고,
 *   그때 던지면 **뒤의 검사 백여 개가 한 개도 안 돈다.**
 * ⛔ 「못 쟀다」와 「깨졌다」는 다른 말이다. 자료가 없는 것은 기사가 틀린 것이 아니다.
 * ⚠ 「통과」로 읽히면 안 되므로 경고 표를 붙여 찍고 나간다.
 */
const 없는것 = [];
const 최신 = (re) => {
  let f = null;
  try { f = fs.readdirSync(D).filter((x) => re.test(x)).sort().pop() ?? null; } catch { f = null; }
  if (!f) { 없는것.push(String(re)); return null; }
  return JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
};
const 못쟀으면나간다 = () => {
  if (!없는것.length) return;
  console.log(`⚠ 못 쟀다 — ${D} 에 ${없는것.join(', ')} 가 없다. 곳간은 git 에 없으니 먼저 받는다.`);
  console.log('   ⛔ 이것은 「통과」가 아니다. 재 보지 못했다는 뜻이다.');
  process.exit(0);
};
const k = 최신(/^kpop-\d+\.json$/);
const a = 최신(/^actors-\d+\.json$/);
못쟀으면나간다();
const 본문 = fs.readFileSync('content/kculturewire/kpop-attention-top-is-actors.md', 'utf8');

const 배우 = new Set(a.사람.map((p) => p.이름));
const 개인 = k.사람.filter((p) => p.갈래 !== 'group');
const 겹 = 개인.filter((p) => 배우.has(p.이름));
const 순수 = 개인.filter((p) => !배우.has(p.이름));
const S = (x) => x.reduce((s, p) => s + p.합, 0);
const 콤마 = (n) => Number(n).toLocaleString('en-US');
const 정렬 = (x) => [...x].sort((p, q) => q.합 - p.합);

let 틀림 = 0;
const 본다 = (무엇, ok, 값) => {
  if (!ok) 틀림++;
  console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(30)} ${값}`);
};

/* ── ① 문장 속 값 — 자리를 짚는다 ── */
const 자리 = [
  /* ⚠ 천 단위 쉼표. 이것 때문에 오늘 멀쩡한 값을 네 번째 「틀렸다」고 했다. */
  ['개인 수', new RegExp(`${콤마(개인.length)} individuals in the panel`)],
  ['겹치는 사람 수', new RegExp(`\\*\\*${겹.length} also appear in Korean titles`)],
  ['겹침 몫(사람)', new RegExp(`${(100 * 겹.length / 개인.length).toFixed(1)}% of the names`)],
  ['겹침 몫(조회)', new RegExp(`\\*\\*${(100 * S(겹) / S(개인)).toFixed(1)}% of the views\\*\\*`)],
  ['겹침 조회합', new RegExp(`${콤마(S(겹))} of\\s+${콤마(S(개인))}`)],
  ['겹침 평균', new RegExp(`looked up ${콤마(Math.round(S(겹) / 겹.length))} times`)],
  ['순수 평균', new RegExp(`music credit, ${콤마(Math.round(S(순수) / 순수.length))}\\.`)],
  ['평균 배수', new RegExp(`factor of ${(S(겹) / 겹.length / (S(순수) / 순수.length)).toFixed(1)}`)],
  ['배우명단 잰 수', new RegExp(`${콤마(a.잡힘)} could be measured`)],
  ['배우명단 대상', new RegExp(`began as ${콤마(a.대상)} names`)],
  ['배우명단 문서없음', new RegExp(`\\*\\*${a.문서없음} had no English Wikipedia article`)],
  ['1위 조회', new RegExp(`with ${콤마(정렬(개인)[0].합)}\\s*\\n?openings`)],
];
for (const [무엇, re] of 자리) 본다(무엇, re.test(본문), re.source);

/* ── ② 상위 n 안의 배우 수와 조회 몫 ── */
/* 🔴 2026-08-23 — 이 줄에 '46%'·'9 of the top 20'·'Four' 가 **박혀 있었다.**
   ⛔ 검사가 자기 안에 값을 들고 있으면 자료를 못 따라온다 — 기사를 맞게 고쳐도 계속 빨강이 난다.
   ⚠ 문구는 안 쓰이고 있었다(아래에서 다시 만든다). 낱말도 자료에서 만든다. */
const 셈낱말 = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
for (const n of [10, 20, 50]) {
  const s = 정렬(개인).slice(0, n);
  const 배우수 = s.filter((p) => 배우.has(p.이름)).length;
  const 몫 = Math.round((100 * S(s.filter((p) => 배우.has(p.이름)))) / S(s));
  const re = n === 10
    ? new RegExp(`${셈낱말[배우수] ?? 배우수} of the top ten carry the flag[\\s\\S]{0,60}\\*\\*${몫}% of the top ten`)
    : new RegExp(`${배우수} of the top ${n} and ${몫}% of views`);
  본다(`상위 ${n} (배우 ${배우수}명 · ${몫}%)`, re.test(본문), re.source);
}

/* ── ③ 표 스무 줄 — **줄째로** 잰다 ──
   왼쪽 칸은 전체 상위 10, 오른쪽 칸은 배우 명단에 없는 사람 상위 10.
   이름은 기사에서 짧게 쓴다(Jennie (singer) → Jennie). 그래서 **조회수로** 맞춘다. */
const 표줄 = 본문.split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l));
본다('표가 열 줄인가', 표줄.length === 10, `${표줄.length}줄`);
const 왼 = 정렬(개인).slice(0, 10);
const 오 = 정렬(순수).slice(0, 10);
for (let i = 0; i < 10; i++) {
  const c = (표줄[i] ?? '').split('|').map((x) => x.trim());
  const 별 = 배우.has(왼[i].이름);
  const ok = c[1] === String(i + 1) && c[3] === 콤마(왼[i].합) && c[5] === 콤마(오[i].합)
    && (별 ? /★/.test(c[2]) : !/★/.test(c[2]));
  본다(`표 ${i + 1}줄`, ok, `${콤마(왼[i].합)}${별 ? ' ★' : ''} | ${콤마(오[i].합)}`);
}

if (틀림) {
  console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`);
  process.exit(1);
}
console.log(`\n✅ ${자리.length + 3 + 11}개 전부 기사와 자료가 맞는다`);
