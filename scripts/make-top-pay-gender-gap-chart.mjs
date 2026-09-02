#!/usr/bin/env node
/**
 * make-top-pay-gender-gap-chart.mjs — 「평균급여 1억 이상」 상위 기업의 성별 격차.
 *   재료: DART empSttus(임직원 현황, 반기보고서 2026) — CEOScore 9/2 보도(상위10 중 9곳
 *   원문에서 재현·검증 완료)를 계기로, 같은 공시의 성별 항목까지 우리가 직접 받는다.
 *   ⛔ CEOScore 순위를 베끼지 않는다 — corp_code부터 DART 원본을 다시 부른다(재현 가능).
 * 출력: public/charts/top-pay-gender-gap.svg · src/data/top-pay-gender-gap.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { 합치기 } from './collect-tenure.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const CHARTS = path.join(ROOT, 'public/charts');

function 키읽기() {
  const p = path.join(ROOT, '.env');
  if (!fs.existsSync(p)) return process.env.DART_API_KEY ?? '';
  for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = l.match(/^DART_API_KEY\s*=\s*(.+)/); if (m) return m[1].trim().replace(/^["']|["']$/g, ''); }
  return process.env.DART_API_KEY ?? '';
}
const K = 키읽기();

/** 2026-09-02 CEOScore 보도(청년일보·이투데이 등)의 상위 10곳 — 우리가 지어낸 목록이 아니다 */
export const 대상 = [
  { corp: '한국금융지주', cc: '00432102', en: 'Korea Investment Holdings' },
  { corp: '메리츠증권', cc: '00163682', en: 'Meritz Securities' },
  { corp: '한국투자증권', cc: '00160144', en: 'Korea Investment & Securities' },
  { corp: '유안타증권', cc: '00117601', en: 'Yuanta Securities Korea' },
  { corp: 'SK하이닉스', cc: '00164779', en: 'SK hynix' },
  { corp: '두나무', cc: '01310241', en: 'Dunamu' },
  { corp: '미래에셋증권', cc: '00311030', en: 'Mirae Asset Securities' },
  { corp: '메리츠금융지주', cc: '00860332', en: 'Meritz Financial Group' },
  { corp: '하나증권', cc: '00113465', en: 'Hana Securities' },
  { corp: 'NH투자증권', cc: '00120182', en: 'NH Investment & Securities' },
];

async function empSttus(cc) {
  const url = `https://opendart.fss.or.kr/api/empSttus.json?crtfc_key=${K}&corp_code=${cc}&bsns_year=2026&reprt_code=11012`;
  const r = await fetch(url);
  const j = await r.json();
  return j.status === '000' ? (j.list || []) : null;
}

async function main() {
  if (!K) { console.log('⛔ DART_API_KEY 없음.'); process.exit(1); }
  const rows = [];
  for (const t of 대상) {
    const list = await empSttus(t.cc);
    if (!list) { rows.push({ ...t, 못잼: true }); continue; }
    const 합 = 합치기(list);
    if (합.급여남 == null || 합.급여여 == null) { rows.push({ ...t, 못잼: true }); continue; }
    const 전체 = ((합.급여남 * (합.남 ?? 0)) + (합.급여여 * (합.여 ?? 0))) / ((합.남 ?? 0) + (합.여 ?? 0) || 1);
    rows.push({ ...t, 남: Math.round(합.급여남), 여: Math.round(합.급여여), 전체: Math.round(전체), 배수: +(합.급여남 / 합.급여여).toFixed(2), 남인원: 합.남, 여인원: 합.여 });
    await new Promise((r) => setTimeout(r, 150));
  }
  const 잰것 = rows.filter((r) => !r.못잼).sort((a, b) => b.배수 - a.배수);
  const 못잰것 = rows.filter((r) => r.못잼);
  if (!잰것.length) { console.log('⚠ 못 쟀다 — 전부 실패.'); process.exit(0); }

  fs.mkdirSync(CHARTS, { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'src/data/top-pay-gender-gap.json'), JSON.stringify({
    출처: 'DART empSttus, 2026 반기보고서(11012), 재현일 ' + new Date().toISOString().slice(0, 10),
    참고: 'CEOScore 2026-09-02 보도(상위10곳)를 계기로 DART 원본에서 재수집·검증', rows: 잰것, 못잰것,
  }, null, 1));

  const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', M = '#1d4ed8', F = '#b91c1c';
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const W = 768, rowH = 30, MT = 60, ML = 190, MR = 60, H = MT + 잰것.length * rowH + 30;
  const iw = W - ML - MR, max = Math.max(...잰것.map((r) => r.남)), scale = iw / max;
  let bars = '';
  잰것.forEach((r, i) => {
    const y = MT + i * rowH, bh = rowH * 0.32;
    const wM = r.남 * scale, wF = r.여 * scale;
    bars += `<text x="${ML - 10}" y="${y + bh + 2}" text-anchor="end" font-size="11.5" fill="${INK}">${esc(r.en)}</text>`;
    bars += `<rect x="${ML}" y="${y}" width="${wM.toFixed(1)}" height="${bh}" fill="${M}" rx="2"/>`;
    bars += `<rect x="${ML}" y="${(y + bh + 3).toFixed(1)}" width="${wF.toFixed(1)}" height="${bh}" fill="${F}" rx="2"/>`;
    bars += `<text x="${(ML + Math.max(wM, wF) + 6).toFixed(1)}" y="${(y + bh + 2).toFixed(1)}" font-size="11" font-weight="700" fill="${INK}">${r.배수}x</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Gender pay gap at nine Korean companies reported to have average employee pay above 100 million won, men's average bar above women's for each company">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="24" y="26" font-size="16" font-weight="700" fill="${INK}">The '₩100m average' is mostly men's pay</text>
<text x="24" y="42" font-size="12" fill="${SUB}">Men (blue) vs women (red), average pay, H1 2026 — same 9 companies CEOScore reported as Korea's highest-paying</text>
${bars}
<text x="${W - MR}" y="${H - 10}" text-anchor="end" font-size="10" fill="${SUB}">Source: DART half-year reports (empSttus), re-pulled and verified by SeoulMarkets</text>
</svg>`;
  fs.writeFileSync(path.join(CHARTS, 'top-pay-gender-gap.svg'), svg);
  console.log(`✅ ${잰것.length}곳 재현·성별격차 계산 · 못잰 ${못잰것.length}곳(${못잰것.map((r) => r.corp).join(',')}) · 최대격차 ${잰것[0].en} ${잰것[0].배수}x`);
}
main();
