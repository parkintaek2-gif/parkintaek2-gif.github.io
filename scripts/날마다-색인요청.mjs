#!/usr/bin/env node
/**
 * 날마다-색인요청.mjs — **하루 한도를 날마다 다 쓴다. 안 쓰면 영영 안 들어간다.**
 *
 * ── 🔴🔴 왜 (2026-10-04 · 5번) ────────────────────────────────────────
 * 사장님: 「**유입량을 지금의 천배, 만배로** 만들어야 우리 비즈니스가 유지되고
 *          목표를 달성할 수 있는 터전이 만들어짐」
 *         「seo, geo, 색인 **대체 내가 그렇게 강조했는데**」
 *
 * 구글에 직접 물어 보니 KLifeMap 지면은 이렇게 답한다 —
 *
 * ```
 * 판정 NEUTRAL · 색인 「발견됨 - 현재 색인이 생성되지 않음」
 * 마지막 수집 — **한 번도 안 왔다**
 * ```
 *
 * ⛔ 주소를 «알고는» 있는데 읽으러 오지를 않는다. 5,791장을 내밀었으니
 *   구글이 그만큼 읽을 까닭이 없는 것이다. 사이트맵만으로는 안 들어간다.
 *
 * ⛔ **색인 요청은 하루 10개 안팎이 한도다.** 2,923장을 손으로 넣는 길은 없다.
 *   그러나 **날마다 쓰면** 한 해에 3,600장이다. 안 쓰면 0장이다.
 *   ⭐ 그래서 「오늘 몫을 썼나」를 자물쇠로 둔다 — 거르면 그날치가 영영 사라진다.
 *
 * ── 무엇을 먼저 넣나 — 차례가 중요하다 ────────────────────────────────
 *   ① 아직 한 번도 안 넣은 지면            (넣은 적 있는 것을 또 넣어도 소용없다)
 *   ② 뼈대(sitemap-core) 가 먼저           (뼈대가 들어가야 나머지가 따라온다)
 *   ③ 그 다음 노출이 난 적 있는 지면        (구글이 이미 관심을 보인 자리)
 *
 * 쓰는 법
 *   node scripts/날마다-색인요청.mjs --오늘몫을썼나     자물쇠가 묻는 것
 *   node scripts/날마다-색인요청.mjs --넣는다          오늘 몫을 넣는다
 *   node scripts/날마다-색인요청.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장 = path.join(뿌리, 'docs/색인요청-대장.tsv');

/**
 * 구글이 하루에 받아 주는 수. 넘으면 「할당량 초과」로 돌아온다.
 *
 * 🔴 [2026-10-05 00:5x · 5번] **한도는 KST 자정에 안 풀린다.**
 *   10-04 에 열 개를 쓰고, KST 로 날이 바뀐 10-05 00:5x 에 다섯 개를 넣었더니
 *   «첫 한 개만» 들어가고 나머지 넷이 그대로 「할당량 초과」로 돌아왔다.
 *   ⇒ 구글 쪽 날 바뀜은 우리 자정과 다르다(태평양시로 보인다).
 *   ⛔ 자정 직후에 몰아 넣지 않는다 — 헛걸음이고 대장에 「한도」만 쌓인다.
 *   ⭐ 넣기 좋은 때는 **우리 낮 시간**이다. 그때는 구글 쪽도 날이 바뀌어 있다.
 */
export const 하루몫 = 10;

