import { compareSizes } from './size-order';

describe('compareSizes', () => {
  it('orders standard sizes from XS to XXL', () => {
    const sizes = ['L', 'XS', 'XXL', 'M', 'S', 'XL'];
    expect([...sizes].sort(compareSizes)).toEqual([
      'XS',
      'S',
      'M',
      'L',
      'XL',
      'XXL',
    ]);
  });

  it('sorts "تک سایز" after every standard and free-text size', () => {
    const sizes = ['تک سایز', 'M', 'از شماره 36 تا 45'];
    expect([...sizes].sort(compareSizes)).toEqual([
      'M',
      'از شماره 36 تا 45',
      'تک سایز',
    ]);
  });

  it('sorts free-text sizes after standard sizes', () => {
    const sizes = ['از شماره 36 تا 45', 'S'];
    expect([...sizes].sort(compareSizes)).toEqual(['S', 'از شماره 36 تا 45']);
  });
});
