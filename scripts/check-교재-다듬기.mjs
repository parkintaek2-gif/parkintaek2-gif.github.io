#!/usr/bin/env node
/**
 * check-교재-다듬기.mjs — **교재를 다듬을 때 «건드리면 안 되는 것»을 지킨다.**
 *
 *   node scripts/check-교재-다듬기.mjs --자가시험
 *   node scripts/check-교재-다듬기.mjs            지금 원고를 잰다 (git HEAD 와 맞대어)
 *
 * ── 🔴 왜 (2026-09-22 · 5번) ────────────────────────────────────────────
 *   사장님: 「**셀프사주 교재 네가 전반적으로 다 봐서 이해하기 쉽게 문장을 다듬어라.
 *            전문용어는 당연히 교재이므로 들어가야 한다.**」
 *
 *   ⇒ 다듬을 것은 «우리가 쓴 설명 문장»이다. 그런데 손이 미끄러지기 쉬운 자리가 셋 있다.
 *     ① 원전 인용(한문) — 한 글자만 바뀌어도 그것은 더 이상 원전이 아니다
 *     ② 전문용어 — 쉽게 만든답시고 지어낸 말로 갈아끼우면 교재가 못 쓰게 된다
 *     ③ 원전을 우리말로 옮긴 줄 — 뜻을 바꾸면 원전이 다른 말을 한 것이 된다
 *
 *   그래서 «다짐»이 아니라 자로 둔다 — 회사 강령 ④ 「규칙은 문장이 아니라 검사로 둔다」.
 *
 * ⛔ 이 자는 문장이 «좋아졌나»를 재지 않는다. 그것은 사람이 읽고 판단한다.
 *   이 자가 재는 것은 **잃으면 안 되는 것을 잃었나** 하나다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원고방 = path.resolve(뿌리, '..', 'klifemap', 'docs', '교재');

/** 교재에 반드시 살아 있어야 하는 전문용어 — 사장님: 「전문용어는 당연히 들어가야 한다」 */
export const 지킬용어 = [
  '격국', '용신', '상신', '기신', '구신', '희신', '구응',
  '성격', '패격', '억부', '조후', '월령', '월지', '일간',
  '정관', '편관', '칠살', '정재', '편재', '식신', '상관', '정인', '편인', '비견', '겁재',
  '종격', '신강', '신약', '득령', '득지', '득세', '형충파해', '지장간',
];

/** 한문이 절반 넘게 든 줄인가 */
export function 한문줄인가(줄) {
  const s = String(줄 ?? '').replace(/[\s，。、：；？！「」『』（）()·…—>]/g, '');
  if (!s) return false;
  return (s.match(/[一-鿿]/g) || []).length / s.length >= 0.5;
}

/** 인용 줄(> 로 시작)만 뽑는다 */
export function 인용줄들(글) {
  return String(글 ?? '').replace(/\r/g, '').split('\n')
    .map((s) => s.trim())
    .filter((s) => /^>/.test(s))
    .map((s) => s.replace(/^>+\s?/, '').trim())
    .filter(Boolean);
}

/** 원전 «원문»(한문) 줄만 */
export function 원문줄들(글) {
  return 인용줄들(글).filter((s) => 한문줄인가(s));
}

/** 이 글에 어떤 용어가 몇 번 나오나 */
export function 용어세기(글) {
  const t = String(글 ?? '');
  const 것 = {};
  for (const w of 지킬용어) {
    const n = (t.match(new RegExp(w, 'g')) || []).length;
    if (n) 것[w] = n;
  }
  return 것;
}

/**
 * 고치기 «전»과 «뒤»를 맞대어, 잃으면 안 되는 것을 잃었나 본다.
 * @returns {{흠: string[], 잰것: object}}
 */
