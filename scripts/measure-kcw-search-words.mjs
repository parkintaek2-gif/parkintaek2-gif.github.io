#!/usr/bin/env node
/**
 * measure-kcw-search-words.mjs — **손님이 실제로 친 말과 우리 제목을 맞대 본다.**
 *
 * ── 왜 (2026-08-23) ──────────────────────────────────────────
 * 검색 실측 28일치를 처음으로 낱말 단위로 봤다. 그림이 하나로 모였다 —
 * 우리에게 오는 검색은 대부분 「**작품이름 + netflix + 어느 나라**」 꼴이다.
 * 그런데 작품 지면 제목은 「Alive &mdash; every country it charted in」 이다.
 * ⛔ **손님이 치는 낱말(`netflix`)이 우리 제목에 없다.** 순위는 8~10위인데 클릭이 0 이다.
 *
 * 이 자는 그 어긋남을 **세기만** 한다. 제목을 고칠지는 사람이 정한다 —
 * 제목을 건드리면 순위가 흔들릴 수 있고, 그건 이 자가 못 재는 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **인과를 말하지 않는다.** 「이 낱말을 넣으면 눌린다」는 우리가 잰 것이 아니다.
 *   잰 것은 「이 말이 검색에 N번 나오는데 우리 제목 M장에만 있다」 까지다.
 * ⛔ **「닿았는데 안 눌린 것」과 「아예 안 닿는 것」을 가른다.** 앞은 제목·설명 문제일 수
 *   있고, 뒤는 지면이 없는 문제다. 섞으면 엉뚱한 것을 고친다.
 * ⛔ 노출 1~2 건으로 결론을 세우지 않는다. 문턱을 적어 두고, 문턱 아래는 「모자란다」고 적는다.
 * ⛔ 자료가 없으면 0 이 아니라 **못 쟀다**고 적는다.
 *
 * 쓰는 법
 *   node scripts/search-console-report.mjs sc-domain:kculturewire.com --days 28 \
 *        --행수=500 --적는다=src/data/kcw-search-queries.json
 *   node scripts/measure-kcw-search-words.mjs
 *   node scripts/measure-kcw-search-words.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 잰것길 = path.join(뿌리, 'src', 'data', 'kcw-search-queries.json');
/**
 * 🔴 2026-08-23 19:2x — **이 자가 처음에 거짓말을 했다.** 「닿았는데 안 눌린 것이 전체
 *   노출의 79%」라고 적었고 나는 그것을 2번께 그대로 보고했다. 틀렸다.
 *
 *   구글은 검색어 축으로는 **일부만 알려 준다**(적게 나온 검색어를 숨긴다).
 *   같은 창을 지면 축으로 재니 노출이 **2,322** 였는데 검색어 축 합은 **351** 이었다 —
 *   검색어로 보이는 것은 전체의 **15.1%** 다. 79% 는 「전체의」가 아니라
 *   「보이는 15% 안에서의」 몫이었다.
 * ⭐ 그래서 지면 축도 같이 읽어 **분모를 밝힌다.** 없으면 「전체 대비」를 아예 안 적는다.
 * ⛔ 분모를 모르는 채 비율을 적지 않는다. 그것이 이 흠의 뿌리였다.
 */
export const 지면잰것길 = path.join(뿌리, 'src', 'data', 'kcw-search-pages.json');
export const 낸방 = path.join(뿌리, 'dist', 'wikitip');

/** 노출이 이만큼은 돼야 한 줄로 셈에 쓴다. ⛔ 문턱을 숨기지 않는다 */
export const 볼노출 = 3;
/** 이 순위 안이면 「이미 닿고 있다」로 본다 — 첫 두 쪽 */
export const 닿은순위 = 20;

/**
 * 뜻을 안 나르는 말. ⛔ 목록이 길어지면 그만큼 우리가 못 세는 말이 는다 — 짧게 둔다.
 * ⚠ `netflix`·`country` 는 **절대 안 넣는다.** 그 둘이 이 셈의 핵심이다.
 */
