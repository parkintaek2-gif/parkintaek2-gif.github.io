/**
 * **검색이 우리를 다 볼 수 있나** — 지면 · 기사 · 그림 셋을 한 자로 잰다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님(2026-08-08 09:2x): 「사진이 등록돼 있는지 확인하고 안 되었으면 직접 등록하라.
 *                          **텍스트뿐 아니라 모든 콘텐츠 다. 사이트 페이지도**」
 *
 * ⛔ 실측에서 세 군데가 어긋나 있었다 —
 *    ① `/data` 를 만들어 놓고 **사이트맵에 안 넣었다.** 검색엔 열려 있는데 사이트맵엔 없었다
 *    ② 지면 22장 중 **넷에 구조화 데이터가 없었다**(404 는 정상)
 *    ③ 카드 37장을 만들어 놓고 **사이트맵이 그걸 몰랐다**(image 태그 0개)
 *
 * ⚠ 「사이트맵이 있나」로는 못 잡는다. 있었고, 안에 빠져 있었다.
 *   그래서 **빌드된 것과 사이트맵을 맞대 본다.** 한쪽에만 있으면 선다.
 */
import fs from 'node:fs';
import path from 'node:path';

const D = 'dist/wikitip';
const 첫화면 = 'dist/wikitip.html';   // 빌드 꼴이 `file` 이라 첫 화면은 한 층 위다
const ORIGIN = 'https://www.kculturewire.com';
/** 색인시키지 않는 지면. 사이트맵에 없는 것이 **맞다** */
const 안넣는것 = new Set(['404.html']);

/** 사이트맵에서 <loc> 를 뽑아 방문자 주소로 돌린다 */
export function 주소들(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(ORIGIN, ''));
}
/** url 덩어리마다 그 안의 <image:loc> 를 짝지어 낸다 */
export function 그림짝(xml) {
  const 짝 = new Map();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (!loc) continue;
    const 그림 = [...m[1].matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((x) => x[1]);
    짝.set(loc.replace(ORIGIN, ''), 그림);
  }
  return 짝;
}

