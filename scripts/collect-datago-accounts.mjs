#!/usr/bin/env node
/**
 * collect-datago-accounts.mjs — **공공데이터포털에 우리가 이미 받아 둔 개발계정을 긁어 온다.**
 * (5번 · 총괄 · 2026-09-04)
 *
 * ── 왜 이 자가 생겼나 ────────────────────────────────────────
 * 사장님이 주소를 주셨다(2026-09-04):
 *   「https://www.data.go.kr/iim/api/selectAcountList.do >>>>>여기도 네이버로 로그인하면된다.
 *     parkintaek@naver.com」
 *
 * 우리는 지금 **어느 API 가 이미 승인돼 있는지 모른다.** 그래서 같은 자료를 또 신청하고,
 * 이미 열려 있는 자료를 「없다」고 적는다. 이 목록이 그 물음의 정본이다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **사장님 크롬 창을 건드리지 않는다.** 프로필을 «복사»해서 따로 띄운다.
 *   (2026-09-04 실측 — 사장님 크롬이 22개 프로세스로 떠 있었다. 원본을 열면 잠긴다)
 * ⛔ **비밀번호를 읽지 않는다.** `Login Data` 를 복사하지 않는다 — 세션 쿠키만 가져온다.
 * ⛔ **열쇠 값을 화면에 찍지 않는다.** 아카이브 파일에만 적고, 화면에는 이름과 길이만 낸다.
 *   화면 기록이 로그로 남으면 그것이 유출 경로가 된다.
 * ⛔ **로그인 화면으로 튕기면 「받았다」고 하지 않는다.** 「세션이 안 넘어왔다」로 적는다.
 *   빈 목록을 「신청한 것이 없다」로 읽으면 다시 다 신청하게 된다 — 그것이 제일 나쁘다.
 *
 * 쓰는 법
 *   node scripts/collect-datago-accounts.mjs --selftest
 *   node scripts/collect-datago-accounts.mjs --받는다
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 오늘 = (() => {
  /* ⛔ toISOString 을 쓰지 않는다 — UTC 라 새벽에 하루가 어긋난다. 이 PC 는 이미 KST 다 */
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();
const 낼방 = path.join(ROOT, 'archive', 'raw', 'datago-accounts', 오늘);

export const 목록주소 = 'https://www.data.go.kr/iim/api/selectAcountList.do';

/* ── 판단하는 함수들. 여기만 자가시험한다 ────────────────────── */

/**
 * 로그인 화면으로 튕겼나.
 * ⛔ 「목록이 비었다」와 「로그인이 안 됐다」를 가르는 것이 이 자의 핵이다.
 *   못 가르면 «이미 승인된 자료»를 없다고 적고 또 신청한다.
 */
