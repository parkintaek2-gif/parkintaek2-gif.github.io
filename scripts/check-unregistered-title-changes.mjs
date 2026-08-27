#!/usr/bin/env node
/**
 * check-unregistered-title-changes.mjs
 *   — **제목·설명을 고쳐 놓고 «실험 대장에 안 적은» 것을 찾는다.**
 *
 * ── 왜 만들었나 (2026-08-28 새벽) ──────────────────────────────
 * 하룻밤에 같은 흠을 **두 번** 만났다.
 * ```
 * ① 8/25 에 /title 열 장을 「깊게」 해 놓고 «언제 읽을지»를 안 적었다
 *    → 사흘 뒤에 내가 우연히 읽었다. 결과는 5/10 대 5/10(차이 없음)이었다
 * ② 8/27 에 /person 636장 제목·설명을 고쳐 놓고 실험 대장에 «안 적었다»
 *    → 8/28 에 GSC 를 갈래별로 갈라 재다가 우연히 기준값을 잡았다.
 *      그 우연이 없었으면 어제 고친 것의 효과를 «영영» 몰랐다
 * ```
 * 🔴 **적히지 않은 바꿈은 잰 적 없는 바꿈이다.** 고친 사람은 「고쳤다」로 만족하고,
 *   며칠 뒤에 그 자리를 또 고친다. 두 바꿈이 섞이면 둘 다 못 잰다.
 *
 * ⛔ 이 자는 **막지 않는다**(exit 0). 사람을 세우는 것이 목적이 아니라,
 *   「이거 대장에 적었나?」를 매일 한 번 물어 주는 것이 목적이다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **「고쳤는데 안 적었다」와 「안 고쳤다」를 가른다.** 안 고쳤으면 아무 말도 안 한다.
 * ⛔ 커밋 글자를 믿지 않는다 — **실제로 TITLE·DESC 줄이 든 파일이 바뀌었나**를 본다.
 * ⚠ 대장에 적힌 «지면 이름»과 파일 경로를 느슨하게 맞춘다. 엄격히 맞추면
 *   `/person/*` 과 `person/[person].astro` 가 안 맞아 늘 거짓 경보가 난다.
 *
 * 쓰기 — node scripts/check-unregistered-title-changes.mjs [--날 7]
 *        node scripts/check-unregistered-title-changes.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/** 파일 경로에서 「지면 갈래」를 뽑는다 — `src/pages/wikitip/person/[person].astro` → `person` */
export function 갈래뽑기(파일길) {
  const m = String(파일길 ?? '').replace(/\\/g, '/').match(/src\/pages\/wikitip\/(.+?)\.astro$/);
  if (!m) return null;
  const 조각 = m[1].split('/');
  /* `[slug]`·`index` 같은 자리표는 갈래 이름이 아니다 */
  const 이름 = 조각.filter((s) => !/^\[.+\]$/.test(s) && s !== 'index');
  return 이름.length ? 이름[0] : (조각[0] ?? null);
}

