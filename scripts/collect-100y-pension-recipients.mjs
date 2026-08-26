#!/usr/bin/env node
/**
 * collect-100y-pension-recipients.mjs — 국민연금 수급현황 (지역×나이) — 「배움의 길」 옆,
 * 「이 나이·이 지역 사람들은 지금 연금을 얼마 받나」
 *
 * 사장님 지시(2026-08-26) — 「국민연금 통계, 각 지자체의 통계가 나이별로 어떻게 살고
 * 있는 지를 보여주는 게 많다」를 재서 만든다. 사장님이 직접 활용신청·승인받았다
 * (데이터셋 15010381, 활용기간 2026-08-26~2028-08-26).
 *
 * ── API ──────────────────────────────────────────────────────────────
 *   엔드포인트  https://apis.data.go.kr/B552015/NpsReciptInfoProvdServiceV2
 *   오퍼레이션  getReciptSttusInfoSearchV2(지역+나이) · getReciptAgeInfoSearchV2(전국, 나이만)
 *   인증키     .env 의 DATAGO_KEY (계정 공통키 — 가입현황 API와 같다. 짐작이 아니라
 *              사장님이 신청 화면에서 직접 보여준 값과 대조해 확인했다)
 *
 * ⛔ 파라미터 이름을 검색결과 요약만 보고 짐작해서 한 번 틀렸다(crtrAge → 맞음이지만
 *   가입현황 쪽은 jainCd로 짐작해 틀렸다). **이 파일의 파라미터는 실제 Swagger UI를
 *   열어 하나씩 확인한 것만 쓴다** — crtrAge(기준연령) · payClssCd(급여종별,
 *   10노령/20장애/30유족/00전체) · ldongAddrMgplDgCd(시도).
 *
 * ── ⭐ 시도코드 — 표준 코드를 그대로 안 썼다. 다 실측했다 ─────────────────
 *   강원·전북은 특별자치도 개편으로 **새 코드(51·52)에만 데이터가 있다**
 *   (옛 코드 42·45는 각각 3명·17명뿐 — 남아 있는 찌꺼기다. 실측: 51=17,819명 · 52=18,912명).
 *   광주·전남은 이 API에서 **하나로 합쳐진 코드(12)만 있다** — 29(광주)·46(전남)
 *   둘 다 0건, 12는 33,434명. src/lib/region.ts가 NEIS에서 이미 겪은 「전남광주통합
 *   특별시」와 같은 모양이다. 그래서 여기서도 가르지 않고 「광주·전남」 한 덩어리로 낸다
 *   (시군구 코드로 다시 가를 길이 있지만, 원자료가 이미 합쳐 주는 값을 억지로 안 쨀 이유가
 *   없다 — 가르면 API를 시군구 25개+전남 시군구까지 또 호출해야 한다).
 *
 * 쓰는 법
 *   node scripts/collect-100y-pension-recipients.mjs --자가시험
 *   node scripts/collect-100y-pension-recipients.mjs           실제로 받아 src/data/100yearmap/pension-recipients.json 을 쓴다
 */
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 출력 = path.join(뿌리, 'src/data/100yearmap/pension-recipients.json');

const KEY = (() => {
  const env = readFileSync(path.join(뿌리, '.env'), 'utf8');
  return (env.match(/^DATAGO_KEY=(.*)$/m) || [])[1]?.trim();
})();

const BASE = 'https://apis.data.go.kr/B552015/NpsReciptInfoProvdServiceV2';

