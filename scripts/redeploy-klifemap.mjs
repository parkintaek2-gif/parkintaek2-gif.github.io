#!/usr/bin/env node
/**
 * redeploy-klifemap.mjs — **KLifeMap 을 Cloudtype «대시보드»로 재배포한다.**
 * (5번, 2026-09-23)
 *
 * ── 🔴 왜 CLI 를 안 쓰나 ──────────────────────────────────────────────
 * ⛔ **klifemap 스테이지에 `ctype apply` 를 치지 않는다.** 콘솔 환경변수가 통째로 지워진다.
 *   2026-09-11 에 실제로 그랬다 — 구글·네이버 로그인 단추가 사라지고 `/api/health` 가
 *   degraded 로 떨어졌다. 되살리는 데 사장님 손(R2 열쇠)이 필요했다.
 * ⇒ 그래서 배포는 «대시보드»에서만 한다. 이 자는 그 손놀림을 대신할 뿐이다.
 *
 * ── ⚠ 두 번 데인 자리 ────────────────────────────────────────────────
 * ⚠ 「재배포」 단추를 누르면 **Cancel / OK 확인 창**이 뜬다. 그 OK 까지 눌러야 돈다.
 *   단추만 누르고 「눌렀다」고 세면 배포가 «조용히» 안 된다.
 * ⚠ 배포는 손님 로그인을 날린다 — DB 가 컨테이너 안에 있고 R2 복제가 10분 간격이라
 *   직전 10분 안의 로그인이 사라진다. **지시 하나마다 배포하지 말고 모아서 한 번에.**
 * ⛔ b.close() 금지 — 사장님 창이 통째로 닫힌다. disconnect() 만. 언제나 새 탭.
 *
 * 쓰는 법
 *   node scripts/redeploy-klifemap.mjs --재본다     화면만 보고 «안 누른다»
 *   node scripts/redeploy-klifemap.mjs --누른다     실제로 재배포한다
 */
import { createRequire } from 'node:module';

const 누를까 = process.argv.includes('--누른다');
const 주소 = 'https://app.cloudtype.io/@parkintaek2/klifemap';
const 찍는곳 = process.env.SCRATCH || '.';

if (!누를까 && !process.argv.includes('--재본다')) {
  console.log('⛔ --재본다 나 --누른다 를 붙인다. 맨몸으로는 아무것도 하지 않는다.');
  process.exit(1);
}

const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');
const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await b.newPage();
try {
  await page.setViewport({ width: 1500, height: 1000 });
  await page.goto(주소, { waitUntil: 'networkidle2', timeout: 120000 });
  await 잠깐(6000);

  /* ⚠ 서비스 카드가 뜰 때까지 기다린다 — 바로 누르면 아직 없는 단추를 찾는다 */
  const 있나 = await page.evaluate(() => document.body.innerText.includes('klifemap-app'));
  console.log(있나 ? '✅ klifemap-app 카드가 보인다' : '⬜ 카드를 아직 못 찾았다');

  /* 🔴 「재배포」는 목록 화면에 «없다». 서비스 카드를 «열어야» 나온다 —
     2026-09-23 에 목록에서 찾다가 「단추 1개 · 재배포 없다」로 헛짚었다. */
  const 열었나 = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a, div, span, h3, p')]
      .find((e) => (e.textContent || '').trim() === 'klifemap-app');
    if (!a) return false;
    a.click();
    return true;
  });
  console.log(열었나 ? '   ✔ klifemap-app 카드를 열었다' : '   ⬜ 카드를 못 눌렀다');
  await 잠깐(5000);

  /* 🔴 「재배포」는 «배포 내역»의 맨 윗줄 오른쪽 «⋮» 메뉴 안에 있다.
     화면 어디에도 그냥 떠 있지 않다 — 2026-09-23 에 두 번 헛짚고 알았다. */
  await page.evaluate(() => {
    const 줄 = document.querySelector('a[href*="/main/"], [class*="row"], li');
    void 줄;
    /* 맨 위 배포 줄의 점 세 개 — aria-label 이나 svg 를 품은 단추 가운데 맨 처음 것 */
    const 것 = [...document.querySelectorAll('button')]
      .filter((e) => !(e.textContent || '').trim() && e.querySelector('svg'));
    if (것.length) 것[것.length >= 2 ? 1 : 0].click();
  });
  await 잠깐(1800);

  /* ⚠ 글자가 상태에 따라 바뀐다. 정확히 일치로 찾지 않는다 */
  const 단추들 = await page.evaluate(() => [...document.querySelectorAll('button, [role=menuitem], a')]
    .map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean));
  const 재배포있나 = 단추들.some((t) => /재배포|Redeploy/i.test(t));
  console.log(`   차림표 ${단추들.length}칸 · 「재배포」 ${재배포있나 ? '있다' : '🔴 없다'}`);
  if (!재배포있나) console.log(`   보이는 칸: ${단추들.slice(0, 12).join(' · ')}`);

  await page.screenshot({ path: `${찍는곳}/klifemap-대시보드.png`, fullPage: false });

  if (!누를까) {
    console.log('\n⬜ --재본다 라 여기서 멈춘다. 실제로 돌리려면 --누른다 를 붙인다.');
  } else if (!재배포있나) {
    console.log('\n🔴 「재배포」 단추를 못 찾았다 — 화면을 보고 손으로 한다 (klifemap-대시보드.png).');
    process.exitCode = 1;
  } else {
    /* ⚠ 차림표 칸은 button 이 아닐 수 있다(role=menuitem·li·div). 그래서 넓게 찾고,
       «글자가 딱 재배포인 가장 안쪽 것»을 누른다 — 바깥 상자를 누르면 아무 일도 안 난다.
       2026-09-23 에 button 만 보다가 「null 눌렀다」가 나오고 배포가 안 돌았다. */
    const 눌렀나 = await page.evaluate(() => {
      const 것 = [...document.querySelectorAll('button, [role=menuitem], a, li, div, span')]
        .filter((e) => /^(재배포|Redeploy)$/i.test((e.textContent || '').replace(/\s+/g, ' ').trim()));
      if (!것.length) return null;
      const 안쪽 = 것[것.length - 1];          /* 가장 깊이 있는 것이 실제로 눌리는 칸이다 */
      안쪽.click();
      return (안쪽.textContent || '').trim();
    });
    console.log(`   ✔ 「${눌렀나}」 눌렀다`);
    await 잠깐(2500);

    /* 🔴 여기가 두 번 데인 자리 — 확인 창의 OK 까지 눌러야 «실제로» 돈다 */
    const 확인 = await page.evaluate(() => {
      const 것 = [...document.querySelectorAll('button')]
        .map((e) => ({ e, t: (e.textContent || '').replace(/\s+/g, ' ').trim() }))
        .filter((x) => /^(OK|확인|배포|Deploy)$/i.test(x.t));
      if (!것.length) return null;
      것[것.length - 1].e.click();
      return 것[것.length - 1].t;
    });
    await 잠깐(3000);
    await page.screenshot({ path: `${찍는곳}/klifemap-확인창-누른뒤.png`, fullPage: false });
    if (확인) console.log(`   ✔ 확인 창의 「${확인}」 까지 눌렀다 — 배포가 돈다`);
    else {
      console.log('   🔴 확인 창의 OK 를 못 찾았다. **배포가 안 돌았을 수 있다** —');
      console.log('      klifemap-확인창-누른뒤.png 를 보고 손으로 마저 누른다.');
      process.exitCode = 1;
    }
  }
} finally { try { await page.close(); } catch {} b.disconnect(); }
