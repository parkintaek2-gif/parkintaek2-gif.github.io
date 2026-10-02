#!/usr/bin/env node
/**
 * check-유닛-로그인-살아있나.mjs — **여섯 유닛의 로그인이 살아 있나.**
 *
 * 🔴🔴 [2026-10-02 · 사장님] 「**1번 — Login expired · Please run /login — 해결해라**」
 *
 * 재 보니 1번(.claude-u1)의 자격파일에서 **accessToken 과 refreshToken 이 둘 다 비어** 있었다.
 * ```
 *   accessToken    (비었다)      ← 이것이 없으면 못 쓴다
 *   refreshToken   (비었다)      ← 이것마저 없어 «자동 갱신»도 못 한다
 *   expiresAt      0
 * ```
 * 백업도 없고(백업 폴더에는 설정만 있고 자격은 없다), 윈도 자격 관리자에도 없었다.
 * ⇒ 사람이 그 창에서 `/login` 을 다시 치는 길밖에 없었다.
 *
 * ⛔ 자격을 «사본으로 떠 두는» 길은 택하지 않는다 — 평문 토큰이 하나 더 생기는 것은
 *   고치는 것이 아니라 구멍을 넓히는 것이다(2026-10-01 보안점검과 같은 자리).
 * ✅ 대신 **비었는지 날마다 본다.** 비는 순간 빨간불이 켜지면, 유닛이 반나절을
 *   멈춘 뒤에야 알아채는 일이 없다. 1번은 이번에 그렇게 멈춰 있었다.
 *
 * ⛔⛔ 이 자는 토큰 «값»을 절대 읽지도 찍지도 않는다. 비었나·언제 끝나나만 본다.
 *
 * 쓰는 법
 *   node scripts/check-유닛-로그인-살아있나.mjs
 *   node scripts/check-유닛-로그인-살아있나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const 유닛들 = [
  ['1번', '.claude-u1'], ['2번', '.claude-u2'], ['3번', '.claude-u3'],
  ['4번', '.claude-u4'], ['5번', '.claude-u5'], ['6번', '.claude-u6'],
];

/**
 * 자격 한 벌을 재서 판정한다.
 * ⛔ 들어오는 것은 «이미 읽은 객체»다 — 이 함수는 값을 밖으로 내지 않는다.
 */
