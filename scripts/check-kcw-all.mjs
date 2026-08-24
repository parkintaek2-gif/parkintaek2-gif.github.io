/**
 * **내 검사를 한 번에 다 돌린다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 8/15 에 자를 만들고 **두 자료에만 붙인 채** 잊었다. 오늘 같은 실수를 두 번 했다 —
 * 훑기를 만들고 안 돌렸고, 하나 빼기를 만들고 안 붙였다.
 * ⛔ **자를 만들고 안 돌리면 만들지 않은 것과 같다.**
 *
 * ⭐ 그래서 검사를 한 줄로 모은다. 배포 전에 이것 하나만 돌리면 된다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **막는 검사와 보는 검사를 가른다.** 앞은 실패하면 멈추고, 뒤는 세어서 보여만 준다.
 *    ⚠ 보는 검사를 막는 검사로 만들면 옛 자료 때문에 늘 빨강이 되고, 그러면 아무도 안 본다.
 * ⛔ **빌드가 필요한 검사를 먼저 알린다.** 지면을 안 짓고 돌리면 「0장」에 ✅ 가 나온다 —
 *    8/14 에 실제로 그랬다.
 * ⛔ 남의 검사(100y · seoulmarkets)는 안 돌린다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-all.mjs
 *   node scripts/check-kcw-all.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ⭐ 막는 검사 — 하나라도 실패하면 배포하지 않는다.
 * ⚠ `빌드필요` 인 것은 `dist/` 가 있어야 뜻이 있다.
 */
export const 막는검사 = [
  { 자: 'check-kcw-frontmatter.mjs', 뭘: '기사 앞말이 스키마 한도를 넘나 (넘으면 빌드가 죽는다)' },
  { 자: 'check-kcw-korean-leak.mjs', 뭘: '영문 지면에 뜻 없는 한국어가 있나', 빌드필요: true },
  { 자: 'check-kcw-garbage.mjs', 뭘: '깨진 글자가 나가나', 빌드필요: true },
  { 자: 'check-kcw-plural.mjs', 뭘: '단수·복수가 어긋나나', 빌드필요: true },
  { 자: 'check-kcw-cliches.mjs', 뭘: '상투어가 들었나' },
  { 자: 'check-corrections.mjs', 뭘: '지면에 적힌 정정이 목록에 다 있나', 빌드필요: true },
  /**
   * 🔴 2026-08-24 — 애드센스 로더를 심었더니 esports 지면에 그대로 들어갔다.
   *   그 지면에 광고가 뜨면 Riot Production 승인(App 866800)이 **영구 취소**된다.
   *   배포 전에 눈으로 잡았는데, 눈은 다음에 못 잡는다. **막는 검사**로 올린다 —
   *   되돌릴 수 없는 손해가 걸린 것은 보는 검사에 두지 않는다.
   */
  { 자: 'check-no-ads-where-forbidden.mjs', 뭘: '🔴 광고가 있으면 안 되는 지면에 광고가 없나 (Riot 승인이 걸려 있다)', 빌드필요: true },
];

/**
 * ⭐ 보는 검사 — 세어서 보여만 준다. 실패로 세우지 않는다.
 * ⚠ 옛 자에는 이미 굳은 것이 있다. **새로 생기는 것**을 보라고 센다.
 */
export const 보는검사 = [
  /* 🔴 8/15 22:35 — 사장님이 「왜 메모를 안 보나」 하셨다. memo-inbox 는 「나에게 온 것」만
     본다. 2번의 전체 공지는 그 그물에 안 걸려 하루 리듬을 통째로 놓쳤다. 이 자가 그것을 잡는다 */
  { 자: 'check-kcw-new-orders.mjs', 뭘: '🔴 내가 마지막으로 움직인 뒤 올라온 새 공지·지시' },
  { 자: 'check-kcw-script-habits.mjs', 뭘: '내 자들이 같은 버릇으로 틀리나' },
  { 자: 'check-kcw-median-stability.mjs', 뭘: '작은 표본의 중앙값이 답으로 실렸나' },
  { 자: 'check-kcw-article-numbers.mjs', 뭘: '기사에 박힌 수가 자료보다 얼마나 낡았나' },
  { 자: 'check-kcw-evidence-basis.mjs',
    뭘: '⭐ 사장님 지시(8/15) — 결론이 데이터·검증된 방법·학술 근거 중 무엇으로 서 있나' },
  { 자: 'check-kcw-indexnow.mjs', 뭘: '아직 안 알린 지면이 있나', 빌드필요: true },
  /* 🔴 8/23 — 「없어진 주소 0」이라고 보고했는데 실제로 둘이 죽어 있었다.
     그때 센 자는 **작품 지면만** 봤다. 이 자는 우리가 알린 주소 전부를 본다 */
  { 자: 'check-kcw-retired-pages.mjs', 뭘: '한 번 알린 주소가 사라져 404 가 됐나', 빌드필요: true },
  /* 🔴 8/24 — 손으로 적은 감시 목록 여덟 장에 **노출 상위 지면이 하나도 없었다.**
     이 자는 실측(노출)에서 목록을 뽑으므로 수요가 옮겨가면 지키는 자리도 따라간다.
     ⚠ 그물(network)을 쓰므로 막는 검사에 안 넣는다 — 한 번 안 닿았다고 배포를 세우면
       그것이 더 나쁘다. 배포 전에 이 줄을 읽는다 */
  { 자: 'check-kcw-earning-pages.mjs', 뭘: '🔴 노출을 벌어 오는 지면이 살아 있나(실물)' },
  /* 🔴 8/24 — Riot 열쇠가 **8/06 에 죽어 18일째** 였는데 아무 자도 그것을 안 말했다.
      는 있었지만 **어디서도 안 불렸다** — 나는 오늘 우연히 찾았다.
     ⛔ 사다리는 소급이 안 된다. 열쇠가 죽은 날은 그 하루가 영구히 빈다.
     ⭐ 그러니 매 회차에 드러나게 한다. 우연에 맡기지 않는다.
     ⚠ 그물을 쓰므로 막는 검사에 안 넣는다 */
  { 자: 'check-riot-key.mjs', 뭘: '🔴 Riot 열쇠가 살아 있나(죽으면 그날 사다리가 영구히 빈다)' },
  /* 🔴 사장님 지시(8/16·8/20) — 스타 이름을 제목에. 말로 된 다짐은 다음 편에서 잊힌다.
     ⛔ 막지 않는다 — 장소·차트·정정 편에 이름을 억지로 넣으면 거짓이다. 세어서 보이기만 한다 */
  { 자: 'check-kcw-star-names.mjs', 뭘: '제목에 스타 이름이 있나', 빌드필요: true },
];

