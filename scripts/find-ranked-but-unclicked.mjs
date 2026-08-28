#!/usr/bin/env node
/**
 * find-ranked-but-unclicked.mjs — **떠 있는데 안 눌리는 지면**을 찾는다. (5번, 2026-08-28)
 *
 * ── 🔴 왜 이 자가 생겼나 ────────────────────────────────────────
 * 2026-08-28 백서를 합쳐 보니 네 유닛의 병목이 다 달랐다 —
 *   5번 «색인» · 6번 «순위» · 3번 «발견» · 4번 «클릭».
 * 나는 내 병목을 「색인」 하나로 알고 8월을 보냈다. 그런데 같은 날 오후에
 * 내 지면 하나(`/netflix-top10-data`)를 재 보니 **노출 111 · 순위 5.3 · 클릭 1** 이었다.
 * 1페이지 안에 떠 있는데 안 눌린 것이다 — **그것은 4번의 병목이지 내 것이 아니라고 여겼던 것이다.**
 *
 * ⭐ 그래서 배운 것 — **병목은 사이트마다가 아니라 «지면마다» 다르다.**
 *   색인이 안 된 지면과, 색인은 됐는데 순위가 낮은 지면과, 순위는 높은데 안 눌리는 지면은
 *   **약이 다르다.** 하나로 뭉뚱그리면 셋 다 못 고친다.
 *
 * ── 이 자가 «하는» 말과 «안 하는» 말 ────────────────────────────
 * ✅ 한다   「이 지면은 N번 떠서 M번 눌렸다. 그 순위에서 보통 기대되는 것은 K번이다」
 * ⛔ 안 한다 「제목이 나빠서다」 — 까닭은 이 자가 모른다. 그것은 사람이 지면을 열어 봐야 안다
 * ⛔ 안 한다 노출이 적은 지면을 판정하는 것. 우리 규칙은 **노출 150** 이다
 *          (2026-08-27, 4번이 노출 88·클릭 0을 「효과 없음」으로 적었다가 정정한 데서 나왔다)
 *
 * ⚠ 기대 클릭률은 **업계에서 널리 쓰이는 어림값**이지 우리가 잰 값이 아니다.
 *   그래서 이 자는 「몇 배 아래다」까지만 말하고 「몇 클릭을 잃었다」고는 말하지 않는다.
 *
 * 쓰는 법
 *   node scripts/find-ranked-but-unclicked.mjs --자가시험
 *   node scripts/find-ranked-but-unclicked.mjs --잰다
 *   node scripts/find-ranked-but-unclicked.mjs --잰다 --바닥=50   (노출 바닥값을 낮춰 «본다»)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/** 판정에 필요한 노출 바닥값. 🔴 이 수는 4번의 사고에서 나왔다 — 8장 참고 */
export const 판정바닥 = 150;

/**
 * 순위별로 «보통 기대되는» 클릭률(%). 널리 쓰이는 어림값이다.
 * ⚠ 우리가 잰 값이 아니다. 그래서 이 자는 이 값으로 «몇 배 아래인가»만 말한다.
 */
export const 기대클릭률 = [
  { 순위: 1, 률: 27.6 }, { 순위: 2, 률: 15.8 }, { 순위: 3, 률: 11.0 },
  { 순위: 4, 률: 8.4 }, { 순위: 5, 률: 6.3 }, { 순위: 6, 률: 4.9 },
  { 순위: 7, 률: 3.9 }, { 순위: 8, 률: 3.2 }, { 순위: 9, 률: 2.8 },
  { 순위: 10, 률: 2.4 },
];

/**
 * 순위를 기대 클릭률로 바꾼다.
 * ⛔ 10위 밖은 «2페이지»다. 기대값을 억지로 만들지 않고 null 을 준다 —
 *   그 지면의 약은 「클릭」이 아니라 「순위」이기 때문이다. 갈래가 다르면 약도 다르다.
 */
export function 순위를기대율로(순위) {
  const p = Number(순위);
  if (!Number.isFinite(p) || p < 1) return null;
  if (p > 10.5) return null;              // 2페이지 — 이 자가 다룰 자리가 아니다
  const 아래 = Math.floor(p); const 위 = Math.ceil(p);
  const a = 기대클릭률.find((x) => x.순위 === Math.min(아래, 10));
  const b = 기대클릭률.find((x) => x.순위 === Math.min(위, 10));
  if (!a || !b) return null;
  if (아래 === 위) return a.률;
  return a.률 + (b.률 - a.률) * (p - 아래);   // 두 순위 사이를 곧게 잇는다
}

/**
 * 지면 한 줄을 갈래로 나눈다.
 * 🔴 **이것이 이 자의 알맹이다.** 「검색이 안 된다」를 셋으로 가른다 —
 *   약이 다르기 때문이다.
 */
