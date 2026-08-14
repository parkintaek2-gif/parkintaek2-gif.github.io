/**
 * 「한국어가 샜다」를 **빨강으로 올리기 전에** 앞뒤를 본다.
 *
 * 🔴 오늘 이미 한 번 틀렸다 — 사이트맵 색인을 안 열고 「67장이 빠졌다」고 셌다.
 *   ⛔ 재는 쪽도 틀린다. **단정하기 전에 실물을 본다.**
 *
 * 갈라야 할 두 가지:
 *   ⓐ 원문 병기   「Tenure (근속연수)」 — 출처를 밝히는 것이라 **정당하다**
 *   ⓑ 안 옮긴 값   표 칸에 「매도만 가능」 — 영어 독자가 **못 읽는다**. 진짜 빨강
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

const 볼것 = [
  '/api',
  '/article/korea-fractional-shares-broker-lottery',
  '/article/korea-headcount-disclosure-has-no-total-row',
  '/article/korea-tenure-tracks-pay',
  '/data/broker-candour',
];

for (const p of 볼것) {
  const h = await 받기(p);
  const 글 = h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
  console.log(`\n━━ ${p}`);
  const 본것 = new Set();
  for (const m of 글.matchAll(/[가-힣][가-힣\s]{0,20}/g)) {
    const 낱 = m[0].trim();
    if (본것.has(낱)) continue;
    본것.add(낱);
    /* 앞뒤 40자를 같이 보여 준다 — 괄호 안 병기인지, 칸 값인지 여기서 갈린다 */
    const i = 글.indexOf(낱);
    console.log(`   …${글.slice(Math.max(0, i - 45), i + 낱.length + 25).trim()}…`);
    if (본것.size >= 4) break;
  }
}
