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

/**
 * 가르는 데 쓸 **기준 주소** — 실제로 있는 것이 확실한 주소여야 한다.
 * ⚠ 내 자리 주소(u5@)를 쓴다. 이 주소로 로그인해 일하고 있으니 존재가 확실하다.
 * ⛔ 이 주소로 메일을 보내지 않는다. 토큰을 청해 보는 데만 쓴다.
 */
export const 기준주소 = process.env.MAIL_PROBE ?? 'u5@klifedesign.net';

/**
 * ⭐ 구글이 준 «오류 글자»를 읽는다.
 *
 * 2026-08-24 에 두 주소로 토큰을 청해 보니 구글이 **서로 다른 말**을 돌려줬고,
 * 그 글자에 답이 들어 있었다 —
 *
 *   `cs@klifedesign.net` → `Invalid email or User ID`
 *       ⇒ 그 주소가 Workspace 사용자가 아니다(별칭이거나 없다)
 *   `u5@klifedesign.net` → `Client is unauthorized to retrieve access tokens using this method`
 *       ⇒ 클라이언트 ID 가 도메인 전체 위임에 없다
 *
 * 🔴 그래서 **둘이 동시에 막혀 있었다.** 「둘 중 하나」가 아니라 둘 다였다.
 *   위임만 켜도 `cs@` 로는 여전히 못 보낸다 — 그것을 미리 말해야 사장님이 두 번 안 하신다.
 * ⛔ 모르는 글자를 아는 척하지 않는다 — 못 알아보면 `'모름'` 이다.
 * ⛔ 「위임이없다」가 「주소가없다」를 덮지 않는다 — 둘이 같이 올 수 있으므로 주소를 먼저 본다.
 */
export function 오류글읽기(글) {
  const t = String(글 ?? '');
  if (!t.trim()) return '없다';
  if (/Invalid email or User ID/i.test(t)) return '주소가없다';
  if (/unauthorized|not authorized/i.test(t)) return '위임이없다';
  if (/scope/i.test(t)) return '범위가모자라다';
  return '모름';
}
/**
 * 두 주소의 토큰 결과로 **무엇이 막혔는지 가린다.**
 *
 * 🔴 왜 필요한가 — 구글이 둘 다 `invalid_grant` 로만 답할 때가 있다. 그래서 이 자는 오래
 *   「위임안됨-또는-주소없음 (둘 중 하나 · 여기서는 못 가린다)」로 적어 왔다.
 *   정직했지만 사장님이 무엇을 하실지 정하기에는 모자랐다.
 * ⭐ 실제로 있는 주소(기준)로도 청해 보면 갈린다. 권한을 더 얻지 않아도 된다.
 * ⛔ 짐작으로 한쪽을 고르지 않는다. 두 결과가 다 있어야 판정한다 —
 *   하나만 있으면 「못 가렸다」다.
 * ⚠ 이 판정은 «됐나/안 됐나» 만 본다. 더 자세한 것은 `오류글읽기` 가 글자에서 읽는다.
 */
