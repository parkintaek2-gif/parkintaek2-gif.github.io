/**
 * 방문자집계.mjs — **우리 서버가 IP로 직접 방문자를 집계한다.**
 *
 * ── 🔴 왜 만드나 (2026-11-01 · 사장님) ──────────────────────────────────
 * 사장님: 「**ip가 같은 곳은 방문자 한명(즉 순방문자)로 계산해**」
 *
 * 구글 애널리틱스로는 할 수 없다. 구글이 개인정보 보호를 이유로 IP를 제공하지 않는다.
 * 그리고 구글 수치에는 오차가 두 방향으로 동시에 있다 —
 *   ① 자동 접속을 사람으로 집계해 부풀린다 (10-30 하루 333명 중 135명이 그랬다)
 *   ② 측정 코드가 차단된 방문자를 누락한다 (같은 날 네이버 71명 vs 구글 전체 53명)
 * ⇒ 우리 서버가 직접 세는 수치만이 다툼이 없다.
 *
 * ── ⛔ 개인정보 ────────────────────────────────────────────────────
 * IP는 개인정보다. **원본을 저장하지 않는다.**
 * 되돌릴 수 없는 값(sha256)으로 바꾸고, 날짜를 섞어 **날이 바뀌면 같은 IP라도 값이 달라지게** 한다.
 * 그래서 날짜를 가로질러 한 사람을 추적할 수 없다. 우리가 아는 것은 「그 날 몇 명인가」뿐이다.
 *
 * ── 세는 규칙 ──────────────────────────────────────────────────────
 *   · 화면(HTML)을 받아 간 요청만 센다. 그림·스타일·자료 요청은 세지 않는다
 *   · 같은 IP는 그 날 몇 번을 와도 1명이다 (사장님 지시)
 *   · 조회수는 화면을 받아 간 횟수를 그대로 더한다
 *   · 사이트마다 따로 센다
 *
 * ⚠ 서버가 다시 뜨면 메모리가 비므로, 뜰 때 그 날 저장분을 읽어 들인다.
 * ⚠ 저장은 60초마다 한 번만 한다 — 요청마다 쓰면 저장소가 버티지 못한다.
 */
import crypto from 'node:crypto';
import * as store from './store.mjs';

const 소금 = process.env.VISIT_SALT || 'klifedesign-visit-2026';
const 저장주기ms = 60_000;

/** 오늘 날짜 (한국시간). ⛔ toISOString 금지 — 날이 하루 어긋난다 */
export function 오늘(d = new Date()) {
  const k = new Date(d.getTime() + (9 * 60 - d.getTimezoneOffset()) * 60_000);
  return `${k.getFullYear()}-${String(k.getMonth() + 1).padStart(2, '0')}-${String(k.getDate()).padStart(2, '0')}`;
}

/** IP를 되돌릴 수 없는 값으로 바꾼다. 날짜를 섞어 날마다 달라지게 한다 */
export function 지문(ip, 날짜) {
  return crypto.createHash('sha256').update(`${소금}|${날짜}|${String(ip ?? '')}`, 'utf8')
    .digest('hex').slice(0, 16);
}

/** 요청에서 방문자 IP를 꺼낸다. 프록시 뒤라 x-forwarded-for 맨 앞이 실제 주소다 */
export function 주소뽑기(req) {
  const h = (req?.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim();
  return h || req?.socket?.remoteAddress || '';
}

/** 사이트 이름 — 포트와 www 를 떼고 소문자로 맞춘다 */
export function 사이트이름(host) {
  return String(host ?? '').toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '') || '(모름)';
}

/* 날짜 → 사이트 → { 사람: Set<지문>, 조회수: number } */
const 담는곳 = new Map();
let 바뀜 = false;
let 불러온날 = null;

function 그날칸(날짜) {
  if (!담는곳.has(날짜)) 담는곳.set(날짜, new Map());
  return 담는곳.get(날짜);
}

/** 한 번 받아 간 것을 센다 */
export function 기록(host, ip, 날짜 = 오늘()) {
  const 칸 = 그날칸(날짜);
  const 이름 = 사이트이름(host);
  if (!칸.has(이름)) 칸.set(이름, { 사람: new Set(), 조회수: 0 });
  const 것 = 칸.get(이름);
  것.조회수 += 1;
  const 값 = 지문(ip, 날짜);
  if (!것.사람.has(값)) { 것.사람.add(값); 바뀜 = true; return true; }
  바뀜 = true;
  return false;
}

/** 그 날 집계 — { 사이트: { 방문자, 조회수 } } */
export function 집계(날짜 = 오늘()) {
  const 칸 = 담는곳.get(날짜);
  const 답 = {};
  if (!칸) return 답;
  for (const [이름, 것] of 칸) 답[이름] = { 방문자: 것.사람.size, 조회수: 것.조회수 };
  return 답;
}

const 저장이름 = (날짜) => `visits/${날짜}.json`;

