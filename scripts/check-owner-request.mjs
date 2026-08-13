#!/usr/bin/env node
/**
 * **사장님께 올리기 전에 히스토리를 찾는 자** — 2번 지시(8/13)를 자물쇠로 만든 것.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 *   8/13 에 제가 Riot(App 866800) 을 사장님 손 목록에 올렸습니다.
 *   그런데 사장님은 **「승인될 때까지 기다린다」로 이미 정하셨던** 건이었습니다.
 *   같은 날 wiki-tip.com 도 **이미 접은 도메인**인데 「연결해 달라」고 올라갔습니다.
 *   🔴 **사장님 시간을 두 번 쓰게 하는 것이 우리가 하는 실수 중 제일 나쁩니다.**
 *
 * ── 이 자가 하는 일 ───────────────────────────────────────────
 *   내가 쓴 [요청] 글을 받아, 거기 나오는 **이름씨를 메모에서 찾아본다.**
 *   이미 「기다린다 · 접었다 · 안 한다 · 거둡니다」로 결론난 낱말이 걸리면 **막는다.**
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **막힌 것과 있으면 좋은 것을 갈라 적게 한다.** 섞으면 급하지 않은 것이 급해 보인다.
 * ⚠ 이 자는 대신 판단하지 않는다. **찾아 보여 주고 사람이 정한다.**
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 메모 = 'docs/세션간-메모.md';

/** 이미 끝난 것을 뜻하는 말들 — 이 말과 함께 나오면 다시 올리지 않는다 */
export const 끝난말 = ['거둡니다', '거둔다', '기다리기로', '기다린다', '접었', '접은',
  '없앰', '없앤다', '안 한다', '하지 않는다', '끝난 문제', '올리지 마'];

/** 요청문에서 찾아볼 이름씨 — 영문·숫자 덩이와 도메인 */
export function 이름씨뽑기(글) {
  const 것 = new Set();
  for (const m of 글.matchAll(/\b[A-Za-z][A-Za-z0-9-]{2,}(?:\.[A-Za-z]{2,})+\b/g)) 것.add(m[0]);
  for (const m of 글.matchAll(/\b[A-Z][A-Za-z]{2,}\b/g)) 것.add(m[0]);
  for (const m of 글.matchAll(/\b\d{5,}\b/g)) 것.add(m[0]);
  /* 너무 흔해 걸러 낼 말 — 걸리면 온 메모가 다 걸린다 */
  for (const 흔한 of ['API', 'KST', 'The', 'This', 'Wikipedia', 'Wikidata', 'Personal']) 것.delete(흔한);
  return [...것];
}

/** 그 낱말이 메모에서 「끝난 것」으로 다뤄진 적이 있나 */
export function 끝난적있나(줄들, 낱말) {
  const 걸린 = [];
  for (const 줄 of 줄들) {
    if (!줄.includes(낱말)) continue;
    const 말 = 끝난말.find((w) => 줄.includes(w));
    if (말) 걸린.push({ 낱말, 표시: 말, 줄: 줄.trim().slice(0, 120) });
  }
  return 걸린;
}

/** ⛔ 막힌 것인지 있으면 좋은 것인지 적었나 */
export function 갈라적었나(글) {
  return /막혔|막힘|blocked|있으면 좋|급하지 않|급한 것이 아니/.test(글);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('이름씨 — 도메인을 잡는다', 이름씨뽑기('wiki-tip.com 을 연결').includes('wiki-tip.com'), true);
  재본다('이름씨 — 앱 번호를 잡는다', 이름씨뽑기('App 866800 상태').includes('866800'), true);
  재본다('이름씨 — 대문자 낱말을 잡는다', 이름씨뽑기('Riot 키를 새로').includes('Riot'), true);
  재본다('이름씨 — 너무 흔한 말은 뺀다', 이름씨뽑기('API 키').includes('API'), false);
  재본다('🔴 끝난적있나 — 「거둡니다」가 붙은 줄을 잡는다',
    끝난적있나(['Riot 도 거둡니다 — 이미 정한 건입니다'], 'Riot').length, 1);
  재본다('🔴 끝난적있나 — 「기다리기로」도 잡는다',
    끝난적있나(['riot은 승인 될 때까지 기다리기로 했잖아'], 'riot')[0].표시, '기다리기로');
  재본다('끝난적있나 — 그냥 언급은 안 잡는다',
    끝난적있나(['Riot 자료를 오늘 받았다'], 'Riot').length, 0);
  재본다('갈라적었나 — 막혔다고 쓰면 참', 갈라적었나('이건 막혔습니다'), true);
  재본다('갈라적었나 — 있으면 좋다고 써도 참', 갈라적었나('있으면 좋습니다'), true);
  재본다('⛔ 갈라적었나 — 안 적으면 거짓', 갈라적었나('키를 새로 뽑아 주십시오'), false);
  console.log(`사장님 손 검사 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 글길 = process.argv[2];
  if (!글길) {
    console.error('쓰는 법 — node scripts/check-owner-request.mjs <요청문 파일>');
    console.error('⚠ 사장님 손 목록에 올릴 글을 **쓰고 나서, 붙이기 전에** 돌린다.');
    process.exit(2);
  }
  if (!fs.existsSync(글길)) { console.error(`⛔ 없다 — ${글길}`); process.exit(1); }
  if (!fs.existsSync(메모)) { console.error(`⛔ 없다 — ${메모}`); process.exit(1); }

  const 글 = fs.readFileSync(글길, 'utf8');
  const 줄들 = fs.readFileSync(메모, 'utf8').split(/\r?\n/);
  const 이름씨 = 이름씨뽑기(글);
  console.log(`찾아볼 이름씨 ${이름씨.length}개 — ${이름씨.join(' · ')}\n`);

  let 막힌것 = 0;
  for (const 낱 of 이름씨) {
    const 걸린 = 끝난적있나(줄들, 낱);
    if (!걸린.length) continue;
    막힌것 += 1;
    console.error(`🔴 「${낱}」 — 이미 끝난 것으로 다뤄진 적이 있다 (${걸린.length}줄)`);
    for (const g of 걸린.slice(-2)) console.error(`     [${g.표시}] ${g.줄}`);
  }

  if (!갈라적었나(글)) {
    console.error('\n⛔ **막힌 것인지 있으면 좋은 것인지 안 적혀 있다.**');
    console.error('   섞어 올리면 급하지 않은 것이 급해 보인다. 한 줄을 넣어라.');
    막힌것 += 1;
  }

  if (막힌것) {
    console.error(`\n⛔ **올리지 않는다.** ${막힌것}건을 먼저 본다.`);
    process.exit(1);
  }
  console.log('✅ 히스토리에 끝난 것으로 나온 낱말이 없고, 막힘 여부도 적혀 있다.');
}
