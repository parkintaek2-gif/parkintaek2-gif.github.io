#!/usr/bin/env node
/**
 * check-findings.mjs — **발견 문서가 다섯 가지를 갖췄나. 그리고 목록에 올랐나.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만드나 — 사장님 지시 2026-09-03]
 *   > 「1. 오늘처럼 여러 세션들이 모두 나서 **함께** 일하니 얼마나 좋은지 모르겠다.
 *   >  계속 이렇게 작업하며 스스로 발전하라
 *   >  2. **새롭게 확인된 것들은 문서로 작성해서 다 공유하라**고 지시해」
 *
 *   ⛔ `docs/세션간-메모.md` 에 한 줄 적는 것은 «공유»가 아니다. 그 파일은 **17만 줄이 넘는다.**
 *      오늘 알아낸 것이 내일이면 아무도 못 찾는다. 실제로 그렇게 잃은 것이 여럿이다 —
 *      「이벤트 캘린더가 이미 있는데 안 보고 콘텐츠 기획을 새로 썼다」(2026-08-02).
 *
 *   ⛔ 그리고 「문서로 쓰자」는 «문장으로 둔 규칙»이라 잊힌다.
 *      3번이 「앞으로 새 고정 지면을 만들 때마다 반드시 넣는다」고 적어 두고
 *      **같은 날 세 번** 또 어겼다. 우리 강령이 「규칙은 문장이 아니라 검사로 둔다」인 까닭이다.
 *
 * [무엇을 재나 — `docs/발견/README.md` 에 적힌 다섯 가지]
 *   1. 결론을 제목에            제목이 결론이다. 「…에 대하여」 같은 제목은 결론이 아니다
 *   2. 어떻게 쟀나              돌린 명령·본 파일·표본 수가 있다
 *   3. 잰 것과 판단을 갈라 적기   「제 판단」·「짐작」 같은 말로 갈라 놓았다
 *   4. 못 잰 것을 「못 쟀다」로    ⬜ 이나 「못 쟀다」가 있다
 *   5. 목록에 올랐나            README 의 표에 그 파일이 링크돼 있다
 *
 * [⛔ 헛경보를 막으려고 둔 것]
 *   · 「물린 것」(5번 요소)은 **있으면 좋은 것**이고 없어도 흠이 아니다 —
 *     뒤집을 앞선 결론이 없는 발견도 있다. 억지로 넣으라고 하면 지어내게 된다
 *   · README 자신은 발견 문서가 아니다. 재지 않는다
 *   ⭐ 잘못 잡는 자는 꺼진다. 꺼진 자는 없는 자다
 *
 * [쓰는 법]
 *   node scripts/check-findings.mjs
 *   node scripts/check-findings.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 발견방 = path.join(뿌리, 'docs', '발견');

/** 제목이 «결론»인가 — 「…에 대하여」·「…검토」처럼 결론이 없는 제목을 잡는다 */
export function 제목이결론인가(글) {
  const 첫 = String(글 ?? '').split(/\r?\n/).find((l) => l.startsWith('# '));
  if (!첫) return { 됐나: false, 왜: '# 로 시작하는 제목이 없다' };
  const 제목 = 첫.slice(2).trim();
  if (제목.length < 8) return { 됐나: false, 왜: '제목이 너무 짧다' };
  /* 결론이 없는 제목의 꼴 */
  const 빈꼴 = ['에 대하여', '에 대해', '검토', '정리', '메모', '기록', '현황', '살펴보기'];
  const 걸린 = 빈꼴.find((w) => 제목.endsWith(w));
  if (걸린) return { 됐나: false, 왜: `제목이 「${걸린}」로 끝난다 — 결론이 아니다`, 제목 };
  return { 됐나: true, 제목 };
}

/** 어떻게 쟀나가 적혀 있나 — 명령·파일·표본 가운데 하나라도 */
export function 재는법이있나(글) {
  const s = String(글 ?? '');
  const 표 = ['어떻게 쟀나', '어떻게 재', '돌린 명령', 'node scripts/', 'node tools/',
    'curl ', 'grep ', 'ffmpeg', '표본', '실측'];
  const 든것 = 표.filter((w) => s.includes(w));
  return { 됐나: 든것.length > 0, 든것 };
}

