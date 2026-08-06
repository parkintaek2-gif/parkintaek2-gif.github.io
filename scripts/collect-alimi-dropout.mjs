#!/usr/bin/env node
/**
 * 고등학교 **전·출입 및 학업중단 학생 수**를 받아 지면이 쓸 수 있게 만든다.
 *
 *   node scripts/collect-alimi-dropout.mjs            # 받아서 저장
 *   node scripts/collect-alimi-dropout.mjs --dry      # **저장하지 않고** 재기만 한다
 *
 *   → archive/raw/alimi/dropout-<연도>.json      원자료 (gitignore)
 *   → src/data/100yearmap/school-dropout.json    빌드가 읽는 것
 *
 * ⭐ 왜 만드나 (2026-08-06) — 고교 지면 2,525장 중 **1,353장이 얇다.**
 *   이름·주소밖에 없어서 검색으로 들어온 사람에게 줄 것이 없다.
 *   사장님이 물으셨다 — *「일반고에서 가장 중요한 정보가 뭘까? 이걸 찾아서 넣어야
 *   고객에게 도움을 주지 않을까?」*
 *
 *   ⛔ **졸업생 진로·등록금은 공개용데이터에 없다**(8/6 실측. 항목 31개를 다 열어 봤다).
 *      그건 에듀데이터서비스(EDSS) 신청+심사를 거쳐야 한다.
 *   🟢 대신 **학업중단**이 있다. 이게 우리 지면에 제일 잘 맞는다 —
 *      대학 지면의 **중도탈락률과 같은 축**이라 「들어간 다음에도 떠난다」를
 *      고등학교에서도 말할 수 있다. 지면끼리 이야기가 이어진다.
 *
 * ## 이용허락범위 — **공공누리 제1유형(출처표시)**
 *
 *   공공데이터포털에서 확인했다(8/5 대장 2-2 · 8/6 2번 재확인).
 *     15014351 학교알리미 공개용데이터    · 1유형 · 전국
 *     15090212 학교알리미 학교별 공시정보 · 1유형
 *   1유형은 **상업 이용 ○ · 변형 ○**, 조건은 **출처표시 하나**다. 우리 용도에 맞는다.
 *
 *   ⚠ 포털은 **목록만** 갖고 있다. 「기관자체에서 다운로드(제공데이터URL기재)」로
 *     결국 `schoolinfo.go.kr` 로 보낸다(8/6 실측). 그래서 받는 곳은 여기 하나뿐이다.
 *   ⛔ **출처표시가 조건이므로 산출물에 출처를 박아 넣는다.** CSV 만 손에 남았을 때
 *     출처를 알 수 없으면 표시한 것이 아니다 — 그래서 파일 안에 `출처` 를 같이 쓴다.
 *   ⛔ robots 확인함 — `User-agent: * / Allow: /`. 막힌 곳이 아니다.
 *   ⛔ 계정·로그인·본인확인이 필요 없다. 그런 길은 애초에 가지 않는다.
 *
 * ## ⚠ 인코딩이 뒤집혀 있다
 *
 *   화면(HTML)은 **EUC-KR** 인데 이 JSON 만 **UTF-8** 이다.
 *   「이 사이트는 EUC-KR」로 뭉뚱그렸다가 글자를 다 깨뜨렸다(8/6). **파일마다 본다.**
 *
 * ## ⚠ 학교 잇기 — 코드가 다르다
 *
 *   학교알리미 `S000003540`  ≠  우리(NEIS) `9010438`
 *   **이름 + 시도**로 잇는다. 우리 2,525장은 그 둘만으로 전부 유일하다(실측).
 *   시도 표기가 또 다르다 — `region.ts` 의 `알리미지역_고교지역()` 이 옮긴다.
 *   ⛔ 못 이으면 **버린다.** 억지로 붙이면 남의 학교 숫자가 지면에 나간다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import qs from 'node:querystring';
import { 알리미지역_고교지역 } from '../src/lib/region.ts';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 시늉 = process.argv.includes('--dry');

/** 학교알리미 공시항목 코드. 10 = 전·출입 및 학업중단 학생 수 */
const 항목코드 = '10';
const 고등학교 = '04';
const 공시연도 = process.argv.includes('--year')
  ? process.argv[process.argv.indexOf('--year') + 1]
  : '2024';

