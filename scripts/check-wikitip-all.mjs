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
  ['들어온 뒤에 오르나를 기사·지면이 맞게 말하나', 'check-climb-article.mjs'],
  ['집 차트가 밖을 말해 주나 — 기사가 자료와 맞나', 'check-home-abroad-article.mjs'],
  ['도착하나 번지나 — 기사가 자료와 맞나', 'check-arrival-article.mjs'],
  ['옮겨 갔나 — 기사가 자료와 맞나', 'check-where-it-moved-article.mjs'],
  ['멀리 간 작품과 배우 조회 — 기사가 자료와 맞나', 'check-actor-reach-article.mjs'],
  ['몇 곳이 절반인가 — 기사가 자료와 맞나', 'check-who-makes-it-article.mjs'],
  ['차트 어디에 앉아 있나 — 기사가 자료와 맞나', 'check-rank-shape-article.mjs'],
  ['카탈로그가 크면 더 멀리 가나 — 기사가 자료와 맞나', 'check-catalogue-reach-article.mjs'],
  ['방송을 거친 시리즈와 안 거친 시리즈 — 기사가 자료와 맞나', 'check-two-pipelines-article.mjs'],
  ['돌아온 줄 알았더니 시즌 2 — 기사가 자료와 맞나', 'check-returns-article.mjs'],
  ['두 번째는 쉽다 — 기사가 자료와 맞나', 'check-foothold-article.mjs'],
  ['반 칸 — 기사가 자료와 맞나', 'check-siblings-article.mjs'],
  ['하나의 줄 — 기사가 자료와 맞나', 'check-lead-lag-article.mjs'],
  ['자리가 못 말하는 것 — 기사가 자료와 맞나', 'check-rank-tells-article.mjs'],
  ['한 주에 하나가 아니다 — 기사가 자료와 맞나', 'check-clumping-article.mjs'],
  /* 🔴 이 자는 방향까지 잰다 — 「몰림이 줄었다」가 뒤집히면 기사가 거짓말이 된다 */
  ['몰림은 안 늘었다 — 기사가 자료와 맞나', 'check-leverage-article.mjs'],
  /* 🔴 이 자는 **읽기 자체**도 잰다 — 줄을 잃고 있으면 표 전체가 못 쓴다 */
  ['나가는 자리 — 기사가 자료와 맞나', 'check-exit-article.mjs'],
  /* 🔴 방향까지 잰다 — 「큰 것 하나를 빼면 몰림이 작아진다」가 뒤집히면 기사가 무너진다 */
  ['작품은 줄고 자리는 안 줄었다 — 기사가 자료와 맞나', 'check-fewer-titles-article.mjs'],
  /* 🔴 버팀목까지 잰다 — 「가장 큰 작품을 빼도 남는다」가 무너지면 이 기사는 못 쓴다 */
  ['한국 시리즈만 오래 간다 — 기사가 자료와 맞나', 'check-run-length-article.mjs'],
  /* 🔴 이 표는 **예보로 읽히기 쉽다.** 자가 「예보가 아니다」가 기사에 있는지까지 본다 */
  ['들어온 자리가 말해 주는 것 — 기사가 자료와 맞나', 'check-opening-article.mjs'],
  /* 🔴 이 기사의 요점은 **교란을 인정한 것**이다 — 「대부분은 길이 탓」이 뒤집히면 다시 써야 한다 */
  ['언제 가장 넓게 퍼지나 — 기사가 자료와 맞나', 'check-time-to-peak-article.mjs'],
  /* 🔴 이 자는 **줄세우지 않았나**까지 본다 — 표가 스무 줄을 넘으면 순위표가 된다 */
  ['어느 시장이 넓은 작품만 받나 — 기사가 자료와 맞나', 'check-hard-markets-article.mjs'],
  /* 🔴 2026-08-10 — 우리 명단에 남의 나라 작품 열세 편이 앉아 있었다. 글자로는 못 가른다 */
  ['어느 작품의 줄인가 — 기사가 자료와 맞나', 'check-provenance-article.mjs'],
  /* 🔴 사장님 경고(막은 적이 있어야 까닭이다) 뒤에 만들었다 — 계정 없이 손님이 올 통로 */
  ['남이 우리를 인용할 수 있나', 'check-citable.mjs'],
  /* 🔴 사장님(20:10) 「자물쇠를 최대로 찾아 채워라. 모든 세션에」 — 「있나」가 아니라 「달려 있나」 */
  ['자물쇠가 문에 달려 있나', 'check-locks-fitted.mjs'],
  ['우리 수의 얼마가 확인된 것인가 — 기사가 자료와 맞나', 'check-confirmation-article.mjs'],
  /* 🔴 2026-08-09 07:2x — 이 자는 **있었는데 전체검사에 안 걸려 있었다.**
     dek 이 넘쳐 공유 빌드를 세 번째로 막고서야 알았다. 자가 없던 게 아니라 안 돌렸다 */
  ['앞말 길이가 스키마 한도 안인가(빌드가 여기서 멈춘다)', 'check-frontmatter.mjs'],
  /* 🔴 2026-08-09 07:2x — 카드를 눈으로 열어 보고서야 잘린 것을 알았다. 눈 대신 자를 둔다 */
  ['공유 카드 딱지가 문장 한가운데서 안 끊기나', 'check-og-cards.mjs'],
  /* 🔴 2026-08-09 08:4x — 아랍·히브리·키릴·일본 제목 23편이 한국 작품으로 세어지고 있었다 */
  ['라틴이 아닌 제목이 한국 작품으로 새나', 'check-korean-title-script.mjs'],
  /* 🔴 2026-08-10 05:3x — 문자로 거른 뒤에도 **라틴 문자 남의 작품**이 남아 있었다.
     `Undercover` 48자리는 한국에 0자리, 네덜란드 16 — 벨기에 시리즈다.
     글자로는 못 가른다. **뜬 시장**으로 가른다.
     ⚠ 원자료(archive)가 없는 창에서는 「못 쟀다」로 넘어간다 — 「깨끗하다」로 넘어가지 않는다 */
  ['남의 작품이 한국 명단에 앉아 있나(뜬 시장으로)', 'check-foreign-in-korean-list.mjs'],
  /* 🔴 2026-08-09 13:1x — 8번이 「삼키는 catch 는 거짓 진단을 만든다」고 적어 내 것을 세 보니
     수집기 스무 곳이 원자료 한 줄을 **조용히** 건너뛰고 있었다. 그 침묵이 비어 있는지 잰다 */
  ['원자료에서 조용히 건너뛰는 줄이 있나', 'check-raw-parse-health.mjs'],
  /* ⚠ 아래 둘은 **밖으로 나간다**(라이브·검색엔진). 못 닿으면 흠이 아니라 「못 쟀다」로 넘어간다.
     ⛔ 그래도 물려 둔다 — 2번 말대로 「안 불리는 검사는 그냥 문장」이다 */
  ['작품 지면이 가져갈 수 있는 상태인가(라이브)', 'check-title-pages-live.mjs'],
  ['낸 지면이 검색에 잡혔나(대조군 먼저)', 'check-indexed-urls.mjs'],
  /* 🔴 2026-08-10 01:0x — GSC 가 「718 발견 · 49 색인 · 크롤됨-색인안됨 13」이라 했다.
     683장은 거절이 아니라 **크롤이 아직 안 온 것**이다. 그러면 우리가 막고 있나를 잰다 */
  ['크롤을 우리 쪽에서 막고 있나(라이브)', 'check-crawlable.mjs'],
  ['철이 없다는 것을 기사·지면이 맞게 말하나', 'check-season-article.mjs'],
  ['배우·K팝이 같은 꼴인 것을 기사가 맞게 말하나', 'check-peak-day-article.mjs'],
  /* 🔴 2026-08-08 18:0x — 라이브에만 나던 병. 내 화면에서는 영원히 맞았다 */
  ['날짜가 어느 시간대에서도 같은가', 'check-price-dates.mjs'],
  ['고쳐 놓고 남은 옛 수가 있나', 'check-stale-numbers.mjs'],
  ['손님으로 걸어 걸리는 것이 있나', 'check-visitor-walk.mjs'],
  ['검색이 우리를 다 볼 수 있나', 'check-search-readiness.mjs'],
  /* 2번 지시 23:2x — 구글은 링크를 타고 온다. 두 번 안에 못 닿으면 색인을 걸어도 잘 안 잡힌다 */
  ['첫 화면에서 두 번 안에 닿나', 'check-two-clicks.mjs'],
  ['안에서 쓰는 말이 밖으로 나가나', 'check-no-internal-leak.mjs'],
  /* 🔴 2026-08-10 03:0x — 손님으로 걸어 보니 꼬리가 한국어였고 날짜에 「오전」이 있었다.
     5번 손님은 영어권이다. 눈으로 한 번 찾은 것은 또 생기므로 자로 만들었다 */
  ['영어 손님 화면에 한국어가 있나', 'check-english-only.mjs'],
  /* 2번 지시 19:4x — 카드의 「every figure has a table behind it」이 참말인가.
     ⛔ 초록이 된 뒤에 물렸다. 빨간 자를 공용 사슬에 물리면 여섯 자리가 다 선다 */
  ['표가 뒤에 있다는 약속이 참말인가', 'check-table-promises.mjs'],
  /* 🔴 2026-08-22 — 「관련기사 3개가 다 있다」로 닫았는데, **누가 가리켜지나**를 세니
     108편 중 25편은 아무도 안 가리켰고 한 편에 19번이 쏠렸다. 셋을 채운 것과
     108편이 다 문이 되는 것은 다른 말이다. 이 자는 그 «고르기»를 잰다 */
  ['기사에서 기사로 가는 문이 고르게 나 있나', 'check-kcw-article-doors.mjs'],
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
