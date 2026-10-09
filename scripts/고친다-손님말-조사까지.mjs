/**
 * 고친다-손님말-조사까지.mjs — 손님 화면의 억지 순한글을 **조사까지 함께** 바꾼다. (5번 2026-10-09)
 * ═══════════════════════════════════════════════════════════════════════════
 * 왜 — 사장님 (2026-10-08): 「지면이라는 말도 안쓰기로 했잖아… 억지로 순한글쓰지말라고 했잖아」
 *
 * ⚠ 손으로 바꾸면 **거의 틀린다.** 「지면」은 받침이 있고 「페이지」는 없어서
 *   뒤따르는 조사가 같이 바뀌기 때문이다.
 *     지면을 → 페이지«를»   지면이 → 페이지«가»   지면은 → 페이지«는»
 *     지면으로 → 페이지«로»  지면과 → 페이지«와»
 *   「지면을」을 「페이지을」로 두면 사장님이 바로 보신다.
 *
 * ⛔ 안 바꾸는 곳 — 주석 · <script> · <style> · <code>
 *   특히 <code> 안은 **실제로 도는 명령 이름**이다. 말씨에 맞춰 바꾸면 손님이 쳐 봤을 때
 *   안 돈다. **말씨보다 「맞나」가 먼저다.**
 *
 * 쓰는 법
 *   node scripts/고친다-손님말-조사까지.mjs --자가시험        먼저 이것부터
 *   node scripts/고친다-손님말-조사까지.mjs src/pages/100y    무엇을 바꿀지 «보기만» 한다
 *   node scripts/고친다-손님말-조사까지.mjs src/pages/100y --고친다   실제로 바꾼다
 *
 * 끝났다고 보는 기준
 *   node scripts/check-순한글조어.mjs src/pages/100y  →  「조어가 든 파일 0개」
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** 바꿀 말 — 왼쪽은 안 쓴다 */
export const 바꿀말 = [
  { 날: '지면', 새: '페이지' },
  { 날: '낱장', 새: '페이지' },
  { 날: '덩이', 새: '항목' },
  { 날: '쟀다', 새: '측정했다' },
  { 날: '쟀습니다', 새: '측정했습니다' },
  { 날: '쟀고', 새: '측정했고' },
  { 날: '쟀는데', 새: '측정했는데' },
];

/** 받침이 있나 — 조사를 가르는 기준이다 */
export function 받침있나(글자) {
  const c = 글자.charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}
/* 긴 것부터 봐야 「으로」가 「으」에서 안 잘린다 */
export const 조사짝 = [['으로', '로'], ['을', '를'], ['이', '가'], ['은', '는'], ['과', '와']];

/**
 * 말이 바뀌면 조사도 바뀐다. **양쪽 다 본다** —
 *   받침 있음 → 없음 (지면→페이지):  을→를 · 이→가 · 은→는 · 으로→로 · 과→와
 *   받침 없음 → 있음 (덩이→항목):    를→을 · 가→이 · 는→은 · 로→으로 · 와→과
 * ⚠ 자가시험이 「그 덩이를」을 「그 항목를」로 내는 것을 잡아 주어 알았다.
 *   한쪽만 넣으면 조용히 틀린 글이 나간다.
 */
export function 조사맞추기(옛말, 새말, 뒤) {
  const 옛받침 = 받침있나(옛말[옛말.length - 1]);
  const 새받침 = 받침있나(새말[새말.length - 1]);
  if (옛받침 === 새받침) return { 조사: '', 먹은길이: 0 };   // 안 바뀌면 손댈 것이 없다
  const 짝 = 옛받침 ? 조사짝 : 조사짝.map(([a, b]) => [b, a]);
  for (const [앞조사, 뒷조사] of 짝) {
    if (뒤.startsWith(앞조사)) return { 조사: 뒷조사, 먹은길이: 앞조사.length };
  }
  return { 조사: '', 먹은길이: 0 };
}

const 덮 = (m) => ' '.repeat(m.length);
/** 손님 눈에 안 보이는 데를 공백으로 덮는다 — 자리값이 밀리지 않게 길이를 지킨다 */
export function 안보이는곳덮기(글) {
  return String(글 ?? '')
    .replace(/<!--[\s\S]*?-->/g, 덮)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, 덮)
    .replace(/<script\b[\s\S]*?<\/script>/gi, 덮)
    .replace(/<style\b[\s\S]*?<\/style>/gi, 덮)
    .replace(/<code\b[\s\S]*?<\/code>/gi, 덮)
    .replace(/^---\n[\s\S]*?\n---/, 덮);
}
/** 앞 글자가 한글이면 낱말이 아니라 활용이다 — 「정해지면」을 「지면」으로 안 센다 */
export const 낱말로있나 = (글, i) => !/[가-힣]/.test(글[i - 1] || '');