const 출처 = {
  이름: '학교알리미(한국교육학술정보원) 공개용데이터',
  공시항목: '전·출입 및 학업중단 학생 수',
  공시연도,
  이용허락범위: '공공누리 제1유형(출처표시)',
  포털: 'https://www.data.go.kr/data/15014351/fileData.do',
  받은곳: 'https://www.schoolinfo.go.kr/ng/go/pnnggo_a01_l2.do',
};

function 받기(몸) {
  return new Promise((풀림, 깨짐) => {
    const req = https.request(
      'https://www.schoolinfo.go.kr/openData.do',
      {
        method: 'POST',
        timeout: 60000,
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          /* ⚠ 우리가 누구인지 밝힌다. 숨기고 긁지 않는다 */
          'user-agent': 'Mozilla/5.0 (compatible; 100yearmap/1.0; +https://100yearmap.com)',
          'x-requested-with': 'XMLHttpRequest',
          referer: 'https://www.schoolinfo.go.kr/ng/go/pnnggo_a01_l2.do',
        },
      },
      (res) => {
        const 조각 = [];
        res.on('data', (c) => 조각.push(c));
        /* ⚠ **UTF-8 이다.** 화면은 EUC-KR 인데 이것만 다르다 */
        res.on('end', () => 풀림({ 코드: res.statusCode, 글: Buffer.concat(조각).toString('utf8') }));
      },
    );
    req.on('error', 깨짐);
    req.on('timeout', () => { req.destroy(); 깨짐(new Error('시간 초과')); });
    req.end(몸);
  });
}

const 수 = (v) => (v == null || v === '' ? null : Number(v));

/**
 * 🔴 **작은 학교에서는 비율이 뜻을 잃는다** (2026-08-06 실측)
 *
 *   상동고등학교  재학 **3명** · 떠남 3명 →  **100%**
 *
 * 이걸 그대로 실으면 지면에 「학업중단률 100%」가 찍힌다. 시골 작은 학교에
 * 그런 딱지가 붙는다. **재학생이 3명이면 한 사람이 33%p 다.** 비율이 아니라 잡음이다.
 *
 * ⚠ 대학 지면에서 **취업대상자 0명인 열 곳**을 「전국 꼴찌」로 내보내던 것과 같은 함정이다.
 *   그때는 0/0 이었고 이번엔 3/3 이다. **분모가 작으면 비율을 내지 않는다.**
 *
 * ⭐ 30명으로 끊는 근거 — 30명이면 한 사람이 3.3%p 다. 그 아래로는 한 사람이
 *   전국 평균과의 차이보다 크게 흔든다. 그때는 **비율 대신 실제 수**로 말한다
 *   (「19명 가운데 3명」이 「15.8%」보다 정직하고 알아듣기도 쉽다).
 */
const 최소재학생 = 30;

const { 코드, 글 } = await 받기(
  qs.stringify({ APITYPE: 항목코드, PBANYR: 공시연도, SCHULKNDCODE: 고등학교 }),
);
if (코드 !== 200) throw new Error(`받지 못했다: HTTP ${코드}`);

const 원자료 = JSON.parse(글);
const 목록 = 원자료.list ?? [];
if (!목록.length) throw new Error('행이 0개다. 공시연도가 맞는지 본다.');

/* ── 우리 학교에 잇는다 ───────────────────────────────────── */
const 우리 = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src', 'data', '100yearmap', 'pages-school.json'), 'utf8'),
);
const 열쇠 = (이름, 시도) => `${String(이름 ?? '').trim()}|${시도}`;
const 우리표 = new Map(우리.map((x) => [열쇠(x.title, x.지역), x]));

/**
 * ⚠ **저쪽 지역칸이 비어 있는 학교가 있다** (2026-08-06 실측 · 4곳).
 *   `ADRCD_NM` 이 `undefined` 라 시도를 못 옮기고, 그래서 못 이었다.
 *
 * ⭐ 이름이 **양쪽 모두에서 하나뿐**이면 지역 없이도 짝이 하나로 정해진다.
 *   그때만 이름으로 잇는다. 4곳 중 **2곳**(봉담고·이산고)이 여기 해당한다.
 *
 * ⛔ 나머지 둘(광성고·광덕고)은 **양쪽에 같은 이름이 둘씩** 있다. 지역이 없으면
 *   어느 쪽인지 정할 수 없다. **짐작해 붙이지 않는다** — 붙이면 남의 학교 숫자가
 *   그 학교 지면에 나간다. 못 이은 채로 둔다.
 */
