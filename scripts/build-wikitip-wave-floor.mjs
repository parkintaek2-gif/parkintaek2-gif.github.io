/**
 * build-wikitip-wave-floor.mjs — 92편. **파도가 지나간 자리에 무엇이 남는가.**
 *
 * ── 물음 ───────────────────────────────────────────────────────
 * 한국 작품 하나가 뜨면 동남아 백과사전이 그 문서로 찬다. 오징어게임은 2025년 1월에
 * 백만분율 2046 이었다 — 그 앞 여섯 달 바닥의 **서른다섯 배**다.
 * ⭐ 그 파도가 지나간 뒤, **바닥은 전보다 높은가.**
 *   높으면 작품 하나가 관심의 밑바탕을 올린 것이고,
 *   같으면 파도는 왔다 갈 뿐 아무것도 남기지 않은 것이다.
 *
 * ── ⛔ 이 자가 스스로 막는 것 ─────────────────────────────────
 * ⛔ **묶음 평균을 앞세우지 않는다.** 같은 자료가 평균 +88.7%, 중앙값 −29.1% 로 갈렸다.
 *    문서 하나가 묶음을 끌면 평균은 그 문서 이야기지 묶음 이야기가 아니다.
 * ⛔ **덜 찬 마지막 달을 안 쓴다.** 2026-07 이 평소의 백분의 이로 왔다.
 * ⛔ **뒤바닥 안에 두 번째 파도가 있으면 「바닥이 올랐다」로 안 읽는다.**
 *    오징어게임의 +366% 가 그것이었다 — 시즌 3 이 바닥 자리에 들어앉아 있었다.
 * ⛔ **앞바닥이 얇으면 배수를 말하지 않는다.** 1.3 에서 2.4 로 간 것을 +82.7% 라 하지 않는다.
 * ⛔ **못 잰 것을 감추지 않는다.** 스무 편 중 다섯 편만 말할 수 있다. 나머지 열다섯의
 *    까닭을 그대로 낸다 — 그것이 이 자료의 성질이다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-wave-floor.mjs
 *   node scripts/build-wikitip-wave-floor.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';
import { 파도재기, 얇은가, 얇음문턱, 또파도문턱 } from './collect-sea-title-waves.mjs';
/**
 * ⚠ **되돌아 참조다.** `build-wikitip-one-out.mjs` 가 이 파일에서 `중앙값`·`한자리`를
 *   가져가고, 이 파일이 거기서 `하나빼기`를 가져온다. ESM 은 이 꼴을 견딘다 —
 *   둘 다 함수 선언이라 부를 때는 이미 서 있다.
 * ⛔ 여기서 값(상수)을 가져오면 안 된다. 그건 아직 안 만들어져 있을 수 있다.
 */
import { 하나빼기, 단단한가 } from './build-wikitip-one-out.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** ⭐ 소수 첫째 자리까지 */
export const 한자리 = (v) => (v == null ? null : +v.toFixed(1));

/** ⭐ 중앙값. **평균보다 이것을 앞세운다** — 하나가 끌지 못한다 */
export function 중앙값(값들) {
  if (!값들.length) return null;
  const 줄 = [...값들].sort((a, b) => a - b);
  const n = 줄.length;
  return n % 2 ? 줄[(n - 1) / 2] : (줄[n / 2 - 1] + 줄[n / 2]) / 2;
}

export function 평균(값들) {
  if (!값들.length) return null;
  return 값들.reduce((a, b) => a + b, 0) / 값들.length;
}

/**
 * 한 작품의 달별 백만분율(네 판 합). **한 판이라도 빈 달은 그 달을 통째로 뺀다.**
 *
 * ⛔ 판마다 있고 없고가 다르므로, 있는 판만 더하되 **있는 판이 그달에 비면** null 로 둔다.
 *   0 으로 메우면 「그 판에서 아무도 안 봤다」가 되는데 그건 「못 받았다」와 다른 말이다.
 */
export function 달별합(줄, 밑값, 판들, 달들) {
  const 표 = {};
  for (const m of 달들) {
    let 합 = 0;
    let 잰판 = 0;
    let 빈칸 = false;
    for (const p of 판들) {
      if (!줄.views[p]) continue;
      잰판 += 1;
      const v = 줄.views[p][m];
      const 밑 = 밑값[p]?.[m];
      if (v == null || 밑 == null || 밑 === 0) { 빈칸 = true; break; }
      합 += (1e6 * v) / 밑;
    }
    표[m] = (잰판 > 0 && !빈칸) ? 합 : null;
  }
  return 표;
}

