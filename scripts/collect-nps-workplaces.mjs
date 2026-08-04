#!/usr/bin/env node
/**
 * 국민연금 가입 사업장 내역 — **이직률의 유일한 원천.**
 *
 *   node scripts/collect-nps-workplaces.mjs           받아서 아카이브
 *   node scripts/collect-nps-workplaces.mjs --join    상장사와 붙여 요약
 *
 * ── 왜 이게 중요한가 ────────────────────────────────────────────
 * 사장님: **「그들은 재무를, 우리는 사람을 한다」**
 * 근속·급여·성별은 DART 에서 받았다. **이직률만 원천이 없었다.**
 * 여기에 `신규취득자수`·`상실가입자수`가 월 단위로 들어 있다.
 *
 * ── ⚠ API 가 아니라 파일이다 ────────────────────────────────────
 * `NpsBplcInfoInqireServiceV2` 는 **승인됐고 200 을 주지만 total=0 이다.**
 * 파라미터를 여섯 가지로 바꿔 가며 찔러도 전부 0 이었다(2026-08-05 실측).
 * `resultCode=00 NORMAL_CODE` — 오류가 아니라 **서비스가 비어 있는 것**이다.
 * **되는 길이 있는데 안 되는 길에 시간을 쓰지 않는다.** 파일로 간다.
 *
 * ── 라이선스 ────────────────────────────────────────────────────
 * 데이터셋 15083277 · 국민연금공단 · **이용허락범위 「제한 없음」** (2026-08-05 확인)
 * `docs/데이터-라이선스-대장.md` 2-1 에 줄이 있다.
 *
 * ── ⚠ 조심할 것 ────────────────────────────────────────────────
 * · 파일이 **116MB** 다. 통째로 메모리에 올리지 않는다 — 줄 단위로 흘린다
 * · 인코딩이 **CP949(EUC-KR)** 일 수 있다. 열어 보고 정한다. 짐작하면 글자가 깨진다
 * · 받다 죽어도 쓰던 파일이 안 망가지게 `.part` 에 받고 **끝나면 바꾼다**
 * · 사업자등록번호가 있어야 상장사와 붙는다. 없으면 **사업장명으로는 못 붙인다**
 *   (동명이인 사업장이 수만 개다 — 이름 매칭은 틀린 답을 자신 있게 낸다)
 */
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, readFileSync, copyFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 데이터셋 = '15083277';
const 내려받기 =
  'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003681205&fileDetailSn=1&insertDataPrcus=N';
const DIR = path.resolve('archive/raw/nps');
/**
 * ⚠⚠ **달마다 따로 남긴다.** `latest` 하나만 두면 다음 달에 **이번 달치가 사라진다.**
 *
 * 이 파일은 **월간 스냅숏**이다(자료생성년월 열이 있다). 포털은 최신 한 벌만 준다 —
 * 지난 달 것을 다시 달라고 할 수 없다. **소급이 안 되는 자료다.**
 * 사장님 지시: 「아카이빙은 하루도 빠뜨리지 않는다 — 소급이 안 되는 유일한 항목」
 *
 * 그래서 파일 안의 **자료생성년월을 읽어** `workplaces-YYYYMM.csv` 로 남기고,
 * `workplaces-latest.csv` 는 그 사본으로 둔다(스크립트들이 이 이름을 본다).
 *
 * ⭐ 이게 쌓여야 **이직률이 상품이 된다.** 한 달치로는 「6월 상실률」밖에 못 쓴다 —
 *   퇴직·폐업·계절요인이 섞여 있어 한 달만 보고 「이직률」이라고 하면 거짓말이 된다.
 */
const 본 = path.join(DIR, 'workplaces-latest.csv');
const 임시 = 본 + '.part';

const UA = 'Mozilla/5.0 (compatible; SeoulMarketsBot/0.1; +https://seoulmarkets.com/about)';
const 메가 = (n) => (n / 1024 / 1024).toFixed(1) + 'MB';

