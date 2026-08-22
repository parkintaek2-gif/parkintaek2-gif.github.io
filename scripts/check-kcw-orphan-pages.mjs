#!/usr/bin/env node
/**
 * check-kcw-orphan-pages.mjs — **들어오는 문이 하나도 없는 지면을 잡는다.** (npm test)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 「만들고 문을 안 냈다」를 이 자리에서 **여섯 번** 겪었다.
 *   8/07 기사 12편 중 7편이 아무 지면에도 안 걸림
 *   8/21 띠 방 열두 장이 전부 기사 0개
 *   8/22 새 지면 `/day-pillar` 로 들어오는 문이 기사 하나뿐(2장)
 *   8/22 일간 방 열 장 — 짓고 나서 손으로 문을 냈다
 * 그때마다 **사람이 알아채서** 고쳤다. 사람이 기억해서 지키는 구조는 다음에 또 새어 나간다.
 * 우리 규칙이 「규칙은 문장이 아니라 검사로 둔다」다. 그래서 센다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * 나간 것(`dist/wikitip/**.html`)에서 **서로 가리키는 링크**를 세어,
 * 들어오는 링크가 0인 지면을 찾는다. 사이트맵에만 있는 지면은 «있다»고 안 센다 —
 * 구글은 링크를 타고 오고, 사람도 링크를 타고 온다.
 *
 * ⛔ 첫 화면(`/`)은 뺀다 — 들어오는 문이 밖에서 온다.
 * ⛔ 법·안내 지면(privacy·terms·refund·contact·404 등)은 봐준다. 목록에 까닭을 적는다.
 * ⚠ 빌드가 없으면 **「못 쟀다」로 끝낸다.** 없는 것을 빨강으로 만들지 않는다.
 *
 * 쓰는 법  node scripts/check-kcw-orphan-pages.mjs
 *          node scripts/check-kcw-orphan-pages.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낸방 = path.join(뿌리, 'dist/wikitip');

/**
 * 봐주는 것 — **까닭이 있어야 들어온다.** 이 목록은 줄어들기만 한다.
 * ⛔ 새 지면을 여기 넣어 자를 통과시키지 않는다. 문을 내는 것이 맞다.
 */
export const 봐준다 = {
  '/': '첫 화면 — 들어오는 문이 밖에서 온다',
  '/404': '없는 주소로 갔을 때만 뜬다',
  '/privacy': '법 지면 — 꼬리말에서만 걸린다',
  '/terms': '법 지면',
  '/refund': '법 지면',
  '/contact': '안내 지면',
  '/subscribe': '받아보기 — 자리마다 단추로 걸린다',
};

/** 나간 파일 이름 → 주소. `index.html` 은 그 폴더의 주소다 */
export const 주소로 = (상대길) => {
  const p = '/' + 상대길.replace(/\\/g, '/').replace(/\.html$/, '');
  return p.replace(/\/index$/, '') || '/';
};

/** 한 글에서 우리 쪽 주소만 뽑는다. 앵커·물음표는 떼고 본다 */
export const 링크뽑기 = (글) => {
  const 것 = new Set();
  for (const m of 글.matchAll(/href="([^"]+)"/g)) {
    let u = m[1];
    if (/^https?:\/\/www\.kculturewire\.com/.test(u)) u = u.replace(/^https?:\/\/www\.kculturewire\.com/, '');
    if (!u.startsWith('/')) continue;                 /* 밖으로 나가는 링크는 안 센다 */
    u = u.split('#')[0].split('?')[0].replace(/\.html$/, '');
    if (u.length > 1) u = u.replace(/\/$/, '');
    if (/\.(png|jpg|svg|xml|txt|json|csv|ico|webmanifest)$/i.test(u)) continue;
    것.add(u || '/');
  }
  return 것;
};

/**
 * 지면마다 들어오는 링크 수. **자기 자신은 안 센다** — 자기를 가리키는 것은 문이 아니다.
 * @param {Map<string,string>} 글들 주소 → 글
 */
export function 들어오는수(글들) {
  const 수 = new Map([...글들.keys()].map((k) => [k, 0]));
  for (const [주소, 글] of 글들) {
    for (const u of 링크뽑기(글)) {
      if (u === 주소) continue;
      if (수.has(u)) 수.set(u, 수.get(u) + 1);
    }
  }
  return 수;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('index.html 은 폴더 주소가 된다', 주소로('index.html') === '/' && 주소로('room/index.html') === '/room');
  검('.html 을 뗀다', 주소로('day-pillar.html') === '/day-pillar');
  검('우리 쪽 절대주소도 센다', 링크뽑기('<a href="https://www.kculturewire.com/x">').has('/x'));
  검('밖으로 나가는 링크는 안 센다', 링크뽑기('<a href="https://www.wikidata.org/">').size === 0);
  검('앵커·물음표를 뗀다', 링크뽑기('<a href="/a#b?c=1">').has('/a'));
  검('그림·사이트맵은 안 센다', 링크뽑기('<a href="/og/x.png"><a href="/sitemap.xml">').size === 0);

  const 글들 = new Map([
    ['/', '<a href="/a">'],
    ['/a', '<a href="/">'],
    ['/orphan', '<a href="/a">'],
    ['/self', '<a href="/self">'],
  ]);
  const 수 = 들어오는수(글들);
  검('가리켜지는 지면을 센다', 수.get('/a') === 2);
  검('문 없는 지면은 0', 수.get('/orphan') === 0);
  검('⛔ 자기를 가리키는 것은 문이 아니다', 수.get('/self') === 0);
  검('봐준다에 첫 화면이 있다', 봐준다['/'] !== undefined);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-kcw-orphan-pages 자가시험 통과 (10)');
  process.exit(0);
}

if (!fs.existsSync(낸방)) {
  console.log('⚠ dist/wikitip 이 없다 — 빌드가 없으면 잴 것이 없다(빨강 아님)');
  process.exit(0);
}

const 글들 = new Map();
const 걷기 = (디렉, 앞 = '') => {
  for (const e of fs.readdirSync(디렉, { withFileTypes: true })) {
    const 다음 = path.join(디렉, e.name);
    const 상대 = 앞 ? `${앞}/${e.name}` : e.name;
    if (e.isDirectory()) { 걷기(다음, 상대); continue; }
    if (!e.name.endsWith('.html')) continue;
    글들.set(주소로(상대), fs.readFileSync(다음, 'utf8'));
  }
};
걷기(낸방);

const 수 = 들어오는수(글들);
const 고아 = [...수.entries()]
  .filter(([주소, n]) => n === 0 && 봐준다[주소] === undefined)
  .map(([주소]) => 주소)
  .sort();

console.log(`나간 지면 ${글들.size}장 · 봐준 것 ${Object.keys(봐준다).length}개 · 들어오는 문이 0인 지면 ${고아.length}장`);
if (고아.length) {
  console.error('❌ 만들고 문을 안 냈다 — 링크를 타고 못 닿는 지면이 있다');
  for (const p of 고아.slice(0, 20)) console.error(`   · ${p}`);
  if (고아.length > 20) console.error(`   … 그리고 ${고아.length - 20}장 더`);
  console.error('   ⛔ 봐준다에 넣어 통과시키지 않는다. 어디서 들어올지를 정하고 그 지면에 길을 낸다.');
  process.exit(1);
}
console.log('✅ 모든 지면에 들어오는 문이 있다');
