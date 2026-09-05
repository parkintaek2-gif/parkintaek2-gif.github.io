#!/usr/bin/env node
/**
 * collect-100y-apt-parking-age.mjs — **아파트가 지어진 지 오래될수록 주차공간이 부족한가**
 *
 * ── 왜 만드나 (2026-09-05, 사장님 지시) ────────────────────────────────
 * 사장님이 부동산인포의 K-apt 서울 주차난 분석 기사를 공유하시고, 이어서
 * K-apt 「웹참조자료」 게시판(https://www.k-apt.go.kr/web/board/webReference/boardList.do)에서
 * 직접 받으신 전국 단지 기본정보 엑셀(20260904_단지_기본정보.xlsx, 21,712개 단지)을
 * 넘겨주셨다 — data.go.kr 활용신청(미승인) 없이도 진짜 검증할 수 있었다.
 *
 * ── 무엇을 재나 ────────────────────────────────────────────────────
 * 서울 단지의 「사용승인일(준공)」×「총주차대수 ÷ 세대수」를 5개 나이 띠로 나눠 본다.
 * 자치구별 세대당 주차대수 순위도 곁들인다.
 *
 * ⚠ 이 자료가 못 가르는 것
 * · K-apt 웹참조자료 게시판은 **엑셀 첫 줄 스스로 「단순 참조자료, 정확한 자료는
 *   OPENAPI를 참조」**라고 적어 뒀다 — 이 지면도 그대로 밝힌다.
 * · 이 파일에 실린 단지 수(서울 3,185)는 부동산인포 기사의 「관리비공개의무단지
 *   3,022곳」과 다르다 — 의무단지만 거른 것이 아니라 K-apt에 등록된 전체 단지다.
 *   그래서 이 지면의 숫자는 그 기사의 숫자를 재현한 것이 아니라 **독자적으로 낸 것**이다.
 * · 「세대당 총주차대수」이지 「실제로 세워둘 수 있는 자리」가 아니다 — 방문차량·
 *   장애인전용구역 등을 안 뺐다.
 * · 준공연도만 보고 판단할 수 없다 — 재건축·리모델링으로 주차장이 나중에 늘어난
 *   단지가 섞여 있을 수 있다(이 자료로는 못 가른다).
 *
 * ⛔ 이용허락범위 — K-apt 웹참조자료 게시판에는 명시된 이용허락범위가 없다(확인함).
 *   같은 항목(사용승인일·주차대수·세대수)을 담은 data.go.kr 공식 API
 *   (국토교통부_공동주택 기본 정보제공 서비스, 15058453)는 「이용허락범위 제한 없음」을
 *   명시하지만 아직 활용신청 승인 전이다. 승인되면 이 수집기를 API 호출로 바꾼다.
 *
 * ⚠ xlsx 패키지가 package.json에 없다(2번 소유라 함부로 못 건드림) — 돌리기 전에
 *   `npm install xlsx --no-save`로 임시 설치한다.
 *
 * 쓰는 법
 *   npm install xlsx --no-save
 *   node scripts/collect-100y-apt-parking-age.mjs [--selftest]
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

export function 세대당주차(주차합, 세대합) {
  if (!세대합 || 세대합 <= 0) return null;
  return Math.round((주차합 / 세대합) * 100) / 100;
}

const 내가직접불렸나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가직접불렸나 && process.argv.includes('--selftest')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('연도추출 — 8자리 날짜에서 앞 4자리', 연도추출('20040517') === 2004);
  검('연도추출 — 빈 값은 null', 연도추출('') === null);
  검('연도추출 — undefined도 null', 연도추출(undefined) === null);

  검('나이띠 — 1989 이전', 나이띠(1985) === '~1989');
  검('나이띠 — 1990년대', 나이띠(1995) === '1990~1999');
  검('나이띠 — 2000년대', 나이띠(2005) === '2000~2009');
  검('나이띠 — 2010년대', 나이띠(2015) === '2010~2019');
  검('나이띠 — 2020 이후', 나이띠(2023) === '2020~');
  검('나이띠 — 경계값(1990)은 1990년대', 나이띠(1990) === '1990~1999');
  검('나이띠 — null 입력은 null', 나이띠(null) === null);

  검('세대당주차 — 정상 계산', 세대당주차(315, 150) === 2.1);
  검('세대당주차 — 세대합 0이면 null(나눗셈 금지)', 세대당주차(100, 0) === null);
  검('세대당주차 — 세대합 없으면 null', 세대당주차(100, null) === null);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ collect-100y-apt-parking-age 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가직접불렸나 && !process.argv.includes('--selftest')) {
  if (!fs.existsSync(원본길)) {
    console.error(`⛔ 원본 파일이 없다 — ${원본길}`);
    console.error('   archive/raw/kapt/ 에 K-apt 웹참조자료 엑셀을 먼저 두십시오');
    process.exit(1);
  }
  const XLSX = (await import('xlsx')).default;
  const wb = XLSX.readFile(원본길);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
  const 안내문 = String(rows[0][0] ?? '');
  const 헤더 = rows[1];
  const idx = (n) => 헤더.indexOf(n);
  const iSido = idx('시도'), iSigungu = idx('시군구'), iUseDate = idx('사용승인일'),
    iHouseholds = idx('세대수'), iParkTotal = idx('총주차대수');
  if ([iSido, iSigungu, iUseDate, iHouseholds, iParkTotal].some((i) => i < 0)) {
    console.error('⛔ 필요한 칸(시도·시군구·사용승인일·세대수·총주차대수)을 헤더에서 못 찾았다 — 원본 구조가 바뀌었을 수 있다');
    process.exit(1);
  }

  const 서울행 = rows.slice(2).filter((r) => r[iSido] === '서울특별시');

  // ① 나이띠별
  const 띠순서 = ['~1989', '1990~1999', '2000~2009', '2010~2019', '2020~'];
  const 띠집계 = Object.fromEntries(띠순서.map((k) => [k, { 단지수: 0, 세대합: 0, 주차합: 0 }]));
  let 못쓴행 = 0;
  for (const r of 서울행) {
    const 연도 = 연도추출(r[iUseDate]);
    const 세대 = parseFloat(r[iHouseholds]);
    const 주차 = parseFloat(r[iParkTotal]);
    const 띠 = 나이띠(연도);
    if (!띠 || !Number.isFinite(세대) || 세대 <= 0 || !Number.isFinite(주차)) { 못쓴행++; continue; }
    띠집계[띠].단지수 += 1;
    띠집계[띠].세대합 += 세대;
    띠집계[띠].주차합 += 주차;
  }
  const 나이띠별 = 띠순서.map((k) => ({
    띠: k,
    단지수: 띠집계[k].단지수,
    세대당주차: 세대당주차(띠집계[k].주차합, 띠집계[k].세대합),
  }));

  // ② 자치구별
  const 구집계 = {};
  for (const r of 서울행) {
    const gu = r[iSigungu];
    const 세대 = parseFloat(r[iHouseholds]);
    const 주차 = parseFloat(r[iParkTotal]);
    if (!gu || !Number.isFinite(세대) || 세대 <= 0 || !Number.isFinite(주차)) continue;
    if (!구집계[gu]) 구집계[gu] = { 단지수: 0, 세대합: 0, 주차합: 0 };
    구집계[gu].단지수 += 1;
    구집계[gu].세대합 += 세대;
    구집계[gu].주차합 += 주차;
  }
  const 구별 = Object.entries(구집계)
    .map(([gu, v]) => ({ 구: gu, 단지수: v.단지수, 세대당주차: 세대당주차(v.주차합, v.세대합) }))
    .sort((a, b) => a.세대당주차 - b.세대당주차);

  const 낸다 = {
    무엇: '서울 아파트 단지 — 준공연도가 오래될수록 세대당 주차대수가 적은가',
    만든날: 오늘(),
    출처: {
      기관: 'K-apt 공동주택관리정보시스템(한국부동산원 운영)',
      표: '단지 기본정보 — 웹참조자료 게시판',
      창구: 'https://www.k-apt.go.kr/web/board/webReference/boardList.do',
      받은날: '2026-09-04',
      원본안내문: 안내문,
    },
    이용허락범위: '게시판 자체에 명시된 이용허락범위 없음(확인함) — 같은 항목을 담은 data.go.kr 공식 API(국토교통부_공동주택 기본 정보제공 서비스, 15058453)는 「이용허락범위 제한 없음」을 명시. 활용신청 승인 대기 중.',
    덮는범위: '전국 21,712개 단지 중 서울 3,185개만 이 지면에서 쓴다. 부동산인포 기사의 「관리비공개의무단지 3,022곳」과는 모집단이 다르다(이 파일은 의무단지만 거르지 않은 전체 등록 단지) — 그 기사의 숫자를 재현한 것이 아니라 독자적으로 계산했다.',
    대조: '못 맞췄다 — 부동산인포 기사의 개별 수치(예: 성동구 75.6%)와 이 지면의 계산 결과를 대조하지 않았다. 지표 정의(세대당 평균 대수 vs 1.2대 미만 비율)와 모집단이 다르다.',
    분석대상단지수: 서울행.length,
    못쓴행: 못쓴행,
    나이띠별,
    구별,
  };
  const 낼곳 = path.join(뿌리, 'src/data/100yearmap/apt-parking-age.json');
  fs.writeFileSync(낼곳, JSON.stringify(낸다, null, 1), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼곳)}`);
  console.log(`   서울 단지 ${서울행.length}개 · 못 쓴 행 ${못쓴행}개`);
  for (const 행 of 나이띠별) console.log(`   ${행.띠} — 단지 ${행.단지수} · 세대당주차 ${행.세대당주차}대`);
}
