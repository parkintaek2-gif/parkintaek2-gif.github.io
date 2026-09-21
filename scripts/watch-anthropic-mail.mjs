/* admin 편지함에 «Anthropic 지원팀» 새 답장이 왔는지 «내가» 잰다.
 *
 * [왜 이 자가 있나 — 2026-09-21]
 * 사장님이 「메일을 계속 주시해라 … 알아서 좀 해라」고 하셨다. 그때까지는 사장님이
 * 「메일 왔다」고 알려 주셔야 내가 열어 봤다. 그것이 사장님 손을 빌리는 것이다.
 *
 * ⚠ Gmail API 는 send 권한만 있고 readonly 가 없다 — 그래서 «화면»으로 읽는다.
 * ⚠ u1@klifedesign.net 앞으로 온 메일도 admin@klifedesign.net(u/1) 으로 들어온다
 *   (사장님 2026-09-21: 「u1메일은 admin으로 와」).
 * ⛔ 스레드 «제목»으로 새 답장을 판정하지 않는다 — 내가 보낸 메일이 스레드 제목이라
 *   답장이 와도 제목은 내 것 그대로다. «보낸이»와 «미리보기»로 가른다.
 * ⛔ b.close() 금지 — 사장님 창이 닫힌다. disconnect() 만. 언제나 새 탭.
 * ⛔ 손님 이메일 주소를 적지 않는다. 여기서 보는 것은 우리 회사 편지함뿐이다.
 *
 * 쓰는 법
 *   node scripts/watch-anthropic-mail.mjs              새 답장이 있나 (없으면 조용하다)
 *   node scripts/watch-anthropic-mail.mjs --본문        가장 새 답장의 본문까지 펴 본다
 *   node scripts/watch-anthropic-mail.mjs --체크리스트   매시 점검이 쓰는 한 줄
 *   node scripts/watch-anthropic-mail.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const 여기 = path.dirname(url.fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
export const 본자국길 = path.join(뿌리, 'docs', '고정업무-마커', 'anthropic-메일-본자국.json');

/* ── 판정하는 부분만 따로 뺀다. 이래야 브라우저 없이 시험할 수 있다 ── */

/** 지원팀이 «보낸» 줄인가 — 우리가 보낸 줄과 자동 알림을 가른다
 *
 * 🔴 [2026-09-21 13:5x] 이 자가 «실제로 온 답장을 놓쳤다». 사장님이 「메일 왔다」고
 *   알려 주셔야 알았다 — 이 자를 만든 목적이 바로 그것을 없애는 것이었는데.
 *   까닭: 보낸이를 `.yW span` 의 **email 속성**으로 먼저 읽었다. 주고받은 스레드는
 *   그 자리에 «우리 주소»가 박혀 있어서 「Anthropic 이 아니다」로 걸러졌다.
 *   화면에 보이는 글자는 「나, Fin」인데 속성은 우리 주소였던 것이다.
 *   ⇒ 이제 «보이는 글자»와 «속성»을 둘 다 이어 붙여 본다. 하나만 보면 또 놓친다.
 */
export function 지원팀줄인가(줄) {
  /* 보이는 글자 + 속성을 합쳐서 본다 */
  const 보낸이 = [줄.보낸이, 줄.보낸이글자, 줄.보낸이속성].filter(Boolean).join(' ');
  const 다듬 = 보낸이.trim();
  if (!다듬) return false;
  /* 「나」 하나뿐이면 내가 보낸 것이다. 「나, Fin」처럼 상대가 «끼어 있으면» 답장이 온 것이다 */
  if (/^(나|me)$/i.test(다듬)) return false;
  if (!/Anthropic|Fin/i.test(보낸이)) return false;
  const 제목 = String(줄.제목 || '');
  /* 영수증·결제실패·보안링크는 «답장»이 아니다. 사람이 쓴 답을 찾는 것이다 */
  if (/receipt|영수증|payment .*unsuccessful|보안 링크|시트가 업그레이드|Your receipt/i.test(제목)) return false;
  return true;
}

