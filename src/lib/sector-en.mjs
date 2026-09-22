/**
 * sector-en.mjs — **업종 이름을 영문으로.** (5번, 2026-09-22)
 *
 * ── 🔴 왜 (같은 날 22시, 지면을 띄워 보고 잡았다) ──────────────────────
 * `/company/hite-jinro` 를 지어 놓고 실제로 열어 보니 화면에 **「음료 제조」**가 한글로
 * 떠 있었다. 저장소 지시는 분명하다 — 「**화면에 한국어를 내지 않는다**」(영문 매체다).
 * 자료(DART 업종분류)가 한글이라 그대로 흘러나온 것이다.
 * ⇒ 2,515장 × 업종 줄이 전부 한글이 될 뻔했다.
 * ⭐ 이것은 «검사»로는 안 잡히고 **떠서 눈으로 봐야** 잡히는 자리였다.
 *
 * ── ⛔ 이 표가 지키는 것 ────────────────────────────────────────────────
 * ⛔ **모르는 업종을 짐작해서 옮기지 않는다.** 표에 없으면 null 을 돌려주고,
 *   지면은 그 줄을 «아예 안 그린다». 엉터리 영문을 만드는 것보다 낫다.
 * ⛔ 회사 «한글 이름»은 이 규칙에서 뺀다 — 그것은 번역할 것이 아니라 «식별자»다.
 *   한국 회사를 찾는 사람이 한글명으로도 찾는다. 괄호로 병기한다.
 * ⚠ 이름은 한국표준산업분류(KSIC) 중분류를 따른 것이라, 영문도 KSIC 영문판 쪽에 맞춘다.
 *   우리가 멋있게 지어내지 않는다.
 * ⚠ 주소(slug)는 영문 이름에서 만든다 — 한글 주소는 인코딩되어 읽을 수 없게 된다.
 */

/** DART/KSIC 한글 업종 → 영문. 2026-09-22 실측 61가지 전부 */
export const 업종영문 = {
  '1차 금속': 'Basic metals',
  '가구 제조': 'Furniture',
  '가죽·신발 제조': 'Leather and footwear',
  '건축기술·엔지니어링': 'Architecture and engineering',
  '고무·플라스틱': 'Rubber and plastics',
  '교육서비스업': 'Education services',
  '금속가공제품': 'Fabricated metal products',
  '금융·보험 관련 서비스': 'Financial and insurance services',
  '금융업': 'Finance',
  '기타 개인 서비스': 'Other personal services',
  '기타 과학기술 서비스': 'Other scientific and technical services',
  '기타 기계·장비': 'Other machinery and equipment',
  '기타 운송장비': 'Other transport equipment',
  '기타 제품 제조': 'Other manufacturing',
  '농업': 'Agriculture',
  '담배 제조': 'Tobacco',
  '도매·상품중개': 'Wholesale and commodity brokerage',
  '목재 제조': 'Wood products',
  '방송업': 'Broadcasting',
  '보험·연금': 'Insurance and pensions',
  '부동산업': 'Real estate',
  '비금속 광물제품': 'Non-metallic mineral products',
  '사업시설 관리': 'Facilities management',
  '사업지원 서비스': 'Business support services',
  '섬유제품 제조': 'Textiles',
  '소매업': 'Retail',
  '수리업': 'Repair services',
  '수상운송': 'Water transport',
  '숙박업': 'Accommodation',
  '스포츠·오락': 'Sports and recreation',
  '식료품 제조': 'Food products',
  '어업': 'Fishing',
  '연구개발업': 'Research and development',
  '영상·오디오 제작': 'Film, video and audio production',
  '육상운송': 'Land transport',
  '음료 제조': 'Beverages',
  '음식점·주점': 'Restaurants and bars',
  '의료·정밀·광학기기': 'Medical, precision and optical instruments',
  '의료용 물질·의약품': 'Pharmaceuticals',
  '의복 제조': 'Apparel',
  '인쇄·기록매체': 'Printing and recorded media',
  '자동차 판매': 'Motor vehicle sales',
  '자동차·트레일러': 'Motor vehicles and trailers',
  '전기·가스·증기': 'Electricity, gas and steam',
  '전기장비': 'Electrical equipment',
  '전문·과학·기술 서비스': 'Professional, scientific and technical services',
  '전문서비스업': 'Professional services',
  '전문직별 공사': 'Specialised construction',
  '전자부품·컴퓨터·통신장비': 'Electronic components, computers and communications equipment',
  '정보서비스업': 'Information services',
  '종합 건설': 'General construction',
  '창고·운송 관련': 'Warehousing and transport support',
  '창작·예술·여가': 'Arts, entertainment and leisure',
  '출판업': 'Publishing',
  '컴퓨터 프로그래밍·SI': 'Computer programming and systems integration',
  '코크스·석유정제': 'Coke and refined petroleum',
  '통신업': 'Telecommunications',
  '펄프·종이 제조': 'Pulp and paper',
  '폐기물 수집·처리': 'Waste collection and treatment',
  '항공운송': 'Air transport',
  '화학물질·화학제품': 'Chemicals and chemical products',
};

