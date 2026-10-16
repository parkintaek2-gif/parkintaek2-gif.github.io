#!/usr/bin/env node
/**
 * 잰다-수집이-멈춘갈래.mjs
 *
 * 🔴 [2026-10-16 · 5번] **왜 이 자가 필요한가.**
 * ─────────────────────────────────────────────────────────────────────
 * 사장님 — 「에스마켓츠 데이터 수집 및 웹 적용 다 끝났나?」
 *
 * 세어 보니 `archive/raw/` 아래 갈래가 **101개**다.
 * 사람이 날마다 101개를 눈으로 볼 수는 없다. 그래서 멈춘 것을 아무도 몰랐다.
 *   dart              2026-09-09 에 멈춤   (37일)
 *   bigdata-culture   2026-09-04 에 멈춤   (42일)
 *   culture-portal    2026-09-04 에 멈춤
 *   …
 *
 * ⚠ 그런데 **멈춘 것과 원래 띄엄띄엄 나오는 것은 다르다.**
 *   연간 통계는 1년에 한 번 나온다. 그것을 「멈췄다」고 울면 날마다 거짓 빨강이 뜨고,
 *   그 옆의 «진짜» 멈춤까지 같이 묻힌다.
 *   ⇒ 그래서 이 자는 **그 갈래가 여태 어떤 간격으로 들어왔나**를 보고
 *     「그 간격보다 훨씬 늦어졌나」를 잰다. 고정된 날수로 재지 않는다.
 *
 * ⛔ 이 자는 고치지 않는다. 어느 갈래가 늦었나를 가져올 뿐이다.
 * ⚠ 못 보는 것 — 「왜 멈췄나」는 못 잰다. 자료가 안 나온 것인지 우리 자가 죽은 것인지는
 *   그 갈래를 맡은 자리가 본다.
 *
 * 쓰기:  node scripts/잰다-수집이-멈춘갈래.mjs
 *       node scripts/잰다-수집이-멈춘갈래.mjs --몇개 20
 *       node scripts/잰다-수집이-멈춘갈래.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\//, '')), '..');

/** 🔴 [2026-10-16 · 5번] **일부러 멈춘 갈래는 울지 않는다.**
 *
 *  처음 돌렸더니 `krx` 가 「39일 묵었다」고 빨갛게 울었다. 열어 보니
 *  **사장님이 일부러 끊으신 것**이었다 —
 *    「공공데이터포털에서만 수집하도록 해, krx 자료가 전혀 필요없네」(2026-09-09)
 *    까닭: KRX OPEN API 약관 제6조② 「비상업적인 목적으로만」 — 우리는 판다.
 *  수집기 머리에 「비석이다」라고 적혀 있었다.
 *
 *  ⛔ 이런 갈래가 날마다 빨갛게 울면 그 옆의 «진짜» 멈춤까지 같이 묻힌다.
 *  ⚠ 손으로 목록을 적지 않는다 — 적으면 다음에 비석이 생길 때 또 운다.
 *    **수집기 머리글에서 「비석」을 찾아** 저절로 가린다. */
export function 일부러멈춘것(뿌리2, fs2) {
  const 것 = new Set();
  try {
    const 방 = (fs2 || fs).readdirSync(뿌리2 + '/scripts').filter((n) => n.endsWith('.mjs'));
    for (const n of 방) {
      let 머리;
      try { 머리 = (fs2 || fs).readFileSync(뿌리2 + '/scripts/' + n, 'utf8').slice(0, 1200); } catch { continue; }
      if (!/비석이다|더 쓰지 않는다|되살리지 마십시오/.test(머리)) continue;
      /* collect-krx-stock.mjs → krx · krx-stock 둘 다 담는다 */
      const m = /^(?:collect|build)-(.+).mjs$/.exec(n);
      if (!m) continue;
      것.add(m[1]);
      것.add(m[1].split('-')[0]);
    }
  } catch { /* 못 읽으면 가리는 것 없이 간다 */ }
  return 것;
}
/** 이름에서 날짜를 뽑는다 — 2026-10-15 · 20261015 둘 다. ⛔ 아니면 null */
export function 날뽑기(이름) {
  const s = String(이름 ?? '');
  let m = /(20[0-9]{2})-([0-9]{2})-([0-9]{2})/.exec(s);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = /(20[0-9]{2})([0-9]{2})([0-9]{2})/.exec(s);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  return null;
}

