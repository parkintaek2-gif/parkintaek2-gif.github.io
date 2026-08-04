/**
 * attach-employment.mjs — 학과·학교 페이지에 KOSIS 취업·유지취업 수치를 붙인다
 *
 * 백년지도 스토리보드 P1 의 ❶「한 줄 답」과 ❷「세 숫자」가 여기서 나온다.
 *   ❶ 「졸업 1년 뒤에도 그 자리에 남아 있는 비율 82.0%」 + 전체 평균과의 비교
 *   ❷ 취업률 · 유지취업률 · (중도탈락률은 대학알리미가 와야 한다)
 *
 * ⚠ 지금 붙는 것은 **계열 단위**다. 학과 하나하나의 숫자가 아니다.
 *   화면에 반드시 그렇게 밝힌다 — 「이 학과가 속한 공업계열 전체의 수치입니다」.
 *   ⛔ 계열 수치를 학과 수치인 것처럼 보이게 하지 않는다.
 *
 * ⚠ 「몇 위」를 만들지 않는다 (사장님 지시 2026-08-04).
 *   「무한 경쟁으로 아이들을 줄세우는」 것이 우리가 하지 않기로 한 일이다.
 *   전체 평균과의 **차이**는 판단 재료라 준다. 순위표는 만들지 않는다.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = join(ROOT, 'archive', '100yearmap');
const KOSIS = join(ROOT, 'archive', 'raw', 'kosis');

const readJson = async (p) => {
  const t = await readFile(p, 'utf8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t);
};

const num = (v) => (v === null || v === undefined || v === '' || v === '-' ? null : Number(v));

async function main() {
  const 유지 = await readJson(join(KOSIS, 'DT_920024_3N_013.json'));

  // 최신 연도만 쓴다. 여러 해를 섞으면 무슨 해 숫자인지 화면에서 흐려진다.
  const 최신 = [...new Set(유지.rows.map((r) => r.PRD_DE))].sort().at(-1);
  const rows = 유지.rows.filter((r) => r.PRD_DE === 최신 && (r.C2_NM === '계' || !r.C2_NM));

  /** 학교유형(전체/특성화고/마이스터고) → 수치 */
  const pick = (유형) => {
    const g = rows.filter((r) => r.C1_NM === 유형);
    const v = (nm) => num(g.find((r) => r.ITM_NM === nm)?.DT);
    return {
      졸업자: v('졸업자'),
      '1차유지취업률': v('1차 유지취업률'),
      '2차유지취업률': v('2차 유지취업률'),
      '3차유지취업률': v('3차 유지취업률'),
    };
  };

  const 전체 = pick('전체');
  const 유형별 = { 특성화고: pick('특성화고'), 마이스터고: pick('마이스터고') };

  /** NEIS 고교유형에는 **마이스터고 항목이 없다** (일반고·특성화고·특목고·자율고 넷뿐).
   *  그래서 마이스터고 32곳이 특목고·특성화고로 흩어져 들어가 있고,
   *  그대로 두면 KOSIS 의 마이스터고 수치(88.1 → 71.5)가 한 곳에도 안 붙는다.
   *  학교 **이름**에 「마이스터」가 있으면 마이스터고로 본다 — 교명은 지정 절차를 거친 공식 명칭이다.
   *  ⚠ 이름으로 정한 것이라 화면에 「학교 이름으로 판단했다」고 밝힌다. */
  const 유형판정 = (p) => (/마이스터/.test(p.title) ? '마이스터고' : p.고교유형);

  const 공통 = {
    기준연도: 최신,
    출처: '국가데이터처 KOSIS · 교육부 「직업계고 졸업자 취업통계」',
    표: 'DT_920024_3N_013',
    단위: '%',
    '⚠단위설명': '1차 = 취업 후 약 1년 시점, 2차 = 약 2년 시점에도 고용·건강보험 자격이 유지된 비율',
    전체평균: 전체,
  };

  // ── 학교 페이지 ──────────────────────────────────────────────────────
  const schools = await readJson(join(PAGES, 'pages-school.json'));
  let 붙은학교 = 0;
  const s2 = schools.map((p) => {
    const 유형 = 유형판정(p);
    const v = 유형별[유형];
    if (!v || v['1차유지취업률'] == null) return p;
    붙은학교 += 1;
    return {
      ...p,
      취업: {
        ...공통,
        적용단위: `${유형} 전체`,
        유형판정근거: 유형 === p.고교유형 ? 'NEIS 고교유형' : 'NEIS 에 마이스터고 항목이 없어 학교 이름으로 판단',
        '⚠주의': '이 학교 하나의 수치가 아니라 같은 학교유형 전체의 수치입니다.',
        수치: v,
        전체평균과의차이: {
          '1차': +(v['1차유지취업률'] - 전체['1차유지취업률']).toFixed(1),
          '2차': v['2차유지취업률'] != null && 전체['2차유지취업률'] != null
            ? +(v['2차유지취업률'] - 전체['2차유지취업률']).toFixed(1) : null,
        },
        // ⭐ 이 서비스의 존재 이유 — 취업하고 나서 얼마나 남는가
        '1차에서2차로_빠지는폭': v['1차유지취업률'] != null && v['2차유지취업률'] != null
          ? +(v['1차유지취업률'] - v['2차유지취업률']).toFixed(1) : null,
      },
    };
  });

  // ── 학과 페이지 ──────────────────────────────────────────────────────
  // 계열 단위 수치는 DT_920024_3N_007(계열별 졸업현황)에 졸업자만 있고 유지취업률이 없다.
  // 그래서 학과 페이지에는 「특성화고 전체」 수치를 붙이고, 계열은 규모(졸업자)만 붙인다.
  // ⬜ 계열별 유지취업률은 아직 못 찾았다. 대학알리미가 오면 대학 축이 따로 붙는다.
  const 계열졸업 = await readJson(join(KOSIS, 'DT_920024_3N_007.json'));
  const 계열최신 = [...new Set(계열졸업.rows.map((r) => r.PRD_DE))].sort().at(-1);
  const 계열규모 = {};
  for (const r of 계열졸업.rows) {
    if (r.PRD_DE !== 계열최신) continue;
    const n = num(r.DT);
    if (n == null) continue;
    계열규모[r.C1_NM] = Math.max(계열규모[r.C1_NM] ?? 0, n);
  }

  const majors = await readJson(join(PAGES, 'pages-major.json'));
  let 붙은학과 = 0;
  const m2 = majors.map((p) => {
    const v = 유형별.특성화고;
    if (v['1차유지취업률'] == null) return p;
    붙은학과 += 1;
    return {
      ...p,
      취업: {
        ...공통,
        적용단위: '특성화고 전체',
        '⚠주의': '이 학과 하나의 수치가 아니라 특성화고 전체의 수치입니다. 학과별 수치는 아직 없습니다.',
        수치: v,
        '1차에서2차로_빠지는폭': +(v['1차유지취업률'] - v['2차유지취업률']).toFixed(1),
      },
      계열규모: p.계열 && 계열규모[p.계열] != null
        ? { 계열: p.계열, 졸업자: 계열규모[p.계열], 기준연도: 계열최신, 출처: 'KOSIS DT_920024_3N_007' }
        : null,
    };
  });

  await writeFile(join(PAGES, 'pages-school.json'), JSON.stringify(s2), 'utf8');
  await writeFile(join(PAGES, 'pages-major.json'), JSON.stringify(m2), 'utf8');

  console.log(`기준연도 ${최신}`);
  console.log(`전체     1차 ${전체['1차유지취업률']}%  2차 ${전체['2차유지취업률']}%  (졸업자 ${전체.졸업자?.toLocaleString()}명)`);
  for (const [k, v] of Object.entries(유형별)) {
    console.log(`${k.padEnd(6)}  1차 ${v['1차유지취업률']}%  2차 ${v['2차유지취업률']}%  → 빠지는 폭 ${(v['1차유지취업률'] - v['2차유지취업률']).toFixed(1)}%p`);
  }
  console.log(`\n붙은 학교 페이지 ${붙은학교}/${schools.length} · 학과 페이지 ${붙은학과}/${majors.length}`);
  console.log(`계열 규모(${계열최신}): ${Object.entries(계열규모).filter(([k]) => k !== '총계').sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v.toLocaleString()}`).join(' · ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
