#!/usr/bin/env node
// 업무보고 자물쇠 — ⛔ 직전 보고를 다시 읽지 않으면 열쇠가 안 나온다.
//
// 사장님 지시(2026-08-09):
//   「**업무보고 전에 직전 업무보고와 관련 히스토리를 꼭 체크하게** 자물쇠를 추가로 만들어」
//
// 왜 필요한가 — 2026-08-09 에 이런 일이 있었다
//   · 11시 보고 PDF 에 본문이 통째로 안 실렸는데 「넘치는 쪽 없음」이라 찍혔다
//   · 아침 보고에 「78% 가 자료판매」를 올렸는데 주고객·부고객이 뒤집힌 표였다
//   · 「/price 404」를 보고에 적었는데 진짜 주소는 /pricing.html 이었다
//   ⛔ 셋 다 **직전 보고를 다시 안 읽어서** 같은 틀로 또 적은 것이다
//
// 쓰기:  node scripts/report-key.mjs                직전 보고를 찍고 물음을 낸다
//        node scripts/report-key.mjs --답 "<값>"     맞으면 열쇠를 준다
//        node scripts/report-key.mjs --자가시험

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const 보고방 = 'C:/Users/USER/OneDrive/업무보고';

/** 보고 파일 이름에서 날짜·때를 뽑는다. */
export function 이름읽기(이름) {
  const m = /^업무보고_(\d{4})_(아침|낮|저녁)\.md$/.exec(String(이름 ?? ''));
  return m ? { 날짜: m[1], 때: m[2], 이름 } : null;
}

/** 제일 최근 보고 하나. ⛔ 파일이 없으면 null — 「없다」가 아니라 「못 찾았다」로 다룬다. */
export function 최근보고고르기(이름들) {
  const 것들 = (이름들 ?? []).map(이름읽기).filter(Boolean);
  if (!것들.length) return null;
  const 때값 = { 아침: 1, 낮: 2, 저녁: 3 };
  것들.sort((a, b) => (a.날짜 === b.날짜 ? 때값[a.때] - 때값[b.때] : a.날짜.localeCompare(b.날짜)));
  return 것들[것들.length - 1];
}

/** 보고에서 「##」 절 제목만 뽑는다. */
export function 절제목들(글) {
  return String(글 ?? '').split('\n')
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, '').trim())
    .filter(Boolean);
}

/** 물음 — 절 수로 정해진 한 절을 묻는다. ⛔ 안 읽으면 못 답한다. */
export function 물음고르기(제목들) {
  if (!제목들.length) return null;
  const 자리 = 제목들.length % 제목들.length === 0 ? 제목들.length - 1 : 0;  // 마지막 절
  return {
    자리: 자리 + 1,
    답: 제목들[자리],
    물음: `직전 보고의 **마지막 ## 절 제목**을 그대로 옮겨 적으십시오 (절 ${제목들.length}개 중 ${자리 + 1}번째)`,
  };
}

