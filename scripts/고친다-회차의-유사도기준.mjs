#!/usr/bin/env node
/**
 * 고친다-회차의-유사도기준.mjs — **회차가 스스로 재는 자와 데스킹이 막는 자를 맞춘다.**
 *
 * ── 🔴🔴🔴 왜 (2026-10-29 · 5번) ───────────────────────────────────
 * 이틀 연속 같은 까닭으로 기사가 버려졌다 —
 *   2026-10-28 15시  자체기사 미충족
 *   2026-10-29 14시  자체기사 미충족 (데스킹말: 「원고 55% → 데스킹 후 약 45%」)
 *
 * 까닭을 캐 보니 **회차 지침 안에 자가 둘이고 눈금이 다르다** —
 * ```
 * 「4. 다 쓰면 스스로 검사한다」  · 선행보도와 유사도 50% 미만인가?   ← 회차가 재는 자
 * 「자체기사가 되는 길」          · 유사도가 30%를 넘으면 미충족       ← 데스킹이 막는 자
 * ```
 * 회차는 45%를 보고 「50% 미만이니 됐다」고 스스로 통과시킨다. 그리고 뒤에서 막힌다.
 * ⛔ 자가 둘이면 느슨한 쪽이 이긴다. **눈금이 다른 자 둘을 한 지침에 두지 않는다.**
 *
 * ⚠ 이 자는 그 한 줄만 바꾼다. 다른 칸은 손대지 않는다.
 *
 * 쓰는 법
 *   node scripts/고친다-회차의-유사도기준.mjs            무엇이 바뀌는지만 본다
 *   node scripts/고친다-회차의-유사도기준.mjs --적는다
 *   node scripts/고친다-회차의-유사도기준.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

export const 조직 = '953d4e54-f96e-4d6d-b33e-33311fbd09ad';

export const 옛줄 = '- 선행보도와 유사도 50% 미만인가?';
export const 새줄 = [
  '- 🔴 선행보도와 유사도 **30% 미만**인가? (데스킹이 막는 눈금이 30%다 — 50%가 아니다)',
  '  · 45%는 «통과»가 아니다. 2026-10-28·29 에 45%짜리 두 편이 그대로 버려졌다.',
  '  · 30% 아래로 내리는 길은 아래 「자체기사가 «되는» 길」의 ①(직접 들은 말)과',
  '    ②(내가 센 수) 둘뿐이다. 둘 중 «적어도 하나»를 넣었는지 여기서 다시 확인한다.',
  '  · 넣은 것을 이름으로 적는다 — 「② 내가 센 수: 최근 5년 PO 3차전 선발 평균자책점」처럼.',
  '  · 둘 다 못 넣었으면 «보내지 않는다». 「자체기사 요건을 못 채웠습니다」라고 적는다.',
].join('\n');

/** 지침에서 그 한 줄만 갈아끼운다 */
export function 갈아끼운다(옛글) {
  const s = String(옛글 ?? '');
  if (s.includes(새줄)) return { 글: s, 바뀌었나: false, 까닭: '이미 30% 로 되어 있다' };
  if (!s.includes(옛줄)) return { 글: s, 바뀌었나: false, 까닭: '그 줄을 못 찾았다 — 손으로 봐야 한다' };
  const 몇 = s.split(옛줄).length - 1;
  return { 글: s.split(옛줄).join(새줄), 바뀌었나: true, 까닭: `50% 를 30% 로 바꾼다 (${몇}군데)` };
}

