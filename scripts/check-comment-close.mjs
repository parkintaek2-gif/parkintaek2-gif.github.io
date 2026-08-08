#!/usr/bin/env node
/**
 * **주석을 일찍 닫는 글자**를 잡는다 — 여섯 자리가 다 걸리는 병이다.
 *
 *   node scripts/check-comment-close.mjs
 *   node scripts/check-comment-close.mjs --selftest
 *
 * ## 🔴 왜 (2026-08-08 13:0x · 오늘만 세 번째)
 *
 *   ```
 *   8/7   3번   MAN* 다음에 /WOMAN*     수집기가 죽음
 *   13:0x 5번   **{별}/data 는 …        **전 자리 빌드**가 죽음
 *   13:0x 6번   같은 병으로 보임
 *   ```
 *
 *   블록 주석 안에서 `*` 다음에 `/` 가 오면 **거기서 주석이 닫힌다.**
 *   그다음 글자가 코드로 읽히면서 엉뚱한 자리에서 죽는다 —
 *   오늘 5번 것은 `subscribe.astro:39` 에서 죽었는데, 사람 눈에는 그냥 주석이었다.
 *
 *   ⛔ **경로를 굵게 쓸 때** 제일 잘 난다. 마크다운 버릇으로 `**{별}/data**` 라고 쓰면
 *     그 순간 `*` 다음에 `/` 가 붙는다.
 *
 * ## ⚠ 무엇을 잡고 무엇을 안 잡나
 *
 *   ```
 *   ✅ 잡는다   주석을 **연 뒤** 첫 `*` + `/` 앞뒤에 글자가 더 있는 줄
 *              (= 주석을 닫으려던 게 아닌데 닫히는 자리)
 *   ⛔ 안 잡는다 줄 끝에 홀로 있는 정상 닫기 `*` + `/`
 *   ⛔ 안 잡는다 주석 밖의 글자 — 정규식·나눗셈은 이 검사 몫이 아니다
 *   ```
 *
 * ⚠ 이 검사는 **컴파일러가 아니다.** 완벽히 파싱하지 않는다 —
 *   블록 주석 안인지만 따라가며 본다. 그래도 오늘 셋을 다 잡는다.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * 🔴 **여섯 자리가 한 벌로 쓴다** (2026-08-08 13:3x · 1번 부탁).
 *
 *   1번이 이걸 KLifeMap 에서 돌려 보려다 막혔다 — 거기 폴더는 `public·tools·tests·db` 다.
 *   *「제가 복사해 폴더만 바꾸면 **자가 두 벌**이 됩니다. 한쪽만 고친 날 둘이 갈라지고,
 *     **갈라진 줄도 모릅니다**」*
 *
 *   ```bash
 *   node scripts/check-comment-close.mjs                              여기 기본값(src,scripts)
 *   node scripts/check-comment-close.mjs --dirs public,tools,tests    다른 폴더
 *   node scripts/check-comment-close.mjs --root /path/to/repo         다른 저장소
 *   node scripts/check-comment-close.mjs --ext .php,.js               다른 확장자
 *   ```
 *
 *   ⛔ 복사본을 만들지 않는다. 이 자를 고치면 **그날 여섯 자리가 다 좋아진다.**
 */
const 인자값 = (이름, 기본) => {
  const i = process.argv.indexOf(이름);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : 기본;
};
const 쪼개기 = (s) => String(s).split(',').map((x) => x.trim()).filter(Boolean);

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const ROOT = path.resolve(인자값('--root', 여기));
const 볼폴더 = 쪼개기(인자값('--dirs', 'src,scripts'));
const 볼확장 = new Set(쪼개기(인자값('--ext', '.astro,.ts,.mjs,.js,.tsx,.jsx,.mts,.cjs')));
const 건너뛸 = new Set([
  'node_modules', 'dist', '.git', '.astro', 'build', 'coverage', '.next',
  /**
   * ⛔ **남이 만든 것은 안 본다** (2026-08-08 13:4x · 1번 저장소에서 돌려 보고 넣었다).
   *
   *   KLifeMap 에서 돌렸더니 7건이 걸렸는데 **전부 `jspdf`·`html2canvas` 압축본**이었다.
   *   압축된 파일은 라이선스 머리글 뒤에 코드가 바로 붙는 것이 정상이다.
   *
   *   ⚠ 이 검사가 막으려는 것은 **우리가 주석을 쓰다가 닫는 것**이다.
   *     우리가 안 쓴 코드에 우는 자는 소음이고, 소음은 다음 진짜 경보를 못 읽게 만든다.
   */
  'vendor', 'vendors', 'third_party', 'thirdparty',
]);
/** 압축본은 건너뛴다 — 사람이 고칠 파일이 아니다 */
const 압축본 = /\.min\.(js|mjs|cjs|ts)$/i;

