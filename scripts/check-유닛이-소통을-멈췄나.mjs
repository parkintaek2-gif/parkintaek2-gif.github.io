/* 유닛이 «몇 시간째» 소통을 멈췄나. (5번 2026-10-11 21:0x)
 *
 * 🔴 왜 있나 — 겪은 것
 *   2026-10-11 밤 아홉 시에 총괄로서 진도를 재 보니 —
 *     1번 마지막 소통 2026-10-10 18:44 (26시간)
 *     2번 마지막 소통 2026-10-07 08:08 (나흘)
 *   사장님 지시 「**모든 팀원은 1시간에 한 번씩 U2와 소통하라**」가 멈춰 있었다.
 *
 *   ⭐ 더 아픈 것은 **내가 하루 넘게 몰랐다**는 것이다.
 *      내 자리 규칙에 「시킨 일의 진도는 물으시기 전에 기억이 아니라 «자»로 재서 파악한다」가
 *      적혀 있는데, 정작 그 «자»가 없었다. 글로만 가진 규칙은 잊힌다.
 *
 * ⚠ 이 자가 «말하지 않는» 것 —
 *   · 왜 멈췄는지는 모른다. 세션이 안 열렸을 수도, 다른 일을 하고 있을 수도 있다.
 *   · 일을 «안 했다»는 뜻이 아니다. 소통 줄이 없다는 것만 안다. 그 둘은 다른 말이다.
 *   · 근무시간을 가린다 — 1번·2번은 07~21시다. 그 밖의 시간은 멈춘 것이 아니다.
 *     5번만 24시간이다(사장님 2026-10-03 「24시간 일을 해야함....다른 세션은 그렇지 않지만」).
 *
 * 돌리기   node scripts/check-유닛이-소통을-멈췄나.mjs
 * 자가시험 node scripts/check-유닛이-소통을-멈췄나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 보는 유닛과 그 근무시간. ⛔ 3·4·6번은 안 쓴다(사장님 2026-10-04 「다신 기재하지마」) */
export const 유닛들 = [
  { 이름: '1번', 여는시: 7, 닫는시: 21, 참는시간: 3 },
  { 이름: '2번', 여는시: 7, 닫는시: 21, 참는시간: 3 },
  { 이름: '5번', 여는시: 0, 닫는시: 24, 참는시간: 3 },
];

/** 소통 파일에서 유닛별 마지막 줄의 때를 뽑는다 */
export function 마지막소통(글, 이름) {
  const 재 = new RegExp('^(\\d{4}-\\d{2}-\\d{2})[ \\t]+(\\d{1,2}):(\\d{2})\\t' + 이름 + '\\t', 'gm');
  let 마지막 = null;
  let m;
  while ((m = 재.exec(String(글 ?? ''))) !== null) 마지막 = m;
  if (!마지막) return null;
  const [해, 달, 날] = 마지막[1].split('-').map(Number);
  return new Date(해, 달 - 1, 날, Number(마지막[2]), Number(마지막[3]));
}

/** 두 때 사이에서 그 유닛이 «깨어 있던» 시간이 몇 시간인가 — 근무시간 밖은 안 센다 */
export function 깨어있던시간(부터, 까지, 여는시, 닫는시) {
  if (!부터 || !까지 || 까지 <= 부터) return 0;
  let 분 = 0;
  const 걸음 = new Date(부터.getTime());
  걸음.setSeconds(0, 0);
  while (걸음 < 까지) {
    const h = 걸음.getHours();
    if (h >= 여는시 && h < 닫는시) 분 += 1;
    걸음.setMinutes(걸음.getMinutes() + 1);
    if (분 > 60 * 24 * 30) break;            /* 한 달 넘으면 그만 센다 */
  }
  return 분 / 60;
}

