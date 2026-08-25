/**
 * check-name-placement.mjs — **그 이름이 제목·본문 위·가운데·끝에 다 있나.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-25 오후, 사장님 지시 —
 * ```
 *   「인기 검색어도 찾아야지. 특히 케이컬쳐는 스타의 이름, 작품명, 노래제목 등이겠지..
 *    그게 «제목, 본문 중 위, 가운데, 마지막»에 나와야 하겠지」
 *   「이런 키워드를 찾는 사람이 검색 색인돼 있는 우리 콘텐트를 많이 보겠지」
 * ```
 * ⭐ 두 가지를 말씀하신 것이다 —
 *   ① 우리 인기 검색어는 «고유명사»다(작품명·사람 이름·노래 제목)
 *   ② 그 이름이 «네 자리»에 있어야 한다 — 제목 하나가 아니다
 *
 * 나는 그때까지 «제목»만 고치고 있었다. 그래서 네 자리를 다 재는 자를 만든다.
 *
 * ── ⛔ 이 자가 «말하지 않는» 것 ────────────────────────────────
 * ⛔ 「네 자리에 다 있으면 위로 간다」고 말하지 않는다. 그런 것을 우리는 못 쟀다 —
 *   이 자는 **「사장님이 말씀하신 자리에 있나」**까지만 말한다.
 * ⛔ 없다고 «끼워 넣으라»는 뜻이 아니다. 그 지면이 실제로 그 작품을 다룰 때만이다.
 *   ⚠ 억지로 넣으면 사람이 읽기 나빠지고, 그건 우리가 하려는 일이 아니다.
 * ⛔ 머리말·꼬리말은 본문이 아니다. 거기 이름이 있어도 «본문에 있다»고 세지 않는다.
 *
 * 쓰는 법  node scripts/check-name-placement.mjs --자가시험
 *          node scripts/check-name-placement.mjs
 *          node scripts/check-name-placement.mjs --지면=dist/100y --몇개=30
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};

/** 견주기 전에 같은 꼴로 — 대소문자·문장부호·엔티티가 달라서 어긋나지 않게 */
export function 고르기(s) {
  return String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * 지어진 html 에서 **본문만** 뽑는다.
 * ⛔ 머리말(nav)·꼬리말(footer)·script·style 을 걷어낸다 — 거기 이름이 있어도
 *   그것은 «본문에 있다»가 아니다. 안 걷어내면 모든 지면이 다 통과해 버린다.
 */
export function 본문(html) {
  let s = String(html ?? '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  const m = s.match(/<main[\s\S]*?<\/main>/i) ?? s.match(/<article[\s\S]*?<\/article>/i);
  if (m) s = m[0];
  return 고르기(s.replace(/<[^>]*>/g, ' '));
}

export function 제목(html) {
  const m = String(html ?? '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? 고르기(m[1]) : null;
}

/**
 * 본문을 셋으로 갈라 «어디에» 있는지 본다.
 * ⚠ 글자 수로 셋을 나눈다. 문단 수로 나누면 지면마다 문단 길이가 달라 견줄 수 없다.
 */
export function 자리들(본문글, 이름) {
  const n = 고르기(이름);
  if (!n || !본문글) return { 위: false, 가운데: false, 끝: false, 몇번: 0 };
  const L = 본문글.length;
  const 셋 = [본문글.slice(0, Math.floor(L / 3)),
    본문글.slice(Math.floor(L / 3), Math.floor((2 * L) / 3)),
    본문글.slice(Math.floor((2 * L) / 3))];
  let 몇번 = 0;
  let i = 본문글.indexOf(n);
  while (i !== -1) { 몇번 += 1; i = 본문글.indexOf(n, i + 1); }
  return { 위: 셋[0].includes(n), 가운데: 셋[1].includes(n), 끝: 셋[2].includes(n), 몇번 };
}

/** 네 자리 중 몇 자리에 있나 — 제목까지 넣어 센다 */
export function 점수(제목글, 본문글, 이름) {
  const n = 고르기(이름);
  const 제 = !!제목글 && 제목글.includes(n);
  const a = 자리들(본문글, 이름);
  return { 제목: 제, ...a, 자리수: [제, a.위, a.가운데, a.끝].filter(Boolean).length };
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('고르기 — 대소문자를 지운다', 고르기('Squid Game') === 'squid game');
  T('고르기 — 아포스트로피를 지운다', 고르기("actors’ day") === 'actors day');
  T('고르기 — 숫자 엔티티를 푼다', !/39/.test(고르기('actors&#39; day')));
  T('고르기 — 쉼표·콜론을 빈칸으로', 고르기('Bon Appétit, Your Majesty').includes('bon app'));
  T('고르기 — 빈 값에 안 터진다', 고르기(undefined) === '');

  T('제목 — 태그 안 글자', 제목('<title>Squid Game: Netflix</title>') === 'squid game netflix');
  T('제목 — 없으면 null(빈 글자가 아니다)', 제목('<html></html>') === null);

  /* 🔴 머리말·꼬리말을 안 걷어내면 «모든 지면이 통과»한다 — 거기에 사이트 이름과
     링크가 다 들어 있기 때문이다. 그러면 이 자가 아무것도 못 말한다 */
  const h = '<html><head><title>T</title></head><body>'
    + '<nav>squid game nav link</nav><footer>squid game footer</footer>'
    + '<main>alpha beta gamma</main></body></html>';
  T('본문 — 머리말을 걷어낸다', !본문(h).includes('nav link'));
  T('본문 — 꼬리말을 걷어낸다', !본문(h).includes('footer'));
  T('본문 — main 안만 본다', 본문(h) === 'alpha beta gamma');
  T('본문 — main 이 없으면 몸통을 본다', 본문('<body>hello world</body>').includes('hello'));
  T('본문 — 빈 값에 안 터진다', 본문(undefined) === '');

  const 글 = `${'가 '.repeat(0)}squid game ${'x '.repeat(60)}squid game ${'y '.repeat(60)}squid game`;
  const a = 자리들(고르기(글), 'Squid Game');
  T('자리들 — 위에 있다', a.위);
  T('자리들 — 가운데에 있다', a.가운데);
  T('자리들 — 끝에 있다', a.끝);
  T('자리들 — 몇 번 나오는지 센다', a.몇번 === 3);
  const b = 자리들(고르기(`squid game ${'x '.repeat(200)}`), 'Squid Game');
  T('자리들 — 위에만 있으면 가운데·끝은 거짓', b.위 && !b.가운데 && !b.끝);
  T('자리들 — 이름이 없으면 다 거짓', !자리들('hello', 'Squid Game').위);
  T('자리들 — 빈 값에 안 터진다', 자리들('', '').몇번 === 0);

  const s = 점수('squid game netflix', 고르기(글), 'Squid Game');
  T('점수 — 제목까지 넣어 넷을 센다', s.자리수 === 4);
  T('점수 — 제목에 없으면 셋', 점수('other', 고르기(글), 'Squid Game').자리수 === 3);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ check-name-placement 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ check-name-placement 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
/*
 * ⛔ **다른 파일이 import 해도 아래가 «안 돌아야» 한다.** 처음엔 이 자물쇠가 없어서,
 *   함수만 가져다 쓰려고 import 했더니 보고문이 통째로 같이 찍혔다.
 *   다른 유닛이 `본문`·`점수` 만 빌려 쓸 수 있어야 이 자가 값을 한다.
 */
const 내가불렸나 = path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);

if (!내가불렸나) {
  /* import 된 것이다 — 아무것도 안 한다 */
} else if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  const 지면방 = path.resolve(뿌리, 인자('지면', 'dist/wikitip'));
  const 자료 = path.resolve(뿌리, 인자('자료', 'src/data/wikitip-title-pages.json'));
  const 몇개 = Number(인자('몇개', '25'));
  if (!existsSync(지면방)) {
    console.error(`⛔ ${지면방} 이 없다 — «못 쟀다». 먼저 npm run build`);
    process.exit(1);
  }
  if (!existsSync(자료)) { console.error(`⛔ 자료가 없다 — ${자료}`); process.exit(1); }

  const d = JSON.parse(readFileSync(자료, 'utf8'));
  const 볼것 = (d.titles ?? []).filter((t) => t.hasPage)
    .sort((a, b) => (b.places ?? 0) - (a.places ?? 0)).slice(0, 몇개);

  console.log('■ 사장님 지시 — 「그 이름이 제목, 본문 중 위·가운데·마지막에 나와야」');
  console.log(`  석이 큰 작품 ${볼것.length}편을 잰다\n`);
  console.log('자리  제목  위  가운데  끝   몇번   작품');
  let 넷 = 0; let 셋 = 0; let 못잼 = 0;
  const 모자란것 = [];
  for (const t of 볼것) {
    const f = path.join(지면방, 'title', `${t.slug}.html`);
    if (!existsSync(f)) { 못잼 += 1; console.log(`  ⬜ 못 쟀다 — 지면이 없다: ${t.slug}`); continue; }
    const html = readFileSync(f, 'utf8');
    const s = 점수(제목(html), 본문(html), t.title);
    const 표 = (b) => (b ? ' ✅ ' : ' ⛔ ');
    console.log(` ${s.자리수}/4 ${표(s.제목)}${표(s.위)}${표(s.가운데)}${표(s.끝)}`
      + ` ${String(s.몇번).padStart(4)}   ${t.title}`);
    if (s.자리수 === 4) 넷 += 1; else if (s.자리수 === 3) 셋 += 1;
    if (s.자리수 < 4) 모자란것.push({ 작품: t.title, 빠진곳: [!s.제목 && '제목', !s.위 && '위', !s.가운데 && '가운데', !s.끝 && '끝'].filter(Boolean) });
  }
  console.log(`\n네 자리 다 있는 것 ${넷} · 셋 ${셋} · 그 아래 ${볼것.length - 넷 - 셋 - 못잼}`
    + (못잼 ? ` · ⬜ 못 잰 것 ${못잼}` : ''));
  if (모자란것.length) {
    console.log('\n빠진 자리 —');
    const 통 = new Map();
    for (const m of 모자란것) for (const p of m.빠진곳) 통.set(p, (통.get(p) ?? 0) + 1);
    for (const [p, n] of [...통].sort((a, b) => b[1] - a[1])) console.log(`  ${p.padEnd(6)} ${n}편에서 빠져 있다`);
  }
  console.log('\n⛔ 「네 자리에 다 있으면 위로 간다」고 말하지 않는다 — 그것은 우리가 못 쟀다.');
  console.log('   이 자는 「사장님이 말씀하신 자리에 있나」까지만 말한다.');
  console.log('⛔ 없다고 «끼워 넣지» 않는다. 그 지면이 실제로 그 작품을 다룰 때만이다.');
}
