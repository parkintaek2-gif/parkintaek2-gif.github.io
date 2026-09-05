#!/usr/bin/env node
/**
 * collect-100y-medical-cost-top-diseases.mjs — **나이대별로 가장 흔한 병 이름**
 *
 * ── 왜 만드나 (2026-09-05, 사장님 지시) ────────────────────────────────
 * 「3번 새 지면 두 장(나이대별 진료비 등) → 그 안에서 실명이 되는 축(질병명·지역명)을
 *  찾는다. 실행하도록 꼭 해」
 *
 * ⛔ /medical-cost 가 쓰는 표(docNo=03-035, 연령별 1인당 진료현황)에는 질병명 칸
 *   자체가 없다 — 나이만 있고 병 이름이 없다. 그리고 병 이름이 있는 표
 *   (03-021, 다빈도 상병별 현황)에는 나이 칸이 없다 — 둘을 억지로 이을 수 없었다.
 *
 * ✅ 그런데 HIRA 포털에 완전히 다른 표 계열이 하나 더 있었다 — **「다빈도질병 통계」**
 *   (olapHifrqSickInfoTab3.do, 03-035와 다른 메뉴). 이 표는 **나이와 병 이름을
 *   같이** 낸다. 오늘 처음 찾았다 — 어제까지 이 표 계열의 존재를 몰랐다.
 *
 * ── 표 ──────────────────────────────────────────────────────────
 *   opendata.hira.or.kr/op/opc/olapHifrqSickInfoTab3.do
 *     ?sRvYr=<연도>&ageGubun=<나이칸>&ipOpTpCd=<1입원|2외래>&mdCmTpCd=<1양방|2한방>&rnk=<순위수>
 *   나이칸 값: 009·019·029·039·049·059·069·079·089(80세이상) — 10살 띠.
 *   로그인 불필요, 정적 HTML. 라이선스 공공누리 제1유형(같은 포털, 같은 허락범위).
 *
 * ⚠ 이 자료가 못 가르는 것
 * · 「3단질병명」 기준이다 — 세부 진단명이 아니라 큰 분류다(예: J20 은 급성기관지염
 *   전체이지 그 아래 세부 원인균까지 가르지 않는다).
 * · 외래(양방) 진료만 본다 — 입원·한방은 뺐다. 다르게 물으면 순위가 달라질 수 있다.
 * · 「환자수」이지 「그 병이 있는 사람 수」가 아니다 — 한 사람이 그 해에 여러 번
 *   방문했어도, 그리고 여러 나이 칸을 지나갔어도 각 방문·각 칸에서 셀 수 있다.
 * · 이 표는 «가장 흔히 온 이유»를 보여 주지 «가장 위험한 병»을 보여 주지 않는다.
 *   감기 같은 병은 흔해서 위에 오르고, 드물지만 위험한 병은 이 표 위쪽에 안 보인다.
 *
 * 쓰는 법  node scripts/collect-100y-medical-cost-top-diseases.mjs [--selftest]
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { 오늘 } from './_kst.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ⚠ [2026-09-05] node 내장 fetch() 로 이 사이트를 부르면 «항상 같은 214,546바이트»의
 *   빈 틀(질병/연령 표 없이 로그인SDK 자바스크립트만 담긴 것)이 온다 — 커밋 안 하고 재기만
 *   해도 재현됐다. **curl로 같은 주소를 부르면 정상 표가 온다**(221,148바이트 대).
 *   TLS/HTTP 지문을 가르는 방화벽으로 보인다. 그래서 curl을 자식 프로세스로 부른다.
 */
