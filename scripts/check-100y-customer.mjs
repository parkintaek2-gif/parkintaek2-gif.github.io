/**
 * check-100y-customer.mjs — **손님 지표를 잰다** (2번 지시 2026-08-09 05:2x)
 *
 *   node scripts/check-100y-customer.mjs [일수]     기본 7일
 *   node scripts/check-100y-customer.mjs --자가시험
 *
 * ## 🔴 왜 — **우리 지표가 전부 「우리가 한 일」이었다**
 *
 *   2번 — *「지면 4,967장 · 카드 369벌 · 영상 1편 … 전부 **우리 노동량**입니다.
 *   그래서 하루 종일 일해도 「팔렸나」를 못 봅니다」*
 *
 *   ```
 *   ⛔ 우리 것   지면 몇 장 만들었나 · 카드 몇 벌 만들었나
 *   ⭐ 손님 것   지면 한 장이 몇 번 열렸나 · 몇 사람이 밖에서 들어왔나
 *   ```
 *
 * ## ⚠ 이 자가 세는 것과 안 세는 것
 *
 *   ```
 *   ✅ 센다      우리 서버 로그(R2)의 **봇 아닌** 요청. 우리 것이라 계정이 필요 없다
 *   ⛔ 못 센다   같은 사람이 여러 번 온 것을 한 사람으로 묶는 일 — 로그에 사람 표가 없다
 *                그래서 **「몇 번 열렸나」**로 적는다. ⛔ 「몇 명이 왔나」로 안 적는다
 *   ⛔ 안 센다   유튜브 조회수 — 그건 `check-youtube-100y.mjs` 가 잰다
 *   ```
 *   🔴 **「열린 횟수」와 「사람 수」를 섞지 않는다.** 오늘 반감에서 데인 자리와 같은 꼴이다.
 */
import path from 'node:path';

/** 로그 열쇠 한 줄을 푼다. `host \t 경로 \t 유입 \t 봇 \t 종류` */
export function 열쇠풀기(k) {
  const [host, 경로, 유입, 봇, 종류] = String(k).split('\t');
  return { host, 경로, 유입: 유입 || '', 봇: 봇 === '1', 종류: 종류 || null };
}

/** 백년지도 것이고 사람이 연 것만 */
export const 우리사람 = (r) => String(r.host).includes('100yearmap') && !r.봇;

/**
 * 집계 뭉치들에서 손님 지표를 낸다.
 * @param {Array<Record<string, number>>} 집계들 날짜별 집계
 */
