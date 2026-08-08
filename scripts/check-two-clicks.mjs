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

/** 주소 → 빌드 파일. 형식이 `file` 이라 `/titles` 는 `titles.html` 이다 */
export function 파일길(주소) {
  if (주소 === '/') return `${빌드칸}/../wikitip.html`;
  return `${빌드칸}${주소}.html`;
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
      지면들.push(`${앞}/${n}`);
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

  const 닿음 = 지면들.filter((p) => 걸음.has(p) && 걸음.get(p) <= 2);
  const 못닿음 = 지면들.filter((p) => !닿음.includes(p));
  const 비율 = +((100 * 닿음.length) / 지면들.length).toFixed(1);

  console.log(`\n자료 지면 ${지면들.length}장 · 두 번 안에 닿는 것 ${닿음.length}장 (${비율}%)`);
  const 깊이별 = [0, 1, 2].map((d) => 지면들.filter((p) => 걸음.get(p) === d).length);
  console.log(`  0걸음 ${깊이별[0]} · 1걸음 ${깊이별[1]} · 2걸음 ${깊이별[2]}`);
  if (못닿음.length) {
    console.log(`\n⛔ 두 번 안에 못 닿는 지면 ${못닿음.length}장`);
    for (const p of 못닿음) console.log(`   · ${p}`);
  }

  console.log(못닿음.length ? '' : '\n✅ 자료 지면 전부 두 번 안에 닿는다');
  process.exit(못닿음.length ? 1 : 0);
}
