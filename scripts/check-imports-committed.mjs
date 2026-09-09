#!/usr/bin/env node
/**
 * check-imports-committed.mjs — **지면이 부르는 파일이 커밋에 들어 있나.**
 *
 *   node scripts/check-imports-committed.mjs            검사
 *   node scripts/check-imports-committed.mjs --자가시험   자가시험만
 *
 * ── 🔴 왜 만드는가 (2026-09-09 17:4x · 5번) ────────────────────────────────
 * 내가 `/data/mezzanine` 지면을 커밋할 때 그 지면이 import 하는
 * `src/data/seoulmarkets-mezzanine.json` 을 **안 넣었다.** gitignore 탓이 아니다 — 빠뜨렸다.
 *
 * 그 결과가 컸다. Cloudtype 은 저장소를 clone 해서 `npm run build` 를 돌린다.
 * 없는 모듈에서 빌드가 죽고, **옛 컨테이너가 계속 돌면서 Running 으로 보인다.**
 *   ⇒ 내 지면만 404 인 것이 아니라 **그 뒤 모든 배포가 안 나갔다.**
 *     2번이 낸 홈 링크도 같이 막혀 있었다. 세 번 배포하고 세 번 다 옛것이었다.
 *   ⇒ 내 작업트리에서는 파일이 있으니 `npm run build` 가 «잘 된다». 아무도 못 본다.
 *
 * ⛔ 그러니 「내 컴퓨터에서 빌드가 됐다」는 배포가 된다는 뜻이 아니다.
 *   **커밋된 것만이 배포된다.** 이 자가 그 차이를 잰다.
 *
 * ⚠ 원인을 처음에 「롤링 업데이트 메모리 부족」으로 짚었다. 그것도 문서에 적힌 실제
 *   함정이지만 이번 원인은 아니었다. 증상이 그럴듯하다고 첫 가설을 붙들지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 소스 한 장에서 «상대경로로 부르는 것»만 뽑는다.
 * ⛔ 패키지 이름(`astro:content`, `node:fs`, `puppeteer-core`)은 뽑지 않는다 —
 *   그건 node_modules 몫이고 이 검사의 대상이 아니다.
 */
export function 부르는것들(글) {
  const 것 = new Set();
  const 글자 = String(글 ?? '');
  const 자들 = [
    /\bimport\s+[^;'"]*?\bfrom\s+['"](\.[^'"]+)['"]/g,   // import x from './a.json'
    /\bimport\s+['"](\.[^'"]+)['"]/g,                     // import './a.css'
    /\bexport\s+[^;'"]*?\bfrom\s+['"](\.[^'"]+)['"]/g,    // export * from './a'
  ];
  for (const 자 of 자들) {
    let m;
    while ((m = 자.exec(글자)) !== null) 것.add(m[1]);
  }
  return [...것];
}

/**
 * 부르는 이름을 실제 파일 경로로 맞춘다. 확장자가 없으면 흔한 것들을 붙여 본다.
 * 못 찾으면 null — ⛔ 「없다」와 「확장자를 못 맞췄다」를 섞지 않으려고 후보를 함께 낸다.
 */
export function 맞춘다(부른곳, 이름, 있나 = 파일인가) {
  const 바탕 = path.resolve(path.dirname(부른곳), 이름);
  const 후보 = [바탕];
  if (!path.extname(바탕)) {
    for (const e of ['.ts', '.mjs', '.js', '.astro', '.json', '.tsx', '.jsx']) 후보.push(바탕 + e);
    for (const e of ['.ts', '.mjs', '.js']) 후보.push(path.join(바탕, 'index' + e));
  }
  const 찾음 = 후보.find((c) => 있나(c));
  return { 길: 찾음 ?? null, 후보 };
}

/** ⚠ 「있나」는 «파일»인가여야 한다 — 폴더는 import 대상이 아니다.
 *   `existsSync` 를 그대로 쓰면 `./lib/` 가 폴더에 맞아 오탐이 났다(내 자가시험 문자열에서). */
