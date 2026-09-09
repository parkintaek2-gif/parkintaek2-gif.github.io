#!/usr/bin/env node
/**
 * make-sitemap-tree.mjs — **네 사이트의 지도를 나무 그림으로 낸다.**
 *
 *   node scripts/make-sitemap-tree.mjs              라이브 사이트맵을 받아 그린다
 *   node scripts/make-sitemap-tree.mjs --자가시험     자가시험만
 *   node scripts/make-sitemap-tree-png.mjs          같은 것을 PNG 로도
 *
 * ── 왜 만드나 (2026-09-09 사장님 지시) ────────────────────────────────────
 *
 * 「**모든 유닛 사이트맵을 이미지 파일로 만들어서 사이트맵 폴더를 만들어 넣어놔줘.
 *   tree 모양으로 해서 한 눈에 알아보게...유료, 무료는 컬러를 다르게 해서 구분되게 하고**」
 *
 * ⛔ 한 번 그리고 버리는 그림이 아니다. 지면이 늘면 다시 돌려서 갱신한다.
 *
 * ── 색 ───────────────────────────────────────────────────────────────────
 * ```
 * ○ 무료    초록   손님이 값을 안 내고 보는 지면
 * ● 유료    빨강   값을 내는 자리 자체 (pricing · checkout)
 * ◐ 섞임    주황   한 갈래 안에 무료와 «잠긴 것»이 같이 있는 것
 * □ 못 쟀다  회색   재 보지 않았다. ⛔ 「무료」로 칠하지 않는다
 * ```
 * ⚠ 색«만»으로 가르지 않는다 — 이름 앞에 표시(○●◐□)를 같이 붙인다.
 *   색을 못 보는 손님과 인쇄 때문이다.
 *
 * ── 렌더해서 «눈으로 보고» 고친 것 (같은 날) ──────────────────────────────
 * 1. 처음엔 「지면이 40장 넘으면 아이를 펼친다」였다 → /article 아래에 기사 슬러그
 *    넷이 붙어 잡음이 됐다. 반대로 사장님이 보고 싶어 하시는 유료 갈래(/data)는
 *    아이가 낱장이어서 «안» 펼쳐졌다. ⇒ 규칙을 「유료는 반드시 · 그 밖은 묶음일 때만」로.
 * 2. kculturewire 는 갈래가 152가지라 그림이 5,456px 이 됐다. 「한 눈에」가 깨진다.
 *    ⇒ 긴 꼬리를 한 줄로 접었다. ⛔ 없애지 않고 «몇 갈래·몇 장»인지 적는다.
 * 3. 유료 판정을 «손으로 적었다가» klifemap 의 saju.html 문턱을 빠뜨렸다. 그림 아래에
 *    「코드에서 읽었다」고 적어 놓고 실제로는 짐작이었다. ⇒ 파일을 훑어 재게 고쳤다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 낼방 = 'docs/사이트맵';
const UA = 'seoulmarkets.com sitemap-tree (contact: parkintaek2@gmail.com)';

export const 색 = {
  무료: { 칠: '#1a7f4b', 연: '#e8f5ee', 표: '○', 이름: 'Free' },
  유료: { 칠: '#b3261e', 연: '#fdeceb', 표: '●', 이름: 'Paid' },
  섞임: { 칠: '#a05a00', 연: '#fdf1e3', 표: '◐', 이름: 'Mixed' },
  못쟀다: { 칠: '#5f6368', 연: '#eef0f2', 표: '□', 이름: 'Not measured' },
};

/**
 * 문턱 무늬 — 실측해서 고른 것이다.
 * ⛔ 넓게 잡으면 「구독」을 «설명»만 하는 무료 지면(about·privacy)이 빨강으로 칠해져
 *   그림이 거짓이 된다. 좁은 무늬만 쓴다.
 */
