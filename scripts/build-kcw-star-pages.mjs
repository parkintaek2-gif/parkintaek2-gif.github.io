#!/usr/bin/env node
/**
 * build-kcw-star-pages.mjs — **찾아보는 사람은 많은데 우리 지면이 없는 이름**을 채운다.
 *   내는 것: `src/data/kcw-star-pages.json`
 *
 * ── 🔴 왜 (2026-09-01 · 사장님 지시) ─────────────────────────
 * > 「**니가 제일 많은 방문자를 만들어야 돼.** 원래 연예 콘텐트를 사람들이 가장 많이 보잖아.
 * >  넌 사용할 수 있는 토큰도 많고, 당연히 방문자와 페이지뷰가 제일 많아야지」
 *
 * 그래서 «어디가 비었나»를 쟀다. 짐작이 아니라 수로.
 * ```
 * 우리 지면 7,286장 → 28일 노출 889 · 클릭 3   (지면 한 장당 한 달 0.47 노출)
 * 색인은 70% 들어가 있다 → 색인 문제가 «아니다»
 * ⇒ 아무도 안 찾는 말을 겨냥해 2,700장을 낸 것이다
 * ```
 *
 * 🔴 그리고 이것을 찾았다 —
 * ```
 * 우리가 «잰» 한국 이름 300명 중
 *   지면 있는 사람 182명 — 30일 열람 5,301,900
 *   지면 «없는» 사람 118명 — 30일 열람 **3,481,919**
 * ```
 * 없는 118명이 누구냐면 — V(126,321) · Jennie(121,980) · Jungkook(113,190) ·
 * Jisoo(89,061) · ROSÉ(80,923) · Jimin(74,943) · RM(69,733) · Suga(67,519)…
 * **세상에서 가장 많이 찾아보는 한국 이름들이 한 장도 없었다.**
 *
 * ⚠ 까닭은 알 만하다 — `wikitip-people.json` 은 «넷플릭스 주간 톱10에 오른 작품»이
 *   있는 사람만 담는다. 아이돌은 넷플릭스에 안 오르니 통째로 빠졌다.
 *   ⛔ 자료의 모양이 우리 지면의 모양을 정해 버렸다. 손님이 찾는 것과 무관하게.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **「필모그래피」를 흉내 내지 않는다.** 이 사람들에 대해 우리가 가진 것은 «관심의 크기»다.
 *   그것만 낸다. 없는 것을 있는 척하면 얇은 지면이 된다.
 * ⛔ 열람수를 「인기」라 안 쓴다. **문서가 열린 횟수**다.
 * ⛔ 열람수를 「검색량」이라 안 쓴다. 우리는 유료 검색 자료가 없다.
 * ⛔ 줄세워 「누가 더 인기 있나」를 말하지 않는다 — 자리 수를 적을 뿐이다.
 * ⛔ 생일을 모르면 **모른다고 적는다.** 0 이나 빈칸으로 안 채운다.
 * ⚠ 이 지면이 하는 말은 「이 이름을 이만큼 찾아봤다」이지 「이 사람이 이렇다」가 아니다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-star-pages.mjs --자가시험
 *   node scripts/build-kcw-star-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 이 아래로는 지면을 안 낸다 — 할 말이 너무 적다 */
export const 바닥열람 = 5000;

