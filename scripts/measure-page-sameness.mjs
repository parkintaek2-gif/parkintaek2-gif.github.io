/**
 * measure-page-sameness.mjs — **「우리 지면이 서로 얼마나 같은가」를 잰다. 전 유닛이 쓴다.**
 *
 * ── 🔴 왜 이 자가 생겼나 (2026-08-24 밤) ──────────────────────
 * 사장님: 「모두 하던 일을 멈추고 **방문자가 왜 없는지를 분석하라.**」
 *
 * 깔때기를 끝에서 끝까지 갈라 보니 앞의 셋이 전부 «아니»었다 —
 * ```
 *   ⛔ CTR 문제가 아니다      3번 4~10위 CTR 2.63% (기대 3%) — 순위값만큼 받는다
 *   ⛔ 순위 문제가 아니다     지면의 61~82%가 1~10위다
 *   ⛔ 색인 «설정» 문제가 아니다  사이트맵·robots·IndexNow 다 정상이다
 * ```
 * 그런데 수요가 «큰» 주제에서 재 보니 이야기가 뒤집혔다 —
 * ```
 *   위키 조회 1만 이상 인기작 23편(합 60만 조회/30일)
 *      우리가 28일간 받은 노출     39회
 *      그중 한 번도 안 뜬 것       14편
 *      뜬 것의 평균 위치           23.1위
 *   Squid Game    위키 87,213회 → 우리 노출 3회 · 22위
 * ```
 * ⇒ **수요 없는 말에서만 1위였다.** 경쟁이 있는 자리에서는 22위다.
 *
 * 그래서 「왜 색인이 밀리나」를 재니 이것이 나왔다 —
 * ```
 *   갈래        지면수   본문글자   서로 겹치는 낱말    색인
 *   article        117    6,180        40%           100%
 *   born-on        366    1,118        67%           노출 0
 *   week           268    2,137        71%           크롤했는데 안 넣음
 *   market          93    3,819        88%
 *   firm            19    2,744        92%   ← 거의 같은 지면 19장
 * ```
 * 🔴 **판박이 비율이 색인률을 그대로 예측한다.** 기사만 40%이고 나머지는 67~92%다.
 *   구글은 그런 묶음을 「대량 생성된 얇은 지면」으로 보고 색인을 미룬다.
 *   ⇒ 지면을 더 찍어 내는 것이 오히려 색인을 막고 있었다.
 *
 * ── ⛔ 이 자를 읽는 법 ────────────────────────────────────────
 * ⛔ 「겹치는 낱말이 많다」가 곧 「나쁘다」는 아니다. 같은 갈래 지면은 원래 좀 닮는다.
 *   ⚠ 우리가 잰 것은 «우리 사이트 안에서» 기사 40%는 다 색인되고 67% 위는 밀린다는 것뿐이다.
 *     이것은 우리 다섯 갈래에서 본 것이지 구글이 밝힌 문턱이 아니다. 그렇게 적는다.
 * ⛔ 낱말이 아니라 **문장 틀**이 문제다. 자료는 지면마다 다른데 그것을 감싼 문장이 같다.
 *   고칠 것은 자료가 아니라 «자료에서 나온 문장을 늘리고 템플릿 문장을 줄이는 것»이다.
 *
 * ── 쓰기 ──────────────────────────────────────────────────────
 *   node scripts/measure-page-sameness.mjs --방=dist/100y      (3번)
 *   node scripts/measure-page-sameness.mjs --방=dist/wikitip   (5번·기본)
 *   node scripts/measure-page-sameness.mjs --자가시험
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const 인자 = (이름, 기본) => {
  const a = process.argv.find((x) => x.startsWith(`--${이름}=`));
  return a ? a.slice(이름.length + 3) : 기본;
};

/**
 * 본문만 남긴다. ⛔ HTML 통째로 세면 머리·꼬리가 다 겹쳐서 «전부 판박이»로 나온다 —
 * 그건 자의 흠이지 지면의 흠이 아니다. 머리·꼬리·차림·대본을 뺀 «지면이 말하는 것»만 본다.
 */
