/**
 * boss-orders.mjs — **사장님 지시 이력을 한 곳에서 읽는다.**
 *
 * ── 왜 있나 ──────────────────────────────────────────────────────────────
 * 사장님 지시(2026-08-29): 「**터미널(SessionStart/statusLine) — 사장님 지시 이력 상시 고정**」
 *
 * 창이 열릴 때(SessionStart)와 상태줄(statusLine) **두 곳**에 지시가 늘 보여야 한다.
 * ⛔ 두 곳이 각자 파일을 읽으면 반드시 갈라진다 — 오늘 하루에만 「하나를 고쳤는데
 *   나머지가 안 따라온다」를 세 번 겪었다(기사 링크·카드뉴스 자·검사자 헛경보).
 * ⭐ 그래서 읽는 자는 **하나**다. 대장은 `docs/5번-사장님-지시-이력.tsv` 하나뿐이다.
 *
 * ── ⛔ 지키는 것 ─────────────────────────────────────────────────────────
 * ① **원문을 줄이지 않는다.** 상태줄이 좁으면 «자르지 말고 한 줄씩 돌린다».
 *   자르면 「업무분량의 50% 이상을…」이 「업무분량의 50%…」가 되어 뜻이 바뀐다.
 * ② **취소된 지시도 파일에는 남는다.** 여기서는 「산다」만 낸다 —
 *   ⚠ 지운 것이 아니라 «안 보이는 것»이다. 왜 취소됐는지는 파일에 있다.
 * ③ 파일을 못 읽으면 **빈 목록**을 낸다. ⛔ 훅이 죽으면 창이 안 열린다 —
 *   지시를 못 보여 주는 것보다 창이 안 열리는 것이 나쁘다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const 대장길 = path.join(뿌리, 'docs', '5번-사장님-지시-이력.tsv');

/** TSV 한 줄 → 지시 하나. ⛔ 주석(#)과 머리줄은 지시가 아니다 */
export function 줄읽기(줄) {
  const s = String(줄 ?? '');
  if (!s.trim() || s.startsWith('#')) return null;
  const 칸 = s.split('\t');
  if (칸.length < 4) return null;
  const [날짜, 갈래, 상태, 원문, 바뀌는것] = 칸;
  if (날짜 === '날짜') return null;                 /* 머리줄 */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(날짜)) return null;
  return {
    날짜,
    갈래: String(갈래 ?? '').trim(),
    상태: String(상태 ?? '').trim(),
    원문: String(원문 ?? '').trim(),
    바뀌는것: String(바뀌는것 ?? '').trim(),
  };
}

/**
 * 살아 있는 지시를 다 읽는다.
 * ⚠ 못 읽으면 빈 목록이다 — 훅을 죽이지 않는다.
 */
export function 지시들(길 = 대장길, 읽기 = (p) => fs.readFileSync(p, 'utf8')) {
  let 글;
  try { 글 = 읽기(길); } catch { return []; }
  return String(글).split(/\r?\n/).map(줄읽기).filter(Boolean).filter((o) => o.상태 === '산다');
}

/**
 * 상태줄에 낼 «한 줄».
 * ⭐ 자르지 않고 «돌린다» — 부를 때마다 다음 것이 나온다.
 * ⚠ 상태줄은 몇 초마다 다시 그려지므로, 시각으로 돌리면 사람이 다 볼 수 있다.
 * ⛔ 지시가 없으면 빈 글자가 아니라 «없다고» 말한다. 조용하면 고장과 구별이 안 된다.
 */
export function 한줄(때 = 0, 다 = 지시들()) {
  if (!다.length) return '⬜ 지시 이력을 못 읽었다 — docs/5번-사장님-지시-이력.tsv';
  const i = Math.abs(Math.floor(때)) % 다.length;
  const o = 다[i];
  return `[${i + 1}/${다.length}] ${o.날짜} 사장님 — ${o.원문}`;
}

/**
 * 창이 열릴 때 낼 «전부».
 * ⛔ 여기서는 요약하지 않는다. 새 창이 지시를 다 읽고 시작해야 한다.
 */
export function 브리핑(다 = 지시들()) {
  if (!다.length) return ['⬜ 사장님 지시 이력을 못 읽었다 — docs/5번-사장님-지시-이력.tsv 를 본다'];
  const 줄 = [];
  줄.push(`## 🔴 사장님 지시 — 살아 있는 것 ${다.length}건 (원문 그대로)`);
  줄.push('');
  const 갈래순 = ['목표', '상시', '일'];
  for (const g of 갈래순) {
    const 것 = 다.filter((o) => o.갈래 === g);
    if (!것.length) continue;
    줄.push(`### ${g === '목표' ? '수로 정해진 것' : g === '상시' ? '늘 지키는 것' : '한 번 하는 것'}`);
    for (const o of 것) {
      줄.push(`- **「${o.원문}」** *(${o.날짜})*`);
      if (o.바뀌는것) 줄.push(`  → ${o.바뀌는것}`);
    }
    줄.push('');
  }
  줄.push('⛔ 이 목록은 요약이 아니라 **원문**이다. 판단이 갈리면 여기로 돌아온다.');
  줄.push('⚠ 새 지시를 받으면 **그 응답 안에서** `docs/5번-사장님-지시-이력.tsv` 에 더한다.');
  return 줄;
}
