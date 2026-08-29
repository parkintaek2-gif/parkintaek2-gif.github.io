/**
 * 지면 하나하나에 **들어오는 링크가 몇 군데서 오나**를 센다.
 *
 * 🔴 [2026-08-27] 첫 판이 틀렸다. 갈래별로 「밖에서 오는 링크」를 셌는데,
 *   갈래의 «첫 장»(`/group`)을 그 갈래 안으로 넣어 버려서 첫 장이 거는 263개를
 *   «같은 갈래 안 링크»로 보고 안 셌다. 그래서 「밖에서 아무도 안 건다」는 거짓이 나왔다.
 *   ⭐ 재는 자리를 고쳤다 — 갈래가 아니라 **지면 하나하나**로 센다.
 *     묻고 싶은 것은 「이 지면에 닿는 길이 몇 개인가」이지 갈래가 아니었다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = 'dist/wikitip';
const 갈래 = (p) => { const m = p.match(/^\/([^/]+)\//); return m ? `/${m[1]}` : (p === '/' ? '/' : p); };

const 파일 = [];
(function 걷기(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) 걷기(p);
    else if (e.name.endsWith('.html')) 파일.push(p);
  }
})(뿌리);

const 주소로 = (f) => `/${path.relative(뿌리, f).split(path.sep).join('/')}`
  .replace(/\.html$/, '').replace(/\/index$/, '') || '/';

const 모든주소 = new Set(파일.map(주소로));
/** 주소 → 그 주소로 링크를 거는 «다른 지면» 수 */
const 들어옴 = new Map([...모든주소].map((u) => [u, new Set()]));

for (const f of 파일) {
  const 나 = 주소로(f);
  const h = fs.readFileSync(f, 'utf8');
  const 본 = new Set();
  for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) 본.add(m[1].replace(/\/$/, '') || '/');
  for (const t of 본) {
    if (t === 나) continue;
    if (들어옴.has(t)) 들어옴.get(t).add(나);
  }
}

/* 갈래별로 «들어오는 길이 하나뿐인 지면» 을 센다 — 그것이 위험한 자리다 */
const 셈 = {};
for (const [u, s] of 들어옴) {
  const g = 갈래(u);
  (셈[g] ??= { 지면: 0, 문0: 0, 문1: 0, 합: 0 });
  셈[g].지면 += 1;
  셈[g].합 += s.size;
  if (s.size === 0) 셈[g].문0 += 1;
  else if (s.size === 1) 셈[g].문1 += 1;
}

console.log('갈래'.padEnd(18) + '지면'.padStart(6) + '  문0개' + '  문1개' + '  평균문');
for (const [k, v] of Object.entries(셈).filter(([, v]) => v.지면 >= 5).sort((a, b) => (b[1].문0 + b[1].문1) - (a[1].문0 + a[1].문1))) {
  const 평균 = (v.합 / v.지면).toFixed(1);
  const 표 = v.문0 ? ' 🔴 아무 데서도 안 걸린 지면이 있다' : v.문1 > v.지면 * 0.5 ? ' ⚠ 절반 넘게 문이 하나뿐' : '';
  console.log(k.padEnd(18) + String(v.지면).padStart(6) + String(v.문0).padStart(7) + String(v.문1).padStart(7) + 평균.padStart(9) + 표);
}
