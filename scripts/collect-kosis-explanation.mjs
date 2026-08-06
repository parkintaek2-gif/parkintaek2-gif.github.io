#!/usr/bin/env node
/**
 * collect-kosis-explanation.mjs — KOSIS **통계설명**(조사 메타)을 받아 둔다
 *
 * 왜 만드나 (2026-08-06)
 *   우리가 지면에 손으로 적어 둔 「이 숫자는 이렇게 잰 것이다」가 **원문과 어긋나 있었다.**
 *   `docs/3번-백년지도-사장님지시-0806.md` 는 직업계고를 「고용보험 자격 유지 비율」이라 적었는데,
 *   KOSIS 통계설명 원문은 **보험가입자**(직업계고) · **건강보험 직장가입자**(고등교육) 기준이다.
 *   숫자는 자동으로 받아 오면서 **정의는 사람 기억에 두고 있었다.** 그래서 어긋났다.
 *
 *   ⭐ 정의도 데이터다. 받아서 파일로 둔다.
 *
 * 이 API 는 **제공항목이 2026-08-13 에 27 → 51 로 늘어난다**(국가데이터처 공지 2026-08-06).
 *   그래서 항목을 코드에 박지 않고 **오는 대로 전부 담는다.** 늘어도 그냥 따라온다.
 *
 * ⚠ 우리 수집기(`collect-kosis-employment.mjs`)는 이 API 를 안 부른다. 그쪽은 통계표 메타·데이터다.
 *   8/13 변경으로 그 수집기가 깨질 자리는 없다 — 확인했다.
 *
 * ⚠ 응답이 **한 칸에 한 항목씩** 담긴 배열로 온다. `j[0]` 만 보면 항목 하나만 보인다.
 *   2026-08-06 에 실제로 그렇게 보고 「1개 왔다」고 잘못 읽었다. 전부 합쳐야 25개였다.
 *
 *   node scripts/collect-kosis-explanation.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..'
);
const OUT_ARCHIVE = path.join(ROOT, 'archive', 'raw', 'kosis-expl');
const OUT_SRC = path.join(ROOT, 'src', 'data', '100yearmap', 'kosis-explanation.json');

const ORG = '334'; // 교육부
/** 우리가 실제로 쓰는 표. `collect-kosis-employment.mjs` 의 TABLES 와 같은 조사다 */
const TABLES = ['DT_920024_3N_001', 'DT_920024_3N_002', 'DT_920024_3N_007', 'DT_920024_3N_013', 'DT_920024_3N_014'];

async function key() {
  const env = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
  const m = env.match(/^KOSIS_API_KEY=(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

/** &amp;lt; 처럼 두 번 이스케이프돼 온다. 원문 그대로 보여 주려면 풀어야 한다 */
const 풀기 = (s) =>
  String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

async function 설명(k, tblId) {
  const u =
    `https://kosis.kr/openapi/statisticsExplData.do?method=getList&apiKey=${k}` +
    `&orgId=${ORG}&tblId=${tblId}&metaItm=All&format=json&jsonVD=Y`;
  const r = await fetch(u);
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    throw new Error(`JSON 이 아니다 (HTML 오류쪽일 수 있다): ${t.replace(/\s+/g, ' ').slice(0, 160)}`);
  }
  if (!Array.isArray(j)) throw new Error(`배열이 아니다: ${JSON.stringify(j).slice(0, 200)}`);

  // ⚠ 한 칸에 한 항목씩 온다. 전부 합친다
  const 합침 = {};
  for (const 칸 of j) for (const [k2, v] of Object.entries(칸)) if (v != null && v !== '') 합침[k2] = 풀기(v);
  return { 항목수: Object.keys(합침).length, 값: 합침 };
}

async function main() {
  const k = await key();
  await fs.mkdir(OUT_ARCHIVE, { recursive: true });
  const 받은때 = new Date().toLocaleString('sv-SE'); // KST. toISOString 은 UTC 라 새벽에 어긋난다

  const 모음 = [];
  for (const t of TABLES) {
    try {
      const r = await 설명(k, t);
      await fs.writeFile(path.join(OUT_ARCHIVE, `${t}.json`), JSON.stringify(r.값, null, 1), 'utf8');
      모음.push({ tblId: t, ...r });
      console.log(`  ✅ ${t}  항목 ${r.항목수}개  ${r.값.statsNm ?? ''}`);
    } catch (e) {
      console.log(`  ⛔ ${t}  ${e.message}`);
      모음.push({ tblId: t, 오류: e.message });
    }
  }

  // 같은 조사라 설명이 같다. 지면에서 쓸 것은 한 벌이면 된다
  const 대표 = 모음.find((m) => m.값)?.값 ?? null;
  await fs.writeFile(
    OUT_SRC,
    JSON.stringify(
      {
        출처: {
          기관: '국가데이터처 KOSIS',
          서비스: '통계설명 조회 (statisticsExplData)',
          기관ID: ORG,
          이용허락: 'KOSIS 통계정보 활용약관 제8조 — 상업적 활용 가능',
          받은때,
          알림: '제공항목이 2026-08-13 에 27 → 51 로 늘어난다(국가데이터처 공지 2026-08-06). 오는 대로 전부 담는다',
        },
        표별: 모음.map((m) => ({ tblId: m.tblId, 항목수: m.항목수 ?? 0, 오류: m.오류 ?? null })),
        설명: 대표,
      },
      null,
      1
    ),
    'utf8'
  );
  console.log(`\n  → ${path.relative(ROOT, OUT_SRC)}  (지면이 읽는 자리)`);
  console.log(`  → ${path.relative(ROOT, OUT_ARCHIVE)}  (원본 보관)`);
}

main().catch((e) => {
  console.error('⛔', e.message);
  process.exit(1);
});
