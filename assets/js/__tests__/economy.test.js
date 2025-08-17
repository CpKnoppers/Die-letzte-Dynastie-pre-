const { applyMonthlyEconomy, computeUpkeep, computeProduction, computeHarvestFactor, computeTaxFactor } = require('../logic/economy');

describe('logic/economy', () => {
  const baseProv = {
    name: 'Test',
    food: 100,
    gold: 100,
    troops: 180,
    morale: 60,
    foodCap: 300,
    baseF: 80,
    baseG: 60,
    workers: 50,
    hasMarket: false,
    hasBarracks: false,
    temples: 0,
    hasFort: false
  };

  test('compute factors match math helpers range', () => {
    expect(computeHarvestFactor(50)).toBeCloseTo(1.0, 12);
    expect(computeHarvestFactor(100)).toBeCloseTo(1.4, 12);
    expect(computeHarvestFactor(0)).toBeCloseTo(0.6, 12);
    expect(computeTaxFactor(100)).toBeCloseTo(1.3, 12);
  });

  test('upkeep accounts for troops and workers', () => {
    const up = computeUpkeep(baseProv);
    // troops 180 -> ceil(1.8)=2: F=12, G=16; workers 50 -> ceil(0.5)=1: F=4, G=6
    expect(up.food).toBe(16);
    expect(up.gold).toBe(22);
  });

  test('production respects morale and market', () => {
    let prod = computeProduction(baseProv);
    expect(prod.gold).toBeGreaterThan(0);
    const withMarket = { ...baseProv, hasMarket: true };
    prod = computeProduction(withMarket);
    const withoutMarket = computeProduction({ ...baseProv, hasMarket: false });
    expect(prod.gold - withoutMarket.gold).toBeCloseTo(10, 6);
  });

  test('applyMonthlyEconomy typical month increases resources', () => {
    const { prov, deltas } = applyMonthlyEconomy(baseProv);
    expect(prov.food).toBeGreaterThan(0);
    expect(prov.gold).toBeGreaterThan(0);
    expect(deltas.food).toBeGreaterThan(0);
    expect(deltas.gold).toBeGreaterThan(0);
  });

  test('food deficit causes deserters and morale drop', () => {
    const lowFood = { ...baseProv, food: 1, troops: 200 };
    const { prov } = applyMonthlyEconomy(lowFood);
    expect(prov.morale).toBeLessThan(baseProv.morale);
    expect(prov.troops).toBeLessThan(lowFood.troops);
    expect(prov.food).toBeGreaterThanOrEqual(0);
  });

  test('temples raise morale monthly and clamp 0..100', () => {
    const withTemple = { ...baseProv, temples: 1, morale: 98 };
    const { prov } = applyMonthlyEconomy(withTemple);
    expect(prov.morale).toBeLessThanOrEqual(100);
    expect(prov.morale).toBeGreaterThanOrEqual(98);
  });
});

