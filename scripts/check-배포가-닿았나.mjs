#!/usr/bin/env node
/**
 * check-배포가-닿았나.mjs
 *   — 방금 낸 지면이 **라이브에 실제로 닿았나**를 잰다. (SeoulMarkets)
 *
 * ── 🔴 왜 (2026-10-12 12:0x · 5번) ───────────────────────────────────
 *   `/data/gold-bar-premium` 을 내고 커밋·푸시까지 했는데 라이브가 **404** 였다.
 *   CLAUDE.md 397줄에 2026-08-02 실측이 적혀 있었다 —
 *     「**푸시만 하면 배포되지 않는다.** `ctype apply` 를 돌리자 2분 만에 200 이 됐다.」
 *   ⇒ 사장님 2026-10-11 — 「**배포 네가 하면 되잖아. 자기 권한도 체크안하고 일하냐.**」
 *
 *   ⭐⭐ 「커밋했다」와 「손님이 본다」 사이에 **두 걸음이 더 있다** —
 *     ① 커밋·푸시    GitHub 까지만 간다
 *     ② ctype apply  Cloudtype 이 그때서야 clone·빌드한다
 *     ③ 몇 분 기다림  그제야 200 이 된다
 *   ⛔ ①에서 멈추면 아무도 못 본다. **저장소에는 있는데 세상에는 없다.**
 *
 *   klifemap 쪽에는 「배포가 닿았나」를 재는 자가 있는데 SeoulMarkets 쪽에는 없었다.
 *
 * ── ⚠ 이 자가 지키는 것 ─────────────────────────────────────────────
 *   ⛔ **못 받은 것을 「안 올라갔다」로 읽지 않는다** — 그물이 끊겼을 수도 있다.
 *     그래서 «견줌»을 함께 잰다: 이미 있던 지면이 200 인가.
 *     견줌도 404 면 배포가 아니라 **그물이나 터**가 탈난 것이다.
 *   ⛔ 「200 이다」를 「새 판이다」로 읽지 않는다 —
 *     주소가 새것이면 200 자체가 새 판의 증거지만, 고친 지면은 그렇지 않다.
 *     그때는 `--표` 로 «고친 자리의 모양 그대로» 준다(밤사이 겪은 것).
 *
 * 쓰는 법
 *   node scripts/check-배포가-닿았나.mjs /data/gold-bar-premium
 *   node scripts/check-배포가-닿았나.mjs /data/valuation --표 "median premium"
 *   node scripts/check-배포가-닿았나.mjs --자가시험
 */

export const 터 = 'https://seoulmarkets.com';
/** 견줌 — 오래전부터 있던 지면. 이것이 404 면 배포가 아니라 터가 탈난 것이다 */
export const 견줌길 = '/data/valuation';

/** Git Bash 가 바꿔 버린 경로를 되돌린다.
 *  🔴 [2026-10-12 12:1x · 5번] Git Bash 는 `/` 로 시작하는 인자를 윈도 경로로 바꾼다 —
 *    `/data/gold-bar-premium` → `C:/Program Files/Git/data/gold-bar-premium`
 *    그래서 이 자가 「볼 길을 안 알려 주셨습니다」로 끝났다. 인자는 줬는데.
 *  ⛔ 밤사이 `fetch failed` 로 한참 헤맨 바로 그것이다 —
 *    그때 자에 되돌리는 길을 심어 뒀는데 **새로 짓는 자에는 안 넣었다.**
 *    겪은 것을 글로만 갖고 코드로 안 옮긴 것이다. */
export function MSYS되돌리기(글) {
  const s = String(글 ?? '');
  /* C:/…/Git/data/x 또는 C:\…\Git\data\x → /data/x */
  const m = s.match(/^[A-Za-z]:[\\/](?:.*[\\/])?Git[\\/](.+)$/);
  if (m) return '/' + m[1].replace(/\\/g, '/');
  return s;
}

/** 인자에서 볼 길을 고른다 — ⚠ MSYS 로 바뀐 것도 받는다 */
export function 볼길고르기(인자들) {
  for (const a of 인자들 ?? []) {
    if (typeof a !== 'string' || a.startsWith('--')) continue;
    const 되돌린 = MSYS되돌리기(a);
    if (되돌린.startsWith('/')) return 되돌린;
  }
  return null;
}

/** 인자에서 「고친 자리의 모양」을 고른다 — 없으면 null */
export function 표고르기(인자들) {
  const i = (인자들 ?? []).indexOf('--표');
  if (i < 0) return null;
  const v = (인자들 ?? [])[i + 1];
  return typeof v === 'string' && v.trim() ? v : null;
}

