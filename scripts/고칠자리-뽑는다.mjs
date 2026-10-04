/* 고칠 자리를 한꺼번에 뽑는다 — 하나씩 손으로 열어 보지 않는다 */
import fs from 'node:fs';
import path from 'node:path';
import * as m from './check-제목이-치는말인가.mjs';

/** dist 를 훑어 「길 → 제목」 표를 짓는다 */
function 제목표짓기(밑, 접두 = '') {
  const 표 = new Map();
  const 훑기 = (d, 길) => {
    for (const 이름 of fs.readdirSync(d)) {
      const p = path.join(d, 이름);
      if (fs.statSync(p).isDirectory()) { 훑기(p, `${길}/${이름}`); continue; }
      if (!이름.endsWith('.html')) continue;
      const t = (fs.readFileSync(p, 'utf8').match(/<title>([^<]*)/) || [])[1];
      if (!t) continue;
      const 쪽 = 이름 === 'index.html' ? (길 || '/') : `${길}/${이름.replace(/\.html$/, '')}`;
      표.set(쪽 || '/', t.trim());
      if (이름 === 'index.html' && 길) 표.set(`${길}/`, t.trim());
    }
  };
  if (fs.existsSync(밑)) 훑기(밑, 접두);
  return 표;
}

const 묶 = [
  ['100y', 'dist/100y', ''],
  ['kcw', 'dist/wikitip', ''],
  /* 🔴 [2026-10-04] seoulmarkets 는 dist/web 이 아니라 dist 뿌리에 난다 —
     경로를 틀려 「제목 못 읽음 12장」이 나왔다. 못 읽은 것을 흠으로 세면 안 된다 */
  ['seoulmarkets', 'dist', ''],
];
for (const [딱지, 밑] of 묶) {
  const f = `src/data/gsc-${딱지}-qp-2026-10-01.json`;
  if (!fs.existsSync(f)) { console.log(`⚠ ${딱지} — query+page 자료가 없다`); continue; }
  const 표 = 제목표짓기(밑);
  const 것 = m.고칠자리(JSON.parse(fs.readFileSync(f, 'utf8')), 표);
  if (것 === null) { console.log(`⚠ ${딱지} — 못 읽었다`); continue; }
  const 딴말 = 것.filter((x) => x.딴말 === true);
  const 모름 = 것.filter((x) => x.딴말 === null);
  console.log(`\n■ ${딱지} — 30위 밖 지면 ${것.length}장 · 제목에 그 말이 없는 곳 ${딴말.length}장 · 제목 못 읽음 ${모름.length}장`);
  for (const x of 딴말.slice(0, 6)) {
    console.log(`   노출 ${String(x.노출).padStart(3)} ${x.길}`);
    console.log(`      제목 ${String(x.제목).slice(0, 60)}`);
    console.log(`      치는 말 ${x.말들.slice(0, 3).join(' · ')}`);
  }
}
