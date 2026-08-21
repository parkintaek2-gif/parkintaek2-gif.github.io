/* 유닛(세션)별 출력 토큰 — 좌석 배정을 정하려고 잰다 (2026-08-20 · 2번)
   ⛔ 폴더별로는 못 가른다. 바탕화면 한 폴더를 여럿이 나눠 쓰기 때문이다.
   ⭐ 그래서 **대화록 파일 하나 = 창 하나**로 세고, 그 안에서 「N번」이 몇 번 나오는지로 자리를 가늠한다. */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const 뿌리 = 'C:/Users/USER/.claude/projects';
const KST = 9 * 3600 * 1000;
const 오늘 = '2026-08-20';
const 이레전 = new Date(Date.parse(오늘 + 'T00:00:00Z') - 6 * 86400000);

function 케이에스티날(iso) {
  const t = Date.parse(iso); if (Number.isNaN(t)) return null;
  const d = new Date(t + KST);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

const 파일들 = [];
for (const 폴 of fs.readdirSync(뿌리)) {
  const p = path.join(뿌리, 폴);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const f of fs.readdirSync(p)) if (f.endsWith('.jsonl')) 파일들.push({ 폴, f, 길: path.join(p, f) });
}

const 결과 = [];
for (const { 폴, f, 길 } of 파일들) {
  let 출력 = 0, 줄수 = 0, 마지막 = null;
  const 번호셈 = {};
  const rl = readline.createInterface({ input: fs.createReadStream(길), crlfDelay: Infinity });
  for await (const 줄 of rl) {
    줄수++;
    if (!줄.includes('"usage"') && !줄.includes('번')) continue;
    let j; try { j = JSON.parse(줄); } catch { continue; }
    const ts = j.timestamp;
    if (ts) { const d = 케이에스티날(ts); if (d && d >= 케이에스티날(이레전.toISOString())) { 마지막 = d > (마지막||'') ? d : 마지막; } else continue; }
    const u = j.message?.usage;
    if (u?.output_tokens) 출력 += u.output_tokens;
    /* 「N번」이 몇 번 나오나 — 자리를 가늠하는 유일한 실마리다 */
    const s = 줄.length > 200000 ? 줄.slice(0, 200000) : 줄;
    for (const m of s.matchAll(/([1-8])번/g)) 번호셈[m[1]] = (번호셈[m[1]] || 0) + 1;
  }
  if (출력 === 0) continue;
  const 으뜸 = Object.entries(번호셈).sort((a,b)=>b[1]-a[1]).slice(0,3);
  결과.push({ 세션: f.replace('.jsonl',''), 폴, 출력, 줄수, 마지막, 으뜸 });
}

결과.sort((a,b)=>b.출력-a.출력);
const 합 = 결과.reduce((s,r)=>s+r.출력,0);
console.log(`이레(${케이에스티날(이레전.toISOString())}~${오늘}) 출력 합 ${(합/1e6).toFixed(1)}백만 · 창 ${결과.length}개\n`);
console.log('  %  출력       세션(앞 8자)   자리 가늠(N번 나온 수)                폴더');
console.log('─'.repeat(110));
for (const r of 결과.slice(0, 20)) {
  const pct = ((r.출력/합)*100).toFixed(0).padStart(3);
  const 가늠 = r.으뜸.map(([n,c])=>`${n}번:${c}`).join(' ').padEnd(28);
  console.log(`${pct}%  ${(r.출력/1e6).toFixed(2)}백만  ${r.세션.slice(0,8)}  ${가늠}  ${r.폴.slice(-28)}`);
}
