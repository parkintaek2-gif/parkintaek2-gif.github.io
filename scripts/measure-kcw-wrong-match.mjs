#!/usr/bin/env node
/**
 * measure-kcw-wrong-match.mjs — **노출 많은 지면이 «엉뚱한 검색»을 받고 있나.**
 *
 * ── 🔴 왜 (2026-08-23 19:3x) ─────────────────────────────────
 * 우리 노출 1위 지면이 `/market/nicaragua` 였다 — 28일 175노출 · **7.7위 · 클릭 0**.
 * 순위가 좋은데 클릭이 0이면 제목·설명 탓으로 보기 쉽다. 그런데 그 175건에 닿은 검색어를
 * 하나씩 열어 보니 **여덟 개 전부**가 이것이었다 —
 * ```
 * netflix.com/tudum/top10?week=2024-11-03
 * ```
 * 나라를 찾는 검색이 아니었다. 손님은 「그 한 주」를 찾는데 구글이 나라 지면을 내주고 있었다.
 * ⭐ 그러니 **순위가 좋은데 안 눌리면, 제목을 고치기 전에 「무엇을 찾는 사람이 오나」를 본다.**
 *
 * ⛔ 그날 나는 이것을 **손으로** 열어 봤다. 손으로 하는 일은 다음 주에 안 한다.
 *   저녁보고에 「상위 지면을 하나씩 열어 보겠다」고 적었는데, 그것을 자로 만든 것이 이 파일이다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **「어긋났다」를 판정하지 않는다.** 재는 것은 「검색어 낱말이 우리 제목에 얼마나 들었나」
 *   까지다. 겹침이 0 이어도 지면이 맞을 수 있다(동의어·다른 표기). 그래서 **세어서 보인다.**
 * ⛔ 노출이 적은 지면으로 결론을 세우지 않는다. 문턱을 적어 두고 그 아래는 안 본다.
 * ⛔ 열쇠를 이 파일이 다루지 않는다 — 이미 있는 `search-console-report.mjs` 를 불러 쓴다.
 *   자격증명 다루는 자리를 늘리지 않는다.
 *
 * 쓰는 법
 *   node scripts/measure-kcw-wrong-match.mjs                    상위 12장을 본다
 *   node scripts/measure-kcw-wrong-match.mjs --장수=20
 *   node scripts/measure-kcw-wrong-match.mjs --selftest
 *
 * 먼저 있어야 하는 것 — 지면 축 실측:
 *   node scripts/search-console-report.mjs sc-domain:kculturewire.com --days 28 \
 *        --축=page --행수=500 --적는다=src/data/kcw-search-pages.json
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { 낱말들, 노출합계, 클릭합계 } from './measure-kcw-search-words.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 지면잰것길 = path.join(뿌리, 'src', 'data', 'kcw-search-pages.json');
export const 낸방 = path.join(뿌리, 'dist', 'wikitip');
export const 사이트 = 'sc-domain:kculturewire.com';

/** 이만큼은 노출돼야 본다. ⛔ 한두 건으로 결론을 세우지 않는다 */
export const 볼노출 = 20;
/** 검색어 낱말이 제목에 이 몫보다 적게 들면 「많이 어긋난다」로 적는다 */
export const 어긋남문턱 = 0.34;
/**
 * 🔴 이 자를 처음 돌린 자리에서 바로 걸렸다(2026-08-23 20:4x).
 *   `/webtoon` 은 노출 66인데 구글이 알려 준 검색어는 **한 개(노출 1)** 뿐이었다.
 *   그 한 줄로 낸 겹침 33%를 「많이 어긋난다」로 찍었다 — **노출 1건으로 결론을 세운 것**이다.
 *   지면 노출은 문턱을 뒀는데 **겹침을 잰 노출**에는 문턱이 없었다.
 * ⭐ 그래서 겹침을 실제로 잰 노출이 이만큼은 돼야 딱지를 붙인다.
 *   그 아래는 「겹침을 못 믿는다」로 적는다 — 「어긋나지 않는다」가 아니다.
 */
export const 겹침믿을노출 = 10;

export function 주소길(온주소) {
  return String(온주소 ?? '').replace(/^https?:\/\/[^/]+/, '') || '/';
}

