import { normalizeSearchQuery } from './persian-search.util';

describe('normalizeSearchQuery', () => {
  it('unifies Arabic-script Yeh/Kaf into Persian forms', () => {
    expect(normalizeSearchQuery('كمربند')).toBe('کمربند');
    expect(normalizeSearchQuery('ي')).toBe('ی');
  });

  it('replaces ZWNJ (half-space) with a regular space', () => {
    expect(normalizeSearchQuery('می‌بند')).toBe('می بند');
  });

  it('collapses repeated whitespace and trims', () => {
    expect(normalizeSearchQuery('  زانو    بند  ')).toBe('زانو بند');
  });

  it('leaves already-normalized text unchanged', () => {
    expect(normalizeSearchQuery('کمربند طبی')).toBe('کمربند طبی');
  });

  it('returns an empty string for empty/whitespace-only input', () => {
    expect(normalizeSearchQuery('')).toBe('');
    expect(normalizeSearchQuery('   ')).toBe('');
  });
});
