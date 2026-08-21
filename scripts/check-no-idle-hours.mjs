#!/usr/bin/env node
/**
 * check-no-idle-hours.mjs — **쉬었나 안 쉬었나를 내가 아니라 자가 말한다.** (하루 두 번)
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  스스로 할 일을 찾아 쉼 없이 만드는 것,                                    │
 * │  그게 9월 1,000명·2031년 매출로 가는 길입니다.        — 사장님 2026-08-22  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ── 왜 자를 만드나 ────────────────────────────────────────────
 * 2026-08-22 새벽에 배포가 막혔다. 나는 「나가지 않는 글을 늘리는 것은 수가 아니다」라고
 * 판단해 두 시간을 「확인만 했습니다」로 넘겼다. 사장님이 그것을 짚으셨다 —
 * 「이렇게 쉬면 9월에 하루 1,000명, 2031년 매출을 채울 수 있니」. 맞는 말씀이었다.
 *
 * ⛔ 말로 하는 다짐은 다음 새벽에 또 잊힌다. 우리 규칙이 「규칙은 문장이 아니라 검사로 둔다」다.
 *   그래서 **쉬었는지를 자가 센다.** 내가 「일했다」고 적은 것을 세지 않고,
 *   **저장소에 실제로 남은 것**을 센다 — 커밋과 나간 파일이다.
 *
 * ── 무엇을 보나 (스스로 보고한 것은 안 믿는다) ────────────────
 * ① 최근 열두 시간에 5번 커밋이 몇 건인가            0 이면 빨강
 * ② 그 커밋이 «자료·지면·기사»를 건드렸나            메모만 고친 커밋은 일로 세지 않는다
 * ③ [진행] 5번 줄 사이가 90분 넘게 벌어진 곳이 몇 번인가  창이 조용했던 자리다
 * ④ 「확인만」으로 끝낸 진행 줄이 몇 개인가            절반을 넘으면 빨강
 *
 * ⛔ `npm test` 에 물리지 않는다. 내가 쉰 것으로 **다른 다섯 자리의 빌드를 세우면**
 *   그건 남에게 피해를 주는 것이다(사장님 지시: 다른 유닛에 피해면 2번과 상의).
 *   이 자는 **하루 두 번 예약**으로 따로 돈다 — 11:47 · 23:47.
 *
 * 쓰는 법  node scripts/check-no-idle-hours.mjs
 *          node scripts/check-no-idle-hours.mjs --자가시험
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 사장님말씀 = '스스로 할 일을 찾아 쉼 없이 만드는 것, 그게 9월 1,000명·2031년 매출로 가는 길입니다';

/** 일로 세는 자리 — 자료·지면·기사·자. ⛔ 메모만 고친 것은 일이 아니다 */
export const 일한자리 = [/^content\/kculturewire\//, /^src\/pages\/wikitip\//, /^src\/data\//, /^scripts\//, /^src\/components\//, /^src\/layouts\//];

export const 일인가 = (파일들) => 파일들.some((f) => 일한자리.some((r) => r.test(f)));

/** 진행 줄에서 「확인만」류를 가른다 — 「했다: 확인만」·「바뀐 것 없」 */
export const 확인만인가 = (줄) => /했다:\s*확인만|확인만 했|바뀐 것 없/.test(줄);

/** 시각 문자열들 사이의 가장 큰 틈(분). ⚠ 날이 바뀌면 세지 않는다 — 하루 안에서만 본다 */
export function 가장큰틈(시각들) {
  const 분 = 시각들.map((t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; })
    .sort((a, b) => a - b);
  let 최대 = 0;
  for (let i = 1; i < 분.length; i++) 최대 = Math.max(최대, 분[i] - 분[i - 1]);
  return 최대;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };
  검('자료·기사를 건드리면 일로 센다', 일인가(['content/kculturewire/a.md']) === true);
  검('메모만 고친 것은 일로 안 센다', 일인가(['docs/세션간-메모.md']) === false);
  검('자를 만든 것도 일로 센다', 일인가(['scripts/check-x.mjs']) === true);
  검('「확인만」을 알아본다', 확인만인가('[진행] 5번 07:35  했다: 확인만 — 새 지시 없음') === true);
  검('일한 줄을 「확인만」으로 안 센다', 확인만인가('[진행] 5번 08:30  했다: 지면 한 장과 기사 한 편을 냈습니다') === false);
  검('틈을 분으로 센다', 가장큰틈(['01:00', '02:40', '03:00']) === 100);
  검('한 줄뿐이면 틈이 0', 가장큰틈(['01:00']) === 0);
  검('사장님 말씀을 자 안에 지니고 있다', 사장님말씀.includes('쉼 없이') && 사장님말씀.includes('1,000명'));
  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-no-idle-hours 자가시험 통과 (8)');
  process.exit(0);
}

