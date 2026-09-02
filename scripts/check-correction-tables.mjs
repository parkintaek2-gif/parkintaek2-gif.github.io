#!/usr/bin/env node
/**
 * check-correction-tables.mjs — **「고친 내역」 표가 참말인가.**
 *
 * ── 왜 만들었나 (2026-09-03) ────────────────────────────────
 * 자료를 다시 지어 기사 열일곱 편의 수를 고쳤고, 편마다 「What changed on …」 표를 붙였다.
 * 그 표는 **손님에게 우리가 무엇을 틀렸는지 알리는 자리**다. 그런데 그 표를 내가
 * «기억으로» 적었다. 기억으로 적은 정정표는 정정을 한 번 더 하는 일이다.
 *
 * 🔴 실제로 처음 판에서 일곱 줄이 어긋났다 —
 * ```
 *   전·후가 같은 줄 셋        「40.5% → 40.5%」 처럼 안 움직인 것을 움직인 것처럼 뒀다
 *   diff 에 없는 「전」값 하나  내가 지어낸 수였다
 * ```
 * ⛔ 우리 강령이 「못 잰 것은 못 쟀다고 적는다」인데, 정정표에 안 잰 수를 적으면
 *   그 강령을 정반대로 어긴다. 그래서 이 자를 둔다.
 *
 * ── 무엇을 잰다 ─────────────────────────────────────────────
 * 「What changed on <날짜>」 절의 `| 이름 | 전 | 후 |` 줄마다 —
 * ```
 *   ① 「전」값이 그 날 이전 판에 «실제로 있었나»   git diff 의 뺀 줄에서 찾는다
 *   ② 「후」값이 지금 본문에 «있나»                정정 절 밖의 본문에서 찾는다
 *   ③ 전·후가 같으면 라벨에 (unchanged) 가 있나   안 움직인 것을 움직인 것처럼 안 쓴다
 * ```
 * ⚠ 「전」값은 지운 값이라 지금 본문에 없는 것이 «정상»이다. 그래서 본문이 아니라 diff 를 본다.
 * ⛔ 이 자는 고치지 않는다. 어긋난 줄만 낸다.
 *
 * 쓰는 법
 *   node scripts/check-correction-tables.mjs --자가시험
 *   node scripts/check-correction-tables.mjs [--기준 <커밋>]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사방 = path.join(뿌리, 'content/kculturewire');

/**
 * 칸에서 수만 뽑는다.
 * ⚠ 천 단위 쉼표는 «수의 일부»(39,139)지만 목록 쉼표는 아니다(「58, 34.1%」).
 *   그래서 쉼표 뒤에 숫자 셋이 오는 것만 수의 일부로 받는다.
 *   🔴 이 한 줄이 없어 첫 판이 「58,」을 찾다가 세 줄을 거짓으로 울렸다.
 */
export function 수뽑기(칸) {
  return (String(칸 ?? '').match(/-?\d+(?:,\d{3})*(?:\.\d+)?/g) ?? []);
}

/** 「| 이름 | 전 | 후 |」 줄인가 — 머리줄과 가름줄은 뺀다 */
export function 표줄인가(줄) {
  const s = String(줄 ?? '').trim();
  if (!s.startsWith('|')) return false;
  if (/^\|\s*-{2,}/.test(s)) return false;
  if (/\|\s*Was\s*\|\s*Now\s*\|/i.test(s)) return false;
  return s.split('|').length >= 5;
}

/**
 * 「(unchanged)」 같은 표시를 뗀 칸. 수를 견주기 전에 뗀다 —
 * `172` 와 `172 (unchanged)` 는 글자로는 다르고 뜻으로는 같다.
 */
export function 표시뗀다(칸) {
  let t = String(칸 ?? '');
  for (const w of ['(unchanged)', 'unchanged', '(no change)', 'no change', 'did not move']) {
    const i = t.toLowerCase().indexOf(w);
    if (i >= 0) t = t.slice(0, i) + t.slice(i + w.length);
  }
  return t.trim();
}

/**
 * 수와 서식을 뺀 «낱말만». 🔴 [넷째 판 뒤] 수만 견주다가 헛울었다 —
 * `Slovenia, median breadth 76` → `Croatia, 76` 은 **시장이 바뀐 것**인데 수가 같아서
 * 「안 움직였다」로 읽혔다. 수가 같아도 낱말이 다르면 그 줄은 움직인 것이다.
 */
export function 낱말만(칸) {
  const 뺄것 = '0123456789.,%()';
  const t = String(칸 ?? '').split('').map((c) => (뺄것.includes(c) ? ' ' : c)).join('');
  return t.split(' ').filter(Boolean).join(' ').toLowerCase();
}

