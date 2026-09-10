#!/usr/bin/env node
/**
 * check-article-overlap.mjs — **새 기사가 «우리가 이미 낸 기사»와 같은 축인지 짚는다.**
 *
 *   node scripts/check-article-overlap.mjs              오늘 낸 기사를 본다
 *   node scripts/check-article-overlap.mjs --전부        기사 전부를 서로 견준다
 *   node scripts/check-article-overlap.mjs --날 20260911 그 날짜 기사를 본다
 *   node scripts/check-article-overlap.mjs --자가시험
 *
 * ── 🔴 왜 만들었나 (2026-09-11 03:3x · 5번) ────────────────────────
 *
 * 오늘 밤 내가 낸 기사 넷 가운데 **셋이 우리가 이미 낸 기사와 겹쳤다.** 하나(fx)는
 * 사실상 같은 기사였다 — 2026-08-04 에 629거래일로 낸 것을 나는 **7거래일**로 다시 세서
 * 「새로 찾았다」고 냈다. 표본이 90분의 1인 것을 새 발견으로 낸 것이다.
 *
 * ⛔ 까닭은 내 확인 방법이 «통과할 수 없는 검사»였다는 것이다 —
 * ```
 * 내가 한 것   grep -rl "archive/raw/funds" scripts/ src/   → 수집기 하나뿐 → 「안 쓰인다」
 * 왜 틀렸나    기사는 사람이 손으로 수를 적어 쓴다. 자료 경로가 기사 안에 안 남는다.
 *              ⇒ 코드 grep 은 기사가 있어도 «언제나» 「안 쓰인다」로 나온다
 * ```
 * ⭐ 그리고 나는 이것을 02:31 에 스스로 정정하고 방송까지 하고서 **두 시간 뒤 두 번 더 어겼다.**
 *   그러니 문장으로 두면 안 된다. 검사로 둔다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────
 *
 * ⛔ **「겹쳤다」를 곧 「중복이다」로 판정하지 않는다.** 축이 다르면 겹치는 것이 정상이다 —
 *   오늘 금 기사는 8월 기사와 같은 두 계약을 다루지만 그쪽은 «거래량», 이쪽은 «가격차»다.
 *   그때 필요한 것은 기사를 버리는 것이 아니라 **상호 링크**다.
 * ✅ 그래서 판정은 이렇게 둔다 —
 *   겹치는 기사가 있는데 **본문이 그것을 가리키지 않으면** 빨간불.
 *   가리키고 있으면 초록. 자는 짚어 주고, 축이 같은지는 사람이 읽고 정한다.
 * ⛔ 태그가 하나 겹친 것으로 울지 않는다 — 「korea」는 거의 모든 기사에 있다.
 *   너무 흔한 태그는 «세지 않는다»(흔한태그).
 * ⚠ 이 자는 의미를 모른다. 낱말과 태그만 본다. 그래서 「짚는다」까지가 몫이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방들 = ['content/articles', 'content/kculturewire'];

/** 이 수 이상의 기사에 붙은 태그는 «흔한 것»이라 겹침으로 세지 않는다 */
export const 흔한태그선 = 12;
/** 겹침으로 볼 최소 점수 */
export const 짚는점수 = 3;

/** 제목·부제에서 셀 낱말을 뽑는다. ⛔ 흔한 기능어는 버린다 */
export const 버릴낱말 = new Set([
  'the', 'and', 'for', 'that', 'with', 'from', 'this', 'they', 'their', 'them', 'have', 'has',
  'was', 'were', 'are', 'not', 'but', 'its', 'korea', 'korean', 'korea’s', 'koreas',
  'one', 'two', 'three', 'more', 'most', 'than', 'over', 'into', 'about', 'what', 'which',
  'when', 'where', 'how', 'who', 'our', 'your', 'you', 'day', 'days', 'year', 'years',
  'percent', 'per', 'cent', 'all', 'any', 'every', 'only', 'also', 'been', 'does', 'did',
]);

