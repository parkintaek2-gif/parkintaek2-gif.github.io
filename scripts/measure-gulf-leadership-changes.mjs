#!/usr/bin/env node
/**
 * measure-gulf-leadership-changes.mjs — **걸프 상장사에서 «누가 바뀌었나»를 센다.**
 *
 * ── 왜 만들었나 (2026-10-04 09:3x · 5번) ──────────────────────────────
 *   사장님이 값나가는 순간으로 둘을 짚어 주셨다 — **지배권 변경과 CEO 변경**이다.
 *   우리는 ADX(아부다비)·DFM(두바이) 공시를 날마다 받아 쌓고 있는데,
 *   **그 둘을 따로 세어 본 적이 없다.** 쌓기만 하고 안 센 자료다.
 *
 * ── ⛔ 손으로 CSV 를 쪼개지 않는다 ───────────────────────────────────
 *   처음에 digest CSV 를 `split(',')` 로 쪼갰더니 제목 안의 쉼표 때문에 칸이 밀려
 *   「태그 갈래 1개」·「2026년치 0건」 같은 수가 나왔다. 그 수로 기사를 썼으면
 *   **틀린 숫자 하나가 옳은 스물셋을 같이 의심받게** 했을 것이다.
 *   ⇒ 원자료 JSON 을 그대로 읽는다. 쉼표가 끼어들 자리가 없다.
 *
 * ── ⛔ 이 자가 하지 않는 것 ─────────────────────────────────────────
 * ⛔ 「왜 바뀌었나」를 말하지 않는다. 공시는 바뀐 사실만 적는다.
 * ⛔ 좋다·나쁘다를 매기지 않는다. 사람이 자주 바뀌는 것이 흠인지 아닌지는
 *   우리가 정할 자리가 아니다. **세고 멈춘다.**
 * ⚠ 표본이 작은 해를 비율로 말하지 않는다 — 몇 건인지를 같이 낸다.
 *
 * 쓰는 법
 *   node scripts/measure-gulf-leadership-changes.mjs
 *   node scripts/measure-gulf-leadership-changes.mjs --자가시험
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 자리들 = [
  { 거래소: 'ADX', 도시: 'Abu Dhabi', 방: 'archive/raw/uae-adx-disclosures' },
  { 거래소: 'DFM', 도시: 'Dubai', 방: 'archive/raw/dubai-dfm-breaking' },
];

/** 우리가 세는 두 갈래 — 사장님이 짚으신 그 둘이다 */
export const 셀태그 = ['ceo-change', 'control-change'];

export const 달이름 = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * 날을 `2026-07-30` 꼴로. 못 읽으면 null — ⛔ 0 이나 오늘로 메우지 않는다.
 *
 * 🔴🔴 [2026-10-04 09:3x · 5번] **두 거래소의 날짜 꼴이 다르다.**
 *   ```
 *   ADX   "2026-07-30 00:00:00.0"
 *   DFM   "Apr 03, 2023 08:47:01"
 *   ```
 *   처음에 ADX 꼴만 읽었더니 **DFM 이 CEO 변경 0건**으로 나왔다. 원자료를 열어 보니
 *   **22건이 있었다.** 「0 이 나오면 자를 먼저 의심한다」를 오늘만 일곱 번째 밟았다.
 * ⚠ 수집기가 둘 다 쓰는 한 이 자는 둘 다 읽어야 한다. 한쪽을 못 읽으면 그 거래소가
 *   통째로 사라지는데, **사라진 것은 0 으로 보이고 0 은 빨강이 아니다.**
 */
export function 날뽑기(값) {
  const s = String(값 ?? '').trim();
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (a) return `${a[1]}-${a[2]}-${a[3]}`;
  const b = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})/.exec(s);
  if (b) {
    const m = 달이름[b[1].toLowerCase()];
    if (m) return `${b[3]}-${m}-${String(b[2]).padStart(2, '0')}`;
  }
  return null;
}

export function 해뽑기(값) {
  const d = 날뽑기(값);
  return d ? d.slice(0, 4) : null;
}