/** 대장에 그 갈래가 적혀 있나. ⚠ 느슨하게 맞춘다 — `/person/*` 도 `person` 으로 본다. */
export function 대장에있나(갈래, 실험들, 바꾼날) {
  if (!갈래) return false;
  return (실험들 ?? []).some((x) => {
    const 글 = String(x?.지면 ?? '');
    if (!글.replace(/[/*]/g, ' ').split(/\s+/).includes(갈래)) return false;
    /* 날이 주어지면 «그 날 이후»에 적힌 것만 인정한다 — 묵은 실험이 새 바꿈을 덮지 않게 */
    if (!바꾼날) return true;
    return String(x?.바꾼날 ?? '') >= 바꾼날;
  });
}

/** 그 파일이 제목·설명을 만드는 파일인가 */
export function 제목만드는파일인가(본문) {
  return /const\s+TITLE\s*=|const\s+DESC\s*=|<title>/.test(String(본문 ?? ''));
}

/**
 * 🔴 [2026-08-28 · 5번] **처음 돌렸더니 56갈래가 걸렸다. 자가 너무 넓었다.**
 *   ─────────────────────────────────────────────────────────────
 *   처음 자는 「TITLE 줄이 «든» 파일이 바뀌었나」를 봤다. 그런데 그런 파일은 본문 한 줄만
 *   고쳐도 걸린다. 오늘 밤 나는 여러 지면의 «주석»만 고쳤는데 그것까지 다 걸렸다.
 *   ⛔ 56갈래를 그대로 「안 적은 실험 56건」이라고 알렸으면 **전 유닛이 헛일을 했을 것이다.**
 *   ⚠ 내 메모리에 적어 둔 것 그대로다 — **수가 극단으로 나오면 자를 먼저 의심한다.**
 * ⭐ 그래서 «바뀐 줄»을 본다. 더해지거나 지워진 줄 중에 제목·설명 줄이 있어야 센다.
 *
 * @param {string} 디프  `git log -p` 가 준 글
 */
export function 제목줄이바뀌었나(디프) {
  const 줄들 = String(디프 ?? '').split('\n')
    .filter((s) => /^[+-]/.test(s) && !/^(\+\+\+|---)/.test(s));
  return 줄들.some((s) => /const\s+(TITLE|DESC)\s*=|<title>|description=\{/.test(s));
}

/* ── 자가시험 ─────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0;
  const T = (이름, 참) => { if (참) { 통과 += 1; return; } console.error(`  ✗ ${이름}`); process.exitCode = 1; };

  T('자리표를 갈래 이름으로 삼지 않는다', 갈래뽑기('src/pages/wikitip/person/[person].astro') === 'person');
  T('홑장도 갈래로 본다', 갈래뽑기('src/pages/wikitip/about.astro') === 'about');
  T('깊은 곳도 첫 조각을 쓴다', 갈래뽑기('src/pages/wikitip/title/[slug].astro') === 'title');
  T('지면이 아닌 파일은 null', 갈래뽑기('scripts/deploy.mjs') === null);
  T('윈도 역슬래시도 읽는다', 갈래뽑기('src\\pages\\wikitip\\group\\[g].astro') === 'group');

  const 실험 = [{ 지면: '/person/* (636장 전부)', 바꾼날: '2026-08-27' }, { 지면: '/ladder-gap', 바꾼날: '2026-08-27' }];
  T('별표가 붙어도 맞춘다', 대장에있나('person', 실험) === true);
  T('안 적힌 갈래는 못 찾는다', 대장에있나('title', 실험) === false);
  T('묵은 실험이 새 바꿈을 덮지 않는다', 대장에있나('person', 실험, '2026-08-28') === false);
  T('같은 날이면 인정한다', 대장에있나('person', 실험, '2026-08-27') === true);
  T('갈래가 없으면 false', 대장에있나(null, 실험) === false);

  T('TITLE 을 만드는 파일을 알아본다', 제목만드는파일인가('const TITLE = `x`;') === true);
  T('DESC 만 있어도 알아본다', 제목만드는파일인가('const DESC = "x";') === true);
  T('아무것도 없으면 아니다', 제목만드는파일인가('const 값 = 1;') === false);

  T('제목 줄이 바뀌면 센다',
    제목줄이바뀌었나(['-const TITLE = `a`;', '+const TITLE = `b`;'].join('\n')) === true);
  T('주석만 바뀐 것은 안 센다',
    제목줄이바뀌었나(['-/* 옛 주석 */', '+/* 새 주석 */'].join('\n')) === false);
  T('디프 머리글(+++/---)은 안 센다',
    제목줄이바뀌었나(['--- a/x.astro', '+++ b/x.astro'].join('\n')) === false);
  T('빈 디프는 안 센다', 제목줄이바뀌었나('') === false);

  console.log(`자가시험 ${통과}개 통과`);
}

/* ── 실제로 재기 ──────────────────────────────────────────── */
function 잰다(날 = 7) {
  const 뿌리 = process.cwd();
  const 대장길 = path.join(뿌리, 'src/data/kcw-title-experiments.json');
  if (!fs.existsSync(대장길)) {
    console.log('⚠ 못 쟀다 — 실험 대장(src/data/kcw-title-experiments.json)이 없다');
    return;
  }
  const 실험들 = JSON.parse(fs.readFileSync(대장길, 'utf8')).실험 ?? [];

  let 바뀐것 = [];
  try {
    바뀐것 = execSync(`git log --since="${날} days ago" --name-only --pretty=format: -- "src/pages/wikitip"`,
      { encoding: 'utf8' })
      .split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    console.log(`⚠ 못 쟀다 — git 이 안 돈다: ${e.message}`);
    return;
  }
  const 본것 = new Set();
  const 걸린것 = new Map();
  for (const f of 바뀐것) {
    if (본것.has(f)) continue;
    본것.add(f);
    const 길 = path.join(뿌리, f);
    if (!fs.existsSync(길)) continue;               // 지워진 파일은 안 센다
    if (!제목만드는파일인가(fs.readFileSync(길, 'utf8'))) continue;
    const 갈래 = 갈래뽑기(f);
    if (!갈래) continue;
    if (대장에있나(갈래, 실험들)) continue;
    /* ⭐ 파일이 바뀐 것만으로는 안 센다 — «제목·설명 줄»이 바뀌어야 센다 */
    let 디프 = '';
    try {
      디프 = execSync(`git log --since="${날} days ago" -p --pretty=format: -- "${f}"`,
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    } catch { continue; }
    if (!제목줄이바뀌었나(디프)) continue;
    걸린것.set(갈래, f);
  }

  console.log(`최근 ${날}일 · 제목·설명을 만드는 지면 파일 ${본것.size}개가 바뀌었다`);
  if (!걸린것.size) {
    console.log('✅ 바뀐 것이 다 실험 대장에 적혀 있다');
    return;
  }
  console.log(`\n🔴 대장에 «안 적힌» 갈래 ${걸린것.size}개 —`);
  for (const [갈래, f] of 걸린것) console.log(`   ${갈래.padEnd(12)} ${f}`);
  console.log('\n⚠ 적히지 않은 바꿈은 «잰 적 없는» 바꿈이다.');
  console.log('   src/data/kcw-title-experiments.json 의 「실험」에 바꾼날·다시잴날·전값을 적어 두십시오.');
  console.log('⛔ 이 자는 막지 않는다 — 물어볼 뿐이다.');
}

const 직접 = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('check-unregistered-title-changes.mjs');
if (직접) {
  if (process.argv.includes('--자가시험')) 자가시험();
  else {
    const i = process.argv.indexOf('--날');
    잰다(i > -1 ? Number(process.argv[i + 1]) || 7 : 7);
  }
}
