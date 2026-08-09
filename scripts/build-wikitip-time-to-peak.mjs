#!/usr/bin/env node
/**
 * **언제 가장 넓게 퍼지나** — 돈 쓸 때를 정하는 수.
 *
 * ── 왜 이 물음인가 ─────────────────────────────────────────────
 *   오늘 들어온 자리(/opening) · 나가는 자리(/exit) · 버틴 주(/run-length)를 다 쟀다.
 *   ⚠ 그런데 **한 작품이 몇 주째에 가장 많은 나라에 동시에 올라 있나**는 안 쟀다.
 *   ⭐ 그것이 「밀어 줄 때」를 정하는 수다 —
 *      첫 주에 가장 넓다면 미는 것은 **개봉 전**이고, 3주째라면 **개봉 뒤**다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ 🔴 **한 나라짜리 작품은 물음 자체가 없다.** 첫 주에 「가장 넓다」가 저절로 참이다.
 *    문턱을 두고, 문턱 아래를 몇 편 뺐는지 적는다.
 * ⛔ 🔴 **자료 끝에 걸린 작품은 아직 더 넓어질 수 있다.** 마지막 주에 아직 차트에 있으면 뺀다.
 * ⛔ **한국 아닌 것도 같이 잰다.** 「첫 주가 가장 넓다」는 어디서나 참일 수 있다.
 * ⛔ 영화와 시리즈를 안 섞는다 — 오늘 재 보니 둘이 다르게 버틴다.
 * ⛔ 같은 넓이면 **이른 주**를 잡는다. 늦은 주를 잡으면 작품마다 답이 달라진다.
 * ⛔ 작품을 줄세우지 않는다. 이름을 안 낸다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const 나라파일 = 'archive/raw/netflix-top10/countries.ndjson';
const 낼파일 = 'src/data/wikitip-time-to-peak.json';

/** 몇 나라 이상 간 작품만 본다. ⛔ 한 나라짜리는 물음이 없다 */
export const 나라문턱 = 5;

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
 * 주별 나라 수에서 **가장 넓은 주가 몇 번째 주인가**를 찾는다.
 * ⛔ 같은 넓이면 **이른 주**다. 1부터 센다(첫 주 = 1).
 * @param 주별 [{주, 나라수}] — 주는 정렬돼 있어야 한다
 * @returns { 몇째주, 넓이, 첫주넓이 } · 빈 것은 null
 */
