#!/usr/bin/env node
/**
 * **연승 표시(hot streak)가 지역마다 얼마나 다른가** — 넷 중 다섯은 같고 하나만 다르다.
 *
 *   node scripts/build-wikitip-hot-streak.mjs → src/data/wikitip-hot-streak.json
 *   입력 → archive/raw/riot-ladder/<날>/solo-queue.json (이미 받아 둔 것. 새로 안 부른다)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사다리에서 우리가 이미 쓴 것은 **베테랑 비율**(그 티어에 오래 있었나)이다.
 * 같은 파일에 `hot_streak` 가 있는데 한 번도 안 봤다. 봤더니 —
 *   · 여섯 중 **다섯이 1.3포인트 안에** 몰려 있다 (18.7~20.0)
 *   · **북미만 30.8** 이다. 다섯의 위끝보다 10.8포인트 위다
 *
 * ⛔ 「베테랑이 적으니 연승이 많다」로 설명하고 싶어진다. **그게 안 된다** —
 *    동남아 베테랑 37.3, 북미 36.8 로 거의 같은데 연승은 19.0 대 30.8 이다.
 *    나란히 놓으면 설명이 깨진다. 깨진 채로 낸다.
 *
 * ⚠ 일본은 챌린저가 **50명**뿐이다. 한 명이 2포인트다 — 움직임을 크게 읽으면 안 된다.
 * ⚠ 라이엇 열쇠가 죽어 2026-08-06 에서 멈췄다. **사다리는 소급이 안 된다.** 네 날뿐이다.
 */
import fs from 'node:fs';

const D = 'archive/raw/riot-ladder';

/** 몇 퍼센트인가. 사람 수가 0이면 **0이 아니라 null** — 「없다」와 「0%」는 다르다. */
export function 비율(가진수, 전체) {
  if (!전체) return null;
  return +((100 * 가진수) / 전체).toFixed(1);
}

/** 한 명이 몇 포인트인가. 작은 지역에서 이 값이 크면 움직임을 크게 읽으면 안 된다. */
export function 한명값(전체) {
  return 전체 ? +(100 / 전체).toFixed(2) : null;
}

/** 몰려 있는 무리와 떨어진 것을 가른다. **줄세우기가 아니라 「몇이 붙어 있나」다.** */
export function 무리와바깥(값들, 벌어짐 = 5) {
  const s = [...값들].sort((a, b) => a.v - b.v);
  const 무리 = [s[0]];
  for (let i = 1; i < s.length; i++) {
    if (s[i].v - 무리[무리.length - 1].v <= 벌어짐) 무리.push(s[i]);
    else break;
  }
  const 바깥 = s.slice(무리.length);
  return { 무리, 바깥, 무리폭: +(무리[무리.length - 1].v - 무리[0].v).toFixed(1) };
}

