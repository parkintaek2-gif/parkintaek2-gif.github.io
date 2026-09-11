#!/usr/bin/env node
/**
 * count-data-inquiries.mjs — 「/data」 값표 페이지가 낸 문의 메일 수를 센다.
 *
 * ── 왜 만드나 (2026-09-11 · 2번) ────────────────────────────
 * 5번 22:31 방송: 「2번은 값표 지면에 들어온 문의를 셉니다」. 값표 문안(docs/값표
 * -지면-문안-5번.md Ⅶ)도 같은 것을 요구한다 — 「붙인 날부터 메일 문의 수를 셉니다.
 * 안 오면 «안 온다»고 적습니다」. /data 「How to buy」는 admin@klifedesign.net 으로
 * 메일하라고 안내한다 — 그 주소로 온 문의를 세는 자다.
 *
 * ⛔ 이 자가 지키는 것
 * ⛔ **본문을 읽지 않는다.** gmail.metadata 범위만 청한다 — 제목·보낸이·날짜만 본다.
 *   손님 문의 내용을 AI가 열어 보는 것은 우리 강령(사적인 일을 다루지 않는다)에 안 맞는다.
 * ⛔ 막히면 「안 된다」로 끝내지 않는다 — **무엇을 켜야 하는지**(클라이언트 ID·범위)를 적는다.
 *   send-mail.mjs 가 gmail.send 범위로 미리 지어 두고 위임을 기다린 것과 같은 방법이다.
 * ⛔ 세는 것만 한다 — 답장하거나 표시하지 않는다.
 *
 * 쓰는 법
 *   node scripts/count-data-inquiries.mjs                오늘(값표 배포일) 이후로 센다
 *   node scripts/count-data-inquiries.mjs --부터=2026-09-11
 *   node scripts/count-data-inquiries.mjs --selftest
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

/** ⛔ 값표 「How to buy」가 안내하는 그 주소, 그대로 쓴다 — 짐작으로 다른 주소를 넣지 않는다. */
export const 받는주소 = 'admin@klifedesign.net';
/** ⛔ 읽기 전체(gmail.readonly)가 아니라 «머리글만»(gmail.metadata) — 본문을 열지 않는다. */
export const 갈래 = 'https://www.googleapis.com/auth/gmail.metadata';
/** 값표를 지면에 얹은 날 — 이 날짜부터 센다(2026-09-11 19:3x 배포, 커밋 7988c2644). */
export const 배포일 = '2026-09-11';

export function 무엇이막혔나(오류글) {
  const t = String(오류글 || '');
  if (/invalid_grant/i.test(t) && /Invalid email or User ID/i.test(t)) {
    return { 무엇: '위임 대상 주소가 이 Workspace 의 실제 사용자가 아니다', 할것: '받는주소 철자 확인', 주소: 받는주소 };
  }
  if (/invalid_grant/i.test(t) && /unauthorized/i.test(t)) {
    return { 무엇: '도메인 전체 위임에 이 범위가 아직 없다', 할것: 'Workspace 관리 콘솔 → 보안 → API 제어 → 도메인 전체 위임에서 아래 클라이언트 ID 항목에 이 범위를 추가한다' };
  }
  if (/unauthorized_client/i.test(t)) {
    return { 무엇: '도메인 전체 위임에 이 범위(gmail.metadata)가 아직 없다 — gmail.send만 등록돼 있다', 할것: 'Workspace 관리 콘솔 → 보안 → API 제어 → 도메인 전체 위임 → 아래 클라이언트 ID 항목의 범위 칸에 이 범위를 «추가»(기존 gmail.send는 그대로 두고 쉼표로 붙인다)한다' };
  }
  if (/scope/i.test(t)) return { 무엇: '범위가 모자라거나 틀렸다', 할것: '범위 철자·클라이언트 ID 위임 등록을 확인한다' };
  return { 무엇: '알 수 없는 오류', 할것: '구글이 준 말 그대로를 사장님/5번께 옮긴다' };
}

