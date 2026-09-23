/**
 * taiwan-company-page.mjs — **대만 상장사 한 곳의 지면에 올릴 수를 만든다.** (5번, 2026-09-23)
 *
 * ── 왜 ───────────────────────────────────────────────────────────────
 * 사장님: 「사우디, 상하이 외 할 곳은?」 → 재서 대만을 1순위로 올렸고 「응」을 받았다.
 * TWSE 가 OpenAPI 를 열쇠 없이 열었는데 **항목·회사명이 중국어**다 —
 * 한국 DART 와 똑같은 「언어 장벽형 기회」이고, 우리는 그 일을 두 번 해 봤다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────────────
 * ⛔ **0 으로 채우지 않는다.** 없는 계정은 null 이고 지면은 「—」로 둔다.
 * ⛔ **바닥이 0 이면 나누지 않는다.** Infinity 를 비율이라 적지 않는다.
 * ⛔ **등수를 매기지 않는다.** 「우량」·「상위」를 만들지 않는다.
 * ⛔ **환율을 만들어 곱하지 않는다.** 대만달러는 대만달러로 적는다.
 * ⚠ 이 자료는 **분기 재무제표**다. 한국(연간)·일본(연간)과 기간이 다르다 —
 *   그래서 두 나라 수와 나란히 놓을 때는 그 사실을 지면이 «먼저» 말한다.
 * 🔴 수집기가 천 TWD 를 원으로 이미 고쳐 놓았다. 여기서 또 곱하지 않는다.
 */

/** TWD → 십억 TWD. 못 재면 null */
export function 십억(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Number(n) / 1e9;
}

