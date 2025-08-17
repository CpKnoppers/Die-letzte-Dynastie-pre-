const { getSeasonName, getSeasonImage } = require('../logic/seasons');

describe('logic/seasons', () => {
  test('season mapping by month index', () => {
    expect(getSeasonName(0)).toBe('winter'); // Jan
    expect(getSeasonName(3)).toBe('spring'); // Apr
    expect(getSeasonName(6)).toBe('summer'); // Jul
    expect(getSeasonName(9)).toBe('autumn'); // Oct
  });

  test('season image path uses default base', () => {
    expect(getSeasonImage(0)).toMatch(/banner-winter\.png$/);
  });
});

