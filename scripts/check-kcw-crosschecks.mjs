#!/usr/bin/env node
/**
 * check-kcw-crosschecks.mjs — **기사마다 「이 수로 말할 수 없는 것」이 적혀 있나.**
 *
 * ── 왜 이 자가 생겼나 ───────────────────────────────────────────
 * 2026-08-29, 사장님 상시 지시(「카드·카드뉴스·숏영상을 매일 낸다」)를 지키려고
 * 카드뉴스를 만들다가 걸렸다. 기사 121편 중 **23편에 카드뉴스가 없었는데**,
 * 카드뉴스 짓는 자가 이렇게 서고 있었다 —
 *
 * ```
 * 1편  crossChecks 가 없다 — 한계 없는 카드는 안 만든다
 * ```
 *
 * ⭐ **그 자가 옳다.** 카드뉴스는 기사 없이 혼자 밖으로 나간다. 한계 문장이 없으면
 *   숫자만 남아 「이것이 사실이다」로 읽힌다. 우리 모토의 리스크관리 자리가 그것이다.
 *
 * 🔴 그런데 **막힌 기사가 몇 편인지 아무도 안 세고 있었다.** 카드뉴스 자는 「1편 건너뛴다」만
 *   말하고 지나갔고, 그래서 스물한 편이 조용히 밖으로 못 나가고 있었다.
 *
 * ── 이 자가 재는 것 ────────────────────────────────────────────
 * 기사 앞머리(frontmatter)에 `crossChecks` 가 있나. 없으면 —
 *   ① 카드뉴스가 안 만들어진다(밖으로 나갈 길이 하나 막힌다)
 *   ② 그 기사는 「이 수로 말할 수 없는 것」을 손님에게 안 말한 것이다
 *
 * ⛔ 이 자는 **채우지 않는다.** 한계는 그 기사의 자료를 아는 사람이 적어야 한다.
 *   ⚠ 지어내 채우면 「한계를 적었다」는 표시만 남고 뜻은 없어진다 — 그게 더 나쁘다.
 *
 * 쓰는 법  node scripts/check-kcw-crosschecks.mjs [--자세히]
 *          node scripts/check-kcw-crosschecks.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기사방 = path.join(뿌리, 'content', 'kculturewire');

/** 앞머리(--- 사이)만 떼어 낸다. ⛔ 본문에 crossChecks 라는 말이 나와도 안 센다 */
export function 앞머리(글) {
  const s = String(글 ?? '');
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(s);
  return m ? m[1] : '';
}

/**
 * 한계가 적혀 있나.
 * ⚠ 「있다」는 «키가 있다»가 아니라 «값이 있다»여야 한다 —
 *   `crossChecks:` 만 적고 비워 두면 없는 것과 같다.
 */
export function 한계있나(글) {
  const 앞 = 앞머리(글);
  /**
   * ⚠ `\s*` 를 쓰면 안 된다 — `\s` 는 **줄바꿈도 먹는다.** 그러면 `crossChecks:` 다음 줄
   *   (`title: A`)이 이 키의 «값»으로 잡혀서, 비어 있는데 「있다」가 된다.
   *   자가시험 ⑤가 이것을 잡았다. 줄 안의 공백만 넘긴다.
   */
  const m = /^crossChecks:[^\S\r\n]*(.*)$/m.exec(앞);
  if (!m) return false;
  const 뒤 = String(m[1]).trim();
  if (뒤 && 뒤 !== '[]' && 뒤 !== '""' && 뒤 !== "''") return true;
  /**
   * 여러 줄 목록 꼴 — `crossChecks:` **바로 다음 줄**이 `  - …` 이어야 값이 있는 것이다.
   * ⛔ 「앞머리 어디든 목록 줄이 있으면」으로 보면 안 된다 — 다른 키(sources 등)의 목록을
   *   이 키의 값으로 잘못 센다. 자가시험 ⑤가 바로 그 자리에서 걸렸다.
   */
  const 줄 = 앞.split(/\r?\n/);
  const i = 줄.findIndex((l) => /^crossChecks:/.test(l));
  return i >= 0 && /^\s+-\s+\S/.test(줄[i + 1] ?? '');
}

