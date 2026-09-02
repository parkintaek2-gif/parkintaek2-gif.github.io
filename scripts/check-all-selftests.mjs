#!/usr/bin/env node
/**
 * check-all-selftests.mjs — **자가시험이 있는 검사들을 한 자리에서 다 돌린다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만들었나 — 2026-09-02]
 *   `check-tests-wired.mjs` 가 「안 불리는 검사가 30 → **66**」으로 울려서
 *   **전 유닛의 npm test 가 통째로 막혀 있었다.** 배포 관문이 npm test 를 타므로
 *   그 사이 아무도 배포를 못 한다.
 *
 *   ⛔ 봐주는 수를 올려서 끄는 것은 «톱니를 무력화»하는 것이다. 그러면 다음에 또 늘어난다.
 *   ⭐ 그래서 66개를 갈라 세어 보고, **자가시험이 있고 인터넷·크롬·DB 를 안 타는 43개**를
 *      이 자로 묶어 npm test 에 «한 줄로» 물린다.
 *      (package.json 의 test 줄에 43개를 붙이면 2,446자가 늘어 사람이 읽을 수 없게 된다)
 *
 *   ⚠ 물리기 전에 **43개를 하나씩 돌려서 전부 통과하는 것을 확인했다.** 남의 검사를
 *      물렸다가 그것이 실패하면 전 유닛 배포가 또 막힌다 — 그건 고치는 게 아니라 옮기는 것이다.
 *
 * [이 자를 어떻게 쓰나]
 *   새 검사를 만들었고 자가시험이 있으면 **아래 `돌릴것` 에 한 줄 더한다.** 그것이 곧
 *   「자기가 만든 검사는 자기가 물린다」다. package.json 은 안 건드린다.
 *
 *   node scripts/check-all-selftests.mjs            전부 돌린다
 *   node scripts/check-all-selftests.mjs --자가시험   이 자 자신을 시험한다
 *
 * ⛔ 인터넷·크롬·DB 를 타는 검사를 여기에 넣지 않는다 — npm test 가 «남의 사정»으로 죽는다.
 *    그런 것은 `check-tests-wired.mjs` 의 `봐준다` 에 **까닭을 적어** 넣는다.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * [검사 파일, 자가시험 깃발]
 * ⭐ 이 배열이 «부름»이다 — `check-tests-wired.mjs` 는 주석을 안 세고 코드만 따라간다.
 *    그래서 목록을 주석이 아니라 **진짜 배열**로 둔다.
 */
export const 돌릴것 = [
  ['check-100y-name-placement.mjs', '--자가시험'],
  ['check-1500-reports.mjs', '--자가시험'],
  ['check-6beon-directives.mjs', '--selftest'],
  ['check-6번-15시보고-자물쇠.mjs', '--자가시험'],
  ['check-6번-콘텐트-due.mjs', '--자가시험'],
  ['check-daily-shipping.mjs', '--자가시험'],
  ['check-demand-covered.mjs', '--자가시험'],
  ['check-dist-ready.mjs', '--자가시험'],
  ['check-ganglyeong-read.mjs', '--selftest'],
  ['check-import-safety.mjs', '--자가시험'],
  ['check-kcw-article-backlinks.mjs', '--자가시험'],
  ['check-kcw-comment-leak.mjs', '--자가시험'],
  ['check-kcw-crosschecks.mjs', '--자가시험'],
  ['check-kcw-llms-freshness.mjs', '--자가시험'],
  ['check-kcw-memo-clock.mjs', '--자가시험'],
  ['check-kcw-my-files-only.mjs', '--자가시험'],
  ['check-kcw-names-in-title.mjs', '--자가시험'],
  ['check-kcw-narration-fits.mjs', '--자가시험'],
  ['check-kcw-row-pages.mjs', '--자가시험'],
  ['check-kcw-silent-video.mjs', '--자가시험'],
  ['check-kcw-title-cutoff.mjs', '--자가시험'],
  ['check-kcw-video-lists.mjs', '--자가시험'],
  ['check-kcw-wakers.mjs', '--자가시험'],
  ['check-korean-title-suspects.mjs', '--자가시험'],
  ['check-made-but-invisible.mjs', '--자가시험'],
  ['check-mail-dns.mjs', '--selftest'],
  ['check-meta-length.mjs', '--자가시험'],
  ['check-name-placement.mjs', '--자가시험'],
  ['check-no-riot.mjs', '--자가시험'],
  ['check-orphan-comment-close.mjs', '--자가시험'],
  ['check-owner-request.mjs', '--selftest'],
  ['check-person-title.mjs', '--자가시험'],
  ['check-school-desc.mjs', '--자가시험'],
  ['check-seat-split.mjs', '--자가시험'],
  ['check-selftest-counts.mjs', '--자가시험'],
  ['check-seoulmarkets-silent-video.mjs', '--자가시험'],
  ['check-session-entry-crlf.mjs', '--자가시험'],
  ['check-template-leak.mjs', '--자가시험'],
  ['check-title-change-cooldown.mjs', '--자가시험'],
  ['check-title-spelling-match.mjs', '--자가시험'],
  ['check-tls.mjs', '--selftest'],
  ['check-traffic-flush-alive.mjs', '--자가시험'],
  ['check-two-chart-merge.mjs', '--자가시험'],
  ['check-unregistered-title-changes.mjs', '--자가시험'],
  ['check-utc-today.mjs', '--자가시험'],
  ['check-wikitip-indexed-records.mjs', '--자가시험'],
  ['build-wikitip-title-demand.mjs', '--자가시험'],
];

