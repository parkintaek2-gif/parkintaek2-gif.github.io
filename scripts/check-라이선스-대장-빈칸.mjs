#!/usr/bin/env node
/**
 * 🔴🔴 **이용허락 대장의 «빈칸»이 묵고 있나.**
 *
 * [2026-10-06 13:0x · 5번] 사장님이 AMRO 를 보라 하셔서 약관을 읽다가,
 * **우리가 이미 IMF 자료를 싣고 있는데 약관을 안 읽었다**는 것을 알았다.
 * 대장에는 이렇게 적혀 있었다 —
 *
 *   imf-pip  ⬜  「[6번, 2026-09-18] 못 읽었다 … **다음에 손대는 사람이** 확인하고 판정을 채운다」
 *
 * ⭐ 대장은 제 할 일을 했다. ⬜ 를 정직하게 적어 두었다.
 * ⛔ **그런데 「다음에 손대는 사람」은 열여드레 동안 오지 않았다.**
 *   사람이 기억해서 채우는 구조를 만들면 안 채워진다. 자가 울어야 채워진다.
 *
 * 세 칸으로 본다 —
 *   🔴 (안-씀) 이 «안» 붙은 🔴   — 쓰면 안 되는 것을 쓰고 있을 수 있다. 가장 급하다
 *   ⬜ 빈칸                      — 읽지도 않았다. 「괜찮다」가 «아니다»
 *   🟢·🟡                        — 읽고 판정했다
 *
 * ⛔ ⬜ 를 「흠 없음」으로 세지 않는다. 그 셋째 칸이 이 자의 알맹이다.
 *
 * 쓰기 —
 *   node scripts/check-라이선스-대장-빈칸.mjs
 *   node scripts/check-라이선스-대장-빈칸.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');
export const 대장길 = path.join(뿌리, 'docs', '라이선스-대장.tsv');

/** 쓰지 않기로 한 것에 붙이는 표. 대장이 이미 쓰고 있는 규칙이다 */
export const 안씀표 = '(안-씀)';

export function 줄읽기(글) {
  return String(글 ?? '')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const c = l.split('\t');
      return { 이름: (c[0] ?? '').trim(), 설명: c[1] ?? '', 판정: (c[2] ?? '').trim(), 근거: c[3] ?? '' };
    })
    .filter((x) => x.이름 && x.판정);
}

/** 쓰고 있나 — 이름 앞에 (안-씀) 이 없으면 쓰는 것으로 본다 */
export function 쓰고있나(줄) {
  return !String(줄?.이름 ?? '').startsWith(안씀표);
}

/**
 * 근거 글에서 «언제 적었나»를 집는다.
 * ⛔ 못 집으면 null — 「오늘 적었다」로 치지 않는다.
 */
