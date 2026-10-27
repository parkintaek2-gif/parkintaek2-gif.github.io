/**
 * sector-targets.mjs — 업종별 목표주가 지면(/data/korea-*-target-prices)의 «업종 표».
 *
 * ── 왜 (2026-10-27 · 1번) ────────────────────────────────────────────────
 * 반도체 한 화면(41a3db0b5)을 해외 개인 투자자가 가장 많이 찾는 업종 넷(조선·방산·2차전지·제약바이오)으로
 * 넓힌다. 네 벌을 베끼지 않고 «업종 표 하나»에 규칙·예외·놓치는 예·지면 문구를 둔다.
 *   빌더  scripts/build-korea-sector-targets.mjs  (이 표를 읽어 src/data/korea-<key>-targets.json 을 만든다)
 *   지면  src/components/SectorTargetPage.astro    (이 표의 문구를 그대로 그린다)
 *   회사  src/pages/company/[slug].astro           (리서치 구역에서 그 회사가 든 업종 지면을 가리킨다)
 *
 * ⛔ 업종은 DART 기업개황의 KSIC 코드로 가른다. 손으로 고르지 않는다.
 * ⛔ 코드 밖에서 «이름을 박아» 넣는 곳은 까닭을 지면에 적는다(사업보고서 부문 정보 — archive/raw/dart-segments).
 * ⛔ 규칙이 놓치는 곳도 지면에 적는다 — 넣지는 않는다.
 * ⛔ 이 파일의 영문은 화면에 그대로 나간다 — 한글을 넣지 않는다(주석만 한글).
 * ⚠ 반도체 줄은 41a3db0b5 의 출력과 «한 글자도» 같아야 한다(빌더 자가시험과 JSON 비교로 잰다).
 */

/** @typedef {{ reason: string }} 예외 */

