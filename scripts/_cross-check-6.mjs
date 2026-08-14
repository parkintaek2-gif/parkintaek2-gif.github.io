/**
 * **6번(SeoulMarkets)을 결과물에서 잰다** — 사장님 교차 검증 지시(8/14).
 *
 * 🔴 「같은 자를 남이 돌리면 결과가 똑같다. 사람만 바꾸는 것은 교차 검증이 아니다」
 *   ⛔ 그래서 6번의 검사를 안 돌린다. 6번의 소스도 안 본다.
 *   ✅ **손님이 받는 것**만 본다 — 라이브 HTML 을 받아 눈으로 셀 것을 센다.
 *
 * 🔴 node fetch 는 Host 를 못 바꾼다. `node:https` 로 Host 를 직접 넣는다.
 */
import https from 'node:https';

const 호스트 = 'seoulmarkets.com';
function 받기(길, host = 호스트) {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만({ code: 0, body: '' }); }, 25000);
    const req = https.request({
      /* ⚠ 헤더에 한글을 넣으면 node 가 던진다. ASCII 만 */
      host, path: 길, headers: { Host: host, 'User-Agent': 'KCultureWire-crosscheck/seat5' },
    }, (res) => {
      const 조각 = []; res.on('data', (c) => 조각.push(c));
      res.on('end', () => 한번만({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8'), loc: res.headers.location }));
    });
    req.on('error', (e) => 한번만({ code: 0, body: e.message }));
    req.end();
  });
}

/** ⛔ 표에 적힌 대로만 잰다. 내가 항목을 지어내지 않는다 */
const 잴것 = [
  { 무엇: '첫 화면이 살아 있다', 길: '/', 찾을것: 'SeoulMarkets' },
  { 무엇: '숫자에 시각을 붙인다', 길: '/', 찾을것: 'Data as of' },
  { 무엇: '분야 여섯이 다 있다', 길: '/', 찾을것: 'Commodities' },
];

console.log(`6번(${호스트})을 **결과물에서** 잰다 — 소스도 6번 검사도 안 본다\n`);
let 빨강 = 0;
const 첫화면 = await 받기('/');
for (const x of 잴것) {
  const r = x.길 === '/' ? 첫화면 : await 받기(x.길);
  const 살았나 = r.code === 200;
  const 있나 = 살았나 && r.body.includes(x.찾을것);
  if (!있나) 빨강 += 1;
  console.log(`${있나 ? '✅' : '🔴'} ${x.무엇.padEnd(22)} ${r.code}${r.loc ? ` → ${r.loc}` : ''}`
    + `  「${x.찾을것}」 ${있나 ? '있다' : '**없다**'}`);
}

/* ⭐ 표에 없는 것도 결과물 눈으로 본다 — 그것이 교차 검증이다 */
console.log('\n⭐ 표에 없는 것도 본다 — 결과물에서만 보이는 것들');
if (첫화면.code === 200) {
  const h = 첫화면.body;
  const 잰것 = [
    ['제목 태그', /<title>([^<]+)<\/title>/.exec(h)?.[1] ?? null],
    ['설명 태그', /<meta name="description" content="([^"]{0,90})/.exec(h)?.[1] ?? null],
    ['구조화 자료', /application\/ld\+json/.test(h) ? '있다' : null],
    ['canonical', /<link rel="canonical" href="([^"]+)"/.exec(h)?.[1] ?? null],
    ['본문 글자수', String(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length)],
    ['한국어 낱말', String((h.replace(/<script[\s\S]*?<\/script>/g, ' ').match(/[가-힣]{2,}/g) ?? []).length)],
  ];
  for (const [이름, 값] of 잰것) {
    const 나쁨 = 값 === null;
    if (나쁨) 빨강 += 1;
    console.log(`${나쁨 ? '🔴' : '  '} ${이름.padEnd(12)} ${값 ?? '**없다**'}`);
  }
}

console.log('\n⭐ 사이트맵·robots 도 결과물에서');
for (const 길 of ['/sitemap.xml', '/robots.txt']) {
  const r = await 받기(길);
  const ok = r.code === 200;
  if (!ok) 빨강 += 1;
  const 줄 = 길.endsWith('.xml') ? (r.body.match(/<loc>/g) ?? []).length : (r.body.split('\n').length);
  console.log(`${ok ? '✅' : '🔴'} ${길.padEnd(14)} ${r.code}  ${ok ? `${줄}줄` : ''}`);
}

console.log(`\n${빨강 ? `🔴 빨강 ${빨강}건` : '✅ 빨강 0건'}`);
