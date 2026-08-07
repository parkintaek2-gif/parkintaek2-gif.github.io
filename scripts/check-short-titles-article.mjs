/**
 * 기사 `short-titles-are-where-we-cannot-check-ourselves` 를 **자료에 대고** 맞춘다.
 *
 * ⛔ 수를 여기 손으로 안 적는다. `wikitip-korea-signal.json` 과 `wikitip-titles.json` 에서
 *    **다시 세서** 기사와 맞춘다. 자료가 움직이면 검사가 저절로 따라온다.
 * ⛔ 문장은 한 줄로 편 본문에, 표는 원문 줄에 댄다. 줄바꿈이 문장을 가른다.
 * ⚠ 이 기사는 **우리가 못 재는 것**을 다룬다. 여기가 틀리면 「모른다」까지 못 믿게 된다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/short-titles-are-where-we-cannot-check-ourselves.md';
const 원문 = fs.readFileSync(기사길, 'utf8');
const 본문 = 원문.replace(/\s+/g, ' ');
const 줄들 = 원문.split('\n');
const K = JSON.parse(fs.readFileSync('src/data/wikitip-korea-signal.json', 'utf8'));
const T = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));

/** 제목의 낱말 수 — 넷플릭스가 낸 그대로 센다. */
export const 낱말 = (s) => s.trim().split(/\s+/).length;
/** 어느 묶음에서 이름이 겹치는 몫. */
export const 겹침몫 = (g) => +((100 * g.filter((r) => r.verdict === 'shared').length) / g.length).toFixed(1);

