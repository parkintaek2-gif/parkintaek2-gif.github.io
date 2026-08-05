#!/usr/bin/env node
/**
 * 호스트별 경로 라우팅 시험 — **서버를 실제로 띄워서 잰다.**
 *
 * ⚠ 왜 실제로 띄우나 — 이 사고들은 **로직만 봐서는 안 보인다.**
 *   2026-08-05 에 3번이 잡은 것이 그랬다.
 *   ```
 *   404  100yearmap.com/_astro/…css   →  dist/100y/_astro/  **그런 폴더가 없다**
 *   200  seoulmarkets.com/_astro/…css →  dist/_astro/       접두사가 없어 멀쩡했다
 *   ```
 *   **빌드 통과·배포 성공·지면 200. 화면만 민얼굴이었다.** 오류가 하나도 안 난다.
 *   3번이 배포 전에 `<link>` 를 세어 봤기에 걸렸다. 안 셌으면 3,862장이 그대로 나갔다.
 *
 * 그래서 「자산이 실제로 200 인가」를 **기계가 매번 확인**하게 한다.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { request } from 'node:http';   /* ⚠ fetch 를 쓰면 안 된다 — 아래 「부르기」 주석 */
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist');

if (!existsSync(ROOT)) {
  console.log('라우팅 시험 — dist/ 가 없어 건너뛴다 (npm run build 를 먼저)');
  process.exit(0);
}

/** dist/_astro 에서 실제 파일 하나를 고른다. 이름을 지어내지 않는다 */
const 자산 = (() => {
  const d = path.join(ROOT, '_astro');
  if (!existsSync(d)) return null;
  const f = readdirSync(d).find((x) => x.endsWith('.css')) ?? readdirSync(d)[0];
  return f ? `/_astro/${f}` : null;
})();

/**
 * ⚠⚠ **빈 포트를 직접 잡아서 준다.**
 *
 * 처음엔 `39750 + pid%200` 을 쓰고 stderr 의 `EADDRINUSE` 를 **무시**하게 적었다.
 * 그 한 줄 때문에 **시험이 헛돌았다** — 포트가 이미 쓰이면 새 서버가 못 뜨고,
 * 앞서 떠 있던 **고쳐진** 서버를 시험한다. 그래서 **일부러 망가뜨린 코드도 통과**했다.
 *
 * 확인 방법은 하나다 — **일부러 틀리게 해 보고 실제로 실패하는지 본다.**
 * 그렇게 해서 잡았다. (「우리가 일하는 법」 6-1)
 */
const 빈포트 = await new Promise((resolve, reject) => {
  const s = createServer();
  s.on('error', reject);
  s.listen(0, '127.0.0.1', () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const PORT = 빈포트;

/* 일부러 망가뜨린 사본으로 「이 시험이 실제로 실패하는가」를 확인할 때 쓴다.
   `ROUTING_TEST_SERVER=server.buggy.mjs node scripts/server-routing.test.mjs` */
const 서버파일 = process.env.ROUTING_TEST_SERVER || 'server.mjs';

const 서버 = spawn(process.execPath, [서버파일], {
  env: { ...process.env, PORT: String(PORT), ADMIN_USER: '', ADMIN_HASH: '' },
  stdio: ['ignore', 'ignore', 'pipe'],
});
let 오류 = '';
서버.stderr.on('data', (d) => { 오류 += d.toString(); });

const 끝내기 = (코드) => { try { 서버.kill(); } catch { /* 이미 죽었으면 넘긴다 */ } process.exit(코드); };

/* ⚠ 뜰 때까지 기다리되 **안 뜨면 실패다.** 「기다렸으니 됐겠지」로 넘어가지 않는다 */
let 떴나 = false;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 150));
  try {
    await fetch(`http://127.0.0.1:${PORT}/`, { signal: AbortSignal.timeout(1200) });
    떴나 = true; break;
  } catch { /* 아직 */ }
}
if (!떴나) {
  console.error(`  ✕ 시험용 서버가 안 떴다 (포트 ${PORT})`);
  if (오류) console.error(오류.slice(0, 500));
  끝내기(1);
}

/**
 * ⚠⚠ **`fetch` 를 쓰면 안 된다. `Host` 헤더를 무시한다.**
 *
 * 이 시험이 **두 번째로 헛돌았을 때** 잡은 것이다.
 * ```
 * curl -H "Host: 100yearmap.com" …/_astro/x.css   →  404   (버그 재현)
 * fetch(…, {headers:{Host:'100yearmap.com'}})     →  200   (헤더가 안 먹었다)
 * ```
 * undici 는 보안상 `Host` 를 **덮어쓴다.** 그래서 요청이 `127.0.0.1:포트` 로 가고,
 * 그건 SITE_PREFIX 에 없으니 접두사가 안 붙는다 — **버그가 있어도 200 이 나온다.**
 *
 * 이 시험의 **전부가 호스트별 분기**인데 호스트를 못 보내면 아무것도 시험 못 한다.
 * → `node:http` 로 직접 보낸다. 여기서는 `Host` 가 그대로 나간다.
 *
 * (어제 3번과 내가 겪은 「셸이 한글을 CP949 로 바꾼다」와 **같은 종류**다 —
 *  도구가 입력을 바꾸면 없는 병을 고치거나 있는 병을 못 본다.)
 */
