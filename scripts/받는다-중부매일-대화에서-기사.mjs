#!/usr/bin/env node
/**
 * 받는다-중부매일-대화에서-기사.mjs — **시켜 놓은 대화에서 쓴 기사를 그대로 받아 온다.**
 *
 * ── 🔴 왜 (2026-11-01 · 사장님) ─────────────────────────────────────
 * 사장님 — 「**노시환 기사 중부매일한테 받아서 보내라**」
 * 거두는 자(collect-jbnews-sports-articles.mjs)는 «오늘 회차»를 훑는다.
 * 사장님이 그때 주문하신 기사는 회차 밖의 대화에 있으므로 그 자가 못 집는다.
 * ⇒ 대화 주소를 짚어 마지막 답을 그대로 받아 온다.
 *
 * ⛔ 사장님 크롬 창을 닫지 않는다 — disconnect() 만. 언제나 새 탭.
 * ⛔ 「올라왔다」를 「다 썼다」로 읽지 않는다 — 글자 수가 더 안 늘 때까지 기다린다.
 *
 * 쓰는 법
 *   node scripts/받는다-중부매일-대화에서-기사.mjs --대화 <주소> --받는곳 docs/기사.txt
 *   node scripts/받는다-중부매일-대화에서-기사.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 인자 하나를 집는다. ⛔ 값이 없으면 다음 인자를 값으로 삼지 않는다 */
export function 인자(이름, argv = process.argv) {
  const i = argv.indexOf('--' + 이름);
  if (i < 0) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

/** claude.ai 대화 주소인가 */
export function 대화주소인가(s) {
  return /^https:\/\/claude\.ai\/chat\/[0-9a-f-]{20,}$/.test(String(s ?? '').trim());
}

/** 다 쓴 글인가 — 글자 수가 더 안 늘면 다 쓴 것으로 본다 */
export function 더안느나(앞, 뒤) {
  return 앞 > 0 && 뒤 === 앞;
}

/* ── 자가시험 ───────────────────────────────────────────────────── */
export function 자가시험() {
  const 결 = [];
  const T = (이름, 참) => 결.push([이름, !!참]);
  T('대화 주소를 알아본다', 대화주소인가('https://claude.ai/chat/bda1c014-08e5-8f62-8939-2a98e90de138'));
  T('⛔ 회차 주소를 대화 주소로 보지 않는다', !대화주소인가('https://claude.ai/scheduled-task/trig_01Ew'));
  T('⛔ 빈 값을 주소로 보지 않는다', !대화주소인가('') && !대화주소인가(null));
  T('값 없는 인자에 다음 인자를 집지 않는다', 인자('대화', ['node', '자.mjs', '--대화', '--받는곳']) === null);
  T('인자 값을 제대로 집는다', 인자('대화', ['node', '자.mjs', '--대화', 'abc']) === 'abc');
  T('글자 수가 그대로면 다 쓴 것이다', 더안느나(1200, 1200));
  T('🔴 아직 늘고 있으면 다 쓴 것이 아니다', !더안느나(1200, 1800));
  T('⛔ 한 글자도 없으면 다 쓴 것이 아니다', !더안느나(0, 0));
  결.forEach(([이름, 참]) => console.log((참 ? '  ✅ ' : '  ❌ ') + 이름));
  const 깨짐 = 결.filter((x) => !x[1]).length;
  console.log(깨짐 ? `\n■ 자가시험 ${깨짐}건 실패` : '\n■ 자가시험 모두 통과');
  return 깨짐 === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  const 대화 = 인자('대화');
  const 받는곳 = 인자('받는곳');
  if (!대화주소인가(대화) || !받는곳) {
    console.error('쓰는 법: node scripts/받는다-중부매일-대화에서-기사.mjs --대화 <https://claude.ai/chat/…> --받는곳 docs/기사.txt');
    process.exit(1);
  }

  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const 포트 = process.env.KLM_CHROME_PORT || '9222';
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + 포트, defaultViewport: null });
  const page = await b.newPage();
  let 끝값 = 1;

  const 해본다 = async () => {
    await page.setViewport({ width: 1400, height: 950 });
    await page.goto(대화, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await 잠깐(6000);

    /* 🔴 [2026-11-01 15:0x] 내가 지어낸 선택자로 150초 동안 «0자»를 읽었다.
       거두는 자(collect-jbnews-sports-articles.mjs)가 쓰는 «이미 재 본» 선택자를 그대로 쓴다.
       ⛔ 이미 도는 길이 있으면 새로 짓지 않는다 */
    const 읽는다 = () => page.evaluate(() => {
      const n = [...document.querySelectorAll('[data-testid="assistant-message"]')];
      return n.length ? n[n.length - 1].innerText : '';
    });

    /* ⛔ 「올라왔다」를 「다 썼다」로 읽지 않는다 — 더 안 늘 때까지 본다 (최대 12분) */
    let 앞 = -1; let 글 = '';
    for (let i = 0; i < 72; i++) {
      await 잠깐(10000);
      글 = await 읽는다();
      const 이제 = 글.replace(/\s/g, '').length;
      if (i % 3 === 0) console.log(`  ${String(i * 10).padStart(4)}초  ${이제}자`);
      if (더안느나(앞, 이제) && 이제 > 300) break;
      앞 = 이제;
    }

    if (글.replace(/\s/g, '').length < 300) {
      console.log(`⬜ 못 받았다 — 받아 온 글이 ${글.replace(/\s/g, '').length}자뿐이다. 아직 쓰는 중이거나 대화를 잘못 짚었다`);
      return;
    }
    fs.writeFileSync(받는곳, 글.trim() + '\n', 'utf8');
    console.log(`✅ 받았다 — ${글.length}자 · ${받는곳}`);
    끝값 = 0;
  };

  try { await 해본다(); } finally { await page.close(); b.disconnect(); }
  process.exit(끝값);
}
