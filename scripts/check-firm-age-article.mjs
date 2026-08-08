/**
 * 「젊어서인가」 기사를 자료에 대고 맞춘다.
 *
 *   young-firms-explain-some-of-it   industry — 나이를 묶어도 배수가 남는다
 *
 * ⛔ 이 검사가 특히 지키는 것 둘 —
 *    ① **얇은 칸을 안 읽었다는 것.** 50년 이상 띠에는 콘텐트사가 한 곳뿐이다.
 *       배수를 내면 한 회사를 읽는 것이다. 그 칸에 수가 생기면 선다.
 *    ② **두 분모를 갈라 적었다는 것.** /industry 는 11.29(콘텐트 포함), 여기는 11.49(뺀 것)다.
 *       안 밝히면 우리 두 지면이 서로 다투는 것처럼 보인다.
 */
import fs from 'node:fs';

const 기사길 = 'content/kculturewire/young-firms-explain-some-of-it.md';
const 자료길 = 'src/data/wikitip-firm-age.json';
const 산업길 = 'src/data/wikitip-content-industry.json';

/** 배수를 다시 센다. 자료가 적어 둔 값을 그대로 안 믿는다 */
export function 배수(나머지, 콘텐트) {
  if (!나머지 || !콘텐트) return null;
  return +(나머지 / 콘텐트).toFixed(2);
}

if (process.argv[1] && process.argv[1].endsWith('check-firm-age-article.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('배수를 두 자리로', 배수(11.49, 6.18) === 1.86);
  자가('띠 안에서도', 배수(8.07, 3.91) === 2.06);
  자가('한쪽이 없으면 null', 배수(null, 6) === null);
  console.log(`회사 나이 기사 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const d = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const ind = JSON.parse(fs.readFileSync(산업길, 'utf8'));
  const 한줄 = fs.readFileSync(기사길, 'utf8').replace(/\s+/g, ' ');
  const 민줄 = 한줄.replace(/\*/g, '');

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(38)} ${값}`); };
  const 있나 = (무엇, s) => 본다(무엇, 한줄.includes(s), s.length > 40 ? `${s.slice(0, 40)}…` : s);
  const 두자리 = (v) => Number(v).toFixed(2);
  /* ⚠ 자료는 두 자리(23.87), 기사는 한 자리(23.9)로 쓴다. **같은 수다** — 둘 다 받는다.
     자릿수까지 자가 정하면 자가 글을 이긴다. 오늘 같은 자리에서 세 번 걸렸다. */
  const 자릿수아무거나 = (무엇, 만들기) => 본다(무엇,
    [2, 1].some((n) => 한줄.includes(만들기(n))), 만들기(1).slice(0, 46));

  const o = d.overall;

  /* ── ① 자료가 스스로 맞나 ── */
  본다('전체 배수가 자료와 같나', o.ratio === 배수(o.restTenure, o.contentTenure), `${o.ratio}배`);
  본다('나이 차가 자료와 같나', o.ageGap === +(o.restAge - o.contentAge).toFixed(1), `${o.ageGap}년`);

  /* ── ② 기사가 자료와 같은 수를 말하나 ── */
  자릿수아무거나('콘텐트 줄', (n) => `| Content (${o.contentFirms} firms) | ${두자리(o.contentTenure)} years | **${o.contentAge.toFixed(n)} years** |`);
  자릿수아무거나('나머지 줄', (n) => `| Everything else (${o.restFirms.toLocaleString('en-US')} firms) | ${두자리(o.restTenure)} years | **${o.restAge.toFixed(n)} years** |`);
  있나('전체 배수', `is **${o.ratio}×**`);

  /* ── ③ 띠 표 ── */
  for (const b of d.bands) {
    if (b.thin) continue;
    const 재 = 배수(b.restTenure, b.contentTenure);
    본다(`띠 ${b.label} 배수가 자료와 같나`, b.ratio === 재, `${재}배`);
    const 줄 = `| ${b.label} | ${두자리(b.contentTenure)} (${b.contentFirms} firms) | ${두자리(b.restTenure)} (${b.restFirms} firms) | ${재}× |`;
    본다(`띠 ${b.label} 표 줄`, 민줄.includes(줄), 줄.slice(0, 52));
  }
  {
    const 쟨 = d.bands.filter((b) => !b.thin).map((b) => b.ratio);
    있나('띠 안 범위', `runs **${Math.min(...쟨)}× to ${Math.max(...쟨)}×**`);
    있나('모든 띠에 있다고 말했나', 'present in every band we can read');
  }

  /* ── ④ 🔴 얇은 칸을 안 읽었나 — 핵심 ── */
  {
    const 얇은 = d.bands.filter((b) => b.thin);
    본다('얇은 띠가 있나', 얇은.length === 1, `${얇은.length}개`);
    const b = 얇은[0];
    본다('자료가 배수를 안 냈나', b.ratio === null, String(b.ratio));
    있나('표에 「안 읽음」으로 뒀나', `| ${두자리(b.contentTenure)} (${b.contentFirms} firm) | ${두자리(b.restTenure)} (${b.restFirms} firms) | not read |`);
    있나('한 회사라고 말했나', 'a reading of **one company**');
    있나('줄을 안 지웠다고 말했나', 'rather than quietly dropping the row');
    본다('자료에 문턱이 적혀 있나', typeof d.thinThreshold === 'number' && /fewer than/.test(d.thinNote ?? ''),
      `${d.thinThreshold}곳`);
  }

  /* ── ⑤ 🔴 두 분모를 갈라 적었나 ── */
  {
    본다('/industry 값과 다른가', ind.market.tenure !== o.restTenure,
      `${ind.market.tenure} 대 ${o.restTenure}`);
    있나('그 차이를 적었나', `The ${두자리(o.restTenure)} here is the rest of the market`);
    있나('/industry 값을 대었나', `reports ${두자리(ind.market.tenure)} for the whole listed market`);
    있나('다투는 것처럼 보이지 않게 했나', 'look like a');
  }

  /* ── ⑥ 못 하는 말 ── */
  있나('까닭을 모른다고 말했나', 'none of them is separated by these figures');
  있나('상장사만이라고 말했나', 'Unlisted companies');
  본다('자료에도 한계가 있나', /Listed companies only/.test(d.limit ?? ''), '있다');

  console.log(틀림 ? `\n⛔ 회사 나이 — 안 맞는 것 ${틀림}건` : '\n✅ 회사 나이 — 전부 자료와 맞는다');
  process.exit(틀림 ? 1 : 0);
}
