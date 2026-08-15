#!/usr/bin/env node
/**
 * check-kcw-places-in-korea.mjs — **「한국 장소」 명단에 한국 밖이 섞였나.**
 *
 * ── 🔴 왜 만들었나 (2026-08-16) ────────────────────────────────
 * `/places` 지면이 **베트남어판에서 가장 많이 읽힌 한국 장소**로 「Battle of Khe Sanh」을
 * 싣고 있었다. 케산 전투는 **베트남**에서 있었던 일이다.
 *
 * 수집기는 위키데이터의 **P17(나라)** 로 골랐다. 그런데 P17 은 「어디에 있나」만이 아니라
 * 「누가 얽혔나」도 담는다 — 케산 전투의 P17 은 「남베트남, **대한민국**」이다. 한국이
 * 참전국이라 붙어 있다. 그래서 「한국 장소」로 걸려 들어왔다.
 *
 * 🔴🔴 처음에 나는 P17 로 검사를 짰다. 「한국 아닌 곳 **0**」이 나왔다.
 *   ⛔ 수집기가 쓴 자로 재면 늘 맞는다. **검사는 다른 자를 들어야 한다.**
 *   ⭐ 그래서 **좌표(P625)** 로 잰다. 자리는 참전국을 따라가지 않는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **조용히 빼지 않는다.** 뺀 곳을 이름과 좌표까지 적어 지면이 보이게 한다.
 * ⛔ **상자는 우리가 정한 것**이라고 밝힌다. 넉넉히 잡아 「한국인데 밖으로 샌」 것을 줄인다.
 * ⛔ **좌표를 못 받은 곳을 밖으로 세지 않는다.** 못 받은 것과 밖인 것은 다른 일이다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-places-in-korea.mjs           위키데이터에서 좌표를 받아 다시 잰다
 *   node scripts/check-kcw-places-in-korea.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-places.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-places-outside.json');

/**
 * ⚠ **우리가 정한 상자다.** 한국 본토와 제주·울릉·독도를 넉넉히 감싼다.
 *   넉넉하게 잡는 쪽으로 틀린다 — 「한국인데 밖으로 새는 것」이 「밖인데 남는 것」보다 나쁘다.
 */
export const 상자 = { 남: 32.5, 북: 39.0, 서: 124.0, 동: 132.5 };

export function 안인가(좌표, 네모 = 상자) {
  if (!좌표 || typeof 좌표.lat !== 'number' || typeof 좌표.lon !== 'number') return null;
  return 좌표.lat >= 네모.남 && 좌표.lat <= 네모.북
    && 좌표.lon >= 네모.서 && 좌표.lon <= 네모.동;
}

/** 위키데이터 낱개에서 첫 좌표를 꺼낸다. 없으면 null — **0 이 아니다** */
export function 좌표뽑기(낱개) {
  const v = (낱개?.claims?.P625 ?? [])[0]?.mainsnak?.datavalue?.value;
  if (!v || typeof v.latitude !== 'number' || typeof v.longitude !== 'number') return null;
  return { lat: v.latitude, lon: v.longitude };
}

/** ⭐ 셋으로 가른다 — 안 · 밖 · **못 쟀다**. 셋째를 둘째에 섞지 않는다 */
export function 가르기(곳들, 자리들) {
  const 안 = []; const 밖 = []; const 못쟀다 = [];
  for (const p of 곳들) {
    const c = 자리들.get(p.q);
    const v = 안인가(c);
    if (v === null) 못쟀다.push(p);
    else if (v) 안.push(p);
    else 밖.push({ ...p, lat: c.lat, lon: c.lon });
  }
  return { 안, 밖, 못쟀다 };
}

export function 몫(곳들) {
  return 곳들.reduce((a, p) => a + (p.seaPerMillionTotal ?? 0), 0);
}

