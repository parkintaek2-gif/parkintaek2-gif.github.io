#!/usr/bin/env node
/**
 * check-google-indexed.mjs — **구글이 이 주소를 «색인했나»를 구글에게 직접 묻는다.**
 *
 * ── 왜 이 자가 필요했나 (2026-08-29) ──────────────────────────
 * 🔴 오늘 재 보니 우리 **주 지면 269장이 노출 0**이었다. 사이트맵에 다 들어 있고
 *   `/weeks` 에서 269개가 다 링크되어 있는데도 그렇다.
 * ⛔ 「사이트맵에 있다」는 **낸 것**이지 «잡힌 것»이 아니다.
 * ⛔ 「노출 0」도 「색인 안 됐다」가 아니다 — 색인은 됐는데 아무도 그 말로 안 찾을 수 있다.
 *   **그 둘을 가르지 못하면 무엇을 고칠지 못 정한다.**
 *
 * ⭐ 그래서 구글에게 «직접» 묻는다 — Search Console URL Inspection API.
 *   우리가 가진 속성이라 물어볼 자격이 있다. 남의 자리를 긁는 것이 아니다.
 *
 * ── 이 자가 지키는 것 ────────────────────────────────────────
 * ⛔ **못 물어본 것을 「색인 안 됨」으로 적지 않는다.** 셋째 칸(`못물음`)을 둔다.
 * ⛔ 판정을 우리가 지어내지 않는다 — 구글이 준 `coverageState` 를 **그대로** 적는다.
 * ⚠ 이 API 는 하루·분당 한도가 있다. 그래서 **표본**으로 묻고, 몇 장 물었는지 적는다.
 *   ⛔ 표본으로 물어 놓고 「전부 그렇다」고 적지 않는다.
 * ⚠ 한 번에 한 주소씩만 물을 수 있다. 느리다 — 그것이 이 API 의 생김새다.
 *
 * 쓰는 법
 *   node scripts/check-google-indexed.mjs --자가시험
 *   node scripts/check-google-indexed.mjs --사이트 sc-domain:kculturewire.com --갈래 /week/ --n 12
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 구글이 준 상태를 «우리 세 칸»으로 옮긴다.
 * ⛔ 구글 말을 «지우지» 않는다 — 원문도 같이 남긴다.
 * ⛔ 모르는 말은 「색인 안 됨」이 아니라 **모름**이다.
 */
export function 칸(구글말) {
  const s = String(구글말 ?? '').trim();
  if (!s) return '못물음';
  if (/^Submitted and indexed$/i.test(s)) return '색인됨';
  if (/indexed/i.test(s) && !/not indexed/i.test(s)) return '색인됨';
  if (/not indexed/i.test(s)) return '색인안됨';
  if (/^URL is unknown to Google$/i.test(s)) return '색인안됨';
  return '모름';
}

