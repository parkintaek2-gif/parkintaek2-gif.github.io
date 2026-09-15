#!/usr/bin/env node
/**
 * build-screener-data.mjs — 스크리너가 브라우저에서 쓸 «추린 자료»를 만든다.
 *
 * 사장님(2026-09-15): 「스크리너를 정교하게 만들어. 원하는 자료를 쉽게 고객들이 찾을 수 있게」
 *
 * ── 왜 추리나 ────────────────────────────────────────────────────────────
 *   src/data/korea-valuation-tape.json 은 1.6MB 다. 그대로 브라우저에 보내면
 *   폰에서 첫 화면이 늦는다 — 「그릇이 내용물을 결정한다」에 걸린다.
 *   ⇒ 거르는 데 «쓰는 칸»만 남기고 이름도 한 글자로 줄인다.
 *
 * ⛔ 값을 반올림하거나 0 으로 채우지 않는다. 없는 칸은 «없는 채로» 보낸다 —
 *   스크리너가 「값이 없어 빠진 곳」을 세려면 null 이 null 인 채로 와야 한다(강령 ③).
 *
 *   node scripts/build-screener-data.mjs
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 들어오는곳 = 'src/data/korea-valuation-tape.json';

/* 🔴 줄 뭉치는 «public» 으로 낸다 — 지면 HTML 안에 통째로 박지 않는다.
 *   박으면 536KB 가 첫 화면을 그만큼 늦추고, 다시 와도 다시 받는다.
 *   따로 두면 브라우저가 «캐시»한다. 「그릇이 내용물을 결정한다」에 걸리는 자리다.
 * ⭐ 대신 지면이 «짓는 때» 알아야 하는 것(업종 목록·칸별 채움수)만 작은 딴 파일로 낸다. */
const 나가는곳 = 'public/data/screener-korea.json';
const 머리나가는곳 = 'src/data/screener-korea-meta.json';

