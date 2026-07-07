/* switcher.js — design + theme dock for the six portfolio designs.
   Offline-safe: no fetch, no import, no modules. Double-click any .html and it runs.
   Injects its own namespaced CSS (.hope-switch) so the dock looks identical on all
   six designs in both light and dark, independent of any design's own tokens. */
(function () {
  'use strict';

  var THEME_KEY  = 'hope-portfolio-theme';
  var DESIGN_KEY = 'hope-portfolio-design';

  /* Swatch colors are each design's real :root accent (read from the design files). */
  var DESIGNS = [
    { file: 'index.html',            name: 'Standard',      vibe: 'Signature', accent: '#D97706' },
    { file: '01-editorial.html',     name: 'Editorial',     vibe: 'Print',     accent: '#8C2B22' },
    { file: '02-swiss-minimal.html', name: 'Swiss Minimal', vibe: 'Grid',      accent: '#E2231A' },
    { file: '03-terminal.html',      name: 'Terminal',      vibe: 'Console',   accent: '#3DDC84' },
    { file: '04-warm-refined.html',  name: 'Warm Refined',  vibe: 'Warm',      accent: '#C2620E' },
    { file: '05-executive.html',     name: 'Executive',     vibe: 'Boardroom', accent: '#B0894F' }
  ];

  /* ---- Theme: apply saved choice as early as possible (before first paint). ---- */
  function savedTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      return (t === 'light' || t === 'dark') ? t : null;
    } catch (e) { return null; }
  }
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  }
  applyTheme(savedTheme());

  /* Active-design detection from the pathname; '' and '/' both mean index.html. */
  function currentFile() {
    var path = (location.pathname || '');
    var base = path.substring(path.lastIndexOf('/') + 1);
    if (base === '' || base === '/') return 'index.html';
    return base;
  }

  function ownsTheme() {
    /* Standard page ships its own #theme-toggle — defer to it entirely. */
    return !document.getElementById('theme-toggle');
  }

  function injectStyles() {
    if (document.getElementById('hope-switch-style')) return;
    var css =
      '.hope-switch,.hope-switch *{box-sizing:border-box}' +
      '.hope-switch{position:fixed;right:18px;bottom:18px;z-index:2147483000;' +
        'font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
        'display:flex;flex-direction:column;align-items:flex-end;gap:10px;' +
        '--hs-bg:rgba(255,255,255,.82);--hs-panel:rgba(255,255,255,.92);--hs-ink:#1b1f26;' +
        '--hs-ink2:#5b6472;--hs-line:rgba(20,24,31,.14);--hs-focus:#2563EB;--hs-active:rgba(37,99,235,.10)}' +
      '.hope-switch[data-hs-dark]{--hs-bg:rgba(24,28,35,.80);--hs-panel:rgba(26,30,38,.94);--hs-ink:#eef2f7;' +
        '--hs-ink2:#9aa6b4;--hs-line:rgba(255,255,255,.14);--hs-focus:#7FA3D7;--hs-active:rgba(127,163,215,.16)}' +
      '.hope-switch button{font:inherit;cursor:pointer;margin:0;color:var(--hs-ink);' +
        'background:var(--hs-bg);border:1px solid var(--hs-line);border-radius:999px;' +
        '-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);' +
        'box-shadow:0 6px 20px -8px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.10)}' +
      '.hope-switch button:focus-visible{outline:2px solid var(--hs-focus);outline-offset:2px}' +
      '.hope-switch button:focus:not(:focus-visible){outline:none}' +
      '.hs-row{display:flex;gap:10px;align-items:center}' +
      '.hs-theme{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:0}' +
      '.hs-theme svg{width:18px;height:18px;display:block}' +
      '.hs-toggle{height:40px;padding:0 15px;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;letter-spacing:.01em}' +
      '.hs-toggle .hs-dot{width:9px;height:9px;border-radius:50%;background:currentColor;opacity:.55}' +
      '.hs-toggle:hover,.hs-theme:hover{transform:translateY(-1px)}' +
      '.hope-switch button{transition:transform .15s ease,border-color .15s ease}' +
      '.hs-panel{width:264px;max-width:78vw;background:var(--hs-panel);border:1px solid var(--hs-line);' +
        'border-radius:16px;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);' +
        'box-shadow:0 18px 50px -14px rgba(0,0,0,.45),0 2px 8px rgba(0,0,0,.12);' +
        'padding:8px;overflow:hidden}' +
      '.hs-panel[hidden]{display:none}' +
      '.hs-head{display:flex;align-items:baseline;justify-content:space-between;padding:8px 10px 6px}' +
      '.hs-head b{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--hs-ink2);font-weight:700}' +
      '.hs-head span{font-size:11px;color:var(--hs-ink2)}' +
      '.hs-item{width:100%;text-align:left;display:flex;align-items:center;gap:11px;' +
        'padding:9px 10px;border-radius:11px;border:1px solid transparent;background:transparent;box-shadow:none}' +
      '.hs-item:hover{border-color:var(--hs-line);background:var(--hs-bg)}' +
      '.hs-item[aria-current="true"]{background:var(--hs-active);border-color:var(--hs-line)}' +
      '.hs-sw{width:22px;height:22px;border-radius:7px;flex:0 0 auto;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}' +
      '.hs-meta{display:flex;flex-direction:column;min-width:0;flex:1 1 auto}' +
      '.hs-name{font-size:13.5px;font-weight:600;color:var(--hs-ink);line-height:1.25}' +
      '.hs-vibe{font-size:11px;color:var(--hs-ink2);line-height:1.3}' +
      '.hs-check{margin-left:auto;font-size:12px;color:var(--hs-ink2)}' +
      '@media(max-width:520px){.hope-switch{right:12px;bottom:12px}.hs-panel{max-width:88vw}}' +
      '@media(prefers-reduced-motion:reduce){.hope-switch button{transition:none}}';
    var s = document.createElement('style');
    s.id = 'hope-switch-style';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function build() {
    injectStyles();

    var root = document.createElement('div');
    root.className = 'hope-switch';
    var manageTheme = ownsTheme();

    function syncDark() {
      if (document.documentElement.getAttribute('data-theme') === 'dark') {
        root.setAttribute('data-hs-dark', '');
      } else {
        root.removeAttribute('data-hs-dark');
      }
    }
    syncDark();

    var here = currentFile();

    /* ---- Design panel ---- */
    var panel = document.createElement('div');
    panel.className = 'hs-panel';
    panel.id = 'hs-panel';
    panel.setAttribute('role', 'menu');
    panel.setAttribute('aria-label', 'Choose a design');
    panel.hidden = true;

    var head = document.createElement('div');
    head.className = 'hs-head';
    head.innerHTML = '<b>Design</b><span>one story, six ways</span>';
    panel.appendChild(head);

    DESIGNS.forEach(function (d) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'hs-item';
      item.setAttribute('role', 'menuitemradio');
      var active = (d.file === here);
      item.setAttribute('aria-current', active ? 'true' : 'false');
      item.setAttribute('aria-checked', active ? 'true' : 'false');
      item.innerHTML =
        '<span class="hs-sw" style="background:' + d.accent + '"></span>' +
        '<span class="hs-meta"><span class="hs-name"></span><span class="hs-vibe"></span></span>' +
        (active ? '<span class="hs-check" aria-hidden="true">✓</span>' : '');
      item.querySelector('.hs-name').textContent = d.name;
      item.querySelector('.hs-vibe').textContent = d.vibe;
      item.addEventListener('click', function () {
        try { localStorage.setItem(DESIGN_KEY, d.file); } catch (e) {}
        if (!active) location.href = d.file;
        else closePanel();
      });
      panel.appendChild(item);
    });

    /* ---- Controls row: theme (optional) + design toggle ---- */
    var rowEl = document.createElement('div');
    rowEl.className = 'hs-row';

    var themeBtn = null;
    if (manageTheme) {
      themeBtn = document.createElement('button');
      themeBtn.type = 'button';
      themeBtn.className = 'hs-theme';
      themeBtn.setAttribute('aria-label', 'Toggle light or dark');
      function paintTheme() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeBtn.innerHTML = dark ? SUN : MOON;
        themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      }
      paintTheme();
      themeBtn.addEventListener('click', function () {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        var next = dark ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
        syncDark();
        paintTheme();
      });
      rowEl.appendChild(themeBtn);
    }

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'hs-toggle';
    toggle.setAttribute('aria-haspopup', 'menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'hs-panel');
    toggle.innerHTML = '<span class="hs-dot"></span>Design';

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      var first = panel.querySelector('.hs-item[aria-current="true"]') || panel.querySelector('.hs-item');
      if (first) first.focus();
      document.addEventListener('keydown', onKey, true);
      document.addEventListener('click', onOutside, true);
    }
    function closePanel(focusBack) {
      if (panel.hidden) return;
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onOutside, true);
      if (focusBack !== false) toggle.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); closePanel(); }
    }
    function onOutside(e) {
      if (!root.contains(e.target)) closePanel(false);
    }
    toggle.addEventListener('click', function () {
      if (panel.hidden) openPanel(); else closePanel();
    });
    rowEl.appendChild(toggle);

    root.appendChild(panel);
    root.appendChild(rowEl);
    document.body.appendChild(root);

    /* Keep the dock's own light/dark chrome in sync if the Standard page toggles theme. */
    if (!manageTheme) {
      var mo = new MutationObserver(syncDark);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
