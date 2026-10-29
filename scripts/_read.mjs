import { createRequire } from 'node:module';
const { 조직 } = await import('./set-jbnews-sports-prompt.mjs');
const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');
const b = await puppeteer.connect({ browserURL: (process.env.KLM_CHROME_PORT ? 'http://127.0.0.1:' + process.env.KLM_CHROME_PORT : 'http://127.0.0.1:9222'), defaultViewport: null });
try {
  const 탭 = (await b.pages()).find((p) => p.url().includes('scheduled-task'));
  if (!탭) { console.log('🔴 회차 탭이 없다'); }
  else {
    /* ⛔ 사장님 탭을 다른 데로 옮기지 않는다 — 글자만 읽는다 */
    const r = await 탭.evaluate(async (조직2) => {
      const 글 = (document.body.innerText || '').slice(0, 400);
      let 계정 = null, 예약 = null;
      try {
        const a = await fetch('/api/bootstrap', { headers: { accept: 'application/json' } });
        if (a.ok) 계정 = (await a.json())?.account?.email_address ?? null;
      } catch {}
      try {
        const c = await fetch('/api/organizations/' + 조직2 + '/cowork/scheduled_tasks', { headers: { accept: 'application/json' } });
        예약 = c.status;
      } catch {}
      return { 주소: location.href, 계정, 예약, 글 };
    }, 조직);
    console.log('주소 ' + r.주소);
    console.log('이 탭의 계정 ' + r.계정 + ' · 중부매일 예약 질의 ' + r.예약);
    console.log('화면 글 ──');
    console.log(r.글.split('\n').filter(Boolean).slice(0, 10).map((x) => '   ' + x.slice(0, 80)).join('\n'));
  }
} finally { await b.disconnect(); }