/** ⭐ 표에 없는 것은 짐작해서 안 만든다 — 16줄 다 curl로 대 보고 정했다(2026-08-26) */
export const 시도표 = [
  { 코드: '11', 이름: '서울' }, { 코드: '26', 이름: '부산' }, { 코드: '27', 이름: '대구' },
  { 코드: '28', 이름: '인천' }, { 코드: '12', 이름: '광주·전남' }, { 코드: '30', 이름: '대전' },
  { 코드: '31', 이름: '울산' }, { 코드: '36', 이름: '세종' }, { 코드: '41', 이름: '경기' },
  { 코드: '51', 이름: '강원' }, { 코드: '43', 이름: '충북' }, { 코드: '44', 이름: '충남' },
  { 코드: '52', 이름: '전북' }, { 코드: '47', 이름: '경북' }, { 코드: '48', 이름: '경남' },
  { 코드: '50', 이름: '제주' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 재시도 붙은 호출 — 알리미 자와 같은 결(1500*(i+1)ms 물러서기) */
async function 부르기(url) {
  for (let i = 0; i < 3; i += 1) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (j?.response?.header?.resultCode !== '00') {
        throw new Error(j?.response?.header?.resultMsg ?? '알수없는오류');
      }
      return j.response.body?.items?.item?.[0] ?? null; /* 없으면 그 나이·지역엔 값이 없다 — null */
    } catch (e) {
      if (i === 2) throw e;
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

function 전국URL(나이) {
  return `${BASE}/getReciptAgeInfoSearchV2?crtrAge=${나이}&payClssCd=00&dataType=json&pageNo=1&numOfRows=10&serviceKey=${KEY}`;
}
function 지역URL(시도코드, 나이) {
  return `${BASE}/getReciptSttusInfoSearchV2?ldongAddrMgplDgCd=${시도코드}&crtrAge=${나이}&payClssCd=00&dataType=json&pageNo=1&numOfRows=10&serviceKey=${KEY}`;
}

const 나이시작 = 40, 나이끝 = 100;

async function 만들기() {
  if (!KEY) { console.error('⛔ .env 에 DATAGO_KEY 가 없다'); process.exit(1); }

  const 전국 = {};
  console.log(`전국 — ${나이시작}~${나이끝}세`);
  for (let age = 나이시작; age <= 나이끝; age += 1) {
    const item = await 부르기(전국URL(age));
    if (item) 전국[age] = item;
    await sleep(250);
  }
  console.log(`  ✅ ${Object.keys(전국).length}/${나이끝 - 나이시작 + 1}세 값 있음`);

  const 지역별 = {};
  for (const { 코드, 이름 } of 시도표) {
    console.log(`${이름}(${코드}) — ${나이시작}~${나이끝}세`);
    const 한지역 = {};
    for (let age = 나이시작; age <= 나이끝; age += 1) {
      const item = await 부르기(지역URL(코드, age));
      if (item) 한지역[age] = item;
      await sleep(250);
    }
    지역별[이름] = 한지역;
    console.log(`  ✅ ${Object.keys(한지역).length}/${나이끝 - 나이시작 + 1}세 값 있음`);
  }

  const 산출 = {
    출처: '국민연금공단_수급현황(공공데이터포털, 15010381)',
    url: 'https://www.data.go.kr/data/15010381/openapi.do',
    이용허락범위: '제한 없음',
    받은날: new Date().toISOString().slice(0, 10),
    나이범위: [나이시작, 나이끝],
    급여종별: '00(전체) — 노령·장애·유족을 합친 값',
    '⚠광주전남': '이 API는 광주·전남을 가르지 않고 한 코드(12)로만 준다 — 억지로 안 갈랐다',
    전국,
    지역별,
  };
  writeFileSync(출력, JSON.stringify(산출, null, 2));
  console.log(`✅ 전국 + 지역 ${시도표.length}곳 → ${출력}`);
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('시도표 — 16개 그룹(광주·전남 합쳐서)', 시도표.length === 16);
  검('시도표 — 광주·전남이 코드 12로 합쳐 있다', 시도표.find((s) => s.이름 === '광주·전남')?.코드 === '12');
  검('시도표 — 강원은 신규코드 51', 시도표.find((s) => s.이름 === '강원')?.코드 === '51');
  검('시도표 — 전북은 신규코드 52', 시도표.find((s) => s.이름 === '전북')?.코드 === '52');
  검('시도표 — 옛 코드(29 광주·46 전남·42 강원옛·45 전북옛)는 안 씀',
    !시도표.some((s) => ['29', '46', '42', '45'].includes(s.코드)));

  검('전국URL — 지역 파라미터가 없다(진짜 전국)', !전국URL(67).includes('ldongAddrMgplDgCd'));
  검('전국URL — crtrAge를 담는다', 전국URL(67).includes('crtrAge=67'));
  검('지역URL — 시도코드를 담는다', 지역URL('11', 67).includes('ldongAddrMgplDgCd=11'));
  검('지역URL — payClssCd=00(전체)을 쓴다', 지역URL('11', 67).includes('payClssCd=00'));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log(`✅ collect-100y-pension-recipients 자가시험 통과 (${9})`);
  process.exit(0);
}

만들기();