export const 문턱무늬 = {
  /**
   * 「사는 길이 있나」 — 우리 상수 이름 하나로 좁혔다.
   * ⛔ 낱말로 찾으면 안 된다. 2026-09-09 에 재서 알았다 —
   *   for-industry.astro   「There is **no** checkout on this page.」 ← 없다고 «말하는» 문장
   *   rank-shape.astro     「close enough to a coin **toss**」        ← 동전 던지기
   *   college-major/[slug] 주석의 「`git checkout --` 로 잘못 지웠다」
   *   ⇒ 넓게 잡았으면 무료 지면 셋이 빨강으로 칠해졌다. 838장짜리 갈래 하나가 거기 있었다.
   * ⚠ 값을 «적기만» 하는 지면(refund·terms·index)도 걸리면 안 된다 — 약관에 값을 쓴 것이지
   *   파는 것이 아니다. 그래서 값글자·지역한벌값 을 뺐다.
   */
  판매: /사기전안내/,
  /** klifemap 의 문턱 기계 — 클래스·플랜 이름이라 글 속에 우연히 안 나온다 */
  잠김: /잠금판|lockedContent|premium_(monthly|yearly)/,
  /** klifemap 의 결제 링크 — «물음표가 붙은» 실제 링크만 (설명글에 나오는 이름과 가른다) */
  결제로: /checkout\.html\?/,
};

