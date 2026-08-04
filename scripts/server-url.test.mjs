#!/usr/bin/env node
/**
 * 요청 경로 해석 시험.
 *
 *   node scripts/server-url.test.mjs     (npm test 가 부른다)
 *
 * ⚠ **실제 모듈을 부른다.** 로직을 여기 복사해 두면 언젠가 한쪽만 고쳐져
 *   「시험은 통과하는데 서버는 404」가 된다. 그게 제일 나쁜 상태다.
 *
 * ── 왜 이 시험이 있나 ─────────────────────────────────────────────
 * 2026-08-04, 백년지도 한글 주소 3,450장이 `curl` 로는 404 였다.
 * 브라우저는 알아서 인코딩해서 안 보였고, **색인·크롤러 쪽에서만** 났다.
 *
 * ⚠ **첫 수정이 안 통했다.** 그래서 시험을 서버가 실제로 넘기는 값 기준으로 다시 짰다.
 *   서버는 `new URL(req.url, ...).pathname` 을 넘기는데 **그게 퍼센트 인코딩을 넣는다.**
 *   원시 문자열로 시험하면 통과하는데 서버에서는 안 되는 상태가 된다 — 실제로 그랬다.
 *   그래서 아래 `서버가받는값()` 으로 **같은 변환을 거쳐** 넣는다.
 */
import { 경로후보 } from '../src/lib/url-path.mjs';

/** 클라이언트가 한글을 인코딩 없이 보낸 상태 */
const 원시 = (s) => Buffer.from(s, 'utf8').toString('latin1');
/** ⚠ 서버가 실제로 resolveFile 에 넘기는 값과 **같은 변환**을 거친다 */
const 서버가받는값 = (reqUrl) => new URL(reqUrl, 'http://localhost').pathname;

/** 후보 중에 기대한 것이 있는가 */
const 포함 = (reqUrl, 기대) => 경로후보(서버가받는값(reqUrl)).includes(기대);

const 표 = [
  /* ⭐ 이 셋이 이번에 고친 것 — 원시 UTF-8 바이트로 오는 한글 주소 */
  ['원시 UTF-8 한글', 원시('/major/조리과'), '/major/조리과'],
  ['원시 UTF-8 한글 (긴 것)', 원시('/100y/school/서울고등학교'), '/100y/school/서울고등학교'],
  ['원시 UTF-8 한글 (기호 포함)', 원시('/major/전기·전자과'), '/major/전기·전자과'],
  /* 이미 되던 것들 — 깨뜨리지 않았는지 본다 */
  ['퍼센트 인코딩', '/major/%EC%A1%B0%EB%A6%AC%EA%B3%BC', '/major/조리과'],
  ['순수 ASCII', '/equities', '/equities'],
  ['ASCII + 확장자', '/rankings.html', '/rankings.html'],
  /* ⚠ 진짜 latin1 문자는 **원래 해석이 후보에 있어야** 한다 */
  ['진짜 latin1 문자', '/caf%C3%A9', '/café'],
];

let 실패 = 0;
console.log('요청 경로 해석');
for (const [이름, 입력, 기대] of 표) {
  if (!포함(입력, 기대)) {
    실패++;
    console.log(`  ✕ ${이름}`);
    console.log(`      후보 ${JSON.stringify(경로후보(서버가받는값(입력)))}`);
    console.log(`      기대 ${JSON.stringify(기대)} 가 들어 있어야 한다`);
  }
}

/* ⚠ 깨진 인코딩은 **던지지 말고 빈 목록.** 던지면 프로세스가 죽고 세 사이트가 같이 멈춘다.
 *   `new URL()` 을 못 통과하는 값이므로 여기서는 직접 넣는다. */
for (const 나쁜 of ['/%zz', '/%', '/%E0%A4%A']) {
  let r;
  try { r = 경로후보(나쁜); } catch (e) { 실패++; console.log(`  ✕ 깨진 인코딩 ${나쁜} 에서 던졌다: ${e.message}`); continue; }
  if (r.length !== 0) { 실패++; console.log(`  ✕ 깨진 인코딩 ${나쁜} 은 빈 목록이어야 하는데 ${JSON.stringify(r)}`); }
}

/* ⚠ 되살린 후보는 **원래 해석보다 뒤**여야 한다. 멀쩡히 열리던 경로가 우선이다. */
{
  const c = 경로후보(서버가받는값(원시('/major/조리과')));
  if (c.length < 2) { 실패++; console.log('  ✕ 되살린 후보가 없다'); }
  else if (c[1] !== '/major/조리과') { 실패++; console.log(`  ✕ 되살린 것이 두 번째가 아니다: ${JSON.stringify(c)}`); }
}

const 총 = 표.length + 3 + 1;
if (실패) { console.error(`\n${총 - 실패} 통과 · ${실패} 실패`); process.exit(1); }
console.log(`  ${총} 통과 · 0 실패`);
