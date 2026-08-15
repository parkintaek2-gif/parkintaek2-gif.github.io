/**
 * **같은 한국 작품이 네 나라 위키피디아에 도착하는 차례.** (`/written-down-first`)
 *
 * ── 접었다가 되살린 각도 ──────────────────────────────────────
 * 8/15 에 「어느 나라가 한국 작품을 먼저 적나」를 한국어판 기준으로 재려다 **접었다.**
 * 「오징어 게임」 ko 문서의 첫 판이 **2025-01** 로 나왔기 때문이다 — 2021년 작품인데.
 * 첫 판 날짜는 「작품이 적힌 때」가 아니라 **「문서가 지금 이 이름으로 존재한 때」**다.
 * 문서를 옮기거나 합치면 앞의 판이 딴 문서로 따라간다.
 *
 * ⭐⭐ 그런데 **오염을 잴 수 있었다. 추가 요청 없이.**
 *   그 판의 월별 조회수가 있으면, **첫 판보다 앞선 달에 읽혔는지**를 보면 된다.
 *   읽혔다면 그 문서는 그 전부터 있었던 것이고, 첫 판 날짜는 이동에 지워진 것이다.
 * ```
 *   동남아 네 판 153개 문서   첫 판보다 앞서 읽힌 것 **0개**
 *   한국어판                 조회수를 안 받아 검증조차 못 한다
 * ```
 * ⭐ 그래서 **한국어판을 기준에서 뺐다.** 네 판끼리 서로 재면 물음은 그대로 선다 —
 *   「같은 작품을 넷 중 어디가 먼저 적는가.」
 *
 * ── ⛔⛔ 대조가 설명을 죽였다 ────────────────────────────────
 * 「인도네시아어판이 먼저 적는다」에 가장 흔한 설명은 **「그 위키가 더 커서」**다.
 * 재 보니 아니었다 —
 * ```
 *   vi  문서 1,304,001 · 활동 편집자 4,726 · 판 75,384,273   ← 넷 중 가장 크다
 *   id  문서   790,784 · 활동 편집자 4,690 · 판 29,552,153
 * ```
 * ⭐ 베트남어판이 셋 다 앞서는데도 한국 작품은 인도네시아어판이 먼저 적는다.
 *   ⛔ **그래도 「왜」는 말하지 않는다.** 크기가 아니라는 것만 말한다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **순위표로 줄세우지 않는다.** 넷을 등수로 매기지 않고 「몇 편에서 먼저였나」만 센다.
 * ⛔ **네 판을 다 아는 작품만 센다.** 한 판이 비면 빠진 판이 늘 진다.
 * ⛔ **비긴 것을 한쪽에 몰아주지 않는다.** 같은 달이면 둘 다 세고 따로 적는다.
 * ⛔ **오염을 검증한 판만 쓴다.** 검증 못 한 판(ko)은 아예 안 쓴다.
 * ⛔ **중앙값을 그냥 싣지 않는다.** 94편의 하나빼기를 같이 낸다.
 * ⛔ 광고 자리를 만들지 않는다. Riot Production(App 866800) 승인 전이다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-written-down-first.mjs
 *   node scripts/build-wikitip-written-down-first.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 하나빼기, 단단한가 } from './build-wikitip-one-out.mjs';
/* ⭐ 근거 칸의 표준 문구 — 자료 고유의 한계는 아래에서 덧붙인다 */
import {
  근거, 중앙값 as 중앙값자, 하나빼기 as 하나빼기자, 대조군 as 대조군자,
} from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 생일길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-title-birth.json');
export const 파도길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-title-waves.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-written-down-first.json');

export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 판이름 = {
  id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay',
};
export const 나라이름 = {
  id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia',
};

