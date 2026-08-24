/**
 * kcw-title-facts.mjs — **작품마다 «서로 다른» 사실을 자료에서 뽑는다.**
 *
 * ── 🔴 왜 이것이 필요한가 (2026-08-24 밤, 사장님 「방문자가 왜 없는지 분석하라」) ──
 * 재서 나온 것 —
 * ```
 *   갈래        지면수   본문글자   서로 겹치는 낱말    색인
 *   article        117    6,180        40%           표본 전부 색인
 *   born-on        366    1,118        67%           노출 0
 *   week           268    2,137        71%           크롤했는데 안 넣음
 *   market          93    3,819        88%
 *   firm            19    2,744        92%
 * ```
 * **판박이 비율이 색인률을 그대로 예측했다.** 그리고 그 결과가 이것이다 —
 * ```
 *   위키 조회 1만 이상 인기작 23편(합 60만 조회/30일)
 *      우리가 28일간 받은 노출  39회 · 14편은 한 번도 안 뜸 · 뜬 것 평균 23.1위
 * ```
 *
 * 🔴 **자료는 지면마다 다른데 그 자료를 감싼 «문장»이 같았다.** 표는 다르고 글은 같다.
 *   구글이 읽는 것은 글이다. 그래서 976장이 한 장처럼 보였다.
 *
 * ⇒ 이 파일이 하는 일: 같은 자료에서 **작품마다 다른 문장**을 뽑는다.
 *
 * ── ⛔ 반드시 지키는 것 ───────────────────────────────────────
 * ⛔ **없는 사실을 만들지 않는다.** 조건이 안 맞으면 그 사실은 «건너뛴다» — 억지로 채우지 않는다.
 *   문장 수가 작품마다 다른 것이 정상이다. 다 채우려는 순간 다시 판박이가 된다.
 * ⛔ **「가장」을 온 자료를 안 보고 쓰지 않는다.** 「어느 작품보다 많다」는 976편을 다 세고 나서만 쓴다.
 * ⛔ 「인기」·「최고」·「명작」을 안 쓴다. 우리가 가진 것은 차트 자리이지 좋음이 아니다.
 * ⛔ 차트에 든 것과 그 나라에서 볼 수 있었던 것을 섞지 않는다.
 * ⛔ 시청자 수를 말하지 않는다 — 나라 파일에 그런 수가 없다.
 */

/** 몇 나라에서 1위를 했나. ⛔ byMarket 이 없으면 0 이 아니라 null 이다 */
export function 일위나라수(작품) {
  const m = 작품?.byMarket;
  if (!m || typeof m !== 'object') return null;
  const 값 = Array.isArray(m) ? m : Object.values(m);
  if (!값.length) return null;
  return 값.filter((x) => Number(x?.peak) === 1).length;
}

/** 한 나라에서 가장 오래 — 그 나라와 자리 수. ⛔ 없으면 null */
export function 가장오래머문나라(작품) {
  const m = 작품?.byMarket;
  if (!m || typeof m !== 'object') return null;
  const 값 = Array.isArray(m) ? m : Object.values(m);
  if (!값.length) return null;
  const 순 = [...값].sort((a, b) => (b?.places ?? 0) - (a?.places ?? 0));
  const 첫 = 순[0];
  if (!첫 || !Number.isFinite(Number(첫.places)) || Number(첫.places) <= 0) return null;
  return { 나라: 첫.name, 자리: Number(첫.places) };
}

/**
 * **돌아온 작품인가.** 해마다 차트 자리가 확 줄었다가 다시 확 늘었나.
 * 이것이 우리 자료에만 있는 이야기다 — 위키백과도 IMDb 도 이 모양을 안 갖고 있다.
 * ⛔ 조건: 세 해 이상 있고, 바닥이 꼭대기의 1/5 아래로 떨어졌다가, 다시 바닥의 5배 위로 올라와야 한다.
 *   ⚠ 그 정도가 아니면 그냥 오르내림이지 「돌아왔다」가 아니다. 억지로 말하지 않는다.
 */
