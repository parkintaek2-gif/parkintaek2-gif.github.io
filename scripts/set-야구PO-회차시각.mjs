#!/usr/bin/env node
/**
 * set-야구PO-회차시각.mjs — **일요일 18시에 한 번만 뜨는 자리를 만든다.**
 *
 * ── 🔴 왜 (2026-10-24 19:3x · 사장님) ─────────────────────────────
 * 「내일 프로야구 플레이오프 1차전 2시에 대구에서 삼성과 기아가 경기를 한다.
 *  이것도 나중에 기사써야함..조치해놔」
 *
 * ── 무엇이 막고 있었나 (실측) ─────────────────────────────────────
 * ```
 * 25 8  * * *     스포츠 09시   일요일에 돈다 — 08:25  🔴 경기 시작 전이다
 * 25 10 * * *     스포츠 11시   일요일에 돈다 — 10:25  🔴 경기 시작 전이다
 * 25 15 * * *     스포츠 16시   일요일에 돈다 — 15:25  🔴 아직 3회쯤이다
 * 25 13 * * 1-5   스포츠 14시   평일만 — 일요일엔 «안 돈다»
 * 25 14 * * 1-5   스포츠 15시   평일만 — 일요일엔 «안 돈다»   ⬅ 이 자리를 빌린다
 * ```
 * 14시에 시작한 야구는 보통 17시를 넘겨 끝난다. **끝난 뒤에 뜨는 자리가 하나도 없었다.**
 *
 * ── 어떻게 ────────────────────────────────────────────────────
 * 일요일에 어차피 «안 도는» 「스포츠 15시」의 cron 을 **10월 25일 18:00 한 번**으로 바꾼다.
 *   `25 14 * * 1-5`  →  `0 18 25 10 *`
 * ⭐ 18시로 잡은 까닭 — 거두는 자는 10분마다 돌고, 10/25 는 19시까지 열려 있다.
 *   18:00 에 써서 18:20 쯤 거두면 마감(19시)까지 40분이 남는다.
 * ⛔ 「스포츠 16시」를 건드리지 않는다 — 거기엔 사장님이 시키신 KBL 종합이 올라가 있다.
 *
 * ⛔ **되돌려야 한다.** 안 되돌리면 「스포츠 15시」가 평일 14:25 에 영영 안 뜬다.
 *   일요일 21:30 예약(run-일요일지시-되돌린다.cmd)이 --되돌린다 를 부른다.
 *
 * 쓰는 법
 *   node scripts/set-야구PO-회차시각.mjs --본다
 *   node scripts/set-야구PO-회차시각.mjs --바꾼다
 *   node scripts/set-야구PO-회차시각.mjs --되돌린다
 *   node scripts/set-야구PO-회차시각.mjs --자가시험
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const 빌릴회차 = {
  시: '15',
  id: 'trig_01EwjhZx3AKXuEyHK82N9DEn',
  평소: 'CRON_TZ=Asia/Seoul 25 14 * * 1-5',
  하루만: 'CRON_TZ=Asia/Seoul 0 18 25 10 *',       /* 10월 25일 18:00 — 한 번 */
};

/** 지금 cron 을 보고 무엇으로 바꿀지 정한다. 바꿀 것이 없으면 null */
export function 바꿀것(지금, 무엇, 회차 = 빌릴회차) {
  const c = String(지금 ?? '').trim();
  if (!c) return null;                                  /* 못 읽었다 — 「바꿀 것이 없다」가 아니다 */
  const 갈곳 = 무엇 === '바꾼다' ? 회차.하루만 : 회차.평소;
  if (c === 갈곳) return null;                          /* 이미 그렇다 */
  return 갈곳;
}

/** 바뀐 뒤에 바라던 꼴인가 — 200 만 보고 「됐다」로 읽지 않는다 */
export function 됐나(지금, 무엇, 회차 = 빌릴회차) {
  const c = String(지금 ?? '').trim();
  return c === (무엇 === '바꾼다' ? 회차.하루만 : 회차.평소);
}

