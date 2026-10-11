#!/usr/bin/env node
/* 고치면서 «반대쪽»으로 넘어가지 않았나 — 한쪽으로만 쏠린 자리를 센다. (5번 2026-10-12 07:3x)
 *
 * 🔴🔴 왜 있나 — 2026-10-12 에 겪은 것
 *   2026-10-06 에 이런 흠을 고쳤다 —
 *     「색인 요청 28건 중 26건이 klifemap 이다. 한 사이트만 넣고 있었다」
 *   고친 뒤 오늘 재 보니 **열 장이 전부 seoulmarkets 로** 갔다.
 *   ⇒ **고치면서 반대쪽으로 넘어간 것**이다. 쏠림의 «방향»만 바뀌고 쏠림은 그대로다.
 *
 *   ⛔ 그리고 그 파일 주석에는 「사이트를 돌아가며 넣는다」고 적혀 있었다.
 *     **글은 옳았고 코드가 틀렸다.** 글을 믿고 안 쟀으면 또 며칠을 버렸다.
 *
 * ⭐⭐ 이 꼴은 되풀이된다 — 고치는 사람은 «방금 본 쪽»을 메우려 하기 때문이다.
 *   그래서 「고쳤나」가 아니라 **「한쪽으로 쏠렸나」**를 묻는 자가 따로 있어야 한다.
 *
 * ⚠ 이 자가 할 수 있는 것과 못 하는 것
 *   할 수 있다 — 색인 요청 대장에서 «최근 며칠이 한 사이트로만 갔나»
 *   못 한다   — 모든 종류의 쏠림. 그건 셀 수 없다
 *   ⛔ 겪은 자리만 못 박는다. 하나 겪을 때마다 한 줄 더한다.
 *
 * 돌리기   node scripts/check-고치면서-반대쪽으로-갔나.mjs
 * 자가시험 node scripts/check-고치면서-반대쪽으로-갔나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 며칠을 보나 — 이보다 짧으면 하루 몰아 넣은 것과 못 가른다 */
export const 볼날수 = 5;
/** 이 비율을 넘게 한쪽으로 가면 쏠린 것이다. ⚠ 어림수다 */
export const 쏠림선 = 0.9;

/** 주소에서 터 이름만 — klifemap.ai · seoulmarkets.com … */
export function 터이름(주소) {
  const m = String(주소 ?? '').match(/^https?:\/\/(?:www\.)?([^/]+)/);
  return m ? m[1] : '';
}

/** 대장 줄에서 최근 며칠을 터별로 센다 */
export function 터별로센다(줄들, 날수 = 볼날수) {
  if (!Array.isArray(줄들)) return null;
  const 날들 = [...new Set(줄들.map((x) => x.날))].sort().slice(-날수);
  const 셈 = {};
  for (const x of 줄들) {
    if (!날들.includes(x.날)) continue;
    const t = 터이름(x.주소);
    if (!t) continue;
    셈[t] = (셈[t] ?? 0) + 1;
  }
  return { 날들, 셈 };
}

/** 한쪽으로 쏠렸나 — 가장 많은 터가 전체의 쏠림선을 넘나 */
export function 쏠렸나(셈, 선 = 쏠림선) {
  const 값들 = Object.values(셈 ?? {});
  const 합 = 값들.reduce((a, b) => a + b, 0);
  if (합 < 10) return null;            /* 적게 넣은 날은 가리지 않는다 */
  if (Object.keys(셈).length <= 1 && 합 < 20) return null;
  return Math.max(...값들) / 합 > 선;
}

/** 색인 요청기가 쓰는 사이트맵 «차례»를 그 소스에서 읽어 온다.
 *  ⚠ 소스를 읽는 것이지만 라이브를 짐작하는 것이 아니다 — 차례를 정하는 곳이 «그 코드»다. */