if (process.argv.includes('--자가시험')) {
  let 총 = 0; let 흠 = 0;
  const 본다 = (이름, 참) => { 총 += 1; if (참) console.log('  ✅ ' + 이름); else { 흠 += 1; console.log('  ❌ ' + 이름); } };
  const r = 갈아끼운다('앞\n' + 옛줄 + '\n뒤');
  본다('50% 줄이 사라진다', !r.글.includes(옛줄));
  본다('30% 줄이 들어간다', r.글.includes('30% 미만'));
  본다('앞뒤는 그대로다', r.글.startsWith('앞') && r.글.endsWith('뒤'));
  본다('바뀐 것을 바뀌었다고 말한다', r.바뀌었나 === true);
  본다('두 번 돌려도 또 안 바꾼다', 갈아끼운다(r.글).바뀌었나 === false);
  본다('그 줄이 없으면 손대지 않는다', 갈아끼운다('아무 글').바뀌었나 === false);
  본다('⛔ 못 찾은 것을 「이미 됐다」로 적지 않는다',
    갈아끼운다('아무 글').까닭.includes('못 찾았다'));
  const 둘 = 갈아끼운다(옛줄 + '\n중간\n' + 옛줄);
  본다('두 군데 있으면 둘 다 바꾼다', 둘.글.split('30% 미만').length - 1 === 2);
  console.log(`\n  ${총 - 흠}/${총} 통과`);
  process.exit(흠 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const 적는다 = process.argv.includes('--적는다');
  const 수집기글 = fs.readFileSync(path.join(여기, 'collect-jbnews-sports-articles.mjs'), 'utf8');
  const 표 = [...수집기글.matchAll(/\['(\d{2})',\s*'(trig_[0-9A-Za-z]+)'\]/g)].map((m) => [m[1], m[2]]);
  const 본것 = new Set();
  const 회차들 = 표.filter(([시]) => { if (본것.has(시)) return false; 본것.add(시); return true; });

  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: (process.env.KLM_CHROME_PORT ? 'http://127.0.0.1:' + process.env.KLM_CHROME_PORT : 'http://127.0.0.1:9222'), defaultViewport: null });
  const page = await b.newPage();
  let 흠 = 0;
  try {
    await page.goto('https://claude.ai/recents', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 2500));
    for (const [시, trig] of 회차들) {
      const 받은 = await page.evaluate(async (조직2, t) => {
        const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${t}`, { headers: { accept: 'application/json' } });
        return { 상태: res.status, 글: await res.text() };
      }, 조직, trig);
      if (받은.상태 !== 200) { console.log(`🔴 ${시}시 — 못 읽었다 (${받은.상태})`); 흠 += 1; continue; }
      const 트리거 = JSON.parse(받은.글).trigger;
      const 옛글 = 트리거.derived_state?.prompt;
      if (typeof 옛글 !== 'string' || !옛글) { console.log(`🔴 ${시}시 — 지침 자리를 못 찾았다`); 흠 += 1; continue; }
      const r = 갈아끼운다(옛글);
      if (!r.바뀌었나) { console.log(`⬜ ${시}시 — ${r.까닭}`); continue; }
      console.log(`🟡 ${시}시 — ${r.까닭} (${옛글.length} → ${r.글.length}자)`);
      if (!적는다) continue;

      const 되돌릴방 = path.join(뿌리, 'archive', 'raw', 'jbnews-sports-prompt', new Date().toLocaleDateString('sv-SE'));
      fs.mkdirSync(되돌릴방, { recursive: true });
      fs.writeFileSync(path.join(되돌릴방, `${시}시-유사도기준-고치기전.json`), 받은.글, 'utf8');

      const 답 = await page.evaluate(async (조직2, t, prompt) => {
        const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${t}`, {
          method: 'PATCH', headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        return { 상태: res.status, 글: (await res.text()).slice(0, 200) };
      }, 조직, trig, r.글);
      if (답.상태 !== 200) { console.log(`🔴 ${시}시 — 못 썼다 (${답.상태})`); 흠 += 1; continue; }

      const 다시 = await page.evaluate(async (조직2, t) => {
        const res = await fetch(`/api/organizations/${조직2}/cowork/scheduled_tasks/${t}`, { headers: { accept: 'application/json' } });
        return await res.text();
      }, 조직, trig);
      const t2 = JSON.parse(다시).trigger;
      const 세자리 = [
        t2.derived_state?.prompt,
        t2.session_request?.events?.[1]?.payload?.internal_anthropic_catchall?.message?.content,
        t2.job_config?.ccr?.events?.[1]?.data?.message?.content,
      ];
      const 든가 = 세자리.every((s) => String(s || '') === r.글);
      console.log(든가 ? `✅ ${시}시 — 들어갔다. 세 자리가 같다`
        : `🔴 ${시}시 — 썼다는데 돌아온 글이 다르다 (${세자리.map((s) => String(s || '').length).join(' / ')})`);
      if (!든가) 흠 += 1;
    }
  } finally { await b.disconnect(); }
  if (!적는다) console.log('\n   --적는다 로 써넣는다');
  process.exit(흠 ? 1 : 0);
}
