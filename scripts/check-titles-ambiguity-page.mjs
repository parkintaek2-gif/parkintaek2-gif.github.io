/**
 * `/titles` 의 「이름이 겹치는 편」 칸이 자료와 맞나 검사한다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08. 이 지면은 오래 「몇 편을 못 쟀나」만 적고 **어느 편인지는 안 적었다.**
 * 판정은 `wikitip-title-ambiguity.json` 의 `perTitle` 에 448편 전부 있었는데
 * 어느 지면도 그 칸을 안 읽었다. 이제 읽는다 — 그러면 **틀릴 자리가 새로 생긴다.**
 *
 * 이 검사가 막는 것은 둘이다.
 *   ① 지면이 이름을 대는 문장 — 「The Glory 와 Business Proposal 도 이 칸에 있다」.
 *      자료가 바뀌면 그 두 편이 겹침이 아니게 될 수 있다. 그러면 **거짓말이 된다.**
 *   ② 수를 손으로 적는 것. 227·157·21·30.2 는 자료에서 세야 한다.
 *      손으로 적으면 자료가 움직여도 지면은 안 움직인다 — 8/7 에 그 자리에서 걸렸다.
 *
 * ⛔ 「겹침」은 「틀렸다」가 아니다. 그러니 이 검사도 겹침을 줄이라고 말하지 않는다.
 *    **적어 둔 것과 잰 것이 같은가**만 본다.
 *
 * 쓰는 법: node scripts/check-titles-ambiguity-page.mjs
 */
import fs from 'node:fs';

const 지면길 = 'src/pages/wikitip/titles.astro';

/** 자료에서 겹침 집합을 다시 센다. 지면이 하는 계산을 여기서 **따로** 한다 —
    같은 코드를 부르면 둘이 같이 틀려도 검사가 안 운다. */
export function 겹침세기(titlesJson, ambiguityJson) {
  const 판정 = new Map(ambiguityJson.perTitle.map((p) => [p.title, p]));
  const 통 = { koreaOnly: 0, shared: 0, unknown: 0, unreachable: 0 };
  const 겹침 = [];
  let 총주수 = 0;
  let 겹침주수 = 0;
  for (const r of titlesJson.rows) {
    총주수 += r.weeks;
    const p = 판정.get(r.title);
    if (!p) continue;
    통[p.verdict] = (통[p.verdict] || 0) + 1;
    if (p.verdict === 'shared') { 겹침.push(r.title); 겹침주수 += r.weeks; }
  }
  return { 통, 겹침: new Set(겹침), 총주수, 겹침주수, 몫: +((100 * 겹침주수) / 총주수).toFixed(1) };
}

/** 지면이 「~도 이 칸에 있다」고 이름을 대는 문장에서 **작품 이름만** 뽑는다.
    ⚠ 작품 이름은 `<cite>`, 말을 세우는 것은 `<em>` 으로 나눠 둔다. 처음엔 둘 다 `<em>` 이라
      「from the title text alone」까지 작품 이름으로 읽혀 검사가 헛울었다. **잣대가 아니라 표시를 고쳤다.** */
export function 댄이름(글) {
  const 문단 = 글.match(/<b>Shared does not mean wrong\.<\/b>([\s\S]*?)<\/p>/);
  if (!문단) return null;              // 문단 자체가 없어진 것도 알려야 한다
  return [...문단[1].matchAll(/<cite>([^<]+)<\/cite>/g)].map((m) => m[1].trim());
}

