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
import { readFileSync, existsSync, appendFileSync, writeFileSync } from 'node:fs';
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

/**
 * 보내는 주소. ⛔ 관리용(admin@)은 쓰지 않는다.
 *
 * 🔴 [2026-08-30] **`cs@klifedesign.net` 은 이 Workspace 의 «실제 사용자»가 아니다.**
 *   사장님이 도메인 전체 위임을 켜 주셨는데도 메일이 안 나가서 파고 재 봤다 —
 *   위임은 «걸렸고», 막힌 것은 **보내는 주소**였다. 없는 주소로는 토큰이 안 나온다
 *   (`invalid_grant: Invalid email or User ID`).
 *
 *   주소를 하나씩 넣어 재 본 결과 —
 *   ```
 *   ✅ 토큰 나옴 : admin@ · u2@ · u5@        ← Workspace 의 실제 사용자
 *   ⛔ 안 나옴   : cs@ · info@ · contact@    ← 아예 «없는 주소»다
 *   ```
 *   ⚠ 그러니 이 자가 기본값으로 들고 있던 `cs@` 는 **처음부터 못 보낼 주소**였다.
 *     「위임만 켜지면 된다」고 알고 있었던 것이 절반만 맞았다.
 *     ⭐ 배울 것 — 「막혔다」의 까닭을 «한 겹»에서 멈추면 못 고친다. 이 자는
 *       ①위임 ②주소 둘을 나눠 물을 줄 알면서도 ②를 재 볼 생각을 못 했다.
 *
 * ⭐ 그래서 **자리 번호로 그 자리 주소를 쓴다.** 여섯 자리가 각자 자기 이름으로 보낸다.
 * ⚠ 손님에게 보이는 `cs@` 로 보내려면 `admin.google.com` → 디렉터리 → 사용자에서
 *   **`cs` 를 «사용자»로 먼저 만들어야 한다.** 별칭으로는 안 된다.
 */
const 자리번호 = String(process.env.CLAUDE_SEAT ?? '').match(/^[1-9]$/)?.[0] ?? null;
export const 보내는주소 = process.env.MAIL_FROM
  ?? (자리번호 ? `u${자리번호}@klifedesign.net` : 'cs@klifedesign.net');
export const 보내는이름 = 'K Culture Wire';
export const 갈래 = 'https://www.googleapis.com/auth/gmail.send';

/**
 * 가르는 데 쓸 **기준 주소** — 실제로 있는 것이 «확실한» 주소여야 한다.
 * ⛔ 이 주소로 메일을 보내지 않는다. 토큰을 청해 보는 데만 쓴다.
 *
 * 🔴 [2026-08-30] 전에는 `u5@` 였다. 그런데 보내는 주소가 «자리 번호»를 따르게 되면서
 *   5번 자리에서는 **기준과 보낼 주소가 같아져 버린다** — 그러면 둘을 견줄 수가 없어
 *   이 자의 판단(①위임이 안 걸렸나 ②주소가 없나)이 통째로 죽는다.
 *   ⇒ 어느 자리에서도 겹치지 않는 `admin@` 을 기준으로 삼는다. 사장님 계정이라 존재가 확실하다.
 * ⚠ 「관리용 주소를 쓰지 않는다」는 **보내는** 주소 이야기다. 재 보는 데 쓰는 것은 별개다.
 */
export const 기준주소 = process.env.MAIL_PROBE ?? 'admin@klifedesign.net';

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

/**
 * 파일 이름으로 MIME 종류를 고른다. ⛔ 모르는 것은 «모른다»고 두고 octet-stream 을 쓴다 —
 *   지어낸 종류를 적으면 받는 쪽이 열지 못한다.
 */
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

/**
 * 첨부 이름을 헤더에 안전하게 적는다. ⛔ 한글 파일이름을 그대로 넣으면 깨진다 —
 *   제목과 같은 MIME 인코딩으로 감싼다. (2026-09-03 에 실측: 우리 보고서 이름이 다 한글이다)
 */
export function 첨부이름인코딩(이름) {
  return 제목인코딩(이름);
}

/**
 * 편지 한 통. 첨부가 있으면 multipart/mixed 로 짠다.
 *
 * 🔴 [2026-09-03] **사장님: 「pdf첨부 빠짐」**
 *   이 자에 «첨부 기능이 아예 없었다.** 그런데 나는 `--첨부=…` 를 붙여 보내고
 *   「첨부했다」고 믿었다. 인자() 가 모르는 인자를 조용히 버리기 때문이다.
 *   ⛔ **조용히 성공한 척하는 것이 제일 나쁘다** — CLAUDE.md 의 `undeploy` 사고와 같은 꼴이다.
 *   그래서 두 가지를 같이 고쳤다: (1) 첨부를 실제로 붙인다 (2) 모르는 인자를 «거부»한다.
 *   ⚠ 그 전에 나간 보고 메일 셋(9/3 06:51·07:07·16:30)에는 첨부가 «없이» 갔다.
 */
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
  ];
  for (const a of 첨부들) {
    줄들.push(
      `--${경계}`,
      `Content-Type: ${종류고르기(a.이름)}; name="${첨부이름인코딩(a.이름)}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${첨부이름인코딩(a.이름)}"`,
      '',
      a.내용.toString('base64').replace(/(.{76})/g, '$1\n'),
    );
  }
  줄들.push(`--${경계}--`, '');
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

