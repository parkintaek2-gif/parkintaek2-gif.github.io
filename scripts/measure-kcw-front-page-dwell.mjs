#!/usr/bin/env node
/**
 * measure-kcw-front-page-dwell.mjs — **한 글이 첫 화면에 며칠 남나. 방마다 견준다.**
 *
 *   node scripts/measure-kcw-front-page-dwell.mjs            재서 src/data 에 낸다
 *   node scripts/measure-kcw-front-page-dwell.mjs --자가시험
 *
 * ── ⭐ 왜 이 축인가 (2026-09-11 04:3x · 5번) ──────────────────────
 *
 * 우리는 한국 커뮤니티와 영어권 K컬처 방의 첫 화면을 «매일 한 번» 받아 쌓는다
 * (`archive/raw/community-desk`, 소급 불가). 여드레가 쌓였다.
 * 그 자료로 아무도 안 세는 것을 셀 수 있다 — **같은 글 주소가 며칠 동안 첫 화면에 있나.**
 *
 * ⭐ 이 수는 우리 사업에 바로 걸린다. 영어로 K컬처를 내는 쪽에서 「한 편이 며칠 사나」는
 *   글을 몇 편 만들지, 어디에 걸지를 정하는 수다. 그런데 재 놓은 곳이 없다.
 *
 * ── 🔴 이 자가 «못 재는» 것 — 먼저 적는다 ────────────────────────
 *
 * 🔴 **하루 한 번만 본다.** 아침에 올라 저녁 전에 사라진 글은 «안 보인다».
 *   ⇒ 그래서 「하루」는 우리 자의 «해상도»이지 그 글이 실제로 산 시간이 아니다.
 *   ⛔ 「한국 커뮤니티 글은 하루 산다」로 쓰지 않는다. 「이틀째에 남은 것이 0.2%」로 쓴다.
 *
 * 🔴 **캡처 시각이 고르지 않으면 못 견준다.** 09-03~09-10 은 다 저녁 8시대인데
 *   09-11 은 새벽 3시대다(내가 매시 소통에서 받았다). 그 사이는 24시간이 아니라 7시간이다.
 *   ⇒ `고른날고르기()` 가 시각이 고른 날만 골라 낸다. 안 고르면 그 구간을 «뺀다».
 *
 * 🔴 **첫 화면을 짓는 방식이 방마다 다르다.** 인벤·루리웹의 「베스트」와 레딧의 「hot」은
 *   다른 규칙으로 돈다. ⇒ 이 차이를 «독자 행동»으로만 읽지 않는다. 지면에도 그렇게 적는다.
 *
 * ⛔ 뉴스 피드(구글뉴스)를 커뮤니티와 한 표에 섞지 않는다 — 갈래로 갈라 낸다.
 * ⛔ 글이 한 편인 우물(구글트렌드는 주소가 하나다)은 비율을 내지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 밑감방 = path.join(뿌리, 'archive/raw/community-desk');
export const 낼곳 = path.join(뿌리, 'src/data/kcw-front-page-dwell.json');

/** 이보다 적은 글로는 그 우물의 비율을 내지 않는다 */
export const 적어도글 = 30;
/** 캡처 시각이 이 시간 넘게 벌어지면 «고르지 않다»고 본다 */
export const 고른시각차 = 6;

/** 「2026. 9. 3. 오후 8:50:04」에서 시(hour)를 뽑는다. ⛔ 못 읽으면 null */
export function 잰시각(글) {
  const s = String(글 ?? '');
  const m = s.match(/(오전|오후)\s*(\d{1,2}):/);
  if (!m) return null;
  let h = Number(m[2]);
  if (m[1] === '오후' && h !== 12) h += 12;
  if (m[1] === '오전' && h === 12) h = 0;
  return h >= 0 && h <= 23 ? h : null;
}

/**
 * 캡처 시각이 «고른» 날만 고른다.
 * 🔴 이것이 이 자의 핵이다. 하루 한 번 보는 자료로 「며칠 남았나」를 세려면
 *   두 캡처 사이가 하루여야 한다. 저녁 8시와 새벽 3시 사이는 7시간이다.
 * ⇒ 가장 흔한 시(hour)를 잡고, 그것과 크게 다른 날을 «뺀다». 뺀 날을 함께 낸다.
 */
