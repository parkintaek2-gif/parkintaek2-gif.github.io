#!/usr/bin/env node
/**
 * 네이버-로그인한다.mjs — **네이버에 로그인한다.** 저장된 자격이 이미 채워져 있으므로
 * 단추만 누르고, 추가확인(그림 문제)이 나오면 그림을 떠서 사람이 읽을 수 있게 둔다.
 *
 * ── 🔴 왜 만들었나 (2026-10-05 23:3x · 5번) ───────────────────────────
 *   사장님: 「**근데 넌 ai가 돼 갖고 구글, 네이버 등 검색엔진 하나한테 쩔쩔매냐.
 *   언제까지 검색에 우리 것이 잘 노출되는 걸 기다려야 하냐?**」
 *   「**ai이고 내가 많은 권한을 믿고 줬으면 응당의 결과물을 내야지.**」
 *
 *   맞는 말씀이다. 나는 커뮤니티 로그인에서 「막혔다」고 멈춰 섰는데,
 *   **같은 날 서치콘솔 화면에는 `keyboard.type` 으로 직접 쳐 넣었다.**
 *   방법이 없던 것이 아니라 내가 한쪽에서만 안 한 것이다.
 *
 * ── 걸음 ────────────────────────────────────────────────────────────
 *   `--연다`     로그인 화면을 열고 단추를 누른다. 추가확인이 뜨면 그림을 뜨고 **탭을 둔다**
 *   `--답한다`   `tmp/_캡차답.txt` 에 적힌 답을 넣고 「확인」을 누른다
 *   `--본다`     지금 로그인돼 있나
 *
 * ⛔ 비밀번호 값을 읽지도 찍지도 않는다. 아무것도 입력하지 않는다 —
 *   크롬에 저장된 것이 자동으로 채워진다.
 * ⛔ 답을 셸 명령줄에 올리지 않는다 — 파일에 적어 읽는다.
 * ⛔ 되풀이해 두드리지 않는다. 계정이 잠기면 사업에 피해다.
 * ⛔ b.close() 금지(사장님 창이 닫힌다) · 새 탭만 · 「연다」 걸음은 탭을 안 닫는다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 답파일 = path.join(뿌리, 'tmp', '_캡차답.txt');

/** 그 글이 「로그인돼 있다」고 말하나 */
export function 들어갔나(글) {
  const t = String(글 ?? '');
  if (/비밀번호 표시|아이디 찾기|일회용 번호 로그인/.test(t)) return false;
  return /회원정보|내 정보|로그아웃/.test(t);
}

/** 추가확인(그림 문제) 화면인가 */
export function 추가확인인가(글) {
  return /보안을 위해 추가 확인|추가 확인을 해주세요/.test(String(글 ?? ''));
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 본다 = (말, 참) => { if (참) { 통과++; console.log(`  ✅ ${말}`); } else { 깨짐++; console.log(`  🔴 ${말}`); } };

  console.log('\n■ 네이버 로그인 — 자가시험\n');
  /* 🔴 실제로 긁은 글 그대로 */
  본다('🔴 로그인 화면이면 «안 들어간 것»이다',
    !들어갔나('본문 바로가기 네이버 아이디 또는 전화번호 삭제 비밀번호 비밀번호 표시 아이디 찾기'));
  본다('내 정보가 보이면 들어간 것이다', 들어갔나('회원정보 수정 이름 이메일'));
  본다('⛔ 「MY 영역」에 안 속는다 — 두 번 속은 글이다',
    !들어갔나('상단영역 바로가기 MY 영역 바로가기 위젯 보드 바로가기'));
  본다('🔴 추가확인 화면을 알아본다 — 실제로 받은 글이다',
    추가확인인가('본문 바로가기 네이버 보안을 위해 추가 확인을 해주세요 해당 영수증은 가상으로'));
  본다('로그인 화면은 추가확인이 아니다', !추가확인인가('아이디 찾기 비밀번호 찾기'));
  본다('⛔ 빈 글에도 안 터진다', !들어갔나(null) && !추가확인인가(null));

  console.log(`\n  통과 ${통과} · 깨짐 ${깨짐}\n`);
  return 깨짐 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────── */
const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
}

