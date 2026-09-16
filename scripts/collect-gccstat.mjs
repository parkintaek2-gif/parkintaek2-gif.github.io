#!/usr/bin/env node
/**
 * collect-gccstat.mjs — **걸프협력회의(GCC) 통계청** (열쇠 없음 · SDMX)
 * ─────────────────────────────────────────────────────────────────────────
 * 사장님: 「GCC 통계청(GCC-STAT) 자료 … 이거 참조도 하고」 · 「잘 안 뚫려?」
 *         「끝까지 뚫는다고 해놓곤 너 웃기다」 · 「그냥 바로바로 해」
 *
 * 🔴 **내가 한 번 「막혔다」고 보고했다가 뒤집힌 자리다.** 그 경위를 적어 둔다 —
 *   막히던 곳   www.gccstat.org        Mod_Security 가 사람 브라우저까지 403 으로 막는다
 *   열린 곳     dp.marsa.gccstat.org   데이터포털. **본 사이트 어디에도 안 적혀 있다**
 *   ⇒ 검색으로 «다른 문 이름»을 찾아서 뚫었다. 「막혔다」는 «지금까지»라는 뜻이지 결론이 아니다.
 *
 * ⭐ 쓸모 — 지금 우리 걸프(UAE) 상품엔 «나라 배경»이 통째로 없다.
 *   기업 재무 옆에 그 나라의 GDP·물가·은행자산이 붙어야 손님이 값을 읽을 수 있다.
 *
 * ⚠ 카탈로그가 내주는 주소에 `&amp;` 가 섞여 온다. 그대로 치면 **0행**이 온다.
 *   내가 여기서 한 번 속았다 — 「자료가 없다」로 적을 뻔했다.
 *
 *   node scripts/collect-gccstat.mjs           받아서 쌓는다
 *   node scripts/collect-gccstat.mjs --시험    자가시험만
 */
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 카탈로그 = 'https://dp.marsa.gccstat.org/data.json';
export const 쌓는곳 = path.join(뿌리, 'archive', 'raw', 'gccstat');

/** 우리 갈래에 걸리는 것만 받는다. ⛔ 37개를 다 받지 않는다 — 안 쓸 것을 쌓으면 무엇이 도는지 흐려진다 */
export const 받을것 = /National Accounts|Consumer Prices|Monetary and Financial|Trade|Foreign Investment/i;

/**
 * 🔴 카탈로그가 HTML 로 감싼 주소를 준다. 풀어 주지 않으면 조용히 0행이 온다.
 * ⛔ 「0행이 왔다」를 「자료가 없다」로 읽지 않는다 — 내 주소가 틀린 것이다.
 */
