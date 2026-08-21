import {
  sanitizeSourceHtml,
  extractFeaturesFromDescription,
} from './content-sanitizer';

describe('sanitizeSourceHtml', () => {
  it('converts paragraphs and line breaks into plain-text lines', () => {
    const html = '<p>خط اول</p><p>خط دوم<br />ادامه خط دوم</p>';
    expect(sanitizeSourceHtml(html)).toBe('خط اول\nخط دوم\nادامه خط دوم');
  });

  it('turns list items into dash-prefixed lines', () => {
    const html = '<ul><li>مورد یک</li><li>مورد دو</li></ul>';
    expect(sanitizeSourceHtml(html)).toBe('- مورد یک\n- مورد دو');
  });

  it('decodes common HTML entities, including Persian ZWNJ', () => {
    const html = '<p>می&zwnj;شود &amp; هم&nbsp;چنین</p>';
    expect(sanitizeSourceHtml(html)).toBe('می‌شود & هم چنین');
  });

  it('drops any link to the competitor storefront, including its text', () => {
    const html =
      '<p>توضیح محصول</p><h5>خرید محصول: <a href="https://sanigol.com/x">برای خرید اینترنتی کلیک کنید</a></h5>';
    const result = sanitizeSourceHtml(html);
    expect(result).not.toMatch(/sanigol/i);
    expect(result).not.toMatch(/خرید/);
    expect(result).toBe('توضیح محصول');
  });

  it('drops the source site "see full description below" boilerplate line', () => {
    const html =
      '<p>خلاصه محصول</p><p><strong>توضیحات تکمیلی پایین همین صفحه</strong></p>';
    expect(sanitizeSourceHtml(html)).toBe('خلاصه محصول');
  });

  it('strips script and style tags entirely, including their content', () => {
    const html =
      '<p>سالم</p><script>alert(1)</script><style>.x{color:red}</style>';
    expect(sanitizeSourceHtml(html)).toBe('سالم');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeSourceHtml('')).toBe('');
  });
});

describe('extractFeaturesFromDescription', () => {
  it('collects lines under a "موارد استفاده" heading until the next heading', () => {
    const text = [
      'یک توضیح کلی',
      'موارد استفاده:',
      'حمایت از مفصل زانو',
      'کاهش فشار روی کشکک',
      'نکات مهم:',
      'از حرارت دور نگه دارید',
    ].join('\n');

    expect(extractFeaturesFromDescription(text)).toEqual([
      'حمایت از مفصل زانو',
      'کاهش فشار روی کشکک',
    ]);
  });

  it('returns an empty array when there is no usage heading', () => {
    const text = 'فقط یک پاراگراف ساده بدون هدینگ خاص';
    expect(extractFeaturesFromDescription(text)).toEqual([]);
  });

  it('collects to the end of the text when there is no stop heading', () => {
    const text = ['موارد کاربرد:', 'مورد یک', 'مورد دو'].join('\n');
    expect(extractFeaturesFromDescription(text)).toEqual([
      'مورد یک',
      'مورد دو',
    ]);
  });
});
