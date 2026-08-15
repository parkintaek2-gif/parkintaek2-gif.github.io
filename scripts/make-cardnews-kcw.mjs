#!/usr/bin/env node
/**
 * make-cardnews-kcw.mjs — **K Culture Wire 카드뉴스.** 영어 · 1080×1350 · 다섯 장.
 *
 * 🔴 사장님(2026-08-13) — 「텍스트 콘텐트 외 카드, 카드뉴스, 숏영상 등도 하는 거지?」
 *   실물을 세어 보니 **K Culture Wire 카드뉴스는 0장**이었다. 그 자리를 메운다.
 * 🔴 사장님(2026-08-13) — 「이건 **외부유입용** 콘텐트 역할도 하고, 우리를 알리는 거니까」
 *   → 그러면 **주소가 모든 장에 있어야 한다.** 두 번째 장에서 넘기다 만 사람도 우리를 찾아야 한다.
 *
 * ## ⛔ 이 카드뉴스가 지키는 것 — 백년지도 판(`make-cardnews.mjs`)의 규칙을 그대로 잇는다
 *
 *   ⛔ **겁주지 않는다.** 「지금 바로」·「놓치지 마세요」를 쓰지 않는다.
 *   ⛔ **등수를 매기지 않는다.** 무리를 나란히 놓고 **모양이 어떻게 다른지**를 말한다.
 *   ✅ **못 하는 것을 먼저 말한다.** 넷째 장이 늘 「이 안에 없는 것」이다.
 *   ✅ 숫자는 **자료에서 읽어 온 것**만 쓴다. 기억으로 적지 않는다.
 *
 * ## ⚠ 규격
 *   1080×1350 (세로 4:5) — 인스타·스레드가 안 자르는 크기.
 *   다섯 장까지. ⛔ 길면 마지막 「어디로 오라」 장을 아무도 안 본다.
 *
 * 쓰는 법
 *   node scripts/make-cardnews-kcw.mjs --out public/wikitip/cardnews/fame
 *   node scripts/make-cardnews-kcw.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

export const 폭 = 1080;
export const 높 = 1350;
export const 최대장수 = 5;
export const 주소 = 'kculturewire.com';

/**
 * 어느 벌을 지을 수 있나. ⚠ 사장님 지시는 「**매일** 낸다」이므로 한 벌만 박아 두면 안 된다.
 * ⛔ 벌마다 **자기 자료**를 가진다. 남의 자료에서 수를 빌려 오지 않는다.
 */
export const 벌목록 = {
  fame: { 자료: 'src/data/wikitip-fame-compare.json', 만들기: (d) => 한벌짓기(d) },
  manager: { 자료: 'src/data/wikitip-sea-athletes.json', 만들기: (d) => 감독벌짓기(d) },
  malaysia: { 자료: 'src/data/wikitip-malaysia.json', 만들기: (d) => 말레이벌짓기(d) },
  places: { 자료: 'src/data/wikitip-places.json', 만들기: (d) => 장소벌짓기(d) },
  instrument: { 자료: 'src/data/wikitip-titles-to-name.json', 만들기: (d) => 자벌짓기(d) },
  brands: { 자료: 'src/data/wikitip-brand-kinds.json', 만들기: (d) => 브랜드벌짓기(d) },
  counting: { 자료: 'src/data/wikitip-read-vs-visited.json', 만들기: (d) => 셈벌짓기(d) },
  season: { 자료: 'src/data/wikitip-look-vs-fly.json', 만들기: (d) => 철벌짓기(d) },
  control: { 자료: 'src/data/wikitip-what-fell.json', 만들기: (d) => 대조벌짓기(d) },
  wave: { 자료: 'src/data/wikitip-wave-floor.json', 만들기: (d) => 파도벌짓기(d) },
  halflife: { 자료: 'src/data/wikitip-half-life.json', 만들기: (d) => 반감기벌짓기(d) },
  oneout: { 자료: 'src/data/wikitip-one-out.json', 만들기: (d) => 하나빼기벌짓기(d) },
  first: { 자료: 'src/data/wikitip-written-down-first.json', 만들기: (d) => 먼저적기벌짓기(d) },
};

/**
 * 먼저 적기 벌 — 95편째 기사의 표(`/written-down-first`).
 *
 * ⭐ 이야기 한 줄: **한 위키피디아가 늘 먼저 적는데, 그게 가장 큰 곳이 아니다.**
 *
 * ⛔ 이 벌이 스스로 막는 것 —
 *   ⛔ **순위표로 줄세우지 않는다.** 넷에 등수를 매기는 게 아니라 「몇 편에서 먼저였나」와
 *     「몇 번 마지막이었나」를 나란히 낸다. ⭐ 인도네시아어판은 **한 번도 마지막이 아니다** —
 *     그게 이 벌에서 제일 센 한 칸이다.
 *   ⛔ **크기 표를 빼지 않는다.** 가장 흔한 설명을 죽이는 것이 이 기사의 값어치다.
 *     베트남어판이 문서·편집자·판 수 셋 다 앞서는데도 먼저 적는 것은 인도네시아어판이다.
 *   ⛔ **「왜」를 넣지 않는다.** 크기가 아니라는 것까지만.
 *   ⛔ **우리 날짜를 검증했다는 것을 넣는다.** 이 기사가 서 있는 바닥이다.
 */
export function 먼저적기벌짓기(d) {
  const 셈 = d.arrivedFirst;
  const 자리 = d.places;
  const 크 = d.sizeControl;
  const 차례 = [...d.editions].sort((a, b) => 셈.counts[b] - 셈.counts[a]);
  const 가장긴 = [...d.titles].sort((a, b) => b.spreadMonths - a.spreadMonths)[0];

  return {
    갈피: 'written-down-first',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Four Wikipedias · first revisions',
        큰: 'One Wikipedia\nwrites it down first—\nand it is not\nthe biggest one',
        아래: `Of ${d.measured} Korean titles with an article on all four Southeast Asian `
          + `editions, the ${d.editionNames[크.writesFirstMost]} one was first or joint-first `
          + `**${셈.counts[크.writesFirstMost]}** times, and last **not once**.`,
      },
      {
        꼴: '표',
        제목: 'First, last,\nand in between',
        머리: ['Wikipedia', 'First', 'Last', 'Median place'],
        줄: 차례.map((p) => [d.editionNames[p], `${셈.counts[p]}`, `${자리.lastCount[p]}`,
          `${자리.medianPlace[p]}`]),
        아래: `${셈.tied} of the ${셈.outOf} are ties, which is why the first column adds up to `
          + `more than ${셈.outOf}. **Read the last column: the order is not only about who is first.**`,
      },
      {
        꼴: '표',
        제목: 'The obvious\nexplanation fails',
        머리: ['Wikipedia', 'Articles', 'Editors'],
        줄: [...d.editions]
          .sort((a, b) => 크.sizes[b].articles - 크.sizes[a].articles)
          .map((p) => [d.editionNames[p],
            크.sizes[p].articles.toLocaleString('en-US'),
            크.sizes[p].activeEditors.toLocaleString('en-US')]),
        아래: `The ${d.editionNames[크.largestBy.articles]} Wikipedia leads on articles, on `
          + 'editors and on total edits — and writes about Korean titles first '
          + `**${셈.counts[크.largestBy.articles]}** times out of ${셈.outOf}.`,
      },
      {
        꼴: '없는것',
        제목: 'What is not in here',
        목록: [
          'Why — we ruled out one explanation, we did not find one',
          'Readers — this counts when an article was written, not when anyone read it',
          'The Korean Wikipedia — its dates fail our check and we cannot test the rest',
        ],
        아래: 'We tested every date against the months that article was read. '
          + `**${d.moveCheck.checked} could be tested and ${d.moveCheck.moved} failed.**`,
      },
      {
        꼴: '끝',
        제목: `The last edition\narrives a median\n${d.spreadMedianMonths} months later`,
        글: `Longest gap — **${가장긴.title.replace(/\s*\(.*\)$/, '')}**, `
          + `${가장긴.spreadMonths} months from the first edition to the last.\n\n`
          + '**Remove any single title and the median stays where it is.**',
        길: `${주소}/written-down-first`,
        곁: 'Wikipedia first revisions · Wikimedia Pageviews · Wikidata (CC0)',
      },
    ],
  };
}

