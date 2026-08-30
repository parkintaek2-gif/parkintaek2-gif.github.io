// 투자AI — 신호 스키마 (설계 §3 그대로 고정한다. ⛔ 필드를 바꾸면 과거 신호가 무용지물이 된다)
// 판독층(①애널리스트, LLM)이 만드는 레코드의 뼈대. 여기서는 «검증»만 한다 — 만드는 것은 ①의 몫.
// 이 파일은 결정론이다: 같은 입력 → 같은 판정. Date.now/Math.random 안 쓴다.

export const KIND = new Set(['실적', '가이던스', '수급', '정책', '공급망', '공시', '뉴스']);

// 한 신호 레코드가 스키마를 지키는지 검사한다. 지키면 [], 아니면 위반 사유 배열.
export function 신호검증(s) {
  const 흠 = [];
  if (!s || typeof s !== 'object') return ['신호가 객체가 아니다'];
  // ts: 원문 발표 시각(우리가 읽은 시각이 아니다). ISO 문자열 또는 YYYYMMDD.
  if (typeof s.ts !== 'string' || !/^\d{8}$|^\d{4}-\d{2}-\d{2}/.test(s.ts)) 흠.push('ts(원문 발표 시각)가 없거나 형식이 아니다');
  if (typeof s.source !== 'string' || !s.source) 흠.push('source(출처)가 없다');
  if (typeof s.sourceId !== 'string' || !s.sourceId) 흠.push('sourceId(원문 식별자)가 없다 — 되짚어갈 수 없으면 신호가 아니다');
  if (!s.entity || s.entity.market == null || s.entity.code == null) 흠.push('entity{market,code}가 없다 — 이름이 아니라 코드여야 한다');
  else if (!/^\d{6}$|^[A-Z0-9.]{1,12}$/.test(String(s.entity.code))) 흠.push('entity.code가 코드 형식이 아니다');
  if (!KIND.has(s.kind)) 흠.push(`kind가 정의된 종류가 아니다(${[...KIND].join('·')})`);
  if (![1, 0, -1].includes(s.direction)) 흠.push('direction은 +1/0/-1 이어야 한다');
  if (!Number.isInteger(s.strength) || s.strength < 0 || s.strength > 3) 흠.push('strength는 0~3 정수여야 한다');
  if (!Number.isInteger(s.horizon) || s.horizon <= 0) 흠.push('horizon(반영 기간, 일)은 양의 정수여야 한다');
  if (typeof s.evidence !== 'string' || !s.evidence) 흠.push('evidence(원문 인용)가 없다 — 근거 없는 신호는 안 받는다');
  if (typeof s.model !== 'string' || !s.model) 흠.push('model(판독 모델·버전)이 없다 — 없으면 나중에 성과 비교가 깨진다');
  return 흠;
}

// 신호 묶음을 검증하고, 통과분만 돌려준다. 떨어진 것은 사유와 함께 담는다(조용히 버리지 않는다 — 신조).
export function 신호거르기(신호들) {
  const 통과 = [], 탈락 = [];
  for (const s of 신호들) {
    const 흠 = 신호검증(s);
    if (흠.length === 0) 통과.push(s);
    else 탈락.push({ sourceId: s?.sourceId ?? '(없음)', 흠 });
  }
  return { 통과, 탈락 };
}
