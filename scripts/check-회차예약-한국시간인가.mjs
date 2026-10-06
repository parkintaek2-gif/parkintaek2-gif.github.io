#!/usr/bin/env node
/**
 * 🔴🔴🔴 **회차 예약이 한국표준시로 도나 — 날마다 다시 본다.**
 *
 * 사장님 (2026-10-06): 「**한국표준시간으로 하는 걸 못박아놔**」
 * 그리고 같은 날: 「**같은 실수를 왜 반복하나**」
 *
 * ⛔ 반복하는 까닭은 하나다 — **규칙을 「글」로만 갖고 「검사」로 안 갖고 있어서**다.
 *   CLAUDE.md 에 「시각은 한국시간(KST)」이 이미 적혀 있었다. 그런데도 회차 예약 여섯 가운데
 *   **넷(10·11·15·16시)에 `CRON_TZ` 머리가 아예 없었다.** UTC 로 돌면서 «우연히» 맞아
 *   아무도 몰랐다. 서머타임이나 서버 설정이 바뀌면 그날 조용히 아홉 시간이 어긋난다.
 *
 * ⇒ 글은 사람이 기억해야 지켜진다. 기억은 샌다. **검사는 안 샌다.**
 *
 * 세 칸으로 본다 — 맞다 / 틀렸다 / **못 읽었다**.
 * ⛔ 화면이 안 열린 것을 「맞다」로 읽지 않는다. 그러면 또 모르고 지나간다.
 *
 * 쓰기 —
 *   node scripts/check-회차예약-한국시간인가.mjs            본다
 *   node scripts/check-회차예약-한국시간인가.mjs --고친다   틀린 것을 그 자리에서 붙인다
 *   node scripts/check-회차예약-한국시간인가.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 회차 } from './회차-예약시각-당긴다.mjs';

/** 우리 시간대. ⛔ 다른 값을 쓰지 않는다 — 사장님이 못 박으셨다 */
export const 우리시간대 = 'Asia/Seoul';

/**
 * cron 글이 한국표준시로 적혀 있나.
 * ⛔ 못 읽으면 '못읽음' — 「맞다」가 아니다.
 */
export function 한국시간인가(cron글) {
  const s = String(cron글 ?? '').trim();
  if (!s) return { 결: '못읽음', 까닭: '빈 글이다' };
  const m = /^CRON_TZ=([^\s]+)\s+/.exec(s);
  if (!m) return { 결: '틀렸다', 까닭: 'CRON_TZ 머리가 없다 — UTC 로 돈다' };
  if (m[1] !== 우리시간대) return { 결: '틀렸다', 까닭: `시간대가 ${m[1]} 다 — ${우리시간대} 여야 한다` };
  const 칸 = s.slice(m[0].length).split(/\s+/);
  if (칸.length !== 5) return { 결: '못읽음', 까닭: `칸이 ${칸.length}개다` };
  return { 결: '맞다', 시간대: m[1], 분: 칸[0], 시: 칸[1] };
}

/** 머리가 없거나 틀린 cron 에 우리 시간대를 붙인다. ⛔ 분·시는 «그대로» 둔다 */
export function 한국시간붙이기(cron글) {
  const s = String(cron글 ?? '').trim();
  if (!s) return null;
  const 몸 = s.replace(/^CRON_TZ=[^\s]+\s+/, '');
  const 칸 = 몸.split(/\s+/);
  if (칸.length !== 5) return null;
  /* ⚠ 머리가 «없던» 것은 UTC 로 돌고 있었다. 시각을 그대로 두면 아홉 시간 어긋난다.
     ⛔ 그래서 이 자는 머리만 붙이지 «않는다» — 시각까지 KST 로 옮긴다. */
  const 머리있었나 = /^CRON_TZ=/.test(s);
  if (머리있었나) return `CRON_TZ=${우리시간대} ${몸}`;
  const 시 = Number(칸[1]);
  if (!Number.isInteger(시) || 시 < 0 || 시 > 23) return null;   /* 별표·목록은 손대지 않는다 */
  칸[1] = String((시 + 9) % 24);
  return `CRON_TZ=${우리시간대} ${칸.join(' ')}`;
}

