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
 * ⭐ 117가지는 사실 **고칠 지면 11장**이었다. 같은 뜻의 말이 한 지면에 여럿 붙기 때문이다.
 *   「가짓수」는 일을 열 배로 부풀려 보이게 한다 — 사람이 할 일의 크기는 «지면 수»다.
 *
 * 쓰는 법  node scripts/고칠자리-뽑는다.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as m from './check-제목이-치는말인가.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 어느 사이트의 query+page 자료를 읽나 */
export const 볼것 = ['100y', 'kcw', 'seoulmarkets'];

/**
 * 그 사이트의 가장 최근 query+page 자료. ⛔ 없으면 null
 * 🔴 [2026-10-04] `gsc-kcw-qp-7d-2026-09-01.json` 이라는 **다른 갈래**가 섞여 들어왔다.
 *   이름이 `gsc-kcw-qp-` 로 시작해서 걸렸고, 7일치 306줄을 28일치로 읽어
 *   「고칠 지면 8장」이 「99장」으로 뛰었다.
 *   ⛔ 이름이 비슷하다고 같은 자료가 아니다. 날짜 꼴까지 못 박는다.
 */
export function 최근qp(딱지) {
  const 밑 = path.join(뿌리, 'src/data');
  const 꼴 = new RegExp(`^gsc-${딱지}-qp-\\d{4}-\\d{2}-\\d{2}\\.json$`);
  const 것들 = fs.readdirSync(밑).filter((n) => 꼴.test(n)).sort();
  const 마지막 = 것들[것들.length - 1];
  if (!마지막) return null;
  try { return JSON.parse(fs.readFileSync(path.join(밑, 마지막), 'utf8')); } catch { return null; }
}

/** 네 사이트를 다 세어 「고칠 지면 수」를 낸다. ⛔ 하나도 못 읽으면 null */
export function 고칠장수(제목표 = null) {
  const 표 = 제목표 ?? m.제목표짓기();
  let 합 = 0; let 읽은곳 = 0;
  for (const 딱지 of 볼것) {
    const qp = 최근qp(딱지);
    if (!qp) continue;
    const 것 = m.고칠자리(qp, 표);
    if (것 === null) continue;
    읽은곳 += 1;
    합 += 것.filter((x) => x.딴말 === true).length;
  }
  return 읽은곳 ? 합 : null;
}

const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 표 = m.제목표짓기();
  for (const 딱지 of 볼것) {
    const qp = 최근qp(딱지);
    if (!qp) { console.log(`⚠ ${딱지} — query+page 자료가 없다`); continue; }
    const 것 = m.고칠자리(qp, 표);
    if (것 === null) { console.log(`⚠ ${딱지} — 못 읽었다`); continue; }
    const 딴말 = 것.filter((x) => x.딴말 === true);
    const 모름 = 것.filter((x) => x.딴말 === null);
    console.log(`\n■ ${딱지} — ${m.뒤처진선}위 밖 지면 ${것.length}장`
      + ` · 제목에 그 말이 없는 곳 ${딴말.length}장 · 제목 못 읽음 ${모름.length}장`);
    for (const x of 딴말.slice(0, 8)) {
      console.log(`   노출 ${String(x.노출).padStart(3)} ${x.길}`);
      console.log(`      제목 ${String(x.제목).slice(0, 62)}`);
      console.log(`      치는 말 ${x.말들.slice(0, 3).join(' · ')}`);
    }
    for (const x of 모름.slice(0, 3)) {
      console.log(`   ⬜ 제목 못 읽음 ${x.길} — 지운 지면인지 먼저 본다 (치는 말 ${x.말들[0]})`);
    }
  }
  console.log('\n⛔ 집었다고 다 고치지 않는다 — 그 말에 답할 자료가 우리에게 있는지 사람이 본다.');
}
