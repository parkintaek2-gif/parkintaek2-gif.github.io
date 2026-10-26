#!/usr/bin/env node
/**
 * check-사이트맵에-리디렉션이-있나.mjs
 *
 * 🔴🔴🔴 [2026-10-26 · 사장님 → Search Console]
 *   「페이지 색인이 생성되지 않는 새로운 이유 — **리디렉션이 포함된 페이지**」
 *
 * [무슨 일인가] 구글이 사이트맵에 적힌 주소를 열었는데 그 주소가 **다른 데로 넘긴다**.
 *   구글은 넘겨진 주소를 색인하지, 적어 낸 주소를 색인하지 않는다.
 *   ⇒ 사이트맵에 적는 주소는 «끝까지 가는 주소»여야 한다. 넘기는 주소를 적으면
 *     그 지면은 통째로 색인에서 빠진다.
 *
 * [무엇을 세나] 사이트맵(색인 사이트맵이면 그 속까지)에 적힌 주소를 그대로 열어
 *   3xx 를 돌려주는 것을 찾아, 어디로 넘기는지 함께 적는다.
 * ⛔ 「없다」는 내가 본 범위 안에서 없다는 뜻이다 — 읽은 사이트맵 수를 함께 적는다.
 *
 * [실행]
 *   node scripts/check-사이트맵에-리디렉션이-있나.mjs                 (네 곳 모두)
 *   node scripts/check-사이트맵에-리디렉션이-있나.mjs seoulmarkets.com
 */
const 기본 = ['seoulmarkets.com', 'www.kculturewire.com', 'klifemap.ai', '100yearmap.com'];
const 볼곳 = process.argv.slice(2).length ? process.argv.slice(2) : 기본;
const 한곳당 = Number(process.env.한곳당 || 120);

async function 받기(주소, 따라갈까 = false) {
  try {
    return await fetch(주소, {
      redirect: 따라갈까 ? 'follow' : 'manual',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; KLifeMapBot/1.0; +https://klifemap.ai)' },
    });
  } catch (e) { return { status: 0, headers: { get: () => null }, 탈: e.message }; }
}

async function 사이트맵읽기(주소, 깊이 = 0, 본것 = new Set()) {
  if (깊이 > 2 || 본것.has(주소)) return { 주소들: [], 사이트맵수: 0 };
  본것.add(주소);
  const r = await 받기(주소, true);
  if (!r || r.status !== 200) return { 주소들: [], 사이트맵수: 0, 탈: `사이트맵 ${r.status}` };
  const 글 = await r.text();
  const 속사이트맵 = [...글.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (속사이트맵.length) {
    let 모음 = []; let 수 = 0;
    for (const s of 속사이트맵) {
      const r2 = await 사이트맵읽기(s, 깊이 + 1, 본것);
      모음 = 모음.concat(r2.주소들); 수 += r2.사이트맵수;
    }
    return { 주소들: 모음, 사이트맵수: 수 + 1 };
  }
  const 주소들 = [...글.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  return { 주소들, 사이트맵수: 1 };
}

let 전체흠 = 0;
for (const 집 of 볼곳) {
  console.log(`\n══ ${집} ══`);
  const { 주소들, 사이트맵수, 탈 } = await 사이트맵읽기(`https://${집}/sitemap.xml`);
  if (탈) { console.log(`  🔴 ${탈} — 사이트맵을 못 읽었다`); continue; }
  /* 🔴 [2026-10-27 · 5번] **앞에서 120개만 보면 「없다」가 거짓이 된다.**
     사이트맵 앞쪽은 보통 홈·분류 지면이라 멀쩡하다. 넘기는 주소는 «옛 기사 주소»에
     숨어 있고 그것은 뒤쪽에 있다. 앞만 보고 「넘기는 주소 없음」이라 적으면
     내 자가 보는 범위를 내가 정해 놓고 못 본 것을 없는 것으로 적은 셈이다.
     ⇒ 같은 품으로 «처음부터 끝까지 골고루» 집는다(건너뛰며 고르기).
     ⚠ 그래도 표본이다. 「표본에서 못 찾았다」이지 「없다」가 아니다 — 그렇게 적는다. */
  const 걸음 = Math.max(1, Math.floor(주소들.length / 한곳당));
  const 볼것 = 주소들.filter((_, i) => i % 걸음 === 0).slice(0, 한곳당);
  console.log(`  사이트맵 ${사이트맵수}장 · 주소 ${주소들.length}개 (골고루 ${볼것.length}개를 연다 — 표본)`);
  const 넘김 = []; const 깨짐 = [];
  for (let i = 0; i < 볼것.length; i += 8) {
    const 묶음 = 볼것.slice(i, i + 8);
    const 답 = await Promise.all(묶음.map((u) => 받기(u)));
    답.forEach((r, j) => {
      const u = 묶음[j];
      if (r.status >= 300 && r.status < 400) 넘김.push({ u, 코드: r.status, 간곳: r.headers.get('location') });
      else if (r.status >= 400 || r.status === 0) 깨짐.push({ u, 코드: r.status });
    });
  }
  if (넘김.length) {
    전체흠 += 넘김.length;
    console.log(`  🔴 사이트맵에 적혔는데 **넘기는 주소** ${넘김.length}개 — 구글은 이것을 색인하지 않는다`);
    for (const x of 넘김.slice(0, 12)) console.log(`     ${x.코드}  ${x.u}\n          → ${x.간곳}`);
    if (넘김.length > 12) console.log(`     … ${넘김.length - 12}개 더`);
  } else console.log('  ✅ 넘기는 주소 없음');
  if (깨짐.length) {
    console.log(`  ⚠ 열리지 않는 주소 ${깨짐.length}개`);
    for (const x of 깨짐.slice(0, 6)) console.log(`     ${x.코드}  ${x.u}`);
  }
}
console.log(`\n넘기는 주소 모두 ${전체흠}개`);
process.exit(전체흠 ? 1 : 0);
