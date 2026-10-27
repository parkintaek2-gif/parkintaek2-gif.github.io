#!/usr/bin/env node
/**
 * build-korea-semiconductor-targets.mjs — /data/korea-semiconductor-target-prices 지면의 자료.
 *
 * ── 왜 (2026-10-27 · 5번 지시, 10-30 21:00 까지) ─────────────────────────
 * 「반도체 업종 페이지 — 한국 반도체 종목을 한 화면에, 목표주가 순. 주소 하나로 전 종목
 *   목표주가가 보인다」. 기사가 지목한 손님(홍콩·대만 개인 투자자)이 가장 많이 찾는 업종이다.
 *
 * ⛔ 자료를 새로 모으지 않는다 — 이미 있는 셋만 읽는다.
 *   업종     archive/raw/dart-company/company.ndjson 의 «업종코드»(DART 기업개황 · KSIC 5자리까지)
 *   리서치   src/data/company-research.json (scripts/build-company-research.mjs)
 *   종가     archive/raw/stocks/YYYYMMDD.ndjson 가운데 가장 최근 날 (공공데이터포털 15094808 ·
 *            금융위원회 주식시세정보 · 이용허락 「제한 없음」 — docs/데이터-출처-라이선스.md)
 *
 * ── 「반도체」를 무엇으로 가르나 — 지면에 그대로 적는다 ───────────────────
 * ⚠ 저장소의 업종 사전(src/lib/sector-en.mjs · seoulmarkets-sectors.json)은 KSIC «중분류»(두 자리)다.
 *   반도체는 26 「전자부품·컴퓨터·통신장비」 한 칸에 디스플레이·PCB·휴대폰 부품과 섞여 있어
 *   그 칸으로 가르면 반도체 지면이 아니게 된다. 그래서 DART 기업개황의 세분류 코드를 쓴다.
 *   규칙   KSIC 261(반도체 제조업 — 집적회로·개별소자, 하위 2611·2612 포함) 또는
 *          29271(반도체 제조용 기계 제조업)
 *   예외   «이름을 박아» 하나만 더한다 — 삼성전자(005930). 기업개황 코드는 264(통신·방송장비)인데
 *          2025 사업보고서가 반도체 부문(DS)을 별도 보고부문으로 적는다(archive/raw/dart-segments).
 *          ⛔ 예외는 지면에 이름과 까닭을 적는다. 몰래 넣지 않는다.
 *   ⚠ 이 규칙이 놓치는 회사가 있다(소재는 화학 20, 부품은 262, 장비 일부는 292 로 적힌다).
 *     그것도 지면에 적는다 — 「못 넣은 것」을 숨기지 않는다.
 *
 * ⛔ 없는 값은 null. 종가와 목표 중앙값이 «둘 다» 잰 것일 때만 차이를 셈한다.
 * ⛔ 한글을 싣지 않는다 — 끝에서 재서 멈춘다.
 *
 * 산출  src/data/korea-semiconductor-targets.json  (커밋한다 — archive/ 는 빌드 컨테이너에 없다)
 * 실행  node scripts/build-korea-semiconductor-targets.mjs
 *       node scripts/build-korea-semiconductor-targets.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** KSIC 코드 → 영문 이름(KSIC 10차 영문판에 맞춘 우리 표기). 규칙에 드는 코드만 */
export const 코드영문 = {
  '261': 'Semiconductors',
  '2611': 'Electronic integrated circuits',
  '26111': 'Memory integrated circuits',
  '26112': 'Non-memory and other integrated circuits',
  '2612': 'Diodes, transistors and similar semiconductor devices',
  '26121': 'Light-emitting diodes',
  '26129': 'Other semiconductor devices',
  '29271': 'Machinery for semiconductor manufacturing',
};

/** 규칙 밖인데 이름을 박아 넣는 곳 — 까닭을 같이 싣는다(지면이 그대로 적는다) */
export const 명시추가 = {
  '005930': {
    reason: 'Filed under KSIC 264 (communication and broadcasting equipment), but its 2025 business report lists the Device Solutions (DS) semiconductor division as a separate reporting segment.',
  },
};

/** 규칙이 «놓치는» 예 — 반도체 장비·소재·부품을 만들지만 다른 코드로 적힌 곳(리서치가 있는 곳만).
 *  ⛔ 넣지 않는다. 지면에 「이 규칙은 이런 곳을 놓친다」고 적는 데만 쓴다 */
export const 놓친예 = ['240810', '058470', '357780', '232140', '003160'];
const 놓친코드영문 = {
  '292': 'special-purpose machinery', '2629': 'other electronic components', '204': 'other chemical products',
  '27212': 'measuring, testing and analysing instruments',
};

/** 규칙 — KSIC 261 으로 시작하거나 29271 이면 반도체 */
export function 반도체인가(업종코드) {
  const k = String(업종코드 ?? '').trim();
  return /^261/.test(k) || k === '29271';
}

