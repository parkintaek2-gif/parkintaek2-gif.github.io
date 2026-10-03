/**
 * 과속막이.mjs — **API 창구의 분당 호출 한도.**
 *
 * 🔴 사장님 (2026-10-03): 「비정상적인 반복 호출이나 대량 조회를 실시간으로 잡아낼 수 있는
 *    감시 체계를 갖춰야 한다」
 *
 * 2026-10-03 실측 — 이 서버의 API 창구(/api/comments · /api/vote · /v1/* · /api/account/* ·
 * /api/pay/*)에 호출 횟수 제한이 «하나도» 없었다. 30번을 잇달아 두드려도 다 받아 줬다.
 * KLifeMap 서버에는 이미 IP 30회/분 막이가 있다(server.js 3185줄). 같은 자리를 여기도 만든다.
 *
 * ⛔ 지면(HTML·이미지·_astro)에는 걸지 않는다 — 한 사람이 한 화면에서도 수십 번 받아 간다.
 *    막으면 손님과 검색엔진이 먼저 막힌다. 막이는 «API 창구»에만 건다.
 * ⛔ 결제 창구(/api/pay/*)는 넉넉하게 둔다 — 결제 도중에 막히면 돈이 걸린 일이 깨진다.
 *
 * ⚠ 이 파일은 «판정만» 한다. 서버를 띄우지 않는다 —
 *   점검 도구가 불러다 쓸 수 있어야 하기 때문이다(server.mjs 를 그대로 부르면 서버가 뜬다).
 */

const 과속표 = new Map();
export const 과속창 = 60 * 1000;

/**
 * 그 길에 몇 회/분까지 받아 주나. 0 이면 막이를 안 건다(지면).
 * ⚠ 창구를 늘릴 때 이 표도 같이 본다. 표에 없으면 막이가 «안 도는» 것이다.
 */
export function 분당한도(pathname) {
  const p = String(pathname ?? '');
  if (p.startsWith('/api/pay/')) return 60;              /* 결제 — 넉넉히 */
  if (p === '/api/account/login' || p === '/api/account/signup') return 10;
  if (p === '/v1/keys' || p === '/v1/trial' || p === '/v1/subscribe') return 10;
  if (p.startsWith('/api/') || p.startsWith('/v1/')) return 60;
  return 0;                                              /* 지면은 안 막는다 */
}

/** 지금 이 열쇠(아이피+길)가 한도를 넘었나 */
export function 과속인가(열쇠, 한도, 이제 = Date.now(), 표 = 과속표) {
  if (!한도) return false;
  const 찍힌것 = (표.get(열쇠) || []).filter((t) => 이제 - t < 과속창);
  찍힌것.push(이제);
  표.set(열쇠, 찍힌것);
  return 찍힌것.length > 한도;
}

/** 요청을 보낸 아이피 — 프록시 뒤에 있으므로 X-Forwarded-For 를 먼저 본다 */
export function 보낸곳(req) {
  const f = req?.headers?.['x-forwarded-for'];
  if (typeof f === 'string' && f) return f.split(',')[0].trim();
  return req?.socket?.remoteAddress || 'unknown';
}

/** 오래된 것은 버린다 — 안 버리면 표가 끝없이 자란다 */
export function 쓸기(이제 = Date.now(), 표 = 과속표) {
  let 버린수 = 0;
  for (const [k, v] of 표.entries()) {
    const 남길것 = v.filter((t) => 이제 - t < 과속창);
    if (남길것.length) 표.set(k, 남길것);
    else { 표.delete(k); 버린수 += 1; }
  }
  return 버린수;
}

/** 서버가 띄울 때 한 번 부른다 — 주기적으로 표를 쓴다 */
export function 쓸기시작() {
  const t = setInterval(() => 쓸기(), 과속창);
  t.unref?.();
  return t;
}
