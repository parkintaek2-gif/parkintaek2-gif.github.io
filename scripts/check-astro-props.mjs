/**
 * check-astro-props.mjs — **컴포넌트에 없는 이름으로 값을 넘기면 «조용히» 아무것도 안 그린다.**
 *
 * ── 왜 이 자가 생겼나 (2026-09-04 21:5x) ─────────────────────
 * 오늘 내가 만든 지면 «넷 다» 관련기사 상자에 `slug=` 를 넘겼다. 컴포넌트가 받는 이름은
 * `page=` 다. 그래서 넉 장 모두 관련기사가 **한 줄도 안 그려졌다** —
 * 빌드는 통과했고, 오류도 없었고, 지면은 멀쩡해 보였다.
 * ```
 * <KcwRelatedArticles slug="label-reach" />   ← page 가 undefined
 * → .filter(e => e.data.pages.includes(undefined))  → 0건
 * → 컴포넌트가 「걸린 기사 없으면 아무것도 안 그린다」로 조용히 끝
 * ```
 * ⛔ **빈 상자를 안 그리는 것은 좋은 설계인데, 그 착함이 오타를 감춰 준다.**
 *   「만들고 문을 안 내면 없는 것과 같다」고 컴포넌트 머리에 적혀 있는데,
 *   그 문을 내가 넉 장에서 못 냈다.
 *
 * ── 무엇을 재나 ──────────────────────────────────────────────
 * `src/components/*.astro` 의 `interface Props { … }` 를 읽어
 *   1. 지면이 **없는 이름**을 넘기는가        (오타 — 이번 결함)
 *   2. **반드시 있어야 할 이름**을 빼먹었나  (`?` 없는 칸)
 * ⚠ 값이 옳은지는 안 본다 — 이름만 본다. 이름만으로 오늘 결함 넉 장이 다 잡힌다.
 *
 * ⛔ 정규식으로 여는 꼬리표를 자르지 않는다. 속성 안에 중괄호와 부등호가 들어간다
 *   (`page={...}` 안의 화살표 함수·템플릿 문자열). 그래서 **작은 훑는 자**를 짜서
 *   괄호·따옴표를 센다.
 *
 * 쓰는 법  node scripts/check-astro-props.mjs --자가시험
 *          node scripts/check-astro-props.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');

/** `interface Props { … }` 에서 칸 이름과 필수인지를 뽑는다. 주석은 걷어낸다. */
export function 받는이름들(글) {
  const s = String(글 ?? '');
  const m = s.match(/interface\s+Props\s*\{/);
  if (!m) return null;                       // Props 를 선언 안 한 컴포넌트는 안 본다
  let i = m.index + m[0].length, 깊이 = 1, 몸 = '';
  while (i < s.length && 깊이 > 0) {
    const c = s[i];
    if (c === '{') 깊이 += 1;
    else if (c === '}') { 깊이 -= 1; if (!깊이) break; }
    몸 += c; i += 1;
  }
  const 깐몸 = 몸.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  const 칸 = [];
  for (const 줄 of 깐몸.split(/[;\n]/)) {
    const t = 줄.trim();
    if (!t) continue;
    const g = t.match(/^([A-Za-z_$][\w$]*)\s*(\?)?\s*:/);
    if (g) 칸.push({ 이름: g[1], 필수: !g[2] });
  }
  return 칸;
}

/**
 * `<Name` 부터 여는 꼬리표가 끝나는 데까지 잘라 온다.
 * 따옴표와 중괄호를 세면서 간다 — 속성 안의 부등호에 안 속는다.
 */
export function 꼬리표자르기(글, 시작) {
  const s = String(글 ?? '');
  let i = 시작, 중 = 0, 따 = null;
  while (i < s.length) {
    const c = s[i];
    if (따) { if (c === 따 && s[i - 1] !== '\\') 따 = null; }
    else if (c === '"' || c === "'" || c === '`') 따 = c;
    else if (c === '{') 중 += 1;
    else if (c === '}') 중 -= 1;
    else if (c === '>' && 중 <= 0) return s.slice(시작, i + 1);
    i += 1;
  }
  return null;                                // 안 닫혔다 — 못 쟀다
}

/** 잘라 온 꼬리표에서 넘긴 이름들을 뽑는다. 펼치기(`{...것}`)는 「모른다」로 돌려준다. */
export function 넘긴이름들(꼬리표) {
  const t = String(꼬리표 ?? '');
  const 속 = t.replace(/^<[A-Za-z][\w.]*/, '').replace(/\/?>$/, '');
  if (/\{\s*\.\.\./.test(속)) return { 펼침있음: true, 이름들: [] };
  const 이름들 = [];
  let i = 0;
  while (i < 속.length) {
    const 남 = 속.slice(i);
    const g = 남.match(/^\s*([A-Za-z_$][\w$:-]*)\s*(=)?/);
    if (!g) { i += 1; continue; }
    이름들.push(g[1]);
    i += g[0].length;
    if (!g[2]) continue;                      // 값 없는 속성
    const 남2 = 속.slice(i);
    const 앞빈 = 남2.match(/^\s*/)[0].length;
    let j = i + 앞빈;
    const c = 속[j];
    if (c === '"' || c === "'") {
      const 끝 = 속.indexOf(c, j + 1);
      j = 끝 < 0 ? 속.length : 끝 + 1;
    } else if (c === '{') {
      let 중 = 0, 따 = null;
      while (j < 속.length) {
        const dd = 속[j];
        if (따) { if (dd === 따 && 속[j - 1] !== '\\') 따 = null; }
        else if (dd === '"' || dd === "'" || dd === '`') 따 = dd;
        else if (dd === '{') 중 += 1;
        else if (dd === '}') { 중 -= 1; if (!중) { j += 1; break; } }
        j += 1;
      }
    } else {
      const 끝 = 남2.slice(앞빈).search(/[\s>]/);
      j = 끝 < 0 ? 속.length : j + 끝;
    }
    i = j;
  }
  return { 펼침있음: false, 이름들 };
}

/** 한 지면에서 한 컴포넌트를 쓴 곳들을 재서 어긋난 것만 돌려준다. */
export function 지면재기(글, 컴이름, 받는칸) {
  const s = String(글 ?? '');
  const 받는 = new Set(받는칸.map((x) => x.이름));
  const 필수 = 받는칸.filter((x) => x.필수).map((x) => x.이름);
  const 어긋남 = [];
  const 자 = new RegExp(`<${컴이름}(?=[\\s/>])`, 'g');
  let m;
  while ((m = 자.exec(s))) {
    const 꼬 = 꼬리표자르기(s, m.index);
    if (!꼬) { 어긋남.push({ 갈래: '못쟀다', 말: '여는 꼬리표가 안 닫혔다' }); continue; }
    const { 펼침있음, 이름들 } = 넘긴이름들(꼬);
    if (펼침있음) continue;                    // 이름을 모른다. 안 본 것으로 둔다
    for (const n of 이름들) {
      if (n.includes(':') || n.startsWith('data-') || n.startsWith('aria-')) continue;
      if (!받는.has(n)) 어긋남.push({ 갈래: '없는이름', 이름: n, 받는것: [...받는] });
    }
    for (const n of 필수) {
      if (!이름들.includes(n)) 어긋남.push({ 갈래: '필수빠짐', 이름: n });
    }
  }
  return 어긋남;
}

/* ── 자가시험 ────────────────────────────────────────────── */
function 자가시험() {
  let 든것 = 0, 깬것 = 0;
  const 재 = (무엇, 실제, 바람) => {
    const a = JSON.stringify(실제), b = JSON.stringify(바람);
    if (a === b) { 든것 += 1; } else { 깬것 += 1; console.log(`🔴 ${무엇}\n   나온것 ${a}\n   바람   ${b}`); }
  };

  재('Props 없으면 null', 받는이름들('const x = 1'), null);
  재('필수·선택을 가른다',
    받는이름들('interface Props {\n page: string;\n heading?: string;\n}'),
    [{ 이름: 'page', 필수: true }, { 이름: 'heading', 필수: false }]);
  재('여러 줄 주석 속 글자를 칸으로 세지 않는다',
    받는이름들('interface Props {\n /** page: 이건 주석이다 */\n slug: string;\n}'),
    [{ 이름: 'slug', 필수: true }]);
  재('한 줄 주석도 걷는다',
    받는이름들('interface Props {\n // heading: string;\n page: string;\n}'),
    [{ 이름: 'page', 필수: true }]);
  재('중괄호가 안에 또 있어도 몸을 옳게 끊는다',
    받는이름들('interface Props {\n opts: { a: string };\n page: string;\n}').map((x) => x.이름),
    ['opts', 'page']);

  재('간단한 꼬리표', 꼬리표자르기('<A page="/x" />', 0), '<A page="/x" />');
  재('속성 안의 부등호에 안 속는다',
    꼬리표자르기('<A f={(a) => a} /> 뒤', 0), '<A f={(a) => a} />');
  재('템플릿 문자열 안의 값넣기를 넘어간다',
    꼬리표자르기('<A page={`/b/${d}`} />', 0), '<A page={`/b/${d}`} />');
  재('안 닫히면 null', 꼬리표자르기('<A page="/x"', 0), null);
  재('여러 줄 꼬리표',
    꼬리표자르기('<A\n  page="/x"\n  heading="hi"\n/>', 0), '<A\n  page="/x"\n  heading="hi"\n/>');

  재('이름 하나', 넘긴이름들('<A page="/x" />'), { 펼침있음: false, 이름들: ['page'] });
  재('둘', 넘긴이름들('<A page="/x" heading="hi" />'),
    { 펼침있음: false, 이름들: ['page', 'heading'] });
  재('중괄호 값 뒤의 이름도 잡는다', 넘긴이름들('<A page={`/b/${d}`} heading="hi" />'),
    { 펼침있음: false, 이름들: ['page', 'heading'] });
  재('값 안의 낱말을 이름으로 세지 않는다', 넘긴이름들('<A page="/x heading y" />'),
    { 펼침있음: false, 이름들: ['page'] });
  재('펼치기는 「모른다」', 넘긴이름들('<A {...것} />'), { 펼침있음: true, 이름들: [] });
  재('값 없는 속성', 넘긴이름들('<A hidden page="/x" />'),
    { 펼침있음: false, 이름들: ['hidden', 'page'] });

  const 칸 = [{ 이름: 'page', 필수: true }, { 이름: 'heading', 필수: false }];
  재('🔴 오늘 결함 — slug 를 넘기면 잡는다',
    지면재기('<Rel slug="label-reach" />', 'Rel', 칸).map((x) => [x.갈래, x.이름]),
    [['없는이름', 'slug'], ['필수빠짐', 'page']]);
  재('옳게 쓴 것은 조용하다', 지면재기('<Rel page="/x" />', 'Rel', 칸), []);
  재('선택 칸을 넣어도 조용하다', 지면재기('<Rel page="/x" heading="hi" />', 'Rel', 칸), []);
  재('같은 이름으로 시작하는 다른 컴포넌트를 안 잡는다',
    지면재기('<RelBig slug="x" />', 'Rel', 칸), []);
  재('두 번 쓰면 두 번 잰다',
    지면재기('<Rel slug="a" />\n<Rel page="/b" />', 'Rel', 칸).length, 2);
  재('aria 는 넘어가고 class 는 잡는다',
    지면재기('<Rel page="/x" class="c" aria-hidden="true" />', 'Rel', 칸).map((x) => x.이름),
    ['class']);

  console.log(`\n자가시험 ${든것}가지 통과${깬것 ? ` · 🔴 ${깬것}가지 깨짐` : ''}`);
  return 깬것 === 0;
}

/* ── 본 일 ──────────────────────────────────────────────── */
function 훑기(방) {
  if (!fs.existsSync(방)) return [];
  const 낸것 = [];
  for (const e of fs.readdirSync(방, { withFileTypes: true })) {
    const p = path.join(방, e.name);
    if (e.isDirectory()) 낸것.push(...훑기(p));
    else if (e.name.endsWith('.astro')) 낸것.push(p);
  }
  return 낸것;
}

function 본일() {
  const 컴방 = path.join(뿌리, 'src/components');
  const 컴들 = new Map();
  for (const f of 훑기(컴방)) {
    const 칸 = 받는이름들(fs.readFileSync(f, 'utf8'));
    if (칸 && 칸.length) 컴들.set(path.basename(f, '.astro'), 칸);
  }
  console.log(`Props 를 선언한 컴포넌트 ${컴들.size}개`);

  const 지면들 = [...훑기(path.join(뿌리, 'src/pages')), ...훑기(컴방)];
  let 어긋난지면 = 0, 어긋난수 = 0;
  for (const f of 지면들) {
    const 글 = fs.readFileSync(f, 'utf8');
    const 여기 = [];
    for (const [이름, 칸] of 컴들) {
      if (!글.includes(`<${이름}`)) continue;
      for (const x of 지면재기(글, 이름, 칸)) 여기.push({ 컴: 이름, ...x });
    }
    if (!여기.length) continue;
    어긋난지면 += 1; 어긋난수 += 여기.length;
    console.log(`\n🔴 ${path.relative(뿌리, f).replace(/\\/g, '/')}`);
    for (const x of 여기) {
      if (x.갈래 === '없는이름') {
        console.log(`   <${x.컴} ${x.이름}=…>  ← 받지 않는 이름이다. 받는 것: ${x.받는것.join(', ')}`);
      } else if (x.갈래 === '필수빠짐') {
        console.log(`   <${x.컴}>  ← 반드시 넘겨야 할 «${x.이름}» 이 빠졌다`);
      } else {
        console.log(`   <${x.컴}>  ← ${x.말}`);
      }
    }
  }
  console.log(`\n지면·컴포넌트 ${지면들.length}장을 봤다`);
  if (!어긋난수) { console.log('✅ 어긋난 데 없다'); return true; }
  console.log(`🔴 ${어긋난지면}장에서 ${어긋난수}군데 어긋났다 — 값이 undefined 로 들어가 «조용히» 안 그려진다`);
  return false;
}

/**
 * ⛔ 이 자를 «불러다 쓰는» 쪽에서 본일()이 돌면 안 된다.
 *   2026-09-04 에 겪었다 — 이 자의 함수를 빌려 재 보려고 import 했더니
 *   본일()이 먼저 돌고 `process.exit` 로 그 자리에서 끝나 버렸다.
 *   그래서 내가 재려던 것은 «한 줄도» 안 찍혔고, 화면에는 「✅ 어긋난 데 없다」만 남았다.
 *   ⚠ 그 화면을 보고 「재 봤다」고 믿을 수 있다 — 그것이 제일 나쁜 꼴이다.
 */
const 이파일이시작인가 = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

if (이파일이시작인가) {
  const 인 = process.argv.slice(2);
  if (인.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else process.exit(본일() ? 0 : 1);
}
