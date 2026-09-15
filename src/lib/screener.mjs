/**
 * screener.mjs — **거르는 셈틀.** 판정은 여기 있고, 지면은 그리기만 한다.
 *
 * 사장님 지시(2026-09-15): **「스크리너를 정교하게 만들어. 원하는 자료를 쉽게 고객들이 찾을 수 있게」**
 *
 * ── 🔴 이 자가 남과 다른 점 — «말없이 빠지는 곳»을 센다 ──────────────────────
 * 스크리너는 조건을 걸면 수가 줄어든다. 그런데 줄어드는 까닭이 «둘»이다 —
 *
 *   ① 조건에 안 맞아서 빠진다        ← 손님이 바라는 것
 *   ② 그 칸이 «비어 있어서» 빠진다    ← 손님이 모르는 채로 잃는 것
 *
 * PER 로 거르면 한국 2,709곳 가운데 **1,121곳이 ②로 사라진다**(PER 이 있는 곳은 1,588곳뿐).
 * 적자라서 없고, 안 냈어서 없고, 자본이 비어서 없다. 그런데 보통 스크리너는
 * 그 1,121곳을 «조용히» 버린다. 손님은 시장의 41%를 못 본 채로 결론을 낸다.
 *
 * ⇒ 이 자는 ②를 **따로 세어 돌려준다.** 지면이 그 수를 손님에게 보인다.
 *   `docs/작업지시서.md` 와 financials 지면이 이미 경고하던 것을 여기서 실제로 막는다.
 * ⛔ 「없는 값」을 0 으로 바꿔 넣지 않는다. 0 은 「없다」가 아니라 「영이다」다(강령 ③).
 *
 * ── 어느 칸을 «크면 좋은 것»으로 보나 ───────────────────────────────────────
 * ⛔ 우리가 정하지 않는다. 손님이 위/아래를 고른다. 이 자는 「좋다/나쁘다」를 말하지 않는다.
 *   그건 투자 판단이고, 우리는 사실만 놓는다.
 */

/** 시장 코드 → 사람이 읽는 이름. 실측: Y 830 · K 1,772 · N 107 = 2,709 */
export const 시장이름 = { Y: 'KOSPI', K: 'KOSDAQ', N: 'KONEX' };

/** 거를 수 있는 «수» 칸 — 지면의 미닫이와 이 목록이 같아야 한다 */
/* ⛔ 단위 글자는 «영문»이다 — 손님이 영어권이라 화면에 한국어를 안 낸다.
 *   나눔 = 손님이 «치는 수»를 원(₩) 으로 바꾸는 곱. ₩bn 이라 1e9 다.
 *   기존 지면(/data/valuation)이 ₩tn 을 쓰므로 같은 ₩ 표기로 맞춘다. */
export const 수칸 = [
  { key: 'c', 이름: 'Market cap', 단위: '₩bn', 나눔: 1e9 },
  { key: 'p', 이름: 'PER', 단위: 'ratio', 나눔: 1 },
  { key: 'b', 이름: 'PBR', 단위: 'ratio', 나눔: 1 },
  { key: 'r', 이름: 'ROE', 단위: '%', 나눔: 1 },
  { key: 'd', 이름: 'Debt / equity', 단위: '%', 나눔: 1 },
  { key: 'v', 이름: 'Revenue', 단위: '₩bn', 나눔: 1e9 },
];

/** 값이 «있나» — 0 은 있는 값이다. null·undefined·빈 글자·NaN 만 없는 것이다 */
export function 있나(v) {
  if (v === null || v === undefined || v === '') return false;
  return Number.isFinite(Number(v));
}

/**
 * 한 줄이 한 조건을 지나가나.
 * 낸다 — 'pass'(맞다) · 'fail'(안 맞다) · 'missing'(그 칸이 비어 있다)
 * 🔴 'missing' 을 'fail' 과 갈라 내는 것이 이 자의 핵심이다.
 */