async function 받기() {
  mkdirSync(DIR, { recursive: true });
  if (existsSync(본)) {
    console.log(`이미 있다 — ${본} (${메가(statSync(본).size)})`);
    달치로남기기();   /* 예전에 받아 둔 것도 달치로 남긴다 */
    console.log('다시 받으려면 그 파일을 지운다.');
    return;
  }
  console.log(`국민연금 가입 사업장 내역 (데이터셋 ${데이터셋}) 받는다…`);
  const r = await fetch(내려받기, {
    headers: { 'User-Agent': UA, Referer: `https://www.data.go.kr/data/${데이터셋}/fileData.do` },
    redirect: 'follow',
  });
  if (!r.ok || !r.body) throw new Error(`받기 실패 ${r.status}`);
  const 크기 = Number(r.headers.get('content-length') ?? 0);
  console.log(`  ${크기 ? 메가(크기) : '크기 미상'}`);

  /* ⚠ `.part` 로 받고 **다 받은 뒤에** 바꾼다. 중간에 죽어도 반쪽 파일이 안 남는다 */
  await pipeline(Readable.fromWeb(r.body), createWriteStream(임시));
  const 받은 = statSync(임시).size;
  if (크기 && 받은 !== 크기) throw new Error(`크기가 다르다 — 기대 ${크기} 받음 ${받은}`);
  renameSync(임시, 본);
  console.log(`✅ ${본} (${메가(받은)})`);
  달치로남기기();
}

/**
 * 파일 첫 행에서 **자료생성년월**을 읽어 달치 사본을 만든다.
 * ⚠ 파일명을 오늘 날짜로 짓지 않는다 — 늦게 받으면 어긋난다. **자료가 말하는 달**을 쓴다.
 */
function 달치로남기기() {
  if (!existsSync(본)) return;
  const 앞 = readFileSync(본).subarray(0, 8192);
  const 글 = new TextDecoder('euc-kr', { fatal: false }).decode(앞);
  const 줄 = 글.split(String.fromCharCode(10)).map((x) => x.trim());
  const 열 = (줄[0] ?? '').split(',').map((x) => x.trim());
  const i = 열.findIndex((c) => c.includes('자료생성년월'));
  const 값 = i > -1 ? (줄[1] ?? '').split(',')[i] : null;
  const 달 = String(값 ?? '').replace(/[^0-9]/g, '').slice(0, 6);
  if (달.length !== 6) { console.log('⚠ 자료생성년월을 못 읽었다. 달치 사본을 안 만든다'); return; }
  const 달파일 = path.join(DIR, `workplaces-${달}.csv`);
  if (existsSync(달파일)) { console.log(`이미 있다 — ${path.basename(달파일)}`); return; }
  copyFileSync(본, 달파일);
  console.log(`📦 달치로 남겼다 — ${path.basename(달파일)}`);
}

/**
 * ⚠ 인코딩을 **짐작하지 않는다.** 앞부분을 두 가지로 읽어 보고 한글이 성한 쪽을 쓴다.
 * 공공데이터포털 CSV 는 UTF-8 인 것도 있고 CP949 인 것도 있다.
 */
function 인코딩고르기(p) {
  const 앞 = readFileSync(p).subarray(0, 4096);
  const 셈 = (enc) => {
    let s;
    try { s = new TextDecoder(enc, { fatal: false }).decode(앞); } catch { return -1; }
    const 한글 = (s.match(/[가-힣]/g) ?? []).length;
    const 깨짐 = (s.match(/�/g) ?? []).length;
    return 한글 - 깨짐 * 3;
  };
  const utf8 = 셈('utf-8'), cp949 = 셈('euc-kr');
  const 고른 = cp949 > utf8 ? 'euc-kr' : 'utf-8';
  console.log(`인코딩 — utf-8 점수 ${utf8} · euc-kr 점수 ${cp949} → **${고른}**`);
  return 고른;
}