if (process.argv[1] && process.argv[1].endsWith('check-titles-ambiguity-page.mjs')) {
  /* ── 자가시험 ── 검사가 실제로 우는지 먼저 본다. */
  let 시험 = 0;
  let 통과 = 0;
  const 본다 = (이름, 참인가) => { 시험++; if (참인가) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };

  const 가짜자료 = {
    titles: { rows: [{ title: 'A', weeks: 10 }, { title: 'B', weeks: 30 }, { title: 'C', weeks: 60 }] },
    amb: {
      perTitle: [
        { title: 'A', verdict: 'koreaOnly' }, { title: 'B', verdict: 'shared' }, { title: 'C', verdict: 'unknown' },
      ],
    },
  };
  const 가짜 = 겹침세기(가짜자료.titles, 가짜자료.amb);
  본다('편수를 갈래대로 센다', 가짜.통.koreaOnly === 1 && 가짜.통.shared === 1 && 가짜.통.unknown === 1);
  본다('주수 몫은 편수가 아니라 주수로 낸다', 가짜.몫 === 30);
  본다('겹침 집합에 겹치는 것만 담는다', 가짜.겹침.has('B') && !가짜.겹침.has('A'));
  본다('문단이 없으면 null 로 알린다', 댄이름('<p>아무것도 없다</p>') === null);
  본다('문단에서 작품 이름을 뽑는다',
    JSON.stringify(댄이름('<p><b>Shared does not mean wrong.</b> <cite>X</cite> and <cite>Y</cite> are here.</p>')) === '["X","Y"]');
  본다('말을 세운 것(<em>)은 작품 이름으로 안 읽는다',
    JSON.stringify(댄이름('<p><b>Shared does not mean wrong.</b> <cite>X</cite> is <em>not proven</em>.</p>')) === '["X"]');
  console.log(`겹침 지면 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  /* ── 실물 ── */
  const t = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));
  const a = JSON.parse(fs.readFileSync('src/data/wikitip-title-ambiguity.json', 'utf8'));
  const 글 = fs.readFileSync(지면길, 'utf8');
  const 잰것 = 겹침세기(t, a);
  const 넘음 = [];

  /* ① 이름을 댄 문장 — 그 편이 정말 겹침 칸에 있나 */
  const 이름들 = 댄이름(글);
  if (이름들 === null) {
    넘음.push('「Shared does not mean wrong」 문단이 지면에서 사라졌다. 겹침을 밝히는 자리다');
  } else {
    if (!이름들.length) 넘음.push('그 문단이 이름을 하나도 안 댄다. 읽는 사람이 확인할 것이 없다');
    for (const 이름 of 이름들) {
      if (!잰것.겹침.has(이름)) 넘음.push(`지면은 «${이름}» 을 겹침이라 적었는데 자료의 겹침 칸에 없다`);
    }
  }

  /* ② 수를 손으로 적지 않았나 — 자료에서 세야 움직인다 */
  const 손대면안되는수 = [
    [String(잰것.통.koreaOnly), '한국만 편수'],
    [String(잰것.통.shared), '겹침 편수'],
    [String(잰것.몫), '겹침 주수 몫'],
    [잰것.총주수.toLocaleString('en-US'), '총 주수'],
  ];
  /* 주석은 뺀다 — 왜 그렇게 했나를 적는 자리라 수가 들어갈 수 있다. */
  const 코드 = 글.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const [수, 무엇] of 손대면안되는수) {
    if (new RegExp(`(^|[^\\w.,-])${수.replace('.', '\\.')}([^\\w.,%-]|$)`).test(코드)) {
      넘음.push(`${무엇} ${수} 이 지면에 글자로 박혀 있다. 자료에서 세야 자료가 움직일 때 같이 움직인다`);
    }
  }

  /* ③ 셋 다 보이나 — 하나만 빼면 그림이 좋아진다. 좋아지는 쪽으로 빠지는 것을 막는다 */
  for (const [열쇠, 이름] of [['koreaOnlyCount', '한국만'], ['sharedRows.length', '겹침'], ['unknownCount', '모름']]) {
    if (!글.includes(`{${열쇠}}`)) 넘음.push(`${이름} 칸을 지면이 안 보여 준다. 셋은 같이 나가야 한다`);
  }

  if (넘음.length) {
    console.log(`\n⛔ 겹침 지면 검사 — ${넘음.length}건`);
    for (const s of 넘음) console.log(`   · ${s}`);
    process.exit(1);
  }
  console.log(`✅ 겹침 지면 검사 — 한국만 ${잰것.통.koreaOnly} · 겹침 ${잰것.통.shared}(주수 ${잰것.몫}%) · 모름 ${잰것.통.unknown}`);
  console.log(`   이름을 댄 ${이름들.length}편 전부 자료의 겹침 칸에 있다`);
}