/** 이름 → 주소 조각. ⛔ 지어내지 않고 «규칙»으로 만든다 */
export function 슬러그로(이름) {
  const s = String(이름 ?? '').trim();
  if (!s) return '';
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')   /* ROSÉ → ROSE */
    .toLowerCase().replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * 몇 개 판에 있나를 «말»로 바꾼다.
 * ⛔ 「인기 있다」로 안 쓴다 — 판 수는 «얼마나 많은 언어권이 이 사람 문서를 썼나»다.
 */
export function 판말(수, 가운데) {
  if (!Number.isFinite(수) || !Number.isFinite(가운데)) return null;
  if (수 > 가운데) return `${수} Wikipedias — more than the median Korean name we measure (${가운데})`;
  if (수 === 가운데) return `${수} Wikipedias — exactly the median of the Korean names we measure`;
  return `${수} Wikipedias — fewer than the median Korean name we measure (${가운데})`;
}

/** 가운데값. ⛔ 평균을 안 쓴다 — 한두 명이 끌어올린다 */
export function 가운데값(수들) {
  const a = (수들 ?? []).filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

/** 태어난 날에서 나이. ⛔ 모르면 null — 0 이 아니다 */
export function 나이(태어난날, 기준일) {
  if (!태어난날 || !기준일) return null;
  const b = new Date(태어난날);
  const n = new Date(기준일);
  if (Number.isNaN(b.getTime()) || Number.isNaN(n.getTime())) return null;
  let a = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a -= 1;
  return a >= 0 && a < 130 ? a : null;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  let 센것 = 0;
  const 검 = (이름, 참) => { 센것 += 1; if (!참) 실패.push(이름); };

  검('슬러그를 만든다', 슬러그로('Song Kang') === 'song-kang');
  검('악센트를 편다(ROSÉ)', 슬러그로('ROSÉ') === 'rose');
  검('괄호를 버린다', 슬러그로('Jennie (singer)') === 'jennie-singer');
  검('아포스트로피를 버린다', 슬러그로("Girl's Day") === 'girls-day');
  검('⛔ 빈 값은 빈 글자', 슬러그로('') === '' && 슬러그로(null) === '');

  검('가운데값을 낸다', 가운데값([1, 3, 5]) === 3);
  검('짝수면 두 개를 평균', 가운데값([1, 3, 5, 7]) === 4);
  검('⛔ 빈 배열은 null', 가운데값([]) === null && 가운데값(null) === null);
  검('⛔ 수 아닌 것은 뺀다', 가운데값([1, 'x', 3]) === 2);

  검('가운데보다 많으면 more', 판말(78, 21).includes('more than'));
  검('적으면 fewer', 판말(10, 21).includes('fewer than'));
  검('같으면 exactly', 판말(21, 21).includes('exactly'));
  검('⛔ 수가 아니면 null', 판말(null, 21) === null && 판말(78, 'x') === null);

  검('나이를 센다', 나이('1996-01-16', '2026-09-01') === 30);
  검('생일 전이면 한 살 적다', 나이('1996-12-31', '2026-09-01') === 29);
  검('⛔ 생일을 모르면 null — 0 이 아니다', 나이(null, '2026-09-01') === null);
  검('⛔ 이상한 날은 null', 나이('어제', '2026-09-01') === null);

  return { 실패, 센것 };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const { 실패, 센것 } = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ build-kcw-star-pages 자가시험 통과 (${센것})`);
  process.exit(0);
}

if (내가실행됐다) {
  const 읽 = (f) => JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data', f), 'utf8'));
  const 수요 = 읽('wikitip-star-demand.json');
  const 있는사람 = 읽('wikitip-people.json').people ?? [];

  const 있는이름 = new Set(있는사람.map((x) => String(x.name).toLowerCase()));
  const 있는슬러그 = new Set(있는사람.map((x) => x.slug));

  const 전부 = 수요.people ?? [];
  if (!전부.length) { console.error('⛔ 수요 자료가 비었다. 「없다」가 아니라 「못 읽었다」다.'); process.exit(1); }

  const 판가운데 = 가운데값(전부.map((x) => x.sitelinks));
  const 열람정렬 = [...전부].sort((a, b) => b.reads - a.reads);
  const 자리 = new Map(열람정렬.map((x, i) => [x.q, i + 1]));

  const 오늘 = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10);

  const 낼것 = [];
  const 건너뛴 = { 이미있다: 0, 열람적다: 0, 슬러그겹침: 0 };

  for (const p of 열람정렬) {
    if (있는이름.has(String(p.name).toLowerCase())) { 건너뛴.이미있다 += 1; continue; }
    if (!Number.isFinite(p.reads) || p.reads < 바닥열람) { 건너뛴.열람적다 += 1; continue; }
    const 슬 = 슬러그로(p.name);
    if (!슬 || 있는슬러그.has(슬)) { 건너뛴.슬러그겹침 += 1; continue; }
    있는슬러그.add(슬);

    낼것.push({
      slug: 슬,
      name: p.name,
      enTitle: p.enTitle,
      q: p.q,
      born: p.born ?? null,
      age: 나이(p.born, 오늘),
      reads: p.reads,
      sitelinks: p.sitelinks,
      rank: 자리.get(p.q) ?? null,
      of: 전부.length,
      /* ⛔ 손으로 안 적는다 — 자료가 바뀌면 지면도 따라 바뀐다 */
      sitelinkLine: 판말(p.sitelinks, 판가운데),
    });
  }

  const 낼 = {
    generated: new Date().toISOString(),
    asOf: 오늘,
    window: 수요.window ?? null,
    whatThisIs: 수요.whatThisIs,
    whatThisIsNot: 수요.whatThisIsNot,
    /* ⛔ 이 지면이 «안 하는» 말을 자료에 박아 둔다. 지면이 잊어도 여기 남는다 */
    weDoNotHave: 'Charting titles for these names. They are measured for attention, not for a Netflix filmography — the absence of a title list is a fact about our data, not about their careers.',
    medianSitelinks: 판가운데,
    floorReads: 바닥열람,
    measuredTotal: 전부.length,
    stars: 낼것,
  };

  const 낼길 = path.join(뿌리, 'src/data/kcw-star-pages.json');
  fs.writeFileSync(낼길, `${JSON.stringify(낼, null, 2)}\n`);

  const 열람합 = 낼것.reduce((s, x) => s + x.reads, 0);
  console.log(`✅ src/data/kcw-star-pages.json — 새 지면 ${낼것.length}장`);
  console.log(`   그 이름들의 30일 열람 합 ${열람합.toLocaleString()}회 — 지금은 그 관심을 한 장도 안 받고 있다`);
  console.log(`   판 가운데값 ${판가운데} · 열람 바닥 ${바닥열람.toLocaleString()}`);
  console.log(`   건너뛴 것 — 이미 지면 있다 ${건너뛴.이미있다} · 열람이 바닥 아래 ${건너뛴.열람적다} · 주소 겹침 ${건너뛴.슬러그겹침}`);
  console.log('\n   위 10명');
  for (const x of 낼것.slice(0, 10)) console.log(`     ${String(x.reads).padStart(7)}회  /person/${x.slug}  (${x.sitelinks}개 판)`);
}