/**
 * ⭐ 그 위키가 얼마나 큰가 — 「크니까 먼저 적는다」를 죽이려고 둔다.
 * ⚠ 2026-08-15 에 `meta=siteinfo&siprop=statistics` 로 받았다. 손으로 박은 값이니
 *   ⛔ **언제 받았는지를 자료에 같이 낸다.** 자라는 수를 굳혀 놓고 잊으면 거짓말이 된다.
 */
export const 위키크기 = {
  id: { articles: 790784, activeEditors: 4690, edits: 29552153 },
  vi: { articles: 1304001, activeEditors: 4726, edits: 75384273 },
  th: { articles: 186434, activeEditors: 2963, edits: 13172524 },
  ms: { articles: 440840, activeEditors: 2018, edits: 6913168 },
};
export const 크기잰날 = '2026-08-15';

export function 달차(앞, 뒤) {
  if (!앞 || !뒤) return null;
  const [ay, am] = 앞.split('-').map(Number);
  const [by, bm] = 뒤.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function 중앙값(값들) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : +((s[n / 2 - 1] + s[n / 2]) / 2).toFixed(2);
}

/**
 * ⭐⭐ **첫 판 날짜가 이동에 지워졌나.**
 *   그 판에서 **첫 판보다 앞선 달에 읽혔으면** 그 문서는 그 전부터 있었던 것이다.
 * ⛔ 조회수가 없으면 「깨끗하다」가 아니라 **「모른다」**다. 그 둘을 섞지 않는다.
 */
export function 이동에지워졌나(첫판, 달값) {
  if (!첫판 || 첫판 === '못받음') return { known: false, why: 'no first revision date' };
  const 읽은달 = Object.entries(달값 ?? {})
    .filter(([, v]) => v != null && v > 0).map(([m]) => m).sort();
  if (!읽은달.length) return { known: false, why: 'no month was ever read' };
  const 앞선 = 달차(첫판, 읽은달[0]);
  return 앞선 < 0
    ? { known: true, moved: true, firstRevision: 첫판, readFrom: 읽은달[0], monthsEarlier: -앞선 }
    : { known: true, moved: false, firstRevision: 첫판, readFrom: 읽은달[0] };
}

/**
 * ⭐ 한 작품의 도착 차례.
 * ⛔ **네 판을 다 알아야 센다.** 한 판이 비면 그 판이 늘 진다.
 */
export function 한작품(생일들, 볼것 = 판들) {
  if (!볼것.every((p) => 생일들?.[p] && 생일들[p] !== '못받음')) return null;
  const 줄 = 볼것.map((p) => ({ edition: p, firstWritten: 생일들[p] }))
    .sort((a, b) => a.firstWritten.localeCompare(b.firstWritten));
  const 첫 = 줄[0].firstWritten;
  const 끝 = 줄[줄.length - 1].firstWritten;
  return {
    order: 줄.map((x) => ({ ...x, monthsAfterFirst: 달차(첫, x.firstWritten) })),
    firstEditions: 줄.filter((x) => x.firstWritten === 첫).map((x) => x.edition),
    spreadMonths: 달차(첫, 끝),
    tied: 줄.filter((x) => x.firstWritten === 첫).length > 1,
  };
}

/**
 * ⭐ 몇 편에서 먼저였나.
 * ⛔ **비긴 것을 한쪽에 몰아주지 않는다** — 같은 달이면 둘 다 센다. 그리고 따로 적는다.
 */
export function 먼저센다(작품들, 볼것 = 판들) {
  const 셈 = Object.fromEntries(볼것.map((p) => [p, 0]));
  let 비김 = 0;
  for (const t of 작품들) {
    for (const p of t.firstEditions) 셈[p] += 1;
    if (t.tied) 비김 += 1;
  }
  return { counts: 셈, outOf: 작품들.length, tied: 비김 };
}

