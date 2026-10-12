/* measure-account-name-variants.mjs
 * 같은 재무제표 항목을 한국 공시가 «몇 가지 꼴»로 적나 — 세어서 JSON 으로 낸다
 *
 *   node scripts/measure-account-name-variants.mjs --자가시험
 *   node scripts/measure-account-name-variants.mjs --잰다
 *
 * ── 왜 이 지면인가 (2026-10-13 01:0x · 5번) ──────────────────────────────
 *
 * 여섯째 데이터 지면이다. `check-쥔자료에-안쓴축이-있나.mjs` 가 내놓은
 * 「지면도 기사도 «없는» 축 21개」 가운데 골랐다.
 * ⛔ 짓기 전에 `check-이축으로-이미낸게있나.mjs` 로 확인했다 — 걸리는 것이 없었다.
 *
 * 고른 까닭 — 우리 자료 `korea-financial-account-english.json` 을 열어 보니
 * **`현금및현금성자산` 과 `현금 및 현금성자산` 이 같은 영문으로 가고 있었다.**
 * 곧 **한국 공시는 같은 항목을 여러 꼴로 적는다.** 이름으로 맞추면 깨진다.
 *
 * ⭐ 이것이 「남들이 안 센 것을 센다」다. 매핑 표는 많지만
 *   **「한 항목이 몇 꼴로 갈리나」를 센 것은 못 봤다.**
 *   그리고 이 수는 한국 공시 자료를 기계로 읽는 사람 — 사람이든 AI든 — 이
 *   반드시 부딪히는 자리다.
 *
 * ── ⛔ 이 자가 «못» 재는 것 — 지면에 그대로 적는다 ──────────────────────
 * ⛔ **전체 상장사에 얼마나 들어맞나는 못 잰다.** 원자료 머리에 이렇게 박혀 있다 —
 *   "Real coverage cannot be measured until 6번's F1 collector runs across all
 *    2,765 listed companies. Do not guess ahead of it."
 *   그 수집기 자료가 **아직 없다**(2026-10-13 00:5x 에 찾아봤다). 그러므로
 *   「한국 공시의 N%」 같은 말을 **쓰지 않는다.**
 * ⛔ 「어느 꼴이 옳다」고 하지 않는다. 다 쓰이는 말이다. 우리는 갈린다는 것만 센다.
 * ⛔ 꼴이 많은 것을 「나쁜 회사」로 읽히게 쓰지 않는다 — 회사 이름을 안 붙인다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자료길 = path.join(뿌리, 'src', 'data', 'korea-financial-account-english.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'account-name-variants.json');

/** 띄어쓰기를 지운 꼴. 「띄어쓰기만 다른가」를 가리는 데 쓴다. */
export function 띄어쓰기지움(s) {
  return String(s ?? '').replace(/\s+/g, '');
}

/**
 * 영문 용어마다 한국어 꼴을 모은다.
 * ⛔ 같은 한국어가 두 번 들어와도 한 꼴로 센다.
 * @param 짝 { 한국어: '영문', … }
 * @returns [{영문, 꼴들, 꼴수, 띄어쓰기만}] — 많이 갈린 것부터
 */
export function 꼴모으기(짝) {
  const 통 = new Map();
  for (const [ko, en] of Object.entries(짝 ?? {})) {
    if (!ko || !en) continue;
    if (!통.has(en)) 통.set(en, new Set());
    통.get(en).add(ko);
  }
  return [...통.entries()]
    .map(([영문, 모음]) => {
      const 꼴들 = [...모음].sort((a, b) => a.localeCompare(b, 'ko'));
      /* 띄어쓰기를 지웠을 때 하나로 모이면 «띄어쓰기만» 다른 것이다 */
      const 띄어쓰기만 = 꼴들.length > 1
        && new Set(꼴들.map(띄어쓰기지움)).size === 1;
      return { 영문, 꼴들, 꼴수: 꼴들.length, 띄어쓰기만 };
    })
    .sort((a, b) => b.꼴수 - a.꼴수 || a.영문.localeCompare(b.영문));
}

