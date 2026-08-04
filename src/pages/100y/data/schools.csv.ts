import type { APIRoute } from 'astro';
import { toCsv, csvResponse, type Column } from '../../../lib/csv';
import schools from '../../../data/100yearmap/pages-school.json';

/**
 * /data/schools.csv — 전국 고등학교 2,525곳
 *
 * ⚠ `개설학과` 는 한 칸에 `;` 로 묶는다. 학교 하나가 한 줄이어야 엑셀에서 다루기 쉽다.
 *    학과별로 줄을 쪼개면 18,000행이 되고, 그건 다른 표다(필요하면 따로 낸다).
 *
 * ⚠ 학과가 0개인 곳이 1,353곳이다. **학과가 없는 게 아니라 학과를 나누지 않는 일반고**다.
 *    빈 칸으로 두면 「누락」으로 읽히므로 안내 지면에 적어 둔다.
 *
 * ⚠ 학교유형 판정 근거를 함께 낸다 — NEIS 고교유형에는 **마이스터고 항목이 없어**
 *    학교 이름으로 판정한 것이 32곳 있다. 그 사실을 숨기면 표가 거짓말을 한다.
 */
const cols: Column<any>[] = [
  { key: '학교코드', get: (s) => s.code },
  { key: '학교명', get: (s) => s.title },
  { key: '영문명', get: (s) => s.titleEn },
  { key: '고교유형', get: (s) => s.고교유형 },
  { key: '고교유형_판정근거', get: (s) => s.취업?.유형판정근거 ?? 'NEIS 고교유형' },
  { key: '설립', get: (s) => s.설립 },
  { key: '공학구분', get: (s) => s.공학 },
  { key: '지역', get: (s) => s.지역 },
  { key: '교육청', get: (s) => s.교육청 },
  { key: '주소지', get: (s) => s.주소 },
  { key: '홈페이지', get: (s) => s.홈페이지 },
  { key: '설립일', get: (s) => s.설립일 },
  { key: '학과수', get: (s) => s.학과수 },
  {
    key: '개설학과',
    get: (s) => (s.학과 ?? []).map((m: any) => m.name).join(';'),
  },
  { key: '출처', get: (s) => s.출처 },
  { key: '주소', get: (s) => `https://100yearmap.com${s.url}` },
];

export const GET: APIRoute = () => csvResponse('100yearmap-schools.csv', toCsv(cols, schools as any[]));