export function 주소풀기(u) {
  return String(u ?? '')
    .replace(/&amp;/g, '&').replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/** 카탈로그에서 «우리가 받을» 것만 골라 이름과 CSV 주소를 낸다 */
export function 고른다(카탈, 재 = 받을것) {
  const d = (카탈 && 카탈.dataset) || [];
  const 낸다 = [];
  for (const x of d) {
    const 제목 = x.title || '';
    if (!재.test(제목)) continue;
    const csv = (x.distribution || []).find((r) => /csv/i.test(r.format || r.mediaType || ''));
    if (!csv) continue;
    낸다.push({ 제목, 주소: 주소풀기(csv.downloadURL || csv.accessURL || ''), 고친때: x.modified || null });
  }
  return 낸다;
}

/** CSV 행 수와 나라를 센다. ⛔ 「파일이 왔다」를 「값이 있다」로 읽지 않는다 */
export function 센다(글) {
  const 줄 = String(글 ?? '').split(/\r?\n/).filter((s) => s.trim());
  if (줄.length < 2) return { 행: 0, 나라: [], 칸: [] };
  const 칸 = 줄[0].replace(/^﻿/, '').split(',').map((s) => s.trim());
  const 나라칸 = 칸.findIndex((s) => /^COUNTRY$/i.test(s));
  const 나라 = new Set();
  if (나라칸 >= 0) for (const s of 줄.slice(1)) { const v = s.split(',')[나라칸]; if (v) 나라.add(v.trim()); }
  return { 행: 줄.length - 1, 나라: [...나라].sort(), 칸 };
}

/** 파일 이름으로 쓸 수 있게 다듬는다 */
export function 이름다듬기(제목) {
  return String(제목 ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unnamed';
}

/* ───────────────────────── 자가시험 ───────────────────────── */
function 자가시험() {
  const 것 = []; const 본다 = (이름, 참) => 것.push({ 이름, 참: !!참 });

  /* 🔴 오늘 나를 속인 바로 그 모양 */
  본다('&amp; 를 & 로 푼다', 주소풀기('a?x=1&amp;y=2') === 'a?x=1&y=2');
  본다('여러 개도 다 푼다', 주소풀기('a&amp;b&amp;c') === 'a&b&c');
  본다('멀쩡한 주소는 그대로 둔다', 주소풀기('a?x=1&y=2') === 'a?x=1&y=2');
  본다('빈 것도 안 터진다', 주소풀기(null) === '');

  const 카탈 = { dataset: [
    { title: 'National Accounts', modified: '2026-02-09', distribution: [
      { format: 'csv', downloadURL: 'https://x/na?labels=name&amp;format=csv' },
      { format: 'xlsx', downloadURL: 'https://x/na.xlsx' }] },
    { title: 'Sustainable Development Goals (SDG)', distribution: [{ format: 'csv', downloadURL: 'https://x/sdg' }] },
    { title: 'Trade', distribution: [{ format: 'xlsx', downloadURL: 'https://x/t.xlsx' }] },
  ] };
  const g = 고른다(카탈);
  본다('우리 갈래만 고른다', g.length === 1 && g[0].제목 === 'National Accounts');
  본다('고르면서 주소를 푼다', g[0].주소 === 'https://x/na?labels=name&format=csv');
  본다('CSV 가 없는 것은 안 고른다', !g.some((x) => x.제목 === 'Trade'));
  본다('SDG 는 우리 갈래가 아니다', !g.some((x) => /SDG/.test(x.제목)));
  본다('빈 카탈로그도 안 터진다', 고른다(null).length === 0);

  const c = 센다('﻿COUNTRY,UNIT,OBS_VALUE\nEmirates,USD,1\nKuwait,USD,2\nEmirates,USD,3');
  본다('행을 센다(머리 빼고)', c.행 === 3);
  본다('나라를 겹치지 않게 센다', c.나라.join(',') === 'Emirates,Kuwait');
  본다('BOM 을 벗겨 칸 이름을 읽는다', c.칸[0] === 'COUNTRY');
  본다('머리만 있으면 0행', 센다('COUNTRY,UNIT').행 === 0);
  본다('빈 글도 0행', 센다('').행 === 0);
  본다('이름을 파일용으로 다듬는다', 이름다듬기('Monetary and Financial') === 'monetary-and-financial');

  const 진 = 것.filter((x) => !x.참);
  console.log('■ 자가시험 ' + (것.length - 진.length) + '/' + 것.length);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  return 진.length === 0;
}

/* ───────────────────────── 실행 ───────────────────────── */
const 직접 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (직접) {
  if (process.argv.includes('--시험')) process.exit(자가시험() ? 0 : 1);
  if (!자가시험()) process.exit(1);
  console.log('');
  const 머리 = { 'User-Agent': 'Mozilla/5.0' };
  try {
    const r = await fetch(카탈로그, { headers: 머리, signal: AbortSignal.timeout(60000) });
    if (!r.ok) throw new Error('카탈로그가 ' + r.status);
    const 고른것 = 고른다(await r.json());
    console.log('■ GCC-Stat — ' + new Date().toLocaleString('ko-KR'));
    console.log('   받을 것 ' + 고른것.length + '개');

    const 오늘 = new Date();
    const 날 = 오늘.getFullYear() + '-' + String(오늘.getMonth() + 1).padStart(2, '0')
      + '-' + String(오늘.getDate()).padStart(2, '0');
    const 칸 = path.join(쌓는곳, 날);
    mkdirSync(칸, { recursive: true });

    let 합 = 0; const 적을것 = [];
    for (const x of 고른것) {
      try {
        const res = await fetch(x.주소, { headers: 머리, signal: AbortSignal.timeout(180000) });
        const 글 = await res.text();
        const c = 센다(글);
        if (c.행 === 0) {
          console.log('   🔴 ' + x.제목.padEnd(26) + '0행 — ⛔ 「자료가 없다」가 아니라 «내 주소가 틀렸다»로 본다');
          적을것.push({ 제목: x.제목, 행: 0, 못받음: 'HTTP ' + res.status });
          continue;
        }
        writeFileSync(path.join(칸, 이름다듬기(x.제목) + '.csv'), 글, 'utf8');
        합 += c.행;
        적을것.push({ 제목: x.제목, 행: c.행, 나라: c.나라, 칸: c.칸, 고친때: x.고친때 });
        console.log('   ✅ ' + x.제목.padEnd(26) + String(c.행).padStart(7) + '행 · 나라 ' + c.나라.length);
      } catch (e) {
        console.log('   🔴 ' + x.제목.padEnd(26) + '못 받았다 — ' + String(e.message).slice(0, 50));
        적을것.push({ 제목: x.제목, 행: 0, 못받음: String(e.message).slice(0, 80) });
      }
    }
    writeFileSync(path.join(칸, '_메모.json'), JSON.stringify({
      상품: 'GCC 통계청 주요 통계',
      출처: 'GCC-Stat Data Portal (DKAN + SDMX) — ' + 카탈로그,
      받은때: 오늘.toLocaleString('ko-KR'),
      주의: 'www.gccstat.org 는 봇을 막는다. 열린 문은 dp.marsa.gccstat.org 다',
      아닌것: ['투자 자문이 아니다'],
      받은것: 적을것,
    }, null, 1), 'utf8');
    console.log('   ─────');
    console.log('   합 ' + 합.toLocaleString('ko-KR') + '행  ✔ ' + path.relative(뿌리, 칸));
    console.log('   쌓인 날 ' + (existsSync(쌓는곳) ? readdirSync(쌓는곳).length : 0) + '개');
  } catch (e) {
    console.log('🔴 못 받았다 — ' + String(e.message).slice(0, 120));
    process.exit(1);
  }
}
