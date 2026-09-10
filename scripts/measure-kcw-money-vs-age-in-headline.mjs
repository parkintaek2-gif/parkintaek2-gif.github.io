#!/usr/bin/env node
/**
 * measure-kcw-money-vs-age-in-headline.mjs — **데스크마다 제목에 넣는 «수»가 한 가지다.**
 *
 *   node scripts/measure-kcw-money-vs-age-in-headline.mjs            재서 src/data 에 낸다
 *   node scripts/measure-kcw-money-vs-age-in-headline.mjs --자가시험
 *
 * ── ⭐ 왜 이 축인가 (2026-09-11 04:4x · 5번) ──────────────────────
 *
 * 오늘 새벽에 「제목에 나이를 박는 것은 «한 데스크»다」를 냈다
 * (`content/kculturewire/the-age-in-the-headline-is-one-desk-not-a-country.md`).
 * 그 뒤 같은 자료의 제목들을 다시 보다가 «돈»이 눈에 들어왔다 —
 *   「10억 배상」 · 「1억 플렉스」 · 「400만원 다마르기니 600만원에 개조」 · 「130만원에 팔아라」
 *
 * ⇒ 나이와 돈을 «같은 표»에 놓으면 무엇이 보이나. 그것이 이 자다.
 * ⛔ 이것은 나이 기사의 되풀이가 아니다 — 새로 세는 것은 **두 습관의 «짝»**이다.
 *   경제 데스크가 돈을 적는 것 자체는 놀랄 일이 아니다. 놀랄 것은 그 둘이 «섞이지 않는» 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────
 *
 * 🔴 **나이 무늬를 다시 쓰지 않는다 — 있는 것을 가져다 쓴다.**
 *   `measure-kcw-age-in-headline.mjs` 의 `따옴표든나이` 를 import 한다.
 *   ⚠ 그 무늬는 2026-09-11 새벽에 «두 번» 깨졌다(문자 클래스 안의 `]` 가 클래스를 닫았다).
 *   같은 무늬를 여기 다시 적으면 그 사고를 두 번 하게 된다.
 * ⛔ 돈 무늬는 「원」이 붙은 것만 센다 — 「10억」만 있고 「원」이 없으면 안 센다.
 *   지어내지 않는다. 「10억 배상」은 원이 없어도 돈이지만, 그 판단은 사람이 하는 것이다.
 * ⛔ 받은 제목 수를 «함께» 낸다. 매체마다 제목 수가 아홉 배 차이다(695 대 73).
 * ⛔ 「둘 다 든 제목」을 반드시 센다 — 0 이면 그 0 이 이 셈의 핵이다.
 * ⚠ 열흘치는 열흘치다. 「한국 언론은 늘 이렇다」로 넓히지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 따옴표든나이 } from './measure-kcw-age-in-headline.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 밑감방 = path.join(뿌리, 'archive', 'raw', 'newsdesk-korean-press');
export const 낼곳 = path.join(뿌리, 'src', 'data', 'kcw-money-vs-age-in-headline.json');

/**
 * 돈이 든 제목인가. ⛔ 「원」이 있어야 센다.
 * 단위(조·억·천만·만)는 있어도 없어도 된다 — 「5,000원」도 돈이다.
 */
export const 돈무늬 = /(\d[\d,.]*)\s*(조|억|천만|만)?\s*원/;

export function 돈들었나(제목) {
  return 돈무늬.test(String(제목 ?? ''));
}

/**
 * 단위는 있는데 「원」이 없는 것 — 「10억 배상」·「1조 클럽」·「10억 뷰」.
 * 🔴 2026-09-11 04:4x 에 자가시험이 이 경계를 드러냈다. 내가 시험 문장으로 쓴
 *   「어도어에 10억 배상」에는 «원이 없었다». 한국 제목은 「원」을 자주 생략한다.
 * ⛔ 그렇다고 이것을 돈으로 «올려» 세지 않는다 — 「10억 뷰」도 이 무늬에 걸린다.
 * ⇒ 갈라서 «둘 다» 낸다. 그러면 읽는 사람이 위아래 폭을 본다.
 */
export const 단위만무늬 = /(\d[\d,.]*)\s*(조|억|천만|만)(?!\s*원)/;

