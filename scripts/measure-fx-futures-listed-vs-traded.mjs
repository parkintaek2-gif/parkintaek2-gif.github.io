#!/usr/bin/env node
/**
 * measure-fx-futures-listed-vs-traded.mjs — **한국이 상장한 통화선물 가운데 몇이 도나.**
 *
 *   node scripts/measure-fx-futures-listed-vs-traded.mjs            재서 src/data 에 낸다
 *   node scripts/measure-fx-futures-listed-vs-traded.mjs --자가시험   자가시험만
 *
 * ── 🔴 왜 만들었나 (2026-09-11 03:0x · 5번) ────────────────────────
 *
 * 오늘 밤 갈래 얇음을 좇다가 **안 돌던 수집기를 셋** 찾았다. 이것이 셋째다 —
 *   `archive/raw/derivatives` 폴더가 «없었다».
 *   승인 목록에는 「파생상품시세정보 · fx·선물 · 승인 · 5,447,155건」으로 떠 있었고,
 *   수집기 머리글에는 이 API 주소를 찾는 데 «몇 주»가 걸렸다는 기록까지 있었다.
 *   ⇒ 그 몇 주가 자료로 남지 않았다. 「찾았다」와 「받고 있다」는 다른 것이다.
 *
 * ── ⭐ 남들이 안 세는 축 ────────────────────────────────────────
 *
 * 환율 «값»은 어디서나 말한다. 그런데 **한국이 통화선물을 몇 개 상장해 두고
 * 그중 몇 개가 실제로 거래되는지**는 아무도 세지 않는다.
 * 우리 자료에는 거래량 0 인 종목이 그대로 들어 있다 — 그 0 이 이 셈의 재료다.
 *
 * ⛔ 이 자가 지키는 것
 *   · **거래량 0 행을 지우지 않는다.** 「상장은 됐고 안 돈다」가 우리가 세는 것이다
 *   · 「종목 수」가 아니라 «종목-날 수»(상장행)로 센다 — 만기가 굴러가며 종목이 바뀐다.
 *     ⛔ 여러 날을 합쳐 「종목 N개」라고 말하지 않는다
 *   · 통화 이름은 자료의 «분류» 글에서 벗겨 낸다. ⛔ 종목명에서 짐작하지 않는다
 *   · 미결제약정을 거래량과 «따로» 낸다. 안 돈 날에도 남아 있는 자리가 있다
 *   · 창이 짧다(거래일 몇 개). 「한국 통화선물은 늘 이렇다」로 넓히지 않는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 밑감방 = path.join(뿌리, 'archive/raw/derivatives');
export const 낼곳 = path.join(뿌리, 'src/data/fx-futures-listed-vs-traded.json');

/** 이보다 적은 거래일로는 값을 내지 않는다 */
export const 적어도날 = 3;

/**
 * 「파생 플렉스선물 미국달러」·「파생 선물 엔」·「파생 선물 미국달러 (주간)」에서
 * 통화와 «갈래»(보통/플렉스/주간)를 벗겨 낸다.
 * ⛔ 모르는 꼴은 통화를 null 로 둔다 — 지어내지 않는다.
 */
export function 분류벗기기(글) {
  const s = String(글 ?? '').trim();
  if (!s) return { 통화: null, 플렉스: false, 주간: false };
  const 플렉스 = s.includes('플렉스');
  const 주간 = s.includes('(주간)');
  const 통화 = s
    .replace('파생 플렉스선물 ', '')
    .replace('파생 선물 ', '')
    .replace(' (주간)', '')
    .trim();
  return { 통화: 통화 || null, 플렉스, 주간 };
}

