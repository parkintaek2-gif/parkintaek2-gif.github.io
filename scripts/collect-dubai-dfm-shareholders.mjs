#!/usr/bin/env node
/**
 * collect-dubai-dfm-shareholders.mjs — DFM(두바이) 상장사 5%대 대주주 지분율.
 * 사람(이사회) 축은 CLAUDE.md 「주력과 서비스」로 곁들이일 뿐이라 짧게 다룬다 —
 * ADX 와 짝을 맞추는 최소한만 한다.
 *
 *   node scripts/collect-dubai-dfm-shareholders.mjs --자가시험
 *   node scripts/collect-dubai-dfm-shareholders.mjs                전 종목(131개사)
 *
 * ── 실측(2026-09-14) ────────────────────────────────────────────────────────
 *   POST api2.dfm.ae/web/widgets/v1/data  Command=GetFreshTopShareholders&Company=<종목>&symbol=<종목>
 *   ⛔ DFM 에는 «이사회 명단» 엔드포인트를 못 찾았다(GetBoardMembers·boardofdirectors 등
 *     여러 이름을 시도했으나 전부 빈 응답) — 「없다」가 아니라 «못 찾았다»로 남긴다.
 *     이사회는 다음에 시간 나면 다시 찾는다. 대주주만 이번에 완성한다.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { put } from '../src/lib/store.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const WIDGET_URL = 'https://api2.dfm.ae/web/widgets/v1/data';

async function widget(command, extra = {}) {
  const body = new URLSearchParams({ Command: command, Language: 'en', lang: 'en', ...extra });
  const r = await fetch(WIDGET_URL, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  return r.json();
}

/** 원본 Item2 배열 → 중요한 칸만(공백투성이 이름 앞뒤를 다듬고, 숫자 아닌 지분율은 버린다). */
export function 대주주골라내기(raw) {
  const rows = raw?.Item2;
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    name: String(r.Name ?? '').trim(),
    percentage: Number(r.Percentage),
    associated: Boolean(r.IsAssociated),
  })).filter((r) => r.name && Number.isFinite(r.percentage))
    .sort((a, b) => b.percentage - a.percentage);
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  const 가짜 = {
    Item1: '11 September 2026',
    Item2: [
      { Name: '  Some Holding LLC   ', Shareholders: null, IsAssociated: false, Percentage: '22.2723' },
      { Name: 'EITL DIFC SPC 1 LTD', Shareholders: null, IsAssociated: true, Percentage: '7.4563' },
      { Name: '깨진값', IsAssociated: false, Percentage: 'NaN문자' },
      { Name: '', IsAssociated: false, Percentage: '5.0' },
    ],
  };
  const 골라낸것 = 대주주골라내기(가짜);
  재다('대주주골라내기: 숫자 아닌 지분율·빈 이름은 버린다', 골라낸것.length === 2);
  재다('대주주골라내기: 이름 앞뒤 공백을 다듬는다', 골라낸것[0].name === 'Some Holding LLC');
  재다('대주주골라내기: 지분율 내림차순', 골라낸것[0].percentage === 22.2723);
  재다('대주주골라내기: 빈 배열 입력은 빈 배열', 대주주골라내기({}).length === 0);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 돌리지 않는다.'); process.exit(1); }
console.log('');

const 대기 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 종목목록받기() {
  const rows = await widget('LiteSecuritiesLists', { securitytype: 'equities' });
  if (!Array.isArray(rows) || !rows.length) throw new Error('LiteSecuritiesLists 가 빈 배열');
  return rows.map((r) => r.SecuritySymbol).filter(Boolean);
}

async function main() {
  const 인자i = process.argv.indexOf('--종목');
  const 종목들 = 인자i !== -1
    ? (process.argv[인자i + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    : await 종목목록받기();
  if (인자i === -1) console.log(`${종목들.length}개 종목`);

  let 성공 = 0; let 대주주있음 = 0; let 실패 = 0;
  for (const 종목 of 종목들) {
    try {
      const raw = await widget('GetFreshTopShareholders', { Company: 종목, symbol: 종목 });
      const 대주주 = 대주주골라내기(raw);
      if (대주주.length) 대주주있음 += 1;

      await put(`raw/dubai-dfm-shareholders/${종목}.json`, JSON.stringify({
        _meta: {
          product: 'DFM listed company — substantial shareholders',
          symbol: 종목,
          asOf: raw?.Item1 ?? null,
          builtAt: new Date().toISOString(),
          source: 'Dubai Financial Market (DFM) public widget API (api2.dfm.ae) — no login, no key',
          notThis: ['Board/management roster not found on this exchange yet — see header comment.', 'Not investment advice.'],
        },
        substantialShareholders: 대주주,
      }, null, 1), 'application/json');
      console.log(`  ✅ ${종목}  대주주 ${대주주.length}건`);
      성공 += 1;
      await 대기(150);
    } catch (e) {
      console.error(`  ✕ ${종목}  ${e.message}`);
      실패 += 1;
    }
  }
  console.log(`\n합계 성공 ${성공}(대주주 있음 ${대주주있음}) · 실패 ${실패} · archive/raw/dubai-dfm-shareholders/`);
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await main();
