// Meta progression and local profile persistence helpers (UMD + CommonJS)
// - Exposes as window.DLD.logicMeta in browser
// - Pure helpers to keep UI code slim

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const api = factory();
    root.DLD = root.DLD || {};
    root.DLD.logicMeta = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  /**
   * Load profile from storage (name/crest).
   * @param {Object} storage - EltheonJS.storage.local compatible (get/set/remove).
   * @returns {Promise<{name?:string, crestImg?:string}>}
   */
  async function loadProfile(storage) {
    try {
      const data = storage && storage.get ? await storage.get('profile') : null;
      return data || {};
    } catch (_) {
      return {};
    }
  }

  /**
   * Save profile to storage.
   * @param {Object} storage - EltheonJS.storage.local compatible.
   * @param {{name?:string, crestImg?:string}} profile
   */
  function saveProfile(storage, profile) {
    if (!storage || !storage.set) return;
    storage.set('profile', {
      name: profile && profile.name ? String(profile.name).slice(0, 40) : undefined,
      crestImg: profile && profile.crestImg ? String(profile.crestImg) : undefined
    });
  }

  // -- Internal helpers -----------------------------------------------------
  function defaultProfile() {
    return {
      version: '1.0',
      seals: 50,
      hq: { level: 1 },
      loadout: { cards: [] },
      unlocks: [],
      realm: { terraformStage: 0, startBonuses: {} },
    };
  }

  function migrateOldMeta(old) {
    const prof = defaultProfile();
    if (!old) return prof;
    // Prefer explicit new fields; fallback to legacy fields
    if (typeof old.seals === 'number') {
      prof.seals = Math.max(0, Math.floor(old.seals));
    } else if (typeof old.currency === 'number') {
      prof.seals = Math.max(0, Math.floor(old.currency));
    }
    if (old.loadout && Array.isArray(old.loadout.cards)) {
      prof.loadout.cards = old.loadout.cards.slice(0, 20);
    } else if (Array.isArray(old.upgrades)) {
      prof.loadout.cards = old.upgrades.slice(0, 20);
    }
    if (old.hq && typeof old.hq.level === 'number') prof.hq = { level: Math.max(1, Math.floor(old.hq.level)) };
    if (old.hq && Array.isArray(old.hq.buildings)) prof.hq.buildings = old.hq.buildings.slice(0, 20);
    if (old.realm && old.realm.terraformStage != null) prof.realm = old.realm;
    if (Array.isArray(old.unlocks)) prof.unlocks = old.unlocks.slice(0, 200);
    return prof;
  }

  /**
   * Load meta profile from storage and normalize to the new shape.
   * @param {Object} storage - EltheonJS.storage.local compatible.
   * @returns {Promise<object>} normalized profile
   */
  async function loadMeta(storage) {
    try {
      const data = storage && storage.get ? await storage.get('metaProgress') : null;
      return migrateOldMeta(data);
    } catch (_) {
      return defaultProfile();
    }
  }

  /**
   * Save meta progress to storage.
   * @param {Object} storage - EltheonJS.storage.local compatible.
   * @param {{currency:number, upgrades:string[]}} meta
   */
  function saveMeta(storage, meta) {
    if (!storage || !storage.set) return;
    // Accept both old and new shapes, persist new unified shape
    const prof = migrateOldMeta(meta);
    storage.set('metaProgress', prof);
  }

  /**
   * Compute reward currency from a total score (placeholder formula).
   * @param {number} totalScore
   * @returns {number} currency earned
   */
  function computeRewards(totalScore, opts) {
    const s = Math.max(0, Math.floor(totalScore || 0));
    const diff = opts && typeof opts.difficulty === 'number' ? Math.max(0.5, Math.min(3, opts.difficulty)) : 1;
    return Math.floor((s / 600) * diff);
  }

  /**
   * Return catalog of available upgrades with costs and labels.
   * @returns {Array<{id:string,label:string,cost:number}>}
   */
  function getUpgradesCatalog() {
    return [
      // Simple start modifiers (act like loadout cards in proto)
      { id: 'granary-I', label: 'Baukunst I – +50 Nahrungskapazität', cost: 0, slotType: 'logistics' },
      { id: 'piety-I', label: 'Frömmigkeit I – +5 Startmoral', cost: 1, slotType: 'archive' },
      { id: 'stewardship-I', label: 'Verwaltung I – +10 Basisgold', cost: 2, slotType: 'logistics' },
      // Spec-inspired loadout examples (require relevant building unlocks)
      { id: 'build_limit_plus_1', label: 'Baukontingent +1 (Cap +2)', cost: 5, requires: ['tree:workshop.limit.plus1'], slotType: 'logistics' },
      { id: 'intel_shrink_10pp', label: 'Intel-Unsicherheit −10 %-Punkte (Floor 10%)', cost: 15, requires: ['tree:spycraft.intel.shrink1'], slotType: 'war' },
      { id: 'seal_bonus_10', label: 'Siegel-Ertrag +10% (Cap +20%)', cost: 20, requires: ['tree:sealsarchive.bonus10'], slotType: 'archive' }
    ];
  }

  function getCardSlotType(cardId) {
    const cat = getUpgradesCatalog();
    const c = cat.find(x => x.id === cardId);
    return c && c.slotType ? c.slotType : null;
  }

  /**
   * Catalog of unlockable tree nodes/buildings that gate certain loadout cards.
   * Each unlock is permanent and stored in profile.unlocks.
   */
  function getUnlocksCatalog() {
    return [
      { id: 'tree:workshop.limit.plus1', label: 'Werkstatt: Baukontingent-Freigabe (+1)', cost: 8 },
      { id: 'tree:spycraft.intel.shrink1', label: 'Spionage: Spähernetz I (−10 %-Punkte)', cost: 12 },
      { id: 'tree:sealsarchive.bonus10', label: 'Siegel-Archiv: Ertragsbonus +10%', cost: 15 }
    ];
  }

  // Palace/HQ slot mapping (placeholder; mirrors meta/defs/palace.yaml)
  function getSlotTypesForLevel(level) {
    const map = {
      1: ['throne','logistics'],
      2: ['throne','logistics','war'],
      3: ['throne','logistics','war','archive']
    };
    return map[Math.max(1, Math.min(3, level || 1))].slice();
  }
  function getMaxSlots(level) { return getSlotTypesForLevel(level).length; }

  function getSealsBonusPercent(profile) {
    const cards = (profile && profile.loadout && Array.isArray(profile.loadout.cards)) ? profile.loadout.cards : [];
    const bonusCards = cards.filter(id => id === 'seal_bonus_10').length;
    return Math.min(20, bonusCards * 10);
  }

  // Terraforming stages (0..4): Ödland → Steppe → Ackerland → Aue → Eden
  function getTerraformStages() {
    return [
      { stage: 0, id: 'wasteland', label: 'Ödland', cost: 0, startBonuses: { } },
      { stage: 1, id: 'steppe', label: 'Steppe', cost: 5, startBonuses: { nahrung: 1 } },
      { stage: 2, id: 'farmland', label: 'Ackerland', cost: 10, startBonuses: { nahrung: 2, arbeiter: 1 } },
      { stage: 3, id: 'meadow', label: 'Aue', cost: 15, startBonuses: { nahrung: 4, arbeiter: 1, moral: 1 }, eventWeights: { harvest_fest: 2, flood: 1 } },
      { stage: 4, id: 'eden', label: 'Eden', cost: 25, startBonuses: { nahrung: 6, arbeiter: 2, moral: 2 }, eventWeights: { harvest_fest: 3 } }
    ];
  }
  function getTerraformLabel(stage) {
    const def = getTerraformStages()[Math.max(0, Math.min(4, stage||0))];
    return def ? def.label : 'Ödland';
  }

  /**
   * Build a Run-Start package from meta profile.
   * @param {object} profile - normalized meta profile
   * @returns {{realmStart:Object, buildLimitDelta:number, intel:Object, availability:string[], eventWeights:Object}}
   */
  function exportRunStart(profile) {
    const p = migrateOldMeta(profile);
    const cards = p.loadout && Array.isArray(p.loadout.cards) ? p.loadout.cards : [];
    const realmStart = Object.assign({}, (p.realm && p.realm.startBonuses) || {});
    // Terraforming bonuses
    const stage = (p.realm && typeof p.realm.terraformStage === 'number') ? p.realm.terraformStage : 0;
    const tdefs = getTerraformStages();
    const t = tdefs[Math.max(0, Math.min(tdefs.length-1, stage))];
    if (t && t.startBonuses) {
      // Map bonuses to our province model fields
      if (t.startBonuses.nahrung) realmStart.food = (realmStart.food || 0) + t.startBonuses.nahrung;
      if (t.startBonuses.arbeiter) realmStart.workers = (realmStart.workers || 0) + t.startBonuses.arbeiter;
      if (t.startBonuses.moral) realmStart.morale = (realmStart.morale || 0) + t.startBonuses.moral;
    }
    // Map known cards to simple start effects for current prototype
    if (cards.includes('granary-I')) {
      realmStart.foodCapDelta = (realmStart.foodCapDelta || 0) + 50;
    }
    if (cards.includes('piety-I')) {
      realmStart.morale = (realmStart.morale || 0) + 5;
    }
    if (cards.includes('stewardship-I')) {
      realmStart.baseG = (realmStart.baseG || 0) + 10;
    }
    // Build limit delta from loadout (cap +2)
    const buildPlus = cards.filter(id => id === 'build_limit_plus_1').length;
    const buildLimitDelta = Math.min(2, buildPlus);
    // Intel uncertainty floor (cannot go below 10%)
    const shrinkers = cards.filter(id => id === 'intel_shrink_10pp').length;
    const intel = { uncertaintyFloor: 10 }; // floor 10% as per spec cap
    const availability = [];
    // Availability tokens from HQ buildings
    const blds = (p.hq && Array.isArray(p.hq.buildings)) ? p.hq.buildings : [];
    if (blds.some(b => b.id === 'throne_vassal')) availability.push('king_diplomacy');
    if (blds.some(b => b.id === 'war_spy')) availability.push('intel_recon');
    if (blds.some(b => b.id === 'seals_archive')) availability.push('seal_economy');
    // Merge terraform event weights
    const eventWeights = Object.assign({}, (p.realm && p.realm.eventWeights) || {}, (t && t.eventWeights) || {});
    return { realmStart, buildLimitDelta, intel, availability, eventWeights };
  }

  /**
   * Apply permanent meta upgrades to a starting province.
   * Pure function; does not mutate input.
   * @param {Object} provIn
   * @param {{upgrades:string[]}} meta
   * @returns {Object} new province
   */
  function applyMetaBonuses(provIn, meta) {
    const prov = Object.assign({}, provIn);
    const ups = (meta && Array.isArray(meta.upgrades)) ? meta.upgrades : [];
    // v0.1: 3 einfache Startboni
    if (ups.includes('granary-I')) {
      prov.foodCap = (prov.foodCap || 0) + 50;
    }
    if (ups.includes('piety-I')) {
      prov.morale = Math.min(100, (prov.morale || 0) + 5);
    }
    if (ups.includes('stewardship-I')) {
      prov.baseG = (prov.baseG || 0) + 10;
    }
    return prov;
  }

  return { loadProfile, saveProfile, loadMeta, saveMeta, computeRewards, applyMetaBonuses, getUpgradesCatalog, exportRunStart, getSlotTypesForLevel, getMaxSlots, getSealsBonusPercent, getUnlocksCatalog, getTerraformStages, getTerraformLabel, getCardSlotType };
});
