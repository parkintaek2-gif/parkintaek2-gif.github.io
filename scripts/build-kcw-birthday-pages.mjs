#!/usr/bin/env node
/**
 * build-kcw-birthday-pages.mjs — **「같은 생일인 한국 스타」 지면.** (`/born-on/<mm-dd>`)
 *
 * ── 왜 이 축인가 (짐작이 아니라 재서 골랐다) ──────────────────
 * 사장님: 「스타 이름, 아이돌 그룹이름이 제일 많이 검색하지 않나? … 온 사람들한테는
 * **잊지 못할 콘텐트와 커뮤니티**를 주면 계속 재방문하겠지?」 · 「**키워드 검색량을 재서 해.**」
 *
 * 자동완성으로 잰 것(2026-08-22) —
 * ```
 * iu birthday        10줄      jungkook birthday  10줄
 * kpop birthdays     10줄      bts birthdays       9줄
 * byeong day stem     0줄  ←  내가 그 전날 지면 열 장의 이름으로 쓴 말
 * ```
 * 그리고 상위 100명에 붙일 수 있는 축을 세 보니 —
 * 동남아 읽힘 49/100 · 배우 작품 41/100 · **같은 날 태어난 사람 100/100(평균 26.1명)**.
 * ⇒ 한 사람 한 장을 지금 100장 만들면 절반이 빈 장이 된다. **모두에게 있는 축**으로 간다.
 *
 * ── 머물게 하는 구조 ─────────────────────────────────────────
 * ① 제목에 **가장 많이 읽힌 사람의 이름**을 세운다 — 손님이 치는 말이 이름이다
 * ② 한 장에 그 날 태어난 사람이 다 있다 — **이름에서 이름으로** 걷는다
 * ③ 어제·내일로 이어진다 — 자기 생일을 찾아 들어온 사람이 옆으로 걷는다
 * ④ 읽힌 수를 같이 적는다 — 그 수는 달마다 움직인다(다시 올 까닭)
 *
 * ⛔ 점을 치지 않는다. 「같은 날 태어났다」는 같은 날 태어난 것 말고 아무 뜻이 없다고 적는다.
 * ⛔ 화면에 우리말을 쓰지 않는다. 한글 이름만 있는 사람은 **셈에는 넣고 목록에서 뺀다**(그 수를 적는다).
 * ⚠ 이름은 위키데이터에서 캔 것만 쓴다. 읽힌 수는 위키백과 실측이지 검색량이 아니다.
 *
 * 쓰는 법  node scripts/build-kcw-birthday-pages.mjs --자가시험
 *          node scripts/build-kcw-birthday-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 원자료 = path.join(뿌리, 'archive/raw/wikidata/korean-entertainers-birth.json');
const 수요길 = path.join(뿌리, 'src/data/wikitip-star-demand.json');
const 낼방 = path.join(뿌리, 'public/wikitip/born-on');
const 낼자료 = path.join(뿌리, 'src/data/wikitip-birthday-pages.json');

export const 달이름 = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export const 라틴이름 = (이름) => /^[A-Za-z0-9À-ɏḀ-ỿ' .,\-()&+/]+$/.test(String(이름));

/** 괄호 설명을 뗀 영문 문서 제목 — 위키백과가 쓰는 이름이다(지어낸 것이 아니다) */
export const 영문이름 = (p) => (라틴이름(p.name) ? p.name
  : (p.enTitle && 라틴이름(p.enTitle) ? String(p.enTitle).replace(/\s*\([^)]*\)\s*$/, '') : null));

export const 날쓰기 = (mmdd) => {
  const [m, d] = mmdd.split('-').map(Number);
  return `${d} ${달이름[m - 1]}`;
};