/** 잰 것과 판단을 갈라 놓았나 */
export function 갈라놓았나(글) {
  const s = String(글 ?? '');
  const 표 = ['제 판단', '내 판단', '짐작', '실측', '제 짐작', '판단입니다', '판단이다'];
  const 든것 = 표.filter((w) => s.includes(w));
  return { 됐나: 든것.length > 0, 든것 };
}

/**
 * 🔴 [2026-09-03] **빈 절을 통과시켰다.**
 *   내가 「## 6부. 잰 것과 제 판단을 갈라 적는다」라는 «제목만» 넣고 속을 비웠는데
 *   이 자가 초록을 냈다 — 제목에 「제 판단」 글자가 있으니 통과시킨 것이다.
 *   (셸이 괄호 줄을 먹어 본문이 통째로 사라진 것을 눈으로 보고 알았다)
 *   ⛔ **제목은 약속이고 속이 내용이다.** 약속만 보고 초록을 내면 자가 거짓말한다.
 *   ✅ 그래서 절마다 «속이 몇 줄인가»를 센다.
 */
export function 빈절찾기(글, 최소줄 = 2) {
  const 줄들 = String(글 ?? '').split(/\r?\n/);
  const 빈것 = [];
  for (let i = 0; i < 줄들.length; i += 1) {
    if (!줄들[i].startsWith('## ')) continue;
    let 속 = 0;
    for (let j = i + 1; j < 줄들.length; j += 1) {
      if (줄들[j].startsWith('## ')) break;
      if (줄들[j].trim() && !줄들[j].trim().startsWith('```')) 속 += 1;
    }
    if (속 < 최소줄) 빈것.push({ 절: 줄들[i].slice(3).trim(), 속 });
  }
  return 빈것;
}

/** 못 잰 것을 적었나 */
export function 못쟀다가있나(글) {
  const s = String(글 ?? '');
  return { 됐나: s.includes('못 쟀') || s.includes('못 잰') || s.includes('⬜') };
}

/** 물린 것이 있나 — 없어도 흠이 아니다. «있으면» 좋은 것이라 세기만 한다 */
export function 물린것이있나(글) {
  const s = String(글 ?? '');
  return { 있나: s.includes('물린') || s.includes('물립니다') || s.includes('틀렸') };
}

function 자가시험() {
  let 흠 = 0; let 잰수 = 0;
  const 본다 = (이름, 참) => { 잰수 += 1; if (참) console.log(`  ✅ ${이름}`); else { console.log(`  🔴 ${이름}`); 흠 += 1; } };

  본다('제목이 결론이면 통과', 제목이결론인가('# 노출 470건이 우리 404 로 샜다').됐나 === true);
  본다('「…에 대하여」는 잡는다', 제목이결론인가('# 검색 노출에 대하여').됐나 === false);
  본다('「…검토」는 잡는다', 제목이결론인가('# 점성학 상품 검토').됐나 === false);
  본다('제목이 없으면 잡는다', 제목이결론인가('그냥 글').됐나 === false);
  본다('너무 짧은 제목을 잡는다', 제목이결론인가('# 짧다').됐나 === false);

  본다('재는 법이 있으면 통과', 재는법이있나('## 어떻게 쟀나\nnode scripts/x.mjs').됐나 === true);
  본다('재는 법이 없으면 잡는다', 재는법이있나('그냥 그렇게 보인다').됐나 === false);

  본다('갈라 놓으면 통과', 갈라놓았나('실측은 이렇고 제 판단은 저렇다').됐나 === true);
  본다('안 갈라 놓으면 잡는다', 갈라놓았나('이렇게 됐다').됐나 === false);

  본다('못 쟀다가 있으면 통과', 못쟀다가있나('⬜ 못 쟀다 — 표본이 없다').됐나 === true);
  본다('못 쟀다가 없으면 잡는다', 못쟀다가있나('다 쟀다').됐나 === false);

  /* ⚠ 물린 것은 «없어도 흠이 아니다» — 세기만 한다 */
  /* 🔴 2026-09-03 에 실제로 낸 결함 — 이 셋이 그것을 막는다 */
  본다('빈 절을 잡는다', 빈절찾기('# 제목\n\n## 가\n\n## 나\n내용 한 줄\n또 한 줄').length === 1);
  본다('속이 찬 절은 안 잡는다', 빈절찾기('# 제목\n\n## 가\n한 줄\n두 줄').length === 0);
  본다('울타리(```)만 있는 절은 빈 것으로 본다',
    빈절찾기('# 제목\n\n## 가\n```\n```').length === 1);

  본다('물린 것을 알아본다', 물린것이있나('앞 진단을 물립니다').있나 === true);
  본다('물린 것이 없어도 판정하지 않는다', 물린것이있나('처음 발견이다').있나 === false);

  console.log(흠 ? `\n🔴 자가시험 ${잰수}가지 중 ${흠}가지 틀렸다` : `\n✅ 자가시험 ${잰수}가지 다 맞다`);
  return 흠;
}