if (process.argv[1] && process.argv[1].endsWith('build-wikitip-hot-streak.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('비율을 한 자리로', 비율(56, 300) === 18.7);
  자가('전체가 0이면 null', 비율(0, 0) === null);
  자가('한 명 값', 한명값(50) === 2);
  const t = 무리와바깥([{ v: 18.7 }, { v: 19 }, { v: 19.7 }, { v: 20 }, { v: 20 }, { v: 30.8 }]);
  자가('다섯이 무리를 이룬다', t.무리.length === 5);
  자가('하나가 바깥이다', t.바깥.length === 1 && t.바깥[0].v === 30.8);
  자가('무리 폭', t.무리폭 === 1.3);
  자가('다 붙어 있으면 바깥이 없다', 무리와바깥([{ v: 1 }, { v: 2 }, { v: 3 }]).바깥.length === 0);
  console.log(`연승 자 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 날들 = fs.readdirSync(D).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const 지역 = new Map();
  for (const 날 of 날들) {
    const p = `${D}/${날}/solo-queue.json`;
    if (!fs.existsSync(p)) continue;
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const [code, r] of Object.entries(j.regions)) {
      const 이름 = r.region_name;
      if (!지역.has(이름)) 지역.set(이름, { region: 이름, code, days: [] });
      const c = r.challenger; const g = r.grandmaster;
      지역.get(이름).days.push({
        day: 날,
        challengers: c?.players ?? null,
        hotPc: c ? 비율(c.hot_streak, c.players) : null,
        veteranPc: c ? 비율(c.veteran, c.players) : null,
        gmPlayers: g?.players ?? null,
        gmHotPc: g ? 비율(g.hot_streak, g.players) : null,
        gmVeteranPc: g ? 비율(g.veteran, g.players) : null,
      });
    }
  }

  const 끝날 = 날들[날들.length - 1];
  const rows = [...지역.values()].map((r) => {
    const 끝 = r.days[r.days.length - 1];
    const hot들 = r.days.map((d) => d.hotPc).filter((x) => x != null);
    return {
      region: r.region,
      code: r.code,
      challengers: 끝.challengers,
      /** 한 명이 몇 포인트인가. 일본은 50명이라 2포인트다 */
      onePlayerPoints: 한명값(끝.challengers),
      hotPc: 끝.hotPc,
      veteranPc: 끝.veteranPc,
      gmPlayers: 끝.gmPlayers,
      gmHotPc: 끝.gmHotPc,
      gmVeteranPc: 끝.gmVeteranPc,
      hotRange: { min: Math.min(...hot들), max: Math.max(...hot들), spread: +(Math.max(...hot들) - Math.min(...hot들)).toFixed(1) },
      hotByDay: r.days.map((d) => ({ day: d.day, hotPc: d.hotPc })),
    };
  });

  const 갈림 = 무리와바깥(rows.map((r) => ({ v: r.hotPc, region: r.region })));

  const out = {
    generated: new Date().toLocaleString('ko-KR'),
    source: 'Riot Games Developer API — challenger and grandmaster league entries, queue RANKED_SOLO_5x5. “Hot streak” and “veteran” are Riot’s own per-player flags.',
    sourceKo: '라이엇 개발자 API — 챌린저·그랜드마스터, 연승·베테랑은 라이엇 자체 표시',
    privacy: 'Player identifiers are not stored. Distributions only.',
    days: 날들,
    dayCount: 날들.length,
    asOf: 끝날,
    /** ⚠ 열쇠가 죽어 여기서 멈췄다. 사다리는 소급이 안 된다 */
    stalled: 'Collection stopped after this day because the API key expired. Ladder state cannot be backfilled, so these four days are all there will ever be for this window.',
    rows,
    cluster: {
      note: 'Regions whose hot-streak share sits within five points of the next one down, counted from the bottom. This is not a ranking; it is a count of how many sit together.',
      inCluster: 갈림.무리.map((x) => x.region),
      clusterSpread: 갈림.무리폭,
      clusterMin: 갈림.무리[0].v,
      clusterMax: 갈림.무리[갈림.무리.length - 1].v,
      outside: 갈림.바깥.map((x) => ({ region: x.region, hotPc: x.v, aboveClusterBy: +(x.v - 갈림.무리[갈림.무리.length - 1].v).toFixed(1) })),
    },
    /** ⛔ 「베테랑이 적으니 연승이 많다」가 안 되는 것을 자료로 박아 둔다 */
    counterexample: (() => {
      const s = [...rows].sort((a, b) => a.veteranPc - b.veteranPc);
      return {
        note: 'The two least-veteran regions have almost the same veteran share and completely different hot-streak shares, so low veteran share does not explain a high hot-streak share.',
        pair: s.slice(0, 2).map((r) => ({ region: r.region, veteranPc: r.veteranPc, hotPc: r.hotPc })),
        veteranGap: +Math.abs(s[0].veteranPc - s[1].veteranPc).toFixed(1),
        hotGap: +Math.abs(s[0].hotPc - s[1].hotPc).toFixed(1),
      };
    })(),
  };
  fs.writeFileSync('src/data/wikitip-hot-streak.json', JSON.stringify(out, null, 2));

  console.log(`날 ${out.dayCount} · 지역 ${rows.length}`);
  console.log(`무리 ${out.cluster.inCluster.length}곳 ${out.cluster.clusterMin}~${out.cluster.clusterMax} (폭 ${out.cluster.clusterSpread})`);
  for (const o of out.cluster.outside) console.log(`  바깥 — ${o.region} ${o.hotPc} (무리 위끝보다 ${o.aboveClusterBy} 위)`);
  console.log(`반례 — ${out.counterexample.pair.map((p) => `${p.region} vet ${p.veteranPc}/hot ${p.hotPc}`).join(' vs ')} (베테랑 차 ${out.counterexample.veteranGap} · 연승 차 ${out.counterexample.hotGap})`);
}