export const 안세는말 = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'to', 'is', 'it', 'and',
  'or', 'for', 'at', 'by', 'i', 'can', 'what', 'which', 'how', 'many', 'does', 'do', 'are',
  'was', 'were', 'be', 'with', 'from', 'that', 'this', 'there', 'https', 'http', 'www', 'com']);

export function 낱말들(검색어) {
  return String(검색어 ?? '').toLowerCase().split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 && !안세는말.has(w));
}

/**
 * ⭐ 넷플릭스 자료파일 주소를 그대로 치는 검색이 한 무리 있다 —
 *   `all-weeks-countries.tsv` 같은 것. 이건 「작품 검색」과 **다른 손님**이다.
 *   섞어 세면 둘 다 안 보인다.
 */
export function 자료파일검색인가(키) {
  const k = String(키 ?? '').toLowerCase();
  return k.includes('netflix.com/tudum') || k.includes('all-weeks');
}

export function 말수요(행들, 문턱 = 볼노출) {
  const 표 = new Map();
  for (const r of 행들 ?? []) {
    if ((r.impressions ?? 0) < 문턱) continue;
    for (const w of new Set(낱말들(r.key))) {
      const 앞 = 표.get(w) ?? { 말: w, 노출: 0, 클릭: 0, 검색어수: 0 };
      앞.노출 += r.impressions ?? 0;
      앞.클릭 += r.clicks ?? 0;
      앞.검색어수 += 1;
      표.set(w, 앞);
    }
  }
  return [...표.values()].sort((a, b) => b.노출 - a.노출);
}

/** ⭐ 이미 닿는데 안 눌리는 것. **여기가 제목·설명이 할 일이 있는 자리다** */
export function 닿았는데안눌린것(행들, 문턱 = 볼노출) {
  return (행들 ?? [])
    .filter((r) => (r.impressions ?? 0) >= 문턱 && (r.clicks ?? 0) === 0
      && (r.position ?? 999) <= 닿은순위)
    .sort((a, b) => b.impressions - a.impressions);
}

/** ⭐ 노출은 있는데 순위가 멀다 — 제목이 아니라 **지면이 없거나 약한** 자리다 */
export function 멀리있는것(행들, 문턱 = 볼노출) {
  return (행들 ?? [])
    .filter((r) => (r.impressions ?? 0) >= 문턱 && (r.position ?? 0) > 닿은순위)
    .sort((a, b) => b.impressions - a.impressions);
}

export const 노출합계 = (행들) => (행들 ?? []).reduce((s, r) => s + (r.impressions ?? 0), 0);
export const 클릭합계 = (행들) => (행들 ?? []).reduce((s, r) => s + (r.clicks ?? 0), 0);

/**
 * 검색어 축이 전체의 몇 %를 보여 주나. ⛔ 분모가 0 이거나 없으면 **비율을 안 낸다** —
 *   0 으로 나눠 Infinity 를 「100%」로 적는 것이 이 자가 처음에 한 잘못의 사촌이다.
 */
export function 보이는몫(검색어노출, 전체노출) {
  if (!전체노출 || 전체노출 <= 0) return null;
  return (100 * 검색어노출) / 전체노출;
}

export function 제목뽑기(html) {
  const m = String(html ?? '').match(/<title>([^<]*)<\/title>/);
  return m ? m[1] : null;
}

/** 지어 낸 지면들의 제목. ⛔ 소스가 아니라 **나간 글자**를 본다 */
export function 제목들(방 = 낸방, 읽기 = fs) {
  if (!읽기.existsSync(방)) return null;
  const 모음 = [];
  const 걷기 = (곳) => {
    for (const e of 읽기.readdirSync(곳, { withFileTypes: true })) {
      const 길 = path.join(곳, e.name);
      if (e.isDirectory()) 걷기(길);
      else if (e.name.endsWith('.html')) {
        const t = 제목뽑기(읽기.readFileSync(길, 'utf8'));
        if (t) 모음.push({ 길: path.relative(방, 길), 제목: t });
      }
    }
  };
  걷기(방);
  return 모음;
}

