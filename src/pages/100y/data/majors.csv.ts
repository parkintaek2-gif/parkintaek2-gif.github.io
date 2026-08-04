import type { APIRoute } from 'astro';
import { toCsv, csvResponse, type Column } from '../../../lib/csv';
import majors from '../../../data/100yearmap/pages-major.json';

/**
 * /data/majors.csv — 전국 고등학교 학과 925종
 *
 * ⛔ `전국순위` 는 데이터에 있지만 **열로 내보내지 않는다.** 그건 정렬용이다.
 *    지면에서 안 쓴다고 해 놓고 표로 흘리면 같은 일이다.
 *
 * ⚠ 취업 수치는 **학과 하나의 값이 아니다.** 특성화고·마이스터고 등 **학교유형 전체**의 값이다.
 *    `취업수치_적용단위` 열을 반드시 함께 낸다. 이 열이 없으면 받는 쪽이
 *    「이 학과의 취업률」로 읽고, 그러면 **우리가 표로 거짓말한 것**이 된다.
 *
 * ⚠ `계열` 은 학과 이름을 보고 **우리가 추정**한 값이다. 원자료에 있던 값이 아니다.
 *    `계열_추정여부` 로 밝힌다.
 */
const cols: Column<any>[] = [
  { key: '학과명', get: (m) => m.title },
  { key: '계열', get: (m) => m.계열 },
  { key: '계열_추정여부', get: (m) => (m.계열추정 ? '추정' : '원자료') },
  { key: '전국개설학교수', get: (m) => m.전국개설교수 },
  { key: '최다개설지역', get: (m) => m.최다지역 },

  { key: '취업수치_적용단위', get: (m) => m.취업?.적용단위 },
  { key: '취업수치_기준연도', get: (m) => m.취업?.기준연도 },
  { key: '유지취업률_1년', get: (m) => m.취업?.수치?.['1차유지취업률'] },
  { key: '유지취업률_2년', get: (m) => m.취업?.수치?.['2차유지취업률'] },
  { key: '유지취업률_1년_전체평균', get: (m) => m.취업?.전체평균?.['1차유지취업률'] },
  { key: '유지취업률_2년_전체평균', get: (m) => m.취업?.전체평균?.['2차유지취업률'] },
  { key: '취업수치_대상졸업자수', get: (m) => m.취업?.수치?.졸업자 },

  { key: '출처_학과', get: (m) => m.출처 },
  { key: '출처_취업', get: (m) => m.취업?.출처 },
  { key: '주소', get: (m) => `https://100yearmap.com${m.url}` },
];

export const GET: APIRoute = () => csvResponse('100yearmap-majors.csv', toCsv(cols, majors as any[]));
