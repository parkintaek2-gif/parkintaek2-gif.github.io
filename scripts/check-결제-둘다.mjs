#!/usr/bin/env node
/**
 * check-결제-둘다.mjs — 토스(KLifeMap)와 페이팔(SeoulMarkets)을 «한 번에» 잰다
 * ─────────────────────────────────────────────────────────────────────────────
 * 사장님 지시(2026-09-20): 「빠진 시각 안 생기게 두 자 묶어서 자동화해」
 *
 * [왜 묶나] 자가 둘로 갈려 있으니 한쪽만 돌린 시각이 생겼다. 오늘 실측 —
 *   토스 13번(1·8·13·14시 빠짐) · 페이팔 10번(0·3·5·7·8·10·11시 빠짐).
 *   사장님이 「토스페이먼츠는 점검을 정기적으로 안하나?」라고 물으신 자리가 여기다.
 *   ⇒ 사람이 두 번 치는 것에 기대지 않는다. 한 자가 둘을 다 돌린다.
 *
 * [무엇을 재나] 「서버가 떠 있나」가 아니라 «손님이 살 수 있나»다. 두 자식 자가 그것을 잰다.
 *   ⛔ 승인(capture)은 부르지 않는다 — 자식 자들이 이미 그 선을 지킨다. 여기서 더 하지 않는다.
 *
 * [빠진 시각을 어떻게 없애나]
 *   ① 윈도 작업 스케줄러가 매시 :05 에 이 자를 부른다(세션이 죽어도 돈다)
 *      ⚠ CronCreate 는 «세션 메모리»에만 있어 세션이 바뀌면 사라진다 — 그래서 안 쓴다
 *   ② 돌 때마다 오늘 빠진 시각을 스스로 세어 화면과 마커에 적는다
 *   ③ 지난 시각 마커가 없으면 「놓쳤다」를 그 자리에 적는다 — 조용히 넘어가지 않는다
 *
 * [언제 사장님께 알리나] 🔴 매출이 0 이 된 때만. 그것도 «두 번 잇따라» 그럴 때만이다.
 *   한 번은 그물이 흔들린 것일 수 있다. 두 번이면 진짜다.
 *   ⛔ 잘 팔리는 날의 초록불을 사장님께 보내지 않는다 — 우리 살림을 보는 알림은 우리가 받는다.
 *
 * 쓰는 법
 *   node scripts/check-결제-둘다.mjs
 *   node scripts/check-결제-둘다.mjs --빈시각만     오늘 빠진 시각만 본다(자를 안 돌린다)
 *   node scripts/check-결제-둘다.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(여기, '..');
const 마커방 = path.join(뿌리, 'docs', '고정업무-마커');
const 지난판 = path.join(뿌리, 'docs', '고정업무-마커', '.결제둘다-지난판.json');

/* ── 시각 — 이 PC 가 이미 KST 다 ────────────────────────────────────────────
   ⛔ toISOString() 을 쓰지 않는다. UTC 라 새벽에 날짜가 하루 어긋난다. */
