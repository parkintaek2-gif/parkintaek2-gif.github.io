#!/usr/bin/env node
/**
 * check-person-title.mjs — **사람 낱장 636장의 제목이 「우리만 가진 수」를 말하는지 잰다.**
 *
 * ── 🔴 왜 생겼나 ─────────────────────────────────────────────
 * 2026-08-29, AI 인용을 재다가 옆길에서 더 큰 것을 찾았다 —
 * **사람 낱장 636장이 28일 노출 «0» 이다.** 색인은 80%가 들어갔는데
 * 어떤 검색어에도 순위가 안 나온다(GSC 갈래별 표에 /person 행이 아예 없다).
 *
 * 까닭은 제목이 **IMDb·위키피디아와 똑같은 말**이기 때문으로 본다 —
 * 「{이름} movies and TV shows」는 그들도 쓰는 말이고 새 사이트가 그 말로 이길 수 없다.
 * ⭐ 그런데 그 말을 «버리면 안 된다» — 자동완성 1번째가
 *   「park gyu-young movies and tv shows」다. 실제 수요가 거기 있다.
 * ✅ 그래서 «빼지 않고 더한다» — 뒤에 「몇 나라 차트에 들었나」를 붙인다.
 *   IMDb 는 그 수를 안 적는다. 그것이 우리가 이길 자리다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ 제목이 60자를 넘으면 실패 — 잘리면 «뒤의 수가 안 보인다». 넣으나 마나가 된다.
 * ⛔ 스타 이름이 «맨 앞»이 아니면 실패 — 사장님: 「인기검색어는 스타 이름이다」
 * ⛔ 「movies and TV shows」가 빠지면 실패 — 실제 수요가 그 말에 있다.
 * ⚠ 나라 수가 없는 사람은 옛 꼴로 떨어진다. 그것은 실패가 아니다 — 지어내지 않은 것이다.
 *
 * 쓰는 법  node scripts/check-person-title.mjs
 *          node scripts/check-person-title.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 제목바닥 = 60;

/** 지면이 지을 제목을 «같은 셈»으로 미리 짓는다 */
export function 제목짓기(이름, 나라수) {
  const 후보 = Number.isFinite(Number(나라수)) && Number(나라수) > 0
    ? [`${이름} movies and TV shows — ${나라수} countries on Netflix`,
      `${이름} movies and TV shows — ${나라수} countries`,
      `${이름} movies and TV shows on Netflix`]
    : [`${이름} movies and TV shows on Netflix`];
  return 후보.find((t) => t.length <= 제목바닥) ?? 후보[후보.length - 1];
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (이름, ok) => { if (ok) 통 += 1; else 실.push(이름); };

  const t = 제목짓기('Park Gyu-young', 65);
  검('⭐ 스타 이름이 맨 앞이다', t.startsWith('Park Gyu-young'));
  검('⭐ 실제 수요가 있는 말을 지킨다', t.includes('movies and TV shows'));
  검('⭐⭐ 우리만 가진 수가 들어간다 — IMDb 는 이걸 안 적는다', t.includes('65 countries'));
  검('60자 안이다', t.length <= 제목바닥);

  /* ⛔ 넘치면 줄인다 — 잘리면 뒤의 수가 «안 보인다» */
  const 긴것 = 제목짓기('Steve Sanghyun Noh', 51);
  검('⭐ 긴 이름이면 「on Netflix」를 떼어 줄인다', 긴것.length <= 제목바닥 && 긴것.includes('51 countries'));
  검('줄여도 이름과 수요어는 지킨다',
    긴것.startsWith('Steve Sanghyun Noh') && 긴것.includes('movies and TV shows'));

  /* ⚠ 못 잰 사람은 지어내지 않는다 */
  검('⛔ 나라 수가 없으면 «안» 지어낸다', !/countries/.test(제목짓기('Someone', null)));
  검('⛔ 0 도 안 지어낸다', !/countries/.test(제목짓기('Someone', 0)));
  검('⛔ 숫자가 아니어도 안 지어낸다', !/countries/.test(제목짓기('Someone', '많음')));

  /** ⭐⭐ 지금 자료 636명을 «다 재서» 못박는다 — 한 장이라도 넘치면 실패 */
  const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-people.json'), 'utf8'));
  const 다 = (자료.people ?? []).map((x) => 제목짓기(x.name, x.countries));
  검(`⭐⭐ 636장이 다 60자 안이다 (지금 ${다.filter((x) => x.length > 제목바닥).length}장 넘침)`,
    다.every((x) => x.length <= 제목바닥));
  검('⭐ 모두 이름으로 시작한다',
    (자료.people ?? []).every((x, i) => 다[i].startsWith(x.name)));
  검('⭐ 나라 수를 아는 사람은 제목에 그 수가 있다',
    (자료.people ?? []).every((x, i) => !(Number(x.countries) > 0) || 다[i].includes(`${x.countries} countries`)));

  /* ⛔ 지면이 이 자와 «같은 셈»을 쓰는지 본다 — 갈리면 이 검사가 뜻을 잃는다 */
  const 지면 = fs.readFileSync(path.join(뿌리, 'src/pages/wikitip/person/[person].astro'), 'utf8');
  검('⛔ 지면이 같은 바닥값(60)을 쓴다', /제목바닥 = 60/.test(지면));
  검('⛔ 지면이 후보를 «짧아지는 순»으로 고른다', /제목후보\.find\(\(t\) => t\.length <= 제목바닥\)/.test(지면));

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 사람 낱장 제목을 재는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (내가실행됐다) {
  const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-people.json'), 'utf8'));
  const 사람 = 자료.people ?? [];
  const 다 = 사람.map((x) => ({ 이름: x.name, slug: x.slug, 제목: 제목짓기(x.name, x.countries) }));
  const 넘친것 = 다.filter((x) => x.제목.length > 제목바닥);
  const 수있음 = 다.filter((x) => /countries/.test(x.제목)).length;

  console.log(`■ 사람 낱장 ${사람.length}장 — 제목을 쟀습니다\n`);
  console.log(`  ⭐ 「몇 나라까지 갔나」를 제목에 넣은 낱장   ${수있음}장`);
  console.log(`  ⚠ 나라 수를 몰라 옛 꼴로 둔 낱장           ${사람.length - 수있음}장 (지어내지 않았습니다)`);
  console.log(`  가장 긴 제목 ${Math.max(...다.map((x) => x.제목.length))}자`);
  if (넘친것.length) {
    console.error(`\n⛔ 60자를 넘긴 것 ${넘친것.length}장 — 잘리면 뒤의 수가 안 보입니다`);
    넘친것.slice(0, 8).forEach((x) => console.error(`   · ${x.제목.length}자 ${x.slug}`));
    process.exit(1);
  }
  console.log('\n  ✅ 636장이 모두 구글이 자르는 길이 안입니다');
  console.log('  ⚠ 이 바꿈이 통했는지는 «나중에 재야» 압니다 — 지금 이 갈래는 28일 노출 0입니다.');
  console.log('     9월 5일쯤 find-ranked-but-unclicked 로 /person 행이 생겼는지 보십시오.');
}
