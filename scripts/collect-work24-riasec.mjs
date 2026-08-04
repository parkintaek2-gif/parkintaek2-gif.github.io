/**
 * collect-work24-riasec.mjs — 고용24 직업 상세에서 RIASEC(흥미유형)을 받아온다
 *
 * 왜 필요한가 —
 *   1번(klifemap)이 `career-bridge.json` 의 `riasec` 칸을 **비워서** 넘겼다.
 *   「국제 표준값이라 틀리면 학과·학교 추천까지 그대로 어긋난다. 지어내지 말라」는 판단이었고
 *   그게 맞다. 그래서 **원자료에서 받아온다.**
 *
 * 어떻게 찾았나 (2026-08-04, 하루 걸렸다. 다시 헤매지 않게 적어 둔다)
 *   ⚠ 고용24는 **키 하나가 서비스 하나만** 연다. WORK24_KEY_JOB → 212L01 뿐이다.
 *   ⚠ HTTP 200 에 자체 오류코드를 싣는다. 상태코드만 보면 성공으로 착각한다.
 *   오류가 단계적으로 바뀌는 것을 타고 파라미터를 역추적했다:
 *     target 없음        → 009 target 정보가 바르지 않습니다
 *     target=JOBDTL      → 027 직업구분코드(jobGb)
 *     + jobGb=1          → 014 직업코드를 지정하지 않았습니다
 *     + jobCd=K000000847 → 015 상세구분코드(dtlGb)
 *     + dtlGb=6          → ✅ 성격·흥미·가치관
 *
 *   상세 7종 — 1 요약 · 2 하는일 · 3 되는길(학력·전공) · 4 연봉전망
 *              5 능력·지식·환경 · 6 성격·흥미·가치관 · 7 업무활동
 *   ⭐ dtlGb=3 의 `edubg` 가 학과와 잇는 다리다. 다음 작업이 그것이다.
 *
 * ⛔ 여섯 유형을 점수째로 다 넘긴다. 「상위 3개」로 잘라 보내지 않는다.
 *   자르는 순간 순위가 없는 것에 순위가 생긴다 — 그게 줄세우기다.
 *   1번도 오늘 같은 이유로 상위 3개 → 여섯 유형 전부로 바꿨다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'archive', 'raw', 'work24');
const BASE = 'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do';

/** 한글 유형명 → RIASEC 한 글자. 응답이 「진취형(Enterprising)」 꼴로 온다 */
const TYPE = {
  Realistic: 'R',
  Investigative: 'I',
  Artistic: 'A',
  Social: 'S',
  Enterprising: 'E',
  Conventional: 'C',
};

const readJson = async (p) => {
  const t = await readFile(p, 'utf8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
};

const key = async () => {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^WORK24_KEY_JOB=(.+)$/m);
  if (!m) throw new Error('.env 에 WORK24_KEY_JOB 이 없다');
  return m[1].trim();
};

/** 이름 비교용 정규화 — 「의료코디네이터」와 「의료 코디네이터」를 같게 본다 */
const norm = (s) => s.replace(/\s|·|\(.*?\)/g, '');

/** 1번 목록에는 합성 이름이 있다 — 「공연기획자·영화기획자·음반기획자」.
 *  통째로는 안 잡히니 `·` 로 쪼개서도 찾아본다. 글 제목 꼴(「○○ 연봉·전망·전공학과」)도
 *  앞머리만 떼어 본다. ⚠ 이건 **우리가 만든 매칭**이라 결과에 어떤 이름으로 붙었는지
 *  (`work24Nm`) 반드시 같이 적는다. 1번이 검증할 수 있어야 한다. */
const candidates = (name) => {
  const out = [name];
  if (name.includes('·')) out.push(...name.split('·'));
  const head = name.split(/\s|·/)[0];
  if (head && head !== name) out.push(head);
  return [...new Set(out.map((s) => s.trim()).filter(Boolean))];
};

