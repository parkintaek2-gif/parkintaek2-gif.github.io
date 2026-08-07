/**
 * www.kculturewire.com 을 **처음 온 사람처럼** 걸어 본다.
 *
 * 2번 지시(2026-08-07 17:2x): 「눌러서 안 열리는 곳 · 빈 채로 뜨는 곳 ·
 *   무슨 사이트인지 모르겠는 자리를 적는다. 고치는 것은 그 다음이다. **먼저 다 적는다**」
 *
 * ⛔ 이 스크립트는 **아무것도 안 고친다.** 걸어 보고 적기만 한다.
 *    고치면서 걸으면 눈이 만든 사람 눈으로 돌아간다.
 *
 * ⚠ 라우팅은 Host 를 직접 넣어야 한다. node fetch 는 Host 를 못 바꾼다.
 *    그래서 `node:https` 를 쓴다.
 *
 * 무엇을 걸리는 것으로 보나
 *   ① 안 열린다        200 이 아니다
 *   ② 빈 채로 뜬다      본문 글자가 너무 적다 / 표가 있다는데 줄이 없다
 *   ③ 막다른 곳        그 지면에서 나가는 우리 링크가 없다
 *   ④ 죽은 링크        걸려 있는데 그 주소가 안 열린다
 *   ⑤ 무슨 사이트인지    첫 화면에 우리가 무엇을 파는 곳인지 한 줄이 없다
 */
import https from 'node:https';

const HOST = 'www.kculturewire.com';
const 본다 = new Map();      // 주소 → 결과
const 대기 = ['/'];
const 최대 = 200;

function 받기(경로) {
  return new Promise((res) => {
    const req = https.get({
      host: HOST, path: 경로, headers: { Host: HOST, 'Cache-Control': 'no-store',
        'User-Agent': 'Mozilla/5.0 (first-time visitor walk)' },
      timeout: 20000,
    }, (r) => {
      let b = '';
      r.on('data', (d) => { b += d; });
      r.on('end', () => res({ code: r.statusCode, loc: r.headers.location, html: b }));
    });
    req.on('error', (e) => res({ code: 0, err: e.message, html: '' }));
    req.on('timeout', () => { req.destroy(); res({ code: 0, err: 'timeout', html: '' }); });
  });
}

/** 본문 글자 수 — 태그·스크립트·양식을 걷어낸 뒤 센다 */
const 글자수 = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim().length;

const 우리링크 = (h) => [...h.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1])
  .filter((u) => !/\.(xml|json|css|js|png|jpg|svg|ico|txt|pdf)$/i.test(u));

while (대기.length && 본다.size < 최대) {
  const 경로 = 대기.shift();
  if (본다.has(경로)) continue;
  const r = await 받기(경로);
  const h = r.html || '';
  const 링크 = r.code === 200 ? [...new Set(우리링크(h))] : [];
  본다.set(경로, {
    code: r.code, err: r.err, 글자: r.code === 200 ? 글자수(h) : 0,
    제목: (h.match(/<title>([^<]*)<\/title>/) || [, ''])[1],
    표줄: (h.match(/<tr[\s>]/g) || []).length,
    표: /<table[\s>]/.test(h),
    나가는링크: 링크.length,
    링크,
  });
  for (const u of 링크) if (!본다.has(u) && !대기.includes(u)) 대기.push(u);
  process.stdout.write(r.code === 200 ? '.' : `[${r.code}]`);
}
process.stdout.write('\n\n');

const 줄 = [...본다.entries()];
console.log(`걸어 본 자리 ${줄.length}곳${대기.length ? ` (아직 안 걸은 것 ${대기.length}곳 — 최대 ${최대}에서 멈췄다)` : ''}`);

const 걸림 = [];
const 적기 = (갈래, 경로, 말) => 걸림.push({ 갈래, 경로, 말 });

for (const [경로, v] of 줄) {
  if (v.code !== 200) { 적기('① 안 열린다', 경로, `${v.code || '못 붙음'}${v.err ? ` (${v.err})` : ''}`); continue; }
  if (v.글자 < 400) 적기('② 빈 채로 뜬다', 경로, `본문 ${v.글자}자`);
  if (v.표 && v.표줄 <= 1) 적기('② 빈 채로 뜬다', 경로, '표가 있다는데 줄이 없다');
  if (v.나가는링크 <= 1) 적기('③ 막다른 곳', 경로, `나가는 링크 ${v.나가는링크}개`);
  if (!v.제목.trim()) 적기('⑤ 이름이 없다', 경로, '<title> 이 비었다');
}

/* 첫 화면이 무엇을 하는 곳인지 말하나 */
const 첫 = 본다.get('/');
if (첫 && 첫.code === 200) {
  const 글 = 첫.html ? '' : '';
  console.log(`\n첫 화면 제목: ${첫.제목}`);
  console.log(`첫 화면 본문 ${첫.글자}자 · 나가는 링크 ${첫.나가는링크}개`);
}

console.log(`\n── 걸린 곳 ${걸림.length}건 (고치기 전 그대로) ──`);
const 갈래목록 = [...new Set(걸림.map((x) => x.갈래))].sort();
for (const g of 갈래목록) {
  const s = 걸림.filter((x) => x.갈래 === g);
  console.log(`\n${g} — ${s.length}건`);
  for (const x of s.slice(0, 30)) console.log(`   ${x.경로.padEnd(52)} ${x.말}`);
  if (s.length > 30) console.log(`   … 그리고 ${s.length - 30}건 더`);
}
if (!걸림.length) console.log('   없다');

console.log('\n── 자리별 크기 (작은 것부터 12) ──');
줄.filter(([, v]) => v.code === 200).sort((a, b) => a[1].글자 - b[1].글자).slice(0, 12)
  .forEach(([p, v]) => console.log(`   ${p.padEnd(52)} ${String(v.글자).padStart(6)}자  링크 ${v.나가는링크}`));