export function 맞대보기(전, 후) {
  const 흠 = [];
  const 전원문 = 원문줄들(전);
  const 후원문 = 원문줄들(후);
  /* ① 원전 한문은 «한 글자도» 바뀌면 안 된다 */
  for (const s of 전원문) {
    if (!후원문.includes(s)) 흠.push(`원전 원문이 사라지거나 바뀌었다 — 「${s.slice(0, 40)}…」`);
  }
  /* ② 용어가 «통째로» 사라지면 안 된다 (수가 줄어드는 것은 괜찮다 — 문장을 줄일 수 있다) */
  const 전용 = 용어세기(전);
  const 후용 = 용어세기(후);
  for (const w of Object.keys(전용)) {
    if (!후용[w]) 흠.push(`전문용어가 통째로 사라졌다 — 「${w}」 (${전용[w]}번 → 0번)`);
  }
  /* ③ 장·절 제목이 사라지면 안 된다 */
  const 제목 = (t) => String(t ?? '').split('\n').filter((s) => /^#+\s/.test(s.trim())).map((s) => s.trim());
  for (const h of 제목(전)) {
    if (!제목(후).includes(h)) 흠.push(`제목이 사라졌다 — 「${h.slice(0, 40)}」`);
  }
  return { 흠, 잰것: { 원문줄: 후원문.length, 용어: Object.keys(후용).length } };
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);
  const 전 = [
    '# 제6장. 성격과 패격',
    '## 1. 격은 서기도 한다',
    '정관격이라도 잘 선 것과 깨진 것이 있는데 그것을 성격과 패격이라 부르고 상신이 그 사이를 잇는다.',
    '> 用神專尋月令，以四柱配之，必有成敗。',
    '> 「용신은 월령에서 찾는다.」',
  ].join('\n');

  검('한문 줄을 가른다', 한문줄인가('用神專尋月令，以四柱配之，必有成敗。'));
  검('우리말 줄은 한문이 아니다', !한문줄인가('용신은 월령에서 찾는다'));
  검('인용 줄만 뽑는다', 인용줄들(전).length === 2);
  검('원전 원문만 고른다', 원문줄들(전).length === 1 && /用神專尋/.test(원문줄들(전)[0]));
  검('용어를 센다', 용어세기(전).용신 >= 1 && 용어세기(전).상신 === 1);

  /* 문장만 다듬은 판 — 통과해야 한다 */
  const 잘고친것 = [
    '# 제6장. 성격과 패격',
    '## 1. 격은 서기도 한다',
    '같은 정관격이라도 잘 선 것이 있고 깨진 것이 있다.',
    '그 둘을 성격과 패격이라 부른다. 그 사이를 잇는 것이 상신이다.',
    '> 用神專尋月令，以四柱配之，必有成敗。',
    '> 「용신은 월령에서 찾는다.」',
  ].join('\n');
  const a = 맞대보기(전, 잘고친것);
  검('⭐ 문장만 다듬은 것은 통과한다', a.흠.length === 0);
  검('잰 것을 함께 준다', a.잰것.원문줄 === 1);

  검('🔴 원전 한문을 고치면 잡는다',
    맞대보기(전, 전.replace('必有成敗', '반드시 성패가 갈린다')).흠.some((s) => /원전 원문/.test(s)));
  검('🔴 원전 한문을 지우면 잡는다',
    맞대보기(전, 전.split('\n').filter((s) => !/用神專尋/.test(s)).join('\n')).흠.some((s) => /원전 원문/.test(s)));
  검('🔴 전문용어를 지어낸 말로 갈면 잡는다',
    맞대보기(전, 전.split('상신').join('도우미')).흠.some((s) => /상신/.test(s)));
  검('🔴 제목을 지우면 잡는다',
    맞대보기(전, 전.split('\n').filter((s) => !/^## /.test(s)).join('\n')).흠.some((s) => /제목/.test(s)));
  검('용어가 «줄어드는» 것은 흠이 아니다 — 문장을 줄일 수 있다',
    맞대보기('용신 용신 용신', '용신').흠.length === 0);
  검('⛔ 빈 글에도 안 터진다', 맞대보기('', '').흠.length === 0);
  검('⛔ null 에도 안 터진다', 맞대보기(null, null).흠.length === 0);
  검('지킬 용어에 격국·용신·상신이 있다',
    ['격국', '용신', '상신', '기신'].every((w) => 지킬용어.includes(w)));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 지금 원고를 잰다 ──────────────────────────────────────── */
if (내가진입점) {
  if (!fs.existsSync(원고방)) { console.error('🔴 원고방이 없다 —', 원고방); process.exit(1); }
  const 파일들 = fs.readdirSync(원고방).filter((f) => f.endsWith('.md')).sort();
  console.log(`■ 교재 다듬기 관문 — 원고 ${파일들.length}편 · ${new Date().toLocaleString('ko-KR')}`);
  console.log('   ⭐ 재는 것은 「문장이 좋아졌나」가 아니라 «잃으면 안 되는 것을 잃었나»다\n');
  let 흠수 = 0;
  for (const f of 파일들) {
    const 길 = path.join(원고방, f);
    const 후 = fs.readFileSync(길, 'utf8');
    let 전 = null;
    try {
      전 = execFileSync('git', ['show', `HEAD:docs/교재/${f}`], { cwd: path.resolve(원고방, '..', '..'), encoding: 'utf8' });
    } catch { /* 아직 커밋 안 된 새 원고다 */ }
    if (전 == null) { console.log(`  ⬜ ${f} — HEAD 에 없다(새 원고). 맞댈 것이 없다`); continue; }
    const { 흠, 잰것 } = 맞대보기(전, 후);
    if (!흠.length) { console.log(`  ✅ ${f} — 원전 ${잰것.원문줄}줄 · 용어 ${잰것.용어}가지 그대로`); continue; }
    흠수 += 흠.length;
    console.log(`  🔴 ${f}`);
    흠.forEach((s) => console.log(`       ${s}`));
  }
  console.log(흠수 ? `\n🔴 ${흠수}건 — 다듬다가 잃은 것이 있다. 되돌리고 문장만 고친다`
    : '\n✅ 잃은 것 없다 — 원전과 용어는 그대로고 문장만 바뀌었다');
  process.exit(흠수 ? 1 : 0);
}