async function riasecOf(k, jobCd) {
  const url = `${BASE}?authKey=${k}&returnType=XML&target=JOBDTL&jobGb=1&jobCd=${jobCd}&dtlGb=6`;
  const xml = await (await fetch(url)).text();

  // ⚠ HTTP 200 이어도 오류일 수 있다. 반드시 messageCd 를 본다.
  const err = xml.match(/<messageCd>([^<]*)<\/messageCd>/);
  if (err) return { error: `${err[1]} ${(xml.match(/<message>([^<]*)</) || [])[1] ?? ''}`.trim() };

  const scores = {};
  for (const b of xml.matchAll(/<jobIntrstCmpr>([\s\S]*?)<\/jobIntrstCmpr>/g)) {
    const nm = (b[1].match(/<intrstNmCmpr>([^<]*)</) || [])[1] ?? '';
    const sc = Number((b[1].match(/<intrstStatusCmpr>([^<]*)</) || [])[1]);
    const en = (nm.match(/\(([A-Za-z]+)\)/) || [])[1];
    const letter = TYPE[en];
    if (letter && Number.isFinite(sc)) scores[letter] = sc;
  }
  return Object.keys(scores).length ? { scores } : { error: '흥미 항목이 비어 있다' };
}

async function main() {
  const k = await key();
  const jobs = (await readJson(join(OUT, 'job-codes.json'))).rows;
  const bridge = await readJson(join(ROOT, '..', 'klifemap', 'content', 'career-bridge.json'));

  const idx = new Map(jobs.map((j) => [norm(j.jobNm), j]));
  const findJob = (name) => {
    for (const c of candidates(name)) {
      const n = norm(c);
      if (n.length < 2) continue;
      if (idx.has(n)) return idx.get(n);
      const k2 = [...idx.keys()].find((x) => x.includes(n) || n.includes(x));
      if (k2) return idx.get(k2);
    }
    return null;
  };

  // overlap 33개만이 아니라 **두 목록 전체**를 훑는다. 겹치지 않는 것도 채워 주는 게 낫다.
  const 대상 = [...new Set([...bridge.sipsungMap.map((x) => x.job), ...bridge.careerPosts.map((x) => x.job)])];
  const 결과 = [];
  const 실패 = [];

  for (const name of 대상) {
    const j = findJob(name);
    if (!j) {
      실패.push({ job: name, why: '고용24 직업 목록(492)에 이름이 없다' });
      continue;
    }
    const r = await riasecOf(k, j.jobCd);
    if (r.error) {
      실패.push({ job: name, jobCd: j.jobCd, why: r.error });
      continue;
    }
    결과.push({
      job: name,
      work24Nm: j.jobNm,
      jobCd: j.jobCd,
      jobClcdNM: j.jobClcdNM,
      // ⛔ 여섯 유형 전부. 상위 3개로 자르지 않는다
      riasec: r.scores,
    });
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  await mkdir(OUT, { recursive: true });
  await writeFile(
    join(OUT, 'riasec-by-job.json'),
    JSON.stringify(
      {
        출처: '고용24 OpenAPI 212L01 target=JOBDTL dtlGb=6 (성격·흥미·가치관)',
        수집일: '2026-08-04',
        단위: '흥미 유형별 점수 (원자료 그대로. 척도 설명은 고용24 문서에 없어 아직 못 쟀다)',
        '⚠': '여섯 유형 전부를 넘긴다. 상위 3개로 자르면 없던 순위가 생긴다',
        받은직업: 결과.length,
        못받은직업: 실패.length,
        rows: 결과,
        실패,
      },
      null,
      1,
    ),
    'utf8',
  );

  console.log(`받음 ${결과.length} · 못 받음 ${실패.length} → archive/raw/work24/riasec-by-job.json`);
  for (const f of 실패) console.log(`  ⚠ ${f.job} — ${f.why}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
