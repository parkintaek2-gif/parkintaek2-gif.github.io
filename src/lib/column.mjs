/**
 * 백년지도 칼럼 — 저장과 화면 만들기 (2026-10-31 · 1번)
 *
 * 사장님 원문 —
 *   「백년지도에 내가 칼럼을 쓸 수 있는 코너를 만들어라. 현재는 이름 아닌 백년지도라고 필자를 써.
 *     칼럼명은 [백년 칼럼] 또는 [백년지도 칼럼] 중에서 더 나은 걸 선택해. 콘텐트 위에서부터 1/3 지점에
 *     최근 칼럼을 노출해. 칼럼 카테고리도 만들어. 내가 글을 쓸 수 있는 cms를 게시판 식으로 만들어
 *     나와 너희만 접속 가능하게 만들어」
 *
 * ⭐ 이름은 「백년지도 칼럼」 — 사이트 이름이 그대로 들어가 무엇인지 바로 읽힌다.
 *   「백년 칼럼」은 「백 년 된 칼럼」으로도 읽혀 뜻이 흐리다.
 * ⭐ 필자는 「백년지도」 하나뿐이다(지금은 사람 이름을 쓰지 않는다).
 *
 * ── 어디에 두나 ────────────────────────────────────────────────────
 *   R2(store.mjs)가 정본이다. git 에도, 컨테이너 디스크에도 두지 않는다.
 *     100y/columns/index.json          목록(제목·상태·날짜 — 본문 없음)
 *     100y/columns/posts/<id>.json     글 하나(본문 포함)
 *   ⛔ store.put() 을 그냥 쓰지 않는다 — R2 가 실패해도 던지지 않는 설계라, 삼키면
 *     「저장했다」고 답하고 다음 재배포에 글이 사라진다. accounts.mjs 와 같은 원칙으로
 *     원격이 켜져 있는데 실패하면 «던지고», 먼저 써 둔 로컬 사본도 되돌린다.
 *
 * ── 본문 규칙 ──────────────────────────────────────────────────────
 *   빈 줄 = 문단 · 줄바꿈 = 줄바꿈 · **굵게** · [글자](주소) · 「## 」로 시작하는 줄 = 소제목
 *   ⛔ 그 밖의 것은 전부 글자 그대로 찍는다(HTML 을 받지 않는다). 주소는 http(s) 와
 *     우리 사이트 안 주소(/로 시작)만 받는다 — javascript: 같은 것은 링크가 되지 않는다.
 *
 * ⚠ 이 파일을 시험할 때 — store.mjs 는 .env 를 스스로 읽어 R2 로 나간다.
 *   ARCHIVE_S3_BUCKET 을 빈 값으로 덮고 ARCHIVE_DIR 을 임시 폴더로 둔 뒤 불러온다
 *   (scripts/check-100y-column.mjs 가 그렇게 한다).
 */
import { randomBytes } from 'node:crypto';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import * as Store from './store.mjs';

export const 코너이름 = '백년지도 칼럼';
export const 필자 = '백년지도';
export const ORIGIN = 'https://100yearmap.com';

/**
 * 🔴 [2026-10-31 · 사장님] 「칼럼 카테고리 없애. 내 맘대로 쓸거야.」
 *   카테고리를 두지 않는다 — 고르는 칸도, 목록의 갈래 단추도, 글 위의 갈래 이름도 없다.
 *   ⚠ 예전에 저장된 글에 category 값이 남아 있어도 화면에는 쓰지 않는다.
 */

export const 한도 = { 제목: 120, 부제: 200, 본문: 50_000, 주소: 80 };

const 목록열쇠 = '100y/columns/index.json';
const 글열쇠 = (id) => `100y/columns/posts/${id}.json`;

/* ══ 글자 다루기 ══════════════════════════════════════════════════════ */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 링크로 받아도 되는 주소인가. 되면 다듬은 주소, 안 되면 null */
export function 안전주소(raw) {
  const u = String(raw ?? '').trim();
  if (/^https?:\/\//i.test(u)) {
    try {
      const p = new URL(u);
      return p.protocol === 'http:' || p.protocol === 'https:' ? p.href : null;
    } catch {
      return null;
    }
  }
  /* 우리 사이트 안 주소 — `//남의주소` 와 `/\남의주소` 는 밖으로 나가므로 막는다 */
  if (/^\/(?![/\\])[^\s]*$/.test(u)) return u;
  return null;
}

