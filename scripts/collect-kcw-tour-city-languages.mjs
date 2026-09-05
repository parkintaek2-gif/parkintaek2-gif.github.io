#!/usr/bin/env node
/**
 * collect-kcw-tour-city-languages.mjs — **순회공연이 가는 도시의 «말»로는 누가 읽나.**
 *
 * ── 🔴 왜 만드나 (2026-09-05 밤, 포털 연예면에서 왔다) ──────────
 * 다음 연예면 「많이 본 뉴스」에 유노윤호가 올라 있었다. 재 보니 그는 지금
 * **아시아 일곱 도시를 도는 첫 단독 순회공연** 중이고, 오늘(9/5)이 타이베이,
 * 9/12 자카르타, 9/26 홍콩이다.
 *
 * ⭐ 남들이 내는 것 — 「어느 도시, 어느 날, 표는 언제」. 우리는 그것을 못 이긴다.
 * ⭐ **우리 축** — 「그 도시의 말로 그를 읽는 사람이 하루 몇 명인가.」
 *   순회공연은 «가는 곳»을 고르는 일이다. 그 고른 곳과 «읽히는 곳»이 같은지를
 *   아무도 안 쟀다. 위키백과 언어판 열람수가 그것을 잰다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **열람수를 인기로 읽지 않는다.** 백과사전 문서를 하루 몇 번 열었나일 뿐이다.
 * ⛔ **문서가 없는 것을 0 으로 세지 않는다.** 「문서 자체가 없다」와 「있는데 안 읽힌다」는
 *   전혀 다른 말이다. 앞의 것은 `null` 로 두고 화면에도 그렇게 낸다.
 * ⛔ **도시의 말을 하나로 못 박지 않는다.** 싱가포르는 영어·중국어·말레이어·타밀어가 공용이다.
 *   한 도시에 여러 말을 달고, 그 말을 고른 «까닭»을 자료에 함께 적는다.
 * ⛔ **표를 몇 장 팔았나를 말하지 않는다.** 우리는 그것을 못 잰다 — 못 쟀다고 적는다.
 * ⛔ 일정 날짜를 우리 수처럼 쓰지 않는다. 날짜는 «온 까닭»이지 우리가 잰 것이 아니다.
 *
 * 쓰는 법
 *   node scripts/collect-kcw-tour-city-languages.mjs --자가시험
 *   node scripts/collect-kcw-tour-city-languages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');
const 낼곳 = path.join(뿌리, 'src', 'data', 'wikitip-tour-city-languages.json');
const 머리 = { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' };

/**
 * 🔴 도시마다 «그곳에서 쓰는 말»을 손으로 달았다. 규칙인 척하지 않는다.
 *   싱가포르에 넷을 단 것도, 마카오에 포르투갈어를 단 것도 손판정이다.
 *   ⚠ 위키백과 언어판은 «나라»가 아니라 «말»로 나뉜다. 홍콩·마카오·타이베이가
 *     같은 zh 를 나눠 쓰는 것이 그래서다 — 세 도시의 수가 같은 우물에서 나온다.
 *     그 겹침을 숨기지 않고 자료에 적는다.
 */
export const 도시말 = {
  Seoul: { country: 'South Korea', wikis: ['ko'], note: 'Korean' },
  Macau: { country: 'Macau', wikis: ['zh', 'pt'], note: 'Chinese and Portuguese are both official' },
  Singapore: { country: 'Singapore', wikis: ['en', 'zh', 'ms', 'ta'], note: 'four official languages' },
  Bangkok: { country: 'Thailand', wikis: ['th'], note: 'Thai' },
  Taipei: { country: 'Taiwan', wikis: ['zh'], note: 'Chinese' },
  Jakarta: { country: 'Indonesia', wikis: ['id'], note: 'Indonesian' },
  'Hong Kong': { country: 'Hong Kong', wikis: ['zh', 'yue'], note: 'Chinese, and Cantonese has its own edition' },
};

