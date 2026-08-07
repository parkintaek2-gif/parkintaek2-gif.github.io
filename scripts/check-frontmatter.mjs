/**
 * check-frontmatter.mjs — 기사 frontmatter 의 길이 제한을 **빌드 전에** 잡는다.
 *
 * ── 왜 만들었나 ────────────────────────────────────────────────
 * 2026-08-06 하루에 **세 자리가 같은 데서 세 번** 막혔다.
 *   5번 korea-challenger-win-rate      dek 241자 → 빌드 중단
 *   5번 kpop-export-left-japan-behind  dek 248자 → 빌드 중단
 *   6번 korea-trade-surplus-not-china  dek 초과  → 빌드 중단
 * 2번 답신: **「세 자리가 같은 데서 세 번 막혔으면 그건 사람 문제가 아니라 검사가 없는 문제입니다」**
 *
 * astro 도 잡아 준다. 다만 **빌드를 30초 돌린 뒤에** 잡는다.
 * 이 검사는 1초 안에, `npm test` 에서 먼저 잡는다.
 *
 * ── 한도는 스키마에서 읽는다 ───────────────────────────────────
 * `src/content.config.ts` 의 `.max(...)` 를 그대로 읽는다. 숫자를 두 곳에 적으면
 * 한쪽만 고쳤을 때 검사가 조용히 헛돈다 — 시험이 헛도는 사례를 이 저장소에서 네 번 겪었다.
 *
 * ── ⛔ 남의 파일을 고쳐 통과시키지 않는다 (2번 조건 ③) ──────────
 * 걸리면 **걸린 채로 알린다.** 이 스크립트는 아무 파일도 고치지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-frontmatter.mjs              전부 검사
 *   node scripts/check-frontmatter.mjs --selftest   검사가 실제로 잡는지 먼저 증명
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 검사할 곳. 컬렉션 이름 → 폴더 */
const 대상 = [
  { 컬렉션: 'articles', 폴더: 'content/articles', 매체: 'SeoulMarkets' },
  { 컬렉션: 'kcwArticles', 폴더: 'content/kculturewire', 매체: 'K Culture Wire' },
];

/**
 * frontmatter 를 아주 얕게 읽는다. YAML 파서를 붙이지 않는 이유 —
 * 우리가 보는 것은 **한 줄짜리 따옴표 문자열 두 개**뿐이고,
 * 파서를 새로 들이면 의존성이 늘고 그 파서가 또 다른 함정을 만든다.
 * ⚠ 여러 줄 값(`>` `|`)을 쓰면 이 검사가 못 본다. 그래서 그 형태를 만나면 **경고**한다.
 */
export function 앞말읽기(원문) {
  const m = 원문.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { 없음: true, 값: {}, 여러줄: [] };
  const 값 = {};
  const 여러줄 = [];
  for (const 줄 of m[1].split(/\r?\n/)) {
    const kv = 줄.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, raw] = kv;
    if (raw === '>' || raw === '|' || raw === '>-' || raw === '|-') { 여러줄.push(k); continue; }
    const q = raw.match(/^"([\s\S]*)"\s*$/) || raw.match(/^'([\s\S]*)'\s*$/);
    if (q) 값[k] = q[1];
    else if (raw && !raw.startsWith('[') && !raw.startsWith('{')) 값[k] = raw.trim();
  }
  return { 없음: false, 값, 여러줄 };
}

/** 스키마에서 한도를 읽는다. 못 읽으면 **추측하지 않고 실패**한다. */
async function 한도읽기() {
  const src = await readFile(path.join(ROOT, 'src', 'content.config.ts'), 'utf8');
  const out = {};
  for (const 필드 of ['title', 'dek']) {
    const re = new RegExp(`${필드}:\\s*z\\.string\\(\\)\\.max\\((\\d+)\\)`, 'g');
    const 값들 = [...src.matchAll(re)].map((x) => Number(x[1]));
    if (!값들.length) throw new Error(`content.config.ts 에서 ${필드} 의 .max() 를 못 찾았다`);
    // 두 컬렉션이 다른 값을 쓰면 **작은 쪽**으로 잡는다. 넉넉히 잡아 놓치는 것보다 낫다
    out[필드] = Math.min(...값들);
  }
  return out;
}