/**
 * 한 건에서 태그를 읽는다.
 * ⚠ 수집기가 이미 `tag` 를 붙여 두었다. 여기서 다시 판정하지 않는다 —
 *   두 곳에서 판정하면 두 곳이 어긋난다.
 */
export function 태그뽑기(건) {
  const t = 건?.tag ?? 건?.태그 ?? null;
  return t ? String(t) : null;
}

export function 한방읽기(방) {
  const 절대 = path.join(뿌리, 방);
  if (!fs.existsSync(절대)) return null;           /* ⛔ 빈 목록을 0 으로 내지 않는다 */
  const 것 = [];
  for (const n of fs.readdirSync(절대)) {
    if (!n.endsWith('.json') || n.startsWith('_')) continue;
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(절대, n), 'utf8')); } catch { continue; }
    const 건들 = Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : []);
    const 종목 = n.replace(/\.json$/, '');
    for (const b of 건들) 것.push({ 종목, 태그: 태그뽑기(b), 날: 날뽑기(b?.date), 제목: String(b?.title ?? '') });
  }
  return 것;
}

/**
 * 🔴🔴 [2026-10-04 09:3x] **날을 못 읽은 건이 «조용히» 사라지고 있었다.**
 *   DFM 날짜 꼴을 못 읽어 22건이 통째로 빠졌는데, 결과는 그냥 「0건」이었다.
 *   **사라진 것은 0 으로 보이고, 0 은 빨강이 아니다.** 그래서 아무도 모른다.
 * ⇒ 못 읽은 수를 «같이» 낸다. 「재 보고 안 되면 안 된다고 적는 것도 결과다」.
 */
