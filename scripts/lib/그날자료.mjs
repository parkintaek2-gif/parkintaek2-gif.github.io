/**
 * 그날자료 — **기사를 잴 때는 «기사가 잰 날»의 스냅숏으로 잰다.**
 *
 *   node scripts/lib/그날자료.mjs --자가시험
 *
 * ── 🔴 왜 이것이 생겼나 (2026-09-22) ─────────────────────────────────────
 * 기사와 원자료를 맞대는 자 둘이 **가장 새 스냅숏**을 집고 있었다. 그래서 자료를 다시 받을
 * 때마다 지난 기사가 통째로 「틀렸다」로 떴다 — **기사는 안 틀렸다.** 세상이 움직였을 뿐이다.
 *
 * ```
 * kpop-attention-top-is-actors      24건 빨강   → 자를 고치니 26건 전부 맞았다
 * korean-actors-more-titles-…        …건 빨강   → 같은 병
 * ```
 *
 * ⛔ 「검사를 통과시키려고 기사 수를 고친다」로 풀지 않는다 — 발행한 날의 사실을
 *   나중 자료로 덮는 것이고, 그것은 기사를 거짓으로 만든다.
 * ✅ 기사는 자기가 언제 잰 것인지 앞머리(`dataAsOf`)에 적는다. 그 날을 «넘지 않는»
 *   스냅숏 가운데 가장 늦은 것이 그 기사가 본 자료다.
 * ⚠ 그날 이전 자료가 하나도 없으면 «가장 이른 것»을 준다 — 그러면 검사가 빨강으로 서고,
 *   그 빨강은 「기사가 틀렸다」가 아니라 「그날 자료가 곳간에 없다」는 뜻이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 파일 이름에서 날짜 여덟 자리를 뽑는다 — `actors-20260822.json` · `language-reads-2026-09-09.json` */
export function 날여덟자리(이름) {
  const m = /(\d{8})|(\d{4}-\d{2}-\d{2})/.exec(String(이름 || ''));
  if (!m) return null;
  return m[1] || m[2].replace(/-/g, '');
}

/**
 * @param {string[]} 파일들  곳간 폴더의 파일 이름들
 * @param {RegExp}   무늬    고를 파일 꼴
 * @param {string?}  잰날    기사의 dataAsOf (`2026-08-22` 또는 ISO)
 * @returns {string|null}
 */
export function 그날자료고르기(파일들, 무늬, 잰날) {
  const 후보 = (파일들 || []).filter((x) => 무늬.test(x)).sort();
  if (!후보.length) return null;
  if (!잰날) return 후보[후보.length - 1];
  const 그날 = String(잰날).slice(0, 10).replace(/-/g, '');
  const 안넘는것 = 후보.filter((x) => { const d = 날여덟자리(x); return d && d <= 그날; });
  return 안넘는것.length ? 안넘는것[안넘는것.length - 1] : 후보[0];
}

/** 기사 앞머리에서 `dataAsOf` 를 읽는다. 없으면 null — ⛔ 오늘로 두지 않는다 */
export function 기사가잰날(기사길) {
  try {
    const 글 = fs.readFileSync(기사길, 'utf8');
    return /^dataAsOf:\s*"?([\d-]{10})/m.exec(글)?.[1] ?? null;
  } catch { return null; }
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);
  const 것 = ['actors-20260803.json', 'actors-20260822.json', 'actors-20260915.json', 'actors-20260919.json'];
  const 무늬 = /^actors-\d+\.json$/;

  검('날짜 여덟 자리를 뽑는다', 날여덟자리('actors-20260822.json') === '20260822');
  검('줄표 꼴도 뽑는다', 날여덟자리('language-reads-2026-09-09.json') === '20260909');
  검('날짜가 없으면 null', 날여덟자리('actors.json') === null);

  검('⭐ 그날을 넘지 않는 가장 늦은 것을 고른다',
    그날자료고르기(것, 무늬, '2026-08-22') === 'actors-20260822.json');
  검('그날에 딱 맞는 것이 없으면 그 앞의 것',
    그날자료고르기(것, 무늬, '2026-09-01') === 'actors-20260822.json');
  검('⛔ 그날 뒤의 새 자료를 집지 않는다',
    그날자료고르기(것, 무늬, '2026-08-22') !== 'actors-20260919.json');
  검('잰 날을 모르면 가장 새것을 준다',
    그날자료고르기(것, 무늬, null) === 'actors-20260919.json');
  검('ISO 꼴도 읽는다',
    그날자료고르기(것, 무늬, '2026-08-22T00:00:00+09:00') === 'actors-20260822.json');
  검('그날 앞에 아무것도 없으면 가장 이른 것 — 빨강으로 서서 알린다',
    그날자료고르기(것, 무늬, '2026-01-01') === 'actors-20260803.json');
  검('무늬에 맞는 것이 없으면 null', 그날자료고르기(것, /^kpop-/, '2026-08-22') === null);
  검('빈 목록도 견딘다', 그날자료고르기([], 무늬, '2026-08-22') === null);

  검('앞머리에서 잰 날을 읽는다',
    기사가잰날('content/kculturewire/korean-actors-more-titles-buys-a-floor.md') === '2026-08-22');
  검('없는 파일이면 null', 기사가잰날('content/없는것.md') === null);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}
