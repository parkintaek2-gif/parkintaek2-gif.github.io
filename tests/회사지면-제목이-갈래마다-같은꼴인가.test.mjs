/**
 * 회사지면-제목이-갈래마다-같은꼴인가.test.mjs — **한 갈래를 고치면 나머지도 따라왔나**
 * 실행: node --test tests/회사지면-제목이-갈래마다-같은꼴인가.test.mjs
 *
 * ── 🔴 왜 이 자가 있나 (2026-10-10 · 5번) ────────────────────────────────
 *   10-09 에 대만 회사 지면의 제목에 **종목코드가 빠진 것**을 찾아 고쳤다.
 *   근거는 실측이었다 —
 *   ```
 *     /japan/   3,736장 중 607장이 떴다 (16%)   제목에 코드 있음
 *     /company/ 2,582장 중 324장이 떴다 (13%)   제목에 코드 있음
 *     /taiwan/  1,090장 중   3장이 떴다 (0.3%)  제목에 코드 **없음**
 *   ```
 *   그런데 **10-10 에 재 보니 UAE 가 똑같이 빠져 있었다.** 어제 대만만 고치고 끝낸 것이다.
 *
 *   ⛔ 우리 강령 ⑤ — 「하나를 고치면 인용한 곳까지 따라간다」.
 *     2026-08-07 에도 결함 하나가 인용을 타고 세 곳 더 옮겨가 있었다. 같은 병이다.
 *   ⭐ 말로 「다음엔 네 갈래를 다 보자」고 적어 두면 **반드시 잊힌다.**
 *     그래서 자로 만든다 — 다섯째 갈래가 생겨도 이 자가 먼저 운다.
 *
 * ⛔ 이 자는 「무슨 말을 쓸지」를 정하지 않는다. 갈래마다 검색어 근거가 다르고,
 *   일본만 「earnings results」를 쓰는 것은 평균 8.2위라는 «그 갈래의» 근거가 있어서다.
 *   ✅ 이 자가 재는 것은 **종목코드가 제목에 들어 있는가** 하나뿐이다.
 *     그것은 갈래와 상관없이 늘 옳다 — 손님은 코드로도 찾는다.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 회사 지면을 내는 갈래들. ⛔ 새 나라가 늘면 여기에 더한다 — 안 더하면 아래 자가 운다 */
export const 갈래들 = [
  { 이름: 'japan', 길: 'src/pages/japan/company/[slug].astro' },
  { 이름: 'taiwan', 길: 'src/pages/taiwan/company/[slug].astro' },
  { 이름: 'uae', 길: 'src/pages/uae/company/[slug].astro' },
  { 이름: 'korea', 길: 'src/pages/company/[slug].astro' },
];

/** `const title = ...` 로 시작하는 줄들을 뽑는다 (여러 갈래가 삼항으로 나뉘기도 한다) */
export function 제목줄들(글) {
  const 줄들 = String(글).split(/\r?\n/);
  const 모음 = [];
  for (let i = 0; i < 줄들.length; i++) {
    if (!/^const (title|긴제목|짧은제목)\s*=/.test(줄들[i])) continue;
    /* 삼항으로 다음 줄까지 이어지는 경우가 있다 — 뒤 세 줄까지 함께 본다 */
    모음.push(줄들.slice(i, i + 4).join('\n'));
  }
  return 모음;
}

/** 그 제목 덩이가 종목코드를 쓰나. `${code}` · `${symbol}` · `${티커}` 같은 꼴을 본다 */
export function 코드를쓰나(덩이) {
  return /\$\{\s*(code|symbol|ticker|티커|종목코드)\s*\}/.test(String(덩이));
}

test('회사 지면 제목에 종목코드가 들어 있다 — 갈래마다', async (t) => {
  for (const 갈래 of 갈래들) {
    await t.test(`${갈래.이름} — 제목에 종목코드가 있다`, () => {
      const 전체길 = path.join(뿌리, 갈래.길);
      /* ⛔ 「파일이 없다」를 조용한 초록으로 넘기지 않는다 — 갈래가 옮겨졌으면 알아야 한다 */
      assert.ok(fs.existsSync(전체길),
        `${갈래.길} 이 없습니다. 갈래가 옮겨졌다면 이 자의 목록도 같이 고치십시오 —\n`
        + '  목록이 낡으면 이 자는 「없는 것」을 재면서 초록을 냅니다.');

      const 덩이들 = 제목줄들(fs.readFileSync(전체길, 'utf8'));
      assert.ok(덩이들.length > 0, `${갈래.길} 에서 제목 짓는 줄을 못 찾았습니다`);

      const 빠진것 = 덩이들.filter((d) => !코드를쓰나(d));
      assert.deepEqual(빠진것, [],
        `${갈래.이름} 회사 지면 제목에 종목코드가 없습니다.\n`
        + '※ 2026-10-09 에 대만에서 이것을 고쳤고, 2026-10-10 에 UAE 가 안 따라온 것을\n'
        + '  발견했습니다. 코드는 거의 늘 이미 쥐고 있습니다 — 설명줄이 쓰고 있는지 보십시오.\n'
        + `  빠진 줄: ${빠진것.join(' // ').slice(0, 200)}`);
    });
  }
});

test('⛔ 이 자가 헛돌지 않는다 — 넣어 보고 정말 우는지', async (t) => {
  await t.test('코드를 쓰면 통과한다', () => {
    assert.equal(코드를쓰나('const title = `${nameEn} (${code}) — reported financials`'), true);
    assert.equal(코드를쓰나('const title = `${name} (${symbol}) — reported financials (UAE)`'), true);
  });
  await t.test('🔴 코드를 안 쓰면 잡는다 — 10-10 에 실제로 이랬다', () => {
    assert.equal(코드를쓰나('const title = `${name} — reported financials (UAE)`'), false,
      '이것이 오늘 UAE 에서 실제로 걸린 꼴입니다. 못 잡으면 이 자는 도장일 뿐입니다');
  });
  await t.test('설명줄에만 코드가 있는 것은 «제목»으로 안 센다', () => {
    /* ⚠ 바로 이것이 함정이었다 — 설명줄에는 있어서 「쥐고 있다」로 보였다 */
    const 글 = ['const title = `${name} — reported financials (UAE)`',
      'const 설명줄 = `${name} (${symbol}) reported AED ...`'].join('\n');
    const 덩이들 = 제목줄들(글);
    assert.equal(덩이들.length, 1, '제목 줄만 뽑아야 합니다');
    /* 뒤 세 줄을 함께 보므로 설명줄이 딸려 온다 — 그래도 «제목»이 아님을 알아야 한다 */
    assert.match(덩이들[0], /^const title/, '첫 줄이 제목 줄이어야 합니다');
  });
  await t.test('삼항으로 나뉜 제목도 뽑는다', () => {
    const 글 = ['const 긴제목 = 있나', "  ? `${nameEn} (${code}) earnings results`",
      "  : `${nameEn} (${code}) stock — profile`;"].join('\n');
    const 덩이들 = 제목줄들(글);
    assert.equal(덩이들.length, 1);
    assert.equal(코드를쓰나(덩이들[0]), true, '삼항 양쪽을 다 봐야 합니다');
  });
});