const 부르기 = (host, p) => new Promise((resolve) => {
  /* ⚠ `http.request` 는 인코딩 안 된 글자를 거부한다(ERR_UNESCAPED_CHARACTERS).
     브라우저도 한글 주소를 퍼센트 인코딩해서 보낸다 — 같게 맞춘다.
     이미 `%` 가 있는 것(`/%zz`)은 두 번 인코딩하지 않는다 */
  let 보낼경로;
  try { 보낼경로 = p.includes('%') ? p : encodeURI(p); }
  catch { 보낼경로 = p; }

  const req = request(
    { host: '127.0.0.1', port: PORT, path: 보낼경로, method: 'GET', headers: { Host: host } },
    (res) => {
      res.resume();  /* 본문은 버린다. 상태와 헤더만 본다 */
      resolve({ status: res.statusCode, location: res.headers.location ?? null });
    },
  );
  req.setTimeout(10000, () => { req.destroy(); resolve({ status: 'ERR', error: 'timeout' }); });
  req.on('error', (e) => resolve({ status: 'ERR', error: String(e.message) }));
  req.end();
}).catch((e) => ({ status: 'ERR', error: String(e?.message ?? e) }));
/*             └ ⚠ 던져서 죽으면 **띄워 둔 서버가 안 죽는다.** 다음 실행 때 포트가 남는다 */

/** 본문까지 읽는다. 404 화면의 **얼굴**을 봐야 하기 때문이다 */
const 본문 = (host, p) => new Promise((resolve) => {
  const req = request({ host: '127.0.0.1', port: PORT, path: encodeURI(p), method: 'GET', headers: { Host: host } },
    (res) => { let b = ''; res.setEncoding('utf8'); res.on('data', (c) => { b += c; }); res.on('end', () => resolve(b)); });
  req.setTimeout(10000, () => { req.destroy(); resolve(''); });
  req.on('error', () => resolve(''));
  req.end();
});

let 실패 = 0;
const 확인 = (조건, 이름, 실제) => {
  if (!조건) { 실패++; console.log(`  ✕ ${이름}${실제 !== undefined ? ` — 실제 ${JSON.stringify(실제)}` : ''}`); }
};

console.log('호스트별 라우팅');

/* ── ⭐ ① 공유 자산은 **접두사가 붙는 사이트에서도** 200 이어야 한다 ── */
if (자산) {
  /* ⚠ kculturewire.com 은 2026-08-05 에 붙인 K컬처 매체의 새 주소다.
     옛 주소 wiki-tip.com 도 **아직 살아 있어야 한다** — 301 을 걸기 전까지 둘 다 뜬다 */
  for (const host of ['seoulmarkets.com', '100yearmap.com', 'kculturewire.com', 'wiki-tip.com']) {
    const r = await 부르기(host, 자산);
    확인(r.status === 200, `⭐ ${host}${자산} 이 200`, r.status);
  }
} else {
  console.log('   (dist/_astro 가 비어 자산 시험을 건너뛴다)');
}

/* ── ② 각 사이트의 첫 화면이 뜬다 ────────────────────────────── */
for (const host of ['seoulmarkets.com', '100yearmap.com']) {
  const r = await 부르기(host, '/');
  확인(r.status === 200, `${host}/ 가 200`, r.status);
}

/* ── ⭐ ③ 301 이 **내부 접두사를 드러내지 않는다** ──────────────── */
{
  const r = await 부르기('100yearmap.com', '/school/');
  확인(r.status === 301, '/school/ 이 301', r.status);
  확인(!String(r.location ?? '').includes('/100y'),
    '⭐ 301 목적지에 내부 접두사(/100y)가 없다', r.location);
  확인(r.location === '/school', '301 목적지가 /school', r.location);
}
{
  /* 금융 사이트는 접두사가 없으니 원래 그대로여야 한다 */
  const r = await 부르기('seoulmarkets.com', '/rankings/');
  확인(r.location === '/rankings', 'seoulmarkets 는 그대로 /rankings', r.location);
}

/* ── ④ 깨진 요청에 죽지 않는다 ──────────────────────────────── */
for (const p of ['/%zz', '/../../etc/passwd', '/_astro/없는파일.css']) {
  const r = await 부르기('100yearmap.com', p);
  확인(r.status !== 'ERR', `${p} 에 서버가 살아 있다`, r.status);
}

