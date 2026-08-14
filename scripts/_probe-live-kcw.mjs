/**
 * 라이브 확인 — ⛔ 200 으로 안 끝낸다. **안에 수가 맞게 떴는지**까지 본다.
 * ⚠ Host 를 직접 넣어야 한다. node fetch 는 Host 를 못 바꾼다.
 */
import https from 'node:https';
import fs from 'node:fs';

function 받기(길, host = 'www.kculturewire.com') {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만({ code: 0, body: '' }); }, 25000);
    const req = https.request({
      host, path: 길, headers: { Host: host, 'User-Agent': 'KCultureWire-selfcheck' },
    }, (res) => {
      const 조각 = []; res.on('data', (c) => 조각.push(c));
      res.on('end', () => 한번만({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8') }));
    });
    req.on('error', () => 한번만({ code: 0, body: '' }));
    req.end();
  });
}

const 볼것 = [
  ['/malaysia', ['23', '7.6', '8.6', 'Balenciaga', '2.8']],
  ['/article/malaysia-reads-the-label', ['23.0%', '900', 'Balenciaga']],
  ['/fame-compare', ['380.76', '342.3', '900', '49']],
  ['/article/one-act-clears-the-footballer', ['380.76', '900', '71.3']],
  ['/sea-athletes', ['82.4', '50.6', '137.78']],
  ['/article/the-manager-is-read-where-he-was-hired', ['82.4', '50.6']],
  ['/one-title', ['49.5', '1,329']],
  /* 85편 — ⚠ 이스포츠 100% 가 「문서의 쏠림」이라는 말이 화면에 있어야 한다 */
  ['/spread', ['41.7', '25', 'Vietnamese Wikipedia']],
  ['/article/k-pop-groups-travel-widest', ['41.7', '50.4', '100']],
  /* 86편 — ⚠ 「가게를 못 잰다」가 화면에 있어야 한다 */
  ['/places', ['111.47', '106.54', 'restaurants and cafes']],
  ['/article/a-label-outreads-the-capital', ['111.47', '106.54', '1.55']],
  /* 카드뉴스가 지면에 걸렸나 — 서버에만 있고 안 걸려 있던 자리다 */
  ['/cardnews/fame/01.png', []],
  ['/', ['K Culture Wire']],
  ['/sitemap.xml', ['/malaysia', '/fame-compare', '/spread', '/places', 'cardnews']],
];

let 나쁨 = 0;
for (const [길, 수들] of 볼것) {
  const r = await 받기(길);
  if (r.code !== 200) { console.log(`🔴 ${길.padEnd(46)} ${r.code}`); 나쁨 += 1; continue; }
  const 없는것 = 수들.filter((s) => !r.body.includes(s));
  const 한글 = (r.body.replace(/<script[\s\S]*?<\/script>/g, '').match(/[가-힣]{2,}/g) ?? []).length;
  const 표 = 없는것.length ? `⚠ 수 없음: ${없는것.join(', ')}` : '수 다 있음';
  if (없는것.length) 나쁨 += 1;
  if (한글) 나쁨 += 1;
  console.log(`${없는것.length || 한글 ? '⚠' : '✅'} ${길.padEnd(46)} 200  ${표}${한글 ? `  🔴 한국어 ${한글}` : ''}`);
}
console.log(나쁨 ? `\n⚠ 걸린 것 ${나쁨}` : '\n✅ 다 맞다');
