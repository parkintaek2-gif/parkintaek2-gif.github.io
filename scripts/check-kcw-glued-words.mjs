#!/usr/bin/env node
/**
 * check-kcw-glued-words.mjs — **낱말 두 개가 «붙어» 나간 자리를 찾는다.** (5번, 2026-09-11)
 *
 *   node scripts/check-kcw-glued-words.mjs --자가시험
 *   node scripts/check-kcw-glued-words.mjs                 dist 를 훑는다
 *   node scripts/check-kcw-glued-words.mjs --자세히         걸린 자리를 다 낸다
 *
 * ── 🔴 왜 이 자가 생겼나 ────────────────────────────────────────────
 *
 * JSX(Astro 지면)에서 **줄바꿈 하나만 있는 틈은 «빈칸이 아니라 없음»으로 붙는다.**
 * 그래서 이런 것이 손님 화면에 나갔다 —
 *
 * ```
 *   지면 원본                                    화면에 나간 것
 *   ────────────────────────────────────────    ──────────────────────
 *   for 15                                       「15consecutive years」
 *     <b>consecutive</b> years
 *   … held by different desks, and the           「and theBoth column」
 *     <b>Both</b> column is zero
 * ```
 *
 * ⛔ 나는 이것을 **일곱 번** 냈다. 매번 «화면을 눈으로 봐서» 잡았고, 그때마다
 *   그 자리만 고치고 자를 안 만들었다. 눈은 143장을 매번 못 본다.
 *   ⇒ 이 자는 «빌드 결과»를 훑는다. 원본이 아니라 **손님이 보는 글자**를 본다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────
 * ```
 * ⛔ 원본(.astro)을 규칙으로 잡지 않는다 — 「줄 끝에 {' '} 가 있나」는 헛울림이 많다.
 *   붙었는지는 «나간 글자»에만 있다
 * ⛔ 헛울리면 아무도 안 본다 — 그래서 무늬를 좁게 잡고, 참말인 것(단위·고유명사)은
 *   목록으로 빼 준다. 목록에 넣을 때는 «왜»를 함께 적는다
 * ⛔ 「대문자가 섞였다」로 잡지 않는다 — TenAsia · YouTube · KLifeMap 은 이름이다.
 *   앞이 «소문자 세 자 이상»이고 뒤가 대문자로 시작하는 자리만 본다
 * ⛔ 코드·주소는 본문이 아니다 — <code>·<pre>·<a> 의 주소는 걸러 낸다
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = process.cwd();
export const 볼밑 = 'dist';

/**
 * 수 뒤에 붙어도 «참말»인 꼬리들. 단위와 서수다.
 * ⛔ 여기에 넣는 것은 낱말이 아니라 «꼬리»여야 한다. 낱말을 넣으면 진짜 결함이 숨는다.
 */
export const 참꼬리 = [
  'st', 'nd', 'rd', 'th', 's', 'x', 'px', 'pt', 'em', 'rem', 'vh', 'vw',
  'kg', 'km', 'cm', 'mm', 'ml', 'kb', 'mb', 'gb', 'tb', 'hz', 'khz', 'mhz',
  'db', 'bp', 'bps', 'am', 'pm', 'min', 'sec', 'hr', 'hrs', 'yr', 'yrs',
  'k', 'm', 'bn', 'eok', 'won', 'kt', 'ha', 'bit', 'fps', 'dpi',
];

/**
 * 소문자 뒤에 대문자가 와도 «참말»인 이름들. ⛔ 지어내지 않는다 — 화면에 실제로 있는 것만.
 */
export const 참이름 = [
  'kculturewire', 'seoulmarkets', 'klifemap', 'yearmap', 'wikitip',
];

/**
 * 수에 낱말이 붙어 보이지만 «이름»인 것. ⛔ 왜 참말인지 적는다.
 * · 100yearmap — 우리 도메인이다. 붙어 있는 것이 맞다
 */
export const 참붙은말 = [
  '100yearmap',
  /* 아래는 «수로 시작하는 이름»이다 — 무리·회사·학교 이름이라 붙어 있는 것이 맞다.
     ⛔ 우리가 지은 것이 아니라 자료(위키데이터·공시)에 그렇게 적혀 있다.
     · 5urprise · 1sagain · 1soyun · 4miles — 케이팝 무리·활동명
     · 3billion — 코스닥 상장사(유전체 분석). 기사 본문에 회사 이름으로 나온다
     · 21univ · 3croba — 학교·기관 이름 */
  '5urprise', '1sagain', '1soyun', '4miles', '3billion', '21univ', '3croba',
];

