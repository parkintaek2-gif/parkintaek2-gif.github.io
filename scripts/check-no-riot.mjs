#!/usr/bin/env node
/**
 * check-no-riot.mjs — **Riot 이 되살아나지 않았나** 잰다.
 *
 * ── 🔴 왜 (2026-08-31 20:12 · 2번을 거쳐 · 2026-09-01 사장님이 범위를 바로잡으심) ──
 * > 「**Riot(e스포츠) 아예 지우세요.** 승인 대기·보류가 아니라 **완전히 없앤다**로
 * >  바뀌었습니다. **Riot API 키 재발급 요구도 더 이상 올리지 마시고**, Riot 관련
 * >  지면·콘텐트·의존 코드를 정리(제거)해 주십시오」
 *
 * 그리고 사장님이 내가 넓게 읽은 것을 바로잡아 주셨다 —
 * > 「**내가 riot을 제거하라고 했지, e스포츠를 제거하라고는 하지 않았잖아**」
 * > 「이건 해도 되잖아, 네가 알아서 할 수 있잖아, riot와 달리」
 *
 * ── ⭐ 가르는 자리 — 「우리가 «다시» 잴 수 있나」 ──────────────
 * ```
 * ⛔ Riot 사다리      열쇠가 죽었다. 다시는 못 잰다 → 걷어낸다
 * ✅ 위키백과 열람     언제든 우리가 다시 잰다      → 그대로 둔다
 * ```
 * ⛔ 이름에 「esports」가 들었는지로 가르지 않는다. **어느 우물에서 길었는지**로 가른다.
 *   `/esports-nations`·`/esports-games`·`/one-month` 은 위키백과다 — **살아 있어야 한다.**
 *
 * ── ⛔ 이 자가 잡는 것 ─────────────────────────────────────
 * ① 걷어낸 주소로 «거는» 링크 — 손님이 죽은 문을 누른다
 * ② Riot API 를 다시 부르는 코드 · 열쇠를 다시 청하는 문구
 * ③ 위키백과 e스포츠 지면이 «같이» 지워졌나 — 지시를 넓게 읽으면 여기가 빈다
 *
 * ⭐ ③ 이 이 자의 핵심이다. 나는 오늘 ①②만 보고 ③을 «과하게» 지웠다.
 *   검사는 「덜 지웠나」뿐 아니라 **「더 지웠나」도** 잡아야 한다.
 *
 * 쓰는 법
 *   node scripts/check-no-riot.mjs --자가시험
 *   node scripts/check-no-riot.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 걷어낸 주소 — Riot API 로 지었던 것만 */
export const 죽은주소 = ['/esports', '/ladder-gap', '/ladder-churn'];

/** ⭐ 살아 있어야 하는 것 — 위키백과로 잰 e스포츠. 지시를 넓게 읽으면 여기가 빈다 */
export const 살릴지면 = [
  'src/pages/wikitip/esports-games.astro',
  'src/pages/wikitip/esports-nations.astro',
  'src/pages/wikitip/one-month.astro',
];
export const 살릴기사 = [
  'content/kculturewire/it-was-one-game.md',
  'content/kculturewire/no-one-to-compare-against.md',
  'content/kculturewire/a-year-in-one-month.md',
  'content/kculturewire/vietnam-reads-a-different-korea.md',
];

/** 이 줄이 죽은 주소를 «거나». ⛔ 주석 속 언급은 링크가 아니다 */
export function 죽은문인가(줄) {
  const s = String(줄 ?? '');
  if (!s) return null;
  for (const 주소 of 죽은주소) {
    /* href="/esports" · href={`/esports`} · href: '/esports' · path: '/esports' */
    if (new RegExp(`(href=["'\`{]|(href|path):\\s*['"\`])${주소}(["'\`}/]|$)`).test(s)) return 주소;
    /**
     * 🔴 [2026-09-01] 기사 앞말(YAML)의 `pages:` 는 **꼴이 다르다** —
     *   ```
     *   pages:
     *     - "/esports"      ← href 도 path 도 아니다
     *   ```
     *   위 검사만 있을 때 `vietnam-reads-a-different-korea.md` 의 이 줄을 **놓쳤다.**
     *   빌드해서 `dist` 를 눈으로 훑다가 잡았다 — 자가 놓친 것을 사람이 주웠다.
     *   ⭐ 그래서 여기 박아 둔다. **같은 주소라도 «적히는 꼴»이 여럿이다.**
     */
    if (new RegExp(`^\\s*-\\s*["']${주소}["']\\s*$`).test(s)) return 주소;
  }
  return null;
}

/**
 * 이 줄이 Riot 열쇠를 «다시 청하고» 있나.
 * ⚠ 이것이 사장님이 그만두라 하신 바로 그 행동이다. 지면보다 이쪽이 더 중요하다 —
 *   지면은 내가 지우지만, 이런 알림은 **저절로 떠서 내가 또 올리게 만든다.**
 */
