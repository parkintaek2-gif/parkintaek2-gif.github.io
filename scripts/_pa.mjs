import fs from 'node:fs';
const L = String.fromCharCode(10);
const p = 'content/kculturewire/korean-netflix-titles-one-body.md';
let s = fs.readFileSync(p, 'utf8');
const CRLF = s.includes(String.fromCharCode(13, 10));
const 맞 = (x) => (CRLF ? x.split(L).join(String.fromCharCode(13, 10)) : x);
let 실패 = 0;
const 바꾼다 = (a, b) => {
  const A = 맞(Array.isArray(a) ? a.join(L) : a);
  if (!s.includes(A)) { console.log('🔴 못 찾음: ' + String(Array.isArray(a) ? a[0] : a).slice(0, 62)); 실패 += 1; return; }
  s = s.split(A).join(맞(Array.isArray(b) ? b.join(L) : b));
};

바꾼다('dek: "Of 676 Korean titles with a recorded cast, 658 form a single connected body through shared actors. We expected a few very busy people to be holding it together. Take out the 100 busiest and 94.9% is still one piece."',
  'dek: "Of 672 Korean titles with a recorded cast, 655 form a single connected body through shared actors. We expected a few very busy people to be holding it together. Take out the 100 busiest and 94.7% is still one piece."');
바꾼다('matching on Q-numbers reaches 676 of 956', 'matching on Q-numbers reaches 672 of 950');
바꾼다('"956 of the titles Netflix has charted are matched to a Korean Wikidata item. 676 of those have at least one cast member recorded. The 280 with none are absent from this analysis and counted here"',
  '"950 of the titles Netflix has charted are matched to a Korean Wikidata item. 672 of those have at least one cast member recorded. The 278 with none are absent from this analysis and counted here"');

바꾼다('**676 titles. 1,408 actors. 3,627 casting slots.**', '**672 titles. 1,400 actors. 3,606 casting slots.**');
바꾼다(['117. Only 16 titles — 2.4% — share nobody with anything else.'],
  ['117. Only 15 titles — 2.2% — share nobody with anything else.']);
바꾼다(['Follow those lines and **658 of the 676 titles, 97.3%, form a single connected body.** There are 18',
  'separate groups in total: one containing almost everything, and 16 titles sitting alone.'],
['Follow those lines and **655 of the 672 titles, 97.5%, form a single connected body.** There are 17',
  'separate groups in total: one containing almost everything, and 15 titles sitting alone.']);

바꾼다('| none | 676 | 658 (97.3%) | 16 |', '| none | 672 | 655 (97.5%) | 16 |');
바꾼다('| 10 busiest | 664 | 645 (97.1%) | 14 |', '| 10 busiest | 660 | 642 (97.3%) | 14 |');
바꾼다('| 20 busiest | 664 | 643 (96.8%) | 12 |', '| 20 busiest | 660 | 640 (97.0%) | 12 |');
바꾼다('| 39 busiest (everyone with 10+ titles) | 655 | 633 (96.6%) | 11 |', '| 39 busiest (everyone with 10+ titles) | 651 | 630 (96.8%) | 11 |');
바꾼다('| 50 busiest | 649 | 626 (96.5%) | 10 |', '| 50 busiest | 645 | 623 (96.6%) | 10 |');
바꾼다('| 100 busiest | 623 | 591 (**94.9%**) | 7 |', '| 100 busiest | 620 | 587 (**94.7%**) | 7 |');

바꾼다(['everyone in the set — and the remaining 623 titles are still 94.9% one connected body.'],
  ['everyone in the set — and the remaining 620 titles are still 94.7% one connected body.']);
바꾼다('658 of 674 titles, 97.6%.', '655 of 671 titles, 97.6%.');
바꾼다(['**Half the actors in this set appear in exactly one title.** 686 of 1,408 — 48.7%. Only 208 appear in',
  'five or more.'],
['**Half the actors in this set appear in exactly one title.** 678 of 1,400 — 48.4%. Only 207 appear in',
  'five or more.']);
바꾼다(['97.3%: it says the typical title is not hanging on by one thread but sitting in a mesh of sixteen.'],
  ['97.5%: it says the typical title is not hanging on by one thread but sitting in a mesh of sixteen.']);
바꾼다(['**280 titles have no cast recorded at all** — 956 Korean titles are matched to Wikidata items and only',
  '676 carry a P161 statement. Those 280 are not counted as isolated; they are absent.'],
['**278 titles have no cast recorded at all** — 950 Korean titles are matched to Wikidata items and only',
  '672 carry a P161 statement. Those 278 are not counted as isolated; they are absent.']);

if (실패) { console.log('🔴 ' + 실패 + '곳 — 아무것도 안 썼다'); process.exit(1); }
fs.writeFileSync(p, s);
console.log('출연 겹침 기사를 다시 맞췄다');