console.log('┌────────────────────────────────────────────────────────────────────────────┐');
console.log(`│ ${사장님말씀} │`);
console.log('│                                                        — 사장님 2026-08-22 │');
console.log('└────────────────────────────────────────────────────────────────────────────┘\n');

const git = (args) => execFileSync('git', args, { cwd: 뿌리, encoding: 'utf8' }).trim();

/* ① 최근 열두 시간의 5번 커밋 */
const 줄들 = git(['log', '--since=12 hours ago', '--format=%h%x09%s']).split('\n').filter(Boolean);
const 내것 = 줄들.filter((l) => /5번/.test(l.split('\t')[1] ?? ''));

/* ② 그중 «일한 자리»를 건드린 커밋 */
let 일한커밋 = 0;
for (const l of 내것) {
  const h = l.split('\t')[0];
  const 파일 = git(['show', '--name-only', '--format=', h]).split('\n').filter(Boolean);
  if (일인가(파일)) 일한커밋++;
}

/* ③④ 오늘의 [진행] 5번 줄 */
const 메모 = fs.readFileSync(path.join(뿌리, 'docs/세션간-메모.md'), 'utf8');
const 진행줄 = [...메모.matchAll(/^#*\s*\[진행\] 5번[^\n]*/gm)].map((m) => m[0]).slice(-14);
const 시각 = 진행줄.map((l) => (l.match(/(\d{2}):(\d{2}|\dx)/) ?? [])[0]?.replace('x', '0')).filter(Boolean);
const 확인만 = 진행줄.filter(확인만인가).length;
const 틈 = 가장큰틈(시각);

console.log(`최근 12시간 5번 커밋      ${내것.length}건 · 그중 자료·지면·기사·자를 건드린 것 ${일한커밋}건`);
console.log(`마지막 진행 줄 ${진행줄.length}개 중 「확인만」  ${확인만}개`);
console.log(`진행 줄 사이 가장 큰 틈    ${틈}분`);
if (내것.length) console.log(`\n최근 것 셋 —\n${내것.slice(0, 3).map((l) => '  · ' + l.split('\t')[1]).join('\n')}`);

const 문제 = [];
if (내것.length === 0) 문제.push('열두 시간에 5번 커밋이 0건이다. 창이 살아 있었다면 무언가 남아야 한다');
else if (일한커밋 === 0) 문제.push('커밋은 있는데 자료·지면·기사·자를 건드린 것이 0건이다. 메모만 쓴 열두 시간이다');
if (진행줄.length >= 4 && 확인만 * 2 > 진행줄.length) 문제.push(`진행 줄 절반이 넘게 「확인만」이다(${확인만}/${진행줄.length})`);
if (틈 > 180) 문제.push(`진행 줄 사이가 ${틈}분 벌어졌다. 그 사이 이 자리가 조용했다`);

if (문제.length) {
  console.error('\n❌ 쉬었다 — 스스로 할 일을 찾지 않은 시간이 있다');
  for (const s of 문제) console.error(`   · ${s}`);
  console.error('\n   ⛔ 막힌 것이 있어도 멈추지 않는다. 배포가 막혔으면 배포가 필요 없는 일을 찾는다 —');
  console.error('      자료 캐기 · 분모 키우기 · 안 쓰던 축 찾기 · 자 세우기.');
  process.exit(1);
}
console.log('\n✅ 쉬지 않았다 — 열두 시간 안에 자료·지면·기사·자가 남았다');
