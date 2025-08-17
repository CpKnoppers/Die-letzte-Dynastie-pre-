const { scoreOptionLabel, labelToHtml } = require('../logic/text');

describe('logic/text helpers', () => {
  test('scoreOptionLabel prefers positive over negative', () => {
    const a = scoreOptionLabel('+10 Nahrung');
    const b = scoreOptionLabel('−10 Nahrung'); // Unicode minus
    expect(a).toBeGreaterThan(b);
  });

  test('scoreOptionLabel penalizes ignore-like options', () => {
    const s = scoreOptionLabel('Ignorieren (−10 Moral)');
    const t = scoreOptionLabel('Heiler anheuern (+10 Moral)');
    expect(s).toBeLessThan(t);
  });

  test('labelToHtml inserts icon spans', () => {
    const html = labelToHtml('+15 Moral und −20 Gold');
    expect(html).toContain('icon-morale');
    expect(html).toContain('icon-gold');
  });

  test('labelToHtml handles regular hyphen and unicode minus', () => {
    const hyphen = labelToHtml('-20 Nahrung');
    const unicodeMinus = labelToHtml('−20 Nahrung');
    expect(hyphen).toContain('icon-food');
    expect(unicodeMinus).toContain('icon-food');
  });
});

