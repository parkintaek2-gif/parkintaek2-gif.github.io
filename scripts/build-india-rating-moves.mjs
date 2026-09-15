#!/usr/bin/env node
/**
 * build-india-rating-moves.mjs — 쌓아 둔 등급 «사건»에서 **기사거리**를 뽑는다.
 *
 * 사장님(2026-09-15): 「지금 데이터 모아 나중에 신용등급이 바뀐 기업이 어디인 지
 *                      알려주는 서비스가 목적」 · **「바뀌는 기업에 대해 기사로도 콘텐트 생산+유통」**
 *
 * ── ⛔ 남의 표를 옮기지 않는다. «우리가 센 것»을 낸다 ──────────────────────
 * NSE 약관이 지면의 정보를 다른 곳에 옮겨 담는 것을 막는다(2026-09-15 읽음).
 * 그래서 이 자는 표를 만들지 않는다. **세어서 만든 수**와 **이름 몇 개**만 낸다 —
 * 그것은 우리가 만든 것이고, 사실이며, 출처를 밝히고 쓰는 일이다.
 * 🔴 그래도 내는 것은 사장님 판단을 받은 뒤다. 이 자는 «재고» 파일로 적을 뿐이다.
 *
 * ── 🔴 세면서 조심할 것 — 「Other」가 3/4 다 ────────────────────────────
 * 실측(2026-09-15) — 평가사가 스스로 붙인 말이 이렇게 갈린다.
 *
 *     other 17,056 · upgrade 2,579 · new 1,597 · downgrade 722 · unknown 2
 *
 * 「Other」는 **일곱 평가사가 다 쓴다**(CRISIL 13,459 · ICRA 1,820 · CARE 834 …).
 * 등급을 올린 것도 내린 것도 아닌 그 밖의 처리다. 안을 모르므로 **뜻을 지어내지 않는다.**
 * ⛔ 그래서 「인도에서 등급이 722번 내려갔다」로 쓰지 않는다 — 분모가 그게 아니다.
 * ✅ 「스스로 올림·내림이라고 적은 것 3,301건 가운데 내림이 722건(22%)」으로 쓴다.
 *   분모를 먼저 적고 그다음에 수를 적는다(강령 3).
 *
 *   node scripts/build-india-rating-moves.mjs            가장 최근 것으로 센다
 *   node scripts/build-india-rating-moves.mjs --적는다    src/data 에 재고로 적는다
 *   node scripts/build-india-rating-moves.mjs --자가시험
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 쌓은곳 = path.join(뿌리, 'archive/raw/india-nse-credit-rating');
const 나가는곳 = path.join(뿌리, 'src/data/india-rating-moves.json');

/** 평가사 이름을 짧게 — 기사에 쓰는 이름이다. ⛔ 모르는 곳은 «그대로» 둔다 */
export function 짧은이름(글) {
  const s = String(글 || '').trim();
  if (!s) return null;
  return s
    .replace(/\s+India\s+Private\s+Limited$/i, '')
    .replace(/\s+Private\s+Limited$/i, '')
    .replace(/\s+Limited$/i, '')
    .replace(/\s+Ratings?\s*&\s*Research$/i, '')
    .replace(/\s+Valuation\s+and\s+Ratings?$/i, '')
    .replace(/\s+and\s+Research$/i, '')
    .replace(/\s+Ratings?$/i, '')
    .trim() || s;
}

/** 'YYYY-MM-DD' → 'YYYY-MM'. ⛔ 못 믿는 날짜는 달로 묶지 않는다 */
export function 달(줄) {
  if (!줄 || !줄.ratingDateTrusted || !줄.ratingDate) return null;
  return String(줄.ratingDate).slice(0, 7);
}

/**
 * 「움직임」만 센다 — 올림과 내림.
 * 🔴 분모는 «전체»가 아니라 «올림 + 내림»이다. other 는 무엇인지 모르므로 안 넣는다.
 */
export function 움직임만(줄들) {
  return (줄들 || []).filter((x) => x.action === 'upgrade' || x.action === 'downgrade');
}

/** 평가사마다 — 움직인 것 중 내린 것이 몇 할인가. ⭐ 남들이 안 세는 축이다 */
export function 평가사별내림몫(줄들) {
  const 통 = {};
  for (const x of 움직임만(줄들)) {
    const a = 짧은이름(x.agency) || '(unnamed)';
    통[a] = 통[a] || { agency: a, upgrades: 0, downgrades: 0 };
    if (x.action === 'downgrade') 통[a].downgrades += 1; else 통[a].upgrades += 1;
  }
  return Object.values(통)
    .map((x) => {
      const 합 = x.upgrades + x.downgrades;
      return { ...x, moves: 합, downgradeShare: 합 ? Math.round((x.downgrades / 합) * 1000) / 10 : null };
    })
    .sort((a, b) => b.moves - a.moves);
}

