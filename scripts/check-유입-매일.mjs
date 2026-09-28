#!/usr/bin/env node
/**
 * check-유입-매일.mjs — **검색엔진과 AI 에이전트가 오늘 고객을 얼마나 데려왔나.**
 *
 * ── 🔴 사장님 지시 (2026-09-29, 원문) ────────────────────────────────
 * 「우린 검색엔진들과 AI를 통해 들어오는 고객들이 제일 많아야 하지 않니? 그럼, 어떻게 하면
 *  **폭발적으로** 고객들이 검색과 ai 에이전트를 통해 늘어나게 할 수 있는 지를 엄청나게 깊고
 *  넓게 연구해서 반영해야지.. 여기에 사실 **우리 비즈니스의 성패가 달려있다**고 해도
 *  지나친 말이 아니지 않을까? 이걸 **못을박아서 매일** 제대로 검색엔진과 ai 에이전트가
 *  우리 고객을 얼마나 잘 데리고 오는 지를 **체크하고, 연구하고 또 실행해서 매일 매일
 *  고객이 늘어나게 해라**… **제일 중요한 작업이다**」
 * 「**이제까지 준 지침 중 가장 중요한 지침 중의 하나일거다**」
 *
 * ⭐ 사장님이 셋을 잇달아 말씀하셨다 — **체크하고 · 연구하고 · 실행**.
 *   그래서 이 자는 재기만 하지 않는다. **오늘 무엇을 할지까지 낸다.**
 *   ⛔ 재기만 하는 자는 지시의 절반이다.
 *
 * ── 🔴 2026-09-29 첫 실측이 알려 준 것 (이 자를 만든 까닭) ──────────
 * 28일 동안 네 사이트 합계 **노출 3,054 · 클릭 9**였다. 그런데 갈라 보니 —
 *
 *   ⛔ 「biggest korean companies」처럼 «사람이 많이 찾는» 질의   자리 56~77위
 *   ✅ 「kospi index constituents weights」처럼 «좁은» 질의        자리 1~3위
 *
 *   ⇒ **우리는 이길 수 있는 질의에서 이미 이기고 있다.** 못 이기는 것은 큰 질의다.
 *     그리고 `/group/tws` 한 지면이 1페이지 여섯 가운데 «다섯»을 먹었다 —
 *     지면 하나가 좁은 질의 여럿을 동시에 가져간다.
 *   ⭐ 그러니 처방은 「큰 질의를 쫓는 것」이 아니라
 *     **「이길 수 있는 좁은 질의를 훨씬 많이 만드는 것」**이다.
 *     이것은 회사 강령(「남이 안 센 것을 센다」)과 정확히 같은 방향이다.
 *
 * 쓰는 법
 *   node scripts/check-유입-매일.mjs             오늘 것을 재고 할 일을 낸다
 *   node scripts/check-유입-매일.mjs --받는다     GSC 를 새로 받아서 잰다(느리다)
 *   node scripts/check-유입-매일.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 우리가 재는 네 사이트 */
export const 사이트들 = [
  { 딱지: 'seoulmarkets', 이름: 'SeoulMarkets', 임자: '5번' },
  { 딱지: 'klifemap', 이름: 'KLifeMap', 임자: '2번' },
  { 딱지: 'kcw', 이름: 'K Culture Wire', 임자: '1번' },
  { 딱지: '100y', 이름: '백년지도', 임자: '1번' },
];

/**
 * 한 사이트의 GSC 자료에서 «판정에 쓸 수»를 뽑는다.
 * ⛔ 노출과 클릭만 보지 않는다 — «자리»가 처방을 가른다.
 *   자리가 50위 밖이면 제목을 고쳐도 소용없다. 아무도 5페이지를 안 본다.
 */
