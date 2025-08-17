// Small pure helpers extracted from design formulas in README
// CommonJS export so Jest can require it without a bundler.

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Harvest factor: 1 + 0.4 * ((morale - 50) / 50)
function computeHarvestFactor(morale) {
  const m = clamp(morale, 0, 100);
  return 1 + 0.4 * ((m - 50) / 50);
}

// Tax factor: 1 + 0.3 * ((morale - 50) / 50)
function computeTaxFactor(morale) {
  const m = clamp(morale, 0, 100);
  return 1 + 0.3 * ((m - 50) / 50);
}

module.exports = { clamp, computeHarvestFactor, computeTaxFactor };