/** 달마다 올림·내림. 기사의 「흐름」 자리다 */
export function 달별움직임(줄들) {
  const 통 = {};
  for (const x of 움직임만(줄들)) {
    const m = 달(x);
    if (!m) continue;                       /* ⛔ 못 믿는 날짜는 흐름에 안 넣는다 */
    통[m] = 통[m] || { month: m, upgrades: 0, downgrades: 0 };
    if (x.action === 'downgrade') 통[m].downgrades += 1; else 통[m].upgrades += 1;
  }
  return Object.values(통)
    .map((x) => ({ ...x, ratio: x.downgrades ? Math.round((x.upgrades / x.downgrades) * 10) / 10 : null }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 한 회사가 «여러 번» 내려간 곳 — 기사의 이름이 나오는 자리.
 * ⭐ 한 번 내려간 곳은 뉴스가 아니다. **거듭 내려간 곳**이 뉴스다.
 *
 * 🔴 [2026-09-15] 여기서 «세는 단위»를 틀리면 기사가 거짓이 된다.
 *   한 회사가 은행대출·회사채·기업어음을 따로 등급받으므로, 한 «날» 한 번 내려가도
 *   줄은 여러 개 생긴다. 실측 — Accuracy Shipping 이 30줄인데 그게 30번 내려간 것이 아니다.
 *   ⛔ 「30번 내려갔다」로 쓰지 않는다. ✅ 줄 수(actions)와 «날 수»(occasions)를 따로 낸다.
 *     기사에 쓰는 것은 occasions 다.
 */
export function 거듭내려간곳(줄들, 몇번 = 2) {
  const 통 = {};
  for (const x of (줄들 || [])) {
    if (x.action !== 'downgrade') continue;
    const k = x.symbol || x.company;
    if (!k) continue;
    통[k] = 통[k] || { symbol: x.symbol, company: x.company, listing: x.listing, count: 0, agencies: new Set(), dates: [] };
    통[k].count += 1;
    if (x.agency) 통[k].agencies.add(짧은이름(x.agency));
    if (x.ratingDateTrusted && x.ratingDate) 통[k].dates.push(x.ratingDate);
  }
  return Object.values(통)
    .filter((x) => x.count >= 몇번)
    .map((x) => ({
      symbol: x.symbol, company: x.company, listing: x.listing,
      /* 줄 수 — 등급받은 상품마다 한 줄씩 생긴다. 이것을 「몇 번」으로 읽으면 안 된다 */
      downgradeActions: x.count,
      /* ⭐ 기사에 쓰는 수 — «서로 다른 날»이 몇인가 */
      downgradeOccasions: new Set(x.dates).size || null,
      agencies: [...x.agencies].sort(),
      firstDate: x.dates.sort()[0] || null, lastDate: x.dates.sort().slice(-1)[0] || null,
    }))
    .sort((a, b) => (b.downgradeOccasions || 0) - (a.downgradeOccasions || 0)
      || b.downgradeActions - a.downgradeActions
      || String(a.company).localeCompare(String(b.company)));
}

/** 등급이 «사라진» 곳 — 우리 강령이 좋아하는 축이다. 말없이 없어지는 것을 센다 */
export function 사라진등급(줄들) {
  const 것 = (줄들 || []).filter((x) => /withdraw/i.test(String(x.rating || '')) || x.action === 'withdrawn');
  const 회사 = new Set(것.map((x) => x.symbol || x.company).filter(Boolean));
  return { rows: 것.length, companies: 회사.size };
}

export function 잰다(줄들) {
  const 움직인것 = 움직임만(줄들);
  const 내림 = 움직인것.filter((x) => x.action === 'downgrade').length;
  const 올림 = 움직인것.length - 내림;
  const 안믿는날 = (줄들 || []).filter((x) => !x.ratingDateTrusted).length;
  return {
    /* ⛔ 분모를 먼저 적는다 */
    eventsStored: (줄들 || []).length,
    movesCounted: 움직인것.length,
    upgrades: 올림,
    downgrades: 내림,
    downgradeShare: 움직인것.length ? Math.round((내림 / 움직인것.length) * 1000) / 10 : null,
    notCountedBecauseActionUnclear: (줄들 || []).filter((x) => x.action === 'other' || x.action === 'unknown').length,
    datesNotTrusted: 안믿는날,
    byAgency: 평가사별내림몫(줄들),
    byMonth: 달별움직임(줄들),
    repeatDowngrades: 거듭내려간곳(줄들, 2),
    withdrawn: 사라진등급(줄들),
  };
}

function 가장최근파일() {
  if (!fs.existsSync(쌓은곳)) return null;
  const fl = fs.readdirSync(쌓은곳).filter((f) => /^\d{8}\.json(\.gz)?$/.test(f)).sort();
  return fl.length ? path.join(쌓은곳, fl[fl.length - 1]) : null;
}

/** 눌러 둔 것도 그냥 둔 것도 읽는다 — 쌓는 쪽이 gz 로 바뀌었다(2026-09-15) */
export function 읽는다(길) {
  const 날것 = fs.readFileSync(길);
  const 글 = String(길).endsWith('.gz') ? zlib.gunzipSync(날것).toString('utf8') : 날것.toString('utf8');
  return JSON.parse(글);
}

async function 본일() {
  const 길 = 가장최근파일();
  if (!길) { console.error('🔴 쌓아 둔 것이 없다 — 먼저 collect-india-nse-credit-rating.mjs --적는다'); process.exit(1); }
  const j = 읽는다(길);
  const 잰것 = 잰다(j.rows || []);

  console.log('■ 바탕 — ' + path.relative(뿌리, 길));
  console.log('   쌓인 사건 ' + 잰것.eventsStored.toLocaleString());
  console.log('   ⛔ 뜻을 모르는 처리(Other 등) ' + 잰것.notCountedBecauseActionUnclear.toLocaleString() + ' 는 «안 센다»');
  console.log('\n■ 평가사가 스스로 «올림·내림»이라 적은 것만 — ' + 잰것.movesCounted.toLocaleString() + '건');
  console.log('   올림 ' + 잰것.upgrades.toLocaleString() + ' · 내림 ' + 잰것.downgrades.toLocaleString()
    + ' → 내림 몫 ' + 잰것.downgradeShare + '%');
  console.log('\n■ 평가사마다 — 움직인 것 중 «내린» 몫 (⭐ 남들이 안 세는 축)');
  for (const a of 잰것.byAgency) {
    console.log('   ' + a.agency.padEnd(16) + ' 움직임 ' + String(a.moves).padStart(5)
      + ' · 내림 ' + String(a.downgrades).padStart(4) + ' (' + a.downgradeShare + '%)');
  }
  console.log('\n■ 달마다 (올림÷내림)');
  for (const m of 잰것.byMonth.slice(-8)) {
    console.log('   ' + m.month + '  올림 ' + String(m.upgrades).padStart(4)
      + ' · 내림 ' + String(m.downgrades).padStart(3) + ' → ' + (m.ratio === null ? '—' : m.ratio + '배'));
  }
  console.log('\n■ 거듭 내려간 곳 ' + 잰것.repeatDowngrades.length + '곳 (두 번 이상)');
  for (const x of 잰것.repeatDowngrades.slice(0, 8)) {
    console.log('   ' + String(x.downgradeOccasions) + '일 (' + String(x.downgradeActions) + '줄)  '
      + String(x.company || x.symbol).slice(0, 40).padEnd(42) + (x.agencies || []).join(', '));
  }
  console.log('\n■ 등급이 «사라진» 곳 — ' + 잰것.withdrawn.rows.toLocaleString() + '건 · '
    + 잰것.withdrawn.companies.toLocaleString() + '곳');
  if (잰것.datesNotTrusted) console.log('⚠ 못 믿을 날짜 ' + 잰것.datesNotTrusted + '건 — 흐름 셈에서 뺐다');

  if (!process.argv.includes('--적는다')) { console.log('\n⬜ 재기만 했다. 적으려면 --적는다'); return; }
  fs.writeFileSync(나가는곳, JSON.stringify({
    _meta: {
      product: 'India rating moves — our own counts over exchange-disseminated rating actions',
      builtAt: new Date().toISOString(),
      basedOn: path.relative(뿌리, 길),
      source: 'NSE system-driven disclosure of credit ratings (SEBI LODR Reg 30)',
      notThis: [
        'Not a copy of the exchange table. These are counts we computed.',
        'Actions the agency filed as "Other" are NOT interpreted and NOT counted as moves.',
        'Dates the filer typed wrongly are excluded from the monthly trend, not corrected.',
        'Not investment advice, and not a view on any company.',
      ],
      publishGate: '⛔ NSE 약관 판단을 사장님께 여쭸다(2026-09-15 메일). 답 전에는 지면에 안 낸다.',
    },
    ...잰것,
  }, null, 1), 'utf8');
  console.log('✅ 적었다 — ' + path.relative(뿌리, 나가는곳));
}

/* ── 자가시험 ──────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('짧은이름: Limited 를 뗀다', 짧은이름('ICRA Limited') === 'ICRA');
  재다('짧은이름: CRISIL Ratings Limited', 짧은이름('CRISIL Ratings Limited') === 'CRISIL');
  재다('짧은이름: 길게 붙은 것도 줄인다',
    짧은이름('India Ratings and Research Private Limited') === 'India');
  재다('⛔ 짧은이름: 빈 것은 null', 짧은이름('') === null);

  const 줄들 = [
    { symbol: 'A', company: 'A Ltd', agency: 'CRISIL Ratings Limited', action: 'downgrade', ratingDate: '2026-08-10', ratingDateTrusted: true, rating: 'Crisil A' },
    { symbol: 'A', company: 'A Ltd', agency: 'ICRA Limited', action: 'downgrade', ratingDate: '2026-09-01', ratingDateTrusted: true, rating: '[ICRA]A' },
    { symbol: 'B', company: 'B Ltd', agency: 'CRISIL Ratings Limited', action: 'upgrade', ratingDate: '2026-08-11', ratingDateTrusted: true, rating: 'Crisil AA' },
    { symbol: 'C', company: 'C Ltd', agency: 'CRISIL Ratings Limited', action: 'other', ratingDate: '2026-08-12', ratingDateTrusted: true, rating: 'Crisil AAA' },
    { symbol: 'D', company: 'D Ltd', agency: 'CARE Ratings Limited', action: 'upgrade', ratingDate: '2205-12-04', ratingDateTrusted: false, rating: 'CARE A' },
    { symbol: 'E', company: 'E Ltd', agency: 'CARE Ratings Limited', action: 'other', ratingDate: '2026-09-02', ratingDateTrusted: true, rating: 'Withdrawn' },
  ];

  const 움 = 움직임만(줄들);
  재다('🔴 움직임만: other 는 «안 센다»', 움.length === 4);
  재다('⛔ 움직임만: other 가 분모에 안 들어간다', !움.some((x) => x.action === 'other'));

  const 잼 = 잰다(줄들);
  재다('잰다: 분모를 먼저 낸다', 잼.eventsStored === 6 && 잼.movesCounted === 4);
  재다('잰다: 올림 2 · 내림 2', 잼.upgrades === 2 && 잼.downgrades === 2);
  재다('잰다: 내림 몫 50%', 잼.downgradeShare === 50);
  재다('🔴 잰다: 못 센 것을 «수로» 밝힌다', 잼.notCountedBecauseActionUnclear === 2);
  재다('잰다: 못 믿을 날짜를 센다', 잼.datesNotTrusted === 1);

  const 평 = 평가사별내림몫(줄들);
  재다('평가사별: CRISIL 은 움직임 2 중 내림 1 = 50%',
    평.find((x) => x.agency === 'CRISIL').downgradeShare === 50);
  재다('평가사별: ICRA 는 내림 하나뿐이라 100%',
    평.find((x) => x.agency === 'ICRA').downgradeShare === 100);
  재다('⛔ 평가사별: other 만 있는 곳은 안 나온다', !평.some((x) => x.moves === 0));

  const 달들 = 달별움직임(줄들);
  재다('🔴 달별: 못 믿는 날짜(2205)는 흐름에서 뺀다', !달들.some((m) => m.month.startsWith('2205')));
  재다('달별: 2026-08 에 올림 1 · 내림 1',
    달들.find((m) => m.month === '2026-08').upgrades === 1 && 달들.find((m) => m.month === '2026-08').downgrades === 1);
  재다('달별: 차례대로 나온다', 달들.map((m) => m.month).join() === [...달들.map((m) => m.month)].sort().join());

  const 거듭 = 거듭내려간곳(줄들, 2);
  재다('⭐ 거듭내려간곳: A 만 두 번', 거듭.length === 1 && 거듭[0].symbol === 'A');
  재다('🔴 거듭내려간곳: 줄 수와 «날 수»를 따로 낸다',
    거듭[0].downgradeActions === 2 && 거듭[0].downgradeOccasions === 2);
  재다('🔴 거듭내려간곳: 같은 날 두 상품이 내려가면 «하루»로 센다',
    거듭내려간곳([
      { symbol: 'Z', company: 'Z', agency: 'ICRA Limited', action: 'downgrade', ratingDate: '2026-08-10', ratingDateTrusted: true },
      { symbol: 'Z', company: 'Z', agency: 'ICRA Limited', action: 'downgrade', ratingDate: '2026-08-10', ratingDateTrusted: true },
    ], 2)[0].downgradeOccasions === 1);
  재다('거듭내려간곳: 두 평가사가 다 적힌다', 거듭[0].agencies.join() === 'CRISIL,ICRA');
  재다('거듭내려간곳: 첫날·끝날', 거듭[0].firstDate === '2026-08-10' && 거듭[0].lastDate === '2026-09-01');

  const 사 = 사라진등급(줄들);
  재다('사라진등급: 등급칸이 Withdrawn 인 것을 센다', 사.rows === 1 && 사.companies === 1);

  재다('⛔ 빈 것도 견딘다', 잰다([]).movesCounted === 0 && 잰다(null).eventsStored === 0);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) await 본일();
