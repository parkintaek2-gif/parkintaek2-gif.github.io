/**
 * 우리 한국 작품 명단에 **넷플릭스 한국 차트라는 자를 대 본다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08 01:3x. `/titles` 에 「이름이 겹치는 157편」을 올리고 그 안을 들여다보다가
 * **Impetigore**(인도네시아 공포영화)가 우리 한국 작품 명단에 있는 것을 봤다.
 * 위키데이터에 같은 이름의 한국 작품이 있어 글자로 맞으면 한국 것이 된다 — Friends 와 같은 함정이다.
 *
 * 우리가 가진 자 중 아직 안 쓴 것이 하나 있었다. **넷플릭스 한국 차트**다.
 * 한국 작품이라면 한국 사람도 본다. 한국 차트에 한 번도 안 오르고
 * **딴 나라 한 곳에만 몰려 있으면** 그 나라 작품일 공산이 크다.
 *
 * ⛔ 「한국 차트에 없다 = 한국 것이 아니다」로 **자동으로 빼지 않는다.** 무고한 까닭이 많다.
 *    · 2021년 7월보다 먼저 나온 작품은 애초에 이 표에 오를 기회가 없었다
 *    · 한국에서 넷플릭스로 안 푼 극장 영화가 있다
 *    · 한국 차트에서는 밀리고 동남아에서만 뜬 작품이 있다
 *    그래서 이것은 **뺄 목록이 아니라 손으로 볼 차례**다. 그 차례를 자로 정한다.
 *
 * 결과 → src/data/wikitip-korea-signal.json
 * 쓰는 법: node scripts/collect-korea-chart-signal.mjs
 */
import fs from 'node:fs';
import readline from 'node:readline';

const 나라NDJSON = 'archive/raw/netflix-top10/countries.ndjson';
const 패널 = 'src/data/wikitip-titles.json';
const 판정길 = 'src/data/wikitip-title-ambiguity.json';
const 낼곳 = 'src/data/wikitip-korea-signal.json';

/**
 * 한 제목이 전 세계에서 어떻게 떴나 — 나라별 **서로 다른 주수**와 한국 주수.
 *
 * ⛔ 처음엔 **행을 셌다.** 그러면 부풀려진다 — 원자료에 같은 나라·같은 주가
 *    두 번 든 곳이 있다(Wildflower 필리핀: 20행인데 서로 다른 주는 13주다).
 *    패널(`wikitip-titles.json`)은 주를 Set 으로 세니 두 자가 어긋났다. **주로 맞췄다.**
 */
export function 신호(나라주수) {
  const 전부 = [...나라주수.entries()]
    .map(([나라, v]) => [나라, v instanceof Set ? v.size : v])
    .sort((a, b) => b[1] - a[1]);
  const 총 = 전부.reduce((s, [, v]) => s + v, 0);
  const 한국원 = 나라주수.get('South Korea');
  const 한국 = 한국원 instanceof Set ? 한국원.size : (한국원 || 0);
  const 으뜸 = 전부[0] ?? [null, 0];
  return {
    koreaWeeks: 한국,
    countries: 전부.length,
    topCountry: 으뜸[0],
    topWeeks: 으뜸[1],
    /** 으뜸 나라에 몰린 정도. 100% 면 그 나라에서만 떴다는 뜻이다. */
    concentrationPc: 총 ? +((100 * 으뜸[1]) / 총).toFixed(1) : 0,
  };
}

/** 손으로 볼 차례를 정하는 자. **판정이 아니라 차례다.** */
export function 볼차례(s, verdict) {
  if (verdict !== 'shared') return null;            // 겹치지 않는 이름은 글자로 틀릴 수 없다
  if (s.koreaWeeks > 0) return null;                 // 한국에서도 떴다 — 한국 것으로 본다
  if (s.countries === 1) return 'one-country-only';  // 한 나라에서만 떴다 — 가장 급하다
  if (s.concentrationPc >= 50) return 'concentrated'; // 절반 넘게 한 나라에 몰렸다
  return 'no-korea';                                  // 한국에는 없지만 넓게 떴다
}

