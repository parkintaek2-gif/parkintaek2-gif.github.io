#!/usr/bin/env node
/**
 * check-kcw-my-files-only.mjs — **커밋에 «남의 유닛 파일»이 섞였나.**
 *
 * ── 🔴 왜 (2026-09-01 14:18 · 내가 저질렀다) ────────────────
 * 기사를 커밋하면서 `git add -A` 를 썼다. **여섯 유닛이 한 작업 트리를 쓰는데.**
 * 그때 3번이 만들고 있던 파일 아홉 개가 내 커밋(bfee70be)에 같이 담겼다 —
 * `senior-doctor/index.astro`(163줄 새 지면) 를 포함해서.
 *
 * ⛔ **남의 것을 지운 것이 아니라 «가져간» 것이라 표가 잘 안 난다.** 그래서 더 위험하다.
 *   3번이 아직 편집 중이었다면 «중간 상태»가 커밋됐을 수 있고, 다시 커밋하려 하면
 *   「변경 없음」이 뜬다.
 * ⛔ 되돌리지 않았다 — 되돌리면 3번 작업이 지워진다. 밀어넣기까지 됐으니 파일은 안전하다.
 *
 * ⭐ 「앞으로 `git add -A` 안 쓴다」로 끝내면 **또 어긴다.** 우리 규칙이 그것이다 —
 *   **규칙은 문장이 아니라 검사로 둔다.** 그래서 이 자를 세웠다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ 「남의 것」을 지우거나 되돌리지 «않는다». 세어서 보여 줄 뿐이다.
 * ⛔ 공유 파일(`docs/세션간-메모.md` 같은 것)은 남의 것이 아니다 — 갈라서 센다.
 * ⚠ 갈래를 못 가리면 「내 것」으로 안 친다. 모르면 물어보게 만든다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-my-files-only.mjs --자가시험
 *   node scripts/check-kcw-my-files-only.mjs        (스테이지에 담긴 것을 본다)
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 5번(K Culture Wire)의 자리. ⛔ 여기 한 곳에만 적는다 */
export const 내갈래 = [
  /^content\/kculturewire\//,
  /^src\/pages\/wikitip\//,
  /^src\/data\/(kcw|wikitip)-/,
  /^src\/data\/gsc-kcw-/,
  /^public\/wikitip\//,
  /^public\/cardnews\//,
  /^scripts\/[^/]*kcw[^/]*\.mjs$/,
  /^scripts\/[^/]*wikitip[^/]*\.mjs$/,
  /^scripts\/lib\/kcw-/,
  /^src\/lib\/(person-jsonld|title-link|klifemap-en)\./,
];

/** 여섯이 같이 쓰는 것 — 남의 것이 아니다. 다만 «따로» 센다 */
export const 공유것 = [
  /^docs\//,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^\.github\//,
  /^scripts\/(deploy|check-deploy-ready|deploy-key|send-mail|session-brief)\.mjs$/,
  /^scripts\/lib\/work-hours\.mjs$/,
  /^src\/layouts\/WikiTip\.astro$/,
  /**
   * ⚠ 2026-09-01 — 여섯이 «다 같이 덧붙이는» 파일이다. 남의 것도 내 것도 아니다.
   *   오늘 6번이 여기 세 줄을 더한 채 커밋을 안 해 내 배포 관문이 섰다.
   *   ⛔ 그렇다고 내가 «대신 담지» 않는다 — 담으면 남의 작업을 가져가는 것이다.
   *     기다리고, 그 사이에 다른 일을 한다.
   */
  /^public\/llms\.txt$/,
];

/** 딱 봐도 남의 유닛인 자리 — 여기 걸리면 «확실히» 잘못이다 */
export const 남의갈래 = [
  { 누구: '3번 (100yearmap)', 꼴: /^(src\/pages\/100y\/|src\/data\/100yearmap\/|scripts\/[^/]*100y[^/]*)/ },
  { 누구: '4번 (KLifeMap)', 꼴: /^(src\/pages\/klifemap\/|src\/data\/klifemap-|scripts\/[^/]*klifemap[^/]*)/ },
  { 누구: '6번 (SeoulMarkets)', 꼴: /^(src\/pages\/(market|equities|fx|rates|commodities|funds|macro)|src\/data\/(krx|bonds|kosis|kasfo)-)/ },
];

