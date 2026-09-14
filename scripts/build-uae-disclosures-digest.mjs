#!/usr/bin/env node
/**
 * build-uae-disclosures-digest.mjs — ADX·DFM 공시 중 무게 높은 것만 CSV 한 장으로 묶는다.
 * 사장님 지침(CLAUDE.md 「주력과 서비스」) — **재무·공시가 주력 상품**이다. 이것이 그 상품이다.
 *
 *   node scripts/build-uae-disclosures-digest.mjs
 *
 * 출처: archive/raw/uae-adx-disclosures/*.json (무게≥5 만) · archive/raw/dubai-dfm-breaking/*.json (무게≥6 만)
 *       — 각 수집기가 이미 그 문턱으로 저장했으므로 여기서는 그대로 합친다.
 * 출력: src/data/full/uae-disclosures-digest-<날짜>.csv
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ADX_DIR = path.resolve('archive/raw/uae-adx-disclosures');
const DFM_DIR = path.resolve('archive/raw/dubai-dfm-breaking');
const OUT_DIR = path.resolve('src/data/full');

function csv셀(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv줄(cols) { return cols.map(csv셀).join(','); }

function 오늘날짜() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function main() {
  const 행 = [['exchange', 'symbol', 'date', 'weight', 'tag', 'title']];

  if (existsSync(ADX_DIR)) {
    for (const f of readdirSync(ADX_DIR).filter((f) => f.endsWith('.json'))) {
      const j = JSON.parse(readFileSync(path.join(ADX_DIR, f), 'utf8'));
      const symbol = j._meta?.symbol ?? f.split('-')[0];
      for (const it of (j.items ?? [])) {
        행.push(['ADX', symbol, it.date ?? '', it.무게 ?? '', it.태그 ?? '', it.title ?? '']);
      }
    }
  }
  if (existsSync(DFM_DIR)) {
    for (const f of readdirSync(DFM_DIR).filter((f) => f.endsWith('.json'))) {
      const j = JSON.parse(readFileSync(path.join(DFM_DIR, f), 'utf8'));
      const symbol = j._meta?.symbol ?? f.replace(/\.json$/, '');
      for (const it of (j.items ?? [])) {
        if (it.무게 < 6) continue; // ADX 파일은 이미 5 이상만 있다 — DFM 은 여기서 한 번 더 거른다
        행.push(['DFM', symbol, it.date ?? '', it.무게 ?? '', it.태그 ?? '', it.title ?? '']);
      }
    }
  }

  if (행.length <= 1) { console.error('⛔ 못 쟀다 — 원본 공시 파일이 하나도 없다. 수집기를 먼저 돌린다'); process.exit(1); }

  const 날짜 = 오늘날짜();
  const 파일 = path.join(OUT_DIR, `uae-disclosures-digest-${날짜}.csv`);
  writeFileSync(파일, 행.map(csv줄).join('\r\n') + '\r\n');
  console.log(`✅ ${행.length - 1}행(ADX+DFM 합산, 무게 상위) → ${path.relative(process.cwd(), 파일)}`);
  console.log(`\n⚠ licence-datasets.mjs 의 파일명을 이 날짜(${날짜})로 맞춘다.`);
}

main();
