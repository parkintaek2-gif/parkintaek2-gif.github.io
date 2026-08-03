#!/usr/bin/env node
/**
 * **상장사 임원 현황** — 재직기간·직위·경력·최대주주와의 관계.
 *
 *   npm run collect:exec            이어받기
 *   npm run collect:exec -- --year 2024
 *
 * ── 사장님 지시(2026-08-04) ────────────────────────────────────
 *   「**재벌들 대표이사, 사내이사 재직년수 순위.** 기업보고서 예야」
 *   「시총 상위순으로 볼 수 있고, **업종별**. 재직년수 긴 회사 순 등」
 *
 * ── 이 데이터가 왜 센가 ────────────────────────────────────────
 * DART `exctvSttus` 한 번에 다음이 같이 온다. 흩어져 있으면 못 만들 표가 나온다.
 *
 *   nm                    이름
 *   ofcps                 직위 (회장·부회장·사장·전무…)
 *   rgist_exctv_at        **사내이사 / 사외이사 / 미등기** ← 사장님이 가르신 축
 *   chrg_job              담당업무 — 여기에 「대표이사」가 적힌다
 *   hffc_pd               **재직기간** ← 순위의 대상
 *   mxmm_shrholdr_relate  **최대주주와의 관계** ← 「본인」·「친인척」이면 오너 일가다
 *   main_career           **학력·경력** ← 백년지도「대학 이후」의 원자료
 *   birth_ym              출생년월 → 나이
 *
 * ⚠ `mxmm_shrholdr_relate` 로 재벌 오너 일가를 가른다. 「계열회사 임원」은 전문경영인이고
 *   「본인」·「친인척」이 오너 쪽이다. **이 구분이 없으면 순위가 아무 뜻도 없다** —
 *   오너가 30년 앉아 있는 것과 전문경영인이 30년 살아남은 것은 완전히 다른 이야기다.
 *
 * ⚠ 이름·생년월이 들어온다. **개인정보다.** 원본은 아카이브에만 두고,
 *   발행할 때는 사장님이 물으신 축(재직기간·직위·관계)만 쓴다.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const XML = path.resolve('archive/raw/dart-corpcode/CORPCODE.xml');
const OUT_DIR = path.resolve('archive/raw/dart-executives');
const 간격ms = 220;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}

function 값(덩이, 태그) {
  const m = 덩이.match(new RegExp(`<${태그}>([\\s\\S]*?)</${태그}>`));
  if (!m) return '';
  return m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
}

/**
 * 재직기간을 **개월 수**로 바꾼다.
 * ⚠ DART 는 이 칸을 자유 서식으로 받는다. 회사마다 제각각이다. 실제로 본 것들:
 *     `10개월` `46개월` `3년 2개월` `3년2월` `12년` `-` `2020.03~` `해당없음`
 *   그래서 **못 읽으면 null 을 낸다.** 0 으로 만들면 순위 맨 아래가 쓰레기로 찬다.
 */
export function 개월(s) {
  if (!s) return null;
  const t = String(s).replace(/\s/g, '');
  if (/^[-–—]$/.test(t) || /해당없음|미등기|없음/.test(t)) return null;
  let 총 = 0, 찾음 = false;
  const 년 = t.match(/(\d+(?:\.\d+)?)\s*년/);
  if (년) { 총 += parseFloat(년[1]) * 12; 찾음 = true; }
  const 월 = t.match(/(\d+(?:\.\d+)?)\s*(?:개월|월)/);
  if (월) { 총 += parseFloat(월[1]); 찾음 = true; }
  /* 단위 없이 숫자만 있으면 **읽지 않는다** — 년인지 월인지 알 수 없다 */
  if (!찾음) return null;
  /* 60년 넘는 재직은 오기입이다. 사람의 근로 기간이 아니다 */
  if (총 > 720) return null;
  return Math.round(총);
}

/** 담당업무·직위에서 대표이사인지 가린다 */
export function 대표인가(직위, 담당) {
  const t = `${직위 ?? ''} ${담당 ?? ''}`.replace(/\s/g, '');
  return /대표이사|대표집행임원|각자대표|공동대표/.test(t);
}

/**
 * 최대주주와의 관계로 **오너 일가인지** 가린다.
 * ⚠ 「계열회사 임원」은 오너가 아니다. 그룹 안에서 옮겨 다닌 전문경영인이다.
 *   여기를 틀리면 「재벌 오너 재직기간 순위」에 전문경영인이 잔뜩 섞인다.
 */
export function 오너인가(관계) {
  const t = String(관계 ?? '').replace(/\s/g, '');
  if (!t || /^[-–—]$/.test(t)) return null;
  if (/^본인$|최대주주본인/.test(t)) return true;
  if (/친인척|배우자|자녀|형제|부친|모친|특수관계인/.test(t)) return true;
  if (/계열회사임원|계열사임원|임원|해당없음|없음/.test(t)) return false;
  return null;   /* 애매하면 단정하지 않는다 */
}

