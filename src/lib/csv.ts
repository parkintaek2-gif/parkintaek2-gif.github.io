/**
 * CSV 만들기 — 백년지도 데이터 배포용
 *
 * ⭐ 왜 만드나 (「우리가 일하는 법」 최종본 Ⅲ · 2026-08-05)
 *   **B2B 는 지면을 사지 않는다. 표를 산다.**
 *   그 표를 우리는 이미 갖고 있고 안 내놓고 있을 뿐이다.
 *   지면을 낼 때 표도 같이 내면 **추가 비용 0으로 재고가 쌓인다.**
 *
 * ⚠ 엑셀이 한글을 깨는 것을 막는다 — **BOM 을 붙인다.**
 *   UTF-8 CSV 를 엑셀이 그냥 열면 「가나다」가 「媛��」가 된다.
 *   받는 쪽이 엑셀로 열 것이 뻔한데 BOM 을 빼면 우리가 안 만든 셈이 된다.
 *
 * ⚠ 줄바꿈은 CRLF 다. RFC 4180 이고, 엑셀·구글시트가 둘 다 안전하게 읽는다.
 */

/** 한 칸을 CSV 규칙으로 감싼다. 쉼표·따옴표·줄바꿈이 있으면 따옴표로 묶고 따옴표는 두 번 쓴다 */
const cell = (v: unknown): string => {
  if (v == null) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export type Column<T> = { key: string; get: (row: T) => unknown };

/** 열 정의 + 행 → CSV 문자열 (BOM 포함) */
export function toCsv<T>(columns: Column<T>[], rows: T[]): string {
  const head = columns.map((c) => cell(c.key)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(c.get(r))).join(',')).join('\r\n');
  return '﻿' + head + '\r\n' + body + '\r\n';
}

/** CSV 응답 — 브라우저에서 눌렀을 때 **바로 내려받아지게** 한다 */
export const csvResponse = (name: string, body: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  });
