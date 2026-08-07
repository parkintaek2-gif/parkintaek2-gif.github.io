/**
 * 기사 `playing-at-home-predicts-being-looked-up-abroad` 를 자료에 대고 맞춘다.
 *
 * ⛔ 수를 손으로 안 적는다. 세 자료를 **다시 조인해서** 기사와 맞춘다.
 *    (출연진 조인 · 한국 차트 신호 · 배우 조회수)
 * ⚠ 이 기사는 **교란을 두 번 걷어 낸 것**이 요지다. 작품 수를 맞춘 표와
 *    도달 나라를 맞춘 표가 **둘 다** 있어야 한다. 하나가 사라지면 잡는다.
 * ⚠ 사람 수가 적은 칸을 기사가 스스로 밝히는지도 본다 — 안 밝히면 읽는 사람이 속는다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/playing-at-home-predicts-being-looked-up-abroad.md';

export const 중앙 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
export const 천 = (n) => Number(n).toLocaleString('en-US');

/** 세 자료를 붙여 「사람 → 조회수 · 패널 작품들」을 만든다. */
export function 붙이기() {
  const c = JSON.parse(fs.readFileSync('archive/raw/netflix-top10/korean-cast-joined.json', 'utf8'));
  const k = JSON.parse(fs.readFileSync('src/data/wikitip-korea-signal.json', 'utf8'));
  const t = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));
  const key = JSON.parse(fs.readFileSync('archive/raw/netflix-top10/korean-titles-keyed.json', 'utf8'));
  const q2t = new Map(Object.entries(key.작품).map(([q, v]) => [q, v.넷플릭스제목]));
  const sig = new Map(k.rows.map((r) => [r.title, r]));
  const wk = new Map(t.rows.map((r) => [r.title, r]));
  const d = 'archive/raw/star-pageviews';
  const f = fs.readdirSync(d).filter((x) => /^actors-\d+\.json$/.test(x)).sort().pop();
  const raw = JSON.parse(fs.readFileSync(`${d}/${f}`, 'utf8'));
  const 조회 = new Map(raw.사람.map((p) => [p.이름, p.합]));

  const 사람 = [];
  for (const p of Object.values(c.배우)) {
    const v = 조회.get(p.이름);
    if (v == null) continue;
    const 패널 = p.작품.map((q) => q2t.get(q)).filter((x) => x && sig.has(x));
    if (!패널.length) continue;
    사람.push({
      이름: p.이름, 조회: v, n: 패널.length,
      한국뜬: 패널.filter((x) => sig.get(x).koreaWeeks > 0).length,
      나라: 패널.length === 1 ? wk.get(패널[0]).countries : null,
    });
  }
  return { 사람, 출연진: Object.values(c.배우).length, 조회붙음: Object.values(c.배우).filter((p) => 조회.has(p.이름)).length };
}

if (process.argv[1] && process.argv[1].endsWith('check-home-chart-attention-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('중앙값 — 홀수', 중앙([3, 1, 2]) === 2);
  자가('중앙값 — 원래 배열을 안 흔든다', (() => { const a = [3, 1, 2]; 중앙(a); return a[0] === 3; })());
  자가('천 단위', 천(1926) === '1,926');
  console.log(`한국 차트×관심도 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 원문 = fs.readFileSync(기사길, 'utf8');
  const 한줄 = 원문.replace(/\s+/g, ' ');
  const { 사람, 출연진, 조회붙음 } = 붙이기();
  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(30)} ${값}`); };

  본다('명단 크기', 한줄.includes(`**${천(조회붙음)} of ${천(출연진)} people**`), `${조회붙음}/${출연진}`);
  본다('문서 없는 사람', 한줄.includes(`**${출연진 - 조회붙음} of the ${천(출연진)} people`), 출연진 - 조회붙음);

  /* ── ① 작품 수를 맞춘 표 ── */
  for (const n of [1, 2]) {
    const g = 사람.filter((x) => x.n === n);
    const A = g.filter((x) => x.한국뜬 === x.n); const B = g.filter((x) => x.한국뜬 === 0);
    const 비 = (중앙(A.map((x) => x.조회)) / 중앙(B.map((x) => x.조회))).toFixed(2);
    const 줄 = 원문.split('\n').find((l) => l.startsWith(`| ${n} title`));
    /* ⚠ 첫 줄은 사람 수 뒤에 «people» 을 붙여 읽기 좋게 썼다. `(248)` 만 찾다가 헛울었다.
       괄호 안이 수로 **시작**하기만 하면 받는다 — 잣대가 글쓰기를 강요하지 않게 한다. */
    const 사람수맞나 = (l, n2) => new RegExp(`\\(${n2}(\\s+\\w+)?\\)`).test(l);
    const ok = !!줄 && 줄.includes(천(중앙(A.map((x) => x.조회)))) && 사람수맞나(줄, A.length)
      && 줄.includes(천(중앙(B.map((x) => x.조회)))) && 사람수맞나(줄, B.length) && 줄.includes(비);
    본다(`① 작품 ${n}편`, ok, `${중앙(A.map((x) => x.조회))}(${A.length}) · ${중앙(B.map((x) => x.조회))}(${B.length}) · ${비}`);
  }

  /* ── ② 도달 나라를 맞춘 표 — 교란을 두 번째로 걷어 낸 자리 ── */
  const 한편 = 사람.filter((x) => x.n === 1);
  본다('② 한 편인 사람 수', 한줄.includes(`the ${한편.length} actors with exactly one panel title`), 한편.length);
  for (const [lo, hi, 말] of [[1, 1, '1 market'], [2, 4, '2–4 markets'], [5, 6, '5–6 markets']]) {
    const g = 한편.filter((x) => x.나라 >= lo && x.나라 <= hi);
    const A = g.filter((x) => x.한국뜬 === 1); const B = g.filter((x) => x.한국뜬 === 0);
    const 비 = (중앙(A.map((x) => x.조회)) / 중앙(B.map((x) => x.조회))).toFixed(2);
    const 줄 = 원문.split('\n').find((l) => l.startsWith(`| ${말} |`));
    const ok = !!줄 && 줄.includes(천(중앙(A.map((x) => x.조회)))) && 줄.includes(`(${A.length})`)
      && 줄.includes(천(중앙(B.map((x) => x.조회)))) && 줄.includes(`(${B.length})`) && 줄.includes(비);
    본다(`② ${말}`, ok, `${중앙(A.map((x) => x.조회))}(${A.length}) · ${중앙(B.map((x) => x.조회))}(${B.length}) · ${비}`);
  }

  /* ── ③ 작은 칸을 스스로 밝히나 ── */
  {
    const g = 한편.filter((x) => x.나라 >= 5);
    const 작은 = g.filter((x) => x.한국뜬 === 0).length;
    본다('③ 가장 작은 칸을 밝히나', 한줄.includes(`rests on **${작은} people**`), `${작은}명`);
  }

  /* ── ④ 못 하는 말을 안 하나 ── */
  본다('④ 인과라고 안 하나', /will not say charting in Korea makes an actor famous/.test(한줄), '문장 있음');
  본다('④ 방송 드라마 설명을 대나', /broadcast dramas/.test(한줄) && /KBS or SBS/.test(한줄), '두 문장 다');
  본다('④ 빠진 사람이 한쪽으로 쏠릴 수 있다고 하나',
    /true gap is larger/.test(한줄) && /it is smaller/.test(한줄), '양쪽 다 적음');

  if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
  console.log('\n✅ 전부 기사와 자료가 맞는다');
}
