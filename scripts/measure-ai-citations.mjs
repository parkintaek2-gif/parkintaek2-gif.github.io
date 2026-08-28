#!/usr/bin/env node
/**
 * measure-ai-citations.mjs — **AI 가 우리를 인용해 보낸 사람이 «어느 지면»에 왔나.**
 *
 * ── 🔴 왜 만들었나 ─────────────────────────────────────────────
 * 2026-08-29, 1번이 찾고 2번이 정본으로 확정했다 — 방문자는 Organic Search ·
 * **AI Assistant** · Organic Social 만 센다. 그리고 그 자리에서 놀라운 것이 나왔다 —
 *
 * ```
 *   6번 SeoulMarkets   AI Assistant 4세션 · Organic Search 1세션   ← AI 쪽이 «더 많다»
 *                      그리고 진짜 손님 세션당 732초 (12분 넘게 읽는다)
 *   3번 100yearmap     AI Assistant 15세션
 *   5번 KCW            AI Assistant  2세션
 * ```
 * 2번이 전 유닛에 일렀다 — 「**AI 가 인용하기 좋은 형태**(단정적 사실 문장, 출처 명시,
 * 재현 가능한 수치)를 검색엔진 최적화와 나란히 고려해 주십시오」.
 *
 * ⛔ 그런데 **무엇이 인용되는지 우리는 한 번도 재 본 적이 없다.**
 *    「이렇게 쓰면 인용된다」는 짐작으로 지면을 만들면, 그것이 맞는지 영영 모른다.
 * ⭐ 그래서 이 자는 **AI 채널로 들어온 세션이 «어느 지면에 내려앉았는지»**를 잰다.
 *    그 목록이 곧 「AI 가 실제로 인용한 우리 지면」이다. 짐작이 아니라 실측이다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 세션이 적으면 «적다고 적는다». 3세션으로 「이런 지면이 인용된다」고 말하지 않는다.
 * ⛔ 못 잰 것은 0 이 아니라 「못 잼」이다.
 * ⛔ 「AI 가 좋아한다」 같은 판정을 하지 않는다 — 「이 지면에 이만큼 왔다」까지다.
 *
 * 쓰는 법
 *   node scripts/measure-ai-citations.mjs --잰다
 *   node scripts/measure-ai-citations.mjs --잰다 --날수=90     (창을 넓혀 표본을 키운다)
 *   node scripts/measure-ai-citations.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 유닛, 손님아님, 토큰받기, 무엇이막혔나, 우리속성 } from './ga4-report.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** AI 답변을 타고 온 갈래. ⚠ GA4 가 이름을 바꾸면 여기도 바꾼다 */
export const AI갈래 = ['AI Assistant'];

/**
 * 「이 수로 이야기를 지어도 되나」의 바닥.
 * ⛔ 세션이 이보다 적으면 «지면 하나하나를 말하지 않는다» — 우연과 구별이 안 된다.
 */
export const 이야기바닥 = 10;

export function AI인가(채널) {
  return AI갈래.includes(String(채널 ?? '').trim());
}

/** 어느 유닛의 지면인가 */
export function 유닛찾기(호스트) {
  const h = String(호스트 ?? '');
  return 유닛.find((u) => u.자.test(h))?.이름 ?? `(모름) ${h}`;
}

/**
 * 지면 주소를 «이야기가 되는 꼴»로 다듬는다.
 * ⚠ 물음표 꼬리(`?from=…`)는 뗀다 — 같은 지면이 여러 줄로 갈라지면 수가 흩어진다.
 */
export function 지면다듬기(주소) {
  const s = String(주소 ?? '').split('?')[0].split('#')[0];
  if (!s) return '(모름)';
  return s.length > 1 && s.endsWith('/') ? s.slice(0, -1) : s;
}

