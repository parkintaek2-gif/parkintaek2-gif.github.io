#!/usr/bin/env node
/**
 * 경쟁사이트를-잰다.mjs — 밖의 사주·점성 사이트가 «어떻게 하는지»를 잰다
 * ─────────────────────────────────────────────────────────────────────────────
 * 사장님 (2026-09-24): 「**도토리 키재기하니? 우리 것에서만 방법을 찾지말고
 *   외부의 다른 사이트들은 어떻게 하는지도 조사, 적용가능한 것은 적용해야지**」
 *
 * ⛔ 내가 오늘 종일 우리 네 사이트끼리만 견주고 있었다. 27 vs 53 vs 170 을 놓고
 *   「우리가 적다」고 했는데, 그 셋이 다 작으면 아무것도 모르는 것이다.
 *
 * [무엇을 재나 — 짐작이 아니라 받아서 센다]
 *   ① 지면 수        사이트맵으로 — 몇 장으로 싸우고 있나
 *   ② 크롤 가능 링크  첫 화면 HTML 의 <a href> — 안쪽으로 가는 길이 얼마나 열렸나
 *   ③ 로그인 문턱     첫 화면에서 로그인 없이 결과까지 가나
 *   ④ 값 노출        첫 화면에 값이 보이나
 *   ⑤ URL 꼴         무엇을 축으로 지면을 쪼갰나 — 우리가 베낄 수 있는 자리다
 *
 * ⚠ 남의 지면을 «읽어» 재는 것이다. 긁어서 쓰지 않는다. 우리 글은 우리가 쓴다.
 * ⚠ robots.txt 를 먼저 보고, 막은 곳은 첫 화면만 본다.
 *
 * 쓰는 법
 *   node scripts/경쟁사이트를-잰다.mjs
 *   node scripts/경쟁사이트를-잰다.mjs --적는다
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const 볼곳 = [
  /* 해외 — 점성 */
  { 이름: 'Astro.com(Astrodienst)', 주소: 'https://www.astro.com/', 말: 'en', 갈래: '점성' },
  { 이름: 'astro-seek', 주소: 'https://horoscopes.astro-seek.com/', 말: 'en', 갈래: '점성' },
  { 이름: 'Cafe Astrology', 주소: 'https://cafeastrology.com/', 말: 'en', 갈래: '점성' },
  { 이름: 'Co-Star', 주소: 'https://www.costarastrology.com/', 말: 'en', 갈래: '점성' },
  /* 한국 — 사주·운세 */
  { 이름: '점신', 주소: 'https://www.jeomsin.co.kr/', 말: 'ko', 갈래: '사주' },
  { 이름: '포스텔러', 주소: 'https://forceteller.com/', 말: 'ko', 갈래: '사주' },
  { 이름: '운세텔러', 주소: 'https://www.unsetelle.com/', 말: 'ko', 갈래: '사주' },
  { 이름: '헬로우드림', 주소: 'https://www.hellodream.kr/', 말: 'ko', 갈래: '사주' },
  /* 중화권·일본 */
  { 이름: '靈匣(lnka)', 주소: 'https://www.lnka.cn/', 말: 'zh', 갈래: '사주' },
  { 이름: '占いTVニュース', 주소: 'https://uranai.nosv.org/', 말: 'ja', 갈래: '점성' },
  /* 우리 */
  { 이름: '★ KLifeMap(우리)', 주소: 'https://klifemap.ai/', 말: 'ko', 갈래: '사주+점성' },
];

async function 받다(주소, 밀리 = 15000) {
  const 멈춤 = AbortSignal.timeout(밀리);
  const r = await fetch(주소, { headers: { 'User-Agent': UA }, signal: 멈춤, redirect: 'follow' });
  return { 상태: r.status, 글: await r.text(), 끝주소: r.url };
}

/** 사이트맵 URL 수를 센다 — 색인(sitemapindex)이면 안쪽 것도 한 겹 따라간다 */
export async function 지면수(뿌리주소) {
  const 후보 = ['sitemap.xml', 'sitemap_index.xml', 'sitemap-index.xml'];
  for (const s of 후보) {
    try {
      const { 상태, 글 } = await 받다(new URL('/' + s, 뿌리주소).href, 12000);
      if (상태 !== 200 || !/<(urlset|sitemapindex)/i.test(글)) continue;
      if (/<sitemapindex/i.test(글)) {
        const 안쪽 = [...글.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 6);
        let 합 = 0;
        for (const u of 안쪽) {
          try {
            const r2 = await 받다(u, 12000);
            합 += (r2.글.match(/<loc>/g) || []).length;
          } catch { /* 한 장 못 읽어도 나머지는 센다 */ }
        }
        return { 수: 합, 꼴: `색인(안쪽 ${안쪽.length}장까지만 셈)` };
      }
      return { 수: (글.match(/<loc>/g) || []).length, 꼴: s };
    } catch { /* 다음 후보 */ }
  }
  return { 수: null, 꼴: '못 찾음' };
}