/**
 * 센 것을 셈한다.
 * ⭐ 「띄어쓰기만 다른 것」을 따로 세는 까닭 — 그것은 지워서 풀린다.
 *   나머지는 **말 자체가 다르다.** 둘을 섞으면 일이 쉬워 보인다.
 */
export function 셈하기(모음) {
  const 여럿 = 모음.filter((x) => x.꼴수 > 1);
  const 띄어쓰기만 = 여럿.filter((x) => x.띄어쓰기만);
  const 말이다름 = 여럷수(여럿) - 띄어쓰기만.length;
  return {
    한국어꼴: 모음.reduce((s, x) => s + x.꼴수, 0),
    영문용어: 모음.length,
    갈린용어: 여럿.length,
    갈린용어가끌어안은꼴: 여럿.reduce((s, x) => s + x.꼴수, 0),
    띄어쓰기만: 띄어쓰기만.length,
    말이다름,
    가장많이갈린꼴수: 모음.length ? 모음[0].꼴수 : 0,
  };
}
/* 작은 도움 — 읽기 쉬우라고 뺀다 */
function 여럷수(여럿) { return 여럿.length; }

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통과 += 1; console.log('  ✅ ' + 말); } else { 실패 += 1; console.log('  🔴 ' + 말); }
  };

  본다('띄어쓰기를 지운다', 띄어쓰기지움('현금 및 현금성자산') === '현금및현금성자산');
  본다('⛔ 빈 값에도 안 터진다', 띄어쓰기지움(null) === '');

  {
    const 짝 = {
      '현금및현금성자산': 'Cash and cash equivalents',
      '현금 및 현금성자산': 'Cash and cash equivalents',
      '자산총계': 'Total assets',
    };
    const 모음 = 꼴모으기(짝);
    본다('영문 용어마다 한국어 꼴을 모은다', 모음.length === 2);
    본다('많이 갈린 것을 앞에 낸다', 모음[0].꼴수 === 2);
    본다('⭐ 띄어쓰기만 다른 것을 가려낸다 — 그것은 지워서 풀린다',
      모음[0].띄어쓰기만 === true);
    본다('한 꼴뿐인 것은 띄어쓰기만이 아니다 (갈린 것이 아니다)',
      모음.find((x) => x.영문 === 'Total assets').띄어쓰기만 === false);
  }

  {
    /* 🔴 말 자체가 다른 것 — 띄어쓰기를 지워도 안 모인다 */
    const 짝 = { '매출액': 'Revenue', '매출': 'Revenue', '수익': 'Revenue' };
    const 모음 = 꼴모으기(짝);
    본다('🔴 말이 다른 것은 띄어쓰기만이 아니다 — 지워도 안 풀린다',
      모음[0].띄어쓰기만 === false);
    본다('   꼴 수를 바르게 센다', 모음[0].꼴수 === 3);
    const s = 셈하기(모음);
    본다('   «말이 다름»으로 센다', s.말이다름 === 1 && s.띄어쓰기만 === 0);
  }

  {
    /* ⛔ 같은 한국어가 두 번 들어와도 한 꼴이다 */
    const 모음 = 꼴모으기({ '자산총계': 'Total assets' });
    본다('⛔ 한 꼴뿐이면 갈린 것이 아니다', 셈하기(모음).갈린용어 === 0);
  }

  {
    const 모음 = 꼴모으기({ '': 'Total assets', '자산총계': '' , '유동자산': 'Current assets' });
    본다('⛔ 빈 이름은 안 센다 — 「있다」와 「비었다」는 다르다', 모음.length === 1);
  }

  {
    const s = 셈하기([]);
    본다('⬜ 잴 것이 없으면 0 이지 터지지 않는다', s.영문용어 === 0 && s.갈린용어 === 0);
    본다('   가장 많이 갈린 꼴 수도 0 이다', s.가장많이갈린꼴수 === 0);
  }

  {
    /* ⭐ 진짜 자료로도 재 본다 — 가짜로만 재면 믿을 수 없다 */
    if (fs.existsSync(자료길)) {
      const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
      const s = 셈하기(꼴모으기(d.accountNames));
      본다('⭐ 진짜 자료에서 한국어 꼴이 영문 용어보다 많다 — 갈린다는 뜻이다',
        s.한국어꼴 > s.영문용어);
      본다('   갈린 용어가 하나라도 있다', s.갈린용어 > 0);
      본다('   «말이 다른» 쪽이 «띄어쓰기만»보다 많다 — 지워서 안 풀린다',
        s.말이다름 > s.띄어쓰기만);
    } else {
      본다('⬜ 원자료가 없다 — 이 시험은 못 돌렸다', false);
    }
  }

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
function 잰다() {
  if (!fs.existsSync(자료길)) {
    console.log('⬜ 원자료가 없다 — ' + 자료길);
    return 2;
  }
  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 모음 = 꼴모으기(d.accountNames);
  const 셈 = 셈하기(모음);
  const 여럿 = 모음.filter((x) => x.꼴수 > 1);

  console.log('■ 한 항목이 몇 꼴로 갈리나');
  console.log('   한국어 계정명 ' + 셈.한국어꼴 + ' → 영문 용어 ' + 셈.영문용어);
  console.log('   두 꼴 이상인 영문 용어 ' + 셈.갈린용어 + '개 (한국어 꼴 '
    + 셈.갈린용어가끌어안은꼴 + '개)');
  console.log('   그중 띄어쓰기만 다른 것 ' + 셈.띄어쓰기만 + '개 · «말이 다른» 것 '
    + 셈.말이다름 + '개');
  console.log('');
  for (const x of 여럿.slice(0, 10)) {
    console.log('   ' + x.꼴수 + '꼴  ' + x.영문 + (x.띄어쓰기만 ? '  (띄어쓰기만)' : ''));
    console.log('        ' + x.꼴들.join(' / '));
  }

  const 낼것 = {
    _meta: {
      생성: new Date().toLocaleString('sv-SE').replace('T', ' '),
      만든자: 'scripts/measure-account-name-variants.mjs',
      원자료: 'src/data/korea-financial-account-english.json',
      /* 🔴 지면이 반드시 적어야 하는 한계 — 원자료 머리에서 그대로 옮긴다 */
      못잰것: '전체 상장사에 얼마나 들어맞나는 못 쟀다. 원자료는 9개 회사 공시에서'
        + ' 뽑은 표본이고, 그 표본에 677개의 서로 다른 계정명이 나왔다.'
        + ' 2,765개 상장사 전체를 훑는 수집기 자료가 아직 없다'
        + ' (2026-10-13 00:5x 에 찾아 확인했다). 그래서 「한국 공시의 N%」라고 쓰지 않는다.',
      표본회사수: 9,
      표본에나온계정명수: 677,
    },
    셈,
    갈린것: 여럿.map((x) => ({ 영문: x.영문, 꼴수: x.꼴수, 꼴들: x.꼴들, 띄어쓰기만: x.띄어쓰기만 })),
    제표이름: d.statementNames ?? {},
  };
  fs.writeFileSync(낼길, JSON.stringify(낼것, null, 1), 'utf8');
  console.log('');
  console.log('   ✔ 적었다 — src/data/account-name-variants.json');
  console.log('   ⛔ 「한국 공시의 N%」라고 쓰지 않는다 — 전체 상장사 자료가 아직 없다');
  return 0;
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else if (process.argv.includes('--잰다')) process.exit(잰다());
  else { console.log('⛔ --잰다 나 --자가시험 을 준다'); process.exit(2); }
}
