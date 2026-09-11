/**
 * **collect-nafi** — 국회미래연구원 보고서를 받아 아카이브에 쌓는다.
 *
 * ── 🔴 사장님 지시 (2026-09-11) ─────────────────────────────────────
 *   「국회미래연구원 자료에서 우리가 쓸만한 게 있나 봐라」
 *   「**특히 백년지도에는 유익하겠다**」
 *   「서울마켓츠에도 유용한 자료가 있어 보인다. **매일 생산하는 건 아니지만**」
 *   「**국회연구원 삶의 질 자료를 꼭 서비스해라**...백년지도에서 중요한 자료가 될 수 잇다」
 *   「국회도 세금으로 운영되는 조직이야. **자료는 공개가 원칙이야**」
 *   「수집한 데이터는 갖고만 있지말고 **꼭 페이지를 만들거나 콘텐트를 만들거나
 *    가공데이터를 만들거나** 하라고 전세션에 지시해라」
 *
 * ── ⛔ 이 자를 만들며 막힌 곳 넷 — 다음 자리가 같은 벽에 안 부딪히게 적는다 ──
 *   ① 목록이 **자바스크립트로 그려진다.** curl 로 받으면 0건이 나온다.
 *      ⛔ 그걸 보고 「자료가 없다」로 적을 뻔했다. 헤드리스로 «그려서» 읽어야 한다
 *   ② 「삶의질 데이터센터」는 nafi.fgi.agency:8282 인데 **호스트 이름이 안 풀린다**(DNS).
 *      죽은 주소다. ⛔ 「자료가 없다」가 아니라 「그 문이 닫혔다」로 적는다
 *   ③ 「다운로드」 단추는 `POST /fileDownload.do` 를 부르는데 그대로는 안 받아진다
 *   ④ 🔴 `pdfStreaming.do` 를 «바로» 부르면 언제나 이렇게 온다 —
 *        `<script>alert('해당 파일이 존재하지 않습니다.');history.back();</script>`  (85바이트)
 *      **파일이 없는 게 아니다.** 먼저 `viewer.do` 를 «열어야» 그 세션에 파일이 붙는다.
 *      나는 이 85바이트를 보고 여섯 편 내리 「파일 없다」로 적었다. 틀렸다.
 *      ⇒ 순서가 답이다: 본문 열기 → viewer.do 열기 → 그때 스트리밍이 내려온다
 *
 * ── 어떻게 받나 ─────────────────────────────────────────────────────
 *   본문(act=detail) 의 「문서뷰어」 단추 onclick 에 파일 이름이 들어 있다 —
 *     window.open('/home/kor/pdf/viewer.do?downname=<이름>.pdf&filepath=<YYYYMM>')
 *   그 viewer.do 를 열면 pdf.js 가 `/pdfStreaming.do?downname=…&filepath=…` 를 부르고,
 *   그 응답을 가로채면 진짜 PDF 가 나온다(실측 6.72MB · 590쪽).
 *
 * ── ⚠ 라이선스 ──────────────────────────────────────────────────────
 *   사이트에 **공공누리 저작물 마크**가 붙어 있고 제1~4유형 약관이 걸려 있다.
 *   정책 원문: 「자유이용이 가능한 자료는 공공누리를 **부착하여 개방**하고 있으므로
 *   공공누리 표시가 부착된 저작물인지를 **확인한 이후에** 이용하시기 바랍니다」
 *   ⚠ 우리는 광고를 싣는 매체라 «상업적 이용»이다 — 제2유형(상업이용 금지)이 붙은
 *     저작물은 지면에 못 낸다. 저작물마다 유형을 보고 쓴다.
 *   ✅ 출처표시 꼴도 사이트가 정해 두었다 —
 *     「본 저작물은 국회미래연구원에서 ○○○○년 작성하여 공공누리 제○유형으로 개방한
 *      '○○○'을 이용하였으며, 해당 저작물은 국회미래연구원 누리집에서 무료로 받으실 수 있습니다」
 *
 * ── 쓰는 법 ─────────────────────────────────────────────────────────
 *   node scripts/collect-nafi.mjs --찾을말 "행복조사" --몇개 3 --적는다
 *   node scripts/collect-nafi.mjs --자가시험
 *
 * ⛔ 매일 도는 자가 아니다. 사장님이 「매일 생산하는 건 아니지만」이라 하셨다.
 *   소급이 안 되는 아카이빙 목록에 넣지 않는다 — 주 1회 훑는 자리다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export const 받을곳 = 'archive/raw/nafi';
export const 목록주소 = 'https://www.nafi.re.kr/home/kor/board.do?menuPos=12';

/* ── 잴 거리 ───────────────────────────────────────────────────────── */

