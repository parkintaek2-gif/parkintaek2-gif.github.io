/**
 * cdp.mjs — 사장님 크롬(9222)에 **puppeteer 없이** 붙는다. 전 유닛 공용.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-08 · 5번] 6번이 「9222 는 응답하는데 `puppeteer.connect` 가 40초 넘게 멈춘다」고
 *   알려 왔다. 사장님이 「네가 해봐」 하셔서 재 봤다.
 *
 *   ```
 *   curl /json/version   ✅ 200 · Chrome/152.0.7977.76
 *   curl /json/list      ✅ 탭 19개 · 필요한 지면도 열려 있었다
 *   puppeteer.connect    🔴 40초+ 멈춤. 오류도 안 낸다
 *   about:blank 탭       🔴 7개가 쌓여 있었다 — 연결이 «탭만 만들고» 못 끝낸 자취
 *   ```
 *
 *   ⭐ 까닭은 **판 어긋남**이다. 크롬은 152 인데 klifemap 의 puppeteer-core 는 23.11.1 이다.
 *     프로토콜이 안 맞으면 puppeteer 는 «오류를 내지 않고 기다린다.»
 *     그래서 「연결거부」로도, 「크롬이 안 떴다」로도 안 보인다 — 그냥 멈춘 것처럼 보인다.
 *
 * ⛔ 그러니 «크롬을 다시 띄우는 것»으로는 안 풀린다. 6번이 그 길로 갔다가 막혔다.
 *   크롬은 멀쩡했다. 멈춘 것은 우리 쪽 짐이었다.
 *
 * ✅ CDP 는 웹소켓 한 줄이다. Node 20 부터 `WebSocket` 이 내장이라 남의 짐이 필요 없다.
 *   이 자로 붙으면 **5.6초**에 지면을 읽었다(같은 시각 puppeteer 는 40초 넘게 멈춰 있었다).
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────────
 *   · 언제나 «새 탭»을 만들어 쓰고, 끝나면 **그 탭만** 닫는다
 *   · 브라우저를 닫지 않는다 — 사장님이 쓰시던 창이 통째로 사라진다
 *   · 비밀번호·토큰을 **읽지도, 옮기지도 않는다.** 화면과 그 화면의 «자료»만 다룬다
 *     ⭐ 인가가 걸린 API 는 «지면이 스스로 낸 요청의 응답 몸»을 받아 쓴다(아래 `응답몸받기`).
 *       그러면 Authorization 값을 만질 일이 아예 없다.
 *
 * ── 쓰는 법 ─────────────────────────────────────────────────
 *   import { 새탭에서, 자리잡기, 재기 } from './lib/cdp.mjs';
 *   await 새탭에서('https://…', async (붙음) => {
 *     await 자리잡기(붙음);
 *     return 재기(붙음, 'document.title');
 *   });
 *
 *   node scripts/lib/cdp.mjs --자가시험    (붙지 않고 돌아가는 부분만 잰다)
 */

export const 기본뿌리 = 'http://127.0.0.1:9222';

/** 포트가 열렸나부터 잰다. ⛔ 「안 된다」고 적기 전에 이것을 먼저 본다 */
export async function 포트살았나(뿌리 = 기본뿌리, 제한 = 5000) {
  try {
    const r = await fetch(`${뿌리}/json/version`, { signal: AbortSignal.timeout(제한) });
    if (!r.ok) return { 살았나: false, 왜: `HTTP ${r.status}` };
    const j = await r.json();
    return { 살았나: true, 크롬: j.Browser, 프로토콜: j['Protocol-Version'] };
  } catch (e) {
    return { 살았나: false, 왜: e.message };
  }
}

/** 열린 탭 목록. 무엇이 이미 열려 있나를 보고 나서 움직인다 */
export async function 탭들(뿌리 = 기본뿌리) {
  const r = await fetch(`${뿌리}/json/list`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`탭 목록을 못 받았다 — HTTP ${r.status}`);
  return r.json();
}

