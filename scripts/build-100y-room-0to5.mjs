#!/usr/bin/env node
/**
 * **방 하나의 «안»을 채운다** — `public/100y/community/0to5.html`
 *   「0~5세 아이를 키우는 사람」 방
 *
 * 🔴 2번 지시(8/21 10:2x): 「지금 커뮤니티는 **문패만 있고 안이 비어 있습니다.**
 *    손님이 눌러 보고 빈 방이면 다시 안 옵니다. 한 방을 골라 그 안을 채우십시오.
 *    그리고 방↔지면을 **양쪽으로** 오가게 하십시오」
 *
 * ⛔⛔ 이 방이 지키는 것 — **세 표를 이어 붙이지 않는다**
 *   유치원 표의 동네 이름에 **중구가 여섯, 동구가 여섯, 서구가 다섯** 있다.
 *   시도 없이 이름만 있어서 소아과 표(코드가 있다)와 **이름으로 이으면 딴 동네가 붙는다.**
 *   ⇒ 세 자료를 **따로 놓는다.** 이어 붙이지 않은 까닭도 화면에 적는다.
 *      (8/21 소아과에서 이미 한 번 겪었다 — 그때는 코드로 이어서 살았다)
 *
 * ⛔ 수로 줄을 세우지 않는다. 동네는 **가나다순**이다.
 *    「유치원이 제일 많은 동네」를 만들면 그 줄이 곧 등수가 된다.
 * ⛔ 방에 적는 수는 **그 자료 json 에서 읽는다.** 손으로 안 박는다.
 * ⭐ 방↔지면을 양쪽으로 건다 — 여기서 지면으로 가고, 지면에서 여기로 돌아온다.
 *
 * 쓰는 법
 *   node scripts/build-100y-room-0to5.mjs
 *   node scripts/build-100y-room-0to5.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 낼길 = path.join(뿌리, 'public', '100y', 'community', '0to5.html');
const 자료방 = path.join(뿌리, 'src', 'data', '100yearmap');
const 읽기 = (이름) => JSON.parse(fs.readFileSync(path.join(자료방, 이름), 'utf8'));

/** ⛔ 가나다순. 수로 세우면 그것이 등수가 된다 */
export const 가나다 = (a, b) => String(a).localeCompare(String(b), 'ko');

/** 이름이 겹치는 동네를 찾아낸다 — 이어 붙이면 안 되는 까닭을 «세어» 보인다 */
export function 겹친이름(동네) {
  const 셈 = {};
  for (const d of 동네) 셈[d.이름] = (셈[d.이름] || 0) + 1;
  return Object.entries(셈).filter(([, v]) => v > 1)
    .map(([이름, 수]) => ({ 이름, 수 })).sort((a, b) => 가나다(a.이름, b.이름));
}

export function 모으기() {
  const 유치원 = 읽기('kindergarten.json');
  const 어린이집 = 읽기('nursery-none.json');
  const 소아과 = 읽기('pediatrics.json');

  const 동네 = [...유치원.동네].sort((a, b) => 가나다(a.이름, b.이름));
  const 없는곳 = [...소아과.없는곳].sort((a, b) => 가나다(a.시도, b.시도) || 가나다(a.이름, b.이름));
  const 시도 = [...어린이집.해별[어린이집.최신].시도].sort((a, b) => 가나다(a.시도, b.시도));

  return {
    유치원, 어린이집, 소아과, 동네, 없는곳, 시도,
    겹침: 겹친이름(유치원.동네),
    /* ⛔ 2번 확인 ④ — 받기 전에 몇 해치인지 본다. 화면에도 적는다 */
    해치: {
      유치원: `${유치원.해}년 한 해`,
      어린이집: `${어린이집.해들[0]}~${어린이집.최신} · ${어린이집.해들.length}해`,
      소아과: `${소아과.흐름[0].해}~${소아과.흐름[소아과.흐름.length - 1].해} · ${소아과.흐름.length}해`,
    },
    실린것: 동네.length + 없는곳.length + 시도.length,
  };
}

