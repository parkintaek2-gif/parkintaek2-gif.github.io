#!/usr/bin/env node
/**
 * 유입 측정 시험.
 *
 * ⚠ 이 코드는 **운영 서버 안에서 돈다.** 그래서 「제대로 세는가」보다
 *   **「절대 안 죽는가」**를 먼저 시험한다. 측정 하나 때문에 세 사이트가 멈추면 안 된다.
 */
import { 센다, 현황, 셀것인가, 유입도메인 } from '../src/lib/traffic.mjs';

let 실패 = 0;
const 확인 = (조건, 이름) => { if (!조건) { 실패++; console.log(`  ✕ ${이름}`); } };

console.log('유입 측정');

/* ── ① 절대 안 죽는다 — 이상한 입력을 다 넣어 본다 ───────────── */
for (const 나쁜 of [
  undefined, null, {}, { pathname: null }, { pathname: 123 },
  { pathname: '/a', referer: '깨진 URL' }, { pathname: '/a', referer: null },
  { pathname: '/a', host: null, userAgent: null },
  { pathname: '/'.repeat(5000) },
  { pathname: '/a', referer: 'javascript:alert(1)' },
]) {
  try { 센다(나쁜); } catch (e) { 실패++; console.log(`  ✕ 던졌다: ${JSON.stringify(나쁜)?.slice(0, 40)} — ${e.message}`); }
}
try { 현황(); } catch (e) { 실패++; console.log(`  ✕ 현황()이 던졌다: ${e.message}`); }

/* ── ② 셀 것과 안 셀 것 ─────────────────────────────────────── */
확인(셀것인가('/article/abc'), '기사는 센다');
확인(셀것인가('/rankings'), '지면은 센다');
확인(!셀것인가('/_astro/x.css'), '빌드 자원은 안 센다');
확인(!셀것인가('/favicon.ico'), '파비콘은 안 센다');
확인(!셀것인가('/og-default.png'), '이미지는 안 센다');
확인(!셀것인가('/admin'), '우리가 보는 화면은 안 센다');
확인(!셀것인가('/sitemap.xml'), '사이트맵은 안 센다');

/* ── ③ 유입 도메인 — **전체 URL 을 남기지 않는다** ───────────── */
확인(유입도메인(null) === '(직접)', '리퍼러 없음 → (직접)');
확인(유입도메인('깨진것') === '(알수없음)', '깨진 리퍼러 → (알수없음)');
확인(유입도메인('https://www.google.com/search?q=비밀검색어') === 'google.com',
  '⭐ 검색어가 붙어 와도 **도메인만** 남긴다');
확인(유입도메인('https://seoulmarkets.com/x', 'seoulmarkets.com') === '(내부)', '같은 사이트 → (내부)');
확인(유입도메인('https://100yearmap.com/x', 'seoulmarkets.com') === '우리:100yearmap.com',
  '우리 사이트끼리는 따로 표시한다');

/* ── ④ 실제로 센다 ──────────────────────────────────────────── */
const 전 = 현황().사람;
for (let i = 0; i < 5; i++) {
  센다({ host: 'seoulmarkets.com', pathname: '/article/test', referer: 'https://google.com/', userAgent: 'Mozilla/5.0' });
}
센다({ host: 'seoulmarkets.com', pathname: '/article/test', userAgent: 'Googlebot/2.1' });
const 후 = 현황();
확인(후.사람 - 전 === 5, `사람 5건이 세어졌다 (실제 ${후.사람 - 전})`);
확인(후.봇 >= 1, '봇이 따로 세어졌다');

/* ── ⑤ ⚠ 개인정보가 안 남는다 ───────────────────────────────── */
const 전부 = JSON.stringify(현황());
확인(!전부.includes('Mozilla'), '⭐ User-Agent 원문이 안 남는다');
확인(!전부.includes('비밀검색어'), '⭐ 검색어가 안 남는다');
확인(!/\b\d{1,3}(\.\d{1,3}){3}\b/.test(전부), '⭐ IP 모양의 값이 안 남는다');

/* ── ⑥ 경로 상한 — 스캐너가 임의 URL 을 때려도 무한히 안 는다 ─── */
const 전키 = 현황().서로다른키;
for (let i = 0; i < 4000; i++) 센다({ host: 'x', pathname: `/scan/${i}`, userAgent: 'Mozilla/5.0' });
const 후키 = 현황().서로다른키;
확인(후키 < 전키 + 4000, `⭐ 경로 상한이 걸린다 (${전키} → ${후키}, 4000건 넣음)`);

if (실패) { console.error(`\n${실패} 실패`); process.exit(1); }
console.log('  전부 통과 · 0 실패');