async function jwt만들기(키, 대신할주소) {
  const 지금 = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    iss: 키.client_email, sub: 대신할주소, scope: 갈래,
    aud: 'https://oauth2.googleapis.com/token', iat: 지금, exp: 지금 + 3600,
  })).toString('base64url');
  return `${h}.${b}.${createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url')}`;
}

async function 토큰청하기(키, 대신할주소) {
  const assertion = await jwt만들기(키, 대신할주소);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const j = await r.json();
  if (!r.ok) { const e = new Error(j.error_description || j.error || 'token error'); e.raw = JSON.stringify(j); throw e; }
  return j.access_token;
}

/** 머리글(From·Subject·Date)만 받는다 — 본문(body)은 청하지 않는다. */
async function 문의세기(토큰, 부터) {
  const q = encodeURIComponent(`to:${받는주소} after:${부터.replace(/-/g, '/')}`);
  const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${받는주소}/messages?q=${q}`,
    { headers: { Authorization: `Bearer ${토큰}` } });
  const listJson = await listRes.json();
  if (!listRes.ok) { const e = new Error(listJson.error?.message || 'list error'); e.raw = JSON.stringify(listJson); throw e; }
  const ids = (listJson.messages || []).map((m) => m.id);
  const 목록 = [];
  for (const id of ids) {
    const mRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/${받는주소}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=From`,
      { headers: { Authorization: `Bearer ${토큰}` } },
    );
    const mJson = await mRes.json();
    if (!mRes.ok) continue;
    const H = Object.fromEntries((mJson.payload?.headers || []).map((h) => [h.name, h.value]));
    목록.push({ from: H.From || '(모름)', subject: H.Subject || '(제목 없음)', date: H.Date || '' });
  }
  return 목록;
}

export function 자가시험() {
  const 것 = []; const 참 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  참('받는주소가 값표 문안과 같다', 받는주소 === 'admin@klifedesign.net');
  참('범위가 metadata다 — 본문을 청하지 않는다', 갈래.endsWith('gmail.metadata'));
  참('범위가 readonly 가 아니다(본문까지 청하는 더 넓은 범위를 안 쓴다)', !갈래.includes('readonly'));
  참('무엇이막혔나: invalid_grant 이메일 오류를 알아본다', 무엇이막혔나('invalid_grant: Invalid email or User ID').무엇.includes('실제 사용자'));
  참('무엇이막혔나: 범위 없음을 알아본다', 무엇이막혔나('invalid_grant: unauthorized_client').무엇.includes('범위'));
  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`문의세기 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  process.exit(자가시험() ? 0 : 1);
}

if (내가실행됐다 && !process.argv.includes('--selftest')) {
  if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 세지 않는다.'); process.exit(1); }
  console.log('');

  const 부터인자 = process.argv.find((x) => x.startsWith('--부터='));
  const 부터 = 부터인자 ? 부터인자.slice(4) : 배포일;

  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) {
    console.log('⚠ 서비스 계정 키파일이 없다 — **못 셌다.**');
    process.exit(0);
  }
  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));

  try {
    const 토큰 = await 토큰청하기(키, 받는주소);
    const 목록 = await 문의세기(토큰, 부터);
    console.log(`■ ${받는주소} · ${부터} 이후 문의 ${목록.length}건`);
    for (const m of 목록) console.log(`   ${m.date} · ${m.from} · ${m.subject}`);
    if (목록.length === 0) console.log('⬜ 아직 안 왔다. 안 왔다고 그대로 적는다.');
  } catch (e) {
    const m = 무엇이막혔나(e.raw || e.message);
    console.log(`\n🔴 못 셌다 — ${m.무엇}`);
    console.log(`   할 것: ${m.할것}`);
    console.log(`   ⭐ 위임에 넣을 클라이언트 ID: ${키.client_id ?? '(키파일에 없다)'}`);
    console.log(`   ⭐ 위임에 넣을 범위        : ${갈래}`);
    console.log(`   구글이 준 말: ${String(e.raw || e.message).slice(0, 260)}`);
    console.log('\n⛔ 이것은 「0건」이 아니다. **아직 못 잰 것**이다.');
  }
}