/** 받은 것으로 판정한다 — 셋으로 가른다 */
export function 판정(것, 견줌것, 표) {
  if (!것 || 견줌것 == null) return { 빛: '⬜', 말: '못 쟀다' };
  /* ⛔ 견줌이 404 면 배포가 아니라 그물이나 터가 탈난 것이다 */
  if (견줌것 !== 200) {
    return { 빛: '⬜', 말: '견줌 지면도 ' + 견줌것 + ' 다 — **배포가 아니라 터나 그물이 탈났다. 못 쟀다**' };
  }
  if (것.상태 !== 200) return { 빛: '🔴', 말: '아직 ' + 것.상태 + ' 다 — 새 판이 안 닿았다' };
  if (!표) return { 빛: '✅', 말: '200 이다 — 새 주소라면 이것이 새 판의 증거다' };
  if (!것.글.includes(표)) {
    return { 빛: '🔴', 말: '200 인데 «표»가 없다 — 옛 판이 돌고 있다' };
  }
  return { 빛: '✅', 말: '200 이고 표도 있다 — 새 판이 닿았다' };
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  test('인자에서 길과 표를 고른다', () => {
    A.equal(볼길고르기(['/data/x', '--표', '어떤말']), '/data/x');
    A.equal(표고르기(['/data/x', '--표', '어떤말']), '어떤말');
    A.equal(표고르기(['/data/x']), null);
    A.equal(볼길고르기([]), null);
  });
  test('🔴🔴 Git Bash 가 바꾼 경로를 되돌린다 — 2026-10-12 에 실제로 막혔다', () => {
    A.equal(MSYS되돌리기('C:/Program Files/Git/data/gold-bar-premium'), '/data/gold-bar-premium');
    A.equal(MSYS되돌리기('C:\\Program Files\\Git\\data\\x'), '/data/x');
    A.equal(볼길고르기(['C:/Program Files/Git/data/x']), '/data/x');
  });
  test('⛔ 멀쩡한 길은 그대로 둔다', () => {
    A.equal(MSYS되돌리기('/data/x'), '/data/x');
    A.equal(MSYS되돌리기('그냥 글'), '그냥 글');
  });
  test('⛔ --표 같은 깃발을 길로 읽지 않는다', () => {
    A.equal(볼길고르기(['--표', '어떤말']), null);
  });

  test('🔴 아직 안 닿았으면 빨강', () => {
    A.equal(판정({ 상태: 404, 글: '' }, 200).빛, '🔴');
  });
  test('✅ 새 주소가 200 이면 그것이 증거다', () => {
    A.equal(판정({ 상태: 200, 글: '무엇' }, 200).빛, '✅');
  });
  test('🔴🔴 200 인데 «표»가 없으면 옛 판이다 — 밤사이 실제로 속았다', () => {
    /* ⛔ 고친 지면은 주소가 그대로라 200 이 새 판의 증거가 못 된다.
       2026-10-12 새벽에 「Today by zodiac animal」로 재다 옛 판의 심어 둔 사전에
       그 말이 있어 속았다. 표는 «고친 자리의 모양 그대로» 줘야 한다. */
    A.equal(판정({ 상태: 200, 글: '옛 글' }, 200, '새로 넣은 말').빛, '🔴');
    A.equal(판정({ 상태: 200, 글: '여기 새로 넣은 말 있다' }, 200, '새로 넣은 말').빛, '✅');
  });
  test('⛔ 견줌이 404 면 「안 올라갔다」가 아니라 «못 쟀다»', () => {
    /* 그물이 끊겼거나 터가 탈난 것이다. 배포 탓으로 읽으면 엉뚱한 데를 고친다. */
    A.equal(판정({ 상태: 404, 글: '' }, 404).빛, '⬜');
    A.equal(판정({ 상태: 200, 글: '' }, 500).빛, '⬜');
  });
  test('⛔ 못 받았으면 못 쟀다', () => {
    A.equal(판정(null, 200).빛, '⬜');
    A.equal(판정({ 상태: 200, 글: '' }, null).빛, '⬜');
  });
}

if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  await 자가시험();
} else {
  const 볼길 = 볼길고르기(process.argv.slice(2));
  const 표 = 표고르기(process.argv.slice(2));

  if (!볼길) {
    console.log('⛔ 아무것도 안 쟀습니다 — 볼 길을 안 알려 주셨습니다.');
    console.log('');
    console.log('쓰는 법');
    console.log('  node scripts/check-배포가-닿았나.mjs /data/gold-bar-premium');
    console.log('  node scripts/check-배포가-닿았나.mjs /data/valuation --표 "median premium"');
    console.log('');
    console.log('⚠ 조용히 끝나면 다음 사람이 「닿았구나」로 읽습니다. 그래서 2 로 끝냅니다.');
    process.exit(2);
  }

  const 받는다 = async (u) => {
    try {
      const r = await fetch(터 + u, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
        signal: AbortSignal.timeout(25000),
      });
      return { 상태: r.status, 글: await r.text() };
    } catch { return null; }
  };

  console.log('■ 배포가 라이브에 «닿았나» — ' + 터 + 볼길);
  console.log('   🔴 CLAUDE.md 397줄(2026-08-02 실측) — 「푸시만 하면 배포되지 않는다」');
  console.log('   ⭐ 커밋 → ctype apply → 몇 분. ①에서 멈추면 저장소엔 있고 세상엔 없다.');
  console.log('');

  const 것 = await 받는다(볼길);
  const 견줌 = await 받는다(견줌길);
  const 견줌상태 = 견줌 ? 견줌.상태 : null;

  console.log('   볼 지면   ' + (것 ? 것.상태 + ' · ' + 것.글.length + '자' : '못 받았다'));
  console.log('   견줌      ' + 견줌길 + ' → ' + (견줌상태 ?? '못 받았다'));
  if (표) console.log('   찾을 표   ' + 표);
  console.log('');

  const r = 판정(것, 견줌상태, 표);
  console.log(r.빛 + ' ' + r.말);
  if (r.빛 === '🔴') {
    console.log('   ⇒ 아직이면 몇 분 더 기다린다. 그래도 안 되면 —');
    console.log('      ctype apply -f .cloudtype/app.yaml -t @parkintaek2/seoulmarkets:main');
    console.log('      ⛔ -t 를 빼먹지 않는다 — 같은 계정에 klifemap 이 있다.');
    console.log('      ⛔ PowerShell 로 부른다.');
    process.exit(1);
  }
  if (r.빛 === '⬜') process.exit(0);
  process.exit(0);
}