export function 열쇠청하나(줄) {
  const s = String(줄 ?? '');
  if (!s) return false;
  if (/^\s*[*/]/.test(s)) return false;         /* 주석은 «기록»이다 — 잡지 않는다 */
  return /developer\.riotgames\.com|RIOT_API_KEY|api\.riotgames\.com/.test(s);
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  검('죽은 문을 잡는다', 죽은문인가('<a href="/esports">x</a>') === '/esports');
  검('href: 꼴도 잡는다', 죽은문인가("      href: '/ladder-gap',") === '/ladder-gap');
  검('path: 꼴도 잡는다', 죽은문인가("  { path: '/ladder-churn', priority: '0.9' },") === '/ladder-churn');
  검('뒤 슬래시도 잡는다', 죽은문인가('<a href="/esports/">x</a>') === '/esports');
  검('⛔ 주석 속 언급은 안 잡는다', 죽은문인가(' *   `/esports` 지면을 걷어냈다') === null);
  /* 🔴 이 꼴을 놓쳐서 기사 하나가 죽은 문을 걸고 나갈 뻔했다 */
  검('기사 앞말 pages: 목록도 잡는다', 죽은문인가('  - "/esports"') === '/esports');
  검("작은따옴표 목록도 잡는다", 죽은문인가("  - '/ladder-gap'") === '/ladder-gap');
  검('⛔ 살아 있는 지면은 목록에서도 안 잡는다', 죽은문인가('  - "/esports-nations"') === null);
  /* 🔴 이 둘이 「e스포츠까지 지우지 않았나」를 지키는 자리다 */
  검('⛔ 살아 있어야 할 위키백과 지면을 죽은 문으로 안 센다', 죽은문인가('<a href="/esports-nations">x</a>') === null);
  검('⛔ /esports-games 도 안 센다', 죽은문인가('<a href="/esports-games">x</a>') === null);
  검('⛔ /one-month 도 안 센다', 죽은문인가('<a href="/one-month">x</a>') === null);
  검('⛔ 빈 값은 null', 죽은문인가('') === null && 죽은문인가(null) === null);

  검('열쇠 재발급 문구를 잡는다', 열쇠청하나('  console.log("developer.riotgames.com 에서 REGENERATE")') === true);
  검('열쇠 이름도 잡는다', 열쇠청하나('const k = process.env.RIOT_API_KEY;') === true);
  검('⛔ 주석에 남긴 «기록»은 안 잡는다',
    열쇠청하나(' * ⚠ 예전에 developer.riotgames.com 을 띄웠다. 그것이 잘못이었다') === false);
  검('⛔ 상관없는 줄은 안 잡는다', 열쇠청하나('const a = 1;') === false);

  검('살릴 목록이 비어 있지 않다', 살릴지면.length === 3 && 살릴기사.length === 4);

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ check-no-riot 자가시험 통과 (${센것})`);
  process.exit(0);
}

if (내가실행됐다) {
  /** 훑을 방. ⛔ `dist` 는 안 훑는다 — 결과물이 아니라 «원본»을 고쳐야 한다 */
  const 훑을방 = ['src/pages', 'src/pages/wikitip', 'src/pages/wikitip/article',
    'src/components', 'src/layouts', 'src/data', 'src/lib', 'scripts', 'content/kculturewire'];

  const 죽은문 = [];
  const 열쇠 = [];
  let 본파일 = 0;

  for (const 방 of 훑을방) {
    let 것들;
    try { 것들 = fs.readdirSync(path.join(뿌리, 방), { withFileTypes: true }); } catch { continue; }
    for (const e of 것들) {
      if (!e.isFile()) continue;
      if (!/\.(astro|ts|mjs|js|json|md|html)$/.test(e.name)) continue;
      if (e.name === 'check-no-riot.mjs') continue;         /* 자기 자신은 안 센다 */
      const p = path.join(방, e.name);
      let 글;
      try { 글 = fs.readFileSync(path.join(뿌리, p), 'utf8'); } catch { continue; }
      본파일 += 1;
      글.split('\n').forEach((줄, i) => {
        const d = 죽은문인가(줄);
        if (d) 죽은문.push(`${p}:${i + 1}  ${d}`);
        if (열쇠청하나(줄)) 열쇠.push(`${p}:${i + 1}  ${줄.trim().slice(0, 70)}`);
      });
    }
  }

  /* ③ 넓게 지우지 않았나 — 위키백과 e스포츠가 살아 있나 */
  const 사라진것 = [...살릴지면, ...살릴기사].filter((f) => !fs.existsSync(path.join(뿌리, f)));

  console.log(`■ Riot 이 되살아났나 — 본 파일 ${본파일}개`);
  if (본파일 === 0) {
    console.log('⚠ **아무것도 못 쟀다** — 훑을 방을 하나도 못 열었다. 「깨끗하다」가 아니다.');
    process.exit(1);
  }

  let 탈 = 0;
  if (죽은문.length) {
    탈 += 죽은문.length;
    console.log(`\n❌ 죽은 Riot 문 ${죽은문.length}곳 — 손님이 눌러도 아무 데도 안 간다`);
    죽은문.forEach((x) => console.log(`     ${x}`));
  } else console.log('   ✅ 죽은 Riot 문 0곳');

  if (열쇠.length) {
    탈 += 열쇠.length;
    console.log(`\n❌ Riot 열쇠를 다시 청하는 곳 ${열쇠.length}곳`);
    console.log('   ⛔ 사장님이 「키 재발급 요구도 더 이상 올리지 마시고」라 하셨다.');
    열쇠.forEach((x) => console.log(`     ${x}`));
  } else console.log('   ✅ 열쇠를 다시 청하는 곳 0곳');

  if (사라진것.length) {
    탈 += 사라진것.length;
    console.log(`\n❌ **너무 많이 지웠다** — 위키백과로 잰 e스포츠 ${사라진것.length}개가 없다`);
    console.log('   ⛔ 사장님: 「내가 riot을 제거하라고 했지, e스포츠를 제거하라고는 하지 않았잖아」');
    사라진것.forEach((x) => console.log(`     ${x}`));
  } else console.log(`   ✅ 위키백과 e스포츠 ${살릴지면.length + 살릴기사.length}개 그대로 있다`);

  if (탈) process.exit(1);
  console.log('\n✅ Riot 은 걷혔고, 위키백과 e스포츠는 살아 있다.');
}
