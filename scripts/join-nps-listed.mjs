#!/usr/bin/env node
/**
 * 국민연금 사업장 ↔ 상장사 붙이기 — **이직률**을 만든다.
 *
 *   node scripts/join-nps-listed.mjs
 *
 * ── 무엇이 나오나 ───────────────────────────────────────────────
 * 국민연금 사업장 파일에 **신규취득자수·상실가입자수**가 월 단위로 있다.
 * 상장사에 붙이면 **회사별 이직률**이 된다 — 경쟁사(CEO스코어 등)가 안 하는 축이다.
 * 사장님: 「그들은 재무를, **우리는 사람을** 한다」
 *
 * ── ⚠ 어떻게 붙이나 — 여기가 약한 고리다 ────────────────────────
 * 포털 파일의 **사업자등록번호가 앞 6자리로 잘려 있다.** 그것만으로는 못 붙인다 —
 * 6자리는 세무서코드 + 일련번호 앞자리라 수천 곳이 같은 값을 갖는다.
 *
 * 그래서 **이름으로 붙이고 번호로 검산한다.**
 * ```
 * 이름 정규화     (주)·㈜·주식회사·공백·기호를 지우고 대문자
 * 딱 하나일 때만  상장사 명단에 같은 이름이 둘 이상이면 **버린다**
 * 앞 6자리 대조   같다 → 확실 · 다르다 → **동명이사(異社)다. 버린다**
 *                한쪽에 번호가 없으면 「못 잼」으로 따로 센다
 * ```
 *
 * **「69.9% 가 붙었다」보다 「몇 %가 번호로 확인됐다」가 팔 수 있는 숫자다.**
 * 비율을 낼 때는 분모를 같이 적는다 — 「우리가 일하는 법」 6장.
 *
 * ── ⭐ 붙은 게 맞는지 밖에서 확인하는 법 ────────────────────────
 * **국민연금 가입자수와 DART 신고 인원을 나란히 놓는다.** 남남이면 안 맞는다.
 * 2026-08-05 실측 — 삼성전자 125,592 vs 128,881 (2.6% 차이),
 * SK하이닉스 35,544 vs 34,549. **독립된 두 출처가 서로를 확인해 준다.**
 * (그날 고친 인원 버그 이전 값 50,817 이었다면 60% 가 어긋났을 것이다)
 */
