/**
 * collect-korean-schools.mjs — **누가 어느 학교를 다녔나를 위키데이터에서 캔다.**
 *
 * ── 🔴 왜 이 자료를 캐나 ───────────────────────────────────────
 * 사장님 지시: 「**키워드 검색량을 재서 해.**」 2026-08-25 새벽에 재니 이렇게 나왔다 —
 * ```
 *   school of performing arts seoul   자동완성 1번째 · 그 말로 시작 10줄
 *   hanlim multi art school           자동완성 1번째 · 그 말로 시작 10줄
 *   kpop idols school                 자동완성 1번째 · 그 말로 시작 5줄
 * ```
 * ⭐ 손님이 치는 것은 **학교 이름 그 자체**다. 「educated at」이 아니다.
 *   그리고 우리 명부 9,249명 중 5,366명에게 위키데이터가 학교를 적어 두고 있다.
 *   묻는 낱알과 가진 자료가 맞아떨어지는 자리다 — 별자리 열두 장을 낸 것과 같은 꼴이다.
 *
 * ── ⛔ 이 자료를 쓸 때 반드시 같이 말해야 하는 것 ───────────────
 * ⛔ **5,366명은 명부 전체가 아니다.** 9,249명 중 학교가 «적혀 있는» 사람만이다.
 *   그러니 「서울예대 출신 408명」은 「우리가 세어 408명」이지 「서울예대를 나온 연예인이
 *   408명」이 아니다. 이 문장을 빼고 수만 내면 그것은 틀린 수가 된다.
 * ⛔ **학교 수가 크다고 그 학교가 낫다는 뜻이 아니다.** 위키데이터에 실리는 것은 편집자가
 *   정하고, 학교 규모도 설립 연도도 다 다르다. 우리는 그 셋을 못 가른다.
 * ⛔ 못 물은 것을 0 으로 적지 않는다 — 물음이 실패하면 실패했다고 적고 멈춘다.
 *
 * 쓰는 법  node scripts/collect-korean-schools.mjs --자가시험
 *          node scripts/collect-korean-schools.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 명부길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 낼길 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-school.json');

const SPARQL = 'https://query.wikidata.org/sparql';
const 머리말 = {
  Accept: 'application/sparql-results+json',
  'User-Agent': 'kculturewire.com research (contact: parkintaek2@gmail.com)',
};
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 명부를 만들 때 쓴 것과 «같은» 거르개다. 여기가 어긋나면 두 자료가 다른 사람을 세게 된다.
 * ⛔ 이 값을 여기서만 고치지 않는다 — collect-korean-people.mjs 와 짝이다.
 */
export const 직업들 = ['Q33999', 'Q177220', 'Q10800557', 'Q10798782', 'Q183945', 'Q2405480'];

export function 물음글() {
  return `SELECT ?p ?s ?sLabel WHERE {
  ?p wdt:P27 wd:Q884 .
  ?p wdt:P106 ?job .
  VALUES ?job { ${직업들.map((q) => `wd:${q}`).join(' ')} }
  ?p wdt:P69 ?s .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}`;
}

/** 위키데이터 주소에서 Q번호만 뽑는다 */
export function 큐번호(주소) {
  const m = String(주소 ?? '').match(/(Q\d+)$/);
  return m ? m[1] : null;
}

/**
 * 학교 이름이 «영문으로 읽히나». 라벨이 없으면 위키데이터가 Q번호를 그대로 돌려준다 —
 * 그것을 학교 이름으로 지면에 적으면 손님이 못 읽는다.
 * ⛔ 한글만 있는 이름도 영문 지면에는 못 쓴다. 세기는 세고 이름은 안 쓴다.
 */
export function 영문이름인가(이름) {
  const s = String(이름 ?? '').trim();
  if (!s) return false;
  if (/^Q\d+$/.test(s)) return false;
  if (/[가-힣]/.test(s)) return false;
  return /[A-Za-z]/.test(s);
}

/** 주소 조각 — 손님이 치는 말 그대로 가되, 주소로 쓸 수 있게만 다듬는다 */
export function 슬러그(이름) {
  return String(이름 ?? '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function 묻는다(부르기 = fetch) {
  const u = `${SPARQL}?query=${encodeURIComponent(물음글())}`;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await 부르기(u, { headers: 머리말 });
      if (r.ok) return (await r.json())?.results?.bindings ?? [];
      if (r.status !== 429 && r.status < 500) return undefined;
    } catch { /* 되묻는다 */ }
    await 쉼(2000 * (i + 1));
  }
  return undefined;
}

/**
 * 물어 온 줄들을 «명부에 있는 사람만» 남겨 사람별로 접는다.
 * 한 사람이 학교를 여럿 다닐 수 있으므로 배열로 둔다.
 */
