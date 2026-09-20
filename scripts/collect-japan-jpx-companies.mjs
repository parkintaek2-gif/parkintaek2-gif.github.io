#!/usr/bin/env node
/**
 * collect-japan-jpx-companies.mjs — 일본 상장사 명부 (아시아 확장 · 1번 몫, 마감 2026-09-23)
 *
 * ── 왜 JPX 파일이 아니라 EDINET 코드리스트인가 ──────────────────────────────
 * 5번이 09-20 13:0x 에 뚫어 넘긴 파일은 JPX 영문 상장사 일람
 * (jpx.co.jp/.../data_e.xlsx, 4,441행)이었다. robots.txt 는 열려 있었지만
 * **약관을 다시 읽으니 막혀 있었다** — JPX 이용약관 원문(2026-09-20 실측,
 * https://www.jpx.co.jp/english/term-of-use/index.html):
 *
 *   "The collection of data or secondary use of information from this
 *    website for commercial purposes is strictly prohibited, unless JPX
 *    has granted prior permission or authorized such use under a paid
 *    contract."
 *
 * SeoulMarkets 는 값을 받는 상품이다 — 이 조항에 그대로 걸린다. robots 가
 * 열렸다고 약관이 열린 것이 아니라는 함정을 5번이 미리 적어 두었고(인도
 * NSE 에서 겪음), 이번에도 같은 함정이었다.
 *
 * ── 대신 이것을 쓴다 — EDINET 코드리스트 (금융청) ───────────────────────────
 * 발행 주체가 거래소(JPX, 민간)가 아니라 **금융청**(정부 규제기관 — 한국의
 * DART/금융위와 같은 자리)이고, e-Gov 데이터포털 등록 정보(2026-09-20 확인,
 * https://data.e-gov.go.jp/data/dataset/fsa_20140901_0095/) 의 라이선스가
 * **CC BY**다. EDINET 자체 이용규약(공공데이터이용규약 PDL1.0, 2026-09-20
 * 확인)도 출처 표시 조건으로 가공물 포함 상업적 이용을 허용한다 — 로고·
 * EDINET 택소노미·XBRL 작성툴·대량보유 서식(엑셀)만 예외이고, 코드리스트는
 * 이 예외에 들지 않는다.
 *
 * 종목코드(증권코드)·영문명·업종·상장구분이 한 파일에 다 있어 ①「무엇」이
 * 이 한 줄로 끝난다 — JPX 파일과 같은 칸을 다른(막히지 않은) 문에서 받는다.
 *
 * 상세 판정: docs/일본-데이터-출처-라이선스.md
 *
 * ── 받는 법 ─────────────────────────────────────────────────────────────
 * EDINET 코드리스트 다운로드 페이지(disclosure2.edinet-fsa.go.jp/weee0010.aspx)는
 * ASP.NET(GeneXus) 화면이라 정적 URL이 없다 — 내려받기 단추가 `onDownloadEdinet()`
 * 를 실행해 그 자리에서 zip 을 blob 으로 만든다. puppeteer 로 그 단추를 눌러 받는다.
 * ⚠ 사장님 화면(포트 9222)에 붙지 않는다 — 자동화 수집기는 **독립된 크롬**을 새로 띄운다
 *   (make-video-kcw-numberone.mjs 와 같은 패턴).
 *
 * 쓰는 법
 *   node scripts/collect-japan-jpx-companies.mjs             오늘 날짜로 한 벌 받는다
 *   node scripts/collect-japan-jpx-companies.mjs --selftest   CSV 파서만 자가시험(망 안 씀)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { put, storeStatus, remoteEnabled } from '../src/lib/store.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
/* ⚠ Git Bash 의 tar(GNU tar, zip 못 읽음)가 PATH 를 먼저 채간다 — Windows 내장
 * bsdtar(System32) 를 절대경로로 못박는다. 이 함정은 오늘(2026-09-20) 실측했다. */
const TAR = 'C:/Windows/System32/tar.exe';

