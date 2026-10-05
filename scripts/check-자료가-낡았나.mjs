#!/usr/bin/env node
/**
 * check-자료가-낡았나.mjs — **사이트를 떠받치는 자료가 언제 것인가.**
 *
 * ── 🔴 왜 (2026-10-06 03:5x · 5번) ──────────────────────────────────
 * 사장님: 「**에스마켓 구축을 빨리 끝내라. 데이터 수집, 가공만 하면 될 수 있는
 *          상황을 빨리 만들고. B2B 영업에 집중하라.**」(2026-10-04)
 *
 * 「데이터 수집만 하면 되는 상태」가 되려면 **수집이 빠진 것을 저절로 알아야** 한다.
 * 그래서 `src/data` 를 재 보니 —
 *
 * ```
 * JSON 457개 · 이레 안 78개 · 한 달 안 174개 · 한 달 넘음 205개
 * ```
 *
 * 🔴 그런데 더 큰 것이 있었다 — **기준일의 이름이 제각각이다.**
 * ```
 * korea-financials-tape   _meta.builtAt    "2026. 9. 23. 오전 11:06:06"
 * japan-financials-tape   _meta.지은때      "2026. 9. 26. 오후 6:06:37"
 * korea-valuation-tape    _meta.builtAt + _meta.priceAsOf "20261001"
 * ```
 * ⇒ 이름이 다르니 **한 자로 다 읽을 수가 없었다.** 처음에 `_meta.asOf` 만 보고
 *   「기준일이 하나도 없다」고 적을 뻔했다. 자가 못 읽은 것을 자료가 없는 것으로
 *   읽으면 그때부터 판단이 통째로 틀어진다.
 *
 * ⭐ 그래서 이 자가 **여러 이름을 다 본다.** 자료 457개를 고치는 대신 읽는 쪽이 받는다.
 *
 * ── ⚠ 무엇을 보고 무엇을 안 보나 ───────────────────────────────────
 * ```
 * ✅ 큰 자료부터 본다       사이트를 떠받치는 것이 큰 자료다
 * ⛔ 457개를 다 막지 않는다  역사 자료·사전처럼 갱신할 까닭이 없는 것이 많다
 * ⛔ 「한 달 넘음 205개」를 흠으로 세지 않는다 — 갱신 주기를 자료마다 정하기 전에는
 *   그것이 늦은 것인지 알 수 없다. **못 쟀다고 적는다.**
 * ```
 *
 * 쓰는 법
 *   node scripts/check-자료가-낡았나.mjs
 *   node scripts/check-자료가-낡았나.mjs --몇개 30
 *   node scripts/check-자료가-낡았나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자료방 = path.join(뿌리, 'src/data');

/** 기준일이 적힐 수 있는 이름들 — 한국어와 영어가 섞여 있다 */
export const 기준일이름 = [
  'asOf', 'as_of', 'asof', 'builtAt', 'built_at', 'generatedAt',
  'updated', 'updatedAt', 'date', 'priceAsOf',
  '기준일', '지은때', '만든때', '받은때',
];

/**
 * 몇 날이나 지난 자료를 흠으로 보나.
 * 🔴 이보다 «늘면» 흠이다. 자료를 받으면 내려 적는다.
 *
 * ⛔ **「고치면 될 수」를 적지 않는다.** 오늘 같은 함정에 두 번 빠졌다 —
 *   라이브(또는 지금 상태)를 재는 자에 0 을 적어 두면, 그것을 고치러 가는
 *   길 자체가 막힌다. 못 박은 수는 **「지금 재지는 수」**다.
 *
 * ⚠ 2026-10-06 04:0x 실측 — 큰 자료 20개 가운데 30일 넘은 것 5개.
 * ```
 * wikitip-title-pages      37일   kculturewire
 * kcw-alongside            36일   kculturewire
 * wikitip-groups           33일   kculturewire
 * kcw-school-pipeline      32일   kculturewire
 * kr-listed-company-names  31일   seoulmarkets  ← 5번 몫
 * ```
 *
 * ⭐ 이름으로 사이트를 갈라 **배포 관문 ③-ㄷ2 에 걸었다**(2026-10-06 04:0x).
 *   그렇게 하기 전에는 kculturewire 자료가 낡았다고 seoulmarkets 배포가 막히는
 *   꼴이 된다. 그 잘못은 오늘 검색 자물쇠에서 이미 한 번 저질렀다 —
 *   합계 하나로 네 사이트를 같이 막았다.
 */
