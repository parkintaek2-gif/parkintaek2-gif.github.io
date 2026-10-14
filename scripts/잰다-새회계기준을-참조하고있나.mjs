#!/usr/bin/env node
/**
 * 잰다-새회계기준을-참조하고있나.mjs
 *   — **K-IFRS 제1118호(2027 시행)를 우리가 참조하고 있나.**
 *
 * ── 🔴🔴 사장님 지시 (2026-10-14) ──────────────────────────────────────
 * 「**에스마켓츠에서 꼭 참조하도록**」 + 중앙일보 2026-10-14 기사
 *   「영업익 계산 바꾼 새 회계기준…27조 흑자가 661억 적자로」
 *
 * [왜 이것이 우리 일인가]
 *   SeoulMarkets 는 한국 기업 재무를 영문으로 판다. **영업이익의 정의 자체가 바뀐다.**
 *   · 지분법손익이 영업이익에서 빠져 투자손익으로 간다
 *   · 외화환산손익·환차손익이 영업외에서 **영업이익으로 들어온다**
 *   · 소급 적용이라 **과거 재무제표도 재작성**된다
 *
 * [2026-10-14 에 재어 본 것]
 *   영업이익이 실제로 찍히는 페이지   2,530장
 *   K-IFRS 1118 을 언급하는 곳        0곳
 *   ⇒ 우리가 파는 수치는 전부 «옛 기준»인데 어디에도 그렇게 적혀 있지 않다.
 *
 * ⛔ 2027년이 되면 기업이 발표하는 수치와 우리 수치가 어긋난다. 그때
 *   **우리가 틀린 것처럼 보인다.** 미리 밝혀 두는 것이 「나침반을 준다」다.
 *
 * ⚠ 이 자는 「밝혔나」만 본다. 「새 기준으로 계산했나」는 다른 물음이고,
 *   그것은 아직 **할 수 없다** — 우리 재무 자료에 지분법손익·외화손익 칸이 없다.
 *
 * 쓰는 법
 *   node scripts/잰다-새회계기준을-참조하고있나.mjs --자가시험
 *   node scripts/잰다-새회계기준을-참조하고있나.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/** 시행일 — 2027-01-01 이후 개시 회계연도 (조기적용 허용) */
export const 시행연도 = 2027;

/**
 * 영업이익을 내는 상품 페이지 — ⛔ 여기 빠지면 그 페이지는 아무도 안 본다.
 *
 * ⚠ [2026-10-14] 처음에 `screener` 를 넣었다가 뺐다. 거짓 빨강이었다 —
 *   그 페이지의 `operatingSystem: 'Any'` 는 **JSON-LD 의 소프트웨어 속성**이지
 *   영업이익이 아니다. 「operating」 이라는 글자만 보고 센 것이다.
 *   ⭐ 낱말이 같다고 같은 것이 아니다. 아래 «영업이익쓰나()» 로 실제로 센다.
 */
export const 영업이익페이지 = [
  'financials', 'valuation', 'largest-companies',
  'company-credit', 'kospi-weights',
];

/** 그 글이 «진짜» 영업이익을 쓰나 — ⛔ operatingSystem 같은 남의 낱말에 안 걸린다 */
export function 영업이익쓰나(글) {
  const s = String(글 ?? '');
  if (!s) return false;
  return /operating[_ ]?(profit|income)|영업이익/i.test(s);
}

/** 새 기준을 가리키는 말 — 어느 하나라도 있으면 「밝혔다」로 본다 */
export const 기준말 = ['K-IFRS 1118', 'K-IFRS 제1118', 'IFRS 18', 'IFRS18', '1118호'];

/** 그 글이 새 기준을 밝히고 있나 */
export function 밝혔나(글) {
  const s = String(글 ?? '');
  if (!s) return false;
  return 기준말.some((w) => s.includes(w));
}

