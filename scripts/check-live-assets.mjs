#!/usr/bin/env node
/**
 * check-live-assets.mjs — **지면이 «부르는 파일»이 라이브에 실제로 있는지 잰다.**
 *
 * ── 🔴 왜 생겼나 ─────────────────────────────────────────────
 * 2026-08-29 새벽, 캐릭터 영상을 지면에 걸고 배포했다. 배포 자가 「표식 떴다 — 나갔다」로
 * ✅ 판정했다. 그런데 **영상만 404** 였다 — 파일을 6번(SeoulMarkets) 자리에 두었기 때문이다.
 *
 * ```
 *   표식이 뜬다      = 지면 HTML 이 «새것»이다
 *   표식이 뜬다  ≠   거기 걸린 «파일»이 실제로 있다
 * ```
 * ⛔ 손님에게는 깨진 영상 자리가 보였고, 우리 기록에는 「배포 완료」로 남았다.
 *    「닿는 것과 걷는 것은 다르다」 — 글자는 떴고 영상은 없었다.
 *
 * ⭐ 그래서 이 자는 지면 HTML 을 읽어 **img·video·source·poster·link·script 가 부르는
 *    우리 파일**을 뽑고, 그것을 하나씩 눌러 본다. 하나라도 404 면 실패로 끝난다.
 *
 * ⚠ 남의 집(다른 도메인)은 안 잰다 — 우리가 고칠 수 없는 것으로 실패를 만들지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-live-assets.mjs https://www.kculturewire.com/school
 *   node scripts/check-live-assets.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * HTML 에서 «우리 파일»의 주소를 뽑는다.
 * ⚠ `srcset` 은 「주소 1x, 주소 2x」 꼴이라 쉼표로 갈라야 한다.
 */
export function 부르는것뽑기(html, 집 = '') {
  const 나온것 = new Set();
  const 넣기 = (주소) => {
    const s = String(주소 ?? '').trim();
    if (!s || s.startsWith('data:') || s.startsWith('#') || s.startsWith('mailto:')) return;
    if (/^https?:\/\//i.test(s)) { if (집 && s.startsWith(집)) 나온것.add(s.slice(집.length)); return; }
    if (!s.startsWith('/')) return;          // 상대 주소는 지면마다 뜻이 달라 안 센다
    나온것.add(s);
  };
  for (const m of String(html ?? '').matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/g)) 넣기(m[1]);
  for (const m of String(html ?? '').matchAll(/\bsrcset=["']([^"']+)["']/g)) {
    for (const 조각 of m[1].split(',')) 넣기(조각.trim().split(/\s+/)[0]);
  }
  return [...나온것];
}

/** 잴 값어치가 있는 것만 — 지면(html)이 아니라 «딸린 파일»을 본다 */
export const 파일꼴 = /\.(mp4|webm|jpg|jpeg|png|webp|avif|gif|svg|css|js|mjs|woff2?|pdf|json|xml)$/i;

export function 잴것만(주소들) {
  return (주소들 ?? []).filter((s) => 파일꼴.test(String(s).split('?')[0]));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, ok) => { if (ok) 통 += 1; else 실.push(이름); };

  검('video src 를 뽑는다', 부르는것뽑기('<video src="/video/a.mp4">').includes('/video/a.mp4'));
  검('⭐ poster 도 뽑는다 — 이번에 깨진 것이 poster 였다',
    부르는것뽑기('<video poster="/video/thumb/a.jpg">').includes('/video/thumb/a.jpg'));
  검('img src 를 뽑는다', 부르는것뽑기('<img src="/a.png">').includes('/a.png'));
  검('srcset 을 쉼표로 가른다', (() => {
    const r = 부르는것뽑기('<img srcset="/a.png 1x, /b.png 2x">');
    return r.includes('/a.png') && r.includes('/b.png');
  })());
  검('⛔ data: 는 안 센다', 부르는것뽑기('<img src="data:image/png;base64,xx">').length === 0);
  검('⛔ 남의 집은 안 센다 — 우리가 못 고치는 것으로 실패를 만들지 않는다',
    부르는것뽑기('<img src="https://example.com/a.png">').length === 0);
  검('⭐ 우리 집 절대주소는 «상대»로 바꿔 센다',
    부르는것뽑기('<img src="https://www.kculturewire.com/a.png">', 'https://www.kculturewire.com')
      .includes('/a.png'));
  검('⛔ 상대 주소는 안 센다 — 지면마다 뜻이 다르다',
    부르는것뽑기('<img src="a.png">').length === 0);
  검('지면(html)은 «딸린 파일»이 아니다', 잴것만(['/school', '/a.mp4']).length === 1);
  검('물음표가 붙어도 확장자를 읽는다', 잴것만(['/a.mp4?v=2']).length === 1);
  검('빈 값도 안 터진다', 부르는것뽑기(null).length === 0 && 잴것만(null).length === 0);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 지면이 부르는 파일을 재는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const 지면 = process.argv[2];
  if (!지면 || !/^https?:\/\//.test(지면)) {
    console.log('⛔ 아무것도 안 쟀습니다 — 잴 지면 주소를 안 주셨습니다.\n');
    console.log('쓰는 법');
    console.log('  node scripts/check-live-assets.mjs https://www.kculturewire.com/school\n');
    console.log('⚠ 조용히 끝나면 다음 사람이 「괜찮구나」로 읽습니다. 그래서 2 로 끝냅니다.');
    process.exit(2);
  }
  const 집 = new URL(지면).origin;
  const r = await fetch(지면);
  if (!r.ok) { console.error(`⛔ 지면 자체가 ${r.status} 다 — ${지면}`); process.exit(1); }
  const html = await r.text();
  const 잴것 = 잴것만(부르는것뽑기(html, 집));

  console.log(`■ ${지면}\n  지면이 부르는 우리 파일 ${잴것.length}개를 눌러 봅니다\n`);
  const 깨진것 = [];
  for (const 주소 of 잴것) {
    const c = await fetch(집 + 주소, { method: 'GET', headers: { Range: 'bytes=0-0' } })
      .then((x) => x.status).catch(() => 0);
    const ok = c >= 200 && c < 400;
    if (!ok) 깨진것.push(`${주소} → ${c}`);
    console.log(`  ${ok ? '✅' : '⛔'} ${String(c).padStart(3)}  ${주소}`);
  }
  if (깨진것.length) {
    console.error(`\n⛔ ${깨진것.length}개가 깨져 있습니다 — 손님에게 빈 자리가 보입니다`);
    깨진것.forEach((s) => console.error(`   · ${s}`));
    console.error('\n⚠ 배포 표식이 떴다고 끝난 것이 아닙니다. 글자는 떠도 파일은 없을 수 있습니다.');
    process.exit(1);
  }
  console.log(`\n✅ ${잴것.length}개 전부 살아 있습니다`);
}