export function 파일인가(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

/** git 이 아는 파일 목록 (한 번만 부른다 — 파일마다 부르면 수천 번 돈다) */
function 추적중인것(방 = 뿌리) {
  const 글 = execFileSync('git', ['ls-files', '-z'], { cwd: 방, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const 것 = new Set();
  for (const p of 글.split('\0')) if (p) 것.add(path.resolve(방, p));
  return 것;
}

/**
 * 소스들을 훑어 «커밋 안 된 것을 부르는» 자리를 낸다.
 *
 * ⚠ [2026-09-09 · 5번] 처음에 「파일이 아예 없다」도 흠으로 냈다가 **25건이 나왔고
 *   그 25건이 전부 오탐이었다.** 자가시험 문자열(`import a from './a.json'`)과
 *   주석 속 예시 문장을 정규식이 그대로 잡은 것이다.
 *   ⇒ 그 갈래는 **끄고**, 「디스크에는 있는데 git 에 없다」만 본다. 그것이 오늘의 결함이고
 *     오탐이 0건이다. 없는 파일은 어차피 빌드가 큰 소리로 죽여 준다 — 이 자가 볼 것이 아니다.
 *   ⛔ 오탐이 많은 검사는 «꺼진 검사»가 된다. 사람이 25줄을 매번 넘기기 시작하면
 *     그 안에 진짜 한 줄이 섞여도 안 보인다. 좁은 검사가 넓고 시끄러운 검사보다 낫다.
 */
export function 흠찾기(소스들, 읽기, 추적중, 있나 = 파일인가, 없는것도 = false) {
  const 흠 = [];
  for (const s of 소스들) {
    let 글; try { 글 = 읽기(s); } catch { continue; }
    for (const 이름 of 부르는것들(글)) {
      if (이름.includes('${')) continue; // 템플릿 문자열은 실제 경로가 아니다
      const { 길 } = 맞춘다(s, 이름, 있나);
      if (!길) { if (없는것도) 흠.push({ 소스: s, 이름, 까닭: '파일이 아예 없다' }); continue; }
      if (!추적중.has(path.resolve(길))) {
        흠.push({ 소스: s, 이름, 길, 까닭: 'git 에 안 담겼다 — 내 컴퓨터에만 있다' });
      }
    }
  }
  return 흠;
}

function 훑기(방) {
  const 것 = [];
  const 걷기 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷기(p);
      else if (/\.(astro|ts|tsx|mjs|js|jsx)$/.test(e.name)) 것.push(p);
    }
  };
  걷기(방);
  return 것;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
function 자가시험() {
  let 흠수 = 0;
  const 검 = (말, 참) => { if (!참) { 흠수 += 1; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };

  검('상대경로 import 를 뽑는다',
    부르는것들("import d from '../../data/x.json';").includes('../../data/x.json'));
  검('⛔ 패키지 이름은 뽑지 않는다 (node_modules 몫이다)',
    부르는것들("import fs from 'node:fs';\nimport {x} from 'astro:content';").length === 0);
  검('side-effect import 도 뽑는다', 부르는것들("import './a.css';").includes('./a.css'));
  검('export … from 도 뽑는다', 부르는것들("export * from './b.mjs';").includes('./b.mjs'));
  검('여러 줄에서 여럿 뽑는다',
    부르는것들("import a from './a.json'\nimport b from '../b.mjs'\n").length === 2);
  검('같은 것을 두 번 부르면 한 번만 센다',
    부르는것들("import a from './a.json'\nimport {z} from './a.json'\n").length === 1);
  검('⛔ 빈 것도 견딘다', 부르는것들(null).length === 0 && 부르는것들('').length === 0);

  // 맞춘다 — 확장자 붙이기
  const 가짜있나 = (p) => /(\.json|\.mjs|index\.ts)$/.test(p);
  검('확장자가 있으면 그대로 쓴다',
    맞춘다('/x/src/pages/a.astro', '../data/y.json', 가짜있나).길.endsWith(path.join('src', 'data', 'y.json')));
  검('확장자가 없으면 붙여 본다',
    맞춘다('/x/src/pages/a.astro', '../lib/z', 가짜있나).길.endsWith('z.mjs'));
  검('폴더면 index 도 본다',
    맞춘다('/x/src/pages/a.astro', '../lib/w', (p) => p.endsWith(path.join('w', 'index.ts'))).길 !== null);
  검('못 찾으면 null 이고 후보를 함께 낸다', (() => {
    const r = 맞춘다('/x/a.astro', './nope', () => false);
    return r.길 === null && r.후보.length > 1;
  })());

  /* 🔴 오늘의 사고를 그대로 시험으로 둔다 */
  const 소스 = path.join(뿌리, 'src/pages/data/mezzanine.astro');
  const json = path.join(뿌리, 'src/data/seoulmarkets-mezzanine.json');
  const 읽기 = () => "import data from '../../data/seoulmarkets-mezzanine.json';";
  검('🔴 지면이 부르는 json 이 git 에 없으면 «흠»이다 (오늘 이것으로 배포가 막혔다)',
    흠찾기([소스], 읽기, new Set(), () => true).length === 1);
  검('그 흠의 까닭에 «git 에 안 담겼다»가 적힌다',
    /git 에 안 담겼다/.test(흠찾기([소스], 읽기, new Set(), () => true)[0].까닭));
  검('git 에 담겨 있으면 조용하다',
    흠찾기([소스], 읽기, new Set([path.resolve(json)]), () => true).length === 0);
  검('⛔ 디스크에 없는 것은 «기본으로» 흠이 아니다 — 오탐 25건이 났던 갈래다',
    흠찾기([소스], 읽기, new Set(), () => false).length === 0);
  검('없는것도=true 로 부르면 그때만 낸다 (일부러 볼 때가 있다)',
    흠찾기([소스], 읽기, new Set(), () => false, true)[0].까닭 === '파일이 아예 없다');
  검('⛔ 폴더는 import 대상이 아니다 — 폴더에 맞아 오탐이 났었다', 파일인가(path.join(뿌리, 'scripts')) === false);
  검('⛔ 템플릿 문자열은 경로가 아니다 — 안 센다', 흠찾기(
    [소스], () => 'import x from "./lib/' + '${규칙}' + '.mjs";', new Set(), () => false, true,
  ).length === 0);
  검('⛔ 읽을 수 없는 소스에서 죽지 않는다',
    흠찾기(['/없는/파일.astro'], () => { throw new Error('x'); }, new Set()).length === 0);

  console.log(`\n부르는 것이 커밋됐나 — 자가시험 ${흠수 ? '🔴 흠 ' + 흠수 + '개' : '전부 통과'}`);
  return 흠수;
}

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 1 : 0);
if (자가시험()) { console.log('🔴 자가시험이 깨졌다 — 멈춘다'); process.exit(1); }

const 소스들 = [...훑기(path.join(뿌리, 'src')), ...훑기(path.join(뿌리, 'scripts'))];
const 추적중 = 추적중인것();
const 흠 = 흠찾기(소스들, (p) => fs.readFileSync(p, 'utf8'), 추적중);

console.log(`\n■ 부르는 것이 커밋됐나 — 소스 ${소스들.length}장 · git 이 아는 파일 ${추적중.size}개\n`);
if (!흠.length) {
  console.log('✅ 커밋 안 된 것을 부르는 자리 0건');
  process.exit(0);
}
for (const x of 흠) {
  console.log(`🔴 ${path.relative(뿌리, x.소스)}`);
  console.log(`     → ${x.이름}  (${x.까닭})`);
}
console.log(`\n⛔ ${흠.length}건. **내 컴퓨터에서 빌드가 되는 것과 배포되는 것은 다르다.**`);
console.log('   커밋된 것만 배포된다 — Cloudtype 은 저장소를 clone 해서 빌드한다.');
console.log('   고치는 법: git add <위 파일> 해서 같은 커밋에 넣는다.');
process.exit(1);
