/**
 * 학교 지면 중 **줄 숫자가 하나도 없는 곳**이 몇 곳인지 잰다. 짐작하지 않는다.
 *
 * 🔴 왜 이 도구가 있나 — 2026-08-07 에 2번이 **두 번** 틀린 숫자로 3번을 몰아붙일 뻔했다.
 *   ① 「일반고 1,703곳이 비었다」  → 실제 136곳
 *   ② 「특성화고 480곳이 비었다」  → 학교 지면에 **취업**이 이미 붙어 있었다(8/4부터)
 *   ⛔ 세는 자를 안 만들고 기억으로 말하면 이렇게 된다.
 *
 * ⚠ 「숫자가 있다」와 「그 학교의 숫자다」는 다르다. 취업은 **학교유형 전체 값**이라
 *   지면에서 그렇게 밝히고 있는지까지 함께 센다.
 *
 * 쓰는 법
 *   node scripts/check-school-gap.mjs
 *   node scripts/check-school-gap.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 자료 = path.resolve(여기, '..', 'src', 'data', '100yearmap');

export function 코드모음(파일) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(자료, 파일), 'utf8'));
    const 줄 = j.자료 ?? j.items ?? (Array.isArray(j) ? j : []);
    return new Set(줄.map((r) => String(r.code ?? r.코드 ?? '')));
  } catch {
    return new Set();
  }
}

/** 이 학교 지면에 사람이 볼 숫자가 하나라도 있는가 */
export function 숫자있나(줄, 가진곳) {
  if (줄.취업) return true;                       // 학교유형 전체 값이라도 화면에 숫자가 뜬다
  const c = String(줄.code ?? '');
  return 가진곳.some((s) => s.has(c));
}

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 봄 = (이름, 본것, 바란것) => {
    const 같다 = 본것 === 바란것;
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `  본 것 ${본것} / 바란 것 ${바란것}`}`);
  };
  const 가진곳 = [new Set(['111']), new Set(['222'])];
  봄('진로가 있으면 있다', 숫자있나({ code: '111' }, 가진곳), true);
  봄('중퇴만 있어도 있다', 숫자있나({ code: '222' }, 가진곳), true);
  봄('아무 데도 없으면 없다', 숫자있나({ code: '999' }, 가진곳), false);
  봄('⚠ 취업(유형 전체 값)만 있어도 화면엔 숫자가 뜬다', 숫자있나({ code: '999', 취업: {} }, 가진곳), true);
  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

const 학교 = JSON.parse(fs.readFileSync(path.join(자료, 'pages-school.json'), 'utf8'));
const 진로 = 코드모음('school-career.json');
const 학급 = 코드모음('school-class-size.json');
const 중퇴 = 코드모음('school-dropout.json');
const 가진곳 = [진로, 학급, 중퇴];

console.log(`학교 지면 ${학교.length}곳\n`);
console.log(`  진로(졸업생 진로 현황)   ${진로.size}곳`);
console.log(`  학급당 학생 수           ${학급.size}곳`);
console.log(`  중퇴                     ${중퇴.size}곳`);
console.log(`  취업(학교유형 전체 값)   ${학교.filter((r) => r.취업).length}곳`);

const 빈곳 = 학교.filter((r) => !숫자있나(r, 가진곳));
console.log(`\n■ **숫자가 하나도 없는 지면 ${빈곳.length}곳**`);
const 갈래별 = {};
for (const r of 빈곳) {
  const k = `${r.종류 ?? '?'} / ${r.고교유형 ?? '-'}`;
  갈래별[k] = (갈래별[k] ?? 0) + 1;
}
for (const [k, n] of Object.entries(갈래별).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${String(n).padStart(4)}  ${k}`);
}

// 「학교 것이 아니다」를 밝히고 있는지 — 취업만 가진 곳이 그 대상이다
const 취업만 = 학교.filter((r) => r.취업 && !가진곳.some((s) => s.has(String(r.code))));
console.log(`\n⚠ **학교유형 전체 값만 붙은 지면 ${취업만.length}곳** — 지면에서 「이 학교 것이 아니다」를`);
console.log(`   밝히고 있어야 하는 자리입니다. 자료에는 그 문구가 들어 있습니다:`);
console.log(`   「${학교.find((r) => r.취업)?.취업?.['⚠주의'] ?? '못 찾음'}」`);
