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

function 검사(내용, 이름) {
  const 걸림 = [];
  내용.split('\n').forEach((line, i) => {
    for (const s of 사람글(line)) {
      const 끝 = s.replace(/[.!·…\s]+$/, '');
      if (!/[?？]/.test(s) && 의문어미.test(끝)) {
        걸림.push({ 파일: 이름, 줄: i + 1, 종류: '물음표 없음', 글: s });
      }
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
if (자가실패) {
  console.log(`\n⛔ **검사기 자체가 틀렸다.** 고치기 전에는 결과를 믿지 않는다.`);
  process.exit(1);
}

/**
 * 🔴 ③ **숫자 문장이 스스로 어긋나지 않나** (2026-08-06 · 2번 지적으로 넣음)
 *
 * 대학 지면은 「100명 가운데 **63명**이 취업했습니다」로 **사람 수로 반올림해** 말한 뒤
 * 「전국 평균 **62.8%**보다 낮습니다」를 붙인다. 63 > 62.8 이라 **말이 스스로 어긋난다.**
 * 실제로 여덟 곳이 그랬다(경기대 62.7 · 가톨릭대 62.5 · 숙명여대 62.5 …).
 *
 * ⚠ 이건 문장이 아니라 **자료**에서 나는 문제라 위 정규식으로는 못 잡는다.
 *   자료가 갱신되면 다시 난다. 그래서 **자료를 직접 잰다.**
 */
const 안보이는차이 = 0.5; // 자가시험의 기본값일 뿐이다. 본 검사는 **지면에서 읽은 값**을 쓴다(아래)
function 반올림모순(대학목록, 문턱 = 안보이는차이) {
  const 걸림 = [];
  for (const u of 대학목록) {
    for (const [칸, d] of [
      ['취업률', u.취업률],
      ['중도탈락률', u.중도탈락률],
    ]) {
      if (!d || d.차이 == null || d.전국평균 == null) continue;
      if (Math.abs(d.차이) < 문턱) continue; // 「거의 같습니다」로 나가므로 방향 단정이 없다
      const 반올림 = Math.round(d.값);
      const 실제 = Math.sign(d.차이);
      const 보이는 = Math.sign(반올림 - d.전국평균);
      if (보이는 !== 0 && 실제 !== 보이는) {
        걸림.push({
          파일: 'src/data/100yearmap/pages-university.json',
          줄: u.표시명,
          종류: '반올림이 비교를 뒤집음',
          글: `${칸} ${d.값}% → 「${반올림}」인데 전국 ${d.전국평균}% 보다 ${d.차이 > 0 ? '높' : '낮'}다고 말한다`,
        });
      }
    }
  }
  return 걸림;
}

/**
 * ── 자가시험 ③ — **8월 6일에 실제로 났던 값을 그대로 넣는다**
 *
 * 경기대 62.7% · 전국 62.8% · 차이 -0.1 이 그날의 실물이다.
 * 화면에는 「63명」과 「62.8%보다 낮습니다」가 나란히 찍혔다.
 *
 * ⚠ **문턱(0.5)에서는 이게 안 잡히는 게 맞다** — 「거의 같습니다」로 나가 방향을 아예 안 말하므로.
 *   그래서 옛 문턱(0.05)을 넣어 **그때였다면 잡혔는지**를 같이 잰다.
 *   이 두 줄이 있어야 「검사가 조용히 통과하는 것」과 「고쳐서 통과하는 것」이 구별된다.
 */
{
  const 경기대 = [{ 표시명: '(자가시험)경기대', 취업률: { 값: 62.7, 전국평균: 62.8, 차이: -0.1 } }];
  const 멀쩡 = [{ 표시명: '(자가시험)멀쩡', 취업률: { 값: 70.0, 전국평균: 62.8, 차이: 7.2 } }];

  if (반올림모순(경기대, 0.05).length !== 1) {
    console.log('  ⛔ 자가시험 실패 — 8/6 에 났던 경기대 값을 옛 문턱에서도 못 잡는다');
    process.exit(1);
  }
  if (반올림모순(경기대).length !== 0) {
    console.log('  ⛔ 자가시험 실패 — 문턱 아래는 「거의 같습니다」로 나가는데 잡았다');
    process.exit(1);
  }
  if (반올림모순(멀쩡).length !== 0) {
    console.log('  ⛔ 자가시험 실패 — 멀쩡한 것을 잡았다');
    process.exit(1);
  }
}

// ── 본 검사
const 전체 = 파일들.flatMap((f) => 검사(fs.readFileSync(f, 'utf8'), path.relative(ROOT, f)));

/**
 * ⚠ **문턱을 여기서 베끼지 않는다. 지면에서 읽어 온다.**
 *
 * 여기에 0.5 를 적어 두고 지면만 0.05 로 되돌리면, 검사는 조용히 통과하고 화면은 다시 어긋난다.
 * 그러면 이 검사는 지키는 척만 하는 물건이 된다. 그래서 **지면이 실제로 쓰는 값**으로 잰다.
 */
const 지면경로 = path.join(ROOT, 'src', 'pages', '100y', 'university', '[id].astro');
const 대학경로 = path.join(ROOT, 'src', 'data', '100yearmap', 'pages-university.json');
if (fs.existsSync(지면경로) && fs.existsSync(대학경로)) {
  const m = fs.readFileSync(지면경로, 'utf8').match(/const\s+안보이는차이\s*=\s*([\d.]+)/);
  if (!m) {
    전체.push({
      파일: 'src/pages/100y/university/[id].astro',
      줄: '-',
      종류: '문턱을 못 찾음',
      글: '`const 안보이는차이` 가 사라졌다. 이름을 바꿨다면 이 검사도 같이 고친다',
    });
  } else {
    전체.push(...반올림모순(JSON.parse(fs.readFileSync(대학경로, 'utf8')), Number(m[1])));
  }
}

console.log(`백년지도 문안 검사 — 파일 ${파일들.length}개 (자가시험 ${자가시험.length + 3}건 통과)`);
if (!전체.length) {
  console.log('✅ 물음표 빠진 의문문 0건 · 순위 표현 0건 · 반올림이 비교를 뒤집는 곳 0건');
  process.exit(0);
}
for (const b of 전체) console.log(`  ⛔ ${b.파일}:${b.줄}  [${b.종류}]  ${b.글}`);
console.log(`\n⛔ ${전체.length}건`);
process.exit(1);
