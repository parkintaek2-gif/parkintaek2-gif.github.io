/* 한국 월별 통계의 «분모» — 근무일이 조용히 움직인다
 *
 * ── 왜 이 자인가 (2026-10-12 18:5x · 5번) ─────────────────────────
 *   `check-쥔자료에-안쓴축이-있나.mjs` 를 고쳐 「지면도 기사도 없는 축」 30개를 얻었고,
 *   그 가운데 `korea-workdays` 를 골랐다. ⛔ 먼저 `check-이축으로-이미낸게있나` 로
 *   확인했다 — 걸리는 것이 없었다(다만 열쇠가 한글이라 그 자가 얇게 봤다).
 *
 *   고른 까닭 — **영어권 손님이 한국 월별 지표를 견줄 때 반드시 알아야 하는데
 *   아무도 안 알려 주는 것**이다.
 *   ```
 *     2월 평균 18.5일  vs  7월 평균 21.2일   → 14.4% 차이
 *     2011년 평균 21.2  →  2025년 평균 19.1  → 15년에 9.9% 줄었다
 *     그리고 그 시리즈에 **이음매가 둘** (조사 차수가 바뀐 자리)
 *   ```
 *
 *   ⭐ 이 지면에만 있는 것 — **이음매의 크기를 계절성과 갈라 본다.**
 *     자료가 적은 변화율은 12월→1월 «한 달» 비교라 계절성이 섞여 있다(-4.5%).
 *     앞뒤 12달 평균으로 보면 -1.2% 다. **둘 다 적는다** — 어느 쪽도 거짓이 아니고,
 *     무엇을 견주었나가 다를 뿐이다.
 *
 * ── ⛔ 이 자가 하지 않는 것 ───────────────────────────────────────
 * ⛔ 「왜 줄었나」를 말하지 않는다. 주 52시간·대체공휴일·표본 변화 — 다 그럴듯하지만
 *   우리는 안 쟀다. 얼마나 움직였나까지다.
 * ⛔ 이음매를 «이어 붙이지» 않는다. 보정 계수를 만들어 매끈하게 하면
 *   그 순간 우리 수가 된다. 끊긴 자리를 끊겼다고 적는다.
 * ⛔ 달이 모자란 해의 평균을 열두 달 평균과 나란히 놓지 않는다 — 몇 달인지 함께 적는다.
 *
 * 돌리기   node scripts/measure-workday-denominator.mjs
 *          node scripts/measure-workday-denominator.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/* ── 재는 규칙 ──────────────────────────────────────────────────── */

/** 'YYYYMM' 에서 달(MM)만 — 못 읽으면 null (⛔ 1월로 때려 넣지 않는다) */
export function 달만(열쇠) {
  const m = String(열쇠 ?? '').match(/^(\d{4})(0[1-9]|1[0-2])$/);
  return m ? m[2] : null;
}

/** 평균 — 빈 배열이면 null (⛔ 0 이 아니다) */
export function 평균(수들) {
  const 것 = (수들 ?? []).filter((n) => Number.isFinite(n));
  if (!것.length) return null;
  return 것.reduce((a, b) => a + b, 0) / 것.length;
}

/** 두 값 사이 몫 변화 — 어느 쪽이든 못 재면 null */
export function 몫변화(뒤, 앞) {
  if (!Number.isFinite(뒤) || !Number.isFinite(앞) || 앞 === 0) return null;
  return 뒤 / 앞 - 1;
}

/**
 * 이음매를 «두 가지»로 잰다.
 *   한달   자료가 적어 둔 값 — 12월→1월이라 계절성이 섞여 있다
 *   열두달 앞뒤 열두 달 평균 — 계절성을 걷어 낸다
 * ⛔ 어느 한쪽만 내지 않는다. 둘 다 참이고, 견준 것이 다를 뿐이다.
 * ⚠ 뒤쪽에 열두 달이 안 쌓였으면 쌓인 만큼으로 재고 «몇 달인지» 함께 돌려준다.
 */
export function 이음매재기(이음매, 월별, 창 = 12) {
  const 열쇠 = Object.keys(월별 ?? {}).sort();
  const i = 열쇠.indexOf(String(이음매?.전 ?? ''));
  if (i < 0) return { 전: 이음매?.전 ?? null, 후: 이음매?.후 ?? null, 못쟀다: '앞 달을 자료에서 못 찾았다' };
  const 앞열쇠 = 열쇠.slice(Math.max(0, i - (창 - 1)), i + 1);
  const 뒤열쇠 = 열쇠.slice(i + 1, i + 1 + 창);
  const 앞 = 평균(앞열쇠.map((k) => 월별[k]));
  const 뒤 = 평균(뒤열쇠.map((k) => 월별[k]));
  return {
    전: 이음매.전,
    후: 이음매.후,
    한달몫: Number.isFinite(이음매?.변화율) ? 이음매.변화율 / 100 : null,
    앞평균: 앞,
    뒤평균: 뒤,
    앞달수: 앞열쇠.length,
    뒤달수: 뒤열쇠.length,
    열두달몫: 몫변화(뒤, 앞),
  };
}

