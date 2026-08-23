#!/usr/bin/env node
/**
 * measure-kcw-visited-vs-shown.mjs — **낸 지면 · 보인 지면 · 사람이 온 지면**을 나란히 센다.
 *
 * ── 🔴 왜 (2026-08-23 23:2x) ─────────────────────────────────
 * 오늘 GA4 가 열려 처음으로 **방문**을 잴 수 있게 됐다. 재 보니 이랬다.
 * ```
 * 낸 지면        1,537장
 * 검색에 보인 것    349장  (22.7%)
 * 사람이 온 것       41장  ( 2.7%)   ← 이 수를 오늘까지 몰랐다
 * ```
 * ⛔ **이것을 모르면 「지면을 더 낼까」와 「있는 지면을 고칠까」를 못 가른다.**
 *   1,537장을 내고 41장에만 사람이 오면, 더 내는 것은 답이 아니다.
 *   나는 오늘 하루에 지면을 269장 늘렸다. 그 판단을 이 자가 다시 재게 한다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * 🔴 **「방문 0」을 「아무도 안 왔다」로 읽지 않는다.** GA4 는 광고차단·쿠키거부로 덜 센다.
 *   한 명 온 지면이 0 으로 보일 수 있다. 그래서 이 자는 「우리가 센 방문이 0」이라고 적는다.
 * ⛔ **오늘 낸 지면을 「28일간 방문 0」으로 세지 않는다.** 살아 있던 날이 다르면 견줄 수 없다 —
 *   갈라 세고, 뺀 것을 밝힌다.
 * ⛔ 주소를 맞댈 때 물음표 뒤와 끝 슬래시를 떼고 맞춘다. 안 떼면 같은 지면이 둘로 세어진다.
 * ⛔ 비율의 분모를 밝힌다. 「73%」가 무엇의 73%인지 적지 않으면 오늘 낮에 낸 실수를 되풀이한다.
 *
 * 쓰는 법
 *   node scripts/ga4-report.mjs --지면적는다=src/data/kcw-ga4-pages.json --days 28
 *   node scripts/search-console-report.mjs sc-domain:kculturewire.com --days 28 \
 *        --축=page --행수=500 --적는다=src/data/kcw-search-pages.json
 *   node scripts/measure-kcw-visited-vs-shown.mjs
 *   node scripts/measure-kcw-visited-vs-shown.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 방문길 = path.join(뿌리, 'src', 'data', 'kcw-ga4-pages.json');
export const 노출길 = path.join(뿌리, 'src', 'data', 'kcw-search-pages.json');
export const 사이트맵길 = path.join(뿌리, 'dist', 'wikitip', 'sitemap.xml');

/**
 * ⛔ 오늘 낸 지면은 28일 창과 견줄 수 없다. **살아 있던 날이 다르면 견주지 않는다.**
 *   갈래마다 「언제부터 살아 있나」를 적어 둔다. 손으로 적는 목록이라 늘면 그만큼 정직해진다.
 */
export const 오늘낸것 = [
  { 자: /^\/week\//, 이름: '주별 지면', 낸날: '2026-08-23' },
  { 자: /^\/weeks$/, 이름: '주 목록', 낸날: '2026-08-23' },
  { 자: /^\/article\/(iu-saju-water|jungkook-saju-structure|karina-saju-structure)/,
    이름: '스타사주 영문 3편', 낸날: '2026-08-23' },
];

export function 오늘낸것인가(길) {
  return 오늘낸것.some((x) => x.자.test(길));
}

/** ⛔ 물음표 뒤와 끝 슬래시를 뗀다 — 안 떼면 같은 지면이 둘로 세어진다 */
export function 주소고르기(주소) {
  const s = String(주소 ?? '').replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '');
  const t = s.replace(/\/+$/, '');
  return t || '/';
}

export function 합치기(줄들, 열쇠, 값) {
  const 표 = new Map();
  for (const r of 줄들 ?? []) {
    const k = 주소고르기(r[열쇠]);
    표.set(k, (표.get(k) ?? 0) + (Number(r[값]) || 0));
  }
  return 표;
}

export function 사이트맵길들(글) {
  return new Set([...String(글 ?? '').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => 주소고르기(m[1])));
}

/** ⭐ 보였는데 우리가 센 방문이 0인 지면. **여기가 노출을 방문으로 못 바꾼 자리다** */
export function 보였는데안온것(노출표, 방문표) {
  return [...노출표.entries()]
    .filter(([p, v]) => v > 0 && !(방문표.get(p) > 0))
    .sort((a, b) => b[1] - a[1]);
}

