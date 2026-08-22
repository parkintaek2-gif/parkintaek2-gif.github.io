#!/usr/bin/env node
/**
 * measure-kcw-day.mjs — **하루치 방문을 잰다.** 매일 보고의 「순방문자수」 칸에 넣을 수.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 에 2번이 새 보고 양식을 냈다 — 「순방문자수·매출·회원가입은 항상 들어간다」.
 * 그런데 우리 계측은 **순방문자수를 못 만든다.** 쿠키·IP·세션을 일부러 안 남긴다
 * (`src/lib/traffic.mjs` 의 결정이고, 그 결정을 셈 편하자고 뒤집지 않는다).
 *
 * ⭐ 그러니 이 자는 **잴 수 있는 것을 재고, 못 재는 것은 못 잰다고 말한다.**
 *   ✅ 지면 열림(page opens) — 봇 뺀 사람 요청 수
 *   ✅ 열린 지면 수 · 우리 안에서 걸어온 몫
 *   ⛔ 순방문자수(unique visitors) — **못 잰다.** 같은 사람이 세 장을 보면 3이 된다
 * ⛔ 열림 수를 「방문자수」라고 부르지 않는다. 그렇게 부르면 우리 수가 남의 수보다
 *   부풀어 보이고, 9월 목표를 재는 자가 유닛마다 달라진다.
 *
 * ⚠ 배포하면 아직 안 흘린 최대 10분치가 사라진다(traffic.mjs FLUSH_MS). 이 수는 **바닥값**이다.
 *
 * 쓰는 법  node scripts/measure-kcw-day.mjs --자가시험
 *          node scripts/measure-kcw-day.mjs --잰다 [--날=20260822]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 우리집 = ['kculturewire.com', 'www.kculturewire.com'];

function 환경읽기() {
  try {
    const 본문 = fs.readFileSync(path.join(뿌리, '.env'), 'utf8');
    for (const 줄 of 본문.split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 그만 */ }
}

/** `(내부)` 딱지가 우리 안에서 온 걸음이다 — 서버가 도메인 이름으로 안 적는다 */
export const 안에서왔나 = (유입) => {
  const raw = String(유입 ?? '').trim();
  if (raw === '(내부)') return true;
  const s = raw.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  return 우리집.includes(s);
};

/**
 * 하루치 집계를 우리 집 몫으로 접는다.
 * ⛔ 봇을 세지 않는다. ⛔ 남의 집(한 서버가 네 집을 낸다)을 세지 않는다.
 */
export function 하루접기(집계) {
  let 열림 = 0, 안쪽 = 0, 봇 = 0, 남의집 = 0;
  const 지면 = new Set();
  const 딱지별 = new Map();
  for (const [열쇠, 수] of Object.entries(집계 ?? {})) {
    const c = String(열쇠).split('\t');
    const [host, 경로, 유입, 봇표] = c;
    if (봇표 === '1') { 봇 += 수; continue; }
    if (!우리집.includes(host)) { 남의집 += 수; continue; }
    열림 += 수;
    지면.add(경로);
    if (안에서왔나(유입)) {
      안쪽 += 수;
      const 이름 = c[5] || '(딱지없음)';
      딱지별.set(이름, (딱지별.get(이름) ?? 0) + 수);
    }
  }
  return { 열림, 안쪽, 지면수: 지면.size, 봇, 남의집, 딱지별 };
}

/** 순방문자수는 이 자료로 못 만든다. **부르는 이름을 바꾸지 않는다** */
export const 순방문자수 = () => null;

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  const 집계 = {
    'www.kculturewire.com\t/\t(직접)\t0\t\t': 10,
    'www.kculturewire.com\t/\t(내부)\t0\t\trelated': 4,
    'www.kculturewire.com\t/most-read\t(내부)\t0\t\t': 2,
    'www.kculturewire.com\t/x\tgooglebot\t1\t검색봇': 500,
    'seoulmarkets.com\t/equities\t(직접)\t0\t\t': 7,
  };
  const r = 하루접기(집계);
  검('사람 열림만 센다', r.열림 === 16);
  검('봇을 따로 센다', r.봇 === 500);
  검('남의 집을 따로 센다', r.남의집 === 7);
  검('열린 지면 수를 센다', r.지면수 === 2);
  검('안쪽 걸음을 센다', r.안쪽 === 6);
  검('딱지를 갈라 센다', r.딱지별.get('related') === 4 && r.딱지별.get('(딱지없음)') === 2);
  검('⛔ 순방문자수는 못 만든다', 순방문자수() === null);
  검('빈 집계는 0', 하루접기({}).열림 === 0);
  검('null 집계에도 안 터진다', 하루접기(null).열림 === 0);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ measure-kcw-day 자가시험 통과 (9)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.error('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

환경읽기();
const { get, remoteEnabled } = await import(new URL('../src/lib/store.mjs', import.meta.url).href);
if (!remoteEnabled) { console.log('⚠ 못 쟀다 — R2 자격이 이 창에 없다'); process.exit(0); }

const 오늘 = new Date();
const 기본날 = `${오늘.getFullYear()}${String(오늘.getMonth() + 1).padStart(2, '0')}${String(오늘.getDate()).padStart(2, '0')}`;
const 날 = (process.argv.find((a) => a.startsWith('--날='))?.split('=')[1]) ?? 기본날;

const raw = await get(`raw/traffic/${날}.json`);
if (!raw) { console.log(`⚠ 못 쟀다 — ${날} 하루치가 R2 에 없다. 「0명」이 아니다`); process.exit(0); }
const s = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
const j = JSON.parse(s);
const r = 하루접기(j.집계 ?? {});

console.log(`\n# K Culture Wire — ${날} (마지막 갱신 ${j.갱신 ?? '—'})`);
console.log(`\n  지면 열림            ${r.열림.toLocaleString('en-US')}`);
console.log(`  열린 지면            ${r.지면수}장`);
console.log(`  우리 안에서 걸어온 것   ${r.안쪽.toLocaleString('en-US')} (${r.열림 ? (r.안쪽 / r.열림 * 100).toFixed(1) : '—'}%)`);
console.log(`  뺀 봇                ${r.봇.toLocaleString('en-US')}`);
console.log(`\n  ⛔ 순방문자수 — **못 잰다.** 쿠키·IP·세션을 안 남긴다. 같은 사람이 세 장을 보면 열림 3 이다.`);
console.log('     GA4 는 낼 수 있지만 프로젝트에서 Data API 가 꺼져 있다(승인 한 번 필요).');
if (r.딱지별.size) {
  console.log('\n  어느 자리의 문이 눌렸나');
  for (const [k, v] of [...r.딱지별].sort((a, b) => b[1] - a[1])) console.log(`     ${String(v).padStart(5)}  ${k}`);
}
console.log('\n  ⚠ 배포하면 아직 안 흘린 최대 10분치가 사라진다 — 이 수는 바닥값이다.');