/**
 * ⭐⭐ **차례 자체가 정해져 있나.**
 *   「누가 첫째냐」만 세면 나머지 셋이 뒤죽박죽인지 줄을 선 것인지 알 수 없다.
 *   ⭐ 그래서 판마다 **몇째로 도착했나**의 중앙값을 낸다. 그리고 마지막인 횟수도 센다.
 * ⛔ 등수를 매기는 것이 아니다 — **자료가 그렇게 나온 것**이고, 안 갈리면 안 갈린다고 낸다.
 */
export function 자리재기(작품들, 볼것 = 판들) {
  const 자리 = Object.fromEntries(볼것.map((p) => [p, []]));
  const 마지막 = Object.fromEntries(볼것.map((p) => [p, 0]));
  const 차례셈 = {};
  for (const t of 작품들) {
    t.order.forEach((o, i) => 자리[o.edition].push(i + 1));
    마지막[t.order[t.order.length - 1].edition] += 1;
    const k = t.order.map((o) => o.edition).join('>');
    차례셈[k] = (차례셈[k] ?? 0) + 1;
  }
  const 중앙자리 = Object.fromEntries(볼것.map((p) => [p, 중앙값(자리[p])]));
  return {
    medianPlace: 중앙자리,
    lastCount: 마지막,
    /* ⭐ 한 번도 마지막이 아닌 판이 있나 — 그게 「줄을 선다」의 가장 단단한 표다 */
    neverLast: 볼것.filter((p) => 마지막[p] === 0),
    commonestOrder: Object.entries(차례셈).sort((a, b) => b[1] - a[1])[0] ?? null,
    distinctOrders: Object.keys(차례셈).length,
    /* ⛔ 중앙 자리가 다 같으면 「줄을 안 선다」다. 그 말을 자료가 하게 한다 */
    ordered: new Set(Object.values(중앙자리)).size > 1,
  };
}

/**
 * ⭐⭐ **크기로 설명되나.** 먼저 적는 판이 가장 큰 판이면 크기 이야기다.
 * ⛔ 아니면 「크기가 아니다」까지만 말한다. **까닭은 말하지 않는다.**
 */
