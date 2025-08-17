const { computeProvinceScore, computeAllScores, rateTotal } = require('../logic/score');

describe('logic/score', () => {
  test('computeProvinceScore matches formula and rounds', () => {
    const prov = { name: 'X', troops: 100, morale: 60, food: 80, hasFort: true, temples: 2, hasMarket: true };
    // score = 100*1 + 60*2 + 80*0.5 + 150 + 2*20 + 10 = 100 + 120 + 40 + 150 + 40 + 10 = 460
    expect(computeProvinceScore(prov)).toBe(460);
  });

  test('computeAllScores aggregates and returns results', () => {
    const provinces = {
      a: { name: 'A', troops: 50, morale: 50, food: 100 },
      b: { name: 'B', troops: 80, morale: 70, food: 120 }
    };
    const { results, totalScore } = computeAllScores(provinces);
    expect(results.length).toBe(2);
    expect(totalScore).toBe(results[0].score + results[1].score);
  });

  test('rateTotal thresholds', () => {
    expect(rateTotal(2600)).toMatch(/Großartig/);
    expect(rateTotal(1600)).toMatch(/Nicht schlecht/);
    expect(rateTotal(1000)).toMatch(/schwach/);
  });
});

