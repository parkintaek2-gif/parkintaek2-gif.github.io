#!/usr/bin/env node
/**
 * 백년지도 문안 검사 — **규칙을 문장이 아니라 검사로 둔다**
 *
 * 「우리가 일하는 법」 최종본: *문장으로 적은 기준은 지침이고, 검사로 적은 기준은 규칙이다.*
 * 사장님이 말씀하신 것을 여기에 넣는다. 사람이 기억하는 대신 이 파일이 지킨다.
 *
 *   node scripts/check-100yearmap-copy.mjs
 *
 * 지금 보는 것 둘
 *   ① **의문문에는 반드시 물음표를 넣는다** (사장님 지시 2026-08-05)
 *   ② **화면에 「몇 위」·순위를 쓰지 않는다** (사장님 지시 2026-08-04)
 *
 * ⚠ 검사가 헛도는지 먼저 확인한다 — `--selftest` 로 일부러 틀린 값을 넣어
 *   **실제로 잡히는지** 본다. 1번이 「검사 자체가 틀린다」를 다섯 번 겪었다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

/** 의문형 어미. 물음표 없이 끝나면 잡는다 */
const 의문어미 =
  /(나요|가요|까요|을까|ㄹ까|인가|는가|은가|왔나|있나|없나|되나|하나|맞나|같나|어떤가|무엇인가|어디서 왔나|왜인가)$/;

/** 순위 표현. ⚠ 우리가 「순위를 쓰지 않는다」고 설명하는 문장은 걸리면 안 된다
 *  ⚠ `\b` 를 쓰지 않는다 — 한글은 전부 단어문자라 「3위입니다」에서 경계가 안 잡힌다.
 *     자가시험이 이걸 잡아 줬다(2026-08-05). 안 넣었으면 검사기가 조용히 헛돌았다. */
const 순위표현 = /(\d+\s*위(?![치험원])|상위\s*\d|TOP\s*\d|랭킹)/;
const 순위예외 = /(순위가 아닙니다|순위를 매기지|줄 세우지|「몇 위」|등수가 없|등수는 없|순위 열은)/;

const 파일들 = [];
const 훑기 = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) 훑기(p);
    else if (e.name.endsWith('.astro')) 파일들.push(p);
  }
};
훑기(path.join(ROOT, 'src', 'pages', '100y'));
파일들.push(path.join(ROOT, 'src', 'layouts', 'HundredYear.astro'));

/** 태그 사이의 **사람이 읽는 글**만 꺼낸다. 코드·속성은 보지 않는다 */
function 사람글(line) {
  const out = [];
  for (const m of line.matchAll(/>([^<>{}]{3,120})</g)) {
    const s = m[1].trim().replace(/\s+/g, ' ');
    if (s) out.push(s);
  }
  return out;
}

/**
 * 🔴 [2026-09-22] **순위를 «일부러» 쓰는 지면이 있다 — 사장님 지시가 둘이다.**
 *
 *   2026-08-04  「화면에 몇 위·순위를 쓰지 않는다」
 *   2026-08-31  「과감하게 학교 순위를 공개해, 과연 그게 …행복한 순위인지 문제제기를 해」
 *
 * 부딪히는 것이 아니라 **겹친다** — 뒤의 지시가 앞의 지시에 예외를 냈다.
 * ⛔ 그렇다고 정규식을 무르게 하지 않는다. 무르게 하면 «모든» 지면에서 순위가 통과한다.
 * ✅ 예외는 «지면 이름»으로, 까닭을 적어 대장에 올린다 — docs/100y-순위지면-면제.json
 * ⚠ 물음표 검사는 예외 지면에도 그대로 돈다. 면제는 순위 한 가지뿐이다.
 */
const 면제대장 = (() => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', '100y-순위지면-면제.json'), 'utf8'));
    return new Set(Object.keys(j.지면 || {}));
  } catch { return new Set(); }
})();

/** 파일 경로에서 지면 이름(폴더 또는 파일 이름)을 뽑는다 */
export function 지면이름(이름) {
  const 조각 = String(이름 || '').replace(/\\/g, '/').split('/').filter(Boolean);
  const 끝 = 조각[조각.length - 1] || '';
  return /^index\.astro$/i.test(끝) ? (조각[조각.length - 2] || '') : 끝.replace(/\.astro$/i, '');
}

function 검사(내용, 이름) {
  const 걸림 = [];
  const 순위면제 = 면제대장.has(지면이름(이름));
  내용.split('\n').forEach((line, i) => {
    for (const s of 사람글(line)) {
      const 끝 = s.replace(/[.!·…\s]+$/, '');
      if (!/[?？]/.test(s) && 의문어미.test(끝)) {
        걸림.push({ 파일: 이름, 줄: i + 1, 종류: '물음표 없음', 글: s });
      }
      if (순위면제) continue;
      if (순위표현.test(s) && !순위예외.test(s)) {
        걸림.push({ 파일: 이름, 줄: i + 1, 종류: '순위 표현', 글: s });
      }
    }
  });
  return 걸림;
}