export function 가장넓은때(주별) {
  if (!주별.length) return null;
  let 몇째 = 1; let 넓이 = 주별[0].나라수;
  for (let i = 1; i < 주별.length; i += 1) {
    if (주별[i].나라수 > 넓이) { 넓이 = 주별[i].나라수; 몇째 = i + 1; }
  }
  return { 몇째주: 몇째, 넓이, 첫주넓이: 주별[0].나라수 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const ㅈ = (...n) => n.map((나라수, i) => ({ 주: `w${i}`, 나라수 }));
  재본다('몫 — 밑이 0 이면 null', 몫(1, 0), null);
  재본다('가운데 — 빈 것은 null', 가운데([]), null);
  재본다('가운데 — 짝수', 가운데([1, 2, 3, 4]), 2.5);
  재본다('첫 주가 가장 넓다', 가장넓은때(ㅈ(9, 4, 2)), { 몇째주: 1, 넓이: 9, 첫주넓이: 9 });
  재본다('셋째 주가 가장 넓다', 가장넓은때(ㅈ(2, 5, 9, 3)), { 몇째주: 3, 넓이: 9, 첫주넓이: 2 });
  /* ⛔ 같은 넓이면 이른 주 — 늦은 주를 잡으면 작품마다 답이 달라진다 */
  재본다('같은 넓이면 이른 주', 가장넓은때(ㅈ(9, 9, 9)), { 몇째주: 1, 넓이: 9, 첫주넓이: 9 });
  재본다('한 주짜리', 가장넓은때(ㅈ(3)), { 몇째주: 1, 넓이: 3, 첫주넓이: 3 });
  재본다('빈 것은 null', 가장넓은때([]), null);
  console.log(`퍼지는 때 수집기 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(나라파일)) {
    console.log(`⛔ 원자료가 없다 — ${나라파일}`);
    console.log('   ⚠ archive/ 는 git 에 안 올라간다. 「안 됐다」가 아니라 **못 쟀다**.');
    process.exit(1);
  }
  const ko = koreanTitleFilter();

  const 온주 = new Set();
  /* 열쇠에 구분·시즌을 넣는다. ⛔ 빠지면 한 주 top10 에 나란히 앉은 시즌이 뭉개진다 */
  const 작품 = new Map();
  let 줄 = 0;
  for (const line of fs.readFileSync(나라파일, 'utf8').split('\n')) {
    if (!line) continue;
    줄 += 1;
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    const iso2 = String(r.iso2).toUpperCase();
    if (iso2 === 'RU') continue;
    온주.add(r.주);
    const k = `${r.구분}|${r.제목}|${r.시즌 ?? ''}`;
    if (!작품.has(k)) {
      작품.set(k, { 구분: r.구분, 한국: ko.keepTitle(r.제목), 주별: new Map() });
    }
    const m = 작품.get(k);
    if (!m.주별.has(r.주)) m.주별.set(r.주, new Set());
    m.주별.get(r.주).add(iso2);
  }
  const 마지막주 = [...온주].sort().pop();

  /*
   * 🔴🔴 **교란 — 오래 가는 작품이 늦게 정점을 찍는 것은 당연하다.**
   *   오늘 /run-length 에서 한국 시리즈가 3.72주 · 그 밖 시리즈가 2.71주였다.
   *   길면 「나중 주」가 더 많으니 첫 주에 정점일 확률이 저절로 낮아진다.
   *   ⭐ 죽이는 법 — **차트에 있던 주 수를 묶고** 그 안에서만 견준다.
   */
  const 띠이름 = (주수) => (주수 <= 2 ? '1–2주' : 주수 <= 4 ? '3–4주' : 주수 <= 8 ? '5–8주' : '9주 이상');
  const 만든다 = () => ({ 몇째: [], 첫주에: 0, 넓이: [], 끝에걸림: 0, 얇아서뺌: 0, 넷째까지: 0, 띠별: new Map() });
  const 통 = {
    '한국 시리즈': 만든다(), '그 밖 시리즈': 만든다(),
    '한국 영화': 만든다(), '그 밖 영화': 만든다(),
  };
  const 무리 = (한국, 구분) => `${한국 ? '한국' : '그 밖'} ${구분 === 'Films' ? '영화' : '시리즈'}`;

  for (const m of 작품.values()) {
    const 칸 = 통[무리(m.한국, m.구분)];
    if (!칸) continue;
    const 주정 = [...m.주별.keys()].sort();
    const 온나라 = new Set();
    for (const s of m.주별.values()) for (const c of s) 온나라.add(c);
    if (온나라.size < 나라문턱) { 칸.얇아서뺌 += 1; continue; }
    /* ⛔ 마지막 주에 아직 있으면 더 넓어질 수 있다 — 뺀다 */
    if (주정[주정.length - 1] === 마지막주) { 칸.끝에걸림 += 1; continue; }
    const 주별 = 주정.map((w) => ({ 주: w, 나라수: m.주별.get(w).size }));
    const g = 가장넓은때(주별);
    칸.몇째.push(g.몇째주);
    칸.넓이.push(g.넓이);
    if (g.몇째주 === 1) 칸.첫주에 += 1;
    /* ⭐ 띠별 — 같은 길이끼리만 견준다 */
    const 띠 = 띠이름(주별.length);
    if (!칸.띠별.has(띠)) 칸.띠별.set(띠, { 수: 0, 첫주에: 0 });
    const b = 칸.띠별.get(띠);
    b.수 += 1;
    if (g.몇째주 === 1) b.첫주에 += 1;
    if (g.몇째주 <= 4) 칸.넷째까지 += 1;
  }

  const byGroup = Object.entries(통).map(([이름, c]) => ({
    group: 이름,
    titles: c.몇째.length,
    droppedThin: c.얇아서뺌,
    droppedOpenEnded: c.끝에걸림,
    medianWeek: 가운데(c.몇째),
    peakInWeekOnePc: 몫(c.첫주에, c.몇째.length),
    peakByWeekFourPc: 몫(c.넷째까지, c.몇째.length),
    latestWeek: c.몇째.length ? Math.max(...c.몇째) : null,
    medianWidth: 가운데(c.넓이),
    byLengthBand: ['1–2주', '3–4주', '5–8주', '9주 이상'].map((띠) => {
      const b = c.띠별.get(띠);
      return { band: 띠, titles: b ? b.수 : 0, peakInWeekOnePc: b ? 몫(b.첫주에, b.수) : null };
    }),
  }));

  /* ── 스스로 본다 ── */
  for (const g of byGroup) {
    if (!g.titles) throw new Error(`${g.group} — 잰 작품이 하나도 없다`);
    if (g.medianWeek < 1) throw new Error(`${g.group} — 가운데 주가 ${g.medianWeek}`);
    if (g.peakInWeekOnePc > g.peakByWeekFourPc) {
      throw new Error(`${g.group} — 첫 주 몫이 넷째 주까지 몫보다 크다`);
    }
    if (g.peakByWeekFourPc > 100) throw new Error(`${g.group} — 넷째 주까지 몫이 ${g.peakByWeekFourPc}`);
    if (g.medianWidth < 나라문턱) throw new Error(`${g.group} — 가운데 넓이가 문턱보다 작다`);
  }

  const out = {
    generated: new Date().toISOString(),
    source: 'Netflix Top 10 (Tudum) weekly country lists, 2021-07-04 to 2026-07-26, Russia excluded.',
    question: 'A title that travels is on several country charts at once, and that number rises and then '
      + 'falls. The week it is highest is the week the title is at its widest. When does that happen — '
      + 'and is there anything left to push after it?',
    unit: 'Width is how many countries held the title in the same week. The peak week is counted from the '
      + 'title\'s first chart week anywhere, so week 1 is the week it first appears.',
    threshold: `Only titles that reached at least ${나라문턱} countries in total are measured. Below that the `
      + 'question does not exist: a title in one or two markets is at its widest almost by default.',
    whyOpenEndedRemoved: 'A title still on a chart in the last week we hold could still get wider, so its '
      + 'peak week is not yet known. Those are removed and counted separately.',
    whyOthersToo: 'Peaking in the first week could be true of every title on Netflix. Every non-Korean title '
      + 'is measured the same way, and films and series are never mixed.',
    rowsRead: 줄,
    countryThreshold: 나라문턱,
    byGroup,
    /*
     * ⛔ 무리별 첫 주 몫을 **여기 따로 안 담는다.** byGroup 이 이미 들고 있다.
     *   같은 것을 두 곳에 담으면 언젠가 둘이 어긋나고, 어긋난 쪽이 화면에 나간다.
     *   ⚠ 오늘 새벽 wikitip-deepened.json 에서 같은 자리를 한 번 겪었다.
     * ⛔ 그리고 이 주석의 두 이름이 한 번 사라졌었다 — 셸이 백틱을 명령으로 먹었다.
     *   긴 글은 Write 로 쓰고 node 로 붙인다. 셸 히어독에 백틱을 넣지 않는다.
     */
    cannotAnswer: 'Width is a count of charts, not of people. A title can be in more countries and be watched '
      + 'less, and a title one place outside a top 10 is invisible here. This also cannot say what made a '
      + 'title widen — a marketing push, a holiday and a dubbing release all look the same in a rank table.',
  };
  fs.writeFileSync(낼파일, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`줄 ${줄.toLocaleString('en-US')} · 문턱 ${나라문턱}개 나라`);
  console.log('무리          작품   가운데 주  첫 주에 가장 넓음  넷째 주까지  가장 늦은 주  가운데 넓이  얇아서뺌  끝에걸림');
  for (const g of byGroup) {
    console.log(`${g.group.padEnd(12)} ${String(g.titles).padStart(5)} ${String(g.medianWeek).padStart(9)} `
      + `${String(g.peakInWeekOnePc).padStart(16)}% ${String(g.peakByWeekFourPc).padStart(10)}% `
      + `${String(g.latestWeek).padStart(12)} ${String(g.medianWidth).padStart(11)} `
      + `${String(g.droppedThin).padStart(9)} ${String(g.droppedOpenEnded).padStart(9)}`);
  }
  console.log(`→ ${낼파일}`);
}