export function 재기(줄들) {
  const 것 = (줄들 ?? []).filter((r) => r && typeof r === 'object');
  const 노출 = 것.reduce((s, r) => s + (r.impressions || 0), 0);
  const 클릭 = 것.reduce((s, r) => s + (r.clicks || 0), 0);
  const 앞장 = 것.filter((r) => (r.position ?? 99) <= 10);
  const 첫자리 = 것.filter((r) => (r.position ?? 99) <= 3);
  const 뒷장 = 것.filter((r) => (r.position ?? 0) > 30);
  return {
    줄: 것.length,
    노출, 클릭,
    클릭률: 노출 ? Math.round((클릭 / 노출) * 1000) / 10 : null,   /* ⛔ 0 으로 나누지 않는다 */
    앞장: 앞장.length, 앞장노출: 앞장.reduce((s, r) => s + (r.impressions || 0), 0),
    첫자리: 첫자리.length,
    뒷장: 뒷장.length,
    /* ⭐ 이길 수 있는 질의의 «몫» — 이 수가 늘어야 유입이 는다 */
    이기는몫: 것.length ? Math.round((앞장.length / 것.length) * 100) : null,
  };
}

/**
 * 잰 것을 보고 **오늘 무엇을 할지**를 낸다.
 * ⛔ 「노출이 적다」로 끝내지 않는다 — 그것은 사실이지 할 일이 아니다.
 */
export function 할일내기(딱지, 잰것, 색인 = null) {
  const 것 = [];
  if (!잰것 || !잰것.줄) {
    것.push({ 무게: 1, 말: `${딱지} — 검색에 «한 줄도» 안 뜬다. 색인부터 본다(check-색인-왜안되나.mjs)` });
    return 것;
  }
  if (잰것.첫자리 > 0) {
    것.push({
      무게: 2,
      말: `${딱지} — 이미 «1~3위»인 질의가 ${잰것.첫자리}개다. `
        + '그 지면과 «같은 꼴»의 지면을 더 낸다 — 이기는 자리를 넓히는 것이 가장 싸다',
    });
  }
  if (잰것.뒷장 > 잰것.앞장 * 3 && 잰것.뒷장 > 10) {
    것.push({
      무게: 3,
      말: `${딱지} — 30위 밖이 ${잰것.뒷장}개로 앞장(${잰것.앞장})의 세 배가 넘는다. `
        + '⛔ 큰 질의를 쫓지 않는다. 그 자리에서는 제목을 고쳐도 아무도 안 본다',
    });
  }
  if (잰것.앞장노출 > 0 && 잰것.클릭 === 0) {
    것.push({
      무게: 2,
      말: `${딱지} — 1페이지에 ${잰것.앞장}개가 떴는데 클릭이 0이다. `
        + '그 지면의 제목·설명을 손님 말로 고친다 (여기서는 제목이 실제로 먹힌다)',
    });
  }
  if (색인 && 색인.안왔다 > 0) {
    것.push({
      무게: 1,
      말: `${딱지} — 구글이 «한 번도 안 온» 지면이 ${색인.안왔다}장이다. `
        + '안쪽에서 그 지면으로 가는 링크를 만든다. 사이트맵만으로는 안 온다',
    });
  }
  return 것.sort((a, b) => a.무게 - b.무게);
}