export function 판짓기(모음) {
  const { 유치원, 어린이집, 소아과, 동네, 없는곳, 시도, 겹침, 해치, 실린것 } = 모음;

  const 동네줄 = 동네.map((d) => `        <tr><td>${d.이름}</td><td>${d.곳}곳</td><td>${d.원아.toLocaleString()}명</td><td>${d.한곳당}명</td></tr>`).join('\n');
  const 없는줄 = 없는곳.map((r) => `        <tr><td>${r.시도}</td><td>${r.이름}</td><td>${r.병원급 === 0 ? '병원급도 없음' : '병원급은 있음'}</td></tr>`).join('\n');
  const 시도줄 = 시도.map((r) => `        <tr><td>${r.시도}</td><td>${r.곳}곳</td></tr>`).join('\n');
  const 겹침말 = 겹침.map((r) => `${r.이름} ${r.수}곳`).join(' · ');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>0~5세 아이를 키우는 사람 &mdash; 백년지도 커뮤니티</title>
<meta name="description" content="0~5세 아이를 키우는 사람의 방. 우리 동네 유치원 ${동네.length}칸, 소아청소년과 의원이 없는 시·군·구 ${없는곳.length}곳, 어린이집이 한 곳도 없는 지역을 시·도 ${시도.length}칸으로 실었습니다.">
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
    -webkit-font-smoothing:antialiased;word-break:keep-all}
  .wrap{max-width:860px;margin:0 auto;padding:40px 20px 80px}
  .back{display:inline-block;margin-bottom:20px;color:var(--accent);font-size:14px;text-decoration:none}
  h1{font-size:clamp(26px,4vw,36px);line-height:1.2;margin:0 0 12px;letter-spacing:-.02em}
  h2{font-size:22px;margin:44px 0 8px;letter-spacing:-.01em}
  .lead{color:var(--ink-2);margin:0 0 8px;max-width:62ch}
  .note{color:var(--ink-2);font-size:14px;margin:0 0 16px;max-width:64ch}
  .warn{background:var(--accent-soft);border-left:3px solid var(--accent);
    padding:14px 16px;border-radius:6px;margin:0 0 28px;max-width:64ch;font-size:14px}
  .years{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 28px;padding:0;list-style:none}
  .years li{background:var(--card);border:1px solid var(--line);border-radius:999px;
    padding:5px 12px;font-size:13px;color:var(--ink-2)}
  .tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--card)}
  table{border-collapse:collapse;width:100%;font-size:14px;min-width:340px}
  th,td{padding:8px 12px;text-align:left;border-bottom:1px solid var(--line);white-space:nowrap}
  th{color:var(--ink-2);font-weight:600;position:sticky;top:0;background:var(--card)}
  tr:last-child td{border-bottom:none}
  .tall{max-height:460px;overflow-y:auto}
  .go{margin:12px 0 0;font-size:14px}
  .go a{color:var(--accent)}
  footer{margin-top:52px;padding-top:20px;border-top:1px solid var(--line);
    color:var(--ink-2);font-size:13px;max-width:64ch}
</style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="/community">&larr; 커뮤니티 &mdash; 나이로 나눈 방</a>
    <h1>0~5세 아이를 키우는 사람</h1>
    <p class="lead">이 방에는 <strong>${실린것.toLocaleString()}개</strong>가 실려 있습니다 &mdash;
      동네별 유치원 ${동네.length}칸, 소아청소년과 &laquo;의원&raquo;이 없는 시&middot;군&middot;구 ${없는곳.length}곳,
      어린이집이 한 곳도 없는 지역을 시&middot;도 ${시도.length}칸으로 나눈 것입니다.</p>
    <p class="note">모두 저희가 공공데이터로 잰 것입니다. 각 표 아래의 링크를 누르면
      그 수를 낸 지면으로 가고, 그 지면에서 다시 이 방으로 돌아올 수 있습니다.</p>

    <p class="warn"><strong>&#9940; 세 표를 이어 붙이지 않았습니다.</strong>
      유치원 표에는 동네 이름만 있고 시&middot;도가 없습니다. 그런데 같은 이름이 여럿입니다 &mdash;
      <strong>${겹침말}</strong>. 이름만으로 이으면 딴 동네가 붙습니다.
      그래서 「우리 동네는 유치원 몇 곳이고 소아과가 있나」를 <strong>한 줄로 못 보여 드립니다.</strong>
      없는 것을 있는 척하지 않습니다.</p>

    <p class="note"><strong>&#9888; 표마다 몇 해치인지 먼저 보십시오.</strong>
      한 해짜리와 열일곱 해짜리는 다른 말을 합니다.</p>
    <ul class="years">
      <li>유치원 &mdash; ${해치.유치원}</li>
      <li>어린이집 없는 지역 &mdash; ${해치.어린이집}</li>
      <li>소아과 &mdash; ${해치.소아과}</li>
    </ul>

    <h2>우리 동네 유치원 &mdash; ${동네.length}칸</h2>
    <p class="note">${유치원.해}년 기준. <strong>가나다순입니다</strong> &mdash;
      수로 줄을 세우지 않습니다. 「한 곳당 원아」는 저희가 원아를 곳수로 나눈 값입니다.</p>
    <div class="tablewrap tall">
      <table>
        <thead><tr><th>동네</th><th>유치원</th><th>원아</th><th>한 곳당</th></tr></thead>
        <tbody>
${동네줄}
        </tbody>
      </table>
    </div>
    <p class="go"><a href="/kindergarten">전국 ${유치원.전국.곳.toLocaleString()}곳 &middot; 원아 ${유치원.전국.원아.toLocaleString()}명 &mdash; 유치원 지면으로 &rarr;</a></p>

    <h2>소아청소년과 &laquo;의원&raquo;이 한 곳도 없는 시&middot;군&middot;구 &mdash; ${없는곳.length}곳</h2>
    <p class="note">&#9940; 이 표가 세는 것은 <strong>&laquo;의원&raquo;뿐입니다.</strong>
      「소아과가 아예 없다」는 뜻이 아닙니다 &mdash; 그래서 병원급까지 함께 적었습니다.
      그 ${없는곳.length}곳 가운데 <strong>${소아과.병원급.아예없는곳}곳은 병원급도 없습니다.</strong></p>
    <div class="tablewrap tall">
      <table>
        <thead><tr><th>시&middot;도</th><th>시&middot;군&middot;구</th><th>병원급</th></tr></thead>
        <tbody>
