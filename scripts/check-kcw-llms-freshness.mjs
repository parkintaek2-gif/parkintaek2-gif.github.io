#!/usr/bin/env node
/**
 * check-kcw-llms-freshness.mjs — **llms.txt 가 조용히 낡는 것을 막는다.**
 *
 * ── 🔴 왜 만드나 (2026-08-30 · 5번) ────────────────────────
 * 오늘 두 가지를 겪었다.
 *   ① kculturewire.com/llms.txt 가 **아예 없었다**(404). 다른 두 사이트는 있었다.
 *   ② 3번도 같은 날 100yearmap 의 llms.txt 에서 **여섯 편이 빠져 있는 것**을 찾았다.
 *      「신설 3편과는 별개, 더 오래된 누락」이었다 — 즉 **한 번 채워도 다시 샌다.**
 *
 * ⭐ 그러니 채우는 것으로 끝내지 않는다. **다시 새는지 지키는 자**를 같이 둔다.
 *   회사 강령 — 「④ 규칙은 문장이 아니라 검사로 둔다. 사람이 기억해서 지키는 구조를 만들지 않는다」
 *
 * ── 무엇을 재나 ──────────────────────────────────────────────
 * ① 안내문에 적힌 주소가 **실제로 지어졌나** (죽은 줄이 없나)
 * ② 우리 «큰 지면»(hub) 가운데 안내문에 **안 들어간 것**이 있나
 * ③ 낱장 무리의 «수»가 실제와 맞나 (550편이라 적어 놓고 600편이면 낡은 것이다)
 *
 * ⛔ 못 재면 「못 쟀다」고 하고 **1 로 죽지 않는다** — dist 가 없는 것은 흠이 아니다.
 * ⛔ 「빠진 것이 있다」와 「죽은 줄이 있다」를 **갈라서** 센다. 약이 다르다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-llms-freshness.mjs --자가시험
 *   node scripts/check-kcw-llms-freshness.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 지어진곳 = path.join(뿌리, 'dist/wikitip');
const 자료길 = path.join(뿌리, 'src/data/kcw-llms.json');

/**
 * 안내문에 «있어야 하는데 없는» 큰 지면을 고른다.
 * ⭐ 큰 지면이란 — 낱장(`/title/x`)이 아니라 «한 무리를 이끄는» 지면이다.
 * ⛔ 지면 2,700장을 다 넣으라는 말이 아니다. 그러면 안내문이 아니라 사이트맵이 된다.
 */
export function 빠진큰지면(지어진것들, 적힌길들, 봐줄것 = new Set()) {
  const 적힌 = new Set(적힌길들 ?? []);
  return (지어진것들 ?? [])
    .filter((f) => f.endsWith('.html'))
    .map((f) => `/${f.replace(/\.html$/, '')}`)
    .filter((길) => !적힌.has(길) && !봐줄것.has(길))
    .sort();
}

/** 안내문에 적혔는데 «지면이 없는» 줄. ⛔ 이것은 손님을 404 로 보내는 것이라 더 나쁘다 */
export function 죽은줄(적힌길들, 지어진것들) {
  const 있는것 = new Set((지어진것들 ?? [])
    .filter((f) => f.endsWith('.html'))
    .map((f) => `/${f.replace(/\.html$/, '')}`));
  있는것.add('/');
  return (적힌길들 ?? []).filter((길) => !있는것.has(길)).sort();
}

/** 적어 놓은 수와 실제 수가 얼마나 벌어졌나. ⛔ 못 세면 null — 0 이 아니다 */
export function 수가벌어졌나(적은수, 실제수, 봐줄몫 = 0.05) {
  if (!Number.isFinite(적은수) || !Number.isFinite(실제수)) return null;
  if (실제수 === 0) return 적은수 !== 0;
  return Math.abs(적은수 - 실제수) / 실제수 > 봐줄몫;
}

/* ⚠ 안내문에 «일부러» 안 넣는 것들 — 낱장 목차·법률 지면·기계용 파일 */
export const 봐줄것 = new Set([
  '/404', '/privacy', '/terms', '/refund', '/contact', '/subscribe', '/for-industry',
  '/article', '/title', '/person', '/group', '/school', '/market', '/week', '/firm',
  '/section', '/tag', '/video', '/from', '/year', '/born-in', '/born-on', '/star-sign',
  '/index',
]);

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('안내문에 없는 큰 지면을 찾아낸다',
    빠진큰지면(['a.html', 'b.html'], ['/a']).join() === '/b');
  검('봐줄 것은 안 센다',
    빠진큰지면(['a.html', '404.html'], ['/a'], new Set(['/404'])).length === 0);
  검('⛔ html 이 아닌 것은 안 센다',
    빠진큰지면(['a.html', 'x.txt'], ['/a']).length === 0);
  검('⛔ 빈 값에 안 죽는다', 빠진큰지면(null, null).length === 0);

  검('🔴 적혔는데 지면이 없는 줄을 찾아낸다 — 손님을 404 로 보낸다',
    죽은줄(['/a', '/없는것'], ['a.html']).join() === '/없는것');
  검('홈(/)은 죽은 줄이 아니다', 죽은줄(['/'], ['a.html']).length === 0);
  검('⛔ 빈 값에 안 죽는다', 죽은줄(null, null).length === 0);

  검('수가 크게 벌어지면 참', 수가벌어졌나(550, 700) === true);
  검('조금 벌어진 것은 봐준다', 수가벌어졌나(550, 555) === false);
  검('⛔ 못 세면 null 이지 0 이 아니다',
    수가벌어졌나(null, 550) === null && 수가벌어졌나(550, undefined) === null);
  검('실제가 0인데 적어 놨으면 벌어진 것', 수가벌어졌나(5, 0) === true);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ llms.txt 지킴이 — 자가시험 11 통과');
  process.exit(0);
}

