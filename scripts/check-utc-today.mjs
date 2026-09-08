#!/usr/bin/env node
/**
 * check-utc-today.mjs — **「오늘」을 UTC 로 정해 놓고 그것으로 세는 자를 잡는다.**
 *
 * ── 왜 만들었나 ─────────────────────────────────────────────
 * 2026-08-29 새벽, 총괄을 2번에게 넘기며 `check-daily-shipping.mjs` 를 인수인계했다.
 * 그 자리에서 그냥 불러 보니 **어제와 오늘의 수가 똑같이** 나왔다. 재 보니 둘이었다 —
 *
 * ```
 *  ① `--until` 이 없었다        「그날」이 아니라 「그날부터 지금까지」를 셌다
 *  ② `toISOString()` 을 썼다   그건 UTC 다. KST 자정~09시에는 «어제» 날짜가 나온다
 * ```
 * ⭐ 하필 이 자는 **09:00 방송**에 쓰인다 — KST 09:00 이 정확히 UTC 00:00 이다.
 *    경계에 걸리는 시각에 쓰이고 있었고, 낮에 돌려 보면 안 보이는 결함이었다.
 *
 * 🔴 사장님 강령 — 「**규칙은 문장이 아니라 검사로 둔다.** 말로 하는 규칙은 잊힌다」
 *    그래서 「앞으로 조심하자」로 끝내지 않고 이 자를 만든다.
 *
 * ── 무엇을 잡나 ─────────────────────────────────────────────
 * `new Date().toISOString()` 으로 «오늘»을 정해 놓고, 그 값으로 **세거나 걸러내는** 자.
 * ⚠ 날짜를 «찍기만» 하는 것은 안 잡는다 — 하루 차이가 나지만 셈을 틀리게 하진 않는다.
 *    (2026-08-29 실측: 저장소에 toISOString 을 쓰는 자가 64개인데, 그중 세거나
 *     걸러내는 것은 하나도 없었다. 그 하나가 이 결함의 주인이었고 고쳤다.)
 *
 * 쓰는 법
 *   node scripts/check-utc-today.mjs            훑는다 (걸리면 종료코드 1)
 *   node scripts/check-utc-today.mjs --자가시험
 */
import fs from 'node:fs';
import { 주석줄인가, 따옴표안인가, 살아있는글 } from './lib/live-code.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** UTC 로 「오늘」을 정하는 꼴인가 */
export const UTC오늘꼴 = /new Date\(\)\s*\.toISOString\(\)\s*\.slice\(0,\s*10\)/;

/** 그 값으로 «세거나 걸러내는» 낌새 — 날짜를 견주거나 git 창을 만드는 것 */
/**
 * 그 값으로 «세거나 걸러내는» 낌새 — 날짜를 견주거나 git 창을 만드는 것.
 *
 * 🔴 [2026-09-03] **이 자가 놓친 것을 내가 걸렸다.** `next-silent-video.mjs` 가
 *   `x.uploadDate !== 오늘` 로 «오늘 몫을 냈나»를 판정하는데, 옛 본에는 `===` 만 있고
 *   `!==` 가 없어서 「UTC 로 찍기만 한다」로 넘어갔다. 그래서 새벽 2시 55분에
 *   「오늘(2026-09-02) 몫 끝」이라고 답했다 — 그날은 이미 9월 3일이었고,
 *   **그 말을 믿었으면 하루치 영상을 건너뛸 뻔했다.**
 * ⚠ 견줌은 `===` 만이 아니다. `!==`·`!=`·`==`·`>`·`<` 다 셈을 가른다.
 *   ⛔ 자가 좁으면 「걸린 것 0」이 **안 잰 것**을 덮는다. 오늘 하루 종일 본 꼴이다.
 */
export const 세는꼴 = /--since|--until|(?:===|!==|==|!=|>=|<=|>|<)\s*오늘|오늘\s*(?:===|!==|==|!=|>=|<=|>|<)|날\s*[!=]==|filter\([^)]*날/;

/**
 * 한 자의 글을 보고 판정한다.
 *   'UTC로 센다'  → 고쳐야 한다
 *   'UTC로 찍는다' → 하루 차이만 난다 (지금은 안 잡는다)
 *   '괜찮다'
 */
