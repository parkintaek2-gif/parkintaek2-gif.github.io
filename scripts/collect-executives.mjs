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
/**
 * 2자리 연도를 4자리로 편다. `91` → 1991 · `05` → 2005.
 *
 * ⚠ **기준을 「올해의 두 자리」로 잡는다.** 그보다 크면 지난 세기다.
 *   임원 재직기간은 **과거에서 지금까지**라 미래 연도가 나올 수 없다.
 *   `26` 이면 2026(올해)이고 `27` 이면 1927 이다 — 1927년에 취임한 대표는 없지만,
 *   **틀린 미래 날짜를 만드는 것보다 낫다.** 미래가 되면 시작>끝이라 어차피 버려진다.
 */
export function 연도네자리(v, 오늘 = new Date()) {
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  if (String(v).length === 4) return n;
  const 올해두자리 = 오늘.getFullYear() % 100;
  return n <= 올해두자리 ? 2000 + n : 1900 + n;
}

export function 개월(s, 오늘 = new Date()) {
  if (!s) return null;
  const t = String(s).replace(/\s/g, '');
  if (/^[-–—]$/.test(t) || /해당없음|미등기|없음/.test(t)) return null;

  /* ① 「12년 3개월」 꼴 — 회사가 이미 계산해 준 것. 이게 가장 믿을 만하다 */
  let 총 = 0, 찾음 = false;
  const 년 = t.match(/(\d+(?:\.\d+)?)\s*년/);
  if (년) { 총 += parseFloat(년[1]) * 12; 찾음 = true; }
  const 월 = t.match(/(\d+(?:\.\d+)?)\s*(?:개월|월)/);
  if (월) { 총 += parseFloat(월[1]); 찾음 = true; }

  /*
   * ② 「2012.12.18~현재」 꼴 — **처음에 이걸 통째로 놓쳤다. 47%가 여기였다.**
   *   회사 절반쯤이 기간을 안 계산하고 날짜만 적는다. 실측해서 알았다.
   *   ⚠ 「1963.5~1996.11 / 2003.2~현재 (55년)」처럼 **여러 구간에 합계까지** 적는 곳도 있다.
   *     그래서 ①이 있으면 ①을 먼저 쓴다 — 회사가 직접 센 값이 우리 계산보다 낫다.
   */
  if (!찾음) {
    /* ⚠ 2026-08-05 에 두 꼴을 더 받게 고쳤다. 대표 1,190명(33.2%)이 여기서 떨어지고 있었다.
     *   실측한 원문의 꼴 (많은 순):
     *
     *     "1991.9.28~"        105건   ← **`~` 뒤에 아무것도 없다.** 「아직 재직 중」이라는 뜻이다
     *     "2015.03~"           82건   ← 같은 꼴, 일(日) 없음
     *     "2015.03.02~현재"          ← 이건 원래 됐다
     *     "91.9.28~"           25건   ← **2자리 연도**
     *
     *   앞의 정규식은 `~` 뒤에 「현재」나 4자리 연도를 **요구**했다. 그래서
     *   열려 있는 기간(`~` 로 끝나는 것)을 통째로 버렸다. 그게 제일 흔한 꼴이었다. */
    /* ⚠ 월·일·끝을 **전부 선택**으로 둔다. 실측한 꼴이 이만큼 갈린다.
     *     "1986~현재"        연도만          "2015.12.~현재"   월 뒤에 점이 남는다
     *     "2023. 3. ~ 현재"  점 + 공백        "1991.9.28~"      끝이 비어 있다
     *   처음 고칠 때 월을 **필수**로 두었다가 42건을 도로 잃었다 — 고치기 전보다 나빠졌다.
     *   그래서 `reparse` 에 「없어진 값」 카운터를 두고 그것을 보고 알았다. */
    const 패턴 = /(?<y>\d{4}|\d{2})[.\-/]?(?<m>\d{1,2})?[.\-/]?(?<d>\d{1,2})?[.\-/]?\s*~\s*(?<end>현재|재직중|(?<y2>\d{4}|\d{2})[.\-/]?(?<m2>\d{1,2})?)?/g;
    const 구간 = [...t.matchAll(패턴)];
    if (구간.length) {
      for (const g of 구간) {
        const { y, m, d: dd, end, y2, m2 } = g.groups;
        /* ⚠ 2자리 연도인데 월도 없으면 **읽지 않는다.** 「12~」가 2012년인지
         *   12개월인지 알 수 없다. 모르면 null 이 틀린 값보다 낫다. */
        if (y.length === 2 && m == null) continue;
        const 시작 = new Date(연도네자리(y, 오늘), (+(m ?? 1)) - 1, +(dd ?? 1));
        /* ⚠ 「현재」·「재직중」과 **빈 값(`~` 로 끝남)**을 같게 본다.
         *   「오늘」은 한국시간이다 — toISOString 을 쓰면 새벽에 하루가 어긋난다 */
        const 열림 = end == null || end === '현재' || end === '재직중';
        const 끝 = 열림 ? 오늘 : new Date(연도네자리(y2, 오늘), (+(m2 ?? 12)) - 1, 1);
        if (Number.isNaN(시작.getTime()) || Number.isNaN(끝.getTime())) continue;
        const d = (끝.getFullYear() - 시작.getFullYear()) * 12 + (끝.getMonth() - 시작.getMonth());
        if (d > 0) { 총 += d; 찾음 = true; }
      }
    }
  }

  /* 단위도 날짜도 없이 숫자만 있으면 **읽지 않는다** — 년인지 월인지 알 수 없다 */
  if (!찾음) return null;
  /* 60년 넘는 재직은 오기입이다. 사람의 근로 기간이 아니다 */
  if (총 > 720 || 총 <= 0) return null;
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
