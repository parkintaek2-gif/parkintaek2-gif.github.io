#!/usr/bin/env node
/**
 * **손님 눈으로 넘겨 본다** — 사장님 지시(2026-08-14) 여섯 물음 중 자로 잴 수 있는 것.
 *
 * 🔴 사장님: 「사이트는 내가 진짜 안 봐도 되게 완벽하게 **무오류**가 될 때까지 검수 및 감수」
 *   무오류 = **사장님이 손수 찾으신 흠이 0개**. 「검수 완료」는 무오류가 아니다.
 *
 * ── 사장님이 주신 여섯 물음, 그리고 이 자가 맡는 몫 ────────────
 * ```
 * 1 오류 문구·빈칸·깨진 글자        → check-kcw-garbage.mjs 가 맡는다 (778장 통과)
 * 2 값·전화·이메일이 지금 것인가     → ⭐ 이 자가 잰다
 * 3 날짜가 오늘인가(굳은 날짜)       → ⭐ 이 자가 잰다
 * 4 앞뒤 말이 어긋나나              → ⭐ 이 자가 잰다 (같은 수가 두 값으로 나오나)
 * 5 기분 상할 문장                  → ⛔ 자로 못 잰다. 사람이 읽는다
 * 6 몇 살 손님의 것인가             → ⛔ 자로 못 잰다. 사람이 읽는다
 * ```
 * ⛔ 5·6 을 「통과」로 적지 않는다. **못 잰다고 적는다.** 안 본 것을 봤다고 적는 것이
 *   8/14 사고의 뿌리라고 사장님이 짚으셨다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 방 = 'dist/wikitip';

/** 지금 쓰는 값. ⛔ 여기 없는 옛것이 화면에 있으면 흠이다 */
export const 살아있는것 = {
  이메일: [],                    /* 아래 옛것목록과 짝. 라이브 값은 src/consts.ts 에서 읽는다 */
  주소: 'www.kculturewire.com',
};

/** 🔴 옛 이메일 — 2번이 8/14 에 네 사이트 첫 화면에서 찾은 것 */
export const 옛것 = [
  { 이름: '옛 대표메일', 자: /sibcheongan@gmail\.com/gi },
  { 이름: '옛 도메인(wiki-tip)', 자: /wiki-tip\.com/gi },
  { 이름: 'localhost 주소', 자: /localhost:\d+/g },
  { 이름: '보기용 주소', 자: /example\.(com|org)/gi },
];

/** 굳은 날짜 — 화면에 박힌 「오늘」이 어제 것이면 흠이다 */
export function 굳은날짜(글자, 오늘) {
  const 나온것 = [...new Set(글자.match(/\b20\d{2}-\d{2}-\d{2}\b/g) ?? [])];
  const 앞날 = 나온것.filter((d) => d > 오늘);
  return { 나온것, 앞날 };
}

/**
 * ⭐ 앞뒤가 어긋나나 — **같은 이름 옆에 두 값**이 나오면 잡는다.
 *   ⚠ 8/9 에 `/home-abroad` 에서 같은 무리를 355 와 378 로 적은 적이 있다.
 *      그때 검사기는 앞의 수만 읽어서 통과시켰다.
 */
export function 한화면두값(글자, 이름들) {
  const 걸린것 = [];
  for (const 이름 of 이름들) {
    const 자 = new RegExp(`${이름}[^.]{0,40}?([\\d,]+(?:\\.\\d+)?)`, 'gi');
    const 값 = [...new Set([...글자.matchAll(자)].map((m) => m[1]))];
    if (값.length > 1) 걸린것.push({ 이름, 값 });
  }
  return 걸린것;
}

