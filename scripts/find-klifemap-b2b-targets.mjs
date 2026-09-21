/* 손님에게 운세를 «공짜로 주는 회사»를 찾는다 — KLifeMap B2B 명부를 기계로 만든다.
 *
 * [왜 이 자가 있나 — 2026-09-21]
 * 사장님: 「케이라이프도 B2B 영업도 해라. 자기 고객들에게 공짜로 사주, 별자리를
 *          서비스하는데가 의외로 많다」
 * 그 「의외로 많다」가 몇인지 오늘 알았다. 현 공급사 (주)고든이 스스로 적어 뒀다 —
 * 「국내외 **180여 업체**에 운세를 제공합니다」(sinbiun.com/about/company.php).
 * 우리는 셋만 알고 있었다. 손으로 찾을 수가 없는 수라 자로 만든다.
 *
 * [어떻게 찾나 — 오늘 실측으로 확인한 방법]
 * 그 회사는 고객사마다 «하위 도메인»을 따로 판다 — `<회사>.sinbiun.com`.
 *   samsunglife.sinbiun.com   302 → 실제 경로   ⇒ 쓴다
 *   hanwhalife.sinbiun.com    302 → 실제 경로   ⇒ 쓴다
 *   zzzznope.sinbiun.com      000 (DNS 없음)   ⇒ 안 쓴다
 * ⭐ 대조군이 000 으로 답하므로 «와일드카드가 아니다». 302 는 진짜다.
 *
 * ⛔ 이 자는 DNS·헤더만 본다. 지면을 긁지 않고, 손님 자료를 건드리지 않는다.
 * ⛔ 「없다」로 적지 않는다 — 안 잡힌 곳은 «이 방법으로는 못 찾았다»일 뿐이다.
 *    다른 공급사를 쓰거나 앱 안에만 있을 수 있다.
 *
 * 쓰는 법
 *   node scripts/find-klifemap-b2b-targets.mjs            찾는다
 *   node scripts/find-klifemap-b2b-targets.mjs --적는다    결과를 파일로 남긴다
 *   node scripts/find-klifemap-b2b-targets.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const 여기 = path.dirname(url.fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
export const 낼곳 = path.join(뿌리, 'docs', 'KLifeMap-B2B-찾은곳.tsv');

/** 두드려 볼 이름 — 회사의 «영문 도메인 이름»을 쓴다 */
export const 후보들 = [
  // 생명보험
  ['삼성생명', 'samsunglife'], ['한화생명', 'hanwhalife'], ['신한라이프', 'shinhanlife'],
  ['교보생명', 'kyobo'], ['흥국생명', 'heungkuk'], ['미래에셋생명', 'miraeasset'],
  ['KDB생명', 'kdblife'], ['DB생명', 'dblife'], ['NH농협생명', 'nhlife'],
  ['ABL생명', 'abllife'], ['동양생명', 'myangel'], ['메트라이프', 'metlife'],
  ['푸르덴셜', 'prudential'], ['처브라이프', 'chubblife'], ['라이나', 'lina'],
  ['하나생명', 'hanalife'], ['KB라이프', 'kblife'], ['IBK연금', 'ibkinsurance'],
  ['푸본현대생명', 'fubonhyundai'], ['카디프', 'cardif'], ['삼성화재', 'samsungfire'],
  // 손해보험
  ['현대해상', 'hi'], ['KB손해보험', 'kbinsure'], ['DB손해보험', 'dbins'],
  ['메리츠화재', 'meritzfire'], ['한화손보', 'hwgeneralins'], ['흥국화재', 'heungkukfire'],
  ['롯데손보', 'lotteins'], ['MG손보', 'mggeneralins'], ['악사손보', 'axa'],
  ['캐롯손보', 'carrotins'],
  // 카드
  ['삼성카드', 'samsungcard'], ['신한카드', 'shinhancard'], ['KB국민카드', 'kbcard'],
  ['현대카드', 'hyundaicard'], ['롯데카드', 'lottecard'], ['하나카드', 'hanacard'],
  ['우리카드', 'wooricard'], ['BC카드', 'bccard'], ['NH농협카드', 'nhcard'],
  // 은행
  ['KB국민은행', 'kbstar'], ['신한은행', 'shinhan'], ['우리은행', 'wooribank'],
  ['하나은행', 'hanabank'], ['NH농협은행', 'nhbank'], ['IBK기업은행', 'ibk'],
  ['케이뱅크', 'kbanknow'], ['카카오뱅크', 'kakaobank'], ['토스뱅크', 'tossbank'],
  // 통신·멤버십
  ['SK텔레콤', 'skt'], ['KT', 'kt'], ['LG유플러스', 'lguplus'], ['SK브로드밴드', 'skbroadband'],
  // 커머스·포털
  ['네이버', 'naver'], ['카카오', 'kakao'], ['쿠팡', 'coupang'], ['11번가', '11st'],
  ['G마켓', 'gmarket'], ['옥션', 'auction'], ['SSG', 'ssg'], ['롯데온', 'lotteon'],
  ['인터파크', 'interpark'], ['티몬', 'tmon'], ['위메프', 'wemakeprice'],
  ['GS샵', 'gsshop'], ['현대홈쇼핑', 'hyundaihmall'], ['CJ온스타일', 'cjonstyle'],
  // 여행·항공
  ['대한항공', 'koreanair'], ['아시아나', 'flyasiana'], ['하나투어', 'hanatour'],
  ['모두투어', 'modetour'], ['야놀자', 'yanolja'], ['여기어때', 'goodchoice'],
  // 증권
  ['미래에셋증권', 'miraeassetsec'], ['NH투자증권', 'nhqv'], ['삼성증권', 'samsungpop'],
  ['한국투자증권', 'truefriend'], ['키움증권', 'kiwoom'],
];