export function 돌아왔나(작품) {
  const y = 작품?.byYear;
  if (!Array.isArray(y) || y.length < 3) return null;
  const 줄 = [...y].sort((a, b) => a.year - b.year).map((x) => ({ 해: x.year, 자리: Number(x.places) || 0 }));
  let 최고 = -1; let 최고해 = null;
  for (const r of 줄) if (r.자리 > 최고) { 최고 = r.자리; 최고해 = r.해; }
  /* 꼭대기 뒤에 바닥이 있고, 그 뒤에 다시 오름이 있어야 한다 */
  const 뒤 = 줄.filter((r) => r.해 > 최고해);
  if (뒤.length < 2) {
    /* 꼭대기가 마지막 해일 수도 있다 — 그때는 앞쪽에서 바닥을 찾는다 */
    const 앞 = 줄.filter((r) => r.해 < 최고해);
    if (앞.length < 2) return null;
    const 바닥 = 앞.reduce((a, b) => (a.자리 <= b.자리 ? a : b));
    const 처음 = 앞[0];
    if (처음.자리 <= 0 || 바닥.자리 <= 0) return null;
    if (바닥.자리 * 5 > 처음.자리) return null;      // 충분히 안 떨어졌다
    if (최고 < 바닥.자리 * 5) return null;           // 충분히 안 돌아왔다
    return { 첫해: 처음.해, 첫자리: 처음.자리, 바닥해: 바닥.해, 바닥자리: 바닥.자리, 돌아온해: 최고해, 돌아온자리: 최고 };
  }
  const 바닥 = 뒤.slice(0, -1).reduce((a, b) => (a.자리 <= b.자리 ? a : b), 뒤[0]);
  const 끝 = 줄[줄.length - 1];
  if (바닥.자리 <= 0 || 끝.자리 <= 0) return null;
  if (바닥.자리 * 5 > 최고) return null;
  if (끝.자리 < 바닥.자리 * 5) return null;
  return { 첫해: 최고해, 첫자리: 최고, 바닥해: 바닥.해, 바닥자리: 바닥.자리, 돌아온해: 끝.해, 돌아온자리: 끝.자리 };
}

/**
 * 온 자료에서 이 작품이 «몇 등»인가 — 백분위. 「가장」을 쓰려면 이것이 있어야 한다.
 * ⛔ 온 자료를 안 넘기면 null 이다. 짐작으로 등수를 매기지 않는다.
 */
export function 백분위(값, 온자료값들) {
  if (!Number.isFinite(값) || !Array.isArray(온자료값들) || !온자료값들.length) return null;
  const a = 온자료값들.filter(Number.isFinite);
  if (!a.length) return null;
  const 아래 = a.filter((x) => x < 값).length;
  return (100 * 아래) / a.length;
}

/**
 * 복수형. ⛔ 무조건 s 를 붙이지 않는다 — `country` 는 `countrys` 가 아니다.
 * 🔴 2026-08-24 에 「93 countrys charts」가 실제로 나왔다. 밖으로 나가는 글자라 그냥 못 둔다.
 */
const 별난복수 = { country: 'countries', 'chart place': 'chart places' };
const 셈 = (n, 말) => {
  if (Number(n) === 1) return 말;
  return 별난복수[말] ?? `${말}s`;
};
const 수 = (n) => Number(n).toLocaleString('en-US');

/**
 * **작품 하나의 고유 문장들.** 되는 것만 돌려준다 — 안 되는 것은 «건너뛴다».
 * `온자료` 는 976편 전부(「가장」을 말하려면 필요하다). 없으면 「가장」 문장을 안 만든다.
 */