export function 크기로설명되나(셈, 크기 = 위키크기) {
  const 가장먼저 = Object.entries(셈).sort((a, b) => b[1] - a[1])[0];
  const 잣대 = ['articles', 'activeEditors', 'edits'];
  const 가장큰 = Object.fromEntries(잣대.map((k) => [k,
    Object.entries(크기).sort((a, b) => b[1][k] - a[1][k])[0][0]]));
  const 맞는것 = 잣대.filter((k) => 가장큰[k] === 가장먼저[0]);
  return {
    writesFirstMost: 가장먼저[0],
    largestBy: 가장큰,
    explainedBySize: 맞는것.length === 잣대.length,
    matchesOn: 맞는것,
    why: 맞는것.length === 잣대.length
      ? 'the edition that writes first is also the largest on every measure, so size is not ruled out'
      : 'the edition that writes first is not the largest, so a bigger encyclopedia does not '
        + 'explain the order — we do not say what does',
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  참('달 차이를 센다', 달차('2021-09', '2022-02') === 5);
  참('중앙값 짝수는 평균', 중앙값([1, 2, 3, 4]) === 2.5);
  참('⛔ 빈 것은 null', 중앙값([]) === null);

  /* 🔴🔴 오징어 게임 ko 문서가 이 자리다 — 첫 판 2025-01 인데 그 전부터 읽혔다 */
  const 지워짐 = 이동에지워졌나('2025-01', { '2021-10': 500, '2025-02': 100 });
  참('⭐⭐ 이동에 지워진 것을 잡는다', 지워짐.moved === true && 지워짐.monthsEarlier === 39);
  참('⭐ 멀쩡한 것은 안 잡는다',
    이동에지워졌나('2021-09', { '2021-10': 5 }).moved === false);
  참('⭐ 같은 달이면 멀쩡하다', 이동에지워졌나('2021-09', { '2021-09': 5 }).moved === false);
  /* ⛔ 조회수가 없으면 「깨끗하다」가 아니라 「모른다」다 */
  참('⛔ 안 읽힌 것은 모른다고 한다', 이동에지워졌나('2021-09', {}).known === false);
  참('⛔ 0 회는 읽힌 것이 아니다', 이동에지워졌나('2021-09', { '2021-01': 0 }).known === false);
  참('⛔ 첫 판이 없으면 모른다', 이동에지워졌나(null, { '2021-01': 5 }).known === false);
  참('⛔ 못받음도 모른다', 이동에지워졌나('못받음', { '2021-01': 5 }).known === false);

  const t = 한작품({ id: '2021-05', vi: '2021-07', th: '2021-09', ms: '2022-01' });
  참('도착 차례를 낸다', t.order[0].edition === 'id' && t.order[3].edition === 'ms');
  참('첫 판에서 몇 달인지 낸다', t.order[2].monthsAfterFirst === 4);
  참('처음 적은 판을 짚는다', t.firstEditions.join() === 'id');
  참('첫과 끝 사이를 낸다', t.spreadMonths === 8);
  참('⛔ 안 비겼다고 낸다', t.tied === false);
  /* ⛔ 한 판이 비면 그 판이 늘 진다 */
  참('⛔⛔ 네 판을 다 알아야 센다', 한작품({ id: '2021-05', vi: '2021-07' }) === null);
  참('⛔ 못받음이 끼면 안 센다',
    한작품({ id: '2021-05', vi: '못받음', th: '2021-09', ms: '2022-01' }) === null);

  const 비긴것 = 한작품({ id: '2021-05', vi: '2021-05', th: '2021-09', ms: '2022-01' });
  참('⭐ 비긴 것을 알아본다', 비긴것.tied === true && 비긴것.firstEditions.length === 2);

  const 셈 = 먼저센다([t, 비긴것]);
  참('먼저 센다', 셈.counts.id === 2 && 셈.counts.vi === 1);
  참('⛔ 비긴 것을 한쪽에 안 몰아준다', 셈.counts.vi === 1 && 셈.tied === 1);
  참('분모를 낸다', 셈.outOf === 2);

  /**
   * ⛔⛔ 가장 흔한 설명은 「그 위키가 더 커서」다. 재 보니 아니었다.
   *   ⚠ 베트남어판이 문서·편집자·판 수 셋 다 앞선다.
   */
  /* ⭐⭐ 차례가 정해져 있나 — 첫째만 세면 나머지가 줄을 선 것인지 알 수 없다 */
  const 짓기 = (...판) => ({ order: 판.map((p) => ({ edition: p })) });
  const 자 = 자리재기([짓기('id', 'vi', 'th', 'ms'), 짓기('id', 'vi', 'ms', 'th'),
    짓기('id', 'ms', 'vi', 'th')]);
  참('⭐ 자리 중앙값을 낸다', 자.medianPlace.id === 1 && 자.medianPlace.vi === 2);
  참('⭐⭐ 한 번도 마지막이 아닌 판을 짚는다',
    자.neverLast.includes('id') && 자.neverLast.includes('vi'));
  참('마지막인 횟수를 센다', 자.lastCount.th === 2 && 자.lastCount.ms === 1);
  참('가장 흔한 차례를 낸다', 자.commonestOrder[1] === 1 && 자.distinctOrders === 3);
  참('⭐ 갈리면 갈린다고 낸다', 자.ordered === true);
  /* ⛔ 안 갈리면 안 갈린다고 낸다 — 없는 줄을 세우지 않는다 */
  const 안갈림 = 자리재기([짓기('id', 'vi'), 짓기('vi', 'id')], ['id', 'vi']);
  참('⛔⛔ 안 갈리면 「줄을 안 선다」고 낸다', 안갈림.ordered === false);
  참('⛔ 그때는 마지막이 아닌 판이 없다', 안갈림.neverLast.length === 0);

  const 크 = 크기로설명되나({ id: 24, vi: 8, th: 1, ms: 1 });
  참('⭐⭐ 크기로 설명 안 된다고 낸다', 크.explainedBySize === false);
  참('⭐ 가장 큰 판이 vi 라고 낸다',
    크.largestBy.articles === 'vi' && 크.largestBy.activeEditors === 'vi' && 크.largestBy.edits === 'vi');
  참('⭐ 먼저 적는 판을 짚는다', 크.writesFirstMost === 'id');
  참('⛔ 까닭을 말하지 않는다', /we do not say what does/.test(크.why));
  /* ⚠ 크기로 설명되는 경우도 정직하게 낸다 */
  const 크2 = 크기로설명되나({ id: 1, vi: 20, th: 1, ms: 1 });
  참('⭐ 크기로 설명되면 그렇게 낸다', 크2.explainedBySize === true);
  참('⛔ 그때는 크기를 안 배제한다', /size is not ruled out/.test(크2.why));

  참('판마다 영어 이름이 있다', 판들.every((p) => (판이름[p] ?? '').length > 2));
  참('⛔ 이름에 한글이 없다',
    !Object.values({ ...판이름, ...나라이름 }).some((v) => /[가-힣]/.test(v)));
  참('⛔ 한국어판은 아예 안 쓴다', !판들.includes('ko'));
  참('⚠ 위키 크기를 언제 쟀는지 적어 둔다', /^\d{4}-\d{2}-\d{2}$/.test(크기잰날));
  참('⭐ 원본이 있다', fs.existsSync(생일길) && fs.existsSync(파도길));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 생일 = JSON.parse(fs.readFileSync(생일길, 'utf8'));
  const 파도 = JSON.parse(fs.readFileSync(파도길, 'utf8'));
  const 조회 = Object.fromEntries(파도.articles.map((a) => [a.titleEn, a.views ?? {}]));

  /* ⭐⭐ 먼저 오염을 잰다 — 못 믿을 판이 있으면 그 판을 쓸 수 없다 */
  const 오염 = { checked: 0, moved: 0, unknown: 0, byEdition: Object.fromEntries(판들.map((p) => [p, 0])) };
  const 지워진것 = [];
  for (const t of 생일.titles) {
    for (const p of 판들) {
      const r = 이동에지워졌나(t.births?.[p], 조회[t.titleEn]?.[p]);
      if (!r.known) { 오염.unknown += 1; continue; }
      오염.checked += 1;
      if (r.moved) { 오염.moved += 1; 오염.byEdition[p] += 1; 지워진것.push({ title: t.titleEn, edition: p, ...r }); }
    }
  }

  const 잰것 = 생일.titles.map((t) => ({ title: t.titleEn, ...(한작품(t.births) ?? {}) }))
    .filter((t) => t.order);
  const 셈 = 먼저센다(잰것);
  const 폭들 = 잰것.map((t) => t.spreadMonths);
  const 흔들 = 하나빼기(폭들);

  const 자료 = {
    generatedAt: 생일.generatedAt,
    source: 'Wikipedia API — first revision of each article; Wikimedia Pageviews for the '
      + 'move-corruption check; meta=siteinfo for edition size',
    editions: 판들,
    editionNames: 판이름,
    countryNames: 나라이름,
    /**
     * ⭐⭐ **근거 칸** — 사장님 지시(8/15). 표준 문구에 **이 자료 고유의 한계**를 덧붙인다.
     * ⛔ 고유 한계를 안 주면 `근거()` 가 던진다 — 붙여넣기만 있는 칸은 찬 척하는 것이다.
     */
    ...근거([중앙값자, 하나빼기자, 대조군자], {
      방법: 'The order itself is measured by the median place each edition takes across the '
        + 'titles, not only by how often it is first, because counting firsts alone cannot tell '
        + 'a queue from noise.',
      한계: 'A first-revision date records when an article has existed under its current name, '
        + 'so moving or merging an article erases the earlier one; we test every date against '
        + 'the months that article was read and drop any edition we cannot test that way. '
        + 'Twenty-five titles is a small sample, and every one of them reached a Netflix chart, '
        + 'so this says nothing about Korean titles that did not.',
    }),
    question: 'When the same Korean title is written up on four Southeast Asian Wikipedias, '
      + 'which one gets there first — and how long do the others take?',
    totalTitles: 생일.titles.length,
    measured: 잰것.length,
    whyFewer: `Of ${생일.titles.length} titles, ${잰것.length} have an article on all four `
      + 'editions with a first-revision date we could read. A title missing from one edition is '
      + 'left out entirely, because counting it would make that edition look slow when it is absent.',
    /* ⭐⭐ 이 자료의 값어치는 여기 있다 — 우리가 우리 날짜를 검증했다는 것 */
    moveCheck: {
      ...오염,
      examples: 지워진것.slice(0, 5),
      note: 'A first-revision date is when the article has existed under its current name, not '
        + 'when the title was first written about. Moving or merging an article carries the '
        + 'earlier revisions away with it. We test each date against the months that article was '
        + 'actually read: if it was read before its own first revision, the date has been erased. '
        + 'We dropped the Korean Wikipedia from this page for exactly that reason — its article '
        + 'for Squid Game reports a first revision of 2025-01 for a 2021 title, and we hold no '
        + 'Korean pageview data to check the rest against.',
    },
    arrivedFirst: 셈,
    /* ⭐⭐ 첫째만 세면 나머지 셋이 줄을 선 것인지 알 수 없다 */
    places: 자리재기(잰것),
    spreadMedianMonths: 중앙값(폭들),
    spreadRange: [Math.min(...폭들), Math.max(...폭들)],
    /* ⛔ 중앙값을 그냥 싣지 않는다 — 94편의 자 */
    stability: 흔들 ? { ...흔들, verdict: 단단한가(흔들) } : null,
    sizeControl: { ...크기로설명되나(셈.counts), sizes: 위키크기, measuredOn: 크기잰날 },
    titles: 잰것,
    cannotSay: [
      'Not why. We can rule out one explanation — the edition that writes first is not the '
        + 'largest — but we did not measure what does explain it.',
      'Not readers. This counts when an article was written, not when anyone read it. An '
        + 'audience can arrive long before an article does, or never.',
      'Not the Korean Wikipedia. Its first-revision dates are unreliable for this and we have '
        + 'no pageview data to check them against, so it is not on this page at all.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`작품 ${자료.totalTitles}편 중 네 판을 다 아는 ${자료.measured}편\n`);
  console.log(`⭐ 이동 검사 — 잰 것 ${오염.checked}개 · 지워진 것 ${오염.moved}개 · 못 잰 것 ${오염.unknown}개`);
  console.log(`먼저 적은 곳: ${판들.map((p) => `${판이름[p]} ${셈.counts[p]}`).join(' · ')}`
    + `  (비긴 것 ${셈.tied}편 / ${셈.outOf})`);
  console.log(`첫 판과 마지막 판 사이 중앙 ${자료.spreadMedianMonths}달 · `
    + `${자료.spreadRange[0]}~${자료.spreadRange[1]}달`);
  console.log(`⭐ 하나 빼기 — 흔들림 ${흔들?.swingOverMedian}배 · `
    + `${흔들 && 단단한가(흔들).steady ? '단단하다' : '🔴 아직 답이 아니다'}`);
  console.log(`\n⛔ 크기로 설명되나 — ${자료.sizeControl.explainedBySize ? '설명될 수 있다' : '아니다'}`);
  console.log(`   가장 큰 판: 문서 ${자료.sizeControl.largestBy.articles} · `
    + `편집자 ${자료.sizeControl.largestBy.activeEditors} · 판 ${자료.sizeControl.largestBy.edits}`);
  console.log(`   먼저 적는 판: ${자료.sizeControl.writesFirstMost}`);
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
