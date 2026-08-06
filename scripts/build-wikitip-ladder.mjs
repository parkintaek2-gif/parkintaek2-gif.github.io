/**
 * K Culture Wire — 사다리 두 지면의 자료. (/ladder-gap · /ladder-churn)
 *
 * 결과 → src/data/wikitip-ladder-gap.json    위층과 아래층의 차 (얼마나 센가)
 *        src/data/wikitip-ladder-churn.json  꼭대기가 얼마나 바뀌나 (얼마나 자주 바뀌나)
 * 입력 → archive/raw/riot-ladder/<날짜>/solo-queue.json  (매일 22:00 KST 수집)
 *
 * ── 왜 이제 와서 스크립트를 만드나 ─────────────────────────────
 * 두 자료 다 **손으로 만들어져 있었다.** 값은 2026-08-07 되짚기에서 원자료와 맞는 것을 확인했다
 * (두 지면 합쳐 값 96개, 어긋남 0). 그래도 **되짚을 수 없는 자료는 규칙이 바뀌어도 안 따라온다.**
 * 같은 날 그렇게 해서 /staying-power 와 첫 화면이 틀린 채로 라이브에 있었다.
 *
 * ── ⚠ 사다리는 소급이 안 된다 ──────────────────────────────────
 * 8/5 는 키 만료로 비어 있고 **영영 못 채운다.** 그래서 이 스크립트는 있는 날만 세고,
 * 며칠을 셌는지 자료에 적는다. 「추세」가 아니라 **순서가 안 바뀐다**는 확인으로만 쓴다.
 *
 * ⛔ 선수 식별자(puuid·summonerId)는 원자료에도 안 담고 여기서도 안 만든다.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'archive/raw/riot-ladder';
const 날짜들 = fs.readdirSync(DIR)
  .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && fs.existsSync(path.join(DIR, d, 'solo-queue.json')))
  .sort();
if (!날짜들.length) throw new Error(`${DIR} 에 수집된 날이 없다`);

const 읽기 = (d) => JSON.parse(fs.readFileSync(path.join(DIR, d, 'solo-queue.json'), 'utf8'));
const 최신 = 읽기(날짜들[날짜들.length - 1]);

/** 지면에 싣는 순서. 한국을 먼저 둔다 — 기준선이지 1등이라서가 아니다. */
const ORDER = ['kr', 'euw1', 'na1', 'vn2', 'jp1', 'sg2'];
const 이름 = (code, R) => R[code]?.region_name ?? code;

/* ⚠ 목록에 없는 지역이 원자료에 있으면 **멈춘다.** 거르고 지나가면 한 지역이 조용히 빠진다 —
   이 스크립트를 처음 쓸 때 동남아 코드를 `sea` 로 잘못 적어 실제로 한 곳이 빠졌고,
   전 자료와 대조해서야 알았다. 지면은 그동안 「여섯 중」이라고 적고 있었다. */
const 모르는지역 = Object.keys(최신.regions).filter((c) => !ORDER.includes(c));
if (모르는지역.length) {
  throw new Error(`목록에 없는 지역: ${모르는지역.join(', ')} — ORDER 에 넣고 지면 문안도 함께 본다`);
}
const 지역목록 = ORDER.filter((c) => 최신.regions[c]);
if (지역목록.length !== Object.keys(최신.regions).length) {
  throw new Error(`원자료 ${Object.keys(최신.regions).length}곳 중 ${지역목록.length}곳만 실린다`);
}
const 이름들 = 지역목록.map((c) => 이름(c, 최신.regions));

/* ── 날짜별 계열 ── 지면이 「나흘 내내 순서가 같았다」를 보이는 데 쓴다. */
const 계열 = (뽑기) => 날짜들.map((d) => {
  const R = 읽기(d).regions;
  const row = { date: d };
  for (const c of 지역목록) row[이름(c, 최신.regions)] = R[c] ? 뽑기(R[c]) : null;
  return row;
});

const PRIVACY = 최신.privacy
  ?? 'Player identifiers (puuid, summonerId) are intentionally not stored.';

