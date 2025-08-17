/**
 * Datetime utilities used by the prototype.
 * - CommonJS export for tests
 * - UMD exposure as `window.DLD.logicDatetime`
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.DLD = root.DLD || {};
    root.DLD.logicDatetime = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  /**
   * Compute number of days in a given month for a specific year.
   * @param {number} year - Full year (e.g., 925, 2020).
   * @param {number} monthIndex - Month index 0..11.
   * @returns {number} Days in that month.
   */
  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  /**
   * Format a Date object as DD.MM.YYYY string.
   * @param {Date} d - Date instance.
   * @returns {string} e.g., "01.04.0925".
   */
  function formatDate(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  /**
   * Compute day progress percentage for the progress bar (0..100).
   * @param {Date} d - Current date.
   * @returns {number} Integer percent of month elapsed before current day.
   */
  function computeDayProgress(d) {
    const total = daysInMonth(d.getFullYear(), d.getMonth());
    const pct = Math.round(((d.getDate() - 1) / total) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  return { daysInMonth, formatDate, computeDayProgress };
});

