#!/usr/bin/env node
/**
 * 백년지도 주소를 **IndexNow 로 통보한다.**
 *
 *   node scripts/indexnow-100y.mjs --자가시험
 *   node scripts/indexnow-100y.mjs --고정          고정 지면만 (첫 통보)
 *   node scripts/indexnow-100y.mjs --전부          사이트맵 전부
 *
 * ## 🔴 왜 만드나
 *
 *   사장님 지시(2026-08-14) 「**실무적인 데는 내가 없다고 생각해라**」·「스스로 해결하도록 해라」.
 *   그리고 2번이 짚었다 — 「IndexNow 열쇠는 **스스로 만든다. 승인도 계정도 필요 없다**」.
 *
 *   ⭐ **네이버는 IndexNow 를 받는 검색엔진이다.** 우리 네이버 수집이 8/14 에 **1장**이었다.
 *     robots·사이트맵·lastmod·링크는 다 맞는데 안 담기고 있었다. 그동안 나는
 *     「남은 건 네이버가 받아 가는 일」이라고 적어 두고 **기다리기만 했다.**
 *     기다릴 일이 아니라 **통보할 일**이었다.
 *
 *   ⚠ 열쇠 파일은 **이미 있었다** — `public/47ae…txt` 는 저장소 첫 커밋부터 있었고
 *     세 도메인에서 다 200 이다. 없던 것은 열쇠가 아니라 **통보**였다.
 *     ⭐ 2번 말 그대로다 — 「없는 게 아니라 아무도 주소를 몰랐던 것」.
 *
 * ## ⛔ 조심한 것
 *
 *   ⛔ 열쇠 값을 화면에 찍지 않는다. 파일에서 읽어 그대로 보낸다.
 *   ⛔ 한 번에 다 밀어 넣지 않는다. **고정 지면부터** 보내고 답을 보고 늘린다.
 *   ⚠ 통보는 「담아 달라」는 부탁이지 명령이 아니다. **담겼는지는 따로 세야 한다.**
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = fileURLToPath(new URL('..', import.meta.url));
export const 집 = 'https://100yearmap.com';
export const 받는곳 = 'https://api.indexnow.org/indexnow';

/** public/ 에서 32자 hex 이름의 열쇠 파일을 찾는다. ⛔ 값을 찍지 않는다 */
export function 열쇠찾기(방 = path.join(뿌리, 'public')) {
  const 이름 = fs.readdirSync(방).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!이름) return null;
  const 값 = fs.readFileSync(path.join(방, 이름), 'utf8').trim();
  /* 🔴 IndexNow 규칙 — 파일 이름과 속이 같아야 한다. 다르면 검색엔진이 버린다 */
  return 값 === 이름.replace('.txt', '') ? { 이름, 값 } : null;
}

/** 사이트맵에서 주소를 뽑는다 */
export function 사이트맵주소(글) {
  return [...String(글).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/** 고정 지면 — 첫 통보는 이것부터 */
export const 고정지면 = [
  '/', '/about', '/price', '/terms', '/privacy', '/refund',
  '/after', '/work', '/how-long', '/size', '/data', '/research',
  '/video', '/region', '/age', '/major', '/college-major', '/school', '/university',
];

/** IndexNow 한 번에 보낼 수 있는 것은 1만 개다 */
export const 한번최대 = 10000;

export function 묶기(주소들, 크기 = 한번최대) {
  const 답 = [];
  for (let i = 0; i < 주소들.length; i += 크기) 답.push(주소들.slice(i, i + 크기));
  return 답;
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 본다 = (이름, 참) => { if (참) 통과++; else { 실패++; console.error('  ✗ ' + 이름); } };

  const 열쇠 = 열쇠찾기();
  본다('① 열쇠 파일이 있다', 열쇠 !== null);
  본다('② 🔴 파일 이름과 속이 같다 — 다르면 검색엔진이 버린다', 열쇠 !== null);
  본다('③ 열쇠가 32자다', 열쇠 && 열쇠.값.length === 32);
  본다('④ ⛔ 열쇠 값을 안 찍는다', !JSON.stringify(process.argv).includes(열쇠?.값 ?? 'x'));

  본다('⑤ 사이트맵에서 주소를 뽑는다',
    사이트맵주소('<loc>https://a/b</loc><loc>https://a/c</loc>').length === 2);
  본다('⑥ 빈 글은 0개', 사이트맵주소('').length === 0);

  본다('⑦ 1만 개씩 묶는다', 묶기(Array.from({ length: 25000 }, (_, i) => i)).length === 3);
  본다('⑧ 적으면 한 묶음', 묶기([1, 2, 3]).length === 1);
  본다('⑨ 없으면 0묶음', 묶기([]).length === 0);

  본다('⑩ 고정 지면이 열아홉이다', 고정지면.length === 19);
  본다('⑪ 첫 화면이 들어 있다', 고정지면.includes('/'));

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다) {
  const 열쇠 = 열쇠찾기();
  if (!열쇠) { console.error('⛔ public/ 에 쓸 만한 열쇠 파일이 없다'); process.exit(1); }
  /* ⛔ 값을 안 찍는다. 있다는 것만 알린다 */
  console.log(`✅ 열쇠 파일 있음 (32자) · ${집}/${열쇠.이름} 에서 열린다`);

  let 주소들;
  if (process.argv.includes('--전부')) {
    const 답 = await fetch(집 + '/sitemap.xml');
    주소들 = 사이트맵주소(await 답.text());
    console.log(`사이트맵에서 ${주소들.length.toLocaleString()}개를 뽑았다`);
  } else {
    주소들 = 고정지면.map((p) => 집 + p);
    console.log(`고정 지면 ${주소들.length}개를 보낸다 — 첫 통보다`);
  }

  const 묶음들 = 묶기(주소들);
  for (let i = 0; i < 묶음들.length; i++) {
    const 답 = await fetch(받는곳, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: '100yearmap.com',
        key: 열쇠.값,
        keyLocation: `${집}/${열쇠.이름}`,
        urlList: 묶음들[i],
      }),
    });
    const 글 = await 답.text();
    /* 200 = 받았다 · 202 = 받았고 열쇠는 나중에 본다 */
    const 됐나 = 답.status === 200 || 답.status === 202;
    console.log(`  ${됐나 ? '✅' : '🔴'} ${i + 1}/${묶음들.length}묶음 · ${묶음들[i].length}개 · 상태 ${답.status}` +
      (글.trim() ? ` · ${글.trim().slice(0, 80)}` : ''));
  }
  console.log('');
  console.log('⚠ 통보는 「담아 달라」는 부탁이지 명령이 아니다. **담겼는지는 따로 세야 한다.**');
}