/**
 * 컬렉션별 **갈래 목록**을 스키마에서 읽는다.
 *
 * ⚠ 2026-08-07: 5번 기사 하나가 `category: attention` 로 나갔다. 그 갈래는 없다.
 *   **저장소 전체 빌드가 멈췄고 여섯 자리가 40분 동안 아무것도 못 냈다.**
 *   길이는 이 파일에서 잡았는데 갈래는 안 봤다 — 같은 자리에서 1초면 잡혔을 것이다.
 *
 * ⛔ 갈래 이름을 여기 손으로 적지 않는다. 스키마가 늘면 이 검사가 조용히 헛돈다.
 *    두 컬렉션이 **다른** 목록을 쓰므로(금융 축 · K컬처 축) 컬렉션별로 읽는다.
 */
async function 갈래읽기() {
  const src = await readFile(path.join(ROOT, 'src', 'content.config.ts'), 'utf8');
  const out = {};
  for (const t of 대상) {
    const 표 = `const ${t.컬렉션} = defineCollection(`;
    const 시작 = src.indexOf(표);
    if (시작 < 0) throw new Error(`content.config.ts 에서 ${t.컬렉션} 을 못 찾았다`);
    /* 다음 컬렉션 선언 전까지가 이 컬렉션의 몸이다. 마지막이면 파일 끝까지.
       ⛔ 시작+1 부터 찾으면 **자기 자신**이 다시 잡힌다. 표 길이만큼 건너뛴다. */
    const 다음 = src.indexOf('defineCollection(', 시작 + 표.length);
    const 몸 = src.slice(시작, 다음 < 0 ? undefined : 다음);
    const m = 몸.match(/category:\s*z\.enum\(\[([^\]]*)\]\)/);
    if (!m) throw new Error(`${t.컬렉션} 에서 category 의 z.enum() 을 못 찾았다`);
    out[t.컬렉션] = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
    if (!out[t.컬렉션].length) throw new Error(`${t.컬렉션} 의 갈래 목록이 비었다`);
  }
  return out;
}

/** 한 편을 검사한다. 고치지 않는다 — 위반 목록만 돌려준다 */
export function 한편검사({ 이름, 원문, 한도, 갈래 }) {
  const 위반 = [];
  const { 없음, 값, 여러줄 } = 앞말읽기(원문);
  if (없음) { 위반.push({ 이름, 필드: '(frontmatter)', 말: '--- 로 감싼 앞말이 없다' }); return 위반; }
  /* 갈래 — 스키마에 없는 값이면 **저장소 전체 빌드가 멈춘다.** 여기서 1초에 잡는다. */
  if (갈래) {
    const c = 값.category;
    if (c === undefined) 위반.push({ 이름, 필드: 'category', 말: '없다' });
    else if (!갈래.includes(c)) {
      위반.push({ 이름, 필드: 'category', 말: `'${c}' 는 없는 갈래다 — 쓸 수 있는 것: ${갈래.join(' · ')}` });
    }
  }
  for (const 필드 of Object.keys(한도)) {
    if (여러줄.includes(필드)) {
      위반.push({ 이름, 필드, 말: `여러 줄 값이라 길이를 못 쟀다. 한 줄 따옴표로 적는다` });
      continue;
    }
    const v = 값[필드];
    if (v === undefined) { 위반.push({ 이름, 필드, 말: '없다' }); continue; }
    if (v.length > 한도[필드]) {
      위반.push({ 이름, 필드, 말: `${v.length}자 — 한도 ${한도[필드]}자를 ${v.length - 한도[필드]}자 넘었다` });
    }
  }
  return 위반;
}