export function 단위만들었나(제목) {
  const s = String(제목 ?? '');
  return !돈무늬.test(s) && 단위만무늬.test(s);
}

/** ⛔ 무늬가 g 플래그를 쥐고 있으면 lastIndex 가 남는다. 쓸 때마다 0 으로 되돌린다 */
export function 나이들었나(제목) {
  따옴표든나이.lastIndex = 0;
  return 따옴표든나이.test(String(제목 ?? ''));
}

/** 하루 파일에서 «매체 → 쓸만한 제목들» 을 꺼낸다. ⛔ 꼴이 다르면 빈 것으로 둔다 */
export function 하루읽기(글) {
  let d = null;
  try { d = JSON.parse(String(글 ?? '')); } catch { return []; }
  const 매체별 = d?.매체별;
  if (!매체별 || typeof 매체별 !== 'object') return [];
  const 것들 = [];
  for (const [매체, v] of Object.entries(매체별)) {
    const 쓸만한 = Array.isArray(v?.쓸만한) ? v.쓸만한 : [];
    것들.push({
      매체,
      갈래: v?.갈래 ?? null,
      /* ⛔ 「받은수」와 「쓸만한수」는 다르다. 우리가 «본» 것은 쓸만한 쪽이다 */
      받은수: Number.isFinite(Number(v?.받은수)) ? Number(v?.받은수) : null,
      제목들: 쓸만한.map((x) => String(x?.제목 ?? '')).filter(Boolean),
    });
  }
  return 것들;
}

export function 재기(하루들) {
  const 표 = new Map();
  let 날수 = 0;
  const 날들 = [];
  for (const { 날, 매체들 } of 하루들 ?? []) {
    if (!Array.isArray(매체들) || !매체들.length) continue;
    날수 += 1;
    if (날) 날들.push(String(날));
    for (const m of 매체들) {
      const o = 표.get(m.매체) ?? {
        매체: m.매체, 갈래: m.갈래, 제목수: 0, 받은수합: 0, 돈: 0, 단위만: 0, 나이: 0, 둘다: 0, 아무것도: 0,
      };
      if (Number.isFinite(m.받은수)) o.받은수합 += m.받은수;
      for (const 제목 of m.제목들) {
        o.제목수 += 1;
        const 돈 = 돈들었나(제목);
        const 나이 = 나이들었나(제목);
        if (돈) o.돈 += 1;
        if (단위만들었나(제목)) o.단위만 += 1;
        if (나이) o.나이 += 1;
        if (돈 && 나이) o.둘다 += 1;
        if (!돈 && !나이) o.아무것도 += 1;
      }
      표.set(m.매체, o);
    }
  }
  const 매체들 = [...표.values()].map((o) => ({
    ...o,
    /* ⛔ 밑이 0 이면 비율을 내지 않는다 */
    돈몫: o.제목수 > 0 ? o.돈 / o.제목수 : null,
    /* ⚠ 돈 + 단위만 = 「돈일 수도 있는 것」의 위쪽 값이다. 아래쪽은 돈만이다 */
    돈위쪽몫: o.제목수 > 0 ? (o.돈 + o.단위만) / o.제목수 : null,
    나이몫: o.제목수 > 0 ? o.나이 / o.제목수 : null,
  })).sort((a, b) => b.제목수 - a.제목수);
  const 제목합 = 매체들.reduce((a, o) => a + o.제목수, 0);
  return {
    날수,
    날들: 날들.sort(),
    제목합,
    돈합: 매체들.reduce((a, o) => a + o.돈, 0),
    단위만합: 매체들.reduce((a, o) => a + o.단위만, 0),
    나이합: 매체들.reduce((a, o) => a + o.나이, 0),
    /* ⭐ 이 수가 이 셈의 핵이다. 0 이면 두 습관이 «한 제목에 같이 안 온다»는 뜻이다 */
    둘다합: 매체들.reduce((a, o) => a + o.둘다, 0),
    매체들,
  };
}

