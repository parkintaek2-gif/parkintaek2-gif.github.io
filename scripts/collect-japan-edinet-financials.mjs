#!/usr/bin/env node
/**
 * collect-japan-edinet-financials.mjs — **일본 재무제표를 받는다. 일본이 상품이 되는 칸이다.**
 *
 *   node scripts/collect-japan-edinet-financials.mjs --재본다            며칠치에 몇 건 있나만 잰다
 *   node scripts/collect-japan-edinet-financials.mjs --날 2026-09-18 --적는다
 *   node scripts/collect-japan-edinet-financials.mjs --며칠 5 --적는다    어제부터 거슬러 닷새
 *   node scripts/collect-japan-edinet-financials.mjs --몇개 3 --적는다    앞의 몇 곳만(시험용)
 *   node scripts/collect-japan-edinet-financials.mjs --자가시험
 *
 * ── 🔴 왜 이것이 먼저인가 (2026-09-21) ────────────────────────────────────
 * 회사 규칙 — **재무제표가 없으면 그 나라는 아직 상품이 아니다**(CLAUDE.md 「주력과 서비스」).
 * 재무가 빈 네 나라(일본·인도·중국·사우디) 가운데
 * ```
 * 라이선스가 열린 곳    일본 하나      (금융청 EDINET · PDL1.0 — 서류 원문까지 상업이용 가능)
 * 명부가 이미 선 곳     일본 하나      (상장 3,818사 · japan-jpx-companies)
 * 남은 막힘의 개수      0              ← 오늘 «열쇠가 이미 있다»는 것을 확인했다
 * ```
 *
 * ⚠ 오늘 내가 사장님께 「EDINET 열쇠 발급이 막혔다」고 보고했다가 바로잡혔다 —
 *   **「EDINET 열쇠 발급>>>어제 했잖아」.** 열쇠는 `.env` 에 있었고 API 는 200 을 준다.
 *   나는 열쇠가 나오기 «전»에 쓴 문서를 안 재고 옮겼다.
 *   ⇒ 그 일이 또 없게 `scripts/check-locked-wells.mjs` 가 기계로 재게 해 두었다.
 *
 * ── 왜 XBRL 이 아니라 CSV 인가 ────────────────────────────────────────────
 * EDINET API v2 는 `type=5` 로 **XBRL 을 CSV 로 풀어서** 준다(실측 92KB ZIP).
 * XBRL 파서를 들일 까닭이 없다. CSV 는 UTF-16LE · 탭 구분이고 칸은 아홉이다 —
 * `要素ID · 項目名 · コンテキストID · 相対年度 · 連結・個別 · 期間・時点 · ユニットID · 単位 · 値`
 *
 * ── 이용허락범위 ──────────────────────────────────────────────────────────
 * 금융청 EDINET — 공공데이터 이용규약(PDL1.0). 상업적 이용 가능, 출처 표시.
 * `docs/일본-데이터-출처-라이선스.md` 106~111행이 **서류 원문(재무제표)에도 그대로 이어진다**고
 * 못박아 두었다. ⛔ JPX 자체 파일은 별개다 — 그쪽은 상업이용 금지라 안 쓴다.
 * ⛔ 열쇠 값을 화면·로그·커밋 어디에도 안 찍는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 둘곳 = path.join(뿌리, 'archive', 'raw', 'japan-edinet-financials');

const 인자 = (이름, 기본 = null) => {
  const i = process.argv.indexOf(이름);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : 기본;
};
const 적는다 = process.argv.includes('--적는다');
const 재본다 = process.argv.includes('--재본다');

/* ── 뽑을 다섯 칸 ─────────────────────────────────────────────────────────
   ⭐ 요소를 «우선순위»로 둔다. 재무제표 본표(jppfs_cor)가 먼저고,
     없으면 경영지표 요약(jpcrp_cor …SummaryOfBusinessResults)을 쓴다.
   ⚠ 요약 쪽은 「当期」가 아니라 「四期前」처럼 지난 해가 섞여 오므로 相対年度 를 반드시 본다. */
