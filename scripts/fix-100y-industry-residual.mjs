#!/usr/bin/env node
/**
 * 업종 축에서 **업종이 아닌 칸**을 `자료` 밖으로 옮긴다.
 *
 *   node scripts/fix-100y-industry-residual.mjs --보기만
 *   node scripts/fix-100y-industry-residual.mjs
 *
 * ## 🔴 왜 (2026-08-08 23:4x · 8번이 찾고 2번이 3번에게 판정을 넘겼다)
 *
 *   8번 — *「`BIZ_NO미존재사업장` 1,377,756명(축의 22%). **업종이 아니라 사업자등록번호가
 *   없는 사업장**을 담는 칸이다. 넣고 세면 중앙값이 **40만원 밀린다**」*
 *
 * ## 판정 — **지우지 않는다. 다만 `자료` 밖으로 낸다**
 *
 *   ```
 *   ⛔ 지우면    1,645,795명이 있었다는 사실이 사라진다. 파일의 22%가 「업종을 모른다」는 것도 사실이다
 *   ⛔ 표시만 하면 쓰는 사람이 **그 표시를 기억해야** 한다 — 오늘 배운 말로, 그건 그냥 문장이다
 *   ✅ 자료 밖으로 내면  `자료` 를 도는 사람은 **틀릴 수가 없다.** 구조가 규칙이 된다
 *   ```
 *
 *   ⭐ 오늘 우리가 배운 것과 같은 꼴이다 —
 *     *「안 불리는 검사는 그냥 문장이다」* → 기억에 기대지 말고 **구조로 막는다.**
 *
 * ## 🔴 8번이 한 칸을 놓쳤고, 파일도 셋이었다
 *
 *   ```
 *   8번이 짚은 것   BIZ_NO미존재사업장 (1,377,756명)
 *   ⛔ 같이 있던 것  「해당없음」 (268,039명) — 이것도 업종이 아니다
 *   ⛔ 그리고 파일   industry-axis 말고 industry-size-cross · industry-region-cross 에도 같은 두 칸
 *   ```
 *
 *   ⚠ 한 곳만 고치면 **나머지 둘로 셈하는 사람이 여전히 밀린 값을 얻는다.**
 */
import fs from 'node:fs';
import path from 'node:path';

const 여기 = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const 자료방 = path.join(여기, 'src/data/100yearmap');
const 볼파일 = ['industry-axis.json', 'industry-size-cross.json', 'industry-region-cross.json'];

/** 업종이 아닌 칸인가. ⛔ 이름을 손으로 나열하지 않는다 — 꼴로 가른다 */
export const 업종아닌칸인가 = (이름) =>
  /^(해당없음|BIZ_NO미존재사업장|미분류|미기재|기타없음)$/.test(String(이름 ?? '').trim());

/** 가운데값. ⚠ 안에서 정렬한다 */
export const 중간값 = (a) => {
  const b = [...a].filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!b.length) return null;
  const m = b.length >> 1;
  return b.length % 2 ? b[m] : Math.round((b[m - 1] + b[m]) / 2);
};

if (process.argv.includes('--자가시험')) {
  const 본 = [
    ['해당없음을 잡는다', () => 업종아닌칸인가('해당없음') === true],
    ['BIZ_NO 를 잡는다', () => 업종아닌칸인가('BIZ_NO미존재사업장') === true],
    ['진짜 업종은 안 잡는다', () => 업종아닌칸인가('고용 알선업') === false],
    ['비슷한 이름은 안 잡는다', () => 업종아닌칸인가('기타 개인 서비스업') === false],
    ['앞뒤 공백은 봐준다', () => 업종아닌칸인가(' 해당없음 ') === true],
    ['null 이어도 안 죽는다', () => 업종아닌칸인가(null) === false],
    ['중간값 홀수', () => 중간값([3, 1, 2]) === 2],
    ['중간값 짝수', () => 중간값([1, 2, 3, 4]) === 3],
    ['중간값이 안에서 정렬한다', () => 중간값([10, 1, 2]) === 2],
    ['빈 배열', () => 중간값([]) === null],
  ];
  let 진 = 0;
  for (const [이름, f] of 본) { let ok = false; try { ok = f() === true; } catch { ok = false; } if (!ok) { console.log(`  ⛔ ${이름}`); 진++; } }
  console.log(`자가시험 ${본.length}개 · 실패 ${진}개`);
  process.exit(진 ? 1 : 0);
}

const 보기만 = process.argv.includes('--보기만');
let 옮긴수 = 0;

for (const f of 볼파일) {
  const p = path.join(자료방, f);
  if (!fs.existsSync(p)) { console.log(`⬜ 없다 — ${f}`); continue; }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const 자료 = j.자료 ?? [];
  const 뺄것 = 자료.filter((x) => 업종아닌칸인가(x.업종));
  if (!뺄것.length) { console.log(`✅ ${f} — 뺄 것 없다 (칸 ${자료.length})`); continue; }

  const 전중앙 = 중간값(자료.map((x) => x.월임금));
  const 남길것 = 자료.filter((x) => !업종아닌칸인가(x.업종));
  const 후중앙 = 중간값(남길것.map((x) => x.월임금));
  const 사람 = 뺄것.reduce((a, x) => a + (x.인원 ?? 0), 0);

  console.log(
    `${보기만 ? '⬜' : '✅'} ${f} — 칸 ${자료.length} → ${남길것.length} · 뺀 사람 ${사람.toLocaleString()}명` +
      (전중앙 != null && 후중앙 != null
        ? ` · 월임금 가운데값 ${전중앙.toLocaleString()} → ${후중앙.toLocaleString()}원 (${(후중앙 - 전중앙 >= 0 ? '+' : '') + (후중앙 - 전중앙).toLocaleString()})`
        : ''),
  );
  for (const x of 뺄것) console.log(`     · ${x.업종} ${(x.인원 ?? 0).toLocaleString()}명`);

  if (보기만) continue;

  j.자료 = 남길것;
  j.업종아닌칸 = {
    '⛔무엇': '업종이 아니다. **업종끼리 견주는 셈에 넣지 않는다.**',
    왜여기: '지우면 「이만한 사람이 업종을 모른 채 있다」는 사실이 사라진다. 그래서 안 지우고 `자료` 밖으로 냈다',
    '⚠쓰는법': '`자료` 를 도는 셈에는 안 들어간다. 이 칸을 쓰려면 **일부러 여기서 꺼내야** 한다',
    찾은이: '8번(2026-08-08 22:3x) — BIZ_NO미존재사업장. 「해당없음」과 다른 파일 둘은 3번이 이어서 찾았다',
    옮긴때: '2026-08-08 23:4x',
    칸: 뺄것.map((x) => ({ ...x })),
  };
  fs.writeFileSync(p, JSON.stringify(j, null, 1) + '\n', 'utf8');
  옮긴수 += 뺄것.length;
}

console.log(보기만 ? '\n⬜ 보기만 했다' : `\n✅ 옮긴 칸 ${옮긴수}개`);
