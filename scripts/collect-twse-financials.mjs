#!/usr/bin/env node
/**
 * collect-twse-financials.mjs — **대만 상장사 재무제표를 받는다.** (5번, 2026-09-23)
 *
 * ── 왜 대만인가 ──────────────────────────────────────────────────────
 * 사장님: 「사우디, 상하이 외 할 곳은?」 → 재서 답했고 「응」을 받았다.
 * 대만이 1순위인 까닭 셋 —
 *   ① TWSE 가 OpenAPI 를 열쇠 없이 전면 개방했는데 **항목·회사명이 중국어**다.
 *     한국 DART 와 똑같은 「언어 장벽형 기회」이고, 우리는 그 일을 두 번 해 봤다
 *   ② 시장이 크다. 영문 수요가 큰데 전 종목 영문 파일은 얇다
 *   ③ 한계비용이 하루다 — 회사 지면·주소·업종 틀을 그대로 쓴다
 *
 * ── ⛔ 라이선스가 정한 것 (docs/대만-데이터-출처-라이선스.md) ──────────
 * ✅ openapi.twse.com.tw 만 부른다 — TWSE 가 「歡迎各位介接使用」로 연 API 다
 * ⛔ www.twse.com.tw 지면을 긁지 않는다 — 使用條款이 자동화 수집을 «그 사이트에» 금지한다
 * 🔴 출처표시가 «의무»다(OGDL 三(二)) — 빠뜨리면 허락 자체가 없던 것이 된다
 * ⛔ 원자료를 왜곡하지 않는다(不得任意增刪). 비율 계산은 파생물이라 허락된 개작이다
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────
 * ⛔ 0 으로 채우지 않는다. 없는 계정은 null 이다
 * ⛔ 「대부분 받았다」로 적지 않는다 — «붙은 수 / 전체 수»를 적는다
 * ⛔ 업종 코드를 영문으로 «짐작해» 옮기지 않는다. 사전에 없으면 null 이다
 * ⚠ 손익·대차가 업종 갈래로 나뉘어 있다(일반·금융지주·증권선물·보험·이업종).
 *   다섯을 다 받아야 전량이 된다 — 하나만 받고 「다 받았다」고 하지 않는다
 *
 * 쓰는 법
 *   node scripts/collect-twse-financials.mjs --재본다      한 갈래만 불러 본다(안 적는다)
 *   node scripts/collect-twse-financials.mjs --적는다      전량을 받아 적는다
 *   node scripts/collect-twse-financials.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(fileURLToPath(import.meta.url), '..', '..');
export const 밑 = 'https://openapi.twse.com.tw/v1';

/** 손익·대차가 업종으로 갈려 있다. 다섯을 다 받아야 전량이다 */
export const 손익길 = [
  ['일반', '/opendata/t187ap06_L_ci'],
  ['금융지주', '/opendata/t187ap06_L_fh'],
  ['증권선물', '/opendata/t187ap06_L_bd'],
  ['보험', '/opendata/t187ap06_L_ins'],
  ['이업종', '/opendata/t187ap06_L_mim'],
];
export const 대차길 = [
  ['일반', '/opendata/t187ap07_L_ci'],
  ['금융지주', '/opendata/t187ap07_L_fh'],
  ['증권선물', '/opendata/t187ap07_L_bd'],
  ['보험', '/opendata/t187ap07_L_ins'],
  ['이업종', '/opendata/t187ap07_L_mim'],
];
export const 기본길 = '/opendata/t187ap03_L';

