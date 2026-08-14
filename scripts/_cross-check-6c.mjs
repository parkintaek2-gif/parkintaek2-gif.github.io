/**
 * 6번을 **결과물에서** 한 겹 더 잰다 — 표에 없는 것을 찾는 자리.
 *
 * ⭐ 오늘 내가 겪은 사고를 6번에서 찾는다:
 *   ① 「만든 값이 0」 — 지면이 그림을 있다고 하는데 그 그림이 정말 200 인가
 *   ② canonical 이 **자기 주소**를 가리키는가 (남을 가리키면 색인이 딴 데로 간다)
 *   ③ 숫자를 내는 지면마다 **시각**이 붙는가 (금융은 시각 없는 수가 제일 위험하다)
 *
 * ⛔ 6번의 소스도 6번의 검사도 안 본다. 손님이 받는 HTML 만 본다.
 */
import https from 'node:https';

const 호스트 = 'seoulmarkets.com';
const ORIGIN = `https://${호스트}`;

function 받기(길, 머리만 = false) {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만({ code: 0, body: '' }); }, 25000);
    const req = https.request({
      host: 호스트, path: 길, method: 머리만 ? 'HEAD' : 'GET',
      /* ⚠ 헤더에 한글을 넣으면 node 가 던진다. ASCII 만 */
      headers: { Host: 호스트, 'User-Agent': 'KCultureWire-crosscheck/seat5' },
    }, (res) => {
      const 조각 = []; res.on('data', (c) => 조각.push(c));
      res.on('end', () => 한번만({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8') }));
    });
    req.on('error', () => 한번만({ code: 0, body: '' }));
    req.end();
  });
}

/* 사이트맵 색인을 펴서 **손님이 실제로 받는 지면**을 명단으로 삼는다 */
const 색인 = await 받기('/sitemap.xml');
const 하위 = [...색인.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const 지면 = [];
for (const u of 하위) {
  const r = await 받기(u.replace(/^https?:\/\/[^/]+/, ''));
  지면.push(...[...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, '') || '/'));
}
console.log(`6번 지면 ${지면.length}장을 **결과물에서** 잰다 — 소스도 6번 검사도 안 본다\n`);

const 빨강 = [];
const 그림봤다 = new Map();          // 같은 그림을 두 번 안 부른다
let 시각없음 = 0; let 수있는지면 = 0;

for (const p of 지면) {
  const r = await 받기(p);
  if (r.code !== 200) { 빨강.push([p, `사이트맵에 실렸는데 ${r.code}`]); continue; }
  const h = r.body;

  /* ② canonical 이 자기 주소인가 */
  const can = /<link rel="canonical" href="([^"]+)"/.exec(h)?.[1];
  if (!can) 빨강.push([p, 'canonical 이 없다']);
  else if (can.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') !== p.replace(/\/$/, '')) {
    빨강.push([p, `canonical 이 남을 가리킨다 → ${can}`]);
  }

  /* ① 지면이 있다고 말하는 그림이 정말 200 인가 — 「만든 값이 0」 잡기 */
  const 그림들 = [...h.matchAll(/<meta property="og:image" content="([^"]+)"/g)].map((m) => m[1]);
  for (const g of 그림들) {
    const 길 = g.replace(/^https?:\/\/[^/]+/, '');
    if (!그림봤다.has(길)) 그림봤다.set(길, (await 받기(길, true)).code);
    if (그림봤다.get(길) !== 200) 빨강.push([p, `og:image 가 ${그림봤다.get(길)} — 있다고 했는데 없다`]);
  }

  /* ③ 수를 내는 지면에 시각이 붙는가 */
  const 글 = h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
  if (/\d[\d,]*\.\d/.test(글)) {
    수있는지면 += 1;
    if (!/(Data as of|as of )/i.test(h)) { 시각없음 += 1; 빨강.push([p, '수는 있는데 **시각이 없다**']); }
  }
  /* 영문 사이트에 한국어가 새어 나왔나 */
  const 한 = 글.match(/[가-힣]{2,}/g) ?? [];
  if (한.length) 빨강.push([p, `한국어가 샜다 ${한.length}개 — ${한.slice(0, 3).join(' ')}`]);
}

console.log(`   지면 ${지면.length}장 · 수를 낸 지면 ${수있는지면}장 · 그 중 시각 없는 것 ${시각없음}장`);
console.log(`   og:image ${그림봤다.size}개 확인 — 200 아닌 것 ${[...그림봤다.values()].filter((c) => c !== 200).length}개\n`);

if (!빨강.length) console.log('✅ 빨강 0건');
else { console.log(`🔴 빨강 ${빨강.length}건`); for (const [p, 왜] of 빨강) console.log(`   ${p.padEnd(38)} ${왜}`); }