/** 이 이름들은 «대조군»이다 — 반드시 000 이 나와야 이 방법을 믿을 수 있다 */
export const 대조군 = ['zzzznope', 'abcdefghijk', 'nosuchcompany2026'];

/**
 * 응답 코드로 「쓰고 있나」를 가른다.
 * @returns {'쓴다'|'안쓴다'|'모름'}
 */
export function 판정(코드) {
  const n = Number(코드);
  if (n === 0 || Number.isNaN(n)) return '안쓴다';      // DNS 자체가 없다
  if (n >= 200 && n < 400) return '쓴다';               // 200·301·302 — 자리가 있다
  if (n === 404 || n === 403) return '모름';            // 서버는 있는데 그 경로가 아니다
  return '모름';
}

/* ───────────────────────── 자가시험 ───────────────────────── */
function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 잰다 = (이름, 실제, 바람) => {
    const 맞나 = JSON.stringify(실제) === JSON.stringify(바람);
    console.log(`${맞나 ? '  ✓' : '  ✗'} ${이름}${맞나 ? '' : `\n      난 것 ${JSON.stringify(실제)}\n      바란 것 ${JSON.stringify(바람)}`}`);
    맞나 ? 통과++ : 깨짐++;
  };
  console.log('── 응답 코드 가르기');
  잰다('000 은 DNS 가 없는 것 — 안 쓴다', 판정('000'), '안쓴다');
  잰다('빈 값도 안 쓴다', 판정(''), '안쓴다');
  잰다('302 는 실제 경로로 보낸 것 — 쓴다', 판정('302'), '쓴다');
  잰다('301 도 쓴다', 판정('301'), '쓴다');
  잰다('200 은 지면이 열린 것 — 쓴다', 판정('200'), '쓴다');
  잰다('404 는 모름 — 서버는 있다', 판정('404'), '모름');
  잰다('403 도 모름', 판정('403'), '모름');
  잰다('500 도 모름 — 「없다」로 적지 않는다', 판정('500'), '모름');

  console.log('── 후보 목록');
  잰다('후보가 50곳을 넘는다', 후보들.length > 50, true);
  잰다('오늘 확인한 셋이 들어 있다',
    ['samsunglife', 'hanwhalife', 'shinhanlife'].every((s) => 후보들.some((r) => r[1] === s)), true);
  잰다('이름이 겹치지 않는다', new Set(후보들.map((r) => r[1])).size, 후보들.length);
  잰다('대조군이 있다 — 없으면 와일드카드를 못 가른다', 대조군.length >= 3, true);
  잰다('대조군은 후보에 섞이지 않는다', 대조군.some((d) => 후보들.some((r) => r[1] === d)), false);

  console.log(`\n${깨짐 ? '🔴' : '✅'} ${통과}/${통과 + 깨짐} 통과`);
  return 깨짐 === 0;
}