/** 이미 이스케이프된 글자에서 **굵게** 만 살린다 */
const 굵게 = (escaped) => escaped.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');

function 인라인(s) {
  let out = '';
  let last = 0;
  const re = /\[([^\]\n]{1,200})\]\(([^)\s]{1,500})\)/g;
  for (const m of s.matchAll(re)) {
    out += 굵게(esc(s.slice(last, m.index)));
    const url = 안전주소(m[2]);
    if (url) {
      const 밖 = /^https?:/i.test(url);
      out += `<a href="${esc(url)}"${밖 ? ' rel="noopener"' : ''}>${굵게(esc(m[1]))}</a>`;
    } else {
      out += 굵게(esc(m[0]));
    }
    last = m.index + m[0].length;
  }
  out += 굵게(esc(s.slice(last)));
  return out;
}

/** 본문(쉬운 표기) → HTML. 받은 HTML 은 전부 글자로 찍힌다 */
export function 본문HTML(글) {
  const 전체 = String(글 ?? '').replace(/\r\n?/g, '\n').trim();
  if (!전체) return '';
  const out = [];
  for (const 덩어리 of 전체.split(/\n\s*\n/)) {
    const 줄들 = 덩어리.split('\n').map((x) => x.trim()).filter(Boolean);
    if (!줄들.length) continue;
    const h = 줄들[0].match(/^##\s+(.+)$/);
    if (h) {
      out.push(`<h2>${인라인(h[1])}</h2>`);
      줄들.shift();
      if (!줄들.length) continue;
    }
    out.push(`<p>${줄들.map(인라인).join('<br>')}</p>`);
  }
  return out.join('\n');
}

/** 꾸밈표를 걷은 맨글자 — 설명문·요약에 쓴다 */
export function 맨글자(글) {
  return String(글 ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/^##\s+/gm, '')
    .replace(/\[([^\]\n]{1,200})\]\(([^)\s]{1,500})\)/g, '$1')
    .replace(/\*\*([^*\n]+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function 줄임(s, n) {
  const t = String(s ?? '');
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}

/* ══ 주소(slug) ══════════════════════════════════════════════════════ */

const 주소꼴 = /^[가-힣a-z0-9]+(?:-[가-힣a-z0-9]+)*$/;
export const 주소맞나 = (s) => typeof s === 'string' && s.length <= 한도.주소 && 주소꼴.test(s);

/** 제목에서 주소를 만든다 — 한글·영문 소문자·숫자만 남기고 나머지는 줄표 하나로 */
export function 주소만들기(제목, 있는주소 = []) {
  let s = String(제목 ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^가-힣a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '');
  if (!s) s = 'column';
  const 쓴것 = new Set(있는주소);
  if (!쓴것.has(s)) return s;
  for (let i = 2; i < 1000; i++) if (!쓴것.has(`${s}-${i}`)) return `${s}-${i}`;
  return `${s}-${randomBytes(3).toString('hex')}`;
}

/* ══ 날짜 — 기계 시간대와 상관없이 한국시간으로 ══════════════════════ */

export function 지금KST(날 = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(날).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}+09:00`;
}
export const 날짜만 = (iso) => String(iso ?? '').slice(0, 10);
export function 한글날짜(iso) {
  const m = String(iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[1])}년 ${Number(m[2])}월 ${Number(m[3])}일` : '';
}

/* ══ 입력 검사 ══════════════════════════════════════════════════════ */

/**
 * 편집국에서 받은 값을 검사한다. 돌려주는 것: { 값, 오류: [] }
 * ⛔ 길이를 넘으면 자르지 않고 오류로 돌려보낸다 — 몰래 잘린 글이 나가면 안 된다.
 */
export function 검사(입력) {
  const 오류 = [];
  const 값 = {
    title: String(입력?.title ?? '').replace(/\s+/g, ' ').trim(),
    subtitle: String(입력?.subtitle ?? '').replace(/\s+/g, ' ').trim(),
    slug: String(입력?.slug ?? '').trim().toLowerCase(),
    body: String(입력?.body ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim(),
  };
  if (!값.title) 오류.push('제목을 적어 주십시오.');
  if (값.title.length > 한도.제목) 오류.push(`제목은 ${한도.제목}자까지입니다(지금 ${값.title.length}자).`);
  if (값.subtitle.length > 한도.부제) 오류.push(`부제는 ${한도.부제}자까지입니다(지금 ${값.subtitle.length}자).`);
  if (!값.body) 오류.push('본문을 적어 주십시오.');
  if (값.body.length > 한도.본문) 오류.push(`본문은 ${한도.본문.toLocaleString()}자까지입니다(지금 ${값.body.length.toLocaleString()}자).`);
  if (값.slug && !주소맞나(값.slug)) 오류.push('주소는 한글·영문 소문자·숫자와 줄표(-)만 쓸 수 있습니다.');
  return { 값, 오류 };
}

/* ══ 저장소 ══════════════════════════════════════════════════════════ */

const 로컬경로 = (key) => path.join(Store.localDir(), key);

/** R2 가 켜져 있는데 실패하면 로컬 사본을 되돌리고 던진다 */
async function 확정저장(key, obj) {
  let 이전 = null;
  try { 이전 = await readFile(로컬경로(key)); } catch { /* 없던 것 */ }
  const out = await Store.put(key, Buffer.from(JSON.stringify(obj, null, 1)), 'application/json; charset=utf-8');
  if (Store.remoteEnabled && out.remoteError) {
    try {
      if (이전) await writeFile(로컬경로(key), 이전);
      else await rm(로컬경로(key), { force: true });
    } catch { /* 되돌리기 실패는 아래 오류에 묻힌다 */ }
    throw new Error(`R2 저장에 실패했습니다 — 저장하지 않은 것으로 봅니다 (${String(out.remoteError).slice(0, 200)})`);
  }
}

async function JSON읽기(key) {
  const buf = await Store.get(key);
  if (!buf) return null;
  /* ⛔ 깨진 목록을 빈 목록으로 읽지 않는다 — 그 위에 저장하면 글이 통째로 사라진다 */
  return JSON.parse(buf.toString('utf8'));
}

let 목록캐시 = null;   // { 글들, 언제 }
const 캐시ms = 30_000;

/** 목록 전체(임시저장 포함). 못 읽으면 던진다 */
export async function 목록읽기({ 새로 = false } = {}) {
  if (!새로 && 목록캐시 && Date.now() - 목록캐시.언제 < 캐시ms) return 목록캐시.글들;
  const j = await JSON읽기(목록열쇠);
  const 글들 = Array.isArray(j?.columns) ? j.columns : [];
  목록캐시 = { 글들, 언제: Date.now() };
  return 글들;
}

/**
 * 손님 화면용 — 공개 글만, 새 글이 먼저. **던지지 않는다.**
 * 오래 걸리면(기본 2.5초) 지난 목록을 쓰고, 그것도 없으면 null(=못 읽음).
 * ⚠ null 과 [] 는 다르다 — null 은 「못 읽었다」, [] 는 「아직 없다」.
 */
export async function 공개목록({ 기다림ms = 2500 } = {}) {
  try {
    const 글들 = await Promise.race([
      목록읽기(),
      new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 기다림ms).unref?.()),
    ]);
    return 공개만(글들);
  } catch (e) {
    console.error('[column] 목록을 못 읽었다 —', e?.message ?? e);
    return 목록캐시 ? 공개만(목록캐시.글들) : null;
  }
}

export const 공개만 = (글들) =>
  (글들 ?? [])
    .filter((g) => g && g.status === 'published')
    .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)));

