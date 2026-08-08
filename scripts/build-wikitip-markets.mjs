#!/usr/bin/env node
/**
 * **시장 한 곳씩** — 93개 시장 각각에 실을 자료를 만든다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-09 05:3x 에 광고 23.0억을 갈라 보니, 지금 지면 79장으로는 지면당 월 13.5만 PV 가
 * 있어야 하는 수였다. **재고가 없다.** 그런데 우리는 이미 93개 시장 자료를 들고 있다 —
 * `/catalogue-depth` 한 장에 **93줄을 접어** 넣어 두었을 뿐이다.
 * ⭐ 그리고 손님이 검색하는 말이 그것이다 — 「Korean shows in Vietnam」.
 *
 * ── ⛔ 얇은 지면을 찍어 내지 않는다 ────────────────────────────
 * 나라×작품 조합이면 88,000장이 나온다. **안 만든다.** 얇은 지면은 색인이 안 되고 벌점이다.
 * 한 장에 그 시장의 **작품 표**가 실려야 지면이다. 표가 없으면 그 시장은 지면을 안 낸다.
 *
 * ── ⛔ 순위표로 줄세우지 않는다 ────────────────────────────────
 * 「어느 나라가 1등인가」를 만들지 않는다. 각 장은 **자기 시장**을 말하고,
 * 견줄 때는 **가운데값과 견주며 왜 다른지**를 같이 낸다.
 *
 * 결과 → src/data/wikitip-markets.json
 * 쓰는 법: node scripts/build-wikitip-markets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 깊이 = 'src/data/wikitip-catalogue-depth.json';
const 낼곳 = 'src/data/wikitip-markets.json';
/** 한 장에 실을 작품 수. ⛔ 이보다 적게 걸린 시장은 **지면을 안 낸다** */
export const 표에실을것 = 20;
export const 지면낼최소작품 = 8;