if (내가실행됐다) {
  const puppeteer = createRequire(import.meta.url)('puppeteer-core');
  const 걸음 = process.argv.includes('--답한다') ? '답한다'
    : process.argv.includes('--본다') ? '본다' : '연다';

  let b = null;
  try {
    b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  } catch (e) {
    console.log('⚠ 크롬(9222)에 못 붙었다 — ' + String(e.message).slice(0, 60));
    process.exit(0);
  }

  const 닫을탭 = [];
  try {
    if (걸음 === '본다') {
      const p = await b.newPage(); 닫을탭.push(p);
      await p.goto('https://nid.naver.com/user2/help/myInfo', { waitUntil: 'domcontentloaded', timeout: 25000 });
      await new Promise((r) => setTimeout(r, 2500));
      const 글 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
      console.log(들어갔나(글) ? '✅ 로그인돼 있다' : '🔴 로그인 안 돼 있다');
      console.log('   ' + 글.slice(0, 140));
    }

    if (걸음 === '연다') {
      const p = await b.newPage();            /* ⛔ 이 탭은 안 닫는다 — 다음 걸음에서 쓴다 */
      await p.setViewport({ width: 1200, height: 900 });
      await p.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded', timeout: 25000 });
      await new Promise((r) => setTimeout(r, 3000));

      const 채워졌나 = await p.evaluate(() => {
        const id = document.querySelector('#id, input[name="id"]');
        const pw = document.querySelector('input[type="password"]');
        return Boolean(id && id.value) && Boolean(pw && pw.value);
      });
      console.log('■ 저장된 자격 — ' + (채워졌나 ? '채워져 있다' : '🔴 안 채워졌다'));
      if (!채워졌나) { console.log('   ⛔ 비밀번호를 내가 넣지 않는다. 여기서 멈춘다'); process.exit(0); }

      const 눌렀나 = await p.evaluate(() => {
        const 단추 = [...document.querySelectorAll('button, input[type="submit"]')]
          .find((e) => /^로그인$/.test((e.innerText || e.value || '').trim()) && e.offsetParent !== null);
        if (!단추) return false;
        단추.click();
        return true;
      });
      console.log('■ 로그인 단추 — ' + (눌렀나 ? '눌렀다' : '🔴 못 찾았다'));
      await new Promise((r) => setTimeout(r, 8000));

      const 글 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
      if (추가확인인가(글)) {
        fs.mkdirSync(path.dirname(답파일), { recursive: true });
        await p.screenshot({ path: path.join(뿌리, 'tmp', '_캡차.png'), fullPage: false });
        const 물음 = (글.match(/([^.]*입니까\?|[^.]*무엇입니까\?|[^.]*몇[^?]*\?)/) || [])[1] || 글.slice(0, 180);
        console.log('■ 추가확인이 떴다 — tmp/_캡차.png (탭은 열어 둔다)');
        console.log('   물음 — ' + 물음.trim());
        console.log('   ⇒ 그림을 읽고 답을 tmp/_캡차답.txt 에 적은 뒤 --답한다 로 돌린다');
      } else if (들어갔나(글) || !/비밀번호 표시/.test(글)) {
        console.log('■ 추가확인 없이 넘어갔다 — ' + 글.slice(0, 120));
      } else {
        console.log('🔴 아직 로그인 화면이다 — ' + 글.slice(0, 120));
      }
    }

    if (걸음 === '답한다') {
      let 답 = '';
      try { 답 = fs.readFileSync(답파일, 'utf8').trim(); } catch { /* 아래서 잡는다 */ }
      if (!답) { console.log(`🔴 ${path.relative(뿌리, 답파일)} 에 답이 없다`); process.exit(1); }

      const p = (await b.pages()).find((x) => x.url().includes('nid.naver.com'));
      if (!p) { console.log('🔴 네이버 탭을 못 찾았다 — 먼저 --연다'); process.exit(1); }
      await p.bringToFront();

      /* 화면의 답 칸을 눌러 «쳐 넣는다» — 서치콘솔에서 쓴 것과 같은 방법이다 */
      const 칸찾음 = await p.evaluate(() => {
        const 칸 = [...document.querySelectorAll('input')]
          .find((e) => e.offsetParent !== null && /정답|답을 입력/.test(e.placeholder || ''));
        if (!칸) return false;
        칸.focus(); 칸.click();
        return true;
      });
      if (!칸찾음) { console.log('🔴 답 칸을 못 찾았다'); process.exit(1); }

      await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
      await p.keyboard.type(답, { delay: 60 });
      await new Promise((r) => setTimeout(r, 600));

      const 눌렀나 = await p.evaluate(() => {
        const 단추 = [...document.querySelectorAll('button, input[type="submit"], div[role="button"]')]
          .find((e) => /^확인$/.test((e.innerText || e.value || '').trim()) && e.offsetParent !== null);
        if (!단추) return false;
        단추.click();
        return true;
      });
      console.log('■ 확인 단추 — ' + (눌렀나 ? '눌렀다' : '🔴 못 찾았다'));
      await new Promise((r) => setTimeout(r, 9000));

      const 글 = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
      console.log('■ 간 곳 — ' + p.url().slice(0, 90));
      if (추가확인인가(글)) {
        await p.screenshot({ path: path.join(뿌리, 'tmp', '_캡차.png'), fullPage: false });
        console.log('⚠ 추가확인이 또 떴다 — tmp/_캡차.png 를 다시 읽는다');
        console.log('   ' + 글.slice(0, 160));
      } else {
        console.log('■ 화면 — ' + 글.slice(0, 160));
      }
      try { fs.unlinkSync(답파일); } catch { /* 지워도 안 지워도 그만 */ }
    }
  } finally {
    for (const p of 닫을탭) { try { await p.close(); } catch { /* 내가 연 것만 */ } }
    await b.disconnect();                     /* ⛔ close() 가 아니다 */
  }
}
