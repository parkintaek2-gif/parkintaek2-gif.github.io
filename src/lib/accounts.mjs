/**
 * 손님 계정 — 비밀번호 → 계정 → 「내가 산 것」 (2단계).
 *
 * ── 왜 SQLite+litestream 이 아닌가 ────────────────────────────────
 * 6번 인계서는 klifemap 과 같은 SQLite+litestream 을 상정했다. 그런데 klifemap 은
 * 그 구조에서 R2 열쇠가 지워지자 DB 를 통째로 잃었다(2026-09-11). 이 배포는 한
 * 서비스가 세 도메인(seoulmarkets·kculturewire·100yearmap)을 같이 내므로 같은
 * 사고가 나면 셋이 한꺼번에 죽는다 — 위험이 세 배다.
 *
 * 이 저장소에는 이미 `src/lib/store.mjs` 가 있다 — 관세청 10일 잠정치(다시 못 받는
 * 자료)를 지키려고 만든, R2 를 직접 쓰는 검증된 저장소다. **컨테이너 로컬 디스크를
 * 거치지 않고 R2 자체가 정본**이라 「복제」할 것이 없다 — SQLite 처럼 로컬 파일을
 * 주기적으로 복제하다 그 복제가 실패하는 사고 자체가 구조적으로 없다.
 * 계정도 같은 원리로 둔다. 새 인프라(SQLite·litestream·볼륨)를 하나도 안 늘린다.
 *
 * ── ⛔ store.put() 을 그냥 쓰면 안 되는 이유 ─────────────────────
 * store.put() 은 로컬 디스크에 먼저 쓰고, R2 실패는 **던지지 않고** `remoteError` 에
 * 담아 돌려준다(수집기용 설계 — "네트워크가 죽어도 로컬에 남는 게 낫다"). 그런데 이
 * 컨테이너에는 로컬 디스크가 없다. R2 쓰기가 실패했는데 그걸 삼키면 "계정을 만들었다"
 * 는 응답이 나가고 다음 재배포에 그 계정이 통째로 사라진다 — klifemap 사고와 같은 꼴
 * 을 다른 코드로 반복하는 것이다. 그래서 이 파일은 원격이 켜져 있는데 쓰기가 실패하면
 * **반드시 던진다**(아래 저장확정()). 로컬 전용(원격 꺼짐)일 때만 조용히 넘어가는데
 * 그건 로컬 개발 중일 때뿐이다.
 */

import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import * as Store from './store.mjs';

const 계정열쇠 = (email) => `accounts/${createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex')}.json`;

/** store.put() 의 결과를 검사해 R2 가 켜져 있는데 실패했으면 던진다. */
async function 저장확정(key, obj) {
  const body = Buffer.from(JSON.stringify(obj, null, 2));
  const out = await Store.put(key, body, 'application/json; charset=utf-8');
  if (Store.remoteEnabled && out.remoteError) {
    throw new Error(`계정 저장이 R2 에 실패했습니다(${out.remoteError}) — 로컬에만 남으면 재배포로 사라집니다. 저장하지 않은 것으로 취급합니다.`);
  }
  return out;
}

