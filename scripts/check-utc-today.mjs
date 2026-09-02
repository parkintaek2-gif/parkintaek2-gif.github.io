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
export function 판정(글) {
  if (!UTC오늘꼴.test(글)) return '괜찮다';
  return 세는꼴.test(글) ? 'UTC로 센다' : 'UTC로 찍는다';
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

  /** ⭐ 이 검사의 뜻 — 지금 저장소에 「UTC 로 세는 자」가 하나도 없어야 한다 */
  const { 걸린것, 찍기만 } = 훑는다();
  검(`저장소에 UTC 로 «세는» 자가 없다 (지금 ${걸린것.length}개)`, 걸린것.length === 0);
  검('훑기가 실제로 파일을 읽었다 — 찍기만 하는 자는 여럿 있다', 찍기만.length > 10);

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
