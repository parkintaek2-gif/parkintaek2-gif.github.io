/**
 * 6번 사이트맵이 7줄뿐이다. ⛔ 「적다」로 단정하지 않고 **실물에 물어본다** —
 *   지면이 정말 일곱뿐인가, 아니면 만들어 놓고 안 올린 것이 있나.
 * ⭐ 이것이 교차 검증이다 — 표에 없는 것을 결과물에서 찾는다.
 */
import https from 'node:https';

const 호스트 = 'seoulmarkets.com';
function 받기(길) {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만({ code: 0, body: '' }); }, 25000);
    const req = https.request({ host: 호스트, path: 길, headers: { Host: 호스트, 'User-Agent': 'KCultureWire-crosscheck/seat5' } },
      (res) => {
        const 조각 = []; res.on('data', (c) => 조각.push(c));
        res.on('end', () => 한번만({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8') }));
      });
    req.on('error', () => 한번만({ code: 0, body: '' }));
    req.end();
  });
}

/**
 * 🔴 처음에 「사이트맵 7줄뿐」으로 봤다가 틀릴 뻔했다.
 *   그것은 **사이트맵 색인**이고 하위 사이트맵 일곱을 가리킨다.
 *   ⛔ 재는 쪽도 틀릴 수 있다. 색인이면 안까지 열어 본다.
 */
const sm = await 받기('/sitemap.xml');
const 첫줄들 = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const 색인인가 = /<sitemapindex/.test(sm.body);
console.log(`① /sitemap.xml — ${색인인가 ? '**색인**이다. 하위를 연다' : '보통 사이트맵'} (${첫줄들.length}줄)`);

let 실린것 = 첫줄들;
if (색인인가) {
  실린것 = [];
  for (const u of 첫줄들) {
    const 길 = u.replace(/^https?:\/\/[^/]+/, '');
    const r = await 받기(길);
    const 속 = [...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    실린것.push(...속);
    console.log(`   ${길.padEnd(30)} ${r.code}  ${속.length}줄`);
  }
  console.log(`   → 하위까지 합쳐 **${실린것.length}개**`);
}

/* 첫 화면이 거는 안쪽 주소를 모은다 — 사이트맵과 맞대 본다 */
const 첫 = await 받기('/');
const 안쪽 = [...new Set([...첫.body.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))]
  .filter((p) => p !== '/' && !/\.(png|jpg|svg|ico|xml|txt|css|js)$/.test(p));
console.log(`\n② 첫 화면이 거는 안쪽 지면 ${안쪽.length}개`);

const 실린집 = new Set(실린것.map((u) => u.replace(/^https?:\/\/[^/]+/, '') || '/'));
const 빠진것 = 안쪽.filter((p) => !실린집.has(p));
console.log(`\n③ **첫 화면에 걸려 있는데 사이트맵에 없는 것 ${빠진것.length}개**`);
for (const p of 빠진것.slice(0, 20)) {
  const r = await 받기(p);
  console.log(`   ${r.code === 200 ? '🔴' : '  '} ${p.padEnd(40)} ${r.code}`
    + `${r.code === 200 ? '  ← 살아 있는데 사이트맵에 없다' : ''}`);
}
if (!빠진것.length) console.log('   ✅ 없다');
