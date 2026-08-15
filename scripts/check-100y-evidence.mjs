/**
 * check-100y-evidence.mjs — 백년지도 자료가 «근거 셋»을 갖췄나 잰다
 *
 * 🔴 왜 — 사장님(2026-08-15):
 *   *「스스로 판단을 잘 할 수 있는 장치는 추측이 아니라 **<데이터, 검증된 과학기술, 학술적 근거>**」*
 *
 * ⭐ 5번이 먼저 자로 만들었고(check-kcw-evidence-basis), 거기서 한 가지를 배워 왔다 —
 *   *「③을 «인용이 있나»가 아니라 «그 방법의 **알려진 한계**가 적혀 있나»로 잽니다.
 *     학술적 근거를 쓴다는 것은 권위를 빌리는 것이 아니라 **한계를 물려받는 것**이더군요」*
 *
 * 무엇을 재나 — src/data/100yearmap/*.json 마다
 *   ① 출처   어디서 언제 받았나
 *   ② 방법   가운데값·비율 같은 «셈»을 썼다면 그 방법의 이름과 «왜 그것인가»
 *   ③ 한계   그 방법이 못 보여 주는 것
 *
 * ⛔ 이 자는 **막는 자가 아니라 보는 눈**이다. 빨강이 있어도 배포를 막지 않는다.
 *   (검사가 자물쇠가 되면 옳은 변화까지 막는다 — 5번이 8/15 에 세 번 겪었다)
 *
 * 쓰는 법  node scripts/check-100y-evidence.mjs [--자세히]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
const 방 = path.join(뿌리, 'src', 'data', '100yearmap');
const 자세히 = process.argv.includes('--자세히');

/** 셈을 쓴 자료인가 — 이 말이 있으면 ②③ 을 물어야 한다 */
export const 셈말 = /가운데값|중앙값|median|평균|비율|퍼짐|분포|추정|보정|가중/;
/** ① 어디서 왔나 */
export const 출처말 = /출처|source|받은때|받은 ?날|수집시각|기준시각|공시연도/;
/** ② 어떻게 셌나 — «이름»만으로는 모자라고 «왜»가 있어야 한다 */
// ⚠ 처음에 「어떻게 냈」만 넣어 두었더니, 정작 내가 방금 만든 자료(「② **어떻게 셌나**」)를
//   「방법을 안 밝혔다」로 셌다. **내 자가 내 것을 못 알아봤다.** 말을 넓힌다
export const 방법말 = /어떻게 냈|어떻게 셌|왜 이 방법|왜 가운데값|방법:|셈법|셈과한계|산출 ?방법|method/;
/** ③ 무엇을 못 보나 */
export const 한계말 = /한계|못 보|안 보|주의|조심|⚠|읽으면 안|오해/;

/**
 * 🔴 2026-08-16 — 이 자가 **머리쪽 6,000자만** 봤다. 그런데 우리 자료는 큰 배열(837줄·12,990줄)이
 *   중간에 끼는 모양이라, 설명 칸(정의·⚠·잰이)이 통째로 6,000자 **밖으로 밀린다**.
 *   major-outcomes.json 은 ⚠ 가 여럿인데도 「③ 한계 없음」으로 셌다. **자가 거짓말을 했다.**
 *
 *   ⇒ 자르지 않는다. 대신 **큰 배열을 걷어낸다** — 배열은 첫 한 개만 남기고 길이만 적는다.
 *     설명은 배열이 아니라 칸에 있으므로, 이렇게 하면 글이 짧아지면서 설명은 하나도 안 잃는다.
 */
export function 설명만(글) {
  let j;
  try { j = JSON.parse(글); } catch { return 글.slice(0, 200000); }  // 못 읽으면 통째로(자르되 넉넉히)
  const 줄이기 = (v) => {
    if (Array.isArray(v)) return v.length <= 1 ? v.map(줄이기) : [줄이기(v[0]), `…앞의 것과 같은 모양 ${v.length - 1}개 더`];
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, 줄이기(x)]));
    return v;
  };
  return JSON.stringify(줄이기(j), null, 1);
}

export function 재기(글) {
  return {
    셈: 셈말.test(글),
    출처: 출처말.test(글),
    방법: 방법말.test(글),
    한계: 한계말.test(글),
  };
}

// ⚠ 「import.meta.url === file://...」로 견주면 **윈도에서 조용히 안 돈다**(file:/// 와 드라이브 문자).
//   처음에 그렇게 써서 아무것도 안 찍혔다. 파일 이름으로 견딘다.
if (process.argv[1] && path.basename(process.argv[1]) === 'check-100y-evidence.mjs') {
  const 것들 = fs.readdirSync(방).filter((f) => f.endsWith('.json'));
  let 셈쓰는것 = 0, 빈방법 = 0, 빈한계 = 0, 빈출처 = 0;
  const 모자란 = [];

  for (const f of 것들) {
    // ⛔ 자르지 않는다(8/16 에 자르다 틀렸다). 큰 배열만 걷어내고 **설명은 다 본다**
    const 글 = 설명만(fs.readFileSync(path.join(방, f), 'utf8'));
    const r = 재기(글);
    if (!r.출처) 빈출처++;
    if (!r.셈) continue;
    셈쓰는것++;
    if (!r.방법) 빈방법++;
    if (!r.한계) 빈한계++;
    if (!r.방법 || !r.한계) 모자란.push([f, r]);
  }

  console.log('백년지도 자료 — 근거 셋을 갖췄나\n');
  console.log(`  자료 ${것들.length}개 · 그중 «셈»을 쓰는 것 ${셈쓰는것}개`);
  console.log(`  ① 출처가 안 보이는 것        ${빈출처}`);
  console.log(`  ② 방법을 안 밝힌 것(셈 중)   ${빈방법}`);
  console.log(`  ③ 한계를 안 적은 것(셈 중)   ${빈한계}`);

  if (자세히) {
    console.log('\n  ── 모자란 자료 ──');
    for (const [f, r] of 모자란)
      console.log(`   ${f.padEnd(34)} ${r.방법 ? '②✅' : '②🔴'} ${r.한계 ? '③✅' : '③🔴'}`);
  } else if (모자란.length) {
    console.log(`\n  (자세히 보려면 --자세히 · ${모자란.length}개가 모자라다)`);
  }

  console.log('\n⛔ 이 자는 배포를 막지 않는다. **보는 눈**이다.');
  console.log('⭐ ③은 「인용이 있나」가 아니라 「그 방법의 알려진 한계가 적혀 있나」로 잰다(5번 8/15).');
}
