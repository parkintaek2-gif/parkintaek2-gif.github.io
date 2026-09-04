#!/usr/bin/env node
/**
 * collect-100y-medical-cost.mjs — **나이대별 1인당 진료비, 얼마나 벌어지나**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님이 원드라이브에 직접 쓰신 「독립 데이터포털 목록.md」에 건강보험심사평가원(HIRA)
 * 빅데이터개방포털이 있었다(2026-09-04, "독립 데이터포털에 3번한테 쓸 것 없나" 지적).
 * opendata.hira.or.kr — 국민건강보험공단(350)과 다른 기관(심사평가원)의 별도 포털.
 *
 * ── 표 하나 ──────────────────────────────────────────────────────
 *   「연령별 건강보험 적용대상자 1인당 진료현황」(docNo=03-035) — 0세~85세이상 20개 나이칸.
 *   opendata.hira.or.kr/op/opc/olapHthInsRvStatInfoTab19.do?docNo=03-035&crtrYr=<연도>
 *   로그인 불필요, 서버가 표를 그대로 HTML로 낸다(정적 fetch로 받아진다, 확인함).
 *   연도는 crtrYr 인자(2013~2025 확인). 라이선스 — 공공누리 제1유형(출처표시, 상업적 이용 가능).
 *
 * ── ⚠ 이 자료가 못 가르는 것 ───────────────────────────────────
 * · 「진료비」는 건강보험이 부담한 것 + 본인부담금 합계다(전액 본인부담·비급여는 빠진다) —
 *   실제 의료비 지출 «전부»가 아니다.
 * · 「적용대상자」는 그 나이 전체 인구다 — 진료를 안 받은 사람도 분모에 들어간다.
 *   그래서 「진료를 받은 사람의 평균 진료비」보다 이 값이 낮게 나온다.
 * · 0세가 유아·청소년보다 높은 것은 신생아 집중치료 등 출생 관련 의료가 섞여서일 수 있다 —
 *   이 표 하나로 원인을 확정하지 않는다.
 *
 * 쓰는 법  node scripts/collect-100y-medical-cost.mjs [--selftest]
 */
import fs from 'node:fs';
import { 오늘 } from './_kst.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOC_NO = '03-035';

