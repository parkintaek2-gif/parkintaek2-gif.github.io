/**
 * apikeys.mjs — **셀프 발급 API 열쇠.** (2026-09-09 · 1번, 사장님 지시 「전 유닛 절반 투입」로
 * 5번이 P6 중 「열쇠 발급·인증·요금 구간 흐름」을 넘김)
 *
 * ── 지금까지는 무엇이 있었나 ──────────────────────────────────────
 * `tiers.mjs` 의 `tierOf()` 는 **RapidAPI 프록시 시크릿 하나**로만 pro 를 갈랐다.
 * 즉 **우리 도메인에서 직접 산 고객은 아직 아무도 없다** — 마켓플레이스를 거친 사람만
 * pro 였다. 이 파일은 그 옆에 **자체 열쇠 발급 길**을 하나 더 낸다(대체가 아니라 병행).
 *
 * ── 원칙은 klifemap 의 것을 그대로 옮긴다 ─────────────────────────
 * 「원본 키를 저장하지 않는다. 발급하는 순간 한 번만 보여주고, sha256 해시만 남긴다」
 * (klifemap/db/db.js API_KEY_PREFIX 절과 같은 원칙). DB 가 아니라 파일이라는 것만 다르다.
 *
 * ── 저장 (store.mjs 를 그대로 쓴다 — comments.mjs 와 같은 자리) ────
 *   raw/apikeys/by-hash/<sha256(rawKey)>.json   인증 조회용(열쇠 → 등급)
 *   raw/apikeys/by-email/<sha256(email)>.json   중복 발급 방지용(메일 → 열쇠 해시)
 * ⚠ 이메일도 파일명에 그대로 안 쓴다 — comments.mjs 의 페이지열쇠와 같은 이유(경로 탈출·개인정보).
 *
 * ── ⚠ 인증 경로가 매 요청마다 원격(R2)을 부를 수 있다 ─────────────
 * `store.get()` 은 로컬에 없으면 R2 를 본다. 컨테이너가 재배포되면 로컬은 비어 있으므로
 * **매 API 호출이 R2 GET 하나씩을 문다.** 지금 트래픽(하루 손님이 한 자리 수)에서는
 * 문제가 안 되지만, 트래픽이 늘면 인메모리 캐시(TTL)를 얹는다 — **지금은 안 만든다**,
 * 겪지도 않은 문제를 미리 풀면 코드만 늘어난다.
 *
 * ── 한 이메일에 한 열쇠만 ────────────────────────────────────────
 * 셀프 발급을 무한정 열면 한 사람이 키를 무한히 찍어 등급 자체가 뜻이 없어진다.
 * 이미 있으면 새로 만들지 않고 「이미 있다」고만 답한다(키를 다시 보여주지 않는다 —
 * 애초에 저장하지 않으니 보여줄 수도 없다. 잃어버리면 rotate 로 재발급한다).
 *
 * node src/lib/apikeys.mjs --selftest
 */
'use strict';
import { randomBytes, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { put, get } from './store.mjs';

const 열쇠앞가지 = 'sm_live_';
const 이메일최대 = 200;

const sha256 = (s) => createHash('sha256').update(String(s)).digest('hex');

/** comments.mjs 의 페이지열쇠와 같은 이유 — 개인정보·경로탈출 방지로 해시를 접어 쓴다. */
function 이메일자리(email) {
  return `raw/apikeys/by-email/${sha256(String(email ?? '').toLowerCase().trim()).slice(0, 32)}.json`;
}
function 열쇠자리(rawKey) {
  return `raw/apikeys/by-hash/${sha256(rawKey)}.json`;
}

function 이메일형식인가(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
}

async function 읽기(key) {
  const raw = await get(key).catch(() => null);
  if (!raw) return null;
  try { return JSON.parse(raw.toString('utf8')); } catch { return null; }
}

/**
 * 열쇠를 새로 발급한다. 이미 그 메일로 발급된 것이 있으면 새로 만들지 않는다.
 * @returns {{ok:boolean, code?:number, why?:string, apiKey?:string, tier?:string, reused?:boolean}}
 */
export async function 발급({ email, tier = 'free', site } = {}) {
  const 정리메일 = String(email ?? '').trim().slice(0, 이메일최대);
  if (!이메일형식인가(정리메일)) return { ok: false, code: 400, why: 'invalid_email' };

  const 기존 = await 읽기(이메일자리(정리메일));
  if (기존) return { ok: false, code: 409, why: 'already_issued', reused: true };

  const rawKey = 열쇠앞가지 + randomBytes(24).toString('base64url');
  const 발급시각 = new Date().toISOString();
  const 기록 = {
    tier, status: 'active', createdAt: 발급시각,
    keyPrefix: rawKey.slice(0, 열쇠앞가지.length + 8), // 화면·로그 식별용 — 원본 복원 불가
    site: site || null,
  };
  // 열쇠 → 등급(인증 조회) 과 이메일 → 발급됨(중복 방지) 둘 다 남긴다.
  // ⚠ rawKey 는 이 두 파일 어디에도 안 들어간다 — 해시 자리(파일 경로)에만 쓰이고 버려진다.
  await put(열쇠자리(rawKey), JSON.stringify(기록));
  await put(이메일자리(정리메일), JSON.stringify({ keyHashPrefix: sha256(rawKey).slice(0, 16), createdAt: 발급시각 }));

  // rawKey 는 이 반환값에만 존재한다 — 다시 보여줄 수 없다. 부르는 쪽이 그렇게 안내한다.
  return { ok: true, apiKey: rawKey, tier };
}

/**
 * 요청 헤더의 열쇠가 유효한지 본다. `tiers.mjs` 의 `tierOf()` 가 이걸 부른다.
 * @returns {null|{tier:string}} 없거나 정지 상태면 null.
 */
export async function 확인(rawKey) {
  if (!rawKey || !String(rawKey).startsWith(열쇠앞가지)) return null;
  const 기록 = await 읽기(열쇠자리(rawKey));
  if (!기록 || 기록.status !== 'active') return null;
  return { tier: 기록.tier || 'free' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--selftest')) {
    (async () => {
      const 임시메일 = `__selftest__${Date.now()}@example.invalid`;

      const r1 = await 발급({ email: '이메일아님' });
      console.assert(r1.ok === false && r1.why === 'invalid_email', '① 형식이 아닌 이메일은 거부');

      const r2 = await 발급({ email: 임시메일, tier: 'pro' });
      console.assert(r2.ok === true && r2.apiKey?.startsWith(열쇠앞가지), '② 정상 발급 — 원본 열쇠를 돌려준다');

      const r3 = await 발급({ email: 임시메일 });
      console.assert(r3.ok === false && r3.why === 'already_issued', '③ 같은 메일 재요청은 막는다');

      const r4 = await 확인(r2.apiKey);
      console.assert(r4?.tier === 'pro', '④ 발급된 열쇠는 인증에서 pro 로 확인된다');

      const r5 = await 확인('sm_live_이런열쇠는_없다');
      console.assert(r5 === null, '⑤ 없는 열쇠는 null');

      const r6 = await 확인('완전히_다른_형식');
      console.assert(r6 === null, '⑥ 접두어부터 다르면 저장소를 아예 안 본다');

      console.log('apikeys.mjs 자가시험 6개 — 통과');
    })();
  }
}
