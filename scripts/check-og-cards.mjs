#!/usr/bin/env node
/**
 * **공유 카드의 딱지가 문장 한가운데서 잘려 있나.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 🔴 2026-08-09 07:2x — 56편째 카드를 **눈으로 열어 보고** 알았다. 자동이 이렇게 골라 놨다.
 *
 *      93
 *      Netflix markets Korean titles hold 7
 *
 *   뜻이 없다. 자동은 앞말(dek)에서 **첫 수**를 크게 박고 그 뒤를 **다음 수 앞에서 자른다.**
 *   그래서 다음 수가 가까이 있으면 문장 한가운데가 잘린다.
 * ⛔ 카드는 우리 글이 남의 화면에 처음 나타나는 자리다. 잘린 카드는 **잘린 채로 퍼진다.**
 * ⛔ 자동을 없애지 않는다 — 스물 몇 장은 멀쩡하다. **잘린 것만 손으로 잡게** 부른다.
 *
 * ⚠ 이 자는 「이상해 보인다」를 부른다. 사람이 보고 손으로 적으면 그것으로 끝난다
 *   (`src/data/wikitip-og-cards.json` 에 적으면 이 자는 더 안 묻는다).
 *
 * 쓰는 법: node scripts/check-og-cards.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 기사칸 = 'content/kculturewire';
const 고른것 = 'src/data/wikitip-og-cards.json';

/**
 * 끊긴 채로 끝나는 낱말 — 뒤에 무엇이 와야 말이 되는 것들.
 * ⛔ 늘리기만 하고 줄이지 않는다. 여기 없는 낱말로 끊기면 **사람이 눈으로 잡는 수밖에 없다.**
 */
export const 매달린말 = new Set([
  'hold', 'holds', 'held', 'of', 'in', 'the', 'a', 'an', 'is', 'are', 'was', 'were',
  'at', 'and', 'to', 'for', 'with', 'than', 'by', 'from', 'on', 'into', 'over',
  'under', 'about', 'took', 'take', 'takes', 'reach', 'reached', 'reaches',
  'that', 'which', 'their', 'its', 'our', 'per', 'between', 'against', 'only',
]);

/**
 * 딱지가 끊겨 보이나. 끊겼으면 **까닭**을, 멀쩡하면 null.
 *
 * 🔴 첫 판은 **진짜 사례를 못 잡았다.** 「… hold 7」의 마지막 낱말이 숫자 `7` 이라
 *   매달린말 표를 그냥 지나쳤다. 자가시험이 아니었으면 자를 걸어 놓고 안심할 뻔했다.
 * ⭐ 그래서 두 가지로 본다 —
 *   ① 딱지만 봐서 알 수 있는 것(비었다 · 너무 짧다 · 매달린 낱말로 끝난다)
 *   ② **원문(dek)에 대 봐야** 알 수 있는 것 — 딱지 바로 뒤가 숫자면 수를 반 토막 낸 것이다
 */