/**
 * ⭐ **말할 수 있는 것과 없는 것을 가른다.**
 * ⛔ 못 재는 까닭을 버리지 않는다 — 그것이 자료의 성질이고, 기사에 그대로 나간다.
 */
export function 갈라내기(잰것들) {
  const 말할수있는 = [];
  const 못말하는 = [];
  for (const r of 잰것들) {
    if (!r.wave) { 못말하는.push({ title: r.title, why: 'not enough months in the four editions' }); continue; }
    /**
     * ⛔ **「문서가 그때 생겼다」를 「창이 짧다」로 적지 않는다.** 창을 늘려도 안 풀린다.
     *   신작은 이 물음 자체를 받을 수 없다 — 파도 전 바닥이 세상에 없다.
     */
    if (!r.wave.comparable) {
      못말하는.push({
        title: r.title,
        why: (r.birth?.bornInWindow && /start of the window/.test(r.wave.why)) ? r.birth.why : r.wave.why,
        peakMonth: r.wave.peakMonth,
        articleFirstSeen: r.birth?.firstMonth ?? null,
      });
      continue;
    }
    if (r.wave.afterIsFloor.isFloor === false) {
      못말하는.push({ title: r.title,
        why: 'a second wave sits where the floor should be',
        peakMonth: r.wave.peakMonth,
        peakOverFloor: r.wave.peakOverBeforeFloor,
        secondWaveMonths: r.wave.afterIsFloor.monthsAboveThreshold,
        /**
         * ⭐ **어떻게 보였는지를 같이 낸다.** 이 수는 **쓰면 안 되는 수**지만,
         *   「이렇게 보였고 그래서 안 썼다」를 말하려면 자료에 있어야 한다.
         * ⛔ 이름에 `Misleading` 을 박아 둔다 — 무심코 집어 쓰지 못하게.
         */
        misleadingFloorChangePc: r.wave.floorChangePc,
      });
      continue;
    }
    if (r.wave.beforeFloorIsThin) {
      못말하는.push({ title: r.title, why: `the floor before the wave was only ${r.wave.beforeFloor} per million, `
        + 'too thin for a percentage to mean anything', peakMonth: r.wave.peakMonth });
      continue;
    }
    말할수있는.push(r);
  }
  return { 말할수있는, 못말하는 };
}

/**
 * ⛔⛔ **창이 짧으면 창 안의 최고가 봉우리인 척한다.**
 *
 * 🔴 8/15 — 48 달 창으로 92편을 내고 나서 72 달로 다시 받아 보니
 *   **여섯 편의 봉우리가 달라졌다.**
 * ```
 *   Squid Game          2025-01 (2046)  →  2021-10 (2440)     시즌 1 이 진짜 봉우리였다
 *   All of Us Are Dead  2025-07  (186)  →  2022-02 (1268)     일곱 배
 *   Vincenzo            2024-04  (158)  →  2021-06  (772)     다섯 배
 * ```
 *   ⛔ 92편 표에 실린 다섯 편 중 셋이 **가짜 봉우리**였다. 창 밖에 더 큰 것이 있었다.
 *
 * ⭐ 창 밖은 자로 못 본다. 막을 길은 **창을 넉넉히 잡는 것**뿐이고, 그래도 남는 위험은
 *   **적어 두는 것**이다. 봉우리가 창 가장자리에서 몇 달 안쪽이면 표시한다 —
 *   그런 봉우리는 「창 안의 최고」일 뿐 진짜 최고가 아닐 수 있다.
 * ⚠ 이건 걸러 내는 자가 아니라 **적어 두는 자**다. 걸러 내면 창 끝의 진짜 봉우리도 버린다.
 */
export const 가장자리달 = 6;