/** 달마다 평균 — [{달, 평균, 해수}] 를 평균 오름차순으로 */
export function 달마다(월별) {
  const 통 = new Map();
  for (const [k, v] of Object.entries(월별 ?? {})) {
    const mm = 달만(k);
    if (!mm || !Number.isFinite(v)) continue;     /* ⛔ 못 읽은 달은 버린다, 0 으로 안 채운다 */
    if (!통.has(mm)) 통.set(mm, []);
    통.get(mm).push(v);
  }
  return [...통.entries()]
    .map(([달, v]) => ({ 달, 평균: 평균(v), 해수: v.length }))
    .sort((a, b) => a.평균 - b.평균);
}

/* ── 자가시험 ───────────────────────────────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 같나 = (무엇, 잰것, 바라는것) => {
    const a = JSON.stringify(잰것); const b = JSON.stringify(바라는것);
    if (a === b) { 통과 += 1; return; }
    실패 += 1;
    console.log('  🔴 ' + 무엇 + '  잰것 ' + a + ' / 바란것 ' + b);
  };
  const 가깝나 = (무엇, 잰것, 바라는것, 틈 = 1e-9) => {
    if (잰것 != null && Math.abs(잰것 - 바라는것) <= 틈) { 통과 += 1; return; }
    실패 += 1;
    console.log('  🔴 ' + 무엇 + '  잰것 ' + 잰것 + ' / 바란것 ' + 바라는것);
  };

  같나('달을 집는다', 달만('202602'), '02');
  같나('⛔ 13월은 없다', 달만('202613'), null);
  같나('⛔ 00월도 없다', 달만('202600'), null);
  같나('⛔ 꼴이 다르면 null', 달만('2026-02'), null);
  같나('⛔ 빈 것도 null — 1월로 때려 넣지 않는다', 달만(''), null);

  가깝나('평균', 평균([1, 2, 3]), 2);
  같나('⛔ 빈 배열은 null — 0 이 아니다', 평균([]), null);
  같나('⛔ 수 아닌 것은 뺀다', 평균([1, null, 3]), 2);

  가깝나('몫 변화', 몫변화(110, 100), 0.1);
  같나('⛔ 0 으로 나누지 않는다', 몫변화(1, 0), null);
  같나('⛔ 못 재면 null', 몫변화(null, 100), null);

  const 월별 = {};
  for (let y = 2018; y <= 2021; y += 1) {
    for (let mo = 1; mo <= 12; mo += 1) {
      월별[`${y}${String(mo).padStart(2, '0')}`] = y <= 2019 ? 20 : 19;
    }
  }
  const r = 이음매재기({ 전: '201912', 후: '202001', 변화율: -4.5 }, 월별);
  가깝나('앞 열두 달 평균', r.앞평균, 20);
  가깝나('뒤 열두 달 평균', r.뒤평균, 19);
  가깝나('열두 달로 본 몫', r.열두달몫, -0.05);
  가깝나('⭐ 한 달로 본 몫은 따로 돌려준다', r.한달몫, -0.045);
  같나('   앞뒤 달 수도 함께 돌려준다', [r.앞달수, r.뒤달수], [12, 12]);
  같나('⬜ 앞 달을 못 찾으면 못 쟀다고 적는다 — ⛔ 0 이 아니다',
    이음매재기({ 전: '199901', 후: '199902' }, 월별).못쟀다 != null, true);

  /* 뒤에 열두 달이 안 쌓인 자리 — 2026 이음매가 그렇다 */
  const 짧은 = { 202512: 19, 202601: 18, 202602: 18, 202603: 19 };
  const r2 = 이음매재기({ 전: '202512', 후: '202601', 변화율: -3 }, 짧은);
  같나('⚠ 뒤가 모자라면 쌓인 만큼 재고 달 수를 적는다', r2.뒤달수, 3);

  const 달들 = 달마다(월별);
  같나('달마다 열두 칸', 달들.length, 12);
  같나('해마다 네 번씩 쌓였다', 달들[0].해수, 4);
  같나('⛔ 못 읽은 달은 안 센다', 달마다({ 202613: 20, 202601: 19 }).length, 1);

  console.log('\n자가시험 ' + (통과 + 실패) + '개 · 통과 ' + 통과 + ' · 실패 ' + 실패);
  return 실패 === 0;
}