/** 바닥이 0 이거나 없으면 null — ⛔ Number(null) 이 0 이라 먼저 거른다 */
export function 나눔(위, 아래) {
  if (위 == null || 아래 == null || 위 === '' || 아래 === '') return null;
  const a = Number(위); const b = Number(아래);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

/** 지면에 올릴 한 줄 */
export function 재무줄(행) {
  if (!행) return null;
  const 매출 = 십억(행.revenue_twd);
  const 영업 = 십억(행.operating_profit_twd);
  const 세전 = 십억(행.pretax_profit_twd);
  const 순익 = 십억(행.net_profit_twd);
  const 자산 = 십억(행.assets_twd);
  const 부채 = 십억(행.liabilities_twd);
  const 자본 = 십억(행.equity_twd);
  return {
    year: 행.year ?? null,
    quarter: 행.quarter ?? null,
    revenue: 매출, operating: 영업, pretax: 세전, net: 순익,
    assets: 자산, liabilities: 부채, equity: 자본,
    bps: 행.bps_twd == null ? null : Number(행.bps_twd),
    영업이익률: 나눔(영업, 매출),
    순이익률: 나눔(순익, 매출),
    자기자본비율: 나눔(자본, 자산),
    부채비율: 나눔(부채, 자본),
    ROE: 나눔(순익, 자본),
  };
}

/** 회사 됨됨이 — 재무가 아닌 것. 사람은 «곁들이»라 이름 한 줄만 둔다 */
export function 회사줄(행) {
  if (!행) return null;
  const 것 = {
    shares: 행.shares == null ? null : Number(행.shares),
    paidIn: 십억(행.paid_in_capital_twd),
    website: 행.website || null,
    listedOn: 행.listed_on || null,
    foundedOn: 행.founded_on || null,
  };
  return Object.values(것).some((v) => v != null) ? 것 : null;
}

/**
 * ② 낼 내용이 없으면 지면을 만들지 않는다 (백년지도 노하우).
 * ⛔ 영문 이름이 없으면 안 낸다 — 영문 매체다.
 */
export function 낼만한가(행) {
  if (!행) return false;
  if (!String(행.code ?? '').trim()) return false;
  if (!String(행.name_en ?? '').trim()) return false;
  return 행.revenue_twd != null || 행.assets_twd != null;
}

/**
 * 가운데값. ⛔ 빈 벌이면 null.
 * ⚠ Astro 의 getStaticPaths() 는 «격리되어» 돌아 같은 파일 앞말의 선언을 못 본다 —
 *   그래서 지면에서 쓸 것은 반드시 이 모듈에 둔다(2026-09-23 에 일본 지면이 그것으로 죽었다).
 */
export function 가운데값(수들) {
  const 것 = (수들 ?? []).filter((n) => n != null && Number.isFinite(n)).sort((a, b) => a - b);
  if (!것.length) return null;
  const m = Math.floor(것.length / 2);
  return 것.length % 2 ? 것[m] : (것[m - 1] + 것[m]) / 2;
}

/** 분기 표기 — 「2026 Q2」. 못 쟀으면 null */
export function 분기말(행) {
  if (!행?.year) return null;
  return 행.quarter ? `${행.year} Q${행.quarter}` : String(행.year);
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv?.[1]?.endsWith('taiwan-company-page.mjs') && process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('원을 십억으로', 십억(9375654727000) === 9375.654727);
  본다('⛔ 없으면 null', 십억(null) === null && 십억('x') === null);
  본다('0 은 0 이다', 십억(0) === 0);

  본다('나눈다', Math.abs(나눔(1, 4) - 0.25) < 1e-12);
  본다('🔴 ⛔ 바닥이 0 이면 null', 나눔(1, 0) === null);
  본다('🔴 ⛔ Number(null) 이 0 이라 먼저 거른다', 나눔(null, 2) === null && 나눔(2, null) === null);
  본다('음수도 낸다', 나눔(-1, 2) === -0.5);

  const 행 = {
    code: '2330', name_en: 'TSMC', year: 2026, quarter: '2',
    revenue_twd: 2404483690000, operating_profit_twd: 1425568793000,
    pretax_profit_twd: 1550229773000, net_profit_twd: 1279582227000,
    assets_twd: 9375654727000, liabilities_twd: 2901183746000, equity_twd: 6474470981000,
    bps_twd: 248.05, shares: 25932370067, paid_in_capital_twd: 259323700670,
    website: 'https://www.tsmc.com',
  };
  const 줄 = 재무줄(행);
  본다('재무줄이 선다', Math.abs(줄.revenue - 2404.48369) < 1e-6 && 줄.year === 2026);
  본다('분기를 남긴다', 줄.quarter === '2' && 분기말(행) === '2026 Q2');
  본다('영업이익률을 낸다', Math.abs(줄.영업이익률 - 1425568793 / 2404483690) < 1e-9);
  본다('ROE 를 낸다', Math.abs(줄.ROE - 1279582227 / 6474470981) < 1e-9);
  본다('부채비율을 낸다', Math.abs(줄.부채비율 - 2901183746 / 6474470981) < 1e-9);
  본다('🔴 수집기가 이미 원으로 고쳤다 — 여기서 또 곱하지 않는다', 줄.assets > 9000 && 줄.assets < 10000);
  본다('⛔ 주당순자산은 그대로 둔다', 줄.bps === 248.05);
  본다('⛔ 빈 것에 안 터진다', 재무줄(null) === null);

  const 빈줄 = 재무줄({ code: 'x', year: 2026 });
  본다('⛔ 없는 수는 null 로 남는다', 빈줄.revenue === null && 빈줄.ROE === null);

  const 회 = 회사줄(행);
  본다('회사줄이 선다', 회.shares === 25932370067 && Math.abs(회.paidIn - 259.32370067) < 1e-6);
  본다('⛔ 아무것도 없으면 null', 회사줄({ code: 'x' }) === null);

  본다('낼 만하다', 낼만한가(행) === true);
  본다('🔴 매출도 자산도 없으면 안 낸다', 낼만한가({ code: 'x', name_en: 'X' }) === false);
  본다('🔴 영문 이름이 없으면 안 낸다', 낼만한가({ code: 'x', name_en: '', revenue_twd: 1 }) === false);
  본다('⛔ 빈 것에 안 터진다', 낼만한가(null) === false);

  본다('홀수면 한가운데', 가운데값([3, 1, 2]) === 2);
  본다('짝수면 두 개의 가운데', 가운데값([1, 2, 3, 4]) === 2.5);
  본다('🔴 ⛔ 빈 벌이면 null', 가운데값([]) === null && 가운데값(null) === null);
  본다('⛔ 못 잰 것을 섞지 않는다', 가운데값([1, null, 3]) === 2);

  본다('⛔ 해가 없으면 분기 표기도 없다', 분기말({ quarter: '2' }) === null);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}
