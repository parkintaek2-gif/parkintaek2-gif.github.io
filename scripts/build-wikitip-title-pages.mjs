#!/usr/bin/env node
/**
 * **작품 한 편씩** (`/title/<slug>`). 2번 지시 08:2x — 「작품 지면을 오늘 낼 수 있는 만큼」.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 기사는 57편인데 지면이 130장이다. 광고 재고도 B2B 미끼도 다 **지면**에서 나온다.
 * 차트에 오른 한국 작품이 938편이고, 이것이 우리가 가진 **제일 큰 덩어리**다.
 *
 * ── ⛔ 얇으면 안 낸다 ─────────────────────────────────────────
 * ⛔ `/market/<slug>` 가 세운 선 그대로다 — **자료 줄이 모자라면 지면을 안 만든다.**
 *    한 장에 실을 줄은 셋을 더한 것이다: **닿은 시장 + 붙은 회사 + 붙은 배우.**
 *    문턱 아래 작품은 `hasPage: false` 로 두고, 목록에는 **남긴다**(없는 척하지 않는다).
 * ⛔ 나라×작품 88,000장은 **안 만든다.** 5번이 정한 선이고 여기서도 그대로다.
 * ⛔ **줄세우지 않는다.** 시장을 「많이 본 순」으로 안 놓는다 — **가나다순**으로 놓고 수를 옆에 적는다.
 * ⛔ **취향을 평가하지 않는다.** 「인기 있다」가 아니라 몇 자리를 차지했나를 적는다.
 * ⚠ 이름이 같은 두 작품이 한 주소로 겹치면 **둘 다 안 낸다.** 겹친 채로 내면 남의 수를 보여 준다.
 *
 * 결과 → src/data/wikitip-title-pages.json
 * 쓰는 법: node scripts/build-wikitip-title-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 회사판 = 'archive/raw/netflix-top10/firm-works.json';
const 출연판 = 'archive/raw/netflix-top10/korean-cast-joined.json';
const 낼곳 = 'src/data/wikitip-title-pages.json';

/** 한 장에 이만큼은 실려야 지면을 낸다. ⛔ 내리려면 까닭을 여기 적고 내린다 */
export const 지면낼최소줄 = 6;

/** 주소 조각. 영문·숫자만 남기고 나머지는 하이픈으로 */
export function 슬러그(제목) {
  const s = String(제목)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s;
}