/** 저장소에 적는다 — 지문 목록과 조회수를 함께 둔다(서버가 다시 떠도 이어 세려면 목록이 필요하다) */
export async function 저장하기(날짜 = 오늘()) {
  const 칸 = 담는곳.get(날짜);
  if (!칸) return false;
  const 몸 = { 날짜, 사이트: {} };
  for (const [이름, 것] of 칸) 몸.사이트[이름] = { 지문들: [...것.사람], 조회수: 것.조회수 };
  await store.put(저장이름(날짜), JSON.stringify(몸), 'application/json');
  바뀜 = false;
  return true;
}

/** 저장해 둔 것을 읽어 메모리에 올린다 — 서버가 다시 뜰 때 한 번 */
export async function 불러오기(날짜 = 오늘()) {
  if (불러온날 === 날짜) return false;
  불러온날 = 날짜;
  let 글 = null;
  try { 글 = await store.get(저장이름(날짜)); } catch (e) { 글 = null; }
  if (!글) return false;
  let 몸 = null;
  try { 몸 = JSON.parse(typeof 글 === 'string' ? 글 : Buffer.from(글).toString('utf8')); } catch (e) { return false; }
  if (!몸 || !몸.사이트) return false;
  const 칸 = 그날칸(날짜);
  for (const [이름, 것] of Object.entries(몸.사이트)) {
    칸.set(이름, { 사람: new Set(것.지문들 ?? []), 조회수: Number(것.조회수 ?? 0) });
  }
  return true;
}

/** 저장해 둔 날의 집계를 읽는다 — 지난 날짜를 볼 때 쓴다 */
export async function 지난날집계(날짜) {
  let 글 = null;
  try { 글 = await store.get(저장이름(날짜)); } catch (e) { 글 = null; }
  if (!글) return null;
  try {
    const 몸 = JSON.parse(typeof 글 === 'string' ? 글 : Buffer.from(글).toString('utf8'));
    const 답 = {};
    for (const [이름, 것] of Object.entries(몸.사이트 ?? {})) {
      답[이름] = { 방문자: (것.지문들 ?? []).length, 조회수: Number(것.조회수 ?? 0) };
    }
    return 답;
  } catch (e) { return null; }
}

let 시계 = null;
/** 서버가 뜰 때 한 번 부른다 — 그 날 저장분을 읽고, 60초마다 저장한다 */
export async function 시작한다() {
  await 불러오기().catch(() => {});
  if (시계) return;
  시계 = setInterval(() => {
    if (!바뀜) return;
    저장하기().catch(() => { /* 저장에 실패해도 집계는 계속한다 */ });
  }, 저장주기ms);
  if (시계.unref) 시계.unref();
}

/* ── 자가시험 ───────────────────────────────────────────────────── */
export function 자가시험() {
  const 결 = [];
  const T = (이름, 참) => 결.push({ 이름, 참: !!참 });

  T('⛔ 날짜에 toISOString 을 쓰지 않는다 — 한국시간으로 센다',
    오늘(new Date('2026-10-31T16:30:00Z')) === '2026-11-01');
  T('같은 IP·같은 날은 같은 값이다', 지문('1.2.3.4', '2026-11-01') === 지문('1.2.3.4', '2026-11-01'));
  T('🔴 날이 바뀌면 같은 IP라도 값이 달라진다 — 날을 가로질러 추적할 수 없다',
    지문('1.2.3.4', '2026-11-01') !== 지문('1.2.3.4', '2026-11-02'));
  T('⛔ 원본 주소가 값에 남지 않는다', !지문('1.2.3.4', '2026-11-01').includes('1.2.3'));
  T('www 와 포트를 떼고 같은 사이트로 본다',
    사이트이름('www.kculturewire.com:443') === 'kculturewire.com');

  담는곳.clear();
  기록('seoulmarkets.com', '1.1.1.1', '2026-11-01');
  기록('seoulmarkets.com', '1.1.1.1', '2026-11-01');
  기록('seoulmarkets.com', '2.2.2.2', '2026-11-01');
  const a = 집계('2026-11-01');
  T('🔴 같은 IP는 몇 번 와도 1명이다 (사장님 지시)', a['seoulmarkets.com'].방문자 === 2);
  T('조회수는 받아 간 횟수를 그대로 더한다', a['seoulmarkets.com'].조회수 === 3);

  기록('100yearmap.com', '3.3.3.3', '2026-11-01');
  T('사이트마다 따로 센다', 집계('2026-11-01')['100yearmap.com'].방문자 === 1);
  T('다른 날은 섞이지 않는다', Object.keys(집계('2026-10-31')).length === 0);
  담는곳.clear();

  const 깨짐 = 결.filter((x) => !x.참);
  결.forEach((x) => console.log((x.참 ? '  ✅ ' : '  ❌ ') + x.이름));
  console.log(깨짐.length ? `\n■ 자가시험 ${깨짐.length}건 실패` : '\n■ 자가시험 모두 통과');
  return 깨짐.length === 0;
}