export function 자가시험() {
  let 흠 = 0;
  let 잰수 = 0;
  const 본다 = (이름, 참) => {
    잰수 += 1;
    if (참) console.log(`  ✅ ${이름}`);
    else { console.log(`  🔴 ${이름}`); 흠 += 1; }
  };
  본다('돌릴 것이 비어 있지 않다', 돌릴것.length > 0);
  본다('모두 [파일, 깃발] 두 칸이다', 돌릴것.every((x) => Array.isArray(x) && x.length === 2));
  /* ⭐ `build-` 도 받는다 — 만드는 자의 자가시험도 검사만큼 값이 있다.
     2026-09-02 에 `build-wikitip-title-demand.mjs` 를 넣으려다 여기서 막혔다.
     그 자는 첫 화면이 죽은 링크 13개를 걸던 것을 막는 자라, 안 돌리면 그것이 다시 자란다.
     ⛔ 그 밖의 이름(collect-·make-·measure-)은 받지 않는다 — 그것들은 인터넷·크롬을 탄다. */
  본다('모두 check- 나 build- 로 시작하는 .mjs 다',
    돌릴것.every(([f]) => /^(check|build)-.*\.mjs$/.test(f)));
  본다('깃발이 --자가시험 이나 --selftest 다',
    돌릴것.every(([, g]) => g === '--자가시험' || g === '--selftest'));
  본다('같은 파일을 두 번 넣지 않았다', new Set(돌릴것.map(([f]) => f)).size === 돌릴것.length);
  /* ⛔ 이 자가 자기를 부르면 끝없이 돈다 */
  본다('자기를 안 부른다', !돌릴것.some(([f]) => f === 'check-all-selftests.mjs'));
  console.log(흠 ? `\n🔴 자가시험 ${흠}개 흠` : `\n✅ 자가시험 ${잰수}가지 다 지났다 — 돌릴 것 ${돌릴것.length}개`);
  return 흠;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);

  const 뿌리 = path.dirname(fileURLToPath(import.meta.url));
  let 흠 = 0;
  const 흠난것 = [];
  for (const [f, 깃발] of 돌릴것) {
    const r = spawnSync(process.execPath, [path.join(뿌리, f), 깃발], { encoding: 'utf8' });
    if (r.status !== 0) { 흠 += 1; 흠난것.push(f); }
  }
  console.log(`자가시험 묶음 — ${돌릴것.length}개 중 ${돌릴것.length - 흠}개 통과`);
  if (흠) {
    console.error(`\n⛔ ${흠}개가 흠났다:`);
    for (const f of 흠난것) console.error(`   · ${f}  →  node scripts/${f} 로 다시 보십시오`);
    process.exit(1);
  }
  console.log('✅ 다 지났다');
}