/** 멈췄나 — 멈췄으면 몇 시간인지, 아니면 null */
export function 멈췄나(마지막, 지금, 유닛) {
  if (!마지막) return { 멈춤: true, 시간: null, 까닭: '소통 줄이 한 줄도 없다' };
  const 시간 = 깨어있던시간(마지막, 지금, 유닛.여는시, 유닛.닫는시);
  if (시간 <= 유닛.참는시간) return null;
  return { 멈춤: true, 시간, 까닭: null };
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = (await import('node:assert/strict')).default;
  const 글 = [
    '2026-10-10 18:44\t1번\t한 일',
    '2026-10-07 08:08\t2번\t한 일',
    '2026-10-11 20:58\t5번\t한 일',
  ].join('\n');

  test('마지막 소통을 뽑는다', () => {
    const t = 마지막소통(글, '1번');
    A.equal(t.getDate(), 10);
    A.equal(t.getHours(), 18);
  });
  test('줄이 없으면 null', () => { A.equal(마지막소통(글, '9번'), null); });
  test('여러 줄이면 «마지막»을 집는다', () => {
    const 둘 = '2026-10-11 09:00\t1번\t먼저\n2026-10-11 15:00\t1번\t나중';
    A.equal(마지막소통(둘, '1번').getHours(), 15);
  });

  test('🔴 근무시간 밖은 안 센다 — 밤새 지났다고 멈춘 것이 아니다', () => {
    /* 1번이 20시에 적고 다음날 8시에 재면, 깨어 있던 시간은 «21시까지 1시간 + 7시부터 1시간» = 2시간 */
    const 부터 = new Date(2026, 9, 10, 20, 0);
    const 까지 = new Date(2026, 9, 11, 8, 0);
    const h = 깨어있던시간(부터, 까지, 7, 21);
    A.ok(h > 1.9 && h < 2.1, '2시간이어야 하는데 ' + h);
  });
  test('5번은 24시간이라 밤도 센다', () => {
    const 부터 = new Date(2026, 9, 10, 20, 0);
    const 까지 = new Date(2026, 9, 11, 8, 0);
    A.ok(깨어있던시간(부터, 까지, 0, 24) > 11.9);
  });

  test('참는 시간 안쪽은 안 잡는다', () => {
    const 유닛 = { 이름: '1번', 여는시: 7, 닫는시: 21, 참는시간: 3 };
    const 마지막 = new Date(2026, 9, 11, 14, 0);
    A.equal(멈췄나(마지막, new Date(2026, 9, 11, 16, 0), 유닛), null);
  });
  test('🔴 참는 시간을 넘으면 잡는다', () => {
    const 유닛 = { 이름: '1번', 여는시: 7, 닫는시: 21, 참는시간: 3 };
    const 마지막 = new Date(2026, 9, 11, 9, 0);
    const r = 멈췄나(마지막, new Date(2026, 9, 11, 16, 0), 유닛);
    A.ok(r && r.시간 > 6.9);
  });
  test('🔴 소통 줄이 아예 없으면 잡는다', () => {
    const 유닛 = { 이름: '9번', 여는시: 7, 닫는시: 21, 참는시간: 3 };
    const r = 멈췄나(null, new Date(), 유닛);
    A.ok(r && r.까닭);
  });
  test('⛔ 3·4·6번은 보지 않는다 — 사장님이 「다신 기재하지마」 하셨다', () => {
    A.equal(유닛들.filter((u) => ['3번', '4번', '6번'].includes(u.이름)).length, 0);
  });
}

const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  await 자가시험();
} else if (내가실행됐다) {
  const 파일 = 'docs/매시소통.tsv';
  if (!fs.existsSync(파일)) {
    console.log('⬜ ' + 파일 + ' 이 없다 — 못 쟀다');
    process.exit(0);
  }
  const 글 = fs.readFileSync(파일, 'utf8');
  const 지금 = new Date();

  console.log('■ 유닛이 «몇 시간째» 소통을 멈췄나');
  console.log('   사장님: 「모든 팀원은 1시간에 한 번씩 U2와 소통하라」');
  console.log('   지금 ' + 지금.toLocaleString('ko-KR') + ' · 근무시간 밖은 안 센다');
  console.log('');

  const 멈춘것 = [];
  for (const 유닛 of 유닛들) {
    const 마지막 = 마지막소통(글, 유닛.이름);
    const r = 멈췄나(마지막, 지금, 유닛);
    const 적을때 = 마지막 ? 마지막.toLocaleString('ko-KR') : '(한 줄도 없다)';
    if (!r) {
      console.log('   ✅ ' + 유닛.이름 + '   마지막 ' + 적을때);
      continue;
    }
    멈춘것.push({ 유닛, r, 적을때 });
    const 몇 = r.시간 === null ? r.까닭 : '깨어 있던 시간으로 ' + r.시간.toFixed(1) + '시간째';
    console.log('   🔴 ' + 유닛.이름 + '   마지막 ' + 적을때 + '  — ' + 몇);
  }

  console.log('');
  if (!멈춘것.length) {
    console.log('✅ 멈춘 유닛이 없다');
    process.exit(0);
  }
  console.log('🔴 멈춘 유닛 ' + 멈춘것.length + '개');
  console.log('   ⚠ 이 자는 «왜» 멈췄는지 모른다 — 세션이 안 열렸을 수도, 다른 일을 하고 있을 수도 있다.');
  console.log('      「소통 줄이 없다」와 「일을 안 했다」는 다른 말이다. ⛔ 섞어 읽지 않는다.');
  console.log('   ✅ 할 일 — 세션간 메모에 그 유닛 앞으로 적고, 하루를 넘기면 사장님께 수로 올린다.');
  process.exit(1);
}