/** 가운데값. 빈 것은 **0 이 아니라 null** */
export function 가운데값(a) {
  if (!a.length) return null;
  const v = [...a].sort((x, y) => x - y);
  const m = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  return +m.toFixed(1);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('슬러그 — 보통', 슬러그('Squid Game'), 'squid-game');
  재본다('슬러그 — 문장부호', 슬러그('Money Heist: Korea - Joint Economic Area'), 'money-heist-korea-joint-economic-area');
  재본다('슬러그 — 꼬리 하이픈을 뗀다', 슬러그('Hello!!'), 'hello');
  재본다('슬러그 — 대소문자를 눌러 LAND 와 Land 가 같아진다', 슬러그('LAND'), 슬러그('Land'));
  재본다('슬러그 — 숫자를 남긴다', 슬러그('Squid Game 2'), 'squid-game-2');
  재본다('가운데값 — 홀수', 가운데값([3, 1, 2]), 2);
  재본다('가운데값 — 짝수', 가운데값([1, 2, 3, 4]), 2.5);
  재본다('가운데값 — 빈 것은 null', 가운데값([]), null);
  console.log(`자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  await 만들기();
}

export async function 만들기() {
  const ko = koreanTitleFilter();

  /** 제목 → 자료 */
  const T = new Map();
  let 첫주 = null; let 끝주 = null;
  const 주전체 = new Set();

  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const 줄 of rl) {
    if (!줄.trim()) continue;
    let r;
    try { r = JSON.parse(줄); } catch { continue; }
    if (r.iso2 === 'RU') continue; // 넷플릭스가 러시아에서 나갔다. 다른 지면과 같게 뺀다
    주전체.add(r.주);
    if (!첫주 || r.주 < 첫주) 첫주 = r.주;
    if (!끝주 || r.주 > 끝주) 끝주 = r.주;
    if (!ko.keepTitle(r.제목)) continue;
    if (!T.has(r.제목)) T.set(r.제목, { 구분: r.구분, 시장: new Map(), 주: new Set(), 해: new Map() });
    const t = T.get(r.제목);
    t.주.add(r.주);
    const 해 = r.주.slice(0, 4);
    t.해.set(해, (t.해.get(해) || 0) + 1);
    if (!t.시장.has(r.iso2)) t.시장.set(r.iso2, { iso2: r.iso2, name: r.국가, places: 0, peak: 99, first: r.주, last: r.주 });
    const m = t.시장.get(r.iso2);
    m.places += 1;
    if (r.순위 < m.peak) m.peak = r.순위;
    if (r.주 < m.first) m.first = r.주;
    if (r.주 > m.last) m.last = r.주;
  }

  /* 회사 — 어느 회사가 어떤 자격으로 붙었나 */
  const F = JSON.parse(fs.readFileSync(회사판, 'utf8'));
  const 회사 = new Map();
  for (const f of F.firms) {
    for (const w of f.works) {
      if (!회사.has(w.title)) 회사.set(w.title, []);
      회사.get(w.title).push({ firm: f.firm, grade: f.grade, roles: w.roles });
    }
  }

  /* 배우 — 위키데이터에 한국 국적으로 잡힌 이름만 */
  const C = JSON.parse(fs.readFileSync(출연판, 'utf8'));
  const 출연 = new Map();
  for (const a of Object.values(C.배우)) {
    for (const 이름 of (a.작품이름 || [])) {
      if (!출연.has(이름)) 출연.set(이름, []);
      출연.get(이름).push({ name: a.이름, page: a.문서 || null });
    }
  }

  /* 주소가 겹치는 제목을 먼저 찾는다 — ⛔ 겹치면 둘 다 안 낸다 */
  const 슬러그별 = new Map();
  for (const 제목 of T.keys()) {
    const s = 슬러그(제목);
    if (!슬러그별.has(s)) 슬러그별.set(s, []);
    슬러그별.get(s).push(제목);
  }
  const 겹친주소 = [...슬러그별].filter(([, v]) => v.length > 1);

  /*
   * 주소가 겹칠 때 — ⛔ 「철자만 다르니 같은 작품이겠지」로 합치지 않는다.
   * ⭐ **열쇠에 물어본다.** `korean-titles-keyed.json` 에 Q번호가 붙은 쪽이 **딱 하나**면
   *   그 하나는 신원이 확인된 작품이므로 그것만 낸다. 다른 철자는 안 내고 까닭을 적으며,
   *   **낸 지면이 「저 철자를 안 합쳤다」고 스스로 말한다**(합쳤다고 오해하면 수를 잘못 읽는다).
   * ⛔ 둘 다 열쇠가 있거나 둘 다 없으면 **둘 다 안 낸다.** 고를 근거가 없다.
   */
  const 열쇠 = (() => {
    const k = JSON.parse(fs.readFileSync('archive/raw/netflix-top10/korean-titles-keyed.json', 'utf8'));
    return new Map(Object.values(k.작품).map((x) => [x.넷플릭스제목, x.q]));
  })();
  const 겹친제목 = new Set();
  /** 낼 쪽 제목 → 안 내는 다른 철자 */
  const 다른철자 = new Map();
  for (const [, v] of 겹친주소) {
    const 열쇠있는것 = v.filter((t) => 열쇠.has(t));
    if (열쇠있는것.length === 1) {
      for (const t of v) if (t !== 열쇠있는것[0]) 겹친제목.add(t);
      다른철자.set(열쇠있는것[0], v.filter((t) => t !== 열쇠있는것[0]));
    } else {
      for (const t of v) 겹친제목.add(t);
    }
  }

  const titles = [];
  for (const [제목, t] of T) {
    const 시장 = [...t.시장.values()].sort((a, b) => a.name.localeCompare(b.name));
    const 붙은회사 = (회사.get(제목) || []).slice().sort((a, b) => a.firm.localeCompare(b.firm));
    const 붙은배우 = (출연.get(제목) || []).slice().sort((a, b) => a.name.localeCompare(b.name));
    const rows = 시장.length + 붙은회사.length + 붙은배우.length;
    const s = 슬러그(제목);
    const 겹침 = 겹친제목.has(제목);
    titles.push({
      title: 제목,
      slug: s,
      type: t.구분,
      markets: 시장.length,
      places: 시장.reduce((x, m) => x + m.places, 0),
      weeks: t.주.size,
      peak: Math.min(...시장.map((m) => m.peak)),
      firstWeek: 시장.reduce((a, m) => (m.first < a ? m.first : a), 시장[0].first),
      lastWeek: 시장.reduce((a, m) => (m.last > a ? m.last : a), 시장[0].last),
      rows,
      hasPage: rows >= 지면낼최소줄 && !겹침,
      /* ⛔ 합치지 않은 다른 철자. 지면이 이것을 화면에 적는다 */
      otherSpellings: 다른철자.get(제목) || null,
      /* ⛔ 지면을 안 내는 까닭을 **작품마다** 적는다. 「없다」로 두면 다음 사람이 못 고친다 */
      noPageReason: 겹침
        ? 'another charting title resolves to the same address, so neither is published rather than showing one title\'s numbers under the other\'s name'
        : (rows >= 지면낼최소줄 ? null : `only ${rows} data rows — below the ${지면낼최소줄} this site requires before it publishes a page`),
      byMarket: 시장,
      firms: 붙은회사,
      cast: 붙은배우,
      byYear: [...t.해].sort((a, b) => a[0].localeCompare(b[0])).map(([y, p]) => ({ year: +y, places: p })),
    });
  }
  titles.sort((a, b) => a.title.localeCompare(b.title));

  const 낼것 = titles.filter((x) => x.hasPage);

  /* ── 스스로 본다 ── */
  if (!titles.length) throw new Error('작품이 하나도 안 잡혔다 — 자를 먼저 의심한다');
  for (const x of titles) {
    if (x.markets > 93) throw new Error(`${x.title}: 시장이 93 을 넘는다`);
    if (x.peak < 1 || x.peak > 10) throw new Error(`${x.title}: 최고 순위가 ${x.peak} 다`);
    if (x.places < x.markets) throw new Error(`${x.title}: 자리 수가 시장 수보다 적다`);
    if (x.rows !== x.byMarket.length + x.firms.length + x.cast.length) throw new Error(`${x.title}: 줄 수가 안 맞는다`);
    if (x.byYear.reduce((s, y) => s + y.places, 0) !== x.places) throw new Error(`${x.title}: 해별 자리 합이 전체와 다르다`);
    if (!x.hasPage && !x.noPageReason) throw new Error(`${x.title}: 지면을 안 내는데 까닭이 없다`);
    if (x.hasPage && x.noPageReason) throw new Error(`${x.title}: 지면을 내는데 안 내는 까닭이 적혀 있다`);
  }
  /* ⛔ 주소가 겹친 채로 나가면 남의 수를 보여 준다. 하나라도 있으면 멈춘다 */
  const 낼주소 = new Set();
  for (const x of 낼것) {
    if (낼주소.has(x.slug)) throw new Error(`주소가 겹친다: ${x.slug}`);
    낼주소.add(x.slug);
  }
  /* ⛔ 이 지면 무더기의 요지 — 얇으면 안 낸다 */
  const 낼줄 = 낼것.map((x) => x.rows);
  if (Math.min(...낼줄) < 지면낼최소줄) throw new Error('문턱 아래 지면이 섞여 있다');
  if (가운데값(낼줄) < 10) throw new Error(`낼 지면의 가운데 줄 수가 ${가운데값(낼줄)} 다 — 얇게 찍어 내는 것이다`);

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists for chart places; Wikidata for the companies credited on a title and for cast members recorded as Korean citizens, both retrieved by item number rather than by name',
    weekFrom: 첫주,
    weekTo: 끝주,
    weekCount: 주전체.size,
    marketCount: 93,
    /** ⛔ 지면이 이 문장을 그대로 싣는다 */
    unit: 'A place is one appearance in one country\'s weekly top 10. A title that sat at number 4 in Vietnam for three weeks holds three places there. Reach counts the countries a title appeared in at least once, out of 93.',
    cannotAnswer: 'A chart position is not a viewing figure. Netflix publishes hours viewed only for its global lists, so a title that charted in 40 small markets and one that charted in 40 large ones look identical here.',
    minRowsForPage: 지면낼최소줄,
    titleCount: titles.length,
    pageCount: 낼것.length,
    rowsMedianAll: 가운데값(titles.map((x) => x.rows)),
    rowsMedianPublished: 가운데값(낼줄),
    rowsTotalPublished: 낼줄.reduce((s, x) => s + x, 0),
    clashingSlugs: 겹친주소.map(([s, v]) => ({ slug: s, titles: v })),
    withFirms: titles.filter((x) => x.firms.length).length,
    withCast: titles.filter((x) => x.cast.length).length,
    medians: {
      markets: 가운데값(titles.map((x) => x.markets)),
      weeks: 가운데값(titles.map((x) => x.weeks)),
      places: 가운데값(titles.map((x) => x.places)),
    },
    titles,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out));

  console.log(`차트에 오른 한국 작품 ${out.titleCount}편 · 지면을 내는 것 **${out.pageCount}장** (문턱 ${지면낼최소줄}줄)`);
  console.log(`  한 장에 실리는 자료 줄 — 가운데값 ${out.rowsMedianPublished} · 다 합쳐 ${out.rowsTotalPublished.toLocaleString('en-US')}줄`);
  console.log(`  안 내는 것 ${out.titleCount - out.pageCount}편 — 목록에는 남기고 까닭을 작품마다 적었다`);
  console.log(`  회사가 붙은 작품 ${out.withFirms}편 · 배우가 붙은 작품 ${out.withCast}편`);
  console.log(`  가운데 작품 — 시장 ${out.medians.markets}곳 · 주 ${out.medians.weeks} · 자리 ${out.medians.places}`);
  if (out.clashingSlugs.length) {
    console.log(`  ⚠ 주소가 겹쳐 **둘 다 안 낸** 것 ${out.clashingSlugs.length}쌍 —`);
    for (const c of out.clashingSlugs) console.log(`     ${c.slug}: ${c.titles.join(' · ')}`);
  }
  console.log(`→ ${낼곳}`);
}
