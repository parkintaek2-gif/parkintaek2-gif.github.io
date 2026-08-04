#!/usr/bin/env node
/**
 * **상장사 기본정보** — 업종·주소·설립일·대표.
 *
 *   npm run collect:company        이어받기
 *
 * ── 사장님 지시(2026-08-04) ────────────────────────────────────
 *   「하나의 기업, 하나의 종목으로만 가공하지 말고 **업종이라든가 그룹을 잇는 데이터로도**」
 *   「시총 상위순으로 볼 수 있고, **업종별**」
 *
 * DART `company.json` 한 번에 다 온다.
 *   induty_code  업종코드   ← 업종별 집계의 열쇠
 *   adres        본사 주소  ← 「어디 있다?」 · 지역별 집계
 *   est_dt       설립일     ← 업력별 집계
 *   ceo_nm       대표이사   ← 「전영현, 노태문」처럼 복수도 온다
 *
 * ── ⚠ 업종코드를 그대로 쓰면 안 된다 ──────────────────────────
 * 실측(40개사) — 2자리 1 · 3자리 15 · 4자리 8 · 5자리 16.
 * **한국표준산업분류의 세분류와 세세분류가 섞여** 들어온다.
 * 그대로 묶으면 같은 업종이 여러 칸으로 갈라진다. **앞 2자리(중분류)로 정규화**한다.
 *
 * ⚠ 사장님이 「업종 코드는 아마 없을 거야」라고 하셨는데 **실측은 100%(40/40) 였다.**
 *   없는 건 코드가 아니라 **코드→이름 표**다. 그건 아래 `중분류` 에 손으로 넣었다.
 *   네이버금융·FnGuide 는 `Disallow: /` 라 못 쓴다(실측).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, renameSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const XML = path.resolve('archive/raw/dart-corpcode/CORPCODE.xml');
const OUT_DIR = path.resolve('archive/raw/dart-company');
const 간격ms = 210;

function 키읽기() {
  const p = path.resolve('.env');
  if (existsSync(p)) for (const l of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*DART_API_KEY\s*=\s*(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return process.env.DART_API_KEY ?? '';
}

/**
 * 한국표준산업분류 **중분류**(앞 2자리) 이름표.
 * ⚠ 공식 코드표를 API 로 못 받아서 손으로 넣었다. 통계분류포털(kssc.kostat.go.kr)이
 *   접속 실패했다. 틀린 게 보이면 여기를 고친다 — 화면에 그대로 나가는 이름이다.
 */
export const 중분류 = {
  '01': '농업', '02': '임업', '03': '어업', '05': '석탄광업', '06': '원유·천연가스',
  '07': '금속광업', '08': '비금속광물광업', '09': '광업 지원',
  '10': '식료품 제조', '11': '음료 제조', '12': '담배 제조', '13': '섬유제품 제조',
  '14': '의복 제조', '15': '가죽·신발 제조', '16': '목재 제조', '17': '펄프·종이 제조',
  '18': '인쇄·기록매체', '19': '코크스·석유정제', '20': '화학물질·화학제품',
  '21': '의료용 물질·의약품', '22': '고무·플라스틱', '23': '비금속 광물제품',
  '24': '1차 금속', '25': '금속가공제품', '26': '전자부품·컴퓨터·통신장비',
  '27': '의료·정밀·광학기기', '28': '전기장비', '29': '기타 기계·장비',
  '30': '자동차·트레일러', '31': '기타 운송장비', '32': '가구 제조',
  '33': '기타 제품 제조', '34': '산업용 기계 수리', '35': '전기·가스·증기',
  '36': '수도업', '37': '하수·폐기물', '38': '폐기물 수집·처리', '39': '환경 정화',
  '41': '종합 건설', '42': '전문직별 공사',
  '45': '자동차 판매', '46': '도매·상품중개', '47': '소매업',
  '49': '육상운송', '50': '수상운송', '51': '항공운송', '52': '창고·운송 관련',
  '55': '숙박업', '56': '음식점·주점',
  '58': '출판업', '59': '영상·오디오 제작', '60': '방송업', '61': '통신업',
  '62': '컴퓨터 프로그래밍·SI', '63': '정보서비스업',
  '64': '금융업', '65': '보험·연금', '66': '금융·보험 관련 서비스',
  '68': '부동산업', '69': '임대업',
  '70': '연구개발업', '71': '전문서비스업', '72': '건축기술·엔지니어링',
  '73': '기타 과학기술 서비스', '74': '전문·과학·기술 서비스',
  '75': '사업시설 관리', '76': '사업지원 서비스',
  '84': '공공행정', '85': '교육서비스업',
  '86': '보건업', '87': '사회복지 서비스',
  '90': '창작·예술·여가', '91': '스포츠·오락',
  '94': '협회·단체', '95': '수리업', '96': '기타 개인 서비스',
};

/**
 * 업종코드를 **중분류 2자리**로 정규화한다.
 * ⚠ 자릿수가 2~5로 섞여 온다. 앞 2자리를 떼는 게 전부지만,
 *   2자리 미만이거나 숫자가 아니면 **null 을 낸다.** 억지로 맞추지 않는다.
 */
export function 업종정규화(code) {
  if (code == null) return null;
  const s = String(code).trim();
  if (!/^\d{2,}$/.test(s)) return null;
  const 두자리 = s.slice(0, 2);
  return { 코드: 두자리, 이름: 중분류[두자리] ?? null };
}

function 값(덩이, 태그) {
  const m = 덩이.match(new RegExp(`<${태그}>([\\s\\S]*?)</${태그}>`));
  if (!m) return '';
  return m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();
}

