#!/usr/bin/env node
/**
 * check-inbound-links.mjs — **각 지면으로 «사이트 안에서» 들어오는 링크가 몇 개인가.**
 *
 * 🔴🔴 [2026-10-04 04:0x] 왜 만들었나 — **내 가설이 틀린 것을 수가 보여 줬다.**
 *
 *   KCW 가 색인이 안 되는 까닭을 「지면끼리 겹쳐서」라고 보고 겹침을 쟀다. 그런데 —
 *   ```
 *   /group/pristin-v   겹침 86%   ✅ 색인됐다
 *   /born-on/12-07     겹침 79%   🔴 색인 안 됐다
 *   ```
 *   **겹침이 더 심한 쪽이 색인됐다.** 겹침은 색인을 가르는 축이 아니다.
 *
 *   klifemap 에서 이미 본 것이 있다 — 거기서는 «들어오는 링크»가 축이었다
 *   (글 2,870장으로 가는 문이 0개라 74%가 「구글이 한 번도 안 왔다」였다).
 *   ⇒ 그 축을 KCW 에도 대 본다. 눈대중 말고 **전수로 센다.**
 *
 * ⛔ 「링크가 적어서 색인이 안 된다」를 미리 믿지 않는다. 이 자는 링크 수만 센다.
 *   색인 상태와 맞춰 보는 것은 쓰는 사람이 한다 — 자가 결론을 내지 않는다.
 *   (04:20 에 KCW 에서도 쟀다 — /about 은 3,016개가 들어오는데 색인이 «안» 됐고
 *    /group/pristin-v 는 3개뿐인데 됐다. **링크 수도 축이 아니었다.**)
 *
 * 🔴🔴 [2026-10-04 04:20] **이 자가 못 보는 지면이 있다 — 반드시 읽을 것.**
 *
 *   이 자는 «dist/ 안의 파일»만 읽는다. 그런데 서버가 **그려서 내보내는** 지면은
 *   파일로 존재하지 않는다. klifemap 의 `/content` 가 그렇다(server.js 523줄).
 *   ```
 *   이 자가 본 것    글 목록 지면의 글 링크 «0개»
 *   라이브 실측      첫 쪽에 글 20개 + 쪽 링크 «57쪽 전부» → 모든 글에 두세 홉으로 닿는다
 *                   ko 1,139 · en 620 · ja 600 · zh 600 = 2,959장, 사이트맵 수와 맞는다
 *   ```
 *   ⇒ 위 14~15줄의 「klifemap 은 문이 0개였다」는 **틀린 말이다.** 자가 못 본 것을
 *     「없다」로 읽었고, 그대로 사장님께 보고까지 올렸다.
 *
 *   ⛔ 이 자가 「문 0개」라고 하면 **라이브 주소를 직접 눌러 보고 나서** 말한다.
 *     메모리 「자를-먼저-의심한다-0이-나오면」 — 같은 밤에 두 번 밟았다
 *     (한 번은 사이트 접두사로 8,181장, 한 번은 이것).
 *
 * 쓰는 법
 *   node scripts/check-inbound-links.mjs                 # dist 전체를 훑는다
 *   node scripts/check-inbound-links.mjs --갈래          # 갈래별로 묶어 낸다
 *   node scripts/check-inbound-links.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 글에서 «우리 사이트 안으로» 가는 길을 모두 꺼낸다 */