/** 탭 하나에 붙어 CDP 명령을 주고받는 얇은 껍데기 */
export async function 탭붙기(ws주소) {
  const 소켓 = new WebSocket(ws주소);
  const 기다리는것 = new Map();
  const 사건듣기 = new Map();
  let 번호 = 0;

  await new Promise((맞다, 아니다) => {
    소켓.addEventListener('open', () => 맞다(), { once: true });
    소켓.addEventListener('error', () => 아니다(new Error('웹소켓을 못 열었다')), { once: true });
  });

  소켓.addEventListener('message', (e) => {
    let 답;
    try { 답 = JSON.parse(e.data); } catch { return; }
    if (답.id != null && 기다리는것.has(답.id)) {
      const { 맞다, 아니다 } = 기다리는것.get(답.id);
      기다리는것.delete(답.id);
      if (답.error) 아니다(new Error(`${답.error.message} (${답.error.code})`));
      else 맞다(답.result);
      return;
    }
    if (답.method && 사건듣기.has(답.method)) for (const f of 사건듣기.get(답.method)) f(답.params);
  });

  /**
   * ⚠ **제한을 반드시 둔다.** 이 자가 만들어진 까닭이 「오류 없이 멈추는 것」이다.
   *   멈추는 것보다 「몇 ms 안에 안 왔다」고 말하고 죽는 것이 낫다.
   */
  const 보내기 = (method, params = {}, 제한 = 30000) =>
    new Promise((맞다, 아니다) => {
      번호 += 1;
      const 이번 = 번호;
      기다리는것.set(이번, { 맞다, 아니다 });
      소켓.send(JSON.stringify({ id: 이번, method, params }));
      setTimeout(() => {
        if (기다리는것.has(이번)) {
          기다리는것.delete(이번);
          아니다(new Error(`${method} 가 ${제한}ms 안에 안 왔다`));
        }
      }, 제한);
    });

  const 듣기 = (method, f) => {
    if (!사건듣기.has(method)) 사건듣기.set(method, []);
    사건듣기.get(method).push(f);
  };

  return { 보내기, 듣기, 닫기: () => 소켓.close() };
}

/**
 * 새 탭을 열고, 다 쓰면 **그 탭만** 닫는다.
 * ⛔ 브라우저는 안 닫는다 — 사장님 창이 통째로 사라진다.
 * ⚠ 탭을 꼭 닫는다. 안 닫으면 `about:blank` 로 쌓인다 — 2026-09-08 에 7개를 봤다.
 */
export async function 새탭에서(주소, 하는일, { 뿌리 = 기본뿌리 } = {}) {
  const 만들기 = await fetch(`${뿌리}/json/new?${encodeURIComponent(주소)}`, { method: 'PUT' });
  if (!만들기.ok) throw new Error(`새 탭을 못 만들었다 — HTTP ${만들기.status}`);
  const 탭 = await 만들기.json();
  const 붙음 = await 탭붙기(탭.webSocketDebuggerUrl);
  try {
    await 붙음.보내기('Page.enable');
    await 붙음.보내기('Runtime.enable');
    return await 하는일(붙음, 탭);
  } finally {
    붙음.닫기();
    try { await fetch(`${뿌리}/json/close/${탭.id}`); } catch { /* 닫기 실패는 넘긴다 */ }
  }
}

/**
 * 화면이 «멎을 때까지» 기다린다 — 요청이 `조용히` ms 동안 없으면 자리잡은 것으로 본다.
 * ⛔ 무한정 안 기다린다. `최대` 를 넘기면 false 를 준다 — 그것도 결과다.
 * ⚠ `Network.enable` 을 먼저 켜야 요청 소리를 듣는다.
 */
export async function 자리잡기(붙음, { 최대 = 25000, 조용히 = 1200 } = {}) {
  const 시작 = Date.now();
  let 마지막 = Date.now();
  붙음.듣기('Page.loadEventFired', () => { 마지막 = Date.now(); });
  붙음.듣기('Network.responseReceived', () => { 마지막 = Date.now(); });
  while (Date.now() - 시작 < 최대) {
    await new Promise((r) => setTimeout(r, 200));
    if (Date.now() - 마지막 > 조용히) return true;
  }
  return false;
}

/** 그 탭에서 자바스크립트를 돌려 값을 받아 온다 */
export async function 재기(붙음, 글, 제한 = 30000) {
  const r = await 붙음.보내기('Runtime.evaluate', {
    expression: 글,
    returnByValue: true,
    awaitPromise: true,
  }, 제한);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || '화면에서 오류가 났다');
  return r.result?.value;
}