export function 본문(html) {
  if (typeof html !== 'string' || !html) return '';
  let s = html;
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<header[\s\S]*?<\/header>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  s = s.replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
  s = s.replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/&#\d+;/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/** 낱말 주머니. ⛔ 두 글자 이하를 버린다 — 조사·관사가 겹침을 부풀린다 */
export function 낱말(글) {
  return new Set(String(글 ?? '').toLowerCase().split(/[^a-z0-9가-힣]+/).filter((w) => w.length > 2));
}

/**
 * 두 지면이 얼마나 겹치나 (0~100). 두 주머니의 «다이스» 겹침이다.
 * ⛔ 한쪽이 비면 0 이 아니라 null 이다 — 「안 겹친다」와 「못 잰다」는 다른 말이다.
 */
export function 겹침(a, b) {
  if (!(a instanceof Set) || !(b instanceof Set)) return null;
  if (a.size === 0 || b.size === 0) return null;
  let 교 = 0;
  for (const w of a) if (b.has(w)) 교++;
  return (200 * 교) / (a.size + b.size);
}

/**
 * 여러 지면의 «서로» 겹침 평균. 지면이 둘 미만이면 못 잰다.
 * ⚠ 쌍이 너무 많으면 오래 걸리므로 앞 N장만 서로 견준다 — 표본이라고 적는다.
 */
export function 서로겹침(주머니들, 최대 = 12) {
  const a = (주머니들 ?? []).filter((s) => s instanceof Set && s.size > 0).slice(0, 최대);
  if (a.length < 2) return null;
  let 합 = 0; let 쌍 = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const v = 겹침(a[i], a[j]);
      if (v !== null) { 합 += v; 쌍++; }
    }
  }
  return 쌍 ? 합 / 쌍 : null;
}

/**
 * 우리가 «우리 사이트에서» 본 것으로 갈래를 나눈다.
 * ⚠ 이것은 구글이 밝힌 문턱이 아니다 — 2026-08-24 에 우리 다섯 갈래를 재서 나온 선이다.
 *   기사(40%)는 10/10 색인, 67% 위는 밀렸다. 그 사이 어디가 진짜 선인지는 «모른다».
 */
export const 판박이선 = { 조심: 50, 위험: 65 };
export function 판정(겹침값) {
  if (겹침값 === null || !Number.isFinite(겹침값)) return '못 잼';
  if (겹침값 >= 판박이선.위험) return '🔴 판박이로 읽힐 위험이 크다';
  if (겹침값 >= 판박이선.조심) return '⚠ 조심';
  return '✅ 서로 다르다';
}

/** 중앙값. ⛔ 평균을 쓰지 않는다 — 아주 긴 지면 하나가 전체를 끌어올린다 */
export function 중앙값(수들) {
  const a = (수들 ?? []).filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return null;
  return a[Math.floor(a.length / 2)];
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('대본을 뺀다', !본문('<script>var a=1</script><p>hello world</p>').includes('var'));
  검('머리·꼬리를 뺀다',
    본문('<header>menu here</header><p>body text</p><footer>legal</footer>') === 'body text');
  검('꼬리표를 지운다', 본문('<p>a <b>b</b> c</p>') === 'a b c');
  검('빈 것은 빈 글', 본문(null) === '' && 본문('') === '');

  검('두 글자 이하를 버린다', !낱말('a bb ccc').has('bb') && 낱말('a bb ccc').has('ccc'));
  검('대소문자를 같게 본다', 낱말('Squid GAME').has('squid') && 낱말('Squid GAME').has('game'));

  검('같은 글은 100%', Math.round(겹침(낱말('one two three'), 낱말('one two three'))) === 100);
  검('전혀 다르면 0%', 겹침(낱말('aaa bbb'), 낱말('ccc ddd')) === 0);
  검('절반 겹치면 절반쯤', Math.round(겹침(낱말('aaa bbb'), 낱말('aaa ccc'))) === 50);
  /* ⛔ 「안 겹친다(0)」와 「못 잰다(null)」를 갈라야 한다 */
  검('⭐ 한쪽이 비면 0 이 아니라 못 잼', 겹침(낱말(''), 낱말('aaa bbb')) === null);
  검('주머니가 아니면 못 잼', 겹침('aaa', 낱말('aaa')) === null);

  검('서로 겹침을 낸다',
    Math.round(서로겹침([낱말('aaa bbb'), 낱말('aaa bbb'), 낱말('aaa bbb')])) === 100);
  검('⭐ 지면이 하나면 못 잰다 — 견줄 것이 없다', 서로겹침([낱말('aaa bbb')]) === null);
  검('빈 것을 넣어도 안 터진다', 서로겹침(null) === null && 서로겹침([]) === null);
  검('빈 주머니는 세지 않는다', 서로겹침([낱말(''), 낱말('')]) === null);

  검('위험을 가린다', 판정(92) === '🔴 판박이로 읽힐 위험이 크다');
  검('조심을 가린다', 판정(55) === '⚠ 조심');
  검('괜찮은 것을 가린다', 판정(40) === '✅ 서로 다르다');
  검('못 잰 것은 못 잼', 판정(null) === '못 잼');
  /* ⭐ 문턱을 검사에 박지 않는다 — 문턱을 옮기면 검사도 같이 움직여야 뜻이 있다 */
  검('문턱 바로 위아래가 갈린다',
    판정(판박이선.위험) === '🔴 판박이로 읽힐 위험이 크다'
    && 판정(판박이선.위험 - 0.1) === '⚠ 조심'
    && 판정(판박이선.조심 - 0.1) === '✅ 서로 다르다');

  검('중앙값을 낸다', 중앙값([1, 100, 3]) === 3);
  검('⛔ 평균이 아니다 — 긴 것 하나에 안 끌려간다', 중앙값([1, 1, 1, 1, 10000]) === 1);
  검('빈 것은 못 잼', 중앙값([]) === null && 중앙값(null) === null);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ measure-page-sameness 자가시험 통과 (24)');
  process.exit(0);
}

