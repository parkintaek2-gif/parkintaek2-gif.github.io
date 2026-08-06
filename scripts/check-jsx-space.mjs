/**
 * 굵은 글씨·링크 뒤에서 **낱말이 붙어 나가는 것**을 잡는다 — 저장소 전체 (2026-08-06 · 2번)
 *
 * `</strong>` 로 줄이 끝나고 다음 줄에 글이 오면 **JSX 가 그 줄바꿈을 지운다.**
 * 소스는 멀쩡해 보이는데 화면에서만 붙는다. 끝에 `{' '}` 를 넣어야 공백이 남는다.
 *
 * 3번이 백년지도에서 먼저 찾아 `check-100yearmap-copy.mjs` 에 넣었다(1809f32).
 * ⚠ 그 검사는 **다음 줄이 한글일 때만** 본다. 그래서 영문 지면이 통째로 빠져 있었다 —
 *   실제로 `/api` 5곳 · `/wikitip/actors` 1곳이 라이브에서 붙어 나가고 있었다.
 *   `/api` 는 **유료 개발자가 읽는 지면**이다. 그래서 범위를 저장소 전체로 넓혀 다시 잰다.
 *
 * ⛔ 한글 **조사**는 붙는 것이 맞다 — `<strong>실제 사람 수</strong>로만 적습니다`.
 *   영문은 조사가 없으므로 **글자로 시작하면 무조건 잘못**이다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const 조사 =
  /^(으로|로|를|을|이|가|은|는|에|와|과|의|도|만|보다|처럼|부터|까지|라고|이라고|입니다|이며|라서|이라)/;

function 붙은글(내용, 이름) {
  const 걸림 = [];
  const 줄 = 내용.split('\n');
  줄.forEach((l, i) => {
    if (!/<\/(strong|a|em|b)>\s*$/.test(l)) return;
    const 다음 = (줄[i + 1] ?? '').trim();
    if (!/^[A-Za-z가-힣]/.test(다음)) return; // 태그로 시작하면 무관하다
    if (조사.test(다음)) return; // 한글 조사는 붙는 것이 맞다
    걸림.push({
      파일: 이름,
      줄: i + 1,
      글: `${l.trim().slice(-32)} ↵ ${다음.slice(0, 32)}`,
    });
  });
  return 걸림;
}

/* ⚠ 자가시험 — 검사가 헛돌면 「통과」가 거짓말이 된다. 3번이 겪은 것을 그대로 따른다 */
{
  const 시험 = [
    ['<strong>흔듭니다.</strong>\n그래서 저희는', 1, '한글이 붙는다'],
    ['<strong>실제 사람 수</strong>\n로만 적습니다', 0, '한글 조사는 정상'],
    ['<strong>before you build.</strong>\nCounted per firm', 1, '영문이 붙는다'],
    ["<strong>before you build.</strong>{' '}\nCounted per firm", 0, "{' '} 로 고친 것"],
    ['<strong>x</strong>\n<p>다음</p>', 0, '태그로 이어지면 무관'],
  ];
  for (const [글, 기대, 이름] of 시험) {
    if (붙은글(글, '(자가시험)').length !== 기대) {
      console.log(`  ⛔ 자가시험 실패 — ${이름}`);
      process.exit(1);
    }
  }
}

const 파일들 = [];
(function 훑기(디렉터리) {
  for (const e of fs.readdirSync(디렉터리, { withFileTypes: true })) {
    const p = path.join(디렉터리, e.name);
    if (e.isDirectory()) 훑기(p);
    else if (/\.astro$/.test(e.name)) 파일들.push(p);
  }
})(path.join(ROOT, 'src'));

const 전체 = 파일들.flatMap((f) =>
  붙은글(fs.readFileSync(f, 'utf8'), path.relative(ROOT, f)),
);

console.log(`굵은 글씨 뒤 붙음 검사 — .astro ${파일들.length}개 (자가시험 5건 통과)`);
if (전체.length === 0) {
  console.log('✅ 붙어 나가는 곳 0건');
  process.exit(0);
}
for (const c of 전체) console.log(`  ⛔ ${c.파일}:${c.줄}\n     ${c.글}\n     → 줄 끝에 {' '} 를 넣는다`);
console.log(`\n⛔ ${전체.length}건. 화면에서만 붙는다 — 소스만 보면 안 보인다.`);
process.exit(1);
