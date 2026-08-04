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
 * 브라우저는 알아서 인코딩해서 안 보였고, **색인·크롤러 쪽에서만 났다.**
 * 눈으로는 못 잡는 종류라 시험으로 박아 둔다.
 */
import { 경로펴기 } from '../src/lib/url-path.mjs';

/** 클라이언트가 한글을 인코딩 없이 보낸 상태를 그대로 만든다 */
const 원시 = (s) => Buffer.from(s, 'utf8').toString('latin1');

const 표 = [
  ['원시 UTF-8 한글', 원시('/major/조리과'), '/major/조리과'],
  ['원시 UTF-8 한글 (긴 것)', 원시('/100y/school/서울고등학교'), '/100y/school/서울고등학교'],
  ['퍼센트 인코딩', '/major/%EC%A1%B0%EB%A6%AC%EA%B3%BC', '/major/조리과'],
  ['순수 ASCII', '/equities', '/equities'],
  ['ASCII + 확장자', '/rankings.html', '/rankings.html'],
  /* ⚠ 진짜 latin1 문자는 **건드리면 안 된다.** UTF-8 로 재해석하면 깨진다 */
  ['진짜 latin1 문자', '/café', '/café'],
  /* ⚠ 깨진 인코딩은 **던지지 말고 null.** 던지면 프로세스가 죽고 세 사이트가 같이 멈춘다 */
  ['깨진 인코딩 %zz', '/%zz', null],
  ['깨진 인코딩 %', '/%', null],
  ['빈 경로', '/', '/'],
];

let 실패 = 0;
console.log('요청 경로 해석');
for (const [이름, 입력, 기대] of 표) {
  const 결과 = 경로펴기(입력);
  const ok = 결과 === 기대;
  if (!ok) {
    실패++;
    console.log(`  ✕ ${이름}`);
    console.log(`      받음 ${JSON.stringify(결과)}`);
    console.log(`      기대 ${JSON.stringify(기대)}`);
  }
}

if (실패) {
  console.error(`\n${표.length - 실패} 통과 · ${실패} 실패`);
  process.exit(1);
}
console.log(`  ${표.length} 통과 · 0 실패`);