/** 하루 평균 — ⛔ 나눌 것이 없으면 0 이 아니라 null 이다 */
export function 하루평균(합, 날수) {
  if (!Number.isFinite(합) || !Number.isFinite(날수) || 날수 <= 0) return null;
  return Math.round((합 / 날수) * 10) / 10;
}

/** 문서가 없는 것과 0 번 읽힌 것을 가른다 */
export function 읽힘꼴(문서있나, 하루) {
  if (!문서있나) return '문서 없음';
  if (하루 === null) return '못 쟀다';
  return String(하루);
}

/** 한 도시가 쓰는 말 가운데 문서가 있는 말은 몇 개인가 */
export function 도시의문서수(도시, 문서있는말) {
  const w = 도시말[도시]?.wikis ?? [];
  return w.filter((x) => 문서있는말.includes(x)).length;
}

/** YYYYMMDD — 열람수 API 가 쓰는 꼴. ⛔ toISOString 을 쓰지 않는다(UTC 라 새벽에 하루 어긋난다) */
export function 날짜꼴(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/**
 * 사람이 읽는 창 — 「5 August – 3 September 2026」.
 * ⛔ `20260805–20260903` 을 지면에 내지 않는다. 우리 손님은 영어권 독자이고,
 *   그 여덟 자리 수는 기계가 쓰는 꼴이지 사람이 읽는 꼴이 아니다.
 */
export function 사람보기창(첫, 끝) {
  const 자 = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${자(첫)} – ${자(끝)} ${끝.getFullYear()}`;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('하루 평균을 낸다', 하루평균(300, 30), 10);
  같나('소수 첫째자리까지', 하루평균(100, 30), 3.3);
  같나('⛔ 날수가 0 이면 0 이 아니라 null', 하루평균(300, 0), null);
  같나('⛔ 합이 없으면 null', 하루평균(null, 30), null);
  같나('합이 0 이면 0 이다 — 이건 진짜 0', 하루평균(0, 30), 0);

  /* 🔴 이것이 이 자의 심장이다 — 「문서가 없다」와 「0 번 읽혔다」는 다른 말이다 */
  같나('⛔ 문서가 없으면 0 이라 안 쓴다', 읽힘꼴(false, null), '문서 없음');
  같나('⛔ 문서가 없으면 수가 있어도 문서 없음이다', 읽힘꼴(false, 12), '문서 없음');
  같나('문서가 있고 못 쟀으면 못 쟀다', 읽힘꼴(true, null), '못 쟀다');
  같나('문서가 있고 0 이면 0 이다', 읽힘꼴(true, 0), '0');
  같나('문서가 있고 수가 있으면 그 수다', 읽힘꼴(true, 12.5), '12.5');

  같나('싱가포르는 말이 넷이다', 도시말.Singapore.wikis.length, 4);
  같나('타이베이와 홍콩이 zh 를 나눠 쓴다',
    도시말.Taipei.wikis.includes('zh') && 도시말['Hong Kong'].wikis.includes('zh'), true);
  같나('도시의 문서 수를 센다', 도시의문서수('Singapore', ['en', 'zh', 'id']), 2);
  같나('하나도 없으면 0', 도시의문서수('Bangkok', ['en']), 0);
  같나('⛔ 없는 도시는 0', 도시의문서수('Paris', ['en']), 0);

  같나('날짜꼴은 이 PC 시간 그대로 쓴다', 날짜꼴(new Date(2026, 8, 5)), '20260905');
  같나('한 자리 달·날을 채운다', 날짜꼴(new Date(2026, 0, 9)), '20260109');

  /* ⛔ 여덟 자리 수는 기계 꼴이다. 지면에는 사람이 읽는 꼴로 낸다 */
  같나('창을 사람이 읽는 꼴로 낸다',
    사람보기창(new Date(2026, 7, 5), new Date(2026, 8, 3)), '5 August – 3 September 2026');
  같나('달을 넘지 않아도 같은 꼴이다',
    사람보기창(new Date(2026, 0, 1), new Date(2026, 0, 31)), '1 January – 31 January 2026');

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 순회 도시 말 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────────── */
async function 사이트링크(qid) {
  const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers: 머리 });
  if (!r.ok) return null;
  const j = await r.json();
  const e = j?.entities?.[qid];
  if (!e) return null;
  const 것 = {};
  for (const [k, v] of Object.entries(e.sitelinks ?? {})) {
    if (!k.endsWith('wiki') || k.endsWith('quotewiki') || k.endsWith('newswiki')) continue;
    것[k.replace(/wiki$/, '').replace(/_/g, '-')] = v.title;
  }
  return 것;
}

async function 열람수(wiki, 제목, 처음, 끝) {
  const u = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${wiki}.wikipedia`
    + `/all-access/user/${encodeURIComponent(제목.replace(/ /g, '_'))}/daily/${처음}/${끝}`;
  const r = await fetch(u, { headers: 머리 });
  if (!r.ok) return null;
  const j = await r.json();
  const 항 = j?.items ?? [];
  if (!항.length) return null;
  return { 합: 항.reduce((a, x) => a + (x.views ?? 0), 0), 날수: 항.length };
}

if (내가실행됐다) {
  const 사람 = { qid: 'Q495352', label: 'U-Know Yunho', enTitle: 'Yunho' };
  const 끝날 = new Date(); 끝날.setDate(끝날.getDate() - 2);      /* 어제치는 아직 안 들어온다 */
  const 첫날 = new Date(끝날); 첫날.setDate(첫날.getDate() - 29);
  const 처음 = 날짜꼴(첫날); const 끝 = 날짜꼴(끝날);

  const 링크 = await 사이트링크(사람.qid);
  if (!링크) { console.error('⛔ 위키데이터에서 문서 목록을 못 받았다 — 못 쟀다'); process.exit(1); }

  const 쓸말 = [...new Set(Object.values(도시말).flatMap((c) => c.wikis))];
  const 말줄 = [];
  for (const w of 쓸말) {
    const 제목 = 링크[w] ?? null;
    if (!제목) { 말줄.push({ wiki: w, title: null, exists: false, perDay: null, days: null }); continue; }
    const v = await 열람수(w, 제목, 처음, 끝);
    말줄.push({ wiki: w, title: 제목, exists: true, perDay: 하루평균(v?.합 ?? null, v?.날수 ?? 0), days: v?.날수 ?? null });
  }

  const 문서있는말 = 말줄.filter((r) => r.exists).map((r) => r.wiki);
  const 도시줄 = Object.entries(도시말).map(([city, c]) => ({
    city,
    country: c.country,
    note: c.note,
    wikis: c.wikis,
    withArticle: 도시의문서수(city, 문서있는말),
    ofLanguages: c.wikis.length,
    perDay: c.wikis.map((w) => ({ wiki: w, perDay: 말줄.find((x) => x.wiki === w)?.perDay ?? null,
      exists: 말줄.find((x) => x.wiki === w)?.exists ?? false })),
  }));

  const 낼것 = {
    measuredAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    window: 사람보기창(첫날, 끝날),
    windowRaw: `${처음}–${끝}`,
    person: 사람,
    whatThisIs: 'Daily average Wikipedia article views for one touring Korean artist, in each language '
      + 'spoken in the cities the tour visits. Views are page opens, not people and not ticket sales.',
    tourNote: 'The seven cities are the ones announced for U-KNOW PROJECT 26 SCENE#1. We take the city '
      + 'list as the reason for asking the question; the per-city dates are not our measurement.',
    notMeasured: [
      'Ticket sales, attendance or revenue in any city. We have no source for those and do not estimate them',
      'How many people. A view is a page open; one person can open a page many times, and many people share addresses',
      'Whether a language edition being absent means nobody there knows the artist. It means no encyclopedia article exists in that language',
    ],
    languages: 말줄,
    cities: 도시줄,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2) + '\n', 'utf8');
  console.log(`📁 적었다 — ${path.relative(뿌리, 낼곳)}  (창 ${처음}–${끝})`);
  for (const r of 말줄) {
    console.log(`   ${r.wiki.padEnd(4)} ${r.exists ? String(r.perDay).padStart(8) + '/일' : '   문서 없음'}  ${r.title ?? ''}`);
  }
}