if (process.argv[1] && process.argv[1].endsWith('check-short-titles-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('낱말은 사이 띄어쓰기로 센다', 낱말('The Glory') === 2 && 낱말('D.P.') === 1);
  자가('낱말이 여럿 붙어도 하나로 안 센다', 낱말('When Life Gives You Tangerines') === 5);
  자가('몫은 한 자리로 반올림한다',
    겹침몫([{ verdict: 'shared' }, { verdict: 'koreaOnly' }, { verdict: 'koreaOnly' }]) === 33.3);
  console.log(`짧은 제목 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(30)} ${값}`); };
  const R = K.rows;
  const 표줄 = (앞) => 줄들.find((l) => l.startsWith(`| ${앞} |`));

  /* ── ① 패널과 판정 셋 ── */
  본다('패널 편수', 본문.includes(`holds **${K.panelTitles} Korean titles**`), K.panelTitles);
  for (const [v, 말] of [['koreaOnly', 'only Korean works carry'], ['shared', 'shared with a foreign work'], ['unknown', 'no country for']]) {
    const n = R.filter((r) => r.verdict === v).length;
    본다(`앞말에 ${v}`, 원문.includes(`${n} names ${말}`) || 원문.includes(`${n} ${말}`) || 원문.includes(`${n} that Wikidata gives ${말}`), n);
  }

  /* ── ② 갈래 표 ── */
  for (const [k, 이름] of [['TV', 'Series'], ['Films', 'Films']]) {
    const g = R.filter((r) => r.type === k);
    const 줄 = 표줄(이름);
    본다(`표 ${이름}`, !!줄 && 줄.includes(`| ${g.length} |`) && 줄.includes(`${겹침몫(g)}%`), `${g.length} · ${겹침몫(g)}%`);
  }
  본다('표 전체', (표줄('Whole panel') || '').includes(`${겹침몫(R)}%`), 겹침몫(R));

  /* ── ③ 낱말 수 표 ── */
  for (const [말, 고르기] of [['One', (r) => 낱말(r.title) === 1], ['Two', (r) => 낱말(r.title) === 2],
    ['Three', (r) => 낱말(r.title) === 3], ['Four or more', (r) => 낱말(r.title) >= 4]]) {
    const g = R.filter(고르기);
    const 줄 = 표줄(말);
    본다(`낱말 ${말}`, !!줄 && 줄.includes(`| ${g.length} |`) && 줄.includes(`${겹침몫(g)}%`), `${g.length} · ${겹침몫(g)}%`);
  }

  /* ── ④ 낱말을 맞추고 갈래를 비교한 표 ── */
  for (const [말, 고르기] of [['One', (r) => 낱말(r.title) === 1], ['Two', (r) => 낱말(r.title) === 2],
    ['Three or more', (r) => 낱말(r.title) >= 3]]) {
    const tv = R.filter((r) => r.type === 'TV' && 고르기(r));
    const fm = R.filter((r) => r.type === 'Films' && 고르기(r));
    const 줄 = 줄들.filter((l) => l.startsWith(`| ${말} |`)).slice(-1)[0];
    const ok = !!줄 && 줄.includes(`${겹침몫(tv)}% (${tv.length})`) && 줄.includes(`${겹침몫(fm)}%** (${fm.length})`);
    본다(`갈래×낱말 ${말}`, ok, `TV ${겹침몫(tv)}%(${tv.length}) · Film ${겹침몫(fm)}%(${fm.length})`);
  }

  /* ── ⑤ 제목 길이의 갈래 차 ── */
  const 중앙 = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  for (const [k, 말] of [['Films', 'film'], ['TV', 'series']]) {
    const g = R.filter((r) => r.type === k);
    const 한낱말 = +((100 * g.filter((r) => 낱말(r.title) === 1).length) / g.length).toFixed(1);
    본다(`${말} 한 낱말 비중`, 본문.includes(`${한낱말}%`), `${한낱말}% · 중앙값 ${중앙(g.map((r) => 낱말(r.title)))}`);
  }

  /* ── ⑥ 주수 — 갈래별 ── */
  const 주 = (k) => T.rows.filter((r) => r.type === k).reduce((s, r) => s + r.weeks, 0);
  본다('갈래별 주수', 본문.includes(`${주('Films')} chart-weeks against ${주('TV').toLocaleString('en-US')}`),
    `${주('Films')} · ${주('TV')}`);

  /* ── ⑦ 한국 차트 자 ── */
  const 낱 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  본다('한국 차트에 없는 겹침',
    본문.includes(`**${K.sharedWithoutKorea} have never appeared on`) && 본문.includes(`${K.sharedTitles} shared titles`),
    `${K.sharedWithoutKorea}/${K.sharedTitles}`);
  본다('한 나라만 편수',
    new RegExp(`(${K.queues.oneCountryOnly}|Twenty-${낱[K.queues.oneCountryOnly - 20] ?? 'x'}) of those charted in exactly one country`, 'i').test(본문)
    || 본문.includes(`queue: ${K.queues.oneCountryOnly} titles that charted in one country only`),
    K.queues.oneCountryOnly);
  본다('차례 셋을 다 적나',
    본문.includes(`${K.queues.oneCountryOnly} titles that charted in one country only`)
    && 본문.includes(`${K.queues.concentrated} more concentrated`)
    && 본문.includes(`${K.queues.noKorea} that spread widely`),
    `${K.queues.oneCountryOnly}·${K.queues.concentrated}·${K.queues.noKorea}`);
  {
    /* ⚠ 낱말로 쓴 수를 받되 **20은 「twenty」다.** 처음엔 20을 「twenty-zero」로 만들어
       검사가 헛울었다. 스무 자리 낱말을 따로 만든다. */
    const 스무 = (n) => (n === 20 ? 'twenty' : `twenty-${낱[n - 20] ?? 'x'}`);
    const 낱로 = (n) => (n < 21 ? (낱[n] ?? 스무(n)) : 스무(n));
    const f = K.reviewQueue.filter((r) => r.queue === 'one-country-only' && r.type === 'Films').length;
    본다('한 나라만 중 영화', new RegExp(`(${f}|${낱로(f)}) of the (${K.queues.oneCountryOnly}|${낱로(K.queues.oneCountryOnly)}) are films`, 'i').test(본문), f);
  }
  본다('중복 행을 밝히나',
    본문.includes(`${K.duplicateRows.toLocaleString('en-US')} of ${K.scannedRowsForPanel.toLocaleString('en-US')}`),
    `${K.duplicateRows}/${K.scannedRowsForPanel}`);

  /* ── ⑧ 이름을 댄 작품이 정말 그런가 — **여기가 제일 아프다** ── */
  const 찾 = (t) => R.find((r) => r.title === t);
  /* 아직 패널에 있는 편 — 자료와 한 자 한 자 맞아야 한다 */
  for (const [이름, 나라, 주수] of [['Impetigore', 'Indonesia', 5], ['Vagabond', 'Vietnam', 8]]) {
    const r = 찾(이름);
    const ok = !!r && r.countries === 1 && r.koreaWeeks === 0 && r.topCountry === 나라 && r.seaWeeks === 주수
      && 본문.includes(이름);
    본다(`«${이름}»`, ok, r ? `${r.seaWeeks}w · ${r.topCountry} · 나라 ${r.countries} · 한국 ${r.koreaWeeks}` : '패널에 없다');
  }
  /* ⛔ 뺀 편을 기사가 계속 「차례에 있다」로 말하면 안 된다. **뺐다고 말하고 있나**를 본다.
     2026-08-08 에 Wildflower·The Lord Musang King 이 패널에서 빠졌다. 기사는 살아 있었다. */
  /* ⚠ 손으로 이름을 적어 두지 않는다 — **자료에서 뺀 목록을 읽는다.** 처음엔 두 이름을 적었다가
     The Lord Musang King 이 안 빠졌는데도 빠졌다고 검사가 우겼다. 잣대가 틀렸다. */
  const 뺀것 = new Set(T.excludedByAttribution ?? []);
  for (const 이름 of 뺀것) {
    if (!본문.includes(이름)) continue;                    // 안 부르면 볼 것이 없다
    본다(`뺀 «${이름}» 을 뺐다고 말하나`, /no longer in the panel/i.test(본문), '패널에서 빠짐');
  }
  /* 「빼지 않는다」의 근거로 든 두 편도 정말 한국 차트에 없나 */
  for (const 이름 of ['Smugglers', 'Keys to the Heart']) {
    const r = 찾(이름);
    본다(`«${이름}» 한국 0주`, !!r && r.koreaWeeks === 0 && 본문.includes(이름), r ? `${r.koreaWeeks}주` : '없다');
  }
  /* 한 낱말 예로 든 것들이 정말 겹침인가 — 여기서 딴 데 것을 대면 기사가 거짓이 된다 */
  for (const 이름 of ['Carter', 'Karma', 'Hunt', 'Believer', 'Ballerina']) {
    const r = 찾(이름);
    본다(`한 낱말 예 «${이름}»`, !!r && r.verdict === 'shared' && 낱말(이름) === 1 && 본문.includes(`*${이름}*`),
      r ? r.verdict : '패널에 없다');
  }

  if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
  console.log('\n✅ 전부 기사와 자료가 맞는다');
}
