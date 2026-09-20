#!/usr/bin/env node
/**
 * build-seoulmarkets-consensus-page.mjs — `/data/consensus` 가 쓸 수를 짓는다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 매체: **SeoulMarkets**(금융). 자료: src/data/korea-consensus-tape.json
 *
 * ── 왜 이 지면이 따로 있나 ───────────────────────────────────────
 *   `/data/target-changes` 는 «목표주가가 움직인 것»을 낸다 — 보고서 축이다.
 *   여기는 **사람 축**이다. 다만 사장님이 정하신 대로 사람 «명단»을 파는 것이 아니다
 *   (CLAUDE.md 「주력과 서비스」). 우리가 내는 것은 명단이 아니라 **명단이 흔들린다는 사실**이다.
 *
 *   ⭐ 우리 몫 — 한경컨센서스의 애널리스트 지면은 «오늘 시점 최근 1개월»을 날마다 다시 센다.
 *     그래서 어제의 명부도 어제의 점수도 지면에 남지 않는다. 우리만 날마다 찍어 두었다.
 *     ⇒ 낼 값은 「누가 1위인가」가 아니라 **「열흘 만에 절반이 명부에서 사라진다」**다.
 *
 * ── 🔴 이 자가 지키는 것 ─────────────────────────────────────────
 *   ⛔ row_in_name_order 를 순위로 읽지 않는다. 지면 요청이 이름 가나다순이라
 *     그 수는 줄 번호다(build-v1-consensus-tape.mjs 의 rankNote 에 실측이 있다).
 *     순위를 낼 일이 있으면 우리가 score 로 세우고 «우리가 세웠다»고 지면에 적는다.
 *   ⛔ 정확도 0 을 「정확도 0%」로 세지 않는다 — 지면이 안 낸 칸이다.
 *   ⛔ **덜 받힌 스냅숏을 온전한 것과 섞지 않는다.** 09-12·09-13 은 20줄뿐이었다.
 *     섞으면 「그날 명부가 20명으로 줄었다」는 거짓이 된다. 날짜를 박지 않고 «규칙»으로 가른다.
 *   ⛔ 증권사 영문명을 지어내지 않는다 — 사전에 없으면 안 적혀 있다고 낸다.
 *
 * 쓰는 법
 *   node scripts/build-seoulmarkets-consensus-page.mjs
 *   node scripts/build-seoulmarkets-consensus-page.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { INSTITUTIONS } from '../src/lib/institutions.mjs';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 읽을곳 = path.join(뿌리, 'src/data/korea-consensus-tape.json');
const 낼곳 = path.join(뿌리, 'src/data/seoulmarkets-consensus.json');

/**
 * 지면에 찍을 시각. 영문 지면이라 «한글이 한 자도 없어야» 한다.
 * ⚠ 이 PC 는 이미 KST 다 — 9시간을 더하지 않고 toISOString() 도 쓰지 않는다.
 */
