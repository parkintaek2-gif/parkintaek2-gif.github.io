#!/usr/bin/env node
/**
 * 직업계고 **계열별** 졸업·취업·진학을 받는다 (KOSIS 334/DT_920024_3N_007).
 *
 *   node scripts/collect-kosis-voc-series.mjs            # 받아서 저장
 *   node scripts/collect-kosis-voc-series.mjs --dry      # 저장하지 않고 재기만 한다
 *
 *   → archive/raw/kosis/voc-series-<연도>.json          원자료 (gitignore)
 *   → src/data/100yearmap/voc-series-outcomes.json      빌드가 읽는 것
 *
 * ## ⭐ 왜 만드나 (2026-08-07)
 *
 *   특성화고 지면 480곳에 붙은 취업 숫자가 **두 벌뿐**이었다 —
 *   「특성화고 전체 83.1%」·「마이스터고 전체 68.2%」. 516곳이 전부 같은 숫자를 본다.
 *   학부모가 학교를 고르는 데 아무 쓸모가 없다.
 *
 *   🔴 **학교 단위 숫자는 어디에도 없다.** 오늘 세 방향으로 확인했다.
 *     ① 학교알리미 공개용데이터 **28개 항목** — 특성화고 행에 취업 칸이 하나도 없다
 *     ② 항목 52(졸업생의 진로)는 특성화고가 **4곳**뿐이다(항목 09 에는 487곳)
 *     ③ 유력 항목 8개(81 고등학교 Profile · 66 자율공시 · 80 우리학교최고 …)를
 *        2023~2026 네 해로 두드렸다 — **전부 미공시**
 *     ④ KOSIS 직업계고 관련 표 **58개**의 축을 다 봤다 — 학교 단위 축이 없다
 *
 *   🟢 대신 **계열**이 있다. 지금 잡을 수 있는 가장 잘게 나뉜 축이다.
 *     그리고 **우리 학과 자료의 계열 이름과 그대로 맞는다**(공업·상업·농림업·수산·해양·
 *     가사·예술·일반). 손으로 옮겨 적을 것이 없다는 뜻이라, 어긋날 자리가 없다.
 *
 * ## ⚠ 이것도 **학교 하나의 값이 아니다** — 그 말을 지면에 적는다
 *
 *   두 벌이 여덟 벌로 늘어난 것이지 학교별이 된 것이 아니다.
 *   ⛔ 「이 학교 취업률」로 읽히게 두면 안 된다. `/work` 지면에서 쓰는 문구와 같이 간다.
 *
 * ## ⚠ 재는 자가 `/work` 와 다르다 — 섞으면 안 된다
 *
 *   `/work`(DT_920024_3N_013)  **유지취업률** — 1년·2년 뒤에도 보험 자격이 유지된 비율
 *   여기(DT_920024_3N_007)     **취업률**    — 취업자 ÷ **취업대상자**
 *   ⛔ 83.1% 와 55.2% 를 빼서 견주면 안 된다. 그 말을 지면에 적는다.
 *
 * ## 이용허락범위
 *
 *   KOSIS 공유서비스(교육부 「직업계고 졸업자 취업통계」). 출처표시로 쓴다.
 *   ⛔ 키 값을 출력하거나 커밋하지 않는다. `.env` 는 gitignore.
 *   ⚠ `.env` 를 `.split('=')[1]` 로 읽지 않는다 — 키가 base64 라 끝의 `=` 가 잘리고,
 *     KOSIS 가 「유효하지않은 인증KEY」로 돌려준다(2026-08-07 에 30분을 썼다).
 */
import fs from 'node:fs';
import path from 'node:path';
/* 🔴 규칙은 한 곳에 있다. 여기 다시 적지 않는다 — `src/lib/school-rules.ts` */
import { 최소분모 as 공통최소분모 } from '../src/lib/school-rules.ts';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 시늉 = process.argv.includes('--dry');

const KEY = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^KOSIS_API_KEY=(.+)$/m)?.[1]?.trim();
if (!KEY) throw new Error('.env 에 KOSIS_API_KEY 가 없다');

const ORG = '334';
const TBL = 'DT_920024_3N_007';

