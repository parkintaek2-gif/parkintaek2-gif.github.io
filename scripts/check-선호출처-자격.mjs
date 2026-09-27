#!/usr/bin/env node
/**
 * check-선호출처-자격.mjs
 *   구글 「선호 출처(Preferred Sources)」에 우리 네 도메인이 잡혔는지 날마다 잰다.
 *
 * 🔴 사장님 (2026-09-27)
 *   한국경제 기사의 「구글 검색 선호 출처로 추가」 단추를 보시고 —
 *   「**이게 뭔지 알아보고 도입할 수 있으면 도입하자**」
 *
 * ── 지금까지 한 것 ────────────────────────────────────────────
 *   2026-09-27 실측 — 구글 도구에 넣어 봤다 (대조군 hankyung.com 으로 자를 검산)
 *     100yearmap.com   ✅ 뜬다       klifemap.ai      ✅ 뜬다
 *     seoulmarkets.com 🔴 결과 없음  kculturewire.com 🔴 결과 없음
 *   서치콘솔 속성 꼴은 넷이 같았고(sc-domain) 노출은 오히려 klifemap 이 제일 적었다(8회).
 *   ⇒ 가른 것은 «구글이 그 도메인을 출처로 아는가» 하나였다.
 *
 *   우회로 — Publisher Center 에 세 간행물을 직접 등록했다
 *     Seoul Markets · K Culture Wire · 백년지도
 *   그 과정에서 소유권 확인이 sc-domain 으로는 안 통해, 서치콘솔에 URL 접두 속성
 *   일곱 개를 새로 만들었다(네 사이트 www/비www). 전부 「자동으로 확인됨」.
 *
 * ⬜ 아직 안 끝난 것 — 퍼블리셔 센터 «소유권 확인»
 *   구글 화면이 「나중에 확인할 수 있습니다. 그러나 간행물의 «비즈니스 제품»을
 *   활성화하려면 소유권을 확인해야 합니다」라고 적고 있다. 우리는 그 제품(Reader
 *   Revenue Manager)을 쓰지 않으므로 선호 출처와 직결된다는 근거가 없다.
 *   ⛔ 그러니 「막혔다」가 아니라 «아직 필요하다고 못 쟀다»가 맞다.
 *   ⇒ 이 자가 며칠 뒤 자격이 서는지 재 준다. 서면 그때 다시 볼 일도 없다.
 *
 * ⛔ 「단추 코드를 넣었다」를 「단추가 뜬다」로 세지 않는다 — 구글 쪽 목록을 직접 본다.
 * ⛔ b.close() 금지 — disconnect() 만. 언제나 새 탭.
 *
 * 쓰는 법
 *   node scripts/check-선호출처-자격.mjs --자가시험
 *   node scripts/check-선호출처-자격.mjs            (구글 도구에 물어 본다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/preferred-sources-eligibility.json');
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/** 재는 도메인. ⭐ hankyung.com 은 «대조군»이다 — 이것이 안 뜨면 자가 고장 난 것이다 */
export const 볼것 = [
  { 도메인: 'seoulmarkets.com', 우리것: true },
  { 도메인: 'kculturewire.com', 우리것: true },
  { 도메인: '100yearmap.com', 우리것: true },
  { 도메인: 'klifemap.ai', 우리것: true },
  { 도메인: 'hankyung.com', 우리것: false, 대조군: true },
];

/** 구글 도구가 낸 화면 글에서 「그 출처가 목록에 있나」를 가른다 */
export function 뜨나(화면글, 도메인) {
  const t = String(화면글 || '');
  if (/결과 없음|No results/i.test(t)) return false;
  /* 검색창에 친 글자도 innerText 에 잡힐 수 있으므로 «결과 없음»이 아닌 것을 먼저 본다 */
  return t.toLowerCase().includes(String(도메인).toLowerCase());
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 됐나, 덧말 = '') => 결과.push({ 이름, 됐나: !!됐나, 덧말 });

  본다('우리 도메인 넷을 잰다', 볼것.filter((x) => x.우리것).length === 4);
  본다('대조군이 하나 있다', 볼것.filter((x) => x.대조군).length === 1);

  본다('뜨나 — 「결과 없음」이면 false', 뜨나('… 결과 없음 새로 검색 …', 'seoulmarkets.com') === false);
  본다('뜨나 — 「No results」도 false', 뜨나('No results', 'seoulmarkets.com') === false);
  본다('뜨나 — 목록에 있으면 true', 뜨나('… klifemap.ai 내가 선택한 출처 (0) …', 'klifemap.ai') === true);
  본다('뜨나 — 없으면 false', 뜨나('… 이름 또는 웹사이트로 검색 …', 'klifemap.ai') === false);
  본다('뜨나 — 대소문자를 안 가린다', 뜨나('KLifeMap.AI', 'klifemap.ai') === true);
  본다('뜨나 — 빈 글은 false', 뜨나('', 'a.com') === false && 뜨나(null, 'a.com') === false);

  return 결과;
}

/* ─────────────────────────────── 본 일 ─────────────────────────────── */
async function 잰다() {
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222', defaultViewport: null, protocolTimeout: 10 * 60_000,
  });
  const page = await b.newPage();
  const 잰것 = [];
  try {
    await page.setViewport({ width: 1280, height: 1000 });
    for (const { 도메인, 우리것, 대조군 } of 볼것) {
      await page.goto('about:blank');
      await page.goto(`https://www.google.com/preferences/source?q=${encodeURIComponent(도메인)}`,
        { waitUntil: 'networkidle2', timeout: 90_000 });
      await 쉼(4000);
      const 글 = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
      잰것.push({ 도메인, 우리것: !!우리것, 대조군: !!대조군, 뜨나: 뜨나(글, 도메인) });
      await 쉼(600);
    }
  } finally { await page.close(); b.disconnect(); }

  const 대조 = 잰것.find((x) => x.대조군);
  console.log('■ 구글 「선호 출처」 — 우리가 잡혔나');
  for (const r of 잰것) {
    console.log(`  ${r.뜨나 ? '✅' : '🔴'} ${r.도메인.padEnd(20)}${r.대조군 ? '  ← 대조군' : ''}`);
  }
  if (대조 && !대조.뜨나) {
    console.log('\n🔴 대조군이 안 뜬다 — 자가 고장 났거나 구글 화면이 바뀌었다. 우리 결과를 믿지 마라');
    return 1;
  }
  const 아직 = 잰것.filter((x) => x.우리것 && !x.뜨나).map((x) => x.도메인);
  fs.writeFileSync(낼곳, JSON.stringify({ 잰때: new Date().toLocaleString('ko-KR'), 잰것 }, null, 2), 'utf8');
  console.log(아직.length
    ? `\n⬜ 아직 안 잡힌 곳 ${아직.length} — ${아직.join(' · ')}  (퍼블리셔 센터 등록이 반영되기를 기다린다)`
    : '\n✅ 넷 다 잡혔다 — 단추가 손님 화면에 뜬다');
  return 0;
}

const 이파일이진입점 =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 선호 출처 자 — 자가시험');
    for (const r of 결과) {
      if (!r.됐나) 빨강++;
      console.log(`  ${r.됐나 ? '✅' : '🔴'} ${r.이름}${r.덧말 ? `  (${r.덧말})` : ''}`);
    }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  }
  process.exit(await 잰다());
}
