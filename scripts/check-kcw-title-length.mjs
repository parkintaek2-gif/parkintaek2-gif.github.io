#!/usr/bin/env node
/**
 * check-kcw-title-length.mjs — **검색 결과에서 제목이 잘려 논점이 안 보이나**를 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 실측. 우리 기사 113편의 제목 길이를 세 보니 —
 * ```
 *  0~60 자    1편        ← 안 잘리는 것
 * 61~75 자   12편
 * 76~90 자   33편
 * 91자 이상  67편        중간값 93자
 * ```
 * 구글은 제목을 **60자 안팎**에서 자른다. 그러면 손님이 읽는 것은 앞의 절반뿐이다.
 * 우리 제목은 「사실 + 그 사실의 크기」 꼴이라 **잘리면 크기가 사라진다** —
 * 「Korean series that never aired on Korean television reach te…」 에서 「ten times」가 잘렸다.
 *
 * ⭐ 그리고 같은 4주에 이 기사들이 **1페이지에 있으면서 클릭 0** 이었다. 순위는 있고 눌릴 까닭이 없다.
 *
 * ── 무엇을 보나 (⛔ 「좋은 제목인가」는 안 본다) ──────────────
 * ① 제목이 몇 자인가 · 잘린 뒤에 **수나 뒤집는 말이 남아 있나**
 * ② ⛔ 모든 기사를 다 고치라고 하지 않는다. **노출을 받는 편**부터 짚는다
 *    (노출 0인 편의 제목을 고치는 것은 아직 값이 없다)
 *
 * ⚠ 60자는 화면 너비에 따라 달라진다. 그래서 **한 자 넘었다고 세우지 않는다** —
 *   기본 한도는 넉넉히 78자로 두고, 그 위를 짚는다.
 *
 * 쓰는 법  node scripts/check-kcw-title-length.mjs --자가시험
 *          node scripts/check-kcw-title-length.mjs [--한도=78]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CD = path.join(뿌리, 'content/kculturewire');
const 노출길 = path.join(뿌리, 'src/data/wikitip-ctr-gap.json');

/** 앞말에서 제목을 뽑는다. ⚠ CRLF 로 저장된 편이 섞여 있다 */
export const 제목뽑기 = (원본) => {
  const m = String(원본).match(/^title:\s*"(.*)"\s*\r?$/m);
  return m ? m[1] : null;
};

/** 구글이 자르고 남는 앞부분 */
export const 잘린뒤 = (제목, 자리 = 60) => String(제목 ?? '').slice(0, 자리);

/**
 * 잘린 앞부분에 **논점이 남았나**. 수 또는 뒤집는 말이 있으면 남은 것으로 본다.
 * ⛔ 「좋다/나쁘다」를 판정하지 않는다. **읽는 사람이 무엇을 얻는지**만 본다.
 */
export function 논점남았나(제목, 자리 = 60) {
  const 앞 = 잘린뒤(제목, 자리);
  if (/\d/.test(앞)) return true;                        // 수가 남았다
  if (/\b(never|not|no|none|nobody|only|less|more|half|most|every|all)\b/i.test(앞)) return true;
  return false;
}

/** 노출을 받는 기사만 골라야 한다 — 노출 0인 편의 제목은 아직 고칠 값이 없다 */
export function 노출표읽기(길 = 노출길) {
  try {
    const j = JSON.parse(fs.readFileSync(길, 'utf8'));
    const m = new Map();
    for (const r of j.rows ?? []) {
      const s = String(r.주소 ?? '');
      if (s.startsWith('/article/')) m.set(s.replace('/article/', ''), r.노출 ?? 0);
    }
    return m;
  } catch { return new Map(); }
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('제목을 뽑는다', 제목뽑기('---\ntitle: "Hello there"\ndek: "x"\n---') === 'Hello there');
  검('CRLF 편도 뽑는다', 제목뽑기('---\r\ntitle: "Hello"\r\n---') === 'Hello');
  검('⛔ 제목이 없으면 null', 제목뽑기('---\ndek: "x"\n---') === null);
  검('잘린 앞부분을 준다', 잘린뒤('abcdefghij', 5) === 'abcde');

  /* 🔴 오늘 실측한 그 제목이다 — 「ten times」가 잘려 나간다 */
  const 실제 = 'Korean series that never aired on Korean television reach ten times as many countries';
  검('⭐ 그 제목은 60자에서 잘린다', 실제.length > 60);
  검('⭐ 잘려도 «never» 가 남으면 논점은 남았다고 본다', 논점남았나(실제) === true);
  검('수가 앞에 있으면 남았다', 논점남았나('Half of 93 markets took it, and the other half did not') === true);
  검('⛔ 앞부분이 맹물이면 안 남았다',
    논점남았나('A look at the way Korean production companies are credited in the weekly lists') === false);
  검('길이 자리를 바꿀 수 있다', 논점남았나('xxxxxxxxxx 5 more', 5) === false);

  const m = 노출표읽기(path.join(뿌리, '없는파일.json'));
  검('⛔ 노출표가 없으면 빈 표(터지지 않는다)', m instanceof Map && m.size === 0);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-kcw-title-length 자가시험 통과 (10)');
  process.exit(0);
}

const 한도 = Number((process.argv.find((a) => a.startsWith('--한도='))?.split('=')[1]) ?? 78);
const 노출 = 노출표읽기();

const 것들 = [];
for (const f of fs.readdirSync(CD).filter((x) => x.endsWith('.md'))) {
  const 원본 = fs.readFileSync(path.join(CD, f), 'utf8');
  if (/^draft:\s*true/m.test(원본)) continue;
  const 제목 = 제목뽑기(원본);
  if (!제목) continue;
  const slug = f.replace(/\.md$/, '');
  것들.push({ slug, 제목, 길이: 제목.length, 노출: 노출.get(slug) ?? 0, 논점: 논점남았나(제목) });
}

const 긴것 = 것들.filter((x) => x.길이 > 한도);
const 노출받는긴것 = 긴것.filter((x) => x.노출 > 0).sort((a, b) => b.노출 - a.노출);
const 논점잘린것 = 긴것.filter((x) => !x.논점);

console.log(`제목 길이 검사 — 기사 ${것들.length}편 · 한도 ${한도}자`);
console.log(`  한도를 넘는 편 ${긴것.length}편 (중간값 ${[...것들].sort((a, b) => a.길이 - b.길이)[Math.floor(것들.length / 2)].길이}자)`);
console.log(`  그중 노출을 받고 있는 편 ${노출받는긴것.length}편  ← 여기부터 고친다`);
console.log(`  잘린 앞부분에 논점이 안 남은 편 ${논점잘린것.length}편`);

if (노출받는긴것.length) {
  console.log('\n## 노출을 받는데 제목이 잘리는 편');
  for (const x of 노출받는긴것.slice(0, 12)) {
    console.log(`  노출 ${String(x.노출).padStart(3)} · ${String(x.길이).padStart(3)}자 · ${x.slug}`);
    console.log(`      잘린 뒤: «${잘린뒤(x.제목)}…»`);
  }
}
if (논점잘린것.length) {
  console.log('\n## 잘리면 논점이 사라지는 편 (노출과 무관하게 위험하다)');
  논점잘린것.slice(0, 8).forEach((x) => console.log(`  ${x.slug} — «${잘린뒤(x.제목)}…»`));
}

console.log('\n⛔ 이 자는 세우지 않는다(exit 0). 제목을 고치는 것은 사람 몫이고, 노출 0인 편은 아직 값이 없다.');
console.log('⭐ 고칠 순서는 위 첫 목록 그대로다 — 노출이 큰 것부터.');
