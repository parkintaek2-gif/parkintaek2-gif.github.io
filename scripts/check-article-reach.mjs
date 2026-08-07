/**
 * 기사가 **어느 지면에서도 못 닿는 채로** 나가는 것을 막는다. (npm test)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-07, 기사 12편 중 **7편이 아무 지면에도 안 걸려** 있었다.
 * 첫 화면은 최신 3편만 세우고 사이트맵에는 있지만,
 * **사람이 검색해서 들어오는 자리는 지면**이다. 만들고 문을 안 내면 없는 것과 같다.
 *
 * 관계는 기사 앞말 `pages` 에 있고 지면은 그것을 읽는다(KcwRelatedArticles).
 * 이 검사는 그 사슬이 끊긴 곳을 찾는다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * ① 기사의 `pages` 에 적힌 주소에 지면 파일이 실제로 있나
 * ② 그 지면이 KcwRelatedArticles 를 걸고 있나 — 안 걸면 적어도 안 보인다
 * ③ `pages` 가 빈 기사가 있나 — 경고만 한다. 「어느 지면 자료도 안 썼다」가 참일 수 있다
 *
 * ⛔ 기사 내용이 그 지면과 맞는지는 **안 본다.** 그건 사람이 할 일이다.
 *    여기서 하는 말은 **닿을 수 있나**뿐이다.
 *
 * 남의 기사·지면이 걸리면 고치지 말고 그 자리에 알린다.
 */
import fs from 'node:fs';
import path from 'node:path';

const CD = 'content/kculturewire';
const PD = 'src/pages/wikitip';

const 문제 = [];
const 경고 = [];

/** 앞말에서 pages 목록을 뽑는다. 컬렉션을 안 거치고 글자로 읽는다 — 빌드 없이 돌아야 한다. */
const pages를읽는다 = (src) => {
  const m = src.match(/^pages:\s*\n((?:\s+-\s+.*\n)+)/m);
  if (!m) return null;
  return [...m[1].matchAll(/-\s+"?([^"\n]+?)"?\s*$/gm)].map((x) => x[1].trim());
};

const 기사들 = fs.readdirSync(CD).filter((f) => f.endsWith('.md'));
const 지면본문 = new Map(
  fs.readdirSync(PD).filter((f) => f.endsWith('.astro'))
    .map((f) => [f, fs.readFileSync(path.join(PD, f), 'utf8')]),
);
const 지면파일 = (주소) => (주소 === '/' ? 'index.astro' : `${주소.replace(/^\//, '')}.astro`);

let 닿는기사 = 0;
for (const f of 기사들) {
  const src = fs.readFileSync(path.join(CD, f), 'utf8');
  if (/^draft:\s*true/m.test(src)) continue;
  const slug = f.replace(/\.md$/, '');
  const pages = pages를읽는다(src);

  if (!pages || !pages.length) {
    경고.push(`${slug} — pages 가 비었다. 어느 지면에서도 안 보인다(첫 화면 최신 3편은 예외)`);
    continue;
  }
  let 하나라도보임 = false;
  for (const 주소 of pages) {
    const pf = 지면파일(주소);
    if (!지면본문.has(pf)) { 문제.push(`${slug} — pages 의 '${주소}' 에 해당하는 지면이 없다`); continue; }
    if (!지면본문.get(pf).includes('KcwRelatedArticles')) {
      문제.push(`${pf} — 기사가 이 지면을 가리키는데 KcwRelatedArticles 를 안 걸었다. 지면에 안 보인다`);
      continue;
    }
    하나라도보임 = true;
  }
  if (하나라도보임) 닿는기사++;
}

/* ── 자가시험 ── 안 잡는 검사는 통과를 못 믿는다. */
if (process.argv.includes('--selftest')) {
  const 시험 = [
    ['따옴표 있는 목록을 읽는다', 'pages:\n  - "/watched"\n  - "/exports"\n', ['/watched', '/exports']],
    ['따옴표 없는 목록도 읽는다', 'pages:\n  - /watched\n', ['/watched']],
    ['pages 가 없으면 null', 'tags: ["a"]\n', null],
    ['빈 pages 는 null', 'pages:\n', null],
    ['다음 칸에서 멈춘다', 'pages:\n  - "/a"\nsources:\n  - org: "x"\n', ['/a']],
  ];
  let 통과 = 0;
  for (const [이름, src, 기대] of 시험) {
    const got = pages를읽는다(src);
    if (JSON.stringify(got) === JSON.stringify(기대)) 통과++;
    else console.log(`  ❌ 자가시험 실패: ${이름} — 나온 것 ${JSON.stringify(got)}`);
  }
  console.log(`기사 닿음 검사 — 자가시험 ${시험.length}건 중 ${통과}건 통과`);
  if (통과 !== 시험.length) process.exit(1);
}

console.log(`기사 닿음 검사 — 기사 ${기사들.length}편 중 지면에서 닿는 것 ${닿는기사}편`);
if (경고.length) 경고.forEach((m) => console.log(`   ⚠ ${m}`));
if (문제.length) {
  console.log(`❌ ${문제.length}건`);
  문제.forEach((m) => console.log(`   ${m}`));
  console.log('   만들고 문을 안 내면 없는 것과 같다. 남의 것이면 고치지 말고 알린다.');
  process.exit(1);
}
console.log('✅ 기사가 가리킨 지면이 전부 있고, 전부 기사를 걸고 있다');