function main() {
  const 인자 = process.argv.slice(2);
  console.log('# 발견 문서가 다섯 가지를 갖췄나\n');
  const 흠 = 자가시험();
  if (인자.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('\n⛔ 자가시험이 틀렸다. 재지 않는다.'); process.exit(1); }

  if (!fs.existsSync(발견방)) {
    console.log('\n⬜ **못 쟀다** — docs/발견/ 이 없다.');
    console.log('   ⛔ 이것은 「통과」가 아니다. 사장님 지시(2026-09-03)로 있어야 하는 폴더다.');
    process.exit(1);
  }

  const README = path.join(발견방, 'README.md');
  const 목록글 = fs.existsSync(README) ? fs.readFileSync(README, 'utf8') : '';
  const 파일들 = fs.readdirSync(발견방).filter((f) => f.endsWith('.md') && f !== 'README.md');

  if (!파일들.length) {
    console.log('\n⬜ **발견 문서가 하나도 없다.**');
    console.log('   ⛔ 「통과」가 아니다. 오늘 새로 확인한 것이 정말 하나도 없었는지 스스로 물어본다.');
    process.exit(1);
  }

  console.log(`\n발견 문서 ${파일들.length}편\n`);
  let 총흠 = 0; let 물린수 = 0;

  for (const f of 파일들) {
    const 글 = fs.readFileSync(path.join(발견방, f), 'utf8');
    const 흠들 = [];
    const t = 제목이결론인가(글); if (!t.됐나) 흠들.push(`제목: ${t.왜}`);
    if (!재는법이있나(글).됐나) 흠들.push('어떻게 쟀나가 없다');
    if (!갈라놓았나(글).됐나) 흠들.push('잰 것과 판단을 안 갈랐다');
    if (!못쟀다가있나(글).됐나) 흠들.push('못 잰 것을 안 적었다 — 0 으로 채운 것이 아닌가');
    if (!목록글.includes(f)) 흠들.push('README 목록에 없다 — 공유가 안 된 것이다');
    /* 🔴 제목만 있고 속이 빈 절을 잡는다 — 2026-09-03 에 내가 그것을 통과시켰다 */
    for (const b of 빈절찾기(글)) 흠들.push(`「${b.절}」 절이 비었다 (속 ${b.속}줄) — 제목은 약속이고 속이 내용이다`);
    if (물린것이있나(글).있나) 물린수 += 1;

    if (!흠들.length) { console.log(`  ✅ ${f}`); continue; }
    총흠 += 흠들.length;
    console.log(`  🔴 ${f}`);
    for (const x of 흠들) console.log(`       ${x}`);
  }

  console.log(`\n⭐ 앞선 결론을 «물린» 문서 ${물린수}편 — 물린 기록이 있어야 다음 사람이 옛 결론을 안 되살린다`);

  if (!총흠) {
    console.log('\n✅ 발견 문서가 다 갖췄고 목록에도 올랐다');
    process.exit(0);
  }
  console.log(`\n🔴 흠 ${총흠}건 — docs/발견/README.md 의 「다섯 가지」를 채운다`);
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('check-findings.mjs')) main();