/**
 * 하나 빼기 벌 — 94편째 기사의 표(`/one-out`).
 *
 * ⭐ 이야기 한 줄: **하나를 빼 보면 어느 답이 답인지 알 수 있다.**
 *
 * ⛔ 이 벌이 스스로 막는 것 —
 *   ⛔ **「우리가 틀렸다」로 팔지 않는다.** 흔들리는 답은 아직 답이 아닌 것이지 거짓이 아니다.
 *     넷째 장 첫 줄이 그 말이다.
 *   ⛔ **사분위가 못 가른다는 것을 셋째 장에 넣는다.** 그게 이 기사의 값어치다 —
 *     흔히 쓰는 자로는 두 답이 1.5 대 1.8 로 같아 보인다.
 */
export function 하나빼기벌짓기(d) {
  const 단단 = d.findings.find((f) => f.atFirstPublication.verdict?.steady);
  const 흔들 = d.findings.find((f) => f.atFirstPublication.verdict?.steady === false);
  const 몫 = (v, u) => `${v}${u === 'per cent' ? '%' : ''}`;

  return {
    갈피: 'one-out',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Method · our own two findings, same day',
        큰: 'Remove one.\nLook again.',
        아래: `We published two medians this morning and corrected one by evening. Taking a `
          + `single title out moved one of them **0×** and the other `
          + `**${흔들.atFirstPublication.oneOut.swingOverMedian}×** its own size. We ran the `
          + 'check afterwards.',
      },
      {
        꼴: '수',
        제목: 'What one title\ncan do',
        큰: `0× vs ${흔들.atFirstPublication.oneOut.swingOverMedian}×`,
        곁: 'How far each median travels when any single title is removed',
        아래: `The half-life median stayed at ${단단.atFirstPublication.oneOut.median} months `
          + `for all ${단단.atFirstPublication.n} removals. The floor-change median could be `
          + `pushed from ${몫(흔들.atFirstPublication.oneOut.lowestWithoutOne, 흔들.unit)} to `
          + `${몫(흔들.atFirstPublication.oneOut.highestWithoutOne, 흔들.unit)} by dropping one of `
          + `${흔들.atFirstPublication.n}.`,
      },
      {
        꼴: '표',
        제목: 'The usual check\ncannot tell them apart',
        머리: ['Finding', 'IQR ÷ median', 'One-out ÷ median'],
        줄: d.findings.map((f) => [
          f.what.replace(/^(Months|Percentage change)/, (m) => m).slice(0, 34),
          `${f.atFirstPublication.iqr?.overMedian ??0}×`,
          `${f.atFirstPublication.oneOut.swingOverMedian}×`,
        ]),
        아래: 'The interquartile range is built from the middle of the list, so it never has to '
          + 'look at the one extreme value. Leave-one-out asks what happens when that value is '
          + 'the one removed.',
      },
      {
        꼴: '없는것',
        제목: 'What we are not saying',
        목록: [
          'Not that the corrected figure was false — it was a real median of five real values '
            + 'that happened not to be stable',
          'Not that a steady median is a true one — a biased sample can be very steady and '
            + 'still wrong',
          'Not a study of findings — this is two of our own, on one day',
        ],
        아래: 'It works on medians. A share, a total or a correlation\nneeds a different check, '
          + 'and we do not have one.',
      },
      {
        꼴: '끝',
        제목: 'It cost one line.\nWe ran it too late.',
        글: 'Take the numbers. Remove one. Recompute. Do it for each.\n\n'
          + 'No simulation, no random seed, no assumption about the distribution — '
          + '**the same numbers always give the same answer.**',
        길: `${주소}/one-out`,
        곁: 'Wikimedia Pageviews · our own two findings',
      },
    ],
  };
}

/**
 * 반감기 벌 — 93편째 기사의 표(`/half-life`).
 *
 * ⭐ 이야기 한 줄: **두 달이면 절반이 사라진다. 그런데 대부분 한 번은 돌아온다.**
 *
 * ⛔ 이 벌이 스스로 막는 것 —
 *   ⛔ **반감기를 「끝」으로 읽히게 두지 않는다.** 열여섯 중 열둘이 다시 올랐다.
 *     그 사실이 둘째 장에 이미 있어야 한다 — 표지만 보고 지나가는 사람이 대부분이다.
 *   ⛔ 평균을 쓰지 않는다. 2.9달은 열여섯 중 아홉보다 길다.
 *   ⛔ 「아직 안 떨어졌다」를 「오래 간다」로 적지 않는다. 넷째 장에 그 말을 넣는다.
 */
export function 반감기벌짓기(d) {
  const 답 = d.answer;
  const 되풀이 = d.titles.filter((t) => t.roseAboveHalfAgain);
  const 아직 = d.notMeasured.filter((t) => /months follow/.test(t.why));

  return {
    갈피: 'half-life',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: `Four Southeast Asian Wikipedias · ${d.window}`,
        큰: 'Half of it\nis gone in\ntwo months.',
        아래: `Across **${답.measured} Korean titles** we could time from their peak, the median `
          + `fell below half in **${답.halfLifeMedianMonths} months**. `
          + `${답.halvedWithinOneMonth} of them did it in one.`,
      },
      {
        꼴: '수',
        제목: 'But it is not\nan ending',
        큰: `${되풀이.length} of ${답.measured}`,
        곁: 'Titles that later rose back above half their peak',
        아래: `A median of **${답.returnWavesMedian} separate returns** each, the first arriving `
          + `a median **${답.firstReturnMedianMonths} months** after the peak. Some are new `
          + 'seasons. Some are not.',
      },
      {
        꼴: '표',
        제목: 'How long half\nof it lasts',
        머리: ['Title', 'Peak reads', 'Half-life'],
        줄: d.titles.slice(0, 8).map((t) => [
          t.title.replace(/\s*\(.*\)$/, ''),
          String(t.peak),
          `${t.halfLifeMonths} ${t.halfLifeMonths === 1 ? 'month' : 'months'}`,
        ]),
        아래: 'Reads per million reads of that Wikipedia, four editions. The two biggest waves '
          + 'in the whole set are both gone by half within thirty days. Whatever makes '
          + 'attention last, it is not size.',
      },
      {
        꼴: '없는것',
        제목: 'What we are not saying',
        목록: [
          `Not that ${아직.length} recent titles are lasting — their peaks are months old, `
            + 'which is unknown, not slow',
          `Not the mean — it reads ${답.halfLifeMeanMonths} months, longer than most of these `
            + 'titles actually lasted',
          'Not a viewer count — a read is someone opening a page, which may or may not '
            + 'become watching',
        ],
        아래: 'Monthly data puts a floor under this. Ten days and thirty days\nboth read as '
          + 'one month here.',
      },
      {
        꼴: '끝',
        제목: 'A wave that recurs,\nnot one that recedes',
        글: `Half gone in **${답.halfLifeMedianMonths} months**, and **${되풀이.length} of `
          + `${답.measured}** back above half at least once. Briefly, repeatedly, and not on `
          + 'any schedule a release calendar would predict.',
        길: `${주소}/half-life`,
        곁: 'Wikimedia Pageviews · human traffic only',
      },
    ],
  };
}