/**
 * 주요경력에서 **학력**만 뽑는다 — 백년지도「대학 이후」의 원자료.
 *
 * ⚠ 「대학」이 이름에 안 들어가는 학교가 많다. 처음에 KAIST 를 통째로 놓쳤다.
 *   KAIST·POSTECH·UNIST·GIST·DGIST 는 국내 이공계 임원 경력에 아주 흔하다.
 *   이걸 빠뜨리면 「어느 대학 출신이 임원이 되나」가 통째로 기운다.
 */
const 약칭대학 = /\b(KAIST|POSTECH|UNIST|GIST|DGIST|MIT|Stanford|Harvard|Yale|Cornell|Berkeley|Oxford|Cambridge|Wharton|Columbia|Chicago|Michigan|Purdue|Caltech|LSE|INSEAD)\b/i;

export function 학력(경력) {
  if (!경력) return null;
  const t = String(경력).replace(/\n/g, ' ');
  const 약 = t.match(약칭대학);
  if (약) return 약[1].toUpperCase() === 약[1] ? 약[1] : 약[1];
  const m = t.match(/([가-힣A-Za-z]{2,12}(?:대학교|대학원|대학|대|Univ\.?|University))/);
  return m ? m[1].trim().replace(/^ㆍ/, '') : null;
}

export function 상장사목록(xml) {
  const 표 = [];
  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const 덩이 = m[1];
    const 종목 = 값(덩이, 'stock_code');
    if (!종목) continue;
    표.push({ corp: 값(덩이, 'corp_code'), 종목, 이름: 값(덩이, 'corp_name') });
  }
  return 표;
}

async function main() {
  const i = process.argv.indexOf('--year');
  const 연도 = i > -1 ? process.argv[i + 1] : '2025';
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다.'); process.exit(1); }
  if (!existsSync(XML)) { console.error(`✕ ${XML} 이 없다.`); process.exit(1); }

  mkdirSync(OUT_DIR, { recursive: true });
  const 산출 = path.join(OUT_DIR, `executives-${연도}.ndjson`);
  const 완료 = new Set();
  if (existsSync(산출)) for (const l of readFileSync(산출, 'utf8').split('\n')) {
    if (!l) continue;
    try { 완료.add(JSON.parse(l).corp); } catch { /* 깨진 줄 */ }
  }

  const 목록 = 상장사목록(readFileSync(XML, 'utf8'));
  const 남은 = 목록.filter((x) => !완료.has(x.corp));
  console.log(`상장사 ${목록.length.toLocaleString()} · 이미 받음 ${완료.size.toLocaleString()} · 받을 것 ${남은.length.toLocaleString()} (${연도})`);

  let 회사 = 0, 임원 = 0, 없음 = 0, 실패 = 0;
  for (const [n, c] of 남은.entries()) {
    const u = `https://opendart.fss.or.kr/api/exctvSttus.json?crtfc_key=${키}&corp_code=${c.corp}&bsns_year=${연도}&reprt_code=11011`;
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      if (j.status === '013') 없음++;
      else if (j.status !== '000') {
        실패++;
        if (j.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다. 내일 같은 명령으로 이어받는다.'); break; }
      } else {
        const 줄 = j.list.map((x) => ({
          corp: c.corp, 종목: c.종목, 회사: c.이름, 연도,
          이름: x.nm, 성별: x.sexdstn, 생년월: x.birth_ym,
          직위: x.ofcps, 구분: x.rgist_exctv_at, 상근: x.fte_at,
          담당: (x.chrg_job ?? '').replace(/\s+/g, ' ').trim(),
          대표: 대표인가(x.ofcps, x.chrg_job),
          관계: x.mxmm_shrholdr_relate, 오너: 오너인가(x.mxmm_shrholdr_relate),
          재직개월: 개월(x.hffc_pd), 재직원문: x.hffc_pd,
          임기만료: x.tenure_end_on,
          학력: 학력(x.main_career),
          경력: (x.main_career ?? '').replace(/\s+/g, ' ').trim().slice(0, 400),
        }));
        for (const z of 줄) appendFileSync(산출, JSON.stringify(z) + '\n');
        회사++; 임원 += 줄.length;
      }
    } catch { 실패++; }
    if ((n + 1) % 200 === 0) console.log(`  ${n + 1}/${남은.length} — 회사 ${회사} · 임원 ${임원.toLocaleString()} · 미제출 ${없음} · 실패 ${실패}`);
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n✅ ${연도}년 — 회사 ${회사.toLocaleString()} · 임원 ${임원.toLocaleString()} · 미제출 ${없음.toLocaleString()} · 실패 ${실패.toLocaleString()}`);
  console.log(`   ${산출}`);
}

/* ⚠ argv[1] 이 없을 때(node -e 로 불러들일 때)를 막는다 — 시험이 여기서 죽었다 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
