/**
 * build-kcw-schools.mjs — **학교별 지면 자료.** (`/school/school-of-performing-arts-seoul`)
 *
 * ── 🔴 왜 이 자료가 생겼나 ─────────────────────────────────────
 * 사장님 지시: 「**키워드 검색량을 재서 해.**」 2026-08-25 새벽에 재니 —
 * ```
 *   school of performing arts seoul   자동완성 1번째 · 그 말로 시작 10줄
 *   hanlim multi art school           자동완성 1번째 · 그 말로 시작 10줄
 *   kpop idols school                 자동완성 1번째 · 그 말로 시작 5줄
 *
 *   kpop idols height                 자동완성 1번째 · 10줄   ← 수요는 이쪽이 더 컸다
 * ```
 * ⭐ **키는 수요가 컸는데 «안 만들었다».** 위키데이터에 키가 적힌 한국 연예인이
 *   9,249명 중 320명(3.5%)뿐이라, 「가장 큰 사람」을 우리가 낼 수 없기 때문이다.
 *   3.5% 로 만든 「가장 큰 아이돌」 지면은 **틀린 답을 자신 있게 내는 지면**이 된다.
 *   수요가 크다고 만들지 않는다 — 잰 자료가 답할 수 있을 때만 만든다. 이것을 여기 적어 둔다.
 *
 * ── ⛔ 이 지면이 반드시 같이 말해야 하는 것 — «분모가 명부가 아니다» ──
 * ```
 *   명부 전체            9,249명
 *   학교가 «적힌» 사람    4,535명  (49%)
 *   학교가 «안 적힌» 사람  4,714명  ⛔ 학교를 «안 다닌» 것이 아니다. «모르는» 것이다
 * ```
 * 그러니 「서울예대 408명」은 **「우리가 세어 408명」**이지 「서울예대를 나온 연예인이
 * 408명」이 아니다. 지면마다 이 문장을 적는다. 이 문장이 빠지면 그 수는 틀린 수가 된다.
 *
 * ⛔ **학교끼리 줄 세우지 않는다.** 수가 큰 것은 학교 규모·설립 연도·위키데이터 편집자의
 *   손이 함께 만든 것이고 우리는 그 셋을 못 가른다. 「최고의 연예인 학교」를 안 쓴다.
 * ⛔ 사람 이름 순서를 «인기 순»이라고 부르지 않는다 — 위키백과 언어판 수는 「얼마나 널리
 *   적혔나」이지 「얼마나 좋은가」가 아니고, 오래 유명했던 쪽에 유리하다.
 * ⛔ 수를 이 스크립트 밖에서 다시 세지 않는다. 지면은 이 파일만 읽는다.
 *
 * 쓰는 법  node scripts/build-kcw-schools.mjs --자가시험
 *          node scripts/build-kcw-schools.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 명부길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 학교길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-school.json');
const 낼길 = path.join(뿌리, 'src/data/wikitip-schools.json');

/**
 * 지면을 낼 최소 인원. **열 명짜리 지면은 안 낸다** — 손님이 열고 나서 「이게 다야?」가
 * 되는 지면은 안 여는 것만 못하다.
 * ⛔ 이 선을 넘지 못한 학교를 «지운» 것이 아니다. 세기는 세고 몇 개를 안 냈는지 적는다.
 */
export const 최소인원 = 15;

/** 지면에 이름을 몇 개까지 적나 */
export const 이름칸 = 30;

/**
 * 사람별 학교 목록을 학교별로 뒤집는다.
 * ⚠ 한 사람이 학교를 둘 다녔으면 **두 학교에 다 선다.** 그래서 학교 인원을 다 더하면
 *   사람 수보다 크다 — 그 둘을 같은 수인 것처럼 적지 않는다.
 */
export function 뒤집는다(사람들, 명부맵) {
  const 학교 = new Map();
  let 명부에없는사람 = 0;
  for (const p of 사람들 ?? []) {
    const 정보 = 명부맵.get(p.q);
    if (!정보) { 명부에없는사람++; continue; }
    for (const s of p.schools ?? []) {
      if (!학교.has(s.q)) 학교.set(s.q, { q: s.q, name: s.name, slug: s.slug, people: [] });
      학교.get(s.q).people.push(정보);
    }
  }
  return { 학교, 명부에없는사람 };
}