const 우리이름수 = new Map();
for (const x of 우리) 우리이름수.set(x.title, (우리이름수.get(x.title) ?? 0) + 1);
const 저쪽이름수 = new Map();
for (const r of 목록) 저쪽이름수.set(r.SCHUL_NM, (저쪽이름수.get(r.SCHUL_NM) ?? 0) + 1);
const 이름만표 = new Map(
  우리.filter((x) => 우리이름수.get(x.title) === 1).map((x) => [x.title, x]),
);

const 결과 = [];
const 못이은것 = [];
for (const r of 목록) {
  /* ⚠ 방송통신고는 우리 지면에 없는 갈래다. 못 이었다고 셈에 넣지 않는다 */
  if (/방송통신/.test(r.SCHUL_NM ?? '')) continue;
  const 시도 = 알리미지역_고교지역(r.ADRCD_NM);
  let 학교 = 시도 ? 우리표.get(열쇠(r.SCHUL_NM, 시도)) : null;
  /* 지역칸이 비었을 때만, 그리고 **양쪽 다 이름이 하나뿐일 때만** 이름으로 잇는다 */
  if (!학교 && !시도 && 저쪽이름수.get(r.SCHUL_NM) === 1) {
    학교 = 이름만표.get(String(r.SCHUL_NM ?? '').trim()) ?? null;
  }
  if (!학교) {
    못이은것.push(`${r.SCHUL_NM} (${r.ADRCD_NM})`);
    continue;
  }
  const 재학 = 수(r.STDNT_SUM);
  const 떠남 = 수(r.MVT_SUM);
  결과.push({
    code: 학교.code,
    표시명: 학교.title,
    재학생: 재학,
    전입: 수(r.MVIN_SUM),
    학업중단: 떠남,
    /* ⚠ 비율은 우리가 낸 값이다. **나라가 준 값이 아니라는 것을 지면에 밝힌다.**
       ⛔ 재학생이 0이거나 30명 미만이면 **비율을 내지 않는다.** 위 주석 참조 */
    학업중단률:
      재학 != null && 재학 >= 최소재학생 && 떠남 != null
        ? Math.round((떠남 / 재학) * 1000) / 10
        : null,
    /* 비율을 왜 안 냈는지 남긴다 — 지면이 그대로 읽어 「없다」가 아니라 「못 낸다」로 말한다 */
    비율못냄:
      재학 == null || 떠남 == null
        ? '수치가 없다'
        : 재학 < 최소재학생
          ? `재학생이 ${재학}명이라 비율이 뜻을 잃는다`
          : undefined,
  });
}

const 통계 = {
  받은때: new Date().toISOString().slice(0, 10),
  출처,
  저쪽행수: 목록.length,
  이은것: 결과.length,
  못이은것: 못이은것.length,
  못이은예: 못이은것.slice(0, 20),
};

console.log(`학교알리미 ${공시연도}년 「${출처.공시항목}」`);
console.log(`  저쪽 ${목록.length}행 · 이은 것 ${결과.length} · 못 이은 것 ${못이은것.length}`);
console.log(`  이용허락범위 ${출처.이용허락범위}`);
if (못이은것.length) console.log(`  ⚠ 못 이은 예 — ${못이은것.slice(0, 5).join(' · ')}`);

if (시늉) {
  console.log('\n--dry 라 저장하지 않았다.');
  process.exit(0);
}

fs.mkdirSync(path.join(ROOT, 'archive', 'raw', 'alimi'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'archive', 'raw', 'alimi', `dropout-${공시연도}.json`),
  JSON.stringify({ 출처, 받은때: 통계.받은때, list: 목록 }, null, 1),
);
fs.mkdirSync(path.join(ROOT, 'src', 'data', '100yearmap'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'src', 'data', '100yearmap', 'school-dropout.json'),
  /* ⛔ 출처를 **자료 안에** 넣는다. 파일만 떨어져 나가도 출처가 따라가야 한다 */
  JSON.stringify({ 출처, 통계: { ...통계, 못이은예: undefined }, 자료: 결과 }, null, 1),
);
console.log('\n저장했다 — archive/raw/alimi · src/data/100yearmap/school-dropout.json');
