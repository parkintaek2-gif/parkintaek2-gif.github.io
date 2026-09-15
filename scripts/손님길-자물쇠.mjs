#!/usr/bin/env node
/**
 * 손님길-자물쇠.mjs — **유료 사이트의 «세 징검다리»를 번갈아 재고, 안 재면 잠근다.**
 *
 *   node scripts/손님길-자물쇠.mjs                      지금 누가 무엇을 잴 차례인가
 *   node scripts/손님길-자물쇠.mjs --잰다 --사이트 seoulmarkets --누구 5번
 *                                                      실제로 재고 대장에 적는다
 *   node scripts/손님길-자물쇠.mjs --자물쇠 6번            잠겼으면 종료코드 1
 *   node scripts/손님길-자물쇠.mjs --자가시험
 *
 * ── 🔴 사장님 지시 (2026-09-15, 원문) ────────────────────────────────────
 *
 * 「**유료 사이트는 항상 뭘 확인하라고 했지? 그걸 담당 세션과 네가 같이 확인을 해야 돼..
 *   결제가 안되는 사이트는 정말 쓰레기야**」
 *
 * 「**세 징검다리를 너, 담당 유닛 2이 번갈아 가면서 확인해...7시~21시에는 담당 유닛이,
 *   나머지 시간은 네가 2~3시간 마다 확인해 이것도 자물쇠를 잠가..
 *   정각엔 소통이니 30분에 하면 되겠네**」
 *
 * ── 세 징검다리가 무엇인가 ───────────────────────────────────────────────
 * ```
 * 1. 들어오기   손님이 들어올 수 있나 (로그인·가입)
 *              ⚠ SeoulMarkets 는 로그인이 «없다». 비회원 구매가 유일한 길이라
 *                그 길이 살아 있는지가 이 다리다
 * 2. 돈 내기    결제창이 뜨고, 눌러서 주문이 «실제로» 만들어지나
 *              ⛔ 「단추가 보인다」를 「결제가 된다」로 읽지 않는다 — 2026-09-15 에
 *                그것으로 결제가 통째로 죽어 있는 줄 몰랐다
 * 3. 다시 보기   산 것을 다시 찾을 수 있나
 *              사장님: 「비회원 결제는 감명서를 다시 못보잖아」
 * ```
 *
 * ── 차례 (사장님이 정하신 대로) ──────────────────────────────────────────
 * ```
 * 07:30 · 10:30 · 13:30 · 16:30 · 19:30     담당 유닛   (업무시간 07~21시)
 * 21:30 · 00:30 · 03:30 · 06:30             5번(총괄)   (나머지 시간)
 * ```
 * ⭐ **정각을 피해 :30 에 둔다** — 정각은 매시 소통 자리다(사장님이 직접 짚어 주셨다).
 * ⭐ 3시간마다라 하루 아홉 번 잰다. 두 유료 사이트를 각각 잰다.
 *
 * ⛔ 뒷문은 없다. 잠기면 «재야» 풀린다. 「봤다」로는 안 풀린다 — 대장에 줄이 있어야 한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장길 = path.join(뿌리, 'docs/손님길점검.tsv');

/** 유료 사이트와 그 담당 자리. ⛔ 무료 사이트는 여기 넣지 않는다 — 팔 것이 없다 */
/*
 * ⚠ `재는다리` — 그 사이트의 자가 «실제로 재는» 다리만 적는다.
 *   ⛔ 안 재는 것을 「쟀다」고 적지 않는다. 강령 셋째 — 못 잰 것은 못 쟀다고 적는다.
 *   ✅ [2026-09-16] KLifeMap 도 이제 셋 다 잰다(2번이 다시볼수있나() 를 넣었다).
 */
