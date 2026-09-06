#!/usr/bin/env node
/**
 * collect-100y-ev-charger-by-age.mjs — 아파트가 오래될수록 전기차 충전기가 모자란가
 *
 * ⭐ 왜 만드나 (2026-09-06, 사장님 지시) — 사장님이 이미 K-apt 웹참조자료(단지 기본정보,
 *   apt-parking-age.json 이 쓴 것과 같은 파일)에서 「주차면보다 좋은 데이터 없나」라고
 *   물으셨다. 그 파일에 「차량보유대수(전기차)」·「전기차 충전시설 설치대수(지상/지하)」가
 *   있어 재 보니, 준공연도별로 «전기차 대비 충전기 수»가 뚜렷하게 갈렸다.
 *
 * ⛔ 이용허락범위·원자료 안내문 등은 apt-parking-age.json 과 같은 원본이므로 그대로 따른다.
 *
 * 쓰는 법
 *   node scripts/collect-100y-ev-charger-by-age.mjs [--selftest]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 오늘 } from './_kst.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원본길 = path.join(뿌리, 'archive/raw/kapt/20260904_단지_기본정보.xlsx');

export function 연도추출(사용승인일) {
  const s = String(사용승인일 ?? '');
  return s.length >= 4 ? parseInt(s.slice(0, 4), 10) : null;
}

export function 나이띠(연도) {
  if (연도 == null || !Number.isFinite(연도)) return null;
  if (연도 < 1990) return '~1989';
  if (연도 < 2000) return '1990~1999';
  if (연도 < 2010) return '2000~2009';
  if (연도 < 2020) return '2010~2019';
  return '2020~';
}

export function 전기차당충전기(전기차합, 충전기합) {
  if (!충전기합 || 충전기합 <= 0) return null;
  return Math.round((전기차합 / 충전기합) * 100) / 100;
}

const 내가직접불렸나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('연도추출 — 8자리 날짜에서 앞 4자리', 연도추출('20040517') === 2004);
  검('연도추출 — 빈 값은 null', 연도추출('') === null);

  검('나이띠 — 1989 이전', 나이띠(1985) === '~1989');
  검('나이띠 — 2020 이후', 나이띠(2023) === '2020~');
  검('나이띠 — 경계값(1990)은 1990년대', 나이띠(1990) === '1990~1999');
  검('나이띠 — null 입력은 null', 나이띠(null) === null);

  검('전기차당충전기 — 정상 계산', 전기차당충전기(90, 100) === 0.9);
  검('전기차당충전기 — 충전기 0이면 null(나눗셈 금지)', 전기차당충전기(10, 0) === null);
  검('전기차당충전기 — 충전기 없으면 null', 전기차당충전기(10, null) === null);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ collect-100y-ev-charger-by-age 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가직접불렸나 && !process.argv.includes('--selftest')) {
  if (!fs.existsSync(원본길)) {
    console.error(`⛔ 원본 파일이 없다 — ${원본길}`);
    process.exit(1);
  }
  const XLSX = (await import('xlsx')).default;
  const wb = XLSX.readFile(원본길);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
  const 안내문 = String(rows[0][0] ?? '');
  const 헤더 = rows[1];
  const idx = (n) => 헤더.indexOf(n);
  const iSido = idx('시도'), iUseDate = idx('사용승인일'), iEV = idx('차량보유대수(전기차)'),
    iChg지상 = idx('전기차 충전시설 설치대수(지상)'), iChg지하 = idx('전기차 충전시설 설치대수(지하)');
  if ([iSido, iUseDate, iEV, iChg지상, iChg지하].some((i) => i < 0)) {
    console.error('⛔ 필요한 칸을 헤더에서 못 찾았다 — 원본 구조가 바뀌었을 수 있다');
    process.exit(1);
  }

  const 서울행 = rows.slice(2).filter((r) => r[iSido] === '서울특별시');

  const 띠순서 = ['~1989', '1990~1999', '2000~2009', '2010~2019', '2020~'];
  const 띠집계 = Object.fromEntries(띠순서.map((k) => [k, { 단지수: 0, 전기차합: 0, 충전기합: 0 }]));
  let 못쓴행 = 0;
  let EV있는데충전기0곳 = 0;
  for (const r of 서울행) {
    const 연도 = 연도추출(r[iUseDate]);
    const ev = parseFloat(r[iEV]);
    const chg = (parseFloat(r[iChg지상]) || 0) + (parseFloat(r[iChg지하]) || 0);
    const 띠 = 나이띠(연도);
    if (!띠 || !Number.isFinite(ev)) { 못쓴행++; continue; }
    띠집계[띠].단지수 += 1;
    띠집계[띠].전기차합 += ev;
    띠집계[띠].충전기합 += chg;
    if (ev > 0 && chg === 0) EV있는데충전기0곳 += 1;
  }
  const 나이띠별 = 띠순서.map((k) => ({
    띠: k,
    단지수: 띠집계[k].단지수,
    전기차합: 띠집계[k].전기차합,
    충전기합: 띠집계[k].충전기합,
    전기차당충전기: 전기차당충전기(띠집계[k].전기차합, 띠집계[k].충전기합),
  }));

  const 낸다 = {
    무엇: '서울 아파트 단지 — 준공연도가 오래될수록 전기차 대비 충전기가 부족한가',
    만든날: 오늘(),
    출처: {
      기관: 'K-apt 공동주택관리정보시스템(한국부동산원 운영)',
      표: '단지 기본정보 — 웹참조자료 게시판',
      창구: 'https://www.k-apt.go.kr/web/board/webReference/boardList.do',
      받은날: '2026-09-04',
      원본안내문: 안내문,
    },
    이용허락범위: '게시판 자체에 명시된 이용허락범위 없음(확인함) — 같은 항목을 담은 data.go.kr 공식 API(국토교통부_공동주택 기본 정보제공 서비스, 15058453)는 「이용허락범위 제한 없음」을 명시. 활용신청 승인 대기 중.',
    덮는범위: '전국 21,712개 단지 중 서울 3,185개 중 사용승인일·전기차 보유대수가 확인되는 단지만 썼다. 「전기차 충전시설 설치대수」는 해당 단지가 스스로 신고한 값이라 실제 가동 여부는 확인하지 못했다.',
    대조: '못 맞췄다 — 서울시·환경부가 발표한 전기차 충전 인프라 통계와 이 계산을 대조해 본 적이 없다.',
    분석대상단지수: 서울행.length,
    못쓴행,
    'EV있는데충전기0대인단지': EV있는데충전기0곳,
    나이띠별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/ev-charger-by-age.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   서울 단지 ${서울행.length}개 · 못 쓴 행 ${못쓴행}개 · EV있는데 충전기 0대 ${EV있는데충전기0곳}곳`);
  for (const 행 of 나이띠별) console.log(`   ${행.띠} — 단지 ${행.단지수} · 전기차당충전기 ${행.전기차당충전기}`);
}
