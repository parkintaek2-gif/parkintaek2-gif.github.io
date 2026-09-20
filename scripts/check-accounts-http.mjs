#!/usr/bin/env node
/**
 * check-accounts-http.mjs — 실제 server.mjs 를 띄워 계정 API 세 자리를 눌러 본다.
 * (accounts.mjs 자체 로직은 scripts/check-accounts.mjs 가 이미 잰다 — 이 자는 «라우팅»을 잰다)
 *
 *   node scripts/check-accounts-http.mjs
 */
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';

const PORT = 34117;
const BASE = `http://127.0.0.1:${PORT}`;
const ARCHIVE_DIR = '.check-accounts-http-tmp';

let 통과 = 0, 실패 = 0;
function 확인(이름, 조건, 상세 = '') {
  if (조건) { console.log(`✅ ${이름}`); 통과++; }
  else { console.log(`🔴 ${이름} ${상세}`); 실패++; }
}

const child = spawn(process.execPath, ['server.mjs'], {
  env: {
    ...process.env,
    PORT: String(PORT),
    ACCOUNT_SESSION_SECRET: 'http-test-secret-not-for-prod',
    ARCHIVE_DIR,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

/* ⚠ [2026-09-21 · 2번] server.mjs 는 기동 로그로 「serving dist/ on http://…」를
 * 찍는다(server.mjs:1098) — 「listen」이라는 글자는 어디에도 안 나온다. 그래서
 * 이 자는 매번 준비 신호를 못 받고 아래 고정 5.3초를 다 채운 뒤에야 요청을 쐈다.
 * 느린 기계에서 5.3초를 넘기면 「fetch failed」로 통째로 빨간불이 났다(실측).
 * 실제로 찍는 문구로 맞춘다. */
let 준비됨 = false;
child.stdout.on('data', (d) => { if (String(d).includes('serving dist/')) 준비됨 = true; });

async function 기다린다(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function 메인() {
  for (let i = 0; i < 50 && !준비됨; i++) await 기다린다(100);
  await 기다린다(300); // 여유

  const 메일 = `http-test-${Date.now()}@example.com`;

  const 가입 = await fetch(`${BASE}/api/account/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 메일, password: 'hunter2-hunter2' }),
  }).then((r) => r.json());
  확인('① 회원가입 200 + 토큰', typeof 가입.token === 'string', JSON.stringify(가입));

  const 재가입 = await fetch(`${BASE}/api/account/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 메일, password: '아무거나12345' }),
  });
  확인('② 중복 가입은 409', 재가입.status === 409);

  const 틀린로그인 = await fetch(`${BASE}/api/account/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 메일, password: '틀린비번1234' }),
  });
  확인('③ 틀린 비밀번호는 401', 틀린로그인.status === 401);

  const 로그인 = await fetch(`${BASE}/api/account/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 메일, password: 'hunter2-hunter2' }),
  }).then((r) => r.json());
  확인('④ 맞는 로그인은 토큰을 준다', typeof 로그인.token === 'string');

  const 토큰없이 = await fetch(`${BASE}/api/account/purchases`);
  확인('⑤ 토큰 없이 구매내역은 401', 토큰없이.status === 401);

  const 목록 = await fetch(`${BASE}/api/account/purchases`, {
    headers: { Authorization: `Bearer ${로그인.token}` },
  }).then((r) => r.json());
  확인('⑥ 토큰으로 구매내역 조회(빈 배열)', 목록.ok === true && Array.isArray(목록.purchases) && 목록.purchases.length === 0, JSON.stringify(목록));

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} ${통과 + 실패}개 중 통과 ${통과}개`);
  child.kill();
  await rm(ARCHIVE_DIR, { recursive: true, force: true });
  process.exit(실패 === 0 ? 0 : 1);
}

메인().catch((e) => { console.error('🔴 재지 못했다 —', e.message); child.kill(); process.exit(1); });
