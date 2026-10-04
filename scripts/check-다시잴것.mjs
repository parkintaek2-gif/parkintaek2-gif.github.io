/**
 * check-다시잴것.mjs — **「나중에 다시 재겠다」고 한 것이 때가 되면 떠오르게 한다.**
 *
 * ── 왜 ────────────────────────────────────────────────────────
 * 🔴 [2026-10-05 03:1x · 5번] 오늘 밤 사장님께 이렇게 적어 올렸다 —
 *   「일주 60장은 닮은 몫이 기준선을 넘습니다. **2주 뒤 실제 색인 수를 재서**
 *    쓸모가 있는지 판정하겠습니다.」
 *   그런데 그 약속을 **어디에도 안 적었다.** 2주 뒤 내가 기억할 리 없다.
 *
 *   같은 일이 이미 있었다 — 2026-08-22 에 사장님이 「키워드 검색량을 재서 해」라
 *   이르셔서 자를 만들었는데 **9월 7일 뒤로 한 번도 안 돌렸다.**
 *   회사 강령 ④ 가 이미 같은 말을 한다 — 「말로 하는 규칙은 잊힌다.
 *   사람이 기억해서 지키는 구조를 만들지 않는다.」
 *
 * ── 이 자가 하는 일 ───────────────────────────────────────────
 * ```
 * 대장에 적어 두면  → 그 날짜가 되었을 때 두 시간 점검에서 «떠오른다»
 * 재고 나면          → 결과를 적고 줄을 닫는다
 * ```
 * ⛔ 이 자는 재 주지 않는다. **「잴 때가 됐다」고 말할 뿐**이다 —
 *   무엇을 어떻게 재는지는 줄에 적힌 대로 사람이 한다.
 * ⛔ 날짜가 지났는데 안 잰 것은 «지난 날수»를 함께 적는다. 조용히 넘기지 않는다.
 *
 * 대장 꼴 (docs/다시잴것-대장.tsv, 탭으로 나눈다)
 *   적은날 · 잴날 · 무엇 · 어떻게 · 왜 · 잰날 · 결과
 *
 * 쓰는 법
 *   node scripts/check-다시잴것.mjs                     때가 된 것을 보여 준다
 *   node scripts/check-다시잴것.mjs --적는다 --잴날 2026-10-19 \
 *        --무엇 "일주 60장 색인" --어떻게 "서치콘솔에서 /ilju/ 색인 수" --왜 "닮은 몫이 선을 넘었다"
 *   node scripts/check-다시잴것.mjs --잿다 "일주 60장 색인" --결과 "60장 중 N장 색인"
 *   node scripts/check-다시잴것.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장 = path.join(뿌리, 'docs/다시잴것-대장.tsv');
export const 머리 = ['적은날', '잴날', '무엇', '어떻게', '왜', '잰날', '결과'];

/** ⛔ toISOString 금지 — 이 PC 는 이미 KST 다 */
export function 오늘() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 대장을 읽는다. ⛔ 없으면 빈 배열 — 「없다」와 「못 읽었다」를 가르려고 둘째 값을 함께 낸다 */
export function 읽는다(길 = 대장) {
  if (!fs.existsSync(길)) return { 줄들: [], 있나: false };
  let 글 = '';
  try { 글 = fs.readFileSync(길, 'utf8'); } catch { return { 줄들: [], 있나: false }; }
  const 줄들 = 글.split(/\r?\n/).slice(1).filter(Boolean).map((줄) => {
    const 칸 = 줄.split('\t');
    const o = {};
    머리.forEach((k, i) => { o[k] = (칸[i] ?? '').trim(); });
    return o;
  });
  return { 줄들, 있나: true };
}

