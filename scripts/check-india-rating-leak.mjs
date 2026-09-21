#!/usr/bin/env node
/**
 * check-india-rating-leak.mjs — 인도 신용등급에서 **개별 회사 등급이 새지 않았나**를 잰다.
 *
 * ── 왜 생겼나 (2026-09-21 · 5번) ───────────────────────────────────────────
 * NSE 약관은 「그들의 information 을 복제·전송·저장」하는 것을 막는다.
 * 우리가 내는 것은 22,344행을 «우리가 세어» 만든 집계다 — 사실에는 저작권이 없고,
 * CLAUDE.md 도 「사실만 쓰고 표현은 우리가 짠다」로 그 길을 정해 뒀다.
 *
 * ⛔ 그런데 그 선은 좁다. **「회사 이름 + 그 회사의 등급」이 한 줄이라도 나가면 그때부터는
 *   우리가 센 수가 아니라 그들의 자료를 옮긴 것이 된다.**
 * ⭐ 사람의 조심에 맡기지 않는다 — 검사로 굳힌다(강령 ④ 「규칙은 문장이 아니라 검사로 둔다」).
 *
 * 2026-09-21 에 라이선스 대장을 🔴(전면 금지)에서 🟡(집계만)으로 좁히면서 같이 붙였다.
 * 대장을 넓힌 사람이 지킬 자를 같이 만들지 않으면, 그 판단은 다음 세션에서 무너진다.
 *
 * 쓰는 법
 *   node scripts/check-india-rating-leak.mjs
 *   node scripts/check-india-rating-leak.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 인도 등급 표기 — CRISIL·ICRA·CARE·India Ratings 가 쓰는 꼴 */
export const 등급무늬 = /\b(?:CRISIL|ICRA|CARE|IND)\s?(?:AAA|AA\+?-?|AA|A\+?-?|A|BBB\+?-?|BBB|BB\+?-?|BB|B\+?-?|B|C|D)\b/;

/**
 * 한 줄에 «회사 이름과 등급이 함께» 있나.
 * ⚠ 등급 글자만 있는 것은 괜찮다 — 설명문에 「AAA 등급이란」처럼 쓸 수 있다.
 *   문제는 «어느 회사가» 그 등급이라고 적는 것이다.
 */
export function 샜나(줄) {
  const s = String(줄 || '');
  if (!등급무늬.test(s)) return false;
  /* 인도 회사 이름에 흔한 꼬리표가 같은 줄에 있으면 개별 등급으로 본다 */
  const 회사꼬리 = /\b(?:Ltd|Limited|Pvt|Private|Industries|Enterprises|Infra(?:structure)?|Textiles|Steels?|Motors|Chemicals|Finance|Bank)\b/i;
  return 회사꼬리.test(s);
}

/** 여러 줄을 훑어 샌 줄만 돌려준다 */
export function 훑기(글) {
  return String(글 || '').split('\n')
    .map((s, i) => ({ 줄번호: i + 1, 글: s.trim() }))
    .filter((x) => 샜나(x.글));
}

/** 손님에게 나가는 자리 — 여기만 본다. archive/ 는 모아 두는 곳이라 세지 않는다 */
export const 보는곳 = [
  'src/pages/data/company-credit.astro',
  'src/data/india-rating-moves.json',
];

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);

  검('회사 이름 + 등급은 샌 것이다', 샜나('Tata Steel Ltd — CRISIL AA+ upgraded') === true);
  검('ICRA 도 잡는다', 샜나('Reliance Industries ICRA AAA') === true);
  검('CARE 도 잡는다', 샜나('Bajaj Finance Limited CARE AA') === true);
  검('India Ratings(IND) 도 잡는다', 샜나('Hero Motors Pvt IND A+') === true);
  검('⭐ 집계만 있는 줄은 «안» 샌 것이다', 샜나('2,629 upgrades against 736 downgrades') === false);
  검('비율도 괜찮다', 샜나('a ratio of 3.6 upgrades for every downgrade') === false);
  검('등급 글자만 있는 설명문은 괜찮다',
    샜나('What an AAA rating means in the Indian market') === false);
  검('회사 꼬리표만 있고 등급이 없으면 괜찮다',
    샜나('Tata Steel Ltd is listed on the NSE') === false);
  검('빈 줄은 안 샌 것이다', 샜나('') === false);
  검('여러 줄에서 샌 줄만 집는다',
    훑기('집계 2,629 upgrades\nTata Steel Ltd — CRISIL AA+\n비율 3.6').length === 1);
  검('샌 줄의 줄번호를 알려준다',
    훑기('a\nTata Steel Ltd — CRISIL AA+\nc')[0].줄번호 === 2);
  검('아무것도 안 새면 빈 목록', 훑기('집계만 있다\n2,629건').length === 0);
  검('보는 곳에 손님 지면이 들어 있다', 보는곳.some((p) => p.includes('company-credit')));
  검('⛔ archive 는 안 본다 — 모아 두는 곳이다', !보는곳.some((p) => p.startsWith('archive/')));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

if (내가진입점) {
  console.log('■ 인도 신용등급 — 개별 회사 등급이 손님 화면에 샜나\n');
  let 샌것 = 0, 못본곳 = 0;
  for (const p of 보는곳) {
    let 글;
    try { 글 = fs.readFileSync(path.join(뿌리, p), 'utf8'); }
    catch { console.log(`   ⬜ ${p} — 못 읽었다(없을 수 있다)`); 못본곳++; continue; }
    const 것 = 훑기(글);
    if (!것.length) { console.log(`   ✅ ${p} — 깨끗하다`); continue; }
    샌것 += 것.length;
    console.log(`   🔴 ${p} — ${것.length}줄`);
    것.slice(0, 5).forEach((x) => console.log(`        ${x.줄번호}: ${x.글.slice(0, 100)}`));
  }
  console.log(샌것
    ? `\n🔴 개별 회사 등급이 ${샌것}줄 새어 있다 — 약관이 막는 자리다. 지운다`
    : `\n✅ 우리가 «센 수»만 나간다 — 라이선스 대장 🟡 과 맞다${못본곳 ? ` (못 본 곳 ${못본곳})` : ''}`);
  process.exit(샌것 ? 1 : 0);
}
