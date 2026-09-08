#!/usr/bin/env node
/**
 * measure-klifemap-checkout-funnel.mjs — **결제 화면까지 갔는데 몇 명이 냈나.**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-08 22:1x] 사장님이 GA4 「페이지 제목 및 화면 클래스별 조회수」를 붙여 주셨다.
 *   붙여 주신 줄 가운데 이것이 있었다 —
 *     「Free Birth Chart & Natal Chart Reading - Western Astrology + BaZi | KLifeMap.AI」
 *     「**결제 - KLifeMap.AI**」   22 · 20
 *
 *   ⭐ **결제 화면이 열렸다.** 그런데 매출은 0원으로 보고돼 왔다.
 *     그러면 새는 자리가 「손님이 안 온다」가 아니라 «결제 화면 다음»이다. 그 둘은 처방이 다르다.
 *
 * ⛔ 사장님이 붙여 주신 조각을 그대로 «우리 수»로 적지 않는다 —
 *   조각이 끊겨 있어 어느 줄이 몇인지 확정할 수 없다. **내가 다시 잰다.**
 *
 * ⚠ 낱말을 정확히 쓴다 (사장님 지시: 「페이지뷰이지? 정확하게 용어를 써라」)
 *   조회수(screenPageViews)  지면이 «열린» 횟수. 한 사람이 세 번 열면 셋이다
 *   순방문자(totalUsers)      사람 수
 *   ⛔ 「조회수 20」을 「20명이 왔다」로 옮기지 않는다.
 *
 * ⭐ 그리고 DB 쪽 «실제 결제 건수»와 나란히 놓는다 — GA4 만 보면 그것이 매출인 줄 안다.
 *
 * 쓰는 법
 *   node scripts/measure-klifemap-checkout-funnel.mjs
 *   node scripts/measure-klifemap-checkout-funnel.mjs --일수 28
 *   node scripts/measure-klifemap-checkout-funnel.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { 토큰받기 } from './ga4-report.mjs';

const 뿌리 = path.resolve(import.meta.dirname, '..');
/* ⛔ 호스트 이름을 여러 곳에 적지 않는다 — 한쪽만 고쳐지면 그때부터 두 수가 갈린다 */
export const 클라이프맵호스트 = 'klifemap.ai';
const klifemap = 'C:/Users/User/Documents/GitHub/klifemap';

/** 결제 갈래 지면인가 — 제목으로 가른다. ⛔ 「결제」 한 낱말만 보고 다 잡지 않는다 */
export function 결제갈래(제목) {
  const s = String(제목 ?? '');
  if (/결제취소|환불|refund|cancel/i.test(s)) return '결제취소·환불';
  if (/결제|checkout|payment|pay\b/i.test(s)) return '결제';
  if (/가격|요금|pricing|plan/i.test(s)) return '가격';
  if (/로그인|login|sign\s*in/i.test(s)) return '로그인';
  if (/가입|sign\s*up|register/i.test(s)) return '가입';
  return null;
}

/** 잰 수인가 — `Number(null) === 0` 이 「못 잼」을 「0」으로 바꾸는 것을 막는다 */
export function 잰수인가(v) {
  if (v == null) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  return Number.isFinite(Number(v));
}

/**
 * 새는 자리를 말로 낸다.
 * ⛔ 「전환율 0%」로 끝내지 않는다. 무엇이 0인지 이름을 붙인다.
 */
export function 어디서새나({ 결제조회, 결제사람, 실제결제건수 }) {
  if (!잰수인가(결제조회)) return '⬜ 결제 화면 조회수를 못 쟀다 (0 으로 치지 않는다)';
  const 조회 = Number(결제조회);
  if (조회 === 0) return '⬜ 결제 화면이 «열린 적이 없다» — 새는 자리는 그 앞이다';
  if (!잰수인가(실제결제건수)) return '⬜ 실제 결제 건수를 못 쟀다 — DB 를 못 읽었다';
  const 결제 = Number(실제결제건수);
  if (결제 === 0) return `🔴 결제 화면이 ${조회}번 열렸는데 «실제 결제 0건» — 새는 자리는 결제 화면 «안»이다`;
  if (잰수인가(결제사람) && Number(결제사람) > 0) {
    const 몫 = (결제 / Number(결제사람) * 100).toFixed(1);
    return `결제 화면을 본 사람 ${결제사람}명 중 ${결제}건이 냈다 (${몫}%)`;
  }
  return `결제 ${결제}건 (화면 조회 ${조회}회)`;
}

