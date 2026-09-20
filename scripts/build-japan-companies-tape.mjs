#!/usr/bin/env node
/**
 * build-japan-companies-tape.mjs — archive/raw/japan-jpx-companies 최신 판을
 * src/data/japan-listed-companies.json 으로 낸다 (커밋되는 판, /data/japan-listed-companies 가 읽는다).
 *
 * ⛔ archive/ 는 .gitignore 다 — Cloudtype 컨테이너엔 안 온다(과거 100yearmap 이 이 함정으로
 *   빌드가 3초 만에 죽은 적 있다). 그래서 이 자가 «커밋되는 판»을 따로 만든다.
 * ⛔ 시가총액 순이 아니다(JPX 자체 시세는 라이선스로 못 쓴다) — 자본금(資本金, 백만엔)을
 *   회사 규모의 대체 지표로 쓴다고 지면에 그대로 밝힌다. 실제 시총과 다를 수 있다.
 *
 * node scripts/build-japan-companies-tape.mjs --자가시험
 * node scripts/build-japan-companies-tape.mjs                무엇이 붙나만 잰다 (안 적는다)
 * node scripts/build-japan-companies-tape.mjs --적는다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료방 = path.join(뿌리, 'archive/raw/japan-jpx-companies');
const 낼곳 = path.join(뿌리, 'src/data/japan-listed-companies.json');

/**
 * TSE(도쿄증권거래소) 33업종 분류의 표준 영문명 — 공개적으로 통용되는 고정 대응표다.
 * ⛔ EDINET 코드리스트가 일본어 업종명만 주므로, 영문 사이트에 일본어를 그대로 못 낸다.
 * 「外国法人・組合」은 33업종이 아니라 EDINET 자체의 행정 갈래(외국법인)다.
 */
export const 업종영문 = {
  '情報・通信業': 'Information & Communication', 'サービス業': 'Services',
  '小売業': 'Retail Trade', '卸売業': 'Wholesale Trade', '電気機器': 'Electric Appliances',
  '機械': 'Machinery', '化学': 'Chemicals', '建設業': 'Construction', '不動産業': 'Real Estate',
  '食料品': 'Foods', 'その他製品': 'Other Products', '金属製品': 'Metal Products',
  '銀行業': 'Banks', '医薬品': 'Pharmaceutical', '輸送用機器': 'Transportation Equipment',
  '陸運業': 'Land Transportation', '精密機器': 'Precision Instruments',
  'ガラス・土石製品': 'Glass & Ceramics Products', '繊維製品': 'Textiles & Apparels',
  'その他金融業': 'Other Financing Business', '鉄鋼': 'Iron & Steel',
  '倉庫・運輸関連': 'Warehousing & Harbor Transportation Services',
  '証券、商品先物取引業': 'Securities & Commodity Futures', '非鉄金属': 'Nonferrous Metals',
  '電気・ガス業': 'Electric Power & Gas', 'パルプ・紙': 'Pulp & Paper',
  'ゴム製品': 'Rubber Products', '保険業': 'Insurance',
  '水産・農林業': 'Fishery, Agriculture & Forestry', '海運業': 'Marine Transportation',
  '石油・石炭製品': 'Oil & Coal Products', '鉱業': 'Mining', '空運業': 'Air Transportation',
  '外国法人・組合': 'Foreign corporations (EDINET filer type, not a TSE sector)',
};
/** 대응표에 없으면 원문을 그대로 두되 «못 옮겼다»는 것을 알 수 있게 표시한다. */
export function 업종옮기기(원문) {
  return 업종영문[원문] ?? `${원문} (untranslated)`;
}

/** 「2026年09月20日現在」(일본어 날짜) → 「20 September 2026」. 못 읽으면 원문을 그대로 둔다. */
export function 실행일영문(원문) {
  const m = String(원문 ?? '').match(/(\d{4})年(\d{2})月(\d{2})日/);
  if (!m) return 원문;
  const 달들 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const [, y, mo, d] = m;
  return `${Number(d)} ${달들[Number(mo) - 1]} ${y}`;
}

export function 최근원자료(파일들) {
  const 것 = (파일들 ?? []).filter((f) => /^\d{8}\.json$/.test(f)).sort();
  return 것.at(-1) ?? null;
}