/* ── 자가시험 ───────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 본다 = (말, 참) => { if (참) { 통 += 1; console.log('✅ ' + 말); } else { 탈 += 1; console.log('🔴 ' + 말); } };

  본다('⭐ 한국시간이면 맞다', 한국시간인가('CRON_TZ=Asia/Seoul 25 8 * * *').결 === '맞다');
  본다('🔴 머리가 없으면 틀렸다 — 10·11·15·16시가 이랬다',
    한국시간인가('0 1 * * 1-5').결 === '틀렸다');
  본다('그 까닭을 적는다', 한국시간인가('0 1 * * 1-5').까닭.includes('UTC'));
  본다('🔴 다른 시간대도 틀렸다', 한국시간인가('CRON_TZ=UTC 0 9 * * *').결 === '틀렸다');
  본다('⬜ 빈 글은 «못읽음»이다 — 「맞다」가 아니다',
    한국시간인가('').결 === '못읽음' && 한국시간인가(null).결 === '못읽음');
  본다('⬜ 칸 수가 다르면 못읽음', 한국시간인가('CRON_TZ=Asia/Seoul 0 9 * *').결 === '못읽음');

  본다('머리가 있던 것은 시각을 그대로 둔다',
    한국시간붙이기('CRON_TZ=UTC 25 8 * * *') === 'CRON_TZ=Asia/Seoul 25 8 * * *');
  본다('🔴 머리가 «없던» 것은 UTC 였으므로 시각을 아홉 시간 옮긴다',
    한국시간붙이기('0 1 * * 1-5') === 'CRON_TZ=Asia/Seoul 0 10 * * 1-5');
  본다('⭐ 자정을 넘어가도 센다', 한국시간붙이기('0 20 * * *') === 'CRON_TZ=Asia/Seoul 0 5 * * *');
  본다('⛔ 별표 시각은 손대지 않는다 — null', 한국시간붙이기('0 * * * *') === null);
  본다('⛔ 빈 것도 null', 한국시간붙이기(null) === null && 한국시간붙이기('') === null);

  본다('회차 여섯을 본다', 회차.length === 6);

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  return 탈 ? 1 : 0;
}

async function 주다() {
  const 고친다 = process.argv.includes('--고친다');
  const puppeteer = await import('puppeteer-core');
  const b = await puppeteer.default.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 10 * 60_000 });
  const page = await b.newPage();
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  let 틀림 = 0; let 못읽음 = 0;
  console.log('\n■ 회차 예약이 한국표준시로 도나 — 사장님 「한국표준시간으로 하는 걸 못박아놔」');
  try {
    await page.goto(`https://claude.ai/scheduled-task/${회차[0][1]}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await 잠깐(6000);
    const 조직 = await page.evaluate(async () => {
      const r = await fetch('/api/organizations', { headers: { accept: 'application/json' } });
      const j = await r.json();
      return (Array.isArray(j) ? j : j.organizations || [])[0]?.uuid ?? null;
    });
    if (!조직) { console.log('   ⬜ 조직을 못 찾았다 — 「맞다」로 읽지 않는다'); return 1; }

    for (const [시, trig] of 회차) {
      const cron = await page.evaluate(async (o, t) => {
        try {
          const r = await fetch(`/api/organizations/${o}/cowork/scheduled_tasks/${t}`, { headers: { accept: 'application/json' } });
          if (!r.ok) return null;
          return (await r.json())?.trigger?.cron_expression ?? null;
        } catch { return null; }
      }, 조직, trig);

      const 것 = 한국시간인가(cron);
      if (것.결 === '맞다') { console.log(`   ✅ ${시}시  ${cron}`); continue; }
      if (것.결 === '못읽음') { console.log(`   ⬜ ${시}시 — 못 읽었다 (${것.까닭}). ⛔ 「맞다」가 아니다`); 못읽음 += 1; continue; }

      console.log(`   🔴 ${시}시  ${cron}`);
      console.log(`        ${것.까닭}`);
      틀림 += 1;
      if (!고친다) continue;
      const 새것 = 한국시간붙이기(cron);
      if (!새것) { console.log('        ⬜ 손댈 수 없는 꼴이다'); continue; }
      const 답 = await page.evaluate(async (o, t, c) => {
        const res = await fetch(`/api/organizations/${o}/cowork/scheduled_tasks/${t}`, {
          method: 'PATCH',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({ cron_expression: c }),
        });
        return res.status;
      }, 조직, trig, 새것);
      console.log(`        ${답 === 200 ? `✅ 붙였다 → ${새것}` : `🔴 못 썼다 (${답})`}`);
      await 잠깐(1000);
    }
  } finally {
    try { await page.close(); } catch { /* 내가 연 탭만 */ }
    b.disconnect();
  }
  if (틀림 && !고친다) console.log('\n   ✅ 고치는 법 — 같은 자에 --고친다 를 붙여 돌린다');
  if (못읽음) console.log('   ⬜ 못 읽은 것이 있다 — 「초록」으로 읽지 않는다');
  if (!틀림 && !못읽음) console.log('\n   ✅ 여섯 다 한국표준시다');
  return (틀림 || 못읽음) ? 1 : 0;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험());
  process.exit(await 주다());
}
