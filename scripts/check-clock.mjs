/**
 * 우리가 **적는 시각**이 실제와 맞는지 잰다.
 *
 * 왜 이게 필요한가 — 2026-08-07 에 1번이 잡았다: 「우리가 적는 시각이 실제보다 최대 111분 앞선다」.
 * 재 보니 **2번(나)이 제일 심했다.** 「16:2x」라고 적은 것이 실제로는 **14:29** 였다.
 *
 * 왜 그렇게 됐나
 *   예약(cron)이 「매시 :25」에 뜨면 그 :25 를 보고 시각을 **짐작해서** 적었다.
 *   한 번 어긋난 뒤로는 내가 앞서 적은 것을 보고 또 적어 **점점 벌어졌다.**
 *   ⛔ 시계를 읽지 않고 시각을 적으면 이렇게 된다. **짐작하지 않는다. 읽는다.**
 *
 * 무엇을 재는가
 *   ① PC 시계가 바깥 시계와 맞는가 (우리 서버가 주는 Date 머리)
 *   ② 메모 꼬리의 `[진행] N번 HH:MM` 이 **그 줄을 넣은 커밋 시각**과 맞는가
 *
 * 쓰는 법
 *   node scripts/check-clock.mjs            지금 시각을 바르게 찍어 준다 + 어긋난 곳을 센다
 *   node scripts/check-clock.mjs --selftest
 */
import { execFileSync } from 'node:child_process';

export const 봐줄분 = 20; // 20분까지는 「그 무렵」으로 본다. 그 이상은 어긋난 것이다

/** `HH:MM` 또는 `HH:MX`(10분 단위 뭉뚱그림) 를 분으로. 못 읽으면 null */
export function 분으로(글) {
  const m = String(글).match(/^(\d{1,2}):(\d)(\d|x|X)$/);
  if (!m) return null;
  const 시 = Number(m[1]);
  if (시 > 23) return null;
  const 십분 = Number(m[2]);
  // `14:2x` 는 14:20~14:29 다. 가운데인 14:25 로 잡는다
  const 분 = m[3] === 'x' || m[3] === 'X' ? 십분 * 10 + 5 : 십분 * 10 + Number(m[3]);
  return 시 * 60 + 분;
}

/** 하루를 넘어가는 것을 감안해 두 시각의 벌어짐을 분으로 준다 (0~720) */
export function 벌어짐(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, 1440 - d);
}

export function 어긋났나(적은것, 실제것, 한계 = 봐줄분) {
  const a = 분으로(적은것);
  if (a === null) return null;
  const 차 = 벌어짐(a, 실제것);
  return { 차, 어긋났다: 차 > 한계, 앞섰다: a > 실제것 };
}

/** `2026-08-07 14:29` 처럼, 지금을 **읽어서** 준다. 짐작하지 않는다. */
export function 지금(때 = new Date()) {
  const 둘 = (n) => String(n).padStart(2, '0');
  return `${때.getFullYear()}-${둘(때.getMonth() + 1)}-${둘(때.getDate())} ${둘(때.getHours())}:${둘(때.getMinutes())}`;
}

/* ── 스스로 검사 ───────────────────────────────────────────────────── */

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 봄 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `\n   본 것 ${JSON.stringify(본것)}\n   바란 것 ${JSON.stringify(바란것)}`}`);
  };
  봄('14:29 를 분으로', 분으로('14:29'), 14 * 60 + 29);
  봄('14:2x 는 그 십분의 가운데', 분으로('14:2x'), 14 * 60 + 25);
  봄('9:05 처럼 한 자리 시도 읽는다', 분으로('9:05'), 9 * 60 + 5);
  봄('25시는 없다', 분으로('25:00'), null);
  봄('시각이 아니면 null', 분으로('오후'), null);
  봄('자정을 넘는 벌어짐은 짧은 쪽으로', 벌어짐(23 * 60 + 55, 5), 10);
  봄('⛔ 111분 앞선 것을 잡는다', 어긋났나('16:2x', 14 * 60 + 29).어긋났다, true);
  // 16:2x 는 16:25 로 잡으므로 14:29 와의 벌어짐은 116분이다.
  // ⚠ 1번은 「최대 111분」이라 했는데 그건 16:20 기준이다. 뭉뚱그린 시각은 가운데로 잡는 것이 맞다
  봄('116분이 맞게 나온다', 어긋났나('16:2x', 14 * 60 + 29).차, 116);
  봄('앞선 것을 앞섰다고 한다', 어긋났나('16:2x', 14 * 60 + 29).앞섰다, true);
  봄('20분 안이면 봐준다', 어긋났나('14:4x', 14 * 60 + 29).어긋났다, false);
  봄('지금()은 읽은 대로 찍는다', 지금(new Date(2026, 7, 7, 14, 29)), '2026-08-07 14:29');

  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

/* ── 실제로 재기 ───────────────────────────────────────────────────── */

const 이제 = new Date();
console.log(`지금은 **${지금(이제)}** 입니다. 이 값을 그대로 쓰십시오.\n`);

// ① PC 시계가 바깥과 맞는가
try {
  const r = await fetch('https://seoulmarkets.com/', { method: 'HEAD' });
  const 바깥 = new Date(r.headers.get('date'));
  const 차초 = Math.round(Math.abs(바깥 - 이제) / 1000);
  console.log(
    차초 <= 120
      ? `✅ PC 시계가 바깥 시계와 맞습니다 (${차초}초 차)`
      : `⛔ PC 시계가 바깥과 ${Math.round(차초 / 60)}분 어긋났습니다 — 시계부터 맞추십시오`
  );
} catch {
  console.log('⬜ 바깥 시계를 못 읽었습니다 (인터넷). PC 시계만 씁니다');
}

// ② 우리가 적은 시각이 커밋 시각과 맞는가
const 줄들 = execFileSync('git', ['log', '-40', '--date=format:%H:%M', '--pretty=format:%ad\t%s'], {
  cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  encoding: 'utf8',
}).split('\n');

let 잰개수 = 0;
const 어긋난것 = [];
for (const 줄 of 줄들) {
  const [때, 제목 = ''] = 줄.split('\t');
  const 적은것 = (제목.match(/(\d{1,2}:\d[\dxX])/) || [])[1];
  if (!적은것 || !때) continue;
  const 실제 = 분으로(때);
  if (실제 === null) continue;
  잰개수++;
  const r = 어긋났나(적은것, 실제);
  if (r?.어긋났다) 어긋난것.push({ 적은것, 실제: 때, 차: r.차, 앞섰다: r.앞섰다, 제목: 제목.slice(0, 60) });
}

console.log(`\n최근 커밋 ${잰개수}개에 적힌 시각을 실제 커밋 시각과 맞춰 봤습니다.`);
if (!어긋난것.length) {
  console.log('✅ 어긋난 곳이 없습니다');
} else {
  console.log(`⛔ ${어긋난것.length}개가 ${봐줄분}분 넘게 어긋났습니다\n`);
  for (const x of 어긋난것) {
    console.log(`   적음 ${x.적은것}  실제 ${x.실제}  ${x.앞섰다 ? '앞섰다' : '늦었다'} ${x.차}분  ${x.제목}`);
  }
  console.log('\n⛔ 예약이 뜬 시각(:05·:25)을 보고 시각을 짐작하지 마십시오. **시계를 읽으십시오.**');
}
process.exit(어긋난것.length ? 1 : 0);
