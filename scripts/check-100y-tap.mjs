/**
 * 짚는 자리 검사 — **375px 에서 링크·단추가 44px 이 되나.**
 *
 * ## 🔴 왜 (2026-08-09 05:2x)
 *
 *   레이아웃 주석에 「탭 영역 최소 44×44px (스토리보드 §11)」이라 적혀 있고
 *   `.nav` 에 `min-height: 44px` 도 걸려 있었다. **그런데 칸은 23px 이었다.**
 *
 *   ```
 *   메뉴 통      124px  ✅ 44 넘음
 *   메뉴 칸 하나  23px  ⛔ 통을 재고 칸을 안 쟀다
 *   ```
 *
 *   칸이 하나이던 시절엔 통 높이가 곧 칸 높이였다. 칸이 열로 늘어 **네 줄로 접히면서**
 *   둘이 갈라졌는데, 규칙은 그대로 통에 걸려 있었다.
 *   ⛔ 「규칙을 적어 뒀다」와 「그 규칙이 지켜진다」는 다른 말이다. **자로 재야 안다.**
 *
 *   그날 첫 실측 — 첫 화면 30개 중 **30개**가 44px 미만이었다.
 *
 * ## ⚠ 문장 속 링크는 빼고 센다
 *
 *   「국책연구원이 썼고 … <a>연구 90편</a>을 골라 두었습니다」 같은 자리다.
 *   44px 로 키우면 줄 사이가 들쭉날쭉해져 **읽기가 나빠진다.**
 *   WCAG 2.2 도 문장 안에 든 링크는 크기 규칙에서 빼 준다(inline 예외).
 *   ⛔ 섞어 세면 고칠 수 없는 것이 늘 남아 수가 0 이 안 되고, 그러면 아무도 안 본다.
 *   ⚠ 다만 **숨기지 않는다.** 따로 세어 같이 찍는다.
 *
 * ## 🔴 이 자가 오늘 나를 속일 뻔했다
 *
 *   빌드가 죽어 `dist` 가 비었는데 지면 14장을 **전부 「0개 · 통과」**로 냈다.
 *   없는 지면을 재고 초록을 낸 것이다. 그래서 둘을 넣었다 —
 *   ① 답이 200 이 아니면 「못 쟀다」 ② 링크가 한 개도 없으면 「못 쟀다」
 *   (메뉴 열 칸과 꼬리말은 **어느 지면에나** 있다).
 *
 * ⛔ `file://` 로 열지 않는다 — `/style.css` 가 `C:/style.css` 가 되어 옷이 통째로 안 붙는다.
 *   그 상태로 재면 전부 21px 로 나오고 **그럴듯하게 틀린다**(8/8 16:4x 에 당했다).
 *
 * ⚠ 이 자는 `npm test` 가 직접 부르지 않는다 — **크롬과 빌드**가 있어야 돈다.
 *   `npm run check:100y:tap` 으로 따로 부른다. (`check:100y:phone` 과 같은 사정이다)
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const 뿌리 = path.resolve(process.cwd(), 'dist');
const 빌드 = path.join(뿌리, '100y');
const 폰너비 = 375;
const 최소 = 44;

/* ───────────────────────── 자가시험 ─────────────────────────
   ⚠ 브라우저가 없어도 도는 부분만 시험한다 — 「문장 속인가」를 가르는 자다.
      이 판단이 틀리면 고칠 것을 안 세거나, 못 고칠 것을 세게 된다.        */

/** 브라우저 안에서 도는 것과 **같은 함수**여야 한다. 두 벌을 두지 않는다 */
export function 문장속인가(부모글, 링크글들) {
  let 남은 = String(부모글 ?? '');
  for (const g of 링크글들) 남은 = 남은.replace(g, '');
  return 남은.replace(/[\s·⋅•|,、/→←—–\-]/g, '').length > 0;
}

