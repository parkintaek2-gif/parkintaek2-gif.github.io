/**
 * 고칠자리-뽑는다.mjs — **어느 지면의 제목에 어느 말이 없는지 한꺼번에 뽑는다.**
 *
 * 🔴🔴 [2026-10-04 · 5번] **이 자가 집었다고 다 고치는 것이 «아니다».**
 *
 *   오늘 7장을 집었는데 그중 넷은 고치면 «거짓»이 되는 자리였다 —
 * ```
 *   /school/7530071  치는 말 「부천고등학교 순위」   우리 제목 「진학률 60.0%」
 *   /university/...  치는 말 「한신대 평판」         우리 제목 「취업률」
 *   /school/7240450  치는 말 「대구국제고 경쟁률」   우리 제목 「진학률 82.1%」
 * ```
 *   **순위·평판·경쟁률은 우리에게 «없는 자료»다.** 제목에 그 말을 넣으면 손님이
 *   들어와서 없는 것을 찾는다. 그것은 낱말을 쌓는 짓이고 우리 강령에 어긋난다.
 *
 *   ⇒ 자는 「이 말이 제목에 없다」까지만 말한다. **「그 말에 답할 자료가 우리에게
 *     있는가」는 사람이 판단한다.** 없으면 그대로 둔다 — 그것도 결과다.
 *
 * 🔴 **「제목 못 읽음」도 흠이 아닐 수 있다.**
 *   오늘 `/ladder-gap` 이 그랬다 — 구글은 그 주소로 우리를 다섯 말에 보여 주는데
 *   우리 dist 에는 그 지면이 없다. 사장님이 「Riot 을 걷어내라」 하셔서 지운 지면이고
 *   지금은 301 로 넘어간다. **구글이 옛 주소를 아직 들고 있을 뿐**이다.
 *   ⛔ 지운 지면을 「제목이 틀렸다」로 읽고 되살리지 않는다 — 지시를 되돌리는 짓이다.
 *   ⇒ 못 읽은 것은 «왜 없는지»를 먼저 본다. 지운 것인지, 경로가 틀린 것인지.
 *
 * 쓰는 법  node scripts/고칠자리-뽑는다.mjs
 */
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