/** 지난번에 본 것보다 새 것만 남긴다 */
export function 새것만(줄들, 본자국) {
  const 본것 = new Set((본자국 && 본자국.본것) || []);
  return 줄들.filter((r) => 지원팀줄인가(r)).filter((r) => !본것.has(r.열쇠));
}

export function 본자국읽기(길 = 본자국길) {
  try { return JSON.parse(fs.readFileSync(길, 'utf8')); } catch { return { 본것: [], 마지막잰때: null }; }
}
export function 본자국쓰기(본자국, 길 = 본자국길) {
  fs.mkdirSync(path.dirname(길), { recursive: true });
  fs.writeFileSync(길, JSON.stringify(본자국, null, 2) + '\n', 'utf8');
}

/* ⚠ 시각은 한국시간(KST). toISOString() 금지 */
export function 지금글(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ───────────────────────── 화면에서 읽어 오는 부분 ───────────────────────── */
async function 편지함훑기({ 본문까지 = false } = {}) {
  const { createRequire } = await import('node:module');
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    await page.setViewport({ width: 1500, height: 1000 });
    /* 🔴 [2026-09-21 14:0x] «검색»이 아니라 «받은편지함»을 본다.
     * 까닭 — 검색 화면이 보여 주는 «때»는 그 검색어에 «일치한 메시지»의 때다.
     * 받은편지함은 «스레드의 가장 새 메시지»의 때를 보여 준다.
     * 13:53 에 답장이 왔는데 검색 화면은 09:53(내가 보낸 것)을 그대로 달고 있었고,
     * 열쇠(때|보낸이|제목)가 안 바뀌어 «본 것»으로 판정돼 답장을 통째로 놓쳤다.
     * ⇒ 새 답장을 재는 자는 반드시 받은편지함을 본다. */
    await page.goto('https://mail.google.com/mail/u/1/#inbox', { waitUntil: 'domcontentloaded', timeout: 60000 });
    for (let i = 0; i < 16; i++) {
      await 잠깐(2500);
      if (await page.evaluate(() => document.querySelectorAll('tr.zA').length > 0)) break;
    }
    const 줄들 = await page.evaluate(() => [...document.querySelectorAll('tr.zA')].slice(0, 15).map((tr) => ({
      /* ⚠ 속성 하나만 믿지 않는다 — 주고받은 스레드는 email 속성에 «우리 주소»가 박힌다.
         화면에 보이는 글자(「나, Fin」)가 답장이 왔는지를 말해 준다. 둘 다 싣는다. */
      보낸이글자: (tr.querySelector('.yW span')?.textContent || '').trim(),
      보낸이속성: (tr.querySelector('.yW span')?.getAttribute('email')) || '',
      보낸이: (tr.querySelector('.yW span')?.textContent || '').trim(),
      제목: (tr.querySelector('.y6 span')?.textContent || '').trim(),
      미리보기: (tr.querySelector('.y2')?.textContent || '').replace(/[\u034f\u200b\u00ad\s]+/g, ' ').trim().slice(0, 160),
      때: (tr.querySelector('.xW span')?.getAttribute('title') || tr.querySelector('.xW span')?.textContent || '').trim(),
      안읽음: tr.className.includes('zE'),
    })).map((r) => ({ ...r, 열쇠: `${r.때}|${r.보낸이}|${r.제목}`.slice(0, 160) })));

    let 본문 = null;
    if (본문까지 && 줄들.length) {
      /* 지원팀이 보낸 «가장 새» 줄을 연다 */
      const 어느것 = 줄들.findIndex((r) => 지원팀줄인가(r));
      if (어느것 >= 0) {
        await page.evaluate((i) => document.querySelectorAll('tr.zA')[i].click(), 어느것);
        for (let i = 0; i < 12; i++) { await 잠깐(2500); if (await page.evaluate(() => document.querySelectorAll('.a3s').length > 0)) break; }
        /* ⭐ 스레드의 «마지막» 덩이가 가장 새 편지다 — 첫 덩이는 내가 보낸 것이다 */
        본문 = await page.evaluate(() => {
          const es = [...document.querySelectorAll('.a3s')];
          return es.length ? es[es.length - 1].innerText.trim() : null;
        });
      }
    }
    return { 줄들, 본문 };
  } finally {
    /* ⚠ 이 자는 되풀이해서 돈다 — 탭을 안 닫으면 사장님 크롬에 탭이 쌓인다.
       읽기만 하는 자라 «내가 연 탭»은 닫아도 된다. ⛔ b.close() 는 여전히 금지다. */
    try { await page.close(); } catch {}
    b.disconnect();
  }
}