if (process.argv[1] && process.argv[1].endsWith('collect-korea-chart-signal.mjs')) {
  /* ── 자가시험 ── */
  let 시험 = 0; let 통과 = 0;
  const 본다 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  const s1 = 신호(new Map([['Indonesia', 5]]));
  본다('한 나라만이면 몰림 100%', s1.concentrationPc === 100 && s1.countries === 1);
  본다('한국이 없으면 0주', s1.koreaWeeks === 0);
  const s2 = 신호(new Map([['South Korea', 6], ['Vietnam', 6], ['Taiwan', 5]]));
  본다('한국 주수를 집는다', s2.koreaWeeks === 6);
  본다('한국에서 떴으면 차례에 안 넣는다', 볼차례(s2, 'shared') === null);
  본다('한 나라만은 가장 급한 차례', 볼차례(s1, 'shared') === 'one-country-only');
  본다('겹치지 않는 이름은 차례가 없다', 볼차례(s1, 'koreaOnly') === null);
  본다('넓게 떴지만 한국이 없으면 no-korea',
    볼차례(신호(new Map([['Ireland', 4], ['Canada', 3], ['Peru', 3], ['Chile', 3], ['Spain', 3], ['Italy', 3], ['France', 3]])), 'shared') === 'no-korea');
  console.log(`한국 차트 자 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const t = JSON.parse(fs.readFileSync(패널, 'utf8'));
  const a = JSON.parse(fs.readFileSync(판정길, 'utf8'));
  const 판정 = new Map(a.perTitle.map((p) => [p.title, p.verdict]));
  const 볼것 = new Map(t.rows.map((r) => [r.title, new Map()]));

  const rl = readline.createInterface({ input: fs.createReadStream(나라NDJSON), crlfDelay: Infinity });
  let 줄수 = 0;
  /* 원자료에 같은 (제목·나라·주)가 두 번 든 곳이 있다. 크기를 재서 밝힌다 — 남의 자료라 안 고친다. */
  let 패널행 = 0;
  const 한칸 = new Set();
  for await (const line of rl) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    줄수++;
    const m = 볼것.get(r.제목);
    if (!m) continue;
    if (!m.has(r.국가)) m.set(r.국가, new Set());
    m.get(r.국가).add(r.주);      // 행이 아니라 **주**를 센다. 같은 주가 두 번 드는 곳이 있다
    패널행++;
    한칸.add(`${r.제목}|${r.국가}|${r.주}`);
  }

  const rows = t.rows.map((r) => {
    const s = 신호(볼것.get(r.title));
    return {
      title: r.title,
      type: r.type,
      seaWeeks: r.weeks,
      verdict: 판정.get(r.title) ?? 'unknown',
      ...s,
      queue: 볼차례(s, 판정.get(r.title)),
    };
  });

  const 겹침 = rows.filter((r) => r.verdict === 'shared');
  const 차례 = (q) => rows.filter((r) => r.queue === q);
  const out = {
    generated: new Date().toLocaleString('ko-KR'),
    source: 'Netflix Top 10 (Tudum) per-country weekly lists — every country Netflix publishes, not only Southeast Asia',
    sourceKo: '넷플릭스 Tudum 나라별 주간 Top 10 전 세계',
    method: 'A Korean title should normally also appear on Netflix’s South Korea chart. Absence is not proof — a title released before July 2021, or never streamed in Korea, cannot appear — so this ranks titles for human review rather than deciding them.',
    panelTitles: rows.length,
    sharedTitles: 겹침.length,
    /** 원자료가 같은 (제목·나라·주)를 두 번 이상 담은 행수. 우리가 안 고치고 크기만 밝힌다. */
    duplicateRows: 패널행 - 한칸.size,
    scannedRowsForPanel: 패널행,
    /** 겹치는 이름 중 한국 차트에 한 번도 안 오른 것 — 손으로 볼 전체 크기 */
    sharedWithoutKorea: 겹침.filter((r) => r.koreaWeeks === 0).length,
    queues: {
      oneCountryOnly: 차례('one-country-only').length,
      concentrated: 차례('concentrated').length,
      noKorea: 차례('no-korea').length,
    },
    /** 가장 급한 차례부터. 한 나라에만 몰린 것이 위험이 가장 크다. */
    reviewQueue: rows.filter((r) => r.queue).sort((x, y) => {
      const 순 = { 'one-country-only': 0, concentrated: 1, 'no-korea': 2 };
      return 순[x.queue] - 순[y.queue] || y.seaWeeks - x.seaWeeks;
    }).map((r) => ({
      title: r.title, type: r.type, queue: r.queue, seaWeeks: r.seaWeeks,
      countries: r.countries, topCountry: r.topCountry, topWeeks: r.topWeeks,
      concentrationPc: r.concentrationPc,
    })),
    rows,
  };
  fs.writeFileSync(낼곳, JSON.stringify(out, null, 2));
  console.log(`나라별 ${줄수.toLocaleString()}줄 읽음 · 패널 ${out.panelTitles}편`);
  console.log(`겹치는 이름 ${out.sharedTitles}편 · 그중 한국 차트에 없는 것 ${out.sharedWithoutKorea}편`);
  console.log(`손으로 볼 차례 — 한 나라만 ${out.queues.oneCountryOnly} · 몰림 ${out.queues.concentrated} · 넓게 ${out.queues.noKorea}`);
  console.log(out.reviewQueue.slice(0, 12).map((r) => `  ${r.title} (${r.seaWeeks}w · ${r.topCountry} ${r.topWeeks} · ${r.concentrationPc}%)`).join('\n'));
}
