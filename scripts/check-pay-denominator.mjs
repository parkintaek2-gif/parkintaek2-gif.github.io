/**
 * 자 ③ — **분모에 안 뺄 것을 남기지 않았는가.** (원인 `pay-denominator`)
 *
 * ── 무엇을 막나 ────────────────────────────────────────────────
 * 2026-08-07. 임금 평균을 내면서 **임금을 공시 안 한 회사의 인원을 분모에 남겼다.**
 * 콘텐트 ₩75.6m · 상장시장 ₩94.0m 로 나갔던 것이 실제는 ₩76.1m · ₩95.1m 이었다.
 *
 * ⭐ 이 잘못은 **조용하다.** 수가 그럴듯해서 아무도 안 본다.
 *    그래서 자는 두 가지를 함께 잰다 —
 *      ① 자료가 「임금이 있는 인원」과 「전체 인원」을 **따로 들고 있나**
 *      ② 그 덮는 비율을 **지면이 말하나** — 안 말하면 다음 사람이 또 전체로 나눈다
 *
 * ⛔ 우리는 회사별 줄을 안 들고 있어 평균을 처음부터 다시 못 센다.
 *    못 하는 것을 하는 척하지 않는다. 대신 **분모가 무엇인지 밝히게** 만든다.
 *    밝혀 두면 다음 사람이 틀린 분모를 쓸 때 그 문장과 어긋난다.
 */
import fs from 'node:fs';

const 자료길 = 'src/data/wikitip-content-industry.json';
const 지면길 = 'dist/wikitip/industry.html';
/** 덮는 비율이 이보다 낮으면 지면이 반드시 크기를 말해야 한다 */
export const 밝혀야하는문턱pc = 99.9;

/** 덮는 비율을 다시 센다. 적어 둔 값을 그대로 안 믿는다 */
export function 덮음(cov) {
  if (!cov || !cov.staffTotal) return null;
  return {
    pc: +((100 * cov.staffWith) / cov.staffTotal).toFixed(1),
    빠진인원: cov.staffTotal - cov.staffWith,
  };
}

if (process.argv[1] && process.argv[1].endsWith('check-pay-denominator.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('비율을 다시 센다', 덮음({ staffWith: 68353, staffTotal: 68809 }).pc === 99.3);
  자가('빠진 인원을 센다', 덮음({ staffWith: 68353, staffTotal: 68809 }).빠진인원 === 456);
  자가('전체가 0이면 null', 덮음({ staffWith: 0, staffTotal: 0 }) === null);
  자가('다 덮으면 100', 덮음({ staffWith: 10, staffTotal: 10 }).pc === 100);
  console.log(`분모 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  let 틀림 = 0;

  /* ── ① 자료가 두 수를 따로 들고 있나 ── */
  if (!d.payCoverage) {
    console.log('🔴 자료에 payCoverage 가 없다 — 임금 분모가 무엇인지 아무도 모른다');
    process.exit(1);
  }
  for (const [이름, cov] of Object.entries(d.payCoverage)) {
    const 재 = 덮음(cov);
    if (!재) { 틀림++; console.log(`🔴 ${이름} — 전체 인원이 0이다`); continue; }
    if (cov.staffWith > cov.staffTotal) {
      틀림++;
      console.log(`🔴 ${이름} — 임금 있는 인원(${cov.staffWith})이 전체(${cov.staffTotal})보다 많다. 있을 수 없다`);
    }
    if (재.pc !== cov.pc) {
      틀림++;
      console.log(`🔴 ${이름} — 적어 둔 덮는 비율 ${cov.pc}% 와 다시 센 ${재.pc}% 가 다르다`);
    }
    console.log(`  ${이름.padEnd(8)} 임금 있는 인원 ${cov.staffWith.toLocaleString()} / ${cov.staffTotal.toLocaleString()} = ${재.pc}% (빠진 ${재.빠진인원.toLocaleString()}명)`);
  }

  /* ── ② 지면이 그 크기를 말하나 ── */
  if (!fs.existsSync(지면길)) {
    console.log(`⚠ ${지면길} 이 없다 — node scripts/build-once.mjs 뒤에 다시 돈다`);
  } else {
    const t = fs.readFileSync(지면길, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const [이름, cov] of Object.entries(d.payCoverage)) {
      const 재 = 덮음(cov);
      if (재.pc >= 밝혀야하는문턱pc) continue;   // 사실상 다 덮으면 밝힐 것이 없다
      const 말했나 = t.includes(`${재.pc}%`) || t.includes(재.빠진인원.toLocaleString('en-US'))
        || /do not disclose pay|without pay|pay is disclosed/i.test(t);
      if (!말했나) {
        틀림++;
        console.log(`🔴 /industry 가 «${이름}» 의 임금 분모를 안 밝힌다 — ${재.pc}% 만 덮는데 지면은 전부인 것처럼 읽힌다`);
      }
    }
  }

  if (틀림) {
    console.log('\n⛔ 임금 평균은 **임금을 공시한 인원으로만** 나눈다. 안 한 회사의 인원은 분모에서 뺀다.');
    process.exit(1);
  }
  console.log('✅ 임금 분모가 무엇인지 자료가 들고 있고 지면이 말한다');
}
