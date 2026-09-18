#!/usr/bin/env node
/**
 * check-accounts.mjs — src/lib/accounts.mjs 자가시험.
 * R2 열쇠가 없어도 돈다(로컬 디스크 경로로 같은 로직을 검증한다) — remoteEnabled
 * 는 store.mjs 가 스스로 판단하므로 여기서 흉내내지 않는다.
 *
 *   node scripts/check-accounts.mjs --자가시험
 */
process.env.ACCOUNT_SESSION_SECRET ||= 'local-test-secret-not-for-prod';
process.env.ARCHIVE_DIR = '.check-accounts-tmp';

import { rm } from 'node:fs/promises';
import * as Accounts from '../src/lib/accounts.mjs';

let 통과 = 0, 실패 = 0;
function 확인(이름, 조건) {
  if (조건) { console.log(`✅ ${이름}`); 통과++; }
  else { console.log(`🔴 ${이름}`); 실패++; }
}

async function 자가시험() {
  const 메일 = `test-${Date.now()}@example.com`;

  const 만듦 = await Accounts.계정만들기(메일, 'hunter2-hunter2');
  확인('① 계정을 만든다', 만듦.email === 메일.toLowerCase());

  let 중복오류 = null;
  try { await Accounts.계정만들기(메일, '아무거나'); } catch (e) { 중복오류 = e; }
  확인('② 같은 메일로 다시 만들면 막힌다', 중복오류?.code === 'exists');

  const 틀린비번 = await Accounts.로그인(메일, '틀린비번');
  확인('③ 틀린 비밀번호는 로그인 실패', 틀린비번 === null);

  const 맞은로그인 = await Accounts.로그인(메일, 'hunter2-hunter2');
  확인('④ 맞는 비밀번호는 로그인 성공', 맞은로그인?.email === 메일.toLowerCase());

  const 없는계정 = await Accounts.로그인('없는사람@example.com', '아무거나');
  확인('⑤ 없는 계정은 null', 없는계정 === null);

  await Accounts.구매기록추가(메일, { orderID: 'ORDER-1', product: 'all' });
  await Accounts.구매기록추가(메일, { orderID: 'ORDER-1', product: 'all' }); // 중복 시도
  const 목록 = await Accounts.내가산것(메일);
  확인('⑥ 구매 기록이 붙는다', 목록.length === 1 && 목록[0].orderID === 'ORDER-1');

  await Accounts.구매기록추가('없는사람@example.com', { orderID: 'ORDER-2', product: 'single' });
  확인('⑦ 계정 없는 이메일의 구매기록추가는 조용히 넘어간다(안 던짐)', true);

  const 토큰 = Accounts.세션발급(메일);
  확인('⑧ 세션 토큰이 발급된다', typeof 토큰 === 'string' && 토큰.length > 10);
  확인('⑨ 발급한 토큰을 검증하면 그 이메일이 나온다', Accounts.세션확인(토큰) === 메일);
  확인('⑩ 위조 토큰은 거부된다', Accounts.세션확인(토큰 + 'x') === null);
  확인('⑪ 빈 토큰은 거부된다(안 던짐)', Accounts.세션확인('') === null);

  const 옛토큰_payload = `${메일}.1`; // 1970년 만료
  const sig = (await import('node:crypto')).createHmac('sha256', process.env.ACCOUNT_SESSION_SECRET).update(옛토큰_payload).digest('hex');
  const 만료토큰 = Buffer.from(`${옛토큰_payload}.${sig}`).toString('base64url');
  확인('⑫ 만료된 토큰은 거부된다', Accounts.세션확인(만료토큰) === null);

  await rm(process.env.ARCHIVE_DIR, { recursive: true, force: true });

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} 자가시험 ${통과 + 실패}개 중 통과 ${통과}개`);
  if (실패 > 0) process.exit(1);
}

자가시험();
