// Monthly economy resolution for a single province (pure, no DOM)
// Uses helpers from ../math when available (CommonJS for Jest).

/**
 * Economy logic: pure monthly resolution for a province.
 * - CommonJS export for unit testing
 * - UMD-style exposure as `window.DLD.logicEconomy` in browser
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../math'));
  } else {
    const api = factory(root.DLD && root.DLD.math ? root.DLD.math : undefined);
    root.DLD = root.DLD || {};
    root.DLD.logicEconomy = api;
  }
})(
  typeof window !== 'undefined' ? window : globalThis,
  function(math) {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const computeHarvestFactor = math && math.computeHarvestFactor
      ? math.computeHarvestFactor
      : (morale) => 1 + 0.4 * ((clamp(morale, 0, 100) - 50) / 50);
    const computeTaxFactor = math && math.computeTaxFactor
      ? math.computeTaxFactor
      : (morale) => 1 + 0.3 * ((clamp(morale, 0, 100) - 50) / 50);

    /**
     * Compute monthly upkeep costs for a province based on troops and workers.
     * @param {Object} prov - Province state { troops, workers }.
     * @returns {{food:number, gold:number}} Upkeep costs per month.
     */
    function computeUpkeep(prov) {
      const troopUnits = Math.ceil((prov.troops || 0) / 100);
      const workerUnits = Math.ceil((prov.workers || 0) / 100);
      return {
        food: troopUnits * 6 + workerUnits * 4,
        gold: troopUnits * 8 + workerUnits * 6
      };
    }

    /**
     * Compute monthly production after morale scaling and building bonuses.
     * @param {Object} prov - Province state { baseF, baseG, morale, hasMarket }.
     * @returns {{food:number, gold:number}} Production values for the month.
     */
    function computeProduction(prov) {
      const fHarvest = computeHarvestFactor(prov.morale || 0);
      const fTax = computeTaxFactor(prov.morale || 0);
      let food = (prov.baseF || 0) * fHarvest;
      let gold = (prov.baseG || 0) * fTax;
      if (prov.hasMarket) gold += 10;
      return { food, gold };
    }

    /**
     * Apply a full monthly resolution to a province (immutable input).
     * Order: upkeep -> deficit penalties -> temple morale -> production -> clamps/rounding.
     * @param {Object} provIn - Province snapshot before resolution.
     * @returns {{prov:Object, deltas:Object, upkeep:Object, production:Object}}
     */
    function applyMonthlyEconomy(provIn) {
      const prov = Object.assign({}, provIn);
      const upkeep = computeUpkeep(prov);
      prov.food = (prov.food || 0) - upkeep.food;
      prov.gold = (prov.gold || 0) - upkeep.gold;

      // Deficits
      if (prov.food < 0) {
        const deficit = -prov.food;
        const deserters = Math.floor(deficit / 6) * 15;
        prov.troops = Math.max(0, (prov.troops || 0) - deserters);
        prov.morale = (prov.morale || 0) - 5;
        prov.food = 0;
      }
      if (prov.gold < 0) {
        prov.gold = 0;
        prov.morale = (prov.morale || 0) - 5;
        if ((prov.troops || 0) > 0) prov.troops = Math.max(0, prov.troops - 10);
      }

      // Temple morale bonus before production add (matches script.js ordering)
      if (prov.temples && prov.temples > 0) {
        prov.morale = (prov.morale || 0) + 3 * prov.temples;
      }

      const production = computeProduction(prov);
      const before = { food: prov.food, gold: prov.gold, morale: prov.morale, troops: prov.troops };
      prov.food = Math.min((prov.food || 0) + production.food, prov.foodCap || Infinity);
      prov.gold = (prov.gold || 0) + production.gold;
      prov.morale = clamp(prov.morale || 0, 0, 100);
      prov.food = Math.round(prov.food);
      prov.gold = Math.round(prov.gold);

      const after = { food: prov.food, gold: prov.gold, morale: prov.morale, troops: prov.troops };
      const deltas = {
        food: after.food - before.food,
        gold: after.gold - before.gold,
        morale: after.morale - before.morale,
        troops: after.troops - before.troops
      };

      return { prov, deltas, upkeep, production };
    }

    return { applyMonthlyEconomy, computeUpkeep, computeProduction, computeHarvestFactor, computeTaxFactor };
  }
);
