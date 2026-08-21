import sharp from 'sharp';

export interface ProcessedImageVariant {
  name: 'card' | 'detail';
  buffer: Buffer;
  contentType: 'image/webp';
}

// Pads (never crops) to a 1:1 canvas on a white background, then encodes
// to WebP at two standard sizes. White padding keeps product photography
// legible for medical-support products, which are rarely shot pre-cropped
// to a square by the source site.
async function toSquareWebp(source: Buffer, size: number): Promise<Buffer> {
  return sharp(source)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .webp({ quality: 82 })
    .toBuffer();
}

export async function processProductImage(
  source: Buffer,
): Promise<ProcessedImageVariant[]> {
  const [card, detail] = await Promise.all([
    toSquareWebp(source, 500),
    toSquareWebp(source, 1000),
  ]);

  return [
    { name: 'card', buffer: card, contentType: 'image/webp' },
    { name: 'detail', buffer: detail, contentType: 'image/webp' },
  ];
}