export function 고른날고르기(날들, { 차 = 고른시각차 } = {}) {
  const 있는것 = (날들 ?? []).filter((d) => Number.isFinite(d?.시));
  if (!있는것.length) return { 쓸날: [], 뺀날: [], 기준시: null };
  const 셈 = new Map();
  for (const d of 있는것) 셈.set(d.시, (셈.get(d.시) || 0) + 1);
  const 기준시 = [...셈.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  const 쓸날 = []; const 뺀날 = [];
  for (const d of 날들 ?? []) {
    if (Number.isFinite(d?.시) && Math.abs(d.시 - 기준시) <= 차) 쓸날.push(d);
    else 뺀날.push({ 날: d?.날 ?? null, 시: d?.시 ?? null });
  }
  return { 쓸날, 뺀날, 기준시 };
}

/** 날들이 잇달아 있나 — 끊긴 자리를 낸다. ⛔ 「끊겼다」를 숨기지 않는다 */
export function 끊긴자리(날문자들) {
  const 것들 = [...new Set(날문자들 ?? [])].sort();
  const 끊김 = [];
  for (let i = 1; i < 것들.length; i += 1) {
    const a = new Date(`${것들[i - 1]}T00:00:00`);
    const b = new Date(`${것들[i]}T00:00:00`);
    const 며칠 = Math.round((b - a) / 86400000);
    if (며칠 !== 1) 끊김.push({ 앞: 것들[i - 1], 뒤: 것들[i], 벌어짐: 며칠 });
  }
  return 끊김;
}

export function 재기(날들) {
  const { 쓸날, 뺀날, 기준시 } = 고른날고르기(날들);
  const 본날 = new Map();
  for (const d of 쓸날) {
    for (const x of d.것들 ?? []) {
      const k = String(x?.길 ?? '');
      if (!k) continue;
      if (!본날.has(k)) 본날.set(k, { 곳: String(x.곳 ?? '(빈칸)'), 갈래: String(x.갈래 ?? '(빈칸)'), 날들: new Set() });
      본날.get(k).날들.add(d.날);
    }
  }
  const 우물별 = new Map();
  for (const v of 본날.values()) {
    const o = 우물별.get(v.곳) ?? { 곳: v.곳, 갈래: v.갈래, 글: 0, 이틀이상: 0, 날합: 0, 최장: 0 };
    o.글 += 1;
    o.날합 += v.날들.size;
    if (v.날들.size > 1) o.이틀이상 += 1;
    if (v.날들.size > o.최장) o.최장 = v.날들.size;
    우물별.set(v.곳, o);
  }
  const 우물들 = [...우물별.values()].map((o) => ({
    ...o,
    넉넉: o.글 >= 적어도글,
    /* ⛔ 글이 적으면 비율을 내지 않는다 — null 이 0 이 아니다 */
    이틀이상몫: o.글 >= 적어도글 ? o.이틀이상 / o.글 : null,
    평균본날: o.글 > 0 ? o.날합 / o.글 : null,
  })).sort((a, b) => b.글 - a.글);
  /* 갈래로 묶어 낸다 — ⛔ 뉴스 피드와 커뮤니티를 한 줄에 섞지 않는다 */
  const 갈래별 = {};
  for (const o of 우물들) {
    if (!o.넉넉) continue;
    const g = 갈래별[o.갈래] ?? { 갈래: o.갈래, 우물수: 0, 글: 0, 이틀이상: 0 };
    g.우물수 += 1; g.글 += o.글; g.이틀이상 += o.이틀이상;
    갈래별[o.갈래] = g;
  }
  for (const g of Object.values(갈래별)) g.이틀이상몫 = g.글 > 0 ? g.이틀이상 / g.글 : null;
  return {
    쓴날수: 쓸날.length,
    쓴날들: 쓸날.map((d) => d.날),
    뺀날,
    기준시,
    끊김: 끊긴자리(쓸날.map((d) => d.날)),
    주소종류: 본날.size,
    우물들,
    갈래별,
  };
}

export function 자가시험() {
  const 날 = (날짜, 시, 것들) => ({ 날: 날짜, 시, 것들 });
  const 글 = (길, 곳, 갈래 = '커뮤니티') => ({ 길, 곳, 갈래 });
  const 많이 = (곳, 몇, 앞 = 'a') => Array.from({ length: 몇 }, (_, i) => 글(앞 + i, 곳));
  const 목 = [
    ['잰시각이 오후를 24시로 읽는다', () => 잰시각('2026. 9. 3. 오후 8:50:04') === 20],
    ['잰시각이 오전을 그대로 읽는다', () => 잰시각('2026. 9. 11. 오전 3:24:40') === 3],
    ['오후 12시는 12, 오전 12시는 0', () =>
      잰시각('x 오후 12:00:00') === 12 && 잰시각('x 오전 12:00:00') === 0],
    ['⛔ 못 읽으면 null', () => 잰시각('') === null && 잰시각(null) === null && 잰시각('2026-09-03') === null],
    ['🔴 시각이 크게 다른 날을 뺀다 — 저녁 8시와 새벽 3시 사이는 하루가 아니다', () => {
      const r = 고른날고르기([날('a', 20, []), 날('b', 20, []), 날('c', 3, [])]);
      return r.쓸날.length === 2 && r.뺀날.length === 1 && r.뺀날[0].날 === 'c' && r.기준시 === 20;
    }],
    ['⛔ 시각을 못 읽은 날도 뺀다', () => {
      const r = 고른날고르기([날('a', 20, []), 날('b', 20, []), 날('c', null, [])]);
      return r.뺀날.length === 1;
    }],
    ['⛔ 빈 것도 견딘다', () => {
      const r = 고른날고르기([]);
      return r.쓸날.length === 0 && r.기준시 === null;
    }],
    ['끊긴자리가 빠진 날을 짚는다', () => {
      const r = 끊긴자리(['2026-09-03', '2026-09-04', '2026-09-06']);
      return r.length === 1 && r[0].벌어짐 === 2 && r[0].앞 === '2026-09-04';
    }],
    ['잇달아 있으면 끊김 0', () => 끊긴자리(['2026-09-03', '2026-09-04']).length === 0],
    ['같은 주소가 두 날에 보이면 이틀 이상으로 센다', () => {
      const 것 = [...많이('인벤', 30)];
      const r = 재기([날('2026-09-03', 20, 것), 날('2026-09-04', 20, 것)]);
      const o = r.우물들.find((x) => x.곳 === '인벤');
      return o.글 === 30 && o.이틀이상 === 30 && o.이틀이상몫 === 1 && o.평균본날 === 2;
    }],
    ['다른 주소면 하루짜리다', () => {
      const r = 재기([날('2026-09-03', 20, 많이('인벤', 30, 'x')), 날('2026-09-04', 20, 많이('인벤', 30, 'y'))]);
      const o = r.우물들.find((x) => x.곳 === '인벤');
      return o.글 === 60 && o.이틀이상 === 0 && o.이틀이상몫 === 0;
    }],
    ['🔴 글이 서른보다 적은 우물은 비율을 내지 않는다 — 구글트렌드는 주소가 하나다', () => {
      const r = 재기([날('2026-09-03', 20, [글('t', '구글트렌드 KR', '검색')])]);
      const o = r.우물들.find((x) => x.곳 === '구글트렌드 KR');
      return o.넉넉 === false && o.이틀이상몫 === null && o.글 === 1;
    }],
    ['⛔ 갈래를 섞지 않는다 — 뉴스와 커뮤니티가 다른 줄로 나온다', () => {
      const r = 재기([날('2026-09-03', 20, [...많이('인벤', 30, 'k'), ...많이('구글뉴스', 30, 'n').map((x) => ({ ...x, 곳: '구글뉴스', 갈래: '뉴스' }))])]);
      return Object.keys(r.갈래별).length === 2 && r.갈래별['커뮤니티'].글 === 30 && r.갈래별['뉴스'].글 === 30;
    }],
    ['⛔ 넉넉하지 않은 우물은 갈래 합에도 안 넣는다 — 비율을 못 내는 것을 합에 섞지 않는다', () => {
      const r = 재기([날('2026-09-03', 20, [...많이('인벤', 30, 'k'), 글('one', '작은곳')])]);
      return r.갈래별['커뮤니티'].글 === 30 && r.갈래별['커뮤니티'].우물수 === 1;
    }],
    ['⛔ 주소가 없는 줄은 세지 않는다', () => {
      const r = 재기([날('2026-09-03', 20, [{ 길: '', 곳: '인벤', 갈래: '커뮤니티' }])]);
      return r.주소종류 === 0;
    }],
    ['뺀 날은 셈에 안 들어간다', () => {
      const r = 재기([날('2026-09-03', 20, 많이('인벤', 30, 'x')), 날('2026-09-11', 3, 많이('인벤', 30, 'x'))]);
      const o = r.우물들.find((x) => x.곳 === '인벤');
      return r.쓴날수 === 1 && o.이틀이상 === 0 && r.뺀날.length === 1;
    }],
  ];
  let 통 = 0; const 실 = [];
  for (const [이름, 재본다] of 목) {
    let ok = false;
    try { ok = !!재본다(); } catch { ok = false; }
    if (ok) 통 += 1; else 실.push(이름);
  }
  console.log(`첫 화면 머무름 검사 — 자가시험 ${통}/${목.length}`);
  실.forEach((x) => console.log(`   X ${x}`));
  return 실.length;
}

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나) {
  const 흠 = 자가시험();
  if (process.argv.includes('--자가시험')) process.exit(흠 ? 1 : 0);
  if (흠) { console.log('🔴 자가시험이 깨졌다 — 값을 내지 않는다'); process.exit(1); }

  if (!fs.existsSync(밑감방)) {
    console.log(`⬜ 못 쟀다 — 밑감방이 없다: ${path.relative(뿌리, 밑감방)}`);
    process.exit(0);
  }
  const 파일들 = fs.readdirSync(밑감방).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  const 날들 = 파일들.map((f) => {
    const d = JSON.parse(fs.readFileSync(path.join(밑감방, f), 'utf8'));
    return { 날: f.slice(0, 10), 시: 잰시각(d.잰때), 것들: d.담은것 ?? [] };
  });
  const r = 재기(날들);
  const 퍼 = (v, 자리 = 1) => (v == null ? '—' : `${(v * 100).toFixed(자리)}%`);

  console.log('');
  console.log(`■ 캡처 ${파일들.length}일 가운데 시각이 고른 ${r.쓴날수}일을 쓴다`
    + ` (기준 ${r.기준시}시대)`);
  if (r.뺀날.length) {
    console.log(`   ⛔ 뺀 날 ${r.뺀날.length}일 — ${r.뺀날.map((x) => `${x.날}(${x.시}시)`).join(' · ')}`);
    console.log('     까닭: 캡처 사이가 하루가 아니면 「며칠 남았나」를 셀 수 없다');
  }
  if (r.끊김.length) console.log(`   ⚠ 쓴 날 사이에 끊긴 자리 ${r.끊김.length}군데`);
  console.log(`■ 본 주소 ${r.주소종류.toLocaleString('en-US')}가지`);
  console.log('');
  console.log('■ 우물마다 — 같은 주소가 이튿날에도 첫 화면에 있었나');
  for (const o of r.우물들) {
    console.log(`   ${o.곳.padEnd(26)} ${o.갈래.padEnd(5)} 글 ${String(o.글).padStart(4)}`
      + ` · 이틀 이상 ${String(o.이틀이상).padStart(3)} (${o.넉넉 ? 퍼(o.이틀이상몫, 1) : '— 글이 적다'})`
      + ` · 평균 ${o.평균본날?.toFixed(2) ?? '—'}일 · 최장 ${o.최장}일`);
  }
  console.log('');
  console.log('■ 갈래로 묶으면 (글 서른 이상인 우물만)');
  for (const g of Object.values(r.갈래별)) {
    console.log(`   ${g.갈래.padEnd(6)} 우물 ${g.우물수} · 글 ${String(g.글).padStart(4)}`
      + ` · 이틀 이상 ${String(g.이틀이상).padStart(3)} (${퍼(g.이틀이상몫, 1)})`);
  }
  console.log('');
  console.log('⛔ 하루 한 번만 본다 — 아침에 올라 저녁 전에 사라진 글은 안 보인다.');
  console.log('   그래서 「하루」는 이 자의 «해상도»이지 그 글이 산 시간이 아니다.');
  console.log('⛔ 첫 화면을 짓는 규칙이 방마다 다르다 — 이 차이를 독자 행동으로만 읽지 않는다.');

  fs.writeFileSync(낼곳, `${JSON.stringify({
    잰때: new Date().toISOString(),
    밑감: 'archive/raw/community-desk/<날짜>.json',
    무엇을세나: '하루 한 번 받은 첫 화면 목록에서, 같은 글 주소가 며칠 동안 보이나. 우물마다 견준다.',
    해상도: '하루 한 번만 본다. 하루 안에 올라와 사라진 글은 보이지 않으므로 「하루」는 자의 해상도다.',
    ...r,
  }, null, 2)}\n`, 'utf8');
  console.log(`\n  ✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
}
