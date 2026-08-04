/**
 * 대학알리미 — `getNotice*`(우리대학경쟁력) 계열 수집
 *
 * ⭐ 이게 `getComparison*` 보다 낫다. **공식 평균(`indctAvg`)을 같이 준다.**
 *   어제는 그걸 몰라서 335개교 값으로 **중앙값을 내가 계산**해 화면에 올렸다.
 *   틀린 값은 아니지만, 발표된 평균이 있는데 우리가 만든 값을 쓸 이유가 없다.
 *   → 앞으로 화면에는 **공식 평균**을 쓰고, 우리가 계산한 것은 쓰지 않는다.
 *
 * 응답 모양 (예: 취업률)
 * ```
 * indctId 56 · indctAvg 62.8   ← 전국 평균(공식)
 * indctVal1 1656  졸업자
 * indctVal2  887  취업자
 * indctVal3 1476  취업대상자
 * indctVal4 60.1  취업률(%) = val2/val3
 * ```
 * ⚠ `indctVal*` 의 뜻이 지표마다 다르다. 아래 표에 지표별로 적어 둔다.
 *   숫자만 보고 뜻을 짐작하지 않는다 — 그러면 화면에서 거짓말이 된다.
 *
 * ⚠ 필수 파라미터는 `svyYr` + `schlId` **둘 다**. 하나만 주면 조용히 0건이 온다.
 * ⚠ 동시 호출은 2개까지. 5개로 올리면 게이트웨이가 막는다(2026-08-04 에 384건 막혔다).
 * ⚠ 일일 트래픽은 **오퍼레이션당** 1,000회. 학교가 377이라 지표 하나에 377회다.
 *   그래서 **이어받기**로 만든다 — 성공한 것은 다시 부르지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'archive', 'raw', 'alimi');
const KEY = (fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^DATAGO_KEY_ALIMI=(.*)$/m) || [])[1]?.trim();
if (!KEY) throw new Error('.env 에 DATAGO_KEY_ALIMI 가 없다');

const readJson = (p) => {
  const t = fs.readFileSync(p, 'utf8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
};
const { svyYr, list: 대학 } = readJson(path.join(OUT, 'universities.json'));

/** 지표별로 `indctVal*` 이 무엇인지 여기 적는다. 이 표가 없으면 숫자를 못 읽는다 */
const 지표 = [
  {
    파일: 'notice-employment',
    이름: '졸업생 취업률',
    svc: 'StudentService',
    op: '/getNoticeGraduateEmploymentRate',
    뜻: { val1: '졸업자', val2: '취업자', val3: '취업대상자', val4: '취업률(%)' },
  },
  {
    파일: 'notice-wastage',
    이름: '중도탈락률',
    svc: 'StudentService',
    op: '/getNoticeStudentsWastageRate',
    뜻: { val1: '재적학생', val2: '중도탈락자', val4: '중도탈락률(%)' },
  },
  {
    파일: 'notice-freshman',
    이름: '신입생 충원율',
    svc: 'StudentService',
    op: '/getNoticeFreshmanDrafteesRate',
    뜻: { val1: '모집인원', val2: '입학자', val4: '충원율(%)' },
  },
  {
    파일: 'notice-enrolled',
    이름: '재학생 충원율',
    svc: 'StudentService',
    op: '/getNoticeEnrolledStudentDrafteesRate',
    뜻: { val1: '편제정원', val2: '재학생', val3: '(미상)', val4: '충원율(%)' },
  },
  {
    파일: 'notice-faculty',
    이름: '전임교원 확보율',
    svc: 'EducationResearchService',
    op: '/getNoticeFullTimeFacultyEnsureRate',
    뜻: { val4: '확보율(%)' }, // ⚠ 나머지는 아직 확인 못 했다
  },
];

const parseItems = (xml) => {
  const out = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const o = {};
    for (const f of m[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) o[f[1]] = f[2].trim();
    out.push(o);
  }
  return out;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(svc, op, params) {
  const q = new URLSearchParams({ serviceKey: KEY, pageNo: '1', numOfRows: '20', ...params });
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://apis.data.go.kr/B340014/${svc}${op}?${q}`);
      const t = await r.text();
      const code = (t.match(/<resultCode>(\d+)</) || [])[1];
      if (code === undefined) {
        // ⚠ 게이트웨이가 막으면 resultCode 자체가 없고 errMsg 만 온다
        const m = (t.match(/<errMsg>([^<]*)</) || [])[1];
        throw new Error(m ? `게이트웨이: ${m}` : `모르는 응답: ${t.slice(0, 80).replace(/\s+/g, ' ')}`);
      }
      if (code !== '00') throw new Error(`resultCode=${code}`);
      return parseItems(t);
    } catch (e) {
      if (i === 2) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const k = i++;
        try {
          out[k] = await fn(items[k], k);
        } catch (e) {
          out[k] = { _error: String(e.message || e) };
        }
      }
    }),
  );
  return out;
}

for (const g of 지표) {
  const dest = path.join(OUT, `${g.파일}.json`);
  let 기존 = new Map();
  if (fs.existsSync(dest)) {
    for (const r of readJson(dest).rows) if (!r._error && r.items) 기존.set(r.schlId, r);
  }
  const 남은것 = 대학.filter((u) => !기존.has(u.schlId));
  if (!남은것.length) {
    console.log(`${g.이름} — ${기존.size}개교 전부 있다. 건너뛴다`);
    continue;
  }
  console.log(`${g.이름} — 이미 ${기존.size} · 받을 것 ${남은것.length}`);
  let done = 0;
  const 새것 = await mapLimit(남은것, 2, async (u) => {
    const items = await call(g.svc, g.op, { svyYr, schlId: u.schlId });
    if (++done % 100 === 0) console.log(`  ${done}/${남은것.length}`);
    return { schlId: u.schlId, schlKrnNm: u.schlKrnNm, items };
  });
  새것.forEach((r, i) =>
    기존.set(남은것[i].schlId, r._error ? { schlId: 남은것[i].schlId, _error: r._error } : r),
  );

  const rows = 대학.map((u) => 기존.get(u.schlId));
  const 값있음 = rows.filter((r) => r.items && r.items.length).length;
  const 오류 = rows.filter((r) => r._error).length;
  fs.writeFileSync(dest, JSON.stringify({ svyYr, op: g.op, 이름: g.이름, 뜻: g.뜻, rows }, null, 1));
  console.log(`  저장 ${g.파일}.json — 값 ${값있음} · 오류 ${오류}`);
}

console.log('끝. →', path.relative(ROOT, OUT));