export function 날짜글(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    + '-' + String(d.getDate()).padStart(2, '0');
}
export function 시각글(d = new Date()) {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/* ── 두 결제사 ────────────────────────────────────────────────────────────
   마커 이름이 서로 달라서 한쪽만 보고 「안 쟀다」로 읽혔다. 여기 한곳에 모은다. */
export const 결제사들 = [
  { 키: '토스', 이름: '토스 (KLifeMap)', 자: 'check-klifemap-payment.mjs',
    옛마커: /^(\d{4}-\d{2}-\d{2})-(\d{1,2})시-결제점검\.txt$/ },
  { 키: '페이팔', 이름: '페이팔 (SeoulMarkets)', 자: 'check-seoulmarkets-payment.mjs',
    옛마커: /^(\d{4}-\d{2}-\d{2})-(\d{1,2})시-서울마켓츠결제점검\.txt$/ },
];
const 함께마커 = /^(\d{4}-\d{2}-\d{2})-(\d{1,2})시-결제둘다\.txt$/;

/* ── 오늘 어느 시각에 쟀나 ────────────────────────────────────────────────
   ⚠ 묶기 «전»에 남은 옛 마커도 센다. 안 세면 오늘 오전이 통째로 빵꾸로 보인다. */
export function 잰시각(파일들, 오늘, 결제사) {
  const 잰것 = new Set();
  for (const f of 파일들) {
    for (const 틀 of [결제사.옛마커, 함께마커]) {
      const m = 틀.exec(f);
      if (m && m[1] === 오늘) 잰것.add(Number(m[2]));
    }
  }
  return [...잰것].sort((a, b) => a - b);
}

/** 오늘 «이미 지난» 시각 가운데 안 잰 것. 아직 오지 않은 시각은 빵꾸가 아니다. */
export function 빈시각(잰것, 지금시) {
  const 빈 = [];
  for (let h = 0; h <= 지금시; h += 1) if (!잰것.includes(h)) 빈.push(h);
  return 빈;
}

/* ── 사장님께 알릴 때인가 ─────────────────────────────────────────────────
   두 번 잇따라 막혔을 때만이다. 한 번은 그물이 흔들린 것일 수 있다. */
export function 알릴때인가(이번막힘, 지난막힘) {
  const 이번 = new Set(이번막힘);
  const 지난 = new Set(지난막힘 ?? []);
  return [...이번].filter((k) => 지난.has(k));
}

/* ── 한 자를 돌린다 ───────────────────────────────────────────────────── */
function 돌린다(자) {
  const r = spawnSync(process.execPath, [path.join(여기, 자)], {
    cwd: 뿌리, encoding: 'utf8', timeout: 180000,
  });
  const 글 = String(r.stdout ?? '') + String(r.stderr ?? '');
  return { 됐나: r.status === 0, 글, 끝줄: 글.trim().split('\n').filter(Boolean).slice(-1)[0] ?? '' };
}

async function 잰다() {
  const 이제 = new Date();
  const 오늘 = 날짜글(이제);
  const 지금시 = 이제.getHours();
  console.log('■ 결제 점검 (둘 다) — ' + 오늘 + ' ' + 시각글(이제));
  console.log('   ⭐ 재는 것은 「서버가 떠 있나」가 아니라 «손님이 살 수 있나»다\n');

  const 결과 = [];
  for (const p of 결제사들) {
    const r = 돌린다(p.자);
    결과.push({ ...p, ...r });
    /* 자식 자의 «판정 줄»만 뽑아 보인다 — 화면을 두 번 쏟지 않는다 */
    const 판정줄 = r.글.split('\n').filter((x) => /팔린다|매출0|줄었다|🔴/.test(x)).slice(-3);
    console.log('   ' + (r.됐나 ? '✅' : '🔴') + ' ' + p.이름);
    for (const l of 판정줄) console.log('      ' + l.trim());
    if (!r.됐나) console.log('      ⛔ 이 자가 1 로 끝났다 — 위 줄을 그대로 읽는다');
  }

  /* ── 마커 ──────────────────────────────────────────────────────────── */
  fs.mkdirSync(마커방, { recursive: true });
  const 이름 = 오늘 + '-' + String(지금시).padStart(2, '0') + '시-결제둘다.txt';
  const 파일들 = fs.readdirSync(마커방);
  const 빈칸 = {};
  for (const p of 결제사들) 빈칸[p.키] = 빈시각(잰시각(파일들, 오늘, p), 지금시 - 1);

  /* 지난 시각을 놓쳤나 — 조용히 넘어가지 않는다 */
  const 지난시 = 지금시 - 1;
  const 놓친것 = 지난시 >= 0
    ? 결제사들.filter((p) => 빈칸[p.키].includes(지난시)).map((p) => p.키) : [];

  const 줄 = [
    '결제 점검 (둘 다) — ' + 오늘 + ' ' + 시각글(이제),
    ...결과.map((r) => '  ' + r.이름 + ' : ' + (r.됐나 ? '팔린다' : '🔴 막혔다')),
    ...결제사들.map((p) => '  오늘 빠진 시각 [' + p.키 + '] : '
      + (빈칸[p.키].length ? 빈칸[p.키].join('·') + '시' : '없다')),
    놓친것.length ? '  ⚠ 지난 ' + 지난시 + '시를 놓쳤다 — ' + 놓친것.join('·') : '  지난 시각까지 이어졌다',
    '  ⛔ 승인(capture)은 부르지 않았다',
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(마커방, 이름), 줄);

  console.log('\n   오늘 빠진 시각');
  for (const p of 결제사들) {
    console.log('      ' + p.키 + ' : ' + (빈칸[p.키].length ? 빈칸[p.키].join('·') + '시' : '없다 ✅'));
  }
  console.log('   ✅ 마커 — docs/고정업무-마커/' + 이름);

  /* ── 두 번 잇따라 막혔으면 사장님께 ──────────────────────────────────── */
  const 이번막힘 = 결과.filter((r) => !r.됐나).map((r) => r.키);
  let 지난막힘 = [];
  try { 지난막힘 = JSON.parse(fs.readFileSync(지난판, 'utf8')).막힘 ?? []; } catch (e) { /* 첫 판 */ }
  fs.writeFileSync(지난판, JSON.stringify({ 때: 오늘 + ' ' + 시각글(이제), 막힘: 이번막힘 }));

  const 알릴것 = 알릴때인가(이번막힘, 지난막힘);
  if (알릴것.length) {
    console.log('\n   🔴🔴 ' + 알릴것.join('·') + ' 가 «두 번 잇따라» 막혔다 — 매출이 0 이다');
    console.log('   ⇒ 사장님께 알린다. 그리고 그 자리에서 진단·고침·배포한다(다음 시간으로 안 미룬다)');
    fs.writeFileSync(path.join(뿌리, 'docs', '결제-빨간불.txt'),
      오늘 + ' ' + 시각글(이제) + ' — ' + 알릴것.join('·') + ' 두 번 잇따라 막힘\n');
  } else if (이번막힘.length) {
    console.log('\n   ⚠ ' + 이번막힘.join('·') + ' 가 한 번 막혔다 — 다음 판에서 또 막히면 알린다');
  } else {
    try { fs.unlinkSync(path.join(뿌리, 'docs', '결제-빨간불.txt')); } catch (e) { /* 원래 없다 */ }
    console.log('\n   ✅ 둘 다 팔린다');
  }
  return 이번막힘.length ? 1 : 0;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
function 자가시험() {
  let 산 = 0; let 죽 = 0;
  const 재다 = (말, 참) => { if (참) { 산 += 1; } else { 죽 += 1; console.log('   ✕ ' + 말); } };

  /* 시각 — KST 를 UTC 로 밀어 쓰지 않는다 */
  const 새벽 = new Date(2026, 8, 20, 1, 5);
  재다('새벽 1시도 그날 날짜다 (toISOString 이면 전날이 된다)', 날짜글(새벽) === '2026-09-20');
  재다('시각글이 두 자리로 찍힌다', 시각글(새벽) === '01:05');

  /* 잰시각 — 옛 마커 두 꼴과 새 꼴을 다 센다 */
  const 파일들 = [
    '2026-09-20-09시-결제점검.txt',
    '2026-09-20-09시-서울마켓츠결제점검.txt',
    '2026-09-20-10시-결제점검.txt',
    '2026-09-20-11시-결제둘다.txt',
    '2026-09-19-23시-결제점검.txt',          // 어제 것은 안 센다
    '2026-09-20-메모.txt',                   // 마커가 아니다
  ];
  const 토스 = 결제사들[0]; const 페팔 = 결제사들[1];
  재다('토스: 옛 마커 + 함께 마커를 다 센다', JSON.stringify(잰시각(파일들, '2026-09-20', 토스)) === '[9,10,11]');
  재다('페이팔: 제 이름의 옛 마커 + 함께 마커', JSON.stringify(잰시각(파일들, '2026-09-20', 페팔)) === '[9,11]');
  재다('어제 마커는 오늘로 세지 않는다', !잰시각(파일들, '2026-09-20', 토스).includes(23));
  재다('마커가 아닌 파일은 안 센다', 잰시각(파일들, '2026-09-20', 토스).length === 3);

  /* 빈시각 — 아직 오지 않은 시각은 빵꾸가 아니다 */
  재다('11시에 9·10·11 을 쟀으면 0~8 이 빵꾸다',
    JSON.stringify(빈시각([9, 10, 11], 11)) === '[0,1,2,3,4,5,6,7,8]');
  재다('«앞으로 올» 시각을 빵꾸로 세지 않는다', !빈시각([9, 10, 11], 11).includes(12));
  재다('0시에 0시를 쟀으면 빵꾸가 없다', 빈시각([0], 0).length === 0);
  재다('아무것도 안 쟀으면 지금까지가 다 빵꾸다', 빈시각([], 3).length === 4);

  /* 알릴때 — 두 번 잇따라일 때만 */
  재다('처음 막힌 것은 안 알린다', 알릴때인가(['토스'], []).length === 0);
  재다('두 번 잇따라 막히면 알린다', 알릴때인가(['토스'], ['토스']).join() === '토스');
  재다('지난번에 다른 쪽이 막힌 것은 잇따름이 아니다', 알릴때인가(['토스'], ['페이팔']).length === 0);
  재다('둘 다 잇따라 막히면 둘 다 알린다',
    알릴때인가(['토스', '페이팔'], ['토스', '페이팔']).length === 2);
  재다('안 막혔으면 알릴 것이 없다', 알릴때인가([], ['토스']).length === 0);

  /* 짜임새 — 결제사를 늘릴 때 여기가 잡아 준다 */
  재다('결제사가 둘이고 둘 다 자를 가리킨다',
    결제사들.length === 2 && 결제사들.every((p) => fs.existsSync(path.join(여기, p.자))));
  재다('결제사 키가 겹치지 않는다', new Set(결제사들.map((p) => p.키)).size === 결제사들.length);

  console.log('   자가시험 ' + 산 + '개 통과' + (죽 ? ' · ' + 죽 + '개 실패' : ''));
  return 죽 === 0;
}

if (process.argv.includes('--자가시험')) {
  process.exit(자가시험() ? 0 : 1);
} else if (process.argv.includes('--빈시각만')) {
  const 이제 = new Date();
  const 파일들 = fs.existsSync(마커방) ? fs.readdirSync(마커방) : [];
  for (const p of 결제사들) {
    const 빈 = 빈시각(잰시각(파일들, 날짜글(이제), p), 이제.getHours() - 1);
    console.log(p.키 + ' 빠진 시각: ' + (빈.length ? 빈.join('·') + '시' : '없다 ✅'));
  }
} else {
  process.exit(await 잰다());
}
