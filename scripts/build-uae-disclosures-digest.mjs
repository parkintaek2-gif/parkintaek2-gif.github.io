#!/usr/bin/env node
/**
 * build-uae-disclosures-digest.mjs — ADX·DFM 공시 중 무게 높은 것만 CSV 한 장으로 묶는다.
 * 사장님 지침(CLAUDE.md 「주력과 서비스」) — **재무·공시가 주력 상품**이다. 이것이 그 상품이다.
 *
 *   node scripts/build-uae-disclosures-digest.mjs
 *
 * 🔴 [2026-09-14 · 5번 감수로 발견] **문턱이 두 거래소에서 달랐다 — 조용한 거짓말이었다.**
 *   ADX 원본 파일(`uae-adx-disclosures/*.json`)의 `items` 는 «전 건»이다(무게 1~9 다 있다) —
 *   `_meta.highWeight` 는 그중 ≥5 인 개수를 «세어서 알려줄 뿐», items 자체를 거르지 않는다.
 *   그런데 이 스크립트는 ADX 는 무조건 다 넣고 DFM 만 ≥6 으로 걸렀다 — «주가에 영향 줄
 *   것만 골랐다»고 팔면서 실제로는 ADX 쪽에 pr-marketing(무게2)·board-procedural(무게1)
 *   같은 잡음이 그대로 섞여 있었다. 5번이 재서 잡았다(보고 5,139 vs 실측 5,778 — 그 차이가
 *   바로 이 잡음이었다). ⇒ **두 거래소에 «같은» 문턱을 명시로 준다.**
 *
 * 출처: archive/raw/uae-adx-disclosures/*.json (전건) · archive/raw/dubai-dfm-breaking/*.json (전건)
 *       — 여기서 «단 한 곳»(MIN_WEIGHT)으로 똑같이 거른다.
 * 출력: src/data/full/uae-disclosures-digest-<날짜>.csv
 *       src/data/full/uae-disclosures-digest-<날짜>.meta.json (구성 — 몇 건 중 몇 건을 왜 뺐는지)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ADX_DIR = path.resolve('archive/raw/uae-adx-disclosures');
const DFM_DIR = path.resolve('archive/raw/dubai-dfm-breaking');
const OUT_DIR = path.resolve('src/data/full');

/** ⚠ 두 거래소에 «똑같이» 적용한다 — 어느 한쪽만 다르게 걸렀다가 이 사고가 났다. */
export const MIN_WEIGHT = 6;

function csv셀(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csv줄(cols) { return cols.map(csv셀).join(','); }

function 오늘날짜() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 한 거래소 폴더를 읽어 {행, 전체건수, 포함건수} 를 낸다. 둘 다 MIN_WEIGHT 로 자른다(대칭). */
function 거래소읽기(dir, 거래소이름) {
  let 전체 = 0; let 포함 = 0; const 행 = [];
  if (!existsSync(dir)) return { 행, 전체, 포함 };
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const j = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
    const symbol = j._meta?.symbol ?? f.replace(/\.json$/, '').split('-')[0];
    for (const it of (j.items ?? [])) {
      전체 += 1;
      if ((it.무게 ?? 0) < MIN_WEIGHT) continue;
      포함 += 1;
      행.push([거래소이름, symbol, it.date ?? '', it.무게 ?? '', it.태그 ?? '', it.title ?? '']);
    }
  }
  return { 행, 전체, 포함 };
}

function main() {
  const adx = 거래소읽기(ADX_DIR, 'ADX');
  const dfm = 거래소읽기(DFM_DIR, 'DFM');
  const 행 = [['exchange', 'symbol', 'date', 'weight', 'tag', 'title'], ...adx.행, ...dfm.행];

  if (행.length <= 1) { console.error('⛔ 못 쟀다 — 원본 공시 파일이 하나도 없다. 수집기를 먼저 돌린다'); process.exit(1); }

  const 날짜 = 오늘날짜();
  const 파일 = path.join(OUT_DIR, `uae-disclosures-digest-${날짜}.csv`);
  const 메타파일 = path.join(OUT_DIR, `uae-disclosures-digest-${날짜}.meta.json`);
  writeFileSync(파일, 행.map(csv줄).join('\r\n') + '\r\n');
  writeFileSync(메타파일, JSON.stringify({
    minWeight: MIN_WEIGHT,
    builtAt: new Date().toISOString(),
    adx: { total: adx.전체, included: adx.포함, excluded: adx.전체 - adx.포함 },
    dfm: { total: dfm.전체, included: dfm.포함, excluded: dfm.전체 - dfm.포함 },
    totalIncluded: adx.포함 + dfm.포함,
  }, null, 1));

  console.log(`ADX  전체 ${adx.전체}건 중 무게≥${MIN_WEIGHT} ${adx.포함}건 (뺀 ${adx.전체 - adx.포함}건)`);
  console.log(`DFM  전체 ${dfm.전체}건 중 무게≥${MIN_WEIGHT} ${dfm.포함}건 (뺀 ${dfm.전체 - dfm.포함}건)`);
  console.log(`✅ 합계 ${adx.포함 + dfm.포함}행 → ${path.relative(process.cwd(), 파일)}`);
  console.log(`   구성 기록 → ${path.relative(process.cwd(), 메타파일)}`);
  console.log(`\n⚠ licence-datasets.mjs 의 파일명을 이 날짜(${날짜})로 맞춘다.`);
}

main();
