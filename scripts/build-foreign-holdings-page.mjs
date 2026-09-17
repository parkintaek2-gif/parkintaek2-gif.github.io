#!/usr/bin/env node
/**
 * build-foreign-holdings-page.mjs — archive/raw/imf-pip/KOR-mirror.json(gitignore 됨)을
 * src/data/imf-pip-korea.json(작고 커밋되는 것)으로 줄인다. 「누가 한국 증권을 들고 있나」 지면용.
 *
 * ⛔ archive/ 는 .gitignore 다 — Cloudtype 컨테이너에는 아예 존재하지 않는다.
 *   지면이 빌드 때 읽는 자료는 반드시 src/data/ 에 있어야 한다(이 저장소의 일관된 규칙).
 *
 *   node scripts/build-foreign-holdings-page.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { 그해표 } from './collect-imf-pip-mirror.mjs';

/** ISO 3166-1 alpha-3 → 영문 이름. 없는 코드는 코드 그대로 보여준다(짓지 않는다). */
export const ISO3이름 = {
  USA: 'United States', GBR: 'United Kingdom', LUX: 'Luxembourg', JPN: 'Japan',
  CYM: 'Cayman Islands', FRA: 'France', CHN: 'China', AUS: 'Australia', CAN: 'Canada',
  IRL: 'Ireland', DEU: 'Germany', NLD: 'Netherlands', CHE: 'Switzerland', SGP: 'Singapore',
  HKG: 'Hong Kong', BMU: 'Bermuda', VGB: 'British Virgin Islands', BRA: 'Brazil',
  IND: 'India', ITA: 'Italy', ESP: 'Spain', SWE: 'Sweden', BEL: 'Belgium', DNK: 'Denmark',
  NOR: 'Norway', FIN: 'Finland', AUT: 'Austria', PRT: 'Portugal', NZL: 'New Zealand',
  MEX: 'Mexico', TWN: 'Taiwan', MYS: 'Malaysia', THA: 'Thailand', IDN: 'Indonesia',
  PHL: 'Philippines', VNM: 'Vietnam', ZAF: 'South Africa', SAU: 'Saudi Arabia',
  ARE: 'United Arab Emirates', QAT: 'Qatar', KWT: 'Kuwait', ISR: 'Israel', TUR: 'Turkey',
  RUS: 'Russia', POL: 'Poland', CZE: 'Czechia', HUN: 'Hungary', GRC: 'Greece',
  CYP: 'Cyprus', MLT: 'Malta', ISL: 'Iceland', JEY: 'Jersey', GGY: 'Guernsey',
  IMN: 'Isle of Man', PAN: 'Panama', BHS: 'Bahamas', BRB: 'Barbados', ARG: 'Argentina',
  CHL: 'Chile', COL: 'Colombia', PER: 'Peru', EGY: 'Egypt', NGA: 'Nigeria', KEN: 'Kenya',
  MAR: 'Morocco', PAK: 'Pakistan', BGD: 'Bangladesh', LKA: 'Sri Lanka', KAZ: 'Kazakhstan',
  UKR: 'Ukraine', ROU: 'Romania', BGR: 'Bulgaria', HRV: 'Croatia', SVN: 'Slovenia',
  SVK: 'Slovakia', LTU: 'Lithuania', LVA: 'Latvia', EST: 'Estonia', MCO: 'Monaco',
  LIE: 'Liechtenstein', AND: 'Andorra', MHL: 'Marshall Islands', BRN: 'Brunei',
  MAC: 'Macao', MNG: 'Mongolia', KHM: 'Cambodia', MMR: 'Myanmar', LAO: 'Laos',
  NPL: 'Nepal', OMN: 'Oman', BHR: 'Bahrain', JOR: 'Jordan', LBN: 'Lebanon',
  TUN: 'Tunisia', DZA: 'Algeria', GHA: 'Ghana', ETH: 'Ethiopia', URY: 'Uruguay',
  PRY: 'Paraguay', ECU: 'Ecuador', VEN: 'Venezuela', DOM: 'Dominican Republic',
  JAM: 'Jamaica', TTO: 'Trinidad and Tobago', CRI: 'Costa Rica', GTM: 'Guatemala',
  CUW: 'Curaçao', ABW: 'Aruba', GIB: 'Gibraltar', TCA: 'Turks and Caicos Islands',
  IRQ: 'Iraq', LBR: 'Liberia', MUS: 'Mauritius', ALB: 'Albania', MKD: 'North Macedonia',
  BLR: 'Belarus', HND: 'Honduras', KOS: 'Kosovo', SLV: 'El Salvador',
};

const 원본길 = path.resolve('archive/raw/imf-pip/KOR-mirror.json');
if (!existsSync(원본길)) {
  console.error('✕ ' + 원본길 + ' 이 없다. node scripts/collect-imf-pip-mirror.mjs 를 먼저.');
  process.exit(1);
}
const 원본 = JSON.parse(readFileSync(원본길, 'utf8'));
const 관측 = 원본.관측;

const 연도들 = [...new Set(관측.map((r) => r.timePeriod))].sort();
const 최근연도 = 연도들[연도들.length - 1];
const 전년 = 연도들[연도들.length - 2] ?? null;

const 최근표 = 그해표(관측, 최근연도);
const 전년맵 = new Map((전년 ? 그해표(관측, 전년) : []).map((r) => [r.reporter, r.value]));

const 총액 = 최근표.reduce((a, r) => a + r.value, 0);

const 나라들 = 최근표.map((r) => ({
  code: r.reporter,
  name: ISO3이름[r.reporter] ?? r.reporter,
  value: r.value,
  share: 총액 > 0 ? r.value / 총액 : null,
  prevValue: 전년맵.get(r.reporter) ?? null,
}));

const 산출 = {
  _메모: {
    상품: '누가 한국 증권을 들고 있나 — IMF PIP 거울(mirror) 방식',
    출처: 'IMF — https://api.imf.org/external/sdmx/2.1/data/PIP',
    방법: '리포터국이 자국 자산으로 신고한 값 가운데 COUNTERPART_COUNTRY=KOR(SECTOR=S1·COUNTERPART_SECTOR=S1) 을 합산',
    최근연도,
    전년,
    리포터수: 나라들.length,
    받은때: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Seoul' }),
  },
  총액,
  나라들,
};

const 나감길 = path.resolve('src/data/imf-pip-korea.json');
writeFileSync(나감길, JSON.stringify(산출, null, 1), 'utf8');
console.log('■ 리포터 ' + 나라들.length + '개 · 최근연도 ' + 최근연도 + '(전년 ' + 전년 + ') · 합계 $' + (총액 / 1e9).toFixed(1) + 'B');
console.log('  ✔ ' + 나감길);
