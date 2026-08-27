#!/usr/bin/env node
/**
 * 사이트맵의 **`<lastmod>` 가 빠진 지면이 늘지 않게** 막는다.
 *
 * ── 🔴 왜 있나 (2026-08-27 18:1x · 5번) ─────────────────────────────
 * 라이브 사이트맵을 재 보니 **2,716개 중 1,446개(53%)에 lastmod 가 없었다.**
 * ```
 *   /person 637 · /born-on 367 · /group 264 · /tag 63 · /school 56 · /born-in 12 …
 * ```
 * 구글은 `lastmod` 로 「무엇이 새것인가」를 고른다. 없으면 다시 안 와 본다.
 * 오늘 563장을 고쳤는데 그중 상당수가 그 신호를 못 보내고 있었다.
 *
 * 까닭은 `sitemap.xml.ts` 가 **주소↔소스 짝을 손으로 적고 있었기** 때문이다
 * (`/title/` `/firm/` `/market/` `/section/` 넷뿐). 그 파일 주석에 이미
 * 「손으로 짝을 적으면 지면이 늘 때마다 빠진다 — **이미 두 번 겪은 일이다**」라고
 * 적혀 있었는데도 그랬다. **말로 적은 규칙은 세 번째에도 잊힌다.**
 *
 * ⭐ 그래서 검사로 굳힌다. 짝을 자동으로 찾게 고쳤고(1,446 → 1), 이 자가 그것을 지킨다.
 *
 * ⛔ **「전부 0이어야 한다」로 재지 않는다.** 미리 지어 둔 지면은 소스가 없어 못 붙일 수
 *   있고, 그때는 «못 붙인 것»이 맞다. 그래서 **기준선보다 늘면** 운다.
 * ⛔ 그리고 **날짜가 전부 오늘이면 그것도 운다.** 빌드한 날을 다 박으면 「매일 전부
 *   바뀌었다」는 거짓말이 되고, 크롤러가 알아채면 lastmod 를 통째로 무시한다 —
 *   없느니만 못하다. (3번이 백년지도에서 먼저 겪고 적어 둔 것이다)
 *
 * 쓰는 법:
 *   node scripts/check-kcw-sitemap-lastmod.mjs
 *   node scripts/check-kcw-sitemap-lastmod.mjs --기준선갱신
 *   node scripts/check-kcw-sitemap-lastmod.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사이트맵 = path.join(뿌리, 'dist/wikitip/sitemap.xml');
const 기준선길 = path.join(뿌리, 'src/data/kcw-sitemap-lastmod-baseline.json');

/* ── 재는 규칙 (순수 함수) ─────────────────────────────────── */

/** 사이트맵 글자 → 줄마다 { 주소, 날 }. 날이 없으면 null. */
export function 읽기(글자) {
  return [...String(글자 ?? '').matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    주소: (m[1].match(/<loc>([^<]*)<\/loc>/) ?? [])[1] ?? '',
    날: (m[1].match(/<lastmod>([^<]*)<\/lastmod>/) ?? [])[1]?.slice(0, 10) ?? null,
  }));
}

