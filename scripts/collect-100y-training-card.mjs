#!/usr/bin/env node
/**
 * collect-100y-training-card.mjs — 국민내일배움카드 훈련과정, 지역별로 지금 몇 개 있나
 *
 * 사장님 지시(2026-08-26) — 「내일배움카드로 거의 무료로 배울 수 있는 과정도 잘 분류해서
 * 평생교육과 함께 서비스」. 21만 건이 넘어 한 장에 다 못 나열한다 — **지역별 개수**만
 * 세고, 실제로 과정을 찾아 신청하는 건 work24 자체 검색으로 내보낸다(아웃링크).
 *
 * ── API ──────────────────────────────────────────────────────────────
 *   엔드포인트  https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do
 *   인증키     .env 의 WORK24_KEY_TRAINING_CARD (2026-08-04 자동승인, 이미 있던 것을
 *              나중에 발견했다 — 사장님이 지적한 뒤로는 **먼저 .env 를 확인**한다)
 *
 * ⛔ 시도코드를 짐작하지 않았다. 국민연금 수급현황 API 때와 같은 실측을 여기서도
 *   했다 — **광주·전남이 이 API에서도 하나로 합쳐진 코드(12)로만 값이 잡힌다**
 *   (29·46은 0건). 강원·전북도 신규코드(51·52)에만 값이 있다(옛 코드 42·45는 0건).
 *   같은 정부 법정동 코드체계를 쓰는 두 기관이 같은 모양으로 갈라져 있었다 —
 *   collect-100y-pension-recipients.mjs 의 시도표와 **코드가 완전히 같다.**
 *
 * ⚠ srchTraStDt~srchTraEndDt(훈련시작일 범위)는 「오늘부터 6개월」로 매번 다시 잡는다 —
 *   지난 날짜로 고정해 두면 시간이 지날수록 「지금 신청 가능한 과정」이 아니게 된다.
 *
 * 쓰는 법
 *   node scripts/collect-100y-training-card.mjs --자가시험
 *   node scripts/collect-100y-training-card.mjs           실제로 받아 src/data/100yearmap/training-card.json 을 쓴다
 */
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 출력 = path.join(뿌리, 'src/data/100yearmap/training-card.json');

const KEY = (() => {
  const env = readFileSync(path.join(뿌리, '.env'), 'utf8');
  return (env.match(/^WORK24_KEY_TRAINING_CARD=(.*)$/m) || [])[1]?.trim();
})();

const BASE = 'https://www.work24.go.kr/cm/openApi/call/hr/callOpenApiSvcInfo310L01.do';

/** ⭐ 국민연금 수급현황 API 시도표와 코드가 완전히 같다 — 실측으로 다시 확인했다(2026-08-26) */
export const 시도표 = [
  { 코드: '11', 이름: '서울' }, { 코드: '26', 이름: '부산' }, { 코드: '27', 이름: '대구' },
  { 코드: '28', 이름: '인천' }, { 코드: '12', 이름: '광주·전남' }, { 코드: '30', 이름: '대전' },
  { 코드: '31', 이름: '울산' }, { 코드: '36', 이름: '세종' }, { 코드: '41', 이름: '경기' },
  { 코드: '51', 이름: '강원' }, { 코드: '43', 이름: '충북' }, { 코드: '44', 이름: '충남' },
  { 코드: '52', 이름: '전북' }, { 코드: '47', 이름: '경북' }, { 코드: '48', 이름: '경남' },
  { 코드: '50', 이름: '제주' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const yyyymmdd = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

/** XML에서 <scn_cnt>만 뽑는다 — 굳이 XML 파서를 안 들여온다. 이 값 하나만 쓴다 */
function scn_cnt(xml) {
  const m = xml.match(/<scn_cnt>(\d+)<\/scn_cnt>/);
  return m ? Number(m[1]) : null;
}

async function 부르기(url) {
  for (let i = 0; i < 3; i += 1) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      if (text.includes('<error>')) throw new Error(text.slice(0, 200));
      return scn_cnt(text);
    } catch (e) {
      if (i === 2) throw e;
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

function url(params) {
  const q = new URLSearchParams({
    authKey: KEY, returnType: 'XML', outType: '1', pageNum: '1', pageSize: '1',
    sort: 'ASC', sortCol: 'TRNG_BGDE', ...params,
  });
  return `${BASE}?${q.toString()}`;
}

async function 만들기() {
  if (!KEY) { console.error('⛔ .env 에 WORK24_KEY_TRAINING_CARD 가 없다'); process.exit(1); }

  const 오늘 = new Date();
  const 반년뒤 = new Date(오늘.getTime() + 180 * 24 * 60 * 60 * 1000);
  const 시작 = yyyymmdd(오늘), 끝 = yyyymmdd(반년뒤);

  console.log(`기간 ${시작}~${끝} (오늘부터 6개월, 훈련 시작일 기준)`);

  const 전국 = await 부르기(url({ srchTraStDt: 시작, srchTraEndDt: 끝 }));
  console.log(`전국 — ${전국}건`);
  await sleep(300);

  const 지역별 = {};
  for (const { 코드, 이름 } of 시도표) {
    const n = await 부르기(url({ srchTraStDt: 시작, srchTraEndDt: 끝, srchTraArea1: 코드 }));
    지역별[이름] = n;
    console.log(`${이름}(${코드}) — ${n}건`);
    await sleep(300);
  }

  const 산출 = {
    출처: '한국고용정보원_직업훈련_국민내일배움카드 훈련과정(공공데이터포털, 15109032) / 고용24(work24.go.kr)',
    url: 'https://www.work24.go.kr/hr/a/a/1100/trnnCrsInf.do',
    받은날: yyyymmdd(오늘),
    조회기간: { 시작, 끝, 뜻: '훈련 시작일이 이 범위 안인 과정만 센다(오늘부터 6개월)' },
    '⚠광주전남': '이 API도 국민연금 수급현황 API와 같이 광주·전남을 코드 12 하나로만 준다',
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
  검('시도표 — 광주·전남 코드 12', 시도표.find((s) => s.이름 === '광주·전남')?.코드 === '12');
  검('시도표 — 강원 신규코드 51', 시도표.find((s) => s.이름 === '강원')?.코드 === '51');
  검('시도표 — 전북 신규코드 52', 시도표.find((s) => s.이름 === '전북')?.코드 === '52');
  검('시도표 — 옛 코드(29·46·42·45) 안 씀', !시도표.some((s) => ['29', '46', '42', '45'].includes(s.코드)));

  검('scn_cnt — XML에서 뽑는다', scn_cnt('<a><scn_cnt>8272</scn_cnt></a>') === 8272);
  검('scn_cnt — 없으면 null', scn_cnt('<a></a>') === null);

  검('yyyymmdd — 자리를 채운다', yyyymmdd(new Date(2026, 0, 5)) === '20260105');

  검('url — 지역 파라미터가 들어간다', url({ srchTraArea1: '11' }).includes('srchTraArea1=11'));
  검('url — authKey를 담는다', url({}).includes(`authKey=${KEY ?? ''}`) || !KEY);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log(`✅ collect-100y-training-card 자가시험 통과 (${10})`);
  process.exit(0);
}

만들기();
