#!/usr/bin/env node
/**
 * check-kcw-description-length.mjs — **검색 결과 설명이 잘려 «아무 말도 안 하게» 되나.**
 *
 * ── 왜 (2026-08-23) ───────────────────────────────────────────
 * 3번이 2번께 올린 것 — 「100y 전 지면(36장)이 description 권장치를 넘습니다」.
 * 우리 쪽을 같은 눈으로 재 봤습니다.
 * ```
 *  설명이 있는 지면 1,234장 · 중간값 228자 · 최대 373자
 *  160자 넘는 것 930장 · 200자 넘는 것 782장
 * ```
 * 같은 병입니다. **그런데 여기서 「930장을 다시 써라」로 넘어가면 안 됩니다.**
 *
 * ── ⛔ 「길다」와 「잘리면 뜻이 사라진다」는 다른 말이다 ────────
 * 제목에서 이미 겪은 것과 같습니다(`check-kcw-title-length`). 길이만 세면 사람을
 * 헛일로 보냅니다. 우리가 볼 것은 **잘린 앞부분이 무엇을 말하나**입니다.
 * ⛔ 그리고 구글은 설명을 **자주 제 마음대로 다시 씁니다.** 우리가 쓴 글이 그대로 나간다는
 *   보장이 없습니다. 그래서 이 자는 세우지 않습니다(exit 0). 짚기만 합니다.
 * ⛔ 노출 0인 지면의 설명을 고치는 것은 아직 값이 없습니다. **노출 받는 것부터** 짚습니다.
 *
 * ⚠ 자르는 자리는 화면 너비에 따라 달라집니다. 구글이 공식으로 밝힌 적이 없습니다.
 *   그래서 **한 자로 못박지 않고** 155자를 기본으로 두되 그 수를 짐작이라고 적습니다.
 *
 * 쓰는 법  node scripts/check-kcw-description-length.mjs --자가시험
 *          node scripts/check-kcw-description-length.mjs [--자리=155]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 지음방 = path.join(뿌리, 'dist/wikitip');
const 노출길 = path.join(뿌리, 'src/data/wikitip-ctr-gap.json');

/** html 에서 설명을 뽑는다. ⛔ 없으면 null — 빈 문자열과 다르다 */
export const 설명뽑기 = (본문) => {
  const m = String(본문 ?? '').match(/name="description" content="([^"]*)"/);
  return m ? m[1] : null;
};

/** 구글이 자르고 남는 앞부분 */
export const 잘린뒤 = (글, 자리 = 155) => String(글 ?? '').slice(0, 자리);

/**
 * 잘린 앞부분이 **무엇을 말하나**. 수 또는 뒤집는 말이 있으면 남은 것으로 본다.
 * ⛔ 「좋은 설명인가」를 판정하지 않는다. 읽는 사람이 무엇을 얻는지만 본다.
 * ⚠ 제목 쪽 자(`check-kcw-title-length`)와 같은 눈이다 — 두 곳이 갈리면 안 되니 말을 맞춘다.
 */
export function 논점남았나(글, 자리 = 155) {
  const 앞 = 잘린뒤(글, 자리);
  if (/\d/.test(앞)) return true;
  if (/\b(never|not|no|none|nobody|only|less|more|half|most|every|all|cannot|without)\b/i.test(앞)) return true;
  return false;
}

/** 노출표. ⛔ 없으면 빈 표 — 터지지 않는다 */
export function 노출표읽기(길 = 노출길) {
  try {
    const j = JSON.parse(fs.readFileSync(길, 'utf8'));
    const m = new Map();
    for (const r of j.rows ?? []) if (r.주소) m.set(String(r.주소), r.노출 ?? 0);
    return m;
  } catch { return new Map(); }
}

/** dist 파일 이름을 주소로 — `title/x.html` → `/title/x` */
export const 주소 = (f) => `/${String(f).replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '')}`;

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('설명을 뽑는다',
    설명뽑기('<meta name="description" content="Hello there"> ') === 'Hello there');
  검('⛔ 없으면 null', 설명뽑기('<meta name="keywords" content="x">') === null);
  검('잘린 앞부분을 준다', 잘린뒤('abcdefghij', 4) === 'abcd');

  검('수가 남으면 논점이 남았다', 논점남았나('93 countries took it in one week, and the rest never did') === true);
  검('뒤집는 말이 남으면 남았다',
    논점남았나('Netflix never says where a show is from, which is why this page exists') === true);
  검('⛔ 맹물이면 안 남았다',
    논점남았나('A look at the way Korean production companies are credited in the weekly lists we keep') === false);
  검('자르는 자리를 바꿀 수 있다', 논점남았나('xxxxx 5 more', 5) === false);
  검('⛔ 빈 값도 안 터진다', 논점남았나(null) === false && 잘린뒤(undefined) === '');

  검('주소로 바꾼다', 주소('title/stepmom.html') === '/title/stepmom');
  검('첫 화면도 바꾼다', 주소('index.html') === '/');
  const m = 노출표읽기(path.join(뿌리, '없는파일.json'));
  검('⛔ 노출표가 없으면 빈 표', m instanceof Map && m.size === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ check-kcw-description-length 자가시험 통과 (11)');
  process.exit(0);
}

