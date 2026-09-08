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
  /^(?:이다|으로|로|를|을|이|가|은|는|에|와|과|의|도|만|보다|처럼|부터|까지|라고|이라고|입니다|이며|라서|이라)+(?![가-힣])/;

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

/**
 * 🔴 [2026-09-08] 규칙 ③ 을 넣자마자 **397건이 잡혔고 거의 다 CSS 였다.**
 *   CSS 규칙은 `}` 로 끝나고 다음 줄이 선택자(글자)로 시작한다 — 붙는 것이 옳다.
 *   frontmatter(`---` 사이)의 자바스크립트도 같다. 화면에 나가는 글이 아니다.
 * ⛔ 그러니 규칙 ③ 은 **본문에만** 건다. 이 자가 그 자리를 가려 준다.
 * ⭐ 처음 낸 판을 그대로 커밋했으면 「397건」이 떠서 아무도 이 검사를 안 봤을 것이다.
 *   ⚠ 잡는 수가 많은 것이 좋은 검사가 아니다. **참말만 잡는 것**이 좋은 검사다.
 */
export function 본문인가(줄) {
  const 답 = new Array(줄.length).fill(true);
  let i = 0;
  /* frontmatter — 첫 줄이 --- 이면 짝이 되는 --- 까지 */
  if ((줄[0] ?? '').trim() === '---') {
    답[0] = false;
    for (i = 1; i < 줄.length; i += 1) {
      답[i] = false;
      if ((줄[i] ?? '').trim() === '---') { i += 1; break; }
    }
  }
  let 안에 = null;
  for (; i < 줄.length; i += 1) {
    const t = 줄[i] ?? '';
    if (안에) {
      답[i] = false;
      if (new RegExp(`</${안에}`).test(t)) 안에 = null;
      continue;
    }
    const m = /<(style|script)[\s>]/.exec(t);
    if (m) {
      답[i] = false;
      /* 한 줄에 열고 닫으면 그 줄만 뺀다 */
      if (!new RegExp(`</${m[1]}`).test(t)) 안에 = m[1];
    }
  }
  return 답;
}

function 붙은글(내용, 이름) {
  const 걸림 = [];
  const 줄 = 내용.split('\n');
  const 본문 = 본문인가(줄);
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

    /**
     * 🔴 [2026-09-08 · 5번] ③ **JSX 표현식으로 끝난 줄**도 같은 병에 걸린다.
     *   이 검사는 그때까지 `</strong>` 류로 끝난 줄만 봤다. 그래서 이렇게 쓴 곳을 못 봤다 —
     *
     *     … chart {단복(p.places, 'place', 'places')}
     *     in <b>{p.countries}</b> …
     *
     *   화면에는 「695 chart place**sin** 87 countries」로 붙어 나갔다.
     *   ⚠ `/person/` 지면 **634장**이 그 꼴로 라이브에 있었다. 손님이 첫 문장에서 만나는 자리다.
     *   ⭐ 사람 이름을 찾아온 손님이 첫 줄에서 깨진 낱말을 본다 — 「그릇이 내용물을 결정한다」에 걸린다.
     *
     * ⛔ 태그 속성은 잡지 않는다 — `class={cls}` 다음 줄의 `data-x="y"` 는 붙는 것이 옳다.
     *   그래서 ⓐ 여는 `{` 앞이 `=` 이면 넘기고, ⓑ 다음 줄이 `낱말=` 이나 `>` 로 시작하면 넘긴다.
     * ⛔ `{' '}` 자신도 `}` 로 끝난다. 빈칸 리터럴이면 넘긴다 — 그것이 «고친 모습»이다.
     */
    /* ⚠ 주석으로 닫힌 줄은 «앞 줄»이 판정 자리다 — 주석은 아무것도 안 낸다.
       규칙 ①·③ 이 앞 줄에서 `다음글줄()` 로 주석을 건너뛰며 이미 본다.
       ⛔ 주석 줄을 여기서 또 잡으면 «같은 흠을 두 번» 세고, 고칠 자리를 잘못 가리킨다.
       ⚠ 이 주석에 그 닫는 두 글자를 «쓰지 않는다» — 오늘 그것 때문에 블록이 먼저 닫혔다. */
    const 주석끝 = /\*\/\}$/.test(l.trim());
    if (본문[i] && !주석끝 && /\}$/.test(l.trim()) && /^[A-Za-z가-힣]/.test(다음) && !조사.test(다음)) {
      const 앞머리 = 표현식여는자리(l.trimEnd());
      const 속뜻 = 앞머리 == null ? null : l.trimEnd().slice(앞머리 + 1, -1);
      const 빈칸리터럴 = 속뜻 != null && /^\s*(['"`])\s*\1\s*$/.test(속뜻);
      const 속성이음 = /^[A-Za-z-]+\s*=/.test(다음) || /^\/?>/.test(다음);
      if (앞머리 != null && !빈칸리터럴 && !속성이음) {
        걸림.push({ 파일: 이름, 줄: i + 1, 글: `${l.trim().slice(-32)} ↵ ${다음.slice(0, 32)}`, 고침: "끝에 {' '} 를 넣는다" });
      }
    }
  });
  return 걸림;
}

