#!/usr/bin/env node
/**
 * collect-saudi-openfigi-companies.mjs — **사우디 상장사 명부. 쓸 수 있는 우물로.**
 *
 * ── 🔴 왜 이 우물인가 (2026-09-26 · 5번이 다섯 곳을 재고 정했다) ─────────────
 * 사장님: 「아시아마켓츠 마무리했나?」 · 「마켓츠 하던 게 있으면 그걸 마무리하고 해」
 *
 * 사우디는 막힌 문이 많았다. 재 본 결과를 그대로 적는다 —
 *
 * ```
 * 🔴 saudiexchange.sa   약관이 「reproduce or store … in any other website or
 *                       electronic retrieval system」를 금지한다. 우리가 하려던 일 그대로다
 * 🔴 Edaa (예탁원)       필요한 것을 «다» 가졌다 — 275건·4자리 심볼·ISIN·업종이
 *                       키 없이 GET 한 번에 온다. 그런데 재배포 허락이 없고,
 *                       푸터 계열사가 Saudi Tadawul Group·Saudi Exchange 다.
 *                       ⛔ 거래소와 «같은 기업집단»이라 법적 노출이 같다. 안 쓴다
 * 🔴 국가공개데이터      우리 망에서 TCP 가 막히고, 상업 이용 조문을 «못 읽었다»
 * 🟡 CMA 공개데이터 API  열려 있고 약관도 좋다. 그러나 «상장사 명부가 없다» —
 *                       통계공보 두 개를 직접 열어 전부 집계임을 확인했다
 * 🟢 OpenFIGI           ← 이것. 키 없이 열리고, 약관이 재배포를 «명시 허용»한다
 * ```
 *
 * ⭐ **UAE 에서 쓴 길(거래소 → 규제기관)이 사우디에는 안 통했다.**
 *   사우디 규제기관은 중개기관·펀드·통계를 내지 발행사 명부를 안 낸다.
 *   그래서 «나라 밖의 공개 식별자 우물»로 갔다.
 *
 * ── 라이선스 (2026-09-26 원문 확인) ──────────────────────────────────
 * OpenFIGI 약관 — FIGI 식별자는 *"free ... to use, display, reproduce, distribute
 * and create derivative works ... including redistribution ... to your customers"*.
 * ⚠ 다만 딸려 오는 «이름·티커»의 벌크 재배포까지 명시하지는 않는다.
 *   ⇒ 그래서 이 자는 **모으기만 한다.** 화면에 내는 범위는 따로 판단한다
 *     (인도 신용등급에서 쓴 길과 같다 — 우리가 «센 수»는 내고 원자료는 안 낸다).
 *
 * ── 이 우물이 못 주는 것 — 「못 쟀다」가 아니라 「재 봤고 없다」 ──────────────
 * ```
 * ⛔ 4자리 타다울 심볼   티커가 블룸버그식이다 (ARAMCO · RJHI)
 * ⛔ 공식 업종 분류      marketSector 가 'Equity' 한 겹이다
 * ⛔ Main / Nomu 구분    둘 다 exchCode 가 'AB' 하나다
 * ```
 * 이 셋은 무료·합법 경로가 «없다». 있다면 거래소와 TILA 계약뿐이다.
 *
 * 쓰는 법
 *   node scripts/collect-saudi-openfigi-companies.mjs            받아서 세기만 한다
 *   node scripts/collect-saudi-openfigi-companies.mjs --적는다    archive 에 쌓는다
 *   node scripts/collect-saudi-openfigi-companies.mjs --save      (영문 별칭)
 *   node scripts/collect-saudi-openfigi-companies.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
export const 둘곳 = path.join(뿌리, 'archive', 'raw', 'saudi-openfigi-companies');

/* 🔴 실측으로 집은 값 (2026-09-26). AB = 사우디 거래소 */
export const 거래소코드 = 'AB';
export const 주소 = 'https://api.openfigi.com/v3/filter';
/* ⚠ 익명은 분당 5회다. 넉넉히 쉬어 간다 — 막히면 그날치가 통째로 빈다 */
export const 쉬는틈 = 13_000;

/** 오늘 날짜 — ⛔ toISOString() 금지. 이 PC 가 이미 KST 다 */
export function 오늘날짜(d = new Date()) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 받은 줄에서 우리가 쓸 칸만 남긴다.
 * ⛔ 원자료를 통째로 쌓지 않는다 — 안 쓰는 칸까지 쌓으면 「무엇을 쓰는지」가 흐려진다.
 */