export function 갈래(줄, 바닥 = 판정바닥) {
  /* ⛔ null 을 Number() 에 넣으면 0 이 된다 — 「클릭 0」과 「클릭을 못 쟀다」는 다른 말이다.
     오늘 아침 다른 자에서 같은 데 걸렸다. 여기서는 처음부터 막는다. */
  const 빈값 = (v) => v === null || v === undefined || v === '';
  if (빈값(줄?.impressions) || 빈값(줄?.clicks) || 빈값(줄?.position)) {
    return { 갈래: '못잼', 까닭: '노출·클릭·순위 중 없는 것이 있다' };
  }
  const 노출 = Number(줄?.impressions);
  const 클릭 = Number(줄?.clicks);
  const 순위 = Number(줄?.position);
  if (!Number.isFinite(노출) || !Number.isFinite(클릭) || !Number.isFinite(순위)) {
    return { 갈래: '못잼', 까닭: '노출·클릭·순위 중 없는 것이 있다' };
  }
  if (노출 < 바닥) {
    return { 갈래: '표본부족', 까닭: `노출 ${노출} — 바닥값 ${바닥} 아래라 판정하지 않는다` };
  }
  const 기대율 = 순위를기대율로(순위);
  if (기대율 === null) {
    return { 갈래: '순위가문제', 까닭: `평균 ${순위.toFixed(1)}위 — 2페이지다. 클릭 이전에 순위다` };
  }
  const 실제율 = (100 * 클릭) / 노출;
  const 배 = 실제율 > 0 ? 기대율 / 실제율 : Infinity;
  if (배 >= 2) {
    return { 갈래: '안눌린다', 까닭: `${순위.toFixed(1)}위인데 클릭률 ${실제율.toFixed(1)}% — 보통 ${기대율.toFixed(1)}%`, 배, 실제율, 기대율 };
  }
  return { 갈래: '괜찮다', 까닭: `${순위.toFixed(1)}위 · 클릭률 ${실제율.toFixed(1)}% (보통 ${기대율.toFixed(1)}%)`, 배, 실제율, 기대율 };
}

