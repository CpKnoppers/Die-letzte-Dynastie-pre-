// Pure helpers for option scoring and label iconization
// CommonJS exports for Jest; also attaches to window.DLD in browser.

/**
 * Text utilities for options: scoring labels and converting to iconized HTML.
 * - CommonJS export for Jest and Node-like environments
 * - UMD-style attachment to `window.DLD.logicText` in the browser
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.DLD = root.DLD || {};
    root.DLD.logicText = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  /**
   * Score an option label by parsing resource deltas.
   * Lower scores represent worse options (more negative impact).
   * Recognizes both ASCII hyphen and common Unicode minus characters.
   * @param {string} label - Human-readable option label (e.g., "+10 Nahrung, −5 Moral").
   * @returns {number} Numeric score; lower = worse.
   */
  function scoreOptionLabel(label) {
    if (!label || typeof label !== 'string') return 0;
    const text = label;
    let score = 0;
    const minusClass = "[\\-\u2010-\u2015\u2212\u2011\u2013]";
    const plusRe = /\+(\d+)\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)/gi;
    const minusRe = new RegExp(minusClass + '(?:\u00A0)?(\\d+)\\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)', 'gi');
    const weight = (unit) => ({ Nahrung: 1, Gold: 0.5, Moral: 2, Truppen: 1, Arbeiter: 0.5 })[unit] || 1;
    let m;
    while ((m = plusRe.exec(text)) !== null) {
      const val = parseInt(m[1], 10) || 0;
      const unit = m[2];
      score += val * weight(unit);
    }
    while ((m = minusRe.exec(text)) !== null) {
      const val = parseInt(m[1], 10) || 0;
      const unit = m[2];
      score -= val * weight(unit);
    }
    if (/Ignorieren|Nichts tun|vertuschen|kein handel/i.test(text)) {
      score -= 5;
    }
    return score;
  }

  /**
   * Replace resource mentions in a label with icon spans that inherit text color.
   * Does not touch other parts of the string; safe to inject as HTML.
   * @param {string} label - Original label string.
   * @returns {string} HTML-enhanced label with icon spans.
   */
  function labelToHtml(label) {
    if (!label) return '';
    const iconClass = {
      Nahrung: 'icon-food',
      Gold: 'icon-gold',
      Moral: 'icon-morale',
      Truppen: 'icon-troops',
      Arbeiter: 'icon-workers'
    };
    const minusClass = "[\\-\u2010-\u2015\u2212\u2011\u2013]";
    const re = new RegExp(`(${minusClass}?\\s*\\+?\\s*\\d+)\\s*(Nahrung|Gold|Moral|Truppen|Arbeiter)`, 'gi');
    let html = String(label).replace(re, (m, num, unit) => {
      const u = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
      const cls = iconClass[u] || '';
      if (!cls) return m;
      return `${num}\u00A0<span class="icon ${cls}" aria-hidden="true"></span>`;
    });
    return html;
  }

  return { scoreOptionLabel, labelToHtml };
});
