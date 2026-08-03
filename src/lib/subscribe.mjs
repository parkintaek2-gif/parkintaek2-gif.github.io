/**
 * 뉴스레터 구독 접수.
 *
 * ── 왜 지금 만드나 ─────────────────────────────────────────────
 * 아직 **발송 수단이 없다.** 그런데도 지금 만든다.
 * 명단은 쌓이는 데 시간이 걸리고, **안 받은 날의 구독자는 영영 못 받는다.**
 * Riot 사다리를 매일 세는 이유와 같다 — 지나간 날은 소급이 안 된다.
 *
 * 그리고 이메일 명단은 **검색 알고리즘 밖에 있는 유일한 자산**이다.
 * 우리는 YMYL 금융이라 순위가 언제 흔들릴지 모른다.
 *
 * ── 이 프로젝트의 원칙을 깨지 않는다 ───────────────────────────
 * `CLAUDE.md`: 「회원가입·로그인 **없음**」
 *   → 계정을 만들지 않는다. **이메일 한 칸만** 받는다.
 *     비밀번호도, 프로필도, 로그인도 없다. 구독은 회원이 아니다.
 *
 * ── 저장 ────────────────────────────────────────────────────────
 * DB 를 두지 않는다(상시 서버·DB 없음이 이 프로젝트의 전제다).
 * 이미 있는 오브젝트 스토리지에 **한 명당 파일 하나**로 넣는다.
 *   subscribers/{이메일해시}.json
 *
 * 키를 이메일 원문이 아니라 **해시**로 잡는 이유가 둘이다.
 *   ① 같은 사람이 두 번 눌러도 같은 키라 **덮어쓰기**가 된다. 중복이 안 생긴다
 *   ② 스토리지 목록만 보고 남의 메일 주소를 읽을 수 없다
 *
 * ── 개인정보 ────────────────────────────────────────────────────
 * IP 를 저장하지 않는다. 받는 것은 이메일·시각·유입 경로뿐이다.
 * 확인 토큰을 함께 넣어 두고, 발송 수단이 생기면 **그때 확인 메일**을 보낸다.
 * 확인 전까지 `confirmed:false` 다 — 확인된 것처럼 세지 않는다.
 */

import { createHash, randomBytes } from 'node:crypto';
import { put, get } from './store.mjs';

/** 지금 시각(KST). 이 서버는 KST 로 돌린다 — toISOString 은 UTC 라 날짜가 어긋난다. */
function 지금() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * 이메일 형식 검사.
 *
 * ⚠ 완벽한 정규식을 만들려 하지 않는다. RFC 5322 를 정규식으로 옮기면 아무도
 *   못 읽는 괴물이 되고, 그래도 새는 게 있다. **명백히 아닌 것만 막고**
 *   진짜 유효성은 확인 메일이 가려내게 한다. 그게 원래 확인 메일의 역할이다.
 */
export function 정상이메일(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  if (t.length < 6 || t.length > 254) return false;
  if (/\s/.test(t)) return false;
  const m = t.match(/^([^@]+)@([^@]+)$/);
  if (!m) return false;
  const [, 앞, 뒤] = m;
  if (!앞.length || 앞.length > 64) return false;
  if (!뒤.includes('.') || 뒤.startsWith('.') || 뒤.endsWith('.')) return false;
  if (뒤.includes('..')) return false;
  return /^[A-Za-z0-9.-]+$/.test(뒤);
}

/** 저장 키. 소문자로 정규화해 같은 사람이 두 번 세어지지 않게 한다. */
export function 키(email) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
}

const 허용유입 = new Set(['home', 'article', 'newsletter', 'api', 'about', 'footer', 'unknown']);

/**
 * 구독 접수.
 *
 * @param {object} body  { email, source?, hp? }
 * @returns {{status:number, payload:object}}
 */
export async function subscribe(body) {
  const email = typeof body?.email === 'string' ? body.email.trim() : '';

  /*
   * 봇 덫(honeypot). 사람 눈에 안 보이는 칸이라 **사람은 절대 못 채운다.**
   * 채워져 있으면 자동 제출이다. ⚠ 여기서 에러를 내지 않는다 —
   * 에러를 주면 봇이 「이 칸을 비우면 되는구나」를 배운다. 성공한 척하고 버린다.
   *
   * CAPTCHA 를 쓰지 않는 것은 의도다. 읽는 사람에게 시험을 내지 않는다.
   */
  if (typeof body?.hp === 'string' && body.hp.trim() !== '') {
    return { status: 200, payload: { ok: true, status: 'pending' } };
  }

  if (!정상이메일(email)) {
    return {
      status: 400,
      payload: {
        error: 'invalid_email',
        message: 'That does not look like an email address.',
      },
    };
  }

  const source = 허용유입.has(body?.source) ? body.source : 'unknown';
  const k = 키(email);

  /* 이미 있으면 가입 시각을 덮어쓰지 않는다. 「언제부터 구독자인가」가 사실이다. */
  let 기존 = null;
  try {
    const buf = await get(`subscribers/${k}.json`);
    if (buf) 기존 = JSON.parse(buf.toString('utf8'));
  } catch {
    /* 못 읽으면 새로 쓴다. 조회 실패로 가입을 막지 않는다 */
  }

  const 레코드 = {
    email: email.toLowerCase(),
    subscribedAt: 기존?.subscribedAt ?? 지금(),
    lastSeenAt: 지금(),
    source: 기존?.source ?? source,
    /** 확인 메일을 아직 못 보낸다. 보낼 수단이 생기면 이 토큰으로 확인한다. */
    confirmed: 기존?.confirmed ?? false,
    confirmToken: 기존?.confirmToken ?? randomBytes(16).toString('hex'),
    unsubscribeToken: 기존?.unsubscribeToken ?? randomBytes(16).toString('hex'),
    /* ⚠ IP 는 저장하지 않는다. 발송에 필요 없고, 없는 편이 안전하다. */
  };

  await put(`subscribers/${k}.json`, JSON.stringify(레코드, null, 2), 'application/json');

  return {
    status: 200,
    payload: {
      ok: true,
      status: 기존 ? 'already_subscribed' : 'pending',
      message: 기존
        ? 'You are already on the list.'
        : 'Thanks — you are on the list. The first issue goes out when the archive is ready.',
    },
  };
}