/** 제목 — 없으면 슬러그로 대신한다. ⛔ 지어내지 않는다 */
export function 제목뽑기(글, 슬러그) {
  const m = /^title:\s*["']?(.+?)["']?\s*$/m.exec(앞머리(글));
  return m ? m[1] : 슬러그;
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--자가시험') || process.argv.includes('--selftest')) {
  let 셈 = 0;
  const 본다 = (말, 참) => { 셈 += 1; console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };

  본다('① 앞머리만 떼어 낸다',
    앞머리('---\ntitle: A\n---\n본문에 crossChecks 라고 써 있어도') === 'title: A');
  본다('② 앞머리가 없으면 빈 글자', 앞머리('그냥 글') === '');

  본다('③ 한 줄로 적힌 한계를 센다',
    한계있나('---\ncrossChecks: "차트는 볼 수 있음이 아니다"\n---\n') === true);
  본다('④ 목록으로 적힌 한계를 센다',
    한계있나('---\ncrossChecks:\n  - 차트는 볼 수 있음이 아니다\n  - 표본이 작다\n---\n') === true);
  본다('⑤ 🔴 키만 있고 값이 비면 «없는» 것이다',
    한계있나('---\ncrossChecks:\ntitle: A\n---\n') === false);
  본다('⑥ 🔴 빈 목록도 없는 것이다', 한계있나('---\ncrossChecks: []\n---\n') === false);
  본다('⑦ 아예 없으면 없는 것이다', 한계있나('---\ntitle: A\n---\n') === false);
  본다('⑧ ⛔ 본문에 있는 말은 안 센다',
    한계있나('---\ntitle: A\n---\ncrossChecks: 이건 본문이다\n') === false);

  본다('⑨ 제목을 뽑는다', 제목뽑기('---\ntitle: "가나다"\n---\n', 's') === '가나다');
  본다('⑩ 제목이 없으면 슬러그를 쓴다 — 지어내지 않는다',
    제목뽑기('---\n---\n', 'my-slug') === 'my-slug');

  console.log(`\n${process.exitCode ? '❌' : '✅'} check-kcw-crosschecks 자가시험 (${셈})`);
  process.exit();
}

/* ── 몸 ───────────────────────────────────────────────── */
if (!fs.existsSync(기사방)) {
  console.log('⬜ 기사 폴더가 없다 — **못 쟀다**');
  process.exit(0);
}

const 자세히 = process.argv.includes('--자세히');
const 기사 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md'));
const 없는것 = [];

for (const f of 기사) {
  const 글 = fs.readFileSync(path.join(기사방, f), 'utf8');
  const 슬러그 = f.replace(/\.md$/, '');
  if (!한계있나(글)) 없는것.push({ 슬러그, 제목: 제목뽑기(글, 슬러그) });
}

console.log('\n■ 기사마다 「이 수로 말할 수 없는 것」이 적혀 있나\n');
console.log(`  기사 ${기사.length}편 · ${없는것.length ? '🔴' : '✅'} 한계가 안 적힌 것 ${없는것.length}편\n`);

if (없는것.length) {
  for (const a of 없는것.slice(0, 자세히 ? 999 : 25)) {
    console.log(`  🔴 ${a.슬러그}`);
    console.log(`     ${a.제목}`);
  }
  if (!자세히 && 없는것.length > 25) console.log(`\n  ⚠ ${없는것.length - 25}편 더 있다 — --자세히`);
  console.log('\n## 이것이 막고 있는 것');
  console.log('   · 카드뉴스가 «안 만들어진다» — 한계 없는 카드는 밖으로 안 낸다(그 자가 옳다)');
  console.log('   · 그래서 이 기사들은 밖으로 나갈 길이 하나 막혀 있다');
  console.log('\n## ⛔ 채우는 법 — 지어내지 않는다');
  console.log('   · 그 기사의 «자료가 못 하는 말»을 적는다. 「차트는 볼 수 있음이 아니다」처럼.');
  console.log('   · ⛔ 있어 보이려고 한 줄 채우지 않는다. 표시만 남고 뜻이 없어지면 더 나쁘다.');
} else {
  console.log('  ✅ 모든 기사에 한계가 적혀 있다');
}

process.exitCode = 없는것.length ? 1 : 0;