/** 숫자로 바꾼다. ⛔ 빈 칸·「-」를 0 으로 읽지 않는다 */
export function 수읽기(v) {
  if (v == null) return null;
  const s = String(v).replace(/[,\s]/g, '');
  if (!s || s === '-' || s === '－' || s === 'N/A') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * 민국 연호를 서기로. 「1150922」 = 민국 115년 9월 22일 = 2026-09-22.
 * ⛔ 앞 세 자리를 그냥 연도로 읽으면 115년이 된다 — 1911 을 더해야 한다.
 */
export function 민국날짜(s) {
  const t = String(s ?? '').trim();
  const m = t.match(/^(\d{3})(\d{2})(\d{2})$/);
  if (!m) return null;
  const 해 = Number(m[1]) + 1911;
  const 달 = Number(m[2]); const 날 = Number(m[3]);
  if (달 < 1 || 달 > 12 || 날 < 1 || 날 > 31) return null;
  return `${해}-${String(달).padStart(2, '0')}-${String(날).padStart(2, '0')}`;
}

/** 민국 연도만 — 「115」 → 2026 */
export function 민국해(v) {
  const n = Number(String(v ?? '').trim());
  if (!Number.isFinite(n) || n < 1 || n > 999) return null;
  return n + 1911;
}

/**
 * 🔴 **재무제표는 «천 TWD» 다. 기본정보는 «원» 이다.** 같은 API 안에서 단위가 다르다.
 *
 * 명세에는 단위가 한 줄도 안 적혀 있다. 그래서 **같은 출처 안의 두 값을 맞대어** 정했다 —
 * 기본정보의 實收資本額(원)과 대차대조표의 股本(같은 자본금)을 396곳에서 나눠 보니
 * **388곳이 정확히 1000.00** 이었다. 나머지 8곳은 그 사이 증자·감자가 있던 곳이다.
 * ⛔ 이것을 확인하지 않고 그대로 냈으면 대만 회사의 모든 수가 **1000배 작게** 나갔다.
 *   TSMC 총자산이 9.4조가 아니라 94억으로 보였을 것이다.
 *
 * ⇒ 여기서 **1000을 곱해 TWD 로 통일한다.** 한국(KRW)·일본(JPY) 테이프와 같은 꼴이 된다.
 * ⚠ 이것은 라이선스가 막는 「任意增刪」(원자료 왜곡)이 아니다 — 단위를 밝혀 적은 환산이고,
 *   OGDL 二(一)이 명시로 허락한 「改作」이다. 근거와 배수는 _meta 에 남긴다.
 */
export const 천배 = 1000;
const 천원을원으로 = (v) => (v == null ? null : v * 천배);

/** 손익 한 줄 → 우리 칸. 값은 «원(TWD)» 으로 통일해 담는다 */
export function 손익줄(r) {
  if (!r || !r.公司代號) return null;
  return {
    code: String(r.公司代號).trim(),
    name: String(r.公司名稱 ?? '').trim(),
    year: 민국해(r.年度),
    quarter: String(r.季別 ?? '').trim() || null,
    revenue_twd: 천원을원으로(수읽기(r.營業收入)),
    operating_profit_twd: 천원을원으로(수읽기(r['營業利益（損失）'])),
    pretax_profit_twd: 천원을원으로(수읽기(r['稅前淨利（淨損）'])),
    net_profit_twd: 천원을원으로(수읽기(r['本期淨利（淨損）'])),
  };
}

/**
 * 대차 한 줄 → 우리 칸. 값은 «원(TWD)» 으로 통일해 담는다.
 * ⚠ 每股參考淨值(주당 순자산)만은 «원» 그대로다 — 한 주에 몇 원인지를 적는 칸이라
 *   천 단위로 적을 까닭이 없다. 실제로 TSMC 가 150 원대로 나온다. 여기에 1000을 곱하면
 *   주당 순자산이 15만 원이 되어 주가보다 커진다. **칸마다 단위를 따로 본다.**
 */
export function 대차줄(r) {
  if (!r || !r.公司代號) return null;
  return {
    code: String(r.公司代號).trim(),
    year: 민국해(r.年度),
    quarter: String(r.季別 ?? '').trim() || null,
    assets_twd: 천원을원으로(수읽기(r.資產總計)),
    liabilities_twd: 천원을원으로(수읽기(r.負債總計)),
    equity_twd: 천원을원으로(수읽기(r.權益總計)),
    capital_stock_twd: 천원을원으로(수읽기(r.股本)),
    bps_twd: 수읽기(r.每股參考淨值),   /* ⛔ 이 칸은 곱하지 않는다 */
  };
}

/** 회사 기본정보 한 줄 → 우리 칸. ⛔ 영문 이름이 없으면 null — 지어내지 않는다 */
export function 기본줄(r) {
  if (!r || !r.公司代號) return null;
  const 영문 = String(r.英文簡稱 ?? '').trim();
  return {
    code: String(r.公司代號).trim(),
    name: String(r.公司名稱 ?? '').trim(),
    name_en: 영문 || null,
    industry_code: String(r.產業別 ?? '').trim() || null,
    listed_on: 민국날짜(r.上市日期),
    founded_on: 민국날짜(r.成立日期),
    paid_in_capital_twd: 수읽기(r.實收資本額),
    shares: 수읽기(r.已發行普通股數或TDR原股發行股數),
    chairman: String(r.董事長 ?? '').trim() || null,
    website: String(r.網址 ?? '').trim() || null,
  };
}

/** 종목코드로 묶어 한 줄로 만든다 */
export function 합치기(기본들, 손익들, 대차들) {
  const 표 = new Map();
  for (const b of (기본들 ?? [])) { if (b?.code) 표.set(b.code, { ...b }); }
  for (const i of (손익들 ?? [])) {
    if (!i?.code) continue;
    const 것 = 표.get(i.code) ?? { code: i.code, name: i.name, name_en: null };
    표.set(i.code, { ...것, ...i, name: 것.name || i.name });
  }
  for (const b of (대차들 ?? [])) {
    if (!b?.code) continue;
    const 것 = 표.get(b.code);
    if (!것) { 표.set(b.code, { ...b }); continue; }
    표.set(b.code, { ...것, ...b, year: 것.year ?? b.year, quarter: 것.quarter ?? b.quarter });
  }
  return [...표.values()].sort((a, b) => String(a.code).localeCompare(String(b.code)));
}

async function 받기(길) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 30000);
  try {
    const r = await fetch(밑 + 길, {
      signal: ac.signal,
      headers: { 'user-agent': 'SeoulMarkets/1.0 (data journalism; contact seoulmarkets.com)' },
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j) ? j : null;
  } catch { clearTimeout(t); return null; }
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('쉼표를 뗀다', 수읽기('1,234,567') === 1234567);
  본다('음수도 읽는다', 수읽기('-1,234') === -1234);
  본다('🔴 ⛔ 빈 칸은 null — 0 으로 안 읽는다', 수읽기('') === null && 수읽기(null) === null);
  본다('⛔ 「-」도 null', 수읽기('-') === null && 수읽기('－') === null);
  본다('0 은 0 이다', 수읽기('0') === 0);

  본다('🔴 민국 연호를 서기로 — 1150922 = 2026-09-22', 민국날짜('1150922') === '2026-09-22');
  본다('민국 39년도 읽는다', 민국날짜('0391229') === '1950-12-29');
  본다('⛔ 꼴이 틀리면 null', 민국날짜('2026-09-22') === null && 민국날짜('') === null);
  본다('⛔ 없는 달은 null', 민국날짜('1151322') === null);
  본다('민국 해만도 읽는다', 민국해('115') === 2026 && 민국해(114) === 2025);
  본다('⛔ 빈 해는 null', 민국해('') === null && 민국해(null) === null);

  const 손 = 손익줄({ 公司代號: '1101', 公司名稱: '臺灣水泥股份有限公司', 年度: '115', 季別: '2',
    營業收入: '123,456', '營業利益（損失）': '-1,000', '本期淨利（淨損）': '2,000', '稅前淨利（淨損）': '' });
  본다('🔴 손익은 천 TWD 라 1000을 곱해 원으로 담는다', 손.revenue_twd === 123456000);
  본다('해·분기를 읽는다', 손.year === 2026 && 손.quarter === '2');
  본다('적자도 곱해서 음수로', 손.operating_profit_twd === -1000000);
  본다('🔴 ⛔ 빈 칸은 null 로 남는다 — 0 에 1000을 곱하지 않는다', 손.pretax_profit_twd === null);
  본다('⛔ 코드가 없으면 null', 손익줄({ 公司名稱: 'x' }) === null && 손익줄(null) === null);

  const 대 = 대차줄({ 公司代號: '1101', 年度: '115', 資產總計: '9,000', 權益總計: '4,000',
    負債總計: '5,000', 股本: '77,231,817', 每股參考淨值: '152.34' });
  본다('🔴 대차도 천 TWD 라 곱한다', 대.assets_twd === 9000000 && 대.equity_twd === 4000000);
  본다('자본금도 곱한다 — 기본정보의 實收資本額과 같은 값이 된다', 대.capital_stock_twd === 77231817000);
  본다('🔴 ⛔ 주당 순자산은 «곱하지 않는다» — 한 주에 몇 원인지를 적는 칸이다',
    대.bps_twd === 152.34);

  const 기 = 기본줄({ 公司代號: '1101', 公司名稱: '臺灣水泥股份有限公司', 英文簡稱: 'TCC',
    產業別: '01', 上市日期: '0510209', 實收資本額: '77231817420' });
  본다('기본을 읽는다', 기.name_en === 'TCC' && 기.industry_code === '01');
  본다('상장일을 서기로', 기.listed_on === '1962-02-09');
  본다('🔴 ⛔ 영문 이름이 없으면 null — 지어내지 않는다',
    기본줄({ 公司代號: 'x', 英文簡稱: '  ' }).name_en === null);

  const 합 = 합치기([기], [손], [대]);
  본다('셋을 한 줄로 묶는다', 합.length === 1 && 합[0].name_en === 'TCC'
    && 합[0].revenue_twd === 123456000 && 합[0].assets_twd === 9000000);
  본다('⛔ 빈 것에 안 터진다', 합치기(null, null, null).length === 0);
  본다('기본이 없어도 재무만으로 줄이 선다', 합치기([], [손], []).length === 1);
  본다('차례가 종목코드순이다', (() => {
    const x = 합치기([{ code: '2330' }, { code: '1101' }], [], []);
    return x[0].code === '1101';
  })());

  본다('🔴 손익 갈래가 다섯이다 — 하나만 받고 다 받았다고 하지 않는다', 손익길.length === 5);
  본다('🔴 대차 갈래도 다섯이다', 대차길.length === 5);
  본다('⛔ openapi 만 부른다 — www 를 긁지 않는다',
    밑.startsWith('https://openapi.twse.com.tw') && !/\/\/www\./.test(밑));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 받는다 ────────────────────────────────────────── */
{
  const 적나 = process.argv.includes('--적는다');
  const 재보나 = process.argv.includes('--재본다');
  if (!적나 && !재보나) {
    console.log('⛔ --재본다 나 --적는다 를 붙인다.');
    process.exit(1);
  }

  console.log('■ 대만 TWSE OpenAPI — 상장사 재무제표');
  console.log('  ⛔ www.twse.com.tw 를 긁지 않는다. openapi 만 부른다 (使用條款)');

  if (재보나) {
    const 한갈래 = await 받기(손익길[0][1]);
    console.log(`\n■ 재보기 — ${손익길[0][0]} 손익 ${한갈래 ? `${한갈래.length}행 받았다` : '🔴 못 받았다'}`);
    if (한갈래?.length) {
      const 줄 = 손익줄(한갈래[0]);
      console.log(`   맨 앞: ${줄.code} ${줄.name} · ${줄.year}년 ${줄.quarter}분기 · 매출 ${줄.revenue_twd}`);
    }
    console.log('   ⇒ --적는다 를 붙이면 전량을 받는다.');
    process.exit(한갈래 ? 0 : 1);
  }

  const 기본원 = await 받기(기본길);
  if (!기본원) { console.log('🔴 회사 기본정보를 못 받았다 — 여기서 멈춘다'); process.exit(1); }
  console.log(`\n■ 회사 기본정보 ${기본원.length}곳`);

  const 손익원 = []; const 대차원 = [];
  for (const [이름, 길] of 손익길) {
    const j = await 받기(길);
    console.log(`  손익 ${이름.padEnd(6)} ${j ? String(j.length).padStart(5) + '행' : '🔴 못 받았다'}`);
    if (j) 손익원.push(...j);
  }
  for (const [이름, 길] of 대차길) {
    const j = await 받기(길);
    console.log(`  대차 ${이름.padEnd(6)} ${j ? String(j.length).padStart(5) + '행' : '🔴 못 받았다'}`);
    if (j) 대차원.push(...j);
  }

  const 줄들 = 합치기(
    기본원.map(기본줄).filter(Boolean),
    손익원.map(손익줄).filter(Boolean),
    대차원.map(대차줄).filter(Boolean),
  );

  /* ⛔ 「대부분 받았다」로 적지 않는다 — 붙은 수 / 전체 수 */
  const 매출있음 = 줄들.filter((r) => r.revenue_twd != null).length;
  const 자산있음 = 줄들.filter((r) => r.assets_twd != null).length;
  const 영문있음 = 줄들.filter((r) => r.name_en).length;
  console.log(`\n■ 합쳐서 ${줄들.length}곳`);
  console.log(`   매출이 붙은 곳 ${매출있음}/${줄들.length} · 자산 ${자산있음}/${줄들.length} · 영문 이름 ${영문있음}/${줄들.length}`);

  const 오늘 = new Date().toLocaleDateString('sv-SE');
  const 원본방 = path.join(뿌리, 'archive', 'raw', 'twse-financials');
  fs.mkdirSync(원본방, { recursive: true });
  fs.writeFileSync(path.join(원본방, `twse-${오늘.replace(/-/g, '')}.json`),
    JSON.stringify({ 기본: 기본원, 손익: 손익원, 대차: 대차원 }), 'utf8');

  const 테이프 = {
    _meta: {
      출처: '臺灣證券交易所 (TWSE) OpenAPI',
      이용허락범위: '政府資料開放授權條款 第1版 (OGDL-Taiwan 1.0) — 상업적 이용 가능, 출처표시 의무',
      라이선스주소: 'https://data.gov.tw/license',
      지은때: new Date().toLocaleString('ko-KR'),
      단위: '신대만달러(TWD) — 원 단위',
      단위주석: '🔴 원자료의 손익·대차는 «천 TWD» 다(명세에 단위 표기가 없어 검산으로 정했다). '
        + '기본정보의 實收資本額(원)과 대차대조표의 股本(같은 자본금)을 396곳에서 나눠 보니 '
        + '388곳이 정확히 1000.00 이었다. 그래서 손익·대차에 1000을 곱해 원 단위로 통일했다. '
        + '⛔ 每股參考淨值(주당 순자산)는 원래 원 단위라 곱하지 않았다.',
      메모: '회사마다 가장 최근 분기 한 줄. 빈 칸은 null 이고 0 으로 메꾸지 않았다. '
        + '손익·대차는 업종 갈래 다섯(일반·금융지주·증권선물·보험·이업종)을 모두 받아 합쳤다.',
    },
    rows: 줄들,
  };
  const 테이프길 = path.join(뿌리, 'src', 'data', 'taiwan-financials-tape.json');
  fs.writeFileSync(테이프길, JSON.stringify(테이프), 'utf8');
  console.log(`📁 적었다 — ${path.relative(뿌리, 테이프길)}`);
  console.log(`📁 원본 — archive/raw/twse-financials/twse-${오늘.replace(/-/g, '')}.json`);
}
