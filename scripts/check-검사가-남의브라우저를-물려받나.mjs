/* 검사가 «사장님 크롬에 저장된 상태»를 물려받으면, 같은 명령인데 날마다 다른 답을 낸다.
 * 그런 자는 자가 아니다. (5번 2026-10-11)
 *
 * 🔴 겪은 것 — 왜 이 검사가 생겼나
 *   구글이 색인을 안 넣는 까닭을 찾느라 지면 열한 장을 9222 크롬에 붙어 그려 봤다.
 *   **열한 장이 전부 중국어로 나왔다.** 지면이 깨진 줄 알고 고칠 뻔했는데,
 *   빈 컨텍스트로 다시 재니 열한 장 다 한국어였다 — 사장님 크롬의 `localStorage.bj_lang` 이
 *   `zh` 로 서 있었고 그 값이 새 탭에 따라온 것이다.
 *   ⭐ 고칠 것은 지면이 아니라 «재는 자»였다. 오늘 이 덫에 일곱 번째로 걸렸다.
 *
 * ⚠ 한 가지를 분명히 한다 — 흠은 「크롬에 붙는 것」이 아니다.
 *   제 브라우저를 띄우는(launch) 자는 애초에 남의 상태가 없다. 흠이 아니다.
 *   «9222 에 붙으면서(connect) 말·글을 재는» 자만 흠이다.
 *
 * 돌리기   node scripts/check-검사가-남의브라우저를-물려받나.mjs
 * 자가시험 node scripts/check-검사가-남의브라우저를-물려받나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 저장된 상태를 담는 칸들 — 이 값이 바뀌면 화면이 바뀐다 */
export const 상태를담는칸 = ['bj_lang', 'lang', 'i18nLang'];

