/**
 * 「차트가 한국 작품의 몇 퍼센트를 닿나」 기사를 자료에 대고 맞춘다.
 *
 *   what-share-of-korean-output-the-charts-touch   screen — 분모를 처음 세 봤다
 *
 * ⛔ 이 검사가 지키는 것은 **분모**다. 분자(우리 패널)는 다른 검사들이 이미 지킨다.
 *    분모가 조용히 바뀌면 비율이 다 거짓이 되는데 아무도 안 본다.
 *
 * ⚠ 100%를 넘는 비율이 **다시 나올 수 있는 길을 막는다.** 그게 이 기사를 쓰게 만든 잘못이다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/what-share-of-korean-output-the-charts-touch.md';
const 자료길 = 'src/data/wikitip-output-denominator.json';
const 패널길 = 'src/data/wikitip-titles.json';
const 천 = (n) => Number(n).toLocaleString('en-US');

/** 비율을 자료에서 **다시 센다.** 자료가 적어 둔 값을 그대로 안 믿는다 */
export function 다시(덮은것, 전체) {
  if (!전체 || 덮은것 === null || 전체 === null) return null;
  const v = +((100 * 덮은것) / 전체).toFixed(1);
  return v > 100 ? null : v;
}

if (process.argv[1] && process.argv[1].endsWith('check-output-denominator-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('비율을 다시 센다', 다시(237, 782) === 30.3);
  자가('영화 쪽도', 다시(160, 1120) === 14.3);
  자가('100%를 넘으면 없다', 다시(237, 84) === null);
  자가('분모가 0이면 없다', 다시(1, 0) === null);
  console.log(`분모 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const t = JSON.parse(fs.readFileSync(패널길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');   // 굵기는 편집 판단이라 걷고 본다
  const 행 = Object.fromEntries(d.rows.map((r) => [r.key, r]));

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(38)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 42 ? `${s.slice(0, 42)}…` : s);

  /* ── ① 분자가 패널과 같나. 다시 세지 않고 같은 파일에서 왔는지 본다 ── */
  {
    const 셈 = { film: 0, series: 0 };
    for (const r of t.rows) (/^TV|series/i.test(r.type) ? 셈.series++ : 셈.film++);
    본다('분자가 패널과 같나', 행.film.ourPanel === 셈.film && 행.series.ourPanel === 셈.series,
      `영화 ${행.film.ourPanel} · 시리즈 ${행.series.ourPanel}`);
    본다('둘을 더하면 패널 크기', 행.film.ourPanel + 행.series.ourPanel === t.rows.length,
      `${행.film.ourPanel} + ${행.series.ourPanel} = ${t.rows.length}`);
    있나('패널 크기를 적었나', `**${천(t.rows.length)} titles that`);
  }

  /* ── ② 자료가 스스로 맞나 · 기사가 자료와 맞나 ── */
  for (const r of d.rows) {
    const 차트 = 다시(r.ourPanel, r.sinceChartEra);
    const 전체 = 다시(r.ourPanel, r.recorded);
    본다(`${r.label} 자료가 스스로 맞나`, r.coverageSinceChartEraPc === 차트 && r.coveragePc === 전체,
      `차트시대 ${차트}% · 전체 ${전체}%`);
    const 줄 = `| ${r.label} | ${천(r.recorded)} | ${천(r.sinceChartEra)} | ${천(r.ourPanel)} | ${차트}% |`;
    본다(`${r.label} 표 줄`, 민줄.includes(줄), 줄.slice(0, 48));
  }
  /* JSON 은 꼬리 0 을 지운다(5). 기사는 소수 한 자리로 쓴다(5.0%). **같은 수다** — 둘 다 받는다 */
  본다('전체 대비도 적었나',
    [`${행.series.coveragePc}% and ${행.film.coveragePc}%`,
      `${행.series.coveragePc.toFixed(1)}% and ${행.film.coveragePc.toFixed(1)}%`]
      .some((s) => 한줄.includes(s)),
    `${행.series.coveragePc}% · ${행.film.coveragePc}%`);

  /* ── ③ 100% 넘는 길이 막혀 있나 — 이 기사를 쓰게 만든 잘못이다 ── */
  본다('자를 다시 대도 100%를 안 넘나',
    d.rows.every((r) => r.coverageSinceChartEraPc === null || r.coverageSinceChartEraPc <= 100),
    d.rows.map((r) => `${r.key} ${r.coverageSinceChartEraPc}`).join(' · '));
  있나('84 였다는 것을 적었나', 'got **84** Korean');
  있나('그래서 알았다고 적었나', 'A coverage share cannot exceed 100%');
  있나('P580 을 적었나', '`P580`');
  있나('막았다고 적었나', 'refuses to emit a share above 100%');
  본다('자료가 두 날짜를 다 쓰나', /P577.*P580|P580.*P577/.test(d.yearWarning), '적혀 있다');

  /* ── ④ 천장이라고 말하나 — 이 검사의 핵심 ── */
  있나('천장이라고 말하나', 'an upper bound that gets smaller');
  본다('자료에도 그 한계가 있나', /ceiling/.test(d.limit), d.limit.slice(0, 44));
  있나('전체 대비를 시대로 안 읽는다고 말하나', 'describe an archive rather than a market');
  있나('까닭을 모른다고 말하나', 'We are not going to tell you why');

  /* ── ⑤ 갈래 차이 ── */
  본다('시리즈가 영화의 두 배쯤인가',
    행.series.coverageSinceChartEraPc / 행.film.coverageSinceChartEraPc > 1.9
    && 한줄.includes('twice as likely'),
    `${행.series.coverageSinceChartEraPc} / ${행.film.coverageSinceChartEraPc}`);

  console.log(틀림 ? `\n⛔ 분모 — 안 맞는 것 ${틀림}건` : '\n✅ 분모 — 전부 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
