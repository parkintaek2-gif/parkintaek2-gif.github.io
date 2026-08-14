/**
 * **6번에게 댄 자를 나에게 그대로 댄다.**
 *
 * ⭐ 사장님 교차검증 지시의 뜻은 「남을 잡아라」가 아니다.
 *   ⛔ 남을 잰 자를 나에게 안 대면 그건 검사가 아니라 **고발**이다.
 *   오늘 6번에서 빨강 셋을 냈다. 그 셋을 K Culture Wire 에 똑같이 댄다:
 *     ① 수를 내는 지면에 **시각**이 붙는가
 *     ② 표 칸에 손님이 못 읽는 **한국어**가 남았는가 (영문 매체라 더 무겁다)
 *     ③ 첫 화면이 거는 지면이 **사이트맵**에 다 있는가
 */
import https from 'node:https';

const 호스트 = 'www.kculturewire.com';
function 받기(길) {
  return new Promise((resolve) => {
    let 끝 = false;
    const 한번만 = (v) => { if (!끝) { 끝 = true; clearTimeout(t); resolve(v); } };
    const t = setTimeout(() => { try { req.destroy(); } catch { /* */ } 한번만({ code: 0, body: '' }); }, 25000);
    const req = https.request({ host: 호스트, path: 길,
      headers: { Host: 호스트, 'User-Agent': 'KCultureWire-selfcheck/seat5' } }, (res) => {
      const 조각 = []; res.on('data', (c) => 조각.push(c));
      res.on('end', () => 한번만({ code: res.statusCode, body: Buffer.concat(조각).toString('utf8') }));
    });
    req.on('error', () => 한번만({ code: 0, body: '' }));
    req.end();
  });
}

/* 사이트맵에서 **내 지면만** 고른다 — 한 저장소에 여섯 사이트가 산다 */
const sm = await 받기('/sitemap.xml');
const 실린것 = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1]).filter((u) => u.includes(호스트))
  .map((u) => u.replace(/^https?:\/\/[^/]+/, '') || '/');
console.log(`K Culture Wire 를 **6번에게 댄 자로** 잰다 — 사이트맵 ${실린것.length}장\n`);

const 빨강 = [];
let 수있는지면 = 0;

for (const p of 실린것) {
  const r = await 받기(p);
  if (r.code !== 200) { 빨강.push([p, `사이트맵에 실렸는데 ${r.code}`]); continue; }
  const 글 = r.body.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');

  /* ① 수를 내면 시각이 있어야 한다 — 6번에 댄 것과 **똑같이 넓게** 찾는다 */
  if (/\d[\d,]*\.\d/.test(글)) {
    수있는지면 += 1;
    /* 🔴 처음엔 하이픈 날짜만 찾아 425건이 나왔다. 내 사이트는 **영문 매체**라
     *   「14 August 2026」 으로 적는다. ⛔ 없는 게 아니라 **내 자가 짧았다.** */
    const 시각꼴 = /(as of|updated|last update|refresh|20\d\d-\d\d(-\d\d)?|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d\d)/i;
    if (!시각꼴.test(글)) 빨강.push([p, '수는 있는데 **시각이 없다**']);
  }
  /* ② 영문 매체에 한국어가 남았나 — 괄호 병기는 정당하니 갈라 센다 */
  const 한 = [...글.matchAll(/[가-힣][가-힣\s]{0,15}/g)].map((m) => m[0].trim()).filter(Boolean);
  if (한.length) {
    /* 🔴 처음엔 **뒤만** 봤다. 그런데 바른 꼴은 「Korea Creative Content Agency (한국콘텐츠진흥원)」 —
     *   영문이 **앞**이고 원문이 괄호 안이다. 앞을 안 봐서 정당한 병기를 빨강으로 셀 뻔했다.
     *   ⛔ 자가 뭘 못 보는지를 먼저 묻는다. */
    const 맨몸 = 한.filter((낱) => {
      const i = 글.indexOf(낱);
      const 뒤 = 글.slice(i + 낱.length, i + 낱.length + 14);
      const 앞 = 글.slice(Math.max(0, i - 40), i);
      if (/^\s*[)」]?\s*[(–—-]\s*[A-Za-z]/.test(뒤)) return false;       // 원문 뒤에 영문 뜻
      if (/[A-Za-z][A-Za-z .,'—-]{3,}\s*[(「]\s*$/.test(앞)) return false; // 영문 뒤 괄호 안 원문
      return true;
    });
    if (맨몸.length) 빨강.push([p, `한국어가 **뜻 없이** ${맨몸.length}개 — ${맨몸.slice(0, 3).join(' / ')}`]);
  }
}

/* ③ 첫 화면이 거는데 사이트맵에 없는 것 — 6번의 /privacy 자리 */
const 첫 = await 받기('/');
const 안쪽 = [...new Set([...첫.body.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))]
  .filter((p) => p !== '/' && !/\.(png|jpg|svg|ico|xml|txt|css|js|mp4)$/.test(p));
const 실린집 = new Set(실린것);
for (const p of 안쪽.filter((p) => !실린집.has(p))) {
  const r = await 받기(p);
  if (r.code === 200) 빨강.push([p, '살아 있는데 **사이트맵에 없다**']);
}

console.log(`   지면 ${실린것.length}장 · 수를 낸 지면 ${수있는지면}장 · 첫 화면이 거는 지면 ${안쪽.length}장\n`);
if (!빨강.length) console.log('✅ 빨강 0건 — 6번에 댄 자로 나를 재도 걸리는 것이 없다');
else { console.log(`🔴 빨강 ${빨강.length}건 — **내 것이다. 내가 고친다**`); for (const [p, 왜] of 빨강) console.log(`   ${p.padEnd(34)} ${왜}`); }
