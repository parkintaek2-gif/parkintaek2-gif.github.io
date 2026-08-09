#!/usr/bin/env node
// 물음 자물쇠 — 사장님이 물으신 것 중 **아직 안 끝난 것**을 찍는다.
//
// 사장님 지시(2026-08-09):
//   「내가 물어본 데 대해 다시 살펴보고 **대화의 끝부분에 전체 사항을 알 수 있게 보고**해. 항상」
//   「**내가 물으면 히스토리부터 찾도록** 자물쇠를 만들어」
//
// ⛔ 이 자가 「히스토리 안 찾음」을 하나라도 찾으면 **답하면 안 된다.**
// ⛔ 이 자의 출력을 **매 답변 끝에** 붙인다. 안 붙이면 물음이 조용히 사라진다.
//
// 쓰기:  node scripts/check-answered.mjs
//        node scripts/check-answered.mjs --자가시험

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 대장길 = 'docs/사장님-물음-대장.tsv';
export const 상태들 = ['답함', '진행', '막힘'];

export function 줄읽기(줄) {
  const 글 = String(줄 ?? '').replace(/\r$/, '');
  if (!글.trim() || 글.trimStart().startsWith('#')) return null;
  const 칸 = 글.split('\t').map((s) => s.trim());
  if (칸.length < 3) return null;
  const [날짜, 물음, 상태, 히스토리, 어디에] = 칸;
  if (!물음) return null;
  return { 날짜, 물음, 상태: 상태 || '', 히스토리: 히스토리 || '', 어디에: 어디에 || '' };
}

export const 히스토리찾았나 = (r) => String(r?.히스토리 ?? '').includes('✅');
export const 끝났나 = (r) => r?.상태 === '답함';

/** 흠 — ⛔ 안 찾고 답한 것이 제일 나쁘다 */
export function 흠찾기(줄들) {
  const 흠 = [];
  for (const r of 줄들) {
    if (!히스토리찾았나(r)) {
      흠.push({ 급함: '🔴', 말: `히스토리를 안 찾고 두었다 — 「${r.물음}」` });
    }
    if (!상태들.includes(r.상태)) {
      흠.push({ 급함: '⚠', 말: `상태가 「${r.상태}」 — 답함·진행·막힘 중 하나여야 한다: 「${r.물음}」` });
    }
    if (끝났나(r) && !r.어디에) {
      흠.push({ 급함: '⚠', 말: `답했다는데 **어디에 답했는지가 없다** — 「${r.물음}」` });
    }
  }
  return 흠;
}

export function 요약글(줄들) {
  const 남은것 = 줄들.filter((r) => !끝났나(r));
  const 흠 = 흠찾기(줄들);
  const 줄 = [];
  줄.push(`## 사장님 물음 — 전체 ${줄들.length}건 · **남은 것 ${남은것.length}건**`);
  줄.push('');
  if (!줄들.length) { 줄.push('⛔ 대장이 비어 있다. 물음을 한 줄도 안 적었다.'); return 줄.join('\n'); }
  if (!남은것.length) 줄.push('✅ 물으신 것에 다 답했습니다.');
  for (const r of 남은것) {
    const 표 = r.상태 === '막힘' ? '🖐' : '⏳';
    줄.push(`${표} **${r.물음}** — ${r.상태}${r.어디에 ? ` · ${r.어디에}` : ''}`);
  }
  if (흠.length) {
    줄.push('');
    for (const h of 흠) 줄.push(`${h.급함} ${h.말}`);
  }
  return 줄.join('\n');
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 자가 = (이름, 참인가) => { if (참인가) 통과++; else { 실패++; console.error(`  ✗ ${이름}`); } };

  자가('주석은 버린다', 줄읽기('# 머리') === null);
  자가('칸이 모자라면 버린다', 줄읽기('2026-08-09\t물음') === null);
  const r = 줄읽기('2026-08-09\t대표 메일 언제\t답함\t✅\t내일 오전');
  자가('물음을 읽는다', r.물음 === '대표 메일 언제');
  자가('상태를 읽는다', r.상태 === '답함');
  자가('히스토리 표시를 읽는다', 히스토리찾았나(r) === true);
  자가('어디에를 읽는다', r.어디에 === '내일 오전');
  자가('빈 물음은 버린다', 줄읽기('2026-08-09\t\t답함') === null);

  자가('답함은 끝난 것', 끝났나(r) === true);
  자가('진행은 안 끝난 것', 끝났나({ 상태: '진행' }) === false);
  자가('막힘도 안 끝난 것', 끝났나({ 상태: '막힘' }) === false);

  const 안찾음 = 줄읽기('2026-08-09\t뭐냐\t답함\t⛔\t어딘가');
  자가('🔴 히스토리 안 찾은 것을 잡는다', 흠찾기([안찾음]).some((h) => h.급함 === '🔴'));
  자가('안 찾았다고 말해 준다', 흠찾기([안찾음])[0].말.includes('안 찾고'));
  자가('찾은 것은 안 잡는다', 흠찾기([r]).length === 0);

  const 상태틀림 = 줄읽기('2026-08-09\t뭐냐\t나중에\t✅\t어딘가');
  자가('상태가 틀리면 잡는다', 흠찾기([상태틀림]).some((h) => h.말.includes('답함·진행·막힘')));

  const 어디에없음 = 줄읽기('2026-08-09\t뭐냐\t답함\t✅');
  자가('⛔ 답했다는데 어디에 답했는지 없으면 잡는다',
       흠찾기([어디에없음]).some((h) => h.말.includes('어디에 답했는지')));

  const 진행중 = 줄읽기('2026-08-09\t아직\t진행\t✅\t하는 중');
  const 글 = 요약글([r, 진행중]);
  자가('남은 것 수를 센다', 글.includes('남은 것 1건'));
  자가('남은 것을 보여 준다', 글.includes('아직'));
  자가('끝난 것은 목록에 안 넣는다', !글.split('남은 것')[1].includes('대표 메일'));
  자가('다 답하면 그렇게 말한다', 요약글([r]).includes('다 답했습니다'));
  자가('막힘은 손 표시로 찍는다', 요약글([줄읽기('2026-08-09\tx\t막힘\t✅\ty')]).includes('🖐'));
  자가('빈 대장을 빈 것으로 말한다', 요약글([]).includes('비어 있다'));

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  if (!fs.existsSync(대장길)) { console.log(`⛔ 대장이 없다: ${대장길}`); process.exit(1); }
  const 줄들 = fs.readFileSync(대장길, 'utf8').split('\n').map(줄읽기).filter(Boolean);
  console.log(요약글(줄들));
  const 빨강 = 흠찾기(줄들).filter((h) => h.급함 === '🔴').length;
  process.exit(빨강 > 0 ? 1 : 0);
}
