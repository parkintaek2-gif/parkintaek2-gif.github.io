/**
 * K Culture Wire — K팝 관심도 지면용 자료. (/kpop-attention)
 *
 * 결과 → src/data/wikitip-kpop.json
 * 입력 → archive/raw/star-pageviews/kpop-YYYYMMDD.json (collect-kpop-pageviews.mjs)
 *
 * ── 왜 이 지면인가 ─────────────────────────────────────────────
 * 지면 열다섯 장 중 음악은 `/exports` 한 장뿐이고 그것도 **수출 금액**이다.
 * 사장님이 지목하신 독자가 「k팝에 관심이 많은 해외 대상」인데
 * 사람이 K팝을 검색해 들어올 자리가 한 곳도 없었다.
 *
 * ── ⚠ 관심은 인기가 아니다 ────────────────────────────────────
 * 조회수는 좋은 일로도 나쁜 일로도 오른다. 지면에 「인기 순위」라고 쓰지 않는다.
 * **「관심도」**라고 쓰고, 급상승은 총량과 **따로** 놓는다 — 섞으면 스캔들이 인기로 읽힌다.
 *
 * ── ⛔ 줄세우기로 만들지 않는다 ───────────────────────────────
 * 상위 목록은 내되 **그룹과 개인을 나눠** 놓고, 둘이 왜 다른지를 같이 적는다.
 * 그룹 문서 하나에 멤버 여럿의 관심이 모이므로 개인과 같은 자로 못 잰다.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'archive/raw/star-pageviews';
const files = fs.readdirSync(DIR).filter((f) => /^kpop-\d+\.json$/.test(f)).sort();
if (!files.length) {
  console.error('❌ kpop-*.json 이 없다 — 먼저 collect-kpop-pageviews.mjs 를 돌린다');
  process.exit(1);
}
const 파일 = files[files.length - 1];
const j = JSON.parse(fs.readFileSync(path.join(DIR, 파일), 'utf8'));
const 사람 = j.사람;

/**
 * ⚠ 배우 명단과 **겹치는 사람**이 있다. 위키데이터가 「가수」 직업도 달아 둔 배우들이다.
 *   빼지 않는다 — 지수(블랙핑크)도 차은우도 **실제로 둘 다**다. 우리가 가를 일이 아니다.
 *   대신 **표시하고 크기를 밝힌다**: 편수로는 8% 남짓인데 **조회수로는 4분의 1이 넘는다.**
 *   그걸 안 밝히면 「K팝 관심도 1·2위가 소지섭·스티븐 연」이 되어 읽는 사람을 속인다.
 */
const 배우명단 = (() => {
  const f = fs.readdirSync(DIR).filter((x) => /^actors-\d+\.json$/.test(x)).sort();
  if (!f.length) return new Set();
  return new Set(JSON.parse(fs.readFileSync(path.join(DIR, f[f.length - 1]), 'utf8')).사람.map((p) => p.이름));
})();
const 배우이기도 = (p) => 배우명단.has(p.이름);

const 갈래 = (k) => 사람.filter((p) => p.갈래 === k);
const 그룹 = 갈래('group');
const 개인 = 갈래('person');

const 줄 = (p) => ({
  name: p.이름,
  kind: p.갈래,
  total: p.합,
  daily: p.하루평균,
  peakDay: p.최고일,
  peakViews: p.최고조회,
  last7: p.최근7일,
  /** 배우 명단(/actors)에도 있는 사람. 빼지 않고 지면에 표시한다. */
  alsoActor: 배우이기도(p),
});

const 합계 = 사람.reduce((s, p) => s + p.합, 0);
const 상위 = (arr, n) => [...arr].sort((a, b) => b.합 - a.합).slice(0, n).map(줄);