/** 안 움직였다고 «밝힌» 줄인가 */
export function 안움직였다고밝혔나(이름) {
  return /unchanged|no change|did not move/i.test(String(이름 ?? ''));
}

/**
 * 한 줄을 판정한다. 옛글·본문을 넣으면 흠을 배열로 낸다.
 *
 * 🔴 [2026-09-03 넷째 판] 「안 움직였다」 줄에서 **이 자가 헛울었다.**
 *   `| Film coverage | 15.3% | 15.3% (unchanged) |` 을 두고 「전값 15.3 이 지워진 적이 없다」고 했다.
 *   당연하다 — **안 움직인 값은 지워지지 않는다.** 지워진 줄에서 찾을 수 있을 리가 없다.
 *   앞 판이 통과한 것은 우연이었다(같은 수가 다른 줄에서 지워졌을 뿐).
 * ⛔ 그리고 「같나」를 글자로 견주고 있었다. `172` 대 `172 (unchanged)` 는 글자로는 다르다.
 *   그래서 «안 움직였는데 밝히지 않은 줄»을 못 잡았다. 수로 견줘야 한다.
 */
export function 줄판정(줄, 옛글, 본문) {
  const 칸 = String(줄).split('|').map((x) => x.trim());
  const [, 이름, 전, 후] = 칸;
  const 흠 = [];
  if (!이름 || !전 || !후) return 흠;
  const 밝혔나 = 안움직였다고밝혔나(이름) || 안움직였다고밝혔나(후);
  const 후정리 = 표시뗀다(후);
  const 전수 = 수뽑기(전); const 후수 = 수뽑기(후정리);
  /* 수«와» 낱말이 둘 다 같을 때만 「안 움직였다」로 본다 */
  const 같나 = 전수.length > 0 && 전수.length === 후수.length
    && 전수.every((x, i) => x === 후수[i]) && 낱말만(전) === 낱말만(후정리);
  if (같나 && !밝혔나) 흠.push('전·후가 같은데 unchanged 라고 안 밝혔다');
  /* ⛔ 안 움직인 값은 지워진 적이 없다. 그 줄의 「전」값은 이력에서 찾지 않는다 */
  if (!같나) {
    for (const x of 전수) if (!String(옛글).includes(x)) 흠.push(`전값 ${x} 가 지워진 적이 없다`);
  }
  for (const x of 후수) if (!String(본문).includes(x)) 흠.push(`후값 ${x} 가 지금 본문에 없다`);
  return 흠;
}


/**
 * 🔴 [2026-09-03 두 번째 판] **기준 커밋을 하나로 못박아 둔 것이 이 자의 결함이었다.**
 *
 * 첫 판은 `cb270de6` 하나를 모든 표에 댔다. 그 커밋은 8월 말 것이라, 그 뒤에 새로 붙인
 * 「What changed on 3 September」 표의 「전」값은 그 판에 «있을 수가 없다» — 그때는 그 값이
 * 아직 아니었으니까. 그래서 27줄이 **거짓으로 울었다.**
 *
 * ⛔ 우리 자 규칙: 「헛울는 자는 꺼진다」. 한 날짜만 볼 수 있는 자는 다음 정정에서 반드시 헛운다.
 * ⛔ 두 번째 판에서 「그 날이 시작되기 직전 커밋」을 기준으로 삼아 봤다. **그것도 틀렸다** —
 *   같은 날 안에서 두 번 고치면(오늘 실제로 397→420→421 이었다) 「그 날 이전 판」에는
 *   두 번째 고침의 「전」값이 없다. 날짜 하나로는 같은 날의 두 고침을 못 가른다.
 *
 * ✅ 그래서 셋째 판은 **커밋 하나를 고르지 않는다.** 물음을 바꿨다 —
 *   「이 값이 이 파일에 «전에 있었고 우리가 지웠나»」. 그것은 이력 전체에서 잰다:
 *   `git log -p` 의 뺀 줄 + 아직 커밋 안 된 `git diff HEAD` 의 뺀 줄.
 *   기준 커밋이라는 개념 자체가 필요 없어졌고, 그래서 다음 정정에서도 안 헛운다.
 * ⚠ 날짜는 이제 «어느 표의 흠인가»를 알리는 데만 쓴다. 판정에는 안 쓴다.
 */
const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** 「3 September 2026」 → 「2026-09-03」. 못 읽으면 **null**(0 이나 오늘로 채우지 않는다) */
export function 날짜읽기(제목) {
  const 조각 = String(제목 ?? '').trim().split(',').join(' ').split(' ').filter(Boolean);
  if (조각.length < 3) return null;
  const 일 = Number(조각[0]);
  const 달 = 달이름.indexOf(조각[1]);
  const 해 = Number(조각[2]);
  if (!Number.isInteger(일) || 일 < 1 || 일 > 31) return null;
  if (달 < 0) return null;
  if (!Number.isInteger(해) || 해 < 2000 || 해 > 2999) return null;
  const p = (n) => String(n).padStart(2, '0');
  return [해, p(달 + 1), p(일)].join('-');
}

