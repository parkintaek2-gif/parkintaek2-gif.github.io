/**
 * 개봉 차례표(docs/개봉날-3번.md)가 **코드와 어긋나지 않았나** 잰다.
 *
 * ⭐ 왜 있나 — 내가 같은 흠을 두 번 냈다.
 *   8/10  문 갈래를 18 → 22 로 늘려 놓고 차례표를 안 고쳤다
 *   8/12  스위치 이름을 `살수있나` → `PG붙었나` 로 바꿔 놓고 차례표를 안 고쳤다
 *         ⚠ 이건 더 나빴다. 차례표 ③ 은 「창이 죽어도 이 줄만 있으면 된다」고 쓴 자리다.
 *           개봉날 다른 사람이 그 문서만 보고 없는 이름을 찾다가, 엉뚱한 데를 고치고
 *           **화면은 그대로**가 된다.
 *
 * ⛔ 이 자는 «문서가 예쁜가»를 보지 않는다. **문서가 시키는 대로 하면 정말 되는가**만 본다.
 *
 *   node scripts/check-100y-runbook.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ⚠ new URL(...).pathname 을 쓰면 «한글 폴더»가 %ED%9D%89… 로 감싸져 파일을 못 연다.
//   fileURLToPath 로 풀어야 한다. (흉내 시험을 한글 폴더에서 돌리다 잡았다)
const 뿌리 = fileURLToPath(new URL('..', import.meta.url));
const 읽기 = (길) => readFileSync(뿌리 + 길, 'utf8');

// ── 자 스스로 시험 ─────────────────────────────────────────────
const 시험들 = [];
const 시험 = (이름, 한것, 나와야) => 시험들.push([이름, JSON.stringify(한것), JSON.stringify(나와야)]);

/** 글 안에서 «홀로 남은» 옛 이름 줄을 찾는다 — 설명하려고 적은 줄은 뺀다 */
export function 옛이름줄찾기(글, 옛이름, 봐줄말) {
  return 글.split('\n')
    .map((줄, i) => ({ 줄번호: i + 1, 줄 }))
    .filter(({ 줄 }) => 줄.includes(옛이름))
    .filter(({ 줄 }) => !봐줄말.some((말) => 줄.includes(말)));
}

/** `export const 이름 = 값` 을 찾아 값을 돌려준다. 없으면 null */
export function 내보낸값(코드, 이름) {
  const m = new RegExp('export\\s+const\\s+' + 이름 + '\\s*=\\s*([^;\\n]+)').exec(코드);
  return m ? m[1].trim() : null;
}

시험('옛이름 — 설명 줄은 봐준다',
  옛이름줄찾기('가\n살수있나 를 켠다\n예전엔 살수있나 였다\n', '살수있나', ['예전']).map((x) => x.줄번호),
  [2]);
시험('옛이름 — 없으면 빈 것', 옛이름줄찾기('가\n나\n', '살수있나', []).length, 0);
시험('내보낸값 — 찾는다', 내보낸값('export const PG붙었나 = false;', 'PG붙었나'), 'false');
시험('내보낸값 — 없으면 null', 내보낸값('const 가 = 1;', '가'), null);
시험('내보낸값 — 이름이 비슷해도 안 속는다', 내보낸값('export const PG붙었나쪽 = true;', 'PG붙었나'), null);

let 자흠 = 0;
for (const [이름, 한것, 나와야] of 시험들) {
  if (한것 !== 나와야) { console.log('🔴 자가 틀렸다 — ' + 이름 + '  난것 ' + 한것 + ' / 나와야 ' + 나와야); 자흠++; }
}
if (자흠) { console.log('\n자를 못 믿겠다. 여기서 멈춘다.'); process.exit(1); }
console.log('✅ 자 스스로 시험 ' + 시험들.length + '가지 통과\n');

// ── 진짜로 재기 ────────────────────────────────────────────────
const 차례표 = 읽기('docs/개봉날-3번.md');
const 값코드 = 읽기('src/lib/price.ts');
const 문코드 = 읽기('src/lib/klifemap.ts');

const 흠 = [];
const 잰것 = [];

// ① 차례표가 시키는 스위치 이름이 코드에 정말 있나
{
  const 값 = 내보낸값(값코드, 'PG붙었나');
  잰것.push('① 스위치 「PG붙었나」 — ' + (값 === null ? '🔴 코드에 없다' : '✅ 있다 (지금 ' + 값 + ')'));
  if (값 === null) 흠.push('차례표는 PG붙었나 를 시키는데 src/lib/price.ts 에 그 이름이 없다');
  if (!차례표.includes('PG붙었나')) 흠.push('차례표에 PG붙었나 가 한 번도 안 나온다');
}