/**
 * 한 파일에서 **주석을 일찍 닫는 자리**를 찾는다.
 *
 * 블록 주석 안을 따라가다가 `*` 다음 `/` 를 만나면 거기서 주석이 끝난다.
 * 그 자리가 **줄의 끝이 아니면** — 즉 뒤에 글자가 더 있으면 — 닫으려던 게 아니다.
 * 여는 자리 앞에 글자가 있어도(마크다운 굵게 표시) 마찬가지다.
 */
export function 찾기(글) {
  const 걸림 = [];
  const 줄들 = String(글 ?? '').split('\n');
  let 주석안 = false;
  /** 주석을 연 줄. 여러 줄짜리인지 가리는 데 쓴다 */
  let 연줄 = -1;
  /**
   * ⚠ **따옴표를 안다.** 안 그러면 `줄.indexOf('/{별}', j)` 같은 코드에서
   *   문자열 안의 여는 표시를 주석 여는 것으로 읽고, 그 뒤로 죄다 헛걸린다.
   *   314개 파일에서 실제로 그랬다 — 이 파일 자신도 걸렸다.
   * ⛔ 완전한 파서가 아니다. 줄 단위로 따옴표 짝만 따라간다. 그래도 오늘 셋을 다 잡는다.
   */
  for (let i = 0; i < 줄들.length; i++) {
    const 줄 = 줄들[i];
    let 따옴 = null;
    for (let j = 0; j < 줄.length; j++) {
      const c = 줄[j];
      const 다음 = 줄[j + 1];

      if (주석안) {
        if (c === '*' && 다음 === '/') {
          /**
           * ⚠ 언제 잡나 — 두 조건이 **같이** 맞을 때만이다.
           *
           *   ① 닫는 자리 **뒤에 글자**(낱말·숫자·한글)가 남아 있다
           *   ② 그 주석이 **여러 줄**짜리다 — 연 줄과 닫는 줄이 다르다
           *
           * ⛔ ①만으로는 정상 코드를 헛건다 —
           *   `catch {{열} 이미 죽었으면 넘긴다 {닫}} process.exit(코드);` 는 멀쩡하다.
           *   한 줄짜리 주석은 원래 뒤에 코드가 온다.
           * ⭐ 실제로 터진 둘은 **둘 다 여러 줄 주석 안**이었다(5번 subscribe · 3번 8/7 수집기).
           *   JSDoc 을 쓰다가 굵게 표시로 닫히는 것이 이 병의 꼴이다.
           */
          const 뒤 = 줄.slice(j + 2).trim();
          const 여러줄 = 연줄 !== i;
          if (여러줄 && /[\p{L}\p{N}]/u.test(뒤)) 걸림.push({ 줄번호: i + 1, 글: 줄.trim().slice(0, 90) });
          주석안 = false;
          j++;
        }
        continue;
      }

      if (따옴) {
        if (c === '\\') j++;
        else if (c === 따옴) 따옴 = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        따옴 = c;
        continue;
      }
      /* 줄 주석 뒤는 이 검사가 안 본다 — 거기서는 닫는 표시가 아무 일도 안 한다 */
      if (c === '/' && 다음 === '/') break;
      if (c === '/' && 다음 === '*') {
        주석안 = true;
        연줄 = i;
        j++;
      }
    }
  }
  return 걸림;
}

function 파일모으기() {
  const 나온것 = [];
  const 훑 = (d) => {
    let L;
    try {
      L = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of L) {
      if (건너뛸.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) 훑(p);
      else if (볼확장.has(path.extname(e.name)) && !압축본.test(e.name)) 나온것.push(p);
    }
  };
  for (const d of 볼폴더) 훑(path.join(ROOT, d));
  return 나온것;
}