export function 수로(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** HIRA 표 하나를 판다. 실패하면(자리를 못 찾으면) null — 지어내지 않는다 */
export function 표파싱(html) {
  const 행들 = [];
  const 조각 = html.split(/<th class="sky"/g).slice(1);
  for (const s of 조각) {
    const 칸 = (s.match(/^[^>]*>\s*([^<]+?)\s*</) || [])[1];
    const 값들 = [...s.matchAll(/<td>([^<]*)<\/td>/g)].map((m) => 수로(m[1]));
    if (!칸 || 값들.length < 5) continue;
    행들.push({
      칸: 칸.trim(),
      적용대상자_천명: 값들[0],
      요양급여비용_억원: 값들[1],
      진료일수_천일: 값들[2],
      일인당진료일수: 값들[3],
      일인당진료비: 값들[4],
    });
  }
  return 행들;
}

/** 「0세」「1~4세」 같은 칸을 시작 나이로 정렬용 수로. 「85세이상」은 85, 「전체」는 null */
export function 시작나이(칸) {
  if (칸 === '전체') return null;
  const m = 칸.match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

/** 진료비가 나이 따라 계속 느는지(20~24세 바닥 이후) — U자 모양을 말로 냄 */
export function U자모양(행들) {
  const 나이행 = 행들.filter((r) => r.칸 !== '전체' && 시작나이(r.칸) !== null)
    .sort((a, b) => 시작나이(a.칸) - 시작나이(b.칸));
  if (나이행.length < 3) return null;
  let 바닥 = 나이행[0];
  for (const r of 나이행) if (r.일인당진료비 < 바닥.일인당진료비) 바닥 = r;
  const 계속느나 = 나이행.slice(나이행.indexOf(바닥)).every((r, i, arr) => i === 0 || r.일인당진료비 >= arr[i - 1].일인당진료비);
  return { 바닥칸: 바닥.칸, 바닥값: 바닥.일인당진료비, 계속느나 };
}

const 내가직접불렸나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('수로 — 콤마를 걷는다', 수로('1,244,578') === 1244578);
  검('수로 — 빈칸은 null', 수로('') === null);
  검('수로 — 대시는 null', 수로('-') === null);

  const 견본 = `
    <th scope="col">구분</th>
    <th class="sky" >전체</th>
    <td>51,395</td><td>1,244,578</td><td>1,064,372</td><td>20.71</td><td>2,421,608</td>
    <th class="sky" >0세</th>
    <td>255</td><td>13,966</td><td>7,225</td><td>28.38</td><td>5,485,956</td>
    <th class="sky" >20~24세</th>
    <td>2,615</td><td>21,454</td><td>24,197</td><td>9.25</td><td>820,365</td>
    <th class="sky" >85세이상</th>
    <td>1,054</td><td>82,478</td><td>58,429</td><td>55.44</td><td>7,825,693</td>
  `;
  const 행들 = 표파싱(견본);
  검('네 칸을 다 판다', 행들.length === 4);
  검('전체 칸 값을 판다', 행들[0].일인당진료비 === 2421608);
  검('0세 칸을 판다', 행들[1].일인당진료비 === 5485956);
  검('85세이상 칸을 판다', 행들[3].일인당진료비 === 7825693);
  검('⛔ th 구분 헤더 자체는 행으로 안 센다', !행들.some((r) => r.칸 === '구분'));

  검('시작나이 — 0세는 0', 시작나이('0세') === 0);
  검('시작나이 — 20~24세는 20', 시작나이('20~24세') === 20);
  검('시작나이 — 85세이상은 85', 시작나이('85세이상') === 85);
  검('⛔ 전체는 null(나이가 아니다)', 시작나이('전체') === null);

  const U자 = U자모양(행들.filter((r) => r.칸 !== '전체'));
  검('U자모양 — 바닥칸을 찾는다', U자.바닥칸 === '20~24세');
  검('U자모양 — 바닥 뒤로는 계속 는다', U자.계속느나 === true);

  const 안느는것 = [
    { 칸: '0세', 일인당진료비: 50 }, { 칸: '10~14세', 일인당진료비: 10 },
    { 칸: '20~24세', 일인당진료비: 40 }, { 칸: '30~34세', 일인당진료비: 30 },
  ];
  검('⛔ 바닥(10~14세) 찾는다', U자모양(안느는것).바닥칸 === '10~14세');
  검('⛔ 바닥 뒤에 도로 내려가면 계속느나 거짓', U자모양(안느는것).계속느나 === false);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ collect-100y-medical-cost 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가직접불렸나 && !process.argv.includes('--selftest')) {
  const 최신 = '2025';
  const url = `https://opendata.hira.or.kr/op/opc/olapHthInsRvStatInfoTab19.do?docNo=${DOC_NO}&crtrYr=${최신}`;
  const html = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  const 행들 = 표파싱(html);
  if (행들.length < 15) throw new Error(`표를 못 팠다 — ${행들.length}줄뿐이다. 사이트 구조가 바뀌었을 수 있다`);

  const 전체 = 행들.find((r) => r.칸 === '전체');
  const 나이행 = 행들.filter((r) => r.칸 !== '전체');
  const U자 = U자모양(나이행);
  const 최고 = [...나이행].sort((a, b) => b.일인당진료비 - a.일인당진료비)[0];
  const 최저 = [...나이행].sort((a, b) => a.일인당진료비 - b.일인당진료비)[0];

  const 낸다 = {
    정의: '1인당 진료비 = 그 나이 요양급여비용(억원) ÷ 그 나이 건강보험 적용대상자수(천명). 배수 = 최고칸 1인당 진료비 ÷ 최저칸 1인당 진료비.',
    무엇: '나이대별 1인당 진료비 — 얼마나 벌어지나',
    만든날: 오늘(),
    최신,
    출처: {
      기관: '건강보험심사평가원(HIRA)',
      표: '연령별 건강보험 적용대상자 1인당 진료현황',
      창구: 'HIRA 빅데이터개방포털',
      주소: url,
      이용허락범위: '공공누리 제1유형 — 출처표시, 상업적 이용·2차저작물 작성 가능',
    },
    '⚠ 이 자료가 못 가르는 것': [
      '진료비는 건강보험 부담분+본인부담분 합계다(전액 본인부담·비급여 제외) — 실제 의료비 지출 전부가 아니다.',
      '「적용대상자」는 그 나이 전체 인구다 — 진료를 안 받은 사람도 분모에 들어간다.',
      '0세가 유아·청소년보다 높은 것은 신생아 집중치료 등이 섞였을 수 있다 — 이 표 하나로 원인을 확정하지 않는다.',
    ],
    전체,
    나이별: 나이행,
    최고칸: 최고, 최저칸: 최저,
    배수: Math.round((최고.일인당진료비 / 최저.일인당진료비) * 10) / 10,
    U자모양: U자,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/medical-cost.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   ${최신}년 · 나이칸 ${나이행.length}개`);
  console.log(`   최고 ${최고.칸}(${최고.일인당진료비.toLocaleString()}원) · 최저 ${최저.칸}(${최저.일인당진료비.toLocaleString()}원) · 배수 ${낸다.배수}배`);
  console.log(`   U자 바닥 ${U자.바닥칸} · 바닥 뒤로 계속 느나: ${U자.계속느나}`);
}
