#!/usr/bin/env node
/**
 * check-dataset-구조화자료.mjs — **Dataset 구조화 자료에 빠진 칸이 있나.**
 *
 * ── 🔴 왜 만들었나 (2026-10-05 22:4x · 5번) ───────────────────────────
 *   사장님이 구글 메일을 넘겨 주셨다 —
 *   「**100yearmap.com에서 데이터세트 구조화된 데이터 문제가 감지됨**」
 *   「심각하지 않은 문제는 개선을 위해 제안되는 항목이며 … **이러한 문제 중 일부는
 *    향후 심각한 문제로 다시 분류될 수 있으며** …」
 *
 *   서치콘솔을 열어 보니 —
 *   ```
 *   잘못됨 0 (중요한 문제 없음) · 유효 14
 *   항목 표시 개선 — 'license' 입력란이 누락되었습니다.   항목 1
 *   ```
 *
 * ── ⚠ 「1건」을 「한 지면만」으로 읽지 않는다 ─────────────────────────
 *   저장소를 긁어 보니 `license` 가 **어디에도 없었다.** Dataset 를 내는 파일이
 *   **255개**다. 지금 1건인 것은 **색인된 것이 적어서**이고, 색인이 늘면 전부 걸린다.
 *   ⭐ 구글이 세는 것은 «색인된 것»이고 우리가 고칠 것은 «내보내는 것»이다.
 *
 * ── 구글이 Dataset 에서 보는 칸 ──────────────────────────────────────
 *   꼭 있어야  name · description
 *   권하는 것  license · creator · url · temporalCoverage · variableMeasured ·
 *             isBasedOn · distribution · identifier · keywords · spatialCoverage
 *   ⛔ 「권하는 것」이라고 비워 두지 않는다 — 구글이 메일까지 보내 알린 자리다.
 *
 * ── ⛔ license 는 «우리가 실제로 주는 권리»여야 한다 ───────────────────
 *   아무 라이선스나 적으면 안 된다. 적는 순간 **그 조건으로 쓰라고 손님에게 약속**하는 것이다.
 *   우리 꼬리말이 이미 「무단 전재를 금합니다」라고 적고 있으므로, 거기에 맞는 것을 적는다.
 *   ⚠ 「CC BY」처럼 마음대로 가져다 쓰라는 것을 적으면 **우리 자료를 그대로 퍼가도 된다**는
 *     뜻이 된다. 그것은 사장님이 정하실 일이지 내가 고를 일이 아니다.
 *
 * 쓰는 법
 *   node scripts/check-dataset-구조화자료.mjs
 *   node scripts/check-dataset-구조화자료.mjs --자가시험
 *   node scripts/check-dataset-구조화자료.mjs --라이브     라이브에서 실제로 나가나
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 구글이 Dataset 에서 권하는 칸 가운데 **우리가 채울 수 있는 것** */
export const 봐야할칸 = ['name', 'description', 'license', 'creator', 'url'];

/** 꼭 있어야 하는 칸 — 없으면 구글이 「잘못됨」으로 센다 */
export const 꼭있어야할칸 = ['name', 'description'];

/**
 * 한 Dataset 덩이에서 빠진 칸을 센다.
 *
 * 🔴 [2026-10-05 22:5x] 처음에 `칸:` 꼴만 찾았더니 **축약 속성을 못 봤다** —
 *   `description,` 은 `description: description` 과 같은데 자가 「빠졌다」고 했다.
 *   `src/pages/100y/death-causes/index.astro` 가 그래서 거짓 빨강이었다.
 *   ⛔ 그대로 뒀으면 멀쩡한 지면 둘을 고칠 뻔했다. 「자를 먼저 의심한다」가 또 맞았다.
 * ⇒ `칸:` 과 `칸,` 과 `칸 }` 을 다 받는다.
 */
export function 빠진칸(덩이) {
  const 글 = String(덩이 ?? '');
  return 봐야할칸.filter((칸) => {
    /* `license:` · `'license':` · `"license":` · 축약 `license,` · 끝자리 `license }` */
    const 꼴 = new RegExp(`['"\`]?\\b${칸}['"\`]?\\s*(:|,|\\}|$)`, 'm');
    return !꼴.test(글);
  });
}