export function 차례를읽는다(글) {
  const m = String(글 ?? '').match(/const\s+사이트맵차례\s*=\s*\[([\s\S]*?)\]/);
  if (!m) return null;
  return [...m[1].matchAll(/[\x27"]([^\x27"]+)[\x27"]/g)].map((x) => x[1]);
}

/** 앞으로 며칠이 어느 터로 가나 — 차례는 날짜로만 정해지므로 «짜 볼 수» 있다.
 *  🔴 지난 것만 재면 방금 고친 것을 못 본다. 고친 직후엔 늘 ✅ 가 뜬다. */
export function 앞날을짜본다(차례, 날수 = 10, 오늘하루수 = null) {
  if (!Array.isArray(차례) || !차례.length) return null;
  const d = new Date();
  const 기준 = 오늘하루수 ?? Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const 셈 = {};
  const 날마다 = [];
  for (let i = 0; i < 날수; i++) {
    /* 색인요청기와 «같은» 셈이어야 한다 — 다르면 이 자는 사람을 속인다 */
    const 자리 = (기준 + i) % 차례.length;
    const t = 터이름(차례[자리]);
    날마다.push(t);
    셈[t] = (셈[t] ?? 0) + 1;
  }
  return { 셈, 날마다 };
}
/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  test('터 이름을 뽑는다 — www 는 뗀다', () => {
    A.equal(터이름('https://klifemap.ai/daily.html'), 'klifemap.ai');
    A.equal(터이름('https://www.kculturewire.com/about'), 'kculturewire.com');
    A.equal(터이름('엉뚱한 글'), '');
  });
  test('🔴 한쪽으로 쏠린 것을 잡는다 — 2026-10-12 에 실제로 그랬다', () => {
    A.equal(쏠렸나({ 'seoulmarkets.com': 20, 'klifemap.ai': 0 }), true);
    A.equal(쏠렸나({ 'klifemap.ai': 26, 'seoulmarkets.com': 1 }), true, '2026-10-06 의 모습이다');
  });
  test('⛔ 고루 간 것은 안 걸린다', () => {
    A.equal(쏠렸나({ 'seoulmarkets.com': 12, 'klifemap.ai': 10 }), false);
  });
  test('⚠ 적게 넣은 날은 «가리지 않는다» — 모른다고 한다', () => {
    /* ⛔ 두세 장 넣은 날을 「쏠렸다」로 치면 날마다 거짓 빨강이 뜬다. */
    A.equal(쏠렸나({ 'seoulmarkets.com': 3 }), null);
    A.equal(쏠렸나({}), null);
  });
  test('최근 며칠만 센다', () => {
    const 줄들 = [
      { 날: '2026-10-01', 주소: 'https://a.com/1' },
      { 날: '2026-10-11', 주소: 'https://b.com/1' },
      { 날: '2026-10-12', 주소: 'https://b.com/2' },
    ];
    const r = 터별로센다(줄들, 2);
    A.deepEqual(r.날들, ['2026-10-11', '2026-10-12']);
    A.equal(r.셈['a.com'], undefined, '오래된 날을 셌다');
    A.equal(r.셈['b.com'], 2);
  });
  test('⚠ 쏠림선은 어림수다 — 코드에 그렇게 적혀 있다', () => {
    const 나 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
    A.ok(나.includes('어림수다'), '못 박은 값인 척하지 않는다');
  });
  test('🔴🔴 앞날을 짜 본다 — 지난 것만 재면 방금 고친 것을 못 본다', () => {
    /* 오늘 아침에 자가 ✅ 를 냈는데, 그 닷새는 «고치기 전»의 날들이었다. */
    const 넷 = ['https://a.com/1.xml', 'https://b.com/1.xml', 'https://a.com/2.xml', 'https://a.com/3.xml'];
    const r = 앞날을짜본다(넷, 8, 0);
    A.equal(r.셈['a.com'], 6, '넷 중 셋이 a 이면 앞날도 4분의 3이다');
    A.equal(r.셈['b.com'], 2);
  });
  test('차례를 코드에서 읽어 온다', () => {
    const 글 = '  const 사이트맵차례 = [\n    "https://x.com/a.xml",\n    "https://y.ai/b.xml",\n  ];';
    A.deepEqual(차례를읽는다(글), ['https://x.com/a.xml', 'https://y.ai/b.xml']);
    A.equal(차례를읽는다('없다'), null);
  });
  test('⚠ 이 자가 헛돌지 않나 — 진짜 색인요청기의 차례를 읽어 낸다', () => {
    /* ⛔ 읽는 꼴이 어긋나면 null 이 되고, 그러면 이 자는 아무것도 안 보면서 ✅ 를 낸다. */
    const 진짜 = fs.readFileSync(path.join(뿌리, 'scripts/날마다-색인요청.mjs'), 'utf8');
    const 차례 = 차례를읽는다(진짜);
    A.ok(Array.isArray(차례) && 차례.length >= 2, '차례를 못 읽었다 — 꼴이 바뀌었나');
    A.ok(차례.every((u) => 터이름(u)), '터 이름을 못 뽑은 줄이 있다');
  });
  test('🔴 앞날이 한쪽으로 쏠리면 잡는다 — 2026-10-12 아침의 차례가 그랬다', () => {
    const 옛차례 = ['https://seoulmarkets.com/sitemap-pages.xml', 'https://klifemap.ai/sitemap-core.xml',
      'https://seoulmarkets.com/sitemap-companies.xml', 'https://seoulmarkets.com/sitemap-japan.xml'];
    const r = 앞날을짜본다(옛차례, 20, 0);
    A.equal(r.셈['klifemap.ai'] / 20, 0.25, 'klifemap 이 나흘에 하루였다');
  });

  test('배열이 아니면 null', () => {
    A.equal(터별로센다(null), null);
  });
}

const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  await 자가시험();
} else if (내가실행됐다) {
  console.log('■ 고치면서 «반대쪽»으로 넘어가지 않았나 — 색인 요청이 한 터로만 가나');
  console.log('   ⭐ 이 꼴은 되풀이된다 — 고치는 사람은 «방금 본 쪽»을 메우려 하기 때문이다.');
  console.log('   ⛔ 「고쳤나」가 아니라 「한쪽으로 쏠렸나」를 묻는다.');
  console.log('');

  const 대장길 = path.join(뿌리, 'docs/색인요청-대장.tsv');
  let 줄들;
  try {
    줄들 = fs.readFileSync(대장길, 'utf8').split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => { const [날, 주소, 결과] = l.split('\t'); return { 날, 주소, 결과 }; })
      .filter((x) => x.날 && x.주소);
  } catch (e) {
    console.log('⬜ 대장을 못 읽었다 — ' + e.message);
    process.exit(0);
  }

  const r = 터별로센다(줄들);
  const 합 = Object.values(r.셈).reduce((a, b) => a + b, 0);
  console.log('   최근 ' + r.날들.length + '일 (' + (r.날들[0] ?? '') + ' ~ ' + (r.날들.at(-1) ?? '') + ') · 모두 ' + 합 + '건');
  for (const [t, n] of Object.entries(r.셈).sort((a, b) => b[1] - a[1])) {
    console.log('      ' + String(n).padStart(4) + '건  ' + Math.round((n / 합) * 100) + '%  ' + t);
  }

  console.log('');
  const 답 = 쏠렸나(r.셈);
  if (답 === null) { console.log('⬜ 아직 적게 넣었다 — 가리지 않는다'); process.exit(0); }
  if (답) {
    console.log('🔴 한 터로만 가고 있다 — 고치면서 반대쪽으로 넘어간 꼴이다.');
    console.log('   ⚠ 먼저 볼 곳: `날마다-색인요청.mjs` 의 사이트맵 차례가 «돌아가나».');
    console.log('     2026-10-12 에 그 자리가 「아직 안 넣은 것이 남은 첫 사이트맵」에서 멈추고 있었다.');
    console.log('   ⛔ 반대쪽으로 또 넘기지 않는다. 날짜로 번갈아 가게 둔다.');
    process.exit(1);
  }
  console.log(답 ? '' : '✅ 지난 날들은 한쪽으로 쏠리지 않았다');

  /* 🔴🔴 지난 것만 재면 방금 고친 것을 못 본다 — 앞날도 짜 본다 */
  console.log('');
  console.log('■ 앞으로 열흘을 «짜 본다» — 차례는 날짜로만 정해지므로 돌리지 않고 알 수 있다');
  console.log('   🔴 지난 것만 재면 방금 고친 것을 못 본다. 고친 직후엔 언제나 ✅ 가 뜬다.');
  let 앞탈 = false;
  try {
    const 차례 = 차례를읽는다(fs.readFileSync(path.join(뿌리, 'scripts/날마다-색인요청.mjs'), 'utf8'));
    if (!차례) {
      console.log('   ⬜ 차례를 못 읽었다 — 꼴이 바뀌었나. 「쏠리지 않았다」가 아니라 **못 쟀다**');
    } else {
      const 앞 = 앞날을짜본다(차례, 10);
      console.log('   차례 ' + 차례.length + '자리 · 앞으로 열흘: ' + 앞.날마다.join(' '));
      for (const [t, n] of Object.entries(앞.셈).sort((a, b) => b[1] - a[1])) {
        console.log('      ' + String(n).padStart(3) + '일  ' + (n * 10) + '%  ' + t);
      }
      const 가장큰 = Math.max(...Object.values(앞.셈)) / 10;
      if (가장큰 > 0.7) {
        console.log('   🔴 앞으로도 한 터가 ' + Math.round(가장큰 * 100) + '% 를 가져간다 — 차례 자체가 기울었다.');
        console.log('      ⚠ 그날은 사이트맵 «하나»에서 열 장을 다 쓴다. 차례가 곧 몫이다.');
        console.log('      ⛔ 반대쪽으로 넘기지 않는다 — 번갈아 놓는다.');
        앞탈 = true;
      } else {
        console.log('   ✅ 앞으로도 고르게 돈다');
      }
    }
  } catch (err) {
    console.log('   ⬜ 앞날을 못 짜 봤다 — ' + err.message);
  }
  process.exit(답 || 앞탈 ? 1 : 0);
}
