/**
 * Scoring logic for the end-of-game summary.
 * - CommonJS export for tests
 * - UMD exposure as `window.DLD.logicScore`
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.DLD = root.DLD || {};
    root.DLD.logicScore = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  /**
   * Compute WarScore for a single province.
   * Formula mirrors current prototype end-screen math.
   * @param {Object} prov - Province state.
   * @returns {number} Rounded province score.
   */
  function computeProvinceScore(prov) {
    let score = (prov.troops || 0) * 1 + (prov.morale || 0) * 2 + (prov.food || 0) * 0.5;
    if (prov.hasFort) score += 150;
    if (prov.temples && prov.temples > 0) score += prov.temples * 20;
    if (prov.hasMarket) score += 10;
    return Math.round(score);
  }

  /**
   * Compute all province results and the total score.
   * @param {Record<string,Object>} provinces - Keyed provinces.
   * @returns {{results:Array<{name:string,score:number}>, totalScore:number}}
   */
  function computeAllScores(provinces) {
    const results = [];
    let totalScore = 0;
    Object.keys(provinces).forEach((key) => {
      const p = provinces[key];
      const s = computeProvinceScore(p);
      totalScore += s;
      results.push({ name: p.name, score: s });
    });
    return { results, totalScore };
  }

  /**
   * Rate total score into a human-readable verdict string.
   * @param {number} totalScore - Sum of province scores.
   * @returns {string} Rating text.
   */
  function rateTotal(totalScore) {
    if (totalScore > 2500) return 'Großartig! Euer Reich ist stark genug für den finalen Kampf.';
    if (totalScore > 1500) return 'Nicht schlecht. Mit etwas Geschick könntet ihr bestehen.';
    return 'Das Reich ist schwach und könnte der bevorstehenden Invasion nicht standhalten.';
  }

  return { computeProvinceScore, computeAllScores, rateTotal };
});

