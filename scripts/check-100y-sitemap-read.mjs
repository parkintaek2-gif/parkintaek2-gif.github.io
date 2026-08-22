#!/usr/bin/env node
/**
 * check-100y-sitemap-read.mjs — **구글이 백년지도 사이트맵을 언제 마지막으로 읽었나**를 본다.
 *
 * 🔴 왜 — 4번이 klifemap.ai 에서 찾고(2026-08-22), 5번이 kculturewire.com 에서 같은 병을
 *   찾았다 — 「사이트맵 파일은 최신인데 **구글이 다시 와서 안 보면** 새 글은 영영 안 뜬다」.
 *   사장님(2026-08-22): 「구글콘솔에서 색인 신경써서 처리해」 — 그래서 여기도 같은 자로 잰다.
 *
 * ⛔ 「사이트맵에 있다」는 낸 것이지 읽힌 것이 아니다. 읽힌 날짜로만 판정한다.
 * ⚠ 권한이 없거나 API 가 막히면 **「못 쟀다」**로 끝낸다 — 「안 읽혔다」로 적지 않는다.
 * ⚠ 우리는 `sc-domain:` 속성이다(www/무www/http/https 를 한데 본다) — 그래서 www 갈림은
 *   klifemap·kcw 와 달리 우리 문제가 아닐 수 있다. 그래도 **경로별로** 낡았는지는 각각 본다.
 *
 * 쓰는 법  node scripts/check-100y-sitemap-read.mjs --자가시험
 *          node scripts/check-100y-sitemap-read.mjs [--낡음일=3]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사이트 = 'sc-domain:100yearmap.com';
/** 우리가 robots.txt 에 알린 두 사이트맵 — src/pages/100y/robots.txt.ts 참고 */
export const 봐야할사이트맵들 = [
  'https://100yearmap.com/sitemap.xml',
  'https://100yearmap.com/sitemap-image.xml',
];

function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 그만 */ }
}

/** 며칠 전에 읽혔나. ⛔ 날짜를 못 읽으면 null — 0 으로 만들지 않는다(그러면 늘 통과한다) */
export function 며칠전(읽은날, 지금 = new Date()) {
  const t = Date.parse(String(읽은날 ?? ''));
  if (!Number.isFinite(t)) return null;
  return (지금.getTime() - t) / 86400000;
}

/** 사이트맵 한 줄을 판정한다 */
export function 판정(줄, { 낡음일 = 3, 지금 = new Date(), 지면수 = null } = {}) {
  if (!줄) return { 꼴: '구글이모른다', 왜: '구글이 이 사이트맵을 아예 모른다' };
  const 지난 = 며칠전(줄.lastDownloaded, 지금);
  if (지난 === null) return { 꼴: '못쟀다', 왜: `읽은 날짜를 못 읽었다: ${줄.lastDownloaded ?? '(없음)'}` };
  const 잡힌수 = Number(줄.contents?.[0]?.submitted ?? 0) || 0;
  if (지난 > 낡음일) return { 꼴: '낡았다', 지난: Math.round(지난 * 10) / 10, 잡힌수 };
  if (지면수 && 잡힌수 && 잡힌수 < 지면수 * 0.9) {
    return { 꼴: '적게읽었다', 지난: Math.round(지난 * 10) / 10, 잡힌수, 지면수 };
  }
  return { 꼴: '읽었다', 지난: Math.round(지난 * 10) / 10, 잡힌수 };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 지금 = new Date('2026-08-22T12:30:00Z');
  const 줄 = (날, 수) => ({ lastDownloaded: 날, contents: [{ submitted: String(수) }] });

  검('갓 읽은 것은 통과', 판정(줄('2026-08-22T12:20:00Z', 5000), { 지금 }).꼴 === '읽었다');
  검('사흘 넘은 것은 낡았다', 판정(줄('2026-08-18T09:00:00Z', 5000), { 지금 }).꼴 === '낡았다');
  검('며칠 지났는지 적는다', 판정(줄('2026-08-19T12:30:00Z', 5000), { 지금 }).지난 === 3);
  검('⭐ 날짜가 새로워도 적게 읽었으면 잡는다',
    판정(줄('2026-08-22T12:20:00Z', 3000), { 지금, 지면수: 5900 }).꼴 === '적게읽었다');
  검('⭐ 거의 다 읽었으면 통과', 판정(줄('2026-08-22T12:20:00Z', 5400), { 지금, 지면수: 5900 }).꼴 === '읽었다');
  검('⛔ 구글이 모르는 사이트맵을 잡는다', 판정(null).꼴 === '구글이모른다');
  검('⛔ 날짜를 못 읽으면 «못쟀다»', 판정({ lastDownloaded: '어제' }, { 지금 }).꼴 === '못쟀다');
  검('⛔ 날짜가 없으면 «못쟀다»', 판정({}, { 지금 }).꼴 === '못쟀다');
  검('며칠전이 날짜를 못 읽으면 null', 며칠전('아무거나') === null && 며칠전(undefined) === null);
  검('며칠전을 옳게 센다', Math.round(며칠전('2026-08-19T12:30:00Z', 지금)) === 3);
  검('잡힌 수를 남긴다', 판정(줄('2026-08-22T12:20:00Z', 5000), { 지금 }).잡힌수 === 5000);
  검('사이트맵 두 벌을 다 본다', 봐야할사이트맵들.length === 2);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-100y-sitemap-read 자가시험 통과 (12)');
  process.exit(0);
}