export const 업종표 = [
  {
    key: 'semiconductor',
    path: '/data/korea-semiconductor-target-prices',
    dataFile: 'src/data/korea-semiconductor-targets.json',
    builtBy: 'scripts/build-korea-semiconductor-targets.mjs — do not edit by hand',
    /* 규칙 — KSIC 261 으로 시작하거나 29271 이면 반도체 */
    rule: (k) => /^261/.test(k) || k === '29271',
    ruleText: 'KSIC code on the DART company register starts with 261 (manufacture of semiconductors) or is 29271 (machinery for semiconductor manufacturing); plus companies named in namedAdditions.',
    what: 'Korean semiconductor companies with broker research in our sample: per-company target-price distribution and latest close.',
    ksicEn: {
      '261': 'Semiconductors',
      '2611': 'Electronic integrated circuits',
      '26111': 'Memory integrated circuits',
      '26112': 'Non-memory and other integrated circuits',
      '2612': 'Diodes, transistors and similar semiconductor devices',
      '26121': 'Light-emitting diodes',
      '26129': 'Other semiconductor devices',
      '29271': 'Machinery for semiconductor manufacturing',
    },
    named: {
      '005930': {
        reason: 'Filed under KSIC 264 (communication and broadcasting equipment), but its 2025 business report lists the Device Solutions (DS) semiconductor division as a separate reporting segment.',
      },
    },
    misses: ['240810', '058470', '357780', '232140', '003160'],
    missKsicEn: {
      '292': 'special-purpose machinery', '2629': 'other electronic components', '204': 'other chemical products',
      '27212': 'measuring, testing and analysing instruments',
    },
    /* 지면 문구 */
    title: 'Korean semiconductor stocks — analyst target prices & ratings (SK hynix, Samsung Electronics …)',
    titleNames: ['SK hynix', 'Samsung Electronics'],
    h1: 'Korean semiconductor stocks: analyst target prices and ratings',
    kicker: 'Korean semiconductors · broker research in English',
    datasetName: 'Korean semiconductor stocks: broker target prices and ratings',
    descNoun: 'Korean chip stocks',
    leadNoun: 'Korean chip companies',
    quoted: 'semiconductor',
    plural: 'Korean semiconductor stocks',
    shortLabel: 'Semiconductors',
    ruleHtml: 'A company is included when the industry code on its record in the Korean regulator\'s company register (DART) starts with <b>261</b> — manufacture of semiconductors, covering integrated circuits (memory and non-memory) and discrete devices such as diodes, transistors and LEDs — or is <b>29271</b>, manufacture of machinery for semiconductor manufacturing. The codes are the Korean Standard Industrial Classification (KSIC); the English names are our rendering of them.',
    missLead: 'The rule misses companies that serve the chip industry but file under another code. Examples with research in our sample, left out of the table:',
  },
  {
    key: 'shipbuilding',
    path: '/data/korea-shipbuilding-target-prices',
    dataFile: 'src/data/korea-shipbuilding-targets.json',
    builtBy: 'scripts/build-korea-sector-targets.mjs — do not edit by hand',
    /* KSIC 311 선박 및 보트 건조업(3111 선박·수상 부유 구조물, 그 부분품 포함) */
    rule: (k) => /^311/.test(k),
    ruleText: 'KSIC code on the DART company register starts with 311 (building of ships and boats, including floating structures and ship sections); plus companies named in namedAdditions.',
    what: 'Korean shipbuilding companies with broker research in our sample: per-company target-price distribution and latest close.',
    ksicEn: {
      '311': 'Building of ships and boats',
      '3111': 'Building of ships and floating structures',
    },
    named: {
      '009540': {
        reason: 'Filed under KSIC 64992 (holding companies), but its business report filed with DART in March 2025 puts the shipbuilding segment at 82.0% of its 2024 revenue.',
      },
    },
    misses: ['082740', '071970', '443060', '033500'],
    missKsicEn: {
      '29111': 'internal combustion engines', '29119': 'other engines and turbines',
      '7212': 'engineering services', '201': 'basic chemicals',
    },
    title: 'Korean shipbuilding stocks — analyst target prices & ratings (HD Hyundai Heavy, Hanwha Ocean …)',
    titleNames: ['HD Hyundai Heavy', 'Hanwha Ocean'],
    h1: 'Korean shipbuilding stocks: analyst target prices and ratings',
    kicker: 'Korean shipbuilders · broker research in English',
    datasetName: 'Korean shipbuilding stocks: broker target prices and ratings',
    descNoun: 'Korean shipbuilding stocks',
    leadNoun: 'Korean shipbuilders',
    quoted: 'shipbuilding',
    plural: 'Korean shipbuilding stocks',
    shortLabel: 'Shipbuilding',
    ruleHtml: 'A company is included when the industry code on its record in the Korean regulator\'s company register (DART) starts with <b>311</b> — building of ships and boats, which covers ships, floating structures and ship sections. The codes are the Korean Standard Industrial Classification (KSIC); the English names are our rendering of them.',
    missLead: 'The rule misses companies that build engines, equipment or materials for ships but file under another code. Examples with research in our sample whose filings name shipbuilders or ships as their market, left out of the table:',
  },
  {
    key: 'defense',
    path: '/data/korea-defense-target-prices',
    dataFile: 'src/data/korea-defense-targets.json',
    builtBy: 'scripts/build-korea-sector-targets.mjs — do not edit by hand',
    /* KSIC 252 무기·총포탄 + 313 항공기·우주선·부품 */
    rule: (k) => /^252/.test(k) || /^313/.test(k),
    ruleText: 'KSIC code on the DART company register starts with 252 (weapons and ammunition) or 313 (aircraft, spacecraft and their engines and parts); plus companies named in namedAdditions.',
    what: 'Korean defense and aerospace companies with broker research in our sample: per-company target-price distribution and latest close.',
    ksicEn: {
      '252': 'Weapons and ammunition',
      '25200': 'Weapons and ammunition',
      '313': 'Aircraft, spacecraft and parts',
      '31311': 'Manned aircraft, spacecraft and auxiliary equipment',
      '31312': 'Unmanned aircraft and drones',
      '31321': 'Aircraft engines',
      '31322': 'Aircraft parts',
    },
    named: {
      '064350': {
        reason: 'Filed under KSIC 31910 (railway equipment), but its business report filed with DART in March 2025 reports defense as one of its three operating segments, alongside rail and plant.',
      },
      '272210': {
        reason: 'Filed under KSIC 26299 (other electronic components), but its business report filed with DART in March 2025 gives its defense segment KRW 2,098.8bn of KRW 2,803.7bn total 2024 revenue (74.9%).',
      },
    },
    misses: ['103140', '000880', '064960'],
    missKsicEn: { '242': 'non-ferrous metals', '20494': 'explosives', '303': 'motor vehicle parts' },
    title: 'Korean defense & aerospace stocks — analyst target prices & ratings (Hanwha Aerospace, Hyundai Rotem …)',
    titleNames: ['Hanwha Aerospace', 'Hyundai Rotem'],
    h1: 'Korean defense and aerospace stocks: analyst target prices and ratings',
    kicker: 'Korean defense and aerospace · broker research in English',
    datasetName: 'Korean defense and aerospace stocks: broker target prices and ratings',
    descNoun: 'Korean defense and aerospace stocks',
    leadNoun: 'Korean defense and aerospace companies',
    quoted: 'defense and aerospace',
    plural: 'Korean defense and aerospace stocks',
    shortLabel: 'Defense & aerospace',
    ruleHtml: 'A company is included when the industry code on its record in the Korean regulator\'s company register (DART) starts with <b>252</b> — manufacture of weapons and ammunition — or <b>313</b>, manufacture of aircraft and spacecraft and of their engines and parts. The codes are the Korean Standard Industrial Classification (KSIC); the English names are our rendering of them.',
    missLead: 'The rule misses companies with a defense business that file under another code because something else is their larger line. Examples with research in our sample whose filings report defense products, left out of the table:',
  },
  {
    key: 'battery',
    path: '/data/korea-battery-target-prices',
    dataFile: 'src/data/korea-battery-targets.json',
    builtBy: 'scripts/build-korea-sector-targets.mjs — do not edit by hand',
    /* KSIC 282 일차전지·축전지 */
    rule: (k) => /^282/.test(k),
    ruleText: 'KSIC code on the DART company register starts with 282 (manufacture of batteries and accumulators); plus companies named in namedAdditions.',
    what: 'Korean battery companies with broker research in our sample: per-company target-price distribution and latest close.',
    ksicEn: {
      '282': 'Batteries and accumulators',
      '28201': 'Primary cells and batteries',
      '28202': 'Accumulators (rechargeable batteries)',
    },
    named: {
      '086520': {
        reason: 'Filed under KSIC 64992 (holding companies), but its business report filed with DART in March 2025 gives its battery-materials segment (cathode materials, through EcoPro BM) KRW 3,296.5bn of 2024 sales before intra-group eliminations, against KRW 234.5bn for its environment segment.',
      },
    },
    misses: ['051910', '278280'],
    missKsicEn: { '20111': 'basic petrochemicals', '201': 'basic chemicals' },
    title: 'Korean EV battery stocks — analyst target prices & ratings (LG Energy Solution, Samsung SDI …)',
    titleNames: ['LG Energy Solution', 'Samsung SDI'],
    h1: 'Korean EV battery and battery-materials stocks: analyst target prices and ratings',
    kicker: 'Korean batteries · broker research in English',
    datasetName: 'Korean battery stocks: broker target prices and ratings',
    descNoun: 'Korean battery and battery-materials stocks',
    leadNoun: 'Korean battery makers',
    quoted: 'battery',
    plural: 'Korean battery stocks',
    shortLabel: 'EV batteries',
    ruleHtml: 'A company is included when the industry code on its record in the Korean regulator\'s company register (DART) starts with <b>282</b> — manufacture of batteries and accumulators, rechargeable or not. Several cathode-material makers file under this code too, so they appear here. The codes are the Korean Standard Industrial Classification (KSIC); the English names are our rendering of them.',
    missLead: 'The rule misses companies with a battery or battery-materials business that file under a chemicals code. Examples with research in our sample whose filings report a battery or battery-materials segment, left out of the table:',
  },
  {
    key: 'biotech',
    path: '/data/korea-biotech-target-prices',
    dataFile: 'src/data/korea-biotech-targets.json',
    builtBy: 'scripts/build-korea-sector-targets.mjs — do not edit by hand',
    /* KSIC 21 의약품(전체 중분류) + 70113 의학·약학 연구개발업 */
    rule: (k) => /^21/.test(k) || /^70113/.test(k),
    ruleText: 'KSIC code on the DART company register starts with 21 (pharmaceuticals, medicinal chemicals and medical supplies) or is 70113 (medical and pharmaceutical research and development); plus companies named in namedAdditions.',
    what: 'Korean biotech and pharmaceutical companies with broker research in our sample: per-company target-price distribution and latest close.',
    ksicEn: {
      '21': 'Pharmaceuticals and medical supplies',
      '211': 'Basic medicinal substances and biological products',
      '212': 'Medicines',
      '213': 'Medical supplies',
      '70113': 'Medical and pharmaceutical research and development',
    },
    named: {
      '326030': {
        reason: 'Filed under KSIC 7011 (natural-science research) rather than the narrower 70113, but its business report filed with DART in March 2025 describes a single operating segment, new drugs.',
      },
    },
    misses: ['310210', '476060', '468530', '394800'],
    missKsicEn: { '701': 'natural-science and engineering research' },
    title: 'Korean biotech & pharma stocks — analyst target prices & ratings (Samsung Biologics, Celltrion …)',
    titleNames: ['Samsung Biologics', 'Celltrion'],
    h1: 'Korean biotech and pharma stocks: analyst target prices and ratings',
    kicker: 'Korean biotech and pharma · broker research in English',
    datasetName: 'Korean biotech and pharma stocks: broker target prices and ratings',
    descNoun: 'Korean biotech and pharma stocks',
    leadNoun: 'Korean drug makers and biotech companies',
    quoted: 'biotech and pharma',
    plural: 'Korean biotech and pharma stocks',
    shortLabel: 'Biotech & pharma',
    ruleHtml: 'A company is included when the industry code on its record in the Korean regulator\'s company register (DART) starts with <b>21</b> — the whole KSIC division for basic medicinal substances, biological products, medicines and medical supplies — or is <b>70113</b>, medical and pharmaceutical research and development. Division 21 also holds makers of botulinum toxin, health supplements and medical supplies, and they appear here because that is what they filed. The codes are the Korean Standard Industrial Classification (KSIC); the English names are our rendering of them.',
    missLead: 'The rule leaves out companies filed under the broader research code 701 (natural sciences and engineering), which does not say whether the research is into medicines. We did not check each one by hand. Examples with research in our sample, left out of the table:',
  },
];

export const 업종 = (key) => 업종표.find((s) => s.key === key) ?? null;

/** 업종코드 → 이 업종인가(규칙만 — 이름 박은 예외는 따로) */
export function 규칙에드나(sector, 업종코드) {
  const k = String(업종코드 ?? '').trim();
  if (!k) return false;
  return sector.rule(k);
}
