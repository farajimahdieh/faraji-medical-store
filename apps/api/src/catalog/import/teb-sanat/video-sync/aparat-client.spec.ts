import { parseAparatRss } from './aparat-client';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>کانال طب و صنعت</title>
    <link>https://www.aparat.com/tebosanat</link>
    <description>ویدیو هایی که کانال طب و صنعت منتشر کرده است</description>
    <item>
      <title><![CDATA[آرنج بند با مفصل مدرج]]></title>
      <link>https://www.aparat.com/v/dsuu9fj</link>
      <pubDate>Mon, 11 Nov 2024 10:27:16 +0330</pubDate>
      <description><![CDATA[آرنج&amp;zwnj;بند طب و صنعت با مفصل مدرج.]]></description>
    </item>
    <item>
      <title><![CDATA[فیلم کارخانه طب و صنعت]]></title>
      <link>https://www.aparat.com/v/d56l5r8</link>
      <pubDate>Tue, 01 Oct 2024 08:00:00 +0330</pubDate>
      <description><![CDATA[معرفی کارخانه]]></description>
    </item>
  </channel>
</rss>`;

describe('parseAparatRss', () => {
  it('extracts every item with title, url, and description', () => {
    const videos = parseAparatRss(SAMPLE_RSS);
    expect(videos).toHaveLength(2);
    expect(videos[0]).toEqual({
      title: 'آرنج بند با مفصل مدرج',
      url: 'https://www.aparat.com/v/dsuu9fj',
      description: 'آرنج‌بند طب و صنعت با مفصل مدرج.',
    });
    expect(videos[1].title).toBe('فیلم کارخانه طب و صنعت');
  });

  it('decodes double-encoded entities (the feed encodes &zwnj; as &amp;zwnj;)', () => {
    const videos = parseAparatRss(SAMPLE_RSS);
    // A real ZWNJ character, not the literal text "&zwnj;".
    expect(videos[0].description).toContain('آرنج‌بند');
    expect(videos[0].description).not.toContain('zwnj');
  });

  it('returns an empty array for a feed with no items', () => {
    const empty = `<rss version="2.0"><channel><title>خالی</title></channel></rss>`;
    expect(parseAparatRss(empty)).toEqual([]);
  });
});
