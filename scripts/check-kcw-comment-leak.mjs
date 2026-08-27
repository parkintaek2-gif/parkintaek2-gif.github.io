/**
 * 지면 소스의 **HTML 주석에 우리말이 새는가**.
 *
 * 🔴🔴 [2026-08-27 15:3x] 왜 이 자가 있나
 *   오늘 05:3x 에 「왜 설명을 줄였는지」를 지면 글자 안에 `<!-- … -->` 로 적어 넣었다.
 *   HTML 주석은 **브라우저까지 그대로 간다.** 그래서 `/born-on/*` **366장**의 소스에
 *   우리 내부 판단이 우리말로 실려 나가고 있었다 — 영문 사이트다.
 *
 * ⚠ 처음에는 「지면에 우리말이 있나」로 재려 했다. 그런데 그렇게 재면 **803장**이 걸린다 —
 *   그중 대부분이 **손님을 위한 용어 풀이**다.
 *     /title    420장   「Distribution (배급)」        ← 맞다. 원어를 보여 주는 것이다
 *     /article   11장   「Korea Creative Content Agency (한국콘텐츠진흥원)」 ← 맞다. 기관 원어명이다
 *     (뿌리)      6장   「reads per million (백만분율)」 ← 맞다
 *     /born-on  366장   「설명이 159자여서 구글이 잘라 냈다」 ← 🔴 **이것만 새는 것이다**
 *
 * ⭐ 그래서 재는 자리를 **주석 안**으로 좁혔다. 넓게 재면 맞는 것 437장이 같이 울고,
 *   늘 우는 자는 아무도 안 읽는다(강령 ④ — 규칙은 검사로 두되, 그 검사가 읽혀야 한다).
 *
 * ⛔ 「우리말 주석을 쓰지 마라」가 아니다. 우리는 우리말로 판단을 적는다 — 그것이 우리 힘이다.
 *   **자바스크립트 주석(`/* … *\/`)에 적으면 안 나간다.** 나가는 자리에만 안 적는 것이다.
 *
 * 쓰는 법:
 *   node scripts/check-kcw-comment-leak.mjs            dist 를 잰다
 *   node scripts/check-kcw-comment-leak.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 우리말(한글 음절)이 있나. ⚠ 한자·가나는 안 본다 — 그건 손님에게 보여 주는 원어일 수 있다. */
export function 우리말있나(글자) {
  return /[가-힣]/.test(String(글자 ?? ''));
}

/**
 * HTML 에서 «주석»만 뽑아 그 안의 우리말을 찾는다.
 *
 * ⛔ 조건부 주석(`<!--[if …]>`)과 아스트로가 넣는 표식은 그냥 지나간다 — 우리말이 없다.
 * ⚠ 주석 안에 `--` 가 있어도 HTML 은 첫 `-->` 에서 끝난다. 그 규칙을 그대로 따른다.
 */
export function 새는주석찾기(html) {
  const 새는것 = [];
  const 자 = /<!--([\s\S]*?)-->/g;
  let m;
  while ((m = 자.exec(String(html ?? ''))) !== null) {
    if (우리말있나(m[1])) 새는것.push(m[1].trim().replace(/\s+/g, ' ').slice(0, 120));
  }
  return 새는것;
}

function 지면들(뿌리길) {
  const 모음 = [];
  if (!fs.existsSync(뿌리길)) return 모음;
  const 걷기 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷기(p);
      else if (e.name.endsWith('.html')) 모음.push(p);
    }
  };
  걷기(뿌리길);
  return 모음;
}

export function 재기(뿌리길) {
  const 파일들 = 지면들(뿌리길);
  const 걸린것 = [];
  for (const f of 파일들) {
    const 샌것 = 새는주석찾기(fs.readFileSync(f, 'utf8'));
    if (샌것.length) 걸린것.push({ 길: path.relative(뿌리, f), 샌것 });
  }
  return { 잰장: 파일들.length, 걸린것 };
}