export function 적은날(근거) {
  const m = String(근거 ?? '').match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** 두 날 사이 며칠. ⛔ 한쪽이라도 모르면 null */
export function 며칠지났나(적은, 오늘) {
  const 재 = /^(\d{4})-(\d{2})-(\d{2})$/;
  const a = 재.exec(String(적은 ?? '')); const b = 재.exec(String(오늘 ?? ''));
  if (!a || !b) return null;
  const A = Date.UTC(+a[1], +a[2] - 1, +a[3]);
  const B = Date.UTC(+b[1], +b[2] - 1, +b[3]);
  return Math.round((B - A) / 86400000);
}

/** 빈칸이 며칠 묵으면 울리나 */
export const 묵는선 = 14;

export function 가른다(줄들, 오늘) {
  const 급한것 = [];     /* (안-씀) 없는 🔴 — 쓰면 안 되는 것을 쓰고 있을 수 있다 */
  const 빈칸 = [];       /* ⬜ */
  const 묵은빈칸 = [];
  let 읽은것 = 0;
  for (const r of 줄들 ?? []) {
    if (r.판정 === '🔴' && 쓰고있나(r)) 급한것.push(r);
    else if (r.판정 === '⬜') {
      빈칸.push(r);
      const 날 = 적은날(r.근거);
      const n = 며칠지났나(날, 오늘);
      if (n != null && n >= 묵는선) 묵은빈칸.push({ ...r, 날, 지난날: n });
      else if (n == null) 묵은빈칸.push({ ...r, 날: null, 지난날: null });  /* ⛔ 날을 모르면 묵은 것으로 본다 */
    } else if (r.판정 === '🟢' || r.판정 === '🟡') 읽은것 += 1;
  }
  묵은빈칸.sort((a, z) => (z.지난날 ?? 1e9) - (a.지난날 ?? 1e9));
  return { 급한것, 빈칸, 묵은빈칸, 읽은것, 전체: (줄들 ?? []).length };
}

function 주다() {
  let 글 = null;
  try { 글 = fs.readFileSync(대장길, 'utf8'); } catch { 글 = null; }
  console.log('\n■ 이용허락 대장 — 빈칸이 묵고 있나');
  if (글 == null) {
    console.log('   ⬜ 대장을 못 읽었다 — 「흠 없다」가 아니다');
    return 1;
  }
  const 오늘 = new Date().toLocaleDateString('sv-SE');
  const r = 가른다(줄읽기(글), 오늘);
  console.log(`   읽고 판정한 것 ${r.읽은것}  ·  ⬜ 빈칸 ${r.빈칸.length}  ·  🔴 쓰면서 막힌 것 ${r.급한것.length}  (전체 ${r.전체})`);

  if (r.급한것.length) {
    console.log('\n   🔴 «쓰지 말라는데 쓰고 있을 수 있는» 것 — 가장 급하다');
    for (const x of r.급한것) console.log(`      ${x.이름} — ${String(x.근거).slice(0, 90)}`);
    console.log(`      ⭐ 쓰지 않기로 했으면 이름 앞에 ${안씀표} 를 붙인다. 그러면 이 줄이 사라진다`);
    console.log('      ⛔ 표만 붙이고 실제로는 계속 쓰지 않는다 — 그것이 거짓 초록이다');
  }

  if (r.묵은빈칸.length) {
    console.log(`\n   ⬜ ${묵는선}일 넘게 비어 있는 칸 ${r.묵은빈칸.length}개 — 「다음에 손대는 사람」은 오지 않는다`);
    for (const x of r.묵은빈칸.slice(0, 8)) {
      console.log(`      ${x.이름}  ${x.날 ? `(${x.날} · ${x.지난날}일째)` : '(언제 적었는지도 모른다)'}`);
    }
    if (r.묵은빈칸.length > 8) console.log(`      … 그 밖에 ${r.묵은빈칸.length - 8}개`);
    console.log('      ⭐ 하루에 하나씩만 읽어도 보름이면 끝난다. 약관 원문을 읽고 판정을 채운다');
    console.log('      ⛔ 짐작으로 🟢 를 주지 않는다. 못 읽었으면 왜 못 읽었는지를 적는다');
  }

  console.log('\n   ⛔ ⬜ 를 「괜찮다」로 세지 않는다 — 읽지도 않은 것이다');
  if (r.급한것.length) return 1;
  if (!r.빈칸.length) console.log('   ✅ 빈칸 0');
  return 0;
}

/* ── 자가시험 ───────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 본다 = (말, 참) => { if (참) { 통 += 1; console.log('✅ ' + 말); } else { 탈 += 1; console.log('🔴 ' + 말); } };

  const 맵 = (줄들) => 줄들.map((x) => x.join('\t')).join('\n');
  const 글 = ['# 머리', ...[
    ['stocks', '설명', '🟢', '2026-08-05 확인'],
    ['imf-pip', '설명', '⬜', '[6번, 2026-09-18] 못 읽었다'],
    ['krx', '설명', '🔴', '제6조② 비상업적인 목적으로만'],
    ['(안-씀)홍콩-HKEX', '설명', '🔴', '2026-09-18 읽고 안 쓰기로 했다'],
    ['commodities', '설명', '⬜', '약관을 아직 안 읽었다'],
  ].map((x) => x.join('\t'))].join('\n');

  const 줄 = 줄읽기(글);
  본다('머리줄을 안 읽는다', 줄.length === 5 && !줄.some((x) => x.이름.startsWith('#')));
  본다('칸을 가른다', 줄[0].이름 === 'stocks' && 줄[0].판정 === '🟢');
  본다('⛔ 빈 것에 안 터진다', 줄읽기(null).length === 0 && 줄읽기('').length === 0);

  본다('🔴 (안-씀) 이 붙으면 쓰지 않는 것이다', 쓰고있나({ 이름: '(안-씀)홍콩-HKEX' }) === false);
  본다('표가 없으면 쓰는 것으로 본다', 쓰고있나({ 이름: 'krx' }) === true);

  본다('날을 집는다', 적은날('[6번, 2026-09-18] 못 읽었다') === '2026-09-18');
  본다('⛔ 날이 없으면 null — 오늘로 치지 않는다',
    적은날('약관을 아직 안 읽었다') === null && 적은날(null) === null);
  본다('며칠 지났나를 센다', 며칠지났나('2026-09-18', '2026-10-06') === 18);
  본다('달을 넘어도 센다', 며칠지났나('2026-09-30', '2026-10-01') === 1);
  본다('⛔ 한쪽이라도 모르면 null', 며칠지났나(null, '2026-10-06') === null);

  const r = 가른다(줄, '2026-10-06');
  본다('🔴 쓰면서 막힌 것만 급한 칸에 넣는다', r.급한것.length === 1 && r.급한것[0].이름 === 'krx');
  본다('⛔ (안-씀) 은 급한 칸에 안 넣는다', !r.급한것.some((x) => x.이름.includes('HKEX')));
  본다('⬜ 를 센다', r.빈칸.length === 2);
  본다('🔴 묵은 것을 집는다 — 18일째', r.묵은빈칸.some((x) => x.이름 === 'imf-pip' && x.지난날 === 18));
  본다('⛔ 날을 모르는 빈칸도 묵은 것으로 본다 — 「최근」으로 봐주지 않는다',
    r.묵은빈칸.some((x) => x.이름 === 'commodities' && x.지난날 === null));
  본다('오래된 것이 먼저 온다', r.묵은빈칸[0].지난날 === null || r.묵은빈칸[0].지난날 >= 18);
  본다('읽고 판정한 것을 센다', r.읽은것 === 1);
  본다('⛔ ⬜ 를 읽은 것으로 세지 않는다', r.읽은것 !== 3);

  const 깨끗 = 가른다(줄읽기(맵([['a', 'b', '🟢', '2026-10-06 확인']])), '2026-10-06');
  본다('⭐ 다 읽었으면 빈칸 0 · 급한 것 0', 깨끗.빈칸.length === 0 && 깨끗.급한것.length === 0);

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통} 통과`);
  return 탈 ? 1 : 0;
}

/* ⛔ 걸림돌 없는 꼭대기 부름을 두지 않는다 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  process.exit(process.argv.includes('--자가시험') ? 자가시험() : 주다());
}
