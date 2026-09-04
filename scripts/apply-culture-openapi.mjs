import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

// 2번이 신청 대행용으로 확인한 문화공공데이터광장(culture.go.kr) 오픈API 활용신청 자동화.
// 로그인 없이 이름+이메일만으로 되는 신청 전용 — 계정(아이디/비번) 가입이 필요한 곳은 다루지 않는다.
//
// 씀:
//   node scripts/apply-culture-openapi.mjs <id> "<활용목적상세>" "<서비스URL>" "<서비스설명>" [이름] [이메일]
// 예:
//   node scripts/apply-culture-openapi.mjs 408 "성명학 서비스에서 단어 뜻풀이 조회에 사용" "https://klifemap.ai" "KLifeMap 성명학 서비스" 케이라이프디자인 admin@klifedesign.net
//
// ⚠ 재서 확인한 것 (2026-09-04, 2번):
//   - "활용신청" 버튼을 누르면 dialog1_step2 하나만 열린다. 그 안의 "다음" 버튼이 매번
//     onclick=fnApiAplyNext('stepN')으로 바뀐다 — 이 값으로 몇 번째 화면인지 판단한다.
//     텍스트("Step 1/2/3")는 장식일 뿐, 실제 진행은 이 onclick 인자로 확인해야 한다.
//   - 1단계(신청자정보): #inputName · #inputEmail · #C(사업자) 또는 #P0(개인) · #10~#60(연령대,기본값 있음) · #location(소재지,기본값 있음)
//   - 2단계(활용정보): #useCodeDetl(활용목적상세, 10자 이상 필수) · #inputUrl(서비스 URL) · #inputEx(서비스 설명)
//   - 마지막 "다음"(step4)이 실제 제출이다(aplyOpenApi() 호출, POST /data/openapi/applyNew.do).
//     성공하면 "이메일로 서비스키가 발송되었습니다" 메시지가 온다.

const [id, purposeDetail, serviceUrl, serviceDesc,
  name = '케이라이프디자인', email = 'admin@klifedesign.net'] = process.argv.slice(2);

if (!id || !purposeDetail || !serviceUrl || !serviceDesc) {
  console.error('사용법: node scripts/apply-culture-openapi.mjs <id> "<활용목적상세>" "<서비스URL>" "<서비스설명>" [이름] [이메일]');
  process.exit(1);
}

const profileDir = `C:/Users/User/claude-2번-apply-${id}`;

async function clickVisibleNext(page) {
  return page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '다음' && b.offsetParent !== null);
    if (!btn) return 'NOT_FOUND';
    const arg = btn.getAttribute('onclick');
    btn.click();
    return arg;
  });
}

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  userDataDir: profileDir,
  args: ['--no-first-run', '--no-default-browser-check'],
  ignoreDefaultArgs: ['--enable-automation'],
  defaultViewport: { width: 1440, height: 1200 },
});
const page = await browser.newPage();
let result = null;
page.on('dialog', async (d) => { console.log('[알림]', d.message()); await d.accept(); });
page.on('response', async (r) => {
  if (/applyNew\.do/i.test(r.url())) {
    try { result = await r.json(); } catch (e) { result = { error: e.message }; }
  }
});

await page.goto(`https://www.culture.go.kr/data/openapi/openapiView.do?id=${id}`, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));
await page.evaluate(() => document.querySelectorAll('button').forEach(b => { if (b.textContent.trim() === '활용신청') b.click(); }));
await new Promise(r => setTimeout(r, 1200));

await page.evaluate(({ name, email }) => {
  document.getElementById('inputName').value = name;
  document.getElementById('inputEmail').value = email;
  document.getElementById('C').checked = true; // 사업자
}, { name, email });
await new Promise(r => setTimeout(r, 200));

const arg1 = await clickVisibleNext(page);
if (!arg1 || !arg1.includes('fnApiAplyNext')) {
  console.error('1단계 "다음" 버튼을 못 찾았다 — 사이트 구조가 바뀌었을 수 있다.', arg1);
  await browser.close();
  process.exit(1);
}
await new Promise(r => setTimeout(r, 1500));

await page.evaluate(({ purposeDetail, serviceUrl, serviceDesc }) => {
  const setById = (id, val) => { const el = document.getElementById(id); if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); } };
  setById('useCodeDetl', purposeDetail);
  setById('inputUrl', serviceUrl);
  setById('inputEx', serviceDesc);
}, { purposeDetail, serviceUrl, serviceDesc });
await new Promise(r => setTimeout(r, 200));

const arg2 = await clickVisibleNext(page);
await new Promise(r => setTimeout(r, 1500));

console.log('id=' + id, 'step1arg=' + arg1, 'step2arg=' + arg2);
console.log('결과:', JSON.stringify(result));

if (!result || result.status !== 200) {
  console.error('⛔ 신청이 실패했을 수 있다 — 결과를 확인하십시오.');
  await page.screenshot({ path: `C:/Users/User/Documents/GitHub/dataeconomics/archive/raw/culture-portal/apply-${id}-fail.png`, fullPage: true }).catch(() => {});
  await browser.close();
  process.exit(1);
}

console.log('✅ ' + result.message);
await browser.close();