// ② 옛 이름이 «홀로» 남은 줄이 없나
{
  // ⚠ «옛 이름을 설명하는 줄»은 봐준다. 안 봐주면 이 흠을 적어 둔 줄 자체가 걸린다
  //   (실제로 걸렸다 — 자가 제대로 도는 증거이기도 하다)
  const 봐줄말 = ['예전', '바뀌었다', '다음칸.살수있나', '손으로 켜지 않는다', '→ PG붙었나', '안 고쳤다'];
  const 남은 = 옛이름줄찾기(차례표, '살수있나', 봐줄말);
  잰것.push('② 옛 이름(살수있나)이 홀로 남은 줄 — ' + (남은.length ? '🔴 ' + 남은.length + '개' : '✅ 없다'));
  for (const x of 남은) 흠.push('차례표 ' + x.줄번호 + '줄에 옛 이름이 홀로 남았다 — ' + x.줄.trim().slice(0, 70));
}

// ③ 차례표가 적은 문 갈래 수가 코드와 같나
{
  const 갈래수 = (문코드.match(/붙일수있는갈래[\s\S]*?\[([\s\S]*?)\]/)?.[1].match(/'/g)?.length ?? 0) / 2;
  const 적힌것 = [...차례표.matchAll(/(스물두|열여덟|스물둘|\d+)\s*갈래/g)].map((m) => m[1]);
  const 말숫자 = { 열여덟: 18, 스물두: 22, 스물둘: 22 };
  const 어긋난것 = 적힌것.map((x) => 말숫자[x] ?? Number(x)).filter((n) => n !== 갈래수 && n !== 18);
  잰것.push('③ 문 갈래 — 코드 ' + 갈래수 + ' · 차례표에 적힌 것 ' + (적힌것.join(',') || '(없음)') +
    (어긋난것.length ? '  🔴' : '  ✅'));
  for (const n of 어긋난것) 흠.push('차례표가 문 갈래를 ' + n + ' 로 적었는데 코드는 ' + 갈래수 + ' 다');
}

// ④ 지금 스위치가 꺼져 있나 — 켜진 채로 8/15 를 맞으면 안 된다
{
  const 값 = 내보낸값(값코드, 'PG붙었나');
  잰것.push('④ 지금 꺼져 있나 — ' + (값 === 'false' ? '✅ false' : '🔴 ' + 값));
  if (값 !== 'false') 흠.push('PG붙었나 가 켜져 있다. PG 와 1번 요금표가 먼저다 — 켜면 손님이 「잘못된 주문」을 본다');
}

// ⑤ 살림 나이띠가 «겹치는 쌍»이 늘지 않았나
//    8/13 에 셋을 쟀다. 늘면 지면에서 두 번 세어질 위험이 커진 것이다 — 알고 지나가야 한다
{
  const 구간 = (이름) => {
    let m;
    if ((m = /^(\d+)세 이하$/.exec(이름))) return [0, Number(m[1])];
    if ((m = /^(\d+)세 이상$/.exec(이름))) return [Number(m[1]), 200];
    if ((m = /^(\d+)~(\d+)세$/.exec(이름))) return [Number(m[1]), Number(m[2])];
    return null;
  };
  const 자료 = JSON.parse(읽기('src/data/100yearmap/age-axis.json'));
  const 띠 = Object.keys(자료.살림 ?? {}).map((이름) => ({ 이름, 구간: 구간(이름) })).filter((x) => x.구간);
  let 겹침 = 0;
  for (let i = 0; i < 띠.length; i++)
    for (let k = i + 1; k < 띠.length; k++)
      if (Math.max(띠[i].구간[0], 띠[k].구간[0]) <= Math.min(띠[i].구간[1], 띠[k].구간[1])) 겹침++;
  잰것.push('⑤ 살림 나이띠 겹친 쌍 — ' + 겹침 + '개' + (겹침 === 3 ? '  ✅ 8/13 에 잰 그대로' : '  🔴 바뀌었다'));
  if (겹침 !== 3) 흠.push('살림 나이띠 겹친 쌍이 3 에서 ' + 겹침 + ' 로 바뀌었다 — 더하는 곳이 없는지 본다');
}

console.log('# 개봉 차례표 ↔ 코드');
for (const 줄 of 잰것) console.log('  ' + 줄);

if (흠.length) {
  console.log('\n🔴 어긋난 것 ' + 흠.length + '가지');
  for (const x of 흠) console.log('   · ' + x);
  console.log('\n⛔ 차례표를 고치고 다시 돌린다. **개봉날 그 문서 하나로 되돌려야 한다**');
  process.exit(1);
}
console.log('\n✅ 차례표가 코드와 맞는다');