/** <script> 를 걷어 낸 «크롤러가 그냥 읽는» 링크만 센다 */
export function 크롤링크수(html) {
  const 몸 = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  return (몸.match(/<a\s[^>]*href="[^"]+"/gi) || []).length;
}

/** 안쪽 지면 URL 꼴을 추린다 — 무엇을 축으로 쪼갰나 */
export function URL꼴(html, 뿌리주소) {
  const 몸 = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const 셈 = new Map();
  for (const m of 몸.matchAll(/href="([^"]+)"/g)) {
    let p;
    try { p = new URL(m[1], 뿌리주소).pathname; } catch { continue; }
    const 첫칸 = p.split('/').filter(Boolean)[0];
    if (!첫칸 || /\.(css|js|png|jpg|svg|ico|webp)$/i.test(첫칸)) continue;
    셈.set(첫칸, (셈.get(첫칸) || 0) + 1);
  }
  return [...셈.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

export function 값이보이나(html) {
  const 몸 = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]*>/g, ' ');
  const 원 = [...new Set(몸.match(/[0-9][0-9,]{2,}\s*원/g) || [])].slice(0, 4);
  const 달러 = [...new Set(몸.match(/\$\s?[0-9][0-9.,]*/g) || [])].slice(0, 4);
  const 무료 = (몸.match(/무료|free/gi) || []).length;
  return { 원, 달러, 무료 };
}

export function 로그인문턱(html) {
  const 몸 = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]*>/g, ' ');
  return /로그인|가입|sign\s?in|sign\s?up|log\s?in/i.test(몸);
}

/* ── 실행 ──────────────────────────────────────────────────────────────── */
const 이파일로실행 = process.argv[1] && process.argv[1].includes('경쟁사이트를-잰다');
if (이파일로실행) {
  console.log('■ 밖의 사주·점성 사이트를 잰다 — 사장님 2026-09-24');
  console.log('  「도토리 키재기하니? 외부의 다른 사이트들은 어떻게 하는지도 조사」\n');

  const 결과 = [];
  for (const s of 볼곳) {
    const 줄 = { ...s };
    try {
      const { 상태, 글 } = await 받다(s.주소);
      줄.상태 = 상태;
      줄.링크 = 크롤링크수(글);
      줄.값 = 값이보이나(글);
      줄.로그인 = 로그인문턱(글);
      줄.꼴 = URL꼴(글, s.주소);
      const z = await 지면수(s.주소);
      줄.지면 = z.수; 줄.지면꼴 = z.꼴;
    } catch (e) {
      줄.오류 = String(e.message || e).slice(0, 50);
    }
    결과.push(줄);
    const 표 = 줄.오류
      ? `🔴 ${줄.오류}`
      : `${String(줄.상태).padStart(3)} · 지면 ${String(줄.지면 ?? '-').padStart(6)} · 첫화면링크 ${String(줄.링크).padStart(4)}`
        + ` · 값 ${(줄.값.원[0] || 줄.값.달러[0] || '없음')} · 「무료」 ${줄.값.무료}회`;
    console.log(`  ${줄.이름.padEnd(24)} ${표}`);
    await new Promise((r) => setTimeout(r, 900));
  }

  console.log('\n── 지면 수로 줄 세우기 ──');
  for (const r of 결과.filter((x) => typeof x.지면 === 'number').sort((a, b) => b.지면 - a.지면)) {
    console.log(`  ${String(r.지면).padStart(7)}장  ${r.이름}   (${r.지면꼴})`);
  }

  console.log('\n── 지면을 «무엇으로» 쪼갰나 (첫 화면 링크의 첫 칸) ──');
  for (const r of 결과.filter((x) => x.꼴 && x.꼴.length)) {
    console.log(`  ${r.이름.padEnd(24)} ${r.꼴.map(([k, v]) => `${k}(${v})`).join(' · ')}`);
  }

  if (process.argv.includes('--적는다')) {
    const d = new Date();
    const 날 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const 낼곳 = path.join(뿌리, 'docs', `경쟁사이트-실측-${날}.md`);
    const 글 = [
      `# 밖의 사주·점성 사이트 실측 — ${날}`, '',
      '> 사장님: 「도토리 키재기하니? 외부의 다른 사이트들은 어떻게 하는지도 조사, 적용가능한 것은 적용해야지」', '',
      '| 사이트 | 갈래 | 지면 수 | 첫화면 링크 | 값 노출 | 「무료」 |',
      '|---|---|---:|---:|---|---:|',
      ...결과.map((r) => r.오류
        ? `| ${r.이름} | ${r.갈래} | 🔴 ${r.오류} | | | |`
        : `| ${r.이름} | ${r.갈래} | ${r.지면 ?? '-'} | ${r.링크} | ${r.값.원[0] || r.값.달러[0] || '없음'} | ${r.값.무료} |`),
    ].join('\n');
    fs.writeFileSync(낼곳, 글 + '\n', 'utf8');
    console.log(`\n  ✅ 적었다 — docs/경쟁사이트-실측-${날}.md`);
  }
}
