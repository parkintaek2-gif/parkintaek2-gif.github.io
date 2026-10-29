#!/usr/bin/env node
/* 잰다-회차속.mjs — 예약 회차 하나의 «설정 전체»를 꺼내 본다.
   새 회차를 만들려면 있는 것을 베껴야 하는데, 무엇을 베껴야 하는지부터 봐야 한다.
   ⛔ 개별 조회(GET /scheduled_tasks/<id>)는 빈 것을 돌려준다 — 목록에서 집는다.
   ⛔ 지시문 본문은 길어서 안 찍는다. 길이만 적는다.

   쓰기: node scripts/잰다-회차속.mjs <회차id> [저장할파일]
*/
import { createRequire } from 'node:module';
import fs from 'node:fs';

const 찾을id = process.argv[2];
const 저장길 = process.argv[3];
if (!찾을id) { console.log('🔴 회차 id 를 달라'); process.exit(1); }

const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.connect({ browserURL: (process.env.KLM_CHROME_PORT ? 'http://127.0.0.1:' + process.env.KLM_CHROME_PORT : 'http://127.0.0.1:9222'), defaultViewport: null, protocolTimeout: 240000 });
const page = await b.newPage();
try {
  await page.goto('https://claude.ai', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await 쉼(3000);
  const 것 = await page.evaluate(async (id) => {
    const 조직 = await (await fetch('/api/organizations', { headers: { accept: 'application/json' } })).json();
    const oid = 조직[0]?.uuid;
    const r = await (await fetch(`/api/organizations/${oid}/cowork/scheduled_tasks`,
      { headers: { accept: 'application/json' } })).json();
    const t = (r.data || []).find((x) => x.id === id);
    return { oid, t: t || null };
  }, 찾을id);

  if (!것.t) { console.log('🔴 그 회차가 목록에 없다 — 지워졌거나 id 가 다르다'); process.exit(2); }
  console.log('■ 조직 ' + 것.oid);
  console.log('■ 칸 이름 ' + Object.keys(것.t).length + '개');
  for (const [k, v] of Object.entries(것.t)) {
    const 글 = typeof v === 'object' && v !== null ? `{${Object.keys(v).join(', ')}}` : String(v);
    console.log('   · ' + k.padEnd(26) + ' ' + 글.slice(0, 110));
  }
  if (저장길) { fs.writeFileSync(저장길, JSON.stringify(것.t, null, 2), 'utf8'); console.log('\n✔ 통째로 적었다 — ' + 저장길); }
} finally { await page.close(); b.disconnect(); }