/** 하루 옆으로 — 윤달 2월 29일도 자리를 둔다(그 날 태어난 사람이 실재한다) */
export function 옆날(mmdd, 걸음) {
  const 날수 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let [m, d] = mmdd.split('-').map(Number);
  d += 걸음;
  while (d < 1) { m = m === 1 ? 12 : m - 1; d += 날수[m - 1]; }
  while (d > 날수[m - 1]) { d -= 날수[m - 1]; m = m === 12 ? 1 : m + 1; }
  return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * 사람들을 생일(월-일)로 나눈다. 읽힌 수가 있으면 붙이고, 많이 읽힌 순으로 세운다.
 * @param {{name:string,born:string,sitelinks:number,q:string}[]} 사람들
 * @param {Map<string,{reads:number,enTitle:string}>} 수요 q → 읽힌 수
 */
export function 날별로(사람들, 수요 = new Map()) {
  const 날 = new Map();
  for (const p of 사람들) {
    const k = String(p.born).slice(5);
    if (!/^\d{2}-\d{2}$/.test(k)) continue;
    const 잰것 = 수요.get(p.q);
    const 줄 = { ...p, reads: 잰것?.reads ?? null, enTitle: 잰것?.enTitle ?? null };
    (날.get(k) ?? 날.set(k, []).get(k)).push(줄);
  }
  for (const [, v] of 날) {
    v.sort((a, b) => (b.reads ?? -1) - (a.reads ?? -1) || b.sitelinks - a.sitelinks
      || String(a.name).localeCompare(String(b.name)));
  }
  return 날;
}

const 벗 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function 지면짓기(mmdd, 사람들) {
  const 실을것 = 사람들.map((p) => ({ ...p, 보일: 영문이름(p) })).filter((p) => p.보일);
  const 안실은수 = 사람들.length - 실을것.length;
  const 으뜸 = 실을것[0];
  const 날 = 날쓰기(mmdd);
  const 어제 = 옆날(mmdd, -1);
  const 내일 = 옆날(mmdd, 1);
  const 제목 = 으뜸
    ? `${벗(으뜸.보일)} and ${실을것.length - 1} other Korean stars born on ${날}`
    : `Korean stars born on ${날}`;
  const 줄 = 실을것.map((p) => `<tr><td>${벗(p.보일)}</td><td class="fine">${p.born.slice(0, 4)}</td><td class="fine">${p.reads === null ? '—' : p.reads.toLocaleString('en-US')}</td></tr>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://www.kculturewire.com/born-on/${mmdd}">
<title>${제목} | K Culture Wire</title>
<meta name="description" content="${실을것.length} Korean actors and singers were born on ${날}${으뜸 ? `, including ${벗(으뜸.보일)}` : ''}. Birth dates from Wikidata; readers counted from English Wikipedia. Not a horoscope.">
<style>
  :root{ --ink:#14161a; --ink-2:#5b6270; --line:#e6e8ec; --bg:#fbfbfc; --accent:#b4472a; --accent-soft:#fdf3f0; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#eceef2; --ink-2:#9aa2b1; --line:#2a2e37; --bg:#101216; --accent:#e8825f; --accent-soft:#261915; } }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
  .wrap{max-width:800px;margin:0 auto;padding:2rem 1.1rem 4rem}
  h1{font-size:1.45rem;line-height:1.3;margin:.2rem 0 .6rem;letter-spacing:-.01em}
  .kicker{color:var(--accent);font-weight:700;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin:0}
  .warn{border:1px solid var(--accent);border-radius:6px;padding:.7rem 1rem;background:var(--accent-soft);margin:1.1rem 0}
  .warn p{margin:.3rem 0;font-size:.9rem}
  table{border-collapse:collapse;width:100%;font-size:.95rem}
  th,td{text-align:left;padding:.42rem .5rem;border-bottom:1px solid var(--line)}
  th{font-size:.78rem;color:var(--ink-2);text-transform:uppercase;letter-spacing:.05em}
  .fine{color:var(--ink-2);font-size:.87rem}
  nav{margin:1.4rem 0;display:flex;gap:1rem;flex-wrap:wrap}
  nav a,footer a{color:var(--accent);font-weight:600}
  footer{margin-top:2.2rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--ink-2);font-size:.85rem}
</style>
</head>
<body>
<div class="wrap">
  <p class="kicker">K Culture Wire &middot; birthdays</p>
  <h1>${제목}</h1>
  <p>${실을것.length} Korean actors, singers and songwriters share this birthday. Ordered by how many
  people opened their English Wikipedia article in the last 30 days, so the name you are most likely
  to know is first.</p>
  ${안실은수 ? `<p class="fine"><strong>${안실은수} more people born on this day are counted but not listed</strong> — Wikidata holds no English name for them, only a Korean one, and this is an English-language site. They are inside the ${사람들.length} total.</p>` : ''}

  <div class="warn">
    <p><strong>Sharing a birthday means sharing a birthday.</strong> Nothing on this page says it means anything else. We counted whether a birth year predicts who reaches a chart, and it does not — <a href="/star-signs">that test is here</a>.</p>
  </div>

  <table>
    <thead><tr><th>Name</th><th>Born</th><th>Readers, 30 days</th></tr></thead>
    <tbody>
${줄 || '<tr><td colspan="3" class="fine">Nobody in our roster was born on this day.</td></tr>'}
    </tbody>
  </table>

  <nav>
    <a href="/born-on/${어제}">&larr; ${날쓰기(어제)}</a>
    <a href="/born-on/${내일}">${날쓰기(내일)} &rarr;</a>
    <a href="/born-on">All 366 days</a>
  </nav>

  <footer>
    <p><a href="/most-read">The 100 most-read Korean stars this month</a> &middot;
       <a href="/community">The twelve birth-year rooms</a> &middot;
       <a href="/day-pillar">The birth-day count</a></p>
    <p>Birth dates: Wikidata (best-ranked, day precision; South Korean citizenship; entertainment occupation), CC0.
       Readers: Wikimedia Pageviews, human traffic only. Readers are not searches.</p>
  </footer>
</div>
</body>
</html>
`;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('날을 사람 말로 쓴다', 날쓰기('05-16') === '16 May' && 날쓰기('12-01') === '1 December');
  검('하루 뒤로', 옆날('05-16', 1) === '05-17');
  검('달을 넘어간다', 옆날('01-31', 1) === '02-01' && 옆날('03-01', -1) === '02-29');
  검('해를 넘어간다', 옆날('12-31', 1) === '01-01' && 옆날('01-01', -1) === '12-31');
  검('윤날 자리를 둔다', 옆날('02-28', 1) === '02-29');

  const 사람 = [
    { q: 'Q1', name: 'IU', born: '1993-05-16', sitelinks: 90 },
    { q: 'Q2', name: '홍길동', born: '1980-05-16', sitelinks: 5 },
    { q: 'Q3', name: 'Someone', born: '1975-05-16', sitelinks: 3 },
  ];
  const 수요 = new Map([['Q1', { reads: 59582, enTitle: 'IU (entertainer)' }]]);
  const 날 = 날별로(사람, 수요);
  검('생일로 나눈다', 날.get('05-16').length === 3);
  검('많이 읽힌 순으로 세운다', 날.get('05-16')[0].name === 'IU');
  검('읽힌 수를 붙인다', 날.get('05-16')[0].reads === 59582);
  검('못 잰 사람은 null 이다 — 0 이 아니다', 날.get('05-16')[1].reads === null);

  const h = 지면짓기('05-16', 날.get('05-16'));
  검('제목에 이름이 선다', h.includes('<h1>IU and 1 other'));
  검('⛔ 한글 이름을 목록에 안 싣는다', !h.includes('홍길동'));
  검('안 실은 수를 적는다', h.includes('1 more people born on this day are counted but not listed'));
  검('canonical 이 있다', h.includes('rel="canonical" href="https://www.kculturewire.com/born-on/05-16"'));
  검('어제·내일로 걷는다', h.includes('/born-on/05-15') && h.includes('/born-on/05-17'));
  검('⛔ 점을 안 친다는 말을 싣는다', h.includes('Sharing a birthday means sharing a birthday'));
  검('⛔ 화면에 우리말이 없다', !/[가-힣]/.test(h.replace(/홍길동/g, '')));
  검('영문 문서 제목으로 떨어진다', 영문이름({ name: '카리나', enTitle: 'Karina (South Korean singer)' }) === 'Karina');
  검('영문 이름이 아예 없으면 안 싣는다', 영문이름({ name: '홍길동', enTitle: null }) === null);

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ build-kcw-birthday-pages 자가시험 통과 (17)');
  process.exit(0);
}

if (!fs.existsSync(원자료)) {
  console.error(`❌ 명단이 없다 — ${path.relative(뿌리, 원자료)}. 먼저 collect-star-daypillar.mjs 를 돌린다`);
  process.exit(1);
}
const 사람들 = JSON.parse(fs.readFileSync(원자료, 'utf8')).사람;
const 수요 = new Map();
if (fs.existsSync(수요길)) {
  for (const p of JSON.parse(fs.readFileSync(수요길, 'utf8')).people ?? []) 수요.set(p.q, { reads: p.reads, enTitle: p.enTitle });
}
const 날 = 날별로(사람들, 수요);

fs.mkdirSync(낼방, { recursive: true });
let 낸장 = 0; let 실은사람 = 0;
const 목록 = [];
for (let m = 1; m <= 12; m++) {
  const 날수 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
  for (let d = 1; d <= 날수; d++) {
    const k = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const v = 날.get(k) ?? [];
    fs.writeFileSync(path.join(낼방, `${k}.html`), 지면짓기(k, v));
    const 보일 = v.map(영문이름).filter(Boolean);
    실은사람 += 보일.length;
    목록.push({ day: k, url: `/born-on/${k}`, people: v.length, listed: 보일.length, top: 보일.slice(0, 3) });
    낸장++;
  }
}
fs.writeFileSync(낼자료, JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'One page per calendar day: the Korean actors and singers born on it, ordered by how many people opened their English Wikipedia article in the last 30 days.',
  whatThisIsNot: 'A horoscope, and not search volume. Sharing a birthday means sharing a birthday.',
  pages: 낸장, peopleListed: 실은사람, peopleTotal: 사람들.length,
  days: 목록,
}, null, 1));

const 붐비는날 = [...목록].sort((a, b) => b.people - a.people).slice(0, 5);
console.log(`지면 ${낸장}장 · 실은 사람 ${실은사람}명 / 명단 ${사람들.length}명`);
console.log('가장 붐비는 날:');
for (const x of 붐비는날) console.log(`   ${날쓰기(x.day).padEnd(14)} ${String(x.people).padStart(3)}명  ${x.top.join(', ')}`);
console.log(`\n냈다 — ${path.relative(뿌리, 낼방)} · ${path.relative(뿌리, 낼자료)}`);
console.log('⚠ 들어오는 문을 아직 안 냈다 — /born-on 첫 장과 /most-read 에서 길을 낸다');
