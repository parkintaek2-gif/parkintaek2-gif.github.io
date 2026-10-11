/* 기록에 «앞으로 온 시각»이 적혔나. (5번 2026-10-11)
 *
 * 🔴 왜 있나 — 겪은 것
 *   2026-10-11 저녁, 결제 자물쇠를 돌렸더니 마커가 `2026-10-11-18시` 로 찍혔다.
 *   나는 21시인 줄 알고 있었다. `date` 로 재 보니 **18:46** 이었다.
 *   두 시간 가까이 앞서 짐작하고 있었고, 그 짐작이 세션간 메모 네 칸과
 *   매시소통 세 줄에 그대로 들어가 있었다.
 *
 *   ⭐ 사장님이 「한국표준시간으로 하는 걸 못박아놔」 하셨고 변환은 잘해 두었는데,
 *      정작 «지금 몇 시인지»를 안 재고 적었다. **기억으로 적은 시각은 시각이 아니다.**
 *
 * ⭐ 이 자가 잡는 것은 단 하나다 — **앞으로 온 시각.**
 *    「미래에 적힌 시각은 언제나 틀린 시각」이기 때문이다. 그것만은 확실히 잡힌다.
 *
 * ⚠ 못 잡는 것을 밝혀 둔다 — 이 자를 「시각이 다 맞다」로 읽으면 안 된다:
 *    ① «지나간» 시각이 틀린 것은 못 잡는다. 틀렸는지 알 길이 없다.
 *    ② 봐주는 틈(10분) «안쪽»으로 앞선 것도 못 잡는다.
 *       실제로 2026-10-11 에 틀리게 적은 넷 중 「18:55」 하나는 이 자가 못 잡았다
 *       (잴 때가 18:46 이라 9분 뒤였다). 셋만 잡혔다.
 *    ⇒ 이 자는 «큰 어긋남»을 잡는 그물이지 시계가 아니다. 시각은 `date` 로 재서 적는다.
 *
 * ⛔ toISOString() 을 쓰지 않는다. 이 PC 가 이미 한국시간이다.
 *
 * 돌리기   node scripts/check-적은시각이-앞서가나.mjs
 * 자가시험 node scripts/check-적은시각이-앞서가나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 앞서 가도 봐주는 틈 — 적고 나서 돌리기까지 시차가 있다 */
export const 봐주는분 = 10;

/**
 * 글에서 「YYYY-MM-DD HH:MM」·「YYYY-MM-DD HH:Mx」 꼴을 모은다.
 * `18:4x` 처럼 끝자리를 가린 것도 센다 — 그때는 «그 십분대의 처음»으로 읽는다(가장 너그럽게).
 */
export function 적힌시각들(글) {
  const 모은것 = [];
  const 재 = /(\d{4})-(\d{2})-(\d{2})[\sT]+(\d{1,2}):(\d)([\dx])/g;
  let m;
  while ((m = 재.exec(String(글 ?? ''))) !== null) {
    const 분끝 = m[6] === 'x' ? '0' : m[6];
    모은것.push({
      글자: m[0],
      때: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5] + 분끝)),
    });
  }
  return 모은것;
}

/** 지금보다 앞서 간 것만 돌려준다 */
export function 앞서간것(글, 지금 = new Date(), 봐줄분 = 봐주는분) {
  const 끝선 = new Date(지금.getTime() + 봐줄분 * 60 * 1000);
  return 적힌시각들(글).filter((x) => x.때 > 끝선);
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;
  const 지금 = new Date(2026, 9, 11, 18, 46);          /* 2026-10-11 18:46 */

  test('🔴 앞서 간 시각을 잡는다', () => {
    A.equal(앞서간것('## [5번] 2026-10-11 21:00 한 일', 지금).length, 1);
  });
  test('지나간 시각은 안 잡는다', () => {
    A.equal(앞서간것('## [5번] 2026-10-11 17:49 한 일', 지금).length, 0);
  });
  test('🔴 끝자리를 가린 꼴(20:5x)도 잡는다', () => {
    const r = 앞서간것('## [5번] 2026-10-11 20:5x 한 일', 지금);
    A.equal(r.length, 1);
    A.ok(r[0].글자.includes('20:5'));
  });
  test('끝자리를 가린 꼴은 «그 십분대의 처음»으로 읽는다 — 가장 너그럽게', () => {
    /* 18:4x 는 18:40 으로 읽는다. 지금이 18:46 이니 앞선 것이 아니다 */
    A.equal(앞서간것('2026-10-11 18:4x', 지금).length, 0);
  });
  test('봐주는 틈 안쪽은 안 잡는다', () => {
    A.equal(앞서간것('2026-10-11 18:50', 지금).length, 0);
  });
  test('🔴 봐주는 틈을 넘으면 잡는다', () => {
    A.equal(앞서간것('2026-10-11 19:00', 지금).length, 1);
  });
  test('날이 넘어가도 잡는다', () => {
    A.equal(앞서간것('2026-10-12 09:00', 지금).length, 1);
  });
  test('시각이 없는 글은 아무것도 안 잡는다', () => {
    A.equal(앞서간것('오늘 한 일을 적는다', 지금).length, 0);
  });
  test('T 로 이어 붙인 꼴도 읽는다', () => {
    A.equal(앞서간것('2026-10-11T23:30', 지금).length, 1);
  });
}

const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  await 자가시험();
} else if (내가실행됐다) {
  /* 사람이 손으로 적는 자리만 본다 — 기계가 찍는 자리는 시계를 그대로 쓴다 */
  const 볼것 = ['docs/세션간-메모.md', 'docs/매시소통.tsv'];
  const 지금 = new Date();
  console.log('■ 기록에 «앞으로 온 시각»이 적혔나');
  console.log('   지금 ' + 지금.toLocaleString('ko-KR') + ' · 봐주는 틈 ' + 봐주는분 + '분');
  console.log('');

  let 흠 = 0;
  for (const f of 볼것) {
    if (!fs.existsSync(f)) { console.log('   ⬜ ' + f + ' — 없다'); continue; }
    const 글 = fs.readFileSync(f, 'utf8');
    /* 끝쪽만 본다 — 옛 기록까지 다 뒤지면 느리고, 고칠 것도 최근 것이다 */
    const 줄 = 글.split('\n');
    const 최근 = 줄.slice(Math.max(0, 줄.length - 400)).join('\n');
    const 걸린것 = 앞서간것(최근, 지금);
    if (!걸린것.length) { console.log('   ✅ ' + f); continue; }
    흠 += 걸린것.length;
    console.log('   🔴 ' + f + ' — 앞서 간 시각 ' + 걸린것.length + '개');
    for (const x of 걸린것.slice(0, 8)) console.log('        · ' + x.글자);
  }

  console.log('');
  if (흠) {
    console.log('🔴 앞서 간 시각 ' + 흠 + '개 — 미래에 적힌 시각은 언제나 틀린 시각이다.');
    console.log('   ⛔ 짐작으로 고치지 마라. `git log --date=format:%H:%M` 으로 «커밋 시각»을 재서 바로잡는다.');
  } else {
    console.log('✅ 앞서 간 시각이 없다');
  }
  process.exit(흠 ? 1 : 0);
}
