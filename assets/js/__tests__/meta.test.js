const meta = require('../logic/meta');

describe('logicMeta.applyMetaBonuses', () => {
  test('applies granary-I, piety-I, stewardship-I cumulatively', () => {
    const start = { foodCap: 300, morale: 50, baseG: 60 };
    const out = meta.applyMetaBonuses(start, { upgrades: ['granary-I', 'piety-I', 'stewardship-I'] });
    expect(out.foodCap).toBe(350);
    expect(out.morale).toBe(55);
    expect(out.baseG).toBe(70);
    // original is not mutated
    expect(start.foodCap).toBe(300);
  });
});