/** 지면의 제목을 나간 글자에서 뽑는다. ⛔ 소스가 아니라 손님이 보는 글자다 */
export function 지면제목(길, 방 = 낸방, 읽기 = fs) {
  const 꼬리 = `${길.replace(/^\//, '') || 'index'}.html`;
  const 파일 = path.join(방, 꼬리);
  if (!읽기.existsSync(파일)) return null;
  const m = 읽기.readFileSync(파일, 'utf8').match(/<title>([^<]*)<\/title>/);
  return m ? m[1] : null;
}

/**
 * 검색어 낱말이 제목에 든 몫. ⛔ 낱말이 하나도 없으면 **비율을 내지 않는다**(null) —
 *   0/0 을 「0% 겹침」으로 적으면 없는 어긋남을 만든다.
 */
export function 겹침몫(검색어, 제목) {
  const 검 = new Set(낱말들(검색어));
  if (!검.size) return null;
  const 제 = new Set(낱말들(제목));
  let 든것 = 0;
  for (const w of 검) if (제.has(w)) 든것 += 1;
  return 든것 / 검.size;
}

/**
 * 한 지면의 검색어들을 노출로 가중해 겹침을 낸다.
 * ⛔ 겹침을 못 낸 줄(낱말이 없는 검색어)은 **분모에서도 뺀다** — 0 으로 세지 않는다.
 */
export function 지면겹침(행들, 제목) {
  let 무게 = 0; let 합 = 0; let 못잰노출 = 0;
  for (const r of 행들 ?? []) {
    const g = 겹침몫(r.key, 제목);
    const w = r.impressions ?? 0;
    if (g === null) { 못잰노출 += w; continue; }
    무게 += w; 합 += g * w;
  }
  return { 겹침: 무게 ? 합 / 무게 : null, 잰노출: 무게, 못잰노출 };
}

/** 가장 많이 노출된 검색어 한 줄 — 지면에 무엇을 찾는 사람이 오는지 보여 주려고 */
export function 으뜸검색어(행들) {
  return [...(행들 ?? [])].sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))[0] ?? null;
}

