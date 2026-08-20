#!/usr/bin/env node
/**
 * **커뮤니티 첫 화면 한 장을 만든다** — `public/wikitip/community.html`
 *
 * 🔴 2번 지시(8/21 · 다섯 번째): 움직이지 않는 첫 화면 한 장. 서버·글쓰기·로그인 **없음**.
 *    스타 방 카드 **12장**(열두 띠에서 하나씩) · 카드 = 이름 + 띠 + 단추 · 줄 세운 목록 **0개**.
 *    사장님: 「케이컬쳐가 커뮤니티를 잘 만들어야 다른 유닛이 그대로 쓰지」 — 베낄 **본**이다.
 * 🔴 2번이 07:0x 에 임시 본을 만들어 주셨다(`docs/커뮤니티-첫본.html`). 고맙다.
 *    ⛔ 그것은 **한국어**다. kculturewire 는 영문 매체라 그대로 못 올린다. 영어로 다시 짓는다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **이름을 지어내지 않는다.** `src/data/wikitip-star-signs.json` 에서 뽑는다.
 * ⛔ **점을 치지 않는다.** 띠는 방을 가르는 이름표일 뿐이다 —
 *    우리가 이미 「우연과 구분되지 않는다」를 발행했다(카이제곱 7.77 · 문턱 19.68).
 * ⛔ **줄 세운 목록을 안 만든다.** 2번 확인 항목이다.
 * ⛔ **단추가 아무 데도 안 간다.** 서버가 없다. 없는 것을 있는 척하지 않는다.
 * ⛔ 화면에 한국어를 안 쓴다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-community.mjs
 *   node scripts/build-kcw-community.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자료길 = path.join(뿌리, 'src', 'data', 'wikitip-star-signs.json');
export const 낼길 = path.join(뿌리, 'public', 'wikitip', 'community.html');
export const 카드수 = 12;

/** 띠마다 가장 많이 읽힌 한 사람 — ⛔ 읽힘을 못 잰 사람은 대표로 안 세운다 */
export function 방들(자료) {
  return (자료.signs ?? []).map((s) => {
    const 대표 = (s.top ?? []).find((p) => typeof p.perMillion === 'number');
    return {
      sign: s.sign,
      people: s.people,
      withReads: s.withReads,
      star: 대표?.name ?? null,
      born: 대표?.born ?? null,
      perMillion: 대표?.perMillion ?? null,
      also: (s.top ?? []).filter((p) => p.name !== 대표?.name).slice(0, 2).map((p) => p.name),
    };
  }).filter((r) => r.star);
}

/** ⛔ 단추는 아무 데도 안 간다 — 없는 것을 있는 척하지 않는다 */
export const 단추말 = 'Join the room';

