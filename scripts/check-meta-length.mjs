/**
 * 제목·설명이 «검색 결과에서 잘리는지»를 배포 전에 센다.
 *
 * 왜 검사로 두나 (2026-08-27 04:3x · 5번)
 *   8/27 새벽에 제목·설명 길이 때문에 안 눌리는 지면을 656장 고쳤다. 고치는 것으로 끝내면
 *   **다음에 지면을 만들 때 또 생긴다.** 모토 ④ — 「규칙은 문장이 아니라 검사로 둔다.
 *   말로 하는 규칙은 잊힌다. 사람이 기억해서 지키는 구조를 만들지 않는다.」
 *
 * ⭐ **기준선 방식이다.** 지금 있는 초과를 다 없애야 통과하는 검사가 아니다 —
 *   그러면 오늘 당장 배포가 막히고 다른 유닛까지 선다. 지금 수를 기준선으로 적어 두고
 *   **그보다 늘면 깨진다.** 새로 만드는 것은 막고, 있던 것은 천천히 줄인다.
 *   ⛔ 기준선을 «올려서» 통과시키지 않는다. 늘었으면 늘어난 지면을 고친다.
 *   ✅ 줄었으면 기준선을 내려 적는다 — 그래야 되돌아가는 것을 막는다.
 *
 * ⚠ 60자·155자는 구글이 «대략» 보여 주는 길이다. 픽셀 폭으로 자르므로 글자 수는 어림이다.
 *   그래서 이 검사는 「몇 자다」가 아니라 «수가 늘었나»만 본다.
 *
 * 쓰기
 *   node scripts/check-meta-length.mjs              (센다)
 *   node scripts/check-meta-length.mjs --목록       (넘는 지면을 보여 준다)
 *   node scripts/check-meta-length.mjs --기준선갱신  (지금 수를 기준선으로 다시 적는다)
 *   node scripts/check-meta-length.mjs --자가시험
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 제목뽑기, 설명뽑기, 제목한계, 설명한계 } from './find-zero-click-pages.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 기준선길 = path.join(뿌리, 'src/data/kcw-meta-length-baseline.json');

/** 한 폴더 밑의 .html 을 다 훑어 초과를 센다. ⛔ 못 읽은 것은 «없음»으로 따로 센다 */
export function 세기(뿌리경로) {
  const 셈 = { 전체: 0, 긴제목: 0, 긴설명: 0, 없음: 0, 긴제목목록: [], 긴설명목록: [] };
  if (!existsSync(뿌리경로)) return 셈;
  const 훑기 = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { 훑기(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      셈.전체 += 1;
      let 글;
      try { 글 = readFileSync(p, 'utf8'); } catch { 셈.없음 += 1; continue; }
      const t = 제목뽑기(글);
      const s = 설명뽑기(글);
      if (t === null || s === null) { 셈.없음 += 1; continue; }
      const 이름 = path.relative(뿌리경로, p).split(path.sep).join('/');
      if (t.length > 제목한계) { 셈.긴제목 += 1; 셈.긴제목목록.push(`${이름} (${t.length}자)`); }
      if (s.length > 설명한계) { 셈.긴설명 += 1; 셈.긴설명목록.push(`${이름} (${s.length}자)`); }
    }
  };
  훑기(뿌리경로);
  return 셈;
}

/** 기준선과 견준다. ⛔ 「줄었다」와 「늘었다」를 갈라 돌려준다 — 줄어든 것도 알려야 기준선을 내린다 */
export function 견주기(셈, 기준선) {
  /* 🔴 2026-08-27 04:4x — **자가시험이 이걸 잡았다.** 처음엔 없는 기준선을 `?? Infinity` 로
     메웠는데, 그러면 `1 - Infinity` 가 음수라 **깨졌나=false** 가 된다. 즉 기준선 파일이
     사라지면 이 검사가 «조용히 통과»한다. 초록으로 보이는 흠이 가장 나쁘다.
     ⛔ 기준선이 없으면 «못 잰 것»이고, 못 잰 것은 통과가 아니다. */
  const 기준없음 = !기준선
    || !Number.isFinite(기준선.긴제목) || !Number.isFinite(기준선.긴설명);
  if (기준없음) {
    return { 깨졌나: true, 기준없음: true, 제목늘: 0, 설명늘: 0, 줄었나: false };
  }
  const 제목늘 = 셈.긴제목 - 기준선.긴제목;
  const 설명늘 = 셈.긴설명 - 기준선.긴설명;
  return {
    깨졌나: 제목늘 > 0 || 설명늘 > 0,
    기준없음: false,
    제목늘, 설명늘,
    줄었나: 제목늘 < 0 || 설명늘 < 0,
  };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 깨짐 = 0;
  const 본다 = (이름, 참) => { if (참) console.log(`  ✅ ${이름}`); else { console.log(`  ❌ ${이름}`); 깨짐 += 1; } };
  console.log('자가시험 — check-meta-length');
  본다('늘면 깨진다', 견주기({ 긴제목: 5, 긴설명: 0 }, { 긴제목: 4, 긴설명: 0 }).깨졌나 === true);
  본다('같으면 안 깨진다', 견주기({ 긴제목: 4, 긴설명: 2 }, { 긴제목: 4, 긴설명: 2 }).깨졌나 === false);
  본다('줄면 안 깨진다', 견주기({ 긴제목: 2, 긴설명: 0 }, { 긴제목: 4, 긴설명: 0 }).깨졌나 === false);
  본다('줄었으면 «줄었다»고 알린다', 견주기({ 긴제목: 2, 긴설명: 0 }, { 긴제목: 4, 긴설명: 0 }).줄었나 === true);
  본다('설명만 늘어도 깨진다', 견주기({ 긴제목: 0, 긴설명: 9 }, { 긴제목: 0, 긴설명: 8 }).깨졌나 === true);
  /* 🔴 기준선 파일이 없을 때 «통과»시키면 검사가 아무것도 안 하는 채로 초록이 된다.
     첫 회에는 기준선을 만들어야 하고, 만들기 전에는 «깨진» 것으로 본다. */
  본다('기준선이 «없으면» 깨진 것으로 본다', 견주기({ 긴제목: 1, 긴설명: 0 }, {}).깨졌나 === true);
  본다('기준선이 null 이어도 깨진 것으로 본다', 견주기({ 긴제목: 1, 긴설명: 0 }, null).깨졌나 === true);
  본다('기준선 «반쪽»(긴설명만 있음)도 깨진 것으로 본다',
    견주기({ 긴제목: 1, 긴설명: 0 }, { 긴설명: 0 }).깨졌나 === true);
  본다('빈 폴더는 0 이지 못잼이 아니다', (() => {
    const c = 세기(path.join(뿌리, '없는폴더'));
    return c.전체 === 0 && c.긴제목 === 0;
  })());
  console.log(깨짐 === 0 ? `\n✅ 9개 다 통과` : `\n❌ ${깨짐}개 깨짐`);
  process.exit(깨짐 === 0 ? 0 : 1);
}

