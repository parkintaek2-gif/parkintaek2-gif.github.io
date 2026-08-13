/**
 * 라이브 실측 — ⛔ 200 으로 안 끝낸다. **안에 수가 맞게 떴는지**까지 본다.
 * ⚠ Host 를 직접 넣어 잰다(node fetch 는 Host 를 못 바꾼다).
 */
import https from 'node:https';

const 호스트 = 'www.kculturewire.com';
function 받기(길) {
  return new Promise((resolve) => {
    const req = https.request({
      host: 호스트, path: 길, method: 'GET',
      headers: { Host: 호스트, 'User-Agent': 'KCultureWire-selfcheck/1.0' },
    }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; });
      res.on('end', () => resolve({ code: res.statusCode, body: b }));
    });
    req.on('error', (e) => resolve({ code: 0, body: e.message }));
    req.setTimeout(25000, () => { req.destroy(); resolve({ code: 0, body: 'timeout' }); });
    req.end();
  });
}

/** 새로 낸 지면·기사와, 그 안에 반드시 있어야 할 수 */
const 볼것 = [
  ['/one-month', ['8.3', '58.4', '30.1', '11 of 11', 'November 2025']],
  ['/article/a-year-in-one-month', ['58.4', '10.7', '153,241', '194,608']],
  ['/sea-athletes', ['60.6', '250.45', '132.71', '644']],
  ['/article/vietnam-reads-a-different-korea', ['60.6', '644', '132.7']],
  ['/one-title', ['49.5', '68.7', '658']],
  ['/article/one-title-is-the-median-career', ['49.5', '658', '1,329']],
  ['/', []],
  ['/sitemap.xml', []],
];

let 산것 = 0; let 죽은것 = 0;
for (const [길, 수들] of 볼것) {
  const r = await 받기(길);
  if (r.code !== 200) { console.log(`🔴 ${길.padEnd(42)} ${r.code}`); 죽은것 += 1; continue; }
  const 없는수 = 수들.filter((n) => !r.body.includes(n));
  /* 영어 손님 화면에 한국어가 새어 나오나 */
  const 한글 = (r.body.match(/[가-힣]{2,}/g) ?? []).length;
  const 딱지 = 없는수.length ? `⚠ 수 없음: ${없는수.join(' · ')}` : (수들.length ? '수 다 있음' : '');
  console.log(`${없는수.length || 한글 ? '⚠' : '✅'} ${길.padEnd(42)} 200  `
    + `${(r.body.length / 1024).toFixed(0)}KB  한국어 ${한글}  ${딱지}`);
  산것 += 1;
}

const sm = await 받기('/sitemap.xml');
const 장수 = (sm.body.match(/<loc>/g) ?? []).length;
console.log(`\n산 것 ${산것} · 죽은 것 ${죽은것} · 사이트맵 ${장수}장`);
