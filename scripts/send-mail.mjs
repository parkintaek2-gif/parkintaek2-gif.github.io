#!/usr/bin/env node
/**
 * send-mail.mjs — **회사 주소로 메일을 보낸다.** (Gmail API · 도메인 위임)
 *
 * ── 왜 미리 만드나 (2026-08-23 22:3x) ────────────────────────
 * 2번이 4번께 이렇게 지적했다 — 「'승인나면 바로 켜진다'는 틀렸습니다. 지금 미리 해두십시오.」
 * 같은 말이 나에게도 해당한다. 사장님이 Workspace 도메인 위임을 켜 주시는 순간
 * **그때부터 코드를 짜기 시작하면 그만큼 늦는다.** 그래서 위임이 없는 지금 미리 짓는다.
 *
 * 이것이 열리면 두 가지가 같이 풀린다 —
 * ```
 * ① 넷플릭스 자료 문의 발송   (2번 승인 · 사장님 서명줄 확인 대기)
 * ② 구독 확인메일             회원가입 4명이 전원 「미확인」인 까닭이 이것이다
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **`--보낸다` 없이는 한 통도 안 나간다.** 밖으로 나가는 것은 되돌릴 수 없다.
 * ⛔ 받는 주소가 비었거나 자리표(`<...>`·`example.com`)면 **세운다.** 짐작으로 안 보낸다.
 * ⛔ 열쇠를 화면에 안 찍는다. 보내는 주소(공개 식별자)까지만 적는다.
 * ⛔ 막히면 「무엇을 켜야 하는지」를 적는다 — 「실패」 한 마디는 사람 손을 또 쓰게 만든다.
 *   (2026-08-23 에 「GA4 Data API 승인」이라고 용어만 올려 하루를 잃었다. 같은 실수 안 한다)
 * ⛔ 받는 사람 주소를 저장소에 커밋하지 않는다 — 인자로 받는다.
 *
 * 쓰는 법
 *   node scripts/send-mail.mjs --시험                       위임이 켜졌나만 본다(안 보낸다)
 *   node scripts/send-mail.mjs --받는곳=a@b.com \
 *        --제목="..." --글=docs/편지.txt                    미리보기만 한다
 *   node scripts/send-mail.mjs --받는곳=a@b.com ... --보낸다  실제로 보낸다
 *   node scripts/send-mail.mjs --selftest
 */
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

(function 환경파일읽기() {
  try {
    const 본문 = readFileSync(path.resolve('.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const 값 = m[2].trim().replace(/^["']|["']$/g, '');
      if (process.env[m[1]] === undefined) process.env[m[1]] = 값;
    }
  } catch { /* 없으면 정상 */ }
})();

/** 보내는 주소. ⛔ 관리용(admin@)은 쓰지 않는다 — 손님에게 보이는 주소는 cs@ 다 */
export const 보내는주소 = process.env.MAIL_FROM ?? 'cs@klifedesign.net';
export const 보내는이름 = 'K Culture Wire';
export const 갈래 = 'https://www.googleapis.com/auth/gmail.send';

/** ⛔ 자리표를 실제 주소로 착각하지 않는다 */
export function 받을만한주소인가(주소) {
  const s = String(주소 ?? '').trim();
  if (!s) return { 된다: false, 까닭: '받는 주소가 비었다' };
  if (/[<>]/.test(s)) return { 된다: false, 까닭: '자리표가 그대로 있다(꺽쇠)' };
  if (/example\.(com|org|net)$/i.test(s)) return { 된다: false, 까닭: 'example 주소는 자리표다' };
  if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(s)) return { 된다: false, 까닭: '메일 주소 꼴이 아니다' };
  return { 된다: true, 까닭: null };
}

/**
 * RFC 2822 한 통. ⛔ 제목에 한글·한자가 들면 **그대로 넣으면 깨진다** —
 *   MIME 인코딩(=?UTF-8?B?...?=)으로 감싼다. 2026-08-23 에 이걸 빼고 짰다가 자가시험에서 걸렸다.
 */
export function 제목인코딩(제목) {
  const s = String(제목 ?? '');
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;
}