function 자가시험() {
  const 것들 = [
    ['링크만 「·」로 늘어놓은 줄은 문장이 아니다', () =>
      문장속인가('이용약관 · 개인정보처리방침 · 환불규정', ['이용약관', '개인정보처리방침', '환불규정']) === false],
    ['화살표만 붙은 링크 한 줄도 문장이 아니다', () =>
      문장속인가('학과 925개 전부 보기 →', ['학과 925개 전부 보기 →']) === false],
    ['글이 붙어 있으면 문장 속이다', () =>
      문장속인가('국책연구 90편을 골라 두었습니다.', ['국책연구 90편']) === true],
    ['앞에 글이 있어도 문장 속이다', () =>
      문장속인가('지금 학교 찾기에 이 길의 학교가 있습니다', ['학교 찾기']) === true],
    ['목록 한 칸(링크 하나)은 문장이 아니다', () =>
      문장속인가('조리과', ['조리과']) === false],
    ['빈 부모는 문장이 아니다', () => 문장속인가('', []) === false],
    ['이음표가 여럿 섞여도 문장이 아니다', () =>
      문장속인가('첫 화면 · 학과 찾기 — 학교 찾기', ['첫 화면', '학과 찾기', '학교 찾기']) === false],
    ['숫자만 남아도 문장 속으로 센다', () =>
      문장속인가('학과 925개', ['학과']) === true],
  ];
  let 실패 = 0;
  for (const [이름, 함수] of 것들) {
    let 됨 = false;
    try { 됨 =함수(); } catch { 됨 = false; }
    if (!됨) { console.log(`  ⛔ 자가시험 실패 — ${이름}`); 실패 += 1; }
  }
  console.log(`자가시험 ${것들.length}개 · 실패 ${실패}개`);
  return 실패 > 0;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
const 시험실패 = 자가시험();

/* ───────────────────────── 어느 지면을 잴까 ─────────────────────────
   ⚠ 목록을 손으로 다 적지 않는다. **갈래마다 한 장씩** 빌드에서 골라 온다 —
      손으로 적으면 새 갈래가 생겼을 때 조용히 안 재게 된다.                */
if (!fs.existsSync(빌드)) {
  console.log('⬜ 빌드가 없다 — **재지 못했다.** `node scripts/build-once.mjs` 먼저');
  process.exit(2);
}

/** 그 방에서 첫 번째 `.html` 하나 */
const 한장 = (방) => {
  const p = path.join(빌드, 방);
  if (!fs.existsSync(p)) return null;
  const f = fs.readdirSync(p).filter((x) => x.endsWith('.html')).sort()[0];
  return f ? `/${방}/${f}` : null;
};

const 볼것 = [
  '/', // 🔴 첫 화면은 `dist/100y/` 안이 아니라 `dist/100y.html` 이다
  ...['price', 'about', 'terms', 'refund', 'privacy', 'major', 'school', 'university',
      'college-major', 'region', 'age', 'data', 'research', 'after', 'work', 'how-long', 'size']
    .map((x) => `/${x}.html`)
    .filter((x) => fs.existsSync(path.join(빌드, x.slice(1)))),
  ...['school', 'major', 'college-major', 'university', 'age', 'life', 'report/area']
    .map(한장)
    .filter(Boolean),
];

/* ───────────────────────── 진짜 브라우저로 잰다 ───────────────────────── */
const 크롬 = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const 퍼핏 = 'C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
if (!fs.existsSync(크롬) || !fs.existsSync(퍼핏)) {
  console.log('⬜ 크롬이나 puppeteer-core 가 없다 — **재지 못했다**');
  process.exit(2);
}

const 서버 = http.createServer((q, s) => {
  const 길 = decodeURIComponent(q.url.split('?')[0]);
  let p = 길 === '/' ? path.join(뿌리, '100y.html') : path.join(빌드, 길);
  if (!fs.existsSync(p) && fs.existsSync(p + '.html')) p += '.html';
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); }
  const 꼴 = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml',
  }[path.extname(p)];
  s.writeHead(200, { 'content-type': 꼴 ?? 'application/octet-stream' });
  fs.createReadStream(p).pipe(s);
});
await new Promise((r) => 서버.listen(0, '127.0.0.1', r));
const 밑 = `http://127.0.0.1:${서버.address().port}`;