/** 주소 → 갈래(첫 조각). `/market/japan` → `/market`, `/about` → `/about` */
export function 갈래(주소) {
  const p = String(주소 ?? '').replace(/^https?:\/\/[^/]+/, '') || '/';
  const m = p.match(/^\/([^/]+)\//);
  return m ? `/${m[1]}` : p;
}

/**
 * 잰 것.
 * @returns { 전체, 없는수, 갈래별, 날별, 오늘몫 }
 */
export function 재기(줄들, 오늘) {
  const 없는것 = 줄들.filter((r) => !r.날);
  const 갈래별 = {};
  for (const r of 없는것) 갈래별[갈래(r.주소)] = (갈래별[갈래(r.주소)] ?? 0) + 1;
  const 날별 = {};
  for (const r of 줄들) if (r.날) 날별[r.날] = (날별[r.날] ?? 0) + 1;
  const 날있는수 = 줄들.length - 없는것.length;
  return {
    전체: 줄들.length,
    없는수: 없는것.length,
    갈래별,
    날별,
    /* 🔴 「오늘 날짜가 몇 퍼센트인가」 — 100% 면 거짓 신호다 */
    오늘몫: 날있는수 ? (날별[오늘] ?? 0) / 날있는수 : 0,
  };
}

/* ── 화면 ─────────────────────────────────────────────────── */

function 기준선읽기() {
  try { return JSON.parse(fs.readFileSync(기준선길, 'utf8')); } catch { return null; }
}

function 화면() {
  if (!fs.existsSync(사이트맵)) {
    console.log('# 사이트맵 lastmod');
    console.log(`  ⚠ 사이트맵이 없다 — ${path.relative(뿌리, 사이트맵)}`);
    console.log('     ⛔ 「못 쟀다」는 「통과」가 아니다. 먼저 빌드하십시오.');
    return { 깨졌나: false, 못잼: true };
  }
  const 오늘 = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const 잰것 = 재기(읽기(fs.readFileSync(사이트맵, 'utf8')), 오늘);
  const 기준선 = 기준선읽기();

  console.log('# 사이트맵에 「언제 바뀌었나」가 적혀 있는가');
  console.log(`  주소 ${잰것.전체.toLocaleString('en-US')}개 · lastmod 없는 것 **${잰것.없는수}개**`);
  for (const [k, v] of Object.entries(잰것.갈래별).sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`     ${k} ${v}개`);
  }
  console.log(`  날짜가 오늘(${오늘})인 몫 — ${(잰것.오늘몫 * 100).toFixed(1)}%`);

  let 깨졌나 = false;

  /* ① 없는 것이 늘었나 */
  const 기준없음 = !기준선 || !Number.isFinite(기준선.없는수);
  if (기준없음) {
    console.log('\n⚠ 기준선이 없다 — 재기만 하고 막지 않는다.');
    console.log('   `--기준선갱신` 으로 지금 수를 적어 두십시오.');
  } else if (잰것.없는수 > 기준선.없는수) {
    깨졌나 = true;
    console.log(`\n🔴 **늘었다** — 기준선 ${기준선.없는수}개 → 지금 ${잰것.없는수}개.`);
    console.log('   새 갈래를 냈는데 사이트맵이 그 지면의 날짜를 모르는 것입니다.');
    console.log('   ⛔ 손으로 짝을 적지 마십시오 — `소스찾기` 가 자동으로 찾습니다.');
    console.log('     미리 지은 지면(public/)이면 그 지면이 읽는 자료의 generated 를 주십시오.');
  } else if (잰것.없는수 < 기준선.없는수) {
    console.log(`\n✅ 줄었다 — 기준선 ${기준선.없는수}개 → 지금 ${잰것.없는수}개.`);
    console.log('   ⭐ `--기준선갱신` 으로 내려 적으십시오. 그래야 되돌아가는 것을 막습니다.');
  } else {
    console.log('\n✅ 기준선 그대로다');
  }

  /* ② 전부 오늘이면 거짓 신호다 */
  if (잰것.오늘몫 >= 0.98 && 잰것.전체 > 50) {
    깨졌나 = true;
    console.log('\n🔴🔴 **날짜가 사실상 전부 오늘이다.** 빌드한 날을 박은 것으로 보인다.');
    console.log('   ⛔ 「매일 전부 바뀌었다」는 거짓말이고, 크롤러가 알아채면 lastmod 를');
    console.log('     통째로 무시한다 — **없느니만 못하다.** 자료의 generated 나 git 날을 쓰십시오.');
  }

  return { 깨졌나, 못잼: false, 잰것 };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 조건) => { if (조건) { 통과++; console.log(`  ✅ ${이름}`); } else { 실패++; console.log(`  ⛔ ${이름}`); } };

  const 글 = `<urlset>
  <url><loc>https://a.b/market/japan</loc><lastmod>2026-08-27</lastmod></url>
  <url><loc>https://a.b/market/korea</loc></url>
  <url><loc>https://a.b/person/iu</loc></url>
  <url><loc>https://a.b/about</loc><lastmod>2026-08-01</lastmod></url>
</urlset>`;
  const 줄 = 읽기(글);
  검('줄을 다 읽는다', 줄.length === 4);
  검('날이 없으면 null 이다', 줄[1].날 === null);
  검('날을 열 자로 자른다', 읽기('<url><loc>x</loc><lastmod>2026-08-27T10:00:00Z</lastmod></url>')[0].날 === '2026-08-27');
  검('빈 입력이어도 안 죽는다', 읽기().length === 0 && 읽기(null).length === 0);

  검('갈래를 첫 조각으로 본다', 갈래('https://a.b/market/japan') === '/market');
  검('한 조각짜리는 그대로다', 갈래('https://a.b/about') === '/about');
  검('첫 장은 /', 갈래('https://a.b') === '/');

  const r = 재기(줄, '2026-08-27');
  검('🔴 없는 것을 센다', r.없는수 === 2);
  검('갈래별로 가른다', r.갈래별['/market'] === 1 && r.갈래별['/person'] === 1);
  검('⭐ 오늘 몫을 «날이 있는 것 중»에서 센다 — 없는 것을 분모에 넣지 않는다',
    Math.abs(r.오늘몫 - 0.5) < 1e-9);
  검('날이 하나도 없어도 안 죽는다', 재기([{ 주소: 'x', 날: null }], '2026-08-27').오늘몫 === 0);
  검('빈 배열이어도 안 죽는다', 재기([], '2026-08-27').전체 === 0);

  console.log(`\n자가시험 ${통과 + 실패}개 · 실패 ${실패}개`);
  return 실패;
}

const 이파일직접 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일직접) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
  else {
    const r = 화면();
    if (process.argv.includes('--기준선갱신') && r.잰것) {
      fs.writeFileSync(기준선길, `${JSON.stringify({
        잰날: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10),
        전체: r.잰것.전체,
        없는수: r.잰것.없는수,
        _왜: 'lastmod 가 없는 지면 수. 이 수보다 늘면 검사가 깨진다. 2026-08-27 에 1,446개였던 것을 1개로 줄였다.',
      }, null, 2)}\n`);
      console.log(`\n✅ 기준선을 적었다 — 없는수 ${r.잰것.없는수}`);
      process.exit(0);
    }
    process.exit(r.깨졌나 || r.못잼 ? 1 : 0);
  }
}
