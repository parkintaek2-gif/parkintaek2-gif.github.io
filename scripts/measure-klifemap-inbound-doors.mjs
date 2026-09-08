#!/usr/bin/env node
/**
 * measure-klifemap-inbound-doors.mjs — **klifemap 지면에 「들어오는 문」이 몇 개인가.**
 * ─────────────────────────────────────────────────────────────────────────────
 * 매체: **KLifeMap**(klifemap.ai). ⛔ 이 자는 «재기만» 한다. 아무것도 안 고친다 —
 *   klifemap 은 매출이 나는 서비스다. 재는 자가 그 서비스를 건드릴 이유가 없다.
 *
 * ── 🔴 왜 (2026-09-08 · 4번 물음에 5번이 답하려고 지음) ────────────
 * 4번이 klifemap 색인을 재서 이렇게 올렸다 —
 *   「표본 12장을 구글에 직접 물었더니 **색인 0 · 안 됨 12**.
 *    그중 7장은 구글이 이 주소를 «아직 모른다»(크롤 자체가 안 옴).
 *    제목을 바꿔도 구글이 안 왔으면 소용없다」
 * 그리고 제 판단을 기다렸다. 제가 재 보니 4번이 옳았고, 까닭이 «제목»이 아니었다.
 *
 * ```
 * robots.txt            ✅ Allow: /            — 막고 있지 않다
 * sitemap.xml           ✅ 200 · 주소 526개    — 물어본 12장이 «다» 들어 있다
 * 홈에서 /content/ 링크  🔴 0개
 * saju.html 에서         🔴 3개
 * astro.html 에서        🔴 0개
 * horoscope.html 에서    🔴 0개
 * ```
 * ⭐ 사이트맵에는 있는데 **안쪽에서 아무도 가리키지 않는다.** 그러면 구글은 그 주소를
 *   「낮은 우선순위」로 두고 오지 않는다 — 4번이 본 「아직 모른다 7장」이 그 모습이다.
 * ⛔ 그러니 «제목 실험»을 먼저 하면 안 된다. 구글이 안 온 지면의 제목은 재지지 않는다.
 *
 * ⚠ 위 다섯 줄은 «표본»이다. 이 자는 사이트맵의 지면을 다 훑어 «참 수»를 낸다.
 *
 * 쓰는 법
 *   node scripts/measure-klifemap-inbound-doors.mjs
 *   node scripts/measure-klifemap-inbound-doors.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 사이트맵 = 'https://klifemap.ai/sitemap.xml';
const 바탕 = 'https://klifemap.ai';

/** 사이트맵 글에서 주소를 뽑는다 */
export function 주소뽑기(xml) {
  return [...String(xml ?? '').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

/**
 * 한 지면의 글에서 **같은 사이트 안쪽 길**만 뽑는다.
 * ⛔ 남의 사이트 링크는 「들어오는 문」이 아니다.
 * ⚠ `#조각`·`?물음표`를 떼야 같은 지면을 두 개로 세지 않는다.
 */
export function 안쪽길뽑기(html, 바탕주소 = 바탕) {
  const 길들 = [...String(html ?? '').matchAll(/href\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
  const 답 = new Set();
  for (const h of 길들) {
    if (!h || h.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(h)) continue;
    let 길 = null;
    if (h.startsWith('/')) 길 = h;
    else if (h.startsWith(바탕주소)) 길 = h.slice(바탕주소.length) || '/';
    else if (/^https?:/i.test(h)) continue;          /* 남의 사이트 */
    else 길 = `/${h}`;                                /* 상대 길 */
    길 = 길.split('#')[0].split('?')[0];
    if (!길) continue;
    if (길.length > 1) 길 = 길.replace(/\/$/, '');
    답.add(길);
  }
  return [...답];
}

/** 주소에서 길만. ⛔ 못 읽으면 null — 짐작하지 않는다 */
export function 길만(주소) {
  try {
    const p = new URL(주소).pathname;
    return p.length > 1 ? p.replace(/\/$/, '') : p;
  } catch { return null; }
}

/** 한 번에 몇 개씩 나눠 받는다 — 남의 서버를 두들기지 않는다 */
export async function 나눠받기(주소들, 한번에 = 6, 쉬는틈 = 120, 받기 = 기본받기) {
  const 답 = new Map();
  for (let i = 0; i < 주소들.length; i += 한번에) {
    const 묶음 = 주소들.slice(i, i + 한번에);
    const 것들 = await Promise.all(묶음.map(async (u) => [u, await 받기(u)]));
    for (const [u, v] of 것들) 답.set(u, v);
    if (i + 한번에 < 주소들.length) await new Promise((r) => setTimeout(r, 쉬는틈));
  }
  return 답;
}

async function 기본받기(u) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(25000) });
    if (!r.ok) return { 못받음: `HTTP ${r.status}` };
    return { 글: await r.text() };
  } catch (e) {
    return { 못받음: e.message };
  }
}