/** 이 파일은 누구 것인가 */
export function 누구것(길) {
  const p = String(길 ?? '').replace(/\\/g, '/').trim();
  if (!p) return null;                                   /* ⛔ 못 쟀다 */
  for (const x of 남의갈래) if (x.꼴.test(p)) return { 갈래: '남', 누구: x.누구 };
  if (내갈래.some((re) => re.test(p))) return { 갈래: '내', 누구: '5번' };
  if (공유것.some((re) => re.test(p))) return { 갈래: '공유', 누구: '여섯 유닛' };
  return { 갈래: '모름', 누구: null };                    /* ⚠ 모르면 내 것으로 안 친다 */
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  검('내 기사', 누구것('content/kculturewire/x.md').갈래 === '내');
  검('내 지면', 누구것('src/pages/wikitip/watched.astro').갈래 === '내');
  검('내 자료', 누구것('src/data/kcw-star-pages.json').갈래 === '내');
  검('내 자', 누구것('scripts/check-kcw-live.mjs').갈래 === '내');

  /* 🔴 오늘 내가 가져간 그 파일들이 «남»으로 잡히는지 — 이게 이 자의 핵심이다 */
  검('3번 지면을 잡는다', 누구것('src/pages/100y/senior-doctor/index.astro').누구.includes('3번'));
  검('3번 자료를 잡는다', 누구것('src/data/100yearmap/senior-doctor-program.json').누구.includes('3번'));
  검('3번 자를 잡는다', 누구것('scripts/build-100y-lastmod.mjs').누구.includes('3번'));
  검('6번 자리를 잡는다', 누구것('src/pages/market/vietnam.astro').누구.includes('6번'));
  검('4번 자리를 잡는다', 누구것('src/data/klifemap-saju.json').누구.includes('4번'));

  검('공유 메모는 공유', 누구것('docs/세션간-메모.md').갈래 === '공유');
  검('배포 자는 공유', 누구것('scripts/deploy.mjs').갈래 === '공유');
  검('시간표는 공유', 누구것('scripts/lib/work-hours.mjs').갈래 === '공유');
  검('llms.txt 는 공유 — 여섯이 다 덧붙인다', 누구것('public/llms.txt').갈래 === '공유');

  검('⚠ 모르는 것은 내 것으로 «안» 친다', 누구것('src/lib/무언가.ts').갈래 === '모름');
  검('⛔ 빈 값은 null', 누구것('') === null && 누구것(null) === null);
  검('윈도 역슬래시도 읽는다', 누구것('src\\pages\\100y\\x.astro').갈래 === '남');

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ check-kcw-my-files-only 자가시험 통과 (${센것})`);
  process.exit(0);
}

if (내가실행됐다) {
  /* 스테이지에 담긴 것 + 아직 안 담긴 변경, 둘 다 본다 */
  let 줄들;
  try {
    줄들 = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
      .split('\n').map((x) => x.trimEnd()).filter(Boolean);
  } catch (e) {
    console.error('⛔ **못 쟀다** — git status 를 못 읽었다. 「깨끗하다」가 아니다.');
    process.exit(1);
  }

  if (!줄들.length) { console.log('■ 바뀐 것이 없다.'); process.exit(0); }

  const 담김 = []; const 안담김 = [];
  for (const 줄 of 줄들) {
    const 표 = 줄.slice(0, 2);
    const 길 = 줄.slice(3).replace(/^"|"$/g, '');
    (표[0] !== ' ' && 표[0] !== '?' ? 담김 : 안담김).push({ 길, 누구: 누구것(길) });
  }

  const 남담김 = 담김.filter((x) => x.누구?.갈래 === '남');
  const 모름담김 = 담김.filter((x) => x.누구?.갈래 === '모름');

  console.log(`■ 커밋에 남의 유닛 파일이 섞였나 — 스테이지 ${담김.length}개 · 아직 안 담김 ${안담김.length}개\n`);

  if (남담김.length) {
    console.log(`🔴 **남의 유닛 파일 ${남담김.length}개가 스테이지에 있다** — 커밋하면 가져가는 것이다`);
    for (const x of 남담김) console.log(`     ${x.누구.누구}  ${x.길}`);
    console.log('\n   ⛔ 되돌리지 말고 «빼기»만 한다 —  git restore --staged <파일>');
    console.log('   ⛔ `git checkout --` 를 쓰면 남의 작업이 «지워진다». 절대 안 된다.');
  } else console.log('   ✅ 남의 유닛 파일 0개');

  if (모름담김.length) {
    console.log(`\n⚠ **갈래를 모르는 것 ${모름담김.length}개** — 「내 것」으로 안 친다. 눈으로 본다`);
    for (const x of 모름담김.slice(0, 10)) console.log(`     ${x.길}`);
  }

  const 남안담김 = 안담김.filter((x) => x.누구?.갈래 === '남');
  if (남안담김.length) {
    console.log(`\n📌 남의 유닛이 «지금 작업 중»인 것 ${남안담김.length}개 — 건드리지 않는다`);
    for (const x of 남안담김.slice(0, 6)) console.log(`     ${x.누구.누구}  ${x.길}`);
  }

  console.log('\n⭐ 2026-09-01 에 `git add -A` 로 3번 파일 아홉 개를 가져갔다.');
  console.log('   여섯 유닛이 한 작업 트리를 쓴다. **담을 때 경로로 집는다.**');

  if (남담김.length) process.exit(1);
}
