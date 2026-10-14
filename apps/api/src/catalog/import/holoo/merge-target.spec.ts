import { pickMergeTarget } from './merge-target';

describe('pickMergeTarget', () => {
  const codes = ['1', '2', '3'];

  it('returns null when no code is linked yet', () => {
    expect(pickMergeTarget(codes, [])).toBeNull();
  });

  it('returns the only linked product', () => {
    expect(
      pickMergeTarget(codes, [
        { code: '1', productId: 'a' },
        { code: '2', productId: 'a' },
      ]),
    ).toBe('a');
  });

  it('prefers the product named by an override', () => {
    expect(
      pickMergeTarget(
        codes,
        [
          { code: '1', productId: 'a' },
          { code: '2', productId: 'b' },
        ],
        'b',
      ),
    ).toBe('b');
  });

  it('ignores an override that is not one of the linked products', () => {
    expect(
      pickMergeTarget(
        codes,
        [
          { code: '1', productId: 'a' },
          { code: '2', productId: 'b' },
        ],
        'z',
      ),
    ).toBe('a');
  });

  it('prefers the product holding most of the codes', () => {
    expect(
      pickMergeTarget(codes, [
        { code: '1', productId: 'a' },
        { code: '2', productId: 'b' },
        { code: '3', productId: 'b' },
      ]),
    ).toBe('b');
  });

  it('breaks ties by the earliest code in the group', () => {
    expect(
      pickMergeTarget(codes, [
        { code: '3', productId: 'a' },
        { code: '2', productId: 'b' },
      ]),
    ).toBe('b');
  });
});
