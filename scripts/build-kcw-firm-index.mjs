#!/usr/bin/env node
/**
 * build-kcw-firm-index.mjs — **회사에서 작품으로 걸어가는 복도 한 장.**
 *   내는 것: `src/data/wikitip-firm-index.json` → `/firms`
 *
 * ── 왜 (2026-08-22 23:xx) ──────────────────────────────────────
 * ① 잰 수요가 있습니다. 자동완성에서 `studio dragon dramas` 가 **1번째로 뜨고 제안이 10줄**입니다
 *    (`studio dragon drama list` · `studio dragon kdrama` · `studio dragon on netflix` …).
 *    그런데 우리에게 **Studio Dragon 지면이 없습니다.** 자료에는 27편이 있습니다.
 * ② `/firm/<slug>` 은 여덟 장뿐입니다(2번 지시). 어느 여덟인지는 **이름 차례**로 골랐고,
 *    그래서 사람이 찾는 이름(Studio Dragon · tvN · SBS · SHOWBOX)이 전부 빠졌습니다.
 *    ⛔ 그 여덟 장 규칙을 건드리지 않습니다 — 대신 **복도**를 냅니다.
 * ③ 나라 지면 93장에 복도가 없어 아무도 못 걸었던 것과 같은 꼴입니다(`/by-country` 로 고쳤습니다).
 *    회사도 같습니다. 회사 이름이 화면에 글자로만 있고 **눌리는 자리가 없었습니다.**
 * ④ ⭐ 그리고 이것이 색인에 듣습니다. 실측으로 작품 지면 528장의 들어오는 링크 중간값이 1이었고,
 *    「발견만 하고 안 넣음」이 16.7% 였습니다. 회사 축은 그 링크를 **한 번에 수백 개** 늘립니다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **회사끼리 줄세우지 않습니다.** 이름 차례로 놓고 편수를 옆에 적습니다.
 *   (편수 순으로 세우면 방송사가 위로 올라가 「좋은 회사 순서」로 읽힙니다)
 * ⛔ **한글 역할 이름을 화면에 내지 않습니다.** 자료는 「제작·배급·첫방송」으로 들고 있습니다.
 *   영문 지면에 그대로 나가면 안 됩니다 — produced / distributed / first broadcast 로 옮깁니다.
 * ⛔ **크레딧 없는 작품을 0으로 안 셉니다.** 지면 있는 528장 중 147장은 크레딧이 **없습니다**.
 *   「회사가 없다」가 아니라 「위키데이터에 아직 없다」입니다. 그 수를 화면에 적습니다.
 * ⛔ 등급(A/B/C)을 「회사의 등급」처럼 내지 않습니다 — 그것은 **우리 확신의 등급**입니다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-firm-index.mjs --자가시험
 *   node scripts/build-kcw-firm-index.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자료길 = path.join(뿌리, 'src/data/wikitip-title-pages.json');
const 낼길 = path.join(뿌리, 'src/data/wikitip-firm-index.json');

/** 지면이 있는 회사(=자세한 지면이 이미 있는 곳). 없으면 빈 집합 */
function 자세한지면들() {
  /**
   * 🔴 2026-08-22 — 자세한 지면의 슬러그 규칙이 이 자의 것과 달랐다.
   *   「CJ ENM Films & Television」 이 그쪽은 cj-enm-films-television, 이쪽은 ...-and-... 이다.
   *   슬러그로 맞추면 두 곳이 **조용히 문을 잃는다**(죽은 링크는 아니지만 문이 사라진다).
   *   ⭐ 그래서 이름으로 그쪽 슬러그를 그대로 가져온다 — 주소를 두 곳에서 따로 만들면 갈라진다.
   */
  try {
    const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-firm-pages.json'), 'utf8'));
    return new Map((j.firms ?? []).map((f) => [String(f.firm).trim(), f.slug]));
  } catch { return new Map(); }
}