export function 빌드했나(뿌리길 = 뿌리) {
  return fs.existsSync(path.join(뿌리길, 'dist', 'wikitip', 'sitemap.xml'));
}

/** ⛔ 지면을 안 짓고 돌리면 「0장」에 ✅ 가 나온다 — 그 말을 먼저 한다 */
export function 건너뛸것(검사들, 지었나) {
  return 지었나 ? [] : 검사들.filter((c) => c.빌드필요).map((c) => c.자);
}

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('막는 검사가 있다', 막는검사.length > 0);
  참('보는 검사가 있다', 보는검사.length > 0);
  참('⛔ 두 목록이 겹치지 않는다',
    !막는검사.some((a) => 보는검사.some((b) => b.자 === a.자)));
  참('⛔ 자 이름이 겹치지 않는다',
    new Set([...막는검사, ...보는검사].map((c) => c.자)).size === 막는검사.length + 보는검사.length);
  참('⛔ 남의 검사를 안 돌린다',
    ![...막는검사, ...보는검사].some((c) => /100y|seoulmarkets/.test(c.자)));
  참('검사마다 무엇을 보는지 적혀 있다',
    [...막는검사, ...보는검사].every((c) => (c.뭘 ?? '').length > 5));
  /* 🔴 8/14 — 빌드가 죽어 지면이 0장인데 검사가 ✅ 를 냈다 */
  참('⛔ 안 지었으면 빌드 필요한 것을 건너뛴다',
    건너뛸것(막는검사, false).includes('check-kcw-korean-leak.mjs'));
  참('지었으면 건너뛰지 않는다', 건너뛸것(막는검사, true).length === 0);
  참('빌드가 필요 없는 것은 안 건너뛴다',
    !건너뛸것(막는검사, false).includes('check-kcw-frontmatter.mjs'));
  참('⭐ 자가 실제로 있다',
    [...막는검사, ...보는검사].every((c) => fs.existsSync(path.join(뿌리, 'scripts', c.자))));
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 지었나 = 빌드했나();
  if (!지었나) {
    console.log('⚠ `dist/wikitip/sitemap.xml` 이 없다 — **지면을 안 지었다.**');
    console.log('   지면을 보는 검사는 건너뛴다. 안 건너뛰면 「0장」에 ✅ 가 나온다.\n');
  }

  const 돌리기 = (c) => {
    const r = spawnSync(process.execPath, [path.join(뿌리, 'scripts', c.자)],
      { cwd: 뿌리, encoding: 'utf8' });
    const 끝줄 = String(r.stdout ?? '').trim().split('\n').filter(Boolean).slice(-1)[0] ?? '';
    return { ok: r.status === 0, 끝줄: 끝줄.slice(0, 76) };
  };

  let 막힘 = 0;
  console.log('── 막는 검사 ──────────────────────────────────────');
  for (const c of 막는검사) {
    if (c.빌드필요 && !지었나) { console.log(`   ⏭ ${c.자.padEnd(30)} 건너뜀 (지면을 안 지었다)`); continue; }
    const r = 돌리기(c);
    if (!r.ok) 막힘 += 1;
    console.log(`   ${r.ok ? '✅' : '🔴'} ${c.자.padEnd(30)} ${r.끝줄}`);
  }

  console.log('\n── 보는 검사 (세기만 한다) ────────────────────────');
  for (const c of 보는검사) {
    if (c.빌드필요 && !지었나) { console.log(`   ⏭ ${c.자.padEnd(30)} 건너뜀 (지면을 안 지었다)`); continue; }
    const r = 돌리기(c);
    console.log(`   ${r.ok ? '·' : '⚠'} ${c.자.padEnd(30)} ${r.끝줄}`);
  }

  console.log(`\n${막힘 ? `🔴 막는 검사 ${막힘}개가 걸렸다 — 배포하지 않는다` : '✅ 막는 검사 전부 통과'}`);
  process.exit(막힘 ? 1 : 0);
}