/* ⭐ 급상승은 총량과 따로. 주 300회 미만은 배수가 튀므로 뺀다 — 10회가 40회 되면 ×4 다. */
const 뜨는 = 사람
  .filter((p) => p.상승배수 != null && p.최근7일 >= 300)
  .sort((a, b) => b.상승배수 - a.상승배수)
  .slice(0, 12)
  .map((p) => ({ ...줄(p), rise: p.상승배수 }));

/* 쏠림 — 상위 몇이 전체의 얼마인가. /actors 와 같은 자로 재야 견줄 수 있다. */
const 쏠림 = [1, 10, 50].map((n) => {
  const s = [...사람].sort((a, b) => b.합 - a.합).slice(0, n).reduce((a, p) => a + p.합, 0);
  return { top: n, views: s, sharePc: +((100 * s) / 합계).toFixed(1) };
});

const 무게 = (arr) => (arr.length ? Math.round(arr.reduce((s, p) => s + p.합, 0) / arr.length) : 0);

const out = {
  generated: new Date().toISOString(),
  source: j.출처,
  rosterSource: j.명단출처,
  period: j.기간,
  days: j.일수,
  roster: j.대상,
  measured: j.잡힘,
  notFound: j.문서없음 ?? 0,
  fetchFailed: j.부르기실패 ?? 0,
  /** 명단 질의 중 못 물은 갈래 — 있으면 명단이 덜 찬 것이다. 지면에 적는다. */
  rosterQueriesMissed: j.명단못물은갈래 ?? 0,
  rosterQueries: j.명단갈래수 ?? null,
  totalViews: 합계,
  groups: { n: 그룹.length, views: 그룹.reduce((s, p) => s + p.합, 0), mean: 무게(그룹) },
  people: { n: 개인.length, views: 개인.reduce((s, p) => s + p.합, 0), mean: 무게(개인) },
  /** 배우 명단과 겹치는 몫 — 편수와 조회수를 **둘 다** 낸다. 하나만 내면 작아 보인다. */
  actorOverlap: (() => {
    const 겹 = 사람.filter(배우이기도);
    const 겹합 = 겹.reduce((s2, p) => s2 + p.합, 0);
    return { n: 겹.length, nPc: +((100 * 겹.length) / 사람.length).toFixed(1),
      views: 겹합, viewsPc: +((100 * 겹합) / 합계).toFixed(1) };
  })(),
  /** 배우 명단에 없는 사람만으로 다시 센 상위 — 지면이 두 목록을 나란히 놓는다. */
  topMusicOnly: 상위(사람.filter((p) => !배우이기도(p)), 15),
  concentration: 쏠림,
  topGroups: 상위(그룹, 15),
  topPeople: 상위(개인, 15),
  rising: 뜨는,
};

/* ── 검산 ── 그룹+개인이 전체와 맞아야 한다. 안 맞으면 갈래가 새고 있다. */
if (out.groups.n + out.people.n !== 사람.length) {
  throw new Error(`갈래 합 ${out.groups.n + out.people.n} ≠ 잡힌 수 ${사람.length}`);
}
if (out.groups.views + out.people.views !== 합계) throw new Error('조회수 합이 안 맞는다');

fs.writeFileSync('src/data/wikitip-kpop.json', JSON.stringify(out, null, 2));

console.log(`${파일} · 명단 ${out.roster} · 잡힘 ${out.measured} · 문서없음 ${out.notFound} · 부르기실패 ${out.fetchFailed}`);
console.log(` 그룹 ${out.groups.n}팀 평균 ${out.groups.mean.toLocaleString()} · 개인 ${out.people.n}명 평균 ${out.people.mean.toLocaleString()}`);
console.log(` 쏠림 ${쏠림.map((c) => `상위${c.top} ${c.sharePc}%`).join(' · ')}`);
console.log(' 그룹 상위:', out.topGroups.slice(0, 5).map((r) => `${r.name}(${r.total.toLocaleString()})`).join(' · '));
console.log(' 개인 상위:', out.topPeople.slice(0, 5).map((r) => `${r.name}(${r.total.toLocaleString()})`).join(' · '));