/**
 * 이름을 어떻게 세우나 — 위키백과 언어판 수가 많은 쪽부터.
 * ⛔ 이것을 «인기 순»이라고 부르지 않는다. 지면에도 그렇게 안 적는다.
 * ⚠ 언어판 수가 같으면 이름 순으로 갈라 «돌릴 때마다 순서가 바뀌지 않게» 한다.
 */
export function 이름세우기(사람들) {
  return [...사람들].sort((a, b) => (b.sitelinks ?? 0) - (a.sitelinks ?? 0)
    || String(a.name).localeCompare(String(b.name)));
}

/**
 * 이 이름을 **영문 지면에 쓸 수 있나.**
 *
 * 🔴 2026-08-25 — `check-english-only.mjs` 가 학교 지면 **32장**에서 한글 이름을 찾아냈다.
 *   `강민규 (배우) 1988` 같은 줄이 영어 손님 화면에 그대로 나가고 있었다.
 *   ⛔ 학교 «이름»에는 이 검사를 걸어 두고 사람 «이름»에는 안 걸어 둔 것이 까닭이다.
 *      한쪽만 거는 검사는 검사가 아니다.
 * ⛔ 그렇다고 그 사람을 **명단에서 빼지 않는다** — 학교 인원 수는 그대로다.
 *   이름을 «못 쓰는» 것이지 그 사람이 «없는» 것이 아니다. 그 수를 따로 적는다.
 */
export function 영문으로쓸수있나(이름) {
  const t = String(이름 ?? '').trim();
  if (!t) return false;
  if (/^Q\d+$/.test(t)) return false;
  if (/[가-힣]/.test(t)) return false;
  return /[A-Za-z]/.test(t);
}

/** 태어난 해만 — 지면에 날짜를 통째로 적을 자리가 아니다 */
export function 태어난해(born) {
  const m = String(born ?? '').match(/^(\d{4})/);
  return m ? Number(m[1]) : null;
}

/**
 * 슬러그가 겹치면 지면 하나가 다른 하나를 «조용히» 덮는다.
 * 오늘 새벽에 파일 이름이 겹쳐 다른 지면 자료를 덮어써 빌드가 멈춘 일이 있었다 —
 * 그때는 빌드가 멈춰 알았지만, 슬러그 충돌은 «안 멈추고» 덮는다. 그래서 여기서 잡는다.
 */
export function 슬러그겹침(학교들) {
  const 본것 = new Map();
  const 겹친것 = [];
  for (const s of 학교들) {
    if (본것.has(s.slug)) 겹친것.push({ slug: s.slug, a: 본것.get(s.slug), b: s.name });
    else 본것.set(s.slug, s.name);
  }
  return 겹친것;
}

