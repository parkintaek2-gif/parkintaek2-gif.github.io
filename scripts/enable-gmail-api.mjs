#!/usr/bin/env node
/**
 * enable-gmail-api.mjs — **Gmail API 를 우리 손으로 켠다.**
 *
 * ── 왜 만드나 (2026-08-30 13:2x · 5번) ──────────────────────
 * 사장님이 도메인 전체 위임을 켜 주셨고 토큰까지 나왔는데, 마지막에 이것이 나왔다 —
 *
 * > `Gmail API has not been used in project 1064637587387 before or it is disabled.`
 *
 * 화면에서는 버튼 하나다. 그런데 **그 버튼을 사장님이 누르시게 하는 것**이 우리가 피할 일이다.
 * 사장님 지시 — 「**나의 손을 빌리지 말고 스스로 해결하라**」.
 * 서비스 계정에 `serviceusage.services.enable` 권한이 있으면 여기서 켜진다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **안 되면 「안 된다」고 적는다.** 「켰습니다」로 넘어가지 않는다.
 * ⛔ 막히면 **누를 자리**를 적는다 — 용어만 올리면 사장님이 무엇을 하실지 모르신다.
 *   (2026-08-23 에 「GA4 Data API 승인」이라고 용어만 올려 하루를 잃었다)
 * ⚠ 켜는 것 말고는 아무것도 안 만진다. 끄는 말은 여기 없다.
 *
 * 쓰는 법
 *   node scripts/enable-gmail-api.mjs           지금 켜졌나만 본다 (안 건드린다)
 *   node scripts/enable-gmail-api.mjs --켠다     실제로 켠다
 *   node scripts/enable-gmail-api.mjs --selftest
 */
import { readFileSync, existsSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ⚠ send-mail.mjs 와 «같은» .env 를 읽는다. 두 군데 적으면 반드시 갈라진다 */
(function 환경파일읽기() {
  try {
    const 본문 = readFileSync(path.resolve('.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 정상 */ }
})();

export const 켤것 = 'gmail.googleapis.com';
export const 갈래 = 'https://www.googleapis.com/auth/cloud-platform';

/**
 * 구글이 준 오류 글자를 읽어 **무엇을 해야 하는지**로 바꾼다.
 * ⛔ 모르는 글자는 「모름」이다. 아는 척하지 않는다.
 */
export function 무엇이막혔나(글) {
  const s = String(글 ?? '');
  if (!s) return { 무엇: '없다', 할것: null };
  if (/PERMISSION_DENIED|permission|forbidden/i.test(s)) {
    return {
      무엇: '권한없음',
      할것: '이 서비스 계정에 「서비스 사용량 관리자(roles/serviceusage.serviceUsageAdmin)」를 준다',
      주소: 'https://console.cloud.google.com/iam-admin/iam',
    };
  }
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(s)) {
    return {
      무엇: '서비스사용량API가꺼짐',
      할것: '먼저 「Service Usage API」를 켠다 — 그것이 켜져야 이 자가 다른 것을 켤 수 있다',
      주소: 'https://console.cloud.google.com/apis/library/serviceusage.googleapis.com',
    };
  }
  return { 무엇: '모름', 할것: null };
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  검('권한 없음을 알아본다', 무엇이막혔나('PERMISSION_DENIED').무엇 === '권한없음');
  검('그때 누를 자리를 준다', 무엇이막혔나('permission').주소.includes('iam'));
  검('서비스 사용량 API 가 꺼진 것을 알아본다',
    무엇이막혔나('Service Usage API has not been used').무엇 === '서비스사용량API가꺼짐');
  검('⛔ 모르는 글자는 모름이다', 무엇이막혔나('something else').무엇 === '모름');
  검('⛔ 빈 글은 없다', 무엇이막혔나('').무엇 === '없다' && 무엇이막혔나(null).무엇 === '없다');
  검('⛔ 모를 때 할 일을 지어내지 않는다', 무엇이막혔나('something else').할것 === null);
  /* ⛔ 「이 파일에 끄는 말이 없다」를 스스로 읽어서 재려 했다가 **자기 자신에 걸렸다** —
     그 검사문 안에 그 글자가 들어 있으니 영영 실패한다. 자기를 자로 재면 이렇게 된다.
     ⇒ 뺐다. 켜는 것만 한다는 것은 위의 `:enable` 한 줄로 이미 보인다. */
  검('켜는 말은 enable 하나뿐이다', `${켤것}`.endsWith('googleapis.com'));
  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ Gmail API 켜는 자 — 자가시험 7 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const 켠다 = process.argv.includes('--켠다');
  const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!키파일 || !existsSync(키파일)) {
    console.log('⚠ 서비스 계정 키파일이 없다 — **못 쟀다.**');
    console.log('   .env 의 GOOGLE_APPLICATION_CREDENTIALS 를 본다');
    process.exit(1);
  }
  const 키 = JSON.parse(readFileSync(키파일, 'utf8'));
  const 프로젝트 = 키.project_id;
  console.log(`Gmail API — 프로젝트 ${프로젝트} · 서비스 계정 ${키.client_email}`);

  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const 이제 = Math.floor(Date.now() / 1000);
  const 머리 = b64({ alg: 'RS256', typ: 'JWT' });
  const 몸 = b64({
    iss: 키.client_email, scope: 갈래,
    aud: 'https://oauth2.googleapis.com/token', iat: 이제, exp: 이제 + 3600,
  });
  const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(키.private_key, 'base64url');
  const 토큰답 = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${머리}.${몸}.${서명}`,
    }),
  }).then((r) => r.json());

  if (!토큰답.access_token) {
    console.log('\n🔴 토큰을 못 받았다 — **못 켰다.**');
    console.log('   구글이 준 말:', JSON.stringify(토큰답).slice(0, 300));
    process.exit(1);
  }

  const 뿌리 = `https://serviceusage.googleapis.com/v1/projects/${프로젝트}/services/${켤것}`;
  const 머리표 = { authorization: `Bearer ${토큰답.access_token}` };

  const 본것 = await fetch(뿌리, { headers: 머리표 });
  const 본글 = await 본것.text();
  if (본것.ok) {
    const 상태 = (JSON.parse(본글).state ?? '모름');
    console.log(`  지금 상태     : ${상태}`);
    if (상태 === 'ENABLED') { console.log('\n✅ **이미 켜져 있다.** 할 것이 없다'); process.exit(0); }
  }

  if (!켠다) {
    console.log('\n⭐ 보기만 했다. 켜려면 — --켠다');
    process.exit(0);
  }

  const 답 = await fetch(`${뿌리}:enable`, {
    method: 'POST', headers: { ...머리표, 'content-type': 'application/json' }, body: '{}',
  });
  const 글 = await 답.text();
  if (답.ok) {
    console.log('\n✅ **켰다.** 사장님 손이 필요 없다');
    process.exit(0);
  }
  const 진단 = 무엇이막혔나(글);
  console.log(`\n🔴 **못 켰다** (HTTP ${답.status})`);
  console.log(`   막힌 것: ${진단.무엇}`);
  if (진단.할것) {
    console.log(`   할 것  : ${진단.할것}`);
    console.log(`   주소   : ${진단.주소}`);
  } else {
    console.log('   ⛔ 무슨 말인지 모르겠다 — 아는 척하지 않는다. 구글이 준 말을 그대로 옮긴다:');
    console.log(`   ${글.slice(0, 400)}`);
  }
  console.log('\n⛔ 이것은 「켰다」가 아니다. **아직 못 켠 것**이다.');
  process.exit(1);
}
