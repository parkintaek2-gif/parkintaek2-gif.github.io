/**
 * 「없던 하락」 기사를 자료에 대고 맞춘다.
 *
 *   the-decline-that-was-not-there   music — 네 나라가 같이 줄었으니 줄어든 것은 자료다
 *
 * ⛔ 이 검사가 특히 지키는 것 넷 —
 *    ① **대조군 세 나라가 다 있나.** 한국만 적으면 이 기사는 정반대 기사가 된다.
 *       한 줄이라도 빠지면 선다.
 *    ② **판정을 적었나.** 「자료 탓이다」라는 문장이 없으면 첫 표가 발견으로 읽힌다.
 *    ③ **수명을 수치로 말하지 않았나.** 9.7% 표본으로 「한국 그룹은 3년 산다」를 쓰면 안 된다.
 *       중앙값을 적더라도 **못 쓴다는 문장이 같은 자리에** 있어야 한다.
 *    ④ **까닭을 지어내지 않았나.** 「위키데이터가 느려서」는 우리가 못 증명한 것이다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/the-decline-that-was-not-there.md';
const 자료길 = 'src/data/wikitip-debut-counts.json';

/** 남은 비율을 자가 다시 낸다 */
export function 남은비(예전, 최근) {
  if (typeof 예전 !== 'number' || typeof 최근 !== 'number' || !예전) return null;
  return +((100 * 최근) / 예전).toFixed(0);
}

/** 네 나라가 다 같은 쪽으로 갔나 — 이 기사의 뼈대다 */
export function 다같이줄었나(비율들) {
  if (!Array.isArray(비율들) || 비율들.length < 2) return null;
  if (비율들.some((p) => typeof p !== 'number')) return null;
  return 비율들.every((p) => p < 60);
}

if (process.argv[1] && process.argv[1].endsWith('check-debut-counts-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('남은 비율', 남은비(38.7, 12) === 31);
  자가('안 줄면 100', 남은비(10, 10) === 100);
  자가('예전이 0 이면 null', 남은비(0, 5) === null);
  자가('다 줄면 참', 다같이줄었나([31, 43, 22, 22]) === true);
  자가('하나라도 안 줄면 거짓', 다같이줄었나([31, 43, 22, 95]) === false);
  자가('하나뿐이면 null', 다같이줄었나([31]) === null);
  자가('빈 칸이 섞이면 null', 다같이줄었나([31, null]) === null);
  console.log(`없던 하락 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(42)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 민줄.includes(s), s.length > 44 ? `${s.slice(0, 44)}…` : s);

  /* ── ① 자료가 스스로 맞나 ── */
  for (const r of d.rows) {
    본다(`${r.name} 남은 비율이 두 창에서 나오나`,
      r.remainingPc === 남은비(r.earlier, r.recent), `${r.earlier} → ${r.recent} = ${r.remainingPc}%`);
  }
  본다('판정이 수와 맞나',
    (d.verdict === 'not usable as a trend') === 다같이줄었나(d.rows.map((r) => r.remainingPc)),
    d.verdict);
  본다('한국 하락폭이 남은 비율의 뒷면인가',
    d.koreaFallPc === 100 - d.koreaRemainingPc, `${d.koreaFallPc}% / ${d.koreaRemainingPc}%`);
  본다('해체일이 결성일보다 적나',
    d.lifespan.withEnd < d.lifespan.withStart,
    `${d.lifespan.withEnd} / ${d.lifespan.withStart} = ${d.lifespan.coveragePc}%`);

  /* ── ② 대조군 세 나라가 **다** 있나 ── 하나라도 빠지면 정반대 기사가 된다 ── */
  for (const r of d.rows) {
    있나(`나라 줄 — ${r.name}`,
      `| ${r.name} | ${r.groups.toLocaleString('en-US')} | ${r.earlier} | ${r.recent.toFixed(1)} | ${r.remainingPc}% |`);
  }
  본다('대조군이 셋 이상인가', d.rows.length >= 4, `${d.rows.length}개국`);
  /**
   * ⚠ 2026-08-22 — 이 칸이 **제목 글귀를 통째로 못박고** 있었다. 제목을 60자로 줄이려니 자가 울었다
   *   (구글은 제목을 60자 안팎에서 자른다 — 우리 기사 113편 중 112편이 그보다 길었다).
   *   ⛔ 자가 지킬 것은 「그 수와 그 해가 기사에 있나」다. **어느 문장에 있나**는 자가 정할 일이 아니다.
   *   ⭐ 수와 해를 따로 본다. 뜻은 같고 제목을 묶지 않는다.
   */
  있나('69% 라는 수가 기사에 있나', `${d.koreaFallPc}% down`);
  있나('어느 해부터인지 적었나', `since ${d.earlierWindow[2]}`);
  있나('한국만 본 표', `| South Korea | ${d.rows[0].earlier} | ${d.rows[0].recent.toFixed(1)} | ${d.rows[0].remainingPc}% |`);

  /* ── ③ 판정을 적었나 ── */
  본다('줄어든 것이 자료라고 적었나',
    한줄.includes('What fell is not the number of groups. It is how quickly this source records them'),
    '⛔ 이 문장이 없으면 첫 표가 발견으로 읽힌다');
  본다('실제 데뷔 수를 모른다고 적었나',
    한줄.includes('That is the number we wanted and the number we do not have'),
    'excluded 에도 같은 말이 있어야 한다');

  /* ── ④ 수명 — 수를 적더라도 못 쓴다는 말이 같이 있어야 한다 ── */
  있나('수명 표본', `${d.lifespan.withEnd} have a recorded dissolution date`);
  있나('수명 표본 비율', `${d.lifespan.coveragePc}%`);
  있나('7년 대 6년', `${d.lifespan.atSeven} groups ended at seven years against ${d.lifespan.atSix} at six`);
  본다('수명을 못 쓴다고 적었나',
    한줄.includes('is not a sample of endings at all'), '⛔ 9.7% 로 수명을 말하지 않는다');
  본다('치우친 방향을 적었나',
    한줄.includes('quietly stop are far less likely'), '어느 쪽으로 치우쳤는지까지 적는다');

  /* ── ⑤ 안 한 말을 안 했나 ── */
  본다('까닭을 안 지어냈나',
    한줄.includes('we cannot show why'), '⛔ 「위키데이터가 느려서」는 증명 못 했다');
  본다('자료를 안 지웠나',
    한줄.includes('marked unusable as a trend'), '다음 사람이 같은 착각을 한다');

  console.log(틀림 ? `\n⛔ 어긋난 것 ${틀림}건` : '\n✅ 없던 하락 기사 — 자료와 전부 맞다');
  process.exit(틀림 ? 1 : 0);
}