export const 뽑을것 = [
  { 칸: 'revenue_jpy', 요소: ['jppfs_cor:NetSales', 'jppfs_cor:Revenue', 'jpcrp_cor:NetSalesSummaryOfBusinessResults'] },
  { 칸: 'operating_profit_jpy', 요소: ['jppfs_cor:OperatingIncome'] },
  { 칸: 'net_profit_jpy', 요소: ['jppfs_cor:ProfitLoss', 'jppfs_cor:NetIncome'] },
  { 칸: 'assets_jpy', 요소: ['jppfs_cor:Assets', 'jpcrp_cor:TotalAssetsSummaryOfBusinessResults'] },
  { 칸: 'equity_jpy', 요소: ['jppfs_cor:NetAssets', 'jpcrp_cor:NetAssetsSummaryOfBusinessResults'] },
];

/** CSV 한 줄을 칸으로 가른다 — 탭 구분, 값은 큰따옴표로 싸여 있다 */
export function 줄가르기(줄) {
  return String(줄 || '').split('\t').map((s) => s.replace(/^"|"$/g, ''));
}

/**
 * 푼 CSV 글에서 다섯 칸을 뽑는다.
 *
 * 고르는 순서 — **① 当期  ② 連結 먼저, 없으면 個別  ③ 요소 우선순위**
 * ⛔ 「四期前」·「三期前」 같은 지난 해 값을 올해 값으로 쓰지 않는다. 그것이 제일 큰 사고다.
 */
export function 뽑기(글) {
  const 줄들 = String(글 || '').split(/\r?\n/).map(줄가르기).filter((c) => c.length >= 9);
  const 값 = {};
  const 근거 = {};
  for (const { 칸, 요소 } of 뽑을것) {
    let 걸린 = null;
    for (const e of 요소) {
      const 후보 = 줄들.filter((c) => c[0] === e && /^当期/.test(c[3] || '') && c[8] && c[8] !== '－');
      if (!후보.length) continue;
      /* 連結(연결)이 사실상 회사의 성적이다. 없으면 個別(별도) */
      걸린 = 후보.find((c) => c[4] === '連結') || 후보[0];
      break;
    }
    값[칸] = 걸린 ? Number(걸린[8]) : null;
    근거[칸] = 걸린 ? { 요소: 걸린[0], 연결개별: 걸린[4], 단위: 걸린[7] } : null;
  }
  return { 값, 근거 };
}

/** 받은 다섯 칸이 «쓸 만한가» — 하나도 없으면 안 적는다 */
export function 쓸만한가(값) {
  return Object.values(값 || {}).some((v) => typeof v === 'number' && Number.isFinite(v));
}

