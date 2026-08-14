/**
 * 내 배포 대기 셋이 **정말 대기 중인가**를 라이브에서 잰다.
 * ⭐ 「배포 대기」라고 적어 둔 말을 믿지 않는다. 손님이 받는 것을 본다.
 *   오늘 6번을 잴 때 쓴 자를 나에게 그대로 댄다 — 남에게 댄 자를 나에게 안 대면 그건 검사가 아니다.
 */
import https from 'node:https';

const 호스트 = 'www.kculturewire.com';
function 받기(길, 머리만 = false) {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만({ code: 0, body: '' }); }, 25000);
    const req = https.request({ host: 호스트, path: 길, method: 머리만 ? 'HEAD' : 'GET',
      headers: { Host: 호스트, 'User-Agent': 'KCultureWire-selfcheck/seat5' } }, (res) => {
      const 조각 = []; res.on('data', (c) => 조각.push(c));
      res.on('end', () => 한번만({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8') }));
    });
    req.on('error', () => 한번만({ code: 0, body: '' }));
    req.end();
  });
}

const 잴것 = [
  /* 🔴 처음에 `/article/…` 로 짚었다가 404 를 보고 「배포가 안 됐다」로 셀 뻔했다.
   *   주소가 틀렸을 뿐이었다. ⛔ **404 는 「없다」가 아니라 「내가 잘못 짚었다」일 수 있다.** */
  { 무엇: '87편 기사 지면', 길: '/titles-to-name' },
  { 무엇: '86편 장소 지면', 길: '/places' },
  { 무엇: '85편 퍼짐 지면', 길: '/spread' },
];
console.log('내 것을 라이브에서 잰다 — 「대기 중」이라 적은 말을 안 믿는다\n');
let 빨강 = 0;
for (const x of 잴것) {
  const r = await 받기(x.길);
  const ok = r.code === 200;
  if (!ok) 빨강 += 1;
  console.log(`${ok ? '✅' : '🔴'} ${x.무엇.padEnd(16)} ${x.길.padEnd(38)} ${r.code}`);
}

/* 카드뉴스 25장이 정말 서 있나 — 오늘 「만든 값이 0」을 겪은 자리다 */
console.log('\n카드뉴스 25장 — 있다고 말한 그림이 정말 200 인가');
for (const 벌 of ['fame', 'manager', 'malaysia', 'places', 'instrument']) {
  const 낱 = [];
  for (let i = 1; i <= 5; i += 1) {
    const r = await 받기(`/cardnews/${벌}/${String(i).padStart(2, '0')}.png`, true);
    낱.push(r.code);
  }
  const 나쁨 = 낱.filter((c) => c !== 200).length;
  if (나쁨) 빨강 += 나쁨;
  console.log(`${나쁨 ? '🔴' : '✅'} ${벌.padEnd(11)} ${낱.join(' ')}`);
}

/* 사이트맵이 그 그림들을 싣고 있나 */
const sm = await 받기('/sitemap.xml');
const 그림줄 = (sm.body.match(/<image:loc>/g) ?? []).length;
const 지면줄 = (sm.body.match(/<url>/g) ?? []).length;
console.log(`\n사이트맵  지면 ${지면줄}장 · 그림 ${그림줄}개  ${그림줄 >= 25 ? '✅' : '🔴 카드뉴스 25개가 안 실렸다'}`);
if (그림줄 < 25) 빨강 += 1;

console.log(`\n${빨강 ? `🔴 빨강 ${빨강}건 — 배포가 정말 남았다` : '✅ 빨강 0건 — 셋 다 이미 라이브다'}`);