/**
 * 자 벌 — 87편째 기사(2026-08-14).
 * ⭐ 뼈는 **어제 못 읽은 것을 자를 바꿔 읽었다**는 것이다. 우리가 파는 것이 그 태도다.
 * ⛔ 인과로 읽히게 두지 않는다 — 넷째 장 첫 줄이 「어느 쪽이 먼저인지 모른다」다.
 */
export function 자벌짓기(d) {
  const 띠 = d.bands;
  const 첫 = 띠[0];
  const 끝 = 띠[띠.length - 1];
  return {
    갈피: 'instrument',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Method · 12 months',
        큰: `Yesterday this question\nread as nothing.\nToday it reads`,
        아래: `Same ${d.actorsCounted.toLocaleString('en-US')} actors, same panel. We changed what we measured, not who.`,
      },
      {
        꼴: '수',
        제목: 'Titles, and the\nname itself',
        큰: `${첫.medianRead} → ${끝.medianRead}`,
        곁: 'Median reads of an actor\'s own article, by charting titles',
        아래: `The four bands run one way and do not turn back. The top is **${d.multiple}×** the bottom.`,
      },
      {
        꼴: '표',
        제목: 'Four bands',
        머리: ['Charting titles', 'Actors', 'Median reads'],
        줄: 띠.map((b) => [b.band, String(b.actors), String(b.medianRead ?? '—')]),
        아래: `Yesterday we asked how far their **titles** travelled and got 19, 11, 18, 7 — no `
          + 'direction. That figure belonged to the show. This one belongs to the name.',
      },
      {
        꼴: '없는것',
        제목: 'What we cannot say',
        목록: [
          'Which way the arrow points — casting follows attention as readily as the reverse',
          `The ceiling — the most-read one-title actor scores ${첫.topRead}, above the top band's median`,
          'Anything about affection — this counts people opening a page',
        ],
        아래: '**We did not delete the earlier piece.** It was right about why the first '
          + 'instrument failed, and that is why this one works.',
      },
      {
        꼴: '끝',
        제목: 'The question was fine.\nThe instrument\nwas not.',
        글: 'A measurement that comes out flat is worth publishing.\n'
          + 'Sometimes it is telling you to change the ruler.\n\n'
          + '**Every figure has a table behind it.**',
        길: `${주소}/titles-to-name`,
        곁: 'Netflix Tudum · Wikidata (CC0) · Wikimedia Pageviews · Aug 2025 – Jul 2026',
      },
    ],
  };
}

/**
 * 장소 벌 — 86편째 기사(2026-08-14). 사장님 「지도 시장 조사」 지시의 첫 답.
 * ⭐ 뼈는 **소속사가 서울보다 위**라는 것이다. 지도 시장이 장소만이 아니라는 뜻이다.
 * ⛔ 「가게를 못 잰다」를 넷째 장 맨 앞에 둔다 — 그것이 이 자료의 가장 큰 구멍이다.
 */
export function 장소벌짓기(d) {
  const 무리 = (k) => d.groups.find((g) => g.group === k);
  const 회사 = 무리('company');
  const 도시 = 무리('admin');
  const 역 = 무리('station');
  const 유산 = 무리('heritage');
  return {
    갈피: 'places',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Four Wikipedias · 12 months',
        큰: `A Korean record label\nis looked up more\nthan Seoul is`,
        아래: `${d.placesMeasured.toLocaleString('en-US')} places in Korea, measured the same way as the people who come from them.`,
      },
      {
        꼴: '수',
        제목: 'The label and\nthe capital',
        큰: `${d.topCompany.total} vs ${d.topCity.total}`,
        곁: `${d.topCompany.name} against ${d.topCity.name}, reads per million`,
        아래: `**${d.citiesBelowTopCompany}** of the ${d.citiesCounted} Korean cities and districts `
          + 'we measured sit below that one company.',
      },
      {
        꼴: '표',
        제목: 'Where the\nreading sits',
        머리: ['Kind', 'Places', 'Total', 'Median'],
        줄: [
          [도시.label, String(도시.places), String(도시.perMillion), String(도시.medianPlace)],
          [회사.label, String(회사.places), String(회사.perMillion), String(회사.medianPlace)],
          [유산.label, String(유산.places), String(유산.perMillion), String(유산.medianPlace)],
          [역.label, String(역.places), String(역.perMillion), String(역.medianPlace)],
        ],
        아래: `${역.places} stations draw less than ${유산.places} heritage sites do. `
          + `**${회사.places} companies have the highest median of any kind.**`,
      },
      {
        꼴: '없는것',
        제목: 'What this cannot see',
        목록: [
          'A single restaurant or cafe — Wikipedia has no articles on venues',
          'Visits — a read is curiosity, not a trip',
          'The Philippines — the Tagalog edition is too small to measure with',
        ],
        아래: 'The venue layer needs the Korea Tourism Organization API.\n'
          + '**We say what we cannot see before we say what we can.**',
      },
      {
        꼴: '끝',
        제목: 'The four countries\ndo not agree',
        글: 'Indonesia opens with two record labels.\nMalaysia opens with a palace.\n\n'
          + '**Read the columns across, not down.**',
        길: `${주소}/places`,
        곁: 'Wikidata (CC0) · Wikimedia Pageviews · Aug 2025 – Jul 2026',
      },
    ],
  };
}

/**
 * 말레이시아 벌 — 84편째 기사(2026-08-14).
 * ⭐ 이 벌의 뼈는 **하나가 줄에서 벗어났다**는 것이다. 다섯 줄을 나란히 놓으면 눈이 알아본다.
 * ⛔ 「말레이시아 사람이 명품을 좋아한다」로 읽지 않는다 — 우리가 잰 것은 **읽힌 몫**이다.
 */
