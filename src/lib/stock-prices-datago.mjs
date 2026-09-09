/**
 * stock-prices-datago.mjs — **팔 수 있는 주가·시총**을 공공데이터포털 판에서 읽는다.
 *
 * ── 🔴 왜 이 자가 필요한가 (2026-09-09 20:4x · 5번) ────────────────────────
 *
 * 사장님: 「재배포 조건이 없으면 배포해도 되겠지. 더구나 증권거래소는 준공공기관이니까」
 * ⇒ 재서 답했다. **조건이 있었다.** KRX OPEN API 이용약관 원문:
 * ```
 *   제6조 ②  「API 서비스를 «비상업적인 목적으로만» 이용할 수 있다」
 *   제6조    「이용한 결과에 대한 «대가를 제3자에게 청구해서는 아니된다»」
 *   제11조   「제공받은 정보를 «제3자에게 제공할 수 없다»」
 * ```
 * ⚠ 「재배포」라는 낱말이 안 나온다. 그래서 낱말로 찾으면 「조건 없음」으로 보인다.
 *   실제로는 더 센 말로 적혀 있다 — 비상업 전용 · 제3자 제공 금지 · 대가 청구 금지.
 *
 * ⛔ 그런데 우리는 `archive/raw/krx` (그 API) 값을 **팔 파일에 넣고 있었다** —
 *   People Panel($149 예정)의 close_price_krw · market_cap_krw 가 그것이다.
 *   아직 판 것은 없지만 «팔 수 없는 재료»로 상품을 만들고 있었다.
 *
 * ✅ 멈출 일이 아니다. 같은 칸이 **이용허락범위 「제한 없음」** 출처에 있다 —
 *   공공데이터포털 주식시세정보(15094808 · 금융위원회). 자도 이미 있었다
 *   (`scripts/collect-stock-prices.mjs`). 오늘 돌려서 재 봤다:
 * ```
 *   KOSPI 943 · KOSDAQ 1822 · KONEX 108 = 2,873건 · 실패 0
 *   → archive/raw/stocks/20260907.ndjson  (한 줄에 한 종목)
 * ```
 *   ⭐ KRX `stk_bydd_trd` 는 유가증권만 943건인데 이쪽은 **2,873건이다. 더 넓다.**
 *
 * ── 이 자가 하는 일 하나 ───────────────────────────────────────────────────
 * 공공데이터포털 줄을 **KRX 칸 이름 그대로** 돌려준다. 그래서 부르는 쪽은
 * 「어디서 읽나」 한 줄만 바꾸면 된다. 칸 이름을 따라 고치는 일이 없다.
 *
 * ⛔ 지키는 것
 *   · 빈칸을 0 으로 읽지 않는다 (`Number(null) === 0` 이 이 저장소의 대표 함정이다)
 *   · 종목코드를 6자리로 맞춘다 — 「900270」처럼 0 이 앞에 붙는 것이 있다
 *   · 이름으로 키를 만들지 않는다. 이름은 겹친다 — 코드가 유일 키다
 *   · SECT_TP_NM(소속부)은 이쪽에 «없다». 지어내지 않고 없는 채로 둔다
 *     (재 보니 company-master·people-panel 어느 쪽도 그 칸을 안 쓴다)
 */
import fs from 'node:fs';
import path from 'node:path';

/** 이 저장소에서 팔 수 있는 시세가 쌓이는 자리 */
export const 시세방 = 'archive/raw/stocks';

/** 파일 이름에서 날짜(YYYYMMDD)를 뽑는다. 아니면 null */
export function 날뽑기(이름) {
  const m = String(이름 ?? '').match(/^(\d{8})\.ndjson$/);
  return m ? m[1] : null;
}

/** 가장 새 거래일. ⛔ 없으면 null — 0 이나 오늘 날짜로 만들지 않는다 */
export function 최근날(파일들) {
  const 날들 = (파일들 ?? []).map(날뽑기).filter(Boolean).sort();
  return 날들.at(-1) ?? null;
}