/**
 * 🔴 [2026-09-03] **사장님: 「pdf첨부 빠짐」**
 *   이 자에 첨부 기능이 없던 시절, 나는 `--첨부=…` 를 붙여 보내고 「첨부했다」고 믿었다.
 *   인자() 가 모르는 인자를 **조용히 버렸기** 때문이다. 출력에 아무 말도 없었다.
 *   ⛔ **조용히 성공한 척하는 것이 제일 나쁘다** — CLAUDE.md 의 `undeploy` 사고와 같은 꼴이다.
 *      그때도 종료코드 0 이 나와 두 세션이 「지웠다」고 믿었다.
 *   ✅ 그래서 이 자는 **모르는 인자를 만나면 안 보낸다.** 오타 하나로 첨부가 빠지는 것보다
 *      아예 서는 것이 낫다.
 */
const 아는인자 = ['받는곳', '제목', '글', '첨부', '보내는곳', '이름'];
const 아는깃발 = ['--보낸다', '--selftest', '--자가시험', '--진단'];
export function 모르는인자찾기(argv, 아는것 = 아는인자, 깃발 = 아는깃발) {
  const 나온다 = [];
  for (const a of argv) {
    if (!a.startsWith('--')) continue;
    if (깃발.includes(a)) continue;
    const 이름 = a.slice(2).split('=')[0];
    if (아는것.includes(이름)) continue;
    나온다.push(a);
  }
  return 나온다;
}
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

  /* 🔴 [2026-09-03] 사장님 「pdf첨부 빠짐」 — 이 자에 첨부 기능이 «없었다».
     그런데 나는 --첨부 를 붙여 보내고 「첨부했다」고 믿었다. 아래 시험들이 그것을 막는다. */
  {
    const 붙인편지 = 편지만들기({
      받는곳: 'a@b.com', 제목: '보고', 글: '본문',
      첨부들: [{ 이름: '보고서.pdf', 내용: Buffer.from('PDF-1.7 어쩌고') }],
    });
    참('첨부가 있으면 multipart/mixed 다', 붙인편지.includes('multipart/mixed'));
    참('첨부 이름이 헤더에 든다', 붙인편지.includes('filename='));
    참('한글 첨부 이름을 MIME 으로 감싼다', 붙인편지.includes('=?UTF-8?B?'));
    참('PDF 종류를 맞게 적는다', 붙인편지.includes('application/pdf'));
    참('본문도 함께 든다', 붙인편지.includes(Buffer.from('본문', 'utf8').toString('base64')));
    참('첨부 내용이 base64 로 든다', 붙인편지.includes(Buffer.from('PDF-1.7 어쩌고').toString('base64')));
    참('경계가 닫힌다', 붙인편지.trimEnd().endsWith('--'));
    참('첨부가 없으면 예전처럼 text/plain 이다', 편지.includes('text/plain') && !편지.includes('multipart'));

    참('종류고르기 — xlsx', 종류고르기('가.xlsx').includes('spreadsheetml'));
    참('종류고르기 — 모르는 것은 octet-stream', 종류고르기('가.zzz') === 'application/octet-stream');

    /* 🔴 조용히 무시되던 그 인자를 이제 «거부»한다 */
    참('모르는 인자를 잡는다', 모르는인자찾기(['--받는곳=a', '--첨부=b.pdf', '--없는것=c']).length === 1);
    참('아는 인자는 안 잡는다', 모르는인자찾기(['--받는곳=a', '--제목=b', '--글=c', '--첨부=d', '--보낸다']).length === 0);
    참('오타를 잡는다 (--첨부파일)', 모르는인자찾기(['--첨부파일=a.pdf']).length === 1);
  }
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
  /* ⛔ 모르는 인자면 «안 보낸다». 오타 하나로 첨부가 빠지는 것보다 서는 것이 낫다 */
  {
    const 모름 = 모르는인자찾기(process.argv.slice(2));
    if (모름.length) {
      console.log(`\n🔴 모르는 인자 ${모름.length}개 — **안 보낸다.**`);
      for (const x of 모름) console.log(`   ${x}`);
      console.log(`   아는 인자: ${아는인자.map((x) => '--' + x + '=').join(' · ')} · ${아는깃발.join(' · ')}`);
      console.log('   ⛔ 2026-09-03 에 --첨부 가 조용히 무시되어 사장님께 첨부 없이 갔다. 그래서 세운다.');
      process.exit(1);
    }
  }
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

  /**
   * 첨부를 읽는다. `--첨부=a.pdf,b.xlsx` 처럼 쉼표로 여러 개.
   *
   * 🔴 [2026-09-03] **사장님: 「pdf첨부 빠짐」**
   *   이 자에 첨부 기능이 «아예 없었다». 그런데 나는 `--첨부=…` 를 붙여 보내고
   *   「첨부했다」고 믿었다. 인자() 가 모르는 인자를 조용히 버렸기 때문이다.
   *   ⛔ **조용히 성공한 척하는 것이 제일 나쁘다** — CLAUDE.md 의 `undeploy` 사고와 같은 꼴이다.
   *   ⚠ 그 전에 나간 보고 메일 셋(9/3 06:51 · 07:07 · 16:30)에는 첨부가 «없이» 갔다.
   *
   * ⛔ 파일이 없으면 **안 보낸다.** 첨부가 빠진 채로 나가는 것이 제일 나쁘다.
   * ⚠ 지메일 한 통 한도가 25MB 다. 넘으면 서고 알린다 — 잘라 보내지 않는다.
   */
  const 첨부들 = [];
  const 첨부값 = 인자('첨부');
  if (첨부값) {
    for (const p of 첨부값.split(',').map((x) => x.trim()).filter(Boolean)) {
      const 온길 = path.resolve(뿌리, p);
      if (!existsSync(온길)) {
        console.log(`\n🔴 --첨부 파일이 없다: ${p}  **안 보낸다.**`);
        console.log('   ⛔ 첨부가 빠진 채로 보내지 않는다. 2026-09-03 에 그렇게 나갔다.');
        process.exit(1);
      }
      첨부들.push({ 이름: path.basename(온길), 내용: readFileSync(온길) });
    }
    const 합 = 첨부들.reduce((a, b) => a + b.내용.length, 0);
    if (합 > 24 * 1024 * 1024) {
      console.log(`\n🔴 첨부 합이 ${(합 / 1048576).toFixed(1)}MB — 지메일 한도(25MB)를 넘는다. **안 보낸다.**`);
      process.exit(1);
    }
  }

  console.log(`\n── 보낼 것 ──────────────────────────────`);
  if (첨부들.length) {
    for (const a of 첨부들) console.log(`   첨부   ${a.이름} · ${(a.내용.length / 1024).toFixed(0)}KB`);
  } else {
    console.log('   첨부   ⬜ 없음 (--첨부=파일 로 붙인다)');
  }
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
    body: JSON.stringify({ raw: 감싸기(편지만들기({ 받는곳, 제목, 글, 첨부들 })) }),
  });
  const j2 = await r2.json();
  if (j2.error) { 막혔다('보내다가 막혔다', j2.error.message); process.exit(1); }
  console.log(`\n✅ 보냈다 — 메시지 id ${j2.id}`);
  console.log('   ⭐ 보낸 날을 문서에 적는다. 무응답을 「허락」으로 읽지 않기 위한 기준선이다.');

  /*
   * 🔴 [2026-08-31] **보낸 기록이 어디에도 안 남고 있었다.**
   *   사장님이 「2번 열리면 이메일도 보내라」 하셨는데 그때 Gmail 이 403 이라 못 보냈다.
   *   오늘 다시 하려니 **보냈는지 안 보냈는지 알 길이 없었다** — 메모를 뒤져도 안 나온다.
   *   ⇒ 「안 보낸 것으로 보고 다시 보낸다」로 갈 수밖에 없었다. 그건 짐작이다.
   * ⛔ 사람에게 나간 것은 «나갔다고 적는다». 안 적으면 다음 자리가 또 짐작한다.
   * ⚠ 받는곳·제목·id 만 적는다 — 본문은 «안» 적는다(개인 내용이 저장소에 남지 않게).
   */
  try {
    const 적을길 = path.join(뿌리, 'docs/보낸메일.tsv');
    const 칸 = String.fromCharCode(9);          /* 탭 — 소스에 날탭을 안 둔다 */
    const 줄끝 = String.fromCharCode(10);
    if (!existsSync(적을길)) {
      writeFileSync(적을길, ['보낸때', '보낸주소', '받는곳', '제목', '메시지id'].join(칸) + 줄끝);
    }
    /*
     * 🔴 [2026-08-31] 처음엔 `toISOString()` 을 썼다가 **12:40 에 보낸 메일이 03:40 으로 찍혔다.**
     *   그건 UTC 다. 우리 문서·메모·보고는 «전부» 한국시각이라, 섞이면 나중에 순서를 못 맞춘다.
     * ⛔ 시각은 어림하지도, 다른 시간대로 적지도 않는다. 무엇으로 적었는지 칸에 밝힌다.
     */
    const 때 = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16);
    const 한줄 = [때, 보내는주소, 받는곳, String(제목).split(칸).join(' '), j2.id].join(칸);
    appendFileSync(적을길, 한줄 + 줄끝);
    console.log(`   ✔ 기록했다 — docs/보낸메일.tsv (${때})`);
  } catch (e) {
    /* ⛔ 기록에 실패해도 «보낸 것»은 사실이다. 그것을 뒤집지 않는다 — 다만 알린다 */
    console.log(`   ⚠ **보내긴 했는데 기록을 못 남겼다** — ${String(e.message).slice(0, 70)}`);
    console.log('      ⛔ 다음 자리가 「안 보냈나」 하고 또 보낼 수 있다. 손으로 적어 두십시오.');
  }
}