export function 말레이벌짓기(d) {
  const 사람무리 = d.sharesByGroup.filter((g) => g.group !== 'brands');
  const 브랜드 = d.sharesByGroup.find((g) => g.group === 'brands');
  const [낮, 높음] = d.peopleShareRangePc;
  return {
    갈피: 'malaysia',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Malay Wikipedia · 12 months',
        큰: `Malaysia reads Korean\nbrands ${d.brandOverPeopleRatio}× as readily\nas it reads Korean people`,
        아래: 'Four kinds of people sit in a narrow band. One kind of thing sits well outside it.',
      },
      {
        꼴: '수',
        제목: 'One row is not\nlike the others',
        큰: `${낮}–${높음}% vs ${d.brandSharePc}%`,
        곁: "Malaysia's share of all four-country reading, by group",
        아래: `Groups, solo musicians, actors and athletes land within **${(높음 - 낮).toFixed(1)} points** `
          + `of each other. Luxury and car brands land at **${d.brandSharePc}%**.`,
      },
      {
        꼴: '표',
        제목: 'The five rows',
        머리: ['Group', 'Counted', "Malaysia's share"],
        줄: [
          ...사람무리.map((g) => [g.label, String(g.people), `${g.malaysiaSharePc}%`]),
          [브랜드.label, String(브랜드.people), `${브랜드.malaysiaSharePc}%`],
        ],
        아래: 'Read the last column down. Four numbers agree and the fifth does not.',
      },
      {
        꼴: '없는것',
        제목: 'What is not in here',
        목록: [
          'Why — a share is not a reason, and we did not measure one',
          'Population — we divide by the size of each Wikipedia, not by how many people live there',
          'Malaysia alone — Malay is read outside Malaysia, and many Malaysians read in English',
        ],
        아래: 'Popularity is not what this counts. **It counts people looking something up.**',
      },
      {
        꼴: '끝',
        제목: 'Four agree.\nOne does not.',
        글: 'That is the whole finding, and it is worth more\nthan a guess about why.\n\n'
          + '**We publish the gap and leave the reason open.**',
        길: `${주소}/malaysia`,
        곁: 'Wikidata (CC0) · Wikimedia Pageviews · Aug 2025 – Jul 2026',
      },
    ],
  };
}

/** 자료에서 한 벌을 짓는다. ⛔ 수를 손으로 적지 않는다 */
export function 한벌짓기(d) {
  const 무리 = (k) => d.groups.find((g) => g.group === k);
  const 그룹 = 무리('groups');
  const 선수 = 무리('athletes');
  const 배우 = 무리('actors');
  const 솔로 = 무리('musicians');
  const 브랜드 = 무리('brands');

  return {
    갈피: 'fame-compare',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Southeast Asia · 12 months',
        큰: `Exactly one Korean act\nis read more than\n${d.topAthleteName}`,
        아래: `We put ${d.entertainersCounted.toLocaleString('en-US')} entertainers, `
          + `${선수.people} athletes and ${브랜드.people} brands on one scale.`,
      },
      {
        꼴: '수',
        제목: 'And it is BTS',
        큰: `${d.topActorTotal} vs ${d.topAthleteTotal}`,
        곁: 'Reads per million reads of each Wikipedia, four editions added',
        아래: `Nobody else clears him. Of ${d.entertainersCounted.toLocaleString('en-US')} entertainers `
          + `measured, **${d.actorsAboveTopAthlete}** is above the most-read athlete.`,
      },
      {
        꼴: '표',
        제목: 'The gap is not\nat the top',
        머리: ['Group', 'Most read', 'Median', 'Above 100'],
        줄: [
          ['Groups', String(그룹.topTotal), String(그룹.median), String(그룹.aboveThreshold['100'])],
          ['Actors', String(배우.topTotal), String(배우.median), String(배우.aboveThreshold['100'])],
          ['Solo', String(솔로.topTotal), String(솔로.median), String(솔로.aboveThreshold['100'])],
          ['Athletes', String(선수.topTotal), String(선수.median), String(선수.aboveThreshold['100'])],
        ],
        아래: `The athletes own the ceiling and nothing under it — a median of ${선수.median} against `
          + `${배우.median} for actors. **${배우.aboveThreshold['100']} actors clear 100. `
          + `${선수.aboveThreshold['100']} athletes do.**`,
      },
      {
        꼴: '없는것',
        제목: 'What is not in here',
        목록: [
          'Popularity — this counts people looking someone up, not liking them',
          'The Philippines — the Tagalog Wikipedia is too small to measure with',
          'Anyone with no article — an absence of a page is not an absence of interest',
        ],
        아래: 'Readers in these four countries also use the English Wikipedia,\n'
          + 'which cannot be split by country. **Every figure here is a floor.**',
      },
      {
        꼴: '끝',
        제목: 'Readers follow\nthe person,\nnot the label',
        글: `The biggest luxury or car brand, ${d.topBrandName}, reaches **${d.topBrandTotal}** —\n`
          + 'a fraction of the acts that front them.\n'
          + '**An ambassador announcement travels because\na Korean act is attached to it.**',
        길: `${주소}/fame-compare`,
        곁: 'Wikidata (CC0) · Wikimedia Pageviews · Aug 2025 – Jul 2026',
      },
    ],
  };
}

/**
 * 파도 벌 — 92편째 기사의 표(`/wave-and-floor`).
 *
 * ⭐ 이야기 한 줄: **파도는 크고, 자국은 없다.**
 *
 * ⛔ 이 벌이 스스로 막는 것 —
 *   ⛔ **오징어게임 35배를 표지에 크게 놓지 않는다.** 그 작품은 뒤바닥에 시즌 3 이
 *     들어앉아 **표에서 뺀 편**이다. 카드가 기사보다 앞서면 안 된다.
 *   ⛔ **평균을 쓰지 않는다.** 다섯 편에서 평균은 +0.8% 로 「그대로다」가 되고,
 *     중앙값은 −6.7% 로 「조금 낮아졌다」가 된다. 기사가 고른 쪽을 카드도 고른다.
 *   ⭐ **못 잰 열다섯 편을 카드에 넣는다.** 다섯이라는 수가 얼마나 얇은지 같이 보여야 한다.
 */
