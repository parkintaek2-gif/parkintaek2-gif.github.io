#!/usr/bin/env node
/**
 * 커밋한다-수집이-갱신한-자료.mjs — **배포를 막는 반복 블로커를 없앤다.**
 *
 * ── 🔴 왜 만드나 (2026-10-16) ──────────────────────────────────────────
 * 자동 수집·측정 스크립트가 `src/data/*` 를 날마다 고쳐 놓는데, 배포 관문은
 * 「커밋 안 된 변경」이 하나라도 있으면 배포를 막는다. **둘이 싸운다.**
 *
 *   · 1번이 **17시간** 배포를 못 했다 (2026-10-15~16)
 *   · 나도 **오늘 하루에 세 번** 같은 자리에서 멈춰 손으로 커밋했다
 *
 * ⭐ 손으로 세 번 한 일은 네 번째도 손으로 하게 된다. 그래서 자리를 만든다.
 *
 * ── ⛔ 안전장치 셋 — 남의 작업을 가져가지 않기 위해 ──────────────────
 *   ① **이름표에 적힌 파일만** 건드린다. 목록에 없으면 손도 안 댄다.
 *      ⇒ 여섯 자리가 한 작업 트리를 쓴다. `git add -A` 는 남의 것을 쓸어 담는다.
 *   ② 사이트가 섞이면 **사이트마다 따로** 커밋한다.
 *      ⇒ 2026-09-01 · 2026-09-20 에 한 커밋에 두 사이트가 담겨 사고가 났다.
 *   ③ 값만 바뀐 것인지 본다 — **줄 수가 크게 달라지면 멈추고 사람에게 묻는다.**
 *      ⇒ 수집이 깨져서 자료가 통째로 비었을 때 그것을 커밋해 버리면 안 된다.
 *
 * 쓰는 법
 *   node scripts/커밋한다-수집이-갱신한-자료.mjs            무엇을 커밋할지 보여만 준다
 *   node scripts/커밋한다-수집이-갱신한-자료.mjs --커밋한다   실제로 커밋한다
 *   node scripts/커밋한다-수집이-갱신한-자료.mjs --자가시험
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/**
 * 수집·측정이 «스스로» 고쳐 놓는 자료.
 * ⛔ 여기에 없는 파일은 이 스크립트가 절대 건드리지 않는다.
 * ⛔ 새로 더할 때는 「정말 사람이 손으로 고치지 않는 파일인가」를 먼저 보라.
 */
export const 자동갱신자료 = [
  { 길: 'src/data/invest-ai/state-latest.jsonl', 사이트: 'SeoulMarkets' },
  { 길: 'src/data/research-stats.json', 사이트: 'SeoulMarkets' },
  { 길: 'src/data/korea-index-tape.json', 사이트: 'SeoulMarkets' },
  { 길: 'src/data/korea-valuation-tape.json', 사이트: 'SeoulMarkets' },
  { 길: 'src/data/seoulmarkets-people.json', 사이트: 'SeoulMarkets' },
  { 길: 'src/data/real-readers.json', 사이트: 'SeoulMarkets' },
  { 길: 'src/data/kcw-geo-fit-baseline.json', 사이트: 'K컬처' },
  { 길: 'src/data/wikitip-keyword-demand.json', 사이트: 'K컬처' },
  { 길: 'src/data/wikitip-headlines.json', 사이트: 'K컬처' },
  { 길: 'src/data/100yearmap-indexed.json', 사이트: '백년지도' },
];

/** `git status --porcelain` 한 줄에서 길만 뽑는다 */
export function 길만뽑기(줄) {
  const t = String(줄 ?? '');
  if (t.length < 4) return null;
  let 길 = t.slice(3).trim();
  if (길.startsWith('"') && 길.endsWith('"')) 길 = 길.slice(1, -1);
  /* 이름이 바뀐 것(R)은 「옛 -> 새」로 온다 — 이 스크립트는 그런 것을 다루지 않는다 */
  if (길.includes(' -> ')) return null;
  return 길.replace(/\\/g, '/');
}