/** 한글 업종 → 영문. ⛔ 모르면 null. 짐작해서 옮기지 않는다 */
export function 업종말(한글) {
  const k = String(한글 ?? '').trim();
  if (!k) return null;
  return 업종영문[k] ?? null;
}

/** 영문 업종 → 주소 조각. ⛔ 한글 주소를 만들지 않는다 */
export function 업종주소(한글) {
  const en = 업종말(한글);
  if (!en) return null;
  return en.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv?.[1]?.endsWith('sector-en.mjs') && process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('🔴 지면에서 잡은 그 업종이 영문이 된다', 업종말('음료 제조') === 'Beverages');
  본다('삼성전자 업종도 된다', 업종말('전자부품·컴퓨터·통신장비')
    === 'Electronic components, computers and communications equipment');
  본다('제약도 된다', 업종말('의료용 물질·의약품') === 'Pharmaceuticals');
  본다('앞뒤 빈칸을 견딘다', 업종말('  금융업  ') === 'Finance');

  본다('🔴 모르는 업종은 «짐작하지 않고» null', 업종말('없는업종') === null);
  본다('⛔ 빈 것도 null', 업종말('') === null && 업종말(null) === null && 업종말(undefined) === null);

  본다('주소는 소문자 하이픈', 업종주소('음료 제조') === 'beverages');
  본다('긴 이름도 주소가 된다',
    업종주소('전자부품·컴퓨터·통신장비') === 'electronic-components-computers-and-communications-equipment');
  본다('쉼표가 하이픈이 된다', 업종주소('의료·정밀·광학기기') === 'medical-precision-and-optical-instruments');
  본다('⛔ 모르면 주소도 null', 업종주소('없는업종') === null);
  본다('⛔ 주소에 한글이 하나도 없다',
    Object.keys(업종영문).every((k) => { const s = 업종주소(k); return s === null || /^[a-z0-9-]+$/.test(s); }));
  본다('⛔ 영문 이름에 한글이 하나도 없다',
    Object.values(업종영문).every((v) => !/[가-힣]/.test(v)));

  /* ⭐ 자료에 있는 업종을 «하나도 빠짐없이» 덮나 — 한 곳이라도 빠지면 그 지면에 업종이 안 뜬다 */
  const fs = await import('node:fs');
  const path = await import('node:path');
  const url = await import('node:url');
  const 뿌리 = path.resolve(url.fileURLToPath(import.meta.url), '..', '..', '..');
  const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src', 'data', 'korea-financials-tape.json'), 'utf8'));
  const 자료업종 = [...new Set(j.rows.map((r) => r.sector).filter(Boolean))];
  const 빠진것 = 자료업종.filter((s) => 업종말(s) === null);
  본다(`⭐ 자료의 업종 ${자료업종.length}가지를 다 덮는다 (빠진 것 ${빠진것.length})`, 빠진것.length === 0);
  if (빠진것.length) console.log('   빠진 것 —', 빠진것.join(' · '));
  본다('⭐ 영문 이름이 겹치지 않는다 — 겹치면 두 업종이 한 주소를 쓴다',
    new Set(자료업종.map(업종주소)).size === 자료업종.length);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}
