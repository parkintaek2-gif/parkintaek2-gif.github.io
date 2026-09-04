#!/usr/bin/env node
/**
 * check-live-is-my-head.mjs — **「배포했다」와 「라이브에 있다」는 다른 말이다**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-09-01 밤 · 5번이 klifemap 에서 두 시간을 헛돌았다]
 *   배포 명령이 「deployed」라 답하고 배포 자가 「새 포드가 떴다 ✅」까지 찍었는데
 *   **라이브 파일은 옛 것이었다.** 두 판을 잇달아 배포하고도 그랬다.
 *   실측 — 23:53 에 배포했는데 라이브는 23:09~23:29 사이의 빌드였다.
 *   까닭 — 그 통은 **빌드와 배포가 따로 돈다.** git push 가 이미지를 굽고, 배포 명령은
 *   «이미 구워진» 이미지를 내린다. 굽는 데 몇 분 걸리므로 밀자마자 배포하면
 *   **직전 이미지가 다시 내려간다.**
 *   ⛔ 그 사이 나는 라이브에서 재고 「고쳤는데 왜 안 되지」로 코드를 또 뒤졌다.
 *      «배포됐다는 말»을 믿은 것이 잘못이다.
 *
 * [이 저장소는 자를 어떻게 세우나 — klifemap 과 다르다]
 *   klifemap 은 `public/` 파일을 그대로 내주므로 파일끼리 견주면 됐다.
 *   이 저장소는 Astro 라 대부분이 **빌드마다 이름·내용이 바뀐다.** 재 보니 —
 *     public/comments-widget.js  4,696B → 4,696B  (그대로 나간다)
 *     public/robots.txt            154B →   360B  (빌드가 세 지면용으로 다시 만든다)
 *     public/llms.txt           12,276B → 27,501B (같음)
 *     public/ads.txt                60B →    59B  (줄바꿈이 다르다)
 *     public/favicon.svg           373B → 1,023B  (지면마다 다르다)
 *   ⇒ 그대로 나가는 것이 **하나뿐**이다. 하나로는 「그 파일만 안 바뀐 날」에 속는다.
 *   ⭐ 그래서 **도장을 찍는다** — 배포 직전에 지금 커밋을 적은 파일을 하나 두고,
 *      배포 뒤 라이브에서 그 파일을 읽어 «글자 그대로» 견준다. 늘 참인 자다.
 *
 * 쓰기:  node scripts/check-live-is-my-head.mjs --도장찍기      배포 «전»에 (커밋 대상)
 *        node scripts/check-live-is-my-head.mjs                배포 «뒤»에 견준다
 *        node scripts/check-live-is-my-head.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
/* ⚠ 이름을 ASCII 로 둔다 — 주소에 한글이 들어가면 프록시·캐시를 지나며 인코딩이 갈린다.
   그리고 이 파일은 «뿌리»에만 있으므로 server.mjs 의 `공유경로` 에 등록해야
   세 호스트에서 다 보인다(안 하면 KCW·백년지도에서 404 다 — 실제로 그랬다). */
export const 도장자리 = path.join(뿌리, 'public', 'deploy-stamp.txt');
/** 세 지면이 한 저장소를 쓴다 — 셋 다 본다. 하나만 보면 나머지 둘이 옛 것인 줄 모른다. */
export const 지면들 = [
  ['K Culture Wire', 'https://www.kculturewire.com'],
  ['SeoulMarkets', 'https://seoulmarkets.com'],
  ['백년지도', 'https://100yearmap.com'],
];

function 지금커밋() {
  try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: 뿌리 }).toString().trim(); }
  catch (e) { return null; }
}
function 한국시각() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
}