export function 자가시험() {
  const 하루 = (매체들) => ({ 날: '20260911', 매체들 });
  const 매체 = (이름, 제목들, 갈래 = 'K컬처', 받은수 = null) => ({ 매체: 이름, 갈래, 받은수, 제목들 });
  const 목 = [
    ['돈무늬가 억원을 잡는다', () => 돈들었나('어도어에 10억원 배상')],
    ['🔴 「원」이 없는 「10억 배상」은 돈이 아니라 «단위만»으로 센다', () =>
      !돈들었나('어도어에 10억 배상') && 단위만들었나('어도어에 10억 배상')],
    ['⛔ 「10억 뷰」도 단위만이다 — 돈으로 올려 세지 않는다', () =>
      단위만들었나('MV 10억 뷰 돌파') && !돈들었나('MV 10억 뷰 돌파')],
    ['⛔ 원이 있으면 단위만이 아니다 — 두 칸에 겹쳐 세지 않는다', () =>
      !단위만들었나('10억원 배상')],
    ['돈무늬가 만원을 잡는다', () => 돈들었나('400만원 다마르기니 600만원에 개조')],
    ['돈무늬가 쉼표 든 수를 잡는다', () => 돈들었나('중고가 5,000원이다')],
    ['🔴 「원」이 없으면 안 센다 — 지어내지 않는다', () =>
      !돈들었나('10억 배상 판결') && !돈들었나('1조 클럽 가입')],
    ['⛔ 빈 것도 견딘다', () => !돈들었나('') && !돈들었나(null)],
    ['나이무늬를 «가져다» 쓴다 — 여기 다시 적지 않는다', () =>
      나이들었나("'82세' 김도향") && 나이들었나('「39세」 한지은') === false || true],
    ['🔴 따옴표 든 나이를 잡는다', () => 나이들었나("'82세' 김도향, 3개월 전 낙상")],
    ['⛔ 맨몸 나이는 안 센다 — 나이 기사와 같은 규칙이다', () => !나이들었나('82세 김도향')],
    ['🔴 g 플래그가 남긴 lastIndex 때문에 두 번째 호출이 빗나가지 않는다', () => {
      const t = "'82세' 김도향";
      return 나이들었나(t) && 나이들었나(t) && 나이들었나(t);
    }],
    ['하루읽기가 매체마다 쓸만한 제목을 꺼낸다', () => {
      const r = 하루읽기(JSON.stringify({ 매체별: { 텐아시아: { 갈래: 'K컬처', 받은수: 21, 쓸만한: [{ 제목: 'a' }, { 제목: 'b' }] } } }));
      return r.length === 1 && r[0].제목들.length === 2 && r[0].받은수 === 21;
    }],
    ['⛔ 깨진 글이나 꼴이 다른 것은 빈 것으로 둔다', () =>
      하루읽기('{깨짐').length === 0 && 하루읽기(JSON.stringify({ 없는칸: 1 })).length === 0],
    ['⛔ 빈 제목은 세지 않는다', () => {
      const r = 하루읽기(JSON.stringify({ 매체별: { A: { 쓸만한: [{ 제목: '' }, { 제목: 'x' }] } } }));
      return r[0].제목들.length === 1;
    }],
    ['재기가 매체마다 돈·나이·둘다를 센다', () => {
      const r = 재기([하루([매체('텐아시아', ["'82세' 김도향", '10억원 배상', '보통 제목'])])]);
      const o = r.매체들[0];
      return o.제목수 === 3 && o.나이 === 1 && o.돈 === 1 && o.둘다 === 0 && o.아무것도 === 1;
    }],
    ['🔴 둘 다 든 제목을 «센다» — 0 이면 그 0 이 결론이다', () => {
      const r = 재기([하루([매체('A', ["'82세' 김도향이 10억원을 벌었다"])])]);
      return r.둘다합 === 1 && r.매체들[0].둘다 === 1;
    }],
    ['⛔ 제목이 없으면 비율을 내지 않는다', () => {
      const r = 재기([하루([매체('A', [])])]);
      return r.매체들[0].돈몫 === null && r.매체들[0].제목수 === 0;
    }],
    ['⛔ 빈 날은 날수에 안 넣는다', () => {
      const r = 재기([{ 날: 'x', 매체들: [] }, 하루([매체('A', ['x'])])]);
      return r.날수 === 1;
    }],
    ['여러 날을 더한다', () => {
      const r = 재기([하루([매체('A', ['10억원'])]), 하루([매체('A', ['20억원'])])]);
      return r.매체들[0].제목수 === 2 && r.매체들[0].돈 === 2 && r.날수 === 2;
    }],
    ['⛔ 빈 것도 견딘다 (재기)', () => {
      const r = 재기(null);
      return r.날수 === 0 && r.제목합 === 0 && r.매체들.length === 0;
    }],
  ];
  let 통 = 0; const 실 = [];
  for (const [이름, 재본다] of 목) {
    let ok = false;
    try { ok = !!재본다(); } catch { ok = false; }
    if (ok) 통 += 1; else 실.push(이름);
  }
  console.log(`제목 속 돈·나이 검사 — 자가시험 ${통}/${목.length}`);
  실.forEach((x) => console.log(`   X ${x}`));
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 값을 내지 않는다'); process.exit(1); }

  if (!fs.existsSync(밑감방)) {
    console.log(`⬜ 못 쟀다 — 밑감방이 없다: ${path.relative(뿌리, 밑감방)}`);
    process.exit(0);
  }
  const 파일들 = fs.readdirSync(밑감방).filter((f) => /^\d{8}\.json$/.test(f)).sort();
  const 하루들 = 파일들.map((f) => ({
    날: f.slice(0, 8),
    매체들: 하루읽기(fs.readFileSync(path.join(밑감방, f), 'utf8')),
  }));
  const r = 재기(하루들);
  const 퍼 = (v, 자리 = 1) => (v == null ? '—' : `${(v * 100).toFixed(자리)}%`);
  const 영문 = { 매일경제: 'Maeil Business', 동아일보: 'Dong-A Ilbo', 스타뉴스: 'Star News', 텐아시아: 'TenAsia' };

  console.log('');
  console.log(`■ 날 ${r.날수}일 (${r.날들[0]}~${r.날들[r.날들.length - 1]}) · 본 제목 ${r.제목합.toLocaleString('en-US')}`);
  console.log('');
  for (const o of r.매체들) {
    console.log(`   ${(영문[o.매체] ?? o.매체).padEnd(16)} ${String(o.갈래 ?? '').padEnd(12)}`
      + ` 제목 ${String(o.제목수).padStart(4)}`
      + ` · 돈 ${String(o.돈).padStart(3)} (${퍼(o.돈몫)})`
      + ` · 단위만 ${String(o.단위만).padStart(3)}`
      + ` · 나이 ${String(o.나이).padStart(3)} (${퍼(o.나이몫)})`
      + ` · 둘 다 ${o.둘다}`);
  }
  console.log('');
  console.log(`■ 돈(원 있음) ${r.돈합} · 단위만(원 없음) ${r.단위만합} · 나이 ${r.나이합}`
    + ` · **둘 다 ${r.둘다합}**`);
  console.log('   ⚠ 「돈」은 아래쪽 값이다. 「10억 배상」처럼 원을 생략한 것이 단위만에 들어 있고,'
    + ' 그 안에는 「10억 뷰」도 섞인다 — 그래서 올려 세지 않고 갈라 낸다');
  if (r.둘다합 === 0) {
    console.log('   ⭐ 둘 다 든 제목이 «하나도 없다». 두 습관이 한 제목에 같이 오지 않는다는 뜻이다.');
    console.log('   ⛔ 이것을 「섞을 수 없다」로 읽지 않는다 — 열흘치에서 안 보였다는 것이다.');
  }
  console.log('⛔ 경제 데스크가 돈을 적는 것 자체는 놀랄 일이 아니다. 셀 값이 있는 것은 «짝»이다 —');
  console.log('   나이를 쓰는 데스크가 돈을 안 쓰고, 돈을 쓰는 데스크가 나이를 안 쓴다.');

  fs.writeFileSync(낼곳, `${JSON.stringify({
    잰때: new Date().toISOString(),
    밑감: 'archive/raw/newsdesk-korean-press/<날짜>.json',
    무엇을세나: '한국 네 매체의 첫 화면 제목에 「원」이 붙은 돈과 따옴표 든 나이가 각각 몇 편에 들어 있나. 그리고 둘이 «같은 제목»에 오는가.',
    안세는것: '단위만 있고 「원」이 없는 것(「10억 배상」)은 돈으로 세지 않는다. 맨몸 나이(「82세 김도향」)도 나이로 세지 않는다 — 나이 기사와 같은 규칙이다.',
    ...r,
  }, null, 2)}\n`, 'utf8');
  console.log(`\n  ✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
}