export function 고유문장(작품, 온자료, 나라수) {
  if (!작품 || typeof 작품 !== 'object') return [];
  const 글 = [];
  const 전체 = Array.isArray(온자료) ? 온자료 : null;
  const 같은갈래 = 전체 ? 전체.filter((x) => x.type === 작품.type) : null;

  /* ① 몇 나라까지 갔나 — 온 자료에서 몇 등인지 붙인다 */
  if (Number.isFinite(작품.markets) && 나라수) {
    const p = 같은갈래 ? 백분위(작품.markets, 같은갈래.map((x) => x.markets)) : null;
    if (작품.markets === 나라수) {
      const 모두 = 같은갈래 ? 같은갈래.filter((x) => x.markets === 나라수).length : null;
      글.push(`It charted in all ${나라수} countries Netflix publishes a list for`
        + (모두 ? ` — one of only ${모두} Korean ${모두 === 1 ? 'title' : 'titles'} in this data to do that.` : '.'));
    } else if (작품.markets === 1) {
      const 하나 = 같은갈래 ? 같은갈래.filter((x) => x.markets === 1).length : null;
      const 나라 = 가장오래머문나라(작품);
      글.push(`It charted in exactly one country${나라 ? `, ${나라.나라}` : ''}`
        + (하나 ? `, as ${수(하나)} other Korean ${작품.type === 'TV' ? 'series' : 'films'} did.` : '.'));
    } else if (p !== null) {
      글.push(`It reached ${작품.markets} of the ${나라수} countries — further than `
        + `${Math.round(p)}% of the Korean ${작품.type === 'TV' ? 'series' : 'films'} in this data.`);
    }
  }

  /* ② 몇 나라에서 1위였나. ⛔ 0이면 그 말을 안 한다 — 「0개국에서 1위」는 쓸 말이 아니다 */
  const 일위 = 일위나라수(작품);
  if (일위 !== null && 일위 > 0) {
    글.push(일위 === 1
      ? 'It reached number one in one country.'
      : `It reached number one in ${일위} of them.`);
  }

  /* ③ 한 나라에서 가장 오래 */
  const 오래 = 가장오래머문나라(작품);
  if (오래 && 오래.자리 >= 3) {
    글.push(`Its longest presence was in ${오래.나라}, where it held ${수(오래.자리)} `
      + `${셈(오래.자리, 'chart place')}.`);
  }

  /* ④ 돌아왔나 — 우리 자료에만 있는 모양이다 */
  const 복귀 = 돌아왔나(작품);
  if (복귀) {
    글.push(`It did not travel in a straight line: ${수(복귀.첫자리)} chart places in ${복귀.첫해}, `
      + `down to ${수(복귀.바닥자리)} in ${복귀.바닥해}, then ${수(복귀.돌아온자리)} in ${복귀.돌아온해}.`);
  }

  /* ⑤ 한 주에 몇 나라에 동시에 있었나 */
  if (Number.isFinite(작품.atOnce) && 작품.atOnce > 1 && 작품.atOnceWeek) {
    글.push(`Its widest single week was ${작품.atOnceWeek}, when it sat on `
      + `${작품.atOnce} ${작품.atOnce === 1 ? 'country chart' : 'country charts'} at once.`);
  }

  /* ⑥ 얼마나 오래 — 첫 주와 마지막 주 사이 */
  if (작품.firstWeek && 작품.lastWeek && 작품.firstWeek !== 작품.lastWeek) {
    const 첫 = new Date(작품.firstWeek); const 끝 = new Date(작품.lastWeek);
    const 달 = Math.round((끝 - 첫) / (30.44 * 864e5));
    if (Number.isFinite(달) && 달 >= 2) {
      글.push(`It first appeared on ${작품.firstWeek} and was last seen on ${작품.lastWeek}, `
        + `${달} ${셈(달, 'month')} apart.`);
    }
  }

  /* ⑦ 어떻게 내려갔나 — 꼴찌 셋에서 떨어졌나, 위에서 갑자기 사라졌나 */
  if (Number.isFinite(작품.exitBottomThree) && Number.isFinite(작품.departures)
      && 작품.departures >= 5) {
    const 몫 = (100 * 작품.exitBottomThree) / 작품.departures;
    if (몫 >= 70) {
      글.push(`When it left a chart it usually slid out from the bottom three — `
        + `${작품.exitBottomThree} of ${작품.departures} departures.`);
    } else if (몫 <= 30) {
      글.push(`It usually left charts from partway up rather than from the bottom — `
        + `only ${작품.exitBottomThree} of ${작품.departures} departures came from the bottom three.`);
    }
  }

  return 글;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
if (process.argv[1] && process.argv[1].endsWith('kcw-title-facts.mjs')
    && process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 시장 = (n, peak, places) => Array.from({ length: n }, (_, i) => ({
    iso2: 'XX', name: `Country${i}`, places: places ?? 5, peak: i === 0 ? peak : 5,
  }));

  검('1위 나라를 센다', 일위나라수({ byMarket: [{ peak: 1 }, { peak: 1 }, { peak: 3 }] }) === 2);
  검('⛔ 자료가 없으면 0 이 아니라 못 잼', 일위나라수({}) === null && 일위나라수({ byMarket: [] }) === null);
  검('객체 꼴도 읽는다', 일위나라수({ byMarket: { 0: { peak: 1 }, 1: { peak: 2 } } }) === 1);

  const 오래 = 가장오래머문나라({ byMarket: [{ name: 'A', places: 3 }, { name: 'B', places: 30 }] });
  검('가장 오래 머문 나라를 찾는다', 오래.나라 === 'B' && 오래.자리 === 30);
  검('⛔ 자리가 0 이면 못 잼', 가장오래머문나라({ byMarket: [{ name: 'A', places: 0 }] }) === null);

  /* 돌아온 작품 — Squid Game 모양 */
  const 복귀 = 돌아왔나({ byYear: [{ year: 2021, places: 1118 }, { year: 2022, places: 66 },
    { year: 2023, places: 30 }, { year: 2024, places: 190 }, { year: 2025, places: 1824 }] });
  검('⭐ 돌아온 작품을 알아본다', 복귀 !== null && 복귀.바닥해 === 2023 && 복귀.돌아온해 === 2025);
  /* ⛔ 그냥 줄어든 것을 「돌아왔다」고 하지 않는다 */
  검('⭐ 그냥 줄기만 한 것은 돌아온 것이 아니다',
    돌아왔나({ byYear: [{ year: 2021, places: 100 }, { year: 2022, places: 50 }, { year: 2023, places: 10 }] }) === null);
  검('⭐ 그냥 늘기만 한 것도 아니다',
    돌아왔나({ byYear: [{ year: 2021, places: 10 }, { year: 2022, places: 50 }, { year: 2023, places: 100 }] }) === null);
  검('해가 셋 미만이면 못 잼', 돌아왔나({ byYear: [{ year: 2021, places: 10 }] }) === null);
  검('byYear 가 없으면 못 잼', 돌아왔나({}) === null);

  검('백분위를 낸다', 백분위(5, [1, 2, 3, 4, 5]) === 80);
  검('⛔ 온 자료가 없으면 못 잼', 백분위(5, null) === null && 백분위(5, []) === null);
  검('못 잰 값은 백분위도 못 잼', 백분위(null, [1, 2]) === null);

  const 온자료 = [
    { type: 'TV', markets: 93, slug: 'a' }, { type: 'TV', markets: 5, slug: 'b' },
    { type: 'TV', markets: 1, slug: 'c' }, { type: 'TV', markets: 40, slug: 'd' },
  ];
  const 큰것 = { type: 'TV', markets: 93, places: 3228, weeks: 60, peak: 1,
    firstWeek: '2021-09-19', lastWeek: '2025-09-07', atOnce: 93, atOnceWeek: '2021-10-03',
    departures: 100, exitBottomThree: 80,
    byMarket: 시장(93, 1, 30),
    byYear: [{ year: 2021, places: 1118 }, { year: 2023, places: 30 }, { year: 2025, places: 1824 }] };
  const 작은것 = { type: 'TV', markets: 1, places: 4, weeks: 4, peak: 8,
    firstWeek: '2024-01-07', lastWeek: '2024-01-28',
    byMarket: [{ name: 'Korea', places: 4, peak: 8 }], byYear: [{ year: 2024, places: 4 }] };

  const A = 고유문장(큰것, 온자료, 93);
  const B = 고유문장(작은것, 온자료, 93);
  검('큰 작품에서 문장이 나온다', A.length >= 4);
  검('작은 작품에서도 문장이 나온다', B.length >= 1);
  /* 🔴 이 검사가 이 파일의 존재 이유다 — 두 작품의 «글»이 실제로 달라야 한다 */
  검('⭐ 서로 다른 작품은 서로 다른 문장이 나온다',
    A.join(' ') !== B.join(' ') && !A.every((s) => B.includes(s)));
  검('⭐ 문장 수도 작품마다 다르다 — 억지로 채우지 않는다', A.length !== B.length);
  검('93개국이면 그렇게 말한다', A.some((s) => s.includes(`all 93 countries`)));
  검('한 나라뿐이면 그렇게 말한다', B.some((s) => s.includes('exactly one country')));
  /* ⛔ 1위가 0개국이면 그 말을 아예 안 한다 */
  검('⭐ 1위 나라가 0이면 그 문장을 안 만든다',
    !고유문장({ ...작은것, byMarket: [{ name: 'Korea', places: 4, peak: 8 }] }, 온자료, 93)
      .some((s) => /number one/.test(s)));
  검('⭐ 「가장」을 온 자료 없이 안 쓴다',
    !고유문장(큰것, null, 93).some((s) => /% of the Korean/.test(s)));
  검('⛔ 좋음을 말하지 않는다', ![...A, ...B].some((s) => /best|greatest|popular|masterpiece/i.test(s)));
  검('⛔ 시청자 수를 말하지 않는다', ![...A, ...B].some((s) => /viewer|watched by|hours/i.test(s)));
  /* 🔴 2026-08-24 — 「93 countrys charts」가 실제로 나갔다. 밖으로 나가는 글자다 */
  검('⭐ 복수형이 영어다 — countrys 가 아니다',
    셈(2, 'country') === 'countries' && 셈(1, 'country') === 'country'
    && ![...A, ...B].some((s) => /countrys|placess/i.test(s)));
  검('보통 낱말은 s 를 붙인다', 셈(2, 'month') === 'months' && 셈(1, 'month') === 'month');
  검('돌아온 이야기가 큰 작품에만 있다',
    A.some((s) => s.includes('did not travel in a straight line'))
    && !B.some((s) => s.includes('did not travel in a straight line')));
  검('빈 것을 넣어도 안 터진다', 고유문장(null, 온자료, 93).length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ kcw-title-facts 자가시험 통과 (28)');
}