export function 파도벌짓기(d) {
  const 답 = d.answer;
  const 몫 = (v) => `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
  const 큰 = 답.biggestWave;
  const 못잰수 = d.titlesNotMeasured.length;
  /* ⭐ 이 벌의 요점이 바뀌었다 — 「파도가 자국을 안 남긴다」가 아니라
     **「신작에는 이 물음을 못 던진다」**가 앞이다. 문서가 작품과 함께 생긴다 */
  const 태어난것 = d.titlesNotMeasured.filter((t) => /did not exist/.test(t.why));

  return {
    갈피: 'wave-and-floor',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: `Four Southeast Asian Wikipedias · ${d.window}`,
        큰: 'The article is\nborn with\nthe show.',
        아래: `A Korean title peaks and the encyclopaedia fills. What the wave leaves behind `
          + `cannot be asked of a new title at all — **${태어난것.length} of 35** have no floor `
          + 'from before, because they had no article from before.',
      },
      {
        꼴: '수',
        제목: 'How many titles\ncan answer at all',
        큰: `${답.measured} of ${답.measured + 못잰수}`,
        곁: 'Titles with a measurable floor on both sides of their peak',
        아래: `${태어난것.length} were disqualified because the article did not exist before the `
          + 'title did. A percentage change from nothing is not a small number, it is not a number.',
      },
      {
        꼴: '표',
        제목: 'Five titles,\nbefore and after',
        머리: ['Title', 'Peak ÷ floor', 'Change in floor'],
        줄: d.titlesMeasured.map((t) => [
          t.title.replace(/\s*\(.*\)$/, ''),
          `${t.peakOverFloor}×`,
          몫(t.floorChangePc),
        ]),
        아래: 'Reads per million reads of that Wikipedia, summed across four editions. The floor '
          + `is the ${d.method.floorMonths} months either side of the peak, skipping `
          + `${d.method.waveMonths} months next to it because those are still the wave.`,
      },
      {
        꼴: '없는것',
        제목: 'What we are not saying',
        목록: [
          큰
            ? `Not that ${큰.title} proves anything — the biggest ratio here at `
              + `${큰.peakOverFloor}×, and unusable because its floor before the wave was `
              + 'almost nobody'
            : 'Not that the biggest wave proves anything',
          `Not a survey — ${못잰수} of the ${답.measured + 못잰수} titles could not be measured `
            + 'at all, and every reason is published',
          'Not new hits — the measured titles are back catalogue rising again, which is the '
            + 'only kind that has a floor to compare against',
        ],
        아래: 'A read is not a viewer. Some of these are people deciding\nwhether to watch, '
          + 'and some never do.',
      },
      {
        꼴: '끝',
        제목: 'Back catalogue\nsettles lower',
        글: `Among the ${답.measured} Korean titles old enough to have a floor, the months after `
          + `the wave run a median **${몫(답.floorChangeMedianPc)}** on the months before it. `
          + `**${답.floorsThatRose} of ${답.measured}** ended higher.`,
        길: `${주소}/wave-and-floor`,
        곁: 'Wikimedia Pageviews · human traffic only',
      },
    ],
  };
}

/**
 * 대조 벌 — 91편째 기사의 표(`/what-actually-fell`).
 *
 * ⭐ 이야기 한 줄: **떨어진 수 하나로는 아무 말도 못 한다. 옆에 놓을 것이 있어야 한다.**
 *
 * ⛔ 이 벌이 스스로 막는 것 —
 *   ⛔ 표지에 「−30%」만 크게 놓지 않는다. 그건 우리가 **안 쓰기로 한 헤드라인**이다.
 *     ⭐ 큰 자리에는 **두 수를 나란히** 놓는다. 그래야 카드 한 장만 본 사람도 안 속는다.
 *   ⛔ 「한국이 일본보다 더 떨어졌다」를 넣지 않는다. 우리 검사가 그 견줌을 뺏었다.
 *   ⚠ 카드가 기사보다 앞서면 안 된다. 기사가 본문에서 버린 말은 카드에서도 버린다.
 */
export function 대조벌짓기(d) {
  const 여 = d.axes.trip;
  const 문 = d.axes.culture;
  const 안 = d.axisAgainstAxis;
  const 몫 = (v) => `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
  const 뒤집힘 = d.rulerMatters.signFlips[0];

  return {
    갈피: 'what-actually-fell',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Four Southeast Asian Wikipedias · 12 months against 12',
        큰: 'A number fell\nby a third.\nIt was the wrong\nstory.',
        아래: `Korean travel articles fell **${몫(여.korea)}**. We nearly published that as `
          + 'cooling interest in Korea. Then we measured something to put beside it.',
      },
      {
        꼴: '수',
        제목: 'The control group\nis the whole story',
        큰: `${몫(여.korea)} vs ${몫(문.control)}`,
        곁: 'Korean travel articles, then Japanese and Taiwanese culture articles',
        아래: 'Travel articles fell for every country we measured.\nCulture articles about '
          + 'Japan and Taiwan did not fall at all.',
      },
      {
        꼴: '표',
        제목: 'Two axes,\nfour numbers',
        머리: ['Articles about', 'Korea', 'Japan & Taiwan'],
        줄: [
          ['Travelling there', 몫(여.korea), 몫(여.control)],
          ['The place, its culture', 몫(문.korea), 몫(문.control)],
        ],
        아래: 'Reads per million reads of that edition, so an encyclopaedia shrinking overall '
          + 'is already divided out. Read down the columns, not across the rows — the next '
          + 'card says why.',
      },
      {
        꼴: '없는것',
        제목: 'What we are not saying',
        목록: [
          'Not that Korea fell further than Japan — matched for starting height that gap '
            + `shrinks from ${Math.abs(d.heightCheck.culture.rawGap)} points to `
            + `${Math.abs(d.heightCheck.culture.matchedGap)}`,
          'Not that Southeast Asians stopped coming — Asian route passengers moved '
            + `${몫(d.flights.asia.change)} over the same months`,
          뒤집힘
            ? `Not a one-month reading — ${뒤집힘.region} is ${몫(뒤집힘.oneMonth)} on one month `
              + `and ${몫(뒤집힘.twelveMonths)} on twelve`
            : 'Not a one-month reading — every figure here is twelve months against twelve',
        ],
        아래: 'A gap that survives only until both sides start from\nthe same place was the '
          + 'starting place.',
      },
      {
        꼴: '끝',
        제목: 'What is left\nis inside Korea',
        글: `Korea's travel pages fell **${몫(안.trip.change)}**, its culture pages `
          + `**${몫(안.culture.change)}**. The culture pages start about `
          + `**${안.verdict.startLevelRatio}× higher** and still fell less — the opposite of `
          + 'what height would do.',
        길: `${주소}/what-actually-fell`,
        곁: 'Wikimedia Pageviews · KOSIS (Korea Airports Corporation)',
      },
    ],
  };
}

/**
 * 철 벌 — 90편째 기사의 표(`/look-vs-fly`).
 * ⭐ 이야기 한 줄: **두 자가 만나는 자리는 봉우리가 아니라 바닥이다.**
 *
 * ⛔ 「12월에 알아보고 1월에 간다」로 읽히면 거짓이다. 카드에서 **그 읽기를 직접 부정한다.**
 *   ⚠ 기사가 본문 한가운데서 부정했으니 카드도 같아야 한다 — 카드가 기사보다 앞서면 안 된다.
 */
export function 철벌짓기(d) {
  const 이름 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const 말 = (mm) => 이름[Number(mm) - 1] ?? mm;
  /* 표는 열두 줄이 너무 기니 봉우리·바닥 둘레만 보인다 */
  const 볼달 = ['12', '01', '05', '06'];

  return {
    갈피: 'look-vs-fly',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Southeast Asia · 23 months',
        큰: `They agree on\nthe quiet month,\nnot the busy one.`,
        아래: `Looking about a Korean trip peaks in **${말(d.lookPeak.peak)}**. Flights peak in `
          + `**${말(d.flyPeak.peak)}**. Both fall lowest in **${말(d.lookPeak.trough)}**.`,
      },
      {
        꼴: '수',
        제목: 'The year swings\nmore in the reading\nthan in the flying',
        큰: `${d.lookPeak.ratio}× vs ${d.flyPeak.ratio}×`,
        곁: 'Peak month over lowest month — looking, then flying',
        아래: 'Reading moves further across the year than seats do.\nPlanes are scheduled; '
          + 'curiosity is not.',
      },
      {
        꼴: '표',
        제목: 'Four months\nof the twelve',
        머리: ['Month', 'Looking', 'Flying', 'Years'],
        줄: 볼달.map((m) => [말(m), String(d.lookFolded[m]),
          Math.round(d.flyFolded[m]).toLocaleString('en-US'), String(d.yearsPerFoldedMonth[m])]),
        아래: `Looking is reads per million reads of that Wikipedia across `
          + `${d.articlesUsed.length} travel articles and ${d.editionsSea.length} editions. `
          + `The "Years" column is how many years sit behind each average — two, and one for July.`,
      },
      {
        꼴: '없는것',
        제목: 'What we are not saying',
        목록: [
          'Not that December looking causes January flying — we never see one reader board one plane',
          'Not a correlation — over 23 months a single shared season would produce a large one',
          'Not Southeast Asia in the air figures — that row holds India and Central Asia too',
        ],
        아래: 'Looking is not going. Some of these reads are homework,\nand some never become a trip.',
      },
      {
        꼴: '끝',
        제목: `The steadier signal\nis the empty month`,
        글: `Both the reading and the seats fall to their lowest in **${말(d.lookPeak.trough)}**.\n`
          + 'That is where the two rulers meet without a story about cause.',
        길: `${주소}/look-vs-fly`,
        곁: 'Wikimedia Pageviews · KOSIS (Korea Airports Corporation)',
      },
    ],
  };
}

