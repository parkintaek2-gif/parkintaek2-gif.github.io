#!/usr/bin/env node
/**
 * check-title-experiment-lock.mjs — **실험이 도는 지면의 제목을 또 건드렸나**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-09-02 02:2x · 내가 내 규칙을 어겼다]
 *   `src/data/kcw-title-experiments.json` 의 첫 줄은 이렇게 적혀 있다 —
 *     「⛔ 다시 잴 날 전에 같은 지면 제목을 또 건드리면 두 변화가 섞여 아무것도 못 잰다」
 *   그런데 나는 그 줄을 읽지 않고 `/netflix-top10-data` 의 제목을 바꿨다.
 *   그 지면은 8/26 실험 묶음에 들어 있었고 다시잴날이 2026-09-24 였다.
 *   ⇒ 여덟 장 묶음 실험에서 **그 한 장은 값을 못 쓰게 됐다.**
 *
 * ⭐ 배운 것 — **규칙을 「문장」으로 두었더니 그 문장을 쓴 사람이 지나쳤다.**
 *   우리 강령 넷째 줄이 그것이다: 「규칙은 문장이 아니라 검사로 둔다.
 *   말로 하는 규칙은 잊힌다. 사람이 기억해서 지키는 구조를 만들지 않는다.」
 *   그래서 이 자를 만들었다. 이제 잠긴 지면을 건드리면 **배포 관문이 말해 준다.**
 *
 * [무엇을 재나]
 *   ① 실험 기록에서 «아직 잠긴» 지면을 뽑는다(다시잴날이 오늘보다 뒤)
 *   ② `git diff` 로 이번에 바뀐 원본 파일을 뽑는다
 *   ③ 바뀐 파일이 잠긴 지면을 만드는 자리인지 본다
 *   ⚠ 지면 주소 → 원본 파일은 «하나로 딱» 정해지지 않는다(`[...id].astro` 같은 것이 있다).
 *      그래서 이 자는 **막지 않고 말해 준다.** 잘못 잡아 배포를 멈추면 사람이 검사를 끈다.
 *
 * 쓰기:  node scripts/check-title-experiment-lock.mjs
 *        node scripts/check-title-experiment-lock.mjs --체크리스트
 *        node scripts/check-title-experiment-lock.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기록자리 = path.join(뿌리, 'src', 'data', 'kcw-title-experiments.json');

function 한국날짜(때 = new Date()) {
  return 때.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10);
}

/** 아직 잠긴 실험만. ⛔ 「없다」와 「못 읽었다」를 가른다. */
export function 잠긴것(오늘 = 한국날짜()) {
  let d;
  try { d = JSON.parse(fs.readFileSync(기록자리, 'utf8')); } catch (e) { return { 못읽음: String(e.message).slice(0, 60) }; }
  const 목록 = (d.실험 ?? []).filter((x) => x && x.다시잴날 && x.다시잴날 > 오늘);
  return { 목록 };
}

/** 이번에 바뀐 원본 파일들(커밋 안 된 것 + 방금 커밋한 것). */
function 바뀐파일() {
  const 모은다 = (args) => {
    try { return execFileSync('git', args, { cwd: 뿌리 }).toString().split('\n').filter(Boolean); }
    catch (e) { return []; }
  };
  return [...new Set([
    ...모은다(['diff', '--name-only']),
    ...모은다(['diff', '--cached', '--name-only']),
    ...모은다(['diff', '--name-only', 'HEAD~1', 'HEAD']),
  ])];
}

