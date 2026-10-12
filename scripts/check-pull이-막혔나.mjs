/* check-pull이-막혔나.mjs — `git pull` 이 막혀 «남의 글을 못 받고» 있나
 *
 *   node scripts/check-pull이-막혔나.mjs --자가시험
 *   node scripts/check-pull이-막혔나.mjs
 *
 * ── 🔴🔴 왜 이 자가 필요한가 (2026-10-13 08:4x · 5번) ───────────────────
 *
 * 매시 점검마다 이렇게 쳤다 —
 *     git pull -q --rebase origin main 2>&1 | tail -1
 * 그런데 **여섯 시간 넘게 이 줄만 돌아오고 있었다** —
 *     error: Please commit or stash them.
 *
 * ⛔ 나는 그것을 **흘려보냈다.** 뒤에 붙인 명령이 잘 돌았기 때문이다.
 *   그 사이 1번·2번이 글을 올렸다면 **나는 한 줄도 못 받았을 것이다.**
 *   (이번엔 다행히 올라온 것이 없었다. 재서 확인했다 — HEAD..origin/main 이 0 이었다)
 *
 * ⭐ 막고 있던 것은 **2번이 찍어 놓고 커밋 안 한 감수 도장 세 줄**이었다.
 *   남의 기록이 공용 트리에 떠 있으면서 내 눈을 가린 것이다.
 *
 * ⛔ 「다음엔 그 줄을 잘 보자」로 두지 않는다. 사람은 조용한 실패를 못 본다.
 *   ⇒ **뒤처진 수**와 **막는 파일**을 세어서 말하게 한다.
 *
 * ⚠ 이 자는 고치지 않는다. 무엇이 막고 있는지만 짚는다 —
 *   남의 파일을 내가 함부로 치우면 그쪽 일이 날아간다.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 저장소들 = [
  'C:/Users/User/Documents/GitHub/dataeconomics',
  'C:/Users/User/Documents/GitHub/klifemap',
];

/** 지저분한 파일 목록에서 «pull 을 막는 것»만 고른다 — 추적되는 파일의 고침만 막는다 */
export function 막는파일(status글) {
  return String(status글 ?? '')
    .split(/\r?\n/)
    .filter((줄) => /^( M|M |MM|A |AM| D|D |R |RM)/.test(줄))
    .map((줄) => 줄.slice(3).trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}

/**
 * 판정.
 * ⛔ 「뒤처진 것이 0」을 「성하다」로 읽지 않는다 — 막혀 있으면 «다음»에 못 받는다.
 */
export function 판정({ 뒤처짐, 막는것, 탈 = null }) {
  if (탈) return { 빛: '⬜', 말: `못 쟀다 — ${탈}` };
  if (막는것.length && 뒤처짐 > 0) {
    return {
      빛: '🔴',
      말: `pull 이 막혔고 «받을 것이 ${뒤처짐}개» 있다 — 남의 글을 지금 못 받고 있다`
        + ` (막는 파일 ${막는것.length}개: ${막는것.slice(0, 3).join(' · ')})`,
    };
  }
  if (막는것.length) {
    return {
      빛: '⚠',
      말: `pull 이 막혀 있다 — 지금은 받을 것이 없지만 «다음에» 못 받는다`
        + ` (막는 파일 ${막는것.length}개: ${막는것.slice(0, 3).join(' · ')})`,
    };
  }
  if (뒤처짐 > 0) return { 빛: '⚠', 말: `받을 것이 ${뒤처짐}개 있다 — pull 을 친다` };
  return { 빛: '✅', 말: 'pull 이 열려 있고 받을 것도 없다' };
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  본다('고친 파일을 막는 것으로 센다',
    막는파일(' M docs/a.tsv').length === 1);
  본다('⛔ 추적 안 되는 파일(??)은 pull 을 안 막는다 — 세면 거짓 빨간불이 난다',
    막는파일('?? tmp.json').length === 0);
  본다('따옴표로 싸인 이름을 푼다 (한글 이름이 그렇게 온다)',
    막는파일(' M "docs/\\352\\260\\220.tsv"')[0].startsWith('docs/'));
  본다('여럿이면 여럿 센다',
    막는파일(' M a\n M b\n?? c').length === 2);
  본다('⛔ 빈 값에도 안 터진다', 막는파일(null).length === 0);

  /* 🔴 오늘 실제로 난 꼴 — 막혀 있는데 받을 것이 없어서 조용했다 */
  본다('⚠ 막혔는데 받을 것이 없으면 ⚠ 다 — ⛔ ✅ 가 아니다',
    판정({ 뒤처짐: 0, 막는것: ['docs/감수도장.tsv'] }).빛 === '⚠');
  본다('   그 말에 «다음에 못 받는다»가 든다',
    /다음에» 못 받는다|다음에 못 받는다/.test(판정({ 뒤처짐: 0, 막는것: ['a'] }).말));
  본다('🔴 막혔는데 받을 것이 있으면 빨간불',
    판정({ 뒤처짐: 3, 막는것: ['a'] }).빛 === '🔴');
  본다('   몇 개를 못 받고 있는지 적는다',
    /받을 것이 3개/.test(판정({ 뒤처짐: 3, 막는것: ['a'] }).말));
  본다('   무엇이 막는지 이름을 낸다 — 수만 내면 어디를 볼지 모른다',
    /docs\/감수도장/.test(판정({ 뒤처짐: 1, 막는것: ['docs/감수도장.tsv'] }).말));
  본다('⚠ 안 막혔는데 받을 것이 있으면 ⚠ — 그냥 치면 된다',
    판정({ 뒤처짐: 2, 막는것: [] }).빛 === '⚠');
  본다('✅ 둘 다 없으면 초록불', 판정({ 뒤처짐: 0, 막는것: [] }).빛 === '✅');
  본다('⬜ 못 쟀으면 ⬜ — ⛔ ✅ 가 아니다',
    판정({ 뒤처짐: 0, 막는것: [], 탈: '폴더가 없다' }).빛 === '⬜');

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
function 잰다() {
  let 나쁨 = 0;
  console.log('■ git pull 이 막혀 남의 글을 못 받고 있나\n');
  for (const 방 of 저장소들) {
    const 이름 = 방.split('/').pop();
    let 결과;
    try {
      const 돌 = (인자) => execFileSync('git', 인자, { cwd: 방, encoding: 'utf8' });
      돌(['fetch', '-q', 'origin', 'main']);
      const 뒤처짐 = Number(돌(['rev-list', '--count', 'HEAD..origin/main']).trim()) || 0;
      const 막는것 = 막는파일(돌(['status', '--short']));
      결과 = 판정({ 뒤처짐, 막는것 });
    } catch (e) {
      결과 = 판정({ 뒤처짐: 0, 막는것: [], 탈: String(e?.message ?? e).slice(0, 60) });
    }
    console.log('  ' + 결과.빛 + ' ' + 이름.padEnd(16) + 결과.말);
    if (결과.빛 === '🔴') 나쁨 += 1;
  }
  console.log('');
  console.log('  ⚠ 이 자는 «고치지» 않는다 — 남의 파일을 함부로 치우면 그쪽 일이 날아간다.');
  console.log('    막는 파일을 열어 «누구 것인지» 보고, 남의 완결된 기록이면 커밋해 남긴다.');
  console.log('  ⛔ 「pull 이 조용히 실패했다」는 사람이 못 본다 — 오늘 여섯 시간을 못 봤다.');
  return 나쁨 ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(잰다());
}
