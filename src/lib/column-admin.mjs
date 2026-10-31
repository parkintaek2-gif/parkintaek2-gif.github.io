/**
 * 편집국 — 백년지도 칼럼 쓰기 (/admin/column) · 2026-10-31 · 1번
 *
 * ⚠ 이 화면은 **편집국 로그인이 확인된 뒤에만** 불린다. server.mjs 의 /admin 분기가
 *   먼저 막는다(같은 계정·같은 방식). 여기서는 로그인을 따로 만들지 않는다.
 *
 * 게시판 모양 —
 *   GET  /admin/column               목록(제목·상태·작성일, 새 글이 위)
 *   GET  /admin/column/new           새 글 쓰기
 *   GET  /admin/column/edit/<id>     고치기
 *   GET  /admin/column/preview/<id>  저장된 글 미리보기
 *   POST /admin/column/save          임시저장 · 공개 · 미리보기(저장 안 함)
 *   POST /admin/column/delete        삭제(확인창을 거친다)
 *
 * 🔴 남의 사이트가 편집국 로그인을 빌려 글을 올리지 못하게(CSRF) —
 *   ① 보낸 곳(Origin, 없으면 Referer)의 호스트가 이 요청의 호스트와 같아야 한다
 *   ② 화면에 심은 확인값이 맞아야 한다(프로세스마다 새로 만드는 비밀로 서명)
 *   둘 다 맞아야 저장한다. 재배포 뒤에는 열어 둔 화면의 확인값이 안 맞는다 —
 *   그때는 「화면을 다시 열어 주십시오」라고 답한다(쓴 글은 화면에 그대로 남긴다).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import * as C from './column.mjs';
import { remoteEnabled } from './store.mjs';

const esc = C.esc;
const 비밀 = randomBytes(32);
export const 확인값 = () => createHmac('sha256', 비밀).update('100y-column-form').digest('hex');
function 확인값맞나(v) {
  const a = Buffer.from(String(v ?? ''));
  const b = Buffer.from(확인값());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 같은 곳에서 보낸 요청인가 — Origin(없으면 Referer)의 호스트가 Host 와 같아야 한다 */