export function 재기(집계들) {
  const 경로별 = new Map();
  const 유입별 = new Map();
  let 사람 = 0, 봇 = 0, 밖 = 0;
  for (const 집계 of 집계들) {
    for (const [k, n] of Object.entries(집계 ?? {})) {
      const r = 열쇠풀기(k);
      if (!String(r.host).includes('100yearmap')) continue;
      if (r.봇) { 봇 += n; continue; }
      사람 += n;
      경로별.set(r.경로, (경로별.get(r.경로) ?? 0) + n);
      if (r.유입) 유입별.set(r.유입, (유입별.get(r.유입) ?? 0) + n);
      /**
       * 🔴 **「(직접)」과 「(내부)」는 밖이 아니다.**
       *   처음에 유입 칸이 있는 것을 전부 더했더니 **밖에서 온 것 = 열린 횟수**가 나왔다.
       *   그 수를 그대로 적었으면 「6일 동안 밖에서 1만 번 들어왔다」가 됐을 것이다.
       *   ⛔ 실제로 밖에서 온 것은 **네 번**이다.
       */
      if (r.유입 && r.유입 !== '(직접)' && r.유입 !== '(내부)') 밖 += n;
    }
  }

  return {
    열린횟수: 사람,
    봇횟수: 봇,
    열린지면수: 경로별.size,
    밖에서온것: 밖,
    유입별: [...유입별.entries()].sort((a, b) => b[1] - a[1]),
    많이열린것: [...경로별.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 본다 = (이름, 됐나) => { if (됐나) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}`); } };
  const ㅋ = (host, 경로, 유입, 봇, 종류) => `${host}\t${경로}\t${유입}\t${봇}\t${종류}`;

  본다('① 열쇠를 푼다', 열쇠풀기(ㅋ('100yearmap.com', '/age/32', 'google.com', '0', '')).경로 === '/age/32');
  본다('② 봇 표를 읽는다', 열쇠풀기(ㅋ('a', '/b', '', '1', 'google')).봇 === true);

  const 하나 = 재기([{ [ㅋ('100yearmap.com', '/age/32', '', '0', '')]: 5 }]);
  본다('③ 사람 것을 센다', 하나.열린횟수 === 5 && 하나.열린지면수 === 1);

  const 봇섞임 = 재기([{
    [ㅋ('100yearmap.com', '/a', '', '0', '')]: 3,
    [ㅋ('100yearmap.com', '/a', '', '1', 'google')]: 100,
  }]);
  본다('④ 🔴 봇을 사람에 안 더한다', 봇섞임.열린횟수 === 3 && 봇섞임.봇횟수 === 100);

  const 남의집 = 재기([{ [ㅋ('seoulmarkets.com', '/a', '', '0', '')]: 9 }]);
  본다('⑤ 🔴 남의 사이트를 안 센다', 남의집.열린횟수 === 0);

  const 이틀 = 재기([
    { [ㅋ('100yearmap.com', '/a', '', '0', '')]: 2 },
    { [ㅋ('100yearmap.com', '/a', '', '0', '')]: 3 },
  ]);
  본다('⑥ 날짜를 합친다 (지면 수는 안 겹쳐 센다)', 이틀.열린횟수 === 5 && 이틀.열린지면수 === 1);

  const 유입 = 재기([{
    [ㅋ('100yearmap.com', '/a', 'google.com', '0', '')]: 4,
    [ㅋ('100yearmap.com', '/b', '', '0', '')]: 6,
  }]);
  본다('⑦ 밖에서 온 것만 따로 센다', 유입.밖에서온것 === 4 && 유입.열린횟수 === 10);
  본다('⑧ 빈 것이면 0 이다', 재기([]).열린횟수 === 0 && 재기([{}]).열린지면수 === 0);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 자가시험 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

const 일수 = Number(process.argv.find((a) => /^\d+$/.test(a))) || 7;
/* ⚠ 윈도에서는 절대경로를 그대로 import 하면 「protocol 'c:'」로 죽는다. 상대경로로 부른다 */
const { get } = await import('../src/lib/store.mjs');
const { 일별키 } = await import('../src/lib/traffic.mjs');
const 날짜 = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

const 집계들 = [];
let 읽은날 = 0;
for (let i = 0; i < 일수; i++) {
  const d = new Date(); d.setDate(d.getDate() - i);
  let 몸; try { 몸 = await get(일별키(날짜(d))); } catch { continue; }
  if (!몸) continue;
  집계들.push(JSON.parse(String(몸)).집계 ?? {});
  읽은날 += 1;
}

/** ⛔ **하루도 못 읽었으면 0 이 아니라 「못 쟀다」다** */
if (읽은날 === 0) {
  console.log('⬜ 못 쟀다 — 로그를 하루도 못 읽었다. 0 으로 적지 않는다');
  process.exit(1);
}

const 잰것 = 재기(집계들);
const 한장당 = 잰것.열린지면수 ? (잰것.열린횟수 / 잰것.열린지면수) : 0;
console.log(`■ 백년지도 손님 지표 — 최근 ${읽은날}일 (로그가 있는 날만)`);
console.log(`   지면이 열린 횟수      ${잰것.열린횟수.toLocaleString()}번  ⛔ 사람 수가 아니다`);
console.log(`   한 번이라도 열린 지면  ${잰것.열린지면수.toLocaleString()}장`);
console.log(`   그 지면 한 장당        ${한장당.toFixed(1)}번`);
console.log(`   밖에서 들어온 것       ${잰것.밖에서온것.toLocaleString()}번`);
console.log(`   (봇은 따로 ${잰것.봇횟수.toLocaleString()}번 — 위 수에 안 들었다)`);
if (잰것.유입별.length) {
  console.log('   어디서 왔나 —');
  for (const [d, n] of 잰것.유입별.slice(0, 6)) console.log(`     ${String(n).padStart(6)}  ${d}`);
} else {
  console.log('   ⬜ 밖에서 들어온 것이 하나도 없다 — 아직 아무 데도 안 걸렸다');
}
console.log('   많이 열린 지면 —');
for (const [p, n] of 잰것.많이열린것) console.log(`     ${String(n).padStart(6)}  ${p}`);