/** 배포 «전»에 도장을 찍는다. ⛔ 찍은 뒤 커밋·밀기까지 해야 라이브에 나간다. */
export function 도장찍기() {
  const 커밋 = 지금커밋();
  const 글 = [
    '# 배포 도장 — 이 파일이 라이브에 그대로 보이면 그 배포가 «정말» 나간 것이다.',
    '# 만든 자: scripts/check-live-is-my-head.mjs  (2026-09-01 5번)',
    '# ⛔ 손으로 고치지 마십시오. 배포 자가 매번 다시 씁니다.',
    `커밋=${커밋 || '못읽음'}`,
    `찍은때(KST)=${한국시각()}`,
    '',
  ].join('\n');
  fs.writeFileSync(도장자리, 글, 'utf8');
  console.log('도장을 찍었다 — public/deploy-stamp.txt (커밋 ' + (커밋 || '못읽음') + ')');
  console.log('⚠ 이 파일을 «커밋하고 밀어야» 라이브에 나갑니다.');
  return 글;
}

/**
 * 🔴🔴 [2026-09-05 06:3x] **이 자가 거짓 초록을 냈다.**
 *   이름은 「라이브가 지금 내 HEAD 와 같은가」인데, 실제로는 «마지막에 찍은 도장»과
 *   라이브를 견준다. 그래서 **커밋만 하고 배포를 안 하면 초록이 뜬다.**
 *   실측 — HEAD 가 e545c9bd 인데 자는 「같다 (커밋 ae2a314e)」라고 했고,
 *   그때 새 기사는 라이브에서 **404** 였다.
 * ⛔ 「손님이 지금 새 것을 받는다」는 말이 그 상태에서 나오면 안 된다.
 *   이 문장은 deploy.mjs 끝에도 찍히므로, 배포를 다 했다고 믿게 만든다.
 * ✅ 그래서 «도장이 HEAD 보다 뒤처졌나»를 따로 재서 함께 말한다.
 *   ⚠ 뒤처진 것이 곧 잘못은 아니다 — 커밋만 하고 아직 배포 안 한 상태가 그렇다.
 *     그러니 «세우지» 않고 그 사실을 «적는다».
 */
export function 도장이HEAD보다뒤처졌나() {
  const 지금 = 지금커밋();
  let 도장;
  try { 도장 = fs.readFileSync(도장자리, 'utf8'); } catch { return { 잼: false, 까닭: '도장이 없다' }; }
  const 찍힌 = (/커밋=(\S+)/.exec(도장) || [])[1] || null;
  if (!지금 || !찍힌) return { 잼: false, 까닭: '커밋을 못 읽었다' };
  return { 잼: true, 지금, 찍힌, 뒤처졌나: 지금 !== 찍힌 };
}