/** 중앙 목표 ÷ 종가 − 1. ⛔ 한쪽이라도 못 쟀으면 null */
export function 차이(중앙, 종가) {
  if (!Number.isFinite(중앙) || !Number.isFinite(종가) || 종가 <= 0 || 중앙 <= 0) return null;
  return 중앙 / 종가 - 1;
}

/** 줄 세우기 — 목표를 낸 증권사 수가 많은 곳부터, 다음은 리포트 수, 다음은 종목코드 */
export function 줄세우기(a, b) {
  return (b.targets.firms - a.targets.firms) || (b.reports - a.reports) || a.code.localeCompare(b.code);
}

const 날짜꼴 = (s) => (/^\d{8}$/.test(String(s)) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null);

function 자가시험() {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);
  본다('261 은 반도체', 반도체인가('261'));
  본다('2612 는 반도체', 반도체인가('2612'));
  본다('26112 는 반도체', 반도체인가('26112'));
  본다('29271 은 반도체 장비', 반도체인가('29271'));
  본다('29272(디스플레이 장비)는 아니다', !반도체인가('29272'));
  본다('2927(반도체·디스플레이 장비를 가르지 않은 코드)는 안 넣는다', !반도체인가('2927'));
  본다('262(전자부품)는 아니다', !반도체인가('262'));
  본다('26 만 적힌 것은 안 넣는다', !반도체인가('26'));
  본다('빈 것은 아니다', !반도체인가(null) && !반도체인가(''));
  본다('차이 셈', Math.abs(차이(150, 100) - 0.5) < 1e-12);
  본다('종가가 없으면 null', 차이(150, null) === null);
  본다('목표가 없으면 null — 0 이 아니다', 차이(null, 100) === null);
  본다('종가 0 이면 null', 차이(150, 0) === null);
  const xs = [
    { code: '2', reports: 1, targets: { firms: 1 } },
    { code: '1', reports: 5, targets: { firms: 0 } },
    { code: '3', reports: 2, targets: { firms: 1 } },
  ].sort(줄세우기);
  본다('목표 낸 곳 많은 순 → 리포트 수 순', xs.map((x) => x.code).join(',') === '3,2,1');
  본다('날짜꼴', 날짜꼴('20261023') === '2026-10-23' && 날짜꼴('x') === null);
  const 실패 = 잰다.filter(([, ok]) => !ok);
  for (const [이름, ok] of 잰다) console.log(`${ok ? 'PASS' : 'FAIL'}  ${이름}`);
  if (실패.length) { console.error(`자가시험 실패 ${실패.length}건`); process.exit(1); }
  console.log(`자가시험 ${잰다.length}건 통과`);
}