/* ───────────────────────── 실행 ───────────────────────── */
async function 두드리기(이름) {
  const 주소 = `https://${이름}.sinbiun.com/`;
  try {
    const c = new AbortController();
    const 시계 = setTimeout(() => c.abort(), 8000);
    const r = await fetch(주소, { method: 'GET', redirect: 'manual', signal: c.signal });
    clearTimeout(시계);
    return { 코드: String(r.status), 간곳: r.headers.get('location') || '' };
  } catch {
    return { 코드: '000', 간곳: '' };
  }
}

const 인자 = process.argv.slice(2);
if (인자.includes('--자가시험') || 인자.includes('--selftest')) {
  process.exit(자가시험() ? 0 : 1);
} else {
  console.log('■ 운세를 손님에게 주는 회사 찾기 — <회사>.sinbiun.com 을 두드린다\n');

  /* 🔴 대조군 먼저. 이것이 «쓴다»로 나오면 와일드카드라 이 방법 전체가 무효다 */
  console.log('── 대조군 (없는 이름 — 반드시 「안쓴다」여야 한다)');
  let 대조군이상 = false;
  for (const d of 대조군) {
    const r = await 두드리기(d);
    const p = 판정(r.코드);
    console.log(`   ${p === '안쓴다' ? '✓' : '🔴'} ${d} → ${r.코드} (${p})`);
    if (p !== '안쓴다') 대조군이상 = true;
  }
  if (대조군이상) {
    console.log('\n🔴 대조군이 응답한다 — 와일드카드다. 이 방법으로는 못 가른다. 멈춘다.');
    process.exit(1);
  }

  console.log('\n── 후보 두드리기');
  const 난것 = [];
  for (const [한글, 이름] of 후보들) {
    const r = await 두드리기(이름);
    const p = 판정(r.코드);
    난것.push({ 한글, 이름, 코드: r.코드, 판정: p, 간곳: r.간곳 });
    if (p === '쓴다') console.log(`   ✅ ${한글} (${이름}) → ${r.코드} ${r.간곳}`);
    else if (p === '모름') console.log(`   ⬜ ${한글} (${이름}) → ${r.코드} — 모름`);
  }

  const 쓴다 = 난것.filter((r) => r.판정 === '쓴다');
  const 모름 = 난것.filter((r) => r.판정 === '모름');
  console.log(`\n■ 두드린 곳 ${난것.length} · ✅ 쓴다 ${쓴다.length} · ⬜ 모름 ${모름.length} · 안 잡힘 ${난것.length - 쓴다.length - 모름.length}`);
  console.log('⛔ 안 잡힌 곳을 「운세를 안 한다」로 읽지 않는다 — 다른 공급사를 쓰거나 앱 안에만 있을 수 있다.');

  if (인자.includes('--적는다')) {
    const 줄 = ['한글이름\t도메인이름\t응답\t판정\t간곳',
      ...난것.map((r) => `${r.한글}\t${r.이름}\t${r.코드}\t${r.판정}\t${r.간곳}`)];
    fs.writeFileSync(낼곳, 줄.join('\n') + '\n', 'utf8');
    console.log(`✔ 적었다 — ${path.relative(뿌리, 낼곳)}`);
  }
}