/* ── 본짓 ─────────────────────────────────────────────── */
const 직접부름 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (직접부름) {
  const 볼곳 = path.join(뿌리, process.argv.find((a) => a.startsWith('--뿌리='))?.split('=')[1] ?? 'dist/wikitip');
  if (!existsSync(볼곳)) {
    console.log(`⚠ ${path.relative(뿌리, 볼곳)} 이 없다 — **못 쟀다**. 먼저 빌드하십시오.`);
    console.log('⛔ 이것을 「초과 0장」으로 읽지 않는다.');
    process.exit(0);
  }
  const 셈 = 세기(볼곳);
  const 기준선 = existsSync(기준선길) ? JSON.parse(readFileSync(기준선길, 'utf8')) : null;

  console.log('# 제목·설명이 검색 결과에서 잘리는가');
  console.log(`  지면 ${셈.전체}장 · 제목 ${제목한계}자 초과 **${셈.긴제목}장** · 설명 ${설명한계}자 초과 **${셈.긴설명}장**`);
  if (셈.없음) console.log(`  ⚠ 제목이나 설명을 «못 읽은» 지면 ${셈.없음}장 — 0 이 아니라 못잼이다`);

  if (process.argv.includes('--목록')) {
    for (const [이름, 목록] of [['제목', 셈.긴제목목록], ['설명', 셈.긴설명목록]]) {
      if (!목록.length) continue;
      console.log(`\n  ── ${이름}이 넘는 것 ${목록.length}장 (앞 25개)`);
      for (const x of 목록.slice(0, 25)) console.log(`     · ${x}`);
    }
  }

  if (process.argv.includes('--기준선갱신') || !기준선) {
    writeFileSync(기준선길, `${JSON.stringify({
      _왜: '이 수보다 늘면 배포 관문이 깨진다. 새로 만드는 지면이 잘리는 것을 막는 자리다.',
      _주의: '⛔ 통과시키려고 이 수를 올리지 않는다. 늘었으면 늘어난 지면을 고친다. 줄었으면 내려 적는다.',
      잰날: process.argv.find((a) => a.startsWith('--날='))?.split('=')[1] ?? '(--날= 로 적으십시오)',
      전체: 셈.전체, 긴제목: 셈.긴제목, 긴설명: 셈.긴설명,
    }, null, 2)}\n`);
    console.log(`\n✅ 기준선을 적었다 — 긴제목 ${셈.긴제목} · 긴설명 ${셈.긴설명}`);
    console.log('   다음부터는 이 수보다 «늘면» 깨진다.');
    process.exit(0);
  }

  const 결 = 견주기(셈, 기준선);
  console.log(`\n  기준선 — 긴제목 ${기준선.긴제목} · 긴설명 ${기준선.긴설명} (잰날 ${기준선.잰날})`);
  if (결.깨졌나) {
    console.log(`\n🔴 **늘었다** — 제목 ${결.제목늘 > 0 ? `+${결.제목늘}` : '0'} · 설명 ${결.설명늘 > 0 ? `+${결.설명늘}` : '0'}`);
    console.log('   새로 만든 지면의 제목이 60자, 설명이 155자를 넘는다. 넘으면 구글이 잘라');
    console.log('   **손님이 누를 까닭이 사라진다.** `--목록` 으로 어느 지면인지 봅니다.');
    console.log('⛔ 기준선을 올려 통과시키지 않는다.');
    process.exit(1);
  }
  if (결.줄었나) {
    console.log(`\n✅ 줄었다 — 제목 ${-결.제목늘} · 설명 ${-결.설명늘}장 만큼.`);
    console.log('   ⭐ `--기준선갱신 --날=YYYY-MM-DD` 로 기준선을 내려 적으십시오. 그래야 되돌아가는 것을 막습니다.');
    process.exit(0);
  }
  console.log('\n✅ 기준선 그대로다 — 새로 잘리는 지면을 만들지 않았다');
}
