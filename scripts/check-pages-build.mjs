#!/usr/bin/env node
/**
 * 백업 저장소(GitHub Pages)의 빌드가 초록인가 — **우리가 먼저 안다.**
 *
 *   node scripts/check-pages-build.mjs
 *   node scripts/check-pages-build.mjs --자가시험
 *
 * ## 🔴 왜 만들었나 (2026-09-18 · 5번)
 *
 * 사장님: 「**배포가 잘 안된다고 자꾸 메일이 온다**」
 *
 * 내가 낸 기사 하나에 스키마에 없는 갈래 값을 적어 빌드가 섰고, 실패 메일이 **일곱 번**
 * 사장님께 갔다. 그동안 **우리 쪽에서는 아무 빨간불도 안 켜졌다.**
 *
 * ```
 * 10:15 KST  내가 기사를 푸시           (빌드가 이때부터 깨졌다)
 * 10:24~10:52  실패 7건 → 사장님 편지함
 * 11:0x      사장님이 말씀하셔서 그제야 알았다
 * ```
 *
 * ⛔ **알림이 사장님께만 가고 우리는 못 본다.** 그러면 사장님이 우리 감시 장치가 된다.
 *   저장소에 이미 같은 성질의 교훈이 있다(서치콘솔 알림도 사장님께만 간다 —
 *   그러니 기다리지 말고 우리가 스스로 잰다).
 *
 * ## 이 자가 보는 것
 *
 * · 백업 저장소의 **가장 최근 실행**이 성공인가
 * · 실패면 어느 커밋에서 깨졌는지 말한다 — 그 커밋을 낸 사람이 고칠 자리다
 *
 * ## 이 자가 «안» 보는 것
 *
 * · 주 저장소(seoulmarkets)의 워크플로는 **일부러 꺼져 있다**(2026-08-14, disabled_manually).
 *   seoulmarkets.com 은 Cloudtype 이 서비스하므로 Pages 빌드가 필요 없다.
 *   ⛔ 꺼진 것을 「고장」으로 세지 않는다. 되살리면 쓸데없는 실패 메일이 다시 시작된다.
 * · 열쇠가 없어도 돈다(공개 저장소의 공개 API). 막히면 「못 쟀다」고 말하고 선다.
 */
const 저장소 = 'parkintaek2-gif/parkintaek2-gif.github.io';

/** 실행 목록에서 「지금 상태」를 가른다. 돌고 있는 중이면 아직 판정하지 않는다. */
export function 판정(runs) {
  if (!Array.isArray(runs) || !runs.length) return { 잴수있나: false, 말: '실행 기록이 없다' };
  const 끝난것 = runs.filter((r) => r && r.status === 'completed');
  if (!끝난것.length) return { 잴수있나: false, 말: '아직 돌고 있다 — 다음에 다시 잰다' };
  const 맨앞 = 끝난것[0];
  if (맨앞.conclusion === 'success') return { 잴수있나: true, 초록: true, 맨앞 };
  /* 연달아 깨진 수를 센다 — 한 번 튄 것과 계속 깨진 것은 다르다 */
  let 연속 = 0;
  for (const r of 끝난것) { if (r.conclusion === 'success') break; 연속++; }
  return { 잴수있나: true, 초록: false, 맨앞, 연속 };
}

if (process.argv.includes('--자가시험')) {
  let 셈 = 0;
  const 봄 = (말, 참) => { 셈++; console.log((참 ? '✅ ' : '🔴 ') + 말); if (!참) process.exitCode = 1; };
  const 성 = (t) => ({ status: 'completed', conclusion: 'success', created_at: t });
  const 실 = (t) => ({ status: 'completed', conclusion: 'failure', created_at: t });

  봄('① 맨 앞이 성공이면 초록', 판정([성('c'), 실('b')]).초록 === true);
  봄('② 맨 앞이 실패면 빨강', 판정([실('c'), 성('b')]).초록 === false);
  봄('③ 연달아 깨진 수를 센다', 판정([실('d'), 실('c'), 성('b')]).연속 === 2);
  봄('④ 돌고 있는 중이면 판정하지 않는다',
    판정([{ status: 'in_progress', conclusion: null }]).잴수있나 === false);
  봄('⑤ 돌고 있는 것은 건너뛰고 끝난 것으로 잰다',
    판정([{ status: 'in_progress', conclusion: null }, 성('b')]).초록 === true);
  /* ⛔ 못 재는 것을 「초록」으로 넘기지 않는다 — 그러면 죽은 자물쇠가 된다 */
  봄('⑥ 기록이 없으면 «못 쟀다»고 한다', 판정([]).잴수있나 === false);
  봄('⑦ 아예 안 넘겨도 죽지 않는다', 판정(null).잴수있나 === false);

  console.log(`\n${process.exitCode ? '🔴 깨짐' : '✅ 자가시험 ' + 셈 + '개 다 통과'}`);
  process.exit();
}

let runs = null;
try {
  const r = await fetch(`https://api.github.com/repos/${저장소}/actions/runs?per_page=10`, {
    headers: { 'User-Agent': 'seoulmarkets-check/1.0', Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(20000),
  });
  if (r.ok) runs = (await r.json()).workflow_runs;
  else console.log(`⬜ 못 쟀다 — GitHub API ${r.status}`);
} catch (e) {
  console.log(`⬜ 못 쟀다 — ${String(e && e.message).slice(0, 80)}`);
}

if (!runs) {
  console.log('   ⚠ 못 잰 것을 초록으로 세지 않는다. 다음 차례에 다시 잰다.');
  process.exit(0);   /* 못 재는 것으로 배포를 막지 않는다 */
}

const r = 판정(runs);
console.log(`■ 백업 저장소 빌드 — ${저장소}`);
if (!r.잴수있나) { console.log(`   ⬜ ${r.말}`); process.exit(0); }
if (r.초록) {
  console.log(`   ✅ 초록 — ${r.맨앞.created_at.slice(0, 16).replace('T', ' ')} UTC · ${String(r.맨앞.display_title).slice(0, 50)}`);
  process.exit(0);
}
console.log(`   🔴 깨져 있다 — 연달아 ${r.연속}건`);
console.log(`      마지막: ${r.맨앞.created_at.slice(0, 16).replace('T', ' ')} UTC`);
console.log(`      커밋:   ${String(r.맨앞.display_title).slice(0, 70)}`);
console.log(`      로그:   https://github.com/${저장소}/actions/runs/${r.맨앞.id}`);
console.log('   ⭐ 먼저 `npm run build` 를 여기서 돌린다 — 같은 까닭으로 죽는다. 1분이면 안다.');
console.log('   ⛔ 이 빨간불을 두고 다른 일을 하지 않는다. 그동안 실패 메일이 사장님께 계속 간다.');
process.exitCode = 1;