const 방 = 인자('방', 'dist/wikitip');
if (!existsSync(방)) {
  console.error(`⛔ ${방} 가 없다. 먼저 npm run build 를 돌린다.`);
  console.error('   ⚠ 저장소를 여섯이 나눠 쓰므로 남이 빌드 중이면 dist 가 잠시 사라진다 — 다시 돌린다.');
  process.exit(1);
}

/** 갈래를 «폴더»로 나눈다. 뿌리에 흩어진 낱장은 한 갈래로 묶는다 */
function 갈래모으기(뿌리) {
  const 통 = new Map();
  const 걷기 = (d, 이름) => {
    let 들 = [];
    try { 들 = readdirSync(d); } catch { return; }
    for (const f of 들) {
      const p = path.join(d, f);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) 걷기(p, 이름 ?? f);
      else if (f.endsWith('.html')) {
        const k = 이름 ?? '(뿌리)';
        if (!통.has(k)) 통.set(k, []);
        통.get(k).push(p);
      }
    }
  };
  걷기(뿌리, null);
  return 통;
}

const 갈래 = 갈래모으기(방);
console.log(`■ 우리 지면이 서로 얼마나 같은가 — ${방}\n`);
console.log('갈래              지면수   본문글자(중앙)   서로겹침   판정');
const 줄들 = [];
for (const [이름, 파일들] of [...갈래].sort((a, b) => b[1].length - a[1].length)) {
  const 뽑기 = 파일들.length <= 30 ? 파일들
    : Array.from({ length: 30 }, (_, i) => 파일들[Math.floor((i * 파일들.length) / 30)]);
  const 길이 = []; const 주머니 = [];
  for (const f of 뽑기) {
    let 본;
    try { 본 = 본문(readFileSync(f, 'utf8')); } catch { continue; }
    길이.push(본.length); 주머니.push(낱말(본));
  }
  const 겹 = 서로겹침(주머니);
  const 중 = 중앙값(길이);
  줄들.push({ 이름, n: 파일들.length, 중, 겹 });
  console.log(`${이름.slice(0, 16).padEnd(17)} ${String(파일들.length).padStart(6)}`
    + ` ${String(중 ?? '못 잼').padStart(14)}   ${(겹 === null ? '못 잼' : `${겹.toFixed(0)}%`).padStart(8)}`
    + `   ${판정(겹)}`);
}

const 위험 = 줄들.filter((x) => x.겹 !== null && x.겹 >= 판박이선.위험);
const 위험장수 = 위험.reduce((s, x) => s + x.n, 0);
const 전체장수 = 줄들.reduce((s, x) => s + x.n, 0);
console.log(`\n■ 판박이로 읽힐 위험이 큰 지면  ${위험장수}장 / ${전체장수}장`
  + ` (${전체장수 ? ((100 * 위험장수) / 전체장수).toFixed(0) : '못 잼'}%)`);
if (위험.length) {
  console.log('   ' + 위험.map((x) => `${x.이름} ${x.n}장 ${x.겹.toFixed(0)}%`).join(' · '));
  console.log('\n⭐ 고칠 것은 «자료»가 아니라 «자료를 감싼 문장»이다.');
  console.log('   지면마다 수는 다른데 그 수를 설명하는 문장이 똑같다 — 그것이 겹침을 만든다.');
  console.log('   ⛔ 지면을 더 찍어 내는 것으로는 안 풀린다. 오히려 묶음이 커져서 더 나빠진다.');
}
console.log('\n⚠ 「몇 %면 위험」은 구글이 밝힌 문턱이 아니라 **2026-08-24 에 우리 사이트를 재서**');
console.log('  나온 선이다 — 기사(40%)는 표본 전부 색인, 67% 위는 「발견만」·「크롤했는데 안 넣음」이었다.');
