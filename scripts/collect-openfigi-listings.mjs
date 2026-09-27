#!/usr/bin/env node
/**
 * collect-openfigi-listings.mjs — **막힌 나라의 상장사 명부를 «나라 밖 식별자 우물»로 연다.**
 *
 * 🔴 사장님 지시 (2026-09-27, 원문)
 *   「**우회로 찾아라. 다른 나라에서 했던 노하우를 이용해**」
 *
 * ── 우리가 나라를 여는 길은 셋이다 ──────────────────────────────
 * ```
 * ① 규제기관 공시 시스템   한국 DART · 일본 EDINET          가장 두껍다
 * ② 거래소 공개 API        UAE 아부다비 ADX · 두바이 DFM
 * ③ 나라 밖 공개 식별자    OpenFIGI                          ①②가 막혔을 때
 * ```
 * ③ 은 2026-09-26 에 사우디에서 처음 썼다. 사우디는 거래소 약관이
 * 「reproduce or store … in any electronic retrieval system」을 금지하고,
 * 규제기관(CMA)은 발행사 명부를 안 낸다. 그래서 나라 밖으로 나갔다.
 *
 * ⭐ **이 자는 그 길을 「사우디 전용」에서 «나라를 받는 자»로 넓힌 것이다.**
 *   홍콩도 HKEX 약관이 「systematic retrieval … to compile a database」를 막는다 —
 *   사우디와 같은 벽이다. 같은 벽이면 같은 우회로가 통한다.
 *
 * ── 🔴 사우디에서 못 얻은 것을 홍콩에서는 얻는다 ────────────────────
 * 사우디는 티커가 블룸버그식(ARAMCO)이라 4자리 타다울 심볼을 못 얻었다.
 * **홍콩은 티커가 「619」로 «종목코드 그대로» 온다.** 실측(2026-09-27)이다.
 * ⇒ 종목코드가 있으면 다음 축(재무·공시)을 여는 열쇠가 된다 — HKEXnews 가 그것으로 찾는다.
 *
 * ── ⭐ 쪽수를 줄이는 법 (2026-09-27 에 알아낸 것) ─────────────────
 * `securityType: "Common Stock"` 을 함께 주면 **우물이 미리 걸러 준다.**
 * 홍콩을 그냥 부르면 옵션이 섞여 끝이 없는데, 걸러 부르면 2,841건 29쪽이다.
 * ⛔ 사우디 자는 이것을 몰라 다 받아서 걸렀다. 이 자는 걸러 받는다.
 *
 * ── 라이선스 (2026-09-26 원문 확인) ─────────────────────────────
 * OpenFIGI 약관 — FIGI 식별자는 재배포를 «명시 허용»한다.
 * ⚠ 다만 딸려 오는 «이름·티커»의 벌크 재배포까지 명시하지는 않는다.
 *   ⇒ 이 자는 **모으기만 한다.** 화면에 내는 범위는 따로 판단한다
 *     (우리가 «센 수»는 내고 원자료는 안 낸다 — 인도에서 쓴 길과 같다).
 *
 * 쓰는 법
 *   node scripts/collect-openfigi-listings.mjs --나라=홍콩        (영문 --country=hk)
 *   node scripts/collect-openfigi-listings.mjs --나라=홍콩 --시험  몇 건인지만 본다
 *   node scripts/collect-openfigi-listings.mjs --자가시험          (--selftest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 주소 = 'https://api.openfigi.com/v3/filter';
/* ⚠ 익명은 분당 5회다. 넉넉히 쉬어 간다 — 막히면 그날치가 통째로 빈다 */
export const 쉬는틈 = 13_000;

/**
 * 나라표 — 거래소 코드는 «실측»으로 집는다. 짐작해서 적지 않는다.
 * ⛔ `막힌까닭` 은 그 나라를 왜 이 길로 여는지다. 지우지 않는다 —
 *   다음 사람이 「그냥 거래소에서 받으면 되잖아」로 되돌리는 것을 막는다.
 */
export const 나라표 = {
  홍콩: {
    코드: 'HK', 영문: 'hk', 폴더: 'hongkong-openfigi-companies',
    바닥: 1500,
    막힌까닭: 'HKEX 약관이 systematic retrieval to compile a database 를 금지한다',
    메모: '티커가 홍콩 종목코드 그대로 온다(예: 619) — 다음 축을 여는 열쇠다',
  },
  사우디: {
    코드: 'AB', 영문: 'sa', 폴더: 'saudi-openfigi-companies',
    바닥: 200,
    막힌까닭: 'saudiexchange.sa 약관이 electronic retrieval system 저장을 금지하고, 규제기관(CMA)은 발행사 명부를 안 낸다',
    메모: '티커가 블룸버그식이라 4자리 타다울 심볼은 못 얻는다',
  },
};

