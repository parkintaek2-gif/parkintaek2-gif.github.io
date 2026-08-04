/**
 * 대학알리미(한국대학교육협의회 대학정보공시) 수집
 *
 * 2026-08-04 확보. data.go.kr 개발계정, 만료 2028-08-04.
 * ⭐ 이용허락범위 **제한 없음** — 고용24(공공누리 4유형)와 달리 상업 이용이 된다.
 *    이 한 줄 확인하는 데 반나절을 날린 적이 있다. 앞으로도 수집 전에 먼저 적는다.
 *
 * 서비스 3종 (전부 B340014, 키는 하나로 공통)
 *   BasicInformationService_2   대학 기본 정보 · 코드표      10개 기능
 *   StudentService              학생 현황(중도탈락·취업)     27개 기능
 *   EducationResearchService    교원·연구 현황               22개 기능
 *
 * ⚠ 오퍼레이션 이름 세 갈래를 구분한다 — 이걸 모르면 totalCount 0 만 본다
 *   getNotice*      우리대학경쟁력   schlId 하나짜리
 *   getComparison*  대학비교통계     **svyYr + schlId 둘 다 필수**
 *   getRegional*    지역별통계       svyYr 없이도 나온다 (전국 집계)
 *
 * ⚠ 일일 트래픽 **오퍼레이션당 1,000회**. 대학이 377개라 한 지표당 377회면 하루에 두 지표가 한계다.
 *   그래서 받은 것은 무조건 archive/ 에 남기고 다시 부르지 않는다.
 *
 * 출력 — 원자료는 archive/(gitignore), 빌드가 읽는 것만 src/data/ 로 간다.
 *   ⚠ 이 규칙을 어겨서 배포를 3시간 막은 적이 있다. src/ 에서 archive/ 를 import 하지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'archive', 'raw', 'alimi');

const KEY = (fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^DATAGO_KEY_ALIMI=(.*)$/m) || [])[1]?.trim();
if (!KEY) throw new Error('.env 에 DATAGO_KEY_ALIMI 가 없다');

const BASE = 'https://apis.data.go.kr/B340014';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** XML 을 얕게 판다. 대학알리미 응답은 <item> 안이 전부 평평한 스칼라라 이걸로 충분하다 */
const parseItems = (xml) => {
  const out = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const o = {};
    for (const f of m[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) o[f[1]] = f[2].trim();
    out.push(o);
  }
  return out;
};

let calls = 0;
async function call(svc, op, params = {}, tries = 3) {
  const q = new URLSearchParams({ serviceKey: KEY, pageNo: '1', numOfRows: '1000', ...params });
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${BASE}/${svc}${op}?${q}`);
      const t = await r.text();
      calls++;
      const code = (t.match(/<resultCode>(\d+)</) || [, '?'])[1];
      // ⚠ data.go.kr 은 오류도 HTTP 200 으로 준다. 상태코드만 보면 성공으로 착각한다
      if (code !== '00') {
        const msg = (t.match(/<resultMsg>([^<]*)</) || t.match(/<returnAuthMsg>([^<]*)</) || [, code])[1];
        throw new Error(`${op} resultCode=${code} ${msg}`);
      }
      return { items: parseItems(t), total: Number((t.match(/<totalCount>(\d+)</) || [, 0])[1]) };
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

const save = (name, data) => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 1));
  const n = Array.isArray(data) ? data.length : Object.keys(data).length;
  console.log(`  저장 ${name.padEnd(28)} ${n.toLocaleString()}건`);
};

// ─────────────────────────────────────────────────────────────
console.log('① 코드표 — 이게 있어야 나머지 응답의 숫자를 사람 말로 읽는다');
const codes = {};
for (const [k, op] of [
  ['지역', '/getCodeByRegion'],
  ['설립', '/getCodeByFound'],
  ['학교종류', '/getCodeByType'],
  ['학교구분', '/getCodeByKind'],
  ['지표', '/getKeyIndicatorCode'],
  ['공시연도', '/getNoticeSvyYear'],
]) {
  const { items } = await call('BasicInformationService_2', op);
  codes[k] = items;
  console.log(`  ${k.padEnd(6)} ${items.length}건`);
}
save('codes.json', codes);

const 연도 = codes.공시연도.map((x) => x.yearVal).sort().reverse();
console.log(`  공시연도 목록 ${연도.join(', ')}`);

// ─────────────────────────────────────────────────────────────
console.log('\n② 대학 목록 — schlId 가 나머지 전부의 열쇠다');
// ⚠ 목록에 있는 최신 연도가 **비어 있을 수 있다.** 2026 은 공시연도 목록에 뜨지만 0건이었다.
//    「연도가 있다」와 「그 해 자료가 채워졌다」는 다른 말이다. 실제로 값이 오는 해까지 내려간다.
let 최신 = null;
let 대학 = [];
for (const y of 연도) {
  const { items } = await call('BasicInformationService_2', '/getUniversityCode', { svyYr: y });
  console.log(`  ${y}년 ${items.length}개교${items.length ? ' ←  이 해를 쓴다' : ' (아직 비어 있다)'}`);
  if (items.length) { 최신 = y; 대학 = items; break; }
}
if (!최신) throw new Error('어느 공시연도에도 대학 목록이 없다');
save('universities.json', { svyYr: 최신, list: 대학 });
console.log(`  표본:`, JSON.stringify(대학[0]));

// ─────────────────────────────────────────────────────────────
console.log('\n③ 지역별 통계 — 학교당 호출이 아니라 한 번에 끝난다. 트래픽이 싸다');
const 지역지표 = [
  ['StudentService', '/getRegionalDropOutStudentCrntSt', '중도탈락'],
  ['StudentService', '/getRegionalGraduateEnterFindJobCrntSt', '졸업생진학취업'],
  ['StudentService', '/getRegionalEnrolledStudentCrntSt', '재적학생'],
  ['StudentService', '/getRegionalFreshmanEnsureCrntSt', '신입생충원'],
  ['StudentService', '/getRegionalStudentOnALeaveOfAbsence', '휴학생'],
];
const 지역 = {};
for (const [svc, op, name] of 지역지표) {
  try {
    const { items, total } = await call(svc, op, { svyYr: 최신 });
    지역[name] = items;
    console.log(`  ${name.padEnd(8)} ${total}건`);
  } catch (e) {
    console.log(`  ${name.padEnd(8)} ✗ ${e.message}`);
  }
  await sleep(250);
}
save('regional.json', 지역);

console.log(`\n호출 ${calls}회. 원자료 → ${path.relative(ROOT, OUT)}`);
console.log('⚠ 학교별(Comparison) 수집은 학교당 1회라 377회씩 든다. 별도 스크립트로 나눈다.');