export function 한조건(줄, 조건) {
  const v = 줄 ? 줄[조건.key] : undefined;
  if (!있나(v)) return 'missing';
  const n = Number(v);
  if (있나(조건.min) && n < Number(조건.min)) return 'fail';
  if (있나(조건.max) && n > Number(조건.max)) return 'fail';
  return 'pass';
}

/**
 * 거른다. 낸다 — { 남은것, 조건에안맞음, 값이없어빠짐, 칸별없음 }
 * ⭐ 값이없어빠짐 이 손님에게 보여야 하는 수다.
 */
export function 거른다(줄들, 조건들 = [], 글자 = '', 시장들 = null, 업종들 = null) {
  const 남은것 = [];
  let 조건에안맞음 = 0;
  let 값이없어빠짐 = 0;
  const 칸별없음 = {};
  const 찾을글 = String(글자 || '').trim().toLowerCase();

  for (const 줄 of 줄들 || []) {
    /* 글자·시장·업종은 «있고 없고»가 분명하다 — 여기서 빠지는 것은 그냥 안 맞는 것이다 */
    if (시장들 && 시장들.length && !시장들.includes(줄.m)) continue;
    if (업종들 && 업종들.length && !업종들.includes(줄.i)) continue;
    if (찾을글) {
      const 이름 = ((줄.n || '') + ' ' + (줄.k || '') + ' ' + (줄.t || '')).toLowerCase();
      if (!이름.includes(찾을글)) continue;
    }

    let 빠진까닭 = null;
    for (const 조건 of 조건들) {
      if (!있나(조건.min) && !있나(조건.max)) continue;   /* 안 건 조건은 안 본다 */
      const r = 한조건(줄, 조건);
      if (r === 'pass') continue;
      if (r === 'missing') {
        빠진까닭 = 'missing';
        칸별없음[조건.key] = (칸별없음[조건.key] || 0) + 1;
        break;
      }
      빠진까닭 = 'fail';
      break;
    }
    if (빠진까닭 === 'missing') { 값이없어빠짐 += 1; continue; }
    if (빠진까닭 === 'fail') { 조건에안맞음 += 1; continue; }
    남은것.push(줄);
  }
  return { 남은것, 조건에안맞음, 값이없어빠짐, 칸별없음 };
}

/**
 * 정렬한다. ⛔ 값이 «없는» 줄은 언제나 맨 아래로 보낸다 —
 * 위로 올리면 손님이 「0 인 곳이 제일 싸다」로 잘못 읽는다.
 */
export function 정렬한다(줄들, 칸, 내림차순 = true) {
  const 것 = [...(줄들 || [])];
  것.sort((A, B) => {
    const a = A[칸]; const b = B[칸];
    const aOk = 있나(a); const bOk = 있나(b);
    if (!aOk && !bOk) return 0;
    if (!aOk) return 1;          /* 없는 것은 아래로 */
    if (!bOk) return -1;
    return 내림차순 ? Number(b) - Number(a) : Number(a) - Number(b);
  });
  return 것;
}

/**
 * 원(₩) 을 손님이 읽는 꼴로 — ₩12.3tn · ₩345bn · ₩12m
 * ⛔ 「억·조」로 내지 않는다. 손님이 영어권이고, /data/valuation 이 이미 ₩tn 을 쓴다.
 */
export function 돈글(원) {
  if (!있나(원)) return '—';
  const n = Number(원);
  const a = Math.abs(n);
  if (a >= 1e12) return '₩' + (n / 1e12).toFixed(1) + 'tn';
  if (a >= 1e9) return '₩' + Math.round(n / 1e9).toLocaleString('en-US') + 'bn';
  if (a >= 1e6) return '₩' + Math.round(n / 1e6).toLocaleString('en-US') + 'm';
  return '₩' + Math.round(n).toLocaleString('en-US');
}

