import { buildContentSkeleton } from './content-scaffold';
import { checkProductContent } from './product-content';

describe('buildContentSkeleton', () => {
  const skeleton = buildContentSkeleton({
    slug: 'فوم-رزین',
    name: 'فوم رزین',
    accountingNames: ['فوم 10*10 رزین', 'فوم 15*15 رزین'],
    sizes: ['10×10', '15×15'],
  });

  it('prefills what is already known', () => {
    expect(skeleton).toMatchObject({
      slug: 'فوم-رزین',
      specifications: [{ name: 'سایزهای موجود', value: '10×10، 15×15' }],
      _holooNames: ['فوم 10*10 رزین', 'فوم 15*15 رزین'],
    });
  });

  it('does not pass validation until it is written', () => {
    expect(checkProductContent(skeleton).errors.length).toBeGreaterThan(0);
  });

  it('leaves the default single size out of the specs', () => {
    const single = buildContentSkeleton({
      slug: 's',
      name: 's',
      accountingNames: ['s'],
      sizes: ['استاندارد'],
    });
    expect(single.specifications).toEqual([]);
  });
});
