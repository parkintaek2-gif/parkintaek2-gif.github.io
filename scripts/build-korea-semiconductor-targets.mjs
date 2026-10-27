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
 * 🔴 [2026-10-27 · 1번] 업종을 넓히며 본체를 scripts/build-korea-sector-targets.mjs 로 옮겼다.
 *   규칙·예외·놓친 예는 src/lib/sector-targets.mjs 의 semiconductor 줄에 있다. 이 파일은 그것을
 *   부르는 껍데기다 — 출력 JSON 은 옮기기 전과 한 글자도 같다(옮길 때 비교했다).
 *
 * 실행  node scripts/build-korea-semiconductor-targets.mjs
 *       node scripts/build-korea-semiconductor-targets.mjs --자가시험
 */
import { 업종, 규칙에드나 } from '../src/lib/sector-targets.mjs';
import { 읽기, 쓰기, 차이, 줄세우기, 자가시험 as 공통자가시험 } from './build-korea-sector-targets.mjs';

const 반도체 = 업종('semiconductor');

/** 예전 이름 그대로 내보낸다(다른 곳이 부를 수 있다) */
export const 코드영문 = 반도체.ksicEn;
export const 명시추가 = 반도체.named;
export const 놓친예 = 반도체.misses;
export const 반도체인가 = (업종코드) => 규칙에드나(반도체, 업종코드);
export { 차이, 줄세우기 };

if (process.argv.includes('--자가시험')) 공통자가시험();
else {
  const 자료 = 읽기();
  if (!자료) { console.log('⚠ archive 가 없다 — 기존 출력 그대로 둔다'); process.exit(0); }
  쓰기(반도체, 자료);
}
