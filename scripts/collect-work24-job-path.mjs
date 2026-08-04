/**
 * collect-work24-job-path.mjs — 고용24 직업 「되는 길」(dtlGb=3) 전량 수집
 *
 * ⭐ 왜 이게 백년지도의 핵심인가
 *   사장님이 정의하신 3단계 중 **2단계(하고 싶은 일의 실제와 전망)** 가 비어 있었다.
 *   1단계(케이라이프맵 적성)와 3단계(우리 학과·학교)를 이을 다리가 없었기 때문이다.
 *   `dtlGb=3` 에 **`majorCd`/`majorNm`** 이 들어 있다. 이게 그 다리다.
 *
 *     케이라이프맵 RIASEC  →  직업(492)  →  majorNm  →  NEIS 학과 925  →  학교 2,525
 *
 * 받아오는 것 (물리치료사 예시)
 *   majorNm        재활학과                    ← ⭐ 학과와 잇는 고리
 *   technKnow      「전문대학 및 대학교에 개설되어 있는 물리치료(학)과를 졸업하고…」
 *   edubg*         학력 분포 %  (전문대졸 30 · 대졸 60 · 대학원졸 10)
 *   *Dpt           전공계열 분포 % (의약 84 · 예체능 7 · 인문 3 · 사회 3 · 자연 3)
 *   certNm         물리치료사(국가전문)
 *   kecoCd/kecoNm  3065 물리 및 작업 치료사   ← 한국고용직업분류. 다른 통계와 붙는다
 *
 * ⚠ 고용24는 HTTP 200 에 자체 오류코드를 싣는다. 반드시 messageCd 를 본다.
 * ⚠ 키 하나가 서비스 하나만 연다. 이건 WORK24_KEY_JOB → 212L01 이다.
 * ⚠ 남의 서버다. 요청 사이에 간격을 둔다.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'archive', 'raw', 'work24');
const BASE = 'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do';
const 간격_ms = 120;

/** 전공계열 필드 → 사람이 읽는 이름. 응답이 영문 약어라 그대로 두면 나중에 못 읽는다 */
const 계열 = {
  cultLangDpt: '인문',
  socDpt: '사회',
  eduDpt: '교육',
  engnrDpt: '공학',
  natrlDpt: '자연',
  mediDpt: '의약',
  artphyDpt: '예체능',
};

/** 학력 필드 → 사람이 읽는 이름 */
const 학력 = {
  edubgMgraduUndr: '중졸이하',
  edubgHgradu: '고졸',
  edubgCgraduUndr: '전문대졸',
  edubgUgradu: '대졸',
  edubgGgradu: '석사',
  edubgDgradu: '박사',
};

const readJson = async (p) => {
  const t = await readFile(p, 'utf8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => (v === undefined || v === '' ? null : Number(v));

async function path3(k, jobCd) {
  const xml = await (
    await fetch(`${BASE}?authKey=${k}&returnType=XML&target=JOBDTL&jobGb=1&jobCd=${jobCd}&dtlGb=3`)
  ).text();

  const err = xml.match(/<messageCd>([^<]*)<\/messageCd>/);
  if (err) return { error: `${err[1]} ${(xml.match(/<message>([^<]*)</) || [])[1] ?? ''}`.trim() };

  const f = {};
  for (const m of xml.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)>([^<]*)<\/\1>/g)) {
    if (m[2].trim()) f[m[1]] = m[2].trim();
  }

  const pick = (map) => {
    const o = {};
    for (const [k2, label] of Object.entries(map)) {
      const v = num(f[k2]);
      if (v !== null && v > 0) o[label] = v;
    }
    return Object.keys(o).length ? o : null;
  };

  return {
    majorCd: f.majorCd ?? null,
    majorNm: f.majorNm ?? null, // ⭐ 학과와 잇는 고리
    certNm: f.certNm ?? null,
    kecoCd: f.kecoCd ?? null,
    kecoNm: f.kecoNm ?? null,
    학력분포: pick(학력),
    전공계열분포: pick(계열),
    되는길: f.technKnow ?? null,
    자격기관: f.orgNm ?? null,
  };
}

async function main() {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  const k = env.match(/^WORK24_KEY_JOB=(.+)$/m)?.[1].trim();
  if (!k) throw new Error('.env 에 WORK24_KEY_JOB 이 없다');

  const jobs = (await readJson(join(OUT, 'job-codes.json'))).rows;
  const rows = [];
  const 실패 = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const j = jobs[i];
    try {
      const d = await path3(k, j.jobCd);
      if (d.error) 실패.push({ jobNm: j.jobNm, jobCd: j.jobCd, why: d.error });
      else rows.push({ jobCd: j.jobCd, jobNm: j.jobNm, jobClcdNM: j.jobClcdNM, ...d });
    } catch (e) {
      실패.push({ jobNm: j.jobNm, jobCd: j.jobCd, why: e.message });
    }
    if ((i + 1) % 50 === 0) process.stdout.write(` ${i + 1}`);
    await sleep(간격_ms);
  }
  process.stdout.write('\n');

  const 학과있음 = rows.filter((r) => r.majorNm);
  await writeFile(
    join(OUT, 'job-path.json'),
    JSON.stringify({
      출처: '고용24 OpenAPI 212L01 target=JOBDTL dtlGb=3 (되는 길)',
      수집일: '2026-08-04',
      '⚠': '학력·전공계열 분포는 재직자 조사 기반 %다. 「이 학과를 나와야 한다」가 아니라 「실제로 이런 사람들이 하고 있다」로 읽는다',
      받음: rows.length,
      실패: 실패.length,
      학과이름이있는직업: 학과있음.length,
      rows,
      실패목록: 실패,
    }),
    'utf8',
  );

  console.log(`받음 ${rows.length} · 실패 ${실패.length} → archive/raw/work24/job-path.json`);
  console.log(`majorNm 이 있는 직업 ${학과있음.length}개 · 서로 다른 학과 ${new Set(학과있음.map((r) => r.majorNm)).size}종`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
