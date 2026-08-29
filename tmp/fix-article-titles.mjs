/**
 * 노출이 있는 기사 여덟 편의 «제목·설명»을 한계 안으로 줄인다.
 *
 * ⛔ 이 자는 **빼기 전에 본문을 잰다.** 제목에서 뺀 말이 본문에 없으면 그 편은 «건너뛴다» —
 *   감추는 것이 되기 때문이다. 건너뛴 것은 그렇다고 찍는다.
 * ⚠ 한 번 돌리고 버리는 자다(tmp). 자가시험 대신 «돌린 결과»를 눈으로 보고 넘어간다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 방 = 'content/kculturewire';
const 제목한계 = 60;
const 설명한계 = 155;

const 할것 = [
  {
    slug: 'korea-ladder-games-played',
    설명: "Europe West's challengers average 921 ranked games to Korea's 770 and Southeast Asia's 410 — five of six regions measured.",
    본문에있어야: ['921', '770', '410'],
  },
  {
    slug: 'korea-music-outsells-television',
    제목: 'Korea exports more music than television — but only just',
    설명: 'In 2012 the two were the same size to within half a percent, and broadcast was ahead again as recently as 2022. Both series, year by year.',
    본문에있어야: ['2022'],
  },
  {
    slug: 'what-recorded-cast-actually-means',
    제목: 'Korean titles on Netflix: a median of 5 recorded cast names',
    설명: 'Wikidata records no cast at all for 266 of 901 Korean titles. Of the 635 that have any, the median series lists five names. What that limits.',
    본문에있어야: ['266', '901'],
  },
  {
    slug: 'the-charts-did-not-concentrate',
    제목: 'Korean drama costs rose 27-fold. Charts did not concentrate',
    설명: 'The leverage argument runs through cost — $360,000 an episode in 2015 against far more now. We tested what it predicts on the charts. It did not appear.',
    본문에있어야: ['360,000', '2015'],
  },
  {
    slug: 'korea-exports-grew-viewing-did-not',
    제목: "Korea's exports grew 63%. Netflix viewing did not move",
    설명: "Korean titles drew between 74 and 79 million hours a week from Netflix's global chart in every year we hold. Exports rose 63% in the same two years.",
    본문에있어야: ['63', '74', '79'],
  },
  {
    slug: 'netflix-korean-catalogue-concentration',
    제목: 'Squid Game is 21.3% of all Korean viewing on Netflix',
    설명: "Five years of Netflix's global Top 10 hold 23.7 billion hours of Korean viewing across 236 titles. One of them is a fifth of it. Every title listed.",
    본문에있어야: ['21.3', '236', '23.7'],
  },
  {
    slug: 'a-weekly-top-ten-is-not-ten-titles',
    제목: 'A Netflix weekly top 10 is not ten titles',
    설명: 'Across 493,600 country-chart rows, 18,586 weekly lists put one title in two or more places. One show has held seven of the ten. Seasons explain some of it.',
    본문에있어야: ['seven', '18,586'],
  },
  {
    slug: 'one-region-is-not-like-the-others',
    제목: 'Five of six League regions agree on hot streaks. NA does not',
    설명: 'Riot flags a player on a winning run. Korea, Vietnam, Europe West, Japan and Southeast Asia land within a few points. North America is ten points out.',
    본문에있어야: ['North America'],
  },
];

const 몸통 = (s) => s.replace(/^---[\s\S]*?\n---\n/, '');
const 앞말값 = (s, 이름) => (s.match(new RegExp(`^${이름}:\\s*"([\\s\\S]*?)"\\s*$`, 'm')) ?? [])[1];

let 고침 = 0; let 건너뜀 = 0;
for (const it of 할것) {
  const 길 = path.join(방, `${it.slug}.md`);
  if (!fs.existsSync(길)) { console.log(`⚠ 없다 — ${it.slug}`); continue; }
  let s = fs.readFileSync(길, 'utf8');
  const 본 = 몸통(s);

  /* ⛔ 빼기 전에 본문을 잰다 */
  const 없는것 = (it.본문에있어야 ?? []).filter((w) => !본.includes(w));
  if (없는것.length) {
    건너뜀 += 1;
    console.log(`⛔ 건너뜀 — ${it.slug} · 본문에 없는 말: ${없는것.join(', ')}`);
    continue;
  }

  const 전제목 = 앞말값(s, 'title');
  const 전설명 = 앞말값(s, 'dek');
  if (it.제목) {
    if (it.제목.length > 제목한계) { console.log(`⛔ 새 제목이 ${it.제목.length}자 — ${it.slug}`); 건너뜀 += 1; continue; }
    s = s.replace(/^title:\s*"[\s\S]*?"\s*$/m, `title: "${it.제목}"`);
  }
  if (it.설명) {
    if (it.설명.length > 설명한계) { console.log(`⛔ 새 설명이 ${it.설명.length}자 — ${it.slug}`); 건너뜀 += 1; continue; }
    s = s.replace(/^dek:\s*"[\s\S]*?"\s*$/m, `dek: "${it.설명}"`);
  }
  fs.writeFileSync(길, s);
  고침 += 1;
  console.log(`✅ ${it.slug}`);
  if (it.제목) console.log(`   제목 ${전제목.length} → ${it.제목.length}자`);
  if (it.설명) console.log(`   설명 ${전설명.length} → ${it.설명.length}자`);
}
console.log(`\n고친 것 ${고침}편 · 건너뛴 것 ${건너뜀}편`);
