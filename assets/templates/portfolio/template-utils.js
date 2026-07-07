/* template-utils.js — shared helpers for all 5 portfolio design templates.
   Loaded via <script src="template-utils.js"></script> AFTER data.js.
   file:// law: no fetch(), no import, no type=module.
   Zero hex in this file — colors live in each template's CSS. */

// ─── HTML ESCAPE & DOM ────────────────────────────────────────────────────────
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function frag(html) {
  var t = document.createElement('template');
  t.innerHTML = String(html).trim();
  return t.content.firstElementChild;
}

// ─── BRAND SVG ICONS ──────────────────────────────────────────────────────────
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
  website: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
  substack: 'M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  threads: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.36-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.322-3.083.87-.76 2.087-1.207 3.622-1.328a13.316 13.316 0 0 1 3.055.209c-.1-.606-.31-1.087-.626-1.436-.436-.481-1.114-.727-2.019-.734h-.028c-.72 0-1.702.198-2.328 1.09l-1.688-1.164c.837-1.207 2.199-1.87 3.905-1.87h.037c2.85.017 4.55 1.775 4.72 4.867.096.042.191.087.284.135 1.29.606 2.234 1.524 2.73 2.656.694 1.575.663 4.14-1.421 6.203-1.596 1.583-3.53 2.294-6.245 2.317z',
  mastodon: 'M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12v6.406z',
  email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  portfolio: 'M10 16v-1H3.01L3 19c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2v-4h-7v1h-4zm10-9h-4.01V5l-2-2h-4l-2 2v2H4c-1.1 0-2 .9-2 2v3c0 1.11.89 2 2 2h6v-2h4v2h6c1.11 0 2-.89 2-2V9c0-1.1-.9-2-2-2zm-6 0h-4V5h4v2z'
};
// Synonyms → a canonical BRAND_PATHS key. Keeps callers free to emit either the
// platform enum (x, website) or a common alias (twitter, site) without an icon miss.
var BRAND_ALIASES = {
  twitter: 'x',
  mail: 'email',
  'e-mail': 'email',
  tel: 'phone',
  mobile: 'phone',
  cell: 'phone',
  site: 'website',
  web: 'website',
  url: 'website',
  link: 'website',
  home: 'website',
  homepage: 'website'
};
function brandSvg(kind) {
  var k = String(kind || 'other').toLowerCase();
  if (BRAND_ALIASES[k]) k = BRAND_ALIASES[k];
  // Globe (website) is the deliberate fallback for genuinely unknown kinds only.
  var path = BRAND_PATHS[k] || BRAND_PATHS.website;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + path + '"/></svg>';
}

// ─── DATE & FORMAT HELPERS ────────────────────────────────────────────────────
function fy(x) { return x ? x.split('-')[0] : ''; }

function fmtPeriod(s, e, sep) {
  sep = sep || '\u2013';
  var a = fy(s), b = e ? fy(e) : 'Now';
  return a === b ? a : a + sep + b;
}

// ─── SKILL LEVEL HELPERS ─────────────────────────────────────────────────────
function bars(level, litCls, unlitCls) {
  var a = [];
  for (var i = 1; i <= 4; i++) a.push({ cls: i <= level ? litCls : unlitCls });
  return a;
}

// ─── DATA FLATTENING ──────────────────────────────────────────────────────────
function flattenContribs(experience) {
  return (experience || []).map(function (r) {
    var items = [];
    (r.groups || []).forEach(function (g) {
      (g.contributions || []).forEach(function (c) {
        items.push({
          kind: g.kind,
          num: c.num,
          icon: c.icon,
          domain: c.domain || c.scope || '',
          scope: c.scope || '',
          metric: c.metric ? c.metric.value : '',
          metricDir: c.metric ? c.metric.direction : '',
          metricSubject: c.metric ? c.metric.subject : '',
          impact: c.impact || '',
          action: c.action || '',
          skills: (c.skills || []).map(function (s) { return s.name; }),
          skillRefs: c.skills || [],
          competencies: c.competencies || []
        });
      });
    });
    return {
      id: r.id,
      role_title: r.role_title,
      company: r.company,
      company_domain: r.company_domain,
      company_initial: r.company_initial,
      dates: r.dates,
      is_current: !!r.is_current,
      contribution_count: r.contribution_count,
      kpis: r.kpis,
      items: items
    };
  });
}