/**
 * 셈 벌 — 89편째 기사의 표(`/read-vs-visited`).
 * ⭐ 이야기 한 줄: **서울은 스물다섯 구인데 관광 집계는 다섯 구밖에 못 말한다.**
 *
 * ⚠ 이 벌은 다른 벌과 결이 다르다 — **못 잰 것이 내용**이다.
 *   그래서 넷째 장(없는것)이 덤이 아니라 **이 벌의 중심**이다.
 * ⛔ 「강남이 인기 없다」로 읽히면 거짓이다. 유료 관광지 자라는 말을 표 밑에 박는다.
 */
export function 셈벌짓기(d) {
  const 종로 = d.rows.find((r) => r.nameEn.startsWith('Jongno'));
  const 노원 = d.rows.find((r) => r.nameEn.startsWith('Nowon'));

  return {
    갈피: 'read-vs-visited',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Seoul · public admissions data',
        큰: 'Seoul has\n25 districts.\nThe tourist count\nsees five.',
        아래: `In **${d.districtsWithNoCountedSite}** of them the table counts no tourist site at all. `
          + `In **${d.districtsWithForeignZero}** more it records foreign visitors as zero.`,
      },
      {
        꼴: '수',
        제목: 'One district\ntakes almost\nall of it',
        큰: `${종로.foreignVisitors.toLocaleString('en-US')}`,
        곁: `Foreign admissions in ${종로.nameEn.replace(' District', '')}, of the five we can measure`,
        아래: `${노원.nameEn.replace(' District', '')} is read almost as often and records `
          + `**${노원.foreignVisitors}**.\nThat distance is about ticket gates, not interest.`,
      },
      {
        꼴: '표',
        제목: 'The five both\nrulers can see',
        머리: ['District', 'Read', 'Foreign', 'Share'],
        줄: d.rows.map((r) => [r.nameEn.replace(' District', ''), String(r.read),
          r.foreignVisitors.toLocaleString('en-US'), `${r.foreignSharePc}%`]),
        아래: 'These are not the five most visited districts in Seoul. They are the five where '
          + 'both numbers exist. The table counts paid admissions, so a district whose draw is a '
          + 'street has nothing to sell a ticket to.',
      },
      {
        /* ⭐ 이 벌에서는 이 장이 중심이다 */
        꼴: '없는것',
        제목: 'What is not counted',
        목록: [
          `Jung — the district that holds Myeongdong. No counted tourist site`,
          `Mapo — Hongdae. No counted tourist site`,
          `Songpa — 7,706,775 admissions, and foreign visitors recorded as zero`,
        ],
        아래: 'We did not replace those zeros with a guess.\nA zero we invent over is worse than a '
          + 'zero we mark and leave.',
      },
      {
        꼴: '끝',
        제목: 'Neither ruler\nsees the whole city',
        글: `The four Southeast Asian Wikipedias hold an article for **${d.districtsInWiki}** of `
          + `Seoul's ${d.seoulDistrictsAll} districts.\nThe admissions table can be asked about `
          + `**${d.districtsCompared}**.`,
        길: `${주소}/read-vs-visited`,
        곁: 'KOSIS · Wikidata · Wikimedia Pageviews',
      },
    ],
  };
}

/**
 * 브랜드 벌 — 88편째 기사의 표(`/brand-kinds`).
 * ⭐ 이야기 한 줄: **같은 나라가 갈래마다 자리를 바꾼다.**
 *
 * ⛔ 「어느 나라가 관심이 많다」로 읽히면 거짓이다. 넷째 장(없는것)에 못 박는다.
 * ⛔ 한국 차 배수를 카드에 **넣지 않는다.** 기사가 안 낸 수를 카드가 내면 안 된다 —
 *    카드가 기사보다 앞서 나가는 것이 오늘 공유 카드에서 한 번 막힌 자리다.
 */
export function 브랜드벌짓기(d) {
  const 나라 = d.countryNames;
  const 흔 = d.positionSwing.제일;
  const 차 = d.kinds.find((k) => k.key === 'car');
  const 명 = d.kinds.find((k) => k.key === 'luxury');
  /* 표에는 **두꺼운 갈래만** 올린다. 얇은 것을 무늬로 보여 주지 않는다 */
  const 두꺼운 = d.kinds.filter((k) => !k.얇은가);

  return {
    갈피: 'brand-kinds',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Southeast Asia · 12 months',
        큰: 'The same country\nis first and last,\ndepending on\nwhat you count',
        아래: `${나라[흔]} reads more about German cars than its three neighbours — `
          + 'and less about luxury houses than any of them.',
      },
      {
        꼴: '수',
        제목: 'One country,\ntwo opposite\nappetites',
        큰: `${차.판별[흔]} vs ${명.판별[흔]}`,
        곁: `${나라[흔]} — German car makers, then luxury houses`,
        아래: 'Reads per million reads of that edition, so a smaller country\n'
          + 'is not pushed down for being smaller.',
      },
      {
        꼴: '표',
        /* 🔴 처음에 「Five kinds」라 적었다. 표에는 두꺼운 **셋**만 올렸으니 거짓이었다.
           ⛔ 제목이 표보다 커지면 안 된다. 카드는 표를 설명하는 자리다 */
        제목: `${두꺼운.length === 3 ? 'Three' : 두꺼운.length} kinds thick\nenough to read`,
        머리: ['Kind', ...d.editionsSea.map((p) => 나라[p].slice(0, 9))],
        /* ⚠ ' makers' 를 그냥 자르면 「German car」가 된다. 말이 되게 바꾼다 */
        줄: 두꺼운.map((k) => [k.label.replace(' car makers', ' cars').replace(' and watchmakers', ''),
          ...d.editionsSea.map((p) => String(k.판별[p]))]),
        아래: `Read across a row, not down a column. The other ${d.kinds.length - 두꺼운.length} kinds `
          + 'hold too few fully-covered brands to show here. The order of the four countries '
          + 'changes from row to row, and that is the finding.',
      },
      {
        꼴: '없는것',
        제목: 'What is not in here',
        목록: [
          'Who buys what — this counts encyclopaedia reads, not sales',
          'Who fronts which house — Wikidata records no ambassador relation at all',
          'A Korean-vs-German car multiple — only one Korean marque has all four articles',
        ],
        아래: 'The Thai Wikipedia has an article on BMW, Mercedes-Benz and Porsche,\n'
          + 'and none on Hyundai. That is a gap in an encyclopaedia, not in a market.',
      },
      {
        꼴: '끝',
        제목: 'Rank 22 brands\ntogether and each\ncountry gets one\nposition — an average\nof two opposite\nbehaviours',
        글: `**${나라[흔]}** first on cars, last on luxury.\n`
          + `**${나라[d.kinds.find((k) => k.key === 'luxury').차례[0]]}** does the reverse.`,
        길: `${주소}/brand-kinds`,
        곁: 'Wikidata (CC0) · Wikimedia Pageviews · Aug 2025 – Jul 2026',
      },
    ],
  };
}

/**
 * 감독 벌 — 81편째 기사의 표(`/sea-athletes`).
 * ⭐ 이야기 한 줄: **한국인 감독은 자기를 뽑은 나라에서만 읽힌다.**
 */