export function 상장사목록(xml) {
  const 표 = [];
  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const 덩이 = m[1];
    const 종목 = 값(덩이, 'stock_code');
    if (!/^\d{6}$/.test(종목)) continue;
    표.push({ corp: 값(덩이, 'corp_code'), 종목, 이름: 값(덩이, 'corp_name') });
  }
  return 표;
}

/** 주소에서 **시·도**만 뽑는다 — 지역별 집계용 */
export function 시도(주소) {
  if (!주소) return null;
  const m = String(주소).trim().match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
  if (m) return m[1];
  const m2 = String(주소).trim().match(/^(\S+?)(?:특별시|광역시|특별자치시|특별자치도|도)\b/);
  return m2 ? m2[1] : null;
}

async function main() {
  const 키 = 키읽기();
  if (!키) { console.error('✕ DART_API_KEY 가 없다.'); process.exit(1); }
  if (!existsSync(XML)) { console.error(`✕ ${XML} 이 없다.`); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  const 본산출 = path.join(OUT_DIR, 'company.ndjson');
  /**
   * `--refetch` — 열을 새로 넣었을 때 쓴다(2026-08-05: 사업자번호·법인번호).
   *
   * ⚠ **본파일을 지우고 다시 받지 않는다.** `.new` 에 받고 **다 받은 뒤에** 바꾼다.
   *   중간에 죽어도 쓰던 파일이 안 비워진다 — 한 번 비워 먹은 적이 있다.
   */
  const 다시받기 = process.argv.includes('--refetch');
  const 산출 = 다시받기 ? 본산출 + '.new' : 본산출;

  const 완료 = new Set();
  if (existsSync(산출)) for (const l of readFileSync(산출, 'utf8').split('\n')) {
    if (!l) continue;
    try { 완료.add(JSON.parse(l).corp); } catch { /* 깨진 줄 */ }
  }

  const 목록 = 상장사목록(readFileSync(XML, 'utf8'));
  const 남은 = 목록.filter((x) => !완료.has(x.corp));
  console.log(`상장사 ${목록.length.toLocaleString()} · 이미 받음 ${완료.size.toLocaleString()} · 받을 것 ${남은.length.toLocaleString()}`);

  let 성공 = 0, 없음 = 0, 실패 = 0, 업종있음 = 0;
  for (const [i, c] of 남은.entries()) {
    try {
      const r = await fetch(`https://opendart.fss.or.kr/api/company.json?crtfc_key=${키}&corp_code=${c.corp}`, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      if (j.status === '013') 없음++;
      else if (j.status !== '000') {
        실패++;
        if (j.status === '020') { console.error('\n✕ DART 일일 한도 초과. 멈춘다. 내일 이어받는다.'); break; }
      } else {
        const 업 = 업종정규화(j.induty_code);
        if (업) 업종있음++;
        appendFileSync(산출, JSON.stringify({
          corp: c.corp, 종목: c.종목, 이름: j.corp_name, 영문: j.corp_name_eng,
          /**
           * ⭐ **사업자등록번호·법인등록번호를 같이 저장한다.**
           *
           * 2026-08-05 에 국민연금 사업장 파일(593,127행)을 받아 상장사에 붙이려는데
           * **붙일 열쇠가 없었다.** 포털 파일은 사업자번호가 앞 6자리로 잘려 오고,
           * 우리 쪽에는 아예 안 받아 뒀다. 그래서 **이름으로 붙였고 69.9% 였다.**
           *
           * 이름 매칭은 정답이 아니라 근사다. 열쇠를 안 받아 둔 대가를
           * 나중에 **다시 3,925번 부르는 것**으로 치렀다. 앞으로는 같이 받는다.
           */
          사업자번호: j.bizr_no ?? null, 법인번호: j.jurir_no ?? null,
          시장: j.corp_cls, 대표: j.ceo_nm, 설립: j.est_dt, 결산월: j.acc_mt,
          업종코드: j.induty_code, 업종: 업?.코드 ?? null, 업종명: 업?.이름 ?? null,
          주소: j.adres, 시도: 시도(j.adres), 홈페이지: j.hm_url,
        }) + '\n');
        성공++;
      }
    } catch { 실패++; }
    if ((i + 1) % 300 === 0) console.log(`  ${i + 1}/${남은.length} — 성공 ${성공} · 업종있음 ${업종있음} · 미제출 ${없음} · 실패 ${실패}`);
    await new Promise((x) => setTimeout(x, 간격ms));
  }
  console.log(`\n✅ 성공 ${성공.toLocaleString()} · 업종 있음 ${업종있음.toLocaleString()} · 미제출 ${없음.toLocaleString()} · 실패 ${실패.toLocaleString()}`);
  console.log(`   ${산출}`);

  if (다시받기) {
    const 줄수 = (p) => readFileSync(p, 'utf8').split('\n').filter((x) => x.trim()).length;
    const 옛수 = existsSync(본산출) ? 줄수(본산출) : 0;
    const 새수 = 줄수(산출);
    console.log(`\n■ 옛 ${옛수.toLocaleString()} → 새 ${새수.toLocaleString()}`);
    /* ⚠ **줄어들면 바꾸지 않는다.** 조용히 반쪽이 되는 것이 제일 나쁘다 */
    if (새수 >= 옛수 * 0.95) {
      if (existsSync(본산출)) renameSync(본산출, 본산출 + '.bak');
      renameSync(산출, 본산출);
      console.log(`✅ ${path.basename(본산출)} 을 새것으로 바꿨다 (옛것은 .bak).`);
    } else {
      console.log(`⏸ 아직 ${(새수 / 옛수 * 100).toFixed(1)}% 다. 다시 부르면 이어받는다.`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
