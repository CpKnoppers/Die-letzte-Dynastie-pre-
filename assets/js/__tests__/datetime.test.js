const { daysInMonth, formatDate, computeDayProgress } = require('../logic/datetime');

describe('logic/datetime', () => {
  test('daysInMonth handles common cases and leap years', () => {
    expect(daysInMonth(2021, 0)).toBe(31); // Jan 2021
    expect(daysInMonth(2021, 1)).toBe(28); // Feb 2021
    expect(daysInMonth(2020, 1)).toBe(29); // Feb 2020 (leap)
  });

  test('formatDate returns DD.MM.YYYY', () => {
    const d = new Date(925, 3, 1);
    expect(formatDate(d)).toBe('01.04.925');
  });

  test('computeDayProgress clamps to 0..100', () => {
    const d = new Date(2021, 0, 1);
    expect(computeDayProgress(d)).toBe(0);
  });
});

