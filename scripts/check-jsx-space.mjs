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
/* ⚠ 조사 뒤에 **글자가 더 붙으면 조사가 아니다.**
     「가」만 보고 넘기면 「**가**장 많은 나이가」가 통과한다 — 2026-08-07 에 실제로 새어 나갔다.
     조사는 한 낱말로 끝나거나 뒤에 조사·문장부호가 온다. 한글이 이어지면 낱말이다. */
/* 조사는 겹쳐 붙는다 — 「로만」·「에는」·「까지도」. 하나만 보고 끝내면 멀쩡한 글을 잡는다.
   그래서 조사를 **여러 개 이어 붙인 뒤** 한글이 더 오는지 본다. */
const 조사 =
  /^(?:으로|로|를|을|이|가|은|는|에|와|과|의|도|만|보다|처럼|부터|까지|라고|이라고|입니다|이며|라서|이라)+(?![가-힣])/;

/**
 * 🔴 2026-08-14 — 이 자가 **두 구멍**으로 흠 둘을 놓쳤다. 사장님이 폰으로 찾으실 자리였다.
 *   ① 「the numbers:」 처럼 **콜론·쉼표로 끝난 줄** — 끝 글자 목록에 없었다
 *   ② 다음 줄이 `{/* 주석 *​/}` 이면 그 다음 줄을 봐야 하는데 주석에서 멈췄다
 *      ⭐ 실제로 푸터에 **「줄 끝 빈칸이 사라진다」는 경고 주석을 적어 놓고**
 *         정작 `{' '}` 를 안 넣어 「them.Sources」로 붙어 나갔다. **주석은 빈칸이 아니다.**
 */
function 다음글줄(줄, i) {
  for (let j = i + 1; j < 줄.length && j <= i + 4; j += 1) {
    const t = (줄[j] ?? '').trim();
    if (!t) continue;
    /* 한 줄짜리 주석은 건너뛴다. 여러 줄 주석은 닫힐 때까지 */
    if (/^\{\/\*/.test(t) && /\*\/\}$/.test(t)) continue;
    if (/^\{\/\*/.test(t)) {
      let k = j;
      while (k < 줄.length && !/\*\/\}/.test(줄[k])) k += 1;
      j = k;
      continue;
    }
    return t;
  }
  return '';
}

function 붙은글(내용, 이름) {
  const 걸림 = [];
  const 줄 = 내용.split('\n');
  줄.forEach((l, i) => {
    const 다음 = 다음글줄(줄, i);

    // ① 닫는 태그 뒤가 붙는 경우 — </strong> 다음 줄이 글자로 시작한다
    if (/<\/(strong|a|em|b)>\s*$/.test(l) && /^[A-Za-z가-힣]/.test(다음) && !조사.test(다음)) {
      걸림.push({ 파일: 이름, 줄: i + 1, 글: `${l.trim().slice(-32)} ↵ ${다음.slice(0, 32)}`, 고침: "끝에 {' '} 를 넣는다" });
    }

    // ② 여는 태그 앞이 붙는 경우 — 글자로 끝난 줄 다음 줄이 <strong> 으로 시작한다
    //    「끝나지 않습니다.<strong>대학 다음의 자리</strong>」가 이렇게 새어 나갔다.
    // 줄 끝이 줄표(—)·가운뎃점(·)이어도 붙는다. 「보십시오 —어느 나이에도」가 그렇게 나갔다
    // 🔴 2026-08-14 — 콜론·쉼표·괄호닫기를 더했다. 「the numbers:」 다음 줄의 <a> 가 붙어 나갔다
    if (/[A-Za-z가-힣.!?」—·:,;)]\s*$/.test(l) && /^<(strong|a|em|b)[ >]/.test(다음) && !/[{>]\s*$/.test(l)) {
      걸림.push({ 파일: 이름, 줄: i + 1, 글: `${l.trim().slice(-32)} ↵ ${다음.slice(0, 32)}`, 고침: "앞 줄 끝에 {' '} 를 넣는다" });
    }
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
    /* 아래 셋은 2026-08-07 에 검사를 새어 나간 것들이다. 겪은 것을 시험으로 굳힌다 */
    ['<strong>당신이 아닙니다.</strong>\n가장 많은 나이가', 1, '「가장」이 조사 「가」로 읽혔었다'],
    ['<strong>실제 사람 수</strong>\n가 아니다', 0, '진짜 조사 「가」는 그대로 통과'],
    ['백년지도는 열아홉에서 끝나지 않습니다.\n<strong>대학 다음의 자리</strong>', 1, '여는 태그 앞이 붙는다'],
    ["끝나지 않습니다.{' '}\n<strong>대학 다음의 자리</strong>", 0, "{' '} 로 고친 것"],
    ['위 분포의 폭을 먼저 보십시오 —\n<strong>어느 나이에도 사람이 있습니다.</strong>', 1, '줄표 뒤도 붙는다'],
    /* 🔴 2026-08-14 에 새어 나간 둘. 사장님이 폰으로 보시면 바로 보이는 자리였다 */
    ['read by the people who make the numbers:\n<a href="x"><b>mail</b></a>', 1, '콜론 뒤도 붙는다'],
    ["the numbers:{' '}\n<a href=\"x\"><b>mail</b></a>", 0, "{' '} 로 고친 것"],
    ['우리는 셋을 봅니다,\n<b>그 가운데 하나</b>', 1, '쉼표 뒤도 붙는다'],
    ['with the numbers behind them.\n{/* 주석 한 줄 */}\n<b>Sources</b> are named',
      1, '⭐ 주석을 건너뛰고 그 다음 줄을 본다 — 주석은 빈칸이 아니다'],
    ["behind them.{' '}\n{/* 주석 한 줄 */}\n<b>Sources</b> are named",
      0, '주석이 있어도 {\' \'} 가 있으면 통과'],
    ['<strong>끝.</strong>\n{/* 여러 줄\n   주석이다 */}\n다음 글자',
      1, '여러 줄 주석도 건너뛴다'],
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
