#!/usr/bin/env node
/**
 * ganglyeong-brief.mjs — **하루 시작에 자기 강령을 되새긴다.**
 *
 * 🔴 왜 — 2026-08-09 00:5x 사장님:
 *   *「자꾸 취지, 목적을 잊고 옆으로 새지마. 모든 유닛에서. 왜 시작을 했는 지까지
 *     매일 0시가 되면 자동으로 확인하게 조치를 취해」*
 *
 * ⛔ 강령 문서에는 이미 「하루를 시작하며 본다. 늘 처음처럼」이라고 적혀 있었다.
 *   **적혀 있었는데 아무도 안 봤다.** 8/8 에 2번이 「백년(百年之圖)」을 햇수로 읽고
 *   교육·진로 사이트에 「100년 넘은 학교」를 실었다. 문장으로 둔 규칙은 안 지켜진다.
 *   ⭐ 그래서 **읽히는 자리에 자동으로 꽂는다.**
 *
 * 쓰는 법
 *   node scripts/ganglyeong-brief.mjs --자리 3       한 자리 것만 찍는다
 *   node scripts/ganglyeong-brief.mjs --메모          여섯 자리 것을 메모에 붙인다(0시 예약이 부른다)
 *   node scripts/ganglyeong-brief.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 강령 정본은 사장님 것이다. ⛔ 세션이 고치지 않는다. 읽기만 한다. */
export const 강령길 = [
  'C:/Users/USER/Desktop/00_네사이트-강령.md',
  'C:/Users/USER/OneDrive/00_네사이트-강령.md',
  path.join(뿌리, 'docs/네-사이트-강령.md'),
];

/** 자리 → 강령 안의 제목 */
export const 자리별 = {
  '1': { 이름: 'KLifeMap', 표: 'KLifeMap' },
  '3': { 이름: '백년지도', 표: '백년지도' },
  '5': { 이름: 'K Culture Wire', 표: 'WikiTip' },
  '6': { 이름: 'SeoulMarkets', 표: 'SeoulMarkets' },
  '4': { 이름: '일본(KLifeMap 보조)', 표: 'KLifeMap' },
  '7': { 이름: '감수(KLifeMap 보조)', 표: 'KLifeMap' },
  '8': { 이름: '자료 검증(백년지도 보조)', 표: '백년지도' },
  '2': { 이름: '조율 — 넷 다', 표: null },
};

/** 강령 원문에서 한 사이트 절만 오려 낸다 */
export function 절뽑기(원문, 표) {
  const 글 = String(원문 ?? '');
  if (!표) return 글.split('---')[1] ?? '';          // 2번은 「하나로 꿰는 것」을 본다
  const 시작 = 글.search(new RegExp(`^##\\s*[ⅠⅡⅢⅣIVX]*\\.?\\s*.*${표}`, 'm'));
  if (시작 < 0) return '';
  const 뒤 = 글.slice(시작);
  const 끝 = 뒤.search(/^---$/m);
  return 끝 > 0 ? 뒤.slice(0, 끝).trim() : 뒤.trim();
}

/** 「오늘 시작하며 스스로 묻는 것」 — 강령 끝의 네 물음 + 취지 확인 한 줄 */
export const 물음 = [
  '오늘 하려는 일이 **이 사이트의 모토**에 맞는가 — 아니면 그건 남의 사이트 일이다',
  '오늘 만든 것이 상품인가 — 정지작업은 팔 수 없다',
  '재고 말했는가 — 못 쟀으면 「못 쟀다」고 한다',
  '사람을 전제하지 않았는가 — 채용·부탁·인맥이 들어갔으면 다시 짠다',
];

export function 읽기(길들 = 강령길) {
  for (const p of 길들) {
    try { const s = fs.readFileSync(p, 'utf8'); if (s.trim()) return { 길: p, 글: s }; } catch { /* 다음 */ }
  }
  return { 길: null, 글: '' };
}

export function 만들기(자리, 원문) {
  const 짝 = 자리별[String(자리)];
  if (!짝) return `⛔ 모르는 자리: ${자리}`;
  const 절 = 절뽑기(원문, 짝.표);
  const 줄 = [
    `# 🧭 ${자리}번 · ${짝.이름} — **오늘의 강령**`,
    '',
    '> ⛔ 이걸 읽기 전에 오늘 일을 시작하지 않는다. **늘 처음처럼.**',
    '',
    절 || '⚠ 강령에서 이 자리 절을 못 찾았다 — `00_네사이트-강령.md` 를 직접 보라.',
    '',
    '## 오늘 스스로 묻는 것',
    '',
    ...물음.map((q, i) => `${i + 1}. ${q}`),
    '',
    '⚠ ①에 「아니다」가 하나라도 있으면 **그 일을 오늘 하지 않는다.**',
  ];
  return 줄.join('\n');
}