/* ── 사이트맵 모으기 ────────────────────────────────────────────────── */
export function 로크뽑기(글) {
  return [...String(글 ?? '').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

export async function 사이트맵모으기(호스트, 받기) {
  let 것 = 로크뽑기(await 받기(`https://${호스트}/sitemap.xml`));
  const 색인 = 것.filter((u) => /sitemap[^/]*\.xml$/i.test(u));
  if (색인.length) {
    것 = [];
    for (const s of 색인) 것.push(...로크뽑기(await 받기(s)));
  }
  return [...new Set(것.filter((u) => !/\.xml$/i.test(u)))];
}

/* ── 유료 판정을 «코드에서 재서» 만든다 ─────────────────────────────── */
export function 파일모으기(방, 무늬 = /\.(astro|html)$/, 폴더읽기 = fs.readdirSync) {
  const 것 = [];
  const 걷기 = (d) => {
    let 목록;
    try { 목록 = 폴더읽기(d, { withFileTypes: true }); } catch { return; }
    for (const e of 목록) {
      const q = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') 걷기(q); continue; }
      if (무늬.test(e.name)) 것.push(q);
    }
  };
  걷기(방);
  return 것;
}

/**
 * 파일 길에서 그림의 «가지 이름»을 뽑는다.
 * ⚠ 100y·wikitip 은 «호스트 접두»라 한 칸 더 들어간다 — server.mjs 가 손님 호스트를
 *   보고 그 접두를 갈아 끼운다. 그래서 손님이 부르는 경로는 접두가 없다.
 */
export function 가지이름(상대길, 클라이프맵 = false) {
  const x = String(상대길 ?? '').replace(/\\/g, '/');
  if (클라이프맵) return x.replace(/^.*public\//, '');
  const 조각 = x.replace(/^src\/pages\//, '').split('/');
  const 떼기 = (y) => String(y ?? '').replace(/\.astro$/, '');
  if (조각[0] === '100y' || 조각[0] === 'wikitip') return 떼기(조각[1]);
  return 떼기(조각[0]);
}

/**
 * 저장소를 훑어 호스트별 판정표를 만든다.
 * @returns {Record<string, Record<string, string>>}
 */
export function 판정만들기(뿌리, 읽기 = (q) => fs.readFileSync(q, 'utf8'), 모으기 = 파일모으기) {
  const 표 = { 'seoulmarkets.com': {}, 'www.kculturewire.com': {}, '100yearmap.com': {}, 'klifemap.ai': {} };

  /* dataeconomics — 어느 호스트로 나가는지는 경로 접두가 말해 준다 */
  for (const f of 모으기(path.join(뿌리, 'src/pages'), /\.astro$/)) {
    let 글;
    try { 글 = 읽기(f); } catch { continue; }
    if (!문턱무늬.판매.test(글)) continue;
    const 상대 = String(f).replace(/\\/g, '/');
    const 호스트 = 상대.includes('/100y/') ? '100yearmap.com'
      : 상대.includes('/wikitip/') ? 'www.kculturewire.com'
        : 'seoulmarkets.com';
    const 이름 = 가지이름(상대.replace(/^.*?src\/pages\//, 'src/pages/'));
    if (이름 && 이름 !== 'index') 표[호스트][이름] = '유료';
  }

  /* /data 는 상품 17개 중 값 붙은 것이 9개다 — 갈래 «전체»가 유료는 아니다 */
  try {
    const d = 읽기(path.join(뿌리, 'src/pages/data/index.astro'));
    const 값 = [...d.matchAll(/price:\s*'([^']+)'/g)].map((m) => m[1]);
    const 유료수 = 값.filter((v) => !/^free/i.test(v)).length;
    if (유료수 > 0) 표['seoulmarkets.com'].data = 유료수 === 값.length ? '유료' : '섞임';
    if (/Pro from \$/i.test(d)) 표['seoulmarkets.com'].api = '섞임';
    표['seoulmarkets.com'].pricing = '유료';
  } catch { /* 못 읽으면 그 갈래는 못 쟀다로 남는다 */ }

  /* klifemap — 형제 저장소다. 없으면 «못 쟀다»로 비워 둔다. 「무료」로 칠하지 않는다 */
  for (const f of 모으기(path.join(뿌리, '..', 'klifemap', 'public'), /\.html$/)) {
    let 글;
    try { 글 = 읽기(f); } catch { continue; }
    const 이름 = path.basename(String(f));
    if (/^(pricing|checkout)\.html$/.test(이름)) { 표['klifemap.ai'][이름] = '유료'; continue; }
    if (문턱무늬.잠김.test(글) || 문턱무늬.결제로.test(글)) 표['klifemap.ai'][이름] = '섞임';
  }
  return 표;
}

/** 갈래 하나의 판정 — 표에 없으면 기본값을 쓴다 */
export function 갈래판정(호스트, 갈래, 표, 기본 = '무료') {
  const t = (표 ?? {})[호스트] ?? {};
  return t[갈래] ?? 기본;
}

/* ── 나무 ───────────────────────────────────────────────────────────── */
export function 나무만들기(호스트, 주소들, 표, 아이최대 = 4, 유료아이최대 = 8) {
  const 칸 = new Map();
  for (const u of 주소들 ?? []) {
    let p;
    try { p = new URL(u).pathname; } catch { continue; }
    const 조각 = p.split('/').filter(Boolean);
    const 머리 = 조각.length === 0 ? '(home)' : 조각[0];
    if (!칸.has(머리)) 칸.set(머리, { 수: 0, 둘째: new Map() });
    const c = 칸.get(머리);
    c.수 += 1;
    if (조각.length >= 2) c.둘째.set(조각[1], (c.둘째.get(조각[1]) ?? 0) + 1);
  }
  return [...칸.entries()]
    .sort((a, b) => b[1].수 - a[1].수 || a[0].localeCompare(b[0]))
    .map(([이름, c]) => {
      const 판정 = 갈래판정(호스트, 이름, 표);
      const 몫 = (판정 === '유료' || 판정 === '섞임') ? 유료아이최대 : 아이최대;
      return {
        이름,
        수: c.수,
        판정,
        아이: [...c.둘째.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 몫)
          .map(([n, v]) => ({ 이름: n, 수: v })),
        아이더: Math.max(0, c.둘째.size - 몫),
      };
    });
}

/**
 * 긴 꼬리를 접는다.
 * ⭐ 접는 자는 «수»가 아니라 «뜻»이다 — 값이 붙은 갈래는 몇 장이든 남긴다.
 * ⛔ 접은 것을 없애지 않는다. 몇 갈래·몇 장인지 한 줄로 적는다.
 */
export function 꼬리접기(가지들, 보일최대 = 20) {
  const 값붙음 = (g) => g.판정 === '유료' || g.판정 === '섞임';
  const 남길 = []; const 접을 = [];
  for (const g of 가지들 ?? []) {
    if (값붙음(g) || 남길.length < 보일최대) 남길.push(g); else 접을.push(g);
  }
  return { 가지들: 남길, 접은갈래: 접을.length, 접은장: 접을.reduce((s, g) => s + g.수, 0) };
}

/**
 * 언제 아이를 펼치나.
 * 1. 유료·섞임 갈래는 «반드시» 펼친다 — 값이 어디 붙었는지가 이 그림의 요점이다
 * 2. 그 밖에는 아이가 «묶음»일 때만 (아이 수가 2 이상인 것이 둘 이상)
 */
export function 펼칠까(가지) {
  if (!가지?.아이?.length) return false;
  if (가지.판정 === '유료' || 가지.판정 === '섞임') return true;
  return 가지.아이.filter((a) => a.수 >= 2).length >= 2;
}

/* ── SVG ────────────────────────────────────────────────────────────── */
const 피하기 = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function 그리기({ 호스트, 이름, 가지들, 총수, 잰때, 접은갈래 = 0, 접은장 = 0 }) {
  const 줄높 = 26; const 왼 = 300; const 가로 = 1180;
  let 줄 = 0; const 자리 = [];
  for (const g of 가지들 ?? []) {
    자리.push({ 종류: '가지', g, y: 줄 }); 줄 += 1;
    if (펼칠까(g)) {
      for (const a of g.아이) { 자리.push({ 종류: '아이', g, a, y: 줄 }); 줄 += 1; }
      if (g.아이더 > 0) { 자리.push({ 종류: '더', g, y: 줄 }); 줄 += 1; }
    }
  }
  if (접은갈래 > 0) { 자리.push({ 종류: '꼬리', y: 줄 }); 줄 += 1; }

  const 위 = 128;
  const 높이 = 위 + 줄 * 줄높 + 76;
  const 뿌리y = 위 + (줄 * 줄높) / 2;
  const 등뼈x = 왼 - 34;
  const 조각 = [];

  조각.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${가로}" height="${높이}" viewBox="0 0 ${가로} ${높이}" font-family="'Segoe UI',system-ui,sans-serif">`);
  조각.push(`<rect width="${가로}" height="${높이}" fill="#ffffff"/>`);
  조각.push(`<text x="28" y="42" font-size="24" font-weight="700" fill="#1a1a1a">${피하기(이름)}</text>`);
  조각.push(`<text x="28" y="66" font-size="14" fill="#5f6368">${피하기(호스트)} — ${총수.toLocaleString()} pages in sitemap · measured ${피하기(잰때)} KST</text>`);

  let lx = 28;
  for (const k of ['무료', '유료', '섞임', '못쟀다']) {
    const c = 색[k];
    조각.push(`<rect x="${lx}" y="84" width="13" height="13" rx="3" fill="${c.칠}"/>`);
    조각.push(`<text x="${lx + 19}" y="95" font-size="12.5" fill="#3c4043">${c.표} ${피하기(c.이름)}</text>`);
    lx += 24 + c.이름.length * 7.4 + 22;
  }

  const 뿌리w = 232;
  조각.push(`<rect x="28" y="${뿌리y - 20}" width="${뿌리w}" height="40" rx="8" fill="#1a1a1a"/>`);
  조각.push(`<text x="${28 + 뿌리w / 2}" y="${뿌리y + 6}" font-size="15" font-weight="600" fill="#ffffff" text-anchor="middle">${피하기(호스트)}</text>`);
  if (줄 > 0) {
    조각.push(`<path d="M ${28 + 뿌리w} ${뿌리y} H ${등뼈x}" stroke="#c9ced4" stroke-width="1.6" fill="none"/>`);
    조각.push(`<path d="M ${등뼈x} ${위 + 줄높 / 2} V ${위 + (줄 - 0.5) * 줄높}" stroke="#c9ced4" stroke-width="1.6" fill="none"/>`);
  }

  for (const 것 of 자리) {
    const y = 위 + 것.y * 줄높 + 줄높 / 2;
    if (것.종류 === '가지') {
      const c = 색[것.g.판정] ?? 색.못쟀다;
      const 글 = `${c.표} /${것.g.이름}`;
      const 폭 = Math.max(150, 글.length * 8.6 + 26);
      조각.push(`<path d="M ${등뼈x} ${y} H ${왼 - 8}" stroke="#c9ced4" stroke-width="1.6" fill="none"/>`);
      조각.push(`<rect x="${왼}" y="${y - 11}" width="${폭}" height="22" rx="5" fill="${c.연}" stroke="${c.칠}" stroke-width="1.2"/>`);
      조각.push(`<text x="${왼 + 10}" y="${y + 5}" font-size="13" font-weight="600" fill="${c.칠}">${피하기(글)}</text>`);
      조각.push(`<text x="${왼 + 폭 + 12}" y="${y + 5}" font-size="12.5" fill="#3c4043">${것.g.수.toLocaleString()}</text>`);
    } else if (것.종류 === '아이') {
      const x = 왼 + 46;
      조각.push(`<path d="M ${왼 + 18} ${y - 줄높} V ${y} H ${x - 8}" stroke="#dde1e5" stroke-width="1.3" fill="none"/>`);
      조각.push(`<text x="${x}" y="${y + 4}" font-size="12" fill="#5f6368">/${피하기(것.g.이름)}/${피하기(것.a.이름)}</text>`);
      조각.push(`<text x="${x + 320}" y="${y + 4}" font-size="12" fill="#80868b">${것.a.수.toLocaleString()}</text>`);
    } else if (것.종류 === '꼬리') {
      const 글 = `+ ${접은갈래} more free sections`;
      const 폭 = Math.max(150, 글.length * 8.6 + 26);
      조각.push(`<path d="M ${등뼈x} ${y} H ${왼 - 8}" stroke="#c9ced4" stroke-width="1.6" stroke-dasharray="3 3" fill="none"/>`);
      조각.push(`<rect x="${왼}" y="${y - 11}" width="${폭}" height="22" rx="5" fill="#f6f7f8" stroke="${색.무료.칠}" stroke-width="1" stroke-dasharray="3 3"/>`);
      조각.push(`<text x="${왼 + 10}" y="${y + 5}" font-size="12.5" fill="${색.무료.칠}">${피하기(글)}</text>`);
      조각.push(`<text x="${왼 + 폭 + 12}" y="${y + 5}" font-size="12.5" fill="#3c4043">${접은장.toLocaleString()}</text>`);
    } else {
      조각.push(`<text x="${왼 + 46}" y="${y + 4}" font-size="11.5" font-style="italic" fill="#9aa0a6">… ${것.g.아이더} more under /${피하기(것.g.이름)}</text>`);
    }
  }

  조각.push(`<text x="28" y="${높이 - 34}" font-size="11.5" fill="#80868b">Paid/free is scanned from the code that renders the buy button or paywall — not guessed. Sections not scanned stay grey.</text>`);
  조각.push(`<text x="28" y="${높이 - 16}" font-size="11.5" fill="#80868b">Made by scripts/make-sitemap-tree.mjs — re-run it when pages change.</text>`);
  조각.push('</svg>');
  return 조각.join('\n');
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('로크뽑기: 두 개를 뽑는다', 로크뽑기('<loc>https://a/x</loc><loc>https://a/y</loc>').length === 2);
  재다('로크뽑기: 빈 글은 0', 로크뽑기('').length === 0);
  재다('로크뽑기: null 도 안 죽는다', 로크뽑기(null).length === 0);
  재다('로크뽑기: 앞뒤 빈칸을 떤다', 로크뽑기('<loc>  https://a/x  </loc>')[0] === 'https://a/x');

  재다('가지이름: 뿌리 지면', 가지이름('src/pages/rankings.astro') === 'rankings');
  재다('가지이름: 갈래 밑', 가지이름('src/pages/data/people.astro') === 'data');
  재다('⭐ 가지이름: 100y 접두는 «호스트 접두»라 한 칸 더 들어간다',
    가지이름('src/pages/100y/college-major/[slug].astro') === 'college-major');
  재다('⭐ 가지이름: wikitip 도 같다', 가지이름('src/pages/wikitip/rank-shape.astro') === 'rank-shape');
  재다('가지이름: klifemap 은 파일 이름이 곧 경로다',
    가지이름('../klifemap/public/saju.html', true) === 'saju.html');
  재다('가지이름: null 도 안 죽는다', 가지이름(null) === '');

  const 가짜모으기 = (방) => (String(방).replace(/\\/g, '/').includes('klifemap')
    ? ['/k/public/saju.html', '/k/public/about.html', '/k/public/pricing.html']
    : ['/뿌리/src/pages/100y/report/area/[slug].astro', '/뿌리/src/pages/tag/[slug].astro',
       '/뿌리/src/pages/wikitip/rank-shape.astro']);
  const 가짜읽기 = (q) => {
    const x = String(q).replace(/\\/g, '/');
    if (x.includes('saju.html')) return '<div class="잠금판">…</div>';
    if (x.includes('about.html')) return '구독을 설명하는 글일 뿐이다';
    if (x.includes('pricing.html')) return '값';
    if (x.includes('report/area')) return "import { 사기전안내 } from '../../../lib/price';";
    if (x.includes('rank-shape')) return 'const v = 사기전안내;';
    if (x.includes('data/index.astro')) return "price: 'Free page' price: '$29 — one-time' Pro from $9";
    return '평범한 지면';
  };
  const 만든 = 판정만들기('/뿌리', 가짜읽기, 가짜모으기);
  재다('판정만들기: 사는 길이 있는 100y 지면을 유료로 잡는다', 만든['100yearmap.com'].report === '유료');
  재다('판정만들기: wikitip 지면은 kculturewire 로 간다', 만든['www.kculturewire.com']['rank-shape'] === '유료');
  재다('⛔ 판정만들기: 값이 안 붙은 지면은 표에 안 넣는다 (무료로 남는다)',
    만든['seoulmarkets.com'].tag === undefined);
  재다('판정만들기: klifemap 문턱 지면을 섞임으로 잡는다', 만든['klifemap.ai']['saju.html'] === '섞임');
  재다('⛔ 판정만들기: 「구독」을 «설명»만 하는 지면에 안 걸린다 — 넓게 잡으면 그림이 거짓이 된다',
    만든['klifemap.ai']['about.html'] === undefined);
  재다('판정만들기: 값 내는 자리는 유료다', 만든['klifemap.ai']['pricing.html'] === '유료');
  재다('판정만들기: /data 는 값이 섞여 있으면 섞임이다', 만든['seoulmarkets.com'].data === '섞임');
  재다('⛔ 판정만들기: klifemap 이 없으면 «못 쟀다»로 비워 둔다 (무료로 칠하지 않는다)',
    Object.keys(판정만들기('/뿌리', 가짜읽기, () => [])['klifemap.ai']).length === 0);

  const 표 = { 'a.com': { data: '섞임', pricing: '유료' } };
  재다('갈래판정: 표에 있으면 그것', 갈래판정('a.com', 'data', 표) === '섞임');
  재다('갈래판정: 표에 없으면 기본값', 갈래판정('a.com', 'article', 표) === '무료');
  재다('⛔ 갈래판정: 모르는 호스트를 지어내지 않는다', 갈래판정('없는곳', 'x', 표, '못쟀다') === '못쟀다');
  재다('갈래판정: 표가 null 이어도 안 죽는다', 갈래판정('a.com', 'x', null) === '무료');

  const us = ['https://a.com/', 'https://a.com/article/1', 'https://a.com/article/2',
    'https://a.com/data/people', 'https://a.com/data/api', 'https://a.com/pricing'];
  const t = 나무만들기('a.com', us, 표);
  재다('나무: 갈래 수', t.length === 4);
  재다('나무: 홈을 (home) 으로 센다', t.some((x) => x.이름 === '(home)'));
  재다('나무: 판정을 붙인다', t.find((x) => x.이름 === 'data').판정 === '섞임');
  재다('나무: 둘째 칸을 아이로 담는다', t.find((x) => x.이름 === 'data').아이.length === 2);
  재다('나무: 빈 목록도 안 죽는다', 나무만들기('a.com', [], 표).length === 0);
  재다('나무: null 도 안 죽는다', 나무만들기('a.com', null, 표).length === 0);
  재다('⛔ 나무: 망가진 주소를 버린다 (지어내지 않는다)',
    나무만들기('a.com', ['그냥글자', 'https://a.com/x'], 표).length === 1);
  재다('나무: 아이를 최대치로 자르고 «몇 개 더»를 센다', (() => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => `https://a.com/z/${x}`);
    const r = 나무만들기('a.com', many, 표, 2).find((x) => x.이름 === 'z');
    return r.아이.length === 2 && r.아이더 === 4;
  })());

  재다('⛔ 펼칠까: 아이가 낱장뿐이면 안 펼친다 — 기사 슬러그는 잡음이다',
    펼칠까({ 수: 500, 판정: '무료', 아이: [{ 수: 1 }, { 수: 1 }, { 수: 1 }] }) === false);
  재다('펼칠까: 아이가 묶음이면 펼친다',
    펼칠까({ 수: 500, 판정: '무료', 아이: [{ 수: 9 }, { 수: 4 }] }) === true);
  재다('⭐ 펼칠까: 유료 갈래는 낱장이어도 «반드시» 펼친다',
    펼칠까({ 수: 16, 판정: '섞임', 아이: [{ 수: 1 }] }) === true);
  재다('펼칠까: 아이가 없으면 안 펼친다', 펼칠까({ 수: 500, 판정: '유료', 아이: [] }) === false);
  재다('펼칠까: null 도 안 죽는다', 펼칠까(null) === false);

  const 꼬리 = 꼬리접기([
    { 이름: 'a', 수: 100, 판정: '무료' }, { 이름: 'b', 수: 90, 판정: '무료' },
    { 이름: 'c', 수: 3, 판정: '유료' }, { 이름: 'd', 수: 2, 판정: '무료' },
  ], 2);
  재다('꼬리접기: 보일최대까지 남긴다', 꼬리.가지들.length === 3);
  재다('⭐ 꼬리접기: 유료 갈래는 꼬리에 있어도 «남긴다»', 꼬리.가지들.some((g) => g.이름 === 'c'));
  재다('꼬리접기: 접은 갈래 수를 센다', 꼬리.접은갈래 === 1);
  재다('⛔ 꼬리접기: 접은 것을 없애지 않고 «몇 장»인지 적는다', 꼬리.접은장 === 2);
  재다('꼬리접기: 빈 목록도 안 죽는다', 꼬리접기([]).접은갈래 === 0);
  재다('꼬리접기: null 도 안 죽는다', 꼬리접기(null).가지들.length === 0);

  const svg = 그리기({ 호스트: 'a.com', 이름: 'A', 가지들: t, 총수: 6, 잰때: '2026-09-09 23:00' });
  재다('그리기: svg 로 시작한다', svg.startsWith('<svg'));
  재다('그리기: 배경을 흰색으로 칠한다 (투명하면 뷰어마다 달라진다)', svg.includes('fill="#ffffff"'));
  재다('그리기: 범례 넷이 다 있다', ['Free', 'Paid', 'Mixed', 'Not measured'].every((x) => svg.includes(x)));
  재다('⚠ 그리기: 색«만»으로 가르지 않는다 — 표시 글자도 붙는다', svg.includes('○ ') && svg.includes('◐ '));
  재다('그리기: 유료 색을 쓴다', svg.includes(색.유료.칠));
  재다('그리기: 지면 수를 세 자리마다 끊는다',
    그리기({ 호스트: 'a', 이름: 'A', 가지들: [], 총수: 2859, 잰때: 'x' }).includes('2,859'));
  재다('그리기: <> 를 피한다', 그리기({ 호스트: '<b>', 이름: 'A', 가지들: [], 총수: 1, 잰때: 'x' }).includes('&lt;b&gt;'));
  재다('그리기: 가지가 없어도 안 죽는다', 그리기({ 호스트: 'a', 이름: 'A', 가지들: [], 총수: 0, 잰때: 'x' }).endsWith('</svg>'));
  재다('그리기: 접은 꼬리를 한 줄로 적는다',
    그리기({ 호스트: 'a', 이름: 'A', 가지들: [], 총수: 9, 잰때: 'x', 접은갈래: 130, 접은장: 411 }).includes('130 more free sections'));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`\n■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

if (!자가시험()) process.exit(1);
if (process.argv.includes('--자가시험')) process.exit(0);

const 사이트들 = [
  { 호스트: 'seoulmarkets.com', 이름: 'SeoulMarkets — Korean market data in English', 파일: 'seoulmarkets' },
  { 호스트: 'www.kculturewire.com', 이름: 'K Culture Wire — Korean pop culture, in English', 파일: 'kculturewire' },
  { 호스트: '100yearmap.com', 이름: '100 Year Map — education and careers', 파일: '100yearmap' },
  { 호스트: 'klifemap.ai', 이름: 'KLifeMap — saju, astrology, compatibility', 파일: 'klifemap' },
];

const 받기 = async (u) => {
  try {
    const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
    return r.ok ? r.text() : '';
  } catch { return ''; }
};

/* 🔴 손 표가 아니라 «코드를 훑어» 판정을 만든다 */
const 판정 = 판정만들기(뿌리);
console.log('\n■ 값이 붙은 갈래 — 코드를 훑어 잰 것');
for (const [h, t] of Object.entries(판정)) {
  const 키 = Object.keys(t);
  /* ⚠ 0 가지는 «못 쟀다»가 아니다 — 훑어서 «없음을 확인한» 것이다. 둘을 가려 적는다.
   *   KCW 는 광고만으로 버는 사이트라 유료 지면이 정말 없다(5번). 회색으로 칠하면 거짓이 된다. */
  const 훑었나 = Object.keys(판정).includes(h);
  console.log(`  · ${h} — ${키.length}가지` + (키.length ? `  ${키.join(' · ')}` : (훑었나 ? '  (훑었다 · 유료 지면 없음)' : '  (못 쟀다)')));
}

const 방 = path.join(뿌리, 낼방);
fs.mkdirSync(방, { recursive: true });
const 잰때 = new Date().toLocaleString('ko-KR', { hour12: false });   /* ⚠ 이 PC 가 이미 KST 다 */

console.log(`\n■ 사이트맵 나무 — ${낼방}/ 에 낸다\n`);
const 요약 = [];
for (const s of 사이트들) {
  const us = await 사이트맵모으기(s.호스트, 받기);
  if (!us.length) {
    console.log(`  ⚠ ${s.파일} — 사이트맵을 못 받았다. «없는 것»이 아니라 «못 쟀다»로 둔다`);
    요약.push({ ...s, 수: null });
    continue;
  }
  const 다 = 나무만들기(s.호스트, us, 판정);
  const { 가지들, 접은갈래, 접은장 } = 꼬리접기(다);
  fs.writeFileSync(path.join(방, `${s.파일}.svg`),
    그리기({ 호스트: s.호스트, 이름: s.이름, 가지들, 총수: us.length, 잰때, 접은갈래, 접은장 }), 'utf8');
  const 유료수 = 다.filter((g) => g.판정 === '유료' || g.판정 === '섞임').length;
  console.log(`  ✅ ${s.파일}.svg — 지면 ${us.length.toLocaleString()} · 갈래 ${다.length} (값 붙은 ${유료수} · 접은 ${접은갈래})`);
  요약.push({ ...s, 수: us.length, 갈래: 다.length, 유료수 });
}

const 목차 = ['# 사이트맵 나무 그림', '',
  '> 사장님 지시 (2026-09-09): 「모든 유닛 사이트맵을 이미지 파일로 만들어서 사이트맵 폴더를 만들어',
  '> 넣어놔줘. tree 모양으로 해서 한 눈에 알아보게...유료, 무료는 컬러를 다르게 해서 구분되게 하고」', '',
  `잰때: ${잰때} KST`, '',
  '만든 자: `scripts/make-sitemap-tree.mjs` (SVG) · `scripts/make-sitemap-tree-png.mjs` (PNG)',
  '⛔ 한 번 그리고 버리는 그림이 아니다. 지면이 늘면 다시 돌린다.', '',
  '| 사이트 | 지면 | 갈래 | 값 붙은 갈래 | 그림 |', '|---|---:|---:|---:|---|'];
for (const r of 요약) {
  목차.push(`| ${r.호스트} | ${r.수 === null ? '못 쟀다' : r.수.toLocaleString()} | ${r.갈래 ?? '—'} | ${r.유료수 ?? '—'} | \`${r.파일}.svg\` · \`${r.파일}.png\` |`);
}
목차.push('', '## 색', '', '```',
  '○ 무료 (초록)    손님이 값을 안 내고 보는 지면',
  '● 유료 (빨강)    값을 내는 자리 자체 (pricing · checkout)',
  '◐ 섞임 (주황)    한 갈래 안에 무료와 «잠긴 것»이 같이 있는 것',
  '□ 못 쟀다 (회색)  재 보지 않았다. 「무료」로 칠하지 않는다', '```', '',
  '⚠ 색«만»으로 가르지 않았다 — 이름 앞에 표시(○●◐□)를 같이 붙였다. 색을 못 보는 손님과 인쇄 때문이다.', '',
  '## 유료를 어떻게 갈랐나 — 짐작이 아니라 «코드를 훑어서»', '', '```',
  'dataeconomics  값글자 · 지역한벌값 · 사기전안내      사는 단추·값이 붙은 지면',
  '               src/pages/data/index.astro           상품의 price 칸을 세서 섞임/유료를 가른다',
  'klifemap       잠금 · lockedContent · premium_       문턱이 «걸린» 지면 → 섞임(무료+잠김)',
  '               checkout · 결제창 · 구독하기            결제로 «이어지는» 지면 → 섞임',
  '               pricing.html · checkout.html         값 내는 자리 자체 → 유료', '```', '',
  '⚠ 처음엔 손으로 표를 적었다가 klifemap 의 `saju.html` 문턱을 빠뜨렸다.',
  '  그림 아래에 「코드에서 읽었다」고 적어 놓고 실제로는 짐작이었던 것이다 — 그래서 훑어 재게 고쳤다.', '',
  '⚠ 100y·wikitip 은 저장소에서 경로 접두를 쓰지만 손님이 부르는 주소에는 없다.',
  '  `server.mjs` 가 손님 호스트를 보고 갈아 끼운다 — 그림은 «손님이 부르는» 주소로 그렸다.');
fs.writeFileSync(path.join(방, 'README.md'), 목차.join('\n'), 'utf8');
console.log(`\n  ✅ ${낼방}/README.md`);
console.log('\n⭐ PNG: node scripts/make-sitemap-tree-png.mjs');
