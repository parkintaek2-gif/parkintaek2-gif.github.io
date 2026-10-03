/**
 * comments-widget.js — 자체 댓글 위젯. 세 사이트(seoulmarkets·100yearmap·kculturewire) 공용.
 *
 * 쓰는 법:
 *   <script src="/comments-widget.js" defer></script>
 *   <div data-comments-page="고유페이지키"></div>
 *
 * ⚠ 쿠키·로컬저장소·IP 어느 것도 안 쓴다. 새로고침하면 서버에서 다시 받아온다 —
 *   그게 정책이다("쿠키·IP를 우리가 따로 남기지 않는다", 2026-08-05).
 * ⚠ page 키는 자유 문자열이면 된다 — 서버(comments.mjs)가 해시로 접어 저장하므로
 *   슬래시·한글이 들어 있어도 안전하다. 보통은 그 페이지의 canonical 경로를 쓰면 된다.
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmt(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  /*
   * 2026-10-03 — this widget is shared by three sites and every string in it was Korean.
   * That was fine while it only ran on seoulmarkets and 100yearmap. Today it went onto
   * 268 K Culture Wire pages, which are written in English for readers outside Korea,
   * and the box said "아직 댓글이 없습니다" under an English headline.
   * The screenshot caught it; the status code did not. A page tells us its language in
   * <html lang>, so read it from there instead of guessing. Korean stays the default,
   * because the two Korean sites were here first and nothing about them changes.
   */
  const 말 = {
    ko: {
      없다: '아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.',
      부르는중: '불러오는 중…',
      못불렀다: '댓글을 못 불러왔습니다.',
      이름자리: "이름(없으면 손님)",
      본문자리: '댓글을 남겨 주세요',
      등록: '등록',
      천천히: '잠시 후 다시 시도해 주세요.',
      실패: '등록에 실패했습니다.',
      실패다시: '등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    },
    en: {
      없다: 'No comments yet. Be the first to say something.',
      부르는중: 'Loading…',
      못불렀다: 'Could not load the comments.',
      이름자리: 'Your name (optional)',
      본문자리: 'Write a comment',
      등록: 'Post',
      천천히: 'Please try again in a moment.',
      실패: 'Could not post that.',
      실패다시: 'Could not post that. Please try again in a moment.',
    },
  };
  /* ⚠ ko-KR 도 ko 다. 앞 두 글자만 본다. 모르는 말이면 한국어로 둔다 — 전에 있던 동작 그대로 */
  const 글말 = (function () {
    try {
      const t = (document.documentElement.getAttribute('lang') || 'ko').slice(0, 2).toLowerCase();
      return 말[t] || 말.ko;
    } catch { return 말.ko; }
  })();

  async function 목록가져오기(page) {
    const r = await fetch('/api/comments?page=' + encodeURIComponent(page), { method: 'GET' });
    const j = await r.json().catch(() => ({ ok: false }));
    return j.ok ? j.comments : [];
  }

  function renderList(listEl, comments) {
    if (!comments.length) {
      listEl.innerHTML = '<p class="cw-empty">' + esc(글말.없다) + '</p>';
      return;
    }
    listEl.innerHTML = comments.map(function (c) {
      return '<div class="cw-item">' +
        '<div class="cw-meta"><b>' + esc(c.name) + '</b> · <time>' + esc(fmt(c.at)) + '</time></div>' +
        '<div class="cw-body">' + esc(c.body).replace(/\n/g, '<br>') + '</div>' +
        '</div>';
    }).join('');
  }

  /*
   * 2026-10-03 — the markup carried class names (cw-form, cw-name, cw-submit) that no
   * stylesheet anywhere defined, so the box rendered with raw browser defaults on all
   * three sites: a name field cut off mid-sentence, a textarea on its own line, a grey
   * button. Shipping the style with the widget keeps the three sites in step; a page
   * that wants its own look can still override these rules.
   * Colours come from currentColor and transparent fills, so the box follows whatever
   * the host page already decided about light and dark.
   */
  function 꾸밈한번() {
    if (document.getElementById('cw-style')) return;
    const el = document.createElement('style');
    el.id = 'cw-style';
    el.textContent = [
      '.cw-list{margin:0 0 14px}',
      '.cw-empty{opacity:.65;margin:0 0 14px}',
      '.cw-item{padding:12px 0;border-top:1px solid currentColor;border-color:color-mix(in srgb,currentColor 14%,transparent)}',
      '.cw-item:first-child{border-top:0}',
      '.cw-meta{font-size:.85em;opacity:.65;margin:0 0 4px}',
      '.cw-meta b{font-weight:600}',
      '.cw-form{display:grid;gap:8px;grid-template-columns:minmax(0,1fr);max-width:46rem}',
      '.cw-name,.cw-body{width:100%;font:inherit;font-size:.95em;padding:9px 11px;border-radius:8px;',
      'background:transparent;color:inherit;',
      'border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 28%,transparent)}',
      '.cw-body{min-height:5.5em;resize:vertical}',
      '.cw-name::placeholder,.cw-body::placeholder{opacity:.5;color:inherit}',
      '.cw-name:focus,.cw-body:focus{outline:2px solid currentColor;outline-offset:1px}',
      '.cw-submit{justify-self:start;font:inherit;font-size:.95em;font-weight:600;',
      'padding:9px 20px;border-radius:8px;cursor:pointer;background:transparent;color:inherit;',
      'border:1px solid currentColor;border-color:color-mix(in srgb,currentColor 40%,transparent)}',
      '.cw-submit:hover{background:color-mix(in srgb,currentColor 8%,transparent)}',
      '.cw-submit[disabled]{opacity:.5;cursor:default}',
      '.cw-msg{margin:0;font-size:.9em;opacity:.8}',
      '@media (min-width:560px){.cw-form{grid-template-columns:14rem minmax(0,1fr);align-items:start}',
      '.cw-body{grid-column:1/-1}}',
    ].join('');
    (document.head || document.documentElement).appendChild(el);
  }

  function init(container) {
    const page = container.getAttribute('data-comments-page');
    if (!page) return;
    꾸밈한번();

    const openedAt = Date.now(); // 폼을 그린 시각. 너무 빠른 제출을 서버가 걸러내는 데 쓴다

    container.innerHTML =
      '<div class="cw-list" aria-live="polite">' + esc(글말.부르는중) + '</div>' +
      '<form class="cw-form">' +
      '<input class="cw-name" type="text" maxlength="40" placeholder="' + esc(글말.이름자리) + '">' +
      '<textarea class="cw-body" maxlength="2000" required placeholder="' + esc(글말.본문자리) + '"></textarea>' +
      // 벌집: 사람 눈에는 안 보이지만 봇은 흔히 채운다
      '<input class="cw-website" type="text" name="website" autocomplete="off" tabindex="-1" ' +
      'style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">' +
      '<button class="cw-submit" type="submit">' + esc(글말.등록) + '</button>' +
      '<p class="cw-msg" role="status"></p>' +
      '</form>';

    const listEl = container.querySelector('.cw-list');
    const formEl = container.querySelector('.cw-form');
    const msgEl = container.querySelector('.cw-msg');

    목록가져오기(page).then(function (c) { renderList(listEl, c); })
      .catch(function () { listEl.innerHTML = '<p class="cw-empty">' + esc(글말.못불렀다) + '</p>'; });

    formEl.addEventListener('submit', async function (e) {
      e.preventDefault();
      msgEl.textContent = '';
      const body = formEl.querySelector('.cw-body').value.trim();
      if (!body) return;
      const submitBtn = formEl.querySelector('.cw-submit');
      submitBtn.disabled = true;
      try {
        const r = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: page,
            name: formEl.querySelector('.cw-name').value,
            body: body,
            website: formEl.querySelector('.cw-website').value,
            openedAt: openedAt,
          }),
        });
        const j = await r.json().catch(() => ({ ok: false }));
        if (j.ok) {
          formEl.querySelector('.cw-body').value = '';
          const 지금목록 = await 목록가져오기(page);
          renderList(listEl, 지금목록);
        } else {
          /* ⚠ 서버가 주는 까닭(j.why)은 한국어다. 영문 지면에는 그대로 내보내지 않는다 —
             우리 사정을 손님 화면에 적는 자리는 없다. 영문에서는 우리 말로 바꿔 적는다. */
          msgEl.textContent = j.why === '너무 빠른 제출'
            ? 글말.천천히
            : ((글말 === 말.ko && j.why) ? j.why : 글말.실패);
        }
      } catch {
        msgEl.textContent = 글말.실패다시;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function boot() {
    document.querySelectorAll('[data-comments-page]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
