#!/usr/bin/env node
/**
 * collect-cpi-telecom-base-effect.mjs — 「물가 통신비 착시」를 우리가 직접 잰다.
 *
 * ── 왜 (2026-09-03, 5번 뉴스소재④) ──────────────────────────────
 * 9/2 8월 CPI 발표(헤드라인 3.1%↑)를 두 신문이 「통신비 착시」로 설명했다 —
 * 2025년 8월 「휴대전화비 반값할인」의 기저효과라고. 기재부 추정은 「빼면 2.5%」.
 * 우리는 그 추정을 그대로 베끼지 않고, KOSIS DT_1J22001(지출목적별 소비자물가지수,
 * objL 2단계 — kosis-probe.mjs로 확인)에서 원자료를 직접 당겨 어느 항목이
 * 얼마나 흔들렸는지 잰다.
 * ⛔ 가중치 표를 못 찾아(2026-09-03 탐색) 「기여도(%p)」는 우리가 다시 계산하지 않는다 —
 *   기재부의 「2.5%」는 «인용»으로만 쓰고, 우리 몫은 «지수 자체의 흔들림»이다.
 * 출처: KOSIS(국가데이터처) 소비자물가조사, 시세 아님 — FSC 9/9 무관.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');

function 키읽기() {
  const 파일 = path.join(ROOT, '.env');
  const env = fs.readFileSync(파일, 'utf8');
  const m = env.match(/^KOSIS_API_KEY\s*=\s*(.+)$/m);
  if (!m) throw new Error('.env 에 KOSIS_API_KEY 가 없다');
  return m[1].trim();
}

export function 변화율(이전, 이번) {
  if (이전 == null || 이번 == null || 이전 === 0) return null;
  return +(((이번 - 이전) / 이전) * 100).toFixed(2);
}

const 대상항목 = [
  { code: 'H', name_en: 'Communications (all)', name_kr: '08 통신' },
  { code: 'H03', name_en: 'Telephone & fax services', name_kr: '08.3 전화 및 팩스 서비스' },
  { code: 'H03101', name_en: 'Landline fee', name_kr: '유선전화료' },
  { code: 'H03102', name_en: 'Mobile phone fee', name_kr: '휴대전화료' },
  { code: 'H03103', name_en: 'Internet fee', name_kr: '인터넷이용료' },
];

async function 조회(키, prdDe) {
  const url = `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${키}&itmId=ALL&objL1=ALL&objL2=ALL&format=json&jsonVD=Y&prdSe=M&startPrdDe=${prdDe}&endPrdDe=${prdDe}&orgId=101&tblId=DT_1J22001`;
  const j = await (await fetch(url)).json();
  if (!Array.isArray(j)) throw new Error(`KOSIS 응답 이상 — ${JSON.stringify(j).slice(0, 200)}`);
  return j.filter((x) => x.C1 === 'T10'); // 전국
}

if (process.argv.includes('--자가시험')) {
  let 실패 = 0;
  const 검 = (m, ok) => { if (!ok) { 실패++; console.log('  ❌', m); } };
  검('변화율 계산', 변화율(100, 110) === 10);
  검('변화율 반올림(둘째자리)', 변화율(80.52, 102.05) === 26.74);
  검('이전값 0이면 null', 변화율(0, 10) === null);
  검('값 없으면 null', 변화율(null, 10) === null);
  검('⛔ 실제사례 — 휴대전화료 변화율이 총지수보다 훨씬 크다', 변화율(80.52, 102.05) > 변화율(116.45, 120.05) * 5);
  console.log(실패 === 0 ? '✅ 자가시험 — 통과' : `❌ 자가시험 — 실패 ${실패}`);
  process.exit(실패 === 0 ? 0 : 1);
} else {
  const 키 = 키읽기();
  const [작년월, 올해월] = process.argv.slice(2).length === 2 ? process.argv.slice(2) : ['202508', '202608'];
  const [작년행, 올해행] = await Promise.all([조회(키, 작년월), 조회(키, 올해월)]);
  const rows = 대상항목.map((it) => {
    const a = 작년행.find((x) => x.C2 === it.code);
    const b = 올해행.find((x) => x.C2 === it.code);
    if (!a || !b) return { ...it, 이전: null, 이번: null, 변화율: null, 못잼: true };
    const 이전 = Number(a.DT), 이번 = Number(b.DT);
    return { ...it, 이전, 이번, 변화율: 변화율(이전, 이번) };
  });
  const 총지수 = { 이전: Number(작년행.find((x) => x.C2 === '0')?.DT), 이번: Number(올해행.find((x) => x.C2 === '0')?.DT) };
  총지수.변화율 = 변화율(총지수.이전, 총지수.이번);

  console.log(`✅ 총지수 ${작년월}→${올해월}: ${총지수.이전}→${총지수.이번} (${총지수.변화율}%)`);
  for (const r of rows) console.log(`   ${r.code} ${r.name_kr}: ${r.이전}→${r.이번} (${r.변화율 ?? '못잼'}%)`);

  fs.writeFileSync(path.join(ROOT, 'src/data/cpi-telecom-base-effect.json'), JSON.stringify({
    출처: 'KOSIS(국가데이터처) DT_1J22001 지출목적별 소비자물가지수, 전국(T10)',
    기간: { 작년월, 올해월 },
    총지수,
    항목: rows,
    참고: '기재부 발표(9/2)는 이 기저효과를 빼면 8월 상승률이 2.5%라 추정 — 그 %p는 인용, 지수 자체는 우리가 직접 KOSIS에서 당겼다',
  }, null, 1));

  const CHARTS = path.join(ROOT, 'public/charts');
  fs.mkdirSync(CHARTS, { recursive: true });
  const INK = '#0f172a', SUB = '#64748b', BG = '#ffffff', ACC = '#1d4ed8', HOT = '#b91c1c';
  const 막대 = [
    { label: 'Overall CPI', v: 총지수.변화율 },
    { label: 'Communications (all)', v: rows[0].변화율 },
    { label: 'Landline fee', v: rows[2].변화율 },
    { label: 'Internet fee', v: rows[4].변화율 },
    { label: 'Mobile phone fee', v: rows[3].변화율 },
  ];
  const W = 680, H = 60 + 막대.length * 40 + 30, ML = 170, MR = 60, MT = 46, MB = 24;
  const max = Math.max(...막대.map((r) => r.v)) * 1.15, iw = W - ML - MR, scale = iw / max;
  const step = (H - MT - MB) / 막대.length, bh = Math.min(24, step * 0.6);
  let bars = '';
  막대.forEach((r, i) => {
    const cy = MT + step * i + step / 2, w = r.v * scale, color = r.label === 'Mobile phone fee' ? HOT : ACC;
    bars += `<rect x="${ML}" y="${(cy - bh / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${bh}" fill="${color}" rx="2"/>` +
      `<text x="${ML - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="${INK}">${r.label}</text>` +
      `<text x="${(ML + w + 6).toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-size="11.5" font-weight="700" fill="${color}">+${r.v}%</text>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Georgia,'Times New Roman',serif" role="img" aria-label="Year-on-year change in Korea's August CPI: overall +3.09%, communications overall +16.63%, but landline and internet fees barely moved while the mobile phone fee sub-index jumped 26.74% on a base effect from last year's discount">
<rect width="${W}" height="${H}" fill="${BG}"/>
<text x="20" y="26" font-size="15" font-weight="700" fill="${INK}">One phone bill line moved 26.7% — the rest of "communications" barely did</text>
${bars}
<text x="${W - MR}" y="${H - 6}" text-anchor="end" font-size="10" fill="${SUB}">Source: KOSIS, CPI by expenditure category, Aug 2025 vs Aug 2026, whole country</text>
</svg>`;
  fs.writeFileSync(path.join(CHARTS, 'cpi-telecom-base-effect.svg'), svg);
}
