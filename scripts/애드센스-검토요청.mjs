/**
 * 애드센스-검토요청.mjs — 「주의 필요」로 막힌 사이트에 **검토 요청을 넣는다.**
 *
 * ── 🔴🔴 오늘 여기서 네 번 막혔다 (2026-10-10 · 5번). 다음 사람은 안 막히게 적는다
 *
 * ① **계정이 셋 붙어 있고 기본이 «옛 계정»이다.**
 *    adsense.google.com 을 그냥 열면 parkintaek2@gmail.com(옛 계정)이 열린다.
 *    그 계정 사이트 목록에는 intellitv.net · wiki-tip.com 둘뿐이라
 *    「우리 네 사이트가 없다」로 읽기 쉽다. **없는 것이 아니라 다른 계정이다.**
 *      parkintaek2@gmail.com   옛 계정 pub-5113515144381167 · /u/0/
 *      admin@klifedesign.net   새 계정 pub-3547185342873229 · /u/1/  ← 우리 네 사이트
 *      jbnews0001@gmail.com    중부매일
 *    ⇒ 오른쪽 위 프로필을 눌러 admin@klifedesign.net 을 고른다. 그러면 주소가 /u/1/ 이 된다.
 *
 * ② ⛔ **주소를 지어내지 않는다.** 내가 .../sites/detail/url=seoulmarkets.com 을
 *    유추해 넣었더니 조용히 홈으로 되돌아왔다. 목록에서 그 줄을 «눌러서» 간다.
 *
 * ③ ⛔ **innerText === '사이트' 로 찾으면 «카드 제목»을 집는다** — 화면에 셋이 있다.
 *    왼쪽 레일(nav) 안에서만 찾는다.
 *
 * ④ ⛔ **element.click() 을 리액트가 무시한다.** 좌표를 재서 «진짜 마우스»로 누른다.
 *
 * ⚠ 검토 요청은 밖으로 나가는 일이다. 「문제를 수정했음」에 체크하는 것이므로
 *   **정말 고친 뒤에** 넣는다. 2026-10-10 에 넣은 근거 —
 *   9/30(마지막 검토) 이후 커밋 1,269건 · 새 지면 26장 · 라이브 주소 7,956장 · ads.txt 200.
 *
 * ⛔ 「눌렀다」를 「됐다」로 읽지 않는다 — 누른 뒤 화면을 다시 찍어서 본다.
 * ⛔ 내가 로그인하지 않는다. 로그인 화면이 나오면 그 자리에서 멈춘다.
 * ⛔ b.close() 금지(사장님 창이 닫힌다). 내가 연 탭만 닫고 disconnect() 한다.
 *
 * 쓰는 법
 *   node scripts/애드센스-검토요청.mjs seoulmarkets.com            마른 연습(단추 안 누름)
 *   node scripts/애드센스-검토요청.mjs seoulmarkets.com --진짜      정말 넣는다
 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const 볼곳 = process.argv[2] || 'seoulmarkets.com';
const 진짜 = process.argv.includes('--진짜');
const 목록 = process.env.ADSENSE_SITES_URL || 'https://adsense.google.com/adsense/u/1/pub-3547185342873229/sites/list';
const 이름 = 볼곳.replace(/\./g, '_');

const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 240000 });
let p = null;
try {
  p = await b.newPage();
  await p.setViewport({ width: 1500, height: 1100 });
  await p.goto(목록, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 7000));

  /* 1) 그 사이트 줄을 눌러 상세를 연다 */
  const 줄 = await p.evaluate((볼곳) => {
    const 것 = [...document.querySelectorAll('a,[role="link"],td,span,div')]
      .find((e) => (e.innerText || '').trim() === 볼곳);
    if (!것) return null;
    것.scrollIntoView({ block: 'center' });
    const r = 것.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, 볼곳);
  if (!줄) { console.log('🔴', 볼곳, '줄을 못 찾았다'); process.exit(1); }
  await p.mouse.click(줄.x, 줄.y);
  await new Promise((r) => setTimeout(r, 8000));

  /* 상세가 정말 열렸나 — 제목에 그 사이트가 있어야 한다 */
  const 열렸나 = await p.evaluate((볼곳) => document.body.innerText.includes('정책 위반') || document.body.innerText.includes(볼곳), 볼곳);
  console.log('■ 상세가 열렸나', 열렸나);

  /* 2) 「문제를 수정했음을 확인합니다」 체크박스 */
  const 체크 = await p.evaluate(() => {
    const 것들 = [...document.querySelectorAll('input[type="checkbox"],[role="checkbox"]')];
    const 것 = 것들.find((e) => e.offsetParent !== null);
    if (!것) return null;
    것.scrollIntoView({ block: 'center' });
    const r = 것.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, 켜졌나: 것.checked === true || 것.getAttribute('aria-checked') === 'true' };
  });
  console.log('■ 체크박스', JSON.stringify(체크));
  if (체크 && !체크.켜졌나) { await p.mouse.click(체크.x, 체크.y); await new Promise((r) => setTimeout(r, 2500)); }

  /* 체크가 정말 켜졌나 — 「눌렀다」를 「됐다」로 읽지 않는다 */
  const 켜짐 = await p.evaluate(() => {
    const 것 = [...document.querySelectorAll('input[type="checkbox"],[role="checkbox"]')].find((e) => e.offsetParent !== null);
    return 것 ? (것.checked === true || 것.getAttribute('aria-checked') === 'true') : null;
  });
  console.log('■ 체크 켜졌나', 켜짐);

  /* 3) 「검토 요청」 단추 */
  const 단추 = await p.evaluate(() => {
    const 것 = [...document.querySelectorAll('button,[role="button"]')]
      .find((e) => (e.innerText || '').trim() === '검토 요청' && e.offsetParent !== null);
    if (!것) return null;
    const r = 것.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, 막혔나: 것.disabled === true || 것.getAttribute('aria-disabled') === 'true' };
  });
  console.log('■ 검토 요청 단추', JSON.stringify(단추));

  await p.screenshot({ path: `tmp/애드센스-${이름}-누르기전.png` });

  if (!진짜) { console.log('⬜ 마른 연습이다 — 단추는 안 눌렀다. 진짜로 넣으려면 --진짜'); process.exit(0); }
  if (!단추) { console.log('🔴 단추를 못 찾았다'); process.exit(1); }
  if (단추.막혔나) { console.log('🔴 단추가 막혀 있다 — 체크가 안 켜진 것이다'); process.exit(1); }

  await p.mouse.click(단추.x, 단추.y);
  console.log('■ 눌렀다 — 이제 «정말 됐는지» 본다');
  await new Promise((r) => setTimeout(r, 10000));

  await p.screenshot({ path: `tmp/애드센스-${이름}-누른뒤.png`, fullPage: true });
  const 글 = await p.evaluate(() => document.body.innerText.replace(/\n{3,}/g, '\n\n'));
  fs.writeFileSync(`tmp/애드센스-${이름}-누른뒤.txt`, 글, 'utf8');
  const 바뀜 = /검토 중|검토를 요청|요청되었|준비 중|검토 요청됨|in review/i.test(글);
  console.log(바뀜 ? '✅ 화면이 「검토 중」 쪽으로 바뀌었다' : '⚠ 바뀐 자국을 못 찾았다 — 그림을 눈으로 본다');
  console.log('──── 누른 뒤 화면 앞 900자 ────');
  console.log(글.slice(0, 900));
} catch (e) {
  console.log('⚠', String(e.message).slice(0, 300));
} finally {
  if (p) { try { await p.close(); } catch {} }
  b.disconnect();
}
