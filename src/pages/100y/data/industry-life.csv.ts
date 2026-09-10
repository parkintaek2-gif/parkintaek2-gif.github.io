import type { APIRoute } from 'astro';
import { toCsv, csvResponse, type Column } from '../../../lib/csv';
import d from '../../../data/100yearmap/industry-life.json';

/**
 * /data/industry-life.csv — 국민연금 가입 사업장 내역 기반 업종 40개
 *
 * ⛔ 「임금」이라는 이름으로 내보내지 않는다 — 원자료 그대로 두면 «1인당 국민연금
 *    고지액(월)»이지 월급이 아니다(기준소득월액 × 9%, 상한·하한 있음). 되돌리지 않는다.
 *    industry-life.json 의 「🔴 이 칸은 임금이 아니다」 경고를 열 이름 자체에 담는다.
 * ⛔ 「10년+%」는 «지금 살아 있는» 사업장 중 몫이다 — 이미 문 닫은 곳은 분모에 없다.
 */
const 자료 = (d as any).자료 as any[];

const cols: Column<any>[] = [
  { key: '업종', get: (r) => r.업종 },
  { key: '국민연금가입자수', get: (r) => r.인원 },
  { key: '국민연금고지액_월_원', get: (r) => r.임금 },
  { key: '월상실률_퍼센트', get: (r) => r.월상실률 },
  { key: '월유입률_퍼센트', get: (r) => r.월유입률 },
  { key: '사업장수', get: (r) => r.사업장 },
  { key: '10년이상_생존사업장_비율_퍼센트', get: (r) => r['10년+%'] },
  { key: '가입자_중앙연령', get: (r) => r.중앙나이 },
  { key: '기준월', get: () => (d as any).출처?.기준월 },
  { key: '출처', get: () => (d as any).출처?.이름 },
];

export const GET: APIRoute = () => csvResponse('100yearmap-industry-life.csv', toCsv(cols, 자료));