/** 표본이 얼마나 되나를 «말로» 적는다. ⛔ 적은 것을 많은 것처럼 말하지 않는다 */
export function 표본말하기(세션) {
  /* ⛔ `Number(null)` 은 0 이다 — 그대로 두면 «못 잰 것»이 「한 명도 안 왔다」로 둔갑한다.
     자가시험이 이것을 잡았다. 우리가 가장 경계하는 자리다. */
  if (세션 === null || 세션 === undefined || 세션 === '') return '못 잼';
  const n = Number(세션);
  if (!Number.isFinite(n) || n < 0) return '못 잼';
  if (n === 0) return '한 명도 안 왔다';
  if (n < 이야기바닥) return `${n}세션 — ⚠ 적다. 지면 하나하나를 말할 수 없다`;
  return `${n}세션`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, ok) => { if (ok) 통 += 1; else 실.push(이름); };

  검('AI Assistant 를 알아본다', AI인가('AI Assistant'));
  검('⛔ Organic Search 는 AI 가 아니다', !AI인가('Organic Search'));
  검('⛔ Direct 도 아니다', !AI인가('Direct'));
  검('⛔ 빈 값도 아니다', !AI인가(null) && !AI인가(''));

  검('물음표 꼬리를 뗀다', 지면다듬기('/a?from=x&at=y') === '/a');
  검('#조각도 뗀다', 지면다듬기('/a#b') === '/a');
  검('끝의 빗금을 뗀다 — 같은 지면이 갈라지면 수가 흩어진다', 지면다듬기('/a/') === '/a');
  검('뿌리는 그대로 둔다', 지면다듬기('/') === '/');
  검('빈 값은 (모름)', 지면다듬기('') === '(모름)' && 지면다듬기(null) === '(모름)');

  검('⭐ 표본이 적으면 «적다고» 적는다', 표본말하기(3).includes('적다'));
  검('⭐ 넉넉하면 그냥 센다', 표본말하기(50) === '50세션');
  검('0 은 「한 명도 안 왔다」', 표본말하기(0) === '한 명도 안 왔다');
  검('⛔ 못 잰 것은 0 이 아니다', 표본말하기(null) === '못 잼' && 표본말하기(-1) === '못 잼');
  검('바닥이 정해져 있다', Number.isFinite(이야기바닥) && 이야기바닥 >= 5);

  /* ⛔ 사람 수를 나눗셈으로 적지 않는다 — 소스에 그 꼴이 없어야 한다 */
  const 내소스 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  검('⛔ 소스에 「나눗셈 뒤 명」이 없다', !/\/\s*날수\s*\)?\s*\.toFixed\([^)]*\)\s*\}명/.test(내소스));
  /**
   * ⛔ 처음 판은 「AI가 좋아」라는 글자가 «있기만» 하면 걸리게 했다. 그런데 이 파일은
   *    「**AI 가 이런 글을 좋아한다»로 읽지 않는다**」라고 «경고»하고 있다 — 그 경고문이
   *    자기 검사에 걸렸다. **부정문을 못 알아보는 검사**였다.
   * ✅ 이제 화면에 나가는 줄(console.log)만 보고, 그중 «부정이 안 붙은» 것만 잡는다.
   */
  검('⭐ 판정하는 말을 «단정으로» 쓰지 않는다', (() => {
    const 나가는줄 = [...내소스.matchAll(/console\.log\(([^\n]*)\)/g)].map((m) => m[1]);
    const 걸린것 = 나가는줄.filter((l) => /좋아한다|선호한다|최적이다|가장 좋다/.test(l)
      && !/않는다|아니다|안 /.test(l));
    return 걸린것.length === 0;
  })());
  검('⭐ 「이 지면에 이만큼 왔다」까지만 말한다고 «적어 둔다»',
    /「이 지면에 이만큼 왔다」까지다/.test(내소스));

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ AI 인용을 재는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (내가실행됐다 && !process.argv.includes('--잰다')) {
  console.log('⛔ 아무것도 안 쟀습니다 — 무엇을 할지 안 알려 주셨습니다.\n');
  console.log('쓰는 법');
  console.log('  node scripts/measure-ai-citations.mjs --잰다');
  console.log('  node scripts/measure-ai-citations.mjs --잰다 --날수=90   창을 넓혀 표본을 키운다');
  console.log('  node scripts/measure-ai-citations.mjs --자가시험\n');
  console.log('⚠ 조용히 끝나면 다음 사람이 「AI 유입이 없구나」로 읽습니다. 그래서 2 로 끝냅니다.');
  process.exit(2);
}

/* ── 실제로 잰다 ──────────────────────────────────────────── */
const 날수 = Number(process.argv.find((a) => a.startsWith('--날수='))?.split('=')[1] ?? 28);
const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ?? 'C:/Users/USER/secrets/search-console-sa.json';
if (!fs.existsSync(키파일)) {
  console.log(`🔴 열쇠 파일이 없다 — **못 쟀다.** ${키파일}`);
  process.exit(0);
}
const 키 = JSON.parse(fs.readFileSync(키파일, 'utf8'));
let 토큰;
try { 토큰 = await 토큰받기(키); } catch (e) {
  console.log(`🔴 토큰을 못 받았다 — **못 쟀다.** ${무엇이막혔나?.(e) ?? String(e).slice(0, 120)}`);
  process.exit(0);
}