/** 「문서뷰어」 단추의 onclick 에서 파일 이름과 폴더를 뽑는다 */
export function 뷰어값뽑기(onclick) {
  const m = /downname=([^&'"]+)&filepath=(\d+)/.exec(String(onclick ?? ''));
  return m ? { 이름: m[1], 달: m[2] } : null;
}

/**
 * 응답이 진짜 파일인가.
 * 🔴 85바이트짜리 alert 를 「파일 없음」으로 읽으면 안 된다 — 그건 «순서가 틀린 것»이다.
 *   그래서 작은 응답은 「없다」가 아니라 «다시 해 봐야 하는 것»으로 돌려준다.
 */
export function 받은것판정(크기, 첫글자) {
  if (!Number.isFinite(크기) || 크기 <= 0) return '못받음';
  if (크기 < 50000) {
    if (/alert|<script|<html/i.test(String(첫글자 ?? ''))) return '뷰어를안열었다';
    return '너무작다';
  }
  return '받음';
}

/** 파일 이름을 윈도에서 쓸 수 있게 다듬는다 */
export function 이름다듬기(제목) {
  return String(제목 ?? '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70) || '이름없음';
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */

function 자가시험() {
  let 통과 = 0; const 깨짐 = [];
  const 잰다 = (이름, 본값, 바람) => {
    if (JSON.stringify(본값) === JSON.stringify(바람)) 통과++;
    else 깨짐.push(`${이름} — 나온 것 ${JSON.stringify(본값)} · 바란 것 ${JSON.stringify(바람)}`);
  };

  잰다('뷰어값뽑기 — 실제 onclick',
    뷰어값뽑기("window.open('/home/kor/pdf/viewer.do?downname=VGBkQLELgPwvZIDcWxpw.pdf&filepath=202203')"),
    { 이름: 'VGBkQLELgPwvZIDcWxpw.pdf', 달: '202203' });
  잰다('뷰어값뽑기 — 없으면 null', 뷰어값뽑기('window.open("/other")'), null);
  잰다('뷰어값뽑기 — 빈 것', 뷰어값뽑기(null), null);
  잰다('뷰어값뽑기 — 큰따옴표도 받는다',
    뷰어값뽑기('window.open("/v.do?downname=a.pdf&filepath=202601")'), { 이름: 'a.pdf', 달: '202601' });

  /* 🔴 내가 여섯 편 내리 틀린 자리 */
  잰다('받은것판정 — 85바이트 alert 는 «없음»이 아니다',
    받은것판정(85, "<script>alert('해당 파일이 존재하지 않습니다.');history.back();</script>"), '뷰어를안열었다');
  잰다('받은것판정 — 진짜 파일', 받은것판정(6_700_000, '%PDF-1.6'), '받음');
  잰다('받은것판정 — 0 바이트', 받은것판정(0, ''), '못받음');
  잰다('받은것판정 — 작지만 alert 가 아니면 «너무작다»', 받은것판정(300, '%PDF'), '너무작다');
  잰다('받은것판정 — 숫자가 아니면 못받음', 받은것판정(null, ''), '못받음');

  잰다('이름다듬기 — 못 쓰는 글자를 바꾼다', 이름다듬기('(21-23) 2021년/행복조사*보고서'), '(21-23) 2021년_행복조사_보고서');
  잰다('이름다듬기 — 빈 것', 이름다듬기(''), '이름없음');
  잰다('이름다듬기 — 길면 자른다', 이름다듬기('가'.repeat(120)).length, 70);

  console.log(`■ 자가시험 ${통과 + 깨짐.length}가지 — 통과 ${통과} · 깨짐 ${깨짐.length}`);
  for (const d of 깨짐) console.log('   🔴 ' + d);
  return 깨짐.length === 0;
}

/* ── 몸통 ──────────────────────────────────────────────────────────── */

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

const 고르기 = (이름, 기본) => {
  const i = 인자.indexOf(이름);
  return i >= 0 && 인자[i + 1] ? 인자[i + 1] : 기본;
};
const 찾을말 = 고르기('--찾을말', '행복조사');
const 몇개 = Number(고르기('--몇개', '3'));
const 적나 = 인자.includes('--적는다');

const require2 = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require2('puppeteer-core');
const 크롬 = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));
if (!크롬) { console.log('🔴 크롬을 못 찾았다'); process.exit(1); }

console.log(`■ 국회미래연구원 — 「${찾을말}」 로 찾아 ${몇개}편까지 받는다`);
console.log('⚠ 목록이 자바스크립트로 그려져 «렌더해서» 읽는다. curl 로는 0건이 나온다');
if (!적나) console.log('⬜ 아직 안 적는다 — 적으려면 --적는다');
console.log('');

const b = await puppeteer.launch({ executablePath: 크롬, headless: 'new', args: ['--no-sandbox'] });
const page = await b.newPage();
let 받은 = 0; const 못받은 = [];
try {
  await page.goto(목록주소, { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate((q) => {
    const e = [...document.querySelectorAll('input')].find((x) => x.offsetParent !== null && /search|keyword/i.test(x.name + x.id));
    if (e) { e.focus(); e.value = q; e.dispatchEvent(new Event('input', { bubbles: true })); }
  }, 찾을말);
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 4500));

  const 글들 = await page.evaluate(() => [...document.querySelectorAll('a')]
    .filter((a) => /act=detail/.test(a.getAttribute('href') ?? '') && a.innerText.trim().length > 10)
    .map((a) => ({ 제목: a.innerText.replace(/\s+/g, ' ').trim(), 길: a.href }))
    .filter((x, i, arr) => arr.findIndex((y) => y.길 === x.길) === i));
  console.log(`목록에서 찾은 글 ${글들.length}편 — 앞에서부터 ${몇개}편을 본다`);

  if (적나) fs.mkdirSync(받을곳, { recursive: true });

  for (const g of 글들.slice(0, 몇개)) {
    await page.goto(g.길, { waitUntil: 'networkidle2', timeout: 45000 });
    const onclick = await page.evaluate(() => {
      const 것 = [...document.querySelectorAll('a,button')].find((x) => /문서뷰어/.test(x.innerText));
      return 것 ? String(것.getAttribute('onclick') || '') : '';
    });
    const 값 = 뷰어값뽑기(onclick);
    if (!값) { console.log('   ⬜', g.제목.slice(0, 50), '— 붙은 파일이 없는 글이다(소식·행사 따위)'); continue; }

    /* 🔴 여기가 핵심이다 — viewer.do 를 «열어야» 스트리밍이 내려온다 */
    let 받음 = null;
    const 듣기 = async (r) => {
      if (!/pdfStreaming/i.test(r.url())) return;
      try { 받음 = await r.buffer(); } catch { /* 못 잡았다 */ }
    };
    page.on('response', 듣기);
    await page.goto(`https://www.nafi.re.kr/home/kor/pdf/viewer.do?downname=${값.이름}&filepath=${값.달}`,
      { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 7000));
    page.off('response', 듣기);

    const 판정 = 받은것판정(받음?.length ?? 0, 받음?.slice(0, 80).toString('utf8'));
    if (판정 === '받음') {
      const 이름 = 이름다듬기(g.제목) + '.pdf';
      if (적나) fs.writeFileSync(path.join(받을곳, 이름), 받음);
      console.log(`   ✅ ${(받음.length / 1024 / 1024).toFixed(1)}MB  ${이름.slice(0, 58)}`);
      받은++;
    } else {
      못받은.push({ 제목: g.제목.slice(0, 50), 판정 });
      console.log(`   🔴 ${판정}  ${g.제목.slice(0, 50)}`);
    }
  }
} finally {
  await page.close().catch(() => {});
  await b.close().catch(() => {});
}

console.log('');
console.log(`■ 받은 편 ${받은} · 못 받은 편 ${못받은.length}`);
if (못받은.some((x) => x.판정 === '뷰어를안열었다')) {
  console.log('   ⚠ 「뷰어를안열었다」가 나오면 그 편은 «파일이 없는 것이 아니다».');
  console.log('     viewer.do 가 늦게 뜬 것일 수 있으니 기다리는 시간을 늘려 다시 돌린다.');
}
if (받은 && 적나) {
  console.log('');
  console.log('🔴 **여기서 멈추지 않는다** — 사장님 상시 지시다.');
  console.log('   「수집한 데이터는 갖고만 있지말고 꼭 페이지를 만들거나 콘텐트를 만들거나');
  console.log('    가공데이터를 만들거나 하라」');
  console.log('   ⇒ 받은 보고서에서 «표와 수»를 뽑아 지면으로 낸다. 받은 것으로 끝나면 한 일이 아니다.');
}
process.exit(0);