/* ── ⭐ ⑤ 404 도 **그 사이트 얼굴**로 나와야 한다 ──────────────
 *
 * 2026-08-05 실측 — 100yearmap.com/없는주소 가 「Page not found | SeoulMarkets」였다.
 * 금융 매체 머리말이 교육 사이트 방문자에게 그대로 보였다.
 * **404 는 사람이 제일 자주 보는 실패 화면**이라, 여기서 남의 브랜드가 뜨면
 * 「이 회사가 뭐 하는 곳인가」가 흔들린다.
 *
 * ⚠ 전용 404 가 아직 없으면 공용으로 떨어지는 것이 정상이다(안전한 쪽).
 *   그래서 **전용 404 가 있을 때만** 그것이 나오는지 본다.
 */
{
  const 전용 = (p) => existsSync(path.join(ROOT, p));
  for (const [host, 접두] of [['100yearmap.com', '100y'], ['kculturewire.com', 'wikitip'], ['wiki-tip.com', 'wikitip']]) {
    const r = await 부르기(host, '/이런주소는없다-abc123');
    확인(r.status === 404, `${host} 없는 주소가 404`, r.status);
    if (전용(`${접두}/404.html`)) {
      /* 전용 404 가 생겼으면 **그것이** 나와야 한다. 공용이 나오면 실패 */
      const 몸 = await 본문(host, '/이런주소는없다-abc123');
      const 제목 = (몸.match(/<title>([^<]*)/) ?? [])[1] ?? '';
      /* ⚠ **본문에 'SeoulMarkets' 가 있는지로 보면 안 된다.** 꼬리말의 자매 사이트
         링크가 걸려 거짓 경보가 난다(2026-08-05에 실제로 났다).
         **제목**으로 본다 — 공용 404 의 제목이 나오면 그건 남의 화면이다. */
      확인(!/Page not found | SeoulMarkets/i.test(제목),
        `⭐ ${host} 404 가 공용(SeoulMarkets) 화면이 아니다`, 제목);
      확인(제목.trim().length > 0, `${host} 404 에 제목이 있다`, 제목);
    }
  }
}

/* ── ⭐ ⑥ 같은 경로가 **사이트마다 다른 화면**을 내는가 ──────────────
 *
 * ⚠⚠ **이 시험이 세 번째로 헛돌았을 때 넣은 것이다.** (2026-08-05)
 *
 * `kculturewire.com` 을 SITE_PREFIX 에서 일부러 빼고 돌렸는데 **통과했다.**
 * 앞의 검사들이 왜 못 잡았나 —
 * ```
 * ① 자산 /_astro/…      접두사 밖이라 원래 접두사와 무관하게 200 이다
 * ② 첫 화면 /           dist/wikitip/index.html 이 **아직 없어** 목록에 못 넣었다
 * ⑤ 404                 dist/wikitip/404.html 이 **아직 없어** 통째로 건너뛴다
 * ```
 * 그래서 **접두사가 빠져도 아무도 안 울었다.** 조용히 금융 사이트가 나온다.
 *
 * 진짜 검증은 이것이다 — `/about` 은 **두 사이트에 다 있다.**
 * 접두사가 먹으면 서로 **다른 제목**이 나오고, 안 먹으면 **같은 제목**이 나온다.
 * 상태코드로는 절대 못 잡는다. 둘 다 200 이다.
 */
{
  const 제목뽑기 = (몸) => ((몸.match(/<title>([^<]*)/) ?? [])[1] ?? '').trim();
  const 겹침 = (이름, 접두) =>
    existsSync(path.join(ROOT, `${이름}.html`)) && existsSync(path.join(ROOT, 접두, `${이름}.html`));

  for (const [host, 접두] of [['kculturewire.com', 'wikitip'], ['100yearmap.com', '100y']]) {
    /* 두 사이트에 **같은 이름으로 다 있는** 지면만 고른다. 없으면 시험할 수 없다 */
    const 볼것 = ['about', 'esports'].filter((n) => 겹침(n, 접두));
    if (!볼것.length) { console.log(`   (${host} — 겹치는 지면이 없어 건너뛴다)`); continue; }

    for (const 이름 of 볼것) {
      const 금융 = 제목뽑기(await 본문('seoulmarkets.com', `/${이름}`));
      const 저쪽 = 제목뽑기(await 본문(host, `/${이름}`));
      확인(저쪽.length > 0 && 금융.length > 0 && 저쪽 !== 금융,
        `⭐ /${이름} 가 ${host} 와 seoulmarkets 에서 다른 화면이다`,
        { seoulmarkets: 금융, [host]: 저쪽 });
    }
  }
}

/* ⚠ **어떤 오류도 무시하지 않는다.** `EADDRINUSE` 를 무시하게 적어 둔 한 줄이
 *   이 시험을 헛돌게 만들었다 — 일부러 망가뜨린 코드가 통과했다. */
if (오류.trim()) { 실패++; console.log(`  ✕ 서버가 오류를 냈다:\n${오류.slice(0, 400)}`); }

if (실패) { console.error(`\n${실패} 실패`); 끝내기(1); }
console.log('  전부 통과 · 0 실패');
끝내기(0);
