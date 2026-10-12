import { checkProductContent } from './product-content';

const words = (n: number) => Array.from({ length: n }, () => 'کلمه').join(' ');

function valid(): Record<string, unknown> {
  return {
    slug: 'پانسمان-هیدروکل-هارتمن-آلمان',
    shortDescription: 'پانسمان هیدروکلوئید برای زخم‌های کم‌ترشح',
    description: words(120),
    metaTitle: 'خرید پانسمان هیدروکلوئید هارتمن | فروشگاه فرجی',
    metaDescription: 'x'.repeat(140),
    features: ['ضد آب'],
    specifications: [{ name: 'سایز', value: '10×10' }],
    faqs: [
      { question: 'q1', answer: 'a1' },
      { question: 'q2', answer: 'a2' },
      { question: 'q3', answer: 'a3' },
    ],
    images: [
      {
        url: 'https://example.com/a.jpg',
        alt: 'پانسمان هیدروکلوئید',
        source: 'https://example.com/p',
      },
    ],
    sources: ['https://example.com/p'],
  };
}

describe('checkProductContent', () => {
  it('accepts a complete file without warnings', () => {
    const result = checkProductContent(valid());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.content?.slug).toBe('پانسمان-هیدروکل-هارتمن-آلمان');
  });

  it('rejects meta fields longer than their DB columns', () => {
    const data = {
      ...valid(),
      metaTitle: 'x'.repeat(71),
      metaDescription: 'x'.repeat(171),
    };
    expect(checkProductContent(data).errors).toHaveLength(2);
  });

  it('requires the sources the facts came from', () => {
    expect(checkProductContent({ ...valid(), sources: [] }).errors).toEqual([
      '"sources" must list where the facts came from',
    ]);
  });

  it('requires exactly one of url/file per image, and safe paths', () => {
    const data = {
      ...valid(),
      images: [
        { alt: 'a' },
        { url: 'ftp://x/a.jpg', alt: 'a' },
        { file: '../secret.jpg', alt: 'a' },
        { url: 'https://x/a.jpg', file: 'b.jpg', alt: 'a' },
      ],
    };
    const { errors } = checkProductContent(data);
    expect(errors).toEqual([
      'images[0] needs exactly one of "url" or "file"',
      'images[1].url must be an http(s) URL',
      'images[2].file must not contain ".."',
      'images[3] needs exactly one of "url" or "file"',
    ]);
  });

  it('caps the image count', () => {
    const image = { file: 'data-private/photos/a.jpg', alt: 'a' };
    const data = { ...valid(), images: Array(5).fill(image) };
    expect(checkProductContent(data).errors).toEqual(['5 images (max 4)']);
  });

  it('warns on SEO guidance without blocking', () => {
    const data = { ...valid(), description: words(40), faqs: [], images: [] };
    const result = checkProductContent(data);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(3);
  });

  it('rejects non-objects', () => {
    expect(checkProductContent([]).errors).toEqual([
      'file is not a JSON object',
    ]);
  });
});
