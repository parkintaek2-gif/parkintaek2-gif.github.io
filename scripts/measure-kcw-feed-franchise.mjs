#!/usr/bin/env node
/**
 * measure-kcw-feed-franchise.mjs — **영문 「Korea」 뉴스 피드가 무엇으로 채워지나.** (5번, 2026-09-11)
 *
 *   node scripts/measure-kcw-feed-franchise.mjs --자가시험
 *   node scripts/measure-kcw-feed-franchise.mjs            재서 src/data 에 낸다
 *
 * ── 왜 이 축인가 ─────────────────────────────────────────────────────
 *
 * 우리는 매일 영문 구글뉴스 피드 셋을 받아 쌓는다(kpop · korean drama · korea economy).
 * 어제 것을 눈으로 훑다가 여섯 줄 가운데 다섯 줄이 **한 작품의 «상품»**이었다 —
 * 와플 · 스퀴시멜로 · 노래방 마이크 · 액션 피겨. 그러면 세어 볼 물음이 하나 생긴다:
 * **영어권 손님이 「K팝 뉴스」라고 받는 것의 몇 할이 한 작품이고, 몇 할이 살 물건인가.**
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────
 * ```
 * 🔴 작품 이름을 «내가 고르지 않는다». 제목에서 세 낱말 이음말을 세어 «가장 잦은 것»을
 *   자가 찾아낸다. 내가 「이게 많더라」고 골라 넣으면 그 수는 내 눈의 수다
 * ⛔ 「상업 기사」라고 판정하지 않는다 — 「사는 말이 든 제목」이라고만 적는다.
 *   낱말 목록을 지면에 그대로 낸다. 판정이 아니라 셈이라는 뜻이다
 * ⛔ 발행 매체를 못 센다 — 구글뉴스 주소는 구글로 가는 돌림길이고 제목에도 매체가 없다.
 *   「누가 썼나」는 ⬜ 못 쟀다로 적는다. 짐작으로 채우지 않는다
 * ⛔ 피드는 «한 물음»이다. 구글이 사람마다 다르게 줄 수 있고 우리 것은 우리 물음의 답이다
 * ⛔ 단위는 «항목-날»이다. 같은 제목이 이튿날도 오면 두 번 센다 — 낱개도 함께 낸다
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 밑감방 = path.join(뿌리, 'archive', 'raw', 'community-desk');
export const 낼곳 = path.join(뿌리, 'src', 'data', 'kcw-feed-franchise.json');

/** 볼 피드 — 영문 셋만. ⛔ 한국어 피드(입시·취업)는 다른 주제라 견주지 않는다 */
export const 볼곳 = {
  '구글뉴스 kpop(영문)': 'Google News · K-pop',
  '구글뉴스 korean drama(영문)': 'Google News · Korean drama',
  '구글뉴스 korea economy(영문)': 'Google News · Korea economy',
};

/**
 * 「사는 말」 — ⛔ 이 목록을 지면에 그대로 낸다. 숨기면 판정이 되고, 내면 셈이 된다.
 * ⚠ 값·파는곳·나옴을 가리키는 말만 넣는다. 「좋다」·「인기」 같은 값매김은 넣지 않는다.
 */
export const 사는말 = [
  'price', 'prices', 'buy', 'where to', 'how much', 'cost', 'costs',
  'launch', 'launches', 'launched', 'drop', 'drops', 'restock', 'sold out',
  'merch', 'available', 'availability', 'preorder', 'pre-order', 'on sale', 'deal', 'deals',
  'collab', 'collaboration', 'collection',
];

/** 제목에 사는 말이 들었나 — ⛔ 낱말 경계를 본다. 「dropped a hint」류를 줄이려 낱말로 맞춘다 */
export function 사는말들었나(제목) {
  const s = ` ${String(제목 ?? '').toLowerCase().replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ')} `;
  return 사는말.some((w) => s.includes(` ${w} `));
}

/**
 * 이음말(n-gram) 만들기 — 소문자·부호 없이.
 *
 * 🔴 [실측] 처음 판은 따옴표를 안 맞췄더니 같은 작품이 **두 이음말로 갈라졌다** —
 *   「kpop demon hunters」 122편과 「'kpop demon hunters'」 29편. 제목이 굽은 따옴표(‘’)를
 *   쓰기도 하고 곧은 따옴표(')를 쓰기도 해서다. 갈라지면 몫이 «작게» 나온다.
 * ⇒ 따옴표를 한 꼴로 맞춘 뒤 낱말 앞뒤의 것만 벗긴다. 낱말 «안»의 것은 남긴다(korea's).
 */