/** 주소로 쓸 이름. 시장 이름은 손님이 검색창에 치는 말이라 **알아볼 수 있게** 남긴다 */
export function 주소이름(이름) {
  return 이름.normalize('NFC').toLowerCase()
    .replace(/[’'`.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 가운데값. ⛔ 평균을 쓰지 않는다 — 한 시장이 크면 평균이 끌려간다 */
export function 가운데(수들) {
  if (!수들.length) return null;
  const s = [...수들].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : +((s[m - 1] + s[m]) / 2).toFixed(2);
}

/** 가운데값과 견준 말. ⛔ 「좋다·나쁘다」로 적지 않는다 */
export function 견줌말(값, 가운데값) {
  if (가운데값 == null || !Number.isFinite(값)) return null;
  const 배 = 값 / 가운데값;
  if (배 >= 1.5) return 'well above';
  if (배 >= 1.1) return 'above';
  if (배 > 0.9) return 'near';
  if (배 > 0.66) return 'below';
  return 'well below';
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('주소 이름', 주소이름('South Korea'), 'south-korea');
  재본다('점·따옴표를 지운다', 주소이름("Côte d'Ivoire"), (s) => !s.includes("'") && s.length > 3);
  재본다('끝 빗금 없음', 주소이름('United States '), 'united-states');
  재본다('가운데값 — 홀수', 가운데([3, 1, 2]), 2);
  재본다('가운데값 — 짝수', 가운데([1, 2, 3, 4]), 2.5);
  재본다('빈 것은 null', 가운데([]), null);
  재본다('견줌 — 한참 위', 견줌말(30, 10), 'well above');
  재본다('견줌 — 비슷', 견줌말(10.5, 10), 'near');
  재본다('견줌 — 한참 아래', 견줌말(5, 10), 'well below');
  /* ⛔ 지면 문턱이 표에 실을 수보다 크면 **표가 빈 지면**이 나온다 */
  재본다('문턱이 표보다 작다', 지면낼최소작품 <= 표에실을것, true);
  console.log(실패 ? `⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  const ko = koreanTitleFilter();
  const 깊이자료 = JSON.parse(fs.readFileSync(깊이, 'utf8'));
  const 깊이줄 = new Map(깊이자료.countries.map((c) => [c.iso2, c]));

  /** iso2 → { name, 작품: Map(제목 → {자리, 최고, 주:Set, 첫, 끝}), 주:Set, 해별: Map(해 → 자리) } */
  const 시장 = new Map();
  let 창첫 = '9999-99-99'; let 창끝 = '0000-00-00';

  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    if (r.주 < 창첫) 창첫 = r.주;
    if (r.주 > 창끝) 창끝 = r.주;
    if (!ko.keepTitle(r.제목)) continue;
    if (!시장.has(r.iso2)) 시장.set(r.iso2, { name: r.국가, 작품: new Map(), 주: new Set(), 해별: new Map() });
    const m = 시장.get(r.iso2);
    m.주.add(r.주);
    const 해 = r.주.slice(0, 4);
    m.해별.set(해, (m.해별.get(해) || 0) + 1);
    if (!m.작품.has(r.제목)) m.작품.set(r.제목, { 자리: 0, 최고: 99, 주: new Set(), 첫: '9999-99-99', 끝: '0000-00-00' });
    const t = m.작품.get(r.제목);
    t.자리 += 1;
    if (r.순위 < t.최고) t.최고 = r.순위;
    t.주.add(r.주);
    if (r.주 < t.첫) t.첫 = r.주;
    if (r.주 > t.끝) t.끝 = r.주;
  }

  const 줄 = [];
  for (const [iso2, m] of 시장) {
    const d = 깊이줄.get(iso2);
    if (!d) continue;                       // 깊이 지면이 안 세는 시장은 여기서도 안 센다
    const 작품 = [...m.작품].map(([title, t]) => ({
      title, places: t.자리, peak: t.최고, weeks: t.주.size, first: t.첫, last: t.끝,
    })).sort((a, b) => b.places - a.places || a.title.localeCompare(b.title));
    줄.push({
      iso2,
      name: d.name,
      slug: 주소이름(d.name),
      koreanSlots: d.koreanSlots,
      koreanPc: d.koreanPc,
      distinctTitles: d.distinctTitles,
      halfTakes: d.halfTakes,
      topTitle: d.topTitle,
      topTitlePc: d.topTitlePc,
      inAsianTen: d.inAsianTen,
      weeksWithKorean: m.주.size,
      firstKoreanWeek: 작품.reduce((a, x) => (x.first < a ? x.first : a), '9999-99-99'),
      byYear: [...m.해별].sort((a, b) => a[0].localeCompare(b[0])).map(([y, v]) => ({ year: +y, places: v })),
      titles: 작품.slice(0, 표에실을것),
      titlesShown: Math.min(작품.length, 표에실을것),
    });
  }
  줄.sort((a, b) => a.name.localeCompare(b.name));

  /* 가운데값 — 각 장이 「나는 어디쯤인가」를 말할 때 쓴다. ⛔ 줄세우기가 아니다 */
  const 가운데값 = {
    koreanPc: 가운데(줄.map((x) => x.koreanPc)),
    distinctTitles: 가운데(줄.map((x) => x.distinctTitles)),
    halfTakes: 가운데(줄.map((x) => x.halfTakes)),
  };
  for (const x of 줄) {
    x.vsMedian = {
      koreanPc: 견줌말(x.koreanPc, 가운데값.koreanPc),
      distinctTitles: 견줌말(x.distinctTitles, 가운데값.distinctTitles),
      halfTakes: 견줌말(x.halfTakes, 가운데값.halfTakes),
    };
    x.hasPage = x.titlesShown >= 지면낼최소작품;
  }

  /* ── 스스로 본다. 틀리면 파일을 안 낸다 ── */
  for (const x of 줄) {
    const 표합 = x.titles.reduce((s, t) => s + t.places, 0);
    if (표합 > x.koreanSlots) throw new Error(`${x.name}: 표에 실은 자리 ${표합} 가 그 시장 전체 ${x.koreanSlots} 보다 크다`);
    if (x.titles.some((t) => t.peak < 1 || t.peak > 10)) throw new Error(`${x.name}: 순위가 1~10 밖이다`);
    if (x.titles.some((t) => t.weeks > t.places)) throw new Error(`${x.name}: 주 수가 자리 수보다 많다`);
    const 해합 = x.byYear.reduce((s, y) => s + y.places, 0);
    if (해합 !== x.koreanSlots) throw new Error(`${x.name}: 해별 합 ${해합} 가 전체 ${x.koreanSlots} 와 다르다`);
  }
  const 슬롯합 = 줄.reduce((s, x) => s + x.koreanSlots, 0);
  const 깊이합 = 깊이자료.countries.reduce((s, c) => s + c.koreanSlots, 0);
  if (슬롯합 !== 깊이합) throw new Error(`자리 합 ${슬롯합} 이 /catalogue-depth 의 ${깊이합} 과 다르다 — 두 지면이 다른 말을 하게 된다`);

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists; Korean titles identified via Wikidata country of origin (P495 = Q884) and by Wikidata item number where we hold one',
    weekFrom: 창첫,
    weekTo: 창끝,
    weekCount: 깊이자료.weekCount,
    countryCount: 줄.length,
    /** 지면을 내는 시장 — 표가 얇은 곳은 안 낸다. ⛔ 이 수를 손으로 적지 않는다 */
    pageCount: 줄.filter((x) => x.hasPage).length,
    titlesPerPage: 표에실을것,
    minTitlesForPage: 지면낼최소작품,
    medians: 가운데값,
    markets: 줄,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));
  console.log(`시장 ${out.countryCount}곳 · 지면을 낼 곳 **${out.pageCount}곳** (작품 ${지면낼최소작품}편 이상)`);
  console.log(`가운데값 — 한국 몫 ${가운데값.koreanPc}% · 서로 다른 작품 ${가운데값.distinctTitles}편 · 절반을 채우는 편수 ${가운데값.halfTakes}`);
  console.log(`⚠ 지면을 안 내는 곳 ${out.countryCount - out.pageCount}곳 — 표가 얇아서다. 얇은 지면은 안 찍는다`);
  console.log(`→ ${낼곳}`);
}