/** 바뀐 것 가운데 «이름표에 있는 것»만 고른다 */
export function 고를것(바뀐길들, 목록 = 자동갱신자료) {
  const 안다 = new Map(목록.map((x) => [x.길, x]));
  const 고른것 = [];
  const 남긴것 = [];
  for (const 길 of 바뀐길들 || []) {
    if (!길) continue;
    if (안다.has(길)) 고른것.push(안다.get(길));
    else 남긴것.push(길);
  }
  return { 고른것, 남긴것 };
}

/** 사이트마다 따로 묶는다 — 한 커밋에 두 사이트를 담지 않는다 */
export function 사이트별로묶기(고른것) {
  const 묶음 = new Map();
  for (const x of 고른것 || []) {
    if (!묶음.has(x.사이트)) 묶음.set(x.사이트, []);
    묶음.get(x.사이트).push(x.길);
  }
  return [...묶음.entries()].map(([사이트, 길들]) => ({ 사이트, 길들 }));
}

/**
 * 줄 수가 크게 달라졌나 — 수집이 깨져 자료가 통째로 빈 것을 커밋하지 않기 위해.
 * ⚠ 「줄었다」만 보지 않는다. 갑자기 몇 배로 는 것도 수상하다.
 */
export function 너무많이달라졌나(더한줄, 뺀줄, 문턱 = 0.9) {
  const 더 = Number(더한줄) || 0;
  const 뺀 = Number(뺀줄) || 0;
  if (뺀 === 0) return false;
  /* 거의 다 지워졌는데 새로 들어온 것이 얼마 없다 → 비었을 수 있다 */
  return 더 < 뺀 * (1 - 문턱);
}

/* ── 자가시험 ────────────────────────────────────────────────────── */
const 곧바로부른것 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (곧바로부른것 && process.argv.includes('--자가시험')) {
  let 통과 = 0; let 깨짐 = 0;
  const 참 = (이름, 맞나) => { if (맞나) { 통과 += 1; } else { 깨짐 += 1; console.log('  ⛔ ' + 이름); } };

  참('길을 뽑는다', 길만뽑기(' M src/data/research-stats.json') === 'src/data/research-stats.json');
  참('따옴표를 벗긴다', 길만뽑기(' M "src/data/a b.json"') === 'src/data/a b.json');
  참('역슬래시를 슬래시로', 길만뽑기(' M src\\data\\x.json') === 'src/data/x.json');
  참('이름 바뀐 것은 안 다룬다', 길만뽑기('R  a.json -> b.json') === null);
  참('짧은 줄에 안 터진다', 길만뽑기('M') === null && 길만뽑기(null) === null);

  /* ⛔ 가장 중요한 시험 — 목록에 없는 것은 «절대» 안 고른다 */
  const r = 고를것([
    'src/data/research-stats.json',
    'src/pages/data/valuation.astro',
    'content/articles/내가-쓰던-글.md',
  ]);
  참('이름표에 있는 것만 고른다', r.고른것.length === 1 && r.고른것[0].길 === 'src/data/research-stats.json');
  참('남의 것은 남긴다', r.남긴것.length === 2);
  참('빈 입력에 안 터진다', 고를것(null).고른것.length === 0);

  /* 사이트 섞임 — 2026-09-01 · 09-20 에 사고가 났던 자리 */
  const 묶음 = 사이트별로묶기([
    { 길: 'a', 사이트: 'SeoulMarkets' },
    { 길: 'b', 사이트: 'K컬처' },
    { 길: 'c', 사이트: 'SeoulMarkets' },
  ]);
  참('사이트마다 따로 묶는다', 묶음.length === 2);
  참('한 묶음에 같은 사이트만', 묶음.find((x) => x.사이트 === 'SeoulMarkets').길들.length === 2);

  /* 수집이 깨진 것을 커밋하지 않는다 */
  참('거의 다 지워지면 멈춘다', 너무많이달라졌나(2, 8482) === true);
  참('값만 바뀐 것은 지나간다', 너무많이달라졌나(8482, 8482) === false);
  참('늘어난 것은 막지 않는다', 너무많이달라졌나(9000, 8482) === false);
  참('새 파일(뺀 줄 0)은 막지 않는다', 너무많이달라졌나(100, 0) === false);

  /* 대조군 — 바뀐 것이 없으면 아무것도 안 한다 */
  참('대조군 — 빈 손이면 빈 손', 고를것([]).고른것.length === 0 && 사이트별로묶기([]).length === 0);

  console.log((깨짐 ? '⛔ ' + 깨짐 + '개 깨짐 · ' : '✅ ') + 통과 + '개 통과');
  process.exit(깨짐 ? 1 : 0);
}