/** 오늘로부터 며칠 전 평일들 — 주말은 서류가 0건이다 */
export function 최근평일(며칠, 오늘 = new Date()) {
  const 것 = [];
  for (let i = 1; 것.length < 며칠 && i <= 며칠 * 3; i++) {
    const t = new Date(오늘); t.setDate(오늘.getDate() - i);
    if (t.getDay() === 0 || t.getDay() === 6) continue;
    것.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
  }
  return 것;
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);
  const 머리 = '"要素ID"\t"項目名"\t"コンテキストID"\t"相対年度"\t"連結・個別"\t"期間・時点"\t"ユニットID"\t"単位"\t"値"';
  const 줄 = (e, 년, 연결, 값) => `"${e}"\t"이름"\t"ctx"\t"${년}"\t"${연결}"\t"期間"\t"JPY"\t"円"\t"${값}"`;

  검('탭으로 가르고 따옴표를 벗긴다', 줄가르기('"a"\t"b"')[0] === 'a');
  검('빈 줄은 빈 칸을 낸다', 줄가르기('').length === 1);

  const 글1 = [머리, 줄('jppfs_cor:OperatingIncome', '当期', '連結', '2076108000')].join('\n');
  검('당기 영업이익을 뽑는다', 뽑기(글1).값.operating_profit_jpy === 2076108000);

  const 글2 = [머리,
    줄('jppfs_cor:OperatingIncome', '前期', '連結', '1848368000'),
    줄('jppfs_cor:OperatingIncome', '当期', '連結', '2076108000')].join('\n');
  검('⛔ 前期를 当期로 쓰지 않는다', 뽑기(글2).값.operating_profit_jpy === 2076108000);

  const 글3 = [머리,
    줄('jpcrp_cor:NetSalesSummaryOfBusinessResults', '四期前', 'その他', '11493480000'),
    줄('jpcrp_cor:NetSalesSummaryOfBusinessResults', '当期', 'その他', '15000000000')].join('\n');
  검('⛔ 四期前(4년 전)을 올해로 쓰지 않는다', 뽑기(글3).값.revenue_jpy === 15000000000);

  const 글4 = [머리,
    줄('jppfs_cor:NetSales', '当期', '個別', '100'),
    줄('jppfs_cor:NetSales', '当期', '連結', '200')].join('\n');
  검('⭐ 連結을 個別보다 먼저 쓴다', 뽑기(글4).값.revenue_jpy === 200);
  검('그 근거를 함께 남긴다', 뽑기(글4).근거.revenue_jpy.연결개별 === '連結');

  const 글5 = [머리, 줄('jppfs_cor:NetSales', '当期', '個別', '100')].join('\n');
  검('連結이 없으면 個別을 쓴다', 뽑기(글5).값.revenue_jpy === 100);

  검('본표를 요약보다 먼저 쓴다',
    뽑기([머리,
      줄('jpcrp_cor:TotalAssetsSummaryOfBusinessResults', '当期', 'その他', '111'),
      줄('jppfs_cor:Assets', '当期', '連結', '999')].join('\n')).값.assets_jpy === 999);

  검('⛔ 없는 칸은 0 이 아니라 null 이다', 뽑기(머리).값.revenue_jpy === null);
  검('「－」는 값이 아니다',
    뽑기([머리, 줄('jppfs_cor:NetSales', '当期', '連結', '－')].join('\n')).값.revenue_jpy === null);
  검('하나라도 있으면 쓸 만하다', 쓸만한가({ a: 1, b: null }) === true);
  검('전부 비면 안 적는다', 쓸만한가({ a: null, b: null }) === false);
  검('빈 것도 안 적는다', 쓸만한가(null) === false);

  const 평일 = 최근평일(5, new Date(2026, 8, 21));   /* 9/21 은 월요일 */
  검('주말을 건너뛴다', 평일.every((d) => {
    const t = new Date(d + 'T00:00:00'); return t.getDay() !== 0 && t.getDay() !== 6;
  }));
  검('며칠만큼 낸다', 평일.length === 5);
  검('어제부터 거슬러 간다', 평일[0] === '2026-09-18');   /* 9/20 일 · 9/19 토 건너뜀 */
  검('다섯 칸을 다 뽑는다', 뽑을것.length === 5);
  검('칸 이름이 한국 탭과 같은 꼴이다',
    뽑을것.every((x) => /^(revenue|operating_profit|net_profit|assets|equity)_jpy$/.test(x.칸)));

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 받는다 ────────────────────────────────────────── */
if (내가진입점) {
  const KEY = (() => {
    if (process.env.EDINET_KEY) return process.env.EDINET_KEY;
    try { return fs.readFileSync(path.join(뿌리, '.env'), 'utf8').match(/^EDINET_KEY=(.+)$/m)?.[1]?.trim() || ''; }
    catch { return ''; }
  })();
  if (!KEY) { console.error('🔴 .env 에 EDINET_KEY 가 없다'); process.exit(2); }

  const 날들 = 인자('--날') ? [인자('--날')] : 최근평일(Number(인자('--며칠', '1')));
  const 몇개 = Number(인자('--몇개', '0'));
  console.log('■ 일본 EDINET 재무제표 —', 날들.join(' · '), 적는다 ? '· 적는다' : '· 안 적는다(재보기)');

  const 목록받기 = async (날) => {
    const r = await fetch(`https://api.edinet-fsa.go.jp/api/v2/documents.json?date=${날}&type=2&Subscription-Key=${KEY}`);
    if (!r.ok) return [];
    const j = await r.json().catch(() => null);
    return (j?.results || []).filter((x) => String(x.docTypeCode) === '120'
      && x.xbrlFlag === '1' && x.secCode);   /* 유가증권보고서 · XBRL 있음 · 상장종목 */
  };

  let 받음 = 0, 건너 = 0, 실패 = 0;
  for (const 날 of 날들) {
    const 목 = await 목록받기(날);
    console.log(`\n── ${날} : 유가증권보고서(상장) ${목.length}건`);
    if (재본다) continue;
    const 볼것 = 몇개 ? 목.slice(0, 몇개) : 목;
    const 날폴더 = path.join(둘곳, 날);
    if (적는다) fs.mkdirSync(날폴더, { recursive: true });

    for (const d of 볼것) {
      const 낼길 = path.join(날폴더, `${d.docID}.json`);
      if (적는다 && fs.existsSync(낼길)) { 건너++; continue; }
      try {
        const rr = await fetch(`https://api.edinet-fsa.go.jp/api/v2/documents/${d.docID}?type=5&Subscription-Key=${KEY}`);
        if (!rr.ok) { 실패++; console.log(`   🔴 ${d.docID} HTTP ${rr.status}`); continue; }
        const buf = Buffer.from(await rr.arrayBuffer());
        const 임시 = path.join(둘곳, `_tmp-${d.docID}`);
        fs.mkdirSync(임시, { recursive: true });
        fs.writeFileSync(`${임시}.zip`, buf);
        execFileSync('powershell', ['-NoProfile', '-Command',
          `Expand-Archive -Path "${임시}.zip" -DestinationPath "${임시}" -Force`]);
        const 훑 = (dir) => fs.readdirSync(dir, { withFileTypes: true })
          .flatMap((e) => (e.isDirectory() ? 훑(path.join(dir, e.name)) : [path.join(dir, e.name)]));
        /* 가장 «큰» CSV 가 본문이다 — 감사보고서 CSV 가 같이 들어 있다 */
        const csv = 훑(임시).filter((f) => /\.csv$/i.test(f))
          .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
        if (!csv) { 실패++; fs.rmSync(임시, { recursive: true, force: true }); fs.rmSync(`${임시}.zip`, { force: true }); continue; }
        const { 값, 근거 } = 뽑기(fs.readFileSync(csv, 'utf16le'));
        fs.rmSync(임시, { recursive: true, force: true });
        fs.rmSync(`${임시}.zip`, { force: true });

        if (!쓸만한가(값)) { 실패++; console.log(`   ⬜ ${d.docID} ${d.filerName} — 다섯 칸이 다 비었다`); continue; }
        const 한벌 = {
          _meta: {
            출처: '금융청 EDINET (api.edinet-fsa.go.jp/api/v2)',
            이용허락범위: '공공데이터 이용규약(PDL1.0) — 상업적 이용 가능, 출처 표시',
            받은날: 날, 받은때: new Date().toLocaleString('ko-KR'),
          },
          docID: d.docID,
          sec_code: String(d.secCode).replace(/0$/, ''),   /* EDINET 은 5자리(끝 0) — 4자리 종목코드로 */
          edinet_code: d.edinetCode,
          name: d.filerName,
          doc_description: d.docDescription,
          period_end: d.periodEnd ?? null,
          ...값,
          _근거: 근거,
        };
        if (적는다) fs.writeFileSync(낼길, JSON.stringify(한벌, null, 1), 'utf8');
        받음++;
        if (받음 <= 5 || 받음 % 20 === 0) {
          console.log(`   ✅ ${한벌.sec_code} ${한벌.name} — 매출 ${한벌.revenue_jpy ?? '—'} · 순이익 ${한벌.net_profit_jpy ?? '—'}`);
        }
      } catch (e) { 실패++; console.log(`   🔴 ${d.docID} ${String(e?.message ?? e).slice(0, 70)}`); }
    }
  }
  console.log(`\n■ 받음 ${받음} · 이미 있음 ${건너} · 못 뽑음 ${실패}`);
  if (적는다) console.log('■ 둔 곳 archive/raw/japan-edinet-financials/<날짜>/<docID>.json');
  else if (!재본다) console.log('⭐ --적는다 를 안 줬다. 저장하지 않았다.');
}
