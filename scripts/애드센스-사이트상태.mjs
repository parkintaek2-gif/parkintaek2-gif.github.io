/* 왼쪽 레일의 「사이트」를 누른다.
   ⛔ 앞서 innerText==='사이트' 로 찾았더니 «카드 제목»을 집었다 — 화면에 셋이 있다.
   ⇒ 왼쪽 레일(nav) 안에서만 찾는다. 그래도 못 찾으면 그림에서 읽은 좌표로 누른다 */
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 180000 });
let p = null;
try {
  p = await b.newPage();
  await p.setViewport({ width: 1500, height: 1100 });
  await p.goto('https://adsense.google.com/', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 6000));

  const 곳 = await p.evaluate(() => {
    const 레일 = document.querySelector('nav, [role="navigation"]');
    const 안 = 레일 ? [...레일.querySelectorAll('a,[role="link"],[role="menuitem"],button,li')] : [];
    const 것 = 안.find((e) => (e.innerText || '').trim() === '사이트');
    if (!것) return null;
    것.scrollIntoView({ block: 'center' });
    const r = 것.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  });

  if (곳) { console.log('■ 레일에서 찾았다', JSON.stringify(곳)); await p.mouse.click(곳.x, 곳.y); }
  else { console.log('■ 레일에서 못 찾아 그림에서 읽은 자리를 누른다 (75, 196)'); await p.mouse.click(75, 196); }
  await new Promise((r) => setTimeout(r, 8000));

  console.log('■ 지금 주소', p.url());
  await p.screenshot({ path: 'tmp/애드센스-사이트2.png', fullPage: true });
  const 글 = await p.evaluate(() => document.body.innerText.replace(/\n{3,}/g, '\n\n'));
  fs.writeFileSync('tmp/애드센스-사이트2.txt', 글, 'utf8');

  const 네곳 = ['seoulmarkets', 'kculturewire', '100yearmap', 'klifemap'];
  console.log('■ 사이트 이름이 보이나 —', 네곳.map((n) => n + (글.includes(n) ? '✅' : '✕')).join(' · '));
  const i = 글.search(/seoulmarkets|가치가 별로 없는/);
  console.log('──── 화면 ────');
  console.log(i > -1 ? 글.slice(Math.max(0, i - 600), i + 2200) : 글.slice(0, 2000));
} catch (e) {
  console.log('⚠', String(e.message).slice(0, 300));
} finally {
  if (p) { try { await p.close(); } catch {} }
  b.disconnect();
}