export const 유료사이트 = [
  {
    코드: 'seoulmarkets', 이름: 'SeoulMarkets', 담당: '6번',
    자: 'check-seoulmarkets-payment.mjs',
    재는다리: ['들어오기', '돈 내기', '다시 보기'],
  },
  {
    /* ✅ [2026-09-16 · 2번] 「다시 보기」를 check-klifemap-payment.mjs 의
       다시볼수있나() 로 넣었다 — login.html 「감명 내역」 글자 + /api/my/sessions·
       /api/my/payments 무인증 401 을 잰다(seoulmarkets 의 되찾기 자와 같은 결).
       ⚠ 실제 로그인→목록→상세 왕복까지는 운영 DB에 테스트 손님을 못 심어 여기서는
       못 잰다 — 그건 klifemap/tools/check-감명다시보기.mjs 를 로컬에서 인자 없이
       돌리는 쪽이 맡는다(배포 전). 이 자는 «입구가 살아 있나»까지다. */
    코드: 'klifemap', 이름: 'KLifeMap', 담당: '2번',
    자: 'check-klifemap-payment.mjs',
    재는다리: ['들어오기', '돈 내기', '다시 보기'],
  },
];

/** 재는 시각 — 사장님이 「30분에」라고 정하셨다. 정각은 매시 소통 자리다 */
export const 재는분 = 30;
export const 담당시각 = [7, 10, 13, 16, 19];   /* 업무시간 07~21 */
export const 총괄시각 = [21, 0, 3, 6];          /* 나머지 */
export const 봐주는분 = 40;                      /* 칸이 열리고 40분은 안 잠근다 */