/** 어제와 견준다. ⛔ 어제 것이 없으면 «없다»고 하지 0 과 견주지 않는다 */
export function 견주기(오늘, 어제) {
  if (!어제) return null;
  const 차 = (a, b) => (Number.isFinite(a) && Number.isFinite(b) ? a - b : null);
  return { 노출: 차(오늘.노출, 어제.노출), 클릭: 차(오늘.클릭, 어제.클릭), 앞장: 차(오늘.앞장, 어제.앞장) };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참, 덧 = '') => 것.push({ 이름, 참: !!참, 덧 });

  const 줄 = [
    { impressions: 10, clicks: 0, position: 60 },
    { impressions: 2, clicks: 0, position: 1 },
    { impressions: 3, clicks: 1, position: 8 },
    { impressions: 5, clicks: 0, position: 45 },
  ];
  const r = 재기(줄);
  본다('노출·클릭을 더한다', r.노출 === 20 && r.클릭 === 1);
  본다('🔴 1페이지(10위 안)를 따로 센다', r.앞장 === 2 && r.앞장노출 === 5);
  본다('🔴 1~3위를 따로 센다 — 여기가 우리가 «이미 이긴» 자리다', r.첫자리 === 1);
  본다('🔴 30위 밖을 따로 센다 — 여기는 제목을 고쳐도 소용없다', r.뒷장 === 2);
  본다('클릭률을 낸다', r.클릭률 === 5);
  본다('⛔ 노출이 0이면 클릭률을 0 으로 적지 않는다 — null 이다', 재기([]).클릭률 === null);
  본다('⛔ 빈 것에 안 터진다', 재기(null).줄 === 0 && 재기(undefined).노출 === 0);

  const 할일 = 할일내기('시험', r);
  본다('🔴 이미 이긴 자리가 있으면 «넓히라»고 낸다',
    할일.some((x) => /같은 꼴|넓히는/.test(x.말)));
  본다('🔴 뒷장이 많으면 «큰 질의를 쫓지 말라»고 낸다',
    할일내기('시험', { 줄: 50, 노출: 100, 클릭: 0, 앞장: 2, 앞장노출: 3, 첫자리: 0, 뒷장: 40 })
      .some((x) => /큰 질의를 쫓지 않는다/.test(x.말)));
  /* ⚠ 위 시험 자료는 클릭이 1이라 이 갈래에 안 걸린다 — 클릭 0 인 것을 따로 만든다 */
  본다('🔴 1페이지인데 클릭 0 이면 제목을 고치라고 낸다',
    할일내기('시험', { 줄: 4, 노출: 20, 클릭: 0, 앞장: 2, 앞장노출: 5, 첫자리: 1, 뒷장: 2 })
      .some((x) => /제목·설명을 손님 말로/.test(x.말)));
  본다('⛔ 클릭이 있으면 제목을 고치라고 하지 않는다 — 헛말을 내지 않는다',
    !할일.some((x) => /제목·설명을 손님 말로/.test(x.말)));
  본다('🔴 검색에 한 줄도 안 뜨면 색인부터 보라고 낸다',
    할일내기('시험', { 줄: 0 }).some((x) => /색인부터 본다/.test(x.말)));
  본다('⛔ 재기만 하지 않는다 — 할 일이 «반드시» 하나는 나온다', 할일.length > 0);

  본다('⛔ 어제 것이 없으면 0 과 견주지 않는다', 견주기(r, null) === null);
  본다('어제와 견준다', 견주기({ 노출: 10, 클릭: 2, 앞장: 3 }, { 노출: 6, 클릭: 1, 앞장: 1 }).노출 === 4);

  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ check-유입-매일 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}${x.덧 ? `  (${x.덧})` : ''}`);
  return 빨강.length === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  if (process.argv.includes('--받는다')) {
    console.log('■ GSC 를 새로 받는다 (느리다)');
    try { execFileSync('node', [path.join(뿌리, 'scripts/fetch-gsc.mjs'), '--모두'], { cwd: 뿌리, stdio: 'inherit' }); }
    catch (e) { console.log('   ⚠ 받다가 걸렸다 — 있는 자료로 잰다'); }
  }

  const 오늘 = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  console.log(`■ 검색·AI 유입 — ${오늘}`);
  console.log('  🔴 사장님: 「여기에 우리 비즈니스의 성패가 달려있다」\n');

  const 잰것전부 = {};
  const 할일전부 = [];
  for (const s of 사이트들) {
    /* query+page 자료가 가장 많이 말해 준다 — 어느 물음에 어느 지면이 몇 위인가 */
    const 것들 = fs.existsSync(path.join(뿌리, 'src/data'))
      ? fs.readdirSync(path.join(뿌리, 'src/data')).filter((f) => f.startsWith(`gsc-${s.딱지}-qp-`)).sort()
      : [];
    if (!것들.length) {
      console.log(`  ⬜ ${s.이름.padEnd(16)} 잴 자료가 없다 — fetch-gsc.mjs --사이트 ${s.딱지}`);
      continue;
    }
    let 줄들 = [];
    try { 줄들 = (JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data', 것들.at(-1)), 'utf8')).rows) || []; }
    catch (e) { console.log(`  🔴 ${s.이름} 자료를 못 읽었다`); continue; }

    const r = 재기(줄들);
    잰것전부[s.딱지] = r;
    const 표 = r.첫자리 > 0 ? '✅' : (r.노출 > 0 ? '⚠' : '🔴');
    console.log(`  ${표} ${s.이름.padEnd(16)} [${s.임자}] 노출 ${String(r.노출).padStart(5)} · 클릭 ${String(r.클릭).padStart(3)}`
      + ` · 1페이지 ${String(r.앞장).padStart(3)} · 1~3위 ${String(r.첫자리).padStart(3)} · 30위밖 ${String(r.뒷장).padStart(3)}`);
    for (const h of 할일내기(s.이름, r)) 할일전부.push(h);
  }

  /**
   * 🔴 GA4 — 사장님 (2026-09-29): 「매일 GA4도 챙기면서 문제점을 찾고 해결도 해」
   *
   * ⛔ GA4 의 «방문자 수»를 그대로 읽지 않는다. 2026-09-29 에 재 보니
   *   klifemap 방문자 974명 가운데 **929명(95%)이 Direct·Unassigned** 였다 —
   *   대부분 우리 자신이 감수하며 들어간 것이다. 진짜 손님은 45명이었다.
   *   ⇒ 「하루 104명」이라고 보고하면 그것은 거짓이 된다.
   * ✅ 우리 트래픽을 걷어낸 수를 함께 낸다. 두 수를 나란히 보아야 사실이 된다.
   */
  console.log('\n■ GA4 — 실제로 들어온 사람 (사장님: 「매일 GA4도 챙기면서 문제점을 찾고 해결도 해」)');
  try {
    const 글 = execFileSync('node', [path.join(뿌리, 'scripts/ga4-klifemap-channels.mjs')],
      { cwd: 뿌리, encoding: 'utf8', timeout: 180_000 });
    const 섞임 = (글.match(/우리 트래픽이 섞이는 칸[^\d]*(\d[\d,]*)명/) || [])[1];
    const 나머지 = (글.match(/그것을 뺀 나머지[^\d]*(\d[\d,]*)명/) || [])[1];
    const 구글 = (글.match(/google \/ organic\s+(\d+)명/) || [])[1];
    if (섞임 && 나머지) {
      const 진짜 = Number(String(나머지).replace(/,/g, ''));
      console.log(`  KLifeMap 28일 — 우리 트래픽 ${섞임}명 · 걷어낸 «진짜 손님» ${나머지}명`
        + `${구글 ? ` · 그 가운데 구글에서 온 사람 ${구글}명` : ''}`);
      if (진짜 < 100) {
        할일전부.push({
          무게: 1,
          말: `KLifeMap — 우리 트래픽을 걷어내면 28일에 ${나머지}명뿐이다(하루 ${(진짜 / 28).toFixed(1)}명). `
            + '검색에서 오는 길이 막혀 있다 — 색인부터 뚫는다',
        });
      }
    } else {
      console.log('  ⚠ GA4 를 못 읽었다 — 수를 지어내지 않는다');
    }
  } catch (e) {
    console.log(`  ⚠ GA4 를 못 받았다 (${String(e.message).slice(0, 50)}) — 「못 쟀다」로 둔다`);
  }

  console.log('\n■ 오늘 할 일 — ⛔ 재기만 하는 자는 지시의 절반이다');
  const 본것 = new Set();
  for (const h of 할일전부.sort((a, b) => a.무게 - b.무게)) {
    if (본것.has(h.말)) continue;
    본것.add(h.말);
    console.log(`  ${'🔴🟡⬜'[Math.min(h.무게 - 1, 2)]} ${h.말}`);
  }

  console.log('\n⭐ 큰 방향 (2026-09-29 실측에서 나온 것)');
  console.log('   ✅ 좁고 구체적인 질의에서는 이미 1~3위다 — 그런 지면을 «많이» 낸다');
  console.log('   ⛔ 「biggest korean companies」류 큰 질의는 56~77위다. 쫓지 않는다');
  console.log('   ⭐ 한 지면이 좁은 질의 여럿을 동시에 먹는다(/group/tws 가 다섯) — 지면 하나를 깊게');

  /* 오늘 잰 것을 남긴다 — 어제와 견주려면 쌓여 있어야 한다 */
  const 낼곳 = path.join(뿌리, 'archive', 'raw', 'inflow-daily');
  fs.mkdirSync(낼곳, { recursive: true });
  fs.writeFileSync(path.join(낼곳, `${오늘}.json`),
    JSON.stringify({ 날: 오늘, 잰때: new Date().toLocaleString('ko-KR'), 사이트: 잰것전부 }, null, 1));
  console.log(`\n   적었다 — archive/raw/inflow-daily/${오늘}.json`);
}