/**
 * ⛔⛔⛔ **신작에는 「파도 전 바닥」이 없다. 문서가 작품과 함께 생기기 때문이다.**
 *
 * 🔴 8/15 — 창을 72 달로 늘렸더니 오징어게임이 「봉우리가 창 시작에 붙었다」로 빠졌다.
 *   까닭을 열어 보니 창 시작이 문제가 아니었다 — **문서가 2021-09 에 생겼다.**
 *   그 앞 열세 달은 「조회가 적었던 달」이 아니라 **문서가 없던 달**이다.
 * ```
 *   Squid Game   창 2020-08 시작 · 문서 2021-09 생김 · 봉우리 2021-10
 *                → 파도 전 바닥으로 쓸 달이 하나뿐이다
 * ```
 *   ⛔ 그러면 창을 아무리 늘려도 이 물음을 **신작에는 못 던진다.** 창의 문제가 아니라
 *     물음의 문제다. 남는 것은 **이미 있던 작품이 다시 뜬 경우**뿐이다.
 *
 * ⭐ 그래서 「문서가 창 안에서 생겼나」를 따로 잰다. 「달이 모자라다」와 뜻이 아주 다르다 —
 *   앞은 **우리가 못 받은 것**이고, 뒤는 **세상에 없던 것**이다.
 */
export function 창안에서생겼나(달값, 달들) {
  const 있는달 = Object.entries(달값).filter(([, v]) => v != null).map(([m]) => m).sort();
  if (!있는달.length) return { bornInWindow: null, why: 'no month could be measured at all' };
  const 첫달 = 있는달[0];
  if (첫달 === 달들[0]) return { bornInWindow: false, firstMonth: 첫달 };
  return {
    bornInWindow: true,
    firstMonth: 첫달,
    monthsBefore: 달들.indexOf(첫달),
    why: 'the article did not exist for the first part of the window, so there is no floor '
      + 'from before the title arrived — a new title cannot be asked this question at all',
  };
}

export function 창가장자리인가(봉우리달, 달들, 문턱 = 가장자리달) {
  const i = 달들.indexOf(봉우리달);
  if (i < 0) return null;
  const 앞에서 = i;
  const 뒤에서 = 달들.length - 1 - i;
  if (앞에서 >= 문턱 && 뒤에서 >= 문턱) return null;
  return {
    monthsFromStart: 앞에서,
    monthsFromEnd: 뒤에서,
    why: 앞에서 < 문턱
      ? 'the peak is near the start of the window, so a larger one may sit outside it'
      : 'the peak is near the end of the window, so a larger one may still be coming',
  };
}

/**
 * ⛔⛔ **봉우리가 몇 달에 몰려 있으면 우리가 잰 것은 작품이 아니다.**
 *
 * 🔴 8/15 — 잰 다섯 편의 봉우리가 2024-04 에 둘, 2025-01·02 에 둘이었다.
 *   작품마다 다른 때에 떴다면 「작품 하나의 파도」를 잰 것이지만, 몇 달에 몰려 있다면
 *   **그 몇 달에 네 판에서 무슨 일이 있었던 것**일 수 있다. 백만분율은 판 전체를 나누지만
 *   「한국 드라마 전반의 유행」은 나누지 않는다.
 * ⭐ 그래서 몰림을 재서 기사에 그대로 싣는다. 숨기면 「작품 파도」라는 말이 거짓이 된다.
 *
 * ⚠ 이웃한 달은 한 덩어리로 본다 — 2025-01 과 2025-02 는 같은 일의 앞뒤일 수 있다.
 */
export function 봉우리몰렸나(봉우리달들) {
  if (!봉우리달들.length) return null;
  const 달수로 = (m) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7));
  const 줄 = [...new Set(봉우리달들)].map(달수로).sort((a, b) => a - b);
  /* 이웃한 달(한 달 차이)을 한 덩어리로 묶는다 */
  const 덩어리 = [];
  for (const v of 줄) {
    const 끝 = 덩어리.at(-1);
    if (끝 && v - 끝.at(-1) <= 1) 끝.push(v); else 덩어리.push([v]);
  }
  const 되돌림 = (v) => `${Math.floor((v - 1) / 12)}-${String(((v - 1) % 12) + 1).padStart(2, '0')}`;
  return {
    peaks: 봉우리달들.length,
    distinctMonths: 줄.length,
    clusters: 덩어리.length,
    largestCluster: Math.max(...덩어리.map((c) => c.length)),
    clusterMonths: 덩어리.map((c) => c.map(되돌림)),
  };
}