function metricArrow(dir) {
  if (dir === 'up') return '\u2191';
  if (dir === 'down') return '\u2193';
  if (dir === 'achieved') return '\u2713';
  return '';
}

// ─── RENDER: PROJECTS ─────────────────────────────────────────────────────────
function renderProjectsHtml(projects, cls) {
  if (!projects || !projects.length) return '';
  cls = cls || {};
  return projects.map(function (p) {
    var activePill = p.is_active ? '<span class="' + (cls.pill || 'live') + '">Active</span>' : '';
    var datesHtml = p.dates ? '<div class="' + (cls.dates || 'projdate') + '">' + esc(p.dates) + '</div>' : '';
    var impactHtml = p.impact ? '<p class="' + (cls.impact || 'projimpact') + '">' + esc(p.impact) + '</p>' : '';
    var chipsHtml = (p.skills || []).map(function (s) {
      return '<span class="chip">' + esc(s.name) + '</span>';
    }).join('');
    var skillsBlock = chipsHtml ? '<div class="' + (cls.skills || 'cskills') + '">' + chipsHtml + '</div>' : '';
    var linkHtml = '';
    if (p.link && p.link.url) {
      linkHtml = '<div class="' + (cls.link || 'projlink') + '"><a href="' + esc(p.link.url) +
        '" target="_blank" rel="noopener">' + esc(p.link.label) + ' \u2192</a></div>';
    }
    var metricPill = p.best_metric ? '<span class="' + (cls.metric || 'projmetric') + '">' + esc(p.best_metric) + '</span>' : '';
    return '<div class="' + (cls.card || 'proj') + '">' +
      '<div class="' + (cls.head || 'projhead') + '">' +
        '<div class="' + (cls.name || 'projname') + '">' + esc(p.name) + activePill + '</div>' +
        datesHtml +
      '</div>' +
      '<div class="' + (cls.tag || 'projtag') + '">' + esc(p.tagline) + metricPill + '</div>' +
      '<p class="' + (cls.desc || 'projdesc') + '">' + esc(p.description) + '</p>' +
      impactHtml + skillsBlock + linkHtml +
    '</div>';
  }).join('');
}

// ─── RENDER: RESUME (ATS) ────────────────────────────────────────────────────
function renderResumeHtml(resume, meta) {
  if (!resume) return '';
  meta = meta || {};
  var parts = resume.contact_line_parts || {};
  var contactBits = [];
  if (parts.location) contactBits.push(esc(parts.location));
  if (parts.email) contactBits.push(esc(parts.email));
  if (parts.phone) contactBits.push(esc(parts.phone));
  (parts.links || []).forEach(function (l) {
    if (l && l.url) contactBits.push('<a href="' + esc(l.url) + '">' + esc(l.label) + '</a>');
  });
  // Portfolio anchor (contract A.9): appended when the stamped head share_url is
  // non-empty. Prefer the head meta tag; fall back to meta.share_url from data.
  var shareUrl = '';
  try {
    var shareMeta = document.querySelector('meta[name="hope:share-url"]');
    if (shareMeta && shareMeta.content) shareUrl = shareMeta.content.trim();
  } catch (e) { /* no DOM meta — degrade to data field below */ }
  if (!shareUrl && meta.share_url) shareUrl = String(meta.share_url).trim();
  if (shareUrl) contactBits.push('<a href="' + esc(shareUrl) + '" target="_blank" rel="noopener">Portfolio</a>');

  var expHtml = (resume.experience || []).map(function (e) {
    var bulletsHtml = (e.bullets || []).map(function (b) {
      var tagHtml = (b.tag && b.tag.trim()) ? ' <strong>' + esc(b.tag) + '</strong>' : '';
      return '<li>' + esc(b.text) + tagHtml + '</li>';
    }).join('');
    return '<div class="rentry">' +
      '<div class="rentryhead"><span class="rtitle">' + esc(e.role_title) +
      '</span><span class="rdates">' + esc(e.dates) + '</span></div>' +
      '<div class="rorg">' + esc(e.company) + '</div>' +
      '<ul>' + bulletsHtml + '</ul></div>';
  }).join('');

  var eduHtml = (resume.education || []).map(function (e) {
    return '<div class="rentry"><span class="rtitle">' + esc(e.degree_line) +
      '</span> \u2014 ' + esc(e.institution) + ' (' + esc(e.dates) + ')</div>';
  }).join('');

  return '<div class="resume-view">' +
    '<h2>' + esc(meta.name) + '</h2>' +
    '<p class="resume-headline">' + esc(meta.headline) + '</p>' +
    '<div class="resume-contact">' + contactBits.join(' \u00B7 ') + '</div>' +
    '<h3>Summary</h3><p class="resume-summary">' + esc(resume.summary) + '</p>' +
    '<h3>Experience</h3>' + expHtml +
    '<h3>Education</h3>' + eduHtml +
    '<h3>Skills</h3><p class="resume-skills">' + esc(resume.skills_line) + '</p>' +
  '</div>';
}

