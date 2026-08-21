// Reads teb-sanat's official Aparat channel via its public RSS feed
// (https://www.aparat.com/rss/tebosanat) — the only source this sync uses,
// per requirement: never guess or use unofficial channels/videos.
//
// The feed is a small, regular RSS 2.0 document (CDATA title/description),
// so a couple of targeted regexes are enough — no need for a full XML
// parser dependency for this one, narrow shape.

const CHANNEL_USERNAME = 'tebosanat';
const RSS_URL = `https://www.aparat.com/rss/${CHANNEL_USERNAME}`;
const USER_AGENT =
  'FarajiMedicalStoreVideoSync/1.0 (+https://aparat.com/tebosanat official channel RSS, low-volume)';

export interface AparatVideo {
  title: string;
  url: string;
  description: string;
}

const ENTITY_MAP: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  quot: '"',
  apos: "'",
  '#39': "'",
  lt: '<',
  gt: '>',
  zwnj: '‌',
};

// The feed appears to double-encode entities inside its CDATA blocks (e.g.
// literal "&amp;zwnj;" instead of a real ZWNJ character), so decode twice.
function decodeEntities(text: string): string {
  const once = text.replace(/&(#?\w+);/g, (match, entity: string) => {
    if (entity in ENTITY_MAP) return ENTITY_MAP[entity];
    if (/^#\d+$/.test(entity))
      return String.fromCodePoint(Number(entity.slice(1)));
    return match;
  });
  return once.replace(/&(#?\w+);/g, (match, entity: string) => {
    if (entity in ENTITY_MAP) return ENTITY_MAP[entity];
    if (/^#\d+$/.test(entity))
      return String.fromCodePoint(Number(entity.slice(1)));
    return match;
  });
}

function extractCdataField(itemXml: string, tag: string): string {
  const match = itemXml.match(
    new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`),
  );
  if (match) return decodeEntities(match[1]).trim();
  const plain = itemXml.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`));
  return plain ? decodeEntities(plain[1]).trim() : '';
}

export function parseAparatRss(xml: string): AparatVideo[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
    (match) => match[1],
  );
  return items
    .map((item) => ({
      title: extractCdataField(item, 'title'),
      url: extractCdataField(item, 'link'),
      description: extractCdataField(item, 'description'),
    }))
    .filter((video) => video.title && video.url);
}

export async function fetchAparatChannelVideos(): Promise<AparatVideo[]> {
  const response = await fetch(RSS_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml' },
  });
  if (!response.ok) {
    throw new Error(`Aparat RSS request failed: HTTP ${response.status}`);
  }
  const xml = await response.text();
  return parseAparatRss(xml);
}