export function 제목에든수(제목모음, 말) {
  const w = String(말).toLowerCase();
  return (제목모음 ?? []).filter((x) => x.제목.toLowerCase().includes(w)).length;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (n, v) => { if (v) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}`); } };

  참('뜻 없는 말은 뺀다', JSON.stringify(낱말들('what country is it on'))
    === JSON.stringify(['country']));
  /* 🔴 이 둘을 빼면 이 자가 재려는 것이 사라진다 */
  참('netflix 는 센다', 낱말들('alive netflix').includes('netflix'));
  참('country 는 센다', 낱말들('alive netflix country').includes('country'));
  참('한 글자는 안 센다', !낱말들('a b alive').includes('b'));

  const 행 = [
    { key: 'alive netflix country', impressions: 10, clicks: 0, position: 9 },
    { key: 'alive netflix', impressions: 5, clicks: 1, position: 8 },
    { key: 'one off word', impressions: 1, clicks: 0, position: 3 },
    { key: 'korea ladder', impressions: 13, clicks: 0, position: 30 },
    { key: 'https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv', impressions: 31, clicks: 0, position: 9 },
  ];
  const 수요 = 말수요(행);
  참('문턱 아래 검색어는 셈에 안 든다', !수요.some((x) => x.말 === 'off'));
  참('netflix 가 가장 많이 나온다', 수요[0].말 === 'netflix');
  참('노출을 더해 센다', 수요.find((x) => x.말 === 'alive').노출 === 15);
  참('클릭도 같이 센다', 수요.find((x) => x.말 === 'alive').클릭 === 1);
  /* ⛔ 한 검색어에 같은 말이 두 번 나와도 한 번만 센다 */
  참('한 검색어에서 같은 말을 두 번 안 센다',
    말수요([{ key: 'netflix netflix', impressions: 5, clicks: 0, position: 1 }])
      .find((x) => x.말 === 'netflix').검색어수 === 1);

  참('닿았는데 안 눌린 것을 집는다',
    닿았는데안눌린것(행).some((r) => r.key === 'alive netflix country'));
  참('눌린 것은 안 집는다', !닿았는데안눌린것(행).some((r) => r.key === 'alive netflix'));
  /* ⛔ 순위가 먼 것을 「안 눌린다」에 섞으면 엉뚱한 것을 고치게 된다 */
  참('순위가 멀면 안 눌린 것에 안 넣는다',
    !닿았는데안눌린것(행).some((r) => r.key === 'korea ladder'));
  참('순위가 먼 것은 따로 집는다', 멀리있는것(행).some((r) => r.key === 'korea ladder'));

  참('자료파일 검색을 갈라 본다',
    자료파일검색인가('https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv'));
  참('작품 검색은 자료파일로 안 센다', !자료파일검색인가('alive netflix country'));

  참('제목을 나간 글자에서 뽑는다', 제목뽑기('<title>A &mdash; B</title>') === 'A &mdash; B');
  참('제목이 없으면 null', 제목뽑기('<p>x</p>') === null);
  참('제목에 든 장수를 센다',
    제목에든수([{ 제목: 'Alive on Netflix' }, { 제목: 'Alive' }], 'netflix') === 1);
  /* ⛔ 지면을 안 지었으면 0 이 아니라 **모른다**(null) */
  참('지면방이 없으면 null 이다', 제목들(path.join(뿌리, '없는방입니다')) === null);

  /* ── 🔴 분모 (2026-08-23 19:2x) ─────────────────────────────
     이 자가 처음에 「전체 노출의 79%」라고 적었고 나는 그것을 그대로 보고했다. 틀렸다 —
     구글은 검색어 축으로 일부만 알려 준다. 351 은 전체 2,322 의 15% 였다.
     ⛔ 분모를 모르는 채 비율을 적지 않는다. 그것을 여기서 지킨다. */
  참('노출을 더해 센다', 노출합계([{ impressions: 3 }, { impressions: 4 }]) === 7);
  참('행이 없으면 0 이다', 노출합계(null) === 0);
  참('클릭도 더해 센다', 클릭합계([{ clicks: 1 }, { clicks: 2 }]) === 3);
  참('보이는 몫을 낸다', 보이는몫(351, 2322).toFixed(1) === '15.1');
  /* 🔴 분모가 없으면 **비율을 안 낸다.** 0 으로 나눠 Infinity 를 「100%」로 적으면 안 된다 */
  참('분모를 모르면 비율을 안 낸다', 보이는몫(351, null) === null);
  참('분모가 0 이어도 비율을 안 낸다', 보이는몫(351, 0) === null);
  참('⛔ 분모가 0 일 때 Infinity 를 안 낸다', !Number.isFinite(351 / 0) && 보이는몫(351, 0) === null);

  console.log(`검색어와 제목을 맞대는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(잰것길)) {
    console.log('⚠ 잰 검색어가 없다 — **못 쟀다.**');
    console.log('   먼저: node scripts/search-console-report.mjs sc-domain:kculturewire.com'
      + ' --days 28 --행수=500 --적는다=src/data/kcw-search-queries.json');
    process.exit(0);
  }
  const 잰것 = JSON.parse(fs.readFileSync(잰것길, 'utf8'));
  const 행 = 잰것.rows ?? [];
  const 제목모음 = 제목들();

  const 노출합 = 행.reduce((s, r) => s + (r.impressions ?? 0), 0);
  const 클릭합 = 행.reduce((s, r) => s + (r.clicks ?? 0), 0);
  const 자료파일 = 행.filter((r) => 자료파일검색인가(r.key));
  const 자료파일노출 = 자료파일.reduce((s, r) => s + (r.impressions ?? 0), 0);

  /* 🔴 분모 — 지면 축으로 잰 노출이 진짜 전체다. 없으면 **비율을 아예 안 적는다** */
  const 지면잰것 = fs.existsSync(지면잰것길)
    ? JSON.parse(fs.readFileSync(지면잰것길, 'utf8')) : null;
  const 전체노출 = 지면잰것 ? 노출합계(지면잰것.rows) : null;
  const 전체클릭 = 지면잰것 ? 클릭합계(지면잰것.rows) : null;

  console.log(`손님이 친 말 대 우리 제목 — ${잰것.site}`);
  console.log(`   창: ${잰것.window.from} ~ ${잰것.window.to} (${잰것.window.days}일)`);
  console.log(`   검색어 ${행.length}개 · 노출 ${노출합} · 클릭 ${클릭합}`
    + ` · CTR ${노출합 ? ((100 * 클릭합) / 노출합).toFixed(2) : '못 쟀다'}%`);
  if (전체노출) {
    console.log(`   🔴 이것은 **전체가 아니다.** 같은 창을 지면 축으로 재면 노출 ${전체노출}`
      + ` · 클릭 ${전체클릭} 이다 — 구글이 검색어로 알려 주는 것은`
      + ` ${보이는몫(노출합, 전체노출).toFixed(1)}% 뿐이다(적게 나온 검색어를 숨긴다).`);
    console.log('      아래 비율은 다 **「보이는 몫 안에서」**다. 「전체의」로 읽으면 안 된다.');
  } else {
    console.log('   ⚠ 지면 축 실측이 없어 **전체 노출을 모른다.** 아래 비율의 분모는'
      + ' 「검색어로 보이는 것」뿐이다 — 전체 대비로 읽으면 안 된다.');
    console.log('      같이 재려면: node scripts/search-console-report.mjs <사이트> --days 28'
      + ' --축=page --적는다=src/data/kcw-search-pages.json');
  }
  console.log(`   문턱: 노출 ${볼노출} 이상만 낱말 셈에 쓴다 · 순위 ${닿은순위}위 안이면 「닿았다」\n`);

  if (제목모음 === null) {
    console.log('⚠ dist 가 없어 **우리 제목은 못 쟀다.** 검색어 쪽만 아래 적는다.');
    console.log('   먼저 `npx astro build`.\n');
  } else {
    console.log(`   우리가 낸 지면 ${제목모음.length}장의 제목을 맞대 본다\n`);
  }

  console.log('── 손님이 가장 많이 치는 낱말 ──────────────────────');
  const 수요 = 말수요(행);
  console.log('   낱말            노출  클릭  검색어  우리 제목에 든 장수');
  for (const w of 수요.slice(0, 16)) {
    const 든수 = 제목모음 === null ? '못 쟀다'
      : `${제목에든수(제목모음, w.말)}장`;
    console.log(`   ${w.말.padEnd(14)}${String(w.노출).padStart(5)}`
      + `${String(w.클릭).padStart(6)}${String(w.검색어수).padStart(7)}   ${든수}`);
  }

  console.log('\n── 🔴 닿았는데 안 눌린 것 (제목·설명이 할 일이 있는 자리) ──');
  const 안눌린 = 닿았는데안눌린것(행);
  const 안눌린노출 = 안눌린.reduce((s, r) => s + r.impressions, 0);
  /* ⛔ 「전체 노출의 …%」로 적지 않는다. 분모는 **검색어로 보이는 것**뿐이다 */
  console.log(`   ${안눌린.length}건 · 노출 ${안눌린노출}`
    + ` (검색어로 보이는 노출 ${노출합} 가운데`
    + ` ${노출합 ? ((100 * 안눌린노출) / 노출합).toFixed(0) : '?'}%`
    + `${전체노출 ? ` · 전체 노출 ${전체노출} 로 나누면 ${((100 * 안눌린노출) / 전체노출).toFixed(0)}%` : ''})\n`);
  for (const r of 안눌린.slice(0, 12)) {
    console.log(`   노출 ${String(r.impressions).padStart(3)} · ${r.position.toFixed(1)}위   ${r.key}`);
  }

  console.log('\n── 노출은 있는데 순위가 먼 것 (지면이 없거나 약한 자리) ──');
  const 멀리 = 멀리있는것(행);
  for (const r of 멀리.slice(0, 8)) {
    console.log(`   노출 ${String(r.impressions).padStart(3)} · ${r.position.toFixed(1)}위   ${r.key}`);
  }
  if (!멀리.length) console.log('   없다');

  console.log(`\n── 갈라 세운 것: 넷플릭스 자료파일을 그대로 치는 검색 ──`);
  console.log(`   ${자료파일.length}건 · 노출 ${자료파일노출}`
    + ` (검색어로 보이는 노출 가운데 ${노출합 ? ((100 * 자료파일노출) / 노출합).toFixed(0) : '?'}%`
    + `${전체노출 ? ` · 전체로 나누면 ${((100 * 자료파일노출) / 전체노출).toFixed(0)}%` : ''})`
    + ` · 클릭 ${자료파일.reduce((s, r) => s + r.clicks, 0)}`);
  console.log('   ⭐ 작품을 찾는 손님과 **다른 손님**이다. 원자료를 찾는 사람이고,');
  console.log('      우리는 그 자료를 갖고 있다. 섞어 세면 둘 다 안 보인다.');

  console.log('\n⚠ 이 자는 **세기만 한다.** 「이 낱말을 넣으면 눌린다」는 우리가 잰 것이 아니다.');
  console.log('   제목을 건드리면 순위가 흔들릴 수 있고 그건 이 자가 못 재는 것이다.');
}
