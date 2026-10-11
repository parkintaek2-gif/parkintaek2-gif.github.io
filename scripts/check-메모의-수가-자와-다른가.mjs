#!/usr/bin/env node
/* 메모에 적은 «수»가 자가 내는 수와 다른가. (5번 2026-10-12 07:2x)
 *
 * 🔴🔴 왜 있나 — 2026-10-12 에 내가 그랬다.
 *   메모에 「색인 요청은 **하루 한 장**」이라고 **일곱 번** 적었다. 실제로는 **열 장**이다.
 *   그 수를 내는 자가 바로 옆에 있었다 —
 *     node scripts/날마다-색인요청.mjs --오늘몫을썼나
 *       ■ 오늘 넣은 색인 요청 0개 / 하루 몫 10개
 *   그 자 머리에는 이렇게까지 적혀 있다 —
 *     「날마다 쓰면 한 해에 3,600장이다. 안 쓰면 0장이다」
 *   ⇒ 내가 「한 장」으로 알고 돈 날들은 **하루에 아홉 장씩 버린 것**이다.
 *
 * ⭐⭐ 이 꼴이 가장 조용하다.
 *   다른 흠들은 무언가 어긋나서 눈에 띈다. 이것은 **틀린 수로도 일이 굴러가서**
 *   아무 데서도 빨간불이 안 뜬다. 그래서 영영 안 들킨다.
 *   ⇒ 글로 두면 또 그런다. 자로 둔다.
 *
 * ⚠ 이 자가 할 수 있는 것과 못 하는 것
 *   할 수 있다 — **겪은 수**가 메모에 틀리게 적혀 있나
 *   못 한다   — 메모의 모든 수. 그건 셀 수 없고, 넓히면 거짓 빨강이 쏟아진다
 *   ⛔ 그래서 «겪은 자리만» 못 박는다. 하나 겪을 때마다 한 줄 더한다.
 *
 * 돌리기   node scripts/check-메모의-수가-자와-다른가.mjs
 * 자가시험 node scripts/check-메모의-수가-자와-다른가.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 겪은 자리 — 「메모에 이렇게 적히면 틀린 것이다」 */
export const 못박은것 = [
  {
    무엇: '색인 요청 하루 몫',
    틀린꼴: /색인\s*요청(은|이)?\s*하루\s*한\s*(장|개)/g,
    맞음: '하루 열 장',
    자: 'node scripts/날마다-색인요청.mjs --오늘몫을썼나',
    겪은날: '2026-10-12',
    값: '「한 장」으로 알고 돈 날마다 아홉 장씩 버렸다. 날마다 쓰면 한 해 3,600장',
  },
];

/** 그 글에서 틀린 꼴이 몇 곳인가 */
export function 틀린곳(글, 꼴) {
  return (String(글 ?? '').match(꼴) ?? []).length;
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;

  test('🔴 틀린 꼴을 세어 낸다 — 실제로 적혔던 글이다', () => {
    const 꼴 = 못박은것[0].틀린꼴;
    A.equal(틀린곳('색인 요청은 하루 한 장이라 문 한 장에 썼다', 꼴), 1);
    A.equal(틀린곳('색인요청 하루 한 개', 꼴), 1);
  });
  test('⛔ 맞게 적은 글은 안 걸린다', () => {
    const 꼴 = 못박은것[0].틀린꼴;
    A.equal(틀린곳('색인 요청은 하루 열 장이다', 꼴), 0);
    A.equal(틀린곳('하루 한 장씩 글을 낸다', 꼴), 0, '색인 요청 이야기가 아닌 것을 걸었다');
  });
  test('🔴 못 박은 것마다 «그 수를 내는 자»가 적혀 있다', () => {
    /* ⭐ 이 자의 핵심이다. 「틀렸다」만 말하고 어디서 맞는 수를 얻는지 안 적으면,
       다음 사람은 또 기억으로 적는다. */
    for (const x of 못박은것) {
      A.ok(x.자 && x.자.startsWith('node '), x.무엇 + ' 에 «수를 내는 자»가 없다');
      A.ok(x.값 && x.값.length > 10, x.무엇 + ' 에 «얼마나 값이 큰가»가 없다');
    }
  });
  test('⚠ 못 박은 자가 실제로 저장소에 있다 — 없으면 이 자가 헛돈다', () => {
    for (const x of 못박은것) {
      const 파일 = (x.자.match(/node\s+(\S+)/) || [])[1];
      A.ok(fs.existsSync(path.join(뿌리, 파일)), 파일 + ' 이 없다 — 자 이름이 바뀌었으면 여기도 고친다');
    }
  });
  test('빈 글·null 에도 안 터진다', () => {
    A.equal(틀린곳('', 못박은것[0].틀린꼴), 0);
    A.equal(틀린곳(null, 못박은것[0].틀린꼴), 0);
  });
}

const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  await 자가시험();
} else if (내가실행됐다) {
  console.log('■ 메모에 적은 «수»가 자가 내는 수와 다른가');
  console.log('   ⭐ 이 꼴이 가장 조용하다 — **틀린 수로도 일이 굴러가서** 아무 데서도 빨간불이 안 뜬다.');
  console.log('');

  /* ⚠ 바로잡는 줄 «뒤»만 본다. 그 앞은 「그때 무엇을 알았나」의 기록이라 고치지 않는다. */
  const 메모길 = path.join(뿌리, 'docs', '세션간-메모.md');
  const 온글 = fs.readFileSync(메모길, 'utf8');

  let 흠 = 0;
  for (const x of 못박은것) {
    const 바로잡은자리 = 온글.lastIndexOf('바로잡음 — 이 문서에 「' + '색인 요청은 하루 한 장');
    const 볼글 = 바로잡은자리 >= 0 ? 온글.slice(바로잡은자리) : 온글;
    /* 바로잡는 글 자체에 틀린 꼴이 «보기»로 적혀 있다 — 그건 센다고 흠이 아니다 */
    const 몇 = Math.max(0, 틀린곳(볼글, x.틀린꼴) - 2);
    const 전체 = 틀린곳(온글, x.틀린꼴);
    console.log('   ' + (몇 ? '🔴' : '✅') + ' ' + x.무엇);
    console.log('      맞는 수  ' + x.맞음 + '   — ' + x.자);
    console.log('      왜 큰가  ' + x.값);
    console.log('      메모 전체 ' + 전체 + '곳 · **바로잡은 뒤** ' + 몇 + '곳'
      + (바로잡은자리 < 0 ? '  ⚠ 바로잡는 줄을 못 찾았다 — 전체를 셌다' : ''));
    if (몇) 흠 += 몇;
    console.log('');
  }

  if (흠) {
    console.log('🔴 바로잡은 뒤에도 ' + 흠 + '곳에 틀린 수가 적혔다 — 그 자를 돌려 보고 다시 적는다.');
    process.exit(1);
  }
  console.log('✅ 못 박은 수가 바로잡은 뒤로는 틀리게 안 적혔다');
  console.log('⭐ 수를 적기 전에 — `ls scripts/ | grep <그 일>` 을 먼저 친다. 자가 있으면 그것이 정본이다.');
  process.exit(0);
}