export function 줄다듬기(r) {
  if (!r || typeof r !== 'object') return null;
  const 이름 = String(r.name ?? '').trim();
  const figi = String(r.figi ?? '').trim();
  if (!이름 || !figi) return null;          /* 이름도 번호도 없으면 쓸 데가 없다 */
  return {
    figi,
    이름,
    티커: String(r.ticker ?? '').trim() || null,
    통화: String(r.currency ?? '').trim() || null,
    종류: String(r.securityType ?? '').trim() || null,
    갈래: String(r.marketSector ?? '').trim() || null,
    합성figi: String(r.compositeFIGI ?? '').trim() || null,
  };
}

/**
 * 🔴 같은 회사가 여러 줄로 온다 — compositeFIGI 로 묶는다.
 * ⛔ 안 묶으면 「사우디 상장사 N곳」이라는 수가 부풀어 그대로 화면에 나간다.
 */
export function 회사로묶기(줄들) {
  const 통 = new Map();
  for (const r of 줄들 ?? []) {
    const 것 = 줄다듬기(r);
    if (!것) continue;
    const 열쇠 = 것.합성figi || 것.figi;
    if (!통.has(열쇠)) 통.set(열쇠, 것);
  }
  return [...통.values()].sort((a, z) => a.이름.localeCompare(z.이름));
}

/** 보통주만 고른다 — 우선주·예탁증서를 상장사 수로 세지 않는다 */
export function 보통주만(것들) {
  return (것들 ?? []).filter((x) => /common stock/i.test(String(x?.종류 ?? '')));
}

/** 받은 것이 쓸 만한가 — 너무 적으면 우물이 바뀐 것이다 */
export function 쓸만한가(것들, 바닥 = 200) {
  return Array.isArray(것들) && 것들.length >= 바닥;
}

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 받기() {
  const 모은것 = [];
  let 다음 = null;
  let 쪽 = 0;
  /* 🔴 [2026-09-26] 상한을 20 으로 두었다가 «끝까지 못 받았다» — 2,000줄에서 끊겼고
     보통주가 329곳이었다(끝까지 받으면 더 나온다). 상한은 «폭주를 막는 울타리»이지
     받을 양을 정하는 값이 아니다. 넉넉히 두고, 끝은 next 가 없을 때로 가른다. */
  while (쪽 < 80) {
    const 몸 = { exchCode: 거래소코드 };
    if (다음) 몸.start = 다음;
    const r = await fetch(주소, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(몸),
    });
    if (r.status === 429) {                 /* 분당 제한 — 더 쉬고 같은 쪽을 다시 */
      console.log('   … 분당 제한에 걸렸다. 쉬었다 다시 부른다');
      await 잠깐(쉬는틈 * 2);
      continue;
    }
    if (!r.ok) throw new Error(`OpenFIGI ${r.status} — ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    const 것 = Array.isArray(j?.data) ? j.data : [];
    모은것.push(...것);
    쪽++;
    console.log(`   ${쪽}쪽 — ${것.length}줄 (누적 ${모은것.length})`);
    다음 = j?.next ?? null;
    if (!다음) break;
    await 잠깐(쉬는틈);
  }
  return 모은것;
}

function 자가시험() {
  let 통과 = 0; let 탈 = 0;
  const 검 = (이름, 참) => { if (참) { 통과++; console.log('✅', 이름); } else { 탈++; console.log('🔴', 이름); } };

  검('오늘날짜가 KST 로 나온다', 오늘날짜(new Date(2026, 8, 26)) === '20260926');

  const 참줄 = { figi: 'BBG000BCXYZ1', name: 'Saudi Arabian Oil Co', ticker: 'ARAMCO',
    currency: 'SAR', securityType: 'Common Stock', marketSector: 'Equity', compositeFIGI: 'BBG000BCXYZ0' };
  const 다듬 = 줄다듬기(참줄);
  검('줄을 다듬는다', 다듬.이름 === 'Saudi Arabian Oil Co' && 다듬.티커 === 'ARAMCO');
  검('⛔ 이름이 없으면 버린다', 줄다듬기({ figi: 'X' }) === null);
  검('⛔ 번호가 없으면 버린다', 줄다듬기({ name: 'X' }) === null);
  검('⛔ null·딴 것에도 안 터진다', 줄다듬기(null) === null && 줄다듬기('가') === null);
  검('빈 칸은 null 로 둔다 — 0 이나 빈 글로 채우지 않는다',
    줄다듬기({ figi: 'A', name: 'B' }).티커 === null);

  /* 🔴 같은 회사가 여러 줄로 오는 실제 꼴 */
  const 여럿 = [
    { figi: 'BBG1', name: 'Al Rajhi Bank', compositeFIGI: 'BBGC1', securityType: 'Common Stock' },
    { figi: 'BBG2', name: 'Al Rajhi Bank', compositeFIGI: 'BBGC1', securityType: 'Common Stock' },
    { figi: 'BBG3', name: 'Saudi Telecom', compositeFIGI: 'BBGC2', securityType: 'Common Stock' },
  ];
  검('🔴 같은 회사를 한 번만 센다 — 안 묶으면 수가 부푼다', 회사로묶기(여럿).length === 2);
  검('이름 차례로 정렬한다', 회사로묶기(여럿)[0].이름 === 'Al Rajhi Bank');
  검('⛔ 빈 것·null 에도 안 터진다', 회사로묶기([]).length === 0 && 회사로묶기(null).length === 0);
  검('합성번호가 없으면 자기 번호로 묶는다',
    회사로묶기([{ figi: 'X1', name: 'A' }, { figi: 'X2', name: 'B' }]).length === 2);

  검('보통주만 고른다', 보통주만([{ 종류: 'Common Stock' }, { 종류: 'Preference' }]).length === 1);
  검('⛔ 빈 것·null 에도 안 터진다', 보통주만([]).length === 0 && 보통주만(null).length === 0);

  검('🔴 실측한 수(394)면 쓸 만하다', 쓸만한가(new Array(394).fill({})));
  검('🔴 갑자기 줄면 막는다 — 우물이 바뀐 것이다', !쓸만한가(new Array(12).fill({})));
  검('⛔ 빈 것·null 에도 안 터진다', !쓸만한가([]) && !쓸만한가(null));

  검('주소와 거래소 코드가 제자리에 있다',
    주소.startsWith('https://api.openfigi.com') && 거래소코드 === 'AB');

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통과} 통과`);
  process.exit(탈 ? 1 : 0);
}

