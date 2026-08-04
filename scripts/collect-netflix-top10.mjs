#!/usr/bin/env node
/**
 * **넷플릭스 공식 Top 10** 수집 — WikiTip(K컬처) 축.
 *
 *   npm run collect:netflix
 *
 * ── 사장님 지시(2026-08-04) ────────────────────────────────────
 *   「시청률, 넷플릭스 등 **OTT 별 시청순위를 국내 제작 프로그램에 한정해**
 *     제공할 수 있는 데이터가 있는지 찾아봐」
 *
 * ── ⚠ robots 를 정확히 읽는다 ─────────────────────────────────
 * netflix.com/robots.txt 는 172줄이고 `Disallow: /` 가 **있다.**
 * 그런데 그 아래에 **`Allow: /tudum`** 이 따로 있다.
 *   → **넷플릭스가 Top 10 지면을 일부러 열어 놨다.**
 * 처음에 앞 두 줄만 보고 「전면 차단」이라고 했다가 틀렸다.
 * **거부 기본형은 허용 목록까지 읽는다.** KIEP 에서도 같은 실수를 했다.
 *
 * ── 무엇이 오나 ────────────────────────────────────────────────
 *   all-weeks-countries.tsv  국가별 주간 Top10 (전 세계 · 약 49만 줄)
 *     country_name country_iso2 week category weekly_rank
 *     show_title season_title cumulative_weeks_in_top_10
 *
 *   all-weeks-global.tsv     글로벌 주간 (약 1만 줄)
 *     week category weekly_rank show_title season_title
 *     **weekly_hours_viewed runtime weekly_views** cumulative_weeks_in_top_10
 *
 * ── ⚠ 「국내 제작 한정」이 그냥은 안 된다 ──────────────────────
 * TSV 에 **제작국 필드가 없다.** `country_name` 은 **시청한 나라**이지
 * 만든 나라가 아니다. 한국에서 1위인 작품이 미국 드라마일 수 있다.
 *
 * 그래서 제작국은 **따로 붙여야 한다.** 후보:
 *   · TMDB API `origin_country` (무료 키)
 *   · KOBIS(영화) · KOCCA 목록과 제목 대조
 * 이 스크립트는 **원본을 그대로 보관**만 한다. 제작국 판정은 다음 단계다.
 * ⚠ 지금 단계에서 「한국 작품 순위」라고 부르지 않는다. 아직 그게 아니다.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://www.netflix.com/tudum/top10/data';
const OUT = path.resolve('archive/raw/netflix-top10');
const UA = 'Mozilla/5.0 (compatible; SeoulMarketsBot/0.1; +https://seoulmarkets.com/about)';

/** ⚠ 이 PC 는 이미 KST 다. toISOString 을 쓰면 새벽에 하루가 어긋난다 */
export function 오늘문자() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** TSV 한 줄을 객체로. ⚠ 제목에 따옴표·쉼표가 흔하니 **탭만** 자른다 */
export function tsv파싱(본문) {
  const 줄 = 본문.split('\n').filter((l) => l.trim());
  if (!줄.length) return [];
  const 머리 = 줄[0].split('\t').map((h) => h.trim());
  const 표 = [];
  for (let i = 1; i < 줄.length; i++) {
    const 칸 = 줄[i].split('\t');
    if (칸.length < 2) continue;
    const o = {};
    머리.forEach((h, j) => { o[h] = (칸[j] ?? '').trim(); });
    표.push(o);
  }
  return 표;
}

/** 숫자로. ⚠ `N/A` 와 빈칸을 **0 이 아니라 null** 로 만든다 */
export function 수(v) {
  if (v == null) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s === 'N/A' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function 받기(파일명) {
  const r = await fetch(`${BASE}/${파일명}`, {
    headers: { 'user-agent': UA },
    signal: AbortSignal.timeout(180000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const 오늘 = 오늘문자();

  for (const [파일, 이름] of [
    ['all-weeks-countries.tsv', 'countries'],
    ['all-weeks-global.tsv', 'global'],
  ]) {
    try {
      const 본문 = await 받기(파일);
      const 행 = tsv파싱(본문);

      /* 원본 TSV 를 그대로 남긴다 — 가공은 나중에 바꿀 수 있어도 원본은 못 되살린다 */
      writeFileSync(path.join(OUT, `${이름}-${오늘}.tsv`), 본문);

      /* NDJSON 으로도 떨군다 — 우리 파이프라인이 이 꼴을 쓴다 */
      const nd = 행.map((r) => JSON.stringify({
        주: r.week,
        국가: r.country_name ?? null,
        iso2: r.country_iso2 ?? null,
        구분: r.category,
        순위: 수(r.weekly_rank),
        제목: r.show_title,
        시즌: r.season_title === 'N/A' ? null : r.season_title,
        시청시간: 수(r.weekly_hours_viewed),
        시청수: 수(r.weekly_views),
        러닝타임: 수(r.runtime),
        누적주: 수(r.cumulative_weeks_in_top_10),
      })).join('\n');
      writeFileSync(path.join(OUT, `${이름}.ndjson`), nd + '\n');

      const 주 = [...new Set(행.map((r) => r.week))].sort();
      const 제목 = new Set(행.map((r) => r.show_title));
      console.log(`✅ ${이름.padEnd(10)} ${행.length.toLocaleString().padStart(8)}행 · 제목 ${제목.size.toLocaleString()} · 주 ${주.length} (${주[0]} ~ ${주[주.length - 1]})`);
      if (이름 === 'countries') {
        const 국가 = new Set(행.map((r) => r.country_name));
        const 한국 = 행.filter((r) => r.country_iso2 === 'KR').length;
        console.log(`   국가 ${국가.size} · 한국(KR) 시청 순위 ${한국.toLocaleString()}행`);
      }
    } catch (e) {
      console.error(`✕ ${이름} — ${String(e.message).slice(0, 90)}`);
    }
  }
  console.log(`\n   ${OUT}`);
  console.log('⚠ 제작국 필드가 없다. 「국내 제작 한정」은 다음 단계에서 붙인다.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
