#!/usr/bin/env node
/**
 * **크롤을 우리 쪽에서 막고 있나** — 라이브에 직접 물어본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   Search Console(2026-08-10 01:0x) — 사이트맵 **718장 발견** · 색인 **49** ·
 *   크롤됨-색인 안 됨 **13** · 리디렉션 1. 합쳐 **63장**만 대장에 있다.
 *   ⭐ 683장은 거절당한 게 아니라 **아직 크롤이 안 왔다.**
 *   ⛔ 그러면 「우리가 막고 있나」를 먼저 봐야 한다. 짐작하지 말고 **실물에 묻는다.**
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ `node:https` 로 **Host 를 직접 넣어** 잰다. node fetch 는 Host 를 못 바꾼다.
 * ⛔ 밖(라이브)으로 나간다. 못 닿으면 **흠이 아니라 「못 쟀다」**로 넘어간다.
 * ⛔ 「느리다」를 눈대중으로 안 쓴다. **밀리초를 적는다.**
 */
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 집 = 'www.kculturewire.com';

/** robots.txt 가 그 길을 막나. ⛔ 우리 robots 는 단순하다 — 단순한 규칙만 읽는다 */
export function 막나(robots, 길, 봇 = '*') {
  const 줄들 = String(robots).replace(/\r\n/g, '\n').split('\n');
  let 지금봇 = null;
  const 막힘 = [];
  const 열림 = [];
  for (const l of 줄들) {
    const s = l.replace(/#.*$/, '').trim();
    if (!s) continue;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(s);
    if (!m) continue;
    const [, 이름, 값] = m;
    const k = 이름.toLowerCase();
    if (k === 'user-agent') { 지금봇 = 값.trim(); continue; }
    if (지금봇 !== '*' && 지금봇 !== 봇) continue;
    if (k === 'disallow' && 값.trim()) 막힘.push(값.trim());
    if (k === 'allow' && 값.trim()) 열림.push(값.trim());
  }
  /* ⛔ 더 긴 규칙이 이긴다 — robots 표준이 그렇다 */
  const 가장긴 = (들) => 들.filter((p) => 길.startsWith(p)).reduce((a, b) => (b.length > a.length ? b : a), '');
  const m1 = 가장긴(막힘); const m2 = 가장긴(열림);
  if (!m1) return false;
  return m2.length <= m1.length ? true : false;
}

/** 그 글에 noindex 가 있나 */
export function 노인덱스(html) {
  return /<meta[^>]+name\s*=\s*["']robots["'][^>]*content\s*=\s*["'][^"']*noindex/i.test(String(html));
}

/** canonical 이 자기 자신을 가리키나. 남을 가리키면 그 지면은 색인에서 빠진다 */
export function 캐노니컬(html) {
  const m = /<link[^>]+rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["']/i.exec(String(html));
  return m ? m[1] : null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('막는 규칙이 없으면 안 막는다', 막나('User-agent: *\nAllow: /', '/titles'), false);
  재본다('막는 규칙이 있으면 막는다', 막나('User-agent: *\nDisallow: /title', '/title/x'), true);
  /* ⛔ 더 긴 Allow 가 이긴다 */
  재본다('더 긴 Allow 가 이긴다', 막나('User-agent: *\nDisallow: /t\nAllow: /title', '/title/x'), false);
  재본다('딴 봇 규칙은 안 본다', 막나('User-agent: Bingbot\nDisallow: /', '/titles', 'Googlebot'), false);
  재본다('주석을 뗀다', 막나('User-agent: *\nDisallow: /x # 메모', '/x'), true);
  재본다('noindex 를 찾는다', 노인덱스('<meta name="robots" content="noindex, follow">'), true);
  재본다('noindex 가 없으면 false', 노인덱스('<meta name="robots" content="index">'), false);
  재본다('canonical 을 뽑는다', 캐노니컬('<link rel="canonical" href="https://a/b">'), 'https://a/b');
  재본다('canonical 이 없으면 null', 캐노니컬('<p>x</p>'), null);
  console.log(`크롤 가능 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/** Host 를 직접 넣어 잰다. 걸린 시간(ms)도 같이 돌려준다 */
function 재본다길(길) {
  return new Promise((r) => {
    const 시작 = process.hrtime.bigint();
    const q = https.request({ host: 집, path: 길, method: 'GET', headers: { Host: 집, 'User-Agent': 'KCW-crawl-check' } },
      (res) => {
        let b = '';
        res.on('data', (c) => { b += c; });
        res.on('end', () => r({
          길, 상태: res.statusCode, 바이트: b.length, 글: b,
          ms: Number((process.hrtime.bigint() - 시작) / 1000000n),
          위치: res.headers.location ?? null,
        }));
      });
    q.on('error', (e) => r({ 길, 상태: 'ERR', 바이트: 0, 글: '', ms: null, 오류: String(e.message) }));
    q.setTimeout(20000, () => { q.destroy(); r({ 길, 상태: 'TIMEOUT', 바이트: 0, 글: '', ms: null }); });
    q.end();
  });
}

if (내가실행됐다) {
  const r = await 재본다길('/robots.txt');
  if (r.상태 !== 200) {
    console.log(`⬜ robots.txt 를 못 읽었다(${r.상태}) — **못 쟀다**. 라이브가 안 서 있을 수 있다.`);
    process.exit(0);
  }
  console.log('robots.txt —');
  for (const l of r.글.trim().split('\n')) console.log(`   ${l}`);

  /* 갈래마다 한 장씩 골라 실제로 두드린다 */
  const 볼것 = ['/', '/titles', '/articles', '/title/stepmom', '/title/snowpiercer',
    '/market/vietnam', '/firm/jtbc', '/article/how-a-title-leaves', '/exit', '/sitemap.xml'];
  const 결과 = [];
  for (const p of 볼것) 결과.push(await 재본다길(p));

  console.log('\n길                                상태   ms    바이트   robots  noindex  canonical');
  let 나쁨 = 0;
  for (const x of 결과) {
    const 막힘 = 막나(r.글, x.길, 'Googlebot');
    const ni = x.글 ? 노인덱스(x.글) : false;
    const c = x.글 ? 캐노니컬(x.글) : null;
    /* ⛔ 첫 화면의 canonical 은 **꼬리 빗금이 붙은 것이 맞다**(`https://집/`).
       처음에 빗금을 떼고 견주는 바람에 자가 「남을 가리킨다」고 헛울었다. 자를 고쳤다 */
    const 자기 = c ? (c === `https://${집}${x.길}` || c === `https://${집}${x.길}/`) : null;
    if (x.상태 !== 200 || 막힘 || ni || 자기 === false) 나쁨 += 1;
    console.log(`${x.길.padEnd(33)} ${String(x.상태).padStart(5)} ${String(x.ms ?? '-').padStart(5)} ${String(x.바이트).padStart(8)}   ${막힘 ? '⛔막힘' : '  열림'}   ${ni ? '⛔있음' : '  없음'}   ${c == null ? '없음' : (자기 ? '자기' : `⛔남: ${c}`)}`);
  }

  const 잰것 = 결과.filter((x) => typeof x.ms === 'number').map((x) => x.ms).sort((a, b) => a - b);
  const 가운데 = 잰것.length ? 잰것[Math.floor(잰것.length / 2)] : null;
  console.log(`\n응답 시간 가운데 **${가운데}ms** (가장 느린 것 ${잰것[잰것.length - 1]}ms)`);
  console.log(가운데 != null && 가운데 < 1000
    ? '⭐ 느려서 크롤이 안 오는 것은 아니다 — 1초 안이다'
    : '🔴 느리다. 크롤 예산을 여기서 깎일 수 있다');
  console.log(나쁨 ? `\n🔴 우리 쪽에 막는 것이 ${나쁨}건 있다 — 위 표를 본다`
    : '\n✅ 우리 쪽에서 막는 것은 없다. robots 열려 있고 · noindex 없고 · canonical 이 자기를 가리킨다');
}
