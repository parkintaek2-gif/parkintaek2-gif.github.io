/**
 * 대학알리미 학교별 숫자를 **시도 × 갈래(4년제·전문대)** 로 더한다 — /university-employment-by-province ·
 * /university-dropout-by-province 가 같이 쓴다 (2026-10-23 · 1번).
 *
 * ⛔ 학교 비율을 평균 내지 않는다. 분자·분모(취업자·취업대상자, 중도탈락자·재적학생)를 더해서 나눈다.
 * ⛔ 분모가 0 이거나 숫자가 없는 학교는 뺀다 — 0 으로 채우지 않는다.
 */
import 대학들 from '../data/100yearmap/pages-university.json';

export type 칸 = { 곳: number; 분자: number; 분모: number; 률: number | null };
export const 갈래들 = ['대학', '전문대학'] as const;

const 빈칸 = (): 칸 => ({ 곳: 0, 분자: 0, 분모: 0, 률: null });

export function 시도갈래로더함(뽑기: (x: any) => { 분자: number; 분모: number } | null) {
  const 표 = new Map<string, Record<string, 칸>>();
  const 전체: Record<string, 칸> = { 대학: 빈칸(), 전문대학: 빈칸() };
  for (const x of 대학들 as any[]) {
    if (!갈래들.includes(x.구분)) continue;
    const v = 뽑기(x);
    if (!v || !(v.분모 > 0)) continue;
    const 줄 = 표.get(x.지역) ?? { 대학: 빈칸(), 전문대학: 빈칸() };
    for (const c of [줄[x.구분], 전체[x.구분]]) { c.곳 += 1; c.분자 += v.분자; c.분모 += v.분모; }
    표.set(x.지역, 줄);
  }
  const 끝 = (c: 칸) => { c.률 = c.분모 ? (c.분자 / c.분모) * 100 : null; return c; };
  for (const 줄 of 표.values()) { 끝(줄.대학); 끝(줄.전문대학); }
  끝(전체.대학); 끝(전체.전문대학);
  const 시도들 = [...표.entries()].map(([시도, 줄]) => ({ 시도, ...줄 }));
  return { 시도들, 전체, 공시연도: (대학들 as any[])[0]?.공시연도 as string };
}