export function 나라찾기(말) {
  const s = String(말 ?? '').trim().toLowerCase();
  if (!s) return null;
  for (const [이름, 것] of Object.entries(나라표)) {
    if (이름 === 말 || 것.영문 === s || 것.코드.toLowerCase() === s) return { 이름, ...것 };
  }
  return null;
}

/** 오늘 날짜 — ⛔ toISOString() 금지. 이 PC 가 이미 KST 다 */
export function 오늘날짜(d = new Date()) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/** 받은 줄에서 우리가 쓸 칸만 남긴다. ⛔ 안 쓰는 칸까지 쌓지 않는다 */
export function 줄다듬기(r) {
  if (!r || typeof r !== 'object') return null;
  const 이름 = String(r.name ?? '').trim();
  const figi = String(r.figi ?? '').trim();
  if (!이름 || !figi) return null;
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
 * ⛔ 안 묶으면 「상장사 N곳」이라는 수가 부풀어 그대로 화면에 나간다.
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

/** 보통주만 — 우물이 걸러 주더라도 한 번 더 본다. 우물이 바뀔 수 있다 */
export function 보통주만(것들) {
  return (것들 ?? []).filter((x) => /common stock/i.test(String(x?.종류 ?? '')));
}

/** 받은 것이 쓸 만한가 — 너무 적으면 우물이 바뀐 것이다 */
export function 쓸만한가(것들, 바닥) {
  return Array.isArray(것들) && 것들.length >= (Number(바닥) || 1);
}

/** 인자 집기 — ⚠ 한글 이름만 두면 윈도 예약에서 CP949 로 깨진다. 영문 별칭을 둔다 */
export function 값집기(인자, 이름들) {
  for (const a of 인자 ?? []) {
    for (const n of 이름들) {
      if (typeof a !== 'string') continue;
      if (a.startsWith(`--${n}=`)) return a.slice(n.length + 3);
    }
  }
  return null;
}

const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms));