export const 절머리 = '## What changed on ';

/** 글을 「정정 절 앞의 본문」과 **날짜별 절**로 나눈다 */
export function 절나누기(글) {
  const LF = String.fromCharCode(10);
  const 줄들 = String(글 ?? '').split(LF);
  const 절들 = []; const 본문줄 = [];
  let 지금 = null;
  for (const l of 줄들) {
    const t = l.trim();
    if (t.startsWith(절머리)) {
      const 제목 = t.slice(절머리.length).trim();
      지금 = { 제목, 날짜: 날짜읽기(제목), 표줄들: [] };
      절들.push(지금);
      continue;
    }
    if (지금) { if (표줄인가(l)) 지금.표줄들.push(l); continue; }
    본문줄.push(l);
  }
  return { 본문: 본문줄.join(LF), 절들 };
}
const 내가 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, ok) => { if (ok) 통 += 1; else 실.push(이름); };

  검('천 단위 쉼표는 수의 일부', JSON.stringify(수뽑기('39,139')) === JSON.stringify(['39,139']));
  검('⛔ 목록 쉼표는 수에 안 붙는다', JSON.stringify(수뽑기('58, 34.1%')) === JSON.stringify(['58', '34.1']));
  검('소수를 읽는다', JSON.stringify(수뽑기('2.1 points')) === JSON.stringify(['2.1']));
  검('수가 없으면 빈 배열', 수뽑기('none').length === 0);
  검('⛔ 빈 것도 안 터진다', 수뽑기(undefined).length === 0);

  검('표 줄을 집는다', 표줄인가('| Korean runs | 7,414 | 7,288 |'));
  검('머리줄은 뺀다', !표줄인가('| | Was | Now |'));
  검('가름줄은 뺀다', !표줄인가('|---|---|---|'));
  검('표가 아닌 줄은 뺀다', !표줄인가('그냥 문장'));

  검('전값이 옛글에 있고 후값이 본문에 있으면 흠 없다',
    줄판정('| a | 7,414 | 7,288 |', '-| a | 7,414 |', '지금 본문에 7,288 이 있다').length === 0);
  검('전값이 옛글에 없으면 잡는다',
    줄판정('| a | 9,999 | 7,288 |', '-| a | 7,414 |', '7,288').some((x) => x.includes('9,999')));
  검('후값이 본문에 없으면 잡는다',
    줄판정('| a | 7,414 | 7,288 |', '-| a | 7,414 |', '딴 소리').some((x) => x.includes('7,288')));
  검('전·후가 같으면 잡는다',
    줄판정('| a | 40.5% | 40.5% |', '-40.5%', '40.5%').some((x) => x.includes('unchanged')));
  검('날짜를 읽는다', 날짜읽기('3 September 2026') === '2026-09-03');
  검('한 자리 달도 읽는다', 날짜읽기('7 August 2026') === '2026-08-07');
  검('쉼표가 있어도 읽는다', 날짜읽기('3 September, 2026') === '2026-09-03');
  검('⛔ 못 읽으면 null — 오늘로 채우지 않는다', 날짜읽기('someday') === null);
  검('⛔ 없는 달은 null', 날짜읽기('3 Smarch 2026') === null);
  검('⛔ 빈 것도 안 터진다', 날짜읽기(undefined) === null);

  {
    const LF = String.fromCharCode(10);
    const 글 = [
      'body line with 421',
      '## What changed on 2 September 2026',
      '| a | 1 | 2 |',
      '## What changed on 3 September 2026',
      '| b | 3 | 4 |',
    ].join(LF);
    const { 본문, 절들 } = 절나누기(글);
    검('본문은 첫 정정절 앞까지다', 본문.includes('421') && !본문.includes('What changed'));
    검('절을 날짜별로 나눈다', 절들.length === 2);
    검('절마다 날짜를 읽는다', 절들[0].날짜 === '2026-09-02' && 절들[1].날짜 === '2026-09-03');
    검('표줄이 자기 절에 붙는다', 절들[0].표줄들.length === 1 && 절들[1].표줄들.length === 1);
  }

  검('⛔ 172 대 「172 (unchanged)」 도 안 움직인 것으로 읽는다',
    줄판정('| a | 172 | 172 (unchanged) |', '지워진 적 없다', '본문에 172 있다').length === 0);
  검('⛔ 안 움직였는데 안 밝히면 잡는다',
    줄판정('| a | 76 | 76 |', '아무것', '본문에 76 있다').some((x) => x.includes('unchanged')));
  검('⛔ 수는 같고 낱말이 다르면 «움직인» 줄이다 (Slovenia → Croatia)',
    !줄판정('| a | Slovenia, 76 | Croatia, 76 |', '-Slovenia, 76', '본문에 Croatia, 76 있다')
      .some((x) => x.includes('unchanged')));
  검('낱말만 — 수·서식을 뗀다', 낱말만('Slovenia, median breadth 76') === 'slovenia median breadth');
  검('표시뗀다 — (unchanged) 를 뗀다', 표시뗀다('172 (unchanged)') === '172');
  검('안 움직인 줄의 전값은 이력에서 안 찾는다',
    줄판정('| a (unchanged) | 15.3% | 15.3% |', '', '본문에 15.3% 있다').length === 0);
  검('그래도 후값이 본문에 없으면 잡는다',
    줄판정('| a (unchanged) | 15.3% | 15.3% |', '', '딴 소리').some((x) => x.includes('15.3')));

  검('안 움직였다고 밝히면 통과',
    줄판정('| a (unchanged) | 40.5% | 40.5% |', '-40.5%', '40.5%').length === 0);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ 고친내역 표 검사 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가) {
  /* --기준 을 주면 그것으로 모든 표를 본다. 안 주면 **표의 날짜에서 잰다**(위 주석) */
  const 기준강제 = (() => {
    const i = process.argv.indexOf('--기준');
    return i > 0 ? process.argv[i + 1] : null;
  })();
  const LF = String.fromCharCode(10);
  const 지운줄만 = (d) => String(d).split(LF).filter((l) => l.startsWith('-') && !l.startsWith('---')).join(LF);
  /**
   * 이 파일에서 **언제든 지워진 줄 전부.** 커밋된 이력 + 아직 커밋 안 된 것.
   * ⚠ 「전」값은 지운 값이므로 지금 본문에 없는 것이 정상이다. 그래서 지운 줄을 본다.
   */
  const 지운적있는줄 = (rel) => {
    const 조각 = [];
    for (const 인자 of [
      ['log', '-p', '--unified=0', '--', rel],
      ['diff', '--unified=0', 'HEAD', '--', rel],
    ]) {
      try { 조각.push(지운줄만(execFileSync('git', 인자, { encoding: 'utf8', cwd: 뿌리, maxBuffer: 64 * 1024 * 1024 }))); }
      catch { /* 이력이 없으면 빈 것 */ }
    }
    return 조각.join(LF);
  };
  /* --기준 을 준 때만 쓴다 — 옛 판을 손으로 대고 싶을 때가 있다 */
  const 뺀줄강제 = (기준, rel) => {
    try { return execFileSync('git', ['diff', '--unified=0', 기준, '--', rel], { encoding: 'utf8', cwd: 뿌리 }); }
    catch { return ''; }
  };
  let 흠 = 0; let 본줄 = 0; let 본편 = 0; let 못쟀다 = 0;
  for (const f of fs.readdirSync(기사방).filter((x) => x.endsWith('.md'))) {
    const p = path.join(기사방, f);
    const { 본문, 절들 } = 절나누기(fs.readFileSync(p, 'utf8'));
    const 표있는절 = 절들.filter((x) => x.표줄들.length);
    if (!표있는절.length) continue;
    본편 += 1;
    const rel = path.relative(뿌리, p).split(path.sep).join('/');
    const 옛글 = 기준강제
      ? 지운줄만(뺀줄강제(기준강제, rel))
      : 지운적있는줄(rel);
    if (!옛글) {
      못쟀다 += 표있는절.length;
      console.log(`   ⬜ ${f} — 이 파일에서 지워진 줄을 하나도 못 읽었다. 이 편은 «못 쟀다»`);
      continue;
    }
    for (const 절 of 표있는절) {
      const 날 = 절.날짜 ?? '날짜 못 읽음';
      for (const l of 절.표줄들) {
        본줄 += 1;
        for (const x of 줄판정(l, 옛글, 본문)) {
          흠 += 1;
          console.log(`   🔴 ${f} [${날}] — ${x}` + LF + `      ${l.trim()}`);
        }
      }
    }
  }
  console.log(String.fromCharCode(10) + `고친내역 표 — 기사 ${본편}편 · 줄 ${본줄}개를 봤다`
    + (기준강제 ? ` (기준 ${기준강제})` : ' (이 파일에서 지워진 적 있는 줄과 견줬다)')
    + (못쟀다 ? ` · 못 쟀다 ${못쟀다}개` : ''));
  console.log(흠 ? `⛔ 어긋난 것 ${흠}개 — 정정표를 기억으로 적지 않는다` : '✅ 정정표의 전·후가 다 확인된다');
  process.exit(흠 ? 1 : 0);
}