// ── 검사가 헛도는지 먼저 본다 (일부러 틀린 값)
const 자가시험 = [
  { 글: '<h2>이 숫자는 어디서 왔나</h2>', 잡혀야: true, 왜: '의문문인데 물음표가 없다' },
  { 글: '<h2>이 숫자는 어디서 왔나?</h2>', 잡혀야: false, 왜: '물음표가 있다' },
  { 글: '<p>전국 3위입니다</p>', 잡혀야: true, 왜: '순위 표현' },
  { 글: '<p class="note">가나다순입니다. 순위가 아닙니다.</p>', 잡혀야: false, 왜: '순위를 부정하는 설명' },
];
let 자가실패 = 0;
for (const t of 자가시험) {
  const 잡힘 = 검사(t.글, '(자가시험)').length > 0;
  if (잡힘 !== t.잡혀야) {
    console.log(`  ⛔ 자가시험 실패 — ${t.왜}: ${t.글}`);
    자가실패++;
  }
}
/* 면제 대장이 실제로 도는지 — ⛔ 「대장을 만들었다」를 「먹는다」로 세지 않는다 */
{
  const 글 = '<p>전국 3위입니다</p>';
  const 시험 = [
    ['면제 지면이면 순위를 안 잡는다',
      검사(글, 'src/pages/100y/ranking-bakery-brand/index.astro')
        .filter((x) => x.종류 === '순위 표현').length === 0],
    ['면제가 아닌 지면은 그대로 잡는다',
      검사(글, 'src/pages/100y/major/index.astro')
        .filter((x) => x.종류 === '순위 표현').length === 1],
    ['⛔ 면제 지면에서도 물음표는 그대로 본다',
      검사('<h2>어디서 왔나</h2>', 'src/pages/100y/ranking-bakery-brand/index.astro').length === 1],
    ['지면 이름을 폴더에서 뽑는다',
      지면이름('src/pages/100y/ranking-bakery-brand/index.astro') === 'ranking-bakery-brand'],
    ['낱장은 파일 이름에서 뽑는다', 지면이름('src/pages/100y/about.astro') === 'about'],
    ['대장이 비어 있지 않다 — 못 읽으면 검사가 조용히 옛날처럼 돈다', 면제대장.size >= 10],
  ];
  for (const [이름, 참] of 시험) {
    if (!참) { console.log(`  ⛔ 자가시험 실패 — ${이름}`); 자가실패++; }
  }
}

if (자가실패) {
  console.log(`\n⛔ **검사기 자체가 틀렸다.** 고치기 전에는 결과를 믿지 않는다.`);
  process.exit(1);
}

/**
 * 🔴 ③ **굵은 글씨 뒤에서 낱말이 붙어 버린다** (2026-08-06 실측 · 4곳)
 *
 *   화면에 이렇게 나갔다 — 「한 사람이 비율을 크게 **흔듭니다.**그래서 저희는 …」
 *
 * `</strong>` 로 줄이 끝나고 **다음 줄에 글이 오면 JSX 가 그 줄바꿈을 지운다.**
 * 사람 눈에는 소스가 멀쩡해 보이는데 화면에서만 붙는다. `{' '}` 로 공백을 못박아야 한다.
 *
 * ⛔ **조사가 붙는 자리는 붙는 게 맞다** — `<strong>실제 사람 수</strong>로만 적습니다`.
 *   그래서 조사로 시작하면 걸지 않는다. 안 그러면 멀쩡한 문장이 잔뜩 걸린다.
 */
const 조사 = /^(으로|로|를|을|이|가|은|는|에|와|과|의|도|만|보다|처럼|부터|까지|라고|이라고|입니다|이며|라서|이라)/;
function 붙은글(내용, 이름) {
  const 걸림 = [];
  const 줄 = 내용.split('\n');
  줄.forEach((l, i) => {
    if (!/<\/(strong|a|em|b)>\s*$/.test(l)) return;
    const 다음 = (줄[i + 1] ?? '').trim();
    if (!/^[가-힣]/.test(다음) || 조사.test(다음)) return;
    걸림.push({
      파일: 이름,
      줄: i + 1,
      종류: '굵은 글씨 뒤가 붙는다',
      글: `${l.trim().slice(-24)} ↵ ${다음.slice(0, 24)} — 끝에 {' '} 를 넣는다`,
    });
  });
  return 걸림;
}

/* ⚠ 자가시험 — 붙는 것은 잡고, **조사로 이어지는 멀쩡한 것은 안 잡는다** */
{
  const 나쁜 = '<strong>흔듭니다.</strong>\n그래서 저희는';
  const 좋은 = '<strong>실제 사람 수</strong>\n로만 적습니다';
  if (붙은글(나쁜, '(자가시험)').length !== 1 || 붙은글(좋은, '(자가시험)').length !== 0) {
    console.log('  ⛔ 자가시험 실패 — 「굵은 글씨 뒤가 붙는다」 검사가 헛돈다');
    process.exit(1);
  }
}

// ── 본 검사
const 전체 = 파일들.flatMap((f) => {
  const 글 = fs.readFileSync(f, 'utf8');
  const 이름 = path.relative(ROOT, f);
  return [...검사(글, 이름), ...붙은글(글, 이름)];
});

console.log(`백년지도 문안 검사 — 파일 ${파일들.length}개 (자가시험 ${자가시험.length}건 통과)`);
if (!전체.length) {
  console.log('✅ 물음표 빠진 의문문 0건 · 순위 표현 0건');
  process.exit(0);
}
for (const b of 전체) console.log(`  ⛔ ${b.파일}:${b.줄}  [${b.종류}]  ${b.글}`);
console.log(`\n⛔ ${전체.length}건`);
process.exit(1);