/* ── 자가시험 ────────────────────────────────────────────────── */
const 내가입구인가 = !!process.argv[1]
  && process.argv[1].split(/[\\/]/).pop() === new URL(import.meta.url).pathname.split('/').pop();

if (내가입구인가 && process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  재다('주소뽑기 — loc 두 개', 주소뽑기('<loc>https://a/x</loc><loc>https://a/y</loc>').length === 2);
  재다('주소뽑기 — 빈 글은 0개', 주소뽑기('').length === 0);
  재다('주소뽑기 — 앞뒤 빈칸을 떼낸다', 주소뽑기('<loc>\n  https://a/x\n</loc>')[0] === 'https://a/x');

  재다('길만 — 뿌리는 /', 길만('https://klifemap.ai/') === '/');
  재다('길만 — 끝 슬래시를 뗀다', 길만('https://klifemap.ai/content/x/') === '/content/x');
  재다('길만 — 주소가 아니면 null', 길만('그냥글') === null);

  const 보기 = `<a href="/content/a">A</a><a href="content/b">B</a>
    <a href="https://klifemap.ai/content/c#조각">C</a>
    <a href="https://klifemap.ai/content/c?x=1">같은 C</a>
    <a href="https://다른곳.com/content/z">남</a>
    <a href="#위">닻</a><a href="mailto:a@b.c">메일</a>`;
  const 길들 = 안쪽길뽑기(보기);
  재다('안쪽길 — 절대·상대·전체주소를 다 받는다', 길들.includes('/content/a') && 길들.includes('/content/b') && 길들.includes('/content/c'));
  재다('안쪽길 — 남의 사이트는 안 센다', !길들.some((x) => x.includes('/z')));
  재다('안쪽길 — 닻·메일은 안 센다', !길들.includes('#위') && !길들.some((x) => x.includes('mailto')));
  /* 🔴 조각·물음표를 안 떼면 같은 지면이 셋으로 세어져 「문이 셋 있다」가 된다 */
  재다('안쪽길 — #조각·?물음표를 떼어 같은 지면을 하나로 센다', 길들.filter((x) => x === '/content/c').length === 1);

  /* ⚠ 「문이 0개」와 「못 받았다」는 다르다 — 섞으면 없는 흠을 만든다 */
  const 재본것 = await 나눠받기(['u1', 'u2'], 2, 0, async (u) => (u === 'u1' ? { 글: '<a href="/content/a">x</a>' } : { 못받음: '타임아웃' }));
  재다('나눠받기 — 못 받은 것은 못받음으로 남는다', 재본것.get('u2').못받음 === '타임아웃');
  재다('나눠받기 — 받은 것은 글이 있다', 안쪽길뽑기(재본것.get('u1').글).includes('/content/a'));

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

if (내가입구인가) {
  const r = await fetch(사이트맵, { signal: AbortSignal.timeout(25000) });
  if (!r.ok) { console.log(`🔴 사이트맵을 못 받았다 — HTTP ${r.status}`); process.exit(1); }
  const 주소들 = 주소뽑기(await r.text());
  console.log(`사이트맵 주소 ${주소들.length}개 — 다 훑어 「들어오는 문」을 센다`);
  console.log('⚠ 재기만 합니다. 이 자는 klifemap 을 고치지 않습니다.\n');

  const 받은것 = await 나눠받기(주소들, 6, 150);

  const 문 = new Map();          /* 길 → 나를 가리키는 지면들 */
  for (const u of 주소들) { const p = 길만(u); if (p) 문.set(p, new Set()); }
  const 못받은 = [];
  for (const [u, v] of 받은것) {
    if (v.못받음) { 못받은.push({ 주소: u, 왜: v.못받음 }); continue; }
    const 나 = 길만(u);
    for (const 간곳 of 안쪽길뽑기(v.글)) {
      if (간곳 === 나) continue;              /* 자기 자신은 문이 아니다 */
      if (문.has(간곳)) 문.get(간곳).add(나);
    }
  }

  /* ⛔ 못 받은 지면이 많으면 「문이 없다」가 아니라 「못 쟀다」다 */
  const 못받은몫 = 못받은.length / 주소들.length;
  if (못받은몫 > 0.10) {
    console.log(`🔴 못 받은 지면이 ${(못받은몫 * 100).toFixed(0)}% (${못받은.length}장) 입니다 — 세지 않고 멈춥니다.`);
    console.log('   ⛔ 이 상태로 세면 「문이 없다」와 「못 받았다」가 섞입니다.');
    for (const x of 못받은.slice(0, 5)) console.log(`   · ${x.주소} — ${x.왜}`);
    process.exit(1);
  }

  const 잰것 = [...문.entries()].filter(([p]) => !못받은.some((x) => 길만(x.주소) === p));
  const 문없음 = 잰것.filter(([, s]) => s.size === 0).map(([p]) => p);
  const 콘텐트 = 잰것.filter(([p]) => p.startsWith('/content/'));
  const 콘텐트문없음 = 콘텐트.filter(([, s]) => s.size === 0).map(([p]) => p);

  console.log(`■ 잰 지면 ${잰것.length}장 (못 받은 것 ${못받은.length}장은 뺐다)`);
  console.log(`   들어오는 문이 0인 지면 ${문없음.length}장 (${(문없음.length / 잰것.length * 100).toFixed(1)}%)`);
  console.log(`   그중 /content/ 지면 ${콘텐트문없음.length}장 — /content/ 전체 ${콘텐트.length}장 가운데`);
  console.log('');
  const 문많은 = 잰것.filter(([, s]) => s.size > 0).sort((a, b) => b[1].size - a[1].size).slice(0, 5);
  console.log('■ 문이 있는 지면 가운데 많은 것');
  for (const [p, s] of 문많은) console.log(`   ${String(s.size).padStart(3)}개 ← ${p}`);
  console.log('');
  console.log('■ 문이 0인 /content/ 지면 맛보기 12장');
  for (const p of 콘텐트문없음.slice(0, 12)) console.log(`   · ${p}`);

  const 낼곳 = path.join(뿌리, 'src/data/klifemap-inbound-doors.json');
  fs.writeFileSync(낼곳, JSON.stringify({
    지은때: new Date().toLocaleString('ko-KR'),
    무엇을잰것: 'klifemap.ai 사이트맵 지면에 「들어오는 안쪽 링크」가 몇 개인가',
    '⛔ 이 자는 고치지 않는다': 'klifemap 은 매출이 나는 서비스다. 재기만 한다',
    사이트맵주소수: 주소들.length,
    못받은장수: 못받은.length,
    잰장수: 잰것.length,
    문0인장수: 문없음.length,
    콘텐트장수: 콘텐트.length,
    콘텐트문0인장수: 콘텐트문없음.length,
    문0인콘텐트: 콘텐트문없음,
    못받은것: 못받은.slice(0, 30),
  }, null, 2), 'utf8');
  console.log(`\n→ ${path.relative(뿌리, 낼곳)}`);
}
