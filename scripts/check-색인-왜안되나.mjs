#!/usr/bin/env node
/**
 * check-색인-왜안되나.mjs — 구글에게 «직접» 묻는다. 왜 우리 페이지가 색인이 안 되는가.
 *
 * 🔴 사장님 (2026-09-27, 원문)
 *   「**근데 왜 구글 검색에서 문제가 끊이질 않나? 지금 3개월이 됐다.
 *     제일 중요한 방문자수와 밀접한 업무는 정치하게 처리해**」
 *
 * ── ⛔ 짐작으로 답하지 않는다 ─────────────────────────────────
 *   「사이트맵을 냈다」·「IndexNow 를 쳤다」는 우리가 «한 일»이지 구글이 «한 일»이 아니다.
 *   구글에게 페이지마다 물어야 까닭이 갈린다. Search Console URL 검사 API 가 그 창구다.
 *
 * ── 무엇을 가르나 (구글이 돌려주는 말 그대로) ────────────────
 *   verdict          PASS / NEUTRAL / FAIL
 *   coverageState    「색인이 생성됨」 / 「검색된 페이지 - 현재 색인이 생성되지 않음」 …
 *   robotsTxtState   ALLOWED / DISALLOWED          ← 우리가 막고 있나
 *   indexingState    INDEXING_ALLOWED / BLOCKED_BY_META_TAG …  ← noindex 를 걸었나
 *   pageFetchState   SUCCESSFUL / SOFT_404 / …     ← 가져가다 실패했나
 *   lastCrawlTime    없으면 «한 번도 안 왔다»      ← 발견조차 안 된 것
 *   googleCanonical  우리가 말한 것과 다르면 «묶여서» 색인에서 빠진다
 *
 * ⭐ 이 다섯이 갈리면 처방도 갈린다 —
 *   한 번도 안 왔다        → 발견 문제. 사이트맵·안쪽 링크
 *   왔는데 색인 안 했다     → 품질·중복 문제. 내용과 canonical
 *   robots/noindex 막힘    → 우리 잘못. 그 자리에서 고친다
 *   canonical 이 다르다     → 구글이 다른 페이지와 묶었다. 묶인 상대를 봐야 한다
 *
 * 쓰는 법
 *   node scripts/check-색인-왜안되나.mjs --자가시험
 *   node scripts/check-색인-왜안되나.mjs                 (네 사이트 대표 지면)
 *   node scripts/check-색인-왜안되나.mjs --사이트 klifemap
 */
import fs from 'node:fs';
import path from 'node:path';
import { createSign } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/index-diagnosis.json');
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/** 사이트마다 «대표 지면» — 첫 화면과 파는 것 위주로 고른다 */
export const 볼것 = {
  klifemap: {
    siteUrl: 'sc-domain:klifemap.ai',
    주소: [
      'https://klifemap.ai/',
      'https://klifemap.ai/saju.html',
      'https://klifemap.ai/mingli-gunghap.html',
      'https://klifemap.ai/mingli-taekil.html',
      'https://klifemap.ai/astro.html',
      'https://klifemap.ai/tarot.html',
      'https://klifemap.ai/horoscope.html',
      'https://klifemap.ai/contents.html',
      'https://klifemap.ai/mansecalendar.html',
      'https://klifemap.ai/ilzin.html',
      'https://klifemap.ai/daily.html',
    ],
  },
  seoulmarkets: {
    siteUrl: 'sc-domain:seoulmarkets.com',
    주소: ['https://seoulmarkets.com/', 'https://seoulmarkets.com/equities', 'https://seoulmarkets.com/about'],
  },
  kcw: {
    siteUrl: 'sc-domain:kculturewire.com',
    주소: ['https://www.kculturewire.com/', 'https://www.kculturewire.com/about'],
  },
  '100y': {
    siteUrl: 'sc-domain:100yearmap.com',
    주소: ['https://100yearmap.com/', 'https://100yearmap.com/about'],
  },
};

/** 구글이 돌려준 것을 «한 줄 진단»으로 옮긴다. ⛔ 모르는 것을 좋게 읽지 않는다 */
export function 진단(i) {
  if (!i) return { 빛: '⬜', 말: '못 물었다', 갈래: '못물음' };
  const cov = String(i.coverageState || '');
  if (i.robotsTxtState === 'DISALLOWED') return { 빛: '🔴', 말: 'robots.txt 가 막고 있다', 갈래: '우리가막음' };
  if (i.indexingState && /BLOCKED/.test(i.indexingState)) return { 빛: '🔴', 말: `색인 금지 — ${i.indexingState}`, 갈래: '우리가막음' };
  if (!i.lastCrawlTime) return { 빛: '🔴', 말: '구글이 한 번도 안 왔다', 갈래: '발견안됨' };
  if (i.pageFetchState && i.pageFetchState !== 'SUCCESSFUL') return { 빛: '🔴', 말: `가져가다 실패 — ${i.pageFetchState}`, 갈래: '가져가기실패' };
  if (/Submitted and indexed|색인이 생성됨|Indexed/.test(cov)) return { 빛: '✅', 말: '색인됐다', 갈래: '색인됨' };
  if (i.googleCanonical && i.userCanonical && i.googleCanonical !== i.userCanonical) {
    return { 빛: '🔴', 말: '구글이 다른 페이지와 묶었다', 갈래: 'canonical어긋남' };
  }
  return { 빛: '🔴', 말: cov || '색인 안 됐다', 갈래: '왔는데색인안함' };
}