/**
 * **인가가 걸린 API 를 토큰 없이 읽는 길.**
 *
 * 지면이 스스로 부르는 요청 가운데 `무늬` 에 맞는 것의 **응답 몸**을 모은다.
 * ⭐ 2026-09-08 에 한경컨센서스가 이 꼴이었다 — `/api/v2/...` 를 밖에서 curl 로 부르면
 *   `{"message":"인가되지 않은 접근입니다."}` 였고, 탭 «안»에서 fetch 해도 같았다.
 *   성공한 요청에는 `Authorization` 머리글이 붙어 있었다.
 * ⛔ 그 값을 읽어 옮기지 않는다. 대신 **지면이 이미 받아 놓은 답**을 가져온다.
 *
 * 준 것: { 받기(요청id) , 모은것 } — `모은것` 은 Map(무늬에서 뽑은 열쇠 → 파싱한 값)
 */
export function 응답몸받기(붙음, 무늬, 열쇠뽑기 = (u) => u) {
  const 기다림 = new Map();
  const 모은것 = new Map();
  붙음.듣기('Network.requestWillBeSent', (p) => {
    const u = p.request?.url || '';
    if (무늬.test(u)) 기다림.set(p.requestId, 열쇠뽑기(u));
  });
  붙음.듣기('Network.loadingFinished', async (p) => {
    if (!기다림.has(p.requestId)) return;
    const 열쇠 = 기다림.get(p.requestId);
    기다림.delete(p.requestId);
    try {
      const r = await 붙음.보내기('Network.getResponseBody', { requestId: p.requestId }, 15000);
      const 글 = r.base64Encoded ? Buffer.from(r.body, 'base64').toString('utf8') : r.body;
      모은것.set(열쇠, JSON.parse(글));
    } catch (e) {
      /* ⛔ 못 받은 것을 «빈 값»으로 두지 않는다. 못 받았다고 적는다 */
      모은것.set(열쇠, { 못받음: e.message });
    }
  });
  return { 모은것 };
}

/**
 * 목록 API 가 주는 `data` 를 **배열로** 만든다.
 *
 * 🔴 [2026-09-08] 한경컨센서스는 1쪽에서 `data` 가 **배열**이고
 *   2쪽부터는 `{"50": {...}, "51": {...}}` 처럼 **번호를 키로 쓴 객체**였다.
 *   `Array.isArray(data)` 로만 재면 2쪽부터 «0줄»로 읽힌다 — 조용히 자료를 잃는다.
 * ⛔ 「0줄이니 없다」로 읽지 않는다. 꼴이 둘이면 둘 다 받는다.
 */
export function 줄들로(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return Object.values(data);
  return [];
}

/* ── 자가시험 — 붙지 않고 잴 수 있는 것만 잰다 ─────────────────────
 * 🔴 [2026-09-08] 처음에는 `--자가시험` 만 보고 돌게 했다. 그러자 **이 자를 «불러 쓴»**
 *   수집기가 자기 자가시험을 돌리기 전에 이 블록이 먼저 돌고 `process.exit` 했다.
 *   수집기 시험 17건이 «한 건도 안 돌고» 「8건 통과」로 보였다.
 * ⛔ 통과 수가 줄어든 것을 못 알아채면 시험이 있으나 없으나 같다.
 * ✅ 그래서 «내가 입구일 때만» 돈다.
 */
const 내가입구인가 = !!process.argv[1]
  && process.argv[1].split(/[\\/]/).pop() === new URL(import.meta.url).pathname.split('/').pop();
if (내가입구인가 && process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  재다('줄들로 — 배열은 그대로', 줄들로([1, 2, 3]).length === 3);
  재다('줄들로 — 번호키 객체도 3줄', 줄들로({ 50: 'a', 51: 'b', 52: 'c' }).length === 3);
  재다('줄들로 — null 은 0줄', 줄들로(null).length === 0);
  재다('줄들로 — 문자열은 0줄(글자 수로 안 센다)', 줄들로('abc').length === 0);
  재다('줄들로 — 빈 객체는 0줄', 줄들로({}).length === 0);
  /* ⚠ 이것이 이 자를 만든 까닭이다 — 배열이 아닌 꼴을 0 으로 읽으면 조용히 잃는다 */
  재다('줄들로 — 번호키 객체를 Array.isArray 로 재면 0 이었다', !Array.isArray({ 50: 'a' }) && 줄들로({ 50: 'a' }).length === 1);

  재다('기본뿌리가 127.0.0.1:9222', 기본뿌리 === 'http://127.0.0.1:9222');
  재다('WebSocket 이 내장돼 있다 — 남의 짐이 필요 없다', typeof WebSocket === 'function');

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}
