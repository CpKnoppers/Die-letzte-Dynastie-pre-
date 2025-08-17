/**
 * Season logic for rotating the banner image.
 * - CommonJS export for tests
 * - UMD exposure as `window.DLD.logicSeasons`
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.DLD = root.DLD || {};
    root.DLD.logicSeasons = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  /**
   * Map month index (0..11) to season name.
   * Changes occur on Jan (0), Apr (3), Jul (6), Oct (9).
   * @param {number} monthIndex - 0..11 (0=Jan).
   * @returns {"winter"|"spring"|"summer"|"autumn"}
   */
  function getSeasonName(monthIndex) {
    if (monthIndex >= 3 && monthIndex <= 5) return 'spring';
    if (monthIndex >= 6 && monthIndex <= 8) return 'summer';
    if (monthIndex >= 9 && monthIndex <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * Get a banner image path for a given month index.
   * Paths can be customized; defaults to `assets/img/banners/banner-<season>.png`.
   * @param {number} monthIndex - 0..11.
   * @param {Object} [opts]
   * @param {string} [opts.basePath="assets/img/banners/"] - Base directory for banner files.
   * @returns {string} Path to the seasonal banner image.
   */
  function getSeasonImage(monthIndex, opts) {
    const base = (opts && opts.basePath) || 'assets/img/banners/';
    const season = getSeasonName(monthIndex);
    return `${base}banner-${season}.png`;
  }

  /**
   * Get a banner image path for a Date.
   * @param {Date} d - Date to derive month from.
   * @param {Object} [opts]
   * @returns {string} Path to seasonal banner.
   */
  function getSeasonImageForDate(d, opts) {
    return getSeasonImage(d.getMonth(), opts);
  }

  return { getSeasonName, getSeasonImage, getSeasonImageForDate };
});