/* ───────────────────────── 자가시험 ───────────────────────── */
function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 잰다 = (이름, 실제, 바람) => {
    const 맞나 = JSON.stringify(실제) === JSON.stringify(바람);
    console.log(`${맞나 ? '  ✓' : '  ✗'} ${이름}${맞나 ? '' : `\n      난 것 ${JSON.stringify(실제)}\n      바란 것 ${JSON.stringify(바람)}`}`);
    맞나 ? 통과++ : 깨짐++;
  };

  console.log('── 누가 보낸 줄인가');
  잰다('지원팀이 보낸 것은 센다', 지원팀줄인가({ 보낸이: 'Anthropic, PBC', 제목: 'Re: refund request' }), true);
  잰다('Fin 이 보낸 것도 센다', 지원팀줄인가({ 보낸이: 'Fin', 제목: 'Re: 무엇' }), true);
  잰다('내가 보낸 것은 안 센다', 지원팀줄인가({ 보낸이: '나', 제목: 'Re: refund request' }), false);
  잰다('보낸이가 「나」 하나뿐이면 안 센다', 지원팀줄인가({ 보낸이: '나', 제목: 'x' }), false);
  잰다('남남은 안 센다', 지원팀줄인가({ 보낸이: '구글', 제목: 'Re: refund' }), false);
  잰다('빈 줄은 안 센다', 지원팀줄인가({ 보낸이: '', 제목: 'Re: refund' }), false);

  console.log('── 🔴 실제로 놓쳤던 꼴 (2026-09-21 13:5x)');
  /* 주고받은 스레드는 화면 글자가 「나, Fin」인데 email 속성에는 «우리 주소»가 박힌다.
     속성만 보면 「Anthropic 이 아니다」로 걸러져 답장을 통째로 놓친다. */
  잰다('「나, Fin」은 답장이 온 것이다',
    지원팀줄인가({ 보낸이: '나, Fin', 제목: 'Re: Partial refund request - duplicate Standard seat' }), true);
  잰다('속성에 우리 주소가 박혀 있어도 글자로 잡는다',
    지원팀줄인가({ 보낸이글자: '나, Fin', 보낸이속성: 'u1@klifedesign.net', 제목: 'Re: 무엇' }), true);
  잰다('「나」 혼자면 아직 답이 없는 것이다',
    지원팀줄인가({ 보낸이글자: '나', 보낸이속성: 'u1@klifedesign.net', 제목: 'Re: 무엇' }), false);
  잰다('「나, Fin, 임시보관」 처럼 꼬리가 붙어도 잡는다',
    지원팀줄인가({ 보낸이: '나, Fin, 임시보관', 제목: 'Re: 무엇' }), true);

  console.log('── 답장이 아닌 것은 거른다');
  잰다('영수증은 답장이 아니다', 지원팀줄인가({ 보낸이: 'Anthropic, PBC', 제목: 'Your receipt from Anthropic, PBC #2080' }), false);
  잰다('결제 실패 알림도 아니다', 지원팀줄인가({ 보낸이: 'Anthropic, PBC', 제목: '$1,848.00 payment to Anthropic, PBC was unsuccessful' }), false);
  잰다('보안 링크도 아니다', 지원팀줄인가({ 보낸이: 'Anthropic', 제목: 'Claude.ai의 보안 링크가 도착했습니다' }), false);
  잰다('시트 업그레이드 알림도 아니다', 지원팀줄인가({ 보낸이: 'Anthropic', 제목: '시트가 업그레이드되었습니다' }), false);

  console.log('── 새 것만 고르기');
  const 줄들 = [
    { 보낸이: 'Anthropic, PBC', 제목: 'Re: 하나', 열쇠: 'a' },
    { 보낸이: 'Anthropic, PBC', 제목: 'Re: 둘', 열쇠: 'b' },
    { 보낸이: '나', 제목: 'Re: 셋', 열쇠: 'c' },
  ];
  잰다('본 적 없으면 둘 다 새 것', 새것만(줄들, { 본것: [] }).map((r) => r.열쇠), ['a', 'b']);
  잰다('본 것은 뺀다', 새것만(줄들, { 본것: ['a'] }).map((r) => r.열쇠), ['b']);
  잰다('다 봤으면 없다', 새것만(줄들, { 본것: ['a', 'b'] }).length, 0);
  잰다('본자국이 없어도 돈다', 새것만(줄들, null).map((r) => r.열쇠), ['a', 'b']);

  console.log('── 시각');
  잰다('KST 를 두 자리로 적는다', 지금글(new Date(2026, 8, 21, 8, 5)), '2026-09-21 08:05');

  console.log(`\n${깨짐 ? '🔴' : '✅'} ${통과}/${통과 + 깨짐} 통과`);
  return 깨짐 === 0;
}

