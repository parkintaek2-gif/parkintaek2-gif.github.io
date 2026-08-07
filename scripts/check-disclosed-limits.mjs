/**
 * 빌드가 **세어 둔 한계값**을 지면이 실제로 보여 주는지 본다.
 *
 * ── 왜 만드나 (2026-08-07 21:2x) ───────────────────────────────
 * `wikitip-titles.json` 과 `wikitip-reach.json` 은 `unlabelledTitles` 를 세어 두고 있었다.
 * 405편 중 **204편이 언어로 확인이 안 된다**는 뜻이다.
 * **그런데 어느 지면도 그 값을 안 썼다.** 세어 놓고 안 보여 주면 안 센 것과 같다.
 *
 * 우리가 파는 것은 숫자가 아니라 **숫자의 한계까지 적는다는 것**이다.
 * 한계를 자료에만 두고 지면에 안 쓰면 그 약속이 깨진다. 그래서 검사로 묶는다.
 *
 * ── 무엇을 보나 ────────────────────────────────────────────────
 * 자료에 아래 열쇠가 있으면, **그 값을 쓰는 지면이 하나라도 있어야 한다.**
 * ⛔ 숫자를 지면에 손으로 적어 통과시키지 않는다. `data.<열쇠>` 로 **읽어야** 통과다.
 *    손으로 적으면 자료가 바뀔 때 지면만 옛 수를 말한다.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA = 'src/data';
const PAGES = 'src/pages/wikitip';

/** 「이건 못 쟀다」를 담은 열쇠들. 자료에 있으면 지면이 말해야 한다. */
const 한계열쇠 = ['unlabelledTitles', 'excludedEnglishChart', 'excludedByHand'];

/** 자료 파일 → 그것을 읽는 지면들. 지면이 `import x from '.../<파일>'` 하는지로 찾는다. */
function 지면들() {
  const out = new Map();
  for (const f of fs.readdirSync(PAGES).filter((x) => x.endsWith('.astro'))) {
    const s = fs.readFileSync(path.join(PAGES, f), 'utf8');
    for (const m of s.matchAll(/from\s+['"][^'"]*data\/([a-z0-9-]+\.json)['"]/g)) {
      const 이름 = (s.match(new RegExp(`import\\s+(\\w+)\\s+from\\s+['"][^'"]*${m[1].replace('.', '\\.')}['"]`)) || [, null])[1];
      if (!out.has(m[1])) out.set(m[1], []);
      out.get(m[1]).push({ 지면: f, 변수: 이름, 글: s });
    }
  }
  return out;
}

const 지면 = 지면들();
let 틀림 = 0;
let 본것 = 0;
for (const f of fs.readdirSync(DATA).filter((x) => /^wikitip-.*\.json$/.test(x))) {
  const j = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  for (const 열쇠 of 한계열쇠) {
    if (!(열쇠 in j)) continue;
    const 값 = j[열쇠];
    /* 빈 것은 말할 것이 없다 — 0 이나 빈 배열이면 안 본다. */
    if (값 === 0 || (Array.isArray(값) && 값.length === 0)) continue;
    본것++;
    const 쓰는곳 = (지면.get(f) ?? []).filter((p) => p.변수 && p.글.includes(`${p.변수}.${열쇠}`));
    const ok = 쓰는곳.length > 0;
    if (!ok) 틀림++;
    console.log(`${ok ? '  ' : '❌'} ${f.padEnd(30)} ${열쇠.padEnd(22)}`
      + ` ${Array.isArray(값) ? `${값.length}건` : 값}`
      + ` → ${ok ? 쓰는곳.map((p) => p.지면).join(' · ') : '**어느 지면도 안 쓴다**'}`);
  }
}

if (!본것) { console.log('  · 자료에 한계 열쇠가 없다 — 볼 것이 없다'); }
if (틀림) {
  console.error(`\n❌ ${틀림}건. 빌드가 세어 둔 한계를 지면이 말하지 않는다.`);
  console.error('   ⛔ 자료에서 열쇠를 지우지 않는다. **지면이 그 값을 읽어 쓰게** 한다.');
  console.error('   ⛔ 숫자를 지면에 손으로 적지 않는다. 자료가 바뀌면 지면만 옛 수를 말하게 된다.');
  process.exit(1);
}
console.log(`\n✅ 세어 둔 한계 ${본것}개를 지면이 전부 말한다`);