/** 수로 읽는다. ⛔ 못 읽으면 null — 0 으로 만들지 않는다(0 은 「안 돌았다」는 뜻이 있다) */
export function 수읽기(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function 재기(날파일들) {
  const 날별 = [];
  const 통화별 = new Map();
  let 플렉스행 = 0; let 플렉스거래행 = 0; let 통화모름행 = 0;
  for (const { 날, 줄들 } of 날파일들 ?? []) {
    const fx = (줄들 ?? []).filter((r) => r && r.축 === 'fx');
    if (!fx.length) continue;
    let 거래행 = 0; let 거래량합 = 0;
    for (const r of fx) {
      const { 통화, 플렉스 } = 분류벗기기(r.분류);
      const 량 = 수읽기(r.거래량);
      const 돌았나 = 량 != null && 량 > 0;
      if (돌았나) { 거래행 += 1; 거래량합 += 량; }
      if (플렉스) { 플렉스행 += 1; if (돌았나) 플렉스거래행 += 1; }
      if (!통화) { 통화모름행 += 1; continue; }
      const o = 통화별.get(통화) ?? { 통화, 상장행: 0, 거래행: 0, 거래량: 0, 미결제: 0, 플렉스행: 0 };
      o.상장행 += 1;
      if (플렉스) o.플렉스행 += 1;
      if (돌았나) { o.거래행 += 1; o.거래량 += 량; }
      const 미 = 수읽기(r.미결제약정);
      if (미 != null) o.미결제 += 미;
      통화별.set(통화, o);
    }
    날별.push({ 날: String(날), 상장행: fx.length, 거래행, 거래량: 거래량합 });
  }
  날별.sort((a, b) => a.날.localeCompare(b.날));
  const 상장행합 = 날별.reduce((a, d) => a + d.상장행, 0);
  const 거래행합 = 날별.reduce((a, d) => a + d.거래행, 0);
  const 거래량합 = 날별.reduce((a, d) => a + d.거래량, 0);
  const 통화들 = [...통화별.values()].sort((a, b) => b.거래량 - a.거래량);
  /* ⛔ 밑이 0 이면 «비율을 내지 않는다» */
  const 으뜸몫 = 거래량합 > 0 && 통화들.length ? 통화들[0].거래량 / 거래량합 : null;
  return {
    날수: 날별.length,
    넉넉: 날별.length >= 적어도날,
    상장행합,
    거래행합,
    거래량합,
    /* ⛔ 「종목 N개」가 아니라 «종목-날» 수다. 만기가 굴러가며 종목이 바뀐다 */
    센단위: '종목-날(상장행)',
    돈비율: 상장행합 > 0 ? 거래행합 / 상장행합 : null,
    플렉스행,
    플렉스거래행,
    통화모름행,
    으뜸통화: 통화들.length ? 통화들[0].통화 : null,
    으뜸몫,
    통화들,
    날별,
  };
}

export function 자가시험() {
  const 줄 = (분류, 거래량, 미결제 = 0) => ({ 축: 'fx', 분류, 거래량, 미결제약정: 미결제 });
  const 목 = [
    ['분류에서 통화를 벗긴다', () => 분류벗기기('파생 선물 엔').통화 === '엔'],
    ['플렉스를 가른다', () => 분류벗기기('파생 플렉스선물 미국달러').플렉스 === true
      && 분류벗기기('파생 플렉스선물 미국달러').통화 === '미국달러'],
    ['주간물을 가르되 통화는 같게 본다', () => {
      const a = 분류벗기기('파생 선물 미국달러 (주간)');
      return a.주간 === true && a.통화 === '미국달러';
    }],
    ['⛔ 빈 분류는 통화 null — 지어내지 않는다', () =>
      분류벗기기('').통화 === null && 분류벗기기(null).통화 === null],
    ['수읽기는 0 을 0 으로 읽는다 — 0 에는 뜻이 있다', () => 수읽기(0) === 0],
    ['⛔ 빈 값은 null (0 이 아니다)', () =>
      수읽기('') === null && 수읽기(null) === null && 수읽기('없음') === null],
    ['🔴 거래량 0 행을 «지우지 않는다» — 상장행에 그대로 센다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 선물 엔', 0), 줄('파생 선물 엔', 5)] }]);
      return r.상장행합 === 2 && r.거래행합 === 1;
    }],
    ['🔴 플렉스가 한 번도 안 돌면 거래행 0 으로 «세어서» 낸다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 플렉스선물 미국달러', 0), 줄('파생 플렉스선물 미국달러', 0)] }]);
      return r.플렉스행 === 2 && r.플렉스거래행 === 0;
    }],
    ['⛔ fx 아닌 축은 안 센다', () => {
      const r = 재기([{ 날: 'a', 줄들: [{ 축: 'equities', 분류: '파생 선물 코스피200', 거래량: 9 }, 줄('파생 선물 엔', 1)] }]);
      return r.상장행합 === 1;
    }],
    ['통화별 거래량을 모은다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 선물 미국달러', 100), 줄('파생 선물 엔', 3)] }]);
      const 달 = r.통화들.find((x) => x.통화 === '미국달러');
      return 달.거래량 === 100 && r.으뜸통화 === '미국달러';
    }],
    ['미결제약정은 거래량과 따로 모은다 — 안 돈 날에도 남는 자리가 있다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 선물 위안', 0, 167)] }]);
      const 위 = r.통화들.find((x) => x.통화 === '위안');
      return 위.거래량 === 0 && 위.미결제 === 167;
    }],
    ['으뜸 몫은 거래량 기준이다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 선물 미국달러', 990), 줄('파생 선물 엔', 10)] }]);
      return Math.abs(r.으뜸몫 - 0.99) < 1e-12;
    }],
    ['⛔ 아무것도 안 돌았으면 으뜸 몫을 내지 않는다 — 0 으로 나누지 않는다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 선물 엔', 0)] }]);
      return r.으뜸몫 === null;
    }],
    ['🔴 날이 셋보다 적으면 넉넉하지 않다고 적는다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 선물 엔', 1)] }]);
      return r.넉넉 === false;
    }],
    ['날이 셋이면 넉넉하다', () => {
      const r = 재기(['a', 'b', 'c'].map((d) => ({ 날: d, 줄들: [줄('파생 선물 엔', 1)] })));
      return r.넉넉 === true && r.날수 === 3;
    }],
    ['⛔ 「종목 수」라 부르지 않는다 — 센 단위를 값으로 적어 둔다', () => {
      const r = 재기([{ 날: 'a', 줄들: [줄('파생 선물 엔', 1)] }]);
      return /종목-날/.test(r.센단위);
    }],
    ['⛔ 빈 것도 견딘다', () => {
      const r = 재기(null);
      return r.날수 === 0 && r.돈비율 === null && r.으뜸통화 === null;
    }],
  ];
  let 통 = 0; const 실 = [];
  for (const [이름, 재본다] of 목) {
    let ok = false;
    try { ok = !!재본다(); } catch { ok = false; }
    if (ok) 통 += 1; else 실.push(이름);
  }
  console.log(`통화선물 상장·거래 검사 — 자가시험 ${통}/${목.length}`);
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
    console.log('   node scripts/collect-derivatives.mjs --from <날> --to <날> 로 먼저 받는다');
    process.exit(0);
  }
  const 파일들 = fs.readdirSync(밑감방).filter((f) => /^\d{8}\.ndjson$/.test(f)).sort();
  const 날파일들 = 파일들.map((f) => ({
    날: f.slice(0, 8),
    줄들: fs.readFileSync(path.join(밑감방, f), 'utf8').split(/\r?\n/)
      .filter((s) => s.trim()).map((s) => { try { return JSON.parse(s); } catch { return null; } })
      .filter(Boolean),
  }));
  const r = 재기(날파일들);

  const 셈 = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
  const 퍼 = (v) => (v == null ? '—' : `${(v * 100).toFixed(2)}%`);
  console.log('');
  console.log(`■ 거래일 ${r.날수}일 · 상장행(종목-날) ${셈(r.상장행합)} · 그중 «돈» 행 ${셈(r.거래행합)}`
    + ` = ${퍼(r.돈비율)}`);
  if (!r.넉넉) { console.log(`⬜ 못 쟀다 — 거래일이 ${r.날수}일이다(적어도 ${적어도날})`); process.exit(0); }
  console.log(`■ 플렉스선물 상장행 ${셈(r.플렉스행)} · 그중 돈 행 ${셈(r.플렉스거래행)}`);
  console.log(`■ 으뜸 통화 ${r.으뜸통화} — 거래량의 ${퍼(r.으뜸몫)}`);
  if (r.통화모름행) console.log(`   ⬜ 통화를 못 가른 행 ${셈(r.통화모름행)} — 지어내지 않고 통화별 표에서 뺐다`);
  console.log('');
  console.log('■ 통화별 (창 전체 합)');
  for (const c of r.통화들) {
    console.log(`   ${String(c.통화).padEnd(8)} 상장행 ${String(c.상장행).padStart(5)}`
      + ` · 돈 행 ${String(c.거래행).padStart(3)} · 거래량 ${셈(c.거래량).padStart(11)}`
      + ` · 미결제합 ${셈(c.미결제)}`);
  }
  console.log('');
  console.log('■ 날마다');
  for (const d of r.날별) {
    console.log(`   ${d.날}  상장행 ${String(d.상장행).padStart(4)} · 돈 행 ${String(d.거래행).padStart(3)}`);
  }
  console.log('   ⚠ 창이 짧다. 「한국 통화선물은 늘 이렇다」로 넓히지 않는다');

  const 낼것 = {
    잰때: new Date().toISOString(),
    밑감: 'archive/raw/derivatives/<날짜>.ndjson (축=fx 만)',
    무엇을세나: '한국이 상장해 둔 통화선물 종목-날 가운데 그날 거래량이 1 이상이었던 것의 수. 거래량 0 행을 지우지 않고 세는 것이 이 셈의 핵심이다.',
    ...r,
  };
  fs.writeFileSync(낼곳, `${JSON.stringify(낼것, null, 2)}\n`, 'utf8');
  console.log(`\n  ✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
}
