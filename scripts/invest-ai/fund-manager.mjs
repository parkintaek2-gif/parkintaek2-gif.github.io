// 투자AI — ②펀드매니저 (결정론)
// 신호 → 포지션. 규칙만 쓴다. LLM 없다. 같은 신호 집합이면 언제 돌려도 같은 답.
// ⛔ 신호를 만들지 못한다(그건 ①). ⛔ 리스크 관리자(③)를 못 멈춘다.
// 규칙이 공개돼 있으므로 이 층은 그대로 «지수 규칙서»가 된다(설계 §2).

// 목표비중 규칙(공개·단순·재현):
//   원점수 = direction × strength × freshness   (freshness: 신선할수록 1, 오래되면 0으로 감쇠)
//   같은 종목 신호가 여럿이면 원점수를 합산한다.
//   양(+)의 점수만 롱 후보로 둔다(자기자금·롱온리 — 공매도는 등록·차입 이슈라 설계상 안 한다).
//   비중 = 종목점수 / 양점수합.  포지션이 없으면 현금.
// asOfDay 는 '오늘'을 YYYYMMDD 정수로 받는다(호출자가 넘긴다 — Date.now 안 쓴다, 재현성).

function 일수차(ymdA, ymdB) {
  // YYYYMMDD 두 개의 대략 일수차(달력 근사; 순서·감쇠용이라 정밀도 불요)
  const p = (n) => { const s = String(n); return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); };
  return Math.round((p(ymdB) - p(ymdA)) / 86400000);
}

// 신선도: 신호 나이가 horizon 안이면 선형 감쇠(1→0), horizon 넘으면 0(오래된 신호는 무게 0).
export function 신선도(신호, asOfDay) {
  const 나이 = 일수차(String(신호.ts).slice(0, 8).replace(/-/g, ''), String(asOfDay));
  if (나이 < 0) return 0;              // 미래 신호는 안 쓴다(룩어헤드 금지)
  if (나이 >= 신호.horizon) return 0;   // 반영기간 지난 신호는 죽었다
  return 1 - 나이 / 신호.horizon;
}

// 신호들 → { 종목코드: 목표비중 }. 합이 1이거나(투자) 0(전액 현금)이다.
export function 포지션정하기(신호들, asOfDay) {
  const 점수 = new Map();
  for (const s of 신호들) {
    const f = 신선도(s, asOfDay);
    if (f === 0) continue;
    const 코드 = s.entity.code;
    const 원점 = s.direction * s.strength * f;
    점수.set(코드, (점수.get(코드) ?? 0) + 원점);
  }
  // 양의 점수만 롱 후보
  const 양 = [...점수.entries()].filter(([, v]) => v > 0);
  const 합 = 양.reduce((a, [, v]) => a + v, 0);
  const 목표 = {};
  if (합 > 0) for (const [코드, v] of 양) 목표[코드] = v / 합;
  return { 목표, 원점수: Object.fromEntries(점수) };
}