export async function 견준다({ 조용히 = false } = {}) {
  let 내것;
  try { 내것 = fs.readFileSync(도장자리, 'utf8'); }
  catch (e) {
    if (!조용히) console.log('⬜ 도장이 아직 없다 — 못 쟀다(0 으로 치지 않는다). 먼저 --도장찍기');
    return { 못잼: true, 다른것: 0 };
  }
  const 결과 = [];
  for (const [이름, 밑] of 지면들) {
    try {
      const r = await fetch(`${밑}/deploy-stamp.txt?cb=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
      if (!r.ok) { 결과.push({ 이름, 상태: `못 받았다(${r.status})` }); continue; }
      const 라이브 = await r.text();
      const 고르기 = (s) => s.split('\r\n').join('\n').trim();
      결과.push({ 이름, 같나: 고르기(라이브) === 고르기(내것),
        라이브커밋: (/커밋=(\S+)/.exec(라이브) || [])[1] || '?',
        내커밋: (/커밋=(\S+)/.exec(내것) || [])[1] || '?' });
    } catch (e) { 결과.push({ 이름, 상태: '못 받았다 — ' + String(e.message).slice(0, 50) }); }
  }
  const 다른것 = 결과.filter((x) => x.같나 === false);
  const 못잰것 = 결과.filter((x) => x.같나 === undefined);
  if (!조용히) {
    console.log('\n# 라이브가 지금 내 HEAD 와 같은가 (배포 도장으로 견줌)\n');
    for (const x of 결과) {
      if (x.같나 === true) console.log(`  ✅ ${x.이름.padEnd(16)} 같다 (커밋 ${x.내커밋})`);
      else if (x.같나 === false) console.log(`  🔴 ${x.이름.padEnd(16)} **다르다** — 내 ${x.내커밋} · 라이브 ${x.라이브커밋}`);
      else console.log(`  ⬜ ${x.이름.padEnd(16)} 못 쟀다 — ${x.상태}`);
    }
    if (다른것.length) {
      console.log('\n🔴🔴 **라이브가 아직 옛 것이다.** 배포 명령은 성공했지만 구워진 이미지가 옛 것이다.');
      console.log('   ⭐ 몇 분 기다린 뒤 **다시 배포**하십시오. 코드를 또 뒤지지 마십시오.');
      console.log('   ⚠ 2026-09-01 밤에 5번이 그렇게 두 시간을 헛돌았습니다.');
    } else if (못잰것.length) {
      console.log('\n⬜ 일부를 못 쟀다 — 0 으로 치지 않는다.');
    } else {
      const 뒤 = 도장이HEAD보다뒤처졌나();
      if (뒤.잼 && 뒤.뒤처졌나) {
        console.log('\n🔴 **라이브는 «도장»과 같지만, 그 도장이 내 HEAD 가 아니다.**');
        console.log(`   도장 ${뒤.찍힌} · 지금 HEAD ${뒤.지금}`);
        console.log('   ⇒ 커밋만 하고 «배포를 안 했다». 새로 낸 것은 라이브에 없다(404 다).');
        console.log('   ⛔ 이 상태를 「손님이 새 것을 받는다」로 읽지 않는다. 배포하십시오.');
      } else if (뒤.잼) {
        console.log('\n✅ 세 지면 다 내 HEAD 와 같다 — 손님이 지금 새 것을 받는다.');
      } else {
        console.log(`\n⬜ 라이브는 도장과 같다. 다만 HEAD 와 견주지는 못했다 — ${뒤.까닭}`);
      }
    }
  }
  return { 결과, 다른것: 다른것.length, 못잰것: 못잰것.length };
}

async function 자가시험() {
  let 흠 = 0;
  const 봐 = (참, 말) => { if (!참) { 흠++; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };
  봐(지면들.length === 3, '세 지면을 다 본다(한 저장소가 셋을 낸다 — 하나만 보면 나머지를 모른다)');
  봐(!!지금커밋(), '지금 커밋을 읽는다');
  const 글 = 도장찍기();
  봐(글.includes('커밋='), '도장에 커밋이 든다');
  /* 🔴 거짓 초록을 냈던 자리 — 도장과 HEAD 가 다른 것을 «말하는지» 잰다 */
  const 뒤1 = 도장이HEAD보다뒤처졌나();
  봐(뒤1.잼 === true, '도장과 HEAD 를 견줄 수 있다');
  봐(뒤1.뒤처졌나 === false, '방금 도장을 찍었으니 뒤처지지 않았다');
  fs.writeFileSync(도장자리, '# 배포 도장\n커밋=deadbeef\n', 'utf8');
  const 뒤2 = 도장이HEAD보다뒤처졌나();
  봐(뒤2.뒤처졌나 === true, '🔴 도장이 옛 커밋이면 «뒤처졌다»고 말한다');
  도장찍기();                                   // 시험이 남긴 것을 되돌린다
  봐(글.includes('찍은때'), '도장에 찍은 때가 든다');
  봐(fs.existsSync(도장자리), '도장 파일이 만들어진다');
  /* ⛔ 도장을 «라이브에서» 읽어 견주는지 — 내 파일끼리 견주면 늘 초록이다(헛것) */
  const 나 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  봐(나.includes('deploy-stamp.txt?cb='), '라이브에서 도장을 받아 온다(내 파일끼리 견주지 않는다)');
  console.log(흠 ? `\n🔴 흠 ${흠}개` : '\n✅ 흠 없다');
  process.exit(흠 ? 1 : 0);
}

const 줄들 = process.argv.slice(2);
if (줄들.includes('--자가시험')) 자가시험();
else if (줄들.includes('--도장찍기')) 도장찍기();
else if (process.argv[1] && process.argv[1].includes('check-live-is-my-head')) {
  견준다().then((r) => process.exit(r.다른것 ? 1 : 0));
}