if (내가실행됐다) {
  if (!fs.existsSync(자료길)) {
    console.log('⬜ **못 쟀다** — src/data/kcw-llms.json 이 없다.');
    console.log('   `node scripts/build-kcw-llms.mjs` 를 먼저 돌린다.');
    process.exit(0);          /* ⛔ 못 잰 것으로 죽지 않는다 */
  }
  if (!fs.existsSync(지어진곳)) {
    console.log('⬜ **못 쟀다** — dist/wikitip 이 없다(빌드 전이다). 흠이 아니다.');
    process.exit(0);
  }

  const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 적힌길들 = 자료.갈래들.flatMap((s) => s.줄들.map((r) => r.길));
  const 지어진것들 = fs.readdirSync(지어진곳);

  const 죽은 = 죽은줄(적힌길들, 지어진것들);
  const 빠진 = 빠진큰지면(지어진것들, 적힌길들, 봐줄것);

  console.log(`llms.txt 지킴이 — 적힌 줄 ${적힌길들.length} · 지어진 큰 지면 `
    + `${지어진것들.filter((f) => f.endsWith('.html')).length}`);
  console.log(`  안내문을 지은 날 ${String(자료.지은날).slice(0, 10)}`);

  /* 낱장 수가 낡았나 */
  const 센다 = (하위) => {
    try { return fs.readdirSync(path.join(지어진곳, 하위)).filter((f) => f.endsWith('.html')).length; }
    catch { return null; }
  };
  const 낡은수 = [];
  for (const [이름, 하위] of [['작품', 'title'], ['사람', 'person'], ['그룹', 'group'],
    ['학교', 'school'], ['나라', 'market'], ['주', 'week'], ['회사', 'firm']]) {
    const 판정 = 수가벌어졌나(자료.셈?.[이름], 센다(하위));
    if (판정 === true) 낡은수.push(`${이름}: 적힌 것 ${자료.셈?.[이름]} · 실제 ${센다(하위)}`);
    if (판정 === null) 낡은수.push(`${이름}: ⚠ **못 쟀다**`);
  }

  let 흠 = 0;
  if (죽은.length) {
    흠 += 1;
    console.log(`\n🔴 **죽은 줄 ${죽은.length}개** — 안내문에 적혔는데 그 지면이 없다`);
    console.log('   ⛔ AI 와 손님을 404 로 보낸다. 빠진 것보다 나쁘다.');
    for (const 길 of 죽은) console.log(`     ${길}`);
  } else {
    console.log('\n✅ 죽은 줄 없다 — 적힌 주소가 다 살아 있다');
  }

  if (빠진.length) {
    흠 += 1;
    console.log(`\n⚠ **안내문에 안 들어간 큰 지면 ${빠진.length}장**`);
    console.log('   ⭐ 다 넣으라는 말이 아니다 — 넣을 것을 «고르고», 안 넣을 것은 봐줄것 에 적는다.');
    console.log('   ⛔ 그래야 다음에 이 자가 또 같은 것을 울리지 않는다.');
    for (const 길 of 빠진.slice(0, 40)) console.log(`     ${길}`);
    if (빠진.length > 40) console.log(`     … 그리고 ${빠진.length - 40}장 더`);
  } else {
    console.log('✅ 빠진 큰 지면 없다');
  }

  if (낡은수.length) {
    흠 += 1;
    console.log(`\n⚠ **낱장 수가 안 맞는 것 ${낡은수.length}**`);
    for (const s of 낡은수) console.log(`     ${s}`);
    console.log('   → `node scripts/build-kcw-llms.mjs` 를 다시 돌린다');
  } else {
    console.log('✅ 낱장 수가 실제와 맞다');
  }

  console.log(흠 ? '\n⛔ 위를 고친다.' : '\n✅ llms.txt 가 실물과 맞다.');
  process.exit(죽은.length ? 1 : 0);   /* 죽은 줄만 «막는» 흠이다 */
}