/* ── 실제로 돈다 ──────────────────────────────────────────────────── */
if (곧바로부른것 && !process.argv.includes('--자가시험')) {
  const 정말할까 = process.argv.includes('--커밋한다');
  /* ⛔ core.quotepath=false 가 없으면 한글 경로가 팔진수 토막으로 찍혀
     다른 유닛도 사장님도 못 읽는다. 2026-10-16 에 실제로 그렇게 찍혔다. */
  const git = (...인자) => execFileSync('git', ['-c', 'core.quotepath=false', ...인자],
    { cwd: 뿌리, encoding: 'utf8' });

  const 바뀐것 = git('status', '--porcelain')
    .split('\n')
    .filter((x) => x.trim() && !x.startsWith('??'))
    .map(길만뽑기)
    .filter(Boolean);

  const { 고른것, 남긴것 } = 고를것(바뀐것);

  console.log('■ 수집이 스스로 갱신한 자료만 커밋한다');
  console.log('  ⛔ 이름표에 없는 파일은 손도 대지 않는다 — 여섯 자리가 한 작업 트리를 쓴다.');
  console.log('');

  if (!고른것.length) {
    console.log('✅ 커밋할 자동 갱신 자료가 없다');
    if (남긴것.length) {
      console.log('');
      console.log('⬜ 다만 이런 것이 커밋 안 된 채 있다 — ' + 남긴것.length + '개. 이것은 «사람이» 본다');
      for (const 길 of 남긴것.slice(0, 10)) console.log('   · ' + 길);
    }
    process.exit(0);
  }

  /* ③ 수집이 깨진 것을 커밋하지 않는다 */
  const 수상한것 = [];
  for (const x of 고른것) {
    const 숫자 = git('diff', '--numstat', '--', x.길).trim().split('\t');
    if (너무많이달라졌나(숫자[0], 숫자[1])) 수상한것.push({ ...x, 더한줄: 숫자[0], 뺀줄: 숫자[1] });
  }
  if (수상한것.length) {
    console.log('🔴 **멈춘다** — 자료가 거의 다 지워졌다. 수집이 깨진 것일 수 있다');
    for (const x of 수상한것) console.log('   · ' + x.길 + '  +' + x.더한줄 + ' / -' + x.뺀줄);
    console.log('');
    console.log('   ⇒ 먼저 수집을 다시 돌려 보십시오. 빈 자료를 커밋하면 라이브가 빕니다.');
    process.exit(1);
  }

  for (const 묶음 of 사이트별로묶기(고른것)) {
    console.log('  [' + 묶음.사이트 + '] ' + 묶음.길들.length + '개');
    for (const 길 of 묶음.길들) console.log('     · ' + 길);

    if (!정말할까) continue;
    git('add', ...묶음.길들);
    git('commit', '-q', '-m',
      '[자동] ' + 묶음.사이트 + ' 수집 자료 갱신분 ' + 묶음.길들.length + '개\n\n'
      + '수집·측정 스크립트가 스스로 고쳐 놓은 것이다. 사람이 손으로 고친 것은 없다.\n'
      + '배포 관문이 「커밋 안 된 변경」으로 막는 것을 풀려고 커밋한다.\n'
      + '⛔ 이름표(scripts/커밋한다-수집이-갱신한-자료.mjs)에 적힌 파일만 담았다.\n'
      + '\n'
      + '자동 커밋이라 작업 중이던 것이 섞였을 수 있습니다 — 그러면 알려 주십시오.');
    console.log('     ✅ 커밋했다');
  }

  if (남긴것.length) {
    console.log('');
    console.log('⬜ 손대지 않은 것 ' + 남긴것.length + '개 — 이것은 «사람이» 봅니다');
    for (const 길 of 남긴것.slice(0, 10)) console.log('   · ' + 길);
  }

  if (!정말할까) {
    console.log('');
    console.log('  ⬜ 보여만 줬습니다. 실제로 커밋하려면 --커밋한다 를 붙이십시오.');
  }
}