/** ⛔ toISOString 금지 — 이 PC 는 이미 KST 다 */
export function 오늘(때 = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${때.getFullYear()}-${p(때.getMonth() + 1)}-${p(때.getDate())}`;
}

/** 대장을 읽는다. ⛔ 없으면 빈 것이지 흠이 아니다 */
export function 대장읽기(글) {
  const s = String(글 ?? '');
  const 줄들 = s.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  return 줄들.map((l) => {
    const [날, 주소, 결과] = l.split('\t');
    return { 날, 주소, 결과: 결과 ?? '' };
  }).filter((x) => x.날 && x.주소);
}

/** 오늘 넣은 수 */
export function 오늘넣은수(줄들, 그날 = 오늘()) {
  if (!Array.isArray(줄들)) return null;
  return 줄들.filter((x) => x.날 === 그날 && x.결과 === '됨').length;
}

/**
 * 오늘 몫을 썼나 — 자물쇠가 묻는 것.
 * 🔴 [2026-10-04] 처음에 «성공한 수»만 보고 「몫이 남았다」고 했는데 틀렸다 —
 *   구글이 **「일일 할당량 초과」**라고 돌려보낸 날은 더 넣을 수가 없다.
 *   한도는 계정마다·그날마다 다르고 우리가 정하는 수가 아니다.
 *   ⛔ 넣을 수 없는 것을 「안 썼다」로 읽으면 자물쇠가 매일 거짓으로 막는다.
 *     거짓으로 막는 자물쇠는 결국 꺼진다 — 그러면 자물쇠가 없는 것과 같다.
 */
export function 오늘몫을썼나(줄들, 그날 = 오늘(), 몫 = 하루몫) {
  const n = 오늘넣은수(줄들, 그날);
  if (n === null) return null;
  if (n >= 몫) return true;
  /* 구글이 한도라고 답한 날이면 더 넣을 길이 없다 — 오늘 몫은 끝난 것이다 */
  return 줄들.some((x) => x.날 === 그날 && x.결과 === '한도');
}

/**
 * 🔴🔴 [2026-10-06 16:4x · 5번] **「무엇을 먼저 넣나」를 못 박는 자리가 없었다.**
 *
 * 차례가 사이트맵에 적힌 순서 그대로였다. 그런데 하루 몫이 열 개뿐이다 —
 * 무엇을 «먼저» 넣느냐가 그 열 개의 값을 정한다.
 *
 * 오늘 klifemap 색인이 왜 안 되는지를 찾았다 — 글 2,891장이 3홉(쪽 넘김 58쪽) 뒤에 있어
 * 구글이 오지 않는다. 그래서 `/all`(글 전체 목록) 한 장을 냈다.
 * **그 한 장이 2,891장으로 가는 길을 한꺼번에 연다.** 그러니 그것이 맨 먼저 읽혀야 한다.
 *
 * ⛔ 사람이 기억해서 손으로 먼저 넣는 구조를 만들지 않는다 — 오늘 그 병으로 여러 번 겪었다.
 * ⚠ 이 목록은 «길을 여는 장»만 담는다. 낱낱의 글을 여기 넣지 않는다 — 그러면 차례의 뜻이 없다.
 */
export const 맨앞에 = [
  'https://klifemap.ai/all',
  'https://klifemap.ai/all?lang=en',
  'https://klifemap.ai/all?lang=ja',
  'https://klifemap.ai/all?lang=zh',
];

/**
 * 🔴🔴 [2026-10-06 19:54 · 5번] **「고친 지면을 다시 긁어 달라」고 말할 길이 없었다.**
 *
 * 이 자는 `아직안넣은것()` 으로 «한 번도 성공한 적 없는» 주소만 고른다.
 * 그 규칙이 맞다 — 같은 주소를 날마다 다시 넣으면 하루 열 개가 헛돈다.
 *
 * ⚠ 그런데 오늘 그 규칙이 걸림돌이 됐다. `/companies` 와 `/japan/companies` 는
 *   이미 색인된 «오래된» 지면인데, 오늘 그 두 장에 **회사 낱장 6,196개로 가는 링크**를 넣었다.
 *   구글이 그 두 장을 다시 긁어야 6,196장으로 가는 길을 «본다».
 *   그런데 이 자는 「이미 넣었다」며 영영 안 넣는다. 다음 정기 크롤을 기다릴 수밖에 없다.
 *
 * ⇒ **다시 긁어 달라고 말하는 자리**를 둔다. 다만 세 가지를 못박는다 —
 *   ⛔ 저절로 들어가지 않는다. 사람이 이 목록에 «적어야» 들어간다.
 *   ⛔ 하루 몫을 다 먹지 않는다 — 최대 셋까지만. 나머지 일곱은 새 지면 몫이다.
 *   ⛔ 넣고 나면 **그 줄을 지운다.** 안 지우면 날마다 같은 것을 다시 넣는다.
 *     (대장에는 「다시」로 남으니 증거는 남는다)
 */
export const 다시긁을것 = [
  /* 2026-10-06 — 이 두 장에 회사 낱장 6,196개 링크를 넣었다. 다시 긁혀야 길이 보인다 */
  'https://seoulmarkets.com/companies',
  'https://seoulmarkets.com/japan/companies',
];

/** 다시 긁을 것 가운데 오늘 아직 안 넣은 것. ⛔ 셋을 넘지 않는다 */
export function 다시긁기(줄들, 오늘날, 목록 = 다시긁을것, 최대 = 3) {
  if (!Array.isArray(목록)) return [];
  const 오늘넣은 = new Set((줄들 ?? []).filter((x) => x.날 === 오늘날).map((x) => x.주소));
  return 목록.filter((u) => !오늘넣은.has(u)).slice(0, 최대);
}

/**
 * 맨 앞에 넣을 것을 앞으로 당긴다.
 * ⛔ 이미 «성공»으로 넣은 것은 당기지 않는다 — 또 넣어도 소용없다.
 * ⛔ 사이트맵에 없는 주소를 지어내지 않는다. 당기기만 한다.
 */
export function 줄세우기(모두, 앞줄 = 맨앞에) {
  if (!Array.isArray(모두)) return null;
  const 앞 = []; const 뒤 = [];
  const 앞집합 = new Set(앞줄 ?? []);
  for (const u of 모두) (앞집합.has(u) ? 앞 : 뒤).push(u);
  /* 앞줄에 적은 차례 그대로 세운다 — 사이트맵 차례가 아니라 «우리가 정한» 차례다 */
  앞.sort((a, b) => (앞줄 ?? []).indexOf(a) - (앞줄 ?? []).indexOf(b));
  return [...앞, ...뒤];
}

/** 아직 한 번도 «성공»한 적 없는 주소만 고른다 */
export function 아직안넣은것(모두, 줄들) {
  if (!Array.isArray(모두)) return null;
  const 넣은것 = new Set((줄들 ?? []).filter((x) => x.결과 === '됨').map((x) => x.주소));
  return 모두.filter((u) => !넣은것.has(u));
}

/** 자가 찍은 글에서 그 주소가 들어갔는지 가린다 */
export function 넣어졌나(글) {
  const s = String(글 ?? '');
  if (!s.trim()) return null;
  if (s.includes('할당량 초과') || s.includes('일일 할당량')) return '한도';
  if (s.includes('색인 생성 요청됨') || s.includes('크롤링 대기열')) return '됨';
  if (s.includes('단추를 못 찾았다')) return '못찾음';
  return null;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const T = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  T('⛔ 오늘 날짜에 toISOString 을 안 쓴다',
    /^\d{4}-\d{2}-\d{2}$/.test(오늘(new Date(2026, 9, 4))) && 오늘(new Date(2026, 9, 4)) === '2026-10-04');

  const 줄 = 대장읽기('2026-10-04\thttps://a/1\t됨\n2026-10-04\thttps://a/2\t한도\n# 주석\n\n2026-10-03\thttps://a/3\t됨');
  T('🔴 대장을 읽는다', 줄.length === 3);
  T('⛔ 주석과 빈 줄은 건너뛴다', !줄.some((x) => String(x.날).startsWith('#')));
  T('⛔ 빈 글에도 안 터진다', 대장읽기('').length === 0 && 대장읽기(null).length === 0);

  T('🔴 오늘 «성공»한 것만 센다', 오늘넣은수(줄, '2026-10-04') === 1);
  T('다른 날은 안 센다', 오늘넣은수(줄, '2026-10-03') === 1);
  T('⛔ 배열이 아니면 null — 0 이 아니다', 오늘넣은수(null) === null);

  T('🔴 몫을 다 썼으면 참', 오늘몫을썼나(줄, '2026-10-04', 1) === true);
  /* 🔴 [2026-10-04] 구글이 「한도」라고 답한 날은 더 넣을 길이 없다 —
     그것을 「안 썼다」로 읽으면 자물쇠가 날마다 거짓으로 막는다. */
  T('🔴 구글이 한도라 하면 오늘 몫은 끝난 것이다',
    오늘몫을썼나(줄, '2026-10-04', 10) === true);
  T('한도 줄이 없고 덜 썼으면 거짓',
    오늘몫을썼나(대장읽기('2026-10-04\thttps://a/1\t됨'), '2026-10-04', 10) === false);
  T('⛔ 못 재면 null', 오늘몫을썼나(null) === null);

  /* 🔴 [2026-10-06 · 5번] 길을 여는 장을 먼저 넣는가 */
  T('⭐ 맨 앞에 적은 것을 앞으로 당긴다',
    줄세우기(['https://a/1', 'https://klifemap.ai/all', 'https://a/2'])[0] === 'https://klifemap.ai/all');
  T('앞줄에 적은 «차례 그대로» 세운다 — 사이트맵 차례가 아니다',
    줄세우기(['https://klifemap.ai/all?lang=en', 'https://klifemap.ai/all'])[0] === 'https://klifemap.ai/all');
  T('⛔ 나머지 차례는 흐트러뜨리지 않는다',
    줄세우기(['https://a/1', 'https://a/2', 'https://a/3']).join() === 'https://a/1,https://a/2,https://a/3');
  T('⛔ 사이트맵에 없는 주소를 지어내지 않는다 — 당기기만 한다',
    줄세우기(['https://a/1']).length === 1);
  T('⛔ 배열이 아니면 null — 빈 배열이 아니다', 줄세우기(null) === null);

  /* 🔴 [2026-10-06 · 5번] 「고친 지면을 다시 긁어 달라」 — 하루 몫을 다 먹으면 안 된다 */
  {
    const 다섯 = ['https://a/1', 'https://a/2', 'https://a/3', 'https://a/4', 'https://a/5'];
    T('⭐ 고친 지면을 다시 긁어 달라고 넣는다 — 이미 넣었어도',
      다시긁기([], '2026-10-06', ['https://a/1']).join() === 'https://a/1');
    T('⛔ 하루 몫을 다 먹지 않는다 — 셋까지만. 나머지는 새 지면 몫이다',
      다시긁기([], '2026-10-06', 다섯).length === 3);
    T('⛔ «오늘» 이미 넣은 것은 또 안 넣는다 — 같은 날 두 번은 헛돈다',
      다시긁기([{ 날: '2026-10-06', 주소: 'https://a/1', 결과: '됨' }], '2026-10-06', ['https://a/1']).length === 0);
    T('⭐ 어제 넣은 것은 오늘 다시 넣는다 — 「다시 긁어 달라」는 날마다 하는 말이다',
      다시긁기([{ 날: '2026-10-05', 주소: 'https://a/1', 결과: '됨' }], '2026-10-06', ['https://a/1']).length === 1);
    T('⛔ 목록이 배열이 아니면 빈 것 — 안 터진다', 다시긁기([], '2026-10-06', null).length === 0);
    T('⛔ 목록이 비면 아무것도 안 넣는다 — 기본값을 몰래 쓰지 않는다',
      다시긁기([], '2026-10-06', []).length === 0);
  }

  T('🔴 이미 넣은 것은 빼고 고른다',
    아직안넣은것(['https://a/1', 'https://a/9'], 줄).join() === 'https://a/9');
  T('⛔ 한도로 실패한 것은 «다시» 넣는다',
    아직안넣은것(['https://a/2'], 줄).length === 1);
  T('⛔ 배열이 아니면 null', 아직안넣은것(null, 줄) === null);

  T('🔴 들어간 글을 알아본다', 넣어졌나('색인 생성 요청 / 색인 생성 요청됨') === '됨');
  T('🔴 한도를 알아본다', 넣어졌나('색인 생성 요청 / 할당량 초과') === '한도');
  T('단추를 못 찾은 것도 가린다', 넣어졌나('⬜ 「색인 생성 요청」 단추를 못 찾았다') === '못찾음');
  T('⛔ 모르면 null — 「됨」으로 적지 않는다', 넣어졌나('아무 글') === null && 넣어졌나('') === null);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 날마다 색인요청 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--selftest') || 인자.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }

  let 글 = '';
  try { 글 = fs.readFileSync(대장, 'utf8'); } catch { 글 = ''; }
  const 줄들 = 대장읽기(글);
  const 썼나 = 오늘몫을썼나(줄들);
  const 넣은수 = 오늘넣은수(줄들);

  if (인자.includes('--오늘몫을썼나')) {
    console.log(`■ 오늘(${오늘()}) 넣은 색인 요청 ${넣은수}개 / 하루 몫 ${하루몫}개`);
    if (썼나) { console.log('✅ 오늘 몫을 다 썼다'); process.exit(0); }
    console.log('🔴 **오늘 몫이 남았다 — 안 쓰면 그날치가 영영 사라진다.**');
    console.log('   node scripts/날마다-색인요청.mjs --넣는다');
    process.exit(1);
  }

  if (!인자.includes('--넣는다')) {
    console.log('⛔ --오늘몫을썼나 나 --넣는다 를 준다');
    process.exit(1);
  }

  if (썼나) { console.log(`✅ 오늘(${오늘()}) 몫 ${하루몫}개를 이미 다 썼다 — 내일 다시`); process.exit(0); }

  /* 넣을 차례를 정한다 — 뼈대 먼저, 그 다음 나머지 */
  const 사이트맵 = 인자.find((a) => a.startsWith('http')) ?? 'https://klifemap.ai/sitemap-core.xml';
  const { execFileSync } = await import('node:child_process');
  let xml = '';
  try { xml = execFileSync('curl', ['-sS', '--max-time', '20', 사이트맵], { encoding: 'utf8' }); }
  catch { console.log('⛔ 사이트맵을 못 받았다 — 못 쟀다. 넣지 않는다'); process.exit(1); }
  const 모두 = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!모두.length) { console.log('⛔ 사이트맵이 비었다 — 넣지 않는다'); process.exit(1); }

  /* ⭐ 길을 여는 장을 먼저 넣는다 — 하루 몫이 열 개뿐이라 차례가 곧 값이다 */
  const 남은것 = 줄세우기(아직안넣은것(모두, 줄들) ?? []) ?? [];
  const 앞선것 = 남은것.filter((u) => 맨앞에.includes(u));
  if (앞선것.length) console.log(`⭐ 길을 여는 장 ${앞선것.length}개를 앞으로 당겼다 — ${앞선것[0]}`);

  /* ⭐ 고쳐 놓은 지면을 「다시 긁어 달라」고 먼저 말한다 — 위 다시긁을것[] 참고.
     ⛔ 사이트맵 밖의 주소는 안 넣는다. 지어낸 주소로 요청하면 그날 몫만 버린다 */
  /* 🔴 [2026-10-06 19:56 · 5번] 처음엔 「이 사이트맵에 있는 것만」으로 막았다. 재 보니 못 쓸 자였다 —
     seoulmarkets 사이트맵은 «묶음»이라 `/companies` 는 sitemap-companies.xml 에,
     `/japan/companies` 는 sitemap-japan.xml 에 따로 들어 있다. 한 파일만 보면 둘 다 영영 안 들어간다.
     ⇒ 사이트맵에 없으면 **라이브를 두드려 본다.** 200 이면 넣는다.
     ⛔ 「없으니 그냥 넣는다」가 아니다 — 지어낸 주소로 그날 몫을 버리지 않으려고 «재서» 넣는다.
     ⛔ 못 두드려 봤으면 안 넣는다. 「아마 있을 것이다」로 넣지 않는다. */
  const 사이트맵에있나 = new Set(모두);
  const 다시후보 = 다시긁기(줄들, 오늘());
  const 다시 = [];
  for (const u of 다시후보) {
    if (사이트맵에있나.has(u)) { 다시.push(u); continue; }
    /* ⛔ curl 의 `-o /dev/null` 을 쓰지 않는다 — 이 PC 는 윈도다. fetch 가 탈이 없다 */
    let 상태 = null;
    try {
      const r = await fetch(u, { method: 'HEAD', redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IndexRecrawlCheck/1.0)' },
        signal: AbortSignal.timeout(15000) });
      상태 = r.status;
    } catch { 상태 = null; }
    if (상태 === 200) { 다시.push(u); console.log(`  ♻ 사이트맵엔 없지만 라이브가 200 이다 — 넣는다: ${u}`); }
    else console.log(`  ⬜ 다시 긁기 건너뜀 — 라이브가 ${상태 ?? '못 두드려 봤다'}: ${u}`);
  }
  if (다시.length) console.log(`♻ 고친 지면 ${다시.length}장을 «다시» 긁어 달라고 넣는다 — ${다시[0]}`);

  const 몫 = 하루몫 - (넣은수 ?? 0);
  /* 다시 긁을 것을 맨 앞에 두되, 새 지면 몫을 통째로 먹지 않게 위에서 이미 셋으로 잘랐다 */
  const 이번에 = [...다시, ...남은것.filter((u) => !다시.includes(u))].slice(0, 몫);
  if (!이번에.length) {
    console.log(`✅ ${사이트맵} 의 ${모두.length}장은 다 넣었다 — 다른 사이트맵을 주십시오`);
    process.exit(0);
  }

  console.log(`■ 오늘 몫 ${이번에.length}개를 넣는다 (사이트맵 ${모두.length}장 중 아직 ${남은것.length}장 남음)`);
  const 적을것 = [];
  for (const u of 이번에) {
    let 낸글 = '';
    try { 낸글 = execFileSync('node', [path.join(뿌리, 'scripts/구글-색인요청.mjs'), u], { encoding: 'utf8', cwd: 뿌리 }); }
    catch (e) { 낸글 = String(e.stdout ?? '') + String(e.stderr ?? ''); }
    const 결 = 넣어졌나(낸글);
    console.log(`  ${결 === '됨' ? '✅' : 결 === '한도' ? '🔴' : '⬜'} ${결 ?? '모름'}  ${u.replace(/^https?:\/\/[^/]+/, '')}`);
    적을것.push(`${오늘()}\t${u}\t${결 ?? '모름'}`);
    if (결 === '한도') { console.log('   🔴 하루 한도에 닿았다 — 오늘은 여기까지. 내일 이어서'); break; }
  }

  if (!fs.existsSync(대장)) {
    fs.writeFileSync(대장, '# 색인 요청 대장 — 날\t주소\t결과(됨·한도·못찾음·모름)\n', 'utf8');
  }
  fs.appendFileSync(대장, 적을것.join('\n') + '\n', 'utf8');
  console.log(`\n   ✔ 대장에 적었다 — docs/색인요청-대장.tsv`);
  console.log('   ⭐ 줄이 없으면 「넣었다」고 말할 수 없다. 대장이 곧 증거다.');
}