/**
 * 우리 재무 자료로 «새 기준 영업이익»을 계산할 수 있나.
 * ⛔ 지분법손익과 외화손익이 둘 다 있어야 한다. 하나만 있으면 못 한다.
 */
export function 새기준계산가능한가(칸들) {
  const 것 = Array.isArray(칸들) ? 칸들.map(String) : [];
  const 지분법 = 것.some((k) => /equity_method|지분법/i.test(k));
  const 외화 = 것.some((k) => /fx_|foreign_exchange|외화|환차/i.test(k));
  return { 가능: 지분법 && 외화, 지분법, 외화 };
}

/** 판정. ⛔ 「못 쟀다」를 「밝혔다」로도 「안 밝혔다」로도 적지 않는다 */
export function 판정({ 센것, 밝힌것, 계산가능 }) {
  if (!센것) return { 빛: '⬜', 말: '못 쟀다 — 셀 페이지가 없다' };
  if (밝힌것 === 0) {
    return {
      빛: '🔴',
      말: `영업이익을 내는 ${센것}곳 가운데 **한 곳도** 새 기준(K-IFRS 1118, ${시행연도} 시행)을`
        + ' 밝히지 않았다 — 2027년에 수치가 어긋나면 «우리»가 틀린 것처럼 보인다',
    };
  }
  if (밝힌것 < 센것) {
    return { 빛: '⚠', 말: `${센것}곳 중 ${밝힌것}곳만 밝혔다 — 나머지 ${센것 - 밝힌것}곳이 남았다` };
  }
  return {
    빛: '✅',
    말: `영업이익을 내는 ${센것}곳이 다 밝히고 있다`
      + (계산가능 ? '' : ' (다만 새 기준으로 «계산»하지는 못한다 — 자료에 칸이 없다)'),
  };
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  본다('🔴 시행연도는 2027 이다 — 조기적용은 허용된다', 시행연도 === 2027);
  본다('✅ 「K-IFRS 1118」을 밝힘으로 본다', 밝혔나('under K-IFRS 1118') === true);
  본다('✅ 「IFRS 18」도 같은 기준이다', 밝혔나('IFRS 18 takes effect') === true);
  본다('✅ 한국어 「제1118호」도 받는다', 밝혔나('K-IFRS 제1118호') === true);
  본다('⛔ 아무 말 없으면 안 밝힌 것이다', 밝혔나('operating profit 1,234') === false);
  본다('⛔ 빈 값에도 안 터진다', 밝혔나(null) === false && 밝혔나('') === false);

  /* 🔴 [2026-10-14] 거짓 빨강을 하나 냈다 — screener 의 `operatingSystem: 'Any'` 를
     영업이익으로 세었다. 낱말이 같다고 같은 것이 아니다. */
  본다('🔴🔴 operatingSystem 을 영업이익으로 세지 않는다 — 오늘 낸 거짓 빨강',
    영업이익쓰나("operatingSystem: 'Any'") === false);
  본다('✅ operating profit 은 센다', 영업이익쓰나('Operating profit') === true);
  본다('✅ operating income 도 센다', 영업이익쓰나('operating_income_krw') === true);
  본다('✅ 한국어 「영업이익」도 센다', 영업이익쓰나('영업이익률') === true);
  본다('⛔ 빈 값에도 안 터진다', 영업이익쓰나(null) === false);

  본다('🔴🔴 지분법·외화가 둘 다 있어야 새 기준을 계산한다',
    새기준계산가능한가(['equity_method_krw', 'fx_gain_krw']).가능 === true);
  본다('⛔ 하나만 있으면 못 한다 — 반쪽으로 계산하면 틀린 수가 나간다',
    새기준계산가능한가(['equity_method_krw']).가능 === false
    && 새기준계산가능한가(['fx_gain_krw']).가능 === false);
  본다('🔴 지금 우리 자료로는 못 한다 — 2026-10-14 실측',
    새기준계산가능한가(['assets_krw', 'equity_krw', 'revenue_krw',
      'operating_profit_krw', 'net_profit_krw']).가능 === false);
  본다('   그때 무엇이 없는지 갈라 말한다 — 「못 한다」만으로는 고칠 수가 없다',
    새기준계산가능한가(['operating_profit_krw']).지분법 === false);
  본다('⛔ 빈 값에도 안 터진다', 새기준계산가능한가(null).가능 === false);

  본다('🔴 한 곳도 안 밝혔으면 빨강', 판정({ 센것: 6, 밝힌것: 0 }).빛 === '🔴');
  본다('   그 말에 «우리가 틀린 것처럼 보인다»가 든다',
    /우리.*틀린 것처럼 보인다/.test(판정({ 센것: 6, 밝힌것: 0 }).말));
  본다('⚠ 일부만 밝혔으면 ⚠ — 몇 곳이 남았는지 적는다',
    /나머지 4곳/.test(판정({ 센것: 6, 밝힌것: 2 }).말));
  본다('✅ 다 밝혔으면 초록', 판정({ 센것: 6, 밝힌것: 6, 계산가능: true }).빛 === '✅');
  본다('⚠ 다 밝혔어도 «계산은 못 한다»면 그 사실을 함께 적는다',
    /계산».*하지는 못한다/.test(판정({ 센것: 6, 밝힌것: 6, 계산가능: false }).말));
  본다('⬜ 셀 것이 없으면 ⬜ — ⛔ 「밝혔다」가 아니다', 판정({ 센것: 0 }).빛 === '⬜');

  console.log(String.fromCharCode(10) + '자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
function 잰다() {
  console.log('■ K-IFRS 제1118호(2027 시행)를 우리가 참조하고 있나 — 사장님 2026-10-14');
  console.log('');

  let 센것 = 0; let 밝힌것 = 0;
  for (const 이름 of 영업이익페이지) {
    const 길 = path.join(뿌리, 'src', 'pages', 'data', 이름 + '.astro');
    if (!fs.existsSync(길)) continue;
    센것 += 1;
    const 밝 = 밝혔나(fs.readFileSync(길, 'utf8'));
    if (밝) 밝힌것 += 1;
    console.log('   ' + (밝 ? '✅' : '🔴') + ' /data/' + 이름 + (밝 ? '' : '  — 안 밝혔다'));
  }

  /* 새 기준으로 «계산»할 수 있나 */
  let 계산 = { 가능: false, 지분법: false, 외화: false };
  try {
    const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/korea-financials-tape.json'), 'utf8'));
    const 줄 = Array.isArray(j) ? j[0] : (j.rows && j.rows[0]) || (j.data && j.data[0]);
    계산 = 새기준계산가능한가(Object.keys(줄 || {}));
  } catch { /* 못 읽으면 못 읽은 대로 둔다 */ }

  const r = 판정({ 센것, 밝힌것, 계산가능: 계산.가능 });
  console.log('');
  console.log('   ' + r.빛 + ' ' + r.말);
  console.log('');
  console.log('   ── 새 기준으로 «계산»할 수 있나 ' + '─'.repeat(24));
  console.log('      지분법손익 칸  ' + (계산.지분법 ? '✅ 있다' : '🔴 없다'));
  console.log('      외화손익 칸    ' + (계산.외화 ? '✅ 있다' : '🔴 없다'));
  console.log('      ⇒ ' + (계산.가능
    ? '새 기준 영업이익을 우리가 계산할 수 있다'
    : '**계산할 수 없다** — 수집기에 그 두 계정을 더해야 한다'));
  console.log('');
  console.log('   ⛔ 이 자는 「밝혔나」만 본다. 「계산했나」는 다른 물음이다.');
  console.log('   ⚠ 자세한 것 — docs/K-IFRS-1118-영업이익-정의변경.md');
  return r.빛 === '🔴' ? 1 : 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(잰다());
}
