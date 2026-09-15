/**
 * gmail-send.mjs — **회사 메일을 실제로 보내는 «한 곳»** (Gmail API · 도메인 위임)
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-15 · 6번 · 사장님 지시 — 5번 전달, 9/16 21시] 「회원가입 안하면
 *   정보를 어떻게 보내지?」에서 나온 일이다. 결제 뒤 손님에게 편지를 보내려면
 *   server.mjs 가 Gmail 을 불러야 하는데, 그 조각(`jwt만들기()`)이 지금까지
 *   `scripts/send-mail.mjs` 의 `main` 안 «클로저»로만 있어 서버가 못 썼다.
 *
 * ⇒ 그 조각을 여기로 뽑는다. `scripts/send-mail.mjs`(CLI)와 `server.mjs`(결제 뒤
 *   자동 발송)가 **같은 함수**를 쓴다 — 한 곳에서만 보내야 나중에 두 곳이 어긋나지 않는다.
 *
 * ⛔ 여기 있는 `메일보내기()`는 **절대 던지지 않는다.** 결제가 성공한 뒤에 부르는
 *   자리라서, 메일이 막혀도 결제 자체는 그대로 성공이어야 한다 — 실패는
 *   `{ ok:false, 왜 }`로만 돌려주고, 부르는 쪽이 로그에만 남기면 된다.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';

export const 갈래 = 'https://www.googleapis.com/auth/gmail.send';

/**
 * 보내는 주소. ⛔ 관리용(admin@)은 쓰지 않는다. 자리 번호가 있으면 그 자리 주소,
 * 없으면(서버 프로세스처럼 CLAUDE_SEAT 이 없는 곳) MAIL_FROM 을 따른다.
 * (scripts/send-mail.mjs 8/30 실측 그대로 — cs@ 는 Workspace 의 실제 사용자가 아니다)
 */
const 자리번호 = String(process.env.CLAUDE_SEAT ?? '').match(/^[1-9]$/)?.[0] ?? null;
export const 보내는주소 = process.env.MAIL_FROM
  ?? (자리번호 ? `u${자리번호}@klifedesign.net` : 'admin@klifedesign.net');
export const 보내는이름 = process.env.MAIL_FROM_NAME ?? 'SMarkets';

