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

  async function 목록가져오기(page) {
    const r = await fetch('/api/comments?page=' + encodeURIComponent(page), { method: 'GET' });
    const j = await r.json().catch(() => ({ ok: false }));
    return j.ok ? j.comments : [];
  }

  function renderList(listEl, comments) {
    if (!comments.length) {
      listEl.innerHTML = '<p class="cw-empty">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</p>';
      return;
    }
    listEl.innerHTML = comments.map(function (c) {
      return '<div class="cw-item">' +
        '<div class="cw-meta"><b>' + esc(c.name) + '</b> · <time>' + esc(fmt(c.at)) + '</time></div>' +
        '<div class="cw-body">' + esc(c.body).replace(/\n/g, '<br>') + '</div>' +
        '</div>';
    }).join('');
  }

  function init(container) {
    const page = container.getAttribute('data-comments-page');
    if (!page) return;

    const openedAt = Date.now(); // 폼을 그린 시각. 너무 빠른 제출을 서버가 걸러내는 데 쓴다

    container.innerHTML =
      '<div class="cw-list" aria-live="polite">불러오는 중…</div>' +
      '<form class="cw-form">' +
      '<input class="cw-name" type="text" maxlength="40" placeholder="이름(선택, 비우면 \'손님\')">' +
      '<textarea class="cw-body" maxlength="2000" required placeholder="댓글을 남겨 주세요"></textarea>' +
      // 벌집: 사람 눈에는 안 보이지만 봇은 흔히 채운다
      '<input class="cw-website" type="text" name="website" autocomplete="off" tabindex="-1" ' +
      'style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">' +
      '<button class="cw-submit" type="submit">등록</button>' +
      '<p class="cw-msg" role="status"></p>' +
      '</form>';

    const listEl = container.querySelector('.cw-list');
    const formEl = container.querySelector('.cw-form');
    const msgEl = container.querySelector('.cw-msg');

    목록가져오기(page).then(function (c) { renderList(listEl, c); })
      .catch(function () { listEl.innerHTML = '<p class="cw-empty">댓글을 못 불러왔습니다.</p>'; });

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
          msgEl.textContent = j.why === '너무 빠른 제출'
            ? '잠시 후 다시 시도해 주세요.'
            : (j.why || '등록에 실패했습니다.');
        }
      } catch {
        msgEl.textContent = '등록에 실패했습니다. 잠시 후 다시 시도해 주세요.';
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
