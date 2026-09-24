#!/usr/bin/env node
/**
 * klifemap-지면감을-자체ai로-뽑는다.mjs — 자체 AI 둘을 «실제로 돌려» 만들 지면을 정한다
 * ─────────────────────────────────────────────────────────────────────────────
 * 사장님 지시 (2026-09-24):
 *   「케이라이프맵이 사람들에게 인기있는 사이트가 돼 … 자체ai들과 … 공동으로 연구해서」
 *   「**자체ai들도 활용해**」
 *
 * [자체 AI 를 어떻게 «쓰나» — 의견을 묻지 않는다]
 *   ⛔ LLM 에게 「무슨 지면을 만들까요」라고 묻지 않는다. 그건 짐작이고 매번 달라진다.
 *   ✅ 자체 AI 가 «가진 것»으로 답하게 한다 —
 *      ① KLifeMap AI  커뮤니티에서 거둔 손님 물음 + 고전 색인 167대목
 *         ⇒ 「손님이 실제로 묻는 물음」 가운데 「우리 고전이 답할 수 있는 것」을 가른다
 *      ② 투자 AI      마켓 데이터를 성격 딱지로 가르는 판독 방식
 *         ⇒ 같은 방식으로 물음을 «주제 딱지»로 갈라 덩어리를 만든다
 *
 * ⭐ 왜 이것이 지면 제목이 되나 —
 *   손님이 커뮤니티에 쓴 말이 곧 손님이 검색창에 치는 말이다.
 *   그 말로 지면을 만들고, 우리 고전이 답할 수 있는 것만 만든다.
 *   ⛔ 답할 수 없는 물음으로 지면을 만들면 그것이 바로 우리가 없애려는 빈 지면이다.
 *
 * 쓰는 법
 *   node scripts/klifemap-지면감을-자체ai로-뽑는다.mjs
 *   node scripts/klifemap-지면감을-자체ai로-뽑는다.mjs --적는다
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { 거둔질문읽기, 우리것이아닌가, 강령이답하는가, 오늘날짜 } from './ai-cross-review.mjs';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 케맵 = path.join(뿌리, '..', 'klifemap');

/* ── ① KLifeMap AI — 물음마다 «우리 고전이 답하나»를 가른다 ────────────────── */
export function 케맵AI가_답할수있나를_가른다(물음들) {
  const 한줄 = `
    const K=require('./ai/classics.js');
    const qs=${JSON.stringify(물음들)};
    const out=[];
    for (const q of qs) {
      const d=K.대목찾기(q,{최대:2});
      out.push({ q, 답할수있나: d.length>0, 갈래: d[0]?d[0].갈래:null,
                 근거: d.map(x=>x.책우리말+' '+x.편) });
    }
    process.stdout.write(JSON.stringify(out));
  `;
  const 글 = execFileSync(process.execPath, ['-e', 한줄],
    { cwd: 케맵, encoding: 'utf8', timeout: 60000, maxBuffer: 5e7 });
  return JSON.parse(글);
}

/* ── ② 투자 AI 방식 — 물음을 «성격 딱지»로 가른다 ──────────────────────────
   ⭐ 투자 AI 가 종목에 「저PBR·적자·고ROE」를 붙이듯, 물음에 주제 딱지를 붙인다.
     판정은 규칙이 한다 — LLM 이 아니다. 그래야 같은 물음에 같은 딱지가 붙는다. */
export const 딱지규칙 = [
  ['궁합·연애', /궁합|상성|결혼|배우자|연애|이별|재회|짝사랑|이혼|相性|婚姻|姻緣|marriage|synastry|compatib|love|dating|relationship|ex\b/i],
  ['직업·이직', /직업|취업|이직|승진|사업|창업|퇴사|事業|職業|仕事|career|job|work|promotion|business/i],
  ['재물·투자', /재물|돈|재산|투자|수입|빚|財運|金運|money|wealth|finance|rich|invest/i],
  ['학업·시험', /학업|시험|공부|합격|입시|자격|考試|勉強|exam|study|school|degree/i],
  ['건강·몸', /건강|병|아프|질병|수술|健康|病気|health|illness|disease|surgery/i],
  ['택일·날짜', /택일|이사|날짜|개업|擇日|搬家|引っ越|auspicious|date/i],
  ['작명·이름', /작명|개명|이름|改名|取名|naming|name change/i],
  ['가족·부모', /부모|자식|자녀|형제|가족|시댁|父母|家族|family|parents|child|sibling/i],
  ['내 사주가 뭔가', /사주|팔자|명식|명반|八字|命盤|四柱|bazi|four.?pillar|my chart|read my/i],
  ['별자리·차트', /별자리|점성|하우스|어스펙트|natal|chart|house|aspect|stellium|retrograde|星座|占星/i],
  ['운의 시기', /언제|시기|올해|내년|대운|세운|流年|大運|when|timing|this year|next year/i],
];