/**
 * 🔴🔴 [2026-09-08 22:4x · 1번이 바로잡아 줬다] **로컬 파일을 서비스 자료로 읽었다.**
 *
 *   내가 `klifemap/db/beomjin.sqlite3` 를 열어 「paid 174건 · 3,565,000원」을 내고,
 *   1번의 「paid 0건」이 틀렸다고 사장님께 올렸다. **틀린 것은 나였다.**
 *
 *   1번이 짚어 준 것:
 *     git check-ignore -v db/beomjin.sqlite3
 *     → .gitignore:10:db/*.sqlite3     ← 커밋된 적 없는 «로컬 전용» 파일
 *     여섯 자리가 한 작업트리를 쓰며 로컬 서버를 띄워 만든 시험 결제가 쌓인 것이다.
 *
 *   ⭐ 실 서비스는 이것으로만 본다 — `https://klifemap.ai/api/admin/payments`
 *     1번 재확인: 전체 33건 · paid 0건 · pending 33건 · **확정 매출 0원**
 *     ⇒ 1번의 「paid 0건·매출 0원」은 «틀리지 않았다».
 *
 * ⛔ 그러니 이 자는 로컬 파일을 읽을 때 **그것이 로컬 테스트임을 화면에 못박는다.**
 *   ⭐ 「규칙은 문장이 아니라 검사로 둔다」 — 메모에 적어 두는 것으로는 또 같은 일이 난다.
 *   ⚠ 오늘 내가 다섯 번째로 어긴 병이 이것이다 — **「어디서 잰 것인가」를 안 밝혔다.**
 */
export const 로컬DB경고 = [
  '🔴 이 수는 «로컬 테스트 DB» 다 — 실 서비스가 아니다',
  '   klifemap/db/beomjin.sqlite3 은 .gitignore 대상이고, 한 작업트리를 쓰는 여섯 자리가',
  '   로컬 서버를 띄워 만든 시험 결제가 쌓인 파일이다 (merchant_uid 가 test_ 로 시작한다).',
  '   ✅ 실 서비스 결제는 https://klifemap.ai/api/admin/payments 로만 본다.',
  '   ⛔ 이 수를 «매출»이라 부르지 않는다. 2026-09-08 에 내가 그렇게 불렀고 틀렸다.',
];

/** 로컬 테스트 DB 로 보이나 — merchant_uid 접두로 가른다 */
export function 로컬시험인가(접두별) {
  const 전체 = Object.values(접두별 ?? {}).reduce((a, n) => a + Number(n || 0), 0);
  if (!전체) return null;                     /* ⬜ 못 쟀다 — 0 으로 치지 않는다 */
  const 시험 = Number(접두별.test ?? 0) + Number(접두별.TEST ?? 0);
  return 시험 / 전체 >= 0.5;                   /* 절반 넘게 test_ 면 로컬 시험판이다 */
}

async function DB에서결제건수() {
  const 후보 = [path.join(klifemap, 'db/beomjin.sqlite3'), path.join(klifemap, 'beomjin.sqlite3')];
  const 있는것 = 후보.filter((p) => fs.existsSync(p)).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  if (!있는것.length) return { 못쟀다: 'DB 파일을 못 찾았다' };
  /* ⭐ 살아 있는 DB 를 그냥 열지 않는다 — 찢어지지 않은 사본을 떠서 읽는다 */
  const 사본 = path.join(process.env.TEMP || '.', 'klifemap-funnel-스냅샷.sqlite3');
  const require = createRequire(`file:///${klifemap}/package.json`);
  let Database;
  try { Database = require('better-sqlite3'); } catch (e) { return { 못쟀다: `better-sqlite3 를 못 불렀다 — ${e.message}` }; }
  try { if (fs.existsSync(사본)) fs.rmSync(사본); } catch { /* 남겨져 있으면 지나간다 */ }
  const live = new Database(있는것[0], { readonly: true, fileMustExist: true });
  try { await live.backup(사본); } finally { live.close(); }

  const db = new Database(사본, { readonly: true, fileMustExist: true });
  try {
    const 표들 = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map((x) => x.name);
    const 결제표 = 표들.filter((n) => /order|payment|pay|purchase|checkout|subscription|결제/i.test(n));
    const 셈 = {};
    for (const t of 결제표) {
      const n = db.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get().n;
      셈[t] = n;
    }
    /* ⭐ merchant_uid 접두를 세어 «이것이 로컬 시험판인가»를 판정한다 */
    let 접두별 = {};
    try {
      for (const r of db.prepare('SELECT merchant_uid FROM payments').all()) {
        const p = String(r.merchant_uid || '').split(/[-_]/)[0] || '(빈값)';
        접두별[p] = (접두별[p] || 0) + 1;
      }
    } catch { 접두별 = {}; }
    return { 표들: 표들.length, 결제표: 셈, 접두별, 로컬시험: 로컬시험인가(접두별) };
  } finally { db.close(); }
}