export function 가름판정(보낼주소됐나, 기준주소됐나) {
  if (typeof 보낼주소됐나 !== 'boolean' || typeof 기준주소됐나 !== 'boolean') {
    return { 꼴: '못가렸다', 말: '두 결과가 다 있어야 가린다' };
  }
  if (보낼주소됐나 && 기준주소됐나) {
    return { 꼴: '위임됐다', 말: '위임이 걸렸고 보낼 주소도 실제 사용자다 — 이제 보낼 수 있다' };
  }
  if (!보낼주소됐나 && 기준주소됐나) {
    return {
      꼴: '주소없다',
      말: '위임은 걸려 있다. 보낼 주소가 이 Workspace 의 실제 사용자가 아니다'
        + ' (별칭이거나 없다). 실제 사용자 주소로 MAIL_FROM 을 바꾼다',
    };
  }
  if (보낼주소됐나 && !기준주소됐나) {
    /* ⚠ 이 꼴은 뜻밖이다 — 기준 주소가 틀렸을 수 있다. 단정하지 않는다 */
    return { 꼴: '기준이수상하다', 말: '보낼 주소는 되는데 기준 주소가 안 된다 — 기준 주소를 다시 고른다' };
  }
  return {
    꼴: '위임안됐다',
    말: '두 주소 다 안 된다 — 클라이언트 ID 가 도메인 전체 위임에 아직 없다',
  };
}
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

  /* 🔴 두 경우를 가리는 판단 — 사장님께 「못 가린다」고 말씀드린 그 자리다 */
  참('둘 다 되면 위임됐다', 가름판정(true, true).꼴 === '위임됐다');
  참('둘 다 안 되면 위임이 안 걸린 것', 가름판정(false, false).꼴 === '위임안됐다');
  참('기준만 되면 그 주소가 없는 것', 가름판정(false, true).꼴 === '주소없다');
  참('보낼 것만 되면 기준이 수상한 것', 가름판정(true, false).꼴 === '기준이수상하다');
  /* ⛔ 하나만 있으면 가리지 않는다 — 짐작으로 한쪽을 고르면 사장님이 헛일을 하신다 */
  참('결과가 하나면 못 가렸다', 가름판정(true, null).꼴 === '못가렸다');
  참('결과가 없으면 못 가렸다', 가름판정(undefined, undefined).꼴 === '못가렸다');
  참('글자를 참으로 안 본다', 가름판정('true', 'true').꼴 === '못가렸다');
  참('판정마다 무엇을 할지 적혀 있다',
    ['위임됐다', '위임안됐다', '주소없다', '기준이수상하다']
      .every((k) => [가름판정(true, true), 가름판정(false, false), 가름판정(false, true),
        가름판정(true, false)].some((r) => r.꼴 === k && (r.말 ?? "").length > 20)));
  /* 🔴 구글이 준 글자를 읽는다 — 두 주소가 서로 다른 말을 돌려줬다(2026-08-24) */
  참('주소가 없다는 말을 알아본다', 오류글읽기('Invalid email or User ID') === '주소가없다');
  참('위임이 없다는 말을 알아본다',
    오류글읽기('Client is unauthorized to retrieve access tokens using this method') === '위임이없다');
  참('범위가 모자란 말을 알아본다', 오류글읽기('invalid_scope: bad scope') === '범위가모자라다');
  참('빈 글은 없다', 오류글읽기('') === '없다');
  참('빈 값도 안 죽는다', 오류글읽기(null) === '없다');
  참('모르는 글자는 모름이다', 오류글읽기('something else entirely') === '모름');
  /* ⛔ 「위임이없다」가 「주소가없다」를 덮지 않는다 — 둘이 같이 올 수 있다 */
  참('주소 말이 위임 말보다 먼저다',
    오류글읽기('Invalid email or User ID; client unauthorized') === '주소가없다');

  참('기준 주소가 보낼 주소와 다르다', 기준주소 !== 보내는주소);

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

  /**
   * 🔴 `sub` 를 인자로 받게 고쳤다 — 두 주소로 청해 봐야 **무엇이 막혔는지 가려진다.**
   *   고정해 두면 `invalid_grant` 하나만 보고 끝나서 사장님께 「둘 중 하나」밖에 못 드린다.
   */
  const jwt만들기 = (대신할주소 = 보내는주소) => {
    const 지금 = Math.floor(Date.now() / 1000);
    const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    /* ⭐ `sub` 가 도메인 위임의 핵심이다 — 「이 사람을 대신해서」라는 뜻 */
    const b = Buffer.from(JSON.stringify({
      iss: 키.client_email, sub: 대신할주소, scope: 갈래,
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
  /**
   * ⭐ `--가린다` — **토큰만 청해서 무엇이 막혔는지 가린다. 메일은 안 보낸다.**
   *   사장님께 「제 자가 두 경우를 못 가립니다」라고 말씀드린 그 자리를 메운다.
   * ⛔ 짐작으로 한쪽을 고르지 않는다. 두 주소를 다 청해 보고 `가름판정` 이 정한다.
   */
  if (process.argv.includes('--가린다')) {
    const 청해보기 = async (주소) => {
      try {
        const r = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt만들기(주소),
          }),
        });
        const j = await r.json();
        return { 됐나: !!j.access_token, 말: j.error_description ?? j.error ?? '' };
      } catch (e) { return { 됐나: false, 말: `그물이 막혔다: ${e.message}` }; }
    };

    console.log(`도메인 위임을 가린다 — 메일은 **안 보낸다**, 토큰만 청한다`);
    console.log(`  클라이언트 ID : ${키.client_id ?? '(키파일에 없다)'}`);
    console.log(`  범위          : ${갈래}`);
    console.log(`  보낼 주소     : ${보내는주소}`);
    console.log(`  기준 주소     : ${기준주소}  (실제로 있는 것이 확실한 주소)\n`);

    const 보낼것 = await 청해보기(보내는주소);
    const 기준것 = await 청해보기(기준주소);
    console.log(`  ${보내는주소.padEnd(28)} ${보낼것.됐나 ? '✅ 토큰 받았다' : '🔴 못 받았다'}`
      + (보낼것.말 ? `  (${보낼것.말})` : ''));
    console.log(`  ${기준주소.padEnd(28)} ${기준것.됐나 ? '✅ 토큰 받았다' : '🔴 못 받았다'}`
      + (기준것.말 ? `  (${기준것.말})` : ''));

    const 판 = 가름판정(보낼것.됐나, 기준것.됐나);
    const 표 = { 위임됐다: '✅', 위임안됐다: '🔴', 주소없다: '🔴', 기준이수상하다: '⚠', 못가렸다: '⚠' };
    console.log(`\n${표[판.꼴] ?? '⚠'} ${판.꼴} — ${판.말}`);

    /**
     * ⭐ 구글이 준 글자까지 읽는다 — 「둘 다 안 된다」 안에 **서로 다른 두 문제**가
     *   숨어 있을 수 있다. 2026-08-24 에 실제로 그랬다.
     * ⛔ 하나만 말하면 사장님이 위임을 켜신 뒤에도 안 되어 두 번 하시게 된다.
     */
    const 보낼왜 = 오류글읽기(보낼것.말);
    const 기준왜 = 오류글읽기(기준것.말);
    const 할일 = [];
    if (보낼왜 === '위임이없다' || 기준왜 === '위임이없다') {
      할일.push({
        무엇: '위임이 안 걸려 있다',
        어디: 'admin.google.com/ac/owl/domainwidedelegation → 「새로 추가」',
        값: `클라이언트 ID ${키.client_id} · 범위 ${갈래}`,
      });
    }
    if (보낼왜 === '주소가없다') {
      할일.push({
        무엇: `${보내는주소} 가 Workspace 실제 사용자가 아니다(별칭이거나 없다)`,
        어디: 'admin.google.com/ac/users 에서 그 이름을 찾아 «사용자»인지 본다',
        값: '실제 사용자 주소를 .env 의 MAIL_FROM 에 넣는다',
      });
    }
    if (기준왜 === '범위가모자라다' || 보낼왜 === '범위가모자라다') {
      할일.push({ 무엇: '위임 범위가 모자라다', 어디: '같은 화면에서 그 줄을 고친다', 값: `범위 ${갈래}` });
    }

    if (할일.length) {
      console.log(`\n## 막힌 것이 ${할일.length}가지다 — ⛔ 하나만 고치면 여전히 안 된다`);
      할일.forEach((h, n) => {
        console.log(`\n  ${n + 1}) ${h.무엇}`);
        console.log(`     어디: ${h.어디}`);
        console.log(`     값  : ${h.값}`);
      });
    }
    if (보낼왜 === '모름' || 기준왜 === '모름') {
      console.log('\n⚠ 구글이 준 글자 중 **내가 못 알아본 것**이 있다 — 아는 척하지 않는다:');
      if (보낼왜 === '모름') console.log(`   ${보내는주소}: ${보낼것.말}`);
      if (기준왜 === '모름') console.log(`   ${기준주소}: ${기준것.말}`);
    }

    if (판.꼴 === '위임안됐다') {
      console.log('\n사장님이 누르실 자리 —');
      console.log('  ① admin.google.com/ac/owl/domainwidedelegation');
      console.log('  ② 「새로 추가」');
      console.log(`  ③ 클라이언트 ID: ${키.client_id}`);
      console.log(`     OAuth 범위  : ${갈래}`);
      console.log('  ④ 「승인」');
    }
    if (판.꼴 === '주소없다') {
      console.log('\n할 것 — 위임은 됐다. 보낼 주소를 실제 사용자로 바꾼다:');
      console.log('  admin.google.com/ac/users 에서 그 이름을 찾아 «사용자»인지 본다');
      console.log('  실제 사용자 주소를 .env 의 MAIL_FROM 에 넣는다');
    }
    console.log('\n⛔ 이 갈래는 메일을 보내지 않았다. 보내려면 --보낸다 를 준다.');
    process.exit(판.꼴 === '위임됐다' ? 0 : 1);
  }

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
