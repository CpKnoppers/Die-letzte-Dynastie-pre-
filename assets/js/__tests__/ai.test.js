const { applyAI } = require('../logic/ai');

describe('logic/ai', () => {
  test('builds Kornspeicher when near cap and enough gold', () => {
    const prov = { food: 210, foodCap: 250, gold: 100, buildings: [], buildingSlots: 3, morale: 80, troops: 300, workers: 100 };
    const out = applyAI(prov, { month: 5, maxMonths: 24 });
    expect(out.foodCap).toBe(350);
    expect(out.gold).toBe(20);
    expect(out.buildings.includes('Kornspeicher')).toBe(true);
  });

  test('buys food when low', () => {
    const prov = { food: 10, foodCap: 200, gold: 20, buildings: [], buildingSlots: 3 };
    const out = applyAI(prov, { month: 3, maxMonths: 24 });
    expect(out.food).toBeGreaterThan(prov.food);
    expect(out.gold).toBeLessThan(prov.gold);
  });

  test('recruits troops below threshold', () => {
    const prov = { troops: 120, gold: 15, hasBarracks: false, morale: 80, buildingSlots: 0 };
    const out = applyAI(prov, { month: 8, maxMonths: 24 });
    expect(out.troops).toBeGreaterThan(prov.troops);
    expect(out.gold).toBe(prov.gold - 10);
  });
});
