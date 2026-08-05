#!/usr/bin/env node
/**
 * 백년지도 — KDI 연구자료 중 **교육·노동**만 골라 지면 자료로 만든다
 *
 *   node scripts/build-100yearmap-research.mjs
 *   archive/raw/kdi/**\/*.json  →  src/data/100yearmap/pages-research.json
 *
 * ⭐ **고르는 기준을 내가 짐작하지 않는다.** KDI 가 붙인 분류코드(`topics`)를 그대로 쓴다.
 *   처음엔 제목에 「교육·대학·취업」이 들어가는 것을 찾았는데,
 *   그러면 「충주 충북대학교병원 건립 예비타당성조사」가 딸려 온다. 대학 연구가 아니다.
 *   KDI 분류에는 F(교육)·E(노동) 가 따로 있다. 그걸 쓰면 짐작이 필요 없다.
 *
 * ⛔ **요약문·본문을 옮기지 않는다.** 제목·저자·발행일·분류·링크만 싣는다.
 *   KDI 오픈API 로 받은 것은 맞지만, 남의 글을 우리 지면에 옮겨 놓는 것과
 *   「여기에 이런 연구가 있다」고 가리키는 것은 다르다. 뒤쪽만 한다.
 *
 * ⛔ 순위를 매기지 않는다. 발행일 내림차순이다 — 새것이 위인 것뿐이다.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'),
  '..',
);
const RAW = path.join(ROOT, 'archive', 'raw', 'kdi');
const OUT = path.join(ROOT, 'src', 'data', '100yearmap', 'pages-research.json');

/** 우리 질문에 닿는 분류만. **KDI 가 붙인 코드다** */
const 담을분류 = {
  F00: '영유아 교육',
  F01: '초중등 교육',
  F02: '고등교육(대학)',
  F03: '직업교육',
  F99: '교육 일반',
  E01: '고용·실업',
  E02: '임금·임금격차',
  E04: '특정 노동시장',
};

/** ⚠ 이것이 섞여 있으면 뺀다 — 사업 타당성 보고서다. 교육 연구가 아니다.
 *  「○○대학교병원 건립 예비타당성조사」가 F02 로도 잡히는 일이 있다. */
const 빼는분류 = new Set(['L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'N00']);

const 코드 = (t) => String(t ?? '').split('^').map((s) => s.trim().split('|')[0]).filter(Boolean);

const 파일들 = [];
(function 훑기(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) 훑기(p);
    else if (e.name.endsWith('.json')) 파일들.push(p);
  }
})(RAW);

const 한글있나 = (s) => /[가-힣]/.test(String(s ?? ''));

const 담긴 = [];
const 뺀것 = [];
const 제목없음 = [];
const 본것 = new Set();

for (const p of 파일들) {
  let r;
  try {
    r = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    continue;
  }
  const cs = 코드(r.topics);
  const 맞는 = cs.filter((c) => 담을분류[c]);
  if (!맞는.length) continue;
  if (cs.some((c) => 빼는분류.has(c))) {
    뺀것.push({ 제목: r.titleKo, 이유: cs.filter((c) => 빼는분류.has(c)).join(',') });
    continue;
  }

  /** ⚠ **영상보고서는 제목·날짜·저자가 통째로 안 온다.** 오는 것은 url 뿐이다.
   *  이름 없는 링크를 지면에 걸 수는 없으므로 뺀다.
   *  ⛔ 「자료가 없다」가 아니라 **「우리가 아직 못 받았다」**이다. 수를 세어 남긴다. */
  if (!r.titleKo) {
    제목없음.push({ 종류: r.categoryKo, url: r.url });
    continue;
  }

  // ⚠ 같은 보고서가 두 파일로 오는 일이 있다(cd 가 다르다). url 로 한 번만 담는다
  if (본것.has(r.url)) continue;
  본것.add(r.url);

  담긴.push({
    제목: r.titleKo,
    저자: Array.isArray(r.authors) ? r.authors.filter(Boolean) : [],
    발행일: r.date ?? null,
    분류: 맞는.map((c) => 담을분류[c]),
    분류코드: 맞는,
    종류: r.categoryKo ?? null,
    url: r.url,
    한글: 한글있나(r.titleKo),
  });
}

/** ⚠ 같은 보고서의 **국문판과 영문판이 따로 온다.** 둘 다 실으면 같은 것이 두 번 보인다.
 *  발행일 + 저자가 같으면 한 짝으로 보고 **국문을 남긴다.**
 *  ⛔ 영문판만 있는 것은 지우지 않는다 — 그건 짝이 아니라 그 자료의 유일한 판이다. */
const 짝 = new Map();
for (const d of 담긴) {
  const k = `${d.발행일 ?? ''}|${d.저자.join(',')}`;
  if (!짝.has(k)) 짝.set(k, []);
  짝.get(k).push(d);
}
let 영문접음 = 0;
const 남길 = new Set();
for (const [k, list] of 짝) {
  const 국문 = list.filter((d) => d.한글);
  if (국문.length && 국문.length < list.length && k !== '|') {
    국문.forEach((d) => 남길.add(d));
    영문접음 += list.length - 국문.length;
  } else {
    list.forEach((d) => 남길.add(d));
  }
}
const 최종 = 담긴.filter((d) => 남길.has(d));
최종.forEach((d) => delete d.한글);
담긴.length = 0;
담긴.push(...최종);

담긴.sort((a, b) => String(b.발행일 ?? '').localeCompare(String(a.발행일 ?? '')));

/** 분류별로 몇 건인지 — 지면 위에 그대로 쓴다 */
const 분류별 = {};
for (const d of 담긴) for (const k of d.분류) 분류별[k] = (분류별[k] ?? 0) + 1;

const 결과 = {
  만든날: new Date().toISOString().slice(0, 10),
  출처: '한국개발연구원(KDI) 오픈API',
  전체검사: 파일들.length,
  담김: 담긴.length,
  뺀것: 뺀것.length,
  영문접음,
  /** ⚠ 못 받은 것. 지면에 이 수를 그대로 쓴다 — 없는 척하지 않는다 */
  제목이안온것: 제목없음.length,
  분류별,
  자료: 담긴,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(결과, null, 1));

console.log(`KDI 자료 ${파일들.length}건을 훑었다.`);
console.log(`  담김 ${담긴.length}건 · 사업평가라 뺀 것 ${뺀것.length}건`);
console.log(`  영문판이라 접은 것 ${영문접음}건 · ⚠ 제목이 안 온 것 ${제목없음.length}건(대부분 영상보고서)`);
for (const [k, v] of Object.entries(분류별)) console.log(`   ${String(v).padStart(3)} ${k}`);
console.log(`→ ${path.relative(ROOT, OUT)}`);
if (뺀것.length) {
  console.log('\n뺀 것 (앞 5건):');
  뺀것.slice(0, 5).forEach((x) => console.log(`   [${x.이유}] ${x.제목}`));
}
