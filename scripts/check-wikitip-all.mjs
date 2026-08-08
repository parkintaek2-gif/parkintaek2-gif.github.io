/**
 * K Culture Wire(5번) 검사를 **한 번에** 돌린다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 8월 7일에 검사를 여섯 개 만들었다. 전부 일부러 깨뜨려 서는 것까지 봤다.
 * 그런데 **어느 사슬에도 안 걸려 있었다.** 내가 손으로 부를 때만 돌았다.
 *
 * 손으로 부르는 검사는 검사가 아니다. 잊으면 없는 것과 같고,
 * 잊는 것이 바로 검사를 만든 이유다.
 *
 * ⛔ package.json 은 2번 것이다. 거기에 `node scripts/check-wikitip-all.mjs` 한 줄을
 *    넣어 달라고 부탁한다. 그때까지는 내 예약이 이걸 부른다.
 * ⛔ 하나가 서면 **거기서 멈춘다.** 뒤엣것을 마저 돌려 「몇 개 실패」로 뭉뚱그리면
 *    무엇부터 고쳐야 하는지가 흐려진다.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const 검사 = [
  ['자료에 만든 이가 있나', 'check-wikitip-data.mjs'],
  ['고친 것이 정정 지면에 있나', 'check-corrections.mjs'],
  ['기사가 지면에 걸려 있나', 'check-article-reach.mjs'],
  ['K팝 명단에 있어야 할 이름이 있나', 'check-kpop-roster.mjs'],
  ['그룹↔멤버 기사가 자료와 맞나', 'check-kpop-members-article.mjs'],
  ['배우겹침 기사가 자료와 맞나', 'check-kpop-actors-article.mjs'],
  ['한 하루 몫 기사가 자료와 맞나', 'check-kpop-spike-article.mjs'],
  ['배우 작품수 기사가 자료와 맞나', 'check-actor-titles-article.mjs'],
  ['한국 작품 명단이 깨끗한가', 'check-korean-title-rosters.mjs'],
  ['세어 둔 한계를 지면이 말하나', 'check-disclosed-limits.mjs'],
  ['출연 겹침 기사가 자료와 맞나', 'check-one-body-article.mjs'],
  ['밤에 낸 세 편이 자료와 맞나', 'check-three-title-articles.mjs'],
  ['정정 기사가 기록과 맞나', 'check-corrections-article.mjs'],
  ['조인 네 편이 자료와 맞나', 'check-join-articles.mjs'],
  ['산업·웹툰 세 편이 자료와 맞나', 'check-industry-articles.mjs'],
  ['이름 겹치는 편을 지면이 대나', 'check-titles-ambiguity-page.mjs'],
  ['뺄셈이 안 맞는 폭의 까닭이 맞나', 'check-screen-split-gap.mjs'],
  ['짧은 제목 기사가 자료와 맞나', 'check-short-titles-article.mjs'],
  ['센 것을 지면이 다 보여 주나', 'check-data-keys-shown.mjs'],
  ['파는 한 벌이 소개 글대로인가', 'check-product-bundle.mjs'],
  ['새 세 편이 자료와 맞나', 'check-three-new-articles.mjs'],
  ['더 낸 세 편이 자료와 맞나', 'check-three-more-articles.mjs'],
  ['한국 차트×관심도 기사가 자료와 맞나', 'check-home-chart-attention-article.mjs'],
  ['제목이 열쇠가 아닌 것을 기사가 맞게 말하나', 'check-key-integrity-article.mjs'],
  ['봉우리가 길이인 것을 기사·지면이 맞게 말하나', 'check-peak-length-article.mjs'],
  ['안 보이는 사람을 기사·지면이 맞게 말하나', 'check-invisible-acts-article.mjs'],
  ['분모를 기사가 맞게 말하나', 'check-output-denominator-article.mjs'],
  ['여덟 가지로 틀린 것을 기사가 맞게 세나', 'check-eight-ways-article.mjs'],
  ['한 지역만 다른 것을 기사가 맞게 말하나', 'check-hot-streak-article.mjs'],
  /* 2번 지시 14:2x — 자가 없던 네 꼴에 자를 만들었다. 원인 딱지와 1:1 로 붙는다 */
  ['질의가 패널과 어긋나나 (attribution-contradiction)', 'check-attribution-agrees.mjs'],
  ['두 겹 표에서 한 겹만 읽었나 (kosis-two-level)', 'check-two-level-totals.mjs'],
  ['분모에 안 뺄 것이 남았나 (pay-denominator)', 'check-pay-denominator.mjs'],
  ['재지 않고 쓴 절대 문장이 있나 (unmeasured-sentence)', 'check-absolute-claims.mjs'],
  ['젊어서인지 아닌지를 기사가 맞게 말하나', 'check-firm-age-article.mjs'],
  ['한국이 먼저였나를 기사가 맞게 말하나', 'check-home-first-article.mjs'],
  ['자리로 잰 한류를 기사·지면이 맞게 말하나', 'check-world-share-article.mjs'],
  ['깊이를 기사가 맞게 말하나(대조군 포함)', 'check-catalogue-depth-article.mjs'],
  ['없던 하락을 기사가 맞게 말하나', 'check-debut-counts-article.mjs'],
  /* 🔴 2026-08-08 18:0x — 라이브에만 나던 병. 내 화면에서는 영원히 맞았다 */
  ['날짜가 어느 시간대에서도 같은가', 'check-price-dates.mjs'],
  ['고쳐 놓고 남은 옛 수가 있나', 'check-stale-numbers.mjs'],
  ['손님으로 걸어 걸리는 것이 있나', 'check-visitor-walk.mjs'],
  ['검색이 우리를 다 볼 수 있나', 'check-search-readiness.mjs'],
  ['안에서 쓰는 말이 밖으로 나가나', 'check-no-internal-leak.mjs'],
];

let 돈것 = 0;
for (const [무엇, 파일] of 검사) {
  if (!fs.existsSync(`scripts/${파일}`)) {
    console.error(`❌ ${파일} 이 없다 — 검사 목록이 실제와 어긋난다`);
    process.exit(1);
  }
  try {
    execFileSync('node', [`scripts/${파일}`], { stdio: 'pipe' });
    console.log(`  ✅ ${무엇.padEnd(28)} (${파일})`);
    돈것++;
  } catch (e) {
    console.error(`\n❌ ${무엇} — ${파일}\n`);
    process.stderr.write(String(e.stdout ?? ''));
    process.stderr.write(String(e.stderr ?? ''));
    process.exit(1);
  }
}
console.log(`\n✅ K Culture Wire 검사 ${돈것}개 전부 통과`);
