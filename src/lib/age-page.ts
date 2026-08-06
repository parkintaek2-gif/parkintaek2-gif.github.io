/**
 * 나이로 보기 — 지면에 나갈 값을 여기서 만든다.
 *
 * ⛔ 평균만 보여주지 않는다. 분포를 먼저 보여준다.
 *    평균이 규범으로 읽히는 순간 지도가 아니라 압박이 된다.
 * ⛔ 「늦었다」·「이르다」·「해야 한다」를 쓰지 않는다. 우리가 정할 자격이 없다.
 * ⚠ 한 살로 잰 자료와 다섯 살·열 살로 묶인 자료가 섞여 있다.
 *   묶인 값을 한 살처럼 말하면 거짓이 된다 — 어느 띠에서 온 값인지 지면에 함께 적는다.
 */

export type 나이자료 = {
  만든날: string;
  출처: Record<string, any>;
  임금: Record<string, { 월급여천원?: number; 근속년?: number; 사람?: number }>;
  살림: Record<string, Record<string, number>>;
  혼인: {
    총건: number;
    남편분포: { 시작나이: number; 값: number[] };
    아내분포: { 시작나이: number; 값: number[] };
    최다: { 남편: string; 아내: string };
    누적: Record<string, { 남편: number; 아내: number }>;
  };
};

/** 임금 표의 띠 이름 — 표가 쓰는 글자 그대로여야 값을 찾는다 */
export function 임금띠(나이: number): string {
  if (나이 < 20) return '~ 19세';
  if (나이 >= 60) return '60세 ~';
  const 아래 = Math.floor(나이 / 5) * 5;
  return `${아래} ~ ${아래 + 4}`;
}

/** 가계금융복지조사의 띠 이름 */
export function 살림띠(나이: number): string {
  if (나이 <= 29) return '29세 이하';
  if (나이 >= 60) return '60세 이상';
  const 아래 = Math.floor(나이 / 10) * 10;
  return `${아래}~${아래 + 9}세`;
}

/** 천원 단위 월급여를 사람이 읽는 말로 — 3185 → 「318만 5천원」 */
export function 월급말(천원?: number): string | null {
  if (천원 === null || 천원 === undefined) return null;
  const 원 = Math.round(천원) * 1000;
  const 만 = Math.floor(원 / 10000);
  const 나머지 = Math.round((원 % 10000) / 1000);
  return 나머지 ? `${만.toLocaleString()}만 ${나머지}천원` : `${만.toLocaleString()}만원`;
}

/** 만원 단위를 사람이 읽는 말로 — 62714 → 「6억 2,714만원」 */
export function 만원말(만원?: number | null): string | null {
  if (만원 === null || 만원 === undefined) return null;
  const 반올림 = Math.round(만원);
  const 억 = Math.floor(반올림 / 10000);
  const 남은 = 반올림 % 10000;
  if (!억) return `${남은.toLocaleString()}만원`;
  return 남은 ? `${억}억 ${남은.toLocaleString()}만원` : `${억}억원`;
}

/** 한글 나이 — 지면 제목에 쓴다 */
const 한글나이: Record<number, string> = {
  25: '스물다섯', 32: '서른둘', 40: '마흔', 55: '쉰다섯', 68: '예순여덟',
};
export function 나이말(나이: number): string {
  return 한글나이[나이] ?? `${나이}세`;
}

/** 그 나이까지 초혼한 사람이 백에 몇인가 — 표에 있는 나이만 답한다 */
export function 혼인누적(자료: 나이자료, 나이: number): { 남편: number; 아내: number } | null {
  return (자료.혼인.누적 as any)[String(나이)] ?? null;
}

/**
 * 표의 띠 이름을 지면에 쓸 말로 — 「60세 ~」 뒤에 「세」를 또 붙이면 「60세 ~세」가 된다.
 * 표가 쓰는 글자와 사람이 읽는 말은 다르다. 섞지 않는다.
 */
export function 띠말(띠: string): string {
  if (띠 === '60세 ~') return '예순 넘은';
  if (띠 === '~ 19세') return '열아홉 아래';
  const m = 띠.match(/^(\d+)\s*~\s*(\d+)$/);
  if (m) return `${m[1]}~${m[2]}세`;
  return 띠;                       // 살림 띠(「30~39세」·「60세 이상」)는 이미 사람이 읽는 말이다
}

export function 임금값(자료: 나이자료, 나이: number) {
  const 띠 = 임금띠(나이);
  const v = 자료.임금[띠];
  if (!v) return null;
  return { 띠, 띠말: 띠말(띠), 월급: 월급말(v.월급여천원), 근속: v.근속년 ?? null, 사람: v.사람 ?? null };
}

export function 살림값(자료: 나이자료, 나이: number) {
  const 띠 = 살림띠(나이);
  const v = 자료.살림[띠];
  if (!v) return null;
  return {
    띠,
    자산평균: 만원말(v['자산_전가구평균']),
    자산중앙: 만원말(v['자산_보유가구중앙']),
    부채평균: 만원말(v['부채_전가구평균']),
    소득중앙: 만원말(v['경상소득_보유가구중앙']),
  };
}

/** 월급여가 가장 높은 띠 — 「꼭대기가 어디인가」는 지면마다 되풀이해 쓰인다 */
export function 임금꼭대기(자료: 나이자료) {
  const 줄 = Object.entries(자료.임금).filter(([띠]) => 띠 !== '전체');
  let 으뜸: [string, any] | null = null;
  for (const 칸 of 줄) if (!으뜸 || (칸[1].월급여천원 ?? 0) > (으뜸[1].월급여천원 ?? 0)) 으뜸 = 칸;
  return 으뜸 ? { 띠: 으뜸[0], 띠말: 띠말(으뜸[0]), 월급: 월급말(으뜸[1].월급여천원) } : null;
}