export function 편지만들기({ 받는곳, 제목, 글, 보내는곳 = 보내는주소, 이름 = 보내는이름 }) {
  const 줄들 = [
    `From: ${이름} <${보내는곳}>`,
    `To: ${받는곳}`,
    `Subject: ${제목인코딩(제목)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(String(글 ?? ''), 'utf8').toString('base64').replace(/(.{76})/g, '$1\n'),
  ];
  return 줄들.join('\r\n');
}

export const 감싸기 = (편지) => Buffer.from(편지, 'utf8').toString('base64url');

/** 막힌 것을 갈라 적는다. ⛔ 「실패」로 뭉개지 않는다 */
export function 무엇이막혔나(글) {
  const s = String(글 ?? '');
  if (/unauthorized_client|Client is unauthorized/i.test(s)) {
    return {
      무엇: '도메인위임-안됨',
      할것: 'Workspace 관리콘솔 → 보안 → API 제어 → 도메인 전체 위임 에서'
        + ' 서비스 계정 클라이언트 ID 를 더하고, 범위에 gmail.send 를 넣는다',
      주소: 'https://admin.google.com/ac/owl/domainwidedelegation',
    };
  }
  if (/gmail\.googleapis\.com|Gmail API has not been used/i.test(s)) {
    return {
      무엇: 'gmail-api-꺼짐',
      할것: 'Google Cloud 에서 「Gmail API」를 사용 설정한다',
      주소: 'https://console.cloud.google.com/apis/library/gmail.googleapis.com',
    };
  }
  /**
   * 🔴 처음엔 이것을 「보내는 주소가 틀렸다」 하나로 단정했다(2026-08-23 22:4x).
   *   그런데 `invalid_grant / Invalid email or User ID` 는 **두 가지 다**에서 난다 —
   *   ① 위임이 아직 안 걸렸을 때 ② 그 주소가 이 Workspace 사용자가 아닐 때.
   *   여기서는 둘을 **가릴 수 없다.** 하나로 단정하면 사람이 엉뚱한 화면을 뒤진다.
   * ⛔ 못 가리는 것을 가린 척하지 않는다. 둘 다 적고 확인 순서를 준다.
   */
  if (/invalid_grant/i.test(s)) {
    return {
      무엇: '위임안됨-또는-주소없음 (둘 중 하나 · 여기서는 못 가린다)',
      할것: `① 도메인 전체 위임에 클라이언트 ID 가 들어갔나 · 범위에 ${갈래} 가 있나`
        + `\n            ② ${보내는주소} 가 이 Workspace 의 **실제 사용자**인가`
        + '(별칭·그룹 주소는 안 되는 경우가 있다)'
        + '\n            → ①을 먼저 본다. ①을 안 걸면 ②가 맞아도 이 오류가 난다',
      주소: 'https://admin.google.com/ac/owl/domainwidedelegation',
    };
  }
  if (/PERMISSION_DENIED|403|insufficient/i.test(s)) {
    return {
      무엇: '범위부족',
      할것: `위임 범위에 ${갈래} 가 들어 있는지 본다`,
      주소: 'https://admin.google.com/ac/owl/domainwidedelegation',
    };
  }
  return { 무엇: '모름', 할것: '구글이 준 말을 그대로 읽는다', 주소: null };
}

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = (이름) => process.argv.find((a) => a.startsWith(`--${이름}=`))?.split('=').slice(1).join('=');
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (n, v) => { if (v) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}`); } };

  /* ⛔ 자리표를 실제 주소로 착각하면 엉뚱한 곳으로 편지가 간다 */
  참('빈 주소는 세운다', !받을만한주소인가('').된다);
  참('꺽쇠 자리표는 세운다', !받을만한주소인가('<받는곳>').된다);
  참('example 주소는 세운다', !받을만한주소인가('a@example.com').된다);
  참('꼴이 아니면 세운다', !받을만한주소인가('그냥글자').된다);
  참('참한 주소는 통과', 받을만한주소인가('press@netflix.com').된다);

  /* 🔴 한글 제목을 그대로 넣으면 받는 쪽에서 깨진다 */
  참('영문 제목은 그대로', 제목인코딩('Hello there') === 'Hello there');
  참('한글 제목은 MIME 으로 감싼다', 제목인코딩('안녕').startsWith('=?UTF-8?B?'));
  참('감싼 제목을 되돌릴 수 있다',
    Buffer.from(제목인코딩('안녕').slice(10, -2), 'base64').toString('utf8') === '안녕');

  const 편지 = 편지만들기({ 받는곳: 'a@b.com', 제목: 'Subject line', 글: 'Body here' });
  참('From 에 보내는 주소가 든다', 편지.includes(`<${보내는주소}>`));
  참('To 가 든다', 편지.includes('To: a@b.com'));
  참('제목이 든다', 편지.includes('Subject: Subject line'));
  참('본문이 base64 로 들어간다',
    편지.includes(Buffer.from('Body here', 'utf8').toString('base64')));
  /* ⛔ 줄 끝은 CRLF 다. LF 만 쓰면 어떤 서버는 머리와 몸을 못 가른다 */
  참('머리와 몸을 CRLF 빈 줄로 가른다', 편지.includes('\r\n\r\n'));
  참('base64url 로 감싼다', !/[+/=]/.test(감싸기('테스트 본문입니다')));

  /* 🔴 막힌 것을 갈라 적어야 사람이 무엇을 켤지 안다 */
  참('도메인 위임 안 된 것을 알아본다',
    무엇이막혔나('{"error":"unauthorized_client"}').무엇 === '도메인위임-안됨');
  참('Gmail API 꺼진 것을 알아본다',
    무엇이막혔나('Gmail API has not been used in project 1').무엇 === 'gmail-api-꺼짐');
  /* ⛔ invalid_grant 를 **하나로 단정하지 않는다** — 위임 미설정과 주소 없음 둘 다에서 난다 */
  참('invalid_grant 를 하나로 단정하지 않는다',
    /둘 중 하나/.test(무엇이막혔나('{"error":"invalid_grant"}').무엇));
  참('그때 확인 순서를 준다',
    무엇이막혔나('invalid_grant').할것.includes('①을 먼저 본다'));
  참('모르는 것은 모른다고 한다', 무엇이막혔나('무슨 말인지 모름').무엇 === '모름');
  참('켤 주소를 같이 준다', 무엇이막혔나('unauthorized_client').주소.includes('admin.google.com'));
  /* ⛔ 관리용 주소를 보내는 주소로 쓰지 않는다 */
  참('보내는 주소가 admin@ 이 아니다', !보내는주소.startsWith('admin@'));
  참('읽기가 아니라 보내기 갈래를 청한다', 갈래.endsWith('gmail.send'));

  console.log(`메일 보내는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) {
    console.log('⚠ 서비스 계정 키파일이 없다 — **못 보냈다.**');
    process.exit(0);
  }
  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));

  const jwt만들기 = () => {
    const 지금 = Math.floor(Date.now() / 1000);
    const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    /* ⭐ `sub` 가 도메인 위임의 핵심이다 — 「이 사람을 대신해서」라는 뜻 */
    const b = Buffer.from(JSON.stringify({
      iss: 키.client_email, sub: 보내는주소, scope: 갈래,
      aud: 'https://oauth2.googleapis.com/token', iat: 지금, exp: 지금 + 3600,
    })).toString('base64url');
    return `${h}.${b}.${createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url')}`;
  };

  const 막혔다 = (제목, 글) => {
    const m = 무엇이막혔나(글);
    console.log(`\n🔴 ${제목} — **못 보냈다.**`);
    console.log(`   막힌 것: ${m.무엇}`);
    console.log(`   할 것  : ${m.할것}`);
    if (m.주소) console.log(`   주소   : ${m.주소}`);
    console.log(`   ⭐ 위임에 넣을 클라이언트 ID: ${키.client_id ?? '(키파일에 없다)'}`);
    console.log(`   ⭐ 위임에 넣을 범위        : ${갈래}`);
    console.log(`   구글이 준 말: ${String(글).slice(0, 260)}`);
    console.log('\n⛔ 이것은 「보냈다」가 아니다. **아직 못 보낸 것**이다.');
  };

  console.log(`메일 — 보내는 주소 ${보내는주소} · 서비스 계정 ${키.client_email}`);

  let 토큰 = null;
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt만들기(),
      }),
    });
    const j = await r.json();
    if (!j.access_token) throw new Error(JSON.stringify(j));
    토큰 = j.access_token;
  } catch (e) {
    막혔다('위임 토큰을 못 받았다', e.message);
    process.exit(0);
  }
  console.log('✅ 위임 토큰 받았다 — 이 주소로 보낼 수 있다');

  if (process.argv.includes('--시험')) {
    console.log('\n⭐ 시험만 했다. 한 통도 안 보냈다.');
    console.log('   보내려면 — --받는곳= --제목= --글=<파일> --보낸다');
    process.exit(0);
  }

  const 받는곳 = 인자('받는곳');
  const 제목 = 인자('제목');
  const 글파일 = 인자('글');
  const 봐 = 받을만한주소인가(받는곳);
  if (!봐.된다) {
    console.log(`\n🔴 받는 주소를 못 믿는다 — ${봐.까닭}. **안 보낸다.**`);
    console.log('   --받는곳=<실제 주소> 를 준다. ⛔ 짐작으로 보내지 않는다.');
    process.exit(1);
  }
  if (!제목) { console.log('\n🔴 --제목= 이 없다. **안 보낸다.**'); process.exit(1); }
  if (!글파일 || !existsSync(path.resolve(뿌리, 글파일))) {
    console.log(`\n🔴 --글= 파일이 없다(${글파일}). **안 보낸다.**`);
    process.exit(1);
  }
  const 글 = readFileSync(path.resolve(뿌리, 글파일), 'utf8');

  console.log(`\n── 보낼 것 ──────────────────────────────`);
  console.log(`   받는곳 ${받는곳}`);
  console.log(`   제목   ${제목}`);
  console.log(`   본문   ${글.split(/\r?\n/).length}줄 · ${글.length}자`);
  console.log(`   첫 줄  ${글.split(/\r?\n/)[0]}`);

  if (!process.argv.includes('--보낸다')) {
    console.log('\n⭐ 미리보기만 했다. **한 통도 안 보냈다.**');
    console.log('   정말 보내려면 --보낸다 를 붙인다. ⛔ 나간 편지는 되돌릴 수 없다.');
    process.exit(0);
  }

  const r2 = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: 감싸기(편지만들기({ 받는곳, 제목, 글 })) }),
  });
  const j2 = await r2.json();
  if (j2.error) { 막혔다('보내다가 막혔다', j2.error.message); process.exit(1); }
  console.log(`\n✅ 보냈다 — 메시지 id ${j2.id}`);
  console.log('   ⭐ 보낸 날을 문서에 적는다. 무응답을 「허락」으로 읽지 않기 위한 기준선이다.');
}
