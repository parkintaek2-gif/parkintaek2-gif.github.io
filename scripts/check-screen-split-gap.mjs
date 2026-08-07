/**
 * `/screen-split` 이 밝히는 **뺄셈이 안 맞는 폭**이 맞나 검사한다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08. 지면에 「거르기 전 294편 → 지금 236편」을 처음 적으면서
 * 안 맞는 2편을 **「손으로 뺀 목록과 영어 차트 목록이 겹친 것」이라고 적었다. 틀렸다.**
 * 원자료로 재 보니 그 교집합은 0편이었다. 실제 원인은 영어·비영어 차트에 **다 오른 작품**이다.
 *
 * ⭐ 짐작으로 설명을 붙이면 수는 맞는데 **까닭이 틀린 문장**이 남는다.
 *    수가 맞아서 아무 검사도 안 운다. 그래서 이 검사는 수가 아니라 **까닭을 잰다** —
 *    폭이 정말 그 편들 때문인지 원자료(ndjson)에서 직접 확인한다.
 *
 * 쓰는 법: node scripts/check-screen-split-gap.mjs
 */
import fs from 'node:fs';
import readline from 'node:readline';
import { koreanTitleFilter } from './lib/korean-netflix-titles.mjs';

const NDJSON = 'archive/raw/netflix-top10/global.ndjson';

/** 원자료에서 **영어·비영어 양쪽**에 오른 한국 제목을 찾는다. 자료 파일을 안 믿고 직접 센다. */
export async function 양쪽차트(길, korean) {
  const en = new Set();
  const non = new Set();
  const rl = readline.createInterface({ input: fs.createReadStream(길), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (!korean.has(r.제목)) continue;
    (/Non-English/i.test(r.구분 || '') ? non : en).add(r.제목);
  }
  return [...non].filter((t) => en.has(t)).sort();
}

/** 지면이 말하는 폭 = 남은 편수 − (거르기 전 − 뺀 편수). */
export function 폭재기(d) {
  const 남은 = d.series.titles + d.film.titles;
  const 뺀 = d.excludedEnglishChart.titles + d.excludedByHand.titles;
  return 남은 - (d.before.titles - 뺀);
}

if (process.argv[1] && process.argv[1].endsWith('check-screen-split-gap.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 본다 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  본다('폭은 남은 것에서 (전 − 뺀 것)을 뺀 값이다',
    폭재기({ series: { titles: 100 }, film: { titles: 36 }, before: { titles: 200 }, excludedEnglishChart: { titles: 50 }, excludedByHand: { titles: 12 } }) === -2);
  본다('겹치는 편이 없으면 폭은 0 이다',
    폭재기({ series: { titles: 138 }, film: { titles: 0 }, before: { titles: 200 }, excludedEnglishChart: { titles: 50 }, excludedByHand: { titles: 12 } }) === 0);
  console.log(`뺄셈 폭 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync('src/data/wikitip-screen-split.json', 'utf8'));
  const 글 = fs.readFileSync('src/pages/wikitip/screen-split.astro', 'utf8');
  const 넘음 = [];

  if (!d.bothCharts) {
    넘음.push('자료에 bothCharts 가 없다. 지면이 폭을 설명할 근거를 잃는다');
  } else {
    const 폭 = 폭재기(d);
    const 실측 = await 양쪽차트(NDJSON, koreanTitleFilter().korean);

    /* ① 자료가 낸 목록이 원자료와 같은가 */
    if (JSON.stringify(실측) !== JSON.stringify([...d.bothCharts.list].sort())) {
      넘음.push(`bothCharts 가 원자료와 다르다 — 자료 [${d.bothCharts.list}] · 원자료 [${실측}]`);
    }
    /* ② 폭이 정말 그 편수만큼인가 — 여기가 「까닭이 맞나」다 */
    if (폭 !== d.bothCharts.titles) {
      넘음.push(`폭 ${폭} 과 양쪽 차트 편수 ${d.bothCharts.titles} 이 다르다. 지면이 대는 까닭 말고 **다른 원인**이 하나 더 있다`);
    }
    /* ③ 지면이 이름을 자료에서 읽는가 — 손으로 적으면 자료가 움직여도 안 움직인다 */
    if (!글.includes('data.bothCharts.list')) 넘음.push('지면이 양쪽 차트 편 이름을 자료에서 안 읽는다');
    /* ⚠ 이름이 지면 어디에 있는지로 재지 않는다 — 이 지면은 상위 표에서 작품 이름을 원래 부른다.
         **폭을 설명하는 그 칸 안**만 본다. 넓게 재면 맞는 문장에도 검사가 운다. */
    const 그칸 = 글.match(/What this page counted before the filter existed[\s\S]*?<\/li>/);
    if (!그칸) {
      넘음.push('「거르기 전 편수」 칸이 지면에서 사라졌다. 무엇을 걸렀는지 밝히는 자리다');
    } else {
      for (const t of d.bothCharts.list) {
        if (그칸[0].includes(t)) 넘음.push(`«${t}» 이 그 칸에 글자로 박혀 있다. 자료에서 읽어야 한다`);
      }
    }
    /* ④ 시간은 딱 맞아야 한다 — 안 맞으면 폭이 편수만의 문제가 아니다 */
    const 시간폭 = d.before.hours - d.excludedEnglishChart.hours - d.excludedByHand.hours - (d.series.hours + d.film.hours);
    if (시간폭 !== 0) 넘음.push(`시간이 ${시간폭.toLocaleString()} 만큼 안 맞는다. 편수와 달리 시간은 겹쳐도 맞아야 한다`);
  }

  if (넘음.length) {
    console.log(`\n⛔ 뺄셈 폭 검사 — ${넘음.length}건`);
    for (const s of 넘음) console.log(`   · ${s}`);
    process.exit(1);
  }
  console.log(`✅ 뺄셈 폭 검사 — 폭 ${폭재기(d)}편은 양쪽 차트에 오른 ${d.bothCharts.list.join(' · ')} 때문이 맞다 (시간은 딱 맞는다)`);
}
