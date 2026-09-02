#!/usr/bin/env node
/**
 * check-kcw-title-numbers.mjs — **제목에 든 수가 본문에 있나.**
 *
 * ── 🔴 왜 만들었나 (2026-09-03) ─────────────────────────────
 * 자료를 다시 지어 기사 열여덟 편의 표와 산문을 고쳤다. 그런데 **제목은 잊었다** —
 * ```
 *   제목  「Korean series are widest in week one only 20% of the time」
 *   자료  21.1%
 * ```
 * 제목은 검색 결과에 나가는 **가장 많이 읽히는 한 줄**이다. 본문을 다 고쳐 놓고 제목에
 * 옛 수를 남기면, 손님이 보는 유일한 문장이 틀린 문장이 된다.
 *
 * ⚠ 그리고 이것은 자로 잡기 전까지 **아무 데도 안 걸렸다.** 기사 대조 자들은 본문만 본다.
 *
 * ── 무엇을 잰다 ─────────────────────────────────────────────
 * 제목에 든 수마다, 본문에 **그 수로 반올림되는 값**이 있나 본다.
 * ```
 *   제목 34%   본문 33.8%   → 통과 (제목은 반올림해서 적는 것이 정상이다)
 *   제목 20%   본문 21.1%   → 🔴  (21.1 은 20 으로 반올림되지 않는다)
 * ```
 * ⛔ 「같은 글자여야 한다」로 잡지 않는다. 그러면 제목에 소수점을 넣으라고 강요하게 되고,
 *   제목이 길어져 구글이 자른다 — 다른 자가 그것을 막고 있다(check-kcw-title-length).
 * ⛔ 「top 10」·「in 6 countries」처럼 **세는 말**은 수가 아니라 이름이다. 본문에 그 글자가
 *   있으면 통과다(반올림을 따지지 않는다).
 * ⚠ 정정 절(「What changed on …」)은 옛 수를 일부러 적는 자리라 **본문에서 뺀다** —
 *   거기 남은 옛 수로 제목이 통과하면 이 자가 하는 일이 없어진다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-title-numbers.mjs --자가시험
 *   node scripts/check-kcw-title-numbers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 정정절뗀다 } from './lib/kcw-correction-section.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사방 = path.join(뿌리, 'content/kculturewire');

/**
 * 면제 — **제목의 수가 본문에 «글자로» 없어도 맞는 경우.** 낱낱이 까닭을 적는다.
 *
 * ⛔ 「자가 울어서」는 까닭이 아니다. 제목이 셈으로 맞다는 것을 «여기서 보여야» 한다.
 * ⚠ 까닭 없는 면제가 하나라도 있으면 이 자는 껍데기가 된다.
 */
export const 면제 = {
  'korean-netflix-titles-one-body': {
    수: '99',
    잰다: '제목이 「Remove Ma Dong-seok and 99 more」다 — 마동석 한 사람 + 99명 = 100명이고, '
      + '본문 표의 「100 busiest」가 바로 그 100명이다. 셈이 맞으므로 제목에 99 가 있는 것이 옳다. '
      + '본문을 100 으로 적는 것이 읽기 쉬워서 그렇게 뒀다.',
  },
};

/** 앞말에서 제목을 뽑는다 */
export function 제목뽑기(글) {
  const m = /^title:\s*"([^"]*)"/m.exec(String(글 ?? '').replace(/\r\n/g, '\n'));
  return m ? m[1] : null;
}

/** 앞말을 떼고 정정 절도 뗀 본문 */
export function 볼본문(글) {
  const s = String(글 ?? '').replace(/\r\n/g, '\n');
  const 조각 = s.split(/^---$/m);
  const 몸 = 조각.length >= 3 ? 조각.slice(2).join('---') : s;
  return 정정절뗀다(몸);
}

/** 제목에서 수를 뽑는다. 천 단위 쉼표는 수의 일부, 목록 쉼표는 아니다 */
export function 제목의수(제목) {
  return (String(제목 ?? '').match(/\d+(?:,\d{3})*(?:\.\d+)?%?/g) ?? []);
}

/** 「10」 같은 맨수가 본문에 글자로 있나 */
const 글자로있나 = (본문, 글) => 본문.includes(글);

/**
 * 수를 «영어 낱말»로도 쓴다. 제목은 숫자로, 본문은 낱말로 적는 것이 우리 글꼴이다 —
 * 「top 10 is not ten titles」·「14 films … Fourteen Korean films」.
 * ⛔ 이것을 모르면 자가 열 편을 거짓으로 울리고, 그러면 사람이 자를 끈다.
 * ⚠ 스물까지만 둔다. 그 위는 우리 글에서 숫자로 쓴다(재 보고 적었다).
 */
export const 수낱말 = new Map([
  [1, ['one']], [2, ['two']], [3, ['three']], [4, ['four']], [5, ['five']], [6, ['six']],
  [7, ['seven']], [8, ['eight']], [9, ['nine']], [10, ['ten']], [11, ['eleven']], [12, ['twelve']],
  [13, ['thirteen']], [14, ['fourteen']], [15, ['fifteen']], [16, ['sixteen']], [17, ['seventeen']],
  [18, ['eighteen']], [19, ['nineteen']], [20, ['twenty']],
  /* 몫으로 자주 쓰는 말 — 「50%」를 본문에서 「half」로 적는다 */
  [50, ['half', 'a half']], [25, ['a quarter', 'quarter']], [33, ['a third', 'third']],
  [67, ['two thirds', 'two-thirds']], [75, ['three quarters', 'three-quarters']],
]);

/** 그 수를 낱말로 적은 것이 본문에 있나 */
export function 낱말로있나(본문, 값) {
  const 말들 = 수낱말.get(Math.round(값));
  if (!말들) return false;
  const s = String(본문).toLowerCase();
  return 말들.some((w) => s.includes(w));
}