/** 따옴표 있는 CSV 한 줄을 칸으로 가른다. 이 자료엔 칸마다 따옴표가 있다. */
export function CSV줄가르기(줄) {
  const 칸 = [];
  let 현재 = ''; let 안 = false;
  for (let i = 0; i < 줄.length; i++) {
    const c = 줄[i];
    if (c === '"') { 안 = !안; continue; }
    if (c === ',' && !안) { 칸.push(현재); 현재 = ''; continue; }
    현재 += c;
  }
  칸.push(현재);
  return 칸;
}

/** EDINET 코드리스트 CSV 전문(Shift-JIS 디코딩 뒤 문자열)을 구조화한다. */
export function 코드리스트파싱(text) {
  const 줄들 = text.split(/\r\n|\n/).filter((l) => l.length > 0);
  if (줄들.length < 2) throw new Error('CSV 줄 수가 너무 적다 — 받아온 파일이 온전한지 본다');
  const 메타 = CSV줄가르기(줄들[0]);
  const 머리 = CSV줄가르기(줄들[1]).map((s) => s.trim());
  const 자리 = {
    edinetCode: 머리.indexOf('ＥＤＩＮＥＴコード'),
    submitterType: 머리.indexOf('提出者種別'),
    listingStatus: 머리.indexOf('上場区分'),
    consolidated: 머리.indexOf('連結の有無'),
    capital: 머리.indexOf('資本金'),
    fiscalYearEnd: 머리.indexOf('決算日'),
    name: 머리.indexOf('提出者名'),
    nameEn: 머리.indexOf('提出者名（英字）'),
    nameReading: 머리.indexOf('提出者名（ヨミ）'),
    address: 머리.indexOf('所在地'),
    industry: 머리.indexOf('提出者業種'),
    securitiesCode: 머리.indexOf('証券コード'),
    corporateNumber: 머리.indexOf('提出者法人番号'),
  };
  for (const [k, i] of Object.entries(자리)) if (i < 0) throw new Error(`CSV 머리에서 "${k}" 칸을 못 찾았다 — 형식이 바뀌었을 수 있다`);

  const 전체 = [];
  for (let i = 2; i < 줄들.length; i++) {
    const 칸 = CSV줄가르기(줄들[i]);
    if (칸.length < 머리.length) continue;
    전체.push({
      edinetCode: 칸[자리.edinetCode].trim(),
      submitterType: 칸[자리.submitterType].trim(),
      listingStatus: 칸[자리.listingStatus].trim(),
      consolidated: 칸[자리.consolidated].trim(),
      capital: 칸[자리.capital].trim(),
      fiscalYearEnd: 칸[자리.fiscalYearEnd].trim(),
      name: 칸[자리.name].trim(),
      nameEn: 칸[자리.nameEn].trim(),
      nameReading: 칸[자리.nameReading].trim(),
      address: 칸[자리.address].trim(),
      industry: 칸[자리.industry].trim(),
      securitiesCode: 칸[자리.securitiesCode].trim(),
      corporateNumber: 칸[자리.corporateNumber].trim(),
    });
  }
  const 상장 = 전체.filter((r) => r.listingStatus === '上場' && r.securitiesCode);
  return { 실행일: 메타[1] || '', 전체건수: 전체.length, 전체, 상장 };
}

function 오늘문자() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

