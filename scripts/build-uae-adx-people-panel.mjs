#!/usr/bin/env node
/**
 * build-uae-adx-people-panel.mjs — archive/raw/uae-adx-people/*.json 을 팔 수 있는
 * CSV 두 장으로 묶는다. 한국의 `src/data/full/korea-people-panel-*.csv` ·
 * `korea-ownership-ledger-*.csv` 와 같은 자리(경쟁사는 재무, 우리는 사람 — CLAUDE.md 785줄).
 *
 *   node scripts/build-uae-adx-people-panel.mjs
 *
 * 출력: src/data/full/uae-adx-board-<날짜>.csv       (이사회·경영진)
 *       src/data/full/uae-adx-shareholders-<날짜>.csv (5% 이상 대주주)
 * ⛔ 파일 이름의 날짜는 `licence-datasets.mjs` 가 가리키는 이름과 반드시 같아야 한다 —
 *   두 곳에 따로 적으면 «판다고 해놓고 파일이 없는» 사고가 난다(그 파일의 헤더 주석 참고).
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('archive/raw/uae-adx-people');
const DFM_SH_SRC = path.resolve('archive/raw/dubai-dfm-shareholders');
const DFM_CO_SRC = path.resolve('archive/raw/dubai-dfm-companies');
const OUT_DIR = path.resolve('src/data/full');

function csv셀(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv줄(cols) { return cols.map(csv셀).join(','); }

function main() {
  if (!existsSync(SRC)) { console.error('⛔ ' + SRC + ' 가 없다 — collect-uae-adx-people.mjs 를 먼저 돌린다'); process.exit(1); }
  const 파일들 = readdirSync(SRC).filter((f) => f.endsWith('.json'));
  if (!파일들.length) { console.error('⛔ 수집된 종목이 0개다'); process.exit(1); }

  const 날짜 = new Date().toLocaleString('ko-KR').match(/^\d+\. \d+\. \d+/)
    ? (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()
    : '0000-00-00';

  const 이사행 = [['exchange', 'ticker', 'company_name_en', 'name_english', 'name_arabic', 'title', 'category', 'rank_order']];
  const 주주행 = [['exchange', 'ticker', 'company_name_en', 'shareholder_name', 'shareholder_id', 'percentage']];
  let 종목수 = 0; let 이사수 = 0; let 주주수 = 0;

  for (const f of 파일들) {
    const j = JSON.parse(readFileSync(path.join(SRC, f), 'utf8'));
    const ticker = j._meta?.symbol ?? f.replace(/\.json$/, '');
    const 회사명 = j.company?.engName ?? '';
    종목수 += 1;
    for (const b of (j.board ?? [])) {
      /* ⛔ 산 사람은 영어권이다 — 구분(이사회/경영진)을 한글로 그대로 팔지 않는다 */
      const category = b.구분 === '이사회' ? 'Board' : b.구분 === '경영진' ? 'Management' : 'Unclassified';
      이사행.push(['ADX', ticker, 회사명, b.nameEnglish ?? '', b.nameArabic ?? '', b.title ?? '', category, b.order ?? '']);
      이사수 += 1;
    }
    for (const s of (j.substantialShareholders ?? [])) {
      주주행.push(['ADX', ticker, 회사명, s.name ?? '', s.id ?? '', s.percentage ?? '']);
      주주수 += 1;
    }
  }

  /* 🔴 [2026-09-14] 「UAE 시장이 두 곳이면 두 곳 다 해야지」 — DFM(두바이) 대주주를 더한다.
     ⛔ DFM 은 이사회 명단을 못 찾아(collect-dubai-dfm-shareholders.mjs 헤더 참고) 대주주만 있다. */
  if (existsSync(DFM_SH_SRC)) {
    for (const f of readdirSync(DFM_SH_SRC).filter((f) => f.endsWith('.json'))) {
      const j = JSON.parse(readFileSync(path.join(DFM_SH_SRC, f), 'utf8'));
      const ticker = j._meta?.symbol ?? f.replace(/\.json$/, '');
      let 회사명 = '';
      const 회사파일 = path.join(DFM_CO_SRC, f);
      if (existsSync(회사파일)) 회사명 = JSON.parse(readFileSync(회사파일, 'utf8')).company?.fullName ?? '';
      for (const s of (j.substantialShareholders ?? [])) {
        주주행.push(['DFM', ticker, 회사명, s.name ?? '', '', s.percentage ?? '']);
        주주수 += 1;
      }
    }
  }

  const 이사파일 = path.join(OUT_DIR, `uae-adx-board-${날짜}.csv`);
  const 주주파일 = path.join(OUT_DIR, `uae-adx-shareholders-${날짜}.csv`);
  writeFileSync(이사파일, 이사행.map(csv줄).join('\r\n') + '\r\n');
  writeFileSync(주주파일, 주주행.map(csv줄).join('\r\n') + '\r\n');

  console.log(`✅ 종목 ${종목수}개 · 이사/경영진 ${이사수}행 → ${path.relative(process.cwd(), 이사파일)}`);
  console.log(`✅ 대주주 ${주주수}행 → ${path.relative(process.cwd(), 주주파일)}`);
  console.log(`\n⚠ licence-datasets.mjs 의 uae 항목 파일명을 이 날짜(${날짜})로 맞춘다.`);
}

main();