if (process.argv[1] && process.argv[1].endsWith('check-search-readiness.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  const 본보기 = `<url><loc>${ORIGIN}/a</loc></url><url><loc>${ORIGIN}/b</loc>`
    + '<image:image><image:loc>https://x/1.png</image:loc></image:image></url>';
  자가('주소를 뽑는다', 주소들(본보기).join(',') === '/a,/b');
  자가('그림 없는 주소는 빈 배열', 그림짝(본보기).get('/a').length === 0);
  자가('그림을 그 주소에 붙인다', 그림짝(본보기).get('/b')[0] === 'https://x/1.png');
  자가('그림이 남의 주소로 새지 않는다', 그림짝(본보기).get('/a').length === 0 && 그림짝(본보기).size === 2);
  console.log(`검색 채비 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  if (!fs.existsSync(D)) { console.error(`⛔ ${D} 가 없다 — node scripts/build-once.mjs 를 먼저 돌린다`); process.exit(1); }
  const 문제 = [];
  const sm = path.join(D, 'sitemap.xml');
  if (!fs.existsSync(sm)) { console.error('⛔ sitemap.xml 이 없다'); process.exit(1); }
  const xml = fs.readFileSync(sm, 'utf8');
  const 실린주소 = 주소들(xml);
  const 짝 = 그림짝(xml);

  /* ── ① 빌드된 지면이 전부 사이트맵에 있나 ──
   * 🔴 2026-08-09 07:2x — **하위 폴더를 안 팠다.** 그날 `/market/<나라>` 93장을 냈는데
   *   사이트맵에 `/market/` 이 **0개**였고 이 자는 **통과**했다.
   *   ⛔ 검색 유입이 우리 유일한 마케팅인데, 새 지면 93장이 검색엔진에 안 알려진 채였다.
   *   ⭐ 판다. `article/` 만 따로 센다(그림 짝을 거기서만 보기 때문이다).
   */
  const 지면 = [];
  const 판다 = (d, 앞) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name === 'article') continue;
        판다(path.join(d, e.name), `${앞}${e.name}/`);
        continue;
      }
      if (!e.name.endsWith('.html')) continue;
      if (!앞 && 안넣는것.has(e.name)) continue;
      지면.push(`${앞}${e.name}`);
    }
  };
  판다(D, '');
  const 기사 = fs.existsSync(`${D}/article`) ? fs.readdirSync(`${D}/article`).filter((f) => f.endsWith('.html')) : [];
  const 있어야 = [...지면.map((f) => `/${f.replace('.html', '')}`), ...기사.map((f) => `/article/${f.replace('.html', '')}`)];
  if (fs.existsSync(첫화면)) 있어야.push('/');
  const 빠진 = 있어야.filter((p) => !실린주소.includes(p));
  if (빠진.length) 문제.push(`🔴 빌드됐는데 사이트맵에 없는 것 ${빠진.length}장: ${빠진.slice(0, 5).join(' · ')}`);

  /* ── ② 사이트맵에 있는데 빌드에 없나 (죽은 주소를 검색엔진에 내미는 꼴) ── */
  const 헛것 = 실린주소.filter((p) => !있어야.includes(p));
  if (헛것.length) 문제.push(`🔴 사이트맵에 있는데 빌드에 없는 것 ${헛것.length}장: ${헛것.slice(0, 5).join(' · ')}`);

  /* ── ③ 구조화 데이터 — 404 말고는 다 있어야 한다 ── */
  {
    const 없는 = [];
    for (const [묶음, 목록, 앞] of [['지면', 지면, D], ['기사', 기사, `${D}/article`]]) {
      for (const f of 목록) {
        if (!/application\/ld\+json/.test(fs.readFileSync(path.join(앞, f), 'utf8'))) {
          없는.push(묶음 === '기사' ? `article/${f}` : f);
        }
      }
    }
    if (fs.existsSync(첫화면) && !/application\/ld\+json/.test(fs.readFileSync(첫화면, 'utf8'))) 없는.push('/');
    if (없는.length) 문제.push(`🔴 구조화 데이터가 없는 것 ${없는.length}장: ${없는.slice(0, 5).join(' · ')}`);
  }

  /* ── ④ 기사마다 그림이 사이트맵에 실렸나 ── */
  {
    const 그림없는 = 기사.map((f) => `/article/${f.replace('.html', '')}`).filter((p) => !(짝.get(p) || []).length);
    if (그림없는.length) {
      문제.push(`🔴 사이트맵에 그림이 없는 기사 ${그림없는.length}편: ${그림없는.slice(0, 3).join(' · ')}`);
    }
    /* 실린 그림이 **실제로 나갔나**. 없는 파일을 검색엔진에 내밀면 우리 신뢰가 깎인다 */
    const 죽은그림 = [];
    const 그림들 = [];
    for (const [p, gs] of 짝) {
      for (const g of gs) {
        그림들.push(g);
        const 안쪽 = g.replace(ORIGIN, '');
        if (안쪽.startsWith('/') && !fs.existsSync(path.join(D, 안쪽.slice(1)))) 죽은그림.push(`${p} → ${안쪽}`);
      }
    }
    if (죽은그림.length) 문제.push(`🔴 사이트맵이 없는 그림을 가리킨다 ${죽은그림.length}건: ${죽은그림.slice(0, 3).join(' · ')}`);
    /* 서로 다른 그림인가 — 한 장을 돌려 쓰면 실은 것이 아니다 */
    if (그림들.length && new Set(그림들).size < 그림들.length) {
      문제.push(`🔴 사이트맵의 그림 ${그림들.length}개가 ${new Set(그림들).size}가지뿐이다 — 같은 그림을 나눠 쓴다`);
    }
    /**
     * ⚠ 자료 지면에 그림이 붙었나.
     *
     * 🔴 2026-08-14 — 처음엔 「자료 지면이면 무조건 안 된다」로 잡았다. 그런데 그 규칙의
     *   **원래 뜻은 「없는 그림을 있다고 하지 마라」**다. 기본 카드를 스물몇 장에 똑같이
     *   달던 것을 막으려던 자였다.
     * ⭐ 그날 카드뉴스를 지면에 **실제로 걸었다.** 그림이 그 지면 HTML 안에 있는데도
     *   이 자가 섰다 — 자가 뜻보다 넓었다. 그래서 **HTML 안에 정말 있는지**로 좁힌다.
     * ⛔ 그래도 「HTML 에 없는데 사이트맵에만 있는 그림」은 그대로 잡는다. 그게 거짓 신호다.
     */
    const 거짓말하는지면 = [];
    for (const f of 지면) {
      const p = `/${f.replace('.html', '')}`;
      const gs = 짝.get(p) || [];
      if (!gs.length) continue;
      const html = fs.readFileSync(path.join(D, f), 'utf8');
      const 없는것 = gs.filter((g) => !html.includes(g.replace(ORIGIN, '')));
      if (없는것.length) 거짓말하는지면.push(`${p}(${없는것.length}장)`);
    }
    if (거짓말하는지면.length) {
      문제.push(`⚠ 자료 지면이 **지면에 없는 그림**을 사이트맵에 실었다 ${거짓말하는지면.length}장: `
        + `${거짓말하는지면.slice(0, 3).join(' · ')}`);
    }
    console.log(`사이트맵 ${실린주소.length}줄 · 그림 ${그림들.length}개(${new Set(그림들).size}가지) · 기사 ${기사.length}편 · 지면 ${지면.length}장`);
  }

  /* ── ⑤ 그림 이름공간을 선언했나. 안 하면 태그가 통째로 무시된다 ── */
  if (!/xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/.test(xml)) {
    문제.push('🔴 사이트맵에 image 이름공간 선언이 없다 — 태그를 넣어도 통째로 무시된다');
  }

  /* ── ⑥ robots.txt 가 사이트맵을 가리키나 ── */
  {
    const rp = path.join(D, 'robots.txt');
    if (!fs.existsSync(rp)) 문제.push('🔴 robots.txt 가 없다');
    else if (!fs.readFileSync(rp, 'utf8').includes(`${ORIGIN}/sitemap.xml`)) {
      문제.push('🔴 robots.txt 가 사이트맵 주소를 안 가리킨다 — 크롤러가 스스로 못 찾는다');
    }
  }

  if (문제.length) {
    console.log(`\n⛔ 검색 채비 — ${문제.length}건`);
    for (const s of 문제) console.log(`   · ${s}`);
    process.exit(1);
  }
  console.log('✅ 빠진 지면·죽은 주소·빠진 그림·빠진 구조화 데이터 0건');
}
