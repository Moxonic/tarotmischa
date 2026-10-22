/* Dismiss anything Netlify injects into the page (badges, the deploy drawer, "powered by" banners).
   Their markup isn't ours to rely on, so match loosely and keep watching for late insertions. */
(function () {
  'use strict';

  const MATCH = /netlify/i;
  const OURS = '.app, .sheet, .scrim, .picker, .sky, #announce';

  function isNetlify(el) {
    if (!(el instanceof Element) || el.closest(OURS) || /^(SCRIPT|LINK|STYLE|META)$/.test(el.tagName)) return false;
    const attrs = [el.id, el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className,
      el.getAttribute('src'), el.getAttribute('href'), el.getAttribute('aria-label'), el.tagName];
    if (attrs.some((a) => a && MATCH.test(String(a)))) return true;
    if (el.shadowRoot && MATCH.test(el.shadowRoot.textContent || '')) return true;
    // a small floating element whose text mentions Netlify ("Powered by Netlify")
    const text = el.textContent || '';
    if (text.length < 200 && MATCH.test(text)) {
      const pos = getComputedStyle(el).position;
      return pos === 'fixed' || pos === 'sticky' || pos === 'absolute';
    }
    return false;
  }

  function dismiss(el) {
    const root = el.shadowRoot || el;
    const close = root.querySelector &&
      root.querySelector('[aria-label*="close" i], [aria-label*="dismiss" i], [title*="close" i], button.close, .close');
    if (close) { try { close.click(); } catch (e) { /* ignore */ } }
    el.style.setProperty('display', 'none', 'important');
    el.setAttribute('aria-hidden', 'true');
  }

  function sweep(nodes) {
    for (const n of nodes) {
      if (!(n instanceof Element)) continue;
      if (isNetlify(n)) { dismiss(n); continue; }
      n.querySelectorAll('iframe, a, div, aside, section, button, [id], [class]').forEach((c) => {
        if (isNetlify(c)) {
          // hide the outermost floating wrapper, not just the logo inside it
          let target = c;
          while (target.parentElement && target.parentElement !== document.body &&
                 !target.parentElement.closest(OURS) && (target.parentElement.textContent || '').length < 200) {
            target = target.parentElement;
          }
          dismiss(target);
        }
      });
    }
  }

  const start = () => {
    sweep(Array.from(document.body.children));
    new MutationObserver((muts) => {
      muts.forEach((m) => sweep(m.addedNodes));
    }).observe(document.body, { childList: true, subtree: false });
    // some badges attach a little later than DOMContentLoaded
    [500, 1500, 4000].forEach((t) => setTimeout(() => sweep(Array.from(document.body.children)), t));
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