export function 자가시험() {
  let 통과 = 0; let 탈 = 0;
  const 검 = (이름, 참) => { if (참) { 통과++; console.log('✅', 이름); } else { 탈++; console.log('🔴', 이름); } };

  검('평일 14:25 를 10월 25일 18:00 으로 바꾼다',
    바꿀것(빌릴회차.평소, '바꾼다') === 'CRON_TZ=Asia/Seoul 0 18 25 10 *');
  검('되돌리면 평일 14:25 로 돌아온다',
    바꿀것(빌릴회차.하루만, '되돌린다') === 빌릴회차.평소);
  검('⛔ 이미 그 꼴이면 건드리지 않는다', 바꿀것(빌릴회차.하루만, '바꾼다') === null);
  검('⛔ 못 읽은 것(빈 글)을 「바꿀 것이 없다」로 읽지 않는다', 바꿀것('', '바꾼다') === null);

  /* 🔴 시각이 틀리면 기사가 통째로 못 나간다 — 숫자 자리를 하나씩 본다 */
  const 칸 = 빌릴회차.하루만.replace('CRON_TZ=Asia/Seoul ', '').split(/\s+/);
  검('분이 0 이다', 칸[0] === '0');
  검('시가 18 이다 — 경기가 끝난 뒤다', 칸[1] === '18');
  검('날이 25 일이다', 칸[2] === '25');
  검('달이 10 월이다', 칸[3] === '10');
  검('⛔ 요일을 묶지 않는다 — 묶으면 25일이 그 요일이 아닐 때 안 뜬다', 칸[4] === '*');
  검('⛔ 18시는 마감(19시)보다 이르다 — 거둘 틈이 있다', Number(칸[1]) < 19);
  검('⛔ 경기 시작(14시)보다 늦다', Number(칸[1]) > 14);

  검('🔴 「스포츠 16시」를 건드리지 않는다 — 거기엔 KBL 이 올라가 있다',
    빌릴회차.id !== 'trig_01ErSZQm2VhuNYMRBi3MCufF');
  검('빌리는 자리는 일요일에 원래 «안 도는» 평일 회차다', /1-5\s*$/.test(빌릴회차.평소));

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통과} 통과`);
  return 탈 === 0;
}

async function 돈다(무엇) {
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));
  const b = await puppeteer.connect({ browserURL: (process.env.KLM_CHROME_PORT ? 'http://127.0.0.1:' + process.env.KLM_CHROME_PORT : 'http://127.0.0.1:9222'), defaultViewport: null, protocolTimeout: 240000 });
  const page = await b.newPage();
  try {
    await page.goto('https://claude.ai', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await 쉼(3000);
    const 결과 = await page.evaluate(async (인자) => {
      const { id, 갈곳, 본다 } = 인자;
      const 조직 = await (await fetch('/api/organizations', { headers: { accept: 'application/json' } })).json();
      const oid = 조직[0]?.uuid;
      /* ⛔ 개별 조회는 빈 것을 돌려준다 — 목록에서 집는다 */
      const 목록받기 = async () => (await (await fetch(
        `/api/organizations/${oid}/cowork/scheduled_tasks`,
        { headers: { accept: 'application/json' } })).json()).data || [];
      const 전 = (await 목록받기()).find((t) => t.id === id) || null;
      if (!전) return { 못찾았다: true };
      if (본다 || !갈곳) return { 이름: 전.name, 옛: 전.cron_expression, 지금: 전.cron_expression, 다음: 전.next_run_at };
      const res = await fetch(`/api/organizations/${oid}/cowork/scheduled_tasks/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ cron_expression: 갈곳 }),
      });
      await new Promise((r) => setTimeout(r, 1200));
      const 뒤 = (await 목록받기()).find((t) => t.id === id) || {};
      return { 이름: 전.name, 옛: 전.cron_expression, 보낸것: 갈곳, 상태: res.status,
        지금: 뒤.cron_expression, 다음: 뒤.next_run_at };
    }, { id: 빌릴회차.id, 갈곳: 무엇 === '본다' ? null : 바꿀것(null, 무엇) || (무엇 === '바꾼다' ? 빌릴회차.하루만 : 빌릴회차.평소), 본다: 무엇 === '본다' });

    if (결과.못찾았다) { console.log('🔴 그 회차가 목록에 없다 — id 가 바뀌었거나 지워졌다'); return 1; }
    console.log(`　 ${빌릴회차.시}시 「${결과.이름}」`);
    console.log(`     ${String(결과.옛 || '').replace('CRON_TZ=Asia/Seoul ', '')}`
      + (결과.보낸것 ? `  →  ${String(결과.지금 || '').replace('CRON_TZ=Asia/Seoul ', '')}` : ''));
    if (결과.다음) console.log(`     다음 실행 ${String(결과.다음).slice(0, 16)}`);
    if (무엇 === '본다') return 0;
    if (!됐나(결과.지금, 무엇)) { console.log('🔴 안 들어갔다 — 다시 읽어 보니 옛 꼴 그대로다'); return 1; }
    console.log('✅ 들어갔다 — 다시 읽어 확인했다');
    return 0;
  } finally { try { await page.close(); } catch (e) {} b.disconnect(); }
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  const 무엇 = process.argv.includes('--바꾼다') ? '바꾼다'
    : process.argv.includes('--되돌린다') ? '되돌린다'
      : process.argv.includes('--본다') ? '본다' : null;
  if (!무엇) { console.log('쓰는 법: --본다 | --바꾼다 | --되돌린다 | --자가시험'); process.exit(1); }
  console.log(`■ 「스포츠 15시」를 빌려 일요일 18시에 한 번 띄운다 — ${무엇}`);
  console.log('  (사장님 2026-10-24 「프로야구 플레이오프 1차전 … 조치해놔」)\n');
  process.exit(await 돈다(무엇));
}
