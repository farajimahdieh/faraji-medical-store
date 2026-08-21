// Decides how to present a product's instructional video.
export type VideoEmbedDecision =
  | { type: "iframe"; src: string }
  | { type: "video"; src: string }
  | { type: "link" };

const EMBED_READY_PATTERNS = [
  /youtube\.com\/embed\//i,
  /aparat\.com\/video\/embed/i,
  /player\.vimeo\.com/i,
];

// Aparat's public watch links look like "https://www.aparat.com/v/{hash}"
// (not embeddable directly) while their real embed pages live at this
// dedicated path — verified against a real video from the channel this
// project syncs from. Same hash, different path.
function aparatEmbedUrlFromWatchUrl(url: string): string | null {
  const match = url.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/i);
  if (!match) return null;
  return `https://www.aparat.com/video/video/embed/videohash/${match[1]}/vt/frame`;
}

export function resolveVideoEmbed(
  url: string,
  source: string | null,
): VideoEmbedDecision {
  if (source === "direct") {
    return { type: "video", src: url };
  }

  if (source === "aparat") {
    const embedUrl = aparatEmbedUrlFromWatchUrl(url);
    if (embedUrl) return { type: "iframe", src: embedUrl };
  }

  if (EMBED_READY_PATTERNS.some((pattern) => pattern.test(url))) {
    return { type: "iframe", src: url };
  }

  return { type: "link" };
}
