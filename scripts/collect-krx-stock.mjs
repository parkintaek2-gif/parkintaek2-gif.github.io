#!/usr/bin/env node
/**
 * collect-krx-stock.mjs — 🔴 **더 쓰지 않는다. 비석이다.**
 *
 * ── 왜 지우지 않고 비석으로 두나 ─────────────────────────────────────────
 * 파일을 없애면 다음 세션이 「시세 수집기가 없네」 하고 **또 만든다.**
 * 그래서 남겨 두고, 부르면 «멈추면서 갈 곳을 알려 준다».
 *
 * ── 사장님 지시 (2026-09-09) ─────────────────────────────────────────────
 * 「**공공데이터포털에서만 수집하도록 해, krx 자료가 전혀 필요없네**」
 *
 * ── 까닭 (약관 실측) ─────────────────────────────────────────────────────
 * KRX OPEN API 이용약관
 *   제6조②  「API 서비스를 «비상업적인 목적으로만» 이용할 수 있다」
 *   제6조   「이용한 결과에 대한 «대가를 제3자에게 청구해서는 아니된다»」
 *   제11조  「제공받은 정보를 «제3자에게 제공할 수 없다»」
 * ⛔ 그런데 이 값이 **파는 상품**(Korea People Panel · Company Master)에 들어가 있었다.
 * ⚠ 6번이 앞서 재서 「지금 쓰는 키는 무료 개발자 등급이고, 상업 이용은 유료 구매가
 *   필요하다」까지 확인해 두었었다. 그 답을 사장님이 「포털만 쓴다」로 정리하셨다.
 *
 * ── 대신 여기서 받는다 ───────────────────────────────────────────────────
 * 공공데이터포털 주식시세정보 15094808 (금융위원회 · 이용허락범위 «제한 없음»)
 *   수집:  node scripts/collect-stock-prices.mjs
 *   저장:  archive/raw/stocks/<YYYYMMDD>.ndjson
 *   읽기:  src/lib/stock-prices-datago.mjs  →  시세(뿌리) · 코드지도(줄들)
 *          ⭐ 칸 이름이 KRX 그대로 나온다(ISU_CD·TDD_CLSPRC·MKTCAP·ACC_TRDVAL…)
 *   ⭐ 커버도 더 넓다 — KRX 유가증권 943 → 포털 2,873(코스닥·코넥스까지)
 *
 * 정본: docs/수집-금지경로.tsv · 검사: scripts/check-forbidden-sources.mjs
 */

console.log('🔴 collect-krx-stock.mjs 는 더 쓰지 않는다 — 비석이다.');
console.log('   까닭: KRX OPEN API 약관 제6조② 「비상업적인 목적으로만」 — 우리는 판다.');
console.log('   사장님(2026-09-09): 「공공데이터포털에서만 수집하도록 해, krx 자료가 전혀 필요없네」');
console.log('');
console.log('✅ 대신 이것을 쓰십시오:');
console.log('   node scripts/collect-stock-prices.mjs      (공공데이터포털 15094808 · 제한 없음)');
console.log('   읽기: src/lib/stock-prices-datago.mjs 의 시세(뿌리)');
console.log('');
console.log('   ⛔ 이 파일을 되살리지 마십시오. 되살리면 파는 파일에 비상업 전용 자료가 다시 섞입니다.');
process.exit(1);