/**
 * 줄 끝 `}` 와 짝인 `{` 의 자리를 준다. 짝이 그 줄에 없거나, 앞이 `=` 면 `null`.
 * ⚠ 앞이 `=` 인 것은 **태그 속성**이다(`class={cls}`). 본문 표현식이 아니다.
 * ⚠ 짝이 다른 줄에 있으면 여러 줄에 걸친 블록이다 — 여기서 판정하지 않는다.
 */
export function 표현식여는자리(줄) {
  if (!줄.endsWith('}')) return null;
  let 깊이 = 0;
  for (let i = 줄.length - 1; i >= 0; i -= 1) {
    const c = 줄[i];
    if (c === '}') 깊이 += 1;
    else if (c === '{') {
      깊이 -= 1;
      if (깊이 === 0) {
        const 앞 = 줄.slice(0, i).replace(/\s+$/, '');
        if (앞.endsWith('=')) return null;
        return i;
      }
    }
  }
  return null;
}

/* ⚠ 자가시험 — 검사가 헛돌면 「통과」가 거짓말이 된다. 3번이 겪은 것을 그대로 따른다 */
let 시험건수 = 0;
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
    /* 🔴 2026-09-08 에 새어 나간 것 — /person/ 지면 634장이 「place**sin**」으로 나갔다 */
    ["chart {단복(p.places, 'place', 'places')}\nin 87 countries", 1, '표현식 뒤에 영문이 붙는다'],
    ["chart {단복(p.places, 'place', 'places')}{' '}\nin 87 countries", 0, "{' '} 로 고친 것"],
    ['took {수(p.places)}\n건을 넘겼다', 1, '표현식 뒤에 한글이 붙는다'],
    ['그것은 {수(p.n)}\n이다', 0, '한글 조사는 정상 — 「이다」는 붙는 것이 맞다'],
    ['<td class={칸}\ndata-x="y">', 0, '⛔ 태그 속성은 잡지 않는다 — 여는 { 앞이 = 다'],
    ['<span class={칸}\n>글</span>', 0, '⛔ 다음 줄이 > 로 시작하면 태그가 이어지는 것이다'],
    ['{목록.map((x) => (\n  <li>{x}</li>\n))}\n다음 글자', 0, '짝이 다른 줄에 있는 블록은 판정하지 않는다'],
    ['{수(a)} 과 {수(b)}\nare both counted', 1, '한 줄에 표현식이 둘이어도 끝의 짝을 찾는다'],
    /* 🔴 규칙 ③ 을 넣자마자 397건이 잡혔고 «거의 다 CSS» 였다. 참말만 잡게 가린다.
       ⚠ 잡는 수가 많은 것이 좋은 검사가 아니다 — 397건이 뜨면 아무도 이 검사를 안 본다 */
    ['---\nconst a = {x: 1}\nconst b = 2;\n---\n<p>글</p>', 0, '⛔ frontmatter 는 화면에 안 나간다'],
    ['<style>\n  .a { color: red; }\n  .b { color: blue; }\n</style>', 0, '⛔ CSS 규칙은 붙는 것이 옳다'],
    ['<script>\n  if (x) { y(); }\n  z();\n</script>', 0, '⛔ script 안도 화면 글이 아니다'],
    ['<style>.a { color: red; }</style>\n<p>{수(n)}\nin countries</p>', 1, '⭐ 한 줄 style 뒤의 본문은 그대로 본다'],
  ];
  for (const [글, 기대, 이름] of 시험) {
    if (붙은글(글, '(자가시험)').length !== 기대) {
      console.log(`  ⛔ 자가시험 실패 — ${이름}`);
      process.exit(1);
    }
  }
  시험건수 = 시험.length;
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

console.log(`굵은 글씨 뒤 붙음 검사 — .astro ${파일들.length}개 (자가시험 ${시험건수}건 통과)`);
if (전체.length === 0) {
  console.log('✅ 붙어 나가는 곳 0건');
  process.exit(0);
}
for (const c of 전체) console.log(`  ⛔ ${c.파일}:${c.줄}\n     ${c.글}\n     → 줄 끝에 {' '} 를 넣는다`);
console.log(`\n⛔ ${전체.length}건. 화면에서만 붙는다 — 소스만 보면 안 보인다.`);
process.exit(1);
