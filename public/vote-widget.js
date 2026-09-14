/**
 * vote-widget.js — self-hosted "VS News" vote widget. English-only (K Culture Wire uses it
 * first; comments-widget.js already proved the same site-wide-shared-file pattern works).
 *
 * Usage:
 *   <div class="vote-widget"
 *        data-vote-poll="unique-poll-key"
 *        data-vote-choices='[{"id":"seonghyeon","label":"Seonghyeon"},{"id":"keonho","label":"Keonho"}]'>
 *   </div>
 *   <script src="/vote-widget.js" defer></script>
 *
 * No cookies, no localStorage identity, no IP is sent anywhere by this script. It does write
 * one localStorage flag per poll ("voted:<poll>") purely to soften repeat-clicking in the SAME
 * browser — that is an honor-system nudge, not server-enforced (see src/lib/votes.mjs header:
 * this is a straw poll, not a certified vote, precisely because we do not track identity).
 */
(function () {
  'use strict';

  var STYLE_ID = 'vote-widget-style';
  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '[data-vote-poll]{max-width:36rem;margin:1.5rem 0;padding:1rem 1.25rem;' +
      'border:1px solid rgba(127,127,127,.3);border-radius:.6rem;font:inherit}' +
      '.vw-buttons{display:flex;gap:.6rem;flex-wrap:wrap}' +
      '.vw-btn{flex:1 1 auto;min-width:8rem;padding:.6rem 1rem;font:inherit;font-weight:600;' +
      'border:1px solid currentColor;border-radius:.4rem;background:transparent;cursor:pointer}' +
      '.vw-btn:hover:not(:disabled){background:rgba(127,127,127,.12)}' +
      '.vw-btn:disabled{cursor:default;opacity:.55}' +
      '.vw-bars{display:flex;flex-direction:column;gap:.7rem;margin-top:.2rem}' +
      '.vw-bar-row.vw-mine .vw-bar-label{font-weight:700}' +
      '.vw-bar-label{display:flex;justify-content:space-between;font-size:.92em;margin-bottom:.25rem}' +
      '.vw-bar-track{height:.6rem;border-radius:.35rem;background:rgba(127,127,127,.18);overflow:hidden}' +
      '.vw-bar-fill{height:100%;background:currentColor;opacity:.65;transition:width .4s ease}' +
      '.vw-meta{font-size:.8em;opacity:.7;margin:.6rem 0 0}' +
      '.vw-msg{font-size:.85em;color:#c0392b;margin:.4rem 0 0;min-height:1em}';
    document.head.appendChild(style);
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function votedKey(poll) { return 'voted:' + poll; }

  async function fetchTally(poll, choiceIds) {
    var url = '/api/vote?poll=' + encodeURIComponent(poll) + '&choices=' + encodeURIComponent(choiceIds.join(','));
    var r = await fetch(url, { method: 'GET' });
    var j = await r.json().catch(function () { return { ok: false }; });
    return j.ok ? j.tally : { counts: {}, total: 0, updatedAt: null };
  }

  function renderBars(container, choices, tally, myChoiceId) {
    var barsEl = container.querySelector('.vw-bars');
    var total = tally.total || 0;
    barsEl.innerHTML = choices.map(function (c) {
      var count = (tally.counts && tally.counts[c.id]) || 0;
      var pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
      var mine = myChoiceId === c.id ? ' vw-mine' : '';
      return '<div class="vw-bar-row' + mine + '">' +
        '<div class="vw-bar-label"><span>' + esc(c.label) + (myChoiceId === c.id ? ' ✓' : '') + '</span>' +
        '<span class="vw-bar-pct">' + pct + '% (' + count + ')</span></div>' +
        '<div class="vw-bar-track"><div class="vw-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>';
    }).join('');
    var totalEl = container.querySelector('.vw-total');
    if (totalEl) totalEl.textContent = total === 1 ? '1 vote' : total + ' votes';
  }

  function init(container) {
    injectStyleOnce();
    var poll = container.getAttribute('data-vote-poll');
    var choicesRaw = container.getAttribute('data-vote-choices');
    if (!poll || !choicesRaw) return;
    var choices;
    try { choices = JSON.parse(choicesRaw); } catch { return; }
    if (!Array.isArray(choices) || choices.length < 2) return;
    var choiceIds = choices.map(function (c) { return c.id; });

    var openedAt = Date.now();
    var already = null;
    try { already = window.localStorage.getItem(votedKey(poll)); } catch {}

    container.innerHTML =
      '<div class="vw-buttons">' +
      choices.map(function (c) {
        return '<button type="button" class="vw-btn" data-choice="' + esc(c.id) + '">' + esc(c.label) + '</button>';
      }).join('') +
      '</div>' +
      '<div class="vw-bars" aria-live="polite"></div>' +
      '<p class="vw-meta"><span class="vw-total">—</span> · <span class="vw-note">Reader poll, not a certified count — live tally</span></p>' +
      '<p class="vw-msg" role="status"></p>';

    var buttonsEl = container.querySelector('.vw-buttons');
    var msgEl = container.querySelector('.vw-msg');

    function showResults(myChoiceId) {
      buttonsEl.style.display = 'none';
      fetchTally(poll, choiceIds).then(function (tally) {
        renderBars(container, choices, tally, myChoiceId);
      });
    }

    fetchTally(poll, choiceIds).then(function (tally) {
      renderBars(container, choices, tally, already);
      if (already) buttonsEl.style.display = 'none';
    });

    // Refresh periodically so the tally feels live even without a click.
    var refreshTimer = setInterval(function () {
      fetchTally(poll, choiceIds).then(function (tally) {
        renderBars(container, choices, tally, already);
      });
    }, 15000);
    window.addEventListener('beforeunload', function () { clearInterval(refreshTimer); });

    buttonsEl.querySelectorAll('.vw-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (already) return;
        var choice = btn.getAttribute('data-choice');
        buttonsEl.querySelectorAll('.vw-btn').forEach(function (b) { b.disabled = true; });
        try {
          var r = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ poll: poll, choices: choiceIds, choice: choice, openedAt: openedAt }),
          });
          var j = await r.json().catch(function () { return { ok: false }; });
          if (j.ok) {
            already = choice;
            try { window.localStorage.setItem(votedKey(poll), choice); } catch {}
            renderBars(container, choices, j.tally, already);
            buttonsEl.style.display = 'none';
          } else {
            msgEl.textContent = j.why === '너무 빠른 제출'
              ? 'Please wait a moment and try again.'
              : (j.why ? 'Could not record your vote.' : 'Could not record your vote.');
            buttonsEl.querySelectorAll('.vw-btn').forEach(function (b) { b.disabled = false; });
          }
        } catch {
          msgEl.textContent = 'Could not record your vote. Please try again.';
          buttonsEl.querySelectorAll('.vw-btn').forEach(function (b) { b.disabled = false; });
        }
      });
    });
  }

  function boot() {
    document.querySelectorAll('[data-vote-poll]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
