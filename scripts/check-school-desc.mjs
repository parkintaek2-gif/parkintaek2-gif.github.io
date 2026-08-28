#!/usr/bin/env node
/**
 * check-school-desc.mjs — **학교 낱장의 설명문이 「우리만 가진 수」를 말하는지 잰다.**
 *
 * ── 🔴 왜 생겼나 ─────────────────────────────────────────────
 * 2026-08-29, AI 가 어느 지면을 인용하는지 쟀더니(`measure-ai-citations.mjs`)
 * 28일 21세션 중 **10 이 3번(백년지도)의 학교·대학 낱장**이었고 **내 학교 낱장은 0** 이었다.
 * 설명문을 견주니 차이가 뚜렷했다 —
 *
 * ```
 *   3번  「학급당 14.1명 · 학업중단 5.7% · 1년 뒤 83.1%」  ← 「이 학교가 어떤 곳인가」에 답한다
 *   5번  「48명이 이 학교에서 나왔다」                     ← 목록의 «크기»만 말한다
 * ```
 * ⛔ 「이 학교 출신 스타가 누구냐」는 위키피디아가 이미 답한다 — 우리가 이길 자리가 아니다.
 * ⭐ 우리가 «혼자» 가진 수는 넷플릭스 도달이다. 그것을 설명문에 넣었고, 이 자가 그것을 지킨다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 도달을 «못 잰» 학교의 설명문에 도달 수가 들어가면 실패다 — 지어낸 것이다.
 * ⛔ 설명문이 구글이 자르는 길이(155자)를 넘으면 실패다.
 * ⭐ 도달을 «잰» 학교는 설명문에 그 수가 «반드시» 있어야 한다 — 넣어 놓고 안 쓰면 뜻이 없다.
 *
 * 쓰는 법  node scripts/check-school-desc.mjs
 *          node scripts/check-school-desc.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 구글이 설명을 자르는 자리 */
export const 설명바닥 = 155;
/** 제목을 자르는 자리 */
export const 제목바닥 = 60;