/** 지면 주소가 이 파일에서 만들어질 «수 있나». ⚠ 어림이다 — 막지 않고 말해 준다. */
function 닿나(지면, 파일) {
  if (!파일.startsWith('src/')) return false;
  /* 🔴 [2026-09-02 첫판이 여기서 거짓 양성을 냈다] 실험 «기록 파일»을 고치면
     그 안에 'title' 이 들어 있어 `/title` 지면을 건드린 것으로 잡혔다.
     ⇒ 기록 파일 자체는 언제나 뺀다. 그러지 않으면 기록을 적을 때마다 빨간불이고,
        늘 빨간 검사는 사람이 안 본다 — 그러면 정작 어긴 날에도 안 본다. */
  if (파일.endsWith('kcw-title-experiments.json')) return false;
  const 조각 = String(지면).replace(/^\//, '').replace(/\/\*$/, '').split('/').filter(Boolean);
  if (!조각.length) return false;
  /* 정확히 그 이름의 지면 파일인가 */
  if (파일.includes('/' + 조각.join('/') + '.astro')) return true;
  /* 묶음 지면(`[...id].astro` · `[month].astro`)이면 그 폴더가 걸리면 걸린 것으로 본다 */
  if (파일.includes('/' + 조각[0] + '/') && /\[.+\]\.astro$/.test(파일)) return true;
  /* 그 지면이 읽는 자료 파일도 제목을 바꿀 수 있다.
     ⚠ 낱말이 «파일 이름의 한 토막»으로 들어 있을 때만 본다 — 그냥 포함으로 보면
        'title' 이 'kcw-title-experiments' 를 잡는 식으로 헛것을 잡는다. */
  if (파일.startsWith('src/data/')) {
    /* ⚠ 지면 이름이 토막 둘일 수 있다(`star-signs`). 그래서 «이어진 토막»으로 본다 —
       자가시험이 `kcw-star-signs.json` 을 못 잡아서 알았다(토막 하나로만 봤다). */
    const 이름토막 = path.basename(파일).replace(/\.json$/, '').split(/[-_.]/);
    const 찾을토막 = 조각[0].split('-');
    for (let i = 0; i + 찾을토막.length <= 이름토막.length; i++) {
      if (찾을토막.every((t, k) => 이름토막[i + k] === t)) return true;
    }
  }
  return false;
}

export function 본다() {
  const 오늘 = 한국날짜();
  const j = 잠긴것(오늘);
  if (j.못읽음) return { 빛: '⬜', 줄: [`실험 기록을 못 읽었다 — ${j.못읽음} (0 으로 치지 않는다)`], 걸린수: 0 };
  const 파일들 = 바뀐파일();
  if (!파일들.length) return { 빛: '⬜', 줄: ['바뀐 원본이 없다 — 잴 것이 없다'], 걸린수: 0 };
  const 걸린것 = [];
  for (const 실험 of j.목록) {
    for (const 지면 of String(실험.지면).split(/[·,]/).map((s) => s.trim()).filter(Boolean)) {
      const 맞은파일 = 파일들.filter((f) => 닿나(지면, f));
      if (맞은파일.length) 걸린것.push({ 지면, 다시잴날: 실험.다시잴날, 파일: 맞은파일 });
    }
  }
  if (!걸린것.length) {
    return { 빛: '✅', 줄: [`잠긴 지면 ${j.목록.length}건 중 이번에 건드린 것 없다`], 걸린수: 0 };
  }
  const 줄 = ['🔴 **실험이 도는 지면을 건드렸다.** 두 변화가 섞이면 아무것도 못 잰다.'];
  for (const x of 걸린것) {
    줄.push(`   · ${x.지면}  (다시잴날 ${x.다시잴날})  ← ${x.파일.join(' · ')}`);
  }
  줄.push('   ⭐ 둘 중 하나를 «골라 적으십시오» — 조용히 지나가지 마십시오.');
  줄.push('      ① 되돌린다 — 실험을 지킨다');
  줄.push('      ② 그대로 낸다 — 그 지면의 옛 실험 값을 «못 쓴다»고 기록에 적고 창을 새로 센다');
  줄.push('   ⚠ 이 자는 어림이다(지면 주소 → 원본 파일이 하나로 딱 정해지지 않는다).');
  줄.push('      그래서 막지 않고 말해 준다. 잘못 잡아 배포를 멈추면 사람이 검사를 끈다.');
  return { 빛: '🔴', 줄, 걸린수: 걸린것.length };
}

function 자가시험() {
  let 흠 = 0;
  const 봐 = (참, 말) => { if (!참) { 흠++; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };
  const j = 잠긴것();
  봐(!j.못읽음, '실험 기록을 읽는다');
  봐(Array.isArray(j.목록), '잠긴 것을 목록으로 낸다');
  /* ⭐ 이 검사의 심장 — 「잠긴 것」을 «날짜»로 가르는가. 다 잠긴 것으로 보면 늘 빨간불이다 */
  const 옛것 = 잠긴것('2099-12-31');
  봐(옛것.목록.length === 0, '다시잴날이 지난 것은 잠긴 것으로 세지 않는다');
  /* 닿나() 가 실제로 갈라내나 */
  봐(닿나('/netflix-top10-data', 'src/pages/wikitip/netflix-top10-data.astro'), '지면 파일을 알아본다');
  봐(!닿나('/netflix-top10-data', 'src/pages/wikitip/about.astro'), '엉뚱한 파일은 안 잡는다');
  봐(!닿나('/netflix-top10-data', 'scripts/deploy.mjs'), 'src/ 밖은 안 잡는다');
  봐(닿나('/born-on/*', 'src/pages/wikitip/born-on/[day].astro'), '묶음 지면(대괄호)을 알아본다');
  /* 🔴 첫판이 여기서 거짓 양성을 냈다 — 기록 파일을 고치면 늘 빨간불이 됐다 */
  봐(!닿나('/title', 'src/data/kcw-title-experiments.json'), '실험 기록 파일 자체는 안 잡는다');
  봐(!닿나('/title', 'src/data/kcw-demand-gaps.json'), '이름에 그 낱말이 없는 자료는 안 잡는다');
  봐(닿나('/star-signs', 'src/data/kcw-star-signs.json'), '이름 토막이 맞는 자료는 잡는다');
  const r = 본다();
  봐(['✅', '🔴', '⬜'].includes(r.빛), '빛을 하나 낸다');
  console.log(흠 ? `\n🔴 흠 ${흠}개` : '\n✅ 흠 없다');
  process.exit(흠 ? 1 : 0);
}

const 줄들 = process.argv.slice(2);
if (줄들.includes('--자가시험')) 자가시험();
else {
  const r = 본다();
  if (줄들.includes('--체크리스트')) console.log(`${r.빛} 제목 실험 잠금 — ${r.줄[0].replace(/\*\*/g, '')}`);
  else {
    console.log('# 실험이 도는 지면의 제목을 또 건드렸나\n');
    for (const 줄 of r.줄) console.log(줄);
  }
  /* ⚠ 걸려도 1 을 내지 않는다 — 막는 자가 아니라 «말해 주는» 자다 */
  process.exit(0);
}