function main() {
  const 회사길 = path.join(뿌리, 'archive/raw/dart-company/company.ndjson');
  const 시세방 = path.join(뿌리, 'archive/raw/stocks');
  if (!fs.existsSync(회사길) || !fs.existsSync(시세방)) {
    console.log('⚠ archive 가 없다 — 기존 출력 그대로 둔다');
    process.exit(0);
  }
  const 회사들 = fs.readFileSync(회사길, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const 리서치 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/company-research.json'), 'utf8'));
  const fin = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/korea-financials-tape.json'), 'utf8'));
  const 재무영문 = new Map();
  for (const r of fin.rows) if (r.name_en && !재무영문.has(String(r.code))) 재무영문.set(String(r.code), String(r.name_en).trim());

  /* 가장 최근 시세 파일 하나 */
  const 시세파일 = fs.readdirSync(시세방).filter((f) => /^\d{8}\.ndjson$/.test(f)).sort().at(-1);
  if (!시세파일) { console.error('⛔ 시세 파일이 없다'); process.exit(1); }
  const 시세 = new Map();
  for (const 줄 of fs.readFileSync(path.join(시세방, 시세파일), 'utf8').split(/\r?\n/)) {
    if (!줄.trim()) continue;
    let x; try { x = JSON.parse(줄); } catch { continue; }
    if (!/^\d{6}$/.test(String(x.코드 ?? ''))) continue;
    시세.set(String(x.코드), {
      close: Number.isFinite(x.종가) && x.종가 > 0 ? x.종가 : null,
      date: 날짜꼴(x.일자),
      noTrade: x.거래없음 === true,
      market: ['KOSPI', 'KOSDAQ', 'KONEX'].includes(x.시장) ? x.시장 : null,
    });
  }
  if (시세.size < 1000) { console.error(`⛔ 시세가 ${시세.size}종목뿐이다 — 칸 이름이 바뀌었는지 본다`); process.exit(1); }

  const 고른것 = [];
  const 연구없음 = [];
  const 본코드 = new Set();
  for (const o of 회사들) {
    const code = String(o.종목 ?? '').trim();
    if (!/^\d{6}$/.test(code) || 본코드.has(code)) continue;
    const 규칙 = 반도체인가(o.업종코드);
    const 예외 = 명시추가[code];
    if (!규칙 && !예외) continue;
    본코드.add(code);
    const k = String(o.업종코드 ?? '').trim();
    const r = 리서치.byCode[code] ?? null;
    const s = 시세.get(code) ?? null;
    const 영문 = r?.nameEn || 재무영문.get(code) || (o.영문 && !/[가-힣]/.test(o.영문) ? String(o.영문).trim() : null);
    const 머리 = {
      code,
      nameEn: 영문,
      ksic: k,
      ksicEn: 코드영문[k] ?? null,
      includedBy: 규칙 ? 'ksic' : 'named',
      ...(예외 && !규칙 ? { reason: 예외.reason } : {}),
      market: s?.market ?? null,
    };
    if (!r) { 연구없음.push(머리); continue; }
    const 중앙 = r.latestTargets.median;
    const 종가 = s?.close ?? null;
    고른것.push({
      ...머리,
      reports: r.reports,
      brokerReports: r.brokerReports,
      firms: r.firms,
      first: r.first,
      last: r.last,
      targets: {
        firms: r.latestTargets.firms,
        min: r.latestTargets.min,
        max: r.latestTargets.max,
        median: 중앙,
        oldest: r.latestTargets.oldest ?? null,
        newest: r.latestTargets.newest ?? null,
      },
      latestRating: r.latest.find((x) => x.rating)?.rating ?? null,
      close: 종가,
      closeDate: 종가 != null ? s.date : null,
      closeNoTrade: 종가 != null ? s.noTrade : null,
      medianVsClose: 차이(중앙, 종가),
    });
  }
  고른것.sort(줄세우기);
  const 회사표 = new Map(회사들.map((o) => [String(o.종목 ?? ''), o]));
  const 놓친것 = 놓친예.map((code) => {
    const o = 회사표.get(code);
    const k = String(o?.업종코드 ?? '').trim();
    if (반도체인가(k)) throw new Error(`놓친예 ${code} 가 규칙에 든다 — 목록을 고친다`);
    return {
      code,
      nameEn: 리서치.byCode[code]?.nameEn || 재무영문.get(code) || null,
      ksic: k || null,
      ksicEn: 놓친코드영문[k] ?? null,
      reports: 리서치.byCode[code]?.reports ?? null,
    };
  });
  연구없음.sort((a, b) => String(a.nameEn ?? a.code).localeCompare(String(b.nameEn ?? b.code), 'en'));

  const 결과 = {
    _meta: {
      what: 'Korean semiconductor companies with broker research in our sample: per-company target-price distribution and latest close.',
      rule: 'KSIC code on the DART company register starts with 261 (manufacture of semiconductors) or is 29271 (machinery for semiconductor manufacturing); plus companies named in namedAdditions.',
      namedAdditions: Object.entries(명시추가).map(([code, v]) => ({ code, reason: v.reason })),
      researchSource: 리서치._meta.source,
      researchFirstDay: 리서치._meta.firstDay,
      researchLastDay: 리서치._meta.lastDay,
      priceSource: 'Financial Services Commission stock price data (data.go.kr 15094808), daily close.',
      priceFile: 시세파일,
      priceDate: 날짜꼴(시세파일.slice(0, 8)),
      industrySource: 'DART company register (Financial Supervisory Service), industry code field.',
      matched: 고른것.length + 연구없음.length,
      withResearch: 고른것.length,
      withTarget: 고른것.filter((x) => x.targets.firms > 0).length,
      withGap: 고른것.filter((x) => x.medianVsClose != null).length,
      order: 'Most firms with a stated target first; then most reports; then ticker.',
      builtBy: 'scripts/build-korea-semiconductor-targets.mjs — do not edit by hand',
    },
    rows: 고른것,
    noResearch: 연구없음,
    ruleMisses: 놓친것,
  };
  const 글 = JSON.stringify(결과);
  if (/[가-힣]/.test(글)) {
    const 자리 = 글.search(/[가-힣]/);
    console.error(`⛔ 출력에 한글이 섞였다: …${글.slice(Math.max(0, 자리 - 60), 자리 + 20)}…`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(뿌리, 'src/data/korea-semiconductor-targets.json'), JSON.stringify(결과, null, 1) + '\n');
  console.log(`반도체 ${결과._meta.matched}곳 · 리서치 있음 ${고른것.length} · 목표 있음 ${결과._meta.withTarget} · 차이 셈 ${결과._meta.withGap} · 종가 ${결과._meta.priceDate}`);
  const 이름없음 = [...고른것, ...연구없음].filter((x) => !x.nameEn).map((x) => x.code);
  if (이름없음.length) console.log(`  ⚠ 영문 이름 없음: ${이름없음.join(', ')}`);
}

if (process.argv.includes('--자가시험')) 자가시험();
else main();
