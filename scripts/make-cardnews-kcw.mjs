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
};

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