export function 딱지붙이기(물음) {
  const 붙은것 = [];
  for (const [이름, 무늬] of 딱지규칙) if (무늬.test(물음)) 붙은것.push(이름);
  return 붙은것;
}

/* ── 합쳐서 «만들 지면» 후보를 낸다 ────────────────────────────────────── */
export function 지면후보(가른것) {
  const 덩이 = new Map();
  for (const x of 가른것) {
    if (!x.답할수있나) continue;                 /* ⛔ 고전이 답 못 하면 안 만든다 */
    for (const 딱지 of 딱지붙이기(x.q)) {
      if (!덩이.has(딱지)) 덩이.set(딱지, { 딱지, 물음수: 0, 보기: [], 근거: new Set() });
      const d = 덩이.get(딱지);
      d.물음수++;
      if (d.보기.length < 4) d.보기.push(x.q.slice(0, 70));
      for (const g of x.근거) d.근거.add(g);
    }
  }
  return [...덩이.values()].sort((a, b) => b.물음수 - a.물음수);
}

/* ── 실행 ──────────────────────────────────────────────────────────────── */
const 이파일로실행 = process.argv[1] && process.argv[1].includes('지면감을-자체ai로-뽑는다');
if (이파일로실행) {
  const 물음들 = 거둔질문읽기().filter((q) => !우리것이아닌가(q));
  console.log('■ 자체 AI 둘로 «만들 지면»을 뽑는다 — 사장님 2026-09-24');
  console.log('  ⛔ LLM 에게 「무슨 지면을 만들까요」를 묻지 않는다. 가진 것으로 답하게 한다');
  console.log(`\n   손님 물음 ${물음들.length}개 (커뮤니티에서 거둔 것)`);

  const 가른것 = 케맵AI가_답할수있나를_가른다(물음들);
  const 답가능 = 가른것.filter((x) => x.답할수있나).length;
  /* 🔴 [2026-09-24 · 사장님 지시] 「못 찾은 것」을 뭉뚱그리지 않는다 —
     ① 고전이 답한다 ② 고전엔 없지만 «우리 강령»이 답한다 ③ 정말로 아직 못 찾았다.
     셋을 섞어 세면 「24개를 못 찾았다」가 거짓이 된다. */
  const 강령몫 = 가른것.filter((x) => !x.답할수있나 && 강령이답하는가(x.q));
  const 아직 = 가른것.filter((x) => !x.답할수있나 && !강령이답하는가(x.q));
  console.log(`   ① 고전이 답한다        ${답가능}개  (${Math.round(답가능 / 물음들.length * 100)}%)`);
  console.log(`   ② 우리 강령이 답한다    ${강령몫.length}개  — 고전엔 없지만 사장님이 정하신 것이 답이다`);
  console.log(`   ③ 아직 못 찾았다        ${아직.length}개`);
  if (아직.length) {
    console.log('      ⬜ 아직 못 찾은 것 —');
    for (const x of 아직.slice(0, 10)) console.log(`         · ${x.q.slice(0, 66)}`);
  }
  console.log('   ⭐ ①만 지면으로 만든다. ②는 상담이 답한다. ③은 출처를 찾는다\n');

  const 후보 = 지면후보(가른것);
  console.log('   ─── 만들 지면 후보 (손님 물음이 많은 순) ───');
  for (const d of 후보) {
    console.log(`\n   【${d.딱지}】  물음 ${d.물음수}개`);
    for (const q of d.보기) console.log(`      · ${q}`);
    console.log(`      근거 고전: ${[...d.근거].slice(0, 3).join(' · ')}`);
  }

  if (process.argv.includes('--적는다') || process.argv.includes('--save')) {
    const 낼곳 = path.join(뿌리, 'docs', `klifemap-만들지면-${오늘날짜()}.md`);
    const 글 = [
      `# 케이라이프맵 — 만들 지면 (자체 AI 가 뽑은 것)`, '',
      `> ${오늘날짜()} · 사장님 지시 「자체ai들도 활용해」`, '',
      `손님 물음 ${물음들.length}개 가운데 우리 고전이 답할 수 있는 것 **${답가능}개**.`,
      '⛔ 답 못 하는 물음으로 지면을 만들지 않는다 — 그것이 빈 지면이다.', '',
      '| 딱지 | 물음 수 | 보기 | 근거 고전 |',
      '|---|---:|---|---|',
      ...후보.map((d) => `| **${d.딱지}** | ${d.물음수} | ${d.보기[0] || ''} | ${[...d.근거][0] || ''} |`),
    ].join('\n');
    fs.writeFileSync(낼곳, 글 + '\n', 'utf8');
    console.log(`\n   ✅ 적었다 — docs/klifemap-만들지면-${오늘날짜()}.md`);
  }
}
