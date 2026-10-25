/* 사장님 크롬(9222)에 «날것 CDP»로 붙는다.
   ⛔ b.close() 금지 — 사장님 창이 닫힌다. 언제나 새 탭, 끝나면 그 탭만 닫는다.
   ⚠ puppeteer.connect 는 탭이 많으면 멈춘다(2026-10-24 실측). 그래서 ws 로 직접 붙는다. */
/* 🔴 [2026-10-26 · 5번] 이 자는 임시 폴더에 있었고 거기서 ws 를 file:// 절대경로로 집었다.
   창이 바뀌면 그 폴더가 사라진다 — 이 자를 쓰는 예약 작업이 조용히 죽는 자리다
   (「걸어 뒀다를 돌고 있다로 읽지 않는다」에 적어 둔 그 병이다).
   ⇒ 저장소 안으로 옮기고 평범하게 들여온다. */
import WebSocket from 'ws';

export async function 붙는다() {
  const r = await fetch('http://127.0.0.1:9222/json/version');
  const v = await r.json();
  const ws = new WebSocket(v.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
  await new Promise((f, j) => { ws.once('open', f); ws.once('error', j); });

  let 번호 = 0;
  const 기다리는것 = new Map();
  const 듣는이 = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(String(raw));
    if (m.id && 기다리는것.has(m.id)) {
      const { f, j } = 기다리는것.get(m.id); 기다리는것.delete(m.id);
      m.error ? j(new Error(m.error.message)) : f(m.result);
      return;
    }
    for (const fn of 듣는이) fn(m);
  });

  const 보낸다 = (method, params = {}, sessionId) => new Promise((f, j) => {
    const id = ++번호;
    기다리는것.set(id, { f, j });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
    setTimeout(() => { if (기다리는것.has(id)) { 기다리는것.delete(id); j(new Error('CDP 시간 초과 — ' + method)); } }, 60000);
  });

  return {
    보낸다,
    듣는다: (fn) => 듣는이.push(fn),
    끊는다: () => ws.close(),

    /** 새 탭을 열고 그 탭의 세션을 준다 */
    async 새탭(주소) {
      const { targetId } = await 보낸다('Target.createTarget', { url: 주소 || 'about:blank' });
      const { sessionId } = await 보낸다('Target.attachToTarget', { targetId, flatten: true });
      await 보낸다('Page.enable', {}, sessionId);
      await 보낸다('Runtime.enable', {}, sessionId);
      return {
        targetId,
        sessionId,
        간다: async (주소2) => {
          await 보낸다('Page.navigate', { url: 주소2 }, sessionId);
          await new Promise((f) => setTimeout(f, 2500));
        },
        잰다: async (글) => {
          const r2 = await 보낸다('Runtime.evaluate', {
            expression: 글, returnByValue: true, awaitPromise: true,
          }, sessionId);
          if (r2.exceptionDetails) throw new Error(r2.exceptionDetails.text + ' · ' + (r2.exceptionDetails.exception?.description || ''));
          return r2.result.value;
        },
        닫는다: () => 보낸다('Target.closeTarget', { targetId }),
      };
    },
  };
}