export const 최신순 = (글들) =>
  [...(글들 ?? [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

export async function 글읽기(id) {
  if (!/^[0-9a-f]{12}$/.test(String(id ?? ''))) return null;
  return JSON읽기(글열쇠(id));
}

/** 공개 글 하나를 주소로 찾는다(목록 → 글). 없으면 null. 못 읽으면 던진다 */
export async function 공개글찾기(slug) {
  const 글들 = await 목록읽기();
  const 머리 = 글들.find((g) => g.slug === slug && g.status === 'published');
  if (!머리) return null;
  const 글 = await 글읽기(머리.id);
  return 글 && 글.status === 'published' ? 글 : null;
}

/* 저장은 한 번에 하나씩 — 두 저장이 겹쳐 목록이 서로를 덮지 않게 */
let 줄 = Promise.resolve();
const 차례로 = (fn) => {
  const p = 줄.then(fn, fn);
  줄 = p.catch(() => {});
  return p;
};

const 목록줄 = (g) => ({
  id: g.id, slug: g.slug, title: g.title, subtitle: g.subtitle,
  author: g.author, status: g.status, createdAt: g.createdAt, updatedAt: g.updatedAt,
  publishedAt: g.publishedAt ?? null,
});

/**
 * 저장한다. { id?, 값(검사 통과한 것), 공개: bool } → 저장된 글
 * ⚠ 한 번이라도 공개한 글은 주소를 바꾸지 않는다 — 밖에 퍼진 링크가 깨진다.
 */
export function 저장({ id = null, 값, 공개 }) {
  return 차례로(async () => {
    const 글들 = await 목록읽기({ 새로: true });
    const 지금 = 지금KST();
    let 기존 = null;
    if (id) {
      기존 = await 글읽기(id);
      if (!기존) { const e = new Error('없는 글입니다.'); e.code = 404; throw e; }
    }
    const 남의주소 = 글들.filter((g) => g.id !== id).map((g) => g.slug);
    let slug;
    if (기존?.publishedAt) slug = 기존.slug;
    else if (값.slug) {
      if (남의주소.includes(값.slug)) { const e = new Error('이미 다른 글이 쓰는 주소입니다.'); e.code = 409; throw e; }
      slug = 값.slug;
    } else slug = 기존?.slug ?? 주소만들기(값.title, 남의주소);

    const 글 = {
      id: 기존?.id ?? randomBytes(6).toString('hex'),
      slug,
      title: 값.title,
      subtitle: 값.subtitle,
      author: 필자,
      body: 값.body,
      status: 공개 ? 'published' : 'draft',
      createdAt: 기존?.createdAt ?? 지금,
      updatedAt: 지금,
      publishedAt: 기존?.publishedAt ?? (공개 ? 지금 : null),
    };
    await 확정저장(글열쇠(글.id), 글);
    const 새목록 = [...글들.filter((g) => g.id !== 글.id), 목록줄(글)];
    await 확정저장(목록열쇠, { updatedAt: 지금, columns: 새목록 });
    목록캐시 = { 글들: 새목록, 언제: Date.now() };
    return 글;
  });
}

/** 지운다 — 목록에서 먼저 빼고 글을 지운다(반대 순서면 목록에 유령이 남는다) */
export function 지우기(id) {
  return 차례로(async () => {
    const 글들 = await 목록읽기({ 새로: true });
    if (!글들.some((g) => g.id === id)) { const e = new Error('없는 글입니다.'); e.code = 404; throw e; }
    const 새목록 = 글들.filter((g) => g.id !== id);
    await 확정저장(목록열쇠, { updatedAt: 지금KST(), columns: 새목록 });
    목록캐시 = { 글들: 새목록, 언제: Date.now() };
    const out = await Store.del(글열쇠(id));
    if (out.remoteError) console.error('[column] 글 파일 지우기 일부 실패(목록에서는 빠짐) —', out.remoteError);
    return true;
  });
}

/* ══ 손님 화면 ══════════════════════════════════════════════════════ */

export const 글주소 = (slug) => `/column/${encodeURIComponent(slug)}`;
export const 목록주소 = () => '/column';

/** 홈 1/3 지점에 들어갈 최근 칼럼. 글이 없으면 빈 글자(빈 상자를 안 그린다) */
export function 홈칼럼HTML(공개글들, 몇 = 3) {
  const 글들 = (공개글들 ?? []).slice(0, 몇);
  if (!글들.length) return '';
  const 줄 = 글들.map((g) => `<li><a href="${esc(글주소(g.slug))}"><strong class="hc-title">${esc(g.title)}</strong>${g.subtitle ? `<span class="hc-sub">${esc(g.subtitle)}</span>` : ''}<span class="hc-date">${esc(한글날짜(g.publishedAt || g.createdAt))}</span></a></li>`).join('');
  return `<section class="home-columns" aria-labelledby="home-columns-h">
<style>
.home-columns{margin:1.75rem 0 1.5rem;padding:1.1rem 1.1rem .6rem;border:1px solid var(--line);border-radius:.75rem;background:var(--card,transparent)}
.home-columns h2{margin:0 0 .6rem}
.home-columns ul{list-style:none;margin:0;padding:0}
.home-columns li{border-top:1px solid var(--line)}
.home-columns li:first-child{border-top:0}
.home-columns a{display:block;padding:.7rem 0;text-decoration:none;color:inherit;min-height:44px}
.home-columns .hc-title{display:block;font-family:var(--serif,inherit);font-size:1.05rem;line-height:1.4;word-break:keep-all}
.home-columns .hc-sub{display:block;font-size:var(--fs-note,13px);color:var(--muted);word-break:keep-all}
.home-columns .hc-date{display:block;font-size:var(--fs-note,13px);color:var(--muted)}
.home-columns .hc-more{margin:.4rem 0 .5rem;font-size:var(--fs-note,13px)}
.home-columns .hc-more a{display:inline;padding:0;min-height:0;text-decoration:underline}
</style>
<h2 id="home-columns-h">백년지도 칼럼</h2>
<ul>${줄}</ul>
<p class="hc-more"><a href="/column">칼럼 전체 보기 →</a></p>
</section>`;
}

/** 목록 화면 안쪽 */
export function 목록본문HTML(공개글들) {
  const 글들 = 공개글들;
  const 줄 = 글들
    .map((g) => `<li><a href="${esc(글주소(g.slug))}"><strong class="col-title">${esc(g.title)}</strong>${g.subtitle ? `<span class="col-sub">${esc(g.subtitle)}</span>` : ''}<span class="col-date">${esc(한글날짜(g.publishedAt || g.createdAt))} · 글 ${esc(g.author || 필자)}</span></a></li>`)
    .join('');
  const 빈말 = '<p class="note">아직 실린 칼럼이 없습니다.</p>';
  return `<p class="col-kicker">${esc(코너이름)}</p>
<h1>${esc(코너이름)}</h1>
<p class="lead">0세부터 100세까지, 숫자 뒤에 있는 이야기를 백년지도가 씁니다.</p>
${줄 ? `<ul class="col-list">${줄}</ul>` : 빈말}
<p class="col-foot">칼럼은 백년지도의 생각입니다. 길을 정하는 것은 읽는 분입니다.</p>`;
}

/** 글 화면 안쪽 */
export function 글본문HTML(글, 다른글들 = []) {
  const 날 = 글.publishedAt || 글.createdAt;
  const 고친날 = 날짜만(글.updatedAt) !== 날짜만(날) ? ` · 고친 날 <time datetime="${esc(글.updatedAt)}">${esc(한글날짜(글.updatedAt))}</time>` : '';
  const 더 = 다른글들.filter((g) => g.id !== 글.id).slice(0, 3);
  return `<p class="col-kicker"><a href="/column">${esc(코너이름)}</a></p>
<h1>${esc(글.title)}</h1>
${글.subtitle ? `<p class="lead">${esc(글.subtitle)}</p>` : ''}
<p class="col-meta">글 ${esc(글.author || 필자)} · <time datetime="${esc(날)}">${esc(한글날짜(날))}</time>${고친날}</p>
<div class="col-body">
${본문HTML(글.body)}
</div>
<p class="col-foot">칼럼은 백년지도의 생각입니다. 길을 정하는 것은 읽는 분입니다.</p>
${더.length ? `<h2 class="col-more-h">다른 칼럼</h2><ul class="col-list">${더.map((g) => `<li><a href="${esc(글주소(g.slug))}"><strong class="col-title">${esc(g.title)}</strong></a></li>`).join('')}</ul>` : ''}
<p class="note"><a href="/column">칼럼 목록으로 →</a></p>`;
}

/** 글 하나의 구조화 자료 — 필자는 사람이 아니라 단체(백년지도) */
export function 글jsonLd(글) {
  const url = ORIGIN + 글주소(글.slug);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 줄임(글.title, 110),
    description: 글설명(글),
    inLanguage: 'ko',
    articleSection: 코너이름,
    datePublished: 글.publishedAt || 글.createdAt,
    dateModified: 글.updatedAt,
    mainEntityOfPage: url,
    url,
    image: `${ORIGIN}/og.png`,
    author: { '@type': 'Organization', name: 필자, url: ORIGIN },
    publisher: { '@type': 'Organization', name: '백년지도', url: ORIGIN, logo: { '@type': 'ImageObject', url: `${ORIGIN}/apple-touch-icon.png` } },
    isPartOf: { '@type': 'CollectionPage', name: 코너이름, url: `${ORIGIN}/column` },
  };
}

export const 글설명 = (글) => 줄임(글.subtitle || 맨글자(글.body), 150);

/** JSON 을 <script> 안에 넣을 때 </script> 로 빠져나가지 못하게 */
export const 스크립트안JSON = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

/**
 * 빌드된 dist/100y/column.html(껍데기)에 이 화면의 머리와 본문을 채운다.
 * 껍데기 표시를 못 찾으면 null — 부르는 쪽이 대신할 화면을 낸다.
 */
export function 껍데기채우기(껍데기, { 제목, 설명, 주소, 종류 = 'website', jsonLd, 본문, 덧머리 = '' }) {
  const 시작 = 껍데기.search(/<section class="column-page"[^>]*>/);
  if (시작 < 0) return null;
  const 여는끝 = 껍데기.indexOf('>', 시작) + 1;
  const 닫는 = 껍데기.indexOf('</section>', 여는끝);
  if (닫는 < 0) return null;
  const 원래주소 = `${ORIGIN}/column`;
  const 전체제목 = `${제목} — 백년지도`;
  /* 사람이 읽는 자리(인용 문장·인쇄 주소)에는 한글 그대로 — %EC%8B… 로 찍으면 폰에서 화면 밖으로 밀린다
     (2026-10-31 390px 에서 가로 499px 로 넘친 것을 보고 고쳤다) */
  let 보이는주소 = 주소;
  try { 보이는주소 = decodeURI(주소); } catch { /* 그대로 */ }
  let h = 껍데기.slice(0, 여는끝) + 본문 + 껍데기.slice(닫는);
  h = h
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(전체제목)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(설명)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(전체제목)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(설명)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${esc(종류)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(주소)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(주소)}$2`)
    .replace(/(<span class="cite-line">)[^<]*(<\/span>)/, () => `<span class="cite-line">${esc(`100 Year Map, ${제목}, 2026, ${보이는주소}`)}</span>`)
    .replace(/(<p class="printurl">)[^<]*(<\/p>)/, () => `<p class="printurl">${esc(`이 페이지 — ${보이는주소}`)}</p>`);
  if (jsonLd) {
    const 스크립트 = `<script type="application/ld+json">${스크립트안JSON(jsonLd)}</script>`;
    h = /<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(h)
      ? h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => 스크립트)
      : h.replace('</head>', () => `${스크립트}</head>`);
  }
  if (덧머리) h = h.replace('</head>', () => `${덧머리}</head>`);
  /* 껍데기의 원래 주소가 다른 자리에 남았으면(꼬리말 등) 이 화면 주소로 */
  if (주소 !== 원래주소) h = h.split(`${원래주소}"`).join(`${esc(주소)}"`);
  return h;
}

/** 홈 HTML 의 자리 표시를 최근 칼럼으로 바꾼다. 글이 없으면 자리 표시만 지운다 */
export function 홈채우기(홈, 공개글들) {
  return 홈.replace(/<div data-slot="home-columns"[^>]*><\/div>/, () => 홈칼럼HTML(공개글들));
}

/** 정적 사이트맵에 공개 칼럼 주소를 더한다 */
export function 사이트맵더하기(xml, 공개글들) {
  if (!공개글들?.length || !xml.includes('</urlset>')) return xml;
  const 줄 = 공개글들
    .map((g) => `<url><loc>${esc(ORIGIN + 글주소(g.slug))}</loc><lastmod>${esc(날짜만(g.updatedAt))}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
    .join('');
  return xml.replace('</urlset>', () => `${줄}</urlset>`);
}
