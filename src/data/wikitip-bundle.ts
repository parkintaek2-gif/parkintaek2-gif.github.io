import fs from 'node:fs';
import path from 'node:path';

/**
 * **파는 한 벌이 무엇인가 — 한 곳에서만 정한다.**
 *
 * ⛔ 2026-08-08 12:5x. `/data` 와 `/subscribe` 가 각자 세다가 **서로 다른 수를 말했다** —
 *    7파일 6,473줄 대 8파일 6,476줄. `/data` 는 소개 글이 있는 표 일곱만 셌고,
 *    `/subscribe` 는 폴더의 CSV 를 전부(그중 `provenance.csv` 는 표가 아니라 꼬리표다) 셌다.
 *    사는 쪽에서 보면 **두 지면이 다투는 것**이고, 그러면 어느 쪽도 못 믿는다.
 *
 * ⚠ 수를 손으로 안 적는다. 여기서 **실제 파일을 센다.** 자료가 늘면 두 지면이 같이 움직인다.
 */
export const BUNDLE_DIR = 'docs/상품안/본보기-한벌';

/** 파는 표. **소개 글이 있는 것만** 한 벌로 센다 — 설명 못 하는 파일은 파는 것이 아니다. */
export const 표들 = [
  { 파일: 'korean-title-panel.csv', 이름: 'Korean titles on Netflix in Southeast Asia',
    갱신: 'weekly, as Netflix publishes',
    말: 'Every Korean film and series that reached a Top 10 in six markets since 2021, with how far it travelled, how long it stayed — and two independent columns saying how sure we are it is the Korean work.' },
  { 파일: 'cast-title-join.csv', 이름: 'Who appears in what',
    갱신: 'with each new charting title',
    말: 'Actors joined to titles on Wikidata Q-numbers, not on names. Netflix does not publish cast; Wikidata does not know the charts. This is the join between them.' },
  { 파일: 'kpop-attention-panel.csv', 이름: 'K-pop attention',
    갱신: 'daily',
    말: 'Daily English Wikipedia lookups for every act and member with an article, with a column marking the ones who are also on our screen-actor roster.' },
  { 파일: 'industry-panel.csv', 이름: 'Listed content companies',
    갱신: 'yearly, as companies file',
    말: 'Headcount, tenure, pay and the male/female split for every listed Korean company that discloses them, from its own annual filing.' },
  { 파일: 'corrections.csv', 이름: 'Everything we got wrong',
    갱신: 'the day we correct anything',
    말: 'Every figure we have published and had to change, with the old value beside the new one and the cause it came from.' },
  { 파일: 'coverage.csv', 이름: 'What is missing',
    갱신: 'whenever a gap opens or closes',
    말: 'Each gap, how big it is, and whether it can ever be filled. Read this one before you build on any of the others.' },
  { 파일: 'columns.csv', 이름: 'What every column means',
    갱신: 'with every column we add',
    말: 'A row per column across every file, including what a blank cell means — a blank is not always a missing value.' },
];

/** 머리줄을 뺀 줄 수. 파일이 없으면 **0이 아니라 null** — 「비었다」와 「없다」는 다르다. */
export function 줄수(파일: string): number | null {
  const p = path.join(BUNDLE_DIR, 파일);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.trim()).length - 1;
}

/** 지금 실제로 있는 표와 그 크기. 두 지면이 이것만 쓴다. */
export function 한벌() {
  const 있는것 = 표들.map((t) => ({ ...t, 줄: 줄수(t.파일) })).filter((t) => t.줄 !== null) as
    (typeof 표들[number] & { 줄: number })[];
  return {
    표: 있는것,
    files: 있는것.length,
    rows: 있는것.reduce((s, t) => s + t.줄, 0),
  };
}
