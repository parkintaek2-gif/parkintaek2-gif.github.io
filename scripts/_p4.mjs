import fs from 'node:fs';
const p = 'C:/Users/USER/Documents/GitHub/dataeconomics/scripts/check-kpop-members-article.mjs';
const L = String.fromCharCode(10);
let s = fs.readFileSync(p, 'utf8');
const 헌 = `const 최신 = (re) => {
  const f = fs.readdirSync(D).filter((x) => re.test(x)).sort().pop();
  if (!f) throw new Error(\`\${re} 에 맞는 파일이 없다\`);
  return JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
};`;
if (!s.includes(헌)) { console.log('🔴 자리 못 찾음'); process.exit(1); }
const 넘 = String.fromCharCode(96);
const 새 = [
'/*',
' * 🔴 2026-08-23 — 이 자가 **던져서** npm test 를 통째로 세우고 있었다.',
' *   곳간(`archive/`)은 git 에 없다. 그래서 자료를 아직 안 받은 기계에서는 이 파일이 없고,',
' *   그때 이 자가 던지면 **뒤의 검사 백여 개가 한 개도 안 돈다.**',
' * ⛔ 「못 쟀다」와 「깨졌다」는 다른 말이다. 자료가 없는 것은 기사가 틀린 것이 아니다.',
' *   없으면 그렇게 적고 **0으로 나간다** — 그래야 나머지 검사가 제 일을 한다.',
' * ⚠ 이것이 「통과」로 읽히면 안 된다. 그래서 ⚠ 를 붙여 찍는다.',
' */',
'const 없는것 = [];',
'const 최신 = (re) => {',
'  let f = null;',
'  try { f = fs.readdirSync(D).filter((x) => re.test(x)).sort().pop() ?? null; } catch { f = null; }',
'  if (!f) { 없는것.push(String(re)); return null; }',
"  return JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));",
'};',
].join(L);
s = s.replace(헌, 새);

const 헌2 = "const dd = 최신(/^kpop-debut-\d+\.json$/).연도;";
if (!s.includes(헌2)) { console.log('🔴 자리2 못 찾음'); process.exit(1); }
s = s.replace(헌2, [
'const dd0 = 최신(/^kpop-debut-\d+\.json$/);',
'if (없는것.length) {',
`  console.log(${넘}⚠ 못 쟀다 — \${D} 에 \${없는것.join(', ')} 가 없다. 곳간은 git 에 없으니 먼저 받는다.${넘});`,
"  console.log('   ⛔ 이것은 「통과」가 아니다. 재 보지 못했다는 뜻이다.');",
'  process.exit(0);',
'}',
'const dd = dd0.연도;',
].join(L));
fs.writeFileSync(p, s);
console.log('못 쟀다와 깨졌다를 갈라 적게 고쳤다');
