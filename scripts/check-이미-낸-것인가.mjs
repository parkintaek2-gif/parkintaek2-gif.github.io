#!/usr/bin/env node
/**
 * check-이미-낸-것인가.mjs — **쓰기 전에 「이미 냈나」를 묻는다**
 *
 * ── 🔴 왜 이 자가 있나 (2026-10-10 15:0x · 5번) ──────────────────────────
 *
 * 오늘 하루에 **세 번** 같은 일을 했다 —
 * ```
 *   09:0x  KRX 공개 API 지면을 «새로 짜서 빌드까지» 했다
 *          → `dist/` 에 krx-open-api-fields.html 이 이미 있었다. 09-30 에 내가 냈다
 *          → 목록을 `head -40` 으로 잘라 보고 「없다」로 읽은 것이었다
 *   15:0x  펀드 등록원부를 반나절 파서 「설정일 자리표 5개」를 찾아냈다
 *          → `/data/fund-shelf` 지면이 이미 적고 있었다 —
 *            「183,351 registered codes · **183,346 with a readable establishment date**」
 *            183,351 − 183,346 = 5. 내가 찾은 그 다섯이다
 * ```
 * ⛔ 12:0x 메모에 **내가 직접** 적어 뒀다 — 「새 지면을 짜기 전에 같은 것이 이미
 *   있는지부터 본다. 목록을 자르지 말고 grep 으로 찾는다」. 적어 놓고 세 시간 뒤에 또 밟았다.
 * ⭐ **말로 적는 것으로는 안 막힌다.** 오늘 사이트맵 누락에서 배운 것과 같다.
 *
 * ── 어떻게 재나 ────────────────────────────────────────────────────
 *   낸 글·지면이 어느 «자료»를 썼는지는 추적하기 어렵다. 그런데 **수**는 추적할 수 있다.
 *   값진 발견에는 거의 언제나 수가 붙는다 — 183,351 · 7.14조 · 90개 …
 *   ⇒ **그 수를 저장소와 라이브에서 찾는다.** 이미 나오면 누가 벌써 쓴 것이다.
 *
 * ⛔ 이 자는 「쓰지 마라」고 말하지 않는다. **「여기 이미 있다」고 알려 줄 뿐**이다.
 *   같은 수를 다른 각도로 쓰는 것은 괜찮다 — 다만 «모르고» 쓰는 것은 아니어야 한다.
 *
 * 돌리기:  node scripts/check-이미-낸-것인가.mjs 183351 "7.14"
 *          node scripts/check-이미-낸-것인가.mjs --시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 수를 여러 꼴로 늘린다 — 183351 · 183,351 둘 다 찾아야 한다 */
export function 찾을꼴들(수) {
  const s = String(수 ?? '').trim();
  if (!s) return [];
  const 꼴 = new Set([s]);
  const 숫자만 = s.replace(/,/g, '');
  if (/^\d+$/.test(숫자만)) {
    꼴.add(숫자만);
    꼴.add(Number(숫자만).toLocaleString('en-US'));
    꼴.add(Number(숫자만).toLocaleString('ko-KR'));
  }
  return [...꼴].filter(Boolean);
}

/** 글 안에 그 수가 있나 — 꼴 가운데 하나라도 맞으면 있다 */
export function 들었나(글, 수) {
  const g = String(글 ?? '');
  return 찾을꼴들(수).some((f) => g.includes(f));
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--시험')) {
  const 틀렸다 = [];
  const 본다 = (이름, 참) => { if (!참) 틀렸다.push(이름); };

  본다('쉼표 있는 꼴을 만든다', 찾을꼴들('183351').includes('183,351'));
  본다('쉼표 없는 꼴도 만든다', 찾을꼴들('183,351').includes('183351'));
  본다('🔴 쉼표 붙은 글에서 맨숫자를 찾는다 — 오늘 실제로 이랬다',
    들었나('183,351 registered codes', '183351'));
  본다('맨숫자 글에서 쉼표 꼴을 찾는다', 들었나('total 183351 rows', '183,351'));
  본다('소수도 그대로 찾는다', 들었나('KRW 7.14tn of market cap', '7.14'));
  /* ⛔ 아무거나 다 맞다고 하면 쓸모가 없다 */
  본다('⛔ 없는 수는 «없다»고 한다', !들었나('183,351 registered codes', '999999'));
  본다('빈 수에 안 터진다', 찾을꼴들('').length === 0 && !들었나('글', ''));

  console.log(틀렸다.length ? `🔴 자가시험 ${틀렸다.length}칸 틀림\n  - ${틀렸다.join('\n  - ')}`
    : '✅ 자가시험 7칸 다 지나감');
  process.exit(틀렸다.length ? 1 : 0);
}