import { createReadStream, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const 정규화 = (s) => String(s ?? '')
  .replace(/\(주\)|㈜|주식회사|\(유\)|유한회사/g, '')
  .replace(/[\s.·,\-_'"]/g, '')
  .toUpperCase();

/** 사업자등록번호 앞 6자리. 못 뽑으면 null — **억지로 맞추지 않는다** */
const 앞6 = (v) => { const d = String(v ?? '').replace(/[^0-9]/g, ''); return d.length >= 6 ? d.slice(0, 6) : null; };

/** ⚠ 큰따옴표 안의 쉼표를 지킨다. split(',') 로 하면 열이 밀린다 */
const 칸 = (l) => {
  const o = []; let v = '', q = false;
  for (const ch of l) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { o.push(v); v = ''; continue; }
    v += ch;
  }
  o.push(v); return o;
};

async function main() {
  const 상장 = readFileSync('archive/raw/dart-company/company.ndjson', 'utf8')
    .split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 이름표 = new Map();
  for (const c of 상장) { const k = 정규화(c.이름); if (k) (이름표.get(k) ?? 이름표.set(k, []).get(k)).push(c); }
  const 번호있음 = 상장.filter((c) => c.사업자번호).length;
  console.log(`상장사 ${상장.length.toLocaleString()} · 서로 다른 정규화 이름 ${이름표.size.toLocaleString()} · 사업자번호 있음 ${번호있음.toLocaleString()}`);
  if (!번호있음) console.log('⚠ 사업자번호가 하나도 없다 — `node scripts/collect-company.mjs --refetch` 를 먼저 돌린다');

  const 붙음 = new Map();       // 종목 → {가입, 신규, 상실, 사업장수}
  const 확인됨 = new Set();     // 앞 6자리까지 맞은 회사
  let 행 = 0, 어긋남 = 0, 못잼 = 0;

  const dec = new TextDecoder('euc-kr', { fatal: false });
  let 남은 = '', 열 = null, 자리 = {};

  for await (const 조각 of createReadStream('archive/raw/nps/workplaces-latest.csv', { highWaterMark: 1 << 20 })) {
    남은 += dec.decode(조각, { stream: true });
    let i;
    while ((i = 남은.indexOf('\n')) > -1) {
      const 줄 = 남은.slice(0, i).replace(/\r$/, ''); 남은 = 남은.slice(i + 1);
      if (!줄.trim()) continue;
      if (!열) {
        열 = 칸(줄).map((x) => x.trim());
        /* ⚠ 열 번호를 박지 않는다. 다음 달 파일에서 조용히 어긋난다 */
        자리 = {
          이름: 열.findIndex((c) => c.includes('사업장명')),
          가입: 열.findIndex((c) => c.includes('가입자수')),
          신규: 열.findIndex((c) => c.includes('신규취득')),
          상실: 열.findIndex((c) => c.includes('상실')),
          사업자: 열.findIndex((c) => c.includes('사업자등록번호')),
        };
        continue;
      }
      행++;
      const c = 칸(줄);
      const hit = 이름표.get(정규화(c[자리.이름]));
      if (!hit || hit.length !== 1) continue;   /* 동명이 둘 이상이면 **버린다.** 찍지 않는다 */

      /* ⭐ 번호로 검산 */
      const 우리번호 = 앞6(hit[0].사업자번호), 연금번호 = 앞6(c[자리.사업자]);
      if (우리번호 && 연금번호) {
        if (우리번호 !== 연금번호) { 어긋남++; continue; }   /* 동명이사다 */
        확인됨.add(hit[0].종목);
      } else 못잼++;

      const t = hit[0].종목;
      const n = (j) => { const v = Number(String(c[j] ?? '').replace(/[^0-9]/g, '')); return Number.isFinite(v) ? v : 0; };
      const cur = 붙음.get(t) ?? { 가입: 0, 신규: 0, 상실: 0, 수: 0, 이름: hit[0].이름 };
      cur.가입 += n(자리.가입); cur.신규 += n(자리.신규); cur.상실 += n(자리.상실); cur.수++;
      붙음.set(t, cur);
    }
  }

  console.log(`국민연금 행 ${행.toLocaleString()}`);
  console.log(`\n■ 붙은 상장사 ${붙음.size.toLocaleString()} / ${상장.length.toLocaleString()}  (${(붙음.size / 상장.length * 100).toFixed(1)}%)`);
  console.log(`   그중 **사업자번호 앞 6자리까지 맞은 회사 ${확인됨.size.toLocaleString()}**`);
  console.log(`   이름은 같은데 번호가 달라 **버린 행 ${어긋남.toLocaleString()}** · 번호를 못 잰 행 ${못잼.toLocaleString()}`);

  /* DART 인력과 겹치는지 — 실제로 쓸 수 있는 표본 */
  const 인력 = readFileSync('archive/raw/dart-employment/employment-2025.ndjson', 'utf8')
    .split('\n').filter((x) => x.trim()).map((l) => JSON.parse(l));
  const 인력표 = new Map(인력.map((r) => [r.종목, r]));
  const 둘다 = [...붙음].filter(([t]) => 인력표.has(t));
  console.log(`■ DART 인력과 **둘 다 있는** 회사 ${둘다.length.toLocaleString()} (번호까지 확인된 것 ${둘다.filter(([t]) => 확인됨.has(t)).length.toLocaleString()})`);

  console.log('\n■ 가입자 수 대조 (국민연금 vs DART 신고) — 붙은 게 맞는지 본다');
  둘다.sort((a, b) => b[1].가입 - a[1].가입).slice(0, 10).forEach(([t, v]) => {
    const d = 인력표.get(t);
    const 차 = d.인원 ? ((v.가입 - d.인원) / d.인원 * 100).toFixed(1) + '%' : '—';
    console.log(`   ${확인됨.has(t) ? '✔' : ' '} ${String(v.이름).slice(0, 14).padEnd(16)} 연금 ${String(v.가입).padStart(7)} · DART ${String(d.인원 ?? '—').padStart(7)} · 차 ${차.padStart(7)} · 이직률 ${v.가입 ? (v.상실 / v.가입 * 100).toFixed(1) + '%' : '—'}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