export function 세기(건들, 태그) {
  const 이태그 = 건들.filter((x) => x.태그 === 태그);
  const 날못읽음 = 이태그.filter((x) => !x.날).length;
  const 쓸것 = 이태그.filter((x) => x.날);
  const 해별 = new Map();
  const 회사 = new Set();
  for (const x of 쓸것) {
    const y = x.날.slice(0, 4);
    해별.set(y, (해별.get(y) ?? 0) + 1);
    회사.add(x.종목);
  }
  return {
    태그,
    모두: 쓸것.length,
    날못읽음,                       /* ⛔ 숨기지 않는다 — 숨기면 0 으로 보인다 */
    회사수: 회사.size,
    해별: [...해별.entries()].sort(),
    /* 같은 회사가 여러 번 바뀐 곳 — 수가 작으니 비율로 말하지 않는다 */
    두번넘은회사: (() => {
      const c = new Map();
      for (const x of 쓸것) c.set(x.종목, (c.get(x.종목) ?? 0) + 1);
      return [...c.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
    })(),
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 참, 덧 = '') => 결과.push({ 이름, 참: !!참, 덧 });

  본다('ADX 꼴을 읽는다', 날뽑기('2026-07-30 00:00:00.0') === '2026-07-30');
  /* 🔴 이 줄이 없어서 DFM 이 통째로 0건으로 나왔다 */
  본다('🔴 DFM 꼴도 읽는다', 날뽑기('Apr 03, 2023 08:47:01') === '2023-04-03');
  본다('🔴 하루 숫자가 하나여도 읽는다', 날뽑기('Jan 7, 2026 10:00:00') === '2026-01-07');
  본다('달 이름 대소문자를 안 가린다', 날뽑기('DEC 25, 2025') === '2025-12-25');
  본다('⛔ 없는 달 이름은 null', 날뽑기('Foo 03, 2023') === null);
  본다('⛔ 못 읽으면 null — 0 으로 안 적는다', 날뽑기('어제') === null);
  본다('⛔ 빈 값도 안 죽는다', 날뽑기(null) === null);
  본다('해를 뽑는다', 해뽑기('2026-07-30 00:00:00.0') === '2026');
  본다('해를 뽑는다 (DFM 꼴)', 해뽑기('Apr 03, 2023 08:47:01') === '2023');
  본다('달 이름이 열둘이다', Object.keys(달이름).length === 12);

  본다('태그를 그대로 읽는다', 태그뽑기({ tag: 'ceo-change' }) === 'ceo-change');
  본다('⛔ 태그가 없으면 null — 지어내지 않는다', 태그뽑기({ title: 'x' }) === null);

  {
    const 건 = [
      { 종목: 'A', 태그: 'ceo-change', 날: '2026-01-02' },
      { 종목: 'A', 태그: 'ceo-change', 날: '2026-05-02' },
      { 종목: 'B', 태그: 'ceo-change', 날: '2025-03-02' },
      { 종목: 'C', 태그: 'control-change', 날: '2026-02-02' },
      { 종목: 'D', 태그: 'ceo-change', 날: null },        /* 날을 못 읽은 건 */
    ];
    const r = 세기(건, 'ceo-change');
    본다('🔴 날을 못 읽은 건은 안 센다', r.모두 === 3, String(r.모두));
    본다('🔴 그러나 몇 건을 못 읽었는지 «적는다» — 조용히 사라지면 0 으로 보인다',
      r.날못읽음 === 1, String(r.날못읽음));
    본다('회사 수는 따로 센다 — 건수와 다르다', r.회사수 === 2);
    본다('해마다 가른다', r.해별.map((x) => x.join(':')).join(' ') === '2025:1 2026:2');
    본다('두 번 넘은 회사를 집는다', r.두번넘은회사.length === 1 && r.두번넘은회사[0][0] === 'A');
    본다('⛔ 다른 태그를 안 섞는다', 세기(건, 'control-change').모두 === 1);
    본다('⛔ 없는 태그는 0 이다 — 빈 결과도 결과다', 세기(건, '없는것').모두 === 0);
  }

  본다('⛔ 폴더가 없으면 null — 0 과 다르다', 한방읽기('__없는방__') === null);
  본다('세는 갈래는 둘뿐이다 — 사장님이 짚으신 그 둘', 셀태그.length === 2);

  const 빨강 = 결과.filter((r) => !r.참).length;
  console.log('■ 걸프 상장사 — 누가 바뀌었나 · 자가시험');
  for (const r of 결과) console.log(`  ${r.참 ? '✅' : '🔴'} ${r.이름}${r.덧 ? `  (${r.덧})` : ''}`);
  console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
  return 빨강 === 0;
}

/* ── 혼자 돌 때 ───────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  }
  console.log('■ 걸프 상장사에서 누가 바뀌었나 — ADX(아부다비) · DFM(두바이)\n');
  console.log('   ⛔ 이 자는 센다. 왜 바뀌었는지도, 좋은지 나쁜지도 말하지 않는다.\n');

  for (const z of 자리들) {
    const 건 = 한방읽기(z.방);
    if (건 === null) { console.log(`⬜ ${z.거래소} — 받은 것이 없다. 못 쟀다\n`); continue; }
    const 회사수 = new Set(건.map((x) => x.종목)).size;
    console.log(`── ${z.거래소} (${z.도시}) · 회사 ${회사수}곳 · 공시 ${건.length.toLocaleString('en-GB')}건`);
    for (const t of 셀태그) {
      const r = 세기(건, t);
      const 못읽음글 = r.날못읽음 ? `  ⚠ 날을 못 읽은 것 ${r.날못읽음}건` : '';
      if (!r.모두) { console.log(`   ${t.padEnd(16)} 0건${못읽음글}`); continue; }
      const 해글 = r.해별.map(([y, n]) => `${y} ${n}`).join(' · ');
      console.log(`   ${t.padEnd(16)} ${String(r.모두).padStart(4)}건 · 회사 ${r.회사수}곳   ${해글}${못읽음글}`);
      if (r.두번넘은회사.length) {
        console.log(`        두 번 넘은 곳 ${r.두번넘은회사.length}곳 — `
          + r.두번넘은회사.slice(0, 6).map(([s, n]) => `${s}(${n})`).join(' · '));
      }
    }
    console.log('');
  }
  console.log('⚠ 공시가 올라온 날이지 바뀐 날이 아니다. 둘은 다를 수 있다.');
  console.log('⚠ 우리가 받기 시작한 뒤의 것만이다 — 그 앞은 여기 없다.');
}