export const 못박은_낡은큰자료 = 0;   /* 2026-10-06 04:0x — 다섯을 다 받았다 */

/**
 * 🔴 사이트마다 못 박는다 — 남의 사이트 자료 때문에 내 배포가 막히지 않게.
 * ⚠ 2026-10-06 04:0x 실측. seoulmarkets 는 그 자리에서 받아 0 이 됐다.
 */
export const 못박은_사이트별 = {
  seoulmarkets: 0,   /* kr-listed-company-names 를 받았다 */
  kcw: 0,            /* 2026-10-06 04:0x — 넷을 다 받아 0. build-wikitip-title-pages.mjs 가 있었다 */
  '100y': 0,
};
export const 낡음선 = 30;        /* 날 */
export const 기본몇개 = 20;      /* 큰 것부터 몇 개를 보나 */

/** `_meta` 에서 기준일 글을 꺼낸다. ⛔ 없으면 null — 파일 날짜로 슬그머니 바꾸지 않는다 */
export function 기준일글(덩이) {
  const m = (덩이 && (덩이._meta ||덩이.meta)) || null;
  if (!m || typeof m !== 'object') return null;
  for (const k of 기준일이름) {
    const v = m[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && String(v).length >= 6) return String(v);
  }
  return null;
}

/**
 * 기준일 글을 날짜로 읽는다. 꼴이 제각각이라 셋을 본다 —
 *   ① "20261001" 같은 여덟 자리   ② "2026-09-23"   ③ Date 가 읽는 것
 * ⛔ 못 읽으면 null. 오늘로 메우지 않는다.
 */