/** 검사가 **실제로 잡는지** 먼저 증명한다. 이게 없으면 시험이 헛돌 수 있다 */
function 자가시험() {
  const 한도 = { title: 120, dek: 240 };
  const 앞 = (t, d) => `---\ntitle: "${t}"\ndek: "${d}"\ncategory: people\n---\n본문`;
  const 예 = [
    { 말: '한도 안 — 통과해야 한다', 원문: 앞('가'.repeat(10), '나'.repeat(10)), 기대: 0 },
    { 말: '딱 한도 — 통과해야 한다', 원문: 앞('가'.repeat(120), '나'.repeat(240)), 기대: 0 },
    { 말: 'dek 한 자 초과 — 걸려야 한다', 원문: 앞('가', '나'.repeat(241)), 기대: 1 },
    { 말: 'title 초과 — 걸려야 한다', 원문: 앞('가'.repeat(121), '나'), 기대: 1 },
    { 말: '둘 다 초과 — 두 건이어야 한다', 원문: 앞('가'.repeat(121), '나'.repeat(241)), 기대: 2 },
    { 말: 'dek 없음 — 걸려야 한다', 원문: `---\ntitle: "가"\n---\n본문`, 기대: 1 },
    { 말: '앞말 없음 — 걸려야 한다', 원문: '본문만 있다', 기대: 1 },
    { 말: '여러 줄 dek — 못 쟀다고 걸려야 한다', 원문: `---\ntitle: "가"\ndek: >\n  여러 줄\n---\n본문`, 기대: 1 },
    // ⚠ 한글·이모지는 UTF-16 단위로 센다. zod 도 같은 자로 세므로 자가 어긋나지 않는다
    { 말: '한글 240자 — 통과해야 한다', 원문: 앞('가', '한'.repeat(240)), 기대: 0 },
  ];
  let 실패 = 0;
  for (const e of 예) {
    const n = 한편검사({ 이름: '(자가시험)', 원문: e.원문, 한도 }).length;
    if (n !== e.기대) { console.log(`  ⛔ 자가시험 실패 — ${e.말}: ${e.기대} 기대, ${n} 나옴`); 실패++; }
  }

  /* 갈래 검사도 **실제로 잡는지** 본다. 위 예들은 갈래를 안 넘겨 건너뛰므로 따로 시험한다. */
  const 갈래예 = [
    { 말: '있는 갈래 — 통과해야 한다', 원문: 앞('가', '나'), 갈래: ['screen', 'music', 'people'], 기대: 0 },
    { 말: '없는 갈래 — 걸려야 한다', 원문: 앞('가', '나'), 갈래: ['screen', 'music'], 기대: 1 },
    { 말: '갈래 없음 — 걸려야 한다', 원문: `---\ntitle: "가"\ndek: "나"\n---\n본문`, 갈래: ['people'], 기대: 1 },
    // ⛔ 갈래 목록을 안 넘기면 갈래를 **안 본다.** 옛 부름말이 조용히 헛돌지 않는지 확인한다
    { 말: '갈래 목록 없이 부르면 갈래는 안 본다', 원문: 앞('가', '나'), 갈래: undefined, 기대: 0 },
  ];
  for (const e of 갈래예) {
    const n = 한편검사({ 이름: '(자가시험)', 원문: e.원문, 한도, 갈래: e.갈래 }).length;
    if (n !== e.기대) { console.log(`  ⛔ 자가시험 실패 — ${e.말}: ${e.기대} 기대, ${n} 나옴`); 실패++; }
  }

  console.log(`앞말 검사 — 자가시험 ${예.length + 갈래예.length}건 중 ${예.length + 갈래예.length - 실패}건 통과`);
  return 실패;
}

async function main() {
  const 자가 = process.argv.includes('--selftest');
  if (자가시험() > 0) { process.exitCode = 1; return; }
  if (자가) return;

  const 한도 = await 한도읽기();
  const 갈래 = await 갈래읽기();
  const 위반 = [];
  let 셈 = 0;
  for (const t of 대상) {
    let 파일들;
    try { 파일들 = (await readdir(path.join(ROOT, t.폴더))).filter((f) => f.endsWith('.md')); }
    catch { continue; }                       // 폴더가 아직 없으면 건너뛴다
    for (const f of 파일들) {
      셈++;
      const 원문 = await readFile(path.join(ROOT, t.폴더, f), 'utf8');
      위반.push(...한편검사({ 이름: `${t.폴더}/${f}`, 원문, 한도, 갈래: 갈래[t.컬렉션] }));
    }
  }

  console.log(`앞말 검사 — 기사 ${셈}편 (title ≤${한도.title} · dek ≤${한도.dek} · 갈래는 스키마에서 읽음)`);
  if (!위반.length) { console.log('✅ 넘은 곳 0건'); return; }
  for (const v of 위반) console.log(`  ⛔ ${v.이름}  [${v.필드}]  ${v.말}`);
  console.log(`\n⛔ ${위반.length}건 — **빌드가 여기서 멈춘다.** 앞말을 줄이고 다시 돌린다.`);
  console.log('   ⚠ 남의 기사가 걸렸으면 고치지 말고 그 자리에 알린다.');
  process.exitCode = 1;
}

main();