export function 이음말들(제목, n = 3) {
  const 낱말 = String(제목 ?? '').toLowerCase()
    .replace(/[‘’“”`´]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ').split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
  const 것 = [];
  for (let i = 0; i + n <= 낱말.length; i += 1) 것.push(낱말.slice(i, i + n).join(' '));
  return 것;
}

/**
 * 가장 잦은 이음말을 «자가» 찾는다. ⛔ 내가 고르지 않는다.
 * ⚠ 낱개 제목 기준으로 센다 — 같은 제목이 며칠 남아 이음말을 부풀리지 않게.
 */
export function 잦은이음말(제목들, { n = 3, 몇 = 8 } = {}) {
  const 셈 = new Map();
  for (const t of [...new Set(제목들 ?? [])]) {
    for (const g of new Set(이음말들(t, n))) 셈.set(g, (셈.get(g) || 0) + 1);
  }
  return [...셈.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 몇).map(([이음말, 수]) => ({ 이음말, 수 }));
}

/** 하루 파일에서 볼 곳의 항목만 꺼낸다 */
export function 하루읽기(글) {
  let d = null;
  try { d = JSON.parse(String(글 ?? '')); } catch { return []; }
  const 것 = Array.isArray(d?.담은것) ? d.담은것 : [];
  return 것.filter((x) => 볼곳[String(x?.곳 ?? '')])
    .map((x) => ({ 곳: String(x.곳), 제목: String(x?.제목 ?? '').trim() }))
    .filter((x) => x.제목);
}

export function 재기(하루들) {
  const 표 = new Map();
  const 날들 = [];
  for (const 하루 of 하루들 ?? []) {
    if (!Array.isArray(하루?.것들) || !하루.것들.length) continue;
    날들.push(하루.날);
    for (const x of 하루.것들) {
      if (!표.has(x.곳)) 표.set(x.곳, { 곳: x.곳, 항목날: 0, 제목들: [], 사는말: 0 });
      const t = 표.get(x.곳);
      t.항목날 += 1;
      t.제목들.push(x.제목);
      if (사는말들었나(x.제목)) t.사는말 += 1;
    }
  }
  const 피드들 = [...표.values()].map((t) => {
    const 낱개 = [...new Set(t.제목들)];
    const 잦은 = 잦은이음말(낱개);
    const 으뜸 = 잦은[0] || null;
    /* ⭐ 으뜸 이음말이 든 «항목-날»과 «낱개»를 둘 다 센다 */
    const 으뜸든항목날 = 으뜸 ? t.제목들.filter((s) => 이음말들(s).includes(으뜸.이음말)).length : 0;
    const 으뜸든낱개 = 으뜸 ? 낱개.filter((s) => 이음말들(s).includes(으뜸.이음말)).length : 0;
    return {
      곳: t.곳,
      영문: 볼곳[t.곳] || t.곳,
      항목날: t.항목날,
      낱개제목: 낱개.length,
      되온몫: t.항목날 ? 1 - 낱개.length / t.항목날 : null,
      사는말든항목날: t.사는말,
      사는말몫: t.항목날 ? t.사는말 / t.항목날 : null,
      사는말든낱개: 낱개.filter(사는말들었나).length,
      사는말낱개몫: 낱개.length ? 낱개.filter(사는말들었나).length / 낱개.length : null,
      으뜸이음말: 으뜸 ? 으뜸.이음말 : null,
      으뜸든항목날,
      으뜸몫: t.항목날 ? 으뜸든항목날 / t.항목날 : null,
      으뜸든낱개,
      으뜸낱개몫: 낱개.length ? 으뜸든낱개 / 낱개.length : null,
      잦은이음말: 잦은,
    };
  }).sort((a, b) => (b.으뜸몫 ?? -1) - (a.으뜸몫 ?? -1));

  return {
    날수: 날들.length,
    날들,
    항목날합: 피드들.reduce((a, x) => a + x.항목날, 0),
    낱개합: 피드들.reduce((a, x) => a + x.낱개제목, 0),
    피드들,
    /* ⬜ 못 쟀다 — 구글뉴스 주소는 돌림길이고 제목에 매체가 없다 */
    발행매체: null,
  };
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('이음말들: 세 낱말씩 자른다', (() => {
    const g = 이음말들('KPop Demon Hunters Waffles');
    return g.length === 2 && g[0] === 'kpop demon hunters';
  })());
  재다('이음말들: 부호를 벗긴다', 이음말들('‘KPop Demon Hunters’ Squishmallows')[0] === 'kpop demon hunters');
  재다('⛔ 이음말들: 세 낱말이 안 되면 없다', 이음말들('BTS wins').length === 0);
  재다('🔴 이음말들: 굽은 따옴표와 곧은 따옴표를 한 꼴로 맞춘다 — 안 맞추면 같은 작품이 둘로 갈라져 몫이 작게 나온다',
    이음말들("'KPop Demon Hunters' waffles")[0] === 이음말들('‘KPop Demon Hunters’ waffles')[0]);
  재다('⛔ 이음말들: 낱말 «안»의 홀따옴표는 남긴다', 이음말들("south korea's kospi rises")[0] === "south korea's kospi");

  재다('🔴 잦은이음말: 자가 찾아낸다 — 내가 고르지 않는다', (() => {
    const r = 잦은이음말(['KPop Demon Hunters waffles', 'KPop Demon Hunters mic', 'BTS V speaks out now']);
    return r[0].이음말 === 'kpop demon hunters' && r[0].수 === 2;
  })());
  재다('🔴 잦은이음말: 같은 제목이 여러 날 와도 한 번 센다 — 낱개로 센다', (() => {
    const r = 잦은이음말(['A B C', 'A B C', 'A B C']);
    return r[0].수 === 1;
  })());

  재다('사는말들었나: 값을 묻는 제목', 사는말들었나('Squishmallows: Prices, characters and availability'));
  재다('사는말들었나: 파는 곳을 묻는 제목', 사는말들었나('How Much Does It Cost and Where to Buy It?'));
  재다('⛔ 사는말들었나: 값 얘기가 없으면 아니다', 사는말들었나('V on BTS, success and what he’d tell his younger self') === false);
  재다('⛔ 사는말들었나: 낱말 «안»에 든 것은 안 센다 — dropped 는 drop 이 아니다',
    사는말들었나('He dropped out of the group') === false);
  재다('⛔ 사는말들었나: 빈 것은 아니다', 사는말들었나('') === false && 사는말들었나(null) === false);
  재다('⛔ 사는말 목록에 값매김 낱말을 넣지 않았다',
    !사는말.some((w) => /best|great|popular|must/.test(w)));

  const 글 = JSON.stringify({
    담은것: [
      { 곳: '구글뉴스 kpop(영문)', 제목: 'A B C' },
      { 곳: '루리웹', 제목: '한국어 제목' },
      { 곳: '구글뉴스 korea economy(영문)', 제목: '' },
    ],
  });
  재다('하루읽기: 볼 곳만 꺼낸다', (() => {
    const r = 하루읽기(글);
    return r.length === 1 && r[0].곳 === '구글뉴스 kpop(영문)';
  })());
  재다('⛔ 하루읽기: 커뮤니티·레딧은 이 자의 것이 아니다',
    하루읽기(글).every((x) => !/루리웹|Reddit/.test(x.곳)));
  재다('⛔ 하루읽기: 깨진 파일·빈 제목은 버린다',
    하루읽기('{{{').length === 0 && 하루읽기(JSON.stringify({ 담은것: [{ 곳: '구글뉴스 kpop(영문)', 제목: ' ' }] })).length === 0);

  const 하루 = (날, 것들) => ({ 날, 것들 });
  재다('🔴 재기: 단위가 «항목-날»이고 낱개를 함께 낸다', (() => {
    const r = 재기([
      하루('2026-09-09', [{ 곳: '구글뉴스 kpop(영문)', 제목: 'A B C' }]),
      하루('2026-09-10', [{ 곳: '구글뉴스 kpop(영문)', 제목: 'A B C' }]),
    ]);
    return r.항목날합 === 2 && r.낱개합 === 1 && Math.abs(r.피드들[0].되온몫 - 0.5) < 1e-9;
  })());
  재다('재기: 으뜸 이음말이 든 몫을 낸다', (() => {
    const r = 재기([하루('2026-09-10', [
      { 곳: '구글뉴스 kpop(영문)', 제목: 'kpop demon hunters waffles' },
      { 곳: '구글뉴스 kpop(영문)', 제목: 'kpop demon hunters mic' },
      { 곳: '구글뉴스 kpop(영문)', 제목: 'bts v speaks out today' },
    ])]);
    const f = r.피드들[0];
    return f.으뜸이음말 === 'kpop demon hunters' && f.으뜸든항목날 === 2
      && Math.abs(f.으뜸몫 - 2 / 3) < 1e-9;
  })());
  재다('재기: 사는말 몫을 낸다', (() => {
    const r = 재기([하루('2026-09-10', [
      { 곳: '구글뉴스 kpop(영문)', 제목: 'Where to buy the thing' },
      { 곳: '구글뉴스 kpop(영문)', 제목: 'He spoke about his day' },
    ])]);
    return Math.abs(r.피드들[0].사는말몫 - 0.5) < 1e-9;
  })());
  재다('⛔ 재기: 빈 날은 날로 세지 않는다', 재기([하루('2026-09-10', [])]).날수 === 0);
  재다('⛔ 재기: 발행 매체는 못 쟀다(null) — 짐작으로 채우지 않는다',
    재기([하루('2026-09-10', [{ 곳: '구글뉴스 kpop(영문)', 제목: 'A B C' }])]).발행매체 === null);
  재다('재기: 항목이 없는 피드는 표에 안 선다 — 0 으로 지어내지 않는다',
    재기([하루('2026-09-10', [{ 곳: '구글뉴스 kpop(영문)', 제목: 'A B C' }])]).피드들.length === 1);

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 재지 않는다.'); process.exit(1); }
console.log('');

if (!fs.existsSync(밑감방)) {
  console.log(`⬜ 못 쟀다 — 밑감방이 없다: ${path.relative(뿌리, 밑감방)}`);
  process.exit(0);
}
const 파일들 = fs.readdirSync(밑감방).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const 하루들 = 파일들.map((f) => ({
  날: f.slice(0, 10),
  것들: 하루읽기(fs.readFileSync(path.join(밑감방, f), 'utf8')),
}));
const r = 재기(하루들);
const 퍼 = (v) => (v == null ? '⬜ 못 쟀다' : `${(v * 100).toFixed(1)}%`);

console.log(`■ 날 ${r.날수}일 (${r.날들[0]}~${r.날들[r.날들.length - 1]})`
  + ` · 항목-날 ${r.항목날합.toLocaleString('en-US')} · 낱개 제목 ${r.낱개합.toLocaleString('en-US')}`);
console.log('');
for (const f of r.피드들) {
  console.log(`  ${f.영문}`);
  console.log(`     항목-날 ${f.항목날} · 낱개 ${f.낱개제목} · 되온 것 ${퍼(f.되온몫)}`);
  console.log(`     으뜸 이음말 「${f.으뜸이음말}」 — 항목-날 ${f.으뜸든항목날}편 ${퍼(f.으뜸몫)}`
    + ` · 낱개 ${f.으뜸든낱개}편 ${퍼(f.으뜸낱개몫)}`);
  console.log(`     사는 말 — 항목-날 ${f.사는말든항목날}편 ${퍼(f.사는말몫)} · 낱개 ${f.사는말든낱개}편 ${퍼(f.사는말낱개몫)}`);
  console.log(`     잦은 이음말 — ${f.잦은이음말.map((x) => `${x.이음말}(${x.수})`).join(' · ')}`);
}
console.log('');
console.log('⬜ 발행 매체는 못 쟀다 — 구글뉴스 주소가 돌림길이고 제목에 매체가 없다.');
console.log('⛔ 「상업 기사」라고 판정하지 않았다 — 「사는 말이 든 제목」을 셌을 뿐이다.');

fs.writeFileSync(낼곳, `${JSON.stringify({
  잰때: new Date().toISOString(),
  밑감: 'archive/raw/community-desk/<날짜>.json',
  무엇을세나: '영문 구글뉴스 피드 셋에서, 가장 잦은 세 낱말 이음말이 든 항목의 몫과 「사는 말」이 든 항목의 몫.',
  안세는것: '발행 매체(구글뉴스 주소가 돌림길이다) · 기사 본문 · 「상업 기사인가」라는 판정.',
  사는말,
  ...r,
}, null, 2)}\n`, 'utf8');
console.log(`\n  ✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