export function 보이는글자(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 160)}`); }
  };
  재본다('🔴 옛 대표메일을 잡는다',
    옛것.filter((x) => 'mail sibcheongan@gmail.com'.match(x.자)).map((x) => x.이름), ['옛 대표메일']);
  재본다('⛔ 지금 도메인은 안 잡는다',
    옛것.filter((x) => 'www.kculturewire.com'.match(x.자)).length, 0);
  재본다('localhost 를 잡는다',
    옛것.filter((x) => 'http://localhost:4321/x'.match(x.자)).map((x) => x.이름), ['localhost 주소']);
  재본다('굳은날짜 — 앞날짜를 잡는다',
    굳은날짜('as of 2026-09-01', '2026-08-14').앞날, ['2026-09-01']);
  재본다('굳은날짜 — 지난 날은 흠이 아니다',
    굳은날짜('data as of 2026-08-10', '2026-08-14').앞날, []);
  재본다('🔴 한 화면에 같은 이름 두 값이면 잡는다',
    한화면두값('the panel of 355 titles … that same panel of 378 titles', ['panel of']).length, 1);
  재본다('⛔ 값이 하나면 안 잡는다',
    한화면두값('the panel of 355 titles, and 355 again', ['panel of']), []);
  재본다('보이는글자 — 코드 안은 뺀다',
    보이는글자('<script>var a="x@y.com"</script><p>ok</p>').trim(), 'ok');
  console.log(`손님 눈 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(방)) { console.error(`⛔ ${방} 이 없다 — npm run build 먼저`); process.exit(1); }
  const 오늘 = new Date().toLocaleDateString('sv-SE');   /* KST. ⛔ toISOString 은 UTC 다 */

  const 파일들 = [];
  const 담기 = (곳) => {
    for (const 것 of fs.readdirSync(곳, { withFileTypes: true })) {
      const 길 = path.join(곳, 것.name);
      if (것.isDirectory()) 담기(길);
      else if (것.name.endsWith('.html')) 파일들.push(길);
    }
  };
  담기(방);

  const 걸린것 = [];
  const 날짜모음 = new Map();
  for (const f of 파일들) {
    const 글자 = 보이는글자(fs.readFileSync(f, 'utf8'));
    const 흠 = [];
    for (const x of 옛것) {
      const m = 글자.match(x.자);
      if (m) 흠.push(`${x.이름} ×${m.length} 「${m[0]}」`);
    }
    const { 나온것, 앞날 } = 굳은날짜(글자, 오늘);
    if (앞날.length) 흠.push(`앞날짜 ${앞날.join(', ')}`);
    for (const d of 나온것) 날짜모음.set(d, (날짜모음.get(d) ?? 0) + 1);
    if (흠.length) 걸린것.push({ 길: f, 흠 });
  }

  console.log(`손님 눈 검사 — 화면 ${파일들.length}장 · 오늘 ${오늘}`);
  console.log(`\n② 값·이메일이 지금 것인가 · ③ 날짜가 앞날이 아닌가`);
  if (!걸린것.length) console.log('   ✅ 옛 이메일·localhost·앞날짜 없음');
  for (const x of 걸린것.slice(0, 30)) {
    const 주소 = x.길.replace(/\\/g, '/').replace('dist/wikitip', '').replace(/\.html$/, '') || '/';
    console.log(`   🔴 ${주소}\n        ${x.흠.join(' · ')}`);
  }
  const 날짜차례 = [...날짜모음].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log(`   화면에 박힌 날짜: ${날짜차례.map(([d, n]) => `${d}(${n}장)`).join(' · ') || '없음'}`);

  console.log('\n⛔ 이 자가 **못 재는 것** — 사람이 읽어야 한다');
  console.log('   ⑤ 손님이 읽고 기분 상할 문장이 있나');
  console.log('   ⑥ 이 지면은 몇 살 손님의 것인가 (0~100세)');
  console.log('   ④ 앞뒤 말이 어긋나나 — 지면마다 이름이 달라 한 자로 못 훑는다. 지면별 자가 따로 있다');

  if (걸린것.length) { console.error(`\n⛔ 흠 ${걸린것.length}장`); process.exit(1); }
  console.log('\n✅ 잰 것에는 흠이 없다 (⛔ 못 잰 것은 위에 적었다)');
}