async function 받기() {
  const require2 = createRequire(path.join(ROOT, 'package.json'));
  const puppeteer = require2('puppeteer-core');
  const 임시방 = fs.mkdtempSync(path.join(ROOT, '.tmp-edinet-'));
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
  try {
    const page = await b.newPage();
    const client = await page.createCDPSession();
    await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: 임시방, eventsEnabled: true });
    let 받음 = null;
    client.on('Browser.downloadProgress', (e) => { if (e.state === 'completed') 받음 = e.guid; });

    await page.goto('https://disclosure2.edinet-fsa.go.jp/weee0010.aspx', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.evaluate(() => { onDownloadEdinet(); });

    const 시작 = Date.now();
    while (!받음 && Date.now() - 시작 < 30000) await new Promise((r) => setTimeout(r, 300));
    if (!받음) throw new Error('다운로드가 30초 안에 안 끝났다');
    await new Promise((r) => setTimeout(r, 500));

    const 받은파일들 = fs.readdirSync(임시방).filter((f) => !f.endsWith('.crdownload'));
    if (!받은파일들.length) throw new Error('임시방에 받은 파일이 없다');
    const zip경로 = path.join(임시방, 받은파일들[0]);
    execFileSync(TAR, ['-xf', zip경로, '-C', 임시방]);
    const csv경로 = path.join(임시방, 'EdinetcodeDlInfo.csv');
    const buf = fs.readFileSync(csv경로);
    const text = new TextDecoder('shift-jis').decode(buf);
    return text;
  } finally {
    await b.close();
    fs.rmSync(임시방, { recursive: true, force: true });
  }
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };

  본다('① 따옴표 있는 CSV 줄을 바로 가른다', JSON.stringify(CSV줄가르기('"a","b,c","d"')) === JSON.stringify(['a', 'b,c', 'd']));
  본다('② 따옴표 없는 칸도 가른다', JSON.stringify(CSV줄가르기('a,b,c')) === JSON.stringify(['a', 'b', 'c']));

  const 표본 = [
    'ダウンロード実行日,2026年09月20日現在,件数,2件',
    'ＥＤＩＮＥＴコード,提出者種別,上場区分,連結の有無,資本金,決算日,提出者名,提出者名（英字）,提出者名（ヨミ）,所在地,提出者業種,証券コード,提出者法人番号',
    '"E00004","内国法人・組合","上場","有","1491","5月31日","カネコ種苗株式会社","KANEKO SEEDS CO., LTD.","カネコシュビョウカブシキガイシャ","前橋市古市町一丁目５０番地１２","水産・農林業","13760","5070001000715"',
    '"E99999","内国法人・組合","","無","0","3月31日","비상장더미","NOT LISTED DUMMY","","","기타","","0000000000000"',
  ].join('\r\n');
  const 결과 = 코드리스트파싱(표본);
  본다('③ 전체 행을 다 읽는다', 결과.전체건수 === 2);
  본다('④ 상장(listingStatus==上場)만 상장 배열에 남긴다', 결과.상장.length === 1);
  본다('⑤ 영문명이 그대로 담긴다', 결과.상장[0].nameEn === 'KANEKO SEEDS CO., LTD.');
  본다('⑥ 증권코드가 담긴다', 결과.상장[0].securitiesCode === '13760');
  본다('⑦ 실행일 메타를 읽는다', 결과.실행일 === '2026年09月20日現在');
  본다('⑧ 머리가 바뀌면 에러를 던진다(자리를 못 찾으면 조용히 undefined 를 안 쌓는다)', (() => {
    try { 코드리스트파싱('a,b\nX,Y\n"1","2"'); return false; } catch { return true; }
  })());

  process.exit();
}

/* 🔴 여기부터가 «부르면 도는 몸»이다 */
const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'collect-japan-jpx-companies.mjs';
if (내가직접불렸나) {
  if (!remoteEnabled) console.warn('⚠ R2 미설정(ARCHIVE_S3_*): 로컬에만 저장된다.');
  const text = await 받기();
  const { 실행일, 전체건수, 상장 } = 코드리스트파싱(text);
  const 날 = 오늘문자();
  const out = {
    수집일: new Date().toLocaleString('ko-KR'),
    출처: 'EDINET 코드리스트 — 금융청(Financial Services Agency)',
    출처주소: 'https://disclosure2.edinet-fsa.go.jp/weee0010.aspx',
    라이선스: 'CC BY (PDL1.0) — 가공물엔 출처+가공 사실 표기 필요. 상세: docs/일본-데이터-출처-라이선스.md',
    EDINET실행일: 실행일,
    전체건수,
    상장건수: 상장.length,
    상장,
  };
  const r = await put(`raw/japan-jpx-companies/${날}.json`, JSON.stringify(out, null, 2), 'application/json');
  console.log(`✅ ${r.local}`);
  console.log(`전체 ${전체건수}건 중 상장(증권코드 있음) ${상장.length}건`);
  console.log(`R2 ${remoteEnabled ? '켜짐' : '꺼짐'} · ${JSON.stringify(storeStatus())}`);
}
