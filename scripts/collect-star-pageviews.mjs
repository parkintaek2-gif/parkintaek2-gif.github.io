#!/usr/bin/env node
/**
 * **핫 스타 관심도** — 영문 위키백과 조회수. WikiTip(K컬처) 축.
 *
 *   npm run collect:stars                최근 30일
 *   npm run collect:stars -- --days 90
 *   npm run collect:stars -- --top 300   상위 N명만 (기본 전체)
 *
 * ── 사장님 지시(2026-08-04) ────────────────────────────────────
 *   「**핫한 스타 순위** 이런건 없을까? 예컨대 **검색수, 언급수 등을 직접 계산**하는 방식은?」
 *   「가수: 음원순위+방송 순위프로그램 10위+빌보드 / **배우: 모르겠음** / 개그맨: 모르겠음」
 *
 * ── 왜 남의 순위를 안 받고 직접 재나 ──────────────────────────
 * · 남의 순위는 **재배포가 걸린다.** 우리가 만든 값은 우리 것이다
 * · **영문 위키 조회수 = 영어권 관심도**다. WikiTip 독자(동남아 영어권)와 정확히 맞는다
 * · 2015년부터 **소급**된다. 남의 순위는 소급이 안 된다
 * · 키도 로그인도 필요 없다
 *
 * ── 명단을 사람이 고르지 않는다 ────────────────────────────────
 * 「배우: 모르겠음」의 답 —
 *   넷플릭스 Top10 에 든 **한국 제작 작품 1,005개** → Wikidata 출연진(P161)
 *   → **배우 1,553명**. `archive/raw/netflix-top10/korean-cast.json`
 * 기준이 「넷플릭스에서 실제로 Top10 에 든 작품에 나온 사람」이라 편향이 안 들어간다.
 *
 * ⚠ 조회수는 **인기가 아니라 관심**이다. 좋은 일로도 나쁜 일로도 오른다.
 *   발행할 때 「인기 순위」라고 쓰지 않는다. **「관심도」**라고 쓴다.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const API = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user';
const OUT = path.resolve('archive/raw/star-pageviews');
const UA = 'SeoulMarketsBot/0.1 (https://seoulmarkets.com/about)';
const 간격ms = 120;

/** ⚠ 이 PC 는 이미 KST 다. toISOString 을 쓰면 새벽에 하루가 어긋난다 */
export function 날짜(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 위키 문서 제목을 URL 조각으로.
 * ⚠ 공백은 밑줄이고, 그 다음에 인코딩한다. 순서를 바꾸면 404 다.
 */
export function 문서키(이름) {
  return encodeURIComponent(String(이름).trim().replace(/\s+/g, '_'));
}

/**
 * 한 사람의 기간 조회수.
 * ⚠ 404 는 **「문서가 없다」이지 「0회」가 아니다.** 0 으로 세면 순위가 통째로 틀린다.
 *   문서명이 다른 경우(동명이인 구분자, 로마자 표기 차이)가 흔하다.
 */
export async function 한명(이름, 시작, 끝) {
  const u = `${API}/${문서키(이름)}/daily/${시작}/${끝}`;
  const r = await fetch(u, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const 일별 = (j.items ?? []).map((x) => ({ 일자: x.timestamp.slice(0, 8), 조회: x.views }));
  if (!일별.length) return null;
  const 합 = 일별.reduce((s, x) => s + x.조회, 0);
  const 최고 = 일별.reduce((m, x) => (x.조회 > m.조회 ? x : m), 일별[0]);
  /* 뒤 7일 대 앞 7일 — 「뜨고 있나」를 보는 가장 단순한 지표 */
  const 앞 = 일별.slice(0, 7).reduce((s, x) => s + x.조회, 0);
  const 뒤 = 일별.slice(-7).reduce((s, x) => s + x.조회, 0);
  return {
    이름, 합, 일수: 일별.length, 하루평균: Math.round(합 / 일별.length),
    최고일: 최고.일자, 최고조회: 최고.조회,
    /* ⚠ 앞 7일이 0 이면 배수가 무한대가 된다. null 로 둔다 — 0 으로 나누지 않는다 */
    상승배수: 앞 > 0 ? +(뒤 / 앞).toFixed(2) : null,
    최근7일: 뒤,
  };
}

async function main() {
  const arg = (n, 기본) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : 기본; };
  const 일수 = Number(arg('--days', '30'));
  const 상위 = Number(arg('--top', '0'));

  const 명단파일 = path.resolve('archive/raw/netflix-top10/korean-cast.json');
  if (!existsSync(명단파일)) {
    console.error(`✕ ${명단파일} 이 없다. 배우 명단을 먼저 만든다.`);
    process.exit(1);
  }
  const 명단원본 = JSON.parse(readFileSync(명단파일, 'utf8')).배우;
  let 이름들 = Object.keys(명단원본);
  if (상위) 이름들 = 이름들.slice(0, 상위);

  const 끝 = new Date(); 끝.setDate(끝.getDate() - 1);   /* 어제까지 — 오늘치는 아직 안 찬다 */
  const 시작 = new Date(끝); 시작.setDate(시작.getDate() - 일수 + 1);
  const S = 날짜(시작), E = 날짜(끝);
  console.log(`위키 조회수 — ${이름들.length.toLocaleString()}명 · ${S}~${E} (${일수}일)`);

  mkdirSync(OUT, { recursive: true });
  const 결과 = [];
  let 없음 = 0, 실패 = 0;
  for (const [i, 이름] of 이름들.entries()) {
    try {
      const r = await 한명(이름, S, E);
      if (r) 결과.push({ ...r, 작품수: 명단원본[이름] });
      else 없음++;
    } catch { 실패++; }
    if ((i + 1) % 200 === 0) console.log(`  … ${i + 1}/${이름들.length} · 잡힘 ${결과.length} · 문서없음 ${없음} · 실패 ${실패}`);
    await new Promise((x) => setTimeout(x, 간격ms));
  }

  결과.sort((a, b) => b.합 - a.합);
  const 산출 = path.join(OUT, `actors-${E}.json`);
  writeFileSync(산출, JSON.stringify({
    출처: 'Wikimedia Pageviews API (en.wikipedia, all-access, user)',
    기간: `${S}~${E}`, 일수,
    명단출처: 'Wikidata P161 × 넷플릭스 Top10 한국 작품',
    대상: 이름들.length, 잡힘: 결과.length, 문서없음: 없음, 실패,
    사람: 결과,
  }, null, 1));

  console.log(`\n✅ ${결과.length.toLocaleString()}명 (문서없음 ${없음} · 실패 ${실패})`);
  console.log(`   ${산출}`);
  console.log('\n■ 관심도 상위 12');
  결과.slice(0, 12).forEach((r, i) =>
    console.log(`  ${String(i + 1).padStart(2)}. ${r.이름.padEnd(20)} ${r.합.toLocaleString().padStart(9)}회 · 하루 ${r.하루평균.toLocaleString().padStart(6)} · 최고 ${r.최고일}`));

  /* ⭐ 「핫」은 총량이 아니라 **상승**이다. 둘을 나눠서 보여준다 */
  const 뜨는 = 결과.filter((r) => r.상승배수 != null && r.최근7일 >= 300).sort((a, b) => b.상승배수 - a.상승배수);
  console.log('\n■ ⭐ 지금 뜨는 사람 — 최근 7일 / 첫 7일 (주 300회 이상만)');
  뜨는.slice(0, 10).forEach((r, i) =>
    console.log(`  ${String(i + 1).padStart(2)}. ${r.이름.padEnd(20)} ×${String(r.상승배수).padStart(6)} · 최근7일 ${r.최근7일.toLocaleString()}회`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
