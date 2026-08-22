#!/usr/bin/env node
/**
 * check-kcw-sitemap-read.mjs — **구글이 우리 사이트맵을 언제 마지막으로 읽었나**를 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 21:0x 에 4번이 찾아 전 유닛에 돌렸다 —
 *   「klifemap.ai 사이트맵을 구글이 **3주째** 안 읽고 있었습니다.
 *    파일 자체는 늘 최신이었지만, **구글이 다시 와서 보지 않으면** 새 글은 영영 안 뜹니다.」
 *
 * 그 방식으로 우리를 재 보니 같은 병이 있었다 —
 * ```
 * https://kculturewire.com/sitemap.xml       읽은 날 08-22 12:15Z · 1,223장  (2번이 재제출해 둔 것)
 * https://www.kculturewire.com/sitemap.xml   읽은 날 08-21 09:50Z · **828장** ← 낡아 있었다
 * ```
 * ⚠ 우리 canonical 은 **www** 다. 낡은 쪽이 바로 그쪽이었다.
 * 재제출(PUT)하니 그 자리에서 **828 → 1,223장**으로 갱신됐다(12:20Z).
 *
 * ⭐ 이 자는 그것이 **다시 낡는 것**을 잡는다. 사람이 기억해서 누르는 구조를 안 남긴다.
 * ⛔ 「사이트맵에 있다」는 낸 것이지 읽힌 것이 아니다. 읽힌 날짜로만 판정한다.
 * ⚠ 권한이 없거나 API 가 막히면 **「못 쟀다」**로 끝낸다 — 「안 읽혔다」로 적지 않는다.
 *
 * 쓰는 법  node scripts/check-kcw-sitemap-read.mjs --자가시험
 *          node scripts/check-kcw-sitemap-read.mjs [--낡음일=3]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 사이트 = 'sc-domain:kculturewire.com';
/** ⭐ 우리 canonical 이 www 다. **그쪽이 최신이어야 한다** — 그것이 이 자의 요점이다 */
export const 봐야할사이트맵 = 'https://www.kculturewire.com/sitemap.xml';

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

/**
 * 사이트맵 한 줄을 판정한다.
 * @param {{lastDownloaded?:string, contents?:{submitted?:string}[], warnings?:string}} 줄
 */
export function 판정(줄, { 낡음일 = 3, 지금 = new Date(), 지면수 = null } = {}) {
  if (!줄) return { 꼴: '구글이모른다', 왜: '구글이 이 사이트맵을 아예 모른다' };
  const 지난 = 며칠전(줄.lastDownloaded, 지금);
  if (지난 === null) return { 꼴: '못쟀다', 왜: `읽은 날짜를 못 읽었다: ${줄.lastDownloaded ?? '(없음)'}` };
  const 잡힌수 = Number(줄.contents?.[0]?.submitted ?? 0) || 0;
  if (지난 > 낡음일) return { 꼴: '낡았다', 지난: Math.round(지난 * 10) / 10, 잡힌수 };
  /* ⭐ 날짜가 새롭더라도 **잡힌 수가 우리 지면 수보다 크게 적으면** 옛 파일을 읽은 것이다 */
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

  검('갓 읽은 것은 통과', 판정(줄('2026-08-22T12:20:00Z', 1223), { 지금 }).꼴 === '읽었다');
  검('사흘 넘은 것은 낡았다', 판정(줄('2026-08-18T09:00:00Z', 1223), { 지금 }).꼴 === '낡았다');
  검('며칠 지났는지 적는다', 판정(줄('2026-08-19T12:30:00Z', 1223), { 지금 }).지난 === 3);
  /* 🔴 이 칸이 오늘 겪은 것이다 — 날짜는 어제인데 828장만 잡혀 있었다 */
  검('⭐ 날짜가 새로워도 적게 읽었으면 잡는다',
    판정(줄('2026-08-22T12:20:00Z', 828), { 지금, 지면수: 1223 }).꼴 === '적게읽었다');
  검('⭐ 거의 다 읽었으면 통과', 판정(줄('2026-08-22T12:20:00Z', 1200), { 지금, 지면수: 1223 }).꼴 === '읽었다');
  검('⛔ 구글이 모르는 사이트맵을 잡는다', 판정(null).꼴 === '구글이모른다');
  검('⛔ 날짜를 못 읽으면 «못쟀다»', 판정({ lastDownloaded: '어제' }, { 지금 }).꼴 === '못쟀다');
  검('⛔ 날짜가 없으면 «못쟀다»', 판정({}, { 지금 }).꼴 === '못쟀다');
  검('며칠전이 날짜를 못 읽으면 null', 며칠전('아무거나') === null && 며칠전(undefined) === null);
  검('며칠전을 옳게 센다', Math.round(며칠전('2026-08-19T12:30:00Z', 지금)) === 3);
  검('잡힌 수를 남긴다', 판정(줄('2026-08-22T12:20:00Z', 1223), { 지금 }).잡힌수 === 1223);
  검('봐야 할 것은 www 쪽이다', 봐야할사이트맵.includes('www.'));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-kcw-sitemap-read 자가시험 통과 (12)');
  process.exit(0);
}

