/**
 * 편집국 화면 (/admin) — 서버가 요청 때마다 만든다.
 *
 * ⚠ 이 화면은 **인증이 걸린 뒤에만** 호출된다. server.mjs 가 먼저 막는다.
 * ⚠ 발행 전 취재 문서(docs/취재/)는 여기 절대 넣지 않는다. 그건 .gitignore 로
 *    저장소에서 빠져 있어 서버에도 없다. 사고를 원천 차단하려고 그렇게 뒀다.
 *
 * 보여주는 것: 기사 재고, 오늘의 이벤트, 배포 정보.
 * 의존성 0개.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CONTENT = fileURLToPath(new URL('../../content/articles/', import.meta.url));

const CATS = ['equities', 'fx', 'rates', 'commodities', 'funds', 'macro'];

/** frontmatter 에서 한 줄 값을 꺼낸다. 파서를 붙일 만큼 복잡하지 않다. */
function fm(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

async function loadArticles() {
  let files = [];
  try {
    files = (await readdir(CONTENT)).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  const out = [];
  for (const f of files) {
    const raw = await readFile(CONTENT + f, 'utf8');
    out.push({
      file: f,
      title: fm(raw, 'title') ?? f,
      category: fm(raw, 'category') ?? '?',
      pubDate: (fm(raw, 'pubDate') ?? '').slice(0, 10),
      draft: fm(raw, 'draft') === 'true',
      sample: f.startsWith('sample-'),
      words: raw.split(/\s+/).length,
    });
  }
  return out.sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));
}

/**
 * 오늘 무엇이 있는지. 데이터-지도.md 의 이벤트 등급을 코드로 옮겨둔 것이다.
 * 문서를 고치면 여기도 고쳐야 한다 — 두 곳이 갈리면 문서가 맞다.
 */