/* ── 실제로 재기 ──────────────────────────────────────────────────────── */
const 수들 = process.argv.slice(2).filter((x) => !x.startsWith('--'));
if (!수들.length) {
  console.log('■ 쓰기 전에 「이미 냈나」를 묻는다');
  console.log('   쓰기:  node scripts/check-이미-낸-것인가.mjs <수> [<수> …]');
  console.log('   보기:  node scripts/check-이미-낸-것인가.mjs 183351 7.14');
  console.log('\n⭐ 값진 발견에는 거의 언제나 수가 붙는다. 그 수로 찾으면 이미 냈는지 안다.');
  process.exit(0);
}

/** 볼 자리 — 손님에게 나간 것과 저장소의 글 */
const 볼곳 = [
  { 이름: '낸 지면(dist)', 길: path.join(뿌리, 'dist'), 꼴: /\.html$/, 깊이: 3 },
  { 이름: '기사 원고', 길: path.join(뿌리, 'content', 'articles'), 꼴: /\.md$/, 깊이: 1 },
  { 이름: '지면 소스', 길: path.join(뿌리, 'src', 'pages'), 꼴: /\.(astro|ts)$/, 깊이: 3 },
];

function 훑기(길, 꼴, 깊이) {
  const 모음 = [];
  if (깊이 < 0) return 모음;
  let 것들 = [];
  try { 것들 = fs.readdirSync(길, { withFileTypes: true }); } catch { return 모음; }
  for (const e of 것들) {
    const p = path.join(길, e.name);
    if (e.isDirectory()) 모음.push(...훑기(p, 꼴, 깊이 - 1));
    else if (꼴.test(e.name)) 모음.push(p);
  }
  return 모음;
}

console.log(`■ 「이미 냈나」 — 찾는 수: ${수들.join(' · ')}\n`);
let 찾음 = 0;

for (const 곳 of 볼곳) {
  const 파일들 = 훑기(곳.길, 곳.꼴, 곳.깊이);
  if (!파일들.length) { console.log(`■ ${곳.이름} — ⚠ 볼 파일이 없다(빌드 전일 수 있다)`); continue; }
  const 걸린것 = [];
  for (const f of 파일들) {
    let 글 = '';
    try { 글 = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const 맞은수 = 수들.filter((n) => 들었나(글, n));
    if (맞은수.length) 걸린것.push({ f: path.relative(뿌리, f), 맞은수 });
  }
  console.log(`■ ${곳.이름} — 파일 ${파일들.length.toLocaleString()}개 가운데 **${걸린것.length}개**에 있다`);
  걸린것.slice(0, 10).forEach((x) => console.log(`     ${x.f}   [${x.맞은수.join(' · ')}]`));
  if (걸린것.length > 10) console.log(`     … 그 밖 ${걸린것.length - 10}개`);
  찾음 += 걸린것.length;
}

console.log('');
if (찾음) {
  console.log('🔴 **이미 어딘가에 나와 있다.** 쓰기 전에 그것부터 읽으십시오.');
  console.log('   ⛔ 「쓰지 마라」는 뜻이 아닙니다 — 같은 수를 다른 각도로 쓰는 것은 괜찮습니다.');
  console.log('     다만 «모르고» 쓰면 같은 글을 두 번 내게 됩니다.');
} else {
  console.log('✅ 저장소와 낸 지면에서 그 수를 못 찾았다 — 아직 안 쓴 축으로 보인다.');
  console.log('   ⚠ 다만 이 자는 «수»로만 찾는다. 수 없이 쓴 글은 못 잡는다.');
}