const 꼬리무늬 = new RegExp(`^(?:${참꼬리.slice().sort((a, b) => b.length - a.length).join('|')})$`, 'i');

/** 화면에 나간 글자만 남긴다 — 코드·주소·틀은 본문이 아니다 */
export function 보이는글(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<code[\s\S]*?<\/code>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    /* 🔴 출처 칸의 API 이름은 «식별자»다 — getStockFuturesPriceInfo · empSttusInfo · piicDecsn.
       이것을 붙은 낱말로 세면 기사 50편이 울고, 그러면 아무도 이 자를 안 본다.
       ⛔ 이름을 하나씩 목록에 넣지 않는다 — 그 «자리»를 통째로 뺀다. */
    .replace(/<a[^>]*class="[^"]*src-api[^"]*"[^>]*>[\s\S]*?<\/a>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    /* 🔴 주소를 «글자로» 보여 주는 자리가 있다(출처 링크). 주소 안의 조각은 낱말이 아니다 —
       soompi.com/article/1868229wpp 에서 「1868229wpp」를 집어 울었다. */
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\b[\w.-]+\.(?:com|net|org|kr|ai|io|co)\/\S*/gi, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;/g, ' ');
}

/**
 * 수와 낱말이 붙은 자리 — 「15consecutive」.
 * ⛔ 단위 꼬리는 뺀다(「15px」·「3rd」). ⛔ 세 자 미만 꼬리는 애초에 안 본다.
 */
export function 수에붙은것(글) {
  const 것 = [];
  /* ⚠ 꼬리는 «소문자로 시작»해야 본다 — 「Korea 20MBA」 같은 약칭은 낱말이 아니다.
     ⚠ 앞에 글자가 붙어 있으면 안 본다 — 「A4용지」류의 이름 조각을 집지 않는다 */
  const 무늬 = /(?<![A-Za-z])(\d(?:[\d,.]*\d)?)([a-z][a-zA-Z]{2,})/g;
  let m;
  while ((m = 무늬.exec(String(글 ?? '')))) {
    if (꼬리무늬.test(m[2])) continue;
    if (참붙은말.some((n) => m[0].toLowerCase().startsWith(n))) continue;
    /* 「10-eok」처럼 이음줄이 있는 것은 이 무늬에 안 걸린다 — 걸리는 것은 «정말 붙은» 것이다 */
    것.push(m[0]);
  }
  return 것;
}

/**
 * 붙은 «앞말»로 볼 흔한 낱말들.
 *
 * 🔴 왜 목록으로 좁히나 — 처음에 「소문자 뒤 대문자」를 다 잡았더니 기사 본문에 적힌
 *   식별자(`totalCount` · `empSttusInfo` · `sajuEngine`)가 44장 울었다. 그것은 붙은 것이
 *   아니라 «이름을 적은 것»이다. 헛울리는 자는 아무도 안 본다.
 * ⭐ JSX 가 붙이는 자리는 «문장 안»이다 — 앞말이 the·and·in 같은 흔한 낱말인 경우가 거의 전부다.
 *
 * ⬜ 그래서 이 자가 «못 잡는» 것이 있다 — 앞말이 흔한 낱말이 아닌 붙음(「desksBoth」).
 *   숨기지 않고 적어 둔다. 못 잡는 것을 「없다」로 세지 않는다.
 */
export const 흔한앞말 = [
  'the', 'and', 'but', 'for', 'nor', 'yet', 'not', 'was', 'were', 'are', 'has', 'have', 'had',
  'its', 'their', 'our', 'his', 'her', 'them', 'they', 'this', 'that', 'these', 'those',
  'with', 'from', 'into', 'onto', 'than', 'then', 'when', 'where', 'while', 'which', 'what',
  'about', 'after', 'before', 'between', 'across', 'against', 'among', 'over', 'under',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'all', 'any', 'each', 'both', 'every', 'some', 'most', 'more', 'less', 'only', 'also',
  'still', 'even', 'just', 'very', 'said', 'says', 'read', 'counted', 'called', 'named',
  'per', 'via', 'and-the', 'because', 'since', 'until', 'without', 'within', 'against',
];
const 앞말표 = new Set(흔한앞말);