export function 한국시각(d = new Date()) {
  const 둘 = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${둘(d.getMonth() + 1)}-${둘(d.getDate())} `
    + `${둘(d.getHours())}:${둘(d.getMinutes())} KST`;
}

/** 가운데값 — 평균은 짧은 스냅숏 하나에 끌려간다 */
export function 가운데값(수들) {
  const s = [...수들].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * 스냅숏을 «온전한 것»과 «덜 받힌 것»으로 가른다.
 * 규칙 — 줄 수가 가운데값의 절반에 못 미치면 덜 받힌 것이다.
 * ⛔ 날짜를 박아 두지 않는다. 다음에 또 짧게 받히면 그때도 스스로 걸려야 한다.
 */
export function 스냅숏가르기(줄수표) {
  const 날들 = Object.keys(줄수표).sort();
  const 중 = 가운데값(날들.map((d) => 줄수표[d])) ?? 0;
  const 문턱 = 중 / 2;
  const 온전 = 날들.filter((d) => 줄수표[d] >= 문턱);
  const 짧음 = 날들.filter((d) => 줄수표[d] < 문턱);
  return { 온전, 짧음, 문턱: Math.round(문턱), 중 };
}

/** 한글 사명 → 영문명. **없으면 null 이다. 지어내지 않는다** */
export function 영문명(한글) {
  const hit = INSTITUTIONS[한글];
  return hit && hit.en ? hit.en : null;
}

export function 짓기(표) {
  const A = Array.isArray(표.analysts) ? 표.analysts : [];
  const R = Array.isArray(표.reports) ? 표.reports : [];
  const m = 표._meta ?? {};

  const 줄수표 = {};
  for (const a of A) 줄수표[a.as_of] = (줄수표[a.as_of] ?? 0) + 1;
  const 갈라짐 = 스냅숏가르기(줄수표);

  /* 사람 축은 «온전한 스냅숏»만으로 센다 */
  const F = A.filter((a) => 갈라짐.온전.includes(a.as_of));
  const 몇판 = {};
  for (const a of F) {
    const k = a.analyst_id ?? a.name;
    if (!k) continue;
    (몇판[k] = 몇판[k] ?? new Set()).add(a.as_of);
  }
  const 사람들 = Object.keys(몇판);
  const 판수 = 갈라짐.온전.length;
  const 다든사람 = 사람들.filter((k) => 몇판[k].size === 판수).length;
  const 한판만 = 사람들.filter((k) => 몇판[k].size === 1).length;

  /* 점수가 날마다 얼마나 흔들리나 — 세 판 이상 든 사람만 */
  const 점수들 = {};
  for (const a of F) {
    const k = a.analyst_id ?? a.name;
    if (!k || a.score == null) continue;
    (점수들[k] = 점수들[k] ?? []).push(a.score);
  }
  const 흔들림 = Object.entries(점수들)
    .filter(([, v]) => v.length >= 3)
    .map(([k, v]) => ({ k, 폭: Math.max(...v) - Math.min(...v) }))
    .sort((a, b) => b.폭 - a.폭);
  const 점수폭가운데 = 가운데값(흔들림.map((x) => x.폭));
  const 점수폭최대 = 흔들림.length ? 흔들림[0].폭 : null;

  /* 정확도 — 지면이 안 낸 칸. 0 으로 세지 않는다 */
  const 정확도없음 = F.filter((a) => a.accuracy_not_published).length;

  /* 증권사별 — 끝 판(가장 최근 온전한 스냅숏) 기준 */
  const 끝판 = 갈라짐.온전[갈라짐.온전.length - 1] ?? null;
  const 끝판줄 = A.filter((a) => a.as_of === 끝판);
  const 집계 = {};
  for (const a of 끝판줄) {
    const h = a.house ?? null;
    if (!h) continue;
    const it = (집계[h] = 집계[h] ?? { house_ko: h, house_en: 영문명(h), analysts: 0, accuracy_published: 0, reports: 0 });
    it.analysts += 1;
    if (!a.accuracy_not_published) it.accuracy_published += 1;
  }
  for (const r of R) {
    const h = r.house ?? null;
    if (h && 집계[h]) 집계[h].reports += 1;
  }
  const 증권사 = Object.values(집계).sort((a, b) => b.analysts - a.analysts);

  /* 우리가 score 로 세운 차례 — «우리가 세웠다»를 지면이 밝힌다 */
  const 우리차례 = 끝판줄
    .filter((a) => a.score != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((a, i) => ({
      our_order: i + 1,
      house_en: 영문명(a.house),
      score: a.score,
      stars: a.stars,
      accuracy: a.accuracy,
      accuracy_not_published: a.accuracy_not_published,
    }));

  /* 보고서 축은 «분모»로만 쓴다 — 자세한 것은 /data/target-changes 몫이다 */
  const 목표낸것 = R.filter((r) => r.target_price_krw != null).length;

  /* 🔴 같은 지면의 두 목록이 «같은 곳»을 덮지 않는다 — 실측으로 걸린 것이라 지면에 낸다.
     명부에는 있는데 이 창에 보고서가 한 건도 없는 곳이 있고, 보고서는 내는데 명부에
     아무도 없는 곳이 있다. ⛔ 이것을 0 으로만 적고 넘기지 않는다 — 0 은 「없다」가 아니라
     「두 목록이 다르다」는 뜻이다. */
  const 보고서낸곳 = new Set(R.map((r) => r.house).filter(Boolean));
  const 명부에있는곳 = new Set(끝판줄.map((a) => a.house).filter(Boolean));
  const 명부만 = [...명부에있는곳].filter((h) => !보고서낸곳.has(h)).map((h) => ({ house_ko: h, house_en: 영문명(h) }));
  const 보고서만 = [...보고서낸곳].filter((h) => !명부에있는곳.has(h)).map((h) => ({
    house_ko: h, house_en: 영문명(h), reports: R.filter((r) => r.house === h).length,
  })).sort((a, b) => b.reports - a.reports);

  return {
    /* ⛔ toLocaleString('ko-KR') 은 「오전」을 낸다 — 이 지면은 영문이라 한글이 새면 안 된다.
       ⛔ toISOString() 도 안 쓴다(UTC 라 새벽에 날짜가 어긋난다). 이 PC 가 이미 KST 다. */
    builtOn: 한국시각(),
    source: m.source ?? null,
    windowNote: m.windowNote ?? null,
    accuracyNote: m.accuracyNote ?? null,
    rankNote: m.rankNote ?? null,
    notThis: m.notThis ?? null,

    snapshots: { all: Object.keys(줄수표).sort(), full: 갈라짐.온전, short: 갈라짐.짧음, shortThreshold: 갈라짐.문턱 },
    rowsPerSnapshot: 줄수표,

    analystRows: A.length,
    analystRowsUsed: F.length,
    distinctAnalysts: 사람들.length,
    inEverySnapshot: 다든사람,
    inOneSnapshotOnly: 한판만,
    churnShare: 사람들.length ? Math.round((1 - 다든사람 / 사람들.length) * 1000) / 10 : null,

    scoreSwingMedian: 점수폭가운데 == null ? null : Math.round(점수폭가운데 * 100) / 100,
    scoreSwingMax: 점수폭최대 == null ? null : Math.round(점수폭최대 * 100) / 100,
    scoreSwingMeasuredOn: 흔들림.length,

    accuracyMissing: 정확도없음,
    accuracyMissingShare: F.length ? Math.round((정확도없음 / F.length) * 1000) / 10 : null,

    latestFullSnapshot: 끝판,
    latestRoster: 끝판줄.length,
    houses: 증권사,
    housesMissingEnglishName: 증권사.filter((h) => !h.house_en).length,
    ourOrderTop: 우리차례,

    reports: R.length,
    reportsWithATarget: 목표낸것,
    reportSnapshots: m.reportSnapshots ?? [],
    onRosterNoReports: 명부만,
    filedReportsNotOnRoster: 보고서만,

    whatThisIsNot: [
      'Not a ranking of analysts. The source hands us its list sorted by name, so the number it calls a rank is a row position. Any order on this page is one we computed from the score the source published, and we label it that way.',
      'Not a measure of who is right. Whether a target was met is a separate page.',
      'Not a full roster of Korean analysts. It is the list one Korean site showed on the days we collected it.',
      'Not back-fillable. The source recomputes a rolling one-month window every day and keeps nothing older, so these snapshots exist only because we saved them.',
    ],
  };
}

/* ── 자가시험 — 사장님: 「규칙은 문장이 아니라 검사로 둔다」 ───────────────── */
export function 자가시험() {
  const 흠 = [];
  const 재다 = (이름, 참) => { if (!참) 흠.push(이름); };

  /* 🔴 영문 지면에 한글이 새는 길은 «날짜 표기»였다. 검사로 막는다 */
  재다('찍는 시각에 한글이 없다', !/[가-힣]/.test(한국시각(new Date(2026, 8, 20, 9, 5))));
  재다('KST 를 그대로 쓴다', 한국시각(new Date(2026, 8, 20, 9, 5)) === '2026-09-20 09:05 KST');

  재다('가운데값 홀수', 가운데값([1, 5, 3]) === 3);
  재다('가운데값 짝수', 가운데값([1, 3, 5, 7]) === 4);
  재다('빈 것은 null', 가운데값([]) === null);

  const g = 스냅숏가르기({ a: 90, b: 96, c: 20, d: 79, e: 74 });
  재다('짧은 판을 가려낸다', g.짧음.length === 1 && g.짧음[0] === 'c');
  재다('온전한 판 넷', g.온전.length === 4);
  재다('날짜를 박지 않는다', 스냅숏가르기({ x: 10, y: 10, z: 10 }).짧음.length === 0);

  재다('사전에 있는 이름은 편다', 영문명('LS증권') === 'LS Securities');
  재다('모르는 이름은 지어내지 않는다', 영문명('없는증권') === null);

  const 표 = {
    _meta: { source: '출처', reportSnapshots: ['2026-09-08'] },
    analysts: [
      { analyst_id: 'p1', name: '가', house: 'LS증권', score: 8, stars: 8, accuracy: 50, accuracy_not_published: false, as_of: 'd1' },
      { analyst_id: 'p2', name: '나', house: 'LS증권', score: 9, stars: 9, accuracy: null, accuracy_not_published: true, as_of: 'd1' },
      { analyst_id: 'p1', name: '가', house: 'LS증권', score: 9, stars: 9, accuracy: 50, accuracy_not_published: false, as_of: 'd2' },
      { analyst_id: 'p3', name: '다', house: 'LS증권', score: 7, stars: 7, accuracy: null, accuracy_not_published: true, as_of: 'd2' },
    ],
    reports: [
      { report_id: 1, house: 'LS증권', target_price_krw: 1000 },
      { report_id: 2, house: 'LS증권', target_price_krw: null },
    ],
  };
  const 것 = 짓기(표);
  재다('사람 수', 것.distinctAnalysts === 3);
  재다('두 판에 다 든 사람 하나', 것.inEverySnapshot === 1);
  재다('한 판에만 둘', 것.inOneSnapshotOnly === 2);
  재다('정확도 안 낸 줄 둘', 것.accuracyMissing === 2);
  재다('목표가 낸 보고서 하나', 것.reportsWithATarget === 1);
  재다('끝 판은 나중 날', 것.latestFullSnapshot === 'd2');
  재다('우리가 세운 차례는 점수 내림차순', 것.ourOrderTop[0].score >= 것.ourOrderTop[1].score);
  재다('영문명을 붙인다', 것.houses[0].house_en === 'LS Securities');
  재다('안 적힌 곳을 센다', 것.housesMissingEnglishName === 0);
  재다('rank 라는 칸을 내주지 않는다', !JSON.stringify(것.ourOrderTop).includes('"rank"'));

  /* 두 목록이 어긋나는 것을 잡아내는가 — 실측에서 네 곳이 걸렸다 */
  const 어긋난표 = {
    _meta: {},
    analysts: [{ analyst_id: 'p1', name: '가', house: '명부만있는곳', score: 8, accuracy_not_published: true, as_of: 'd1' }],
    reports: [{ report_id: 1, house: '보고서만내는곳', target_price_krw: 100 }],
  };
  const 어긋난것 = 짓기(어긋난표);
  재다('명부에만 있는 곳을 잡는다', 어긋난것.onRosterNoReports.length === 1);
  재다('보고서만 내는 곳을 잡는다', 어긋난것.filedReportsNotOnRoster.length === 1);
  재다('어긋난 곳의 보고서 수를 센다', 어긋난것.filedReportsNotOnRoster[0].reports === 1);

  return 흠;
}

if (process.argv[1] && process.argv[1].endsWith('build-seoulmarkets-consensus-page.mjs')) {
  const 흠 = 자가시험();
  if (흠.length) { console.log('🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ')); process.exit(1); }
  console.log('✅ 자가시험 23/23');

  if (process.argv.includes('--자가시험')) process.exit(0);

  const 표 = JSON.parse(fs.readFileSync(읽을곳, 'utf8'));
  const 것 = 짓기(표);
  fs.writeFileSync(낼곳, JSON.stringify(것, null, 1), 'utf8');

  console.log('');
  console.log('■ 애널리스트 명부 — 스냅숏 ' + 것.snapshots.all.length + '일 (온전 ' + 것.snapshots.full.length
    + ' · 덜 받힌 것 ' + 것.snapshots.short.length + (것.snapshots.short.length ? ' [' + 것.snapshots.short.join(', ') + ']' : '') + ')');
  console.log('  사람 ' + 것.distinctAnalysts + '명 · 온전한 판에 «다» 든 사람 ' + 것.inEverySnapshot
    + '명 · 한 판에만 든 사람 ' + 것.inOneSnapshotOnly + '명');
  console.log('  ⭐ 열흘 사이 명부에서 한 번이라도 빠진 사람 ' + 것.churnShare + '% — 지면은 어제 명부를 안 남긴다');
  console.log('  점수 진폭 가운데값 ' + 것.scoreSwingMedian + ' · 최대 ' + 것.scoreSwingMax
    + ' (세 판 이상 든 ' + 것.scoreSwingMeasuredOn + '명)');
  console.log('  ⛔ 정확도를 «안 낸» 줄 ' + 것.accuracyMissing + ' (' + 것.accuracyMissingShare + '%) — 0 으로 세지 않았다');
  if (것.housesMissingEnglishName > 0) {
    console.log('  🔴 영문명이 사전에 없는 곳 ' + 것.housesMissingEnglishName + '곳 — 지어내지 않았다');
  }
  console.log('');
  console.log('냈다 — ' + 낼곳);
}