${없는줄}
        </tbody>
      </table>
    </div>
    <p class="go"><a href="/pediatrics">어디에 몰려 있는지, ${해치.소아과} 어떻게 움직였는지 &mdash; 소아과 지면으로 &rarr;</a></p>

    <h2>어린이집이 한 곳도 없는 지역 &mdash; ${어린이집.해별[어린이집.최신].전국}곳</h2>
    <p class="note">${어린이집.최신}년 기준. 시&middot;도 ${시도.length}칸으로 나눈 것입니다.
      &#9888; 이 수는 <strong>지역의 수이지 아이의 수가 아닙니다.</strong></p>
    <div class="tablewrap">
      <table>
        <thead><tr><th>시&middot;도</th><th>어린이집이 없는 지역</th></tr></thead>
        <tbody>
${시도줄}
        </tbody>
      </table>
    </div>
    <p class="go"><a href="/nursery">${해치.어린이집} 어떻게 늘었는지 &mdash; 어린이집 지면으로 &rarr;</a></p>

    <footer>
      <p><strong>이 방에는 글쓰기가 없습니다.</strong> 서버도 로그인도 아직 없습니다 &mdash;
      없는 것을 있는 척하지 않습니다. 지금 이 방이 하는 일은
      <strong>흩어진 세 지면을 한 자리에 놓는 것</strong>입니다.</p>
      <p>출처 &mdash; ${유치원.출처.기관} &middot; ${어린이집.출처.기관} &middot; ${소아과.출처.기관}.
      저희가 받아 세었습니다.</p>
      <p><a href="/community">&larr; 커뮤니티로 돌아가기</a> &middot;
      <a href="/ages">나이로 보는 문 &mdash; 0세부터 100세까지</a></p>
    </footer>
  </div>
</body>
</html>
`;
}

const 내가실행됐다 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-room-0to5.mjs';

if (내가실행됐다 && process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  const m = 모으기();
  const 판 = 판짓기(m);
  const 민 = 판.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

  본다(`① 방에 실린 것이 ${m.실린것}개다 (${m.동네.length}+${m.없는곳.length}+${m.시도.length})`,
    m.실린것 === m.동네.length + m.없는곳.length + m.시도.length && m.실린것 > 250);
  본다('② ⛔ 줄 세운 목록이 없다 — ol 도 순위 낱말도 없다',
    !/<ol[\s>]/.test(판) && !['순위', '등수', '랭킹', '몇 위', '꼴찌'].some((w) => 민.includes(w)));
  본다('③ ⛔ 동네가 가나다순이다 — 수로 안 세웠다',
    m.동네.every((d, i) => i === 0 || 가나다(m.동네[i - 1].이름, d.이름) <= 0));
  본다('④ ⭐ 방에서 세 지면으로 가는 길이 다 있다',
    ['/kindergarten', '/pediatrics', '/nursery'].every((p) => 판.includes(`href="${p}"`)));
  본다('⑤ ⭐ 커뮤니티로 돌아가는 길이 있다', (판.match(/href="\/community"/g) || []).length >= 2);
  본다('⑥ ⛔ 몇 해치인지 화면에 적었다',
    민.includes(m.해치.어린이집) && 민.includes(m.해치.소아과));
  본다('⑦ ⛔ 세 표를 이어 붙이지 않은 까닭을 적었다 — 겹치는 이름을 세어 보였다',
    m.겹침.length > 0 && 민.includes('세 표를 이어 붙이지 않았습니다') && 민.includes(m.겹침[0].이름));
  본다('⑧ ⛔ 「의원」만 센다는 것을 표 앞에 박았다', 민.includes('아예 없다」는 뜻이 아닙니다'));
  본다('⑨ ⛔ 지역의 수이지 아이의 수가 아니라고 적었다', 민.includes('아이의 수가 아닙니다'));

  console.log(`\n실린 것 ${m.실린것}개 · 지면으로 가는 길 3개 · 커뮤니티로 돌아가는 길 2개`);
  process.exit();
}

if (내가실행됐다) {
  const m = 모으기();
  fs.mkdirSync(path.dirname(낼길), { recursive: true });
  fs.writeFileSync(낼길, 판짓기(m), 'utf8');
  console.log(`✅ ${path.relative(뿌리, 낼길)}`);
  console.log(`   실린 것 ${m.실린것}개 — 동네 ${m.동네.length} · 소아과 없는 곳 ${m.없는곳.length} · 시도 ${m.시도.length}`);
  console.log(`   ⛔ 이어 붙이지 않았다 — 겹치는 이름 ${m.겹침.length}개(${m.겹침.map((r) => r.이름 + '×' + r.수).join(' · ')})`);
}