const 출처 = {
  이름: '국가데이터처 KOSIS · 교육부 「직업계고 졸업자 취업통계」',
  표: `${ORG}/${TBL}`,
  표이름: '직업계고 계열별 졸업현황',
  /* ⛔ 여기 「졸업자 ÷」로 적어 뒀다가 검산에서 틀린 것을 알았다. **분모가 다르다** */
  취업률정의:
    '취업자 ÷ 취업대상자. 취업대상자 = 졸업자 − 진학자 − 입대자 − 제외인정자. ⚠ 진학한 사람은 분모에서 빠진다',
  진학률정의: '진학자 ÷ 졸업자',
  다른자경고:
    '/work 지면의 「유지취업률」(1~2년 뒤에도 고용·건강보험 자격이 유지된 비율)과 재는 자가 다르다. 빼서 견주면 안 된다',
};

const 받기 = async (u) => {
  const r = await fetch(u, { signal: AbortSignal.timeout(60000) });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch { throw new Error(`JSON 이 아니다: ${t.slice(0, 200)}`); }
  if (!Array.isArray(j)) throw new Error(`저쪽 답: ${JSON.stringify(j).slice(0, 200)}`);
  return j;
};

/** 🔴 이 PC 는 이미 KST 다. `toISOString()` 은 UTC 라 새벽에 하루가 어긋난다 */
const 오늘 = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

const 행 = await 받기(
  `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KEY}` +
    `&orgId=${ORG}&tblId=${TBL}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=1`,
);

const 기준연도 = [...new Set(행.map((x) => x.PRD_DE))].sort().at(-1);
const 수 = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** C1 = 계열 · C2 = 졸업현황별. **남녀는 상위 항목 아래 같은 이름(「남자」)으로 온다** —
 *  그래서 `C2` 이름만 보면 어느 항목의 남녀인지 모른다. 여기서는 총계 항목만 쓴다.
 *  ⛔ 남녀를 쓰려면 `C2` 의 코드(B002001 등)를 봐야 한다. 지금 지면은 안 쓰므로 안 담는다. */
const 뽑을것 = {
  B001: '졸업자',
  B002: '취업률',
  B003: '취업자',
  B007: '진학률',
  B008: '진학자',
  B009: '입대자',
  B010: '제외인정자',
  B011: '미취업자',
};

const 계열표 = new Map();
for (const r of 행) {
  if (r.PRD_DE !== 기준연도) continue;
  const 칸 = 뽑을것[r.C2];
  if (!칸) continue; // 남녀 하위 코드(B002001 등)와 안 쓰는 항목은 건너뛴다
  const 계열 = String(r.C1_NM ?? '').trim();
  const 것 = 계열표.get(계열) ?? { 계열 };
  것[칸] = 수(r.DT);
  계열표.set(계열, 것);
}

/**
 * ── 검산 · 분모 찾기 ────────────────────────────────────────
 *
 * 🔴 **취업률의 분모는 졸업자가 아니다.** 처음에 졸업자로 나눴더니 10계열 전부 틀렸다
 *   (총계 저쪽 55.2% ↔ 우리 25.6%). 취업률 + 진학률이 100%를 넘는 것(공업 102.5%)이
 *   같은 것을 말한다 — **두 비율의 분모가 서로 다르다.**
 *
 *   직업계고 취업률의 분모는 **취업대상자**다.
 *     취업대상자 = 졸업자 − 진학자 − 입대자 − 제외인정자 = 취업자 + 미취업자
 *
 *   ⛔ 이 분모를 지면에 **반드시 적는다.** 안 적으면 「졸업생 절반이 취업했다」로 읽히는데,
 *     실제로는 진학한 사람이 분모에서 빠진 뒤의 비율이다. 대학 학과 지면에서 겪은 함정과 같다.
 */