export function 로그인화면인가(주소, 글) {
  const u = String(주소 ?? '');
  const h = String(글 ?? '');
  if (/auth\.data\.go\.kr|\/sso\/|login/i.test(u)) return true;
  /* 화면 안에 로그인 폼이 있으면 그것도 로그인 화면이다 */
  if (/name=["']?(userId|loginId)["']?/i.test(h)) return true;
  if (/로그인이 필요|세션이 만료|로그인 후 이용/.test(h)) return true;
  return false;
}

/**
 * 목록 표의 한 줄을 가른다.
 *
 * ⚠ 이 포털의 개발계정 표는 칸 이름이 화면 판마다 다르다. 그래서 «칸 위치»로 읽지 않고
 *   내용의 꼴로 읽는다 — 날짜꼴·상태말·자료번호를 각각 알아본다.
 * ⬜ 못 알아본 칸은 버리지 않고 `그밖` 에 남긴다. 0 으로 채우지 않는다.
 */
export function 줄가르기(칸들) {
  const c = (Array.isArray(칸들) ? 칸들 : []).map((x) => String(x ?? '').trim()).filter(Boolean);
  const 것 = { 이름: null, 자료번호: null, 신청일: null, 상태: null, 끝나는날: null, 그밖: [] };
  for (const v of c) {
    if (!것.자료번호 && /^[0-9]{6,10}$/.test(v)) { 것.자료번호 = v; continue; }
    const 날 = v.match(/^(20[0-9]{2})[.\-/]\s?([0-9]{1,2})[.\-/]\s?([0-9]{1,2})/);
    if (날) {
      const 꼴 = `${날[1]}-${String(날[2]).padStart(2, '0')}-${String(날[3]).padStart(2, '0')}`;
      if (!것.신청일) 것.신청일 = 꼴; else if (!것.끝나는날) 것.끝나는날 = 꼴;
      continue;
    }
    if (!것.상태 && /^(승인|신청|반려|중지|정지|심의|대기)/.test(v)) { 것.상태 = v; continue; }
    if (!것.이름 && v.length >= 4) { 것.이름 = v; continue; }
    것.그밖.push(v);
  }
  return 것;
}

/** 이름이 있는 줄만 남긴다. ⛔ 빈 화면에서 항목을 지어내지 않는다 */
export function 쓸만한줄인가(것) {
  return !!(것 && 것.이름 && 것.이름.length >= 4);
}

/**
 * 사장님 크롬 프로필을 «복사»한다 — 로그인된 세션만 따라온다.
 * ⛔ `Login Data`(비밀번호) 를 목록에 넣지 않는다. 넣을 까닭이 없다.
 */
export function 복사할것들() {
  return ['Local State', 'Default/Preferences', 'Default/Local Storage',
    'Default/Cookies', 'Default/Session Storage', 'Default/Network/Cookies'];
}

function 프로필복사(dst) {
  const src = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
  if (!fs.existsSync(src)) return null;
  try {
    if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  } catch {
    return 프로필복사(`${dst}-${process.pid}`);
  }
  fs.mkdirSync(path.join(dst, 'Default'), { recursive: true });
  for (const rel of 복사할것들()) {
    const s = path.join(src, rel); const d = path.join(dst, rel);
    if (!fs.existsSync(s)) continue;
    try { fs.cpSync(s, d, { recursive: true, force: true }); } catch { /* 잠긴 것은 건너뛴다 */ }
  }
  return dst;
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 참 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  참('sso 주소는 로그인 화면', 로그인화면인가('https://auth.data.go.kr/sso/login', ''));
  참('로그인 폼이 있으면 로그인 화면',
    로그인화면인가('https://www.data.go.kr/x', '<input name="userId">'));
  참('안내 문구로도 알아본다',
    로그인화면인가('https://www.data.go.kr/x', '<p>로그인이 필요합니다</p>'));
  참('목록 화면은 로그인 화면이 아니다',
    !로그인화면인가(목록주소, '<table><tr><td>영화진흥위원회_박스오피스</td></tr></table>'));
  참('⭐ 빈 목록을 로그인 화면으로 오판하지 않는다',
    !로그인화면인가(목록주소, '<table><tbody></tbody></table>'));

  const 한줄 = 줄가르기(['1', '영화진흥위원회_영화관 입장권 통합전산망', '15057381',
    '2026.09.04', '승인', '2028.09.04']);
  참('이름을 잡는다', 한줄.이름 === '영화진흥위원회_영화관 입장권 통합전산망');
  참('자료번호를 잡는다', 한줄.자료번호 === '15057381');
  참('신청일을 ISO 로', 한줄.신청일 === '2026-09-04');
  참('끝나는날을 둘째 날짜로', 한줄.끝나는날 === '2028-09-04');
  참('상태를 잡는다', 한줄.상태 === '승인');
  참('한 자리 수는 자료번호가 아니다', !/^1$/.test(String(한줄.자료번호)));
  참('못 알아본 칸을 그밖에 남긴다', 한줄.그밖.includes('1'));

  참('빈 줄은 안 쓴다', !쓸만한줄인가(줄가르기([])));
  참('이름만 있어도 쓴다', 쓸만한줄인가(줄가르기(['국립국어원_우리말샘'])));
  참('짧은 이름은 안 쓴다', !쓸만한줄인가(줄가르기(['abc'])));
  참('한 자리 날짜도 읽는다', 줄가르기(['x', '2026.9.4']).신청일 === '2026-09-04');
  참('빗금 날짜도 읽는다', 줄가르기(['자료 이름', '2026/09/04']).신청일 === '2026-09-04');

  참('⛔ 비밀번호 파일을 복사 목록에 안 넣는다',
    !복사할것들().some((x) => /Login Data|Web Data/i.test(x)));
  참('쿠키는 복사한다', 복사할것들().some((x) => /Cookies/.test(x)));

  console.log(`\n공공데이터포털 개발계정을 긁는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/* ── 실제로 받는다 ────────────────────────────────────────── */
if (process.argv.includes('--받는다')) {
  const 크롬 = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find((p) => fs.existsSync(p));
  if (!크롬) { console.log('🔴 크롬을 못 찾았다'); process.exit(1); }

  const puppeteer = createRequire(path.join(ROOT, '..', 'klifemap', 'package.json'))('puppeteer-core');
  const 프로필 = 프로필복사(path.join(os.tmpdir(), 'datago-accounts-profile'));
  if (!프로필) { console.log('🔴 크롬 프로필을 못 찾았다'); process.exit(1); }
  console.log('✅ 프로필을 복사했다 — 사장님 창은 안 건드린다');

  const 브 = await puppeteer.launch({
    executablePath: 크롬, headless: 'new', userDataDir: 프로필,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1400,1000'],
  });
  try {
    const 쪽 = await 브.newPage();
    await 쪽.setViewport({ width: 1400, height: 1000 });
    await 쪽.goto(목록주소, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((f) => setTimeout(f, 2500));

    const 지금주소 = 쪽.url();
    const 글 = await 쪽.content();
    console.log(`   주소 ${지금주소}`);
    console.log(`   글 ${(글.length / 1024).toFixed(1)}KB`);

    fs.mkdirSync(낼방, { recursive: true });
    fs.writeFileSync(path.join(낼방, 'account-list.html'), 글);
    await 쪽.screenshot({ path: path.join(낼방, 'account-list.png'), fullPage: true });

    if (로그인화면인가(지금주소, 글)) {
      console.log('\n⛔ **로그인 화면으로 튕겼다.** 세션이 안 넘어왔다.');
      console.log('   ⚠ 이것을 「신청한 자료가 없다」로 읽지 않는다 — 못 쟀을 뿐이다.');
      console.log(`   화면 그림을 남겼다 → ${path.relative(ROOT, path.join(낼방, 'account-list.png'))}`);
      await 브.close();
      process.exit(2);
    }

    const 줄들 = await 쪽.evaluate(() => [...document.querySelectorAll('table tr')]
      .map((tr) => [...tr.querySelectorAll('td,th')].map((td) => td.innerText.trim())));
    const 것들 = 줄들.map(줄가르기).filter(쓸만한줄인가);

    fs.writeFileSync(path.join(낼방, 'accounts.json'), JSON.stringify({
      잰때: new Date().toLocaleString('ko-KR'),
      주소: 목록주소,
      표줄수: 줄들.length,
      받은것: 것들.length,
      항목: 것들,
    }, null, 2));

    console.log(`\n✅ 표 ${줄들.length}줄 중 ${것들.length}건을 받았다`);
    const 상태별 = new Map();
    for (const x of 것들) 상태별.set(x.상태 ?? '⬜ 못 읽음', (상태별.get(x.상태 ?? '⬜ 못 읽음') ?? 0) + 1);
    for (const [k, v] of [...상태별].sort((a, b) => b[1] - a[1])) console.log(`   ${String(v).padStart(4)}건  ${k}`);
    for (const x of 것들.slice(0, 30)) {
      console.log(`   ${(x.자료번호 ?? '⬜').padStart(9)}  ${x.상태 ?? '⬜'}  ${x.이름}`);
    }
    if (것들.length > 30) console.log(`   … 그리고 ${것들.length - 30}건 더 (파일에 다 있다)`);
    console.log(`\n→ ${path.relative(ROOT, 낼방)}`);
  } finally {
    await 브.close().catch(() => {});
  }
}