/**
 * 그 수가 본문에 있나 — 반올림해서 그 수가 되는 값도 받는다.
 * ⛔ 「%」가 붙은 수만 반올림을 따진다. 맨수는 세는 말일 때가 많다.
 */
export function 본문에있나(본문, 조각) {
  /* ⛔ `String(undefined)` 는 「undefined」라는 «글자»다. 그대로 두면 빈 것 둘이 서로
     맞는다고 나온다 — 자가시험이 그것을 잡았다. 빈 것은 빈 글로 눌러 둔다. */
  const s = 본문 == null ? '' : String(본문);
  const t = 조각 == null ? '' : String(조각);
  if (!t) return false;
  if (글자로있나(s, t)) return true;
  const 몫인가 = t.endsWith('%');
  const 값 = Number(t.replace(/[%,]/g, ''));
  if (!Number.isFinite(값)) return false;
  /* 우리 글꼴 — 제목은 숫자, 본문은 낱말로 적는다(「top 10 … ten titles」) */
  if (낱말로있나(s, 값)) return true;
  /* 천 단위 쉼표를 쓰고 안 쓰고가 갈린다 — 「1,312」와 「1312」는 같은 수다 */
  if (!몫인가 && s.replace(/,/g, '').includes(t.replace(/,/g, ''))) return true;
  if (!몫인가) return false;                       /* 맨수는 글자·낱말로만 본다 */
  /* 본문의 모든 몫을 훑어 그 수로 반올림되는 것이 있나 */
  for (const m of s.matchAll(/\d+(?:\.\d+)?%/g)) {
    const v = Number(m[0].replace('%', ''));
    if (Number.isFinite(v) && Math.round(v) === Math.round(값)) return true;
  }
  return false;
}

const 내가 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('제목을 뽑는다', 제목뽑기('---\ntitle: "가 34% 나"\n---\n본문') === '가 34% 나');
  검('제목이 없으면 null', 제목뽑기('본문만 있다') === null);
  검('CRLF 도 읽는다', 제목뽑기('---\r\ntitle: "가"\r\n---\r\n본문') === '가');

  검('본문에서 앞말을 뗀다', !볼본문('---\ntitle: "9999"\n---\n몸통').includes('9999'));
  검('⚠ 정정 절도 뗀다',
    !볼본문('---\na: 1\n---\n몸통\n## What changed on 3 September 2026\n옛 수 20.1%').includes('20.1%'));

  검('수를 뽑는다', JSON.stringify(제목의수('34% and 3.9% of 1,200')) === JSON.stringify(['34%', '3.9%', '1,200']));
  검('수가 없으면 빈 배열', 제목의수('no numbers here').length === 0);

  검('같은 글자면 통과', 본문에있나('본문에 21.1% 가 있다', '21.1%'));
  검('반올림해서 같으면 통과 — 제목은 반올림해 적는다', 본문에있나('본문에 33.8% 가 있다', '34%'));
  검('🔴 반올림해도 다르면 잡는다', !본문에있나('본문에 21.1% 가 있다', '20%'));
  검('⛔ 맨수는 글자로만 본다 — 세는 말이 많다', 본문에있나('top 10 이라고 적혀 있다', '10'));
  검('⛔ 맨수가 글자로도 없으면 잡는다', !본문에있나('아무 수도 없다', '99'));
  검('본문이 낱말로 적어도 통과 — 우리 글꼴이다', 본문에있나('is not ten titles', '10'));
  검('스물도 낱말로 받는다', 본문에있나('all twenty read least', '20'));
  검('50% 를 half 로 받는다', 본문에있나('half of our panel', '50%'));
  검('천 단위 쉼표가 없어도 같은 수다', 본문에있나('misses 1312 groups', '1,312'));
  검('🔴 그래도 다른 수는 잡는다', !본문에있나('is not eleven titles', '10'));
  검('면제마다 까닭이 있다', Object.values(면제).every((v) => v && v.수 && typeof v.잰다 === 'string' && v.잰다.length > 30));
  검('⛔ 빈 것도 안 터진다', !본문에있나(undefined, undefined));

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ 제목의 수 검사 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가) {
  const 걸린것 = [];
  let 본편 = 0;
  for (const f of fs.readdirSync(기사방).filter((x) => x.endsWith('.md'))) {
    const 글 = fs.readFileSync(path.join(기사방, f), 'utf8');
    const 제목 = 제목뽑기(글);
    if (!제목) continue;
    const 수들 = 제목의수(제목);
    if (!수들.length) continue;
    본편 += 1;
    const 본문 = 볼본문(글);
    /* 면제는 «수 하나»만 봐준다 — 지면을 통째로 면제하지 않는다 */
    const 봐줄수 = 면제[f.replace(/\.md$/, '')]?.수;
    const 없는 = 수들.filter((x) => x !== 봐줄수 && !본문에있나(본문, x));
    if (없는.length) 걸린것.push({ slug: f.replace(/\.md$/, ''), 제목, 없는 });
  }
  console.log(`■ 제목에 든 수가 본문에 있나 — 수가 든 기사 ${본편}편\n`);
  for (const x of 걸린것) {
    console.log(`   🔴 ${x.slug}`);
    console.log(`      제목  ${x.제목}`);
    console.log(`      본문에 없는 수  ${x.없는.join(' · ')}`);
  }
  console.log(걸린것.length
    ? `\n⛔ ${걸린것.length}편 — 제목은 손님이 보는 유일한 문장일 때가 많다. 본문만 고치고 제목을 두면 그 문장이 거짓이 된다`
    : '\n✅ 제목의 수가 다 본문에 있다');
  process.exit(걸린것.length ? 1 : 0);
}
