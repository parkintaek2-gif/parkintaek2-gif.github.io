/**
 * 개봉 차례표 ② «재는 것 일곱 줄» 을 **라이브에서** 잰다.
 *
 * ⭐ 왜 있나 — 차례표에 「배포했다로 ✅ 를 치지 않는다. **라이브에서 다시 재야** ✅ 다」고 적어 뒀는데
 *   그 일곱 줄을 그날 아침 손으로 재게 되어 있었다. 8/13 에 손으로 재 보니 **내가 세 번 헛짚었다.**
 *   그 셋을 이 자 안에 못 박아 둔다 —
 *   ```
 *   ① 지역 지면 주소에 «시·도»가 빠졌다      「노원구」 → 「서울특별시-노원구」
 *   ② 메뉴 글자를 지어냈다                  「학교」가 아니라 「학교 찾기」다
 *   ③ 로고 안 부제를 메뉴로 셌다             「대학 다음까지」는 메뉴가 아니다
 *   ```
 *   ⛔ 급조한 자가 낸 수를 그대로 보고하지 않는다. 그래서 이 자는 **틀릴 만한 자리를 스스로 시험**한다.
 *
 *   node scripts/check-100y-live.mjs
 *   node scripts/check-100y-live.mjs --켠뒤     ← PG 를 켠 뒤에는 기대가 뒤집힌다
 */

const 터 = 'https://100yearmap.com';
const 사람인척 = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
const 켠뒤 = process.argv.includes('--켠뒤');

