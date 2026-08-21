import { normalizeSourceUrl } from './url';

describe('normalizeSourceUrl', () => {
  it('drops a trailing slash', () => {
    expect(normalizeSourceUrl('https://teb-sanat.com/product/x/')).toBe(
      'https://teb-sanat.com/product/x',
    );
  });

  it('keeps the root path as "/" without stripping it entirely', () => {
    expect(normalizeSourceUrl('https://teb-sanat.com/')).toBe(
      'https://teb-sanat.com/',
    );
  });

  it('forces https and lowercases the host', () => {
    expect(normalizeSourceUrl('http://TEB-SANAT.com/product/x')).toBe(
      'https://teb-sanat.com/product/x',
    );
  });

  it('strips query strings and hash fragments', () => {
    expect(
      normalizeSourceUrl('https://teb-sanat.com/product/x?utm=abc#section'),
    ).toBe('https://teb-sanat.com/product/x');
  });

  it('produces the same value for two URLs that only differ by trailing slash and case', () => {
    const a = normalizeSourceUrl('https://teb-sanat.com/product/x/');
    const b = normalizeSourceUrl('http://TEB-SANAT.com/product/x');
    expect(a).toBe(b);
  });
});