/* ── ① /ladder-gap ── 챌린저와 그랜드마스터의 차. */
const gapRows = 지역목록.map((c) => {
  const R = 최신.regions[c], ch = R.challenger, gm = R.grandmaster;
  return {
    region: R.region_name, code: c,
    cPlayers: ch.players, gPlayers: gm.players,
    cWin: ch.win_rate, gWin: gm.win_rate,
    gap: +(ch.win_rate - gm.win_rate).toFixed(2),
    cLp: ch.lp.median, gLp: gm.lp.median,
    lpGap: ch.lp.median - gm.lp.median,
    cGames: ch.games.mean_per_player, gGames: gm.games.mean_per_player,
  };
}).sort((a, b) => a.gap - b.gap);

fs.writeFileSync('src/data/wikitip-ladder-gap.json', JSON.stringify({
  generated: new Date().toISOString(),
  source: 'Riot Games Developer API — /lol/league/v4/challengerleagues and /grandmasterleagues, queue RANKED_SOLO_5x5',
  collectedAt: 최신.collected_at_kst,
  day: 최신.day,
  days: 날짜들.length,
  privacy: PRIVACY,
  rows: gapRows,
  series: 계열((R) => +(R.challenger.win_rate - R.grandmaster.win_rate).toFixed(2)),
  regions: 이름들,
}, null, 2));

/* ── ② /ladder-churn ── 자리를 지킨 사람과 연승 중인 사람. 한 번도 안 쓰던 두 칸이다. */
const churnRows = 지역목록.map((c) => {
  const R = 최신.regions[c], ch = R.challenger, gm = R.grandmaster;
  return {
    region: R.region_name, code: c,
    players: ch.players,
    veteran: ch.veteran, vetPc: +((100 * ch.veteran) / ch.players).toFixed(1),
    hot: ch.hot_streak, hotPc: +((100 * ch.hot_streak) / ch.players).toFixed(1),
    gmPlayers: gm.players,
    gmVetPc: +((100 * gm.veteran) / gm.players).toFixed(1),
    gmHotPc: +((100 * gm.hot_streak) / gm.players).toFixed(1),
  };
}).sort((a, b) => b.vetPc - a.vetPc);

fs.writeFileSync('src/data/wikitip-ladder-churn.json', JSON.stringify({
  generated: new Date().toISOString(),
  source: 'Riot Games Developer API — challenger and grandmaster league entries, queue RANKED_SOLO_5x5. “Veteran” and “hot streak” are Riot’s own per-player flags.',
  endpoints: '/lol/league/v4/challengerleagues and /grandmasterleagues, queue RANKED_SOLO_5x5',
  collectedAt: 최신.collected_at_kst,
  day: 최신.day,
  days: 날짜들.length,
  privacy: PRIVACY,
  rows: churnRows,
  series: 계열((R) => +((100 * R.challenger.veteran) / R.challenger.players).toFixed(1)),
  regions: 이름들,
}, null, 2));

/* ── 검산 ── 표시 수가 인원을 넘을 수 없다. 넘으면 칸을 잘못 짚은 것이다. */
for (const r of churnRows) {
  if (r.veteran > r.players || r.hot > r.players) {
    throw new Error(`${r.region}: 표시된 사람이 인원보다 많다 (${r.veteran}/${r.hot} of ${r.players})`);
  }
}
/* 빠진 날은 세지 않되 **몇 날을 셌는지** 밝힌다. 8/5 는 키 만료로 영영 비어 있다. */
const 빠진날 = (() => {
  const 첫 = new Date(날짜들[0]), 끝 = new Date(날짜들[날짜들.length - 1]);
  const 있어야할 = Math.round((끝 - 첫) / 86400000) + 1;
  return 있어야할 - 날짜들.length;
})();

console.log(`수집일 ${날짜들.length}일 (${날짜들[0]}~${날짜들[날짜들.length - 1]}) · 빠진 날 ${빠진날}일 · 지역 ${지역목록.length}곳`);
console.log(` gap   가장 좁은 곳 ${gapRows[0].region} ${gapRows[0].gap}%p · 가장 넓은 곳 ${gapRows[gapRows.length - 1].region} ${gapRows[gapRows.length - 1].gap}%p`);
console.log(` churn 가장 안 바뀌는 곳 ${churnRows[0].region} ${churnRows[0].vetPc}% · 가장 잘 바뀌는 곳 ${churnRows[churnRows.length - 1].region} ${churnRows[churnRows.length - 1].vetPc}%`);
