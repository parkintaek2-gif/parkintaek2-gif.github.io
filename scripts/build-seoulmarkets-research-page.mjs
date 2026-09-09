#!/usr/bin/env node
/**
 * build-seoulmarkets-research-page.mjs — 무료 영문 깔때기 지면이 쓸 것만 뽑는다.
 *
 *   node scripts/build-seoulmarkets-research-page.mjs
 *   node scripts/build-seoulmarkets-research-page.mjs --자가시험
 *
 * 왜 — 대장(src/data/korea-markets-research.json)이 794KB 다. 그대로 지면에 넣으면
 *   손님이 794KB 를 내려받는다. 지면이 «보여 주는 것»만 뽑아 따로 낸다.
 *
 * ⚠ 이 지면이 말할 수 있는 것과 못 하는 것을 갈라 둔다 —
 *   ✅ 「이 네 낱말이 제목·초록에 나오는 논문이 몇 편인가」  ← 이것은 셌다
 *   ⛔ 「한국시장을 다룬 논문이 몇 편인가」               ← 이렇게 쓰면 넓게 말하는 것이다
 *   까닭: 구절 검색이라 곁가지로 걸리는 것이 섞인다. 실측 — 「KMPI: measuring knowledge
 *   management performance」(568회 인용)가 들어 있다. 초록에 KOSPI 가 나와서다.
 *   ⇒ 지면 문장을 «낱말이 나오는 논문»으로 적는다. 부풀리지 않는다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 대장길 = 'src/data/korea-markets-research.json';
export const 낼길 = 'src/data/seoulmarkets-research.json';

/**
 * 🔴 한글이 든 줄인가.
 *
 * ⚠ [2026-09-10 검사가 잡았다] OpenAlex 에는 «한국어로 쓴» 논문이 섞여 있다 —
 *   제목이 「한국 수출제조기업의 연구개발…」이고 저널이 「선물연구」·「대한경영학회지」다.
 *   그것을 영문 지면에 그대로 실으면 화면에 한국어가 나간다
 *   (사장님: 「우리 손님은 영어권이다. 화면에 한국어를 안 낸다」).
 *
 * ⛔ 그렇다고 «버리지» 않는다 — 한국시장 연구의 상당 부분이 한국어로 쓰였다는 것 자체가
 *   이 지면이 말해야 하는 사실이다. ⇒ 목록에서 빼고 «세어서» 적는다.
 */
export function 한글있나(...글들) {
  return 글들.some((s) => /[가-힣]/.test(String(s ?? '')));
}

/** 화면에 낼 만한 줄인가 — 제목·해가 있고, 한글이 없어야 한다 */
export function 낼만한가(r) {
  if (!r || !String(r.제목 ?? '').trim() || !Number.isInteger(r.해)) return false;
  if (한글있나(r.제목, r.실은곳, r.저자)) return false;      /* 세는 것은 따로 한다 */
  return true;
}

/** 한국어로 쓴 것이 몇 편인가 — ⛔ 숨기지 않고 센다 */
export function 한국어로쓴것(줄들) {
  return (줄들 ?? []).filter((r) => 한글있나(r?.제목, r?.실은곳, r?.저자)).length;
}

/** 많이 인용된 것 — 인용수가 «없는» 것은 이 목록에 넣지 않는다 (0 으로 안 만든다) */
export function 많이인용된것(줄들, n = 80) {
  return (줄들 ?? [])
    .filter((r) => 낼만한가(r) && Number.isInteger(r.인용))
    .sort((a, b) => b.인용 - a.인용 || a.제목.localeCompare(b.제목))
    .slice(0, n);
}

/** 최신 — 같은 해가 많으니 인용수로 다시 가른다 */
export function 최신것(줄들, n = 40) {
  return (줄들 ?? [])
    .filter(낼만한가)
    .sort((a, b) => b.해 - a.해 || (b.인용 ?? -1) - (a.인용 ?? -1) || a.제목.localeCompare(b.제목))
    .slice(0, n);
}

/**
 * 해별 수를 «막대 하나 칸»으로 — 1976~2026 을 다 내면 읽히지 않는다.
 * ⛔ 없는 해를 0 으로 «채우지» 않는다. 없는 해는 없는 것이다.
 */