/**
 * 낱말과 낱말이 붙은 자리 — 「theBoth」.
 * ⛔ 이름은 뺀다. ⛔ 앞이 세 자 미만이면 안 본다(iPhone·eSports).
 * ⛔ 앞말이 «흔한 낱말»이 아니면 안 본다 — 식별자를 적은 것과 못 가른다.
 */
export function 낱말끼리붙은것(글) {
  const 것 = [];
  /* 🔴 처음에 앞을 막지 않았더니 「SeoulMarkets」에서 «eoulMarkets», 「KLifeMap」에서
     «ifeMap» 을 집어 8,289장이 울었다. 이름의 «가운데»를 집으면 그 자는 못 쓴다.
     ⇒ 앞에 글자가 붙어 있으면 낱말의 시작이 아니므로 안 본다. */
  const 무늬 = /(?<![A-Za-z])([a-z]{3,})([A-Z][a-z]{2,})/g;
  let m;
  while ((m = 무늬.exec(String(글 ?? '')))) {
    const 온것 = m[0];
    if (참이름.some((n) => 온것.toLowerCase().includes(n))) continue;
    if (!앞말표.has(m[1].toLowerCase())) continue;
    것.push(온것);
  }
  return 것;
}

/** 한 장을 본다 */
export function 한장보기(html) {
  const 글 = 보이는글(html);
  return [...수에붙은것(글), ...낱말끼리붙은것(글)];
}

/** dist 아래 html 을 모은다 */
export function 장들모으기(밑) {
  const 것 = [];
  const 걷기 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷기(p);
      else if (e.name.endsWith('.html')) 것.push(p);
    }
  };
  if (fs.existsSync(밑)) 걷기(밑);
  return 것;
}

/* ── 자가시험 ───────────────────────────────────────────────────────── */
function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });

  재다('🔴 「15consecutive」를 잡는다 — 실제로 나갔던 것이다',
    수에붙은것('for 15consecutive years').length === 1);
  재다('🔴 「1,365headlines」를 잡는다 — 쉼표가 든 수도 본다',
    수에붙은것('the same 1,365headlines here')[0] === '1,365headlines');
  재다('⛔ 「15px」는 안 잡는다 — 단위 꼬리다', 수에붙은것('width 15px').length === 0);
  재다('⛔ 「3rd」·「21st」는 안 잡는다 — 서수다',
    수에붙은것('3rd and 21st').length === 0);
  재다('⛔ 「-19.6 dB」처럼 빈칸이 있으면 안 잡는다', 수에붙은것('-19.6 dB').length === 0);
  재다('⛔ 「10-eok」는 안 잡는다 — 이음줄이 있어 붙은 것이 아니다',
    수에붙은것('a 10-eok headline').length === 0);
  재다('수에붙은것: 깨끗한 글은 0건', 수에붙은것('1,365 headlines in 10 days').length === 0);

  재다('🔴 「theBoth」를 잡는다 — 실제로 나갔던 것이다',
    낱말끼리붙은것('and theBoth column is zero')[0] === 'theBoth');
  재다('⛔ 「TenAsia」는 안 잡는다 — 앞이 대문자로 시작한다',
    낱말끼리붙은것('TenAsia counted').length === 0);
  재다('⛔ 「iPhone」은 안 잡는다 — 앞이 한 자다',
    낱말끼리붙은것('an iPhone here').length === 0);
  재다('⛔ 우리 주소는 안 잡는다',
    낱말끼리붙은것('at kculturewire.com/age').length === 0);
  재다('🔴 이름의 «가운데»를 집지 않는다 — SeoulMarkets 에서 eoulMarkets 를 집어 8,289장이 울었다',
    낱말끼리붙은것('SeoulMarkets and KLifeMap').length === 0);
  재다('🔴 식별자를 적은 것은 안 잡는다 — totalCount·empSttusInfo·sajuEngine 이 44장 울었다',
    낱말끼리붙은것('the totalCount field and empSttusInfo in sajuEngine').length === 0);
  재다('⬜ 못 잡는 것이 있다 — 앞말이 흔한 낱말이 아닌 붙음은 지나간다(숨기지 않는다)',
    낱말끼리붙은것('the desksBoth column').length === 0);
  재다('🔴 「100yearmap」은 안 잡는다 — 우리 도메인이다',
    수에붙은것('at 100yearmap.com now').length === 0);
  재다('⛔ 「Korea 20MBA」류 약칭은 안 잡는다 — 꼬리가 소문자로 시작해야 낱말이다',
    수에붙은것('Korea 20MBA').length === 0);
  재다('낱말끼리붙은것: 깨끗한 글은 0건',
    낱말끼리붙은것('the Both column is zero').length === 0);

  재다('보이는글: 틀을 걷어 낸다', 보이는글('<p>hi <b>there</b></p>').includes('hi'));
  재다('🔴 보이는글: <script> 안은 본문이 아니다',
    !보이는글('<script>var aBad=1</script><p>ok</p>').includes('aBad'));
  재다('🔴 보이는글: <code> 안은 본문이 아니다 — 코드에는 낙타글자가 흔하다',
    !보이는글('<code>getBoth()</code><p>ok</p>').includes('getBoth'));
  재다('보이는글: <style> 안은 본문이 아니다',
    !보이는글('<style>.aBad{color:red}</style><p>ok</p>').includes('aBad'));

  재다('한장보기: 두 무늬를 함께 본다',
    한장보기('<p>for 15consecutive years and theBoth column</p>').length === 2);
  재다('한장보기: 깨끗한 장은 0건',
    한장보기('<p>1,365 headlines, and the Both column is zero</p>').length === 0);
  재다('⛔ 참꼬리에 낱말을 넣지 않았다 — 셋 자 넘는 것은 단위뿐',
    참꼬리.filter((t) => t.length > 3).every((t) => /^(khz|mhz|hrs|yrs|eok|won|bps|fps|dpi)$/.test(t)));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