export function 낱말들(글) {
  return [...new Set(String(글 ?? '').toLowerCase()
    .replace(/[^a-z0-9’\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !버릴낱말.has(w) && !/^\d+$/.test(w)))];
}

/** 앞말을 아주 단순하게 읽는다. ⛔ yaml 파서를 들이지 않는다 — 우리 앞말은 꼴이 정해져 있다 */
export function 앞말읽기(글) {
  const s = String(글 ?? '');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const 앞 = m ? m[1] : '';
  const 본문 = m ? s.slice(m[0].length) : s;
  const 한줄 = (이름) => {
    const r = 앞.match(new RegExp(`^${이름}:\\s*"?(.*?)"?\\s*$`, 'm'));
    return r ? r[1] : '';
  };
  const 태그줄 = 앞.match(/^tags:\s*\[(.*?)\]/m);
  const tags = 태그줄
    ? 태그줄[1].split(',').map((x) => x.replace(/["'\s]/g, '').toLowerCase()).filter(Boolean)
    : [];
  /* ⚠ 출처 줄은 「  - org: "KRX"」 꼴이다 — «- » 를 넘겨야 org 가 잡힌다.
     처음에 이것을 빠뜨려 org 는 못 읽고 api 만 읽었다(자가시험이 잡았다). */
  const 출처들 = [...앞.matchAll(/^\s*-?\s*(?:api|org):\s*"?(.*?)"?\s*$/gm)].map((x) => x[1]);
  return {
    title: 한줄('title'),
    dek: 한줄('dek'),
    category: 한줄('category'),
    pubDate: 한줄('pubDate'),
    draft: /^draft:\s*true/m.test(앞),
    tags,
    출처들,
    본문,
  };
}

/** 태그마다 몇 편에 붙었나 — 흔한 태그를 가리기 위해 센다 */
export function 태그세기(기사들) {
  const m = new Map();
  for (const a of 기사들) for (const t of (a.tags ?? [])) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

/**
 * 출처 문장마다 몇 편에 쓰였나.
 * 🔴 돌려 보고 알았다 — KCW 기사는 거의 다 Wikimedia pageviews 를 쓴다. 그러면 「같은 출처」가
 *   태그 「korea」와 똑같은 처지가 되어 모든 KCW 기사가 서로 걸린다. 그것은 겹침의 증거가 아니다.
 *   ⇒ 태그와 같은 흔한선을 출처에도 쓴다. ⛔ 헛울리는 검사는 아무도 안 본다.
 */
export function 출처세기(기사들) {
  const m = new Map();
  for (const a of 기사들) for (const t of (a.출처들 ?? [])) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

/**
 * 두 기사가 얼마나 겹치나. ⛔ 점수는 «짚기 위한 것»이고 판정이 아니다.
 *   태그 겹침(흔한 것 뺀) 1점씩 · 제목·부제 낱말 겹침 1점씩 · 같은 출처 문장 2점
 */
export function 겹침점수(a, b, 태그수 = new Map(), { 흔한선 = 흔한태그선, 출처수 = new Map() } = {}) {
  /* ⛔ tags 가 없는 기사가 있다. 없으면 빈 것으로 본다 — 던지면 검사가 통째로 멈춘다 */
  const 가태그 = Array.isArray(a?.tags) ? a.tags : [];
  const 나태그 = Array.isArray(b?.tags) ? b.tags : [];
  const 태그겹침 = 가태그.filter((t) => 나태그.includes(t)
    && (태그수.get(t) ?? 0) < 흔한선);
  const 가낱말 = new Set([...낱말들(a.title), ...낱말들(a.dek)]);
  const 나낱말 = new Set([...낱말들(b.title), ...낱말들(b.dek)]);
  const 낱말겹침 = [...가낱말].filter((w) => 나낱말.has(w));
  /* ⛔ 흔한 출처는 겹침으로 세지 않는다 — 위 출처세기() 주석의 까닭이다 */
  const 가출처 = Array.isArray(a?.출처들) ? a.출처들 : [];
  const 나출처 = Array.isArray(b?.출처들) ? b.출처들 : [];
  const 출처겹침 = 가출처.filter((s) => s && 나출처.includes(s)
    && (출처수.get(s) ?? 0) < 흔한선);
  return {
    점수: 태그겹침.length + 낱말겹침.length + 출처겹침.length * 2,
    태그겹침, 낱말겹침, 출처겹침,
  };
}

/** 본문이 그 기사를 가리키나. `/article/<slug>` 또는 KCW 꼴을 본다 */
export function 가리키나(본문, 상대slug) {
  const s = String(본문 ?? '');
  return s.includes(`/article/${상대slug}`) || s.includes(`(${상대slug})`);
}

export function 견주기(기사들, 볼것들, { 선 = 짚는점수 } = {}) {
  const 태그수 = 태그세기(기사들);
  const 출처수 = 출처세기(기사들);
  const 울것 = []; const 초록 = [];
  for (const 새 of 볼것들) {
    const 겹친것 = [];
    for (const 옛 of 기사들) {
      if (옛.slug === 새.slug || 옛.draft) continue;
      const r = 겹침점수(새, 옛, 태그수, { 출처수 });
      if (r.점수 >= 선) 겹친것.push({ slug: 옛.slug, title: 옛.title, pubDate: 옛.pubDate, ...r });
    }
    겹친것.sort((x, y) => y.점수 - x.점수);
    const 안가리킨것 = 겹친것.filter((x) => !가리키나(새.본문, x.slug));
    if (안가리킨것.length) 울것.push({ slug: 새.slug, title: 새.title, 겹친것: 안가리킨것 });
    else 초록.push({ slug: 새.slug, 겹친수: 겹친것.length });
  }
  return { 울것, 초록, 본기사수: 볼것들.length };
}

export function 기사읽기() {
  const 것들 = [];
  for (const 방 of 기사방들) {
    const d = path.join(뿌리, 방);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md'))) {
      const 글 = fs.readFileSync(path.join(d, f), 'utf8');
      것들.push({ slug: f.replace(/\.md$/, ''), 방, ...앞말읽기(글) });
    }
  }
  return 것들;
}

export function 자가시험() {
  const 기사 = (slug, title, dek, tags = [], 본문 = '', 출처들 = []) =>
    ({ slug, title, dek, tags, 출처들, 본문, draft: false, pubDate: '2026-09-11' });
  const 목 = [
    ['낱말에서 흔한 기능어와 나라 이름을 버린다', () => {
      const w = 낱말들('Korea and the Korean oil exchange prices');
      return !w.includes('korea') && !w.includes('korean') && w.includes('exchange');
    }],
    ['⛔ 세 글자 이하는 세지 않는다', () => !낱말들('gas oil fx').includes('oil')],
    ['⛔ 숫자만 있는 것은 세지 않는다', () => !낱말들('1,619 sessions').includes('1619')],
    ['앞말에서 제목·부제·태그를 읽는다', () => {
      const r = 앞말읽기('---\ntitle: "A B"\ndek: "C D"\ntags: ["oil", "krx"]\n---\n\n본문');
      return r.title === 'A B' && r.dek === 'C D' && r.tags.length === 2 && /본문/.test(r.본문);
    }],
    ['앞말에서 draft 를 읽는다', () =>
      앞말읽기('---\ntitle: "x"\ndraft: true\n---\n').draft === true],
    ['⛔ 앞말이 없어도 견딘다', () => {
      const r = 앞말읽기('그냥 글');
      return r.title === '' && r.tags.length === 0;
    }],
    ['출처 문장을 모은다', () => {
      const r = 앞말읽기('---\ntitle: "x"\nsources:\n  - org: "KRX"\n    api: "gold daily"\n---\n');
      return r.출처들.includes('KRX') && r.출처들.includes('gold daily');
    }],
    ['🔴 흔한 태그는 겹침으로 세지 않는다 — 「korea」로 모든 기사가 걸리면 아무도 안 본다', () => {
      const 수 = new Map([['korea', 99], ['kerosene', 2]]);
      const r = 겹침점수(기사('a', '', '', ['korea', 'kerosene']), 기사('b', '', '', ['korea', 'kerosene']), 수);
      return r.태그겹침.length === 1 && r.태그겹침[0] === 'kerosene';
    }],
    ['같은 출처는 두 점이다 — 같은 우물이면 겹칠 값이 크다', () => {
      const r = 겹침점수(기사('a', '', '', [], '', ['KRX petroleum']), 기사('b', '', '', [], '', ['KRX petroleum']));
      return r.점수 === 2 && r.출처겹침.length === 1;
    }],
    ['🔴 흔한 출처는 겹침으로 세지 않는다 — KCW 는 거의 다 Wikimedia 를 쓴다', () => {
      const 수 = new Map([['Wikimedia pageviews', 99]]);
      const r = 겹침점수(기사('a', '', '', [], '', ['Wikimedia pageviews']),
        기사('b', '', '', [], '', ['Wikimedia pageviews']), new Map(), { 출처수: 수 });
      return r.출처겹침.length === 0 && r.점수 === 0;
    }],
    ['출처세기가 편 수를 센다', () => {
      const m = 출처세기([기사('a', '', '', [], '', ['X']), 기사('b', '', '', [], '', ['X'])]);
      return m.get('X') === 2;
    }],
    ['🔴 오늘 실제로 겹친 짝을 잡는다 (fx)', () => {
      const 새 = 기사('korea-lists-260', 'Korea lists about 260 currency futures. Ten of them trade.',
        'currency futures listing days competitive', ['currency futures', 'krx']);
      const 옛 = 기사('korea-currency-futures-one-contract',
        'China is Korea’s biggest trading partner. Its yuan futures are 0.03% of the market.',
        'Korean currency-futures turnover was one contract flexible dated dollar futures', ['currency futures', 'krx']);
      const r = 겹침점수(새, 옛, new Map([['currency futures', 2], ['krx', 3]]));
      return r.점수 >= 짚는점수;
    }],
    ['✅ 가리키고 있으면 초록이다 — 겹침 자체는 흠이 아니다', () => {
      const 옛 = 기사('old-one', 'Gold turnover rose', 'gold turnover contract retail');
      const 새 = 기사('new-one', 'Gold priced twice', 'gold contract retail premium',
        [], 'see [our count](/article/old-one) for turnover');
      const r = 견주기([옛, 새], [새], { 선: 1 });
      return r.울것.length === 0 && r.초록.length === 1;
    }],
    ['🔴 안 가리키면 울린다', () => {
      const 옛 = 기사('old-one', 'Gold turnover rose', 'gold turnover contract retail');
      const 새 = 기사('new-one', 'Gold priced twice', 'gold contract retail premium');
      const r = 견주기([옛, 새], [새], { 선: 1 });
      return r.울것.length === 1 && r.울것[0].겹친것[0].slug === 'old-one';
    }],
    ['⛔ 자기 자신과는 견주지 않는다', () => {
      const 새 = 기사('same', 'A B C', 'D E F');
      return 견주기([새], [새], { 선: 1 }).울것.length === 0;
    }],
    ['⛔ draft 는 견줄 상대에서 뺀다 — 안 나간 기사를 가리키라고 하지 않는다', () => {
      const 옛 = { ...기사('old', 'Gold turnover rose', 'gold turnover contract'), draft: true };
      const 새 = 기사('new', 'Gold turnover rose', 'gold turnover contract');
      return 견주기([옛, 새], [새], { 선: 1 }).울것.length === 0;
    }],
    ['⛔ tags 가 없는 기사에도 던지지 않는다 — 하나가 던지면 검사가 통째로 멈춘다', () =>
      겹침점수({ title: 'a', dek: '', 출처들: [] }, { title: 'a', dek: '', 출처들: [] }).점수 >= 0],
    ['⛔ 빈 것도 견딘다', () => {
      const r = 견주기([], [], {});
      return r.울것.length === 0 && r.본기사수 === 0;
    }],
    ['가리키나는 KCW 꼴도 본다', () =>
      가리키나('보라 (some-slug) 여기', 'some-slug') === true],
  ];
  let 통 = 0; const 실 = [];
  for (const [이름, 재본다] of 목) {
    let ok = false;
    try { ok = !!재본다(); } catch { ok = false; }
    if (ok) 통 += 1; else 실.push(이름);
  }
  console.log(`기사 겹침 검사 — 자가시험 ${통}/${목.length}`);
  실.forEach((x) => console.log(`   X ${x}`));
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 판정하지 않는다'); process.exit(1); }

  const 기사들 = 기사읽기();
  const i = process.argv.indexOf('--날');
  const 날 = i >= 0 ? String(process.argv[i + 1] ?? '') : null;
  const 오늘 = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const 날꼴 = 날 && /^\d{8}$/.test(날) ? `${날.slice(0, 4)}-${날.slice(4, 6)}-${날.slice(6, 8)}` : 날;
  const 볼것들 = process.argv.includes('--전부')
    ? 기사들.filter((a) => !a.draft)
    : 기사들.filter((a) => !a.draft && String(a.pubDate).startsWith(날꼴 ?? 오늘));

  console.log(`\n■ 기사 ${기사들.length}편 가운데 ${볼것들.length}편을 견준다`
    + (process.argv.includes('--전부') ? ' (전부)' : ` (${날꼴 ?? 오늘} 발행분)`));
  if (!볼것들.length) {
    console.log('⬜ 견줄 기사가 없다 — 그 날짜로 발행한 기사가 없다는 뜻이다(흠이 아니다)');
    process.exit(0);
  }

  const r = 견주기(기사들, 볼것들);
  for (const g of r.초록) {
    console.log(`  ✅ ${g.slug} — 겹치는 기사 ${g.겹친수}편, 전부 본문에서 가리킨다`);
  }
  for (const w of r.울것) {
    console.log(`\n  🔴 ${w.slug}`);
    console.log(`     ${w.title}`);
    for (const x of w.겹친것.slice(0, 3)) {
      console.log(`     ↳ ${x.pubDate} ${x.slug}  (점수 ${x.점수})`);
      console.log(`        ${x.title}`);
      const 왜 = [];
      if (x.태그겹침.length) 왜.push(`태그 ${x.태그겹침.join('·')}`);
      if (x.출처겹침.length) 왜.push('같은 출처');
      if (x.낱말겹침.length) 왜.push(`낱말 ${x.낱말겹침.slice(0, 6).join('·')}`);
      console.log(`        겹친 것 — ${왜.join(' / ')}`);
    }
  }

  if (r.울것.length) {
    console.log(`\n■ 겹치는데 «가리키지 않는» 기사 ${r.울것.length}편 — 열어 보고 정한다`);
    console.log('   ⚠ 이것은 「중복이다」가 아니다. 축이 다르면 겹치는 것이 정상이고,');
    console.log('     그때 할 일은 기사를 버리는 것이 아니라 **상호 링크를 붙이는 것**이다.');
    console.log('   🔴 다만 축까지 같으면 그것은 다시 낸 것이다. 그 하나를 찾는 것이 이 자의 값이다.');
    console.log('   ⛔ 그리고 이 자는 «막지 않는다» — 종료코드 0 이다. 헛울림으로 관문을 세우면');
    console.log('     그 옆의 진짜 빨간불이 안 보인다. 같은 날 폰 검사에서 그 사고를 겪었다.');
    console.log('   ⭐ 2026-09-11 새벽에 내가 넷 중 셋을 겹치게 냈다. fx 는 629거래일 기사를');
    console.log('     7거래일로 다시 센 것이었다. 그래서 이 자가 있다.');
    process.exit(0);
  }
  console.log('\n✅ 겹치는 기사를 전부 본문에서 가리키고 있다');
}