function 비번해시(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function 비번맞나(password, stored) {
  const [saltHex, hashHex] = String(stored ?? '').split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(String(password), salt, 64);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/**
 * 계정을 만든다. 이미 있으면 'exists' 를 던진다.
 * ⛔ 이메일 형식·중복확인은 서버 라우트가 먼저 한다 — 여기는 저장만 한다.
 */
export async function 계정만들기(email, password) {
  const key = 계정열쇠(email);
  const 기존 = await Store.get(key);
  if (기존) { const e = new Error('exists'); e.code = 'exists'; throw e; }
  const 계정 = {
    email: String(email).trim().toLowerCase(),
    passwordHash: 비번해시(password),
    createdAt: new Date().toISOString(),
    purchases: [],
  };
  await 저장확정(key, 계정);
  return { email: 계정.email, createdAt: 계정.createdAt };
}

/** 이메일·비밀번호로 로그인. 실패하면 null. */
export async function 로그인(email, password) {
  const key = 계정열쇠(email);
  const raw = await Store.get(key);
  if (!raw) return null;
  const 계정 = JSON.parse(raw.toString('utf-8'));
  if (!비번맞나(password, 계정.passwordHash)) return null;
  return { email: 계정.email, createdAt: 계정.createdAt };
}

/**
 * 결제 완료 뒤 「내가 산 것」에 한 줄 추가한다.
 * ⛔ 이 함수가 실패해도 결제 자체는 이미 끝난 뒤다(server.mjs 는 응답을 먼저 보낸다) —
 *    호출하는 쪽에서 catch 해서 로그만 남긴다. 손님은 /recover(주문번호)로도 여전히
 *    받을 수 있으므로 이 색인은 "편의"이지 유일한 증거가 아니다.
 */
export async function 구매기록추가(email, { orderID, product, dataset }) {
  const key = 계정열쇠(email);
  const raw = await Store.get(key);
  if (!raw) return; // 비회원 구매 — 계정이 없으면 색인할 곳이 없다. /recover 로 충분하다.
  const 계정 = JSON.parse(raw.toString('utf-8'));
  if (계정.purchases.some((p) => p.orderID === orderID)) return; // 중복 방지
  계정.purchases.push({ orderID, product, dataset: dataset ?? null, capturedAt: new Date().toISOString() });
  await 저장확정(key, 계정);
}

/** 로그인한 계정의 「내가 산 것」 목록 — 주문번호만. 실제 결제 여부는 여전히 PayPal 에 되묻는다. */
export async function 내가산것(email) {
  const key = 계정열쇠(email);
  const raw = await Store.get(key);
  if (!raw) return [];
  const 계정 = JSON.parse(raw.toString('utf-8'));
  return 계정.purchases;
}

/**
 * 세션 — 서버에 아무것도 저장하지 않는다(스테이트리스). HMAC 서명된 토큰 하나가
 * 전부다. 시크릿은 ACCOUNT_SESSION_SECRET(스테이지 시크릿, 값은 코드에 없다).
 * ⚠ 세션을 저장하지 않으므로 "로그아웃 전체"(전 기기 강제 로그아웃) 기능은 없다 —
 *   필요해지면 그때 만든다(지금은 그 요구가 없다. 없는 기능을 미리 만들지 않는다).
 */
const 세션유효기간_초 = 60 * 60 * 24 * 30; // 30일

function 세션시크릿() {
  const s = process.env.ACCOUNT_SESSION_SECRET;
  if (!s) throw new Error('ACCOUNT_SESSION_SECRET 이 없습니다 — 세션 발급 전 스테이지 시크릿을 먼저 넣으십시오.');
  return s;
}

export function 세션발급(email) {
  const exp = Math.floor(Date.now() / 1000) + 세션유효기간_초;
  const payload = `${email}.${exp}`;
  const sig = createHmac('sha256', 세션시크릿()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

/** 토큰이 유효하면 이메일을, 아니면 null 을 돌려준다. */
export function 세션확인(token) {
  let decoded;
  try { decoded = Buffer.from(String(token), 'base64url').toString('utf-8'); } catch { return null; }
  const parts = decoded.split('.');
  if (parts.length < 3) return null;
  /* ⚠ 이메일 자체에 '.' 이 있다(도메인이 거의 항상 그렇다) — 앞에서부터 셋으로 쪼개면
     이메일이 잘린다. 뒤에서 exp·sig 둘만 떼고 나머지 전부를 이메일로 되붙인다. */
  const sig = parts.pop();
  const expStr = parts.pop();
  const email = parts.join('.');
  const payload = `${email}.${expStr}`;
  const expected = createHmac('sha256', 세션시크릿()).update(payload).digest('hex');
  const a = Buffer.from(sig, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
  return email;
}
