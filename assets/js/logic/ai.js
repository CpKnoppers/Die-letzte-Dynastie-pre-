/**
 * AI logic: pure monthly decision heuristic for a single province.
 * Returns a new province object with applied changes.
 * - CommonJS export for tests
 * - UMD attachment to `window.DLD.logicAI`
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.DLD = root.DLD || {};
    root.DLD.logicAI = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  /**
   * Decide and apply one month of AI actions.
   * Mirrors existing inline heuristics (build, buy food, morale, recruit, workers).
   * @param {Object} prov - Province state.
   * @param {{month:number,maxMonths:number}} context - Timing context.
   * @returns {Object} New province state with AI decisions applied.
   */
  function applyAI(prov, context) {
    const out = { ...prov };
    const month = (context && context.month) || 1;
    const maxMonths = (context && context.maxMonths) || 24;
    const availableSlots = (out.buildingSlots || 0) - (out.buildings ? out.buildings.length : 0);
    out.buildings = Array.isArray(out.buildings) ? out.buildings.slice() : [];

    if (availableSlots > 0) {
      if (!out.buildings.includes('Kornspeicher') && (out.gold || 0) >= 80 && (out.food || 0) > (out.foodCap || 0) * 0.8) {
        out.foodCap = (out.foodCap || 0) + 100;
        out.gold = (out.gold || 0) - 80;
        out.buildings.push('Kornspeicher');
      } else if (!out.hasMarket && (out.gold || 0) >= 100) {
        out.gold = (out.gold || 0) - 100;
        out.hasMarket = true;
        out.buildings.push('Markt');
      } else if (!out.hasBarracks && (out.gold || 0) >= 120 && (out.troops || 0) < 200) {
        out.gold = (out.gold || 0) - 120;
        out.hasBarracks = true;
        out.buildings.push('Kaserne');
      } else if ((out.temples || 0) < 1 && (out.gold || 0) >= 140 && (out.morale || 0) < 75) {
        out.gold = (out.gold || 0) - 140;
        out.temples = (out.temples || 0) + 1;
        out.buildings.push('Tempel');
      } else if (!out.hasFort && (out.gold || 0) >= 160 && (month > maxMonths / 2 || (out.troops || 0) > 200)) {
        out.gold = (out.gold || 0) - 160;
        out.hasFort = true;
        out.buildings.push('Fort');
      }
    }

    // Buy food if low
    if ((out.food || 0) < (out.foodCap || 0) * 0.25 && (out.gold || 0) >= 15) {
      out.gold -= 15; out.food = (out.food || 0) + 20;
    }
    // Improve morale if low
    if ((out.morale || 0) < 40 && (out.gold || 0) >= 10) {
      out.gold -= 10; out.morale = (out.morale || 0) + 5;
    }
    // Recruit troops if below threshold
    const troopThreshold = 150 + Math.max(0, month - 6) * 2;
    if ((out.troops || 0) < troopThreshold && (out.gold || 0) >= 10) {
      const gain = out.hasBarracks ? 15 : 10;
      out.gold -= 10; out.troops = (out.troops || 0) + gain;
    }
    // Recruit workers if low
    if ((out.workers || 0) < 50 && (out.gold || 0) >= 20) {
      out.gold -= 20; out.workers = (out.workers || 0) + 50;
    }

    return out;
  }

  return { applyAI };
});