function todayEvents(now) {
  const day = now.getDay(); // 0 일 ~ 6 토
  const date = now.getDate();
  const month = now.getMonth() + 1;
  const week = Math.ceil(date / 7);
  const out = [];

  if (day === 0 || day === 6) {
    out.push({
      tier: 'weekend',
      text: day === 6 ? '토요일 — 새 데이터 없음. 주간 종합 3~4건' : '일요일 — 해설·기획 3~4건',
    });
  } else {
    out.push({ tier: 'small', text: '평일 — 오전 공시(실시간) / 오후 시세(T+1)' });
  }

  if (day === 1) out.push({ tier: 'medium', text: '월요일 — 금요일 시세가 오늘 도착. 가장 두꺼운 날' });
  if (day === 4) out.push({ tier: 'medium', text: '목요일 — 부동산원 주간 아파트가격동향' });

  // 금통위 (2026년 결정월)
  if ([1, 2, 4, 5, 7, 8, 10, 11].includes(month) && day === 4 && (week === 2 || week === 4)) {
    out.push({ tier: 'big', text: '🔴 금통위 정기회의 가능 — 확인 필요' });
  }
  // 선물·옵션 동시만기
  if ([3, 6, 9, 12].includes(month) && day === 4 && week === 2) {
    out.push({ tier: 'big', text: "🔴 선물·옵션 동시만기('네 마녀의 날')" });
  } else if (day === 4 && week === 2) {
    out.push({ tier: 'medium', text: '옵션 만기일' });
  }
  if (date <= 5) out.push({ tier: 'big', text: '🔴 CPI·산업활동동향 발표 시기' });
  if (week === 1) out.push({ tier: 'medium', text: '펀드 운용실적 공시 주간 (전월말 기준)' });
  if ([3, 5, 8, 11].includes(month)) {
    out.push({ tier: 'big', text: '🔴 정기보고서 시즌 — 공시 폭주. 발행량 확대' });
  }
  if (month === 3) out.push({ tier: 'medium', text: '3월 — 주주총회·감사보고서 시즌 (의견거절 주시)' });
  if (month === 7 && date <= 3) out.push({ tier: 'medium', text: '7월 첫 매매일 — 관리종목 지정' });
  if ([5, 11].includes(month)) out.push({ tier: 'big', text: '🔴 MSCI 반기 리뷰' });

  return out;
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export async function renderAdmin({ user }) {
  const arts = await loadArticles();
  const real = arts.filter((a) => !a.sample && !a.draft);
  const samples = arts.filter((a) => a.sample);
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const events = todayEvents(kst);

  const byCat = CATS.map((c) => ({
    cat: c,
    n: real.filter((a) => a.category === c).length,
    total: arts.filter((a) => a.category === c && !a.draft).length,
  }));

  const row = (a) => `<tr>
    <td><span class="cat cat--${esc(a.category)}">${esc(a.category)}</span></td>
    <td class="d">${esc(a.pubDate)}</td>
    <td>${esc(a.title)}${a.sample ? ' <span class="tag">SAMPLE</span>' : ''}</td>
    <td class="n">${a.words}</td>
  </tr>`;

  return `<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>편집국 · SeoulMarkets</title>
<style>
:root{--bg:#0e1116;--fg:#e7eaef;--mut:#929cab;--line:#232a33;--card:#161b22;--accent:#7ab3e6;--big:#f87171;--med:#fbbf24}
@media(prefers-color-scheme:light){:root{--bg:#fdfdfc;--fg:#14181d;--mut:#6b7480;--line:#e2e5e9;--card:#f4f4f1;--accent:#0f4c81;--big:#c0392b;--med:#b45309}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:1.5rem 1.25rem 4rem}
h1{font-size:1.4rem;margin:0 0 .2rem;letter-spacing:-.02em}
.sub{color:var(--mut);font-size:.85rem;margin:0 0 1.5rem}
h2{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;color:var(--mut);margin:2rem 0 .7rem;font-weight:700}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.7rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:.8rem .9rem}
.card b{display:block;font-size:1.6rem;line-height:1.1;font-weight:700}
.card span{color:var(--mut);font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}
ul.ev{list-style:none;margin:0;padding:0}
ul.ev li{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--mut);border-radius:6px;padding:.55rem .8rem;margin-bottom:.4rem;font-size:.9rem}
ul.ev li.big{border-left-color:var(--big)}
ul.ev li.medium{border-left-color:var(--med)}
ul.ev li.weekend{border-left-color:var(--accent)}
table{width:100%;border-collapse:collapse;font-size:.88rem}
th{text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);border-bottom:1px solid var(--line);padding:.4rem .5rem}
td{padding:.45rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}
td.d,td.n{color:var(--mut);font-variant-numeric:tabular-nums;white-space:nowrap}
td.n{text-align:right}
.cat{font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;color:var(--accent)}
.tag{font-size:.62rem;background:var(--med);color:#000;padding:.05rem .3rem;border-radius:3px;letter-spacing:.05em}
a{color:var(--accent)}
.foot{margin-top:2.5rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--mut);font-size:.78rem}
</style></head><body><div class="wrap">

<h1>편집국</h1>
<p class="sub">${esc(user)} · ${kst.toISOString().slice(0, 16).replace('T', ' ')} KST</p>

<h2>오늘</h2>
<ul class="ev">${events.map((e) => `<li class="${e.tier}">${esc(e.text)}</li>`).join('')}</ul>

<h2>기사 재고</h2>
<div class="grid">
  <div class="card"><b>${real.length}</b><span>실기사</span></div>
  <div class="card"><b>${samples.length}</b><span>샘플(삭제 대상)</span></div>
  ${byCat.map((c) => `<div class="card"><b>${c.n}</b><span>${c.cat}</span></div>`).join('')}
</div>

<h2>전체 목록</h2>
<table><thead><tr><th>카테고리</th><th>발행일</th><th>제목</th><th>단어</th></tr></thead>
<tbody>${arts.map(row).join('')}</tbody></table>

<div class="foot">
발행 전 취재 문서는 <b>이 화면에 없다</b>. <code>docs/취재/</code> 는 .gitignore 로
저장소에서 빠져 있어 서버에도 존재하지 않는다. 사고를 원천 차단하려고 그렇게 뒀다.<br>
공개 사이트: <a href="/">/</a> · 이 페이지는 <code>noindex</code> 이고 인증이 걸려 있다.
</div>
</div></body></html>`;
}
