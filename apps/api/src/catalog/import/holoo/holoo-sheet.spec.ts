import {
  applyItemOverrides,
  groupBySize,
  overrideTarget,
  parseHolooSheet,
  splitSize,
} from './holoo-sheet';

const HEADER = ['نام کالا', 'تعداد', 'قیمت خرید', 'قیمت فروش', 'کد کالا'];

describe('splitSize', () => {
  it('pulls a dimension size out of the name', () => {
    expect(splitSize('پانسمان هیدروکل هارتمن آلمان 20*20')).toEqual({
      baseName: 'پانسمان هیدروکل هارتمن آلمان',
      size: '20×20',
    });
  });

  it('handles sizes glued to words and decimals', () => {
    expect(splitSize('پانسمان شفاف10*12یوروفارم ایتالیا')).toEqual({
      baseName: 'پانسمان شفاف یوروفارم ایتالیا',
      size: '10×12',
    });
    expect(splitSize('پانسمان هیدروکلین 7.5*7.5 هارتمن آلمان').size).toBe(
      '7.5×7.5',
    );
  });

  it('treats a width in سانت as a size', () => {
    expect(splitSize('باند پانسمان20 سانت 3یارد کنار بافته')).toEqual({
      baseName: 'باند پانسمان 3یارد کنار بافته',
      size: '20 سانت',
    });
  });

  it('does not treat volume or weight as a size', () => {
    expect(splitSize('اسپری طباسپت 30 میل تریتا').size).toBeNull();
    expect(splitSize('پودر نقره 2 گرم طباگرم پلاس').size).toBeNull();
  });
});

describe('parseHolooSheet', () => {
  it('converts Rial to Toman and never exposes the purchase price', () => {
    const { items, errors } = parseHolooSheet([
      HEADER,
      ['گاز استریل زرین طب 10*10', 600, 50000, 60000, '118590003'],
    ]);
    expect(errors).toEqual([]);
    expect(items[0]).toMatchObject({
      code: '118590003',
      stock: 600,
      priceToman: 6000,
      issues: [],
    });
    expect(JSON.stringify(items)).not.toContain('50000');
  });

  it('withholds a price that looks like an extra zero', () => {
    const { items } = parseHolooSheet([
      HEADER,
      ['فوم سیلیکون 15*15 چسبدار لوکوفام', 14, 5800000, 70000000, '113230012'],
    ]);
    expect(items[0].priceToman).toBeNull();
    expect(items[0].issues[0]).toContain('صفر اضافه');
  });

  it('withholds a sale price below the purchase price', () => {
    const { items } = parseHolooSheet([HEADER, ['x', 1, 1000, 500, '1']]);
    expect(items[0].priceToman).toBeNull();
  });

  it('floors fractional stock and reports it', () => {
    const { items } = parseHolooSheet([HEADER, ['x', 1.5, 1000, 1200, '1']]);
    expect(items[0].stock).toBe(1);
    expect(items[0].issues).toHaveLength(1);
  });

  it('finds columns by header text in any order and skips blank rows', () => {
    const { items } = parseHolooSheet([
      ['کد کالا', 'قیمت فروش', 'نام کالا', 'موجودی'],
      ['', '', '', ''],
      ['7', '۱۲۰٬۰۰۰', 'باند', '۳'],
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ code: '7', priceToman: 12000, stock: 3 });
  });

  it('reports duplicate codes and missing columns', () => {
    const { errors } = parseHolooSheet([
      ['نام کالا', 'کد کالا'],
      ['a', '1'],
      ['b', '1'],
    ]);
    expect(errors.some((e) => e.includes('تکراری'))).toBe(true);
    expect(errors.some((e) => e.includes('قیمت فروش'))).toBe(true);
  });

  it('fails clearly when the header row is missing', () => {
    expect(parseHolooSheet([['a', 'b']]).errors).toHaveLength(1);
  });
});

describe('groupBySize', () => {
  it('merges sizes of the same item into one product', () => {
    const { items } = parseHolooSheet([
      HEADER,
      ['پانسمان هیدروکل هارتمن آلمان 20*20', 20, 100, 120, 'a'],
      ['پانسمان هیدروکل هارتمن آلمان 15*15', 24, 100, 120, 'b'],
      ['پانسمان هیدروکل هارتمن آلمان 10*10', 9, 100, 120, 'c'],
      ['کلین پد (اسکاج زخم)', 91, 100, 120, 'd'],
    ]);
    const groups = groupBySize(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe('پانسمان هیدروکل هارتمن آلمان');
    expect(groups[0].items.map((i) => i.size)).toEqual([
      '20×20',
      '15×15',
      '10×10',
    ]);
    expect(groups[1].name).toBe('کلین پد (اسکاج زخم)');
  });

  it('keeps rows separate when a size repeats inside a group', () => {
    const { items } = parseHolooSheet([
      HEADER,
      ['فوم 10*10 رزین', 2, 100, 120, 'a'],
      ['فوم 10*10 رزین', 2, 100, 120, 'b'],
    ]);
    const groups = groupBySize(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].items[0].issues[0]).toContain('ادغام نشد');
  });
});

describe('applyItemOverrides', () => {
  it('splits a one-size row off a sized group', () => {
    const { items } = parseHolooSheet([
      HEADER,
      ['ثابت کننده زانو تک سایز طب و صنعت', 1, 100, 120, 'a'],
      ['ثابت کننده زانو S طب و صنعت', 1, 100, 120, 'b'],
      ['ثابت کننده زانو M طب و صنعت', 1, 100, 120, 'c'],
    ]);
    const groups = groupBySize(
      applyItemOverrides(items, {
        a: { product: 'knee-one-size', group: 'ثابت کننده زانو تک سایز' },
        b: 'knee',
      }),
    );
    expect(groups.map((g) => g.items.map((i) => i.code))).toEqual([
      ['a'],
      ['b', 'c'],
    ]);
  });

  it('merges rows into one group with the given sizes', () => {
    const { items } = parseHolooSheet([
      HEADER,
      ['پروتز آمونا 14', 1, 100, 120, 'a'],
      ['پروتز آمونا 3', 1, 100, 120, 'b'],
    ]);
    const groups = groupBySize(
      applyItemOverrides(items, {
        a: { group: 'پروتز آمونا', size: '14' },
        b: { group: 'پروتز آمونا', size: '3' },
      }),
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('پروتز آمونا');
    expect(groups[0].items.map((i) => i.size)).toEqual(['14', '3']);
  });

  it('reads the target product from either form', () => {
    expect(overrideTarget('new')).toBe('new');
    expect(overrideTarget({ product: 'slug', size: 'L' })).toBe('slug');
    expect(overrideTarget({ size: 'L' })).toBeUndefined();
    expect(overrideTarget(undefined)).toBeUndefined();
  });
});