/**
 * 🔴🔴 [2026-09-09 05:2x · 5번] **이 자가 «다른 검사기»를 잡고 있었다 — 헛경보다.**
 *
 * 오늘 `check-kst-date.mjs` 가 「한국 자정~아침 9시에 어제를 센다」로 걸렸다.
 * 열어 보니 걸린 여덟 줄이 **전부 주석과 자가시험 견본**이었다 —
 * ```
 *    26줄  *   🔴 틀리다 `new Date().toISOString().slice(0, 10)`      ← 주석
 *   109줄  어긋난자리찾기('const d = new Date().toISOString()…')      ← 시험 견본
 * ```
 * ⇒ **살아 있는 쓰임이 0이었다.** 그 자는 «그 무늬를 찾는 자»니 견본에 그 무늬가 있는 것이 맞다.
 *
 * ⭐ 이 파일에는 이미 `나빼기`(자기 자신 제외)가 있었다. 같은 갈래의 파일이 하나 더 생긴 것이다.
 *   ⛔ 그렇다고 «파일 이름 목록»으로 빼지 않는다 — 그러면 그 파일에 «진짜» 결함이 생겨도
 *     영영 안 잡힌다. 이름으로 빼는 것은 검사를 끄는 것과 같다.
 * ✅ 그래서 «줄 단위»로 가른다 — 주석이거나 따옴표 안에 든 것은 살아 있는 쓰임이 아니다.
 *   ⚠ `check-kst-date.mjs` 도 주석은 이미 걸렀지만, 줄바꿈된 자가시험 인자는 못 걸렀다
 *     (`검(` 이 앞 줄에 있어 그 줄만 보면 시험인지 알 수 없다). 따옴표 규칙이 그것을 덮는다.
 */
export function 판정(글) {
  /* ⭐ 주석·시험 견본을 걷어 낸 «살아 있는 글»만 본다 */
  const 산글 = 살아있는글(글);
  if (!UTC오늘꼴.test(산글)) return '괜찮다';
  return 세는꼴.test(산글) ? 'UTC로 센다' : 'UTC로 찍는다';
}

/**
 * ⚠ **자기 자신은 뺀다.** 이 자는 찾는 «본»을 글로 적고 있으므로 스스로에게 걸린다.
 *    ⛔ 처음 돌렸을 때 걸린 것이 딱 이 파일 하나였다 — 자가 자기를 잡았다.
 *       그것 자체가 이 자가 «실제로 돈다»는 증거였다.
 */
export const 나빼기 = 'check-utc-today.mjs';