환경읽기();
const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키파일 || !fs.existsSync(키파일)) {
  console.log('⚠ 못 쟀다 — 서비스 계정 키가 이 창에 없다. 「안 읽혔다」고 적지 않는다');
  process.exit(0);
}
const 키 = JSON.parse(fs.readFileSync(키파일, 'utf8'));
const 지금초 = Math.floor(Date.now() / 1000);
const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const b = Buffer.from(JSON.stringify({
  iss: 키.client_email,
  scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  aud: 'https://oauth2.googleapis.com/token',
  iat: 지금초,
  exp: 지금초 + 3600,
})).toString('base64url');
const sig = createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url');
const 토큰응답 = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${b}.${sig}` }),
}).then((r) => r.json());
if (!토큰응답.access_token) {
  console.log(`⚠ 못 쟀다 — 토큰을 못 받았다: ${JSON.stringify(토큰응답).slice(0, 160)}`);
  process.exit(0);
}

const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/sitemaps`, {
  headers: { Authorization: `Bearer ${토큰응답.access_token}` },
});
if (!r.ok) {
  console.log(`⚠ 못 쟀다 — HTTP ${r.status}. 「안 읽혔다」고 적지 않는다`);
  process.exit(0);
}
const j = await r.json();
const 줄들 = j.sitemap ?? [];

let 지면수 = null;
const 맵길 = path.join(뿌리, 'dist/100y/sitemap.xml');
if (fs.existsSync(맵길)) 지면수 = [...fs.readFileSync(맵길, 'utf8').matchAll(/<loc>/g)].length;

const 낡음일 = Number((process.argv.find((a) => a.startsWith('--낡음일='))?.split('=')[1]) ?? 3);

console.log(`사이트맵 읽힘 검사 — 구글이 아는 사이트맵 ${줄들.length}개${지면수 ? ` · 우리 지면 ${지면수}장` : ''}`);
for (const x of 줄들) {
  const p = 판정(x, { 낡음일, 지면수: x.path.includes('image') ? null : 지면수 });
  console.log(`  ${p.꼴 === '읽었다' ? '✅' : '⚠'} ${x.path}`);
  console.log(`      읽은 날 ${x.lastDownloaded ?? '(없음)'} · 잡힌 주소 ${x.contents?.[0]?.submitted ?? '?'}${x.isPending ? ' · 대기중' : ''}`);
}

let 문제있다 = false;
for (const 봐야할 of 봐야할사이트맵들) {
  const 볼줄 = 줄들.find((x) => x.path === 봐야할);
  const 결과 = 판정(볼줄, { 낡음일, 지면수: 봐야할.includes('image') ? null : 지면수 });
  if (결과.꼴 === '읽었다') {
    console.log(`✅ ${봐야할} — ${결과.지난}일 전에 ${결과.잡힌수}장으로 읽혔다`);
  } else if (결과.꼴 === '못쟀다') {
    console.log(`⚠ 못 쟀다 — ${봐야할}: ${결과.왜}`);
  } else {
    문제있다 = true;
    console.log(`❌ ${봐야할} — «${결과.꼴}»${결과.지난 !== undefined ? ` · 읽은 지 ${결과.지난}일 · 그때 잡힌 주소 ${결과.잡힌수}장` : ''}`);
  }
}

if (문제있다) {
  console.log('   ⛔ 「사이트맵에 있다」는 낸 것이지 읽힌 것이 아니다. 구글이 다시 오지 않으면 새 지면은 영영 안 뜬다.');
  process.exit(1);
}
process.exit(0);
