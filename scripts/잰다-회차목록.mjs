#!/usr/bin/env node
/* 잰다-회차목록.mjs — 중부매일 계정의 예약 회차를 «전부» 적어 본다.
   ⛔ 개별 조회는 빈 것을 돌려준다. 목록에서 집는다. */
import { createRequire } from 'node:module';

const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 240000 });
const page = await b.newPage();
try {
  await page.goto('https://claude.ai', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await 쉼(3000);
  const 목록 = await page.evaluate(async () => {
    const 조직 = await (await fetch('/api/organizations', { headers: { accept: 'application/json' } })).json();
    const oid = 조직[0]?.uuid;
    const r = await (await fetch(`/api/organizations/${oid}/cowork/scheduled_tasks`,
      { headers: { accept: 'application/json' } })).json();
    return (r.data || []).map((t) => ({
      id: t.id, 이름: t.name, cron: t.cron_expression, 때: t.timezone,
      켜짐: t.enabled ?? t.is_enabled, 길이: (t.derived_state?.prompt || '').length,
    }));
  });
  console.log('■ 예약 회차 ' + 목록.length + '개\n');
  for (const t of 목록) {
    console.log(`${t.켜짐 === false ? '⬜' : '✅'} ${String(t.cron).padEnd(16)} ${String(t.때 || '').padEnd(14)} ${String(t.이름).slice(0, 44).padEnd(46)} ${t.길이}자`);
    console.log(`     ${t.id}`);
  }
} finally { await page.close(); b.disconnect(); }