/**
 * ⛔ 한글 역할을 화면 말로 옮긴다. **모르는 것은 옮기지 않고 버린다** —
 *   지어내면 없는 사실이 화면에 나가고, 한글을 그대로 두면 영문 지면이 깨진다.
 */
export const 역할옮기기 = (역할들) => {
  const 표 = { 제작: 'produced', 배급: 'distributed', 첫방송: 'first broadcast' };
  const out = [];
  for (const r of 역할들 ?? []) {
    const v = 표[String(r).trim()];
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
};

/** 주소에 쓸 이름. ⛔ 못 만들면 null — 억지로 만들지 않는다 */
export const 슬러그 = (이름) => {
  const s = String(이름 ?? '').toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.length >= 2 ? s : null;
};

/**
 * 회사별로 모은다.
 * ⚠ 같은 회사가 한 작품에서 두 역할을 갖는 줄이 따로 있다 — 작품은 **한 번만** 센다.
 */
export function 회사모으기(작품들) {
  const 표 = new Map();
  let 크레딧없음 = 0;
  for (const t of 작품들 ?? []) {
    const 회사 = t.firms ?? [];
    if (!회사.length) { 크레딧없음 += 1; continue; }
    for (const f of 회사) {
      const 이름 = String(f.firm ?? '').trim();
      if (!이름) continue;
      if (!표.has(이름)) 표.set(이름, { firm: 이름, titles: new Map(), roles: new Set() });
      const 칸 = 표.get(이름);
      역할옮기기(f.roles).forEach((r) => 칸.roles.add(r));
      if (!칸.titles.has(t.slug)) {
        칸.titles.set(t.slug, {
          slug: t.slug, title: t.title, type: t.type, weeks: t.weeks, markets: t.markets,
        });
      }
    }
  }
  return { 표, 크레딧없음 };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('제작을 옮긴다', 역할옮기기(['제작']).join() === 'produced');
  검('셋 다 옮긴다', 역할옮기기(['제작', '배급', '첫방송']).join(',') === 'produced,distributed,first broadcast');
  검('⛔ 모르는 역할은 버린다', 역할옮기기(['제작', '알수없는것']).join() === 'produced');
  검('⛔ 같은 역할을 두 번 안 넣는다', 역할옮기기(['제작', '제작']).length === 1);
  검('⛔ 빈 값도 안 터진다', 역할옮기기(undefined).length === 0 && 역할옮기기([]).length === 0);
  검('⛔ 화면에 나갈 말에 한글이 없다',
    !/[가-힣]/.test(역할옮기기(['제작', '배급', '첫방송']).join(' ')));

  검('슬러그를 만든다', 슬러그('Studio Dragon') === 'studio-dragon');
  검('앰퍼샌드를 말로 바꾼다', 슬러그('CJ ENM Films & Television') === 'cj-enm-films-and-television');
  검('점과 쉼표를 정리한다', 슬러그('SHOWBOX Co., Ltd.') === 'showbox-co-ltd');
  검('⛔ 못 만들면 null', 슬러그('!!') === null && 슬러그('') === null);

  const 표본 = [
    {
      slug: 'a', title: 'A', type: 'TV', weeks: 5, markets: 3,
      firms: [{ firm: 'tvN', roles: ['첫방송'] }, { firm: 'Studio Dragon', roles: ['제작'] }],
    },
    {
      slug: 'b', title: 'B', type: 'TV', weeks: 2, markets: 1,
      firms: [{ firm: 'tvN', roles: ['배급', '첫방송'] }],
    },
    { slug: 'c', title: 'C', type: 'Films', weeks: 9, markets: 40, firms: [] },
  ];
  const { 표, 크레딧없음 } = 회사모으기(표본);
  검('회사를 둘 찾는다', 표.size === 2);
  검('tvN 이 두 편', 표.get('tvN').titles.size === 2);
  검('두 역할이 다 남는다', [...표.get('tvN').roles].sort().join(',') === 'distributed,first broadcast');
  검('⛔ 크레딧 없는 작품을 회사에 안 붙인다', !표.has(''));
  검('⛔ 크레딧 없는 작품을 따로 센다 — 0 으로 안 채운다', 크레딧없음 === 1);
  검('⛔ 빈 입력도 안 터진다', 회사모으기(undefined).표.size === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ build-kcw-firm-index 자가시험 통과 (16)');
  process.exit(0);
}

const 원 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
const 것들 = 원.titles.filter((t) => t.hasPage);
const { 표, 크레딧없음 } = 회사모으기(것들);
const 자세한 = 자세한지면들();

/**
 * ⚠ 한 편뿐인 회사는 **복도에 다 싣지 않는다.** 188곳을 한 화면에 놓으면 아무것도 못 찾는다.
 *   ⛔ 그렇다고 지우지 않는다 — 수를 적고, 두 편 이상만 펼친다. 「안 보이는 것」과 「없는 것」은 다르다.
 */
const 회사들 = [...표.values()].map((c) => ({
  firm: c.firm,
  slug: 슬러그(c.firm),
  roles: [...c.roles],
  titleCount: c.titles.size,
  detailSlug: 자세한.get(c.firm) ?? null,
  hasDetailPage: 자세한.has(c.firm),
  /* ⛔ 편수 순으로 세우지 않는다. 작품은 오래 간 것부터 — 그건 회사 평가가 아니다 */
  titles: [...c.titles.values()].sort((a, b) => (b.weeks ?? 0) - (a.weeks ?? 0)),
})).filter((c) => c.slug);

const 여럿 = 회사들.filter((c) => c.titleCount >= 2).sort((a, b) => a.firm.localeCompare(b.firm, 'en'));
const 하나 = 회사들.filter((c) => c.titleCount === 1).sort((a, b) => a.firm.localeCompare(b.firm, 'en'));

const 몸 = {
  generated: new Date().toISOString().slice(0, 10),
  whatThisIs: 'Every company credited on a Korean title that has entered a Netflix weekly top 10, with the '
    + 'titles we hold for it. Companies are in alphabetical order so the list cannot be read as a ranking.',
  whatThisIsNot: 'Not a measure of how good or how big a company is, and not a complete filmography. Credits '
    + 'come from Wikidata, which is incomplete: of the titles with a page here, some carry no company credit '
    + 'at all. That is a gap in the record, not a title without a maker.',
  source: 원.source,
  weekFrom: 원.weekFrom,
  weekTo: 원.weekTo,
  weekCount: 원.weekCount,
  marketCount: 원.marketCount,
  titlesConsidered: 것들.length,
  titlesWithNoCredit: 크레딧없음,
  companyCount: 회사들.length,
  companiesWithTwoOrMore: 여럿.length,
  companiesWithOne: 하나.length,
  detailPageCount: 자세한.size,
  roleWords: ['produced', 'distributed', 'first broadcast'],
  companies: 여럿,
  singleTitleCompanies: 하나.map((c) => ({
    firm: c.firm, slug: c.slug, title: c.titles[0].title, titleSlug: c.titles[0].slug,
  })),
};

fs.writeFileSync(낼길, `${JSON.stringify(몸, null, 1)}\n`);
console.log(`✅ 냈다 — ${path.relative(뿌리, 낼길)}`);
console.log(`   회사 ${회사들.length}곳 · 두 편 이상 ${여럿.length}곳 · 한 편 ${하나.length}곳`);
console.log(`   자세한 지면이 이미 있는 곳 ${자세한.size}곳`);
console.log(`   ⚠ 크레딧이 아예 없는 작품 ${크레딧없음}편 — 0 이 아니라 «기록에 없다»`);
console.log(`   작품 지면으로 나가는 링크 ${여럿.reduce((n, c) => n + c.titles.length, 0)}개`);