/** RFC 2822 제목. 한글이면 MIME(=?UTF-8?B?...?=)으로 감싼다 — 안 그러면 받는 쪽에서 깨진다 */
export function 제목인코딩(제목) {
  const s = String(제목 ?? '');
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

/** 파일 이름으로 MIME 종류를 고른다. ⛔ 모르는 것은 지어내지 않고 octet-stream 을 쓴다 */
export function 종류고르기(파일이름) {
  const n = String(파일이름 ?? '').toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.csv')) return 'text/csv';
  if (n.endsWith('.tsv')) return 'text/tab-separated-values';
  if (n.endsWith('.md') || n.endsWith('.txt')) return 'text/plain';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

/** 첨부 이름도 제목과 같은 MIME 인코딩으로 감싼다 — 한글 파일이름이 깨지지 않게 */
export function 첨부이름인코딩(이름) {
  return 제목인코딩(이름);
}

/** 편지 한 통. 첨부가 있으면 multipart/mixed 로 짠다 */
export function 편지만들기({ 받는곳, 제목, 글, 첨부들 = [], 보내는곳 = 보내는주소, 이름 = 보내는이름 }) {
  const 글64 = (t) => Buffer.from(String(t ?? ''), 'utf8').toString('base64').replace(/(.{76})/g, '$1\n');

  if (!첨부들.length) {
    return [
      `From: ${이름} <${보내는곳}>`,
      `To: ${받는곳}`,
      `Subject: ${제목인코딩(제목)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      글64(글),
    ].join('\r\n');
  }

  /* 경계 글자는 본문에 나올 수 없는 것이어야 한다 */
  const 경계 = '----klifedesign-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  const 줄들 = [
    `From: ${이름} <${보내는곳}>`,
    `To: ${받는곳}`,
    `Subject: ${제목인코딩(제목)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${경계}"`,
    '',
    `--${경계}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    글64(글),
    '',
  ];
  for (const a of 첨부들) {
    줄들.push(
      `--${경계}`,
      `Content-Type: ${종류고르기(a.이름)}`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${첨부이름인코딩(a.이름)}"`,
      '',
      Buffer.from(a.내용).toString('base64').replace(/(.{76})/g, '$1\n'),
      '',
    );
  }
  줄들.push(`--${경계}--`);
  return 줄들.join('\r\n');
}

/** Gmail send API 가 요구하는 base64url */
export const 감싸기 = (편지) => Buffer.from(편지, 'utf8').toString('base64url');

/**
 * 서비스 계정 키파일을 읽는다. ⛔ 없으면 null — 「없다」를 예외로 던지지 않는다.
 * 부르는 쪽(메일보내기)이 그것을 「메일이 아직 안 켜졌다」로 조용히 읽는다.
 */
export function 키읽기() {
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) return null;
  try { return JSON.parse(readFileSync(키파일, 'utf8')); } catch { return null; }
}

/**
 * 도메인 위임 JWT. `sub`(대신할 주소)를 인자로 받는다 — 고정해 두면 한 주소로만
 * 청할 수 있어 「무엇이 막혔는지」를 못 가린다(scripts/send-mail.mjs `--가린다` 참조).
 */
export function jwt만들기(키, 대신할주소 = 보내는주소) {
  const 지금 = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    iss: 키.client_email, sub: 대신할주소, scope: 갈래,
    aud: 'https://oauth2.googleapis.com/token', iat: 지금, exp: 지금 + 3600,
  })).toString('base64url');
  return `${h}.${b}.${createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url')}`;
}

/** 위임 토큰을 청한다. ⛔ 못 받으면 던진다 — 부르는 쪽(메일보내기)이 잡는다 */
export async function 위임토큰받기(키, 대신할주소 = 보내는주소, 부르기 = fetch) {
  const r = await 부르기('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt만들기(키, 대신할주소),
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error(j.error_description || j.error || ('token http ' + r.status));
  return j.access_token;
}

/**
 * ⭐ 실제로 한 통 보낸다 — server.mjs 와 scripts/send-mail.mjs 가 같이 쓰는 자리.
 *
 * ⛔ **절대 던지지 않는다.** 결제 뒤 자리에서 부르므로, 여기서 무엇이 막혀도
 *   호출자는 `{ ok:false, 왜 }`만 받고 계속 진행할 수 있어야 한다.
 */
export async function 메일보내기({
  받는곳, 제목, 글, 첨부들 = [], 보내는곳 = 보내는주소, 이름 = 보내는이름,
  대신할주소 = 보내는곳, 부르기 = fetch,
} = {}) {
  try {
    if (!받는곳 || !제목 || !글) return { ok: false, 왜: '받는곳·제목·글 가운데 빠진 것이 있다' };
    const 키 = 키읽기();
    if (!키) return { ok: false, 왜: '서비스 계정 키파일이 없다(GOOGLE_APPLICATION_CREDENTIALS)' };
    const 토큰 = await 위임토큰받기(키, 대신할주소, 부르기);
    const raw = 감싸기(편지만들기({ 받는곳, 제목, 글, 첨부들, 보내는곳, 이름 }));
    const r = await 부르기('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    const j = await r.json().catch(() => ({}));
    if (j.error) return { ok: false, 왜: j.error.message || 'gmail send 실패' };
    if (!j.id) return { ok: false, 왜: 'gmail 이 메시지 id 를 안 줬다' };
    return { ok: true, id: j.id };
  } catch (e) {
    return { ok: false, 왜: String(e && e.message ? e.message : e).slice(0, 200) };
  }
}