async function 받기(나라, { 쪽상한 = 80, 한쪽만 = false } = {}) {
  const 모은것 = [];
  let 다음 = null;
  let 쪽 = 0;
  let 총수 = null;
  /* 🔴 상한은 «폭주를 막는 울타리»이지 받을 양을 정하는 값이 아니다.
     2026-09-26 에 20 으로 두었다가 사우디를 끝까지 못 받았다. 끝은 next 가 없을 때다. */
  while (쪽 < 쪽상한) {
    /* ⭐ 우물에게 미리 걸러 달라고 한다 — 홍콩을 그냥 부르면 옵션이 섞여 끝이 없다 */
    const 몸 = { exchCode: 나라.코드, securityType: 'Common Stock' };
    if (다음) 몸.start = 다음;
    const r = await fetch(주소, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(몸),
    });
    if (r.status === 429) {
      console.log('   … 분당 제한에 걸렸다. 쉬었다 다시 부른다');
      await 잠깐(쉬는틈 * 2);
      continue;
    }
    if (!r.ok) throw new Error(`OpenFIGI ${r.status} — ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    if (총수 === null && typeof j?.total === 'number') 총수 = j.total;
    const 것 = Array.isArray(j?.data) ? j.data : [];
    모은것.push(...것);
    쪽++;
    console.log(`   ${쪽}쪽 — ${것.length}줄 (누적 ${모은것.length}${총수 ? ` / 우물이 말하는 총수 ${총수}` : ''})`);
    다음 = j?.next ?? null;
    if (한쪽만 || !다음) break;
    await 잠깐(쉬는틈);
  }
  return { 모은것, 총수 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; const 실패 = [];
  const 본다 = (이름, 참) => { if (참) { 통과 += 1; console.log('✅ ' + 이름); } else { 실패.push(이름); console.log('❌ ' + 이름); } };

  본다('한글 이름으로 나라를 찾는다', 나라찾기('홍콩')?.코드 === 'HK');
  본다('영문 별칭으로도 찾는다', 나라찾기('hk')?.코드 === 'HK');
  본다('거래소 코드로도 찾는다', 나라찾기('AB')?.이름 === '사우디');
  본다('⛔ 모르는 나라는 null', 나라찾기('없는나라') === null);
  본다('⛔ 빈 것·null 에도 안 터진다', 나라찾기('') === null && 나라찾기(null) === null);

  /* 🔴 왜 이 길로 여는지가 나라마다 적혀 있어야 한다 — 없으면 다음 사람이 되돌린다 */
  for (const [이름, 것] of Object.entries(나라표)) {
    본다(`${이름} — 막힌 까닭이 적혀 있다`, String(것.막힌까닭 ?? '').length > 20);
    본다(`${이름} — 둘 폴더가 있다`, /^[a-z-]+$/.test(것.폴더));
  }

  본다('날짜를 KST 로 낸다', 오늘날짜(new Date(2026, 8, 27)) === '20260927');
  본다('⛔ 날짜가 아니면 null', 오늘날짜('어제') === null);

  const 보기 = [
    { figi: 'A1', name: '가 회사', ticker: '619', securityType: 'Common Stock', compositeFIGI: 'C1' },
    { figi: 'A2', name: '가 회사', ticker: '619', securityType: 'Common Stock', compositeFIGI: 'C1' },
    { figi: 'B1', name: '나 회사', ticker: '700', securityType: 'Preferred Stock', compositeFIGI: 'C2' },
    { figi: '', name: '번호 없음', securityType: 'Common Stock' },
  ];
  const 묶은것 = 회사로묶기(보기);
  본다('🔴 같은 회사를 합성figi 로 묶는다 — 안 묶으면 수가 부푼다', 묶은것.length === 2);
  본다('⛔ 번호 없는 줄은 버린다', !묶은것.some((x) => x.이름 === '번호 없음'));
  본다('보통주만 고른다', 보통주만(묶은것).length === 1);
  본다('🔴 홍콩 티커가 종목코드 꼴이다', 보통주만(묶은것)[0].티커 === '619');
  본다('⛔ 빈 것·null 에도 안 터진다 — 묶기', 회사로묶기(null).length === 0);

  본다('바닥을 못 넘으면 쓸 만하지 않다', 쓸만한가([1, 2], 10) === false);
  본다('바닥을 넘으면 쓸 만하다', 쓸만한가([1, 2, 3], 3) === true);
  본다('⛔ 배열이 아니면 false', 쓸만한가(null, 1) === false);

  본다('영문 인자를 받는다 — 윈도 예약이 쓰는 것이다', 값집기(['--country=hk'], ['country', '나라']) === 'hk');
  본다('한글 인자도 받는다', 값집기(['--나라=홍콩'], ['country', '나라']) === '홍콩');
  본다('⛔ 비슷한 이름에 안 걸린다', 값집기(['--countryx=hk'], ['country']) === null);

  console.log(`\n${실패.length ? '❌' : '✅'} 자가시험 ${통과}${실패.length ? ' · 실패 ' + 실패.length : ' 통과'}`);
  return !실패.length;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
} else if (내가진입점) {
  const 인자 = process.argv.slice(2);
  const 나라 = 나라찾기(값집기(인자, ['country', '나라']));
  const 시험 = 인자.includes('--시험') || 인자.includes('--check');
  if (!나라) {
    console.log(`쓰는 법: node scripts/collect-openfigi-listings.mjs --나라=<${Object.keys(나라표).join('|')}>`);
    process.exit(1);
  }

  console.log(`■ ${나라.이름} 상장사 명부 — OpenFIGI (exchCode=${나라.코드})`);
  console.log(`   왜 이 길인가 — ${나라.막힌까닭}`);
  if (나라.메모) console.log(`   ⚠ ${나라.메모}`);

  const { 모은것, 총수 } = await 받기(나라, { 한쪽만: 시험 });
  const 회사 = 보통주만(회사로묶기(모은것));
  console.log(`\n■ 받은 줄 ${모은것.length} → 회사 ${회사.length}곳${총수 ? ` (우물이 말하는 총수 ${총수})` : ''}`);

  if (시험) {
    console.log('⬜ 한 쪽만 재 봤다 — 다 받으려면 --시험 을 뺀다');
    for (const c of 회사.slice(0, 5)) console.log(`   · ${c.티커 ?? '(티커없음)'}  ${c.이름}`);
    process.exit(0);
  }

  /* ⛔ 너무 적으면 «덮어쓰지 않는다» — 우물이 바뀐 날 지난 벌까지 잃는다 */
  if (!쓸만한가(회사, 나라.바닥)) {
    console.log(`🔴 ${회사.length}곳뿐이다 (바닥 ${나라.바닥}). 우물이 바뀐 것으로 보고 «안 적는다»`);
    process.exit(1);
  }

  const 둘곳 = path.join(뿌리, 'archive', 'raw', 나라.폴더);
  fs.mkdirSync(둘곳, { recursive: true });
  const 길 = path.join(둘곳, `${오늘날짜()}.json`);
  fs.writeFileSync(길, JSON.stringify({
    _메모: {
      우물: `OpenFIGI /v3/filter · exchCode=${나라.코드} · securityType=Common Stock`,
      받은때: new Date().toLocaleString('ko-KR'),
      라이선스: 'FIGI 식별자는 재배포 명시 허용. 딸린 이름·티커의 벌크 재배포는 약관이 명시하지 않음 — 모으기만 한다',
      왜이길인가: 나라.막힌까닭,
      우물이말하는총수: 총수,
    },
    회사수: 회사.length,
    회사,
  }, null, 1), 'utf8');
  console.log(`✅ 적었다 — ${path.relative(뿌리, 길)}`);
  console.log('⛔ 이 명부를 화면에 그대로 내지 않는다 — 우리가 «센 수»만 낸다');
}