export function 판짓기(방, 자료) {
  const 칸 = 방.map((r) => `      <article class="room">
        <p class="sign">Year of the ${r.sign}</p>
        <h2>${r.star}</h2>
        <p class="born">Born ${r.born} &middot; ${r.perMillion} reads per million</p>
        <p class="also">${r.also.length ? `Also here: ${r.also.join(', ')}` : 'First room of this year'}</p>
        <p class="count">${r.people} Korean stars share this year</p>
        <button class="cta" disabled aria-disabled="true">${단추말}</button>
      </article>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Star rooms &mdash; K Culture Wire community</title>
<meta name="description" content="Twelve rooms, one for each Chinese zodiac year, named for the Korean star most read in that year across four Southeast Asian Wikipedias.">
<meta name="robots" content="noindex">
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --card:#fff;
         --accent:#b4472a; --accent-soft:#fdf3f0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --card:#181b21;
    --accent:#e8825f; --accent-soft:#261915; } }
  :root[data-theme="dark"]{ --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216;
    --card:#181b21; --accent:#e8825f; --accent-soft:#261915; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
    -webkit-font-smoothing:antialiased}
  .wrap{max-width:1080px;margin:0 auto;padding:48px 20px 80px}
  h1{font-size:clamp(28px,4vw,40px);line-height:1.15;margin:0 0 12px;letter-spacing:-.02em}
  .lead{color:var(--ink-2);margin:0 0 8px;max-width:62ch}
  .note{color:var(--ink-2);font-size:14px;margin:0 0 32px;max-width:62ch}
  .warn{background:var(--accent-soft);border-left:3px solid var(--accent);
    padding:14px 16px;border-radius:6px;margin:0 0 36px;max-width:62ch;font-size:14px}
  .grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
  .room{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}
  .sign{margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;
    color:var(--accent);font-weight:700}
  .room h2{margin:0 0 6px;font-size:21px;letter-spacing:-.01em}
  .born,.also,.count{margin:0 0 6px;font-size:13px;color:var(--ink-2)}
  .count{margin-bottom:14px}
  .cta{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--line);
    background:transparent;color:var(--ink-2);font:inherit;font-size:14px;cursor:not-allowed}
  footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--line);
    color:var(--ink-2);font-size:13px;max-width:62ch}
</style>
</head>
<body>
  <div class="wrap">
    <h1>Star rooms</h1>
    <p class="lead">Twelve rooms, one for each Chinese zodiac year. Each is named for the Korean
      star born in that year who is read most across the Indonesian, Vietnamese, Thai and Malay
      Wikipedias.</p>
    <p class="note">Names and birth dates come from Wikidata; read counts from the Wikimedia
      Pageviews API, ${자료.window}.</p>

    <p class="warn"><strong>A room name is not a reading.</strong> We tested whether the zodiac
      year picks out who reaches a Netflix chart, and it does not &mdash; the result was
      indistinguishable from chance. The years are here to divide ${자료.peopleWithSign} stars into
      twelve rooms, nothing more.</p>

    <div class="grid">
${칸}
    </div>

    <footer>
      <p><strong>This is a first draft of a shell.</strong> There is no server, no sign-in and no
      posting yet, so every button above is deliberately inert. Nothing is ranked and there is no
      feed.</p>
      <p>K Culture Wire &middot; kculturewire.com</p>
    </footer>
  </div>
</body>
</html>
`;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 방 = 방들(자료);
  재본다('⭐ 방이 열둘이다 — 2번 확인 ②', 방.length, 카드수);
  /**
   * ⚠ 처음에 「두 글자 넘는 이름」을 요구했다가 **IU 에서 걸렸다.** IU 는 실재하는 이름이고
   *   닭띠에서 가장 많이 읽힌 사람이다. 여기 이름은 **자료에서 뽑은 것**이라 짧아도 참이다.
   *   ⛔ 제목 검사기(check-kcw-star-names)에서 짧은 이름을 뺀 것과 자리가 다르다 —
   *     거기는 **글자를 맞추는** 자리라 겹침이 문제였고, 여기는 맞추지 않는다.
   */
  재본다('⛔ 이름을 못 뽑은 방이 없다', 방.every((r) => typeof r.star === 'string' && r.star.length > 0), true);
  재본다('⛔ 읽힘을 못 잰 사람을 대표로 안 세운다',
    방.every((r) => typeof r.perMillion === 'number'), true);

  const 판 = 판짓기(방, 자료);
  재본다('⭐ 스타 실명이 화면에 있다 — 2번 확인 ④',
    방.every((r) => 판.includes(r.star)), true);
  /* ⛔ 2번 확인 ③ — 줄 세운 목록 0개 */
  재본다('⛔⛔ 줄 세운 목록이 없다', /<[ou]l[\s>]/.test(판), false);
  재본다('⛔ 단추가 아무 데도 안 간다', /<button[^>]*disabled/.test(판), true);
  재본다('⛔ 단추 수가 방 수와 같다', (판.match(/<button/g) ?? []).length, 카드수);
  재본다('⛔ 화면에 한국어가 없다', /[가-힣]/.test(판), false);
  재본다('⛔ 점을 안 친다는 말이 있다', /indistinguishable from chance/.test(판), true);
  재본다('⛔ 서버가 없다고 적는다', /no server/.test(판), true);
  재본다('영문 지면이다', /<html lang="en">/.test(판), true);

  console.log(`커뮤니티 첫 본 짓는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 자료 = JSON.parse(fs.readFileSync(자료길, 'utf8'));
  const 방 = 방들(자료);
  if (방.length !== 카드수) {
    console.error(`⛔ 방이 ${방.length}개다 — ${카드수}개여야 한다. 짓지 않는다.`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, 판짓기(방, 자료));
  console.log(`✅ ${path.relative(뿌리, 낼길)} — 방 ${방.length}개`);
  for (const r of 방) console.log(`   ${r.sign.padEnd(8)} ${r.star.padEnd(18)} ${r.perMillion}`);
}