function 화면(뿌리길) {
  const { 잰장, 걸린것 } = 재기(뿌리길);
  console.log('# 지면 주석에 우리말이 새는가');
  if (!잰장) {
    console.log(`  ⚠ 잰 지면이 «0장» 이다 — ${path.relative(뿌리, 뿌리길)} 이 없다.`);
    console.log('     ⛔ 「못 쟀다」는 「통과」가 아니다. 먼저 빌드하십시오.');
    return { 깨졌나: false, 못잼: true };
  }
  console.log(`  지면 ${잰장.toLocaleString('en-US')}장 · 주석에 우리말이 든 지면 **${걸린것.length}장**`);
  if (!걸린것.length) {
    console.log('\n✅ 새는 것 없다 — 우리 판단은 자바스크립트 주석에만 있다');
    return { 깨졌나: false, 못잼: false };
  }
  /* 자리별로 묶어 보여 준다 — 366장을 한 줄씩 찍으면 아무도 안 읽는다 */
  const 갈래 = new Map();
  for (const it of 걸린것) {
    const k = path.dirname(it.길);
    if (!갈래.has(k)) 갈래.set(k, { 수: 0, 보기: it.샌것[0] });
    갈래.get(k).수 += 1;
  }
  console.log('');
  for (const [k, v] of [...갈래].sort((a, b) => b[1].수 - a[1].수)) {
    console.log(`  🔴 ${k}  ${v.수}장`);
    console.log(`     「${v.보기}」`);
  }
  console.log('\n⛔ HTML 주석은 **브라우저까지 그대로 간다.** 우리말 판단은 만드는 자리의');
  console.log('   자바스크립트 주석으로 옮기십시오 — 거기는 안 나갑니다.');
  return { 깨졌나: true, 못잼: false };
}

/* ── 자가시험 ─────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 검 = (이름, 조건) => { if (조건) { 통과++; console.log(`  ✅ ${이름}`); } else { 실패++; console.log(`  ⛔ ${이름}`); } };

  검('🔴 주석 안의 우리말을 잡는다',
    새는주석찾기('<p>hi</p><!-- 설명이 159자여서 잘렸다 -->').length === 1);
  검('영문 주석은 안 잡는다',
    새는주석찾기('<!-- fixed the meta length -->').length === 0);
  검('⭐ «본문»의 우리말은 안 잡는다 — 용어 풀이는 맞는 것이다',
    새는주석찾기('<td>Distribution (배급)</td>').length === 0);
  검('⭐ 기관 원어명도 안 잡는다',
    새는주석찾기('<b>Korea Creative Content Agency (한국콘텐츠진흥원)</b>').length === 0);
  검('주석이 여러 개면 여러 개를 잡는다',
    새는주석찾기('<!-- 하나 --><!-- ok --><!-- 둘 -->').length === 2);
  검('여러 줄 주석도 잡는다',
    새는주석찾기('<!--\n 첫 줄\n 둘째 줄\n-->').length === 1);
  검('주석이 없으면 0개', 새는주석찾기('<html><body>plain</body></html>').length === 0);
  검('빈 입력이어도 안 죽는다', 새는주석찾기().length === 0 && 새는주석찾기(null).length === 0);
  검('한자만 있는 주석은 안 잡는다 — 원어일 수 있다',
    새는주석찾기('<!-- 百年之圖 -->').length === 0);
  검('우리말있나 가 한글만 본다',
    우리말있나('배급') === true && 우리말있나('Distribution') === false && 우리말있나('百年') === false);
  검('보기 글자를 120자로 자른다',
    새는주석찾기(`<!-- ${'가'.repeat(300)} -->`)[0].length <= 120);

  console.log(`\n자가시험 ${통과 + 실패}개 · 실패 ${실패}개`);
  return 실패;
}

const 이파일직접 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일직접) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
  else {
    const r = 화면(path.join(뿌리, 'dist/wikitip'));
    process.exit(r.깨졌나 || r.못잼 ? 1 : 0);
  }
}