/**
 * 🔴🔴 **`--selftest` 만 보고 돌면 안 된다. 남의 자가시험을 가로챈다.**
 *   8/15 — 이 자를 import 하는 빌더를 `--selftest` 로 돌렸더니 **이 자가 그 argv 를
 *   제 것으로 알고** 제 자가시험을 돌린 뒤 `process.exit` 했다. 부르는 쪽 자가시험은
 *   **한 줄도 안 돌았는데** 화면엔 「✅ 전부 통과」가 떴다. 셈은 맞고 뜻이 틀렸다.
 * ⛔ 내가 직접 실행됐을 때만 돈다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  /* 🔴 봉우리가 몰려 있으면 우리가 잰 것은 작품이 아니라 그 몇 달이다 */
  참('⛔ 흩어진 봉우리는 덩어리가 여럿이다',
    봉우리몰렸나(['2023-01', '2024-06', '2025-11']).clusters === 3);
  참('⭐ 이웃한 달은 한 덩어리다',
    봉우리몰렸나(['2025-01', '2025-02']).clusters === 1);
  참('한 덩어리에 몇이 들었는지 낸다',
    봉우리몰렸나(['2025-01', '2025-02', '2023-05']).largestCluster === 2);
  참('⛔ 같은 달이 겹쳐도 한 번만 센다',
    봉우리몰렸나(['2024-04', '2024-04']).distinctMonths === 1);
  참('봉우리 수는 그대로 센다', 봉우리몰렸나(['2024-04', '2024-04']).peaks === 2);
  참('해를 넘어도 이웃으로 본다',
    봉우리몰렸나(['2024-12', '2025-01']).clusters === 1);
  참('덩어리마다 달을 그대로 낸다',
    봉우리몰렸나(['2025-01', '2025-02']).clusterMonths[0].join(',') === '2025-01,2025-02');
  참('⛔ 빈 목록은 null', 봉우리몰렸나([]) === null);

  /* 🔴 48 달 창이 여섯 편의 봉우리를 잘못 잡았다. 창 밖은 자로 못 본다 — 적어 둔다 */
  const 달들 = Array.from({ length: 24 }, (_, i) => '2024-' + String(i + 1).padStart(2, '0'));
  참('⛔ 창 시작 가까운 봉우리를 표시한다', 창가장자리인가('2024-02', 달들)?.monthsFromStart === 1);
  참('⛔ 창 끝 가까운 봉우리도 표시한다', 창가장자리인가('2024-23', 달들)?.monthsFromEnd === 1);
  참('⭐ 가운데 봉우리는 표시하지 않는다', 창가장자리인가('2024-12', 달들) === null);
  참('까닭이 앞뒤로 다르다',
    /outside it/.test(창가장자리인가('2024-02', 달들).why)
    && /still be coming/.test(창가장자리인가('2024-23', 달들).why));
  참('⛔ 창에 없는 달은 null', 창가장자리인가('1999-01', 달들) === null);

  /**
   * 🔴🔴 **신작에는 파도 전 바닥이 없다.** 문서가 작품과 함께 생기기 때문이다.
   *   「우리가 못 받았다」와 「세상에 없었다」는 다른 말이고, 기사에서 다르게 적어야 한다.
   */
  const 창달 = ['2024-01', '2024-02', '2024-03', '2024-04'];
  참('⭐ 창 첫 달부터 있으면 창 안에서 생긴 것이 아니다',
    창안에서생겼나({ '2024-01': 5, '2024-02': 6, '2024-03': 7, '2024-04': 8 }, 창달).bornInWindow === false);
  참('⛔ 창 도중에 생긴 문서를 잡는다',
    창안에서생겼나({ '2024-01': null, '2024-02': null, '2024-03': 7, '2024-04': 8 }, 창달).bornInWindow === true);
  참('언제 생겼는지 적는다',
    창안에서생겼나({ '2024-01': null, '2024-02': null, '2024-03': 7, '2024-04': 8 }, 창달).firstMonth === '2024-03');
  참('앞에 몇 달이 비었는지 적는다',
    창안에서생겼나({ '2024-01': null, '2024-02': null, '2024-03': 7, '2024-04': 8 }, 창달).monthsBefore === 2);
  참('⛔ 아무 달도 못 재면 그렇게 적는다',
    창안에서생겼나({ '2024-01': null }, 창달).bornInWindow === null);
  참('⭐ 「못 받았다」와 「없었다」를 다른 말로 낸다',
    /did not exist/.test(창안에서생겼나({ '2024-01': null, '2024-02': null, '2024-03': 7, '2024-04': 8 }, 창달).why));

  참('중앙값 — 홀수', 중앙값([3, 1, 2]) === 2);
  참('중앙값 — 짝수', 중앙값([1, 2, 3, 4]) === 2.5);
  참('⛔ 빈 목록은 null', 중앙값([]) === null);
  /* ⭐ 이 자가 평균보다 중앙값을 앞세우는 까닭 */
  참('⭐ 하나가 튀면 평균은 끌려가고 중앙값은 안 끌려간다',
    평균([1, 2, 3, 400]) > 100 && 중앙값([1, 2, 3, 400]) === 2.5);

  const 밑 = { id: { a: 1e6, b: 1e6 }, vi: { a: 1e6, b: 1e6 } };
  참('두 판을 더한다',
    달별합({ views: { id: { a: 10, b: 5 }, vi: { a: 20, b: 5 } } }, 밑, ['id', 'vi'], ['a'])['a'] === 30);
  참('⛔ 한 판이 그달에 비면 그 달을 통째로 뺀다',
    달별합({ views: { id: { a: 10 }, vi: { a: null } } }, 밑, ['id', 'vi'], ['a'])['a'] === null);
  참('⛔ 없는 판은 세지 않는다 — 있는 판만 더한다',
    달별합({ views: { id: { a: 10 } } }, 밑, ['id', 'vi'], ['a'])['a'] === 10);
  참('⛔ 어느 판에도 없으면 null',
    달별합({ views: {} }, 밑, ['id', 'vi'], ['a'])['a'] === null);
  참('⛔ 밑값이 0 이면 안 나눈다',
    달별합({ views: { id: { a: 10 } } }, { id: { a: 0 } }, ['id'], ['a'])['a'] === null);

  /* ⭐ 갈라내기 — 못 재는 까닭 넷을 다 다른 말로 낸다 */
  const 갈 = 갈라내기([
    { title: 'A', wave: { comparable: true, beforeFloor: 50, beforeFloorIsThin: false, afterIsFloor: { isFloor: true } } },
    { title: 'B', wave: null },
    { title: 'C', wave: { comparable: false, why: 'the peak sits too close to the end of the window', peakMonth: '2026-05' } },
    { title: 'D', wave: { comparable: true, beforeFloor: 58, beforeFloorIsThin: false, peakMonth: '2025-01', floorChangePc: 366.3, afterIsFloor: { isFloor: false, monthsAboveThreshold: [{ month: '2025-06' }] } } },
    { title: 'E', wave: { comparable: true, beforeFloor: 1.3, beforeFloorIsThin: true, peakMonth: '2024-03', afterIsFloor: { isFloor: true } } },
  ]);
  참('말할 수 있는 것만 남긴다', 갈.말할수있는.length === 1 && 갈.말할수있는[0].title === 'A');
  참('⛔ 못 말하는 것을 버리지 않는다', 갈.못말하는.length === 4);
  참('⛔ 까닭이 저마다 다르다', new Set(갈.못말하는.map((x) => x.why)).size === 4);
  참('두 번째 파도는 걸린 달을 같이 낸다',
    갈.못말하는.find((x) => x.title === 'D').secondWaveMonths[0].month === '2025-06');
  /* ⭐ 쓰면 안 되는 수도 자료에 남긴다 — 「이렇게 보였고 그래서 안 썼다」를 말하려면 있어야 한다 */
  참('⭐ 오해를 부르는 수를 이름에 표시해 남긴다',
    갈.못말하는.find((x) => x.title === 'D').misleadingFloorChangePc === 366.3);
  참('⛔ 말할 수 있는 것에는 그 이름이 안 붙는다',
    갈.말할수있는[0].misleadingFloorChangePc === undefined);
  참('얇은 것은 얼마나 얇았는지 적는다', /1\.3 per million/.test(갈.못말하는.find((x) => x.title === 'E').why));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 원 = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive/raw/wikipedia/sea-title-waves.json'), 'utf8'));

  /**
   * ⛔ **덜 찬 마지막 달을 쓰지 않는다.** 8/15 에 2026-07 이 평소의 백분의 이로 왔다.
   * ⚠ 앞선 열두 달과 견줘 판정한다 — 「마지막이니까 뺀다」가 아니라 **작으니까 뺀다**.
   */
  /**
   * ⚠ 아래 `?? 0` 은 **정당하다.** 없는 판은 모든 달에서 똑같이 빠지고, 이 합은
   *   **달끼리 견주는 데만** 쓴다(마지막 달이 덜 찼나). 백만분율을 낼 때는 `달별합` 이
   *   못 잰 달을 null 로 둔다 — 그쪽이 진짜 셈이다.
   */
  const 달합 = Object.fromEntries(원.months.map((m) => [m,
    원.articles.reduce((a, x) => a + 원.editionsSea.reduce((b, p) => b + (x.views[p]?.[m] ?? 0), 0), 0)]));
  const 끝달 = 원.months.at(-1);
  const 앞선평 = 평균(원.months.slice(-13, -1).map((m) => 달합[m]));
  const 끝달이덜찼나 = 달합[끝달] < 앞선평 * 0.2;
  const 쓸달 = 끝달이덜찼나 ? 원.months.slice(0, -1) : 원.months;
  if (끝달이덜찼나) console.log(`⚠ ${끝달} 은 덜 찼다 (${Math.round(달합[끝달])} 대 앞선 열두 달 평균 ${Math.round(앞선평)}) — 뺀다`);

  const 잰것들 = 원.articles.map((줄) => {
    const 표 = 달별합(줄, 원.editionTotals, 원.editionsSea, 쓸달);
    const 있는판 = 원.editionsSea.filter((p) => 줄.views[p]);
    return {
      title: 줄.titleEn,
      editionsWithArticle: 있는판.length,
      editions: 있는판,
      wave: 파도재기(표),
      /* ⛔ 「우리가 못 받았다」와 「세상에 없었다」를 가른다 */
      birth: 창안에서생겼나(표, 쓸달),
      /* 지면이 줄을 그릴 수 있게 달별 값을 그대로 낸다 */
      byMonth: Object.fromEntries(Object.entries(표).map(([m, v]) => [m, 한자리(v)])),
    };
  });

  const { 말할수있는, 못말하는 } = 갈라내기(잰것들);

  const 바닥변화들 = 말할수있는.map((r) => r.wave.floorChangePc);
  const 봉우리배수들 = 말할수있는.map((r) => r.wave.peakOverBeforeFloor);
  const 오른것 = 말할수있는.filter((r) => r.wave.floorChangePc > 0);

  /* ⭐ 자료에서 가장 큰 파도 — 말할 수 있든 없든 */
  const 가장큰파도 = 잰것들
    .filter((r) => r.wave && r.wave.comparable && r.wave.peakOverBeforeFloor != null)
    .sort((a, b) => b.wave.peakOverBeforeFloor - a.wave.peakOverBeforeFloor)[0] ?? null;

  const 나감 = {
    generated: 오늘(),
    question: 'A Korean title lands, the encyclopaedia fills with it, and then it empties again. '
      + 'When the wave has passed, is the floor higher than it was before it arrived?',
    window: `${쓸달[0]} through ${쓸달.at(-1)}, ${쓸달.length} months`,
    droppedLastMonth: 끝달이덜찼나 ? { month: 끝달, value: 한자리(달합[끝달]), previousTwelveMean: 한자리(앞선평) } : null,
    editions: 원.editionsSea,
    editionNames: 원.editionNames,
    unit: 원.unit,
    method: {
      floorMonths: 원.floorMonths,
      waveMonths: 원.waveMonths,
      thinFloorBelow: 얇음문턱,
      secondWaveAbove: 또파도문턱,
      note: 'For each title we find its highest month, then average the six months before it and '
        + 'the six after, skipping two months either side of the peak because those are still the '
        + 'wave. A title is only reported if both sides fit inside the window, if the floor before '
        + 'the wave is thick enough for a percentage to mean anything, and if no month in the '
        + 'after-floor is more than three times the before-floor — that last one is a second wave, '
        + 'not a floor.',
    },
    titlesMeasured: 말할수있는.map((r) => ({
      title: r.title,
      editions: r.editionsWithArticle,
      peakMonth: r.wave.peakMonth,
      peak: r.wave.peak,
      peakOverFloor: r.wave.peakOverBeforeFloor,
      beforeFloor: r.wave.beforeFloor,
      afterFloor: r.wave.afterFloor,
      floorChangePc: r.wave.floorChangePc,
      /* ⛔ 이 봉우리가 창 안의 최고일 뿐일 수 있다 — 걸러 내지 않고 적어 둔다 */
      nearWindowEdge: 창가장자리인가(r.wave.peakMonth, 쓸달),
    })).sort((a, b) => b.floorChangePc - a.floorChangePc),
    titlesNotMeasured: 못말하는,

    /** ⭐ 답. **중앙값을 앞세운다** — 평균은 하나에 끌린다 */
    answer: {
      measured: 말할수있는.length,
      outOf: 잰것들.length,
      floorChangeMedianPc: 한자리(중앙값(바닥변화들)),
      floorChangeMeanPc: 한자리(평균(바닥변화들)),
      peakOverFloorMedian: 한자리(중앙값(봉우리배수들)),
      floorsThatRose: 오른것.length,
      /**
       * ⭐ **94편에서 만든 자.** 이 답이 오늘 두 번 움직인 자리다 —
       *   5편일 때 0.89배, 6편일 때 1.4배, 9편일 때 2.86배.
       *   ⛔ 「흔들린다」는 「틀렸다」가 아니다. 그 말은 판정에 붙어 나온다.
       */
      stability: (() => {
        const 잼 = 하나빼기(바닥변화들);
        return 잼 ? { ...잼, verdict: 단단한가(잼) } : null;
      })(),
      biggestWave: 가장큰파도 ? {
        title: 가장큰파도.title,
        peakMonth: 가장큰파도.wave.peakMonth,
        peakOverFloor: 가장큰파도.wave.peakOverBeforeFloor,
        reportable: 가장큰파도.wave.afterIsFloor.isFloor === true && !가장큰파도.wave.beforeFloorIsThin,
      } : null,
    },

    /**
     * ⛔ **봉우리가 몰려 있으면 「작품 파도」라는 말 자체가 흔들린다.** 재서 그대로 낸다.
     */
    peakClustering: (() => {
      const 몰림 = 봉우리몰렸나(말할수있는.map((r) => r.wave.peakMonth));
      if (!몰림) return null;
      return {
        ...몰림,
        note: 몰림.largestCluster > 1
          ? `${몰림.peaks} peaks fall into ${몰림.clusters} clusters of neighbouring months, the `
            + `largest holding ${몰림.largestCluster} of them. If these titles had each risen in `
            + 'their own month we would be measuring titles. Sharing months means we may be '
            + 'measuring those months.'
          : 'Each title peaked in its own month, which is what measuring titles rather than '
            + 'months requires.',
      };
    })(),

    /** ⛔ 이 자료가 **못 하는 말** */
    cannotSay: [
      `We measured ${말할수있는.length} titles. That is a small number and it is the number we `
        + 'have: of the twenty we fetched, some have no article in these editions, some peaked too '
        + 'near the edge of the window to have a floor on both sides, one had a second wave sitting '
        + 'where its floor should be, and one had a floor too thin to take a percentage. Every one '
        + 'of them is listed with its reason.',
      'The titles are ones we expected to have had a wave, not the most-read Korean titles and not '
        + 'a random sample. A set chosen this way leans toward titles that travelled.',
      'A read is not a viewer. Someone opening an encyclopaedia article about a series may have '
        + 'watched it, may be deciding whether to, or may have seen the name somewhere and been '
        + 'curious. What this dates is when the looking happened.',
      'We are not saying the wave caused the floor to move, in either direction. Twelve months '
        + 'either side of a peak contain everything else that happened in those months too.',
    ],
  };

  const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-wave-floor.json');
  fs.writeFileSync(낼곳, `${JSON.stringify(나감, null, 2)}\n`);
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   창 ${쓸달[0]} ~ ${쓸달.at(-1)}`);
  console.log(`   말할 수 있는 작품 ${말할수있는.length}/${잰것들.length}`);
  console.log(`   봉우리 중앙값 ${나감.answer.peakOverFloorMedian}배 · 바닥변화 중앙값 ${나감.answer.floorChangeMedianPc}%`);
  console.log(`   바닥이 오른 것 ${오른것.length}개`);
  const 잼 = 나감.answer.stability;
  if (잼) {
    console.log(`   ⭐ 하나 빼기 — 흔들림 ${잼.swingOverMedian}배 · `
      + `${잼.verdict.steady ? '단단하다' : '🔴 아직 답이 아니다'}`);
  }
  console.log(`   가장 큰 파도 — ${가장큰파도?.title} ${가장큰파도?.wave.peakOverBeforeFloor}배 (낼 수 있나: ${나감.answer.biggestWave?.reportable})`);
}