/* ── 돌리기 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
if (!자가시험()) { console.log('🔴 자가시험이 깨졌다 — 재지 않는다.'); process.exit(1); }
console.log('');

const 밑 = path.join(뿌리, 볼밑);
if (!fs.existsSync(밑)) {
  console.log(`⬜ ${볼밑} 이 없다 — 못 쟀다. 먼저 npm run build`);
  process.exit(0);
}
const 장들 = 장들모으기(밑);
const 막을것 = [];   /* 낱말끼리 붙은 것 — 헛울림이 거의 없다. 막는다 */
const 볼것 = [];     /* 수에 붙은 것 — 「5urprise」처럼 이름일 수 있다. 사람이 본다 */
for (const p of 장들) {
  const 글 = 보이는글(fs.readFileSync(p, 'utf8'));
  const 길 = path.relative(뿌리, p);
  const a = [...new Set(낱말끼리붙은것(글))];
  const b = [...new Set(수에붙은것(글))];
  if (a.length) 막을것.push({ 길, 것: a });
  if (b.length) 볼것.push({ 길, 것: b });
}
const 자세히 = process.argv.includes('--자세히');
const 내기 = (묶음) => {
  for (const x of (자세히 ? 묶음 : 묶음.slice(0, 25))) {
    console.log(`  🔴 ${x.길}`);
    console.log(`     ${x.것.slice(0, 6).join(' · ')}`);
  }
  if (!자세히 && 묶음.length > 25) console.log(`  … 그리고 ${묶음.length - 25}장 더 (--자세히)`);
};

console.log(`■ 붙은 낱말 검사 — 본 장 ${장들.length.toLocaleString('ko-KR')}장`);
console.log('');
console.log(`── 막는 것: 낱말끼리 붙음 — ${막을것.length}장 ──`);
if (막을것.length) 내기(막을것);
else console.log('  ✅ 없다');
console.log('');
console.log(`── 보는 것: 수에 낱말이 붙음 — ${볼것.length}장 ──`);
console.log('  ⚠ 「5urprise」처럼 «수로 시작하는 이름»이 섞인다. 이름이면 참붙은말 에 «왜»와 함께 넣는다.');
if (볼것.length) 내기(볼것);
else console.log('  ✅ 없다');
console.log('');
if (막을것.length) {
  console.log('🔴 지면 원본에서 그 자리를 찾아 줄 끝에 {\' \'} 를 넣는다.');
  console.log('   ⚠ {/* 주석 */} 이 두 줄 사이에 있으면 «주석이 빈칸을 먹는다» — 주석 앞에 넣는다.');
  process.exit(1);
}
console.log('✅ 손님 화면에 붙어 버린 낱말이 없다 (낱말끼리 붙음 0건)');
process.exit(0);