const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--자가시험') || 인자.includes('--selftest')) 자가시험();

  console.log('■ 사우디 상장사 — OpenFIGI (키 없이, 재배포 허용 확인된 우물)');
  const 날것 = await 받기();
  const 회사 = 회사로묶기(날것);
  const 보통 = 보통주만(회사);

  console.log(`\n■ 받은 줄 ${날것.length} · 회사로 묶어 ${회사.length} · 그중 보통주 ${보통.length}`);
  const 티커있음 = 보통.filter((x) => x.티커).length;
  console.log(`   티커 붙은 곳 ${티커있음} · 통화 SAR ${보통.filter((x) => x.통화 === 'SAR').length}`);
  for (const x of 보통.slice(0, 3)) console.log(`   · ${x.티커 ?? '(없음)'}  ${x.이름}`);

  if (!쓸만한가(보통)) {
    console.log('\n🔴 받은 수가 너무 적다 — 우물이 바뀌었을 수 있다. 쌓지 «않는다».');
    process.exit(1);
  }

  if (!(인자.includes('--적는다') || 인자.includes('--save'))) {
    console.log('\n⬜ 재기만 했다. 쌓으려면 --적는다 (영문 별칭 --save)');
    process.exit(0);
  }

  fs.mkdirSync(둘곳, { recursive: true });
  const 길 = path.join(둘곳, `${오늘날짜()}.json`);
  fs.writeFileSync(길, JSON.stringify({
    _메모: {
      우물: 'OpenFIGI /v3/filter · exchCode=AB (Saudi Exchange)',
      받은때: new Date().toLocaleString('ko-KR'),
      라이선스: 'FIGI 식별자는 재배포 명시 허용. 딸린 이름·티커의 벌크 재배포는 약관이 명시하지 않음 — 모으기만 한다',
      못주는것: ['4자리 타다울 심볼(티커가 블룸버그식)', '공식 업종 분류', 'Main/Nomu 구분'],
      안쓴우물: ['saudiexchange.sa(약관 금지)', 'Edaa(재배포 허락 없음·타다울 그룹 계열사)'],
    },
    회사수: 보통.length,
    회사: 보통,
  }, null, 2), 'utf8');
  console.log(`\n✅ 쌓았다 — ${path.relative(뿌리, 길)} (보통주 ${보통.length}곳)`);
  console.log('⛔ 모으기만 한다. 화면에 내는 범위는 따로 판단한다 — docs/라이선스-대장.tsv');
}