export function 훑는다(디렉터리 = path.join(뿌리, 'scripts')) {
  const 걸린것 = []; const 찍기만 = [];
  for (const 이름 of fs.readdirSync(디렉터리)) {
    if (!이름.endsWith('.mjs') || 이름 === 나빼기) continue;
    const 길 = path.join(디렉터리, 이름);
    const 글 = fs.readFileSync(길, 'utf8');
    const ㅍ = 판정(글);
    if (ㅍ === 'UTC로 센다') 걸린것.push(이름);
    else if (ㅍ === 'UTC로 찍는다') 찍기만.push(이름);
  }
  return { 걸린것, 찍기만 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, ok) => { if (ok) 통 += 1; else 실.push(이름); };

  검('UTC 로 세는 것을 잡는다',
    판정('const 날 = new Date().toISOString().slice(0, 10);\ngit(["log", `--since=${날}`])') === 'UTC로 센다');
  검('UTC 로 찍기만 하는 것은 «따로» 본다',
    판정('const 오늘 = new Date().toISOString().slice(0, 10);\n지면.기준일 = 오늘;') === 'UTC로 찍는다');
  검('한국 시각을 쓰면 괜찮다',
    판정('const 날 = 오늘한국();\ngit(["log", `--since=${날}`])') === '괜찮다');
  검('아무 상관 없는 글은 괜찮다', 판정('console.log("안녕");') === '괜찮다');

  /* 🔴 [2026-09-09 · 5번] 헛경보를 막는 자리 — 주석과 시험 견본은 «살아 있는 쓰임»이 아니다 */
  검('⛔ 주석에 인용한 것은 안 잡는다',
    판정(' *   🔴 틀리다 `new Date().toISOString().slice(0, 10)` 로 --since 를 만든다') === '괜찮다');
  검('⛔ 겹따옴표 시험 견본은 안 잡는다',
    판정('어긋난자리찾기("const 날 = new Date().toISOString().slice(0,10); --since=x").length === 1);') === '괜찮다');
  검('⛔ 홑따옴표 시험 견본도 안 잡는다',
    판정("어긋난자리찾기('const 날 = new Date().toISOString().slice(0,10); --since=x').length === 1);") === '괜찮다');
  검('⭐ 그래도 «살아 있는» 쓰임은 잡는다 — 같은 파일 안에 섞여 있어도',
    판정(["어긋난자리찾기('new Date().toISOString().slice(0,10)');",
          'const 날 = new Date().toISOString().slice(0, 10);',
          'git([\"log\", `--since=${날}`]);'].join('\n')) === 'UTC로 센다');
  검('따옴표안인가 — 따옴표 밖은 false', 따옴표안인가('const a = 1; new Date()', 14) === false);
  검('따옴표안인가 — 홑따옴표 안은 true', 따옴표안인가("f('new Date()')", 3) === true);
  검('⛔ 따옴표안인가 — 자리가 밖이면 false', 따옴표안인가('abc', 99) === false);
  검('🔴 따옴표안인가 — 템플릿 안 ${…} 속은 «코드»다(문자열이 아니다)',
    따옴표안인가('const s = `때: ${new Date().toISOString()}`;', 20) === false);
  검('따옴표안인가 — 템플릿의 «글자» 자리는 문자열이다',
    따옴표안인가('const s = `abc def`;', 13) === true);
  검('⭐ 템플릿 안 ${…} 의 살아 있는 쓰임은 지우지 않는다',
    살아있는글('const t = `${new Date().toISOString()}`;').includes('new Date()'));
  검('주석줄인가 — 별표 줄', 주석줄인가(' * 무엇') === true);
  검('주석줄인가 — 코드 줄은 아니다', 주석줄인가('const a = 1;') === false);

  /* ⭐ 오늘 실제로 헛경보가 났던 그 파일로 재 본다 — 이름으로 빼지 않고 «내용으로» 통과해야 한다 */
  {
    const 그자 = fs.readFileSync(path.join(뿌리, 'scripts', 'check-kst-date.mjs'), 'utf8');
    검('🔴 check-kst-date.mjs 는 살아 있는 UTC 쓰임이 없다 — 이름으로 빼지 않고 통과한다',
      판정(그자) === '괜찮다');
  }

  /** ⭐ 이 검사의 뜻 — 지금 저장소에 「UTC 로 세는 자」가 하나도 없어야 한다 */
  const { 걸린것, 찍기만 } = 훑는다();
  검(`저장소에 UTC 로 «세는» 자가 없다 (지금 ${걸린것.length}개)`, 걸린것.length === 0);
  /**
   * 🔴 [2026-09-09 05:4x · 5번] 이 단정이 `찍기만.length > 10` 이었다.
   *
   * 이것은 «목표»가 아니라 **「훑기가 파일을 실제로 읽었나」 카나리아**다 —
   * 훑는 자가 빈 목록을 돌려주면 위의 「세는 자가 없다」가 «저절로» 통과해 버린다.
   * 그것을 막으려고 「여럿 있다」를 수로 못박아 둔 것이다.
   *
   * ⛔ 그런데 «딱 붙은 수»라 오늘 헛으로 깨졌다 —
   *   `check-kst-date.mjs` 를 「살아 있는 UTC 쓰임이 없다」로 바르게 옮기자 11 → 10 이 됐다.
   *   찍기만 하는 자가 «줄어드는 것»은 좋은 일인데 그때마다 이 단정이 깨진다.
   *
   * ⭐ 그래서 카나리아의 «뜻»만 남기고 바닥을 낮춘다. ⛔ 이것은 검사를 무르게 하는 것이 아니다 —
   *   위의 「세는 자가 «0» 이어야 한다」가 진짜 관문이고, 그 수는 낮추지 않았다.
   *   여기는 「목록이 비어 있지 않다」만 지키면 된다.
   */
  검(`훑기가 실제로 파일을 읽었다 — 찍기만 하는 자가 여럿 있다 (지금 ${찍기만.length}개)`,
    찍기만.length >= 5);

  /** ⛔ 이 결함을 낳은 자가 지금은 고쳐져 있는지 못박는다 */
  const 그자 = fs.readFileSync(path.join(뿌리, 'scripts/check-daily-shipping.mjs'), 'utf8');
  검('⭐ check-daily-shipping 이 한국 시각을 쓴다', /오늘한국\(\)/.test(그자));
  검('⭐ check-daily-shipping 이 --until 로 «그날»을 자른다', /--until=\$\{날\}/.test(그자));

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ UTC 오늘 결함을 잡는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const { 걸린것, 찍기만 } = 훑는다();
  console.log('■ 「오늘」을 UTC 로 정해 놓고 세는 자를 훑었습니다\n');
  if (걸린것.length === 0) {
    console.log('  ✅ 없습니다.\n');
  } else {
    console.log(`  🔴 ${걸린것.length}개 — 한국 자정~아침 9시에 «어제»를 셉니다`);
    걸린것.forEach((n) => console.log(`     · scripts/${n}`));
    console.log('\n  고치는 법 — `오늘한국()` 을 쓰십시오 (scripts/check-daily-shipping.mjs 에 있습니다)');
  }
  console.log(`  ⚠ 날짜를 «찍기만» 하는 자 ${찍기만.length}개는 안 잡았습니다 —`);
  console.log('     하루 차이가 나지만 셈을 틀리게 하지는 않습니다. 급하지 않습니다.');
  process.exit(걸린것.length ? 1 : 0);
}