export async function 좌표받기(큐들, 알림 = () => {}) {
  const 자리 = new Map();
  for (let i = 0; i < 큐들.length; i += 50) {
    const 묶음 = 큐들.slice(i, i + 50);
    const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims'
      + `&ids=${묶음.join('|')}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'KCultureWire/1.0 (parkintaek2@gmail.com)' },
    });
    /* ⛔ 못 받은 묶음을 「좌표 없음」으로 넘기지 않는다 — 그러면 밖으로 세어진다 */
    if (!r.ok) throw new Error(`위키데이터가 ${r.status} 를 냈다 (${i} 묶음) — 다시 돌려라`);
    const j = await r.json();
    for (const [q, e] of Object.entries(j.entities ?? {})) 자리.set(q, 좌표뽑기(e));
    알림(Math.min(i + 50, 큐들.length), 큐들.length);
  }
  return 자리;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };

  재본다('서울은 안이다', 안인가({ lat: 37.5665, lon: 126.978 }), true);
  재본다('제주는 안이다', 안인가({ lat: 33.4996, lon: 126.5312 }), true);
  재본다('독도는 안이다', 안인가({ lat: 37.2394, lon: 131.8686 }), true);
  /* 🔴 이 한 줄이 이 자를 만든 까닭이다 */
  재본다('⛔⛔ 케산 전투는 밖이다', 안인가({ lat: 16.6539, lon: 106.7242 }), false);
  재본다('⛔ 남극 장보고기지는 밖이다', 안인가({ lat: -74.62, lon: 164.2 }), false);
  재본다('⛔ 로마는 밖이다', 안인가({ lat: 41.9, lon: 12.45 }), false);
  /* ⛔ 못 잰 것을 밖으로 세면 「없는 곳」을 만들어 낸다 */
  재본다('⛔⛔ 좌표가 없으면 밖이 아니라 **모름**', 안인가(null), null);
  재본다('⛔ 반쪽 좌표도 모름', 안인가({ lat: 37.5 }), null);

  재본다('첫 좌표를 꺼낸다',
    좌표뽑기({ claims: { P625: [{ mainsnak: { datavalue: { value: { latitude: 1, longitude: 2 } } } }] } }),
    { lat: 1, lon: 2 });
  재본다('⛔ 좌표 칸이 없으면 null', 좌표뽑기({ claims: {} }), null);

  const 자리 = new Map([['Q1', { lat: 37.5, lon: 127 }], ['Q2', { lat: 16.6, lon: 106.7 }], ['Q3', null]]);
  const 갈린것 = 가르기([{ q: 'Q1', seaPerMillionTotal: 10 }, { q: 'Q2', seaPerMillionTotal: 5 },
    { q: 'Q3', seaPerMillionTotal: 1 }], 자리);
  재본다('⭐ 셋으로 가른다', [갈린것.안.length, 갈린것.밖.length, 갈린것.못쟀다.length], [1, 1, 1]);
  재본다('⛔ 밖인 곳에 좌표를 적어 둔다', 갈린것.밖[0].lat, 16.6);
  재본다('몫을 센다', 몫(갈린것.밖), 5);

  재본다('⭐ 원본이 있다', fs.existsSync(원본길), true);

  console.log(`장소가 한국 안인지 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(원본길, 'utf8'));
  const 곳 = 원.people.filter((p) => /^Q\d+$/.test(p.q ?? ''));
  console.log(`곳 ${곳.length}개의 좌표를 위키데이터에서 받는다…`);

  const 자리 = await 좌표받기(곳.map((p) => p.q), (한, 다) => {
    if (한 % 500 < 50) console.log(`  ${한}/${다}`);
  });
  const { 안, 밖, 못쟀다 } = 가르기(곳, 자리);
  const 다합 = 몫(곳);

  const 자료 = {
    checkedOn: new Date().toISOString().slice(0, 10),
    why: 'The panel was selected on Wikidata\'s country property, which records who was involved '
      + 'as well as where a thing is. The Battle of Khe Sanh carries South Korea as a country '
      + 'because South Korea fought there, so it entered a list of Korean places. We re-tested '
      + 'every place against its coordinates instead, because a location does not follow a '
      + 'belligerent.',
    boxIsOurs: 'The bounding box is ours, drawn generously around the mainland and the islands '
      + `(latitude ${상자.남} to ${상자.북}, longitude ${상자.서} to ${상자.동}). We would rather `
      + 'keep a borderline Korean place than drop one.',
    box: 상자,
    checked: 곳.length,
    inside: 안.length,
    outsideCount: 밖.length,
    notMeasured: 못쟀다.length,
    notMeasuredMeans: 'A place with no coordinate on Wikidata is not counted as outside Korea. '
      + 'Not measured and outside are different things.',
    shareOfReads: +((100 * 몫(밖)) / 다합).toFixed(2),
    outside: 밖.sort((a, b) => (b.seaPerMillionTotal ?? 0) - (a.seaPerMillionTotal ?? 0))
      .map((p) => ({
        q: p.q,
        name: p.name,
        kind: (p.kinds ?? [])[0] ?? null,
        perMillion: p.seaPerMillionTotal ?? null,
        lat: +p.lat.toFixed(4),
        lon: +p.lon.toFixed(4),
      })),
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`\n안 ${안.length} · ⛔ 밖 ${밖.length} · ⚠ 못 쟀다 ${못쟀다.length}`);
  console.log(`읽힘 합에서 밖의 몫 ${자료.shareOfReads}%`);
  for (const p of 자료.outside.slice(0, 10)) {
    console.log(`   ${String(p.perMillion).padStart(8)}  ${p.name.padEnd(38)} ${p.lat},${p.lon}`);
  }
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