export function 최근해별(해별, 몇해 = 16) {
  const 것 = (해별 ?? []).filter((x) => Number.isInteger(x?.해) && Number.isInteger(x?.수));
  return 것.slice(-몇해);
}

/**
 * 🔴 네 물음의 «진짜» 해별 곡선을 더한다 (OpenAlex 가 센 것).
 *
 * ⚠ [2026-09-10 그림을 보고 고친 것] 처음엔 «내 표본»(많이 인용된 200 + 최신 200)으로
 *   해별 막대를 그렸다. 그러면 최근 해가 구조적으로 부풀어 「2026년 252편 — 역대 최대」로
 *   보인다. 재 보니 진짜 곡선은 «평평하거나 줄고» 있었다.
 *   ⛔ 표본 분포를 모집단 분포처럼 내지 않는다. 그것은 거짓 이야기를 만드는 것이다.
 *
 * ⚠ 그리고 이 합계는 «겹침을 포함»한다 — 한 논문이 두 낱말에 걸리면 두 번 세어진다.
 *   지면에 그 사실을 적는다. 겹침을 없앤 수는 이 방법으로는 못 낸다(물음별 집계라서).
 */
export function 진짜해별합(해별진짜) {
  const m = new Map();
  for (const v of Object.values(해별진짜 ?? {})) {
    for (const x of v?.해별 ?? []) {
      if (!Number.isInteger(x?.해) || !Number.isInteger(x?.수)) continue;
      m.set(x.해, (m.get(x.해) ?? 0) + x.수);
    }
  }
  return [...m.entries()].map(([해, 수]) => ({ 해, 수 })).sort((a, b) => a.해 - b.해);
}

/** 정점이 언제였나 — 「늘고 있나」를 말로 하지 않고 수로 낸다 */
export function 정점(해별) {
  const 것 = (해별 ?? []).filter((x) => Number.isInteger(x?.해) && Number.isInteger(x?.수));
  if (!것.length) return null;
  return 것.reduce((m, x) => (x.수 > m.수 ? x : m), 것[0]);
}

/**
 * 실은 곳(저널)별로 센다 — 「어디에 실리나」가 손님이 궁금해하는 것이다.
 * ⛔ 한글 이름(선물연구·대한경영학회지…)은 화면에 안 낸다. 저널 이름도 화면에 나가는 글자다.
 *   ⇒ 여기서 빼고, «몇 가지였나»는 한글저널가지수() 로 따로 센다.
 */
export function 실은곳별(줄들, 최소 = 6) {
  const m = new Map();
  for (const r of 줄들 ?? []) {
    const s = String(r?.실은곳 ?? '').trim();
    if (!s || 한글있나(s)) continue;
    m.set(s, (m.get(s) ?? 0) + 1);
  }
  return [...m.entries()]
    .filter(([, 수]) => 수 >= 최소)
    .map(([이름, 수]) => ({ 이름, 수 }))
    .sort((a, b) => b.수 - a.수 || a.이름.localeCompare(b.이름));
}

/** 한글 이름 저널이 몇 가지였나 — ⛔ 뺐다는 사실을 숨기지 않는다 */
export function 한글저널가지수(줄들) {
  const s = new Set();
  for (const r of 줄들 ?? []) {
    const n = String(r?.실은곳 ?? '').trim();
    if (n && 한글있나(n)) s.add(n);
  }
  return s.size;
}

/** 실은곳을 못 적은 것이 몇 편인가 — ⛔ 0 으로 숨기지 않는다 */
export function 실은곳없음(줄들) {
  return (줄들 ?? []).filter((r) => !String(r?.실은곳 ?? '').trim()).length;
}

/**
 * 🔴 화면에 낼 «영문» 시각.
 *
 * ⚠ [2026-09-10 검사가 잡았다] 내가 `toLocaleString('ko-KR')` 로 만든 시각을 그대로
 *   영문 지면에 실었다 — 「2026. 9. 10. 6시 20분 18초」. 「시」 한 글자가 한국어 누출로 잡혔다.
 *   ⛔ 자료 파일에 적는 글자도 «지면에 실리면» 영문이어야 한다. 오늘 두 번째로 같은 잘못이다
 *     (앞서 시가총액 출처를 한국어로 적어 cap-per-artist 에 나갔다).
 *   ⇒ 지면용 시각은 여기서 «영문으로» 만든다. 우리끼리 보는 로그는 한국어로 둔다.
 */