/** ⛔ 빈칸을 0 으로 읽지 않는다 */
export function 수(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** 종목코드를 6자리로. ⚠ 「900270」처럼 0 이 앞에 붙는 것이 있다 */
export function 코드다듬기(v) {
  const s = String(v ?? '').trim();
  return s ? s.padStart(6, '0') : null;
}

/**
 * 공공데이터포털 줄 하나를 **KRX 칸 이름으로** 옮긴다.
 * ⚠ 부르는 쪽이 칸 이름을 안 고치게 하려고 일부러 KRX 이름을 쓴다.
 *   ⛔ 다만 «출처는 공공데이터포털»이다. 화면 출처 표기를 KRX 로 적지 않는다.
 */
export function 한줄옮기기(줄) {
  if (!줄 || typeof 줄 !== 'object') return null;
  const 코드 = 코드다듬기(줄['코드']);
  if (!코드) return null;
  return {
    BAS_DD: String(줄['일자'] ?? ''),
    ISU_CD: 코드,
    ISU_NM: String(줄['이름'] ?? ''),
    MKT_NM: String(줄['시장'] ?? ''),
    TDD_CLSPRC: 수(줄['종가']),
    CMPPREVDD_PRC: 수(줄['전일비']),
    FLUC_RT: 수(줄['등락률']),
    TDD_OPNPRC: 수(줄['시가']),
    TDD_HGPRC: 수(줄['고가']),
    TDD_LWPRC: 수(줄['저가']),
    ACC_TRDVOL: 수(줄['거래량']),
    ACC_TRDVAL: 수(줄['거래대금']),
    LIST_SHRS: 수(줄['상장주식수']),
    MKTCAP: 수(줄['시가총액']),
    /* ⭐ 이 두 칸은 KRX 판에 없다 — 우리가 더 갖는 것이다. 이름을 우리말로 둔다 */
    거래없음: 줄['거래없음'] === true,
    isin: String(줄['isin'] ?? '') || null,
    /* 🔴 출처를 줄에 박는다. 나중에 「이 값이 어디서 왔나」를 다시 묻지 않게 */
    출처: '공공데이터포털 주식시세정보(15094808 · 금융위원회 · 이용허락범위 제한 없음)',
  };
}

/** ndjson 한 덩이를 줄 목록으로. ⛔ 깨진 줄 하나가 나머지를 버리게 하지 않는다 */
export function 읽기(글) {
  const 것 = [];
  for (const 줄 of String(글 ?? '').split(/\r?\n/)) {
    const t = 줄.trim();
    if (!t) continue;
    let o = null;
    try { o = JSON.parse(t); } catch { continue; }   // 깨진 줄은 건너뛴다
    const r = 한줄옮기기(o);
    if (r) 것.push(r);
  }
  return 것;
}

/**
 * 그 날짜의 시세를 KRX 칸 이름으로 읽는다. 날짜를 안 주면 가장 새 거래일.
 * ⛔ 없으면 `{ 날: null, 줄들: [] }` — 「못 쟀다」다. 빈 배열을 0 으로 읽지 말 것.
 */
export function 시세(뿌리, 날 = null, 파일읽기 = fs.readFileSync, 폴더읽기 = fs.readdirSync) {
  const 방 = path.join(뿌리, 시세방);
  let 파일들 = [];
  try { 파일들 = 폴더읽기(방); } catch { return { 날: null, 줄들: [], 까닭: `${시세방} 폴더가 없다` }; }
  const 볼날 = 날 ?? 최근날(파일들);
  if (!볼날) return { 날: null, 줄들: [], 까닭: `${시세방} 에 ndjson 이 없다` };
  let 글 = null;
  try { 글 = 파일읽기(path.join(방, `${볼날}.ndjson`), 'utf8'); }
  catch { return { 날: 볼날, 줄들: [], 까닭: `${볼날}.ndjson 을 못 읽었다` }; }
  return { 날: 볼날, 줄들: 읽기(글), 까닭: null };
}

/** 코드로 찾는 지도. ⛔ 이름으로 만들지 않는다 — 이름은 겹친다 */
export function 코드지도(줄들) {
  const m = new Map();
  for (const r of (줄들 ?? [])) if (r?.ISU_CD) m.set(r.ISU_CD, r);
  return m;
}