export function 감독벌짓기(d) {
  const 나라 = Object.fromEntries(d.editions.map((e) => [e.code, e.country]));
  const 감독 = d.footballManagers.slice(0, 5);
  const 선수 = d.footballPlayers.slice(0, 5);
  const 맨위 = 감독[0];

  return {
    갈피: 'sea-athletes',
    빛: '#c9a6ff',
    사이트: 'K CULTURE WIRE',
    주소,
    카드: [
      {
        꼴: '표지',
        위: 'Southeast Asia · 12 months',
        큰: 'A Korean manager\nis read in exactly\none country',
        아래: `${맨위.name} takes **${맨위.topSharePc}%** of his four-country readership in `
          + `${나라[맨위.topEdition]} alone.`,
      },
      {
        꼴: '수',
        제목: 'Players spread.\nManagers do not',
        큰: `${d.medianTopSharePlayers}% vs ${d.medianTopShareManagers}%`,
        곁: 'Median share sitting in one country — players, then managers',
        아래: 'A person read evenly across the four lands near **25%**.\n'
          + 'A person read in one country only lands at **100%**.',
      },
      {
        꼴: '표',
        제목: 'Read where\nhe was hired',
        머리: ['Manager', ...d.editions.map((e) => e.country.slice(0, 9))],
        줄: 감독.slice(0, 4).map((m) => [m.name,
          ...d.editions.map((e) => (m.perMillion[e.code] === null ? '—' : String(m.perMillion[e.code])))]),
        아래: 'Read the columns across a row, not down one. The same names appear everywhere and '
          + 'the numbers move by a factor of tens between countries.',
      },
      {
        꼴: '없는것',
        제목: 'What is not in here',
        목록: [
          'Which role a reader came for — Wikidata records both for anyone who played then managed',
          'Popularity — this counts people looking someone up',
          'The Philippines — the Tagalog Wikipedia is too small to measure with',
        ],
        아래: `That is why managers sit in their own table and are not ranked\n`
          + `against the ${선수.length ? 선수[0].name : 'players'} of this world.`,
      },
      {
        꼴: '끝',
        제목: 'In two of these\nfour countries,\nthe most-read Korean\nin football never\nplayed there',
        글: `**${감독.map((m) => m.name).slice(0, 3).join(' · ')}** —\n`
          + 'each read in the country whose national team he took,\nand almost nowhere else.',
        길: `${주소}/sea-athletes`,
        곁: 'Wikidata (CC0) · Wikimedia Pageviews · Aug 2025 – Jul 2026',
      },
    ],
  };
}

/** ⛔ 주소가 모든 장에 있어야 한다 — 외부유입용이다 */
export function 주소빠진장(한벌, 그린것들) {
  return 그린것들.map((h, i) => (h.includes(주소) ? null : i)).filter((x) => x !== null);
}