export function 짓는다(명부, 학교자료) {
  const 명부맵 = new Map((명부.사람 ?? []).map((p) => [p.q, {
    q: p.q, name: p.name, born: p.born, year: 태어난해(p.born), sitelinks: p.sitelinks ?? 0,
  }]));

  const { 학교, 명부에없는사람 } = 뒤집는다(학교자료.사람, 명부맵);

  const 모두 = [...학교.values()].map((s) => ({
    q: s.q,
    name: s.name,
    slug: s.slug,
    people: s.people.length,
    /* ⛔ 영문으로 못 쓰는 이름은 «화면에서» 뺀다. 사람 수(people)는 안 줄인다 */
    namesInEnglish: s.people.filter((p) => 영문으로쓸수있나(p.name)).length,
    namesNotInEnglish: s.people.filter((p) => !영문으로쓸수있나(p.name)).length,
    top: 이름세우기(s.people.filter((p) => 영문으로쓸수있나(p.name))).slice(0, 이름칸)
      .map((p) => ({ name: p.name, year: p.year, languages: p.sitelinks || null })),
  })).sort((a, b) => b.people - a.people || a.name.localeCompare(b.name));

  const 낼것 = 모두.filter((s) => s.people >= 최소인원);
  const 안낸것 = 모두.length - 낼것.length;

  const 겹침 = 슬러그겹침(낼것);

  return {
    builtAt: new Date().toISOString(),
    rosterPeople: (명부.사람 ?? []).length,
    peopleWithSchool: (학교자료.사람 ?? []).length,
    peopleWithoutSchool: (명부.사람 ?? []).length - (학교자료.사람 ?? []).length,
    schoolsSeen: 모두.length,
    minPeopleToList: 최소인원,
    schoolsNotListed: 안낸것,
    whyNotListed: `${최소인원}명에 못 미치는 학교는 지면을 내지 않는다. 세기는 셌다`,
    whyNoHeightPages: '키(P2048)는 9,249명 중 320명(3.5%)에게만 적혀 있다. '
      + '수요는 「kpop idols height」가 자동완성 1번째·10줄로 더 컸지만, 3.5%로 '
      + '「가장 큰 사람」을 말하면 틀린 답을 자신 있게 내는 지면이 된다. 그래서 안 만들었다',
    droppedNotInRoster: 명부에없는사람,
    slugCollisions: 겹침,
    schools: 낼것,
  };
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('태어난해 — 앞 네 자리', 태어난해('1993-05-16') === 1993);
  T('태어난해 — 못 읽으면 null', 태어난해('unknown') === null);
  T('태어난해 — 빈 값도 null', 태어난해(undefined) === null);
  T('태어난해 — 0 으로 안 채운다', 태어난해('') !== 0);

  const 사람들 = [
    { name: 'A', sitelinks: 5 }, { name: 'C', sitelinks: 9 }, { name: 'B', sitelinks: 9 },
  ];
  const 세운 = 이름세우기(사람들);
  T('이름세우기 — 언어판 많은 쪽이 먼저', 세운[0].sitelinks === 9);
  T('이름세우기 — 같으면 이름 순(돌릴 때마다 안 바뀐다)', 세운[0].name === 'B' && 세운[1].name === 'C');
  T('이름세우기 — 원래 배열을 안 건드린다', 사람들[0].name === 'A');

  /* 🔴 2026-08-25 에 겪은 것 — 학교 이름에만 걸린 검사가 사람 이름은 통과시켰다 */
  T('영문으로쓸수있나 — 보통 이름은 통과', 영문으로쓸수있나('Kim Go-eun'));
  T('영문으로쓸수있나 — 한글 이름은 영문 지면에 못 쓴다', !영문으로쓸수있나('강민규'));
  T('영문으로쓸수있나 — 한글에 괄호가 붙어도 못 쓴다', !영문으로쓸수있나('강민규 (배우)'));
  T('영문으로쓸수있나 — Q번호는 이름이 아니다', !영문으로쓸수있나('Q123456'));
  T('영문으로쓸수있나 — 빈 값은 아니다', !영문으로쓸수있나('') && !영문으로쓸수있나(null));

  const 명부맵 = new Map([
    ['Q1', { q: 'Q1', name: 'One', year: 1990, sitelinks: 3 }],
    ['Q2', { q: 'Q2', name: 'Two', year: 1991, sitelinks: 7 }],
  ]);
  const r = 뒤집는다([
    { q: 'Q1', schools: [{ q: 'S1', name: 'Alpha', slug: 'alpha' }, { q: 'S2', name: 'Beta', slug: 'beta' }] },
    { q: 'Q2', schools: [{ q: 'S1', name: 'Alpha', slug: 'alpha' }] },
    { q: 'Q9', schools: [{ q: 'S1', name: 'Alpha', slug: 'alpha' }] },
  ], 명부맵);
  T('뒤집기 — 학교별로 모인다', r.학교.get('S1').people.length === 2);
  T('뒤집기 — 한 사람이 두 학교에 다 선다', r.학교.get('S2').people.length === 1);
  T('뒤집기 — 명부에 없는 사람은 안 담는다', !r.학교.get('S1').people.some((p) => p.q === 'Q9'));
  T('뒤집기 — 명부에 없는 사람을 «센다»', r.명부에없는사람 === 1);
  T('뒤집기 — 빈 입력에도 안 터진다', 뒤집는다(undefined, 명부맵).학교.size === 0);

  T('슬러그겹침 — 같은 슬러그를 잡는다',
    슬러그겹침([{ slug: 'a', name: 'A' }, { slug: 'a', name: 'A2' }]).length === 1);
  T('슬러그겹침 — 안 겹치면 0', 슬러그겹침([{ slug: 'a', name: 'A' }, { slug: 'b', name: 'B' }]).length === 0);

  /* 짓기 — 최소인원 아래는 «안 내되 센다» */
  const 가짜명부 = { 사람: [] };
  const 가짜학교 = { 사람: [] };
  for (let i = 0; i < 40; i++) {
    가짜명부.사람.push({ q: `Q${i}`, name: `P${i}`, born: `199${i % 10}-01-01`, sitelinks: i });
    가짜학교.사람.push({ q: `Q${i}`, schools: [{ q: i < 30 ? 'S1' : 'S2', name: i < 30 ? 'Big' : 'Small', slug: i < 30 ? 'big' : 'small' }] });
  }
  const out = 짓는다(가짜명부, 가짜학교);
  T('짓기 — 큰 학교만 낸다', out.schools.length === 1 && out.schools[0].slug === 'big');
  T('짓기 — 못 낸 학교를 «센다»', out.schoolsNotListed === 1);
  T('짓기 — 본 학교 수는 둘 다 센다', out.schoolsSeen === 2);
  T('짓기 — 이름칸을 넘지 않는다', out.schools[0].top.length === 이름칸);
  T('짓기 — 학교 안 적힌 사람을 «0 이 아니라» 센다', out.peopleWithoutSchool === 0);
  T('짓기 — 왜 못 냈는지를 파일에 적는다', String(out.whyNotListed).length > 20);
  T('짓기 — 키 지면을 왜 «안» 만들었는지도 적는다',
    String(out.whyNoHeightPages).includes('3.5%'));
  T('짓기 — 슬러그가 안 겹친다', out.slugCollisions.length === 0);

  /* 분모를 헷갈리지 않게 — 학교 인원의 합은 사람 수와 «다를 수 있다» */
  const 합 = out.schools.reduce((s, x) => s + x.people, 0);
  T('짓기 — 학교 인원 합과 사람 수를 같은 것처럼 두지 않는다', 합 <= out.peopleWithSchool * 2);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ build-kcw-schools 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ build-kcw-schools 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  for (const f of [명부길, 학교길]) {
    if (!existsSync(f)) {
      console.error(`⛔ 자료가 없다 — ${f}. 못 잰 것을 0 으로 안 적는다`);
      process.exit(1);
    }
  }
  const 명부 = JSON.parse(readFileSync(명부길, 'utf8'));
  const 학교자료 = JSON.parse(readFileSync(학교길, 'utf8'));
  const out = 짓는다(명부, 학교자료);

  if (out.slugCollisions.length) {
    console.error('⛔ 주소가 겹치는 학교가 있다 — 한 지면이 다른 지면을 조용히 덮는다:');
    for (const c of out.slugCollisions) console.error(`   · ${c.slug} — 「${c.a}」와 「${c.b}」`);
    process.exit(1);
  }

  writeFileSync(낼길, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`■ 명부 ${out.rosterPeople}명`);
  console.log(`  학교가 «적힌» 사람   ${out.peopleWithSchool}명`);
  console.log(`  학교가 «안 적힌» 사람 ${out.peopleWithoutSchool}명  ⛔ 안 다닌 것이 아니라 «모른다»`);
  console.log(`  본 학교 ${out.schoolsSeen}곳 중 지면을 내는 곳 ${out.schools.length}곳`
    + ` (${최소인원}명 미만 ${out.schoolsNotListed}곳은 안 낸다)`);
  console.log(`  맨 위 다섯 — ${out.schools.slice(0, 5).map((s) => `${s.name} ${s.people}`).join(' · ')}`);
  console.log(`냈다 — ${path.relative(뿌리, 낼길)}`);
}