export function 날짜로(글) {
  const s = String(글 ?? '').trim();
  if (!s) return null;
  let m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /(\d{4})[-.\s/]+(\d{1,2})[-.\s/]+(\d{1,2})/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 며칠 지났나. ⛔ 못 재면 null */
export function 며칠(날, 오늘 = new Date()) {
  if (!(날 instanceof Date) || Number.isNaN(날.getTime())) return null;
  return Math.floor((오늘 - 날) / 86400000);
}

/**
 * 자료 하나를 잰다.
 * @returns { 이름, 크기, 파일나이, 기준일, 기준나이, 줄수 } · 못 읽으면 null
 */
export function 한자료(길, 오늘 = new Date()) {
  let st;
  try { st = fs.statSync(길); } catch { return null; }
  const 것 = {
    이름: path.basename(길), 크기: st.size,
    파일나이: 며칠(st.mtime, 오늘), 기준일: null, 기준나이: null, 줄수: null,
  };
  /* ⚠ 아주 큰 파일은 읽지 않는다 — 메모리를 먹고, 파일 날짜로도 쓸 만하다 */
  if (st.size > 40 * 1024 * 1024) return 것;
  try {
    const j = JSON.parse(fs.readFileSync(길, 'utf8'));
    것.기준일 = 기준일글(j);
    것.기준나이 = 며칠(날짜로(것.기준일), 오늘);
    const r = j.rows || j.data || (Array.isArray(j) ? j : null);
    것.줄수 = Array.isArray(r) ? r.length : null;
  } catch { /* 꼴이 다른 파일은 파일 날짜만 쓴다 */ }
  return 것;
}

/** 큰 것부터 몇 개 — 사이트를 떠받치는 것이 큰 자료다 */
export function 큰것들(방 = 자료방, 몇개 = 기본몇개, 오늘 = new Date()) {
  let 이름들;
  try { 이름들 = fs.readdirSync(방).filter((n) => n.endsWith('.json')); } catch { return null; }
  const 모음 = [];
  for (const n of 이름들) {
    const x = 한자료(path.join(방, n), 오늘);
    if (x) 모음.push(x);
  }
  모음.sort((a, b) => b.크기 - a.크기);
  return 모음.slice(0, 몇개);
}

/** 낡은 것만 — 기준일이 있으면 그것으로, 없으면 파일 날짜로 */
export function 낡은것(목록, 선 = 낡음선) {
  if (!Array.isArray(목록)) return null;
  return 목록.filter((x) => {
    const 나이 = x.기준나이 ?? x.파일나이;
    return typeof 나이 === 'number' && 나이 > 선;
  });
}

/**
 * 🔴 [2026-10-06 04:0x · 5번] **어느 사이트의 자료인가 — 이름으로 가른다.**
 *
 * 자료가 `src/data` 한 방에 섞여 있어, 그대로 관문에 걸면
 * **kculturewire 자료가 낡았다고 seoulmarkets 배포가 막힌다.**
 * 그 잘못은 오늘 검색 자물쇠에서 이미 한 번 저질렀다 — 합계 하나로 네 사이트를
 * 같이 막았고, 100yearmap 을 처음 재기 시작한 것을 「나빠졌다」로 읽었다.
 *
 * ⛔ **모르는 것은 「모름」으로 둔다.** 짐작으로 사이트를 붙이면, 엉뚱한 사이트의
 *   배포가 막히거나 막아야 할 것이 그냥 지나간다. 둘 다 자물쇠가 아닌 것이다.
 */
export function 어느사이트(이름) {
  const n = String(이름 ?? '').toLowerCase();
  if (/^(kcw|wikitip)-/.test(n)) return 'kcw';
  if (/^100y-/.test(n)) return '100y';
  if (/^(korea|kr|japan|taiwan|uae|krx|dart|ecos)[-.]/.test(n)) return 'seoulmarkets';
  return null;   /* 모름 — 막지 않는다 */
}

/** 한 사이트의 낡은 자료만 */
export function 그사이트낡은것(목록, 딱지, 선 = 낡음선) {
  const 낡음 = 낡은것(목록, 선);
  if (!낡음) return null;
  return 낡음.filter((x) => 어느사이트(x.이름) === 딱지);
}

/**
 * 🔴 [2026-10-06 04:0x · 5번] **그 자료를 「받는 자」가 저장소에 있나.**
 *
 * 사장님이 바라시는 것은 「**데이터 수집, 가공만 하면 될 수 있는 상황**」이다.
 * 그러려면 자료마다 **받는 길이 있어야** 한다. 길이 없으면 낡아도 받을 수가 없다.
 *
 * ⛔ 「낡았다」와 「낡았는데 받을 길도 없다」는 **다른 일**이다. 뒤가 더 나쁘다.
 *   앞은 자를 돌리면 끝나고, 뒤는 먼저 자를 만들어야 한다.
 *
 * 🔴 **그런데 오늘 내가 바로 그 둘을 뒤바꿔 읽었다.**
 *   `wikitip-title-pages.json`(37일)을 놓고 `grep writeFileSync` 로 찾아보고
 *   「쓰는 자가 없다」고 **세션간 메모에까지 적었다.** 그런데 이 함수를 만들어
 *   재 보니 `build-wikitip-title-pages.mjs` 가 **그대로 있었다.**
 *   돌리니 한 번에 받아졌다.
 *   ⇒ 내 손 `grep` 이 못 찾은 것을 「없다」로 읽었다. 자를 먼저 의심해야 했다.
 *
 * ⚠ 못 찾아도 「없다」고 단정하지 않는다 — 다른 이름으로 쓸 수도 있다.
 *   그래서 빈 배열을 돌려주되, 화면에는 「못 찾았다」로 적는다.
 *
 * ⛔ **처음에 `writeFileSync` 가 파일 이름과 «같은 문장»에 있다고 봤다가 틀렸다.**
 *   넷을 재니 넷 다 「못 찾았다」가 나왔다 — 방금 내 손으로 받은 자료까지.
 *   전부 같은 값이 나오면 자를 먼저 의심한다. 까닭은 이것이었다 —
 * ```
 * const 낼곳 = path.join(뿌리, 'src/data', 'kr-listed-company-names.json');
 * fs.writeFileSync(낼곳, …);        ← 이름과 writeFileSync 가 떨어져 있다
 * ```
 *   ⇒ **이름이 적혀 있고 `build-`/`make-` 로 시작하면 받는 자로 본다.**
 *     넓게 잡아 「있다」를 놓치지 않는 쪽을 고른다 — 이 자는 막지 않고 알리기만 한다.
 */
export function 받는자(이름, 방 = path.join(뿌리, 'scripts')) {
  const 뼈 = String(이름 ?? '').replace(/\.json$/, '');
  if (!뼈) return null;
  let 것들;
  try { 것들 = fs.readdirSync(방).filter((n) => /\.(mjs|js)$/.test(n)); } catch { return null; }

  /* ① 이름이 맞는 자 — 이 저장소의 관례다(build-<자료>.mjs · make-<자료>.mjs).
        여기 걸리면 «확실한» 받는 자다. */
  const 꼭맞음 = 것들.filter((n) => n.replace(/\.(mjs|js)$/, '') === 'build-' + 뼈
    || n.replace(/\.(mjs|js)$/, '') === 'make-' + 뼈);
  if (꼭맞음.length) return { 확실: 꼭맞음, 후보: [] };

  /* ② 이름이 안 맞으면 내용에 그 이름이 든 짓는 자를 «후보»로만 적는다.
        ⛔ 읽기만 하는 자도 이름을 품는다 — wikitip-title-pages 는 그렇게 23개가 걸렸다.
          그것들을 「받는 자」라고 적으면 거짓이다. 그래서 «후보»라고 부른다. */
  const 후보 = [];
  for (const n of 것들) {
    if (!/^(build|make)[-_]/.test(n)) continue;
    let s;
    try { s = fs.readFileSync(path.join(방, n), 'utf8'); } catch { continue; }
    if (s.includes(뼈)) 후보.push(n);
  }
  return { 확실: [], 후보 };
}

/* ── 자가시험 ────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const T = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  T('🔴 영어 이름의 기준일을 읽는다', 기준일글({ _meta: { builtAt: '2026-09-23' } }) === '2026-09-23');
  T('🔴 한국어 이름의 기준일도 읽는다', 기준일글({ _meta: { 지은때: '2026. 9. 26.' } }) === '2026. 9. 26.');
  T('🔴 meta 라는 이름도 본다', 기준일글({ meta: { asOf: '2026-10-01' } }) === '2026-10-01');
  T('🔴 여덟 자리 수도 기준일로 받는다', 기준일글({ _meta: { priceAsOf: 20261001 } }) === '20261001');
  T('⛔ 없으면 null — 파일 날짜로 바꾸지 않는다',
    기준일글({ _meta: { product: '이름뿐이다' } }) === null && 기준일글({}) === null && 기준일글(null) === null);
  /* ⚠ 처음에 `_meta.asOf` 만 보고 「기준일이 하나도 없다」고 적을 뻔했다 */
  T('🔴 이름 목록에 실제로 쓰이는 넷이 다 있다',
    ['builtAt', '지은때', 'priceAsOf', 'asOf'].every((k) => 기준일이름.includes(k)));

  T('🔴 여덟 자리 날짜를 읽는다', (날짜로('20261001') ?? {}).getMonth?.() === 9);
  T('🔴 빗금·점이 섞인 날짜도 읽는다', (날짜로('2026. 9. 23. 오전 11:06') ?? {}).getMonth?.() === 8);
  T('🔴 하이픈 날짜도 읽는다', (날짜로('2026-09-23') ?? {}).getDate?.() === 23);
  T('⛔ 못 읽으면 null', 날짜로('언젠가') === null && 날짜로('') === null && 날짜로(null) === null);

  const 어제 = new Date(2026, 9, 5);
  T('🔴 며칠 지났는지 센다', 며칠(어제, new Date(2026, 9, 6)) === 1);
  T('⛔ 날짜가 아니면 null — 0 이 아니다', 며칠('어제') === null && 며칠(null) === null);

  const 가짜 = [
    { 이름: 'a', 기준나이: 40, 파일나이: 1 },
    { 이름: 'b', 기준나이: null, 파일나이: 50 },
    { 이름: 'c', 기준나이: 2, 파일나이: 90 },
    { 이름: 'd', 기준나이: null, 파일나이: null },
  ];
  T('🔴 기준일이 있으면 그것으로 센다 — 파일을 다시 써도 내용이 낡을 수 있다',
    (낡은것(가짜) ?? []).some((x) => x.이름 === 'a'));
  T('🔴 기준일이 없으면 파일 날짜로 센다',
    (낡은것(가짜) ?? []).some((x) => x.이름 === 'b'));
  T('⛔ 파일만 낡고 내용이 새것이면 흠이 아니다',
    !(낡은것(가짜) ?? []).some((x) => x.이름 === 'c'));
  T('⛔ 둘 다 못 재면 흠으로 세지 않는다 — 못 쟀다와 낡았다는 다르다',
    !(낡은것(가짜) ?? []).some((x) => x.이름 === 'd'));
  T('⛔ 배열이 아니면 null', 낡은것(null) === null);

  /* 🔴 사이트를 이름으로 가른다 — 남의 자료로 내 배포가 막히지 않게 */
  T('🔴 kcw 자료를 알아본다',
    어느사이트('kcw-alongside.json') === 'kcw' && 어느사이트('wikitip-groups.json') === 'kcw');
  T('🔴 seoulmarkets 자료를 알아본다',
    어느사이트('korea-financials-tape.json') === 'seoulmarkets'
    && 어느사이트('japan-financials-tape.json') === 'seoulmarkets'
    && 어느사이트('kr-listed-company-names.json') === 'seoulmarkets');
  T('🔴 100y 자료를 알아본다', 어느사이트('100y-something.json') === '100y');
  T('⛔ 모르는 것은 null — 짐작으로 붙이지 않는다',
    어느사이트('rankings.json') === null && 어느사이트('') === null && 어느사이트(null) === null);
  T('🔴 한 사이트 것만 골라 낸다', (그사이트낡은것([
    { 이름: 'kcw-a.json', 기준나이: 40 }, { 이름: 'korea-b.json', 기준나이: 40 },
  ], 'kcw') ?? []).length === 1);
  T('⛔ 배열이 아니면 null', 그사이트낡은것(null, 'kcw') === null);
  T('🔴 사이트마다 못 박은 수가 있다',
    ['seoulmarkets', 'kcw', '100y'].every((k) => Number.isInteger(못박은_사이트별[k])));

  const 큰 = 큰것들();
  T('🔴 자료를 큰 것부터 읽어 온다', Array.isArray(큰) && 큰.length > 0);
  T('🔴 큰 차례로 준다', 큰.length < 2 || 큰[0].크기 >= 큰[1].크기);
  T('⛔ 없는 방이면 null', 큰것들('/없는/방') === null);
  T('🔴 큰 자료에 기준일이 실제로 있다 — 못 읽는 자가 아니다',
    큰.some((x) => x.기준일));

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 자료가 낡았나 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ──────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const i = process.argv.indexOf('--몇개');
  const 몇개 = i >= 0 ? (Number(process.argv[i + 1]) || 기본몇개) : 기본몇개;

  const 큰 = 큰것들(자료방, 몇개);
  if (!큰) { console.log('⛔ src/data 를 못 읽었다 — 못 쟀다'); process.exit(1); }

  console.log(`■ 사이트를 떠받치는 자료 ${큰.length}개 — 언제 것인가`);
  console.log(`   ⚠ 기준일이 있으면 그것으로, 없으면 파일 날짜로 센다 (${낡음선}일 넘으면 🔴)\n`);
  let 기준일없음 = 0;
  for (const x of 큰) {
    const 나이 = x.기준나이 ?? x.파일나이;
    const 어디 = x.기준나이 != null ? '기준일' : '파일';
    if (x.기준일 == null) 기준일없음 += 1;
    const 표 = 나이 == null ? '⬜' : (나이 > 낡음선 ? '🔴' : (나이 > 7 ? '⚠' : '✅'));
    console.log(`  ${표} ${x.이름.padEnd(42)} ${String(나이 ?? '못잼').padStart(4)}일(${어디})`
      + `  ${String(x.줄수 ?? '-').padStart(6)}줄`);
  }

  const 낡음 = 낡은것(큰) ?? [];

  /* 🔴 사이트별로 갈라 적는다 — 그래야 「누가 받아야 하나」가 보인다 */
  console.log(`\n■ 사이트별 — ${낡음선}일 넘은 큰 자료`);
  let 막는것 = [];
  for (const [딱지, 못박은] of Object.entries(못박은_사이트별)) {
    const 것 = (그사이트낡은것(큰, 딱지) ?? []);
    const 표 = 것.length > 못박은 ? '🔴' : '✅';
    console.log(`  ${표} ${딱지.padEnd(14)} ${것.length}개 (못 박은 수 ${못박은})`
      + (것.length ? ` — ${것.map((x) => x.이름.replace('.json', '')).join(' · ')}` : ''));
    if (것.length > 못박은) 막는것.push(`${딱지} 의 낡은 자료가 ${못박은} → ${것.length} 로 늘었다`);
    else if (것.length < 못박은) console.log(`     ⭐ ${못박은 - 것.length}개 줄었다 — 못 박은 수를 ${것.length} 로 내려 적으십시오`);
  }
  const 모름 = 낡음.filter((x) => 어느사이트(x.이름) === null);
  if (모름.length) {
    console.log(`  ⬜ 어느 사이트 것인지 모름 ${모름.length}개 — ${모름.map((x) => x.이름).join(' · ')}`);
    console.log('     ⛔ 짐작으로 붙이지 않는다. 막지도 않는다');
  }

  console.log(`\n■ 통틀어 ${낡음선}일 넘은 큰 자료 ${낡음.length}개 (못 박은 수 ${못박은_낡은큰자료})`);
  if (기준일없음) {
    console.log(`  ⬜ 기준일이 안 적힌 자료 ${기준일없음}개 — 파일 날짜로 셌다.`);
    console.log('     ⚠ 파일을 다시 써도 내용은 낡을 수 있다. 이 ⬜ 는 「못 쟀다」이지 「새것이다」가 아니다');
  }
  /* ⛔ 457개 전부를 흠으로 세지 않는다 — 갱신 주기를 자료마다 정하기 전에는 모른다 */
  console.log('  ⚠ src/data 전체(457개) 가운데 한 달 넘은 것이 205개지만, 역사 자료·사전처럼');
  console.log('    갱신할 까닭이 없는 것이 섞여 있다. 주기를 정하기 전에는 «못 쟀다»로 둔다');

  if (막는것.length || 낡음.length > 못박은_낡은큰자료) {
    console.log('\n🔴 **낡은 큰 자료가 늘었다.**');
    for (const x of 낡음) console.log(`   · ${x.이름}  ${x.기준나이 ?? x.파일나이}일`);
    console.log('   ⭐ 그 자료를 받는 자를 돌린다. 「다음에」로 미루면 지면이 옛 수를 말한다');
    process.exit(1);
  }
  /* ⛔ [2026-10-06] 여기가 「✅ 큰 자료가 다 제때 들어와 있다」라고 말하고 있었다.
     낡은 것이 다섯인데 못 박은 수가 다섯이라 통과한 것이지 «제때»가 아니다.
     자가 제 입으로 거짓을 말하면 그 자를 믿을 수 없게 된다. */
  if (낡음.length) {
    console.log(`\n✅ 늘지는 않았다 — 낡은 것 ${낡음.length}개가 못 박은 수와 같다`);
    for (const x of 낡음) console.log(`   · ${x.이름}  ${x.기준나이 ?? x.파일나이}일`);
    console.log('   ⚠ 「제때 들어와 있다」가 아니다. 받으면 못 박은 수를 내려 적는다');
  } else {
    console.log('\n✅ 큰 자료가 다 제때 들어와 있다');
  }
  process.exit(0);
}
