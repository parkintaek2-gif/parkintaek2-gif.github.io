#!/usr/bin/env node
/**
 * check-seoulmarkets-얇은지면.mjs — **애드센스가 「가치가 별로 없는 콘텐츠」라고 한 까닭을 잰다.**
 *
 * ── 🔴 왜 (2026-09-30 · 5번) ─────────────────────────────────────────
 * 애드센스가 **seoulmarkets.com 을 막았다** — 「주의 필요 · 가치가 별로 없는 콘텐츠」(09-30 06:03).
 * 구글이 다시 제출하기 전에 확인하라고 한 것 셋 —
 *   ① 신뢰할 수 있는 고품질 정보·도구·서비스를 제공하는가
 *   ② 지속적인 콘텐츠 큐레이션과 구조적 유지관리가 이루어지는가
 *   ③ 실제적인 사용자 관심을 «유도하고 유지»하는가
 *
 * 2026-09-23 에 100yearmap.com·klifemap.ai 가 **똑같은 사유**로 막혔고, 그때 잰 까닭은
 * 「우리가 찍어 낸 얇은 지면」이었다. seoulmarkets 는 사이트맵 7,934장 가운데
 * **7,513장(95%)이 회사 낱장**이다 — 같은 병일 수 있다. 짐작하지 말고 «잰다».
 *
 * ── 무엇을 얇다고 하나 ───────────────────────────────────────────────
 * ⛔ 바이트로 재지 않는다 — 머리·꼬리·표 뼈대가 장마다 같아서 «빈 지면도 무겁다».
 * ⭐ **그 지면에만 있는 글자**를 잰다. 표본끼리 맞대어 «모든 장에 똑같이 나오는 줄»을 뺀다.
 * ⛔ 문턱을 손으로 고르지 않는다 — 구글이 이미 받아들인 갈래(기사·데이터 지면)의
 *   가장 얇은 것을 문턱으로 삼는다. 그 정도면 구글이 받아들인다는 뜻이다.
 *
 * 쓰는 법
 *   node scripts/check-seoulmarkets-얇은지면.mjs              표본으로 잰다
 *   node scripts/check-seoulmarkets-얇은지면.mjs --표본 40     표본 수를 바꾼다
 *   node scripts/check-seoulmarkets-얇은지면.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 사이트 = 'https://seoulmarkets.com';

/** 화면에 보이는 글자만 남긴다. ⛔ 붙은 낱말이 생기지 않게 빈칸으로 바꾼다 */
export function 본문(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 여러 장에서 «모든 장에 똑같이 나오는 조각»을 찾아 낸다 — 그것이 뼈대다.
 * 조각은 열 글자 넘는 마디로 가른다. 뼈대를 뺀 나머지가 «그 지면만의 글»이다.
 */
export function 뼈대찾기(글들, 몇장이면뼈대 = null) {
  const 것 = (글들 ?? []).filter((x) => typeof x === 'string' && x);
  if (것.length < 2) return new Set();
  const 문턱 = 몇장이면뼈대 ?? Math.ceil(것.length * 0.9);
  const 센다 = new Map();
  for (const 글 of 것) {
    const 본것 = new Set(마디로(글));
    for (const m of 본것) 센다.set(m, (센다.get(m) ?? 0) + 1);
  }
  const 뼈 = new Set();
  for (const [m, n] of 센다) if (n >= 문턱) 뼈.add(m);
  return 뼈;
}

/** 글을 마디로 가른다 — 문장부호와 여러 빈칸에서 끊는다 */
export function 마디로(글) {
  return String(글 ?? '')
    .split(/(?<=[.!?。])\s+|\s{2,}|\|/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 10);
}

/** 뼈대를 뺀 «그 지면만의 글자 수» */
export function 저만의글자(글, 뼈대) {
  const 남은것 = 마디로(글).filter((m) => !뼈대.has(m));
  return 남은것.join(' ').length;
}

/**
 * 판정 — ⛔ 「몇 장이 얇다」만 세지 않는다. «전체에서 얇은 것이 몇 할인가»가 애드센스가 보는 것이다.
 * 2026-09-23 실측에서 40%를 넘으면 구글이 얇게 본다고 적었다. 그 선을 그대로 쓴다.
 */
export const 겹침문턱 = 0.4;

export function 판정한다({ 잰장수, 얇은장수, 문턱글자 } = {}) {
  if (!잰장수) return { 판정: '못 쟀다', 비율: null, 까닭: ['⬜ 한 장도 못 받았다'] };
  const 비율 = 얇은장수 / 잰장수;
  const 까닭 = [];
  if (비율 >= 겹침문턱) 까닭.push(`🔴 표본의 ${Math.round(비율 * 100)}% 가 얇다 (문턱 ${문턱글자}자)`);
  return { 판정: 비율 >= 겹침문턱 ? '얇다' : '괜찮다', 비율, 까닭 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참, 덧 = '') => 것.push({ 이름, 참: !!참, 덧 });

  본다('script 안은 본문이 아니다', !본문('<script>var a=1</script><p>글</p>').includes('var'));
  본다('style 안도 본문이 아니다', !본문('<style>.a{color:red}</style><p>글</p>').includes('color'));
  본다('주석도 본문이 아니다', !본문('<!-- 숨긴말 --><p>글</p>').includes('숨긴말'));
  본다('🔴 태그가 붙어도 낱말이 안 붙는다', 본문('<b>가나</b><b>다라</b>') === '가나 다라');
  본다('⛔ 빈 것에 안 터진다', 본문(null) === '' && 본문(undefined) === '');

  본다('열 글자 미만은 마디가 아니다', 마디로('짧다.').length === 0);
  본다('문장부호에서 가른다', 마디로('열 글자가 넘는 첫 문장이다. 열 글자가 넘는 둘째 문장이다.').length === 2);

  const 세장 = [
    '모든 장에 똑같이 나오는 머리글입니다. 삼성전자만의 고유한 내용입니다.',
    '모든 장에 똑같이 나오는 머리글입니다. 현대차만의 고유한 내용입니다.',
    '모든 장에 똑같이 나오는 머리글입니다. 네이버만의 고유한 내용입니다.',
  ];
  const 뼈 = 뼈대찾기(세장);
  본다('🔴 모든 장에 나오는 줄을 뼈대로 잡는다', 뼈.has('모든 장에 똑같이 나오는 머리글입니다.'));
  본다('🔴 그 장만의 줄은 뼈대가 «아니다»', !뼈.has('삼성전자만의 고유한 내용입니다.'));
  본다('뼈대를 빼면 그 장만의 글자만 남는다',
    저만의글자(세장[0], 뼈) === '삼성전자만의 고유한 내용입니다.'.length);
  본다('⛔ 한 장뿐이면 뼈대를 못 고른다', 뼈대찾기([세장[0]]).size === 0);
  본다('⛔ 빈 것에 안 터진다', 뼈대찾기(null).size === 0 && 저만의글자(null, new Set()) === 0);

  본다('🔴 표본의 절반이 얇으면 «얇다»',
    판정한다({ 잰장수: 10, 얇은장수: 5, 문턱글자: 300 }).판정 === '얇다');
  본다('한 장만 얇으면 괜찮다',
    판정한다({ 잰장수: 10, 얇은장수: 1, 문턱글자: 300 }).판정 === '괜찮다');
  본다('⬜ 한 장도 못 받았으면 «괜찮다»고 하지 않는다',
    판정한다({ 잰장수: 0, 얇은장수: 0 }).판정 === '못 쟀다');
  본다('문턱은 40%다', 겹침문턱 === 0.4);

  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ check-seoulmarkets-얇은지면 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}${x.덧 ? `  (${x.덧})` : ''}`);
  return 빨강.length === 0;
}

/* ── 잰다 ─────────────────────────────────────────────────────────── */
async function 주소받기(사이트맵) {
  const r = await fetch(사이트맵, { signal: AbortSignal.timeout(60000) }).catch(() => null);
  if (!r || !r.ok) return [];
  const 글 = await r.text();
  return [...글.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/** 고르게 뽑는다 — 앞쪽만 뽑으면 한 갈래만 본다 */
export function 고르게뽑기(다, 몇개) {
  const 것 = 다 ?? [];
  if (것.length <= 몇개) return [...것];
  const 걸음 = 것.length / 몇개;
  return Array.from({ length: 몇개 }, (_, i) => 것[Math.floor(i * 걸음)]);
}

async function 잰다() {
  const 표본수 = Number(인자('표본') ?? 24);
  const 갈래 = [
    ['회사(한국)', 사이트 + '/sitemap-companies.xml'],
    ['회사(일본)', 사이트 + '/sitemap-japan.xml'],
    ['회사(대만)', 사이트 + '/sitemap-taiwan.xml'],
    ['회사(UAE)', 사이트 + '/sitemap-uae.xml'],
    ['데이터·기사', 사이트 + '/sitemap-pages.xml'],
  ];

  console.log('■ seoulmarkets.com 얇은 지면 — ' + new Date().toLocaleString('ko-KR'));
  console.log('   ⭐ 재는 것은 바이트가 아니라 «그 지면에만 있는 글자»다\n');

  const 결과 = [];
  for (const [이름, 맵] of 갈래) {
    const 다 = await 주소받기(맵);
    if (!다.length) { console.log(`   ${이름.padEnd(12)} ⬜ 사이트맵을 못 받았다`); continue; }
    const 뽑은것 = 고르게뽑기(다, 표본수);
    const 글들 = [];
    for (const u of 뽑은것) {
      const r = await fetch(u, { signal: AbortSignal.timeout(45000) }).catch(() => null);
      글들.push(r && r.ok ? 본문(await r.text()) : null);
    }
    const 받은것 = 글들.filter(Boolean);
    const 뼈 = 뼈대찾기(받은것);
    const 저만 = 받은것.map((g) => 저만의글자(g, 뼈));
    저만.sort((a, z) => a - z);
    const 가운데 = 저만.length ? 저만[Math.floor(저만.length / 2)] : 0;
    결과.push({ 이름, 전체: 다.length, 잰것: 받은것.length, 저만, 가운데, 뼈: 뼈.size });
    console.log(`   ${이름.padEnd(12)} 전체 ${String(다.length).padStart(5)}장 · 잰 것 ${받은것.length}장`
      + ` · 그 지면만의 글자 가운데값 ${가운데}자 (가장 얇은 것 ${저만[0] ?? 0}자)`);
  }

  /* 문턱 — 구글이 이미 받아들인 갈래(데이터·기사)의 가장 얇은 것 */
  const 기준 = 결과.find((x) => x.이름 === '데이터·기사');
  const 문턱 = 기준 && 기준.저만.length ? 기준.저만[0] : 300;
  console.log(`\n   문턱 ${문턱}자 — 데이터·기사 지면의 «가장 얇은» 것. 구글이 이미 받아들인 수준이다\n`);

  let 전체얇은장 = 0; let 전체장 = 0;
  for (const x of 결과) {
    const 얇은수 = x.저만.filter((n) => n < 문턱).length;
    const 비율 = x.잰것 ? 얇은수 / x.잰것 : 0;
    전체얇은장 += Math.round(비율 * x.전체);
    전체장 += x.전체;
    const 표 = 판정한다({ 잰장수: x.잰것, 얇은장수: 얇은수, 문턱글자: 문턱 });
    console.log(`   ${표.판정 === '얇다' ? '🔴' : '✅'} ${x.이름.padEnd(12)}`
      + ` 표본 ${얇은수}/${x.잰것} 얇다 (${Math.round(비율 * 100)}%)`
      + ` ⇒ 전체 ${x.전체}장 가운데 약 ${Math.round(비율 * x.전체)}장`);
  }

  console.log(`\n   ▣ 사이트 전체 ${전체장}장 가운데 «얇은 것» 약 ${전체얇은장}장`
    + ` (${전체장 ? Math.round(전체얇은장 / 전체장 * 100) : 0}%)`);
  if (전체장 && 전체얇은장 / 전체장 >= 겹침문턱) {
    console.log('   🔴 애드센스가 「가치가 별로 없는 콘텐츠」라고 할 만하다 — 검색에서 빼거나 내용을 채운다');
  }
  return 전체얇은장 / (전체장 || 1) < 겹침문턱 ? 0 : 1;
}

export function 인자(이름, argv = process.argv) {
  const i = argv.indexOf(`--${이름}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}

const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  process.exit(await 잰다());
}