export function 바꾼글(날) {
  const 가린 = 안보이는곳덮기(날);
  const 자리들 = [];
  for (const { 날: 옛, 새 } of 바꿀말) {
    let i = -1;
    while ((i = 가린.indexOf(옛, i + 1)) !== -1) {
      if (!낱말로있나(가린, i)) continue;
      자리들.push({ i, 옛, 새 });
    }
  }
  자리들.sort((a, b) => b.i - a.i);            // 뒤에서부터 바꾼다 — 앞부터 하면 자리가 밀린다
  let 글 = 날;
  for (const { i, 옛, 새 } of 자리들) {
    const 뒤 = 글.slice(i + 옛.length, i + 옛.length + 4);
    const { 조사, 먹은길이 } = 조사맞추기(옛, 새, 뒤);
    글 = 글.slice(0, i) + 새 + 조사 + 글.slice(i + 옛.length + 먹은길이);
  }
  return { 글, 수: 자리들.length };
}

function 자가시험() {
  const 시험 = [
    ['이 지면을 낸다', '이 페이지를 낸다'],
    ['이 지면이 쓴다', '이 페이지가 쓴다'],
    ['이 지면은 다르다', '이 페이지는 다르다'],
    ['우리 지면으로 간다', '우리 페이지로 간다'],
    ['궁합 지면과 같다', '궁합 페이지와 같다'],
    ['12신살 지면에 있습니다', '12신살 페이지에 있습니다'],
    ['이 지면마다 적는다', '이 페이지마다 적는다'],
    ['별자리 분포 지면', '별자리 분포 페이지'],
    ['정해지면 적는다', '정해지면 적는다'],          // 활용은 안 건드린다
    ['깨지면 안 된다', '깨지면 안 된다'],
    ['<!-- 지면 -->', '<!-- 지면 -->'],              // 주석은 안 건드린다
    ['<code>--지면</code>', '<code>--지면</code>'],  // 실제 명령 이름은 지킨다
    ['이 낱장을 본다', '이 페이지를 본다'],
    ['그 덩이를 센다', '그 항목을 센다'],
    ['세 번 쟀다', '세 번 측정했다'],
  ];
  let 틀림 = 0;
  for (const [날, 바람] of 시험) {
    const { 글 } = 바꾼글(날);
    if (글 !== 바람) { console.log(`   ✗ 「${날}」 바람 「${바람}」 났음 「${글}」`); 틀림++; }
  }
  if (틀림) { console.log(`\n🔴 자가시험 ${틀림}개 틀림 — 아무것도 안 고친다`); process.exit(1); }
  console.log(`✅ 자가시험 ${시험.length}개 지남`);
  return 0;
}

/* ⛔ [2026-10-09 · 5번] **가져오면 도는 자** — export 가 있는 모듈이 관문 없이
   맨 바닥에서 돌면, 남이 import 하는 순간 남의 화면에 이 자의 출력이 통째로 끼어든다.
   오늘 klifemap 쪽에서 그 흠을 네 번 냈고, 여기서 다섯 번째를 배포 관문이 잡았다. */
const 직접불렸나 = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (직접불렸나) {
자가시험();
if (process.argv.includes('--자가시험')) process.exit(0);

const 폴더들 = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!폴더들.length) {
  console.log('쓰는 법: node scripts/고친다-손님말-조사까지.mjs <폴더> [--고친다]');
  process.exit(1);
}
const 정말 = process.argv.includes('--고친다');
const 볼확장자 = new Set(['.html', '.htm', '.astro', '.md', '.mdx']);
const 파일들 = [];
const 쌓기 = (d) => {
  let 목록; try { 목록 = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of 목록) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/node_modules|\.git|dist|build|\.astro/.test(e.name)) 쌓기(p); }
    else if (볼확장자.has(path.extname(e.name).toLowerCase())) 파일들.push(p);
  }
};
for (const d of 폴더들) 쌓기(d);

let 곳 = 0, 파일 = 0;
for (const p of 파일들) {
  const 날 = fs.readFileSync(p, 'utf8');
  const { 글, 수 } = 바꾼글(날);
  if (!수) continue;
  곳 += 수; 파일++;
  if (정말) fs.writeFileSync(p, 글, 'utf8');
  else if (파일 <= 5) console.log(`   ${p} — ${수}곳`);
}
console.log(`\n■ 파일 ${파일들.length}개를 봤다 · 바꿀 것 ${파일}개 파일 ${곳}곳`);
console.log(정말 ? '✅ 고쳤습니다. 이어서 `node scripts/check-순한글조어.mjs <폴더>` 로 0 인지 보십시오.'
                 : '⚠ 아직 안 고쳤습니다 — 실제로 고치려면 `--고친다` 를 붙이십시오.');
}