// ─── RENDER: SOCIAL (link cards — no iframes on file://) ──────────────────────
function renderSocialHtml(social) {
  if (!social || !social.length) return '';
  return social.map(function (s) {
    var captionHtml = s.caption ? '<div class="soc-caption">' + esc(s.caption) + '</div>' : '';
    var pinnedHtml = s.pinned ? '<span class="soc-pinned">Pinned</span>' : '';
    var platform = String(s.platform || 'link');
    var platformLabel = platform.charAt(0).toUpperCase() + platform.slice(1);
    return '<div class="soc-card">' +
      '<div class="soc-head">' + brandSvg(platform) +
        '<span class="soc-platform">' + esc(platformLabel) + '</span>' + pinnedHtml +
      '</div>' +
      captionHtml +
      '<a class="soc-link" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        'View on ' + esc(platformLabel) + ' \u2192</a>' +
    '</div>';
  }).join('');
}

// ─── RENDER: FOOTER ──────────────────────────────────────────────────────────
function renderFooterHtml(meta) {
  var genDate = (meta && meta.generation_date) || '';
  var company = (meta && meta.target_company && meta.target_company.trim())
    ? ' \u00B7 For ' + esc(meta.target_company) : '';
  return '<div class="foot-gen">Generated with <a href="https://github.com/oneconsciousness/job-hunt-with-hope" target="_blank" rel="noopener">Hope</a>' +
    (genDate ? ' \u00B7 ' + esc(genDate) : '') + company + '</div>';
}

// ─── RENDER: CONTACT LINKS ───────────────────────────────────────────────────
function renderLinksHtml(links) {
  if (!links || !links.length) return '';
  return links.map(function (lnk) {
    if (!lnk || !lnk.url) return '';
    return '<a href="' + esc(lnk.url) + '" target="_blank" rel="noopener">' +
      brandSvg(lnk.kind) + ' ' + esc(lnk.label) + '</a>';
  }).join('');
}

// ─── ENTRANCE ANIMATION ──────────────────────────────────────────────────────
function revealRows(selector, direction) {
  direction = direction || 'translateY(8px)';
  var rows = document.querySelectorAll(selector);
  if (!rows.length) return;
  var anims = [];
  rows.forEach(function (el, i) {
    try {
      anims.push(el.animate(
        [{ opacity: 0, transform: direction }, { opacity: 1, transform: 'none' }],
        { duration: 460, delay: i * 65, easing: 'cubic-bezier(.2,.6,.2,1)', fill: 'backwards' }
      ));
    } catch (e) { /* Web Animations API not supported — degrade silently */ }
  });
  setTimeout(function () {
    anims.forEach(function (a) {
      try { if (a.playState !== 'finished') a.cancel(); } catch (e) {}
    });
  }, 1100);
}