/** 며칠 간격으로 들어왔나 — 가운데값. ⛔ 두 개 미만이면 null(모른다) */
export function 보통간격(날들) {
  const 것 = [...new Set((날들 || []).filter(Boolean))].sort();
  if (것.length < 3) return null;
  const 사이 = [];
  for (let i = 1; i < 것.length; i++) {
    사이.push(Math.round((new Date(것[i]) - new Date(것[i - 1])) / 86400000));
  }
  사이.sort((a, b) => a - b);
  return 사이[Math.floor(사이.length / 2)] || null;
}

/** 늦었나. ⛔ 보통 간격을 모르면 null — 「늦었다」고 단정하지 않는다 */
export function 늦었나(묵은날, 보통) {
  if (묵은날 === null || 보통 === null) return null;
  /* 보통 간격의 세 배를 넘고, 적어도 7일은 지나야 늦은 것이다 */
  return 묵은날 > Math.max(보통 * 3, 7);
}

export function 며칠묵었나(날, 오늘 = new Date()) {
  if (!날) return null;
  const t = new Date(날 + 'T00:00:00+09:00').getTime();
  if (!Number.isFinite(t)) return null;
  const 오늘0 = new Date(오늘.getFullYear(), 오늘.getMonth(), 오늘.getDate()).getTime();
  return Math.floor((오늘0 - t) / 86400000);
}

function 몇개(argv) {
  const i = argv.indexOf('--몇개');
  if (i < 0) return 15;
  const n = Number(argv[i + 1]);
  return Number.isFinite(n) && n > 0 && n <= 120 ? Math.floor(n) : 15;
}