/* ── 자가시험 ──────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('있나: 0 은 있는 값이다', 있나(0) === true);
  재다('있나: null 은 없는 값', 있나(null) === false);
  재다('있나: 빈 글자는 없는 값', 있나('') === false);
  재다('있나: 글자는 없는 값', 있나('없음') === false);

  const 줄 = { t: '005930', n: 'Samsung', m: 'Y', i: 'Tech', c: 5e14, p: 12, b: 1.2, r: 9, d: 30 };
  재다('한조건: 사이에 들면 pass', 한조건(줄, { key: 'p', min: 5, max: 20 }) === 'pass');
  재다('한조건: 위를 넘으면 fail', 한조건(줄, { key: 'p', min: 5, max: 10 }) === 'fail');
  재다('한조건: 아래면 fail', 한조건(줄, { key: 'p', min: 20 }) === 'fail');
  재다('🔴 한조건: 칸이 비면 missing (fail 이 아니다)',
    한조건({ p: null }, { key: 'p', min: 5 }) === 'missing');

  /* 🔴 이 자가 있는 까닭 — 값이 없어 빠진 곳을 «따로» 센다 */
  const 셋 = [
    { t: 'A', p: 8 },          /* 지나간다 */
    { t: 'B', p: 30 },         /* 조건에 안 맞는다 */
    { t: 'C', p: null },       /* 값이 «없어서» 빠진다 — 손님이 알아야 한다 */
  ];
  const r = 거른다(셋, [{ key: 'p', min: 0, max: 10 }]);
  재다('🔴 남은 것은 하나', r.남은것.length === 1 && r.남은것[0].t === 'A');
  재다('🔴 조건에 안 맞은 것 하나', r.조건에안맞음 === 1);
  재다('🔴 값이 없어 빠진 것 하나 — 이 수가 손님에게 보여야 한다', r.값이없어빠짐 === 1);
  재다('🔴 어느 칸이 비었는지도 센다', r.칸별없음.p === 1);

  재다('조건을 안 걸면 아무도 안 빠진다', 거른다(셋, [{ key: 'p' }]).남은것.length === 3);
  재다('조건이 아예 없으면 다 남는다', 거른다(셋, []).남은것.length === 3);

  const 시장셋 = [{ m: 'Y', n: 'a' }, { m: 'K', n: 'b' }];
  재다('시장으로 거른다', 거른다(시장셋, [], '', ['Y']).남은것.length === 1);
  재다('업종으로 거른다', 거른다([{ i: 'Tech' }, { i: 'Bank' }], [], '', null, ['Tech']).남은것.length === 1);
  재다('이름으로 찾는다', 거른다([{ n: 'Samsung' }, { n: 'LG' }], [], 'sams').남은것.length === 1);
  재다('이름 찾기는 대소문자를 안 가린다', 거른다([{ n: 'Samsung' }], [], 'SAMS').남은것.length === 1);
  재다('종목코드로도 찾는다', 거른다([{ t: '005930', n: 'x' }], [], '005930').남은것.length === 1);

  const 정렬 = 정렬한다([{ p: 5 }, { p: null }, { p: 20 }], 'p', true);
  재다('정렬: 큰 것부터', 정렬[0].p === 20);
  재다('🔴 정렬: 값이 없는 것은 언제나 맨 아래', 정렬[2].p === null);
  const 오름 = 정렬한다([{ p: 5 }, { p: null }, { p: 20 }], 'p', false);
  재다('정렬: 작은 것부터일 때도 없는 것은 아래', 오름[0].p === 5 && 오름[2].p === null);

  재다('돈글: bn', 돈글(345 * 1e9) === '₩345bn');
  재다('돈글: tn', 돈글(12.3 * 1e12) === '₩12.3tn');
  재다('돈글: m', 돈글(12 * 1e6) === '₩12m');
  재다('돈글: 없으면 —', 돈글(null) === '—');
  재다('⛔ 돈글에 한국어가 없다', !/[가-힣]/.test(돈글(1e13) + 돈글(1e10) + 돈글(1e7)));
  재다('⛔ 수칸 단위에 한국어가 없다', 수칸.every((f) => !/[가-힣]/.test(f.단위 + f.이름)));
  재다('수칸: ₩bn 은 1e9 를 곱한다', 수칸.find((f) => f.key === 'c').나눔 === 1e9);

  재다('시장이름 셋', 시장이름.Y === 'KOSPI' && 시장이름.K === 'KOSDAQ' && 시장이름.N === 'KONEX');

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}