const 굵게 = (s) => String(s ?? '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

export function 카드HTML(c, i, 전체, 벌) {
  const 번호 = `<div class="no">${i + 1} / ${전체}</div>`;
  /* 🔴 주소는 **모든 장**에 있다. 두 번째 장에서 넘기다 만 사람도 우리를 찾아야 한다 */
  const 발 = `<div class="foot"><span class="brand">${벌.사이트}</span><span class="dom">${벌.주소}</span></div>`;
  let 속;
  if (c.꼴 === '표지') {
    속 = `<div class="hat">${굵게(c.위)}</div>`
      + `<h1>${굵게(c.큰)}</h1>`
      + `<p class="sub">${굵게(c.아래)}</p>`;
  } else if (c.꼴 === '수') {
    속 = `<h2>${굵게(c.제목)}</h2>`
      + `<div class="big">${굵게(c.큰)}</div>`
      + `<div class="side">${굵게(c.곁)}</div>`
      + `<p class="body">${굵게(c.아래)}</p>`;
  } else if (c.꼴 === '표') {
    const 머리 = c.머리.map((h) => `<th>${h}</th>`).join('');
    const 줄 = c.줄.map((r) => `<tr>${r.map((v, j) => `<td${j === 0 ? ' class="nm"' : ''}>${v}</td>`).join('')}</tr>`).join('');
    속 = `<h2>${굵게(c.제목)}</h2>`
      + `<table><thead><tr>${머리}</tr></thead><tbody>${줄}</tbody></table>`
      + `<p class="body">${굵게(c.아래)}</p>`;
  } else if (c.꼴 === '없는것') {
    속 = `<h2 class="warn">${굵게(c.제목)}</h2>`
      + `<ul>${c.목록.map((m) => `<li>${굵게(m)}</li>`).join('')}</ul>`
      + `<p class="body">${굵게(c.아래)}</p>`;
  } else {
    속 = `<h2>${굵게(c.제목)}</h2>`
      + `<p class="body big-body">${굵게(c.글)}</p>`
      + `<div class="url">${c.길}</div>`
      + `<div class="src">${굵게(c.곁)}</div>`;
  }
  return `<style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${폭}px;height:${높}px;background:#0e0c14;color:#e9e6dd;overflow:hidden;
         font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
         padding:86px 78px 74px;display:flex;flex-direction:column;justify-content:center;position:relative}
    b{color:${벌.빛}}
    .no{position:absolute;top:52px;right:78px;font-size:26px;color:#6a6478;letter-spacing:.08em}
    .hat{font-size:32px;font-weight:700;color:${벌.빛};letter-spacing:.1em;margin-bottom:34px}
    h1{font-size:80px;font-weight:900;line-height:1.14;letter-spacing:-.03em}
    h2{font-size:60px;font-weight:900;line-height:1.16;letter-spacing:-.02em;margin-bottom:34px}
    h2.warn{color:${벌.빛}}
    .sub{margin-top:40px;font-size:34px;line-height:1.5;color:#a49bb8}
    .big{font-size:104px;font-weight:900;color:${벌.빛};letter-spacing:-.03em;line-height:1.05}
    .side{margin-top:16px;font-size:28px;color:#8f88a0}
    .body{margin-top:36px;font-size:33px;line-height:1.55;color:#cdc6dc}
    .big-body{font-size:36px}
    table{width:100%;border-collapse:collapse;font-size:32px}
    th{text-align:left;font-size:26px;color:#8f88a0;font-weight:700;padding:0 0 14px;
       border-bottom:2px solid #2a2438}
    td{padding:17px 0;border-bottom:1px solid #221d30;color:#cdc6dc}
    td.nm{font-weight:800;color:#e9e6dd}
    ul{margin-top:6px}
    li{list-style:none;font-size:32px;line-height:1.45;color:#cdc6dc;margin-bottom:22px;
       padding-left:34px;position:relative}
    li:before{content:'—';position:absolute;left:0;color:${벌.빛}}
    .url{margin-top:44px;font-size:44px;font-weight:900;color:${벌.빛};letter-spacing:-.02em}
    .src{margin-top:16px;font-size:25px;color:#6a6478}
    .foot{position:absolute;left:78px;right:78px;bottom:52px;display:flex;justify-content:space-between;
          font-size:25px;color:#6a6478;letter-spacing:.06em}
    .brand{font-weight:800;color:#8f7ab5}
  </style>${번호}${속}${발}`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  /* ⚠ 카드 HTML 은 길다. 실패해도 **앞 200자만** 보인다 — 안 그러면 화면이 덮인다 */
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) { 통 += 1; return; }
    실 += 1;
    console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 200)}`);
  };
  /** ⚠ `<style>` 안까지 글자로 세면 CSS 낱말이 걸린다. 스타일을 먼저 지운다 */
  const 본문만 = (s) => s.replace(/<style>[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
  const d = JSON.parse(fs.readFileSync('src/data/wikitip-fame-compare.json', 'utf8'));
  const 벌 = 한벌짓기(d);
  const 그린것 = 벌.카드.map((c, i) => 카드HTML(c, i, 벌.카드.length, 벌));

  재본다('⚠ 다섯 장까지', 벌.카드.length, (n) => n <= 최대장수);
  재본다('✅ 「없는 것」 장이 있다 — 우리가 파는 것이다',
    벌.카드.some((c) => c.꼴 === '없는것'), true);
  재본다('🔴 주소가 **모든 장**에 있다 — 외부유입용이다', 주소빠진장(벌, 그린것), []);
  재본다('세로 4:5 — 스레드가 안 자른다', [폭, 높], [1080, 1350]);
  const 다본문 = 본문만(그린것.join(' ')).toLowerCase();
  재본다('⛔ 겁주는 말이 없다', 다본문.slice(0, 60),
    () => !/(right now|don't miss|you'll regret|hurry)/.test(다본문));
  /**
   * ⛔ 「인기」라고 **주장**하지 않는다.
   * ⚠ 그런데 「이건 인기가 아니다」라고 **부정하는** 자리에는 그 낱말이 나온다.
   *   처음엔 낱말만 보고 잡았다가 그 자리에서 걸렸다 — 검사가 뭉툭했다.
   *   → 「없는 것」 장 밖에서만 잡는다. 거기가 부정하는 자리다.
   */
  const 주장하는장 = 벌.카드.map((c, i) => (c.꼴 === '없는것' ? null : 본문만(그린것[i]).toLowerCase()))
    .filter(Boolean).join(' ');
  재본다('⛔ 「인기」라고 주장하지 않는다', '없는것 장 밖',
    () => !/popular(?!ity — this counts)/.test(주장하는장));
  재본다('✅ 「인기가 아니다」라고 못 박은 자리는 있다', '없는것 장',
    () => 벌.카드.some((c, i) => c.꼴 === '없는것' && 본문만(그린것[i]).toLowerCase().includes('popularity')));
  /* 🔴 수가 자료에서 왔나 — 손으로 박으면 여기서 걸린다 */
  재본다('BTS 값이 자료에서 왔다', 본문만(그린것[1]).slice(0, 90),
    () => 본문만(그린것[1]).includes(String(d.topActorTotal)));
  재본다('선수 값과 이름이 자료에서 왔다', '표지+수 장',
    () => 본문만(그린것[1]).includes(String(d.topAthleteTotal))
      && 본문만(그린것[0]).includes(d.topAthleteName));
  재본다('브랜드 값이 자료에서 왔다', 본문만(그린것[4]).slice(0, 90),
    () => 본문만(그린것[4]).includes(String(d.topBrandTotal))
      && 본문만(그린것[4]).includes(d.topBrandName));
  재본다('표의 가운데값이 자료에서 왔다', 본문만(그린것[2]).slice(0, 90),
    () => 본문만(그린것[2]).includes(String(d.groups.find((g) => g.group === 'athletes').median)));
  재본다('마지막 장에 들어올 주소가 크게 있다', '끝 장',
    () => 본문만(그린것[4]).includes('/fame-compare'));
  재본다('출처를 적었다', '끝 장', () => 본문만(그린것[4]).includes('Wikidata'));

  /* 🔴 사장님 지시는 「**매일** 낸다」다. 벌이 하나뿐이면 내일 낼 것이 없다 */
  재본다('벌이 하나가 아니다', Object.keys(벌목록).length, (n) => n >= 2);
  /**
   * 🔴 2026-08-14 — 브랜드 벌의 표 제목이 「Five kinds」인데 표에는 **셋**만 있었다.
   *   얇은 갈래를 뺀 것은 옳았는데 제목을 안 고쳤다. ⛔ 제목이 표보다 크면 그 자체가 거짓말이다.
   *   여기서 **모든 벌**의 표 제목에 든 수를 실제 줄 수와 견준다.
   */
  for (const [이름, 재료] of Object.entries(벌목록)) {
    const 벌 = 재료.만들기(JSON.parse(fs.readFileSync(재료.자료, 'utf8')));
    for (const 장 of 벌.카드.filter((c) => c.꼴 === '표')) {
      const 셈말 = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
      const 든수 = String(장.제목).toLowerCase().match(/\b(two|three|four|five|six|seven|\d+)\b/);
      if (!든수) continue;
      const 말한값 = 셈말[든수[1]] ?? +든수[1];
      재본다(`${이름} 표 제목의 수가 줄 수와 같다`, 말한값, (n) => n === 장.줄.length);
    }
  }
  for (const [이름, 재료] of Object.entries(벌목록)) {
    const 그자료 = JSON.parse(fs.readFileSync(재료.자료, 'utf8'));
    const 그벌 = 재료.만들기(그자료);
    const 그린 = 그벌.카드.map((c, i) => 카드HTML(c, i, 그벌.카드.length, 그벌));
    재본다(`${이름} — 다섯 장까지`, 그벌.카드.length, (n) => n <= 최대장수);
    재본다(`${이름} — 「없는 것」 장이 있다`, 그벌.카드.some((c) => c.꼴 === '없는것'), true);
    재본다(`${이름} — 주소가 모든 장에`, 주소빠진장(그벌, 그린), []);
    재본다(`${이름} — 빈 칸이 안 샌다`, 본문만(그린.join(' ')),
      (s) => !/undefined|NaN|\[object/.test(s));
  }
  console.log(`카드뉴스 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 값 = (깃발, 기본) => {
    const i = process.argv.indexOf(깃발);
    return i >= 0 ? process.argv[i + 1] : 기본;
  };
  const 벌이름 = 값('--벌', 'fame');
  if (!벌목록[벌이름]) {
    console.error(`⛔ 그런 벌이 없다 — ${벌이름}. 있는 것: ${Object.keys(벌목록).join(' · ')}`);
    process.exit(1);
  }
  const 낼방 = 값('--out', `public/wikitip/cardnews/${벌이름}`);
  fs.mkdirSync(낼방, { recursive: true });

  const 재료 = 벌목록[벌이름];
  const d = JSON.parse(fs.readFileSync(재료.자료, 'utf8'));
  const 벌 = 재료.만들기(d);
  if (벌.카드.length > 최대장수) { console.error(`⛔ ${벌.카드.length}장 — ${최대장수}장까지다`); process.exit(1); }

  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--font-render-hinting=none'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 폭, height: 높, deviceScaleFactor: 1 });

  for (let n = 0; n < 벌.카드.length; n += 1) {
    const html = 카드HTML(벌.카드[n], n, 벌.카드.length, 벌);
    await p.setContent(html, { waitUntil: 'load' });
    const 길 = path.join(낼방, `${String(n + 1).padStart(2, '0')}.png`);
    await p.screenshot({ path: 길 });
    console.log(`   ${길}  ${(fs.statSync(길).size / 1024).toFixed(0)}KB`);
  }
  await b.close();
  console.log(`\n✅ ${낼방} — ${벌.카드.length}장 · ${폭}×${높}`);
}