/** ⚠ 이미 감싸진 주소를 또 감싸면 헛경보가 난다(8/10 에 그랬다) */
export function 한번만감싸기(길) {
  return /%[0-9A-Fa-f]{2}/.test(길) ? 길 : encodeURI(길);
}
/** ⚠ 본문에서 뽑은 주소는 &amp; 가 섞여 있다. 안 풀면 「어긋난다」로 잘못 읽는다 */
export function 글자풀기(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
/** 메뉴 항목만 고른다 — ⛔ 로고 안 부제(logo-sub)는 메뉴가 아니다 */
export function 메뉴글자(글) {
  const 통 = /<nav class="nav">([\s\S]*?)<\/nav>/.exec(글);
  if (!통) return [];
  return [...통[1].matchAll(/<a\b(?![^>]*class="logo")[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => m[1].replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);
}

// ── 자 스스로 시험 ─────────────────────────────────────────────
{
  const 시험 = [];
  const ㄱ = (이름, 한것, 나와야) => 시험.push([이름, JSON.stringify(한것), JSON.stringify(나와야)]);
  ㄱ('한번만감싸기 — 날것은 감싼다', 한번만감싸기('/a/서울'), '/a/%EC%84%9C%EC%9A%B8');
  ㄱ('한번만감싸기 — 이미 감싼 것은 그대로', 한번만감싸기('/a/%EC%84%9C%EC%9A%B8'), '/a/%EC%84%9C%EC%9A%B8');
  ㄱ('글자풀기', 글자풀기('a?x=1&amp;y=2'), 'a?x=1&y=2');
  ㄱ('메뉴글자 — 로고 부제를 빼고 센다',
    메뉴글자('<nav class="nav"><a class="logo" href="/"><span>백년지도</span><span>대학 다음까지</span></a><a href="/price">값</a></nav>'),
    ['값']);
  ㄱ('메뉴글자 — nav 가 없으면 빈 것', 메뉴글자('<div>가</div>'), []);
  let 흠 = 0;
  for (const [이름, 한것, 나와야] of 시험)
    if (한것 !== 나와야) { console.log('🔴 자가 틀렸다 — ' + 이름 + ' 난것 ' + 한것); 흠++; }
  if (흠) { console.log('자를 못 믿겠다. 멈춘다.'); process.exit(1); }
  console.log('✅ 자 스스로 시험 ' + 시험.length + '가지 통과\n');
}

async function 열기(길) {
  const 답 = await fetch(터 + 한번만감싸기(길), { headers: 사람인척 });
  return { 상태: 답.status, 글: 답.status === 200 ? await 답.text() : '' };
}

// ⚠ 시·도가 빠지면 404 다. 8/13 에 그렇게 헛짚었다
const 파는지면 = '/report/area/서울특별시-노원구';
const 잰것 = [];
const 흠 = [];
const 적기 = (줄, 맞나, 말) => { 잰것.push((맞나 ? '✅' : '🔴') + ' ' + 줄 + ' — ' + 말); if (!맞나) 흠.push(줄 + ' : ' + 말); };

// 1 · 2 — PG 스위치에 따라 기대가 뒤집힌다
{
  const { 상태, 글 } = await 열기('/price');
  const 아직 = 글.includes('아직 결제를 받지 않습니다');
  적기('1 /price', 상태 === 200 && 아직 !== 켠뒤,
    '상태 ' + 상태 + ' · 「아직 결제를 받지 않습니다」 ' + (아직 ? '있다' : '없다') +
    ' (지금 기대 — ' + (켠뒤 ? '없어야 한다' : '있어야 한다') + ')');
}
{
  const { 상태, 글 } = await 열기(파는지면);
  const 사는길 = 글.includes('checkout.html');
  적기('2 파는 지면(노원구)', 상태 === 200 && 사는길 === 켠뒤,
    '상태 ' + 상태 + ' · 사는 길 ' + (사는길 ? '있다' : '없다') +
    ' (지금 기대 — ' + (켠뒤 ? '있어야 한다' : '없어야 한다') + ')');
}

// 3 값이 한 곳에서 오나
{
  const 값들 = [];
  for (const 길 of ['/price', 파는지면]) {
    const { 글 } = await 열기(길);
    값들.push(/9,900\s*원/.test(글) ? '9,900원' : '(없다)');
  }
  적기('3 값', 값들.every((v) => v === '9,900원'), 값들.join(' · '));
}

// 4 문 갈래 — 지면 차례표에서 센다
{
  const { 글 } = await 열기('/data');
  const 문 = (글.match(/klifemap\.ai/g) || []).length;
  적기('4 문(차례표 지면)', 문 > 0, 'klifemap 으로 나가는 링크 ' + 문 + '개  ⚠ 갈래 수는 scripts/check-100y-runbook.mjs 가 센다');
}

// 5 메뉴 — 로고 다음 첫 항목이 「값」인가
{
  const { 글 } = await 열기('/');
  const 차례 = 메뉴글자(글);
  적기('5 메뉴', 차례[0] === '값', '차례 ' + (차례.slice(0, 4).join(' · ') || '(못 찾음)'));
}

// 6 학교 설명 숫자 — 라이브 한 장으로 «꼴»만 본다(전수는 dist 에서 센다)
{
  const { 상태, 글 } = await 열기('/school/7010125');
  const d = /<meta name="description" content="([^"]*)"/.exec(글)?.[1] ?? '';
  const 넷 = [/진학률\s*[\d.]+\s*%/, /졸업자\s*[\d,]+\s*명/, /학급당\s*[\d.]+\s*명/, /학업중단\s*[\d.]+\s*%/];
  적기('6 학교 설명 숫자', 상태 === 200 && 넷.some((자) => 자.test(d)), '경신고 설명 — ' + (d.slice(0, 60) || '(없다)'));
}

// 7 조사
{
  const { 상태, 글 } = await 열기('/school/7801089');
  적기('7 조사', 상태 === 200 && 글.includes('삼척시는'), '「삼척시는」 ' + (글.includes('삼척시는') ? '있다' : '없다'));
}

console.log('# 라이브 ' + 터 + (켠뒤 ? '   (PG 켠 뒤 기준)' : '   (PG 켜기 전 기준)'));
for (const 줄 of 잰것) console.log('  ' + 줄);

if (흠.length) {
  console.log('\n🔴 어긋난 것 ' + 흠.length + '가지');
  for (const x of 흠) console.log('   · ' + x);
  console.log('\n⛔ 차례표 ③(되돌리는 것)으로 간다');
  process.exit(1);
}
console.log('\n✅ 일곱 줄 다 맞는다');
