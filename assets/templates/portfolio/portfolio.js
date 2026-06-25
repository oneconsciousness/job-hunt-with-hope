(function() {
  // ═══════════════════════════════════════════════════════════════════════
  // Hope portfolio runtime renderer + behavior — ONE classic-script IIFE.
  //
  // The visible <body> is built at runtime from window.HOPE_DATA (data.js,
  // loaded first). The shell index.html ships only: SEO head, static topbar,
  // a stamped .seo-fallback block, empty mount points, the export modal.
  //
  // Two responsibilities live in this file, in this order:
  //   (A) RENDER  — build the structural DOM from HOPE_DATA (renderIdentity …
  //       renderResumeView + renderPanes). Runs FIRST so every selector the
  //       behavior code binds already exists.
  //   (B) BEHAVE  — theme, share, export/PDF, section tabs, card expand,
  //       spotlight, wide-screen rails, photo, the Social engine, the
  //       Throughline engine. Preserved verbatim in intent; only their target
  //       DOM is now JS-rendered, and the helpers they used to keep private
  //       (esc / handle / loadScript / parseYM / fmtYM / MONTHS) are hoisted
  //       to file scope below so the renderers share them.
  //
  // file:// law: no fetch(), no import, no type=module. All colors resolve to
  // var(--token) / color-mix / currentColor — zero raw hex in the renderers
  // (the only hex left is the Social brand-color registry `B`, brand identity
  // in string literals, part of the preserved Social engine).
  // ═══════════════════════════════════════════════════════════════════════

  var isPublished = document.documentElement.dataset.hopeMode === 'published';

  // ─── SHARED HELPERS (hoisted to file scope — §C.1) ──────────────────────
  // Used by every renderer below AND by the preserved Social / Throughline
  // engines (which no longer redeclare their own copies).

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function handle(url) {
    var u = String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
    return u.length > 36 ? u.slice(0, 35) + '…' : u;
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parseYM(s) { // "YYYY-MM" → months since year 0, or null
    var m = /^(\d{4})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var mo = +m[2];
    if (mo < 1 || mo > 12) return null;
    return +m[1] * 12 + (mo - 1);
  }
  function fmtYM(months) { return MONTHS[months % 12] + ' ' + Math.floor(months / 12); }

  var loadedScripts = {};
  function loadScript(src) {
    if (!src || loadedScripts[src]) return;
    loadedScripts[src] = 1;
    var s = document.createElement('script');
    s.async = true; s.src = src;
    document.body.appendChild(s);
  }

  // frag(html) — parse an HTML string into a single element node. All dynamic
  // interpolation inside the string MUST already be esc()'d, EXCEPT the fixed
  // favicon() onerror payload and the literal valueless `data-expand` attribute
  // (both emitted verbatim — see favicon() and renderExperience/renderProjects).
  function frag(html) {
    var t = document.createElement('template');
    t.innerHTML = String(html).trim();
    return t.content.firstElementChild;
  }

  // brandSvg(kind) — BARE single-path brand glyph for contact-row items.
  // viewBox 0 0 24 24, fill="currentColor" (the item color owns it via CSS
  // L443) — NOT a colored .social-chip tile (that registry stays Social-only).
  // Unknown kind → the globe (website). Geometry only, zero hex.
  var BRAND_PATHS = {
    linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
    x: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z',
    instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
    behance: 'M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z',
    dribbble: 'M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z',
    medium: 'M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z',
    youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
    website: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z'
  };
  function brandSvg(kind) {
    var k = String(kind || 'other').toLowerCase();
    var path = BRAND_PATHS[k] || BRAND_PATHS.website;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + path + '"/></svg>';
  }

  // favicon(domain, initial, alt) — Google-favicon <img> with a byte-exact
  // onerror that swaps to a bare <span class="org-fallback">{initial}</span>
  // (the ONE sanctioned external URL; the onerror string is emitted verbatim,
  // never re-encoded). No domain → the bare .org-fallback span directly.
  function favicon(domain, initial, alt) {
    var ini = esc(initial);
    if (!domain) return '<span class="org-fallback">' + ini + '</span>';
    var onerr = "this.outerHTML='&lt;span class=\\'org-fallback\\'&gt;" + ini + "&lt;/span&gt;';";
    return '<img class="org-logo" src="https://www.google.com/s2/favicons?domain=' + esc(domain) +
      '&sz=128" alt="' + esc(alt) + '" width="44" height="44" onerror="' + onerr + '">';
  }

  // ─── TOKEN RESOLVERS (NO hex — §C.1, §A.7 locked) ───────────────────────
  // SkillCategory → --cat-* var-name. Unknown → '' (omit the style; CSS falls
  // back to var(--accent-cyan) at L613/614).
  var CAT_TOKENS = {
    tools: 'tools', programming: 'programming', languages: 'languages',
    methods: 'methods', analytical: 'analytical', design: 'design',
    domain: 'domain', interpersonal: 'interpersonal'
  };
  function catColorVar(category) {
    var c = CAT_TOKENS[String(category || '').toLowerCase()];
    return c ? 'var(--cat-' + c + ')' : '';
  }
  // level 1..4 → tier name; seg color = LEVEL tier only (NEVER category).
  var SEG_TIERS = { 1: 'beginner', 2: 'proficient', 3: 'advanced', 4: 'expert' };
  var SEG_HEIGHTS = [6, 8, 10, 12];
  function segStyle(level, index) {
    var lv = Math.max(1, Math.min(4, parseInt(level, 10) || 1));
    var tier = SEG_TIERS[lv];
    var lit = index < lv;
    var bg = lit
      ? 'var(--skill-' + tier + ')'
      : 'color-mix(in srgb, var(--skill-' + tier + ') 20%, transparent)';
    return 'height:' + SEG_HEIGHTS[index] + 'px;background:' + bg;
  }
  function chipCatAttr(category) {
    var c = CAT_TOKENS[String(category || '').toLowerCase()];
    return c ? ' data-cat="' + c + '"' : '';
  }
  function integrityVar(band) {
    var b = String(band || '').toLowerCase();
    if (b === 'high' || b === 'mid' || b === 'low') return 'var(--integrity-' + b + ')';
    return '';
  }

  // Small chip-builders shared by several renderers.
  function skillChips(skills) {
    if (!Array.isArray(skills) || !skills.length) return '';
    var inner = skills.map(function (s) {
      return '<span class="skill-chip"' + chipCatAttr(s && s.category) + '>' + esc(s && s.name) + '</span>';
    }).join('');
    return '<div class="contrib-skills">' + inner + '</div>';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // (A) RENDER FUNCTIONS — each emits the EXACT css-contract DOM (§C.2)
  // ═══════════════════════════════════════════════════════════════════════

  var SECTION_META = {
    overview:       { icon: 'insights',      label: 'Overview' },
    experience:     { icon: 'work',          label: 'Experience' },
    skills:         { icon: 'hub',           label: 'Skills' },
    education:      { icon: 'school',        label: 'Education' },
    certifications: { icon: 'verified',      label: 'Certifications' },
    projects:      { icon: 'rocket_launch', label: 'Projects' },
    social:         { icon: 'rss_feed',      label: 'Social' }
  };

  function plural(n, one, many) { return (n === 1 ? one : (many || (one + 's'))); }

  // renderIdentity — removes .seo-fallback, then prepends .identity-row BEFORE
  // #throughline inside #identity-mount (.identity-card). NEVER emits phone.
  function renderIdentity(d) {
    var mount = document.getElementById('identity-mount');
    if (!mount) return;
    var id = d.identity || {};
    var meta = d.meta || {};

    var fb = document.querySelector('.seo-fallback');
    if (fb && fb.parentNode) fb.parentNode.removeChild(fb);

    var hasPhoto = !!id.photo;
    var photoHtml =
      '<label class="photo-upload' + (hasPhoto ? ' has-photo' : '') + '" id="photo-upload" for="photo-input">' +
        '<span class="upload-prompt"><span class="material-symbols-rounded">add_a_photo</span><span>Photo</span></span>' +
        '<img id="photo-preview"' + (hasPhoto ? ' src="' + esc(id.photo) + '"' : '') + ' alt="' + esc(meta.name) + '" />' +
        '<input type="file" accept="image/*" id="photo-input" />' +
        '<button class="photo-remove" id="photo-remove" type="button" aria-label="Remove photo">' +
          '<span class="material-symbols-rounded">close</span>' +
        '</button>' +
      '</label>';

    var stats = id.stats || {};
    var statsHtml =
      '<div class="stats-row">' +
        '<span><strong>' + esc(stats.skills) + '</strong> skills</span><span class="sep">//</span>' +
        '<span><strong>' + esc(stats.roles) + '</strong> roles</span><span class="sep">//</span>' +
        '<span><strong>' + esc(stats.contributions) + '</strong> contributions</span>' +
      '</div>';

    // Contact row: location, email (NEVER phone), then brand links via brandSvg.
    var contact = '';
    if (id.location) {
      contact += '<span class="item location"><span class="material-symbols-rounded">location_on</span>' + esc(id.location) + '</span>';
    }
    if (id.email) {
      contact += '<a class="item" href="mailto:' + esc(id.email) + '" target="_blank" rel="noopener">' +
        '<span class="material-symbols-rounded">mail</span>' + esc(id.email) +
        '<span class="material-symbols-rounded ext">open_in_new</span></a>';
    }
    (Array.isArray(id.links) ? id.links : []).forEach(function (lnk) {
      if (!lnk || !lnk.url) return;
      var kind = String(lnk.kind || 'other').toLowerCase();
      contact += '<a class="item ' + esc(kind) + '" href="' + esc(lnk.url) + '" target="_blank" rel="noopener">' +
        brandSvg(kind) + esc(lnk.label) +
        '<span class="material-symbols-rounded ext">open_in_new</span></a>';
    });

    var summaryHtml = id.summary ? '<p class="summary">' + esc(id.summary) + '</p>' : '';

    var infoHtml =
      '<div class="identity-info">' +
        '<div class="identity-top">' +
          '<div class="identity-name-block">' +
            '<h1 class="name">' + esc(meta.name) + '</h1>' +
            '<p class="headline">' + esc(meta.headline) + '</p>' +
          '</div>' +
          '<span class="live-pill"><span class="dot"></span>LIVE</span>' +
        '</div>' +
        statsHtml +
        '<div class="contact-row">' + contact + '</div>' +
        summaryHtml +
      '</div>';

    var row = frag('<div class="identity-row">' + photoHtml + infoHtml + '</div>');
    var throughline = document.getElementById('throughline');
    // .identity-row is a DIRECT child of .identity-card, BEFORE #throughline.
    mount.insertBefore(row, throughline || null);
  }

  // renderSectionGrid — one .section-btn per PRESENT section, appended INTO the
  // existing .section-grid (never nests a second grid). Integrity tiles carry
  // a confidence bar; overview/social do not.
  function renderSectionGrid(d) {
    var grid = document.getElementById('section-grid-mount');
    if (!grid) return;
    var meta = d.meta || {};
    var conf = meta.confidence || {};
    var present = presentSections(d);

    var counts = {
      experience: (d.experience || []).length,
      skills: skillItemCount(d),
      education: (d.education || []).length,
      certifications: (d.certifications || []).length,
      projects: (d.projects || []).length,
      overview: (d.overview && Array.isArray(d.overview.headline_stats)) ? d.overview.headline_stats.length : 0,
      social: (Array.isArray(d.social) ? d.social.length : 0)
    };
    var countLabel = {
      experience: function (n) { return n + ' ' + plural(n, 'role'); },
      skills: function (n) { return n + ' skills'; },
      education: function (n) { return n + ' ' + plural(n, 'degree'); },
      certifications: function (n) { return n + ' ' + plural(n, 'certification'); },
      projects: function (n) { return n + ' ' + plural(n, 'project'); },
      overview: function (n) { return n + ' highlights'; },
      social: function (n) { return n + ' ' + plural(n, 'post'); }
    };
    var INTEGRITY = { experience: 1, skills: 1, education: 1, certifications: 1, projects: 1 };

    // Tile order mirrors the section-grid: overview · experience · skills ·
    // education · certifications · projects · social.
    var GRID_ORDER = ['overview', 'experience', 'skills', 'education', 'certifications', 'projects', 'social'];
    GRID_ORDER.forEach(function (sec) {
      if (!present[sec]) return;
      var m = SECTION_META[sec];
      var html =
        '<button class="section-btn" data-section="' + sec + '" type="button">' +
          '<span class="icon"><span class="material-symbols-rounded">' + m.icon + '</span></span>' +
          '<span class="body">' +
            '<span class="label">' + m.label + '</span>' +
            '<span class="meta">' +
              '<span class="count">' + esc(countLabel[sec](counts[sec])) + '</span>';
      if (INTEGRITY[sec]) {
        var c = conf[sec] || {};
        var pct = (typeof c.pct === 'number') ? c.pct : 0;
        var confColor = integrityVar(c.band);
        var integrity = '<span class="integrity">' +
          '<span class="bar-track"><span class="bar-fill" style="width: ' + pct + '%"></span></span>' +
          '<span class="pct">' + pct + '%</span>' +
        '</span>';
        html += integrity;
        html += '</span></span></button>';
        var btn = frag(html);
        if (confColor) btn.style.setProperty('--conf-color', confColor);
        grid.appendChild(btn);
        return;
      }
      html += '</span></span></button>';
      grid.appendChild(frag(html));
    });
  }

  // renderOverview — the Overview pane. Skipped entirely when !overview.show.
  function renderOverview(d) {
    var ov = d.overview || {};
    if (!ov.show) return null;
    var stats = Array.isArray(ov.headline_stats) ? ov.headline_stats : [];
    var interests = Array.isArray(ov.interests) ? ov.interests : [];

    var statsHtml = stats.map(function (s) {
      return '<div class="summary-stat hex-kpi">' +
        '<span class="hex"><span class="material-symbols-rounded">' + esc(s && s.icon) + '</span></span>' +
        '<span class="stat-text">' +
          '<span class="stat-value">' + esc(s && s.value) + '</span>' +
          '<span class="stat-label">' + esc(s && s.label) + '</span>' +
        '</span>' +
      '</div>';
    }).join('');

    // .summary-interests is OMITTED ENTIRELY when interests is empty (CSS
    // :has() auto-hide at L461 needs the element absent — never emit it empty).
    var interestsHtml = '';
    if (interests.length) {
      interestsHtml = '<div class="summary-interests"><span class="interests-eyebrow">Interests</span>' +
        interests.map(function (i) { return '<span class="skill-chip">' + esc(i) + '</span>'; }).join('') +
        '</div>';
    }

    var html =
      '<div class="section-pane" data-pane="overview" id="pane-overview">' +
        '<section class="summary-band metrics-band">' +
          '<div class="summary-stats">' +
            '<span class="overview-strip-title summary-stats-title">Impact</span>' +
            statsHtml +
          '</div>' +
        '</section>' +
        '<section class="summary-band feed-band">' +
          '<div class="overview-featured">' +
            '<div class="overview-strip" id="ov-latest-wrap" hidden>' +
              '<div class="overview-strip-head"><span class="overview-strip-title">Latest from</span><a class="overview-seeall" href="#spotlight=social">See all<span class="material-symbols-rounded">arrow_forward</span></a></div>' +
              '<div class="overview-latest" id="overview-latest"></div>' +
            '</div>' +
            '<div class="overview-strip" id="ov-highlights-wrap" hidden>' +
              '<div class="overview-strip-head"><span class="overview-strip-title">Highlights</span></div>' +
              '<div class="overview-highlights" id="overview-highlights"></div>' +
            '</div>' +
          '</div>' +
          interestsHtml +
        '</section>' +
        '<a class="backtotop" href="#top" aria-hidden="true">↑ Contents</a>' +
      '</div>';
    return frag(html);
  }

  // renderExperience — role cards with IC/Lead grouped contributions.
  function renderExperience(d) {
    var roles = Array.isArray(d.experience) ? d.experience : [];
    if (!roles.length) return null;

    var cards = roles.map(function (r) {
      var k = r.kpis || {};
      var isCur = !!r.is_current;
      var head =
        '<div class="item-head">' +
          favicon(r.company_domain, r.company_initial, r.company) +
          '<div class="item-info">' +
            '<div class="title-row">' +
              '<span class="role-title">' + esc(r.role_title) + '</span>' +
              (isCur ? '<span class="active-pill">Active</span>' : '') +
            '</div>' +
            '<span class="role-company">' + esc(r.company) + '</span>' +
            '<span class="role-dates">' + esc(r.dates) + '</span>' +
          '</div>' +
          '<div class="item-meta">' +
            '<span class="contrib-pill">' + esc(r.contribution_count) + ' ' + plural(r.contribution_count, 'contribution') + '</span>' +
            '<span class="hex-kpi" title="Individual contributions"><span class="hex"><span class="material-symbols-rounded">person</span></span><span class="num">' + esc(k.ic) + '</span></span>' +
            '<span class="hex-kpi" title="Leadership contributions"><span class="hex"><span class="material-symbols-rounded">groups</span></span><span class="num">' + esc(k.lead) + '</span></span>' +
            '<span class="hex-kpi" title="Quantified outcomes"><span class="hex"><span class="material-symbols-rounded">monitoring</span></span><span class="num">' + esc(k.metric) + '</span></span>' +
            '<span class="chevron"><span class="material-symbols-rounded">expand_more</span></span>' +
          '</div>' +
        '</div>';

      var groups = (Array.isArray(r.groups) ? r.groups : []).map(function (g) {
        var kind = (g.kind === 'lead') ? 'lead' : 'ic';
        var gIcon = (kind === 'lead') ? 'groups' : 'person';
        var gTitle = (kind === 'lead') ? 'Leadership Contributions' : 'Individual Contributions';
        var contribs = (Array.isArray(g.contributions) ? g.contributions : []).map(function (c) {
          return renderContribution(c, kind);
        }).join('');
        return '<div class="contrib-group">' +
          '<div class="group-header ' + kind + '">' +
            '<span class="material-symbols-rounded">' + gIcon + '</span>' +
            '<span class="title">' + gTitle + '</span>' +
            '<span class="bar"></span>' +
          '</div>' +
          contribs +
        '</div>';
      }).join('');

      var card =
        '<div class="item-card' + (isCur ? ' is-current' : '') + '" data-expand id="tl-' + esc(r.id) + '">' +
          '<span class="accent-bar"></span>' +
          head +
          '<div class="item-body"><div class="item-body-inner">' +
            '<div class="item-divider"></div>' +
            groups +
          '</div></div>' +
        '</div>';
      return card;
    }).join('');

    var html = '<div class="section-pane" data-pane="experience" id="pane-experience">' +
      cards +
      '<a class="backtotop" href="#top" aria-hidden="true">↑ Contents</a>' +
    '</div>';
    return frag(html);
  }

  // A single .contrib article inside an experience group. Honors achieved.
  function renderContribution(c, kind) {
    var domain = c.domain ? '<span class="contrib-domain">' + esc(c.domain) + '</span>' : '';
    var scope = c.scope ? '<span class="scope-badge">' + esc(c.scope) + '</span>' : '';
    var metric = '';
    if (c.metric) {
      var dir = String(c.metric.direction || '');
      var arrow = dir === 'down' ? '↓' : (dir === 'achieved' ? '✓' : '↑');
      var achieved = (dir === 'achieved') ? ' achieved' : '';
      metric = '<span class="metric-badge' + achieved + '">' +
        '<span class="val">' + esc(c.metric.value) + '</span>' +
        '<span class="arrow">' + arrow + '</span>' +
        '<span class="subj">' + esc(c.metric.subject) + '</span>' +
      '</span>';
    }
    var impact = c.impact
      ? '<div class="contrib-impact"><span class="material-symbols-rounded">arrow_forward</span><p>' + esc(c.impact) + '</p></div>'
      : '';
    var skills = skillChips(c.skills);
    var comps = '';
    if (Array.isArray(c.competencies) && c.competencies.length) {
      comps = '<div class="contrib-competencies">' +
        c.competencies.map(function (n) { return '<span class="competency">' + esc(n) + '</span>'; }).join('') +
        '</div>';
    }
    return '<article class="contrib ' + kind + '">' +
      '<div class="contrib-head">' +
        '<span class="contrib-num">' + esc(c.num) + '</span>' +
        '<span class="material-symbols-rounded type-icon">' + esc(c.icon) + '</span>' +
        domain + scope + metric +
      '</div>' +
      '<p class="contrib-action">' + esc(c.action) + '</p>' +
      impact + skills + comps +
    '</article>';
  }

  // renderProjects — .item-card.project with a single flat .contrib.ic body.
  // NO competencies / scope / metric-badge / contrib-num.
  function renderProjects(d) {
    var projs = Array.isArray(d.projects) ? d.projects : [];
    if (!projs.length) return null;

    var cards = projs.map(function (p) {
      var datesSpan = p.dates ? '<span class="role-dates">' + esc(p.dates) + '</span>' : '';
      var pill = p.best_metric ? '<span class="contrib-pill">' + esc(p.best_metric) + '</span>' : '';
      var impact = p.impact
        ? '<div class="contrib-impact"><span class="material-symbols-rounded">arrow_forward</span><p>' + esc(p.impact) + '</p></div>'
        : '';
      var skills = skillChips(p.skills);
      var linkRow = '';
      if (p.link && p.link.url) {
        linkRow = '<div class="project-link-row">' +
          '<a class="project-link" href="' + esc(p.link.url) + '" target="_blank" rel="noopener">' +
            '<span class="material-symbols-rounded">link</span>' + esc(p.link.label) +
            '<span class="material-symbols-rounded ext">open_in_new</span>' +
          '</a>' +
        '</div>';
      }
      return '<div class="item-card project" data-expand id="tl-' + esc(p.id) + '">' +
        '<span class="accent-bar"></span>' +
        '<div class="item-head">' +
          favicon(p.domain, p.initial, p.name) +
          '<div class="item-info">' +
            '<div class="title-row">' +
              '<span class="role-title">' + esc(p.name) + '</span>' +
              (p.is_active ? '<span class="active-pill">Active</span>' : '') +
            '</div>' +
            '<span class="role-company">' + esc(p.tagline) + '</span>' +
            datesSpan +
          '</div>' +
          '<div class="item-meta">' +
            pill +
            '<span class="chevron"><span class="material-symbols-rounded">expand_more</span></span>' +
          '</div>' +
        '</div>' +
        '<div class="item-body"><div class="item-body-inner">' +
          '<div class="item-divider"></div>' +
          '<article class="contrib ic">' +
            '<p class="contrib-action">' + esc(p.description) + '</p>' +
            impact + skills + linkRow +
          '</article>' +
        '</div></div>' +
      '</div>';
    }).join('');

    var html = '<div class="section-pane" data-pane="projects" id="pane-projects">' +
      cards +
      '<a class="backtotop" href="#top" aria-hidden="true">↑ Contents</a>' +
    '</div>';
    return frag(html);
  }

  // renderSkills — grouped by category in skills.order. Seg color = LEVEL tier;
  // --cat-color colors ONLY the ledge + name.
  function renderSkills(d) {
    var sk = d.skills || {};
    var order = Array.isArray(sk.order) ? sk.order : [];
    var cats = sk.categories || {};
    var blocks = order.map(function (name) {
      var cat = cats[name];
      if (!cat) return '';
      var items = Array.isArray(cat.items) ? cat.items : [];
      var catVar = catColorVar(cat.category);
      var grid = items.map(function (it) {
        var segs = '';
        for (var i = 0; i < 4; i++) {
          segs += '<span class="seg" style="' + segStyle(it.level, i) + '"></span>';
        }
        var years = (typeof it.years === 'number' || (it.years != null && it.years !== ''))
          ? '<span class="years">' + esc(it.years) + 'y</span>' : '';
        return '<div class="skill-cell">' +
          '<span class="level-bar">' + segs + '</span>' +
          '<span class="name">' + esc(it.name) + '</span>' +
          years +
        '</div>';
      }).join('');
      return '<div class="skill-cat"' + (catVar ? ' style="--cat-color: ' + catVar + '"' : '') + '>' +
        '<div class="skill-cat-header">' +
          '<span class="ledge"></span>' +
          '<span class="name">' + esc(name) + '</span>' +
          '<span class="count">[' + items.length + ']</span>' +
        '</div>' +
        '<div class="skill-grid">' + grid + '</div>' +
      '</div>';
    }).join('');

    if (!blocks.replace(/\s/g, '')) return null; // no categories → no pane

    var html = '<div class="section-pane" data-pane="skills" id="pane-skills">' +
      '<div class="skills-hud">' + blocks + '</div>' +
      '<a class="backtotop" href="#top" aria-hidden="true">↑ Contents</a>' +
    '</div>';
    return frag(html);
  }

  // renderEducation — .edu-card list.
  function renderEducation(d) {
    var edu = Array.isArray(d.education) ? d.education : [];
    if (!edu.length) return null;
    var cards = edu.map(function (e) {
      return '<div class="edu-card" id="tl-' + esc(e.id) + '">' +
        favicon(e.institution_domain, e.institution_initial, e.institution) +
        '<div class="info">' +
          '<div class="title-line">' + esc(e.degree_line) + '</div>' +
          '<div class="sub-line">' + esc(e.institution) + '</div>' +
          '<div class="date-line">' + esc(e.dates) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    var html = '<div class="section-pane" data-pane="education" id="pane-education">' +
      '<div class="edu-list">' + cards + '</div>' +
      '<a class="backtotop" href="#top" aria-hidden="true">↑ Contents</a>' +
    '</div>';
    return frag(html);
  }

  // renderCertifications — .edu-card list; no date → <span class="no-date">.
  function renderCertifications(d) {
    var certs = Array.isArray(d.certifications) ? d.certifications : [];
    if (!certs.length) return null;
    var cards = certs.map(function (c) {
      var dateLine = c.date ? esc(c.date) : '<span class="no-date">No date</span>';
      return '<div class="edu-card" id="tl-' + esc(c.id) + '">' +
        favicon(c.issuer_domain, c.issuer_initial, c.issuer) +
        '<div class="info">' +
          '<div class="title-line">' + esc(c.name) + '</div>' +
          '<div class="sub-line">' + esc(c.issuer) + '</div>' +
          '<div class="date-line">' + dateLine + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    var html = '<div class="section-pane" data-pane="certifications" id="pane-certifications">' +
      '<div class="edu-list">' + cards + '</div>' +
      '<a class="backtotop" href="#top" aria-hidden="true">↑ Contents</a>' +
    '</div>';
    return frag(html);
  }

  // renderSocial — empty #social-grid; the Social engine fills cards.
  function renderSocial(d) {
    if (!Array.isArray(d.social) || !d.social.length) return null;
    var html = '<div class="section-pane" data-pane="social" id="pane-social">' +
      '<div class="social-grid" id="social-grid"></div>' +
      '<a class="backtotop" href="#top" aria-hidden="true">↑ Contents</a>' +
    '</div>';
    return frag(html);
  }

  // renderPrintTOC — one <a> per PRESENT pane, in TOC order; NO social entry.
  function renderPrintTOC(d) {
    var mount = document.getElementById('print-toc-links');
    if (!mount) return;
    var present = presentSections(d);
    var TOC_ORDER = ['overview', 'experience', 'skills', 'education', 'certifications', 'projects'];
    TOC_ORDER.forEach(function (sec) {
      if (!present[sec]) return;
      var a = frag('<a href="#pane-' + sec + '"><span class="toc-chip"></span>' + SECTION_META[sec].label + '</a>');
      mount.appendChild(a);
    });
  }

  // renderFooter — generation date + optional company clause (null-guard).
  function renderFooter(d) {
    var mount = document.getElementById('footer-mount');
    if (!mount) return;
    var meta = d.meta || {};
    var company = (meta.target_company == null) ? '' : String(meta.target_company).trim();
    var companyClause = company ? ' · For ' + esc(company) : '';
    mount.innerHTML = 'Generated with <a href="https://github.com/oneconsciousness/job-hunt-with-hope" target="_blank" rel="noopener">Hope</a> · ' +
      esc(meta.generation_date) + companyClause;
  }

  // renderResumeView — the ATS résumé. Bullet tag is APPENDED (one <strong>).
  function renderResumeView(d) {
    var mount = document.getElementById('resume-view');
    if (!mount) return;
    var r = d.resume || {};
    var meta = d.meta || {};

    // Contact line: location · email(mailto) · phone(plain) · worded links ·
    // Portfolio anchor when the stamped head share_url is non-empty.
    var parts = r.contact_line_parts || {};
    var contactBits = [];
    if (parts.location) contactBits.push(esc(parts.location));
    if (parts.email) contactBits.push('<a href="mailto:' + esc(parts.email) + '">' + esc(parts.email) + '</a>');
    if (parts.phone) contactBits.push(esc(parts.phone));
    (Array.isArray(parts.links) ? parts.links : []).forEach(function (l) {
      if (l && l.url) contactBits.push('<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>');
    });
    var shareUrl = getCanonicalUrl();
    if (shareUrl) contactBits.push('<a href="' + esc(shareUrl) + '" target="_blank" rel="noopener">Portfolio</a>');

    var expHtml = (Array.isArray(r.experience) ? r.experience : []).map(function (e) {
      var bullets = (Array.isArray(e.bullets) ? e.bullets : []).map(function (b) {
        if (b && b.tag != null && String(b.tag).trim() !== '') {
          return '<li>' + esc(b.text) + ' <strong>' + esc(b.tag) + '</strong></li>';
        }
        // Documented fail-soft: missing tag → unbolded <li> + WARNING.
        try { console.warn('[hope-portfolio] renderResumeView: bullet missing tag: ' + String(b && b.text).slice(0, 80)); } catch (e2) {}
        return '<li>' + esc(b && b.text) + '</li>';
      }).join('');
      return '<article class="resume-entry">' +
        '<div class="resume-entry-head"><h3>' + esc(e.role_title) + '</h3>' +
          '<span class="resume-dates">' + esc(e.dates) + '</span></div>' +
        '<p class="resume-org">' + esc(e.company) + '</p>' +
        '<ul>' + bullets + '</ul>' +
      '</article>';
    }).join('');

    var eduHtml = (Array.isArray(r.education) ? r.education : []).map(function (e) {
      return '<article class="resume-entry">' +
        '<div class="resume-entry-head"><h3>' + esc(e.degree_line) + '</h3>' +
          '<span class="resume-dates">' + esc(e.dates) + '</span></div>' +
        '<p class="resume-org">' + esc(e.institution) + '</p>' +
      '</article>';
    }).join('');

    mount.innerHTML =
      '<header class="resume-header">' +
        '<h1>' + esc(meta.name) + '</h1>' +
        '<p class="resume-headline">' + esc(meta.headline) + '</p>' +
        '<p class="resume-contact">' + contactBits.join(' · ') + '</p>' +
      '</header>' +
      '<section class="resume-section"><h2>Summary</h2>' +
        '<p class="resume-summary">' + esc(r.summary) + '</p></section>' +
      '<section class="resume-section"><h2>Experience</h2>' + expHtml + '</section>' +
      '<section class="resume-section"><h2>Education</h2>' + eduHtml + '</section>' +
      '<section class="resume-section"><h2>Skills</h2>' +
        '<p class="resume-skills">' + esc(r.skills_line) + '</p></section>';
  }

  // ─── Helpers shared by grid / TOC / panes ───────────────────────────────
  function skillItemCount(d) {
    var sk = (d.skills && d.skills.categories) || {};
    var n = 0;
    Object.keys(sk).forEach(function (k) { n += (sk[k] && Array.isArray(sk[k].items)) ? sk[k].items.length : 0; });
    return n;
  }
  function presentSections(d) {
    return {
      overview: !!(d.overview && d.overview.show),
      experience: !!(Array.isArray(d.experience) && d.experience.length),
      skills: skillItemCount(d) > 0,
      education: !!(Array.isArray(d.education) && d.education.length),
      certifications: !!(Array.isArray(d.certifications) && d.certifications.length),
      projects: !!(Array.isArray(d.projects) && d.projects.length),
      social: !!(Array.isArray(d.social) && d.social.length)
    };
  }

  // renderPanes — appends .section-pane nodes DIRECTLY into .wrap (no wrapper),
  // after the section-grid and before #footer-mount, in canonical print order.
  // Sets the first present pane (.section-pane.active) + its .section-btn.active
  // deterministically during the build pass (no flash-of-nothing).
  function renderPanes(d) {
    var wrap = document.querySelector('.wrap');
    var footer = document.getElementById('footer-mount');
    if (!wrap) return;
    var builders = [
      ['overview', renderOverview],
      ['experience', renderExperience],
      ['skills', renderSkills],
      ['education', renderEducation],
      ['certifications', renderCertifications],
      ['projects', renderProjects],
      ['social', renderSocial]
    ];
    var firstActive = null;
    builders.forEach(function (b) {
      var node = b[1](d);
      if (!node) return;
      wrap.insertBefore(node, footer || null);
      if (!firstActive) {
        firstActive = b[0];
        node.classList.add('active');
        var btn = document.querySelector('.section-btn[data-section="' + b[0] + '"]');
        if (btn) btn.classList.add('active');
      }
    });
    return firstActive;
  }

  // ─── Share helpers needed by renderResumeView (Portfolio anchor) + wiring ─
  function getCanonicalUrl() {
    var meta = document.querySelector('meta[name="hope:share-url"]');
    return meta && meta.content ? meta.content.trim() : '';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // (B) BOOTSTRAP — render structural DOM first, then wire behavior (§C.4)
  // ═══════════════════════════════════════════════════════════════════════

  var HOPE = window.HOPE_DATA || {};

  // 1. schema_version guard — best-effort on skew.
  if (HOPE.schema_version !== 2) {
    try { console.warn('[hope-portfolio] schema_version is ' + HOPE.schema_version + ', expected 2 — rendering best-effort.'); } catch (e) {}
  }

  // 2. Theme applied before paint (re-applied idempotently below by the toggle
  //    wiring; the inline head IIFE already set it pre-script).
  var STORAGE_KEY = 'hope-portfolio-theme';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }
  (function () {
    var savedTheme = 'light';
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') savedTheme = stored;
    } catch (e) {}
    applyTheme(savedTheme);
  })();

  // 3. Render all structural DOM. Order matters: identity removes .seo-fallback
  //    and builds .identity-row before #throughline; grid before panes (so the
  //    first-pane .active pass can flip its .section-btn); footer before panes
  //    are inserted-before-footer; resume-view last.
  renderIdentity(HOPE);
  renderSectionGrid(HOPE);
  renderPrintTOC(HOPE);
  renderFooter(HOPE);          // exists before renderPanes inserts panes before it
  var firstPane = renderPanes(HOPE);
  renderResumeView(HOPE);

  // 4. Default-open correction (idempotent — panes already set one active).
  (function () {
    var want = (HOPE.overview && HOPE.overview.show) ? 'overview'
             : (firstPane || 'experience');
    var anyActive = document.querySelector('.section-pane.active');
    if (!anyActive) {
      var pane = document.querySelector('.section-pane[data-pane="' + want + '"]');
      if (pane) {
        pane.classList.add('active');
        var btn = document.querySelector('.section-btn[data-section="' + want + '"]');
        if (btn) btn.classList.add('active');
      }
    }
  })();

  // 5. THEME TOGGLE
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // 5. SHARE — #share-btn opens the #share-menu popover.
  var shareBtn = document.getElementById('share-btn');
  var shareMenu = document.getElementById('share-menu');
  var shareLabel = shareBtn ? shareBtn.querySelector('span') : null;
  if (shareLabel) shareLabel.dataset.idle = shareLabel.textContent;
  var flash = function (text, ok) {
    if (shareLabel) shareLabel.textContent = text;
    if (ok) shareBtn.classList.add('copied');
    setTimeout(function () {
      if (shareLabel) shareLabel.textContent = shareLabel.dataset.idle;
      shareBtn.classList.remove('copied');
    }, 1600);
  };
  var getShareUrl = function () { return getCanonicalUrl() || window.location.href; };
  var canShare = function () {
    if (getCanonicalUrl()) return true;
    var u = window.location.href;
    if (u.indexOf('file:') === 0) return false;
    return !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(u);
  };
  var getName = function () {
    var el = document.querySelector('h1.name');
    return el ? el.textContent.trim() : '';
  };
  var getShareText = function () {
    var el = document.querySelector('.headline');
    var headline = el ? el.textContent.trim() : '';
    return headline ? getName() + ' — ' + headline : getName();
  };
  var copyFallback = function (url) {
    try {
      var ta = document.createElement('textarea');
      ta.value = url; ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, url.length);
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      flash(ok ? 'Copied!' : 'Copy: ' + url, ok);
    } catch (e) { flash('Copy: ' + url, false); }
  };
  var copyShareUrl = function () {
    var canonical = getCanonicalUrl();
    var url = canonical || window.location.href;
    if (!canShare()) { flash('Publish first to share a link', false); return; }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(
        function () { flash('Copied!', true); },
        function () { copyFallback(url); }
      );
      return;
    }
    copyFallback(url);
  };
  var closeShareMenu = function () {
    if (shareMenu && !shareMenu.hidden) {
      shareMenu.hidden = true;
      if (shareBtn) shareBtn.setAttribute('aria-expanded', 'false');
    }
  };
  if (shareBtn && shareMenu) {
    shareBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (shareMenu.hidden) {
        shareMenu.hidden = false;
        shareBtn.setAttribute('aria-expanded', 'true');
      } else {
        closeShareMenu();
      }
    });
    shareMenu.addEventListener('click', function (e) {
      var item = e.target.closest('[data-share]');
      if (!item) return;
      var action = item.getAttribute('data-share');
      closeShareMenu();
      if (action === 'copy') { copyShareUrl(); return; }
      if (!canShare()) { flash('Publish first to share a link', false); return; }
      var url = getShareUrl();
      var text = getShareText();
      var href = '';
      if (action === 'linkedin') {
        href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
      } else if (action === 'x') {
        href = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
      } else if (action === 'whatsapp') {
        href = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url);
      } else if (action === 'email') {
        href = 'mailto:?subject=' + encodeURIComponent(getName() + ' — Portfolio') +
               '&body=' + encodeURIComponent(text) + '%0D%0A%0D%0A' + encodeURIComponent(url);
      }
      if (href) window.open(href, '_blank', 'noopener');
    });
    document.addEventListener('click', function (e) {
      if (!shareMenu.hidden && !e.target.closest('.share-wrap')) closeShareMenu();
    });
  }

  // 5. SAVE AS PDF — résumé-only export (modal is static; #resume-view filled).
  var pdfBtn = document.getElementById('pdf-btn');
  var exportModal = document.getElementById('export-modal');
  var resumeView = document.getElementById('resume-view');

  var RESUME_MIN_BODY_PT = 10;
  var RESUME_MIN_LEADING = 1.2;
  var RESUME_BASE_PT = { classic: 11, modern: 10.5, compact: 10 };
  var RESUME_PREF_KEY = 'hope-resume-pref';
  var RESUME_STYLES = ['classic', 'modern', 'compact'];
  var RESUME_FONTS = ['georgia', 'times', 'inter'];
  var RESUME_FITS = ['comfortable', 'auto'];
  var RESUME_FONT_STACKS = {
    georgia: "Georgia, 'Times New Roman', serif",
    times: "'Times New Roman', Times, serif",
    inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };
  var RESUME_DEFAULT_FONT = { classic: 'georgia', modern: 'inter', compact: 'inter' };
  var readResumePref = function () {
    var pref = { style: 'classic', font: '', fit: 'comfortable' };
    try {
      var raw = localStorage.getItem(RESUME_PREF_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && RESUME_STYLES.indexOf(p.style) !== -1) pref.style = p.style;
        if (p && RESUME_FONTS.indexOf(p.font) !== -1) pref.font = p.font;
        if (p && RESUME_FITS.indexOf(p.fit) !== -1) pref.fit = p.fit;
      }
    } catch (e) {}
    if (!pref.font) pref.font = RESUME_DEFAULT_FONT[pref.style] || 'georgia';
    return pref;
  };

  /* PORTFOLIO PDF — gated for the next release; plumbing kept intact, no UI
     path reaches it this release. */
  var EXPORT_PREF_KEY = 'hope-export-pref';
  var EXPORT_STYLES = { portfolio: ['classic', 'ink', 'showcase'], resume: ['classic', 'modern', 'compact'] };
  var EXPORT_LAYOUTS = ['continuous', 'paginated'];
  var readExportPref = function () {
    var pref = { doc: 'portfolio', style: 'classic', layout: 'continuous' };
    try {
      var raw = localStorage.getItem(EXPORT_PREF_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && EXPORT_STYLES[p.doc]) {
          pref.doc = p.doc;
          if (EXPORT_STYLES[p.doc].indexOf(p.style) !== -1) pref.style = p.style;
          if (EXPORT_LAYOUTS.indexOf(p.layout) !== -1) pref.layout = p.layout;
        }
      }
    } catch (e) {}
    return pref;
  };
  var CONT_PAGE_W_PX = 816;
  var CONT_MAX_H_PX = 19200;
  var disableContinuousPrint = function () {
    document.body.classList.remove('print-continuous');
    document.body.style.width = '';
    var stale = document.getElementById('continuous-page');
    if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
  };
  var enableContinuousPrint = function () {
    disableContinuousPrint();
    unmountRails();
    document.body.classList.add('print-continuous');
    document.body.style.width = CONT_PAGE_W_PX + 'px';
    void document.body.offsetHeight;
    var h = Math.ceil(document.documentElement.scrollHeight) + 1;
    if (h > CONT_MAX_H_PX) h = CONT_MAX_H_PX;
    var pageStyle = document.createElement('style');
    pageStyle.id = 'continuous-page';
    pageStyle.textContent = '@page { size: ' + CONT_PAGE_W_PX + 'px ' + h + 'px; margin: 0; }';
    document.head.appendChild(pageStyle);
  };
  /* end PORTFOLIO PDF gate */

  // ── Resume auto-fit ──
  var RESUME_PAGE_CONTENT_W_PX = 816 - 2 * (0.55 * 96); // 710.4
  var RESUME_PAGE_CONTENT_H_PX = 1056 - 2 * (0.5 * 96); // 960
  var RESUME_RFS_STEP = 0.02;
  var measureResumePages = function () {
    void resumeView.offsetHeight;
    return Math.max(1, Math.ceil(resumeView.scrollHeight / RESUME_PAGE_CONTENT_H_PX));
  };
  var runResumeAutoFit = function (style) {
    var basePt = RESUME_BASE_PT[style] || RESUME_BASE_PT.classic;
    var floorScale = RESUME_MIN_BODY_PT / basePt;
    document.body.style.width = RESUME_PAGE_CONTENT_W_PX + 'px';
    resumeView.style.setProperty('--rfs', '1');
    var startPages = measureResumePages();
    if (startPages <= 1) return;
    var targetPages = Math.max(1, startPages - 1);
    var scale = 1;
    while (scale > floorScale) {
      scale = Math.max(floorScale, +(scale - RESUME_RFS_STEP).toFixed(4));
      resumeView.style.setProperty('--rfs', String(scale));
      if (measureResumePages() <= targetPages) return;
    }
  };
  var checkedValue = function (name) {
    var el = exportModal ? exportModal.querySelector('input[name="' + name + '"]:checked') : null;
    return el ? el.value : '';
  };
  var syncExportUI = function () {
    exportModal.querySelectorAll('.export-opt').forEach(function (opt) {
      var input = opt.querySelector('input');
      opt.classList.toggle('selected', !!(input && input.checked));
    });
  };
  var closeExportModal = function () { if (exportModal) exportModal.hidden = true; };
  if (pdfBtn && exportModal && resumeView) {
    pdfBtn.addEventListener('click', function () {
      var pref = readResumePref();
      var styleRadio = exportModal.querySelector('input[name="export-style-resume"][value="' + pref.style + '"]');
      if (styleRadio) styleRadio.checked = true;
      var fontRadio = exportModal.querySelector('input[name="export-font-resume"][value="' + pref.font + '"]');
      if (fontRadio) fontRadio.checked = true;
      var fitRadio = exportModal.querySelector('input[name="export-fit-resume"][value="' + pref.fit + '"]');
      if (fitRadio) fitRadio.checked = true;
      syncExportUI();
      exportModal.hidden = false;
    });
    exportModal.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'export-style-resume') {
        var def = RESUME_DEFAULT_FONT[e.target.value] || 'georgia';
        var defRadio = exportModal.querySelector('input[name="export-font-resume"][value="' + def + '"]');
        if (defRadio) defRadio.checked = true;
      }
      syncExportUI();
    });
    exportModal.addEventListener('click', function (e) {
      if (e.target.closest('[data-export-close]')) closeExportModal();
    });
    document.getElementById('export-confirm').addEventListener('click', function () {
      var style = checkedValue('export-style-resume') || 'classic';
      var font = checkedValue('export-font-resume') || RESUME_DEFAULT_FONT[style] || 'georgia';
      var fit = checkedValue('export-fit-resume') || 'comfortable';
      try { localStorage.setItem(RESUME_PREF_KEY, JSON.stringify({ style: style, font: font, fit: fit })); } catch (e) {}
      document.body.classList.add('print-doc-resume', 'print-style-' + style);
      resumeView.style.setProperty('--resume-font', RESUME_FONT_STACKS[font] || RESUME_FONT_STACKS.georgia);
      closeExportModal();
      if (fit === 'auto') runResumeAutoFit(style);
      window.print();
    });
    window.addEventListener('afterprint', function () {
      var stale = [];
      document.body.classList.forEach(function (c) {
        if (c.indexOf('print-doc-') === 0 || c.indexOf('print-style-') === 0) stale.push(c);
      });
      stale.forEach(function (c) { document.body.classList.remove(c); });
      resumeView.style.removeProperty('--rfs');
      resumeView.style.removeProperty('--resume-font');
      document.body.style.width = '';
      disableContinuousPrint();
    });
  }

  // 5. ESCAPE — close modal + share menu.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (exportModal && !exportModal.hidden) closeExportModal();
    closeShareMenu();
  });

  // 6. SECTION-TAB SWITCHING (binds JS-rendered .section-btn / .section-pane).
  document.querySelectorAll('.section-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-section');
      document.querySelectorAll('.section-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
      document.querySelectorAll('.section-pane').forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-pane') === target); });
    });
  });

  // 6. CARD EXPAND / COLLAPSE (binds JS-rendered .item-card[data-expand]).
  document.querySelectorAll('.item-card[data-expand] .item-head').forEach(function (head) {
    head.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      head.closest('.item-card').classList.toggle('expanded');
    });
  });

  // ── 7. THE SPOTLIGHT — show-before-you-ask (#spotlight=<key> hash) ──
  (function () {
    var SPOTLIGHT = {
      timeline: { sel: '#throughline' },
      highlights: { sel: '#pane-overview', pane: 'overview' },
      share: { sel: '#share-btn' },
      pdf: { sel: '#pdf-btn' },
      photo: { sel: '#photo-upload' },
      summary: { sel: '.summary' },
      experience: { sel: '.section-pane[data-pane="experience"]', pane: 'experience' },
      skills: { sel: '.section-pane[data-pane="skills"]', pane: 'skills' },
      education: { sel: '.section-pane[data-pane="education"]', pane: 'education' },
      certifications: { sel: '.section-pane[data-pane="certifications"]', pane: 'certifications' },
      projects: { sel: '.section-pane[data-pane="projects"]', pane: 'projects' },
      social: { sel: '.section-pane[data-pane="social"]', pane: 'social' }
    };
    var spotEl = null;
    var spotCleanup = null;
    var spotTimer = 0;
    function clearSpotlightHash() {
      try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
    }
    function playSpotlight() {
      var m = /^#spotlight=([a-z]+)$/.exec(window.location.hash || '');
      var entry = m && SPOTLIGHT.hasOwnProperty(m[1]) ? SPOTLIGHT[m[1]] : null;
      if (!entry) return;
      var el = document.querySelector(entry.sel);
      if (!el) { clearSpotlightHash(); return; }
      if (entry.pane) {
        var paneBtn = document.querySelector('.section-btn[data-section="' + entry.pane + '"]');
        if (paneBtn) paneBtn.click();
      }
      if (el.getClientRects().length === 0) { clearSpotlightHash(); return; }
      var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      if (spotTimer) { clearTimeout(spotTimer); spotTimer = 0; }
      if (spotCleanup) { spotCleanup(); spotCleanup = null; }
      if (spotEl && spotEl !== el) spotEl.classList.remove('hope-spotlight');
      el.classList.remove('hope-spotlight');
      void el.offsetWidth;
      el.classList.add('hope-spotlight');
      spotEl = el;
      var engaged = false, flashesLeft = 2;
      var ENGAGE_EVENTS = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown'];
      function spotTeardown() {
        el.removeEventListener('animationiteration', onIter);
        ENGAGE_EVENTS.forEach(function (t) { window.removeEventListener(t, onEngage, true); });
      }
      function spotDone() {
        el.classList.remove('hope-spotlight');
        if (spotTimer) { clearTimeout(spotTimer); spotTimer = 0; }
        spotTeardown(); spotCleanup = null; spotEl = null;
      }
      function onIter() { if (engaged && --flashesLeft <= 0) spotDone(); }
      function onEngage() { engaged = true; ENGAGE_EVENTS.forEach(function (t) { window.removeEventListener(t, onEngage, true); }); }
      spotCleanup = spotTeardown;
      el.addEventListener('animationiteration', onIter);
      ENGAGE_EVENTS.forEach(function (t) { window.addEventListener(t, onEngage, true); });
      spotTimer = setTimeout(spotDone, 60000);
      clearSpotlightHash();
    }
    window.setTimeout(playSpotlight, 0);
    window.addEventListener('hashchange', playSpotlight);
  })();

  // ── 8. WIDE-SCREEN RAILS (≥1440px) — minimal JS relocation ──
  // Operates on the JS-rendered .identity-card > .identity-row > .identity-info,
  // #photo-upload, #throughline. unmountRails is a function DECLARATION so the
  // continuous-print engine above can call it (hoisted).
  var railsMql = window.matchMedia ? window.matchMedia('(min-width: 1440px)') : null;
  var railInfo = document.querySelector('.identity-card > .identity-row > .identity-info');
  var railInfoHome = railInfo ? railInfo.parentNode : null; // .identity-row
  var railInfoNext = railInfo ? railInfo.nextSibling : null;
  var railPhoto = document.getElementById('photo-upload');
  var railPhotoHome = railPhoto ? railPhoto.parentNode : null; // .identity-row
  var railPhotoNext = railPhoto ? railPhoto.nextSibling : null;
  // The About bio (.summary) lives inside .identity-info at narrow widths. At
  // wide (≥1440px) it is lifted OUT of the identity rail entirely and parked at
  // the TOP of the RIGHT column, above the apps grid — so the left rail stays
  // identity-only. Capture its home slot so unmountRails restores it exactly.
  var railSummary = railInfo ? railInfo.querySelector('.summary') : null;
  var railSummaryHome = railSummary ? railSummary.parentNode : null; // .identity-info
  var railSummaryNext = railSummary ? railSummary.nextSibling : null;
  var railSectionGrid = document.getElementById('section-grid-mount');
  var railSectionGridHome = railSectionGrid ? railSectionGrid.parentNode : null; // .wrap
  var railSectionGridNext = railSectionGrid ? railSectionGrid.nextSibling : null;
  var railAside = null;
  var railAbout = null; // the RIGHT-column aside: About bio above the apps grid
  function mountEyebrows() {
    var strip = document.querySelector('.identity-card > .tl-strip');
    if (!strip) return;
    var prev = strip.previousElementSibling;
    if (prev && prev.classList.contains('tl-rail-eyebrow')) return;
    var eb = document.createElement('div');
    eb.className = 'tl-rail-eyebrow';
    eb.setAttribute('aria-hidden', 'true');
    eb.textContent = 'Career Timeline';
    strip.parentNode.insertBefore(eb, strip);
  }
  function unmountEyebrows() {
    var eb = document.querySelector('.tl-rail-eyebrow');
    if (eb && eb.parentNode) eb.parentNode.removeChild(eb);
  }
  function mountRails() {
    if (!railInfo || !railInfoHome) return;
    var wrap = document.querySelector('.wrap');
    if (!railAside) {
      railAside = document.createElement('aside');
      railAside.className = 'summary-rail';
      railAside.setAttribute('aria-label', 'Profile');
    }
    if (!railAside.parentNode && wrap) wrap.appendChild(railAside);
    if (railPhoto && railPhoto.parentNode !== railAside) railAside.appendChild(railPhoto);
    if (railInfo.parentNode !== railAside) railAside.appendChild(railInfo);
    // RIGHT column: lift the About bio out of the identity rail and stack it
    // ABOVE the apps grid. The .about-rail aside holds the bio then the
    // section-grid so both share grid-column 3 and read top→bottom.
    if (railSummary && railSectionGrid) {
      if (!railAbout) {
        railAbout = document.createElement('aside');
        railAbout.className = 'about-rail';
        railAbout.setAttribute('aria-label', 'About');
      }
      if (!railAbout.parentNode && wrap) wrap.appendChild(railAbout);
      if (railSummary.parentNode !== railAbout) railAbout.appendChild(railSummary);
      if (railSectionGrid.parentNode !== railAbout) railAbout.appendChild(railSectionGrid);
    }
    mountEyebrows();
  }
  function unmountRails() {
    if (railInfo && railInfoHome && railInfo.parentNode !== railInfoHome) railInfoHome.insertBefore(railInfo, railInfoNext);
    if (railPhoto && railPhotoHome && railPhoto.parentNode !== railPhotoHome) railPhotoHome.insertBefore(railPhoto, railPhotoNext);
    // Restore the apps grid as a direct .wrap child, then drop the About bio
    // back inside .identity-info at its exact original slot.
    if (railSectionGrid && railSectionGridHome && railSectionGrid.parentNode !== railSectionGridHome) railSectionGridHome.insertBefore(railSectionGrid, railSectionGridNext);
    if (railSummary && railSummaryHome && railSummary.parentNode !== railSummaryHome) railSummaryHome.insertBefore(railSummary, railSummaryNext);
    unmountEyebrows();
    if (railAside && railAside.parentNode) railAside.parentNode.removeChild(railAside);
    if (railAbout && railAbout.parentNode) railAbout.parentNode.removeChild(railAbout);
  }
  function syncRails() {
    if (railsMql && railsMql.matches) mountRails(); else unmountRails();
  }
  syncRails();
  if (railsMql) {
    if (railsMql.addEventListener) railsMql.addEventListener('change', syncRails);
    else if (railsMql.addListener) railsMql.addListener(syncRails);
  }
  window.addEventListener('beforeprint', unmountRails);
  window.addEventListener('afterprint', syncRails);

  // ── 9. PHOTO upload / remove ──
  var PHOTO_KEY = 'hope_headshot_data_url';
  var photoInput = document.getElementById('photo-input');
  var photoPreview = document.getElementById('photo-preview');
  var photoUpload = document.getElementById('photo-upload');
  var photoRemove = document.getElementById('photo-remove');
  var bakedPhoto = (photoPreview && photoPreview.getAttribute('src')) || '';
  function setPhoto(dataUrl) {
    if (dataUrl) { photoPreview.src = dataUrl; photoUpload.classList.add('has-photo'); }
    else { photoPreview.removeAttribute('src'); photoUpload.classList.remove('has-photo'); }
  }
  if (photoPreview) { if (bakedPhoto) setPhoto(bakedPhoto); else setPhoto(null); }
  if (photoInput && isPublished) {
    photoInput.disabled = true;
  }
  if (photoInput && !isPublished) {
    photoInput.addEventListener('change', function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        setPhoto(ev.target.result);
        try { localStorage.setItem(PHOTO_KEY, ev.target.result); } catch (e) {}
      };
      reader.readAsDataURL(file);
    });
    try { var stored = localStorage.getItem(PHOTO_KEY); if (stored) setPhoto(stored); } catch (e) {}
  }
  if (photoRemove && !isPublished) {
    photoRemove.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      try { localStorage.removeItem(PHOTO_KEY); } catch (e2) {}
      setPhoto(bakedPhoto || null);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 10. SOCIAL ENGINE — preserved. Renders HOPE_DATA.social into #social-grid,
  //     the Overview "Latest from" / "Highlights" strips, and contact-row pills.
  //     Uses the hoisted esc / handle / loadScript (no private copies).
  // ═══════════════════════════════════════════════════════════════════════
  (function () {
    var grid = document.getElementById('social-grid');
    var latestEl = document.getElementById('overview-latest');
    var hlEl = document.getElementById('overview-highlights');
    var posts = (window.HOPE_DATA && Array.isArray(window.HOPE_DATA.social)) ? window.HOPE_DATA.social : [];
    var timeline = (window.HOPE_DATA && Array.isArray(window.HOPE_DATA.timeline)) ? window.HOPE_DATA.timeline : [];
    if (!grid && !latestEl && !hlEl) return;

    var P = {
      youtube:    { name: 'YouTube',     cls: 'iframe', h: 220, src: function (u) { var m = u.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/); return m ? 'https://www.youtube.com/embed/' + m[1] : null; } },
      vimeo:      { name: 'Vimeo',       cls: 'iframe', h: 220, src: function (u) { var m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? 'https://player.vimeo.com/video/' + m[1] : null; } },
      spotify:    { name: 'Spotify',     cls: 'iframe', h: 152, src: function (u) { var m = u.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/(\w+)/); return m ? 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] : null; } },
      soundcloud: { name: 'SoundCloud',  cls: 'iframe', h: 166, src: function (u) { return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u) + '&color=%23d97706&visual=false'; } },
      applemusic: { name: 'Apple Music', cls: 'iframe', h: 175, src: function (u) { return u.replace('music.apple.com', 'embed.music.apple.com'); } },
      figma:      { name: 'Figma',       cls: 'iframe', h: 300, src: function (u) { return 'https://www.figma.com/embed?embed_host=hope&url=' + encodeURIComponent(u); } },
      codepen:    { name: 'CodePen',     cls: 'iframe', h: 300, src: function (u) { var m = u.match(/codepen\.io\/([^\/]+)\/(?:pen|details)\/(\w+)/); return m ? 'https://codepen.io/' + m[1] + '/embed/' + m[2] + '?default-tab=result' : null; } },
      loom:       { name: 'Loom',        cls: 'iframe', h: 240, src: function (u) { return u.indexOf('/embed/') > -1 ? u : u.replace('/share/', '/embed/'); } },
      bluesky:    { name: 'Bluesky',     cls: 'iframe', h: 300, src: function (u) { var m = u.match(/bsky\.app\/profile\/([^\/]+)\/post\/(\w+)/); return m ? 'https://embed.bsky.app/embed/' + m[1] + '/app.bsky.feed.post/' + m[2] : null; } },
      linkedin:   { name: 'LinkedIn',    cls: 'iframe', h: 320, src: function (u) { var m = u.match(/(urn:li:(?:share|ugcPost|activity):[\w-]+)/) || u.match(/activity-(\d+)/); return m ? 'https://www.linkedin.com/embed/feed/update/' + (m[1].indexOf('urn:') === 0 ? m[1] : 'urn:li:activity:' + m[1]) : null; } },
      substack:   { name: 'Substack',    cls: 'iframe', h: 320, src: function (u) { return u; } },
      flickr:     { name: 'Flickr',      cls: 'iframe', h: 280, src: function (u) { return u; } },
      tiktok:     { name: 'TikTok',      cls: 'script', script: 'https://www.tiktok.com/embed.js', block: function (u) { var m = u.match(/video\/(\d+)/); return '<blockquote class="tiktok-embed" cite="' + esc(u) + '"' + (m ? ' data-video-id="' + m[1] + '"' : '') + ' style="max-width:325px;min-width:240px"><a href="' + esc(u) + '"></a></blockquote>'; } },
      instagram:  { name: 'Instagram',   cls: 'script', script: '//www.instagram.com/embed.js', global: 'instgrm', process: function () { window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process(); }, block: function (u) { return '<blockquote class="instagram-media" data-instgrm-permalink="' + esc(u) + '" data-instgrm-version="14"></blockquote>'; } },
      x:          { name: 'X',           cls: 'script', script: 'https://platform.twitter.com/widgets.js', block: function (u) { return '<blockquote class="twitter-tweet"><a href="' + esc(String(u).replace('//x.com', '//twitter.com')) + '"></a></blockquote>'; } },
      threads:    { name: 'Threads',     cls: 'script', script: 'https://www.threads.net/embed.js', block: function (u) { return '<blockquote class="text-post-media" data-text-post-permalink="' + esc(u) + '"></blockquote>'; } },
      pinterest:  { name: 'Pinterest',   cls: 'script', script: '//assets.pinterest.com/js/pinit.js', block: function (u) { return '<a data-pin-do="embedPin" href="' + esc(u) + '"></a>'; } },
      dribbble:   { name: 'Dribbble',    cls: 'link' },
      behance:    { name: 'Behance',     cls: 'link' },
      medium:     { name: 'Medium',      cls: 'link' },
      gist:       { name: 'GitHub',      cls: 'link' },
      link:       { name: 'Link',        cls: 'link' }
    };

    var B = {
      youtube:    { c: '#FF0000', i: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>' },
      vimeo:      { c: '#1AB7EA', i: '<path d="M23.9765 6.4168c-.105 2.338-1.739 5.5429-4.894 9.6088-3.2679 4.247-6.0258 6.3699-8.2898 6.3699-1.409 0-2.578-1.294-3.553-3.881l-1.9179-7.1138c-.719-2.584-1.488-3.878-2.312-3.878-.179 0-.806.378-1.881 1.132L0 7.3008c1.185-1.042 2.351-2.084 3.501-3.128C5.08 2.8169 6.266 2.0769 7.055 2.0049c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.5069.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.794 2.265-2.385 1.004-1.589 1.54-2.798 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797z"/>' },
      spotify:    { c: '#1DB954' },
      soundcloud: { c: '#FF5500' },
      applemusic: { c: '#FA243C' },
      figma:      { c: '#F24E1E' },
      codepen:    { c: '#0EA5E9' },
      loom:       { c: '#625DF5' },
      bluesky:    { c: '#0085FF' },
      linkedin:   { c: '#0A66C2', i: '<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>' },
      substack:   { c: '#FF6719' },
      flickr:     { c: '#0063DC' },
      tiktok:     { c: '#EE1D52' },
      instagram:  { c: '#E1306C', i: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>' },
      x:          { c: '#0F1419', i: '<path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>' },
      threads:    { c: '#000000' },
      pinterest:  { c: '#BD081C' },
      dribbble:   { c: '#EA4C89', i: '<path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"/>' },
      behance:    { c: '#1769FF', i: '<path d="M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z"/>' },
      medium:     { c: '#12100E', i: '<path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>' },
      gist:       { c: '#181717', i: '<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>' },
      link:       { c: '#D97706', i: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>' }
    };
    function chip(key, name) {
      var b = B[key] || B.link;
      var glyph = b.i ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + b.i + '</svg>'
                      : '<span class="social-letter">' + esc((name || '?').charAt(0)) + '</span>';
      return '<span class="social-chip" style="background:' + b.c + '">' + glyph + '</span>';
    }
    function brandColor(key) { return (B[key] || B.link).c; }
    var POST_RE = {
      tiktok: /\/video\/\d+/, instagram: /\/(p|reel|reels|tv)\//,
      x: /\/status\/\d+/, threads: /\/(post|t)\//, pinterest: /\/pin\//
    };

    var needsProcess = {};
    var EMBEDS_OK = (location.protocol === 'http:' || location.protocol === 'https:');
    function processEmbeds() {
      Object.keys(needsProcess).forEach(function (k) {
        var cfg = needsProcess[k];
        if (window[cfg.global]) { try { cfg.process(); } catch (e) {} }
      });
    }
    function reprocessEmbeds() {
      try { if (window.twttr && window.twttr.widgets) window.twttr.widgets.load(); } catch (e) {}
      try { if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process(); } catch (e) {}
    }
    function lazyEmbed(holder, fill) { holder.__loadEmbed = function () { holder.__loadEmbed = null; fill(); }; }
    var STAGGER_MS = 300, stagT = 0;
    function loadStaggered(holders, i) {
      if (i >= holders.length) { reprocessEmbeds(); stagT = 0; return; }
      var h = holders[i];
      if (h && h.__loadEmbed) h.__loadEmbed();
      stagT = setTimeout(function () { loadStaggered(holders, i + 1); }, STAGGER_MS);
    }
    function fillVisible() {
      var pend = [];
      document.querySelectorAll('.social-embed[data-embed-pending]').forEach(function (h) {
        if (h.offsetParent !== null && h.__loadEmbed) pend.push(h);
      });
      pend.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
      if (stagT) { clearTimeout(stagT); stagT = 0; }
      loadStaggered(pend, 0);
    }
    var fvT = 0;
    function fillVisibleSoon() { if (fvT) return; fvT = setTimeout(function () { fvT = 0; fillVisible(); }, 80); }

    function buildSocialCard(post) {
      var key = String(post.platform || 'link').toLowerCase();
      var cfg = P[key] || P.link;
      var url = String(post.url);
      var name = cfg.name;
      var embedHTML = null, embedScript = null, embedH = cfg.h || 240;
      if (cfg.cls === 'iframe') {
        var src = null; try { src = cfg.src(url); } catch (e) { src = null; }
        if (src) embedHTML = '<iframe src="' + esc(src) + '" height="' + embedH
          + '" loading="lazy" frameborder="0" scrolling="no" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write" allowfullscreen title="' + esc(name) + ' embed"></iframe>';
      } else if (cfg.cls === 'script' && (!POST_RE[key] || POST_RE[key].test(url))) {
        try { embedHTML = cfg.block(url); } catch (e) { embedHTML = null; }
        if (embedHTML) embedScript = cfg.script;
      }
      var card = document.createElement('article');
      var meta = '<span class="social-meta"><span class="social-plat">' + esc(name) + '</span>'
        + (post.caption ? '<span class="social-cap">' + esc(post.caption) + '</span>' : '');
      var head = '<div class="social-head">' + chip(key, name) + meta + '</span></div>';
      var viewLink = '<a class="social-link" href="' + esc(url) + '" target="_blank" rel="noopener">'
        + esc(post.title || ('View on ' + name)) + '<span class="material-symbols-rounded ext">open_in_new</span></a>';
      if (embedHTML != null && EMBEDS_OK) {
        card.className = 'social-card social-' + key + ' social-cls-embed';
        card.innerHTML = head + '<div class="social-embed" data-embed-pending style="min-height:' + embedH + 'px"><div class="embed-loader" aria-hidden="true"><span></span><span></span><span></span><span></span></div></div>' + viewLink;
        var holder = card.querySelector('.social-embed');
        lazyEmbed(holder, function () {
          var loader = holder.querySelector('.embed-loader');
          holder.insertAdjacentHTML('afterbegin', embedHTML);
          if (embedScript) { loadScript(embedScript); if (cfg.process) { needsProcess[key] = cfg; setTimeout(processEmbeds, 120); setTimeout(processEmbeds, 1500); } }
          var settled = false, mo = null, poll = null;
          function finish(ok) {
            if (settled) return; settled = true;
            if (mo) mo.disconnect(); if (poll) clearInterval(poll);
            holder.removeAttribute('data-embed-pending');
            if (ok) { if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }
            else { holder.innerHTML = '<a class="social-embed-static" href="' + esc(url) + '" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span>View on ' + esc(name) + '</a>'; }
          }
          function check() { var f = holder.querySelector('iframe'); if (f && f.clientHeight > 40) finish(true); }
          function onload() { setTimeout(check, 250); }
          var fr0 = holder.querySelector('iframe'); if (fr0) fr0.addEventListener('load', onload);
          mo = new MutationObserver(function () { var f = holder.querySelector('iframe'); if (f) { f.addEventListener('load', onload); check(); } });
          mo.observe(holder, { childList: true, subtree: true });
          poll = setInterval(check, 500);
          setTimeout(function () { finish(false); }, 6000);
        });
      } else if (embedHTML != null) {
        card.className = 'social-card social-' + key + ' social-cls-embed social-cls-static';
        card.innerHTML = head + '<a class="social-embed-static" href="' + esc(url) + '" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span>View on ' + esc(name) + '</a>';
      } else {
        card.className = 'social-card social-' + key + ' social-cls-profile';
        card.innerHTML = '<a class="social-profile" href="' + esc(url) + '" target="_blank" rel="noopener" style="--brand:' + brandColor(key) + '">'
          + chip(key, name) + meta + '<span class="social-handle">' + esc(handle(url)) + '</span></span>'
          + '<span class="social-go material-symbols-rounded">arrow_outward</span></a>';
      }
      return card;
    }

    var FT_LABEL = { experience: 'Experience', project: 'Project', education: 'Education', certification: 'Certification' };
    var FT_COLOR = { experience: 'var(--app-experience)', project: 'var(--app-projects)', education: 'var(--app-education)', certification: 'var(--app-certifications)' };
    var FT_ICON = { experience: 'work', project: 'rocket_launch', education: 'school', certification: 'verified' };
    function buildFeatureCard(e) {
      var type = String(e.type || 'experience').toLowerCase();
      var sub = [e.org, e.metric].filter(Boolean).map(String).join(' · ');
      var a = document.createElement('a');
      a.className = 'feature-card feature-' + type;
      a.href = '#' + String(e.anchor || ('tl-' + e.id));
      a.setAttribute('data-jump', String(e.anchor || ('tl-' + e.id)));
      a.setAttribute('data-pane', String(e.pane || 'experience'));
      a.style.setProperty('--accent', FT_COLOR[type] || 'var(--accent-slate)');
      a.innerHTML = '<span class="feature-chip">'
        + (e.domain ? '<img src="https://www.google.com/s2/favicons?domain=' + esc(String(e.domain)) + '&sz=64" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'\'">' : '')
        + '<span class="material-symbols-rounded"' + (e.domain ? ' style="display:none"' : '') + '>' + (FT_ICON[type] || 'work') + '</span></span>'
        + '<span class="feature-body"><span class="feature-kicker">' + esc(FT_LABEL[type] || type) + '</span>'
        + '<span class="feature-title">' + esc(e.label || '') + '</span>'
        + (sub ? '<span class="feature-sub">' + esc(sub) + '</span>' : '') + '</span>'
        + '<span class="feature-go material-symbols-rounded">arrow_forward</span>';
      return a;
    }
    var valid = function (p) { return p && typeof p === 'object' && p.url; };

    if (grid) posts.filter(valid).forEach(function (post) { grid.appendChild(buildSocialCard(post)); });

    function isEmbeddable(p) {
      if (!valid(p)) return false;
      var k = String(p.platform || 'link').toLowerCase();
      var cfg = P[k];
      if (!cfg) return false;
      if (cfg.cls === 'iframe') { try { return !!cfg.src(String(p.url)); } catch (e) { return false; } }
      if (cfg.cls === 'script') { return !POST_RE[k] || POST_RE[k].test(String(p.url)); }
      return false;
    }
    function platLabel(p) {
      var k = String(p.platform || 'link').toLowerCase();
      return k === 'link' ? 'Website' : ((P[k] || P.link).name);
    }
    var embeddable = posts.filter(isEmbeddable);

    (function injectHeadlineLinks() {
      var row = document.querySelector('.contact-row');
      if (!row) return;
      row.querySelectorAll('.social-headline-link').forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      posts.filter(function (p) { return valid(p) && !isEmbeddable(p); }).forEach(function (p) {
        var k = String(p.platform || 'link').toLowerCase();
        var b = B[k] || B.link;
        var glyph = b.i ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + b.i + '</svg>'
                        : '<span class="material-symbols-rounded">link</span>';
        var a = document.createElement('a');
        a.className = 'item social-headline-link';
        a.href = String(p.url); a.target = '_blank'; a.rel = 'noopener';
        a.setAttribute('data-platform', k);
        a.innerHTML = glyph + esc(platLabel(p));
        row.appendChild(a);
      });
    })();

    var FEATURED_MAX = 2;
    function defaultFeatured() {
      var pinned = embeddable.filter(function (p) { return p.pinned; }).map(function (p) { return String(p.url); });
      return (pinned.length ? pinned : embeddable.map(function (p) { return String(p.url); })).slice(0, FEATURED_MAX);
    }
    function renderLatest(urls) {
      if (!latestEl) return;
      var list = (urls && typeof urls.length === 'number') ? urls : defaultFeatured();
      latestEl.innerHTML = '';
      var n = 0;
      list.slice(0, FEATURED_MAX).forEach(function (u) {
        var post = null;
        embeddable.forEach(function (p) { if (String(p.url) === String(u)) post = p; });
        if (post) { latestEl.appendChild(buildSocialCard(post)); n++; }
      });
      var lw = document.getElementById('ov-latest-wrap');
      if (lw) lw.hidden = !n;
    }
    if (latestEl) {
      renderLatest();
      document.addEventListener('hope:set-featured', function (ev) { renderLatest(ev && ev.detail && ev.detail.urls); });
      try {
        window.HOPE_SOCIAL_PICKER = {
          max: Math.min(FEATURED_MAX, embeddable.length),
          list: embeddable.map(function (p) { return { url: String(p.url), label: platLabel(p), pinned: !!p.pinned }; })
        };
      } catch (e) {}
    }

    if (hlEl) {
      var feat = timeline.filter(function (e) { return e && e.featured; });
      feat.forEach(function (e) { hlEl.appendChild(buildFeatureCard(e)); });
      var hw = document.getElementById('ov-highlights-wrap');
      if (hw && feat.length) {
        hw.hidden = false;
        hlEl.addEventListener('click', function (ev) {
          var a = ev.target.closest('[data-jump]'); if (!a) return;
          ev.preventDefault();
          var anchor = a.getAttribute('data-jump');
          var btn = document.querySelector('.section-btn[data-section="' + a.getAttribute('data-pane') + '"]');
          if (btn) btn.click();
          var card = document.getElementById(anchor);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('hope-spotlight');
            setTimeout(function () { card.classList.remove('hope-spotlight'); }, 2400);
          }
          try { document.dispatchEvent(new CustomEvent('hope:scrub', { detail: { anchor: anchor } })); } catch (e) {}
        });
        document.addEventListener('hope:tlnode', function (ev) {
          var anchor = ev && ev.detail && ev.detail.anchor; if (!anchor) return;
          var match = hlEl.querySelector('[data-jump="' + anchor + '"]');
          if (!match) return;
          var cs = hlEl.querySelectorAll('.feature-card');
          for (var ci = 0; ci < cs.length; ci++) cs[ci].classList.toggle('tl-live', cs[ci] === match);
        });
      }
    }

    document.querySelectorAll('.section-btn').forEach(function (b) { b.addEventListener('click', fillVisibleSoon); });
    window.addEventListener('resize', fillVisibleSoon);
    fillVisibleSoon();
  })();

  // ═══════════════════════════════════════════════════════════════════════
  // 11. THE THROUGHLINE — chronological strip in the identity card. Preserved.
  //     Uses the hoisted MONTHS / parseYM / fmtYM (no private copies).
  // ═══════════════════════════════════════════════════════════════════════
  (function () {
    var strip = document.getElementById('throughline');
    var hopeData = window.HOPE_DATA || {};
    var timeline = Array.isArray(hopeData.timeline) ? hopeData.timeline : [];
    var TL_TYPES = { experience: 1, education: 1, project: 1, certification: 1 };
    var TL_PANES = { experience: 1, education: 1, projects: 1, certifications: 1 };
    var entries = [];
    timeline.forEach(function (e) {
      if (!e || typeof e !== 'object') return;
      var startM = parseYM(e.date_start);
      if (startM === null || !e.label) return;
      entries.push({
        type: TL_TYPES[e.type] ? String(e.type) : 'experience',
        startM: startM,
        endM: e.date_end ? parseYM(e.date_end) : null,
        label: String(e.label),
        org: e.org ? String(e.org) : '',
        metric: e.metric ? String(e.metric) : '',
        skills: Array.isArray(e.skills) ? e.skills.slice(0, 4) : [],
        pane: TL_PANES[e.pane] ? String(e.pane) : '',
        anchor: e.anchor ? String(e.anchor) : ''
      });
    });
    if (!strip || entries.length === 0) return;

    var now = new Date();
    var nowM = now.getFullYear() * 12 + now.getMonth();
    var minM = Infinity, maxM = -Infinity;
    entries.forEach(function (e) {
      if (e.startM < minM) minM = e.startM;
      var end = e.endM === null ? nowM : e.endM;
      if (end > maxM) maxM = end;
      if (e.startM > maxM) maxM = e.startM;
    });
    var span = Math.max(1, maxM - minM);
    entries.forEach(function (e) {
      e.pct = ((e.startM - minM) / span) * 100;
      e.dateText = fmtYM(e.startM) + ' – ' + (e.endM === null ? 'Present' : fmtYM(e.endM));
    });

    var RIDGE_H = 28;
    var SAMPLES = 120;
    var density = [];
    var s, j, k;
    for (s = 0; s <= SAMPLES; s++) {
      var mAt = minM + span * s / SAMPLES;
      var cnt = 0;
      entries.forEach(function (e) {
        var end = e.endM === null ? nowM : Math.max(e.endM, e.startM + 1);
        if (mAt >= e.startM && mAt <= end) cnt++;
      });
      density.push(cnt);
    }
    for (var pass = 0; pass < 2; pass++) {
      var sm = density.slice();
      for (j = 0; j < density.length; j++) {
        var acc = 0, n = 0;
        for (k = -2; k <= 2; k++) { if (density[j + k] !== undefined) { acc += density[j + k]; n++; } }
        sm[j] = acc / n;
      }
      density = sm;
    }
    var dMin = Infinity, dMax = -Infinity;
    density.forEach(function (v) { if (v < dMin) dMin = v; if (v > dMax) dMax = v; });
    // STRICT LEFT→RIGHT: the timeline is now ONE clean flat line. The density
    // "ridge" silhouette and the per-node "lift" both displaced things off the
    // baseline (the ridge waved above the line, the lift floated nodes up the
    // curve) — that vertical wobble fought the horizontal read, so both are
    // OFF. Nodes + traveler ride a single baseline (lift = 0); the ridge SVG is
    // not drawn (hasRidge = false), so .tl-rail keeps its compact base margins.
    var hasRidge = false;
    entries.forEach(function (e) { e.lift = 0; });

    var rail = document.createElement('div');
    rail.className = 'tl-rail';
    var track = document.createElement('span');
    track.className = 'tl-track';
    rail.appendChild(track);

    if (hasRidge) {
      rail.classList.add('tl-has-ridge');
      var NS = 'http://www.w3.org/2000/svg';
      var ridge = document.createElementNS(NS, 'svg');
      ridge.setAttribute('class', 'tl-ridge');
      ridge.setAttribute('viewBox', '0 0 ' + SAMPLES + ' ' + (RIDGE_H + 2));
      ridge.setAttribute('preserveAspectRatio', 'none');
      ridge.setAttribute('aria-hidden', 'true');
      var pts = '';
      for (s = 0; s <= SAMPLES; s++) {
        var lift = (density[s] - dMin) / (dMax - dMin) * RIDGE_H;
        pts += (s === 0 ? 'M' : 'L') + s + ' ' + (RIDGE_H + 1 - lift).toFixed(2);
      }
      var fillPath = document.createElementNS(NS, 'path');
      fillPath.setAttribute('class', 'tl-ridge-fill');
      fillPath.setAttribute('d', pts + 'L' + SAMPLES + ' ' + (RIDGE_H + 2) + 'L0 ' + (RIDGE_H + 2) + 'Z');
      var linePath = document.createElementNS(NS, 'path');
      linePath.setAttribute('class', 'tl-ridge-line');
      linePath.setAttribute('d', pts);
      linePath.setAttribute('vector-effect', 'non-scaling-stroke');
      ridge.appendChild(fillPath);
      ridge.appendChild(linePath);
      rail.appendChild(ridge);
    }

    var firstYear = Math.ceil(minM / 12);
    var lastYear = Math.floor(maxM / 12);
    var stepYears = Math.max(1, Math.ceil((lastYear - firstYear + 1) / 7));
    for (var y = firstYear; y <= lastYear; y += stepYears) {
      var tickM = y * 12;
      if (tickM < minM || tickM > maxM) continue;
      var tickEl = document.createElement('span');
      tickEl.className = 'tl-tick';
      tickEl.style.left = (((tickM - minM) / span) * 100) + '%';
      var yearEl = document.createElement('span');
      yearEl.className = 'tl-tick-year';
      yearEl.textContent = String(y);
      tickEl.appendChild(yearEl);
      rail.appendChild(tickEl);
    }

    var nodes = [];
    entries.forEach(function (e, i) {
      var node = document.createElement('button');
      node.type = 'button';
      // STRICT LEFT→RIGHT: on SCREEN nodes sit on ONE baseline (only the active
      // node shows a label, so there is no overlap and the eye flows
      // horizontally). The former tl-below / tl-far tiers bounced labels
      // above/below + near/far the line — that zig-zag is removed. For PRINT /
      // continuous export EVERY label renders at once, so a single BELOW-only
      // 2-row stagger (tl-stagger on alternate nodes, CSS-gated to print) clears
      // dense clusters without ever lifting a label above the line.
      node.className = 'tl-node tl-' + e.type +
        (e.endM === null ? ' tl-ongoing' : '') +
        (i % 2 ? ' tl-stagger' : '');
      node.style.left = e.pct + '%';
      node.setAttribute('aria-label', e.label + ', ' + e.dateText);
      var hex = document.createElement('span');
      hex.className = 'tl-hex';
      node.appendChild(hex);
      var lab = document.createElement('span');
      lab.className = 'tl-node-label';
      var labText = document.createElement('span');
      labText.className = 'tl-node-text';
      labText.textContent = e.label;
      var labDate = document.createElement('span');
      labDate.className = 'tl-node-date';
      labDate.textContent = e.dateText;
      lab.appendChild(labText);
      lab.appendChild(labDate);
      node.appendChild(lab);
      rail.appendChild(node);
      nodes.push(node);
    });

    var TRAVELER_SVGS = {
      'paper-plane': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
      'car': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
      'train': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z"/></svg>',
      'sailboat': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3l7 11h-7zM11 6v8H5zM3 16h18l-2.5 4h-13z"/></svg>',
      'bicycle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5S3.1 13.5 5 13.5s3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg>',
      'rocket': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5s4.5 2.04 4.5 10.5c0 2.49-1.04 5.57-1.6 7H9.1c-.56-1.43-1.6-4.51-1.6-7C7.5 4.54 12 2.5 12 2.5zm2 8.5c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zm-6.31 9.52c-.48-1.23-1.52-4.17-1.67-6.87l-1.13.75c-.56.38-.89 1-.89 1.67V22l3.69-1.48zM20 22v-5.93c0-.67-.33-1.29-.89-1.66l-1.13-.75c-.15 2.69-1.2 5.64-1.67 6.87L20 22z"/></svg>',
      'footprints': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 2a2.5 4 0 1 0 0 8 2.5 4 0 1 0 0-8zM8 11.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6zM16 8.5a2.5 4 0 1 0 0 8 2.5 4 0 1 0 0-8zM16 18a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6z"/></svg>'
    };
    var playhead = document.createElement('span');
    playhead.className = 'tl-playhead';
    var traveler = document.createElement('span');
    traveler.className = 'tl-traveler';
    var travPref = hopeData.traveler;
    var travSvg = '';
    if (travPref && typeof travPref === 'object' && typeof travPref.inline === 'string' &&
        travPref.inline.lastIndexOf('<svg', 0) === 0) {
      travSvg = travPref.inline;
    } else if (typeof travPref === 'string' && TRAVELER_SVGS.hasOwnProperty(travPref)) {
      travSvg = TRAVELER_SVGS[travPref];
    }
    if (travSvg) { traveler.className += ' tl-svg'; traveler.innerHTML = travSvg; }
    else { traveler.className += ' tl-dot'; }
    playhead.appendChild(traveler);
    rail.appendChild(playhead);
    strip.appendChild(rail);
    strip.hidden = false;

    var tip = document.createElement('div');
    tip.className = 'tl-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.appendChild(tip);
    function showTip(node, e) {
      tip.innerHTML = '';
      var l = document.createElement('div'); l.className = 'tl-tip-label'; l.textContent = e.label; tip.appendChild(l);
      if (e.org) { var o = document.createElement('div'); o.className = 'tl-tip-org'; o.textContent = e.org; tip.appendChild(o); }
      var d = document.createElement('div'); d.className = 'tl-tip-dates'; d.textContent = e.dateText; tip.appendChild(d);
      if (e.metric) { var m = document.createElement('div'); m.className = 'tl-tip-metric'; m.textContent = e.metric; tip.appendChild(m); }
      if (e.skills.length) {
        var chips = document.createElement('div'); chips.className = 'tl-tip-skills';
        e.skills.forEach(function (sv) {
          var chip = document.createElement('span'); chip.className = 'skill-chip'; chip.textContent = String(sv); chips.appendChild(chip);
        });
        tip.appendChild(chips);
      }
      tip.hidden = false;
      var nr = node.getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var vx = nr.left + nr.width / 2 - tw / 2;
      vx = Math.max(8, Math.min(vx, window.innerWidth - tw - 8));
      var vy = nr.top - th - 10;
      if (vy < 8) vy = nr.bottom + 10;
      tip.style.left = (vx + window.scrollX) + 'px';
      tip.style.top = (vy + window.scrollY) + 'px';
    }
    function hideTip() { tip.hidden = true; }

    function classifyClamps() {
      var rw = rail.clientWidth;
      if (!rw) return;
      nodes.forEach(function (node, i) {
        var x = rw * entries[i].pct / 100;
        node.classList.toggle('tl-clamp-start', x < 110);
        node.classList.toggle('tl-clamp-end', rw - x < 110);
      });
    }
    classifyClamps();

    var current = -1;
    var rafId = 0;
    var reducedMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduced = !!(reducedMq && reducedMq.matches);
    var hovered = false, focused = false, inView = true;
    function playheadX(i) { return rail.clientWidth * entries[i].pct / 100; }
    function applyStep(i, backward) {
      if (current >= 0 && nodes[current]) nodes[current].classList.remove('tl-active');
      nodes[i].classList.add('tl-active');
      playhead.style.transform = 'translate(' + playheadX(i) + 'px, ' + (-entries[i].lift).toFixed(1) + 'px)';
      traveler.classList.toggle('tl-flip', !!backward);
      current = i;
      try { document.dispatchEvent(new CustomEvent('hope:tlnode', { detail: { anchor: entries[i].anchor } })); } catch (e) {}
    }
    function schedule(i, backward) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(function () { rafId = 0; applyStep(i, backward); });
    }
    function shouldRun() {
      return !reduced && entries.length > 1 && !hovered && !focused && inView && !document.hidden;
    }
    function tick() {
      if (!shouldRun()) return;
      var next = (current + 1) % entries.length;
      schedule(next, next < current);
    }
    function setStatic(on) {
      strip.classList.toggle('tl-static', on);
      if (on) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        if (current >= 0 && nodes[current]) nodes[current].classList.remove('tl-active');
        current = -1;
      } else if (current < 0) {
        schedule(0, false);
      }
    }
    if (reduced) setStatic(true); else schedule(0, false);
    window.setInterval(tick, 1000);
    document.addEventListener('hope:scrub', function (ev) {
      var anchor = ev && ev.detail && ev.detail.anchor; if (!anchor) return;
      for (var si = 0; si < entries.length; si++) {
        if (entries[si].anchor === anchor) { if (!reduced) schedule(si, si < current); break; }
      }
    });
    if (reducedMq) {
      var onReducedChange = function () { reduced = reducedMq.matches; setStatic(reduced); };
      if (reducedMq.addEventListener) reducedMq.addEventListener('change', onReducedChange);
      else if (reducedMq.addListener) reducedMq.addListener(onReducedChange);
    }
    strip.addEventListener('mouseenter', function () { hovered = true; });
    strip.addEventListener('mouseleave', function () { hovered = false; hideTip(); });
    strip.addEventListener('focusin', function () { focused = true; });
    strip.addEventListener('focusout', function (e) {
      if (!strip.contains(e.relatedTarget)) { focused = false; hideTip(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    });
    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (recs) {
        inView = !!(recs[0] && recs[0].isIntersecting);
      }, { threshold: 0.1 }).observe(strip);
    }
    window.addEventListener('resize', function () {
      if (current >= 0) playhead.style.transform = 'translateX(' + playheadX(current) + 'px)';
      classifyClamps();
      hideTip();
    });

    nodes.forEach(function (node, i) {
      var e = entries[i];
      node.addEventListener('mouseenter', function () { showTip(node, e); });
      node.addEventListener('mouseleave', hideTip);
      node.addEventListener('focus', function () { showTip(node, e); });
      node.addEventListener('blur', hideTip);
      node.addEventListener('click', function () {
        if (e.pane) {
          var paneBtn = document.querySelector('.section-btn[data-section="' + e.pane + '"]');
          if (paneBtn) paneBtn.click();
        }
        if (!reduced) schedule(i, i < current);
        var card = e.anchor ? document.getElementById(e.anchor) : null;
        if (!card) return;
        if (card.hasAttribute('data-expand')) card.classList.add('expanded');
        card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        card.classList.remove('tl-flash');
        void card.offsetWidth;
        card.classList.add('tl-flash');
        setTimeout(function () { card.classList.remove('tl-flash'); }, 1300);
      });
    });
  })();
})();