/** 사이트맵에서 이 갈래의 주소들을 뽑는다. ⛔ 못 읽으면 빈 줄 */
export function 사이트맵에서(글, 갈래) {
  const 다 = [...String(글 ?? '').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return 갈래 ? 다.filter((u) => u.includes(갈래)) : 다;
}

/**
 * 고르게 «퍼뜨려» 표본을 뽑는다.
 * ⛔ 앞에서 n 개만 자르지 않는다 — 주 지면은 날짜 순이라 앞만 보면 옛것만 본다.
 */
export function 골고루(다, n) {
  const v = 다 ?? [];
  if (!Number.isFinite(n) || n <= 0 || v.length <= n) return [...v];
  const 걸음 = v.length / n;
  const 나온것 = [];
  for (let i = 0; i < n; i += 1) 나온것.push(v[Math.floor(i * 걸음)]);
  return [...new Set(나온것)];
}

/** 셈. ⛔ 못 물은 것을 「색인 안 됨」과 섞지 않는다 */
export function 셈하기(줄들) {
  const c = { 색인됨: 0, 색인안됨: 0, 모름: 0, 못물음: 0 };
  for (const r of 줄들 ?? []) c[r?.칸] = (c[r?.칸] ?? 0) + 1;
  return c;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('색인됐다는 말을 알아본다', 칸('Submitted and indexed') === '색인됨');
  검('색인됐다는 다른 말도 알아본다', 칸('Indexed, not submitted in sitemap') === '색인됨');
  검('🔴 크롤은 했는데 색인 안 한 것', 칸('Crawled - currently not indexed') === '색인안됨');
  검('찾았지만 색인 안 한 것', 칸('Discovered - currently not indexed') === '색인안됨');
  검('구글이 모르는 주소', 칸('URL is unknown to Google') === '색인안됨');
  검('⛔ 모르는 말은 「색인 안 됨」이 아니라 모름이다', 칸('무슨 새 상태') === '모름');
  검('⛔ 못 물었으면 못물음 — 색인 안 됨이 아니다', 칸('') === '못물음' && 칸(undefined) === '못물음');

  const 맵 = '<url><loc>https://a/week/1</loc></url><url><loc>https://a/title/x</loc></url>';
  검('사이트맵에서 뽑는다', 사이트맵에서(맵, '/week/').length === 1);
  검('갈래를 안 주면 다 뽑는다', 사이트맵에서(맵).length === 2);
  검('⛔ 빈 것도 안 터진다', 사이트맵에서(undefined, '/week/').length === 0);

  const 열 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  const s = 골고루(열, 3);
  검('표본 수가 맞는다', s.length === 3);
  검('⭐ 앞만 자르지 않는다 — 끝쪽도 든다', s[s.length - 1] !== 'c');
  검('⭐ 첫 것은 든다', s[0] === 'a');
  검('n 이 더 크면 다 준다', 골고루(열, 99).length === 10);
  검('⛔ 빈 것도 안 터진다', 골고루(undefined, 3).length === 0);

  const c = 셈하기([{ 칸: '색인됨' }, { 칸: '색인안됨' }, { 칸: '색인안됨' }, { 칸: '못물음' }]);
  검('갈라서 센다', c.색인됨 === 1 && c.색인안됨 === 2 && c.못물음 === 1);
  검('⛔ 못 물은 것을 색인 안 됨에 안 더한다', c.색인안됨 === 2);
  검('⛔ 빈 것도 안 터진다', 셈하기(undefined).색인됨 === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s2) => `   · ${s2}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ check-google-indexed 자가시험 통과 (19)');
  process.exit(0);
}

/* ── 실제로 묻는다 ── */
const 인자 = (이름, 기본 = null) => {
  const i = process.argv.indexOf(`--${이름}`);
  return i >= 0 ? process.argv[i + 1] : 기본;
};
const 사이트 = 인자('사이트', 'sc-domain:kculturewire.com');
const 갈래 = 인자('갈래', null);
const 표본수 = Number(인자('n', 10));
const 맵길 = path.join(뿌리, 인자('사이트맵', 'dist/wikitip/sitemap.xml'));

if (!fs.existsSync(맵길)) {
  console.log(`⬜ 못 쟀다 — 사이트맵이 없다: ${path.relative(뿌리, 맵길)}`);
  console.log('   ⛔ 「0장 색인됨」이라고 적지 않는다. 짓고 나서 다시 잰다.');
  process.exit(0);
}

const 주소들 = 사이트맵에서(fs.readFileSync(맵길, 'utf8'), 갈래);
if (!주소들.length) {
  console.log(`⬜ 못 쟀다 — 사이트맵에 «${갈래 ?? '전체'}» 주소가 하나도 없다`);
  process.exit(0);
}
const 물을것 = 골고루(주소들, 표본수);

/* 토큰 — search-console-report 와 같은 열쇠를 쓴다 */
const 키길 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키길 || !fs.existsSync(키길)) {
  console.log('⬜ 못 물었다 — GOOGLE_APPLICATION_CREDENTIALS 가 없다.');
  console.log('   ⛔ 「색인 안 됐다」로 적지 않는다. 못 «물어본» 것이다.');
  process.exit(0);
}
const 키 = JSON.parse(fs.readFileSync(키길, 'utf8'));

function jwt() {
  const 이제 = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({
    iss: 키.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: 이제 + 3600,
    iat: 이제,
  })).toString('base64url');
  const s = createSign('RSA-SHA256');
  s.update(`${h}.${p}`);
  return `${h}.${p}.${s.sign(키.private_key, 'base64url')}`;
}

const 토큰응답 = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt(),
  }),
});
const 토큰j = await 토큰응답.json();
if (!토큰j.access_token) {
  console.log('⬜ 못 물었다 — 토큰을 못 받았다:', JSON.stringify(토큰j).slice(0, 200));
  console.log('   ⛔ 「색인 안 됐다」로 적지 않는다.');
  process.exit(0);
}

console.log(`■ 구글에게 «직접» 묻는다 — ${사이트} · ${갈래 ?? '전체'}`);
console.log(`   사이트맵의 그 갈래 ${주소들.length}장 중 **${물을것.length}장**만 표본으로 묻는다.`);
console.log('   ⛔ 표본으로 물어 놓고 「전부 그렇다」고 적지 않는다.\n');

const 줄들 = [];
for (const u of 물을것) {
  let 구글말 = '';
  let 마지막크롤 = null;
  try {
    const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰j.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: u, siteUrl: 사이트 }),
    });
    const j = await r.json();
    구글말 = j?.inspectionResult?.indexStatusResult?.coverageState ?? '';
    마지막크롤 = j?.inspectionResult?.indexStatusResult?.lastCrawlTime ?? null;
    if (!구글말 && j?.error) 구글말 = '';
    if (j?.error) console.log(`   ⬜ ${u} — 못 물었다: ${String(j.error.message).slice(0, 90)}`);
  } catch (e) {
    console.log(`   ⬜ ${u} — 못 물었다: ${String(e.message).slice(0, 90)}`);
  }
  const k = 칸(구글말);
  줄들.push({ url: u, 칸: k, 구글말, 마지막크롤 });
  const 표 = { 색인됨: '✅', 색인안됨: '🔴', 모름: '⚠', 못물음: '⬜' }[k];
  console.log(`   ${표} ${k.padEnd(6)} ${구글말 || '(못 물음)'}`.padEnd(58)
    + ` ${u.replace('https://www.kculturewire.com', '')}`);
}

const c = 셈하기(줄들);
console.log(`\n   ✅ 색인됨 ${c.색인됨} · 🔴 색인 안 됨 ${c.색인안됨}`
  + ` · ⚠ 모름 ${c.모름} · ⬜ 못 물음 ${c.못물음}   (물어본 ${줄들.length}장)`);
console.log('   ⛔ 「못 물음」을 「색인 안 됨」으로 옮겨 적지 않는다. 다른 말이다.');

const 크롤된것 = 줄들.filter((r) => r.마지막크롤);
if (크롤된것.length) {
  console.log(`\n   ⚠ 마지막 크롤이 기록된 것 ${크롤된것.length}장 — 가장 최근 ${
    크롤된것.map((r) => r.마지막크롤).sort().slice(-1)[0]}`);
}
if (c.색인안됨 > c.색인됨 && 줄들.length >= 5) {
  console.log('\n🔴 **이 갈래는 색인이 안 되고 있다.** 더 만들기 전에 «왜»를 먼저 본다 —');
  console.log('   같은 꼴 지면이 수백 장이면 구글이 「거의 같은 것」으로 보고 안 담을 수 있다.');
  console.log('   ⛔ 답은 「더 만든다」가 아니다. 줄이거나 합치거나, 장마다 다른 것을 넣는다.');
}
process.exit(0);
