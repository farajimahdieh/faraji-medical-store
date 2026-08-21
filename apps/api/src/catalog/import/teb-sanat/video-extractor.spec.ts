import { extractVideoUrl } from './video-extractor';

describe('extractVideoUrl', () => {
  it('extracts a YouTube URL from an iframe src', () => {
    const html =
      '<p>توضیح</p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560"></iframe>';
    expect(extractVideoUrl(html)).toEqual({
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      source: 'youtube',
    });
  });

  it('extracts an Aparat video permalink from an iframe src', () => {
    const html =
      '<iframe src="https://www.aparat.com/video/embed/abc123XY"></iframe>';
    expect(extractVideoUrl(html)?.source).toBe('aparat');
  });

  it('extracts a youtu.be short link from a plain anchor', () => {
    const html =
      '<a href="https://youtu.be/dQw4w9WgXcQ">مشاهده ویدیوی آموزشی</a>';
    expect(extractVideoUrl(html)).toEqual({
      url: 'https://youtu.be/dQw4w9WgXcQ',
      source: 'youtube',
    });
  });

  it('extracts a direct video file URL', () => {
    const html = '<a href="https://teb-sanat.com/uploads/guide.mp4">راهنما</a>';
    expect(extractVideoUrl(html)?.source).toBe('direct');
  });

  it('does NOT treat a bare Aparat channel link as a product video', () => {
    // This is teb-sanat's general channel link (seen site-wide in nav
    // menus), not a video for any specific product.
    const html =
      '<a href="https://www.aparat.com/tebosanat">فیلم های آموزشی</a>';
    expect(extractVideoUrl(html)).toBeNull();
  });

  it('does NOT treat a bare YouTube channel link as a product video', () => {
    const html = '<a href="https://www.youtube.com/@tebosanat">کانال ما</a>';
    expect(extractVideoUrl(html)).toBeNull();
  });

  it('returns null for a description with no video at all', () => {
    const html =
      '<p>این محصول با استفاده از بهترین نوع نئوپرن تولید شده است.</p>';
    expect(extractVideoUrl(html)).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(extractVideoUrl('')).toBeNull();
  });

  it('prefers an iframe video over an unrelated link elsewhere in the same HTML', () => {
    const html =
      '<a href="https://sanigol.com/buy">خرید</a><iframe src="https://www.aparat.com/video/v/xyz987"></iframe>';
    const result = extractVideoUrl(html);
    expect(result?.source).toBe('aparat');
    expect(result?.url).toContain('xyz987');
  });
});
