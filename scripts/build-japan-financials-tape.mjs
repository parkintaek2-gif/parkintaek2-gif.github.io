#!/usr/bin/env node
/**
 * build-japan-financials-tape.mjs — 일본 재무제표를 **한 장의 탭**으로 묶는다.
 *
 *   node scripts/build-japan-financials-tape.mjs            재기만 한다
 *   node scripts/build-japan-financials-tape.mjs --적는다
 *   node scripts/build-japan-financials-tape.mjs --자가시험
 *
 * ── 왜 «탭»인가 ───────────────────────────────────────────────────────────
 * 한국은 `src/data/korea-financials-tape.json` 한 장(8,127행)으로 지면·API·스크리너가
 * 전부 돈다. 일본도 **같은 꼴**이어야 한 화면에서 나란히 놓고 견줄 수 있다.
 * ⛔ 나라마다 다른 꼴로 쌓으면 「아시아 마켓츠」라고 말할 수 없다 — 견주지를 못한다.
 *
 * ── 2026-09-21 실측 ──────────────────────────────────────────────────────
 * ```
 * 받은 서류        3,681건 (250 영업일)
 * 고유 종목코드    3,672  ← 상장 3,818사의 96.2%
 * 채움률           순이익 100% · 자산 100% · 자본 100% · 영업이익 98.4% · 매출 91.8%
 * ```
 * ⛔ 매출이 91.8% 인 것은 «은행·보험»이 NetSales 대신 경상수익을 쓰기 때문이다.
 *   빈 것을 0 으로 메꾸지 않는다 — null 로 두고 몇 곳이 비었는지 적는다.
 *
 * 출처 — 금융청 EDINET. 공공데이터 이용규약(PDL1.0), 상업적 이용 가능, 출처 표시.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료방 = path.join(뿌리, 'archive', 'raw', 'japan-edinet-financials');
const 낼곳 = path.join(뿌리, 'src', 'data', 'japan-financials-tape.json');
const 적는다 = process.argv.includes('--적는다');

/** 결산 연도 — period_end 의 앞 네 자리 */
export function 결산해(period_end) {
  const m = /^(\d{4})-/.exec(String(period_end || ''));
  return m ? Number(m[1]) : null;
}

/**
 * 같은 회사가 여러 번 나오면 **가장 최근 결산**을 쓴다.
 * ⚠ 250일치를 받으면 3월 결산 회사가 2025·2026 두 해로 들어온다.
 *   ⛔ 둘 다 남기면 스크리너에서 한 회사가 두 줄이 된다.
 */
export function 최신만(줄들) {
  const 집 = new Map();
  for (const r of 줄들 || []) {
    if (!r?.code) continue;
    const 전 = 집.get(r.code);
    if (!전 || (r.period_end || '') > (전.period_end || '')) 집.set(r.code, r);
  }
  return [...집.values()].sort((a, b) => String(a.code).localeCompare(String(b.code)));
}

/** 한 서류를 탭 한 줄로 */
export function 한줄(d, 명부 = new Map()) {
  if (!d?.sec_code) return null;
  const 딸림 = 명부.get(String(d.sec_code)) || {};
  const 바탕 = d._근거?.net_profit_jpy?.연결개별 || d._근거?.assets_jpy?.연결개별 || null;
  return {
    code: String(d.sec_code),
    edinet_code: d.edinet_code ?? null,
    name: d.name ?? null,
    name_en: 딸림.name_en ?? null,
    market: 딸림.market ?? null,
    sector: 딸림.sector ?? null,
    year: 결산해(d.period_end),
    period_end: d.period_end ?? null,
    basis: 바탕 === '連結' ? 'consolidated' : 바탕 === '個別' ? 'standalone' : null,
    assets_jpy: d.assets_jpy ?? null,
    equity_jpy: d.equity_jpy ?? null,
    revenue_jpy: d.revenue_jpy ?? null,
    operating_profit_jpy: d.operating_profit_jpy ?? null,
    net_profit_jpy: d.net_profit_jpy ?? null,
  };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);

  검('결산 해를 뽑는다', 결산해('2026-06-30') === 2026);
  검('⛔ 없으면 null — 0 으로 메꾸지 않는다', 결산해(null) === null);
  검('엉뚱한 글도 null', 결산해('작년') === null);

  const a = { code: '7203', period_end: '2025-03-31' };
  const b = { code: '7203', period_end: '2026-03-31' };
  검('⭐ 같은 회사면 가장 최근 결산만 남는다', 최신만([a, b]).length === 1);
  검('그때 남는 것이 최신이다', 최신만([a, b])[0].period_end === '2026-03-31');
  검('순서가 거꾸로여도 최신이 남는다', 최신만([b, a])[0].period_end === '2026-03-31');
  검('다른 회사는 둘 다 남는다', 최신만([a, { code: '6758', period_end: '2026-03-31' }]).length === 2);
  검('코드 없는 줄은 버린다', 최신만([{ period_end: '2026-03-31' }]).length === 0);
  검('빈 목록도 견딘다', 최신만([]).length === 0);
  검('코드 차례로 늘어놓는다',
    최신만([{ code: '9999', period_end: '2026-01-01' }, { code: '1111', period_end: '2026-01-01' }])[0].code === '1111');

  const d = {
    sec_code: '4847', edinet_code: 'E05191', name: '会社', period_end: '2026-06-30',
    revenue_jpy: 100, operating_profit_jpy: 20, net_profit_jpy: 10, assets_jpy: 500, equity_jpy: 300,
    _근거: { net_profit_jpy: { 연결개별: '連結' } },
  };
  검('한 줄로 옮긴다', 한줄(d).code === '4847');
  검('連結을 consolidated 로 적는다', 한줄(d).basis === 'consolidated');
  검('個別은 standalone 이다',
    한줄({ ...d, _근거: { net_profit_jpy: { 연결개별: '個別' } } }).basis === 'standalone');
  검('근거가 없으면 basis 도 null', 한줄({ ...d, _근거: {} }).basis === null);
  검('종목코드가 없으면 줄을 안 만든다', 한줄({ name: 'x' }) === null);
  검('⛔ 빈 값을 0 으로 메꾸지 않는다', 한줄({ sec_code: '1', _근거: {} }).revenue_jpy === null);
  검('명부에서 영문명·업종을 이어 붙인다',
    한줄(d, new Map([['4847', { name_en: 'IWI', sector: 'IT' }]])).name_en === 'IWI');
  검('명부에 없어도 줄은 선다', 한줄(d, new Map()).name_en === null);
  검('한국 탭과 칸 이름 꼴이 같다',
    ['code', 'name', 'year', 'assets_jpy', 'equity_jpy', 'revenue_jpy', 'operating_profit_jpy', 'net_profit_jpy']
      .every((k) => k in 한줄(d)));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