/** 이미 있는 자를 불러 한 지면에 닿은 검색어를 받아 온다. ⛔ 열쇠를 여기서 안 만진다 */
export function 지면검색어(길, 임시방) {
  const 낼길 = path.join(임시방, `${길.replace(/[^A-Za-z0-9]+/g, '_')}.json`);
  const r = spawnSync(process.execPath, [
    path.join(뿌리, 'scripts', 'search-console-report.mjs'), 사이트,
    '--days', '28', '--행수=100', `--지면=${길}`, `--적는다=${낼길}`,
  ], { cwd: 뿌리, encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' } });
  if (!fs.existsSync(낼길)) {
    return { 못쟀다: (r.stderr || r.stdout || '').trim().split('\n').pop() || '까닭 모름' };
  }
  return JSON.parse(fs.readFileSync(낼길, 'utf8'));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (n, v) => { if (v) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}`); } };

  참('온 주소에서 길만 뽑는다', 주소길('https://www.kculturewire.com/market/nicaragua')
    === '/market/nicaragua');
  참('첫 화면은 슬래시 하나다', 주소길('https://www.kculturewire.com') === '/');

  참('제목에 다 들면 1 이다', 겹침몫('alive netflix', 'Alive on Netflix — chart') === 1);
  참('반만 들면 0.5 다', 겹침몫('alive netflix', 'Alive — chart') === 0.5);
  참('하나도 안 들면 0 이다', 겹침몫('alive netflix', 'Nicaragua chart') === 0);
  /* 🔴 니카라과 자리 — 주소를 그대로 친 검색은 우리 제목과 거의 안 겹친다 */
  참('주소를 그대로 친 검색은 거의 안 겹친다',
    겹침몫('netflix.com/tudum/top10?week=2024-11-03', 'Nicaragua — Korean titles') < 0.2);
  /* ⛔ 0/0 을 「0% 겹침」으로 적으면 없는 어긋남을 만든다 */
  참('낱말이 없으면 비율을 안 낸다', 겹침몫('the a of', 'anything') === null);
  참('빈 검색어도 null 이다', 겹침몫('', 'anything') === null);

  const 행 = [
    { key: 'alive netflix', impressions: 10, clicks: 0, position: 9 },
    { key: 'nicaragua chart', impressions: 5, clicks: 0, position: 3 },
    { key: 'the a of', impressions: 7, clicks: 0, position: 2 },
  ];
  const g = 지면겹침(행, 'Alive on Netflix — chart');
  참('노출로 가중해 겹친다', Math.abs(g.겹침 - ((1 * 10) + (0.5 * 5)) / 15) < 1e-9);
  참('못 잰 줄은 분모에서 뺀다', g.잰노출 === 15 && g.못잰노출 === 7);
  참('겹침이 없으면 null 이다', 지면겹침([{ key: 'the', impressions: 3 }], 'x').겹침 === null);

  참('으뜸 검색어는 노출이 가장 많은 것', 으뜸검색어(행).key === 'alive netflix');
  참('행이 없으면 으뜸도 없다', 으뜸검색어([]) === null);

  참('노출·클릭 합계를 남의 자에서 들여온다',
    노출합계([{ impressions: 2 }]) === 2 && 클릭합계([{ clicks: 1 }]) === 1);

  /* ── 🔴 얇은 겹침에 딱지를 안 붙인다 (2026-08-23 20:4x) ──────
     `/webtoon` 은 노출 66인데 구글이 알려 준 검색어가 한 개(노출 1)뿐이었고,
     그 한 줄로 낸 33%를 「많이 어긋난다」로 찍었다. 노출 1건으로 결론을 세운 것이다. */
  const 얇은 = 지면겹침([{ key: 'how many users does webtoon have', impressions: 1 }],
    'Korea webtoon businesses, counted');
  참('얇은 겹침은 잰 노출이 문턱 아래다', 얇은.잰노출 < 겹침믿을노출);
  참('얇아도 겹침 자체는 낸다(숨기지 않는다)', typeof 얇은.겹침 === 'number');
  const 두꺼운 = 지면겹침([{ key: 'nicaragua netflix week', impressions: 40 }], 'Alive on Netflix');
  참('두꺼운 겹침은 문턱을 넘는다', 두꺼운.잰노출 >= 겹침믿을노출);
  /* ⛔ 문턱은 「보이지 않게」 두지 않는다 — 수로 내보여야 다음 사람이 의심할 수 있다 */
  참('겹침 믿을 문턱이 수로 있다', Number.isInteger(겹침믿을노출) && 겹침믿을노출 > 1);
  /* ⛔ 지면을 안 지었으면 제목을 **모른다**(null). 빈 문자열로 만들지 않는다 */
  참('없는 지면의 제목은 null 이다', 지면제목('/없는것', path.join(뿌리, '없는방')) === null);

  console.log(`엉뚱한 검색을 받나 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(지면잰것길)) {
    console.log('⚠ 지면 축 실측이 없다 — **못 쟀다.**');
    console.log('   먼저: node scripts/search-console-report.mjs sc-domain:kculturewire.com'
      + ' --days 28 --축=page --행수=500 --적는다=src/data/kcw-search-pages.json');
    process.exit(0);
  }
  const 장수 = Number(process.argv.find((a) => a.startsWith('--장수='))?.split('=')[1] ?? 12);
  const 잰것 = JSON.parse(fs.readFileSync(지면잰것길, 'utf8'));
  const 전체노출 = 노출합계(잰것.rows);
  const 상위 = [...(잰것.rows ?? [])]
    .filter((r) => (r.impressions ?? 0) >= 볼노출)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 장수);

  console.log('노출 많은 지면이 «엉뚱한 검색»을 받나 — 순위가 좋은데 안 눌리는 까닭을 찾는다\n');
  console.log(`   창: ${잰것.window.from} ~ ${잰것.window.to} (${잰것.window.days}일)`
    + ` · 전체 노출 ${전체노출}`);
  console.log(`   문턱: 노출 ${볼노출} 이상만 본다 · 겹침 ${어긋남문턱} 아래를 「많이 어긋난다」로 적는다`);
  console.log(`   보는 지면 ${상위.length}장 (노출 큰 것부터)\n`);

  const 임시방 = fs.mkdtempSync(path.join(os.tmpdir(), 'kcw-match-'));
  const 결과 = [];
  for (const r of 상위) {
    const 길 = 주소길(r.key);
    const 제목 = 지면제목(길);
    const 받음 = 지면검색어(길, 임시방);
    if (받음.못쟀다) {
      결과.push({ 길, 노출: r.impressions, 클릭: r.clicks, 순위: r.position, 제목, 못쟀다: 받음.못쟀다 });
      continue;
    }
    const 행 = 받음.rows ?? [];
    결과.push({
      길, 노출: r.impressions, 클릭: r.clicks, 순위: r.position, 제목,
      검색어수: 행.length,
      보인노출: 노출합계(행),
      ...지면겹침(행, 제목 ?? ''),
      으뜸: 으뜸검색어(행),
    });
  }

  const 어긋난것 = [];
  for (const x of 결과) {
    console.log(`── ${x.길}`);
    console.log(`   노출 ${x.노출} · 클릭 ${x.클릭} · ${Number(x.순위).toFixed(1)}위`);
    if (x.제목 === null) console.log('   ⚠ 이 지면의 제목을 **못 쟀다**(dist 에 없다 — 먼저 astro build)');
    if (x.못쟀다) { console.log(`   ⚠ 닿은 검색어를 **못 쟀다** — ${x.못쟀다}`); continue; }
    if (x.겹침 === null) {
      console.log(`   ⚠ 겹침을 **못 쟀다** — 셀 낱말이 있는 검색어가 없다`
        + ` (검색어 ${x.검색어수}개 · 노출 ${x.보인노출})`);
    } else {
      const 몫 = `${(100 * x.겹침).toFixed(0)}%`;
      /* 🔴 겹침을 잰 노출이 얇으면 **딱지를 안 붙인다.** 「못 믿는다」와 「안 어긋난다」는 다른 말이다 */
      const 믿을만한가 = x.잰노출 >= 겹침믿을노출;
      const 딱지 = !믿을만한가
        ? `⚠ 겹침을 못 믿는다 — 잰 노출이 ${x.잰노출}뿐(${겹침믿을노출} 이상이어야 본다)`
        : (x.겹침 < 어긋남문턱 ? '🔴 많이 어긋난다' : '');
      console.log(`   검색어 낱말이 우리 제목에 든 몫 ${몫}${딱지 ? `   ${딱지}` : ''}`
        + `  (검색어 ${x.검색어수}개 · 잰 노출 ${x.잰노출}`
        + `${x.못잰노출 ? ` · 못 잰 노출 ${x.못잰노출}` : ''})`);
      if (믿을만한가 && x.겹침 < 어긋남문턱) 어긋난것.push(x);
    }
    if (x.으뜸) {
      console.log(`   가장 많이 온 검색  「${x.으뜸.key}」`
        + `  노출 ${x.으뜸.impressions} · ${Number(x.으뜸.position).toFixed(1)}위`);
    }
    if (x.제목) console.log(`   우리 제목        「${x.제목}」`);
  }

  console.log('\n── 🔴 많이 어긋나는 지면 ─────────────────────────');
  if (!어긋난것.length) console.log('   없다 (문턱 위)');
  for (const x of 어긋난것.sort((a, b) => b.노출 - a.노출)) {
    console.log(`   ${x.길}  노출 ${x.노출} · 클릭 ${x.클릭} · 겹침`
      + ` ${(100 * x.겹침).toFixed(0)}%  ← 「${x.으뜸?.key}」`);
  }

  console.log('\n⚠ 이 자는 **세기만 한다.** 겹침이 낮다고 지면이 틀린 것은 아니다 —');
  console.log('   같은 것을 다른 말로 부르는 경우가 있다. 「무엇을 찾는 사람이 오나」를 보여 줄 뿐이다.');
  console.log('⭐ 어긋나면 고를 것은 둘이다 — ① 그 물음에 맞는 지면을 내고 거기서 문을 낸다');
  console.log('   ② 이 지면이 실제로 답하는 것을 제목에 더 분명히 적는다. ⛔ 지면을 깎지 않는다.');
}
