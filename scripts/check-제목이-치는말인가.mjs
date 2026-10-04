#!/usr/bin/env node
/**
 * check-제목이-치는말인가.mjs — **우리 제목이 손님이 «치는 말»인지 한꺼번에 본다.**
 *
 * ── 🔴🔴 왜 만들었나 (2026-10-04 · 5번) ─────────────────────────────────
 * 사장님: 「했다며? 대체 뭘 했다는 거지? 신뢰가 안간다」
 *
 * 재 보니 ─ 지면 10,843장 · 28일 구글 클릭 10회.
 * 색인은 됐고 자리도 있었다. **제목이 아무도 안 치는 말**이었다.
 *
 * ```
 * 우리가 쓴 말                         손님이 치는 말(자동완성 1차례)
 * ───────────────────────────────────────────────────────────────
 * largest listed companies      →     biggest korean companies
 * 무료 사주풀이                  →     ai 사주 무료
 * Free BaZi Reading             →     saju calculator / bazi calculator
 * 免費四柱解读                   →     八字命盤 / 八字 ai
 * ```
 *
 * ⛔ 한 장씩 고치면 1만 장에 또 한 달이 걸린다. 그래서 «한꺼번에 보는 자»를 둔다.
 *
 * 무엇을 하나
 *   ① GSC 에 «뜬 말»을 읽는다 — 거기 자리가 30위 밖이면 그 말로 질 싸움을 하고 있다
 *   ② 그 말의 자동완성을 긁어 «사람이 실제로 치는 꼴»을 낸다
 *   ③ 그 꼴이 우리 지면 제목에 글자 그대로 들어 있나 본다
 *
 * ⛔ 이 자는 «판정하지 않는다». 고칠 자리를 사람에게 보여 줄 뿐이다.
 * ⛔ 「검색량 N회」라고 말하지 않는다 — 구글이 그 수를 공짜로 주지 않는다.
 *
 * 쓰는 법
 *   node scripts/check-제목이-치는말인가.mjs            GSC 자료가 있는 네 사이트
 *   node scripts/check-제목이-치는말인가.mjs --사이트 kcw
 *   node scripts/check-제목이-치는말인가.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 뒤처진선 = 30;   /* 30위 밖이면 사람 눈에 안 닿는다 */

/** GSC 자료에서 «뜬 말»을 꺼낸다. ⛔ 없으면 null — 빈 배열이 아니다 */
export function 뜬말들(묶음) {
  if (!묶음 || !Array.isArray(묶음.rows)) return null;
  return 묶음.rows
    .filter((r) => r && typeof r.key === 'string' && !r.key.startsWith('http'))
    .map((r) => ({ 말: r.key, 노출: r.impressions ?? 0, 클릭: r.clicks ?? 0, 자리: r.position ?? null }));
}

/** 질 싸움 — 노출은 나는데 자리가 뒤라 아무도 못 보는 말 */
export function 뒤처진말들(것들, 선 = 뒤처진선) {
  if (!Array.isArray(것들)) return null;
  return 것들
    .filter((x) => typeof x.자리 === 'number' && x.자리 > 선)
    .sort((a, b) => b.노출 - a.노출);
}

