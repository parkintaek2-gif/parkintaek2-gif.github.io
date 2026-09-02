/**
 * **첫 화면에서 두 번 눌러 닿나.** (2번 지시 23:2x)
 *
 * ── 왜 ─────────────────────────────────────────────────────────────
 * 구글은 링크를 타고 온다. 두 번 안에 못 닿는 지면은 색인을 걸어도 잘 안 잡힌다.
 * 3번이 백년지도에서 같은 것을 재니 77.5% 였고, 이으니 100% 가 됐다.
 * 우리는 영어권에서 **검색으로 들어오는 것이 거의 유일한 길**이다.
 *
 * ── 어떻게 재나 ────────────────────────────────────────────────────
 * ⛔ 눈으로 안 센다. **빌드된 HTML 의 `<a href>` 로만** 센다.
 *    첫 화면(`/`)에서 시작해 너비우선으로 두 걸음까지 간다.
 *      0걸음 = 첫 화면 · 1걸음 = 첫 화면에 링크가 있는 곳 · 2걸음 = 그 지면들에서 닿는 곳
 * ⚠ 머리·꼬리(공통 띠)에 있는 링크도 링크다. 손님에게는 다 같은 한 번이다.
 * ⛔ 기사는 세지 않는다 — 50편이 다 두 걸음 안에 들어와 자료 지면의 구멍을 가린다.
 *    이 자가 지키려는 것은 **자료 지면**이다. 기사는 `/articles` 가 따로 맡는다.
 */
import fs from 'node:fs';

const 빌드칸 = 'dist/wikitip';

/** `<a href>` 만 뽑는다. 다른 태그의 href(link rel 따위)는 손님이 못 누른다 */
export function 링크뽑기(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"#?]+)/g)].map((m) => m[1]);
}

/** 우리 지면 주소로 고른다. 바깥·메일·앵커는 뺀다 */
export function 우리것(주소) {
  if (typeof 주소 !== 'string') return null;
  if (!주소.startsWith('/')) return null;          // 바깥·mailto·상대주소
  if (/\.(xml|png|jpg|svg|json|csv|txt|ico)$/i.test(주소)) return null;
  return 주소.replace(/\/$/, '') || '/';
}

/**
 * 주소 → 빌드 파일.
 *
 * 🔴 [2026-09-03] **이 자가 44장을 잘못 세고 있었다.** `/born-year` 허브는
 *   `public/` 에서 그대로 실려 `dist/wikitip/born-year/index.html` 이 되는데,
 *   여기서는 `born-year.html` «한 꼴만» 찾았다. → 못 읽어서 그 안의 78개 링크를
 *   하나도 안 세고, 자식 44장이 「세 걸음 밖」으로 나왔다.
 * ⛔ 첫 화면에 문을 냈는데도 수가 안 움직여서 알았다. **자가 틀렸다.**
 * ⭐ `server.mjs` 161줄이 이미 두 꼴을 다 본다 — `X.html` 과 `X/index.html`.
 *   손님이 실제로 닿는 것과 자가 재는 것이 어긋나면, 자는 없는 흠을 만들고
 *   있는 흠은 놓친다. **손님과 같은 규칙으로 찾는다.**
 */
/**
 * 빌드 파일 → 손님이 치는 주소.
 *
 * 🔴 [2026-09-03] `폴더/index.html` 을 `/폴더/index` 라고 세고 있었다. 그런 주소는
 *   아무 지면도 링크하지 않는다(손님도 그렇게 치지 않는다) — 그래서 `/video/review/index`
 *   처럼 **영원히 못 닿는 것**으로 남았다. 없는 흠이다.
 * ⭐ `server.mjs` 161줄과 같은 규칙 — `X/index.html` 의 주소는 `/X` 다.
 */
/**
 * 그 지면이 **구글에 담지 말라고 이미 말한** 지면인가.
 *
 * 🔴 [2026-09-03] 남은 17장이 전부 `noindex` 였다 — `/room/*` 12장(띠 방) ·
 *   `/title/*` 4장(내린 작품) · `/video/review`(우리끼리 소리 검토하는 내부 도구).
 * ⚠ 이 자가 지키는 것은 「두 번 안에 못 닿으면 색인이 안 잡힌다」인데,
 *   **애초에 색인에 담지 말라고 한 지면은 잃을 유입이 없다.** 그것을 빨강으로 세면
 *   맞는 상태를 흠으로 부르는 것이고, 그러면 사람이 검사를 끈다.
 * ⛔ 그렇다고 주소를 «봐줄 목록»에 손으로 적지 않는다 — 목록은 반드시 낡는다.
 *   **재서 가른다.** noindex 를 떼는 날 이 자가 저절로 다시 울린다.
 * ⛔ 못 읽으면 «아니다»로 둔다 — 못 잰 것을 면제로 바꾸지 않는다.
 *   (`check-kcw-orphan-pages.mjs` 243줄과 같은 규칙이다)
 */