export function 몫(위, 아래) {
  if (!아래 || 아래 <= 0) return null;
  return (100 * 위) / 아래;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (n, v) => { if (v) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}`); } };

  참('도메인을 뗀다', 주소고르기('https://www.kculturewire.com/titles') === '/titles');
  참('물음표 뒤를 뗀다', 주소고르기('/titles?utm=x') === '/titles');
  참('끝 슬래시를 뗀다', 주소고르기('/titles/') === '/titles');
  참('첫 화면은 슬래시 하나', 주소고르기('https://www.kculturewire.com/') === '/');
  /* 🔴 이 셋이 따로 세어지면 같은 지면이 셋으로 보인다 */
  참('같은 지면을 하나로 본다',
    주소고르기('/a/') === 주소고르기('/a') && 주소고르기('/a?b=1') === '/a');

  const 표 = 합치기([{ p: '/a', u: 3 }, { p: '/a/', u: 2 }, { p: '/b', u: 1 }], 'p', 'u');
  참('같은 주소를 더해 센다', 표.get('/a') === 5);
  참('다른 주소는 따로', 표.get('/b') === 1);

  참('사이트맵에서 길만 뽑는다',
    [...사이트맵길들('<loc>https://x.com/a</loc><loc>https://x.com/b/</loc>')].sort().join(',')
    === '/a,/b');

  const 노출 = new Map([['/a', 10], ['/b', 5], ['/c', 0]]);
  const 방문 = new Map([['/a', 2]]);
  const 안온것 = 보였는데안온것(노출, 방문);
  참('보였는데 안 온 것을 집는다', 안온것.length === 1 && 안온것[0][0] === '/b');
  참('온 지면은 안 집는다', !안온것.some(([p]) => p === '/a'));
  /* ⛔ 노출이 0인 지면은 「보인 것」이 아니다 — 섞으면 분모가 부푼다 */
  참('노출 0은 보인 것으로 안 센다', !안온것.some(([p]) => p === '/c'));

  참('오늘 낸 주 지면을 알아본다', 오늘낸것인가('/week/2024-11-03'));
  참('오늘 낸 목록도 알아본다', 오늘낸것인가('/weeks'));
  참('오늘 낸 기사 셋을 알아본다', 오늘낸것인가('/article/iu-saju-water-in-all-twelve-hours'));
  참('예전 지면은 오늘 낸 것이 아니다', !오늘낸것인가('/titles'));

  참('분모가 없으면 비율을 안 낸다', 몫(1, 0) === null && 몫(1, null) === null);
  참('분모가 있으면 비율을 낸다', 몫(41, 1537).toFixed(1) === '2.7');

  console.log(`낸 것·보인 것·온 것을 나란히 세는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 없는것 = [];
  for (const [이름, 길] of [['GA4 방문', 방문길], ['검색 노출', 노출길], ['사이트맵', 사이트맵길]]) {
    if (!fs.existsSync(길)) 없는것.push(이름);
  }
  if (없는것.length) {
    console.log(`⚠ ${없는것.join(' · ')} 이 없다 — **못 쟀다.**`);
    console.log('   머리말의 「쓰는 법」 세 줄을 먼저 돌린다.');
    process.exit(0);
  }

  const 방문자료 = JSON.parse(fs.readFileSync(방문길, 'utf8'));
  const 노출자료 = JSON.parse(fs.readFileSync(노출길, 'utf8'));
  const 낸것 = 사이트맵길들(fs.readFileSync(사이트맵길, 'utf8'));
  const 방문 = 합치기(방문자료.rows, 'path', 'users');
  const 노출 = 합치기(노출자료.rows, 'key', 'impressions');

  const 온것 = [...방문.entries()].filter(([, v]) => v > 0);
  const 보인것 = [...노출.entries()].filter(([, v]) => v > 0);
  const 노출합 = 보인것.reduce((s, [, v]) => s + v, 0);
  const 방문합 = 온것.reduce((s, [, v]) => s + v, 0);

  /* ⛔ 오늘 낸 지면을 갈라 낸다 — 28일 창과 견줄 수 없다 */
  const 오늘것 = [...낸것].filter(오늘낸것인가);
  const 견줄것 = [...낸것].filter((p) => !오늘낸것인가(p));

  console.log('낸 지면 · 검색에 보인 지면 · 사람이 온 지면 — 나란히 센다\n');
  console.log(`   창: 최근 ${방문자료.days}일, 어제까지 (검색은 ${노출자료.window.from}~${노출자료.window.to})`);
  console.log(`   낸 지면            ${String(낸것.size).padStart(5)}장`);
  console.log(`     그중 오늘 낸 것   ${String(오늘것.length).padStart(5)}장  ← 28일과 견줄 수 없다(갈라 낸다)`);
  console.log(`     견줄 수 있는 것   ${String(견줄것.length).padStart(5)}장`);
  console.log(`   검색에 보인 지면    ${String(보인것.length).padStart(5)}장`
    + `  (견줄 것의 ${몫(보인것.length, 견줄것.length)?.toFixed(1) ?? '?'}%)  노출 ${노출합}`);
  console.log(`   사람이 온 지면      ${String(온것.length).padStart(5)}장`
    + `  (견줄 것의 ${몫(온것.length, 견줄것.length)?.toFixed(1) ?? '?'}%)  방문 ${방문합}`);

  const 안온것 = 보였는데안온것(노출, 방문);
  const 안온노출 = 안온것.reduce((s, [, v]) => s + v, 0);
  console.log(`\n── 🔴 검색에 보였는데 우리가 센 방문이 0인 지면 ──`);
  console.log(`   ${안온것.length}장 · 그 노출 합 ${안온노출}`
    + `  (전체 노출 ${노출합} 의 ${몫(안온노출, 노출합)?.toFixed(0) ?? '?'}%)`);
  console.log('   ⚠ 「방문 0」은 **「아무도 안 왔다」가 아니다.** GA4 는 광고차단·쿠키거부로');
  console.log('      덜 센다. 한 명 온 지면이 0 으로 보일 수 있다 — 「우리가 센 방문이 0」이다.\n');
  for (const [p, v] of 안온것.slice(0, 10)) console.log(`   노출 ${String(v).padStart(4)}   ${p}`);

  console.log('\n── 사람이 온 지면 (많은 순) ──────────────────');
  for (const [p, v] of 온것.sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`   ${String(v).padStart(4)}명 · 노출 ${String(노출.get(p) ?? 0).padStart(4)}   ${p}`);
  }
  const 첫화면 = 방문.get('/') ?? 0;
  if (방문합 > 0) {
    console.log(`\n   ⭐ 첫 화면이 ${첫화면}명 — 방문의 ${몫(첫화면, 방문합)?.toFixed(0)}%.`);
    console.log('      나머지가 낮으면 손님이 **속으로 걸어 들어오지 못하는** 것이다.');
  }

  /**
   * ⭐ `--적는다=<파일>` — 「보였는데 방문 0」 목록을 자료로 남긴다.
   *   🔴 2026-08-24 00:2x — 이 목록을 화면으로만 보면 **내일 아침에 다시 재야 한다.**
   *     내일 첫 덩어리가 「이 320장부터 본다」인데, 집을 것이 파일로 없으면 그 시간이
   *     또 재는 데 든다. 잰 것은 남긴다.
   *   ⛔ 갈래(작품·시장·기사·목록)를 같이 적는다 — 320장을 한 덩어리로 보면 손을 못 댄다.
   */
  const 적을곳 = process.argv.find((a) => a.startsWith('--적는다='))?.split('=')[1];
  if (적을곳) {
    const 갈래 = (p) => (p.startsWith('/title/') ? '작품'
      : p.startsWith('/market/') ? '시장'
        : p.startsWith('/article/') ? '기사'
          : p.startsWith('/week/') ? '주'
            : p.startsWith('/firm/') ? '회사'
              : p.startsWith('/room/') ? '방' : '그밖');
    const 줄 = 안온것.map(([p, v]) => ({ path: p, impressions: v, kind: 갈래(p) }));
    const 갈래별 = {};
    for (const x of 줄) {
      갈래별[x.kind] = 갈래별[x.kind] ?? { 지면: 0, 노출: 0 };
      갈래별[x.kind].지면 += 1; 갈래별[x.kind].노출 += x.impressions;
    }
    fs.mkdirSync(path.dirname(적을곳), { recursive: true });
    fs.writeFileSync(적을곳, `${JSON.stringify({
      generated: 방문자료.note ?? null,
      window: { 방문일수: 방문자료.days, 검색: 노출자료.window },
      /* ⚠ 「방문 0」은 「아무도 안 왔다」가 아니다 — GA4 가 덜 센다 */
      whatThisIs: 'Pages that got search impressions but zero visits we could count. '
        + 'GA4 undercounts (ad blockers, cookie refusal), so zero counted is not zero people.',
      낸지면: 낸것.size,
      견줄지면: 견줄것.length,
      보인지면: 보인것.length,
      온지면: 온것.length,
      안온지면: 안온것.length,
      안온노출: 안온노출,
      갈래별,
      rows: 줄,
    }, null, 2)}\n`);
    console.log(`\n✅ 적었다 — ${적을곳} (${줄.length}줄)`);
    console.log('   갈래별:');
    for (const [k, v] of Object.entries(갈래별).sort((a, b) => b[1].노출 - a[1].노출)) {
      console.log(`      ${k.padEnd(4)} ${String(v.지면).padStart(4)}장 · 노출 ${v.노출}`);
    }
  }

  console.log('\n⚠ 이 자는 세기만 한다. 다만 이 수는 일감 순서를 바꾼다 —');
  console.log('   낸 지면 대비 온 지면이 낮으면 **더 내는 것이 답이 아니다.**');
  console.log('   이미 보이고 있는 노출을 방문으로 바꾸는 쪽이 먼저다.');
}