/** 갈래마다 «무엇을 해야 하나» — 진단에서 곧바로 처방이 나오게 */
export const 처방 = {
  우리가막음: 'robots.txt·noindex 를 그 자리에서 푼다. 우리 잘못이다',
  발견안됨: '사이트맵에 들었나 · 안쪽에서 링크가 가나 · 사이트맵을 다시 냈나',
  가져가기실패: '서버가 그때 느렸거나 막았다. 응답 시간과 상태를 본다',
  canonical어긋남: '구글이 묶은 상대를 보고, 내용이 겹치면 갈라 쓴다',
  왔는데색인안함: '구글이 보고도 안 넣었다 — 내용이 얇거나 겹친다. 그 페이지만의 값을 늘린다',
  색인됨: '',
  못물음: '',
};

function 토큰만들기() {
  try {
    for (const 줄 of fs.readFileSync(path.join(뿌리, '.env'), 'utf8').split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) { /* .env 가 없어도 환경변수로 올 수 있다 */ }
  const 열쇠길 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!열쇠길 || !fs.existsSync(열쇠길)) throw new Error('GOOGLE_APPLICATION_CREDENTIALS 가 없다');
  const 키 = JSON.parse(fs.readFileSync(열쇠길, 'utf8'));
  const s0 = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    iss: 키.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token', iat: s0, exp: s0 + 3600,
  })).toString('base64url');
  const sig = createSign('RSA-SHA256').update(`${h}.${b}`).sign(키.private_key, 'base64url');
  return fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${b}.${sig}` }),
  }).then((r) => r.json()).then((j) => j.access_token);
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 됐나, 덧말 = '') => 결과.push({ 이름, 됐나: !!됐나, 덧말 });

  본다('네 사이트를 다 본다', Object.keys(볼것).length === 4);
  본다('klifemap 대표 지면이 여덟이다', 볼것.klifemap.주소.length === 8);

  본다('진단 — robots 가 막으면 우리 잘못', 진단({ robotsTxtState: 'DISALLOWED' }).갈래 === '우리가막음');
  본다('진단 — noindex 도 우리 잘못',
    진단({ robotsTxtState: 'ALLOWED', indexingState: 'BLOCKED_BY_META_TAG' }).갈래 === '우리가막음');
  본다('진단 — 크롤 기록이 없으면 «안 왔다»',
    진단({ robotsTxtState: 'ALLOWED', indexingState: 'INDEXING_ALLOWED' }).갈래 === '발견안됨');
  본다('진단 — 색인됐으면 초록',
    진단({ robotsTxtState: 'ALLOWED', indexingState: 'INDEXING_ALLOWED', lastCrawlTime: 'x', pageFetchState: 'SUCCESSFUL', coverageState: 'Submitted and indexed' }).빛 === '✅');
  본다('진단 — canonical 이 어긋나면 그렇게 적는다',
    진단({ robotsTxtState: 'ALLOWED', indexingState: 'INDEXING_ALLOWED', lastCrawlTime: 'x', pageFetchState: 'SUCCESSFUL', coverageState: 'Duplicate', userCanonical: 'a', googleCanonical: 'b' }).갈래 === 'canonical어긋남');
  본다('진단 — 왔는데 안 넣었으면 그렇게 적는다',
    진단({ robotsTxtState: 'ALLOWED', indexingState: 'INDEXING_ALLOWED', lastCrawlTime: 'x', pageFetchState: 'SUCCESSFUL', coverageState: 'Crawled - currently not indexed' }).갈래 === '왔는데색인안함');
  본다('진단 — 못 물으면 «못 물었다»', 진단(null).갈래 === '못물음');
  본다('⛔ 못 물은 것을 초록으로 읽지 않는다', 진단(null).빛 !== '✅');
  본다('갈래마다 처방이 있다',
    ['우리가막음', '발견안됨', '가져가기실패', 'canonical어긋남', '왔는데색인안함'].every((k) => 처방[k]));

  return 결과;
}

/**
 * 🔴🔴 [2026-10-01 · 5번] **이 자는 열한 장만 재고 있었다.**
 *
 * 사장님 지시로 케이라이프맵 색인을 파다가 잡았다 —
 * 사이트맵에는 주소가 **2,892개**이고 그중 **2,847개가 `/content/` 글**인데,
 * 위 `볼것` 에는 도구 지면 열한 장만 적혀 있었다.
 * ⇒ 검색 자산의 **98%를 한 번도 안 물어보고** 「색인 1장뿐」이라고 보고해 온 것이다.
 * ⛔ 「자를 먼저 의심한다」가 바로 이 자리다 — 수가 이상하면 자부터 본다.
 *
 * `--글표본 N` 을 주면 사이트맵에서 글 주소를 고르게 N개 뽑아 함께 묻는다.
 * ⚠ URL 검사 API 는 하루 한도가 있다. 전부 묻지 않고 «표본»으로 재는 까닭이다.
 */
export async function 글표본뽑기(사이트맵주소, 몇개) {
  const r = await fetch(사이트맵주소, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
  });
  const xml = await r.text();
  const 글 = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1]).filter((u) => /\/content\/[^/]+$/.test(u));
  if (글.length <= 몇개) return 글;
  const 걸음 = 글.length / 몇개;
  return Array.from({ length: 몇개 }, (_, i) => 글[Math.floor(i * 걸음)]);
}

/* ─────────────────────────────── 본 일 ─────────────────────────────── */
async function 잰다() {
  const 고른것 = process.argv.includes('--사이트')
    ? { [process.argv[process.argv.indexOf('--사이트') + 1]]: 볼것[process.argv[process.argv.indexOf('--사이트') + 1]] }
    : 볼것;

  /* 글 표본을 섞어 넣는다 — 도구 지면만 재던 눈을 넓힌다 */
  const 글표본자리 = process.argv.indexOf('--글표본');
  if (글표본자리 > 0) {
    const 몇개 = Number(process.argv[글표본자리 + 1]) || 10;
    for (const [이름, 것] of Object.entries(고른것)) {
      if (!것?.siteUrl || !것.주소?.length) continue;
      const 뿌리주소 = new URL(것.주소[0]).origin;
      try {
        const 글들 = await 글표본뽑기(`${뿌리주소}/sitemap.xml`, 몇개);
        if (글들.length) {
          것.주소 = [...것.주소, ...글들];
          console.log(`   ⭐ ${이름} — 사이트맵에서 «글» ${글들.length}개를 표본으로 더했다`);
        }
      } catch (e) { console.log(`   ⬜ ${이름} — 글 표본을 못 뽑았다: ${e.message}`); }
    }
  }

  const 토큰 = await 토큰만들기();
  const 낼것 = { 잰때: new Date().toLocaleString('ko-KR'), 사이트: {} };
  const 갈래셈 = {};

  for (const [이름, { siteUrl, 주소 }] of Object.entries(고른것)) {
    if (!siteUrl) continue;
    console.log(`\n■ ${이름}  (${siteUrl})`);
    const 줄 = [];
    for (const u of 주소) {
      let i = null, 오류 = null;
      try {
        const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + 토큰, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inspectionUrl: u, siteUrl }),
        });
        const j = await r.json();
        if (!r.ok) 오류 = `${r.status} ${String(j.error?.message || '').slice(0, 90)}`;
        else i = j.inspectionResult?.indexStatusResult ?? null;
      } catch (e) { 오류 = e.message; }

      const d = 진단(i);
      갈래셈[d.갈래] = (갈래셈[d.갈래] || 0) + 1;
      줄.push({ 주소: u, ...d, 마지막크롤: i?.lastCrawlTime || null, 덮개: i?.coverageState || null, 오류 });
      console.log(`   ${d.빛} ${u.replace(/^https?:\/\//, '').padEnd(38)} ${d.말}${오류 ? ` (${오류})` : ''}`);
      await 쉼(1100);
    }
    낼것.사이트[이름] = 줄;
  }

  console.log('\n■ 갈래별 — 여기서 처방이 갈린다');
  for (const [k, v] of Object.entries(갈래셈).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(v).padStart(3)}장  ${k}${처방[k] ? `  → ${처방[k]}` : ''}`);
  }
  낼것.갈래셈 = 갈래셈;
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2), 'utf8');
  console.log(`\n✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
  return Object.entries(갈래셈).filter(([k]) => k !== '색인됨' && k !== '못물음').reduce((a, [, v]) => a + v, 0);
}

const 이파일이진입점 =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 색인 진단 자 — 자가시험');
    for (const r of 결과) {
      if (!r.됐나) 빨강++;
      console.log(`  ${r.됐나 ? '✅' : '🔴'} ${r.이름}${r.덧말 ? `  (${r.덧말})` : ''}`);
    }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  }
  await 잰다();
}
