#!/usr/bin/env node
/**
 * check-kcw-article-doors.mjs — 기사에서 기사로 가는 문이 **고르게 나 있나**를 잰다. (npm test)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-21 에 「관련기사 3개 · 링크 15개 전부 200」을 확인하고 닫았다. 그런데 8/22 에
 * **누가 가리켜지나**를 세 보니 108편이 가리키는 서로 다른 기사가 **21편뿐**이었다.
 * 최신 넷이 서로만 물고 있었다(4·4·3·3 vs 나머지 2).
 *
 * ⛔ 「링크가 셋 있다」와 「108편이 다 문이 된다」는 다른 말이다.
 *    앞의 것만 재고 끝냈던 것이 8/21 의 흠이고, 그래서 이 자를 둔다 —
 *    **규칙은 문장이 아니라 검사로 둔다.**
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * ① 후보가 셋 이상인 기사가 이웃 셋을 다 받았나
 * ② **아무도 안 가리키는 기사가 있나** — 있으면 그 편은 문이 없다
 * ③ 한 편에 쏠린 수가 상한을 넘었나 — 넘으면 다시 최신 몇 편만 도는 것이다
 *
 * ⛔ 기사 내용이 서로 어울리는지는 **안 본다.** 여기서 하는 말은 「고르게 나 있나」뿐이다.
 * ⚠ 빌드 없이 돈다 — 앞말을 글자로 읽는다. `astro:content` 를 안 거친다.
 *
 * 자가시험 — `node scripts/check-kcw-article-doors.mjs --자가시험`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 이웃표, 문열림 } from '../src/lib/kcw-neighbours.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CD = path.join(뿌리, 'content/kculturewire');

/**
 * 한 편에 몰릴 수 있는 상한. 8/22 실측으로 정했다 — 지금 최다가 **15번**이다.
 *
 *   옛 규칙  안 가리켜지는 편 25편 · 최다 19번 · 가리켜지는 서로 다른 편 83편
 *   새 규칙  안 가리켜지는 편  0편 · 최다 15번 · 가리켜지는 서로 다른 편 108편(전부)
 *
 * ⚠ 쏠림 자체를 없애지는 않았다. 앞의 두 자리는 «가까운 순»이고, 태그를 많이 나눠 가진
 *   편은 실제로 여러 편의 이웃이다. 그것을 억지로 자르면 엉뚱한 이웃이 붙는다.
 *   여기서 막는 것은 **옛 상태로 되돌아가는 것**이다(19번·25편 고아).
 * ⚠ 늘리려면 **왜 쏠려도 되는지**를 여기에 적는다. 조용히 못 늘리게.
 */
const 쏠림상한 = 18;

/** 앞말을 글자로 읽는다. CRLF 로 저장된 편이 섞여 있어 `\s` 를 안 쓴다(8/8 에 한 편을 놓쳤다) */
const 앞말 = (src) => {
  const 스칼라 = (열쇠) => {
    const m = src.match(new RegExp(`^${열쇠}:[^\\S\\r\\n]*"?([^"\\r\\n]*?)"?[^\\S\\r\\n]*\\r?$`, 'm'));
    return m ? m[1].trim() : '';
  };
  const 줄목록 = (열쇠) => {
    const m = src.match(new RegExp(`^${열쇠}:[^\\S\\r\\n]*\\r?\\n((?:[^\\S\\r\\n]+-[^\\S\\r\\n]+.*\\r?\\n)+)`, 'm'));
    if (!m) return [];
    return [...m[1].matchAll(/-[^\S\r\n]+"?([^"\r\n]+?)"?[^\S\r\n]*\r?$/gm)].map((x) => x[1].trim());
  };
  const 한줄목록 = (열쇠) => {
    const m = src.match(new RegExp(`^${열쇠}:[^\\S\\r\\n]*\\[(.*)\\][^\\S\\r\\n]*\\r?$`, 'm'));
    if (!m) return 줄목록(열쇠);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  };
  return {
    category: 스칼라('category'),
    pubDate: 스칼라('pubDate'),
    tags: 한줄목록('tags'),
    pages: 줄목록('pages'),
  };
};

