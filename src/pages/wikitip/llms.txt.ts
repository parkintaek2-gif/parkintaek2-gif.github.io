import type { APIRoute } from 'astro';
import data from '../../data/kcw-llms.json';

/**
 * K Culture Wire llms.txt — AI 답변엔진(챗GPT·클로드·퍼플렉시티 등)이 읽는 안내문.
 *
 * ── 🔴 왜 만드나 (2026-08-30 · 5번) ────────────────────────
 * 오늘 재 보니 **kculturewire.com/llms.txt 가 404** 였다.
 * 100yearmap.com 과 seoulmarkets.com 은 둘 다 있는데 우리만 없었다.
 *
 * ⚠ 이것이 아픈 까닭 — 8/29 에 바깥 채널 셋을 90일로 재서 이렇게 나왔다:
 * ```
 * 유튜브        2명
 * SNS           3명
 * AI 어시스턴트 23명   ← 손 하나 안 대고 가장 컸다
 * ```
 * ⭐ **가장 큰 문에 안내문이 없었다.** 그리고 그때 같이 잰 것 하나 더 —
 *   AI 가 실제로 인용해 간 24 세션 가운데 16 이 `/school/<코드>`·`/university/<코드>` 처럼
 *   **「한 대상 + 사실들」 꼴**이었다. 우리 `/title/`·`/person/` 이 바로 그 꼴이다.
 *   그래서 아래에서 그 낱장 무리를 «수와 함께» 밝힌다.
 *
 * ── ⛔ 이 지면이 지키는 것 ───────────────────────────────────
 * ⛔ **설명을 여기서 손으로 쓰지 않는다.** `build-kcw-llms.mjs` 가 «실제로 지어진 지면»의
 *   description 에서 가져온 것만 쓴다. 손으로 쓰면 지면이 바뀔 때 조용히 거짓말이 된다.
 * ⛔ 없는 지면은 자가 «빼고 뺐다고 말한다». 여기에 지어낸 주소가 오지 않는다.
 * ⚠ `robots.txt.ts` 와 같은 이유로 `src/pages/wikitip/` 밑에 둔다 —
 *   `public/llms.txt` 는 서울마켓 것이라 우리 주소로는 404 가 난다(server.mjs 라우팅).
 */
export const GET: APIRoute = () => {
  const 갈래글 = (data.갈래들 as any[]).map((s) => {
    const 줄들 = s.줄들
      .map((r: any) => (r.설명
        ? `- [${r.이름}](https://www.kculturewire.com${r.길}): ${r.설명}`
        : `- [${r.이름}](https://www.kculturewire.com${r.길})`))
      .join('\n');
    return `## ${s.갈래}\n\n${줄들}`;
  }).join('\n\n');

  const 셈 = data.셈 as Record<string, number | null>;
  const 낱장 = [
    ['title', 'One Korean title, everything we measured about it', 셈.작품],
    ['person', 'One person — the titles of theirs that charted, and how far each went', 셈.사람],
    ['group', 'One K-pop group', 셈.그룹],
    ['school', 'One school, and the stars who went there', 셈.학교],
    ['market', 'One country, and the Korean titles that charted there', 셈.나라],
    ['week', 'One week of the Netflix country top 10', 셈.주],
    ['firm', 'One production company', 셈.회사],
  ]
    .filter(([, , n]) => typeof n === 'number' && (n as number) > 0)
    .map(([길, 뜻, n]) => `- \`https://www.kculturewire.com/${길}/{slug}\` — ${뜻}. ${n} pages.`)
    .join('\n');

  return new Response(
    `# K Culture Wire — Korean pop culture, in numbers, in English

> We count things about Korean pop culture that nobody else counts, and we publish the count
> with its source and its limits. We do not rank, rate or recommend. Where we could not measure
> something, we say so on the page rather than filling the gap with an estimate.

kculturewire.com measures Korean film, television, music and esports for readers outside Korea.
The main sources are the Netflix weekly country top 10 (published by Netflix at Tudum),
Wikipedia/Wikidata, and the Riot esports ladder. Every page names its source and its date.

## What we will not do

- We do not say a title was a hit or a flop. Netflix publishes no budget, revenue or viewing
  hours by country, so no one working from this data can say it, and we say that plainly.
- We do not recommend what to watch. Where we show titles beside each other, we are counting
  co-appearance on one country's published top 10 in one week — not similarity, not shared viewers.
- We do not turn an average into a norm.
- Where a figure is missing we mark it unmeasured. We do not write it as zero.

${갈래글}

## Per-entity pages (one subject, its measured facts)

${낱장}

## Notes for citation

- Free to cite with attribution and a link back to the page used.
- Each page states the source file and the date the figure was measured. Prefer quoting those
  over a summary of them.
- Netflix top 10 figures are counts of chart appearances, not viewership.
- Wikipedia pageview figures measure attention to a name, not our own traffic.
- Built ${String(data.지은날).slice(0, 10)}.
`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
};