/** 제목에 그 말이 «글자 그대로» 들어 있나. 띄어쓰기·대소문자는 눈감는다 */
export function 제목에들었나(제목, 말) {
  const 고르기 = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const t = 고르기(제목); const m = 고르기(말);
  if (!t || !m) return false;
  if (t.includes(m)) return true;
  /* 🔴🔴 [2026-10-04 · 5번] **통째로 이어진 글자만 찾으면 거짓 흠이 난다.**
     「illit age」를 치는데 우리 제목은 「Illit members: birthdays and ages 2026」이다.
     ① 「ages」와 「age」가 다르고 ② 「illit」과 「age」가 떨어져 있다.
     구글은 둘 다 같은 말로 본다 — 우리 자만 「없다」고 했다.
     ⇒ **말의 낱말이 제목에 다 있으면 들었다고 본다.** 차례는 안 따진다.
     ⛔ 더 넓히지 않는다 — 어간을 잘라 맞추기 시작하면 아무 말이나 「들었다」가 된다.
       끝의 s 하나만 눈감고, 네 글자 미만은 건드리지 않는다(is/as 가 i/a 가 되면 안 된다). */
  /* 🔴 [2026-10-04 · 5번] **한국어는 띄어쓰기가 사람마다 다르다.**
     「대구 외국어 대학교」를 치는데 우리 제목은 「대구외국어대학교」다 — 같은 말인데
     낱말로 쪼개면 안 맞는다. 한글은 띄어쓰기를 다 지우고 통째로 견준다.
     ⛔ 영어에는 안 쓴다 — 띄어쓰기를 지우면 「korean companies」가 아무 데나 걸린다. */
  const 한글만 = (s) => s.replace(/[^가-힣0-9]/g, '');
  if (/[가-힣]/.test(m) && 한글만(m) && 한글만(t).includes(한글만(m))) return true;

  /* 🔴 [2026-10-04 · 5번] **「K-pop」과 「kpop」이 딴 말로 걸렸다.**
     우리 제목은 「K-pop idols born in July」인데 손님은 「kpop idol born in july」를 친다.
     구글은 같게 보는데 우리 자만 「없다」고 했다 — 또 거짓 흠이다.
     ⇒ 낱말 사이의 이음표를 지운 꼴로도 한 번 견준다. */
  const 이음표뗀 = (s) => s.replace(/-/g, '');
  if (이음표뗀(t).includes(이음표뗀(m))) return true;

  const 홑 = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
  /* 🔴 [2026-10-04 · 5번] **이음표를 떼고 쪼갰더니 다른 데가 깨졌다.**
     「Jung Hae-in movies」가 「junghaein movies」가 되어 「jung hae in movies」와
     안 맞았다 — 고치려던 자리는 고쳤는데 멀쩡하던 두 자리가 새로 걸렸다.
     ⇒ **쪼갤 때는 이음표를 «구분자»로 둔다**(hae-in → hae, in).
       통째로 견줄 때만 이음표를 뗀다 — 그 둘은 하는 일이 다르다.
     ⚠ 하나를 고치면 인용한 곳까지 따라간다(강령 ⑤). 고친 뒤 꼭 다시 센다. */
  const 쪼개 = (s) => s.split(/[^0-9a-z가-힣]+/).filter(Boolean).map(홑);
  /* ⚠ 제목의 「K-pop」은 k·pop 둘로 쪼개지고 손님이 치는 「kpop」은 하나다.
     그래서 제목 쪽에는 **쪼갠 꼴과 이음표 뗀 꼴을 둘 다** 담는다.
     ⛔ 말 쪽에는 안 한다 — 말을 늘리면 아무 제목이나 걸린다. */
  const 제목낱말 = new Set([...쪼개(t), ...쪼개(이음표뗀(t))]);
  const 말낱말 = 쪼개(m);
  if (!말낱말.length) return false;
  return 말낱말.every((w) => 제목낱말.has(w));
}

/** 뜬 말 가운데 어느 것도 제목에 없으면 그 지면은 «딴 말»을 쓰고 있다 */
export function 딴말쓰나(제목, 말들) {
  if (!Array.isArray(말들) || !말들.length) return null;   /* 못 쟀다 */
  return !말들.some((m) => 제목에들었나(제목, typeof m === 'string' ? m : m.말));
}

/**
 * 🔴🔴 [2026-10-04 · 5번] **어느 지면을 고치면 되는지까지 집어 준다.**
 *
 * 처음 이 자는 「질 싸움 중인 말 117가지」만 세고 끝났다. 그래서 내가 하나씩 손으로
 * 라이브 제목을 열어 보며 고쳤다 — 그렇게 하면 117가지에 또 한 달이 걸린다.
 *
 * 쥔 자료에 이미 답이 있었다 — GSC 의 `query+page` 갈래는 **어느 말에 어느 지면이
 * 떴는지**를 같이 준다. 그 지면 제목에 그 말이 있나만 보면 고칠 자리가 바로 나온다.
 *
 * ⛔ 판정하지 않는다. 「이 지면 제목에 이 말이 없다」까지가 우리가 아는 전부다.
 * ⛔ 자료가 없으면 null — 빈 배열이 아니다.
 */
