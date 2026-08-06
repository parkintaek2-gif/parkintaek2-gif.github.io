/**
 * K Culture Wire — 한국 방송프로그램 수출액, 회사 유형별 13년. (/tv-exports)
 *
 * 결과 → src/data/wikitip-broadcast-export.json
 * 입력 → archive/raw/kosis/broadcast-export-2012-2024.json (KOSIS DT_113_STBL_1025706)
 *        archive/raw/kosis/meta-DT_113_STBL_1025706.json  (같은 표의 분류 이름)
 *
 * ── 🔴 2026-08-07 정정: 회사 유형이 아니라 **수출 형태 하나**를 싣고 있었다 ──────
 * 이 표의 통계분류는 **두 층**이다. 위층이 수출 형태, 아래층이 회사 유형이다.
 *
 *   002 방송프로그램(완성품)  → 001 지상파 · 002 방송채널사용사업자 · 003 IPTV CP · 004~008 개별 방송사
 *   003 해외교포방송지원 · 004 비디오/DVD판매 · 005 타임블럭 · 006 포맷 · 007 기타
 *   008 소계                → 형태를 다 더한 값 (2022년부터만 실린다)
 *   009 방송영상독립제작사    → 아래층이 없다
 *
 * 그런데 KOSIS 가 내려주는 줄에는 **아래층 이름만** 붙어 있다. 「지상파 방송」이라는 이름의 줄이
 * 한 해에 다섯~여섯 개고 코드로만 갈린다. 앞의 자료 파일은 그중 `002001`,
 * 즉 **지상파 방송의 완성품 수출만** 집어 「지상파 방송」이라 적고 있었다.
 * 독립제작사(009)만은 형태 구분이 없어 전액이 들어갔다. **서로 다른 것을 나란히 놓고 있었다.**
 *
 * ⛔ 그래서 「부문 합이 총계와 안 맞는다」는 지면의 설명도 사실이 아니었다.
 *    안 맞은 이유는 조사가 다 안 밝혀서가 아니라 **우리가 형태 하나만 세었기 때문**이다.
 *
 * ── 고친 방법 ────────────────────────────────────────────────────
 * 회사 유형마다 형태(002~007)를 **다 더한다.** 2022~2024 는 KOSIS 가 소계(008)를 같이 싣는데
 * 우리 합계와 **세 해 모두 정확히 일치**했다. 그것을 확인으로 삼아 2012~2021 에도 같은 방법을 쓴다.
 * 더한 값과 표의 합계(001)는 13년 중 5년이 정확히 같고 나머지는 ±2천달러다 — 반올림이다.
 *
 * ⚠ 개별 방송사(KBS·MBC·EBS·SBS·기타)는 **지상파 방송의 내역**이라 더하지 않는다. 두 번 세게 된다.
 */
import fs from 'node:fs';

const RAW = 'archive/raw/kosis/broadcast-export-2012-2024.json';
const raw = JSON.parse(fs.readFileSync(RAW, 'utf8')).filter((r) => r.ITM_NM === '수출액');

/** 위층 = 수출 형태. 008(소계)·001(합계)·009(독립제작사)는 따로 다룬다. */
const FORMS = ['002', '003', '004', '005', '006', '007'];
/** 아래층 = 회사 유형. 004~008(개별 방송사)은 지상파의 내역이므로 뺀다. */
const TYPES = [
  ['001', 'Terrestrial broadcasters'],
  ['002', 'Cable and satellite channels'],
  ['003', 'IPTV content providers'],
];
const INDEPENDENT = 'Independent production companies';

const suffix = (r) => String(r.C1).split('.')[1] || '';
const val = (year, code) => {
  const hit = raw.find((r) => r.PRD_DE === String(year) && suffix(r) === code);
  return hit ? +hit.DT : null;
};

const years = [...new Set(raw.map((r) => +r.PRD_DE))].sort((a, b) => a - b);
const rows = [];
const 검산 = [];

for (const year of years) {
  const total = val(year, '001');
  if (total === null) continue;
  const parts = {};
  for (const [code, label] of TYPES) {
    /* 형태를 다 더한다. 없는 형태는 그 해에 그 회사 유형이 안 판 것이다 — 0 으로 둔다. */
    parts[label] = FORMS.reduce((s, f) => s + (val(year, f + code) ?? 0), 0);
    /* KOSIS 가 소계를 같이 실은 해에는 우리 합과 맞는지 본다. 안 맞으면 세우지 않는다. */
    const 소계 = val(year, '008' + code);
    if (소계 !== null) {
      /* 반올림한 값을 더하므로 1천달러까지는 벌어진다. 2 를 넘으면 분류를 잘못 짚은 것이다. */
      const 차 = Math.abs(소계 - parts[label]);
      if (차 > 2) throw new Error(`${year} ${label}: 우리 합 ${parts[label]} ≠ KOSIS 소계 ${소계}`);
      검산.push({ year, label, 차 });
    }
  }
  parts[INDEPENDENT] = val(year, '009') ?? 0;

  const named = Object.values(parts).reduce((s, v) => s + v, 0);
  rows.push({ year, total, parts, named, residual: total - named });
}

/* ── 검산 ── 더한 값이 표의 합계와 크게 벌어지면 분류를 잘못 짚은 것이다. */
const 최대차 = Math.max(...rows.map((r) => Math.abs(r.residual)));
if (최대차 > 5) throw new Error(`합계와 ${최대차}천달러 벌어졌다 — 분류를 다시 본다`);

const out = {
  generated: new Date().toISOString(),
  source: 'Korea Creative Content Agency, 콘텐츠산업조사 (Content Industry Survey), via KOSIS table DT_113_STBL_1025706. Each company type is the sum of every export form the survey publishes for it — finished programmes, format sales, video and DVD, time blocks, overseas Korean-broadcast support and other.',
  sourceKo: '국가데이터처 KOSIS, 한국콘텐츠진흥원 「콘텐츠산업조사」',
  unit: 'thousand USD',
  categories: [...TYPES.map(([, l]) => l), INDEPENDENT],
  yearFrom: rows[0].year,
  yearTo: rows[rows.length - 1].year,
  /** 지면이 「왜 이제 딱 맞나」를 적을 수 있게 검산 결과를 같이 낸다. */
  reconciled: { checkedAgainstPublishedSubtotal: 검산.length, maxSubtotalGap: Math.max(0,...검산.map(x=>x.차)), maxResidual: 최대차 },
  rows,
};
fs.writeFileSync('src/data/wikitip-broadcast-export.json', JSON.stringify(out, null, 2));

console.log(`${rows.length}년 · KOSIS 소계와 맞춘 칸 ${검산.length}개 · 합계와 최대 차 ${최대차}천달러`);
for (const y of [2012, 2018, 2024]) {
  const r = rows.find((x) => x.year === y);
  if (r) console.log(` ${y} 합계 ${r.total.toLocaleString()} · 부문합 ${r.named.toLocaleString()} · 잔차 ${r.residual}`);
}