/* ── 검사 ── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 120)}`); }
  };
  const 본 = `# 머리\n\n---\n\n## 하나로 꿰는 것\n같이 쓰는 말\n\n---\n\n## Ⅱ. 백년지도 · \`100yearmap.com\` — 교육·진로\n\n**모토**\n교육은 백년지계다\n\n---\n\n## Ⅲ. KLifeMap · \`klifemap.ai\` — 명리\n\n**모토**\n나침반\n`;
  재본다('백년지도 절을 뽑는다', 절뽑기(본, '백년지도').includes('교육은 백년지계다'), true);
  재본다('남의 절은 안 섞인다', 절뽑기(본, '백년지도').includes('나침반'), false);
  재본다('KLifeMap 절도 뽑는다', 절뽑기(본, 'KLifeMap').includes('나침반'), true);
  재본다('없는 이름이면 빈 글', 절뽑기(본, '없는사이트'), '');
  재본다('빈 원문에 안 죽는다', 절뽑기(null, '백년지도'), '');
  재본다('2번은 꿰는 것을 본다', 절뽑기(본, null).includes('하나로 꿰는 것'), true);
  재본다('모르는 자리는 알린다', 만들기('99', 본).startsWith('⛔'), true);
  재본다('만든 글에 물음 넷이 있다', 물음.every((q) => 만들기('3', 본).includes(q)), true);
  재본다('절을 못 찾아도 글은 나온다', 만들기('3', '# 아무것도 없음').includes('못 찾았다'), true);
  재본다('자리는 여덟이다', Object.keys(자리별).length, 8);
  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
const argv = process.argv.slice(2);
const { 길, 글 } = 읽기();
if (!글) { console.error('⛔ 강령을 못 읽었다. 찾은 곳: ' + 강령길.join(' · ')); process.exit(1); }

const i = argv.indexOf('--자리');
if (i >= 0) {
  const 자리 = argv[i + 1];
  console.log(만들기(자리, 글));

  /* ⭐ 본 표를 남긴다 — 이것이 있어야 check-ganglyeong-read 가 통과한다.
   *   ⛔ 날짜는 밖에서 넘긴다. 이 자가 시계를 보면 자정 근처에서 혼자 날이 바뀐다.
   *      안 넘기면 표를 안 남긴다(찍어 보기만 한 것으로 친다). */
  const j = argv.indexOf('--오늘');
  const 오늘 = j >= 0 ? String(argv[j + 1] ?? '').trim() : '';
  if (오늘 && 자리별[String(자리)]) {
    const 폴더 = path.join(뿌리, '.ganglyeong');
    fs.mkdirSync(폴더, { recursive: true });
    fs.writeFileSync(path.join(폴더, `${오늘}-${자리}.txt`), `${오늘} ${자리}번 강령 봄\n`);
    console.log(`\n✅ 봤다고 적었습니다 — .ganglyeong/${오늘}-${자리}.txt`);
  } else if (!오늘) {
    console.log('\n⚠ `--오늘 <날짜>` 를 안 넘겨서 **본 표를 안 남겼습니다.** 그러면 다음 검사에서 막힙니다.');
  }
  process.exit(0);
}

if (argv.includes('--메모')) {
  const 오늘 = argv[argv.indexOf('--메모') + 1] || '';   // 날짜는 밖에서 넘긴다(스크립트가 시계를 안 본다)
  const 덩이 = ['', '---', '', `# 🧭 [2번 → 모든 자리] **하루를 시작하며 — 강령을 먼저 봅니다** ${오늘}`, '',
    '> 🔴 사장님(2026-08-09) — 「자꾸 취지·목적을 잊고 옆으로 새지 마라. **왜 시작을 했는지까지** 매일 0시에 확인하라」',
    '', '⛔ 오늘 일을 시작하기 전에 **자기 절만** 읽으십시오. 남의 것은 안 읽어도 됩니다.', '',
    '```', 'node scripts/ganglyeong-brief.mjs --자리 <내 번호>', '```', '',
    '⚠ 8/8 에 2번이 「백년(百年之圖)」을 **햇수**로 읽고 교육·진로 지면에 「100년 넘은 학교」를 실었습니다.',
    '   강령에 이미 「하루를 시작하며 본다」고 적혀 있었는데 **아무도 안 봤습니다.**', '',
    ...Object.entries(자리별).filter(([n]) => n !== '2').map(([n, v]) => {
      const 절 = 절뽑기(글, v.표);
      const 모토 = (절.match(/\*\*모토\*\*\n([^\n]+)/) ?? [])[1] ?? '(못 찾음)';
      return `- **${n}번 ${v.이름}** — ${모토}`;
    }),
    '', `⚠ 강령 정본: \`${길}\` — ⛔ 세션은 고치지 않습니다. 고칠 것이 있으면 보고로 말합니다.`, '',
    '— **2번(조율)**', ''];
  console.log(덩이.join('\n'));
  process.exit(0);
}

console.log(만들기('2', 글));