export function 영문시각(글) {
  const s = String(글 ?? '').trim();
  const m = s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return null;                                   /* ⛔ 못 읽으면 지어내지 않는다 */
  const 달 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'][Number(m[2]) - 1];
  if (!달) return null;
  const 시 = String(Number(m[4])).padStart(2, '0');
  const 분 = String(Number(m[5])).padStart(2, '0');
  return `${Number(m[3])} ${달} ${m[1]}, ${시}:${분} KST`;
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const r = (제목, 해, 인용, 실은곳 = 'J') => ({ 제목, 해, 인용, 실은곳 });

  재다('낼만한가: 제목과 해가 있으면 된다', 낼만한가(r('A', 2020, 1)) === true);
  재다('⛔ 낼만한가: 제목이 비면 안 된다', 낼만한가(r('  ', 2020, 1)) === false);
  재다('⛔ 낼만한가: 해가 없으면 안 된다', 낼만한가(r('A', null, 1)) === false);
  재다('낼만한가: null 도 안 죽는다', 낼만한가(null) === false);

  /* 🔴 한글 — 영문 지면에 한국어를 내지 않는다. 그러나 «세지 않는» 것과는 다르다 */
  재다('한글있나: 제목에 있으면 잡는다', 한글있나('한국 수출제조기업') === true);
  재다('한글있나: 저널 이름에 있어도 잡는다', 한글있나('A paper', '선물연구') === true);
  재다('한글있나: 영문만이면 아니다', 한글있나('A paper', 'Journal of Finance') === false);
  재다('한글있나: null 도 안 죽는다', 한글있나(null, undefined) === false);
  재다('🔴 낼만한가: 한글 제목은 «목록에서» 뺀다',
    낼만한가({ 제목: '한국 수출제조기업의 연구개발', 해: 2020, 인용: 3 }) === false);
  재다('🔴 낼만한가: 한글 «저널»도 뺀다 — 저널 이름도 화면에 나간다',
    낼만한가({ 제목: 'A paper', 실은곳: '대한경영학회지', 해: 2020, 인용: 3 }) === false);
  재다('⛔ 한국어로쓴것: 버리지 않고 «센다»',
    한국어로쓴것([{ 제목: '선물연구 논문' }, { 제목: 'English' }]) === 1);
  재다('한국어로쓴것: null 도 안 죽는다', 한국어로쓴것(null) === 0);

  const 줄 = [r('A', 2020, 5), r('B', 2021, 9), r('C', 2019, null), r('  ', 2022, 99)];
  const 많 = 많이인용된것(줄, 10);
  재다('많이인용: 큰 것이 먼저', 많[0].제목 === 'B');
  재다('⛔ 많이인용: 인용수가 «없는» 것은 안 넣는다 (0 으로 안 만든다)',
    !많.some((x) => x.제목 === 'C'));
  재다('⛔ 많이인용: 제목 없는 것은 안 넣는다', !많.some((x) => x.제목.trim() === ''));
  재다('많이인용: 몇 개만 자른다', 많이인용된것(줄, 1).length === 1);
  재다('많이인용: 빈 것도 안 죽는다', 많이인용된것(null).length === 0);

  const 최 = 최신것(줄, 10);
  재다('최신: 최근 해가 먼저', 최[0].해 === 2021);
  재다('최신: 인용수 없는 것도 «최신»에는 넣는다 (해가 있으니까)', 최.some((x) => x.제목 === 'C'));
  재다('최신: 빈 것도 안 죽는다', 최신것(null).length === 0);
  재다('최신: 같은 해면 인용 많은 쪽이 먼저', (() => {
    const x = 최신것([r('A', 2021, 1), r('B', 2021, 9)], 5);
    return x[0].제목 === 'B';
  })());

  const 해 = 최근해별([{ 해: 2018, 수: 1 }, { 해: 2020, 수: 2 }, { 해: 2021, 수: 3 }], 2);
  재다('최근해별: 뒤에서 몇 해만', 해.length === 2 && 해[0].해 === 2020);
  재다('⛔ 최근해별: 빈 해(2019)를 0 으로 «채우지» 않는다', !해.some((x) => x.해 === 2019));
  재다('최근해별: 망가진 줄을 버린다', 최근해별([{ 해: 'x', 수: 1 }, { 해: 2020, 수: 2 }], 5).length === 1);
  재다('최근해별: null 도 안 죽는다', 최근해별(null).length === 0);

  /* 🔴 진짜 곡선 — 표본으로 모집단 분포를 만들지 않기 위한 자 */
  const 진 = { a: { 이름: 'A', 해별: [{ 해: 2020, 수: 5 }, { 해: 2021, 수: 7 }] },
               b: { 이름: 'B', 해별: [{ 해: 2021, 수: 3 }, { 해: 2022, 수: 1 }] } };
  const 합 = 진짜해별합(진);
  재다('진짜해별합: 해를 모아 더한다', 합.length === 3);
  재다('진짜해별합: 같은 해를 합친다', 합.find((x) => x.해 === 2021).수 === 10);
  재다('진짜해별합: 오래된 해가 먼저', 합[0].해 === 2020);
  재다('진짜해별합: 망가진 줄을 버린다',
    진짜해별합({ a: { 해별: [{ 해: 'x', 수: 1 }, { 해: 2020, 수: 2 }] } }).length === 1);
  재다('진짜해별합: 빈 것·null 도 안 죽는다',
    진짜해별합({}).length === 0 && 진짜해별합(null).length === 0);
  재다('정점: 가장 큰 해를 낸다', 정점(합).해 === 2021);
  재다('⛔ 정점: 빈 것이면 null (0년을 지어내지 않는다)', 정점([]) === null && 정점(null) === null);

  const 곳 = 실은곳별([r('A', 1, 1, 'X'), r('B', 1, 1, 'X'), r('C', 1, 1, 'Y')], 2);
  재다('실은곳별: 최소치 미만을 버린다', 곳.length === 1 && 곳[0].이름 === 'X');
  재다('실은곳별: 빈 이름을 버린다', 실은곳별([r('A', 1, 1, '  ')], 1).length === 0);
  재다('⛔ 실은곳없음: 못 적은 것을 «센다» (숨기지 않는다)',
    실은곳없음([r('A', 1, 1, ''), r('B', 1, 1, 'X')]) === 1);
  재다('실은곳없음: null 도 안 죽는다', 실은곳없음(null) === 0);
  재다('🔴 실은곳별: 한글 저널 이름을 «화면 목록에서» 뺀다',
    실은곳별([r('A', 1, 1, '선물연구'), r('B', 1, 1, '선물연구')], 1).length === 0);
  재다('⛔ 한글저널가지수: 뺐다는 사실을 세어 둔다',
    한글저널가지수([r('A', 1, 1, '선물연구'), r('B', 1, 1, '선물연구'), r('C', 1, 1, 'J')]) === 1);
  재다('한글저널가지수: null 도 안 죽는다', 한글저널가지수(null) === 0);

  /* 🔴 지면에 낼 시각은 영문이어야 한다 — 오늘 「시」 한 글자가 누출로 잡혔다 */
  재다('영문시각: 한국어 시각을 영문으로 옮긴다',
    영문시각('2026. 9. 10. 6시 20분 18초') === '10 September 2026, 06:20 KST');
  재다('🔴 영문시각: 결과에 한글이 없다', !한글있나(영문시각('2026. 9. 10. 6시 20분 18초')));
  재다('영문시각: 두 자리 시각도 맞다',
    영문시각('2026. 12. 31. 23시 5분 1초') === '31 December 2026, 23:05 KST');
  재다('⛔ 영문시각: 못 읽으면 null (지어내지 않는다)',
    영문시각('아무 글자') === null && 영문시각(null) === null);
  재다('⛔ 영문시각: 달이 범위를 벗어나면 null', 영문시각('2026. 13. 1. 1시 1분') === null);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`\n■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

if (!자가시험()) process.exit(1);
if (process.argv.includes('--자가시험')) process.exit(0);

let 대장;
try { 대장 = JSON.parse(fs.readFileSync(path.join(뿌리, 대장길), 'utf8')); }
catch { console.log(`\n🔴 ${대장길} 이 없다 — 먼저 node scripts/collect-korea-markets-research.mjs`); process.exit(1); }

const 줄들 = 대장.줄들 ?? [];
const 낼것 = {
  builtOn: new Date().toLocaleString('ko-KR', { hour12: false }),
  /* ⛔ 지면에 실리는 것은 «영문»만 쓴다. 한국어 판은 우리끼리 보는 칸에 둔다 */
  measuredOn: 영문시각(대장.잰때),
  measuredOnKo: 대장.잰때 ?? null,
  /* ⚠ 문장을 여기서 정해 둔다 — 지면이 부풀려 쓰지 못하게 */
  claim: 'Papers whose title or abstract mentions one of four Korean market terms',
  notAClaim: 'Not "every paper about Korean markets" — phrase search admits papers that only mention the term',
  source: 대장.출처,
  queries: Object.values(대장.물음별 ?? {}).map((q) => ({ name: q.이름, phrase: q.구절, total: q.전체 })),
  indexed: 줄들.length,
  /* 🔴 해별 곡선은 «진짜»(OpenAlex 집계)를 쓴다. 내 표본 분포는 지면에 안 낸다 */
  years: 최근해별(진짜해별합(대장.해별진짜), 17),
  yearsAreCounts: 'OpenAlex counts per phrase, summed. A paper matching two phrases is counted twice — we cannot de-duplicate a grouped count, and we say so rather than implying we did.',
  peak: 정점(진짜해별합(대장.해별진짜)),
  perPhraseYears: Object.values(대장.해별진짜 ?? {}).map((v) => ({
    name: v.이름, total: v.합, recent: 최근해별(v.해별, 11),
  })),
  yearSpan: (대장.표본해별 ?? []).length
    ? { from: 대장.표본해별[0].해, to: 대장.표본해별[대장.표본해별.length - 1].해, distinct: 대장.표본해별.length }
    : null,
  since2020: (대장.표본해별 ?? []).filter((x) => x.해 >= 2020).reduce((s, x) => s + x.수, 0),
  /* ⚠ 표본이 최근으로 치우친 것을 지면이 알고 쓰게 이름과 까닭을 함께 넘긴다 */
  sampleSkew: 대장.표본이왜치우쳤나 ?? null,
  topics: (대장.주제 ?? []).slice(0, 24),
  topicsTotal: (대장.주제 ?? []).length,
  journals: 실은곳별(줄들).slice(0, 20),
  journalsTotal: new Set(줄들.map((r) => r.실은곳).filter(Boolean)).size,
  journalMissing: 실은곳없음(줄들),
  reuse: 대장.본문쓸수있나,
  /* 🔴 한국어로 쓴 것 — 목록에서 빼고 «세어서» 적는다. 버리는 것이 아니다 */
  inKorean: 한국어로쓴것(줄들),
  koreanJournals: 한글저널가지수(줄들),
  mostCited: 많이인용된것(줄들, 80),
  newest: 최신것(줄들, 40),
};
fs.writeFileSync(path.join(뿌리, 낼길), JSON.stringify(낼것, null, 2), 'utf8');

const 크기 = (fs.statSync(path.join(뿌리, 낼길)).size / 1024).toFixed(0);
console.log(`\n✅ 냈다 — ${낼길} (${크기} KB · 대장은 ${(fs.statSync(path.join(뿌리, 대장길)).size / 1024).toFixed(0)} KB)`);
console.log(`   담은 편수 ${낼것.indexed.toLocaleString()} · 화면에 내는 것 ${낼것.mostCited.length + 낼것.newest.length}편`);
console.log(`   주제 ${낼것.topicsTotal}가지(위 ${낼것.topics.length}) · 저널 ${낼것.journalsTotal}가지(위 ${낼것.journals.length}) · 저널 못 적음 ${낼것.journalMissing}`);
console.log(`   본문 쓸 수 있음 ${낼것.reuse?.쓸수있음} · 안 됨 ${낼것.reuse?.안됨} · 못 쟀다 ${낼것.reuse?.못쟀다}`);
console.log(`   🔴 한국어로 쓴 것 ${낼것.inKorean}편 · 한글 이름 저널 ${낼것.koreanJournals}가지`);
console.log('      ⇒ 목록에서 빼고 «세어서» 적는다. 버리는 것이 아니다 — 화면에 한국어를 안 내기 때문이다');
console.log('\n⛔ 지면 문장은 「한국시장을 다룬 논문」이 아니라 「이 네 낱말이 나오는 논문」이다.');
console.log('   구절 검색이라 곁가지가 섞인다 — 실측: 「KMPI: measuring knowledge management performance」가 들어 있다.');