const 요약 = await (await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
  { headers: { Authorization: `Bearer ${토큰}` } })).json();
const 속성 = process.argv.find((a) => a.startsWith('--속성='))?.split('=')[1]
  ?? 우리속성(요약.accountSummaries).고른것?.속성
  ?? 우리속성(요약.accountSummaries).전부[0]?.속성;
if (!속성) { console.log('🔴 GA4 속성을 못 골랐다 — **못 쟀다.**'); process.exit(0); }

const r = await (await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${속성}:runReport`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${토큰}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dateRanges: [{ startDate: `${날수}daysAgo`, endDate: 'yesterday' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }, { name: 'hostName' },
      { name: 'landingPagePlusQueryString' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' },
      { name: 'averageSessionDuration' }, { name: 'screenPageViews' }],
    limit: 5000,
  }),
})).json();
if (r.error) { console.log(`🔴 GA4 가 거절했다 — **못 쟀다.** ${JSON.stringify(r.error).slice(0, 200)}`); process.exit(0); }

const 모음 = new Map();
let AI전체 = 0;
for (const x of r.rows ?? []) {
  const 채널 = x.dimensionValues[0].value;
  const 호스트 = x.dimensionValues[1].value;
  if (!AI인가(채널) || 손님아님.test(호스트)) continue;
  const 세션 = Number(x.metricValues[0].value);
  AI전체 += 세션;
  const 유 = 유닛찾기(호스트);
  const 지면 = 지면다듬기(x.dimensionValues[2].value);
  const 열쇠 = `${유}\u0000${지면}`;
  const v = 모음.get(열쇠) ?? { 유닛: 유, 지면, 세션: 0, 사람: 0, 초합: 0, 열림: 0 };
  v.세션 += 세션;
  v.사람 += Number(x.metricValues[1].value);
  v.초합 += Number(x.metricValues[2].value) * 세션;
  v.열림 += Number(x.metricValues[3].value);
  모음.set(열쇠, v);
}

console.log(`■ AI 답변을 타고 온 사람이 «어느 지면»에 왔나 — 최근 ${날수}일\n`);
console.log(`  전체 ${표본말하기(AI전체)}\n`);

if (AI전체 === 0) {
  console.log('  ⛔ AI 채널로 들어온 세션이 없습니다. **0 이지 「못 잼」이 아닙니다** —');
  console.log('     GA4 가 이 창에서 AI Assistant 를 한 줄도 안 냈습니다.');
  console.log(`  ⚠ 창을 넓혀 보십시오 — --날수=90`);
  process.exit(0);
}

const 유닛별 = new Map();
for (const v of 모음.values()) {
  if (!유닛별.has(v.유닛)) 유닛별.set(v.유닛, []);
  유닛별.get(v.유닛).push(v);
}

for (const [유, 줄들] of [...유닛별].sort((a, b) => b[1].reduce((s, x) => s + x.세션, 0)
  - a[1].reduce((s, x) => s + x.세션, 0))) {
  const 합 = 줄들.reduce((s, x) => s + x.세션, 0);
  console.log(`\n── ${유} — ${표본말하기(합)}`);
  for (const v of 줄들.sort((a, b) => b.세션 - a.세션).slice(0, 12)) {
    const 초 = v.세션 > 0 ? (v.초합 / v.세션).toFixed(0) : '못잼';
    const 걸음 = v.세션 > 0 ? (v.열림 / v.세션).toFixed(2) : '못잼';
    console.log(`   ${String(v.세션).padStart(4)}세션 ${String(v.사람).padStart(4)}명`
      + ` ${String(초).padStart(6)}초 걸음 ${걸음}   ${v.지면}`);
  }
}

console.log('\n## 이 표를 읽는 법 — ⛔ 이 네 줄을 빼고 목록만 보내지 않는다');
console.log('   · 이것은 **AI 가 실제로 인용해 사람을 보낸 지면**이다. 짐작이 아니다.');
console.log(`   · ⛔ ${이야기바닥}세션 아래인 자리는 **지면 하나하나를 말하지 않는다** — 우연과 구별이 안 된다.`);
console.log('   · ⛔ 「AI 가 이런 글을 좋아한다」로 읽지 않는다. 「이 지면에 이만큼 왔다」까지다.');
console.log('   · ⚠ GA4 의 AI Assistant 분류 자체가 완전하지 않다 — **아래쪽 어림**이다.');