/** 이 PC 는 이미 한국시간이다. ⛔ toISOString() 을 쓰지 않는다 */
export function 시각글(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
    + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/**
 * 지금 «지나간 가장 최근 칸»은 무엇이고 누구 차례인가.
 * 낸다 — { 칸시각, 칸글, 누구 } · 아직 첫 칸 전이면 어제 마지막 칸을 준다
 */
export function 지금칸(이제 = new Date()) {
  const 시 = 이제.getHours(); const 분 = 이제.getMinutes();
  const 모든칸 = [...담당시각.map((h) => ({ h, 누구: '담당' })), ...총괄시각.map((h) => ({ h, 누구: '5번' }))]
    .sort((a, b) => a.h - b.h);
  /* 오늘 이미 지나간 칸 가운데 가장 늦은 것 */
  const 지난것 = 모든칸.filter((x) => x.h < 시 || (x.h === 시 && 분 >= 재는분));
  const 고른것 = 지난것.length ? 지난것[지난것.length - 1] : 모든칸[모든칸.length - 1];
  const 어제냐 = 지난것.length === 0;
  const d = new Date(이제);
  if (어제냐) d.setDate(d.getDate() - 1);
  d.setHours(고른것.h, 재는분, 0, 0);
  return { 칸시각: d, 칸글: 시각글(d), 누구: 고른것.누구 };
}

/** 이 칸이 «잠글 만큼» 지났나 — 열리고 40분은 봐준다 */
export function 잠글때가됐나(칸시각, 이제 = new Date()) {
  return 이제.getTime() - 칸시각.getTime() >= 봐주는분 * 60000;
}

export function 줄쓰기({ 시각, 사이트, 누구, 판정, 말 }) {
  return [시각, 사이트, 누구, 판정, String(말 ?? '').replace(/\t/g, ' ')].join('\t');
}

export function 줄읽기(줄) {
  const 것 = String(줄 ?? '').split('\t');
  if (것.length < 4) return null;
  return { 시각: 것[0], 사이트: 것[1], 누구: 것[2], 판정: 것[3], 말: 것[4] ?? '' };
}

export function 대장읽기(길 = 대장길) {
  if (!fs.existsSync(길)) return [];
  return fs.readFileSync(길, 'utf8').split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map(줄읽기).filter(Boolean);
}

/** 이 칸에 이 사이트를 잰 줄이 있나. ⛔ 「팔린다」가 아니어도 «잰 것»으로는 센다 */
export function 이칸에쟀나(줄들, 사이트, 칸시각, 이제 = new Date()) {
  const 다음칸 = 지금칸(new Date(칸시각.getTime() + 3 * 3600e3 + 60000)).칸시각;
  return (줄들 ?? []).some((r) => {
    if (r.사이트 !== 사이트) return false;
    const t = Date.parse(String(r.시각).replace(' ', 'T') + ':00');
    if (!Number.isFinite(t)) return false;
    return t >= 칸시각.getTime() && t < Math.max(다음칸.getTime(), 칸시각.getTime() + 3 * 3600e3);
  });
}

/**
 * 잠겼나. 자리 번호를 받아 그 자리가 맡은 «이 칸»을 안 쟀으면 잠근다.
 * ⛔ 자기 차례가 아닌 칸으로 남을 잠그지 않는다.
 */
export function 잠겼나(누구, 줄들, 이제 = new Date()) {
  const 그 = String(누구 ?? '').trim();
  const 칸 = 지금칸(이제);
  if (!잠글때가됐나(칸.칸시각, 이제)) {
    return { 잠겼나: false, 까닭: 칸.칸글 + ' 칸이 열린 지 ' + 봐주는분 + '분이 안 됐다 — 아직 안 잠근다' };
  }
  /* 내 차례인 사이트를 모은다 */
  const 내몫 = 유료사이트.filter((s) => (칸.누구 === '5번' ? 그 === '5번' : s.담당 === 그));
  if (!내몫.length) {
    return { 잠겼나: false, 까닭: 그 + ' 는 ' + 칸.칸글 + ' 칸의 차례가 아니다' };
  }
  const 안잰것 = 내몫.filter((s) => !이칸에쟀나(줄들, s.코드, 칸.칸시각, 이제));
  if (!안잰것.length) return { 잠겼나: false, 까닭: 칸.칸글 + ' 칸을 다 쟀다' };
  return {
    잠겼나: true,
    까닭: 그 + ' 가 ' + 칸.칸글 + ' 칸에 손님길을 안 쟀다 — ' + 안잰것.map((s) => s.이름).join(' · '),
    푸는법: 안잰것.map((s) =>
      'node scripts/손님길-자물쇠.mjs --잰다 --사이트 ' + s.코드 + ' --누구 ' + 그).join('  ·  '),
  };
}

/* ── 실제로 재고 적는다 ─────────────────────────────────────────────── */

export function 적는다({ 사이트, 누구, 판정, 말, 길 = 대장길, 이제 = new Date() }) {
  const 줄 = 줄쓰기({ 시각: 시각글(이제), 사이트, 누구, 판정, 말 });
  if (!fs.existsSync(길)) {
    fs.mkdirSync(path.dirname(길), { recursive: true });
    fs.writeFileSync(길,
      '# 유료 사이트 «세 징검다리» 점검 대장 — 들어오기 · 돈 내기 · 다시 보기\n'
      + '# 사장님(2026-09-15): 「7시~21시에는 담당 유닛이, 나머지 시간은 네가 2~3시간 마다 확인해」\n'
      + '# ⛔ 「봤다」는 증거가 아니다. 이 줄이 증거다\n'
      + '잰때(KST)\t사이트\t잰자리\t판정\t말\n');
  }
  fs.appendFileSync(길, 줄 + '\n');
  return 줄;
}

function 잰다(사이트코드, 누구) {
  const s = 유료사이트.find((x) => x.코드 === 사이트코드);
  if (!s) { console.log('🔴 모르는 사이트다 — ' + 사이트코드); return 1; }
  let 판정 = '못쟀다'; let 말 = '';
  try {
    /* ⛔ 자가 막히면 종료코드 1 을 낸다. 그것을 «판정»으로 받는다 */
    const 글 = execFileSync('node', [path.join(뿌리, 'scripts', s.자)],
      { encoding: 'utf8', timeout: 240000 });
    console.log(글);
    판정 = '팔린다';
    /* ⛔ 「세 다리 다」로 뭉뚱그리지 않는다 — 그 자가 «실제로 잰» 다리만 적는다 */
    말 = '잰 다리: ' + s.재는다리.join('·')
      + (s.재는다리.length < 3 ? ' (⚠ 나머지는 «못 쟀다»)' : '');
  } catch (e) {
    const 글 = String(e.stdout ?? '') + String(e.stderr ?? '');
    console.log(글);
    판정 = /매출\s*0|매출0/.test(글) ? '매출0' : '막힘';
    말 = (글.split('\n').find((l) => /·\s*🔴|🔴/.test(l)) ?? '막혔다').trim().slice(0, 160);
  }
  const 줄 = 적는다({ 사이트: 사이트코드, 누구, 판정, 말 });
  console.log('\n✅ 대장에 적었다 — docs/손님길점검.tsv');
  console.log('   ' + 줄);
  if (판정 !== '팔린다') {
    console.log('\n🔴🔴 **팔리지 않는다.** 사장님: 「결제가 안되는 사이트는 정말 쓰레기야」');
    console.log('   ⛔ 다른 일로 넘어가지 않는다. 이것부터 고친다.');
    return 1;
  }
  return 0;
}

function 본일() {
  const 이제 = new Date();
  const 칸 = 지금칸(이제);
  const 줄들 = 대장읽기();
  console.log('■ 유료 사이트 «세 징검다리» — ' + 이제.toLocaleString('ko-KR'));
  console.log('   들어오기 · 돈 내기 · 다시 보기\n');
  console.log('   지금 칸   ' + 칸.칸글 + ' · 차례 ' + (칸.누구 === '5번' ? '5번(총괄)' : '담당 유닛'));
  for (const s of 유료사이트) {
    const 쟀나 = 이칸에쟀나(줄들, s.코드, 칸.칸시각, 이제);
    const 맡은이 = 칸.누구 === '5번' ? '5번' : s.담당;
    console.log('   ' + (쟀나 ? '✅' : '⬜') + ' ' + s.이름.padEnd(14) + '맡은이 ' + 맡은이
      + (쟀나 ? '  — 이 칸에 쟀다' : '  — 아직 안 쟀다'));
  }
  console.log('\n   차례표 — 담당 ' + 담당시각.map((h) => h + ':30').join(' · '));
  console.log('           총괄 ' + 총괄시각.map((h) => h + ':30').join(' · '));
  console.log('   ⭐ 정각을 피한다 — 정각은 매시 소통 자리다(사장님 지시)');
  return 0;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = []; const 재다 = (이름, 됐나) => 것.push({ 이름, 됐나 });
  const 때 = (h, m) => new Date(2026, 8, 15, h, m);

  재다('유료 사이트는 둘이다', 유료사이트.length === 2);
  재다('담당은 6번·2번이다',
    유료사이트.find((s) => s.코드 === 'seoulmarkets').담당 === '6번'
    && 유료사이트.find((s) => s.코드 === 'klifemap').담당 === '2번');
  재다('⭐ 정각이 아니라 30분에 잰다 — 정각은 소통 자리다', 재는분 === 30);
  재다('하루 아홉 칸이다 (3시간마다)', 담당시각.length + 총괄시각.length === 9);
  재다('담당은 업무시간(07~21) 안에만 있다', 담당시각.every((h) => h >= 7 && h < 21));
  재다('총괄은 업무시간 밖이다', 총괄시각.every((h) => h >= 21 || h < 7));

  재다('13:40 이면 13:30 칸이고 담당 차례', (() => {
    const c = 지금칸(때(13, 40));
    return c.칸시각.getHours() === 13 && c.누구 === '담당';
  })());
  재다('13:20 이면 아직 10:30 칸이다', 지금칸(때(13, 20)).칸시각.getHours() === 10);
  재다('22:00 이면 21:30 칸이고 총괄 차례', (() => {
    const c = 지금칸(때(22, 0));
    return c.칸시각.getHours() === 21 && c.누구 === '5번';
  })());
  재다('01:00 이면 00:30 칸이고 총괄 차례', (() => {
    const c = 지금칸(때(1, 0));
    return c.칸시각.getHours() === 0 && c.누구 === '5번';
  })());
  재다('00:10 이면 «어제» 21:30 칸이다', (() => {
    const c = 지금칸(때(0, 10));
    return c.칸시각.getHours() === 21 && c.칸시각.getDate() === 14;
  })());

  재다('칸이 열리고 40분 안이면 안 잠근다', 잠글때가됐나(때(13, 30), 때(14, 0)) === false);
  재다('40분이 지나면 잠글 때가 된 것이다', 잠글때가됐나(때(13, 30), 때(14, 10)) === true);

  const 줄들 = [{ 시각: '2026-09-15 13:35', 사이트: 'seoulmarkets', 누구: '6번', 판정: '팔린다', 말: '' }];
  재다('이 칸에 쟀으면 참', 이칸에쟀나(줄들, 'seoulmarkets', 때(13, 30), 때(14, 20)) === true);
  재다('딴 사이트는 안 센다', 이칸에쟀나(줄들, 'klifemap', 때(13, 30), 때(14, 20)) === false);
  재다('⛔ 앞 칸 것을 이 칸으로 세지 않는다', 이칸에쟀나(줄들, 'seoulmarkets', 때(16, 30), 때(17, 20)) === false);

  재다('🔴 담당이 자기 칸을 안 쟀으면 잠근다', 잠겼나('6번', [], 때(14, 20)).잠겼나 === true);
  재다('담당이 쟀으면 안 잠근다', 잠겼나('6번', 줄들, 때(14, 20)).잠겼나 === false);
  재다('⛔ 담당 칸에 5번을 잠그지 않는다', 잠겼나('5번', [], 때(14, 20)).잠겼나 === false);
  재다('🔴 밤 칸은 5번을 잠근다', 잠겼나('5번', [], 때(22, 20)).잠겼나 === true);
  재다('⛔ 밤 칸에 6번을 잠그지 않는다', 잠겼나('6번', [], 때(22, 20)).잠겼나 === false);
  재다('밤 칸에 5번은 «두 사이트 다» 재야 한다',
    /SeoulMarkets · KLifeMap/.test(잠겼나('5번', [], 때(22, 20)).까닭));
  재다('봐주는 40분 안에는 아무도 안 잠근다', 잠겼나('6번', [], 때(13, 50)).잠겼나 === false);
  재다('푸는 법을 알려 준다', /손님길-자물쇠\.mjs --잰다/.test(잠겼나('6번', [], 때(14, 20)).푸는법));

  const 줄 = 줄쓰기({ 시각: '2026-09-15 21:50', 사이트: 'seoulmarkets', 누구: '5번', 판정: '팔린다', 말: 'x' });
  재다('줄을 쓰고 다시 읽는다', 줄읽기(줄).사이트 === 'seoulmarkets' && 줄읽기(줄).판정 === '팔린다');
  재다('⛔ 말에 든 탭은 지운다', !줄쓰기({ 시각: 'a', 사이트: 'b', 누구: 'c', 판정: 'd', 말: 'e\tf' }).split('\t')[4].includes('\t'));

  const 실패 = 것.filter((x) => !x.됐나);
  console.log(`■ 자가시험 ${것.length - 실패.length}/${것.length}`);
  for (const x of 실패) console.log(`  🔴 ${x.이름}`);
  return 실패.length === 0;
}

const 인자 = (이름) => {
  const i = process.argv.indexOf(이름);
  return i > 0 ? (process.argv[i + 1] ?? null) : null;
};

if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
else if (process.argv[1] && process.argv[1].endsWith('손님길-자물쇠.mjs')) {
  const 볼자리 = 인자('--자물쇠');
  if (볼자리) {
    const r = 잠겼나(볼자리, 대장읽기());
    console.log((r.잠겼나 ? '🔒 잠겼다 — ' : '✅ 안 잠겼다 — ') + r.까닭);
    if (r.푸는법) console.log('   푸는 법 — ' + r.푸는법);
    process.exit(r.잠겼나 ? 1 : 0);
  } else if (process.argv.includes('--잰다')) {
    process.exit(잰다(인자('--사이트') ?? 'seoulmarkets', 인자('--누구') ?? '5번'));
  } else {
    process.exit(본일());
  }
}