function curl로받기(url) {
  return execFileSync('curl', ['-s', '--max-time', '20', '-A', 'Mozilla/5.0', url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
}

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const 나이칸들 = [
  { 값: '009', 이름: '0~9세' },
  { 값: '019', 이름: '10~19세' },
  { 값: '029', 이름: '20~29세' },
  { 값: '039', 이름: '30~39세' },
  { 값: '049', 이름: '40~49세' },
  { 값: '059', 이름: '50~59세' },
  { 값: '069', 이름: '60~69세' },
  { 값: '079', 이름: '70~79세' },
  { 값: '089', 이름: '80세이상' },
];

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * 표 하나(한 나이칸)를 판다. 텍스트꼴로 들어온다 — «코드 3단질병명 순위 환자수 …»가
 * 연이어 반복되는데, 코드가 항상 대문자+숫자(예: J20·A09)라 그 자리로 자른다.
 * ⚠ 코드 뒤에 오는 «이름»은 다음 코드가 나오기 전까지다 — 공백이 든 이름이 많다
 *   (「감염성 및 상세불명 기원의 기타 위장염 및 결장염」처럼).
 */
export function 표파싱(text, 몇개 = 5) {
  const 시작 = text.indexOf('외래 ');
  if (시작 < 0) return [];
  const 몸 = text.slice(시작 + 3);
  /* 코드(영문1+숫자2) 다음에 «이름 순위 숫자…» 가 반복된다. 이름은 순위(정수 하나)
     앞까지다 — 순위는 뒤에 «환자수(콤마 든 큰 수)»가 바로 붙는다는 특징으로 가른다. */
  const 조각들 = [...몸.matchAll(/([A-Z]\d{2})\s+([^\n]+?)\s+(\d{1,3})\s+([\d,]{4,})\s/g)];
  const 행들 = [];
  for (const m of 조각들) {
    const [, 코드, 이름, 순위, 환자수] = m;
    const 순위수 = Number(순위);
    if (!Number.isFinite(순위수) || 순위수 < 1 || 순위수 > 500) continue;
    행들.push({ 코드, 이름: 이름.trim(), 순위: 순위수, 환자수: 수로(환자수) });
    if (행들.length >= 몇개) break;
  }
  return 행들;
}

const 내가직접불렸나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('수로 — 콤마를 걷는다', 수로('2,481,402') === 2481402);
  검('수로 — 대시는 null', 수로('-') === null);

  const 견본 = ' 외래 J20 급성 기관지염 1 2,481,402 18,212,300 18,217,451 356,666,778 275,349,879 2,811,368 K05 치은염 및 치주질환 2 1,201,570 2,000,000 2,000,001 300,000,000 200,000,000 1,200,000 ';
  const 행들 = 표파싱(견본, 5);
  검('두 줄을 판다', 행들.length === 2);
  검('코드를 판다', 행들[0].코드 === 'J20');
  검('공백 든 이름을 통째로 판다', 행들[1].이름 === '치은염 및 치주질환');
  검('순위를 판다', 행들[0].순위 === 1 && 행들[1].순위 === 2);
  검('환자수(첫 해 것)를 판다', 행들[0].환자수 === 2481402);

  검('⛔ 「외래」가 없으면 빈 배열(지어내지 않는다)', 표파싱('아무 말').length === 0);
  검('몇개 인자로 자른다', 표파싱(견본, 1).length === 1);

  검('나이칸 아홉 개', 나이칸들.length === 9);
  검('나이칸 값이 010 자리 규칙', 나이칸들[0].값 === '009' && 나이칸들[8].값 === '089');

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ collect-100y-medical-cost-top-diseases 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가직접불렸나 && !process.argv.includes('--selftest')) {
  const 연도 = '2025';
  const 몇위까지 = 3;
  const 나이대별 = [];
  for (const 칸 of 나이칸들) {
    const url = `https://opendata.hira.or.kr/op/opc/olapHifrqSickInfoTab3.do?sRvYr=${연도}&ageGubun=${칸.값}&ipOpTpCd=2&mdCmTpCd=1&rnk=20`;
    const html = curl로받기(url);
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const 상위 = 표파싱(text, 몇위까지);
    if (상위.length < 몇위까지) throw new Error(`${칸.이름} — ${상위.length}건뿐이다. 사이트 구조가 바뀌었을 수 있다`);
    나이대별.push({ 칸: 칸.이름, 상위 });
    await new Promise((r) => setTimeout(r, 300));
  }

  const 낸다 = {
    무엇: '나이대별 외래 진료 1위 병 이름 — 어떤 병으로 가장 많이 오나',
    만든날: 오늘(),
    최신: 연도,
    출처: {
      기관: '건강보험심사평가원(HIRA)',
      표: '다빈도질병 통계 — 질병/연령10세구간별',
      창구: 'HIRA 빅데이터개방포털',
      주소: `https://opendata.hira.or.kr/op/opc/olapHifrqSickInfoTab3.do`,
      이용허락범위: '공공누리 제1유형 — 출처표시, 상업적 이용·2차저작물 작성 가능',
    },
    '⚠ 이 자료가 못 가르는 것': [
      '3단질병명(큰 분류) 기준이다 — 세부 진단명이 아니다.',
      '외래(양방)만 본다 — 입원·한방은 뺐다. 다르게 물으면 1위·2위가 바뀔 수 있다.',
      '「환자수」다 — 한 사람이 여러 번 온 것과 여러 나이칸을 지나며 온 것을 각각 센다.',
      '가장 «흔한» 이유이지 가장 «위험한» 병이 아니다 — 감기 같은 흔한 병이 위에 오른다.',
    ],
    나이대별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/medical-cost-top-diseases.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  for (const 행 of 나이대별) console.log(`   ${행.칸} — 1위 ${행.상위[0].이름}(${행.상위[0].코드})`);
}