export function 안쪽길들(html) {
  const 것 = [];
  for (const m of String(html ?? '').matchAll(/href="([^"]+)"/g)) {
    const u = m[1];
    if (!u.startsWith('/')) continue;               /* 바깥·앵커·메일은 안 센다 */
    if (u.startsWith('//')) continue;
    const 길 = u.split(/[?#]/)[0];
    if (!길 || 길 === '/') { 것.push('/'); continue; }
    것.push(길.replace(/\/$/, ''));
  }
  return 것;
}

/** 지면 주소를 갈래로 — `/born-on/12-07` → `/born-on` */
export function 갈래(길) {
  const s = String(길 ?? '');
  const 쪽 = s.split('/').filter(Boolean);
  return 쪽.length ? '/' + 쪽[0] : '/';
}

/**
 * 🔴🔴 [2026-10-04 04:2x] **처음 돌렸을 때 「문이 0개인 지면 8,181장」이 나왔다.**
 *   `/100y` 5,139장과 `/wikitip` 3,018장이 «통째로» 0 이었다. 극단값이라 자를 의심했고,
 *   맞았다 — **서버가 호스트마다 붙이는 접두사 때문**이었다.
 *
 *   한 서버가 세 사이트를 낸다. 파일은 `dist/wikitip/born-on/12-07.html` 에 있지만
 *   그 지면 «안»의 링크는 `/born-year/1995` 처럼 **접두사 없이** 적힌다
 *   (손님은 `www.kculturewire.com/born-year/1995` 로 열고, 서버가 `/wikitip` 을 붙인다).
 *   ⇒ 내 자가 `/wikitip/born-year/1995` 를 찾으니 하나도 안 맞았다.
 *
 * ⭐ 그래서 **접두사를 벗겨서** 센다. 사이트마다 따로 세는 것이 옳다 —
 *   한 사이트 지면이 다른 사이트 지면으로 가는 길은 «안쪽 링크»가 아니다.
 */
export const 사이트접두사 = ['/wikitip', '/100y', '/japan', '/taiwan', '/uae'];

export function 접두사떼기(길) {
  const s = String(길 ?? '');
  for (const p of 사이트접두사) {
    if (s === p) return { 접두사: p, 길: '/' };
    if (s.startsWith(p + '/')) return { 접두사: p, 길: s.slice(p.length) };
  }
  return { 접두사: '', 길: s };
}

/** 파일 길을 손님이 여는 주소로 — ⛔ index.html 을 주소에 남기지 않는다 */
export function 손님길(파일, 밑) {
  const 상대 = path.relative(밑, 파일).split(path.sep).join('/');
  const 길 = '/' + 상대.replace(/index\.html$/, '').replace(/\.html$/, '');
  return 길 === '/' ? '/' : 길.replace(/\/$/, '');
}

/**
 * 들어오는 링크를 센다. ⛔ 자기가 자기를 가리키는 것은 안 센다.
 * ⭐ 사이트마다 «따로» 센다 — 접두사가 다르면 다른 사이트다(위 주석 참조).
 */
export function 들어오는수(지면들) {
  const 셈 = new Map();
  const 자리 = new Map();                          /* 접두사+속길 → 본래 길 */
  for (const { 길 } of 지면들) {
    셈.set(길, 0);
    const { 접두사, 길: 속 } = 접두사떼기(길);
    자리.set(접두사 + '\u0000' + 속, 길);
  }
  for (const { 길, 나가는길 } of 지면들) {
    const 내접두사 = 접두사떼기(길).접두사;
    for (const 간곳 of new Set(나가는길)) {        /* 한 지면에서 여러 번 걸어도 하나로 */
      /* 지면 «안»의 링크는 접두사가 없다 — 내 접두사를 붙여 같은 사이트에서 찾는다 */
      const 본래 = 자리.get(내접두사 + '\u0000' + 간곳) ?? (셈.has(간곳) ? 간곳 : null);
      if (!본래 || 본래 === 길) continue;
      셈.set(본래, 셈.get(본래) + 1);
    }
  }
  return 셈;
}

const 내가진입점 = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (내가진입점 && process.argv.includes('--자가시험')) {
  let 탈 = 0;
  const 본다 = (이름, 참) => { console.log((참 ? '✅ ' : '🔴 ') + 이름); if (!참) 탈 += 1; };

  본다('안쪽 길만 센다',
    안쪽길들('<a href="/a">x</a><a href="https://z.com/b">y</a><a href="#c">z</a>').join(',') === '/a');
  본다('물음표·우물정을 자른다', 안쪽길들('<a href="/a?x=1#y">v</a>')[0] === '/a');
  본다('끝 빗금을 떼어 같은 것으로 본다', 안쪽길들('<a href="/a/">v</a>')[0] === '/a');
  본다('첫 화면은 / 그대로 둔다', 안쪽길들('<a href="/">v</a>')[0] === '/');
  본다('⛔ 바깥으로 보이는 //evil 을 안 센다', 안쪽길들('<a href="//evil.com">v</a>').length === 0);
  본다('⛔ 빈 것·null 에도 안 터진다', 안쪽길들(null).length === 0);

  본다('갈래를 뽑는다', 갈래('/born-on/12-07') === '/born-on' && 갈래('/') === '/');

  본다('손님길 — index.html 을 안 남긴다', 손님길('/d/a/index.html', '/d') === '/a');
  본다('손님길 — .html 을 뗀다', 손님길('/d/a.html', '/d') === '/a');
  본다('손님길 — 뿌리는 /', 손님길('/d/index.html', '/d') === '/');

  const 지면들 = [
    { 길: '/', 나가는길: ['/a', '/a', '/b'] },      /* 같은 곳 두 번 → 하나로 */
    { 길: '/a', 나가는길: ['/a', '/b'] },           /* 자기 자신 → 안 센다 */
    { 길: '/b', 나가는길: [] },
    { 길: '/c', 나가는길: ['/없는곳'] },
  ];
  const 셈 = 들어오는수(지면들);
  본다('🔴 같은 지면에서 여러 번 걸어도 하나로 센다', 셈.get('/a') === 1);
  본다('두 곳에서 오면 둘이다', 셈.get('/b') === 2);
  본다('⛔ 자기가 자기를 가리키는 것은 안 센다', 셈.get('/a') === 1);
  본다('⛔ 아무도 안 가리키면 0 이다 — «못 쟀다»가 아니다', 셈.get('/c') === 0);
  본다('⛔ 없는 곳으로 가는 길은 아무것도 안 올린다', !셈.has('/없는곳'));

  /* 🔴 [2026-10-04] 접두사를 몰라 「문이 0개인 지면 8,181장」이라는 거짓 수를 냈다 */
  본다('접두사를 뗀다', 접두사떼기('/wikitip/born-on/12-07').길 === '/born-on/12-07');
  본다('접두사 자체는 뿌리가 된다', 접두사떼기('/wikitip').길 === '/');
  본다('⛔ 접두사가 아닌 것은 안 뗀다', 접두사떼기('/article/x').길 === '/article/x');
  본다('⛔ 비슷한 이름에 속지 않는다', 접두사떼기('/100years-later').길 === '/100years-later');
  {
    const 들 = [
      { 길: '/wikitip/a', 나가는길: ['/b'] },        /* 접두사 없이 적힌 안쪽 링크 */
      { 길: '/wikitip/b', 나가는길: [] },
      { 길: '/100y/b', 나가는길: [] },               /* 다른 사이트의 같은 이름 */
    ];
    const s = 들어오는수(들);
    본다('🔴 접두사 없이 적힌 안쪽 링크를 찾아낸다', s.get('/wikitip/b') === 1);
    본다('⛔ 다른 사이트의 같은 이름을 안 센다', s.get('/100y/b') === 0);
  }

  console.log(탈 ? `\n🔴 ${탈}개 떨어졌다` : '\n✅ 자가시험 통과');
  process.exit(탈 ? 1 : 0);
}

if (내가진입점) {
  const 밑 = path.join(뿌리, 'dist');
  if (!fs.existsSync(밑)) { console.error('🔴 dist 가 없다 — 먼저 빌드한다'); process.exit(1); }

  const 지면들 = [];
  const 훑기 = (방) => {
    for (const e of fs.readdirSync(방, { withFileTypes: true })) {
      const p = path.join(방, e.name);
      if (e.isDirectory()) { 훑기(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      지면들.push({ 길: 손님길(p, 밑), 나가는길: 안쪽길들(fs.readFileSync(p, 'utf8')) });
    }
  };
  훑기(밑);

  const 셈 = 들어오는수(지면들);
  console.log(`■ 지면 ${지면들.length}장을 훑었다\n`);

  if (process.argv.includes('--갈래')) {
    const 묶음 = new Map();
    for (const [길, n] of 셈) {
      const k = 갈래(길);
      if (!묶음.has(k)) 묶음.set(k, []);
      묶음.get(k).push(n);
    }
    const 줄 = [...묶음.entries()].map(([k, 들]) => {
      const 정렬 = [...들].sort((a, b) => a - b);
      return {
        갈래: k, 장수: 들.length,
        가운데: 정렬[Math.floor(정렬.length / 2)],
        없는것: 들.filter((n) => n === 0).length,
      };
    }).sort((a, b) => b.장수 - a.장수);
    console.log('  갈래'.padEnd(22) + '장수'.padStart(6) + '들어오는 링크(가운데)'.padStart(22) + '  문이 0개인 장');
    for (const r of 줄.slice(0, 20)) {
      const 빛 = r.가운데 === 0 ? '🔴' : (r.가운데 < 2 ? '⚠' : '✅');
      console.log(`  ${빛} ${r.갈래.padEnd(19)}${String(r.장수).padStart(6)}`
        + `${String(r.가운데).padStart(20)}  ${r.없는것}장`);
    }
    const 문없는것 = [...셈.values()].filter((n) => n === 0).length;
    console.log(`\n■ 들어오는 문이 «하나도 없는» 지면 ${문없는것}장 / ${셈.size}장`);
    console.log('⚠ 이 자는 링크 수만 센다. 색인 상태와 맞춰 보는 것은 사람이 한다.');
    process.exit(0);
  }

  const 줄 = [...셈.entries()].sort((a, b) => a[1] - b[1]);
  console.log('  들어오는 링크가 적은 지면 20장');
  for (const [길, n] of 줄.slice(0, 20)) console.log(`  ${String(n).padStart(4)}개  ${길}`);
  console.log('\n  많은 지면 5장');
  for (const [길, n] of 줄.slice(-5).reverse()) console.log(`  ${String(n).padStart(4)}개  ${길}`);
}
