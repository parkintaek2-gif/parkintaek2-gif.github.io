/**
 * 「시각이 없다」 8장을 **단정하기 전에** 본다.
 * ⛔ 내 검사는 「Data as of」 라는 **말**을 찾았을 뿐이다. 6번이 다른 말을 썼을 수 있다.
 *   ⭐ 잰 것이 없는 게 아니라 **내 자가 짧았던 것**일 수 있다. 실물을 본다.
 */
import https from 'node:https';

const 호스트 = 'seoulmarkets.com';
function 받기(길) {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만(''); }, 25000);
    const req = https.request({ host: 호스트, path: 길,
      headers: { Host: 호스트, 'User-Agent': 'KCultureWire-crosscheck/seat5' } }, (res) => {
      const 조각 = []; res.on('data', (c) => 조각.push(c));
      res.on('end', () => 한번만(Buffer.concat(조각).toString('utf8')));
    });
    req.on('error', () => 한번만(''));
    req.end();
  });
}

const 볼것 = ['/api', '/data', '/data/target-price-accuracy', '/data/board-composition',
  '/data/analyst-attention', '/data/broker-candour', '/data/sector-leaders', '/refund'];

for (const p of 볼것) {
  const h = await 받기(p);
  const 글 = h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  /* 시각을 말하는 **다른 말**들을 넓게 찾는다 */
  const 자국 = [...글.matchAll(/[^.]{0,55}(as of|updated|Updated|last update|refresh|20\d\d-\d\d-\d\d|20\d\d년)[^.]{0,35}/g)]
    .map((m) => m[0].trim());
  console.log(`\n━━ ${p}   시각을 말하는 자국 ${자국.length}개`);
  for (const s of [...new Set(자국)].slice(0, 3)) console.log(`   …${s}…`);
  if (!자국.length) console.log('   🔴 어떤 말로도 시각이 없다');
}