const 내가입구인가 = !!process.argv[1]
  && process.argv[1].split(/[\\/]/).pop() === new URL(import.meta.url).pathname.split('/').pop();

if (내가입구인가 && process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  /* 🔴 사장님이 붙여 주신 그 제목 — 시험으로 굳힌다 */
  재다('결제갈래 — 「결제 - KLifeMap.AI」를 결제로 가른다', 결제갈래('결제 - KLifeMap.AI') === '결제');
  재다('결제갈래 — 영문 checkout 도 결제', 결제갈래('Checkout | KLifeMap.AI') === '결제');
  /* ⛔ 결제취소·환불은 «결제»가 아니다. 섞으면 매출을 두 번 세거나 거꾸로 센다 */
  재다('결제갈래 — 환불은 결제가 «아니다»', 결제갈래('환불 안내 - KLifeMap.AI') === '결제취소·환불');
  재다('결제갈래 — 결제취소도 갈라 낸다', 결제갈래('결제취소 - KLifeMap') === '결제취소·환불');
  재다('결제갈래 — 가격 지면은 따로', 결제갈래('가격 - KLifeMap.AI') === '가격');
  재다('결제갈래 — 사주 지면은 null',
    결제갈래('Free Birth Chart & Natal Chart Reading- Western Astrology + BaZi | KLifeMap.AI') === null);

  재다('잰수인가 — null 은 못 잼', 잰수인가(null) === false);
  재다('잰수인가 — 0 은 잰 값', 잰수인가(0) === true);
  재다('잰수인가 — 빈 문자열은 못 잼', 잰수인가('') === false);

  /* ⭐ 이 자를 만든 까닭 — 「조회는 있는데 결제는 0」을 이름 붙여 말한다 */
  재다('어디서새나 — 조회 20 · 결제 0 이면 «결제 화면 안»이라고 말한다',
    어디서새나({ 결제조회: 20, 결제사람: 8, 실제결제건수: 0 }).includes('결제 화면 «안»'));
  재다('어디서새나 — 조회 0 이면 «그 앞»이라고 말한다',
    어디서새나({ 결제조회: 0, 결제사람: 0, 실제결제건수: 0 }).includes('그 앞'));
  재다('어디서새나 — 조회를 못 쟀으면 0 으로 안 친다',
    어디서새나({ 결제조회: null, 실제결제건수: 0 }).startsWith('⬜'));
  재다('어디서새나 — 결제 건수를 못 쟀으면 0 으로 안 친다',
    어디서새나({ 결제조회: 20, 실제결제건수: null }).includes('못 쟀다'));
  /* 🔴 [2026-09-08 22:4x] 1번이 바로잡아 줬다 — 로컬 파일을 서비스 자료로 읽었다 */
  재다('로컬시험인가 — test_ 가 171/176 이면 로컬 시험판이다',
    로컬시험인가({ test: 171, bj: 5 }) === true);
  재다('로컬시험인가 — test_ 가 없으면 로컬 시험판이 아니다',
    로컬시험인가({ bj: 5 }) === false);
  재다('로컬시험인가 — 한 건도 못 세면 «못 쟀다»(null) — 0 으로 안 친다',
    로컬시험인가({}) === null && 로컬시험인가(null) === null);
  재다('로컬DB경고에 실 서비스 주소가 들어 있다',
    로컬DB경고.some((l) => l.includes('/api/admin/payments')));
  재다('로컬DB경고가 «매출이라 부르지 말라»고 못박는다',
    로컬DB경고.some((l) => l.includes('매출') && l.includes('부르지 않는다')));
  재다('어디서새나 — 결제가 있으면 몫을 낸다',
    어디서새나({ 결제조회: 20, 결제사람: 8, 실제결제건수: 2 }).includes('25.0%'));

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

if (내가입구인가) {
  const i = process.argv.indexOf('--일수');
  const 일수 = i > 0 ? Number(process.argv[i + 1]) : 28;

  /* GA4 — 지면 «제목»별 조회수. 사장님이 보신 그 보고서와 같은 축이다 */
  let 결제조회 = null; let 결제사람 = null; const 줄들 = [];
  let 걸러낸것 = 0;
  try {
    const 열쇠글 = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      || (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    if (!열쇠글) throw new Error('서비스 계정 열쇠를 못 찾았다 (.env)');
    const 토큰 = await 토큰받기(JSON.parse(열쇠글));
    /**
     * 🔴🔴 [2026-09-09 02:2x · 5번] **「속성 ID 가 없어 못 쟀다」는 내 잘못이었다.**
     *
     * 나는 이틀 동안 사장님 보고와 메모에 이렇게 적었다 —
     *   「klifemap GA4 속성 ID(GA4_PROPERTY_KLIFEMAP)가 .env 에 없어 결제 화면 조회수를
     *    못 쟀습니다. 1번·4번께 요청해 뒀습니다.」
     *
     * ⛔ **요청해 놓고 기다린 것 자체가 틀렸다.** 오늘 `ga4-report.mjs --찾는다` 를 돌려 보니
     *   **공용 속성 하나가 klifemap.ai 까지 이미 재고 있었다** —
     *   klifemap.ai 순방문 100 · 세션 222 · 지면열림 699 (28일).
     *   따로 속성을 받을 일이 아니었고, 호스트로 걸러 읽으면 되는 일이었다.
     *
     * ⭐ 그래서 이렇게 물러선다 — 전용 속성이 있으면 그것을, 없으면 «공용 속성 + 호스트 거르기».
     *   ⛔ 호스트를 안 걸면 네 사이트 지면 제목이 섞여 「결제」 수가 부풀거나 엉킨다.
     *   ⛔ 그리고 어느 속성으로 쟀는지 «화면에 밝힌다» — 못 밝히면 다음 세션이 또 헷갈린다.
     */
    const 전용 = (process.argv.find((a) => a.startsWith('--속성='))?.split('=')[1]) || process.env.GA4_PROPERTY_KLIFEMAP;
    const 속성 = 전용 || process.env.GA4_PROPERTY_ID;
    if (!속성) throw new Error('GA4 속성 ID 를 못 찾았다 (--속성= 또는 .env 의 GA4_PROPERTY_KLIFEMAP·GA4_PROPERTY_ID)');
    const 공용인가 = !전용;
    console.log(`■ GA4 속성 ${속성}${공용인가 ? ` — 공용 속성이다. 호스트 ${클라이프맵호스트} 로 걸러 읽는다` : ' — klifemap 전용 속성'}`);
    const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: `${일수}daysAgo`, endDate: 'yesterday' }],
        dimensions: [{ name: 'pageTitle' }, { name: 'hostName' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
        /* ⛔ 공용 속성일 때 호스트를 안 걸면 네 사이트가 섞인다 */
        ...(공용인가 ? {
          dimensionFilter: {
            filter: { fieldName: 'hostName', stringFilter: { matchType: 'CONTAINS', value: 클라이프맵호스트, caseSensitive: false } },
          },
        } : {}),
        orderBys: [{ desc: true, metric: { metricName: 'screenPageViews' } }],
        limit: 200,
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`GA4 ${r.status} — ${JSON.stringify(j).slice(0, 140)}`);
    for (const row of j.rows ?? []) {
      const 제목 = row.dimensionValues?.[0]?.value ?? '';
      const 호스트 = row.dimensionValues?.[1]?.value ?? '';
      const 조회 = Number(row.metricValues?.[0]?.value ?? 0);
      const 사람 = Number(row.metricValues?.[1]?.value ?? 0);
      /* ⛔ 거르기가 통했나를 «수로» 본다. 안 통했으면 남의 사이트 줄이 섞여 들어온다 */
      if (공용인가 && !호스트.toLowerCase().includes(클라이프맵호스트)) { 걸러낸것 += 1; continue; }
      줄들.push({ 제목, 호스트, 조회, 사람, 갈래: 결제갈래(제목) });
    }
    const 결제줄 = 줄들.filter((x) => x.갈래 === '결제');
    if (결제줄.length) {
      결제조회 = 결제줄.reduce((a, x) => a + x.조회, 0);
      결제사람 = 결제줄.reduce((a, x) => a + x.사람, 0);
    } else { 결제조회 = 0; 결제사람 = 0; }
  } catch (e) {
    console.log(`⬜ GA4 를 못 읽었다 — ${String(e.message).slice(0, 130)}`);
    console.log('   ⛔ 0 으로 치지 않는다. 아래 DB 쪽만 낸다.');
  }

  if (걸러낸것) {
    console.log(`⚠ 다른 사이트 줄 ${걸러낸것}개를 걸러 냈다 — 공용 속성이라 섞여 온다. 이 수가 크면 거르기를 다시 본다.`);
  }
  if (줄들.length) {
    console.log(`■ klifemap 지면 «제목»별 조회수 — 최근 ${일수}일 (어제까지)`);
    for (const x of 줄들.slice(0, 12)) {
      console.log(`   조회 ${String(x.조회).padStart(5)} · 사람 ${String(x.사람).padStart(4)} ${(x.갈래 ? '['+x.갈래+']' : '').padEnd(12)} ${x.제목.slice(0, 62)}`);
    }
    console.log('');
    for (const g of ['결제', '가격', '로그인', '가입', '결제취소·환불']) {
      const s = 줄들.filter((x) => x.갈래 === g);
      if (!s.length) { console.log(`   ${g.padEnd(12)} ⬜ 그 갈래 지면이 «목록에 없다»`); continue; }
      console.log(`   ${g.padEnd(12)} 조회 ${s.reduce((a, x) => a + x.조회, 0)} · 사람 ${s.reduce((a, x) => a + x.사람, 0)}`);
    }
  }

  const db = await DB에서결제건수();
  console.log('');
  if (db.못쟀다) { console.log(`⬜ 로컬 DB — ${db.못쟀다}`); }
  else {
    console.log(`■ «로컬» DB 의 결제 갈래 표 (표 ${db.표들}개 중)`);
    const 것들 = Object.entries(db.결제표).sort((a, b) => b[1] - a[1]);
    if (!것들.length) console.log('   ⬜ 결제 갈래로 보이는 표가 없다');
    for (const [t, n] of 것들) console.log(`   ${String(n).padStart(6)}줄  ${t}`);
    console.log(`   merchant_uid 접두: ${Object.entries(db.접두별).map(([k, v]) => `${k}=${v}`).join(' · ') || '(없다)'}`);
    console.log('');
    /* 🔴 로컬 시험판이면 «수를 내기 전에» 경고를 먼저 낸다 */
    if (db.로컬시험 === true) for (const l of 로컬DB경고) console.log(l);
    else if (db.로컬시험 === null) console.log('⬜ merchant_uid 를 못 읽었다 — 로컬 시험판인지 «못 갈랐다»');
    else console.log('⚠ test_ 접두가 절반 미만이다. 그래도 이 파일은 .gitignore 대상 «로컬» 파일이다 —');
  }

  /**
   * ⛔ 로컬 수를 「실제 결제 건수」로 넘기지 «않는다». 2026-09-08 에 그렇게 해서 틀렸다.
   *   실 서비스는 https://klifemap.ai/api/admin/payments 가 정본이고, 그것은 열쇠가 필요해
   *   1번이 본다. 여기서는 «못 쟀다»로 둔다 — 0 으로도 174로도 치지 않는다.
   */
  const 실제결제건수 = null;
  console.log('');
  console.log('■ 어디서 새나');
  console.log('   ' + 어디서새나({ 결제조회, 결제사람, 실제결제건수 }));
  console.log('   ⭐ 실 서비스 결제 건수는 1번이 /api/admin/payments 로 봅니다 —');
  console.log('      2026-09-08 22:4x 1번 실측: 전체 33건 · paid 0건 · pending 33건 · 확정 매출 0원');
  console.log('');
  console.log('⚠ 낱말 — 「조회수」는 지면이 열린 «횟수»다. 한 사람이 세 번 열면 셋이다.');
  console.log('   ⛔ 「조회 20」을 「20명이 왔다」로 옮기지 않는다.');
}