export function 같은곳인가(headers) {
  const host = String(headers?.host ?? '').toLowerCase();
  const 보낸곳 = headers?.origin || headers?.referer || headers?.referrer;
  if (!host || !보낸곳 || 보낸곳 === 'null') return false;
  try {
    return new URL(보낸곳).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

const 본문한도 = 256 * 1024;
function 본문읽기(req) {
  return new Promise((resolve) => {
    const 조각 = [];
    let 크기 = 0;
    let 끝 = false;
    const 마감 = (v) => { if (!끝) { 끝 = true; resolve(v); } };
    req.on('data', (c) => {
      크기 += c.length;
      /* 넘치면 더 모으지 않고 «413 을 먼저 답한다». 바로 끊으면 쓰던 분이 이유를 못 본다.
         나머지는 흘려 버리고, 그래도 계속 밀어 넣으면 10초 뒤 끊는다 */
      if (크기 > 본문한도) {
        조각.length = 0;
        if (!끝) { 마감(null); setTimeout(() => req.destroy(), 10_000).unref?.(); }
        return;
      }
      조각.push(c);
    });
    req.on('end', () => 마감(Buffer.concat(조각).toString('utf8')));
    req.on('error', () => 마감(null));
  });
}

/* ══ 화면 ══════════════════════════════════════════════════════════ */

function 화면(제목, 안) {
  return `<!doctype html><html lang="ko"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(제목)}</title>
<style>
:root{--bg:#0e1116;--fg:#e7eaef;--mut:#929cab;--line:#2a323d;--card:#161b22;--accent:#e7c35a;--bad:#f87171;--ok:#4ade80}
@media(prefers-color-scheme:light){:root{--bg:#fdfdfc;--fg:#14181d;--mut:#6b7480;--line:#e2e5e9;--card:#f4f4f1;--accent:#8a6400;--bad:#c0392b;--ok:#15803d}.btn.main{color:#fff!important}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR',sans-serif;word-break:keep-all}
.wrap{max-width:860px;margin:0 auto;padding:1.25rem 16px 4rem}
h1{font-size:1.4rem;margin:.2rem 0 .8rem;line-height:1.3}
a{color:var(--accent)}
.top{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;justify-content:space-between;margin-bottom:.8rem}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 1rem;border-radius:.5rem;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
.btn.main{background:var(--accent);border-color:var(--accent);color:#1a1300}
.btn.bad{color:var(--bad);border-color:var(--bad);background:transparent}
.msg{padding:.7rem .9rem;border-radius:.5rem;border:1px solid var(--line);background:var(--card);margin:0 0 1rem}
.msg.bad{border-color:var(--bad)}
.msg.ok{border-color:var(--ok)}
.warn{color:var(--bad);font-size:.9rem}
table{width:100%;border-collapse:collapse;font-size:.95rem}
th,td{text-align:left;padding:.6rem .4rem;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--mut);font-weight:500;font-size:.85rem}
td.t a{font-weight:600}
.st{font-size:.8rem;padding:.1rem .45rem;border-radius:999px;border:1px solid var(--line);white-space:nowrap}
.st.pub{border-color:var(--ok);color:var(--ok)}
.d{white-space:nowrap;color:var(--mut);font-size:.85rem}
.acts{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.3rem}
.acts a,.acts button{font-size:.85rem;min-height:36px;padding:0 .7rem}
@media(max-width:560px){thead{display:none}table,tbody,tr,td{display:block;width:100%}tr{border-bottom:1px solid var(--line);padding:.5rem 0}td{border:0;padding:.15rem 0}}
form.write label{display:block;font-weight:600;margin:1rem 0 .3rem}
form.write .hint{display:block;font-weight:400;color:var(--mut);font-size:.85rem}
form.write input[type=text],form.write select,form.write textarea{width:100%;font:inherit;color:var(--fg);background:var(--card);border:1px solid var(--line);border-radius:.5rem;padding:.6rem .7rem;min-height:44px}
form.write textarea{min-height:22rem;line-height:1.7}
.bar{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.2rem}
.preview{border:1px dashed var(--accent);border-radius:.75rem;padding:1rem;margin:0 0 1.5rem}
.preview .kick{color:var(--accent);font-size:.85rem;margin:0}
.preview h1{font-size:1.5rem;margin:.3rem 0}
.preview .lead{color:var(--mut);margin:0 0 .4rem}
.preview .meta{color:var(--mut);font-size:.85rem}
.preview .body p{margin:0 0 1rem}
.preview .body h2{font-size:1.15rem;margin:1.4rem 0 .5rem}
.rules{color:var(--mut);font-size:.85rem;border-top:1px solid var(--line);margin-top:1.5rem;padding-top:.8rem}
.rules code{background:var(--card);padding:0 .25rem;border-radius:.25rem}
</style></head><body><div class="wrap">${안}</div></body></html>`;
}

const 상태글 = (s) => (s === 'published' ? '<span class="st pub">공개</span>' : '<span class="st">임시저장</span>');

function 저장소알림() {
  return remoteEnabled
    ? ''
    : '<p class="msg bad">⚠ 지금 이 서버는 원격 저장소(R2)에 연결돼 있지 않습니다. 여기서 저장한 글은 이 컴퓨터에만 남고, 실제 사이트에는 나가지 않습니다.</p>';
}

function 목록화면(글들, 알림 = '') {
  const 줄 = C.최신순(글들).map((g) => `<tr>
<td class="t"><a href="/admin/column/edit/${esc(g.id)}">${esc(g.title)}</a>
<div class="acts">
<a class="btn" href="/admin/column/edit/${esc(g.id)}">수정</a>
<a class="btn" href="/admin/column/preview/${esc(g.id)}">미리보기</a>
${g.status === 'published' ? `<a class="btn" href="${esc(C.글주소(g.slug))}" target="_blank" rel="noopener">사이트에서 보기</a>` : ''}
<form method="post" action="/admin/column/delete" onsubmit="return confirm('이 칼럼을 삭제할까요? 되돌릴 수 없습니다.')">
<input type="hidden" name="t" value="${확인값()}"><input type="hidden" name="id" value="${esc(g.id)}">
<button class="btn bad" type="submit">삭제</button></form>
</div></td>
<td>${상태글(g.status)}</td>
<td class="d">${esc(C.날짜만(g.createdAt))}</td>
</tr>`).join('');
  return 화면('백년지도 칼럼 · 편집국', `
<div class="top"><h1>백년지도 칼럼</h1><a class="btn main" href="/admin/column/new">글쓰기</a></div>
<p class="d"><a href="/admin">← 편집국</a> · <a href="/column" target="_blank" rel="noopener">칼럼 목록 보기(백년지도에서 열기)</a></p>
${저장소알림()}${알림}
${글들.length
    ? `<table><thead><tr><th>제목</th><th>상태</th><th>작성일</th></tr></thead><tbody>${줄}</tbody></table>`
    : '<p class="msg">아직 쓴 칼럼이 없습니다. 「글쓰기」를 눌러 첫 칼럼을 써 주십시오.</p>'}
<div class="rules">필자는 모두 「${esc(C.필자)}」로 나갑니다. 「공개」한 글은 백년지도 첫 화면과 칼럼 목록에 바로 나옵니다.</div>`);
}

function 미리보기HTML(값) {
  return `<div class="preview">
<p class="kick">미리보기 — ${esc(C.코너이름)}</p>
<h1>${esc(값.title || '(제목 없음)')}</h1>
${값.subtitle ? `<p class="lead">${esc(값.subtitle)}</p>` : ''}
<p class="meta">글 ${esc(C.필자)} · ${esc(C.한글날짜(값.publishedAt || 값.createdAt || C.지금KST()))}</p>
<div class="body">${C.본문HTML(값.body)}</div>
</div>`;
}

function 쓰기화면({ id = '', 값 = {}, 오류 = [], 미리보기 = false, 공개됨 = false, 상태 = '' }) {
  return 화면(id ? '칼럼 수정 · 편집국' : '새 칼럼 · 편집국', `
<p class="d"><a href="/admin/column">← 칼럼 목록</a></p>
<h1>${id ? '칼럼 수정' : '새 칼럼 쓰기'}${상태 ? ` ${상태글(상태)}` : ''}</h1>
${저장소알림()}
${오류.length ? `<div class="msg bad">${오류.map((e) => `<div>${esc(e)}</div>`).join('')}</div>` : ''}
${미리보기 ? `<p class="msg">아래는 미리보기입니다. 아직 저장하지 않았습니다.</p>${미리보기HTML(값)}` : ''}
<form class="write" method="post" action="/admin/column/save">
<input type="hidden" name="t" value="${확인값()}">
<input type="hidden" name="id" value="${esc(id)}">
<label for="f-title">제목</label>
<input id="f-title" type="text" name="title" maxlength="${C.한도.제목}" required value="${esc(값.title)}">
<label for="f-sub">부제 <span class="hint">적지 않아도 됩니다</span></label>
<input id="f-sub" type="text" name="subtitle" maxlength="${C.한도.부제}" value="${esc(값.subtitle)}">
<label for="f-body">본문 <span class="hint">빈 줄로 문단을 나눕니다 · **굵게** · [글자](주소)로 링크 · 「## 」로 시작하는 줄은 소제목</span></label>
<textarea id="f-body" name="body" maxlength="${C.한도.본문}" required>${esc(값.body)}</textarea>
<label for="f-slug">주소 <span class="hint">비워 두면 제목으로 만듭니다. 한 번 공개한 글은 주소가 바뀌지 않습니다</span></label>
<input id="f-slug" type="text" name="slug" maxlength="${C.한도.주소}" value="${esc(값.slug)}"${공개됨 ? ' readonly' : ''} placeholder="예: 서른둘에-결혼한다는-것">
<div class="bar">
<button class="btn main" type="submit" name="action" value="publish">공개</button>
<button class="btn" type="submit" name="action" value="draft">임시저장</button>
<button class="btn" type="submit" name="action" value="preview" formnovalidate>미리보기</button>
<a class="btn" href="/admin/column">취소</a>
</div>
</form>
<div class="rules">「공개」를 누르면 바로 사이트에 나갑니다. 「임시저장」은 편집국에서만 보입니다(공개한 글을 임시저장하면 사이트에서 내려갑니다). 필자는 「${esc(C.필자)}」로 나갑니다.</div>`);
}

/* ══ 처리 ══════════════════════════════════════════════════════════ */

/**
 * /admin/column 아래 요청을 처리한다. 돌려주는 것: { status, headers, body }
 * ⚠ 로그인 확인은 부르는 쪽(server.mjs)이 이미 했다.
 */
export async function 칼럼편집국(req, pathname) {
  const html = (status, body) => ({ status, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body });
  const 가라 = (loc) => ({ status: 303, headers: { Location: loc }, body: '' });
  const 못읽음 = (e) => html(503, 화면('저장소 오류 · 편집국', `<p class="msg bad">칼럼 목록을 읽지 못했습니다. 잠시 뒤 다시 열어 주십시오.<br><span class="d">${esc(String(e?.message ?? e).slice(0, 200))}</span></p><p><a href="/admin/column">다시 열기</a></p>`));

  if (req.method === 'POST') {
    if (!같은곳인가(req.headers)) {
      return html(403, 화면('막힘 · 편집국', '<p class="msg bad">다른 곳에서 보낸 요청이라 받지 않았습니다. 편집국 화면에서 다시 해 주십시오.</p><p><a href="/admin/column">칼럼 목록</a></p>'));
    }
    const 날것 = await 본문읽기(req);
    if (날것 == null) {
      const r = html(413, 화면('너무 큼 · 편집국', '<p class="msg bad">보낸 글이 너무 큽니다(256KB 까지).</p><p><a href="/admin/column">칼럼 목록</a></p>'));
      r.headers.Connection = 'close';
      return r;
    }
    const f = new URLSearchParams(날것);
    const id = String(f.get('id') ?? '').trim();

    if (pathname === '/admin/column/delete') {
      if (!확인값맞나(f.get('t'))) return html(403, 화면('막힘 · 편집국', '<p class="msg bad">화면이 오래돼 확인값이 맞지 않습니다. 목록을 다시 열고 해 주십시오.</p><p><a href="/admin/column">칼럼 목록</a></p>'));
      try {
        await C.지우기(id);
      } catch (e) {
        if (e.code === 404) return 가라('/admin/column');
        return 못읽음(e);
      }
      return 가라('/admin/column?done=deleted');
    }

    if (pathname === '/admin/column/save') {
      const 동작 = String(f.get('action') ?? 'draft');
      const 입력 = { title: f.get('title'), subtitle: f.get('subtitle'), slug: f.get('slug'), body: f.get('body') };
      let 기존 = null;
      if (id) {
        try { 기존 = await C.글읽기(id); } catch (e) { return 못읽음(e); }
        if (!기존) return html(404, 화면('없는 글 · 편집국', '<p class="msg bad">없는 글입니다.</p><p><a href="/admin/column">칼럼 목록</a></p>'));
      }
      const { 값, 오류 } = C.검사(입력);
      const 공개됨 = Boolean(기존?.publishedAt);
      if (공개됨) 값.slug = 기존.slug;
      const 다시 = (extra = [], status = 400) => html(status, 쓰기화면({ id, 값: { ...값, createdAt: 기존?.createdAt, publishedAt: 기존?.publishedAt }, 오류: [...오류, ...extra], 공개됨, 상태: 기존?.status }));
      if (동작 === 'preview') {
        return html(200, 쓰기화면({ id, 값: { ...값, createdAt: 기존?.createdAt, publishedAt: 기존?.publishedAt }, 미리보기: true, 공개됨, 상태: 기존?.status }));
      }
      if (!확인값맞나(f.get('t'))) return 다시(['화면이 오래돼 확인값이 맞지 않습니다. 아래 글은 그대로 있으니 한 번 더 눌러 주십시오.'], 403);
      if (오류.length) return 다시();
      try {
        const 글 = await C.저장({ id: id || null, 값, 공개: 동작 === 'publish' });
        return 가라(`/admin/column?done=${글.status === 'published' ? 'published' : 'draft'}&id=${글.id}`);
      } catch (e) {
        if (e.code === 409 || e.code === 404) return 다시([e.message], e.code);
        return 다시([`저장하지 못했습니다 — ${String(e?.message ?? e).slice(0, 200)}`], 503);
      }
    }
    return html(404, 화면('없는 곳 · 편집국', '<p>없는 곳입니다.</p>'));
  }

  /* ── GET ── */
  if (pathname === '/admin/column') {
    let 글들;
    try { 글들 = await C.목록읽기({ 새로: true }); } catch (e) { return 못읽음(e); }
    const done = new URL(req.url, 'http://x').searchParams.get('done');
    const 알림 = {
      published: '<p class="msg ok">공개했습니다. 백년지도 첫 화면과 칼럼 목록에 나옵니다.</p>',
      draft: '<p class="msg ok">임시저장했습니다. 사이트에는 나가지 않습니다.</p>',
      deleted: '<p class="msg ok">삭제했습니다.</p>',
    }[done] ?? '';
    return html(200, 목록화면(글들, 알림));
  }
  if (pathname === '/admin/column/new') return html(200, 쓰기화면({}));

  const m = pathname.match(/^\/admin\/column\/(edit|preview)\/([0-9a-f]{12})$/);
  if (m) {
    let 글;
    try { 글 = await C.글읽기(m[2]); } catch (e) { return 못읽음(e); }
    if (!글) return html(404, 화면('없는 글 · 편집국', '<p class="msg bad">없는 글입니다.</p><p><a href="/admin/column">칼럼 목록</a></p>'));
    if (m[1] === 'edit') return html(200, 쓰기화면({ id: 글.id, 값: 글, 공개됨: Boolean(글.publishedAt), 상태: 글.status }));
    return html(200, 화면('미리보기 · 편집국', `<p class="d"><a href="/admin/column">← 칼럼 목록</a> · <a href="/admin/column/edit/${esc(글.id)}">수정</a></p>
<p class="msg">${글.status === 'published' ? '공개 중인 글입니다.' : '임시저장한 글입니다. 사이트에는 나가지 않습니다.'}</p>${미리보기HTML(글)}`));
  }
  return html(404, 화면('없는 곳 · 편집국', '<p>없는 곳입니다.</p><p><a href="/admin/column">칼럼 목록</a></p>'));
}
