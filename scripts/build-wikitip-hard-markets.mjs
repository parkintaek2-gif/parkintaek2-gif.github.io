#!/usr/bin/env node
/**
 * **어느 시장이 넓은 작품만 받나** — 배급 순서를 짜는 수.
 *
 * ── 왜 이 물음인가 ─────────────────────────────────────────────
 *   오늘 「언제」를 여럿 쟀다 — 들어온 자리·나가는 자리·버틴 주·가장 넓은 때.
 *   ⚠ 그런데 **어디를 먼저 얻고 어디를 마지막에 얻나**는 안 쟀다.
 *   ⭐ 다섯 나라짜리 작품에도 있는 시장이 있고, 예순 나라짜리라야 겨우 보이는 시장이 있다.
 *      그 둘을 아는 사람은 **어디부터 밀지**를 정할 수 있다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **줄세우지 않는다.** 93곳을 순서대로 늘어놓지 않는다 — 양 끝만 놓고 **왜 다른지**를 같이 적는다.
 * ⛔ 🔴 **「어렵다」와 「한국 작품을 적게 트는 곳」은 다른 말이다.**
 *    한국 작품 자체가 드문 시장은 큰 작품만 보이는 것이 당연하다.
 *    ⭐ 그래서 **그 시장의 한국 몫을 나란히 낸다.** 둘을 갈라 읽을 수 있게 한다.
 *    ⚠ 우리 자료로 그 둘을 **완전히 갈라내지는 못한다.** 그 한계를 지면에 적는다.
 * ⛔ 얇은 시장은 뺀다. 열 편 미만이면 가운데값이 한 편에 흔들린다.
 * ⛔ 작품 이름을 안 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼파일 = 'src/data/wikitip-hard-markets.json';

/** 한 시장에 이만큼 한국 작품이 와야 잰다. ⛔ 아래면 가운데값이 한 편에 흔들린다 */
export const 작품최소 = 10;

/** 몫. 밑이 0 이면 **0 이 아니라 null** */
export function 몫(a, b) {
  if (!b) return null;
  return +((100 * a) / b).toFixed(1);
}

/** 가운데값. ⛔ 빈 것은 0 이 아니라 null */
export function 가운데(들) {
  if (!들.length) return null;
  const s = [...들].sort((a, b) => a - b);
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : +((s[i - 1] + s[i]) / 2).toFixed(1);
}

/**
 * 두 수의 **묶음 안 견줌** — 한국 몫이 비슷한 시장끼리만 모은다.
 * ⛔ 「어렵다」가 「한국 작품이 드물다」와 같은 말이 아님을 보이려면 이것이 있어야 한다.
 */