const puppeteer = (await import(pathToFileURL(퍼핏).href)).default;
const 브라우저 = await puppeteer.launch({ executablePath: 크롬, headless: 'new', args: ['--no-sandbox'] });

const 못잰것 = [];
const 운것 = [];
let 잰지면 = 0;
let 문장속작음 = 0;

try {
  for (const 길 of 볼것) {
    const 창 = await 브라우저.newPage();
    try {
      await 창.setViewport({ width: 폰너비, height: 760, deviceScaleFactor: 1, isMobile: true });
      const 답 = await 창.goto(밑 + 길, { waitUntil: 'load', timeout: 30000 });
      if (답 && 답.status() !== 200) throw new Error(`${답.status()} — 지면이 없다`);
      const 옷 = await 창.evaluate(() => getComputedStyle(document.body).backgroundColor);
      if (옷 === 'rgba(0, 0, 0, 0)' || 옷 === 'transparent') throw new Error('CSS 가 안 붙었다');

      const 잼 = await 창.evaluate((최소) => {
        const 자리 = (a) => (a.closest('nav') ? '메뉴' : a.closest('footer') ? '꼬리말' : '본문');
        const 문장속 = (a) => {
          const 부모 = a.parentElement;
          if (!부모) return false;
          let 남은 = 부모.textContent;
          for (const b of 부모.querySelectorAll('a')) 남은 = 남은.replace(b.textContent, '');
          return 남은.replace(/[\s·⋅•|,、/→←—–\-]/g, '').length > 0;
        };
        const 링크 = [...document.querySelectorAll('a[href]')].map((a) => ({
          자리: 자리(a),
          문장속: 문장속(a),
          글: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 26),
          높이: Math.round(a.getBoundingClientRect().height),
        }));
        const 재는것 = 링크.filter((x) => !x.문장속);
        return {
          전부: 링크.length,
          잰것: 재는것.length,
          문장속작음: 링크.filter((x) => x.문장속 && x.높이 < 최소).length,
          모자란것: 재는것.filter((x) => x.높이 < 최소),
        };
      }, 최소);

      /* ⚠ 메뉴 열 칸·꼬리말은 어느 지면에나 있다. 하나도 없으면 잘못 잰 것이다 */
      if (잼.전부 === 0) throw new Error('링크가 한 개도 없다 — 통과가 아니라 못 잰 것이다');

      잰지면 += 1;
      문장속작음 += 잼.문장속작음;
      for (const x of 잼.모자란것) 운것.push(`${길} — ${x.자리} ${x.높이}px 「${x.글}」`);
    } catch (e) {
      못잰것.push(`${길} — ${e.message.slice(0, 60)}`);
    } finally {
      await 창.close();
    }
  }
} finally {
  await 브라우저.close();
  await new Promise((r) => 서버.close(r)); // ⛔ 열어 둔 것은 반드시 닫는다
}

/* 🔴 못 잰 것을 먼저 말한다. 조용히 넘기면 0장을 훑고 「0건」이라 하는 병이 된다 */
if (못잰것.length) {
  console.log(`⬜ 못 읽은 지면 ${못잰것.length}장`);
  for (const x of 못잰것) console.log(`   ${x}`);
}
if (잰지면 === 0) {
  console.log('⬜ 한 장도 못 쟀다 — **재지 못했다**');
  process.exit(2);
}

console.log(
  `${폰너비}px 로 잰 지면 ${잰지면}장 · 짚는 자리 ${최소}px 미만 **${운것.length}개**` +
    ` (문장 속에서 작은 것 ${문장속작음}개는 규칙 밖이라 빼고 셌다)`,
);
for (const x of 운것.slice(0, 30)) console.log(`  ⛔ ${x}`);
if (운것.length > 30) console.log(`  … 그리고 ${운것.length - 30}개 더`);
if (운것.length === 0) console.log(`✅ ${최소}px 이 안 되는 짚는 자리 0개`);
console.log('⚠ 이 자는 「짚을 수 있나」만 잰다. 누르고 싶은가는 사람이 본다');

process.exit(시험실패 || 운것.length > 0 || 못잰것.length > 0 ? 1 : 0);