환경읽기();
const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키파일 || !fs.existsSync(키파일)) {
  console.log('⚠ 못 쟀다 — 서비스 계정 키가 이 창에 없다. 「안 읽혔다」고 적지 않는다');
  process.exit(0);
}
const 키 = JSON.parse(fs.readFileSync(키파일, 'utf8'));
const 지금 = Math.floor(Date.now() / 1000);
const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const b = Buffer.from(JSON.stringify({
  iss: 키.client_email,
  scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  aud: 'https://oauth2.googleapis.com/token',
  iat: 지금,
  exp: 지금 + 3600,
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

/* 우리 지면 수 — 사이트맵 파일에서 센다. 없으면 그 칸은 안 본다 */
let 지면수 = null;
const 맵길 = path.join(뿌리, 'dist/wikitip/sitemap.xml');
if (fs.existsSync(맵길)) 지면수 = [...fs.readFileSync(맵길, 'utf8').matchAll(/<loc>/g)].length;

const 낡음일 = Number((process.argv.find((a) => a.startsWith('--낡음일='))?.split('=')[1]) ?? 3);
const 볼줄 = 줄들.find((x) => x.path === 봐야할사이트맵);
const 결과 = 판정(볼줄, { 낡음일, 지면수 });

console.log(`사이트맵 읽힘 검사 — 구글이 아는 사이트맵 ${줄들.length}개${지면수 ? ` · 우리 지면 ${지면수}장` : ''}`);
for (const x of 줄들) {
  const p = 판정(x, { 낡음일, 지면수 });
  console.log(`  ${p.꼴 === '읽었다' ? '✅' : '⚠'} ${x.path}`);
  console.log(`      읽은 날 ${x.lastDownloaded ?? '(없음)'} · 잡힌 주소 ${x.contents?.[0]?.submitted ?? '?'}`);
}

if (결과.꼴 === '읽었다') {
  console.log(`\n✅ canonical 쪽(www) 사이트맵이 ${결과.지난}일 전에 ${결과.잡힌수}장으로 읽혔다`);
  process.exit(0);
}
if (결과.꼴 === '못쟀다') {
  console.log(`\n⚠ 못 쟀다 — ${결과.왜}`);
  process.exit(0);
}
console.log(`\n❌ canonical 쪽(www) 사이트맵이 «${결과.꼴}»`);
if (결과.지난 !== undefined) console.log(`   읽은 지 ${결과.지난}일 · 그때 잡힌 주소 ${결과.잡힌수}장${지면수 ? ` (우리 지면 ${지면수}장)` : ''}`);
console.log('   ⭐ 고치는 법 — node scripts/resubmit-sitemap.mjs "sc-domain:kculturewire.com" "https://www.kculturewire.com/sitemap.xml" --누른다');
console.log('   ⛔ 「사이트맵에 있다」는 낸 것이지 읽힌 것이 아니다. 구글이 다시 오지 않으면 새 지면은 영영 안 뜬다.');
process.exit(1);
