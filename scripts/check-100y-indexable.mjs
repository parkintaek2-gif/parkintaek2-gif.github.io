#!/usr/bin/env node
/**
 * check-100y-indexable.mjs — **낸 지면이 «색인될 수 있는 자리»에 서 있나**
 *
 * 🔴 왜 (2026-08-21 · 3번)
 * ─────────────────────────────────────────────────────────────────
 * 7일간 많이 읽힌 지면에 **내가 밤새 낸 지면이 하나도 없었다.** 읽히는 것은
 * 첫 화면(1,447)·/price(123)·노원구 한 장(120)뿐이다. 5,889장을 냈는데 다섯 장이 읽힌다.
 * 그리고 같은 날 사장님이 Search Console 편지를 주셨다 —
 * 「썸네일이 없어 검색 결과에 안 나온다」. **낸 것이 검색에 안 보이는 문제**가 같은 계열이다.
 *
 * ⛔ 「색인이 됐나」는 이 자로 못 잰다. 그건 Search Console(사장님 계정)만 안다.
 *    ⇒ 대신 **색인의 전제 넷**을 잰다. 하나라도 깨지면 색인은 될 수 없다.
 *      ① sitemap 에 있는 주소가 라이브 200 인가       (404 면 색인 안 된다)
 *      ② robots.txt 가 그 길을 막고 있지 않은가
 *      ③ 그 지면이 스스로 noindex 라 하지 않는가      (⛔ 우리가 스스로 막아 놓은 자리)
 *      ④ title·description 이 비어 있지 않은가        (비면 검색 결과에 쓸 글이 없다)
 *
 * ⛔ 구글 검색 결과를 긁지 않는다. robots 로 막힌 길을 우회하지 않는다.
 * ⛔ 재는 데는 `라이브재기` 를 쓴다 — 안 쓰면 **내 검사가 방문자 수에 섞인다**(오늘 겪었다).
 *
 * 쓰는 법
 *   node scripts/check-100y-indexable.mjs            sitemap 전부(느리다)
 *   node scripts/check-100y-indexable.mjs --몇장 40   앞의 40장만
 *   node scripts/check-100y-indexable.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 재기, 재는이UA } from './lib/라이브재기.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 사이트 = 'https://100yearmap.com';
export const 사이트맵 = path.join(뿌리, 'dist/100y/sitemap.xml');
export const 로봇길 = path.join(뿌리, 'dist/100y/robots.txt');

/** sitemap.xml 에서 주소를 뽑는다 */
export function 주소들(xml) {
  return [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/** robots.txt 의 Disallow 줄만 모은다 — ⛔ 우리 자신이 막아 둔 길을 찾는 것이다 */
export function 막은길들(robots) {
  const 낸다 = [];
  let 우리차례 = false;
  for (const 줄 of String(robots).split(/\r?\n/)) {
    const t = 줄.trim();
    if (/^user-agent\s*:/i.test(t)) { 우리차례 = /:\s*\*\s*$/.test(t); continue; }
    if (!우리차례) continue;
    const m = t.match(/^disallow\s*:\s*(\S+)/i);
    if (m) 낸다.push(m[1]);
  }
  return 낸다;
}

/** 그 길이 막혀 있나 — 앞부분이 맞으면 막힌 것이다(구글이 그렇게 본다) */
export function 막혔나(경로, 막은것들) {
  return 막은것들.some((d) => d !== '' && 경로.startsWith(d));
}

/** 지면이 스스로 noindex 라 하나 */
export function 스스로막았나(글) {
  const m = String(글).match(/<meta[^>]+name=["']robots["'][^>]*>/i);
  return !!m && /noindex/i.test(m[0]);
}

/** title 과 description 을 꺼낸다 — 비었으면 검색 결과에 쓸 글이 없다 */
export function 제목과설명(글) {
  const t = String(글).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const d = String(글).match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  return { 제목: t ? t[1].trim() : '', 설명: d ? d[1].trim() : '' };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① sitemap 에서 주소를 뽑는다',
    주소들('<url><loc>https://a/b</loc></url><url><loc> https://a/c </loc></url>').length === 2);
  본다('② User-agent: * 의 Disallow 만 모은다',
    JSON.stringify(막은길들('User-agent: *\nDisallow: /x\nUser-agent: Bad\nDisallow: /y')) === '["/x"]');
  본다('③ 앞부분이 맞으면 막힌 것이다', 막혔나('/x/y', ['/x']) && !막혔나('/z', ['/x']));
  본다('④ ⛔ Disallow: (빈 값)은 막은 것이 아니다', !막혔나('/x', ['']));
  본다('⑤ 스스로 noindex 라 한 것을 잡는다',
    스스로막았나('<meta name="robots" content="noindex">') && !스스로막았나('<meta name="robots" content="index">'));
  본다('⑥ robots 메타가 없으면 막은 것이 아니다', !스스로막았나('<html></html>'));
  const ts = 제목과설명('<title> 가 </title><meta name="description" content="나">');
  본다('⑦ 제목과 설명을 꺼낸다', ts.제목 === '가' && ts.설명 === '나');
  본다('⑧ ⛔ 재는 UA 가 통계에서 빠지는 것이다', 재는이UA.includes('monitor'));
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'check-100y-indexable.mjs';
if (내가직접불렸나) {
  if (!fs.existsSync(사이트맵)) {
    console.log(`🔴 ${path.relative(뿌리, 사이트맵)} 이 없다 — 먼저 node scripts/build-once.mjs`);
    process.exit(1);
  }
  const 전부 = 주소들(fs.readFileSync(사이트맵, 'utf8'));
  const i = process.argv.indexOf('--몇장');
  const 몇장 = i > -1 ? Number(process.argv[i + 1]) : 전부.length;
  const 볼것 = 전부.slice(0, 몇장);

  const 막은것들 = fs.existsSync(로봇길) ? 막은길들(fs.readFileSync(로봇길, 'utf8')) : [];
  console.log(`sitemap 주소 ${전부.length.toLocaleString()}개 · 이번에 잴 것 ${볼것.length.toLocaleString()}개`);
  console.log(`robots 가 막은 길 ${막은것들.length}개${막은것들.length ? ` — ${막은것들.join(' · ')}` : ''}`);
  console.log(`⛔ 재는 UA = ${재는이UA}\n`);

  const 흠 = { 안뜬다: [], robots가막았다: [], 스스로막았다: [], 제목없다: [], 설명없다: [] };
  let 맞은것 = 0;

  for (const [n, u] of 볼것.entries()) {
    const 경로 = new URL(u).pathname;
    if (막혔나(경로, 막은것들)) { 흠.robots가막았다.push(경로); continue; }
    let r;
    try { r = await 재기(u); } catch (e) { 흠.안뜬다.push(`${경로} (${String(e.message).slice(0, 40)})`); continue; }
    if (r.status !== 200) { 흠.안뜬다.push(`${경로} → ${r.status}`); continue; }
    const 글 = await r.text();
    if (스스로막았나(글)) { 흠.스스로막았다.push(경로); continue; }
    const { 제목, 설명 } = 제목과설명(글);
    if (!제목) { 흠.제목없다.push(경로); continue; }
    if (!설명) { 흠.설명없다.push(경로); continue; }
    맞은것++;
    if ((n + 1) % 50 === 0) console.log(`   … ${n + 1}/${볼것.length}`);
  }

  console.log(`\n⇒ ${볼것.length.toLocaleString()} 중 ${맞은것.toLocaleString()} 이 색인될 수 있는 자리에 서 있다`);
  for (const [이름, 것] of Object.entries(흠)) {
    if (!것.length) continue;
    console.log(`\n🔴 ${이름} — ${것.length}개`);
    for (const x of 것.slice(0, 12)) console.log('  ', x);
    if (것.length > 12) console.log(`   … 그리고 ${것.length - 12}개 더`);
  }
  console.log('\n⛔ 「색인이 됐나」는 이 자로 못 잽니다 — Search Console(사장님 계정)만 압니다.');
  console.log('   이 자가 재는 것은 «색인의 전제»입니다. 하나라도 깨지면 색인은 될 수 없습니다.');
  if (Object.values(흠).some((x) => x.length)) process.exitCode = 1;
}
