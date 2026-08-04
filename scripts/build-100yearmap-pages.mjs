/**
 * build-100yearmap-pages.mjs — 백년지도 1단계 페이지 데이터를 만든다
 *
 * 사장님 지시(2026-08-04) — 「무료 서비스만 먼저 풀어. 검색 seo 위해 콘텐트를 조금씩 올리는 게 낫지 않니?」
 * 승인된 순서: 1단계 = 특성화고 + 학과. 초등 6,341개는 진로 검색어가 없어 올리지 않는다.
 *
 * 입력  archive/raw/neis/school-info.json   NEIS 학교기본정보 12,665
 *       archive/raw/neis/school-major.json  NEIS 학교학과정보 18,169
 * 출력  archive/100yearmap/pages-school.json  학교 페이지
 *       archive/100yearmap/pages-major.json   학과 페이지
 *       archive/100yearmap/summary.json       집계
 *
 * ⚠ 페이지 한 장마다 「우리만 있는 값」이 최소 하나 있어야 한다.
 *   원자료를 그대로 옮긴 페이지는 색인이 안 되고 사이트 평가만 깎는다.
 *   그래서 학교 페이지에는 「그 학교 학과가 어디에 얼마나 있나」를,
 *   학과 페이지에는 「전국 몇 개교·몇 위·어느 지역에 몰려 있나」를 계산해 붙인다.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IN = join(ROOT, 'archive', 'raw', 'neis');
const OUT = join(ROOT, 'archive', '100yearmap');

/** 학과명이 아닌 것 — 교육과정 구분값이라 진로 검색어가 되지 않는다.
 *  ⚠ 이걸 안 거르면 「일반학과」 페이지가 2,461개교짜리 최상위 페이지가 된다. */
const NOT_A_MAJOR = new Set([
  '일반학과', '공통과정', '공통', '인문사회과정', '자연과정', '보통과',
  '인문', '자연', '공통과정(전문계)', '직업과정', '해당없음', '없음',
]);

const isRealMajor = (name) => {
  const n = (name || '').trim();
  return n.length > 1 && !NOT_A_MAJOR.has(n);
};

/** 학과명 정규화 — 「국제 / 국제과 / 국제과정 / 국제학과」를 하나로 묶는다.
 *  ⚠ 실측(2026-08-04) 효과는 3.8% 뿐이다. 2,859 → 2,751.
 *  「3D디자인과」와 「3D융합디자인과」는 규칙으로 못 묶는다 — 실제로 다른 이름이다.
 *  특성화고는 학과명을 학교마다 고유하게 짓는다. 그래서 정규화만으로는 안 되고
 *  아래 MIN_SCHOOLS 로 잘라야 한다. */
const normKey = (s) => (s || '').trim()
  .replace(/\s/g, '')
  .replace(/[()（）[\]]/g, '')
  .replace(/[·・\-/]/g, '')
  .replace(/(과정|코스|전공|학과|과)$/, '')
  .replace(/(주간|야간|일반)$/, '');

/** 독립 페이지를 만들 최소 개설 학교 수.
 *  사장님 지시(2026-08-04) — 「더 포괄적으로 해도 돼」. 3 → 2 로 내렸다.
 *  ⚠ 1개교짜리까지 열면 얇은 페이지가 대량으로 생겨 사이트 전체 평가가 내려간다.
 *  그 선만 지킨다. 1개교 학과는 학교 페이지 안에 이름으로만 남기고 링크를 안 건다.
 *  대학알리미(취업률)가 들어오면 1개교짜리도 얇지 않게 되므로 그때 1 로 내린다. */
const MIN_SCHOOLS = 2;

/** 페이지를 만들 학교 범위.
 *  사장님 지시로 특성화고(521)에서 고등학교 전체(2,408)로 넓혔다.
 *  ⛔ 초등학교 6,341 은 넣지 않는다 — 「대학 이후」 축과 멀고 진로 검색어가 되지 않는다.
 *  중학교 3,328 은 다음 단계다. */
const TARGET_KINDS = new Set(['고등학교']);

/** URL 슬러그 — 한글은 그대로 두고 공백·괄호만 정리한다.
 *  한글 URL 은 네이버·구글 모두 색인한다. 로마자로 바꾸면 오히려 검색어와 멀어진다. */