export function 몫띠(한국몫) {
  if (한국몫 == null) return null;
  if (한국몫 < 5) return '5% 미만';
  if (한국몫 < 8) return '5–8%';
  if (한국몫 < 12) return '8–12%';
  return '12% 이상';
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  재본다('가운데 — 홀수', 가운데([5, 1, 3]), 3);
  재본다('가운데 — 짝수', 가운데([1, 2, 3, 4]), 2.5);
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  재본다('띠 — 낮은 쪽', 몫띠(3.2), '5% 미만');
  재본다('띠 — 가운데', 몫띠(9), '8–12%');
  재본다('띠 — 높은 쪽', 몫띠(20), '12% 이상');
  /* ⛔ 경계값 — 5 는 아래 띠가 아니라 위 띠다 */
  재본다('띠 — 경계는 위로', 몫띠(5), '5–8%');
  재본다('띠 — null 은 null', 몫띠(null), null);
  console.log(`어려운 시장 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(나라파일)) {
    console.log(`⛔ 원자료가 없다 — ${나라파일}`);
    console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
    process.exit(1);
  }
  const ko = koreanTitleFilter();

  /* 제목(구분·시즌 포함) → 간 나라 · 시장 → 그 시장에 온 한국 작품 · 시장별 자리 수 */
  const 작품나라 = new Map();
  const 시장작품 = new Map();
  const 시장이름 = new Map();
  const 시장자리 = new Map();
  const 시장한국자리 = new Map();
  let 줄 = 0;
  for (const line of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!line) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    시장이름.set(iso2, r.국가);
    시장자리.set(iso2, (시장자리.get(iso2) ?? 0) + 1);
    if (!ko.keepTitle(r.제목)) continue;
    시장한국자리.set(iso2, (시장한국자리.get(iso2) ?? 0) + 1);
    const k = `${r.구분}|${r.제목}|${r.시즌 ?? ''}`;
    if (!작품나라.has(k)) 작품나라.set(k, new Set());
    작품나라.get(k).add(iso2);
    if (!시장작품.has(iso2)) 시장작품.set(iso2, new Set());
    시장작품.get(iso2).add(k);
  }

  const 넓이 = new Map([...작품나라].map(([k, s]) => [k, s.size]));
  const 온작품수 = 작품나라.size;

  const markets = [...시장작품].map(([iso2, 작품들]) => {
    const 들 = [...작품들].map((k) => 넓이.get(k));
    const 한국몫 = 몫(시장한국자리.get(iso2) ?? 0, 시장자리.get(iso2) ?? 0);
    return {
      iso2,
      name: 시장이름.get(iso2),
      koreanTitles: 작품들.size,
      /* ⭐ 이 시장에 온 한국 작품들이 **평균 몇 나라짜리**였나. 클수록 넓은 작품만 온 것이다*/
      medianBreadth: 가운데(들),
      /* 다섯 나라 이하 작품이 이 시장의 몇 %인가 — 작은 작품이 얼마나 오나 */
      narrowTitlePc: 몫(들.filter((n) => n <= 5).length, 들.length),
      koreanSharePc: 한국몫,
      band: 몫띠(한국몫),
    };
  }).filter((m) => m.koreanTitles >= 작품최소)
    .sort((a, b) => b.medianBreadth - a.medianBreadth);

  /* ── 스스로 본다 ── */
  if (!markets.length) throw new Error('시장이 하나도 안 남았다 — 문턱을 의심한다');
  for (const m of markets) {
    if (m.medianBreadth < 1) throw new Error(`${m.name} — 가운데 넓이가 ${m.medianBreadth}`);
    if (m.medianBreadth > 93) throw new Error(`${m.name} — 가운데 넓이가 93 을 넘는다`);
    if (m.narrowTitlePc != null && (m.narrowTitlePc < 0 || m.narrowTitlePc > 100)) {
      throw new Error(`${m.name} — 좁은 작품 몫이 ${m.narrowTitlePc}`);
    }
  }

  /*
   * 🔴 **띠 안에서도 갈리나** — 한국 몫이 비슷한 시장끼리 모아 본다.
   *   갈리면 「어렵다」는 「한국 작품이 드물다」와 다른 말이다.
   *   안 갈리면 둘은 같은 것이고, 그때는 그렇게 적어야 한다.
   */
  const 띠별 = new Map();
  for (const m of markets) {
    if (!m.band) continue;
    if (!띠별.has(m.band)) 띠별.set(m.band, []);
    띠별.get(m.band).push(m);
  }
  const byBand = ['5% 미만', '5–8%', '8–12%', '12% 이상'].map((b) => {
    const 들 = 띠별.get(b) ?? [];
    const 넓 = 들.map((m) => m.medianBreadth);
    return {
      band: b,
      markets: 들.length,
      medianBreadth: 가운데(넓),
      spread: 들.length ? +(Math.max(...넓) - Math.min(...넓)).toFixed(1) : null,
    };
  });

  const 넓은쪽 = markets.slice(0, 5);
  const 좁은쪽 = markets.slice(-5).reverse();

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, 2021-07-04 to 2026-07-26, Russia excluded.',
    question: 'Some markets carry Korean titles that went almost nowhere else. Others only ever show the '
      + 'ones that went everywhere. Knowing which is which is how a release order gets built.',
    unit: 'Breadth is the total number of countries a title reached at any point. For each market we take '
      + 'the median breadth of the Korean titles that appeared there: a high number means only wide titles '
      + 'get in, a low number means narrow ones do too.',
    whyNotARanking: 'The full order of 93 markets is not published, because a league table of countries '
      + 'invites a reading this data cannot support. The two ends are shown with the figure that explains '
      + 'most of the difference beside them.',
    whatCannotBeSeparated: 'A market that carries few Korean titles at all will mechanically show only the '
      + 'biggest ones, so "hard to reach" and "rarely plays Korean titles" are entangled. The Korean share '
      + 'of each market is printed beside its breadth so the two can be read apart, and the markets are '
      + 'also grouped into bands of similar Korean share. What we cannot do is separate them completely.',
    rowsRead: 줄,
    titlesMeasured: 온작품수,
    marketMinTitles: 작품최소,
    marketsMeasured: markets.length,
    widestOnly: 넓은쪽,
    narrowToo: 좁은쪽,
    byBand,
    cannotAnswer: 'This says which titles appeared, not why. Licensing windows, dubbing, local release '
      + 'dates and how crowded a chart is would all produce this pattern, and none of them is in a rank '
      + 'table. It is also not viewing: a title outside a top 10 is invisible here at any level.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')} · 작품 ${온작품수.toLocaleString('en-US')} · 시장 ${markets.length}곳(한국 작품 ${작품최소}편 이상)`);
  console.log('\n넓은 작품만 오는 쪽');
  for (const m of 넓은쪽) console.log(`  ${m.name.padEnd(22)} 가운데 넓이 ${String(m.medianBreadth).padStart(4)} · 좁은 작품 ${String(m.narrowTitlePc).padStart(4)}% · 한국 몫 ${m.koreanSharePc}% · 한국 작품 ${m.koreanTitles}`);
  console.log('좁은 작품도 오는 쪽');
  for (const m of 좁은쪽) console.log(`  ${m.name.padEnd(22)} 가운데 넓이 ${String(m.medianBreadth).padStart(4)} · 좁은 작품 ${String(m.narrowTitlePc).padStart(4)}% · 한국 몫 ${m.koreanSharePc}% · 한국 작품 ${m.koreanTitles}`);
  console.log('\n한국 몫 띠 안에서도 갈리나');
  for (const b of byBand) console.log(`  ${b.band.padEnd(8)} 시장 ${String(b.markets).padStart(3)} · 가운데 넓이 ${String(b.medianBreadth).padStart(4)} · 띠 안 폭 ${b.spread}`);
  console.log(`→ ${낼파일}`);
}
