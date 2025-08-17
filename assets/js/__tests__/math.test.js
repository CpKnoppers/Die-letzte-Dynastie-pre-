const { clamp, computeHarvestFactor, computeTaxFactor } = require('../math');

describe('math helpers', () => {
  test('clamp bounds correctly', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(150, 0, 100)).toBe(100);
  });

  test('computeHarvestFactor at key morale points', () => {
    const eps = 1e-10;
    expect(Math.abs(computeHarvestFactor(50) - 1)).toBeLessThan(eps);
    expect(Math.abs(computeHarvestFactor(100) - 1.4)).toBeLessThan(1e-12);
    expect(Math.abs(computeHarvestFactor(0) - 0.6)).toBeLessThan(1e-12);
  });

  test('computeTaxFactor at key morale points', () => {
    const eps = 1e-10;
    expect(Math.abs(computeTaxFactor(50) - 1)).toBeLessThan(eps);
    expect(Math.abs(computeTaxFactor(100) - 1.3)).toBeLessThan(1e-12);
    expect(Math.abs(computeTaxFactor(0) - 0.7)).toBeLessThan(1e-12);
  });
});