/* ───────────────────────── 실행 ───────────────────────── */
const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험') || 인자.includes('--selftest')) {
  process.exit(자가시험() ? 0 : 1);
} else {
  const 체크 = 인자.includes('--체크리스트');
  let 결과;
  try {
    결과 = await 편지함훑기({ 본문까지: 인자.includes('--본문') });
  } catch (e) {
    const 말 = String(e.message).split('\n')[0].slice(0, 90);
    console.log(체크 ? `🔴 ⑧-3 지원팀 답장   못 쟀다 — ${말}` : `🔴 편지함을 못 읽었다 — ${말}\n   크롬 9222 가 떠 있나 확인한다`);
    process.exit(1);
  }
  const 본자국 = 본자국읽기();
  const 새것 = 새것만(결과.줄들, 본자국);

  if (체크) {
    console.log(새것.length
      ? `🔴 ⑧-3 지원팀 답장   새 답장 ${새것.length}건 — ${새것[0].제목.slice(0, 50)}`
      : `✅ ⑧-3 지원팀 답장   새 것 없다 (${지금글()} 잼)`);
  } else {
    console.log(`■ Anthropic 지원팀 답장 — ${지금글()}\n`);
    if (!새것.length) console.log('   새 답장 없다.');
    else {
      for (const r of 새것) {
        console.log(`   ● ${r.때} · ${r.보낸이}\n     제목 ${r.제목}\n     미리 ${r.미리보기}\n`);
      }
      if (결과.본문) console.log('════ 가장 새 답장의 본문 ════\n' + 결과.본문.replace(/\n{3,}/g, '\n\n').slice(0, 3000));
    }
  }

  /* 본 것으로 적어 둔다 — 다음에는 «새 것»만 뜬다 */
  const 새본것 = [...new Set([...(본자국.본것 || []), ...결과.줄들.filter(지원팀줄인가).map((r) => r.열쇠)])].slice(-80);
  본자국쓰기({ 본것: 새본것, 마지막잰때: 지금글() });
  process.exit(새것.length ? 1 : 0);
}