export function 판정(자격, 지금 = Date.now()) {
  if (!자격) return { 빛: '⬜', 말: '자격파일이 없다 — 한 번도 로그인한 적이 없거나 지워졌다' };
  const o = 자격.claudeAiOauth ?? 자격;
  const 있나 = (v) => typeof v === 'string' && v.length > 0;

  if (!있나(o.accessToken) && !있나(o.refreshToken)) {
    return { 빛: '🔴', 말: '**토큰이 통째로 비었다** — 그 창에서 /login 을 다시 쳐야 한다', 재로그인: true };
  }
  if (!있나(o.accessToken)) {
    return { 빛: '🟡', 말: '들어가는 토큰이 비었다 — 갱신 토큰은 있으니 다음 호출에 저절로 풀릴 수 있다' };
  }
  const 끝 = Number(o.expiresAt ?? 0);
  if (!끝) return { 빛: '🟡', 말: '만료 시각이 없다 — 꼴이 이상하다' };
  if (끝 <= 지금) {
    if (있나(o.refreshToken)) return { 빛: '🟡', 말: '지났지만 갱신 토큰이 있다 — 저절로 풀릴 수 있다' };
    return { 빛: '🔴', 말: '지났고 갱신 토큰도 없다 — /login 을 다시 쳐야 한다', 재로그인: true };
  }
  const 남은분 = Math.round((끝 - 지금) / 60000);
  if (남은분 < 60) return { 빛: '🟡', 말: `${남은분}분 남았다 — 곧 갱신된다` };
  return { 빛: '✅', 말: `${Math.round(남은분 / 60)}시간 남았다` };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패 += 1; console.log('🔴 ' + 이름); } };
  const 이제 = Date.parse('2026-10-02T09:00:00+09:00');
  const 벌 = (a, r, e) => ({ claudeAiOauth: { accessToken: a, refreshToken: r, expiresAt: e } });

  검('⛔ 자격파일이 없으면 흰불', 판정(null).빛 === '⬜');
  검('🔴 둘 다 비면 빨강이고 «재로그인»이라고 말한다', (() => {
    const r = 판정(벌('', '', 0), 이제);
    return r.빛 === '🔴' && r.재로그인 === true && /login/.test(r.말);
  })());
  검('🟡 들어가는 토큰만 비면 노랑 — 저절로 풀릴 수 있다',
    판정(벌('', 'rrr', 이제 + 1000), 이제).빛 === '🟡');
  검('🔴 지났고 갱신 토큰도 없으면 빨강',
    판정(벌('aaa', '', 이제 - 1000), 이제).빛 === '🔴');
  검('🟡 지났어도 갱신 토큰이 있으면 노랑',
    판정(벌('aaa', 'rrr', 이제 - 1000), 이제).빛 === '🟡');
  검('✅ 넉넉히 남았으면 초록',
    판정(벌('aaa', 'rrr', 이제 + 6 * 3600000), 이제).빛 === '✅');
  검('🟡 한 시간 안 남으면 노랑',
    판정(벌('aaa', 'rrr', 이제 + 20 * 60000), 이제).빛 === '🟡');
  검('claudeAiOauth 로 안 싸여 있어도 읽는다',
    판정({ accessToken: 'a', refreshToken: 'r', expiresAt: 이제 + 6 * 3600000 }, 이제).빛 === '✅');
  검('🟡 만료 시각이 없으면 노랑', 판정(벌('aaa', 'rrr', 0), 이제).빛 === '🟡');

  /* ⛔ 값이 밖으로 새면 안 된다 — 판정 글에 토큰이 들어가지 않는다 */
  검('⛔ 판정 글에 토큰 값이 안 샌다', (() => {
    const 비밀 = 'SECRET-TOKEN-VALUE-12345';
    const r = 판정(벌(비밀, 비밀, 이제 + 1000), 이제);
    return !JSON.stringify(r).includes(비밀);
  })());

  console.log(`\n${실패 === 0 ? '✅' : '🔴'} 자가시험 ${통과 + 실패}개 중 통과 ${통과}개`);
  process.exit(실패 === 0 ? 0 : 1);
}

/* ── 실제로 잰다 ───────────────────────────────────────────── */
const 집 = os.homedir();
console.log('■ 여섯 유닛의 로그인이 살아 있나\n');
console.log('   ⛔ 이 자는 토큰 «값»을 읽지 않는다. 비었나·언제 끝나나만 본다.\n');

let 빨강 = 0; const 고칠것 = [];
for (const [이름, 방] of 유닛들) {
  const 길 = path.join(집, 방, '.credentials.json');
  let 자격 = null;
  if (fs.existsSync(길)) {
    try { 자격 = JSON.parse(fs.readFileSync(길, 'utf8')); } catch { 자격 = null; }
  }
  const r = 판정(자격);
  if (r.빛 === '🔴') { 빨강 += 1; 고칠것.push(이름); }
  console.log(`   ${r.빛} ${이름.padEnd(4)} ${r.말}`);
}

if (빨강) {
  console.log(`\n🔴 로그인이 끊긴 유닛 ${빨강}개 — ${고칠것.join(' · ')}`);
  console.log('\n   고치는 법 (그 유닛 창에서 사람이 한 번 칩니다)');
  console.log('     ① 그 유닛 탭을 누릅니다 (Windows Terminal 에 탭으로 모여 있습니다)');
  console.log('     ② 입력칸에  /login  을 치고 엔터');
  console.log('     ③ 브라우저가 열리면 그 유닛 계정으로 「Authorize」 를 누릅니다');
  console.log('     ④ 터미널에 「Login successful」 이 뜨면 끝입니다');
  console.log('\n   ⛔ 다른 유닛의 자격을 복사해 쓰지 않습니다 — 계정이 다릅니다.');
  process.exitCode = 1;
} else {
  console.log('\n✅ 여섯 유닛 모두 로그인이 살아 있다');
}