export function 답맞나(낸것, 참답) {
  const 다듬기 = (s) => String(s ?? '').replace(/[*`「」"']/g, '').replace(/\s+/g, ' ').trim();
  return 다듬기(낸것) === 다듬기(참답) && 다듬기(참답) !== '';
}

export function 열쇠만들기({ 보고글, 제목수, 오늘 }) {
  const 재료 = [String(보고글 ?? '').length, 제목수 ?? 0, 오늘 ?? ''].join('|');
  return crypto.createHash('sha256').update(재료).digest('hex').slice(0, 10);
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 자가 = (이름, 참인가) => { if (참인가) 통과++; else { 실패++; console.error(`  ✗ ${이름}`); } };

  자가('보고 이름을 읽는다', 이름읽기('업무보고_0809_저녁.md').때 === '저녁');
  자가('날짜를 읽는다', 이름읽기('업무보고_0809_아침.md').날짜 === '0809');
  자가('⛔ pdf 는 안 받는다', 이름읽기('업무보고_0809_저녁.pdf') === null);
  자가('⛔ 딴 이름은 안 받는다', 이름읽기('메모.md') === null);

  const 목록 = ['업무보고_0809_아침.md', '업무보고_0809_저녁.md', '업무보고_0809_낮.md'];
  자가('같은 날이면 저녁이 최근', 최근보고고르기(목록).때 === '저녁');
  자가('날이 다르면 늦은 날이 최근',
       최근보고고르기(['업무보고_0809_저녁.md', '업무보고_0810_아침.md']).날짜 === '0810');
  자가('없으면 null', 최근보고고르기([]) === null);
  자가('⛔ 못 찾은 것을 빈 것으로 안 만든다', 최근보고고르기(['메모.md']) === null);

  const 글 = '# 머리\n## 첫 절\n글\n## 둘째 절\n## 내일 할 것\n';
  자가('절 제목을 뽑는다', 절제목들(글).length === 3);
  자가('머리(#)는 안 뽑는다', !절제목들(글).includes('머리'));
  자가('마지막 절을 묻는다', 물음고르기(절제목들(글)).답 === '내일 할 것');
  자가('절이 없으면 null', 물음고르기([]) === null);

  자가('똑같으면 맞다', 답맞나('내일 할 것', '내일 할 것'));
  자가('굵게 표시는 봐준다', 답맞나('**내일 할 것**', '내일 할 것'));
  자가('빈칸 여러 개는 봐준다', 답맞나('내일   할 것', '내일 할 것'));
  자가('⛔ 다르면 안 된다', 답맞나('내일', '내일 할 것') === false);
  자가('⛔ 빈 답은 안 된다', 답맞나('', '') === false);

  const k = 열쇠만들기({ 보고글: 'abc', 제목수: 3, 오늘: '2026-08-09' });
  자가('열쇠는 열 글자', k.length === 10);
  자가('같으면 같은 열쇠', 열쇠만들기({ 보고글: 'abc', 제목수: 3, 오늘: '2026-08-09' }) === k);
  자가('🔴 보고가 바뀌면 열쇠가 죽는다', 열쇠만들기({ 보고글: 'abcd', 제목수: 3, 오늘: '2026-08-09' }) !== k);
  자가('🔴 날이 바뀌면 열쇠가 죽는다', 열쇠만들기({ 보고글: 'abc', 제목수: 3, 오늘: '2026-08-10' }) !== k);

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  let 이름들 = [];
  try { 이름들 = fs.readdirSync(보고방); } catch { 이름들 = []; }
  const 최근 = 최근보고고르기(이름들);
  if (!최근) { console.log(`⛔ 직전 보고를 못 찾았습니다: ${보고방}`); process.exit(1); }

  const 보고글 = fs.readFileSync(path.join(보고방, 최근.이름), 'utf8');
  const 제목들 = 절제목들(보고글);
  const 물음 = 물음고르기(제목들);
  const 오늘 = new Date().toLocaleDateString('sv-SE');

  const i = process.argv.indexOf('--답');
  const 낸답 = i >= 0 ? process.argv[i + 1] : null;

  if (낸답 == null) {
    console.log(`# 🔒 업무보고 자물쇠 — 직전 보고를 먼저 읽습니다\n`);
    console.log(`직전 보고: **${최근.이름}** (절 ${제목들.length}개)\n`);
    제목들.forEach((t, n) => console.log(`${n + 1}. ${t}`));
    console.log('');
    console.log('⛔ 이 절들을 보고 **이번 보고가 같은 것을 되풀이하는지** 확인하십시오.');
    console.log('⛔ 특히 지난 보고에서 **틀렸던 수**가 이번에도 그대로 들어가는지 보십시오.');
    console.log('');
    if (!물음) { console.log('⛔ 직전 보고에 ## 절이 없습니다.'); process.exit(1); }
    console.log(`## 🔑 열쇠를 받으려면\n\n${물음.물음}\n`);
    console.log('```');
    console.log('node scripts/report-key.mjs --답 "여기에 옮겨 적기"');
    console.log('```');
    process.exit(1);
  }

  if (!답맞나(낸답, 물음.답)) {
    console.log(`⛔ 틀렸습니다. ${최근.이름} 의 **마지막 ## 절**을 다시 보십시오.`);
    process.exit(1);
  }
  console.log(`✅ 열쇠 — ${열쇠만들기({ 보고글, 제목수: 제목들.length, 오늘 })}`);
  console.log('⚠ 직전 보고가 바뀌거나 날이 바뀌면 이 열쇠는 죽습니다.');
}