const 안맞음 = [];
for (const v of 계열표.values()) {
  v.취업대상자 =
    v.취업자 != null && v.미취업자 != null ? v.취업자 + v.미취업자 : null;
  if (v.취업대상자 && v.취업률 != null) {
    const 우리 = Math.round((v.취업자 / v.취업대상자) * 1000) / 10;
    if (Math.abs(우리 - v.취업률) > 0.15) {
      안맞음.push(`${v.계열}: 저쪽 ${v.취업률}% ≠ 취업자÷취업대상자 ${우리}%`);
    }
  }
  /* 진학률의 분모는 졸업자다 — 이쪽도 맞춰 본다 */
  if (v.졸업자 && v.진학자 != null && v.진학률 != null) {
    const 우리 = Math.round((v.진학자 / v.졸업자) * 1000) / 10;
    if (Math.abs(우리 - v.진학률) > 0.15) {
      안맞음.push(`${v.계열}: 진학률 저쪽 ${v.진학률}% ≠ 진학자÷졸업자 ${우리}%`);
    }
  }
}

/**
 * 🔴 **분모가 작으면 비율을 쓰지 않는다** — 전 사이트 규칙(2026-08-06).
 *   예술 계열은 **취업대상자가 9명**이다. 11.1% 는 「아홉 중 하나」다.
 *   그걸 「예술 계열 취업률 11%」로 지면에 실으면 예술 계열을 때리는 숫자가 된다.
 *   ⚠ 이 값 30 은 `collect-alimi-dropout.mjs` 의 `최소재학생`,
 *     `collect-alimi-career.mjs` 의 `최소졸업자`, `check-100yearmap-launch.mjs` 의
 *     `작은분모` 와 **같은 뜻**이다. 하나를 바꾸면 넷을 같이 본다.
 */
const 최소분모 = 공통최소분모;
for (const v of 계열표.values()) {
  if (v.취업대상자 != null && v.취업대상자 < 최소분모) {
    v.취업률못냄 = `취업 대상이 ${v.취업대상자}명이라 비율이 뜻을 잃는다`;
    v.취업률 = null;
  }
}

/** ⛔ 「총계」는 계열이 아니다. 견줄 자리로만 쓰고 목록에서는 뺀다 */
const 총계 = 계열표.get('총계') ?? null;
const 자료 = [...계열표.values()]
  .filter((x) => x.계열 !== '총계' && x.졸업자)
  .sort((a, b) => b.졸업자 - a.졸업자);

const 통계 = {
  받은때: 오늘,
  기준연도,
  출처,
  계열수: 자료.length,
  총계,
  검산안맞음: 안맞음.length,
  검산안맞은예: 안맞음.slice(0, 5),
};

console.log(`KOSIS ${기준연도}년 「${출처.표이름}」`);
console.log(`  계열 ${자료.length}가지 · 총계 졸업 ${총계?.졸업자?.toLocaleString()} · 취업률 ${총계?.취업률}%`);
console.log(
  `  🔴 검산 — 저쪽 비율과 안 맞는 계열 ${안맞음.length}가지` +
    (안맞음.length ? ` → ${안맞음.join(' / ')}` : ' (전부 맞는다)'),
);
for (const v of 자료) {
  console.log(
    `    ${v.계열.padEnd(6)} 졸업 ${String(v.졸업자).padStart(6)} · 취업대상 ${String(v.취업대상자 ?? '—').padStart(6)}` +
      ` · 취업 ${String(v.취업률).padStart(5)}% · 진학 ${String(v.진학률).padStart(5)}%`,
  );
}

if (시늉) {
  console.log('\n--dry 라 저장하지 않았다.');
  process.exit(0);
}

fs.mkdirSync(path.join(ROOT, 'archive', 'raw', 'kosis'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'archive', 'raw', 'kosis', `voc-series-${기준연도}.json`),
  JSON.stringify({ 출처, 받은때: 오늘, list: 행 }, null, 1),
);
fs.writeFileSync(
  path.join(ROOT, 'src', 'data', '100yearmap', 'voc-series-outcomes.json'),
  /* ⛔ 출처를 자료 안에 넣는다. 파일만 떨어져 나가도 출처가 따라가야 한다 */
  JSON.stringify({ 출처, 통계: { ...통계, 검산안맞은예: undefined }, 자료 }, null, 1),
);
console.log('\n저장했다 — archive/raw/kosis · src/data/100yearmap/voc-series-outcomes.json');
