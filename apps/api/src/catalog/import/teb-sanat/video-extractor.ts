// Looks for a real, product-specific instructional video embedded in raw
// (unsanitized) source HTML. Must run BEFORE sanitizeSourceHtml, which
// strips iframes/tags and would destroy this evidence.
//
// Deliberately narrow: only matches URL shapes that point at a specific
// video (a watch/embed/permalink id), never a bare channel/profile page
// (e.g. aparat.com/tebosanat is teb-sanat's general channel, not a video
// for this product — matching that would fabricate a per-product link
// that doesn't exist).

export type VideoSource = 'youtube' | 'aparat' | 'vimeo' | 'direct' | 'other';

export interface ExtractedVideo {
  url: string;
  source: VideoSource;
}

const VIDEO_URL_PATTERNS: Array<{ source: VideoSource; pattern: RegExp }> = [
  {
    source: 'youtube',
    pattern:
      /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{6,}[^\s"'<>]*/i,
  },
  {
    source: 'aparat',
    pattern:
      /https?:\/\/(?:www\.)?aparat\.com\/v\/[a-zA-Z0-9]+[^\s"'<>]*|https?:\/\/(?:www\.)?aparat\.com\/video\/[a-zA-Z0-9]+[^\s"'<>]*/i,
  },
  {
    source: 'vimeo',
    pattern:
      /https?:\/\/(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?\d+[^\s"'<>]*/i,
  },
  {
    source: 'direct',
    pattern: /https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mov)(?:\?[^\s"'<>]*)?/i,
  },
];

function findKnownVideoUrl(text: string): ExtractedVideo | null {
  for (const { source, pattern } of VIDEO_URL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { url: match[0], source };
    }
  }
  return null;
}

export function extractVideoUrl(rawHtml: string): ExtractedVideo | null {
  if (!rawHtml) return null;

  // 1) <iframe src="...">
  const iframeMatch = rawHtml.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i);
  if (iframeMatch) {
    const found = findKnownVideoUrl(iframeMatch[1]);
    if (found) return found;
  }

  // 2) <video src="..."> or a <source> inside a <video> block
  const videoTagMatch = rawHtml.match(
    /<video\b[^>]*>[\s\S]*?<\/video>|<video\b[^>]*\/>/i,
  );
  if (videoTagMatch) {
    const found = findKnownVideoUrl(videoTagMatch[0]);
    if (found) return found;
  }

  // 3) any known-host video URL appearing anywhere else (e.g. a plain <a href>)
  return findKnownVideoUrl(rawHtml);
}