/** ⚠ 큰따옴표 안의 쉼표를 지킨다. split(',') 로 하면 열이 밀린다 */
function 칸나누기(줄) {
  const 결과 = []; let 값 = '', 따옴표 = false;
  for (const ch of 줄) {
    if (ch === '"') { 따옴표 = !따옴표; continue; }
    if (ch === ',' && !따옴표) { 결과.push(값); 값 = ''; continue; }
    값 += ch;
  }
  결과.push(값);
  return 결과;
}

/**
 * 큰 파일을 **줄 단위로 흘린다.** 통째로 문자열에 올리지 않는다 —
 * 116MB 를 CP949 로 디코드하면 문자열이 그 두 배가 된다.
 * `TextDecoder({stream:true})` 로 조각 경계에 걸친 글자도 안 깨지게 이어 붙인다.
 */
async function* 줄들(p, enc) {
  const dec = new TextDecoder(enc, { fatal: false });
  let 남은 = '';
  for await (const 조각 of createReadStream(p, { highWaterMark: 1 << 20 })) {
    남은 += dec.decode(조각, { stream: true });
    let i;
    while ((i = 남은.indexOf('\n')) > -1) {
      yield 남은.slice(0, i).replace(/\r$/, '');
      남은 = 남은.slice(i + 1);
    }
  }
  남은 += dec.decode();
  if (남은.trim()) yield 남은.replace(/\r$/, '');
}

async function 훑기() {
  if (!existsSync(본)) { console.error(`✕ ${본} 이 없다. 먼저 받는다.`); process.exit(1); }
  const enc = 인코딩고르기(본);

  let 열 = null, 행 = 0;
  const 자리 = {};
  let 신규합 = 0, 상실합 = 0, 가입합 = 0, 신규있음 = 0;
  const 표본 = [];

  for await (const 줄 of 줄들(본, enc)) {
    if (!줄.trim()) continue;
    if (!열) {
      열 = 칸나누기(줄).map((x) => x.trim().replace(/^﻿/, ''));
      console.log(`열 ${열.length}개 — ${열.join(' | ').slice(0, 300)}`);
      /* ⚠ 열 이름을 **찾아서** 쓴다. 자리 번호를 박아 두면 다음 달 파일에서 조용히 어긋난다 */
      const 찾 = (...후보) => 열.findIndex((c) => 후보.some((k) => c.includes(k)));
      자리.신규 = 찾('신규취득');
      자리.상실 = 찾('상실');
      자리.가입 = 찾('가입자');
      자리.이름 = 찾('사업장명', '사업장');
      자리.사업자 = 찾('사업자등록번호', '등록번호');
      console.log(`자리 — ${JSON.stringify(자리)}`);
      continue;
    }
    행++;
    const c = 칸나누기(줄);
    const n = (i) => { const v = Number(String(c[i] ?? '').replace(/[^0-9.-]/g, '')); return Number.isFinite(v) ? v : 0; };
    if (자리.신규 > -1) { const v = n(자리.신규); 신규합 += v; if (v > 0) 신규있음++; }
    if (자리.상실 > -1) 상실합 += n(자리.상실);
    if (자리.가입 > -1) 가입합 += n(자리.가입);
    if (표본.length < 3) 표본.push(c.slice(0, 8).join(' | '));
  }

  console.log(`\n행 ${행.toLocaleString()}`);
  console.log(`가입자 합 ${가입합.toLocaleString()} · 신규취득 합 ${신규합.toLocaleString()} · 상실 합 ${상실합.toLocaleString()}`);
  console.log(`신규취득이 1 이상인 사업장 ${신규있음.toLocaleString()} (${(신규있음 / 행 * 100).toFixed(1)}%)`);
  console.log('\n앞 3행');
  표본.forEach((x) => console.log('   ' + x));
}

async function main() {
  if (process.argv.includes('--join') || process.argv.includes('--scan')) { await 훑기(); return; }
  await 받기();
  await 훑기();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