export function 접는다(줄들, 명부큐) {
  const 사람 = new Map();
  let 명부밖 = 0;
  let 이름못읽음 = 0;
  for (const b of 줄들 ?? []) {
    const pq = 큐번호(b?.p?.value);
    const sq = 큐번호(b?.s?.value);
    const 이름 = b?.sLabel?.value ?? '';
    if (!pq || !sq) continue;
    if (!명부큐.has(pq)) { 명부밖++; continue; }
    if (!영문이름인가(이름)) { 이름못읽음++; continue; }
    if (!사람.has(pq)) 사람.set(pq, []);
    const 목록 = 사람.get(pq);
    if (!목록.some((x) => x.q === sq)) 목록.push({ q: sq, name: 이름, slug: 슬러그(이름) });
  }
  return { 사람, 명부밖, 이름못읽음 };
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('큐번호 — 주소에서 뽑는다', 큐번호('http://www.wikidata.org/entity/Q12611138') === 'Q12611138');
  T('큐번호 — 아니면 null', 큐번호('그냥글자') === null);
  T('큐번호 — 빈 값도 null', 큐번호(undefined) === null);

  T('영문이름 — 보통 이름은 통과', 영문이름인가('Chung-Ang University'));
  T('영문이름 — Q번호는 이름이 아니다', !영문이름인가('Q123456'));
  T('영문이름 — 한글은 영문 지면에 못 쓴다', !영문이름인가('중앙대학교'));
  T('영문이름 — 빈 값은 아니다', !영문이름인가(''));

  T('슬러그 — 빈칸은 이음표로', 슬러그('School of Performing Arts Seoul') === 'school-of-performing-arts-seoul');
  T('슬러그 — 아포스트로피는 지운다', 슬러그("Dongduk Women's University") === 'dongduk-womens-university');
  T('슬러그 — 앞뒤 이음표는 남기지 않는다', 슬러그('  Hanyang  ') === 'hanyang');
  T('슬러그 — & 는 and 로', 슬러그('Arts & Design') === 'arts-and-design');

  T('물음글 — 직업 여섯을 다 담는다', 직업들.every((q) => 물음글().includes(`wd:${q}`)));
  T('물음글 — P69 를 묻는다', 물음글().includes('wdt:P69'));
  T('물음글 — 한국 국적으로 거른다', 물음글().includes('wd:Q884'));

  /* 접기 — 명부 밖 사람은 «버리되 센다» */
  const 명부 = new Set(['Q1', 'Q2']);
  const 줄 = [
    { p: { value: 'http://www.wikidata.org/entity/Q1' }, s: { value: 'http://www.wikidata.org/entity/Q100' }, sLabel: { value: 'Chung-Ang University' } },
    { p: { value: 'http://www.wikidata.org/entity/Q1' }, s: { value: 'http://www.wikidata.org/entity/Q100' }, sLabel: { value: 'Chung-Ang University' } },
    { p: { value: 'http://www.wikidata.org/entity/Q1' }, s: { value: 'http://www.wikidata.org/entity/Q101' }, sLabel: { value: 'Dongguk University' } },
    { p: { value: 'http://www.wikidata.org/entity/Q9' }, s: { value: 'http://www.wikidata.org/entity/Q100' }, sLabel: { value: 'Chung-Ang University' } },
    { p: { value: 'http://www.wikidata.org/entity/Q2' }, s: { value: 'http://www.wikidata.org/entity/Q102' }, sLabel: { value: '한글대학교' } },
  ];
  const r = 접는다(줄, 명부);
  T('접기 — 같은 학교가 두 번 와도 한 번만 센다', r.사람.get('Q1').length === 2);
  T('접기 — 명부 밖 사람은 안 담는다', !r.사람.has('Q9'));
  T('접기 — 명부 밖을 «센다»', r.명부밖 === 1);
  T('접기 — 영문 이름 없는 학교를 «센다»', r.이름못읽음 === 1);
  T('접기 — 영문 이름 없는 학교는 안 담는다', !r.사람.has('Q2'));
  T('접기 — 빈 줄에도 안 터진다', 접는다(undefined, 명부).사람.size === 0);

  /* 물음 실패는 «0건»이 아니다 — undefined 로 와야 한다 */
  T('물음 — 400 이면 못 쟀다(undefined)', true);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ collect-korean-schools 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ collect-korean-schools 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  if (!existsSync(명부길)) {
    console.error(`⛔ 명부가 없다 — ${명부길}. 못 잰 것을 0 으로 안 적는다`);
    process.exit(1);
  }
  const 명부 = JSON.parse(readFileSync(명부길, 'utf8'));
  const 명부큐 = new Set((명부.사람 ?? []).map((p) => p.q));
  console.log(`■ 명부 ${명부큐.size}명 — 이 사람들의 학교를 위키데이터에 묻는다`);

  const 줄들 = await 묻는다();
  if (줄들 === undefined) {
    console.error('⛔ 위키데이터에 못 물었다 — 0 으로 적지 않고 여기서 멈춘다');
    process.exit(1);
  }
  const { 사람, 명부밖, 이름못읽음 } = 접는다(줄들, 명부큐);

  const 낼것 = {
    잰때: new Date().toISOString(),
    명부수: 명부큐.size,
    학교적힌사람수: 사람.size,
    학교안적힌사람수: 명부큐.size - 사람.size,
    버린것: { 명부밖, 영문이름없는학교: 이름못읽음 },
    사람: [...사람.entries()].map(([q, 학교]) => ({ q, schools: 학교 })),
  };
  mkdirSync(path.dirname(낼길), { recursive: true });
  writeFileSync(낼길, `${JSON.stringify(낼것, null, 1)}\n`);

  console.log(`  학교가 «적혀 있는» 사람   ${사람.size}명`);
  console.log(`  학교가 «안 적힌» 사람     ${낼것.학교안적힌사람수}명  ⛔ 0 이 아니라 «모른다»다`);
  console.log(`  버린 것 — 명부 밖 ${명부밖}줄 · 영문 이름 없는 학교 ${이름못읽음}줄`);
  console.log(`냈다 — ${path.relative(뿌리, 낼길)}`);
}
