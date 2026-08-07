import fs from 'node:fs';
const 곳 = 'C:/Users/USER/Documents/GitHub/dataeconomics/src/data/100yearmap/';
const 읽기 = (f) => JSON.parse(fs.readFileSync(곳 + f, 'utf8'));
const 학교 = 읽기('pages-school.json');
const 코드 = (f) => {
  const j = 읽기(f);
  const 줄 = j.자료 ?? j.items ?? (Array.isArray(j) ? j : []);
  return new Set(줄.map((r) => String(r.code ?? r.코드 ?? '')));
};
const 진로 = 코드('school-career.json'), 학급 = 코드('school-class-size.json'), 중퇴 = 코드('school-dropout.json');

const 셈 = (거르기) => {
  const m = {};
  for (const r of 학교.filter(거르기)) {
    const k = `${r.종류 ?? '?'} / ${r.고교유형 ?? '-'}`;
    m[k] = (m[k] ?? 0) + 1;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};

console.log('전체 지면', 학교.length);
console.log('\n■ 아무 숫자도 없는 곳');
for (const [k, n] of 셈((r) => !진로.has(String(r.code)) && !학급.has(String(r.code)) && !중퇴.has(String(r.code)))) console.log(`   ${String(n).padStart(5)}  ${k}`);
console.log('\n■ 진로만 없는 곳(학급당·중퇴는 있음)');
for (const [k, n] of 셈((r) => !진로.has(String(r.code)) && (학급.has(String(r.code)) || 중퇴.has(String(r.code))))) console.log(`   ${String(n).padStart(5)}  ${k}`);
console.log('\n■ 셋 다 있는 곳', 학교.filter((r) => 진로.has(String(r.code)) && 학급.has(String(r.code)) && 중퇴.has(String(r.code))).length);
