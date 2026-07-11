/* =============================================================================
 * dashboard.js — renders the mission brief from window.HOPE_DATA.target.
 * Classic script, offline-safe. One scroll, seven chapters:
 * destination → proof → gap → plan → artifacts → public → Hope's take.
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
  function icon(name, fill) {
    return '<span class="material-symbols-rounded"' + (fill ? ' style="font-variation-settings:\'FILL\' 1"' : '') + '>' + esc(name) + '</span>';
  }
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── THEME (key shared with the portfolio so both flip together). ── */
  var STORAGE_KEY = 'hope-portfolio-theme';
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {} }
  try { var s0 = localStorage.getItem(STORAGE_KEY); if (s0 === 'light' || s0 === 'dark') applyTheme(s0); } catch (e) {}
  var toggle = el('theme-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ── TOPBAR — identity + scrollspy nav. ── */
  var CHAPTERS = [
    { id: 'destination', label: 'Destination' },
    { id: 'proof',       label: 'Proof' },
    { id: 'gap',         label: 'Gap' },
    { id: 'plan',        label: 'Plan' },
    { id: 'artifacts',   label: 'Artifacts' },
    { id: 'board',       label: 'Board' },
    { id: 'public',      label: 'Public' },
    { id: 'take',        label: 'Hope’s take' }
  ];
  (function () {
    var name = (DATA.meta && DATA.meta.name) || 'Career dashboard';
    document.title = name + ' — Career Dashboard' + (T.role ? ' · ' + T.role : '');
    var idHost = el('tb-id');
    if (idHost) {
      var initials = name.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
      idHost.innerHTML =
        '<img class="tb-avatar" src="headshot.jpg" alt="" onerror="this.outerHTML=\'<span class=&quot;tb-avatar-fallback&quot;>' + esc(initials) + '</span>\'">' +
        '<span><span class="tb-name">' + esc(name) + '</span><br><span class="tb-role">Mission · ' + esc(T.role || '') + '</span></span>';
    }
    if (!(Array.isArray(T.board) && T.board.length)) {
      for (var bi = CHAPTERS.length - 1; bi >= 0; bi--) if (CHAPTERS[bi].id === 'board') CHAPTERS.splice(bi, 1);
    }
    var nav = el('tb-nav');
    if (nav) {
      nav.innerHTML = CHAPTERS.map(function (c, i) {
        return '<a class="tb-link' + (i === 0 ? ' active' : '') + '" href="#' + c.id + '" data-spy="' + c.id + '">' + esc(c.label) + '</a>';
      }).join('');
    }
  })();

  /* ── 01 · HERO. ── */
  (function () {
    var eb = el('hero-eyebrow-text');
    if (eb) eb.textContent = 'Target state · ' + (T.window || 'the destination');
    var title = el('hero-title');
    if (title) title.innerHTML = esc(T.role || 'Your next role') + '<span class="accent">.</span>';
    var north = el('hero-north');
    if (north) north.innerHTML = '“' + esc(T.northStar || '') + '”';
    var meta = el('hero-meta');
    if (meta) {
      var chips = [];
      chips.push('<span class="meta-chip live"><span class="dot"></span>Portfolio live</span>');
      if (T.comp) chips.push('<span class="meta-chip">' + icon('payments') + esc(T.comp) + '</span>');
      var gapsN = ((T.matrix || {}).gaps || []).length;
      var projN = (T.projects || []).length;
      if (gapsN) chips.push('<span class="meta-chip">' + icon('target') + gapsN + ' gaps to close</span>');
      if (projN) chips.push('<span class="meta-chip">' + icon('rocket_launch') + projN + ' artifacts to ship</span>');
      meta.innerHTML = chips.join('');
    }

    /* Gauge — count-up + arc sweep. */
    var pct = Math.max(0, Math.min(100, Number(T.readiness) || 0));
    var arc = el('gauge-arc');
    var C = 2 * Math.PI * 86;
    if (arc) {
      arc.style.strokeDasharray = C;
      arc.style.strokeDashoffset = C;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        arc.style.strokeDashoffset = C * (1 - pct / 100);
      }); });
    }
    var g = el('gauge');
    if (g) g.setAttribute('aria-label', pct + '% ready for ' + (T.role || 'the target role'));
    var val = el('gauge-val');
    if (val) {
      if (REDUCED) { val.textContent = pct; }
      else {
        var t0 = null, DUR = 1400;
        (function tick(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / DUR);
          k = 1 - Math.pow(1 - k, 3);
          val.textContent = Math.round(pct * k);
          if (k < 1) requestAnimationFrame(tick);
        })(performance.now());
      }
    }
    var sub = el('gauge-sub');
    if (sub) {
      var moves = (T.plan && T.plan.phases || []).reduce(function (n, p) { return n + (p.moves || []).length; }, 0);
      sub.innerHTML = '<b>' + gapsN + '</b> gaps · <b>' + projN + '</b> artifacts · <b>' + moves + '</b> moves';
    }

    /* Forward throughline — road ahead, playhead at readiness%. */
    var f = el('fwdline');
    if (f) {
      var mids = [25, 50, 75].map(function (x) {
        return '<span class="fwd-node mid' + (x <= pct ? ' done' : '') + '" style="left:' + x + '%"><span class="fwd-hex"></span></span>';
      }).join('');
      f.innerHTML =
        '<div class="fwdline-rail">' +
          '<span class="fwdline-track"></span>' +
          '<span class="fwdline-progress" style="width:' + pct + '%"></span>' +
          mids +
          '<span class="fwd-node from" style="left:1.5%"><span class="fwd-hex"></span>' +
            '<span class="fwd-label" style="transform:none"><span class="l1">Today</span><span class="l2">' + esc(T.from || 'Where you are') + '</span></span></span>' +
          '<span class="fwd-node to" style="left:98.5%"><span class="fwd-hex"></span>' +
            '<span class="fwd-label" style="transform:translateX(-100%)"><span class="l1">Destination</span><span class="l2">' + esc(T.role || '') + '</span></span></span>' +
          '<span class="fwd-you" style="left:' + pct + '%"><span class="halo"></span><span class="core"></span><span class="tag">You · ' + pct + '%</span></span>' +
        '</div>';
    }
  })();

  /* ── 02 · PROOF STATS. ── */
  (function () {
    var host = el('stat-grid');
    if (!host || !Array.isArray(T.stats)) return;
    var subEl = el('proof-sub');
    if (subEl) subEl.textContent = T.positioning || '';
    host.innerHTML = T.stats.map(function (s) {
      return '<article class="stat-card">' +
        '<span class="stat-hex">' + icon(s.icon || 'star') + '</span>' +
        '<div class="stat-value">' + esc(s.value) + '</div>' +
        '<div class="stat-label">' + esc(s.label) + '</div>' +
      '</article>';
    }).join('');
  })();

  /* ── 03 · DELTA BOARD. ── */
  (function () {
    var m = T.matrix || {};
    var head = el('gap-headline');
    if (head) head.textContent = m.headline || '';
    var src = el('delta-source');
    if (src && m.source) src.innerHTML = icon('travel_explore') + '<span>' + esc(m.source) + '</span>';

    function dots(cur, tgt) {
      var out = '';
      for (var i = 1; i <= 5; i++) {
        var cls = 'dot5';
        if (i <= cur) cls += ' on';
        else if (i === tgt) cls += ' tgt';
        out += '<span class="' + cls + '"></span>';
      }
      return '<span class="delta-dots" role="img" aria-label="now ' + cur + ' of 5, role needs ' + tgt + '">' + out + '</span>';
    }
    function rows(list, kind) {
      return (list || []).map(function (r) {
        var cur = Math.max(0, Math.min(5, Number(r.current) || 0));
        var tgt = Math.max(0, Math.min(5, Number(r.target) || 5));
        var chip = kind === 'gaps'
          ? '<span class="delta-chip lift">+' + Math.max(0, tgt - cur) + ' to close</span>'
          : '<span class="delta-chip clear">✓ clear</span>';
        var door = r.star ? '<span class="door-tag">' + icon('star', true) + 'Door-opener</span>' : '';
        return '<div class="delta-row' + (r.star ? ' door' : '') + '">' +
          '<div class="delta-row-top"><span class="delta-skill">' + esc(r.skill) + '</span>' + door + dots(cur, tgt) + chip + '</div>' +
          '<p class="delta-note">' + esc(r.note || '') + '</p>' +
        '</div>';
      }).join('');
    }
    var gapsHost = el('delta-gaps');
    if (gapsHost) gapsHost.innerHTML =
      '<div class="delta-col-head">' + icon('trending_up') + '<span class="delta-col-title">Close these — the delta</span></div>' +
      '<p class="delta-col-sub">Ranked by how many doors each one opens.</p>' + rows(m.gaps, 'gaps');
    var moatHost = el('delta-moat');
    if (moatHost) moatHost.innerHTML =
      '<div class="delta-col-head">' + icon('verified') + '<span class="delta-col-title">Your moat — lean all the way in</span></div>' +
      '<p class="delta-col-sub">Already past the bar the role sets. Lead with these.</p>' + rows(m.moat, 'moat');
  })();

  /* ── 04 · THE PLAN. ── */
  (function () {
    var host = el('plan-list');
    var plan = T.plan || {};
    if (!host || !Array.isArray(plan.phases)) return;
    var intro = el('plan-intro');
    if (intro) intro.textContent = plan.intro || '';
    var titleEl = el('plan-title');
    if (titleEl) {
      var moves = plan.phases.reduce(function (n, p) { return n + (p.moves || []).length; }, 0);
      var t = numWord(plan.phases.length) + ' phases, ' + numWord(moves) + ' moves';
      titleEl.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    }
    function numWord(n) { return ['zero','one','two','three','four','five','six','seven','eight','nine'][n] || n; }
    var MOVE_IC = { done: 'check_circle', active: 'bolt', todo: 'radio_button_unchecked' };
    var herePlaced = false;
    host.innerHTML = plan.phases.map(function (p) {
      var clock = p.clock === 'market’s clock' || p.clock === "market's clock"
        ? '<span class="clock-chip market">' + icon('hourglass_top') + 'Market’s clock</span>'
        : '<span class="clock-chip yours">' + icon('bolt') + 'Your clock</span>';
      var moves = (p.moves || []).map(function (mv) {
        var here = '';
        if (mv.status === 'active' && !herePlaced) { here = '<span class="here-tag"><span class="dot"></span>You are here</span>'; herePlaced = true; }
        return '<div class="move ' + esc(mv.status || 'todo') + '">' +
          '<span class="move-ic">' + icon(MOVE_IC[mv.status] || MOVE_IC.todo) + '</span>' +
          '<div>' +
            '<div class="move-top"><span class="move-label">' + esc(mv.label) + '</span>' + here +
              '<span class="move-date">' + esc(mv.date || '') + '</span></div>' +
            '<p class="move-desc">' + esc(mv.desc || '') + '</p>' +
            (mv.closes ? '<span class="move-closes">' + icon('flag') + 'Closes ' + esc(mv.closes) + '</span>' : '') +
          '</div>' +
        '</div>';
      }).join('');
      return '<article class="phase ' + esc(p.status || '') + '">' +
        '<div class="phase-card" data-num="' + esc(p.num) + '">' +
          '<div class="phase-head">' +
            '<span class="phase-kicker">Phase ' + esc(p.num) + '</span>' +
            '<h3 class="phase-title">' + esc(p.title) + '</h3>' +
            clock +
            '<span class="phase-window">' + icon('calendar_month') + esc(p.window || '') + '</span>' +
          '</div>' +
          '<p class="phase-why">' + esc(p.why || '') + '</p>' +
          moves +
        '</div>' +
      '</article>';
    }).join('');
  })();

  /* ── 05 · ARTIFACTS. ── */
  (function () {
    var host = el('proj-grid');
    if (!host || !Array.isArray(T.projects)) return;
    var MARKS = ['fact_check', 'monitoring', 'auto_stories'];
    host.innerHTML = T.projects.map(function (p, i) {
      var featured = !!p.featured;
      var ship = '<span class="ship-chip' + (p.status === 'active' ? ' now' : '') + '">' + icon('event') + esc(p.ship || '') + '</span>';
      var sig = featured ? '<span class="sig-tag">★ Signature artifact</span>' : '';
      return '<article class="proj-card' + (featured ? ' featured' : '') + '">' +
        '<div class="proj-head">' +
          '<span class="proj-mark">' + icon(MARKS[i] || 'rocket_launch') + '</span>' +
          '<div class="proj-title-block">' +
            '<h3 class="proj-name">' + esc(p.name) + '</h3>' +
            '<p class="proj-tagline">' + esc(p.tagline || '') + '</p>' +
          '</div>' +
          '<div class="proj-meta">' + ship + sig + '</div>' +
        '</div>' +
        '<p class="proj-desc">' + esc(p.desc || '') + '</p>' +
        '<div class="proj-badges">' +
          (p.closes ? '<span class="ai-badge closes">' + icon('flag') + '<span class="k">closes</span>' + esc(p.closes) + '</span>' : '') +
          (p.builtWith ? '<span class="ai-badge built">' + icon('smart_toy') + '<span class="k">built with</span>' + esc(p.builtWith) + '</span>' : '') +
          (p.runsOn ? '<span class="ai-badge runs">' + icon('memory') + '<span class="k">runs on</span>' + esc(p.runsOn) + '</span>' : '') +
        '</div>' +
      '</article>';
    }).join('');
  })();

  /* ── 06 · THE BOARD — validated target roles, human-word statuses. ── */
  (function () {
    var host = el('board-rows');
    var rows = Array.isArray(T.board) ? T.board : [];
    if (!host || !rows.length) return;
    var sec = el('board'); if (sec) sec.hidden = false;
    var GRADE = { A: 'var(--accent-emerald)', B: 'var(--accent-amber)', C: 'var(--accent-slate)', D: 'var(--accent-rose)', F: 'var(--accent-rose)' };
    host.innerHTML = rows.map(function (r) {
      var g = String(r.grade || '').charAt(0).toUpperCase();
      var color = GRADE[g] || 'var(--accent-slate)';
      var initial = esc((r.company || '?').charAt(0).toUpperCase());
      var warm = r.warmPath ? '<span class="board-warm" title="' + esc(r.warmPath) + '">' + icon('handshake') + 'warm path</span>' : '';
      var link = r.url ? '<a class="board-open" href="' + esc(r.url) + '" target="_blank" rel="noopener" aria-label="Open posting">' + icon('open_in_new') + '</a>' : '';
      return '<div class="board-row">' +
        '<span class="board-mark">' + initial + '</span>' +
        '<div class="board-main"><span class="board-role">' + esc(r.role) + '</span>' +
          '<span class="board-co">' + esc(r.company) + (r.note ? ' · ' + esc(r.note) : '') + '</span></div>' +
        warm +
        '<span class="board-grade" style="--g:' + color + '">' + esc(r.grade || '—') + '</span>' +
        '<span class="board-status">' + esc(r.status || 'Interested') + '</span>' +
        (r.next ? '<span class="board-next">' + esc(r.next) + '</span>' : '') +
        link +
      '</div>';
    }).join('');
    var note = el('board-note');
    if (note && T.boardNote) note.innerHTML = icon('travel_explore') + '<span>' + esc(T.boardNote) + '</span>';
  })();

  /* ── 06 · GO PUBLIC. ── */
  (function () {
    var host = el('post-rail');
    if (!host || !Array.isArray(T.posts)) return;
    var PLAT = { linkedin: { label: 'LinkedIn', icon: 'campaign' }, link: { label: 'Web', icon: 'public' } };
    host.innerHTML = T.posts.map(function (p, i) {
      var plat = PLAT[p.platform] || PLAT.link;
      var tags = (Array.isArray(p.tags) ? p.tags : []).map(function (t) { return '<span class="post-tag">#' + esc(t) + '</span>'; }).join(' ');
      return '<article class="post-card" data-post="' + i + '">' +
        '<div class="post-head"><span class="post-day">' + esc(p.day) + '</span>' +
          '<span class="post-plat">' + icon(plat.icon) + esc(plat.label) + '</span></div>' +
        '<div class="post-hook">' + esc(p.hook) + '</div>' +
        '<p class="post-body">' + esc(p.body) + '</p>' +
        '<span class="post-more" role="button" tabindex="0">Read the full draft</span>' +
        '<p class="post-cta">' + esc(p.cta || '') + '</p>' +
        '<div class="post-foot"><span class="post-tags">' + tags + '</span>' +
          '<button class="post-copy" type="button" data-copy="' + i + '">' + icon('content_copy') + 'Copy</button></div>' +
      '</article>';
    }).join('');
    host.addEventListener('click', function (e) {
      var more = e.target.closest('.post-more');
      if (more) {
        var card = more.closest('.post-card');
        card.classList.toggle('open');
        more.textContent = card.classList.contains('open') ? 'Collapse' : 'Read the full draft';
        return;
      }
      var btn = e.target.closest('.post-copy');
      if (!btn) return;
      var p = T.posts[Number(btn.getAttribute('data-copy'))];
      if (!p) return;
      var text = p.hook + '\n\n' + p.body + '\n\n' + (p.cta || '') + '\n\n' +
        (Array.isArray(p.tags) ? p.tags.map(function (t) { return '#' + t; }).join(' ') : '');
      function done() {
        btn.classList.add('copied');
        btn.innerHTML = icon('check') + 'Copied';
        setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = icon('content_copy') + 'Copy'; }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
  })();

  /* ── 07 · HOPE'S TAKE. ── */
  (function () {
    var host = el('take-band');
    var gd = T.guidance || {};
    if (!host || !gd.take) return;
    var moves = (Array.isArray(gd.moves) ? gd.moves : []).map(function (mv, i) {
      return '<div class="take-move"><span class="take-move-num">Move 0' + (i + 1) + '</span>' +
        '<h4 class="take-move-title">' + esc(mv.title) + '</h4>' +
        '<p class="take-move-desc">' + esc(mv.desc) + '</p></div>';
    }).join('');
    var chips = (Array.isArray(gd.deprioritize) ? gd.deprioritize : []).map(function (d) {
      return '<span class="deprio-chip" title="' + esc(d.why) + '">' + icon('block') + esc(d.thing) + '</span>';
    }).join('');
    host.innerHTML =
      '<div class="take-head"><span class="take-avatar">' + icon('waving_hand') + '</span><span class="take-title">A note from Hope</span></div>' +
      '<p class="take-lede">' + esc(gd.take) + '</p>' +
      (moves ? '<div class="take-moves">' + moves + '</div>' : '') +
      (gd.then ? '<p class="take-then">' + esc(gd.then) + '</p>' : '') +
      (chips ? '<div class="deprio-row"><span class="deprio-label">' + icon('low_priority') + 'Skip for now (hover for why)</span>' + chips + '</div>' : '') +
      (gd.autonomy ? '<p class="take-autonomy">' + icon('self_improvement') + '<span>' + esc(gd.autonomy) + '</span></p>' : '');
  })();

  /* ── FOOTER. ── */
  (function () {
    var f = el('footer-stamp');
    if (!f) return;
    var name = (DATA.meta && DATA.meta.name) || '';
    var d = new Date();
    var stamp = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    f.textContent = (name ? name.toUpperCase() + ' · ' : '') + 'MISSION BRIEF · ' + stamp.toUpperCase();
  })();

  /* ── SCROLL REVEAL + SCROLLSPY. ── */
  (function () {
    var reveals = document.querySelectorAll('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) {
      reveals.forEach(function (n) { n.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -4% 0px', threshold: 0.02 });
      reveals.forEach(function (n) { io.observe(n); });
    }

    /* Scrollspy from scroll position (IntersectionObserver misfires on
       instant jumps): the active chapter is the last one whose top has
       crossed 40% of the viewport. */
    var links = {};
    document.querySelectorAll('.tb-link[data-spy]').forEach(function (a) { links[a.getAttribute('data-spy')] = a; });
    function spy() {
      var line = window.innerHeight * 0.4;
      var current = CHAPTERS[0].id;
      CHAPTERS.forEach(function (c) {
        var n = el(c.id);
        if (n && n.getBoundingClientRect().top <= line) current = c.id;
      });
      Object.keys(links).forEach(function (k) { links[k].classList.toggle('active', k === current); });
    }
    /* setTimeout throttle, not rAF — rAF stalls in occluded tabs and the
       active chip would freeze until the next real frame. */
    var spyPending = false;
    function scheduleSpy() {
      if (spyPending) return;
      spyPending = true;
      setTimeout(function () { spyPending = false; spy(); }, 80);
    }
    window.addEventListener('scroll', scheduleSpy, { passive: true });
    document.addEventListener('visibilitychange', spy);
    spy();
  })();
})();