/** 지면이 지을 설명문을 «자와 같은 셈»으로 미리 짓는다 */
export function 설명짓기(사람수, 학교이름, 도달, 적힌사람, 명부, 적게 = null) {
  const 수 = (n) => Number(n).toLocaleString('en-US');
  /* ① 5명 이상 — 가운데값을 말한다 */
  if (도달 && Number.isFinite(도달.가운데나라수)) {
    return `${수(사람수)} Korean stars studied at ${학교이름}. Their work reached a median of `
      + `${도달.가운데나라수} countries on Netflix, measured over ${수(도달.사람수)} of them.`;
  }
  /* ② 1~4명 — 가운데값은 «안» 말한다. 세는 것만 말한다. ⭐ 스타 이름이 들어간다 */
  if (적게?.가장넓은사람?.이름 && Number.isFinite(적게?.가장넓은사람?.가장넓은나라수)) {
    return `${수(사람수)} Korean stars studied at ${학교이름}. Of the ${적게.사람수} we could measure, `
      + `${적게.가장넓은사람.이름} travelled furthest — ${적게.가장넓은사람.가장넓은나라수} countries on Netflix.`;
  }
  /* ③ 한 명도 못 재었다 — 지어내지 않는다 */
  return `${수(사람수)} Korean actors and singers studied at `
    + `${학교이름}. Wikidata records a school for ${수(적힌사람)} of ${수(명부)} people.`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, ok) => { if (ok) 통 += 1; else 실.push(이름); };

  const 잰것 = 설명짓기(48, 'Ewha Womans University', { 가운데나라수: 68, 사람수: 5 }, 4535, 9249);
  const 못잰것 = 설명짓기(48, 'Ewha Womans University', null, 4535, 9249);

  검('⭐ 도달을 잰 학교는 그 수를 말한다', 잰것.includes('68 countries'));
  검('⭐ 몇 사람을 재서 나온 수인지도 말한다', 잰것.includes('over 5 of them'));
  검('⛔ 못 잰 학교에 도달 수를 «안» 넣는다',
    !/countries on Netflix/.test(못잰것) && 못잰것.includes('Wikidata'));
  검('⛔ 도달이 숫자가 아니면 못 잰 것으로 다룬다',
    !/countries on Netflix/.test(설명짓기(48, 'X', { 가운데나라수: null }, 1, 2)));
  검('학교 이름이 들어간다', 잰것.includes('Ewha Womans University'));
  검('사람 수가 앞에 온다 — 손님이 치는 말 순서다', /^48 Korean stars/.test(잰것));
  검('수에 쉼표를 넣는다', 못잰것.includes('4,535'));

  /** ⛔ 길이를 재서 못박는다 — 잘리면 뒤의 수가 안 보인다 */
  검('⭐ 잰 학교 설명이 155자 안이다', 잰것.length <= 설명바닥);
  검('⭐ 못 잰 학교 설명도 155자 안이다', 못잰것.length <= 설명바닥);
  /* ⭐ [2026-08-29] 적게 잰 학교도 버리지 않는다 — 셋째 갈래 */
  const 적게것 = 설명짓기(75, 'Yonsei University', null, 4535, 9249,
    { 사람수: 3, 가장넓은사람: { 이름: 'Park Gyu-young', 가장넓은나라수: 59 } });
  검('⭐⭐ 적게 잰 학교는 «몇 명을 재었는지»를 말한다', 적게것.includes('Of the 3 we could measure'));
  검('⭐⭐ 그리고 스타 이름이 들어간다 — 손님이 치는 말이다', 적게것.includes('Park Gyu-young'));
  검('⛔ 적게 잰 학교에 «가운데값»을 안 쓴다', !/median/.test(적게것));
  검('⛔ 사람 수가 없으면 셋째 갈래로 안 간다',
    !/travelled furthest/.test(설명짓기(75, 'X', null, 1, 2, { 사람수: 3, 가장넓은사람: null })));
  검('⛔ 나라 수가 숫자가 아니면 셋째 갈래로 안 간다',
    !/travelled furthest/.test(설명짓기(75, 'X', null, 1, 2,
      { 사람수: 3, 가장넓은사람: { 이름: 'A', 가장넓은나라수: null } })));
  검('⭐ 적게 잰 설명도 155자 안이다', 적게것.length <= 설명바닥);
  검('⭐ 긴 이름 + 긴 학교로도 안 넘친다',
    설명짓기(999, 'Hankuk University of Foreign Studies', null, 4535, 9249,
      { 사람수: 4, 가장넓은사람: { 이름: 'Kim Seon-ho', 가장넓은나라수: 100 } }).length <= 설명바닥);

  검('⭐ 가장 긴 학교 이름으로도 안 넘친다',
    설명짓기(999, 'Hankuk University of Foreign Studies', { 가운데나라수: 100, 사람수: 99 }, 4535, 9249)
      .length <= 설명바닥);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 학교 낱장 설명문을 재는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (내가실행됐다) {
  const 학교자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-schools.json'), 'utf8'));
  const 도달자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/kcw-school-reach.json'), 'utf8'));
  const 도달표 = new Map((도달자료.잴수있는것 ?? []).map((r) => [r.slug, r]));
  const 적게표 = new Map((도달자료.적게잰것 ?? []).map((r) => [r.slug, r]));
  const 학교들 = 학교자료.schools ?? 학교자료.학교들 ?? [];
  const 적힌사람 = 학교자료.peopleWithSchool ?? 학교자료.적힌사람 ?? 0;
  const 명부 = 학교자료.peopleTotal ?? 학교자료.명부 ?? 0;

  let 잰것 = 0; let 못잰것 = 0; const 넘친것 = [];
  for (const s of 학교들) {
    const 도달 = 도달표.get(s.slug) ?? null;
    const 적게 = 적게표.get(s.slug) ?? null;
    const d = 설명짓기(s.people, s.name, 도달, 적힌사람, 명부, 적게);
    if (/countries on Netflix/.test(d)) 잰것 += 1; else 못잰것 += 1;
    if (d.length > 설명바닥) 넘친것.push(`${s.slug} ${d.length}자`);
    const t = `${Number(s.people).toLocaleString('en-US')} Korean stars from ${s.name}`;
    if (t.length > 제목바닥) 넘친것.push(`${s.slug} 제목 ${t.length}자`);
  }

  console.log(`■ 학교 낱장 ${학교들.length}장 — 설명문을 쟀습니다\n`);
  console.log(`  ⭐ 「우리만 가진 수」를 말하는 낱장   ${잰것}장`);
  console.log(`  ⚠ 아직 도달을 못 잰 낱장            ${못잰것}장 (지어내지 않고 옛 문장 그대로)`);
  if (넘친것.length) {
    console.error(`\n⛔ 구글이 자르는 길이를 넘긴 것 ${넘친것.length}개`);
    넘친것.slice(0, 10).forEach((s) => console.error(`   · ${s}`));
    process.exit(1);
  }
  console.log('\n  ✅ 제목·설명이 모두 구글이 자르는 길이 안입니다');
  console.log(`  ⚠ 도달을 더 재면 ${못잰것}장이 줄어듭니다 — 그것이 다음 할 일입니다`);
}