const slug = (s) => (s || '').trim()
  .replace(/[()[\]{}]/g, '')
  .replace(/[·・/\\]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

/** ⚠ PowerShell 로 저장한 JSON 에 BOM(﻿)이 붙어 있다. JSON.parse 가 이걸로 죽는다. */
async function readJson(p) {
  const t = await readFile(p, 'utf8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
}

async function main() {
  const schoolDoc = await readJson(join(IN, 'school-info.json'));
  const schools = schoolDoc.rows;
  const majors = (await readJson(join(IN, 'school-major.json'))).rows;

  // ── 1단계 대상: 고등학교 전체 ─────────────────────────────────────────
  const target = schools.filter((s) => TARGET_KINDS.has(s.SCHUL_KND_SC_NM));

  // 학교코드 → 학과 목록
  const majorsBySchool = new Map();
  for (const m of majors) {
    if (!isRealMajor(m.DDDEP_NM)) continue;
    const k = m.SD_SCHUL_CODE;
    if (!majorsBySchool.has(k)) majorsBySchool.set(k, new Set());
    majorsBySchool.get(k).add(m.DDDEP_NM.trim());
  }

  // 학과 → 개설 학교. 정규화 키로 묶되, 표시 이름은 그 묶음에서 제일 많이 쓰인 표기를 쓴다.
  // (특성화고에 한정하지 않는다 — 전국 분포를 보여야 페이지에 값이 산다)
  const schoolByCode = new Map(schools.map((s) => [s.SD_SCHUL_CODE, s]));
  const byKey = new Map(); // normKey → { schools:Map, names:Map(표기→횟수) }
  for (const m of majors) {
    if (!isRealMajor(m.DDDEP_NM)) continue;
    const raw = m.DDDEP_NM.trim();
    const key = normKey(raw);
    if (!key) continue;
    const sc = schoolByCode.get(m.SD_SCHUL_CODE);
    if (!sc) continue;
    if (!byKey.has(key)) byKey.set(key, { schools: new Map(), names: new Map() });
    const e = byKey.get(key);
    e.schools.set(sc.SD_SCHUL_CODE, sc);
    e.names.set(raw, (e.names.get(raw) || 0) + 1);
  }

  // 표시 이름 확정 + 원자료 표기 목록 보존(「우리가 묶었다」는 것을 화면에 밝히기 위해)
  const byMajor = new Map();
  const nameVariants = new Map();
  const keyOfName = new Map();
  for (const [key, e] of byKey) {
    const display = [...e.names.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
    byMajor.set(display, e.schools);
    nameVariants.set(display, [...e.names.keys()].sort((a, b) => a.localeCompare(b, 'ko')));
    for (const raw of e.names.keys()) keyOfName.set(raw, display);
  }

  // 학과 규모 순위 — 「전국 몇 위」가 우리만 있는 값이다
  const majorRank = [...byMajor.entries()]
    .map(([name, m]) => ({ name, count: m.size }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
  const rankOf = new Map(majorRank.map((r, i) => [r.name, i + 1]));

  // ── 학교 페이지 ──────────────────────────────────────────────────────
  const schoolPages = target.map((s) => {
    const mine = [...(majorsBySchool.get(s.SD_SCHUL_CODE) || [])].sort((a, b) => a.localeCompare(b, 'ko'));
    return {
      url: `/school/${s.SD_SCHUL_CODE}`,
      title: s.SCHUL_NM,
      titleEn: s.ENG_SCHUL_NM || null,
      code: s.SD_SCHUL_CODE,
      종류: s.SCHUL_KND_SC_NM,
      고교유형: s.HS_SC_NM,
      지역: s.LCTN_SC_NM,
      교육청: s.ATPT_OFCDC_SC_NM,
      설립: s.FOND_SC_NM,
      공학: s.COEDU_SC_NM,
      주소: [s.ORG_RDNMA, s.ORG_RDNDA].filter(Boolean).join(' ').trim(),
      홈페이지: s.HMPG_ADRES || null,
      설립일: s.FOND_YMD || null,
      // ⭐ 우리만 있는 값
      // ⚠ 개설 학교가 MIN_SCHOOLS 미만인 학과는 독립 페이지가 없으므로 링크를 걸지 않는다.
      //   이름은 그대로 보여준다 — 그 학교에 실제로 있는 학과를 숨기면 안 된다.
      학과: mine.map((raw) => {
        const display = keyOfName.get(raw) ?? raw;
        const n = byMajor.get(display)?.size ?? 0;
        return {
          name: raw,
          url: n >= MIN_SCHOOLS ? `/major/${slug(display)}` : null,
          전국개설교수: n,
          전국순위: n >= MIN_SCHOOLS ? (rankOf.get(display) ?? null) : null,
        };
      }),
      학과수: mine.length,
      같은지역_고교수: target.filter((t) => t.LCTN_SC_NM === s.LCTN_SC_NM).length,
      출처: 'NEIS 교육정보 개방 포털',
      기준시각: null, // 수집 시각은 summary 에 둔다
    };
  }).sort((a, b) => a.title.localeCompare(b.title, 'ko'));

  // ── 학과 페이지 ──────────────────────────────────────────────────────
  // MIN_SCHOOLS 미만은 독립 페이지를 만들지 않고 thin 목록으로 따로 뺀다.
  // 대학알리미(취업률)가 들어오면 그때 다시 살릴 수 있다 — 그때는 얇지 않다.
  const thin = [...byMajor.entries()]
    .filter(([, m]) => m.size < MIN_SCHOOLS)
    .map(([name, m]) => ({ title: name, 개설교수: m.size, 표기: nameVariants.get(name) }))
    .sort((a, b) => b.개설교수 - a.개설교수 || a.title.localeCompare(b.title, 'ko'));

  const majorPages = [...byMajor.entries()].filter(([, m]) => m.size >= MIN_SCHOOLS).map(([name, schoolMap]) => {
    const list = [...schoolMap.values()];
    const byRegion = {};
    for (const s of list) byRegion[s.LCTN_SC_NM] = (byRegion[s.LCTN_SC_NM] || 0) + 1;
    const regions = Object.entries(byRegion).sort((a, b) => b[1] - a[1]);
    return {
      url: `/major/${slug(name)}`,
      title: name,
      // ⭐ 우리만 있는 값
      전국개설교수: list.length,
      전국순위: rankOf.get(name),
      지역분포: regions.map(([지역, 수]) => ({ 지역, 수 })),
      최다지역: regions[0]?.[0] ?? null,
      학교: list.map((s) => ({
        name: s.SCHUL_NM,
        url: `/school/${s.SD_SCHUL_CODE}`,
        지역: s.LCTN_SC_NM,
        고교유형: s.HS_SC_NM || s.SCHUL_KND_SC_NM,
        설립: s.FOND_SC_NM,
      })).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
      출처: 'NEIS 교육정보 개방 포털',
      // ⚠ 우리가 표기를 묶었다는 사실을 화면에 밝힌다. 숨기면 데이터를 몰래 고친 것이 된다.
      원자료표기: nameVariants.get(name),
      // ⬜ 아직 못 채운 것 — 대학알리미가 들어오면 여기에 붙는다
      대학연계: null,
      취업률: null,
    };
  }).sort((a, b) => b.전국개설교수 - a.전국개설교수 || a.title.localeCompare(b.title, 'ko'));

  // ── 저장 ────────────────────────────────────────────────────────────
  await mkdir(OUT, { recursive: true });
  const 수집시각 = schoolDoc.수집시각;

  // 기준선을 바꾸면 페이지가 몇 장이 되는지 — 사장님이 조절하실 수 있게 같이 낸다
  const sizes = [...byMajor.values()].map((m) => m.size);
  const 기준선별_학과페이지수 = Object.fromEntries(
    [1, 2, 3, 5, 10].map((n) => [`${n}개교 이상`, sizes.filter((v) => v >= n).length]),
  );

  const summary = {
    생성: '1단계 — 고등학교 전체 + 학과',
    원천수집시각: 수집시각,
    기준: { MIN_SCHOOLS, TARGET_KINDS: [...TARGET_KINDS] },
    전체학교: schools.length,
    대상학교: target.length,
    대상_고교유형별: Object.fromEntries(
      Object.entries(target.reduce((a, s) => { const k = s.HS_SC_NM || '(미표기)'; a[k] = (a[k] || 0) + 1; return a; }, {}))
        .sort((a, b) => b[1] - a[1]),
    ),
    학교페이지: schoolPages.length,
    학과페이지: majorPages.length,
    총페이지: schoolPages.length + majorPages.length,
    학과가_붙은_학교: schoolPages.filter((p) => p.학과수 > 0).length,
    학과가_없는_학교: schoolPages.filter((p) => p.학과수 === 0).length,
    독립페이지_안만든_학과: thin.length,
    기준선별_학과페이지수,
    거른_교육과정값: [...NOT_A_MAJOR],
    올리지_않는_것: {
      초등학교: schools.filter((s) => s.SCHUL_KND_SC_NM === '초등학교').length,
      중학교: schools.filter((s) => s.SCHUL_KND_SC_NM === '중학교').length,
      사유: '초등은 진로 검색어가 되지 않는다. 중학교는 다음 단계',
    },
    다음단계: ['중학교 3,328', '대학알리미 들어오면 대학 학과 페이지'],
    상위학과: majorRank.slice(0, 20),
  };

  await writeFile(join(OUT, 'pages-school.json'), JSON.stringify(schoolPages), 'utf8');
  await writeFile(join(OUT, 'pages-major.json'), JSON.stringify(majorPages), 'utf8');
  await writeFile(join(OUT, 'pages-major-thin.json'), JSON.stringify(thin), 'utf8');
  await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`학교 페이지 ${schoolPages.length} · 학과 페이지 ${majorPages.length}`);
  console.log(`학과가 붙은 학교 ${summary.학과가_붙은_학교} / 없는 학교 ${summary.학과가_없는_학교}`);
  console.log(`상위 학과: ${majorRank.slice(0, 8).map((r) => `${r.name}(${r.count})`).join(' · ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