if (내가진입점) {
  /* 명부에서 영문명·업종을 가져온다 — 없으면 없는 대로 간다.
     ⚠ 이 명부는 바깥 칸이 «한국어»다(`회사들`) — 영어 이름으로 찾다가 0곳이 붙었다.
       ⛔ 「영문명 0곳」을 「명부에 없다」로 읽지 않는다. 자기 파일의 «실제 칸 이름»을 본다.
     ⚠ 종목코드는 EDINET 쪽이 다섯 자리(끝에 0)라 네 자리로 줄여 맞춘다. */
  const 명부 = new Map();
  try {
    const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src', 'data', 'japan-listed-companies.json'), 'utf8'));
    const 회사들 = j.회사들 ?? j.companies ?? j.rows ?? (Array.isArray(j) ? j : []);
    for (const c of 회사들) {
      const raw = String(c.securitiesCode ?? c.code ?? c.sec_code ?? '');
      const k = raw.length === 5 ? raw.slice(0, 4) : raw;
      if (!k) continue;
      명부.set(k, {
        name_en: c.nameEn || c.name_en || null,
        market: c.market ?? null,
        sector: c.industry || c.sector || c.industryJa || null,
      });
    }
    console.log(`   명부 ${명부.size}곳을 읽었다`);
  } catch (e) { console.log('⚠ 명부를 못 읽었다 — 영문명·업종 없이 간다:', String(e?.message ?? e).slice(0, 60)); }

  const 모 = [];
  for (const d of fs.readdirSync(자료방)) {
    const p = path.join(자료방, d);
    if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) {
      if (!f.endsWith('.json')) continue;
      try { 모.push(JSON.parse(fs.readFileSync(path.join(p, f), 'utf8'))); } catch { /* 넘어간다 */ }
    }
  }
  const 줄들 = 최신만(모.map((d) => 한줄(d, 명부)).filter(Boolean));

  const 셈 = (k) => 줄들.filter((r) => typeof r[k] === 'number').length;
  console.log('■ 일본 재무제표 탭');
  console.log(`   서류 ${모.length}건 → 회사 ${줄들.length}곳 (상장 3,818사의 ${(줄들.length / 3818 * 100).toFixed(1)}%)`);
  for (const k of ['assets_jpy', 'equity_jpy', 'revenue_jpy', 'operating_profit_jpy', 'net_profit_jpy']) {
    console.log(`   ${k.padEnd(22)} ${셈(k)} (${(셈(k) / 줄들.length * 100).toFixed(1)}%)`);
  }
  console.log(`   영문명 붙은 곳 ${줄들.filter((r) => r.name_en).length} · 업종 붙은 곳 ${줄들.filter((r) => r.sector).length}`);
  const 해 = {};
  for (const r of 줄들) if (r.year) 해[r.year] = (해[r.year] || 0) + 1;
  console.log('   결산 해 ' + Object.entries(해).sort().map(([k, v]) => `${k}:${v}`).join(' · '));

  if (!적는다) { console.log('\n⬜ 재기만 했다. 적으려면 --적는다'); process.exit(0); }
  fs.writeFileSync(낼곳, JSON.stringify({
    _meta: {
      출처: '금융청 EDINET (유가증권보고서)',
      이용허락범위: 'PDL1.0 — 상업적 이용 가능, 출처 표시',
      지은때: new Date().toLocaleString('ko-KR'),
      단위: '엔(JPY)',
      메모: '같은 회사는 가장 최근 결산 한 줄만 둔다. 빈 칸은 null 이고 0 으로 메꾸지 않았다.',
    },
    rows: 줄들,
  }, null, 1), 'utf8');
  console.log(`\n✅ 적었다 — src/data/japan-financials-tape.json (${(fs.statSync(낼곳).size / 1024 / 1024).toFixed(1)}MB)`);
}