if (!fs.existsSync(지음방)) {
  console.log('⬜ dist 가 없다 — 빌드한 뒤에 다시 부른다. **못 쟀다**');
  process.exit(0);
}

/* ⚠ 다른 유닛이 빌드 중이면 dist 가 반쯤 비어 있다. 그때는 못 쟀다고 말한다 */
const 있어야할갈래 = ['title', 'market', 'article'];
const 빠진 = 있어야할갈래.filter((d) => !fs.existsSync(path.join(지음방, d)));
if (빠진.length) {
  console.log(`⚠ 못 쟀다 — dist 가 다 안 찼다(갈래 ${빠진.join(', ')} 없음). 빌드가 도는 중일 수 있다.`);
  process.exit(0);
}

const 자리 = Number((process.argv.find((a) => a.startsWith('--자리='))?.split('=')[1]) ?? 155);
const 노출 = 노출표읽기();

const 파일들 = [];
const 걷는다 = (d, 앞 = '') => {
  for (const e of fs.readdirSync(path.join(지음방, d), { withFileTypes: true })) {
    const 안 = 앞 ? `${앞}/${e.name}` : e.name;
    if (e.isDirectory()) 걷는다(path.join(d, e.name), 안);
    else if (e.name.endsWith('.html')) 파일들.push(안);
  }
};
걷는다('.');

const 것들 = [];
for (const f of 파일들) {
  const 글 = 설명뽑기(fs.readFileSync(path.join(지음방, f), 'utf8'));
  if (글 === null) continue;
  const p = 주소(f);
  것들.push({ 주소: p, 길이: 글.length, 논점: 논점남았나(글, 자리), 앞: 잘린뒤(글, 자리), 노출: 노출.get(p) ?? 0 });
}

const 긴것 = 것들.filter((x) => x.길이 > 자리);
const 잘리면빈것 = 긴것.filter((x) => !x.논점);
const 노출받는빈것 = 잘리면빈것.filter((x) => x.노출 > 0).sort((a, b) => b.노출 - a.노출);
const 가운데 = [...것들].sort((a, b) => a.길이 - b.길이)[Math.floor(것들.length / 2)].길이;

console.log(`설명 길이 검사 — 지면 ${것들.length}장 · 자르는 자리 ${자리}자(짐작)`);
console.log(`  중간값 ${가운데}자 · 자리를 넘는 지면 ${긴것.length}장`);
console.log(`  그중 **잘리면 논점이 사라지는 것 ${잘리면빈것.length}장**  ← 여기만 고칠 값이 있다`);
console.log(`  그중 노출을 받고 있는 것 ${노출받는빈것.length}장  ← 먼저 고칠 것`);

if (노출받는빈것.length) {
  console.log('\n## 노출을 받는데 잘리면 아무 말도 안 하는 지면');
  for (const x of 노출받는빈것.slice(0, 12)) {
    console.log(`  노출 ${String(x.노출).padStart(3)} · ${String(x.길이).padStart(3)}자 · ${x.주소}`);
    console.log(`      «${x.앞}…»`);
  }
} else if (잘리면빈것.length) {
  console.log('\n## 아직 노출은 없지만 잘리면 논점이 사라지는 지면 (앞 여덟)');
  잘리면빈것.slice(0, 8).forEach((x) => console.log(`  ${x.주소}\n      «${x.앞}…»`));
}

console.log('\n⛔ 이 자는 세우지 않는다(exit 0).');
console.log('⛔ 「길다」와 「잘리면 뜻이 사라진다」는 다른 말이다 — 길이만 보고 다 고치러 가지 않는다.');
console.log('⚠ 구글은 설명을 제 마음대로 다시 쓰는 일이 잦다. 우리 글이 그대로 나간다는 보장이 없다.');
console.log(`⚠ ${자리}자는 짐작이다. 구글이 자르는 자리를 공식으로 밝힌 적이 없다.`);