export function 색인안함(글) {
  /* 머리만 본다 — 본문에 「noindex」라는 낱말이 글로 나올 수 있다 */
  return /name=["']robots["'][^>]*noindex/i.test(String(글 ?? '').slice(0, 4000));
}

export function 지면주소(앞, 파일이름) {
  const n = String(파일이름).replace(/.html$/, '');
  if (n === 'index') return 앞 || '/';
  return `${앞}/${n}`;
}

export function 파일길(주소) {
  if (주소 === '/') return `${빌드칸}/../wikitip.html`;
  const 꼴들 = [`${빌드칸}${주소}.html`, `${빌드칸}${주소}/index.html`];
  return 꼴들.find((f) => fs.existsSync(f)) ?? 꼴들[0];
}

if (process.argv[1] && process.argv[1].endsWith('check-two-clicks.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('a href 만 뽑는다',
    링크뽑기('<link href="/x.css"><a href="/titles">t</a>').join() === '/titles');
  자가('앵커·물음표를 자른다',
    링크뽑기('<a href="/data?from=yt#top">d</a>').join() === '/data');
  자가('바깥은 뺀다', 우리것('https://x.com/a') === null);
  자가('그림은 뺀다', 우리것('/og/a.png') === null);
  자가('끝 빗금을 다듬는다', 우리것('/titles/') === '/titles');
  자가('첫 화면은 /', 우리것('/') === '/');
  자가('폴더의 index 는 폴더 주소다', 지면주소('/born-year', 'index.html') === '/born-year');
  자가('보통 파일은 그대로', 지면주소('/star-sign', 'aries.html') === '/star-sign/aries');
  자가('맨 위 index 는 첫 화면', 지면주소('', 'index.html') === '/');
  자가('noindex 를 읽는다', 색인안함('<meta name="robots" content="noindex, follow">') === true);
  자가('index,follow 는 담는 지면', 색인안함('<meta name="robots" content="index,follow">') === false);
  자가('⛔ 못 읽으면 담는 지면으로 둔다 — 면제로 바꾸지 않는다', 색인안함(undefined) === false);
  자가('본문 뒤쪽의 noindex 라는 «낱말»에 안 속는다', 색인안함(`${' '.repeat(4100)}noindex`) === false);
  console.log(`두 번 안에 닿나 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(빌드칸)) {
    console.log('⬜ 빌드가 없어 **못 쟀다** — node scripts/build-once.mjs 뒤에 다시 부른다');
    process.exit(1);
  }

  /**
   * 세어야 할 자료 지면 — 기사와 404 는 뺀다.
   *
   * 🔴 2026-08-09 06:1x — **하위 폴더를 안 팠다.** 그날 `/market/<나라>` 93장을 냈는데
   *   이 자는 여전히 「자료 지면 29장」이라 답했다. 93장이 **자 눈 밖**에 있었다.
   *   ⛔ 100% 라는 초록불이 **안 센 93장**을 덮고 있었다 — 오늘 새벽 자가시험에서 겪은 것과 같다.
   *   ⭐ 그래서 판다. `article/` 만 뺀다(기사는 `check-article-reach` 가 따로 맡는다).
   */
  const 자료아님 = /^(404)$/;
  const 지면들 = [];
  const 판다 = (d, 앞) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name === 'article') continue;         // 기사는 이 자가 안 센다
        판다(`${d}/${e.name}`, `${앞}/${e.name}`);
        continue;
      }
      if (!e.name.endsWith('.html')) continue;
      const n = e.name.replace(/\.html$/, '');
      if (!앞 && 자료아님.test(n)) continue;
      지면들.push(지면주소(앞, e.name));
    }
  };
  판다(빌드칸, '');
  지면들.push('/');

  /* ── 너비우선으로 두 걸음 ── */
  const 걸음 = new Map([['/', 0]]);
  let 앞줄 = ['/'];
  for (let d = 1; d <= 2; d += 1) {
    const 다음 = [];
    for (const p of 앞줄) {
      const f = 파일길(p);
      if (!fs.existsSync(f)) continue;
      for (const raw of 링크뽑기(fs.readFileSync(f, 'utf8'))) {
        const u = 우리것(raw);
        if (!u || 걸음.has(u)) continue;
        걸음.set(u, d);
        다음.push(u);
      }
    }
    앞줄 = 다음;
  }

  /* ⛔ 「담지 말라」고 한 지면은 셈에서 빼되 **몇 장인지 낸다** — 조용히 없애지 않는다 */
  const 안담는것 = 지면들.filter((p) => {
    const f = 파일길(p);
    return fs.existsSync(f) && 색인안함(fs.readFileSync(f, 'utf8'));
  });
  const 셀지면 = 지면들.filter((p) => !안담는것.includes(p));

  const 닿음 = 셀지면.filter((p) => 걸음.has(p) && 걸음.get(p) <= 2);
  const 못닿음 = 셀지면.filter((p) => !닿음.includes(p));
  const 비율 = +((100 * 닿음.length) / 셀지면.length).toFixed(1);

  console.log(`\n자료 지면 ${셀지면.length}장 · 두 번 안에 닿는 것 ${닿음.length}장 (${비율}%)`);
  const 깊이별 = [0, 1, 2].map((d) => 셀지면.filter((p) => 걸음.get(p) === d).length);
  console.log(`  0걸음 ${깊이별[0]} · 1걸음 ${깊이별[1]} · 2걸음 ${깊이별[2]}`);
  if (안담는것.length) {
    console.log(`  ⬜ 셈에서 뺀 것 ${안담는것.length}장 — 구글에 «담지 마라»고 한 지면(noindex)`);
    console.log(`     ${안담는것.join(' · ')}`);
  }
  if (못닿음.length) {
    console.log(`\n⛔ 두 번 안에 못 닿는 지면 ${못닿음.length}장`);
    for (const p of 못닿음) console.log(`   · ${p}`);
  }

  console.log(못닿음.length ? '' : '\n✅ 자료 지면 전부 두 번 안에 닿는다');
  process.exit(못닿음.length ? 1 : 0);
}