/** 9222 에 붙는 자인가 */
export function 남의크롬에붙나(글) {
  return /puppeteer\s*\.\s*connect\s*\(/.test(String(글 ?? ''));
}

/** 손님 화면을 재는 자인가 — 저장된 상태가 답을 바꾸는 자리다
 *
 * 🔴 [2026-10-11 · 5번] **처음에는 「말을 재는 자」로만 좁혔다가 되돌려 재서 틀린 것을 알았다.**
 *   `check-만세력-공유가되나` 는 말이 아니라 «공유»를 잰다. 그래서 안 걸렸다.
 *   그런데 그 자도 똑같이 중국어 화면에서 돌고 있었다 — 때마침 판정이 구조(기둥 네 개)여서
 *   답이 안 바뀌었을 뿐이다. 「이번엔 안 바뀌었다」는 「안 바뀐다」가 아니다.
 *   ⭐ 그러니 자는 «말을 재나»가 아니라 **«손님 화면을 재나»**여야 한다. */
export function 손님화면을재나(글) {
  const s = String(글 ?? '');
  /* 지면을 열어서(goto) 그 안을 들여다보는(evaluate/$/$$) 자 */
  return /\.goto\s*\(/.test(s)
    && /\.evaluate\s*\(|\.\$eval\s*\(|\.\$\$eval\s*\(|\.\$\s*\(|\.\$\$\s*\(|waitForSelector/.test(s);
}

/** 옛 이름 — 부르던 자리가 있어 남겨 둔다 */
export const 말을재나 = 손님화면을재나;

/** 저장된 상태를 떼어 내고 재나 */
export function 상태를떼나(글) {
  const s = String(글 ?? '');
  if (/createBrowserContext|createIncognito/.test(s)) return true;      /* 빈 자리를 만든다 */
  if (/_빈브라우저/.test(s)) return true;                                /* 공용 자리를 쓴다 */
  /* 손수 지우는 것도 떼는 것이다 — 다만 goto «앞»이어야 하니 evaluateOnNewDocument 여야 한다 */
  const 손수 = 상태를담는칸.some((k) => new RegExp('removeItem\\([\'"]' + k + '[\'"]\\)').test(s));
  return 손수 && /evaluateOnNewDocument/.test(s);
}

/** 면제 — 로그인된 자리가 «일부러» 필요한 자가 있다(예: 커뮤니티에 글을 올리려면 로그인이 돼 있어야 한다).
 *  ⛔ 다만 말없이 빠지지는 못한다. 파일에 이 표와 «까닭»을 적어야 한다 —
 *     `남의브라우저가-일부러-필요하다: <까닭>`
 *  ⭐ 「면제에 적어 두고 안 재면 그것은 끈 것이다」 — 그래서 면제도 세어서 화면에 낸다. */
export function 면제까닭(글) {
  const m = /남의브라우저가-일부러-필요하다\s*:\s*(.+)/.exec(String(글 ?? ''));
  if (!m) return null;
  const 까닭 = m[1].replace(/\*\/\s*$/, '').trim();
  return 까닭 || null;        /* 까닭을 안 적었으면 면제가 아니다 */
}

/** 한 자를 재서 흠이면 까닭을, 아니면 null 을 돌려준다 */
export function 흠인가(이름, 글) {
  if (!남의크롬에붙나(글)) return null;          /* 제 브라우저를 띄우는 자 — 흠이 아니다 */
  if (!손님화면을재나(글)) return null;           /* 화면을 안 들여다보는 자 — 저장된 상태가 답을 안 바꾼다 */
  if (상태를떼나(글)) return null;
  if (면제까닭(글)) return null;                 /* 까닭을 적고 면제받은 자 — 화면에는 따로 센다 */
  return 이름 + ' — 9222 에 붙어 «손님 화면»을 재면서 저장된 상태를 안 뗀다';
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
async function 자가시험() {
  const { test } = await import('node:test');
  const A = await import('node:assert/strict');
  const 붙는다 = "const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });";
  const 띄운다 = 'const b = await puppeteer.launch({ headless: true });';
  /* 실제 자의 모양 그대로 — 지면을 «열고»(goto) «들여다본다»(evaluate) */
  const 말잰다 = 'await p.goto(밑); const 글 = await p.evaluate(() => document.body.innerText);';

  test('🔴 붙어서 말을 재는데 안 떼면 잡는다', () => {
    A.default.ok(흠인가('나쁜자', 붙는다 + 말잰다 + 'await b.newPage();'));
  });
  test('제 브라우저를 띄우는 자는 흠이 아니다', () => {
    A.default.equal(흠인가('띄우는자', 띄운다 + 말잰다 + 'await b.newPage();'), null);
  });
  test('붙더라도 화면을 안 들여다보면 흠이 아니다', () => {
    A.default.equal(흠인가('그림만찍는자', 붙는다 + 'await b.newPage(); await p.screenshot({ path: x });'), null);
  });
  test('🔴 말이 아니라 «구조»를 재는 자도 잡는다 — 2026-10-11 에 놓쳤던 자리', () => {
    /* check-만세력-공유가되나 가 꼭 이 모양이었다. 한글을 한 글자도 안 세지만
       중국어 화면에서 돌고 있었다. 「이번엔 답이 안 바뀌었다」는 봐줄 까닭이 아니다 */
    const 구조만잰다 = 붙는다
      + "await p.goto(밑 + '/mansecalendar.html');"
      + 'const n = await p.evaluate(() => document.querySelectorAll(".pillar-col").length);';
    A.default.ok(흠인가('구조재는자', 구조만잰다), '구조를 재는 자를 놓쳤다');
  });
  test('waitForSelector 로만 들여다봐도 잡는다', () => {
    A.default.ok(흠인가('기다리는자', 붙는다 + 'await p.goto(x); await p.waitForSelector(".k");'));
  });
  test('빈 컨텍스트를 만들면 흠이 아니다', () => {
    A.default.equal(흠인가('격리하는자', 붙는다 + 말잰다 + 'const c = await b.createBrowserContext();'), null);
  });
  test('공용 자리(_빈브라우저)를 쓰면 흠이 아니다', () => {
    A.default.equal(흠인가('공용쓰는자', 붙는다 + 말잰다 + "await import('./_빈브라우저.mjs');"), null);
  });
  test('🔴 goto «뒤»에 지우는 척만 하면 안 봐준다', () => {
    const 늦게지움 = 붙는다 + 말잰다 + "await p.goto(x); await p.evaluate(() => localStorage.removeItem('bj_lang'));";
    A.default.ok(흠인가('늦게지우는자', 늦게지움), '늦게 지우는 것을 봐줬다');
  });
  test('goto 앞에 지우면 봐준다', () => {
    const 먼저지움 = 붙는다 + 말잰다 + "await p.evaluateOnNewDocument(() => localStorage.removeItem('bj_lang'));";
    A.default.equal(흠인가('먼저지우는자', 먼저지움), null);
  });
  test('상태를담는칸에 bj_lang 이 들어 있다', () => {
    A.default.ok(상태를담는칸.includes('bj_lang'));
  });
  test('까닭을 적고 면제받으면 흠이 아니다', () => {
    const 면제 = 붙는다 + 말잰다 + '/* 남의브라우저가-일부러-필요하다: 로그인된 계정이 있어야 잴 수 있다 */';
    A.default.equal(흠인가('면제자', 면제), null);
    A.default.equal(면제까닭(면제), '로그인된 계정이 있어야 잴 수 있다');
  });
  test('🔴 까닭 없이 표만 붙이면 면제가 아니다', () => {
    const 빈면제 = 붙는다 + 말잰다 + '/* 남의브라우저가-일부러-필요하다: */';
    A.default.equal(면제까닭(빈면제), null);
    A.default.ok(흠인가('빈면제자', 빈면제), '까닭 없는 면제를 봐줬다');
  });
}

const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  await 자가시험();
} else if (내가실행됐다) {
  const 볼곳 = ['scripts', 'tools'];
  const 잴것 = [];
  for (const d of 볼곳) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (!/^check-.*\.(mjs|js)$/.test(f)) continue;
      잴것.push(path.join(d, f));
    }
  }

  const 흠들 = [];
  const 면제들 = [];
  for (const 길 of 잴것) {
    let 글 = '';
    try { 글 = fs.readFileSync(길, 'utf8'); } catch { continue; }
    if (남의크롬에붙나(글) && 손님화면을재나(글) && !상태를떼나(글)) {
      const 까닭 = 면제까닭(글);
      if (까닭) { 면제들.push(길 + ' — ' + 까닭); continue; }
    }
    const 흠 = 흠인가(길, 글);
    if (흠) 흠들.push(흠);
  }

  console.log('■ 검사가 «남의 브라우저 상태»를 물려받나');
  console.log('   본 검사 ' + 잴것.length + '개 · 흠 ' + 흠들.length + '개 · 면제 ' + 면제들.length + '개');
  console.log('   (9222 에 붙어 지면을 열고 들여다보는데 저장된 bj_lang 을 안 떼는 자만 흠이다)');
  console.log('');
  for (const 흠 of 흠들) console.log('   🔴 ' + 흠);
  /* ⭐ 면제를 숨기지 않는다 — 적어 두고 안 세면 그것은 끈 것이다 */
  for (const 면 of 면제들) console.log('   ⬜ 면제 — ' + 면);
  if (!흠들.length) console.log('   ✅ 재는 자가 저장된 말 고름에 끌려가지 않는다');
  process.exit(흠들.length ? 1 : 0);
}