export const 기사읽기 = (디렉 = CD) =>
  fs.readdirSync(디렉)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ f, src: fs.readFileSync(path.join(디렉, f), 'utf8') }))
    .filter(({ src }) => !/^draft:[^\S\r\n]*true/m.test(src))
    .map(({ f, src }) => ({ id: f.replace(/\.md$/, ''), ...앞말(src) }));

/* ── 자가시험 ─────────────────────────────────────────────────
 * 진짜 파일 없이 규칙만 잰다. **자가 틀리면 잰 수가 다 틀린다** —
 * 8/21 에 「셋이 있다」로 끝낸 자가 그랬다.
 */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  /* 다섯 편이 태그 하나를 모두 공유하면 옛 규칙은 최신 둘만 물었다. 새 규칙은 고르게 낸다 */
  const 모형 = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({
    id, category: 'x', pubDate: `2026-08-0${5 + i}`, tags: ['t'], pages: [],
  }));
  const 표 = 이웃표(모형);
  검('다섯 편이 다 이웃 셋을 받는다', [...표.values()].every((v) => v.length === 3));
  검('자기 자신을 안 넣는다', [...표.entries()].every(([id, v]) => !v.includes(id)));
  검('같은 편을 두 번 안 넣는다', [...표.values()].every((v) => new Set(v).size === v.length));

  const 잼 = 문열림(모형);
  검('안 가리켜지는 편이 없다', 잼.안가리켜지는편 === 0);
  검('한 편에 다 쏠리지 않는다', 잼.최다 <= 4);

  /* 같은 값이면 같은 답 — 순서가 흔들리면 빌드마다 링크가 바뀐다 */
  const 뒤집힘 = 이웃표([...모형].reverse());
  검('입력 순서가 바뀌어도 같은 답', [...표.keys()].every((id) => String(표.get(id)) === String(뒤집힘.get(id))));

  /* 후보가 둘뿐이면 셋째를 억지로 만들지 않는다 */
  const 셋만 = ['p', 'q', 'r'].map((id, i) => ({ id, category: 'y', pubDate: `2026-08-1${i}`, tags: [], pages: [] }));
  검('후보가 둘이면 이웃도 둘', [...이웃표(셋만).values()].every((v) => v.length === 2));

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-kcw-article-doors 자가시험 통과 (6)');
  process.exit(0);
}

/* ── 실제 기사를 잰다 ───────────────────────────────────────── */
const 기사들 = 기사읽기();
if (!기사들.length) { console.error('❌ content/kculturewire 에 기사가 없다. 자가 잴 것을 못 찾았다'); process.exit(1); }

const 표 = 이웃표(기사들);
const 잼 = 문열림(기사들);
const 후보부족 = [...표.entries()].filter(([, v]) => v.length < 3).map(([id]) => id);

const 문제 = [];
if (잼.안가리켜지는편 > 0) {
  const 목록 = [...잼.들어오는수.entries()].filter(([, n]) => n === 0).map(([id]) => id);
  문제.push(`아무도 안 가리키는 기사 ${잼.안가리켜지는편}편 — 그 편들은 문이 없다\n     ${목록.slice(0, 10).join(' · ')}`);
}
if (잼.최다 > 쏠림상한) {
  const 쏠린것 = [...잼.들어오는수.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  문제.push(`한 편에 ${잼.최다}번 쏠렸다(상한 ${쏠림상한}) — 다시 몇 편만 도는 것이다\n     ${쏠린것.map(([id, n]) => `${id}(${n})`).join(' · ')}`);
}

console.log(`기사 ${잼.기사수}편 · 이웃 셋 ${잼.이웃이셋}편 · 가리켜지는 서로 다른 편 ${잼.가리켜지는서로다른편}편 · 최다 ${잼.최다}번`);
if (후보부족.length) console.log(`⚠ 후보가 셋이 안 되는 편 ${후보부족.length}편 — ${후보부족.slice(0, 5).join(' · ')} (없는 문을 만들지 않았다)`);

if (문제.length) {
  console.error('❌ 기사 문이 고르지 않다\n' + 문제.map((s) => `   · ${s}`).join('\n'));
  process.exit(1);
}
console.log('✅ 기사에서 기사로 가는 문이 고르게 나 있다');
