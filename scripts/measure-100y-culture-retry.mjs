#!/usr/bin/env node
/**
 * measure-100y-culture-retry.mjs — **문화 분야 재실험** (기획서 §2단계 그대로)
 *
 * 기획서(3번_0100세x5분야_콘텐츠기획서_0822.md) 4-4절에서 이미 적어 둔 것 —
 * 문화 분야는 "독서율"·"연간 독서량"·"영화 관람 횟수"·"공연 관람 비율" 넷 다
 * 자동완성 흔적이 0이었다. 다음 시간엔 "통계로 묻는 말" 대신 **"내가 본 것 vs
 * 남들이 본 것"처럼 비교형 문구**로 다시 재 보기로 했다 — 그 재실험이다.
 *
 * ⛔ 이 재실험도 흔적이 0이면 문화는 "정보 지면"이 아니라 "기존 지면(예: /travel)에
 *   끼워 넣는 곁가지"로만 다룬다 — 억지로 분야를 채우지 않는다.
 *
 * 쓰는 법  node scripts/measure-100y-culture-retry.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 자동완성, 자리재기 } from './measure-100y-keyword-demand.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 낼곳 = path.join(뿌리, 'src/data/100yearmap-culture-retry.json');

/** ⭐ 비교형 문구 — 「내가 본 것 vs 남들이 본 것」 결로 짠다. 통계 낱말(독서율·관람횟수)을 안 쓴다 */
export const 후보 = [
  '남들은 책 얼마나 읽을까', '또래 평균 독서량', '나만 책 안 읽나',
  '남들도 영화 안 보나', '또래는 영화 몇 편 보나', '나이대별 독서 비교',
  '책 안 읽는 사람 비율', '영화 안 보는 사람 비율', '남들은 공연 얼마나 보나',
  '동갑 평균 독서량', '나만 영화관 안 가나', '남들 문화생활 얼마나 하나',
];

const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

const 잰것 = [];
for (const 말 of 후보) {
  const r = 자리재기(말, await 자동완성(말));
  잰것.push({ 말, ...r });
  const 표 = r.물음실패 ? '못 물었다'
    : `${r.그대로있나 ? `있다(${r.몇번째}번째)` : '없다'} · 그 말로 시작 ${r.그말로시작}줄 · 보기: ${(r.보기 ?? []).slice(0, 3).join(' / ')}`;
  console.log(`  ${말.padEnd(22)} ${표}`);
  await 쉼(400);
}

const 흔적있는것 = 잰것.filter((r) => !r.물음실패 && (r.그대로있나 || r.그말로시작 > 0));

fs.writeFileSync(낼곳, JSON.stringify({
  generated: new Date().toISOString(),
  왜: '기획서 4-4절 「문화 재실험」 — 통계형 문구 대신 비교형 문구로 다시 잰다',
  whatThisIs: 'Korean Google Suggest autocomplete presence (client=firefox&hl=ko, EUC-KR decoded). A trace that someone types this phrase — not a volume figure.',
  whatThisIsNot: '월간 검색량이 아니다. 유료 키워드 자료가 없다.',
  결론: 흔적있는것.length
    ? `비교형 문구 ${흔적있는것.length}/${후보.length}개에서 흔적을 찾았다 — 문화 지면을 비교형으로 낼 근거가 생겼다`
    : '비교형도 흔적 0 — 기획서 원칙대로 문화는 이번 분기 더 보류, 기존 지면(travel)의 곁가지로만 다룬다',
  phrases: 잰것,
}, null, 1));
console.log(`\n냈다 — ${path.relative(뿌리, 낼곳)}`);
console.log(`결론: 흔적 ${흔적있는것.length}/${후보.length}`);