/* ── 본체 ───────────────────────────────────────────────────────── */
function 센다() {
  const 날 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/korea-workdays.json'), 'utf8'));
  const 월별 = 날.월별 ?? {};
  const 열쇠 = Object.keys(월별).sort();
  const 값 = 열쇠.map((k) => 월별[k]);

  const 달들 = 달마다(월별);
  const 적은달 = 달들[0] ?? null;
  const 많은달 = 달들[달들.length - 1] ?? null;

  const 연도별 = 날.연도별 ?? {};
  const 해들 = Object.keys(연도별).sort();
  /* ⚠ 열두 달이 안 찬 해는 따로 표시한다 — 나란히 놓으면 사람이 속는다 */
  const 해줄 = 해들.map((y) => ({
    해: y,
    평균: 연도별[y]?.평균 ?? null,
    개월수: 연도별[y]?.개월수 ?? null,
    온전한가: (연도별[y]?.개월수 ?? 0) === 12,
  }));
  const 온전한해 = 해줄.filter((r) => r.온전한가);
  const 첫해 = 온전한해[0] ?? null;
  const 끝해 = 온전한해[온전한해.length - 1] ?? null;

  return {
    _무엇: 'The denominator behind Korea’s monthly indicators: how many days a workplace actually operated.',
    _출처: 날.출처?.이름 ?? null,
    _표: 날.출처?.표 ?? null,
    _받은때: 날.받은때 ?? null,
    _잰때: new Date().toLocaleString('sv-SE').replace('T', ' '),   /* ⛔ toISOString 금지 — KST 다 */
    _밝힐것: [
      'We do not explain why the figure moved. We counted the movement, not its cause.',
      'We do not splice the series across its breaks. A smoothing factor would make the number ours.',
      'Years with fewer than twelve months are marked, never averaged in as if complete.',
    ],
    달수: 열쇠.length,
    첫달: 열쇠[0] ?? null,
    끝달: 열쇠[열쇠.length - 1] ?? null,
    가장적은달: { 달: 열쇠[값.indexOf(Math.min(...값))], 값: Math.min(...값) },
    가장많은달: { 달: 열쇠[값.indexOf(Math.max(...값))], 값: Math.max(...값) },
    달마다: 달들,
    달사이몫: 적은달 && 많은달 ? 몫변화(많은달.평균, 적은달.평균) : null,
    적은달, 많은달,
    해줄,
    첫해, 끝해,
    해사이몫: 첫해 && 끝해 ? 몫변화(끝해.평균, 첫해.평균) : null,
    이음매: (날.이음매 ?? []).map((j) => 이음매재기(j, 월별)),
  };
}

/* ── 들머리 ─────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가진입점 && process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
}

if (내가진입점) {
  const 결과 = 센다();
  const 낼곳 = path.join(뿌리, 'src/data/workday-denominator.json');
  fs.writeFileSync(낼곳, JSON.stringify(결과, null, 1), 'utf8');

  const 몫 = (x) => (x == null ? '—' : (x * 100).toFixed(1) + '%');
  console.log('■ 한국 월별 통계의 분모 — 근무일');
  console.log('   ' + 결과.달수 + '달 · ' + 결과.첫달 + ' ~ ' + 결과.끝달);
  console.log('   가장 적은 달 ' + 결과.가장적은달.달 + ' ' + 결과.가장적은달.값
    + ' · 가장 많은 달 ' + 결과.가장많은달.달 + ' ' + 결과.가장많은달.값);
  console.log('   달로 보면 ' + 결과.적은달.달 + '월 ' + 결과.적은달.평균.toFixed(1)
    + ' vs ' + 결과.많은달.달 + '월 ' + 결과.많은달.평균.toFixed(1)
    + ' — ' + 몫(결과.달사이몫) + ' 차이');
  if (결과.첫해 && 결과.끝해) {
    console.log('   ' + 결과.첫해.해 + ' ' + 결과.첫해.평균 + ' → ' + 결과.끝해.해 + ' ' + 결과.끝해.평균
      + ' — ' + 몫(결과.해사이몫));
  }
  console.log('   ⚠ 이음매 ' + 결과.이음매.length + '곳 —');
  for (const j of 결과.이음매) {
    if (j.못쟀다) { console.log('      ⬜ ' + j.전 + ' → ' + j.후 + '  못 쟀다: ' + j.못쟀다); continue; }
    console.log('      ' + j.전 + ' → ' + j.후
      + '  한 달로 ' + 몫(j.한달몫)
      + ' · 앞뒤 ' + j.앞달수 + '/' + j.뒤달수 + '달 평균으로 ' + 몫(j.열두달몫));
  }
  console.log('   ⛔ 둘 다 참이다 — 견준 것이 다를 뿐이다. 어느 한쪽만 내지 않는다.');
  console.log('✅ ' + 낼곳);
}