function 돈다() {
  const 방 = path.join(뿌리, 'archive', 'raw');
  let 갈래들;
  try { 갈래들 = fs.readdirSync(방).filter((d) => fs.statSync(path.join(방, d)).isDirectory()); }
  catch { console.log('⬜ archive/raw 를 못 읽었다 — 못 쟀다'); process.exit(0); }

  const 비석 = 일부러멈춘것(뿌리);
  const 줄 = [];
  let 못쟀다 = 0, 비석수 = 0;
  for (const 갈래 of 갈래들) {
    if (비석.has(갈래)) { 비석수++; continue; }   /* ⛔ 일부러 멈춘 것은 안 운다 */
    let 이름들;
    try { 이름들 = fs.readdirSync(path.join(방, 갈래)); } catch { 못쟀다++; continue; }
    const 날들 = 이름들.map(날뽑기).filter(Boolean);
    if (!날들.length) { 못쟀다++; continue; }
    const 마지막 = [...날들].sort().pop();
    const 묵 = 며칠묵었나(마지막);
    const 보통 = 보통간격(날들);
    줄.push({ 갈래, 마지막, 묵, 보통, 늦음: 늦었나(묵, 보통) });
  }

  console.log('■ 수집이 멈춘 갈래가 있나 — archive/raw ' + 갈래들.length + '개');
  console.log('  ⚠ 「멈춘 것」과 「원래 띄엄띄엄 나오는 것」은 다르다 —');
  console.log('    그 갈래가 여태 들어온 «간격»과 견준다. 고정된 날수로 재지 않는다.');
  console.log('');

  const 늦은것 = 줄.filter((x) => x.늦음 === true).sort((a, b) => b.묵 - a.묵);
  const 모름 = 줄.filter((x) => x.늦음 === null).length;

  for (const x of 늦은것.slice(0, 몇개(process.argv))) {
    console.log('  🔴 ' + x.갈래.padEnd(28) + x.마지막 + '  ' + String(x.묵).padStart(3) + '일 묵었다'
      + '   (보통 ' + x.보통 + '일마다 들어왔다)');
  }

  console.log('');
  console.log('  늦은 갈래 ' + 늦은것.length + '개 · 제때인 갈래 ' + 줄.filter((x) => x.늦음 === false).length
    + '개 · 간격을 모르는 갈래 ' + 모름 + '개 · 날짜를 못 읽은 갈래 ' + 못쟀다 + '개'
    + (비석수 ? ' · 일부러 멈춘 갈래 ' + 비석수 + '개(안 센다)' : ''));
  console.log('  ⛔ 「간격을 모른다」는 「멈췄다」가 아니다 — 들어온 횟수가 적어 못 재는 것이다.');
  if (늦은것.length) {
    console.log('');
    console.log('🔴 위 갈래들은 여태 들어오던 간격의 세 배를 넘겼다. 그 갈래를 맡은 자리가 본다.');
    process.exit(1);
  }
  console.log('✅ 늦은 갈래가 없다.');
  process.exit(0);
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0, 탈 = 0;
  const T = (뜻, 참) => { if (참) { 통++; console.log('  ✅ ' + 뜻); } else { 탈++; console.log('  🔴 ' + 뜻); } };
  const 오늘 = new Date(2026, 9, 16);

  console.log('■ 자가시험');
  T('빗금 꼴 날짜를 읽는다', 날뽑기('2026-10-15') === '2026-10-15');
  T('붙은 꼴도 읽는다 — 자국 이름이 그 꼴이다', 날뽑기('20261013.json') === '2026-10-13');
  T('⛔ 날짜가 없으면 null', 날뽑기('company.ndjson') === null);
  T('⛔ 빈 것에 안 터진다', 날뽑기(null) === null && 날뽑기('') === null);

  T('날마다 들어온 갈래의 보통 간격은 1',
    보통간격(['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']) === 1);
  T('🔴 달마다 들어온 갈래는 30 언저리다 — 이것을 「멈췄다」고 울면 안 된다',
    보통간격(['2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']) >= 28);
  T('⛔ 세 번 미만이면 null — 모른다고 한다', 보통간격(['2026-10-10', '2026-10-11']) === null);
  T('⛔ 빈 것도 null', 보통간격([]) === null && 보통간격(null) === null);

  T('🔴 날마다 오던 것이 37일 비면 늦은 것이다', 늦었나(37, 1) === true);
  T('⛔ 달마다 오던 것이 37일이면 «늦지 않았다»', 늦었나(37, 30) === false);
  T('⛔ 날마다 오던 것이 3일 비어도 안 운다 — 적어도 7일은 지나야 한다', 늦었나(3, 1) === false);
  T('⛔ 보통 간격을 모르면 null — 단정하지 않는다', 늦었나(37, null) === null);
  T('⛔ 묵은 날을 모르면 null', 늦었나(null, 1) === null);

  T('며칠 묵었는지 센다', 며칠묵었나('2026-10-13', 오늘) === 3);
  T('⛔ 날짜가 없으면 null — 0 이 아니다', 며칠묵었나(null, 오늘) === null);

  console.log('\n자가시험 — 통과 ' + 통 + ' · 실패 ' + 탈);
  process.exit(탈 ? 1 : 0);
}

const 곧바로부른것 = (() => {
  const 나 = decodeURIComponent(new URL(import.meta.url).pathname).split('/').pop();
  const 부른것 = String(process.argv[1] || '').split('/').pop().split(String.fromCharCode(92)).pop();
  return 나 !== '' && 나 === 부른것;
})();

if (!곧바로부른것) { /* 불러 쓰는 중이다 */ }
else if (process.argv.includes('--자가시험')) 자가시험();
else 돈다();