export function 짓기(원본) {
  const 상장 = (원본.상장 ?? []);
  const 업종맵 = new Map();
  for (const r of 상장) {
    const k = 업종옮기기(r.industry || '(미상)');
    업종맵.set(k, (업종맵.get(k) ?? 0) + 1);
  }
  const 업종별 = [...업종맵.entries()].map(([업종, 건수]) => ({ 업종, 건수 })).sort((a, b) => b.건수 - a.건수);

  const 회사들 = 상장.map((r) => ({
    edinetCode: r.edinetCode,
    securitiesCode: r.securitiesCode,
    nameEn: r.nameEn,
    name: r.name,
    industry: 업종옮기기(r.industry),
    industryJa: r.industry,
    capitalMillionYen: Number(r.capital) || null,
    fiscalYearEnd: r.fiscalYearEnd,
    corporateNumber: r.corporateNumber,
  })).sort((a, b) => (b.capitalMillionYen ?? -1) - (a.capitalMillionYen ?? -1));

  return {
    생성일: new Date().toLocaleString('ko-KR'),
    EDINET실행일: 실행일영문(원본.EDINET실행일 ?? null),
    출처: 원본.출처 ?? 'EDINET 코드리스트 — 금융청(Financial Services Agency)',
    출처주소: 원본.출처주소 ?? 'https://disclosure2.edinet-fsa.go.jp/weee0010.aspx',
    라이선스: 원본.라이선스 ?? 'CC BY (PDL1.0)',
    전체건수: 원본.전체건수 ?? null,
    상장건수: 회사들.length,
    업종별,
    회사들,
  };
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };

  본다('① 최근원자료 — 날짜순 마지막을 고른다',
    최근원자료(['20260918.json', '20260920.json', '20260919.json', 'README.md']) === '20260920.json');
  본다('② 최근원자료 — 후보가 없으면 null', 최근원자료([]) === null);

  const 표본 = {
    전체건수: 3, EDINET실행일: '2026年09月20日現在',
    출처: 'x', 출처주소: 'y', 라이선스: 'z',
    상장: [
      { edinetCode: 'E1', securitiesCode: '1000', nameEn: 'A CO', name: 'A社', industry: '食料品', capital: '100', fiscalYearEnd: '3月31日', corporateNumber: '1' },
      { edinetCode: 'E2', securitiesCode: '2000', nameEn: 'B CO', name: 'B社', industry: '食料品', capital: '500', fiscalYearEnd: '3月31日', corporateNumber: '2' },
      { edinetCode: 'E3', securitiesCode: '3000', nameEn: 'C CO', name: 'C社', industry: '銀行業', capital: '', fiscalYearEnd: '3月31日', corporateNumber: '3' },
    ],
  };
  const 결과 = 짓기(표본);
  본다('③ 상장건수를 센다', 결과.상장건수 === 3);
  본다('④ 업종별로 묶어 세고 큰 순으로 낸다', 결과.업종별[0].업종 === 'Foods' && 결과.업종별[0].건수 === 2 && 결과.업종별.some((x) => x.업종 === 'Banks'));
  본다('⑤ 자본금 큰 순으로 정렬한다', 결과.회사들[0].nameEn === 'B CO' && 결과.회사들[1].nameEn === 'A CO');
  본다('⑥ 자본금 빈칸은 null 이지 0 이 아니다(꼴찌로 밀리되 값을 지어내지 않는다)',
    결과.회사들[2].capitalMillionYen === null);
  본다('⑦ 출처·라이선스가 그대로 실린다', 결과.출처 === 'x' && 결과.라이선스 === 'z');
  본다('⑧ 업종명을 영문으로 옮긴다', 결과.회사들[0].industry === 'Foods');
  본다('⑨ 원문 일본어 업종도 따로 남긴다', 결과.회사들.every((c) => typeof c.industryJa === 'string'));
  본다('⑩ 못 옮긴 업종이 있으면 «표시»한다(조용히 원문을 안 낸다)',
    업종옮기기('없는업종') === '없는업종 (untranslated)');
  본다('⑫ 일본어 날짜를 영문으로 옮긴다', 실행일영문('2026年09月20日現在') === '20 September 2026');
  본다('⑬ 못 읽으면 원문을 그대로 둔다', 실행일영문('알수없음') === '알수없음');

  if (fs.existsSync(원자료방)) {
    const 파일 = 최근원자료(fs.readdirSync(원자료방));
    if (파일) {
      const 원본실제 = JSON.parse(fs.readFileSync(path.join(원자료방, 파일), 'utf8'));
      const 실제업종들 = [...new Set((원본실제.상장 ?? []).map((r) => r.industry))];
      const 못옮긴것 = 실제업종들.filter((k) => !(k in 업종영문));
      본다(`⑪ 실제 원자료(${파일})의 업종이 전부 대응표에 있다${못옮긴것.length ? ` — 못 옮긴 것: ${못옮긴것.join(' · ')}` : ''}`,
        못옮긴것.length === 0);
    }
  }

  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-japan-companies-tape.mjs';
if (내가직접불렸나) {
  if (!fs.existsSync(원자료방)) { console.log('🔴 원자료 폴더가 없다 —', 원자료방); process.exit(1); }
  const 파일 = 최근원자료(fs.readdirSync(원자료방));
  if (!파일) { console.log('🔴 원자료 파일이 없다 —', 원자료방); process.exit(1); }
  const 원본 = JSON.parse(fs.readFileSync(path.join(원자료방, 파일), 'utf8'));
  const 나온것 = 짓기(원본);

  console.log(`원자료 ${파일} → 상장 ${나온것.상장건수}개사 · 업종 ${나온것.업종별.length}갈래`);
  console.log(`자본금 최대 ${나온것.회사들[0]?.nameEn}(${나온것.회사들[0]?.capitalMillionYen}백만엔)`);

  if (process.argv.includes('--적는다')) {
    fs.writeFileSync(낼곳, JSON.stringify(나온것, null, 1), 'utf8');
    console.log(`✅ ${낼곳} 에 적었다`);
  } else {
    console.log('⬜ 미리보기만 했다. 적으려면 --적는다 를 붙인다.');
  }
}
