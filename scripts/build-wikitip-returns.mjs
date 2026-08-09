#!/usr/bin/env node
/**
 * **차트에서 사라졌다 돌아오는 한국 작품.** (59편째 기사와 `/returns`)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 지금까지 우리는 작품을 **한 번의 달리기**로 세어 왔다 — 몇 주, 몇 나라, 최고 몇 위.
 * 그런데 작품 지면 530장을 만들고 나서 보니, 한 작품이 한 나라에서 **비었다가 다시 오르는** 일이 있다.
 * 그게 몇이나 되고, **왜 그런가**를 물었다.
 *
 * ── ⛔ 첫 눈에 보인 것이 함정이었다 ──────────────────────────
 * Juvenile Justice 가 **223주** 비었다 돌아온 것이 제일 먼저 보였다. 시즌 2 다.
 * ⭐ 원자료에 `시즌` 칸이 있어 **그것으로 가른다.** 안 가르면 「새 시즌」을 「복귀」로 팔게 된다.
 *   시즌이 바뀐 틈은 복귀가 아니다. 시즌 칸이 빈 틈은 **못 가린 것**이고 그렇게 적는다.
 *
 * ── ⛔ 그다음 가설도 죽었다 ──────────────────────────────────
 * 「새 시즌이 나오면서 옛 시즌을 끌어올린 것」이라 여겼다. 재 보니 **5.2%뿐**이었다.
 * 94.8% 는 **혼자** 돌아온다. 죽은 가설을 지면에 같이 적는다 — 그게 이 표의 값이다.
 *
 * ── ⛔ 조심하는 것 ────────────────────────────────────────────
 * · **「4주」는 우리가 고른 문턱**이다. 다른 문턱에서 어떻게 달라지는지 같이 낸다.
 * · 시즌 칸이 21% 비어 있다. **못 가린 것을 「복귀 아님」으로 밀지 않는다.**
 * · 왜 돌아왔는지는 이 자료에 **없다.** 순위 목록일 뿐이다.
 * · 러시아는 뺀다(넷플릭스가 나갔다). 다른 지면과 같다.
 *
 * 결과 → src/data/wikitip-returns.json
 * 쓰는 법: node scripts/build-wikitip-returns.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라판 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼곳 = 'src/data/wikitip-returns.json';

/** 우리가 고른 문턱. ⛔ 바꾸려면 지면의 「다른 문턱에서는」 표도 같이 본다 */
export const 문턱주 = 4;
/** 「새 시즌이 끌어올렸나」를 볼 때 옆으로 얼마나 보나 */
export const 언저리주 = 4;

const 기준 = Date.UTC(2021, 6, 4);