/** 값이 있으면 숫자로, 없으면 null 로. ⛔ 0 으로 채우지 않는다 */
function 수(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * 🔴 [2026-09-15 실측] roe·debtToEquity 는 원본에서 «비율»이다 — 삼성전자 roe 0.1036.
 *   지면 머리에 「ROE %」라고 쓰고 0.1 을 내면 손님이 「ROE 0.1%」로 읽는다. 여기서 100을 곱한다.
 *   ⛔ 값이 없는 칸은 그대로 null 이다 — 0 을 곱해 0 으로 만들지 않는다(강령 3).
 */
function 백분율(v) {
  const n = 수(v);
  return n === null ? null : n * 100;
}

/**
 * 🔴 「못 쟀다」는 말도 손님이 읽는 말이다 — 손님이 영어권이라 «영문»으로 낸다.
 * ⛔ 원본의 한국어를 그대로 흘리지 않는다. 모르는 말이 오면 null 로 두고 화면에 안 낸다
 *   (짐작해서 옮기면 우리가 지어낸 말이 손님 화면에 선다).
 */
const 못잰까닭영문 = {
  '재무제표가 왔는데 자본총계·순이익이 비어 있다':
    'Financial statement filed, but equity and net income are blank in it',
  '시가총액이 없다 (시세에 그 종목이 없다)':
    'No market capitalisation — this ticker is not in the daily price file',
};

export function 추린다(줄들) {
  return (줄들 || []).map((r) => ({
    t: r.ticker,
    n: r.nameEn || r.name,
    k: r.name,
    m: r.market,
    i: r.industryEn || r.industry,
    c: 수(r.marketCap),
    p: 수(r.per),
    b: 수(r.pbr),
    r: 백분율(r.roe),          /* 비율 → % */
    d: 백분율(r.debtToEquity),  /* 비율 → % */
    v: 수(r.revenue),
    /* 왜 비었는지 — 짧은 글 하나. 손님이 「왜 안 나오지」를 그 자리에서 안다 */
    x: (r.notMeasured && 못잰까닭영문[r.notMeasured]) || null,
  }));
}

async function 본일() {
  const 원본 = JSON.parse(readFileSync(path.resolve(들어오는곳), 'utf8'));
  const 줄들 = Array.isArray(원본) ? 원본 : Object.values(원본).find((x) => Array.isArray(x));
  if (!줄들) throw new Error('줄을 못 찾았다 — ' + 들어오는곳);

  const 추린것 = 추린다(줄들);

  /* 🔴 관문 — 손님 화면에 나가는 칸(n·i·x)에 한국어가 «한 글자라도» 있으면 멈춘다.
   *   사장님 지시: 「화면에 한국어를 안 낸다」(2026-08-05, 손님이 영어권이다).
   *   ⚠ k(한국어 이름)는 «찾기»에만 쓰고 그리지 않으므로 여기서 안 본다 —
   *     한국 손님이 「삼성전자」로 칠 수 있게 남겨 둔 칸이다.
   *   ⛔ 이것을 「조심하겠다」로 두지 않는다. 검사로 굳힌다(강령 4). */
  const 한글샌줄 = 추린것.filter((r) => /[가-힣]/.test((r.n || '') + (r.i || '') + (r.x || '')));
  if (한글샌줄.length) {
    console.error(`🔴 손님 화면 칸에 한국어가 ${한글샌줄.length}줄 있다 — 안 낸다`);
    for (const r of 한글샌줄.slice(0, 5)) console.error(`   ${r.t} · n=${r.n} · i=${r.i} · x=${r.x}`);
    process.exit(1);
  }

  /* ⛔ 「몰라서 null 로 뒀다」를 조용히 넘기지 않는다 — 몇 줄이 그랬는지 센다 */
  const 못옮긴 = 줄들.filter((r, i) => r.notMeasured && !추린것[i].x).length;
  if (못옮긴) console.log(`   🔴 못 쟌 까닭 ${못옮긴}줄을 영문으로 못 옮겼다 — 못잰까닭영문 에 넣어라`);
  const 업종 = [...new Set(추린것.map((r) => r.i).filter(Boolean))].sort();

  /* 칸마다 «값이 있는 곳»이 몇인지 함께 보낸다 — 지면이 그것을 먼저 보인다 */
  const 채움 = {};
  for (const k of ['c', 'p', 'b', 'r', 'd', 'v']) {
    채움[k] = 추린것.filter((x) => x[k] !== null).length;
  }

  const 냄 = {
    _meta: {
      product: 'SMarkets screener — Korean listed companies, the fields a screen actually uses',
      builtAt: new Date().toISOString(),
      source: 'src/data/korea-valuation-tape.json (KRX price · DART filings)',
      rows: 추린것.length,
      filled: 채움,
      notThis: [
        'Empty fields are sent as null, never as zero — the screener counts how many companies a filter silently drops.',
        'No ranking, no score, no recommendation. These are filed figures and a price.',
        'Not investment advice.',
      ],
    },
    industries: 업종,
    rows: 추린것,
  };

  writeFileSync(path.resolve(나가는곳), JSON.stringify(냄), 'utf8');

  /* 지면이 짓는 때 읽는 작은 머리 — 줄은 안 들었다 */
  writeFileSync(
    path.resolve(머리나가는곳),
    JSON.stringify({ _meta: 냄._meta, industries: 업종, dataUrl: '/data/screener-korea.json' }, null, 2) + '\n',
    'utf8',
  );

  const 전 = Math.round(statSync(path.resolve(들어오는곳)).size / 1024);
  const 후 = Math.round(statSync(path.resolve(나가는곳)).size / 1024);
  console.log(`✅ ${나가는곳} — ${추린것.length}줄 · 업종 ${업종.length}개`);
  console.log(`   ${전}KB → ${후}KB (${Math.round((1 - 후 / 전) * 100)}% 줄였다)`);
  console.log(`   ${머리나가는곳} — 지면이 짓는 때 읽는 머리(업종 ${업종.length}개 · 칸별 채움수)`);
  console.log('   칸마다 값이 있는 곳 —');
  for (const [k, n] of Object.entries(채움)) {
    console.log(`     ${k}  ${n}/${추린것.length} (${Math.round((n / 추린것.length) * 100)}%)`);
  }
  console.log('   ⭐ 100% 가 아닌 칸으로 거르면 나머지가 «말없이» 빠진다 — 지면이 그 수를 보인다');
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) await 본일();