/** 주소에서 갈래 이름을 뽑는다 — `/born-on/01-10` → `/born-on` */
export function 지면갈래(주소) {
  const s = String(주소 ?? '');
  const m = s.match(/^https?:\/\/[^/]+\/([^/?#]+)/);
  if (!m) return '(뿌리)';
  return `/${m[1]}`;
}

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, 참) => { if (참) 통 += 1; else 실.push(이름); };

  검('1위 기대율이 표 그대로', 순위를기대율로(1) === 27.6);
  검('5위 기대율이 표 그대로', 순위를기대율로(5) === 6.3);
  검('사이 순위는 곧게 잇는다', Math.abs(순위를기대율로(5.5) - 5.6) < 0.05);
  /* ⛔ 2페이지는 이 자가 다룰 자리가 아니다 — 약이 다르다 */
  검('11위는 기대율을 안 만든다', 순위를기대율로(11) === null);
  검('빈 값은 null', 순위를기대율로(null) === null && 순위를기대율로('가') === null);
  검('0위 같은 헛것도 null', 순위를기대율로(0) === null);

  /* 🔴 이것이 실제로 본 값이다 — /netflix-top10-data */
  const 넷 = 갈래({ impressions: 111, clicks: 1, position: 5.3 });
  검('노출 111 은 판정하지 않는다', 넷.갈래 === '표본부족');
  검('표본부족일 때 까닭에 바닥값을 적는다', /150/.test(넷.까닭));

  const 안눌림 = 갈래({ impressions: 400, clicks: 2, position: 5.0 });
  검('충분히 떴는데 안 눌리면 「안눌린다」', 안눌림.갈래 === '안눌린다');
  검('몇 배 아래인지 적는다', 안눌림.배 > 10);

  const 순위문제 = 갈래({ impressions: 400, clicks: 0, position: 20.2 });
  검('2페이지는 「순위가문제」다', 순위문제.갈래 === '순위가문제');
  /* ⛔ 2페이지 지면을 「안 눌린다」로 적으면 제목을 고치게 된다 — 약이 틀린다 */
  검('2페이지를 「안눌린다」로 적지 않는다', 순위문제.갈래 !== '안눌린다');

  검('기대만큼 눌리면 「괜찮다」', 갈래({ impressions: 400, clicks: 25, position: 5.0 }).갈래 === '괜찮다');
  검('없는 값은 못잼', 갈래({ impressions: 400, clicks: null, position: 5 }).갈래 === '못잼');
  검('빈 것을 넣어도 안 죽는다', 갈래(null).갈래 === '못잼' && 갈래(undefined).갈래 === '못잼');
  검('바닥값을 낮춰 볼 수 있다', 갈래({ impressions: 111, clicks: 1, position: 5.3 }, 50).갈래 === '안눌린다');

  검('갈래 이름을 뽑는다', 지면갈래('https://a.com/born-on/01-10') === '/born-on');
  검('한 칸짜리도 뽑는다', 지면갈래('https://a.com/workforce') === '/workforce');
  검('뿌리는 뿌리라 적는다', 지면갈래('https://a.com/') === '(뿌리)');
  검('빈 것도 안 죽는다', 지면갈래(null) === '(뿌리)');

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 떠 있는데 안 눌리는 지면을 찾는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (내가실행됐다 && process.argv.includes('--잰다')) {
  const 바닥 = Number((process.argv.find((a) => a.startsWith('--바닥=')) ?? '').split('=')[1] ?? 판정바닥);
  const 길 = path.join(뿌리, 'src/data/kcw-gsc-pages.json');
  if (!fs.existsSync(길)) {
    console.error('⛔ src/data/kcw-gsc-pages.json 이 없다. 먼저 이것을 돌려라 —');
    console.error('   node scripts/search-console-report.mjs sc-domain:kculturewire.com --days 28 --축=page --행수=1000 --적는다=src/data/kcw-gsc-pages.json');
    process.exit(1);
  }
  const j = JSON.parse(fs.readFileSync(길, 'utf8'));
  const 줄들 = j.rows ?? [];

  console.log('■ 떠 있는데 안 눌리는 지면 — 「검색이 안 된다」를 셋으로 가른다');
  console.log(`  창 ${j.window?.from} ~ ${j.window?.to} · 지면 ${줄들.length}장 · 판정 바닥값 노출 ${바닥}\n`);

  const 통 = new Map();
  const 안눌림 = []; const 순위문제 = [];
  for (const r of 줄들) {
    const g = 갈래(r, 바닥);
    통.set(g.갈래, (통.get(g.갈래) ?? 0) + 1);
    if (g.갈래 === '안눌린다') 안눌림.push({ ...r, ...g });
    if (g.갈래 === '순위가문제') 순위문제.push({ ...r, ...g });
  }

  for (const [k, v] of [...통].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(k).padEnd(8)} ${String(v).padStart(4)}장`);
  }

  if (안눌림.length) {
    console.log('\n🔴 **떠 있는데 안 눌린다** — 약은 «제목·설명»이다');
    for (const r of 안눌림.sort((a, b) => b.impressions - a.impressions).slice(0, 15)) {
      console.log(`   노출 ${String(r.impressions).padStart(5)} · 클릭 ${String(r.clicks).padStart(3)} · ${r.까닭}`);
      console.log(`      ${r.key}`);
    }
  } else {
    console.log(`\n⚠ 「안 눌린다」로 판정된 지면 **0장**. 노출 ${바닥} 을 넘긴 지면 자체가 적다는 뜻일 수 있다 —`);
    console.log('   --바닥=50 으로 «보기만» 해 보라. ⛔ 다만 그것으로 판정하지는 않는다.');
  }

  if (순위문제.length) {
    console.log('\n⚠ **2페이지에 있다** — 약은 제목이 아니라 «순위»다(롱테일·깊이)');
    for (const r of 순위문제.sort((a, b) => b.impressions - a.impressions).slice(0, 10)) {
      console.log(`   노출 ${String(r.impressions).padStart(5)} · ${r.까닭}`);
      console.log(`      ${r.key}`);
    }
  }

  /* ⛔ 갈래별로도 낸다 — 한 장이 아니라 «갈래»가 문제인 경우가 있다 */
  const 갈래별 = new Map();
  for (const r of 줄들) {
    const k = 지면갈래(r.key);
    const cur = 갈래별.get(k) ?? { 장: 0, 노출: 0, 클릭: 0, 순위합: 0 };
    cur.장 += 1; cur.노출 += r.impressions ?? 0; cur.클릭 += r.clicks ?? 0;
    cur.순위합 += (r.position ?? 0) * (r.impressions ?? 0);
    갈래별.set(k, cur);
  }
  console.log('\n■ 갈래별 — 노출이 많은 순 (⚠ 순위는 노출로 무게를 준 평균)');
  console.log(`  ${'갈래'.padEnd(22)} ${'장'.padStart(5)} ${'노출'.padStart(7)} ${'클릭'.padStart(5)} ${'클릭률'.padStart(7)} ${'순위'.padStart(6)}`);
  for (const [k, v] of [...갈래별].sort((a, b) => b[1].노출 - a[1].노출).slice(0, 15)) {
    const 률 = v.노출 > 0 ? `${((100 * v.클릭) / v.노출).toFixed(1)}%` : '못잼';
    const 순 = v.노출 > 0 ? (v.순위합 / v.노출).toFixed(1) : '못잼';
    console.log(`  ${k.padEnd(22)} ${String(v.장).padStart(5)} ${String(v.노출).padStart(7)} ${String(v.클릭).padStart(5)} ${률.padStart(7)} ${순.padStart(6)}`);
  }

  console.log('\n⛔ 이 자는 «왜» 안 눌리는지 모른다. 그것은 지면을 열어 봐야 안다.');
  console.log('⛔ 노출이 바닥값 아래인 지면은 판정하지 않았다 — 「효과 없음」과 「아직 못 잼」은 다른 말이다.');
}