export function 고칠자리(qp묶음, 제목표, 선 = 뒤처진선) {
  if (!qp묶음 || !Array.isArray(qp묶음.rows)) return null;
  const 모음 = new Map();
  for (const r of qp묶음.rows) {
    /* 🔴 [2026-10-04] 꼴이 두 가지다 — GSC 원래 꼴은 `keys: [말, 주소]` 인데
       우리가 저장한 것은 `{ key: 말, page: 주소 }` 다. 둘 다 읽는다.
       ⚠ 처음에 keys 만 보고 「고칠 자리 0장」이 나왔다. 0 이 나오면 자를 먼저 의심한다. */
    const 열쇠 = Array.isArray(r?.keys) ? r.keys : [r?.key, r?.page];
    const 말 = String(열쇠[0] ?? '').trim();
    const 주소 = String(열쇠[1] ?? '').trim();
    if (!말 || !주소.startsWith('http')) continue;
    if (typeof r.position !== 'number' || r.position <= 선) continue;
    const 길 = 주소.replace(/^https?:\/\/[^/]+/, '') || '/';
    const 앞 = 모음.get(길) ?? { 길, 말들: [], 노출: 0 };
    앞.말들.push(말); 앞.노출 += r.impressions ?? 0;
    모음.set(길, 앞);
  }
  const 것 = [];
  for (const v of 모음.values()) {
    const 제목 = 제목표 instanceof Map ? 제목표.get(v.길) : (제목표 ?? {})[v.길];
    /* 제목을 못 읽었으면 «모른다»다. 「딴 말을 쓴다」로 적지 않는다 */
    const 딴말 = 제목 == null ? null : 딴말쓰나(제목, v.말들);
    것.push({ ...v, 제목: 제목 ?? null, 딴말 });
  }
  return 것.sort((a, b) => b.노출 - a.노출);
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const T = (이름, 참) => 결과.push({ 이름, 참: !!참 });

  T('🔴 뜬 말을 꺼낸다',
    (뜬말들({ rows: [{ key: 'a b', impressions: 3, clicks: 0, position: 44 }] }) || []).length === 1);
  T('⛔ 주소 줄은 말이 아니다 — 걸러낸다',
    (뜬말들({ rows: [{ key: 'https://x/y', impressions: 1 }] }) || []).length === 0);
  T('⛔ 자료가 없으면 null — 빈 배열이 아니다',
    뜬말들(null) === null && 뜬말들({}) === null);

  T('🔴 30위 밖을 집는다',
    (뒤처진말들([{ 말: 'a', 노출: 1, 자리: 66 }, { 말: 'b', 노출: 1, 자리: 4 }]) || []).length === 1);
  T('노출 많은 차례로 준다',
    뒤처진말들([{ 말: 'a', 노출: 1, 자리: 66 }, { 말: 'b', 노출: 9, 자리: 70 }])[0].말 === 'b');
  T('⛔ 자리를 못 잰 줄은 안 집는다',
    (뒤처진말들([{ 말: 'a', 노출: 1, 자리: null }]) || []).length === 0);
  T('⛔ 배열이 아니면 null', 뒤처진말들(null) === null);

  T('🔴 제목에 든 것을 찾는다',
    제목에들었나('The biggest Korean companies by market cap', 'biggest korean companies'));
  T('띄어쓰기·대소문자는 눈감는다',
    제목에들었나('Biggest   Korean  Companies', 'biggest korean companies'));
  T('⛔ 없으면 거짓',
    !제목에들었나("Korea's 10 largest listed companies", 'biggest korean companies'));
  /* 🔴 [2026-10-04] ages 와 age 를 딴 말로 세면 거짓 흠이 난다 */
  T('🔴 끝의 s 하나는 눈감는다', 제목에들었나('Illit members: birthdays and ages 2026', 'illit age'));
  T('⛔ 그래도 다른 말은 안 걸린다', !제목에들었나('Illit members ages', 'izna members'));
  T('⛔ 짧은 낱말은 안 건드린다 — is/as 가 i/a 가 되면 안 된다',
    !제목에들었나('this is a test', 'thi i a tet'));
  /* 🔴 [2026-10-04] 한국어 띄어쓰기는 사람마다 다르다 */
  T('🔴 한글은 띄어쓰기를 눈감는다', 제목에들었나('대구외국어대학교 — 백년지도', '대구 외국어 대학교'));
  T('⛔ 그래도 다른 학교는 안 걸린다', !제목에들었나('대구외국어대학교', '부산외국어대학교'));
  T('⛔ 영어는 띄어쓰기를 지우지 않는다 — 아무 데나 걸린다',
    !제목에들었나('Koreancompaniesmap', 'korean companies'));
  /* 🔴 [2026-10-04] K-pop 과 kpop 을 딴 말로 세면 거짓 흠이 난다 */
  T('🔴 이음표를 눈감는다', 제목에들었나('K-pop idols born in July — 136 of 718', 'kpop idol born in july'));
  T('⛔ 그래도 다른 달은 안 걸린다', !제목에들었나('K-pop idols born in July', 'kpop idol born in may'));
  /* 🔴 [2026-10-04] 이음표를 떼고 쪼갰더니 이 자리가 깨졌다 — 고친 뒤 꼭 다시 센다 */
  T('🔴 이름 속 이음표는 띄어쓰기로 본다',
    제목에들었나('Jung Hae-in movies and TV shows — 69 countries', 'jung hae in movies'));
  T('🔴 Ma Dong-seok 도 같다',
    제목에들었나('Ma Dong-seok movies and TV shows — 89 countries', 'ma dong seok movies'));
  T('⛔ 빈 것에도 안 터진다',
    !제목에들었나('', 'a') && !제목에들었나(null, null));

  T('🔴 하나도 안 들었으면 딴 말이다',
    딴말쓰나('largest listed companies', ['biggest korean companies']) === true);
  T('하나라도 들었으면 아니다',
    딴말쓰나('biggest korean companies by cap', ['biggest korean companies']) === false);
  T('⛔ 잴 말이 없으면 null — 거짓이 아니다',
    딴말쓰나('아무 말', []) === null && 딴말쓰나('아무 말', null) === null);

  /* 🔴 [2026-10-04 · 5번] 고칠 자리를 집어 주는 몫 — 시험이 없으면 다음 사람이 뺀다 */
  const qp = { rows: [
    { keys: ['취업률 순위', 'https://100yearmap.com/university'], impressions: 5, position: 70 },
    /* ⚠ [2026-10-04] 처음에 '대학 취업률'로 시험했는데 그 말은 제목에 «실제로 들어 있다»
       — 자가 맞고 내 시험이 틀렸다. 제목에 정말 없는 말로 바꾼다 */
    { keys: ['대학 서열', 'https://100yearmap.com/university'], impressions: 3, position: 66 },
    { keys: ['가까운 말', 'https://100yearmap.com/major'], impressions: 9, position: 4 },
  ] };
  const 표 = new Map([['/university', '전국 대학 377곳 취업률·중도탈락률']]);
  const 집은것 = 고칠자리(qp, 표);
  T('🔴 30위 밖인 말만 집는다 — 4위짜리는 뺀다',
    집은것.length === 1 && 집은것[0].길 === '/university');
  T('🔴 한 지면에 붙은 말을 모은다', 집은것[0].말들.length === 2);
  T('노출을 더한다', 집은것[0].노출 === 8);
  T('🔴 제목에 그 말이 하나도 없으면 「딴 말」이라고 한다', 집은것[0].딴말 === true);
  T('제목에 들었으면 아니다',
    고칠자리(qp, new Map([['/university', '대학 취업률 순위 — 전국 377곳']]))[0].딴말 === false);
  T('⛔ 제목을 못 읽으면 null — 「딴 말」로 안 적는다',
    고칠자리(qp, new Map())[0].딴말 === null);
  T('⛔ 자료가 없으면 null', 고칠자리(null, 표) === null && 고칠자리({}, 표) === null);
  /* 🔴 [2026-10-04] 우리가 저장한 꼴은 { key, page } 다 — 그것도 읽는지 본다 */
  T('🔴 { key, page } 꼴도 읽는다', 고칠자리(
    { rows: [{ key: '취업률 순위', page: 'https://100yearmap.com/university', impressions: 5, position: 70 }] },
    표)[0].길 === '/university');

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 제목이 치는 말인가 — 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--selftest') || 인자.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  const i = 인자.indexOf('--사이트');
  const 고른것 = i >= 0 ? [인자[i + 1]] : ['kcw', 'klifemap', '100y', 'seoulmarkets'];

  let 다뤄야할것 = 0;
  for (const 딱지 of 고른것) {
    const 것들 = fs.readdirSync(path.join(뿌리, 'src/data'))
      .filter((n) => n.startsWith(`gsc-${딱지}-2`) && n.endsWith('.json')).sort();
    const 마지막 = 것들[것들.length - 1];
    if (!마지막) { console.log(`\n⚠ ${딱지} — GSC 자료가 없다. 못 쟀다`); continue; }
    const 묶음 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data', 마지막), 'utf8'));
    const 말들 = 뜬말들(묶음);
    if (말들 === null) { console.log(`\n⚠ ${딱지} — 자료를 못 읽었다`); continue; }
    const 뒤 = 뒤처진말들(말들);
    console.log(`\n■ ${딱지} — 뜬 말 ${말들.length}가지 · 그중 ${뒤처진선}위 밖 **${뒤.length}가지**`);
    if (!말들.length) {
      console.log('   🔴 뜬 말이 하나도 없다 — 구글이 이 사이트를 어느 물음에도 안 내놓는다');
      다뤄야할것 += 1; continue;
    }
    for (const x of 뒤.slice(0, 8)) {
      console.log(`   노출 ${String(x.노출).padStart(3)} · 자리 ${String(Math.round(x.자리)).padStart(3)}위   ${x.말}`);
    }
    다뤄야할것 += 뒤.length;
  }
  console.log(`\n■ 질 싸움을 하고 있는 말 합 **${다뤄야할것}가지**`);
  console.log('   ⭐ 고치는 길 — 그 말을 자동완성에 넣어 «사람이 치는 꼴»을 보고,');
  console.log('      그 꼴을 지면 제목·H1·첫 문단에 «글자 그대로» 넣는다.');
  console.log('        node scripts/재본다-그말을-몇명이-찾나.mjs "<그 말>"');
  console.log('   ⛔ 슬러그(주소)는 바꾸지 않는다 — 쌓인 색인이 처음으로 돌아간다.');
}