function 셀프테스트() {
  const 검사 = [];
  const 확인 = (이름, 실제, 기대) => 검사.push({ 이름, 통과: JSON.stringify(실제) === JSON.stringify(기대) });

  /* ⚠ 시험 글은 **조각으로 이어 붙여** 만든다 — 여기 그대로 쓰면 이 파일이 같은 병에 걸린다 */
  const 별 = '*';
  const 슬 = '/';
  const 열 = 슬 + 별;
  const 닫 = 별 + 슬;

  확인('정상 주석은 안 잡는다', 찾기(`${열}* 그냥 주석\n ${닫}\nconst a = 1;`), []);
  확인('한 줄 주석도 안 잡는다', 찾기(`${열} 한 줄 ${닫}\n`), []);
  확인(
    '⭐ 5번 것을 잡는다 — 굵게 쓴 경로',
    찾기(`${열}*\n * 각자 세다가 ${별}${별}${슬}data 는 7파일${별}${별} 을 말했다\n ${닫}`).length,
    1,
  );
  /**
   * ⚠ 이 시험 글을 **한 줄로 적었다가 자가시험이 깨졌다.** 규칙을 약하게 하지 않고
   *   시험 글을 고쳤다 — **실제 8/7 사고는 여러 줄 주석 안**이었다.
   *   ⛔ 시험이 실제와 다르면, 통과해도 아무것도 지켜 주지 않는다.
   */
  확인(
    '⭐ 3번 8/7 것도 잡는다 — MAN* 다음 /WOMAN*',
    찾기(`${열}*\n * 칸 이름은 MAN${별}${슬}WOMAN${별} 두 가지다\n ${닫}`).length,
    1,
  );
  확인(
    '⭐ 한 줄 주석 뒤에 코드가 오는 것은 정상이다',
    찾기(`try {} catch { ${열} 넘긴다 ${닫} } process.exit(1);`),
    [],
  );
  확인('주석 밖의 나눗셈은 안 잡는다', 찾기('const a = b * 2 / c;'), []);
  확인('빈 글', 찾기(''), []);
  확인('null', 찾기(null), []);
  확인('⭐ JSX 주석은 안 잡는다 — 닫은 뒤 } 가 오는 게 정상이다', 찾기('{' + 열 + ' 주석 ' + 닫 + '}'), []);
  확인('닫은 뒤 세미콜론도 정상', 찾기(열 + ' 주석 ' + 닫 + ';'), []);

  for (const c of 검사) console.log(`${c.통과 ? '✅' : '⛔'} ${c.이름}`);
  const 실패 = 검사.filter((c) => !c.통과).length;
  console.log(`\n자가시험 ${검사.length}건 중 ${검사.length - 실패}건 통과`);
  return 실패 === 0;
}

/* ── 본일 ─────────────────────────────────────────────────────── */
const 자가통과 = 셀프테스트();
if (!자가통과) {
  console.log('\n⛔ **자가시험이 깨졌다.** 검사를 못 믿으니 결과를 안 낸다');
  process.exit(1);
}

const 파일들 = 파일모으기();
const 걸린것 = [];
/**
 * 🔴 **못 읽힌 파일을 조용히 넘기지 않는다** (2026-08-08 · 1번이 얹어 준 것).
 *
 *   1번 말 그대로 — *「까닭을 안 가리고 **못 읽히는 파일**을 잡는다.
 *   오늘 셋이 빠진 것은 전부 읽히지 않는 파일이었습니다. 까닭은 나중에 봐도 됩니다.
 *   **못 읽힌다는 사실 자체가 자입니다**」*
 *
 *   ⛔ 전에는 `catch { continue }` 로 넘겼다. 그러면 못 읽은 파일이 **통과로 보인다** —
 *     0장을 훑고 「0건」이라 말하는 것과 같은 병이다.
 */
const 못읽은것 = [];
for (const p of 파일들) {
  let 글;
  try {
    글 = fs.readFileSync(p, 'utf8');
  } catch (e) {
    못읽은것.push({ 파일: path.relative(ROOT, p), 까닭: String(e?.code ?? e?.message ?? e).slice(0, 40) });
    continue;
  }
  for (const x of 찾기(글)) 걸린것.push({ 파일: path.relative(ROOT, p), ...x });
}

console.log(
  `\n주석 일찍 닫힘 검사 — ${path.basename(ROOT)}/{${볼폴더.join(',')}} · 파일 ${파일들.length}개`,
);

/* 🔴 못 읽은 것을 **먼저** 말한다. 0장을 훑고 「0건」이라 하면 그게 제일 나쁘다 */
if (파일들.length === 0) {
  console.log('⬜ 볼 파일이 0개다 — **재지 못했다.** `--dirs` 가 맞는지 보십시오');
  process.exit(2);
}
if (못읽은것.length > 0) {
  console.log(`  ⬜ 못 읽은 파일 ${못읽은것.length}개 — 이건 통과가 아니라 **못 잰 것**이다`);
  for (const x of 못읽은것.slice(0, 5)) console.log(`     ${x.파일} (${x.까닭})`);
}

if (걸린것.length === 0) {
  console.log(`✅ 주석을 일찍 닫는 곳 0건${못읽은것.length ? ` (다만 ${못읽은것.length}개는 못 읽었다)` : ''}`);
  process.exit(못읽은것.length ? 2 : 0);
}
for (const x of 걸린것.slice(0, 20)) {
  console.log(`  ⛔ ${x.파일}:${x.줄번호}`);
  console.log(`     ${x.글}`);
  console.log('     → 주석 안에서 * 다음에 / 가 왔다. 「」로 바꾸거나 사이를 띄운다');
}
console.log(`\n⛔ ${걸린것.length}건. **빌드가 엉뚱한 자리에서 죽는다.**`);
process.exit(1);