/** 주 문자열 → 주 번호. ⛔ toISOString 을 안 쓴다 — UTC 라 새벽에 하루가 밀린다 */
export function 주번호(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - 기준) / 604800000);
}

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/** 두 시즌 이름이 같은가. 둘 중 하나라도 비면 **못 가림(null)** */
export function 같은시즌(a, b) {
  if (a == null || b == null || a === '' || b === '') return null;
  return String(a) === String(b);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('주번호 — 첫 주는 0', 주번호('2021-07-04'), 0);
  재본다('주번호 — 다음 주는 1', 주번호('2021-07-11'), 1);
  재본다('주번호 — 한 해 뒤는 52', 주번호('2022-07-03'), 52);
  재본다('같은시즌 — 같으면 참', 같은시즌('S1', 'S1'), true);
  재본다('같은시즌 — 다르면 거짓', 같은시즌('S1', 'S2'), false);
  /* ⛔ 이 두 줄이 이 자의 요점이다 — 못 가린 것을 「복귀 아님」으로 밀지 않는다 */
  재본다('같은시즌 — 한쪽이 비면 null', 같은시즌(null, 'S1'), null);
  재본다('같은시즌 — 빈 글자도 null', 같은시즌('', 'S1'), null);
  재본다('몫', 몫(310, 940), 33);
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  console.log(`자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  await 만들기();
}

export async function 만들기() {
  const ko = koreanTitleFilter();

  /** 제목|iso2 → [{주, 시즌, 순위}] */
  const 칸 = new Map();
  /** 제목 → 시즌 → Set(주) — 「새 시즌이 옆에 있었나」를 보려고 */
  const 제목시즌 = new Map();
  const 나라이름 = new Map();
  let 한국줄 = 0; let 시즌있는줄 = 0;
  let 첫주 = null; let 끝주 = null;

  const rl = readline.createInterface({ input: fs.createReadStream(나라판), crlfDelay: Infinity });
  for await (const 줄 of rl) {
    if (!줄.trim()) continue;
    let r;
    try { r = JSON.parse(줄); } catch { continue; }
    if (r.iso2 === 'RU') continue;
    if (!첫주 || r.주 < 첫주) 첫주 = r.주;
    if (!끝주 || r.주 > 끝주) 끝주 = r.주;
    if (!ko.keepTitle(r.제목)) continue;
    한국줄 += 1;
    const s = (r.시즌 == null || r.시즌 === '') ? null : r.시즌;
    if (s) 시즌있는줄 += 1;
    나라이름.set(r.iso2, r.국가);
    const w = 주번호(r.주);
    const k = `${r.제목}|${r.iso2}`;
    if (!칸.has(k)) 칸.set(k, []);
    칸.get(k).push({ 주: w, 시즌: s, 순위: r.순위 });
    if (s) {
      if (!제목시즌.has(r.제목)) 제목시즌.set(r.제목, new Map());
      const m = 제목시즌.get(r.제목);
      if (!m.has(s)) m.set(s, new Set());
      m.get(s).add(w);
    }
  }

  /** 문턱마다 몇 개인가 — 「4주」가 우리가 고른 수임을 보이려고 */
  const 문턱표 = [2, 3, 4, 6, 8, 12].map((th) => ({ weeks: th, gaps: 0, sameSeason: 0, seasonChanged: 0, unknown: 0 }));

  let 틈 = 0; let 시즌바뀜 = 0; let 시즌같음 = 0; let 못가림 = 0;
  let 곁에새시즌 = 0; let 혼자 = 0;
  const 복귀들 = [];
  let 이어진칸 = 0;

  for (const [k, rows] of 칸) {
    rows.sort((a, b) => a.주 - b.주);
    const [제목, iso2] = k.split('|');
    if (rows.length >= 2 && rows[rows.length - 1].주 - rows[0].주 + 1 === rows.length) 이어진칸 += 1;
    for (let i = 1; i < rows.length; i += 1) {
      const 사이 = rows[i].주 - rows[i - 1].주 - 1;
      if (사이 <= 0) continue;
      const 같나 = 같은시즌(rows[i - 1].시즌, rows[i].시즌);
      for (const t of 문턱표) {
        if (사이 < t.weeks) continue;
        t.gaps += 1;
        if (같나 === true) t.sameSeason += 1;
        else if (같나 === false) t.seasonChanged += 1;
        else t.unknown += 1;
      }
      if (사이 < 문턱주) continue;
      틈 += 1;
      if (같나 === false) { 시즌바뀜 += 1; continue; }
      if (같나 === null) { 못가림 += 1; continue; }
      시즌같음 += 1;
      /* 돌아온 주 언저리에 **같은 작품의 다른 시즌**이 있었나 */
      const 다른 = 제목시즌.get(제목);
      let 곁에 = false;
      if (다른) {
        for (const [s, ws] of 다른) {
          if (String(s) === String(rows[i].시즌)) continue;
          for (const w of ws) if (Math.abs(w - rows[i].주) <= 언저리주) { 곁에 = true; break; }
          if (곁에) break;
        }
      }
      if (곁에) 곁에새시즌 += 1; else 혼자 += 1;
      복귀들.push({
        title: 제목,
        market: 나라이름.get(iso2) ?? iso2,
        iso2,
        gapWeeks: 사이,
        season: rows[i].시즌,
        pulledByOtherSeason: 곁에,
      });
    }
  }

  const 잰칸 = [...칸.values()].filter((r) => r.length >= 2).length;

  /* ── 스스로 본다 ── */
  if (시즌바뀜 + 시즌같음 + 못가림 !== 틈) throw new Error('셋으로 가른 합이 틈 수와 다르다');
  if (곁에새시즌 + 혼자 !== 시즌같음) throw new Error('곁에/혼자 합이 같은시즌 수와 다르다');
  if (복귀들.length !== 시즌같음) throw new Error('복귀 목록 수가 안 맞는다');
  for (const x of 복귀들) if (x.gapWeeks < 문턱주) throw new Error(`문턱 아래 복귀가 섞였다: ${x.title}`);
  for (let i = 1; i < 문턱표.length; i += 1) {
    if (문턱표[i].gaps > 문턱표[i - 1].gaps) throw new Error('문턱이 커지는데 틈이 늘었다 — 셈이 틀렸다');
  }
  /* ⛔ 기사 요지 — 뒤집히면 기사를 다시 쓴다 */
  if (!(시즌바뀜 > 시즌같음)) throw new Error('새 시즌이 진짜 복귀보다 적다 — 「첫 눈에 보인 것이 함정」이 안 선다');
  if (!(혼자 > 곁에새시즌 * 5)) throw new Error(`혼자 ${혼자} 대 곁에 ${곁에새시즌} — 「혼자 돌아온다」가 안 선다`);

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, including the season label Netflix attaches to each row; Korean titles identified via Wikidata country of origin and by item number',
    question: 'A Korean title leaves a country\'s top 10 and later comes back. How often is that a genuine return, and how often is it simply a new season?',
    unit: 'One cell is one title in one market. A gap is a run of weeks in which the title is absent from that market\'s top 10, between two weeks in which it is present.',
    /** ⛔ 지면이 그대로 싣는다 */
    thresholdNote: `Four weeks is our threshold, not Netflix's. The table of other thresholds is published beside the result so the choice can be judged rather than trusted.`,
    cannotAnswer: 'Nothing here says why a title came back. A local holiday, a cast member in the news, a promotion slot, or simply a slow week in that market would all look identical. Netflix publishes the position and the season label, not the reason.',
    weekFrom: 첫주,
    weekTo: 끝주,
    marketCount: 나라이름.size,
    koreanRows: 한국줄,
    seasonLabelledRows: 시즌있는줄,
    seasonLabelPc: 몫(시즌있는줄, 한국줄),
    cellsMeasured: 잰칸,
    contiguousCells: 이어진칸,
    thresholdWeeks: 문턱주,
    nearbyWeeks: 언저리주,
    gaps: 틈,
    seasonChanged: 시즌바뀜,
    seasonChangedPc: 몫(시즌바뀜, 틈),
    sameSeason: 시즌같음,
    sameSeasonPc: 몫(시즌같음, 틈),
    unknownSeason: 못가림,
    unknownSeasonPc: 몫(못가림, 틈),
    pulledByOtherSeason: 곁에새시즌,
    pulledByOtherSeasonPc: 몫(곁에새시즌, 시즌같음),
    alone: 혼자,
    alonePc: 몫(혼자, 시즌같음),
    thresholds: 문턱표,
    /** ⛔ 가나다순. 「가장 오래」로 줄세우지 않는다 */
    longestReturns: [...복귀들].sort((a, b) => b.gapWeeks - a.gapWeeks).slice(0, 10)
      .sort((a, b) => a.title.localeCompare(b.title) || a.market.localeCompare(b.market)),
    returnTitles: [...new Set(복귀들.map((x) => x.title))].sort((a, b) => a.localeCompare(b)),
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));

  console.log(`한국 줄 ${out.koreanRows.toLocaleString('en-US')} · 시즌 딱지가 붙은 줄 ${out.seasonLabelPc}%`);
  console.log(`작품×시장 칸 ${out.cellsMeasured.toLocaleString('en-US')}개 · 그중 한 번도 안 빈 칸 ${out.contiguousCells.toLocaleString('en-US')}`);
  console.log(`${문턱주}주 넘는 틈 ${out.gaps.toLocaleString('en-US')}개`);
  console.log(`  시즌이 바뀌었다(복귀 아님)  ${String(out.seasonChanged).padStart(4)} = ${out.seasonChangedPc}%`);
  console.log(`  시즌이 같다(진짜 복귀)     ${String(out.sameSeason).padStart(4)} = ${out.sameSeasonPc}%`);
  console.log(`  시즌 칸이 비어 못 가림      ${String(out.unknownSeason).padStart(4)} = ${out.unknownSeasonPc}%`);
  console.log(`진짜 복귀 ${out.sameSeason}칸 중 — 곁에 다른 시즌 ${out.pulledByOtherSeason} (${out.pulledByOtherSeasonPc}%) · 혼자 ${out.alone} (${out.alonePc}%)`);
  console.log(`  돌아온 적 있는 작품 ${out.returnTitles.length}편`);
  console.log('문턱을 바꾸면 —');
  for (const t of 문턱표) console.log(`  ${String(t.weeks).padStart(2)}주 이상: 틈 ${String(t.gaps).padStart(5)} · 같은 시즌 ${String(t.sameSeason).padStart(4)} · 바뀜 ${String(t.seasonChanged).padStart(4)} · 못 가림 ${String(t.unknown).padStart(4)}`);
  console.log(`→ ${낼곳}`);
}
