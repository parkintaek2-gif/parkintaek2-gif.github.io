/**
 * data지면이-사이트맵에-다-있나.test.mjs — **지면을 내고 사이트맵에 안 넣는 사고를 막는다**
 * 실행: node --test tests/data지면이-사이트맵에-다-있나.test.mjs
 *
 * ── 🔴🔴 왜 이 자가 있나 — **같은 사고가 여섯 번 났다** ────────────────────
 *   `src/pages/sitemap-[section].xml.ts` 의 `/data/` 목록은 **손으로 채운다.**
 *   지면을 만들어도 그 목록에 안 넣으면 라이브는 200 인데 검색엔 없는 채로 나간다.
 *   그 파일 주석에 사고 기록이 이렇게 쌓여 있다 —
 *   ```
 *     2026-09-11 · 5번   bond-boards · fund-shelf        「만들고 여기 넣는 것을 잊었다」
 *     2026-09-12 · 4번   kospi-weights 등 넷             「수요를 확인하고 만든 지면이 안 보이는 채로」
 *     2026-09-18 · 6번   신용등급·외국인보유 등 다섯       「사이트맵이 11줄로 보인 진짜 까닭」
 *     2026-09-20 · 1번   japan-listed-companies          (이때는 같은 커밋에서 넣었다)
 *     2026-10-04 · 2번   10/3~10/4 에 낸 여섯 + 하나 더  「다음에는 같은 커밋에서 고친다」
 *     2026-10-10 · 5번   never-traded                    ← **여섯째. 내가 냈다**
 *   ```
 *   ⛔ 그 파일에 「**같은 커밋에서 이 목록에 넣는다**」가 다섯 번 적혀 있다.
 *     그런데도 여섯 번째가 났다. **말로 적는 것으로는 안 막힌다.**
 *
 * ⭐ 우리 강령 ④ — 「규칙은 문장이 아니라 검사로 둔다. 사람이 기억해서 지키는 구조를
 *   만들지 않는다」. 이 자가 그 자리다.
 *
 * ⛔ 이 자는 「사이트맵에 넣어라」만 말한다. 우선순위·갱신주기는 사람이 정한다 —
 *   지면마다 다르고, 자가 정할 일이 아니다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 지면방 = path.join(뿌리, 'src', 'pages', 'data');
const 사이트맵 = path.join(뿌리, 'src', 'pages', 'sitemap-[section].xml.ts');

/**
 * `/data/` 밑의 «손님이 볼 수 있는 지면» 이름들.
 * ⛔ `.astro` 만 센다 — `.csv.ts` · `.json.ts` 같은 내려받기 길은 지면이 아니다.
 * ⛔ `index.astro` 는 차림표라 따로 다룬다(사이트맵의 다른 칸에 있다).
 * ⛔ `[slug].astro` 같은 틀은 주소가 하나가 아니다 — 여기서 안 센다.
 */
export function 지면이름들(파일들) {
  return (파일들 ?? [])
    .filter((n) => n.endsWith('.astro'))
    .map((n) => n.replace(/\.astro$/, ''))
    .filter((n) => n !== 'index')
    .filter((n) => !n.includes('[') && !n.includes(']'))
    .sort();
}

/** 사이트맵 코드에서 `/data/…` 주소를 뽑는다 */
export function 사이트맵에적힌것(글) {
  return [...new Set([...String(글).matchAll(/['"]\/data\/([a-z0-9-]+)['"]/gi)].map((m) => m[1]))].sort();
}

test('/data/ 지면이 사이트맵 목록에 다 들어 있다', async (t) => {
  /* ⛔ 「파일이 없다」를 조용한 초록으로 넘기지 않는다 */
  assert.ok(fs.existsSync(지면방), `${지면방} 이 없습니다 — 이 자의 길이 낡았습니다`);
  assert.ok(fs.existsSync(사이트맵), `${사이트맵} 이 없습니다 — 이 자의 길이 낡았습니다`);

  const 지면 = 지면이름들(fs.readdirSync(지면방));
  const 적힌것 = 사이트맵에적힌것(fs.readFileSync(사이트맵, 'utf8'));

  await t.test('잴 것이 있다 — 지면을 한 장도 못 찾았으면 이 자가 고장난 것이다', () => {
    assert.ok(지면.length > 5,
      `/data/ 에서 지면을 ${지면.length}장밖에 못 찾았습니다. 이 자가 헛도는 것은 아닌지 보십시오.`);
  });

  await t.test('🔴 사이트맵에 빠진 지면이 없다', () => {
    const 빠진것 = 지면.filter((n) => !적힌것.includes(n));
    assert.deepEqual(빠진것, [],
      '라이브에는 뜨지만 **사이트맵에 없는** 지면이 있습니다 — 구글이 못 찾습니다.\n'
      + `  빠진 것: ${빠진것.join(' · ')}\n`
      + '※ 같은 사고가 2026-09-11 · 09-12 · 09-18 · 10-04 · 10-10 에 났습니다.\n'
      + '  src/pages/sitemap-[section].xml.ts 의 `/data/` 목록에 같은 커밋에서 넣으십시오.\n'
      + '  (우선순위·갱신주기는 지면마다 다릅니다 — 이웃 줄을 보고 정하십시오)');
  });

  await t.test('⚠ 사이트맵에만 있고 지면이 없는 것도 없다 — 404 를 구글에 알리게 된다', () => {
    const 없는것 = 적힌것.filter((n) => !지면.includes(n));
    assert.deepEqual(없는것, [],
      '사이트맵이 **없는 지면**을 가리키고 있습니다 — 구글에 404 를 알리는 꼴입니다.\n'
      + `  가리키는데 없는 것: ${없는것.join(' · ')}\n`
      + '※ 지면을 지우거나 이름을 바꿨다면 사이트맵 목록에서도 빼십시오.');
  });
});

test('⛔ 이 자가 헛돌지 않는다 — 넣어 보고 정말 우는지', async (t) => {
  await t.test('🔴 빠진 지면을 잡는다 — 10-10 에 실제로 이랬다', () => {
    const 지면 = 지면이름들(['never-traded.astro', 'krx-open-api-fields.astro']);
    const 적힌것 = 사이트맵에적힌것("{ loc: '/data/krx-open-api-fields', priority: '0.9' },");
    assert.deepEqual(지면.filter((n) => !적힌것.includes(n)), ['never-traded'],
      '이것이 오늘 실제로 걸린 꼴입니다. 못 잡으면 이 자는 도장일 뿐입니다');
  });
  await t.test('⛔ 내려받기 길(.csv.ts)을 지면으로 세지 않는다', () => {
    assert.deepEqual(지면이름들(['korea-bond-concentration.csv.ts', 'a.astro']), ['a']);
  });
  await t.test('⛔ 차림표(index)와 틀([slug])은 안 센다', () => {
    assert.deepEqual(지면이름들(['index.astro', '[slug].astro', 'real.astro']), ['real']);
  });
  await t.test('작은따옴표·큰따옴표를 다 읽는다', () => {
    assert.deepEqual(사이트맵에적힌것(`'/data/aaa' "/data/bbb"`), ['aaa', 'bbb']);
  });
  await t.test('/data/ 가 아닌 주소는 안 줍는다', () => {
    assert.deepEqual(사이트맵에적힌것(`'/japan/company/x' '/data/ccc'`), ['ccc']);
  });
});
