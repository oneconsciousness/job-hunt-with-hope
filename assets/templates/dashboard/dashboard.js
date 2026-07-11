/* =============================================================================
 * dashboard.js — Hope Career Dashboard v2. Two pages, actions only.
 * SKILL GAPS: close these · your moat · the plan · build these.
 * JOBS: the board · do next.
 * Reads window.HOPE_DATA.target (same contract as v1 — renders less prose).
 * Deep-link a page with #gaps / #jobs.
 * ===========================================================================*/
(function () {
  'use strict';
  var DATA = window.HOPE_DATA || {};
  var T = DATA.target || {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function icon(n, fill) { return '<span class="material-symbols-rounded"' + (fill ? ' style="font-variation-settings:\'FILL\' 1"' : '') + '>' + esc(n) + '</span>'; }
  function head(num, title, hint) {
    return '<div class="block-head"><span class="block-num">' + esc(num) + '</span>' +
      '<span class="block-title">' + esc(title) + '</span>' +
      (hint ? '<span class="block-hint">' + esc(hint) + '</span>' : '') + '</div>';
  }

  /* ── THEME (shared key with the portfolio). ── */
  var KEY = 'hope-portfolio-theme';
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem(KEY, t); } catch (e) {} }
  var tg = el('theme-toggle');
  if (tg) tg.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ── HEADER + HERO. ── */
  (function () {
    var name = (DATA.meta && DATA.meta.name) || 'Career dashboard';
    document.title = name + ' — Career Dashboard';
    var initials = name.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
    var hid = el('head-id');
    if (hid) hid.innerHTML =
      '<img class="head-avatar" src="headshot.jpg" alt="" onerror="this.outerHTML=\'<span class=&quot;head-avatar-fb&quot;>' + esc(initials) + '</span>\'">' +
      '<span><span class="head-name">' + esc(name) + '</span><br><span class="head-sub">Career dashboard</span></span>';

    var pct = Math.max(0, Math.min(100, Number(T.readiness) || 0));
    var C = 2 * Math.PI * 46;
    var chips = ['<span class="chip live"><span class="dot"></span>Portfolio live</span>'];
    if (T.window) chips.push('<span class="chip">' + icon('event') + esc(T.window) + '</span>');
    if (T.comp) chips.push('<span class="chip">' + icon('payments') + esc(T.comp) + '</span>');
    var hero = el('hero');
    if (hero) {
      hero.innerHTML =
        '<div class="hero-main">' +
          '<span class="hero-eyebrow">' + icon('explore') + 'Where you’re headed</span>' +
          '<h1 class="hero-role">' + esc(T.role || 'Your next role') + '</h1>' +
          '<span class="hero-from">' + esc(T.from || 'today') + ' ' + icon('trending_flat') + ' ' + esc(T.role || '') + '</span>' +
          '<div class="hero-chips">' + chips.join('') + '</div>' +
        '</div>' +
        '<div class="gauge" role="img" aria-label="' + pct + '% ready">' +
          '<svg viewBox="0 0 104 104"><circle class="gauge-track" cx="52" cy="52" r="46"></circle>' +
          '<circle class="gauge-arc" id="g-arc" cx="52" cy="52" r="46" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"></circle></svg>' +
          '<div class="gauge-center"><span class="gauge-val">' + pct + '%</span><span class="gauge-lbl">ready</span></div>' +
        '</div>';
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        var a = el('g-arc'); if (a) a.style.strokeDashoffset = C * (1 - pct / 100);
      }); });
    }
  })();

  /* ── PAGE TABS (+ #gaps / #jobs deep link). ── */
  function activate(page) {
    document.querySelectorAll('.page-tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-page') === page); });
    document.querySelectorAll('.page').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-page') === page); });
  }
  document.querySelectorAll('.page-tab').forEach(function (b) {
    b.addEventListener('click', function () { activate(b.getAttribute('data-page')); });
  });
  if (location.hash === '#jobs') activate('jobs');

  /* ══ PAGE 1 · SKILL GAPS ══ */

  /* 1 · Close these */
  (function () {
    var host = el('blk-gaps');
    var rows = (T.matrix && T.matrix.gaps) || [];
    if (!host) return;
    function dots(cur, tgt) {
      var out = '';
      for (var i = 1; i <= 5; i++) out += '<span class="dot' + (i <= cur ? ' on' : (i === tgt ? ' tgt' : '')) + '"></span>';
      return '<span class="dots" role="img" aria-label="now ' + cur + ' of 5, role needs ' + tgt + '">' + out + '</span>';
    }
    host.innerHTML = head('01', 'Close these', rows.length + ' gaps') + rows.map(function (r) {
      var cur = Math.max(0, Math.min(5, Number(r.current) || 0));
      var tgt = Math.max(0, Math.min(5, Number(r.target) || 5));
      return '<div class="gap-row">' +
        '<span class="gap-skill">' + esc(r.skill) + (r.star ? '<span class="gap-star material-symbols-rounded" title="Opens the most doors">star</span>' : '') + '</span>' +
        dots(cur, tgt) +
        '<span class="gap-note">' + esc(r.note || '') + '</span>' +
      '</div>';
    }).join('');
  })();

  /* 2 · Your moat — what you already win on */
  (function () {
    var host = el('blk-moat');
    var rows = (T.matrix && T.matrix.moat) || [];
    if (!host) return;
    host.innerHTML = head('02', 'Already strong — lead with these', 'hover for why') +
      '<div class="moat-chips">' + rows.map(function (r) {
        return '<span class="moat-chip" title="' + esc(r.note || '') + '">' + icon('verified') + esc(r.skill) + '</span>';
      }).join('') + '</div>';
  })();

  /* 3 · The plan — numbered actions with phase dividers */
  (function () {
    var host = el('blk-plan');
    var phases = (T.plan && T.plan.phases) || [];
    if (!host) return;
    var IC = { done: 'check_circle', active: 'bolt', todo: 'radio_button_unchecked' };
    var n = 0, herePlaced = false, html = '';
    phases.forEach(function (p) {
      var clock = /market/i.test(p.clock || '')
        ? '<span class="pd-clock market">' + icon('hourglass_top') + 'market’s clock</span>'
        : '<span class="pd-clock yours">' + icon('bolt') + 'your clock</span>';
      html += '<div class="phase-divider"><span class="pd-label">' + esc(p.title || ('Phase ' + p.num)) + ' · ' + esc(p.window || '') + '</span>' + clock + '<span class="pd-rule"></span></div>';
      (p.moves || []).forEach(function (m) {
        n++;
        var here = '';
        if (m.status === 'active' && !herePlaced) { here = '<span class="tag here">You are here</span>'; herePlaced = true; }
        html += '<div class="act ' + esc(m.status || 'todo') + '">' +
          '<span class="act-num">' + String(n).padStart(2, '0') + '</span>' +
          '<span class="act-ic">' + icon(IC[m.status] || IC.todo) + '</span>' +
          '<span class="act-label">' + esc(m.label) +
            '<span class="act-tags">' + (m.closes ? '<span class="tag closes">' + esc(m.closes) + '</span>' : '') + here + '</span></span>' +
          '<span class="act-date">' + esc(m.date || '') + '</span>' +
        '</div>';
      });
    });
    host.innerHTML = head('03', 'The plan — do these in order', n + ' steps') + (html || '<div class="empty">' + icon('checklist') + 'No plan yet — run the gap check and Hope builds it with you.</div>');
  })();

  /* 4 · Build these — the proof artifacts, one line each */
  (function () {
    var host = el('blk-build');
    var rows = Array.isArray(T.projects) ? T.projects : [];
    if (!host) return;
    host.innerHTML = head('04', 'Build these', rows.length + ' artifacts') + (rows.length ? rows.map(function (p) {
      return '<div class="build-row">' +
        '<span class="build-mark">' + esc((p.name || '?').charAt(0).toUpperCase()) + '</span>' +
        '<span><span class="build-name">' + esc(p.name) + '</span><span class="build-what">' + esc(p.tagline || '') + '</span></span>' +
        (p.closes ? '<span class="tag closes">' + esc(p.closes) + '</span>' : '<span></span>') +
        '<span class="ship-chip' + (p.status === 'active' ? ' now' : '') + '">' + icon('event') + esc(p.ship || '') + '</span>' +
      '</div>';
    }).join('') : '<div class="empty">' + icon('handyman') + 'Nothing queued — the proof-projects skill picks these with you.</div>');
  })();

  /* ══ PAGE 2 · JOBS ══ */

  /* 1 · The board */
  function renderBoard() {
    var host = el('blk-board');
    if (!host) return;
    var rows = Array.isArray(T.board) ? T.board : [];
    var GRADE = { A: 'var(--accent-emerald)', B: 'var(--accent-amber)', C: 'var(--accent-slate)', D: 'var(--accent-rose)', F: 'var(--accent-rose)' };
    var HOT = { Interview: 1, Offer: 1, Hired: 1 };
    var body = rows.length ? rows.map(function (r) {
      var g = String(r.grade || '').charAt(0).toUpperCase();
      var color = GRADE[g] || 'var(--accent-slate)';
      return '<div class="board-row">' +
        '<span class="board-mark">' + esc((r.company || '?').charAt(0).toUpperCase()) + '</span>' +
        '<div class="board-main"><span class="board-role">' + esc(r.role) + '</span>' +
          '<span class="board-co">' + esc(r.company) + (r.note ? ' · ' + esc(r.note) : '') + '</span></div>' +
        (r.warmPath ? '<span class="board-warm" title="' + esc(r.warmPath) + '">' + icon('handshake') + 'know someone</span>' : '') +
        '<span class="board-grade" style="--g:' + color + '">' + esc(r.grade || '—') + '</span>' +
        '<span class="board-status' + (HOT[r.status] ? ' hot' : '') + '">' + esc(r.status || 'Found') + '</span>' +
        (r.next ? '<span class="board-next">' + esc(r.next) + '</span>' : '') +
        (r.url ? '<a class="board-open" href="' + esc(r.url) + '" target="_blank" rel="noopener" aria-label="Open the job posting">' + icon('open_in_new') + '</a>' : '') +
      '</div>';
    }).join('') : '<div class="empty">' + icon('travel_explore') + 'No jobs yet — say "find me jobs" and Hope goes looking. You pick what lands here.</div>';
    host.innerHTML = head('01', 'Your board', rows.length ? rows.length + ' jobs — every one picked by you' : '') + body +
      (T.boardNote ? '<div class="block-note">' + icon('travel_explore') + '<span>' + esc(T.boardNote) + '</span></div>' : '');
  }
  renderBoard();

  /* 2 · Do next — pulled straight from the board rows */
  function renderNext() {
    var host = el('blk-next');
    if (!host) return;
    var rows = (Array.isArray(T.board) ? T.board : []).filter(function (r) {
      return r.next && r.next !== '—' && r.status !== 'Closed';
    });
    host.innerHTML = head('02', 'Do next', rows.length + ' actions') + (rows.length ? rows.map(function (r, i) {
      return '<div class="next-row">' +
        '<span class="act-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="next-what">' + esc(r.next) + ' <span class="next-co">— ' + esc(r.company) + '</span></span>' +
        '<span class="board-status' + (r.status === 'Interview' || r.status === 'Offer' ? ' hot' : '') + '">' + esc(r.status) + '</span>' +
      '</div>';
    }).join('') : '<div class="empty">' + icon('done_all') + 'Nothing due. Nice.</div>');
  }
  renderNext();

  /* ── FOOTER. ── */
  (function () {
    var f = el('footer-stamp');
    if (!f) return;
    var name = (DATA.meta && DATA.meta.name) || '';
    var d = new Date();
    f.textContent = (name ? name.toUpperCase() + ' · ' : '') + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  })();
})();