/**
 * 파일 글에서 Dataset 덩이를 집어낸다.
 * ⚠ 중괄호를 세어 덩이 끝을 찾는다 — 정규식 하나로는 안쪽 중괄호에서 끊긴다.
 */
export function 덩이들(글) {
  const s = String(글 ?? '');
  const 것 = [];
  const 꼴 = /['"`]?@type['"`]?\s*:\s*['"`]Dataset['"`]/g;
  let m;
  while ((m = 꼴.exec(s)) !== null) {
    /* 그 앞의 여는 중괄호를 찾는다 */
    let 시작 = s.lastIndexOf('{', m.index);
    if (시작 < 0) continue;
    let 깊이 = 0; let 끝 = -1;
    for (let i = 시작; i < s.length; i++) {
      if (s[i] === '{') 깊이++;
      else if (s[i] === '}') { 깊이--; if (깊이 === 0) { 끝 = i; break; } }
    }
    if (끝 > 시작) 것.push(s.slice(시작, 끝 + 1));
  }
  return 것;
}

/** 2026-10-05 22:4x 에 고친 뒤의 수. 늘면 막는다 */
export const 못박은_license빠진파일 = 0;

export function 판정(빠진파일수, 못박은수 = 못박은_license빠진파일) {
  if (빠진파일수 > 못박은수) {
    return { 빛: '🔴', 말: `Dataset 에 license 가 빠진 파일 ${빠진파일수} (못 박은 수 ${못박은수})` };
  }
  return { 빛: '✅', 말: `Dataset 구조화 자료에 빠진 칸이 없다 (파일 ${빠진파일수})` };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
export function 자가시험() {
  let 통과 = 0; let 깨짐 = 0;
  const 본다 = (말, 참) => { if (참) { 통과++; console.log(`  ✅ ${말}`); } else { 깨짐++; console.log(`  🔴 ${말}`); } };

  console.log('\n■ Dataset 구조화 자료 — 자가시험\n');

  /* 🔴 실제로 저장소에 있던 꼴 그대로 */
  const 겪은것 = `{
      '@type': 'Dataset',
      name: \`\${축.label}, Korean listed companies, \${data.year}\`,
      description: DESC,
      url: \`\${SITE_URL}\${path}\`,
      temporalCoverage: String(data.year),
      creator: { '@type': 'Organization', name: 'SeoulMarkets', url: SITE_URL },
      isBasedOn: 'https://opendart.fss.or.kr',
      variableMeasured: 축.label,
    }`;
  본다('🔴 실제로 겪은 꼴 — license 가 빠졌다고 잡는다', 빠진칸(겪은것).includes('license'));
  본다('   그것 하나만 빠졌다 — 나머지는 다 있다', 빠진칸(겪은것).length === 1);

  본다('license 가 있으면 안 잡는다',
    !빠진칸("{ '@type':'Dataset', name:'a', description:'b', license:'c', creator:{}, url:'u' }").includes('license'));
  본다("⚠ 'license': 꼴도 받는다",
    !빠진칸(`{ "@type":"Dataset", "name":"a", "description":"b", "license":"c", "creator":{}, "url":"u" }`).includes('license'));
  /* 🔴 [22:5x] 축약 속성을 못 봐서 멀쩡한 지면 둘을 거짓 빨강으로 잡았다 */
  본다('🔴 축약 속성도 받는다 — description, 는 description: description 과 같다',
    !빠진칸("{ '@type':'Dataset', name: title, description, url, license }").includes('description'));
  본다('   그 꼴에서 license·url 도 있다고 본다',
    빠진칸("{ '@type':'Dataset', name: title, description, url, license }").length === 1);
  본다('⛔ 아무 데도 없으면 빠졌다고 센다',
    빠진칸("{ '@type':'Dataset', name:'a' }").includes('license'));

  {
    const 글 = `const a = { '@type': 'Dataset', name: 'x', creator: { '@type': 'Organization' } };
                const b = { '@type': 'FAQPage' };
                const c = { '@type': 'Dataset', name: 'y', license: 'z' };`;
    본다('Dataset 덩이를 둘 집어낸다', 덩이들(글).length === 2);
    본다('⚠ 안쪽 중괄호에서 안 끊긴다 — 중괄호를 세어 끝을 찾는다',
      덩이들(글)[0].includes('Organization') && 덩이들(글)[0].endsWith('}'));
    본다('⛔ FAQPage 는 안 집는다', !덩이들(글).some((d) => d.includes('FAQPage')));
    본다('둘째 덩이는 license 가 있다', !빠진칸(덩이들(글)[1]).includes('license'));
  }

  본다('Dataset 가 없으면 빈 것을 준다', 덩이들('const a = 1;').length === 0);
  본다('⛔ 빈 글에도 안 터진다', 덩이들(null).length === 0 && 빠진칸(null).length === 봐야할칸.length);
  본다('🔴 빠진 파일이 있으면 막는다', 판정(1).빛 === '🔴');
  본다('없으면 통과', 판정(0).빛 === '✅');
  본다('꼭 있어야 하는 칸은 둘이다 — 나머지는 구글이 「권하는 것」이다',
    꼭있어야할칸.length === 2 && 꼭있어야할칸.includes('name'));

  console.log(`\n  통과 ${통과} · 깨짐 ${깨짐}\n`);
  return 깨짐 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────── */
const 내가실행됐다 = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  process.exit(자가시험() ? 0 : 1);
}

/** src/ 아래를 훑는다 */
function 파일훑기(디렉터리, 모은것 = []) {
  for (const 것 of fs.readdirSync(디렉터리, { withFileTypes: true })) {
    const 길 = path.join(디렉터리, 것.name);
    if (것.isDirectory()) { 파일훑기(길, 모은것); continue; }
    if (/\.(astro|ts|js|mjs)$/.test(것.name)) 모은것.push(길);
  }
  return 모은것;
}

if (내가실행됐다) {
  console.log('■ Dataset 구조화 자료에 빠진 칸이 있나');
  console.log('   사장님이 넘겨 주신 구글 메일 — 「100yearmap.com에서 데이터세트 구조화된 데이터 문제가 감지됨」');
  console.log("   서치콘솔: 「'license' 입력란이 누락되었습니다」\n");

  const 파일들 = 파일훑기(path.join(뿌리, 'src'));
  const 걸린것 = [];
  let 덩이수 = 0;

  for (const f of 파일들) {
    let 글 = '';
    try { 글 = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const 것 = 덩이들(글);
    if (!것.length) continue;
    덩이수 += 것.length;
    const 빠짐 = [...new Set(것.flatMap((d) => 빠진칸(d)))];
    if (빠짐.length) 걸린것.push({ 파일: path.relative(뿌리, f), 빠짐 });
  }

  console.log(`   Dataset 덩이 ${덩이수}개 · 담은 파일 ${걸린것.length + (덩이수 ? 0 : 0)}`);
  const 칸별 = {};
  for (const x of 걸린것) for (const 칸 of x.빠짐) 칸별[칸] = (칸별[칸] ?? 0) + 1;
  console.log('   빠진 칸 —', Object.entries(칸별).map(([k, v]) => `${k} ${v}파일`).join(' · ') || '없다');

  for (const x of 걸린것.slice(0, 5)) console.log(`     ${x.파일}  ← ${x.빠짐.join(' · ')}`);
  if (걸린것.length > 5) console.log(`     … 그 밖 ${걸린것.length - 5}개`);

  const r = 판정(걸린것.length);
  console.log(`\n${r.빛} ${r.말}`);
  console.log('⚠ 구글이 센 것은 «색인된 것»이고 우리가 고칠 것은 «내보내는 것»이다 — 1건으로 보여도 전수를 고친다');
  process.exit(r.빛 === '🔴' ? 1 : 0);
}