export function 끊겼나(딱지, 원문) {
  const s = String(딱지 ?? '').trim();
  if (!s) return '딱지가 비었다';
  if (s.length < 8) return `딱지가 ${s.length}자뿐이다 — 카드만 보고는 무슨 수인지 모른다`;

  /* ② 원문을 주면 **잘린 자리**를 직접 본다. 이게 실제로 났던 병이다 */
  if (typeof 원문 === 'string' && 원문) {
    const i = 원문.indexOf(s);
    if (i >= 0) {
      /*
       * ⛔ **마침표만으로는 잘림이 아니다** — 문장이 거기서 끝났을 뿐이다.
       *   뒤에 숫자가 붙어야 수를 반 토막 낸 것이다.
       *   처음엔 「.」를 그냥 잘림으로 봐서 **성한 카드 넷**을 잡았다.
       */
      const 뒤 = 원문.slice(i + s.length, i + s.length + 2);
      if (/^[0-9%]/.test(뒤) || /^\.[0-9]/.test(뒤)) {
        return `바로 뒤가 「${뒤.trim()}」다 — 수를 반 토막 냈다`;
      }
    }
  }

  /*
   * ① 매달린 낱말.
   * ⛔ **숫자로 끝나면 손대지 않는다.** 「… than in 2022」는 성한 말이고,
   *   「… hold 7」이 잘린 것인지는 딱지만 봐서는 못 가른다 — 그건 ② 가 본다.
   *   앞 낱말까지 보게 했다가 성한 딱지를 잡길래 되돌렸다.
   */
  const 토막 = s.split(/\s+/);
  const 끝토막 = 토막[토막.length - 1] || '';
  if (/\d/.test(끝토막)) return null;
  const 끝 = 끝토막.replace(/[^A-Za-z]/g, '').toLowerCase();
  if (매달린말.has(끝)) return `「${끝}」로 끝난다 — 뒤가 잘렸다`;
  return null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험 += 1; if (참) 통과 += 1; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  /* 🔴 이 한 줄이 이 자가 생긴 까닭이다 */
  /* 🔴 딱지만 봐서는 못 잡는다 — 원문을 대야 잡힌다. 첫 판이 여기서 무너졌다 */
  자가('실제로 나갈 뻔한 것을 잡는다',
    끊겼나('Netflix markets Korean titles hold 7',
      'Across 93 Netflix markets Korean titles hold 7.7% of chart places.') !== null);
  자가('원문 없이도 매달린 낱말은 잡는다', 끊겼나('of 397 titles never reached') !== null);
  자가('숫자로 끝나도 앞이 성하면 안 잡는다',
    끊겼나('points fewer than in 2022', 'It fell 9.68 points fewer than in 2022 across ten markets.') === null);
  자가('멀쩡한 딱지는 안 잡는다', 끊겼나('markets where Korean titles are rarer at #1 than on the chart') === null);
  자가('한 낱말짜리를 잡는다', 끊겼나('women') !== null);
  자가('빈 것을 잡는다', 끊겼나('') !== null);
  자가('없는 값을 잡는다', 끊겼나(undefined) !== null);
  자가('꼬리 문장부호에 안 속는다', 끊겼나('the mean fall across ten markets, of') !== null);
  자가('숫자로 끝나도 괜찮다', 끊겼나('points fewer than in 2022') === null);
  /* ⛔ 문장 끝 마침표를 잘림으로 보지 않는다 — 성한 카드 넷을 잡았던 자리다 */
  자가('문장 끝 마침표는 잘림이 아니다',
    끊겼나('of a 30-day month', 'Attention is 5.5% of a 30-day month. The rest is flat.') === null);
  자가('마침표 뒤에 숫자면 잘림이다',
    끊겼나('Korean titles hold 7', 'Korean titles hold 7.7% of places.') !== null);
  console.log(`공유 카드 딱지 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const { 제안 } = await import('./make-og-articles.mjs');
  const 손 = fs.existsSync(고른것) ? (JSON.parse(fs.readFileSync(고른것, 'utf8')).chosen ?? {}) : {};
  const 걸린것 = []; let 자동수 = 0; let 손수 = 0;

  for (const f of fs.readdirSync(기사칸).filter((x) => x.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    /* ⛔ 사람이 손으로 적은 것은 안 묻는다. 사람이 이미 본 것이다 */
    if (손[slug]) { 손수 += 1; continue; }
    const s = fs.readFileSync(`${기사칸}/${f}`, 'utf8');
    const dek = (s.match(/^dek: "(.*)"$/m) || [])[1] || '';
    const p = 제안(dek);
    자동수 += 1;
    if (!p) { 걸린것.push([slug, '(수를 못 뽑았다)', '']); continue; }
    /* ⛔ **원문을 같이 넘긴다.** 안 넘기면 「… hold 7」꼴을 영영 못 잡는다 */
    const 까닭 = 끊겼나(p.label, dek);
    if (까닭) 걸린것.push([slug, p.figure, `${p.label} — ${까닭}`]);
  }

  console.log(`공유 카드 딱지 검사 — 손 ${손수}장 · 자동 ${자동수}장`);
  if (!걸린것.length) {
    console.log('✅ 자동으로 고른 딱지가 문장 한가운데서 안 끊긴다');
    process.exit(0);
  }
  console.log(`\n⛔ 끊겨 보이는 카드 ${걸린것.length}장 — **눈으로 열어 보고** ${고른것} 에 손으로 적는다`);
  for (const [s, f, l] of 걸린것) console.log(`   · ${s} [${f}] ${l}`);
  process.exit(1);
}
