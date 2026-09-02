/**
 * **「고친 내역」 절을 떼는 자.**
 *
 * ── 🔴 왜 이것이 있나 (2026-09-03) ──────────────────────────
 * 기사에 정정을 실을 때 우리는 「What changed on <날짜>」 절을 붙이고, 그 안에
 * **옛 수를 일부러 적는다** — 무엇이 움직였는지 손님이 보게 하려고.
 *
 * 그런데 기사 대조 자들은 기사 본문을 통째로 읽어 「표가 셋인가」·「이 수가 있나」를 센다.
 * 그래서 정정 절을 붙이는 순간 **자 여섯 개가 한꺼번에 빨강이 됐다** —
 * ```
 *   표가 4개다 — 3개라야 한다      ← 정정표가 넷째 표로 셌다
 * ```
 * ⛔ 자를 통과시키려고 정정을 «안 싣는» 것은 우리 강령을 정반대로 어기는 일이다
 *   (「고친 것을 조용히 바꾸지 않는다」). 그러니 **자가 정정 절을 빼고 봐야 한다.**
 * ⭐ `check-stale-numbers.mjs` 가 이미 같은 말을 적어 두었다 —
 *   「정정 문단에서 일부러 인용한 것이면 이 검사가 틀린 것이다. 그 자리를 빼는 규칙을 고친다」.
 *
 * ⚠ 열아홉 자가 각자 `본문만` 을 갖고 있다. 같은 규칙을 열아홉 벌 적으면 하나를 고칠 때
 *   열여덟이 안 따라온다. 그래서 여기 한 벌만 둔다.
 */

/** 정정 절 머리인가 — 「## What changed on 3 September 2026」 꼴 */
export const 정정절머리 = /^##+\s+What changed on\s/m;

/**
 * 정정 절부터 끝까지 뗀다. 정정 절이 없으면 글을 그대로 돌려준다.
 * ⛔ 「없으면 빈 글」로 만들지 않는다 — 그러면 정정 없는 기사가 전부 빈 것으로 보인다.
 */
export function 정정절뗀다(글) {
  const s = String(글 ?? '');
  const m = 정정절머리.exec(s);
  return m ? s.slice(0, m.index) : s;
}

/** 정정 절만 돌려준다(없으면 빈 글). 정정표 자체를 볼 자가 쓴다 */
export function 정정절만(글) {
  const s = String(글 ?? '');
  const m = 정정절머리.exec(s);
  return m ? s.slice(m.index) : '';
}

if (process.argv[1] && process.argv[1].endsWith('kcw-correction-section.mjs')) {
  const 실 = [];
  const 검 = (이름, ok) => { if (!ok) 실.push(이름); };
  const 글 = '앞 본문\n\n## What changed on 3 September 2026\n\n옛 수 289\n';
  검('정정 절을 뗀다', 정정절뗀다(글) === '앞 본문\n\n');
  검('정정 절만 뽑는다', 정정절만(글).startsWith('## What changed on'));
  검('⛔ 정정이 없으면 글을 그대로 준다', 정정절뗀다('그냥 본문') === '그냥 본문');
  검('⛔ 정정이 없으면 정정절만 은 빈 글', 정정절만('그냥 본문') === '');
  검('### 세 겹 머리도 읽는다', 정정절뗀다('a\n### What changed on 1 January 2026\nb') === 'a\n');
  검('⛔ 비슷한 딴 제목은 안 뗀다', 정정절뗀다('a\n## What we changed\nb') === 'a\n## What we changed\nb');
  검('⛔ 빈 것도 안 터진다', 정정절뗀다(undefined) === '' && 정정절만(null) === '');
  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ kcw-correction-section 자가시험 통과 (7)');
}