/** 날짜 두 개 사이의 날수. ⛔ 못 읽으면 null */
export function 날수(가, 나) {
  const a = Date.parse(`${가}T00:00:00`);
  const b = Date.parse(`${나}T00:00:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

/**
 * 오늘 떠올려야 하는 것. ⛔ 이미 잰 줄(잰날이 있는 것)은 빼고 본다.
 * @returns {{때가됨: Array, 지남: Array, 아직: number}}
 */
export function 떠올릴것(줄들, 그날 = 오늘()) {
  const 안잰것 = (줄들 ?? []).filter((r) => r && r.잴날 && !r.잰날);
  const 때가됨 = []; const 지남 = [];
  for (const r of 안잰것) {
    const d = 날수(r.잴날, 그날);
    if (d === null) continue;                 /* ⛔ 날짜가 이상하면 건너뛴다 */
    if (d === 0) 때가됨.push({ ...r, 지난날: 0 });
    else if (d > 0) 지남.push({ ...r, 지난날: d });
  }
  지남.sort((a, b) => b.지난날 - a.지난날);
  return { 때가됨, 지남, 아직: 안잰것.length - 때가됨.length - 지남.length };
}

/** 한 줄 적기. ⛔ 잴날이 없으면 안 적는다 — 언제 재는지 모르면 영영 안 잰다 */
export function 줄만들기(o, 그날 = 오늘()) {
  if (!o?.잴날 || !o?.무엇) return null;
  return [그날, o.잴날, o.무엇, o.어떻게 ?? '', o.왜 ?? '', '', ''].join('\t');
}

/* ── 자가시험 ─────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 진 = [];
  const 본다 = (이름, 참) => { if (참) 통 += 1; else 진.push(이름); };

  본다('오늘은 YYYY-MM-DD 꼴', /^\d{4}-\d{2}-\d{2}$/.test(오늘()));
  본다('날수를 센다', 날수('2026-10-05', '2026-10-19') === 14);
  본다('지난 날은 양수', 날수('2026-10-01', '2026-10-05') === 4);
  본다('⛔ 이상한 날짜는 null', 날수('어제', '2026-10-05') === null);

  const 줄들 = [
    { 잴날: '2026-10-19', 무엇: '일주 색인', 잰날: '' },
    { 잴날: '2026-10-05', 무엇: '오늘 것', 잰날: '' },
    { 잴날: '2026-09-20', 무엇: '지난 것', 잰날: '' },
    { 잴날: '2026-09-01', 무엇: '이미 잰 것', 잰날: '2026-09-02' },
  ];
  const r = 떠올릴것(줄들, '2026-10-05');
  본다('오늘이 잴 날이면 떠오른다', r.때가됨.length === 1 && r.때가됨[0].무엇 === '오늘 것');
  본다('🔴 지난 것은 «지난 날수»와 함께 뜬다',
    r.지남.length === 1 && r.지남[0].지난날 === 15);
  본다('⛔ 이미 잰 것은 안 뜬다', ![...r.때가됨, ...r.지남].some((x) => x.무엇 === '이미 잰 것'));
  본다('아직 멀었은 것은 수로만 센다', r.아직 === 1);

  본다('줄을 만든다', 줄만들기({ 잴날: '2026-10-19', 무엇: 'ㄱ' }, '2026-10-05')
    .startsWith('2026-10-05\t2026-10-19\tㄱ'));
  본다('⛔ 잴날이 없으면 안 적는다', 줄만들기({ 무엇: 'ㄱ' }) === null);
  본다('⛔ 무엇이 없으면 안 적는다', 줄만들기({ 잴날: '2026-10-19' }) === null);
  본다('머리가 일곱 칸', 머리.length === 7);
  /* ⛔ 대장이 없는 것과 비어 있는 것을 가른다 */
  본다('🔴 대장이 없으면 «있나: false»', 읽는다(path.join(뿌리, '없는파일.tsv')).있나 === false);

  console.log(진.length ? `🔴 ${진.length} 떨어졌다 —\n  ${진.join('\n  ')}` : `✅ 자가시험 ${통} 통과`);
  process.exit(진.length ? 1 : 0);
}

if (내가실행됐다) {
  const 인자 = process.argv.slice(2);
  const 값 = (이름) => { const i = 인자.indexOf(이름); return i >= 0 ? 인자[i + 1] : null; };

  if (인자.includes('--적는다')) {
    const o = { 잴날: 값('--잴날'), 무엇: 값('--무엇'), 어떻게: 값('--어떻게'), 왜: 값('--왜') };
    const 줄 = 줄만들기(o);
    if (!줄) {
      console.log('⛔ --잴날 과 --무엇 은 꼭 있어야 한다. 언제 재는지 모르면 영영 안 잰다');
      process.exit(1);
    }
    if (!fs.existsSync(대장)) fs.writeFileSync(대장, `${머리.join('\t')}\n`, 'utf8');
    fs.appendFileSync(대장, `${줄}\n`, 'utf8');
    console.log(`✅ 적었다 — ${o.잴날} 에 「${o.무엇}」`);
    console.log('   ⭐ 커밋·푸시까지 해야 남는다');
    process.exit(0);
  }

  if (인자.includes('--잿다')) {
    const 무엇 = 값('--잿다'); const 결과 = 값('--결과') ?? '';
    const { 줄들, 있나 } = 읽는다();
    if (!있나) { console.log('⛔ 대장이 없다'); process.exit(1); }
    let 고친수 = 0;
    const 새글 = [머리.join('\t')];
    for (const r of 줄들) {
      if (r.무엇 === 무엇 && !r.잰날) { r.잰날 = 오늘(); r.결과 = 결과; 고친수 += 1; }
      새글.push(머리.map((k) => r[k] ?? '').join('\t'));
    }
    if (!고친수) { console.log(`⛔ 「${무엇}」 을 못 찾았다 — 이름을 대장과 똑같이 준다`); process.exit(1); }
    fs.writeFileSync(대장, `${새글.join('\n')}\n`, 'utf8');
    console.log(`✅ 닫았다 — 「${무엇}」 · 결과: ${결과 || '(안 적음)'}`);
    process.exit(0);
  }

  const { 줄들, 있나 } = 읽는다();
  if (!있나) {
    console.log('⬜ 대장이 아직 없다 — 적을 것이 생기면 --적는다 로 만든다');
    process.exit(0);
  }
  const r = 떠올릴것(줄들);
  if (r.지남.length) {
    console.log(`🔴 **잴 날이 지났는데 안 잰 것 ${r.지남.length}개** —`);
    for (const x of r.지남) {
      console.log(`   ${x.지난날}일 지남 · ${x.무엇}`);
      if (x.어떻게) console.log(`      어떻게 — ${x.어떻게}`);
      if (x.왜) console.log(`      왜 — ${x.왜}`);
    }
  }
  if (r.때가됨.length) {
    console.log(`⏰ **오늘이 잴 날이다 ${r.때가됨.length}개** —`);
    for (const x of r.때가됨) {
      console.log(`   ${x.무엇}`);
      if (x.어떻게) console.log(`      어떻게 — ${x.어떻게}`);
    }
  }
  if (!r.지남.length && !r.때가됨.length) {
    console.log(`✅ 오늘 잴 것은 없다 (앞으로 잴 것 ${r.아직}개)`);
  } else {
    console.log('\n   재고 나면 — node scripts/check-다시잴것.mjs --잿다 "<무엇>" --결과 "<난 수>"');
  }
  process.exit(0);
}
